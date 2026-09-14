# from rest_framework.routers import DefaultRouter
# from .views import PurchaseInvoiceViewSet
# from .views import last_purchase_price

# router = DefaultRouter()
# router.register(r'purchase-invoices', PurchaseInvoiceViewSet, basename='purchase-invoices')

# urlpatterns = router.urls
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PurchaseInvoiceViewSet, last_purchase_price, PurchasePaymentViewSet
from .views import (
purchase_payment_receipt_print)
router = DefaultRouter()
router.register(
    r'purchase-invoices',
    PurchaseInvoiceViewSet,
    basename='purchase-invoices'
)
router.register(
    r"purchase-payments",
    PurchasePaymentViewSet,
    basename="purchase-payments"
)
urlpatterns = [
    path(
        "items/<int:item_id>/last-purchase-price/",
        last_purchase_price,
        name="last_purchase_price"
    ),
    path(
    "purchase-payments/<int:payment_id>/receipt/",
    purchase_payment_receipt_print,
    name="purchase_payment_receipt_print"
),
]

urlpatterns += router.urls