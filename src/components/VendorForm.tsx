import { useEffect, useState } from 'react';
import { supabase, type Plan } from '../lib/supabase';
import { Input, Select, Button, Spinner } from './ui';
import { CheckCircle } from 'lucide-react';

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
  const [logoUploading, setLogoUploading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);

  const [form, setForm] = useState({
    owner_name: initialData?.owner_name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    shop_name: initialData?.shop_name || '',
    address: initialData?.address || '',
    zip_code: initialData?.zip_code || '',
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'qr') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large (max 2MB)');
      return;
    }

    if (type === 'logo') setLogoUploading(true);
    else setQrUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      setForm((f) => ({
        ...f,
        [type === 'logo' ? 'logo_url' : 'qr_url']: data.url,
      }));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to upload image');
    } finally {
      if (type === 'logo') setLogoUploading(false);
      else setQrUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.owner_name || !form.phone || !form.shop_name || !form.address || !form.zip_code) {
      alert('All required fields must be completed.');
      return;
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

      {/* Asset Upload Section */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Shop Logo <span className="text-muted/60 normal-case font-normal">(Optional)</span></label>
          <div className="relative border-2 border-dashed border-border rounded-2xl p-4 flex flex-col items-center justify-center bg-surface-2/20 hover:bg-surface-2/40 transition-colors">
            {form.logo_url ? (
              <div className="text-center">
                <img src={form.logo_url} alt="Logo preview" className="w-20 h-20 rounded-xl object-cover mx-auto border border-border" />
                <p className="text-xs text-green-500 font-semibold mt-2 flex items-center justify-center gap-1">
                  <CheckCircle size={12} /> Uploaded
                </p>
              </div>
            ) : (
              <div className="text-center py-2">
                <img src="https://placehold.co/80x80/F0F0F0/5A5A5A?text=Logo" alt="Default logo" className="w-16 h-16 rounded-xl mx-auto mb-2 opacity-40" />
                <p className="text-xs text-muted">Click to upload <span className="text-muted/60">(or leave default)</span></p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={logoUploading}
              onChange={(e) => handleFileUpload(e, 'logo')}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {logoUploading && (
              <div className="absolute inset-0 bg-surface/85 flex items-center justify-center rounded-2xl">
                <Spinner />
              </div>
            )}
          </div>
        </div>

        {/* QR Code Upload */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Business QR Code <span className="text-muted/60 normal-case font-normal">(Optional)</span></label>
          <div className="relative border-2 border-dashed border-border rounded-2xl p-4 flex flex-col items-center justify-center bg-surface-2/20 hover:bg-surface-2/40 transition-colors">
            {form.qr_url ? (
              <div className="text-center">
                <img src={form.qr_url} alt="QR preview" className="w-20 h-20 rounded-xl object-cover mx-auto border border-border" />
                <p className="text-xs text-green-500 font-semibold mt-2 flex items-center justify-center gap-1">
                  <CheckCircle size={12} /> Uploaded
                </p>
              </div>
            ) : (
              <div className="text-center py-2">
                <img src="https://placehold.co/80x80/F0F0F0/5A5A5A?text=QR" alt="Default QR" className="w-16 h-16 rounded-xl mx-auto mb-2 opacity-40" />
                <p className="text-xs text-muted">Click to upload <span className="text-muted/60">(or leave default)</span></p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={qrUploading}
              onChange={(e) => handleFileUpload(e, 'qr')}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {qrUploading && (
              <div className="absolute inset-0 bg-surface/85 flex items-center justify-center rounded-2xl">
                <Spinner />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting || logoUploading || qrUploading} className="min-w-[120px]">
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
