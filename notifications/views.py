from django.shortcuts import render

# Create your views here.
from decimal import Decimal
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, F
from sales.models import SalesInvoice
from purchases.models import PurchaseInvoice
from inventory.models import Inventory


@api_view(["GET"])
def notifications_summary(request):
    customer_debts = 0
    customer_debt_items = []
    today = timezone.localdate()
    for invoice in (
        SalesInvoice.objects
        .select_related("customer")
        .order_by(F("due_date").asc(nulls_last=True), "id")
    ):
        paid = (
            invoice.payments.aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        remaining = invoice.total_amount_usd - paid

        if remaining > 0:
            customer_debts += 1
            if not invoice.due_date:
                    due_status = "no_due_date"
                    days_difference = None

            elif invoice.due_date < today:
                    due_status = "overdue"
                    days_difference = (today - invoice.due_date).days

            elif invoice.due_date == today:
                    due_status = "due_today"
                    days_difference = 0

            elif (invoice.due_date - today).days <= 7:
                    due_status = "due_soon"
                    days_difference = (invoice.due_date - today).days

            else:
                    due_status = "upcoming"
                    days_difference = (invoice.due_date - today).days
            if due_status in ["overdue", "due_today", "due_soon"]:
                customer_debt_items.append({
                    "invoice_id": invoice.id,
                    "invoice_number": f"SI-{invoice.id:04d}",
                    "customer": invoice.customer.name,
                    "status": invoice.status,
                    "due_date": invoice.due_date,
                    "total": invoice.total_amount_usd,
                    "paid": paid,
                    "remaining": remaining,
                    "due_status": due_status,
                    "days_difference": days_difference,
                })

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
    customer_alerts = len(customer_debt_items)
    return Response({
        "total": total,
        "customer_debts": customer_debts,
        "supplier_debts": supplier_debts,
        "out_of_stock": out_of_stock,
        "customer_debt_items": customer_debt_items,
        "customer_alerts": customer_alerts,
    })