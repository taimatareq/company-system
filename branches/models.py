from django.db import models
from organizations.models import Organization
class Branch(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="branches",
    )
    def __str__(self):
        return self.name