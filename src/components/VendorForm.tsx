import { useEffect, useState } from 'react';
import { supabase, type Plan } from '../lib/supabase';
import { Input, Select, Button, Spinner, useSyncedLanguage, type Language } from './ui';

interface VendorFormProps {
  initialData?: any;
  submitLabel: string;
  onSubmit: (formData: any) => Promise<void>;
  onCancel?: () => void;
}

const vfTrans = {
  en: {
    ownerName: "Owner Name",
    phone: "Phone Number",
    phonePlaceholder: "10-digit mobile number",
    email: "Email Address",
    shopName: "Shop / Brand Name",
    dob: "Birthdate (DDMMYYYY)",
    dobPlaceholder: "e.g. 19072004",
    address: "Full Address",
    zipCode: "ZIP Code",
    subPlan: "Subscription Plan",
    validity: "Validity",
    days: "Days",
    clients: "Clients",
    cancel: "Cancel",
    saving: "Saving...",
  },
  hi: {
    ownerName: "मालिक का नाम",
    phone: "फोन नंबर",
    phonePlaceholder: "10-अंकों का मोबाइल नंबर",
    email: "ईमेल पता",
    shopName: "दुकान / ब्रांड का नाम",
    dob: "जन्म तिथि (DDMMYYYY)",
    dobPlaceholder: "उदा. 19072004",
    address: "पूरा पता",
    zipCode: "पिन कोड",
    subPlan: "सदस्यता योजना (सब्सक्रिप्शन प्लान)",
    validity: "वैधता",
    days: "दिन",
    clients: "ग्राहक",
    cancel: "रद्द करें",
    saving: "सहेज रहे हैं...",
  },
  mr: {
    ownerName: "मालकाचे नाव",
    phone: "फोन नंबर",
    phonePlaceholder: "१० अंकी मोबाईल नंबर",
    email: "ईमेल पत्ता",
    shopName: "दुकान / ब्रँडचे नाव",
    dob: "जन्मतारीख (DDMMYYYY)",
    dobPlaceholder: "उदा. 19072004",
    address: "पूर्ण पत्ता",
    zipCode: "पिन कोड",
    subPlan: "सबस्क्रिप्शन प्लॅन",
    validity: "मुदत",
    days: "दिवस",
    clients: "ग्राहक",
    cancel: "रद्द करा",
    saving: "जतन करत आहे...",
  }
};

