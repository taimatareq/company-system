from django.db import models
from organizations.models import Organization
class Item(models.Model):
    ITEM_TYPES = [
    ("product", "Product"),
    ("service", "Service"),
    ]

    item_type = models.CharField(
        max_length=20,
        choices=ITEM_TYPES,
        default="product"
    )
    name = models.CharField(max_length=100)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="items",
    )
    code = models.CharField(
     max_length=50
    )

    barcode = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    retail_price = models.DecimalField(max_digits=10, decimal_places=2)

    retail_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2)

    wholesale_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "code"],
                name="unique_item_code_per_organization",
            ),
            models.UniqueConstraint(
                fields=["organization", "barcode"],
                name="unique_item_barcode_per_organization",
            ),
        ]
    def __str__(self):

        return self.name
 