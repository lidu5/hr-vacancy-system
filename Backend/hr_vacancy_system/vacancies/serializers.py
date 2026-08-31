from rest_framework import serializers
from .models import Vacancy
from django.contrib.auth import get_user_model

User = get_user_model()

class VacancyListSerializer(serializers.ModelSerializer):
    """Serializer for listing vacancies (lighter data)"""
    posted_by_name = serializers.CharField(source='posted_by.username', read_only=True)
    is_open = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Vacancy
        fields = [
            'id', 'title', 'department', 'location', 'employment_type',
            'workplace_type', 'experience_level', 'category',
            'status', 'positions_available', 'deadline', 'posted_by_name',
            'is_open', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'posted_by_name', 'is_open']


class VacancyDetailSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating/viewing vacancy details"""
    posted_by_name = serializers.CharField(source='posted_by.username', read_only=True)
    application_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Vacancy
        fields = [
            'id', 'title', 'department', 'location', 'employment_type',
            'workplace_type', 'experience_level', 'category',
            'description', 'requirements', 'responsibilities',
            'min_salary', 'max_salary', 'positions_available', 'status',
            'deadline', 'posted_by', 'posted_by_name', 'application_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'posted_by', 'created_at', 'updated_at', 'posted_by_name']
    
    def get_application_count(self, obj):
        return obj.applications.count()
    
    def validate(self, data):
        """Validate salary range"""
        min_sal = data.get('min_salary')
        max_sal = data.get('max_salary')
        
        if min_sal and max_sal and min_sal > max_sal:
            raise serializers.ValidationError({
                'min_salary': 'Minimum salary cannot be greater than maximum salary'
            })
        
        return data