
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    SalesReturnViewSet,
    PurchaseReturnViewSet,
)

router = DefaultRouter()

router.register(
    r"sales-returns",
    SalesReturnViewSet,
    basename="sales-return",
)

router.register(
    r"purchase-returns",
    PurchaseReturnViewSet,
    basename="purchase-return",
)

urlpatterns = [
    path("", include(router.urls)),
]
