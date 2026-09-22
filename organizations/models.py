from django.db import models
from django.contrib.auth.models import User


class Organization(models.Model):
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class OrganizationMembership(models.Model):
    ROLE_CHOICES = [
        ("company_admin", "Company Admin"),
        ("user", "User"),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="organization_membership",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="user",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.organization.name} - {self.role}"