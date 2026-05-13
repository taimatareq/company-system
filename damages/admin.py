from django.contrib import admin
from django.forms.models import BaseInlineFormSet
from django.core.exceptions import ValidationError

from .models import Damage, DamageItem
from inventory.models import Inventory
from inventory.services import get_latest_quantity
# from django.contrib import messages

class DamageItemInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()

        damage = self.instance
        warehouse = damage.warehouse

        for form in self.forms:
            if not form.cleaned_data or form.cleaned_data.get("DELETE"):
                continue

            item = form.cleaned_data.get("item")
            quantity = form.cleaned_data.get("quantity")

            if item and quantity:
                available = get_latest_quantity(warehouse.id, item.id)

                if available < quantity:
                  raise ValidationError(
    f"الكمية غير كافية للمادة {item.name}. المتوفر: {available}"
)

class DamageItemInline(admin.TabularInline):
    model = DamageItem
    formset = DamageItemInlineFormSet
    extra = 1


@admin.register(Damage)
class DamageAdmin(admin.ModelAdmin):
    inlines = [DamageItemInline]
    list_display = [
        'damage_number',
        'warehouse',
        'formatted_damage_date',
        'created_by',
    ]

    def formatted_damage_date(self, obj):
        return obj.damage_date.date()
    formatted_damage_date.short_description = "Damage Date"

    readonly_fields = ["is_applied"]
    def damage_number(self, obj):
        return f"DM-{obj.id:04d}"
    damage_number.short_description = "Damage"

    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)

        damage = form.instance

        if damage.is_applied:
            return

        for damage_item in damage.items.all():
            old_quantity = get_latest_quantity(
                warehouse_id=damage.warehouse.id,
                item_id=damage_item.item.id
            )

            new_quantity = old_quantity - damage_item.quantity

            Inventory.objects.create(
                warehouse=damage.warehouse,
                item=damage_item.item,
                quantity=new_quantity,
                operation_type="damage"
            )

        damage.is_applied = True
        damage.save()