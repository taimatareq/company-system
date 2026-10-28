from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import StockTransfer, StockTransferItem
from warehouses.models import Warehouse
from items.models import Item
from inventory.models import Inventory
from inventory.services import get_latest_quantity


class StockTransferService:

    @staticmethod
    def _prepare_items(items_data):
        if not items_data:
            raise ValidationError(
                "At least one item is required."
            )

        prepared_items = []
        seen_item_ids = set()

        for item_data in items_data:
            item_id = item_data["item"]
            quantity = item_data["quantity"]

            if item_id in seen_item_ids:
                raise ValidationError(
                    "The same item cannot be added more than once."
                )

            seen_item_ids.add(item_id)

            try:
                item = Item.objects.get(id=item_id)
            except Item.DoesNotExist:
                raise ValidationError(
                    "Item not found."
                )

            if item.item_type != "product":
                raise ValidationError(
                    "Service items cannot be transferred."
                )

            if quantity <= 0:
                raise ValidationError(
                    "Quantity must be greater than zero."
                )

            prepared_items.append(
                (item, quantity)
            )

        return prepared_items


    @staticmethod
    @transaction.atomic
    def create_transfer(
        validated_data,
        user,
        execute_immediately=False
    ):
        from_warehouse_id = validated_data["from_warehouse"]
        to_warehouse_id = validated_data["to_warehouse"]

        if from_warehouse_id == to_warehouse_id:
            raise ValidationError(
                "Source warehouse and destination warehouse cannot be the same."
            )

        try:
            from_warehouse = Warehouse.objects.get(
                id=from_warehouse_id
            )

            to_warehouse = Warehouse.objects.get(
                id=to_warehouse_id
            )

        except Warehouse.DoesNotExist:
            raise ValidationError(
                "Warehouse not found."
            )

        prepared_items = StockTransferService._prepare_items(
            validated_data["items"]
        )

        transfer = StockTransfer.objects.create(
            from_warehouse=from_warehouse,
            to_warehouse=to_warehouse,
            transfer_date=validated_data["transfer_date"],
            notes=validated_data.get("notes"),
            created_by=user,
            status="draft"
        )

        for item, quantity in prepared_items:
            StockTransferItem.objects.create(
                transfer=transfer,
                item=item,
                quantity=quantity
            )

        if execute_immediately:
            transfer = StockTransferService.execute_transfer(
                transfer
            )

        return transfer


    @staticmethod
    @transaction.atomic
    def update_transfer(transfer, validated_data):
        if transfer.status != "draft":
            raise ValidationError(
                "Only draft transfers can be edited."
            )

        from_warehouse_id = validated_data.get(
            "from_warehouse",
            transfer.from_warehouse_id
        )

        to_warehouse_id = validated_data.get(
            "to_warehouse",
            transfer.to_warehouse_id
        )

        if from_warehouse_id == to_warehouse_id:
            raise ValidationError(
                "Source warehouse and destination warehouse cannot be the same."
            )

        try:
            from_warehouse = Warehouse.objects.get(
                id=from_warehouse_id
            )

            to_warehouse = Warehouse.objects.get(
                id=to_warehouse_id
            )

        except Warehouse.DoesNotExist:
            raise ValidationError(
                "Warehouse not found."
            )

        prepared_items = None

        if "items" in validated_data:
            prepared_items = StockTransferService._prepare_items(
                validated_data["items"]
            )

        transfer.from_warehouse = from_warehouse
        transfer.to_warehouse = to_warehouse

        transfer.transfer_date = validated_data.get(
            "transfer_date",
            transfer.transfer_date
        )

        transfer.notes = validated_data.get(
            "notes",
            transfer.notes
        )

        transfer.save()

        if prepared_items is not None:
            transfer.items.all().delete()

            for item, quantity in prepared_items:
                StockTransferItem.objects.create(
                    transfer=transfer,
                    item=item,
                    quantity=quantity
                )

        return transfer


    @staticmethod
    @transaction.atomic
    def delete_transfer(transfer):
        if transfer.status != "draft":
            raise ValidationError(
                "Only draft transfers can be deleted."
            )

        transfer.delete()


    @staticmethod
    @transaction.atomic
    def execute_transfer(transfer):
        transfer = StockTransfer.objects.select_for_update().get(
            id=transfer.id
        )

        if transfer.status != "draft":
            raise ValidationError(
                "Only draft transfers can be executed."
            )

        if transfer.from_warehouse_id == transfer.to_warehouse_id:
            raise ValidationError(
                "Source warehouse and destination warehouse cannot be the same."
            )

        transfer_items = list(
            transfer.items.select_related("item").all()
        )

        if not transfer_items:
            raise ValidationError(
                "At least one item is required."
            )

        stock_changes = []
        seen_item_ids = set()

        for transfer_item in transfer_items:
            item = transfer_item.item
            quantity = transfer_item.quantity

            if item.id in seen_item_ids:
                raise ValidationError(
                    "The same item cannot be added more than once."
                )

            seen_item_ids.add(item.id)

            if item.item_type != "product":
                raise ValidationError(
                    "Service items cannot be transferred."
                )

            if quantity <= 0:
                raise ValidationError(
                    "Quantity must be greater than zero."
                )

            source_quantity = get_latest_quantity(
                transfer.from_warehouse_id,
                item.id
            )

            destination_quantity = get_latest_quantity(
                transfer.to_warehouse_id,
                item.id
            )

            if quantity > source_quantity:
                raise ValidationError(
                    f"Insufficient stock for item '{item.name}'. "
                    f"Available quantity is {source_quantity}."
                )

            stock_changes.append({
                "item": item,
                "quantity": quantity,
                "source_quantity": source_quantity,
                "destination_quantity": destination_quantity,
            })

        for change in stock_changes:
            Inventory.objects.create(
                warehouse=transfer.from_warehouse,
                item=change["item"],
                quantity=(
                    change["source_quantity"]
                    - change["quantity"]
                ),
                operation_type="transfer_out"
            )

            Inventory.objects.create(
                warehouse=transfer.to_warehouse,
                item=change["item"],
                quantity=(
                    change["destination_quantity"]
                    + change["quantity"]
                ),
                operation_type="transfer_in"
            )

        transfer.status = "completed"

        transfer.save(
            update_fields=["status"]
        )

        return transfer