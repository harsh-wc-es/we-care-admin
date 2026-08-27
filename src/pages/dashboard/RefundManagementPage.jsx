import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import DrawerPanel from '../../components/DrawerPanel';
import Pagination from '../../components/Pagination';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../components/Toast';
import usePagination from '../../hooks/usePagination';
import useToast from '../../hooks/useToast';
import { refundService } from '../../services/refundService';
import { asObject, extractItems } from '../../utils/apiData';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'processed', 'failed'];
const REFUND_METHODS = ['upi', 'bank_transfer', 'cash', 'wallet', 'other'];

function money(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return '₹0';
  return `₹${number.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function percent(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return '0%';
  return `${number.toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
}

function dateText(value) {
  return value || '—';
}

function nameText(user, fallback = '—') {
  return user?.username || user?.name || user?.full_name || user?.email || fallback;
}

function refundStatus(value) {
  return `refund_${String(value || 'pending').toLowerCase()}`;
}

function summaryValue(summary, status, key) {
  return Number(asObject(summary?.[status])[key] ?? 0);
}

function fieldError(errors, field) {
  const value = errors?.[field];
  if (Array.isArray(value)) return value[0];
  return value || '';
}

function refundMoney(value) {
  if (value === null || value === undefined || value === '') return '-';
  return money(value);
}

function refundPercent(value) {
  if (value === null || value === undefined || value === '') return '-';
  return percent(value);
}

function extractRefundItems(data) {
  return extractItems(
    data,
    data?.refunds,
    data?.records,
    data?.data?.refunds,
    data?.data?.records
  );
}

function extractRefundSummary(data) {
  return asObject(data?.summary || data?.stats || data?.data?.summary);
}

export default function RefundManagementPage() {
  const [searchParams] = useSearchParams();
  const initialRefundId = searchParams.get('refund_id');
  const [refunds, setRefunds] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState(initialRefundId || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [caretaker, setCaretaker] = useState('');
  const [familyUser, setFamilyUser] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [action, setAction] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [processForm, setProcessForm] = useState({
    refund_method: 'upi',
    refund_transaction_id: '',
  });
  const [actionErrors, setActionErrors] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { page, limit, totalPages, setPage, setTotalFromResponse, resetPage } = usePagination(20);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { page, limit, sort: 'latest' };
    if (filter !== 'all') params.status = filter;
    if (search) params.search = search;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (bookingId) params.booking_id = bookingId;
    if (caretaker) params.caretaker = caretaker;
    if (familyUser) params.family_user = familyUser;
    if (paymentMethod) params.payment_method = paymentMethod;

    const res = await refundService.getRefunds(params);
    if (res.success) {
      if (import.meta.env.DEV) console.log('refund list raw', res.data);
      setRefunds(extractRefundItems(res.data));
      setSummary(extractRefundSummary(res.data));
      setTotalFromResponse(res.pagination || res.data);
    } else {
      setError(res.message || 'Failed to load refunds');
      setRefunds([]);
      setSummary({});
    }
    setLoading(false);
  }, [bookingId, caretaker, dateFrom, dateTo, familyUser, filter, limit, page, paymentMethod, search, setTotalFromResponse]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  const openDetail = async (refund) => {
    setDetail(refund);
    setDetailLoading(true);
    const res = await refundService.getRefundDetail(refund.id);
    setDetail(res.success ? asObject(res.data) : refund);
    if (!res.success) showToast(res.message || 'Could not load refund detail', 'error');
    setDetailLoading(false);
  };

  const openAction = (type, refund) => {
    setAction({ type, refund });
    setAdminNote('');
    setActionErrors(null);
    setProcessForm({ refund_method: 'upi', refund_transaction_id: '' });
  };

  const closeAction = () => {
    if (processing) return;
    setAction(null);
    setAdminNote('');
    setActionErrors(null);
  };

  const refreshAfterAction = async (message) => {
    showToast(message || 'Refund updated');
    setAction(null);
    setAdminNote('');
    setActionErrors(null);
    await fetchRefunds();
    if (detail?.id) {
      const res = await refundService.getRefundDetail(detail.id);
      if (res.success) setDetail(asObject(res.data));
    }
  };

  const submitAction = async () => {
    if (!action?.refund?.id) return;
    setProcessing(true);
    setActionErrors(null);
    let res;
    if (action.type === 'approve') {
      res = await refundService.approveRefund({ refund_id: action.refund.id, admin_note: adminNote });
    } else if (action.type === 'reject') {
      res = await refundService.rejectRefund({ refund_id: action.refund.id, admin_note: adminNote });
    } else {
      if (!processForm.refund_transaction_id.trim()) {
        setActionErrors({ refund_transaction_id: ['Refund transaction id is required'] });
        setProcessing(false);
        return;
      }
      res = await refundService.markRefundProcessed({
        refund_id: action.refund.id,
        refund_method: processForm.refund_method,
        refund_transaction_id: processForm.refund_transaction_id.trim(),
        admin_note: adminNote,
      });
    }

    if (res.success) {
      await refreshAfterAction(res.message);
    } else {
      setActionErrors(res.errors || null);
      showToast(res.message || 'Refund action failed', 'error');
    }
    setProcessing(false);
  };

  const handleFilterChange = (next) => { setFilter(next); resetPage(); };
  const handleSearch = (value) => { setSearch(value); resetPage(); };
  const resetExtraFilters = () => {
    setFilter('all');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setBookingId('');
    setCaretaker('');
    setFamilyUser('');
    setPaymentMethod('');
    resetPage();
  };

  const cards = useMemo(() => {
    const totalAmount = STATUS_FILTERS
      .filter((status) => status !== 'all')
      .reduce((sum, status) => sum + summaryValue(summary, status, 'amount'), 0);
    return [
      { label: 'Pending Refunds', count: summaryValue(summary, 'pending', 'count'), amount: summaryValue(summary, 'pending', 'amount') },
      { label: 'Approved Refunds', count: summaryValue(summary, 'approved', 'count'), amount: summaryValue(summary, 'approved', 'amount') },
      { label: 'Processed Refunds', count: summaryValue(summary, 'processed', 'count'), amount: summaryValue(summary, 'processed', 'amount') },
      { label: 'Total Refund Amount', count: null, amount: totalAmount },
    ];
  }, [summary]);

  const columns = [
    { key: 'id', label: 'Refund ID', render: (r) => <strong>#{r.id}</strong> },
    { key: 'booking_id', label: 'Booking ID', render: (r) => r.booking_id ? `#${r.booking_id}` : '—' },
    { key: 'family', label: 'Family User', render: (r) => nameText(r.family, r.family_username || '—') },
    { key: 'caretaker', label: 'Caretaker', render: (r) => nameText(r.caretaker, r.caretaker_username || '—') },
    { key: 'paid_amount', label: 'Paid Amount', render: (r) => refundMoney(r.paid_amount) },
    { key: 'refund_percentage', label: 'Refund %', render: (r) => refundPercent(r.refund_percentage) },
    { key: 'refund_amount', label: 'Refund Amount', render: (r) => <strong>{refundMoney(r.refund_amount)}</strong> },
    { key: 'status', label: 'Status', render: (r) => <Badge status={refundStatus(r.status)} /> },
    { key: 'created_at', label: 'Created Date', render: (r) => dateText(r.created_at) },
    { key: 'processed_at', label: 'Processed Date', render: (r) => dateText(r.processed_at) },
    { key: 'actions', label: 'Actions', render: (r) => {
      const status = String(r.status || '').toLowerCase();
      return (
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="btn btn-outline" style={{fontSize:11,padding:'4px 10px'}} onClick={() => openDetail(r)}>View</button>
          {status === 'pending' && (
            <>
              <button className="btn btn-primary" style={{fontSize:11,padding:'4px 10px'}} onClick={() => openAction('approve', r)}>Approve</button>
              <button className="btn btn-danger" style={{fontSize:11,padding:'4px 10px'}} onClick={() => openAction('reject', r)}>Reject</button>
            </>
          )}
          {status === 'approved' && (
            <button className="btn btn-primary" style={{fontSize:11,padding:'4px 10px'}} onClick={() => openAction('process', r)}>Mark Processed</button>
          )}
        </div>
      );
    } },
  ];

  const current = detail || {};
  const hasRefundAmounts = current.paid_amount !== null && current.paid_amount !== undefined && current.refund_amount !== null && current.refund_amount !== undefined;
  const retainedAmount = Number(current.paid_amount || 0) - Number(current.refund_amount || 0);
  const timeline = [
    { label: 'Booking Created', value: current.booking?.booking_date || current.booking_date },
    { label: 'Payment Made', value: current.payment_id ? `Payment #${current.payment_id}` : '' },
    { label: 'Cancellation / Refund Requested', value: current.created_at },
    { label: 'Refund Approved', value: current.approved_at },
    { label: 'Refund Rejected', value: current.rejected_at },
    { label: 'Refund Processed', value: current.processed_at },
  ].filter((item) => item.value);

  return (
    <>
      <TopBar searchPlaceholder="Search refund, booking, family..." onSearch={handleSearch} />
      <div className="page-content">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}>
          <div>
            <h1 className="page-title" style={{marginBottom:2}}>Refund Management</h1>
            <p style={{color:'#6B7280',fontSize:13,margin:0}}>Review cancellation refunds and manually track refund processing.</p>
          </div>
          <button className="btn btn-outline" onClick={fetchRefunds} disabled={loading} style={{fontSize:12}}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="stats-grid" style={{gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
          {cards.map((card) => (
            <div className="stat-card" key={card.label} style={{padding:'14px 16px'}}>
              <div className="stat-label">{card.label}</div>
              {loading ? <LoadingSkeleton style={{height:24,width:70}} /> : (
                <div className="stat-value" style={{fontSize:22}}>
                  {card.count !== null ? `${card.count} / ${money(card.amount)}` : money(card.amount)}
                </div>
              )}
            </div>
          ))}
        </div>

        <FilterBar filters={STATUS_FILTERS} active={filter} onChange={handleFilterChange} />

        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'end',marginBottom:12}}>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>From
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); resetPage(); }} style={{display:'block',marginTop:4,padding:'7px 10px',border:'1px solid #E4ECD9',borderRadius:6}} />
          </label>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>To
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); resetPage(); }} style={{display:'block',marginTop:4,padding:'7px 10px',border:'1px solid #E4ECD9',borderRadius:6}} />
          </label>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>Booking ID
            <input value={bookingId} onChange={(e) => { setBookingId(e.target.value); resetPage(); }} style={{display:'block',width:110,marginTop:4,padding:'7px 10px',border:'1px solid #E4ECD9',borderRadius:6}} placeholder="#123" />
          </label>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>Caretaker
            <input value={caretaker} onChange={(e) => { setCaretaker(e.target.value); resetPage(); }} style={{display:'block',width:140,marginTop:4,padding:'7px 10px',border:'1px solid #E4ECD9',borderRadius:6}} placeholder="Name" />
          </label>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>Family User
            <input value={familyUser} onChange={(e) => { setFamilyUser(e.target.value); resetPage(); }} style={{display:'block',width:140,marginTop:4,padding:'7px 10px',border:'1px solid #E4ECD9',borderRadius:6}} placeholder="Name/email" />
          </label>
          <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>Payment Method
            <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); resetPage(); }} style={{display:'block',width:135,marginTop:4,padding:'7px 10px',border:'1px solid #E4ECD9',borderRadius:6}}>
              <option value="">All</option>
              {REFUND_METHODS.map((method) => <option key={method} value={method}>{method.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
          <button className="btn btn-outline" style={{fontSize:12}} onClick={resetExtraFilters}>Clear All Filters</button>
        </div>

        {error && <ErrorState title="Refunds unavailable" message={error} onRetry={fetchRefunds} />}

        <div className="table-card" style={{padding:0}}>
          <DataTable
            columns={columns}
            rows={refunds}
            loading={loading}
            emptyState={<EmptyState title="No refunds found" message="Refund records will appear after eligible booking cancellations." />}
          />
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </div>

      {detail && (
        <DrawerPanel title={`Refund #${current.id || ''}`} onClose={() => setDetail(null)}>
          {detailLoading ? (
            <div style={{padding:16}}>{Array.from({length:8}).map((_, i) => <LoadingSkeleton key={i} style={{height:20,marginBottom:12}} />)}</div>
          ) : (
            <>
              <div className="user-drawer__section"><h4>Refund Metadata</h4><div className="user-info-grid">
                <div className="user-info-item"><span>Status</span><p><Badge status={refundStatus(current.status)} /></p></div>
                <div className="user-info-item"><span>Booking</span><p>{current.booking_id ? `#${current.booking_id}` : '—'}</p></div>
                <div className="user-info-item"><span>Family</span><p>{nameText(current.family)}</p></div>
                <div className="user-info-item"><span>Caretaker</span><p>{nameText(current.caretaker)}</p></div>
                <div className="user-info-item"><span>Patient</span><p>{current.patient_name || '—'}</p></div>
                <div className="user-info-item"><span>Created</span><p>{dateText(current.created_at)}</p></div>
              </div></div>

              <div className="user-drawer__section"><h4>Financial Breakdown</h4><div className="user-info-grid">
                <div className="user-info-item"><span>Total Paid</span><p>{refundMoney(current.paid_amount)}</p></div>
                <div className="user-info-item"><span>Refund Percentage</span><p>{refundPercent(current.refund_percentage)}</p></div>
                <div className="user-info-item"><span>Refund Amount</span><p style={{fontWeight:700,color:'#16A34A'}}>{refundMoney(current.refund_amount)}</p></div>
                <div className="user-info-item"><span>Retained Amount</span><p>{hasRefundAmounts ? money(retainedAmount > 0 ? retainedAmount : 0) : '-'}</p></div>
              </div></div>

              <div className="user-drawer__section"><h4>Cancellation & Payment</h4><div className="user-info-grid">
                <div className="user-info-item"><span>Cancellation Reason</span><p>{current.reason || '—'}</p></div>
                <div className="user-info-item"><span>Payment ID</span><p>{current.payment_id ? `#${current.payment_id}` : '—'}</p></div>
                <div className="user-info-item"><span>Refund Method</span><p>{current.refund_method || '—'}</p></div>
                <div className="user-info-item"><span>Refund Transaction</span><p>{current.refund_transaction_id || '—'}</p></div>
                <div className="user-info-item"><span>Payout Impact</span><p>{current.status === 'processed' ? 'Refund completed before payout close' : 'Hold related payout until resolved'}</p></div>
                <div className="user-info-item"><span>Admin Note</span><p>{current.admin_note || '—'}</p></div>
              </div></div>

              <div className="user-drawer__section"><h4>Timeline</h4>
                <div style={{display:'grid',gap:8}}>
                  {timeline.length ? timeline.map((item) => (
                    <div key={item.label} style={{display:'flex',justifyContent:'space-between',gap:12,borderBottom:'1px solid #EEF3E8',paddingBottom:6}}>
                      <span style={{fontSize:12,color:'#6B7280'}}>{item.label}</span>
                      <strong style={{fontSize:12,color:'#1F2937',textAlign:'right'}}>{item.value}</strong>
                    </div>
                  )) : <EmptyState title="No timeline yet" />}
                </div>
              </div>

              <div style={{display:'flex',gap:8,flexWrap:'wrap',paddingTop:12}}>
                {current.status === 'pending' && (
                  <>
                    <button className="btn btn-primary" style={{fontSize:12}} onClick={() => openAction('approve', current)}>Approve Refund</button>
                    <button className="btn btn-danger" style={{fontSize:12}} onClick={() => openAction('reject', current)}>Reject Refund</button>
                  </>
                )}
                {current.status === 'approved' && (
                  <button className="btn btn-primary" style={{fontSize:12}} onClick={() => openAction('process', current)}>Mark Processed</button>
                )}
              </div>
            </>
          )}
        </DrawerPanel>
      )}

      {action && (
        <ConfirmationModal
          title={
            action.type === 'approve' ? `Approve Refund #${action.refund.id}` :
              action.type === 'reject' ? `Reject Refund #${action.refund.id}` :
                `Mark Refund #${action.refund.id} Processed`
          }
          message={
            action.type === 'approve' ? 'Approve this refund according to the cancellation policy.' :
              action.type === 'reject' ? 'Reject this refund request. Add a clear admin note for audit clarity.' :
                'Mark this approved refund as processed after the manual payment is completed.'
          }
          confirmLabel={
            action.type === 'approve' ? 'Approve Refund' :
              action.type === 'reject' ? 'Reject Refund' :
                'Mark Processed'
          }
          warning={action.type === 'process' ? 'Processed refunds become read-only in the admin workflow.' : ''}
          loading={processing}
          onConfirm={submitAction}
          onCancel={closeAction}
        >
          {action.type === 'process' && (
            <div style={{display:'grid',gap:10,marginTop:10}}>
              <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>Refund Method
                <select
                  value={processForm.refund_method}
                  onChange={(e) => setProcessForm((prev) => ({ ...prev, refund_method: e.target.value }))}
                  style={{display:'block',width:'100%',marginTop:4,padding:8,border:'1px solid #E4ECD9',borderRadius:6}}
                >
                  {REFUND_METHODS.map((method) => <option key={method} value={method}>{method.replace(/_/g, ' ')}</option>)}
                </select>
              </label>
              <label style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>Refund Transaction ID *
                <input
                  value={processForm.refund_transaction_id}
                  onChange={(e) => setProcessForm((prev) => ({ ...prev, refund_transaction_id: e.target.value }))}
                  style={{display:'block',width:'100%',marginTop:4,padding:8,border:'1px solid #E4ECD9',borderRadius:6}}
                  placeholder="manual_ref_123"
                />
              </label>
              {fieldError(actionErrors, 'refund_transaction_id') && <div style={{fontSize:11,color:'#DC2626'}}>{fieldError(actionErrors, 'refund_transaction_id')}</div>}
            </div>
          )}
          <div style={{marginTop:10}}>
            <label style={{fontSize:11,fontWeight:700,color:'#6B7280',display:'block',marginBottom:4}}>Admin Note</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              style={{width:'100%',minHeight:70,padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,resize:'vertical'}}
              placeholder="Add a short note for audit history..."
            />
            {fieldError(actionErrors, 'admin_note') && <div style={{fontSize:11,color:'#DC2626',marginTop:4}}>{fieldError(actionErrors, 'admin_note')}</div>}
            {fieldError(actionErrors, 'status') && <div style={{fontSize:11,color:'#DC2626',marginTop:4}}>{fieldError(actionErrors, 'status')}</div>}
          </div>
        </ConfirmationModal>
      )}

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
