import { useEffect, useState } from 'react';
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

  const [form, setForm] = useState({
    owner_name: initialData?.owner_name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    shop_name: initialData?.shop_name || '',
    address: initialData?.address || '',
    zip_code: initialData?.zip_code || '',
    birthdate: initialData?.birthdate || '',
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

    if (!initialData) {
      if (!form.password || !form.confirm_password) {
        alert('Password and confirmation are required.');
        return;
      }
      if (form.password !== form.confirm_password) {
        alert('Password and confirmation must match.');
        return;
      }
      if (form.password !== form.birthdate) {
        alert('Password must match the vendor birthdate in YYYY-MM-DD format.');
        return;
      }
    } else if (form.password || form.confirm_password) {
      if (form.password !== form.confirm_password) {
        alert('Password and confirmation must match.');
        return;
      }
      if (form.password !== form.birthdate) {
        alert('Password must match the vendor birthdate in YYYY-MM-DD format.');
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
          onChange={(v) => setForm({ ...form, birthdate: v, password: initialData ? form.password : v, confirm_password: initialData ? form.confirm_password : v })}
          required
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          required={!initialData}
          placeholder={initialData ? 'Leave blank to keep existing password' : 'YYYY-MM-DD'}
        />
        <Input
          label="Confirm Password"
          type="password"
          value={form.confirm_password}
          onChange={(v) => setForm({ ...form, confirm_password: v })}
          required={!initialData}
          placeholder={initialData ? 'Repeat password if changing' : 'Repeat birthdate'}
        />
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
