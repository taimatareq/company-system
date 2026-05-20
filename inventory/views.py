from decimal import Decimal

from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Inventory
from .serializers import InventorySerializer


class InventoryViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        data = Inventory.objects.all().order_by("-operation_date", "-id")
        serializer = InventorySerializer(data, many=True)
        return Response(serializer.data)


def get_status(quantity):
    quantity = Decimal(quantity)

    if quantity <= 0:
        return "out"

    if quantity <= 5:
        return "low"

    return "available"


@api_view(["GET"])
def item_stock(request):
    warehouse_id = request.GET.get("warehouse")
    item_id = request.GET.get("item")

    if not warehouse_id or not item_id:
        return Response({"detail": "warehouse and item are required"}, status=400)

    # كل المستودعات + كل المواد
    if warehouse_id == "all" and item_id == "all":
        result = []

        pairs = Inventory.objects.values(
            "warehouse_id",
            "warehouse__name",
            "item_id",
            "item__name",
        ).distinct()

        for row in pairs:
            last_record = Inventory.objects.filter(
                warehouse_id=row["warehouse_id"],
                item_id=row["item_id"],
            ).order_by("-operation_date", "-id").first()

            quantity = last_record.quantity if last_record else Decimal("0.00")

            result.append({
                "warehouse_name": row["warehouse__name"],
                "item_name": row["item__name"],
                "quantity": quantity,
                "last_date": last_record.operation_date if last_record else None,
                "status": get_status(quantity),
            })

        return Response(result)

    # كل المستودعات + مادة معينة
    if warehouse_id == "all" and item_id != "all":
        result = []

        warehouses = Inventory.objects.filter(
            item_id=item_id
        ).values(
            "warehouse_id",
            "warehouse__name",
        ).distinct()

        for row in warehouses:
            last_record = Inventory.objects.filter(
                warehouse_id=row["warehouse_id"],
                item_id=item_id,
            ).order_by("-operation_date", "-id").first()

            quantity = last_record.quantity if last_record else Decimal("0.00")

            result.append({
                "warehouse_name": row["warehouse__name"],
                "quantity": quantity,
                "last_date": last_record.operation_date if last_record else None,
                "status": get_status(quantity),
            })

        return Response(result)

    # مستودع معين + كل المواد
    if item_id == "all" and warehouse_id != "all":
        result = []

        items = Inventory.objects.filter(
            warehouse_id=warehouse_id
        ).values(
            "item_id",
            "item__name",
        ).distinct()

        for row in items:
            last_record = Inventory.objects.filter(
                warehouse_id=warehouse_id,
                item_id=row["item_id"],
            ).order_by("-operation_date", "-id").first()

            quantity = last_record.quantity if last_record else Decimal("0.00")

            result.append({
                "item_name": row["item__name"],
                "quantity": quantity,
                "last_date": last_record.operation_date if last_record else None,
                "status": get_status(quantity),
            })

        return Response(result)

    # مستودع معين + مادة معينة
    records = Inventory.objects.filter(
        warehouse_id=warehouse_id,
        item_id=item_id,
    ).order_by("-operation_date", "-id")

    last_record = records.first()
    stock = last_record.quantity if last_record else Decimal("0.00")

    previous = records[1] if records.count() > 1 else None

    movement_qty = (
        last_record.quantity - previous.quantity
        if previous and last_record
        else stock
    )

    return Response({
        "stock": stock,
        "last_operation_type": last_record.operation_type if last_record else None,
        "last_operation_date": last_record.operation_date if last_record else None,
        "last_movement_qty": movement_qty,
        "total_movements": records.count(),
        "status": get_status(stock),
    })