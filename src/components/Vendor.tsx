import { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, CreditCard, Radar, Trash2,
  DollarSign, Clock, CheckCircle2, AlertCircle, Store, Lock as Padlock,
  Navigation, AlertTriangle, Upload, Menu, X
} from 'lucide-react';
import { io } from 'socket.io-client';
import { supabase, type Vendor as VendorType, type VendorItem, type Order, type Plan, type MasterItem } from '../lib/supabase';
import { Button, Badge, Modal, Input, Select, useToast, Toast, Spinner, EmptyState, SpotlightCard } from './ui';

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
      // Find the approved vendor matching the logged-in phone session
      const queryPhone = vendorPhone || '+919876543210';
      const { data } = await supabase.from('vendors').select('*').eq('phone', queryPhone).maybeSingle();
      setVendor(data);
      if (data && data.plan_id) {
        const { data: pData } = await supabase.from('subscription_plans').select('*').eq('id', data.plan_id).maybeSingle();
        setActivePlan(pData);
      }
      setLoading(false);
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
  const formatLimitLabel = (limit: number) => (limit === Infinity ? 'Unlimited' : String(limit));

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'radar', label: 'Order Radar', icon: Radar },
    { id: 'kanban', label: 'Active Orders', icon: Navigation },
    { id: 'activation', label: 'Plan Activation', icon: CheckCircle2 },
    { id: 'upgrade', label: "Plan's", icon: CreditCard },
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
        <div className="flex items-center gap-2">
          <Store size={18} className="text-accent" />
          <p className="font-bold text-sm truncate text-text">{vendor.shop_name}</p>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-text">
           {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`w-64 border-r border-border bg-surface flex flex-col h-screen fixed lg:sticky top-0 z-40 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-border hidden lg:flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate text-text">{vendor.shop_name}</p>
            <p className="text-xs text-muted">Vendor Dashboard</p>
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
        <div className="p-3 border-t border-border">
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

function VendorDashboard({ vendor, onTab }: { vendor: VendorType; onTab?: (t: Tab) => void }) {
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
      const res = await fetch('/api/db', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'vendor_suggestions', action: 'select', filters: { vendor_id: vendor.id } })
      });
      const d = await res.json();
      setSuggestions(d.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: i }] = await Promise.all([
        fetch('/api/db', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'orders', action: 'select', filters: { vendor_id: vendor.id } })
        }).then(r => r.json()),
        supabase.from('vendor_inventory').select('*').eq('vendor_id', vendor.id),
      ]);
      setOrders(o?.data || []);
      setItems(i || []);
      await loadSuggestions();
      setLoading(false);
    })();
  }, [vendor.id]);

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

  // Calculate stats
  const successfulOrders = orders.filter(o => o.status === 'delivered');
  const revenue = successfulOrders.reduce((s, o) => s + Number(o.price), 0);
  const pendingFulfillment = orders.filter(o => o.status === 'accepted' || o.status === 'preparing' || o.status === 'out_for_delivery').length;
  
  // Low Stock Alerts (quantity < 5)
  const lowStockCount = items.filter(item => item.quantity < 5).length;

  const kpis = [
    { label: 'Today\'s Orders', value: successfulOrders.length, desc: 'Completed deliveries', icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: 'Pending Fulfillment', value: pendingFulfillment, desc: 'Kitchen active prep', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Today\'s Earnings', value: `₹${revenue.toLocaleString()}`, desc: 'Delivered revenue', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Total Orders Placed', value: orders.length, desc: 'Total orders count', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {vendor.owner_name}</h1>
        <p className="text-muted mt-1">Here is what is happening at {vendor.shop_name} today</p>
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
          <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted">Successful Orders</h3>
          {successfulOrders.length === 0 ? (
            <EmptyState icon={<ShoppingBag size={24} />} title="No completed orders today" />
          ) : (
            <div className="space-y-3">
              {successfulOrders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border border-border hover:border-accent/25 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center text-green-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">{o.item_name}</p>
                      <p className="text-[10px] text-muted">{o.client_name} · #{o.id.slice(0, 8).toUpperCase()}</p>
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
          <h3 className="font-extrabold text-base mb-4 uppercase tracking-wider text-muted">Subscription Health</h3>
          <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase font-bold">Active plan</p>
                <p className="text-xl font-extrabold text-accent">{vendor.plan_name || 'Free'}</p>
              </div>
              <Badge variant={isPlanExpired ? 'error' : vendor.status === 'approved' ? 'success' : 'warning'}>
                {isPlanExpired ? 'EXPIRED' : vendor.status.toUpperCase()}
              </Badge>
            </div>
            
            <div className="text-xs text-muted space-y-1 pt-3 border-t border-border/50">
              <div className="flex justify-between"><span>Clients Limit Count</span><span className="font-semibold text-text">{vendor.total_clients} Clients</span></div>
              <div className="flex justify-between"><span>Days Remaining</span><span className="font-semibold text-text">Until: {vendor.subscription_end || '—'}</span></div>
            </div>
            
            {isPlanExpired && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-xs space-y-2.5">
                <p className="font-bold flex items-center gap-1.5 text-red-600 text-xs uppercase tracking-wider">
                  <AlertCircle size={14} /> Plan Expired
                </p>
                <p className="text-xs text-red-600/90 leading-relaxed font-medium">
                  Your plan is expired. Please renew or purchase a new plan to continue accepting client orders.
                </p>
                {onTab && (
                  <Button 
                    size="sm" 
                    className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 shadow-sm"
                    onClick={() => onTab('upgrade')}
                  >
                    Renew / Purchase New Plan
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
          <AlertCircle size={16} /> Q&A / Platform Suggestions
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-muted">Have a question or a feature request? Submit it directly to the Super Admin team.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-border outline-none focus:border-accent text-sm text-text placeholder:text-muted"
              placeholder="Type your suggestion or question here..."
            />
            <Button onClick={handleSendSuggestion} disabled={submittingSuggestion || !suggestionText.trim()}>
              {submittingSuggestion ? <Spinner /> : 'Submit to Admin'}
            </Button>
          </div>

          {/* List of submitted Q&As / Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Your Submitted Questions & Suggestions ({suggestions.length})</p>
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
                        <p className="font-bold text-accent mb-0.5">Admin Reply:</p>
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
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  // Clean timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((_prev) => {
        const next: Record<string, number> = {};
        radarOrders.forEach((o) => {
          const elapsedMs = Date.now() - new Date(o.created_at).getTime();
          const remainingSecs = Math.max(0, 32400 - Math.floor(elapsedMs / 1000)); // 9 hours limit (32400 seconds)
          next[o.id] = remainingSecs;
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

    const res = await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'orders',
        action: 'update',
        filters: { _id: order.id },
        data: {
          vendor_id: vendor.id,
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
        title="Broadcast Order Radar" 
        subtitle="Global incoming client orders awaiting vendor acceptance"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {radarOrders.filter(o => o.master_category_name === (activePlan?.master_category_name || vendor.plan_name)).map((o) => {
          const isZipMatch = o.client_zip?.substring(0, 3) === vendor.zip_code?.substring(0, 3);
          const isActive = vendor.status === 'approved';
          const isExpired = vendor.status === 'expired';
          const remaining = timers[o.id] ?? 32400;
          
          const hrs = Math.floor(remaining / 3600);
          const mins = Math.floor((remaining % 3600) / 60);
          const secs = remaining % 60;
          const formattedTimer = hrs > 0 
            ? `${hrs}h ${mins.toString().padStart(2, '0')}m`
            : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          // Button classes evaluation based on specifications
          let btnLabel = 'Confirm Order';
          let disabled = false;
          let showRenew = false;

          if (!isZipMatch) {
            btnLabel = 'Out of Delivery Zone';
            disabled = true;
          } else if (isExpired) {
            btnLabel = 'Renew Plan to Accept';
            showRenew = true;
          } else if (vendor.plan_name === 'Free' || !vendor.plan_name) {
            btnLabel = 'Paid Plan Required';
            disabled = true;
          } else if (!isActive) {
            btnLabel = 'Awaiting Activation';
            disabled = true;
          }

          return (
            <div 
              key={o.id} 
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
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                    <p className="text-amber-900 font-semibold mb-1">New Broadcast Notification</p>
                    <p className="text-amber-800">Client's OTP: <span className="font-extrabold">{o.otp}</span></p>
                    {o.client_landmark && <p className="text-amber-800">Landmark: <span className="font-medium">{o.client_landmark}</span></p>}
                    <p className="text-[10px] text-amber-600/70 mt-1">Full info will display in Active Orders once confirmed.</p>
                  </div>
                  
                  {isZipMatch && isActive && (
                    <div className="pt-3">
                      <input
                        type="text"
                        placeholder="Insert client's OTP here to claim *"
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
            <EmptyState 
              icon={<Radar size={32} className="text-muted" />} 
              title="Radar search is silent" 
              subtitle="No active client orders are currently broadcasting for your subscription plan." 
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Kanban Active Orders Board
function VendorKanban({ vendor, show }: { vendor: VendorType; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [otpVal, setOtpVal] = useState('');

  const load = async () => {
    // Fetch only active orders belonging to this vendor
    const res = await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'orders', action: 'select', filters: { vendor_id: vendor.id },
        sorts: [{ field: 'created_at', ascending: false }]
      })
    });
    const d = await res.json();
    setOrders(d.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendor.id]);

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

    await fetch('/api/db', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'orders', action: 'update', filters: { _id: selectedOrder.id },
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
      <PageHeader title="Active Orders Board" subtitle="Progress board for kitchen preparation and dispatch" />

      {/* Kanban Board columns */}
      <div className="grid md:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Preparing */}
        <div className="card bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Clock size={16} className="text-amber-500" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wider">Preparing</h3>
            <Badge variant="warning">{preparing.length}</Badge>
          </div>
          <div className="space-y-3 min-h-[300px]">
            {preparing.map(o => (
              <div key={o.id} className="p-4 rounded-xl bg-surface-2 border border-border space-y-3 shadow-sm hover:border-accent/30 transition-all">
                <div>
                  <p className="font-bold text-base text-text">{o.item_name}</p>
                  <div className="mt-2 p-2.5 rounded-lg bg-surface border border-border/50 space-y-1 text-xs text-text">
                    <p><span className="text-muted font-medium">Name:</span> <span className="font-bold">{o.client_name || 'N/A'}</span></p>
                    <p><span className="text-muted font-medium">Phone:</span> <span className="font-bold text-accent">{o.client_phone || 'N/A'}</span></p>
                    <p><span className="text-muted font-medium">Address:</span> {o.client_address || 'N/A'}</p>
                    <p><span className="text-muted font-medium">PIN Code:</span> {o.client_zip || 'N/A'}</p>
                    {o.client_landmark && <p><span className="text-muted font-medium">Landmark:</span> {o.client_landmark}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {o.status === 'accepted' ? (
                    <Button size="sm" className="w-full" onClick={() => transitionOrder(o.id, 'preparing')}>
                      Start Prep
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full bg-accent" onClick={() => transitionOrder(o.id, 'out_for_delivery')}>
                      Dispatch Rider
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {preparing.length === 0 && <p className="text-xs text-muted italic text-center py-8">No prep orders</p>}
          </div>
        </div>

        {/* Column 2: Out for Delivery */}
        <div className="card bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Navigation size={16} className="text-blue-500" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wider">Transit</h3>
            <Badge variant="accent">{outForDelivery.length}</Badge>
          </div>
          <div className="space-y-3 min-h-[300px]">
            {outForDelivery.map(o => (
              <div key={o.id} className="p-4 rounded-xl bg-surface-2 border border-border space-y-3 shadow-sm hover:border-accent/30 transition-all">
                <div>
                  <p className="font-bold text-base text-text">{o.item_name}</p>
                  <div className="mt-2 p-2.5 rounded-lg bg-surface border border-border/50 space-y-1 text-xs text-text">
                    <p><span className="text-muted font-medium">Name:</span> <span className="font-bold">{o.client_name || 'N/A'}</span></p>
                    <p><span className="text-muted font-medium">Phone:</span> <span className="font-bold text-accent">{o.client_phone || 'N/A'}</span></p>
                    <p><span className="text-muted font-medium">Address:</span> {o.client_address || 'N/A'}</p>
                    <p><span className="text-muted font-medium">PIN Code:</span> {o.client_zip || 'N/A'}</p>
                    {o.client_landmark && <p><span className="text-muted font-medium">Landmark:</span> {o.client_landmark}</p>}
                  </div>
                </div>
                <Button size="sm" className="w-full bg-green-600 border-green-600 hover:bg-green-700 text-white" onClick={() => transitionOrder(o.id, 'delivered')}>
                  Complete Handover
                </Button>
              </div>
            ))}
            {outForDelivery.length === 0 && <p className="text-xs text-muted italic text-center py-8">No orders in transit</p>}
          </div>
        </div>

        {/* Column 3: Delivered */}
        <div className="card bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <CheckCircle2 size={16} className="text-green-500" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wider">Completed</h3>
            <Badge variant="success">{delivered.length}</Badge>
          </div>
          <div className="space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto pr-1">
            {delivered.map(o => (
              <div key={o.id} className="p-3.5 rounded-xl bg-surface-2/50 border border-border/60 space-y-1 text-xs">
                <p className="font-bold text-sm text-text">{o.item_name}</p>
                <div className="text-xs text-muted space-y-0.5 pt-1 border-t border-border/30">
                  <p><span className="font-medium">Name:</span> <span className="font-bold text-text">{o.client_name || 'N/A'}</span></p>
                  <p><span className="font-medium">Phone:</span> {o.client_phone || 'N/A'}</p>
                  <p><span className="font-medium">Address:</span> {o.client_address || 'N/A'}</p>
                  <p><span className="font-medium">PIN Code:</span> {o.client_zip || 'N/A'}</p>
                  {o.client_landmark && <p><span className="font-medium">Landmark:</span> {o.client_landmark}</p>}
                </div>
              </div>
            ))}
            {delivered.length === 0 && <p className="text-xs text-muted italic text-center py-8">No completed orders today</p>}
          </div>
        </div>

      </div>

      {/* OTP Handover Verification Modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Verify Delivery Handover">
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Verify the client's OTP code before final delivery submission.</p>
            <Input 
              label="4-Digit Handover OTP Code *" 
              value={otpVal} 
              onChange={setOtpVal} 
              placeholder="e.g. 1234"
              required 
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
              <Button onClick={verifyOTPAndDeliver} disabled={!otpVal}>Confirm Handover</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// 4. Upgrade Plan tab
function UpgradePlan({ vendor, show }: { vendor: VendorType; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
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
    await supabase.from('upgrade_requests').insert({
      vendor_id: vendor.id,
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
      <PageHeader title="Upgrade Subscription Tiers" subtitle="Select plan and increase client-mapping capacities" />

      <div className="grid md:grid-cols-3 gap-6 stagger">
        {plans.map((p) => {
          const isCurrent = vendor.plan_name === p.name;
          return (
            <div key={p.name} className={`card p-6 bg-surface border flex flex-col justify-between hover-lift ${isCurrent ? 'border-accent ring-2 ring-accent/10' : 'border-border'}`}>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted uppercase tracking-wide">{p.name} Tier</span>
                  {isCurrent && <Badge variant="success">Active Plan</Badge>}
                </div>
                
                <p className="text-4xl font-extrabold text-text mt-4">₹{p.price.toLocaleString()}</p>
                <p className="text-xs text-muted mt-1">Validity Period: {p.validity_days} Days</p>

                <div className="border-t border-border/50 my-4" />

                <ul className="text-xs space-y-2 text-muted font-medium">
                  <li>• Max Master Category allowance: <span className="font-bold text-text">{p.max_items}</span></li>
                  <li>• Max Client capacity: <span className="font-bold text-text">{p.max_clients} unique clients</span></li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40">
                <Button 
                  className="w-full" 
                  disabled={isCurrent || submitting}
                  onClick={() => requestUpgrade(p.name)}
                >
                  {isCurrent ? 'Currently Subscribed' : 'Submit Upgrade Request'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {addons.length > 0 && (
        <div className="mt-12 animate-fade-in-up">
          <PageHeader title="Available Add-ons" subtitle="Extend your limits and features" />
          <div className="grid md:grid-cols-3 gap-6 stagger mt-6">
            {addons.map((a) => (
              <div key={a.id} className="card p-6 bg-surface border border-border flex flex-col justify-between hover-lift">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted uppercase tracking-wide">Add-on Package</span>
                  </div>
                  
                  <p className="text-2xl font-extrabold text-text mt-4">{a.name}</p>
                  <p className="text-3xl font-extrabold text-accent mt-2">₹{a.price.toLocaleString()}</p>
                  <p className="text-xs text-muted mt-1">Validity: +{a.validity_days} Days</p>

                  <div className="border-t border-border/50 my-4" />

                  <ul className="text-xs space-y-2 text-muted font-medium">
                    <li>• Boost Client capacity: <span className="font-bold text-text">+{a.max_clients}</span></li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40">
                  <Button 
                    className="w-full" 
                    disabled={submitting}
                    onClick={() => requestUpgrade(a.name, true)}
                  >
                    Purchase Add-on
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
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="Plan Activation & Payment Guide" 
        subtitle="Manage your active plan status, scan QR codes to purchase new plans, and follow the activation guide." 
      />

      {/* ── Active Subscription Status Card ── */}
      <div className="card p-6 bg-surface border border-border shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-extrabold text-text">{vendor.plan_name || 'Free Tier'}</h3>
              <Badge variant={vendor.status === 'approved' ? 'success' : vendor.status === 'expired' ? 'error' : 'warning'}>
                {vendor.status === 'approved' ? 'Active Subscription' : vendor.status === 'expired' ? 'Plan Expired' : 'Pending Verification'}
              </Badge>
            </div>
            <p className="text-xs text-muted mt-1">Shop: <strong className="text-text">{vendor.shop_name}</strong> | Owner: <strong className="text-text">{vendor.owner_name}</strong></p>
          </div>
          {vendor.subscription_end && (
            <div className="text-left md:text-right">
              <p className="text-xs text-muted font-medium">Subscription Validity Period</p>
              <p className="text-sm font-bold text-accent mt-0.5">
                {vendor.subscription_start || 'N/A'} — {vendor.subscription_end}
              </p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/60">
          <div className="p-4 rounded-xl bg-surface-2 border border-border/50">
            <p className="text-xs text-muted font-medium">Activation Status</p>
            <p className="text-lg font-bold text-accent capitalize mt-1">{vendor.status || 'Active'}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-2 border border-border/50">
            <p className="text-xs text-muted font-medium">Max Clients Allowed</p>
            <p className="text-lg font-bold text-text mt-1">{vendor.total_clients || 0} Registered Clients</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-2 border border-border/50">
            <p className="text-xs text-muted font-medium">Registered Zone Zip</p>
            <p className="text-lg font-bold text-text mt-1">Zone {vendor.zip_code}</p>
          </div>
        </div>
      </div>

      {/* ── QR Code Payment Section ── */}
      <div className="card p-6 bg-surface border border-border space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-text flex items-center gap-2">
            <CreditCard size={20} className="text-accent" /> Scan QR Codes to Purchase / Upgrade Plan
          </h3>
          <p className="text-xs text-muted mt-1">
            New vendors registered on Free Tier can scan either QR code below using any UPI App (GPay, PhonePe, Paytm, BHIM) to purchase a Starter (₹499) or Premium (₹1,499) plan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code 1 Card */}
          <div className="p-6 rounded-2xl bg-surface-2 border border-border flex flex-col items-center text-center space-y-4 hover:border-accent/40 transition-colors">
            <Badge variant="accent">Primary Payment QR Code 1</Badge>
            <div className="w-48 h-48 bg-white p-3 rounded-2xl border-2 border-accent/20 shadow-md flex flex-col items-center justify-center">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=vikramsads@upi%26pn=VIKRAMS%20ADS%26cu=INR" 
                alt="UPI Payment QR Code 1" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-extrabold text-sm text-text">Scan via GPay / PhonePe / Paytm</p>
              <p className="text-xs font-semibold text-accent mt-0.5">UPI ID: vikramsads@upi</p>
              <p className="text-[11px] text-muted mt-1">Merchant: VIKRAMS ADS Official</p>
            </div>
          </div>

          {/* QR Code 2 Card */}
          <div className="p-6 rounded-2xl bg-surface-2 border border-border flex flex-col items-center text-center space-y-4 hover:border-accent/40 transition-colors">
            <Badge variant="success">Backup Billing QR Code 2</Badge>
            <div className="w-48 h-48 bg-white p-3 rounded-2xl border-2 border-green-500/20 shadow-md flex flex-col items-center justify-center">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=vikramadvertising@icici%26pn=VIKRAMS%20ADS%20Billing%26cu=INR" 
                alt="UPI Payment QR Code 2" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-extrabold text-sm text-text">Scan via BHIM / Banking Apps</p>
              <p className="text-xs font-semibold text-green-600 mt-0.5">UPI ID: vikramadvertising@icici</p>
              <p className="text-[11px] text-muted mt-1">Bank Account: ICICI Direct Billing</p>
            </div>
          </div>
        </div>

        {/* ── Step-by-Step Purchase Guide ── */}
        <div className="p-5 rounded-2xl bg-surface-2/60 border border-border/80 space-y-3">
          <p className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
            <AlertCircle size={14} className="text-accent" /> Step-by-Step Plan Purchase & Activation Guide
          </p>
          <div className="grid sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface border border-border/50 space-y-1">
              <span className="w-6 h-6 rounded-full bg-accent text-white font-extrabold flex items-center justify-center text-xs">1</span>
              <p className="font-bold text-text pt-1">Select Your Plan</p>
              <p className="text-[11px] text-muted">Choose Starter (₹499) or Premium (₹1,499) in the Plan's tab.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border/50 space-y-1">
              <span className="w-6 h-6 rounded-full bg-accent text-white font-extrabold flex items-center justify-center text-xs">2</span>
              <p className="font-bold text-text pt-1">Scan & Pay</p>
              <p className="text-[11px] text-muted">Scan QR Code 1 or QR Code 2 using GPay, PhonePe, Paytm, or BHIM.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border/50 space-y-1">
              <span className="w-6 h-6 rounded-full bg-accent text-white font-extrabold flex items-center justify-center text-xs">3</span>
              <p className="font-bold text-text pt-1">Copy UTR / Txn Ref</p>
              <p className="text-[11px] text-muted">Note the 12-digit UTR payment reference number from your UPI app receipt.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border/50 space-y-1">
              <span className="w-6 h-6 rounded-full bg-accent text-white font-extrabold flex items-center justify-center text-xs">4</span>
              <p className="font-bold text-text pt-1">Instant Activation</p>
              <p className="text-[11px] text-muted">Submit request in Plan's tab. Super Admin verifies and activates your plan!</p>
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
