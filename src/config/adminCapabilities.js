// ============================================================
// Admin Capability Registry
// ============================================================
// Controls UI feature visibility based on backend availability.
// If a capability is false, the related UI element should be
// hidden (not shown as broken), disabled, or display a
// "Coming Soon" indicator.
//
// Update this file when backend endpoints are implemented.
// ============================================================

const adminCapabilities = Object.freeze({

  // ── Reports & Exports ──
  reportsExport:       true,   // Backend supports /admin/earnings_export
  reportsAnalytics:    true,   // Backend supports /admin/reports_summary

  // ── Finance ──
  manualWithdrawals:   false,  // Admin-controlled weekly payouts only
  paymentRefunds:      false,  // No refund API implemented
  paymentGatewayConfig: false, // No admin gateway settings API

  // ── Notifications ──
  pushNotifications:   true,   // Admin push send API + Firebase HTTP v1 backend transport
  notificationHistory: true,   // Backend supports /admin/notification_history

  // ── Realtime ──
  realtimeGpsStream:   false,  // No WebSocket/GPS tracking infrastructure
  realtimeWebSocket:   false,  // No WS configuration API

  // ── User Management ──
  roleManagement:      false,  // No role editor API
  adminBookingCancel:  true,   // Backend supports POST /admin/cancel_booking

  // ── AI ──
  aiInsights:          false,  // No AI/ML backend

  // ── Fully Supported ──
  dashboard:           true,
  bookings:            true,
  caregiverManagement: true,
  caregiverApproval:   true,
  caregiverAvailability: true,
  userManagement:      true,
  sosAlerts:           true,
  complaints:          true,
  replacements:        true,
  earnings:            true,
  payouts:             true,
  pricingTiers:        true,
  notifications:       true,   // Create + user-scoped list
  auditLogs:           true,
  reports:             true,
  passwordChange:      true,
  sessionManagement:   true,
});

/**
 * Check if a capability is available
 * @param {string} key - capability name from adminCapabilities
 * @returns {boolean}
 */
export function canUse(key) {
  return adminCapabilities[key] === true;
}

/**
 * Get all unsupported capabilities (for settings/gap display)
 * @returns {string[]}
 */
export function getUnsupported() {
  return Object.entries(adminCapabilities)
    .filter(([, v]) => v === false)
    .map(([k]) => k);
}

export default adminCapabilities;
