import { useEffect, useState, useCallback } from 'react';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import DrawerPanel from '../../components/DrawerPanel';
import ConfirmationModal from '../../components/ConfirmationModal';
import Pagination from '../../components/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Toast from '../../components/Toast';
import usePagination from '../../hooks/usePagination';
import useToast from '../../hooks/useToast';
import { sosService } from '../../services/sosService';
import { extractItems } from '../../utils/apiData';

const FILTERS = ['all', 'open', 'resolved'];

const firstValue = (obj, keys) => {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], obj);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
};

const alertId = (row) => firstValue(row, ['sos_id', 'alert_id', 'id']);
const reporterDisplay = (row) => firstValue(row, [
  'reporter_name',
  'reporter_username',
  'user_name',
  'raised_by_name',
  'family_name',
  'reporter.username',
  'reporter.email',
  'username',
  'email',
]) || '—';
const reporterRole = (row) => firstValue(row, ['reporter_role', 'reporter.role', 'role']) || '—';
const caretakerDisplay = (row) => firstValue(row, [
  'caretaker_name',
  'caregiver_name',
  'assigned_caretaker_name',
  'caretaker_username',
  'booking.caretaker_name',
  'booking.caregiver_name',
  'booking.caretaker_username',
  'caretaker.name',
  'caretaker.username',
  'caretaker_email',
  'caretaker_phone',
]) || '—';
const bookingLabel = (row) => firstValue(row, [
  'formatted_booking_id',
  'booking.formatted_booking_id',
]) || (firstValue(row, ['booking_id', 'booking.booking_id', 'booking.id']) ? `#${firstValue(row, ['booking_id', 'booking.booking_id', 'booking.id'])}` : '—');
const patientDisplay = (row) => firstValue(row, ['patient_name', 'booking.patient_name', 'patient.name', 'patient.patient_name']) || '—';
const familyDisplay = (row) => firstValue(row, ['family_name', 'booking.family_name', 'booking.family_username', 'family.name', 'family.username']) || '—';
const locationDisplay = (row) => firstValue(row, ['location_text', 'location.location_text'])
  || (firstValue(row, ['latitude', 'location.latitude']) && firstValue(row, ['longitude', 'location.longitude'])
    ? `${firstValue(row, ['latitude', 'location.latitude'])}, ${firstValue(row, ['longitude', 'location.longitude'])}`
    : '—');
const triggeredAt = (row) => firstValue(row, ['triggered_at', 'created_at', 'alert.triggered_at', 'alert.created_at']);

