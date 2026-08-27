const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const DEV_MOCK_MODE = String(import.meta.env.VITE_DEV_MOCK_MODE || '').toLowerCase() === 'true';
const IS_DEV = import.meta.env.DEV;

const AUTH_KEYS = {
  access: 'wecare_admin_token',
  refresh: 'wecare_admin_refresh',
  user: 'wecare_admin_user',
};

function joinUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

function getBackendRootUrl() {
  const apiUrl = new URL(API_BASE_URL, window.location.origin);
  const rootPath = apiUrl.pathname.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  return `${apiUrl.origin}${rootPath}`;
}

function joinBackendRoot(path) {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  return new URL(cleanPath, `${getBackendRootUrl()}/`).toString();
}

function resolveApiUrl(endpoint) {
  if (!endpoint) return '';
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  if (endpoint.startsWith('//')) return `${window.location.protocol}${endpoint}`;
  if (/^\/?api\//i.test(endpoint)) return joinBackendRoot(endpoint);
  if (/^\/?uploads\//i.test(endpoint)) return joinBackendRoot(endpoint);

  const apiUrl = new URL(API_BASE_URL, window.location.origin);
  if (endpoint.startsWith(apiUrl.pathname)) return new URL(endpoint, apiUrl.origin).toString();

  return new URL(joinUrl(endpoint), window.location.origin).toString();
}

function getToken() {
  return localStorage.getItem(AUTH_KEYS.access) || '';
}

function setToken(token) {
  if (token) localStorage.setItem(AUTH_KEYS.access, token);
}

function getRefreshToken() {
  return localStorage.getItem(AUTH_KEYS.refresh) || '';
}

function setRefreshToken(token) {
  if (token) localStorage.setItem(AUTH_KEYS.refresh, token);
}

function setUser(user) {
  if (user) localStorage.setItem(AUTH_KEYS.user, JSON.stringify(user));
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.user) || 'null');
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEYS.access);
  localStorage.removeItem(AUTH_KEYS.refresh);
  localStorage.removeItem(AUTH_KEYS.user);
}

function isAdminUser(user = getUser()) {
  const role = String(user?.role || user?.user_role || '').toLowerCase();
  return role === 'admin' || role === 'super_admin';
}

function isAuthenticated() {
  return Boolean(getToken() && isAdminUser());
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.location.replace('/');
  }
}

function extractPagination(data, json) {
  const source =
    data?.pagination ||
    json?.pagination ||
    data?.meta?.pagination ||
    data?.meta ||
    json?.meta?.pagination ||
    json?.meta ||
    data ||
    {};

  const page = Number(source.page ?? data?.page ?? json?.page ?? 1);
  const limit = Number(source.limit ?? data?.limit ?? json?.limit ?? 0);
  const total = Number(source.total ?? data?.total ?? json?.total ?? 0);
  const totalPages = Number(
    source.total_pages ??
    source.totalPages ??
    data?.total_pages ??
    data?.totalPages ??
    json?.total_pages ??
    json?.totalPages ??
    (limit > 0 && total >= 0 ? Math.ceil(total / limit) : 0)
  );

  if (!page && !limit && !total && !totalPages) return null;

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : null,
    total: Number.isFinite(total) && total >= 0 ? total : 0,
    total_pages: Number.isFinite(totalPages) && totalPages >= 0 ? totalPages : 0,
  };
}

function normalizeResponse(json, httpStatus) {
  if (Array.isArray(json)) {
    if (IS_DEV) console.warn('[API] Bare array response normalized.');
    return {
      ok: httpStatus >= 200 && httpStatus < 300,
      success: httpStatus >= 200 && httpStatus < 300,
      message: '',
      data: json,
      errors: null,
      pagination: null,
    };
  }

  if (!json || typeof json !== 'object') {
    const ok = httpStatus >= 200 && httpStatus < 300;
    return { ok, success: ok, message: '', data: json ?? null, errors: null, pagination: null };
  }

  const hasEnvelope = Object.prototype.hasOwnProperty.call(json, 'success');
  const ok = typeof json.success === 'boolean'
    ? json.success
    : typeof json.ok === 'boolean'
      ? json.ok
      : typeof json.status === 'string'
        ? ['ok', 'success'].includes(json.status.toLowerCase())
        : httpStatus >= 200 && httpStatus < 300;

  const data = hasEnvelope || Object.prototype.hasOwnProperty.call(json, 'data')
    ? json.data ?? null
    : json;

  const pagination = extractPagination(data, json);

  if (IS_DEV && !hasEnvelope && httpStatus >= 200 && httpStatus < 300) {
    console.warn('[API] Non-envelope response normalized:', json);
  }

  return {
    ok,
    success: ok,
    message: json.message || json.error || '',
    data,
    errors: json.errors || null,
    pagination,
  };
}

