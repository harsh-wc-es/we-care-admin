import { api } from './api';

export const notificationService = {
  async sendPushNotification(data) {
    return api.post('/admin/notifications/send', data);
  },

  async getNotificationTargets(params = {}) {
    return api.get('/admin/notifications/targets', params);
  },

  async getPushLogs(filters = {}) {
    return api.get('/admin/notifications/logs', filters);
  },

  async createNotification(data) {
    return api.post('/notification/create_notification', {
      user_id: data.user_id,
      title: data.title,
      message: data.message,
    });
  },

  async listNotifications(filters = {}) {
    return api.get('/admin/notification_history', filters);
  },

  async listAdminHistory(filters = {}) {
    return api.get('/admin/notification_history', filters);
  },

  async markRead(id) {
    return api.post('/notification/mark_read', { id });
  },

  async markAllRead() {
    return api.post('/notification/mark_all_read');
  },
};
