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

from django.db.models import F, Min, Max, Count, Sum, DecimalField, ExpressionWrapper
from django.utils.dateparse import parse_date


@api_view(["GET"])
def sales_average_price_report(request):
    item_id = request.GET.get("item")
    customer_id = request.GET.get("customer")
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")

    queryset = (
        SalesInvoiceItem.objects
        .select_related("item", "invoice", "invoice__customer")
        .filter(invoice__is_applied=True)
    )

    # فلترة حسب المادة
    if item_id:
        queryset = queryset.filter(item_id=item_id)

    # فلترة حسب الزبون
    if customer_id:
        queryset = queryset.filter(
            invoice__customer_id=customer_id
        )

    # فلترة من تاريخ
    if date_from:
        parsed_from = parse_date(date_from)

        if not parsed_from:
            return Response(
                {"detail": "Invalid date_from"},
                status=400
            )

        queryset = queryset.filter(
            invoice__invoice_date__date__gte=parsed_from
        )

    # فلترة إلى تاريخ
    if date_to:
        parsed_to = parse_date(date_to)

        if not parsed_to:
            return Response(
                {"detail": "Invalid date_to"},
                status=400
            )

        queryset = queryset.filter(
            invoice__invoice_date__date__lte=parsed_to
        )

    queryset = queryset.annotate(
        total_line_usd=ExpressionWrapper(
            F("quantity") * F("unit_price_usd"),
            output_field=DecimalField(
                max_digits=28,
                decimal_places=4
            )
        ),
        total_line_syp=ExpressionWrapper(
            F("quantity") * F("unit_price_syp"),
            output_field=DecimalField(
                max_digits=28,
                decimal_places=4
            )
        ),
    )

    rows = (
        queryset
        .values(
            "item_id",
            "item__name"
        )
        .annotate(
            total_quantity=Sum("quantity"),
            total_sales_usd=Sum("total_line_usd"),
            total_sales_syp=Sum("total_line_syp"),

            min_price_usd=Min("unit_price_usd"),
            max_price_usd=Max("unit_price_usd"),

            min_price_syp=Min("unit_price_syp"),
            max_price_syp=Max("unit_price_syp"),

            invoice_count=Count(
                "invoice_id",
                distinct=True
            ),
        )
        .order_by("item__name")
    )

    result = []

    for row in rows:
        quantity = row["total_quantity"] or 0
        total_usd = row["total_sales_usd"] or 0
        total_syp = row["total_sales_syp"] or 0

        result.append({
            "item_id": row["item_id"],
            "item_name": row["item__name"],

            "total_quantity": quantity,

            "average_price_usd":
                total_usd / quantity
                if quantity else 0,

            "average_price_syp":
                total_syp / quantity
                if quantity else 0,

            "min_price_usd":
                row["min_price_usd"] or 0,

            "max_price_usd":
                row["max_price_usd"] or 0,

            "min_price_syp":
                row["min_price_syp"] or 0,

            "max_price_syp":
                row["max_price_syp"] or 0,

            "invoice_count":
                row["invoice_count"],
        })

    return Response(result)