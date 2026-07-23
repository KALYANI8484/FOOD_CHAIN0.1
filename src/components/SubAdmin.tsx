import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Store, Plus, Users, Clock, CheckCircle2,
  Activity as ActivityIcon, AlertCircle, FileText, Eye, Pencil, Search,
  ArrowRight, Package, X, Lock
} from 'lucide-react';
import { supabase, type Vendor, type Activity, type VendorItem } from '../lib/supabase';
import { Button, Badge, useToast, Toast, Spinner, EmptyState, SpotlightCard, Modal, Drawer } from './ui';
import { VendorForm } from './VendorForm';

type Tab = 'dashboard' | 'vendors' | 'pending' | 'guides' | 'activity';

export function SubAdmin({ onExit, adminEmail }: { onExit: () => void; adminEmail: string }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const { toast, show } = useToast();

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vendors', label: 'My Vendors', icon: Store },
    { id: 'pending', label: 'Correction Inbox', icon: AlertCircle },
    { id: 'guides', label: 'SOP Guides', icon: FileText },
    { id: 'activity', label: 'Activity Log', icon: ActivityIcon },
  ];

  return (
    <div className="min-h-screen bg-bg flex text-text">
      <aside className="w-64 border-r border-border bg-surface flex flex-col h-screen sticky top-0 z-20">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">VIKRAM ADVERTISING</p>
            <p className="text-xs text-muted">Sub-Admin Portal</p>
          </div>
        </div>
        
        <div className="p-4 border-b border-border bg-surface-2/40">
          <p className="text-xs text-muted font-bold uppercase tracking-wider">Signed In As</p>
          <p className="text-xs text-text font-semibold truncate mt-0.5">{adminEmail || 'arjun@mealmesh.io'}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
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
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full" onClick={onExit}>Exit</Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen bg-bg relative z-10">
        <div className="p-8 max-w-7xl mx-auto">
          {tab === 'dashboard' && <SubDashboard onTab={setTab} />}
          {tab === 'vendors' && <MyVendors show={show} />}
          {tab === 'pending' && <CorrectionInbox show={show} />}
          {tab === 'guides' && <SubGuides />}
          {tab === 'activity' && <SubActivity />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function SubDashboard({ onTab }: { onTab: (t: Tab) => void }) {
  const [kpis, setKpis] = useState({ active: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: v }, { data: a }] = await Promise.all([
        supabase.from('vendors').select('*'),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      const list = v || [];
      // Sub-Admin specific metrics
      setKpis({
        active: list.filter((x: any) => x.status === 'approved').length,
        pending: list.filter((x: any) => x.status === 'pending_approval').length,
        rejected: list.filter((x: any) => x.status === 'rejected').length
      });
      setActivities(a || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const kpiCards = [
    { label: 'My Onboarded Vendors', value: kpis.active, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Pending Approvals', value: kpis.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Action Required', value: kpis.rejected, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted mt-1">Review onboarding progress and vendor submission approvals</p>
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Quick Actions */}
        <div className="lg:col-span-1 card p-6 bg-surface border border-border animate-fade-in-up delay-200">
          <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => onTab('vendors')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-2 border border-border hover:border-accent/40 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <Plus size={16} className="text-accent" />
                <span className="text-sm font-bold">Onboard New Vendor</span>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </button>
            <button 
              onClick={() => onTab('pending')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-2 border border-border hover:border-accent/40 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-sm font-bold">Correction Inbox</span>
              </div>
              {kpis.rejected > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{kpis.rejected}</span>}
              <ArrowRight size={14} className="text-muted" />
            </button>
          </div>
        </div>

        {/* Right: Activity Log */}
        <div className="lg:col-span-2 card p-6 bg-surface border border-border animate-fade-in-up delay-300">
          <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted">Recent Activity</h3>
          {activities.length === 0 ? (
            <EmptyState icon={<ActivityIcon size={24} />} title="No recent activity" />
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2/40 hover:bg-surface-2 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border">
                    <ActivityIcon size={14} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text truncate">{a.action}</p>
                    <p className="text-[10px] text-muted mt-0.5">{a.actor} · {new Date(a.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MyVendors({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [viewInventory, setViewInventory] = useState<VendorItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [newVendorInventory, setNewVendorInventory] = useState<any[]>([]);
  const [masterCategories, setMasterCategories] = useState<string[]>([]);
  const [vendorFormState, setVendorFormState] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
    setVendors(data || []);
    setLoading(false);
  };

  useEffect(() => { 
    load(); 
    
    fetch('/api/master-categories')
      .then(res => res.json())
      .then(res => { if (res.data) setMasterCategories(res.data); })
      .catch(err => console.error(err));
      
    supabase.from('subscription_plans').select('*').eq('status', 'active').then(({ data }) => setPlans(data || []));
  }, []);

  const handleCreateSubmit = async (formData: any) => {
    const payload = {
      owner_name: formData.owner_name,
      phone: formData.phone,
      email: formData.email || null,
      shop_name: formData.shop_name,
      address: formData.address,
      zip_code: formData.zip_code,
      plan_id: formData.plan_id || null,
      plan_name: formData.plan_name || null,
      logo_url: formData.logo_url || 'https://placehold.co/200x200/F0F0F0/5A5A5A?text=Logo',
      qr_url: formData.qr_url || 'https://placehold.co/200x200/F0F0F0/5A5A5A?text=QR',
      status: 'pending_approval',
      submitted_by: 'Sub-Admin',
      created_at: new Date().toISOString()
    };

    const { data: newVendor, error } = await supabase.from('vendors').insert(payload).select().single();

    if (error) {
      show('Failed to submit vendor: ' + (error.message || 'Unknown error'), 'error');
      return;
    }

    if (newVendorInventory.length > 0) {
      const inventoryPayload = newVendorInventory.map(item => ({
        ...item,
        vendor_id: newVendor.id
      }));
      await supabase.from('vendor_inventory').insert(inventoryPayload);
    }

    await supabase.from('activity_log').insert({
      action: `Onboarded vendor submitted: ${formData.shop_name}`,
      actor: 'Sub-Admin'
    });

    show('Vendor submitted for Super Admin review', 'success');
    setCreateMode(false);
    setNewVendorInventory([]);
    setVendorFormState(null);
    await load();
  };

  const handleEditSubmit = async (formData: any) => {
    if (!editVendor) return;
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
    }).eq('id', editVendor.id);

    if (error) {
      show('Failed to update vendor', 'error');
      return;
    }

    await supabase.from('activity_log').insert({
      action: `Vendor details modified: ${formData.shop_name}`,
      actor: 'Sub-Admin'
    });

    show('Vendor updated successfully');
    setEditVendor(null);
    load();
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
          <h1 className="text-3xl font-extrabold tracking-tight">Onboarded Vendors</h1>
          <p className="text-muted mt-1">Submit new vendor profiles and view status</p>
        </div>
        <Button onClick={() => setCreateMode(true)}>
          <Plus size={16} /> Create Vendor
        </Button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon={<Store size={28} />} title="No vendors found" subtitle="Onboard your first restaurant to get started" />}
      </div>

      {/* Creation Modal */}
      <Modal open={createMode} onClose={() => { setCreateMode(false); setNewVendorInventory([]); setVendorFormState(null); }} title="Onboard New Vendor" size="xl">
        <VendorForm 
          submitLabel="Submit for Approval" 
          onSubmit={handleCreateSubmit} 
          onCancel={() => { setCreateMode(false); setNewVendorInventory([]); setVendorFormState(null); }}
          onChange={setVendorFormState}
        />
        
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="text-lg font-bold mb-4">Vendor Inventory</h3>
          <VendorInventoryBuilder
            items={newVendorInventory}
            setItems={setNewVendorInventory}
            maxItems={plans.find(p => p.id === vendorFormState?.plan_id)?.max_items || 50}
            categories={masterCategories.length > 0 ? masterCategories : ['Breakfast', 'Lunch', 'Dinner', 'Beverages']}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editVendor} onClose={() => setEditVendor(null)} title="Modify Vendor Details" size="xl">
        {editVendor && (
          <VendorForm 
            initialData={editVendor} 
            submitLabel="Save Changes" 
            onSubmit={handleEditSubmit} 
            onCancel={() => setEditVendor(null)} 
          />
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

function SubActivity() {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(20);
      setLogs(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">System Audit logs</h1>
        <p className="text-muted mt-1">Review recently registered administrative actions</p>
      </div>

      <div className="card overflow-hidden bg-surface border border-border animate-fade-in-up delay-100">
        <div className="p-6 divide-y divide-border/60">
          {logs.map((l) => (
            <div key={l.id} className="py-4 flex items-start gap-4 hover:bg-surface-2/20 transition-all px-2 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 border border-border">
                <ActivityIcon size={14} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text leading-snug">{l.action}</p>
                <p className="text-xs text-muted mt-0.5">{l.actor || 'System'} · {new Date(l.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {logs.length === 0 && <EmptyState icon={<ActivityIcon size={24} />} title="Audit log empty" />}
        </div>
      </div>
    </div>
  );
}

function VendorInventoryBuilder({ items, setItems, maxItems, categories }: {
  items: Array<{ category: string; item_name: string; quantity: number; price: number; price_locked: boolean; locked_price: number | null; }>;
  setItems: (items: any[]) => void;
  maxItems: number;
  categories: string[];
}) {
  const [category, setCategory] = useState(categories[0] || '');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [priceLocked, setPriceLocked] = useState(false);

  const handleAdd = () => {
    if (!category || !itemName || quantity <= 0 || price < 0) return;
    if (items.length >= maxItems) return;
    setItems([...items, { category, item_name: itemName, quantity, price, price_locked: priceLocked, locked_price: priceLocked ? price : null }]);
    setItemName('');
    setQuantity(1);
    setPrice(0);
    setPriceLocked(false);
  };

  const remove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const remaining = maxItems - items.length;
  const limitReached = items.length >= maxItems;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-muted">
          Items Added: {items.length} / {maxItems} ({remaining} remaining)
        </p>
      </div>
      {limitReached && (
        <p className="text-sm text-red-500 font-semibold">
          You have reached your plan limit. Upgrade your subscription to add more items.
        </p>
      )}
      
      <div className="grid grid-cols-6 gap-3 items-end bg-surface-2 p-4 rounded-xl border border-border">
        <div className="col-span-1">
          <label className="text-xs font-semibold text-muted block mb-1">Category</label>
          <select 
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm outline-none focus:border-accent"
          >
            <option value="">Select...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted block mb-1">Item Name</label>
          <input 
            value={itemName} onChange={(e) => setItemName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm outline-none focus:border-accent"
            placeholder="e.g. Burger"
          />
        </div>
        <div className="col-span-1">
          <label className="text-xs font-semibold text-muted block mb-1">Qty</label>
          <input 
            type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="col-span-1">
          <label className="text-xs font-semibold text-muted block mb-1">Price (₹)</label>
          <input 
            type="number" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="col-span-1 flex items-center justify-between pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={priceLocked} onChange={(e) => setPriceLocked(e.target.checked)} className="rounded bg-surface border-border accent-accent" />
            <span className="text-xs font-semibold text-muted flex items-center gap-1"><Lock size={12} /> Lock</span>
          </label>
          <Button size="sm" onClick={handleAdd} disabled={limitReached || !category || !itemName} className="px-3">Add</Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
            <div className="flex items-center gap-3">
              <Badge variant="accent">{item.category}</Badge>
              <p className="text-sm font-bold">{item.item_name} <span className="text-xs text-muted font-normal">x{item.quantity}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold">₹{item.price}</div>
              {item.price_locked && <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full font-bold flex items-center gap-1"><Lock size={10} /> Locked</span>}
              <button onClick={() => remove(i)} className="text-red-500 hover:text-red-600 p-1 bg-red-500/10 rounded-lg"><X size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
