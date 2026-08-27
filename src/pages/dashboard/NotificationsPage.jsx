import { useCallback, useEffect, useMemo, useState } from 'react';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';
import usePagination from '../../hooks/usePagination';
import useToast from '../../hooks/useToast';
import { notificationService } from '../../services/notificationService';
import { extractItems } from '../../utils/apiData';

const SEND_TYPES = [
  { value: 'single_user', label: 'Single User', targetRole: 'family' },
  { value: 'single_caretaker', label: 'Single Caretaker', targetRole: 'caretaker' },
  { value: 'all_users', label: 'All Users' },
  { value: 'all_caretakers', label: 'All Caretakers' },
  { value: 'broadcast', label: 'Broadcast / Everyone' },
];

const EMPTY_FORM = {
  title: '',
  body: '',
  send_type: 'single_user',
  target_user_id: '',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #DCE8D4',
  borderRadius: 6,
  fontSize: 13,
  fontFamily: 'inherit',
  background: '#F8FBF5',
  outline: 'none',
};

function targetLabel(target) {
  const name = target.name || target.username || `User #${target.id}`;
  const contact = target.email || target.phone || target.phone_number || '';
  return contact ? `${name} - ${contact}` : name;
}

function summaryText(data) {
  if (!data) return '';
  return `Targets: ${data.total_targets ?? 0} | Tokens: ${data.total_tokens ?? 0} | Sent: ${data.sent_count ?? 0} | Failed: ${data.failed_count ?? 0} | Skipped: ${data.skipped_count ?? 0}`;
}

function normalizeDeliveryStatus(status) {
  const value = String(status || '').toLowerCase();
  if (['sent', 'success', 'processed'].includes(value)) {
    return { label: 'Sent', tone: 'success' };
  }
  if (['no_active_device_token', 'no active device token', 'queued', 'saved'].includes(value)) {
    return { label: value === 'queued' || value === 'saved' ? 'Saved' : 'No Active Device Token', tone: 'warning' };
  }
  if (['failed', 'error', 'firebase_not_configured', 'partially_failed'].includes(value)) {
    return { label: value === 'partially_failed' ? 'Partially Failed' : 'Failed', tone: 'error' };
  }
  return { label: status || 'Saved', tone: 'neutral' };
}

function DeliveryStatusBadge({ status }) {
  const normalized = normalizeDeliveryStatus(status);
  return <span className={`notification-status-badge notification-status-badge--${normalized.tone}`}>{normalized.label}</span>;
}

