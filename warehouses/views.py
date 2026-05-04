from rest_framework import viewsets
from .models import Warehouse
from .serializers import WarehouseSerializer
from rest_framework.permissions import IsAuthenticated

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