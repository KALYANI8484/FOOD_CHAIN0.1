import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Store, Plus, Users, Clock, CheckCircle2,
  Activity as ActivityIcon, AlertCircle, FileText, Eye, Pencil, Search,
  ArrowRight, Package, Trash2, Menu, X, RefreshCw
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
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-surface-2 border border-border text-text focus:outline-none"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
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

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                tab === item.id ? 'bg-accent/10 text-accent font-semibold' : 'text-muted hover:text-text hover:bg-surface-2'
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
            <LanguageSelector />
          </div>
          <Button variant="ghost" size="sm" className="w-full" onClick={onExit}>{navLabels.exit}</Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen bg-bg relative z-10 pt-16 lg:pt-0">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {tab === 'dashboard' && <SubDashboard onTab={setTab} adminEmail={adminEmail} />}
          {tab === 'vendors' && <MyVendors show={show} adminEmail={adminEmail} />}
          {tab === 'pending' && <CorrectionInbox show={show} />}
          {tab === 'guides' && <SubGuides />}
          {tab === 'live_tracker' && <SubAdminLiveOrderTrackerTab show={show} />}
          {tab === 'pending_orders' && <SubAdminPendingOrdersTab show={show} />}
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
  const [loading, setLoading] = useState(true);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [viewInventory, setViewInventory] = useState<VendorItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAddon, setSelectedAddon] = useState('');
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState<Vendor | null>(null);

  const load = async () => {
    const [{ data: v }, { data: a }] = await Promise.all([
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('addons').select('*')
    ]);
    setVendors(v || []);
    setAddons(a || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleEditSubmit = async (formData: any) => {
    if (!editVendor) return;
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
      vendor_id: editVendor.id,
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
  };

  const handleApplyAddon = async () => {
    if (!editVendor || !selectedAddon) return;
    const addon = addons.find(a => a.id === selectedAddon);
    if (!addon) return;

    const payload = JSON.stringify({ addon_id: addon.id, addon_name: addon.name, validity_days: addon.validity_days, max_clients: addon.max_clients });
    const { error } = await supabase.from('subadmin_requests').insert({
      subadmin_email: adminEmail,
      vendor_id: editVendor.id,
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
  };

  const handleViewProfile = async (v: Vendor) => {
    setViewVendor(v);
    const { data } = await supabase.from('vendor_inventory').select('*').eq('vendor_id', v.id);
    setViewInventory(data || []);
  };

  const filtered = vendors.filter((v) => {
    const matchesSearch = v.shop_name.toLowerCase().includes(search.toLowerCase()) || v.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Vendors</h1>
          <p className="text-muted mt-1">Manage vendor profiles and submit requests</p>
        </div>
      </div>

      {/* Top Bar Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-surface p-4 rounded-2xl border border-border animate-fade-in-up delay-100">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop or owner name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm focus:border-accent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm font-semibold text-text focus:border-accent outline-none cursor-pointer"
        >
          <option value="all">All Submissions</option>
          <option value="approved">Live (Approved)</option>
          <option value="pending_approval">In Review</option>
          <option value="rejected">Rejected (Needs Correction)</option>
        </select>
      </div>

      {/* Main Vendor Data Table */}
      <div className="card overflow-hidden bg-surface border border-border animate-fade-in-up delay-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2/60 border-b border-border text-xs font-bold text-muted uppercase tracking-wider">
                <th className="px-6 py-4">Shop details</th>
                <th className="px-6 py-4">Owner contact</th>
                <th className="px-6 py-4">Zip Zone</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-surface-2/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {v.logo_url ? (
                      <img src={v.logo_url} alt={v.shop_name} className="w-10 h-10 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center border border-border"><Store size={16} className="text-muted" /></div>
                    )}
                    <div>
                      <p className="font-bold text-text">{v.shop_name}</p>
                      <p className="text-xs text-muted mt-0.5">{new Date(v.created_at).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-text">{v.owner_name}</p>
                    <p className="text-xs text-muted mt-0.5">{v.phone}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-text">{v.zip_code}</td>
                  <td className="px-6 py-4">
                    <Badge variant="accent">{v.plan_name || 'Free'}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'error' : 'warning'}>
                      {v.status === 'approved' ? 'Live' : v.status === 'rejected' ? 'Needs Correction' : 'In Review'}
                    </Badge>
                  </td>
                  {/* Actions column using minimalist icons with soft beige palette */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewProfile(v)}
                        className="p-2 rounded-lg bg-surface-2 text-muted hover:text-text hover:bg-border/20 transition-all border border-border/40"
                        title="View Profile"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setEditVendor(v)}
                        className="p-2 rounded-lg bg-surface-2 text-muted hover:text-accent hover:bg-border/20 transition-all border border-border/40"
                        title="Edit Details"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmVendor(v)}
                        className="p-2 rounded-lg bg-surface-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all border border-border/40"
                        title="Delete Vendor"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Store size={28} />} title="No vendors found" subtitle="Onboard your first restaurant to get started" />}
      </div>

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
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      // Query guides where visibility includes sub-admins or is global
      const { data } = await supabase.from('guides').select('*').order('uploaded_at', { ascending: false });
      // In a real database we verify visibility settings
      setGuides(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">SOP Guides & Documents</h1>
        <p className="text-muted mt-1">Review operational guidelines and standard operating procedures</p>
      </div>

      {guides.length === 0 ? (
        <EmptyState icon={<FileText size={28} />} title="No guides published" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {guides.map((g) => (
            <div key={g.id} className="card p-6 bg-surface border border-border hover-lift flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <FileText size={18} className="text-accent" />
                </div>
                <h3 className="font-extrabold text-base text-text leading-snug">{g.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="accent">{g.category}</Badge>
                  {g.keywords && <span className="text-[10px] text-muted truncate max-w-[120px]">{g.keywords}</span>}
                </div>
              </div>

              {g.file_data ? (
                <Button variant="outline" size="sm" className="w-full mt-6" onClick={() => setSelectedGuide(g)}>
                  View Document
                </Button>
              ) : (
                <span className="text-xs text-muted italic mt-6 block text-center">No PDF Attached</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PDF Reading Drawer */}
      <Drawer open={!!selectedGuide} onClose={() => setSelectedGuide(null)} title={selectedGuide?.title || 'Guide'}>
        {selectedGuide && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-surface-2 p-3 rounded-xl border border-border">
              <span className="text-xs text-muted">Category: <span className="font-bold text-text">{selectedGuide.category}</span></span>
              <a 
                href={selectedGuide.file_data} 
                download={selectedGuide.file_name || 'guide.pdf'}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                Offline Download
              </a>
            </div>

            <div className="rounded-xl border border-border bg-white p-4 h-[60vh] flex flex-col items-center justify-center text-center">
              <FileText size={48} className="text-accent mb-4 animate-bounce" />
              <h4 className="font-bold text-text-bg text-black text-sm">{selectedGuide.file_name || 'Document.pdf'}</h4>
              <p className="text-xs text-muted mt-2 max-w-xs">Dynamic In-App PDF rendering ready. Click below to download and read this document offline.</p>
              
              <a 
                href={selectedGuide.file_data} 
                download={selectedGuide.file_name || 'guide.pdf'}
                className="mt-6 inline-flex items-center justify-center px-4 py-2 bg-accent text-white font-bold text-xs rounded-xl shadow-md"
              >
                Download PDF File
              </a>
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
      setOrders((d.data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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
      show(`✅ Order #${targetId.toString().substring(0, 6).toUpperCase()} Approved! Now visible to nearby kitchen vendors.`, 'success');
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
      show(`❌ Order #${targetId.toString().substring(0, 6).toUpperCase()} discarded & permanently deleted from database!`, 'info');
      fetchOrders();
    } catch (e: any) {
      console.error(e);
      show(e.message || 'Failed to discard order', 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'awaiting') {
      if (o.vendor_id || (o.status !== 'awaiting_subadmin_approval' && o.status !== 'pending')) return false;
    } else if (filter === 'approved') {
      if (!o.vendor_id && o.status !== 'accepted' && o.status !== 'preparing' && o.status !== 'out_for_delivery') return false;
    }

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

  const awaitingCount = orders.filter(o => !o.vendor_id && (o.status === 'awaiting_subadmin_approval' || o.status === 'pending')).length;
  const approvedCount = orders.filter(o => o.vendor_id || ['accepted', 'preparing', 'out_for_delivery'].includes(o.status)).length;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Live Order Tracker</h1>
            {awaitingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white font-black text-xs animate-pulse">
                {awaitingCount} Awaiting
              </span>
            )}
          </div>
          <p className="text-muted text-sm mt-1">Review all incoming client orders in real time. Approve ✅ to broadcast to nearby vendors or Discard ❌.</p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-xs font-bold hover:bg-surface-3 transition-colors flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={14} /> Refresh Live Stream
        </button>
      </div>

      {/* Structured Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-2.5 rounded-2xl border border-border">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === 'all' ? 'bg-amber-500 text-white shadow-xs' : 'text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilter('awaiting')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filter === 'awaiting' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-600 bg-blue-50/60 hover:bg-blue-100/60'
            }`}
          >
            ⏳ Awaiting Approval ({awaitingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === 'approved' ? 'bg-green-600 text-white shadow-xs' : 'text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            ✅ Approved &amp; Live ({approvedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search order, client, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-border text-xs focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Structured Table */}
      <div className="card overflow-hidden border border-border shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-2/70 border-b border-border text-[11px] font-bold text-muted uppercase tracking-wider">
                <th className="p-4">ORDER ID &amp; TIME</th>
                <th className="p-4">CLIENT &amp; CONTACT DETAILS</th>
                <th className="p-4">ORDERED ITEMS &amp; QTY</th>
                <th className="p-4">TOTAL PRICE</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-center">SUB-ADMIN ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock size={28} className="text-muted/60" />
                      <p className="font-bold text-sm">No orders found in this view</p>
                      <p className="text-xs text-muted">New orders placed by clients on the website will appear here in real time.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const targetId = o.id || o._id;
                  const formattedCode = `#${targetId.toString().substring(0, 6).toUpperCase()}`;
                  const isAwaiting = o.status === 'awaiting_subadmin_approval';
                  const isApproved = o.status === 'pending' || o.status === 'accepted' || o.status === 'delivered';
                  const isDiscarded = o.status === 'discarded' || o.status === 'rejected';

                  return (
                    <tr key={targetId} className={`hover:bg-surface-2/40 transition-colors ${isAwaiting ? 'bg-blue-50/30' : ''}`}>
                      {/* Order ID & Time */}
                      <td className="p-4 align-top">
                        <span className="font-black text-base text-text block">{formattedCode}</span>
                        <span className="text-[11px] text-muted block mt-0.5">
                          {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] text-muted/80 block">
                          {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Client Details */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-text text-sm">{o.client_name}</p>
                        <p className="text-xs text-amber-600 font-bold mt-0.5">📞 {o.client_phone}</p>
                        <p className="text-xs text-muted mt-1 max-w-xs line-clamp-2">{o.client_address}</p>
                        <p className="text-[11px] font-semibold text-muted mt-0.5">
                          PIN: <strong className="text-text">{o.client_zip}</strong> | Landmark: <strong className="text-text">{o.client_landmark}</strong>
                        </p>
                      </td>

                      {/* Ordered Items */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-accent text-sm">{o.item_name}</p>
                        <p className="text-xs text-muted mt-0.5">Quantity: <strong className="text-text">{o.quantity} pc</strong></p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-surface-2 text-muted text-[10px] font-bold rounded-md">
                          Category: {o.master_category_name || 'General'}
                        </span>
                      </td>

                      {/* Total Price */}
                      <td className="p-4 align-top">
                        <span className="font-extrabold text-base text-text">₹{o.price || o.total_price}</span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-4 align-top">
                        {isAwaiting && (
                          <Badge variant="info" className="animate-pulse">
                            ⏳ Awaiting Approval
                          </Badge>
                        )}
                        {!isAwaiting && (o.vendor_id || o.status === 'accepted' || o.status === 'preparing' || o.status === 'out_for_delivery') && (
                          <Badge variant="success">
                            ✅ Approved &amp; Live
                          </Badge>
                        )}
                        {!isAwaiting && (!o.vendor_id && o.status === 'pending') && (
                          <Badge variant="warning">
                            📡 Broadcasting to Vendors
                          </Badge>
                        )}
                      </td>

                      {/* Action Column: Reject (Red Pill) & Approve (Green Pill) */}
                      <td className="p-4 align-top text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Reject Red Pill Button */}
                          <button
                            onClick={() => handleDiscardOrder(o)}
                            className="h-8 px-4 rounded-full bg-[#E53935] hover:bg-red-700 active:scale-95 text-white font-black text-xs transition-all shadow-sm border-2 border-slate-900 flex items-center justify-center cursor-pointer tracking-wider"
                            title="Reject & Delete Order Permanently from database"
                          >
                            reject
                          </button>

                          {/* Approve Green Pill Button */}
                          <button
                            onClick={() => handleApproveOrder(o)}
                            className="h-8 px-4 rounded-full bg-[#43A047] hover:bg-green-700 active:scale-95 text-white font-black text-xs transition-all shadow-sm border-2 border-slate-900 flex items-center justify-center cursor-pointer tracking-wider"
                            title="Approve order — Shift to Awaiting Approval for vendors"
                          >
                            approve
                          </button>
                        </div>
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

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pending &amp; Missed Orders</h1>
          <p className="text-muted mt-1 text-sm">Monitor live broadcasting orders and resume missed client orders for vendors</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-xs font-bold hover:bg-surface-3 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} /> Refresh List
        </button>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<Clock size={28} />} title="No pending orders" subtitle="All incoming orders have been accepted or fulfilled." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(o => {
            const elapsed = Date.now() - new Date(o.created_at).getTime();
            const isMissed = elapsed > 60 * 1000; // 1 minute threshold
            const targetId = o.id || o._id;

            return (
              <div key={targetId} className={`card p-5 border flex flex-col justify-between ${isMissed ? 'bg-red-50/50 border-red-200' : 'bg-surface border-border'}`}>
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-extrabold text-lg text-text">#{targetId.toString().substring(0, 6).toUpperCase()}</h3>
                    <Badge variant={isMissed ? 'error' : 'warning'}>
                      {isMissed ? 'Missed by Vendors' : 'Broadcasting (Active)'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-text">
                    <p><span className="text-muted text-xs">Item:</span> <span className="font-bold text-amber-600">{o.item_name}</span> (x{o.quantity})</p>
                    <p><span className="text-muted text-xs">Category:</span> {o.master_category_name || 'General'}</p>
                    <div className="p-3 bg-surface-2/60 rounded-xl mt-3 space-y-1 border border-border/40">
                      <p className="font-bold text-text">{o.client_name} - {o.client_phone}</p>
                      <p className="text-xs text-muted">{o.client_address}</p>
                      <p className="text-xs font-semibold mt-1 text-amber-700">PIN: {o.client_zip} | Landmark: {o.client_landmark}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex justify-between items-center text-xs text-muted">
                  <span>Placed: {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text mr-1">Total: ₹{o.price || o.total_price}</span>
                    <button
                      onClick={() => handleResumeOrder(o)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                      title="Resume & re-broadcast order to nearby vendors"
                    >
                      <RefreshCw size={12} /> Resume
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

