// App.jsx — KiranaOS Platform Router
import { useState, useEffect } from 'react';
import axios from 'axios';
import LandingPage from './LandingPage';
import OwnerDashboard from './OwnerDashboard';
import CustomerStorefront from './CustomerStorefront';

export const API = '';  // Vite proxies /api/* → Django. Same origin = cookies work.
axios.defaults.withCredentials = true;

function getRoute() {
  const p = window.location.pathname;
  if (p.startsWith('/shop/')) return { page: 'storefront', shopCode: p.replace('/shop/', '').replace(/\/$/, '') };
  if (p === '/dashboard') return { page: 'dashboard' };
  if (p === '/login')     return { page: 'login' };
  if (p === '/register')  return { page: 'register' };
  return { page: 'landing' };
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('popstate'));
}

export default function App() {
  const [route, setRoute]             = useState(getRoute());
  const [user, setUser]               = useState(null);
  const [shop, setShop]               = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const h = () => setRoute(getRoute());
    window.addEventListener('popstate', h);
    return () => window.removeEventListener('popstate', h);
  }, []);

  useEffect(() => {
    axios.get(`${API}/api/shops/me/`)
      .then(r => {
        // FIX: check r.data.user, not r.data.authenticated (which never exists)
        if (r.data.user) {
          setUser(r.data.user);
          setShop(r.data.shop);
          // Only redirect away from login/register — landing page (/) stays accessible always
          if (['login', 'register'].includes(route.page)) navigate('/dashboard');
        } else {
          if (route.page === 'dashboard') navigate('/');
        }
      })
      .catch(() => { if (route.page === 'dashboard') navigate('/'); })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/api/shops/logout/`).catch(() => {});
    setUser(null); setShop(null); navigate('/');
  };

  const handleAuthSuccess = (u, s) => { setUser(u); setShop(s); navigate('/dashboard'); };

  if (route.page === 'storefront') return <CustomerStorefront shopCode={route.shopCode} />;
  if (!authChecked) return <Spinner />;
  if (route.page === 'dashboard') return user ? <OwnerDashboard shopInfo={shop} userInfo={user} onLogout={handleLogout} /> : null;
  if (route.page === 'login' || route.page === 'register')
    return <AuthPage mode={route.page} onSuccess={handleAuthSuccess}
             onSwitch={() => navigate(route.page === 'login' ? '/register' : '/login')} />;
  return <LandingPage onGetStarted={() => navigate('/register')} onLogin={() => navigate('/login')} isLoggedIn={!!user} onDashboard={() => navigate('/dashboard')} />;
}

function AuthPage({ mode, onSuccess, onSwitch }) {
  const isLogin = mode === 'login';
  const [form, setForm]       = useState({ email:'', password:'', shop_name:'', owner_name:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const url = isLogin ? `${API}/api/shops/login/` : `${API}/api/shops/register/`;
      const res = await axios.post(url, form);
      if (res.data.success) onSuccess(res.data.user, res.data.shop);
    } catch (err) { setError(err.response?.data?.error || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  const fields = isLogin
    ? [['email','Email address','email'],['password','Password','password']]
    : [['owner_name','Your full name','text'],['shop_name','Shop name (e.g. Sharma Kirana)','text'],
       ['email','Email address','email'],['password','Password (min 6 chars)','password']];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6"
         style={{fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity">
            <span className="text-3xl">🏪</span>
            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'1.5rem',color:'white'}}>KiranaOS</span>
          </button>
          <div>
            <h1 className="text-white font-bold text-xl">{isLogin ? 'Welcome back' : 'Register your shop'}</h1>
            <p className="text-white/40 text-sm mt-1">{isLogin ? 'Log in to your dashboard' : 'Free setup in 2 minutes'}</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">⚠️ {error}</p></div>}
          {fields.map(([k,ph,t]) => (
            <input key={k} type={t} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))}
              placeholder={ph} required
              className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3.5 text-white/80 text-sm outline-none placeholder-white/25 focus:border-orange-500/40 transition-colors" />
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Processing...</>
              : isLogin ? 'Log in →' : 'Create My Shop →'}
          </button>
        </form>
        <p className="text-center text-white/35 text-sm">
          {isLogin ? "No account? " : "Already registered? "}
          <button onClick={onSwitch} className="text-[#f97316] hover:text-orange-300 font-medium">{isLogin ? 'Register free' : 'Log in'}</button>
        </p>
        <div className="text-center">
          <button onClick={() => navigate('/')} className="text-white/20 hover:text-white/40 text-xs transition-colors">← Back to home</button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin"/>
    </div>
  );
}