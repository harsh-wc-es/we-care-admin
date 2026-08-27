// ============================================================
// Caretaker Service — Real API integration
// GET /api/v1/admin/users?role=caretaker
// GET /api/v1/admin/view_caretaker
// POST /api/v1/admin/approve_caretaker
// POST /api/v1/admin/reject_caretaker
// POST /api/v1/admin/set_caretaker_availability
// POST /api/v1/admin/update_caretaker_pricing
// POST /api/v1/admin/update_caregiver_tier_pricing
// POST /api/v1/admin/reject_document
// POST /api/v1/admin/caretaker_documents/approve
// POST /api/v1/admin/caretaker_documents/reject_selected
// POST /api/v1/admin/caretakers/ban
// ============================================================

import { api } from './api';

export const caregiverService = {
  async listCaregivers(filters = {}) {
    const params = { role: 'caretaker', ...filters };
    if (params.is_available === '1' || params.is_available === 1 || params.is_available === true) params.availability = 'available';
    if (params.is_available === '0' || params.is_available === 0 || params.is_available === false) params.availability = 'unavailable';
    delete params.is_available;
    return api.get('/admin/users', params);
  },

  async getCaregiver(id) {
    return api.get('/admin/view_caretaker', { user_id: id });
  },

  async getPendingCaregivers(params = {}) {
    return api.get('/admin/pending_caretakers', params);
  },

  async listVerification(params = {}) {
    return api.get('/admin/caretaker_verification', params);
  },

  async approveCaregiver(data) {
    // data: { user_id, pricing_tier_id, admin_notes?, override pricing fields? }
    return api.post('/admin/approve_caretaker', data);
  },

  async rejectCaregiver(data) {
    // data: { user_id, rejection_reason }
    return api.post('/admin/reject_caretaker', data);
  },

  async rejectDocument(data) {
    const documentId = data.document_id || data.id;
    const note = data.admin_note || data.rejection_reason || data.reason || '';
    return api.post('/admin/reject_document', {
      document_id: documentId,
      reason: note,
    }, { debugLabel: 'Reject caretaker document' });
  },

  async approveDocument(data) {
    return api.post('/admin/caretaker_documents/approve', {
      caretaker_user_id: data.caretaker_user_id || data.user_id,
      document_id: data.document_id || data.id,
    }, { debugLabel: 'Approve caretaker document' });
  },

  async rejectSelectedDocuments(data) {
    return api.post('/admin/caretaker_documents/reject_selected', {
      caretaker_user_id: data.caretaker_user_id || data.user_id,
      documents: data.documents || [],
    }, { debugLabel: 'Reject selected caretaker documents' });
  },

  async banCaregiver(data) {
    return api.post('/admin/caretakers/ban', {
      caretaker_user_id: data.caretaker_user_id || data.user_id || data.id,
      reason: data.reason || data.ban_reason || '',
    });
  },

  async setAvailability(data) {
    return api.post('/admin/set_caretaker_availability', {
      caretaker_user_id: data.caretaker_user_id || data.user_id || data.id,
      is_available: Boolean(data.is_available),
      lock: data.lock ?? data.lock_availability ?? false,
      note: data.note ?? data.lock_note ?? '',
    });
  },

  async updatePricing(data) {
    return api.post('/admin/update_caregiver_tier_pricing', data);
  },
};
