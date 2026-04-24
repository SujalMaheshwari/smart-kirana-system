// LandingPage.jsx — KiranaOS Marketing Homepage
// Aesthetic: Bold editorial, saffron + deep green, premium Indian SaaS
import { useState, useEffect, useRef } from 'react';
import { navigate } from './App';

const FEATURES = [
  { icon: '🤖', title: 'AI Chat Ordering', desc: 'Customers message in Hindi or English. Your AI handles it 24/7 — suggests products, confirms orders, answers questions.' },
  { icon: '📦', title: 'Smart Inventory', desc: 'Track every item in real time. Auto-alerts when stock is low. Update quantities in seconds from your phone.' },
  { icon: '📊', title: 'Sales Dashboard', desc: 'Daily revenue, weekly charts, top-selling products — everything a shopkeeper needs to make better decisions.' },
  { icon: '🏪', title: 'Your Own Storefront', desc: 'Every shop gets a unique link like kiranaos.com/shop/sharma-kirana. Share once, customers order forever.' },
  { icon: '🛵', title: 'Delivery & Payments', desc: 'Auto-calculate delivery charges by distance. Accept COD and UPI. Track every order from placement to delivery.' },
  { icon: '🤝', title: 'Supplier Manager', desc: 'Store supplier contacts, call or WhatsApp them directly, track last reorder dates — all in one place.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Register your shop', desc: 'Create a free account. Give your shop a name. You get a unique storefront link instantly — no tech skills needed.' },
  { step: '02', title: 'Add your products', desc: 'Add products with prices and stock levels. Mark loose items like daal or sugar for kg-based ordering.' },
  { step: '03', title: 'Share with customers', desc: 'Send your shop link or print your QR code. Customers chat to order — just like WhatsApp.' },
];

const TESTIMONIALS = [
  { name: 'Ramesh Gupta', shop: 'Gupta General Store, Bhopal', quote: 'Pehle sab manually likhta tha. Ab AI khud order le leta hai. Mera time aur energy dono bachta hai.', avatar: 'RG' },
  { name: 'Priya Sharma', shop: 'Sharma Kirana, Indore', quote: 'Mere customers ko apni dukan ki website mil gayi. Professional lagta hai aur orders bhi badhe hain.', avatar: 'PS' },
  { name: 'Vikram Singh', shop: 'Singh Bros, Jabalpur', quote: 'Stock tracking se pehle kaafi cheezein khatam ho jaati thi bina pata chale. Ab kabhi nahi hota.', avatar: 'VS' },
];

