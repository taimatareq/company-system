from rest_framework import viewsets
from .models import POSStation
from .serializers import POSStationSerializer
 
class PosViewSet(viewsets.ModelViewSet):
    queryset = POSStation.objects.all()
    serializer_class = POSStationSerializer