export default function SOSAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { page, limit, totalPages, setPage, setTotalFromResponse, resetPage } = usePagination(20);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { page, limit, status: filter };
    const res = await sosService.listAlerts(params);
    if (res.success) {
      setAlerts(extractItems(res.data, res.data?.sos_alerts, res.data?.alerts));
      setTotalFromResponse(res.pagination || res.data);
    } else {
      setError(res.message || 'Failed to load SOS alerts');
    }
    setLoading(false);
  }, [filter, page, limit, setTotalFromResponse]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    resetPage();
  };

  const openDetail = async (row) => {
    setSelected(row);
    setDetailLoading(true);
    const res = await sosService.getAlertDetail(alertId(row));
    if (res.success) setSelected({ ...row, ...(res.data || {}) });
    else showToast(res.message || 'Failed to load SOS detail', 'error');
    setDetailLoading(false);
  };

  const handleResolve = async () => {
    setProcessing(true);
    const res = await sosService.resolveAlert({ id: alertId(selected) });
    if (res.success) {
      showToast(res.message || 'SOS alert resolved');
      await fetchAlerts();
      const currentId = alertId(selected);
      if (currentId) {
        const detail = await sosService.getAlertDetail(currentId);
        if (detail.success) setSelected({ ...(selected || {}), ...(detail.data || {}) });
        else setSelected(null);
      }
      setModal(null);
    } else {
      showToast(res.message || 'Failed to resolve SOS alert', 'error');
    }
    setProcessing(false);
  };

  const columns = [
    { key: 'id', label: 'SOS ID', render: (row) => <span style={{ fontWeight: 700, fontSize: 12, color: '#DC2626' }}>SOS #{alertId(row)}</span> },
    { key: 'reporter', label: 'Reporter', render: (row) => reporterDisplay(row) },
    { key: 'role', label: 'Role', render: (row) => <Badge status={reporterRole(row)} /> },
    { key: 'caretaker', label: 'Caretaker', render: (row) => caretakerDisplay(row) },
    { key: 'booking_id', label: 'Booking', render: (row) => bookingLabel(row) },
    { key: 'patient', label: 'Patient', render: (row) => patientDisplay(row) },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
    { key: 'triggered_at', label: 'Triggered', render: (row) => triggeredAt(row) || '—' },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => openDetail(row)}>View</button>
          {row.status === 'open' && (
            <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 10px', background: '#DC2626', borderColor: '#DC2626' }} disabled={processing} onClick={() => { setSelected(row); setModal('resolve'); }}>Resolve</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar searchPlaceholder="Search SOS alerts..." />
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2, color: '#DC2626' }}>SOS Alerts</h1>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Emergency queue - handle active SOS first.</p>
          </div>
          <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 6 }}>
            {alerts.filter((alert) => alert.status === 'open').length} active
          </span>
        </div>
        <FilterBar filters={FILTERS} active={filter} onChange={handleFilterChange} />
        {error && <ErrorState title={error} onRetry={fetchAlerts} />}
        <div className="table-card">
          <DataTable columns={columns} rows={alerts} loading={loading}
            emptyState={<EmptyState title="No SOS alerts" message="All clear - no active SOS alerts." />} />
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </div>

      {selected && !modal && (
        <DrawerPanel title={`SOS Alert #${alertId(selected)}`} onClose={() => setSelected(null)}>
          {detailLoading ? <LoadingSkeleton style={{ height: 220 }} /> : (
            <>
              <div className="user-drawer__section"><h4>Alert Details</h4><div className="user-info-grid">
                <div className="user-info-item"><span>Status</span><p><Badge status={selected.status} /></p></div>
                <div className="user-info-item"><span>Reporter</span><p>{reporterDisplay(selected)}</p></div>
                <div className="user-info-item"><span>Reporter Role</span><p><Badge status={reporterRole(selected)} /></p></div>
                <div className="user-info-item"><span>Booking</span><p>{bookingLabel(selected)}</p></div>
                <div className="user-info-item"><span>Patient</span><p>{patientDisplay(selected)}</p></div>
                <div className="user-info-item"><span>Family</span><p>{familyDisplay(selected)}</p></div>
                <div className="user-info-item"><span>Caretaker</span><p>{caretakerDisplay(selected)}</p></div>
                <div className="user-info-item"><span>Caretaker Phone</span><p>{firstValue(selected, ['caretaker_phone', 'caregiver_phone', 'booking.caretaker_phone', 'caretaker.phone']) || '—'}</p></div>
                <div className="user-info-item"><span>Triggered</span><p>{triggeredAt(selected) || '—'}</p></div>
                <div className="user-info-item"><span>Location</span><p>{locationDisplay(selected)}</p></div>
              </div></div>

              {selected.booking && (
                <div className="user-drawer__section"><h4>Booking Context</h4><div className="user-info-grid">
                  <div className="user-info-item"><span>Booking</span><p>{bookingLabel(selected)}</p></div>
                  <div className="user-info-item"><span>Service</span><p>{selected.booking.service_type || '—'}</p></div>
                  <div className="user-info-item"><span>Status</span><p><Badge status={selected.booking.status || selected.booking.booking_status || '—'} /></p></div>
                  <div className="user-info-item"><span>Date</span><p>{selected.booking.booking_date || '—'}</p></div>
                  <div className="user-info-item"><span>Schedule</span><p>{selected.booking.start_time || '—'}{selected.booking.end_time ? ` - ${selected.booking.end_time}` : ''}</p></div>
                  <div className="user-info-item"><span>Address</span><p>{selected.booking.address || '—'}</p></div>
                </div></div>
              )}

              {selected.message && <div className="user-drawer__section"><h4>Message</h4><p style={{ fontSize: 13, color: '#374151', overflowWrap: 'anywhere' }}>{selected.message}</p></div>}

              {(selected.resolved_at || selected.resolution?.resolved_at || selected.resolved_by_name || selected.resolution?.resolved_by_name) && (
                <div className="user-drawer__section"><h4>Resolution</h4><div className="user-info-grid">
                  <div className="user-info-item"><span>Resolved At</span><p>{selected.resolved_at || selected.resolution?.resolved_at || '—'}</p></div>
                  <div className="user-info-item"><span>Resolved By</span><p>{selected.resolved_by_name || selected.resolution?.resolved_by_name || '—'}</p></div>
                </div></div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12 }}>
                {selected.status !== 'resolved' && <button className="btn btn-primary" style={{ fontSize: 12, background: '#DC2626', borderColor: '#DC2626' }} disabled={processing} onClick={() => setModal('resolve')}>{processing ? 'Processing...' : 'Resolve'}</button>}
              </div>
            </>
          )}
        </DrawerPanel>
      )}

      {modal === 'resolve' && (
        <ConfirmationModal title="Resolve SOS Alert" message={`Are you sure you want to resolve SOS #${alertId(selected)}? This marks the emergency as handled.`}
          onConfirm={handleResolve} onCancel={() => setModal(null)} confirmLabel={processing ? 'Resolving...' : 'Resolve'} loading={processing} />
      )}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
