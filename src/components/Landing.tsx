import { useEffect, useState } from 'react';
import {
  UtensilsCrossed, Zap, ArrowRight,
  Clock, TrendingUp, Store, Lock
} from 'lucide-react';
import { Button, Badge, Modal, Input } from './ui';

type Role = 'landing' | 'login' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

export function Landing({ onNavigate }: { onNavigate: (role: Role) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [showRegModal, setShowRegModal] = useState(false);
  
  // Registration Form State (exactly 4 fields)
  const [regForm, setRegForm] = useState({
    name: '',
    landmark: '',
    zipCode: '',
    address: ''
  });

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
    { name: 'Tiffin', img: 'https://images.pexels.com/photos/9585644/pexels-photo-9585644.jpeg', price: '₹99' },
    { name: 'Breakfast', img: 'https://images.pexels.com/photos/5560700/pexels-photo-5560700.jpeg', price: '₹59' },
    { name: 'Lunch/Dinner', img: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg', price: '₹149' },
    { name: 'Vegetables', img: 'https://images.pexels.com/photos/1458691/pexels-photo-1458691.jpeg', price: '₹39' },
    { name: 'Thali', img: 'https://images.pexels.com/photos/9585643/pexels-photo-9585643.jpeg', price: '₹179' },
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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.landmark || !regForm.zipCode || !regForm.address) {
      alert('All registration fields are required.');
      return;
    }
    // Route to client view passing the Zip Code as location gate
    setShowRegModal(false);
    onNavigate('client');
  };



  return (
    <div className="min-h-screen bg-bg noise relative overflow-hidden text-text">
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
            <Button size="sm" onClick={() => setShowRegModal(true)}>
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8F8FF]/95 via-[#F8F8FF]/80 to-[#F8F8FF]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] animate-fade-in-up delay-100 text-[#111118]">
            Premium Local Meals,<br />
            <span className="gradient-text">Delivered to You</span>
          </h1>
          <p className="text-lg md:text-xl text-[#52525E] mt-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Experience kitchen-fresh catering from verified neighborhood chefs. Fast delivery, dynamic menu planning, and premium quality ingredients.
          </p>
          <div className="flex flex-row items-center justify-center gap-4 mt-10 animate-fade-in-up delay-300">
            <Button size="lg" className="magnetic-hover" onClick={() => onNavigate('client')}>
              Explore Master Menu
            </Button>
            <Button size="lg" variant="outline" className="magnetic-hover" onClick={() => onNavigate('login')}>
              Grow Your Business
            </Button>
          </div>
        </div>
      </section>

      {/* Client Experience categories section */}
      <section id="categories" className="py-24 px-6 relative z-10 border-y border-border/50">
        <div className="max-w-7xl mx-auto">


          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 stagger">
            {categories.map((c) => (
              <div
                key={c.name}
                onClick={() => onNavigate('client')}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer hover-lift border border-border"
              >
                <img
                  src={c.img}
                  alt={c.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="font-bold text-white text-lg">{c.name}</p>
                </div>
                
                {/* Interactive Hover Price Overlay */}
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
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Mobile Phone mockup displaying dynamic QR */}
            <div className="lg:col-span-5 flex justify-center animate-fade-in-up">
              <div className="w-[300px] h-[580px] rounded-[48px] bg-text p-3 shadow-2xl relative border-4 border-muted/20">
                {/* Speaker */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-4 bg-muted rounded-full" />
                
                {/* Phone screen */}
                <div className="w-full h-full rounded-[40px] bg-bg overflow-hidden flex flex-col items-center justify-center p-6 text-center relative border border-muted/10">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <Store size={22} className="text-accent" />
                  </div>
                  <h4 className="font-extrabold text-lg">Vendor Portal</h4>
                  <p className="text-xs text-muted mt-1 px-4">Dynamic Business Tools</p>
                  
                  {/* Dynamic QR Code */}
                  <div className="card p-3 bg-white border border-border rounded-2xl my-6">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://vikram-advertising.io/plans" 
                      alt="Plans QR Code" 
                      className="w-36 h-36"
                    />
                  </div>
                  
                  <p className="text-xs font-bold text-accent uppercase tracking-wider">Scan to view our</p>
                  <p className="text-sm font-extrabold text-text mt-0.5">Vendor Subscription Plans</p>
                </div>
              </div>
            </div>

            {/* Right: Plans & Features */}
            <div className="lg:col-span-7 space-y-12">
              <div>
                <Badge variant="accent">Vendor Partners</Badge>
                <h2 className="text-4xl font-extrabold mt-3">Partner with VIKRAM ADVERTISING</h2>
                <p className="text-muted mt-2">Access state-of-the-art tools to expand your tiffin and restaurant business.</p>
              </div>

              {/* Benefit Icons */}
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

              {/* Plans Preview */}
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
      <footer className="border-t border-border/50 py-12 px-6 relative z-10">
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
      </footer>

      {/* Client Onboarding Registration Modal */}
      <Modal open={showRegModal} onClose={() => setShowRegModal(false)} title="Client Registration">
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <p className="text-sm text-muted">Register to start ordering premium meals near you.</p>
          
          <Input 
            label="Full Name" 
            value={regForm.name} 
            onChange={(v) => setRegForm({ ...regForm, name: v })} 
            required 
            placeholder="e.g. Vikram Sharma"
          />
          <Input 
            label="ZIP Code" 
            value={regForm.zipCode} 
            onChange={(v) => setRegForm({ ...regForm, zipCode: v })} 
            required 
            placeholder="e.g. 560038"
          />
          <Input 
            label="Landmark" 
            value={regForm.landmark} 
            onChange={(v) => setRegForm({ ...regForm, landmark: v })} 
            required 
            placeholder="e.g. Near Indiranagar Metro Station"
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Full Address</label>
            <textarea
              required
              rows={3}
              value={regForm.address}
              onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
              placeholder="Enter your flat number, building, street address"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text placeholder:text-muted/50 focus:border-accent outline-none transition-all text-sm"
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            Confirm & Start Ordering
          </Button>
        </form>
      </Modal>
    </div>
  );
}
