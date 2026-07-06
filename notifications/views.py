from django.shortcuts import render

# Create your views here.
from decimal import Decimal

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum

from sales.models import SalesInvoice
from purchases.models import PurchaseInvoice
from inventory.models import Inventory


@api_view(["GET"])
def notifications_summary(request):
    customer_debts = 0

    for invoice in SalesInvoice.objects.all():
        paid = (
            invoice.payments.aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        remaining = invoice.total_amount_usd - paid

        if remaining > 0:
            customer_debts += 1

    supplier_debts = 0

    for invoice in PurchaseInvoice.objects.all():
        paid = (
            invoice.payments.aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        remaining = invoice.total_amount_usd - paid

        if remaining > 0:
            supplier_debts += 1

    out_of_stock = 0

    latest_records = {}

    for record in Inventory.objects.all().order_by("warehouse_id", "item_id", "-operation_date", "-id"):
        key = (record.warehouse_id, record.item_id)

        if key not in latest_records:
            latest_records[key] = record

    for record in latest_records.values():
        if record.quantity <= 0:
            out_of_stock += 1

    total = customer_debts + supplier_debts + out_of_stock
    # total = 0

    # if customer_debts > 0:
    #     total += 1

    # if supplier_debts > 0:
    #     total += 1

    # if out_of_stock > 0:
    #     total += 1
    return Response({
        "total": total,
        "customer_debts": customer_debts,
        "supplier_debts": supplier_debts,
        "out_of_stock": out_of_stock,
    })