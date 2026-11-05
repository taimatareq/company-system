from django.conf import settings
from django.db import models

from organizations.models import Organization


class AuditLog(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="audit_logs",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    module = models.CharField(
        max_length=100,
    )

    action = models.CharField(
        max_length=50,
    )

    object_type = models.CharField(
        max_length=100,
    )

    object_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )

    description = models.TextField(
        blank=True,
    )

    old_values = models.JSONField(
        default=dict,
        blank=True,
    )

    new_values = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(
                fields=["organization", "created_at"],
                name="audit_org_date_idx",
            ),
            models.Index(
                fields=["module", "action"],
                name="audit_module_action_idx",
            ),
        ]

    def __str__(self):
        username = self.user.username if self.user else "Unknown user"

        return (
            f"{username} - "
            f"{self.module} - "
            f"{self.action} - "
            f"{self.created_at}"
        )