# candidates/signals.py
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Application, ApplicationStatusHistory

@receiver(pre_save, sender=Application)
def track_status_change(sender, instance, **kwargs):
    if instance.pk:  # only for existing applications, not new ones
        old = Application.objects.get(pk=instance.pk)
        if old.status != instance.status:
            ApplicationStatusHistory.objects.create(
                application=instance,
                status=instance.status,
            )