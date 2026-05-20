# from decimal import Decimal
# from django.db import transaction
# from rest_framework.exceptions import ValidationError

# from warehouses.models import Warehouse
# from items.models import Item
# from inventory.models import Inventory
# from .models import Damage, DamageItem
# from inventory.services import get_latest_quantity

# class DamageService:
#     @staticmethod
#     @transaction.atomic
#     def create_damage(validated_data, user):
#         items_data = validated_data.pop("items")

#         warehouse = Warehouse.objects.get(pk=validated_data["warehouse"])

#         damage = Damage.objects.create(
#             warehouse=warehouse,
#             user=user if user.is_authenticated else None,
#             damage_date=validated_data["damage_date"],
#             notes=validated_data.get("notes"),
#         )

#         for item_data in items_data:
#             item = Item.objects.get(pk=item_data["item"])
#             quantity = item_data["quantity"]

#             try:
#                 inventory = Inventory.objects.get(
#                     warehouse=warehouse,
#                     item=item
#                 )
#             except Inventory.DoesNotExist:
#                 raise ValidationError(
#                     f"No inventory found for item {item.name} in this warehouse."
#                 )

#             if inventory.quantity < quantity:
#                 raise ValidationError(
#                     f"Not enough stock for {item.name}. Available: {inventory.quantity}"
#                 )

#             DamageItem.objects.create(
#                 damage=damage,
#                 item=item,
#                 quantity=quantity
#             )

#             inventory.quantity -= quantity
#             inventory.save()

#         return damage
from django.db import transaction
from rest_framework.exceptions import ValidationError

from warehouses.models import Warehouse
from items.models import Item
from inventory.models import Inventory
from inventory.services import get_latest_quantity
from .models import Damage, DamageItem


class DamageService:
    @staticmethod
    @transaction.atomic
    def create_damage(validated_data, user):
        items_data = validated_data.pop("items")

        warehouse = Warehouse.objects.get(pk=validated_data["warehouse"])

        damage = Damage.objects.create(
            warehouse=warehouse,
            user=user if user.is_authenticated else None,
            damage_date=validated_data["damage_date"],
            notes=validated_data.get("notes"),
        )

        for item_data in items_data:
            item = Item.objects.get(pk=item_data["item"])
            damage_quantity = item_data["quantity"]

            old_quantity = get_latest_quantity(
                warehouse_id=warehouse.id,
                item_id=item.id
            )

            if old_quantity < damage_quantity:
                raise ValidationError(
                    f"Not enough stock for {item.name}. Available: {old_quantity}"
                )

            new_quantity = old_quantity - damage_quantity

            DamageItem.objects.create(
                damage=damage,
                item=item,
                quantity=damage_quantity
            )

            Inventory.objects.create(
                warehouse=warehouse,
                item=item,
                movement_qty=damage_quantity,
                quantity=new_quantity,
                operation_type='damage'
            )

        return damage