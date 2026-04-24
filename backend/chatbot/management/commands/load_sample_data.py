#!/usr/bin/env python
"""
KiranaOS Sample Data Loader
Django management command: python manage.py load_sample_data

Creates:
  - 3 sample shops with owners
  - 40+ products across all categories (with barcodes)
  - 15+ orders with items (various statuses)
  - Suppliers per shop
  - Customer reviews

Usage:
  cd backend
  python manage.py load_sample_data
  python manage.py load_sample_data --clear  (deletes all first)
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from shops.models import Shop, Supplier, Review
from inventory.models import Product, CATEGORY_CHOICES
from chatbot.models import Order, OrderItem


class Command(BaseCommand):
    help = 'Load sample data for KiranaOS demo'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear all data before loading')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('🗑️  Clearing all data...')
            User.objects.all().delete()
            Shop.objects.all().delete()
            Product.objects.all().delete()
            Order.objects.all().delete()
            OrderItem.objects.all().delete()
            Review.objects.all().delete()
            Supplier.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✓ Data cleared'))

        # Create sample shops & users
        shops = self._create_shops()
        
        # Create products for each shop
        self._create_products(shops)
        
        # Create suppliers
        self._create_suppliers(shops)
        
        # Create orders
        self._create_orders(shops)
        
        # Create reviews
        self._create_reviews(shops)
        
        self.stdout.write(self.style.SUCCESS('\n✅ Sample data loaded successfully!'))
        self._print_summary(shops)

    def _create_shops(self):
        """Create 3 sample shops with owners"""
        self.stdout.write('📦 Creating shops...')
        
        shops_data = [
            {
                'owner_name': 'Rajesh Kumar',
                'shop_name': 'Kumar Kirana Store',
                'email': 'rajesh@kirana.local',
                'tagline': 'Fresh & Quality Products',
                'address': 'Main Street, Indore',
                'phone': '9876543210',
                'logo_emoji': '🏪',
                'upi_id': 'rajesh.kumar@upi',
                'delivery_radius_km': 5.0,
                'delivery_base_charge': 20.0,
            },
            {
                'owner_name': 'Priya Sharma',
                'shop_name': 'Sharma General Stores',
                'email': 'priya@kirana.local',
                'tagline': 'Best Prices in Town',
                'address': 'Market Road, Indore',
                'phone': '9876543211',
                'logo_emoji': '🛒',
                'upi_id': 'priya.sharma@upi',
                'delivery_radius_km': 6.0,
                'delivery_base_charge': 25.0,
            },
            {
                'owner_name': 'Vikram Patel',
                'shop_name': 'Patel Provision Store',
                'email': 'vikram@kirana.local',
                'tagline': 'Daily Essentials Hub',
                'address': 'Subhash Nagar, Indore',
                'phone': '9876543212',
                'logo_emoji': '🏬',
                'upi_id': 'vikram.patel@upi',
                'delivery_radius_km': 4.0,
                'delivery_base_charge': 15.0,
            },
        ]
        
        shops = []
        for data in shops_data:
            user, _ = User.objects.get_or_create(
                username=data['email'],
                defaults={
                    'email': data['email'],
                    'first_name': data['owner_name'].split()[0],
                    'last_name': ' '.join(data['owner_name'].split()[1:]),
                }
            )
            if not hasattr(user, 'shop'):
                user.set_password('demo1234')
                user.save()
                
                from shops.models import make_shop_code
                shop = Shop.objects.create(
                    owner=user,
                    name=data['shop_name'],
                    shop_code=make_shop_code(data['shop_name']),
                    tagline=data['tagline'],
                    address=data['address'],
                    phone=data['phone'],
                    logo_emoji=data['logo_emoji'],
                    upi_id=data['upi_id'],
                    delivery_radius_km=data['delivery_radius_km'],
                    delivery_base_charge=data['delivery_base_charge'],
                    offers_delivery=True,
                )
            else:
                shop = user.shop
            shops.append(shop)
        
        self.stdout.write(f'  ✓ Created {len(shops)} shops')
        return shops

    def _create_products(self, shops):
        """Create 40+ products across categories"""
        self.stdout.write('🛍️  Creating products...')
        
        products_data = [
            # Dairy
            {'name': 'Milk (1L)', 'category': 'dairy', 'price': 50, 'stock': 100, 'barcode': '8901234567001', 'is_loose': False},
            {'name': 'Yogurt (500ml)', 'category': 'dairy', 'price': 40, 'stock': 50, 'barcode': '8901234567002', 'is_loose': False},
            {'name': 'Butter (200g)', 'category': 'dairy', 'price': 120, 'stock': 30, 'barcode': '8901234567003', 'is_loose': False},
            {'name': 'Paneer (500g)', 'category': 'dairy', 'price': 180, 'stock': 25, 'barcode': '8901234567004', 'is_loose': False},
            {'name': 'Cheese Slice', 'category': 'dairy', 'price': 60, 'stock': 40, 'barcode': '8901234567005', 'is_loose': False},
            
            # Grains & Pulses
            {'name': 'Rice (1kg)', 'category': 'grains', 'price': 60, 'stock': 80, 'barcode': '8901234567010', 'is_loose': False},
            {'name': 'Wheat Flour (1kg)', 'category': 'grains', 'price': 35, 'stock': 120, 'barcode': '8901234567011', 'is_loose': False},
            {'name': 'Arhar Dal', 'category': 'grains', 'price': 100, 'stock': 50, 'is_loose': True},
            {'name': 'Moong Dal', 'category': 'grains', 'price': 120, 'stock': 40, 'is_loose': True},
            {'name': 'Sugar (1kg)', 'category': 'grains', 'price': 45, 'stock': 60, 'barcode': '8901234567012', 'is_loose': False},
            {'name': 'Salt (1kg)', 'category': 'grains', 'price': 20, 'stock': 100, 'barcode': '8901234567013', 'is_loose': False},
            
            # Snacks & Biscuits
            {'name': 'Parle-G (200g)', 'category': 'snacks', 'price': 25, 'stock': 150, 'barcode': '8901234567020', 'is_loose': False},
            {'name': 'Hide & Seek (300g)', 'category': 'snacks', 'price': 35, 'stock': 100, 'barcode': '8901234567021', 'is_loose': False},
            {'name': 'Monaco (180g)', 'category': 'snacks', 'price': 20, 'stock': 120, 'barcode': '8901234567022', 'is_loose': False},
            {'name': 'Lays Chips (30g)', 'category': 'snacks', 'price': 10, 'stock': 200, 'barcode': '8901234567023', 'is_loose': False},
            {'name': 'Haldirams Mix (200g)', 'category': 'snacks', 'price': 40, 'stock': 70, 'barcode': '8901234567024', 'is_loose': False},
            
            # Beverages
            {'name': 'Tea Leaves (250g)', 'category': 'beverages', 'price': 80, 'stock': 60, 'barcode': '8901234567030', 'is_loose': False},
            {'name': 'Coffee Powder (100g)', 'category': 'beverages', 'price': 150, 'stock': 30, 'barcode': '8901234567031', 'is_loose': False},
            {'name': 'Coca Cola (500ml)', 'category': 'beverages', 'price': 40, 'stock': 80, 'barcode': '8901234567032', 'is_loose': False},
            {'name': 'Sprite (500ml)', 'category': 'beverages', 'price': 40, 'stock': 70, 'barcode': '8901234567033', 'is_loose': False},
            {'name': 'Appy Fizz (200ml)', 'category': 'beverages', 'price': 20, 'stock': 100, 'barcode': '8901234567034', 'is_loose': False},
            
            # Spices & Masala
            {'name': 'Turmeric Powder', 'category': 'spices', 'price': 150, 'stock': 30, 'is_loose': True},
            {'name': 'Red Chili Powder', 'category': 'spices', 'price': 180, 'stock': 25, 'is_loose': True},
            {'name': 'Black Pepper', 'category': 'spices', 'price': 200, 'stock': 20, 'is_loose': True},
            {'name': 'Cumin Seeds', 'category': 'spices', 'price': 160, 'stock': 35, 'is_loose': True},
            {'name': 'Garam Masala', 'category': 'spices', 'price': 120, 'stock': 40, 'barcode': '8901234567040', 'is_loose': False},
            
            # Oil & Ghee
            {'name': 'Sunflower Oil (1L)', 'category': 'oil', 'price': 130, 'stock': 50, 'barcode': '8901234567050', 'is_loose': False},
            {'name': 'Coconut Oil (500ml)', 'category': 'oil', 'price': 200, 'stock': 30, 'barcode': '8901234567051', 'is_loose': False},
            {'name': 'Ghee (500ml)', 'category': 'oil', 'price': 400, 'stock': 15, 'barcode': '8901234567052', 'is_loose': False},
            
            # Personal Care
            {'name': 'Soap Bar', 'category': 'personal', 'price': 30, 'stock': 100, 'barcode': '8901234567060', 'is_loose': False},
            {'name': 'Shampoo (200ml)', 'category': 'personal', 'price': 80, 'stock': 50, 'barcode': '8901234567061', 'is_loose': False},
            {'name': 'Toothpaste (100ml)', 'category': 'personal', 'price': 50, 'stock': 80, 'barcode': '8901234567062', 'is_loose': False},
            {'name': 'Deodorant', 'category': 'personal', 'price': 150, 'stock': 40, 'barcode': '8901234567063', 'is_loose': False},
            
            # Cleaning
            {'name': 'Dish Wash Liquid', 'category': 'cleaning', 'price': 60, 'stock': 70, 'barcode': '8901234567070', 'is_loose': False},
            {'name': 'Floor Cleaner', 'category': 'cleaning', 'price': 80, 'stock': 50, 'barcode': '8901234567071', 'is_loose': False},
            {'name': 'Detergent Powder (500g)', 'category': 'cleaning', 'price': 120, 'stock': 60, 'barcode': '8901234567072', 'is_loose': False},
        ]
        
        for shop in shops:
            for data in products_data:
                # Make barcode unique per shop by appending shop id
                raw_barcode = data.get('barcode', None)
                shop_barcode = f"{raw_barcode}-{shop.id}" if raw_barcode else None

                Product.objects.get_or_create(
                    shop=shop,
                    name=data['name'],
                    defaults={
                        'category': data['category'],
                        'price': Decimal(str(data['price'])),
                        'stock_quantity': data['stock'],
                        'is_loose': data.get('is_loose', False),
                        'min_stock_level': 5,
                        'barcode': shop_barcode,
                    }
                )
        
        total_products = Product.objects.count()
        self.stdout.write(f'  ✓ Created {total_products} products')

    def _create_suppliers(self, shops):
        """Create suppliers for each shop"""
        self.stdout.write('🤝 Creating suppliers...')
        
        suppliers_data = [
            {'name': 'ABC Dairy Co.', 'phone': '9988776655', 'items': 'Milk, Yogurt, Paneer'},
            {'name': 'XYZ Grain Traders', 'phone': '9988776656', 'items': 'Rice, Wheat, Dal'},
            {'name': 'Snack Master Ltd', 'phone': '9988776657', 'items': 'Biscuits, Chips, Snacks'},
            {'name': 'Fresh Spice Hub', 'phone': '9988776658', 'items': 'Spices, Masala, Herbs'},
        ]
        
        for shop in shops:
            for data in suppliers_data:
                Supplier.objects.get_or_create(
                    shop=shop,
                    name=data['name'],
                    defaults={
                        'phone': data['phone'],
                        'items_supplied': data['items'],
                    }
                )
        
        total = Supplier.objects.count()
        self.stdout.write(f'  ✓ Created {total} suppliers')

    def _create_orders(self, shops):
        """Create realistic orders with items"""
        self.stdout.write('📦 Creating orders...')
        
        order_count = 0
        for shop in shops:
            # Create 5 orders per shop over the past 30 days
            for i in range(5):
                days_ago = random.randint(1, 30)
                placed_at = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
                
                # Randomly pick fulfillment type and payment
                fulfillment = random.choice(['delivery', 'pickup'])
                payment = random.choice(['cash', 'upi'])
                
                # Calculate delivery charge
                distance = random.uniform(0.5, 5.0) if fulfillment == 'delivery' else 0
                delivery_charge = shop.calc_delivery(distance) if fulfillment == 'delivery' else 0
                
                # Create order
                order = Order.objects.create(
                    shop=shop,
                    customer_name=random.choice([
                        'Amit Singh', 'Bhavna Gupta', 'Chirag Joshi', 'Deepak Rao',
                        'Esha Patel', 'Fatima Khan', 'Gaurav Sharma', 'Hari Verma'
                    ]),
                    customer_phone=f'98{random.randint(0, 9)}{random.randint(0, 9)}{random.randint(100000, 999999)}',
                    placed_at=placed_at,
                    fulfillment_type=fulfillment,
                    payment_method=payment,
                    payment_confirmed=(payment == 'cash'),
                    delivery_address=f'{random.randint(100, 999)} {random.choice(["Street", "Lane", "Road"])}, Indore' if fulfillment == 'delivery' else '',
                    delivery_lat=22.7196 + random.uniform(-0.02, 0.02),
                    delivery_lng=75.8577 + random.uniform(-0.02, 0.02),
                    distance_km=distance,
                    delivery_charge=Decimal(str(round(delivery_charge, 2))),
                    grand_total=0,  # Will be calculated after items
                )
                
                # Add 2-5 random items to order
                items_total = Decimal('0')
                item_count = random.randint(2, 5)
                products = list(shop.products.all())
                selected_products = random.sample(products, min(item_count, len(products)))
                
                for product in selected_products:
                    qty = random.uniform(0.5, 5) if product.is_loose else random.randint(1, 5)
                    item_total = Decimal(str(product.price)) * Decimal(str(qty))
                    
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        product_name=product.name,
                        quantity=qty,
                        unit='kg' if product.is_loose else 'pcs',
                        price_at_order=product.price,
                        item_total=item_total,
                    )
                    items_total += item_total
                
                # Update order total
                order.grand_total = items_total + Decimal(str(order.delivery_charge))
                order.save()
                order_count += 1
        
        self.stdout.write(f'  ✓ Created {order_count} orders with items')

    def _create_reviews(self, shops):
        """Create customer reviews for each shop"""
        self.stdout.write('⭐ Creating reviews...')
        
        review_comments = [
            'Excellent quality and fast delivery!',
            'Best prices in the area',
            'Fresh products, friendly service',
            'Always on time, great customer service',
            'Highly recommended!',
            'Good variety of products',
            'Quick delivery, good quality',
            'Will order again',
        ]
        
        review_count = 0
        for shop in shops:
            for i in range(random.randint(5, 8)):
                Review.objects.get_or_create(
                    shop=shop,
                    customer_name=random.choice([
                        'Amit', 'Bhavna', 'Chirag', 'Deepak', 'Esha', 'Fatima', 'Gaurav'
                    ]),
                    rating=random.choice([4, 5, 5, 5]),  # Bias toward 5 stars
                    defaults={
                        'comment': random.choice(review_comments),
                    }
                )
                review_count += 1
        
        self.stdout.write(f'  ✓ Created {review_count} reviews')

    def _print_summary(self, shops):
        """Print summary statistics"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write('📊 DATA SUMMARY')
        self.stdout.write('='*60)
        
        for shop in shops:
            products = shop.products.count()
            orders = shop.orders.count()
            reviews = shop.reviews.count()
            total_revenue = sum(o.grand_total for o in shop.orders.all())
            
            self.stdout.write(f'\n🏪 {shop.name} (@{shop.shop_code})')
            self.stdout.write(f'   Products: {products}')
            self.stdout.write(f'   Orders: {orders}')
            self.stdout.write(f'   Reviews: {reviews}')
            self.stdout.write(f'   Total Revenue: ₹{total_revenue:.2f}')
            self.stdout.write(f'   UPI ID: {shop.upi_id}')
            self.stdout.write(f'   Login: {shop.owner.email} / demo1234')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write('✅ All sample data loaded!')
        self.stdout.write('='*60 + '\n')