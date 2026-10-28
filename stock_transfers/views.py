from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import StockTransfer
from .serializers import (
    StockTransferCreateSerializer,
    StockTransferSerializer,
)
from .services import StockTransferService


class StockTransferViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        transfers = StockTransfer.objects.all().order_by("-created_at")

        serializer = StockTransferSerializer(
            transfers,
            many=True
        )

        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        transfer = get_object_or_404(
            StockTransfer,
            pk=pk
        )

        serializer = StockTransferSerializer(
            transfer
        )

        return Response(serializer.data)

    def create(self, request):
        serializer = StockTransferCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        execute_immediately = serializer.validated_data.pop(
            "execute",
            False
        )

        transfer = StockTransferService.create_transfer(
            validated_data=serializer.validated_data,
            user=request.user,
            execute_immediately=execute_immediately
        )

        output_serializer = StockTransferSerializer(
            transfer
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, pk=None):
        transfer = get_object_or_404(
            StockTransfer,
            pk=pk
        )

        serializer = StockTransferCreateSerializer(
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        transfer = StockTransferService.update_transfer(
            transfer=transfer,
            validated_data=serializer.validated_data
        )

        output_serializer = StockTransferSerializer(
            transfer
        )

        return Response(
            output_serializer.data
        )

    def destroy(self, request, pk=None):
        transfer = get_object_or_404(
            StockTransfer,
            pk=pk
        )

        StockTransferService.delete_transfer(
            transfer
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="execute"
    )
    def execute(self, request, pk=None):
        transfer = get_object_or_404(
            StockTransfer,
            pk=pk
        )

        transfer = StockTransferService.execute_transfer(
            transfer
        )

        serializer = StockTransferSerializer(
            transfer
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )