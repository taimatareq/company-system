from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    InventoryViewSet,
    item_stock,
)

router = DefaultRouter()

router.register(
    r'inventory',
    InventoryViewSet,
    basename='inventory'
)

urlpatterns = router.urls

urlpatterns += [

    path(
        "inventory/item-stock/",
        item_stock,
        name="item_stock"
    ),

]