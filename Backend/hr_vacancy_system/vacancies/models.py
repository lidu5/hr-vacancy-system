# vacancies/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator

class Vacancy(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('on_hold', 'On Hold'),
        ('closed', 'Closed'),
        ('filled', 'Filled'),
    )
    EMPLOYMENT_TYPE_CHOICES = (
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    )
    WORKPLACE_TYPE_CHOICES = (
        ('on_site', 'On-site'),
        ('remote', 'Remote'),
        ('hybrid', 'Hybrid'),
    )
    EXPERIENCE_LEVEL_CHOICES = (
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior'),
        ('lead', 'Lead/Manager'),
    )
    CATEGORY_CHOICES = (
        ('software', 'Software Development'),
        ('project_management', 'Project Management'),
        ('data', 'Data & Analytics'),
        ('design', 'Design & UX'),
        ('marketing', 'Marketing'),
        ('sales', 'Sales'),
        ('hr', 'Human Resources'),
        ('finance', 'Finance & Accounting'),
        ('operations', 'Operations'),
        ('customer_service', 'Customer Service'),
        ('engineering', 'Engineering'),
        ('other', 'Other'),
    )

    title = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    workplace_type = models.CharField(max_length=20, choices=WORKPLACE_TYPE_CHOICES, default='on_site')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES, default='entry')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')

    description = models.TextField()
    requirements = models.TextField()
    responsibilities = models.TextField(blank=True)

    min_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    positions_available = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='vacancies_posted'
    )
    deadline = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['department']),
        ]

    def __str__(self):
        return f"{self.title} ({self.department})"

    @property
    def is_open(self):
        from django.utils import timezone
        return self.status == 'open' and self.deadline >= timezone.now().date()