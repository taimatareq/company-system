from django.db import models
from organizations.models import Organization
class ExchangeRate(models.Model):
    rate_date = models.DateField()
    usd_to_syp = models.DecimalField(max_digits=18, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="exchange_rates",
    )
    def __str__(self):
        return f"{self.rate_date} - {self.usd_to_syp}"