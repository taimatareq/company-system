from rest_framework import status, viewsets
from rest_framework.response import Response
from .services import PurchaseService
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import PurchaseInvoice
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import PurchaseInvoiceItem
from .models import PurchasePayment
from .serializers import (
    PurchaseInvoiceSerializer,
    PurchaseInvoiceCreateSerializer,
    PurchasePaymentSerializer,
)
from django.shortcuts import render
from django.db.models import Sum
from rest_framework.decorators import api_view
from purchases.models import PurchaseInvoice

class PurchaseInvoiceViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    def list(self, request):
        invoices = PurchaseInvoice.objects.all().order_by("-id")

        data = []

        for invoice in invoices:
            total_paid = (
                invoice.payments.aggregate(
                    total=Sum("amount")
                )["total"]
                or 0
            )

            data.append({
                "id": invoice.id,
                "invoice_number": f"PI-{invoice.id:04d}",
                "supplier": invoice.supplier.name,
                "warehouse": invoice.warehouse.name,
                "invoice_date": invoice.invoice_date,
                "payment_type": invoice.payment_type,
                "status": invoice.status,
                "total_amount_usd": invoice.total_amount_usd,
                "total_amount_syp": invoice.total_amount_syp,
                "total_paid": total_paid,
                "remaining": invoice.total_amount_usd - total_paid,
            })

        return Response(data)
    def retrieve(self, request, pk=None):
        invoice = PurchaseInvoice.objects.get(pk=pk)
        total_paid = (
            invoice.payments.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        items = []

        for invoice_item in invoice.items.all():
            items.append({
                "id": invoice_item.id,
                "item": invoice_item.item.name,
                "quantity": invoice_item.quantity,
                "unit_cost_usd": invoice_item.unit_cost_usd,
                "unit_cost_syp": invoice_item.unit_cost_syp,
                "total_usd": invoice_item.quantity * invoice_item.unit_cost_usd,
                "total_syp": invoice_item.quantity * invoice_item.unit_cost_syp,
            })

        return Response({
            "id": invoice.id,
            "invoice_number": f"PI-{invoice.id:04d}",
            "branch": invoice.branch.name,
            "warehouse": invoice.warehouse.name,
            "supplier": invoice.supplier.name,
            "invoice_date": invoice.invoice_date,
            "payment_type": invoice.payment_type,
            "status": invoice.status,
            "total_amount_usd": invoice.total_amount_usd,
            "total_amount_syp": invoice.total_amount_syp,
            "items": items,
            "total_paid": total_paid,
            "remaining": invoice.total_amount_usd - total_paid,
        })
    def create(self, request):
        serializer = PurchaseInvoiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        invoice = PurchaseService.create_invoice(
            validated_data=serializer.validated_data,
            user=request.user
        )

        return Response(
            {
                "id": invoice.id,
                "message": "Purchase invoice created successfully"
            },
            status=status.HTTP_201_CREATED
        )

    def update(self, request, pk=None):
        raise ValidationError("Purchase invoices cannot be updated after creation.")

    def partial_update(self, request, pk=None):
        raise ValidationError("Purchase invoices cannot be updated after creation.")

    def destroy(self, request, pk=None):
        raise ValidationError("Purchase invoices cannot be deleted after creation.")
from rest_framework.decorators import api_view
from .models import PurchaseInvoiceItem

from items.models import Item
@api_view(["GET"])
def last_purchase_price(request, item_id):

    last_item = (
        PurchaseInvoiceItem.objects
        .filter(item_id=item_id)
        .order_by("-id")
        .first()
    )

    if last_item:
        return Response({
            "unit_cost_usd": last_item.unit_cost_usd,
            "unit_cost_syp": last_item.unit_cost_syp,
        })

    item = Item.objects.get(pk=item_id)

    return Response({
        "unit_cost_usd": item.retail_price,
        "unit_cost_syp": 0,
    })
class PurchasePaymentViewSet(viewsets.ModelViewSet):
    queryset = PurchasePayment.objects.all().order_by("-payment_date")
    serializer_class = PurchasePaymentSerializer
def purchase_payment_receipt_print(
    request,
    payment_id
):

    payment =PurchasePayment.objects.get(
        pk=payment_id
    )

    invoice =payment.invoice

    total_paid = (

        invoice.payments

        .filter(
            id__lte=
            payment.id
        )

        .aggregate(
            total=
            Sum("amount")
        )["total"]

        or 0

    )

    remaining = (

        invoice.total_amount_usd
        - total_paid

    )

    return render(

        request,

        "receipts/purchase_payment_receipt.html",

        {

            "payment":
            payment,

            "invoice":
            invoice,

            "remaining":
            remaining,

            "total_paid":
            total_paid,

        }

    )
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

from django.db.models import F, Min, Max, Count, DecimalField, ExpressionWrapper
from django.utils.dateparse import parse_date


@api_view(["GET"])
def purchase_average_price_report(request):
    item_id = request.GET.get("item")
    supplier_id = request.GET.get("supplier")
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")

    queryset = (
        PurchaseInvoiceItem.objects
        .select_related("item", "invoice", "invoice__supplier")
        .filter(invoice__is_applied=True)
    )

    # فلترة حسب المادة
    if item_id:
        queryset = queryset.filter(item_id=item_id)

    # فلترة حسب المورد
    if supplier_id:
        queryset = queryset.filter(
            invoice__supplier_id=supplier_id
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
            F("quantity") * F("unit_cost_usd"),
            output_field=DecimalField(
                max_digits=28,
                decimal_places=4
            )
        ),
        total_line_syp=ExpressionWrapper(
            F("quantity") * F("unit_cost_syp"),
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

            total_purchase_usd=Sum(
                "total_line_usd"
            ),

            total_purchase_syp=Sum(
                "total_line_syp"
            ),

            min_price_usd=Min(
                "unit_cost_usd"
            ),

            max_price_usd=Max(
                "unit_cost_usd"
            ),

            min_price_syp=Min(
                "unit_cost_syp"
            ),

            max_price_syp=Max(
                "unit_cost_syp"
            ),

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
        total_usd = row["total_purchase_usd"] or 0
        total_syp = row["total_purchase_syp"] or 0

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