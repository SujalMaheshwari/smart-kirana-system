import json
from django.db import models
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from inventory.models import Product
from .models import Order, OrderItem, CustomerProfile


def _get_shop_from_code(shop_code):
    try:
        from shops.models import Shop
        return Shop.objects.get(shop_code=shop_code), None
    except Exception:
        return None, JsonResponse({'error': 'Shop not found.'}, status=404)


def _order_to_dict(o):
    """Shared serializer for Order objects."""
    return {
        'id': o.id,
        'token': str(o.token),
        'placed_at': o.placed_at.strftime('%d %b %Y, %I:%M %p'),
        'grand_total': float(o.grand_total),
        'delivery_charge': float(o.delivery_charge),
        'payment_method': o.payment_method,
        'payment_confirmed': o.payment_confirmed,
        'fulfillment_type': o.fulfillment_type,
        'delivery_address': o.delivery_address,
        'status': o.status,
        'eta_note': o.eta_note,
        'items': [i.to_dict() for i in o.items.all()],
    }


@csrf_exempt
def customer_chat(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    try:
        body      = json.loads(request.body)
        message   = body.get('message', '').strip()
        shop_code = body.get('shop_code', '').strip()
        if not message:
            return JsonResponse({'error': 'Message is required.'}, status=400)
        from .ai_logic import ask_customer_bot
        reply = ask_customer_bot(message, shop_code=shop_code)
        return JsonResponse({'reply': reply})
    except Exception:
        return JsonResponse({'reply': 'Sorry, connection issue. Please try again.'})


@csrf_exempt
def checkout(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    try:
        body             = json.loads(request.body)
        shop_code        = body.get('shop_code', '').strip()
        cart_items       = body.get('cart', [])
        customer_name    = body.get('customer_name', 'Guest').strip() or 'Guest'
        customer_phone   = body.get('customer_phone', '').strip()
        payment_method   = body.get('payment_method', 'cash')
        fulfillment_type = body.get('fulfillment_type', 'delivery')
        delivery_address = body.get('delivery_address', '').strip()
        delivery_lat     = body.get('delivery_lat', None)
        delivery_lng     = body.get('delivery_lng', None)
        maps_link        = body.get('maps_link', '').strip()
        distance_km      = float(body.get('distance_km', 0))
        delivery_charge  = float(body.get('delivery_charge', 0))
        upi_ref          = body.get('upi_ref', '').strip()

        if not cart_items:
            return JsonResponse({'error': 'Cart is empty.'}, status=400)
        if not shop_code:
            return JsonResponse({'error': 'shop_code is required.'}, status=400)
        if fulfillment_type == 'delivery' and not delivery_address:
            return JsonResponse({'error': 'Please enter a delivery address.'}, status=400)

        shop, err = _get_shop_from_code(shop_code)
        if err: return err

        # Stock validation
        errors = []
        for item in cart_items:
            p = Product.objects.filter(id=item['id'], shop=shop).first()
            if not p:
                errors.append(f"'{item.get('name', 'Item')}' not found.")
                continue
            qty = float(item['quantity'])
            req = qty / 1000 if item.get('unit') == 'gm' else qty
            if p.stock_quantity < req:
                avail = f"{p.stock_quantity}kg" if p.is_loose else f"{int(p.stock_quantity)} pcs"
                errors.append(f"Only {avail} of '{p.name}' available.")
        if errors:
            return JsonResponse({'error': ' | '.join(errors)}, status=400)

        # Create/update CustomerProfile if phone provided
        if customer_phone:
            CustomerProfile.objects.update_or_create(
                shop=shop,
                phone=customer_phone,
                defaults={'name': customer_name},
            )

        # Create order
        order = Order.objects.create(
            shop=shop,
            customer_name=customer_name,
            customer_phone=customer_phone,
            grand_total=0,
            delivery_charge=delivery_charge,
            distance_km=distance_km,
            payment_method=payment_method,
            payment_confirmed=(payment_method == 'cash'),
            fulfillment_type=fulfillment_type,
            delivery_address=delivery_address,
            delivery_lat=delivery_lat,
            delivery_lng=delivery_lng,
            maps_link=maps_link,
            upi_ref=upi_ref,
            status='pending',
        )

        items_total = 0.0
        bill = []
        for item in cart_items:
            p = Product.objects.get(id=item['id'], shop=shop)
            qty = float(item['quantity'])
            unit = item.get('unit', 'pcs')
            line_total = float(item.get('line_total', float(p.price) * qty))
            deduct = qty / 1000 if unit == 'gm' else qty
            p.stock_quantity = round(p.stock_quantity - deduct, 3)
            p.save()
            items_total += line_total
            OrderItem.objects.create(
                order=order, product=p, product_name=p.name,
                quantity=qty, unit=unit, price_at_order=p.price, item_total=line_total,
            )
            bill.append({'name': p.name, 'quantity': qty, 'unit': unit,
                         'price': float(p.price), 'total': round(line_total, 2)})

        order.grand_total = round(items_total + delivery_charge, 2)
        order.save()

        return JsonResponse({
            'success': True,
            'order_id': order.id,
            'order_token': str(order.token),
            'bill': bill,
            'items_total': round(items_total, 2),
            'delivery_charge': delivery_charge,
            'grand_total': float(order.grand_total),
            'customer_name': customer_name,
            'fulfillment_type': fulfillment_type,
            'delivery_address': delivery_address,
        })
    except Exception as e:
        return JsonResponse({'error': f'Checkout error: {e}'}, status=500)


def my_orders(request):
    """
    Customer looks up past orders by phone number.
    GET /api/chatbot/my-orders/?phone=9876543210&shop_code=kumar-kirana-xyz
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'GET only'}, status=405)

    phone     = request.GET.get('phone', '').strip()
    shop_code = request.GET.get('shop_code', '').strip()

    if not phone:
        return JsonResponse({'error': 'Phone number is required.'}, status=400)
    if not shop_code:
        return JsonResponse({'error': 'shop_code is required.'}, status=400)

    shop, err = _get_shop_from_code(shop_code)
    if err: return err

    try:
        orders = (Order.objects
                  .filter(shop=shop, customer_phone=phone)
                  .prefetch_related('items')
                  .order_by('-placed_at')[:20])

        # Get customer profile name if exists
        profile = CustomerProfile.objects.filter(shop=shop, phone=phone).first()
        customer_name = profile.name if profile else None

        return JsonResponse({
            'customer_name': customer_name,
            'orders': [_order_to_dict(o) for o in orders],
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def admin_chat(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Login required.'}, status=401)
    try:
        shop = getattr(request.user, 'shop', None)
        if not shop:
            return JsonResponse({'reply': 'No shop found for your account.'})

        body           = json.loads(request.body)
        message        = body.get('message', '').strip()
        system_context = body.get('system_context', '').strip()

        if not message:
            return JsonResponse({'error': 'Message is required.'}, status=400)

        if system_context:
            from .ai_logic import llm as gemini_llm
            try:
                result = gemini_llm.invoke([('system', system_context), ('user', message)])
                return JsonResponse({'reply': result.content})
            except Exception:
                pass

        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Sum

        msg   = message.lower()
        now   = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week  = today - timedelta(days=6)
        orders = Order.objects.filter(shop=shop)

        if any(w in msg for w in ['low stock', 'khatam', 'stock low', 'running out', 'kam hai']):
            low = Product.objects.filter(shop=shop, stock_quantity__gt=0, stock_quantity__lte=models.F('min_stock_level'))
            if not low.exists():
                return JsonResponse({'reply': '✅ Sab theek hai! Koi bhi item minimum stock se neeche nahi hai.'})
            items = '\n'.join([f"• {p.name} — {p.stock_quantity}{'kg' if p.is_loose else ' pcs'} (min: {p.min_stock_level})" for p in low])
            return JsonResponse({'reply': f'⚠️ Low stock items:\n{items}\n\nInhe jaldi reorder karein!'})

        if any(w in msg for w in ['out of stock', 'zero stock', 'khatam ho gaya', 'nahi hai']):
            out = Product.objects.filter(shop=shop, stock_quantity__lte=0)
            if not out.exists():
                return JsonResponse({'reply': '✅ Bahut acha! Koi bhi item out of stock nahi hai.'})
            items = '\n'.join([f"• {p.name}" for p in out])
            return JsonResponse({'reply': f'🔴 Out of stock:\n{items}'})

        if any(w in msg for w in ['today', 'aaj', "today's order"]):
            todays = orders.filter(placed_at__gte=today)
            total  = float(todays.aggregate(s=Sum('grand_total'))['s'] or 0)
            return JsonResponse({'reply': f"📦 Aaj ke orders: {todays.count()}\n💰 Aaj ki kamai: ₹{total:.2f}"})

        if any(w in msg for w in ['revenue', 'sales', 'kamai', 'earning', 'kitna kama']):
            week_orders = orders.filter(placed_at__gte=week)
            total = float(week_orders.aggregate(s=Sum('grand_total'))['s'] or 0)
            return JsonResponse({'reply': f"📊 Pichle 7 din:\n• {week_orders.count()} orders\n• ₹{total:.2f} kamai"})

        total  = Product.objects.filter(shop=shop).count()
        active = Product.objects.filter(shop=shop, stock_quantity__gt=0).count()
        low_ct = Product.objects.filter(shop=shop, stock_quantity__gt=0, stock_quantity__lte=5).count()
        return JsonResponse({'reply': (
            f"🧺 Aapka inventory:\n• Total products: {total}\n• In stock: {active}\n"
            f"• Out of stock: {total - active}\n• Low stock: {low_ct}\n\n"
            "Kuch aur poochna hai? Main area-wise suggestions bhi de sakta hoon!"
        )})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def confirm_payment(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    try:
        body     = json.loads(request.body)
        order_id = body.get('order_id')
        order    = Order.objects.get(id=order_id)
        order.payment_confirmed = True
        order.save()
        return JsonResponse({'success': True})
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def track_order(request):
    """
    Customer order tracking by UUID token.
    GET /api/chatbot/track/?token=UUID&shop_code=Y
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'GET only'}, status=405)
    try:
        token     = request.GET.get('token', '').strip()
        shop_code = request.GET.get('shop_code', '').strip()

        if not token:
            return JsonResponse({'error': 'token is required.'}, status=400)

        qs = Order.objects.filter(token=token)
        if shop_code:
            try:
                from shops.models import Shop
                shop = Shop.objects.get(shop_code=shop_code)
                qs = qs.filter(shop=shop)
            except Shop.DoesNotExist:
                return JsonResponse({'error': 'Shop not found.'}, status=404)

        order = qs.prefetch_related('items').first()
        if not order:
            return JsonResponse({'error': 'Order not found.'}, status=404)

        return JsonResponse({'order': {
            'id': order.id,
            'token': str(order.token),
            'customer_name': order.customer_name,
            'placed_at': order.placed_at.strftime('%d %b, %I:%M %p'),
            'grand_total': float(order.grand_total),
            'payment_method': order.payment_method,
            'fulfillment_type': order.fulfillment_type,
            'delivery_address': order.delivery_address or '',
            'status': order.status,
            'eta_note': order.eta_note,
            'items': [
                {'product_name': i.product_name, 'quantity': float(i.quantity),
                 'unit': i.unit, 'item_total': float(i.item_total)}
                for i in order.items.all()
            ],
        }})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def update_order_status(request):
    """Owner updates order status/eta."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Login required.'}, status=401)
    try:
        body     = json.loads(request.body)
        order_id = body.get('order_id')
        status   = body.get('status', '').strip()
        eta_note = body.get('eta_note', None)

        order = Order.objects.get(id=order_id)

        try:
            from shops.models import Shop
            owner_shop = Shop.objects.get(owner=request.user)
            if order.shop_id and order.shop_id != owner_shop.id:
                return JsonResponse({'error': 'Unauthorized.'}, status=403)
        except Shop.DoesNotExist:
            return JsonResponse({'error': 'Shop not found.'}, status=404)

        update_fields = []
        if status:
            valid = ['pending', 'preparing', 'out_for_delivery', 'delivered']
            if status not in valid:
                return JsonResponse({'error': f'Status must be one of: {", ".join(valid)}'}, status=400)
            order.status = status
            update_fields.append('status')

        if eta_note is not None:
            order.eta_note = eta_note
            update_fields.append('eta_note')

        if update_fields:
            order.save(update_fields=update_fields)

        return JsonResponse({'success': True, 'status': order.status, 'eta_note': order.eta_note})
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)