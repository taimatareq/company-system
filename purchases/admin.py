from django.contrib import admin
from .models import PurchaseInvoice, PurchaseInvoiceItem, PurchasePayment

admin.site.register(PurchaseInvoice)
admin.site.register(PurchaseInvoiceItem)
admin.site.register(PurchasePayment)