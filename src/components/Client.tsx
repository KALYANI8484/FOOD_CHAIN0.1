import { useEffect, useState } from 'react';
import {
  MapPin, Search, ShoppingBag, Clock, Star, ArrowLeft, ArrowRight,
  Plus, Minus, CheckCircle2, KeyRound, Navigation, UtensilsCrossed,
  Zap, Package,
} from 'lucide-react';
import { supabase, type Vendor, type VendorItem, type Order } from '../lib/supabase';
import { Button, Badge, Drawer, useToast, Toast, Spinner, EmptyState } from './ui';

type Step = 'location' | 'browse' | 'tracking';

export function Client({ onExit, initialZip }: { onExit: () => void; initialZip?: string }) {
  const [step, setStep] = useState<Step>(initialZip && initialZip.length >= 4 ? 'browse' : 'location');
  const [zip, setZip] = useState(initialZip || '');
  const [cart, setCart] = useState<Record<string, { item: VendorItem; qty: number }>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const { toast, show } = useToast();

  return (
    <div className="min-h-screen bg-bg noise relative">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <span className="font-bold">MealMesh</span>
          </div>
          {step === 'browse' && (
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-2 text-sm text-muted">
              <MapPin size={14} className="text-accent" /> {zip}
            </div>
          )}
          <div className="flex items-center gap-3">
            {step === 'browse' && Object.keys(cart).length > 0 && (
              <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors">
                <ShoppingBag size={16} /> Cart
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">
                  {Object.values(cart).reduce((s, c) => s + c.qty, 0)}
                </span>
              </button>
            )}
            <Button variant="ghost" size="sm" onClick={onExit}>Exit</Button>
          </div>
        </div>
      </header>

      {step === 'location' && <LocationGate zip={zip} setZip={setZip} onNext={() => setStep('browse')} />}
      {step === 'browse' && <Browse zip={zip} cart={cart} setCart={setCart} show={show} />}
      {step === 'tracking' && activeOrder && <Tracking order={activeOrder} onBack={() => { setActiveOrder(null); setStep('browse'); }} />}

      {/* Cart drawer */}
      <Drawer open={cartOpen} onClose={() => setCartOpen(false)} title="Your Cart">
        <CartView cart={cart} setCart={setCart} onCheckout={(order) => { setCartOpen(false); setActiveOrder(order); setStep('tracking'); }} show={show} />
      </Drawer>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function LocationGate({ zip, setZip, onNext }: { zip: string; setZip: (v: string) => void; onNext: () => void }) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 grid-bg">
      <div className="max-w-md w-full text-center animate-fade-in-up">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
            <Navigation size={36} className="text-white" />
          </div>
          <div className="absolute inset-0 rounded-3xl border-2 border-accent/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
        <h1 className="text-3xl font-bold">What's your ZIP code?</h1>
        <p className="text-muted mt-3">We'll find the best restaurants near you</p>
        <div className="mt-8 space-y-4">
          <div className="relative">
            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && zip.length >= 4 && onNext()}
              placeholder="Enter ZIP code"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-2 border border-border text-lg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              autoFocus
            />
          </div>
          <Button size="lg" className="w-full" onClick={onNext} disabled={zip.length < 4}>
            Find Restaurants <ArrowRight size={18} />
          </Button>
        </div>
        <p className="text-xs text-muted mt-6">Try ZIP 560038 for demo restaurants</p>
      </div>
    </div>
  );
}

