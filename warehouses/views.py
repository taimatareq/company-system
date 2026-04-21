from rest_framework import viewsets
from .models import Warehouse
from .serializers import WarehouseSerializer

class warehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer