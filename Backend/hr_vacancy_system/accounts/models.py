from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('recruiter', 'Recruiter'),
        ('interviewer', 'Interviewer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='recruiter')
    department = models.CharField(max_length=100, blank=True)