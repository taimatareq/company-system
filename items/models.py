from django.db import models
class Item(models.Model):

    name = models.CharField(max_length=100)

    code = models.CharField(max_length=50, unique=True)

    retail_price = models.DecimalField(max_digits=10, decimal_places=2)

    retail_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2)

    wholesale_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):

        return self.name
 