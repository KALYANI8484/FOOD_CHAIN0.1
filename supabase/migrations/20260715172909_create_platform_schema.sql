/*
# MealMesh Platform Schema (fix)

1. Overview
- Multi-role food delivery platform: Super Admin, Sub-Admin, Vendor, Client.
- Single-tenant demo (no sign-in), all policies TO anon, authenticated.

2. Tables
- subscription_plans, master_inventory, vendors, vendor_inventory, orders,
  guides, settings, sub_admins, activity_log, upgrade_requests

3. Security
- RLS enabled on all tables, anon+authenticated CRUD.
*/

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  validity_days integer NOT NULL DEFAULT 30,
  max_items integer NOT NULL DEFAULT 10,
  max_clients integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_plans_s" ON subscription_plans;
CREATE POLICY "crud_plans_s" ON subscription_plans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_plans_i" ON subscription_plans;
CREATE POLICY "crud_plans_i" ON subscription_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_plans_u" ON subscription_plans;
CREATE POLICY "crud_plans_u" ON subscription_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_plans_d" ON subscription_plans;
CREATE POLICY "crud_plans_d" ON subscription_plans FOR DELETE TO anon, authenticated USING (true);

-- Master Inventory
CREATE TABLE IF NOT EXISTS master_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  image_url text,
  base_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE master_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_master_s" ON master_inventory;
CREATE POLICY "crud_master_s" ON master_inventory FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_master_i" ON master_inventory;
CREATE POLICY "crud_master_i" ON master_inventory FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_master_u" ON master_inventory;
CREATE POLICY "crud_master_u" ON master_inventory FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_master_d" ON master_inventory;
CREATE POLICY "crud_master_d" ON master_inventory FOR DELETE TO anon, authenticated USING (true);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name text NOT NULL,
  phone text NOT NULL,
  email text,
  shop_name text NOT NULL,
  address text NOT NULL,
  zip_code text NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id),
  plan_name text,
  status text NOT NULL DEFAULT 'pending_approval',
  logo_url text,
  submitted_by text,
  rejection_note text,
  subscription_start date,
  subscription_end date,
  total_clients integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_vendors_s" ON vendors;
CREATE POLICY "crud_vendors_s" ON vendors FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_vendors_i" ON vendors;
CREATE POLICY "crud_vendors_i" ON vendors FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_vendors_u" ON vendors;
CREATE POLICY "crud_vendors_u" ON vendors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_vendors_d" ON vendors;
CREATE POLICY "crud_vendors_d" ON vendors FOR DELETE TO anon, authenticated USING (true);

-- Vendor Inventory
CREATE TABLE IF NOT EXISTS vendor_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  master_item_id uuid REFERENCES master_inventory(id),
  item_name text NOT NULL,
  category text,
  image_url text,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vendor_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_vinv_s" ON vendor_inventory;
CREATE POLICY "crud_vinv_s" ON vendor_inventory FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_vinv_i" ON vendor_inventory;
CREATE POLICY "crud_vinv_i" ON vendor_inventory FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_vinv_u" ON vendor_inventory;
CREATE POLICY "crud_vinv_u" ON vendor_inventory FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_vinv_d" ON vendor_inventory;
CREATE POLICY "crud_vinv_d" ON vendor_inventory FOR DELETE TO anon, authenticated USING (true);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_phone text,
  client_zip text NOT NULL,
  client_landmark text,
  client_address text NOT NULL,
  item_name text NOT NULL,
  item_id uuid,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  otp text,
  distance_km numeric,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  delivered_at timestamptz
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_orders_s" ON orders;
CREATE POLICY "crud_orders_s" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_orders_i" ON orders;
CREATE POLICY "crud_orders_i" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_orders_u" ON orders;
CREATE POLICY "crud_orders_u" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_orders_d" ON orders;
CREATE POLICY "crud_orders_d" ON orders FOR DELETE TO anon, authenticated USING (true);

-- Guides
CREATE TABLE IF NOT EXISTS guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'vendor',
  file_url text,
  allowed_roles text[] NOT NULL DEFAULT '{}',
  keywords text,
  uploaded_at timestamptz DEFAULT now()
);
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_guides_s" ON guides;
CREATE POLICY "crud_guides_s" ON guides FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_guides_i" ON guides;
CREATE POLICY "crud_guides_i" ON guides FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_guides_u" ON guides;
CREATE POLICY "crud_guides_u" ON guides FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_guides_d" ON guides;
CREATE POLICY "crud_guides_d" ON guides FOR DELETE TO anon, authenticated USING (true);

-- Settings (single row)
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  qr_url text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_settings_s" ON settings;
CREATE POLICY "crud_settings_s" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_settings_i" ON settings;
CREATE POLICY "crud_settings_i" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_settings_u" ON settings;
CREATE POLICY "crud_settings_u" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_settings_d" ON settings;
CREATE POLICY "crud_settings_d" ON settings FOR DELETE TO anon, authenticated USING (true);

-- Sub Admins
CREATE TABLE IF NOT EXISTS sub_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  last_active timestamptz,
  force_change boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sub_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_subadmins_s" ON sub_admins;
CREATE POLICY "crud_subadmins_s" ON sub_admins FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_subadmins_i" ON sub_admins;
CREATE POLICY "crud_subadmins_i" ON sub_admins FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_subadmins_u" ON sub_admins;
CREATE POLICY "crud_subadmins_u" ON sub_admins FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_subadmins_d" ON sub_admins;
CREATE POLICY "crud_subadmins_d" ON sub_admins FOR DELETE TO anon, authenticated USING (true);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_activity_s" ON activity_log;
CREATE POLICY "crud_activity_s" ON activity_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_activity_i" ON activity_log;
CREATE POLICY "crud_activity_i" ON activity_log FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_activity_u" ON activity_log;
CREATE POLICY "crud_activity_u" ON activity_log FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_activity_d" ON activity_log;
CREATE POLICY "crud_activity_d" ON activity_log FOR DELETE TO anon, authenticated USING (true);

-- Upgrade Requests
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  current_plan text,
  requested_plan text,
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crud_upgrades_s" ON upgrade_requests;
CREATE POLICY "crud_upgrades_s" ON upgrade_requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "crud_upgrades_i" ON upgrade_requests;
CREATE POLICY "crud_upgrades_i" ON upgrade_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "crud_upgrades_u" ON upgrade_requests;
CREATE POLICY "crud_upgrades_u" ON upgrade_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "crud_upgrades_d" ON upgrade_requests;
CREATE POLICY "crud_upgrades_d" ON upgrade_requests FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_zip ON vendors(zip_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_vinv_vendor ON vendor_inventory(vendor_id);
CREATE INDEX IF NOT EXISTS idx_master_category ON master_inventory(category);
