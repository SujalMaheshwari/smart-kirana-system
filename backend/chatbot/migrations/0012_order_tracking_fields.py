import uuid
from django.db import migrations, models


def populate_tokens(apps, schema_editor):
    """Give every existing order its own unique UUID token."""
    Order = apps.get_model('chatbot', 'Order')
    for order in Order.objects.all():
        order.token = uuid.uuid4()
        order.save(update_fields=['token'])


class Migration(migrations.Migration):
    """
    Adds status, eta_note, upi_ref, and token to Order.
    The token field is added in two steps to avoid SQLite UNIQUE constraint
    error on existing rows (SQLite fills all rows with the same default first).
    """

    dependencies = [
        ('chatbot', '0011_remove_order_eta_note'),
    ]

    operations = [
        # 1. Status field
        migrations.AddField(
            model_name='order',
            name='status',
            field=models.CharField(
                max_length=30,
                default='pending',
                choices=[
                    ('pending',          'Order Received'),
                    ('preparing',        'Being Prepared'),
                    ('out_for_delivery', 'Out for Delivery'),
                    ('delivered',        'Delivered'),
                ],
            ),
        ),
        # 2. ETA note
        migrations.AddField(
            model_name='order',
            name='eta_note',
            field=models.CharField(
                max_length=200,
                blank=True,
                default='',
                help_text='Delivery time note shown to customer on tracker',
            ),
        ),
        # 3. UPI reference
        migrations.AddField(
            model_name='order',
            name='upi_ref',
            field=models.CharField(max_length=100, blank=True, default=''),
        ),
        # 4a. Add token WITHOUT unique=True first (so SQLite can fill existing rows)
        migrations.AddField(
            model_name='order',
            name='token',
            field=models.UUIDField(default=uuid.uuid4, editable=False),
        ),
        # 4b. Give every existing row its own unique UUID
        migrations.RunPython(populate_tokens, migrations.RunPython.noop),
        # 4c. Now safe to add the unique constraint
        migrations.AlterField(
            model_name='order',
            name='token',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False),
        ),
    ]