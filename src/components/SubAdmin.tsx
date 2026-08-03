import { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard, Store, Plus, Users, Clock, CheckCircle2,
  Activity as ActivityIcon, AlertCircle, FileText, Eye, Pencil, Search,
  ArrowRight, Package, Trash2, Menu, X, RefreshCw, MessageCircle, MessageSquare
} from 'lucide-react';
import { supabase, type Vendor, type Activity, type VendorItem } from '../lib/supabase';
import { Button, Badge, useToast, Toast, Spinner, EmptyState, SpotlightCard, Modal, Drawer, LanguageSelector, getInitialLanguage, type Language } from './ui';
import { VendorForm } from './VendorForm';

type Tab = 'dashboard' | 'vendors' | 'pending' | 'guides' | 'live_tracker' | 'pending_orders';

export function SubAdmin({ onExit, adminEmail }: { onExit: () => void; adminEmail: string }) {
  const [lang, setLang] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const handleStorage = () => {
      const updated = localStorage.getItem('app_language') as Language;
      if (updated && (updated === 'en' || updated === 'hi' || updated === 'mr')) {
        setLang(updated);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('app_language_change', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('app_language_change', handleStorage);
    };
  }, []);

  const navLabels = {
    en: { dashboard: 'Dashboard', vendors: 'Vendors', pending: 'Correction Inbox', guides: 'SOP Guides', live_tracker: 'Live Order Tracker', pending_orders: 'Pending & Missed Orders', exit: 'Exit', signedInAs: 'Signed In As' },
    hi: { dashboard: 'डैशबोर्ड', vendors: 'विक्रेता (वेंडर्स)', pending: 'सुधार इनबॉक्स', guides: 'एसओपी गाइड', live_tracker: 'लाइव ऑर्डर ट्रैकर', pending_orders: 'लंबित और छूटे हुए ऑर्डर', exit: 'बाहर निकलें', signedInAs: 'साइन इन हैं' },
    mr: { dashboard: 'डॅशबोर्ड', vendors: 'विक्रेते (व्हेंडर्स)', pending: 'सुधारणा इनबॉक्स', guides: 'एसओपी मार्गदर्शक', live_tracker: 'लाइव्ह ऑर्डर ट्रॅकर', pending_orders: 'प्रलंबित आणि चुकलेले ऑर्डर', exit: 'बाहेर पडा', signedInAs: 'खाते' },
  }[lang];

  const [tab, setTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast, show } = useToast();

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: navLabels.dashboard, icon: LayoutDashboard },
    { id: 'vendors', label: navLabels.vendors, icon: Store },
    { id: 'pending', label: navLabels.pending, icon: AlertCircle },
    { id: 'guides', label: navLabels.guides, icon: FileText },
    { id: 'live_tracker', label: navLabels.live_tracker, icon: ActivityIcon },
    { id: 'pending_orders', label: navLabels.pending_orders, icon: Clock },
  ];

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden relative">
      {/* Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onExit}>
          <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain shrink-0" />
          <span className="font-extrabold text-sm tracking-tight text-black">VIKRAM ADS</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector direction="down" showLabel={true} />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-surface-2 border border-border text-text focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Responsive Drawer Sidebar */}
      <aside className={`w-64 border-r border-border bg-surface flex flex-col h-screen fixed lg:sticky top-0 z-40 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-4 border-b border-border hidden lg:flex items-center gap-3 cursor-pointer group" onClick={onExit}>
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain shrink-0" />
          <div>
            <p className="font-extrabold text-base tracking-tight text-black">VIKRAM ADS</p>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Sub-Admin Portal</p>
          </div>
        </div>
        
        <div className="p-4 border-b border-border bg-surface-2/40 mt-14 lg:mt-0">
          <p className="text-xs text-muted font-bold uppercase tracking-wider">{navLabels.signedInAs}</p>
          <p className="text-xs text-text font-semibold truncate mt-0.5">{adminEmail || 'arjun@mealmesh.io'}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-200 group relative cursor-pointer ${
                  isActive
                    ? 'bg-[#4A0E17] text-[#C5A059] font-black shadow-md border-l-4 border-[#C5A059]'
                    : 'text-text hover:text-black hover:bg-surface-2 font-extrabold'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-[#C5A059]' : 'text-muted group-hover:text-text group-hover:scale-110 transition-transform'} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex justify-center pb-1">
            <LanguageSelector direction="up" showLabel={true} />
          </div>
          <Button variant="ghost" size="sm" className="w-full" onClick={onExit}>{navLabels.exit}</Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen bg-bg relative z-10 pt-16 lg:pt-0">
        {/* Sticky Top Header Bar */}
        <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-xs">
          <span className="text-xs font-bold text-muted uppercase tracking-wider hidden sm:block">Sub-Admin Workspace</span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector direction="down" showLabel={true} />
          </div>
        </div>
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {tab === 'dashboard' && <SubDashboard lang={lang} onTab={setTab} adminEmail={adminEmail} />}
          {tab === 'vendors' && <MyVendors lang={lang} show={show} adminEmail={adminEmail} />}
          {tab === 'pending' && <CorrectionInbox lang={lang} show={show} />}
          {tab === 'guides' && <SubGuides lang={lang} />}
          {tab === 'live_tracker' && <SubAdminLiveOrderTrackerTab lang={lang} show={show} />}
          {tab === 'pending_orders' && <SubAdminPendingOrdersTab lang={lang} show={show} />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

const subTrans = {
  en: {
    dashboardTitle: 'Dashboard Overview',
    dashboardSubtitle: 'Review your vendor modification requests',
    approvedRequests: 'Approved Requests',
    pendingApprovals: 'Pending Approvals',
    rejectedRequests: 'Rejected Requests',
    quickActions: 'Quick Actions',
    manageVendors: 'Manage Vendors',
    correctionInbox: 'Correction Inbox',
  },
  hi: {
    dashboardTitle: 'डैशबोर्ड अवलोकन',
    dashboardSubtitle: 'अपने विक्रेता संशोधन अनुरोधों की समीक्षा करें',
    approvedRequests: 'स्वीकृत अनुरोध',
    pendingApprovals: 'लंबित अनुमोदन',
    rejectedRequests: 'अस्वीकृत अनुरोध',
    quickActions: 'त्वरित कार्रवाइयां',
    manageVendors: 'विक्रेता प्रबंधित करें',
    correctionInbox: 'सुधार इनबॉक्स',
  },
  mr: {
    dashboardTitle: 'डॅशबोर्ड विहंगावलोकन',
    dashboardSubtitle: 'तुमच्या विक्रेता बदल विनंत्यांचे पुनरावलोकन करा',
    approvedRequests: 'मंजूर विनंत्या',
    pendingApprovals: 'प्रलंबित मंजुरी',
    rejectedRequests: 'नाकारलेल्या विनंत्या',
    quickActions: 'जलद कृती',
    manageVendors: 'विक्रेते व्यवस्थापित करा',
    correctionInbox: 'सुधारणा इनबॉक्स',
  }
};

function SubDashboard({ onTab, adminEmail }: { onTab: (t: Tab) => void; adminEmail: string }) {
  const [lang, setLang] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const handleStorage = () => {
      const updated = localStorage.getItem('app_language') as Language;
      if (updated && (updated === 'en' || updated === 'hi' || updated === 'mr')) {
        setLang(updated);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('app_language_change', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('app_language_change', handleStorage);
    };
  }, []);

  const t = subTrans[lang];
  const [kpis, setKpis] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('subadmin_requests').select('*').eq('subadmin_email', adminEmail);
      const list = data || [];
      setKpis({
        approved: list.filter((x: any) => x.status === 'approved').length,
        pending: list.filter((x: any) => x.status === 'pending').length,
        rejected: list.filter((x: any) => x.status === 'rejected').length
      });
      setLoading(false);
    })();
  }, [adminEmail]);

  if (loading) return <Spinner />;

  const kpiCards = [
    { label: t.approvedRequests, value: kpis.approved, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: t.pendingApprovals, value: kpis.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: t.rejectedRequests, value: kpis.rejected, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.dashboardTitle}</h1>
        <p className="text-muted mt-1">{t.dashboardSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
        {kpiCards.map((k) => (
          <SpotlightCard key={k.label} className="card p-6 hover-lift bg-surface border border-border">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${k.bg} ${k.color}`}>
              <k.icon size={24} />
            </div>
            <p className="text-4xl font-extrabold mt-6 text-text">{k.value}</p>
            <p className="text-sm text-muted font-semibold mt-1">{k.label}</p>
          </SpotlightCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="card p-6 bg-surface border border-border animate-fade-in-up delay-200">
          <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted">{t.quickActions}</h3>
          <div className="space-y-3">
            <button 
              onClick={() => onTab('vendors')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-2 border border-border hover:border-accent/40 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <Store size={16} className="text-accent" />
                <span className="text-sm font-bold">{t.manageVendors}</span>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </button>
            <button 
              onClick={() => onTab('live_tracker')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-2 border border-border hover:border-accent/40 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <ActivityIcon size={16} className="text-blue-500" />
                <span className="text-sm font-bold">Live Order Tracker</span>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </button>
            <button 
              onClick={() => onTab('pending')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-2 border border-border hover:border-accent/40 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-sm font-bold">{t.correctionInbox}</span>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyVendors({ show, adminEmail }: { show: (m: string, t?: 'success' | 'error' | 'info') => void; adminEmail: string }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [viewInventory, setViewInventory] = useState<VendorItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAddon, setSelectedAddon] = useState('');
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState<Vendor | null>(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const load = async () => {
    const [{ data: v }, { data: a }, { data: r }] = await Promise.all([
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('addons').select('*'),
      supabase.from('subadmin_requests').select('*').eq('subadmin_email', adminEmail).order('created_at', { ascending: false })
    ]);
    const normalizedVendors = (v || []).map((item: any) => ({
      ...item,
      id: item.id || item._id
    }));
    setVendors(normalizedVendors);
    setAddons(a || []);
    setRequests(r || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleEditSubmit = async (formData: any) => {
    if (!editVendor) return;
    const vendorId = editVendor.id || (editVendor as any)._id;
    const payload = JSON.stringify({
      owner_name: formData.owner_name,
      phone: formData.phone,
      email: formData.email || null,
      shop_name: formData.shop_name,
      address: formData.address,
      zip_code: formData.zip_code,
      plan_id: formData.plan_id || null,
      plan_name: formData.plan_name || null,
      logo_url: formData.logo_url || null,
      qr_url: formData.qr_url || null,
      birthdate: formData.birthdate || null,
      password: formData.password || null,
    });

    const { error } = await supabase.from('subadmin_requests').insert({
      subadmin_email: adminEmail,
      vendor_id: vendorId,
      vendor_name: editVendor.shop_name,
      action_type: 'edit',
      payload: payload
    });

    if (error) {
      show('Failed to submit edit request', 'error');
      return;
    }

    show('Edit request submitted to Super Admin for approval', 'success');
    setEditVendor(null);
    load();
  };

  const handleApplyAddon = async () => {
    if (!editVendor || !selectedAddon) return;
    const vendorId = editVendor.id || (editVendor as any)._id;
    const addon = addons.find(a => a.id === selectedAddon);
    if (!addon) return;

    const payload = JSON.stringify({ addon_id: addon.id, addon_name: addon.name, validity_days: addon.validity_days, max_clients: addon.max_clients });
    const { error } = await supabase.from('subadmin_requests').insert({
      subadmin_email: adminEmail,
      vendor_id: vendorId,
      vendor_name: editVendor.shop_name,
      action_type: 'add-on',
      payload: payload
    });

    if (error) {
      show('Failed to submit add-on request', 'error');
      return;
    }

    show('Add-on request submitted to Super Admin for approval', 'success');
    setEditVendor(null);
    setSelectedAddon('');
    load();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmVendor) return;
    const { error } = await supabase.from('subadmin_requests').insert({
      subadmin_email: adminEmail,
      vendor_id: deleteConfirmVendor.id,
      vendor_name: deleteConfirmVendor.shop_name,
      action_type: 'delete',
      payload: null
    });

    if (error) {
      show('Failed to submit delete request', 'error');
      return;
    }

    show('Delete request submitted to Super Admin for approval', 'success');
    setDeleteConfirmVendor(null);
    load();
  };

  const handleViewProfile = async (v: Vendor) => {
    setViewVendor(v);
    const { data } = await supabase.from('vendor_inventory').select('*').eq('vendor_id', v.id);
    setViewInventory(data || []);
  };

  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = vendors.filter((v) => {
    const matchesSearch = v.shop_name.toLowerCase().includes(search.toLowerCase()) || v.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' ||
      v.plan_name === categoryFilter ||
      (Array.isArray(v.active_subscriptions) && v.active_subscriptions.some((s: any) => s.category_name === categoryFilter || s.plan_name === categoryFilter));
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">Vendors Management</h1>
          <p className="text-[#6B7280] text-sm mt-1">Manage vendor profiles, update kitchen accounts, and submit approval requests to Super Admin.</p>
        </div>

        <button
          onClick={() => setShowRequestsModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#360910] text-[#C5A059] text-xs font-extrabold transition-all flex items-center gap-2 shadow-xs border border-[#C5A059]/40 cursor-pointer self-start sm:self-auto"
        >
          <FileText size={15} /> Sent Requests Audit ({requests.length})
        </button>
      </div>

      {/* Top Bar Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs animate-fade-in-up delay-100">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop or owner name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F3F4F6] border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F1A80A]/40"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#F3F4F6] border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F1A80A]/40 cursor-pointer"
        >
          <option value="all">All Category Plans</option>
          <option value="Tiffin">Tiffin Category</option>
          <option value="Bakery">Bakery Category</option>
          <option value="Dairy">Dairy Category</option>
          <option value="Sweets">Sweets Category</option>
          <option value="Snacks">Snacks Category</option>
          <option value="General">General Category</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#F3F4F6] border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F1A80A]/40 cursor-pointer"
        >
          <option value="all">All Submissions</option>
          <option value="approved">Live (Approved)</option>
          <option value="pending_approval">In Review</option>
          <option value="rejected">Rejected (Needs Correction)</option>
        </select>
      </div>

      {/* Main Vendor Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden animate-fade-in-up delay-200">
        <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] font-extrabold text-amber-900">
          <span>📱 Finger-Scrollable Table</span>
          <span className="animate-pulse">Swipe left/right ↔</span>
        </div>
        <div className="touch-scroll-x">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="px-6 py-4">Shop details</th>
                <th className="px-6 py-4">Owner contact</th>
                <th className="px-6 py-4">Zip Zone</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.map((v) => {
                const pendingReq = requests.find(r => r.vendor_id === v.id && (!r.status || r.status === 'pending' || r.status === 'pending_approval'));
                const cleanPhone = (v.phone || '').replace(/\D/g, '');

                return (
                  <tr key={v.id} className="hover:bg-gray-50/60 transition-colors bg-white">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {v.logo_url ? (
                        <img src={v.logo_url} alt={v.shop_name} className="w-10 h-10 rounded-xl object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200"><Store size={16} className="text-gray-400" /></div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#111827]">{v.shop_name}</p>
                          {pendingReq && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold animate-pulse">
                              ⏳ Request Pending ({pendingReq.action_type})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">{new Date(v.created_at).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#111827]">{v.owner_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-[#D97706]">📞 {v.phone}</span>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(v.owner_name)}%2C%20regarding%20your%20kitchen%20account%20${encodeURIComponent(v.shop_name)}...`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 hover:bg-green-200 text-green-800 text-[11px] font-bold transition-colors border border-green-300 shadow-xs active:scale-95"
                            title="Contact vendor on WhatsApp"
                          >
                            <MessageCircle size={12} className="text-green-700" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#111827]">{v.zip_code}</td>
                    <td className="px-6 py-4">
                      <Badge variant="accent">{v.plan_name || 'Free'}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'error' : 'warning'}>
                        {v.status === 'approved' ? 'Live' : v.status === 'rejected' ? 'Needs Correction' : 'In Review'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewProfile(v)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:text-black hover:bg-gray-200 transition-all border border-gray-200 cursor-pointer active:scale-95"
                          title="View Profile Info & Inventory"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditVendor(v)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all border border-amber-200 cursor-pointer active:scale-95"
                          title="Edit Details / Submit Request to Super Admin"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmVendor(v)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-all border border-red-200 cursor-pointer active:scale-95"
                          title="Submit Deletion Request"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Store size={28} />} title="No vendors found" subtitle="Onboard your first restaurant to get started" />}
      </div>

      {/* ── Sent Requests Audit Modal ── */}
      {showRequestsModal && (
        <Modal
          open={showRequestsModal}
          onClose={() => setShowRequestsModal(false)}
          title="Submitted Requests to Super Admin"
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <p className="text-gray-500">History of vendor edit, add-on, and deletion requests submitted for Super-Admin approval.</p>

            {requests.length === 0 ? (
              <EmptyState icon={<FileText size={24} />} title="No requests submitted yet" />
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 divide-y divide-gray-100">
                {requests.map((r) => (
                  <div key={r.id || r._id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111827]">{r.vendor_name || 'Vendor Account'}</span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border border-gray-200">
                          {r.action_type || 'edit'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">Submitted: {new Date(r.created_at).toLocaleString()}</p>
                    </div>

                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>
                      {r.status || 'Pending Approval'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      <Modal open={!!editVendor} onClose={() => setEditVendor(null)} title="Modify Vendor Details" size="xl">
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
              <p className="text-xs text-slate-500">Submit a request to assign an Add-on to extend this vendor's validity and client limits.</p>
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
                <Button onClick={handleApplyAddon} disabled={!selectedAddon}>Request Add-on</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Vendor Confirm Modal */}
      <Modal open={!!deleteConfirmVendor} onClose={() => setDeleteConfirmVendor(null)} title="Delete Vendor Account">
        {deleteConfirmVendor && (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">Request Vendor Deletion</p>
                <p className="text-xs text-red-600/80 mt-1">This will send a delete request to the Super Admin for vendor <strong>{deleteConfirmVendor.shop_name}</strong>.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setDeleteConfirmVendor(null)}>Cancel</Button>
              <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleDeleteConfirm}>Submit Delete Request</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Slide-out Read-Only Profile View Panel */}
      <Drawer open={!!viewVendor} onClose={() => setViewVendor(null)} title="Vendor Profile Info">
        {viewVendor && (
          <div className="space-y-6">
            <div className="text-center pb-6 border-b border-border">
              {viewVendor.logo_url ? (
                <img src={viewVendor.logo_url} alt={viewVendor.shop_name} className="w-20 h-20 rounded-2xl object-cover mx-auto border border-border" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-surface-2 mx-auto flex items-center justify-center border border-border"><Store size={32} className="text-muted" /></div>
              )}
              <h2 className="text-xl font-extrabold text-text mt-3">{viewVendor.shop_name}</h2>
              <p className="text-xs text-muted mt-1">{viewVendor.address}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge variant={viewVendor.status === 'approved' ? 'success' : viewVendor.status === 'rejected' ? 'error' : 'warning'}>
                  {viewVendor.status.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="accent">{viewVendor.plan_name || 'Free'}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Owner Details</p>
              <div className="grid grid-cols-2 gap-4 text-sm bg-surface-2 p-4 rounded-2xl border border-border">
                <div>
                  <p className="text-xs text-muted">Owner Name</p>
                  <p className="font-semibold text-text mt-0.5">{viewVendor.owner_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Phone Number</p>
                  <p className="font-semibold text-text mt-0.5">{viewVendor.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted">Email Address</p>
                  <p className="font-semibold text-text mt-0.5">{viewVendor.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Food Inventory ({viewInventory.length} Items)</p>
              {viewInventory.length === 0 ? (
                <EmptyState icon={<Package size={20} />} title="No inventory items uploaded" />
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {viewInventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.image_url && <img src={item.image_url} alt={item.item_name} className="w-8 h-8 rounded-lg object-cover border border-border" />}
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-text">{item.item_name}</p>
                          <p className="text-[10px] text-muted">{item.category}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-accent">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function CorrectionInbox({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vendor | null>(null);

  const load = async () => {
    // Fetch only rejected submissions
    const { data } = await supabase.from('vendors').select('*').eq('status', 'rejected').order('created_at', { ascending: false });
    setVendors(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleResubmitSubmit = async (formData: any) => {
    if (!selected) return;
    const { error } = await supabase.from('vendors').update({
      owner_name: formData.owner_name,
      phone: formData.phone,
      email: formData.email || null,
      shop_name: formData.shop_name,
      address: formData.address,
      zip_code: formData.zip_code,
      plan_id: formData.plan_id || null,
      plan_name: formData.plan_name || null,
      logo_url: formData.logo_url || null,
      qr_url: formData.qr_url || null,
      status: 'pending_approval',
      rejection_note: null // Clear old feedback note
    }).eq('id', selected.id);

    if (error) {
      show('Failed to resubmit vendor', 'error');
      return;
    }

    await supabase.from('activity_log').insert({
      action: `Vendor resubmitted after correction: ${formData.shop_name}`,
      actor: 'Sub-Admin'
    });

    show('Vendor resubmitted successfully!');
    setSelected(null);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">Correction Inbox</h1>
        <p className="text-muted mt-1">{vendors.length} vendor submission(s) rejected by Super Admin</p>
      </div>

      {vendors.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={28} className="text-green-500" />} title="All clear!" subtitle="No rejections requiring action." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {vendors.map((v) => (
            <div key={v.id} className="card p-6 bg-surface border border-border relative hover:border-red-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-extrabold text-base truncate text-text">{v.shop_name}</h3>
                  <Badge variant="error">Rejected</Badge>
                </div>
                
                {/* Highlighted Rejection feedback note */}
                <div className="my-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 font-semibold leading-relaxed">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-red-700 mb-1">Feedback Note:</p>
                  "{v.rejection_note || 'Please review information and resubmit.'}"
                </div>

                <div className="space-y-1 text-xs text-muted">
                  <p>Owner: <span className="font-semibold text-text">{v.owner_name}</span></p>
                  <p>Phone: <span className="font-semibold text-text">{v.phone}</span></p>
                  <p>Zip: <span className="font-semibold text-text">{v.zip_code}</span></p>
                </div>
              </div>

              <Button size="sm" className="w-full mt-6" onClick={() => setSelected(v)}>
                <Pencil size={14} /> Correct & Resubmit
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Resubmit Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Correct & Resubmit Vendor" size="xl">
        {selected && (
          <div className="space-y-4">
            {/* Show Rejection Feedback Note at top of modal */}
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 leading-relaxed font-semibold">
              <span className="font-bold text-xs uppercase tracking-wider block text-red-700 mb-1">Super Admin Feedback:</span>
              "{selected.rejection_note || 'Please update info and resubmit.'}"
            </div>
            
            <VendorForm 
              initialData={selected} 
              submitLabel="Resubmit for Approval" 
              onSubmit={handleResubmitSubmit} 
              onCancel={() => setSelected(null)} 
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function SubGuides() {
  const [guides, setGuides] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [selectedFaq, setSelectedFaq] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'docs' | 'faq'>('docs');

  useEffect(() => {
    (async () => {
      const [guideRes, faqRes] = await Promise.all([
        supabase.from('guides').select('*').order('uploaded_at', { ascending: false }),
        fetch('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'faqs', action: 'select', sorts: [{ field: 'is_pinned', ascending: false }] })
        }).then(r => r.json()).catch(() => ({ data: [] }))
      ]);
      // Filter: only show guides where allowed_roles includes 'sub_admin'
      const allGuides = guideRes.data || [];
      const subAdminGuides = allGuides.filter((g: any) => {
        const roles: string[] = Array.isArray(g.allowed_roles) ? g.allowed_roles : [g.category || ''];
        return roles.includes('sub_admin') || roles.includes('all');
      });
      setGuides(subAdminGuides);
      // FAQs for sub_admin
      const allFaqs = faqRes.data || [];
      const subAdminFaqs = allFaqs.filter((f: any) => {
        const roles: string[] = Array.isArray(f.allowed_roles) ? f.allowed_roles : [];
        return roles.includes('sub_admin') || roles.length === 0;
      });
      setFaqs(subAdminFaqs);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  if (loading) return <Spinner />;

  const filteredGuides = guides.filter(g => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return g.title?.toLowerCase().includes(q) || g.keywords?.toLowerCase().includes(q);
  }).sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  const filteredFaqs = faqs.filter(f => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q);
  }).sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">SOP Guides & Knowledge Base</h1>
        <p className="text-muted mt-1">Review operational SOPs, guidelines, and FAQs published by Super Admin</p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-1 bg-surface-2 p-1.5 rounded-2xl border border-border w-fit">
          {[
            { id: 'docs' as const, label: `Documents (${guides.length})`, icon: FileText },
            { id: 'faq' as const, label: `FAQs (${faqs.length})`, icon: MessageSquare }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === t.id ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-text hover:bg-surface'}`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:border-accent outline-none"
          />
        </div>
      </div>

      {/* Documents Tab */}
      {activeTab === 'docs' && (
        filteredGuides.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title="No SOP documents available for Sub-Admins" />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {filteredGuides.map((g) => (
              <div key={g.id} className={`card p-6 bg-surface border hover-lift flex flex-col justify-between ${g.is_pinned ? 'border-accent/40' : 'border-border'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                      <FileText size={16} className="text-accent" />
                    </div>
                    {g.is_pinned && <span className="text-[10px] font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded-full">⭐ Pinned</span>}
                  </div>
                  <h3 className="font-extrabold text-base text-text leading-snug">{g.title}</h3>
                  {g.version_note && <p className="text-[11px] text-accent font-semibold mt-1">{g.version_note}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="info">Sub-Admin</Badge>
                    {g.keywords && <span className="text-[10px] text-muted truncate max-w-[120px]">{g.keywords}</span>}
                  </div>
                </div>
                {g.file_data ? (
                  <Button variant="outline" size="sm" className="w-full mt-6" onClick={() => setSelectedGuide(g)}>
                    <Eye size={13} className="mr-1.5" /> View Document
                  </Button>
                ) : (
                  <span className="text-xs text-muted italic mt-6 block text-center">No file attached</span>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* FAQs Tab */}
      {activeTab === 'faq' && (
        filteredFaqs.length === 0 ? (
          <EmptyState icon={<MessageSquare size={28} />} title="No FAQs published for Sub-Admins yet" />
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => {
              const faqId = faq._id || faq.id;
              return (
                <div key={faqId} className={`card p-5 bg-surface border hover-lift ${faq.is_pinned ? 'border-accent/40' : 'border-border'}`}>
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                        <MessageSquare size={13} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {faq.is_pinned && <span className="text-[10px] font-extrabold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">⭐ Pinned</span>}
                          <Badge variant={faq.category === 'vendor' ? 'accent' : faq.category === 'sub_admin' ? 'info' : 'success'}>{faq.category}</Badge>
                        </div>
                        <p className="font-extrabold text-text text-sm leading-snug">{faq.question}</p>
                        <p className="text-xs text-muted mt-1.5 leading-relaxed line-clamp-2">{faq.answer}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedFaq(faq)} className="shrink-0">
                      Read
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Document Preview Drawer */}
      <Drawer open={!!selectedGuide} onClose={() => setSelectedGuide(null)} title={selectedGuide?.title || 'Guide'}>
        {selectedGuide && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-surface-2 p-3 rounded-xl border border-border">
              <div>
                {selectedGuide.version_note && <p className="text-[11px] text-accent font-semibold mb-1">{selectedGuide.version_note}</p>}
                <span className="text-xs text-muted">Category: <span className="font-bold text-text">{selectedGuide.category}</span></span>
              </div>
              <a href={selectedGuide.file_data} download={selectedGuide.file_name || 'guide.pdf'} className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                Download
              </a>
            </div>
            <div className="rounded-xl border border-border overflow-hidden min-h-[40vh]">
              {selectedGuide.file_data && (selectedGuide.file_data.startsWith('data:image') || /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(selectedGuide.file_name || '')) ? (
                <img src={selectedGuide.file_data} alt={selectedGuide.title} className="w-full h-auto object-contain" />
              ) : selectedGuide.file_data ? (
                <iframe src={selectedGuide.file_data} title={selectedGuide.title} className="w-full h-[65vh] border-0" />
              ) : (
                <EmptyState icon={<FileText size={24} />} title="No file attached" />
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* FAQ Preview Drawer */}
      <Drawer open={!!selectedFaq} onClose={() => setSelectedFaq(null)} title="FAQ Answer">
        {selectedFaq && (
          <div className="space-y-5">
            <Badge variant={selectedFaq.category === 'sub_admin' ? 'info' : 'accent'}>{selectedFaq.category}</Badge>
            <div className="p-4 bg-surface-2 rounded-xl border border-border">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Question</p>
              <p className="font-extrabold text-text text-base leading-snug">{selectedFaq.question}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Answer</p>
              <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{selectedFaq.answer}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}



// 5. Live Order Tracker Tab Component for Sub-Admin
function SubAdminLiveOrderTrackerTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'awaiting' | 'approved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const prevAwaitingCount = useRef<number>(0);

  const playNewOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders',
          action: 'select',
          admin_override: true
        })
      });
      const d = await res.json();
      const loadedOrders = (d.data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const currentAwaiting = loadedOrders.filter((o: any) => !o.vendor_id && (o.status === 'awaiting_subadmin_approval' || o.status === 'pending')).length;
      if (prevAwaitingCount.current > 0 && currentAwaiting > prevAwaitingCount.current) {
        playNewOrderChime();
      }
      prevAwaitingCount.current = currentAwaiting;

      setOrders(loadedOrders);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveOrder = async (order: any) => {
    try {
      const targetId = order.id || order._id;
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders',
          action: 'update',
          filters: { id: targetId },
          data: {
            status: 'pending',
            created_at: new Date().toISOString()
          },
          admin_override: true
        })
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      show(`✅ Order #${targetId.toString().substring(0, 6).toUpperCase()} Approved! Broadcasted to nearby vendors.`, 'success');
      fetchOrders();
    } catch (e: any) {
      console.error(e);
      show(e.message || 'Failed to approve order', 'error');
    }
  };

  const handleDiscardOrder = async (order: any) => {
    try {
      const targetId = order.id || order._id;
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders',
          action: 'delete',
          filters: { id: targetId },
          admin_override: true
        })
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      show(`❌ Order #${targetId.toString().substring(0, 6).toUpperCase()} discarded & permanently deleted!`, 'info');
      fetchOrders();
    } catch (e: any) {
      console.error(e);
      show(e.message || 'Failed to discard order', 'error');
    }
  };

  const getElapsedSLA = (createdAt: string) => {
    const elapsedMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
    const mins = Math.floor(elapsedMs / 60000);
    const secs = Math.floor((elapsedMs % 60000) / 1000);
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    let colorClass = 'bg-green-100 text-green-800 border-green-200';
    if (mins >= 5) colorClass = 'bg-red-100 text-red-800 border-red-300 animate-pulse';
    else if (mins >= 2) colorClass = 'bg-amber-100 text-amber-800 border-amber-300';
    return { formatted, colorClass, mins };
  };

  const filteredOrders = orders.filter(o => {
    const isAwaiting = o.status === 'awaiting_subadmin_approval';
    const isBroadcasting = !o.vendor_id && o.status === 'pending';
    const isClaimed = !!o.vendor_id || ['accepted', 'preparing', 'out_for_delivery', 'delivered'].includes(o.status);

    // Completely exclude/discard claimed orders from Live Order Tracker view
    if (isClaimed) return false;

    if (filter === 'awaiting' && !isAwaiting) return false;
    if (filter === 'approved' && !isBroadcasting) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = (o.client_name || '').toLowerCase().includes(term);
      const phoneMatch = (o.client_phone || '').includes(term);
      const itemMatch = (o.item_name || '').toLowerCase().includes(term);
      const codeMatch = (o.id || o._id || '').toString().toLowerCase().includes(term);
      return nameMatch || phoneMatch || itemMatch || codeMatch;
    }
    return true;
  });

  const awaitingCount = orders.filter(o => o.status === 'awaiting_subadmin_approval').length;
  const approvedCount = orders.filter(o => !o.vendor_id && o.status === 'pending').length;
  const totalLiveTrackerCount = awaitingCount + approvedCount;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">Live Order Tracker</h1>
            {awaitingCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#A5C8FF] text-[#1E40AF] font-bold text-xs shadow-xs">
                {awaitingCount} Awaiting
              </span>
            )}
          </div>
          <p className="text-[#6B7280] text-sm mt-1">
            Review all incoming client orders in real time. Approve <span className="text-green-600 font-bold">✅</span> to broadcast to nearby vendors or Discard <span className="text-red-600 font-bold">❌</span>.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 rounded-xl bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-xs border border-gray-200"
        >
          <RefreshCw size={14} className="text-[#4B5563]" /> Refresh Live Stream
        </button>
      </div>

      {/* 2. Filter & Search Bar Area */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-[#F1A80A] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-100'
            }`}
          >
            All Orders ({totalLiveTrackerCount})
          </button>
          <button
            onClick={() => setFilter('awaiting')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filter === 'awaiting'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#2563EB] bg-blue-50/70 hover:bg-blue-100/70'
            }`}
          >
            ⏳ Awaiting Approval ({awaitingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filter === 'approved'
                ? 'bg-[#16A34A] text-white shadow-xs'
                : 'text-[#16A34A] bg-green-50/70 hover:bg-green-100/70'
            }`}
          >
            ✅ Approved &amp; Live ({approvedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search order, client, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[#F3F4F6] text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F1A80A]/40 border-none"
          />
        </div>
      </div>

      {/* ── Mobile Phone Card View (Visible on Mobile Screens) ── */}
      <div className="block md:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-xs">
            <Clock size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="font-bold text-sm text-gray-800">No orders found in this view</p>
            <p className="text-xs text-gray-500 mt-1">New client orders will appear here in real time.</p>
          </div>
        ) : (
          filteredOrders.map((o) => {
            const targetId = o.id || o._id;
            const formattedCode = `#${targetId.toString().substring(0, 6).toUpperCase()}`;
            const isAwaiting = o.status === 'awaiting_subadmin_approval';
            const isBroadcasting = !o.vendor_id && o.status === 'pending';
            const isClaimed = !!o.vendor_id || ['accepted', 'preparing', 'out_for_delivery', 'delivered'].includes(o.status);
            const sla = getElapsedSLA(o.created_at);
            const cleanPhone = (o.client_phone || '').replace(/\D/g, '');
            const createdDate = new Date(o.created_at);

            return (
              <div key={targetId} className="rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3 bg-white">
                {/* Mobile Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-base text-[#111827] block">{formattedCode}</span>
                    <span className="text-xs text-[#6B7280] block mt-0.5">
                      {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] text-[#6B7280] block">
                      {createdDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${sla.colorClass}`}>
                      ⏱ SLA: {sla.formatted}
                    </span>
                    {isAwaiting && (
                      <span className="border border-gray-200 bg-white text-[#374151] rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                        ⏳ Awaiting Approval
                      </span>
                    )}
                    {isBroadcasting && (
                      <span className="border border-amber-300 bg-amber-50 text-amber-900 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                        📡 Live Broadcast
                      </span>
                    )}
                    {isClaimed && (
                      <span className="border border-green-300 bg-green-50 text-green-800 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                        ✅ Approved &amp; Live
                      </span>
                    )}
                  </div>
                </div>

                {/* Ordered Item Box */}
                <div className="bg-[#FAF9F6] p-3 rounded-xl border border-gray-200/60 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-[#D97706]">
                      {o.item_name}{!o.item_name?.toLowerCase().includes('order') ? ` (${o.quantity || 1} order${(o.quantity || 1) > 1 ? 's' : ''})` : ''}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Quantity: <strong className="text-[#111827]">{o.quantity || 1} pc</strong></p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium rounded-md">
                      Category: {o.master_category_name || o.category || 'General'}
                    </span>
                  </div>
                  <span className="text-base font-bold text-[#111827]">₹{o.price || o.total_price || ''}</span>
                </div>

                {/* Client Contact Info & WhatsApp */}
                <div className="space-y-1 text-xs text-[#6B7280]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111827] text-sm">{o.client_name}</span>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(o.client_name)}%2C%20regarding%20your%20order%20${encodeURIComponent(formattedCode)}...`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-bold text-[11px] border border-green-300 shadow-xs"
                      >
                        <MessageCircle size={12} className="text-green-700" /> WhatsApp
                      </a>
                    )}
                  </div>
                  <p className="text-[#D97706] font-bold">📞 {o.client_phone}</p>
                  <p className="text-[#6B7280]">{o.client_address}</p>
                  <p className="text-[11px] text-[#6B7280]">PIN: <strong className="text-[#111827]">{o.client_zip}</strong> | Landmark: <strong className="text-[#111827]">{o.client_landmark}</strong></p>
                </div>

                {/* Sub-Admin Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-2">
                  {isAwaiting && (
                    <>
                      <button
                        onClick={() => handleDiscardOrder(o)}
                        className="flex-1 py-2 rounded-full bg-[#E53935] hover:bg-red-700 text-white font-extrabold text-xs uppercase shadow-xs transition-all cursor-pointer text-center"
                      >
                        reject
                      </button>
                      <button
                        onClick={() => handleApproveOrder(o)}
                        className="flex-1 py-2 rounded-full bg-[#2E7D32] hover:bg-green-800 text-white font-extrabold text-xs uppercase shadow-xs transition-all cursor-pointer text-center"
                      >
                        approve
                      </button>
                    </>
                  )}

                  {isBroadcasting && (
                    <div className="w-full flex justify-between items-center bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <span className="text-xs font-bold text-amber-800">Broadcasting to vendors...</span>
                      <button
                        onClick={() => handleDiscardOrder(o)}
                        className="px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs"
                      >
                        Discard ❌
                      </button>
                    </div>
                  )}

                  {isClaimed && (
                    <div className="w-full p-2 rounded-xl bg-green-50 border border-green-200 text-center">
                      <span className="text-xs font-bold text-green-800 block">Claimed by Vendor</span>
                      <span className="text-xs text-green-700 font-semibold block mt-0.5 truncate">
                        {o.vendor_name || o.vendor_phone || 'Partner Kitchen'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 3. Data Table (Desktop View - 100% Matching Image) ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="touch-scroll-x">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="p-4">ORDER ID &amp; TIME</th>
                <th className="p-4">CLIENT &amp; CONTACT DETAILS</th>
                <th className="p-4">ORDERED ITEMS &amp; QTY</th>
                <th className="p-4">TOTAL PRICE</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-center">SUB-ADMIN ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock size={28} className="text-gray-400" />
                      <p className="font-bold text-sm text-[#111827]">No orders found in this view</p>
                      <p className="text-xs text-[#6B7280]">New orders placed by clients on the website will appear here in real time.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const targetId = o.id || o._id;
                  const formattedCode = `#${targetId.toString().substring(0, 6).toUpperCase()}`;
                  const isAwaiting = o.status === 'awaiting_subadmin_approval';
                  const isBroadcasting = !o.vendor_id && o.status === 'pending';
                  const isClaimed = !!o.vendor_id || ['accepted', 'preparing', 'out_for_delivery', 'delivered'].includes(o.status);
                  const sla = getElapsedSLA(o.created_at);
                  const cleanPhone = (o.client_phone || '').replace(/\D/g, '');
                  const createdDate = new Date(o.created_at);

                  return (
                    <tr key={targetId} className="hover:bg-gray-50/60 transition-colors bg-white">
                      {/* Column 1: ORDER ID & TIME */}
                      <td className="p-4 align-top">
                        <span className="font-bold text-base text-[#111827] block">{formattedCode}</span>
                        <span className="text-xs text-[#6B7280] block mt-0.5 font-normal">
                          {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-[#6B7280] block font-normal">
                          {createdDate.toLocaleDateString()}
                        </span>

                        {/* SLA Countdown Badge */}
                        <div className="mt-2 inline-flex items-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${sla.colorClass}`}>
                            ⏱ SLA: {sla.formatted}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: CLIENT & CONTACT DETAILS */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-[#111827] text-sm">{o.client_name}</p>
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-[#D97706]">📞 {o.client_phone}</span>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(o.client_name)}%2C%20regarding%20your%20order%20${encodeURIComponent(formattedCode)}...`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 hover:bg-green-200 text-green-800 text-[10px] font-bold transition-colors border border-green-300 shadow-xs"
                              title="Verify order details on WhatsApp"
                            >
                              <MessageCircle size={11} className="text-green-700" /> WhatsApp
                            </a>
                          )}
                        </div>

                        <p className="text-xs text-[#6B7280] mt-1 max-w-xs">{o.client_address}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          PIN: <strong className="text-[#111827]">{o.client_zip}</strong> | Landmark: <strong className="text-[#111827]">{o.client_landmark}</strong>
                        </p>
                      </td>

                      {/* Column 3: ORDERED ITEMS & QTY */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-[#D97706] text-sm">
                          {o.item_name}{!o.item_name?.toLowerCase().includes('order') ? ` (${o.quantity || 1} order${(o.quantity || 1) > 1 ? 's' : ''})` : ''}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-0.5">Quantity: <strong className="text-[#111827]">{o.quantity || 1} pc</strong></p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium rounded-md">
                          Category: {o.master_category_name || o.category || 'General'}
                        </span>
                      </td>

                      {/* Column 4: TOTAL PRICE */}
                      <td className="p-4 align-top">
                        <span className="font-bold text-base text-[#111827]">₹{o.price || o.total_price || ''}</span>
                      </td>

                      {/* Column 5: STATUS */}
                      <td className="p-4 align-top">
                        {isAwaiting && (
                          <div className="border border-gray-200 bg-white text-[#374151] rounded-full px-3.5 py-1 text-xs font-semibold shadow-xs inline-flex items-center gap-1">
                            ⏳ Awaiting Approval
                          </div>
                        )}
                        {isBroadcasting && (
                          <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-full px-3.5 py-1 text-xs font-bold inline-flex items-center gap-1">
                            📡 Broadcasting to Vendors
                          </div>
                        )}
                        {isClaimed && (
                          <div className="border border-green-300 bg-green-50 text-green-800 rounded-full px-3.5 py-1 text-xs font-bold inline-flex items-center gap-1">
                            ✅ Approved &amp; Live
                          </div>
                        )}
                      </td>

                      {/* Column 6: SUB-ADMIN ACTION */}
                      <td className="p-4 align-top text-center">
                        {isAwaiting && (
                          <div className="flex items-center justify-center gap-2">
                            {/* Reject Red Pill Button */}
                            <button
                              onClick={() => handleDiscardOrder(o)}
                              className="h-8 px-5 rounded-full bg-[#E53935] hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center cursor-pointer tracking-wide uppercase"
                              title="Reject & Delete Order Permanently"
                            >
                              reject
                            </button>

                            {/* Approve Green Pill Button */}
                            <button
                              onClick={() => handleApproveOrder(o)}
                              className="h-8 px-5 rounded-full bg-[#2E7D32] hover:bg-green-800 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center cursor-pointer tracking-wide uppercase"
                              title="Approve order — Shift to Approved & Live broadcast for vendors"
                            >
                              approve
                            </button>
                          </div>
                        )}

                        {isBroadcasting && (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] font-bold text-amber-700">Broadcasting...</span>
                            <button
                              onClick={() => handleDiscardOrder(o)}
                              className="h-7 px-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition-all shadow-xs cursor-pointer"
                              title="Discard broadcasted order"
                            >
                              Discard Order ❌
                            </button>
                          </div>
                        )}

                        {isClaimed && (
                          <div className="p-2 rounded-xl bg-green-50 border border-green-200 text-center">
                            <span className="text-xs font-bold text-green-800 block">Claimed by Vendor</span>
                            <span className="text-[10px] text-green-700 font-semibold block truncate max-w-[140px] mx-auto mt-0.5">
                              {o.vendor_name || o.vendor_phone || 'Partner Kitchen'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 6. Pending & Missed Orders Tab for Sub-Admin
function SubAdminPendingOrdersTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOrder, setAssignModalOrder] = useState<any | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  const load = async () => {
    try {
      // Load pending orders
      const orderRes = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders',
          action: 'select',
          filters: { status: 'pending' },
          admin_override: true
        })
      });
      const orderData = await orderRes.json();
      setOrders((orderData.data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      // Load active approved vendors for manual assignment
      const vendorRes = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vendors',
          action: 'select',
          filters: { status: 'approved' }
        })
      });
      const vendorData = await vendorRes.json();
      setVendors(vendorData.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Update timer every 1 second to calculate live broadcast countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResumeOrder = async (order: any) => {
    try {
      const targetId = order.id || order._id;
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders',
          action: 'update',
          filters: { id: targetId },
          data: {
            status: 'pending',
            created_at: new Date().toISOString()
          },
          admin_override: true
        })
      });
      show(`Order #${targetId.toString().substring(0, 6).toUpperCase()} resumed & re-broadcasted to nearby active vendors!`, 'success');
      load();
    } catch (e) {
      console.error(e);
      show('Failed to resume order', 'error');
    }
  };

  const handleResumeAllMissed = async () => {
    const missedOrders = orders.filter(o => Date.now() - new Date(o.created_at).getTime() > 60 * 1000);
    if (missedOrders.length === 0) {
      show('No missed orders to resume', 'info');
      return;
    }

    try {
      for (const order of missedOrders) {
        const targetId = order.id || order._id;
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'orders',
            action: 'update',
            filters: { id: targetId },
            data: {
              status: 'pending',
              created_at: new Date().toISOString()
            },
            admin_override: true
          })
        });
      }
      show(`Successfully resumed and re-broadcasted ${missedOrders.length} missed orders!`, 'success');
      load();
    } catch (e) {
      console.error(e);
      show('Failed to resume missed orders', 'error');
    }
  };

  const handleManualAssign = async () => {
    if (!assignModalOrder || !selectedVendorId) {
      show('Please select a target vendor', 'error');
      return;
    }
    const targetVendor = vendors.find(v => (v.id || (v as any)._id) === selectedVendorId);
    if (!targetVendor) return;

    setAssigning(true);
    try {
      const targetOrderId = assignModalOrder.id || assignModalOrder._id;
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders',
          action: 'update',
          filters: { id: targetOrderId },
          data: {
            vendor_id: selectedVendorId,
            vendor_name: targetVendor.shop_name,
            vendor_phone: targetVendor.phone,
            status: 'accepted'
          },
          admin_override: true
        })
      });
      show(`Order #${targetOrderId.toString().substring(0, 6).toUpperCase()} force-assigned to ${targetVendor.shop_name}!`, 'success');
      setAssignModalOrder(null);
      setSelectedVendorId('');
      load();
    } catch (e) {
      console.error(e);
      show('Failed to assign vendor', 'error');
    }
    setAssigning(false);
  };

  if (loading) return <Spinner />;

  const missedOrdersList = orders.filter(o => Date.now() - new Date(o.created_at).getTime() > 60 * 1000);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title & Batch Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">Pending &amp; Missed Orders</h1>
            {missedOrdersList.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-xs animate-pulse shadow-xs border border-red-300">
                {missedOrdersList.length} Missed
              </span>
            )}
          </div>
          <p className="text-[#6B7280] text-sm mt-1">
            Monitor live 9-hour vendor broadcasting countdowns and resume missed client orders for partner kitchens.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {missedOrdersList.length > 0 && (
            <button
              onClick={handleResumeAllMissed}
              className="px-4 py-2 rounded-xl bg-[#4A0E17] hover:bg-[#360910] text-[#C5A059] text-xs font-black transition-all flex items-center gap-1.5 shadow-sm border border-[#C5A059]/40 cursor-pointer"
              title="Re-broadcast all missed orders to nearby vendors simultaneously"
            >
              <RefreshCw size={14} className="animate-spin-slow" /> Resume All Missed ({missedOrdersList.length})
            </button>
          )}

          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs border border-gray-200"
          >
            <RefreshCw size={14} /> Refresh List
          </button>
        </div>
      </div>

      {/* Orders Grid / Empty State */}
      {orders.length === 0 ? (
        <EmptyState icon={<Clock size={32} />} title="No pending orders" subtitle="All incoming orders have been accepted or fulfilled." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((o) => {
            const targetId = o.id || o._id;
            const formattedCode = `#${targetId.toString().substring(0, 6).toUpperCase()}`;
            const elapsedMs = Math.max(0, Date.now() - new Date(o.created_at).getTime());
            const elapsedSecs = Math.floor(elapsedMs / 1000);
            const isMissed = elapsedSecs >= 32400; // 9 Hours (32,400s)
            const remainingSecs = Math.max(0, 32400 - elapsedSecs);
            const cleanPhone = (o.client_phone || '').replace(/\D/g, '');

            const formatRemainingTime = (secs: number) => {
              const h = Math.floor(secs / 3600);
              const m = Math.floor((secs % 3600) / 60);
              const s = secs % 60;
              if (h > 0) return `${h}h ${m}m ${s}s`;
              if (m > 0) return `${m}m ${s}s`;
              return `${s}s`;
            };

            // Vendor match count for this PIN code
            const matchingVendors = vendors.filter(v => v.zip_code === o.client_zip);

            return (
              <div
                key={targetId}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-xs ${
                  isMissed ? 'bg-red-50/40 border-red-200' : 'bg-white border-gray-200'
                }`}
              >
                <div>
                  {/* Card Header: Code & Live SLA Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-extrabold text-lg text-[#111827]">{formattedCode}</h3>
                      <span className="text-xs text-[#6B7280] block font-normal">
                        Placed: {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isMissed ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-xs border border-red-300 animate-pulse">
                          ⚠️ Missed (Expired)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300">
                          ⏱ {formatRemainingTime(remainingSecs)} remaining
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ordered Product Box */}
                  <div className="bg-[#FAF9F6] p-3 rounded-xl border border-gray-200/60 mb-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-[#D97706]">{o.item_name}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">Quantity: <strong className="text-[#111827]">{o.quantity} pc</strong></p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-medium rounded-md">
                        Category: {o.master_category_name || 'General'}
                      </span>
                    </div>
                    <span className="text-base font-extrabold text-[#111827]">₹{o.price || o.total_price}</span>
                  </div>

                  {/* Client Details Box */}
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 border border-gray-200/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111827]">{o.client_name}</span>
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(o.client_name)}%2C%20regarding%20your%20order%20${encodeURIComponent(formattedCode)}...`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold text-[10px] border border-green-300"
                        >
                          <MessageCircle size={10} className="text-green-700" /> WhatsApp
                        </a>
                      )}
                    </div>
                    <p className="text-[#D97706] font-bold">📞 {o.client_phone}</p>
                    <p className="text-[#6B7280] line-clamp-2">{o.client_address}</p>
                    <p className="text-[11px] text-[#6B7280]">
                      PIN: <strong className="text-[#111827]">{o.client_zip}</strong> | Landmark: <strong className="text-[#111827]">{o.client_landmark}</strong>
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#6B7280] font-semibold">
                    Matching Vendors: <strong className="text-[#111827]">{matchingVendors.length} in PIN</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Manual Assign Button */}
                    <button
                      onClick={() => {
                        setAssignModalOrder(o);
                        setSelectedVendorId('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] font-bold text-xs border border-gray-300 transition-all cursor-pointer flex items-center gap-1"
                      title="Force-assign order directly to a specific active vendor"
                    >
                      <Store size={12} /> Assign 🏪
                    </button>

                    {/* Resume / Re-broadcast Button */}
                    <button
                      onClick={() => handleResumeOrder(o)}
                      className="px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-green-800 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      title="Resume & restart 60-second broadcast to nearby vendors"
                    >
                      <RefreshCw size={12} /> Resume 🔄
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Manual Vendor Assignment Modal ── */}
      {assignModalOrder && (
        <Modal
          open={!!assignModalOrder}
          onClose={() => setAssignModalOrder(null)}
          title={`Direct Assign Order #${(assignModalOrder.id || assignModalOrder._id).toString().substring(0, 6).toUpperCase()}`}
        >
          <div className="space-y-4 text-xs text-[#374151]">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
              <p className="font-bold text-[#111827]">Order Details:</p>
              <p>Item: <strong className="text-[#D97706]">{assignModalOrder.item_name}</strong> (₹{assignModalOrder.price || assignModalOrder.total_price})</p>
              <p>Client: <strong>{assignModalOrder.client_name}</strong> ({assignModalOrder.client_phone})</p>
              <p>PIN Code: <strong>{assignModalOrder.client_zip}</strong> | Landmark: {assignModalOrder.client_landmark}</p>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-sm text-[#111827] block">Select Target Vendor / Kitchen:</label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-xs text-[#111827] font-semibold focus:outline-none focus:ring-2 focus:ring-[#F1A80A]"
              >
                <option value="">-- Choose Active Vendor --</option>
                {vendors.map((v) => {
                  const vId = v.id || (v as any)._id;
                  const isPinMatch = v.zip_code === assignModalOrder.client_zip;
                  return (
                    <option key={vId} value={vId}>
                      {v.shop_name} ({v.phone}) {isPinMatch ? '⭐ PIN MATCH' : `(PIN: ${v.zip_code})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <Button variant="ghost" size="sm" onClick={() => setAssignModalOrder(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleManualAssign} disabled={assigning || !selectedVendorId}>
                {assigning ? 'Assigning...' : 'Confirm Force Assignment ✅'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

