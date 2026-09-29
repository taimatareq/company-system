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

        if not items_data:
            raise ValidationError({
                "items": "At least one item is required."
            })

        warehouse = Warehouse.objects.get(
            pk=validated_data["warehouse"]
        )

        damage = Damage.objects.create(
            warehouse=warehouse,
            created_by=user if user.is_authenticated else None,
            damage_date=validated_data["damage_date"],
            notes=validated_data.get("notes"),
            is_applied=False,
        )

        for item_data in items_data:
            item = Item.objects.get(
                pk=item_data["item"]
            )

            damage_quantity = item_data["quantity"]

            if damage_quantity <= 0:
                raise ValidationError({
                    "quantity": "Damage quantity must be greater than zero."
                })

            old_quantity = get_latest_quantity(
                warehouse_id=warehouse.id,
                item_id=item.id
            )

            if old_quantity < damage_quantity:
                raise ValidationError({
                    "stock":
                        f"Not enough stock for {item.name}. "
                        f"Available: {old_quantity}"
                })

            new_quantity = old_quantity - damage_quantity

            DamageItem.objects.create(
                damage=damage,
                item=item,
                quantity=damage_quantity
            )

            Inventory.objects.create(
                warehouse=warehouse,
                item=item,
                quantity=new_quantity,
                operation_type="damage"
            )

        damage.is_applied = True
        damage.save(update_fields=["is_applied"])

        return damage