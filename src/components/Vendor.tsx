import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, CreditCard, Radar, Plus, Trash2,
  DollarSign, Clock, CheckCircle2, Zap, Search, MapPin, Phone,
  KeyRound, AlertCircle, Store,
} from 'lucide-react';
import { supabase, type Vendor, type VendorItem, type Order, type Plan, type MasterItem } from '../lib/supabase';
import { Button, Badge, Modal, Input, useToast, Toast, Spinner, EmptyState, SpotlightCard } from './ui';

type Tab = 'dashboard' | 'orders' | 'inventory' | 'upgrade';

export function Vendor({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast, show } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('vendors').select('*').eq('status', 'approved').maybeSingle();
      setVendor(data);
      setLoading(false);
    })();
  }, []);

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Order Radar', icon: Radar },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'upgrade', label: 'Upgrade Plan', icon: CreditCard },
  ];

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><Spinner /></div>;

  if (!vendor) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="card p-8 max-w-md text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold">No approved vendor account</h2>
          <p className="text-muted mt-2 text-sm">Your vendor account is pending approval by the super admin. Once approved, you'll see your dashboard here.</p>
          <Button className="mt-6" onClick={onExit}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="w-64 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{vendor.shop_name}</p>
            <p className="text-xs text-muted">Vendor Portal</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                tab === item.id ? 'bg-green-500/10 text-green-400' : 'text-muted hover:text-white hover:bg-surface-2'
              }`}
            >
              {tab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-400 rounded-r-full" />}
              <item.icon size={18} className={tab === item.id ? '' : 'group-hover:scale-110 transition-transform'} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full" onClick={onExit}>Exit</Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {tab === 'dashboard' && <VendorDashboard vendor={vendor} />}
          {tab === 'orders' && <OrderRadar vendor={vendor} show={show} />}
          {tab === 'inventory' && <Inventory vendor={vendor} show={show} />}
          {tab === 'upgrade' && <UpgradePlan vendor={vendor} show={show} />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function VendorDashboard({ vendor }: { vendor: Vendor }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: i }] = await Promise.all([
        supabase.from('orders').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('vendor_inventory').select('*').eq('vendor_id', vendor.id),
      ]);
      setOrders(o || []);
      setItems(i || []);
      setLoading(false);
    })();
  }, [vendor.id]);

  if (loading) return <Spinner />;

  const revenue = orders.reduce((s, o) => s + Number(o.price), 0);
  const pending = orders.filter((o) => o.status === 'pending').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;

  const kpis = [
    { label: 'Today\'s Revenue', value: `₹${revenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Pending Orders', value: pending, icon: Clock, color: 'text-amber-400' },
    { label: 'Delivered', value: delivered, icon: CheckCircle2, color: 'text-blue-400' },
    { label: 'Menu Items', value: items.length, icon: Package, color: 'text-accent' },
  ];

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold">Welcome back, {vendor.owner_name.split(' ')[0]}</h1>
        <p className="text-muted mt-1">Here's what's happening at {vendor.shop_name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {kpis.map((k) => (
          <SpotlightCard key={k.label} className="card p-6 hover-lift">
            <div className={`w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center ${k.color}`}>
              <k.icon size={20} />
            </div>
            <p className="text-3xl font-bold mt-4">{k.value}</p>
            <p className="text-sm text-muted mt-1">{k.label}</p>
          </SpotlightCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="card p-6 animate-fade-in-up delay-200">
          <h3 className="font-bold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 hover:bg-border/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <ShoppingBag size={15} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{o.item_name}</p>
                    <p className="text-xs text-muted">{o.client_name} · {o.distance_km}km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">₹{o.price}</span>
                  <Badge variant={o.status === 'delivered' ? 'success' : o.status === 'pending' ? 'warning' : 'accent'}>
                    {o.status}
                  </Badge>
                </div>
              </div>
            ))}
            {orders.length === 0 && <EmptyState icon={<ShoppingBag size={24} />} title="No orders yet" />}
          </div>
        </div>

        <div className="card p-6 animate-fade-in-up delay-300">
          <h3 className="font-bold mb-4">Subscription Status</h3>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase">Current Plan</p>
                <p className="text-2xl font-bold text-green-400">{vendor.plan_name || 'Free'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Zap size={24} className="text-green-400" />
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Valid Until</span>
                <span className="font-semibold">{vendor.subscription_end ? new Date(vendor.subscription_end).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Total Clients</span>
                <span className="font-semibold">{vendor.total_clients}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderRadar({ vendor, show }: { vendor: Vendor; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [otpInput, setOtpInput] = useState('');

  const load = async () => {
    const { data } = await supabase.from('orders').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendor.id]);

  const accept = async (o: Order) => {
    await supabase.from('orders').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', o.id);
    show('Order accepted');
    load();
    setSelected(null);
  };

  const markPreparing = async (o: Order) => {
    await supabase.from('orders').update({ status: 'preparing' }).eq('id', o.id);
    show('Order is being prepared', 'info');
    load();
    setSelected(null);
  };

  const verifyOtp = async () => {
    if (!selected || !selected.otp) return;
    if (otpInput !== selected.otp) { show('Invalid OTP', 'error'); return; }
    await supabase.from('orders').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', selected.id);
    show('Order delivered successfully');
    setOtpInput('');
    setSelected(null);
    load();
  };

  if (loading) return <Spinner />;

  const columns = [
    { id: 'pending', title: 'New Orders', variant: 'warning' as const, icon: Clock },
    { id: 'accepted', title: 'Accepted', variant: 'accent' as const, icon: CheckCircle2 },
    { id: 'preparing', title: 'Preparing', variant: 'accent' as const, icon: Zap },
    { id: 'delivered', title: 'Delivered', variant: 'success' as const, icon: CheckCircle2 },
  ];

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Radar size={24} className="text-green-400" />
            </div>
            <div className="absolute inset-0 rounded-xl border-2 border-green-500/30 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Order Radar</h1>
            <p className="text-muted mt-1">Real-time incoming orders</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);
          return (
            <div key={col.id} className="space-y-3 animate-fade-in-up" style={{ animationDelay: `${columns.indexOf(col) * 0.1}s` }}>
              <div className="flex items-center gap-2 px-1">
                <col.icon size={16} className="text-muted" />
                <p className="text-sm font-bold">{col.title}</p>
                <Badge variant={col.variant}>{colOrders.length}</Badge>
              </div>
              <div className="space-y-3 min-h-[100px]">
                {colOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => { setSelected(o); setOtpInput(''); }}
                    className="card p-4 hover-lift cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm">{o.item_name}</p>
                        <p className="text-xs text-muted mt-0.5">{o.client_name}</p>
                      </div>
                      <span className="text-sm font-bold text-green-400">₹{o.price}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                      <MapPin size={12} /> {o.distance_km}km
                      {o.client_phone && <><span>·</span><Phone size={12} /> {o.client_phone.slice(-4)}</>}
                    </div>
                    {o.status === 'pending' && (
                      <div className="mt-3">
                        <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); accept(o); }}>
                          Accept Order
                        </Button>
                      </div>
                    )}
                    {o.status === 'accepted' && (
                      <button onClick={(e) => { e.stopPropagation(); markPreparing(o); }} className="w-full mt-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors">
                        Start Preparing
                      </button>
                    )}
                    {o.status === 'delivered' && o.otp && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-green-400">
                        <KeyRound size={12} /> OTP: {o.otp}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && <EmptyState icon={<Radar size={28} />} title="No orders on the radar" subtitle="New orders will appear here in real-time" />}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Order Details" size="md">
        {selected && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-surface-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-lg">{selected.item_name}</p>
                  <p className="text-sm text-muted">Qty: {selected.quantity} · ₹{selected.price}</p>
                </div>
                <Badge variant={selected.status === 'delivered' ? 'success' : selected.status === 'pending' ? 'warning' : 'accent'}>
                  {selected.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-2">
                <p className="text-xs text-muted mb-1">Client</p>
                <p className="text-sm font-medium">{selected.client_name}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-2">
                <p className="text-xs text-muted mb-1">Phone</p>
                <p className="text-sm font-medium">{selected.client_phone || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 col-span-2">
                <p className="text-xs text-muted mb-1">Address</p>
                <p className="text-sm font-medium">{selected.client_address}</p>
                <p className="text-xs text-muted mt-1">ZIP: {selected.client_zip} · {selected.distance_km}km away</p>
              </div>
            </div>
            {selected.otp && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400 font-semibold mb-1">Delivery OTP</p>
                <p className="text-2xl font-bold tracking-[0.5em] text-green-400">{selected.otp}</p>
              </div>
            )}
            {selected.status === 'pending' && (
              <Button className="w-full" onClick={() => accept(selected)}>
                <CheckCircle2 size={16} /> Accept Order
              </Button>
            )}
            {selected.status === 'accepted' && (
              <Button className="w-full" onClick={() => markPreparing(selected)}>
                <Zap size={16} /> Start Preparing
              </Button>
            )}
            {selected.status === 'preparing' && (
              <div className="space-y-3">
                <Input label="Enter Delivery OTP" value={otpInput} onChange={setOtpInput} placeholder="4-digit OTP" />
                <Button className="w-full" onClick={verifyOtp}>
                  <KeyRound size={16} /> Verify & Deliver
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Inventory({ vendor, show }: { vendor: Vendor; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [items, setItems] = useState<VendorItem[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    const [{ data: v }, { data: m }] = await Promise.all([
      supabase.from('vendor_inventory').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false }),
      supabase.from('master_inventory').select('*'),
    ]);
    setItems(v || []);
    setMasterItems(m || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendor.id]);

  const addFromMaster = async (m: MasterItem) => {
    await supabase.from('vendor_inventory').insert({
      vendor_id: vendor.id,
      master_item_id: m.id,
      item_name: m.name,
      category: m.category,
      image_url: m.image_url,
      price: m.base_price,
      quantity: m.quantity,
    });
    show(`${m.name} added to your menu`);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('vendor_inventory').delete().eq('id', id);
    show('Item removed', 'info');
    load();
  };

  const updateQty = async (item: VendorItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    await supabase.from('vendor_inventory').update({ quantity: newQty }).eq('id', item.id);
    load();
  };

  if (loading) return <Spinner />;

  const filteredMaster = masterItems.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) &&
    !items.some((i) => i.master_item_id === m.id)
  );

  return (
    <div>
      <div className="flex items-end justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted mt-1">{items.length} items on your menu</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={16} /> Add Items</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
        {items.map((item) => (
          <div key={item.id} className="card overflow-hidden hover-lift group">
            <div className="relative aspect-square overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                  <Package size={32} className="text-muted" />
                </div>
              )}
              {item.category && <div className="absolute top-2 right-2"><Badge variant="accent">{item.category}</Badge></div>}
            </div>
            <div className="p-4">
              <p className="font-bold">{item.item_name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-green-400">₹{item.price}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item, -1)} className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-border/30 flex items-center justify-center text-muted hover:text-white transition-colors">−</button>
                  <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item, 1)} className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-border/30 flex items-center justify-center text-muted hover:text-white transition-colors">+</button>
                </div>
              </div>
              <button onClick={() => remove(item.id)} className="w-full mt-3 py-1.5 rounded-lg bg-surface-2 text-xs text-muted hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center gap-1.5">
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && <EmptyState icon={<Package size={28} />} title="No items yet" subtitle="Add items from the master catalog" />}

      <Modal open={modal} onClose={() => setModal(false)} title="Add from Master Catalog" size="lg">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
          {filteredMaster.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 hover:bg-border/30 transition-colors group">
              {m.image_url ? (
                <img src={m.image_url} alt={m.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center"><Package size={18} className="text-muted" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{m.name}</p>
                <p className="text-xs text-muted">₹{m.base_price} · {m.category}</p>
              </div>
              <button onClick={() => addFromMaster(m)} className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center justify-center transition-colors">
                <Plus size={16} />
              </button>
            </div>
          ))}
          {filteredMaster.length === 0 && <p className="text-muted text-sm text-center py-4">No items to add</p>}
        </div>
      </Modal>
    </div>
  );
}

function UpgradePlan({ vendor, show }: { vendor: Vendor; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('subscription_plans').select('*').eq('status', 'active').order('price');
      setPlans(data || []);
      setLoading(false);
    })();
  }, []);

  const requestUpgrade = async (p: Plan) => {
    await supabase.from('upgrade_requests').insert({
      vendor_id: vendor.id,
      vendor_name: vendor.shop_name,
      current_plan: vendor.plan_name,
      requested_plan: p.name,
      payment_status: 'pending',
      status: 'pending',
    });
    await supabase.from('activity_log').insert({ action: `Upgrade request: ${vendor.shop_name} → ${p.name}`, actor: 'Vendor' });
    setRequested(p.id);
    show(`Upgrade to ${p.name} requested`);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold">Upgrade Your Plan</h1>
        <p className="text-muted mt-1">Current plan: <span className="text-green-400 font-semibold">{vendor.plan_name || 'Free'}</span></p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {plans.map((p) => {
          const isCurrent = p.name === vendor.plan_name;
          const isRequested = requested === p.id;
          return (
            <SpotlightCard key={p.id} className={`card p-6 hover-lift relative ${isCurrent ? 'border-green-500/40' : ''}`}>
              {isCurrent && <div className="absolute top-4 right-4"><Badge variant="success">Current</Badge></div>}
              <p className="text-xs text-muted uppercase tracking-wider">{p.name}</p>
              <p className="text-4xl font-bold mt-2">₹{p.price}</p>
              <p className="text-xs text-muted">/{p.validity_days} days</p>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Max Items</span>
                  <span className="font-semibold">{p.max_items === 9999 ? '∞' : p.max_items}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Max Clients</span>
                  <span className="font-semibold">{p.max_clients === 99999 ? '∞' : p.max_clients}</span>
                </div>
              </div>
              <div className="mt-6">
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl bg-green-500/10 text-green-400 text-sm font-semibold text-center">Active</div>
                ) : isRequested ? (
                  <div className="w-full py-2.5 rounded-xl bg-amber-500/10 text-amber-400 text-sm font-semibold text-center">Request Sent</div>
                ) : (
                  <Button variant="secondary" className="w-full" onClick={() => requestUpgrade(p)}>
                    Request Upgrade
                  </Button>
                )}
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </div>
  );
}
