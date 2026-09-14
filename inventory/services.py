# from decimal import Decimal
# from django.db.models import Sum
# from .models import Inventory


# def get_current_quantity(warehouse_id, item_id):
#     return Inventory.objects.filter(
#         warehouse_id=warehouse_id,
#         item_id=item_id
#     ).aggregate(total=Sum('quantity'))['total'] or Decimal("0.00")
from decimal import Decimal
from .models import Inventory


def get_latest_quantity(warehouse_id, item_id):
    last_record = Inventory.objects.filter(
        warehouse_id=warehouse_id,
        item_id=item_id
    ).order_by("-operation_date", "-id").first()

    if not last_record:
        return Decimal("0.00")

    return last_record.quantity