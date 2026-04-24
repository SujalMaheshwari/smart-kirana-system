from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    """
    Adds CustomerProfile model — lightweight customer identity per shop+phone.
    Place in: backend/chatbot/migrations/0013_customer_profile.py
    """

    dependencies = [
        ('chatbot', '0012_order_tracking_fields'),
        ('shops', '0001_initial'),  # adjust if your shops migration number differs
    ]

    operations = [
        migrations.CreateModel(
            name='CustomerProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone', models.CharField(max_length=20)),
                ('name', models.CharField(max_length=100)),
                ('first_seen', models.DateTimeField(auto_now_add=True)),
                ('last_seen', models.DateTimeField(auto_now=True)),
                ('shop', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='customers',
                    to='shops.shop',
                )),
            ],
            options={
                'unique_together': {('shop', 'phone')},
            },
        ),
    ]
