from django.db import models

class ExchangeRate(models.Model):
    rate_date = models.DateField()
    usd_to_syp = models.DecimalField(max_digits=18, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.rate_date} - {self.usd_to_syp}"