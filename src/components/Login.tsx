import { useState, useEffect } from 'react';
import {
  Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff,
  UserPlus, ChevronLeft, Phone, MapPin, Calendar,
  Hash, Store, Users, Shield
} from 'lucide-react';
import { Spinner, LanguageSelector, getInitialLanguage, type Language } from './ui';

type AuthMode = 'login' | 'signup' | 'reset';

const loginTranslations = {
  en: {
    backToHome: "Back to Home",
    title: "Login / Register",
    subtitle: "Access your workspace below",
    userLabel: "Email / Phone Number",
    userPlaceholder: "admin@email.com or +91 99999...",
    passLabel: "Password / Date of Birth",
    passPlaceholder: "Password or DDMMYYYY (e.g. 19072004)",
    hint: "Vendors: enter your DOB as 8 digits with no spaces, slashes, or dashes.",
    registration: "Registration",
    signIn: "Sign In to Dashboard",
    vendorRegTitle: "Vendor Sign-Up",
    vendorRegSub: "Register your kitchen to start receiving orders instantly.",
    loginCredTitle: "YOUR LOGIN CREDENTIALS",
    usernameRule: "🔑 Username = Your Phone Number",
    passwordRule: "🔑 Password = Your Date of Birth in DDMMYYYY format (e.g., 19072004)",
    fullNameLabel: "FULL NAME",
    fullNamePlaceholder: "Owner / Shop Name",
    phoneLabel: "PHONE NUMBER (WILL BE YOUR USERNAME)",
    phonePlaceholder: "10-digit mobile number",
    phoneHint: "Strictly 10 digits — numbers only.",
    dobLabel: "DATE OF BIRTH (WILL BE YOUR PASSWORD)",
    dobPlaceholder: "DDMMYYYY  e.g. 19072004",
    dobHint: "Strictly 8 digits — no slashes, dashes, or spaces. Example: 19072004 for July 19, 2004.",
    addressLabel: "ADDRESS",
    addressPlaceholder: "Street, Area...",
    pincodeLabel: "PIN CODE",
    pincodePlaceholder: "6-digit area PIN",
    submitApp: "Submit Application",
    alreadyRegistered: "Already registered? Sign In →"
  },
  hi: {
    backToHome: "मुख्यपृष्ठ पर वापस जाएं",
    title: "लॉगिन / रजिस्टर",
    subtitle: "नीचे अपने कार्यक्षेत्र तक पहुंचें",
    userLabel: "ईमेल / फोन नंबर",
    userPlaceholder: "admin@email.com या +91 99999...",
    passLabel: "पासवर्ड / जन्म तिथि (DOB)",
    passPlaceholder: "पासवर्ड या DDMMYYYY (उदा. 19072004)",
    hint: "विक्रेता: अपनी जन्म तिथि 8 अंकों में बिना किसी स्पेस या डैश के दर्ज करें।",
    registration: "नया पंजीकरण",
    signIn: "डैशबोर्ड में साइन इन करें",
    vendorRegTitle: "विक्रेता (वेंडर) साइन-अप",
    vendorRegSub: "तुरंत ऑर्डर प्राप्त करना शुरू करने के लिए अपनी रसोई पंजीकृत करें।",
    loginCredTitle: "आपके लॉगिन क्रेडेंशियल",
    usernameRule: "🔑 यूजरनेम = आपका फोन नंबर",
    passwordRule: "🔑 पासवर्ड = आपकी जन्म तिथि DDMMYYYY प्रारूप में (उदा. 19072004)",
    fullNameLabel: "पूरा नाम",
    fullNamePlaceholder: "मालिक / दुकान का नाम",
    phoneLabel: "फोन नंबर (यह आपका यूजरनेम होगा)",
    phonePlaceholder: "10-अंकों का मोबाइल नंबर",
    phoneHint: "केवल 10 अंक — केवल संख्याएं।",
    dobLabel: "जन्म तिथि (यह आपका पासवर्ड होगा)",
    dobPlaceholder: "DDMMYYYY  उदा. 19072004",
    dobHint: "केवल 8 अंक — कोई स्पेस या डैश नहीं। उदाहरण: 19072004",
    addressLabel: "पता",
    addressPlaceholder: "सड़क, क्षेत्र...",
    pincodeLabel: "पिन कोड",
    pincodePlaceholder: "6-अंकों का पिन कोड",
    submitApp: "आवेदन जमा करें",
    alreadyRegistered: "पहले से पंजीकृत हैं? साइन इन करें →"
  },
  mr: {
    backToHome: "मुख्य पानावर परत जा",
    title: "लॉगिन / नोंदणी",
    subtitle: "खाली तुमच्या खात्यात प्रवेश करा",
    userLabel: "ईमेल / फोन नंबर",
    userPlaceholder: "admin@email.com किंवा +91 99999...",
    passLabel: "पासवर्ड / जन्मतारीख (DOB)",
    passPlaceholder: "पासवर्ड किंवा DDMMYYYY (उदा. 19072004)",
    hint: "विक्रेते: तुमची जन्मतारीख ८ अंकांत कोणत्याही स्पेसशिवाय प्रविष्ट करा.",
    registration: "नवीन नोंदणी",
    signIn: "डॅशबोर्डवर साइन इन करा",
    vendorRegTitle: "विक्रेता (व्हेंडर) सायनिं-अप",
    vendorRegSub: "झटपट ऑर्डर मिळवणे सुरू करण्यासाठी तुमच्या किचनची नोंदणी करा.",
    loginCredTitle: "तुमची लॉगिन माहिती (क्रेडेंशियल्स)",
    usernameRule: "🔑 युझरनेम = तुमचा फोन नंबर",
    passwordRule: "🔑 पासवर्ड = तुमची जन्मतारीख DDMMYYYY स्वरूपात (उदा. 19072004)",
    fullNameLabel: "पूर्ण नाव",
    fullNamePlaceholder: "मालक / दुकानाचे नाव",
    phoneLabel: "फोन नंबर (हा तुमचा युझरनेम असेल)",
    phonePlaceholder: "१० अंकी मोबाईल नंबर",
    phoneHint: "फक्त १० अंक — केवळ संख्या.",
    dobLabel: "जन्मतारीख (हा तुमचा पासवर्ड असेल)",
    dobPlaceholder: "DDMMYYYY  उदा. 19072004",
    dobHint: "फक्त ८ अंक — कोणत्याही स्पेसशिवाय. उदाहरण: 19072004",
    addressLabel: "पत्ता",
    addressPlaceholder: "रस्ता, परिसर...",
    pincodeLabel: "पिन कोड",
    pincodePlaceholder: "६ अंकी परिसर पिन कोड",
    submitApp: "अर्ज सबमिट करा",
    alreadyRegistered: "आधीच नोंदणी केली आहे? साइन इन करा →"
  }
};

