import { useEffect, useState } from 'react';
import {
  UtensilsCrossed, Zap, ArrowRight,
  Clock, TrendingUp, Store, Lock
} from 'lucide-react';
import { Button, Badge, Modal } from './ui';

type Role = 'landing' | 'login' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

export function Landing({ 
  onNavigate, 
  onClientLogin 
}: { 
  onNavigate: (role: Role) => void; 
  onClientLogin: (name: string, phone: string) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

<<<<<<< HEAD
=======
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName && clientPhone) {
      onClientLogin(clientName, clientPhone);
    }
  };

>>>>>>> landingUpdate
  // Registration modal removed to streamline flow

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 20); setScrollY(window.scrollY); };
    const onMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  const categories = [
    { name: 'Tiffin', img: 'https://i.pinimg.com/736x/13/ac/3c/13ac3ce7b1db637177b34659d74fef73.jpg', price: '₹99' },
    { name: 'Breakfast', img: 'https://i.pinimg.com/736x/db/73/5d/db735dfb9eca73033b7c127e46436ee3.jpg', price: '₹59' },
    { name: 'Lunch/Dinner', img: 'https://i.pinimg.com/control1/1200x/f0/ce/0b/f0ce0bf92ce7748dda4ec368a4c5d51e.jpg', price: '₹149' },
    { name: 'Vegetables', img: 'https://i.pinimg.com/736x/6a/04/e5/6a04e5d7d3b1bfd0c4d9ca06b2c041f0.jpg', price: '₹39' },
    { name: 'Thali', img: 'https://i.pinimg.com/736x/5f/56/b3/5f56b35ba78d9678a79db6fa234ed8c0.jpg', price: '₹179' },
  ];

  const benefits = [
    { icon: Zap, title: 'Manage Inventory', desc: 'Add, update or remove dishes instantly matching master templates.' },
    { icon: TrendingUp, title: 'Dynamic Pricing', desc: 'Set custom prices and quantity limits dynamically based on demand.' },
    { icon: Clock, title: 'Instant Order Notifications', desc: 'Get live sound pings and countdown radars for incoming client orders.' },
  ];

  const plans = [
    { name: 'Free', price: '₹0', validity: '30 Days', items: '5 Items', clients: '10 Clients', desc: 'Perfect for trial runs' },
    { name: 'Starter', price: '₹499', validity: '30 Days', items: '10 Items', clients: '30 Clients', desc: 'For growing local kitchens' },
    { name: 'Premium', price: '₹1,499', validity: '90 Days', items: '30 Items', clients: '100 Clients', desc: 'Maximum reach and support' },
  ];

  // Removed redundant handleRegisterSubmit
