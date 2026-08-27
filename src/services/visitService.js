import { bookingService } from './bookingService';

export const visitService = {
  async listActiveVisits(params = {}) {
    return bookingService.listBookings({ ...params, status: 'in_progress' });
  },

  async getActiveVisitDetail(id) {
    return bookingService.getBookingDetail(id);
  },
};
