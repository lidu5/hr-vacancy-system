# candidates/models.py
from django.conf import settings
import uuid
from django.db import models
from vacancies.models import Vacancy

class Candidate(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    state = models.CharField(max_length=100)
    zone = models.CharField(max_length=100, blank=True)
    woreda = models.CharField(max_length=100, blank=True)
    kebele = models.CharField(max_length=100, blank=True)
    house_number = models.CharField(max_length=50, blank=True)
    is_available = models.BooleanField(default=True)
    reference_name = models.CharField(max_length=200, blank=True)
    reference_phone = models.CharField(max_length=20, blank=True)
    reference_address = models.TextField(blank=True)
    education_history = models.JSONField(blank=True, null=True, help_text="List of education entries (most recent first)")
    training_history=models.JSONField(blank=True, null=True, help_text="List of training entries (most recent first)")
    resume = models.FileField(upload_to='resumes/%Y/%m/')
    education_documents = models.FileField(upload_to='education_documents/%Y/%m/', blank=True, null=True)
    other_documents = models.FileField(upload_to='other_documents/%Y/%m/', blank=True, null=True)
    skills = models.TextField(blank=True, help_text="Comma-separated skills")
    years_of_experience = models.PositiveIntegerField(null=True, blank=True)
    linkedin_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['email'])]

    def __str__(self):
        return f"{self.full_name} ({self.email})"


class Application(models.Model):
    STATUS_CHOICES = (
        ('applied', 'Applied'),
        ('shortlisted', 'Shortlisted'),
        ('interview', 'Interview'),
        ('offer', 'Offer'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
    )

    reference_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='applications')
    vacancy = models.ForeignKey(Vacancy, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-applied_at']
        unique_together = ('candidate', 'vacancy')  # prevent duplicate applications
        indexes = [models.Index(fields=['status'])]

    def __str__(self):
        return f"{self.candidate.full_name} → {self.vacancy.title} ({self.status})"
# candidates/models.py (add this)
class ApplicationStatusHistory(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Application.STATUS_CHOICES)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.application} → {self.status} at {self.changed_at}"
# candidates/models.py (add this)
class Interview(models.Model):
    MODE_CHOICES = (
        ('online', 'Online'),
        ('in_person', 'In Person'),
    )
    RESULT_CHOICES = (
        ('pending', 'Pending'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
    )

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    interviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    scheduled_at = models.DateTimeField()
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='online')
    location_or_link = models.CharField(max_length=255, blank=True)
    round_number = models.PositiveIntegerField(default=1)

    feedback = models.TextField(blank=True)
    score = models.PositiveIntegerField(null=True, blank=True, help_text="Score out of 10")
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Round {self.round_number} - {self.application.candidate.full_name}"