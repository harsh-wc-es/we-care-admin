import { api } from './api';

export const reportService = {
  async getSummary(params = {}) {
    return api.get('/admin/reports_summary', params);
  },
};
