from rest_framework import viewsets

from .models import CashBox, CashBoxTransaction
from .serializers import (
    CashBoxSerializer,
    CashBoxTransactionSerializer,
)


class CashBoxViewSet(viewsets.ModelViewSet):
    serializer_class = CashBoxSerializer

    def get_queryset(self):
        queryset = CashBox.objects.all()

        branch = self.request.query_params.get("branch")

        if branch:
            queryset = queryset.filter(branch_id=branch)

        return queryset.order_by("-id")


class CashBoxTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CashBoxTransactionSerializer

    def get_queryset(self):
        queryset = CashBoxTransaction.objects.select_related(
            "cash_box"
        )

        cash_box = self.request.query_params.get("cash_box")

        if cash_box:
            queryset = queryset.filter(
                cash_box_id=cash_box
            )

        return queryset.order_by("-created_at")