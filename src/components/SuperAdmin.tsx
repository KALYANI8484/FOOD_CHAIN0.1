import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Store, Package, CreditCard, FileText, Users,
  CheckCircle2, Search, Plus, Minus, Check, Trash2, Upload, AlertCircle,
  Activity as ActivityIcon, Eye, Edit2, Pencil, FileUp, Menu, X, Phone, Mail, MapPin, DollarSign, ShoppingBag, ChevronLeft, Clock, MessageSquare, Download, MessageCircle, Sparkles
} from 'lucide-react';
import { supabase, type Vendor, type Plan, type MasterItem, type SubInventory, type Order, type Activity, type SubAdmin, type UpgradeRequest, type VendorItem, type VendorSubscription } from '../lib/supabase';
import { Button, Badge, Modal, Input, Select, useToast, Toast, Spinner, EmptyState, SpotlightCard, Drawer, LanguageSelector, useSyncedLanguage, type Language } from './ui';
import { VendorForm } from './VendorForm';

type Tab = 'vendors' | 'approvals' | 'plans' | 'inventory' | 'guides' | 'sub_admins';

// Helper to compress images client-side before upload to bypass Nginx payload limits
const compressImageFile = (file: File, maxWidth = 1024, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return resolve(file); // Don't compress non-images (like PDFs)
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (!blob) return resolve(file);
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, file.type, quality);
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
};
export function SuperAdmin({ onExit }: { onExit: () => void }) {
  const [lang] = useSyncedLanguage();

  const navLabels = {
    en: { approvals: 'Team Approvals', vendors: 'Vendor Database', plans: 'Pricing Plans', inventory: 'Master Inventory', guides: 'Guide Documents', sub_admins: 'Sub-Admins', exit: 'Exit Dashboard' },
    hi: { approvals: 'टीम मंजूरी (Approvals)', vendors: 'विक्रेता डेटाबेस', plans: 'मूल्य निर्धारण प्लान', inventory: 'मास्टर इन्वेंटरी', guides: 'गाइड दस्तावेज', sub_admins: 'सब-एडमिन', exit: 'डैशबोर्ड से बाहर निकलें' },
    mr: { approvals: 'टीम मंजुरी (Approvals)', vendors: 'विक्रेता डेटाबेस', plans: 'किंमत प्लॅन्स', inventory: 'मास्टर इन्व्हेंटरी', guides: 'मार्गदर्शक दस्तऐवज', sub_admins: 'सब-ॲडमिन', exit: 'डॅशबोर्डवरून बाहेर पडा' },
  }[lang];

  const [tab, setTabState] = useState<Tab>('approvals');

  const setTab = (newTab: Tab, isPop = false) => {
    setTabState(newTab);
    if (!isPop) {
      window.history.pushState({ superTab: newTab, appScreen: 'super_admin' }, '', `#super_admin/${newTab}`);
    }
  };

  useEffect(() => {
    window.history.replaceState({ superTab: 'approvals', appScreen: 'super_admin' }, '', '#super_admin/approvals');

    const handleSuperAdminPopState = (e: PopStateEvent) => {
      if (e.state && e.state.superTab) {
        setTabState(e.state.superTab);
      }
    };

    window.addEventListener('popstate', handleSuperAdminPopState);
    return () => window.removeEventListener('popstate', handleSuperAdminPopState);
  }, []);

  const { toast, show } = useToast();

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: 'approvals', label: navLabels.approvals, icon: CheckCircle2 },
    { id: 'vendors', label: navLabels.vendors, icon: Store },
    { id: 'plans', label: navLabels.plans, icon: CreditCard },
    { id: 'inventory', label: navLabels.inventory, icon: Package },
    { id: 'guides', label: navLabels.guides, icon: FileText },
    { id: 'sub_admins', label: navLabels.sub_admins, icon: Users }
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden relative">
      {/* Mobile Header Bar & Hamburger Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-surface border-b border-border flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onExit}>
          <img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain" />
          <div>
            <span className="font-extrabold text-sm tracking-tight text-text block leading-none">VIKRAM ADS</span>
            <span className="text-[9px] text-muted font-bold uppercase tracking-wider">Super Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector direction="down" showLabel={true} />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-surface-2 border border-border text-text cursor-pointer hover:bg-border/30 transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`w-64 border-r border-border bg-surface flex flex-col h-screen fixed lg:sticky top-0 z-40 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-border hidden lg:flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
          <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain shrink-0" />
          <div className="min-w-0">
            <p className="font-extrabold text-base tracking-tight text-black">VIKRAM ADS</p>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Super Admin Portal</p>
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
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex justify-center pb-1">
            <LanguageSelector direction="up" showLabel={true} />
          </div>
          <Button variant="ghost" size="sm" className="w-full" onClick={onExit}>
            {navLabels.exit}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-bg relative z-10 pt-14 lg:pt-0">
        {/* Sticky Top Header Bar */}
        <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-xs">
          <span className="text-xs font-bold text-muted uppercase tracking-wider hidden sm:block">Super Admin Workspace</span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector direction="down" showLabel={true} />
          </div>
        </div>
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {tab === 'vendors' && <VendorsTab lang={lang} show={show} />}
          {tab === 'approvals' && <ApprovalsTab lang={lang} show={show} />}
          {tab === 'plans' && <PlansTab lang={lang} show={show} />}
          {tab === 'inventory' && <InventoryTab lang={lang} show={show} />}
          {tab === 'guides' && <GuidesTab lang={lang} show={show} />}
          {tab === 'sub_admins' && <SubAdminsTab lang={lang} show={show} />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export const exportCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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

const saTrans = {
  en: {
    dashboardTitle: 'Overview Dashboard',
    dashboardSubtitle: 'Real-time operations status of VIKRAM ADS',
    totalActiveVendors: 'Total & Active Vendors',
    registeredVsOperating: 'Registered vs Operating',
    activeSubscriptions: 'Active Subscriptions',
    vendorsOnPremium: 'Vendors on Premium plans',
    monthlySubRev: 'Monthly Subscription Rev',
    estMonthlyRev: 'Est monthly subscription revenue',
    liveOrdersToday: 'Live Orders Today',
    ordersPendingReview: 'orders pending review',
  },
  hi: {
    dashboardTitle: 'अवलोकन डैशबोर्ड',
    dashboardSubtitle: 'VIKRAM ADS की वास्तविक समय संचालन स्थिति',
    totalActiveVendors: 'कुल और सक्रिय विक्रेता',
    registeredVsOperating: 'पंजीकृत बनाम कार्यरत',
    activeSubscriptions: 'सक्रिय सदस्यताएँ',
    vendorsOnPremium: 'प्रीमियम प्लान पर विक्रेता',
    monthlySubRev: 'मासिक सदस्यता राजस्व',
    estMonthlyRev: 'अनुमानित मासिक सदस्यता आय',
    liveOrdersToday: 'आज के लाइव ऑर्डर',
    ordersPendingReview: 'समीक्षा हेतु लंबित ऑर्डर',
  },
  mr: {
    dashboardTitle: 'विहंगावलोकन डॅशबोर्ड',
    dashboardSubtitle: 'VIKRAM ADS ची रिअल-टाइम ऑपरेशन स्थिती',
    totalActiveVendors: 'एकूण आणि सक्रिय विक्रेते',
    registeredVsOperating: 'नोंदणीकृत विरुद्ध कार्यरत',
    activeSubscriptions: 'सक्रिय सबस्क्रिप्शन्स',
    vendorsOnPremium: 'प्रीमियम प्लॅनवरील विक्रेते',
    monthlySubRev: 'मासिक सबस्क्रिप्शन महसूल',
    estMonthlyRev: 'अंदाजित मासिक सबस्क्रिप्शन उत्पन्न',
    liveOrdersToday: 'आजचे लाइव्ह ऑर्डर्स',
    ordersPendingReview: 'पडताळणीसाठी प्रलंबित ऑर्डर्स',
  }
};

// 1. Dashboard Module Tab
function DashboardTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [lang] = useSyncedLanguage();

  const t = saTrans[lang];
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<Activity[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

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

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setBroadcasting(true);
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'broadcasts',
        action: 'insert',
        data: { message: broadcastMessage, type: 'info' }
      })
    });
    show('Broadcast message sent to all vendors!', 'success');
    setBroadcastMessage('');
    setBroadcasting(false);
  };

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
    { label: t.totalActiveVendors, value: `${totalVendors} / ${activeVendors}`, desc: t.registeredVsOperating, icon: Store, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: t.activeSubscriptions, value: premiumVendors, desc: t.vendorsOnPremium, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: t.monthlySubRev, value: `₹${totalRevenue.toLocaleString()}`, desc: t.estMonthlyRev, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: t.liveOrdersToday, value: liveOrdersToday, desc: `${pendingReviewOrders.length} ${t.ordersPendingReview}`, icon: ShoppingBag, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={t.dashboardTitle} subtitle={t.dashboardSubtitle} />

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
            <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted flex items-center gap-2">
              <MessageSquare size={18} className="text-accent" /> Vendor Broadcast
            </h3>
            <div className="space-y-3">
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type an announcement to broadcast to all vendors..."
                className="w-full p-3 text-sm rounded-xl border border-border bg-surface-2 focus:border-accent outline-none resize-none h-24"
              />
              <Button onClick={handleBroadcast} disabled={broadcasting || !broadcastMessage.trim()} className="w-full bg-primary text-accent hover:bg-primary-dark">
                {broadcasting ? 'Broadcasting...' : 'Send Broadcast'}
              </Button>
            </div>
          </div>

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

  // Advanced Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterHealth, setFilterHealth] = useState('all'); // 'all' | 'expiring' | 'expired' | 'active'
  const [filterZip, setFilterZip] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Batch Selection
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());
  const [batchExtendOpen, setBatchExtendOpen] = useState(false);
  const [batchCategory, setBatchCategory] = useState('all');
  const [batchDays, setBatchDays] = useState(30);
  const [batchLoading, setBatchLoading] = useState(false);

  // Category Popover
  const [popoverSub, setPopoverSub] = useState<{ sub: any; anchorRect: DOMRect } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Inline Category Editor States for Edit Modal
  const [inlineEditSubId, setInlineEditSubId] = useState<string | null>(null);
  const [inlineEditEnd, setInlineEditEnd] = useState<string>('');
  const [inlineEditLimit, setInlineEditLimit] = useState<number>(5);
  
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState<Vendor | null>(null);
  const [deleteInputName, setDeleteInputName] = useState('');

  const getVendorPlan = (vendor: Vendor | null) => vendor ? plans.find((p) => p.id === vendor.plan_id) : undefined;
  const getVendorItemLimit = (vendor: Vendor | null) => {
    const plan = getVendorPlan(vendor);
    if (!plan) return 5;
    if (plan.max_items === -1 || plan.name?.toLowerCase().includes('premium')) return Infinity;
    return Math.max(0, plan.max_items);
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
    try {
      const [{ data: v }, { data: p }, { data: m }, { data: a }] = await Promise.all([
        supabase.from('vendors').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_plans').select('*'),
        supabase.from('master_inventory').select('*'),
        supabase.from('addons').select('*')
      ]);
      const normalizedVendors = (v || []).map((item: any) => ({
        ...item,
        id: item.id || item._id
      }));
      setVendors(normalizedVendors);
      setPlans(p || []);
      setMasterItems(m || []);
      setAddons(a || []);
    } catch (err) {
      console.error("Error loading SuperAdmin data:", err);
    } finally {
      setLoading(false);
    }
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
    const vendorId = editVendor.id || (editVendor as any)._id;
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
    }).eq('id', vendorId);

    await supabase.from('activity_log').insert({
      action: `Vendor details edited: ${formData.shop_name}`,
      actor: 'Super Admin'
    });

    show('Vendor updated successfully');
    setEditVendor(null);
    load();
  };

  const [selectedTargetSub, setSelectedTargetSub] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');

  const handleAssignCategoryPlan = async () => {
    if (!editVendor || !assignPlanId) return;
    const vendorId = editVendor.id || (editVendor as any)._id;
    const planToAssign = plans.find(p => p.id === assignPlanId);
    if (!planToAssign) return;

    const existingSubs: VendorSubscription[] = Array.isArray(editVendor.active_subscriptions) && editVendor.active_subscriptions.length > 0
      ? [...editVendor.active_subscriptions]
      : [{
          id: 'primary',
          plan_id: editVendor.plan_id || undefined,
          plan_name: editVendor.plan_name || 'Basic',
          category_name: 'General',
          subscription_start: editVendor.subscription_start || new Date().toISOString().slice(0, 10),
          subscription_end: editVendor.subscription_end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          max_items: 5,
          max_clients: editVendor.total_clients || 10,
          status: 'active'
        }];

    const newSub: VendorSubscription = {
      id: crypto.randomUUID(),
      plan_id: planToAssign.id,
      plan_name: planToAssign.name,
      category_name: planToAssign.master_category_name || 'General',
      subscription_start: new Date().toISOString().slice(0, 10),
      subscription_end: new Date(Date.now() + planToAssign.validity_days * 86400000).toISOString().slice(0, 10),
      max_items: planToAssign.max_items,
      max_clients: planToAssign.max_clients,
      status: 'active'
    };

    existingSubs.push(newSub);

    await supabase.from('vendors').update({
      active_subscriptions: existingSubs,
      plan_name: planToAssign.name
    }).eq('id', vendorId);

    await supabase.from('activity_log').insert({
      action: `Category subscription ${planToAssign.name} (${newSub.category_name}) assigned to ${editVendor.shop_name}`,
      actor: 'Super Admin'
    });

    show(`Category subscription ${planToAssign.name} assigned to ${editVendor.shop_name}!`);
    setAssignPlanId('');
    load();
    setEditVendor(null);
  };

  const handleApplyAddon = async () => {
    if (!editVendor || !selectedAddon) return;
    const vendorId = editVendor.id || (editVendor as any)._id;
    const addon = addons.find(a => a.id === selectedAddon);
    if (!addon) return;

    let activeSubs: VendorSubscription[] = Array.isArray(editVendor.active_subscriptions) && editVendor.active_subscriptions.length > 0
      ? [...editVendor.active_subscriptions]
      : [{
          id: 'primary',
          plan_id: editVendor.plan_id || undefined,
          plan_name: editVendor.plan_name || 'Basic',
          category_name: 'General',
          subscription_start: editVendor.subscription_start || new Date().toISOString().slice(0, 10),
          subscription_end: editVendor.subscription_end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          max_items: 5,
          max_clients: editVendor.total_clients || 10,
          status: 'active'
        }];

    const targetIdx = selectedTargetSub ? activeSubs.findIndex(s => s.id === selectedTargetSub || s.category_name === selectedTargetSub) : 0;
    const targetSub = activeSubs[targetIdx >= 0 ? targetIdx : 0];

    if (targetSub) {
      if (addon.addon_type === 'inventory_items' || addon.max_items > 0) {
        targetSub.max_items = (targetSub.max_items ?? 5) + (addon.max_items ?? 20);
      }
      if (addon.addon_type === 'validity_extension' || addon.validity_days > 0) {
        const currentEnd = targetSub.subscription_end ? new Date(targetSub.subscription_end) : new Date();
        targetSub.subscription_end = new Date(currentEnd.getTime() + addon.validity_days * 86400000).toISOString().slice(0, 10);
      }
      if (addon.addon_type === 'client_extension' || addon.max_clients > 0) {
        targetSub.max_clients = (targetSub.max_clients ?? 10) + addon.max_clients;
      }
      activeSubs[targetIdx >= 0 ? targetIdx : 0] = targetSub;
    }

    const currentEnd = editVendor.subscription_end ? new Date(editVendor.subscription_end) : new Date();
    const newEnd = new Date(currentEnd.getTime() + addon.validity_days * 86400000).toISOString().slice(0, 10);
    const newAddonMax = (editVendor.addon_max_clients || 0) + addon.max_clients;

    await supabase.from('vendors').update({
      active_subscriptions: activeSubs,
      subscription_end: newEnd,
      addon_max_clients: newAddonMax,
      addon_name: addon.name
    }).eq('id', vendorId);

    await supabase.from('activity_log').insert({
      action: `Add-on ${addon.name} applied specifically to ${targetSub?.category_name || 'General'} subscription of ${editVendor.shop_name}`,
      actor: 'Super Admin'
    });

    show(`Add-on applied to ${targetSub?.category_name || 'selected'} category subscription!`);
    load();
    setEditVendor(null);
    setSelectedAddon('');
    setSelectedTargetSub('');
  };

  const handleRevokeCategorySub = async (subId: string) => {
    if (!editVendor) return;
    const vendorId = editVendor.id || (editVendor as any)._id;
    const existingSubs: VendorSubscription[] = Array.isArray(editVendor.active_subscriptions)
      ? [...editVendor.active_subscriptions]
      : [];

    const targetSub = existingSubs.find(s => s.id === subId || s.category_name === subId);
    const updatedSubs = existingSubs.filter(s => s.id !== subId && s.category_name !== subId);

    await supabase.from('vendors').update({
      active_subscriptions: updatedSubs
    }).eq('id', vendorId);

    await supabase.from('activity_log').insert({
      action: `Category subscription ${targetSub?.category_name || 'Category'} revoked for ${editVendor.shop_name}`,
      actor: 'Super Admin'
    });

    show(`Revoked category subscription for ${targetSub?.category_name || 'Category'}`);
    load();
    setEditVendor(prev => prev ? { ...prev, active_subscriptions: updatedSubs } : null);
  };

  const handleEditCategorySub = async (subId: string, newEndDate: string, newMaxItems: number) => {
    if (!editVendor) return;
    const vendorId = editVendor.id || (editVendor as any)._id;
    const existingSubs: VendorSubscription[] = Array.isArray(editVendor.active_subscriptions)
      ? [...editVendor.active_subscriptions]
      : [];

    const updatedSubs = existingSubs.map(s => {
      if (s.id === subId || s.category_name === subId) {
        return { ...s, subscription_end: newEndDate, max_items: Number(newMaxItems) };
      }
      return s;
    });

    await supabase.from('vendors').update({
      active_subscriptions: updatedSubs
    }).eq('id', vendorId);

    await supabase.from('activity_log').insert({
      action: `Category subscription updated for ${editVendor.shop_name} (End: ${newEndDate}, Max Items: ${newMaxItems})`,
      actor: 'Super Admin'
    });

    show(`Updated category subscription parameters!`);
    load();
    setEditVendor(prev => prev ? { ...prev, active_subscriptions: updatedSubs } : null);
  };

  const handlePrepareEdit = async (v: Vendor) => {
    const vid = v.id || (v as any)._id;
    const normalizedVendor: Vendor = {
      ...v,
      id: vid,
      active_subscriptions: Array.isArray(v.active_subscriptions) && v.active_subscriptions.length > 0
        ? v.active_subscriptions
        : [{
            id: 'primary',
            plan_name: v.plan_name || 'Basic Plan',
            category_name: 'General',
            subscription_start: v.subscription_start || new Date().toISOString().slice(0, 10),
            subscription_end: v.subscription_end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            max_items: 5,
            status: 'active'
          }]
    };
    setEditVendor(normalizedVendor);

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'vendors', action: 'select', filters: { _id: vid } })
      });
      const result = await res.json();
      if (result && result.data && result.data.length > 0) {
        const fresh = result.data[0];
        setEditVendor({
          ...fresh,
          id: fresh.id || fresh._id,
          active_subscriptions: Array.isArray(fresh.active_subscriptions) && fresh.active_subscriptions.length > 0
            ? fresh.active_subscriptions
            : normalizedVendor.active_subscriptions
        });
      }
    } catch (err) {
      console.log('Background fresh load notice:', err);
    }
  };

  const handleView = async (v: Vendor) => {
    const vid = v.id || (v as any)._id;
    const { data: freshVendor } = await supabase.from('vendors').select('*').eq('id', vid).single();
    if (freshVendor) {
      setViewVendor({ ...freshVendor, id: freshVendor.id || (freshVendor as any)._id });
    } else {
      setViewVendor({ ...v, id: vid });
    }
    const { data } = await supabase.from('vendor_inventory').select('*').eq('vendor_id', vid);
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
      const compressedFile = await compressImageFile(file);
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      let resData;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        resData = await res.json();
      } else {
        const text = await res.text();
        if (res.status === 413 || text.includes('413')) throw new Error('Image too large. Please upload a smaller image.');
        throw new Error(`Server returned HTML error (${res.status}) instead of JSON`);
      }
      
      if (!res.ok) throw new Error(resData?.error || 'Image upload failed');

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

  // Memoized expiry cache: days remaining per vendor id
  const expiryCache = useMemo(() => {
    const cache: Record<string, number> = {};
    const now = Date.now();
    vendors.forEach(v => {
      const endDate = v.subscription_end ? new Date(v.subscription_end).getTime() : 0;
      cache[v.id] = Math.ceil((endDate - now) / 86400000);
    });
    return cache;
  }, [vendors]);

  // Derive unique categories across all vendor active subscriptions for the filter dropdown
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    vendors.forEach(v => {
      if (Array.isArray(v.active_subscriptions) && v.active_subscriptions.length > 0) {
        v.active_subscriptions.forEach((s: any) => { if (s.category_name) cats.add(s.category_name); });
      } else if (v.plan_name) {
        cats.add(v.plan_name);
      }
    });
    return Array.from(cats).sort();
  }, [vendors]);

  const filtered = useMemo(() => vendors.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = v.shop_name.toLowerCase().includes(q) ||
      v.owner_name.toLowerCase().includes(q) ||
      (v.phone || '').includes(search);
    const matchFilter = filter === 'all' || v.status === filter;

    const matchCategory = filterCategory === 'all' || (
      Array.isArray(v.active_subscriptions) && v.active_subscriptions.some((s: any) =>
        s.category_name === filterCategory || s.plan_name === filterCategory
      )
    ) || v.plan_name === filterCategory;

    const daysLeft = expiryCache[v.id] ?? 999;
    const matchHealth = filterHealth === 'all' ||
      (filterHealth === 'expiring' && daysLeft > 0 && daysLeft <= 7) ||
      (filterHealth === 'expired' && daysLeft <= 0) ||
      (filterHealth === 'active' && daysLeft > 7);

    const matchZip = !filterZip.trim() ||
      (v.zip_code || '').substring(0, 3) === filterZip.trim().substring(0, 3);

    return matchSearch && matchFilter && matchCategory && matchHealth && matchZip;
  }), [vendors, search, filter, filterCategory, filterHealth, filterZip, expiryCache]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Reset to page 1 when filter changes
  const resetPage = () => setCurrentPage(1);

  // Batch operations
  const handleBatchExtendValidity = async () => {
    if (selectedVendorIds.size === 0) return;
    setBatchLoading(true);
    const targetVendors = vendors.filter(v => selectedVendorIds.has(v.id));
    await Promise.all(targetVendors.map(async v => {
      let activeSubs: any[] = Array.isArray(v.active_subscriptions) && v.active_subscriptions.length > 0
        ? [...v.active_subscriptions]
        : [{ id: 'primary', plan_name: v.plan_name || 'Basic', category_name: 'General',
            subscription_end: v.subscription_end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            max_items: 5, max_clients: 10, status: 'active' }];

      activeSubs = activeSubs.map(s => {
        if (batchCategory === 'all' || s.category_name === batchCategory || s.plan_name === batchCategory) {
          const currentEnd = s.subscription_end ? new Date(s.subscription_end) : new Date();
          return { ...s, subscription_end: new Date(currentEnd.getTime() + batchDays * 86400000).toISOString().slice(0, 10) };
        }
        return s;
      });

      const primaryEnd = v.subscription_end ? new Date(v.subscription_end) : new Date();
      const newEnd = new Date(primaryEnd.getTime() + batchDays * 86400000).toISOString().slice(0, 10);

      await supabase.from('vendors').update({
        active_subscriptions: activeSubs,
        subscription_end: newEnd
      }).eq('id', v.id);

      await supabase.from('activity_log').insert({
        action: `Batch extended validity by ${batchDays} days for ${batchCategory === 'all' ? 'all categories' : batchCategory} — ${v.shop_name}`,
        actor: 'Super Admin'
      });
    }));
    setBatchLoading(false);
    setBatchExtendOpen(false);
    setSelectedVendorIds(new Set());
    setBatchCategory('all');
    setBatchDays(30);
    show(`Validity extended by ${batchDays} days for ${targetVendors.length} vendors!`, 'success');
    load();
  };

  const handleBatchExportCSV = () => {
    const selected = vendors.filter(v => selectedVendorIds.has(v.id));
    exportCSV(selected.map(v => ({
      shop_name: v.shop_name,
      owner_name: v.owner_name,
      phone: v.phone,
      zip_code: v.zip_code,
      plan_name: v.plan_name,
      status: v.status,
      subscription_end: v.subscription_end,
      days_remaining: expiryCache[v.id] ?? 'N/A'
    })), 'selected_vendors_export');
    show(`Exported ${selectedVendorIds.size} vendors to CSV`, 'success');
  };

  const toggleVendorSelect = (id: string) => {
    setSelectedVendorIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVendorIds.size === paginatedVendors.length) {
      setSelectedVendorIds(new Set());
    } else {
      setSelectedVendorIds(new Set(paginatedVendors.map(v => v.id)));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Category Subscription Popover */}
      {popoverSub && (
        <div
          ref={popoverRef}
          className="fixed z-[9999] bg-white border border-amber-300 rounded-2xl shadow-2xl p-4 w-72 animate-fade-in"
          style={{ top: popoverSub.anchorRect.bottom + 8, left: Math.min(popoverSub.anchorRect.left, window.innerWidth - 300) }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black uppercase tracking-wider text-[#4A0E17]">Category Subscription Detail</p>
            <button onClick={() => setPopoverSub(null)} className="text-slate-400 hover:text-slate-700"><X size={14} /></button>
          </div>
          <p className="text-sm font-extrabold text-slate-900 mb-1">{popoverSub.sub.category_name || popoverSub.sub.plan_name}</p>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between"><span>Item Slots Used</span><span className="font-bold text-slate-900">? / {popoverSub.sub.max_items ?? 5}</span></div>
            <div className="flex justify-between"><span>Client Limit</span><span className="font-bold text-slate-900">{popoverSub.sub.max_clients ?? 10}</span></div>
            <div className="flex justify-between"><span>Expires</span><span className="font-bold text-slate-900">{popoverSub.sub.subscription_end || 'N/A'}</span></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 text-xs font-bold py-1.5 rounded-xl bg-[#4A0E17] text-[#C5A059] hover:opacity-90 transition-opacity" onClick={() => setPopoverSub(null)}>Extend Validity</button>
            <button className="flex-1 text-xs font-bold py-1.5 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors" onClick={() => setPopoverSub(null)}>Add Items</button>
          </div>
        </div>
      )}

      <PageHeader 
        title="Vendor Database" 
        subtitle={`${vendors.length} total vendors registered · ${filtered.length} shown`} 
        action={
          <div className="flex gap-2">
            <Button onClick={() => exportCSV(filtered, 'all_vendors')} className="bg-[#4A0E17] text-[#C5A059] border border-[#C5A059]/40 hover:bg-[#360910] font-extrabold shadow-md flex items-center px-4 py-2.5 rounded-xl cursor-pointer">
              <Download size={18} className="mr-2" /> Export All
            </Button>
            <Button onClick={() => setCreateMode(true)} className="bg-[#4A0E17] text-[#C5A059] hover:opacity-90">
              <Plus size={18} className="mr-2" /> Add Vendor
            </Button>
          </div>
        }
      />

      {/* Advanced Filter Bar */}
      <div className="bg-[#f9f1e5] p-4 rounded-2xl border border-amber-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              placeholder="Search by name, owner, phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-amber-200 text-slate-900 text-sm focus:border-amber-400 outline-none"
            />
          </div>
          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); resetPage(); }}
            className="px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-sm font-semibold text-slate-900 focus:border-amber-400 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Live (Approved)</option>
            <option value="pending_approval">Pending Review</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); resetPage(); }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-sm font-semibold text-slate-900 focus:border-amber-400 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          {/* Subscription Health Filter */}
          <select
            value={filterHealth}
            onChange={(e) => { setFilterHealth(e.target.value); resetPage(); }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-sm font-semibold text-slate-900 focus:border-amber-400 outline-none cursor-pointer"
          >
            <option value="all">All Health</option>
            <option value="active">✅ Active (&gt;7 days)</option>
            <option value="expiring">⚠️ Expiring Soon (&lt;7 days)</option>
            <option value="expired">🔴 Expired</option>
          </select>
          {/* Zip Cluster Search */}
          <div className="relative flex-1">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={filterZip}
              onChange={(e) => { setFilterZip(e.target.value); resetPage(); }}
              placeholder="Zip cluster (e.g. 560)"
              maxLength={6}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-amber-200 text-slate-900 text-sm focus:border-amber-400 outline-none"
            />
          </div>
          {/* Page size */}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); resetPage(); }}
            className="px-3 py-2.5 rounded-xl bg-white border border-amber-200 text-sm font-semibold text-slate-900 focus:border-amber-400 outline-none cursor-pointer"
          >
            <option value={15}>15 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={9999}>View All</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden bg-[#f7efe3] border border-amber-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2dfc8] text-xs font-bold text-slate-700 uppercase tracking-wider">
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedVendorIds.size > 0 && selectedVendorIds.size === paginatedVendors.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded cursor-pointer accent-[#4A0E17]"
                    aria-label="Select all vendors on this page"
                  />
                </th>
                <th className="px-6 py-4">Shop Name</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">ZIP</th>
                <th className="px-6 py-4">Category Subscriptions</th>
                <th className="px-6 py-4">Health</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200 text-sm text-slate-800">
              {paginatedVendors.map((v) => {
                const daysLeft = expiryCache[v.id] ?? 999;
                const isSelected = selectedVendorIds.has(v.id);
                return (
                  <tr key={v.id} className={`hover:bg-[#f5e9d9] transition-all ${isSelected ? 'bg-amber-50 ring-1 ring-inset ring-amber-400' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleVendorSelect(v.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-[#4A0E17]"
                        aria-label={`Select ${v.shop_name}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {v.logo_url ? (
                          <img src={v.logo_url} alt={v.shop_name} className="w-10 h-10 rounded-xl object-cover border border-amber-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#f1e2cd] flex items-center justify-center border border-amber-200"><Store size={16} className="text-slate-600" /></div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{v.shop_name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Since: {v.subscription_start || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{v.owner_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{v.phone}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{v.zip_code}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(v.active_subscriptions) && v.active_subscriptions.length > 0 ? (
                          v.active_subscriptions.map((sub: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setPopoverSub(prev => prev?.sub === sub ? null : { sub, anchorRect: rect });
                              }}
                              className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#4A0E17] text-[#C5A059] border border-[#C5A059]/30 hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              🟢 {sub.category_name || sub.plan_name || 'General'}
                            </button>
                          ))
                        ) : (
                          <Badge variant="accent">{v.plan_name || 'Free'}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {daysLeft > 7 ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-700"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>{daysLeft}d left</span>
                      ) : daysLeft > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block"></span>Exp in {daysLeft}d</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Expired</span>
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Store size={28} />} title="No vendors found" />}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-amber-200 bg-[#f9f1e5]">
            <p className="text-xs text-slate-500 font-semibold">
              Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} vendors
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-amber-200 text-slate-700 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all ${
                      pg === currentPage
                        ? 'bg-[#4A0E17] text-[#C5A059] border border-[#C5A059]/40'
                        : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-amber-200 text-slate-700 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Operations Sticky Bar */}
      {selectedVendorIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#4A0E17] text-[#C5A059] px-6 py-3.5 rounded-2xl shadow-2xl border border-[#C5A059]/30 animate-fade-in-up">
          <span className="text-sm font-extrabold">{selectedVendorIds.size} vendor{selectedVendorIds.size > 1 ? 's' : ''} selected</span>
          <div className="w-px h-5 bg-[#C5A059]/30" />
          <button
            onClick={() => setBatchExtendOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#C5A059] text-[#4A0E17] hover:opacity-90 transition-opacity"
          >
            <Clock size={14} /> Extend Validity
          </button>
          <button
            onClick={handleBatchExportCSV}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 text-[#C5A059] border border-[#C5A059]/30 hover:bg-white/20 transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setSelectedVendorIds(new Set())}
            className="ml-1 text-[#C5A059]/60 hover:text-[#C5A059] transition-colors"
            aria-label="Deselect all"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Batch Extend Validity Modal — Prompts for Primary Category */}
      <Modal open={batchExtendOpen} onClose={() => setBatchExtendOpen(false)} title="Batch Extend Validity" size="sm">
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-semibold">
            Extending validity for <span className="font-black">{selectedVendorIds.size}</span> selected vendors.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Category Subscription</label>
            <select
              value={batchCategory}
              onChange={e => setBatchCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-sm font-semibold text-slate-900 focus:border-amber-400 outline-none cursor-pointer"
            >
              <option value="all">All Active Subscriptions</option>
              {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <p className="text-[10px] text-slate-500">Choose a specific category subscription or apply to all.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Extension Days</label>
            <div className="flex gap-2">
              {[7, 15, 30, 60, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setBatchDays(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                    batchDays === d
                      ? 'bg-[#4A0E17] text-[#C5A059] border-[#C5A059]/40'
                      : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-50'
                  }`}
                >
                  +{d}d
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setBatchExtendOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-[#4A0E17] text-[#C5A059] hover:opacity-90"
              onClick={handleBatchExtendValidity}
              disabled={batchLoading}
            >
              {batchLoading ? 'Extending...' : `Extend +${batchDays} Days`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Vendor Modal */}
      <Modal open={createMode} onClose={() => setCreateMode(false)} title="Create New Vendor" size="xl">
        <VendorForm submitLabel="Create Vendor" onSubmit={handleCreateSubmit} onCancel={() => setCreateMode(false)} />
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal open={!!editVendor} onClose={() => { setEditVendor(null); setInlineEditSubId(null); }} title="Modify Vendor Record & Subscriptions" size="xl">
        {editVendor && (
          <div className="space-y-6">
            {/* Executive Subscription Capacity Summary Header */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#4A0E17] to-[#360910] text-white border border-[#C5A059]/40 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div>
                <h3 className="font-extrabold text-base text-[#C5A059] flex items-center gap-2">
                  <Store size={18} /> {editVendor.shop_name}
                </h3>
                <p className="text-xs text-white/80 mt-0.5 font-medium">Owner: {editVendor.owner_name} · 📞 {editVendor.phone}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                  <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">Active Categories</p>
                  <p className="text-sm font-extrabold text-white">
                    {Array.isArray(editVendor.active_subscriptions) ? editVendor.active_subscriptions.length : 1} Tiers
                  </p>
                </div>
                <div className="text-right px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                  <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">Total Item Quota</p>
                  <p className="text-sm font-extrabold text-white">
                    {(Array.isArray(editVendor.active_subscriptions) && editVendor.active_subscriptions.length > 0
                      ? editVendor.active_subscriptions.reduce((sum: number, s: any) => sum + (s.max_items ?? 5), 0)
                      : 5)} Items
                  </p>
                </div>
              </div>
            </div>

            <VendorForm 
              key={editVendor.id}
              initialData={editVendor} 
              submitLabel="Save Account Changes" 
              onSubmit={handleEditSubmit} 
              onCancel={() => setEditVendor(null)} 
            />
            
            {/* Active Category Subscriptions Portfolio */}
            <div className="p-5 border border-amber-300 bg-[#fffdf9] rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-2">
                  <Package size={16} className="text-amber-700" /> Active Category Subscriptions Portfolio
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {Array.isArray(editVendor.active_subscriptions) ? editVendor.active_subscriptions.length : 1} Active Plans
                </span>
              </div>

              <div className="space-y-3">
                {(Array.isArray(editVendor.active_subscriptions) && editVendor.active_subscriptions.length > 0 ? editVendor.active_subscriptions : [{
                  id: 'primary',
                  plan_name: editVendor.plan_name || 'Basic Plan',
                  category_name: 'General',
                  subscription_start: editVendor.subscription_start || new Date().toISOString().slice(0, 10),
                  subscription_end: editVendor.subscription_end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                  max_items: 5,
                  status: 'active'
                }]).map((sub: any, idx: number) => {
                  const today = new Date().toISOString().slice(0, 10);
                  const isExpired = sub.subscription_end && sub.subscription_end < today;
                  const daysRemaining = sub.subscription_end ? Math.ceil((new Date(sub.subscription_end).getTime() - Date.now()) / (1000 * 3600 * 24)) : 0;
                  const subKey = sub.id || sub.category_name || idx;
                  const isEditingInline = inlineEditSubId === subKey;

                  if (isEditingInline) {
                    return (
                      <div key={subKey} className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-400 space-y-3 animate-fade-in shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                            <Pencil size={14} className="text-amber-700" /> Editing Subscription: <strong>{sub.category_name || 'General'}</strong>
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900 border border-amber-300">{sub.plan_name || 'Plan'}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">Expiration Date (YYYY-MM-DD)</label>
                            <input
                              type="date"
                              value={inlineEditEnd}
                              onChange={(e) => setInlineEditEnd(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">Max Item Capacity Limit</label>
                            <input
                              type="number"
                              min="0"
                              value={inlineEditLimit}
                              onChange={(e) => setInlineEditLimit(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button size="sm" variant="ghost" onClick={() => setInlineEditSubId(null)}>Cancel</Button>
                          <Button
                            size="sm"
                            className="bg-[#4A0E17] text-[#C5A059] hover:bg-[#360910] font-extrabold cursor-pointer"
                            onClick={() => {
                              handleEditCategorySub(subKey, inlineEditEnd, inlineEditLimit);
                              setInlineEditSubId(null);
                            }}
                          >
                            Save Category Changes
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={subKey} className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900">{sub.category_name || 'General'}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-amber-100 text-amber-800 border border-amber-200">{sub.plan_name || 'Plan'}</span>
                          {isExpired ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-100 text-red-700 border border-red-200">🔴 EXPIRED</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-green-100 text-green-700 border border-green-200">🟢 ACTIVE ({daysRemaining}d left)</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Valid: <strong className="text-slate-800">{sub.subscription_start || 'N/A'}</strong> to <strong className="text-slate-800">{sub.subscription_end || 'N/A'}</strong> | Item Capacity: <strong className="text-amber-800">{sub.max_items ?? 5} items</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setInlineEditSubId(subKey);
                            setInlineEditEnd(sub.subscription_end || today);
                            setInlineEditLimit(sub.max_items ?? 5);
                          }}
                        >
                          <Pencil size={12} /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm(`Are you sure you want to revoke/delete category plan "${sub.category_name}" for ${editVendor.shop_name}?`)) {
                              handleRevokeCategorySub(subKey);
                            }
                          }}
                        >
                          <Trash2 size={12} /> Revoke
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assign Additional Category Subscription */}
            <div className="p-5 border border-amber-300 bg-white rounded-2xl space-y-3 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} className="text-[#C5A059]" /> Assign Additional Category Subscription
              </h3>
              <p className="text-xs text-slate-500">Add another active category plan (e.g. Dairy, Bakery, Produce) to this vendor's portfolio.</p>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <select 
                    value={assignPlanId}
                    onChange={(e) => setAssignPlanId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-slate-800 text-sm focus:border-amber-400 outline-none"
                  >
                    <option value="">-- Select Category Plan to Assign --</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.master_category_name || 'All Categories'}) — ₹{p.price} / {p.validity_days}d
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleAssignCategoryPlan} disabled={!assignPlanId}>Assign Category Plan</Button>
              </div>
            </div>

            {/* Apply Add-on Package with Specific Category Target */}
            <div className="p-5 border border-accent/20 bg-[#f9f1e5] rounded-2xl space-y-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Apply Add-on Package to Specific Category</h3>
              <p className="text-xs text-slate-500">Assign Extra Inventory, Validity, or Clients specifically to a chosen active category subscription.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">1. Select Add-on Package</label>
                  <select 
                    value={selectedAddon} 
                    onChange={(e) => setSelectedAddon(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-slate-800 text-sm focus:border-amber-400 outline-none"
                  >
                    <option value="">-- Select Add-on Package --</option>
                    {addons.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.addon_type === 'inventory_items' ? `+${a.max_items || 20} items` : `+${a.validity_days}d, +${a.max_clients} clients`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">2. Target Category Subscription</label>
                  <select
                    value={selectedTargetSub}
                    onChange={(e) => setSelectedTargetSub(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-slate-800 text-sm focus:border-amber-400 outline-none"
                  >
                    <option value="">-- Primary / General Category --</option>
                    {Array.isArray(editVendor.active_subscriptions) && editVendor.active_subscriptions.map((sub: any, idx: number) => (
                      <option key={sub.id || idx} value={sub.id || sub.category_name}>
                        {sub.category_name || sub.plan_name || `Subscription #${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleApplyAddon} disabled={!selectedAddon}>Apply Add-on to Category</Button>
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

// 3. Team Approvals Module
function ApprovalsTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [activeTab, setActiveTab] = useState<'vendors' | 'upgrades' | 'subadmin'>('vendors');
  const [vendorRequests, setVendorRequests] = useState<Vendor[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [subadminRequests, setSubadminRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeRequest | null>(null);
  const [selectedSubadminReq, setSelectedSubadminReq] = useState<any | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [qaStatusFilter, setQaStatusFilter] = useState<'all' | 'pending' | 'responded' | 'resolved'>('all');

  const load = async () => {
    const [{ data: v }, { data: u }, { data: s }, suggRes] = await Promise.all([
      supabase.from('vendors').select('*').eq('status', 'pending_approval'),
      supabase.from('upgrade_requests').select('*').eq('status', 'pending'),
      supabase.from('subadmin_requests').select('*').eq('status', 'pending'),
      fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'vendor_suggestions', action: 'select' })
      }).then(r => r.json())
    ]);
    setVendorRequests(v || []);
    setUpgradeRequests(u || []);
    setSubadminRequests(s || []);
    setSuggestions(suggRes?.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleReplySuggestion = async (id: string) => {
    const replyText = replyInputs[id];
    if (!replyText || !replyText.trim()) return;
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'vendor_suggestions',
        action: 'update',
        filters: { _id: id },
        data: { admin_reply: replyText.trim(), status: 'Responded', updated_at: new Date().toISOString() }
      })
    });
    setReplyInputs(prev => ({ ...prev, [id]: '' }));
    show('Reply sent to vendor successfully!');
    load();
  };

  const handleResolveSuggestion = async (id: string) => {
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'vendor_suggestions',
        action: 'update',
        filters: { _id: id },
        data: { status: 'Resolved', updated_at: new Date().toISOString() }
      })
    });
    show('Suggestion marked as resolved!');
    load();
  };

  const handleDeleteSuggestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this suggestion?')) {
      await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vendor_suggestions',
          action: 'delete',
          filters: { _id: id }
        })
      });
      show('Suggestion removed', 'info');
      load();
    }
  };

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

  // Real-time notice to the approved vendor's dashboard, distinct from the generic
  // vendorUpdated broadcast that already fires from the vendors-table update below —
  // that one fires for any vendor edit, so it can't by itself distinguish "my upgrade
  // request was approved" from an unrelated admin correction.
  const notifyUpgradeApproved = async (payload: { vendor_id: string; plan_name: string; subscription_end: string; max_items?: number; max_clients?: number }) => {
    try {
      await fetch('/api/notify/upgrade-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error('Failed to broadcast upgrade approval notification:', e);
    }
  };

  const handleApproveUpgrade = async (u: UpgradeRequest) => {
    const targetPlan = await supabase.from('subscription_plans').select('*').eq('name', u.requested_plan).maybeSingle();
    const plan = targetPlan?.data as Plan;
    const validityDays = plan?.validity_days || 30;
    const subscriptionEnd = new Date(Date.now() + validityDays * 86400000).toISOString().slice(0, 10);

    // Update vendor subscription plan details
    await supabase.from('vendors').update({
      plan_id: plan?.id || null,
      plan_name: u.requested_plan,
      status: 'approved',
      subscription_start: new Date().toISOString().slice(0, 10),
      subscription_end: subscriptionEnd
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

    await notifyUpgradeApproved({
      vendor_id: u.vendor_id,
      plan_name: u.requested_plan,
      subscription_end: subscriptionEnd,
      max_items: plan?.max_items,
      max_clients: plan?.max_clients
    });

    show(`Upgrade request for ${u.vendor_name} approved!`);
    setSelectedUpgrade(null);
    load();
  };

  const handleBatchApproveUpgrades = async () => {
    const eligible = upgradeRequests.filter((u: any) => u.status !== 'Approved');
    if (eligible.length === 0) {
      show('No pending upgrade requests to batch approve', 'info');
      return;
    }

    try {
      for (const u of eligible) {
        const targetPlan = plans.find(p => p.name === u.requested_plan);
        const validityDays = targetPlan?.validity_days || 30;
        const subscriptionEnd = new Date(Date.now() + validityDays * 86400000).toISOString().slice(0, 10);

        await supabase.from('vendors').update({
          plan_id: targetPlan?.id || null,
          plan_name: u.requested_plan,
          status: 'approved',
          subscription_start: new Date().toISOString().slice(0, 10),
          subscription_end: subscriptionEnd
        }).eq('id', u.vendor_id);

        await supabase.from('upgrade_requests').update({
          status: 'Approved',
          payment_status: 'Verified'
        }).eq('id', u.id);

        await notifyUpgradeApproved({
          vendor_id: u.vendor_id,
          plan_name: u.requested_plan,
          subscription_end: subscriptionEnd,
          max_items: targetPlan?.max_items,
          max_clients: targetPlan?.max_clients
        });
      }

      show(`Batch approved & activated ${eligible.length} subscription upgrades!`, 'success');
      load();
    } catch (err: any) {
      console.error(err);
      show('Failed to batch approve upgrades', 'error');
    }
  };

  const handleRejectUpgrade = async (u: any) => {
    try {
      await supabase.from('upgrade_requests').update({
        status: 'Rejected',
        payment_status: 'Failed'
      }).eq('id', u.id);

      await supabase.from('activity_log').insert({
        action: `Upgrade request rejected for vendor: ${u.vendor_name}`,
        actor: 'Super Admin'
      });

      show('Upgrade request rejected', 'info');
      setSelectedUpgrade(null);
      load();
    } catch (err: any) {
      console.error(err);
      show('Failed to reject upgrade', 'error');
    }
  };

  const handleApproveSubadminReq = async (req: any) => {
    try {
      if (req.action_type === 'delete') {
        await supabase.from('vendors').delete().eq('id', req.vendor_id);
        await supabase.from('vendor_inventory').delete().eq('vendor_id', req.vendor_id);
      } else if (req.action_type === 'add-on') {
        const payload = JSON.parse(req.payload);
        const { data: v } = await supabase.from('vendors').select('*').eq('id', req.vendor_id).single();
        if (v) {
          const currentEnd = v.subscription_end ? new Date(v.subscription_end) : new Date();
          const newEnd = new Date(currentEnd.getTime() + payload.validity_days * 86400000).toISOString().slice(0, 10);
          const newAddonMax = (v.addon_max_clients || 0) + payload.max_clients;

          await supabase.from('vendors').update({
            subscription_end: newEnd,
            addon_max_clients: newAddonMax,
            addon_name: payload.addon_name
          }).eq('id', req.vendor_id);
        }
      } else if (req.action_type === 'edit') {
        const payload = JSON.parse(req.payload);
        await supabase.from('vendors').update(payload).eq('id', req.vendor_id);
      } else if (req.action_type === 'assign_category') {
        const payload = JSON.parse(req.payload);
        const { data: v } = await supabase.from('vendors').select('*').eq('id', req.vendor_id).single();
        if (v) {
          const existingSubs: VendorSubscription[] = Array.isArray(v.active_subscriptions) && v.active_subscriptions.length > 0
            ? [...v.active_subscriptions]
            : [{
                id: 'primary',
                plan_id: v.plan_id || undefined,
                plan_name: v.plan_name || 'Basic',
                category_name: 'General',
                subscription_start: v.subscription_start || new Date().toISOString().slice(0, 10),
                subscription_end: v.subscription_end || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                max_items: 5,
                max_clients: v.total_clients || 10,
                status: 'active'
              }];

          const newSub: VendorSubscription = {
            id: crypto.randomUUID(),
            plan_id: payload.plan_id,
            plan_name: payload.plan_name,
            category_name: payload.category_name,
            subscription_start: new Date().toISOString().slice(0, 10),
            subscription_end: new Date(Date.now() + payload.validity_days * 86400000).toISOString().slice(0, 10),
            max_items: payload.max_items,
            max_clients: payload.max_clients,
            status: 'active'
          };
          existingSubs.push(newSub);

          await supabase.from('vendors').update({
            active_subscriptions: existingSubs,
            plan_name: payload.plan_name
          }).eq('id', req.vendor_id);
        }
      }

      await supabase.from('subadmin_requests').update({ status: 'approved' }).eq('id', req.id);

      await supabase.from('activity_log').insert({
        action: `Sub-Admin ${req.action_type} request approved for: ${req.vendor_name || 'Vendor'}`,
        actor: 'Super Admin'
      });

      show(`Sub-Admin ${req.action_type} request approved successfully!`);
      setSelectedSubadminReq(null);
      load();
    } catch (err: any) {
      console.error(err);
      show('Failed to approve Sub-Admin request', 'error');
    }
  };

  const handleRejectSubadminReq = async (req: any) => {
    try {
      await supabase.from('subadmin_requests').update({ status: 'rejected' }).eq('id', req.id);

      await supabase.from('activity_log').insert({
        action: `Sub-Admin request rejected for vendor: ${req.vendor_name || 'Vendor'}`,
        actor: 'Super Admin'
      });

      show('Sub-Admin request rejected', 'info');
      setSelectedSubadminReq(null);
      load();
    } catch (err: any) {
      console.error(err);
      show('Failed to reject request', 'error');
    }
  };

  if (loading) return <Spinner />;

  const pendingSuggestionsCount = suggestions.filter((s: any) => !s.status || s.status === 'Pending').length;
  const pendingUpgradesCount = upgradeRequests.filter((u: any) => u.status !== 'Approved').length;
  const pendingSubadminCount = subadminRequests.filter((r: any) => !r.status || r.status === 'pending').length;
  const pendingCount = pendingSuggestionsCount + pendingUpgradesCount + pendingSubadminCount;

  const filteredSuggestions = suggestions.filter((s: any) => {
    const st = (s.status || 'Pending').toLowerCase();
    if (qaStatusFilter === 'pending') return st === 'pending';
    if (qaStatusFilter === 'responded') return st === 'responded';
    if (qaStatusFilter === 'resolved') return st === 'resolved';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="Team Approvals Queue" 
        subtitle="Manage vendor Q&A, suggestions, and subscription upgrades"
        action={
          pendingCount > 0 ? (
            <span className="h-7 px-3 rounded-full bg-red-600 text-white font-extrabold text-xs flex items-center justify-center animate-pulse shadow-xs">
              {pendingCount} Pending Requests
            </span>
          ) : (
            <span className="h-7 px-3 rounded-full bg-green-100 text-green-800 font-extrabold text-xs flex items-center justify-center border border-green-300">
              ✅ All Caught Up
            </span>
          )
        }
      />

      {/* Dual Tab navigation */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'vendors' ? 'text-[#4A0E17] border-b-2 border-[#4A0E17]' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          Vendor's Q&A / Suggestion ({suggestions.length})
          {pendingSuggestionsCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {pendingSuggestionsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('upgrades')}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'upgrades' ? 'text-[#4A0E17] border-b-2 border-[#4A0E17]' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          Upgrade Requests ({upgradeRequests.length})
          {pendingUpgradesCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
              {pendingUpgradesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('subadmin')}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'subadmin' ? 'text-[#4A0E17] border-b-2 border-[#4A0E17]' : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          Sub-Admin Requests ({subadminRequests.length})
          {pendingSubadminCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
              {pendingSubadminCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'vendors' ? (
        <div className="space-y-4">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
            <button
              onClick={() => setQaStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                qaStatusFilter === 'all' ? 'bg-[#4A0E17] text-[#C5A059]' : 'text-[#6B7280] hover:bg-gray-100'
              }`}
            >
              All ({suggestions.length})
            </button>
            <button
              onClick={() => setQaStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                qaStatusFilter === 'pending' ? 'bg-amber-500 text-white' : 'text-amber-700 bg-amber-50'
              }`}
            >
              ⏳ Pending ({pendingSuggestionsCount})
            </button>
            <button
              onClick={() => setQaStatusFilter('responded')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                qaStatusFilter === 'responded' ? 'bg-blue-600 text-white' : 'text-blue-700 bg-blue-50'
              }`}
            >
              💬 Responded ({suggestions.filter((s: any) => s.status === 'Responded').length})
            </button>
            <button
              onClick={() => setQaStatusFilter('resolved')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                qaStatusFilter === 'resolved' ? 'bg-green-600 text-white' : 'text-green-700 bg-green-50'
              }`}
            >
              ✅ Resolved ({suggestions.filter((s: any) => s.status === 'Resolved').length})
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-[#111827] flex items-center gap-2">
              <MessageSquare size={18} className="text-[#C5A059]" /> Vendor Questions & Platform Suggestions
            </h3>
            {filteredSuggestions.length === 0 ? (
              <EmptyState icon={<MessageSquare size={24} />} title="No vendor Q&A or suggestions found" />
            ) : (
              <div className="space-y-4">
                {filteredSuggestions.map((s: any) => {
                  const sId = s._id || s.id;
                  const cleanPhone = (s.phone || '').replace(/\D/g, '');

                  return (
                    <div key={sId} className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111827] text-sm">{s.shop_name}</span>
                            <span className="text-xs text-[#6B7280]">({s.owner_name})</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(s.owner_name)}%2C%20regarding%20your%20query...`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold border border-green-300"
                              >
                                <MessageCircle size={10} className="text-green-700" /> WhatsApp
                              </a>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">Phone: 📞 {s.phone} | Date: {new Date(s.created_at || Date.now()).toLocaleString()}</p>
                        </div>
                        <Badge variant={s.status === 'Responded' || s.status === 'Resolved' ? 'success' : 'warning'}>
                          {s.status || 'Pending'}
                        </Badge>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-sm text-[#111827]">
                        <p className="font-semibold text-xs text-[#6B7280] uppercase tracking-wider mb-1">Vendor's Query / Suggestion:</p>
                        <p className="font-medium leading-relaxed">{s.message}</p>
                      </div>

                      {s.admin_reply && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                          <p className="font-bold text-amber-900 mb-0.5">Your Response:</p>
                          <p className="text-xs">{s.admin_reply}</p>
                        </div>
                      )}

                      {/* Quick Reply Presets */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <button
                          type="button"
                          onClick={() => setReplyInputs({ ...replyInputs, [sId]: 'Thank you for your suggestion! We are reviewing this feature for our next update.' })}
                          className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-[#374151] text-[10px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
                        >
                          💬 Preset: Suggestion Review
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyInputs({ ...replyInputs, [sId]: 'Thank you for reaching out! Your query has been logged and our support team is assisting you.' })}
                          className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-[#374151] text-[10px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
                        >
                          💬 Preset: Support Logged
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={replyInputs[sId] || ''}
                          onChange={(e) => setReplyInputs({ ...replyInputs, [sId]: e.target.value })}
                          placeholder="Type reply to vendor..."
                          className="flex-1 px-4 py-2 rounded-xl bg-white border border-gray-300 outline-none focus:ring-2 focus:ring-[#F1A80A] text-xs text-[#111827] placeholder:text-gray-400"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleReplySuggestion(sId)} disabled={!replyInputs[sId]?.trim()}>
                            Send Reply
                          </Button>
                          {s.status !== 'Resolved' && (
                            <Button size="sm" variant="outline" onClick={() => handleResolveSuggestion(sId)}>
                              Resolve
                            </Button>
                          )}
                          <button onClick={() => handleDeleteSuggestion(sId)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'upgrades' ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Header Batch Action */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7280]">
              Pending Upgrade Requests: <strong className="text-[#111827]">{pendingUpgradesCount}</strong>
            </span>
            {pendingUpgradesCount > 0 && (
              <button
                onClick={handleBatchApproveUpgrades}
                className="px-4 py-2 rounded-xl bg-[#4A0E17] hover:bg-[#360910] text-[#C5A059] font-black text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Verify & activate all pending subscription upgrade requests simultaneously"
              >
                <Sparkles size={14} /> Batch Approve All Pending ({pendingUpgradesCount})
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="px-6 py-4">Vendor Name</th>
                  <th className="px-6 py-4">Current Plan</th>
                  <th className="px-6 py-4">Requested Upgrade</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {upgradeRequests.map((u) => {
                  const isApproved = u.status === 'Approved';

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors bg-white">
                      <td className="px-6 py-4 font-bold text-[#111827]">{u.vendor_name}</td>
                      <td className="px-6 py-4 text-[#6B7280] font-medium">{u.current_plan || 'Free'}</td>
                      <td className="px-6 py-4 font-extrabold text-[#D97706]">{u.requested_plan}</td>
                      <td className="px-6 py-4">
                        <Badge variant={u.payment_status === 'Verified' ? 'success' : 'warning'}>{u.payment_status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isApproved ? (
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-extrabold text-xs border border-green-300">
                            ✅ Active
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveUpgrade(u)}
                              className="h-8 px-4 rounded-full bg-[#2E7D32] hover:bg-green-800 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer"
                              title="1-Click Approve & Activate Subscription Upgrade"
                            >
                              Verify & Activate ✅
                            </button>
                            <button
                              onClick={() => setSelectedUpgrade(u)}
                              className="h-8 px-3 rounded-full bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] font-bold text-xs border border-gray-300 transition-all cursor-pointer"
                            >
                              Review
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {upgradeRequests.length === 0 && <EmptyState icon={<CreditCard size={24} />} title="No upgrade requests" />}
        </div>
      ) : activeTab === 'subadmin' ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  <th className="px-6 py-4">Sub-Admin</th>
                  <th className="px-6 py-4">Action Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {subadminRequests.map((req: any) => (
                  <tr key={req.id || req._id} className="hover:bg-gray-50/60 transition-colors bg-white">
                    <td className="px-6 py-4 font-bold text-[#111827]">{req.sub_admin_name || req.subadmin_name || 'Sub-Admin'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={req.action_type === 'delete' ? 'error' : req.action_type === 'edit' ? 'warning' : 'accent'}>
                        {(req.action_type || 'request').toUpperCase()}
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
          </div>
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

              {selectedSubadminReq.action_type === 'assign_category' && (
                <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg mt-2 text-sm text-text">
                  <p className="font-bold mb-1">Category Subscription to Assign:</p>
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
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [masterCategories, setMasterCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [addonModal, setAddonModal] = useState(false);
  const [compareModal, setCompareModal] = useState(false);

  // At-Risk vendors
  const [atRisk, setAtRisk] = useState<{ expired: any[]; critical: any[]; warning: any[] }>({ expired: [], critical: [], warning: [] });
  const [atRiskLoading, setAtRiskLoading] = useState(true);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '', price: 0, validity_days: 30, max_items: 5, max_clients: 10,
    master_category_name: '', badge: '', features: ['priority'] as string[]
  });
  
  const [addonForm, setAddonForm] = useState({
    name: '', price: 99, validity_days: 30, max_clients: 50, addon_type: 'client_extension', max_items: 20
  });
  
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  const FEATURE_PERKS = [
    { id: 'priority', label: '🚀 Priority Order Dispatch' },
    { id: 'analytics', label: '📊 Advanced Analytics & Reports' },
    { id: 'whatsapp', label: '💬 WhatsApp Direct Connect' },
    { id: 'branding', label: '🎨 Custom Storefront Branding' }
  ];

  const load = async () => {
    const [{ data: pData }, { data: aData }, { data: mData }, { data: vData }] = await Promise.all([
      supabase.from('subscription_plans').select('*').order('price'),
      supabase.from('addons').select('*').order('created_at', { ascending: false }),
      supabase.from('master_inventory').select('name'),
      supabase.from('vendors').select('*')
    ]);
    setPlans(pData || []);
    setAddons(aData || []);
    setMasterCategories(Array.from(new Set((mData || []).map((m: any) => m.name))).filter(Boolean) as string[]);
    setVendorsList(vData || []);
    setLoading(false);
  };

  const loadAtRisk = async () => {
    try {
      const res = await fetch('/api/vendors/at-risk');
      if (res.ok) {
        const data = await res.json();
        setAtRisk(data);
      }
    } catch { /* silently fail if endpoint not ready */ }
    setAtRiskLoading(false);
  };

  useEffect(() => { load(); loadAtRisk(); }, []);

  // Calculate MRR and subscriber counts per plan
  const getSubscribedVendorCount = (plan: Plan) => {
    return vendorsList.filter(v => v.plan_id === plan.id || v.plan_name === plan.name).length;
  };

  const totalMRR = plans.reduce((acc, p) => acc + (p.price * getSubscribedVendorCount(p)), 0);
  const totalSubscribers = vendorsList.filter(v => v.plan_name && v.plan_name !== 'Free').length;

  const handleCreate = async () => {
    if (!form.name || form.price < 0) return;
    await supabase.from('subscription_plans').insert({
      name: form.name,
      price: Number(form.price),
      validity_days: Number(form.validity_days),
      max_items: Number(form.max_items),
      max_clients: Number(form.max_clients),
      master_category_name: form.master_category_name || null,
      badge: form.badge || null,
      features: form.features,
      status: 'active'
    });

    await supabase.from('activity_log').insert({
      action: `New subscription plan created: ${form.name}`,
      actor: 'Super Admin'
    });

    show(`Plan ${form.name} created successfully!`);
    setModal(false);
    setForm({ name: '', price: 0, validity_days: 30, max_items: 5, max_clients: 10, master_category_name: '', badge: '', features: ['priority'] });
    load();
  };

  const handleCreateAddon = async () => {
    if (!addonForm.name || addonForm.price < 0) return;
    await supabase.from('addons').insert({
      name: addonForm.name,
      price: Number(addonForm.price),
      validity_days: Number(addonForm.validity_days),
      max_clients: Number(addonForm.max_clients),
      addon_type: addonForm.addon_type,
      max_items: Number(addonForm.max_items)
    });

    await supabase.from('activity_log').insert({
      action: `New add-on package created: ${addonForm.name}`,
      actor: 'Super Admin'
    });

    show(`Add-on package ${addonForm.name} created successfully!`);
    setAddonModal(false);
    setAddonForm({ name: '', price: 99, validity_days: 30, max_clients: 50, addon_type: 'client_extension', max_items: 20 });
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
      badge: editPlan.badge || null,
      features: editPlan.features || []
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

  const handleQuickExtend = async (vendor: any, days: number) => {
    setExtendingId(vendor.id || vendor._id);
    const currentEnd = vendor.subscription_end ? new Date(vendor.subscription_end) : new Date();
    const newEnd = new Date(currentEnd.getTime() + days * 86400000).toISOString().slice(0, 10);
    const activeSubs = Array.isArray(vendor.active_subscriptions) && vendor.active_subscriptions.length > 0
      ? vendor.active_subscriptions.map((s: any) => ({
          ...s,
          subscription_end: new Date((s.subscription_end ? new Date(s.subscription_end) : new Date()).getTime() + days * 86400000).toISOString().slice(0, 10),
          status: 'active'
        }))
      : [];
    await supabase.from('vendors').update({ subscription_end: newEnd, status: 'approved', active_subscriptions: activeSubs }).eq('id', vendor.id || vendor._id);
    await supabase.from('activity_log').insert({ action: `Quick extended ${vendor.shop_name} by +${days} days`, actor: 'Super Admin' });
    show(`${vendor.shop_name} extended by +${days} days ✅`, 'success');
    setExtendingId(null);
    loadAtRisk();
    load();
  };

  const handleSendReminder = async (vendor: any) => {
    const daysLeft = Math.ceil((new Date(vendor.subscription_end).getTime() - Date.now()) / 86400000);
    const msg = daysLeft > 0
      ? `⚠️ ${vendor.shop_name}: Your plan expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Please renew now to avoid service interruption.`
      : `🔴 ${vendor.shop_name}: Your plan has expired. Renew immediately to restore access.`;
    await supabase.from('broadcasts').insert({ message: msg, type: 'warning' });
    await supabase.from('activity_log').insert({ action: `Renewal reminder sent to ${vendor.shop_name}`, actor: 'Super Admin' });
    show(`Renewal reminder sent to ${vendor.shop_name}`, 'success');
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="Subscription Pricing Plans Hub" 
        subtitle="Manage plan tiers, feature flags, badges, and add-on extensions" 
        action={
          <div className="flex items-center gap-3">
            <Button onClick={() => setCompareModal(true)} variant="outline">
              <Eye size={15} /> Compare Tiers
            </Button>
            <Button onClick={() => setAddonModal(true)} variant="outline">
              <Plus size={15} /> Add Add-on
            </Button>
            <Button onClick={() => setModal(true)}>
              <Plus size={15} /> Add Plan
            </Button>
          </div>
        }
      />

      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Monthly Recurring Revenue</p>
            <p className="text-2xl font-extrabold text-[#4A0E17] mt-1">₹{totalMRR.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-[#C5A059] font-black">
            ₹
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Paid Subscribers</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{totalSubscribers} Vendors</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            <Users size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configured Tiers</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{plans.length} Tiers Available</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
            <CreditCard size={20} />
          </div>
        </div>

        {/* MRR At-Risk Card */}
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">⚠️ At-Risk Vendors</p>
            <p className="text-2xl font-extrabold text-red-700 mt-1">
              {atRisk.expired.length + atRisk.critical.length + atRisk.warning.length} Vendors
            </p>
            <p className="text-[10px] text-red-400 font-semibold mt-0.5">
              {atRisk.expired.length} expired · {atRisk.critical.length} critical · {atRisk.warning.length} warning
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-black">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
        {plans.map((p) => {
          const subCount = getSubscribedVendorCount(p);
          const isFeatured = !!p.badge;
          return (
            <div 
              key={p.id} 
              className={`card p-6 bg-white border relative transition-all flex flex-col justify-between ${
                isFeatured ? 'border-[#C5A059] shadow-md ring-2 ring-[#C5A059]/20' : 'border-gray-200 shadow-xs'
              }`}
            >
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                {p.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#4A0E17] text-[#C5A059] shadow-xs">
                    {p.badge}
                  </span>
                )}
                <button 
                  onClick={() => setEditPlan(p)} 
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                  title="Edit Plan"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{p.name} Tier</span>
                <p className="text-4xl font-extrabold text-gray-900 mt-3">₹{p.price.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 font-semibold">Validity: {p.validity_days} Days</span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    {subCount} Active Vendors
                  </span>
                </div>

                <div className="border-t border-gray-100 my-4" />

                <ul className="space-y-2.5 text-sm text-gray-800 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                    <span>Max Inventory: <strong className="text-gray-900">{p.max_items} Items</strong></span>
                  </li>
                  {p.master_category_name && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                      <span>Linked Category: <strong className="text-[#4A0E17]">{p.master_category_name}</strong></span>
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                    <span>Max Client Limit: <strong className="text-gray-900">{p.max_clients} clients</strong></span>
                  </li>
                </ul>

                {/* Feature Checkmarks */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Included Perks</p>
                  {FEATURE_PERKS.map(f => {
                    const hasFeature = p.features?.includes(f.id);
                    return (
                      <div key={f.id} className={`flex items-center gap-2 text-xs font-semibold ${hasFeature ? 'text-gray-900' : 'text-gray-300 line-through'}`}>
                        <span>{hasFeature ? '✓' : '✕'}</span>
                        <span>{f.label}</span>
                      </div>
                    );
                  })}
                </div>
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
          );
        })}
      </div>

      {/* Subscription Add-ons Section */}
      <div className="pt-8 border-t border-gray-200 mt-10 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Subscription Add-on Packages</h2>
          <p className="text-xs text-gray-500 mt-1">Allow vendors to extend validity, add client connects, or unlock extra inventory items on top of active plans.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
          {addons.map((a) => (
            <div key={a.id} className="card p-6 bg-white border border-gray-200 relative hover:border-[#C5A059]/40 transition-all flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex justify-between items-center">
                  <Badge variant={a.addon_type === 'inventory_items' ? 'warning' : a.addon_type === 'validity_extension' ? 'info' : 'accent'}>
                    {a.addon_type === 'inventory_items' ? '📦 Extra Inventory' : a.addon_type === 'validity_extension' ? '⏳ Extra Days' : '👥 Extra Clients'}
                  </Badge>
                  <button 
                    onClick={() => handleDeleteAddon(a.id, a.name)} 
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove Add-on"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <h3 className="font-extrabold text-lg text-gray-900 mt-3">{a.name}</h3>
                <p className="text-3xl font-extrabold text-[#4A0E17] mt-2">₹{Number(a.price).toLocaleString()}</p>
                
                <div className="border-t border-gray-100 my-4" />

                <ul className="space-y-2 text-xs text-gray-700 font-semibold">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                    <span>Validity: <strong>+{a.validity_days} Days</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                    <span>Max Client Connect: <strong>+{a.max_clients} Clients</strong></span>
                  </li>
                  {a.max_items > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                      <span>Extra Items Allowed: <strong>+{a.max_items} Items</strong></span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}

          {addons.length === 0 && (
            <div className="col-span-full p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
              <p className="text-sm text-gray-500">No Add-on packages created yet. Click "+ Add Add-on" in the header to create one.</p>
            </div>
          )}
        </div>
      </div>

      {/* ⚠️ At-Risk Vendors Dashboard */}
      <div className="pt-8 border-t border-gray-200 mt-4 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">⚠️ At-Risk Vendors Dashboard</h2>
            <p className="text-xs text-gray-500 mt-1">Vendors with expired or expiring subscriptions requiring immediate intervention.</p>
          </div>
          <button onClick={loadAtRisk} className="text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">↻ Refresh</button>
        </div>

        {atRiskLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            {[
              { key: 'expired', label: '🔴 Expired', desc: 'Past 3-day grace period — fully locked out', bg: 'bg-red-50', border: 'border-red-200', headBg: 'bg-red-100', badge: 'bg-red-600 text-white', data: atRisk.expired },
              { key: 'critical', label: '🟡 Critical', desc: 'Expiring within 1–3 days — urgent renewal needed', bg: 'bg-amber-50', border: 'border-amber-200', headBg: 'bg-amber-100', badge: 'bg-amber-600 text-white', data: atRisk.critical },
              { key: 'warning', label: '🟠 Warning', desc: 'Expiring in 4–7 days — send reminder now', bg: 'bg-orange-50', border: 'border-orange-200', headBg: 'bg-orange-100', badge: 'bg-orange-500 text-white', data: atRisk.warning },
            ].map(group => (
              <div key={group.key} className={`rounded-2xl border ${group.border} ${group.bg} overflow-hidden`}>
                <div className={`${group.headBg} px-5 py-3 flex items-center justify-between`}>
                  <div>
                    <span className="font-extrabold text-sm text-gray-900">{group.label}</span>
                    <span className="text-xs text-gray-500 ml-2">{group.desc}</span>
                  </div>
                  <span className={`${group.badge} text-xs font-black px-2.5 py-0.5 rounded-full`}>{group.data.length} vendors</span>
                </div>
                {group.data.length === 0 ? (
                  <div className="px-5 py-4 text-xs text-gray-400 font-semibold">No vendors in this category ✅</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <th className="px-5 py-2.5">Shop</th>
                          <th className="px-5 py-2.5">Plan</th>
                          <th className="px-5 py-2.5">Expiry Date</th>
                          <th className="px-5 py-2.5 text-right">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {group.data.map((v: any) => {
                          const daysLeft = Math.ceil((new Date(v.subscription_end).getTime() - Date.now()) / 86400000);
                          const vid = v.id || v._id;
                          return (
                            <tr key={vid} className="hover:bg-white/60 transition-colors">
                              <td className="px-5 py-3">
                                <p className="font-bold text-gray-900">{v.shop_name}</p>
                                <p className="text-[10px] text-gray-500">{v.owner_name} · {v.phone}</p>
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-xs font-bold text-gray-700">{v.plan_name || 'Free'}</span>
                              </td>
                              <td className="px-5 py-3">
                                <p className="text-xs font-bold text-gray-900">{v.subscription_end || 'N/A'}</p>
                                <p className={`text-[10px] font-extrabold ${daysLeft < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                  {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `Expires in ${daysLeft}d`}
                                </p>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleQuickExtend(v, 30)}
                                    disabled={extendingId === vid}
                                    className="px-3 py-1.5 text-[10px] font-extrabold rounded-xl bg-[#4A0E17] text-[#C5A059] hover:opacity-90 transition-opacity disabled:opacity-50"
                                  >
                                    {extendingId === vid ? '...' : '+30d'}
                                  </button>
                                  <button
                                    onClick={() => handleQuickExtend(v, 7)}
                                    disabled={extendingId === vid}
                                    className="px-3 py-1.5 text-[10px] font-extrabold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                  >
                                    Grace +7d
                                  </button>
                                  <button
                                    onClick={() => handleSendReminder(v)}
                                    className="px-3 py-1.5 text-[10px] font-extrabold rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                                  >
                                    📩 Remind
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tier Comparison Matrix Modal */}
      <Modal open={compareModal} onClose={() => setCompareModal(false)} title="Side-by-Side Tier Comparison Matrix">
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="p-3">Feature / Metric</th>
                {plans.map(p => (
                  <th key={p.id} className="p-3 font-extrabold text-gray-900 text-sm">
                    {p.name}
                    {p.badge && <span className="block text-[10px] text-[#C5A059] font-bold">{p.badge}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
              <tr>
                <td className="p-3 font-bold text-gray-500">Price (₹)</td>
                {plans.map(p => <td key={p.id} className="p-3 font-extrabold text-[#4A0E17] text-sm">₹{p.price}</td>)}
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-500">Validity (Days)</td>
                {plans.map(p => <td key={p.id} className="p-3">{p.validity_days} Days</td>)}
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-500">Max Inventory Items</td>
                {plans.map(p => <td key={p.id} className="p-3 font-bold">{p.max_items} Items</td>)}
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-500">Max Client Limit</td>
                {plans.map(p => <td key={p.id} className="p-3 font-bold">{p.max_clients} Clients</td>)}
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-500">Linked Master Category</td>
                {plans.map(p => <td key={p.id} className="p-3">{p.master_category_name || 'All Categories'}</td>)}
              </tr>
              {FEATURE_PERKS.map(f => (
                <tr key={f.id}>
                  <td className="p-3 font-bold text-gray-500">{f.label}</td>
                  {plans.map(p => (
                    <td key={p.id} className="p-3">
                      {p.features?.includes(f.id) ? (
                        <span className="text-green-600 font-bold text-base">✓</span>
                      ) : (
                        <span className="text-gray-300 font-bold text-base">✕</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Add Plan Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Pricing Plan">
        <div className="space-y-4">
          <Input label="Plan Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Price (₹)" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} required />
          <Input label="Validity Days" type="number" value={String(form.validity_days)} onChange={(v) => setForm({ ...form, validity_days: Number(v) })} required />
          <Input label="Max Inventory Items" type="number" value={String(form.max_items)} onChange={(v) => setForm({ ...form, max_items: Number(v) })} required />
          <Input label="Max Client Limits" type="number" value={String(form.max_clients)} onChange={(v) => setForm({ ...form, max_clients: Number(v) })} required />
          
          <Select
            label="Plan Badge / Tag (Optional)"
            value={form.badge}
            onChange={(v) => setForm({ ...form, badge: v })}
            options={[
              { label: '-- No Badge --', value: '' },
              { label: '⭐ Most Popular', value: 'Most Popular' },
              { label: '💎 Best Value', value: 'Best Value' },
              { label: '🚀 Enterprise', value: 'Enterprise' }
            ]}
          />

          <Select
            label="Linked Master Category"
            value={form.master_category_name}
            onChange={(v) => setForm({ ...form, master_category_name: v })}
            options={[{ label: '-- Select Master Category --', value: '' }, ...masterCategories.map(c => ({ label: c, value: c }))]}
          />

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Included Feature Perks</label>
            <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              {FEATURE_PERKS.map(f => (
                <label key={f.id} className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={form.features.includes(f.id)}
                    onChange={(e) => {
                      if (e.target.checked) setForm({ ...form, features: [...form.features, f.id] });
                      else setForm({ ...form, features: form.features.filter(x => x !== f.id) });
                    }}
                    className="accent-[#4A0E17]"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save Plan</Button>
          </div>
        </div>
      </Modal>

      {/* Add Add-on Modal */}
      <Modal open={addonModal} onClose={() => setAddonModal(false)} title="Add Subscription Add-on Package">
        <div className="space-y-4">
          <Input label="Add-on Package Name" value={addonForm.name} onChange={(v) => setAddonForm({ ...addonForm, name: v })} placeholder="e.g. Festival Client Extension" required />
          
          <Select 
            label="Add-on Category Type" 
            value={addonForm.addon_type} 
            onChange={(v) => setAddonForm({ ...addonForm, addon_type: v })} 
            options={[
              { value: 'client_extension', label: '👥 Extra Client Connect Limit' },
              { value: 'validity_extension', label: '⏳ Extra Validity Days' },
              { value: 'inventory_items', label: '📦 Extra Inventory Items' }
            ]} 
          />

          <Input label="Price (₹)" type="number" value={String(addonForm.price)} onChange={(v) => setAddonForm({ ...addonForm, price: Number(v) })} required />
          <Input label="Validity Extension (Days)" type="number" value={String(addonForm.validity_days)} onChange={(v) => setAddonForm({ ...addonForm, validity_days: Number(v) })} required />
          <Input label="Additional Clients Allowed" type="number" value={String(addonForm.max_clients)} onChange={(v) => setAddonForm({ ...addonForm, max_clients: Number(v) })} required />
          <Input label="Additional Items Allowed" type="number" value={String(addonForm.max_items)} onChange={(v) => setAddonForm({ ...addonForm, max_items: Number(v) })} required />

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
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
              label="Plan Badge / Tag (Optional)"
              value={editPlan.badge || ''}
              onChange={(v) => setEditPlan({ ...editPlan, badge: v })}
              options={[
                { label: '-- No Badge --', value: '' },
                { label: '⭐ Most Popular', value: 'Most Popular' },
                { label: '💎 Best Value', value: 'Best Value' },
                { label: '🚀 Enterprise', value: 'Enterprise' }
              ]}
            />

            <Select
              label="Linked Master Category"
              value={editPlan.master_category_name || ''}
              onChange={(v) => setEditPlan({ ...editPlan, master_category_name: v })}
              options={[{ label: '-- Select Master Category --', value: '' }, ...masterCategories.map(c => ({ label: c, value: c }))]}
            />

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Included Feature Perks</label>
              <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                {FEATURE_PERKS.map(f => {
                  const currentFeatures = editPlan.features || [];
                  return (
                    <label key={f.id} className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={currentFeatures.includes(f.id)}
                        onChange={(e) => {
                          if (e.target.checked) setEditPlan({ ...editPlan, features: [...currentFeatures, f.id] });
                          else setEditPlan({ ...editPlan, features: currentFeatures.filter(x => x !== f.id) });
                        }}
                        className="accent-[#4A0E17]"
                      />
                      {f.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
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
const UOM_OPTIONS = [
  { label: 'Piece (pc) / Each (ea)', value: 'pc' },
  { label: 'Plate / Portion / Serving', value: 'plate' },
  { label: 'Gram (g)', value: 'g' },
  { label: 'Kilogram (kg)', value: 'kg' },
  { label: 'Milliliter (ml)', value: 'ml' },
  { label: 'Liter (L)', value: 'L' },
  { label: 'Dozen (dz)', value: 'dz' }
];

function SubInventoryView({ master, show, onClose }: { master: MasterItem, show: (m: string, t?: 'success'|'error'|'info') => void, onClose: () => void }) {
  const [items, setItems] = useState<SubInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<SubInventory | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    price: 0,
    quantity: 25,
    uom: 'pc',
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
      uom: form.uom || 'pc',
      image_url: form.image_url || null
    });

    show(`Sub-Item ${form.name} created successfully!`);
    setModal(false);
    setForm({ name: '', price: 0, quantity: 25, uom: 'pc', image_url: '' });
    load();
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    const targetId = editItem.id || (editItem as any)._id;
    await supabase.from('sub_inventory').update({
      name: editItem.name,
      price: Number(editItem.price),
      quantity: Number(editItem.quantity),
      uom: editItem.uom || 'pc',
      image_url: editItem.image_url
    }).eq('id', targetId);

    show('Sub-Item updated');
    setEditItem(null);
    load();
  };

  const handleDelete = async (item: SubInventory) => {
    if (confirm(`Warning: Are you sure you want to delete ${item.name}?`)) {
      const targetId = item.id || (item as any)._id;
      await supabase.from('sub_inventory').delete().eq('id', targetId);
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
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text">{item.name}</h3>
                <Badge variant="accent">{item.uom || 'pc'}</Badge>
              </div>
              <p className="text-xs text-muted mt-1">Default Qty (MOQ): <strong className="text-text">{item.quantity} {item.uom || 'pc'}</strong></p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <span className="text-accent font-extrabold text-base">₹{item.price} / {item.uom || 'pc'}</span>
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
          <Input label="Item Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹) *" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} required />
            <Input label="Default Qty *" type="number" value={String(form.quantity)} onChange={(v) => setForm({ ...form, quantity: Number(v) })} required />
          </div>
          <Select 
            label="Unit of Measurement (UOM) *" 
            value={form.uom} 
            onChange={(v) => setForm({ ...form, uom: v })} 
            options={UOM_OPTIONS} 
          />
          <Button className="w-full mt-4" onClick={handleCreate}>Save Sub-Item</Button>
        </div>
      </Modal>

      {editItem && (
        <Modal open={true} onClose={() => setEditItem(null)} title="Edit Sub-Item">
          <div className="space-y-4">
            <Input label="Item Name *" value={editItem.name} onChange={(v) => setEditItem({ ...editItem, name: v })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹) *" type="number" value={String(editItem.price)} onChange={(v) => setEditItem({ ...editItem, price: Number(v) })} required />
              <Input label="Default Qty *" type="number" value={String(editItem.quantity)} onChange={(v) => setEditItem({ ...editItem, quantity: Number(v) })} required />
            </div>
            <Select 
              label="Unit of Measurement (UOM) *" 
              value={editItem.uom || 'pc'} 
              onChange={(v) => setEditItem({ ...editItem, uom: v })} 
              options={UOM_OPTIONS} 
            />
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
    category: '',
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
      const compressedFile = await compressImageFile(file);
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (res.status === 413 || text.includes('413')) throw new Error('Image too large for the server configuration. Compression failed or image is still too large.');
        throw new Error(`Server returned HTML error (${res.status}) instead of JSON`);
      }
      
      if (!res.ok) throw new Error(data?.error || 'Upload failed');

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
    if (!form.name) return;
    await supabase.from('master_inventory').insert({
      name: form.name,
      category: form.category,
      base_price: Number(form.base_price) || 0,
      quantity: Number(form.quantity) || 1,
      description: form.description || '',
      image_url: form.image_url || null
    });

    show(`Master Item ${form.name} created successfully!`);
    setModal(false);
    setForm({ name: '', category: '', base_price: 100, quantity: 10, description: '', image_url: '' });
    load();
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    const targetId = editItem.id || (editItem as any)._id;
    await supabase.from('master_inventory').update({
      name: editItem.name,
      category: editItem.category,
      base_price: Number(editItem.base_price) || 0,
      quantity: Number(editItem.quantity) || 1,
      description: editItem.description || '',
      image_url: editItem.image_url
    }).eq('id', targetId);

    show('Master Item updated');
    setEditItem(null);
    load();
  };

  const handleDelete = async (item: MasterItem) => {
    const targetId = item.id || (item as any)._id;
    if (confirm(`Warning: Are you sure you want to delete ${item.name}? This will remove it from global client browsing.`)) {
      await supabase.from('master_inventory').delete().eq('id', targetId);
      show(`Master Item ${item.name} removed`, 'info');
      load();
    }
  };

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort(), [items]);

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
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => exportCSV(filtered, 'master_inventory')} className="text-muted border-border hover:bg-surface-2">
              <Download size={18} className="mr-2" /> Export Inventory
            </Button>
            <Button onClick={() => setModal(true)}><Plus size={16} className="mr-2" /> Add Master Item</Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 bg-surface p-4 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-text focus:border-accent outline-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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

              <div className="flex items-center justify-end mt-4 pt-3 border-t border-border/50">
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
          <Input label="Item Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text block">Category <span className="text-accent">*</span></label>
            <input
              type="text"
              list="master-item-categories"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Tiffin, Breakfast, Thali..."
              required
              className="w-full px-4 py-3 rounded-2xl bg-white/95 border border-border text-text placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm"
            />
            <datalist id="master-item-categories">
              {categories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
          </div>

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

            <Input 
              label="Image URL (Optional / ChatGPT / Web / Photo URL)" 
              placeholder="https://... or upload photo below" 
              value={form.image_url || ''} 
              onChange={(v) => setForm({ ...form, image_url: v })} 
            />

            <div className="text-xs bg-surface-2/60 border border-border/80 rounded-xl p-3 text-muted space-y-1.5">
              <p className="font-bold text-text text-[11px] uppercase tracking-wider">Photo Upload Specifications:</p>
              <div className="space-y-1 text-[11px]">
                <p className="font-semibold text-text">JPG / JPEG:</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5 text-muted">
                  <li>Max Size: 15 MB</li>
                  <li>Min Resolution: 600 × 600 px</li>
                  <li>Recommended: 1920 × 1080 px</li>
                  <li>Max Resolution: 10000 × 10000 px</li>
                </ul>
                <p className="font-semibold text-text pt-1">PNG:</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5 text-muted">
                  <li>Max Size: 15 MB</li>
                  <li>Min Resolution: 600 × 600 px</li>
                  <li>Recommended: 1920 × 1080 px</li>
                  <li>Max Resolution: 10000 × 10000 px</li>
                </ul>
              </div>
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
            <Input label="Item Name *" value={editItem.name} onChange={(v) => setEditItem({ ...editItem, name: v })} required />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text block">Category <span className="text-accent">*</span></label>
              <input
                type="text"
                list="master-item-categories"
                value={editItem.category || ''}
                onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                placeholder="e.g. Tiffin, Breakfast, Thali..."
                required
                className="w-full px-4 py-3 rounded-2xl bg-white/95 border border-border text-text placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm"
              />
              <datalist id="master-item-categories">
                {categories.map(cat => <option key={cat} value={cat} />)}
              </datalist>
            </div>

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
      <PageHeader 
        title="Global Orders Watchlist" 
        subtitle={`${orders.length} order history records in MongoDB`} 
        action={
          <Button onClick={() => exportCSV(orders, 'all_orders')} className="bg-primary text-accent hover:bg-primary-dark">
            <Download size={18} className="mr-2" /> Export Orders
          </Button>
        }
      />
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
  type DocTab = 'sop' | 'vendor_guide' | 'plans' | 'faq';

  const [docTab, setDocTab] = useState<DocTab>('sop');
  const [guides, setGuides] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [faqModal, setFaqModal] = useState(false);
  const [previewGuide, setPreviewGuide] = useState<any | null>(null);
  const [previewFaq, setPreviewFaq] = useState<any | null>(null);

  // Upload form state
  const [form, setForm] = useState({ title: '', version_note: '', keywords: '' });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [visibilityRoles, setVisibilityRoles] = useState<string[]>(['vendor']);

  // FAQ form state
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'general' });
  const [faqAllowedRoles, setFaqAllowedRoles] = useState<string[]>(['vendor', 'sub_admin']);
  const [savingFaq, setSavingFaq] = useState(false);

  const load = async () => {
    setLoading(true);
    const [guideRes, faqRes] = await Promise.all([
      supabase.from('guides').select('*').order('uploaded_at', { ascending: false }),
      fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'faqs', action: 'select', sorts: [{ field: 'is_pinned', ascending: false }, { field: 'created_at', ascending: false }] })
      }).then(r => r.json()).catch(() => ({ data: [] }))
    ]);
    setGuides(guideRes.data || []);
    setFaqs(faqRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { show('File size must be under 15MB', 'error'); return; }
    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => setPdfData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!form.title || !pdfData) { show('Title and file are required', 'error'); return; }
    if (visibilityRoles.length === 0) { show('Select at least one visibility role', 'error'); return; }
    setUploading(true);
    const docType = docTab === 'faq' ? 'vendor_guide' : docTab; // files go to sop or vendor_guide
    await supabase.from('guides').insert({
      title: form.title,
      category: docType,
      doc_type: docType,
      keywords: form.keywords || '',
      version_note: form.version_note || '',
      allowed_roles: visibilityRoles,
      is_pinned: false,
      read_count: 0,
      file_data: pdfData,
      file_name: pdfFile?.name || 'document'
    });
    setUploading(false);
    show('Document uploaded successfully!');
    setModal(false);
    setForm({ title: '', version_note: '', keywords: '' });
    setPdfFile(null); setPdfData('');
    setVisibilityRoles(['vendor']);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await supabase.from('guides').delete().eq('id', id);
    show('Document deleted', 'info');
    load();
  };

  const handleTogglePin = async (g: any) => {
    await supabase.from('guides').update({ is_pinned: !g.is_pinned }).eq('id', g.id);
    load();
  };

  const handleOpenGuide = async (g: any) => {
    setPreviewGuide(g);
    // Increment read count
    const newCount = (g.read_count || 0) + 1;
    await supabase.from('guides').update({ read_count: newCount }).eq('id', g.id);
    setGuides(prev => prev.map(x => x.id === g.id ? { ...x, read_count: newCount } : x));
  };

  // FAQ handlers
  const handleCreateFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) { show('Question and answer are required', 'error'); return; }
    setSavingFaq(true);
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'faqs', action: 'insert',
        data: {
          question: faqForm.question.trim(),
          answer: faqForm.answer.trim(),
          category: faqForm.category,
          allowed_roles: faqAllowedRoles,
          is_pinned: false,
          read_count: 0
        }
      })
    });
    setSavingFaq(false);
    show('FAQ created successfully!');
    setFaqModal(false);
    setFaqForm({ question: '', answer: '', category: 'general' });
    setFaqAllowedRoles(['vendor', 'sub_admin']);
    load();
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'faqs', action: 'delete', filters: { _id: id } })
    });
    show('FAQ deleted', 'info');
    load();
  };

  const handleToggleFaqPin = async (faq: any) => {
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'faqs', action: 'update',
        filters: { _id: faq._id || faq.id },
        data: { is_pinned: !faq.is_pinned }
      })
    });
    load();
  };

  const handleOpenFaq = async (faq: any) => {
    setPreviewFaq(faq);
    const faqId = faq._id || faq.id;
    const newCount = (faq.read_count || 0) + 1;
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'faqs', action: 'update',
        filters: { _id: faqId },
        data: { read_count: newCount }
      })
    });
    setFaqs(prev => prev.map(x => (x._id || x.id) === faqId ? { ...x, read_count: newCount } : x));
  };

  if (loading) return <Spinner />;

  // Guides filtered by tab + search
  const filteredGuides = guides
    .filter(g => {
      const type = g.doc_type || g.category || 'sop';
      const roles: string[] = Array.isArray(g.allowed_roles) ? g.allowed_roles : [type];
      if (docTab === 'sop') return type === 'sop' || type === 'sub_admin' || roles.includes('sub_admin');
      if (docTab === 'plans') return type === 'plans' || roles.includes('plans');
      return type === 'vendor_guide' || type === 'vendor' || roles.includes('vendor');
    })
    .filter(g => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return g.title?.toLowerCase().includes(q) || g.keywords?.toLowerCase().includes(q);
    })
    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  const filteredFaqs = faqs
    .filter(f => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q);
    })
    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  const docTabs: { id: DocTab; label: string; icon: any; count: number }[] = [
    { id: 'sop', label: 'SOPs (Sub-Admin)', icon: Users, count: guides.filter(g => (g.doc_type || g.category) === 'sop' || (g.doc_type || g.category) === 'sub_admin' || (Array.isArray(g.allowed_roles) && g.allowed_roles.includes('sub_admin'))).length },
    { id: 'vendor_guide', label: 'Vendor Guides', icon: Store, count: guides.filter(g => (g.doc_type || g.category) === 'vendor_guide' || (g.doc_type || g.category) === 'vendor' || (Array.isArray(g.allowed_roles) && g.allowed_roles.includes('vendor'))).length },
    { id: 'plans', label: "Plan's (Landing Ads)", icon: Sparkles, count: guides.filter(g => (g.doc_type || g.category) === 'plans' || (Array.isArray(g.allowed_roles) && g.allowed_roles.includes('plans'))).length },
    { id: 'faq', label: 'FAQs', icon: MessageSquare, count: faqs.length }
  ];

  const isFileDoc = docTab !== 'faq';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Knowledge Base & Guides"
        subtitle="SOPs, Vendor Guides, and FAQs — manage your operational documentation"
        action={
          <Button onClick={() => isFileDoc ? setModal(true) : setFaqModal(true)} className="bg-primary text-accent hover:bg-primary-dark">
            <FileUp size={16} className="mr-2" />
            {isFileDoc ? 'Upload Document' : 'Add FAQ'}
          </Button>
        }
      />

      {/* Tabs + Search Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Tab Pills */}
        <div className="flex items-center gap-1 bg-surface-2 p-1.5 rounded-2xl border border-border w-fit">
          {docTabs.map(dt => (
            <button
              key={dt.id}
              onClick={() => setDocTab(dt.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                docTab === dt.id ? 'bg-primary text-accent shadow-sm' : 'text-muted hover:text-text hover:bg-surface'
              }`}
            >
              <dt.icon size={14} />
              {dt.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${docTab === dt.id ? 'bg-accent/20 text-accent' : 'bg-surface text-muted'}`}>
                {dt.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={docTab === 'faq' ? 'Search FAQs...' : 'Search documents by title or keyword...'}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:border-accent outline-none"
          />
        </div>
      </div>

      {/* === FILE DOCUMENTS (SOPs / Vendor Guides) === */}
      {isFileDoc && (
        <>
          {filteredGuides.length === 0 ? (
            <EmptyState
              icon={<FileText size={28} />}
              title={`No ${docTab === 'sop' ? 'SOP documents' : 'vendor guides'} yet`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
              {filteredGuides.map(g => {
                const roles: string[] = Array.isArray(g.allowed_roles) && g.allowed_roles.length > 0 ? g.allowed_roles : [g.category || 'vendor'];
                return (
                  <div key={g.id} className={`card p-6 bg-surface border flex flex-col justify-between hover-lift group transition-all ${g.is_pinned ? 'border-accent/50 shadow-[0_0_0_2px_rgba(197,160,89,0.15)]' : 'border-border'}`}>
                    <div>
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                            <FileText size={16} />
                          </div>
                          {g.is_pinned && <span className="text-[10px] font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded-full">⭐ Pinned</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTogglePin(g)}
                            title={g.is_pinned ? 'Unpin' : 'Pin to top'}
                            className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-accent transition-colors"
                          >
                            <Check size={13} className={g.is_pinned ? 'text-accent' : ''} />
                          </button>
                          <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-base text-text leading-snug">{g.title}</h3>

                      {/* Version note */}
                      {g.version_note && (
                        <p className="text-[11px] text-accent font-semibold mt-1 bg-accent/5 px-2 py-0.5 rounded-md inline-block">{g.version_note}</p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {roles.map((role: string) => (
                          <Badge key={role} variant={role === 'sub_admin' ? 'info' : role === 'plans' ? 'warning' : 'accent'}>
                            {role === 'sub_admin' ? 'Sub-Admins' : role === 'vendor' ? 'Vendors' : role === 'plans' ? "Plan's" : role}
                          </Badge>
                        ))}
                        {g.keywords && g.keywords.split(',').slice(0, 2).map((kw: string) => (
                          <span key={kw} className="text-[10px] bg-surface-2 border border-border px-2 py-0.5 rounded-full text-muted font-medium">{kw.trim()}</span>
                        ))}
                      </div>

                      {/* Read count */}
                      <p className="text-[10px] text-muted mt-2 flex items-center gap-1">
                        <Eye size={10} /> {g.read_count || 0} views
                      </p>
                    </div>

                    {g.file_data && (
                      <Button onClick={() => handleOpenGuide(g)} variant="outline" size="sm" className="mt-5 w-full text-accent border-accent/30 hover:bg-accent/5">
                        <Eye size={14} className="mr-2" /> Preview Document
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === FAQs === */}
      {docTab === 'faq' && (
        <>
          {filteredFaqs.length === 0 ? (
            <EmptyState icon={<MessageSquare size={28} />} title="No FAQs yet — create your first one!" />
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map(faq => {
                const faqId = faq._id || faq.id;
                return (
                  <div key={faqId} className={`card p-5 bg-surface border flex flex-col gap-3 hover-lift transition-all ${faq.is_pinned ? 'border-accent/40 shadow-[0_0_0_2px_rgba(197,160,89,0.1)]' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <MessageSquare size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {faq.is_pinned && <span className="text-[10px] font-extrabold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">⭐ Pinned</span>}
                            <Badge variant={faq.category === 'vendor' ? 'accent' : faq.category === 'sub_admin' ? 'info' : 'success'}>
                              {faq.category}
                            </Badge>
                            <span className="text-[10px] text-muted flex items-center gap-1"><Eye size={9} /> {faq.read_count || 0} views</span>
                          </div>
                          <p className="font-extrabold text-text text-sm mt-1 leading-snug">{faq.question}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggleFaqPin(faq)} title={faq.is_pinned ? 'Unpin' : 'Pin'} className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-accent transition-colors">
                          <Check size={13} className={faq.is_pinned ? 'text-accent' : ''} />
                        </button>
                        <Button size="sm" variant="outline" onClick={() => handleOpenFaq(faq)} className="text-xs">
                          <Eye size={12} className="mr-1" /> Read
                        </Button>
                        <button onClick={() => handleDeleteFaq(faqId)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {/* Answer preview */}
                    <p className="text-sm text-muted leading-relaxed pl-9 line-clamp-2">{faq.answer}</p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === Upload Document Modal === */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Upload ${docTab === 'sop' ? 'SOP Document' : 'Vendor Guide'}`}>
        <div className="space-y-5">
          <Input label="Document Title" value={form.title} onChange={v => setForm({ ...form, title: v })} required />
          <Input label="Version / Note (optional)" value={form.version_note} onChange={v => setForm({ ...form, version_note: v })} />
          <Input label="Keywords (comma-separated)" value={form.keywords} onChange={v => setForm({ ...form, keywords: v })} />

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">Visible To</label>
            <div className="flex items-center gap-5 text-sm font-semibold flex-wrap">
              {[
                { id: 'sub_admin', label: 'Sub-Admins' },
                { id: 'vendor', label: 'Vendors' },
                { id: 'plans', label: "Plan's" }
              ].map(role => (
                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibilityRoles.includes(role.id)}
                    onChange={e => {
                      if (e.target.checked) setVisibilityRoles([...visibilityRoles, role.id]);
                      else setVisibilityRoles(visibilityRoles.filter(r => r !== role.id));
                    }}
                    className="accent-accent w-4 h-4"
                  />
                  {role.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Document File (PDF / Image, max 15MB)</label>
            <div className="relative border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center bg-surface-2/20 hover:bg-surface-2/40 transition-colors">
              <input type="file" accept="application/pdf, image/jpeg, image/png" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              {pdfFile ? (
                <div className="text-center">
                  <FileText size={24} className="text-accent mx-auto mb-1 animate-bounce" />
                  <p className="text-xs font-bold text-text truncate max-w-[200px]">{pdfFile.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload size={20} className="text-muted mx-auto mb-1" />
                  <p className="text-[10px] text-muted">Click or drag file here</p>
                </div>
              )}
            </div>
          </div>

          <Button className="w-full bg-primary text-accent hover:bg-primary-dark" onClick={handleCreate} disabled={uploading || !pdfFile}>
            {uploading ? <Spinner /> : 'Upload Document'}
          </Button>
        </div>
      </Modal>

      {/* === FAQ Builder Modal === */}
      <Modal open={faqModal} onClose={() => setFaqModal(false)} title="Create FAQ Entry">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">Question *</label>
            <textarea
              value={faqForm.question}
              onChange={e => setFaqForm({ ...faqForm, question: e.target.value })}
              placeholder="e.g. How do I update my menu items?"
              className="w-full p-3 text-sm rounded-xl border border-border bg-surface-2 focus:border-accent outline-none resize-none h-20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">Answer *</label>
            <textarea
              value={faqForm.answer}
              onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
              placeholder="Type the detailed answer here..."
              className="w-full p-3 text-sm rounded-xl border border-border bg-surface-2 focus:border-accent outline-none resize-none h-32"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Category</label>
            <select
              value={faqForm.category}
              onChange={e => setFaqForm({ ...faqForm, category: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm focus:border-accent outline-none"
            >
              <option value="general">General</option>
              <option value="vendor">Vendor</option>
              <option value="sub_admin">Sub-Admin</option>
              <option value="platform">Platform / Technical</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider block">Visible To</label>
            <div className="flex items-center gap-5 text-sm font-semibold">
              {[{ id: 'vendor', label: 'Vendors' }, { id: 'sub_admin', label: 'Sub-Admins' }].map(role => (
                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faqAllowedRoles.includes(role.id)}
                    onChange={e => {
                      if (e.target.checked) setFaqAllowedRoles([...faqAllowedRoles, role.id]);
                      else setFaqAllowedRoles(faqAllowedRoles.filter(r => r !== role.id));
                    }}
                    className="accent-accent w-4 h-4"
                  />
                  {role.label}
                </label>
              ))}
            </div>
          </div>

          <Button className="w-full bg-primary text-accent hover:bg-primary-dark" onClick={handleCreateFaq} disabled={savingFaq || !faqForm.question.trim() || !faqForm.answer.trim()}>
            {savingFaq ? <Spinner /> : 'Create FAQ'}
          </Button>
        </div>
      </Modal>

      {/* === Document Preview Drawer === */}
      <Drawer open={!!previewGuide} onClose={() => setPreviewGuide(null)} title={previewGuide?.title || 'Document Preview'}>
        {previewGuide && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-2 p-3 rounded-xl border border-border">
              <div className="space-y-1">
                {previewGuide.version_note && (
                  <p className="text-[11px] text-accent font-semibold">{previewGuide.version_note}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(previewGuide.allowed_roles) ? previewGuide.allowed_roles : [previewGuide.category]).map((r: string) => (
                    <Badge key={r} variant={r === 'sub_admin' ? 'info' : 'accent'}>
                      {r === 'sub_admin' ? 'Sub-Admins' : 'Vendors'}
                    </Badge>
                  ))}
                </div>
              </div>
              <a href={previewGuide.file_data} download={previewGuide.file_name || 'document'} className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                <Download size={13} /> Download
              </a>
            </div>

            <div className="rounded-xl border border-border overflow-hidden min-h-[50vh]">
              {previewGuide.file_data?.startsWith('data:image') ? (
                <img src={previewGuide.file_data} alt={previewGuide.title} className="w-full h-auto object-contain" />
              ) : previewGuide.file_data ? (
                <iframe src={previewGuide.file_data} title={previewGuide.title} className="w-full h-[65vh] rounded-xl border-0" />
              ) : (
                <EmptyState icon={<FileText size={24} />} title="No file attached" />
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* === FAQ Preview Drawer === */}
      <Drawer open={!!previewFaq} onClose={() => setPreviewFaq(null)} title="FAQ Answer">
        {previewFaq && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant={previewFaq.category === 'vendor' ? 'accent' : previewFaq.category === 'sub_admin' ? 'info' : 'success'}>
                {previewFaq.category}
              </Badge>
              <span className="text-xs text-muted flex items-center gap-1"><Eye size={10} /> {previewFaq.read_count || 0} views</span>
            </div>
            <div className="p-4 bg-surface-2 rounded-xl border border-border">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Question</p>
              <p className="font-extrabold text-text text-base leading-snug">{previewFaq.question}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Answer</p>
              <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{previewFaq.answer}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// 8. Sub-Admin management tab
const satTrans = {
  en: {
    title: 'Sub-Admin Management',
    subtitle: 'Administer team member accounts and access permissions',
    createSubAdmin: 'Create Sub-Admin',
    colName: 'Name',
    colEmail: 'Email',
    colPassword: 'Password',
    colLastActive: 'Last Active',
    colActions: 'Actions',
    holdToReveal: 'Hold to reveal',
    never: 'Never',
    name: 'Name',
    emailAddress: 'Email Address',
    password: 'Password *',
    passwordPlaceholder: 'Enter or generate password',
    generate: 'Generate',
    cancel: 'Cancel',
    saveCredentials: 'Save Credentials',
    confirmRemove: (name: string) => `Remove sub-admin ${name}?`,
    toastCreated: (name: string) => `Sub Admin ${name} created successfully!`,
    toastRemoved: (name: string) => `Sub Admin ${name} removed`,
  },
  hi: {
    title: 'सब-एडमिन प्रबंधन',
    subtitle: 'टीम सदस्य खातों और पहुंच अनुमतियों का प्रबंधन करें',
    createSubAdmin: 'सब-एडमिन बनाएं',
    colName: 'नाम',
    colEmail: 'ईमेल',
    colPassword: 'पासवर्ड',
    colLastActive: 'अंतिम सक्रिय',
    colActions: 'कार्रवाई',
    holdToReveal: 'देखने के लिए दबाए रखें',
    never: 'कभी नहीं',
    name: 'नाम',
    emailAddress: 'ईमेल पता',
    password: 'पासवर्ड *',
    passwordPlaceholder: 'पासवर्ड दर्ज करें या जनरेट करें',
    generate: 'जनरेट करें',
    cancel: 'रद्द करें',
    saveCredentials: 'क्रेडेंशियल सहेजें',
    confirmRemove: (name: string) => `सब-एडमिन ${name} हटाएं?`,
    toastCreated: (name: string) => `सब एडमिन ${name} सफलतापूर्वक बनाया गया!`,
    toastRemoved: (name: string) => `सब एडमिन ${name} हटाया गया`,
  },
  mr: {
    title: 'सब-ॲडमिन व्यवस्थापन',
    subtitle: 'टीम सदस्य खाती आणि प्रवेश परवानग्या व्यवस्थापित करा',
    createSubAdmin: 'सब-ॲडमिन तयार करा',
    colName: 'नाव',
    colEmail: 'ईमेल',
    colPassword: 'पासवर्ड',
    colLastActive: 'शेवटचे सक्रिय',
    colActions: 'कृती',
    holdToReveal: 'पाहण्यासाठी दाबून ठेवा',
    never: 'कधीही नाही',
    name: 'नाव',
    emailAddress: 'ईमेल पत्ता',
    password: 'पासवर्ड *',
    passwordPlaceholder: 'पासवर्ड टाका किंवा तयार करा',
    generate: 'तयार करा',
    cancel: 'रद्द करा',
    saveCredentials: 'क्रेडेन्शियल्स जतन करा',
    confirmRemove: (name: string) => `सब-ॲडमिन ${name} काढून टाकायचे?`,
    toastCreated: (name: string) => `सब ॲडमिन ${name} यशस्वीरित्या तयार केले!`,
    toastRemoved: (name: string) => `सब ॲडमिन ${name} काढले`,
  },
};

function SubAdminsTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [lang] = useSyncedLanguage();
  const t = satTrans[lang];
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

    show(t.toastCreated(form.name));
    setModal(false);
    setForm({ name: '', email: '', password: '' });
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(t.confirmRemove(name))) {
      await supabase.from('sub_admins').delete().eq('id', id);
      show(t.toastRemoved(name), 'info');
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        action={<Button onClick={() => setModal(true)}><Plus size={16} /> {t.createSubAdmin}</Button>}
      />

      <div className="card overflow-hidden bg-surface border border-border">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-2 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="px-6 py-4">{t.colName}</th>
                <th className="px-6 py-4">{t.colEmail}</th>
                <th className="px-6 py-4">{t.colPassword}</th>
                <th className="px-6 py-4">{t.colLastActive}</th>
                <th className="px-6 py-4 text-right">{t.colActions}</th>
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
                        title={t.holdToReveal}
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">
                    {a.last_active ? new Date(a.last_active).toLocaleString() : t.never}
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
      </div>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={t.createSubAdmin}>
        <div className="space-y-4">
          <Input label={t.name} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label={t.emailAddress} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">{t.password}</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder={t.passwordPlaceholder}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-text focus:border-accent outline-none"
              />
              <Button variant="outline" onClick={handleGeneratePassword}>{t.generate}</Button>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModal(false)}>{t.cancel}</Button>
            <Button onClick={handleCreate}>{t.saveCredentials}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
