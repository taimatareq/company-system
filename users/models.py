from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    profile_image = models.ImageField(
        upload_to="profile_images/",
        blank=True,
        null=True
    )

    google_picture_url = models.URLField(
        blank=True,
        null=True
    )

    phone = models.CharField(
        max_length=30,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )
    auth_provider = models.CharField(
    max_length=20,
    choices=[
        ("local", "Local"),
        ("google", "Google"),
    ],
    default="local",
    )

    def __str__(self):
        return self.user.username


class EmailVerificationCode(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="email_codes"
    )

    code = models.CharField(max_length=6)

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.code}"