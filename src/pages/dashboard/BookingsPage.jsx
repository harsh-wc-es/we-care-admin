import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { bookingService } from '../../services/bookingService';
import { extractItems } from '../../utils/apiData';
import { formatDate } from '../../utils/formatDate';

const FILTERS = ['all','pending','accepted','declined','in_progress','completed','cancelled'];

function bookingId(booking) {
  return booking?.id || booking?.booking_id || booking?.bookingId || '';
}

function paymentBadgeStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'pending') return 'payment_pending';
  return status || 'unpaid';
}

function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return '₹0';
  return `₹${number.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function refundStatus(value) {
  const status = String(value || '').toLowerCase();
  if (!status || status === 'not_applicable') return status || 'not_applicable';
  return `refund_${status}`;
}

function refundAmountText(refund) {
  const value = refund?.refund_amount;
  if (value === null || value === undefined || value === '') return '—';
  return money(value);
}

function refundPercentText(refund) {
  const value = refund?.refund_percentage;
  if (value === null || value === undefined || value === '') return '—';
  return `${value}%`;
}

function dateText(value) {
  return value ? formatDate(value) : '-';
}

function firstRefund(value) {
  return Array.isArray(value) ? value[0] || null : null;
}

function flatRefund(booking) {
  const hasFlatRefund = [
    booking.refund_id,
    booking.refund_status,
    booking.refund_created_at,
    booking.refund_processed_at,
    booking.refund_method,
    booking.refund_transaction_id,
  ].some((value) => value !== undefined && value !== null && value !== '');
  const hasRefundValue = Number(booking.refund_amount ?? 0) > 0 || Number(booking.refund_percentage ?? 0) > 0;

  if (!hasFlatRefund && !hasRefundValue) return null;

  return {
    id: booking.refund_id || null,
    refund_id: booking.refund_id || null,
    status: booking.refund_status || null,
    refund_status: booking.refund_status || null,
    paid_amount: booking.paid_amount,
    refund_eligible: booking.refund_eligible,
    refund_amount: booking.refund_amount,
    refund_percentage: booking.refund_percentage,
    cancellation_fee: booking.cancellation_fee,
    policy_label: booking.policy_label,
    created_at: booking.refund_created_at || booking.refund_created_date,
    approved_at: booking.refund_approved_at,
    processed_at: booking.refund_processed_at,
    refund_method: booking.refund_method,
    refund_transaction_id: booking.refund_transaction_id,
    admin_note: booking.refund_admin_note || booking.admin_note,
  };
}

function getRefundInfo(booking) {
  return (
    booking.refund ||
    booking.refund_info ||
    booking.refund_details ||
    booking.refund_request ||
    firstRefund(booking.booking_refunds) ||
    firstRefund(booking.refunds) ||
    flatRefund(booking)
  );
}

function mapBookingDetailData(data, fallback) {
  const booking = data?.booking || data?.booking_detail || data?.details || data || fallback || {};
  const refund =
    data?.refund ||
    data?.booking_refund ||
    firstRefund(data?.booking_refunds) ||
    firstRefund(data?.refunds) ||
    getRefundInfo(booking);
  const mapped = refund ? { ...booking, refund } : booking;
  if (import.meta.env.DEV) {
    console.log('booking detail raw', data);
    console.log('mapped booking', mapped);
    console.log('mapped refund', refund);
  }
  return mapped;
}

function hasSuccessfulPayment(booking) {
  const paidAmount = Number(booking.paid_amount ?? booking.payment?.paid_amount ?? 0);
  const paymentStatus = String(booking.payment_status || booking.payment?.status || '').toLowerCase();
  const hasSuccessfulPaymentRow = Array.isArray(booking.payments)
    && booking.payments.some((payment) => String(payment?.status || '').toLowerCase() === 'success');

  return paidAmount > 0 || hasSuccessfulPaymentRow || ['paid', 'partially_paid', 'refunded'].includes(paymentStatus);
}

function noRefundApplicable(booking) {
  return booking.refund_eligible === false || Number(booking.refund_amount ?? NaN) === 0;
}

export default function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelErrors, setCancelErrors] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { page, limit, totalPages, setPage, setTotalFromResponse, resetPage } = usePagination(20);

  const fetchBookings = useCallback(async () => {
    setLoading(true); setError('');
    const params = { page, limit };
    if (filter !== 'all') params.status = filter;
    if (search) params.search = search;
    const res = await bookingService.listBookings(params);
    if (res.success) {
      setBookings(extractItems(res.data, res.data?.bookings));
      setTotalFromResponse(res.pagination || res.data);
    } else {
      setError(res.message || 'Failed to load bookings');
    }
    setLoading(false);
  }, [filter, search, page, limit, setTotalFromResponse]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  const handleFilterChange = (f) => { setFilter(f); resetPage(); };
  const handleSearch = (val) => { setSearch(val); resetPage(); };

  const openDrawer = async (booking) => {
    setSelectedBooking(booking);
    setDrawerLoading(true);
    const res = await bookingService.getBookingDetail(bookingId(booking));
    setDrawerData(res.success ? mapBookingDetailData(res.data, booking) : booking);
    setDrawerLoading(false);
  };

  const handleCancelBooking = async () => {
    if (!cancelModal) return;
    setProcessing(true);
    setCancelErrors(null);
    const res = await bookingService.cancelBooking({
      booking_id: cancelModal.id || cancelModal.booking_id,
      reason: cancelReason,
    });
    if (res.success) {
      showToast(res.message || 'Booking cancelled successfully');
      setCancelModal(null);
      setCancelReason('');
      setSelectedBooking(null);
      setDrawerData(null);
      fetchBookings();
    } else {
      setCancelErrors(res.errors || null);
      showToast(res.message || 'Failed to cancel booking', 'error');
    }
    setProcessing(false);
  };

  const columns = [
    { key: 'id', label: 'Booking ID', render: (r) => <span style={{fontWeight:600,fontSize:12,color:'#6B7280'}}>#{bookingId(r) || '—'}</span> },
    { key: 'patient_name', label: 'Patient', render: (r) => r.patient_name || r.patient?.name || '—' },
    { key: 'caregiver_name', label: 'Caretaker', render: (r) => r.caregiver_name || r.caretaker_name || r.caretaker_username || r.caretaker?.name || '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'booking_date', label: 'Date', render: (r) => r.booking_date || '—' },
    { key: 'amount', label: 'Amount', render: (r) => (r.total_customer_amount || r.total_amount) ? `₹${r.total_customer_amount || r.total_amount}` : '—' },
    { key: 'actions', label: '', render: (r) => (
      <button className="btn btn-outline" style={{fontSize:11,padding:'4px 10px'}} onClick={() => openDrawer(r)}>View</button>
    )},
  ];

  const d = drawerData || selectedBooking || {};
  const currentBookingId = bookingId(d);
  const refund = getRefundInfo(d);
  const refundId = refund?.id || refund?.refund_id || d.refund_id;
  const refundStatusValue = refund?.status || refund?.refund_status || d.refund_status;
  const hasRefundInfo = Boolean(refund);
  const cancelledWithoutRefund = d.status === 'cancelled' && !hasRefundInfo;
  const missingRefundForPaidCancellation = cancelledWithoutRefund && !noRefundApplicable(d) && hasSuccessfulPayment(d);

  return (
    <>
      <TopBar searchPlaceholder="Search bookings..." onSearch={handleSearch} />
      <div className="page-content">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <h1 className="page-title" style={{marginBottom:2}}>Bookings</h1>
            <p style={{color:'#6B7280',fontSize:13,margin:0}}>Basic booking list for demo review and visit follow-up.</p>
          </div>
          <span style={{background:'#E8F5E1',color:'#16A34A',fontSize:12,fontWeight:700,padding:'6px 14px',borderRadius:6}}>
            {bookings.length} bookings
          </span>
        </div>
        <FilterBar filters={FILTERS} active={filter} onChange={handleFilterChange} />
        {error && <ErrorState title={error} onRetry={fetchBookings} />}
        <div className="table-card">
          <div style={{maxHeight:'calc(100vh - 300px)',overflow:'auto'}}>
            <DataTable columns={columns} rows={bookings} loading={loading}
              emptyState={<EmptyState title="No bookings found" message={`No bookings match the "${filter}" filter.`} />} />
          </div>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </div>

      {selectedBooking && (
        <DrawerPanel title={`Booking #${currentBookingId || '—'}`} onClose={() => { setSelectedBooking(null); setDrawerData(null); }}>
          {drawerLoading ? (
            <div style={{padding:16}}>{Array.from({length:6}).map((_,i) => <LoadingSkeleton key={i} style={{height:20,marginBottom:12}} />)}</div>
          ) : <>
            <div className="user-drawer__section"><h4>Booking Details</h4><div className="user-info-grid">
              <div className="user-info-item"><span>Status</span><p><Badge status={d.status} /></p></div>
              <div className="user-info-item"><span>Service</span><p>{d.service_type || '—'}</p></div>
              <div className="user-info-item"><span>Patient</span><p>{d.patient_name || d.patient?.name || '—'}</p></div>
              <div className="user-info-item"><span>Caretaker</span><p>{d.caregiver_name || d.caretaker_name || d.caretaker_username || d.caretaker?.name || '—'}</p></div>
              <div className="user-info-item"><span>Date</span><p>{d.booking_date || '—'}</p></div>
              <div className="user-info-item"><span>Time</span><p>{d.start_time || '—'} — {d.end_time || '—'}</p></div>
            </div></div>
            <div className="user-drawer__section"><h4>Payment & Pricing</h4><div className="user-info-grid">
              <div className="user-info-item"><span>Customer Hourly</span><p>₹{d.customer_hourly_rate || '—'}</p></div>
              <div className="user-info-item"><span>Caretaker Hourly</span><p>₹{d.caretaker_hourly_rate || '—'}</p></div>
              <div className="user-info-item"><span>Commission</span><p>₹{d.platform_commission_hourly || '—'}</p></div>
              <div className="user-info-item"><span>Total Customer</span><p>₹{d.total_customer_amount || d.total_amount || '—'}</p></div>
              <div className="user-info-item"><span>Total Booking Amount</span><p>{money(d.total_customer_amount ?? d.total_amount)}</p></div>
              <div className="user-info-item"><span>Paid Amount</span><p>{money(d.paid_amount ?? d.payment?.paid_amount)}</p></div>
              <div className="user-info-item"><span>Remaining Amount</span><p>{money(d.remaining_amount ?? d.payment?.remaining_amount)}</p></div>
              <div className="user-info-item"><span>Payment Status</span><p><Badge status={paymentBadgeStatus(d.payment_status || d.payment?.status)} /></p></div>
              <div className="user-info-item"><span>Refund Amount</span><p>{money(refund?.refund_amount ?? d.refund_amount)}</p></div>
              <div className="user-info-item"><span>Refund Status</span><p><Badge status={refundStatus(refundStatusValue || (noRefundApplicable(d) ? 'not_applicable' : d.refund_status))} /></p></div>
              <div className="user-info-item"><span>Caretaker Earning</span><p>₹{d.caretaker_earning_amount || '—'}</p></div>
              <div className="user-info-item"><span>Payout Status</span><p><Badge status={d.payout_status || '—'} /></p></div>
            </div></div>
            {hasRefundInfo ? (
              <div className="user-drawer__section"><h4>Refund Information</h4><div className="user-info-grid">
                <div className="user-info-item"><span>Refund ID</span><p>#{refundId}</p></div>
                <div className="user-info-item"><span>Refund Status</span><p><Badge status={refundStatus(refundStatusValue)} /></p></div>
                <div className="user-info-item"><span>Paid Amount</span><p>{money(refund?.paid_amount ?? d.paid_amount)}</p></div>
                <div className="user-info-item"><span>Refund Eligible</span><p>{refund?.refund_eligible === false ? 'No' : 'Yes'}</p></div>
                <div className="user-info-item"><span>Refund Amount</span><p>{refundAmountText(refund)}</p></div>
                <div className="user-info-item"><span>Refund %</span><p>{refundPercentText(refund)}</p></div>
                <div className="user-info-item"><span>Refund Created</span><p>{dateText(refund?.created_at)}</p></div>
                <div className="user-info-item"><span>Refund Approved</span><p>{dateText(refund?.approved_at)}</p></div>
                <div className="user-info-item"><span>Refund Processed</span><p>{dateText(refund?.processed_at)}</p></div>
                <div className="user-info-item"><span>Refund Method</span><p>{refund?.refund_method || '—'}</p></div>
                <div className="user-info-item"><span>Refund Transaction ID</span><p>{refund?.refund_transaction_id || '—'}</p></div>
                <div className="user-info-item" style={{gridColumn:'1 / -1'}}><span>Admin Note</span><p>{refund?.admin_note || '—'}</p></div>
                <div className="user-info-item"><span>Cancellation Fee</span><p>{refund?.cancellation_fee !== undefined ? money(refund.cancellation_fee) : '—'}</p></div>
                <div className="user-info-item"><span>Policy</span><p>{refund?.policy_label || refund?.reason || '—'}</p></div>
              </div></div>
            ) : d.status === 'cancelled' && (
              <div className="user-drawer__section"><h4>Refund Information</h4>
                <div style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:6,padding:'10px 12px'}}>
                  {missingRefundForPaidCancellation ? (
                    <p style={{margin:0,fontSize:13,fontWeight:700,color:'#B91C1C'}}>Refund record missing for this paid cancelled booking.</p>
                  ) : (
                    <p style={{margin:0,fontSize:13,fontWeight:700,color:'#374151'}}>No refund applicable for this cancellation.</p>
                  )}
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',paddingTop:12}}>
              <button className="btn btn-outline" style={{fontSize:12}} onClick={() => navigate('/live-tracking')}>Track Visit</button>
              <button className="btn btn-outline" style={{fontSize:12}} onClick={() => navigate('/complaints')}>View Complaints</button>
              {refundId && (
                <button className="btn btn-outline" style={{fontSize:12}} onClick={() => navigate(`/admin/refunds?refund_id=${refundId}`)}>View Refund</button>
              )}
              {!['completed', 'cancelled', 'declined'].includes(d.status) && (
                <button className="btn btn-danger" style={{fontSize:12}} disabled={processing} onClick={() => { setCancelModal(d); setCancelReason(''); setCancelErrors(null); }}>Cancel Booking</button>
              )}
            </div>
          </>}
        </DrawerPanel>
      )}

      {cancelModal && (
        <ConfirmationModal
          title={`Cancel Booking #${cancelModal.id || cancelModal.booking_id}`}
          message="Cancelling a booking may notify the family and caretaker and can affect payout eligibility. Provide an admin reason."
          onConfirm={handleCancelBooking}
          onCancel={() => setCancelModal(null)}
          confirmLabel={processing ? 'Cancelling...' : 'Cancel Booking'}
          loading={processing}
        >
          <div style={{marginTop:10}}>
            <label style={{fontSize:11,fontWeight:700,color:'#6B7280',display:'block',marginBottom:4}}>Cancellation reason *</label>
            <textarea
              style={{width:'100%',minHeight:70,padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,resize:'vertical'}}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Explain why admin is cancelling this booking..."
            />
            {cancelErrors?.reason && <div style={{fontSize:11,color:'#DC2626',marginTop:4}}>{cancelErrors.reason[0]}</div>}
          </div>
        </ConfirmationModal>
      )}

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
