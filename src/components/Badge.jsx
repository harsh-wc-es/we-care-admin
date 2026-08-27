// ── Badge Label Map ──
// Converts raw backend enum values to human-readable labels
const LABEL_MAP = {
  // Availability
  available: 'Available',
  unavailable: 'Unavailable',
  busy: 'Busy',
  offline: 'Offline',
  admin_override: 'Admin Override',
  active_visit: 'Active Visit',
  manual: 'Manual',
  manual_on: 'Available',
  manual_off: 'Unavailable',
  on_visit: 'On Visit',
  admin_forced_off: 'Admin Locked',
  admin_forced_on: 'Admin Forced',
  pending_review: 'Pending Review',
  needs_resubmission: 'Needs Reupload',
  banned: 'Banned',
  reuploaded: 'Reuploaded',
  // Payout lifecycle
  hold: 'Hold',
  ready: 'Ready',
  ready_for_payout: 'Ready For Payout',
  ready_to_pay: 'Ready For Payout',
  pending_payout: 'Pending Payout',
  payout_hold: 'Hold',
  pending: 'Pending',
  processing: 'Processing',
  processed: 'Processed',
  paid: 'Paid',
  paid_history: 'Paid',
  failed: 'Failed',
  blocked: 'Blocked',
  not_applicable: 'N/A',
  // Booking
  replacement_requested: 'Replacement',
  sos_active: 'SOS Active',
  // Complaint
  under_review: 'Under Review',
  action_required: 'Action Required',
  // Notification
  all_caregivers: 'All Caretakers',
  all_users: 'All Users',
  specific_caregiver: 'Specific Caretaker',
  specific_user: 'Specific User',
  // Payment
  partially_paid: 'Partial',
  payment_pending: 'Pending',
  refunded: 'Refunded',
  disputed: 'Disputed',
  // Refund lifecycle
  refund_pending: 'Pending',
  refund_approved: 'Approved',
  refund_rejected: 'Rejected',
  refund_processed: 'Processed',
  refund_failed: 'Failed',
  // SOS
  contacted_patient: 'Patient Contacted',
  contacted_caretaker: 'Caretaker Contacted',
  // Replacement
  replacement_assigned: 'Assigned',
  replacement_completed: 'Completed',
  // Pricing
  service_quality: 'Service Quality',
};

export default function Badge({ status }) {
  const raw = status || '';
  const s = raw.toLowerCase().replace(/\s+/g, '-');
  const label = LABEL_MAP[raw] || LABEL_MAP[raw.toLowerCase()] || raw.replace(/_/g, ' ');
  return <span className={`badge badge-${s}`}>{label || 'Unknown'}</span>;
}
