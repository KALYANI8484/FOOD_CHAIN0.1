import { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, CreditCard, Radar, Trash2,
  DollarSign, Clock, CheckCircle2, AlertCircle, Store, Lock as Padlock,
  Navigation, AlertTriangle, Upload, Menu, X, Users
} from 'lucide-react';
import { io } from 'socket.io-client';
import { supabase, type Vendor as VendorType, type VendorItem, type Order, type Plan, type MasterItem } from '../lib/supabase';
import { Button, Badge, Modal, Input, Select, useToast, Toast, Spinner, EmptyState, SpotlightCard, LanguageSelector, getInitialLanguage, type Language } from './ui';
import { getItemTranslation } from './Landing';

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

type Tab = 'dashboard' | 'radar' | 'kanban' | 'activation' | 'upgrade';

export function Vendor({ onExit, vendorPhone }: { onExit: () => void; vendorPhone?: string }) {
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

  const [tab, setTab] = useState<Tab>('dashboard');
  const [vendor, setVendor] = useState<VendorType | null>(null);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast, show } = useToast();
  
  // Sockets & Live broadcast radar list
  const [radarOrders, setRadarOrders] = useState<Order[]>([]);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const queryPhone = vendorPhone || '';
        let targetVendor: VendorType | null = null;

        // Try /api/db for MongoDB vendors
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'vendors',
            action: 'select',
            filters: queryPhone ? { phone: queryPhone } : {}
          })
        });
        const d = await res.json();
        if (d.data && d.data.length > 0) {
          targetVendor = d.data[0];
        }

        // Fallback to any active vendor if queryPhone wasn't matched
        if (!targetVendor) {
          const allRes = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'vendors', action: 'select', filters: {} })
          });
          const allData = await allRes.json();
          if (allData.data && allData.data.length > 0) {
            targetVendor = allData.data[0];
          }
        }

        setVendor(targetVendor);
        if (targetVendor && targetVendor.plan_id) {
          const { data: pData } = await supabase.from('subscription_plans').select('*').eq('id', targetVendor.plan_id).maybeSingle();
          setActivePlan(pData);
        }
      } catch (e) {
        console.error('Failed to load vendor session:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorPhone]);

  // POS Beep Chime Generator using browser AudioContext
  const playPOSChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.error('Audio chime error:', err);
    }
  };

  useEffect(() => {
    if (!vendor) return;

    // Load initial pending orders
    (async () => {
      const res = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'orders', action: 'select', filters: { status: 'pending' } })
      });
      const d = await res.json();
      setRadarOrders(d.data || []);
    })();

    // Establish WebSocket Connection
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Vendor socket connected');
    });

    socket.on('newOrder', (newOrder: Order) => {
      setRadarOrders((prev) => {
        // Avoid duplicate additions
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        
        // Play Chime alert if order is in vendor's zip code (first 3 digits match)
        if (newOrder.client_zip?.substring(0, 3) === vendor.zip_code?.substring(0, 3)) {
          playPOSChime();
        }
        return [newOrder, ...prev];
      });
    });

    socket.on('orderRemoved', (orderId: string) => {
      setRadarOrders((prev) => prev.filter((o) => o.id !== orderId));
    });

    socket.on('orderUpdated', (updatedOrder: Order) => {
      // If it is accepted by another vendor, remove it from radar feed
      if (updatedOrder.status !== 'pending') {
        setRadarOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [vendor]);

  const getVendorItemLimit = (vendor: VendorType | null) => {
    if (!vendor) return 5;
    if (vendor.plan_name === 'Premium') return Infinity;
    if (vendor.plan_name === 'Standard') return 25;
    if (vendor.plan_name === 'Basic') return 10;
    return 5;
  };
  const navLabels = {
    en: { dashboard: 'Dashboard', radar: 'Order Radar', kanban: 'Active Orders', activation: 'Plan Activation', upgrade: "Plan's", exit: 'Exit' },
    hi: { dashboard: 'डैशबोर्ड', radar: 'ऑर्डर रडार', kanban: 'सक्रिय ऑर्डर', activation: 'प्लान एक्टिवेशन', upgrade: 'प्लान्स', exit: 'बाहर निकलें' },
    mr: { dashboard: 'डॅशबोर्ड', radar: 'ऑर्डर रडार', kanban: 'सक्रिय ऑर्डर', activation: 'प्लॅन ॲक्टिव्हेशन', upgrade: 'प्लॅन्स', exit: 'बाहेर पडा' },
  }[lang];

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: navLabels.dashboard, icon: LayoutDashboard },
    { id: 'radar', label: navLabels.radar, icon: Radar },
    { id: 'kanban', label: navLabels.kanban, icon: Navigation },
    { id: 'activation', label: navLabels.activation, icon: CheckCircle2 },
    { id: 'upgrade', label: navLabels.upgrade, icon: CreditCard },
  ];

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><Spinner /></div>;

  if (!vendor) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-text">
        <div className="card p-8 max-w-md text-center animate-scale-in bg-surface border border-border">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold">Awaiting Credentials Verification</h2>
          <p className="text-muted mt-2 text-sm">No approved vendor matching this login was found, or your registration is in review by the Super Admin.</p>
          <Button className="mt-6" onClick={onExit}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex text-text relative">
      {/* Mobile Header Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          <Store size={18} className="text-accent shrink-0" />
          <p className="font-bold text-sm truncate text-text">{vendor.shop_name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSelector />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-text" aria-label="Toggle Menu">
             {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`w-64 border-r border-border bg-surface flex flex-col h-screen fixed lg:sticky top-0 z-40 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-border hidden lg:flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate text-text">{vendor.shop_name}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-14 lg:mt-0">
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
              {item.id === 'radar' && radarOrders.filter(o => o.client_zip === vendor.zip_code).length > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-ping" />
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex justify-center pb-1">
            <LanguageSelector />
          </div>
          <Button variant="ghost" size="sm" className="w-full" onClick={onExit}>Exit</Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen relative z-10 bg-bg pt-14 lg:pt-0">
        <div className="p-8 max-w-7xl mx-auto">
          {tab === 'dashboard' && <VendorDashboard vendor={vendor} onTab={setTab} />}
          {tab === 'radar' && <OrderRadar vendor={vendor} activePlan={activePlan} radarOrders={radarOrders} onTab={setTab} show={show} />}
          {tab === 'kanban' && <VendorKanban vendor={vendor} show={show} />}
          {tab === 'activation' && <PlanActivation vendor={vendor} activePlan={activePlan} onTab={setTab} />}
          {tab === 'upgrade' && <UpgradePlan vendor={vendor} show={show} />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

const vTrans = {
  en: {
    welcome: 'Welcome',
    totalCompletedOrders: 'Total Completed Orders',
    totalOverallCompletedDesc: 'Total overall orders completed',
    connectedClients: 'Connected Clients',
    connectedClientsDesc: 'Clients connected until now',
    totalOverallEarnings: 'Total Overall Earnings',
    totalEarnedDesc: 'Total overall earned from website',
    totalOrdersReceived: 'Total Orders Received',
    lifetimeOrderCount: 'Lifetime order count',
    successfulOrders: 'SUCCESSFUL ORDERS',
    noCompletedOrdersYet: 'No completed orders yet',
    subscriptionHealth: 'SUBSCRIPTION HEALTH',
    activePlan: 'Active plan',
    clientsLimitCount: 'Clients Limit Count',
    daysRemaining: 'Days Remaining',
    planExpiredTitle: 'Plan Expired',
    planExpiredDesc: 'Your plan is expired. Please renew or purchase a new plan to continue accepting client orders.',
    renewPlanBtn: 'Renew / Purchase New Plan',
    qaTitle: 'Q&A / Platform Suggestions',
    qaDesc: 'Have a question or a feature request? Submit it directly to the Super Admin team.',
    qaPlaceholder: 'Type your suggestion or question here...',
    submitToAdmin: 'Submit to Admin',
    yourSubmittedQa: 'Your Submitted Questions & Suggestions',
    adminReply: 'Admin Reply:',
    clientsUnit: 'Clients',
    until: 'Until',
    statusApproved: 'APPROVED',
    statusExpired: 'EXPIRED',
    statusPending: 'PENDING',
    // Order Radar
    radarTitle: 'Broadcast Order Radar',
    radarSubtitle: 'Global incoming client orders awaiting vendor acceptance',
    newBroadcastNotif: 'New Broadcast Notification',
    clientOtp: "Client's OTP:",
    landmark: 'Landmark:',
    fullInfoNote: 'Full info will display in Active Orders once confirmed.',
    insertOtpPlaceholder: "Insert client's OTP here to claim *",
    outOfZone: 'Out of Delivery Zone',
    renewToAccept: 'Renew Plan to Accept',
    paidPlanRequired: 'Paid Plan Required',
    awaitingActivation: 'Awaiting Activation',
    confirmOrder: 'Confirm Order',
    radarSilentTitle: 'Radar Search is Silent',
    radarSilentDesc: 'Upgrade your plan to connect with clients and unlock exclusive premium features.',
    // Kanban Active Orders
    kanbanTitle: 'Active Orders Board',
    kanbanSubtitle: 'Progress board for kitchen preparation and dispatch',
    preparingCol: 'Preparing',
    transitCol: 'Transit',
    completedCol: 'Completed',
    noPrepOrders: 'No prep orders',
    noTransitOrders: 'No orders in transit',
    noCompletedToday: 'No completed orders today',
    startPrep: 'Start Prep',
    dispatchRider: 'Dispatch Rider',
    completeHandover: 'Complete Handover',
    verifyDeliveryTitle: 'Verify Delivery Handover',
    verifyDeliveryDesc: "Verify the client's OTP code before final delivery submission.",
    handoverOtpLabel: '4-Digit Handover OTP Code *',
    cancel: 'Cancel',
    confirmHandover: 'Confirm Handover',
    // Plan Activation
    activationTitle: 'Plan Activation & Payment Guide',
    activationSubtitle: 'Manage your active plan status, scan QR codes to purchase new plans, and follow the activation guide.',
    activeSubscription: 'Active Subscription',
    pendingVerification: 'Pending Verification',
    validityPeriod: 'Subscription Validity Period',
    maxClientsAllowed: 'Max Clients Allowed',
    registeredZoneZip: 'Registered Zone Zip',
    registeredClients: 'Registered Clients',
    scanQrTitle: 'Scan QR Codes to Purchase / Upgrade Plan',
    scanQrDesc: 'New vendors registered on Free Tier can scan either QR code below using any UPI App (GPay, PhonePe, Paytm, BHIM) to purchase a plan.',
    primaryQr: 'Primary Payment QR Code 1',
    backupQr: 'Backup Billing QR Code 2',
    stepGuideTitle: 'Step-by-Step Plan Purchase & Activation Guide',
    step1Title: 'Select Your Plan',
    step1Desc: "Choose Starter (₹499) or Premium (₹1,499) in the Plan's tab.",
    step2Title: 'Scan & Pay',
    step2Desc: 'Scan QR Code 1 or QR Code 2 using GPay, PhonePe, Paytm, or BHIM.',
    step3Title: 'Share Payment Screenshot',
    step3Desc: 'Share your payment screenshot to scanned QR whatsapp no, once cross check we will upgrade your plan.',
    step4Title: 'Super Admin Activation',
    step4Desc: 'Super Admin will verify payment and instantly upgrade your kitchen account!',
    // Upgrade Plan
    upgradeTitle: 'Upgrade Subscription Tiers',
    upgradeSubtitle: 'Select plan and increase client-mapping capacities',
    tier: 'Tier',
    validityDays: 'Validity Period',
    days: 'Days',
    maxCategory: 'Max Master Category allowance:',
    maxClients: 'Max Client capacity:',
    currentlySubscribed: 'Currently Subscribed',
    submitUpgradeReq: 'Submit Upgrade Request',
    availableAddons: 'Available Add-ons',
    extendLimitsSubtitle: 'Extend your limits and features',
    addonPackage: 'Add-on Package',
    purchaseAddon: 'Purchase Add-on',
  },
  hi: {
    welcome: 'स्वागत है',
    totalCompletedOrders: 'कुल पूर्ण ऑर्डर',
    totalOverallCompletedDesc: 'अब तक पूर्ण किए गए कुल ऑर्डर',
    connectedClients: 'जुड़े हुए ग्राहक',
    connectedClientsDesc: 'अब तक जुड़े कुल ग्राहक',
    totalOverallEarnings: 'कुल कमाई',
    totalEarnedDesc: 'वेबसाइट से हुई कुल कमाई',
    totalOrdersReceived: 'कुल प्राप्त ऑर्डर',
    lifetimeOrderCount: 'लाइफटाइम ऑर्डर संख्या',
    successfulOrders: 'सफल ऑर्डर',
    noCompletedOrdersYet: 'अभी तक कोई पूर्ण ऑर्डर नहीं है',
    subscriptionHealth: 'सब्सक्रिप्शन स्थिति',
    activePlan: 'सक्रिय प्लान',
    clientsLimitCount: 'ग्राहक सीमा संख्या',
    daysRemaining: 'शेष दिन',
    planExpiredTitle: 'प्लान समाप्त हो गया',
    planExpiredDesc: 'आपका प्लान समाप्त हो गया है। ग्राहक ऑर्डर स्वीकार करना जारी रखने के लिए कृपया नवीनीकृत करें या नया प्लान खरीदें।',
    renewPlanBtn: 'नया प्लान खरीदें / नवीनीकृत करें',
    qaTitle: 'प्रश्नोत्तर / प्लेटफ़ॉर्म सुझाव',
    qaDesc: 'कोई प्रश्न या नई सुविधा का अनुरोध है? इसे सीधे सुपर एडमिन टीम को भेजें।',
    qaPlaceholder: 'अपना सुझाव या प्रश्न यहाँ लिखें...',
    submitToAdmin: 'एडमिन को भेजें',
    yourSubmittedQa: 'आपके द्वारा भेजे गए प्रश्न और सुझाव',
    adminReply: 'एडमिन का उत्तर:',
    clientsUnit: 'ग्राहक',
    until: 'तक',
    statusApproved: 'स्वीकृत',
    statusExpired: 'समाप्त',
    statusPending: 'प्रलंबित',
    // Order Radar
    radarTitle: 'ब्रॉडकास्ट ऑर्डर रडार',
    radarSubtitle: 'विक्रेता स्वीकृति की प्रतीक्षा कर रहे वैश्विक आने वाले ग्राहक ऑर्डर',
    newBroadcastNotif: 'नई ब्रॉडकास्ट अधिसूचना',
    clientOtp: 'ग्राहक ओटीपी:',
    landmark: 'लैंडमार्क:',
    fullInfoNote: 'पुष्टि होने के बाद पूरी जानकारी सक्रिय ऑर्डर में दिखाई देगी।',
    insertOtpPlaceholder: 'दावा करने के लिए ग्राहक ओटीपी दर्ज करें *',
    outOfZone: 'डिलीवरी क्षेत्र से बाहर',
    renewToAccept: 'स्वीकार करने के लिए प्लान नवीनीकृत करें',
    paidPlanRequired: 'पेड प्लान आवश्यक',
    awaitingActivation: 'एक्टिवेशन की प्रतीक्षा है',
    confirmOrder: 'ऑर्डर की पुष्टि करें',
    radarSilentTitle: 'रडार खोज शांत है',
    radarSilentDesc: 'आपकी सदस्यता योजना के लिए वर्तमान में कोई सक्रिय ग्राहक ऑर्डर प्रसारित नहीं हो रहे हैं।',
    // Kanban Active Orders
    kanbanTitle: 'सक्रिय ऑर्डर बोर्ड',
    kanbanSubtitle: 'रसोई की तैयारी और प्रेषण के लिए प्रगति बोर्ड',
    preparingCol: 'तैयार हो रहा है',
    transitCol: 'मार्ग में',
    completedCol: 'पूर्ण हुआ',
    noPrepOrders: 'कोई तैयारी ऑर्डर नहीं',
    noTransitOrders: 'मार्ग में कोई ऑर्डर नहीं',
    noCompletedToday: 'आज कोई पूर्ण ऑर्डर नहीं',
    startPrep: 'तैयारी शुरू करें',
    dispatchRider: 'राइडर भेजें',
    completeHandover: 'हैंडओवर पूरा करें',
    verifyDeliveryTitle: 'डिलीवरी हैंडओवर सत्यापित करें',
    verifyDeliveryDesc: 'अंतिम डिलीवरी सबमिशन से पहले ग्राहक का ओटीपी कोड सत्यापित करें।',
    handoverOtpLabel: '4-अंकीय हैंडओवर ओटीपी कोड *',
    cancel: 'रद्द करें',
    confirmHandover: 'हैंडओवर की पुष्टि करें',
    // Plan Activation
    activationTitle: 'प्लान एक्टिवेशन और भुगतान गाइड',
    activationSubtitle: 'अपनी सक्रिय योजना स्थिति प्रबंधित करें, नई योजनाएँ खरीदने के लिए QR कोड स्कैन करें।',
    activeSubscription: 'सक्रिय सदस्यता',
    pendingVerification: 'सत्यापन प्रलंबित',
    validityPeriod: 'सदस्यता वैधता अवधि',
    maxClientsAllowed: 'अधिकतम अनुमत ग्राहक',
    registeredZoneZip: 'पंजीकृत ज़ोन ज़िप',
    registeredClients: 'पंजीकृत ग्राहक',
    scanQrTitle: 'योजना खरीदने/अपग्रेड करने के लिए QR कोड स्कैन करें',
    scanQrDesc: 'फ्री टियर पर पंजीकृत नए विक्रेता योजना खरीदने के लिए नीचे दिए गए QR कोड को स्कैन कर सकते हैं।',
    primaryQr: 'प्राथमिक भुगतान QR कोड 1',
    backupQr: 'बैकअप बिलिंग QR कोड 2',
    stepGuideTitle: 'चरण-दर-चरण योजना खरीद और सक्रियण गाइड',
    step1Title: 'अपनी योजना चुनें',
    step1Desc: 'योजना टैब में स्टार्टर (₹499) या प्रीमियम (₹1,499) चुनें।',
    step2Title: 'स्कैन करें और भुगतान करें',
    step2Desc: 'GPay, PhonePe, Paytm, या BHIM का उपयोग करके QR कोड स्कैन करें।',
    step3Title: 'भुगतान स्क्रीनशॉट साझा करें',
    step3Desc: 'अपना भुगतान स्क्रीनशॉट व्हाट्सएप नंबर पर साझा करें, सत्यापन के बाद हम आपकी योजना अपग्रेड करेंगे।',
    step4Title: 'सुपर एडमिन एक्टिवेशन',
    step4Desc: 'सुपर एडमिन भुगतान सत्यापित करेगा और तुरंत आपका खाता अपग्रेड करेगा!',
    // Upgrade Plan
    upgradeTitle: 'सदस्यता स्तर अपग्रेड करें',
    upgradeSubtitle: 'योजना चुनें और ग्राहक क्षमता बढ़ाएं',
    tier: 'स्तर',
    validityDays: 'वैधता अवधि',
    days: 'दिन',
    maxCategory: 'अधिकतम मास्टर श्रेणी सीमा:',
    maxClients: 'अधिकतम ग्राहक क्षमता:',
    currentlySubscribed: 'वर्तमान में सब्सक्राइब्ड',
    submitUpgradeReq: 'अपग्रेड अनुरोध भेजें',
    availableAddons: 'उपलब्ध ऐड-ऑन',
    extendLimitsSubtitle: 'अपनी सीमाएं और सुविधाएं बढ़ाएं',
    addonPackage: 'ऐड-ऑन पैकेज',
    purchaseAddon: 'ऐड-ऑन खरीदें',
  },
  mr: {
    welcome: 'सुस्वागतम्',
    totalCompletedOrders: 'एकूण पूर्ण झालेले ऑर्डर्स',
    totalOverallCompletedDesc: 'आत्तापर्यंत पूर्ण केलेले एकूण ऑर्डर्स',
    connectedClients: 'जोडलेले ग्राहक',
    connectedClientsDesc: 'आत्तापर्यंत जोडलेले एकूण ग्राहक',
    totalOverallEarnings: 'एकूण कमाई',
    totalEarnedDesc: 'वेबसाइटवरून झालेली एकूण कमाई',
    totalOrdersReceived: 'एकूण प्राप्त ऑर्डर्स',
    lifetimeOrderCount: 'लाइफटाइम ऑर्डर संख्या',
    successfulOrders: 'यशस्वी ऑर्डर्स',
    noCompletedOrdersYet: 'अद्याप कोणतेही पूर्ण झालेले ऑर्डर्स नाहीत',
    subscriptionHealth: 'सबस्क्रिप्शन आरोग्य',
    activePlan: 'सक्रिय प्लॅन',
    clientsLimitCount: 'ग्राहक मर्यादा संख्या',
    daysRemaining: 'उरलेले दिवस',
    planExpiredTitle: 'प्लॅन मुदत संपली',
    planExpiredDesc: 'तुमचा प्लॅन संपला आहे. ग्राहक ऑर्डर्स स्वीकारणे सुरू ठेवण्यासाठी कृपया नूतनीकरण करा किंवा नवीन प्लॅन खरेदी करा.',
    renewPlanBtn: 'नवीन प्लॅन खरेदी / नूतनीकरण करा',
    qaTitle: 'प्रश्नोत्तर / प्लॅटफॉर्म सूचना',
    qaDesc: 'काही प्रश्न किंवा सूचना आहे? सुपर ॲडमिन टीमकडे थेट पाठवा.',
    qaPlaceholder: 'तुमची सूचना किंवा प्रश्न येथे टाइप करा...',
    submitToAdmin: 'ॲडमिनकडे पाठवा',
    yourSubmittedQa: 'तुमच्या पाठवलेल्या सूचना आणि प्रश्न',
    adminReply: 'ॲडमिन उत्तर:',
    clientsUnit: 'ग्राहक',
    until: 'पर्यंत',
    statusApproved: 'मंजूर',
    statusExpired: 'मुदत संपली',
    statusPending: 'प्रलंबित',
    // Order Radar
    radarTitle: 'ब्रॉडकास्ट ऑर्डर रडार',
    radarSubtitle: 'विक्रेता स्वीकृतीची वाट पाहणारे येणारे ग्राहक ऑर्डर्स',
    newBroadcastNotif: 'नवीन ब्रॉडकास्ट सूचना',
    clientOtp: 'ग्राहकाचा ओटीपी:',
    landmark: 'लँडमार्क:',
    fullInfoNote: 'खात्री झाल्यावर संपूर्ण माहिती सक्रिय ऑर्डरमध्ये दिसेल.',
    insertOtpPlaceholder: 'स्वीकारण्यासाठी ग्राहकाचा ओटीपी प्रविष्ट करा *',
    outOfZone: 'डिलिव्हरी क्षेत्राबाहेर',
    renewToAccept: 'स्वीकारण्यासाठी प्लॅन नूतनीकरण करा',
    paidPlanRequired: 'पेड प्लॅन आवश्यक',
    awaitingActivation: 'ॲक्टिव्हेशनची वाट पाहत आहे',
    confirmOrder: 'ऑर्डरची पुष्टी करा',
    radarSilentTitle: 'रडार शोध शांत आहे',
    radarSilentDesc: 'तुमच्या सबस्क्रिप्शन प्लॅनसाठी सध्या कोणतेही सक्रिय ग्राहक ऑर्डर्स प्रसारित होत नाहीत.',
    // Kanban Active Orders
    kanbanTitle: 'सक्रिय ऑर्डर्स बोर्ड',
    kanbanSubtitle: 'किचन तयारी आणि डिस्पॅचसाठी प्रगती बोर्ड',
    preparingCol: 'तयार होत आहे',
    transitCol: 'मार्गावर',
    completedCol: 'पूर्ण झाले',
    noPrepOrders: 'तयारीचे ऑर्डर्स नाहीत',
    noTransitOrders: 'मार्गावर ऑर्डर्स नाहीत',
    noCompletedToday: 'आज पूर्ण झालेले ऑर्डर्स नाहीत',
    startPrep: 'तयारी सुरू करा',
    dispatchRider: 'रायडर पाठवा',
    completeHandover: 'हँडओव्हर पूर्ण करा',
    verifyDeliveryTitle: 'डिलिव्हरी हँडओव्हर पडताळा',
    verifyDeliveryDesc: 'अंतिम डिलिव्हरी सबमिशनपूर्वी ग्राहकाचा ओटीपी कोड पडताळून पहा.',
    handoverOtpLabel: '४-अंकी हँडओव्हर ओटीपी कोड *',
    cancel: 'रद्द करा',
    confirmHandover: 'हँडओव्हरची पुष्टी करा',
    // Plan Activation
    activationTitle: 'प्लॅन ॲक्टिव्हेशन आणि पेमेंट मार्गदर्शक',
    activationSubtitle: 'तुमची सक्रिय प्लॅन स्थिती व्यवस्थापित करा, नवीन प्लॅन खरेदी करण्यासाठी QR कोड स्कॅन करा.',
    activeSubscription: 'सक्रिय सबस्क्रिप्शन',
    pendingVerification: 'पडताळणी प्रलंबित',
    validityPeriod: 'सबस्क्रिप्शन मुदत कालावधी',
    maxClientsAllowed: 'कमाल अनुमत ग्राहक',
    registeredZoneZip: 'नोंदणीकृत झोन पिनकोड',
    registeredClients: 'नोंदणीकृत ग्राहक',
    scanQrTitle: 'प्लॅन खरेदी/अपग्रेड करण्यासाठी QR कोड स्कॅन करा',
    scanQrDesc: 'नवीन विक्रेते प्लॅन खरेदी करण्यासाठी खालीलपैकी कोणताही QR कोड स्कॅन करू शकतात.',
    primaryQr: 'प्राथमिक पेमेंट QR कोड १',
    backupQr: 'बॅकअप बिलिंग QR कोड २',
    stepGuideTitle: 'टप्प्याटप्प्याने प्लॅन खरेदी आणि ॲक्टिव्हेशन मार्गदर्शक',
    step1Title: 'तुमचा प्लॅन निवडा',
    step1Desc: 'प्लॅन्स टॅबमध्ये स्टार्टर (₹४९९) किंवा प्रीमियम (₹१,४९९) निवडा.',
    step2Title: 'स्कॅन करा आणि पे करा',
    step2Desc: 'GPay, PhonePe, Paytm, किंवा BHIM वापरून QR कोड स्कॅन करा.',
    step3Title: 'पेमेंट स्क्रीनशॉट शेअर करा',
    step3Desc: 'तुमचा पेमेंट स्क्रीनशॉट व्हॉट्सॲप नंबरवर शेअर करा, पडताळणीनंतर आम्ही तुमचा प्लॅन अपग्रेड करू.',
    step4Title: 'सुपर ॲडमिन ॲक्टिव्हेशन',
    step4Desc: 'सुपर ॲडमिन पेमेंट पडताळेल आणि तुमचे खाते लगेच अपग्रेड करेल!',
    // Upgrade Plan
    upgradeTitle: 'सबस्क्रिप्शन टियर्स अपग्रेड करा',
    upgradeSubtitle: 'प्लॅन निवडा आणि ग्राहक क्षमता वाढवा',
    tier: 'टियर',
    validityDays: 'मुदत कालावधी',
    days: 'दिवस',
    maxCategory: 'कमाल मास्टर कॅटेगरी मर्यादा:',
    maxClients: 'कमाल ग्राहक क्षमता:',
    currentlySubscribed: 'सध्या सबस्क्राईब केलेले',
    submitUpgradeReq: 'अपग्रेड विनंती पाठवा',
    availableAddons: 'उपलब्ध ॲड-ऑन्स',
    extendLimitsSubtitle: 'तुमच्या मर्यादा आणि वैशिष्ट्ये वाढवा',
    addonPackage: 'ॲड-ऑन पॅकेज',
    purchaseAddon: 'ॲड-ऑन खरेदी करा',
  }
};

function VendorDashboard({ vendor, onTab }: { vendor: VendorType; onTab?: (t: Tab) => void }) {
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

  const t = vTrans[lang];
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<VendorItem[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionText, setSuggestionText] = useState('');
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [loading, setLoading] = useState(true);

  const todayIso = new Date().toISOString().slice(0, 10);
  const isDateExpired = vendor.subscription_end ? vendor.subscription_end < todayIso : false;
  const isPlanExpired = vendor.status === 'expired' || isDateExpired;

  const loadSuggestions = async () => {
    try {
      const vId = vendor.id || (vendor as any)._id || '';
      const res = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'vendor_suggestions', action: 'select', filters: vId ? { vendor_id: vId } : {} })
      });
      const d = await res.json();
      setSuggestions(d.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    (async () => {
      try {
        const vId = vendor.id || (vendor as any)._id || '';
        const [oRes, iRes] = await Promise.all([
          fetch('/api/db', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'orders', action: 'select', filters: vId ? { vendor_id: vId } : {} })
          }).then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/db', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'vendor_inventory', action: 'select', filters: vId ? { vendor_id: vId } : {} })
          }).then(r => r.json()).catch(() => ({ data: [] })),
        ]);
        setOrders(oRes?.data || []);
        setItems(iRes?.data || []);
        await loadSuggestions();
      } catch (e) {
        console.error('Error loading vendor dashboard metrics:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [vendor]);

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim()) return;
    setSubmittingSuggestion(true);
    try {
      await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vendor_suggestions',
          action: 'insert',
          data: {
            vendor_id: vendor.id,
            shop_name: vendor.shop_name,
            owner_name: vendor.owner_name,
            phone: vendor.phone,
            message: suggestionText.trim(),
            status: 'Pending',
            admin_reply: '',
            created_at: new Date().toISOString()
          }
        })
      });
      setSuggestionText('');
      await loadSuggestions();
      alert('Q&A / Suggestion submitted to Super Admin successfully!');
    } catch (e) {
      alert('Failed to submit suggestion.');
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  if (loading) return <Spinner />;

  // Calculate exact vendor-specific stats (isolated strictly for this logged-in vendor)
  const vendorCompletedOrders = orders.filter(o => o.status === 'delivered');
  const totalVendorEarnings = vendorCompletedOrders.reduce((s, o) => s + (Number(o.price) || 0), 0);
  
  // Unique clients connected by this specific vendor through website orders
  const uniqueClientsCount = new Set(
    orders
      .map(o => (o.client_phone || o.client_name || '').trim())
      .filter(Boolean)
  ).size;

  const kpis = [
    { label: t.totalCompletedOrders, value: vendorCompletedOrders.length, desc: t.totalOverallCompletedDesc, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: t.connectedClients, value: uniqueClientsCount, desc: t.connectedClientsDesc, icon: Users, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: t.totalOverallEarnings, value: `₹${totalVendorEarnings.toLocaleString()}`, desc: t.totalEarnedDesc, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: t.totalOrdersReceived, value: orders.length, desc: t.lifetimeOrderCount, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.welcome}, {vendor.owner_name}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 stagger">
        {kpis.map((k) => (
          <SpotlightCard key={k.label} className="card p-6 bg-surface border border-border hover-lift">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.bg} ${k.color}`}>
              <k.icon size={20} />
            </div>
            <p className="text-3xl font-extrabold mt-4 text-text">{k.value}</p>
            <p className="text-sm text-text font-bold mt-1">{k.label}</p>
            <p className="text-xs text-muted mt-0.5">{k.desc}</p>
          </SpotlightCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent orders */}
        <div className="lg:col-span-2 card p-6 bg-surface border border-border">
          <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted">{t.successfulOrders}</h3>
          {vendorCompletedOrders.length === 0 ? (
            <EmptyState icon={<ShoppingBag size={24} />} title={t.noCompletedOrdersYet} />
          ) : (
            <div className="space-y-3">
              {vendorCompletedOrders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border border-border hover:border-accent/25 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center text-green-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">{o.item_name}</p>
                      <p className="text-[10px] text-muted">{o.client_name} · #{(o.id || o._id || 'ORD12345').toString().slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-accent">₹{o.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscription Progress Alert */}
        <div className="lg:col-span-1 card p-6 bg-surface border border-border">
          <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted">{t.subscriptionHealth}</h3>
          <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase font-bold">{t.activePlan}</p>
                <p className="text-xl font-extrabold text-accent">{vendor.plan_name || 'Free'}</p>
              </div>
              <Badge variant={isPlanExpired ? 'error' : vendor.status === 'approved' ? 'success' : 'warning'}>
                {isPlanExpired ? t.statusExpired : vendor.status === 'approved' ? t.statusApproved : t.statusPending}
              </Badge>
            </div>
            
            <div className="text-xs text-muted space-y-1 pt-3 border-t border-border/50">
              <div className="flex justify-between"><span>{t.clientsLimitCount}</span><span className="font-semibold text-text">{vendor.total_clients} {t.clientsUnit}</span></div>
              <div className="flex justify-between"><span>{t.daysRemaining}</span><span className="font-semibold text-text">{t.until}: {vendor.subscription_end || '—'}</span></div>
            </div>
            
            {isPlanExpired && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-xs space-y-2.5">
                <p className="font-bold flex items-center gap-1.5 text-red-600 text-xs uppercase tracking-wider">
                  <AlertCircle size={14} /> {t.planExpiredTitle}
                </p>
                <p className="text-xs text-red-600/90 leading-relaxed font-medium">
                  {t.planExpiredDesc}
                </p>
                {onTab && (
                  <Button 
                    size="sm" 
                    className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 shadow-sm"
                    onClick={() => onTab('upgrade')}
                  >
                    {t.renewPlanBtn}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support & Suggestions */}
      <div className="card p-6 bg-surface border border-border">
        <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted flex items-center gap-2">
          <AlertCircle size={16} /> {t.qaTitle}
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-muted">{t.qaDesc}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-border outline-none focus:border-accent text-sm text-text placeholder:text-muted"
              placeholder={t.qaPlaceholder}
            />
            <Button onClick={handleSendSuggestion} disabled={submittingSuggestion || !suggestionText.trim()}>
              {submittingSuggestion ? <Spinner /> : t.submitToAdmin}
            </Button>
          </div>

          {/* List of submitted Q&As / Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{t.yourSubmittedQa} ({suggestions.length})</p>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {suggestions.map((s: any) => (
                  <div key={s._id || s.id} className="p-3.5 rounded-xl bg-surface-2/60 border border-border/60 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-semibold text-text">{s.message}</p>
                      <Badge variant={s.status === 'Responded' || s.status === 'Resolved' ? 'success' : 'warning'}>
                        {s.status || 'Pending'}
                      </Badge>
                    </div>
                    {s.admin_reply && (
                      <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-text">
                        <p className="font-bold text-accent mb-0.5">{t.adminReply}</p>
                        <p className="text-xs">{s.admin_reply}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-muted">{new Date(s.created_at || Date.now()).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. Order Radar Module Tab
interface OrderRadarProps {
  vendor: VendorType;
  activePlan: Plan | null;
  radarOrders: Order[];
  onTab: (tab: Tab) => void;
  show: (m: string, t?: 'success' | 'error' | 'info') => void;
}

function OrderRadar({ vendor, activePlan, radarOrders, onTab, show }: OrderRadarProps) {
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

  const t = vTrans[lang];
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  // Clean timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((_prev) => {
        const next: Record<string, number> = {};
        radarOrders.forEach((o) => {
          const orderId = o.id || (o as any)._id || '';
          const elapsedMs = Date.now() - new Date(o.created_at).getTime();
          const remainingSecs = Math.max(0, 32400 - Math.floor(elapsedMs / 1000)); // 9 hours limit (32400 seconds)
          if (orderId) next[orderId] = remainingSecs;
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [radarOrders]);

  const acceptOrder = async (order: Order, otpAttempt: string) => {
    if (vendor.status === 'expired') {
      onTab('upgrade');
      return;
    }
    if (!otpAttempt) {
      show('Please enter the client OTP to confirm', 'error');
      return;
    }
    if (otpAttempt !== order.otp) {
      show('Invalid OTP. Order claim failed.', 'error');
      return;
    }

    const orderId = order.id || (order as any)._id || '';
    const vendorId = vendor.id || (vendor as any)._id || '';

    const res = await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'orders',
        action: 'update',
        filters: { _id: orderId },
        data: {
          vendor_id: vendorId,
          status: 'accepted',
          otp_attempt: otpAttempt,
          accepted_at: new Date().toISOString()
        }
      })
    });
    const d = await res.json();

    if (d.error) {
      show(d.error || 'Failed to confirm order', 'error');
      return;
    }

    show('Order confirmed and frozen successfully!');
    onTab('kanban'); // Move to Kanban board
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title={t.radarTitle} 
        subtitle={t.radarSubtitle}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {radarOrders.filter(o => o.master_category_name === (activePlan?.master_category_name || vendor.plan_name)).map((o) => {
          const orderId = o.id || (o as any)._id || '';
          const isZipMatch = o.client_zip?.substring(0, 3) === vendor.zip_code?.substring(0, 3);
          const isActive = vendor.status === 'approved';
          const isExpired = vendor.status === 'expired';
          const remaining = timers[orderId] ?? 60;
          
          const mins = Math.floor(remaining / 60);
          const secs = remaining % 60;
          const formattedTimer = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          // Button classes evaluation based on specifications
          let btnLabel = t.confirmOrder;
          let disabled = false;
          let showRenew = false;

          if (!isZipMatch) {
            btnLabel = t.outOfZone;
            disabled = true;
          } else if (isExpired) {
            btnLabel = t.renewToAccept;
            showRenew = true;
          } else if (vendor.plan_name === 'Free' || !vendor.plan_name) {
            btnLabel = t.paidPlanRequired;
            disabled = true;
          } else if (!isActive) {
            btnLabel = t.awaitingActivation;
            disabled = true;
          }

          return (
            <div 
              key={orderId} 
              className={`card p-6 border transition-all flex flex-col justify-between ${
                !isZipMatch 
                  ? 'bg-surface-2/40 border-border text-muted/65 shadow-inner' 
                  : 'bg-surface border-accent/20 shadow-md ring-2 ring-accent/5 scale-[1.02]'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-base text-text">{o.item_name}</h3>
                    <p className="text-[10px] text-muted">Proximity: {o.distance_km || '0.8'} km away</p>
                  </div>
                  {/* Timer Display */}
                  <Badge variant={remaining < 120 ? 'error' : 'warning'}>
                    <Clock size={12} /> {formattedTimer}
                  </Badge>
                </div>

                <div className="my-4 space-y-2 text-xs text-muted">
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1.5">
                    <p className="text-amber-900 font-extrabold text-sm mb-1 flex items-center gap-1.5 border-b border-amber-200/60 pb-1">
                      <span>📢</span> {t.newBroadcastNotif}
                    </p>
                    <p className="text-amber-900 font-bold">
                      🔑 {t.clientOtp} <span className="font-black text-amber-950 text-sm tracking-wider px-1.5 py-0.5 bg-amber-100 rounded border border-amber-300">{o.otp}</span>
                    </p>
                    {o.client_landmark && (
                      <p className="text-amber-800 font-medium">
                        📍 {t.landmark} <span className="font-bold text-amber-950">{o.client_landmark}</span>
                      </p>
                    )}
                    {/* Order Category and Order Summary Items below Landmark */}
                    <div className="mt-2 p-2 bg-amber-100/80 rounded-lg border border-amber-300/80 text-amber-950 space-y-1">
                      <p className="text-xs font-bold text-amber-900">
                        🏷️ <span className="font-semibold">{t.orderCategory || 'Category'}:</span> <span className="font-extrabold text-amber-950">{getItemTranslation(o.master_category_name || '', lang) || o.master_category_name || 'General'}</span>
                      </p>
                      <p className="text-xs font-extrabold text-amber-900 flex items-start gap-1">
                        <span>📦</span>
                        <span>
                          <span className="font-bold">{t.orderItemsSummary || 'Order Items & Quantity'}:</span>{' '}
                          <span className="font-black text-amber-950 text-sm">{getItemTranslation(o.item_name || '', lang)}</span>
                        </span>
                      </p>
                    </div>
                    <p className="text-[10px] text-amber-700/80 mt-1 italic">{t.fullInfoNote}</p>
                  </div>
                  
                  {isZipMatch && isActive && (
                    <div className="pt-3">
                      <input
                        type="text"
                        placeholder={t.insertOtpPlaceholder}
                        value={otpInputs[o.id] || ''}
                        onChange={(e) => setOtpInputs({ ...otpInputs, [o.id]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-surface-2 border-2 border-border text-text placeholder:text-muted/60 focus:border-accent outline-none text-sm font-bold shadow-sm transition-all text-center tracking-widest"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                {showRenew ? (
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold" 
                    onClick={() => onTab('upgrade')}
                  >
                    Renew Plan to Accept
                  </Button>
                ) : (
                  <div className="relative group/tooltip">
                    <Button 
                      className={`w-full font-bold flex items-center justify-center gap-1.5 ${
                        !isZipMatch 
                          ? 'bg-muted/30 border border-border text-muted pointer-events-none' 
                          : 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md'
                      }`}
                      onClick={() => acceptOrder(o, otpInputs[o.id] || '')}
                      disabled={disabled || (isZipMatch && !(otpInputs[o.id]?.trim()))}
                    >
                      {!isZipMatch && <Padlock size={14} />}
                      {btnLabel}
                    </Button>
                    
                    {/* Hover tooltip for disabled buttons */}
                    {disabled && !isZipMatch && (
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-text text-bg text-[10px] rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none text-center shadow-lg font-semibold">
                        This kitchen is registered in zip zone {vendor.zip_code}. Order belongs to zip {o.client_zip}.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {radarOrders.filter(o => o.master_category_name === (activePlan?.master_category_name || vendor.plan_name)).length === 0 && (
          <div className="col-span-full">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/15 to-amber-500/15 border-2 border-amber-500/40 text-center shadow-xl animate-fade-in my-4 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white mx-auto flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30 animate-pulse">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight max-w-2xl mx-auto leading-snug">
                  Upgrade your plan to connect with clients and unlock exclusive premium features.
                </h3>
                <p className="text-sm font-bold text-amber-800 mt-3 max-w-lg mx-auto">
                  Start receiving live order broadcasts directly from nearby clients on your vendor radar.
                </p>
                <button
                  onClick={() => onTab('subscription')}
                  className="mt-6 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white font-black text-sm transition-all shadow-xl shadow-amber-500/30 inline-flex items-center gap-2.5 cursor-pointer"
                >
                  <Sparkles size={18} /> Upgrade Subscription Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Kanban Active Orders Board
function VendorKanban({ vendor, show }: { vendor: VendorType; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
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

  const t = vTrans[lang];
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [otpVal, setOtpVal] = useState('');

  const load = async () => {
    try {
      const vId = vendor.id || (vendor as any)._id || '';
      const res = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders', action: 'select', filters: vId ? { vendor_id: vId } : {},
          sorts: [{ field: 'created_at', ascending: false }]
        })
      });
      const d = await res.json();
      setOrders(d.data || []);
    } catch (e) {
      console.error('Failed to load active orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [vendor]);

  const transitionOrder = async (orderId: string, nextStatus: string) => {
    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'orders', action: 'update', filters: { _id: orderId }, data: { status: nextStatus }
      })
    });
    show(`Order shifted to ${nextStatus.replace(/_/g, ' ')}`);
    load();
  };

  const handleDeliverClick = (o: Order) => {
    setSelectedOrder(o);
    setOtpVal('');
  };

  const verifyOTPAndDeliver = async () => {
    if (!selectedOrder) return;
    if (otpVal !== selectedOrder.otp) {
      alert('OTP code does not match. Please verify with client.');
      return;
    }

    const oId = selectedOrder.id || (selectedOrder as any)._id || '';

    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'orders', action: 'update', filters: { _id: oId },
        data: { status: 'delivered', delivered_at: new Date().toISOString() }
      })
    });

    show('Order delivered successfully! Payment processed.');
    setSelectedOrder(null);
    load();
  };

  if (loading) return <Spinner />;

  // Group orders by active stages
  const preparing = orders.filter(o => o.status === 'accepted' || o.status === 'preparing');
  const outForDelivery = orders.filter(o => o.status === 'out_for_delivery');
  const delivered = orders.filter(o => o.status === 'delivered');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t.kanbanTitle} subtitle={t.kanbanSubtitle} />

      {/* Kanban Board columns */}
      <div className="grid md:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Preparing */}
        <div className="card bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Clock size={16} className="text-amber-500" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wider">{t.preparingCol}</h3>
            <Badge variant="warning">{preparing.length}</Badge>
          </div>
          <div className="space-y-3 min-h-[300px]">
            {preparing.map(o => {
              const oId = o.id || (o as any)._id || '';
              return (
                <div key={oId} className="p-4 rounded-xl bg-surface-2 border border-border space-y-3 shadow-sm hover:border-accent/30 transition-all">
                  <div>
                    <p className="font-bold text-base text-text">{getItemTranslation(o.item_name || '', lang)}</p>
                    <div className="mt-2 p-2.5 rounded-lg bg-surface border border-border/50 space-y-1 text-xs text-text">
                      <p><span className="text-muted font-medium">{t.fullName || 'Name'}:</span> <span className="font-bold">{o.client_name || 'N/A'}</span></p>
                      <p><span className="text-muted font-medium">{t.phone || 'Phone'}:</span> <span className="font-bold text-accent">{o.client_phone || 'N/A'}</span></p>
                      <p><span className="text-muted font-medium">{t.fullAddress || 'Address'}:</span> {o.client_address || 'N/A'}</p>
                      <p><span className="text-muted font-medium">{t.pinCode || 'PIN Code'}:</span> {o.client_zip || 'N/A'}</p>
                      {o.client_landmark && <p><span className="text-muted font-medium">{t.landmark || 'Landmark'}:</span> {o.client_landmark}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {o.status === 'accepted' ? (
                      <Button size="sm" className="w-full" onClick={() => transitionOrder(oId, 'preparing')}>
                        {t.startPrep}
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full bg-accent" onClick={() => transitionOrder(oId, 'out_for_delivery')}>
                        {t.dispatchRider}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {preparing.length === 0 && <p className="text-xs text-muted italic text-center py-8">{t.noPrepOrders}</p>}
          </div>
        </div>

        {/* Column 2: Out for Delivery */}
        <div className="card bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Navigation size={16} className="text-blue-500" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wider">{t.transitCol}</h3>
            <Badge variant="accent">{outForDelivery.length}</Badge>
          </div>
          <div className="space-y-3 min-h-[300px]">
            {outForDelivery.map(o => {
              const oId = o.id || (o as any)._id || '';
              return (
                <div key={oId} className="p-4 rounded-xl bg-surface-2 border border-border space-y-3 shadow-sm hover:border-accent/30 transition-all">
                  <div>
                    <p className="font-bold text-base text-text">{getItemTranslation(o.item_name || '', lang)}</p>
                    <div className="mt-2 p-2.5 rounded-lg bg-surface border border-border/50 space-y-1 text-xs text-text">
                      <p><span className="text-muted font-medium">{t.fullName || 'Name'}:</span> <span className="font-bold">{o.client_name || 'N/A'}</span></p>
                      <p><span className="text-muted font-medium">{t.phone || 'Phone'}:</span> <span className="font-bold text-accent">{o.client_phone || 'N/A'}</span></p>
                      <p><span className="text-muted font-medium">{t.fullAddress || 'Address'}:</span> {o.client_address || 'N/A'}</p>
                      <p><span className="text-muted font-medium">{t.pinCode || 'PIN Code'}:</span> {o.client_zip || 'N/A'}</p>
                      {o.client_landmark && <p><span className="text-muted font-medium">{t.landmark || 'Landmark'}:</span> {o.client_landmark}</p>}
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-green-600 border-green-600 hover:bg-green-700 text-white" onClick={() => transitionOrder(oId, 'delivered')}>
                    {t.completeHandover}
                  </Button>
                </div>
              );
            })}
            {outForDelivery.length === 0 && <p className="text-xs text-muted italic text-center py-8">{t.noTransitOrders}</p>}
          </div>
        </div>

        {/* Column 3: Delivered */}
        <div className="card bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <CheckCircle2 size={16} className="text-green-500" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wider">{t.completedCol}</h3>
            <Badge variant="success">{delivered.length}</Badge>
          </div>
          <div className="space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto pr-1">
            {delivered.map((o) => {
              const oId = o.id || (o as any)._id || Math.random().toString();
              return (
                <div key={oId} className="p-3.5 rounded-xl bg-surface-2/50 border border-border/60 space-y-1 text-xs">
                  <p className="font-bold text-sm text-text">{getItemTranslation(o.item_name || '', lang)}</p>
                  <div className="text-xs text-muted space-y-0.5 pt-1 border-t border-border/30">
                    <p><span className="font-medium">{t.fullName || 'Name'}:</span> <span className="font-bold text-text">{o.client_name || 'N/A'}</span></p>
                    <p><span className="font-medium">{t.phone || 'Phone'}:</span> {o.client_phone || 'N/A'}</p>
                    <p><span className="font-medium">{t.fullAddress || 'Address'}:</span> {o.client_address || 'N/A'}</p>
                    <p><span className="font-medium">{t.pinCode || 'PIN Code'}:</span> {o.client_zip || 'N/A'}</p>
                    {o.client_landmark && <p><span className="font-medium">{t.landmark || 'Landmark'}:</span> {o.client_landmark}</p>}
                  </div>
                </div>
              );
            })}
            {delivered.length === 0 && <p className="text-xs text-muted italic text-center py-8">{t.noCompletedToday}</p>}
          </div>
        </div>

      </div>

      {/* OTP Handover Verification Modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={t.verifyDeliveryTitle}>
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-muted">{t.verifyDeliveryDesc}</p>
            <Input 
              label={t.handoverOtpLabel} 
              value={otpVal} 
              onChange={setOtpVal} 
              placeholder="e.g. 1234"
              required 
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>{t.cancel}</Button>
              <Button onClick={verifyOTPAndDeliver} disabled={!otpVal}>{t.confirmHandover}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// 4. Upgrade Plan tab
function UpgradePlan({ vendor, show }: { vendor: VendorType; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
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

  const t = vTrans[lang];
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: pData }, { data: aData }] = await Promise.all([
        supabase.from('subscription_plans').select('*').eq('status', 'active'),
        supabase.from('addons').select('*')
      ]);
      setPlans(pData || []);
      setAddons(aData || []);
      setLoading(false);
    })();
  }, []);

  const requestUpgrade = async (planName: string, isAddon = false) => {
    setSubmitting(true);
    const vId = vendor.id || (vendor as any)._id || '';
    await supabase.from('upgrade_requests').insert({
      vendor_id: vId,
      vendor_name: vendor.shop_name,
      current_plan: vendor.plan_name || 'Free',
      requested_plan: planName,
      payment_status: 'Pending',
      status: 'pending'
    });

    await supabase.from('activity_log').insert({
      action: `Upgrade request submitted by ${vendor.shop_name} for ${planName} plan`,
      actor: 'Vendor'
    });

    show('Upgrade request submitted to Super Admin');
    setSubmitting(false);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t.upgradeTitle} subtitle={t.upgradeSubtitle} />

      <div className="grid md:grid-cols-3 gap-6 stagger">
        {plans.map((p) => {
          const isCurrent = vendor.plan_name === p.name;
          return (
            <div key={p.name} className={`card p-6 bg-surface border flex flex-col justify-between hover-lift ${isCurrent ? 'border-accent ring-2 ring-accent/10' : 'border-border'}`}>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted uppercase tracking-wide">{p.name} {t.tier}</span>
                  {isCurrent && <Badge variant="success">{t.activePlan}</Badge>}
                </div>
                
                <p className="text-4xl font-extrabold text-text mt-4">₹{p.price.toLocaleString()}</p>
                <p className="text-xs text-muted mt-1">{t.validityDays}: {p.validity_days} {t.days}</p>

                <div className="border-t border-border/50 my-4" />

                <ul className="text-xs space-y-2 text-muted font-medium">
                  <li>• {t.maxCategory} <span className="font-bold text-text">{p.max_items}</span></li>
                  <li>• {t.maxClients} <span className="font-bold text-text">{p.max_clients} {t.clientsUnit}</span></li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40">
                <Button 
                  className="w-full" 
                  disabled={isCurrent || submitting}
                  onClick={() => requestUpgrade(p.name)}
                >
                  {isCurrent ? t.currentlySubscribed : t.submitUpgradeReq}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {addons.length > 0 && (
        <div className="mt-12 animate-fade-in-up">
          <PageHeader title={t.availableAddons} subtitle={t.extendLimitsSubtitle} />
          <div className="grid md:grid-cols-3 gap-6 stagger mt-6">
            {addons.map((a) => (
              <div key={a.id} className="card p-6 bg-surface border border-border flex flex-col justify-between hover-lift">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted uppercase tracking-wide">{t.addonPackage}</span>
                  </div>
                  
                  <p className="text-2xl font-extrabold text-text mt-4">{a.name}</p>
                  <p className="text-3xl font-extrabold text-accent mt-2">₹{a.price.toLocaleString()}</p>
                  <p className="text-xs text-muted mt-1">{t.validityDays}: +{a.validity_days} {t.days}</p>

                  <div className="border-t border-border/50 my-4" />

                  <ul className="text-xs space-y-2 text-muted font-medium">
                    <li>• {t.maxClients} <span className="font-bold text-text">+{a.max_clients}</span></li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40">
                  <Button 
                    className="w-full" 
                    disabled={submitting}
                    onClick={() => requestUpgrade(a.name, true)}
                  >
                    {t.purchaseAddon}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 5. Plan Activation Module Tab (Placed in between Active Orders and Plan's)
function PlanActivation({ vendor, activePlan, onTab }: { vendor: VendorType; activePlan: Plan | null; onTab: (t: Tab) => void }) {
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

  const t = vTrans[lang];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title={t.activationTitle} 
        subtitle={t.activationSubtitle} 
      />

      {/* ── Active Subscription Status Card ── */}
      <div className="card p-6 bg-surface border border-border shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-extrabold text-text">{vendor.plan_name || 'Free Tier'}</h3>
              <Badge variant={vendor.status === 'approved' ? 'success' : vendor.status === 'expired' ? 'error' : 'warning'}>
                {vendor.status === 'approved' ? t.activeSubscription : vendor.status === 'expired' ? t.planExpiredTitle : t.pendingVerification}
              </Badge>
            </div>
            <p className="text-xs text-muted mt-1">Shop: <strong className="text-text">{vendor.shop_name}</strong> | Owner: <strong className="text-text">{vendor.owner_name}</strong></p>
          </div>
          {vendor.subscription_end && (
            <div className="text-left md:text-right">
              <p className="text-xs text-muted font-medium">{t.validityPeriod}</p>
              <p className="text-sm font-bold text-accent mt-0.5">
                {vendor.subscription_start || 'N/A'} — {vendor.subscription_end}
              </p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/60">
          <div className="p-4 rounded-xl bg-surface-2 border border-border/50">
            <p className="text-xs text-muted font-medium">Activation Status</p>
            <p className="text-lg font-bold text-accent capitalize mt-1">{vendor.status === 'approved' ? t.statusApproved : vendor.status === 'expired' ? t.statusExpired : t.statusPending}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-2 border border-border/50">
            <p className="text-xs text-muted font-medium">{t.maxClientsAllowed}</p>
            <p className="text-lg font-bold text-text mt-1">{vendor.total_clients || 0} {t.registeredClients}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-2 border border-border/50">
            <p className="text-xs text-muted font-medium">{t.registeredZoneZip}</p>
            <p className="text-lg font-bold text-text mt-1">Zone {vendor.zip_code}</p>
          </div>
        </div>
      </div>

      {/* ── QR Code Payment Section ── */}
      <div className="card p-6 bg-surface border border-border space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-text flex items-center gap-2">
            <CreditCard size={20} className="text-accent" /> {t.scanQrTitle}
          </h3>
          <p className="text-xs text-muted mt-1">
            {t.scanQrDesc}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code 1 Card */}
          <div className="p-6 rounded-2xl bg-surface-2 border border-border flex flex-col items-center text-center space-y-4 hover:border-accent/40 transition-colors">
            <Badge variant="accent">{t.primaryQr}</Badge>
            <div className="w-52 h-64 bg-white p-2 rounded-2xl border-2 border-accent/20 shadow-md flex flex-col items-center justify-center overflow-hidden">
              <img 
                src="/qr1.png" 
                alt="Payment QR Code 1 - Pratibha satere" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-extrabold text-base text-text">Pratibha satere</p>
              <p className="text-sm font-bold text-accent mt-0.5">9689784930</p>
            </div>
          </div>

          {/* QR Code 2 Card */}
          <div className="p-6 rounded-2xl bg-surface-2 border border-border flex flex-col items-center text-center space-y-4 hover:border-accent/40 transition-colors">
            <Badge variant="success">{t.backupQr}</Badge>
            <div className="w-52 h-64 bg-white p-2 rounded-2xl border-2 border-green-500/20 shadow-md flex flex-col items-center justify-center overflow-hidden">
              <img 
                src="/qr2.png" 
                alt="Payment QR Code 2 - Sonam Hinge" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-extrabold text-base text-text">Sonam Hinge</p>
              <p className="text-sm font-bold text-green-600 mt-0.5">9309362008</p>
            </div>
          </div>
        </div>

        {/* ── Step-by-Step Purchase Guide ── */}
        <div className="p-5 rounded-2xl bg-surface-2/60 border border-border/80 space-y-3">
          <p className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
            <AlertCircle size={14} className="text-accent" /> {t.stepGuideTitle}
          </p>
          <div className="grid sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface border border-border/50 space-y-1">
              <span className="w-6 h-6 rounded-full bg-accent text-white font-extrabold flex items-center justify-center text-xs">1</span>
              <p className="font-bold text-text pt-1">{t.step1Title}</p>
              <p className="text-[11px] text-muted">{t.step1Desc}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border/50 space-y-1">
              <span className="w-6 h-6 rounded-full bg-accent text-white font-extrabold flex items-center justify-center text-xs">2</span>
              <p className="font-bold text-text pt-1">{t.step2Title}</p>
              <p className="text-[11px] text-muted">{t.step2Desc}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border/50 space-y-1">
              <span className="w-6 h-6 rounded-full bg-accent text-white font-extrabold flex items-center justify-center text-xs">3</span>
              <p className="font-bold text-text pt-1">{t.step3Title}</p>
              <p className="text-[11px] text-muted">{t.step3Desc}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border/50 space-y-1">
              <span className="w-6 h-6 rounded-full bg-accent text-white font-extrabold flex items-center justify-center text-xs">4</span>
              <p className="font-bold text-text pt-1">{t.step4Title}</p>
              <p className="text-[11px] text-muted">{t.step4Desc}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button onClick={() => onTab('upgrade')}>
              Browse Plans & Submit Upgrade Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
