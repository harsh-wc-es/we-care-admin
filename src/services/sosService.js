// ============================================================
// SOS Service — Real API integration
// GET /api/v1/sos/admin_sos_list
// POST /api/v1/sos/resolve_sos
// POST /api/v1/sos/update_status
// ============================================================

import { api } from './api';

export const sosService = {
  async listAlerts(filters = {}) {
    return api.get('/sos/admin_sos_list', filters);
  },

  async resolveAlert(data) {
    return api.post('/sos/resolve_sos', {
      sos_id: data.sos_id || data.id,
      resolution_notes: data.resolution_notes || data.notes || '',
    });
  },

  async updateStatus(data) {
    return api.post('/sos/update_status', {
      sos_id: data.sos_id || data.id,
      status: data.status,
      notes: data.notes || data.resolution_notes || '',
    });
  },

  async getAlertDetail(id) {
    return api.get('/admin/sos_detail', { id });
  },
};
