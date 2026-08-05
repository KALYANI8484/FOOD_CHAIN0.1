import { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, CreditCard, Radar, Trash2,
  DollarSign, Clock, CheckCircle2, AlertCircle, Store, Lock as Padlock,
  Navigation, AlertTriangle, Upload, Menu, X, Sparkles, MessageSquare,
  MessageCircle, Phone
} from 'lucide-react';
import { io } from 'socket.io-client';
import { supabase, type Vendor as VendorType, type VendorItem, type Order, type Plan, type MasterItem } from '../lib/supabase';
import { Button, Badge, Modal, Input, Select, useToast, Toast, Spinner, EmptyState, SpotlightCard, LanguageSelector, useSyncedLanguage, type Language } from './ui';
import { getItemTranslation } from './Landing';
import { AntigravitySuccessModal } from './AntigravitySuccessModal';

// Shared WhatsApp/call link builders for vendor-to-client contact (claim popup + Kanban cards)
function buildClientWhatsAppMessage(clientName: string, shopName: string, itemName: string, extra?: string) {
  const base = `Hello ${clientName}, this is ${shopName} regarding your order for ${itemName}.`;
  return extra ? `${base} ${extra}` : base;
}
function buildClientWhatsAppLink(clientPhone: string, message: string) {
  const cleanPhone = (clientPhone || '').replace(/\D/g, '');
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
}
function buildClientTelLink(clientPhone: string) {
  const cleanPhone = (clientPhone || '').replace(/\D/g, '');
  return `tel:+91${cleanPhone}`;
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

type Tab = 'dashboard' | 'menu' | 'radar' | 'kanban' | 'activation' | 'upgrade';

export function Vendor({ onExit, vendorPhone }: { onExit: () => void; vendorPhone?: string }) {
  const [lang] = useSyncedLanguage();
  const t = vTrans[lang];

  const [tab, setTabState] = useState<Tab>('dashboard');

  const setTab = (newTab: Tab, isPop = false) => {
    setTabState(newTab);
    if (!isPop) {
      window.history.pushState({ vendorTab: newTab, appScreen: 'vendor' }, '', `#vendor/${newTab}`);
    }
  };

  useEffect(() => {
    window.history.replaceState({ vendorTab: 'dashboard', appScreen: 'vendor', cred: vendorPhone }, '', '#vendor/dashboard');

    const handleVendorPopState = (e: PopStateEvent) => {
      if (e.state && e.state.vendorTab) {
        setTabState(e.state.vendorTab);
      }
    };

    window.addEventListener('popstate', handleVendorPopState);
    return () => window.removeEventListener('popstate', handleVendorPopState);
  }, []);

  const [vendor, setVendor] = useState<VendorType | null>(null);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast, show } = useToast();
  
  // Sockets & Live broadcast radar list
  const [radarOrders, setRadarOrders] = useState<Order[]>([]);
  const socketRef = useRef<any>(null);
  const [approvalPopup, setApprovalPopup] = useState<{ planName: string; subscriptionEnd?: string | null; maxItems?: number; maxClients?: number } | null>(null);
  const [claimPopup, setClaimPopup] = useState<{ clientName: string; clientPhone: string; itemName: string } | null>(null);

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

  // Stable ref so refetchVendor always reads current phone without stale closure
  const vendorPhoneRef = useRef(vendorPhone);
  vendorPhoneRef.current = vendorPhone;

  // Stable ref so the socket effect below can read current vendor fields
  // (zip_code, id) without needing `vendor` itself in its dependency array —
  // see the effect for why that matters.
  const vendorRef = useRef(vendor);
  vendorRef.current = vendor;

  const refetchVendor = async () => {
    try {
      const qPhone = vendorPhoneRef.current || '';
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'vendors', action: 'select', filters: qPhone ? { phone: qPhone } : {} })
      });
      const d = await res.json();
      if (d.data && d.data.length > 0) {
        setVendor(d.data[0]);
      }
    } catch (e) {
      console.error('refetchVendor failed:', e);
    }
  };



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

  const fetchPendingOrders = async () => {
    const res = await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'orders', action: 'select', filters: { status: 'pending' } })
    });
    const d = await res.json();
    return (d.data || []) as Order[];
  };

  // Keyed on a stable vendor id, not the `vendor` object itself — refetchVendor()
  // (triggered below by 'planUpdated', which fires for ANY admin's plan edit
  // anywhere, not just this vendor's) creates a new object reference on every
  // call. Depending on `vendor` directly used to tear down and reconnect this
  // socket on every one of those unrelated events, and any 'newOrder' broadcast
  // that landed during that reconnect gap was silently, permanently lost —
  // vendors would see orders "vanish" that had actually just never arrived.
  // vendorRef (declared above) supplies current vendor fields to the handlers
  // below instead, so they never go stale despite not being in the dep array.
  const vendorId = vendor?.id || (vendor as any)?._id;

  useEffect(() => {
    if (!vendorId) return;

    fetchPendingOrders().then(setRadarOrders);

    // Establish WebSocket Connection
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Vendor socket connected');
      // Safety net for ANY disconnect (network blip, backgrounded tab, mobile
      // sleep) — reconcile in anything the server broadcast while we were
      // offline, since events missed during a disconnect are gone for good
      // otherwise. Only adds orders we don't already have; never removes any
      // (an order actively being claimed locally shouldn't be yanked away by
      // a fetch that's a moment stale).
      fetchPendingOrders().then((fresh) => {
        setRadarOrders((prev) => {
          const known = new Set(prev.map((o) => o.id));
          const missing = fresh.filter((o) => !known.has(o.id));
          return missing.length > 0 ? [...missing, ...prev] : prev;
        });
      });
    });

    socket.on('newOrder', (newOrder: Order) => {
      setRadarOrders((prev) => {
        // Avoid duplicate additions
        if (prev.some((o) => o.id === newOrder.id)) return prev;

        // Play Chime alert if order is in vendor's zip code (first 3 digits match)
        if (newOrder.client_zip?.substring(0, 3) === vendorRef.current?.zip_code?.substring(0, 3)) {
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

    socket.on('vendorUpdated', (updatedVendor: VendorType) => {
      const current = vendorRef.current;
      if (current && ((updatedVendor as any)._id === (current as any)._id || updatedVendor.id === current.id)) {
        setVendor(updatedVendor);
        show('🎉 Your subscription plan has been updated by Super Admin!', 'success');
      }
    });

    // Distinct from vendorUpdated above (which fires for any vendor edit): this fires
    // specifically when Super Admin approves an upgrade/addon request, so it can safely
    // trigger a celebratory "plan activated" popup instead of just a toast.
    socket.on('upgradeApproved', (payload: any) => {
      const myId = vendorRef.current?.id || (vendorRef.current as any)?._id;
      if (payload && payload.vendor_id === myId) {
        setApprovalPopup({
          planName: payload.plan_name,
          subscriptionEnd: payload.subscription_end,
          maxItems: payload.max_items,
          maxClients: payload.max_clients
        });
      }
    });

    // When Super-Admin edits any plan, re-fetch this vendor to pick up cascaded changes
    socket.on('planUpdated', () => {
      refetchVendor();
    });

    return () => {
      socket.disconnect();
    };
  }, [vendorId]);

  const getVendorItemLimit = (vendor: VendorType | null) => {
    if (!vendor) return 5;
    if (vendor.plan_name === 'Premium') return Infinity;
    if (vendor.plan_name === 'Standard') return 25;
    if (vendor.plan_name === 'Basic' || vendor.plan_name === 'Starter') return 10;
    return 5;
  };
  const navLabels = {
    en: { dashboard: 'Dashboard', menu: 'My Plan Items', radar: "Order's", kanban: 'Active Orders', activation: 'Plan Activation', upgrade: "Plan's", exit: 'Exit' },
    hi: { dashboard: 'डैशबोर्ड', menu: 'मेरी योजना आइटम', radar: 'ऑर्डर रडार', kanban: 'सक्रिय ऑर्डर', activation: 'प्लान एक्टिवेशन', upgrade: 'प्लान्स', exit: 'बाहर निकलें' },
    mr: { dashboard: 'डॅशबोर्ड', menu: 'माझ्या प्लॅन आयटम', radar: 'ऑर्डर रडार', kanban: 'सक्रिय ऑर्डर', activation: 'प्लॅन ॲक्टिव्हेशन', upgrade: 'प्लॅन्स', exit: 'बाहेर पडा' },
  }[lang];

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: navLabels.dashboard, icon: LayoutDashboard },
    { id: 'menu', label: navLabels.menu, icon: Package },
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
          <LanguageSelector direction="down" showLabel={true} />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-text" aria-label="Toggle Menu">
             {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ====== GRACE PERIOD BANNER ====== */}
      {vendor.status === 'grace_period' && (
        <div className="fixed top-14 lg:top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-amber-500 text-white px-5 py-2.5 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="text-sm font-bold">
              ⚠️ Your plan has expired — you are in a <strong>3-day grace period</strong>. You can still view orders but cannot accept new ones.
            </span>
          </div>
          <button
            onClick={() => setTab('upgrade')}
            className="shrink-0 px-4 py-1.5 rounded-xl bg-white text-amber-700 text-xs font-extrabold hover:bg-amber-50 transition-colors"
          >
            Renew Now →
          </button>
        </div>
      )}

      {/* ====== EXPIRY GATE OVERLAY (full lockout after grace period) ====== */}
      {vendor.status === 'expired' && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scale-in border border-red-200">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Subscription Expired</h2>
            <p className="text-sm text-gray-500 mb-2">
              Your subscription has ended and your <strong className="text-gray-800">{vendor.plan_name || 'plan'}</strong> is no longer active.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Renew your plan to restore full access to orders, radar, kanban, and inventory management.
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2 border border-gray-200">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Your Expired Subscriptions</p>
              {Array.isArray(vendor.active_subscriptions) && vendor.active_subscriptions.length > 0 ? (
                vendor.active_subscriptions.map((sub: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{sub.plan_name || 'Free Tier'}{sub.category_name ? ` (${sub.category_name})` : ''}</span>
                    <span className="text-red-500 font-bold">Expired: {sub.subscription_end || 'N/A'}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-700">{vendor.plan_name || 'Basic Plan'}</span>
                  <span className="text-red-500 font-bold">Expired: {vendor.subscription_end || 'N/A'}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onExit}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Exit Portal
              </button>
              <button
                onClick={() => setTab('upgrade')}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#4A0E17] to-[#6d1324] text-[#C5A059] font-extrabold text-sm hover:opacity-90 transition-opacity shadow-lg"
              >
                🔓 Renew Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-border bg-surface flex flex-col h-screen fixed lg:sticky top-0 z-40 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${
        vendor.status === 'grace_period' ? 'mt-10 lg:mt-0' : ''
      }`}>
        <div className="px-5 py-5 border-b border-border hidden lg:flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate text-text">{vendor.shop_name}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 mt-14 lg:mt-0">
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
                {item.id === 'radar' && radarOrders.filter(o => o.client_zip === vendor.zip_code).length > 0 && (
                  <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-500 animate-ping shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex justify-center pb-1">
            <LanguageSelector direction="up" showLabel={true} />
          </div>
          <Button variant="ghost" size="sm" className="w-full" onClick={onExit}>Exit</Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen relative z-10 bg-bg pt-14 lg:pt-0">
        {/* Sticky Top Header Bar */}
        <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-xs">
          <span className="text-xs font-bold text-muted uppercase tracking-wider hidden sm:block">Kitchen Partner Dashboard</span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector direction="down" showLabel={true} />
          </div>
        </div>
        <div className="px-3.5 py-4 sm:p-8 max-w-7xl mx-auto">
          {tab === 'dashboard' && <VendorDashboard vendor={vendor} lang={lang} onTab={setTab} radarOrders={radarOrders} />}
          {tab === 'menu' && <VendorMenu vendor={vendor} show={show} />}
          {tab === 'radar' && <OrderRadar vendor={vendor} activePlan={activePlan} radarOrders={radarOrders} onTab={setTab} show={show} onOrderClaimed={setClaimPopup} />}
          {tab === 'kanban' && <VendorKanban vendor={vendor} show={show} />}
          {tab === 'activation' && <PlanActivation vendor={vendor} activePlan={activePlan} onTab={setTab} />}
          {tab === 'upgrade' && <UpgradePlan vendor={vendor} />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <AntigravitySuccessModal
        open={!!approvalPopup}
        onClose={() => setApprovalPopup(null)}
        title={t.planActivatedTitle}
        subtitle={approvalPopup ? `${t.planActivatedMsgPrefix} ${approvalPopup.planName} ${t.planActivatedMsgSuffix}` : ''}
      >
        {approvalPopup && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t.planActivatedPlanLabel}</span>
              <strong className="text-gray-900">{approvalPopup.planName}</strong>
            </div>
            {approvalPopup.subscriptionEnd && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t.planActivatedValidUntilLabel}</span>
                <strong className="text-gray-900">{approvalPopup.subscriptionEnd}</strong>
              </div>
            )}
            {approvalPopup.maxItems !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t.planActivatedMaxItemsLabel}</span>
                <strong className="text-gray-900">{approvalPopup.maxItems}</strong>
              </div>
            )}
          </div>
        )}
      </AntigravitySuccessModal>

      <AntigravitySuccessModal
        open={!!claimPopup}
        onClose={() => setClaimPopup(null)}
        title="🎉 Order Claimed Successfully!"
        subtitle="Reach out to your client right away:"
      >
        {claimPopup && (
          <div className="mt-4 flex flex-col gap-2.5">
            <a
              href={buildClientWhatsAppLink(
                claimPopup.clientPhone,
                buildClientWhatsAppMessage(claimPopup.clientName, vendor?.shop_name || '', claimPopup.itemName, 'We have accepted your order and are preparing it now!')
              )}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-green-500/20"
            >
              <MessageCircle size={16} /> Chat with Client on WhatsApp 💬
            </a>
            <a
              href={buildClientTelLink(claimPopup.clientPhone)}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
            >
              <Phone size={16} /> Call Client 📞
            </a>
          </div>
        )}
      </AntigravitySuccessModal>
    </div>
  );
}

const vTrans = {
  en: {
    welcome: 'Welcome',
    totalCompletedOrders: 'Total Completed Orders',
    totalOverallCompletedDesc: 'Total overall orders completed',
    nearbyPinBroadcasts: 'Nearby PIN Broadcasts',
    nearbyPinBroadcastsDesc: 'Total client order notifications sent in PIN',
    totalOverallEarnings: 'Total Overall Earnings',
    totalEarnedDesc: 'Total overall earned from website',
    activeRadarOpportunities: 'Active Radar Opportunities',
    activeRadarOpportunitiesDesc: 'Live orders in your PIN ready to be claimed right now',
    requestSubmittedTitle: '📤 Request Submitted!',
    requestSubmittedMsg: 'Your request has been successfully sent to the owner (Super Admin). You will be notified as soon as your request is reviewed and approved.',
    planActivatedTitle: '🎉 Request Approved & Plan Activated!',
    planActivatedMsgPrefix: 'Great news! Your request has been approved by Super Admin. Your plan',
    planActivatedMsgSuffix: 'is now fully ACTIVATED!',
    planActivatedPlanLabel: 'Plan',
    planActivatedValidUntilLabel: 'Valid Until',
    planActivatedMaxItemsLabel: 'Max Items',
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
    nearbyPinBroadcasts: 'निकटवर्ती पिन प्रसारण',
    nearbyPinBroadcastsDesc: 'पिन कोड में भेजी गई कुल ग्राहक ऑर्डर सूचनाएं',
    totalOverallEarnings: 'कुल कमाई',
    totalEarnedDesc: 'वेबसाइट से हुई कुल कमाई',
    activeRadarOpportunities: 'सक्रिय रडार अवसर',
    activeRadarOpportunitiesDesc: 'आपके पिन कोड में अभी स्वीकार करने योग्य लाइव ऑर्डर',
    requestSubmittedTitle: '📤 अनुरोध सबमिट किया गया!',
    requestSubmittedMsg: 'आपका अनुरोध सफलतापूर्वक मालिक (सुपर एडमिन) को भेज दिया गया है। समीक्षा और स्वीकृति होते ही आपको सूचित किया जाएगा।',
    planActivatedTitle: '🎉 अनुरोध स्वीकृत और प्लान सक्रिय!',
    planActivatedMsgPrefix: 'बढ़िया खबर! सुपर एडमिन ने आपका अनुरोध स्वीकार कर लिया है। आपका प्लान',
    planActivatedMsgSuffix: 'अब पूरी तरह से सक्रिय है!',
    planActivatedPlanLabel: 'प्लान',
    planActivatedValidUntilLabel: 'तक वैध',
    planActivatedMaxItemsLabel: 'अधिकतम आइटम',
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
    nearbyPinBroadcasts: 'जवळपासचे पिन प्रसारण',
    nearbyPinBroadcastsDesc: 'पिन कोडमध्ये पाठवलेल्या एकूण ग्राहक ऑर्डर सूचना',
    totalOverallEarnings: 'एकूण कमाई',
    totalEarnedDesc: 'वेबसाइटवरून झालेली एकूण कमाई',
    activeRadarOpportunities: 'सक्रिय रडार संधी',
    activeRadarOpportunitiesDesc: 'तुमच्या पिन कोडमध्ये आत्ता स्वीकारण्यायोग्य लाइव्ह ऑर्डर्स',
    requestSubmittedTitle: '📤 विनंती सबमिट झाली!',
    requestSubmittedMsg: 'तुमची विनंती मालकाला (सुपर ॲडमिन) यशस्वीरित्या पाठवण्यात आली आहे. पुनरावलोकन आणि मंजुरी मिळताच तुम्हाला कळवले जाईल.',
    planActivatedTitle: '🎉 विनंती मंजूर आणि प्लॅन सक्रिय!',
    planActivatedMsgPrefix: 'आनंदाची बातमी! सुपर ॲडमिनने तुमची विनंती मंजूर केली आहे. तुमचा प्लॅन',
    planActivatedMsgSuffix: 'आता पूर्णपणे सक्रिय झाला आहे!',
    planActivatedPlanLabel: 'प्लॅन',
    planActivatedValidUntilLabel: 'वैध पर्यंत',
    planActivatedMaxItemsLabel: 'कमाल आयटम्स',
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

/* ─────────────────────────────────────────────────────────
   📅 Multi-Plan Validity Timeline Component
───────────────────────────────────────────────────────── */
function PlanTimeline({ subscriptions, onTab }: { subscriptions: any[]; onTab?: (t: Tab) => void }) {
  const [livePlans, setLivePlans] = useState<Record<string, any>>({});

  // Fetch live plan data from subscription_plans to always show fresh Super-Admin values
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'subscription_plans', action: 'select' })
        });
        const d = await res.json();
        const map: Record<string, any> = {};
        (d.data || []).forEach((p: any) => { map[p._id || p.id] = p; });
        setLivePlans(map);
      } catch (e) { /* silent fail — snapshot data shown as fallback */ }
    })();
  }, []);

  if (!subscriptions || subscriptions.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build enriched subscription list (live plan data merged over snapshot)
  const enriched = subscriptions.map((sub: any) => {
    const live = livePlans[sub.plan_id] || {};
    return {
      ...sub,
      plan_name: live.name || sub.plan_name || 'Plan',
      max_items: live.max_items ?? sub.max_items ?? 5,
      max_clients: live.max_clients ?? sub.max_clients ?? 5,
      category_name: sub.category_name || live.master_category_name || 'General',
      subscription_start: sub.subscription_start || null,
      subscription_end: sub.subscription_end || null,
    };
  });

  // Compute global timeline window
  const validDates = enriched.flatMap((s: any) =>
    [s.subscription_start, s.subscription_end].filter(Boolean).map((d: string) => new Date(d).getTime())
  );
  const globalStart = validDates.length > 0 ? Math.min(...validDates) : today.getTime();
  const globalEnd = validDates.length > 0
    ? Math.max(...validDates)
    : today.getTime() + 365 * 86400000;
  const totalRange = Math.max(globalEnd - globalStart, 1);

  // Month tick labels
  const tickDates: Date[] = [];
  const cursor = new Date(globalStart);
  cursor.setDate(1);
  while (cursor.getTime() <= globalEnd) {
    tickDates.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const todayPct = Math.min(100, Math.max(0, ((today.getTime() - globalStart) / totalRange) * 100));

  const urgency = (daysLeft: number) => {
    if (daysLeft <= 0) return { color: 'bg-zinc-400', text: 'text-zinc-500', badge: 'bg-zinc-100 text-zinc-600 border-zinc-300', label: 'Expired', icon: '⬜' };
    if (daysLeft <= 7) return { color: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-100 text-red-700 border-red-300', label: `${daysLeft}d left 🔴`, icon: '🔴' };
    if (daysLeft <= 30) return { color: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-300', label: `${daysLeft}d left ⚠️`, icon: '⚠️' };
    return { color: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: `${daysLeft}d left ✅`, icon: '🟢' };
  };

  const CATEGORY_ICONS: Record<string, string> = {
    'Tiffin': '🍱', 'Bakery': '🍞', 'Dairy': '🥛', 'Sweets': '🍮',
    'Snacks': '🥨', 'Beverages': '🥤', 'South Indian': '🥘',
    'North Indian': '🫕', 'General': '🍲', 'Free Tier': '🎁',
  };

  const getCategoryIcon = (cat: string) =>
    CATEGORY_ICONS[cat] || Object.entries(CATEGORY_ICONS).find(([k]) => cat?.toLowerCase().includes(k.toLowerCase()))?.[1] || '🍽️';

  return (
    <div className="card p-6 bg-surface border border-border space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base uppercase tracking-wider text-muted flex items-center gap-2">
            <span className="text-lg">📅</span> Subscription Validity Timeline
          </h3>
          <p className="text-[11px] text-muted mt-0.5">All your active plans — side by side. Dynamically synced with Super-Admin.</p>
        </div>
        <span className="text-[10px] font-bold text-muted border border-border rounded-lg px-2 py-1">
          {enriched.length} Plan{enriched.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Mobile Scroll Indicator */}
      <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-extrabold text-amber-900">
        <span>📱 Finger-Scrollable Timeline</span>
        <span className="animate-pulse">Swipe left/right ↔</span>
      </div>

      <div className="touch-scroll-x">
        <div className="min-w-[600px] space-y-4">
          {/* Month Ruler */}
          <div className="relative h-6 w-full select-none">
            {tickDates.map((d, i) => {
              const pct = ((d.getTime() - globalStart) / totalRange) * 100;
              if (pct < 0 || pct > 100) return null;
              return (
                <span
                  key={i}
                  className="absolute top-0 text-[9px] font-bold text-muted/70 whitespace-nowrap"
                  style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                >
                  {d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                </span>
              );
            })}
            {/* Today marker line */}
            <div
              className="absolute top-4 bottom-0 w-px bg-accent/60 flex flex-col items-center"
              style={{ left: `${todayPct}%` }}
            >
              <span className="bg-accent text-white text-[8px] font-extrabold px-1 py-px rounded whitespace-nowrap -mt-1">TODAY</span>
            </div>
          </div>

          {/* Plan Rows */}
          <div className="space-y-4">
            {enriched.map((sub: any, i: number) => {
              const start = sub.subscription_start ? new Date(sub.subscription_start).getTime() : globalStart;
              const end = sub.subscription_end ? new Date(sub.subscription_end).getTime() : globalEnd;
              const daysLeft = Math.ceil((end - today.getTime()) / 86400000);
              const u = urgency(daysLeft);

              const barLeft = Math.max(0, ((start - globalStart) / totalRange) * 100);
              const barWidth = Math.min(100 - barLeft, ((end - start) / totalRange) * 100);
              const catIcon = getCategoryIcon(sub.category_name);

              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{catIcon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-text truncate leading-tight">
                          {sub.category_name}
                        </p>
                        <p className="text-[10px] text-muted truncate">{sub.plan_name} · {sub.max_items} items · {sub.max_clients} clients</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${u.badge}`}>
                        {u.label}
                      </span>
                      {daysLeft <= 30 && (
                        <a
                          href={`https://wa.me/919175537373?text=Hello%20Vikram%20Ads%20Admin%2C%20I%20would%20like%20to%20renew%2Fupgrade%20my%20${encodeURIComponent(sub.category_name)}%20category%20plan%20(${encodeURIComponent(sub.plan_name)})%20for%20my%20kitchen.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer active:scale-95 flex items-center gap-1 shadow-xs"
                        >
                          Renew / Upgrade →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="relative w-full h-3 rounded-full bg-surface-2 border border-border overflow-visible">
                    {/* Plan bar */}
                    <div
                      className={`absolute top-0 h-full rounded-full ${u.color} transition-all duration-700`}
                      style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                    />
                    {/* Today line overlay on bar */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-white/80 z-10"
                      style={{ left: `${todayPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-muted font-medium">
                    <span>{sub.subscription_start || '—'}</span>
                    <span>{sub.subscription_end || '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorDashboard({ vendor, onTab, radarOrders }: { vendor: VendorType; onTab?: (t: Tab) => void; radarOrders: Order[] }) {

  const [lang] = useSyncedLanguage();

  const t = vTrans[lang];
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<VendorItem[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionText, setSuggestionText] = useState('');
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);

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

  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [pinMatchOrders, setPinMatchOrders] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const vId = vendor.id || (vendor as any)._id || '';
        const [oRes, iRes, bRes, pRes] = await Promise.all([
          fetch('/api/db', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'orders', action: 'select', filters: vId ? { vendor_id: vId } : {} })
          }).then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/db', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'vendor_inventory', action: 'select', filters: vId ? { vendor_id: vId } : {} })
          }).then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/db', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'broadcasts', action: 'select', sorts: [{ field: 'created_at', ascending: false }] })
          }).then(r => r.json()).catch(() => ({ data: [] })),
          // All client order notifications ever sent in this vendor's PIN code, regardless of
          // which vendor (if any) ended up claiming them — deliberately not scoped by vendor_id.
          fetch('/api/db', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'orders', action: 'select', filters: { client_zip: vendor.zip_code } })
          }).then(r => r.json()).catch(() => ({ data: [] }))
        ]);
        setOrders(oRes?.data || []);
        setItems(iRes?.data || []);
        setBroadcasts(bRes?.data || []);
        setPinMatchOrders(pRes?.data || []);
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
      setShowSubmittedModal(true);
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

  // Total client order notifications ever sent in this vendor's PIN code (any status, any vendor)
  const pinMatchCount = pinMatchOrders.filter(o => o.client_zip === vendor.zip_code).length;

  // Live pending orders in this vendor's PIN right now, ready to be claimed (same feed/definition
  // that powers the "radar" nav item's live notification dot)
  const activeRadarCount = radarOrders.filter(o => o.client_zip === vendor.zip_code).length;

  const kpis = [
    { label: t.totalCompletedOrders, value: vendorCompletedOrders.length, desc: t.totalOverallCompletedDesc, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: t.nearbyPinBroadcasts, value: pinMatchCount, desc: `${t.nearbyPinBroadcastsDesc} ${vendor.zip_code}`, icon: Navigation, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: t.totalOverallEarnings, value: `₹${totalVendorEarnings.toLocaleString()}`, desc: t.totalEarnedDesc, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: t.activeRadarOpportunities, value: activeRadarCount, desc: t.activeRadarOpportunitiesDesc, icon: Radar, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t.welcome}, {vendor.owner_name}</h1>
          <p className="text-xs text-muted mt-1">{vendor.shop_name} · Zip Code: {vendor.zip_code}</p>
        </div>

        {/* Dynamic Category Subscriptions Pills */}
        <div className="bg-gradient-to-r from-[#4A0E17] to-[#360910] p-3.5 rounded-2xl border border-[#C5A059]/40 text-[#C5A059] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-200/80 mb-1">Active Subscriptions Portfolio</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {Array.isArray(vendor.active_subscriptions) && vendor.active_subscriptions.length > 0 ? (
              vendor.active_subscriptions.map((sub: any, i: number) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs font-black bg-[#C5A059] text-[#4A0E17] shadow-xs flex items-center gap-1">
                  🟢 {sub.plan_name || sub.category_name} ({sub.max_items ?? 5} items limit)
                </span>
              ))
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-[#C5A059] text-[#4A0E17]">
                🟢 {vendor.plan_name || 'Basic Plan'}
              </span>
            )}
          </div>
        </div>
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

      {/* Multi-Plan Validity Timeline */}
      {Array.isArray(vendor.active_subscriptions) && vendor.active_subscriptions.length > 0 && (
        <PlanTimeline subscriptions={vendor.active_subscriptions} onTab={onTab} />
      )}

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
                      <p className="text-[10px] text-muted">{o.client_name} · #{(o.id || (o as any)._id || 'ORD12345').toString().slice(0, 8).toUpperCase()}</p>
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
              <Badge variant={isPlanExpired ? 'error' : vendor.status === 'approved' ? 'success' : vendor.status === 'grace_period' ? 'warning' : 'warning'}>
                {isPlanExpired || vendor.status === 'expired' ? t.statusExpired : vendor.status === 'grace_period' ? '⚠️ Grace Period' : vendor.status === 'approved' ? t.statusApproved : t.statusPending}
              </Badge>
            </div>
            
            <div className="text-xs text-muted space-y-1 pt-3 border-t border-border/50">
              <div className="flex justify-between"><span>{t.clientsLimitCount}</span><span className="font-semibold text-text">{vendor.total_clients} {t.clientsUnit}</span></div>
              <div className="flex justify-between"><span>{t.daysRemaining}</span><span className="font-semibold text-text">{t.until}: {vendor.subscription_end || '—'}</span></div>
            </div>

            {/* Item Limit Progress Bars per Active Subscription */}
            {Array.isArray(vendor.active_subscriptions) && vendor.active_subscriptions.length > 0 && (
              <div className="pt-3 border-t border-border/50 space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted">Item Slot Usage</p>
                {vendor.active_subscriptions.map((sub: any, i: number) => {
                  const maxItems = sub.max_items ?? 5;
                  // We don't have real inventory count here; show max as reference
                  const pct = 0; // Will be 0 until vendor fetches real count; progress bar shows capacity
                  const isAtLimit = pct >= 100;
                  const isWarning = pct >= 80;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-text truncate">{sub.plan_name || sub.category_name || 'General'}</span>
                        <span className={`text-[10px] font-extrabold ${isAtLimit ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600'}`}>
                          {maxItems} slots
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-2 border border-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      {sub.subscription_end && (
                        <p className="text-[9px] text-muted mt-0.5">Expires: {sub.subscription_end}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grace Period Warning */}
            {vendor.status === 'grace_period' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-xl text-xs space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <AlertCircle size={14} /> Grace Period Active
                </p>
                <p className="text-xs leading-relaxed font-medium">
                  Your plan expired. You have a 3-day grace window — renew now to avoid full lockout.
                </p>
                {onTab && (
                  <Button size="sm" className="w-full mt-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2" onClick={() => onTab('upgrade')}>
                    Renew Now →
                  </Button>
                )}
              </div>
            )}
            
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

      {/* Announcements from Super Admin */}
      {broadcasts.length > 0 && (
        <div className="card p-6 bg-surface border border-accent/30">
          <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-accent flex items-center gap-2">
            <MessageSquare size={16} /> Platform Announcements
          </h3>
          <div className="space-y-3">
            {broadcasts.slice(0, 5).map((b: any) => (
              <div key={b._id || b.id} className="flex gap-3 p-3.5 rounded-xl bg-accent/5 border border-accent/20">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text">{b.message}</p>
                  <p className="text-[10px] text-muted mt-1">{new Date(b.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <AntigravitySuccessModal
        open={showSubmittedModal}
        onClose={() => setShowSubmittedModal(false)}
        title={t.requestSubmittedTitle}
        subtitle={t.requestSubmittedMsg}
      />
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
  onOrderClaimed: (payload: { clientName: string; clientPhone: string; itemName: string }) => void;
}

function OrderRadar({ vendor, activePlan, radarOrders, onTab, show, onOrderClaimed }: OrderRadarProps) {
  const [lang] = useSyncedLanguage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
    // Strictly block Free / Unsubscribed or Expired vendors from accepting client orders
    if (vendor.plan_name === 'Free' || !vendor.plan_name || vendor.status === 'expired' || vendor.status !== 'approved') {
      setShowUpgradeModal(true);
      show('Upgrade Subscription Plan Now to accept live client orders.', 'error');
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

    // radarOrders redacts client_name/client_phone while an order is still 'pending' (see
    // server.js), so pull the real contact details from the update response, not from `order`.
    const freshOrder = Array.isArray(d.data) ? d.data[0] : d.data;
    onOrderClaimed({
      clientName: freshOrder?.client_name || '',
      clientPhone: freshOrder?.client_phone || '',
      itemName: freshOrder?.item_name || order.item_name || ''
    });

    show('Order confirmed and frozen successfully!');
    onTab('kanban'); // Move to Kanban board
  };

  const visibleRadarOrders = radarOrders;

  const isFreeOrUnsubscribed = vendor.plan_name === 'Free' || !vendor.plan_name || vendor.status === 'expired' || vendor.status !== 'approved';

  // Helper to check if vendor has active subscription covering the order's category
  const hasCategoryAccess = (orderCategory?: string | null) => {
    if (isFreeOrUnsubscribed) return false;
    if (!orderCategory) return true; // General category
    // Check main active plan category
    if (!activePlan?.master_category_name || activePlan.master_category_name === orderCategory) return true;
    // Check multi-subscriptions array ('General' is a wildcard, matching VendorMenu's item-grouping convention)
    if (Array.isArray(vendor.active_subscriptions)) {
      return vendor.active_subscriptions.some((sub: any) => !sub.category_name || sub.category_name === 'General' || sub.category_name === orderCategory);
    }
    return false;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title={t.radarTitle} 
        subtitle={t.radarSubtitle}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {visibleRadarOrders.map((o) => {
          const orderId = o.id || (o as any)._id || '';
          const isZipMatch = (o.client_zip || '').substring(0, 3) === (vendor.zip_code || '').substring(0, 3);
          const isActive = vendor.status === 'approved';
          const remaining = timers[orderId] ?? 60;
          const categoryAllowed = hasCategoryAccess(o.master_category_name);
          const isLockedUpsell = isZipMatch && (!categoryAllowed || isFreeOrUnsubscribed);
          
          const hours = Math.floor(remaining / 3600);
          const mins = Math.floor((remaining % 3600) / 60);
          const secs = remaining % 60;
          const formattedTimer = hours > 0
            ? `${hours}h ${mins.toString().padStart(2, '0')}m`
            : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          // Button classes evaluation based on specifications
          let btnLabel = t.confirmOrder;
          let disabled = false;
          let showUpgradeButton = isLockedUpsell;

          if (!isZipMatch) {
            btnLabel = t.outOfZone;
            disabled = true;
          } else if (isLockedUpsell) {
            btnLabel = 'Upgrade Subscription Plan Now';
          }

          return (
            <div 
              key={orderId} 
              className={`card p-6 border transition-all flex flex-col justify-between relative overflow-hidden ${
                !isZipMatch 
                  ? 'bg-surface-2/40 border-border text-muted/65 shadow-inner' 
                  : isLockedUpsell
                  ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 border-amber-300 shadow-md ring-2 ring-amber-400/20'
                  : 'bg-surface border-accent/20 shadow-md ring-2 ring-accent/5 scale-[1.02]'
              }`}
            >
              {/* Blurred Locked Card Overlay for Unsubscribed Categories */}
              {isLockedUpsell && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[3px] z-20 p-5 flex flex-col justify-between items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse mt-2">
                    <Padlock size={24} />
                  </div>
                  
                  <div className="space-y-1 my-auto">
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
                      📍 Nearby Area Cluster ({vendor.zip_code?.substring(0, 3)}xxx)
                    </span>
                    <h4 className="font-black text-gray-900 text-base mt-2">
                      Live Client Order Available
                    </h4>
                    <p className="text-xs font-bold text-amber-800 max-w-xs mx-auto">
                      Category: <span className="font-extrabold text-gray-900">{o.master_category_name || 'General'}</span>
                    </p>
                    <p className="text-[11px] text-gray-600 max-w-xs mx-auto italic mt-1">
                      Upgrade your plan to unlock and claim live client orders in this category!
                    </p>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer py-3" 
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <Sparkles size={16} /> Upgrade Plan to Unlock
                  </Button>
                </div>
              )}

              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-base text-text">{o.item_name}</h3>
                    <p className="text-[10px] text-muted">Proximity: {o.distance_km || '0.8'} km away (Zip: {o.client_zip})</p>
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
                        🏷️ <span className="font-semibold">{(t as any).orderCategory || 'Category'}:</span> <span className="font-extrabold text-amber-950">{getItemTranslation(o.master_category_name || '', lang) || o.master_category_name || 'General'}</span>
                      </p>
                      <p className="text-xs font-extrabold text-amber-900 flex items-start gap-1">
                        <span>📦</span>
                        <span>
                          <span className="font-bold">{(t as any).orderItemsSummary || 'Order Items & Quantity'}:</span>{' '}
                          <span className="font-black text-amber-950 text-sm">{getItemTranslation(o.item_name || '', lang)}</span>
                        </span>
                      </p>
                    </div>
                    <p className="text-[10px] text-amber-700/80 mt-1 italic">{t.fullInfoNote}</p>
                  </div>
                  
                  {isZipMatch && isActive && !isFreeOrUnsubscribed && categoryAllowed && (
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
                {showUpgradeButton ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold shadow-md flex items-center justify-center gap-1.5 cursor-pointer" 
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <Sparkles size={15} /> Upgrade Subscription Plan Now
                  </Button>
                ) : (
                  <div className="relative group/tooltip">
                    <Button 
                      className={`w-full font-bold flex items-center justify-center gap-1.5 ${
                        !isZipMatch 
                          ? 'bg-muted/30 border border-border text-muted pointer-events-none' 
                          : 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md'
                      }`}
                      onClick={() => {
                        if (isFreeOrUnsubscribed) {
                          setShowUpgradeModal(true);
                        } else {
                          acceptOrder(o, otpInputs[o.id] || '');
                        }
                      }}
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

        {visibleRadarOrders.length === 0 && (
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
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-6 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white font-black text-sm transition-all shadow-xl shadow-amber-500/30 inline-flex items-center gap-2.5 cursor-pointer"
                >
                  <Sparkles size={18} /> Upgrade Subscription Plan Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Upgrade Subscription Plan Now Modal ── */}
      {showUpgradeModal && (
        <Modal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Upgrade Subscription Plan Now"
        >
          <div className="text-center space-y-5 p-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner">
              <Sparkles size={32} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#111827]">Upgrade Subscription Plan Now</h3>
              <p className="text-xs text-[#6B7280] mt-2 max-w-sm mx-auto leading-relaxed">
                Free Tier accounts cannot claim or accept client orders. Please upgrade your subscription plan to connect with clients and accept live orders.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowUpgradeModal(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowUpgradeModal(false);
                  onTab('upgrade');
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Sparkles size={14} /> Upgrade Subscription Plan Now
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// 3. Kanban Active Orders Board
function VendorKanban({ vendor, show }: { vendor: VendorType; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [lang] = useSyncedLanguage();

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
                      <p><span className="text-muted font-medium">{(t as any).fullName || 'Name'}:</span> <span className="font-bold">{o.client_name || 'N/A'}</span></p>
                      <p><span className="text-muted font-medium">{(t as any).phone || 'Phone'}:</span> <span className="font-bold text-accent">{o.client_phone || 'N/A'}</span></p>
                      <p><span className="text-muted font-medium">{(t as any).fullAddress || 'Address'}:</span> {o.client_address || 'N/A'}</p>
                      <p><span className="text-muted font-medium">{(t as any).pinCode || 'PIN Code'}:</span> {o.client_zip || 'N/A'}</p>
                      {o.client_landmark && <p><span className="text-muted font-medium">{(t as any).landmark || 'Landmark'}:</span> {o.client_landmark}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {o.status === 'accepted' ? (
                      <Button size="sm" className="flex-1" onClick={() => transitionOrder(oId, 'preparing')}>
                        {t.startPrep}
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1 bg-accent" onClick={() => transitionOrder(oId, 'out_for_delivery')}>
                        {t.dispatchRider}
                      </Button>
                    )}
                    <a
                      href={buildClientWhatsAppLink(o.client_phone || '', buildClientWhatsAppMessage(o.client_name || '', vendor.shop_name, o.item_name || ''))}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-xs transition-all shadow-xs shrink-0"
                    >
                      <MessageCircle size={14} /> WhatsApp Client 💬
                    </a>
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
                      <p><span className="text-muted font-medium">{(t as any).fullName || 'Name'}:</span> <span className="font-bold">{o.client_name || 'N/A'}</span></p>
                      <p><span className="text-muted font-medium">{(t as any).phone || 'Phone'}:</span> <span className="font-bold text-accent">{o.client_phone || 'N/A'}</span></p>
                      <p><span className="text-muted font-medium">{(t as any).fullAddress || 'Address'}:</span> {o.client_address || 'N/A'}</p>
                      <p><span className="text-muted font-medium">{(t as any).pinCode || 'PIN Code'}:</span> {o.client_zip || 'N/A'}</p>
                      {o.client_landmark && <p><span className="text-muted font-medium">{(t as any).landmark || 'Landmark'}:</span> {o.client_landmark}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-green-600 border-green-600 hover:bg-green-700 text-white" onClick={() => transitionOrder(oId, 'delivered')}>
                      {t.completeHandover}
                    </Button>
                    <a
                      href={buildClientWhatsAppLink(o.client_phone || '', buildClientWhatsAppMessage(o.client_name || '', vendor.shop_name, o.item_name || ''))}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-xs transition-all shadow-xs shrink-0"
                    >
                      <MessageCircle size={14} /> WhatsApp Client 💬
                    </a>
                  </div>
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
                    <p><span className="font-medium">{(t as any).fullName || 'Name'}:</span> <span className="font-bold text-text">{o.client_name || 'N/A'}</span></p>
                    <p><span className="font-medium">{(t as any).phone || 'Phone'}:</span> {o.client_phone || 'N/A'}</p>
                    <p><span className="font-medium">{(t as any).fullAddress || 'Address'}:</span> {o.client_address || 'N/A'}</p>
                    <p><span className="font-medium">{(t as any).pinCode || 'PIN Code'}:</span> {o.client_zip || 'N/A'}</p>
                    {o.client_landmark && <p><span className="font-medium">{(t as any).landmark || 'Landmark'}:</span> {o.client_landmark}</p>}
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
function UpgradePlan({ vendor }: { vendor: VendorType }) {
  const [lang] = useSyncedLanguage();

  const t = vTrans[lang];
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);

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

    setShowSubmittedModal(true);
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

      <AntigravitySuccessModal
        open={showSubmittedModal}
        onClose={() => setShowSubmittedModal(false)}
        title={t.requestSubmittedTitle}
        subtitle={t.requestSubmittedMsg}
      />
    </div>
  );
}

// 5. Plan Activation Module Tab (Placed in between Active Orders and Plan's)
function PlanActivation({ vendor, activePlan, onTab }: { vendor: VendorType; activePlan: Plan | null; onTab: (t: Tab) => void }) {
  const [lang] = useSyncedLanguage();

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

        {/* ── Official Guide Documents & Images Section ── */}
        <VendorGuidesList />
      </div>
    </div>
  );
}

function VendorGuidesList() {
  const [guides, setGuides] = useState<any[]>([]);
  const [selectedGuideImg, setSelectedGuideImg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'guides', action: 'select' })
        });
        const d = await res.json();
        // Only show guides Super Admin explicitly marked visible to vendors —
        // mirrors the same allowed_roles filter SubAdmin.tsx already applies for 'sub_admin'.
        const allGuides = d.data || [];
        const vendorGuides = allGuides.filter((g: any) => {
          const roles: string[] = Array.isArray(g.allowed_roles) ? g.allowed_roles : [g.category || ''];
          return roles.includes('vendor') || roles.includes('all');
        });
        setGuides(vendorGuides);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="card p-6 bg-surface border border-border shadow-sm space-y-4 mt-6">
      <h3 className="text-lg font-extrabold text-text flex items-center gap-2">
        <span>📚</span> Official Guide Documents & Operating Images
      </h3>
      {guides.length === 0 ? (
        <p className="text-xs text-muted italic">No custom guide documents or images uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((g: any) => {
            const isImage = g.file_data && (g.file_data.startsWith('data:image') || /\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i.test(g.file_name || ''));
            return (
              <div key={g.id || g._id} className="p-4 rounded-2xl bg-surface-2 border border-border space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-text">{g.title}</h4>
                  {g.file_name && <p className="text-[11px] text-muted font-semibold mt-0.5">{g.file_name}</p>}
                  {isImage && (
                    <div className="mt-3 relative group cursor-pointer" onClick={() => setSelectedGuideImg(g.file_data)}>
                      <img src={g.file_data} alt={g.title} className="w-full h-auto max-h-56 object-contain rounded-xl border border-border/80 bg-white" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-bold">
                        Click to View Full Image
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  {isImage ? (
                    <button
                      onClick={() => setSelectedGuideImg(g.file_data)}
                      className="w-full py-2 px-3 bg-accent text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🔍</span> View Full Image
                    </button>
                  ) : g.file_data ? (
                    <a
                      href={g.file_data}
                      download={g.file_name || 'document'}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 bg-accent text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>📄</span> Download Document
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for full image viewing */}
      <Modal open={!!selectedGuideImg} onClose={() => setSelectedGuideImg(null)} title="Full Image View">
        {selectedGuideImg && (
          <div className="space-y-4 text-center">
            <img src={selectedGuideImg} alt="Guide" className="w-full h-auto max-h-[75vh] object-contain rounded-xl border border-border bg-white mx-auto shadow-md" />
            <a
              href={selectedGuideImg}
              download="guide_image.png"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-accent text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Download Original Image
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────
   My Active Plan Items Tab Component (Enhanced)
──────────────────────────────────────────────── */
function VendorMenu({ vendor, show }: { vendor: VendorType; show: (msg: string, type?: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const subs: any[] = Array.isArray(vendor.active_subscriptions) && vendor.active_subscriptions.length > 0
    ? vendor.active_subscriptions
    : [{ category_name: vendor.plan_name || 'General', plan_name: vendor.plan_name || 'Free Tier', max_items: 0, max_clients: 0, subscription_end: vendor.subscription_end, status: vendor.status }];

  const today = new Date().toISOString().slice(0, 10);

  // Is a particular subscription expired?
  const isPlanExpired = (sub: any) =>
    sub.status === 'expired' || (sub.subscription_end && sub.subscription_end < today);

  // Total overall item limit (summed across all active subs)
  const totalCapacity = subs.reduce((acc: number, sub: any) => {
    const m = sub.max_items ?? 5;
    return m === -1 ? Infinity : acc + m;
  }, 0);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vendor_inventory',
          action: 'select',
          filters: { vendor_id: vendor.id || (vendor as any)._id }
        })
      });
      const d = await res.json();
      let vendorItems = d.data || [];

      // Fallback: load master items grouped by subscription categories
      if (vendorItems.length === 0) {
        const masterRes = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'master_inventory', action: 'select' })
        });
        const masterData = await masterRes.json();
        const masters = masterData.data || [];

        vendorItems = [];
        subs.forEach((sub: any) => {
          const subLimit = sub.max_items === -1 ? 10 : (sub.max_items ?? 5);
          const catItems = masters
            .filter((m: any) =>
              !sub.category_name ||
              sub.category_name === 'General' ||
              (m.category || '').toLowerCase() === sub.category_name.toLowerCase()
            )
            .slice(0, subLimit)
            .map((m: any) => ({
              _id: m._id || m.id,
              id: m.id || m._id,
              vendor_id: vendor.id || (vendor as any)._id,
              item_name: m.name,
              category: sub.category_name || m.category || 'General',
              plan_category: sub.category_name || 'General',
              plan_name: sub.plan_name || 'Free Tier',
              price: m.base_price || 120,
              image_url: m.image_url,
              in_stock: true
            }));
          vendorItems.push(...catItems);
        });
      }

      // Tag each item with its plan_category if not already set
      vendorItems = vendorItems.map((it: any) => ({
        ...it,
        plan_category: it.plan_category || it.category || 'General',
        plan_name: it.plan_name || vendor.plan_name || 'Free Tier'
      }));

      setItems(vendorItems);
    } catch (err) {
      console.error('Failed to load plan items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [vendor]);

  const toggleAvailability = async (item: any) => {
    const newStock = !(item.in_stock ?? true);
    setItems(prev => prev.map(i => (i.id === item.id || i._id === item._id ? { ...i, in_stock: newStock } : i)));
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'vendor_inventory',
          action: 'upsert',
          data: { ...item, vendor_id: vendor.id || (vendor as any)._id, in_stock: newStock }
        })
      });
      show(`Item "${item.item_name}" is now ${newStock ? 'IN STOCK 🟢' : 'OUT OF STOCK 🔴'}`, newStock ? 'success' : 'info');
    } catch {
      show('Failed to update item availability', 'error');
    }
  };

  // Items matching the active filter chip
  const filteredItems = activeFilter === 'all'
    ? items
    : items.filter(it => (it.plan_category || it.category) === activeFilter);

  // Group filtered items by plan category
  const groups: Record<string, any[]> = {};
  filteredItems.forEach(it => {
    const key = it.plan_category || it.category || 'General';
    if (!groups[key]) groups[key] = [];
    groups[key].push(it);
  });

  const CATEGORY_ICONS: Record<string, string> = {
    'Tiffin': '🍱', 'Bakery': '🍞', 'Dairy': '🥛', 'Sweets': '🍮',
    'Snacks': '🥨', 'Beverages': '🥤', 'South Indian': '🥘',
    'North Indian': '🫕', 'General': '🍲', 'Free Tier': '🎁',
  };
  const getCatIcon = (cat: string) =>
    CATEGORY_ICONS[cat] ||
    Object.entries(CATEGORY_ICONS).find(([k]) => cat?.toLowerCase().includes(k.toLowerCase()))?.[1] || '🍽️';

  const totalCapacityText = totalCapacity === Infinity ? 'Unlimited' : `${items.length} / ${totalCapacity}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Active Plan Items 📋"
        subtitle={`Items linked to your active subscription plans · ${vendor.plan_name || 'Free Tier'}`}
        action={
          <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center gap-3 shadow-xs">
            <Package className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Total Capacity</p>
              <p className="text-xs font-bold text-amber-900">{totalCapacityText} Items</p>
            </div>
          </div>
        }
      />

      {/* ── Plan Filter Chips ── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-accent text-white border-accent shadow-sm'
              : 'bg-surface text-muted border-border hover:border-accent/50'
          }`}
        >
          All Plans ({items.length})
        </button>
        {subs.map((sub: any, i: number) => {
          const cat = sub.category_name || 'General';
          const count = subs.length === 1
            ? items.length
            : items.filter(it =>
                (it.plan_category || it.category || 'General').toLowerCase() === cat.toLowerCase()
              ).length;
          const expired = isPlanExpired(sub);
          return (
            <button
              key={i}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === cat
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : expired
                  ? 'bg-zinc-100 text-zinc-500 border-zinc-300 opacity-70'
                  : 'bg-surface text-muted border-border hover:border-accent/50'
              }`}
            >
              {getCatIcon(cat)} {cat} ({count}) {expired && '🔒'}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface rounded-2xl border border-border">
          <Spinner />
          <p className="text-xs text-muted mt-2 font-medium">Loading your active plan items...</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Package size={24} />}
          title="No Items Allocated Yet"
          subtitle="Items appear here based on your subscription's item capacity. If your plan shows 0 items, upgrade to start listing dishes."
        />
      ) : (
        <div className="space-y-8">
          {subs
            .filter((sub: any) => {
              const cat = sub.category_name || 'General';
              return activeFilter === 'all' || activeFilter === cat;
            })
            .map((sub: any, si: number) => {
              const cat = sub.category_name || 'General';
              const planName = sub.plan_name || 'Free Tier';
              const maxItems = sub.max_items === -1 ? Infinity : (sub.max_items ?? 5);
              // Primary: exact category match; fallback: show all filtered items (handles vendor_inventory without plan_category tag)
              const groupItems = (groups[cat] && groups[cat].length > 0)
                ? groups[cat]
                : subs.length === 1
                  ? filteredItems
                  : filteredItems.filter(it =>
                      (it.plan_category || it.category || 'General').toLowerCase() === cat.toLowerCase() ||
                      it.plan_category === cat ||
                      it.category === cat
                    );
              const usedCount = groupItems.length;
              const pct = maxItems === Infinity ? 0 : maxItems === 0 ? 100 : Math.min(100, (usedCount / maxItems) * 100);
              const expired = isPlanExpired(sub);
              const catIcon = getCatIcon(cat);

              return (
                <div key={si} className="space-y-4">
                  {/* ── Plan Group Header ── */}
                  <div className={`p-4 rounded-2xl border ${expired ? 'bg-zinc-50 border-zinc-300' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{catIcon}</span>
                        <div>
                          <p className={`font-extrabold text-sm ${expired ? 'text-zinc-500' : 'text-text'}`}>
                            {cat}
                            {expired && <span className="ml-2 text-[10px] font-black text-red-600 bg-red-100 border border-red-300 px-1.5 py-px rounded-full">EXPIRED</span>}
                          </p>
                          <p className="text-[10px] text-muted font-bold">{planName}</p>
                        </div>
                      </div>

                      {/* Per-plan capacity pill */}
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-extrabold ${pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {maxItems === Infinity ? `${usedCount} / Unlimited` : `${usedCount} / ${maxItems}`} items
                        </p>
                      </div>
                    </div>

                    {/* Capacity progress bar */}
                    {maxItems !== Infinity && (
                      <div className="mt-3">
                        <div className="w-full h-2 rounded-full bg-white border border-border overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              expired ? 'bg-zinc-400' : pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {expired && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">
                            🔒 Plan expired — renew to re-activate these items
                          </p>
                        )}
                        {!expired && sub.subscription_end && (
                          <p className="text-[9px] text-muted mt-1">Valid until {sub.subscription_end}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Item Cards Grid ── */}
                  {groupItems.length === 0 ? (
                    <p className="text-xs text-muted italic pl-2">No items in this plan category yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {groupItems.map((item: any) => {
                        const inStock = item.in_stock ?? true;
                        return (
                          <div
                            key={item.id || item._id}
                            className={`relative card p-4 sm:p-5 bg-surface border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                              expired
                                ? 'border-zinc-200 opacity-60 pointer-events-none'
                                : inStock
                                ? 'border-border hover:border-amber-400/60 shadow-xs'
                                : 'border-red-200 bg-red-50/20 opacity-80'
                            }`}
                          >
                            {/* 🔒 Expired Plan Overlay */}
                            {expired && (
                              <div className="absolute inset-0 z-10 rounded-[inherit] flex flex-col items-center justify-center bg-zinc-100/80 backdrop-blur-[2px] gap-1">
                                <span className="text-2xl">🔒</span>
                                <p className="text-[10px] font-extrabold text-zinc-600 text-center px-3">Plan Expired<br/>Renew to re-activate</p>
                              </div>
                            )}

                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl">🍲</span>
                                  )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                                  inStock ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
                                }`}>
                                  <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                  {inStock ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>

                              <div>
                                <h3 className="font-extrabold text-base text-text leading-snug">{getItemTranslation(item.item_name, 'en')}</h3>
                                <p className="text-xs text-muted font-bold mt-0.5">{item.category || 'General'}</p>
                              </div>

                              <p className="text-lg font-black text-amber-600">₹{item.price}</p>
                            </div>

                            <div className="pt-3 border-t border-border/80">
                              <button
                                onClick={() => toggleAvailability(item)}
                                className={`w-full h-11 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                                  inStock
                                    ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-300'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {inStock ? '🔴 Mark Out of Stock' : '🟢 Mark In Stock'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