function normalizeErrorResponse(message, status, errors = null) {
  return {
    ok: false,
    success: false,
    message,
    data: null,
    errors,
    pagination: null,
    status,
  };
}

function extractJsonText(rawText) {
  const trimmed = rawText?.trim?.() || '';
  if (!trimmed) return '';

  const firstObject = trimmed.indexOf('{');
  const firstArray = trimmed.indexOf('[');
  const firstJsonChar = firstObject === -1 ? firstArray : firstArray === -1 ? firstObject : Math.min(firstObject, firstArray);
  if (firstJsonChar === -1) return trimmed;

  let jsonText = trimmed.slice(firstJsonChar);
  const lastObject = jsonText.lastIndexOf('}');
  const lastArray = jsonText.lastIndexOf(']');
  const lastJsonChar = Math.max(lastObject, lastArray);
  if (lastJsonChar >= 0) jsonText = jsonText.slice(0, lastJsonChar + 1);

  if (IS_DEV && firstJsonChar > 0) {
    console.warn('[API] Stripped non-JSON response prefix:', trimmed.slice(0, firstJsonChar).slice(0, 200));
  }

  return jsonText;
}

async function parseResponse(response, method, endpoint, debugLabel = '') {
  const rawText = await response.text();
  if (IS_DEV && debugLabel) {
    console.debug(`[API] ${debugLabel} backend response body`, rawText);
  }
  if (!rawText?.trim()) {
    const ok = response.status >= 200 && response.status < 300;
    return { ok, success: ok, message: '', data: null, errors: null, pagination: null, status: response.status };
  }

  try {
    const json = JSON.parse(extractJsonText(rawText));
    return { ...normalizeResponse(json, response.status), status: response.status };
  } catch (error) {
    if (IS_DEV) {
      console.warn(`[API] Malformed JSON from ${method} ${endpoint}`, error);
      console.warn('[API] Raw response:', rawText.slice(0, 500));
    }
    return normalizeErrorResponse('Invalid server response. Please try again.', response.status);
  }
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  const response = await request('/auth/refresh-token', {
    method: 'POST',
    body: { refresh },
    skipAuthRedirect: true,
    skipRefresh: true,
  });

  const access = response.data?.access || response.data?.access_token || response.data?.token;
  if (response.ok && access) {
    setToken(access);
    return true;
  }

  return false;
}

async function documentError(response, fallback) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await response.json().catch(() => null);
    return json?.message || json?.error || fallback;
  }

  return fallback;
}

async function fetchProtectedBlob(endpoint, { skipRefresh = false } = {}) {
  const token = getToken();
  if (!endpoint) throw new Error('Document link is missing.');
  if (!token) {
    clearAuth();
    redirectToLogin();
    throw new Error('Admin session expired. Please login again.');
  }

  const resolvedUrl = resolveApiUrl(endpoint);
  if (IS_DEV) console.debug('[Document viewer] fetch request', { resolvedUrl, tokenExists: Boolean(token) });

  let response;
  try {
    response = await fetch(resolvedUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf,image/*,*/*',
      },
      mode: 'cors',
    });
  } catch (error) {
    if (IS_DEV) console.warn('[Document viewer] fetch failed before response', { resolvedUrl, error });
    if (error instanceof TypeError) {
      throw new Error('Could not reach document server. Check API URL/CORS.', { cause: error });
    }
    throw error;
  }

  const responseContentType = response.headers.get('content-type') || '';
  if (IS_DEV) {
    console.debug('[Document viewer] fetch response', {
      resolvedUrl,
      status: response.status,
      contentType: responseContentType,
    });
  }

  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return fetchProtectedBlob(endpoint, { skipRefresh: true });
  }

  if (response.status === 401) {
    clearAuth();
    redirectToLogin();
    throw new Error(await documentError(response, 'Admin session expired. Please login again.'));
  }

  if (!response.ok) {
    throw new Error(await documentError(response, 'Unable to open document.'));
  }

  const contentType = responseContentType;
  if (contentType.includes('application/json') || contentType.includes('text/html')) {
    throw new Error(contentType.includes('text/html')
      ? 'Document endpoint returned HTML instead of a file.'
      : await documentError(response, 'Unable to open document file.'));
  }

  const blob = await response.blob();
  return { blob, contentType };
}

