import { useEffect, useState, useRef, useMemo } from 'react';
import {
  LayoutDashboard, Store, Plus, Users, Clock, CheckCircle2,
  Activity as ActivityIcon, AlertCircle, FileText, Eye, Pencil, Search,
  ArrowRight, Package, Trash2, Menu, X, RefreshCw, MessageCircle, MessageSquare,
  Download
} from 'lucide-react';
import { supabase, type Vendor, type Activity, type VendorItem, type Plan } from '../lib/supabase';
import { getVendorPlanLabel } from '../lib/vendorPlan';
import { Button, Badge, useToast, Toast, Spinner, EmptyState, SpotlightCard, Modal, Drawer, LanguageSelector, useSyncedLanguage, type Language } from './ui';
import { VendorForm } from './VendorForm';
import { exportCSV } from './SuperAdmin';

type Tab = 'dashboard' | 'vendors' | 'pending' | 'guides' | 'live_tracker' | 'pending_orders';

export function SubAdmin({ onExit, adminEmail }: { onExit: () => void; adminEmail: string }) {
  const [lang] = useSyncedLanguage();

  const navLabels = {
    en: { dashboard: 'Dashboard', vendors: 'Vendors', pending: 'Correction Inbox', guides: 'SOP Guides', live_tracker: 'Live Order Tracker', pending_orders: 'Pending & Missed Orders', exit: 'Exit', signedInAs: 'Signed In As' },
    hi: { dashboard: 'डैशबोर्ड', vendors: 'विक्रेता (वेंडर्स)', pending: 'सुधार इनबॉक्स', guides: 'एसओपी गाइड', live_tracker: 'लाइव ऑर्डर ट्रैकर', pending_orders: 'लंबित और छूटे हुए ऑर्डर', exit: 'बाहर निकलें', signedInAs: 'साइन इन हैं' },
    mr: { dashboard: 'डॅशबोर्ड', vendors: 'विक्रेते (व्हेंडर्स)', pending: 'सुधारणा इनबॉक्स', guides: 'एसओपी मार्गदर्शक', live_tracker: 'लाइव्ह ऑर्डर ट्रॅकर', pending_orders: 'प्रलंबित आणि चुकलेले ऑर्डर', exit: 'बाहेर पडा', signedInAs: 'खाते' },
  }[lang];

  const [tab, setTabState] = useState<Tab>('dashboard');

  const setTab = (newTab: Tab, isPop = false) => {
    setTabState(newTab);
    if (!isPop) {
      window.history.pushState({ subTab: newTab, appScreen: 'sub_admin' }, '', `#sub_admin/${newTab}`);
    }
  };

  useEffect(() => {
    window.history.replaceState({ subTab: 'dashboard', appScreen: 'sub_admin', cred: adminEmail }, '', '#sub_admin/dashboard');

    const handleSubAdminPopState = (e: PopStateEvent) => {
      if (e.state && e.state.subTab) {
        setTabState(e.state.subTab);
      }
    };

    window.addEventListener('popstate', handleSubAdminPopState);
    return () => window.removeEventListener('popstate', handleSubAdminPopState);
  }, []);

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
  const [lang] = useSyncedLanguage();

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

const mvTrans = {
  en: {
    title: 'Vendors Management',
    subtitle: 'Manage vendor profiles, update kitchen accounts, and submit approval requests to Super Admin.',
    sentRequestsAudit: (n: number) => `Sent Requests Audit (${n})`,
    searchPlaceholder: 'Search by shop or owner name...',
    allCategoryPlans: 'All Category Plans',
    allSubmissions: 'All Submissions',
    live: 'Live (Approved)',
    inReview: 'In Review',
    needsCorrection: 'Rejected (Needs Correction)',
    swipeHint: 'Swipe left/right ↔',
    colShopDetails: 'Shop details',
    colOwnerContact: 'Owner contact',
    colZipZone: 'Zip Zone',
    colPlan: 'Plan',
    colStatus: 'Status',
    colActions: 'Actions',
    requestPending: (type: string) => `⏳ Request Pending (${type})`,
    whatsapp: 'WhatsApp',
    contactWhatsapp: 'Contact vendor on WhatsApp',
    free: 'Free',
    statusLive: 'Live',
    statusNeedsCorrection: 'Needs Correction',
    statusInReview: 'In Review',
    viewProfile: 'View Profile Info & Inventory',
    editDetails: 'Edit Details / Submit Request to Super Admin',
    submitDeletion: 'Submit Deletion Request',
    noVendorsFound: 'No vendors found',
    noVendorsSubtitle: 'Onboard your first restaurant to get started',
    submittedRequestsTitle: 'Submitted Requests to Super Admin',
    submittedRequestsDesc: 'History of vendor edit, add-on, and deletion requests submitted for Super-Admin approval.',
    noRequestsYet: 'No requests submitted yet',
    vendorAccount: 'Vendor Account',
    submitted: 'Submitted:',
    pendingApproval: 'Pending Approval',
    modifyVendorDetails: 'Modify Vendor Details',
    saveChanges: 'Save Changes',
    activeCategoryPortfolio: 'Active Category Subscriptions Portfolio',
    activePlansCount: (n: number) => `${n} Active Plans`,
    generalCategory: 'General',
    basicPlan: 'Basic Plan',
    plan: 'Plan',
    expired: '🔴 EXPIRED',
    activeDaysLeft: (n: number) => `🟢 ACTIVE (${n}d left)`,
    validFrom: 'Valid:',
    to: 'to',
    itemCapacity: (n: number) => `Item Capacity: ${n} items`,
    assignAdditionalCategory: 'Assign Additional Category Subscription',
    assignCategoryDesc: "Submit a request to add another active category plan (e.g. Dairy, Bakery, Produce) to this vendor's portfolio.",
    selectCategoryPlaceholder: '-- Select a Category Plan to Assign --',
    requestCategoryAssignment: 'Request Category Assignment',
    applyAddonPackage: 'Apply Add-on Package',
    applyAddonDesc: "Submit a request to assign an Add-on to extend this vendor's validity and client limits.",
    selectAddonPlaceholder: '-- Select an Add-on to Apply --',
    requestAddon: 'Request Add-on',
    deleteVendorAccount: 'Delete Vendor Account',
    requestVendorDeletion: 'Request Vendor Deletion',
    deleteWarning: (name: string) => `This will send a delete request to the Super Admin for vendor ${name}.`,
    cancel: 'Cancel',
    submitDeleteRequest: 'Submit Delete Request',
    vendorProfileInfo: 'Vendor Profile Info',
    ownerDetails: 'Owner Details',
    ownerName: 'Owner Name',
    phoneNumber: 'Phone Number',
    emailAddress: 'Email Address',
    foodInventory: (n: number) => `Food Inventory (${n} Items)`,
    noInventoryUploaded: 'No inventory items uploaded',
    toastEditFailed: 'Failed to submit edit request',
    toastEditSubmitted: 'Edit request submitted to Super Admin for approval',
    toastAddonFailed: 'Failed to submit add-on request',
    toastAddonSubmitted: 'Add-on request submitted to Super Admin for approval',
    toastCategoryFailed: 'Failed to submit category assignment request',
    toastCategorySubmitted: 'Category subscription request submitted to Super Admin for approval',
    toastDeleteFailed: 'Failed to submit delete request',
    toastDeleteSubmitted: 'Delete request submitted to Super Admin for approval',
  },
  hi: {
    title: 'विक्रेता प्रबंधन',
    subtitle: 'विक्रेता प्रोफाइल प्रबंधित करें, किचन खाते अपडेट करें, और सुपर एडमिन को अनुमोदन अनुरोध सबमिट करें।',
    sentRequestsAudit: (n: number) => `भेजे गए अनुरोध (${n})`,
    searchPlaceholder: 'दुकान या मालिक के नाम से खोजें...',
    allCategoryPlans: 'सभी श्रेणी प्लान',
    allSubmissions: 'सभी आवेदन',
    live: 'लाइव (स्वीकृत)',
    inReview: 'समीक्षाधीन',
    needsCorrection: 'अस्वीकृत (सुधार आवश्यक)',
    swipeHint: 'बाएँ/दाएँ स्वाइप करें ↔',
    colShopDetails: 'दुकान विवरण',
    colOwnerContact: 'मालिक संपर्क',
    colZipZone: 'पिन कोड',
    colPlan: 'प्लान',
    colStatus: 'स्थिति',
    colActions: 'कार्रवाई',
    requestPending: (type: string) => `⏳ अनुरोध लंबित (${type})`,
    whatsapp: 'व्हाट्सएप',
    contactWhatsapp: 'व्हाट्सएप पर विक्रेता से संपर्क करें',
    free: 'फ्री',
    statusLive: 'लाइव',
    statusNeedsCorrection: 'सुधार आवश्यक',
    statusInReview: 'समीक्षाधीन',
    viewProfile: 'प्रोफाइल जानकारी और इन्वेंटरी देखें',
    editDetails: 'विवरण संपादित करें / सुपर एडमिन को अनुरोध सबमिट करें',
    submitDeletion: 'हटाने का अनुरोध सबमिट करें',
    noVendorsFound: 'कोई विक्रेता नहीं मिला',
    noVendorsSubtitle: 'शुरू करने के लिए अपना पहला रेस्तरां जोड़ें',
    submittedRequestsTitle: 'सुपर एडमिन को भेजे गए अनुरोध',
    submittedRequestsDesc: 'सुपर-एडमिन अनुमोदन के लिए सबमिट किए गए विक्रेता संपादन, ऐड-ऑन और हटाने के अनुरोधों का इतिहास।',
    noRequestsYet: 'अभी तक कोई अनुरोध सबमिट नहीं हुआ',
    vendorAccount: 'विक्रेता खाता',
    submitted: 'सबमिट किया गया:',
    pendingApproval: 'अनुमोदन लंबित',
    modifyVendorDetails: 'विक्रेता विवरण संशोधित करें',
    saveChanges: 'परिवर्तन सहेजें',
    activeCategoryPortfolio: 'सक्रिय श्रेणी सदस्यता पोर्टफोलियो',
    activePlansCount: (n: number) => `${n} सक्रिय प्लान`,
    generalCategory: 'सामान्य',
    basicPlan: 'बेसिक प्लान',
    plan: 'प्लान',
    expired: '🔴 समाप्त',
    activeDaysLeft: (n: number) => `🟢 सक्रिय (${n} दिन शेष)`,
    validFrom: 'मान्य:',
    to: 'से',
    itemCapacity: (n: number) => `आइटम क्षमता: ${n} आइटम`,
    assignAdditionalCategory: 'अतिरिक्त श्रेणी सदस्यता असाइन करें',
    assignCategoryDesc: 'इस विक्रेता के पोर्टफोलियो में एक और सक्रिय श्रेणी प्लान (जैसे डेयरी, बेकरी, उत्पाद) जोड़ने का अनुरोध सबमिट करें।',
    selectCategoryPlaceholder: '-- असाइन करने के लिए श्रेणी प्लान चुनें --',
    requestCategoryAssignment: 'श्रेणी असाइनमेंट का अनुरोध करें',
    applyAddonPackage: 'ऐड-ऑन पैकेज लागू करें',
    applyAddonDesc: 'इस विक्रेता की वैधता और ग्राहक सीमा बढ़ाने के लिए ऐड-ऑन असाइन करने का अनुरोध सबमिट करें।',
    selectAddonPlaceholder: '-- लागू करने के लिए ऐड-ऑन चुनें --',
    requestAddon: 'ऐड-ऑन का अनुरोध करें',
    deleteVendorAccount: 'विक्रेता खाता हटाएं',
    requestVendorDeletion: 'विक्रेता हटाने का अनुरोध',
    deleteWarning: (name: string) => `यह विक्रेता ${name} के लिए सुपर एडमिन को हटाने का अनुरोध भेजेगा।`,
    cancel: 'रद्द करें',
    submitDeleteRequest: 'हटाने का अनुरोध सबमिट करें',
    vendorProfileInfo: 'विक्रेता प्रोफाइल जानकारी',
    ownerDetails: 'मालिक विवरण',
    ownerName: 'मालिक का नाम',
    phoneNumber: 'फोन नंबर',
    emailAddress: 'ईमेल पता',
    foodInventory: (n: number) => `खाद्य इन्वेंटरी (${n} आइटम)`,
    noInventoryUploaded: 'कोई इन्वेंटरी आइटम अपलोड नहीं किया गया',
    toastEditFailed: 'संपादन अनुरोध सबमिट करने में विफल',
    toastEditSubmitted: 'संपादन अनुरोध सुपर एडमिन को अनुमोदन के लिए सबमिट किया गया',
    toastAddonFailed: 'ऐड-ऑन अनुरोध सबमिट करने में विफल',
    toastAddonSubmitted: 'ऐड-ऑन अनुरोध सुपर एडमिन को अनुमोदन के लिए सबमिट किया गया',
    toastCategoryFailed: 'श्रेणी असाइनमेंट अनुरोध सबमिट करने में विफल',
    toastCategorySubmitted: 'श्रेणी सदस्यता अनुरोध सुपर एडमिन को अनुमोदन के लिए सबमिट किया गया',
    toastDeleteFailed: 'हटाने का अनुरोध सबमिट करने में विफल',
    toastDeleteSubmitted: 'हटाने का अनुरोध सुपर एडमिन को अनुमोदन के लिए सबमिट किया गया',
  },
  mr: {
    title: 'विक्रेता व्यवस्थापन',
    subtitle: 'विक्रेता प्रोफाइल व्यवस्थापित करा, किचन खाती अद्ययावत करा आणि सुपर ॲडमिनला मंजुरीसाठी विनंत्या सबमिट करा.',
    sentRequestsAudit: (n: number) => `पाठवलेल्या विनंत्या (${n})`,
    searchPlaceholder: 'दुकान किंवा मालकाच्या नावाने शोधा...',
    allCategoryPlans: 'सर्व श्रेणी प्लॅन्स',
    allSubmissions: 'सर्व अर्ज',
    live: 'लाइव्ह (मंजूर)',
    inReview: 'पुनरावलोकनाधीन',
    needsCorrection: 'नाकारले (दुरुस्ती आवश्यक)',
    swipeHint: 'डावीकडे/उजवीकडे स्वाइप करा ↔',
    colShopDetails: 'दुकान तपशील',
    colOwnerContact: 'मालक संपर्क',
    colZipZone: 'पिन कोड',
    colPlan: 'प्लॅन',
    colStatus: 'स्थिती',
    colActions: 'कृती',
    requestPending: (type: string) => `⏳ विनंती प्रलंबित (${type})`,
    whatsapp: 'व्हॉट्सॲप',
    contactWhatsapp: 'व्हॉट्सॲपवर विक्रेत्याशी संपर्क साधा',
    free: 'मोफत',
    statusLive: 'लाइव्ह',
    statusNeedsCorrection: 'दुरुस्ती आवश्यक',
    statusInReview: 'पुनरावलोकनाधीन',
    viewProfile: 'प्रोफाइल माहिती आणि इन्व्हेंटरी पहा',
    editDetails: 'तपशील संपादित करा / सुपर ॲडमिनला विनंती सबमिट करा',
    submitDeletion: 'हटवण्याची विनंती सबमिट करा',
    noVendorsFound: 'कोणतेही विक्रेते सापडले नाहीत',
    noVendorsSubtitle: 'सुरुवात करण्यासाठी तुमचे पहिले रेस्टॉरंट जोडा',
    submittedRequestsTitle: 'सुपर ॲडमिनला पाठवलेल्या विनंत्या',
    submittedRequestsDesc: 'सुपर-ॲडमिन मंजुरीसाठी सबमिट केलेल्या विक्रेता संपादन, ॲड-ऑन आणि हटवण्याच्या विनंत्यांचा इतिहास.',
    noRequestsYet: 'अद्याप कोणतीही विनंती सबमिट झालेली नाही',
    vendorAccount: 'विक्रेता खाते',
    submitted: 'सबमिट केले:',
    pendingApproval: 'मंजुरी प्रलंबित',
    modifyVendorDetails: 'विक्रेता तपशील सुधारित करा',
    saveChanges: 'बदल जतन करा',
    activeCategoryPortfolio: 'सक्रिय श्रेणी सदस्यता पोर्टफोलिओ',
    activePlansCount: (n: number) => `${n} सक्रिय प्लॅन्स`,
    generalCategory: 'सामान्य',
    basicPlan: 'बेसिक प्लॅन',
    plan: 'प्लॅन',
    expired: '🔴 संपले',
    activeDaysLeft: (n: number) => `🟢 सक्रिय (${n} दिवस शिल्लक)`,
    validFrom: 'वैध:',
    to: 'ते',
    itemCapacity: (n: number) => `आयटम क्षमता: ${n} आयटम`,
    assignAdditionalCategory: 'अतिरिक्त श्रेणी सदस्यता नियुक्त करा',
    assignCategoryDesc: 'या विक्रेत्याच्या पोर्टफोलिओमध्ये आणखी एक सक्रिय श्रेणी प्लॅन (उदा. डेअरी, बेकरी, उत्पादन) जोडण्याची विनंती सबमिट करा.',
    selectCategoryPlaceholder: '-- नियुक्त करण्यासाठी श्रेणी प्लॅन निवडा --',
    requestCategoryAssignment: 'श्रेणी नियुक्तीची विनंती करा',
    applyAddonPackage: 'ॲड-ऑन पॅकेज लागू करा',
    applyAddonDesc: 'या विक्रेत्याची वैधता आणि ग्राहक मर्यादा वाढवण्यासाठी ॲड-ऑन नियुक्त करण्याची विनंती सबमिट करा.',
    selectAddonPlaceholder: '-- लागू करण्यासाठी ॲड-ऑन निवडा --',
    requestAddon: 'ॲड-ऑनची विनंती करा',
    deleteVendorAccount: 'विक्रेता खाते हटवा',
    requestVendorDeletion: 'विक्रेता हटवण्याची विनंती',
    deleteWarning: (name: string) => `हे विक्रेता ${name} साठी सुपर ॲडमिनला हटवण्याची विनंती पाठवेल.`,
    cancel: 'रद्द करा',
    submitDeleteRequest: 'हटवण्याची विनंती सबमिट करा',
    vendorProfileInfo: 'विक्रेता प्रोफाइल माहिती',
    ownerDetails: 'मालक तपशील',
    ownerName: 'मालकाचे नाव',
    phoneNumber: 'फोन नंबर',
    emailAddress: 'ईमेल पत्ता',
    foodInventory: (n: number) => `अन्न इन्व्हेंटरी (${n} आयटम)`,
    noInventoryUploaded: 'कोणतेही इन्व्हेंटरी आयटम अपलोड केलेले नाहीत',
    toastEditFailed: 'संपादन विनंती सबमिट करण्यात अयशस्वी',
    toastEditSubmitted: 'संपादन विनंती सुपर ॲडमिनला मंजुरीसाठी सबमिट केली',
    toastAddonFailed: 'ॲड-ऑन विनंती सबमिट करण्यात अयशस्वी',
    toastAddonSubmitted: 'ॲड-ऑन विनंती सुपर ॲडमिनला मंजुरीसाठी सबमिट केली',
    toastCategoryFailed: 'श्रेणी नियुक्ती विनंती सबमिट करण्यात अयशस्वी',
    toastCategorySubmitted: 'श्रेणी सदस्यता विनंती सुपर ॲडमिनला मंजुरीसाठी सबमिट केली',
    toastDeleteFailed: 'हटवण्याची विनंती सबमिट करण्यात अयशस्वी',
    toastDeleteSubmitted: 'हटवण्याची विनंती सुपर ॲडमिनला मंजुरीसाठी सबमिट केली',
  },
};

function MyVendors({ show, adminEmail }: { show: (m: string, t?: 'success' | 'error' | 'info') => void; adminEmail: string }) {
  const [lang] = useSyncedLanguage();
  const t = mvTrans[lang];
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [viewInventory, setViewInventory] = useState<VendorItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAddon, setSelectedAddon] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState<Vendor | null>(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const load = async () => {
    const [{ data: v }, { data: a }, { data: p }, { data: r }] = await Promise.all([
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('addons').select('*'),
      supabase.from('subscription_plans').select('*'),
      supabase.from('subadmin_requests').select('*').eq('subadmin_email', adminEmail).order('created_at', { ascending: false })
    ]);
    const normalizedVendors = (v || []).map((item: any) => ({
      ...item,
      id: item.id || item._id
    }));
    setVendors(normalizedVendors);
    setAddons(a || []);
    setPlans(p || []);
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
      show(t.toastEditFailed, 'error');
      return;
    }

    show(t.toastEditSubmitted, 'success');
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
      show(t.toastAddonFailed, 'error');
      return;
    }

    show(t.toastAddonSubmitted, 'success');
    setEditVendor(null);
    setSelectedAddon('');
    load();
  };

  const handleAssignCategoryPlan = async () => {
    if (!editVendor || !assignPlanId) return;
    const vendorId = editVendor.id || (editVendor as any)._id;
    const plan = plans.find(p => p.id === assignPlanId);
    if (!plan) return;

    const payload = JSON.stringify({
      plan_id: plan.id,
      plan_name: plan.name,
      category_name: plan.master_category_name || 'General',
      max_items: plan.max_items,
      max_clients: plan.max_clients,
      validity_days: plan.validity_days
    });
    const { error } = await supabase.from('subadmin_requests').insert({
      subadmin_email: adminEmail,
      vendor_id: vendorId,
      vendor_name: editVendor.shop_name,
      action_type: 'assign_category',
      payload: payload
    });

    if (error) {
      show(t.toastCategoryFailed, 'error');
      return;
    }

    show(t.toastCategorySubmitted, 'success');
    setEditVendor(null);
    setAssignPlanId('');
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
      show(t.toastDeleteFailed, 'error');
      return;
    }

    show(t.toastDeleteSubmitted, 'success');
    setDeleteConfirmVendor(null);
    load();
  };

  const handleViewProfile = async (v: Vendor) => {
    setViewVendor(v);
    const { data } = await supabase.from('vendor_inventory').select('*').eq('vendor_id', v.id);
    setViewInventory(data || []);
  };

  const [categoryFilter, setCategoryFilter] = useState('all');

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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">{t.title}</h1>
          <p className="text-[#6B7280] text-sm mt-1">{t.subtitle}</p>
        </div>

        <button
          onClick={() => setShowRequestsModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#360910] text-[#C5A059] text-xs font-extrabold transition-all flex items-center gap-2 shadow-xs border border-[#C5A059]/40 cursor-pointer self-start sm:self-auto"
        >
          <FileText size={15} /> {t.sentRequestsAudit(requests.length)}
        </button>
      </div>

      {/* Top Bar Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs animate-fade-in-up delay-100">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F3F4F6] border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F1A80A]/40"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#F3F4F6] border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F1A80A]/40 cursor-pointer"
        >
          <option value="all">{t.allCategoryPlans}</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#F3F4F6] border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F1A80A]/40 cursor-pointer"
        >
          <option value="all">{t.allSubmissions}</option>
          <option value="approved">{t.live}</option>
          <option value="pending_approval">{t.inReview}</option>
          <option value="rejected">{t.needsCorrection}</option>
        </select>
      </div>

      {/* Main Vendor Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden animate-fade-in-up delay-200">
        <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] font-extrabold text-amber-900">
          <span>📱 Finger-Scrollable Table</span>
          <span className="animate-pulse">{t.swipeHint}</span>
        </div>
        <div className="touch-scroll-x">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="px-6 py-4">{t.colShopDetails}</th>
                <th className="px-6 py-4">{t.colOwnerContact}</th>
                <th className="px-6 py-4">{t.colZipZone}</th>
                <th className="px-6 py-4">{t.colPlan}</th>
                <th className="px-6 py-4">{t.colStatus}</th>
                <th className="px-6 py-4 text-right">{t.colActions}</th>
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
                              {t.requestPending(pendingReq.action_type)}
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
                            title={t.contactWhatsapp}
                          >
                            <MessageCircle size={12} className="text-green-700" /> {t.whatsapp}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#111827]">{v.zip_code}</td>
                    <td className="px-6 py-4">
                      <Badge variant="accent">{getVendorPlanLabel(v)}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'error' : 'warning'}>
                        {v.status === 'approved' ? t.statusLive : v.status === 'rejected' ? t.statusNeedsCorrection : t.statusInReview}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewProfile(v)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:text-black hover:bg-gray-200 transition-all border border-gray-200 cursor-pointer active:scale-95"
                          title={t.viewProfile}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditVendor(v)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all border border-amber-200 cursor-pointer active:scale-95"
                          title={t.editDetails}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmVendor(v)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-all border border-red-200 cursor-pointer active:scale-95"
                          title={t.submitDeletion}
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
        {filtered.length === 0 && <EmptyState icon={<Store size={28} />} title={t.noVendorsFound} subtitle={t.noVendorsSubtitle} />}
      </div>

      {/* ── Sent Requests Audit Modal ── */}
      {showRequestsModal && (
        <Modal
          open={showRequestsModal}
          onClose={() => setShowRequestsModal(false)}
          title={t.submittedRequestsTitle}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <p className="text-gray-500">{t.submittedRequestsDesc}</p>

            {requests.length === 0 ? (
              <EmptyState icon={<FileText size={24} />} title={t.noRequestsYet} />
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 divide-y divide-gray-100">
                {requests.map((r) => (
                  <div key={r.id || r._id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111827]">{r.vendor_name || t.vendorAccount}</span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border border-gray-200">
                          {r.action_type || 'edit'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{t.submitted} {new Date(r.created_at).toLocaleString()}</p>
                    </div>

                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>
                      {r.status || t.pendingApproval}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      <Modal open={!!editVendor} onClose={() => setEditVendor(null)} title={t.modifyVendorDetails} size="xl">
        {editVendor && (
          <div className="space-y-6">
            <VendorForm
              initialData={editVendor}
              submitLabel={t.saveChanges}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditVendor(null)}
            />

            {/* Active Category Subscriptions Portfolio (read-only) */}
            <div className="p-5 border border-amber-300 bg-[#fffdf9] rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-2">
                  <Package size={16} className="text-amber-700" /> {t.activeCategoryPortfolio}
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {t.activePlansCount(Array.isArray(editVendor.active_subscriptions) ? editVendor.active_subscriptions.length : 1)}
                </span>
              </div>

              <div className="space-y-3">
                {(Array.isArray(editVendor.active_subscriptions) && editVendor.active_subscriptions.length > 0 ? editVendor.active_subscriptions : [{
                  id: 'primary',
                  plan_name: editVendor.plan_name || t.basicPlan,
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

                  return (
                    <div key={subKey} className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">{sub.category_name || t.generalCategory}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-amber-100 text-amber-800 border border-amber-200">{sub.plan_name || t.plan}</span>
                        {isExpired ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-100 text-red-700 border border-red-200">{t.expired}</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-green-100 text-green-700 border border-green-200">{t.activeDaysLeft(daysRemaining)}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {t.validFrom} <strong className="text-slate-800">{sub.subscription_start || 'N/A'}</strong> {t.to} <strong className="text-slate-800">{sub.subscription_end || 'N/A'}</strong> | {t.itemCapacity(sub.max_items ?? 5)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assign Additional Category Subscription (request) */}
            <div className="p-5 border border-amber-300 bg-white rounded-2xl space-y-3 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">{t.assignAdditionalCategory}</h3>
              <p className="text-xs text-slate-500">{t.assignCategoryDesc}</p>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <select
                    value={assignPlanId}
                    onChange={(e) => setAssignPlanId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-slate-800 text-sm focus:border-amber-400 outline-none"
                  >
                    <option value="">{t.selectCategoryPlaceholder}</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.master_category_name || t.generalCategory}) — ₹{p.price}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleAssignCategoryPlan} disabled={!assignPlanId}>{t.requestCategoryAssignment}</Button>
              </div>
            </div>

            <div className="p-5 border border-accent/20 bg-[#f9f1e5] rounded-xl space-y-3 mt-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t.applyAddonPackage}</h3>
              <p className="text-xs text-slate-500">{t.applyAddonDesc}</p>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <select
                    value={selectedAddon}
                    onChange={(e) => setSelectedAddon(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-slate-800 text-sm focus:border-amber-400 outline-none"
                  >
                    <option value="">{t.selectAddonPlaceholder}</option>
                    {addons.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (+{a.validity_days} days, +{a.max_clients} clients)</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleApplyAddon} disabled={!selectedAddon}>{t.requestAddon}</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Vendor Confirm Modal */}
      <Modal open={!!deleteConfirmVendor} onClose={() => setDeleteConfirmVendor(null)} title={t.deleteVendorAccount}>
        {deleteConfirmVendor && (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">{t.requestVendorDeletion}</p>
                <p className="text-xs text-red-600/80 mt-1">{t.deleteWarning(deleteConfirmVendor.shop_name)}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setDeleteConfirmVendor(null)}>{t.cancel}</Button>
              <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleDeleteConfirm}>{t.submitDeleteRequest}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Slide-out Read-Only Profile View Panel */}
      <Drawer open={!!viewVendor} onClose={() => setViewVendor(null)} title={t.vendorProfileInfo}>
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
                <Badge variant="accent">{getVendorPlanLabel(viewVendor)}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">{t.ownerDetails}</p>
              <div className="grid grid-cols-2 gap-4 text-sm bg-surface-2 p-4 rounded-2xl border border-border">
                <div>
                  <p className="text-xs text-muted">{t.ownerName}</p>
                  <p className="font-semibold text-text mt-0.5">{viewVendor.owner_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{t.phoneNumber}</p>
                  <p className="font-semibold text-text mt-0.5">{viewVendor.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted">{t.emailAddress}</p>
                  <p className="font-semibold text-text mt-0.5">{viewVendor.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">{t.foodInventory(viewInventory.length)}</p>
              {viewInventory.length === 0 ? (
                <EmptyState icon={<Package size={20} />} title={t.noInventoryUploaded} />
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

const ciTrans = {
  en: {
    title: 'Correction Inbox',
    subtitle: (n: number) => `${n} vendor submission(s) rejected by Super Admin`,
    allClear: 'All clear!',
    noRejections: 'No rejections requiring action.',
    rejected: 'Rejected',
    feedbackNote: 'Feedback Note:',
    defaultFeedback: 'Please review information and resubmit.',
    owner: 'Owner:',
    phone: 'Phone:',
    zip: 'Zip:',
    correctResubmit: 'Correct & Resubmit',
    modalTitle: 'Correct & Resubmit Vendor',
    superAdminFeedback: 'Super Admin Feedback:',
    defaultModalFeedback: 'Please update info and resubmit.',
    resubmitForApproval: 'Resubmit for Approval',
  },
  hi: {
    title: 'सुधार इनबॉक्स',
    subtitle: (n: number) => `${n} विक्रेता आवेदन सुपर एडमिन द्वारा अस्वीकृत`,
    allClear: 'सब ठीक है!',
    noRejections: 'कोई कार्रवाई की आवश्यकता नहीं है।',
    rejected: 'अस्वीकृत',
    feedbackNote: 'फीडबैक नोट:',
    defaultFeedback: 'कृपया जानकारी की समीक्षा करें और पुनः सबमिट करें।',
    owner: 'मालिक:',
    phone: 'फोन:',
    zip: 'पिन कोड:',
    correctResubmit: 'सुधारें और पुनः सबमिट करें',
    modalTitle: 'विक्रेता सुधारें और पुनः सबमिट करें',
    superAdminFeedback: 'सुपर एडमिन प्रतिक्रिया:',
    defaultModalFeedback: 'कृपया जानकारी अपडेट करें और पुनः सबमिट करें।',
    resubmitForApproval: 'अनुमोदन हेतु पुनः सबमिट करें',
  },
  mr: {
    title: 'सुधारणा इनबॉक्स',
    subtitle: (n: number) => `${n} विक्रेता अर्ज सुपर ॲडमिनने नाकारले`,
    allClear: 'सर्व काही ठीक आहे!',
    noRejections: 'कोणतीही कारवाई आवश्यक नाही.',
    rejected: 'नाकारले',
    feedbackNote: 'अभिप्राय टीप:',
    defaultFeedback: 'कृपया माहितीचे पुनरावलोकन करा आणि पुन्हा सबमिट करा.',
    owner: 'मालक:',
    phone: 'फोन:',
    zip: 'पिन कोड:',
    correctResubmit: 'दुरुस्त करा आणि पुन्हा सबमिट करा',
    modalTitle: 'विक्रेता दुरुस्त करा आणि पुन्हा सबमिट करा',
    superAdminFeedback: 'सुपर ॲडमिन अभिप्राय:',
    defaultModalFeedback: 'कृपया माहिती अद्ययावत करा आणि पुन्हा सबमिट करा.',
    resubmitForApproval: 'मंजुरीसाठी पुन्हा सबमिट करा',
  },
};

function CorrectionInbox({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [lang] = useSyncedLanguage();
  const t = ciTrans[lang];
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
        <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="text-muted mt-1">{t.subtitle(vendors.length)}</p>
      </div>

      {vendors.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={28} className="text-green-500" />} title={t.allClear} subtitle={t.noRejections} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {vendors.map((v) => (
            <div key={v.id} className="card p-6 bg-surface border border-border relative hover:border-red-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-extrabold text-base truncate text-text">{v.shop_name}</h3>
                  <Badge variant="error">{t.rejected}</Badge>
                </div>

                {/* Highlighted Rejection feedback note */}
                <div className="my-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 font-semibold leading-relaxed">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-red-700 mb-1">{t.feedbackNote}</p>
                  "{v.rejection_note || t.defaultFeedback}"
                </div>

                <div className="space-y-1 text-xs text-muted">
                  <p>{t.owner} <span className="font-semibold text-text">{v.owner_name}</span></p>
                  <p>{t.phone} <span className="font-semibold text-text">{v.phone}</span></p>
                  <p>{t.zip} <span className="font-semibold text-text">{v.zip_code}</span></p>
                </div>
              </div>

              <Button size="sm" className="w-full mt-6" onClick={() => setSelected(v)}>
                <Pencil size={14} /> {t.correctResubmit}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Resubmit Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={t.modalTitle} size="xl">
        {selected && (
          <div className="space-y-4">
            {/* Show Rejection Feedback Note at top of modal */}
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 leading-relaxed font-semibold">
              <span className="font-bold text-xs uppercase tracking-wider block text-red-700 mb-1">{t.superAdminFeedback}</span>
              "{selected.rejection_note || t.defaultModalFeedback}"
            </div>

            <VendorForm
              initialData={selected}
              submitLabel={t.resubmitForApproval}
              onSubmit={handleResubmitSubmit}
              onCancel={() => setSelected(null)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

const sgTrans = {
  en: {
    title: 'SOP Guides & Knowledge Base',
    subtitle: 'Review operational SOPs, guidelines, and FAQs published by Super Admin',
    documents: (n: number) => `Documents (${n})`,
    faqs: (n: number) => `FAQs (${n})`,
    searchPlaceholder: 'Search...',
    noDocuments: 'No SOP documents available for Sub-Admins',
    pinned: '⭐ Pinned',
    subAdminBadge: 'Sub-Admin',
    viewDocument: 'View Document',
    noFileAttached: 'No file attached',
    noFaqs: 'No FAQs published for Sub-Admins yet',
    read: 'Read',
    guide: 'Guide',
    category: 'Category:',
    download: 'Download',
    faqAnswer: 'FAQ Answer',
    question: 'Question',
    answer: 'Answer',
  },
  hi: {
    title: 'एसओपी गाइड और नॉलेज बेस',
    subtitle: 'सुपर एडमिन द्वारा प्रकाशित परिचालन एसओपी, दिशानिर्देश और सामान्य प्रश्न देखें',
    documents: (n: number) => `दस्तावेज़ (${n})`,
    faqs: (n: number) => `सामान्य प्रश्न (${n})`,
    searchPlaceholder: 'खोजें...',
    noDocuments: 'सब-एडमिन के लिए कोई एसओपी दस्तावेज़ उपलब्ध नहीं है',
    pinned: '⭐ पिन किया गया',
    subAdminBadge: 'सब-एडमिन',
    viewDocument: 'दस्तावेज़ देखें',
    noFileAttached: 'कोई फ़ाइल संलग्न नहीं है',
    noFaqs: 'सब-एडमिन के लिए अभी तक कोई सामान्य प्रश्न प्रकाशित नहीं हुए हैं',
    read: 'पढ़ें',
    guide: 'गाइड',
    category: 'श्रेणी:',
    download: 'डाउनलोड करें',
    faqAnswer: 'सामान्य प्रश्न का उत्तर',
    question: 'प्रश्न',
    answer: 'उत्तर',
  },
  mr: {
    title: 'एसओपी मार्गदर्शक आणि नॉलेज बेस',
    subtitle: 'सुपर ॲडमिनने प्रकाशित केलेली परिचालन एसओपी, मार्गदर्शक तत्त्वे आणि सामान्य प्रश्न पहा',
    documents: (n: number) => `कागदपत्रे (${n})`,
    faqs: (n: number) => `सामान्य प्रश्न (${n})`,
    searchPlaceholder: 'शोधा...',
    noDocuments: 'सब-ॲडमिनसाठी कोणतीही एसओपी कागदपत्रे उपलब्ध नाहीत',
    pinned: '⭐ पिन केलेले',
    subAdminBadge: 'सब-ॲडमिन',
    viewDocument: 'कागदपत्र पहा',
    noFileAttached: 'कोणतीही फाईल संलग्न नाही',
    noFaqs: 'सब-ॲडमिनसाठी अद्याप कोणतेही सामान्य प्रश्न प्रकाशित झालेले नाहीत',
    read: 'वाचा',
    guide: 'मार्गदर्शक',
    category: 'श्रेणी:',
    download: 'डाउनलोड करा',
    faqAnswer: 'सामान्य प्रश्नाचे उत्तर',
    question: 'प्रश्न',
    answer: 'उत्तर',
  },
};

function SubGuides() {
  const [lang] = useSyncedLanguage();
  const t = sgTrans[lang];
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
        <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="text-muted mt-1">{t.subtitle}</p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-1 bg-surface-2 p-1.5 rounded-2xl border border-border w-fit">
          {[
            { id: 'docs' as const, label: t.documents(guides.length), icon: FileText },
            { id: 'faq' as const, label: t.faqs(faqs.length), icon: MessageSquare }
          ].map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(tabItem.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tabItem.id ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-text hover:bg-surface'}`}
            >
              <tabItem.icon size={13} /> {tabItem.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:border-accent outline-none"
          />
        </div>
      </div>

      {/* Documents Tab */}
      {activeTab === 'docs' && (
        filteredGuides.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title={t.noDocuments} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {filteredGuides.map((g) => (
              <div key={g.id} className={`card p-6 bg-surface border hover-lift flex flex-col justify-between ${g.is_pinned ? 'border-accent/40' : 'border-border'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                      <FileText size={16} className="text-accent" />
                    </div>
                    {g.is_pinned && <span className="text-[10px] font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{t.pinned}</span>}
                  </div>
                  <h3 className="font-extrabold text-base text-text leading-snug">{g.title}</h3>
                  {g.version_note && <p className="text-[11px] text-accent font-semibold mt-1">{g.version_note}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="info">{t.subAdminBadge}</Badge>
                    {g.keywords && <span className="text-[10px] text-muted truncate max-w-[120px]">{g.keywords}</span>}
                  </div>
                </div>
                {g.file_data ? (
                  <Button variant="outline" size="sm" className="w-full mt-6" onClick={() => setSelectedGuide(g)}>
                    <Eye size={13} className="mr-1.5" /> {t.viewDocument}
                  </Button>
                ) : (
                  <span className="text-xs text-muted italic mt-6 block text-center">{t.noFileAttached}</span>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* FAQs Tab */}
      {activeTab === 'faq' && (
        filteredFaqs.length === 0 ? (
          <EmptyState icon={<MessageSquare size={28} />} title={t.noFaqs} />
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
                      {t.read}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Document Preview Drawer */}
      <Drawer open={!!selectedGuide} onClose={() => setSelectedGuide(null)} title={selectedGuide?.title || t.guide}>
        {selectedGuide && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-surface-2 p-3 rounded-xl border border-border">
              <div>
                {selectedGuide.version_note && <p className="text-[11px] text-accent font-semibold mb-1">{selectedGuide.version_note}</p>}
                <span className="text-xs text-muted">{t.category} <span className="font-bold text-text">{selectedGuide.category}</span></span>
              </div>
              <a href={selectedGuide.file_data} download={selectedGuide.file_name || 'guide.pdf'} className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                {t.download}
              </a>
            </div>
            <div className="rounded-xl border border-border overflow-hidden min-h-[40vh]">
              {selectedGuide.file_data && (selectedGuide.file_data.startsWith('data:image') || /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(selectedGuide.file_name || '')) ? (
                <img src={selectedGuide.file_data} alt={selectedGuide.title} className="w-full h-auto object-contain" />
              ) : selectedGuide.file_data ? (
                <iframe src={selectedGuide.file_data} title={selectedGuide.title} className="w-full h-[65vh] border-0" />
              ) : (
                <EmptyState icon={<FileText size={24} />} title={t.noFileAttached} />
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* FAQ Preview Drawer */}
      <Drawer open={!!selectedFaq} onClose={() => setSelectedFaq(null)} title={t.faqAnswer}>
        {selectedFaq && (
          <div className="space-y-5">
            <Badge variant={selectedFaq.category === 'sub_admin' ? 'info' : 'accent'}>{selectedFaq.category}</Badge>
            <div className="p-4 bg-surface-2 rounded-xl border border-border">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{t.question}</p>
              <p className="font-extrabold text-text text-base leading-snug">{selectedFaq.question}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{t.answer}</p>
              <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{selectedFaq.answer}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}



// 5. Live Order Tracker Tab Component for Sub-Admin
const lotTrans = {
  en: {
    title: 'Live Order Tracker',
    awaiting: (n: number) => `${n} Awaiting`,
    subtitlePrefix: 'Review all incoming client orders in real time. Approve',
    subtitleMid: 'to broadcast to nearby vendors or Discard',
    exportCsv: 'Export CSV 📊',
    refreshLiveStream: 'Refresh Live Stream',
    allOrders: (n: number) => `All Orders (${n})`,
    awaitingApproval: (n: number) => `⏳ Awaiting Approval (${n})`,
    approvedLive: (n: number) => `✅ Approved & Live (${n})`,
    searchPlaceholder: 'Search order, client, phone...',
    noOrdersView: 'No orders found in this view',
    newOrdersRealtime: 'New client orders will appear here in real time.',
    newOrdersWebsiteRealtime: 'New orders placed by clients on the website will appear here in real time.',
    slaLabel: '⏱ SLA:',
    awaitingApprovalBadge: '⏳ Awaiting Approval',
    liveBroadcast: '📡 Live Broadcast',
    approvedLiveBadge: '✅ Approved & Live',
    quantity: 'Quantity:',
    category: 'Category:',
    generalCategory: 'General',
    reject: 'reject',
    approve: 'approve',
    broadcastingToVendors: 'Broadcasting to vendors...',
    discard: 'Discard ❌',
    claimedByVendor: 'Claimed by Vendor',
    partnerKitchen: 'Partner Kitchen',
    whatsapp: 'WhatsApp',
    verifyOnWhatsapp: 'Verify order details on WhatsApp',
    pin: 'PIN:',
    landmark: 'Landmark:',
    colOrderIdTime: 'ORDER ID & TIME',
    colClientContact: 'CLIENT & CONTACT DETAILS',
    colOrderedItems: 'ORDERED ITEMS & QTY',
    colTotalPrice: 'TOTAL PRICE',
    colStatus: 'STATUS',
    colSubAdminAction: 'SUB-ADMIN ACTION',
    broadcastingToVendorsBadge: '📡 Broadcasting to Vendors',
    rejectDeleteTitle: 'Reject & Delete Order Permanently',
    approveShiftTitle: 'Approve order — Shift to Approved & Live broadcast for vendors',
    broadcasting: 'Broadcasting...',
    discardBroadcastedTitle: 'Discard broadcasted order',
    discardOrder: 'Discard Order ❌',
    toastOrderApproved: (id: string) => `✅ Order #${id} Approved! Broadcasted to nearby vendors.`,
    toastApproveFailed: 'Failed to approve order',
    toastOrderDiscarded: (id: string) => `❌ Order #${id} discarded & permanently deleted!`,
    toastDiscardFailed: 'Failed to discard order',
    toastNoOrdersToExport: 'No orders to export in the current view',
    toastExportSuccess: '✅ Exported Live Order Tracker summary (.csv) successfully!',
  },
  hi: {
    title: 'लाइव ऑर्डर ट्रैकर',
    awaiting: (n: number) => `${n} लंबित`,
    subtitlePrefix: 'सभी आने वाले ग्राहक ऑर्डर वास्तविक समय में देखें। स्वीकृत करें',
    subtitleMid: 'नज़दीकी विक्रेताओं को प्रसारित करने के लिए या अस्वीकार करें',
    exportCsv: 'सीएसवी निर्यात करें 📊',
    refreshLiveStream: 'लाइव स्ट्रीम रिफ्रेश करें',
    allOrders: (n: number) => `सभी ऑर्डर (${n})`,
    awaitingApproval: (n: number) => `⏳ अनुमोदन लंबित (${n})`,
    approvedLive: (n: number) => `✅ स्वीकृत और लाइव (${n})`,
    searchPlaceholder: 'ऑर्डर, ग्राहक, फोन खोजें...',
    noOrdersView: 'इस दृश्य में कोई ऑर्डर नहीं मिला',
    newOrdersRealtime: 'नए ग्राहक ऑर्डर यहां वास्तविक समय में दिखाई देंगे।',
    newOrdersWebsiteRealtime: 'वेबसाइट पर ग्राहकों द्वारा दिए गए नए ऑर्डर यहां वास्तविक समय में दिखाई देंगे।',
    slaLabel: '⏱ एसएलए:',
    awaitingApprovalBadge: '⏳ अनुमोदन लंबित',
    liveBroadcast: '📡 लाइव प्रसारण',
    approvedLiveBadge: '✅ स्वीकृत और लाइव',
    quantity: 'मात्रा:',
    category: 'श्रेणी:',
    generalCategory: 'सामान्य',
    reject: 'अस्वीकार करें',
    approve: 'स्वीकृत करें',
    broadcastingToVendors: 'विक्रेताओं को प्रसारित हो रहा है...',
    discard: 'अस्वीकृत करें ❌',
    claimedByVendor: 'विक्रेता द्वारा स्वीकृत',
    partnerKitchen: 'साझेदार किचन',
    whatsapp: 'व्हाट्सएप',
    verifyOnWhatsapp: 'व्हाट्सएप पर ऑर्डर विवरण सत्यापित करें',
    pin: 'पिन कोड:',
    landmark: 'लैंडमार्क:',
    colOrderIdTime: 'ऑर्डर आईडी और समय',
    colClientContact: 'ग्राहक और संपर्क विवरण',
    colOrderedItems: 'ऑर्डर किए गए आइटम और मात्रा',
    colTotalPrice: 'कुल मूल्य',
    colStatus: 'स्थिति',
    colSubAdminAction: 'सब-एडमिन कार्रवाई',
    broadcastingToVendorsBadge: '📡 विक्रेताओं को प्रसारित हो रहा है',
    rejectDeleteTitle: 'ऑर्डर स्थायी रूप से अस्वीकार करें और हटाएं',
    approveShiftTitle: 'ऑर्डर स्वीकृत करें — विक्रेताओं के लिए स्वीकृत और लाइव प्रसारण में स्थानांतरित करें',
    broadcasting: 'प्रसारित हो रहा है...',
    discardBroadcastedTitle: 'प्रसारित ऑर्डर को अस्वीकृत करें',
    discardOrder: 'ऑर्डर अस्वीकृत करें ❌',
    toastOrderApproved: (id: string) => `✅ ऑर्डर #${id} स्वीकृत! नज़दीकी विक्रेताओं को प्रसारित किया गया।`,
    toastApproveFailed: 'ऑर्डर स्वीकृत करने में विफल',
    toastOrderDiscarded: (id: string) => `❌ ऑर्डर #${id} अस्वीकृत और स्थायी रूप से हटा दिया गया!`,
    toastDiscardFailed: 'ऑर्डर अस्वीकृत करने में विफल',
    toastNoOrdersToExport: 'वर्तमान दृश्य में निर्यात के लिए कोई ऑर्डर नहीं',
    toastExportSuccess: '✅ लाइव ऑर्डर ट्रैकर सारांश (.csv) सफलतापूर्वक निर्यात किया गया!',
  },
  mr: {
    title: 'लाइव्ह ऑर्डर ट्रॅकर',
    awaiting: (n: number) => `${n} प्रलंबित`,
    subtitlePrefix: 'सर्व येणारे ग्राहक ऑर्डर्स रिअल टाइममध्ये पहा. मंजूर करा',
    subtitleMid: 'जवळपासच्या विक्रेत्यांना प्रसारित करण्यासाठी किंवा नाकारा',
    exportCsv: 'सीएसव्ही निर्यात करा 📊',
    refreshLiveStream: 'लाइव्ह स्ट्रीम रिफ्रेश करा',
    allOrders: (n: number) => `सर्व ऑर्डर्स (${n})`,
    awaitingApproval: (n: number) => `⏳ मंजुरी प्रलंबित (${n})`,
    approvedLive: (n: number) => `✅ मंजूर आणि लाइव्ह (${n})`,
    searchPlaceholder: 'ऑर्डर, ग्राहक, फोन शोधा...',
    noOrdersView: 'या दृश्यात कोणतेही ऑर्डर सापडले नाहीत',
    newOrdersRealtime: 'नवीन ग्राहक ऑर्डर्स इथे रिअल टाइममध्ये दिसतील.',
    newOrdersWebsiteRealtime: 'वेबसाइटवर ग्राहकांनी दिलेले नवीन ऑर्डर्स इथे रिअल टाइममध्ये दिसतील.',
    slaLabel: '⏱ एसएलए:',
    awaitingApprovalBadge: '⏳ मंजुरी प्रलंबित',
    liveBroadcast: '📡 लाइव्ह प्रसारण',
    approvedLiveBadge: '✅ मंजूर आणि लाइव्ह',
    quantity: 'प्रमाण:',
    category: 'श्रेणी:',
    generalCategory: 'सामान्य',
    reject: 'नाकारा',
    approve: 'मंजूर करा',
    broadcastingToVendors: 'विक्रेत्यांना प्रसारित होत आहे...',
    discard: 'नाकारा ❌',
    claimedByVendor: 'विक्रेत्याने स्वीकारले',
    partnerKitchen: 'भागीदार किचन',
    whatsapp: 'व्हॉट्सॲप',
    verifyOnWhatsapp: 'व्हॉट्सॲपवर ऑर्डर तपशील सत्यापित करा',
    pin: 'पिन कोड:',
    landmark: 'लँडमार्क:',
    colOrderIdTime: 'ऑर्डर आयडी आणि वेळ',
    colClientContact: 'ग्राहक आणि संपर्क तपशील',
    colOrderedItems: 'ऑर्डर केलेले आयटम आणि प्रमाण',
    colTotalPrice: 'एकूण किंमत',
    colStatus: 'स्थिती',
    colSubAdminAction: 'सब-ॲडमिन कृती',
    broadcastingToVendorsBadge: '📡 विक्रेत्यांना प्रसारित होत आहे',
    rejectDeleteTitle: 'ऑर्डर कायमचे नाकारा आणि हटवा',
    approveShiftTitle: 'ऑर्डर मंजूर करा — विक्रेत्यांसाठी मंजूर आणि लाइव्ह प्रसारणात हलवा',
    broadcasting: 'प्रसारित होत आहे...',
    discardBroadcastedTitle: 'प्रसारित ऑर्डर नाकारा',
    discardOrder: 'ऑर्डर नाकारा ❌',
    toastOrderApproved: (id: string) => `✅ ऑर्डर #${id} मंजूर! जवळपासच्या विक्रेत्यांना प्रसारित केले.`,
    toastApproveFailed: 'ऑर्डर मंजूर करण्यात अयशस्वी',
    toastOrderDiscarded: (id: string) => `❌ ऑर्डर #${id} नाकारला आणि कायमचा हटवला!`,
    toastDiscardFailed: 'ऑर्डर नाकारण्यात अयशस्वी',
    toastNoOrdersToExport: 'सध्याच्या दृश्यात निर्यात करण्यासाठी कोणतेही ऑर्डर नाहीत',
    toastExportSuccess: '✅ लाइव्ह ऑर्डर ट्रॅकर सारांश (.csv) यशस्वीरित्या निर्यात केला!',
  },
};

function SubAdminLiveOrderTrackerTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [lang] = useSyncedLanguage();
  const t = lotTrans[lang];
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
      show(t.toastOrderApproved(targetId.toString().substring(0, 6).toUpperCase()), 'success');
      fetchOrders();
    } catch (e: any) {
      console.error(e);
      show(e.message || t.toastApproveFailed, 'error');
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
      show(t.toastOrderDiscarded(targetId.toString().substring(0, 6).toUpperCase()), 'info');
      fetchOrders();
    } catch (e: any) {
      console.error(e);
      show(e.message || t.toastDiscardFailed, 'error');
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

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      show(t.toastNoOrdersToExport, 'info');
      return;
    }
    const rows = filteredOrders.map(o => {
      const targetId = (o.id || o._id || '').toString();
      const isAwaiting = o.status === 'awaiting_subadmin_approval';
      const sla = getElapsedSLA(o.created_at);
      return {
        'Order ID': `#${targetId.substring(0, 6).toUpperCase()}`,
        'Date & Time Placed': new Date(o.created_at).toLocaleString(),
        'Client Name': o.client_name || '',
        'Client Phone': o.client_phone || '',
        'Full Address': o.client_address || '',
        'PIN Code': o.client_zip || '',
        'Landmark': o.client_landmark || '',
        'Item Name': o.item_name || '',
        'Quantity': o.quantity || 1,
        'Price (₹)': o.price || o.total_price || '',
        'Live Status': isAwaiting ? 'Awaiting Approval' : 'Approved & Live',
        'Elapsed SLA': sla.formatted
      };
    });
    exportCSV(rows, `Live_Order_Tracker_Summary_${new Date().toISOString().slice(0, 10)}`);
    show(t.toastExportSuccess, 'success');
  };

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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">{t.title}</h1>
            {awaitingCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#A5C8FF] text-[#1E40AF] font-bold text-xs shadow-xs">
                {t.awaiting(awaitingCount)}
              </span>
            )}
          </div>
          <p className="text-[#6B7280] text-sm mt-1">
            {t.subtitlePrefix} <span className="text-green-600 font-bold">✅</span> {t.subtitleMid} <span className="text-red-600 font-bold">❌</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs border border-gray-200"
          >
            <Download size={14} className="text-[#4B5563]" /> {t.exportCsv}
          </button>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 rounded-xl bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs border border-gray-200"
          >
            <RefreshCw size={14} className="text-[#4B5563]" /> {t.refreshLiveStream}
          </button>
        </div>
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
            {t.allOrders(totalLiveTrackerCount)}
          </button>
          <button
            onClick={() => setFilter('awaiting')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filter === 'awaiting'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#2563EB] bg-blue-50/70 hover:bg-blue-100/70'
            }`}
          >
            {t.awaitingApproval(awaitingCount)}
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filter === 'approved'
                ? 'bg-[#16A34A] text-white shadow-xs'
                : 'text-[#16A34A] bg-green-50/70 hover:bg-green-100/70'
            }`}
          >
            {t.approvedLive(approvedCount)}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
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
            <p className="font-bold text-sm text-gray-800">{t.noOrdersView}</p>
            <p className="text-xs text-gray-500 mt-1">{t.newOrdersRealtime}</p>
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
                      {t.slaLabel} {sla.formatted}
                    </span>
                    {isAwaiting && (
                      <span className="border border-gray-200 bg-white text-[#374151] rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                        {t.awaitingApprovalBadge}
                      </span>
                    )}
                    {isBroadcasting && (
                      <span className="border border-amber-300 bg-amber-50 text-amber-900 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                        {t.liveBroadcast}
                      </span>
                    )}
                    {isClaimed && (
                      <span className="border border-green-300 bg-green-50 text-green-800 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                        {t.approvedLiveBadge}
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
                    <p className="text-xs text-[#6B7280] mt-0.5">{t.quantity} <strong className="text-[#111827]">{o.quantity || 1} pc</strong></p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium rounded-md">
                      {t.category} {o.master_category_name || o.category || t.generalCategory}
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
                        <MessageCircle size={12} className="text-green-700" /> {t.whatsapp}
                      </a>
                    )}
                  </div>
                  <p className="text-[#D97706] font-bold">📞 {o.client_phone}</p>
                  <p className="text-[#6B7280]">{o.client_address}</p>
                  <p className="text-[11px] text-[#6B7280]">{t.pin} <strong className="text-[#111827]">{o.client_zip}</strong> | {t.landmark} <strong className="text-[#111827]">{o.client_landmark}</strong></p>
                </div>

                {/* Sub-Admin Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-2">
                  {isAwaiting && (
                    <>
                      <button
                        onClick={() => handleDiscardOrder(o)}
                        className="flex-1 py-2 rounded-full bg-[#E53935] hover:bg-red-700 text-white font-extrabold text-xs uppercase shadow-xs transition-all cursor-pointer text-center"
                      >
                        {t.reject}
                      </button>
                      <button
                        onClick={() => handleApproveOrder(o)}
                        className="flex-1 py-2 rounded-full bg-[#2E7D32] hover:bg-green-800 text-white font-extrabold text-xs uppercase shadow-xs transition-all cursor-pointer text-center"
                      >
                        {t.approve}
                      </button>
                    </>
                  )}

                  {isBroadcasting && (
                    <div className="w-full flex justify-between items-center bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <span className="text-xs font-bold text-amber-800">{t.broadcastingToVendors}</span>
                      <button
                        onClick={() => handleDiscardOrder(o)}
                        className="px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs"
                      >
                        {t.discard}
                      </button>
                    </div>
                  )}

                  {isClaimed && (
                    <div className="w-full p-2 rounded-xl bg-green-50 border border-green-200 text-center">
                      <span className="text-xs font-bold text-green-800 block">{t.claimedByVendor}</span>
                      <span className="text-xs text-green-700 font-semibold block mt-0.5 truncate">
                        {o.vendor_name || o.vendor_phone || t.partnerKitchen}
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
                <th className="p-4">{t.colOrderIdTime}</th>
                <th className="p-4">{t.colClientContact}</th>
                <th className="p-4">{t.colOrderedItems}</th>
                <th className="p-4">{t.colTotalPrice}</th>
                <th className="p-4">{t.colStatus}</th>
                <th className="p-4 text-center">{t.colSubAdminAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock size={28} className="text-gray-400" />
                      <p className="font-bold text-sm text-[#111827]">{t.noOrdersView}</p>
                      <p className="text-xs text-[#6B7280]">{t.newOrdersWebsiteRealtime}</p>
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
                            {t.slaLabel} {sla.formatted}
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
                              title={t.verifyOnWhatsapp}
                            >
                              <MessageCircle size={11} className="text-green-700" /> {t.whatsapp}
                            </a>
                          )}
                        </div>

                        <p className="text-xs text-[#6B7280] mt-1 max-w-xs">{o.client_address}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {t.pin} <strong className="text-[#111827]">{o.client_zip}</strong> | {t.landmark} <strong className="text-[#111827]">{o.client_landmark}</strong>
                        </p>
                      </td>

                      {/* Column 3: ORDERED ITEMS & QTY */}
                      <td className="p-4 align-top">
                        <p className="font-bold text-[#D97706] text-sm">
                          {o.item_name}{!o.item_name?.toLowerCase().includes('order') ? ` (${o.quantity || 1} order${(o.quantity || 1) > 1 ? 's' : ''})` : ''}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-0.5">{t.quantity} <strong className="text-[#111827]">{o.quantity || 1} pc</strong></p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium rounded-md">
                          {t.category} {o.master_category_name || o.category || t.generalCategory}
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
                            {t.awaitingApprovalBadge}
                          </div>
                        )}
                        {isBroadcasting && (
                          <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-full px-3.5 py-1 text-xs font-bold inline-flex items-center gap-1">
                            {t.broadcastingToVendorsBadge}
                          </div>
                        )}
                        {isClaimed && (
                          <div className="border border-green-300 bg-green-50 text-green-800 rounded-full px-3.5 py-1 text-xs font-bold inline-flex items-center gap-1">
                            {t.approvedLiveBadge}
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
                              title={t.rejectDeleteTitle}
                            >
                              {t.reject}
                            </button>

                            {/* Approve Green Pill Button */}
                            <button
                              onClick={() => handleApproveOrder(o)}
                              className="h-8 px-5 rounded-full bg-[#2E7D32] hover:bg-green-800 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center cursor-pointer tracking-wide uppercase"
                              title={t.approveShiftTitle}
                            >
                              {t.approve}
                            </button>
                          </div>
                        )}

                        {isBroadcasting && (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] font-bold text-amber-700">{t.broadcasting}</span>
                            <button
                              onClick={() => handleDiscardOrder(o)}
                              className="h-7 px-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition-all shadow-xs cursor-pointer"
                              title={t.discardBroadcastedTitle}
                            >
                              {t.discardOrder}
                            </button>
                          </div>
                        )}

                        {isClaimed && (
                          <div className="p-2 rounded-xl bg-green-50 border border-green-200 text-center">
                            <span className="text-xs font-bold text-green-800 block">{t.claimedByVendor}</span>
                            <span className="text-[10px] text-green-700 font-semibold block truncate max-w-[140px] mx-auto mt-0.5">
                              {o.vendor_name || o.vendor_phone || t.partnerKitchen}
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
// Orders are considered "missed" once they've broadcast past the 9-hour vendor pickup window
// (kept consistent with the SLA countdown shown on Vendor.tsx and on each order card below).
const MISSED_ORDER_THRESHOLD_SECS = 32400;
const isOrderMissed = (o: any) => Math.max(0, Date.now() - new Date(o.created_at).getTime()) / 1000 >= MISSED_ORDER_THRESHOLD_SECS;

const podTrans = {
  en: {
    title: 'Pending & Missed Orders',
    missed: (n: number) => `${n} Missed`,
    subtitle: 'Orders that missed the 9-hour vendor pickup window. Select one or more to resume or force-assign to a vendor.',
    deselectAll: 'Deselect All',
    selectAll: (n: number) => `Select All (${n})`,
    resumeAllTitle: 'Re-broadcast all missed orders to nearby vendors simultaneously',
    resumeAllMissed: (n: number) => `Resume All Missed (${n})`,
    refreshList: 'Refresh List',
    ordersSelected: (n: number) => `${n} order${n > 1 ? 's' : ''} selected`,
    assignSelected: 'Assign Selected 🏪',
    resumeSelected: 'Resume Selected 🔄',
    clear: 'Clear',
    noMissedOrders: 'No missed orders',
    noMissedSubtitle: 'All pending orders are still within their 9-hour vendor pickup window.',
    placed: 'Placed:',
    missedExpired: '⚠️ Missed (Expired)',
    quantity: 'Quantity:',
    category: 'Category:',
    generalCategory: 'General',
    whatsapp: 'WhatsApp',
    pin: 'PIN:',
    landmark: 'Landmark:',
    matchingVendors: 'Matching Vendors:',
    inPin: 'in PIN',
    forceAssignTitle: 'Force-assign order directly to a specific active vendor',
    assign: 'Assign 🏪',
    resumeTitle: 'Resume & restart the vendor broadcast window',
    resume: 'Resume 🔄',
    directAssignOrder: (id: string) => `Direct Assign Order #${id}`,
    directAssignOrders: (n: number) => `Direct Assign ${n} Orders`,
    orderDetails: 'Order Details:',
    item: 'Item:',
    client: 'Client:',
    pinCode: 'PIN Code:',
    ordersSelectedColon: (n: number) => `${n} orders selected:`,
    selectTargetVendor: 'Select Target Vendor / Kitchen:',
    chooseActiveVendor: '-- Choose Active Vendor --',
    pinMatch: '⭐ PIN MATCH',
    cancel: 'Cancel',
    assigning: 'Assigning...',
    confirmForceAssignment: 'Confirm Force Assignment ✅',
    toastResumed: (id: string) => `Order #${id} resumed & re-broadcasted to nearby active vendors!`,
    toastResumeFailed: 'Failed to resume order',
    toastNoMissedToResume: 'No missed orders to resume',
    toastResumedAll: (n: number) => `Successfully resumed and re-broadcasted ${n} missed orders!`,
    toastResumeAllFailed: 'Failed to resume missed orders',
    toastResumedSelected: (n: number) => `Resumed ${n} selected order${n > 1 ? 's' : ''}!`,
    toastResumeSelectedFailed: 'Failed to resume selected orders',
    toastSelectVendor: 'Please select a target vendor',
    toastForceAssigned: (id: string, shop: string) => `Order #${id} force-assigned to ${shop}!`,
    toastForceAssignedMulti: (n: number, shop: string) => `${n} orders force-assigned to ${shop}!`,
    toastAssignFailed: 'Failed to assign vendor',
  },
  hi: {
    title: 'लंबित और छूटे हुए ऑर्डर',
    missed: (n: number) => `${n} छूटे`,
    subtitle: 'वे ऑर्डर जो 9-घंटे की विक्रेता पिकअप विंडो चूक गए। फिर से शुरू करने या विक्रेता को सौंपने के लिए एक या अधिक चुनें।',
    deselectAll: 'सभी अचयनित करें',
    selectAll: (n: number) => `सभी चुनें (${n})`,
    resumeAllTitle: 'सभी छूटे हुए ऑर्डर को नज़दीकी विक्रेताओं को एक साथ पुनः प्रसारित करें',
    resumeAllMissed: (n: number) => `सभी छूटे हुए फिर से शुरू करें (${n})`,
    refreshList: 'सूची रिफ्रेश करें',
    ordersSelected: (n: number) => `${n} ऑर्डर चयनित`,
    assignSelected: 'चयनित सौंपें 🏪',
    resumeSelected: 'चयनित फिर से शुरू करें 🔄',
    clear: 'साफ़ करें',
    noMissedOrders: 'कोई छूटा हुआ ऑर्डर नहीं',
    noMissedSubtitle: 'सभी लंबित ऑर्डर अभी भी अपनी 9-घंटे की विक्रेता पिकअप विंडो के भीतर हैं।',
    placed: 'दिया गया:',
    missedExpired: '⚠️ छूटा (समाप्त)',
    quantity: 'मात्रा:',
    category: 'श्रेणी:',
    generalCategory: 'सामान्य',
    whatsapp: 'व्हाट्सएप',
    pin: 'पिन कोड:',
    landmark: 'लैंडमार्क:',
    matchingVendors: 'मिलान विक्रेता:',
    inPin: 'पिन कोड में',
    forceAssignTitle: 'ऑर्डर को सीधे किसी विशिष्ट सक्रिय विक्रेता को सौंपें',
    assign: 'सौंपें 🏪',
    resumeTitle: 'विक्रेता प्रसारण विंडो को फिर से शुरू करें',
    resume: 'फिर से शुरू करें 🔄',
    directAssignOrder: (id: string) => `ऑर्डर #${id} सीधे सौंपें`,
    directAssignOrders: (n: number) => `${n} ऑर्डर सीधे सौंपें`,
    orderDetails: 'ऑर्डर विवरण:',
    item: 'आइटम:',
    client: 'ग्राहक:',
    pinCode: 'पिन कोड:',
    ordersSelectedColon: (n: number) => `${n} ऑर्डर चयनित:`,
    selectTargetVendor: 'लक्ष्य विक्रेता / किचन चुनें:',
    chooseActiveVendor: '-- सक्रिय विक्रेता चुनें --',
    pinMatch: '⭐ पिन मैच',
    cancel: 'रद्द करें',
    assigning: 'सौंपा जा रहा है...',
    confirmForceAssignment: 'असाइनमेंट की पुष्टि करें ✅',
    toastResumed: (id: string) => `ऑर्डर #${id} फिर से शुरू किया गया और नज़दीकी सक्रिय विक्रेताओं को प्रसारित किया गया!`,
    toastResumeFailed: 'ऑर्डर फिर से शुरू करने में विफल',
    toastNoMissedToResume: 'फिर से शुरू करने के लिए कोई छूटा हुआ ऑर्डर नहीं',
    toastResumedAll: (n: number) => `${n} छूटे हुए ऑर्डर सफलतापूर्वक फिर से शुरू और प्रसारित किए गए!`,
    toastResumeAllFailed: 'छूटे हुए ऑर्डर फिर से शुरू करने में विफल',
    toastResumedSelected: (n: number) => `${n} चयनित ऑर्डर फिर से शुरू किए गए!`,
    toastResumeSelectedFailed: 'चयनित ऑर्डर फिर से शुरू करने में विफल',
    toastSelectVendor: 'कृपया एक लक्ष्य विक्रेता चुनें',
    toastForceAssigned: (id: string, shop: string) => `ऑर्डर #${id} को ${shop} को सौंपा गया!`,
    toastForceAssignedMulti: (n: number, shop: string) => `${n} ऑर्डर ${shop} को सौंपे गए!`,
    toastAssignFailed: 'विक्रेता को सौंपने में विफल',
  },
  mr: {
    title: 'प्रलंबित आणि चुकलेले ऑर्डर्स',
    missed: (n: number) => `${n} चुकले`,
    subtitle: '9-तासांची विक्रेता पिकअप विंडो चुकलेले ऑर्डर्स. पुन्हा सुरू करण्यासाठी किंवा विक्रेत्याला नियुक्त करण्यासाठी एक किंवा अधिक निवडा.',
    deselectAll: 'सर्व अनिवडा',
    selectAll: (n: number) => `सर्व निवडा (${n})`,
    resumeAllTitle: 'सर्व चुकलेले ऑर्डर्स जवळपासच्या विक्रेत्यांना एकाच वेळी पुन्हा प्रसारित करा',
    resumeAllMissed: (n: number) => `सर्व चुकलेले पुन्हा सुरू करा (${n})`,
    refreshList: 'यादी रिफ्रेश करा',
    ordersSelected: (n: number) => `${n} ऑर्डर निवडले`,
    assignSelected: 'निवडलेले नियुक्त करा 🏪',
    resumeSelected: 'निवडलेले पुन्हा सुरू करा 🔄',
    clear: 'साफ करा',
    noMissedOrders: 'कोणतेही चुकलेले ऑर्डर नाहीत',
    noMissedSubtitle: 'सर्व प्रलंबित ऑर्डर्स अजूनही त्यांच्या 9-तासांच्या विक्रेता पिकअप विंडोमध्ये आहेत.',
    placed: 'दिले:',
    missedExpired: '⚠️ चुकले (संपले)',
    quantity: 'प्रमाण:',
    category: 'श्रेणी:',
    generalCategory: 'सामान्य',
    whatsapp: 'व्हॉट्सॲप',
    pin: 'पिन कोड:',
    landmark: 'लँडमार्क:',
    matchingVendors: 'जुळणारे विक्रेते:',
    inPin: 'पिन कोडमध्ये',
    forceAssignTitle: 'ऑर्डर थेट विशिष्ट सक्रिय विक्रेत्याला नियुक्त करा',
    assign: 'नियुक्त करा 🏪',
    resumeTitle: 'विक्रेता प्रसारण विंडो पुन्हा सुरू करा',
    resume: 'पुन्हा सुरू करा 🔄',
    directAssignOrder: (id: string) => `ऑर्डर #${id} थेट नियुक्त करा`,
    directAssignOrders: (n: number) => `${n} ऑर्डर थेट नियुक्त करा`,
    orderDetails: 'ऑर्डर तपशील:',
    item: 'आयटम:',
    client: 'ग्राहक:',
    pinCode: 'पिन कोड:',
    ordersSelectedColon: (n: number) => `${n} ऑर्डर निवडले:`,
    selectTargetVendor: 'लक्ष्य विक्रेता / किचन निवडा:',
    chooseActiveVendor: '-- सक्रिय विक्रेता निवडा --',
    pinMatch: '⭐ पिन जुळले',
    cancel: 'रद्द करा',
    assigning: 'नियुक्त करत आहे...',
    confirmForceAssignment: 'नियुक्तीची पुष्टी करा ✅',
    toastResumed: (id: string) => `ऑर्डर #${id} पुन्हा सुरू केला आणि जवळपासच्या सक्रिय विक्रेत्यांना प्रसारित केला!`,
    toastResumeFailed: 'ऑर्डर पुन्हा सुरू करण्यात अयशस्वी',
    toastNoMissedToResume: 'पुन्हा सुरू करण्यासाठी कोणतेही चुकलेले ऑर्डर नाहीत',
    toastResumedAll: (n: number) => `${n} चुकलेले ऑर्डर्स यशस्वीरित्या पुन्हा सुरू आणि प्रसारित केले!`,
    toastResumeAllFailed: 'चुकलेले ऑर्डर्स पुन्हा सुरू करण्यात अयशस्वी',
    toastResumedSelected: (n: number) => `${n} निवडलेले ऑर्डर्स पुन्हा सुरू केले!`,
    toastResumeSelectedFailed: 'निवडलेले ऑर्डर्स पुन्हा सुरू करण्यात अयशस्वी',
    toastSelectVendor: 'कृपया लक्ष्य विक्रेता निवडा',
    toastForceAssigned: (id: string, shop: string) => `ऑर्डर #${id} ${shop} ला नियुक्त केला!`,
    toastForceAssignedMulti: (n: number, shop: string) => `${n} ऑर्डर्स ${shop} ला नियुक्त केले!`,
    toastAssignFailed: 'विक्रेत्याला नियुक्त करण्यात अयशस्वी',
  },
};

function SubAdminPendingOrdersTab({ show }: { show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [lang] = useSyncedLanguage();
  const t = podTrans[lang];
  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignTargets, setAssignTargets] = useState<any[] | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

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

  // Resets an order's broadcast timer so it re-enters the live vendor pool as brand new.
  const resumeOrder = async (targetId: string) => {
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
  };

  const handleResumeOrder = async (order: any) => {
    const targetId = order.id || order._id;
    try {
      await resumeOrder(targetId);
      show(t.toastResumed(targetId.toString().substring(0, 6).toUpperCase()), 'success');
      setSelectedOrderIds(ids => ids.filter(id => id !== targetId));
      load();
    } catch (e) {
      console.error(e);
      show(t.toastResumeFailed, 'error');
    }
  };

  const handleResumeAllMissed = async () => {
    const missedOrders = orders.filter(isOrderMissed);
    if (missedOrders.length === 0) {
      show(t.toastNoMissedToResume, 'info');
      return;
    }

    try {
      for (const order of missedOrders) {
        await resumeOrder(order.id || order._id);
      }
      show(t.toastResumedAll(missedOrders.length), 'success');
      setSelectedOrderIds([]);
      load();
    } catch (e) {
      console.error(e);
      show(t.toastResumeAllFailed, 'error');
    }
  };

  const handleResumeSelected = async () => {
    if (selectedOrderIds.length === 0) return;
    try {
      for (const targetId of selectedOrderIds) {
        await resumeOrder(targetId);
      }
      show(t.toastResumedSelected(selectedOrderIds.length), 'success');
      setSelectedOrderIds([]);
      load();
    } catch (e) {
      console.error(e);
      show(t.toastResumeSelectedFailed, 'error');
    }
  };

  const toggleOrderSelected = (targetId: string) => {
    setSelectedOrderIds(ids => ids.includes(targetId) ? ids.filter(id => id !== targetId) : [...ids, targetId]);
  };

  const handleManualAssign = async () => {
    if (!assignTargets || assignTargets.length === 0 || !selectedVendorId) {
      show(t.toastSelectVendor, 'error');
      return;
    }
    const targetVendor = vendors.find(v => (v.id || (v as any)._id) === selectedVendorId);
    if (!targetVendor) return;

    setAssigning(true);
    try {
      for (const order of assignTargets) {
        const targetOrderId = order.id || order._id;
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
      }
      show(
        assignTargets.length === 1
          ? t.toastForceAssigned((assignTargets[0].id || assignTargets[0]._id).toString().substring(0, 6).toUpperCase(), targetVendor.shop_name)
          : t.toastForceAssignedMulti(assignTargets.length, targetVendor.shop_name),
        'success'
      );
      setSelectedOrderIds(ids => ids.filter(id => !assignTargets.some(o => (o.id || o._id) === id)));
      setAssignTargets(null);
      setSelectedVendorId('');
      load();
    } catch (e) {
      console.error(e);
      show(t.toastAssignFailed, 'error');
    }
    setAssigning(false);
  };

  if (loading) return <Spinner />;

  const missedOrdersList = orders.filter(isOrderMissed);
  const selectedMissedIds = selectedOrderIds.filter(id => missedOrdersList.some(o => (o.id || o._id) === id));
  const allMissedSelected = missedOrdersList.length > 0 && selectedMissedIds.length === missedOrdersList.length;

  const toggleSelectAll = () => {
    if (allMissedSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(missedOrdersList.map(o => o.id || o._id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title & Batch Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">{t.title}</h1>
            {missedOrdersList.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-xs animate-pulse shadow-xs border border-red-300">
                {t.missed(missedOrdersList.length)}
              </span>
            )}
          </div>
          <p className="text-[#6B7280] text-sm mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {missedOrdersList.length > 0 && (
            <>
              <button
                onClick={toggleSelectAll}
                className="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#374151] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs border border-gray-300 cursor-pointer"
              >
                <CheckCircle2 size={14} className={allMissedSelected ? 'text-[#F1A80A]' : 'text-gray-400'} />
                {allMissedSelected ? t.deselectAll : t.selectAll(missedOrdersList.length)}
              </button>
              <button
                onClick={handleResumeAllMissed}
                className="px-4 py-2 rounded-xl bg-[#4A0E17] hover:bg-[#360910] text-[#C5A059] text-xs font-black transition-all flex items-center gap-1.5 shadow-sm border border-[#C5A059]/40 cursor-pointer"
                title={t.resumeAllTitle}
              >
                <RefreshCw size={14} className="animate-spin-slow" /> {t.resumeAllMissed(missedOrdersList.length)}
              </button>
            </>
          )}

          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs border border-gray-200"
          >
            <RefreshCw size={14} /> {t.refreshList}
          </button>
        </div>
      </div>

      {/* Batch Selection Toolbar */}
      {selectedMissedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-3 px-4">
          <span className="text-xs font-bold text-blue-900">
            {t.ordersSelected(selectedMissedIds.length)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAssignTargets(missedOrdersList.filter(o => selectedMissedIds.includes(o.id || o._id)))}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-[#374151] font-bold text-xs border border-gray-300 transition-all cursor-pointer flex items-center gap-1"
            >
              <Store size={12} /> {t.assignSelected}
            </button>
            <button
              onClick={handleResumeSelected}
              className="px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-green-800 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} /> {t.resumeSelected}
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-[#6B7280] font-bold text-xs border border-gray-300 transition-all cursor-pointer"
            >
              {t.clear}
            </button>
          </div>
        </div>
      )}

      {/* Orders Grid / Empty State */}
      {missedOrdersList.length === 0 ? (
        <EmptyState icon={<Clock size={32} />} title={t.noMissedOrders} subtitle={t.noMissedSubtitle} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missedOrdersList.map((o) => {
            const targetId = o.id || o._id;
            const formattedCode = `#${targetId.toString().substring(0, 6).toUpperCase()}`;
            const isSelected = selectedOrderIds.includes(targetId);
            const cleanPhone = (o.client_phone || '').replace(/\D/g, '');

            // Vendor match count for this PIN code
            const matchingVendors = vendors.filter(v => v.zip_code === o.client_zip);

            return (
              <div
                key={targetId}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-xs ${
                  isSelected ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-400' : 'bg-red-50/40 border-red-200'
                }`}
              >
                <div>
                  {/* Card Header: Checkbox, Code & Missed Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOrderSelected(targetId)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-[#F1A80A] focus:ring-[#F1A80A] cursor-pointer accent-[#F1A80A]"
                        aria-label={`Select order ${formattedCode}`}
                      />
                      <div>
                        <h3 className="font-extrabold text-lg text-[#111827]">{formattedCode}</h3>
                        <span className="text-xs text-[#6B7280] block font-normal">
                          {t.placed} {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-xs border border-red-300 animate-pulse">
                        {t.missedExpired}
                      </span>
                    </div>
                  </div>

                  {/* Ordered Product Box */}
                  <div className="bg-[#FAF9F6] p-3 rounded-xl border border-gray-200/60 mb-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-[#D97706]">{o.item_name}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{t.quantity} <strong className="text-[#111827]">{o.quantity} pc</strong></p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-medium rounded-md">
                        {t.category} {o.master_category_name || t.generalCategory}
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
                          <MessageCircle size={10} className="text-green-700" /> {t.whatsapp}
                        </a>
                      )}
                    </div>
                    <p className="text-[#D97706] font-bold">📞 {o.client_phone}</p>
                    <p className="text-[#6B7280] line-clamp-2">{o.client_address}</p>
                    <p className="text-[11px] text-[#6B7280]">
                      {t.pin} <strong className="text-[#111827]">{o.client_zip}</strong> | {t.landmark} <strong className="text-[#111827]">{o.client_landmark}</strong>
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#6B7280] font-semibold">
                    {t.matchingVendors} <strong className="text-[#111827]">{matchingVendors.length} {t.inPin}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Manual Assign Button */}
                    <button
                      onClick={() => {
                        setAssignTargets([o]);
                        setSelectedVendorId('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] font-bold text-xs border border-gray-300 transition-all cursor-pointer flex items-center gap-1"
                      title={t.forceAssignTitle}
                    >
                      <Store size={12} /> {t.assign}
                    </button>

                    {/* Resume / Re-broadcast Button */}
                    <button
                      onClick={() => handleResumeOrder(o)}
                      className="px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-green-800 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      title={t.resumeTitle}
                    >
                      <RefreshCw size={12} /> {t.resume}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Manual Vendor Assignment Modal ── */}
      {assignTargets && assignTargets.length > 0 && (
        <Modal
          open={!!assignTargets}
          onClose={() => setAssignTargets(null)}
          title={
            assignTargets.length === 1
              ? t.directAssignOrder((assignTargets[0].id || assignTargets[0]._id).toString().substring(0, 6).toUpperCase())
              : t.directAssignOrders(assignTargets.length)
          }
        >
          <div className="space-y-4 text-xs text-[#374151]">
            {assignTargets.length === 1 ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <p className="font-bold text-[#111827]">{t.orderDetails}</p>
                <p>{t.item} <strong className="text-[#D97706]">{assignTargets[0].item_name}</strong> (₹{assignTargets[0].price || assignTargets[0].total_price})</p>
                <p>{t.client} <strong>{assignTargets[0].client_name}</strong> ({assignTargets[0].client_phone})</p>
                <p>{t.pinCode} <strong>{assignTargets[0].client_zip}</strong> | {t.landmark} {assignTargets[0].client_landmark}</p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <p className="font-bold text-[#111827]">{t.ordersSelectedColon(assignTargets.length)}</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {assignTargets.map((o) => (
                    <li key={o.id || o._id}>
                      #{(o.id || o._id).toString().substring(0, 6).toUpperCase()} — {o.item_name} ({o.client_name}, PIN: {o.client_zip})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-bold text-sm text-[#111827] block">{t.selectTargetVendor}</label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-xs text-[#111827] font-semibold focus:outline-none focus:ring-2 focus:ring-[#F1A80A]"
              >
                <option value="">{t.chooseActiveVendor}</option>
                {vendors.map((v) => {
                  const vId = v.id || (v as any)._id;
                  const isPinMatch = assignTargets.some(o => v.zip_code === o.client_zip);
                  return (
                    <option key={vId} value={vId}>
                      {v.shop_name} ({v.phone}) {isPinMatch ? t.pinMatch : `(PIN: ${v.zip_code})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <Button variant="ghost" size="sm" onClick={() => setAssignTargets(null)}>
                {t.cancel}
              </Button>
              <Button variant="primary" size="sm" onClick={handleManualAssign} disabled={assigning || !selectedVendorId}>
                {assigning ? t.assigning : t.confirmForceAssignment}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

