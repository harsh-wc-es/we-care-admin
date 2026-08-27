// ============================================================
// Complaint Service — Real API integration
// GET /api/v1/complaint/admin_list
// GET /api/v1/complaint/admin_view
// GET /api/v1/complaint/view_proof
// POST /api/v1/complaint/admin_update_status
// ============================================================

import { api, fetchProtectedBlob } from './api';

const STATUS_MAP = {
  under_review: 'in_review',
  escalated: 'in_review',
  closed: 'resolved',
};

export const complaintService = {
  async listComplaints(filters = {}) {
    return api.get('/complaint/admin_list', filters);
  },

  async getComplaint(id) {
    return api.get('/complaint/admin_view', { id });
  },

  async viewComplaintProof(complaintId) {
    return fetchProtectedBlob(`/complaint/view_proof?id=${encodeURIComponent(complaintId)}`);
  },

  async updateStatus(data) {
    const complaintId = data.complaint_id || data.id;
    const status = STATUS_MAP[data.status] || data.status;
    const adminNote = data.admin_note ?? data.admin_notes ?? '';

    return api.post('/complaint/admin_update_status', {
      id: complaintId,
      complaint_id: complaintId,
      status,
      admin_note: adminNote,
    });
  },
};
