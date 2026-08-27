// ============================================================
// Pricing Tier Service — Real API integration
// ============================================================
// Backend architecture (from API_INVENTORY.md):
//   - Admin-managed tiers with unique slug, skill level, rates
//   - Caretaker profiles get pricing copied on approval
//   - Booking creation snapshots from caretaker_profiles, NOT live tiers
//   - Editing a tier does NOT auto-update existing caretaker profiles
//   - Admin must explicitly call update_caretaker_pricing to propagate
//
// GET /api/v1/admin/pricing_tiers
// GET /api/v1/admin/pricing_tier_detail?id=
// POST /api/v1/admin/create_pricing_tier
// POST /api/v1/admin/update_pricing_tier
// DELETE /api/v1/admin/delete_pricing_tier
// POST /api/v1/admin/update_caretaker_pricing
// ============================================================

import { api } from './api';

export const pricingService = {
  /** List all pricing tiers (active + inactive) */
  async listTiers(filters = {}) {
    const params = { ...filters };
    if (params.is_active === '1' || params.is_active === 1 || params.is_active === true) params.status = 'active';
    if (params.is_active === '0' || params.is_active === 0 || params.is_active === false) params.status = 'inactive';
    delete params.is_active;
    return api.get('/admin/pricing_tiers', params);
  },

  /** Get full tier detail with assigned caretakers */
  async getTierDetail(id) {
    return api.get('/admin/pricing_tier_detail', { id });
  },

  /** Create new pricing tier */
  async createTier(data) {
    return api.post('/admin/create_pricing_tier', data);
  },

  /** Update existing tier (does NOT auto-update caretaker profiles) */
  async updateTier(data) {
    return api.post('/admin/update_pricing_tier', data);
  },

  /** Deactivate/delete tier */
  async deleteTier(id) {
    return api.del('/admin/delete_pricing_tier', { id });
  },

  /**
   * Propagate tier pricing to caretaker profiles
   * Only updates caretaker_profiles, NOT existing bookings/payouts
   * Supports optional admin override rates with pricing_override_enabled
   */
  async updateCaretakerPricing(data) {
    return api.post('/admin/update_caretaker_pricing', {
      ...data,
      caretaker_user_id: data.caretaker_user_id || data.user_id || data.id,
    });
  },
};