export default function NotificationsPage() {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [targets, setTargets] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetsError, setTargetsError] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');
  const { page, limit, totalPages, setPage, setTotalFromResponse } = usePagination(20);
  const { toast, showToast, hideToast } = useToast();

  const selectedSendType = useMemo(
    () => SEND_TYPES.find((item) => item.value === form.send_type) || SEND_TYPES[0],
    [form.send_type]
  );
  const needsTarget = form.send_type === 'single_user' || form.send_type === 'single_caretaker';

  const loadTargets = useCallback(async (role) => {
    if (!role) {
      setTargets([]);
      setTargetsError('');
      return;
    }

    setTargetsLoading(true);
    setTargetsError('');
    const res = await notificationService.getNotificationTargets({ role, limit: 100 });
    if (res.success) {
      const list = Array.isArray(res.data) ? res.data : extractItems(res.data, res.data?.items);
      setTargets(list);
    } else {
      setTargets([]);
      setTargetsError(res.message || 'Unable to load notification targets.');
    }
    setTargetsLoading(false);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError('');
    const res = await notificationService.getPushLogs({ page, limit });
    if (res.success) {
      setLogs(extractItems(res.data, res.data?.logs));
      setTotalFromResponse(res.pagination || res.data);
    } else {
      setLogsError(res.message || 'Unable to load notification logs.');
    }
    setLogsLoading(false);
  }, [page, limit, setTotalFromResponse]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setForm((current) => ({ ...current, target_user_id: '' }));
    if (selectedSendType.targetRole) {
      loadTargets(selectedSendType.targetRole);
    } else {
      setTargets([]);
      setTargetsError('');
    }
  }, [selectedSendType.targetRole, loadTargets]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setResult(null);
    setFormErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleSend = async () => {
    const title = form.title.trim();
    const body = form.body.trim();
    const errors = {};

    if (!title) errors.title = 'Title is required.';
    if (!body) errors.body = 'Message is required.';
    if (!form.send_type) errors.send_type = 'Send type is required.';
    if (title.length > 120) {
      errors.title = 'Title must be 120 characters or fewer.';
    }
    if (body.length > 500) {
      errors.body = 'Message must be 500 characters or fewer.';
    }
    if (needsTarget && !form.target_user_id) {
      errors.target_user_id = 'Please select a target before sending.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setResult({ success: false, message: 'Please fix the highlighted fields.' });
      return;
    }

    setFormErrors({});
    setSending(true);
    setResult(null);
    const res = await notificationService.sendPushNotification({
      send_type: form.send_type,
      target_user_id: needsTarget ? Number(form.target_user_id) : undefined,
      title,
      body,
      type: 'admin_push',
    });

    setResult(res);
    if (res.success) {
      showToast(res.message || 'Notification processed successfully');
      setForm({ ...EMPTY_FORM });
      fetchLogs();
    } else {
      showToast(res.message || 'Unable to send notification', 'error');
    }
    setSending(false);
  };

  const logColumns = [
    { key: 'title', label: 'Title', render: (row) => <strong className="notification-log-title" title={row.title || ''}>{row.title || '-'}</strong> },
    { key: 'message', label: 'Message', render: (row) => <span className="notification-log-message" title={row.message || ''}>{row.message || '-'}</span> },
    { key: 'recipient', label: 'Recipient', render: (row) => row.recipient_name || row.recipient_email || (row.user_id ? `#${row.user_id}` : '-') },
    { key: 'role', label: 'Role', render: (row) => <Badge status={row.recipient_role || 'unknown'} /> },
    { key: 'status', label: 'Status', render: (row) => <DeliveryStatusBadge status={row.sent_status || row.metadata?.push_status || 'saved'} /> },
    { key: 'created_at', label: 'Created', render: (row) => row.created_at || '-' },
  ];

  const renderMobileLog = (row) => (
    <div className="mobile-data-card__fields">
      <div>
        <strong style={{ color: '#1b4d1c', fontSize: 13 }}>{row.title || 'Untitled notification'}</strong>
        <p className="text-wrap-anywhere" style={{ margin: '6px 0 0', color: '#4B5563', fontSize: 12 }}>{row.message || '-'}</p>
      </div>
      <div className="mobile-data-card__field"><span>Recipient</span><strong>{row.recipient_name || row.recipient_email || '-'}</strong></div>
      <div className="mobile-data-card__field"><span>Role</span><strong><Badge status={row.recipient_role || 'unknown'} /></strong></div>
      <div className="mobile-data-card__field"><span>Status</span><strong><DeliveryStatusBadge status={row.sent_status || row.metadata?.push_status || 'saved'} /></strong></div>
      <div className="mobile-data-card__field"><span>Created</span><strong>{row.created_at || '-'}</strong></div>
    </div>
  );

  return (
    <>
      <TopBar searchPlaceholder="Search notifications..." />
      <div className="page-content">
        <div className="responsive-page-header">
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>Push Notifications</h1>
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
              Send Firebase push notifications to users, caretakers, or everyone.
            </p>
          </div>
          <button className="btn btn-outline" type="button" onClick={fetchLogs} disabled={logsLoading}>
            Refresh Logs
          </button>
        </div>

        <div className="notification-admin-grid">
          <section className="settings-card notification-compose-card">
            <div className="settings-card-header">
              <div>
                <h3>Compose Push Notification</h3>
                <p>Messages are saved in notification history and sent through Firebase HTTP v1.</p>
              </div>
            </div>

            <div className="responsive-form-grid">
              <label className="form-field">
                <span>Notification Title *</span>
                <input
                  style={inputStyle}
                  value={form.title}
                  maxLength={120}
                  onChange={(event) => handleChange('title', event.target.value)}
                  placeholder="Notification title"
                  aria-invalid={Boolean(formErrors.title)}
                />
                {formErrors.title && <small className="settings-field-error">{formErrors.title}</small>}
                <small>{form.title.length}/120</small>
              </label>

              <label className="form-field">
                <span>Send Type *</span>
                <select
                  style={inputStyle}
                  value={form.send_type}
                  onChange={(event) => handleChange('send_type', event.target.value)}
                  aria-invalid={Boolean(formErrors.send_type)}
                >
                  {SEND_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {formErrors.send_type && <small className="settings-field-error">{formErrors.send_type}</small>}
              </label>
            </div>

            {needsTarget && (
              <label className="form-field" style={{ marginTop: 12 }}>
                <span>{form.send_type === 'single_caretaker' ? 'Select Caretaker *' : 'Select User *'}</span>
                <select
                  style={inputStyle}
                  value={form.target_user_id}
                  onChange={(event) => handleChange('target_user_id', event.target.value)}
                  disabled={targetsLoading}
                  aria-invalid={Boolean(formErrors.target_user_id)}
                >
                  <option value="">{targetsLoading ? 'Loading targets...' : 'Choose a target'}</option>
                  {targets.map((target) => (
                    <option key={target.id} value={target.id}>{targetLabel(target)}</option>
                  ))}
                </select>
                {formErrors.target_user_id && <small className="settings-field-error">{formErrors.target_user_id}</small>}
                {targetsError && <small style={{ color: '#DC2626' }}>{targetsError}</small>}
                {!targetsLoading && !targetsError && targets.length === 0 && (
                  <small>No active targets found for this send type.</small>
                )}
              </label>
            )}

            <label className="form-field" style={{ marginTop: 12 }}>
              <span>Notification Message *</span>
              <textarea
                style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                value={form.body}
                maxLength={500}
                onChange={(event) => handleChange('body', event.target.value)}
                placeholder="Write the notification message..."
                aria-invalid={Boolean(formErrors.body)}
              />
              {formErrors.body && <small className="settings-field-error">{formErrors.body}</small>}
              <small>{form.body.length}/500</small>
            </label>

            {result && (
              <div className={`inline-alert ${result.success ? 'inline-alert--success' : 'inline-alert--error'}`} style={{ marginTop: 12 }}>
                <strong>{result.message || (result.success ? 'Notification processed.' : 'Unable to send notification.')}</strong>
                {result.success && <span>{summaryText(result.data)}</span>}
                {result.success && Number(result.data?.total_tokens ?? 0) === 0 && (
                  <span>No active device tokens were found for the selected target group.</span>
                )}
                {Array.isArray(result.data?.errors) && result.data.errors.length > 0 && (
                  <span>{result.data.errors[0]?.message || 'Some devices could not receive the notification.'}</span>
                )}
              </div>
            )}

            <div className="responsive-button-row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" type="button" onClick={handleSend} disabled={sending || targetsLoading}>
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => { setForm({ ...EMPTY_FORM }); setResult(null); }}>
                Reset
              </button>
            </div>
          </section>

          <section>
            <div className="settings-card-header" style={{ marginBottom: 8 }}>
              <div>
                <h3>Notification Logs</h3>
                <p>Recent admin push notification history.</p>
              </div>
            </div>
            {logsError && <ErrorState title={logsError} onRetry={fetchLogs} />}
            <div className="table-card notification-logs-table-card">
              <DataTable
                columns={logColumns}
                rows={logs}
                loading={logsLoading}
                emptyState={<EmptyState title="No push notifications yet" message="Sent admin push notifications will appear here." />}
                renderMobileCard={renderMobileLog}
              />
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={logsLoading} />
          </section>
        </div>
      </div>
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
