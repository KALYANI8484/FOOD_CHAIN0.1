// Single source of truth for whether a vendor is "Free" or an active paid subscriber.
// Computed live from `vendor.active_subscriptions[]` — never read `plan_name`/`plan_id`
// for this purpose, those top-level fields are legacy/informational only.
//
// Mirrored in server.js (search for "getVendorTier") since the server runs as a
// separate CommonJS process and can't import this module directly — keep both in sync.
import type { Vendor, VendorSubscription } from './supabase';

export const FREE_PLAN_NAMES = ['Free', 'Free Tier'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isSubPaidAndActive(sub: VendorSubscription): boolean {
  if (!sub) return false;
  if (FREE_PLAN_NAMES.includes(sub.plan_name)) return false;
  if (!((sub.max_clients ?? 0) > 0)) return false;
  if (sub.subscription_end && sub.subscription_end < todayIso()) return false;
  return true;
}

export function getVendorTier(vendor: Pick<Vendor, 'active_subscriptions'> | null | undefined): 'free' | 'active' {
  const subs = vendor?.active_subscriptions;
  if (!Array.isArray(subs) || subs.length === 0) return 'free';
  return subs.some(isSubPaidAndActive) ? 'active' : 'free';
}

// Friendly display label for the "Active Plan" card — the distinct set of paid plan
// names the vendor currently holds across categories, or "Free Tier" if none.
export function getVendorPlanLabel(vendor: Pick<Vendor, 'active_subscriptions'> | null | undefined): string {
  const subs = vendor?.active_subscriptions;
  if (!Array.isArray(subs)) return 'Free Tier';
  const names = Array.from(new Set(subs.filter(isSubPaidAndActive).map((s) => s.plan_name)));
  return names.length > 0 ? names.join(', ') : 'Free Tier';
}

// Does the vendor have a non-expired subscription entry covering this category?
// 'General' or a missing category_name acts as a wildcard, matching the convention
// already used across the Portfolio list / item-grouping / order-radar checks.
export function isVendorCategoryActive(
  vendor: Pick<Vendor, 'active_subscriptions'> | null | undefined,
  categoryName?: string | null
): boolean {
  const subs = vendor?.active_subscriptions;
  if (!Array.isArray(subs) || subs.length === 0) return false;
  const matching = subs.find(
    (s) => !s.category_name || s.category_name === 'General' || s.category_name === categoryName
  );
  if (!matching) return false;
  return isSubPaidAndActive(matching);
}
