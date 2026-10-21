from rest_framework.routers import DefaultRouter

from .views import (
    CashBoxViewSet,
    CashBoxTransactionViewSet,
)

router = DefaultRouter()

router.register(
    r"cashboxes",
    CashBoxViewSet,
    basename="cashbox"
)

router.register(
    r"cashbox-transactions",
    CashBoxTransactionViewSet,
    basename="cashbox-transaction"
)

urlpatterns = router.urls