export function VendorForm({ initialData, submitLabel, onSubmit, onCancel }: VendorFormProps) {
  const [lang] = useSyncedLanguage();

  const t = vfTrans[lang];
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const formatToDdMmYyyy = (value: string) => {
    if (!value) return '';
    const digitsOnly = value.replace(/\D/g, '');
    if (value.match(/^(\d{4})-(\d{2})-(\d{2})$/)) {
      const [, year, month, day] = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)!;
      return `${day}${month}${year}`;
    }
    return digitsOnly;
  };

  const normalizeDateInputValue = (value: string) => {
    if (!value) return '';
    return value.replace(/\D/g, '');
  };

  const [form, setForm] = useState({
    owner_name: initialData?.owner_name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    shop_name: initialData?.shop_name || '',
    address: initialData?.address || '',
    zip_code: initialData?.zip_code || '',
    birthdate: normalizeDateInputValue(initialData?.birthdate || ''),
    password: '',
    confirm_password: '',
    plan_id: initialData?.plan_id || '',
    logo_url: initialData?.logo_url || '',
    qr_url: initialData?.qr_url || '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        owner_name: initialData.owner_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        shop_name: initialData.shop_name || '',
        address: initialData.address || '',
        zip_code: initialData.zip_code || '',
        birthdate: normalizeDateInputValue(initialData.birthdate || ''),
        password: '',
        confirm_password: '',
        plan_id: initialData.plan_id || '',
        logo_url: initialData.logo_url || '',
        qr_url: initialData.qr_url || '',
      });
    }
  }, [initialData]);

  const selectedPlan = plans.find((p) => p.id === form.plan_id);
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const endDate = selectedPlan
    ? new Date(today.getTime() + selectedPlan.validity_days * 86400000).toISOString().slice(0, 10)
    : '';

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('subscription_plans').select('*');
        const allPlans = data || [];
        const activePlans = allPlans.filter(p => !p.status || p.status === 'active');
        const finalPlans = activePlans.length > 0 ? activePlans : allPlans;
        setPlans(finalPlans);
        if (finalPlans.length > 0 && !form.plan_id) {
          setForm((f) => ({ ...f, plan_id: finalPlans[0].id }));
        }
      } catch (err) {
        console.error("Error loading plans in VendorForm:", err);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.owner_name || !form.phone || !form.shop_name || !form.address || !form.zip_code || !form.birthdate) {
      alert('All required fields must be completed.');
      return;
    }

    const birthdateForPassword = formatToDdMmYyyy(form.birthdate);

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        email: form.email ? form.email.trim() : '',
        shop_name: form.shop_name.trim(),
        address: form.address.trim(),
        zip_code: form.zip_code.trim(),
        birthdate: birthdateForPassword,
        password: birthdateForPassword,
        logo_url: form.logo_url || 'https://placehold.co/200x200/F0F0F0/5A5A5A?text=Logo',
        qr_url: form.qr_url || 'https://placehold.co/200x200/F0F0F0/5A5A5A?text=QR',
        plan_name: selectedPlan?.name || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label={t.ownerName}
          value={form.owner_name}
          onChange={(v) => setForm({ ...form, owner_name: v })}
          required
        />
        <Input
          label={t.phone}
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v.replace(/\D/g, '').slice(0, 10) })}
          required
          maxLength={10}
          placeholder={t.phonePlaceholder}
        />
        <Input
          label={t.email}
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="e.g. owner@shop.com"
        />
        <Input
          label={t.shopName}
          value={form.shop_name}
          onChange={(v) => setForm({ ...form, shop_name: v })}
          required
        />
        <Input
          label={t.dob}
          type="text"
          value={form.birthdate}
          onChange={(v) => setForm({ ...form, birthdate: v.replace(/\D/g, '') })}
          placeholder={t.dobPlaceholder}
          required
        />
        <div className="sm:col-span-2">
          <Input
            label={t.address}
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            required
          />
        </div>
        <Input
          label={t.zipCode}
          value={form.zip_code}
          onChange={(v) => setForm({ ...form, zip_code: v })}
          required
        />
        <Select
          label={t.subPlan}
          value={form.plan_id}
          onChange={(v) => setForm({ ...form, plan_id: v })}
          options={loadingPlans 
            ? [{ value: form.plan_id || '', label: 'Loading subscription plans...' }]
            : plans.map((p) => ({ value: p.id, label: `${p.name} — ₹${p.price}` }))
          }
        />
      </div>

      {selectedPlan && (
        <div className="grid gap-4 rounded-3xl border border-amber-200 bg-[#f9f1e5] p-4 text-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Plan Limits Summary</p>
              <p className="mt-1 text-sm text-slate-700">
                {t.validity}: <span className="font-bold text-slate-900">{selectedPlan.validity_days} {t.days}</span> · 
                Max Items: <span className="font-bold text-slate-900">{selectedPlan.max_items}</span> · 
                Max Clients: <span className="font-bold text-slate-900">{selectedPlan.max_clients} {t.clients}</span>
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              {selectedPlan.name} Tier
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 border border-amber-200">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Start Date</p>
              <p className="mt-1 font-semibold text-slate-900">{startDate}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-amber-200">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">End Date</p>
              <p className="mt-1 font-semibold text-slate-900">{endDate}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            {t.cancel}
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="min-w-[120px]">
          {submitting ? t.saving : submitLabel}
        </Button>
      </div>
    </form>
  );
}
