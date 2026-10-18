from rest_framework.routers import DefaultRouter

from .views import StockTransferViewSet


router = DefaultRouter()

router.register(
    r"stock-transfers",
    StockTransferViewSet,
    basename="stock-transfer"
)

urlpatterns = router.urls