// ============================================================
// Audit Log Service — Real API integration
// GET /api/v1/admin/audit_logs
// ============================================================

import { api } from './api';

export const auditService = {
  async listLogs(filters = {}) {
    return api.get('/admin/audit_logs', filters);
  },
};
