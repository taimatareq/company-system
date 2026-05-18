from django.shortcuts import render
from rest_framework import viewsets
from .models import SalesInvoice
from .serializers import SalesInvoiceSerializer
from .models import SalesRepresentative
from .serializers import SalesRepresentativeSerializer

class SalesInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SalesInvoice.objects.all().order_by('-id')
    serializer_class = SalesInvoiceSerializer


from django.shortcuts import render
from .models import SalesInvoice


def sales_invoice_print(request, invoice_id):
    invoice = SalesInvoice.objects.get(pk=invoice_id)
    return render(request, "invoices/sales_invoice_print.html", {
        "invoice": invoice
    })
class SalesRepresentativeViewSet(viewsets.ModelViewSet):
    queryset = SalesRepresentative.objects.filter(is_active=True)
    serializer_class = SalesRepresentativeSerializer