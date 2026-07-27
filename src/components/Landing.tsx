import { useEffect, useRef, useState } from 'react';
import {
  UtensilsCrossed, ArrowRight, Phone, Mail, MessageCircle,
  ShoppingBag, Store, X, Lock, MapPin, ChevronRight,
  ChevronLeft, Hash, User, CheckCircle, Globe
} from 'lucide-react';
import { Spinner } from './ui';

type Role = 'landing' | 'login' | 'super_admin' | 'sub_admin' | 'vendor' | 'client';

export type Language = 'en' | 'hi' | 'mr';

export const translations = {
  en: {
    plans: "Plan's",
    loginRegister: "Login / Register",
    liveStats: "LIVE PLATFORM STATS",
    trustedByCommunity: "Trusted by Our Community",
    totalOrdersPlaced: "Total Orders Placed",
    vendorsJoined: "Vendors Joined",
    selectOrder: "Select & Order",
    noItemsYet: "No items yet",
    vendorsSettingUp: "Vendors are setting up menus — check back soon!",
    step1Of2: "Step 1 of 2",
    step2Of2: "Step 2 of 2",
    selectWholesaleItems: "Select Wholesale Items",
    selectMultipleItems: "Select multiple items and customize quantities (Minimum Wholesale MOQ applied)",
    defaultMin: "Default Min",
    continueToDetails: "Continue to Details",
    yourDeliveryDetails: "Your delivery details",
    fullName: "Full Name",
    yourName: "Your name",
    phone: "Phone",
    mobileNo: "10-digit mobile no.",
    fullAddress: "Full Address",
    addressPlaceholder: "Flat, Building, Street, Area...",
    pinCode: "PIN Code",
    landmark: "Landmark",
    landmarkPlaceholder: "Near Metro, Park...",
    wholesaleOrderSummary: "Wholesale Order Summary",
    totalOrderAmount: "Total Order Amount",
    broadcastNotice: "⏳ Your wholesale order will be broadcast to nearby approved vendors immediately.",
    orderPlaced: "Order Placed!",
    orderBroadcasted: "Your wholesale order has been broadcast to nearby vendors.",
    connectingVendors: "Connecting to nearby vendors...",
    onceVendorAccepts: "Once a vendor accepts your order, they will contact you shortly.",
    done: "Done",
    back: "Back",
    confirmOrder: "Confirm & Place Wholesale Order",
    getInTouch: "Get in Touch",
    whatsAppUs: "WhatsApp Us",
    quickLinks: "Quick Links",
    becomeVendor: "Become a Vendor",
    contactUs: "Contact Us",
    footNote: "Bringing authentic local flavors to every guest by connecting verified kitchen partners through a fast, seamless ordering platform",
    allRightsReserved: "© 2026 Vikrams Ads. All rights reserved."
  },
  hi: {
    plans: "प्लान्स",
    loginRegister: "लॉगिन / रजिस्टर",
    liveStats: "लाइव प्लेटफ़ॉर्म आंकड़े",
    trustedByCommunity: "हमारे समुदाय का विश्वास",
    totalOrdersPlaced: "कुल दिए गए ऑर्डर",
    vendorsJoined: "जुड़े विक्रेता (वेंडर्स)",
    selectOrder: "चुनें और ऑर्डर करें",
    noItemsYet: "अभी कोई आइटम नहीं है",
    vendorsSettingUp: "विक्रेता मेनू सेट कर रहे हैं - जल्द ही वापस देखें!",
    step1Of2: "चरण 1 / 2",
    step2Of2: "चरण 2 / 2",
    selectWholesaleItems: "थोक आइटम चुनें",
    selectMultipleItems: "कई आइटम चुनें और मात्रा अनुकूलित करें (न्यूनतम थोक MOQ लागू)",
    defaultMin: "न्यूनतम मात्रा",
    continueToDetails: "विवरण पर आगे बढ़ें",
    yourDeliveryDetails: "आपकी डिलीवरी का विवरण",
    fullName: "पूरा नाम",
    yourName: "आपका नाम",
    phone: "फोन नंबर",
    mobileNo: "10-अंकों का मोबाइल नंबर",
    fullAddress: "पूरा पता",
    addressPlaceholder: "मकान नं., इमारत, गली, क्षेत्र...",
    pinCode: "पिन कोड",
    landmark: "लैंडमार्क (पहचान का स्थान)",
    landmarkPlaceholder: "पार्क, मेट्रो के पास...",
    wholesaleOrderSummary: "थोक ऑर्डर सारांश",
    totalOrderAmount: "कुल ऑर्डर राशि",
    broadcastNotice: "⏳ आपका थोक ऑर्डर तुरंत नजदीकी स्वीकृत विक्रेताओं को भेज दिया जाएगा।",
    orderPlaced: "ऑर्डर सफलतापूर्वक भेजा गया!",
    orderBroadcasted: "आपका थोक ऑर्डर नजदीकी विक्रेताओं को प्रसारित कर दिया गया है।",
    connectingVendors: "नजदीकी विक्रेताओं से जुड़ रहे हैं...",
    onceVendorAccepts: "जैसे ही कोई विक्रेता आपका ऑर्डर स्वीकार करेगा, वह जल्द ही आपसे संपर्क करेगा।",
    done: "पूर्ण",
    back: "पीछे",
    confirmOrder: "पुष्टि करें और थोक ऑर्डर दें",
    getInTouch: "संपर्क करें",
    whatsAppUs: "व्हाट्सएप करें",
    quickLinks: "त्वरित लिंक",
    becomeVendor: "विक्रेता (वेंडर) बनें",
    contactUs: "संपर्क करें",
    footNote: "एक त्वरित, सहज ऑर्डरिंग प्लेटफ़ॉर्म के माध्यम से सत्यापित रसोई भागीदारों को जोड़कर हर ग्राहक तक प्रामाणिक स्थानीय स्वाद पहुंचाना।",
    allRightsReserved: "© 2026 विक्रम्स एड्स। सर्वाधिकार सुरक्षित।"
  },
  mr: {
    plans: "प्लॅन्स",
    loginRegister: "लॉगिन / नोंदणी",
    liveStats: "लाइव्ह प्लॅटफॉर्म आकडेवारी",
    trustedByCommunity: "आमच्या समुदायाचा विश्वास",
    totalOrdersPlaced: "एकूण दिलेले ऑर्डर",
    vendorsJoined: "जोडलेले विक्रेते (व्हेंडर्स)",
    selectOrder: "निवडा आणि ऑर्डर करा",
    noItemsYet: "अजून कोणतीही वस्तू उपलब्ध नाही",
    vendorsSettingUp: "विक्रेते मेनू सेट करत आहेत - लवकरच पुन्हा तपासा!",
    step1Of2: "टप्पा १ पैकी २",
    step2Of2: "टप्पा २ पैकी २",
    selectWholesaleItems: "घाऊक वस्तू निवडा",
    selectMultipleItems: "अनेक वस्तू निवडा आणि प्रमाण कस्टमाईज करा (किमान घाऊक MOQ लागू)",
    defaultMin: "किमान प्रमाण",
    continueToDetails: "तपशीलावर पुढे जा",
    yourDeliveryDetails: "तुमचा डिलिव्हरी पत्ता व तपशील",
    fullName: "पूर्ण नाव",
    yourName: "तुमचे नाव",
    phone: "फोन नंबर",
    mobileNo: "१० अंकी मोबाईल नंबर",
    fullAddress: "पूर्ण पत्ता",
    addressPlaceholder: "घर क्र., इमारत, रस्ता, परिसर...",
    pinCode: "पिन कोड",
    landmark: "लँडमार्क (जवळची खूण)",
    landmarkPlaceholder: "पार्क जवळ, मेट्रो जवळ...",
    wholesaleOrderSummary: "घाऊक ऑर्डर सारांश",
    totalOrderAmount: "एकूण ऑर्डर रक्कम",
    broadcastNotice: "⏳ तुमची घाऊक ऑर्डर ताबडतोब जवळील मान्यताप्राप्त विक्रेत्यांना पाठवली जाईल.",
    orderPlaced: "ऑर्डर यशस्वीरित्या दिली!",
    orderBroadcasted: "तुमची घाऊक ऑर्डर जवळील विक्रेत्यांना प्रसारित करण्यात आली आहे.",
    connectingVendors: "जवळील विक्रेत्यांशी जोडले जात आहे...",
    onceVendorAccepts: "विक्रेत्याने तुमची ऑर्डर स्वीकारल्यावर, ते लवकरच तुमच्याशी संपर्क साधतील.",
    done: "पूर्ण",
    back: "मागे",
    confirmOrder: "खात्री करा आणि घाऊक ऑर्डर द्या",
    getInTouch: "संपर्क साधा",
    whatsAppUs: "व्हाट्सॲप करा",
    quickLinks: "जलद लिंक्स",
    becomeVendor: "विक्रेते (व्हेंडर) बना",
    contactUs: "संपर्क साधा",
    footNote: "जलद, सुलभ ऑर्डरिंग प्लॅटफॉर्मद्वारे पडताळणी केलेल्या किचन पार्टनर्सना जोडून प्रत्येक ग्राहकापर्यंत अस्सल स्थानिक चव पोहोचवणे.",
    allRightsReserved: "© २०२६ विक्रम्स ॲड्स. सर्व हक्क राखीव."
  }
};

