const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const APP_PATH_PREFIX = '/wecare';

function backendRoot() {
  const apiUrl = new URL(API_BASE_URL, window.location.origin);
  const rootPath = apiUrl.pathname.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');
  return `${apiUrl.origin}${rootPath}`;
}

function joinBackendRoot(path) {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  return new URL(cleanPath, `${backendRoot()}/`).toString();
}

function normalizeUploadPath(path) {
  let cleanPath = String(path || '').trim().replace(/\\/g, '/');
  if (!cleanPath) return '';

  cleanPath = cleanPath.replace(/^\/+/, '/');
  if (cleanPath.toLowerCase().startsWith(`${APP_PATH_PREFIX}/uploads/`)) {
    cleanPath = cleanPath.slice(APP_PATH_PREFIX.length);
  }

  if (cleanPath.toLowerCase().startsWith('/uploads/')) return cleanPath;
  if (cleanPath.toLowerCase().startsWith('uploads/')) return `/${cleanPath}`;
  if (cleanPath.toLowerCase().startsWith('/storage/uploads/')) return cleanPath;
  if (cleanPath.toLowerCase().startsWith('storage/uploads/')) return `/${cleanPath}`;

  return cleanPath;
}

export function normalizeFileUrl(rawPath) {
  if (rawPath === null || rawPath === undefined) return '';

  const value = String(rawPath).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `${window.location.protocol}${value}`;

  const uploadPath = normalizeUploadPath(value);
  if (/^\/?(uploads|storage\/uploads)\//i.test(uploadPath)) {
    return joinBackendRoot(uploadPath);
  }

  if (/^\/?api\/v1\//i.test(uploadPath)) {
    return joinBackendRoot(uploadPath.replace(/^\/?api\/v1\/?/i, 'api/v1/'));
  }

  return joinBackendRoot(uploadPath);
}

export function openFileUrl(rawPath, { onError } = {}) {
  const normalizedUrl = normalizeFileUrl(rawPath);

  if (import.meta.env.DEV) {
    console.log('[file-view]', { rawPath, normalizedUrl });
  }

  if (!normalizedUrl) {
    const message = 'File link is missing.';
    if (typeof onError === 'function') onError(message);
    return false;
  }

  const opened = window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    const message = 'Popup blocked. Please allow popups to view the file.';
    if (typeof onError === 'function') onError(message);
    return false;
  }

  return true;
}