/* ── Reusable input ────────────────────────────── */
function Field({
  label, placeholder, type = 'text', value, onChange,
  icon: Icon, hint, maxLength, extra
}: {
  label: string; placeholder: string; type?: string;
  value: string; onChange: (v: string) => void;
  icon: typeof Phone; hint?: string; maxLength?: number;
  extra?: React.ReactNode;
}) {
  const [showPw, setShowPw] = useState(false);
  const inputType = type === 'password' ? (showPw ? 'text' : 'password') : type;
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type={inputType}
          value={value}
          maxLength={maxLength}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium outline-none focus:border-amber-500 focus:ring-3 focus:ring-amber-100 transition-all placeholder:text-gray-300"
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShowPw(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
        {extra}
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1 ml-1">{hint}</p>}
    </div>
  );
}

/* ── Main Component ────────────────────────────── */
export function Login({
  onLogin, onBack
}: {
  onLogin: (r: 'super_admin' | 'sub_admin' | 'vendor', cred?: string) => void;
  onBack: () => void;
}) {
  const [lang, setLang] = useState<Language>(getInitialLanguage);
  const t = loginTranslations[lang];

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

  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [sf, setSf] = useState({ name: '', phone: '', dob: '', address: '', pincode: '' });
  const patch = (k: keyof typeof sf) => (v: string) => setSf(p => ({ ...p, [k]: v }));

  const switchMode = (m: AuthMode) => { setMode(m); setError(''); setSuccess(''); };

  /* Login */
  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Invalid credentials');
      else onLogin(data.role, username.trim());
    } catch { setError('Network error — please try again'); }
    finally { setLoading(false); }
  };

  /* Vendor Signup */
  const handleSignup = async () => {
    setError(''); setSuccess('');
    if (!sf.name || !sf.phone || !sf.dob || !sf.address || !sf.pincode) {
      setError('All fields are required'); return;
    }
    if (!/^\d{8}$/.test(sf.dob)) {
      setError('Date of Birth must be exactly 8 digits in DDMMYYYY format'); return;
    }
    if (!/^\d{6}$/.test(sf.pincode)) {
      setError('PIN Code must be exactly 6 digits.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/vendors/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_name: sf.name,
          shop_name: sf.name,
          phone: sf.phone,
          dob: sf.dob,
          address: sf.address,
          zip_code: sf.pincode
        })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Registration failed');
      else {
        setSuccess('Application submitted! Your vendor account is pending verification by Super Admin.');
        setSf({ name: '', phone: '', dob: '', address: '', pincode: '' });
      }
    } catch { setError('Network error — please try again'); }
    finally { setLoading(false); }
  };

  /* Reset Password */
  const handleReset = async () => {
    setError(''); setSuccess('');
    if (!username) { setError('Enter your registered email address first'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Reset failed');
      else setSuccess(data.message || 'Reset link sent! Check your email inbox.');
    } catch { setError('Network error — please try again'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8FF] px-6 py-12 relative" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-semibold transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t.backToHome}
        </button>

        {/* Language Selector Top Right */}
        <div className="absolute top-6 right-6">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-md animate-scale-in">

          {/* ── LOGIN ───────────────────────────── */}
          {mode === 'login' && (
            <div className="space-y-6">
              <div>
                <img src="/logo.png" alt="Vikrams Ads" className="h-16 w-auto object-contain mb-5" />
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {t.title}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
              </div>

              <div className="space-y-4">
                <Field
                  label={t.userLabel}
                  placeholder={t.userPlaceholder}
                  value={username} onChange={setUsername}
                  icon={Phone}
                />
                <div>
                  <Field
                    label={t.passLabel}
                    placeholder={t.passPlaceholder}
                    type="password"
                    value={password} onChange={setPassword}
                    icon={Lock}
                    hint={t.hint}
                  />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 hover:underline"
                    >
                      <UserPlus size={13} /> {t.registration}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl font-medium">
                    <span className="mt-0.5">⚠</span> {error}
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading || !username || !password}
                  className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-amber-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : <><ArrowRight size={16} /> {t.signIn}</>}
                </button>
              </div>
            </div>
          )}

          {/* ── VENDOR SIGN-UP ──────────────────── */}
          {mode === 'signup' && (
            <div className="space-y-5">
              <div>
                <img src="/logo.png" alt="Vikrams Ads" className="h-16 w-auto object-contain mb-5" />
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {t.vendorRegTitle}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{t.vendorRegSub}</p>
              </div>

              {/* Credential rule callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm space-y-1">
                <p className="font-bold text-amber-800 text-xs uppercase tracking-wider">{t.loginCredTitle}</p>
                <p className="text-amber-700 text-xs">{t.usernameRule}</p>
                <p className="text-amber-700 text-xs">{t.passwordRule}</p>
              </div>

              <div className="space-y-3">
                <Field label={t.fullNameLabel} placeholder={t.fullNamePlaceholder} value={sf.name} onChange={patch('name')} icon={UserPlus} />
                <Field
                  label={t.phoneLabel}
                  placeholder={t.phonePlaceholder}
                  value={sf.phone}
                  onChange={(v) => patch('phone')(v.replace(/\D/g, '').slice(0, 10))}
                  icon={Phone}
                  maxLength={10}
                  hint={t.phoneHint}
                />
                <Field
                  label={t.dobLabel}
                  placeholder={t.dobPlaceholder}
                  value={sf.dob} onChange={patch('dob')}
                  icon={Calendar}
                  maxLength={8}
                  hint="Strictly 8 digits — no slashes, dashes, or spaces. Example: 19072004 for July 19, 2004."
                />
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field label="Address" placeholder="Street, Area..." value={sf.address} onChange={patch('address')} icon={MapPin} />
                  </div>
                  <div className="col-span-1">
                    <Field label="PIN Code" placeholder="110001" value={sf.pincode} onChange={patch('pincode')} icon={Hash} maxLength={6} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl font-medium">
                  <span className="mt-0.5">⚠</span> {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl font-medium">
                  ✅ {success}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1">
                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : <><ArrowRight size={16} /> Submit Application</>}
                </button>
                <button
                  onClick={() => switchMode('login')}
                  className="text-sm text-gray-500 hover:text-gray-800 font-semibold text-center transition-colors"
                >
                  Already registered? Sign In →
                </button>
              </div>
            </div>
          )}

          {/* ── RESET PASSWORD ──────────────────── */}
          {mode === 'reset' && (
            <div className="space-y-6">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 mb-5">
                  <Mail size={26} className="text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Reset Password
                </h2>
                <p className="text-gray-500 text-sm mt-1">Enter your Super Admin email to receive a temporary password.</p>
              </div>

              <Field
                label="Super Admin Email"
                placeholder="2711vikram@gmail.com"
                type="email"
                value={username} onChange={setUsername}
                icon={Mail}
              />

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl font-medium">
                  <span className="mt-0.5">⚠</span> {error}
                </div>
              )}
              {success && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-xl font-medium">
                  📧 {success}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleReset}
                  disabled={loading || !username}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : <><ArrowRight size={16} /> Send Reset Link</>}
                </button>
                <button
                  onClick={() => switchMode('login')}
                  className="text-sm text-gray-500 hover:text-gray-800 font-semibold text-center transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

        </div>
    </div>
  );
}
