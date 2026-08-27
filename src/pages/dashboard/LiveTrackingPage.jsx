import { useEffect, useState, useCallback } from 'react';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import DrawerPanel from '../../components/DrawerPanel';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { visitService } from '../../services/visitService';
import { formatDate, formatRelative } from '../../utils/formatDate';
import { asArray, extractItems } from '../../utils/apiData';

const firstValue = (obj, keys) => {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], obj);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
};

const bookingId = (row) => firstValue(row, ['booking_id', 'id']);
const bookingLabel = (row) => firstValue(row, ['booking_code', 'formatted_booking_id']) || (bookingId(row) ? `#${bookingId(row)}` : '—');
const patientDisplay = (row) => firstValue(row, ['patient_name', 'patient.name', 'patient.patient_name']) || '—';
const familyDisplay = (row) => firstValue(row, ['family_name', 'family.name', 'family_username', 'family.username', 'family_email']) || '—';
const caretakerDisplay = (row) => firstValue(row, [
  'caretaker_name',
  'caregiver_name',
  'assigned_caretaker_name',
  'caretaker_full_name',
  'caretaker_username',
  'caretaker.name',
  'caretaker.caretaker_name',
  'caretaker.username',
  'caretaker_email',
  'caretaker_phone',
]) || '—';
const statusDisplay = (row) => firstValue(row, ['visit_status', 'booking_status', 'status']);
const startedAt = (row) => firstValue(row, ['checked_in_at', 'check_in_time', 'started_at', 'start_time']);
const endAt = (row) => firstValue(row, ['checked_out_at', 'check_out_time', 'end_time']);
const sosCount = (row) => Number(firstValue(row, ['active_sos_count', 'sos_count']) || 0);
const linkedSosAlerts = (row) => asArray(firstValue(row, ['sos_alerts']));

