from django.db import models

class Warehouse(models.Model):
    WAREHOUSE_TYPES = [
        ('main', 'Main'),
        ('branch', 'Branch'),
    ]

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=WAREHOUSE_TYPES)
    address = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name