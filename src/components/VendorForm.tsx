import { useEffect, useState } from 'react';
import { Input, Button, useSyncedLanguage } from './ui';

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
  const [submitting, setSubmitting] = useState(false);

  // Older vendor records may have been saved as ISO (YYYY-MM-DD) before the
  // format was standardized to plain DDMMYYYY digits. Reorder those instead
  // of just stripping separators, otherwise the digits come out scrambled.
  const toDdMmYyyyDigits = (value: string) => {
    if (!value) return '';
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}${month}${year}`;
    }
    return value.replace(/\D/g, '');
  };

  const formatToDdMmYyyy = toDdMmYyyyDigits;
  const normalizeDateInputValue = toDdMmYyyyDigits;

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
        logo_url: initialData.logo_url || '',
        qr_url: initialData.qr_url || '',
      });
    }
  }, [initialData]);

  const isEditMode = !!initialData;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.owner_name || !form.phone || !form.shop_name || !form.address || !form.zip_code || (!isEditMode && !form.birthdate)) {
      alert('All required fields must be completed.');
      return;
    }

    // Leaving birthdate blank while editing keeps the vendor's existing
    // birthdate/password untouched instead of forcing a reset.
    const birthdateForPassword = form.birthdate ? formatToDdMmYyyy(form.birthdate) : '';

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
          placeholder={isEditMode ? 'Leave blank to keep existing' : t.dobPlaceholder}
          required={!isEditMode}
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
      </div>

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
