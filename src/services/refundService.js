import { api } from './api';

export const refundService = {
  async getRefunds(params = {}) {
    return api.get('/admin/refunds', params);
  },

  async getRefundDetail(id) {
    return api.get('/admin/refund_detail', { id });
  },

  async approveRefund({ refund_id, admin_note = '' }) {
    return api.post('/admin/approve_refund', { refund_id, admin_note });
  },

  async rejectRefund({ refund_id, admin_note = '' }) {
    return api.post('/admin/reject_refund', { refund_id, admin_note });
  },

  async markRefundProcessed({
    refund_id,
    refund_method,
    refund_transaction_id,
    admin_note = '',
  }) {
    return api.post('/admin/mark_refund_processed', {
      refund_id,
      refund_method,
      refund_transaction_id,
      admin_note,
    });
  },
};
