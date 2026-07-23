import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase, type Plan } from '../lib/supabase';
import { Input, Select, Button, Spinner } from './ui';

interface VendorFormProps {
  initialData?: any;
  submitLabel: string;
  onSubmit: (formData: any) => Promise<void>;
  onCancel?: () => void;
}

export function VendorForm({ initialData, submitLabel, onSubmit, onCancel }: VendorFormProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formatToDdMmYyyy = (value: string) => {
    if (!value) return '';
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}${month}${year}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return value.replace(/\//g, '');
    }
    if (/^\d{8}$/.test(value)) {
      return value;
    }
    return value;
  };

  const normalizeDateInputValue = (value: string) => {
    if (!value) return '';
    const displayMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (displayMatch) {
      const [, day, month, year] = displayMatch;
      return `${year}-${month}-${day}`;
    }
    const plainMatch = value.match(/^(\d{8})$/);
    if (plainMatch) {
      const day = value.slice(0, 2);
      const month = value.slice(2, 4);
      const year = value.slice(4);
      return `${year}-${month}-${day}`;
    }
    return value;
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

  const selectedPlan = plans.find((p) => p.id === form.plan_id);
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const endDate = selectedPlan
    ? new Date(today.getTime() + selectedPlan.validity_days * 86400000).toISOString().slice(0, 10)
    : '';

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('subscription_plans').select('*').eq('status', 'active');
      const activePlans = data || [];
      setPlans(activePlans);
      if (activePlans.length > 0 && !form.plan_id) {
        setForm((f) => ({ ...f, plan_id: activePlans[0].id }));
      }
      setLoadingPlans(false);
    })();
  }, []);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.owner_name || !form.phone || !form.shop_name || !form.address || !form.zip_code || !form.birthdate) {
      alert('All required fields must be completed.');
      return;
    }

    const birthdateForPassword = formatToDdMmYyyy(form.birthdate);

    if (!initialData) {
      if (!form.password || !form.confirm_password) {
        alert('Password and confirmation are required.');
        return;
      }
      if (form.password !== form.confirm_password) {
        alert('Password and confirmation must match.');
        return;
      }
      if (form.password !== birthdateForPassword) {
        alert('Password must match the vendor birthdate in DDMMYYYY format.');
        return;
      }
    } else if (form.password || form.confirm_password) {
      if (form.password !== form.confirm_password) {
        alert('Password and confirmation must match.');
        return;
      }
      if (form.password !== birthdateForPassword) {
        alert('Password must match the vendor birthdate in DDMMYYYY format.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        logo_url: form.logo_url || 'https://placehold.co/200x200/F0F0F0/5A5A5A?text=Logo',
        qr_url: form.qr_url || 'https://placehold.co/200x200/F0F0F0/5A5A5A?text=QR',
        plan_name: selectedPlan?.name || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPlans) return <Spinner />;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Owner Name"
          value={form.owner_name}
          onChange={(v) => setForm({ ...form, owner_name: v })}
          required
        />
        <Input
          label="Phone Number"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          required
          placeholder="e.g. +919876543210"
        />
        <Input
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="e.g. owner@shop.com"
        />
        <Input
          label="Shop / Brand Name"
          value={form.shop_name}
          onChange={(v) => setForm({ ...form, shop_name: v })}
          required
        />
        <Input
          label="Birthdate"
          type="date"
          value={form.birthdate}
          onChange={(v) => {
            const formatted = formatToDdMmYyyy(v);
            setForm({
              ...form,
              birthdate: v,
              password: initialData ? form.password : formatted,
              confirm_password: initialData ? form.confirm_password : formatted,
            });
          }}
          required
        />
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text block">
            Password {!initialData && <span className="text-accent">*</span>}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={initialData ? 'Leave blank to keep existing password' : 'DDMMYYYY'}
              required={!initialData}
              className="w-full px-4 py-3 rounded-2xl bg-white/95 border border-border text-text placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text block">
            Confirm Password {!initialData && <span className="text-accent">*</span>}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              placeholder={initialData ? 'Repeat password if changing' : 'Repeat birthdate'}
              required={!initialData}
              className="w-full px-4 py-3 rounded-2xl bg-white/95 border border-border text-text placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Full Address"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            required
          />
        </div>
        <Input
          label="ZIP Code"
          value={form.zip_code}
          onChange={(v) => setForm({ ...form, zip_code: v })}
          required
        />
        <Select
          label="Subscription Plan"
          value={form.plan_id}
          onChange={(v) => setForm({ ...form, plan_id: v })}
          options={plans.map((p) => ({ value: p.id, label: `${p.name} — ₹${p.price}` }))}
        />
      </div>

      {selectedPlan && (
        <div className="grid gap-4 rounded-3xl border border-amber-200 bg-[#f9f1e5] p-4 text-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Plan Limits Summary</p>
              <p className="mt-1 text-sm text-slate-700">
                Validity: <span className="font-bold text-slate-900">{selectedPlan.validity_days} Days</span> · 
                Max Items: <span className="font-bold text-slate-900">{selectedPlan.max_items}</span> · 
                Max Clients: <span className="font-bold text-slate-900">{selectedPlan.max_clients}</span>
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
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="min-w-[120px]">
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
