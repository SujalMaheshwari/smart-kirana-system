// CustomerStorefront.jsx — KiranaOS Customer Shopping Experience
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API } from './App';
import TrackOrder from './TrackOrder';
import MyOrders from './MyOrders';

axios.defaults.withCredentials = true;

const fm = n => `₹${parseFloat(n || 0).toFixed(2)}`;
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const CATEGORY_ICONS = { dairy:'🥛',grains:'🌾',snacks:'🍪',beverages:'☕',spices:'🌶️',oil:'🫙',personal:'🧴',cleaning:'🧹',other:'🛒' };
const CATEGORY_COLORS = {
  dairy:'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
  grains:'from-amber-50 to-amber-100 border-amber-200 text-amber-700',
  snacks:'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
  beverages:'from-teal-50 to-teal-100 border-teal-200 text-teal-700',
  spices:'from-red-50 to-red-100 border-red-200 text-red-700',
  oil:'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700',
  personal:'from-pink-50 to-pink-100 border-pink-200 text-pink-700',
  cleaning:'from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-700',
  other:'from-gray-50 to-gray-100 border-gray-200 text-gray-700',
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');`;
const ORDER_STAGES = [
  { key:'pending',          icon:'✅', label:'Order Received',   desc:'Your order is confirmed. Shopkeeper is reviewing it.' },
  { key:'preparing',        icon:'🧺', label:'Being Prepared',   desc:'Your items are being packed carefully.' },
  { key:'out_for_delivery', icon:'🛵', label:'Out for Delivery', desc:'Your order is on its way!' },
  { key:'delivered',        icon:'🎁', label:'Delivered',        desc:'Enjoy your order!' },
];

/* ── Stable input component (defined OUTSIDE renders to prevent focus loss) ── */
const StableInput = ({ label, value, onChange, type='text', placeholder, autoComplete }) => (
  <div>
    <p className="text-xs font-bold text-gray-500 mb-1.5">{label}</p>
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} autoComplete={autoComplete}
      className="w-full bg-orange-50 border-2 border-orange-100 focus:border-orange-400 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none transition-colors placeholder-gray-400"
    />
  </div>
);
const StableTextarea = ({ label, value, onChange, placeholder, rows=2 }) => (
  <div>
    <p className="text-xs font-bold text-gray-500 mb-1.5">{label}</p>
    <textarea
      value={value} onChange={onChange} rows={rows} placeholder={placeholder}
      className="w-full bg-orange-50 border-2 border-orange-100 focus:border-orange-400 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none transition-colors placeholder-gray-400 resize-none"
    />
  </div>
);

