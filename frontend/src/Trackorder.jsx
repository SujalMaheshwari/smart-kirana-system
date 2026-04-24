// TrackOrder.jsx — Secure order tracking using UUID token (not guessable ID)
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from './App';

axios.defaults.withCredentials = true;

const fm = n => `₹${parseFloat(n || 0).toFixed(2)}`;
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');`;

const DELIVERY_STAGES = [
  { key: 'pending',          icon: '✅', label: 'Order Received',   desc: 'Your order is confirmed. Shopkeeper is reviewing it.' },
  { key: 'preparing',        icon: '🧺', label: 'Being Prepared',   desc: 'Your items are being packed carefully.' },
  { key: 'out_for_delivery', icon: '🛵', label: 'Out for Delivery', desc: 'Your order is on its way!' },
  { key: 'delivered',        icon: '🎁', label: 'Delivered',        desc: 'Enjoy your order!' },
];

const PICKUP_STAGES = [
  { key: 'pending',   icon: '✅', label: 'Order Received', desc: 'Your order is confirmed. Shopkeeper is reviewing it.' },
  { key: 'preparing', icon: '🧺', label: 'Being Packed',   desc: 'Your items are being packed. Come soon!' },
  { key: 'delivered', icon: '🎁', label: 'Ready / Picked Up', desc: 'Your order is ready. Come pick it up!' },
];

/**
 * TrackOrder — standalone page component.
 *
 * Props:
 *   shopCode      — current shop's code
 *   shop          — shop object { name, logo_emoji, ... }
 *   initialToken  — pre-filled token from URL param or post-checkout redirect
 *   onBack        — callback to go back to shop
 */
