from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum,Max
from decimal import Decimal

from .models import Inventory
from .serializers import InventorySerializer


class InventoryViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        warehouse_id = request.query_params.get("warehouse")
        item_id = request.query_params.get("item")

        # إذا المستخدم اختار warehouse + item
        if warehouse_id and item_id:
            total = Inventory.objects.filter(
                warehouse_id=warehouse_id,
                item_id=item_id
            ).aggregate(total=Sum('quantity'))['total'] or Decimal("0.00")

            return Response({
                "warehouse": warehouse_id,
                "item": item_id,
                "current_quantity": total
            })

        # إذا ما اختار شي → رجع كل البيانات
        data = Inventory.objects.all()
        serializer = InventorySerializer(data, many=True)

        return Response(serializer.data)