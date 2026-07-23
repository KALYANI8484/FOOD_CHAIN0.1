// Custom MongoDB-backed mock Supabase Client for VIKRAM ADVERTISING
// This replicates the supabase-js query builder syntax to avoid breaking existing frontend code.

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
  birthdate: string | null;
  password: string | null;
  plan_id: string | null;
  plan_name: string | null;
  status: string;
  logo_url: string | null;
  qr_url: string | null;
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
  price_locked: boolean;
  locked_price: number | null;
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
  category: string | null;
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

export type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  zip_code: string;
  landmark: string | null;
  address: string | null;
  created_at: string;
};

class QueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private data: any = null;
  private filters: { field: string; op: 'eq' | 'in'; value: any }[] = [];
  private sorts: { field: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns?: string) {
    this.action = 'select';
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.data = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.data = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  in(field: string, value: any[]) {
    this.filters.push({ field, op: 'in', value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.sorts.push({ field, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any) {
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: this.table,
          action: this.action,
          data: this.data,
          filters: this.filters,
          sorts: this.sorts,
          limit: this.limitCount,
          single: this.isSingle,
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errObj = { data: null, error: { message: errData.error || `API error: ${response.statusText}` } };
        if (onfulfilled) return onfulfilled(errObj);
        return errObj;
      }
      
      const result = await response.json();
      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result;
    } catch (err: any) {
      const errorObj = { data: null, error: { message: err.message || String(err) } };
      if (onfulfilled) {
        return onfulfilled(errorObj);
      }
      return errorObj;
    }
  }
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  }
};
