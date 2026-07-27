import { useEffect, useState } from 'react';
import {
  Store, Package, CreditCard, FileText, Users,
  CheckCircle2, Search, Plus, Minus, Check, Trash2, Upload, AlertCircle,
  Activity as ActivityIcon, Eye, Edit2, FileUp, Menu, X, Phone, Mail, MapPin, DollarSign, ShoppingBag, ChevronLeft, Clock
} from 'lucide-react';
import { supabase, type Vendor, type Plan, type MasterItem, type SubInventory, type Order, type Activity, type SubAdmin, type UpgradeRequest, type VendorItem } from '../lib/supabase';
import { Button, Badge, Modal, Input, Select, useToast, Toast, Spinner, EmptyState, SpotlightCard, Drawer } from './ui';
import { VendorForm } from './VendorForm';

type Tab = 'vendors' | 'approvals' | 'plans' | 'inventory' | 'guides' | 'sub_admins' | 'pending_orders';

export function SuperAdmin({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>('approvals');
  const { toast, show } = useToast();

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: 'approvals', label: 'Team Approvals', icon: CheckCircle2 },
    { id: 'vendors', label: 'Vendor Database', icon: Store },
    { id: 'plans', label: 'Pricing Plans', icon: CreditCard },
    { id: 'inventory', label: 'Master Inventory', icon: Package },
    { id: 'guides', label: 'Guide Documents', icon: FileText },
    { id: 'sub_admins', label: 'Sub-Admins', icon: Users },
    { id: 'pending_orders', label: 'Pending Orders', icon: Clock },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg flex text-text relative">
      {/* Mobile Header Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
          <p className="font-bold text-sm truncate text-text">VIKRAMS ADS</p>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-text">
           {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`w-64 border-r border-border bg-surface flex flex-col h-screen fixed lg:sticky top-0 z-40 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-4 border-b border-border hidden lg:flex items-center gap-3 cursor-pointer group" onClick={onExit}>
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">VIKRAMS ADS</p>
            <p className="text-xs text-muted">Super Admin Portal</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-14 lg:mt-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                tab === item.id
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-muted hover:text-text hover:bg-surface-2'
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-bg relative z-10 pt-14 lg:pt-0">
        <div className="p-8 max-w-7xl mx-auto">
          {tab === 'vendors' && <VendorsTab show={show} />}
          {tab === 'approvals' && <ApprovalsTab show={show} />}
          {tab === 'plans' && <PlansTab show={show} />}
          {tab === 'inventory' && <InventoryTab show={show} />}
          {tab === 'guides' && <GuidesTab show={show} />}
          {tab === 'sub_admins' && <SubAdminsTab show={show} />}
          {tab === 'pending_orders' && <PendingOrdersTab show={show} />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// 1. Dashboard Module Tab
function DashboardTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<Activity[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: v }, { data: o }, { data: a }, { data: p }] = await Promise.all([
      supabase.from('vendors').select('*'),
      fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'orders', action: 'select' }) }).then(r => r.json()),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('subscription_plans').select('*')
    ]);
    setVendors(v || []);
    setOrders(o?.data || []);
    setLogs(a || []);
    setPlans(p || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleManualAssign = async (orderId: string, vendorId: string) => {
    const targetVendor = vendors.find(v => v.id === vendorId);
    if (!targetVendor) return;

    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'orders', action: 'update', filters: { _id: orderId },
        data: { vendor_id: vendorId, status: 'preparing', accepted_at: new Date().toISOString() }
      })
    });

    await supabase.from('activity_log').insert({
      action: `Order manually assigned to ${targetVendor.shop_name}`,
      actor: 'Super Admin'
    });

    show(`Order assigned successfully to ${targetVendor.shop_name}`);
    load();
  };

  if (loading) return <Spinner />;

  // Calculating KPIs
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(x => x.status === 'approved').length;
  const premiumVendors = vendors.filter(x => x.status === 'approved' && x.plan_name !== 'Free').length;
  
  // Calculate total monthly revenue from registered vendors subscriptions
  const totalRevenue = vendors.reduce((sum, v) => {
    if (v.status !== 'approved') return sum;
    const plan = plans.find(p => p.id === v.plan_id);
    return sum + (plan ? plan.price : 0);
  }, 0);

  const liveOrdersToday = orders.filter(o => {
    const today = new Date().toISOString().slice(0, 10);
    return o.created_at.startsWith(today);
  }).length;

  const pendingReviewOrders = orders.filter(o => o.status === 'System Denied' || o.status === 'pending');

  const kpis = [
    { label: 'Total & Active Vendors', value: `${totalVendors} / ${activeVendors}`, desc: 'Registered vs Operating', icon: Store, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: 'Active Subscriptions', value: premiumVendors, desc: 'Vendors on Premium plans', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Monthly Subscription Rev', value: `₹${totalRevenue.toLocaleString()}`, desc: 'Est monthly subscription revenue', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Live Orders Today', value: liveOrdersToday, desc: `${pendingReviewOrders.length} orders pending review`, icon: ShoppingBag, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Overview Dashboard" subtitle="Real-time operations status of VIKRAMS ADS" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
        {kpis.map((k) => (
          <SpotlightCard key={k.label} className="card p-6 bg-surface border border-border hover-lift shadow-sm">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${k.bg} ${k.color}`}>
              <k.icon size={24} />
            </div>
            <p className="text-3xl font-extrabold mt-6 text-text">{k.value}</p>
            <p className="text-sm text-text font-bold mt-1">{k.label}</p>
            <p className="text-xs text-muted mt-0.5">{k.desc}</p>
          </SpotlightCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Revenue Analytics Line Graph (SVG) */}
        <div className="lg:col-span-2 card p-6 bg-surface border border-border">
          <h3 className="font-extrabold text-base mb-6 uppercase tracking-wider text-muted flex items-center justify-between">
            <span>Subscription Earnings (6 Months)</span>
            <span className="text-xs font-bold text-green-600 bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded-full">+12% Growth</span>
          </h3>
          <div className="h-64 w-full flex items-end relative pt-4">
            {/* Draw a simple responsive line chart using SVG */}
            <svg className="w-full h-full text-accent" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="600" y2="50" stroke="var(--border)" strokeDasharray="5,5" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="var(--border)" strokeDasharray="5,5" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="var(--border)" strokeDasharray="5,5" strokeWidth="1" />
              
              {/* Path area */}
              <path d="M 0 170 Q 120 140 240 130 T 480 80 T 600 40 L 600 200 L 0 200 Z" fill="url(#chartGrad)" />
              {/* Graph Line */}
              <path d="M 0 170 Q 120 140 240 130 T 480 80 T 600 40" fill="none" stroke="var(--accent)" strokeWidth="3" />
              
              {/* Data points */}
              <circle cx="0" cy="170" r="5" fill="var(--accent)" />
              <circle cx="120" cy="145" r="5" fill="var(--accent)" />
              <circle cx="240" cy="130" r="5" fill="var(--accent)" />
              <circle cx="360" cy="100" r="5" fill="var(--accent)" />
              <circle cx="480" cy="80" r="5" fill="var(--accent)" />
              <circle cx="600" cy="40" r="5" fill="var(--accent)" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-muted font-bold uppercase tracking-wide pt-2 border-t border-border mt-2">
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul (Current)</span>
            </div>
          </div>
        </div>

        {/* Global Content Settings & Logs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 bg-surface border border-border">
            <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted">Vendor Activity Log</h3>
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {logs.map((l) => (
                <div key={l.id} className="flex gap-3 text-xs leading-normal">
                  <div className="w-6 h-6 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
                    <ActivityIcon size={12} className="text-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-text">{l.action}</p>
                    <p className="text-[10px] text-muted mt-0.5">{l.actor} · {new Date(l.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Pending Orders Watchlist */}
      <div className="card p-6 bg-surface border border-border">
        <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted">Pending Orders Watchlist</h3>
        {pendingReviewOrders.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={24} />} title="No orders pending review" subtitle="All incoming client orders have been accepted by active vendors" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-2 text-xs font-bold text-muted uppercase tracking-wider">
                  <th className="px-4 py-3">Order info</th>
                  <th className="px-4 py-3">Delivery address</th>
                  <th className="px-4 py-3">Proximity / Zip</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Timeout Status</th>
                  <th className="px-4 py-3 text-right">Assign Vendor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pendingReviewOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-text">{o.item_name}</p>
                      <p className="text-[10px] text-muted mt-0.5">#{o.id.slice(0, 8).toUpperCase()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.client_name}</p>
                      <p className="text-xs text-muted truncate max-w-[200px] mt-0.5">{o.client_address}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span>{o.distance_km || '0.8'} km · {o.client_zip}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-accent">₹{o.price}</td>
                    <td className="px-4 py-3">
                      <Badge variant={o.status === 'System Denied' ? 'error' : 'warning'}>
                        {o.status === 'System Denied' ? 'Timeout Standby' : 'Broadcasting'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Dropdown to manually assign vendor in same Zip */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleManualAssign(o.id, e.target.value);
                          }
                        }}
                        defaultValue=""
                        className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs font-bold focus:border-accent outline-none cursor-pointer"
                      >
                        <option value="" disabled>Choose vendor...</option>
                        {vendors.filter(v => v.status === 'approved' && v.zip_code === o.client_zip).map(v => (
                          <option key={v.id} value={v.id}>{v.shop_name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// 2. Vendors Management Module Tab
function VendorsTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createMode, setCreateMode] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [selectedAddon, setSelectedAddon] = useState('');
  const [viewInventory, setViewInventory] = useState<VendorItem[]>([]);
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState<Vendor | null>(null);
  const [deleteInputName, setDeleteInputName] = useState('');

  const getVendorPlan = (vendor: Vendor | null) => vendor ? plans.find((p) => p.id === vendor.plan_id) : undefined;
  const getVendorItemLimit = (vendor: Vendor | null) => {
    const plan = getVendorPlan(vendor);
    if (!plan) return 5;
    if (plan.max_items <= 0 || plan.name?.toLowerCase().includes('premium')) return Infinity;
    return plan.max_items;
  };
  const getVendorLimitLabel = (vendor: Vendor | null) => {
    const limit = getVendorItemLimit(vendor);
    return limit === Infinity ? 'Unlimited' : String(limit);
  };
  const getVendorRemainingLabel = (vendor: Vendor | null, activeCount: number) => {
    const limit = getVendorItemLimit(vendor);
    return limit === Infinity ? 'Unlimited' : String(Math.max(0, limit - activeCount));
  };

  // Editing inventory sub-module details
  const [editingInventory, setEditingInventory] = useState<VendorItem[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [imgUploadingId, setImgUploadingId] = useState<string | null>(null);

  const currentPlan = viewVendor ? plans.find((p) => p.id === viewVendor.plan_id) : undefined;
  const inventoryLimit = currentPlan?.max_items ?? 5;

  const load = async () => {
    const [{ data: v }, { data: p }, { data: m }, { data: a }] = await Promise.all([
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('*'),
      supabase.from('master_inventory').select('*'),
      supabase.from('addons').select('*')
    ]);
    setVendors(v || []);
    setPlans(p || []);
    setMasterItems(m || []);
    setAddons(a || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateSubmit = async (formData: any) => {
    const plan = plans.find((p) => p.id === formData.plan_id);
    const validityDays = plan?.validity_days || 30;

    await supabase.from('vendors').insert({
      owner_name: formData.owner_name,
      phone: formData.phone,
      email: formData.email || null,
      shop_name: formData.shop_name,
      address: formData.address,
      zip_code: formData.zip_code,
      birthdate: formData.birthdate || null,
      password: formData.password || null,
      plan_id: formData.plan_id || null,
      plan_name: plan?.name || null,
      logo_url: formData.logo_url || null,
      qr_url: formData.qr_url || null,
      status: 'approved',
      submitted_by: 'Super Admin',
      subscription_start: new Date().toISOString().slice(0, 10),
      subscription_end: new Date(Date.now() + validityDays * 86400000).toISOString().slice(0, 10),
    });

    await supabase.from('activity_log').insert({
      action: `Vendor created directly: ${formData.shop_name}`,
      actor: 'Super Admin'
    });

    show(`Vendor ${formData.shop_name} created successfully!`);
    setCreateMode(false);
    load();
  };

  const handleEditSubmit = async (formData: any) => {
    if (!editVendor) return;
    const plan = plans.find((p) => p.id === formData.plan_id);
    const validityDays = plan?.validity_days || 30;

    await supabase.from('vendors').update({
      owner_name: formData.owner_name,
      phone: formData.phone,
      email: formData.email || null,
      shop_name: formData.shop_name,
      address: formData.address,
      zip_code: formData.zip_code,
      birthdate: formData.birthdate || editVendor.birthdate,
      password: formData.password ? formData.password : editVendor.password,
      plan_id: formData.plan_id || null,
      plan_name: plan?.name || null,
      logo_url: formData.logo_url || null,
      qr_url: formData.qr_url || null,
      subscription_start: editVendor.plan_id !== formData.plan_id ? new Date().toISOString().slice(0, 10) : editVendor.subscription_start,
      subscription_end: editVendor.plan_id !== formData.plan_id ? new Date(Date.now() + validityDays * 86400000).toISOString().slice(0, 10) : editVendor.subscription_end,
    }).eq('id', editVendor.id);

    await supabase.from('activity_log').insert({
      action: `Vendor details edited: ${formData.shop_name}`,
      actor: 'Super Admin'
    });

    show('Vendor updated successfully');
    setEditVendor(null);
    load();
  };

  const handleApplyAddon = async () => {
    if (!editVendor || !selectedAddon) return;
    const addon = addons.find(a => a.id === selectedAddon);
    if (!addon) return;

    if (addon.name !== editVendor.plan_name) {
      alert(`Note: Applying an Add-on (${addon.name}) that may not match vendor's plan (${editVendor.plan_name}).`);
    }

    const currentEnd = editVendor.subscription_end ? new Date(editVendor.subscription_end) : new Date();
    const newEnd = new Date(currentEnd.getTime() + addon.validity_days * 86400000).toISOString().slice(0, 10);
    const newAddonMax = (editVendor.addon_max_clients || 0) + addon.max_clients;

    await supabase.from('vendors').update({
      subscription_end: newEnd,
      addon_max_clients: newAddonMax,
      addon_name: addon.name
    }).eq('id', editVendor.id);

    await supabase.from('activity_log').insert({
      action: `Add-on ${addon.name} applied to ${editVendor.shop_name}`,
      actor: 'Super Admin'
    });

    show(`Add-on applied! Validity extended by ${addon.validity_days} days.`);
    load();
    setEditVendor(null);
    setSelectedAddon('');
  };

  const handlePrepareEdit = async (v: Vendor) => {
    const { data } = await supabase.from('vendors').select('*').eq('id', v.id).single();
    if (data) {
      setEditVendor(data);
    } else {
      setEditVendor(v);
    }
  };

  const handleView = async (v: Vendor) => {
    const { data: freshVendor } = await supabase.from('vendors').select('*').eq('id', v.id).single();
    if (freshVendor) {
      setViewVendor(freshVendor);
    } else {
      setViewVendor(v);
    }
    const { data } = await supabase.from('vendor_inventory').select('*').eq('vendor_id', v.id);
    setViewInventory(data || []);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmVendor) return;
    if (deleteInputName !== deleteConfirmVendor.shop_name) {
      alert('Verification text does not match.');
      return;
    }

    // Delete Vendor and associated inventory
    await supabase.from('vendors').delete().eq('id', deleteConfirmVendor.id);
    await supabase.from('vendor_inventory').delete().eq('vendor_id', deleteConfirmVendor.id);
    
    await supabase.from('activity_log').insert({
      action: `Vendor deleted: ${deleteConfirmVendor.shop_name}`,
      actor: 'Super Admin'
    });

    show(`Vendor ${deleteConfirmVendor.shop_name} deleted successfully`, 'info');
    setDeleteConfirmVendor(null);
    setDeleteInputName('');
    load();
  };

  // Vendor inventory sub-module editing
  const handleInventoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, rowId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgUploadingId(rowId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const resData = await res.json();
      if (!res.ok) throw new Error('Image upload failed');

      setEditingInventory(prev => prev.map(item => {
        if (item.id === rowId) {
          return { ...item, image_url: resData.url };
        }
        return item;
      }));
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setImgUploadingId(null);
    }
  };

  const handleInventorySaveRow = async (row: VendorItem) => {
    await supabase.from('vendor_inventory').update({
      item_name: row.item_name,
      price: Number(row.price),
      quantity: Number(row.quantity),
      image_url: row.image_url
    }).eq('id', row.id);

    show('Inventory row saved successfully');
    // Refresh view
    if (viewVendor) {
      const { data } = await supabase.from('vendor_inventory').select('*').eq('vendor_id', viewVendor.id);
      setViewInventory(data || []);
    }
  };

  const handleInventoryDeleteRow = async (rowId: string) => {
    await supabase.from('vendor_inventory').delete().eq('id', rowId);
    show('Inventory item removed', 'info');
    
    setEditingInventory(prev => prev.filter(x => x.id !== rowId));
    if (viewVendor) {
      const { data } = await supabase.from('vendor_inventory').select('*').eq('vendor_id', viewVendor.id);
      setViewInventory(data || []);
    }
  };

  const handleInventoryAddRow = async () => {
    if (!viewVendor) return;
    const limit = getVendorItemLimit(viewVendor);

    if (limit !== Infinity && viewInventory.length >= limit) {
      alert(`Limit Reached! Plan limit is ${limit} menu items.`);
      return;
    }

    // Default to the first master item
    if (masterItems.length === 0) {
      alert('Master inventory is empty. Create master items first.');
      return;
    }
    const defaultMaster = masterItems[0];

    const { data } = await supabase.from('vendor_inventory').insert({
      vendor_id: viewVendor.id,
      master_item_id: defaultMaster.id,
      item_name: defaultMaster.name,
      category: defaultMaster.category,
      price: defaultMaster.base_price,
      quantity: defaultMaster.quantity,
      image_url: defaultMaster.image_url
    }).select().single();

    if (data) {
      setViewInventory(prev => [...prev, data]);
      setEditingInventory(prev => [...prev, data]);
      show('New inventory item added');
    }
  };

  const handleMasterItemSelectChange = (rowId: string, masterId: string) => {
    const master = masterItems.find(m => m.id === masterId);
    if (!master) return;

    setEditingInventory(prev => prev.map(item => {
      if (item.id === rowId) {
        return {
          ...item,
          master_item_id: master.id,
          item_name: master.name,
          category: master.category,
          price: master.base_price,
          quantity: master.quantity,
          image_url: master.image_url
        };
      }
      return item;
    }));
  };

  const filtered = vendors.filter((v) => {
    const matchSearch = v.shop_name.toLowerCase().includes(search.toLowerCase()) || v.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || v.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Vendor Database" 
        subtitle={`${vendors.length} total vendors registered`} 
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#f9f1e5] p-4 rounded-2xl border border-amber-200">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-amber-200 text-slate-900 text-sm focus:border-amber-400 outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-sm font-semibold text-slate-900 focus:border-amber-400 outline-none cursor-pointer"
        >
          <option value="all">All Vendors</option>
          <option value="approved">Live (Approved)</option>
          <option value="pending_approval">Pending Review</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden bg-[#f7efe3] border border-amber-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2dfc8] text-xs font-bold text-slate-700 uppercase tracking-wider">
                <th className="px-6 py-4">Shop Name</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">ZIP</th>
                <th className="px-6 py-4">Plan Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200 text-sm text-slate-800">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-[#f5e9d9] transition-all">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {v.logo_url ? (
                      <img src={v.logo_url} alt={v.shop_name} className="w-10 h-10 rounded-xl object-cover border border-amber-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#f1e2cd] flex items-center justify-center border border-amber-200"><Store size={16} className="text-slate-600" /></div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900">{v.shop_name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Start: {v.subscription_start || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{v.owner_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{v.phone}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{v.zip_code}</td>
                  <td className="px-6 py-4">
                    <Badge variant="accent">{v.plan_name || 'Free'}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'error' : 'warning'}>
                      {v.status === 'approved' ? 'Live' : v.status === 'expired' ? 'Expired' : v.status === 'rejected' ? 'Rejected' : 'Review'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleView(v)} className="p-2 rounded-xl bg-white border border-amber-200 text-slate-600 hover:bg-amber-50 transition-all" aria-label="View vendor"><Eye size={16} /></button>
                      <button onClick={() => handlePrepareEdit(v)} className="p-2 rounded-xl bg-white border border-amber-200 text-slate-600 hover:bg-amber-50 transition-all" aria-label="Edit vendor"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteConfirmVendor(v)} className="p-2 rounded-xl bg-white border border-amber-200 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all" aria-label="Delete vendor"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Store size={28} />} title="No vendors found" />}
      </div>

      {/* Create Vendor Modal */}
      <Modal open={createMode} onClose={() => setCreateMode(false)} title="Create New Vendor" size="xl">
        <VendorForm submitLabel="Create Vendor" onSubmit={handleCreateSubmit} onCancel={() => setCreateMode(false)} />
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal open={!!editVendor} onClose={() => setEditVendor(null)} title="Modify Vendor Record" size="xl">
        {editVendor && (
          <div className="space-y-6">
            <VendorForm 
              initialData={editVendor} 
              submitLabel="Save Changes" 
              onSubmit={handleEditSubmit} 
              onCancel={() => setEditVendor(null)} 
            />
            
            <div className="p-5 border border-accent/20 bg-[#f9f1e5] rounded-xl space-y-3 mt-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Apply Add-on Package</h3>
              <p className="text-xs text-slate-500">Purchase or assign an Add-on to extend this vendor's validity and client limits.</p>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <select 
                    value={selectedAddon} 
                    onChange={(e) => setSelectedAddon(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-slate-800 text-sm focus:border-amber-400 outline-none"
                  >
                    <option value="">-- Select an Add-on to Apply --</option>
                    {addons.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (+{a.validity_days} days, +{a.max_clients} clients)</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleApplyAddon} disabled={!selectedAddon}>Apply Add-on</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Vendor Strict Confirmation Modal */}
      <Modal open={!!deleteConfirmVendor} onClose={() => setDeleteConfirmVendor(null)} title="Delete Vendor Account">
        {deleteConfirmVendor && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 font-semibold leading-relaxed">
              <p className="font-bold mb-1 flex items-center gap-1"><AlertCircle size={16} /> CAUTION: High Risk Action</p>
              Deleting this vendor will permanently remove their shop record, billing status, and all item inventories from client browser views.
            </div>
            <p className="text-xs text-muted">To confirm, type the vendor's shop name <span className="font-bold text-text">"{deleteConfirmVendor.shop_name}"</span> below:</p>
            
            <Input 
              value={deleteInputName} 
              onChange={setDeleteInputName} 
              placeholder="Type shop name precisely" 
            />

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setDeleteConfirmVendor(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDelete} disabled={deleteInputName !== deleteConfirmVendor.shop_name}>
                Permanently Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Profile Modal */}
      <Modal open={!!viewVendor} onClose={() => setViewVendor(null)} title="Vendor Profile" size="lg">
        {viewVendor && (
          <div className="space-y-6 pb-2">
            
            {/* Header Profile Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-gradient-to-br from-[#fcf5e7] to-[#fff8ef] border border-amber-200 shadow-sm">
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
                  <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>{viewVendor.shop_name}</h2>
                  <Badge variant={viewVendor.status === 'approved' ? 'success' : viewVendor.status === 'expired' ? 'error' : 'accent'}>
                    {viewVendor.status === 'approved' ? 'Active' : viewVendor.status === 'expired' ? 'Expired' : 'Pending'}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-600 mt-2">Owned by {viewVendor.owner_name}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Phone size={14} className="text-amber-500" /> {viewVendor.phone}</span>
                  {viewVendor.email && <span className="flex items-center gap-1.5"><Mail size={14} className="text-amber-500" /> {viewVendor.email}</span>}
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-amber-500" /> {viewVendor.zip_code}</span>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-amber-200 transition-colors">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Subscription</p>
                <p className="font-extrabold text-slate-900 text-lg">{viewVendor.plan_name || 'Free'}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-amber-200 transition-colors">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Clients</p>
                <p className="font-extrabold text-slate-900 text-2xl">{viewVendor.total_clients ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-amber-200 transition-colors">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Plan Limits</p>
                <p className="font-extrabold text-slate-900 text-lg">{getVendorLimitLabel(viewVendor)}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-amber-200 transition-colors">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Capacity</p>
                <p className="font-extrabold text-slate-900 text-lg">{getVendorRemainingLabel(viewVendor, viewInventory.length)}</p>
              </div>
            </div>

            {/* Details Section */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><MapPin size={16} className="text-amber-500" /> Location Details</h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {viewVendor.address}
              </p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

// 3. Team Approvals Module Tab
function ApprovalsTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [activeTab, setActiveTab] = useState<'vendors' | 'upgrades' | 'subadmin'>('vendors');
  const [vendorRequests, setVendorRequests] = useState<Vendor[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [subadminRequests, setSubadminRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeRequest | null>(null);
  const [selectedSubadminReq, setSelectedSubadminReq] = useState<any | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');

  const load = async () => {
    const [{ data: v }, { data: u }, { data: s }] = await Promise.all([
      supabase.from('vendors').select('*').eq('status', 'pending_approval'),
      supabase.from('upgrade_requests').select('*').eq('status', 'pending'),
      supabase.from('subadmin_requests').select('*').eq('status', 'pending')
    ]);
    setVendorRequests(v || []);
    setUpgradeRequests(u || []);
    setSubadminRequests(s || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApproveVendor = async (v: Vendor) => {
    // Approve vendor and activate dates
    await supabase.from('vendors').update({
      status: 'approved',
      subscription_start: new Date().toISOString().slice(0, 10),
      subscription_end: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    }).eq('id', v.id);

    await supabase.from('activity_log').insert([
      {
        action: `Onboarded vendor approved: ${v.shop_name}`,
        actor: 'Super Admin'
      },
      {
        action: `Invoice generated for: ${v.shop_name}`,
        actor: 'System'
      }
    ]);

    show(`Vendor ${v.shop_name} approved and activated!`);
    setSelectedVendor(null);
    load();
  };

  const handleRejectVendor = async () => {
    if (!selectedVendor || !feedbackNote) {
      alert('Rejection note is required.');
      return;
    }

    await supabase.from('vendors').update({
      status: 'rejected',
      rejection_note: feedbackNote
    }).eq('id', selectedVendor.id);

    await supabase.from('activity_log').insert({
      action: `Onboarded vendor rejected: ${selectedVendor.shop_name}`,
      actor: 'Super Admin'
    });

    show('Submission returned with feedback');
    setSelectedVendor(null);
    setRejectMode(false);
    setFeedbackNote('');
    load();
  };

  const handleApproveUpgrade = async (u: UpgradeRequest) => {
    const targetPlan = await supabase.from('subscription_plans').select('*').eq('name', u.requested_plan).maybeSingle();
    const plan = targetPlan?.data as Plan;
    const validityDays = plan?.validity_days || 30;

    // Update vendor subscription plan details
    await supabase.from('vendors').update({
      plan_id: plan?.id || null,
      plan_name: u.requested_plan,
      status: 'approved',
      subscription_start: new Date().toISOString().slice(0, 10),
      subscription_end: new Date(Date.now() + validityDays * 86400000).toISOString().slice(0, 10)
    }).eq('id', u.vendor_id);

    // Approve the upgrade request
    await supabase.from('upgrade_requests').update({
      status: 'approved',
      payment_status: 'Verified'
    }).eq('id', u.id);

    await supabase.from('activity_log').insert({
      action: `Upgrade request approved for: ${u.vendor_name} to ${u.requested_plan}`,
      actor: 'Super Admin'
    });

    show(`Vendor plan upgraded to ${u.requested_plan}`);
    setSelectedUpgrade(null);
    load();
  };

  const handleRejectUpgrade = async (u: UpgradeRequest) => {
    await supabase.from('upgrade_requests').update({
      status: 'rejected',
      payment_status: 'Rejected'
    }).eq('id', u.id);

    show('Upgrade request rejected');
    setSelectedUpgrade(null);
    load();
  };

  const handleApproveSubadminReq = async (req: any) => {
    if (req.action_type === 'delete') {
      await supabase.from('vendors').delete().eq('id', req.vendor_id);
      await supabase.from('activity_log').insert({ action: `Vendor deleted by Sub-Admin request: ${req.vendor_name}`, actor: 'Super Admin' });
    } else if (req.action_type === 'edit') {
      const updates = JSON.parse(req.payload);
      await supabase.from('vendors').update(updates).eq('id', req.vendor_id);
      await supabase.from('activity_log').insert({ action: `Vendor edited by Sub-Admin request: ${req.vendor_name}`, actor: 'Super Admin' });
    } else if (req.action_type === 'add-on') {
      const addonDetails = JSON.parse(req.payload);
      const { data: v } = await supabase.from('vendors').select('*').eq('id', req.vendor_id).maybeSingle();
      if (v) {
        const currentEnd = new Date(v.subscription_end || Date.now());
        const newEnd = new Date(currentEnd.getTime() + addonDetails.validity_days * 86400000);
        await supabase.from('vendors').update({
          subscription_end: newEnd.toISOString().slice(0, 10),
          client_limit: (v.client_limit || 0) + addonDetails.max_clients
        }).eq('id', req.vendor_id);
        await supabase.from('activity_log').insert({ action: `Add-on ${addonDetails.addon_name} applied by Sub-Admin request to ${req.vendor_name}`, actor: 'Super Admin' });
      }
    }

    await supabase.from('subadmin_requests').update({ status: 'approved' }).eq('id', req.id);
    show(`Sub-Admin request approved (${req.action_type})`);
    setSelectedSubadminReq(null);
    load();
  };

  const handleRejectSubadminReq = async (req: any) => {
    await supabase.from('subadmin_requests').update({ status: 'rejected' }).eq('id', req.id);
    show('Sub-Admin request rejected');
    setSelectedSubadminReq(null);
    load();
  };

  if (loading) return <Spinner />;

  const pendingCount = vendorRequests.length + upgradeRequests.length + subadminRequests.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Team Approvals Queue" 
        subtitle="Manage registrations and subscription upgrades submitted by team members"
        action={
          pendingCount > 0 ? (
            <span className="h-6 px-2.5 rounded-full bg-red-500 text-white font-extrabold text-xs flex items-center justify-center animate-pulse">
              {pendingCount} Pending Requests
            </span>
          ) : null
        }
      />

      {/* Dual Tab navigation */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative ${activeTab === 'vendors' ? 'text-accent border-b-2 border-accent' : 'text-muted'}`}
        >
          New Vendor Submissions ({vendorRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('upgrades')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative ${activeTab === 'upgrades' ? 'text-accent border-b-2 border-accent' : 'text-muted'}`}
        >
          Upgrade Requests ({upgradeRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('subadmin')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative ${activeTab === 'subadmin' ? 'text-accent border-b-2 border-accent' : 'text-muted'}`}
        >
          Sub-Admin Requests ({subadminRequests.length})
        </button>
      </div>

      {activeTab === 'vendors' ? (
        <div className="card overflow-hidden bg-surface border border-border">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-2 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="px-6 py-4">Vendor Details</th>
                <th className="px-6 py-4">Submitted By</th>
                <th className="px-6 py-4">Zone Zip</th>
                <th className="px-6 py-4">Target Plan</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {vendorRequests.map((v) => (
                <tr key={v.id} className="hover:bg-surface-2/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {v.logo_url && <img src={v.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                    <div>
                      <p className="font-bold text-text">{v.shop_name}</p>
                      <p className="text-[10px] text-muted">Owner: {v.owner_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="accent">{v.submitted_by || 'Sub-Admin'}</Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold">{v.zip_code}</td>
                  <td className="px-6 py-4 font-bold text-accent">{v.plan_name}</td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" onClick={() => setSelectedVendor(v)}>
                      Review Request
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vendorRequests.length === 0 && <EmptyState icon={<CheckCircle2 size={24} />} title="No new vendor requests" />}
        </div>
      ) : activeTab === 'upgrades' ? (
        <div className="card overflow-hidden bg-surface border border-border">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-2 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="px-6 py-4">Vendor Name</th>
                <th className="px-6 py-4">Current Plan</th>
                <th className="px-6 py-4">Requested Upgrade</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {upgradeRequests.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-text">{u.vendor_name}</td>
                  <td className="px-6 py-4 text-muted font-medium">{u.current_plan || 'Free'}</td>
                  <td className="px-6 py-4 font-extrabold text-accent">{u.requested_plan}</td>
                  <td className="px-6 py-4">
                    <Badge variant={u.payment_status === 'Verified' ? 'success' : 'warning'}>{u.payment_status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" onClick={() => setSelectedUpgrade(u)}>
                      Process Upgrade
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {upgradeRequests.length === 0 && <EmptyState icon={<CreditCard size={24} />} title="No upgrade requests" />}
        </div>
      ) : activeTab === 'subadmin' ? (
        <div className="card overflow-hidden bg-surface border border-border">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-2 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Sub-Admin</th>
                <th className="px-6 py-4">Action Requested</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {subadminRequests.map((req) => (
                <tr key={req.id} className="hover:bg-surface-2/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-text">{req.vendor_name}</td>
                  <td className="px-6 py-4 text-muted">{req.subadmin_email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={req.action_type === 'delete' ? 'error' : req.action_type === 'edit' ? 'warning' : 'accent'}>
                      {req.action_type.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted text-xs">{new Date(req.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" onClick={() => setSelectedSubadminReq(req)}>
                      Review Request
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subadminRequests.length === 0 && <EmptyState icon={<Store size={24} />} title="No Sub-Admin requests" />}
        </div>
      ) : null}

      {/* View vendor request details panel */}
      <Drawer open={!!selectedVendor} onClose={() => setSelectedVendor(null)} title="Onboarding Review Panel">
        {selectedVendor && (
          <div className="space-y-6">
            <div className="text-center pb-6 border-b border-border">
              {selectedVendor.logo_url && <img src={selectedVendor.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover mx-auto mb-3" />}
              <h3 className="font-extrabold text-lg text-text">{selectedVendor.shop_name}</h3>
              <p className="text-xs text-muted mt-1">Submitted by: <span className="font-bold text-accent">{selectedVendor.submitted_by || 'Sub-Admin'}</span></p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Business Information</p>
              <div className="text-sm bg-surface-2 p-4 rounded-xl border border-border space-y-2">
                <p><span className="text-xs text-muted block">Owner</span> <span className="font-bold">{selectedVendor.owner_name}</span></p>
                <p><span className="text-xs text-muted block">Phone</span> <span className="font-bold">{selectedVendor.phone}</span></p>
                <p><span className="text-xs text-muted block">Zip Code</span> <span className="font-bold">{selectedVendor.zip_code}</span></p>
                <p><span className="text-xs text-muted block">Subscription Tier Selection</span> <span className="font-bold text-accent">{selectedVendor.plan_name}</span></p>
              </div>
            </div>

            {!rejectMode ? (
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button variant="danger" className="flex-1" onClick={() => setRejectMode(true)}>
                  Reject Submission
                </Button>
                <Button className="flex-1" onClick={() => handleApproveVendor(selectedVendor)}>
                  Approve & Activate
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-red-600 uppercase tracking-wider block">Rejection Feedback note *</label>
                  <textarea
                    required
                    rows={3}
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Provide correction requests (e.g. Please upload a high-definition logo)"
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-text placeholder:text-muted/50 focus:border-red-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRejectMode(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" className="flex-1" onClick={handleRejectVendor} disabled={!feedbackNote}>
                    Confirm Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Upgrade Request Modal */}
      <Modal open={!!selectedUpgrade} onClose={() => setSelectedUpgrade(null)} title="Review Upgrade Request">
        {selectedUpgrade && (
          <div className="space-y-6">
            <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-3 text-sm">
              <p><span className="text-xs text-muted block">Vendor Shop</span> <span className="font-bold">{selectedUpgrade.vendor_name}</span></p>
              <p><span className="text-xs text-muted block">Current active plan</span> <span className="font-semibold text-text">{selectedUpgrade.current_plan || 'Free'}</span></p>
              <p><span className="text-xs text-muted block">Requested upgrade plan</span> <span className="font-extrabold text-accent text-base">{selectedUpgrade.requested_plan}</span></p>
              <p><span className="text-xs text-muted block">Payment / Verification Status</span> <span className="font-semibold text-text">{selectedUpgrade.payment_status}</span></p>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => handleRejectUpgrade(selectedUpgrade)}>
                Reject Upgrade
              </Button>
              <Button onClick={() => handleApproveUpgrade(selectedUpgrade)}>
                Verify & Activate Plan
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sub-Admin Request Modal */}
      <Modal open={!!selectedSubadminReq} onClose={() => setSelectedSubadminReq(null)} title="Review Sub-Admin Request">
        {selectedSubadminReq && (
          <div className="space-y-6">
            <div className="bg-surface-2 p-4 rounded-xl border border-border space-y-3 text-sm">
              <p><span className="text-xs text-muted block">Vendor Shop</span> <span className="font-bold text-text">{selectedSubadminReq.vendor_name}</span></p>
              <p><span className="text-xs text-muted block">Sub-Admin Email</span> <span className="font-semibold text-text">{selectedSubadminReq.subadmin_email}</span></p>
              <p>
                <span className="text-xs text-muted block">Requested Action</span>
                <Badge variant={selectedSubadminReq.action_type === 'delete' ? 'error' : selectedSubadminReq.action_type === 'edit' ? 'warning' : 'accent'}>
                  {selectedSubadminReq.action_type.toUpperCase()}
                </Badge>
              </p>
              
              {selectedSubadminReq.action_type === 'delete' && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mt-2 text-red-700 text-xs">
                  <strong>Warning:</strong> Approving this request will permanently delete this vendor and all associated data.
                </div>
              )}

              {selectedSubadminReq.action_type === 'add-on' && (
                <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg mt-2 text-sm text-text">
                  <p className="font-bold mb-1">Add-on Details:</p>
                  <pre className="text-xs whitespace-pre-wrap font-mono text-muted">
                    {JSON.stringify(JSON.parse(selectedSubadminReq.payload), null, 2)}
                  </pre>
                </div>
              )}

              {selectedSubadminReq.action_type === 'edit' && (
                <div className="p-3 bg-surface border border-border rounded-lg mt-2 text-sm text-text">
                  <p className="font-bold mb-1">Proposed Vendor Updates:</p>
                  <pre className="text-xs whitespace-pre-wrap font-mono text-muted">
                    {JSON.stringify(JSON.parse(selectedSubadminReq.payload), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button variant="danger" onClick={() => handleRejectSubadminReq(selectedSubadminReq)}>
                Reject
              </Button>
              <Button onClick={() => handleApproveSubadminReq(selectedSubadminReq)}>
                Approve Request
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// 4. Subscription Plans Module Tab
function PlansTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [masterCategories, setMasterCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [addonModal, setAddonModal] = useState(false);
  const [form, setForm] = useState({ name: '', price: 0, validity_days: 30, max_items: 5, max_clients: 10, master_category_name: '' });
  const [addonForm, setAddonForm] = useState({ name: '', price: 99, validity_days: 30, max_clients: 50 });
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  const load = async () => {
    const [{ data: pData }, { data: aData }, { data: mData }] = await Promise.all([
      supabase.from('subscription_plans').select('*').order('price'),
      supabase.from('addons').select('*').order('created_at', { ascending: false }),
      supabase.from('master_inventory').select('name')
    ]);
    setPlans(pData || []);
    setAddons(aData || []);
    setMasterCategories(Array.from(new Set((mData || []).map((m: any) => m.name))).filter(Boolean) as string[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || form.price < 0) return;
    await supabase.from('subscription_plans').insert({
      name: form.name,
      price: Number(form.price),
      validity_days: Number(form.validity_days),
      max_items: Number(form.max_items),
      max_clients: Number(form.max_clients),
      master_category_name: form.master_category_name || null,
      status: 'active'
    });

    await supabase.from('activity_log').insert({
      action: `New subscription plan created: ${form.name}`,
      actor: 'Super Admin'
    });

    show(`Plan ${form.name} created successfully!`);
    setModal(false);
    setForm({ name: '', price: 0, validity_days: 30, max_items: 5, max_clients: 10, master_category_name: '' });
    load();
  };

  const handleCreateAddon = async () => {
    if (!addonForm.name || addonForm.price < 0) return;
    await supabase.from('addons').insert({
      name: addonForm.name,
      price: Number(addonForm.price),
      validity_days: Number(addonForm.validity_days),
      max_clients: Number(addonForm.max_clients)
    });

    await supabase.from('activity_log').insert({
      action: `New add-on package created: ${addonForm.name}`,
      actor: 'Super Admin'
    });

    show(`Add-on package ${addonForm.name} created successfully!`);
    setAddonModal(false);
    setAddonForm({ name: '', price: 99, validity_days: 30, max_clients: 50 });
    load();
  };

  const handleEditSave = async () => {
    if (!editPlan) return;
    await supabase.from('subscription_plans').update({
      name: editPlan.name,
      price: Number(editPlan.price),
      validity_days: Number(editPlan.validity_days),
      max_items: Number(editPlan.max_items),
      max_clients: Number(editPlan.max_clients),
      master_category_name: editPlan.master_category_name || null,
    }).eq('id', editPlan.id);

    await supabase.from('activity_log').insert({
      action: `Subscription plan limits modified: ${editPlan.name}`,
      actor: 'Super Admin'
    });

    show('Subscription plan updated');
    setEditPlan(null);
    load();
  };

  const handleDelete = async (plan: Plan) => {
    if (confirm(`Are you sure you want to delete ${plan.name}? Vendors currently on this plan will be downgraded.`)) {
      await supabase.from('subscription_plans').delete().eq('id', plan.id);
      await supabase.from('activity_log').insert({
        action: `Subscription plan deleted: ${plan.name}`,
        actor: 'Super Admin'
      });
      show(`Plan ${plan.name} removed successfully`, 'info');
      load();
    }
  };

  const handleDeleteAddon = async (addonId: string, addonName: string) => {
    if (confirm(`Are you sure you want to remove the ${addonName} add-on?`)) {
      await supabase.from('addons').delete().eq('id', addonId);
      await supabase.from('activity_log').insert({
        action: `Add-on package deleted: ${addonName}`,
        actor: 'Super Admin'
      });
      show(`Add-on ${addonName} removed successfully`, 'info');
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Subscription Pricing plans" 
        subtitle="Configure limits and pricing cards" 
        action={
          <div className="flex items-center gap-3">
            <Button onClick={() => setAddonModal(true)} variant="outline"><Plus size={16} /> Add Add-on</Button>
            <Button onClick={() => setModal(true)}><Plus size={16} /> Add Plan</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
        {plans.map((p) => (
          <div key={p.id} className="card p-6 bg-surface border border-border relative hover:border-accent/40 transition-all flex flex-col justify-between">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setEditPlan(p)} 
                className="p-1 rounded hover:bg-surface-2 text-muted hover:text-text transition-colors"
                title="Edit Plan"
              >
                <Edit2 size={14} />
              </button>
            </div>
            
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider">{p.name} Tier</span>
              <p className="text-4xl font-extrabold text-text mt-3">₹{p.price.toLocaleString()}</p>
              <p className="text-xs text-muted mt-1">Validity: {p.validity_days} Days</p>
              
              <div className="border-t border-border/60 my-4" />
              
              <ul className="space-y-2 text-sm text-text font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Max Inventory: <span className="font-bold text-accent">{p.max_items} Items</span></span>
                </li>
                {p.master_category_name && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span>Linked Category: <span className="font-bold text-accent">{p.master_category_name}</span></span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>Max Client Limit: <span className="font-bold text-accent">{p.max_clients} unique clients</span></span>
                </li>
              </ul>
              <p className="text-[10px] text-muted italic mt-3">Exceeding client limits triggers plan auto-expiry.</p>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-6" 
              onClick={() => handleDelete(p)}
              disabled={p.name === 'Free'}
            >
              Delete Plan
            </Button>
          </div>
        ))}
      </div>

      {/* Subscription Add-ons Section */}
      <div className="pt-8 border-t border-border/80 mt-10 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-text">Subscription Add-on Packages</h2>
          <p className="text-xs text-muted mt-1">Provide permission for vendors with active plans to extend validity or increase maximum client limits when reached.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
          {addons.map((a) => (
            <div key={a.id} className="card p-6 bg-surface border border-border relative hover:border-accent/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-accent uppercase tracking-wide">Add-on Extension</span>
                  <button 
                    onClick={() => handleDeleteAddon(a.id, a.name)} 
                    className="p-1 rounded hover:bg-surface-2 text-muted hover:text-red-500 transition-colors"
                    title="Remove Add-on"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <h3 className="font-extrabold text-lg text-text mt-3">{a.name}</h3>
                <p className="text-3xl font-extrabold text-text mt-2">₹{Number(a.price).toLocaleString()}</p>
                <p className="text-xs text-muted mt-1">+ {a.validity_days} Additional Days Validity</p>

                <div className="border-t border-border/60 my-4" />

                <ul className="space-y-2 text-sm text-text font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span>Max Client Connect: <span className="font-bold text-accent">+{a.max_clients} clients</span></span>
                  </li>
                </ul>
              </div>
            </div>
          ))}

          {addons.length === 0 && (
            <div className="col-span-full p-8 text-center bg-surface-2/40 border border-dashed border-border rounded-2xl">
              <p className="text-sm text-muted">No Add-on packages created yet. Click "+ Add Add-on" beside "+ Add Plan" to create one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Plan Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Pricing Plan">
        <div className="space-y-4">
          <Input label="Plan Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Price (₹)" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} required />
          <Input label="Validity Days" type="number" value={String(form.validity_days)} onChange={(v) => setForm({ ...form, validity_days: Number(v) })} required />
          <Input label="Max Inventory Items" type="number" value={String(form.max_items)} onChange={(v) => setForm({ ...form, max_items: Number(v) })} required />
          <Input label="Max Client Limits" type="number" value={String(form.max_clients)} onChange={(v) => setForm({ ...form, max_clients: Number(v) })} required />
          <Select
            label="Linked Master Category"
            value={form.master_category_name}
            onChange={(v) => setForm({ ...form, master_category_name: v })}
            options={[{ label: '-- Select Master Category --', value: '' }, ...masterCategories.map(c => ({ label: c, value: c }))]}
          />

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Plan</Button>
          </div>
        </div>
      </Modal>

      {/* Add Add-on Modal */}
      <Modal open={addonModal} onClose={() => setAddonModal(false)} title="Add Subscription Add-on Package">
        <div className="space-y-4">
          <Select 
            label="Add-on Plan Name" 
            value={addonForm.name} 
            onChange={(v) => setAddonForm({ ...addonForm, name: v })} 
            options={[{ value: '', label: '-- Select Existing Plan --' }, ...plans.map(p => ({ value: p.name, label: p.name }))]} 
          />
          <Input 
            label="Price (₹)" 
            type="number" 
            value={String(addonForm.price)} 
            onChange={(v) => setAddonForm({ ...addonForm, price: Number(v) })} 
            required 
          />
          <Input 
            label="Validity Extension (Days)" 
            type="number" 
            value={String(addonForm.validity_days)} 
            onChange={(v) => setAddonForm({ ...addonForm, validity_days: Number(v) })} 
            required 
          />
          <Input 
            label="Maximum Clients That Can Connect" 
            type="number" 
            value={String(addonForm.max_clients)} 
            onChange={(v) => setAddonForm({ ...addonForm, max_clients: Number(v) })} 
            required 
          />

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setAddonModal(false)}>Cancel</Button>
            <Button onClick={handleCreateAddon}>Save Add-on</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal open={!!editPlan} onClose={() => setEditPlan(null)} title="Modify Pricing Plan">
        {editPlan && (
          <div className="space-y-4">
            <Input label="Plan Name" value={editPlan.name} onChange={(v) => setEditPlan({ ...editPlan, name: v })} required />
            <Input label="Price (₹)" type="number" value={String(editPlan.price)} onChange={(v) => setEditPlan({ ...editPlan, price: Number(v) })} required />
            <Input label="Validity Days" type="number" value={String(editPlan.validity_days)} onChange={(v) => setEditPlan({ ...editPlan, validity_days: Number(v) })} required />
            <Input label="Max Inventory Items" type="number" value={String(editPlan.max_items)} onChange={(v) => setEditPlan({ ...editPlan, max_items: Number(v) })} required />
            <Input label="Max Client Limits" type="number" value={String(editPlan.max_clients)} onChange={(v) => setEditPlan({ ...editPlan, max_clients: Number(v) })} required />
            <Select
              label="Linked Master Category"
              value={editPlan.master_category_name || ''}
              onChange={(v) => setEditPlan({ ...editPlan, master_category_name: v })}
              options={[{ label: '-- Select Master Category --', value: '' }, ...masterCategories.map(c => ({ label: c, value: c }))]}
            />

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setEditPlan(null)}>Cancel</Button>
              <Button onClick={handleEditSave}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// 5.1 Sub Inventory View
function SubInventoryView({ master, show, onClose }: { master: MasterItem, show: (m: string, t?: 'success'|'error'|'info') => void, onClose: () => void }) {
  const [items, setItems] = useState<SubInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<SubInventory | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    price: 0,
    quantity: 10,
    image_url: ''
  });

  const load = async () => {
    const { data } = await supabase.from('sub_inventory').select('*').eq('master_inventory_id', master.id).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || form.price < 0) return;
    if (items.length >= 70) {
      show('Maximum of 70 sub-inventory items allowed per master category.', 'error');
      return;
    }
    
    await supabase.from('sub_inventory').insert({
      master_inventory_id: master.id,
      name: form.name,
      price: Number(form.price),
      quantity: Number(form.quantity),
      image_url: form.image_url || null
    });

    show(`Sub-Item ${form.name} created successfully!`);
    setModal(false);
    setForm({ name: '', price: 0, quantity: 10, image_url: '' });
    load();
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    await supabase.from('sub_inventory').update({
      name: editItem.name,
      price: Number(editItem.price),
      quantity: Number(editItem.quantity),
      image_url: editItem.image_url
    }).eq('id', editItem.id);

    show('Sub-Item updated');
    setEditItem(null);
    load();
  };

  const handleDelete = async (item: SubInventory) => {
    if (confirm(`Warning: Are you sure you want to delete ${item.name}?`)) {
      await supabase.from('sub_inventory').delete().eq('id', item.id);
      show(`Sub-Item ${item.name} removed`, 'info');
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
        <PageHeader 
          title={`Sub-Inventory: ${master.name}`} 
          subtitle={`Manage items inside the ${master.category} category (${items.length}/70)`} 
          action={<Button onClick={() => setModal(true)} disabled={items.length >= 70}><Plus size={16} /> Add Sub-Item</Button>}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="card bg-surface border border-border p-4 flex flex-col justify-between">
            <h3 className="font-bold">{item.name}</h3>
            <div className="flex items-center justify-between mt-4">
              <span className="text-accent font-bold">₹{item.price}</span>
              <div className="flex gap-2">
                <button onClick={() => setEditItem(item)} className="p-1.5 rounded bg-surface-2 text-muted hover:text-text"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(item)} className="p-1.5 rounded bg-surface-2 text-muted hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && <EmptyState icon={<Package size={28} />} title="No sub-items found" />}

      <Modal open={modal} onClose={() => setModal(false)} title="Create Sub-Item">
        <div className="space-y-4">
          <Input label="Item Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} required />
            <Input label="Default Qty" type="number" value={String(form.quantity)} onChange={(v) => setForm({ ...form, quantity: Number(v) })} required />
          </div>
          <Button className="w-full mt-4" onClick={handleCreate}>Save Sub-Item</Button>
        </div>
      </Modal>

      {editItem && (
        <Modal open={true} onClose={() => setEditItem(null)} title="Edit Sub-Item">
          <div className="space-y-4">
            <Input label="Item Name" value={editItem.name} onChange={(v) => setEditItem({ ...editItem, name: v })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹)" type="number" value={String(editItem.price)} onChange={(v) => setEditItem({ ...editItem, price: Number(v) })} required />
              <Input label="Quantity" type="number" value={String(editItem.quantity)} onChange={(v) => setEditItem({ ...editItem, quantity: Number(v) })} required />
            </div>
            <Button className="w-full mt-4" onClick={handleEditSave}>Update Item</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// 5. Master Inventory Module Tab
function InventoryTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<MasterItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<MasterItem | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    category: 'Tiffin',
    base_price: 100,
    quantity: 10,
    description: '',
    image_url: ''
  });

  const load = async () => {
    const { data } = await supabase.from('master_inventory').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 15 * 1024 * 1024; // 15 MB maximum application limit
    if (file.size > MAX_SIZE) {
      alert(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum application limit of 15 MB.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (isEdit && editItem) {
        setEditItem({ ...editItem, image_url: data.url });
      } else {
        setForm({ ...form, image_url: data.url });
      }
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || form.base_price < 0) return;
    await supabase.from('master_inventory').insert({
      name: form.name,
      category: form.category,
      base_price: Number(form.base_price),
      quantity: Number(form.quantity),
      description: form.description || null,
      image_url: form.image_url || null
    });

    show(`Master Item ${form.name} created successfully!`);
    setModal(false);
    setForm({ name: '', category: 'Tiffin', base_price: 100, quantity: 10, description: '', image_url: '' });
    load();
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    await supabase.from('master_inventory').update({
      name: editItem.name,
      category: editItem.category,
      base_price: Number(editItem.base_price),
      quantity: Number(editItem.quantity),
      description: editItem.description,
      image_url: editItem.image_url
    }).eq('id', editItem.id);

    show('Master Item updated');
    setEditItem(null);
    load();
  };

  const handleDelete = async (item: MasterItem) => {
    if (confirm(`Warning: Are you sure you want to delete ${item.name}? This will remove it from global client browsing.`)) {
      await supabase.from('master_inventory').delete().eq('id', item.id);
      show(`Master Item ${item.name} removed`, 'info');
      load();
    }
  };

  const categories = ['Tiffin', 'Breakfast', 'Lunch/Dinner', 'Thali', 'Vegetables'];

  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || i.category === category;
    return matchSearch && matchCat;
  });

  if (loading) return <Spinner />;

  if (selectedMaster) {
    return <SubInventoryView master={selectedMaster} show={show} onClose={() => setSelectedMaster(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Master Inventory Database" 
        subtitle="Manage the global collection of catalog meals" 
        action={<Button onClick={() => setModal(true)}><Plus size={16} /> Add Master Item</Button>}
      />

      <div className="flex bg-surface p-4 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger">
        {filtered.map((item) => (
          <div key={item.id} onClick={() => setSelectedMaster(item)} className="card overflow-hidden bg-surface border border-border flex flex-col justify-between hover-lift group cursor-pointer">
            <div className="relative aspect-[4/3] overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center"><Package size={24} className="text-muted" /></div>
              )}
              <div className="absolute top-2 left-2"><Badge variant="accent">{item.category}</Badge></div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-base text-text">{item.name}</h3>
                <p className="text-xs text-muted mt-1 line-clamp-2">{item.description || 'No description available.'}</p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <span className="text-lg font-extrabold text-accent">₹{item.base_price}</span>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditItem(item); }} className="p-2 rounded bg-surface-2 border border-border/40 text-muted hover:text-text" title="Edit"><Edit2 size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="p-2 rounded bg-surface-2 border border-border/40 text-muted hover:text-red-500" title="Delete"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon={<Package size={28} />} title="No master items found" />}

      {/* Add Master Item Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Create Master Item">
        <div className="space-y-4">
          <Input label="Item Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Starting Price (₹)" type="number" value={String(form.base_price)} onChange={(v) => setForm({ ...form, base_price: Number(v) })} required />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Image Asset</label>
            <div className="relative border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-surface-2/20 hover:bg-surface-2/40 transition-colors">
              {form.image_url ? (
                <div className="text-center">
                  <img src={form.image_url} alt="" className="w-16 h-16 rounded object-cover mx-auto" />
                  <p className="text-[10px] text-green-500 font-semibold mt-1">Image Loaded</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload size={20} className="text-muted mx-auto mb-1" />
                  <p className="text-[10px] text-muted">Upload high-res meal photo</p>
                </div>
              )}
              <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleImageUpload(e)} className="absolute inset-0 opacity-0 cursor-pointer" />
              {uploading && <div className="absolute inset-0 bg-surface/90 flex items-center justify-center rounded-xl"><Spinner /></div>}
            </div>

            <div className="text-xs bg-surface-2/60 border border-border/80 rounded-xl p-3 text-muted space-y-1">
              <p className="font-bold text-text text-[11px] uppercase tracking-wider">Photo Upload Specifications:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li><strong className="text-text">JPEG Size Range:</strong> 2 MB – 5 MB (Compressed)</li>
                <li><strong className="text-text">PNG Size Range:</strong> 5 MB – 15 MB (Uncompressed)</li>
                <li><strong className="text-text">Target Resolution:</strong> 1920×1080 (Full HD) or 2048×1536</li>
                <li><strong className="text-text">Max Application Limit:</strong> 10 MB maximum</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Master Item</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Master Item Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Modify Master Item">
        {editItem && (
          <div className="space-y-4">
            <Input label="Item Name" value={editItem.name} onChange={(v) => setEditItem({ ...editItem, name: v })} required />
            <Input label="Starting Price (₹)" type="number" value={String(editItem.base_price)} onChange={(v) => setEditItem({ ...editItem, base_price: Number(v) })} required />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Image Asset</label>
              <div className="relative border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-surface-2/20 hover:bg-surface-2/40 transition-colors">
                {editItem.image_url ? (
                  <div className="text-center">
                    <img src={editItem.image_url} alt="" className="w-16 h-16 rounded object-cover mx-auto" />
                    <p className="text-[10px] text-green-500 font-semibold mt-1">Image Loaded</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload size={20} className="text-muted mx-auto mb-1" />
                    <p className="text-[10px] text-muted">Upload high-res meal photo</p>
                  </div>
                )}
                <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleImageUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer" />
                {uploading && <div className="absolute inset-0 bg-surface/90 flex items-center justify-center rounded-xl"><Spinner /></div>}
              </div>

              <div className="text-xs bg-surface-2/60 border border-border/80 rounded-xl p-3 text-muted space-y-1">
                <p className="font-bold text-text text-[11px] uppercase tracking-wider">Photo Upload Specifications:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li><strong className="text-text">JPEG Size Range:</strong> 2 MB – 5 MB (Compressed)</li>
                  <li><strong className="text-text">PNG Size Range:</strong> 5 MB – 15 MB (Uncompressed)</li>
                  <li><strong className="text-text">Target Resolution:</strong> 1920×1080 (Full HD) or 2048×1536</li>
                  <li><strong className="text-text">Max Application Limit:</strong> 10 MB maximum</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={handleEditSave}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// 6. Orders Watchlist Tab
function OrdersTab({ show: _show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'orders', action: 'select', sorts: [{ field: 'created_at', ascending: false }], admin_override: true })
      });
      const d = await res.json();
      setOrders(d.data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Global Orders Watchlist" subtitle={`${orders.length} order history records in MongoDB`} />
      <div className="card overflow-hidden bg-surface border border-border">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-surface-2 text-xs font-bold text-muted uppercase tracking-wider">
              <th className="px-5 py-4">Order Code</th>
              <th className="px-5 py-4">Client Name</th>
              <th className="px-5 py-4">Zip Code</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Total Price</th>
              <th className="px-5 py-4">Delivered Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface-2/20 transition-all">
                <td className="px-5 py-4 font-bold text-text">
                  <span>{o.item_name}</span>
                  <p className="text-[10px] text-muted mt-0.5">#{o.id.slice(0, 8).toUpperCase()}</p>
                </td>
                <td className="px-5 py-4 font-medium">{o.client_name}</td>
                <td className="px-5 py-4 font-semibold">{o.client_zip}</td>
                <td className="px-5 py-4">
                  <Badge variant={o.status === 'delivered' ? 'success' : o.status === 'System Denied' ? 'error' : 'warning'}>
                    {o.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="px-5 py-4 font-bold text-accent">₹{o.price}</td>
                <td className="px-5 py-4 font-bold tracking-widest text-green-600">{o.otp || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <EmptyState icon={<ShoppingBag size={28} />} title="No orders found" />}
      </div>
    </div>
  );
}

// 7. Guides tab
function GuidesTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'vendor', keywords: '' });
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<string>('');
  
  const [uploading, setUploading] = useState(false);
  const [visibilityRoles, setVisibilityRoles] = useState<string[]>(['vendor']);

  const load = async () => {
    const { data } = await supabase.from('guides').select('*').order('uploaded_at', { ascending: false });
    setGuides(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('File size must be under 15MB');
      return;
    }
    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => setPdfData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!form.title || !pdfData) {
      alert('Title and file are required.');
      return;
    }
    setUploading(true);

    await supabase.from('guides').insert({
      title: form.title,
      category: form.category,
      keywords: form.keywords,
      allowed_roles: visibilityRoles,
      file_data: pdfData,
      file_name: pdfFile?.name || 'guide.pdf'
    });

    setUploading(false);
    show('Document uploaded successfully!');
    setModal(false);
    setForm({ title: '', category: 'vendor', keywords: '' });
    setPdfFile(null);
    setPdfData('');
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this SOP document?')) {
      await supabase.from('guides').delete().eq('id', id);
      show('Guide document deleted', 'info');
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Operational Documents & Guides" 
        subtitle="Manage Standard Operating Procedures for Sub-Admins, Vendors, and FAQs" 
        action={<Button onClick={() => setModal(true)}><FileUp size={16} /> Upload PDF</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
        {guides.map((g) => (
          <div key={g.id} className="card p-6 bg-surface border border-border flex flex-col justify-between hover-lift group">
            <div>
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-4 text-accent">
                  <FileText size={18} />
                </div>
                <button onClick={() => handleDelete(g.id)} className="text-muted hover:text-red-500 p-1 rounded hover:bg-surface-2 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="font-extrabold text-base text-text leading-snug">{g.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="accent">{g.category}</Badge>
                {g.file_name && <span className="text-[10px] text-muted font-semibold truncate max-w-[120px]">{g.file_name}</span>}
              </div>
            </div>

            {g.file_data && (
              <a 
                href={g.file_data} 
                download={g.file_name || 'guide.pdf'} 
                className="mt-6 inline-flex items-center justify-center gap-2 py-2 px-3 bg-surface-2 hover:bg-border/30 border border-border rounded-xl text-xs font-bold text-accent transition-colors"
              >
                <Upload size={12} className="rotate-180" /> Download PDF
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Upload Document">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          
          {/* Visibility checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">Access Control Visibility</label>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visibilityRoles.includes('sub_admin')}
                  onChange={(e) => {
                    if (e.target.checked) setVisibilityRoles([...visibilityRoles, 'sub_admin']);
                    else setVisibilityRoles(visibilityRoles.filter(r => r !== 'sub_admin'));
                  }}
                  className="accent-accent"
                />
                Show to Sub-Admins
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visibilityRoles.includes('vendor')}
                  onChange={(e) => {
                    if (e.target.checked) setVisibilityRoles([...visibilityRoles, 'vendor']);
                    else setVisibilityRoles(visibilityRoles.filter(r => r !== 'vendor'));
                  }}
                  className="accent-accent"
                />
                Show to Vendors
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={visibilityRoles.includes('vendor_plan')}
                  onChange={(e) => {
                    if (e.target.checked) setVisibilityRoles([...visibilityRoles, 'vendor_plan']);
                    else setVisibilityRoles(visibilityRoles.filter(r => r !== 'vendor_plan'));
                  }}
                  className="accent-accent"
                />
                Show to Plan's
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Document File</label>
            <div className="relative border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-surface-2/20 hover:bg-surface-2/40 transition-colors">
              <input type="file" accept="application/pdf, image/jpeg, image/png" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              {pdfFile ? (
                <div className="text-center">
                  <FileText size={24} className="text-accent mx-auto mb-1 animate-bounce" />
                  <p className="text-xs font-bold text-text truncate max-w-[200px]">{pdfFile.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload size={20} className="text-muted mx-auto mb-1" />
                  <p className="text-[10px] text-muted">Upload PDF, JPEG, PNG (Max 15MB)</p>
                  <p className="text-[9px] text-muted mt-1">Ideal: 1920x1080 for images</p>
                </div>
              )}
            </div>
          </div>

          <Button className="w-full mt-4" onClick={handleCreate} disabled={uploading || !pdfFile}>
            {uploading ? <Spinner /> : 'Upload Document'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// 8. Sub-Admin management tab
function SubAdminsTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [admins, setAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [revealedAdminId, setRevealedAdminId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const load = async () => {
    const { data } = await supabase.from('sub_admins').select('*').order('created_at', { ascending: false });
    setAdmins(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, password: pass });
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return;
    await supabase.from('sub_admins').insert({
      name: form.name,
      email: form.email.toLowerCase(),
      password: form.password,
      force_change: true
    });

    await supabase.from('activity_log').insert({
      action: `Created new sub-admin credential: ${form.name}`,
      actor: 'Super Admin'
    });

    show(`Sub Admin ${form.name} created successfully!`);
    setModal(false);
    setForm({ name: '', email: '', password: '' });
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove sub-admin ${name}?`)) {
      await supabase.from('sub_admins').delete().eq('id', id);
      show(`Sub Admin ${name} removed`, 'info');
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Sub-Admin Management" 
        subtitle="Administer team member accounts and access permissions" 
        action={<Button onClick={() => setModal(true)}><Plus size={16} /> Create Sub-Admin</Button>}
      />

      <div className="card overflow-hidden bg-surface border border-border">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-surface-2 text-xs font-bold text-muted uppercase tracking-wider">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Password</th>
              <th className="px-6 py-4">Last Active</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {admins.map((a) => (
              <tr key={a.id} className="hover:bg-surface-2/20 transition-all">
                <td className="px-6 py-4 font-bold text-text">{a.name}</td>
                <td className="px-6 py-4 text-muted">{a.email}</td>
                <td className="px-6 py-4 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span>{revealedAdminId === a.id ? a.password : '••••••••'}</span>
                    <button 
                      onMouseDown={() => setRevealedAdminId(a.id)}
                      onMouseUp={() => setRevealedAdminId(null)}
                      onMouseLeave={() => setRevealedAdminId(null)}
                      className="p-1 rounded hover:bg-surface-2 text-muted hover:text-text cursor-pointer"
                      title="Hold to reveal"
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-muted">
                  {a.last_active ? new Date(a.last_active).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(a.id, a.name)} className="p-2 rounded bg-surface-2 border border-border/40 text-muted hover:text-red-500 hover:bg-border/20 transition-all">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Create Sub-Admin">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Email Address" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Password *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="flex-1 px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-text focus:border-accent outline-none"
              />
              <Button variant="outline" onClick={handleGeneratePassword}>Generate</Button>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Credentials</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// 9. Pending Orders Tab
function PendingOrdersTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders',
          action: 'select',
          filters: { status: 'pending' },
          admin_override: true
        })
      });
      const d = await res.json();
      setOrders((d.data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Update timer every minute to calculate expiration
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Pending & Missed Orders" 
        subtitle="Monitor orders currently broadcasting or missed by vendors (passed 10 min)"
      />

      {orders.length === 0 ? (
        <EmptyState icon={<Clock size={28} />} title="No pending orders" subtitle="All incoming orders have been accepted or fulfilled." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(o => {
            const elapsed = Date.now() - new Date(o.created_at).getTime();
            const isMissed = elapsed > 10 * 60 * 1000;

            return (
              <div key={o.id} className={`card p-5 border flex flex-col justify-between ${isMissed ? 'bg-red-50/50 border-red-200' : 'bg-surface border-border'}`}>
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-extrabold text-lg text-text">#{o.id.substring(0,6).toUpperCase()}</h3>
                    <Badge variant={isMissed ? 'error' : 'warning'}>
                      {isMissed ? 'Missed by Vendors' : 'Broadcasting...'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-text">
                    <p><span className="text-muted text-xs">Item:</span> <span className="font-bold text-accent">{o.item_name}</span> (x{o.quantity})</p>
                    <p><span className="text-muted text-xs">Category:</span> {o.master_category_name}</p>
                    <div className="p-3 bg-surface-2 rounded-xl mt-3 space-y-1">
                      <p className="font-bold text-text">{o.client_name} - {o.client_phone}</p>
                      <p className="text-xs text-muted">{o.client_address}</p>
                      <p className="text-xs font-semibold mt-1">PIN: {o.client_zip} | Landmark: {o.client_landmark}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex justify-between items-center text-xs text-muted">
                  <span>Placed: {new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="font-bold text-text">Total: ₹{o.total_price}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
