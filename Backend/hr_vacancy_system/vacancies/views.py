from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Vacancy
from .serializers import VacancyListSerializer, VacancyDetailSerializer
from accounts.permissions import IsAdminOrRecruiter, CanManageVacancy


class VacancyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing vacancies
    - List: GET /api/vacancies/
    - Retrieve: GET /api/vacancies/{id}/
    - Create: POST /api/vacancies/
    - Update: PUT /api/vacancies/{id}/
    - Partial Update: PATCH /api/vacancies/{id}/
    - Delete: DELETE /api/vacancies/{id}/
    """
    queryset = Vacancy.objects.all()
    permission_classes = [IsAdminOrRecruiter]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'department', 'employment_type']
    search_fields = ['title', 'description', 'requirements']
    ordering_fields = ['created_at', 'deadline', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Filter vacancies based on user role:
        - Admins: See all vacancies
        - Recruiters: See only their department's vacancies
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # Skip filtering for public endpoints
        if self.action in ['public_list', 'public_detail']:
            return queryset
        
        # Admins see all vacancies
        if user.role == 'admin':
            return queryset
        
        # Recruiters see only their department's vacancies
        if user.role == 'recruiter' and user.department:
            return queryset.filter(department=user.department)
        
        # Interviewers see all (they need to see vacancies for interviews)
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail views"""
        if self.action == 'list':
            return VacancyListSerializer
        return VacancyDetailSerializer
    
    def get_permissions(self):
        """Allow anyone to view public vacancies, but require auth for modifications"""
        if self.action in ['public_list', 'public_detail']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Auto-set the posted_by field to current user"""
        serializer.save(posted_by=self.request.user)
        
    def check_object_permissions(self, request, obj):
        """Check object-level permissions for update/delete"""
        for permission in [CanManageVacancy()]:
            if not permission.has_object_permission(request, self, obj):
                self.permission_denied(
                    request,
                    message=getattr(permission, 'message', None),
                    code=getattr(permission, 'code', None)
                )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_list(self, request):
        """Public endpoint for job seekers to view open vacancies"""
        from django.utils import timezone
        # Filter by status='open' AND deadline hasn't passed
        vacancies = self.queryset.filter(
            status='open',
            deadline__gte=timezone.now().date()
        )
        serializer = VacancyListSerializer(vacancies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def public_detail(self, request, pk=None):
        """Public endpoint to view a single open vacancy"""
        from django.utils import timezone
        try:
            vacancy = self.queryset.get(
                pk=pk,
                status='open',
                deadline__gte=timezone.now().date()
            )
            serializer = VacancyDetailSerializer(vacancy)
            return Response(serializer.data)
        except Vacancy.DoesNotExist:
            return Response(
                {'error': 'Vacancy not found, not open, or deadline has passed'},
                status=status.HTTP_404_NOT_FOUND
            )