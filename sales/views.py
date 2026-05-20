from django.shortcuts import render
from rest_framework import viewsets
from .models import SalesInvoice
from .serializers import SalesInvoiceSerializer
from .models import SalesRepresentative
from .serializers import SalesRepresentativeSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from inventory.models import Inventory
from inventory.services import get_latest_quantity
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
from rest_framework.decorators import api_view
from rest_framework.response import Response

from inventory.models import Inventory
from inventory.services import get_latest_quantity


@api_view(["GET"])
def warehouse_items(request):
    warehouse_id = request.GET.get("warehouse")

    if not warehouse_id:
        return Response([])

    item_ids = (
        Inventory.objects
        .filter(warehouse_id=warehouse_id)
        .values_list("item_id", flat=True)
        .distinct()
    )

    data = []

    for item_id in item_ids:
        quantity = get_latest_quantity(
            warehouse_id=warehouse_id,
            item_id=item_id
        )

        if quantity > 0:
            last_record = (
                Inventory.objects
                .filter(
                    warehouse_id=warehouse_id,
                    item_id=item_id
                )
                .order_by("-operation_date", "-id")
                .first()
            )

            data.append({
                "id": last_record.item.id,
                "name": last_record.item.name,
                "retail_price": last_record.item.retail_price,
                "available_quantity": quantity,
            })

    return Response(data)
