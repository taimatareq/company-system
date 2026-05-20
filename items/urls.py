from rest_framework.routers import DefaultRouter
from .views import ItemViewSet
from .views import item_price, item_purchase_price
router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='items')

from django.urls import path
from .views import item_price

urlpatterns = [
    path("items/price/", item_price, name="item_price"),
    path("items/purchase-price/", item_purchase_price, name="item_purchase_price"),
]
urlpatterns += router.urls
