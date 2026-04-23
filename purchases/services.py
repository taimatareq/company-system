from decimal import Decimal
from django.db import transaction
from branches.models import Branch
from warehouses.models import Warehouse
from suppliers.models import Supplier
from finance.models import ExchangeRate
from items.models import Item
from inventory.models import Inventory
from .models import PurchaseInvoice, PurchaseInvoiceItem


class PurchaseService:
    @staticmethod
    @transaction.atomic
    def create_invoice(validated_data, user):
        items_data = validated_data.pop("items")

        branch = Branch.objects.get(pk=validated_data["branch"])
        warehouse = Warehouse.objects.get(pk=validated_data["warehouse"])
        supplier = Supplier.objects.get(pk=validated_data["supplier"])

        exchange_rate_obj = None
        if validated_data.get("exchange_rate"):
            exchange_rate_obj = ExchangeRate.objects.get(pk=validated_data["exchange_rate"])

        invoice = PurchaseInvoice.objects.create(
            created_by=user if user.is_authenticated else None,            branch=branch,
            warehouse=warehouse,
            supplier=supplier,
            invoice_date=validated_data["invoice_date"],
            payment_type=validated_data["payment_type"],
            due_date=validated_data.get("due_date"),
            status=validated_data.get("status", "unpaid"),
            exchange_rate=exchange_rate_obj,
            total_amount=Decimal("0.00"),
            total_amount_usd=Decimal("0.00"),
            total_amount_syp=Decimal("0.00"),
        )

        total_usd = Decimal("0.00")
        total_syp = Decimal("0.00")

        for item_data in items_data:
            item = Item.objects.get(pk=item_data["item"])
            quantity = item_data["quantity"]
            unit_cost_usd = item_data["unit_cost_usd"]
            unit_cost_syp = item_data["unit_cost_syp"]

            line_total_usd = quantity * unit_cost_usd
            line_total_syp = quantity * unit_cost_syp

            PurchaseInvoiceItem.objects.create(
                invoice=invoice,
                item=item,
                quantity=quantity,
                unit_cost_usd=unit_cost_usd,
                unit_cost_syp=unit_cost_syp,
            )

            inventory, _ = Inventory.objects.get_or_create(
                warehouse=warehouse,
                item=item,
                defaults={"quantity": Decimal("0.00")}
            )

            inventory.quantity += quantity
            inventory.save()

            total_usd += line_total_usd
            total_syp += line_total_syp

        invoice.total_amount_usd = total_usd
        invoice.total_amount_syp = total_syp
        invoice.total_amount = total_syp
        invoice.save()

        return invoice