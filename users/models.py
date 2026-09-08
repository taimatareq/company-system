from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User


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