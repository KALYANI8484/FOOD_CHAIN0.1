import { useEffect, useRef, useState } from 'react';
import {
  UtensilsCrossed, ArrowRight, Phone, Mail, MessageCircle,
  ShoppingBag, Store, X, Lock, MapPin, ChevronRight,
  ChevronLeft, Hash, User, CheckCircle, Globe,
  Users as UsersIcon, TrendingUp, Star, UserPlus
} from 'lucide-react';
import { Spinner, LanguageSelector } from './ui';

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
    avgVendorRating: "Avg Vendor Rating",
    itemCategories: "Item Categories",
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
    allRightsReserved: "© 2026 Vikram Ads. All rights reserved. | Made by KS-STUDIO (sangaonkar8484@gmail.com)",
    
    // New Sections i18n
    simpleAndFast: "Simple & Fast",
    howItWorks: "How It Works",
    placeYourOrderTitle: "Place Your Order",
    placeYourOrderDesc: "Select items, set quantities and confirm your details in under 30 seconds. No account needed to place a wholesale order.",
    realReviews: "Real Reviews",
    orderBroadcastIn: "order broadcast in",
    orderClaimedIn: "order claimed by vendor in",
    area: "area",
    forKitchenVendors: "🎪 For Kitchens",
    areYouAVendor: "Do You Run a Kitchen?",
    vendorJoinDesc: "Join 200+ verified kitchens already earning through our platform. Get instant access to nearby wholesale orders, manage your menu, and grow your business — setup takes minutes.",
    vendorBenefit1: "Nearby order radar — get matched automatically",
    vendorBenefit2: "Manage inventory by category with item limits",
    vendorBenefit3: "Subscription plans starting from ₹199/mo",
    vendorBenefit4: "Track earnings & orders in real-time",
    vendorBenefit5: "Verified badge builds instant client trust",
    verifiedVendorsOnboard: "Verified vendors already onboard",
    startingPlanCancel: "Starting plan — cancel anytime",
    joinViaWhatsapp: "Join via WhatsApp →",
    alreadyHaveAccount: "Already have an account? Login →"
  },
  hi: {
    plans: "प्लान्स",
    loginRegister: "लॉगिन / रजिस्टर",
    liveStats: "लाइव प्लेटफ़ॉर्म आंकड़े",
    trustedByCommunity: "हमारे समुदाय का विश्वास",
    totalOrdersPlaced: "कुल दिए गए ऑर्डर",
    vendorsJoined: "जुड़े विक्रेता (वेंडर्स)",
    avgVendorRating: "औसत विक्रेता रेटिंग",
    itemCategories: "आइटम श्रेणियां",
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
    allRightsReserved: "© 2026 विक्रम्स एड्स। सर्वाधिकार सुरक्षित।",

    // New Sections i18n
    simpleAndFast: "सरल और त्वरित",
    howItWorks: "यह कैसे काम करता है",
    placeYourOrderTitle: "अपना ऑर्डर दें",
    placeYourOrderDesc: "30 सेकंड से भी कम समय में आइटम चुनें, मात्रा निर्धारित करें और विवरण की पुष्टि करें। थोक ऑर्डर देने के लिए किसी खाते की आवश्यकता नहीं है।",
    realReviews: "वास्तविक समीक्षाएं",
    orderBroadcastIn: "ऑर्डर प्रसारित किया गया",
    orderClaimedIn: "विक्रेता द्वारा स्वीकार किया गया",
    area: "क्षेत्र में",
    forKitchenVendors: "🎪 रसोईघर के लिए",
    areYouAVendor: "क्या आप अपनी रसोई (किचन) चलाते हैं?",
    vendorJoinDesc: "200+ सत्यापित किचन से जुड़ें जो हमारे प्लेटफ़ॉर्म के माध्यम से कमा रहे हैं। नजदीकी थोक ऑर्डर प्राप्त करें और अपना व्यवसाय बढ़ाएं।",
    vendorBenefit1: "नजदीकी ऑर्डर रडार — स्वचालित रूप से जुड़ें",
    vendorBenefit2: "श्रेणी के अनुसार इन्वेंटरी प्रबंधित करें",
    vendorBenefit3: "₹199/माह से शुरू होने वाले सब्सक्रिप्शन प्लान",
    vendorBenefit4: "वास्तविक समय में कमाई और ऑर्डर ट्रैक करें",
    vendorBenefit5: "सत्यापित बैज ग्राहकों का विश्वास बढ़ाता है",
    verifiedVendorsOnboard: "सत्यापित विक्रेता जुड़े हुए हैं",
    startingPlanCancel: "शुरुआती प्लान — कभी भी रद्द करें",
    joinViaWhatsapp: "व्हाट्सएप के जरिए जुड़ें →",
    alreadyHaveAccount: "क्या आपके पास पहले से खाता है? लॉगिन करें →"
  },
  mr: {
    plans: "प्लॅन्स",
    loginRegister: "लॉगिन / नोंदणी",
    liveStats: "लाइव्ह प्लॅटफॉर्म आकडेवारी",
    trustedByCommunity: "आमच्या समुदायाचा विश्वास",
    totalOrdersPlaced: "एकूण दिलेले ऑर्डर",
    vendorsJoined: "जोडलेले विक्रेते (व्हेंडर्स)",
    avgVendorRating: "सरासरी विक्रेता रेटिंग",
    itemCategories: "वस्तू श्रेणी",
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
    allRightsReserved: "© २०२६ विक्रम्स ॲड्स. सर्व हक्क राखीव.",

    // New Sections i18n
    simpleAndFast: "सोपे आणि जलद",
    howItWorks: "हे कसे काम करते",
    placeYourOrderTitle: "तुमची ऑर्डर द्या",
    placeYourOrderDesc: "३० सेकंदांपेक्षा कमी वेळात वस्तू निवडा, प्रमाण ठरवा आणि तपशीलाची खात्री करा. घाऊक ऑर्डर देण्यासाठी कोणत्याही खात्याची गरज नाही.",
    realReviews: "खऱ्या प्रतिक्रिया",
    orderBroadcastIn: "ऑर्डर पाठवली",
    orderClaimedIn: "विक्रेत्याने स्वीकारली",
    area: "परिसरात",
    forKitchenVendors: "🎪 किचनसाठी",
    areYouAVendor: "तुम्ही तुमचे किचन चालवता का?",
    vendorJoinDesc: "आमच्या प्लॅटफॉर्मद्वारे कमाई करणाऱ्या २००+ पडताळणी केलेल्या किचनमध्ये सामील व्हा. जवळील घाऊक ऑर्डर मिळवा आणि तुमचा व्यवसाय वाढवा.",
    vendorBenefit1: "जवळील ऑर्डर रडार — आपोआप जोडा",
    vendorBenefit2: "श्रेणीनुसार इन्व्हेंटरी व्यवस्थापित करा",
    vendorBenefit3: "₹१९९/महिना पासून सुरू होणारे प्लॅन्स",
    vendorBenefit4: "रिअल-टाइममध्ये कमाई आणि ऑर्डर मागोवा घ्या",
    vendorBenefit5: "वेरीफाइड बॅज ग्राहकांचा विश्वास वाढवतो",
    verifiedVendorsOnboard: "पडताळणी केलेले विक्रेते जोडले गेले आहेत",
    startingPlanCancel: "सुरुवातीचा प्लॅन — कधीही रद्द करा",
    joinViaWhatsapp: "व्हाट्सॲप द्वारे सामील व्हा →",
    alreadyHaveAccount: "आधीपासून खाते आहे का? लॉगिन करा →"
  }
};

