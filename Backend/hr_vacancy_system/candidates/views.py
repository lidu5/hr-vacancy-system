from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Candidate, Application, Interview, ApplicationStatusHistory
from accounts.permissions import IsAdminOrRecruiter, CanManageApplication
from .serializers import (
    CandidateSerializer, ApplicationListSerializer, ApplicationDetailSerializer,
    ApplicationCreateSerializer, InterviewSerializer, ApplicationStatusHistorySerializer
)


class CandidateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing candidates
    - Create: Public (for job applications)
    - Other actions: Authenticated HR staff only
    """
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'email', 'skills']
    ordering_fields = ['created_at', 'full_name']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """Allow public candidate creation for job applications"""
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing applications
    """
    queryset = Application.objects.select_related('candidate', 'vacancy').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'vacancy', 'vacancy__department']
    search_fields = ['candidate__full_name', 'candidate__email', 'vacancy__title']
    ordering_fields = ['applied_at', 'updated_at']
    ordering = ['-applied_at']
    
    def get_queryset(self):
        """
        Filter applications based on user role:
        - Admins: See all applications
        - Recruiters: See only applications for their department's vacancies
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # Skip filtering for public create action
        if self.action == 'create':
            return queryset
        
        # Admins see all applications
        if user.role == 'admin':
            return queryset
        
        # Recruiters see only applications for their department's vacancies
        if user.role == 'recruiter' and user.department:
            return queryset.filter(vacancy__department=user.department)
        
        # Interviewers see all (they need to see applications for interviews)
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ApplicationListSerializer
        elif self.action == 'create':
            return ApplicationCreateSerializer
        return ApplicationDetailSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminOrRecruiter()]
    
    def create(self, request, *args, **kwargs):
        """Create application with deadline validation"""
        from django.utils import timezone
        from vacancies.models import Vacancy
        
        # Get vacancy ID from request
        vacancy_id = request.data.get('vacancy')
        if not vacancy_id:
            return Response(
                {'error': 'Vacancy ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if vacancy exists and is still open
        try:
            vacancy = Vacancy.objects.get(pk=vacancy_id)
            
            # Check if deadline has passed
            if vacancy.deadline < timezone.now().date():
                return Response(
                    {'error': 'Application deadline has passed for this vacancy'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if vacancy is open
            if vacancy.status != 'open':
                return Response(
                    {'error': 'This vacancy is no longer accepting applications'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Vacancy.DoesNotExist:
            return Response(
                {'error': 'Vacancy not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Proceed with normal creation
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update application status and log the change"""
        application = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if new_status not in dict(Application.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status
        old_status = application.status
        application.status = new_status
        application.save()
        
        # Log the change
        ApplicationStatusHistory.objects.create(
            application=application,
            status=new_status,
            changed_by=request.user,
            notes=notes
        )
        
        return Response({
            'message': f'Status updated from {old_status} to {new_status}',
            'status': new_status
        })
    
    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """Get status change history for an application"""
        application = self.get_object()
        history = application.status_history.all()
        serializer = ApplicationStatusHistorySerializer(history, many=True)
        return Response(serializer.data)


class InterviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing interviews
    """
    queryset = Interview.objects.select_related('application', 'interviewer').all()
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['result', 'mode', 'interviewer']
    ordering_fields = ['scheduled_at', 'created_at']
    ordering = ['scheduled_at']
    
    def get_queryset(self):
        """
        Filter interviews based on user role:
        - Admins: See all interviews
        - Recruiters: See only interviews for their department's vacancies
        - Interviewers: See all interviews (they may be assigned across departments)
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admins and interviewers see all interviews
        if user.role in ['admin', 'interviewer']:
            return queryset
        
        # Recruiters see only interviews for their department's vacancies
        if user.role == 'recruiter' and user.department:
            return queryset.filter(application__vacancy__department=user.department)
        
        return queryset
    
    def perform_create(self, serializer):
        """Auto-set the interviewer if not provided"""
        if not serializer.validated_data.get('interviewer'):
            serializer.save(interviewer=self.request.user)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def my_interviews(self, request):
        """Get interviews assigned to current user"""
        interviews = self.queryset.filter(interviewer=request.user)
        serializer = self.get_serializer(interviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def submit_feedback(self, request, pk=None):
        """Submit interview feedback and score"""
        interview = self.get_object()
        
        feedback = request.data.get('feedback')
        score = request.data.get('score')
        result = request.data.get('result')
        
        if feedback:
            interview.feedback = feedback
        if score is not None:
            interview.score = score
        if result:
            interview.result = result
        
        interview.save()
        
        serializer = self.get_serializer(interview)
        return Response(serializer.data)