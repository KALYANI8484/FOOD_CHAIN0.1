import { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, CreditCard, Radar, Trash2,
  DollarSign, Clock, CheckCircle2, AlertCircle, Store, Lock as Padlock,
  Navigation, AlertTriangle, Upload
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

type Tab = 'dashboard' | 'radar' | 'kanban' | 'inventory' | 'upgrade';

export function Vendor({ onExit, vendorPhone }: { onExit: () => void; vendorPhone?: string }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [vendor, setVendor] = useState<VendorType | null>(null);
  const [loading, setLoading] = useState(true);
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
      const { data } = await supabase.from('orders').select('*').eq('status', 'pending');
      setRadarOrders(data || []);
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
        
        // Play Chime alert if order is in vendor's zip code
        if (newOrder.client_zip === vendor.zip_code) {
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

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'radar', label: 'Order Radar', icon: Radar },
    { id: 'kanban', label: 'Active Orders', icon: Navigation },
    { id: 'inventory', label: 'My Inventory', icon: Package },
    { id: 'upgrade', label: 'Upgrade Plan', icon: CreditCard },
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
    <div className="min-h-screen bg-bg flex text-text">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col h-screen sticky top-0 z-20">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate text-text">{vendor.shop_name}</p>
            <p className="text-xs text-muted">Vendor Dashboard</p>
          </div>
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

      <main className="flex-1 overflow-y-auto h-screen relative z-10 bg-bg">
        <div className="p-8 max-w-7xl mx-auto">
          {tab === 'dashboard' && <VendorDashboard vendor={vendor} />}
          {tab === 'radar' && <OrderRadar vendor={vendor} radarOrders={radarOrders} onTab={setTab} show={show} />}
          {tab === 'kanban' && <VendorKanban vendor={vendor} show={show} />}
          {tab === 'inventory' && <Inventory vendor={vendor} show={show} />}
          {tab === 'upgrade' && <UpgradePlan vendor={vendor} show={show} />}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function VendorDashboard({ vendor }: { vendor: VendorType }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: i }] = await Promise.all([
        supabase.from('orders').select('*').eq('vendor_id', vendor.id),
        supabase.from('vendor_inventory').select('*').eq('vendor_id', vendor.id),
      ]);
      setOrders(o || []);
      setItems(i || []);
      setLoading(false);
    })();
  }, [vendor.id]);

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
    { label: 'Low Stock Alerts', value: lowStockCount, desc: 'Items with quantity < 5', icon: AlertTriangle, color: lowStockCount > 0 ? 'text-red-500' : 'text-muted', bg: lowStockCount > 0 ? 'bg-red-500/10' : 'bg-surface-2' },
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
              <Badge variant={vendor.status === 'approved' ? 'success' : 'error'}>{vendor.status.toUpperCase()}</Badge>
            </div>
            
            <div className="text-xs text-muted space-y-1 pt-3 border-t border-border/50">
              <div className="flex justify-between"><span>Clients Limit Count</span><span className="font-semibold text-text">{vendor.total_clients} Clients</span></div>
              <div className="flex justify-between"><span>Days Remaining</span><span className="font-semibold text-text">Until: {vendor.subscription_end || '—'}</span></div>
            </div>
            
            {vendor.status === 'expired' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs leading-normal">
                <p className="font-bold flex items-center gap-1"><AlertCircle size={12} /> Subscription Expired</p>
                Your customer limit was reached. Please upgrade to accept orders.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Order Radar Module Tab
interface OrderRadarProps {
  vendor: VendorType;
  radarOrders: Order[];
  onTab: (t: Tab) => void;
  show: (m: string, t?: 'success' | 'error' | 'info') => void;
}

function OrderRadar({ vendor, radarOrders, onTab, show }: OrderRadarProps) {
  const [timers, setTimers] = useState<Record<string, number>>({});

  // Clean timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((_prev) => {
        const next: Record<string, number> = {};
        radarOrders.forEach((o) => {
          const elapsedMs = Date.now() - new Date(o.created_at).getTime();
          const remainingSecs = Math.max(0, 600 - Math.floor(elapsedMs / 1000)); // 10 minutes limit
          next[o.id] = remainingSecs;
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [radarOrders]);

  const acceptOrder = async (order: Order) => {
    if (vendor.status === 'expired') {
      onTab('upgrade');
      return;
    }

    await supabase.from('orders').update({
      vendor_id: vendor.id,
      status: 'accepted',
      accepted_at: new Date().toISOString()
    }).eq('id', order.id);

    show('Order accepted successfully!');
    onTab('kanban'); // Move to Kanban board
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Broadcast Order Radar" 
        subtitle="Global incoming client orders awaiting vendor acceptance"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {radarOrders.map((o) => {
          const isZipMatch = o.client_zip === vendor.zip_code;
          const isActive = vendor.status === 'approved';
          const isExpired = vendor.status === 'expired';
          const remaining = timers[o.id] ?? 600;
          
          const mins = Math.floor(remaining / 60);
          const secs = remaining % 60;
          const formattedTimer = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          // Button classes evaluation based on specifications
          let btnLabel = 'Accept Order';
          let disabled = false;
          let showRenew = false;

          if (!isZipMatch) {
            btnLabel = 'Out of Delivery Zone';
            disabled = true;
          } else if (isExpired) {
            btnLabel = 'Renew Plan to Accept';
            showRenew = true;
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

                <div className="my-4 space-y-1.5 text-xs text-muted">
                  <p>Client: <span className="font-semibold text-text">{o.client_name}</span></p>
                  <p>Zip Code: <span className="font-semibold text-text">{o.client_zip}</span></p>
                  {o.client_landmark && <p>Landmark: <span className="font-semibold text-text">{o.client_landmark}</span></p>}
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
                      onClick={() => acceptOrder(o)}
                      disabled={disabled}
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

        {radarOrders.length === 0 && (
          <div className="col-span-full">
            <EmptyState 
              icon={<Radar size={32} className="text-muted" />} 
              title="Radar search is silent" 
              subtitle="No active client orders are currently broadcasting in Indiranagar zone." 
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
    const { data } = await supabase.from('orders').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendor.id]);

  const transitionOrder = async (orderId: string, nextStatus: string) => {
    await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);
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

    await supabase.from('orders').update({
      status: 'delivered',
      delivered_at: new Date().toISOString()
    }).eq('id', selectedOrder.id);

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
                  <p className="font-bold text-sm text-text">{o.item_name}</p>
                  <p className="text-[10px] text-muted">Client: {o.client_name} | {o.client_address}</p>
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
                  <p className="font-bold text-sm text-text">{o.item_name}</p>
                  <p className="text-[10px] text-muted">Address: {o.client_address}</p>
                </div>
                <Button size="sm" className="w-full bg-green-600 border-green-600 hover:bg-green-700 text-white" onClick={() => handleDeliverClick(o)}>
                  Handover (OTP)
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
              <div key={o.id} className="p-3.5 rounded-xl bg-surface-2/50 border border-border/60">
                <p className="font-bold text-xs text-muted">{o.item_name}</p>
                <p className="text-[10px] text-muted mt-0.5">Delivered to: {o.client_name}</p>
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

// 4. Inventory Sub-module Tab
function Inventory({ vendor, show }: { vendor: VendorType; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [items, setItems] = useState<VendorItem[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // New Row Item State
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [customPrice, setCustomPrice] = useState(100);
  const [customQty, setCustomQty] = useState(10);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const [{ data: v }, { data: m }] = await Promise.all([
      supabase.from('vendor_inventory').select('*').eq('vendor_id', vendor.id),
      supabase.from('master_inventory').select('*')
    ]);
    setItems(v || []);
    setMasterItems(m || []);
    if (m && m.length > 0 && !selectedMasterId) {
      setSelectedMasterId(m[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendor.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, rowId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(rowId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Image upload failed');

      await supabase.from('vendor_inventory').update({ image_url: data.url }).eq('id', rowId);
      show('Image uploaded successfully!');
      load();
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const saveRow = async (row: VendorItem) => {
    await supabase.from('vendor_inventory').update({
      price: Number(row.price),
      quantity: Number(row.quantity)
    }).eq('id', row.id);
    show('Saved inventory item');
    load();
  };

  const removeRow = async (rowId: string) => {
    await supabase.from('vendor_inventory').delete().eq('id', rowId);
    show('Inventory item removed', 'info');
    load();
  };

  const addNewItem = async () => {
    const master = masterItems.find(x => x.id === selectedMasterId);
    if (!master) return;

    // Check Plan item capacity
    // Default cap: 5 items
    let maxLimit = 5;
    if (vendor.plan_name === 'Starter') maxLimit = 10;
    else if (vendor.plan_name === 'Premium') maxLimit = 30;

    if (items.length >= maxLimit) {
      alert(`Plan limit reached! Max items permitted: ${maxLimit}`);
      return;
    }

    setAdding(true);
    await supabase.from('vendor_inventory').insert({
      vendor_id: vendor.id,
      master_item_id: master.id,
      item_name: master.name,
      category: master.category, // Auto inherits master category
      price: customPrice,
      quantity: customQty,
      image_url: master.image_url
    });

    setAdding(false);
    show('Dishes mapped to inventory!');
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kitchen Inventory</h1>
          <p className="text-muted mt-1">Configure stock limits and active prices for client browsing</p>
        </div>
        <Badge variant="accent">Mapped Limit: {items.length} / {vendor.plan_name === 'Starter' ? '10' : vendor.plan_name === 'Premium' ? '30' : '5'} Items</Badge>
      </div>

      {/* Mapping form panel */}
      <div className="card p-6 bg-surface border border-border animate-fade-in-up delay-100 space-y-4">
        <h3 className="font-extrabold text-base uppercase tracking-wider text-muted">Link Master dish template</h3>
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <Select 
            label="Choose Master Dish"
            value={selectedMasterId}
            onChange={setSelectedMasterId}
            options={masterItems.map(m => ({ value: m.id, label: `${m.name} (${m.category})` }))}
          />
          <Input label="Custom Active Price (₹)" type="number" value={String(customPrice)} onChange={(v) => setCustomPrice(Number(v))} />
          <Input label="Initial Quantity" type="number" value={String(customQty)} onChange={(v) => setCustomQty(Number(v))} />
        </div>
        <div className="flex justify-end pt-2">
          <Button 
            onClick={addNewItem} 
            disabled={adding || items.length >= (vendor.plan_name === 'Starter' ? 10 : vendor.plan_name === 'Premium' ? 30 : 5)}
          >
            Map to Menu
          </Button>
        </div>
      </div>

      {/* Grid of existing items */}
      <div className="card overflow-hidden bg-surface border border-border animate-fade-in-up delay-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="px-6 py-4">Dish Name</th>
                <th className="px-6 py-4">Inherited category</th>
                <th className="px-6 py-4">Image Attachment</th>
                <th className="px-6 py-4">Active Price</th>
                <th className="px-6 py-4">Stock Quantity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-surface-2/20 transition-all">
                  <td className="px-6 py-4 font-bold text-text">{item.item_name}</td>
                  <td className="px-6 py-4">
                    <Badge variant="accent">{item.category}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative border border-border rounded-xl p-1 bg-surface-2 flex items-center justify-center w-14 h-14 cursor-pointer overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover rounded" />
                      ) : (
                        <Upload size={14} className="text-muted" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={uploadingId === item.id}
                        onChange={(e) => handleImageUpload(e, item.id)} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      {uploadingId === item.id && (
                        <div className="absolute inset-0 bg-surface/90 flex items-center justify-center"><Spinner /></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setItems(prev => prev.map((itm, i) => i === idx ? { ...itm, price: val } : itm));
                      }}
                      className="w-20 px-2 py-1 rounded bg-surface border border-border text-sm font-semibold"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setItems(prev => prev.map((itm, i) => i === idx ? { ...itm, quantity: val } : itm));
                      }}
                      className="w-20 px-2 py-1 rounded bg-surface border border-border text-sm font-semibold"
                    />
                    {item.quantity < 5 && <span className="text-[10px] text-red-500 font-bold block mt-1">Low Stock!</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Button size="sm" onClick={() => saveRow(item)}>Save</Button>
                      <button onClick={() => removeRow(item.id)} className="text-muted hover:text-red-500 transition-colors p-2"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 5. Upgrade Plan tab
function UpgradePlan({ vendor, show }: { vendor: VendorType; show: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('subscription_plans').select('*').eq('status', 'active');
      setPlans(data || []);
      setLoading(false);
    })();
  }, []);

  const requestUpgrade = async (planName: string) => {
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
                  <li>• Max Inventory allowance: <span className="font-bold text-text">{p.max_items} Menu items</span></li>
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
    </div>
  );
}