/* ─── ROOT ─── */
export default function CustomerStorefront({ shopCode }) {
  const [shop, setShop]         = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [view, setView]         = useState('shop');
  const [cart, setCart]         = useState({});
  const [search, setSearch]     = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [orderResult, setOrderResult] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [initialTrackToken, setInitialTrackToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('track');
    if (tok) { setInitialTrackToken(tok); setView('track'); }
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/shops/${shopCode}/`),
      axios.get(`${API}/api/inventory/products/?shop_code=${shopCode}`),
    ]).then(([shopRes, prodRes]) => {
      setShop(shopRes.data.shop || shopRes.data);
      const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.results || []);
      setProducts(prods.filter(p => parseFloat(p.stock_quantity) > 0));
    }).catch(() => setError('Shop not found or unavailable.')).finally(() => setLoading(false));
  }, [shopCode]);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = products.find(x => x.id === parseInt(id));
    return s + (p ? parseFloat(p.price) * qty : 0);
  }, 0);

  const addToCart = (product, delta=1) => {
    setCart(c => {
      const cur = c[product.id] || 0;
      const newQty = Math.max(0, Math.min(cur + delta, parseFloat(product.stock_quantity)));
      if (newQty === 0) { const n = {...c}; delete n[product.id]; return n; }
      return {...c, [product.id]: newQty};
    });
  };

  const setCartQty = (id, qty) => {
    setCart(c => { if (qty <= 0) { const n={...c}; delete n[id]; return n; } return {...c, [id]: qty}; });
  };

  const categories = ['all', ...new Set(products.map(p => p.category).filter(c => c && c !== 'other'))];
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (activeCategory === 'all' || p.category === activeCategory)
  );

  if (loading) return <SplashLoader />;
  if (error)   return <ErrorPage error={error} />;
  if (!shop)   return <ErrorPage error="Shop not found." />;

  if (view === 'track')    return <TrackOrder shopCode={shopCode} shop={shop} initialToken={initialTrackToken} onBack={() => { setView('shop'); setInitialTrackToken(''); }} />;
  if (view === 'myorders') return <MyOrders shopCode={shopCode} shop={shop} onBack={() => setView('shop')} onTrackOrder={token => { setInitialTrackToken(token); setView('track'); }} />;
  if (view === 'success')  return <SuccessPage order={orderResult} shop={shop} onBack={() => { setView('shop'); setCart({}); setOrderResult(null); }} onTrack={() => { setInitialTrackToken(orderResult.order_token || ''); setView('track'); }} onMyOrders={() => setView('myorders')} />;
  if (view === 'checkout') return <CheckoutPage cart={cart} products={products} shop={shop} cartTotal={cartTotal} onBack={() => setView('cart')} onSuccess={r => { setOrderResult(r); setView('success'); }} />;
  if (view === 'cart') return <CartPage cart={cart} products={products} shop={shop} cartTotal={cartTotal} onBack={() => setView('shop')} onCheckout={() => setView('checkout')} onQtyChange={setCartQty} />;

  return (
    <div className="min-h-screen bg-[#fdf8f3]" style={{fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <style>{`${FONTS}
        .hide-scroll::-webkit-scrollbar{display:none}.hide-scroll{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp 0.3s ease both}
        @keyframes cartPop{0%{transform:scale(1)}50%{transform:scale(1.18)}100%{transform:scale(1)}}.cart-pop{animation:cartPop 0.2s ease}
      `}</style>
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600">
        <div className="absolute inset-0 opacity-10 pointer-events-none"><div className="absolute top-2 left-4 text-6xl rotate-12">🥦</div><div className="absolute top-4 right-8 text-5xl -rotate-6">🌾</div><div className="absolute bottom-2 left-16 text-4xl rotate-6">🌶️</div><div className="absolute bottom-4 right-4 text-5xl -rotate-12">🫙</div></div>
        <div className="relative px-5 pt-8 pb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl border border-white/30 shadow-lg shrink-0">{shop.logo_emoji||'🏪'}</div>
              <div>
                <h1 className="text-white font-black text-xl leading-tight" style={{fontFamily:"'Space Grotesk',sans-serif"}}>{shop.name}</h1>
                {shop.tagline&&<p className="text-white/75 text-sm mt-0.5">{shop.tagline}</p>}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${shop.is_open?'bg-green-300 animate-pulse':'bg-red-300'}`}/>
                  <span className="text-white/80 text-xs font-semibold">{shop.is_open?'Open now':'Currently closed'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setView('track')} className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/25 transition-colors">📦 Track</button>
            <button onClick={() => setView('myorders')} className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/25 transition-colors">🧾 Orders</button>
          </div>
          <div className="mt-5 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full bg-white rounded-2xl pl-10 pr-4 py-3.5 text-sm text-gray-800 outline-none shadow-lg placeholder-gray-400 font-medium"/>
          </div>
        </div>
      </div>
      {/* CATEGORIES */}
      {categories.length > 1 && (
        <div className="bg-white border-b border-orange-100 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto hide-scroll">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all capitalize ${activeCategory===cat?'bg-orange-500 text-white border-orange-500 shadow-md':'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}>
                {cat !== 'all' && <span>{CATEGORY_ICONS[cat]||'🛒'}</span>}
                <span>{cat==='all'?'🏪 All':cat}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* PRODUCTS */}
      <div className="px-4 py-4 pb-36 space-y-3">
        {activeCategory==='all' && !search ? (
          Object.entries(products.reduce((acc,p)=>{const c=p.category||'other';if(!acc[c])acc[c]=[];acc[c].push(p);return acc;},{}))
            .map(([cat,catProducts])=>(
              <div key={cat} className="space-y-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r border ${CATEGORY_COLORS[cat]||CATEGORY_COLORS.other}`}>
                  <span className="text-xl">{CATEGORY_ICONS[cat]||'🛒'}</span>
                  <span className="font-bold text-sm capitalize">{cat==='other'?'Other Items':cat}</span>
                  <span className="ml-auto text-xs font-semibold opacity-70">{catProducts.length} items</span>
                </div>
                {catProducts.map(p=><ProductCard key={p.id} product={p} qty={cart[p.id]||0} onAdd={()=>addToCart(p)} onRemove={()=>addToCart(p,-1)}/>)}
              </div>
            ))
        ) : (
          filtered.length===0
            ? <div className="text-center py-16"><p className="text-5xl mb-3">🔍</p><p className="text-gray-500 font-semibold">No products found</p></div>
            : filtered.map(p=><ProductCard key={p.id} product={p} qty={cart[p.id]||0} onAdd={()=>addToCart(p)} onRemove={()=>addToCart(p,-1)}/>)
        )}
      </div>
      {/* CART BAR */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#fdf8f3] via-[#fdf8f3]/90 to-transparent pointer-events-none z-20">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button onClick={()=>setView('cart')} className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white py-4 rounded-2xl font-black text-base flex items-center justify-between px-5 shadow-2xl shadow-orange-400/40 transition-all" style={{fontFamily:"'Space Grotesk',sans-serif"}}>
              <div className="bg-white/20 rounded-xl px-3 py-1 text-sm font-bold">{cartCount} items</div>
              <span>View Cart →</span>
              <span>{fm(cartTotal)}</span>
            </button>
          </div>
        </div>
      )}
      <button onClick={()=>setChatOpen(true)} className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl shadow-xl shadow-orange-300/50 flex items-center justify-center text-2xl z-10 hover:scale-110 transition-transform">🤖</button>
      {chatOpen && <ChatWidget shopCode={shopCode} shop={shop} onClose={()=>setChatOpen(false)} />}
    </div>
  );
}

