from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')

urlpatterns = router.urls
from django.urls import path
from .views import item_stock

urlpatterns = [
    path("inventory/item-stock/", item_stock, name="item_stock"),
]