<<<<<<< HEAD
=======

  const scrollToVendorPartners = () => {
    document.getElementById('vendor-partners')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
>>>>>>> landingUpdate

  return (
    <div className="min-h-screen landing-shell noise relative overflow-hidden text-text">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-[130px] transition-transform duration-1000"
          style={{
            background: 'radial-gradient(circle, #A0A0D0, transparent 70%)',
            transform: `translate(${mousePos.x * 0.01}px, ${mousePos.y * 0.01}px)`,
            top: '-200px',
            left: '-200px',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] transition-transform duration-1000"
          style={{
            background: 'radial-gradient(circle, #8888BB, transparent 70%)',
            transform: `translate(${mousePos.x * -0.015}px, ${mousePos.y * -0.015}px)`,
            bottom: '-100px',
            right: '-100px',
          }}
        />
      </div>

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'glass py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111118]">VIKRAM ADVERTISING</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onNavigate('login')}
              className="text-sm font-semibold text-muted hover:text-text transition-colors flex items-center gap-1.5"
            >
              <Lock size={14} className="text-accent" />
              <span>Team Sign-In</span>
            </button>
<<<<<<< HEAD
            <Button size="sm" onClick={() => onNavigate('client')}>
=======
            <Button size="sm" onClick={() => setShowLoginModal(true)}>
>>>>>>> landingUpdate
              Start Ordering
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero with Parallax */}
      <section className="relative pt-44 pb-28 px-6 z-10 overflow-hidden">
        {/* Background Image with parallax scroll + Ghost White gradient overlay */}
        <div className="absolute inset-0 z-0 parallax-hero" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <img 
            src="https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg" 
            alt="Fresh meals background" 
            className="w-full h-[120%] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8F8FF]/92 via-[#F8F8FF]/80 to-[#F8F8FF]/95" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="section-panel glass hero-panel rounded-[48px] border border-white/40 px-6 py-16 lg:px-12 lg:py-24">
            <div className="relative text-center">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] text-[#111118]">
                Premium Local Meals,<br />
                <span className="gradient-text">Delivered to You</span>
              </h1>
              <p className="text-lg md:text-xl text-[#52525E] mt-8 max-w-2xl mx-auto leading-relaxed">
                Experience kitchen-fresh catering from verified neighborhood chefs. Fast delivery, dynamic menu planning, and premium quality ingredients.
              </p>
              <div className="flex flex-row items-center justify-center gap-4 mt-10">
                <Button size="lg" className="magnetic-hover" onClick={() => setShowLoginModal(true)}>
                  Explore Master Menu
                </Button>
                <Button size="lg" variant="outline" className="magnetic-hover" onClick={scrollToVendorPartners}>
                  Grow Your Business
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Experience categories section */}
      <section id="categories" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto section-panel rounded-[40px] border border-white/40 p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 stagger">
            {categories.map((c) => (
              <div
                key={c.name}
                onClick={() => setShowLoginModal(true)}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer hover-lift border border-border/50 frosted-glow"
              >
                <img
                  src={c.img}
                  alt={c.name}
                  onClick={() => setShowLoginModal(true)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111118]/75 via-[#111118]/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="font-bold text-white text-lg">{c.name}</p>
                </div>
                <div className="absolute inset-0 bg-accent/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Starting Base Price</span>
                  <p className="text-white text-3xl font-extrabold mt-1">{c.price}</p>
                  <span className="text-white/90 text-xs mt-3 flex items-center gap-1">Order now <ArrowRight size={10} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor Partnership Section */}
      <section id="vendor-partners" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto section-panel rounded-[40px] border border-white/40 p-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 flex justify-center animate-fade-in-up">
              <div className="w-[300px] h-[580px] rounded-[48px] bg-[#111118]/90 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-4 bg-white/10 rounded-full shadow-sm" />
                <div className="w-full h-full rounded-[40px] bg-[#0F1116]/90 overflow-hidden flex flex-col items-center justify-center p-6 text-center relative border border-white/10 shadow-inner">
                  <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-accent/15 to-[#7C3AED]/10 border border-white/10 flex items-center justify-center mb-4">
                    <Store size={22} className="text-accent" />
                  </div>
                  <h4 className="font-extrabold text-lg text-white">Vendor Portal</h4>
                  <p className="text-xs text-slate-400 mt-1 px-4">Dynamic business tools for growth and performance.</p>
                  <div className="w-full rounded-3xl bg-[#111318]/95 border border-white/10 p-4 my-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://vikram-advertising.io/plans"
                      alt="Plans QR Code"
                      className="mx-auto w-36 h-36 rounded-2xl border border-white/10 bg-[#090A0F]"
                    />
                  </div>
                  <p className="text-xs font-bold text-accent uppercase tracking-wider">Scan to view our</p>
                  <p className="text-sm font-extrabold text-white mt-0.5">Vendor Subscription Plans</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-12">
              <div>
                <Badge variant="accent">Vendor Partners</Badge>
                <h2 className="text-4xl font-extrabold mt-3">Partner with VIKRAM ADVERTISING</h2>
                <p className="text-muted mt-2">Access state-of-the-art tools to expand your tiffin and restaurant business.</p>
              </div>
              <div className="grid gap-6">
                {benefits.map((b) => (
                  <div key={b.title} className="flex gap-4 p-4 rounded-2xl frosted-card frosted-glow">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <b.icon size={20} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text">{b.title}</h3>
                      <p className="text-sm text-muted mt-1 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Subscription Pricing Preview</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {plans.map((p) => (
                    <div key={p.name} className="p-5 rounded-2xl frosted-card frosted-glow relative hover:border-accent/40 transition-colors">
                      <p className="font-bold text-sm uppercase tracking-wider text-muted">{p.name}</p>
                      <p className="text-2xl font-extrabold text-text mt-2">{p.price}</p>
                      <p className="text-xs text-muted mt-1">{p.validity}</p>
                      <div className="border-t border-border/60 my-3" />
                      <ul className="text-xs space-y-1.5 text-muted">
                        <li>• {p.items}</li>
                        <li>• {p.clients}</li>
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto section-panel rounded-[40px] border border-white/40 p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
                <UtensilsCrossed size={16} className="text-white" />
              </div>
              <span className="font-bold text-text">VIKRAM ADVERTISING</span>
              <span className="text-muted text-sm ml-2">© 2026</span>
            </div>
            
            <div className="text-center md:text-right text-xs text-muted space-y-1">
              <p>Email: contact@vikram-advertising.io | Tel: +91 98765 43210</p>
              <p>12th Main Road, Indiranagar, Bengaluru, KA, India</p>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <button 
                onClick={() => onNavigate('login')}
                className="text-muted hover:text-text transition-colors flex items-center gap-1"
              >
                <Lock size={12} className="text-accent" /> Team Sign-In
              </button>
            </div>
          </div>
        </div>
      </footer>

<<<<<<< HEAD
      {/* Client Onboarding Registration Modal Removed */}
=======
      <Modal open={showLoginModal} onClose={() => setShowLoginModal(false)} title="Client Login">
        <form onSubmit={handleClientSubmit} className="space-y-4">
          <p className="text-xs text-muted mb-4">Enter your details to view local menus and place orders.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Your Name *</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Vikram Singh"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text placeholder:text-muted/50 focus:border-accent outline-none text-sm font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Phone Number *</label>
            <input
              type="tel"
              required
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="e.g. +91 99999 88888"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text placeholder:text-muted/50 focus:border-accent outline-none text-sm font-semibold"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setShowLoginModal(false)}>Cancel</Button>
            <Button type="submit" disabled={!clientName || !clientPhone}>Continue <ArrowRight size={16} /></Button>
          </div>
        </form>
      </Modal>
>>>>>>> landingUpdate
    </div>
  );
}