/* ─── PRODUCT CARD ─── */
function ProductCard({ product, qty, onAdd, onRemove }) {
  const [popped, setPopped] = useState(false);
  const color = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.other;
  const isLow = parseFloat(product.stock_quantity) <= parseFloat(product.min_stock_level||5);
  const handleAdd = () => { onAdd(); setPopped(true); setTimeout(()=>setPopped(false),250); };
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden fade-up">
      <div className="flex items-center gap-3 p-3.5">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br border flex items-center justify-center text-2xl shrink-0 ${color}`}>{CATEGORY_ICONS[product.category]||'🛒'}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-snug">{product.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-orange-600 font-black text-base">{fm(product.price)}{product.is_loose?'/kg':''}</span>
            {product.is_loose&&<span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold border border-orange-200">Loose</span>}
            {isLow&&<span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">⚡ Only {product.stock_quantity} left</span>}
          </div>
          {product.description&&<p className="text-gray-400 text-xs mt-0.5 truncate">{product.description}</p>}
        </div>
        {qty===0
          ? <button onClick={handleAdd} className={`shrink-0 w-11 h-11 bg-orange-500 hover:bg-orange-600 active:scale-90 text-white rounded-xl font-black text-xl shadow-md shadow-orange-200 transition-all flex items-center justify-center ${popped?'cart-pop':''}`}>+</button>
          : <div className="shrink-0 flex items-center gap-1 bg-orange-50 border-2 border-orange-400 rounded-xl p-1">
              <button onClick={onRemove} className="w-8 h-8 rounded-lg text-orange-600 hover:bg-orange-100 font-black text-lg flex items-center justify-center">−</button>
              <span className="w-7 text-center text-orange-700 font-black text-sm">{qty}</span>
              <button onClick={onAdd} className="w-8 h-8 rounded-lg text-orange-600 hover:bg-orange-100 font-black text-lg flex items-center justify-center">+</button>
            </div>
        }
      </div>
      {qty>0&&<div className="bg-orange-50 border-t border-orange-100 px-4 py-1.5 flex justify-between"><span className="text-orange-600 text-xs font-semibold">{qty} {product.is_loose?'kg':qty===1?'piece':'pieces'}</span><span className="text-orange-700 font-black text-sm">{fm(parseFloat(product.price)*qty)}</span></div>}
    </div>
  );
}

/* ─── CART PAGE ─── */
function CartPage({ cart, products, shop, cartTotal, onBack, onCheckout, onQtyChange }) {
  const items = Object.entries(cart).map(([id,qty])=>({p:products.find(x=>x.id===parseInt(id)),qty})).filter(i=>i.p);
  return (
    <div className="min-h-screen bg-[#fdf8f3]" style={{fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <style>{FONTS}</style>
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl">←</button>
        <h2 className="text-white font-black text-lg flex-1" style={{fontFamily:"'Space Grotesk',sans-serif"}}>Your Cart</h2>
      </div>
      <div className="px-4 py-4 space-y-3 pb-36">
        {items.map(({p,qty})=>(
          <div key={p.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br border flex items-center justify-center text-xl shrink-0 ${CATEGORY_COLORS[p.category]||CATEGORY_COLORS.other}`}>{CATEGORY_ICONS[p.category]||'🛒'}</div>
            <div className="flex-1 min-w-0"><p className="font-bold text-gray-900 text-sm">{p.name}</p><p className="text-orange-600 font-black text-sm">{fm(p.price)}{p.is_loose?'/kg':''}</p></div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-orange-50 border-2 border-orange-300 rounded-xl p-0.5">
                <button onClick={()=>onQtyChange(p.id,qty-1)} className="w-7 h-7 rounded-lg text-orange-600 font-black flex items-center justify-center hover:bg-orange-100">−</button>
                <span className="w-6 text-center text-orange-700 font-black text-sm">{qty}</span>
                <button onClick={()=>onQtyChange(p.id,Math.min(qty+1,parseFloat(p.stock_quantity)))} className="w-7 h-7 rounded-lg text-orange-600 font-black flex items-center justify-center hover:bg-orange-100">+</button>
              </div>
              <span className="text-gray-900 font-black text-sm w-16 text-right">{fm(parseFloat(p.price)*qty)}</span>
            </div>
          </div>
        ))}
        <div className="bg-white rounded-2xl border border-orange-100 p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span className="font-bold">{fm(cartTotal)}</span></div>
          {shop.offers_delivery&&<div className="flex justify-between text-sm text-gray-400"><span>Delivery</span><span className="text-xs">Calculated at checkout</span></div>}
          <div className="border-t border-gray-100 pt-2 flex justify-between"><span className="font-bold text-gray-900">Total</span><span className="font-black text-orange-600 text-lg">{fm(cartTotal)}</span></div>
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-orange-100">
        <button onClick={onCheckout} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-base" style={{fontFamily:"'Space Grotesk',sans-serif"}}>Proceed to Checkout →</button>
      </div>
    </div>
  );
}

