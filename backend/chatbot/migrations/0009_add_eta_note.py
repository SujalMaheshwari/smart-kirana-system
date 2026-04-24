from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Adds 'eta_note' field to Order model so owner can set delivery time message.
    Add this AFTER the order_status migration.
    Name it the next number in chatbot/migrations/
    """

    dependencies = [
        # Change to match your previous chatbot migration (the order_status one)
        ('chatbot', '0006_add_order_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='eta_note',
            field=models.CharField(max_length=200, blank=True, default='',
                                help_text='Delivery time note shown to customer on tracker'),
        ),
    ]