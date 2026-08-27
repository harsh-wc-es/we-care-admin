import { useEffect, useState, useCallback } from 'react';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import DrawerPanel from '../../components/DrawerPanel';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Pagination from '../../components/Pagination';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../components/Toast';
import usePagination from '../../hooks/usePagination';
import useToast from '../../hooks/useToast';
import { earningsService } from '../../services/earningsService';
import { asArray, asObject, extractItems } from '../../utils/apiData';
import { formatDate } from '../../utils/formatDate';

const EMPTY = '\u2014';
const RUPEE = '\u20b9';

const TABS = [
  { key: 'ready_to_pay', label: 'Ready To Pay' },
  { key: 'hold', label: 'Hold' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'failed', label: 'Failed Payouts' },
  { key: 'paid_history', label: 'Paid History' },
];

const KPI = [
  { label: 'Ready For Payout', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', tab: 'ready_to_pay', countKeys: ['ready_for_payout_count', 'ready_to_pay_count'], amountKeys: ['ready_for_payout_amount', 'ready_to_pay', 'pending_settlement'] },
  { label: 'Hold Earnings', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', tab: 'hold', countKeys: ['hold_count'], amountKeys: ['hold_amount', 'under_review_hold'] },
  { label: 'Disputed', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', tab: 'disputed', countKeys: ['disputed_count'], amountKeys: ['disputed_amount', 'disputed'] },
  { label: 'Failed Payouts', color: '#991B1B', bg: '#FEF2F2', border: '#FECACA', tab: 'failed', countKeys: ['failed_count'], amountKeys: ['failed_amount'] },
  { label: 'Paid This Week', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', tab: 'paid_history', countKeys: ['paid_this_week_count', 'paid_count'], amountKeys: ['paid_this_week_amount', 'paid_amount', 'total_settled'] },
];

const CAREGIVER_NAME_KEYS = [
  'caretaker_name',
  'caregiver_name',
  'caretaker_full_name',
  'caregiver_full_name',
  'caretaker_user_name',
  'caretaker_username',
  'caretaker.full_name',
  'caregiver.full_name',
  'caretaker.name',
  'caregiver.name',
  'caretaker.username',
  'caregiver.username',
];

const CAREGIVER_CONTACT_KEYS = [
  'caretaker_email',
  'caregiver_email',
  'caretaker.email',
  'caregiver.email',
  'caretaker_phone',
  'caregiver_phone',
  'caretaker.phone',
  'caregiver.phone',
];

const CAREGIVER_ID_KEYS = [
  'caretaker_id',
  'caretaker_user_id',
  'caregiver_id',
  'caregiver_user_id',
  'caretaker.id',
  'caregiver.id',
];

const READY_STATUSES = ['ready_for_payout', 'ready', 'pending_payout'];

function getWeekEndDate() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getByPath(source, path) {
  if (!source || !path) return undefined;
  return String(path).split('.').reduce((value, key) => {
    if (value === null || value === undefined) return undefined;
    return value[key];
  }, source);
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function getFirst(record, keys, fallback = EMPTY) {
  for (const key of keys) {
    const value = getByPath(record, key);
    if (hasValue(value)) return value;
  }
  return fallback;
}

function firstNumber(source, keys) {
  for (const key of keys) {
    const value = getByPath(source, key);
    if (hasValue(value)) {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    }
  }
  return null;
}

function rowAmount(row) {
  return firstNumber(row, [
    'caretaker_earning_amount',
    'total_caretaker_earnings',
    'amount',
    'payout_amount',
  ]) ?? 0;
}

function formatCurrency(value) {
  if (!hasValue(value)) return EMPTY;
  const number = Number(value);
  if (!Number.isFinite(number)) return EMPTY;
  return `${RUPEE}${number.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDateTime(value) {
  return hasValue(value) ? formatDate(value) : EMPTY;
}

function displayText(value) {
  return hasValue(value) ? String(value) : EMPTY;
}

function boolValue(value) {
  if (value === true || value === 1) return true;
  const text = String(value ?? '').toLowerCase();
  return ['1', 'true', 'yes', 'y'].includes(text);
}

function statusValue(row) {
  const raw = String(getFirst(row, ['payout_status', 'status', 'payout.status'], '') || '').toLowerCase();
  if (getFirst(row, ['payout_paid_at', 'paid_at', 'settled_at'], '') || raw === 'paid') return 'paid';
  if (raw === 'ready_to_pay') return 'ready_for_payout';
  if (raw === 'processed') return 'processed';
  return raw || EMPTY;
}

function isReadyForPayout(row) {
  return READY_STATUSES.includes(statusValue(row));
}

function caregiverDisplay(row) {
  const name = getFirst(row, CAREGIVER_NAME_KEYS, '');
  if (name) return name;
  const contact = getFirst(row, CAREGIVER_CONTACT_KEYS, '');
  if (contact) return contact;
  const id = getFirst(row, CAREGIVER_ID_KEYS, '');
  return id ? `ID ${id}` : EMPTY;
}

function caregiverInitial(row) {
  const text = caregiverDisplay(row);
  return text === EMPTY ? 'C' : String(text).charAt(0).toUpperCase();
}

function bookingId(row) {
  return getFirst(row, ['booking_id', 'booking.id', 'id'], '');
}

function getPriority(row) {
  return getFirst(row, [
    'payout_priority',
    'priority',
    'request_priority',
    'booking_priority',
    'booking.request_priority',
  ]);
}

function normalizeDetailPayload(response) {
  const root = response?.data ?? response ?? {};
  const nested = root?.data ?? root;
  return (
    nested?.payout ||
    root?.payout ||
    nested?.booking ||
    nested?.booking_detail ||
    nested?.details ||
    nested ||
    {}
  );
}

function mergeDetail(selectedRow, response) {
  const detail = normalizeDetailPayload(response);
  const merged = {
    ...(selectedRow || {}),
    ...(asObject(detail) || {}),
  };

  if (detail?.payout && typeof detail.payout === 'object') Object.assign(merged, detail.payout);
  if (detail?.booking && typeof detail.booking === 'object') Object.assign(merged, detail.booking);

  return merged;
}

function contextCounts(row) {
  const complaints = asArray(row?.complaints);
  const disputes = asArray(row?.disputes);
  const sosAlerts = asArray(row?.sos_alerts || row?.sos || row?.sos_incidents);
  const complaintCount = firstNumber(row, ['complaint_count', 'complaints_count']) ?? complaints.length ?? 0;
  const disputeCount = firstNumber(row, ['dispute_count', 'disputes_count']) ?? disputes.length ?? (statusValue(row) === 'disputed' ? 1 : 0);
  const sosCount = firstNumber(row, ['sos_count', 'sos_alert_count', 'sos_incident_count']) ?? sosAlerts.length ?? 0;

  return {
    complaints,
    disputes,
    sosAlerts,
    complaintCount,
    disputeCount,
    sosCount,
  };
}

function latestStatus(items, keys) {
  const item = asArray(items)[0] || {};
  return getFirst(item, keys);
}

function InfoItem({ label, children, wide = false }) {
  return (
    <div className="user-info-item" style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <span>{label}</span>
      <p>{children ?? EMPTY}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="user-drawer__section">
      <h4>{title}</h4>
      <div className="user-info-grid">{children}</div>
    </div>
  );
}

export default function EarningsPage() {
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('ready_to_pay');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [processing, setProcessing] = useState('');
  const [modal, setModal] = useState(null);
  const [payoutForm, setPayoutForm] = useState({
    week_end: getWeekEndDate(),
    payment_method: 'bank_transfer',
    admin_note: 'Prototype weekly payout',
  });
  const { toast, showToast, hideToast } = useToast();
  const { page, limit, totalPages, setPage, setTotalFromResponse, resetPage } = usePagination(20);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    const res = await earningsService.getEarnings({ tab, page, limit });
    if (res.success) {
      setBookings(extractItems(res.data, res.data?.bookings, res.data?.payouts, res.data?.items));
      setSummary({
        ...asObject(res.data?.summary || res.data?.totals),
        tab: res.data?.tab,
        total: res.data?.total,
      });
      setTotalFromResponse(res.pagination || res.data);
    } else {
      setBookings([]);
      setSummary(null);
      setError(res.message || 'Failed to load earnings data');
      setTotalFromResponse({ page, limit, total: 0, total_pages: 0 });
    }
    setLoading(false);
  }, [tab, page, limit, setTotalFromResponse]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const handleTabChange = (t) => { setTab(t); resetPage(); };

  const openDetail = async (row) => {
    setSelected(row);
    setDetailLoading(true);
    setDetailError('');

    if (import.meta.env.DEV) console.log('[payout-detail:selected]', row);

    const res = await earningsService.getPayoutDetail(row);
    if (import.meta.env.DEV) console.log('[payout-detail:api]', res);

    if (res.success) {
      const merged = mergeDetail(row, res);
      if (import.meta.env.DEV) console.log('[payout-detail:merged]', merged);
      setSelected(merged);
    } else {
      setDetailError(res.message || 'Failed to load payout detail.');
    }

    setDetailLoading(false);
  };

  const handleRefreshEligibility = async () => {
    setProcessing('refresh');
    const res = await earningsService.refreshPayoutEligibility();
    if (res.success) showToast(res.message || 'Payout eligibility refreshed');
    else showToast(res.message || 'Failed to refresh payout eligibility', 'error');
    fetchData();
    setProcessing('');
  };

  const handleCreatePayout = async (item) => {
    const ctId = getFirst(item, CAREGIVER_ID_KEYS, '');
    if (!ctId) {
      showToast('Cannot create payout because caretaker information is missing.', 'error');
      setModal(null);
      return;
    }
    setProcessing('batch');
    const res = await earningsService.createPayout({
      caretaker_user_id: Number(ctId),
      week_end: payoutForm.week_end,
      payment_method: payoutForm.payment_method,
      admin_note: payoutForm.admin_note,
    });
    if (res.success) showToast(res.message || 'Payout created');
    else showToast(res.message || 'Failed to create payout', 'error');
    fetchData();
    setProcessing('');
    setModal(null);
  };

  const handleMarkPaid = async (id) => {
    if (!id) {
      showToast('Create a payout before marking it paid.', 'error');
      setModal(null);
      return;
    }
    setProcessing(`paid-${id}`);
    const res = await earningsService.updatePayout({
      payout_id: id,
      status: 'paid',
      payment_method: 'bank_transfer',
      admin_note: 'Marked paid from prototype admin',
    });
    if (res.success) showToast(res.message || 'Payout marked paid');
    else showToast(res.message || 'Failed to update payout', 'error');
    fetchData();
    setProcessing('');
    setModal(null);
  };

  const fallbackCount = (kpi) => {
    if (kpi.tab !== tab) return 0;
    const total = Number(summary?.total);
    return Number.isFinite(total) ? total : bookings.length;
  };
  const fallbackAmount = (kpi) => kpi.tab === tab ? bookings.reduce((sum, row) => sum + rowAmount(row), 0) : 0;
  const kpiCount = (kpi) => firstNumber(summary, kpi.countKeys) ?? fallbackCount(kpi);
  const kpiAmount = (kpi) => firstNumber(summary, kpi.amountKeys) ?? fallbackAmount(kpi);

  const columns = [
    { key: 'booking_id', label: 'Booking ID', render: (r) => <span style={{fontWeight:700,fontSize:11,color:'#6B7280',fontFamily:'monospace'}}>#{bookingId(r) || EMPTY}</span> },
    { key: 'caregiver', label: 'Caretaker', render: (r) => <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:24,height:24,borderRadius:'50%',background:'#E8F5E1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#16A34A',flexShrink:0}}>{caregiverInitial(r)}</div><span style={{fontSize:13,fontWeight:500}}>{caregiverDisplay(r)}</span></div> },
    { key: 'amount', label: 'Amount', render: (r) => <span style={{fontWeight:600,color:'#16A34A'}}>{formatCurrency(getFirst(r, ['caretaker_earning_amount', 'total_caretaker_earnings', 'amount', 'payout_amount'], ''))}</span> },
    { key: 'payout_status', label: 'Status', render: (r) => <Badge status={statusValue(r)} /> },
    { key: 'hold_until', label: 'Hold Until', render: (r) => formatDateTime(getFirst(r, ['payout_hold_until', 'hold_until'], '')) },
    { key: 'completed_at', label: 'Completed At', render: (r) => formatDateTime(getFirst(r, ['completed_at', 'last_payout_date', 'booking.completed_at'], '')) },
    { key: 'actions', label: '', render: (r) => {
      const payoutId = getFirst(r, ['payout_id', 'payout.id'], '');
      const canCreatePayout = isReadyForPayout(r) && !payoutId;
      const canMarkPaid = Boolean(payoutId) && isReadyForPayout(r);
      return <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
        <button className="btn btn-outline" style={{fontSize:10,padding:'3px 8px'}} onClick={() => openDetail(r)}>Detail</button>
        {canCreatePayout && <button className="btn btn-outline" style={{fontSize:10,padding:'3px 8px',color:'#1b4d1c'}} disabled={!!processing} onClick={() => { setPayoutForm({ week_end: getWeekEndDate(), payment_method: 'bank_transfer', admin_note: 'Prototype weekly payout' }); setModal({action:'create_payout',item:r}); }}>Create Payout</button>}
        {canMarkPaid && <button className="btn btn-primary" style={{fontSize:10,padding:'3px 8px'}} disabled={!!processing} onClick={() => setModal({action:'pay',item:r})}>{processing===`paid-${payoutId}`?'...':'Mark Paid'}</button>}
      </div>;
    }},
  ];

  const renderEarningsMobileCard = (row) => {
    const payoutIdValue = getFirst(row, ['payout_id', 'payout.id'], '');
    const canCreatePayout = isReadyForPayout(row) && !payoutIdValue;
    const canMarkPaid = Boolean(payoutIdValue) && isReadyForPayout(row);
    return (
      <>
        <div className="mobile-data-card__head">
          <div style={{width:36,height:36,borderRadius:'50%',background:'#E8F5E1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#16A34A',flexShrink:0}}>
            {caregiverInitial(row)}
          </div>
          <div style={{minWidth:0,flex:1}}>
            <h3 className="mobile-data-card__title">{caregiverDisplay(row)}</h3>
            <p className="mobile-data-card__subtext">Booking #{bookingId(row) || EMPTY}</p>
            <p className="mobile-data-card__subtext">{formatDateTime(getFirst(row, ['completed_at', 'last_payout_date', 'booking.completed_at'], '')) || 'No completion date'}</p>
          </div>
          <Badge status={statusValue(row)} />
        </div>
        <div className="mobile-data-card__fields">
          <div className="mobile-data-card__field"><span>Amount</span><strong style={{color:'#16A34A'}}>{formatCurrency(getFirst(row, ['caretaker_earning_amount', 'total_caretaker_earnings', 'amount', 'payout_amount'], ''))}</strong></div>
          <div className="mobile-data-card__field"><span>Hold Until</span><strong>{formatDateTime(getFirst(row, ['payout_hold_until', 'hold_until'], '')) || '-'}</strong></div>
          <div className="mobile-data-card__field"><span>Hold Reason</span><strong>{getFirst(row, ['hold_reason', 'exclusion_reason', 'failure_reason'], '-') || '-'}</strong></div>
        </div>
        <div className="mobile-data-card__actions">
          <button className="btn btn-outline" style={{fontSize:12,padding:'6px 12px'}} onClick={() => openDetail(row)}>Detail</button>
          {canCreatePayout && <button className="btn btn-outline" style={{fontSize:12,padding:'6px 12px',color:'#1b4d1c'}} disabled={!!processing} onClick={() => { setPayoutForm({ week_end: getWeekEndDate(), payment_method: 'bank_transfer', admin_note: 'Prototype weekly payout' }); setModal({action:'create_payout',item:row}); }}>Create Payout</button>}
          {canMarkPaid && <button className="btn btn-primary" style={{fontSize:12,padding:'6px 12px'}} disabled={!!processing} onClick={() => setModal({action:'pay',item:row})}>{processing===`paid-${payoutIdValue}`?'...':'Mark Paid'}</button>}
        </div>
      </>
    );
  };

  const d = selected || {};
  const payoutId = getFirst(d, ['payout_id', 'payout.id'], '');
  const currentBookingId = bookingId(d);
  const counts = contextCounts(d);
  const hasContext = counts.complaintCount > 0 || counts.disputeCount > 0 || counts.sosCount > 0;
  const payments = asArray(d.payments);
  const latestPayment = payments[0] || {};
  const includedBookings = asArray(d.included_bookings);
  const excludedBookings = asArray(d.excluded_bookings);

  return (
    <>
      <TopBar searchPlaceholder="Search payouts..." />
      <div className="page-content">
        <div className="responsive-page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div>
            <h1 className="page-title" style={{marginBottom:2}}>Payout Operations</h1>
            <p style={{color:'#6B7280',fontSize:12,margin:0}}>Finance review queue - weekly payout lifecycle manager.</p>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button className="btn btn-outline" style={{fontSize:11,padding:'6px 14px'}} onClick={handleRefreshEligibility} disabled={!!processing}>{processing==='refresh'?'Refreshing...':'Refresh Eligibility'}</button>
          </div>
        </div>

        <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:12}}>
          {KPI.map((k) => (
            <button key={k.label} onClick={() => handleTabChange(k.tab)} style={{background:k.bg,border:`1px solid ${k.border}`,borderLeft:`3px solid ${k.color}`,borderRadius:6,padding:'10px 12px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',outline:tab===k.tab?`2px solid ${k.color}`:'none',outlineOffset:1}}>
              <div style={{fontSize:10,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:4}}>{k.label}</div>
              {loading ? <LoadingSkeleton style={{height:20,width:50}} /> : <><div style={{fontSize:18,fontWeight:800,color:k.color,lineHeight:1.2}}>{kpiCount(k)}</div><div style={{fontSize:11,color:k.color,fontWeight:500,marginTop:2}}>{formatCurrency(kpiAmount(k))}</div></>}
            </button>
          ))}
        </div>

        <div style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:6,padding:'8px 14px',marginBottom:10,display:'flex',gap:16,fontSize:11,color:'#6B7280',flexWrap:'wrap'}}>
          <span><b>24hr hold</b> after completion</span><span><b>Complaint hold</b> blocks payout</span><span><b>SOS review</b> exclusion</span><span><b>Dispute</b> exclusion</span>
        </div>

        <FilterBar filters={TABS.map(t => t.key)} active={tab} onChange={handleTabChange} />
        {tab === 'hold' && <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:6,padding:'8px 14px',marginBottom:8,fontSize:12,color:'#92600A'}}>Payouts can be created after the 24-hour hold expires. Use <b>Refresh Eligibility</b> to move cleared bookings to Ready To Pay.</div>}
        {error && <ErrorState title={error} onRetry={fetchData} />}

        <div className="table-card" style={{padding:0}}>
          <div style={{maxHeight:'calc(100vh - 420px)',overflow:'auto'}}>
            <DataTable columns={columns} rows={bookings} loading={loading} renderMobileCard={renderEarningsMobileCard} emptyState={<EmptyState title={`No ${tab.replace(/_/g,' ')} items`} message="No bookings match this payout tab." />} />
          </div>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </div>

      {selected && !modal && (
        <DrawerPanel title={`Booking #${currentBookingId || EMPTY}`} onClose={() => { setSelected(null); setDetailError(''); }}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <span style={{fontWeight:700,color:'#1F2937'}}>Booking #{currentBookingId || EMPTY}</span>
              <Badge status={statusValue(d)} />
            </div>
            {detailLoading && <span style={{fontSize:12,color:'#6B7280'}}>Loading detail...</span>}
          </div>
          {detailError && <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:6,padding:'8px 10px',marginBottom:10,fontSize:12,color:'#991B1B'}}>{detailError}</div>}

          <Section title="Payout Calculation">
            <InfoItem label="Caretaker Earning"><span style={{fontWeight:700,color:'#16A34A',fontSize:16}}>{formatCurrency(getFirst(d, ['caretaker_earning_amount', 'total_caretaker_earnings', 'amount'], ''))}</span></InfoItem>
            <InfoItem label="Platform Commission">{formatCurrency(getFirst(d, ['platform_commission_amount', 'total_platform_commission'], ''))}</InfoItem>
            <InfoItem label="Total Booking Amount">{formatCurrency(getFirst(d, ['total_customer_amount', 'gross_customer_amount', 'total_amount'], ''))}</InfoItem>
            <InfoItem label="Payout Status"><Badge status={statusValue(d)} /></InfoItem>
            <InfoItem label="Priority">{displayText(getPriority(d))}</InfoItem>
            <InfoItem label="Hold Until">{formatDateTime(getFirst(d, ['payout_hold_until', 'hold_until'], ''))}</InfoItem>
            <InfoItem label="Completed At">{formatDateTime(getFirst(d, ['completed_at', 'booking.completed_at'], ''))}</InfoItem>
            <InfoItem label="Paid At">{formatDateTime(getFirst(d, ['payout_paid_at', 'paid_at', 'settled_at'], ''))}</InfoItem>
            <InfoItem label="Payout Created At">{formatDateTime(getFirst(d, ['payout_created_at', 'created_at', 'payout.created_at'], ''))}</InfoItem>
            <InfoItem label="Payout Processed At">{formatDateTime(getFirst(d, ['payout_processed_at', 'processed_at', 'settled_at', 'payout.settled_at'], ''))}</InfoItem>
            <InfoItem label="Failure Reason" wide>{displayText(getFirst(d, ['failure_reason', 'payout_failure_reason', 'failed_reason', 'payout.failure_reason']))}</InfoItem>
          </Section>

          <Section title="Caretaker Details">
            <InfoItem label="Name">{caregiverDisplay(d)}</InfoItem>
            <InfoItem label="Caretaker User ID">{displayText(getFirst(d, CAREGIVER_ID_KEYS, ''))}</InfoItem>
            <InfoItem label="Email">{displayText(getFirst(d, ['caretaker_email', 'caregiver_email', 'caretaker.email', 'caregiver.email'], ''))}</InfoItem>
            <InfoItem label="Phone">{displayText(getFirst(d, ['caretaker_phone', 'caregiver_phone', 'caretaker.phone', 'caregiver.phone'], ''))}</InfoItem>
            <InfoItem label="Tier">{displayText(getFirst(d, ['pricing_tier', 'tier', 'caretaker_tier', 'skill_level', 'caretaker.skill_level'], ''))}</InfoItem>
            <InfoItem label="Rating">{displayText(getFirst(d, ['rating', 'caretaker_rating', 'caregiver_rating', 'caretaker.rating'], ''))}</InfoItem>
          </Section>

          <Section title="Family / Patient Details">
            <InfoItem label="Family User Name">{displayText(getFirst(d, ['family_user_name', 'family_username', 'family.name', 'family.username', 'family_user.username'], ''))}</InfoItem>
            <InfoItem label="Family User ID">{displayText(getFirst(d, ['family_user_id', 'family.id', 'family_user.id'], ''))}</InfoItem>
            <InfoItem label="Family Email">{displayText(getFirst(d, ['family_email', 'family.email', 'family_user.email'], ''))}</InfoItem>
            <InfoItem label="Family Phone">{displayText(getFirst(d, ['family_phone', 'family.phone', 'family_user.phone'], ''))}</InfoItem>
            <InfoItem label="Patient Name">{displayText(getFirst(d, ['patient_name', 'patient.name'], ''))}</InfoItem>
          </Section>

          <Section title="Booking Details">
            <InfoItem label="Booking ID">#{currentBookingId || EMPTY}</InfoItem>
            <InfoItem label="Service">{displayText(getFirst(d, ['service_name', 'service_type', 'service.type', 'care_type'], ''))}</InfoItem>
            <InfoItem label="Booking Status"><Badge status={getFirst(d, ['booking_status', 'status', 'booking.status'], EMPTY)} /></InfoItem>
            <InfoItem label="Start Date/Time">{displayText(getFirst(d, ['start_datetime', 'start_at', 'booking_date', 'booking.start_at'], ''))} {displayText(getFirst(d, ['start_time'], ''))}</InfoItem>
            <InfoItem label="End Date/Time">{displayText(getFirst(d, ['end_datetime', 'end_at', 'end_time', 'booking.end_at'], ''))}</InfoItem>
            <InfoItem label="Completed At">{formatDateTime(getFirst(d, ['completed_at', 'booking.completed_at'], ''))}</InfoItem>
            <InfoItem label="Address / Location" wide>{displayText(getFirst(d, ['address', 'location', 'booking.address'], ''))}</InfoItem>
          </Section>

          <Section title="Payment Details">
            <InfoItem label="Total Amount">{formatCurrency(getFirst(d, ['total_customer_amount', 'total_amount', 'payment.total_amount'], ''))}</InfoItem>
            <InfoItem label="Paid Amount">{formatCurrency(getFirst(d, ['paid_amount', 'successful_paid_amount', 'payment.paid_amount'], ''))}</InfoItem>
            <InfoItem label="Advance Amount">{formatCurrency(getFirst(d, ['advance_amount', 'payment.advance_amount'], ''))}</InfoItem>
            <InfoItem label="Remaining Amount">{formatCurrency(getFirst(d, ['remaining_amount', 'payment.remaining_amount', 'payments.0.remaining_amount'], ''))}</InfoItem>
            <InfoItem label="Payment Method">{displayText(getFirst(d, ['payment_method', 'payment.payment_method'], getFirst(latestPayment, ['payment_method'], '')))}</InfoItem>
            <InfoItem label="Payment Status"><Badge status={getFirst(d, ['payment_status', 'payment.status'], getFirst(latestPayment, ['status'], 'unpaid'))} /></InfoItem>
            <InfoItem label="Transaction ID" wide>{displayText(getFirst(d, ['transaction_id', 'payment.transaction_id'], getFirst(latestPayment, ['transaction_id'], '')))}</InfoItem>
          </Section>

          <Section title="Hold / Exclusion Reason">
            <InfoItem label="24-hour Hold">{statusValue(d) === 'hold' ? 'Active or pending review' : 'Expired / not active'}</InfoItem>
            <InfoItem label="Complaint Hold">{boolValue(getFirst(d, ['has_complaint'], false)) || counts.complaintCount > 0 ? 'Yes' : 'No'}</InfoItem>
            <InfoItem label="SOS Review Exclusion">{boolValue(getFirst(d, ['has_sos_incident'], false)) || counts.sosCount > 0 ? 'Yes' : 'No'}</InfoItem>
            <InfoItem label="Dispute Exclusion">{statusValue(d) === 'disputed' || counts.disputeCount > 0 ? 'Yes' : 'No'}</InfoItem>
            <InfoItem label="Reason" wide>{displayText(getFirst(d, ['exclusion_reason', 'hold_reason', 'payout_hold_reason', 'reason', 'admin_note'], ''))}</InfoItem>
          </Section>

          <Section title="Complaint / Dispute / SOS Context">
            <InfoItem label="Complaint Count">{counts.complaintCount}</InfoItem>
            <InfoItem label="Dispute Count">{counts.disputeCount}</InfoItem>
            <InfoItem label="SOS Count">{counts.sosCount}</InfoItem>
            <InfoItem label="Latest Complaint Status">{latestStatus(counts.complaints, ['status'])}</InfoItem>
            <InfoItem label="Latest Dispute Status">{latestStatus(counts.disputes, ['status'])}</InfoItem>
            <InfoItem label="Latest SOS Status">{latestStatus(counts.sosAlerts, ['status'])}</InfoItem>
            {!hasContext && <InfoItem label="Context" wide>No complaint/dispute/SOS found</InfoItem>}
          </Section>

          {includedBookings.length > 0 && <div className="user-drawer__section"><h4>Included Bookings</h4>{includedBookings.map((b,i) => <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F3F6EE',fontSize:12}}><span>#{b.booking_id} - {displayText(b.patient_name)}</span><span style={{fontWeight:600,color:'#16A34A'}}>{formatCurrency(b.caretaker_earning_amount)}</span></div>)}</div>}
          {excludedBookings.length > 0 && <div className="user-drawer__section"><h4 style={{color:'#DC2626'}}>Excluded Bookings</h4>{excludedBookings.map((b,i) => <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #FEE2E2',fontSize:12}}><span>#{b.booking_id} - {displayText(b.exclusion_reason || 'Blocked')}</span><Badge status={b.exclusion_reason || 'excluded'} /></div>)}</div>}

          <div style={{display:'flex',gap:6,flexWrap:'wrap',paddingTop:12,borderTop:'1px solid #E4ECD9'}}>
            {isReadyForPayout(d) && !payoutId && <button className="btn btn-outline" style={{fontSize:12,color:'#1b4d1c'}} disabled={!!processing} onClick={() => { setPayoutForm({ week_end: getWeekEndDate(), payment_method: 'bank_transfer', admin_note: 'Prototype weekly payout' }); setModal({action:'create_payout',item:d}); }}>Create Payout</button>}
            {isReadyForPayout(d) && payoutId && <button className="btn btn-primary" style={{fontSize:12}} disabled={!!processing} onClick={() => setModal({action:'pay',item:d})}>Mark Paid</button>}
            <button className="btn btn-outline" style={{fontSize:12}} disabled title={currentBookingId ? 'No booking detail route exists; this payout drawer already loads booking detail context.' : 'Booking id is missing for this payout row.'}>Open Booking</button>
          </div>
        </DrawerPanel>
      )}

      {modal?.action==='pay' && <ConfirmationModal title="Confirm Payment" message={`Mark payout P-${modal.item?.payout_id} as paid? This action cannot be easily reversed.`} onConfirm={() => handleMarkPaid(modal.item?.payout_id)} onCancel={() => setModal(null)} confirmLabel={processing?'Processing...':'Confirm Payment'} loading={!!processing} />}
      {modal?.action==='create_payout' && <ConfirmationModal title="Create Payout" message={`Create payout for ${caregiverDisplay(modal.item)}? Amount: ${formatCurrency(getFirst(modal.item, ['caretaker_earning_amount', 'total_caretaker_earnings', 'amount'], ''))}.`} onConfirm={() => handleCreatePayout(modal.item)} onCancel={() => setModal(null)} confirmLabel={processing==='batch'?'Creating...':'Create Payout'} loading={processing==='batch'}>
        <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:8}}>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>Week End</label>
          <input style={{padding:8,border:'1px solid #E4ECD9',borderRadius:6,background:'#F0F6EA'}} type="date" value={payoutForm.week_end} onChange={(e) => setPayoutForm({...payoutForm, week_end: e.target.value})} />
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>Payment Method</label>
          <select style={{padding:8,border:'1px solid #E4ECD9',borderRadius:6,background:'#F0F6EA'}} value={payoutForm.payment_method} onChange={(e) => setPayoutForm({...payoutForm, payment_method: e.target.value})}>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
          </select>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>Admin Note</label>
          <textarea style={{padding:8,border:'1px solid #E4ECD9',borderRadius:6,background:'#F0F6EA',minHeight:60}} value={payoutForm.admin_note} onChange={(e) => setPayoutForm({...payoutForm, admin_note: e.target.value})} />
        </div>
      </ConfirmationModal>}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