export const getItemTranslation = (name: string, lang: Language): string => {
  if (!name || lang === 'en') return name;
  const clean = name.toLowerCase().replace(/[^a-z0-9]/gi, ' ').trim();
  
  if (clean.includes('full tiffin')) return lang === 'hi' ? 'फुल टिफिन' : 'फुल डबा (टिफिन)';
  if (clean.includes('poli bhaji')) return lang === 'hi' ? 'पोळी भाजी (डिलीवरी के साथ)' : 'पोळी भाजी (डिलिव्हरीसह)';
  if (clean.includes('breakfast') || clean.includes('breakfasst')) return lang === 'hi' ? 'नाश्ता' : 'न्याहारी';
  if (clean.includes('lunch') && clean.includes('dinner')) return lang === 'hi' ? 'लंच / डिनर' : 'जेवण (दुपार/रात्री)';
  if (clean.includes('lunch')) return lang === 'hi' ? 'दोपहर का भोजन (लंच)' : 'दुपारचे जेवण (लंच)';
  if (clean.includes('dinner')) return lang === 'hi' ? 'रात का खाना (डिनर)' : 'रात्रीचे जेवण (डिनर)';
  if (clean.includes('general')) return lang === 'hi' ? 'सामान्य' : 'सामान्य';
  if (clean.includes('thali')) return lang === 'hi' ? 'थाली' : 'थाळी';
  if (clean.includes('tiffin')) return lang === 'hi' ? 'टिफिन' : 'टिफिन';
  if (clean.includes('vegetable')) return lang === 'hi' ? 'सब्जियां' : 'भाजीपाला';
  if (clean.includes('dosa')) return lang === 'hi' ? 'मसाला डोसा' : 'मसाला डोसा';
  if (clean.includes('idli')) return lang === 'hi' ? 'इडली सांभर' : 'इडली सांबार';
  if (clean.includes('khichdi')) return lang === 'hi' ? 'दाल खिचड़ी' : 'डाळ खिचडी';
  
  return name;
};

