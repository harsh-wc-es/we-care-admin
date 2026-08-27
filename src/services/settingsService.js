import { api } from './api';

export const settingsService = {
  testApiConnection() {
    return api.publicGet('/health');
  },

  getAdminProfile() {
    return api.get('/admin/me');
  },

  updateAdminProfile(payload) {
    return api.post('/admin/update_profile', payload);
  },
};
