// ============================================================
// Replacement Service — Real API integration
// GET /api/v1/replacement/admin_list
// GET /api/v1/replacement/admin_view
// POST /api/v1/replacement/admin_update_status
// POST /api/v1/replacement/admin_assign
// POST /api/v1/replacement/admin_cancel
// POST /api/v1/replacement/admin_resolve
// DELETE /api/v1/replacement/admin_delete
// ============================================================

import { api } from './api';

const STATUS_MAP = {
  pending: 'open',
  approved: 'assigned',
  rejected: 'cancelled',
  completed: 'resolved',
};

export const replacementService = {
  async listTickets(filters = {}) {
    return api.get('/replacement/admin_list', {
      ...filters,
      status: STATUS_MAP[filters.status] || filters.status,
    });
  },

  async getTicket(id) {
    return api.get('/replacement/admin_view', { id });
  },

  async updateStatus(data) {
    return api.post('/replacement/admin_update_status', {
      ticket_id: data.ticket_id || data.id,
      status: STATUS_MAP[data.status] || data.status,
      admin_note: data.admin_note || data.admin_notes || '',
      replacement_caretaker_user_id: data.replacement_caretaker_user_id || null,
    });
  },

  async assignTicket(data) {
    return api.post('/replacement/admin_assign', {
      ticket_id: data.ticket_id || data.id,
      replacement_caretaker_user_id: data.replacement_caretaker_user_id,
      admin_note: data.admin_note || data.admin_notes || '',
    });
  },

  async cancelTicket(data) {
    return api.post('/replacement/admin_cancel', {
      ticket_id: data.ticket_id || data.id,
      admin_note: data.admin_note || data.admin_notes || '',
    });
  },

  async resolveTicket(data) {
    return api.post('/replacement/admin_resolve', {
      ticket_id: data.ticket_id || data.id,
      admin_note: data.admin_note || data.admin_notes || '',
    });
  },

  async deleteTicket(id) {
    return api.del('/replacement/admin_delete', { id });
  },
};
