from rest_framework import viewsets
from .models import Warehouse
from .serializers import WarehouseSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Warehouse

class warehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        queryset = super().get_queryset()
        branch_id = self.request.query_params.get("branch")

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        return queryset


@api_view(["GET"])
def branch_warehouses(request):
    branch_id = request.GET.get("branch")

    warehouses = Warehouse.objects.filter(branch_id=branch_id)

    data = [
        {
            "id": warehouse.id,
            "name": warehouse.name
        }
        for warehouse in warehouses
    ]

    return Response(data)