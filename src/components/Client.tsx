import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import {
  MapPin, Search, ShoppingBag, Clock, ArrowLeft, ArrowRight,
  Plus, Minus, CheckCircle2, KeyRound, Navigation, UtensilsCrossed,
  Package, Compass, HeartHandshake, Loader2, ShieldAlert
} from 'lucide-react';
import { supabase, type Vendor, type VendorItem, type Order, type ClientProfile } from '../lib/supabase';
import { Button, Badge, Drawer, useToast, Toast, Spinner, EmptyState, Input } from './ui';

type Step = 'location' | 'browse' | 'tracking';

export function Client({ 
  onExit, 
  initialName = '', 
  initialPhone = '' 
}: { 
  onExit: () => void; 
  initialName?: string; 
  initialPhone?: string; 
}) {
  const [step, setStep] = useState<Step>(initialName && initialPhone ? 'browse' : 'location');
  const [clientName, setClientName] = useState(initialName);
  const [clientPhone, setClientPhone] = useState(initialPhone);
  const [zip, setZip] = useState('');
  const [landmark, setLandmark] = useState('');
  const [cart, setCart] = useState<Record<string, { item: VendorItem; qty: number }>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const { toast, show } = useToast();
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);

  const handleLocationSubmit = async (name: string, phone: string, selectedZip: string, selectedLandmark: string) => {
    setClientName(name);
    setClientPhone(phone);
    const { data } = await supabase.from('clients').select('*').eq('phone', phone).maybeSingle();
    if (data) {
      setClientProfile(data);
    } else {
      setClientProfile({ id: '', name, phone, zip_code: selectedZip, landmark: selectedLandmark, address: '', created_at: '' } as ClientProfile);
    }
    setZip(selectedZip);
    setLandmark(selectedLandmark);
    setStep('browse');
  };





  return (
    <div className="min-h-screen bg-bg noise relative text-text">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={onExit}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <span className="font-bold text-text">VIKRAM ADVERTISING</span>
          </div>
          {step === 'browse' && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-surface-2 border border-border text-sm text-muted">
              <MapPin size={14} className="text-accent" /> 
              <span>{zip} {landmark ? `· ${landmark}` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {step === 'browse' && Object.keys(cart).length > 0 && (
              <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/15 text-accent border border-accent/20 text-sm font-semibold hover:bg-accent/20 transition-all">
                <ShoppingBag size={16} /> Cart
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">
                  {Object.values(cart).reduce((s, c) => s + c.qty, 0)}
                </span>
              </button>
            )}
            <Button variant="ghost" size="sm" onClick={onExit}>Exit</Button>
          </div>
        </div>
      </header>

      {step === 'location' && (
        <LocationGate 

          initialZip={zip} 
          initialLandmark={landmark} 

          initialName={clientName} 
          initialPhone={clientPhone} 

          onSubmit={handleLocationSubmit} 
        />
      )}
      {step === 'browse' && (
        <Browse 
          zip={zip} 
          landmark={landmark} 
          cart={cart} 
          setCart={setCart} 
          setCartOpen={setCartOpen} 
          show={show} 
        />
      )}
      {step === 'tracking' && activeOrder && (
        <Tracking 
          order={activeOrder} 
          onBack={() => { setActiveOrder(null); setStep('browse'); }} 
        />
      )}

      {/* Cart drawer */}
      <Drawer open={cartOpen} onClose={() => setCartOpen(false)} title="Confirm & Checkout">
        <CartView 
          cart={cart} 
          setCart={setCart} 
          defaultName={clientName}
          defaultPhone={clientPhone}
          onCheckout={(order) => { 
            setCartOpen(false); 
            setActiveOrder(order); 
            setStep('tracking'); 
          }} 
          show={show} 
        />
      </Drawer>



      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

const LocationGate = memo(function LocationGate({ 
  initialName, 
  initialPhone, 
  initialZip, 
  initialLandmark, 
  onSubmit 
}: { 
  initialName: string; 
  initialPhone: string; 
  initialZip: string; 
  initialLandmark: string; 
  onSubmit: (name: string, phone: string, zip: string, landmark: string) => Promise<void> | void 
}) {
  const [nameInput, setNameInput] = useState(initialName);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [zipInput, setZipInput] = useState(initialZip);
  const [landmarkInput, setLandmarkInput] = useState(initialLandmark);
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGPSDetect = () => {
    setDetecting(true);
    // Simulate GPS Coordinates Fetching
    setTimeout(() => {
      setZipInput('560038');
      setLandmarkInput('Indiranagar Metro Station');
      setDetecting(false);
    }, 1200);
  };

  const handleConfirm = async () => {
    if (zipInput.length >= 4 && nameInput && phoneInput) {
      setSubmitting(true);
      await onSubmit(nameInput, phoneInput, zipInput, landmarkInput);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6 grid-bg">
      <div className="max-w-md w-full text-center card p-8 glass animate-scale-in">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
            <Compass size={36} className="text-white" />
          </div>
          <div className="absolute inset-0 rounded-3xl border-2 border-accent/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
        <h1 className="text-3xl font-extrabold text-text leading-tight">Welcome to <br/>VIKRAM ADVERTISING</h1>
        <p className="text-muted mt-3 text-sm">Enter your details to browse local verified kitchens</p>
        
        <div className="mt-8 space-y-4 text-left">
          <Input 
            label="Your Name *"
            value={nameInput}
            onChange={setNameInput}
            placeholder="Enter full name"
          />
          <Input 
            label="Phone Number *"
            value={phoneInput}
            onChange={setPhoneInput}
            placeholder="e.g. +91 99999 88888"
          />
          <div className="relative">
            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
            <input
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              placeholder="Zip Code *"
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-surface-2 border border-border text-text placeholder:text-muted/50 focus:border-accent outline-none transition-all text-sm font-semibold"
            />
            {/* GPS icon button */}
            <button
              type="button"
              onClick={handleGPSDetect}
              disabled={detecting}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-border/20 text-accent transition-colors cursor-pointer"
              title="Detect GPS"
            >
              {detecting ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} className="rotate-45" />}
            </button>
          </div>
          
          <Input 
            label="Landmark (Optional)"
            value={landmarkInput}
            onChange={setLandmarkInput}
            placeholder="e.g. Near Metro Station"
          />

          <Button 
            size="lg" 
            className="w-full mt-6" 
            onClick={handleConfirm} 
            disabled={zipInput.length < 4 || !nameInput || !phoneInput || detecting || submitting}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <>Confirm & Browse <ArrowRight size={18} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
});

interface BrowseProps {
  zip: string;
  landmark: string;
  cart: Record<string, { item: VendorItem; qty: number }>;
  setCart: (c: Record<string, { item: VendorItem; qty: number }>) => void;
  setCartOpen: (open: boolean) => void;
  show: (m: string, t?: 'success' | 'error' | 'info') => void;
}

const Browse = memo(function Browse({ zip, landmark: _landmark, cart, setCart, setCartOpen, show }: BrowseProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected category in Smart Menu. Default: null (shows Category Grid)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(20);

  useEffect(() => {
    (async () => {
      // Fetch approved active vendors
      const { data: v } = await supabase.from('vendors').select('*').eq('status', 'approved');
      setVendors(v || []);
      if (v && v.length > 0) {
        const { data: i } = await supabase.from('vendor_inventory').select('*').in('vendor_id', v.map((x: any) => x.id));
        setItems(i || []);
      }
      setLoading(false);
    })();
  }, []);

  const masterCategories = ['Tiffin', 'Breakfast', 'Lunch/Dinner', 'Thali', 'Vegetables'];

  const categoryImages: Record<string, string> = {
    'Tiffin': 'https://images.pexels.com/photos/9585644/pexels-photo-9585644.jpeg',
    'Breakfast': 'https://images.pexels.com/photos/5560700/pexels-photo-5560700.jpeg',
    'Lunch/Dinner': 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg',
    'Thali': 'https://images.pexels.com/photos/9585643/pexels-photo-9585643.jpeg',
    'Vegetables': 'https://images.pexels.com/photos/1458691/pexels-photo-1458691.jpeg',
  };

  const categoryItems = useMemo(() => items.filter(i => i.category === selectedCategory), [items, selectedCategory]);
  const uniqueItemNames = useMemo(() => Array.from(new Set(categoryItems.map(i => i.item_name))), [categoryItems]);
  
  const displayedItemNames = useMemo(() => uniqueItemNames.slice(0, displayedItemsCount), [uniqueItemNames, displayedItemsCount]);
  
  const matchingVendorItems = useMemo(() => categoryItems.filter(i => i.item_name === selectedItemName), [categoryItems, selectedItemName]);
  const firstItem = matchingVendorItems[0];
  
  const minPrice = useMemo(() => matchingVendorItems.length > 0 ? Math.min(...matchingVendorItems.map(i => Number(i.price) || 0)) : 0, [matchingVendorItems]);
  const maxPrice = useMemo(() => matchingVendorItems.length > 0 ? Math.max(...matchingVendorItems.map(i => Number(i.price) || 0)) : 0, [matchingVendorItems]);

  const handleAddToCart = useCallback(() => {
    if (!firstItem) return;
    const c = { ...cart };
    if (c[firstItem.id]) {
      c[firstItem.id].qty += quantity;
    } else {
      c[firstItem.id] = { item: firstItem, qty: quantity };
    }
    setCart(c);
    show(`${quantity}x ${firstItem.item_name} added to cart`);
    setCartOpen(true);
    setSelectedItemName('');
    setQuantity(1);
  }, [cart, firstItem, quantity, setCart, setCartOpen, show]);

  if (loading) return <div className="py-24"><Spinner /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      
      {/* Category Grid view */}
      {!selectedCategory ? (
        <div className="space-y-10 animate-fade-in-up">
          <div className="card p-8 relative overflow-hidden bg-surface border border-border">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="relative flex items-center justify-between">
              <div>
                <Badge variant="accent">Zip Zone: {zip}</Badge>
                <h1 className="text-3xl font-extrabold mt-3 text-text">Verify Nearby Verified Kitchens</h1>
                <p className="text-muted mt-1">{vendors.length} local kitchens operating in your zone</p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted">
                <Clock size={16} className="text-accent" /> 24 min average delivery
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-muted mb-6">Choose Master Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {masterCategories.map((cat) => (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer hover-lift border border-border bg-surface shadow-sm"
                >
                  <img
                    src={categoryImages[cat]}
                    alt={cat}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                    <p className="font-extrabold text-white text-lg">{cat}</p>
                    <p className="text-xs text-accent-2/90 font-medium mt-1">Tap to browse</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Order Form view */
        <div className="space-y-6 animate-scale-in">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                setSelectedCategory(null);
                setSelectedItemName('');
                setQuantity(1);
                setDisplayedItemsCount(20);
              }}
              className="text-sm font-semibold text-muted hover:text-text transition-colors flex items-center gap-1.5 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              <span>Back to Categories</span>
            </button>
            <Badge variant="accent">{selectedCategory} Order Form</Badge>
          </div>

          <div className="card p-8 glass bg-surface border border-border animate-scale-in max-w-2xl mx-auto">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-text mb-2">Select Item</label>
                <div className="relative">
                  <UtensilsCrossed size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <select
                    value={selectedItemName}
                    onChange={(e) => {
                      setSelectedItemName(e.target.value);
                      setQuantity(1);
                    }}
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-surface-2 border border-border text-text focus:border-accent outline-none transition-all text-sm font-semibold appearance-none"
                  >
                    <option value="" disabled>Choose an item...</option>
                    {displayedItemNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                    <ArrowRight size={16} className="rotate-90" />
                  </div>
                </div>
                {uniqueItemNames.length > displayedItemsCount && (
                  <button 
                    onClick={() => setDisplayedItemsCount(c => c + 20)}
                    className="mt-2 text-xs text-accent font-semibold hover:underline"
                  >
                    Load more items...
                  </button>
                )}
              </div>

              {selectedItemName && firstItem && (
                <div className="animate-fade-in-up space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 p-5 rounded-2xl bg-surface-2 border border-border">
                    {firstItem.image_url ? (
                      <img 
                        src={firstItem.image_url} 
                        alt={firstItem.item_name} 
                        className="w-full md:w-32 h-32 rounded-xl object-cover border border-border" 
                      />
                    ) : (
                      <div className="w-full md:w-32 h-32 rounded-xl bg-surface border border-border flex items-center justify-center">
                        <Package size={32} className="text-muted" />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-extrabold text-text">{selectedItemName}</h3>
                        <p className="text-sm text-muted mt-1 flex items-center gap-1.5">
                          <HeartHandshake size={14} className="text-accent" /> 
                          Available from {matchingVendorItems.length} verified {matchingVendorItems.length === 1 ? 'kitchen' : 'kitchens'}
                        </p>
                      </div>

                      <div className="inline-block px-3 py-1.5 rounded-lg bg-surface border border-border">
                        <span className="text-lg font-extrabold text-accent">
                          {minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-border">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-xl bg-surface border border-border hover:bg-surface-2 flex items-center justify-center text-text transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-lg font-bold w-6 text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-xl bg-surface border border-border hover:bg-surface-2 flex items-center justify-center text-text transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                      <ShoppingBag size={18} /> Add to Cart
                    </Button>
                  </div>
                </div>
              )}

              {!selectedItemName && uniqueItemNames.length === 0 && (
                <EmptyState 
                  icon={<Package size={28} />} 
                  title="No items in this category" 
                  subtitle="Please check back later or try another category." 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

interface CartViewProps {
  cart: Record<string, { item: VendorItem; qty: number }>;
  setCart: (c: Record<string, { item: VendorItem; qty: number }>) => void;
  onCheckout: (o: Order) => void;
  show: (m: string, t?: 'success' | 'error' | 'info') => void;
  defaultName?: string;
  defaultPhone?: string;
}

const CartView = memo(function CartView({ cart, setCart, onCheckout, show, defaultName = '', defaultPhone = '' }: CartViewProps) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [zipInput, setZipInput] = useState('');
  const [landmarkInput, setLandmarkInput] = useState('');
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);

  const entries = Object.values(cart);
  const total = entries.reduce((s, c) => s + Number(c.item.price) * c.qty, 0);
  const vendorId = entries[0]?.item.vendor_id;

  const updateQty = (id: string, delta: number) => {
    const c = { ...cart };
    if (!c[id]) return;
    c[id].qty += delta;
    if (c[id].qty <= 0) delete c[id];
    setCart(c);
  };

  const placeOrder = async () => {
    if (!name || !phone || !address || !zipInput) { 
      show('Please complete name, phone, zip code, and delivery address', 'error'); 
      return; 
    }
    if (entries.length === 0) { 
      show('Your cart is empty', 'error'); 
      return; 
    }
    
    setPlacing(true);


    // Save client profile silently so they are remembered next time
    const { data: existingClient } = await supabase.from('clients').select('*').eq('phone', phone).maybeSingle();
    if (existingClient) {
      await supabase.from('clients').update({ name, address, zip_code: zipInput, landmark: landmarkInput || null }).eq('id', existingClient.id);
    } else {
      await supabase.from('clients').insert({ name, phone, address, zip_code: zipInput, landmark: landmarkInput || null });
    }


    const { data, error } = await supabase.from('orders').insert({
      client_name: name,
      client_phone: phone,
      client_zip: zipInput,
      client_landmark: landmarkInput || null,
      client_address: address,
      item_name: entries.map((e) => `${e.item.item_name} (x${e.qty})`).join(', '),
      category: entries[0]?.item.category || null,
      vendor_id: vendorId,
      price: total,
      quantity: entries.reduce((s, c) => s + c.qty, 0),
      status: 'pending',
    }).select().single();
    
    setPlacing(false);
    
    if (error) { 
      show('Failed to submit order', 'error'); 
      return; 
    }
    
    await supabase.from('activity_log').insert({ 
      action: `New order submitted by client: ${name}`, 
      actor: 'Client' 
    });
    
    show('Order placed! Waiting for vendor response.');
    setCart({});
    onCheckout(data);
  };

  if (entries.length === 0) {
    return <EmptyState icon={<ShoppingBag size={28} />} title="Your cart is empty" subtitle="Add items from the menu to start checkout" />;
  }

  return (
    <div className="space-y-6 h-full flex flex-col justify-between">
      <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-1">
        <p className="text-xs font-bold text-muted uppercase tracking-wider">Item Details</p>
        {entries.map(({ item, qty }) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2 border border-border">
            {item.image_url ? (
              <img src={item.image_url} alt={item.item_name} loading="lazy" className="w-12 h-12 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
                <Package size={16} className="text-muted" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-text">{item.item_name}</p>
              <p className="text-xs text-accent font-semibold mt-0.5">₹{item.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-surface border border-border hover:bg-surface-2 flex items-center justify-center text-text transition-colors"><Minus size={12} /></button>
              <span className="text-sm font-bold w-4 text-center">{qty}</span>
              <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-surface border border-border hover:bg-surface-2 flex items-center justify-center text-text transition-colors"><Plus size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <p className="text-xs font-bold text-muted uppercase tracking-wider">Confirm Delivery details</p>
        
        <Input 
          label="Your Name *"
          value={name}
          onChange={setName}
          placeholder="Enter full name"
          required
        />
        <Input 
          label="Phone Number *"
          value={phone}
          onChange={setPhone}
          placeholder="e.g. +91 99999 88888"
          required
        />
        <Input 
          label="ZIP Code *"
          value={zipInput}
          onChange={setZipInput}
          placeholder="e.g. 560038"
          required
        />
        <Input 
          label="Nearest Landmark"
          value={landmarkInput}
          onChange={setLandmarkInput}
          placeholder="e.g. Near Metro Station"
        />
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Confirm Delivery Address *</label>
          <textarea
            required
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Complete address (building, flat, floor)"
            className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text placeholder:text-muted/50 focus:border-accent outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted uppercase tracking-wider">Subtotal</span>
          <span className="text-2xl font-extrabold text-accent">₹{total}</span>
        </div>

        <Button size="lg" className="w-full" onClick={placeOrder} disabled={placing}>
          {placing ? <Spinner /> : <>Finalize Order <ArrowRight size={18} /></>}
        </Button>
      </div>
    </div>
  );
});

const Tracking = memo(function Tracking({ order, onBack }: { order: Order; onBack: () => void }) {
  const [status, setStatus] = useState(order.status);
  const [liveOrder, setLiveOrder] = useState<Order>(order);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', order.id).maybeSingle();
      if (data) {
        setStatus(data.status);
        setLiveOrder(data);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [order.id]);

  const stages = [
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'preparing', label: 'Preparing', icon: Package },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];
  
  const currentIdx = stages.findIndex((s) => s.id === status);

  // Graceful Fallback UI ("System Denied" - Order timeout empty state)
  if (status === 'System Denied') {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center animate-scale-in">
        <div className="card p-8 border border-border bg-surface">
          <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center text-warning mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-text">All our local kitchens are currently busy!</h2>
          <p className="text-muted text-sm mt-3 leading-relaxed">
            Your order has been placed on standby.
          </p>
          <p className="text-xs text-muted/80 mt-2 bg-surface-2 p-3 rounded-xl border border-border">
            Our team will contact you shortly to assist with your order.
          </p>
          <Button className="mt-8 w-full animate-pulse" onClick={onBack}>
            Return to Browse
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-muted hover:text-text transition-colors mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to browsing
      </button>

      <div className="card p-8 animate-fade-in-up bg-surface border border-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Live Tracking</h1>
            <p className="text-muted text-xs mt-1">Order ID: {order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <Badge variant={status === 'delivered' ? 'success' : 'accent'}>
            {status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Progress Horizontal Timeline */}
        <div className="mt-10 mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-5 right-5 h-1 bg-border rounded-full" />
            <div
              className="absolute top-5 left-5 h-1 bg-gradient-to-r from-accent to-accent-2 transition-all duration-500 rounded-full"
              style={{ width: `calc(${(currentIdx / (stages.length - 1)) * 100}% - ${currentIdx === 0 ? '0px' : '15px'})` }}
            />
            {stages.map((s, i) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2 shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${i <= currentIdx ? 'bg-accent border-accent text-white shadow-md' : 'bg-surface-2 border-border text-muted'}`}>
                  <s.icon size={16} />
                </div>
                <p className={`text-[10px] font-extrabold uppercase tracking-wider text-center ${i <= currentIdx ? 'text-text' : 'text-muted'}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* OTP Indicator */}
        {liveOrder.otp && status !== 'delivered' && (
          <div className="my-6 p-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-center animate-scale-in">
            <div className="flex items-center justify-center gap-2 mb-1">
              <KeyRound size={16} className="text-green-500" />
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Delivery OTP</p>
            </div>
            <p className="text-3xl font-extrabold tracking-[0.3em] text-green-600 my-2">{liveOrder.otp}</p>
            <p className="text-xs text-muted max-w-sm mx-auto">Provide this code to the verified delivery partner once your food arrives safely.</p>
          </div>
        )}

        {/* Order Details */}
        <div className="mt-8 p-5 rounded-2xl bg-surface-2 border border-border">
          <p className="text-xs text-muted uppercase tracking-wider font-bold mb-3">Order Summary</p>
          <p className="font-bold text-text text-sm">{liveOrder.item_name}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-sm">
            <span className="text-muted">Deliver to: <span className="font-semibold text-text">{liveOrder.client_address}</span></span>
            <span className="text-lg font-extrabold text-accent">₹{liveOrder.price}</span>
          </div>
        </div>

        {status === 'delivered' && (
          <div className="mt-6 p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center animate-scale-in">
            <CheckCircle2 size={36} className="text-green-500 mx-auto mb-2" />
            <p className="font-extrabold text-green-600 text-lg">Order Delivered Successfully!</p>
            <p className="text-sm text-muted mt-1">Thank you for ordering with VIKRAM ADVERTISING.</p>
          </div>
        )}
      </div>
    </div>
  );
});
