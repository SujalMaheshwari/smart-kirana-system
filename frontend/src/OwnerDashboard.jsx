// OwnerDashboard.jsx — KiranaOS shop owner control panel
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API } from './App';

const fm = n => `₹${parseFloat(n||0).toFixed(2)}`;

axios.defaults.withCredentials = true;

/* ─────────────────────────────────────────────────────────────
   THEME TOKENS
───────────────────────────────────────────────────────────── */
function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('kirana-theme') === 'dark');
  const toggle = () => setDark(d => { localStorage.setItem('kirana-theme', !d ? 'dark' : 'light'); return !d; });
  return { dark, toggle };
}

function T(dark) {
  if (dark) return {
    page:       'bg-[#0c0e11]',
    nav:        'bg-[#0f1117] border-[#ffffff0d]',
    card:       'bg-[#0f1117] border-[#ffffff0d]',
    cardInner:  'bg-[#0c0e11]',
    text:       'text-white',
    textSub:    'text-white/45',
    textMuted:  'text-white/25',
    input:      'bg-[#0c0e11] border-[#ffffff14] text-white/70 placeholder-white/20 focus:border-orange-400/40',
    select:     'bg-[#0c0e11] border-[#ffffff14] text-white/70',
    divider:    'border-[#ffffff08]',
    tabActive:  'bg-orange-500 text-white shadow-lg shadow-orange-500/20',
    tabInactive:'text-white/50 hover:text-white hover:bg-white/6',
    row:        'border-[#ffffff06] hover:bg-white/[0.02]',
    badgeGhost: 'bg-white/5 text-white/35 border-white/8',
    scrollbar:  'scroll-dark',
  };
  return {
    page:       'bg-[#f5f4f0]',
    nav:        'bg-white border-[#e2ddd5]',
    card:       'bg-white border-[#e8e4de]',
    cardInner:  'bg-[#faf9f7]',
    text:       'text-[#1a1a1a]',
    textSub:    'text-[#6b6560]',
    textMuted:  'text-[#a39d97]',
    input:      'bg-white border-[#ddd8d0] text-[#1a1a1a] placeholder-[#b8b0a8] focus:border-orange-400',
    select:     'bg-white border-[#ddd8d0] text-[#1a1a1a]',
    divider:    'border-[#ede9e3]',
    tabActive:  'bg-orange-500 text-white shadow-lg shadow-orange-500/25',
    tabInactive:'text-[#6b6560] hover:text-[#1a1a1a] hover:bg-orange-50',
    row:        'border-[#ede9e3] hover:bg-orange-50/50',
    badgeGhost: 'bg-[#f0ece6] text-[#6b6560] border-[#e2ddd5]',
    scrollbar:  'scroll-light',
  };
}

