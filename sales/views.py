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
from django.db.models import Sum
from .models import SalesInvoiceItem
from purchases.models import PurchaseInvoice
from .models import SalesPayment
from .serializers import SalesPaymentSerializer
from items.models import Item

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
class SalesRepresentativeViewSet(
viewsets.ModelViewSet
):

    queryset = (
        SalesRepresentative.objects
        .filter(is_active=True)
        .order_by("-id")
    )

    serializer_class = (
        SalesRepresentativeSerializer
    )
from rest_framework.decorators import api_view
from rest_framework.response import Response

from inventory.models import Inventory
from inventory.services import get_latest_quantity


@api_view(["GET"])
def warehouse_items(request):
    warehouse_id = request.GET.get("warehouse")

    if not warehouse_id:
        return Response([])

    data = []

    item_ids = (
        Inventory.objects
        .filter(warehouse_id=warehouse_id)
        .values_list("item_id", flat=True)
        .distinct()
    )

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
                "item_type": last_record.item.item_type,
            })

    services = Item.objects.filter(
        item_type="service",
        # is_active=True
    )

    for service in services:
        data.append({
            "id": service.id,
            "name": service.name,
            "retail_price": service.retail_price,
            "available_quantity": 0,
            "item_type": "service",
        })

    return Response(data)
@api_view(["GET"])
def top_selling_items(request):

    data = (
        SalesInvoiceItem.objects
        .values("item__name")
        .annotate(total_quantity=Sum("quantity"))
        .order_by("-total_quantity")[:5]
    )

    result = [
        {
            "name": row["item__name"],
            "quantity": row["total_quantity"],
        }
        for row in data
    ]

    return Response(result)
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def monthly_sales_trend(request):

    data = (
        SalesInvoice.objects
        .annotate(
            month=TruncMonth(
                "invoice_date"
            )
        )
        .values("month")
        .annotate(
            total=Sum(
                "total_amount_usd"
            )
        )
        .order_by("month")
    )

    result = [

        {

            "month":
            row["month"].strftime("%b"),

            "total":
            row["total"] or 0

        }

        for row in data

    ]

    return Response(result)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum

@api_view(["GET"])
def receivables_payables(request):

    receivables = (
        SalesInvoice.objects
        .filter(status="unpaid")
        .aggregate(
            total=Sum(
                "total_amount_usd"
            )
        )
    )

    payables = (
        PurchaseInvoice.objects
        .filter(status="unpaid")
        .aggregate(
            total=Sum(
                "total_amount_usd"
            )
        )
    )

    return Response({

        "receivables":

        receivables["total"]
        or 0,

        "payables":

        payables["total"]
        or 0

    })
class SalesPaymentViewSet(
    viewsets.ModelViewSet
):

    queryset = (
        SalesPayment.objects.all()
        .order_by("-payment_date")
    )

    serializer_class = (
        SalesPaymentSerializer
    )
def sales_payment_receipt_print(request, payment_id):
    payment = SalesPayment.objects.get(pk=payment_id)
    invoice = payment.invoice

    total_paid = (
        invoice.payments
        .filter(id__lte=payment.id)
        .aggregate(total=Sum("amount"))["total"]
        or 0
    )

    remaining = invoice.total_amount_usd - total_paid

    return render(request, "receipts/sales_payment_receipt.html", {
        "payment": payment,
        "invoice": invoice,
        "total_paid": total_paid,
        "remaining": remaining,
    })
@api_view(["GET"])
def receivables_payables(request):

    sales_total = 0

    for invoice in SalesInvoice.objects.all():

        paid = (

            invoice.payments.aggregate(
                total=Sum("amount")
            )["total"]

            or 0

        )

        remaining = (
            invoice.total_amount_usd
            - paid
        )

        sales_total += max(
            remaining,
            0
        )

    purchase_total = 0

    for invoice in PurchaseInvoice.objects.all():

        paid = (

            invoice.payments.aggregate(
                total=Sum("amount")
            )["total"]

            or 0

        )

        remaining = (
            invoice.total_amount_usd
            - paid
        )

        purchase_total += max(
            remaining,
            0
        )

    return Response({

        "receivables":
        sales_total,

        "payables":
        purchase_total

    })