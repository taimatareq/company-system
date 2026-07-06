from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    SalesInvoiceViewSet,
    sales_invoice_print,
    SalesRepresentativeViewSet,
    warehouse_items,
    top_selling_items,
    monthly_sales_trend,
    receivables_payables,
    SalesPaymentViewSet,
    sales_payment_receipt_print,
)

router = DefaultRouter()

router.register(
    r"sales-invoices",
    SalesInvoiceViewSet
)

router.register(
    r"sales-representatives",
    SalesRepresentativeViewSet
)
router.register(
    r"sales-payments",
    SalesPaymentViewSet
)
urlpatterns = [

    path(
        "warehouse-items/",
        warehouse_items,
        name="warehouse_items"
    ),

    path(
        "sales-invoices/<int:invoice_id>/print/",
        sales_invoice_print,
        name="sales_invoice_print"
    ),
    path(
    "top-selling-items/",
    top_selling_items,
    name="top_selling_items"
),
    path(
    "monthly-sales-trend/",
    monthly_sales_trend
    ),
    path(
    "receivables-payables/",
    receivables_payables
),
path(
    "sales-payments/<int:payment_id>/receipt/",
    sales_payment_receipt_print,
    name="sales_payment_receipt_print"
),
path(
    "receivables-payables/",
    receivables_payables
),
]

urlpatterns += router.urls