/* ─── CHECKOUT PAGE ─── */
function CheckoutPage({ cart, products, shop, cartTotal, onBack, onSuccess }) {
  // Load saved customer info from localStorage
  const [name, setName]           = useState(() => localStorage.getItem('kirana_customer_name') || '');
  const [phone, setPhone]         = useState(() => localStorage.getItem('kirana_customer_phone') || '');
  const [payment, setPayment]     = useState('cash');
  const [fulfillment, setFulfillment] = useState(shop.offers_delivery ? 'delivery' : 'pickup');
  const [address, setAddress]     = useState(() => localStorage.getItem('kirana_customer_address') || '');
  const [mapOpen, setMapOpen]     = useState(false);
  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);
  const [distanceKm, setDistanceKm]   = useState(null);
  const [placing, setPlacing]     = useState(false);
  const [error, setError]         = useState('');
  const [upiConfirmed, setUpiConfirmed] = useState(false);
  const [upiRef, setUpiRef]       = useState('');

  const maxRadius = parseFloat(shop.delivery_radius_km) || 5;
  const baseKm    = parseFloat(shop.delivery_base_km) || 2;
  const baseCharge = parseFloat(shop.delivery_base_charge) || 20;
  const perKm     = parseFloat(shop.delivery_per_km) || 10;

  const computedDelivery = (() => {
    if (fulfillment !== 'delivery') return 0;
    if (distanceKm !== null) {
      if (distanceKm > maxRadius) return -1; // out of range
      const extra = Math.max(0, distanceKm - baseKm);
      return baseCharge + extra * perKm;
    }
    return baseCharge;
  })();

  const deliveryCharge = computedDelivery === -1 ? 0 : computedDelivery;
  const outOfRange = computedDelivery === -1;
  const grandTotal = cartTotal + deliveryCharge;

  const upiId   = shop.upi_id || '';
  const upiLink = upiId ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shop.name)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order from '+shop.name)}` : '';
  const upiQrUrl = upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}&bgcolor=fff7ed&color=ea580c&margin=10` : '';

  // Save name/phone/address to localStorage whenever they change
  const handleName = e => { setName(e.target.value); localStorage.setItem('kirana_customer_name', e.target.value); };
  const handlePhone = e => { setPhone(e.target.value); localStorage.setItem('kirana_customer_phone', e.target.value); };
  const handleAddress = e => { setAddress(e.target.value); localStorage.setItem('kirana_customer_address', e.target.value); };

  const place = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (fulfillment === 'delivery' && !address.trim()) { setError('Please enter your delivery address.'); return; }
    if (fulfillment === 'delivery' && outOfRange) { setError(`Sorry, we cannot deliver beyond ${maxRadius}km from the shop.`); return; }
    if (payment === 'upi' && !upiConfirmed) { setError('Please confirm you have completed the UPI payment before placing the order.'); return; }
    setPlacing(true);
    try {
      const cartArr = Object.entries(cart).map(([id,qty]) => {
        const p = products.find(x => x.id === parseInt(id));
        return { id: parseInt(id), quantity: qty, unit: p?.is_loose ? 'kg' : 'pcs', line_total: parseFloat(p.price) * qty };
      });
      const r = await axios.post(`${API}/api/chatbot/checkout/`, {
        shop_code: shop.shop_code, cart: cartArr,
        customer_name: name.trim(), customer_phone: phone.trim(),
        payment_method: payment, fulfillment_type: fulfillment,
        delivery_address: address.trim(), delivery_charge: deliveryCharge,
        delivery_lat: deliveryLat, delivery_lng: deliveryLng, distance_km: distanceKm || 0,
        upi_ref: upiRef.trim(),
      });
      if (r.data.success) onSuccess({...r.data, payment_method: payment, upi_id: upiId, upi_link: upiLink});
      else setError(r.data.error || 'Order failed.');
    } catch(e) { setError(e.response?.data?.error || 'Something went wrong.'); }
    finally { setPlacing(false); }
  };

  return (
    <div className="min-h-screen bg-[#fdf8f3]" style={{fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <style>{FONTS}</style>
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl">←</button>
        <h2 className="text-white font-black text-lg" style={{fontFamily:"'Space Grotesk',sans-serif"}}>Checkout</h2>
      </div>

      <div className="px-4 py-4 space-y-3 pb-36">
        {error && <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm font-semibold">⚠️ {error}</div>}

        {/* Details */}
        <div className="bg-white rounded-2xl border border-orange-100 p-4 space-y-3">
          <p className="font-bold text-gray-800 text-sm">👤 Your Details</p>
          <StableInput label="Your Name *" value={name} onChange={handleName} placeholder="e.g. Ramesh Kumar" autoComplete="name" />
          <StableInput label="Phone (optional)" value={phone} onChange={handlePhone} type="tel" placeholder="e.g. 9876543210" autoComplete="tel" />
          <p className="text-gray-400 text-xs">💾 Your details are saved automatically for next time.</p>
        </div>

        {/* Delivery / Pickup */}
        {shop.offers_delivery && (
          <div className="bg-white rounded-2xl border border-orange-100 p-4 space-y-3">
            <p className="font-bold text-gray-800 text-sm">🚚 Delivery or Pickup?</p>
            <div className="grid grid-cols-2 gap-2">
              {[['delivery','🛵','Home Delivery',`from ₹${baseCharge}`],['pickup','📦','Self Pickup','Free']].map(([v,icon,label,note])=>(
                <button key={v} onClick={()=>setFulfillment(v)} className={`py-3.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${fulfillment===v?'border-orange-500 bg-orange-50':'border-gray-200 bg-white'}`}>
                  <span className="text-2xl">{icon}</span>
                  <span className={`text-sm font-bold ${fulfillment===v?'text-orange-700':'text-gray-700'}`}>{label}</span>
                  <span className={`text-xs ${fulfillment===v?'text-orange-500':'text-gray-400'}`}>{note}</span>
                </button>
              ))}
            </div>

            {fulfillment === 'delivery' && (
              <>
                <StableTextarea label="Delivery Address *" value={address} onChange={handleAddress} placeholder="House/flat no., street, area, landmark..." />

                {/* Map picker */}
                <button onClick={()=>setMapOpen(true)}
                  className="w-full flex items-center justify-between bg-blue-50 border-2 border-blue-200 hover:border-blue-400 rounded-xl px-3 py-3 text-sm transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <div className="text-left">
                      <p className="font-bold text-blue-700 text-sm">Pick on Map</p>
                      <p className="text-blue-500 text-xs">Auto-calculates delivery charge</p>
                    </div>
                  </div>
                  {distanceKm !== null
                    ? <span className={`text-sm font-black ${outOfRange?'text-red-600':'text-green-600'}`}>{distanceKm.toFixed(1)} km</span>
                    : <span className="text-blue-400 text-xl">→</span>
                  }
                </button>

                {mapOpen && <MapPicker shop={shop} onSelect={(lat,lng,km,addr)=>{ setDeliveryLat(lat); setDeliveryLng(lng); setDistanceKm(km); if(addr){setAddress(addr);localStorage.setItem('kirana_customer_address',addr);} setMapOpen(false); }} onClose={()=>setMapOpen(false)}/>}

                {outOfRange && <div className="bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-sm font-semibold">⚠️ Sorry, delivery is only available within {maxRadius}km from the shop. Your location is {distanceKm?.toFixed(1)}km away.</div>}

                {distanceKm !== null && !outOfRange && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl px-3 py-2 text-green-700 text-sm">
                    📏 Distance: <strong>{distanceKm.toFixed(1)} km</strong> · Delivery charge: <strong>{fm(deliveryCharge)}</strong>
                    {distanceKm <= baseKm && <span className="text-green-600 text-xs ml-1">(within free radius)</span>}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-orange-100 p-4 space-y-3">
          <p className="font-bold text-gray-800 text-sm">💳 Payment</p>
          {[['cash','💵','Cash on Delivery','Pay when you receive'],
            ...(upiId?[['upi','📱','UPI Payment',`Pay ₹ to ${upiId}`]]:[])
          ].map(([v,icon,label,sub])=>(
            <button key={v} onClick={()=>{setPayment(v);setUpiConfirmed(false);}} className={`w-full py-3 px-4 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${payment===v?'border-orange-500 bg-orange-50':'border-gray-200'}`}>
              <span className="text-2xl">{icon}</span>
              <div className="flex-1"><p className={`text-sm font-bold ${payment===v?'text-orange-700':'text-gray-800'}`}>{label}</p><p className={`text-xs ${payment===v?'text-orange-500':'text-gray-400'}`}>{sub}</p></div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payment===v?'border-orange-500 bg-orange-500':'border-gray-300'}`}>{payment===v&&<div className="w-2 h-2 bg-white rounded-full"/>}</div>
            </button>
          ))}

          {/* UPI Flow */}
          {payment==='upi'&&upiId&&(
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 space-y-3">
              <p className="font-bold text-orange-800 text-sm text-center">Step 1 — Pay {fm(grandTotal)}</p>
              <div className="flex justify-center"><div className="bg-white rounded-2xl p-3 shadow border border-orange-200 inline-block"><img src={upiQrUrl} alt="UPI QR" width={160} height={160} className="block rounded-xl"/></div></div>
              <p className="text-orange-700 text-xs text-center">UPI ID: <strong className="font-mono">{upiId}</strong></p>
              <a href={upiLink} className="block w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm text-center">📱 Open UPI App →</a>
              <div className="border-t border-orange-200 pt-3 space-y-2">
                <p className="font-bold text-orange-800 text-sm">Step 2 — Enter Payment Reference</p>
                <StableInput label="UPI Transaction ID / UTR (optional but helpful)" value={upiRef} onChange={e=>setUpiRef(e.target.value)} placeholder="e.g. 4238XXXXXXXX" />
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={upiConfirmed} onChange={e=>setUpiConfirmed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-500 shrink-0"/>
                  <span className="text-sm text-gray-700 font-semibold">I have completed the UPI payment of <span className="text-orange-600 font-black">{fm(grandTotal)}</span></span>
                </label>
                {!upiConfirmed && <p className="text-amber-600 text-xs font-semibold">⚠️ Please pay first and tick the checkbox above, then place your order.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Bill */}
        <div className="bg-white rounded-2xl border border-orange-100 p-4 space-y-2">
          <p className="font-bold text-gray-800 text-sm">🧾 Bill</p>
          {Object.entries(cart).map(([id,qty])=>{const p=products.find(x=>x.id===parseInt(id));if(!p)return null;return<div key={id} className="flex justify-between text-sm text-gray-600"><span>{p.name} × {qty}</span><span className="font-bold">{fm(parseFloat(p.price)*qty)}</span></div>;})}
          {deliveryCharge>0&&<div className="flex justify-between text-sm text-gray-600"><span>Delivery ({distanceKm?distanceKm.toFixed(1)+'km':'est.'})</span><span className="font-bold">{fm(deliveryCharge)}</span></div>}
          <div className="border-t border-gray-100 pt-2 flex justify-between"><span className="font-bold text-gray-900">Total</span><span className="font-black text-orange-600 text-lg">{fm(grandTotal)}</span></div>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-orange-100">
        <button onClick={place} disabled={placing||outOfRange} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2" style={{fontFamily:"'Space Grotesk',sans-serif"}}>
          {placing?<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Placing...</span></>:<>Place Order · {fm(grandTotal)}</>}
        </button>
      </div>
    </div>
  );
}

/* ─── MAP PICKER ─── */
function MapPicker({ shop, onSelect, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | locating | done | error
  const [userPos, setUserPos]   = useState(null);
  const [distance, setDistance] = useState(null);
  const [manualAddr, setManualAddr] = useState('');

  // Haversine distance in km
  const haversine = (lat1,lng1,lat2,lng2) => {
    const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  };

  const locate = () => {
    setStatus('locating');
    if (!navigator.geolocation) { setStatus('error'); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setUserPos({lat,lng});
      if (shop.latitude && shop.longitude) {
        const d = haversine(lat,lng,parseFloat(shop.latitude),parseFloat(shop.longitude));
        setDistance(d);
      }
      setStatus('done');
    }, () => setStatus('error'), { enableHighAccuracy:true, timeout:10000 });
  };

  const confirm = () => {
    if (userPos) onSelect(userPos.lat, userPos.lng, distance, manualAddr||null);
    else onClose();
  };

  const maxRadius = parseFloat(shop.delivery_radius_km)||5;
  const outOfRange = distance !== null && distance > maxRadius;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="font-black text-gray-900 text-lg">📍 Set Delivery Location</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Shop info */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm">
          <p className="font-bold text-orange-800">🏪 {shop.name}</p>
          {shop.address && <p className="text-orange-600 text-xs mt-0.5">{shop.address}</p>}
          <p className="text-orange-500 text-xs mt-1">Max delivery: <strong>{maxRadius}km</strong> · Base charge: <strong>₹{shop.delivery_base_charge||20}</strong></p>
        </div>

        {status === 'idle' && (
          <button onClick={locate} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2">
            📍 Use My Current Location
          </button>
        )}

        {status === 'locating' && (
          <div className="text-center py-6 space-y-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"/>
            <p className="text-gray-600 font-semibold">Getting your location...</p>
            <p className="text-gray-400 text-sm">Please allow location access if prompted</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <p className="font-bold">📵 Location access denied</p>
              <p className="mt-0.5 text-xs">Please enter your address manually below and we'll estimate the delivery charge.</p>
            </div>
            <button onClick={locate} className="w-full border-2 border-blue-400 text-blue-600 py-3 rounded-xl font-bold text-sm">Try Again</button>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-3">
            {distance !== null ? (
              <div className={`border-2 rounded-xl p-3 text-sm ${outOfRange?'bg-red-50 border-red-200':'bg-green-50 border-green-200'}`}>
                {outOfRange ? (
                  <><p className="font-bold text-red-700">❌ Out of Delivery Range</p><p className="text-red-600 text-xs mt-0.5">Your location is <strong>{distance.toFixed(1)}km</strong> away. We deliver within {maxRadius}km only.</p></>
                ) : (
                  <><p className="font-bold text-green-700">✅ Location Confirmed</p><p className="text-green-600 text-xs mt-0.5">Distance: <strong>{distance.toFixed(1)}km</strong> · Delivery charge: <strong>₹{(parseFloat(shop.delivery_base_charge)||20) + Math.max(0,(distance-(parseFloat(shop.delivery_base_km)||2)))*(parseFloat(shop.delivery_per_km)||10)}</strong></p></>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                <p className="font-bold">📍 Location detected</p>
                <p className="text-xs mt-0.5">Shop location not set by owner — standard delivery charge applies.</p>
              </div>
            )}
            <StableInput label="Confirm your address (optional)" value={manualAddr} onChange={e=>setManualAddr(e.target.value)} placeholder="e.g. Flat 5, Shyam Nagar, near temple" />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-600">Cancel</button>
              <button onClick={confirm} disabled={outOfRange} className="flex-1 py-3 bg-orange-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm">
                {outOfRange ? 'Out of Range' : 'Confirm Location'}
              </button>
            </div>
          </div>
        )}

        {/* Google Maps embed if shop has coords */}
        {shop.latitude && shop.longitude && (
          <div className="rounded-xl overflow-hidden border border-gray-200 h-36">
            <iframe
              title="Shop Location"
              width="100%" height="100%"
              style={{border:0}}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${shop.latitude},${shop.longitude}&z=14&output=embed`}
            />
          </div>
        )}
        <p className="text-gray-400 text-xs text-center">Your location is only used to calculate delivery distance. We don't store it.</p>
      </div>
    </div>
  );
}

/* ─── SUCCESS PAGE ─── */
function SuccessPage({ order, shop, onBack, onTrack, onMyOrders }) {
  const [copied, setCopied] = useState(false);
  const copyToken = () => {
    navigator.clipboard.writeText(order.order_token || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-[#fdf8f3] flex flex-col items-center justify-center px-4 py-8 text-center" style={{fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <style>{FONTS}</style>
      <div className="bg-white rounded-3xl border border-orange-100 shadow-2xl shadow-orange-100 p-7 max-w-sm w-full space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="font-black text-gray-900 text-2xl" style={{fontFamily:"'Space Grotesk',sans-serif"}}>Order Placed!</h2>
        <p className="text-gray-500 text-sm">Thank you, <strong>{order.customer_name}</strong>!</p>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-left space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Order #</span><span className="font-black font-mono">{order.order_id}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span><span className="font-black text-orange-600">{fm(order.grand_total)}</span></div>
          <div className="flex justify-between text-sm items-center"><span className="text-gray-500">Payment</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.payment_method==='upi'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>{order.payment_method==='upi'?'📱 UPI':'💵 COD'}</span>
          </div>
          {order.delivery_address&&<div className="flex justify-between text-sm gap-2"><span className="text-gray-500 shrink-0">Deliver to</span><span className="text-xs text-right text-gray-700 font-semibold">{order.delivery_address}</span></div>}
        </div>
        {/* Tracking token — save this! */}
        {order.order_token && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 text-left space-y-1.5">
            <p className="text-amber-800 font-bold text-xs">📋 Save your tracking token</p>
            <div className="flex items-center gap-2">
              <p className="text-amber-700 font-mono text-xs flex-1 break-all">{order.order_token}</p>
              <button onClick={copyToken} className="shrink-0 text-xs bg-amber-200 hover:bg-amber-300 text-amber-800 font-bold px-2 py-1 rounded-lg">
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <p className="text-amber-600 text-xs">Use this to track your order anytime</p>
          </div>
        )}
        {order.payment_method==='upi'&&order.upi_id&&(
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-3 text-sm">
            <p className="text-purple-800 font-bold mb-1">✅ Payment Confirmed</p>
            <p className="text-purple-600 text-xs">Your UPI payment to <strong>{order.upi_id}</strong> has been recorded.</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={onTrack} className="py-3 rounded-xl border-2 border-orange-400 text-orange-600 font-bold text-xs hover:bg-orange-50">📦 Track</button>
          <button onClick={onMyOrders} className="py-3 rounded-xl border-2 border-amber-400 text-amber-600 font-bold text-xs hover:bg-amber-50">🧾 Orders</button>
          <button onClick={onBack} className="py-3 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600">Shop More</button>
        </div>
        <p className="text-gray-400 text-xs">{shop.name} will process your order shortly.</p>
      </div>
    </div>
  );
}

/* ─── CHAT WIDGET ─── */
function ChatWidget({ shopCode, shop, onClose }) {
  const [messages,setMessages]=useState([{sender:'bot',text:`Namaste! 🙏 How can I help you with ${shop.name} today?`,time:nowTime()}]);
  const [input,setInput]=useState(''); const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages,loading]);
  const send=async(text)=>{
    if(!text.trim()||loading)return;
    setMessages(m=>[...m,{sender:'user',text,time:nowTime()}]);
    setInput(''); setLoading(true);
    try{const r=await axios.post(`${API}/api/chatbot/customer/`,{message:text,shop_code:shopCode});setMessages(m=>[...m,{sender:'bot',text:r.data.reply,time:nowTime()}]);}
    catch{setMessages(m=>[...m,{sender:'bot',text:'Sorry, trouble connecting.',time:nowTime()}]);}
    finally{setLoading(false);}
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center gap-3 rounded-t-3xl">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl border border-white/30">🤖</div>
          <div className="flex-1"><p className="text-white font-bold text-sm">{shop.name}</p><p className="text-white/70 text-xs">AI Assistant</p></div>
          <button onClick={onClose} className="text-white/80 hover:text-white w-8 h-8 flex items-center justify-center text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-orange-50/30">
          {messages.map((m,i)=>(
            <div key={i} className={`flex ${m.sender==='user'?'justify-end':'justify-start'} items-end gap-2`}>
              {m.sender==='bot'&&<div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-sm shrink-0">🤖</div>}
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${m.sender==='user'?'bg-orange-500 text-white rounded-tr-none':'bg-white border border-orange-100 text-gray-700 rounded-tl-none shadow-sm'}`}>
                {m.text}<div className={`text-[10px] mt-1 ${m.sender==='user'?'text-white/50 text-right':'text-gray-400'}`}>{m.time}</div>
              </div>
            </div>
          ))}
          {loading&&<div className="flex items-end gap-2"><div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-sm shrink-0">🤖</div><div className="bg-white border border-orange-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5">{[0,1,2].map(i=><div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:`${i*150}ms`}}/>)}</div></div>}
          <div ref={endRef}/>
        </div>
        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto border-t border-orange-100 bg-white" style={{scrollbarWidth:'none'}}>
          {['What\'s available?','Do you deliver?','Timings?'].map((q,i)=>(
            <button key={i} onClick={()=>send(q)} disabled={loading} className="shrink-0 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1.5 rounded-full font-semibold disabled:opacity-40 whitespace-nowrap">{q}</button>
          ))}
        </div>
        <div className="p-3 bg-white border-t border-orange-100 flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send(input)} placeholder="Ask anything..." disabled={loading}
            className="flex-1 bg-orange-50 border-2 border-orange-100 focus:border-orange-400 rounded-xl px-3 py-2.5 text-sm outline-none placeholder-gray-400"/>
          <button onClick={()=>send(input)} disabled={loading||!input.trim()} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white w-11 h-11 rounded-xl font-bold text-lg flex items-center justify-center">→</button>
        </div>
      </div>
    </div>
  );
}

function SplashLoader() {
  return <div className="min-h-screen bg-gradient-to-b from-orange-500 to-amber-500 flex flex-col items-center justify-center gap-5"><style>{FONTS}</style><div className="text-7xl animate-bounce">🏪</div><div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"/><p className="text-white/80 font-semibold text-sm">Loading your shop...</p></div>;
}
function ErrorPage({ error }) {
  return <div className="min-h-screen bg-[#fdf8f3] flex flex-col items-center justify-center text-center px-4"><style>{FONTS}</style><p className="text-7xl mb-4">😕</p><h2 className="text-gray-900 font-black text-xl mb-2">Oops!</h2><p className="text-gray-500 text-sm">{error}</p></div>;
}