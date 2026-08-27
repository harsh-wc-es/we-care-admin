// ── Date Formatting Utility ──
// Consistent date formatting across the admin panel

/**
 * Format a date string to a human-readable format
 * @param {string} dateStr - ISO or MySQL date string
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr, { relative = false, includeTime = true } = {}) {
  if (!dateStr || dateStr === '—') return '—';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  if (relative) {
    return getRelativeTime(date);
  }

  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleString('en-IN', options);
}

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 */
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Format a date to a short format (e.g., "17 May")
 */
export function formatDateShort(dateStr) {
  return formatDate(dateStr, { includeTime: false });
}

/**
 * Format a date to relative time (e.g., "2h ago")
 */
export function formatRelative(dateStr) {
  return formatDate(dateStr, { relative: true });
}
