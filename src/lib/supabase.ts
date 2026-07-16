import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type Plan = {
  id: string;
  name: string;
  price: number;
  validity_days: number;
  max_items: number;
  max_clients: number;
  status: string;
  created_at: string;
};

export type MasterItem = {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  base_price: number;
  quantity: number;
  description: string | null;
  created_at: string;
};

export type Vendor = {
  id: string;
  owner_name: string;
  phone: string;
  email: string | null;
  shop_name: string;
  address: string;
  zip_code: string;
  plan_id: string | null;
  plan_name: string | null;
  status: string;
  logo_url: string | null;
  submitted_by: string | null;
  rejection_note: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  total_clients: number;
  created_at: string;
};

export type VendorItem = {
  id: string;
  vendor_id: string;
  master_item_id: string | null;
  item_name: string;
  category: string | null;
  image_url: string | null;
  price: number;
  quantity: number;
  created_at: string;
};

export type Order = {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_zip: string;
  client_landmark: string | null;
  client_address: string;
  item_name: string;
  item_id: string | null;
  vendor_id: string | null;
  price: number;
  quantity: number;
  status: string;
  otp: string | null;
  distance_km: number | null;
  created_at: string;
  accepted_at: string | null;
  delivered_at: string | null;
};

export type Guide = {
  id: string;
  title: string;
  category: string;
  file_url: string | null;
  file_data: string | null;
  file_name: string | null;
  allowed_roles: string[];
  keywords: string | null;
  uploaded_at: string;
};

export type Settings = {
  id: string;
  logo_url: string | null;
  qr_url: string | null;
  updated_at: string;
};

export type SubAdmin = {
  id: string;
  name: string;
  email: string;
  password: string;
  last_active: string | null;
  force_change: boolean;
  created_at: string;
};

export type Activity = {
  id: string;
  action: string;
  actor: string | null;
  created_at: string;
};

export type UpgradeRequest = {
  id: string;
  vendor_id: string;
  vendor_name: string;
  current_plan: string | null;
  requested_plan: string;
  payment_status: string;
  status: string;
  created_at: string;
};
