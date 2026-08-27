import {
  api,
  clearAuth,
  getRefreshToken,
  isAdminUser,
  setRefreshToken,
  setToken,
  setUser,
} from './api';

function buildLoginBody(identifier, password) {
  return { login: identifier.trim(), password, require_otp: '0' };
}

function extractAuthPayload(data = {}) {
  const user = data.user || data.admin || data.profile || null;
  const access = data.access || data.access_token || data.token || data.jwt || '';
  const refresh = data.refresh || data.refresh_token || '';
  return { user, access, refresh };
}

export const authService = {
  async login(identifier, password) {
    const res = await api.publicPost('/auth/login', buildLoginBody(identifier, password), { debugLabel: 'Admin login' });
    if (!res.ok) return res;

    const { user, access, refresh } = extractAuthPayload(res.data || {});
    if (!isAdminUser(user)) {
      clearAuth();
      return {
        ...res,
        ok: false,
        success: false,
        message: 'This account does not have admin access.',
        errors: { role: ['Admin role is required.'] },
      };
    }

    if (!access) {
      clearAuth();
      return {
        ...res,
        ok: false,
        success: false,
        message: 'Login response did not include an access token.',
      };
    }

    setToken(access);
    if (refresh) setRefreshToken(refresh);
    setUser(user);
    return res;
  },

  async logout() {
    const refresh = getRefreshToken();
    const res = refresh
      ? await api.post('/auth/logout', { refresh })
      : { ok: true, success: true, message: 'Logged out.', data: null, errors: null, pagination: null };
    clearAuth();
    return res;
  },

  async forgotPassword(login) {
    return api.post('/auth/forgot-password/request-otp', { login });
  },

  async verifyForgotPasswordOtp(data) {
    return api.post('/auth/forgot-password/verify-otp', data);
  },

  async resetPassword(login, token, newPassword, newPasswordConfirm) {
    return api.post('/auth/forgot-password/reset', {
      password_reset_token: token,
      new_password: newPassword,
      confirm_password: newPasswordConfirm,
    });
  },

  async refreshToken() {
    const refresh = getRefreshToken();
    const res = await api.post('/auth/refresh-token', { refresh });
    const access = res.data?.access || res.data?.access_token || res.data?.token;
    if (res.ok && access) setToken(access);
    return res;
  },

  async changePassword(data) {
    return api.post('/auth/change-password', data);
  },
};
