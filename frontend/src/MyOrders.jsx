// MyOrders.jsx — Customer past orders by phone lookup
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from './App';

axios.defaults.withCredentials = true;

const fm = n => `₹${parseFloat(n || 0).toFixed(2)}`;
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');`;

const STATUS_STYLES = {
  pending:          { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '✅', label: 'Order Received' },
  preparing:        { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: '🧺', label: 'Being Prepared' },
  out_for_delivery: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: '🛵', label: 'Out for Delivery' },
  delivered:        { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: '🎁', label: 'Delivered' },
};

/**
 * MyOrders — customer past orders page.
 *
 * Props:
 *   shopCode     — current shop's code
 *   shop         — shop object
 *   onBack       — go back to shop
 *   onTrackOrder — (token) => navigate to track page with that token
 */
export default function MyOrders({ shopCode, shop, onBack, onTrackOrder }) {
  // Pre-fill phone from localStorage if available
  const [phone, setPhone]       = useState(() => localStorage.getItem('kirana_customer_phone') || '');
  const [orders, setOrders]     = useState(null);
  const [custName, setCustName] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Auto-load if phone already known
  useEffect(() => {
    if (phone.trim().length >= 10) fetchOrders(phone.trim());
  }, []);

  const fetchOrders = async (ph) => {
    setLoading(true);
    setError('');
    setOrders(null);
    try {
      const r = await axios.get(`${API}/api/chatbot/my-orders/`, {
        params: { phone: ph, shop_code: shopCode },
      });
      setOrders(r.data.orders || []);
      if (r.data.customer_name) setCustName(r.data.customer_name);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const ph = phone.trim();
    if (ph.length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
    localStorage.setItem('kirana_customer_phone', ph);
    fetchOrders(ph);
  };

  return (
    <div className="min-h-screen bg-[#fdf8f3]" style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl">←</button>
        <div className="flex-1">
          <h2 className="text-white font-black text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>My Orders</h2>
          <p className="text-white/70 text-xs">{shop.name}</p>
        </div>
        {custName && <span className="text-white/80 text-sm font-semibold">👋 {custName}</span>}
      </div>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">

        {/* Phone input */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 space-y-3">
          <div>
            <p className="font-bold text-gray-800 text-sm">📱 Enter your phone number</p>
            <p className="text-gray-400 text-xs mt-0.5">We'll show all your orders from this shop</p>
          </div>
          <div className="flex gap-2">
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              type="tel"
              placeholder="e.g. 9876543210"
              maxLength={10}
              className="flex-1 bg-orange-50 border-2 border-orange-100 focus:border-orange-400 rounded-xl px-3 py-3 text-sm outline-none font-mono text-gray-700"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : '🔍'}
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-sm font-semibold bg-red-50 border border-red-200 rounded-xl px-3 py-2">⚠️ {error}</p>
          )}
        </div>

        {/* Results */}
        {orders !== null && (
          orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-gray-700 font-bold">No orders found</p>
              <p className="text-gray-400 text-sm mt-1">No orders placed with this phone number yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-500 text-xs font-semibold px-1">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
              {orders.map(order => {
                const st = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                const isActive = order.status !== 'delivered';
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                    {/* Order header */}
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-900 text-sm">Order #{order.id}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{order.placed_at}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}>
                            {st.icon} {st.label}
                          </span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.fulfillment_type === 'delivery' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
                            {order.fulfillment_type === 'delivery' ? '🛵 Delivery' : '📦 Pickup'}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-orange-600 text-base shrink-0">{fm(order.grand_total)}</span>
                    </div>

                    {/* Items summary */}
                    {order.items?.length > 0 && (
                      <div className="px-4 pb-3 space-y-1">
                        {order.items.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-gray-500">
                            <span>{item.name} × {item.quantity}{item.unit}</span>
                            <span className="font-semibold">{fm(item.total)}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-400">+{order.items.length - 3} more items</p>
                        )}
                      </div>
                    )}

                    {/* ETA note if active */}
                    {isActive && order.eta_note && (
                      <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <p className="text-amber-700 text-xs font-semibold">⏱️ {order.eta_note}</p>
                      </div>
                    )}

                    {/* Footer actions */}
                    <div className="border-t border-orange-50 px-4 py-3 flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.payment_method === 'upi' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'}`}>
                        {order.payment_method === 'upi' ? '📱 UPI' : '💵 COD'}
                        {order.payment_confirmed ? ' ✓' : ''}
                      </span>
                      <button
                        onClick={() => onTrackOrder(order.token)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 ${isActive ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}
                      >
                        📦 {isActive ? 'Track Live' : 'View Details'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
