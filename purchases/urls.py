# from rest_framework.routers import DefaultRouter
# from .views import PurchaseInvoiceViewSet
# from .views import last_purchase_price

# router = DefaultRouter()
# router.register(r'purchase-invoices', PurchaseInvoiceViewSet, basename='purchase-invoices')

# urlpatterns = router.urls
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PurchaseInvoiceViewSet, last_purchase_price

router = DefaultRouter()
router.register(
    r'purchase-invoices',
    PurchaseInvoiceViewSet,
    basename='purchase-invoices'
)

urlpatterns = [
    path(
        "items/<int:item_id>/last-purchase-price/",
        last_purchase_price,
        name="last_purchase_price"
    ),
]

urlpatterns += router.urls