import { useEffect, useRef, useState, useCallback } from 'react';
import { UtensilsCrossed, ArrowRight, Phone, Mail, MessageCircle, ShoppingBag, Store, X, Lock } from 'lucide-react';
import { Spinner } from './ui';

type Role = 'landing' | 'login' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

interface MasterItem { id: string; name: string; category: string; price: number; image_url: string; }

/* ── Scroll Reveal Hook ─────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}

/* ── Count-Up Hook ──────────────────────────────── */
function useCountUp(target: number | null, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (target === null) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [target, started]);

  useEffect(() => {
    if (!started || target === null) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref, started };
}

/* ── KPI Card Component ─────────────────────────── */
function KpiCard({ icon: Icon, label, value }: { icon: typeof ShoppingBag; label: string; value: number | null }) {
  const { count, ref, started } = useCountUp(value);
  return (
    <div ref={ref} className="text-center bg-white/15 rounded-2xl p-6 backdrop-blur-sm border border-white/20 reveal">
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
        <Icon size={24} className="text-white" />
      </div>
      {value === null ? (
        <div className="h-10 flex items-center justify-center"><Spinner /></div>
      ) : (
        <p className="text-5xl font-extrabold font-serif">{count.toLocaleString()}+</p>
      )}
      <p className="text-white/85 text-sm font-semibold mt-1">{label}</p>
      <div className="kpi-bar mt-3">
        <div className={`kpi-bar-fill ${started ? 'animate' : ''}`} />
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────── */
export function Landing({ onNavigate }: { onNavigate: (role: Role) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalVendors, setTotalVendors] = useState<number | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<MasterItem | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', zip: '', landmark: '', address: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [iRes, oRes, vRes] = await Promise.all([
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'master_inventory', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'orders', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'vendors', action: 'select' }) }),
        ]);
        const [id, od, vd] = await Promise.all([iRes.json(), oRes.json(), vRes.json()]);
        if (id.data) setMasterItems(id.data);
        if (od.data) setTotalOrders(od.data.length);
        if (vd.data) setTotalVendors(vd.data.length);
      } catch (e) { console.error(e); }
      finally { setLoadingItems(false); }
    })();
  }, []);

  const categories = ['All', ...Array.from(new Set(masterItems.map(m => m.category)))];
  const filteredItems = activeCategory === 'All' ? masterItems : masterItems.filter(m => m.category === activeCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItem) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'orders', action: 'insert', data: {
          client_name: checkoutForm.name, client_phone: checkoutForm.phone,
          client_zip: checkoutForm.zip, client_landmark: checkoutForm.landmark,
          client_address: checkoutForm.address, item_name: checkoutItem.name,
          item_id: checkoutItem.id, price: checkoutItem.price,
          quantity: checkoutForm.quantity, status: 'pending',
        }})
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setOrderSuccess(`🎉 Order confirmed! Your delivery OTP is: ${d.data?.otp || '****'}. Share it with your vendor on arrival.`);
      setTotalOrders(prev => (prev !== null ? prev + 1 : 1));
      setTimeout(() => {
        setCheckoutItem(null); setOrderSuccess('');
        setCheckoutForm({ name: '', phone: '', zip: '', landmark: '', address: '', quantity: 1 });
      }, 12000);
    } catch { alert('Failed to place order. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8F8FF] text-[#111118]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Floating WhatsApp Widget ─────────────── */}
      <a href="https://wa.me/919175537373?text=Hello%20Vikram%20Advertising%2C%20I%20have%20an%20inquiry." target="_blank" rel="noopener noreferrer" className="wa-float" aria-label="Chat on WhatsApp">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ── Checkout Modal ───────────────────────── */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white shadow-2xl rounded-3xl w-full max-w-md overflow-hidden relative animate-scale-in border border-gray-100">
            <button onClick={() => setCheckoutItem(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
            <div className="h-40 w-full relative">
              <img src={checkoutItem.image_url || 'https://via.placeholder.com/400x200'} alt={checkoutItem.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
            </div>
            <div className="px-6 pb-6 -mt-6 relative z-10">
              <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{checkoutItem.name}</h3>
              <p className="text-amber-600 font-semibold mb-5 text-sm">₹{checkoutItem.price} per plate</p>
              {orderSuccess ? (
                <div className="bg-green-50 border border-green-200 text-green-700 p-5 rounded-2xl text-center">
                  <p className="font-bold mb-1 text-lg">Order Confirmed!</p>
                  <p className="text-sm leading-relaxed">{orderSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                      <input required type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} className="w-full px-3 py-2.5 mt-1 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all text-sm" placeholder="Your Name" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                      <input required type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} className="w-full px-3 py-2.5 mt-1 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all text-sm" placeholder="+91..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PIN Code</label>
                      <input required type="text" value={checkoutForm.zip} onChange={e => setCheckoutForm({...checkoutForm, zip: e.target.value})} className="w-full px-3 py-2.5 mt-1 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all text-sm" placeholder="110001" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Landmark</label>
                      <input required type="text" value={checkoutForm.landmark} onChange={e => setCheckoutForm({...checkoutForm, landmark: e.target.value})} className="w-full px-3 py-2.5 mt-1 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all text-sm" placeholder="Near Metro" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Address</label>
                    <textarea required value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className="w-full px-3 py-2.5 mt-1 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all resize-none text-sm" rows={2} placeholder="Flat no, Building, Street..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantity</label>
                    <input required type="number" min="1" max="20" value={checkoutForm.quantity} onChange={e => setCheckoutForm({...checkoutForm, quantity: parseInt(e.target.value) || 1})} className="w-full px-3 py-2.5 mt-1 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all text-sm" />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-amber-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                    {submitting ? <Spinner /> : <><ArrowRight size={16} /> Place Order — ₹{checkoutItem.price * checkoutForm.quantity}</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Header ───────────────────────── */}
      <header className={`sticky top-0 z-40 transition-all duration-400 ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100' : 'bg-[#F8F8FF]/80'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Vikram Advertising
            </span>
          </div>
          {/* Nav */}
          <nav className="flex items-center gap-3">
            <a href="#contact" className="text-sm font-semibold text-gray-600 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-50">
              Vendor's Plan
            </a>
            <button onClick={() => onNavigate('login')} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Team Sign-In
            </button>
          </nav>
        </div>
      </header>

      {/* ── Master Inventory Grid ────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-14">

        {/* Category Filter */}
        {!loadingItems && masterItems.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-10 reveal">
            {categories.map((cat, i) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all reveal reveal-delay-${Math.min(i + 1, 6)} ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Item Grid */}
        {loadingItems ? (
          <div className="flex justify-center items-center py-40">
            <Spinner />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-32 text-gray-400">
            <UtensilsCrossed size={44} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">No items yet</p>
            <p className="text-sm mt-1">Vendors are setting up their menus — check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item, i) => (
              <div
                key={item.id}
                onClick={() => setCheckoutItem(item)}
                className={`inventory-card reveal reveal-delay-${Math.min((i % 4) + 1, 6)}`}
              >
                {/* Image */}
                <div className="card-img relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-amber-200">
                      <UtensilsCrossed size={40} />
                    </div>
                  )}
                  {/* Category chip */}
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-600 border border-gray-100 shadow-sm">
                    {item.category}
                  </span>
                  {/* Hover CTA overlay */}
                  <div className="absolute inset-0 bg-amber-500/85 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight size={28} className="text-white" />
                    <span className="text-white text-sm font-bold tracking-wide">Order Now</span>
                  </div>
                </div>
                {/* Details */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate text-base" style={{ fontFamily: "'Playfair Display', serif" }}>{item.name}</h3>
                  <p className="text-amber-600 font-extrabold text-xl mt-1">₹{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── KPI Section ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-12 text-white overflow-hidden shadow-2xl shadow-amber-200">
          {/* decorative blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-black/10 blur-xl" />

          <div className="relative z-10 text-center mb-10 reveal">
            <p className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-2">Live Platform Stats</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Trusted by Our Community
            </h2>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-6 max-w-lg mx-auto">
            <KpiCard icon={ShoppingBag} label="Total Orders Placed" value={totalOrders} />
            <KpiCard icon={Store} label="Vendors Joined" value={totalVendors} />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────── */}
      <footer id="contact" className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-3 gap-12 items-start">

            {/* Brand block */}
            <div className="reveal reveal-left">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
                  <UtensilsCrossed size={18} className="text-white" />
                </div>
                <span className="font-extrabold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Vikram Advertising
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Connecting verified local kitchen vendors with guests through a seamless, real-time ordering platform.
              </p>
            </div>

            {/* Contact block */}
            <div className="reveal">
              <h3 className="font-bold text-[#111118] text-sm mb-5 uppercase tracking-widest">Get in Touch</h3>
              <ul className="space-y-3">
                <li>
                  <a href="tel:+919175537373" className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors shadow-sm">
                      <Phone size={15} className="text-amber-600" />
                    </div>
                    +91 91755 37373
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/919175537373?text=Hello%20Vikram%20Advertising%2C%20I%20have%20an%20inquiry." target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-green-600 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center transition-colors shadow-sm">
                      <MessageCircle size={15} className="text-green-600" />
                    </div>
                    WhatsApp Us
                  </a>
                </li>
                <li>
                  <a href="mailto:2711vikram@gmail.com" className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors shadow-sm">
                      <Mail size={15} className="text-amber-600" />
                    </div>
                    2711vikram@gmail.com
                  </a>
                </li>
                <li>
                  <a href="mailto:vikram271@rediffmail.com" className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors shadow-sm">
                      <Mail size={15} className="text-amber-600" />
                    </div>
                    vikram271@rediffmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick links */}
            <div className="reveal reveal-right">
              <h3 className="font-bold text-[#111118] text-sm mb-5 uppercase tracking-widest">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => onNavigate('login')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors">
                    <Lock size={14} /> Team Sign-In
                  </button>
                </li>
                <li>
                  <a href="https://wa.me/919175537373?text=Hi%2C%20I%20want%20to%20join%20as%20a%20vendor." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                    <Store size={14} /> Become a Vendor
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-100 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">© 2026 Vikram Advertising. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <a href="https://wa.me/919175537373?text=Hello%20Vikram%20Advertising%2C%20I%20have%20an%20inquiry." target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors">
                <MessageCircle size={16} className="text-green-600" />
              </a>
              <a href="tel:+919175537373" className="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors">
                <Phone size={16} className="text-amber-600" />
              </a>
              <a href="mailto:2711vikram@gmail.com" className="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors">
                <Mail size={16} className="text-amber-600" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