export const getItemTranslation = (name: string, lang: Language): string => {
  if (!name || lang === 'en') return name;
  const clean = name.toLowerCase().replace(/[^a-z0-9]/gi, ' ').trim();
  
  if (clean.includes('dairy') || clean.includes('milk')) return lang === 'hi' ? 'डेयरी और दूध' : 'डेअरी आणि दूध';
  if (clean.includes('bakery') || clean.includes('sweet')) return lang === 'hi' ? 'बेकरी और मिठाई' : 'बेकरी आणि मिठाई';
  if (clean.includes('full tiffin')) return lang === 'hi' ? 'फुल टिफिन' : 'फुल डबा (टिफिन)';
  if (clean.includes('poli bhaji')) return lang === 'hi' ? 'पोळी भाजी (डिलीवरी के साथ)' : 'पोळी भाजी (डिलिव्हरीसह)';
  if (clean.includes('breakfast') || clean.includes('breakfasst')) return lang === 'hi' ? 'नाश्ता और स्नैक्स' : 'न्याहारी आणि फराळ';
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

/* ── Marquee Ticker (real orders, privacy-safe) ─────── */
const CAT_EMOJI: Record<string, string> = {
  tiffin: '🍱', dairy: '🥛', milk: '🥛', bakery: '🍞',
  breakfast: '☀️', thali: '🍽️', sweets: '🎮', snacks: '🥨', general: '✅',
};
const catEmoji = (cat: string) => {
  const l = (cat || '').toLowerCase();
  for (const [k, e] of Object.entries(CAT_EMOJI)) if (l.includes(k)) return e;
  return '🛒';
};

function MarqueeTicker({ recentOrders, t, lang }: { recentOrders: any[]; t: any; lang: Language }) {
  const messages = recentOrders.length > 0
    ? recentOrders.map(o => {
        const emoji = catEmoji(o.master_category_name || o.item_name || '');
        const catName = o.master_category_name || (o.item_name || 'Food').split(' ')[0];
        const translatedCat = getItemTranslation(catName, lang);
        const zip3  = (o.client_zip || '000').substring(0, 3);
        const verb  = o.status === 'accepted' ? (t.orderClaimedIn || 'order claimed by vendor in') : (t.orderBroadcastIn || 'order broadcast in');
        const area  = t.area || 'area';
        return `${emoji} ${translatedCat} ${verb} ${zip3}xxx ${area}`;
      })
    : [
        `🍱 ${getItemTranslation('Tiffin', lang)} ${t.orderBroadcastIn || 'order broadcast in'} 416xxx ${t.area || 'area'}`,
        `🥛 ${getItemTranslation('Dairy & Milk', lang)} ${t.orderClaimedIn || 'order claimed by vendor in'} 560xxx ${t.area || 'area'}`,
        `🍞 ${getItemTranslation('Bakery', lang)} ${t.orderBroadcastIn || 'order broadcast in'} 411xxx ${t.area || 'area'}`,
        `🍽️ ${getItemTranslation('Thali', lang)} ${t.orderClaimedIn || 'order claimed by vendor in'} 416xxx ${t.area || 'area'}`,
      ];
  const all = [...messages, ...messages, ...messages, ...messages];
  return (
    <div className="bg-[#1C0609] border-y border-[#C5A059]/20 overflow-hidden py-2.5 relative">
      <div className="ticker-track animate-ticker" style={{ animationDuration: `${Math.max(30, all.length * 4)}s` }}>
        {all.map((msg, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-sm font-semibold text-[#C5A059]/90 px-6 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {msg}
            <span className="text-[#C5A059]/25 ml-4">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── How It Works ────────────────────────────── */
function HowItWorks({ t }: { t: any }) {
  return (
    <section className="max-w-xl mx-auto px-6 py-10">
      <div className="text-center mb-6 reveal">
        <p className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-1.5">{t.simpleAndFast || 'Simple & Fast'}</p>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#2B2B2B]" style={{ fontFamily:"'Playfair Display', serif" }}>{t.howItWorks || 'How It Works'}</h2>
      </div>
      <div className="reveal relative text-center p-8 rounded-3xl bg-white border border-[#E5DFC9] shadow-md hover:shadow-xl transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4A0E17] to-[#6d1324] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#4A0E17]/20">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="font-extrabold text-xl text-[#2B2B2B] mb-2">Place Your Order</h3>
        <p className="text-sm text-[#6E6B65] leading-relaxed">
          Select items, set quantities and confirm your details in under 30 seconds. No account needed to place a wholesale order.
        </p>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────── */
function Testimonials() {
  const reviews = [
    { initials:'RM', name:'Rajesh M.', role:'Caterer · Kolhapur', stars:5,
      text:'"Got 50 tiffins arranged for our corporate event within hours. Vendor connected instantly and everything was fresh. Incredible platform!"' },
    { initials:'SP', name:'Sunita P.', role:'Hostel Manager · Pune', stars:5,
      text:'"We order dairy products every week for 80+ students. Wholesale pricing is unbeatable and vendors are always verified. Highly recommended!"' },
    { initials:'AK', name:'Arun K.', role:'Event Organizer · Sangli', stars:5,
      text:'"Placed a bulk breakfast order for 200 guests at midnight, confirmed within minutes. A game-changer for local food sourcing."' },
  ];
  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="text-center mb-10 reveal">
        <p className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-2">Real Reviews</p>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#2B2B2B]" style={{ fontFamily:"'Playfair Display', serif" }}>Trusted by Our Community</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r, i) => (
          <div key={i} className={`reveal reveal-delay-${i+1} p-7 rounded-3xl bg-white border border-[#E5DFC9] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4A0E17] to-[#C5A059] flex items-center justify-center text-white font-black text-sm">{r.initials}</div>
              <div>
                <p className="font-extrabold text-[#2B2B2B] text-sm">{r.name}</p>
                <p className="text-xs text-[#6E6B65]">{r.role}</p>
              </div>
            </div>
            <div className="flex gap-0.5 mb-3">{Array.from({ length: r.stars }).map((_,j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}</div>
            <p className="text-sm text-[#6E6B65] leading-relaxed italic">{r.text}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 mt-10 reveal">
        {['✅ Verified Vendors','🔒 Secure Orders','📍 Local Network','💬 WhatsApp Support','🏆 Trusted Platform'].map(b => (
          <span key={b} className="text-xs font-bold text-[#6E6B65] bg-white border border-[#E5DFC9] px-4 py-2 rounded-full shadow-xs hover:border-[#C5A059]/40 transition-colors cursor-default">{b}</span>
        ))}
      </div>
    </section>
  );
}

/* ── Vendor Join Section ────────────────────────── */
function VendorJoinSection({ onNavigate, t }: { onNavigate: (r: any) => void; t: any }) {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-16 pt-4">
      <div className="reveal relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#4A0E17] via-[#360910] to-[#1C0609] border border-[#C5A059]/30 p-10 md:p-14 text-white shadow-2xl shadow-[#4A0E17]/30">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#C5A059]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-black/30 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight" style={{ fontFamily:"'Playfair Display', serif" }}>{t.areYouAVendor || 'Do You Run a Kitchen?'}</h2>
            <p className="text-white/70 text-sm leading-relaxed mb-6">{t.vendorJoinDesc || 'Join 200+ verified kitchens already earning through our platform. Get instant access to nearby wholesale orders, manage your menu, and grow your business — setup takes minutes.'}</p>
            <ul className="space-y-2.5">
              {[
                ['🎯', t.vendorBenefit1 || 'Nearby order radar — get matched automatically'],
                ['📦', t.vendorBenefit2 || 'Manage inventory by category with item limits'],
                ['💰', t.vendorBenefit3 || 'Subscription plans starting from ₹199/mo'],
                ['📊', t.vendorBenefit4 || 'Track earnings & orders in real-time'],
                ['✅', t.vendorBenefit5 || 'Verified badge builds instant client trust'],
              ].map(([icon, text]) => (
                <li key={text} className="text-sm text-white/80 flex items-start gap-2">
                  <span className="shrink-0 text-base">{icon}</span><span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm text-center">
              <p className="text-4xl font-extrabold text-[#C5A059] mb-1" style={{ fontFamily:"'Playfair Display', serif" }}>200+</p>
              <p className="text-white/70 text-sm font-semibold">{t.verifiedVendorsOnboard || 'Verified kitchens already onboard'}</p>
              <div className="my-4 h-px bg-white/10" />
              <p className="text-2xl font-extrabold text-white mb-1">₹199<span className="text-base font-semibold text-white/60">/mo</span></p>
              <p className="text-white/60 text-xs">{t.startingPlanCancel || 'Starting plan — cancel anytime'}</p>
            </div>
            <button
              onClick={() => onNavigate('signup')}
              className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-[#C5A059] hover:bg-[#D4B36E] text-[#4A0E17] font-extrabold text-base transition-all shadow-lg shadow-[#C5A059]/30 active:scale-95 btn-shine cursor-pointer"
            >
              <UserPlus size={18} /> Register Kitchen Online &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
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
  t: any;
  lang: Language;
}

function OrderModal({ master, onClose, onOrderPlaced, t, lang }: OrderModalProps) {
  const [step, setStep] = useState<ModalStep>(1);
  const [step2Choice, setStep2Choice] = useState<'enquiry' | 'place' | null>(null);
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

  const activeSelectedSubItems = subItems.filter(item => {
    const key = item.id || (item as any)._id;
    return !!selectedItemIds[key];
  });

  const effectiveItems = activeSelectedSubItems.length > 0
    ? activeSelectedSubItems
    : [{
        id: master.id || (master as any)._id || 'master_item',
        name: master.name,
        price: master.price ?? master.base_price ?? 99,
        quantity: 1,
        uom: 'order'
      }];

  const totalPrice = effectiveItems.reduce((sum, item) => {
    const key = item.id || (item as any)._id;
    const q = selectedQuantities[key] || Number(item.quantity) || 1;
    return sum + (Number(item.price ?? master.base_price ?? 99) * q);
  }, 0);

  const totalItemCount = effectiveItems.reduce((sum, item) => {
    const key = item.id || (item as any)._id;
    return sum + (selectedQuantities[key] || Number(item.quantity) || 1);
  }, 0);

  const summaryItemName = effectiveItems
    .map(i => {
      const key = i.id || (i as any)._id;
      const q = selectedQuantities[key] || i.quantity || 1;
      const uom = (i as any).uom || 'pc';
      return `${i.name} (${q} ${uom})`;
    })
    .join(', ');

  const handlePlaceOrder = async () => {
    if (!form.name || !form.phone || !form.address || !form.zip || !form.landmark) {
      alert('All fields are required');
      return;
    }
    setSubmitting(true);
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const masterId = master.id || (master as any)._id || '';
    const firstItemId = effectiveItems[0]?.id || (effectiveItems[0] as any)?._id || masterId;

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
            item_id: firstItemId,
            master_category_name: master.name,
            price: totalPrice,
            quantity: totalItemCount,
            status: 'awaiting_subadmin_approval',
            otp: generatedOtp,
            created_at: new Date().toISOString()
          }
        })
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setOtp(generatedOtp);
      setStep(3);
      onOrderPlaced(d.data || d);
    } catch (e: any) {
      console.error('Order error:', e);
      alert(e.message || 'Failed to place order. Try again.');
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="relative min-h-[170px] sm:min-h-[200px] max-h-[240px] bg-slate-950 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src={master.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
            alt={master.name}
            className="w-full h-full object-contain max-h-[240px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-3 left-4 right-4 z-10">
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">{master.category}</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {master.name}
            </h2>
          </div>
          {/* Step indicator */}
          <div className="absolute top-3 left-4 flex items-center gap-1.5 z-10">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === 3 ? 'bg-green-400' : step >= s ? 'bg-amber-400 w-8' : 'bg-white/40 w-4'}`} />
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
                  Select items
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Select items and customize quantities</p>
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
                            <p className="font-bold text-gray-900 truncate text-sm">{getItemTranslation(item.name, (localStorage.getItem('app_language') as Language || 'en'))}</p>
                            <p className="text-amber-700 font-extrabold text-xs mt-0.5">
                              ₹{item.price} / {itemUom}
                            </p>
                          </div>
                        </div>

                        {/* Right Section: Quantity Controller + minimum order badge underneath */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {isSelected && (
                            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-amber-300 shadow-sm">
                              <button
                                onClick={() => updateItemQuantity(itemId, -1, minQty)}
                                disabled={currentQty <= minQty}
                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-700 font-bold flex items-center justify-center text-sm disabled:opacity-40"
                                title={`minimum order: ${minQty} ${itemUom}`}
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
                          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100/90 text-amber-900 rounded-md shadow-xs">
                            minimum order: {minQty} {itemUom}
                          </span>
                        </div>
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
                  How would you like to proceed?
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/919175537373?text=${encodeURIComponent(`Hello Vikram Ads, I have an enquiry regarding ${summaryItemName} (₹${totalPrice}).`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setStep2Choice('enquiry')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 transition-all text-center ${
                    step2Choice === 'enquiry' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  <MessageCircle size={22} className="text-green-600" />
                  <span className="font-bold text-sm text-gray-900">Enquiry Order 💬</span>
                  <span className="text-[11px] text-gray-500">Chat with us on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setStep2Choice('place')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 transition-all text-center cursor-pointer ${
                    step2Choice === 'place' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  <ShoppingBag size={22} className="text-amber-600" />
                  <span className="font-bold text-sm text-gray-900">Place an Order 🛒</span>
                  <span className="text-[11px] text-gray-500">Enter delivery details</span>
                </button>
              </div>

              {step2Choice === 'place' && (
              <>
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
              </>
              )}
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
          {step === 1 && (
            <button
              disabled={effectiveItems.length === 0}
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-200 disabled:opacity-40"
            >
              Continue to Details ({effectiveItems.length} items • ₹{totalPrice}) <ChevronRight size={18} />
            </button>
          )}
          {step === 2 && (
            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setStep2Choice(null); }}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 text-sm font-semibold transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
              {step2Choice === 'place' && (
                <button
                  disabled={submitting || !form.name || !form.phone || !form.address || !form.zip || !form.landmark}
                  onClick={handlePlaceOrder}
                  className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-200 disabled:opacity-40"
                >
                  {submitting ? <Spinner /> : <><ArrowRight size={16} /> Place Order — ₹{totalPrice}</>}
                </button>
              )}
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
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showStickyBar, setShowStickyBar] = useState(true);

  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const t = translations[language];

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    window.dispatchEvent(new Event('app_language_change'));
  };

  useEffect(() => {
    const handleStorage = () => {
      const updated = (localStorage.getItem('app_language') as Language) || 'en';
      setLanguage(updated);
    };
    window.addEventListener('app_language_change', handleStorage);
    return () => window.removeEventListener('app_language_change', handleStorage);
  }, []);

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
        const [iR, oR, vR, gR, sR] = await Promise.all([
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'master_inventory', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'orders', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'vendors', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'guides', action: 'select' }) }),
          fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'settings', action: 'select' }) }),
        ]);
        const [id, od, vd, gd, sd] = await Promise.all([iR.json(), oR.json(), vR.json(), gR.json(), sR.json()]);
        
        const settingsOffset = sd.data?.[0]?.live_orders_offset || 764;
        
        if (id.data) setMasterItems(id.data);
        if (od.data) {
          setTotalOrders(od.data.length + settingsOffset);
          // Privacy-safe ticker: last 10 orders, only category + zip3
          setRecentOrders([...od.data].reverse().slice(0, 10));
          setOrders(od.data);
        }
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
  const categoryCount = Array.from(new Set(masterItems.map(m => m.category))).filter(Boolean).length;

  // Real lifetime order counts per dish, keyed by master item name (matches order.master_category_name,
  // not order.item_name — the latter is a formatted "name (qty uom)" checkout summary string).
  // "System Denied" orders are excluded: that status means no vendor accepted the order within the
  // pickup window, so it never represents real fulfilled demand.
  const realOrderCounts: Record<string, number> = {};
  for (const o of orders) {
    if (o.status === 'System Denied' || !o.master_category_name) continue;
    realOrderCounts[o.master_category_name] = (realOrderCounts[o.master_category_name] || 0) + (Number(o.quantity) || 0);
  }

  const NEW_ITEM_BASELINE_COUNT = 5;
  const getOrderedCount = (name: string) => {
    const real = realOrderCounts[name] || 0;
    return real > 0 ? { value: real, isBaseline: false } : { value: NEW_ITEM_BASELINE_COUNT, isBaseline: true };
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#2B2B2B]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

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
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 fill-white">
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
          t={t}
          lang={language}
        />
      )}

      {/* ── HEADER ───────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#4A0E17]/90 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 px-3.5 py-1.5 rounded-2xl bg-[#360910] border border-[#C5A059]/40 shadow-sm">
            <img src="/logo.png" alt="Vikram Ads" className="h-9 sm:h-11 w-auto object-contain shrink-0 filter drop-shadow-sm" />
            <span className="font-black text-lg sm:text-xl tracking-tight text-[#C5A059] drop-shadow-xs" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Vikram Ads</span>
          </div>
          <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <LanguageSelector onChange={(l) => changeLanguage(l)} />
            <button onClick={handleVendorPlanClick} className="text-xs sm:text-sm font-semibold text-[#F7F4EF] hover:text-[#C5A059] transition-colors px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg hover:bg-white/10">{t.plans}</button>
            <button onClick={() => onNavigate('login')} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#C5A059] hover:bg-[#D4B36E] active:scale-95 text-[#4A0E17] text-xs sm:text-sm font-extrabold transition-all shadow-md hover:shadow-lg truncate">{t.loginRegister}</button>
          </nav>
        </div>
      </header>

      {/* ── HERO SECTION ──────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#4A0E17] via-[#360910] to-[#1C0609] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-[#C5A059]/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-black/30 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/30 text-[#C5A059] text-xs font-black uppercase tracking-wider mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Maharashtra’s Wholesale Food Network
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight animate-fade-in-up" style={{ fontFamily:"'Playfair Display', serif" }}>
            Fresh Bulk Food,<br /><span className="text-[#C5A059]">Verified Local Vendors</span>
          </h1>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-full" fill="#F7F4EF"><path d="M0,48 C360,0 1080,48 1440,0 L1440,48 Z" /></svg>
        </div>
      </section>

      <MarqueeTicker recentOrders={recentOrders} t={t} lang={language} />

      <section className="max-w-7xl mx-auto px-6 pt-2 pb-8">
        <div className="relative bg-gradient-to-br from-[#4A0E17] via-[#360910] to-[#4A0E17] border border-[#C5A059]/40 rounded-3xl p-8 md:p-10 text-[#F7F4EF] overflow-hidden shadow-xl shadow-[#4A0E17]/20">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#C5A059]/10 blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-black/20 blur-xl" />
          <div className="relative z-10 text-center mb-8 reveal">
            <p className="text-xs font-bold text-[#C5A059] uppercase tracking-widest mb-1.5">{t.liveStats}</p>
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#F7F4EF]" style={{ fontFamily:"'Playfair Display', serif" }}>{t.trustedByCommunity}</h2>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
            <KpiCard icon={ShoppingBag} label={t.totalOrdersPlaced} value={totalOrders} />
            <KpiCard icon={Store} label={t.vendorsJoined} value={totalVendors} />
          </div>
        </div>
      </section>

      <main id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Finger-Scrollable Category Filter Bar ── */}
        <div className="touch-scroll-x flex items-center gap-2 pb-3 mb-6">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer shrink-0 border active:scale-95 ${
                  isActive
                    ? 'bg-[#4A0E17] text-[#C5A059] border-[#C5A059] shadow-md scale-105'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {cat === 'All' ? '✨ All Categories' : cat}
              </button>
            );
          })}
        </div>

        {loadingItems ? <div className="flex justify-center items-center py-40"><Spinner /></div> : filtered.length === 0 ? (
          <div className="text-center py-32 text-gray-400">
            <UtensilsCrossed size={44} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">{t.noItemsYet}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((item, i) => {
              const { value: orderedCount, isBaseline } = getOrderedCount(item.name);
              return (
                <div key={item.id} onClick={() => setSelectedMaster(item)} className="inventory-card">
                  <div className="card-img relative">
                    <span className="orders-badge">{isBaseline ? '+' : ''}{orderedCount} ordered</span>
                    {item.image_url ? <img src={item.image_url} alt={item.name} /> : <div className="w-full h-full bg-amber-50" />}
                  </div>
                  <div className="p-4"><h3 className="font-bold text-gray-900 truncate">{getItemTranslation(item.name, language)}</h3></div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <HowItWorks t={t} />
      <Testimonials t={t} />
      <VendorJoinSection onNavigate={onNavigate} t={t} />

      <footer id="contact" className="border-t border-[#C5A059]/30 bg-[#1C0609] text-[#F7F4EF] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-3 gap-12 items-start">
            <div className="reveal reveal-left">
              <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 rounded-2xl bg-[#360910] border border-[#C5A059]/40 shadow-sm">
                <span className="font-black text-xl tracking-tight text-[#C5A059]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Vikram Ads
                </span>
              </div>
              <p className="text-[#EFECE6]/80 text-sm leading-relaxed">{t.footNote}</p>
            </div>

            <div className="reveal">
              <h3 className="font-bold text-[#C5A059] text-sm mb-5 uppercase tracking-widest">{t.getInTouch}</h3>
              <ul className="space-y-3">
                {[
                  { href: 'tel:+919175537373', icon: Phone, label: '+91 91755 37373' },
                  { href: 'https://wa.me/919175537373?text=Hello%20Vikram%20Ads%2C%20I%20have%20an%20inquiry.', icon: MessageCircle, label: t.whatsAppUs },
                  { href: 'mailto:2711vikram@gmail.com', icon: Mail, label: '2711vikram@gmail.com' },
                  { href: 'mailto:vikram271@rediffmail.com', icon: Mail, label: 'vikram271@rediffmail.com' },
                ].map(({ href, icon: Icon, label }) => (
                  <li key={label}>
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-[#F7F4EF]/80 hover:text-[#C5A059] transition-colors group">
                      <div className="w-9 h-9 rounded-xl bg-[#360910] border border-[#C5A059]/30 group-hover:bg-[#4A0E17] flex items-center justify-center transition-colors shadow-sm">
                        <Icon size={15} className="text-[#C5A059]" />
                      </div>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal reveal-right">
              <h3 className="font-bold text-[#C5A059] text-sm mb-5 uppercase tracking-widest">{t.quickLinks}</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => onNavigate('login')} className="flex items-center gap-2 text-sm text-[#F7F4EF]/80 hover:text-[#C5A059] transition-colors">
                    <Lock size={14} className="text-[#C5A059]" /> {t.loginRegister}
                  </button>
                </li>
                <li>
                  <a href="https://wa.me/919175537373?text=Hi%2C%20I%20want%20to%20join%20as%20a%20vendor." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#F7F4EF]/80 hover:text-[#C5A059] transition-colors">
                    <Store size={14} className="text-[#C5A059]" /> {t.becomeVendor}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#C5A059]/20 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#EFECE6]/60">{t.allRightsReserved}</p>
            <div className="flex items-center gap-3">
              {[
                { href: 'https://wa.me/919175537373?text=Hello%20Vikram%20Advertising%2C%20I%20have%20an%20inquiry.', Icon: MessageCircle },
                { href: 'tel:+919175537373', Icon: Phone },
                { href: 'mailto:2711vikram@gmail.com', Icon: Mail },
              ].map(({ href, Icon }) => (
                <a key={href} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#360910] border border-[#C5A059]/40 flex items-center justify-center transition-colors hover:bg-[#4A0E17]">
                  <Icon size={16} className="text-[#C5A059]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
      {/* ── STICKY MOBILE BOTTOM CTA ────────────────── */}
      {showStickyBar && !selectedMaster && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 animate-slide-up">
          <div className="bg-white/95 backdrop-blur-lg border-t border-[#E5DFC9] px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#4A0E17] truncate">🛒 Wholesale food from local kitchens</p>
              <p className="text-[10px] text-[#6E6B65] font-semibold">Order in under 30 seconds</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowStickyBar(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              ><X size={14} /></button>
              <button
                onClick={() => { document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); setShowStickyBar(false); }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#C5A059] text-[#4A0E17] font-extrabold text-sm shadow-lg shadow-[#C5A059]/30 active:scale-95 transition-all btn-shine"
              >
                Order Now <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
