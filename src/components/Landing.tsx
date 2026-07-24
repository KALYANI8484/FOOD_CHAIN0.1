import { useEffect, useState } from 'react';
import {
  UtensilsCrossed, ArrowRight, Phone, Mail, MessageCircle,
  ShoppingBag, Store, X, Lock
} from 'lucide-react';
import { Button, Spinner } from './ui';

type Role = 'landing' | 'login' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

interface MasterItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string;
}

export function Landing({ onNavigate }: { onNavigate: (role: Role) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalVendors, setTotalVendors] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [checkoutItem, setCheckoutItem] = useState<MasterItem | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '', phone: '', zip: '', landmark: '', address: '', quantity: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');

  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [itemsRes, ordersRes, vendorsRes] = await Promise.all([
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'master_inventory', action: 'select' })
          }),
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'orders', action: 'select' })
          }),
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'vendors', action: 'select' })
          }),
        ]);

        const itemsData = await itemsRes.json();
        const ordersData = await ordersRes.json();
        const vendorsData = await vendorsRes.json();

        if (itemsData.data) setMasterItems(itemsData.data);
        if (ordersData.data) setTotalOrders(ordersData.data.length);
        if (vendorsData.data) setTotalVendors(vendorsData.data.length);
      } catch (err) {
        console.error('Failed to load landing data', err);
      } finally {
        setLoadingItems(false);
        setLoadingStats(false);
      }
    };
    fetchAll();
  }, []);

  const categories = ['All', ...Array.from(new Set(masterItems.map(m => m.category)))];
  const filteredItems = activeCategory === 'All'
    ? masterItems
    : masterItems.filter(m => m.category === activeCategory);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItem) return;
    setSubmitting(true);
    setOrderSuccess('');

    try {
      const orderData = {
        client_name: checkoutForm.name,
        client_phone: checkoutForm.phone,
        client_zip: checkoutForm.zip,
        client_landmark: checkoutForm.landmark,
        client_address: checkoutForm.address,
        item_name: checkoutItem.name,
        item_id: checkoutItem.id,
        price: checkoutItem.price,
        quantity: checkoutForm.quantity,
        status: 'pending',
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'orders', action: 'insert', data: orderData })
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);

      const otp = d.data?.otp || '****';
      setOrderSuccess(`Order placed! Your delivery OTP is: ${otp}. Share it with your vendor on arrival.`);
      setTotalOrders(prev => (prev !== null ? prev + 1 : 1));
      setTimeout(() => {
        setCheckoutItem(null);
        setOrderSuccess('');
        setCheckoutForm({ name: '', phone: '', zip: '', landmark: '', address: '', quantity: 1 });
      }, 12000);
    } catch (err) {
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8FF] text-[#111118] font-sans">

      {/* ── Checkout Modal ─────────────────────────── */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative animate-scale-in">
            <button onClick={() => setCheckoutItem(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 z-10">
              <X size={20} />
            </button>
            <div className="h-36 w-full relative">
              <img src={checkoutItem.image_url || 'https://via.placeholder.com/400x200'} alt={checkoutItem.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent" />
            </div>
            <div className="p-6 pt-2 relative z-10">
              <h3 className="text-2xl font-bold">{checkoutItem.name}</h3>
              <p className="text-amber-600 font-semibold mb-4 text-sm">₹{checkoutItem.price} / plate</p>

              {orderSuccess ? (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-center">
                  <p className="font-bold mb-1 text-lg">🎉 Order Confirmed!</p>
                  <p className="text-sm">{orderSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                      <input required type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} className="w-full px-3 py-2 mt-1 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 transition-colors text-sm" placeholder="Your Name" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                      <input required type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} className="w-full px-3 py-2 mt-1 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 transition-colors text-sm" placeholder="+91..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PIN Code</label>
                      <input required type="text" value={checkoutForm.zip} onChange={e => setCheckoutForm({...checkoutForm, zip: e.target.value})} className="w-full px-3 py-2 mt-1 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 transition-colors text-sm" placeholder="110001" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Landmark</label>
                      <input required type="text" value={checkoutForm.landmark} onChange={e => setCheckoutForm({...checkoutForm, landmark: e.target.value})} className="w-full px-3 py-2 mt-1 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 transition-colors text-sm" placeholder="Near Metro" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Address</label>
                    <textarea required value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className="w-full px-3 py-2 mt-1 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 transition-colors resize-none text-sm" rows={2} placeholder="Flat no, Building, Street..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantity</label>
                    <input required type="number" min="1" max="20" value={checkoutForm.quantity} onChange={e => setCheckoutForm({...checkoutForm, quantity: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 mt-1 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-amber-500 transition-colors text-sm" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                      {submitting ? <Spinner /> : `Place Order — ₹${checkoutItem.price * checkoutForm.quantity}`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Header ─────────────────────────── */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-[#F8F8FF]'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#111118]">
              Vikram Advertising
            </span>
          </div>

          {/* Navigation Buttons */}
          <nav className="flex items-center gap-3">
            <a
              href="#plans"
              className="text-sm font-semibold text-gray-600 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-50"
            >
              Vendor's Plan
            </a>
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Team Sign-In
            </button>
          </nav>
        </div>
      </header>

      {/* ── Master Inventory Section ───────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111118]">
            Our <span className="text-amber-500">Master Menu</span>
          </h1>
          <p className="text-gray-500 mt-3 text-base max-w-xl mx-auto">
            Fresh, home-style meals prepared by verified kitchen vendors near you. Click any item to place your order.
          </p>
        </div>

        {/* Category Filter Tabs */}
        {!loadingItems && masterItems.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
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

        {/* Items Grid */}
        {loadingItems ? (
          <div className="flex justify-center items-center py-32">
            <Spinner />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <UtensilsCrossed size={40} className="mx-auto mb-4 opacity-40" />
            <p className="font-semibold">No items available yet.</p>
            <p className="text-sm mt-1">Check back soon — vendors are adding dishes!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => setCheckoutItem(item)}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {/* Item Image */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <UtensilsCrossed size={36} />
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-amber-500/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight size={28} className="text-white mb-1" />
                    <p className="text-white text-sm font-bold">Order Now</p>
                  </div>
                  {/* Category Badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-gray-600 border border-gray-200">
                    {item.category}
                  </span>
                </div>

                {/* Item Details */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                  <p className="text-amber-600 font-extrabold text-lg mt-1">₹{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── KPI Stats Section ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative z-10 text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold">Trusted by Our Community</h2>
            <p className="text-white/80 mt-2 text-sm">Real-time numbers from our platform</p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-6 max-w-xl mx-auto">
            {/* Total Orders */}
            <div className="text-center bg-white/15 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={24} className="text-white" />
              </div>
              {loadingStats ? (
                <div className="h-10 flex items-center justify-center"><Spinner /></div>
              ) : (
                <p className="text-4xl font-extrabold">{(totalOrders ?? 0).toLocaleString()}</p>
              )}
              <p className="text-white/85 text-sm font-semibold mt-1">Total Orders Placed</p>
            </div>

            {/* Total Vendors */}
            <div className="text-center bg-white/15 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                <Store size={24} className="text-white" />
              </div>
              {loadingStats ? (
                <div className="h-10 flex items-center justify-center"><Spinner /></div>
              ) : (
                <p className="text-4xl font-extrabold">{(totalVendors ?? 0).toLocaleString()}</p>
              )}
              <p className="text-white/85 text-sm font-semibold mt-1">Vendors Joined</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer id="plans" className="border-t border-gray-200 bg-white mt-4">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-10 items-start">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                  <UtensilsCrossed size={18} className="text-white" />
                </div>
                <span className="font-extrabold text-lg tracking-tight text-[#111118]">Vikram Advertising</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Connecting verified local kitchen vendors with guests through a seamless, real-time ordering platform.
              </p>
            </div>

            {/* Get in Touch */}
            <div>
              <h3 className="font-bold text-[#111118] text-base mb-4 uppercase tracking-wider">Get in Touch</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="tel:+919175537373"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                      <Phone size={15} className="text-amber-600" />
                    </div>
                    +91 91755 37373
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/919175537373"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-green-600 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                      <MessageCircle size={15} className="text-green-600" />
                    </div>
                    WhatsApp Us
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:2711vikram@gmail.com"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                      <Mail size={15} className="text-amber-600" />
                    </div>
                    2711vikram@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:vikram271@rediffmail.com"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-amber-600 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                      <Mail size={15} className="text-amber-600" />
                    </div>
                    vikram271@rediffmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-[#111118] text-base mb-4 uppercase tracking-wider">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => onNavigate('login')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors"
                  >
                    <Lock size={14} /> Team Sign-In
                  </button>
                </li>
                <li>
                  <a href="https://wa.me/919175537373?text=Hi%2C%20I%20want%20to%20join%20as%20a%20vendor%20on%20Vikram%20Advertising." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                    <Store size={14} /> Become a Vendor
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">© 2026 Vikram Advertising. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://wa.me/919175537373" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors">
                <MessageCircle size={16} className="text-green-600" />
              </a>
              <a href="tel:+919175537373"
                className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors">
                <Phone size={16} className="text-amber-600" />
              </a>
              <a href="mailto:2711vikram@gmail.com"
                className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors">
                <Mail size={16} className="text-amber-600" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
