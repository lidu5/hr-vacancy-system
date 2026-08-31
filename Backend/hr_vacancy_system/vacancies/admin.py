# vacancies/admin.py
from django.contrib import admin
from .models import Vacancy

@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'status', 'positions_available', 'deadline')
    list_filter = ('status', 'department', 'employment_type')
    search_fields = ('title', 'department')