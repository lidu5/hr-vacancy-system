# candidates/admin.py
from django.contrib import admin
from .models import Candidate, Application, ApplicationStatusHistory, Interview

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'phone', 'created_at')
    search_fields = ('full_name', 'email')

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'vacancy', 'status', 'applied_at')
    list_filter = ('status', 'vacancy')
    search_fields = ('candidate__full_name', 'candidate__email')

admin.site.register(ApplicationStatusHistory)
admin.site.register(Interview)