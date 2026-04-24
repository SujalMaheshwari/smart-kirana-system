from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Adds 'status' field to Order model for delivery tracking.
    Place this file in: chatbot/migrations/
    Name it the NEXT number after your latest chatbot migration.
    e.g. if latest is 0004_..., name this 0005_add_order_status.py
    """

    dependencies = [
        # Change this to match your latest chatbot migration
        ('chatbot', '0004_order_customer_phone_order_delivery_address_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='status',
            field=models.CharField(
                max_length=30,
                default='pending',
                choices=[
                    ('pending', 'Order Received'),
                    ('preparing', 'Being Prepared'),
                    ('out_for_delivery', 'Out for Delivery'),
                    ('delivered', 'Delivered'),
                ],
            ),
        ),
    ]