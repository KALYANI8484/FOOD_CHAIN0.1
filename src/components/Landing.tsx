import { useEffect, useState } from 'react';
import {
  UtensilsCrossed, ShoppingBag, Shield, Zap, ArrowRight,
  ChevronRight, MapPin, Clock, TrendingUp, Users, Store, Sparkles, CheckCircle2,
} from 'lucide-react';
import { Button, Badge, SpotlightCard } from './ui';

type Role = 'landing' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

export function Landing({ onNavigate }: { onNavigate: (role: Role) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouse);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  const stats = [
    { label: 'Active Vendors', value: '2,400+', icon: Store },
    { label: 'Orders Delivered', value: '1.8M+', icon: ShoppingBag },
    { label: 'Cities Served', value: '120', icon: MapPin },
    { label: 'Avg. Delivery', value: '24 min', icon: Clock },
  ];

  const categories = [
    { name: 'Pizza', img: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', count: 340 },
    { name: 'Burgers', img: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', count: 210 },
    { name: 'Indian', img: 'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg', count: 520 },
    { name: 'Noodles', img: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg', count: 180 },
    { name: 'Salads', img: 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg', count: 95 },
    { name: 'Desserts', img: 'https://images.pexels.com/photos/2069483/pexels-photo-2069483.jpeg', count: 150 },
  ];

  const features = [
    { icon: Zap, title: 'Lightning Orders', desc: 'Real-time order radar with instant acceptance and OTP-verified delivery.' },
    { icon: Shield, title: 'Secure Platform', desc: 'Row-level security, encrypted data, and role-based access for every user.' },
    { icon: TrendingUp, title: 'Vendor Analytics', desc: 'Live KPIs, revenue tracking, and inventory management in one dashboard.' },
    { icon: Users, title: 'Multi-Role System', desc: 'Super Admin, Sub-Admin, Vendor, and Client — each with a tailored experience.' },
  ];

  const roles = [
    {
      id: 'super_admin' as Role,
      title: 'Super Admin',
      desc: 'Full platform control — manage vendors, plans, inventory, and settings.',
      icon: Shield,
      color: 'from-orange-500/20 to-red-500/10',
      border: 'hover:border-orange-500/40',
    },
    {
      id: 'sub_admin' as Role,
      title: 'Sub-Admin',
      desc: 'Create and manage vendors, handle approvals, and track activity.',
      icon: Users,
      color: 'from-blue-500/20 to-cyan-500/10',
      border: 'hover:border-blue-500/40',
    },
    {
      id: 'vendor' as Role,
      title: 'Vendor',
      desc: 'Order radar, inventory, KPIs, and plan management for your business.',
      icon: Store,
      color: 'from-green-500/20 to-emerald-500/10',
      border: 'hover:border-green-500/40',
    },
    {
      id: 'client' as Role,
      title: 'Client',
      desc: 'Browse restaurants, order food, and track delivery in real-time.',
      icon: ShoppingBag,
      color: 'from-purple-500/20 to-pink-500/10',
      border: 'hover:border-purple-500/40',
    },
  ];

  return (
    <div className="min-h-screen bg-bg noise relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] transition-transform duration-1000"
          style={{
            background: 'radial-gradient(circle, #ff6b35, transparent 70%)',
            transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)`,
            top: '-100px',
            left: '-100px',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] transition-transform duration-1000"
          style={{
            background: 'radial-gradient(circle, #ff9f1c, transparent 70%)',
            transform: `translate(${mousePos.x * -0.03}px, ${mousePos.y * -0.03}px)`,
            bottom: '0',
            right: '-50px',
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
            <span className="text-xl font-bold tracking-tight">MealMesh</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a href="#features" className="hover:text-white transition-colors relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#categories" className="hover:text-white transition-colors relative group">
              Categories
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#roles" className="hover:text-white transition-colors relative group">
              Roles
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('vendor')}>For Vendors</Button>
            <Button size="sm" onClick={() => onNavigate('client')}>
              Order Now <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6 grid-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-6 animate-fade-in-up">
              <Sparkles size={14} className="text-accent" />
              <span className="text-xs font-semibold text-muted">The complete food delivery ecosystem</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] animate-fade-in-up delay-100">
              Food delivery,
              <br />
              <span className="gradient-text">reimagined</span> for everyone.
            </h1>
            <p className="text-lg md:text-xl text-muted mt-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              One platform. Four powerful roles. From the super admin managing the entire network to the
              client ordering dinner — MealMesh connects them all in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-in-up delay-300">
              <Button size="lg" onClick={() => onNavigate('client')}>
                Start Ordering <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="outline" onClick={() => onNavigate('super_admin')}>
                Explore Dashboard
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 stagger">
            {stats.map((s) => (
              <SpotlightCard key={s.label} className="card p-6 hover-lift">
                <s.icon size={20} className="text-accent mb-3" />
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-muted mt-1">{s.label}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge variant="accent">Browse</Badge>
              <h2 className="text-4xl font-bold mt-3">Explore by category</h2>
            </div>
            <button className="text-sm text-muted hover:text-white transition-colors flex items-center gap-1 group">
              View all <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger">
            {categories.map((c) => (
              <div
                key={c.name}
                onClick={() => onNavigate('client')}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer hover-lift"
              >
                <img
                  src={c.img}
                  alt={c.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-bold text-white">{c.name}</p>
                  <p className="text-xs text-white/70">{c.count} dishes</p>
                </div>
                <div className="absolute inset-0 border-2 border-accent/0 group-hover:border-accent/40 rounded-2xl transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="accent">Why MealMesh</Badge>
            <h2 className="text-4xl font-bold mt-3">Built for scale, designed for delight</h2>
            <p className="text-muted mt-4 max-w-2xl mx-auto">
              Every interaction is crafted with micro-animations, real-time feedback, and a premium dark UI.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 stagger">
            {features.map((f) => (
              <SpotlightCard key={f.title} className="card p-8 hover-lift group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <f.icon size={22} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                    <p className="text-muted leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="accent">Choose your experience</Badge>
            <h2 className="text-4xl font-bold mt-3">Four roles. One platform.</h2>
            <p className="text-muted mt-4">Click any role below to jump straight into its dashboard.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
            {roles.map((r) => (
              <div
                key={r.id}
                onClick={() => onNavigate(r.id)}
                className={`group relative card p-8 cursor-pointer hover-lift bg-gradient-to-br ${r.color} ${r.border} border transition-all duration-300`}
              >
                <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform duration-300">
                  <r.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{r.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{r.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent opacity-0 group-hover:opacity-100 group-hover:gap-2 transition-all duration-300">
                  Enter dashboard <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SpotlightCard className="card p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-50" />
            <div className="relative">
              <Store size={40} className="text-accent mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold">Become a MealMesh Vendor</h2>
              <p className="text-muted mt-4 max-w-xl mx-auto">
                Join 2,400+ restaurants. Manage your menu, track orders in real-time, and grow your business
                with powerful analytics.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                {['No setup fee', '30-day trial', 'Cancel anytime'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-sm text-muted">
                    <CheckCircle2 size={16} className="text-green-400" /> {t}
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button size="lg" onClick={() => onNavigate('vendor')}>
                  Get Started <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
              <UtensilsCrossed size={16} className="text-white" />
            </div>
            <span className="font-bold">MealMesh</span>
            <span className="text-muted text-sm ml-2">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-white transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