function Browse({ zip, cart, setCart, show }: {
  zip: string;
  cart: Record<string, { item: VendorItem; qty: number }>;
  setCart: (c: Record<string, { item: VendorItem; qty: number }>) => void;
  show: (m: string, t?: 'success' | 'error' | 'info') => void;
}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    (async () => {
      const { data: v } = await supabase.from('vendors').select('*').eq('status', 'approved');
      setVendors(v || []);
      if (v && v.length > 0) {
        const { data: i } = await supabase.from('vendor_inventory').select('*').in('vendor_id', v.map((x) => x.id));
        setItems(i || []);
      }
      setLoading(false);
    })();
  }, []);

  const categories: string[] = ['all', ...Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c)))];

  const filtered = items.filter((i) => {
    const matchSearch = i.item_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || i.category === category;
    return matchSearch && matchCat;
  });

  const addToCart = (item: VendorItem) => {
    const c = { ...cart };
    if (c[item.id]) c[item.id].qty++;
    else c[item.id] = { item, qty: 1 };
    setCart(c);
    show(`${item.item_name} added to cart`);
  };

  if (loading) return <div className="py-20"><Spinner /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero banner */}
      <div className="card p-8 mb-8 relative overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative flex items-center justify-between">
          <div>
            <Badge variant="accent">Delivering to {zip}</Badge>
            <h1 className="text-3xl font-bold mt-3">Hungry? We've got you.</h1>
            <p className="text-muted mt-1">{vendors.length} restaurants · {items.length} dishes available</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted">
            <Clock size={16} className="text-green-400" /> 24 min avg delivery
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 animate-fade-in-up delay-100">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for dishes..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-surface-2 border border-border focus:border-accent outline-none transition-all"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 animate-fade-in-up delay-200">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              category === c ? 'bg-accent text-white' : 'bg-surface-2 text-muted hover:text-white'
            }`}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
        {filtered.map((item) => (
          <div key={item.id} className="card overflow-hidden hover-lift group">
            <div className="relative aspect-[4/3] overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                  <Package size={32} className="text-muted" />
                </div>
              )}
              {item.category && <div className="absolute top-2 left-2"><Badge variant="accent">{item.category}</Badge></div>}
              {item.quantity > 0 ? (
                <div className="absolute top-2 right-2"><Badge variant="success">In Stock</Badge></div>
              ) : (
                <div className="absolute top-2 right-2"><Badge variant="error">Out</Badge></div>
              )}
            </div>
            <div className="p-4">
              <p className="font-bold">{item.item_name}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star size={12} className="text-accent-2 fill-accent-2" />
                <span className="text-xs text-muted">4.{Math.floor(Math.random() * 9)} · {Math.floor(Math.random() * 200) + 30} orders</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xl font-bold text-accent">₹{item.price}</span>
                <Button size="sm" onClick={() => addToCart(item)} disabled={item.quantity === 0}>
                  <Plus size={14} /> Add
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon={<Search size={28} />} title="No dishes found" subtitle="Try a different search or category" />}
    </div>
  );
}

function CartView({ cart, setCart, onCheckout, show }: {
  cart: Record<string, { item: VendorItem; qty: number }>;
  setCart: (c: Record<string, { item: VendorItem; qty: number }>) => void;
  onCheckout: (o: Order) => void;
  show: (m: string, t?: 'success' | 'error' | 'info') => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [placing, setPlacing] = useState(false);

  const entries = Object.values(cart);
  const total = entries.reduce((s, c) => s + Number(c.item.price) * c.qty, 0);
  const vendorId = entries[0]?.item.vendor_id;

  const updateQty = (id: string, delta: number) => {
    const c = { ...cart };
    if (!c[id]) return;
    c[id].qty += delta;
    if (c[id].qty <= 0) delete c[id];
    setCart(c);
  };

  const placeOrder = async () => {
    if (!name || !phone || !address) { show('Please fill all required fields', 'error'); return; }
    if (entries.length === 0) { show('Cart is empty', 'error'); return; }
    setPlacing(true);
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const { data, error } = await supabase.from('orders').insert({
      client_name: name,
      client_phone: phone,
      client_zip: '560038',
      client_landmark: landmark || null,
      client_address: address,
      item_name: entries.map((e) => `${e.item.item_name} x${e.qty}`).join(', '),
      vendor_id: vendorId,
      price: total,
      quantity: entries.reduce((s, c) => s + c.qty, 0),
      status: 'pending',
      otp,
      distance_km: Math.round(Math.random() * 5 * 10) / 10,
    }).select().single();
    setPlacing(false);
    if (error) { show('Failed to place order', 'error'); return; }
    await supabase.from('activity_log').insert({ action: `New order placed by ${name}`, actor: 'Client' });
    show('Order placed successfully!');
    setCart({});
    onCheckout(data);
  }

  if (entries.length === 0) {
    return <EmptyState icon={<ShoppingBag size={28} />} title="Your cart is empty" subtitle="Add some delicious items!" />;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {entries.map(({ item, qty }) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2">
            {item.image_url ? (
              <img src={item.image_url} alt={item.item_name} className="w-14 h-14 rounded-lg object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-surface flex items-center justify-center"><Package size={18} className="text-muted" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.item_name}</p>
              <p className="text-xs text-muted">₹{item.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-surface hover:bg-border/30 flex items-center justify-center text-muted hover:text-white transition-colors"><Minus size={14} /></button>
              <span className="text-sm font-semibold w-6 text-center">{qty}</span>
              <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-surface hover:bg-border/30 flex items-center justify-center text-muted hover:text-white transition-colors"><Plus size={14} /></button>
            </div>
            <span className="text-sm font-bold w-16 text-right">₹{Number(item.price) * qty}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <p className="text-sm font-bold text-muted uppercase tracking-wider">Delivery Details</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number *" className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none" />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address *" className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none" />
        <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Landmark (optional)" className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none" />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-lg font-bold">Total</span>
        <span className="text-2xl font-bold text-accent">₹{total}</span>
      </div>

      <Button size="lg" className="w-full" onClick={placeOrder} disabled={placing}>
        {placing ? <Spinner /> : <>Place Order <ArrowRight size={18} /></>}
      </Button>
    </div>
  );
}

function Tracking({ order, onBack }: { order: Order; onBack: () => void }) {
  const [status, setStatus] = useState(order.status);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', order.id).maybeSingle();
      if (data) setStatus(data.status);
    }, 3000);
    return () => clearInterval(interval);
  }, [order.id]);

  const stages = [
    { id: 'pending', label: 'Order Placed', icon: CheckCircle2 },
    { id: 'accepted', label: 'Accepted by Restaurant', icon: Zap },
    { id: 'preparing', label: 'Being Prepared', icon: Package },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];
  const currentIdx = stages.findIndex((s) => s.id === status);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-muted hover:text-white transition-colors mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to browsing
      </button>

      <div className="card p-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Order Tracking</h1>
            <p className="text-muted text-sm mt-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <Badge variant={status === 'delivered' ? 'success' : 'accent'}>{status}</Badge>
        </div>

        {/* Progress */}
        <div className="mt-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
            <div
              className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-accent to-accent-2 transition-all duration-500"
              style={{ width: `calc(${(currentIdx / (stages.length - 1)) * 100}% - ${currentIdx === 0 ? '0px' : '20px'})` }}
            />
            {stages.map((s, i) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${i <= currentIdx ? 'bg-accent text-white' : 'bg-surface-2 text-muted'}`}>
                  <s.icon size={18} />
                </div>
                <p className={`text-xs font-semibold text-center ${i <= currentIdx ? 'text-white' : 'text-muted'}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order details */}
        <div className="mt-8 p-4 rounded-xl bg-surface-2">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Order Summary</p>
          <p className="font-semibold">{order.item_name}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted">Deliver to: {order.client_address}</span>
            <span className="text-lg font-bold text-accent">₹{order.price}</span>
          </div>
        </div>

        {/* OTP */}
        {order.otp && (
          <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={18} className="text-green-400" />
              <p className="text-sm font-bold text-green-400">Delivery OTP</p>
            </div>
            <p className="text-3xl font-bold tracking-[0.4em] text-green-400">{order.otp}</p>
            <p className="text-xs text-muted mt-2">Share this OTP with the delivery partner to confirm delivery</p>
          </div>
        )}

        {status === 'delivered' && (
          <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center animate-scale-in">
            <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
            <p className="font-bold text-green-400">Order Delivered!</p>
            <p className="text-sm text-muted mt-1">Enjoy your meal!</p>
          </div>
        )}
      </div>
    </div>
  );
}
