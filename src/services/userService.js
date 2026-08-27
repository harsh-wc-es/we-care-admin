// ============================================================
// User Service — Real API integration
// GET /api/v1/admin/users
// POST /api/v1/admin/update_user_status
// GET /api/v1/admin/patient_profile?family_user_id=
// ============================================================

import { api } from './api';

export const userService = {
  async listUsers(filters = {}) {
    return api.get('/admin/users', filters);
  },

  async updateUserStatus(data) {
    const isActive = data.is_active ?? (data.status === 'active');
    return api.post('/admin/update_user_status', {
      user_id: data.user_id || data.id,
      is_active: Boolean(isActive),
    });
  },

  async getPatientProfile(familyUserId) {
    return api.get('/admin/patient_profile', { family_user_id: familyUserId });
  },
};
