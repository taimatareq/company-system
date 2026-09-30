from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ItemViewSet,
    item_price,
    item_purchase_price,
    item_by_barcode,
)


router = DefaultRouter()

router.register(
    r"items",
    ItemViewSet,
    basename="items"
)


urlpatterns = [
    path(
        "items/price/",
        item_price,
        name="item_price"
    ),

    path(
        "items/purchase-price/",
        item_purchase_price,
        name="item_purchase_price"
    ),

    path(
        "items/by-barcode/",
        item_by_barcode,
        name="item_by_barcode"
    ),
]

urlpatterns += router.urls