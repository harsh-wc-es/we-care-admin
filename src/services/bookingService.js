// ============================================================
// Booking Service — Real API integration
// GET /api/v1/admin/bookings
// GET /api/v1/admin/booking_detail
// ============================================================

import { api } from './api';

export const bookingService = {
  async listBookings(filters = {}) {
    return api.get('/admin/bookings', {
      ...filters,
      status: filters.status === 'ongoing' ? 'in_progress' : filters.status,
    });
  },

  async getBookingDetail(id) {
    return api.get('/admin/booking_detail', { booking_id: id });
  },

  async cancelBooking(data) {
    return api.post('/admin/cancel_booking', {
      booking_id: data.booking_id || data.id,
      cancellation_reason: data.cancellation_reason || data.reason || 'Cancelled by admin',
    });
  },
};