export const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('app_language') as Language;
  if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) return saved;
  const navLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
  if (navLang.startsWith('hi')) return 'hi';
  if (navLang.startsWith('mr')) return 'mr';
  return 'en';
};

interface MasterItem  { id: string; name: string; category: string; base_price: number; price: number; image_url: string; description?: string; }
interface VendorItem  { id: string; item_name: string; price: number; quantity: number; image_url: string; master_item_id: string; vendor_id: string; }

/* ── Scroll Reveal ──────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}

/* ── Count-Up ───────────────────────────────────── */
function useCountUp(target: number | null, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (target === null) return;
    const io = new IntersectionObserver(
      e => { if (e[0].isIntersecting && !started) setStarted(true); }, { threshold: 0.5 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [target, started]);
  useEffect(() => {
    if (!started || target === null) return;
    let n = 0;
    const step = Math.ceil(target / (duration / 16));
    const t = setInterval(() => {
      n += step; if (n >= target) { setCount(target); clearInterval(t); } else setCount(n);
    }, 16);
    return () => clearInterval(t);
  }, [started, target, duration]);
  return { count, ref, started };
}

function KpiCard({ icon: Icon, label, value }: { icon: typeof ShoppingBag; label: string; value: number | null }) {
  const { count, ref, started } = useCountUp(value);
  return (
    <div ref={ref} className="text-center bg-white/15 rounded-2xl p-6 backdrop-blur-sm border border-white/20 reveal">
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
        <Icon size={24} className="text-white" />
      </div>
      {value === null
        ? <div className="h-10 flex items-center justify-center"><Spinner /></div>
        : <p className="text-5xl font-extrabold" style={{ fontFamily: "'Playfair Display', serif" }}>{count.toLocaleString()}+</p>}
      <p className="text-white/85 text-sm font-semibold mt-1">{label}</p>
      <div className="kpi-bar mt-3"><div className={`kpi-bar-fill ${started ? 'animate' : ''}`} /></div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   2-Step Order Modal
──────────────────────────────────────────────── */
type ModalStep = 1 | 2 | 3; // 1=select item, 2=buyer details, 3=success

interface OrderModalProps {
  master: MasterItem;
  onClose: () => void;
  onOrderPlaced: (createdOrder: any) => void;
}

function OrderModal({ master, onClose, onOrderPlaced }: OrderModalProps) {
  const [step, setStep] = useState<ModalStep>(1);
  const [subItems, setSubItems] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [selectedQuantities, setSelectedQuantities] = useState<{ [id: string]: number }>({});
  const [selectedItemIds, setSelectedItemIds] = useState<{ [id: string]: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState('');

  const [form, setForm] = useState({ name: '', phone: '', address: '', zip: '', landmark: '' });
  const patch = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  // Fetch sub-items for this master category
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'sub_inventory',
            action: 'select',
            filters: { master_inventory_id: master.id }
          })
        });
        const d = await res.json();
        const items = d.data || [];
        
        const initialQtys: { [id: string]: number } = {};
        const initialSelected: { [id: string]: boolean } = {};
        items.forEach((item: any) => {
          const key = item.id || item._id;
          const defaultMin = Number(item.quantity) || 1;
          initialQtys[key] = defaultMin;
        });
        if (items.length > 0) {
          const firstKey = items[0].id || items[0]._id;
          initialSelected[firstKey] = true;
        }
        setSubItems(items);
        setSelectedQuantities(initialQtys);
        setSelectedItemIds(initialSelected);
      } catch (e) { console.error(e); }
      finally { setLoadingSubs(false); }
    })();
  }, [master.id]);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateItemQuantity = (id: string, delta: number, minQty: number) => {
    setSelectedQuantities(prev => {
      const current = prev[id] || minQty;
      const next = Math.max(minQty, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const activeSelectedSubItems = subItems.filter(item => selectedItemIds[item.id || item._id]);

  const totalPrice = activeSelectedSubItems.reduce((sum, item) => {
    const key = item.id || item._id;
    const q = selectedQuantities[key] || Number(item.quantity) || 1;
    return sum + (Number(item.price) * q);
  }, 0);

  const totalItemCount = activeSelectedSubItems.reduce((sum, item) => {
    return sum + (selectedQuantities[item.id] || Number(item.quantity) || 1);
  }, 0);

  const summaryItemName = activeSelectedSubItems.length > 0
    ? activeSelectedSubItems.map(i => `${i.name} (x${selectedQuantities[i.id || i._id] || i.quantity})`).join(', ')
    : master.name;

  const handlePlaceOrder = async () => {
    if (activeSelectedSubItems.length === 0) {
      alert('Please select at least one item to order.');
      return;
    }
    if (!form.name || !form.phone || !form.address || !form.zip || !form.landmark) {
      alert('All fields are required'); return;
    }
    setSubmitting(true);
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const summaryItemName = activeSelectedSubItems
      .map(i => `${i.name} (${selectedQuantities[i.id] || i.quantity} ${i.uom || 'pc'})`)
      .join(', ');

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'orders',
          action: 'insert',
          data: {
            client_name: form.name,
            client_phone: form.phone,
            client_address: form.address,
            client_zip: form.zip,
            client_landmark: form.landmark,
            item_name: summaryItemName,
            item_id: activeSelectedSubItems[0]?.id || master.id,
            master_category_name: master.name,
            price: totalPrice,
            quantity: totalItemCount,
            status: 'pending',
            otp: generatedOtp
          }
        })
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setOtp(generatedOtp);
      setStep(3);
      onOrderPlaced();
    } catch (e: any) {
      alert(e.message || 'Failed to place order. Try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="relative h-36 flex-shrink-0">
          <img
            src={master.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
            alt={master.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X size={15} />
          </button>
          <div className="absolute bottom-4 left-5">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{master.category}</span>
            <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {master.name}
            </h2>
          </div>
          {/* Step indicator */}
          <div className="absolute top-3 left-5 flex items-center gap-1.5">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === 3 ? 'bg-green-400' : step >= s ? 'bg-amber-400 w-8' : 'bg-white/30 w-4'}`} />
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Step 1: Select Sub-Items ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 1 of 2</p>
                <h3 className="text-lg font-extrabold text-gray-900 mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Select Wholesale Items
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Select multiple items and customize quantities (Minimum Wholesale MOQ applied)</p>
              </div>

              {loadingSubs ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : subItems.length === 0 ? (
                <div className="text-center py-8 bg-amber-50 rounded-2xl border border-amber-100">
                  <UtensilsCrossed size={32} className="mx-auto text-amber-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">No specific sub-items listed yet</p>
                  <p className="text-xs text-gray-400 mt-1">You can still place a custom wholesale order for this category</p>
                  <button
                    onClick={() => {
                      const synthId = master.id;
                      setSubItems([{ id: synthId, name: master.name, price: master.price ?? master.base_price, quantity: 1, uom: 'order' }]);
                      setSelectedItemIds({ [synthId]: true });
                      setSelectedQuantities({ [synthId]: 1 });
                      setStep(2);
                    }}
                    className="mt-4 px-5 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
                  >
                    Order {master.name} Category →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subItems.map(item => {
                    const itemId = item.id || item._id;
                    const isSelected = !!selectedItemIds[itemId];
                    const minQty = Number(item.quantity) || 1;
                    const currentQty = selectedQuantities[itemId] || minQty;
                    const itemUom = item.uom || 'pc';

                    return (
                      <div
                        key={itemId}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                            : 'border-gray-100 hover:border-amber-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => toggleItemSelection(itemId)}>
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? 'border-amber-500 bg-amber-500' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 truncate text-sm">{item.name}</p>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                                Default Min: {minQty} {itemUom}
                              </span>
                            </div>
                            <p className="text-amber-700 font-extrabold text-xs mt-0.5">
                              ₹{item.price} / {itemUom}
                            </p>
                          </div>
                        </div>

                        {/* Sub-Item Quantity Controller (Locked at minQty) */}
                        {isSelected && (
                          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-amber-300 shadow-sm flex-shrink-0">
                            <button
                              onClick={() => updateItemQuantity(itemId, -1, minQty)}
                              disabled={currentQty <= minQty}
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-700 font-bold flex items-center justify-center text-sm disabled:opacity-40"
                              title={`Minimum quantity locked at default MOQ (${minQty})`}
                            >
                              −
                            </button>
                            <div className="text-center px-1">
                              <span className="text-xs font-extrabold text-gray-900">{currentQty}</span>
                              <span className="text-[10px] text-gray-500 font-medium ml-1">{itemUom}</span>
                            </div>
                            <button
                              onClick={() => updateItemQuantity(itemId, 1, minQty)}
                              className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center text-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Buyer Details ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 2 of 2</p>
                <h3 className="text-lg font-extrabold text-gray-900 mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Your delivery details
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Full Name" placeholder="Your name" icon={User} value={form.name} onChange={patch('name')} />
                <FormField label="Phone" placeholder="10-digit mobile no." icon={Phone} value={form.phone} onChange={(v) => patch('phone')(v.replace(/\D/g, '').slice(0, 10))} type="tel" maxLength={10} />
              </div>
              <FormField label="Full Address" placeholder="Flat, Building, Street, Area..." icon={MapPin} value={form.address} onChange={patch('address')} />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="PIN Code" placeholder="416009" icon={Hash} value={form.zip} onChange={patch('zip')} maxLength={6} />
                <FormField label="Landmark" placeholder="Near Metro, Park..." icon={MapPin} value={form.landmark} onChange={patch('landmark')} />
              </div>

              {/* Order Items Breakdown & Summary */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Wholesale Order Summary</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {activeSelectedSubItems.map(item => {
                    const q = selectedQuantities[item.id] || Number(item.quantity) || 1;
                    const itemTotal = Number(item.price) * q;
                    return (
                      <div key={item.id} className="flex justify-between text-xs text-gray-700 font-medium">
                        <span>• {item.name} ({q} {item.uom || 'pc'})</span>
                        <span className="font-bold text-gray-900">₹{itemTotal}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-gray-900">Total Order Amount:</span>
                  <span className="font-extrabold text-amber-700 text-base">₹{totalPrice}</span>
                </div>
                <p className="text-[10px] text-amber-600">⏳ Your wholesale order will be broadcast to nearby approved vendors immediately.</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Order Placed!
                </h3>
                <p className="text-gray-500 text-sm mt-1">Your wholesale order has been broadcast to nearby vendors.</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white animate-pulse">
                <p className="text-sm font-bold uppercase tracking-widest opacity-90 mb-2">Connecting to nearby vendors...</p>
                <p className="text-xs opacity-80 mt-1">Once a vendor accepts your order, they will contact you shortly.</p>
              </div>
              <p className="text-xs text-gray-400">This window will close automatically in a moment...</p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-gray-100">
          {step === 1 && subItems.length > 0 && (
            <button
              disabled={activeSelectedSubItems.length === 0}
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-200 disabled:opacity-40"
            >
              Continue to Details ({activeSelectedSubItems.length} items • ₹{totalPrice}) <ChevronRight size={18} />
            </button>
          )}
          {step === 2 && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 text-sm font-semibold transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                disabled={submitting || activeSelectedSubItems.length === 0 || !form.name || !form.phone || !form.address || !form.zip || !form.landmark}
                onClick={handlePlaceOrder}
                className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-200 disabled:opacity-40"
              >
                {submitting ? <Spinner /> : <><ArrowRight size={16} /> Place Order — ₹{price}</>}
              </button>
            </div>
          )}
          {step === 3 && (
            <button
              onClick={onClose}
              className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle size={16} /> Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Tiny form field helper */
function FormField({ label, placeholder, icon: Icon, value, onChange, type = 'text', maxLength }: {
  label: string; placeholder: string; icon: typeof User;
  value: string; onChange: (v: string) => void; type?: string; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</label>
      <div className="relative">
        <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-gray-300"
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Main Landing Component
──────────────────────────────────────────────── */
/* ────────────────────────────────────────────────
   Main Landing Component
──────────────────────────────────────────────── */
export function Landing({ onNavigate }: { onNavigate: (role: Role) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalVendors, setTotalVendors] = useState<number | null>(null);
  const [vendorPlanFile, setVendorPlanFile] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedMaster, setSelectedMaster] = useState<MasterItem | null>(null);

  const [activeClientOrder, setActiveClientOrder] = useState<any | null>(null);
  const [showClaimedModal, setShowClaimedModal] = useState(false);

  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const t = translations[language];

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  useScrollReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Poll for order status changes if client has an active order
  useEffect(() => {
    if (!activeClientOrder || activeClientOrder.status === 'accepted' || activeClientOrder.status === 'delivered') return;

    const interval = setInterval(async () => {
      try {
        const orderId = activeClientOrder.id || activeClientOrder._id;
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'orders',
            action: 'select',
            filters: { id: orderId }
          })
        });
        const d = await res.json();
        if (d.data && d.data[0]) {
          const updated = d.data[0];
          if (updated.status === 'accepted') {
            setActiveClientOrder(updated);
            setShowClaimedModal(true);
          }
        }
      } catch (e) { console.error(e); }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeClientOrder]);

  useEffect(() => {
    (async () => {
      try {
        const [iR, oR, vR, gR] = await Promise.all([
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'master_inventory', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'orders', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'vendors', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'guides', action: 'select' }) }),
        ]);
        const [id, od, vd, gd] = await Promise.all([iR.json(), oR.json(), vR.json(), gR.json()]);
        if (id.data) setMasterItems(id.data);
        if (od.data) setTotalOrders(od.data.length);
        if (vd.data) setTotalVendors(vd.data.length);
        if (gd.data) {
          const plans = gd.data.filter((g: any) => g.allowed_roles?.includes('vendor_plan'));
          if (plans.length > 0) {
            const latest = plans.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            setVendorPlanFile(latest.file_data);
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoadingItems(false); }
    })();
  }, []);

  const handleVendorPlanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (vendorPlanFile) {
      try {
        const arr = vendorPlanFile.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (err) {
        window.open(vendorPlanFile, '_blank');
      }
    } else {
      alert("Vendor plan document is currently unavailable.");
    }
  };

  const categories = ['All', ...Array.from(new Set(masterItems.map(m => m.category)))];
  const filtered = activeCategory === 'All' ? masterItems : masterItems.filter(m => m.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#F8F8FF] text-[#111118]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Active Order Live Tracking Floating Widget ── */}
      {activeClientOrder && activeClientOrder.status === 'pending' && (
        <div className="fixed bottom-6 left-6 z-40 max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-amber-400 text-gray-900 animate-bounce-slow">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold animate-pulse">
                📡
              </div>
              <div>
                <p className="font-extrabold text-xs text-amber-700 uppercase tracking-wider">Order Active &amp; Broadcasting</p>
                <p className="font-bold text-sm truncate max-w-[200px]">{activeClientOrder.item_name}</p>
              </div>
            </div>
            <button onClick={() => setActiveClientOrder(null)} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={14} />
            </button>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-100 flex justify-between items-center text-xs">
            <span className="text-gray-500 font-semibold">OTP Code: <strong className="text-amber-800 text-sm">{activeClientOrder.otp}</strong></span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold rounded-md text-[10px]">Broadcasting (9 Hrs)</span>
          </div>
        </div>
      )}

      {/* ── Vendor Claimed Order Pop-Up Modal ── */}
      {showClaimedModal && activeClientOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border-2 border-green-500 text-center space-y-4 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle size={44} className="text-green-600 animate-bounce" />
            </div>
            <div>
              <span className="px-3 py-1 bg-green-100 text-green-800 font-extrabold text-xs rounded-full uppercase tracking-wider">
                Order Claimed by Vendor 🎉
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Your Order is Claimed!
              </h2>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                A nearby verified kitchen vendor has accepted your wholesale order for <strong className="text-amber-700">{activeClientOrder.item_name}</strong>.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-1.5 text-xs text-amber-900">
              <p className="font-extrabold text-sm text-amber-800">📋 Order Details:</p>
              <p><strong className="text-gray-700">Item:</strong> {activeClientOrder.item_name} (x{activeClientOrder.quantity})</p>
              <p><strong className="text-gray-700">Delivery Address:</strong> {activeClientOrder.client_address}</p>
              <p><strong className="text-gray-700">Client Contact:</strong> {activeClientOrder.client_phone}</p>
              <p><strong className="text-amber-700 font-extrabold">Delivery OTP Code:</strong> <span className="font-extrabold text-base bg-amber-200/80 px-2 py-0.5 rounded text-amber-900">{activeClientOrder.otp}</span></p>
            </div>

            <p className="text-xs font-bold text-gray-500">
              📞 The vendor will contact you at <span className="text-amber-600">{activeClientOrder.client_phone}</span> shortly to coordinate delivery.
            </p>

            <button
              onClick={() => setShowClaimedModal(false)}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 text-white font-extrabold text-sm transition-all shadow-lg shadow-green-200"
            >
              Great, Thank You!
            </button>
          </div>
        </div>
      )}

      {/* ── Floating WhatsApp ──────────────────── */}
      <a href="https://wa.me/919175537373?text=Hello%20Vikram%20Advertising%2C%20I%20have%20an%20inquiry." target="_blank" rel="noopener noreferrer" className="wa-float" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ── Order Modal ────────────────────────── */}
      {selectedMaster && (
        <OrderModal
          master={selectedMaster}
          onClose={() => setSelectedMaster(null)}
          onOrderPlaced={(createdOrder) => {
            setTotalOrders(p => p !== null ? p + 1 : 1);
            setActiveClientOrder(createdOrder);
          }}
        />
      )}

      {/* ── Header ─────────────────────────────── */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100' : 'bg-[#F8F8FF]/80'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Vikrams Ads" className="h-11 w-auto object-contain" />
            <span className="font-extrabold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Vikrams Ads
            </span>
          </div>
          <nav className="flex items-center gap-3">
            {/* Multilingual Selector */}
            <div className="relative flex items-center gap-1.5 bg-gray-100/90 hover:bg-gray-200/90 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold transition-colors">
              <Globe size={14} className="text-amber-600" />
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-transparent outline-none cursor-pointer text-gray-800 font-extrabold text-xs"
              >
                <option value="en">🇬🇧 English</option>
                <option value="hi">🇮🇳 हिंदी</option>
                <option value="mr">🇮🇳 मराठी</option>
              </select>
            </div>

            <button onClick={handleVendorPlanClick} className="text-sm font-semibold text-gray-600 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-50">
              {t.plans}
            </button>
            <button onClick={() => onNavigate('login')} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              {t.loginRegister}
            </button>
          </nav>
        </div>
      </header>

      {/* ── KPI Section (MOVED TO TOP ABOVE MASTER INVENTORY ITEMS) ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-2">
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-amber-200">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-black/10 blur-xl" />
          <div className="relative z-10 text-center mb-8 reveal">
            <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1.5">{t.liveStats}</p>
            <h2 className="text-2xl md:text-4xl font-extrabold" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t.trustedByCommunity}
            </h2>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4 md:gap-6 max-w-lg mx-auto">
            <KpiCard icon={ShoppingBag} label={t.totalOrdersPlaced} value={totalOrders} />
            <KpiCard icon={Store} label={t.vendorsJoined} value={totalVendors} />
          </div>
        </div>
      </section>

      {/* ── Master Inventory Grid ───────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Items */}
        {loadingItems ? (
          <div className="flex justify-center items-center py-40"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 text-gray-400">
            <UtensilsCrossed size={44} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">{t.noItemsYet}</p>
            <p className="text-sm mt-1">{t.vendorsSettingUp}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((item, i) => (
              <div
                key={item.id}
                onClick={() => setSelectedMaster(item)}
                className={`inventory-card reveal reveal-delay-${Math.min((i % 4) + 1, 6)}`}
              >
                <div className="card-img relative">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} loading="lazy" />
                    : <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-amber-200"><UtensilsCrossed size={40} /></div>
                  }
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-600 border border-gray-100 shadow-sm">
                    {getItemTranslation(item.category, language)}
                  </span>
                  <div className="absolute inset-0 bg-amber-500/85 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight size={28} className="text-white" />
                    <span className="text-white text-sm font-bold tracking-wide">{t.selectOrder}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {getItemTranslation(item.name, language)}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────── */}
      <footer id="contact" className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-3 gap-12 items-start">
            <div className="reveal reveal-left">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Vikrams Ads" className="h-12 w-auto object-contain" />
                <span className="font-extrabold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Vikrams Ads</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{t.footNote}</p>
            </div>

            <div className="reveal">
              <h3 className="font-bold text-[#111118] text-sm mb-5 uppercase tracking-widest">{t.getInTouch}</h3>
              <ul className="space-y-3">
                {[
                  { href: 'tel:+919175537373', icon: Phone, label: '+91 91755 37373', color: 'amber' },
                  { href: 'https://wa.me/919175537373?text=Hello%20Vikrams%20Ads%2C%20I%20have%20an%20inquiry.', icon: MessageCircle, label: t.whatsAppUs, color: 'green' },
                  { href: 'mailto:2711vikram@gmail.com', icon: Mail, label: '2711vikram@gmail.com', color: 'amber' },
                  { href: 'mailto:vikram271@rediffmail.com', icon: Mail, label: 'vikram271@rediffmail.com', color: 'amber' },
                ].map(({ href, icon: Icon, label, color }) => (
                  <li key={label}>
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                      className={`flex items-center gap-3 text-sm text-gray-600 hover:text-${color}-600 transition-colors group`}>
                      <div className={`w-9 h-9 rounded-xl bg-${color}-50 group-hover:bg-${color}-100 flex items-center justify-center transition-colors shadow-sm`}>
                        <Icon size={15} className={`text-${color}-600`} />
                      </div>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal reveal-right">
              <h3 className="font-bold text-[#111118] text-sm mb-5 uppercase tracking-widest">{t.quickLinks}</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => onNavigate('login')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors">
                    <Lock size={14} /> {t.loginRegister}
                  </button>
                </li>
                <li>
                  <a href="https://wa.me/919175537373?text=Hi%2C%20I%20want%20to%20join%20as%20a%20vendor." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                    <Store size={14} /> {t.becomeVendor}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">{t.allRightsReserved}</p>
            <div className="flex items-center gap-3">
              {[
                { href: 'https://wa.me/919175537373?text=Hello%20Vikram%20Advertising%2C%20I%20have%20an%20inquiry.', Icon: MessageCircle, bg: 'bg-green-100 hover:bg-green-200', color: 'text-green-600' },
                { href: 'tel:+919175537373', Icon: Phone, bg: 'bg-amber-100 hover:bg-amber-200', color: 'text-amber-600' },
                { href: 'mailto:2711vikram@gmail.com', Icon: Mail, bg: 'bg-amber-100 hover:bg-amber-200', color: 'text-amber-600' },
              ].map(({ href, Icon, bg, color }) => (
                <a key={href} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center transition-colors`}>
                  <Icon size={16} className={color} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
