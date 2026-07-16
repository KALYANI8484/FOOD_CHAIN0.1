import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Store, Plus, Users, Clock, CheckCircle2,
  ChevronRight, MapPin, Phone, CreditCard, Activity as ActivityIcon, AlertCircle,
  FileText, ShoppingBag, UserPlus,
} from 'lucide-react';
import { supabase, type Vendor, type Plan, type Activity } from '../lib/supabase';
import { Button, Badge, Input, Select, useToast, Toast, Spinner, EmptyState, SpotlightCard } from './ui';

type Tab = 'dashboard' | 'create_vendor' | 'pending' | 'guides' | 'activity';

export function SubAdmin({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const { toast, show } = useToast();

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create_vendor', label: 'Create Vendor', icon: UserPlus },
    { id: 'pending', label: 'Action Required', icon: AlertCircle },
    { id: 'guides', label: 'Guides', icon: FileText },
    { id: 'activity', label: 'Activity', icon: ActivityIcon },
  ];

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="w-64 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">MealMesh</p>
            <p className="text-xs text-muted">Sub-Admin</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                tab === item.id ? 'bg-blue-500/10 text-blue-400' : 'text-muted hover:text-white hover:bg-surface-2'
              }`}
            >
              {tab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />}
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
          {tab === 'dashboard' && <SubDashboard onTab={setTab} />}
          {tab === 'create_vendor' && <CreateVendor show={show} />}
          {tab === 'pending' && <PendingVendors show={show} />}
          {tab === 'guides' && <SubGuides />}
          {tab === 'activity' && <SubActivity />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function SubDashboard({ onTab }: { onTab: (t: Tab) => void }) {
  const [stats, setStats] = useState({ vendors: 0, pending: 0, approved: 0, orders: 0 });
  const [recent, setRecent] = useState<Vendor[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: v }, { data: o }, { data: a }] = await Promise.all([
        supabase.from('vendors').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(6),
      ]);
      const vendors = v || [];
      setStats({
        vendors: vendors.length,
        pending: vendors.filter((x) => x.status === 'pending_approval').length,
        approved: vendors.filter((x) => x.status === 'approved').length,
        orders: o?.length || 0,
      });
      setRecent(vendors.slice(0, 4));
      setActivity(a || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const kpis = [
    { label: 'Vendors Created', value: stats.vendors, icon: Store, color: 'text-blue-400' },
    { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-amber-400' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-accent' },
  ];

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold">Sub-Admin Dashboard</h1>
        <p className="text-muted mt-1">Manage vendors and track platform activity</p>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Recent Vendors</h3>
            <button onClick={() => onTab('create_vendor')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 group">
              Create New <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="space-y-3">
            {recent.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 hover:bg-border/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center">
                    <Store size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{v.shop_name}</p>
                    <p className="text-xs text-muted">{v.owner_name}</p>
                  </div>
                </div>
                <Badge variant={v.status === 'approved' ? 'success' : v.status === 'pending_approval' ? 'warning' : 'error'}>
                  {v.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 animate-fade-in-up delay-300">
          <h3 className="font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <ActivityIcon size={14} className="text-blue-400" />
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

      {stats.pending > 0 && (
        <div className="mt-6 card p-6 bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20 animate-fade-in-up delay-500">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-amber-400" />
            <div className="flex-1">
              <p className="font-bold text-amber-400">Action Required</p>
              <p className="text-sm text-muted">{stats.pending} vendor(s) awaiting super admin approval</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onTab('pending')}>Review</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateVendor({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    owner_name: '', phone: '', email: '', shop_name: '', address: '', zip_code: '', plan_id: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('subscription_plans').select('*').eq('status', 'active');
      setPlans(data || []);
      if (data && data.length > 0) setForm((f) => ({ ...f, plan_id: data[0].id }));
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const plan = plans.find((p) => p.id === form.plan_id);
    const { error } = await supabase.from('vendors').insert({
      owner_name: form.owner_name,
      phone: form.phone,
      email: form.email || null,
      shop_name: form.shop_name,
      address: form.address,
      zip_code: form.zip_code,
      plan_id: form.plan_id || null,
      plan_name: plan?.name || null,
      status: 'pending_approval',
      submitted_by: 'Sub-Admin',
    });
    if (error) { show('Failed to create vendor', 'error'); return; }
    await supabase.from('activity_log').insert({ action: `Vendor created: ${form.shop_name}`, actor: 'Sub-Admin' });
    show('Vendor submitted for approval');
    setForm({ owner_name: '', phone: '', email: '', shop_name: '', address: '', zip_code: '', plan_id: plans[0]?.id || '' });
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold">Create Vendor</h1>
        <p className="text-muted mt-1">Submit a new vendor for super admin approval</p>
      </div>
      <div className="card p-8 max-w-2xl animate-fade-in-up delay-100">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Owner Name" value={form.owner_name} onChange={(v) => setForm({ ...form, owner_name: v })} required />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Shop Name" value={form.shop_name} onChange={(v) => setForm({ ...form, shop_name: v })} required />
          <Input label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
          <Input label="ZIP Code" value={form.zip_code} onChange={(v) => setForm({ ...form, zip_code: v })} required />
          <div className="sm:col-span-2">
            <Select label="Subscription Plan" value={form.plan_id} onChange={(v) => setForm({ ...form, plan_id: v })} options={plans.map((p) => ({ value: p.id, label: `${p.name} — ₹${p.price}` }))} />
          </div>
        </div>
        <div className="mt-6">
          <Button className="w-full" onClick={save}>
            <Plus size={16} /> Submit for Approval
          </Button>
        </div>
      </div>
    </div>
  );
}

function PendingVendors({ show: _show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  void _show;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('vendors').select('*').eq('status', 'pending_approval').order('created_at', { ascending: false });
    setVendors(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold">Action Required</h1>
        <p className="text-muted mt-1">{vendors.length} vendor(s) awaiting super admin approval</p>
      </div>
      {vendors.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={28} />} title="All caught up!" subtitle="No pending approvals" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {vendors.map((v) => (
            <div key={v.id} className="card p-5 hover-lift">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Clock size={22} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{v.shop_name}</p>
                  <p className="text-xs text-muted">{v.owner_name}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted">
                <div className="flex items-center gap-2"><Phone size={12} /> {v.phone}</div>
                <div className="flex items-center gap-2"><MapPin size={12} /> {v.zip_code}</div>
                <div className="flex items-center gap-2"><CreditCard size={12} /> {v.plan_name || 'No plan'}</div>
              </div>
              <div className="mt-4">
                <Badge variant="warning">Awaiting super admin</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubGuides() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('guides').select('*').order('uploaded_at', { ascending: false });
      setGuides(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold">Guides</h1>
        <p className="text-muted mt-1">Documents and tutorials for sub-admins</p>
      </div>
      {guides.length === 0 ? (
        <EmptyState icon={<FileText size={28} />} title="No guides available" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {guides.map((g) => (
            <div key={g.id} className="card p-5 hover-lift group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText size={18} className="text-blue-400" />
              </div>
              <p className="font-bold">{g.title}</p>
              <Badge variant="default">{g.category}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubActivity() {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(30);
      setLogs(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-muted mt-1">Your recent actions</p>
      </div>
      <div className="card p-6">
        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <ActivityIcon size={16} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{l.action}</p>
                <p className="text-xs text-muted">{l.actor} · {new Date(l.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
