# backend/chatbot/ai_logic.py
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from inventory.models import Product

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model='gemini-2.0-flash',
    google_api_key=os.getenv('GOOGLE_API_KEY'),
    temperature=0.3
)

# ── ADMIN BOT ─────────────────────────────────────────────

def ask_admin_bot(message: str, system_context: str = '') -> str:
    """Smart admin bot using Gemini with full shop context."""
    try:
        if system_context:
            result = llm.invoke([
                ('system', system_context),
                ('user', message)
            ])
            return result.content
        # Fallback system prompt if no context sent
        result = llm.invoke([
            ('system', 'You are a helpful assistant for a kirana shop owner in India. Speak in Hinglish. Be concise and practical.'),
            ('user', message)
        ])
        return result.content
    except Exception as e:
        return f"Sorry, AI connection error: {str(e)}"

# ── CUSTOMER BOT ──────────────────────────────────────────

def _get_shop_products(shop_code: str = '') -> str:
    """Get available products, optionally filtered by shop."""
    try:
        if shop_code:
            from shops.models import Shop
            try:
                shop = Shop.objects.get(shop_code=shop_code)
                products = Product.objects.filter(shop=shop, stock_quantity__gt=0).order_by('name')
            except Shop.DoesNotExist:
                products = Product.objects.filter(stock_quantity__gt=0).order_by('name')
        else:
            products = Product.objects.filter(stock_quantity__gt=0).order_by('name')

        if not products.exists():
            return "No products currently available."

        lines = []
        for p in products:
            price_str = f"₹{p.price}/kg" if p.is_loose else f"₹{p.price}"
            stock_str = f"{p.stock_quantity}kg" if p.is_loose else f"{int(p.stock_quantity)} pcs"
            lines.append(f"- {p.name}: {price_str} (stock: {stock_str})")
        return "\n".join(lines)
    except Exception as e:
        return f"Could not load products: {e}"

def _get_shop_info(shop_code: str = '') -> str:
    """Get shop details for customer context."""
    try:
        if not shop_code:
            return ""
        from shops.models import Shop
        shop = Shop.objects.get(shop_code=shop_code)
        info = [
            f"Shop: {shop.name}",
            f"Status: {'Open' if shop.is_open else 'Closed'}",
        ]
        if shop.address:
            info.append(f"Address: {shop.address}")
        if shop.phone:
            info.append(f"Phone: {shop.phone}")
        if shop.offers_delivery:
            info.append(f"Delivery: Available (₹{shop.delivery_base_charge} base, {shop.delivery_base_km}km free radius)")
        else:
            info.append("Delivery: Pickup only")
        if shop.upi_id:
            info.append(f"UPI Payment: Accepted ({shop.upi_id})")
        return "\n".join(info)
    except Exception:
        return ""

CUSTOMER_SYSTEM_TEMPLATE = """You are a friendly, helpful AI assistant for a kirana (grocery) shop. You speak naturally in Hinglish (mix of Hindi and English) because Indian customers are comfortable with it.

{shop_info}

AVAILABLE PRODUCTS:
{products}

YOUR ROLE:
- Help customers find products, check availability and prices
- Suggest alternatives if something is out of stock
- Answer questions about delivery, payments, timing
- Be warm and conversational like a neighbourhood shopkeeper
- Keep responses SHORT and helpful (2-4 sentences max)
- For ordering: tell customers to add items to cart and checkout

IMPORTANT:
- NEVER make up products that aren't listed above
- NEVER discuss admin functions or backend systems
- If asked about something not in stock, suggest the closest available alternative
- Use ₹ for prices, be specific with quantities"""

def ask_customer_bot(message: str, shop_code: str = '') -> str:
    """Customer-facing bot with real product data from the shop."""
    try:
        products = _get_shop_products(shop_code)
        shop_info = _get_shop_info(shop_code)
        system = CUSTOMER_SYSTEM_TEMPLATE.format(products=products, shop_info=shop_info)
        result = llm.invoke([('system', system), ('user', message)])
        return result.content
    except Exception as e:
        return "Sorry, I'm having trouble connecting. Please try again in a moment."