export default function TrackOrder({ shopCode, shop, initialToken = '', onBack }) {
  const [token, setToken]   = useState(initialToken);
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const pollRef = useRef(null);

  // Auto-search if token was passed in (e.g. after checkout)
  useEffect(() => {
    if (initialToken) fetchOrder(initialToken);
  }, [initialToken]);

  const fetchOrder = async (t, silent = false) => {
    const tok = (t || token).trim();
    if (!tok) return;
    if (!silent) setLoading(true);
    try {
      const r = await axios.get(`${API}/api/chatbot/track/?token=${tok}&shop_code=${shopCode}`);
      if (r.data.order) { setOrder(r.data.order); setError(''); }
      else if (!silent) setError('Order not found.');
    } catch (e) {
      if (!silent) setError(e.response?.data?.error || 'Could not find order. Check your token.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Poll every 12 seconds while order is active
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (order && order.status !== 'delivered') {
      pollRef.current = setInterval(() => fetchOrder(order.token, true), 12000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [order?.token, order?.status]);

  const doSearch = () => {
    setError('');
    setOrder(null);
    if (pollRef.current) clearInterval(pollRef.current);
    fetchOrder(token);
  };

  const isPickup    = order?.fulfillment_type === 'pickup';
  const ORDER_STAGES = order ? (isPickup ? PICKUP_STAGES : DELIVERY_STAGES) : DELIVERY_STAGES;
  const stageIdx    = order ? ORDER_STAGES.findIndex(s => s.key === (order.status || 'pending')) : -1;

  const eta = !order ? '' :
    isPickup ? (
      order.status === 'delivered'  ? 'Ready for pickup / Picked up ✓' :
      order.status === 'preparing'  ? (order.eta_note || 'Being packed — come in 10–15 mins') :
      (order.eta_note || 'Order confirmed — will notify when ready')
    ) : (
      order.status === 'delivered'        ? 'Delivered ✓' :
      order.status === 'out_for_delivery' ? (order.eta_note || 'On the way — 15–30 mins') :
      order.status === 'preparing'        ? (order.eta_note || 'Being packed — 20–40 mins') :
      (order.eta_note || 'Confirmed — preparing soon')
    );

  return (
    <div className="min-h-screen bg-[#fdf8f3]" style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl">←</button>
        <h2 className="text-white font-black text-lg flex-1" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Track Order</h2>
        <span className="text-white/70 text-sm">{shop.name}</span>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">

        {/* Token input */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 space-y-3">
          <div>
            <p className="font-bold text-gray-800 text-sm">Enter your Order Token</p>
            <p className="text-gray-400 text-xs mt-0.5">You received this after placing your order</p>
          </div>
          <div className="flex gap-2">
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="e.g. a3f9b2c1-..."
              className="flex-1 bg-orange-50 border-2 border-orange-100 focus:border-orange-400 rounded-xl px-3 py-3 text-sm outline-none font-mono text-gray-700"
            />
            <button
              onClick={doSearch}
              disabled={loading || !token.trim()}
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

        {order && (
          <div className="space-y-3">

            {/* Live indicator */}
            {order.status !== 'delivered' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-700 text-xs font-semibold">
                  {isPickup ? 'Live updates — refreshes every 12 seconds' : 'Live tracking — updates automatically every 12 seconds'}
                </span>
              </div>
            )}

            {/* Order summary */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="font-black text-gray-900">Order #{order.id}</p>
                  <p className="text-gray-400 text-xs">{order.customer_name} · {order.placed_at}</p>
                </div>
                <span className="font-black text-orange-600">{fm(order.grand_total)}</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border-2
                ${order.status === 'delivered'        ? 'bg-green-50 text-green-700 border-green-200' :
                  order.status === 'out_for_delivery' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  order.status === 'preparing'        ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-orange-50 text-orange-700 border-orange-200'}`}>
                <span>{ORDER_STAGES.find(s => s.key === (order.status || 'pending'))?.icon}</span>
                <span>{ORDER_STAGES.find(s => s.key === (order.status || 'pending'))?.label}</span>
              </div>
            </div>

            {/* Progress stepper */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
              <p className="font-bold text-gray-800 text-sm mb-5">{isPickup ? '📦 Pickup Progress' : '📍 Order Progress'}</p>
              {ORDER_STAGES.map((stage, i) => {
                const done   = i <= stageIdx;
                const active = i === stageIdx;
                return (
                  <div key={stage.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base transition-all
                        ${done ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' : 'bg-gray-50 border-gray-200 text-gray-300'}
                        ${active ? 'ring-4 ring-orange-200 scale-110' : ''}`}>
                        {done ? stage.icon : <span className="text-xs font-bold text-gray-400">{i + 1}</span>}
                      </div>
                      {i < ORDER_STAGES.length - 1 && (
                        <div className={`w-0.5 h-10 mt-1 ${i < stageIdx ? 'bg-orange-400' : 'bg-gray-100'}`} />
                      )}
                    </div>
                    <div className="pb-10 pt-2 flex-1">
                      <p className={`text-sm font-bold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{stage.label}</p>
                      {active && <p className="text-orange-600 text-xs mt-0.5 font-semibold">{stage.desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ETA / status note */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-3xl">{isPickup ? '🏪' : '⏱️'}</span>
              <div>
                <p className="font-bold text-orange-800 text-sm">{isPickup ? 'Pickup Info' : 'Status Update'}</p>
                <p className="text-orange-700 text-xs">{eta}</p>
                {isPickup && order.status !== 'delivered' && (
                  <p className="text-orange-500 text-xs mt-1">Come to the shop to collect your order.</p>
                )}
              </div>
            </div>

            {/* Items list */}
            {order.items?.length > 0 && (
              <div className="bg-white rounded-2xl border border-orange-100 p-4 space-y-2">
                <p className="font-bold text-gray-800 text-sm">🧺 Your Items</p>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product_name} × {item.quantity}{item.unit}</span>
                    <span className="font-bold">{fm(item.item_total)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Delivery address — only for delivery orders */}
            {!isPickup && order.delivery_address && (
              <div className="bg-white rounded-2xl border border-orange-100 p-4">
                <p className="font-bold text-gray-800 text-sm mb-1">📍 Delivering to</p>
                <p className="text-gray-600 text-sm">{order.delivery_address}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}