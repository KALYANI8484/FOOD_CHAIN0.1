import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Store, Package, CreditCard, FileText, Settings, Users,
  ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle2,
  XCircle, Clock, Search, Plus, Trash2, Upload, AlertCircle, Activity as ActivityIcon,
  ChevronRight, MapPin, Phone, Mail, Calendar, Eye, Edit2, FileUp,
} from 'lucide-react';
import { supabase, type Vendor, type Plan, type MasterItem, type Order, type Activity, type Settings as SettingsType, type SubAdmin } from '../lib/supabase';
import { Button, Badge, Modal, Input, Select, useToast, Toast, Spinner, EmptyState, SpotlightCard } from './ui';

type Tab = 'dashboard' | 'vendors' | 'plans' | 'inventory' | 'orders' | 'guides' | 'settings' | 'sub_admins' | 'activity';

export function SuperAdmin({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const { toast, show } = useToast();

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'plans', label: 'Plans', icon: CreditCard },
    { id: 'inventory', label: 'Master Inventory', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'guides', label: 'Guides', icon: FileText },
    { id: 'sub_admins', label: 'Sub-Admins', icon: Users },
    { id: 'activity', label: 'Activity Log', icon: ActivityIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <ShoppingBag size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">MealMesh</p>
            <p className="text-xs text-muted">Super Admin</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                tab === item.id
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-white hover:bg-surface-2'
              }`}
            >
              {tab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />}
              <item.icon size={18} className={tab === item.id ? '' : 'group-hover:scale-110 transition-transform'} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full" onClick={onExit}>
            Exit Dashboard
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'vendors' && <VendorsTab show={show} />}
          {tab === 'orders' && <OrdersTab show={show} />}
          {tab === 'plans' && <PlansTab show={show} />}
          {tab === 'inventory' && <InventoryTab show={show} />}
          {tab === 'sub_admins' && <SubAdminsTab show={show} />}

          {tab === 'guides' && <GuidesTab show={show} />}

          {tab === 'activity' && <ActivityTab show={show} />}
          {tab === 'settings' && <SettingsTab show={show} />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function DashboardTab() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: v }, { data: o }, { data: a }] = await Promise.all([
        supabase.from('vendors').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(6),
      ]);
      setVendors(v || []);
      setOrders(o || []);
      setActivity(a || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const approved = vendors.filter((v) => v.status === 'approved').length;
  const pending = vendors.filter((v) => v.status === 'pending_approval').length;
  const revenue = orders.reduce((s, o) => s + Number(o.price), 0);

  const kpis = [
    { label: 'Total Revenue', value: `₹${revenue.toLocaleString()}`, change: '+12.5%', up: true, icon: DollarSign, color: 'text-green-400' },
    { label: 'Active Vendors', value: approved, change: '+3', up: true, icon: Store, color: 'text-accent' },
    { label: 'Pending Approvals', value: pending, change: '-2', up: false, icon: Clock, color: 'text-amber-400' },
    { label: 'Total Orders', value: orders.length, change: '+18%', up: true, icon: ShoppingBag, color: 'text-blue-400' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform overview and key metrics" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {kpis.map((k) => (
          <SpotlightCard key={k.label} className="card p-6 hover-lift">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center ${k.color}`}>
                <k.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${k.up ? 'text-green-400' : 'text-red-400'}`}>
                {k.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {k.change}
              </div>
            </div>
            <p className="text-3xl font-bold mt-4">{k.value}</p>
            <p className="text-sm text-muted mt-1">{k.label}</p>
          </SpotlightCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="card p-6 lg:col-span-2 animate-fade-in-up delay-200">
          <h3 className="font-bold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 hover:bg-border/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <ShoppingBag size={16} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{o.item_name}</p>
                    <p className="text-xs text-muted">{o.client_name} · {o.client_zip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">₹{o.price}</span>
                  <Badge variant={o.status === 'delivered' ? 'success' : o.status === 'pending' ? 'warning' : 'accent'}>
                    {o.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 animate-fade-in-up delay-300">
          <h3 className="font-bold mb-4">Activity Feed</h3>
          <div className="space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <ActivityIcon size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm">{a.action}</p>
                  <p className="text-xs text-muted">{a.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorsTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [note, setNote] = useState('');
  const [createMode, setCreateMode] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [createForm, setCreateForm] = useState({ owner_name: '', phone: '', email: '', shop_name: '', address: '', zip_code: '', plan_id: '' });

  const load = async () => {
    const [{ data: v }, { data: p }] = await Promise.all([
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('*').eq('status', 'active'),
    ]);
    setVendors(v || []);
    setPlans(p || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (v: Vendor) => {
    await supabase.from('vendors').update({ status: 'approved', subscription_start: new Date().toISOString().slice(0, 10), subscription_end: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) }).eq('id', v.id);
    await supabase.from('activity_log').insert({ action: `Vendor approved: ${v.shop_name}`, actor: 'Super Admin' });
    show(`Approved ${v.shop_name}`);
    load();
    setSelected(null);
  };

  const reject = async () => {
    if (!selected) return;
    await supabase.from('vendors').update({ status: 'rejected', rejection_note: note }).eq('id', selected.id);
    await supabase.from('activity_log').insert({ action: `Vendor rejected: ${selected.shop_name}`, actor: 'Super Admin' });
    show('Vendor rejected', 'error');
    setRejectMode(false);
    setNote('');
    setSelected(null);
    load();
  };

  const createVendor = async () => {
    const plan = plans.find((p) => p.id === createForm.plan_id);
    await supabase.from('vendors').insert({
      owner_name: createForm.owner_name,
      phone: createForm.phone,
      email: createForm.email || null,
      shop_name: createForm.shop_name,
      address: createForm.address,
      zip_code: createForm.zip_code,
      plan_id: createForm.plan_id || null,
      plan_name: plan?.name || null,
      status: 'approved',
      submitted_by: 'Super Admin',
      subscription_start: new Date().toISOString().slice(0, 10),
      subscription_end: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    });
    await supabase.from('activity_log').insert({ action: `Vendor created: ${createForm.shop_name}`, actor: 'Super Admin' });
    show(`Vendor ${createForm.shop_name} created`);
    setCreateMode(false);
    setCreateForm({ owner_name: '', phone: '', email: '', shop_name: '', address: '', zip_code: '', plan_id: '' });
    load();
  };

  const filtered = vendors.filter((v) => {
    const matchSearch = v.shop_name.toLowerCase().includes(search.toLowerCase()) || v.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || v.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle={`${vendors.length} total vendors`}
        action={<Button onClick={() => setCreateMode(true)}><Plus size={16} /> Create Vendor</Button>}
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none transition-all"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none cursor-pointer">
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending_approval">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {filtered.map((v) => (
          <div key={v.id} className="card p-5 hover-lift cursor-pointer group" onClick={() => { setSelected(v); setRejectMode(false); }}>
            <div className="flex items-start gap-3">
              {v.logo_url ? (
                <img src={v.logo_url} alt={v.shop_name} className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-surface-2 flex items-center justify-center">
                  <Store size={22} className="text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{v.shop_name}</p>
                <p className="text-xs text-muted truncate">{v.owner_name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant={v.status === 'approved' ? 'success' : v.status === 'pending_approval' ? 'warning' : 'error'}>
                    {v.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-muted">
              <div className="flex items-center gap-2"><Phone size={12} /> {v.phone}</div>
              <div className="flex items-center gap-2"><MapPin size={12} /> {v.zip_code}</div>
              <div className="flex items-center gap-2"><CreditCard size={12} /> {v.plan_name || 'No plan'}</div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
              View details <ChevronRight size={12} />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon={<Store size={28} />} title="No vendors found" subtitle="Try adjusting your search" />}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Vendor Details" size="lg">
        {selected && !rejectMode && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {selected.logo_url ? (
                <img src={selected.logo_url} alt={selected.shop_name} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center">
                  <Store size={32} className="text-muted" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{selected.shop_name}</h3>
                <p className="text-muted">{selected.owner_name}</p>
                <Badge variant={selected.status === 'approved' ? 'success' : selected.status === 'pending_approval' ? 'warning' : 'error'}>
                  {selected.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem icon={Phone} label="Phone" value={selected.phone} />
              <DetailItem icon={Mail} label="Email" value={selected.email || '—'} />
              <DetailItem icon={MapPin} label="Address" value={selected.address} />
              <DetailItem icon={MapPin} label="ZIP" value={selected.zip_code} />
              <DetailItem icon={CreditCard} label="Plan" value={selected.plan_name || '—'} />
              <DetailItem icon={Calendar} label="Submitted" value={new Date(selected.created_at).toLocaleDateString()} />
            </div>
            {selected.rejection_note && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400 font-semibold mb-1">Rejection Note</p>
                <p className="text-sm">{selected.rejection_note}</p>
              </div>
            )}
            {selected.status === 'pending_approval' && (
              <div className="flex gap-3">
                <Button variant="primary" className="flex-1" onClick={() => approve(selected)}>
                  <CheckCircle2 size={16} /> Approve Vendor
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => setRejectMode(true)}>
                  <XCircle size={16} /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
        {selected && rejectMode && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <p className="font-semibold">Reject {selected.shop_name}?</p>
            </div>
            <Input label="Rejection Note" value={note} onChange={setNote} placeholder="Reason for rejection..." />
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1" onClick={reject}>Confirm Rejection</Button>
              <Button variant="secondary" onClick={() => setRejectMode(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={createMode} onClose={() => setCreateMode(false)} title="Create New Vendor" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Owner Name" value={createForm.owner_name} onChange={(v) => setCreateForm({ ...createForm, owner_name: v })} required />
            <Input label="Phone" value={createForm.phone} onChange={(v) => setCreateForm({ ...createForm, phone: v })} required />
            <Input label="Email" type="email" value={createForm.email} onChange={(v) => setCreateForm({ ...createForm, email: v })} />
            <Input label="Shop Name" value={createForm.shop_name} onChange={(v) => setCreateForm({ ...createForm, shop_name: v })} required />
            <Input label="Address" value={createForm.address} onChange={(v) => setCreateForm({ ...createForm, address: v })} required />
            <Input label="ZIP Code" value={createForm.zip_code} onChange={(v) => setCreateForm({ ...createForm, zip_code: v })} required />
          </div>
          <Select label="Subscription Plan" value={createForm.plan_id} onChange={(v) => setCreateForm({ ...createForm, plan_id: v })} options={plans.map((p) => ({ value: p.id, label: `${p.name} — ₹${p.price}` }))} />
          <Button className="w-full" onClick={createVendor}><Plus size={16} /> Create Vendor</Button>
        </div>
      </Modal>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-surface-2">
      <div className="flex items-center gap-2 text-xs text-muted mb-1">
        <Icon size={12} /> {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function PlansTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', validity_days: '30', max_items: '10', max_clients: '50' });

  const load = async () => {
    const { data } = await supabase.from('subscription_plans').select('*').order('price');
    setPlans(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    await supabase.from('subscription_plans').insert({
      name: form.name,
      price: Number(form.price),
      validity_days: Number(form.validity_days),
      max_items: Number(form.max_items),
      max_clients: Number(form.max_clients),
    });
    await supabase.from('activity_log').insert({ action: `New plan created: ${form.name}`, actor: 'Super Admin' });
    show(`Plan ${form.name} created`);
    setModal(false);
    setForm({ name: '', price: '', validity_days: '30', max_items: '10', max_clients: '50' });
    load();
  };

  const toggle = async (p: Plan) => {
    await supabase.from('subscription_plans').update({ status: p.status === 'active' ? 'inactive' : 'active' }).eq('id', p.id);
    load();
    show(`Plan ${p.status === 'active' ? 'deactivated' : 'activated'}`, 'info');
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        subtitle={`${plans.length} plans configured`}
        action={<Button onClick={() => setModal(true)}><Plus size={16} /> New Plan</Button>}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {plans.map((p) => (
          <SpotlightCard key={p.id} className="card p-6 hover-lift group relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">{p.name}</p>
                <p className="text-4xl font-bold mt-2">₹{p.price}</p>
                <p className="text-xs text-muted">/{p.validity_days} days</p>
              </div>
              <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status}</Badge>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Max Items</span>
                <span className="font-semibold">{p.max_items}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Max Clients</span>
                <span className="font-semibold">{p.max_clients}</span>
              </div>
            </div>
            <button onClick={() => toggle(p)} className="w-full mt-4 py-2 rounded-lg bg-surface-2 text-sm font-semibold hover:bg-border/30 transition-colors">
              {p.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </SpotlightCard>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create Plan">
        <div className="space-y-4">
          <Input label="Plan Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Premium" required />
          <Input label="Price (₹)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Validity (days)" type="number" value={form.validity_days} onChange={(v) => setForm({ ...form, validity_days: v })} />
            <Input label="Max Items" type="number" value={form.max_items} onChange={(v) => setForm({ ...form, max_items: v })} />
            <Input label="Max Clients" type="number" value={form.max_clients} onChange={(v) => setForm({ ...form, max_clients: v })} />
          </div>
          <Button className="w-full" onClick={save}>Create Plan</Button>
        </div>
      </Modal>
    </div>
  );
}

function InventoryTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Pizza', image_url: '', base_price: '', quantity: '', description: '' });
  const [editImage, setEditImage] = useState<MasterItem | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  const categories = ['Pizza', 'Burger', 'Noodles', 'Indian', 'Salad', 'Dessert', 'Drinks'];

  const load = async () => {
    const { data } = await supabase.from('master_inventory').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    await supabase.from('master_inventory').insert({
      name: form.name,
      category: form.category,
      image_url: form.image_url || null,
      base_price: Number(form.base_price),
      quantity: Number(form.quantity),
      description: form.description || null,
    });
    show(`Item ${form.name} added`);
    setModal(false);
    setForm({ name: '', category: 'Pizza', image_url: '', base_price: '', quantity: '', description: '' });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('master_inventory').delete().eq('id', id);
    show('Item removed', 'info');
    load();
  };

  const saveImage = async () => {
    if (!editImage) return;
    await supabase.from('master_inventory').update({ image_url: imageUrl || null }).eq('id', editImage.id);
    show('Image updated');
    setEditImage(null);
    setImageUrl('');
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Master Inventory"
        subtitle={`${items.length} items in catalog`}
        action={<Button onClick={() => setModal(true)}><Plus size={16} /> Add Item</Button>}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
        {items.map((item) => (
          <div key={item.id} className="card overflow-hidden hover-lift group">
            <div className="relative aspect-square overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                  <Package size={32} className="text-muted" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant="accent">{item.category}</Badge>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => { setEditImage(item); setImageUrl(item.image_url || ''); }}
                  className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <Edit2 size={14} /> Edit Image
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="font-bold">{item.name}</p>
              <p className="text-xs text-muted line-clamp-1">{item.description || 'No description'}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-accent">₹{item.base_price}</span>
                <span className="text-xs text-muted">Stock: {item.quantity}</span>
              </div>
              <button onClick={() => remove(item.id)} className="w-full mt-3 py-1.5 rounded-lg bg-surface-2 text-xs text-muted hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center gap-1.5">
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Master Item">
        <div className="space-y-4">
          <Input label="Item Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ value: c, label: c }))} />
          <Input label="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} placeholder="https://..." />
          {form.image_url && <img src={form.image_url} alt="Preview" className="w-24 h-24 rounded-xl object-cover" />}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Base Price (₹)" type="number" value={form.base_price} onChange={(v) => setForm({ ...form, base_price: v })} required />
            <Input label="Quantity" type="number" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} required />
          </div>
          <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <Button className="w-full" onClick={save}>Add Item</Button>
        </div>
      </Modal>

      <Modal open={!!editImage} onClose={() => setEditImage(null)} title="Edit Item Image" size="md">
        {editImage && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {editImage.image_url ? (
                <img src={editImage.image_url} alt={editImage.name} className="w-24 h-24 rounded-xl object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-surface-2 flex items-center justify-center">
                  <Package size={28} className="text-muted" />
                </div>
              )}
              <div>
                <p className="font-bold">{editImage.name}</p>
                <p className="text-xs text-muted">{editImage.category} · ₹{editImage.base_price}</p>
              </div>
            </div>
            <Input label="New Image URL" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
            {imageUrl && <img src={imageUrl} alt="Preview" className="w-32 h-32 rounded-xl object-cover" />}
            <Button className="w-full" onClick={saveImage}>Save Image</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function OrdersTab({ show: _show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  void _show;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Pending Orders" subtitle={`${orders.length} awaiting action`} />
      {orders.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={28} />} title="No pending orders" subtitle="All orders have been processed" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr className="text-left text-xs text-muted uppercase tracking-wider">
                <th className="px-5 py-3 font-semibold">Item</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">ZIP</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-surface-2/50 transition-colors group">
                  <td className="px-5 py-3 font-medium">{o.item_name}</td>
                  <td className="px-5 py-3 text-muted">{o.client_name}</td>
                  <td className="px-5 py-3 text-muted">{o.client_zip}</td>
                  <td className="px-5 py-3 font-bold">₹{o.price}</td>
                  <td className="px-5 py-3">
                    <Badge variant="warning">{o.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GuidesTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'vendor', keywords: '' });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('guides').select('*').order('uploaded_at', { ascending: false });
    setGuides(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { show('Please select a PDF file', 'error'); return; }
    if (file.size > 2 * 1024 * 1024) { show('File too large (max 2MB)', 'error'); return; }
    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => setPdfData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.title) { show('Title is required', 'error'); return; }
    setUploading(true);
    await supabase.from('guides').insert({
      title: form.title,
      category: form.category,
      keywords: form.keywords,
      allowed_roles: ['vendor', 'sub_admin'],
      file_data: pdfData || null,
      file_name: pdfFile?.name || null,
    });
    setUploading(false);
    show('Guide uploaded successfully');
    setModal(false);
    setForm({ title: '', category: 'vendor', keywords: '' });
    setPdfFile(null);
    setPdfData('');
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('guides').delete().eq('id', id);
    show('Guide deleted', 'info');
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Guides & Documents"
        subtitle={`${guides.length} documents`}
        action={<Button onClick={() => setModal(true)}><FileUp size={16} /> Upload PDF</Button>}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {guides.map((g) => (
          <div key={g.id} className="card p-5 hover-lift group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText size={18} className="text-accent" />
              </div>
              <button onClick={() => remove(g.id)} className="text-muted hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="font-bold">{g.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default">{g.category}</Badge>
              {g.file_name && <span className="text-xs text-muted flex items-center gap-1"><FileText size={10} /> PDF</span>}
            </div>
            {g.keywords && <p className="text-xs text-muted mt-2">{g.keywords}</p>}
            {g.file_data && (
              <a href={g.file_data} download={g.file_name || 'guide.pdf'} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-2 transition-colors">
                <FileUp size={12} /> Download PDF
              </a>
            )}
          </div>
        ))}
        {guides.length === 0 && <EmptyState icon={<FileText size={28} />} title="No guides yet" subtitle="Upload your first PDF guide" />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Upload PDF Guide" size="lg">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={[{ value: 'vendor', label: 'Vendor' }, { value: 'admin', label: 'Admin' }, { value: 'client', label: 'Client' }]} />
          <Input label="Keywords" value={form.keywords} onChange={(v) => setForm({ ...form, keywords: v })} placeholder="comma, separated, tags" />
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">PDF File</label>
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white file:font-semibold file:cursor-pointer focus:border-accent outline-none transition-all"
              />
            </div>
            {pdfFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                <FileText size={14} /> {pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)
              </div>
            )}
            <p className="text-xs text-muted mt-1">Max 2MB. PDF format only.</p>
          </div>
          <Button className="w-full" onClick={save} disabled={uploading}>
            {uploading ? <Spinner /> : <><Upload size={16} /> Upload Guide</>}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SubAdminsTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [admins, setAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewMode, setViewMode] = useState<SubAdmin | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const load = async () => {
    const { data } = await supabase.from('sub_admins').select('*').order('created_at', { ascending: false });
    setAdmins(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    await supabase.from('sub_admins').insert({
      name: form.name,
      email: form.email,
      password: form.password,
      force_change: true,
    });
    await supabase.from('activity_log').insert({ action: `Sub-admin created: ${form.name}`, actor: 'Super Admin' });
    show(`Sub-admin ${form.name} added`);
    setModal(false);
    setForm({ name: '', email: '', password: '' });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('sub_admins').delete().eq('id', id);
    show('Sub-admin removed', 'info');
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Sub-Admins"
        subtitle={`${admins.length} team members`}
        action={<Button onClick={() => { setViewMode(null); setModal(true); }}><Plus size={16} /> Add Sub-Admin</Button>}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {admins.map((a) => (
          <div key={a.id} className="card p-5 hover-lift group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                <Users size={20} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{a.name}</p>
                <p className="text-xs text-muted truncate">{a.email}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {a.force_change ? <Badge variant="warning">Password change required</Badge> : <Badge variant="success">Active</Badge>}
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode(a)} className="p-2 rounded-lg bg-surface-2 text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="View details">
                  <Eye size={14} />
                </button>
                <button onClick={() => remove(a.id)} className="p-2 rounded-lg bg-surface-2 text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View modal */}
      <Modal open={!!viewMode} onClose={() => setViewMode(null)} title="Sub-Admin Details" size="md">
        {viewMode && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                <Users size={28} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{viewMode.name}</h3>
                <p className="text-muted text-sm">{viewMode.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-2">
                <p className="text-xs text-muted mb-1">Status</p>
                <p className="text-sm font-medium">{viewMode.force_change ? 'Password change required' : 'Active'}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-2">
                <p className="text-xs text-muted mb-1">Created</p>
                <p className="text-sm font-medium">{new Date(viewMode.created_at).toLocaleDateString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-2">
                <p className="text-xs text-muted mb-1">Last Active</p>
                <p className="text-sm font-medium">{viewMode.last_active ? new Date(viewMode.last_active).toLocaleString() : 'Never'}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-2">
                <p className="text-xs text-muted mb-1">Password</p>
                <p className="text-sm font-medium font-mono">{'•'.repeat(viewMode.password.length)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Sub-Admin">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Input label="Temporary Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
          <Button className="w-full" onClick={save}>Add Sub-Admin</Button>
        </div>
      </Modal>
    </div>
  );
}

function ActivityTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([]);

  const load = async () => {
    const [{ data: l }, { data: v }] = await Promise.all([
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('vendors').select('*').eq('status', 'pending_approval').order('created_at', { ascending: false }),
    ]);
    setLogs(l || []);
    setPendingVendors(v || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approveVendor = async (v: Vendor) => {
    await supabase.from('vendors').update({ status: 'approved', subscription_start: new Date().toISOString().slice(0, 10), subscription_end: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) }).eq('id', v.id);
    await supabase.from('activity_log').insert({ action: `Vendor approved: ${v.shop_name}`, actor: 'Super Admin' });
    show(`Approved ${v.shop_name}`);
    load();
  };

  const rejectVendor = async (v: Vendor) => {
    await supabase.from('vendors').update({ status: 'rejected', rejection_note: 'Rejected from activity log' }).eq('id', v.id);
    await supabase.from('activity_log').insert({ action: `Vendor rejected: ${v.shop_name}`, actor: 'Super Admin' });
    show(`Rejected ${v.shop_name}`, 'error');
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Activity Log" subtitle={`${logs.length} recent actions`} />

      {pendingVendors.length > 0 && (
        <div className="card p-6 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-amber-400" />
            <h3 className="font-bold text-amber-400">Pending Vendor Approvals</h3>
            <Badge variant="warning">{pendingVendors.length}</Badge>
          </div>
          <div className="space-y-3">
            {pendingVendors.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 hover:bg-border/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Store size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{v.shop_name}</p>
                    <p className="text-xs text-muted">{v.owner_name} · {v.zip_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="primary" onClick={() => approveVendor(v)}>
                    <CheckCircle2 size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => rejectVendor(v)}>
                    <XCircle size={14} /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <ActivityIcon size={16} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{l.action}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted">{l.actor}</p>
                  <span className="text-xs text-muted">·</span>
                  <p className="text-xs text-muted">{new Date(l.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [logo, setLogo] = useState('');
  const [qr, setQr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('*').maybeSingle();
      setSettings(data);
      setLogo(data?.logo_url || '');
      setQr(data?.qr_url || '');
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (settings) {
      await supabase.from('settings').update({ logo_url: logo, qr_url: qr, updated_at: new Date().toISOString() }).eq('id', settings.id);
    } else {
      await supabase.from('settings').insert({ logo_url: logo, qr_url: qr });
    }
    show('Settings saved');
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Platform Settings" subtitle="Logo and QR code configuration" />
      <div className="card p-6 max-w-xl space-y-5">
        <div>
          <Input label="Logo URL" value={logo} onChange={setLogo} placeholder="https://..." />
          {logo && <img src={logo} alt="Logo preview" className="w-20 h-20 rounded-xl object-cover mt-3" />}
        </div>
        <div>
          <Input label="QR Code URL" value={qr} onChange={setQr} placeholder="https://..." />
          {qr && <img src={qr} alt="QR preview" className="w-24 h-24 rounded-xl object-cover mt-3" />}
        </div>
        <Button onClick={save}>Save Settings</Button>
      </div>
    </div>
  );
}
