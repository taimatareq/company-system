from rest_framework.routers import DefaultRouter
from .views import PurchaseInvoiceViewSet

router = DefaultRouter()
router.register(r'purchase-invoices', PurchaseInvoiceViewSet, basename='purchase-invoices')

urlpatterns = router.urls