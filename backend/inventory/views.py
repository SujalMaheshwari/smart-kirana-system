# backend/inventory/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count
from .models import Product, CATEGORY_CHOICES


def _get_shop(request):
    """Return (shop, error_response). If user not logged in or has no shop, return error."""
    if not request.user.is_authenticated:
        return None, JsonResponse({'error': 'Login required.'}, status=401)
    shop = getattr(request.user, 'shop', None)
    if not shop:
        return None, JsonResponse({'error': 'No shop found for this account.'}, status=404)
    return shop, None


# ── OWNER: full product list (all stock levels) ────────────────────────────────

def products_list(request):
    shop, err = _get_shop(request)
    if err: return err
    products = Product.objects.filter(shop=shop).order_by('name')
    return JsonResponse([p.to_dict() for p in products], safe=False)


# ── OWNER: get / update / delete a single product ─────────────────────────────

def product_detail(request, pk):
    shop, err = _get_shop(request)
    if err: return err
    try:
        p = Product.objects.get(pk=pk, shop=shop)
        return JsonResponse(p.to_dict())
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)


@csrf_exempt
def product_create(request):
    """POST — create a new product for the logged-in shop."""
    shop, err = _get_shop(request)
    if err: return err
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    try:
        body = json.loads(request.body)
        name = body.get('name', '').strip()
        if not name:
            return JsonResponse({'error': 'Product name is required.'}, status=400)
        price = float(body.get('price', 0))
        if price <= 0:
            return JsonResponse({'error': 'Price must be greater than 0.'}, status=400)

        # Handle optional barcode — must be unique or None
        barcode = body.get('barcode', '').strip() or None

        p = Product.objects.create(
            shop=shop,
            name=name,
            price=price,
            category=body.get('category', 'other'),
            stock_quantity=float(body.get('stock_quantity', 0)),
            min_stock_level=float(body.get('min_stock_level', 5)),
            is_loose=bool(body.get('is_loose', False)),
            description=body.get('description', ''),
            barcode=barcode,
        )
        return JsonResponse({'success': True, 'product': p.to_dict()})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def product_update(request, pk):
    """POST/PATCH — update any field of a product."""
    shop, err = _get_shop(request)
    if err: return err
    if request.method not in ('POST', 'PATCH'):
        return JsonResponse({'error': 'POST/PATCH only'}, status=405)
    try:
        p = Product.objects.get(pk=pk, shop=shop)
        body = json.loads(request.body)

        if 'name' in body:
            p.name = body['name'].strip()
        if 'price' in body:
            p.price = float(body['price'])
        if 'category' in body:
            p.category = body['category']
        if 'stock_quantity' in body:
            p.stock_quantity = float(body['stock_quantity'])
        if 'min_stock_level' in body:
            p.min_stock_level = float(body['min_stock_level'])
        if 'is_loose' in body:
            p.is_loose = bool(body['is_loose'])
        if 'description' in body:
            p.description = body['description']
        if 'barcode' in body:
            p.barcode = body['barcode'].strip() or None

        p.save()
        return JsonResponse({'success': True, 'product': p.to_dict()})
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def product_update_stock(request, pk):
    """POST/PATCH — update only stock_quantity (used by Inventory tab Save button)."""
    shop, err = _get_shop(request)
    if err: return err
    if request.method not in ('POST', 'PATCH'):
        return JsonResponse({'error': 'POST/PATCH only'}, status=405)
    try:
        p = Product.objects.get(pk=pk, shop=shop)
        body = json.loads(request.body)
        p.stock_quantity = float(body.get('stock_quantity', p.stock_quantity))
        p.save()
        return JsonResponse({'success': True, 'product': p.to_dict()})
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def product_delete(request, pk):
    """DELETE — remove a product from the shop."""
    shop, err = _get_shop(request)
    if err: return err
    if request.method != 'DELETE':
        return JsonResponse({'error': 'DELETE only'}, status=405)
    try:
        p = Product.objects.get(pk=pk, shop=shop)
        p.delete()
        return JsonResponse({'success': True})
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)


# ── BARCODE LOOKUP (owner-scoped) ──────────────────────────────────────────────

def barcode_lookup(request, barcode):
    shop, err = _get_shop(request)
    if err: return err
    try:
        p = Product.objects.get(barcode=barcode, shop=shop)
        return JsonResponse(p.to_dict())
    except Product.DoesNotExist:
        return JsonResponse({'error': f'No product for barcode: {barcode}'}, status=404)


# ── PUBLIC BROWSE (customer-facing, shop-scoped by shop_code param) ────────────

def browse(request):
    """
    Public endpoint — does NOT require login.
    Requires ?shop_code=xxx so each customer sees only their shop's products.
    """
    shop_code = request.GET.get('shop_code', '').strip()
    if not shop_code:
        return JsonResponse({'error': 'shop_code is required.'}, status=400)

    try:
        from shops.models import Shop
        shop = Shop.objects.get(shop_code=shop_code)
    except Exception:
        return JsonResponse({'error': 'Shop not found.'}, status=404)

    qs = Product.objects.filter(shop=shop)
    if request.GET.get('in_stock', 'true') == 'true':
        qs = qs.filter(stock_quantity__gt=0)

    cat = request.GET.get('category', '').strip()
    if cat and cat != 'all':
        qs = qs.filter(category=cat)

    search = request.GET.get('search', '').strip()
    if search:
        qs = qs.filter(name__icontains=search)

    sort_map = {'name': 'name', 'price_asc': 'price', 'price_desc': '-price', 'stock': '-stock_quantity'}
    qs = qs.order_by(sort_map.get(request.GET.get('sort', 'name'), 'name'))

    cat_counts = (Product.objects.filter(shop=shop, stock_quantity__gt=0)
                  .values('category').annotate(count=Count('id')))
    categories = [
        {'value': c['category'], 'label': dict(CATEGORY_CHOICES).get(c['category'], c['category']), 'count': c['count']}
        for c in cat_counts
    ]

    return JsonResponse({'products': [p.to_dict() for p in qs], 'categories': categories, 'total': qs.count()})