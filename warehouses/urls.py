from rest_framework.routers import DefaultRouter
from .views import warehouseViewSet

router = DefaultRouter()
router.register(r'warehouses', warehouseViewSet)

urlpatterns = router.urls