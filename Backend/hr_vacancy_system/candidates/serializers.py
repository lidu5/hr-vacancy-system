from rest_framework import serializers
from .models import Candidate, Application, Interview, ApplicationStatusHistory
from vacancies.serializers import VacancyListSerializer


class CandidateSerializer(serializers.ModelSerializer):
    """Serializer for candidate profiles"""
    class Meta:
        model = Candidate
        fields = [
            'id', 'full_name', 'email', 'phone', 'state', 'zone',
            'woreda', 'kebele', 'house_number', 'is_available',
            'reference_name', 'reference_phone', 'reference_address',
            'education_history', 'training_history', 'resume', 'education_documents',
            'other_documents', 'skills', 'years_of_experience',
            'linkedin_url', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ApplicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing applications"""
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    vacancy_title = serializers.CharField(source='vacancy.title', read_only=True)
    vacancy_department = serializers.CharField(source='vacancy.department', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'reference_code', 'candidate_name', 'candidate_email',
            'vacancy_title', 'vacancy_department', 'status',
            'applied_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reference_code', 'applied_at', 'updated_at']


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for application with full candidate and vacancy info"""
    candidate = CandidateSerializer(read_only=True)
    vacancy = VacancyListSerializer(read_only=True)
    interview_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'reference_code', 'candidate', 'vacancy', 'status',
            'applied_at', 'updated_at', 'interview_count'
        ]
        read_only_fields = ['id', 'reference_code', 'applied_at', 'updated_at']
    
    def get_interview_count(self, obj):
        return obj.interviews.count()


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new applications (public job application)"""
    # Flatten candidate fields for easier multipart/form-data handling
    full_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    phone = serializers.CharField(write_only=True)
    state = serializers.CharField(write_only=True)
    zone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    woreda = serializers.CharField(write_only=True, required=False, allow_blank=True)
    kebele = serializers.CharField(write_only=True, required=False, allow_blank=True)
    house_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    is_available = serializers.BooleanField(write_only=True, required=False, default=True)
    reference_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    reference_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    reference_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    education_history = serializers.JSONField(write_only=True, required=False)
    training_history = serializers.JSONField(write_only=True, required=False)
    resume = serializers.FileField(write_only=True, required=False)
    education_documents = serializers.FileField(write_only=True, required=False)
    other_documents = serializers.FileField(write_only=True, required=False)
    
    class Meta:
        model = Application
        fields = ['vacancy', 'full_name', 'email', 'phone', 'state', 'zone', 'woreda', 'kebele', 'house_number', 'is_available', 'reference_name', 'reference_phone', 'reference_address', 'education_history', 'training_history', 'resume', 'education_documents', 'other_documents']
    
    def create(self, validated_data):
        # Extract candidate fields
        candidate_data = {
            'full_name': validated_data.pop('full_name'),
            'email': validated_data.pop('email'),
            'phone': validated_data.pop('phone'),
            'state': validated_data.pop('state'),
            'zone': validated_data.pop('zone', ''),
            'woreda': validated_data.pop('woreda', ''),
            'kebele': validated_data.pop('kebele', ''),
            'house_number': validated_data.pop('house_number', ''),
            'is_available': validated_data.pop('is_available', True),
            'reference_name': validated_data.pop('reference_name', ''),
            'reference_phone': validated_data.pop('reference_phone', ''),
            'reference_address': validated_data.pop('reference_address', ''),
            'education_history': validated_data.pop('education_history', None),
            'training_history': validated_data.pop('training_history', None),
        }
        
        # Handle optional resume
        if 'resume' in validated_data:
            candidate_data['resume'] = validated_data.pop('resume')
        
        # Handle optional education documents
        if 'education_documents' in validated_data:
            candidate_data['education_documents'] = validated_data.pop('education_documents')
        
        # Handle optional other documents
        if 'other_documents' in validated_data:
            candidate_data['other_documents'] = validated_data.pop('other_documents')
        
        # Check if candidate with this email already exists
        candidate, created = Candidate.objects.get_or_create(
            email=candidate_data['email'],
            defaults=candidate_data
        )
        
        # Update candidate if exists and new data provided
        if not created:
            updated = False
            if 'resume' in candidate_data:
                candidate.resume = candidate_data['resume']
                updated = True
            if 'education_documents' in candidate_data:
                candidate.education_documents = candidate_data['education_documents']
                updated = True
            if 'other_documents' in candidate_data:
                candidate.other_documents = candidate_data['other_documents']
                updated = True
            if updated:
                candidate.save()
        
        # Check if application already exists for this candidate and vacancy
        existing_application = Application.objects.filter(
            candidate=candidate,
            vacancy=validated_data['vacancy']
        ).first()
        
        if existing_application:
            raise serializers.ValidationError({
                'detail': 'You have already applied for this position. Duplicate applications are not allowed.'
            })
        
        # Create the application
        application = Application.objects.create(
            candidate=candidate,
            vacancy=validated_data['vacancy']
        )
        
        return application


class InterviewSerializer(serializers.ModelSerializer):
    """Serializer for interview scheduling"""
    interviewer_name = serializers.CharField(source='interviewer.username', read_only=True)
    candidate_name = serializers.CharField(source='application.candidate.full_name', read_only=True)
    vacancy_title = serializers.CharField(source='application.vacancy.title', read_only=True)
    
    class Meta:
        model = Interview
        fields = [
            'id', 'application', 'interviewer', 'interviewer_name',
            'candidate_name', 'vacancy_title', 'scheduled_at',
            'mode', 'location_or_link', 'round_number',
            'feedback', 'score', 'result', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'interviewer_name', 'candidate_name', 'vacancy_title']
    
    def validate_score(self, value):
        if value and (value < 0 or value > 10):
            raise serializers.ValidationError("Score must be between 0 and 10")
        return value


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for application status history"""
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = ApplicationStatusHistory
        fields = [
            'id', 'application', 'status', 'changed_by',
            'changed_by_name', 'changed_at', 'notes'
        ]
        read_only_fields = ['id', 'changed_at', 'changed_by_name']