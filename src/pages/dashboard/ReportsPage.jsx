import { useEffect, useState, useCallback } from 'react';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import { reportService } from '../../services/reportService';
import { earningsService } from '../../services/earningsService';
import { asObject, extractItems } from '../../utils/apiData';

const money = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

function StatCard({ label, value, color = '#1F2937', loading }) {
  return (
    <div style={{background:'#fff',border:'1px solid #E4ECD9',borderLeft:`3px solid ${color}`,borderRadius:6,padding:'10px 12px'}}>
      <div style={{fontSize:10,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.4px'}}>{label}</div>
      {loading ? <LoadingSkeleton style={{height:20,width:60,marginTop:5}} /> : (
        <div style={{fontSize:18,fontWeight:800,color,marginTop:4}}>{value}</div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [exportRows, setExportRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast, showToast, hideToast } = useToast();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await reportService.getSummary();
    if (res.success) setSummary(asObject(res.data));
    else setError(res.message || 'Failed to load reports summary');
    setLoading(false);
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleExportPreview = async () => {
    setExportLoading(true);
    const res = await earningsService.exportEarnings({});
    if (res.success) {
      setExportRows(extractItems(res.data));
      showToast(res.message || 'Export data retrieved');
    } else {
      showToast(res.message || 'Failed to retrieve export data', 'error');
    }
    setExportLoading(false);
  };

  const revenue = asObject(summary?.revenue);
  const commission = asObject(summary?.commission);
  const bookings = asObject(summary?.bookings);
  const users = asObject(summary?.users);
  const payouts = asObject(summary?.payouts);
  const sos = asObject(summary?.sos_alerts);
  const complaints = asObject(summary?.complaints);

  const exportColumns = [
    { key: 'booking_id', label: 'Booking', render: (row) => row.booking_id ? `#${row.booking_id}` : '-' },
    { key: 'caretaker_username', label: 'Caretaker', render: (row) => row.caretaker_username || '-' },
    { key: 'caretaker_earning_amount', label: 'Caretaker Earnings', render: (row) => money(row.caretaker_earning_amount) },
    { key: 'platform_commission_amount', label: 'Commission', render: (row) => money(row.platform_commission_amount) },
    { key: 'payout_status', label: 'Payout', render: (row) => <Badge status={row.payout_status || '-'} /> },
    { key: 'completed_at', label: 'Completed', render: (row) => row.completed_at || '-' },
  ];

  return (
    <>
      <TopBar searchPlaceholder="Search reports..." />
      <div className="page-content">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <h1 className="page-title" style={{marginBottom:2}}>Operational Reports</h1>
            <p style={{color:'#6B7280',fontSize:12,margin:0}}>Backend summary for platform operations, safety, and finance.</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-outline" style={{fontSize:11}} onClick={fetchSummary} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
            <button className="btn btn-primary" style={{fontSize:11}} onClick={handleExportPreview} disabled={exportLoading}>{exportLoading ? 'Exporting...' : 'Export Earnings'}</button>
          </div>
        </div>

        {error && <ErrorState title={error} onRetry={fetchSummary} />}

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
          <StatCard label="Total Revenue" value={money(revenue.total_revenue)} color="#16A34A" loading={loading} />
          <StatCard label="Platform Commission" value={money(commission.total_platform_commission)} color="#D97706" loading={loading} />
          <StatCard label="Open SOS" value={sos.open_alerts ?? 0} color="#DC2626" loading={loading} />
          <StatCard label="Pending Complaints" value={complaints.pending ?? 0} color="#EA580C" loading={loading} />
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14}}>
          <div className="table-card">
            <h3 style={{fontSize:13,color:'#1b4d1c',marginBottom:10}}>Bookings</h3>
            <div className="user-info-grid">
              <div className="user-info-item"><span>Total</span><p>{bookings.total ?? 0}</p></div>
              <div className="user-info-item"><span>In Progress</span><p>{bookings.in_progress ?? 0}</p></div>
              <div className="user-info-item"><span>Completed</span><p>{bookings.completed ?? 0}</p></div>
              <div className="user-info-item"><span>Cancelled</span><p>{bookings.cancelled ?? 0}</p></div>
            </div>
          </div>
          <div className="table-card">
            <h3 style={{fontSize:13,color:'#1b4d1c',marginBottom:10}}>Users</h3>
            <div className="user-info-grid">
              <div className="user-info-item"><span>Family</span><p>{users.family ?? 0}</p></div>
              <div className="user-info-item"><span>Caretakers</span><p>{users.caretaker ?? 0}</p></div>
              <div className="user-info-item"><span>Inactive</span><p>{users.inactive ?? 0}</p></div>
              <div className="user-info-item"><span>New This Month</span><p>{users.new_this_month ?? 0}</p></div>
            </div>
          </div>
          <div className="table-card">
            <h3 style={{fontSize:13,color:'#1b4d1c',marginBottom:10}}>Payouts</h3>
            <div className="user-info-grid">
              <div className="user-info-item"><span>Paid</span><p>{money(payouts.total_paid)}</p></div>
              <div className="user-info-item"><span>Pending</span><p>{money(payouts.total_pending)}</p></div>
              <div className="user-info-item"><span>Paid Count</span><p>{payouts.paid_count ?? 0}</p></div>
              <div className="user-info-item"><span>Pending Count</span><p>{payouts.pending_count ?? 0}</p></div>
            </div>
          </div>
        </div>

        <div className="table-card" style={{padding:0}}>
          <div style={{padding:'12px 14px',borderBottom:'1px solid #E4ECD9'}}>
            <h3 style={{fontSize:13,color:'#1b4d1c',margin:0}}>Earnings Export Preview</h3>
          </div>
          <DataTable
            columns={exportColumns}
            rows={exportRows}
            loading={exportLoading}
            emptyState={<EmptyState title="No export loaded" message="Use Export Earnings to preview backend export data." />}
          />
        </div>
      </div>
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