/* ─────────────────────────────────────────────────────────────
   ROOT DASHBOARD
───────────────────────────────────────────────────────────── */
export default function OwnerDashboard({ onLogout }) {
  const [tab, setTab]           = useState('overview');
  const [shopData, setShopData] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();
  const t = T(dark);

  useEffect(() => {
    axios.get(`${API}/api/shops/me/`, { withCredentials: true })
      .then(r => setShopData(r.data.shop))
      .catch(() => {});
  }, []);

  const tabs = [
    { id:'overview',  icon:'📊', label:'Overview'  },
    { id:'orders',    icon:'📦', label:'Orders'    },
    { id:'inventory', icon:'🧺', label:'Inventory' },
    { id:'analytics', icon:'📈', label:'Analytics' },
    { id:'suppliers', icon:'🚚', label:'Suppliers' },
    { id:'reviews',   icon:'⭐', label:'Reviews'   },
    { id:'aichat',    icon:'🤖', label:'AI Chat'   },
    { id:'settings',  icon:'⚙️',  label:'Settings'  },
  ];

  return (
    <div className={`min-h-screen ${t.page} flex flex-col overflow-hidden`} style={{fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .mono { font-family: 'DM Mono', monospace; }
        .scroll-dark::-webkit-scrollbar { width: 4px; }
        .scroll-dark::-webkit-scrollbar-thumb { background: #ffffff14; border-radius: 4px; }
        .scroll-light::-webkit-scrollbar { width: 4px; }
        .scroll-light::-webkit-scrollbar-thumb { background: #00000014; border-radius: 4px; }
        .tab-hover { transition: all 0.18s ease; }
      `}</style>

      {/* ── TOP NAVBAR ── */}
      <header className={`${t.nav} border-b sticky top-0 z-40 shrink-0`}>
        {/* Brand + controls row */}
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Shop identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 ${dark?'bg-orange-500/15':'bg-orange-50 border border-orange-100'}`}>
              {shopData?.logo_emoji||'🏪'}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className={`${t.text} font-bold text-sm truncate leading-tight`}>{shopData?.name||'My Shop'}</p>
              <p className={`${t.textMuted} text-[10px] mono truncate`}>{shopData?.shop_code||'...'}</p>
            </div>
          </div>

          <div className="flex-1"/>

          {/* Shop status badge */}
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold
            ${shopData?.is_open
              ? dark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200'
              : dark ? 'bg-red-500/10 text-red-400 border-red-500/20'   : 'bg-red-50 text-red-600 border-red-200'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${shopData?.is_open?'bg-green-500 animate-pulse':'bg-red-500'}`}/>
            <span className="hidden sm:inline">{shopData?.is_open?'Open':'Closed'}</span>
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme} title="Toggle theme"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all tab-hover
              ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-[#faf9f7] border-[#e2ddd5] hover:bg-orange-50'}`}>
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Logout */}
          <button onClick={onLogout} title="Logout"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all tab-hover
              ${dark ? 'bg-white/5 border-white/10 hover:bg-red-500/10 hover:border-red-500/20' : 'bg-[#faf9f7] border-[#e2ddd5] hover:bg-red-50 hover:border-red-200'}`}>
            🚪
          </button>

          {/* Mobile hamburger */}
          <button onClick={()=>setMobileOpen(o=>!o)}
            className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center border transition-all
              ${dark?'bg-white/5 border-white/10':'bg-[#faf9f7] border-[#e2ddd5]'}`}>
            <span className={`text-lg ${t.textSub}`}>{mobileOpen?'✕':'☰'}</span>
          </button>
        </div>

        {/* ── Tab bar (desktop: horizontal scroll, mobile: collapsible) ── */}
        <div className={`${mobileOpen?'block':'hidden'} md:block border-t ${t.divider}`}>
          <nav className="flex overflow-x-auto px-3 py-2 gap-1 no-scrollbar">
            {tabs.map(tab2=>(
              <button key={tab2.id}
                onClick={()=>{ setTab(tab2.id); setMobileOpen(false); }}
                className={`tab-hover flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0
                  ${tab===tab2.id ? t.tabActive : t.tabInactive}`}>
                <span className="text-base">{tab2.icon}</span>
                <span>{tab2.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className={`flex-1 overflow-y-auto ${t.scrollbar}`}>
        {tab==='overview'  && <OverviewTab  shopData={shopData} t={t} dark={dark}/>}
        {tab==='orders'    && <OrdersTab    t={t} dark={dark}/>}
        {tab==='inventory' && <InventoryTab t={t} dark={dark}/>}
        {tab==='analytics' && <AnalyticsTab t={t} dark={dark}/>}
        {tab==='suppliers' && <SuppliersTab t={t} dark={dark}/>}
        {tab==='reviews'   && <ReviewsTab   shopData={shopData} t={t} dark={dark}/>}
        {tab==='aichat'    && <AIChatTab    t={t} dark={dark}/>}
        {tab==='settings'  && <SettingsTab  shopData={shopData} setShopData={setShopData} t={t} dark={dark}/>}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────────────────────────── */
function OverviewTab({ shopData, t, dark }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/shops/dashboard/`, { withCredentials: true })
      .then(r => setStats(r.data))
      .catch(e => console.error('Dashboard error:', e))
      .finally(() => setLoading(false));
  }, []);

  const s = stats?.summary || {};
  const kpis = stats ? [
    { label:"Today's Revenue", value:fm(s.today_revenue),  sub:`${s.today_orders||0} orders`,  color: dark?'text-green-400':'text-green-700',   border: dark?'border-green-400/15':'border-green-200',  bg: dark?'bg-green-400/8':'bg-green-50'   },
    { label:'This Week',       value:fm(s.week_revenue),   sub:`${s.week_orders||0} orders`,   color: dark?'text-blue-400':'text-blue-700',    border: dark?'border-blue-400/15':'border-blue-200',   bg: dark?'bg-blue-400/8':'bg-blue-50'    },
    { label:'This Month',      value:fm(s.month_revenue),  sub:'last 30 days',                 color: dark?'text-purple-400':'text-purple-700', border: dark?'border-purple-400/15':'border-purple-200', bg: dark?'bg-purple-400/8':'bg-purple-50' },
    { label:'Avg Order',       value:fm(s.avg_order),      sub:'per order',                    color: dark?'text-orange-400':'text-orange-600', border: dark?'border-orange-400/15':'border-orange-200', bg: dark?'bg-orange-400/8':'bg-orange-50' },
  ] : [];

  if (loading) return <Spinner t={t}/>;

  const chartMax = Math.max(...(stats?.daily_chart||[]).map(d=>d.revenue), 1);

  return (
    <div className="p-5 space-y-5 max-w-5xl">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k,i)=>(
          <div key={i} className={`${k.bg} border ${k.border} rounded-xl p-4`}>
            <p className={`${t.textSub} text-xs mb-2 font-medium`}>{k.label}</p>
            <p className={`${k.color} font-black text-2xl mono`}>{k.value}</p>
            <p className={`${t.textMuted} text-[11px] mt-1`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className={`${t.card} border rounded-xl p-5`}>
        <p className={`${t.textSub} text-xs uppercase tracking-wider mb-4 font-semibold`}>Revenue — Last 30 Days</p>
        <div className="flex items-end gap-0.5 h-28">
          {(stats?.daily_chart||[]).map((d,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div className={`absolute bottom-full mb-1 ${dark?'bg-[#0c0e11] border-white/8 text-white/60':'bg-white border-gray-200 text-gray-600 shadow-sm'} border text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none`}>
                {d.date}: {fm(d.revenue)}
              </div>
              <div className="w-full bg-orange-500/70 rounded-t-sm hover:bg-orange-500 transition-colors"
                   style={{height:`${Math.max(2,(d.revenue/chartMax)*100)}%`}}/>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className={`${t.card} border rounded-xl overflow-hidden`}>
          <div className={`px-5 py-3.5 border-b ${t.divider}`}><p className={`${t.textSub} text-xs uppercase tracking-wider font-semibold`}>Top Products</p></div>
          {(stats?.top_products||[]).length===0
            ? <p className={`${t.textMuted} text-sm p-5`}>No sales data yet</p>
            : stats.top_products.map((p,i)=>(
              <div key={i} className={`px-5 py-3 border-b ${t.divider} last:border-0 flex justify-between items-center`}>
                <div>
                  <p className={`${t.text} text-sm font-semibold`}>{p.name}</p>
                  <p className={`${t.textMuted} text-xs mono`}>{p.orders} orders</p>
                </div>
                <span className={`${dark?'text-orange-400':'text-orange-600'} font-bold mono text-sm`}>{fm(p.revenue)}</span>
              </div>
            ))
          }
        </div>

        {/* Recent orders */}
        <div className={`${t.card} border rounded-xl overflow-hidden`}>
          <div className={`px-5 py-3.5 border-b ${t.divider}`}><p className={`${t.textSub} text-xs uppercase tracking-wider font-semibold`}>Recent Orders</p></div>
          {(stats?.recent_orders||[]).length===0
            ? <p className={`${t.textMuted} text-sm p-5`}>No orders yet</p>
            : stats.recent_orders.slice(0,5).map((o,i)=>(
              <div key={i} className={`px-5 py-3 border-b ${t.divider} last:border-0`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`${t.text} text-sm font-semibold`}>{o.customer}</p>
                    <p className={`${t.textMuted} text-xs mono`}>{o.time}</p>
                    {o.delivery_address&&<p className={`${t.textSub} text-xs mt-0.5 truncate max-w-[180px]`}>📍 {o.delivery_address}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`${dark?'text-white/70':'text-gray-800'} mono font-bold text-sm`}>{fm(o.total)}</span>
                    <div className="flex gap-1 mt-1 justify-end">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${o.fulfillment==='delivery'?dark?'bg-blue-500/10 text-blue-400 border-blue-500/18':'bg-blue-50 text-blue-700 border-blue-200':t.badgeGhost}`}>
                        {o.fulfillment==='delivery'?'🛵':'📦'}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${o.payment==='upi'?dark?'bg-purple-500/10 text-purple-400 border-purple-500/18':'bg-purple-50 text-purple-700 border-purple-200':dark?'bg-blue-500/10 text-blue-400 border-blue-500/18':'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {o.payment==='upi'?'UPI':'COD'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ORDERS TAB
───────────────────────────────────────────────────────────── */
function OrdersTab({ t, dark }) {
  const [orders, setOrders]     = useState([]);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState({});
  const [etaModal, setEtaModal] = useState(null); // { orderId, currentEta }
  const [etaInput, setEtaInput] = useState('');

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/shops/dashboard/`, { withCredentials: true })
      .then(r => setOrders(r.data.recent_orders||[]))
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = async (orderId, status) => {
    setUpdating(u => ({...u, [orderId]: true}));
    try {
      await axios.post(`${API}/api/chatbot/order-status/`, { order_id: orderId, status }, { withCredentials: true });
      // Update local state immediately for instant UI feedback
      setOrders(prev => prev.map(o => o.id === orderId ? {...o, status} : o));
    } catch { alert('Failed to update status. Check if migration 0005 is applied.'); }
    finally { setUpdating(u => ({...u, [orderId]: false})); }
  };

  const saveEta = async () => {
    if (!etaModal) return;
    try {
      await axios.post(`${API}/api/chatbot/order-status/`, { order_id: etaModal.orderId, eta_note: etaInput }, { withCredentials: true });
      setOrders(prev => prev.map(o => o.id === etaModal.orderId ? {...o, eta_note: etaInput} : o));
    } catch {}
    setEtaModal(null); setEtaInput('');
  };

  const STATUS_FLOW = [
    { key:'pending',          label:'Received',    icon:'✅', color:'text-gray-500'  },
    { key:'preparing',        label:'Packing',     icon:'🧺', color:'text-amber-600' },
    { key:'out_for_delivery', label:'On the way',  icon:'🛵', color:'text-blue-600'  },
    { key:'delivered',        label:'Delivered',   icon:'🎁', color:'text-green-600' },
  ];

  const filtered = filter==='all' ? orders : filter==='delivery' ? orders.filter(o=>o.fulfillment==='delivery') : orders.filter(o=>o.payment===filter);

  if (loading) return <Spinner t={t}/>;

  return (
    <div className="p-5 max-w-4xl">
      {/* ETA Modal */}
      {etaModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e=>{if(e.target===e.currentTarget){setEtaModal(null);setEtaInput('');}}}>
          <div className={`${t.card} border rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4`}>
            <p className={`${t.text} font-bold`}>⏱️ Set Delivery Time Note</p>
            <p className={`${t.textSub} text-xs`}>This is shown to the customer when they track their order.</p>
            <input value={etaInput} onChange={e=>setEtaInput(e.target.value)} placeholder="e.g. Delivering with 3 other orders — 45 mins"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${t.input}`}/>
            <div className="flex gap-2">
              <button onClick={()=>{setEtaModal(null);setEtaInput('');}} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${t.badgeGhost}`}>Cancel</button>
              <button onClick={saveEta} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {[['all','All'],['delivery','🛵 Delivery'],['cash','💵 COD'],['upi','📱 UPI']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all tab-hover ${filter===v?t.tabActive:t.tabInactive}`}>
            {l}
          </button>
        ))}
      </div>

      <div className={`${t.card} border rounded-xl overflow-hidden`}>
        {filtered.length===0
          ? <div className="py-16 text-center"><p className="text-3xl mb-2">📦</p><p className={`${t.textMuted} text-sm`}>No orders found</p></div>
          : filtered.map((o)=>{
            const curStageIdx = STATUS_FLOW.findIndex(s=>s.key===(o.status||'pending'));
            const isDelivery = o.fulfillment==='delivery';
            return (
              <div key={o.id} className={`px-5 py-4 border-b ${t.divider} last:border-0`}>
                {/* Order header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${t.textMuted} mono text-xs`}>#{o.id}</span>
                      <span className={`${t.text} font-bold text-sm`}>{o.customer}</span>
                      {o.phone&&<span className={`${t.textMuted} text-xs`}>{o.phone}</span>}
                    </div>
                    <p className={`${t.textMuted} text-xs mono`}>{o.time}</p>
                    {o.delivery_address&&<p className={`${t.textSub} text-xs mt-0.5 truncate max-w-xs`}>📍 {o.delivery_address}</p>}
                    {o.upi_ref&&<p className="text-purple-600 text-xs mt-0.5 font-semibold">📱 UPI Ref: <span className="font-mono">{o.upi_ref}</span></p>}
                    {o.eta_note&&<p className="text-amber-600 text-xs mt-0.5 font-semibold">⏱️ {o.eta_note}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isDelivery?dark?'bg-blue-500/10 text-blue-400 border-blue-500/18':'bg-blue-50 text-blue-700 border-blue-200':t.badgeGhost}`}>
                      {isDelivery?'🛵 Delivery':'📦 Pickup'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${o.payment==='upi'?dark?'bg-purple-500/10 text-purple-400 border-purple-500/18':'bg-purple-50 text-purple-700 border-purple-200':t.badgeGhost}`}>
                      {o.payment==='upi'?'📱 UPI':'💵 COD'}
                    </span>
                    <span className={`${dark?'text-white/80':'text-gray-900'} mono font-bold text-sm`}>{fm(o.total)}</span>
                  </div>
                </div>

                {/* Status updater — delivery and pickup both, but pickup skips "On the way" */}
                <div className={`mt-3 pt-3 border-t ${t.divider}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`${t.textSub} text-xs font-semibold`}>Update Status</p>
                    {isDelivery && (
                      <button onClick={()=>{setEtaModal({orderId:o.id});setEtaInput(o.eta_note||'');}}
                        className={`text-xs px-2.5 py-1 rounded-lg border ${t.badgeGhost} hover:opacity-75 transition-opacity`}>
                        ⏱️ Set delivery time
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUS_FLOW
                      .filter(s => isDelivery || s.key !== 'out_for_delivery')
                      .map((s) => {
                        const i         = STATUS_FLOW.findIndex(x => x.key === s.key);
                        const isCurrent = i === curStageIdx;
                        const isPast    = i < curStageIdx;
                        return (
                          <button key={s.key}
                            onClick={() => !isCurrent && !updating[o.id] && updateStatus(o.id, s.key)}
                            disabled={updating[o.id]}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                              ${isCurrent ? 'bg-orange-500 text-white border-orange-500 shadow-sm' :
                                isPast     ? dark?'bg-white/5 text-white/30 border-white/8':'bg-gray-50 text-gray-300 border-gray-200' :
                                dark?'bg-white/5 text-white/50 border-white/10 hover:border-orange-400/40 hover:text-white/80':'bg-white text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-600'
                              }`}>
                            <span>{s.icon}</span>
                            <span>{s.label}</span>
                            {isCurrent && updating[o.id] && <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin"/>}
                          </button>
                        );
                    })}
                  </div>
                  {o.status === 'out_for_delivery' && isDelivery && (
                    <p className="text-blue-600 text-xs mt-2 font-medium">💡 Tip: You can batch 4-5 orders in one delivery trip to save fuel and time.</p>
                  )}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INVENTORY TAB
───────────────────────────────────────────────────────────── */
function InventoryTab({ t, dark }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState({});
  const [saving, setSaving]     = useState({});
  const [showAdd, setShowAdd]   = useState(false);
  const [addForm, setAddForm]   = useState({ name:'', price:'', category:'other', stock_quantity:'0', min_stock_level:'5', is_loose:false, description:'', barcode:'' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError]   = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState('');
  const [scanning, setScanning]       = useState(false);
  const [scanError, setScanError]     = useState('');
  const scannerObj = useRef(null);

  const CATS = [['other','Other'],['dairy','Dairy & Eggs'],['grains','Grains & Pulses'],['snacks','Snacks & Biscuits'],['beverages','Beverages'],['spices','Spices & Masala'],['oil','Oil & Ghee'],['personal','Personal Care'],['cleaning','Cleaning']];

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/inventory/products/`, { withCredentials: true })
      .then(r => setProducts(Array.isArray(r.data)?r.data:(r.data.results||[])))
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const lookupBarcode = async (code) => {
    setAddForm(f=>({...f, barcode:code}));
    setScanError('🔍 Looking up product info...');
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await r.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name_en || p.product_name_hi || p.product_name || '';
        const brand = p.brands || '';
        const qty = p.quantity || '';
        const cat = p.categories_tags?.[0]?.replace('en:','') || '';
        // Map OpenFoodFacts category to our categories
        const catMap = { dairy:'dairy', milk:'dairy', cheese:'dairy', egg:'dairy', grain:'grains', rice:'grains', wheat:'grains', flour:'grains', pulse:'grains', lentil:'grains', snack:'snacks', biscuit:'snacks', chip:'snacks', chocolate:'snacks', beverage:'beverages', juice:'beverages', water:'beverages', tea:'beverages', coffee:'beverages', spice:'spices', masala:'spices', oil:'oil', ghee:'oil', soap:'personal', shampoo:'personal', toothpaste:'personal', detergent:'cleaning', dishwash:'cleaning' };
        let mappedCat = 'other';
        for (const [key, val] of Object.entries(catMap)) { if (cat.toLowerCase().includes(key)) { mappedCat = val; break; } }
        const fullName = [brand, name, qty].filter(Boolean).join(' ').trim().substring(0, 80);
        if (fullName) {
          setAddForm(f=>({...f, barcode:code, name: f.name || fullName, category: f.category !== 'other' ? f.category : mappedCat }));
          setScanError(`✅ Found: ${fullName}`);
        } else {
          setScanError('✅ Barcode scanned. Product not in database — enter details manually.');
        }
      } else {
        setScanError('✅ Barcode scanned. Product not found online — enter details manually.');
      }
    } catch {
      setScanError('✅ Barcode scanned. Could not look up product — enter details manually.');
    }
  };

  const startScanner = async () => {
    setScanError(''); setScanning(true);
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scannerObj.current = new Html5Qrcode('barcode-reader');
        await scannerObj.current.start(
          { facingMode:'environment' },
          { fps:10, qrbox:{ width:250, height:100 } },
          (code) => { stopScanner(); lookupBarcode(code); },
          () => {}
        );
      } catch { setScanError('Camera not available. Type barcode manually.'); setScanning(false); }
    }, 120);
  };

  const stopScanner = () => {
    if (scannerObj.current) { scannerObj.current.stop().catch(()=>{}); scannerObj.current=null; }
    setScanning(false);
  };

  const updateStock = async (id, val) => {
    setSaving(s => ({...s,[id]:true}));
    try { await axios.post(`${API}/api/inventory/products/${id}/stock/`, { stock_quantity: parseFloat(val) }, { withCredentials:true }); load(); }
    catch { alert('Failed to update stock.'); }
    finally { setSaving(s => ({...s,[id]:false})); }
  };

  const addProduct = async () => {
    setAddError('');
    if (!addForm.name.trim()) { setAddError('Product name is required.'); return; }
    if (!addForm.price || parseFloat(addForm.price)<=0) { setAddError('Enter a valid price greater than 0.'); return; }
    setAddSaving(true);
    try {
      const r = await axios.post(`${API}/api/inventory/products/create/`, {
        ...addForm, price:parseFloat(addForm.price),
        stock_quantity:parseFloat(addForm.stock_quantity)||0,
        min_stock_level:parseFloat(addForm.min_stock_level)||5,
      }, { withCredentials:true });
      setProducts(p=>[...p,r.data.product]);
      setAddForm({ name:'',price:'',category:'other',stock_quantity:'0',min_stock_level:'5',is_loose:false,description:'',barcode:'' });
      setShowAdd(false);
    } catch(e) { setAddError(e.response?.data?.error||'Failed to add product.'); }
    finally { setAddSaving(false); }
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setEditForm({ name:p.name, price:String(p.price), category:p.category, min_stock_level:String(p.min_stock_level), is_loose:p.is_loose, description:p.description||'', barcode:p.barcode||'' });
    setEditError('');
  };

  const saveEdit = async () => {
    setEditError('');
    if (!editForm.name.trim()) { setEditError('Product name is required.'); return; }
    if (!editForm.price||parseFloat(editForm.price)<=0) { setEditError('Enter a valid price.'); return; }
    setEditSaving(true);
    try {
      const r = await axios.post(`${API}/api/inventory/products/${editProduct.id}/update/`, {
        ...editForm, price:parseFloat(editForm.price), min_stock_level:parseFloat(editForm.min_stock_level)||5,
      }, { withCredentials:true });
      setProducts(ps=>ps.map(p=>p.id===editProduct.id?r.data.product:p));
      setEditProduct(null);
    } catch(e) { setEditError(e.response?.data?.error||'Failed to update product.'); }
    finally { setEditSaving(false); }
  };

  const deleteProduct = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await axios.delete(`${API}/api/inventory/products/${id}/delete/`, { withCredentials:true }); setProducts(p=>p.filter(x=>x.id!==id)); }
    catch { alert('Failed to delete product.'); }
  };

  const filtered  = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock  = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level);
  const outStock  = products.filter(p => p.stock_quantity === 0);
  const inStock   = products.filter(p => p.stock_quantity > p.min_stock_level);
  const totalVal  = products.reduce((s,p) => s + (parseFloat(p.price)||0) * (parseFloat(p.stock_quantity)||0), 0);
  const catCounts = products.reduce((acc,p)=>{ acc[p.category]=(acc[p.category]||0)+1; return acc; }, {});

  if (loading) return <Spinner t={t}/>;

  return (
    <div className="p-4 lg:p-6">

      {/* Edit modal */}
      {editProduct&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e=>{if(e.target===e.currentTarget)setEditProduct(null)}}>
          <div className={`${t.card} border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto space-y-4`}>
            <div className="flex items-center justify-between">
              <p className={`${t.text} font-bold text-lg`}>Edit Product</p>
              <button onClick={()=>setEditProduct(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-xl">✕</button>
            </div>
            {editError&&<p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">⚠️ {editError}</p>}
            {[['name','Product Name *','text'],['price','Price (₹) *','number'],['min_stock_level','Min Stock Level','number'],['barcode','Barcode','text'],['description','Description','text']].map(([k,l,ty])=>(
              <div key={k}>
                <p className={`${t.textSub} text-xs mb-1 font-semibold`}>{l}</p>
                <input type={ty} value={editForm[k]} onChange={e=>setEditForm(f=>({...f,[k]:e.target.value}))}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${t.input}`}/>
              </div>
            ))}
            <div>
              <p className={`${t.textSub} text-xs mb-1 font-semibold`}>Category</p>
              <select value={editForm.category} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer ${t.select}`}>
                {CATS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={()=>setEditForm(f=>({...f,is_loose:!f.is_loose}))}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${editForm.is_loose?'bg-orange-500':'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editForm.is_loose?'left-6':'left-1'}`}/>
              </button>
              <span className={`${t.textSub} text-sm font-medium`}>{editForm.is_loose?'Loose — price per kg':'Packaged — per piece'}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={()=>setEditProduct(null)} className={`flex-1 py-3 rounded-xl text-sm font-semibold border ${t.badgeGhost}`}>Cancel</button>
              <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-60 transition-colors">
                {editSaving?'Saving…':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TWO-COLUMN LAYOUT */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* ── LEFT: product list ── */}
        <div className="flex-1 min-w-0 space-y-4 w-full">

          {/* Alerts */}
          {lowStock.length>0&&(
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <span className="text-xl mt-0.5">⚠️</span>
              <div>
                <p className="text-amber-800 font-bold text-sm">{lowStock.length} item{lowStock.length>1?'s':''} running low</p>
                <p className="text-amber-700 text-xs mt-0.5">{lowStock.map(p=>p.name).join(' · ')}</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h2 className={`${t.text} font-bold text-lg`}>Products <span className={`${t.textMuted} text-sm font-normal`}>({products.length})</span></h2>
            </div>
            <button onClick={()=>{setShowAdd(s=>!s); if(scanning)stopScanner();}}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${showAdd?t.badgeGhost+' border':'bg-orange-500 hover:bg-orange-400 text-white shadow-sm'}`}>
              <span>{showAdd?'✕':'+'}</span><span>{showAdd?'Cancel':'Add Product'}</span>
            </button>
          </div>

          {/* Add product form */}
          {showAdd&&(
            <div className={`${t.card} border-2 border-orange-200 rounded-2xl p-5 space-y-4`}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🧺</span>
                <p className="text-orange-600 font-bold text-base">New Product</p>
              </div>
              {addError&&<p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">⚠️ {addError}</p>}

              {/* ── BARCODE SCANNER ── */}
              <div className={`${t.cardInner} border ${t.divider} rounded-2xl p-4 space-y-3`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`${t.text} text-sm font-bold`}>📷 Scan Barcode</p>
                    <p className={`${t.textMuted} text-xs mt-0.5`}>Point camera at any product barcode</p>
                  </div>
                  {!scanning
                    ? <button onClick={startScanner} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
                        Open Camera
                      </button>
                    : <button onClick={stopScanner} className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                        Stop
                      </button>
                  }
                </div>
                {scanning&&<div id="barcode-reader" className="rounded-xl overflow-hidden w-full"/>}
                {scanError&&(
                  <p className={`text-xs rounded-lg px-3 py-2 border ${
                    scanError.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' :
                    scanError.startsWith('🔍') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-red-50 text-red-500 border-red-200'
                  }`}>{scanError}</p>
                )}
                {addForm.barcode
                  ? <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                      <span className="text-green-600 font-bold">✓</span>
                      <span className="text-green-800 text-sm font-mono font-bold flex-1">{addForm.barcode}</span>
                      <button onClick={()=>setAddForm(f=>({...f,barcode:''}))} className="text-green-500 hover:text-red-400 text-xs font-semibold transition-colors">✕ clear</button>
                    </div>
                  : !scanning&&<div>
                      <p className={`${t.textSub} text-xs mb-1.5 font-semibold`}>Or type barcode manually</p>
                      <div className="flex gap-2">
                        <input value={addForm.barcode} onChange={e=>setAddForm(f=>({...f,barcode:e.target.value}))}
                          onKeyDown={e=>{ if(e.key==='Enter' && addForm.barcode.trim()) lookupBarcode(addForm.barcode.trim()); }}
                          placeholder="e.g. 8901234567890"
                          className={`flex-1 border rounded-xl px-3 py-2.5 text-sm font-mono outline-none transition-colors ${t.input}`}/>
                        <button onClick={()=>{ if(addForm.barcode.trim()) lookupBarcode(addForm.barcode.trim()); }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-3 py-2 rounded-xl transition-colors whitespace-nowrap">
                          Look up
                        </button>
                      </div>
                    </div>
                }
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <p className={`${t.textSub} text-xs mb-1.5 font-semibold`}>Product Name *</p>
                  <input value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Tata Salt 1kg"
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${t.input}`}/>
                </div>
                {[['price','Price (₹) *','number','e.g. 22'],['stock_quantity','Initial Stock','number','0'],['min_stock_level','Min Stock Level','number','5'],['description','Description','text','e.g. 1kg pack']].map(([k,l,ty,ph])=>(
                  <div key={k}>
                    <p className={`${t.textSub} text-xs mb-1.5 font-semibold`}>{l}</p>
                    <input type={ty} value={addForm[k]} onChange={e=>setAddForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${t.input}`}/>
                  </div>
                ))}
                <div>
                  <p className={`${t.textSub} text-xs mb-1.5 font-semibold`}>Category</p>
                  <select value={addForm.category} onChange={e=>setAddForm(f=>({...f,category:e.target.value}))}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer ${t.select}`}>
                    {CATS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 self-end pb-2">
                  <button onClick={()=>setAddForm(f=>({...f,is_loose:!f.is_loose}))}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${addForm.is_loose?'bg-orange-500':'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${addForm.is_loose?'left-7':'left-1'}`}/>
                  </button>
                  <span className={`${t.textSub} text-sm font-medium`}>{addForm.is_loose?'Loose (per kg)':'Packaged (per piece)'}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>{setShowAdd(false);stopScanner();}} className={`px-5 py-3 rounded-xl text-sm font-semibold border ${t.badgeGhost}`}>Cancel</button>
                <button onClick={addProduct} disabled={addSaving} className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  {addSaving?'Adding…':'+ Add Product'}
                </button>
              </div>
            </div>
          )}

          {/* Search + list */}
          <div className={`${t.card} border rounded-2xl overflow-hidden`}>
            <div className={`p-4 border-b ${t.divider}`}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search products..."
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${t.input}`}/>
            </div>
            {filtered.length===0&&(
              <div className="py-14 text-center">
                <p className="text-4xl mb-2">🧺</p>
                <p className={`${t.textMuted} text-sm`}>{search?'No products match your search':'No products yet — click Add Product above!'}</p>
              </div>
            )}
            {filtered.map(p=>(
              <div key={p.id} className={`px-4 py-3.5 border-b ${t.row} last:border-0 transition-colors`}>
                {/* Row: info left, controls right — stacks on very small screens */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`${t.text} font-bold`}>{p.name}</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border
                        ${p.stock_quantity===0?'bg-red-50 text-red-600 border-red-200'
                          :p.stock_quantity<=p.min_stock_level?'bg-amber-50 text-amber-700 border-amber-200'
                          :'bg-green-50 text-green-700 border-green-200'}`}>
                        {p.stock_quantity===0?'Out of stock'
                          :p.stock_quantity<=p.min_stock_level?`Low — ${p.stock_quantity} left`
                          :`${p.stock_quantity} ${p.is_loose?'kg':'pcs'}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1 items-center">
                      <span className={`${dark?'text-orange-400':'text-orange-600'} text-sm mono font-bold`}>{fm(p.price)}{p.is_loose?'/kg':''}</span>
                      {p.is_loose&&<span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">Loose</span>}
                      {p.category&&p.category!=='other'&&<span className={`text-xs ${t.badgeGhost} px-2 py-0.5 rounded-full border`}>{p.category}</span>}
                      {p.barcode&&<span className={`text-xs ${t.textMuted} font-mono`}>#{p.barcode}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 border rounded-xl overflow-hidden">
                      <input type="number" step="0.1" min="0" defaultValue={p.stock_quantity}
                        onChange={e=>setEditing(prev=>({...prev,[p.id]:e.target.value}))}
                        className={`w-20 px-3 py-2 text-sm mono outline-none text-center ${t.input} border-0 rounded-none`}/>
                      <button onClick={()=>updateStock(p.id, editing[p.id]??p.stock_quantity)} disabled={saving[p.id]}
                        className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-bold px-3 py-2 transition-colors">
                        {saving[p.id]?'…':'Save'}
                      </button>
                    </div>
                    <button onClick={()=>openEdit(p)} title="Edit" className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center transition-colors">✏️</button>
                    <button onClick={()=>deleteProduct(p.id,p.name)} title="Delete" className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 flex items-center justify-center transition-colors">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Stats sidebar ── */}
        <div className="w-full xl:w-72 shrink-0 space-y-4">

          {/* Stock summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon:'📦', label:'Total',      value:products.length,  bg:'bg-blue-50  border-blue-200',  color:'text-blue-700'   },
              { icon:'✅', label:'In Stock',   value:inStock.length,   bg:'bg-green-50 border-green-200', color:'text-green-700'  },
              { icon:'⚠️', label:'Low Stock',  value:lowStock.length,  bg:'bg-amber-50 border-amber-200', color:'text-amber-700'  },
              { icon:'🔴', label:'Out of Stock',value:outStock.length, bg:'bg-red-50   border-red-200',   color:'text-red-600'    },
            ].map((s,i)=>(
              <div key={i} className={`${s.bg} border rounded-2xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <p className={`text-xs font-semibold ${t.textSub}`}>{s.label}</p>
                </div>
                <p className={`${s.color} text-3xl font-black mono leading-none`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Inventory value */}
          <div className={`${t.card} border rounded-2xl p-4`}>
            <p className={`${t.textSub} text-xs font-semibold mb-1`}>💰 Inventory Value</p>
            <p className={`${dark?'text-orange-400':'text-orange-600'} text-2xl font-black mono`}>{fm(totalVal)}</p>
            <p className={`${t.textMuted} text-xs mt-1`}>stock qty × price</p>
          </div>

          {/* Category chart */}
          {products.length>0&&(
            <div className={`${t.card} border rounded-2xl p-4 space-y-3`}>
              <p className={`${t.textSub} text-xs font-semibold`}>🗂️ By Category</p>
              {Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).map(([cat,cnt])=>(
                <div key={cat}>
                  <div className="flex justify-between mb-1">
                    <span className={`${t.textSub} text-xs capitalize font-medium`}>{cat==='other'?'Uncategorised':cat}</span>
                    <span className={`${t.textMuted} text-xs mono`}>{cnt}</span>
                  </div>
                  <div className={`h-1.5 ${dark?'bg-white/8':'bg-gray-100'} rounded-full overflow-hidden`}>
                    <div className="h-full bg-orange-400 rounded-full transition-all" style={{width:`${(cnt/products.length)*100}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Barcode tip */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-blue-800 font-bold text-sm mb-1.5">📷 Barcode Scanner</p>
            <p className="text-blue-700 text-xs leading-relaxed">
              Tap <strong>+ Add Product</strong> → <strong>Open Camera</strong> to scan any barcode with your phone or webcam. The barcode fills in automatically!
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANALYTICS TAB
───────────────────────────────────────────────────────────── */
function AnalyticsTab({ t, dark }) {
  const [stats, setStats]     = useState(null);
  const [period, setPeriod]   = useState('7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/shops/dashboard/`, { withCredentials: true })
      .then(r => setStats(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <Spinner t={t}/>;

  const days    = parseInt(period);
  const chart   = (stats?.daily_chart||[]).slice(-days);
  const chartMax = Math.max(...chart.map(d=>d.revenue),1);
  const s       = stats?.summary||{};
  const split   = stats?.payment_split||{cash:0,upi:0};
  const splitTotal = (split.cash||0)+(split.upi||0);
  const cashPct = splitTotal>0?Math.round(((split.cash||0)/splitTotal)*100):0;
  const upiPct  = 100-cashPct;

  return (
    <div className="p-5 max-w-4xl space-y-5">
      <div className="flex gap-2">
        {[['7','7 Days'],['14','14 Days'],['30','30 Days']].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all tab-hover ${period===v?t.tabActive:t.tabInactive}`}>
            {l}
          </button>
        ))}
      </div>

      <div className={`${t.card} border rounded-xl p-5`}>
        <p className={`${t.textSub} text-xs uppercase tracking-wider mb-4 font-semibold`}>Revenue Chart</p>
        <div className="flex items-end gap-1 h-36">
          {chart.map((d,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className={`absolute bottom-full mb-1 ${dark?'bg-[#0c0e11] border-white/8 text-white/60':'bg-white border-gray-200 text-gray-600 shadow-sm'} border text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none`}>
                {d.date}: {fm(d.revenue)} ({d.orders} orders)
              </div>
              <div className="w-full bg-orange-500/60 hover:bg-orange-500 rounded-t transition-colors"
                   style={{height:`${Math.max(2,(d.revenue/chartMax)*100)}%`}}/>
              {chart.length<=14&&<span className={`text-[8px] ${t.textMuted} rotate-45 origin-left`}>{d.date.split(' ')[0]}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className={`${t.card} border rounded-xl overflow-hidden`}>
          <div className={`px-5 py-3.5 border-b ${t.divider}`}><p className={`${t.textSub} text-xs uppercase tracking-wider font-semibold`}>Top Products</p></div>
          {(stats?.top_products||[]).length===0
            ? <p className={`${t.textMuted} text-sm p-5`}>No sales data yet</p>
            : stats.top_products.map((p,i)=>{
              const maxRev = stats.top_products[0]?.revenue||1;
              return (
                <div key={i} className={`px-5 py-3 border-b ${t.divider} last:border-0`}>
                  <div className="flex justify-between mb-1.5">
                    <span className={`${t.text} text-sm font-medium`}>{p.name}</span>
                    <span className={`${dark?'text-orange-400':'text-orange-600'} mono text-sm font-bold`}>{fm(p.revenue)}</span>
                  </div>
                  <div className={`h-1.5 ${dark?'bg-white/5':'bg-gray-100'} rounded-full overflow-hidden`}>
                    <div className="h-full bg-orange-500 rounded-full" style={{width:`${(p.revenue/maxRev)*100}%`}}/>
                  </div>
                </div>
              );
            })
          }
        </div>

        <div className={`${t.card} border rounded-xl p-5 space-y-4`}>
          <p className={`${t.textSub} text-xs uppercase tracking-wider font-semibold`}>Payment Split</p>
          <div className="space-y-3">
            {[
              {label:'Cash / COD', pct:cashPct, count:split.cash||0, color:'bg-blue-500'},
              {label:'UPI',        pct:upiPct,  count:split.upi||0,  color:'bg-purple-500'},
            ].map((x,i)=>(
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className={`${t.textSub} font-medium`}>{x.label}</span>
                  <span className={`${t.textMuted} mono`}>{x.count} orders ({x.pct}%)</span>
                </div>
                <div className={`h-2.5 ${dark?'bg-white/5':'bg-gray-100'} rounded-full overflow-hidden`}>
                  <div className={`h-full ${x.color} rounded-full transition-all`} style={{width:`${x.pct}%`}}/>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[{label:'Total Orders',value:s.total_orders||0},{label:'Total Revenue',value:fm(s.total_revenue)}].map((x,i)=>(
              <div key={i} className={`${t.cardInner} border ${t.divider} rounded-xl p-3 text-center`}>
                <p className={`${t.textMuted} text-[11px] mb-1 font-medium`}>{x.label}</p>
                <p className={`${t.text} font-bold mono text-lg`}>{x.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUPPLIERS TAB
───────────────────────────────────────────────────────────── */
function SuppliersTab({ t, dark }) {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm]           = useState({name:'',phone:'',items_supplied:'',notes:''});
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  const load = () => {
    setLoading(true);
    axios.get(`${API}/api/shops/suppliers/`, { withCredentials: true })
      .then(r=>setSuppliers(r.data.suppliers||[])).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(load,[]);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await axios.post(`${API}/api/shops/suppliers/add/`, form, { withCredentials: true });
      if (!r.data.success) throw new Error(r.data.error || 'Failed');
      // Real-time update — prepend new supplier instantly
      setSuppliers(prev => [r.data.supplier, ...prev]);
      setForm({name:'',phone:'',items_supplied:'',notes:''});
    } catch(e) { alert(e.response?.data?.error || e.message || 'Failed to add supplier'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try { await axios.delete(`${API}/api/shops/suppliers/${id}/delete/`, { withCredentials: true }); load(); } catch {}
  };

  if (loading) return <Spinner t={t}/>;

  return (
    <div className="p-5 max-w-3xl space-y-5">
      <div className={`${t.card} border rounded-xl p-5 space-y-4`}>
        <p className={`${t.textSub} text-sm uppercase tracking-wider font-bold`}>Add Supplier</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[['name','Supplier Name *'],['phone','Phone'],['items_supplied','Items Supplied'],['notes','Notes']].map(([k,l])=>(
            <div key={k}>
              <p className={`${t.textSub} text-xs mb-1.5 font-semibold`}>{l}</p>
              <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${t.input}`}/>
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving||!form.name.trim()}
          className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          {saving?'Adding...':'+ Add Supplier'}
        </button>
      </div>

      <div className="space-y-3">
        {suppliers.length===0
          ? <div className="text-center py-10"><p className="text-4xl mb-2">🚚</p><p className={`${t.textMuted} text-sm`}>No suppliers yet</p></div>
          : suppliers.map(s=>(
            <div key={s.id} className={`${t.card} border rounded-xl p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`${t.text} font-bold text-base`}>{s.name}</p>
                  {s.phone&&<p className={`${t.textSub} text-sm mono mt-0.5`}>{s.phone}</p>}
                  {s.items_supplied&&<p className={`${t.textSub} text-sm mt-1`}>🛒 {s.items_supplied}</p>}
                  {s.notes&&<p className={`${t.textMuted} text-sm mt-0.5 italic`}>{s.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {s.phone&&<>
                    <a href={`tel:${s.phone}`} className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors font-medium">📞</a>
                    <a href={`https://wa.me/91${s.phone}`} target="_blank" rel="noreferrer" className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors font-medium">💬</a>
                  </>}
                  <button onClick={()=>del(s.id)} className="text-sm bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REVIEWS TAB
───────────────────────────────────────────────────────────── */
function ReviewsTab({ shopData, t, dark }) {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Load reviews
    axios.get(`${API}/api/shops/reviews/`, { withCredentials: true })
      .then(r => setReviews(r.data.reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    // Load products for most-sold info
    axios.get(`${API}/api/shops/dashboard/`, { withCredentials: true })
      .then(r => setProducts(r.data.top_products || []))
      .catch(() => {});
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const ratingCounts = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  const shopUrl = `${window.location.origin}/shop/${shopData?.shop_code}`;
  const reviewUrl = `${shopUrl}?review=1`;

  if (loading) return <Spinner t={t}/>;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* LEFT: Reviews list */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`${t.text} font-bold text-lg`}>
              Customer Reviews <span className={`${t.textMuted} text-sm font-normal`}>({reviews.length})</span>
            </h2>
          </div>

          {/* Share review link */}
          <div className={`${t.card} border border-orange-200 rounded-2xl p-4 space-y-3`}>
            <p className={`${t.text} font-bold text-sm`}>📤 Share with customers to collect reviews</p>
            <div className={`${t.cardInner} border ${t.divider} rounded-xl p-3 flex items-center gap-2 flex-wrap`}>
              <p className={`${t.textSub} text-xs mono break-all flex-1`}>{reviewUrl}</p>
              <button onClick={() => navigator.clipboard.writeText(reviewUrl)}
                className="bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0">
                Copy Link
              </button>
            </div>
            <p className={`${t.textMuted} text-xs`}>Share this link on WhatsApp, print on bills, or put in your shop — customers can rate and review directly.</p>
          </div>

          {/* Reviews */}
          {reviews.length === 0
            ? <div className={`${t.card} border rounded-2xl py-16 text-center`}>
                <p className="text-5xl mb-3">⭐</p>
                <p className={`${t.text} font-bold text-base mb-1`}>No reviews yet</p>
                <p className={`${t.textMuted} text-sm`}>Share the link above with your customers to start collecting reviews</p>
              </div>
            : reviews.map((r, i) => (
              <div key={i} className={`${t.card} border rounded-2xl p-4 space-y-2`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${dark?'bg-orange-500/15 text-orange-400':'bg-orange-100 text-orange-600'}`}>
                      {(r.customer_name||'?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className={`${t.text} font-bold text-sm`}>{r.customer_name || 'Anonymous'}</p>
                      <p className={`${t.textMuted} text-xs`}>{r.created_at || 'Recently'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-lg ${s <= (r.rating||0) ? 'text-amber-400' : dark?'text-white/10':'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                </div>
                {r.comment && <p className={`${t.textSub} text-sm leading-relaxed pl-13`}>{r.comment}</p>}
                {r.items_ordered?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.items_ordered.map((item, j) => (
                      <span key={j} className={`text-xs ${t.badgeGhost} border px-2 py-0.5 rounded-full`}>{item}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          }
        </div>

        {/* RIGHT: Stats */}
        <div className="w-full xl:w-72 shrink-0 space-y-4">

          {/* Rating overview */}
          {avgRating && (
            <div className={`${t.card} border rounded-2xl p-5 text-center space-y-2`}>
              <p className={`${t.textSub} text-xs font-semibold uppercase tracking-wider`}>Average Rating</p>
              <p className={`${dark?'text-amber-400':'text-amber-500'} text-6xl font-black mono`}>{avgRating}</p>
              <div className="flex justify-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`text-2xl ${s <= Math.round(parseFloat(avgRating)) ? 'text-amber-400' : dark?'text-white/10':'text-gray-200'}`}>★</span>
                ))}
              </div>
              <p className={`${t.textMuted} text-xs`}>{reviews.length} review{reviews.length!==1?'s':''} total</p>
            </div>
          )}

          {/* Rating breakdown */}
          {reviews.length > 0 && (
            <div className={`${t.card} border rounded-2xl p-4 space-y-2.5`}>
              <p className={`${t.textSub} text-xs font-semibold`}>⭐ Rating Breakdown</p>
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className={`${t.textSub} text-xs mono w-4`}>{star}</span>
                  <span className="text-amber-400 text-xs">★</span>
                  <div className={`flex-1 h-2 ${dark?'bg-white/8':'bg-gray-100'} rounded-full overflow-hidden`}>
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{width: reviews.length ? `${(count/reviews.length)*100}%` : '0%'}}/>
                  </div>
                  <span className={`${t.textMuted} text-xs mono w-4 text-right`}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Most sold items */}
          {products.length > 0 && (
            <div className={`${t.card} border rounded-2xl p-4 space-y-3`}>
              <p className={`${t.textSub} text-xs font-semibold`}>🔥 Most Ordered Items</p>
              {products.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-xs font-bold mono w-4 ${dark?'text-orange-400':'text-orange-500'}`}>{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`${t.text} text-sm font-semibold truncate`}>{p.name}</p>
                    <p className={`${t.textMuted} text-xs`}>{p.orders} orders</p>
                  </div>
                  <span className={`${dark?'text-orange-400':'text-orange-600'} text-xs font-bold mono shrink-0`}>₹{parseFloat(p.revenue||0).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* QR tip */}
          <div className={`${dark?'bg-purple-500/8 border-purple-500/20':'bg-purple-50 border-purple-200'} border rounded-2xl p-4`}>
            <p className={`${dark?'text-purple-300':'text-purple-800'} font-bold text-sm mb-1.5`}>💡 Tip</p>
            <p className={`${dark?'text-purple-400':'text-purple-700'} text-xs leading-relaxed`}>
              Print the review link as a QR code on your bills or counter display. More reviews = more trust from new customers!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AI CHAT TAB
───────────────────────────────────────────────────────────── */
function AIChatTab({ t, dark }) {
  function now() { return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }

  const [messages, setMessages] = useState([{
    sender:'bot',
    text:'Namaste! 🙏 Main aapka AI assistant hoon.\n\nMain aapke shop ka data dekh sakta hoon — products, orders, stock, aur aapke area ka trend. Poochiye kuch bhi:\n• "Kya rakhna chahiye mujhe?" (area-wise suggestions)\n• "Kaun se items low hain?"\n• "Aaj kitne orders aaye?"\n• "Kya naya stock laana chahiye?"',
    time:now()
  }]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [shopCtx, setShopCtx] = useState(null);
  const endRef = useRef(null);

  // Load shop context once on mount
  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/shops/me/`, { withCredentials:true }).catch(()=>null),
      axios.get(`${API}/api/inventory/products/`, { withCredentials:true }).catch(()=>null),
      axios.get(`${API}/api/shops/dashboard/`, { withCredentials:true }).catch(()=>null),
    ]).then(([shopRes, prodRes, dashRes]) => {
      const shop     = shopRes?.data?.shop || {};
      const products = Array.isArray(prodRes?.data) ? prodRes.data : (prodRes?.data?.results || []);
      const dash     = dashRes?.data || {};
      setShopCtx({ shop, products, dash });
    });
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, loading]);

  const buildSystemPrompt = (ctx) => {
    if (!ctx) return '';
    const { shop, products, dash } = ctx;
    const area    = [shop.address, shop.city, shop.state].filter(Boolean).join(', ') || 'India';
    const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).map(p=>p.name).join(', ') || 'None';
    const outStock = products.filter(p => p.stock_quantity === 0).map(p=>p.name).join(', ') || 'None';
    const topItems = (dash.top_products || []).slice(0,5).map(p=>`${p.name} (${p.orders} orders)`).join(', ') || 'Not enough data yet';
    const totalRev = dash.total_revenue || 0;
    const todayOrders = dash.today_orders || 0;
    const productList = products.slice(0,30).map(p=>`${p.name} (₹${p.price}, stock: ${p.stock_quantity}, cat: ${p.category})`).join('\n') || 'No products yet';

    return `You are a smart AI assistant for a kirana (grocery) shop owner in India. You speak in Hinglish (mix of Hindi and English) because the shopkeeper is more comfortable in Hindi. Be friendly, practical, and give actionable advice.

SHOP DETAILS:
- Shop name: ${shop.name || 'Unknown'}
- Location/Area: ${area}
- Shop code: ${shop.shop_code || ''}

CURRENT INVENTORY (${products.length} products):
${productList}

STOCK ALERTS:
- Low stock: ${lowStock}
- Out of stock: ${outStock}

SALES DATA:
- Today's orders: ${todayOrders}
- Total revenue: ₹${totalRev}
- Top selling items: ${topItems}

YOUR CAPABILITIES:
1. AREA-WISE SUGGESTIONS: When asked what to stock, think about the area (${area}). Suggest items that are popular in that region — e.g. if the area is in MP/UP suggest wheat flour, daal, masala items in bulk; if coastal suggest rice, coconut oil, etc. Also factor in season (current month: ${new Date().toLocaleString('default',{month:'long'})}).
2. STOCK MANAGEMENT: Tell which items are running low and what quantity to reorder.
3. PRICING TIPS: Suggest if any items are priced unusually compared to market norms.
4. TREND ANALYSIS: Based on top-selling items, suggest complementary products to add.
5. BUSINESS TIPS: Give practical kirana shop advice relevant to Indian market.

Always respond in Hinglish. Keep responses concise and practical. Use bullet points for lists. Be like a friendly, knowledgeable business advisor.`;
  };

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const msgTime = now();
    setMessages(p => [...p, { sender:'user', text, time:msgTime }]);
    setInput(''); setLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(shopCtx);
      const r = await axios.post(`${API}/api/chatbot/admin/`, {
        message: text,
        system_context: systemPrompt,
      }, { withCredentials:true });
      setMessages(p => [...p, { sender:'bot', text: r.data.reply, time:now() }]);
    } catch {
      setMessages(p => [...p, { sender:'bot', text:'Sorry, connect nahi ho pa raha. Thodi der baad try karein.', time:now() }]);
    } finally { setLoading(false); }
  };

  const quick = [
    '🏪 Kya rakhna chahiye mujhe area ke hisaab se?',
    '📦 Kaun se items low stock mein hain?',
    '🔥 Most sold items kaun se hain?',
    '💡 Kya naya product add karoon?',
    '📊 Aaj ka order summary batao',
    '💰 Revenue kaise badhao?',
  ];

  return (
    <div className="flex flex-col" style={{height:'calc(100vh - 108px)'}}>
      {/* Context loaded indicator */}
      {shopCtx && (
        <div className={`px-4 py-2 border-b ${t.divider} flex items-center gap-2`}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
          <span className={`${t.textMuted} text-xs`}>
            Shop data loaded — {shopCtx.products.length} products, area: {[shopCtx.shop.address, shopCtx.shop.city].filter(Boolean).join(', ') || 'your location'}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${t.scrollbar}`}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender==='user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender==='bot' && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1 ${dark?'bg-orange-500/15':'bg-orange-100'}`}>🤖</div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
              ${m.sender==='user'
                ? 'bg-orange-500 text-white rounded-tr-none shadow-sm'
                : dark ? 'bg-[#0f1117] border border-white/6 text-white/70 rounded-tl-none'
                       : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
              }`}>
              {m.text}
              <div className={`text-[9px] mt-2 ${m.sender==='user'?'text-white/50 text-right':t.textMuted}`}>{m.time}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${dark?'bg-orange-500/15':'bg-orange-100'}`}>🤖</div>
            <div className={`${dark?'bg-[#0f1117] border-white/6':'bg-white border-gray-200 shadow-sm'} border px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center`}>
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay:`${i*150}ms`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input area */}
      <div className={`border-t ${t.divider} ${dark?'bg-[#0f1117]':'bg-white'} p-4 space-y-3`}>
        {/* Quick suggestions */}
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
          {quick.map((q, i) => (
            <button key={i} onClick={() => send(q)} disabled={loading}
              className={`whitespace-nowrap text-xs border px-3 py-1.5 rounded-full disabled:opacity-40 transition-colors font-medium snap-start shrink-0 ${t.tabInactive} border-current`}>
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(input); }}}
            placeholder="Kuch bhi poochiye apne shop ke baare mein..."
            disabled={loading}
            className={`flex-1 border rounded-2xl px-4 py-3 text-sm outline-none transition-colors ${t.input}`}/>
          <button onClick={()=>send(input)} disabled={loading||!input.trim()}
            className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white px-5 py-3 rounded-2xl font-bold transition-colors text-lg">→</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SETTINGS TAB
───────────────────────────────────────────────────────────── */
function SettingsTab({ shopData, setShopData, t, dark }) {
  const [form, setForm] = useState({
    name: shopData?.name||'',
    tagline: shopData?.tagline||'',
    address: shopData?.address||'',
    phone: shopData?.phone||'',
    logo_emoji: shopData?.logo_emoji||'🏪',
    upi_id: shopData?.upi_id||'',
    is_open: shopData?.is_open??true,
    offers_delivery: shopData?.offers_delivery??true,
    free_delivery_upi: shopData?.free_delivery_upi??false,
    delivery_base_charge: shopData?.delivery_base_charge??20,
    delivery_per_km: shopData?.delivery_per_km??10,
    delivery_base_km: shopData?.delivery_base_km??2,
    delivery_radius_km: shopData?.delivery_radius_km??5,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [showQR, setShowQR] = useState(false);

  const shopUrl     = `${window.location.origin}/shop/${shopData?.shop_code}`;
  const qrImageUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shopUrl)}&bgcolor=111b21&color=f97316&margin=14`;
  const emojis      = ['🏪','🛒','🏬','🥦','🫙','🌾','🍛','💚','🏡','⭐'];

  const save = async () => {
    setSaving(true);
    try {
      const r = await axios.post(`${API}/api/shops/update/`, form, { withCredentials: true });
      if (r.data.success) { setShopData(r.data.shop); setSaved(true); setTimeout(()=>setSaved(false),2500); }
    } catch { alert('Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  const printQR = () => {
    const win = window.open('','_blank');
    win.document.write(`
      <html><head><title>QR — ${shopData?.name}</title>
      <style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:sans-serif}.box{border:2px solid #e5e7eb;border-radius:16px;padding:28px 36px;text-align:center}h1{font-size:22px;font-weight:800;margin:16px 0 4px;color:#111}p{font-size:12px;color:#888;margin:0 0 12px}.url{font-size:11px;color:#f97316;word-break:break-all;margin-top:12px}</style>
      </head><body>
      <div class="box">
        <p>Scan to order from</p>
        <h1>${shopData?.name}</h1>
        <img src="${qrImageUrl}" width="220" height="220"/>
        <div class="url">${shopUrl}</div>
      </div>
      <script>window.onload=()=>window.print()<\/script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-5">
      <div className={`${t.card} border rounded-xl p-5 space-y-4`}>
        <p className={`${t.textSub} text-sm uppercase tracking-wider font-bold`}>Shop Profile</p>
        <div>
          <p className={`${t.textSub} text-xs mb-2 font-semibold`}>Shop Icon</p>
          <div className="flex gap-2 flex-wrap">
            {emojis.map(e=>(
              <button key={e} onClick={()=>setForm(f=>({...f,logo_emoji:e}))}
                className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center border transition-all tab-hover ${form.logo_emoji===e?'border-orange-400 bg-orange-50 shadow-sm':'border-gray-200 hover:border-orange-300 bg-white'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        {[['name','Shop Name'],['tagline','Tagline'],['address','Address'],['phone','Phone Number'],['upi_id','UPI ID']].map(([k,l])=>(
          <div key={k}>
            <p className={`${t.textSub} text-xs mb-1.5 font-semibold`}>{l}</p>
            <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${t.input}`}/>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button onClick={()=>setForm(f=>({...f,is_open:!f.is_open}))}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.is_open?'bg-green-500':'bg-gray-300'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_open?'left-7':'left-1'}`}/>
          </button>
          <span className={`${t.textSub} text-sm font-medium`}>{form.is_open?'🟢 Shop is Open':'🔴 Shop is Closed'}</span>
        </div>
      </div>

      <div className={`${t.card} border rounded-xl p-5 space-y-4`}>
        <p className={`${t.textSub} text-sm uppercase tracking-wider font-bold`}>Delivery Settings</p>
        <div className="flex items-center gap-3">
          <button onClick={()=>setForm(f=>({...f,offers_delivery:!f.offers_delivery}))}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.offers_delivery?'bg-green-500':'bg-gray-300'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.offers_delivery?'left-7':'left-1'}`}/>
          </button>
          <span className={`${t.textSub} text-sm font-medium`}>{form.offers_delivery?'🛵 Delivery Available':'📦 Pickup Only'}</span>
        </div>
        {form.offers_delivery&&(
          <div className="flex items-center gap-3">
            <button onClick={()=>setForm(f=>({...f,free_delivery_upi:!f.free_delivery_upi}))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.free_delivery_upi?'bg-purple-500':'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.free_delivery_upi?'left-7':'left-1'}`}/>
            </button>
            <span className={`${t.textSub} text-sm font-medium`}>📱 Free delivery for UPI payments</span>
          </div>
        )}
        {form.offers_delivery&&(
          <div className="grid sm:grid-cols-2 gap-3">
            {[['delivery_base_charge','Base Delivery Charge (₹)','e.g. 20'],['delivery_base_km','Free Radius (km)','e.g. 2'],['delivery_per_km','Charge per extra km (₹)','e.g. 10'],['delivery_radius_km','Max Delivery Radius (km)','e.g. 5']].map(([k,l,ph])=>(
              <div key={k}>
                <p className={`${t.textSub} text-xs mb-1.5 font-semibold`}>{l}</p>
                <input type="number" step="0.5" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${t.input}`}/>
              </div>
            ))}
          </div>
        )}
        {form.offers_delivery&&(
          <div className={`${t.cardInner} border ${t.divider} rounded-xl px-4 py-3`}>
            <p className={`${t.textSub} text-sm`}>
              First {form.delivery_base_km}km = ₹{form.delivery_base_charge} flat · Then ₹{form.delivery_per_km}/km · Max {form.delivery_radius_km}km
            </p>
          </div>
        )}
      </div>

      <div className={`${t.card} border rounded-xl p-5 space-y-4`}>
        <p className={`${t.textSub} text-sm uppercase tracking-wider font-bold`}>Customer Storefront & QR Code</p>
        <div className={`${t.cardInner} rounded-xl p-3 border ${t.divider} flex items-center gap-2`}>
          <p className={`${t.textSub} text-sm mono break-all flex-1`}>{shopUrl}</p>
          <button onClick={()=>navigator.clipboard.writeText(shopUrl)}
            className="text-orange-600 text-xs border border-orange-200 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors shrink-0 font-semibold">
            Copy
          </button>
        </div>
        <button onClick={()=>setShowQR(s=>!s)}
          className="w-full border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-bold py-3 rounded-xl transition-colors">
          {showQR?'▲ Hide QR Code':'▼ Show QR Code'}
        </button>
        {showQR&&(
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <img src={qrImageUrl} alt="QR Code" width="220" height="220" className="rounded-xl block"/>
            </div>
            <div className="text-center">
              <p className={`${t.text} font-bold text-lg`}>{shopData?.name}</p>
              <p className={`${t.textMuted} text-sm mt-1`}>Customers scan this to open your shop directly</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={printQR}
                className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                🖨️ Print QR
              </button>
              <a href={qrImageUrl} download={`${shopData?.shop_code}-qr.png`}
                className={`flex-1 ${t.badgeGhost} border py-3 rounded-xl text-sm font-bold transition-colors text-center hover:opacity-75`}>
                ⬇️ Download
              </a>
            </div>
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${saved?'bg-green-500 text-white':'bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-60'}`}>
        {saved?'✓ Changes Saved!':saving?'Saving...':'Save Changes'}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SHARED
───────────────────────────────────────────────────────────── */
function Spinner({ t }) {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin"/>
    </div>
  );
}