async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    params,
    isFormData = false,
    skipAuthRedirect = false,
    skipRefresh = false,
    skipAuthHeader = false,
    debugLabel = '',
  } = options;

  const url = new URL(joinUrl(endpoint), window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const headers = {};
  const token = getToken();
  if (token && !skipAuthHeader) headers.Authorization = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  try {
    if (IS_DEV && debugLabel) {
      console.debug(`[API] ${debugLabel} URL`, url.toString());
      console.debug(`[API] ${debugLabel} request`, {
        method,
        hasAuthHeader: Boolean(headers.Authorization),
        body: isFormData ? '[FormData]' : body ?? null,
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
    if (IS_DEV && debugLabel) {
      console.debug(`[API] ${debugLabel} HTTP status`, response.status);
    }

    if (response.status === 401 && !skipRefresh) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return request(endpoint, { ...options, skipRefresh: true });
    }

    const parsed = await parseResponse(response, method, endpoint, debugLabel);

    if (response.status === 401 && !skipAuthRedirect) {
      clearAuth();
      redirectToLogin();
      return {
        ...parsed,
        ok: false,
        success: false,
        message: parsed.message || 'Session expired. Please login again.',
      };
    }

    if (response.status === 403) {
      return {
        ...parsed,
        ok: false,
        success: false,
        message: parsed.message || 'You do not have permission to perform this action.',
      };
    }

    if (response.status === 404) {
      return { ...parsed, ok: false, success: false, message: parsed.message || 'Requested resource was not found.' };
    }

    if (response.status === 422) {
      return { ...parsed, ok: false, success: false, message: parsed.message || 'Please check the highlighted fields.' };
    }

    if (response.status >= 500) {
      return { ...parsed, ok: false, success: false, message: parsed.message || 'Server error. Please try again later.' };
    }

    return parsed;
  } catch (error) {
    if (IS_DEV) {
      console.warn(`[API] Network error from ${method} ${endpoint}`, {
        url: url.toString(),
        method,
        error,
      });
    }
    return normalizeErrorResponse(
      error?.name === 'AbortError' ? 'Request was cancelled.' : 'Network error. Please check your connection.',
      0
    );
  }
}

function normalizeListResponse(res) {
  const data = res?.data;
  const items =
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data) && data) ||
    [];

  return {
    ...res,
    items,
    pagination: res?.pagination || extractPagination(data, res) || null,
  };
}

const api = {
  get: (endpoint, params) => request(endpoint, { method: 'GET', params }),
  publicGet: (endpoint, params, options = {}) => request(endpoint, {
    ...options,
    method: 'GET',
    params,
    skipAuthHeader: true,
    skipAuthRedirect: true,
    skipRefresh: true,
  }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  publicPost: (endpoint, body, options = {}) => request(endpoint, {
    ...options,
    method: 'POST',
    body,
    skipAuthHeader: true,
    skipAuthRedirect: true,
    skipRefresh: true,
  }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  del: (endpoint, body) => request(endpoint, { method: 'DELETE', body }),
  upload: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData, isFormData: true }),
};

export {
  API_BASE_URL,
  DEV_MOCK_MODE,
  api,
  fetchProtectedBlob,
  getBackendRootUrl,
  normalizeListResponse,
  resolveApiUrl,
  getToken,
  setToken,
  getRefreshToken,
  setRefreshToken,
  getUser,
  setUser,
  clearAuth,
  isAdminUser,
  isAuthenticated,
};
