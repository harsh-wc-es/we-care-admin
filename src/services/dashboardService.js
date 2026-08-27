// ============================================================
// Dashboard Service
// GET /api/v1/dashboard/admin_dashboard
// ============================================================

import { api } from './api';

export const dashboardService = {
  async getDashboard() {
    return api.get('/dashboard/admin_dashboard');
  },
};