export default function LiveTrackingPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await visitService.listActiveVisits({ limit: 50 });
    if (res.success) {
      setVisits(extractItems(res.data, res.data?.bookings, res.data?.active_visits, res.data?.visits));
    } else {
      setError(res.message || 'Failed to load live visits');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVisits();
    const interval = setInterval(fetchVisits, 30000);
    return () => clearInterval(interval);
  }, [fetchVisits]);

  const openDetail = async (row) => {
    setSelected(row);
    const id = bookingId(row);
    if (!id) return;
    setDetailLoading(true);
    const res = await visitService.getActiveVisitDetail(id);
    if (res.success) {
      setSelected({ ...row, ...(res.data || {}), id, booking_id: id });
    }
    setDetailLoading(false);
  };

  const safeVisits = asArray(visits);
  const filtered = safeVisits.filter((visit) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return patientDisplay(visit).toLowerCase().includes(s)
      || caretakerDisplay(visit).toLowerCase().includes(s)
      || familyDisplay(visit).toLowerCase().includes(s)
      || String(bookingId(visit)).includes(s);
  });

  const columns = [
    { key: 'id', label: 'Booking', render: (row) => <span style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>{bookingLabel(row)}</span> },
    { key: 'patient', label: 'Patient', render: (row) => patientDisplay(row) },
    { key: 'caretaker', label: 'Caretaker', render: (row) => caretakerDisplay(row) },
    { key: 'status', label: 'Status', render: (row) => <Badge status={statusDisplay(row)} /> },
    { key: 'start_time', label: 'Started', render: (row) => formatRelative(startedAt(row)) },
    { key: 'end_time', label: 'End Time', render: (row) => formatDate(endAt(row)) || '—' },
    { key: 'sos', label: 'SOS', render: (row) => sosCount(row) > 0 ? <span className="badge badge-sos_active">{sosCount(row)} active</span> : '—' },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => openDetail(row)}>Details</button>
      ),
    },
  ];

  const detailRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #F3F6EE', fontSize: 13 }}>
      <span style={{ color: '#6B7280', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#1F2937', fontWeight: 500, textAlign: 'right', overflowWrap: 'anywhere' }}>{value || '—'}</span>
    </div>
  );

  return (
    <>
      <TopBar searchPlaceholder="Search active visits..." onSearch={setSearch} />
      <div className="page-content">
        <div className="responsive-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>Active Visits</h1>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Monitor ongoing visits and live care sessions. Auto-refreshes every 30s.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', animation: 'skeleton-pulse 1.5s infinite' }} />
            <span style={{ fontSize: 12, color: '#6B7280' }}>Live</span>
            <button className="btn btn-outline" style={{ fontSize: 12 }} onClick={fetchVisits}>Refresh</button>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 14 }}>
          <div className="stat-card" style={{ borderLeft: '3px solid #16A34A' }}>
            <div className="stat-label">Active Visits</div>
            <div className="stat-value" style={{ color: '#16A34A' }}>{filtered.length}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #DC2626' }}>
            <div className="stat-label">SOS Active</div>
            <div className="stat-value" style={{ color: '#DC2626' }}>{safeVisits.filter((v) => v.has_sos || sosCount(v) > 0).length}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #2563EB' }}>
            <div className="stat-label">Checked In</div>
            <div className="stat-value" style={{ color: '#2563EB' }}>{safeVisits.filter((v) => statusDisplay(v) === 'in_progress').length}</div>
          </div>
        </div>

        {error && <ErrorState title="Unable to load active visits" message={error} onRetry={fetchVisits} />}

        <div className="table-card">
          <div style={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto' }}>
            <DataTable
              columns={columns}
              rows={filtered}
              loading={loading}
              emptyState={<EmptyState title="No active visits" message="Active visits will appear here when care sessions are in progress." />}
            />
          </div>
        </div>
      </div>

      {selected && (
        <DrawerPanel title={`Visit ${bookingLabel(selected)}`} onClose={() => setSelected(null)}>
          <div style={{ padding: '4px 0' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1b4d1c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Booking Info</h4>
            {detailRow('Booking ID', bookingLabel(selected))}
            {detailRow('Status', <Badge status={statusDisplay(selected)} />)}
            {detailRow('Service', selected.service_type)}
            {detailRow('Schedule', `${formatDate(selected.booking_date, { includeTime: false }) || '—'} ${selected.start_time || ''}${selected.end_time ? ` - ${selected.end_time}` : ''}`)}
          </div>

          <div style={{ padding: '12px 0 4px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1b4d1c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>People</h4>
            {detailRow('Patient', patientDisplay(selected))}
            {detailRow('Family', familyDisplay(selected))}
            {detailRow('Family Phone', selected.family_phone || selected.family?.phone)}
            {detailRow('Caretaker', caretakerDisplay(selected))}
            {detailRow('Caretaker Phone', selected.caretaker_phone || selected.caregiver_phone || selected.caretaker?.phone)}
            {detailRow('Caretaker Email', selected.caretaker_email || selected.caretaker?.email)}
            {detailRow('City', selected.city || selected.family_city)}
            {detailRow('Address', selected.address)}
          </div>

          <div style={{ padding: '12px 0 4px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1b4d1c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Timeline</h4>
            {detailRow('Checked In', formatDate(startedAt(selected)))}
            {detailRow('Checked Out', formatDate(endAt(selected)))}
            {detailRow('Duration', selected.duration_hours || selected.total_hours ? `${selected.duration_hours || selected.total_hours}h` : '—')}
            {detailRow('Created', formatDate(selected.created_at))}
          </div>

          {detailLoading && <div style={{ fontSize: 12, color: '#6B7280', padding: '8px 0' }}>Loading latest visit detail...</div>}

          {asArray(selected.visits).length > 0 && (
            <div style={{ padding: '12px 0 4px' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1b4d1c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Check-in / Check-out Log</h4>
              {asArray(selected.visits).map((visit, index) => (
                <div key={visit.id || index} style={{ padding: '8px 10px', background: '#F0FDF4', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>Visit #{index + 1}</span>
                    <Badge status={visit.status || 'in_progress'} />
                  </div>
                  <div style={{ color: '#6B7280', marginTop: 4 }}>
                    In: {formatDate(visit.check_in_time)} {visit.check_out_time ? `- Out: ${formatDate(visit.check_out_time)}` : '(active)'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(selected.has_sos || sosCount(selected) > 0 || linkedSosAlerts(selected).length > 0) && (
            <div style={{ padding: '10px 12px', background: '#FEF2F2', borderRadius: 8, marginTop: 12, fontSize: 12, fontWeight: 600, color: '#991B1B' }}>
              SOS Alert Active - {sosCount(selected) || linkedSosAlerts(selected).length || 1} linked alert(s)
            </div>
          )}
        </DrawerPanel>
      )}
    </>
  );
}
