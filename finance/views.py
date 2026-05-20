from rest_framework import viewsets
from .models import ExchangeRate
from .serializers import ExchangeRateSerializer

class ExchangeRateViewSet(viewsets.ModelViewSet):
    queryset = ExchangeRate.objects.all().order_by('-rate_date')
    serializer_class = ExchangeRateSerializer