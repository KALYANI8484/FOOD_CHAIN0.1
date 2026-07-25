import { useEffect, useRef, useState } from 'react';
import {
  UtensilsCrossed, ArrowRight, Phone, Mail, MessageCircle,
  ShoppingBag, Store, X, Lock, MapPin, ChevronRight,
  ChevronLeft, Hash, User, CheckCircle
} from 'lucide-react';
import { Spinner } from './ui';

type Role = 'landing' | 'login' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

interface MasterItem  { id: string; name: string; category: string; base_price: number; price: number; image_url: string; description?: string; }
interface VendorItem  { id: string; item_name: string; price: number; quantity: number; image_url: string; master_item_id: string; vendor_id: string; }

/* ── Scroll Reveal ──────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}

/* ── Count-Up ───────────────────────────────────── */
function useCountUp(target: number | null, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (target === null) return;
    const io = new IntersectionObserver(
      e => { if (e[0].isIntersecting && !started) setStarted(true); }, { threshold: 0.5 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [target, started]);
  useEffect(() => {
    if (!started || target === null) return;
    let n = 0;
    const step = Math.ceil(target / (duration / 16));
    const t = setInterval(() => {
      n += step; if (n >= target) { setCount(target); clearInterval(t); } else setCount(n);
    }, 16);
    return () => clearInterval(t);
  }, [started, target, duration]);
  return { count, ref, started };
}

function KpiCard({ icon: Icon, label, value }: { icon: typeof ShoppingBag; label: string; value: number | null }) {
  const { count, ref, started } = useCountUp(value);
  return (
    <div ref={ref} className="text-center bg-white/15 rounded-2xl p-6 backdrop-blur-sm border border-white/20 reveal">
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
        <Icon size={24} className="text-white" />
      </div>
      {value === null
        ? <div className="h-10 flex items-center justify-center"><Spinner /></div>
        : <p className="text-5xl font-extrabold" style={{ fontFamily: "'Playfair Display', serif" }}>{count.toLocaleString()}+</p>}
      <p className="text-white/85 text-sm font-semibold mt-1">{label}</p>
      <div className="kpi-bar mt-3"><div className={`kpi-bar-fill ${started ? 'animate' : ''}`} /></div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   2-Step Order Modal
──────────────────────────────────────────────── */
type ModalStep = 1 | 2 | 3; // 1=select item, 2=buyer details, 3=success

interface OrderModalProps {
  master: MasterItem;
  onClose: () => void;
  onOrderPlaced: () => void;
}

function OrderModal({ master, onClose, onOrderPlaced }: OrderModalProps) {
  const [step, setStep] = useState<ModalStep>(1);
  const [subItems, setSubItems] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState('');

  const [form, setForm] = useState({ name: '', phone: '', address: '', zip: '', landmark: '' });
  const patch = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  // Fetch sub-items for this master category
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'sub_inventory',
            action: 'select',
            filters: { master_item_id: master.id }
          })
        });
        const d = await res.json();
        setSubItems(d.data || []);
        if (d.data?.length > 0) setSelectedItem(d.data[0]);
      } catch (e) { console.error(e); }
      finally { setLoadingSubs(false); }
    })();
  }, [master.id]);

  const handlePlaceOrder = async () => {
    if (!selectedItem) return;
    if (!form.name || !form.phone || !form.address || !form.zip || !form.landmark) {
      alert('All fields are required'); return;
    }
    setSubmitting(true);
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders',
          action: 'insert',
          data: {
            client_name: form.name,
            client_phone: form.phone,
            client_address: form.address,
            client_zip: form.zip,
            client_landmark: form.landmark,
            item_name: selectedItem.name,
            item_id: selectedItem.id,
            master_category_name: master.name,
            price: selectedItem.price,
            quantity: qty,
            status: 'pending',
            otp: generatedOtp
          }
        })
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setOtp(generatedOtp);
      setStep(3);
      onOrderPlaced();
    } catch (e: any) {
      alert(e.message || 'Failed to place order. Try again.');
    } finally { setSubmitting(false); }
  };

  const price = selectedItem ? selectedItem.price * qty : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="relative h-36 flex-shrink-0">
          <img
            src={master.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
            alt={master.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X size={15} />
          </button>
          <div className="absolute bottom-4 left-5">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{master.category}</span>
            <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {master.name}
            </h2>
          </div>
          {/* Step indicator */}
          <div className="absolute top-3 left-5 flex items-center gap-1.5">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === 3 ? 'bg-green-400' : step >= s ? 'bg-amber-400 w-8' : 'bg-white/30 w-4'}`} />
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Step 1: Select Sub-Item ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 1 of 2</p>
                <h3 className="text-lg font-extrabold text-gray-900 mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Choose your item
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Select a specific dish from this category</p>
              </div>

              {loadingSubs ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : subItems.length === 0 ? (
                <div className="text-center py-8 bg-amber-50 rounded-2xl border border-amber-100">
                  <UtensilsCrossed size={32} className="mx-auto text-amber-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">No specific items listed yet</p>
                  <p className="text-xs text-gray-400 mt-1">You can still order the master dish below</p>
                  {/* Fallback: order master item directly */}
                  <button
                    onClick={() => {
                      // Create a synthetic vendor item from master
                      setSelectedItem({ id: master.id, item_name: master.name, price: master.price ?? master.base_price, quantity: 99, image_url: master.image_url, master_item_id: master.id, vendor_id: '' });
                      setStep(2);
                    }}
                    className="mt-4 px-5 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
                  >
                    Order {master.name} →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {subItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all text-left ${
                        selectedItem?.id === item.id
                          ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100'
                          : 'border-gray-100 hover:border-amber-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {item.image_url
                          ? <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300"><UtensilsCrossed size={20} /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{item.item_name}</p>
                        <p className="text-amber-600 font-extrabold text-sm">₹{item.price}</p>
                        {item.quantity < 5 && (
                          <span className="text-[10px] font-bold text-red-500">Only {item.quantity} left!</span>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedItem?.id === item.id ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                      }`}>
                        {selectedItem?.id === item.id && <CheckCircle size={12} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Quantity selector */}
              {subItems.length > 0 && selectedItem && (
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <span className="text-sm font-bold text-gray-700">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-amber-400 transition-colors font-bold text-lg">
                      −
                    </button>
                    <span className="text-lg font-extrabold text-gray-900 w-6 text-center">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(20, q + 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-amber-400 transition-colors font-bold text-lg">
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Buyer Details ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 2 of 2</p>
                <h3 className="text-lg font-extrabold text-gray-900 mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Your delivery details
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Ordering: <strong className="text-gray-700">{selectedItem?.item_name}</strong> × {qty}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Full Name" placeholder="Your name" icon={User} value={form.name} onChange={patch('name')} />
                <FormField label="Phone" placeholder="+91..." icon={Phone} value={form.phone} onChange={patch('phone')} type="tel" />
              </div>
              <FormField label="Full Address" placeholder="Flat, Building, Street, Area..." icon={MapPin} value={form.address} onChange={patch('address')} />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="PIN Code" placeholder="110001" icon={Hash} value={form.zip} onChange={patch('zip')} maxLength={6} />
                <FormField label="Landmark" placeholder="Near Metro, Park..." icon={MapPin} value={form.landmark} onChange={patch('landmark')} />
              </div>

              {/* Order Summary */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Order Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{selectedItem?.item_name} × {qty}</span>
                  <span className="font-extrabold text-amber-700">₹{price}</span>
                </div>
                <p className="text-[10px] text-amber-600 mt-2">🔐 A 4-digit OTP will be generated. Share it with your vendor on delivery to complete the handover.</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Order Placed!
                </h3>
                <p className="text-gray-500 text-sm mt-1">Your order has been broadcast to nearby vendors.</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Your Delivery OTP</p>
                <p className="text-5xl font-extrabold tracking-[0.25em]">{otp}</p>
                <p className="text-xs opacity-75 mt-3">Share this code with your vendor when they arrive to complete the delivery handover.</p>
              </div>
              <p className="text-xs text-gray-400">This window will close automatically in a moment...</p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-gray-100">
          {step === 1 && subItems.length > 0 && (
            <button
              disabled={!selectedItem}
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-200 disabled:opacity-40"
            >
              Continue to Details <ChevronRight size={18} />
            </button>
          )}
          {step === 2 && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 text-sm font-semibold transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                disabled={submitting || !form.name || !form.phone || !form.address || !form.zip || !form.landmark}
                onClick={handlePlaceOrder}
                className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-200 disabled:opacity-40"
              >
                {submitting ? <Spinner /> : <><ArrowRight size={16} /> Place Order — ₹{price}</>}
              </button>
            </div>
          )}
          {step === 3 && (
            <button
              onClick={onClose}
              className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle size={16} /> Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Tiny form field helper */
function FormField({ label, placeholder, icon: Icon, value, onChange, type = 'text', maxLength }: {
  label: string; placeholder: string; icon: typeof User;
  value: string; onChange: (v: string) => void; type?: string; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</label>
      <div className="relative">
        <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-gray-300"
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Main Landing Component
──────────────────────────────────────────────── */
export function Landing({ onNavigate }: { onNavigate: (role: Role) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalVendors, setTotalVendors] = useState<number | null>(null);
  const [vendorPlanFile, setVendorPlanFile] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedMaster, setSelectedMaster] = useState<MasterItem | null>(null);

  useScrollReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [iR, oR, vR, gR] = await Promise.all([
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'master_inventory', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'orders', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'vendors', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'guides', action: 'select' }) }),
        ]);
        const [id, od, vd, gd] = await Promise.all([iR.json(), oR.json(), vR.json(), gR.json()]);
        if (id.data) setMasterItems(id.data);
        if (od.data) setTotalOrders(od.data.length);
        if (vd.data) setTotalVendors(vd.data.length);
        if (gd.data) {
          const plans = gd.data.filter((g: any) => g.allowed_roles?.includes('vendor_plan'));
          if (plans.length > 0) {
            // Get the most recently uploaded plan
            const latest = plans.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            setVendorPlanFile(latest.file_data);
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoadingItems(false); }
    })();
  }, []);

  const handleVendorPlanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (vendorPlanFile) {
      // Create a temporary link to open base64 data in new tab, or just use window.open for pdf/image
      // Some browsers block huge data URIs in window.open, so we can construct a Blob
      try {
        const arr = vendorPlanFile.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (err) {
        window.open(vendorPlanFile, '_blank');
      }
    } else {
      alert("Vendor plan document is currently unavailable.");
    }
  };

  const categories = ['All', ...Array.from(new Set(masterItems.map(m => m.category)))];
  const filtered = activeCategory === 'All' ? masterItems : masterItems.filter(m => m.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#F8F8FF] text-[#111118]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Floating WhatsApp ──────────────────── */}
      <a href="https://wa.me/919175537373?text=Hello%20Vikram%20Advertising%2C%20I%20have%20an%20inquiry." target="_blank" rel="noopener noreferrer" className="wa-float" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ── Order Modal ────────────────────────── */}
      {selectedMaster && (
        <OrderModal
          master={selectedMaster}
          onClose={() => setSelectedMaster(null)}
          onOrderPlaced={() => setTotalOrders(p => p !== null ? p + 1 : 1)}
        />
      )}

      {/* ── Header ─────────────────────────────── */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100' : 'bg-[#F8F8FF]/80'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Vikram Advertising" className="h-11 w-auto object-contain" />
            <span className="font-extrabold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Vikram Advertising
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <button onClick={handleVendorPlanClick} className="text-sm font-semibold text-gray-600 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-50">
              Vendor's Plan
            </button>
            <button onClick={() => onNavigate('login')} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Login / Sign-In
            </button>
          </nav>
        </div>
      </header>

      {/* ── Master Inventory Grid ───────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-14">



        {/* Items */}
        {loadingItems ? (
          <div className="flex justify-center items-center py-40"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 text-gray-400">
            <UtensilsCrossed size={44} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">No items yet</p>
            <p className="text-sm mt-1">Vendors are setting up menus — check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((item, i) => (
              <div
                key={item.id}
                onClick={() => setSelectedMaster(item)}
                className={`inventory-card reveal reveal-delay-${Math.min((i % 4) + 1, 6)}`}
              >
                <div className="card-img relative">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} loading="lazy" />
                    : <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-amber-200"><UtensilsCrossed size={40} /></div>
                  }
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-600 border border-gray-100 shadow-sm">
                    {item.category}
                  </span>
                  <div className="absolute inset-0 bg-amber-500/85 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight size={28} className="text-white" />
                    <span className="text-white text-sm font-bold tracking-wide">Select &amp; Order</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {item.name}
                  </h3>
                  <p className="text-amber-600 font-extrabold text-xl mt-1">
                    ₹{item.base_price ?? item.price}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── KPI Section ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-12 text-white overflow-hidden shadow-2xl shadow-amber-200">
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
            <div className="reveal reveal-left">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Vikram Advertising" className="h-12 w-auto object-contain" />
                <span className="font-extrabold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Vikram Advertising</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">Connecting verified local kitchen vendors with guests through a seamless, real-time ordering platform.</p>
            </div>

            <div className="reveal">
              <h3 className="font-bold text-[#111118] text-sm mb-5 uppercase tracking-widest">Get in Touch</h3>
              <ul className="space-y-3">
                {[
                  { href: 'tel:+919175537373', icon: Phone, label: '+91 91755 37373', color: 'amber' },
                  { href: 'https://wa.me/919175537373?text=Hello%20Vikram%20Advertising%2C%20I%20have%20an%20inquiry.', icon: MessageCircle, label: 'WhatsApp Us', color: 'green' },
                  { href: 'mailto:2711vikram@gmail.com', icon: Mail, label: '2711vikram@gmail.com', color: 'amber' },
                  { href: 'mailto:vikram271@rediffmail.com', icon: Mail, label: 'vikram271@rediffmail.com', color: 'amber' },
                ].map(({ href, icon: Icon, label, color }) => (
                  <li key={label}>
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                      className={`flex items-center gap-3 text-sm text-gray-600 hover:text-${color}-600 transition-colors group`}>
                      <div className={`w-9 h-9 rounded-xl bg-${color}-50 group-hover:bg-${color}-100 flex items-center justify-center transition-colors shadow-sm`}>
                        <Icon size={15} className={`text-${color}-600`} />
                      </div>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal reveal-right">
              <h3 className="font-bold text-[#111118] text-sm mb-5 uppercase tracking-widest">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => onNavigate('login')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors">
                    <Lock size={14} /> Login / Sign-In
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

          <div className="border-t border-gray-100 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">© 2026 Vikram Advertising. All rights reserved.</p>
            <div className="flex items-center gap-3">
              {[
                { href: 'https://wa.me/919175537373?text=Hello%20Vikram%20Advertising%2C%20I%20have%20an%20inquiry.', Icon: MessageCircle, bg: 'bg-green-100 hover:bg-green-200', color: 'text-green-600' },
                { href: 'tel:+919175537373', Icon: Phone, bg: 'bg-amber-100 hover:bg-amber-200', color: 'text-amber-600' },
                { href: 'mailto:2711vikram@gmail.com', Icon: Mail, bg: 'bg-amber-100 hover:bg-amber-200', color: 'text-amber-600' },
              ].map(({ href, Icon, bg, color }) => (
                <a key={href} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center transition-colors`}>
                  <Icon size={16} className={color} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
