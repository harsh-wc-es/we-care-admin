// ============================================================
// Earnings & Payout Service — Real API integration
// ============================================================
// Payout lifecycle (from API_INVENTORY.md):
//   completed → hold (24hr) → ready_for_payout → paid
//   Exceptions: complaint hold, dispute exclusion, SOS review
//
// GET /api/v1/admin/earnings?tab=ready_to_pay|hold|disputed|paid_history
// GET /api/v1/admin/booking_detail?booking_id={id}
// POST /api/v1/admin/refresh_payout_eligibility
// POST /api/v1/admin/create_payout
// POST /api/v1/admin/update_payout
// ============================================================

import { api } from './api';

export const earningsService = {
  /**
   * List earnings/bookings with payout status
   * @param {object} params - { tab, payout_status, search, page }
   * tab values: ready_to_pay, hold, disputed, paid_history
   */
  async getEarnings(params = {}) {
    return api.get('/admin/earnings', params);
  },

  /**
   * Load richer booking context for a payout row.
   * The payout operations list is booking-based, so booking_detail is the
   * available detail API for family, patient, payment, complaint, and visit data.
   */
  async getPayoutDetail(row = {}) {
    const bookingId = row.booking_id || row.bookingId;
    if (!bookingId) {
      return {
        ok: true,
        success: true,
        message: 'Payout row has no booking detail record.',
        data: row,
        errors: null,
        pagination: null,
      };
    }

    return api.get('/admin/booking_detail', { booking_id: bookingId });
  },

  /**
   * Refresh payout eligibility engine
   * Moves bookings from hold → ready_for_payout when:
   * - 24hr hold window passed
   * - No complaints, SOS, pending checklist, or refunds
   */
  async refreshPayoutEligibility() {
    return api.post('/admin/refresh_payout_eligibility');
  },

  /**
   * Create weekly payout batch
   * Generates payout for eligible bookings completed before Sunday 11:59 PM
   * Uses bookings.caretaker_earning_amount only
   * Stores gross_customer_amount, total_caretaker_earnings, total_platform_commission
   */
  async createPayout(data = {}) {
    return api.post('/admin/create_payout', data);
  },

  /**
   * Update payout status (mark paid, hold, etc.)
   * Sets included bookings to payout_status=paid, records payout_paid_at
   * Prevents duplicate payout through caretaker_payout_items.uniq_payout_booking
   * @param {object} data - { payout_id, status, payment_method?, admin_note? }
   */
  async updatePayout(data) {
    const payoutId = data.payout_id || data.id;
    return api.post('/admin/update_payout', {
      ...data,
      id: payoutId,
      payout_id: payoutId,
    });
  },

  async exportEarnings(params = {}) {
    return api.get('/admin/earnings_export', params);
  },
};
