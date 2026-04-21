from rest_framework import viewsets
from .models import CashBox
from .serializers import CashBoxSerializer
 
class CashBoxViewSet(viewsets.ModelViewSet):
    queryset = CashBox.objects.all()
    serializer_class = CashBoxSerializer