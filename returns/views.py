
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import SalesReturn, PurchaseReturn
from .serializers import (
    SalesReturnSerializer,
    PurchaseReturnSerializer,
)
from .services import (
    confirm_sales_return,
    confirm_purchase_return,
)


class BaseReturnViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        with transaction.atomic():
            locked_instance = (
                self.get_queryset()
                .select_for_update()
                .get(pk=instance.pk)
            )

            if locked_instance.status != "draft":
                raise ValidationError(
                    "Only draft returns can be deleted."
                )

            locked_instance.delete()

    def perform_update(self, serializer):
        with transaction.atomic():
            instance = (
                self.get_queryset()
                .select_for_update()
                .get(pk=serializer.instance.pk)
            )

            if instance.status != "draft":
                raise ValidationError(
                    "Only draft returns can be modified."
                )

            serializer.instance = instance
            serializer.save()


class SalesReturnViewSet(BaseReturnViewSet):
    queryset = (
        SalesReturn.objects
        .select_related("invoice", "created_by")
        .prefetch_related("items")
        .all()
    )
    serializer_class = SalesReturnSerializer

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        try:
            sales_return = confirm_sales_return(pk)
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages)

        serializer = self.get_serializer(sales_return)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PurchaseReturnViewSet(BaseReturnViewSet):
    queryset = (
        PurchaseReturn.objects
        .select_related("invoice", "created_by")
        .prefetch_related("items")
        .all()
    )
    serializer_class = PurchaseReturnSerializer

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        try:
            purchase_return = confirm_purchase_return(pk)
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages)

        serializer = self.get_serializer(purchase_return)
        return Response(serializer.data, status=status.HTTP_200_OK)
