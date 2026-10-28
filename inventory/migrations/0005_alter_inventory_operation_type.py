from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0004_remove_inventory_movement_qty'),
    ]

    operations = [
        migrations.AlterField(
            model_name='inventory',
            name='operation_type',
            field=models.CharField(
                max_length=20,
                null=True,
                blank=True,
                choices=[
                    ('purchase', 'Purchase'),
                    ('sale', 'Sale'),
                    ('damage', 'Damage'),
                    ('transfer_out', 'Transfer Out'),
                    ('transfer_in', 'Transfer In'),
                    ('sales_return', 'Sales Return'),
                    ('purchase_return', 'Purchase Return'),
                ],
            ),
        ),
    ]