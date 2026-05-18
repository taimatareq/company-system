from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SalesInvoiceViewSet, sales_invoice_print, SalesRepresentativeViewSet


router = DefaultRouter()
router.register(r"sales-invoices", SalesInvoiceViewSet)
router.register(r"sales-representatives", SalesRepresentativeViewSet)
urlpatterns = [
    path(
        "sales-invoices/<int:invoice_id>/print/",
        sales_invoice_print,
        name="sales_invoice_print"
    ),
]

urlpatterns += router.urls