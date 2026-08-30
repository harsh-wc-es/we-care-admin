import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { dashboardService } from '../../services/dashboardService';
import { refundService } from '../../services/refundService';
import { sosService } from '../../services/sosService';
import { asArray, asObject, extractItems } from '../../utils/apiData';

function money(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return '₹0';
  return `₹${number.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function dateValue(row) {
  return row?.created_at || row?.created_date || '';
}

function dateTimeMs(value) {
  if (!value) return 0;
  const parsed = Date.parse(String(value).replace(' ', 'T'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractRefundItems(data) {
  return extractItems(
    data,
    data?.refunds,
    data?.records,
    data?.data?.refunds,
    data?.data?.records,
    data?.data?.data?.items,
    data?.data?.data?.refunds,
    data?.data?.data
  );
}

function latestRefunds(items) {
  return [...asArray(items)]
    .sort((a, b) => dateTimeMs(dateValue(b)) - dateTimeMs(dateValue(a)))
    .slice(0, 5);
}

function extractRefundSummary(data) {
  return asObject(data?.summary || data?.stats || data?.data?.summary || data?.data?.stats);
}

function extractSosItems(data) {
  return extractItems(
    data,
    data?.alerts,
    data?.sos_alerts,
    data?.records,
    data?.data?.alerts,
    data?.data?.sos_alerts,
    data?.data?.records,
    data?.data?.data
  );
}

function latestSosAlerts(items) {
  return [...asArray(items)]
    .sort((a, b) => dateTimeMs(b?.created_at || b?.alert_time || b?.triggered_at || b?.created) - dateTimeMs(a?.created_at || a?.alert_time || a?.triggered_at || a?.created))
    .slice(0, 5);
}

function refundSummaryCount(summary, status) {
  return Number(asObject(summary?.[status]).count ?? 0);
}

function refundSummaryAmount(summary, status) {
  return Number(asObject(summary?.[status]).amount ?? 0);
}

function hasRefundSummary(summary) {
  return Object.keys(asObject(summary)).length > 0;
}

const DASHBOARD_STATS = [
  { label: 'Total Users', path: '/users', value: (data) => asObject(data.counts).total_users },
  { label: 'Active Caretakers', path: '/caregivers', value: (data) => asObject(data.counts).total_caretakers },
  { label: 'Bookings', path: '/bookings', value: (data) => asObject(data.counts).total_bookings },
  { label: 'Active Visits', path: '/live-tracking', value: (data) => asObject(data.stats).active_visits },
  { label: 'Pending Approvals', path: '/caregiver-verification', value: (data) => asObject(data.stats).pending_verification },
  { label: 'Open SOS', path: '/sos-alerts', value: (data) => asObject(data.stats).active_sos },
  { label: 'Pending Refunds', path: '/admin/refunds', value: (data) => hasRefundSummary(data.refund_summary) ? refundSummaryCount(data.refund_summary, 'pending') : (asObject(data.stats).pending_refunds ?? asObject(data.counts).pending_refunds ?? 0) },
  { label: 'Approved Refunds', path: '/admin/refunds', value: (data) => hasRefundSummary(data.refund_summary) ? refundSummaryCount(data.refund_summary, 'approved') : (asObject(data.stats).approved_refunds ?? asObject(data.counts).approved_refunds ?? 0) },
  { label: 'Processed Refunds', path: '/admin/refunds', value: (data) => hasRefundSummary(data.refund_summary) ? refundSummaryCount(data.refund_summary, 'processed') : (asObject(data.stats).processed_refunds ?? asObject(data.counts).processed_refunds ?? 0) },
  { label: 'Total Refund Amount', path: '/admin/refunds', value: (data) => {
    const summary = data.refund_summary;
    const summaryTotal = ['pending', 'approved', 'rejected', 'processed', 'failed'].reduce((sum, status) => sum + refundSummaryAmount(summary, status), 0);
    return money(hasRefundSummary(summary) ? summaryTotal : (asObject(data.stats).total_refund_amount ?? asObject(data.counts).total_refund_amount ?? 0));
  } },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refundsLoading, setRefundsLoading] = useState(true);
  const [sosLoading, setSosLoading] = useState(true);
  const [error, setError] = useState('');
  const [refundError, setRefundError] = useState('');
  const [sosError, setSosError] = useState('');
  const [data, setData] = useState(null);
  const [recentRefunds, setRecentRefunds] = useState([]);
  const [refundSummary, setRefundSummary] = useState({});
  const [sosAlerts, setSosAlerts] = useState([]);

  const fetchDashboard = async () => {
    setLoading(true);
    setRefundsLoading(true);
    setSosLoading(true);
    setError('');
    setRefundError('');
    setSosError('');
    const [res, refundRes, sosRes] = await Promise.all([
      dashboardService.getDashboard(),
      refundService.getRefunds({ page: 1, limit: 5, sort: 'latest' }),
      sosService.listAlerts({ page: 1, limit: 5, status: 'open' }),
    ]);
    if (res.success) setData(res.data);
    else setError(res.message || 'Failed to load dashboard');
    if (refundRes.success) {
      setRecentRefunds(latestRefunds(extractRefundItems(refundRes.data)));
      setRefundSummary(extractRefundSummary(refundRes.data));
    } else {
      setRecentRefunds([]);
      setRefundSummary({});
      setRefundError(refundRes.message || 'Unable to load recent refunds');
    }
    if (sosRes.success) {
      setSosAlerts(latestSosAlerts(extractSosItems(sosRes.data)));
    } else {
      setSosAlerts([]);
      setSosError(sosRes.message || 'Unable to load SOS alerts');
    }
    setLoading(false);
    setRefundsLoading(false);
    setSosLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, []);

  const dashboardRefundSummary = asObject(data?.refund_summary || data?.stats?.refund_summary);
  const effectiveRefundSummary = Object.keys(refundSummary).length ? refundSummary : dashboardRefundSummary;
  const sosColumns = [
    { key: 'id', label: 'Alert ID', render: (row) => row.id || row.alert_id ? `SOS #${row.id || row.alert_id}` : '-' },
    { key: 'patient', label: 'Patient', render: (row) => row.patient_name || row.patient || row.family_patient_name || '-' },
    { key: 'family', label: 'Family', render: (row) => row.reporter_username || row.user_name || row.raised_by_name || row.family_name || row.username || row.email || '-' },
    { key: 'caretaker', label: 'Caretaker', render: (row) => row.caretaker_name || row.caregiver_name || row.assigned_caretaker_name || row.caretaker_username || '-' },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status || '-'} /> },
    { key: 'created_at', label: 'Created', render: (row) => row.created_at || row.alert_time || row.triggered_at || row.created || '-' },
  ];
  const refundColumns = [
    { key: 'id', label: 'Refund ID', render: (row) => row.id || row.refund_id ? `#${row.id || row.refund_id}` : '-' },
    { key: 'booking_id', label: 'Booking', render: (row) => row.booking_reference || (row.booking_id ? `#${row.booking_id}` : '-') },
    { key: 'refund_amount', label: 'Amount', render: (row) => money(row.refund_amount ?? row.amount ?? row.refund_total) },
    { key: 'status', label: 'Status', render: (row) => <Badge status={`refund_${row.status || 'pending'}`} /> },
    { key: 'created_at', label: 'Created', render: (row) => dateValue(row) || '-' },
  ];

  return (
    <>
      <TopBar searchPlaceholder="Search admin records..." />
      <div className="page-content">
        <div className="responsive-page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <h1 className="page-title" style={{marginBottom:4}}>WeCare Admin Operations</h1>
            <p style={{color:'#6B7280',fontSize:13,margin:0}}>Unified overview for caretaker verification, bookings, visits, and safety governance.</p>
          </div>
          <button className="btn btn-outline" onClick={fetchDashboard} style={{fontSize:12}} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && <ErrorState title="Dashboard unavailable" message={error} onRetry={fetchDashboard} />}

        <div className="stats-grid" style={{gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
          {DASHBOARD_STATS.map((stat) => (
            <button
              key={stat.label}
              className="stat-card"
              style={{textAlign:'left',cursor:'pointer',padding:'14px 16px'}}
              onClick={() => navigate(stat.path)}
            >
              <div className="stat-label">{stat.label}</div>
              {loading ? <LoadingSkeleton style={{height:24,width:60}} /> : (
                <div className="stat-value">{stat.value({ ...(data || {}), refund_summary: effectiveRefundSummary }) ?? 0}</div>
              )}
            </button>
          ))}
        </div>

        <div className="table-card" style={{padding:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderBottom:'1px solid #E4ECD9'}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:'#1b4d1c'}}>SOS Alerts</h3>
            <button className="btn btn-outline" style={{fontSize:11,padding:'5px 12px'}} onClick={() => navigate('/sos-alerts')}>Open</button>
          </div>
          <DataTable
            columns={sosColumns}
            rows={sosAlerts}
            loading={sosLoading}
            errorState={sosError ? <ErrorState title="Unable to load SOS alerts" message={sosError} onRetry={fetchDashboard} /> : null}
            emptyState={<EmptyState title="No open SOS alerts" message="SOS alerts will appear here when users raise emergency alerts." />}
          />
        </div>

        <div className="table-card" style={{padding:0,marginTop:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderBottom:'1px solid #E4ECD9'}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:'#1b4d1c'}}>Recent Refunds</h3>
            <button className="btn btn-outline" style={{fontSize:11,padding:'5px 12px'}} onClick={() => navigate('/admin/refunds')}>Open</button>
          </div>
          <DataTable
            columns={refundColumns}
            rows={recentRefunds}
            loading={refundsLoading}
            errorState={refundError ? <ErrorState title="Unable to load recent refunds" message={refundError} onRetry={fetchDashboard} /> : null}
            emptyState={<EmptyState title="No recent refunds" message="Cancellation refund records will appear here when available." />}
          />
        </div>
      </div>
    </>
  );
}
