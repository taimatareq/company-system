from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from django.db.models import Sum,Max
from decimal import Decimal

from .models import Inventory
from warehouses.models import Warehouse
from items.models import Item


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    change_list_template = "admin/inventory/inventory/change_list.html"

    list_display = [
        'warehouse',
        'item',
        'movement_qty_display',
        'quantity',
        'operation_type',
        'operation_date',
    ]
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
    list_filter = [
        'warehouse',
        'item',
        'operation_type',
        'operation_date',
    ]

    search_fields = [
        'warehouse__name',
        'item__name',
    ]

    readonly_fields = [
        'warehouse',
        'item',
        'quantity',
        'operation_type',
        'operation_date',
    ]

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "balance/",
                self.admin_site.admin_view(self.balance_view),
                name="inventory_balance",
            ),
        ]
        return custom_urls + urls
    def balance_view(self, request):
        warehouses = Warehouse.objects.all()
        items = Item.objects.all()

        selected_warehouse_id = request.GET.get("warehouse")
        selected_item_id = request.GET.get("item")

        result = None

        # 1) مادة داخل مستودع
        if selected_warehouse_id and selected_item_id:
            last_record = Inventory.objects.filter(
                warehouse_id=selected_warehouse_id,
                item_id=selected_item_id
            ).order_by("-operation_date", "-id").first()

            result = last_record.quantity if last_record else Decimal("0.00")

        # 2) كل المواد داخل مستودع
        elif selected_warehouse_id:
            result = []

            warehouse_items = Inventory.objects.filter(
                warehouse_id=selected_warehouse_id
            ).values("item_id", "item__name").distinct()

            for row in warehouse_items:
                last_record = Inventory.objects.filter(
                    warehouse_id=selected_warehouse_id,
                    item_id=row["item_id"]
                ).order_by("-operation_date", "-id").first()

                result.append({
                    "item__name": row["item__name"],
                    "total": last_record.quantity if last_record else Decimal("0.00"),
                    "last_date": last_record.operation_date if last_record else None,
                })

        # 3) مادة داخل كل المستودعات
        elif selected_item_id:
            result = []

            item_warehouses = Inventory.objects.filter(
                item_id=selected_item_id
            ).values("warehouse_id", "warehouse__name").distinct()

            for row in item_warehouses:
                last_record = Inventory.objects.filter(
                    warehouse_id=row["warehouse_id"],
                    item_id=selected_item_id
                ).order_by("-operation_date", "-id").first()

                result.append({
                    "warehouse__name": row["warehouse__name"],
                    "total": last_record.quantity if last_record else Decimal("0.00"),
                })

        return render(request, "admin/inventory/inventory/balance.html", {
            "warehouses": warehouses,
            "items": items,
            "result": result,
            "selected_warehouse_id": selected_warehouse_id,
            "selected_item_id": selected_item_id,
    })
    def movement_qty_display(self, obj):
     previous = Inventory.objects.filter(
        warehouse=obj.warehouse,
        item=obj.item,
        operation_date__lt=obj.operation_date
    ).order_by("-operation_date", "-id").first()

     if previous:
        return obj.quantity - previous.quantity

     return obj.quantity

    movement_qty_display.short_description = "Movement qty"