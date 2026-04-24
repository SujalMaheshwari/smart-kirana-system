import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta


def _require_auth(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Login required.'}, status=401)
    return None


def _shop_or_error(request):
    shop = getattr(request.user, 'shop', None)
    if not shop:
        return None, JsonResponse({'error': 'No shop found for this account.'}, status=404)
    return shop, None


# ── AUTH ───────────────────────────────────────────────────────────────────────

@csrf_exempt
def register_owner(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    try:
        from .models import Shop, make_shop_code
        body       = json.loads(request.body)
        email      = body.get('email', '').strip().lower()
        password   = body.get('password', '').strip()
        shop_name  = body.get('shop_name', '').strip()
        owner_name = body.get('owner_name', '').strip()

        if not all([email, password, shop_name]):
            return JsonResponse({'error': 'Email, password, and shop name are required.'}, status=400)
        if len(password) < 6:
            return JsonResponse({'error': 'Password must be at least 6 characters.'}, status=400)
        if User.objects.filter(username=email).exists():
            return JsonResponse({'error': 'An account with this email already exists.'}, status=400)

        user = User.objects.create_user(
            username=email, email=email, password=password,
            first_name=owner_name or shop_name.split()[0]
        )
        shop = Shop.objects.create(owner=user, name=shop_name, shop_code=make_shop_code(shop_name))
        login(request, user)

        return JsonResponse({
            'success': True,
            'user': {'id': user.id, 'name': user.first_name, 'email': user.email},
            'shop': shop.to_owner_dict()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def login_owner(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    try:
        body     = json.loads(request.body)
        email    = body.get('email', '').strip().lower()
        password = body.get('password', '').strip()
        user     = authenticate(request, username=email, password=password)
        if not user:
            return JsonResponse({'error': 'Invalid email or password.'}, status=401)
        login(request, user)
        shop = getattr(user, 'shop', None)
        return JsonResponse({
            'success': True,
            'user': {'id': user.id, 'name': user.first_name, 'email': user.email},
            'shop': shop.to_owner_dict() if shop else None
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def logout_owner(request):
    logout(request)
    return JsonResponse({'success': True})


def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not logged in.'}, status=401)
    shop = getattr(request.user, 'shop', None)
    return JsonResponse({
        'user': {'id': request.user.id, 'name': request.user.first_name, 'email': request.user.email},
        'shop': shop.to_owner_dict() if shop else None
    })


# ── SHOP PUBLIC ────────────────────────────────────────────────────────────────

def shop_public(request, shop_code):
    try:
        from .models import Shop
        shop = Shop.objects.get(shop_code=shop_code)
        
        # 1. Get the shop data
        shop_data = shop.to_public_dict()
        shop_data['upi_id'] = getattr(shop, 'upi_id', '')
        
        # 2. Wrap it in a NEW dictionary for the frontend
        response_data = {
            'shop': shop_data
        }
        
        # 3. Return the new dictionary
        return JsonResponse(response_data)
        
    except Shop.DoesNotExist:
        return JsonResponse({'error': 'Shop not found.'}, status=404)

# ── SHOP UPDATE ────────────────────────────────────────────────────────────────

@csrf_exempt
def shop_update(request):
    err = _require_auth(request)
    if err: return err
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    try:
        shop, err = _shop_or_error(request)
        if err: return err
        body = json.loads(request.body)

        for field in ['name', 'tagline', 'address', 'phone', 'logo_emoji', 'upi_id']:
            if field in body:
                setattr(shop, field, body[field])
        if 'is_open' in body:
            shop.is_open = bool(body['is_open'])
        if 'offers_delivery' in body:
            shop.offers_delivery = bool(body['offers_delivery'])
        if 'free_delivery_upi' in body:
            shop.free_delivery_upi = bool(body['free_delivery_upi'])
        if 'delivery_radius_km' in body:
            shop.delivery_radius_km = float(body['delivery_radius_km'])
        if 'delivery_base_charge' in body:
            shop.delivery_base_charge = float(body['delivery_base_charge'])
        if 'delivery_per_km' in body:
            shop.delivery_per_km = float(body['delivery_per_km'])
        if 'delivery_base_km' in body:
            shop.delivery_base_km = float(body['delivery_base_km'])

        shop.save()
        return JsonResponse({'success': True, 'shop': shop.to_owner_dict()})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ── SUPPLIERS ──────────────────────────────────────────────────────────────────

def suppliers_list(request):
    err = _require_auth(request)
    if err: return err
    shop, err = _shop_or_error(request)
    if err: return err
    return JsonResponse({'suppliers': [s.to_dict() for s in shop.suppliers.all()]})


@csrf_exempt
def supplier_create(request):
    err = _require_auth(request)
    if err: return err
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    try:
        shop, err = _shop_or_error(request)
        if err: return err
        body = json.loads(request.body)
        from .models import Supplier
        s = Supplier.objects.create(
            shop=shop,
            name=body.get('name', ''),
            phone=body.get('phone', ''),
            items_supplied=body.get('items_supplied', ''),
            notes=body.get('notes', ''),
        )
        return JsonResponse({'success': True, 'supplier': s.to_dict()})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def supplier_delete(request, supplier_id):
    err = _require_auth(request)
    if err: return err
    try:
        from .models import Supplier
        s = Supplier.objects.get(id=supplier_id, shop__owner=request.user)
        s.delete()
        return JsonResponse({'success': True})
    except Supplier.DoesNotExist:
        return JsonResponse({'error': 'Not found.'}, status=404)


# ── DASHBOARD ANALYTICS (scoped to owner's shop) ──────────────────────────────

def dashboard(request):
    err = _require_auth(request)
    if err: return err
    try:
        shop, err = _shop_or_error(request)
        if err: return err

        from chatbot.models import Order, OrderItem
        now   = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week  = today - timedelta(days=6)
        month = today - timedelta(days=29)

        # KEY FIX: filter orders by THIS shop only
        orders = Order.objects.filter(shop=shop)

        def rev(qs): return float(qs.aggregate(s=Sum('grand_total'))['s'] or 0)
        def cnt(qs): return qs.count()

        # Daily chart — last 30 days
        daily = []
        for i in range(29, -1, -1):
            ds = today - timedelta(days=i)
            de = ds + timedelta(days=1)
            qs = orders.filter(placed_at__gte=ds, placed_at__lt=de)
            daily.append({'date': ds.strftime('%d %b'), 'revenue': rev(qs), 'orders': cnt(qs)})

        top = (OrderItem.objects
               .filter(order__shop=shop)
               .values('product_name')
               .annotate(total_rev=Sum('item_total'), total_qty=Sum('quantity'), order_count=Count('order', distinct=True))
               .order_by('-total_rev')[:5])

        recent = []
        for o in orders.order_by('-placed_at')[:20]:
            recent.append({
                'id': o.id,
                'customer': o.customer_name,
                'phone': o.customer_phone,
                'total': float(o.grand_total),
                'delivery_charge': float(o.delivery_charge),
                'payment': o.payment_method,
                'confirmed': o.payment_confirmed,
                'fulfillment': o.fulfillment_type,
                'delivery_address': o.delivery_address,
                'maps_link': o.maps_link,
                'time': o.placed_at.strftime('%d %b %H:%M'),
                'status': getattr(o, 'status', 'pending'),
                'eta_note': getattr(o, 'eta_note', ''),
                'upi_ref': getattr(o, 'upi_ref', ''),
            })

        return JsonResponse({
            'summary': {
                'today_revenue': rev(orders.filter(placed_at__gte=today)),
                'week_revenue':  rev(orders.filter(placed_at__gte=week)),
                'month_revenue': rev(orders.filter(placed_at__gte=month)),
                'total_revenue': rev(orders),
                'today_orders':  cnt(orders.filter(placed_at__gte=today)),
                'week_orders':   cnt(orders.filter(placed_at__gte=week)),
                'total_orders':  cnt(orders),
                'avg_order':     float(orders.aggregate(a=Avg('grand_total'))['a'] or 0),
            },
            'daily_chart':   daily,
            'top_products':  [{'name': p['product_name'], 'revenue': float(p['total_rev']),
                               'qty': float(p['total_qty']), 'orders': p['order_count']} for p in top],
            'payment_split': {
                'cash': orders.filter(payment_method='cash').count(),
                'upi':  orders.filter(payment_method='upi').count(),
            },
            'recent_orders': recent,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def reviews(request):
    """GET: list reviews for shop owner. POST: customer submits a review."""
    if request.method == 'GET':
        # Owner views their reviews — must be logged in
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Login required.'}, status=401)
        shop = getattr(request.user, 'shop', None)
        if not shop:
            return JsonResponse({'error': 'No shop found.'}, status=404)
        from .models import Review
        revs = Review.objects.filter(shop=shop).order_by('-created_at')[:50]
        return JsonResponse({'reviews': [r.to_dict() for r in revs]})

    if request.method == 'POST':
        # Customer submits a review — no auth needed, uses shop_code
        try:
            body          = json.loads(request.body)
            shop_code     = body.get('shop_code', '').strip()
            customer_name = body.get('customer_name', 'Anonymous').strip() or 'Anonymous'
            rating        = int(body.get('rating', 5))
            comment       = body.get('comment', '').strip()

            if not shop_code:
                return JsonResponse({'error': 'shop_code required.'}, status=400)
            if rating < 1 or rating > 5:
                return JsonResponse({'error': 'Rating must be 1-5.'}, status=400)

            from .models import Shop, Review
            try:
                shop = Shop.objects.get(shop_code=shop_code)
            except Shop.DoesNotExist:
                return JsonResponse({'error': 'Shop not found.'}, status=404)

            rev = Review.objects.create(
                shop=shop,
                customer_name=customer_name,
                rating=rating,
                comment=comment,
            )
            return JsonResponse({'success': True, 'review': rev.to_dict()})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'GET or POST only.'}, status=405)