export default function LandingPage({ onGetStarted, onLogin, isLoggedIn, onDashboard }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden"
         style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Syne:wght@700;800&display=swap');
        .syne { font-family: 'Syne', sans-serif; font-weight: 800; }
        .grid-bg { background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px); background-size: 48px 48px; }
        .orange-glow { background: radial-gradient(ellipse 70% 50% at 50% -5%, rgba(249,115,22,0.18) 0%, transparent 60%); }
        .card-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .card-lift:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(249,115,22,0.08); }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float { animation: floatY 4s ease-in-out infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.65s ease both; }
        .fade-up-2 { animation: fadeUp 0.65s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.65s 0.3s ease both; }
      `}</style>

      {/* NAV */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080808]/95 backdrop-blur-xl border-b border-white/5 py-3' : 'py-5'}`}>
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={isLoggedIn ? onDashboard : onGetStarted}>
            <span className="text-2xl">🏪</span>
            <span className="syne text-xl text-white">KiranaOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/55">
            {[['#features','Features'],['#how','How it works'],['#testimonials','Stories']].map(([h,l]) => (
              <a key={h} href={h} className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <button onClick={onDashboard} className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
                Go to Dashboard →
              </button>
            ) : (<>
              <button onClick={onLogin} className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">Log in</button>
              <button onClick={onGetStarted} className="bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
                Start Free →
              </button>
            </>)}
          </div>
          <button onClick={() => setMobileMenu(m => !m)} className="md:hidden text-white/60 hover:text-white p-2">
            {mobileMenu ? '✕' : '☰'}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-[#111] border-t border-white/5 px-5 py-4 space-y-3">
            {[['#features','Features'],['#how','How it works'],['#testimonials','Stories']].map(([h,l]) => (
              <a key={h} href={h} onClick={() => setMobileMenu(false)} className="block text-white/65 hover:text-white py-1.5 text-sm">{l}</a>
            ))}
            <div className="flex gap-2 pt-2 border-t border-white/5">
              {isLoggedIn ? (
                <button onClick={onDashboard} className="flex-1 bg-[#f97316] text-white font-semibold py-2.5 rounded-xl text-sm">Go to Dashboard →</button>
              ) : (<>
                <button onClick={onLogin} className="flex-1 border border-white/10 text-white/65 py-2.5 rounded-xl text-sm">Log in</button>
                <button onClick={onGetStarted} className="flex-1 bg-[#f97316] text-white font-semibold py-2.5 rounded-xl text-sm">Register Free</button>
              </>)}
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 grid-bg orange-glow overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-orange-500/4 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-600/4 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-5 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — Copy */}
            <div className="space-y-7">
              <div className="fade-up inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 text-sm w-fit">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <span className="text-orange-400 font-medium">Beta — Free for all shopkeepers</span>
              </div>

              <h1 className="fade-up-2 syne text-5xl md:text-6xl lg:text-[4.5rem] leading-[0.95] tracking-tight">
                Apni kirana<br />
                <span className="text-[#f97316]">digital</span> karo<br />
                <span className="relative">
                  <span className="text-[#22c55e]">2 minute</span>
                  <svg className="absolute -bottom-1.5 left-0 w-full overflow-visible" viewBox="0 0 240 10" preserveAspectRatio="none">
                    <path d="M2 6 Q120 2 238 6" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5"/>
                  </svg>
                </span>
                {' '}mein
              </h1>

              <p className="fade-up-3 text-lg text-white/50 leading-relaxed max-w-md">
                Give your local shop a digital storefront. Customers order via chat in Hindi or English. You manage everything from one clean dashboard.
              </p>

              <div className="fade-up-3 flex flex-col sm:flex-row gap-3">
                <button onClick={onGetStarted}
                  className="group bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold px-8 py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-orange-500/25 text-base flex items-center justify-center gap-2">
                  Register Your Shop Free
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button onClick={onLogin}
                  className="border border-white/10 hover:border-white/20 text-white/65 hover:text-white font-medium px-8 py-4 rounded-2xl transition-all text-base">
                  I have an account
                </button>
              </div>

              <div className="fade-up-3 flex flex-wrap items-center gap-5 text-sm text-white/35">
                {['No credit card needed', 'Setup in 2 mins', 'Free forever'].map((t,i) => (
                  <span key={i} className="flex items-center gap-1.5"><span className="text-green-400">✓</span>{t}</span>
                ))}
              </div>
            </div>

            {/* Right — Phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative float">
                {/* Phone */}
                <div className="w-[17rem] bg-[#0d0d0d] rounded-[2.5rem] overflow-hidden border border-white/8 shadow-2xl"
                     style={{boxShadow:'0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'}}>
                  {/* Status bar */}
                  <div className="bg-black px-6 py-2.5 flex justify-between items-center">
                    <span className="text-white/70 text-[11px] font-medium">9:41</span>
                    <div className="w-20 h-4 bg-[#111] rounded-full border border-white/8" />
                    <span className="text-white/40 text-[11px]">●●●</span>
                  </div>
                  {/* Chat header */}
                  <div className="bg-[#1a2730] px-4 py-3 flex items-center gap-2.5 border-b border-white/5">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-base border border-orange-500/20">🏪</div>
                    <div>
                      <p className="text-white/90 text-[12px] font-semibold">Sharma Kirana</p>
                      <p className="text-green-400 text-[9px]">● online</p>
                    </div>
                  </div>
                  {/* Messages */}
                  <div className="bg-[#0b1418] px-3 py-3 space-y-2.5 min-h-[260px]">
                    {[
                      { text: 'Namaste! Kya chahiye aaj?', bot: true },
                      { text: '2kg sugar aur Maggi ka ek pack', bot: false },
                      { text: 'Sugar ₹90 + Maggi ₹14 = ₹104\n\nCOD ya UPI?', bot: true },
                      { text: 'UPI kar do bhaiya', bot: false },
                      { text: '✅ Order confirm! QR aa raha hai...', bot: true },
                    ].map((m, i) => (
                      <div key={i} className={`flex ${m.bot ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[76%] px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed whitespace-pre-wrap ${m.bot ? 'bg-[#202c33] text-white/85 rounded-tl-none' : 'bg-[#005c4b] text-white/90 rounded-tr-none'}`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Input bar */}
                  <div className="bg-[#1a2730] px-3 py-2 flex gap-2 items-center border-t border-white/5">
                    <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1 text-[9px] text-white/25">Message...</div>
                    <div className="w-6 h-6 bg-[#00a884] rounded-full flex items-center justify-center text-[9px] text-black font-bold">➤</div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -right-5 top-1/4 bg-green-500 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg shadow-green-900/30 rotate-2">
                  ✓ Order placed!
                </div>
                <div className="absolute -left-7 bottom-1/3 bg-[#f97316] text-white text-[9px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg shadow-orange-900/30 -rotate-2">
                  📦 3 new orders
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-white/5 bg-[#0d0d0d] py-5">
        <div className="max-w-5xl mx-auto px-5 flex flex-wrap items-center justify-center gap-8 text-sm text-white/35">
          {['500+ shops registered', '₹12L+ orders processed', 'Hindi + English support', 'Free to start'].map((s, i) => (
            <span key={i} className="flex items-center gap-2"><span className="text-orange-500">◆</span>{s}</span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-28 bg-[#080808]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16 space-y-3">
            <p className="text-orange-400 font-semibold text-xs uppercase tracking-widest">What You Get</p>
            <h2 className="syne text-4xl md:text-5xl">Everything your shop needs</h2>
            <p className="text-white/40 text-lg max-w-lg mx-auto">Built specifically for Indian kirana stores. Not a generic tool.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="card-lift bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="w-11 h-11 bg-orange-500/10 rounded-xl flex items-center justify-center text-2xl border border-orange-500/10">{f.icon}</div>
                <h3 className="font-semibold text-white text-base">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-28 bg-[#0d0d0d] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-16 space-y-3">
            <p className="text-green-400 font-semibold text-xs uppercase tracking-widest">Setup Process</p>
            <h2 className="syne text-4xl md:text-5xl">Shuru karo minutes mein</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connector lines between cards — positioned behind */}
            <div className="hidden md:block absolute top-[52px] left-[33%] right-[33%] h-px bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-orange-500/20 z-0"/>
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i}
                onClick={i===0 ? onGetStarted : undefined}
                className={`relative space-y-4 z-10 rounded-2xl p-5 transition-all duration-200
                  ${i===0 ? 'cursor-pointer hover:bg-white/4 hover:border-orange-500/20 border border-transparent group' : ''}`}>
                <div className="syne text-6xl text-white/4">{s.step}</div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all
                  ${i===0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 group-hover:scale-110' : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'}`}>
                  {parseInt(s.step)}
                </div>
                <div>
                  <h3 className={`font-semibold text-base ${i===0?'text-white group-hover:text-orange-400 transition-colors':'text-white'}`}>
                    {s.title}
                    {i===0 && <span className="ml-2 text-orange-400 text-xs font-normal opacity-0 group-hover:opacity-100 transition-opacity">→ Register now</span>}
                  </h3>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                {i===0 && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-semibold bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                      🏪 Register your shop free →
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-28 bg-[#080808]">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-16 space-y-3">
            <p className="text-orange-400 font-semibold text-xs uppercase tracking-widest">Shopkeeper Stories</p>
            <h2 className="syne text-4xl md:text-5xl">Unhi ki zubaani</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card-lift bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 space-y-4">
                <p className="text-white/60 text-sm leading-relaxed italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className="w-9 h-9 bg-orange-500/15 rounded-full flex items-center justify-center text-orange-400 font-bold text-xs border border-orange-500/15">{t.avatar}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/30 text-xs">{t.shop}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 bg-[#0d0d0d] border-t border-white/5">
        <div className="max-w-2xl mx-auto px-5 text-center space-y-7">
          <h2 className="syne text-5xl md:text-6xl leading-tight">
            Apni dukan ko<br /><span className="text-[#f97316]">digital</span> banao aaj
          </h2>
          <p className="text-white/40 text-lg">Free mein shuru karo. Koi card nahi chahiye.</p>
          <button onClick={onGetStarted}
            className="group inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold px-10 py-4 rounded-2xl transition-all hover:shadow-2xl hover:shadow-orange-500/25 text-lg">
            Register Your Shop
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#080808] py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <span className="syne text-white text-base">KiranaOS</span>
          </div>
          <p className="text-white/20 text-xs">© 2025 KiranaOS. Made for Indian shopkeepers.</p>
          <div className="flex gap-5 text-xs text-white/30">
            <button className="hover:text-white transition-colors">Privacy</button>
            <button className="hover:text-white transition-colors">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}