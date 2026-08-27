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
import Toast from '../../components/Toast';
import usePagination from '../../hooks/usePagination';
import useToast from '../../hooks/useToast';
import { replacementService } from '../../services/replacementService';
import { extractItems } from '../../utils/apiData';

const FILTERS = ['all', 'open', 'assigned', 'resolved', 'cancelled'];

const fallbackText = (value, fallback = '-') => (
  value === undefined || value === null || value === '' ? fallback : value
);

const originalName = (ticket) => (
  ticket?.original_caretaker_name ||
  ticket?.caregiver_name ||
  ticket?.caretaker_name ||
  ticket?.original_caretaker_username ||
  '-'
);

const replacementName = (ticket) => (
  ticket?.replacement_caretaker_name ||
  ticket?.replacement_name ||
  ticket?.replacement_caretaker_username ||
  'Not assigned'
);

const ticketReason = (ticket) => (
  ticket?.reason || ticket?.complaint_reason || 'Not available'
);

function ReplacementNoteFields({ adminNote, setAdminNote, replacementCaretakerId, setReplacementCaretakerId, showCaretakerId = false }) {
  const inputStyle = {
    width: '100%',
    padding: 8,
    border: '1px solid #E4ECD9',
    borderRadius: 6,
    fontSize: 13,
    background: '#F0F6EA',
  };

  return (
    <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:10}}>
      {showCaretakerId && (
        <div>
          <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Replacement caretaker ID</label>
          <input
            style={inputStyle}
            value={replacementCaretakerId}
            onChange={(e) => setReplacementCaretakerId(e.target.value)}
            placeholder="Optional, example: 12"
          />
        </div>
      )}
      <div>
        <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Admin note</label>
        <textarea
          style={{...inputStyle,minHeight:70,resize:'vertical'}}
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Add a short note for this update..."
        />
      </div>
    </div>
  );
}

export default function ReplacementsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [replacementCaretakerId, setReplacementCaretakerId] = useState('');
  const { toast, showToast, hideToast } = useToast();
  const { page, limit, totalPages, setPage, setTotalFromResponse, resetPage } = usePagination(20);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { page, limit };
    if (filter !== 'all') params.status = filter;
    const res = await replacementService.listTickets(params);
    if (res.success) {
      setTickets(extractItems(res.data, res.data?.tickets, res.data?.replacements, res.data?.data));
      setTotalFromResponse(res.pagination || res.data);
    } else {
      setError(res.message || 'Failed to load replacements');
    }
    setLoading(false);
  }, [filter, page, limit, setTotalFromResponse]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    resetPage();
  };

  const openDrawer = async (ticket) => {
    setSelected(ticket);
    const res = await replacementService.getTicket(ticket.id);
    setDetail(res.success ? res.data : ticket);
    if (!res.success) showToast(res.message || 'Failed to load replacement detail', 'error');
  };

  const refreshAfterAction = async (res, fallbackMessage) => {
    if (res.success) {
      showToast(res.message || fallbackMessage);
      if (res.data) {
        setSelected(res.data);
        setDetail(res.data);
      }
      await fetchTickets();
      setModal(null);
      setAdminNote('');
      setReplacementCaretakerId('');
    } else {
      showToast(res.message || 'Failed to update replacement ticket', 'error');
    }
  };

  const handleAssign = async () => {
    if (!replacementCaretakerId) {
      showToast('Select a replacement caretaker first.', 'error');
      return;
    }
    setProcessing(true);
    const res = await replacementService.assignTicket({
      id: selected.id,
      admin_note: adminNote,
      replacement_caretaker_user_id: replacementCaretakerId,
    });
    await refreshAfterAction(res, 'Replacement caretaker assigned');
    setProcessing(false);
  };

  const handleCancel = async () => {
    setProcessing(true);
    const res = await replacementService.cancelTicket({ id: selected.id, admin_note: adminNote });
    await refreshAfterAction(res, 'Replacement ticket cancelled');
    setProcessing(false);
  };

  const handleResolve = async () => {
    setProcessing(true);
    const res = await replacementService.resolveTicket({ id: selected.id, admin_note: adminNote });
    await refreshAfterAction(res, 'Replacement ticket resolved');
    setProcessing(false);
  };

  const handleDelete = async () => {
    setProcessing(true);
    const res = await replacementService.deleteTicket(selected.id);
    if (res.success) {
      showToast(res.message || 'Replacement ticket deleted');
      fetchTickets();
      setSelected(null);
      setDetail(null);
      setModal(null);
    } else {
      showToast(res.message || 'Failed to delete replacement ticket', 'error');
    }
    setProcessing(false);
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row) => <span style={{fontWeight:600,fontSize:12,color:'#6B7280'}}>#{row.id}</span> },
    { key: 'booking_id', label: 'Booking', render: (row) => row.booking_reference || (row.booking_id ? `#${row.booking_id}` : '-') },
    { key: 'original_caregiver', label: 'Original', render: (row) => originalName(row) },
    { key: 'replacement_caregiver', label: 'Replacement', render: (row) => replacementName(row) },
    { key: 'reason', label: 'Reason', render: (row) => <span style={{maxWidth:180,display:'inline-block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ticketReason(row)}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
    { key: 'created_at', label: 'Created', render: (row) => row.created_at || row.created || '-' },
    { key: 'actions', label: '', render: (row) => (
      <button className="btn btn-outline" style={{fontSize:11,padding:'4px 10px'}} onClick={() => openDrawer(row)}>View</button>
    )},
  ];

  const detailData = detail || selected || {};
  const availableCaretakers = extractItems(
    detailData.available_replacement_caretakers,
    detailData.available_caretakers,
    detailData.caretakers
  );

  return (
    <>
      <TopBar searchPlaceholder="Search replacements..." />
      <div className="page-content">
        <div style={{marginBottom:12}}>
          <h1 className="page-title" style={{marginBottom:2}}>Replacements</h1>
          <p style={{color:'#6B7280',fontSize:13,margin:0}}>Caretaker replacement tickets and approvals.</p>
        </div>
        <FilterBar filters={FILTERS} active={filter} onChange={handleFilterChange} />
        {error && <ErrorState title={error} onRetry={fetchTickets} />}
        <div className="table-card">
          <DataTable columns={columns} rows={tickets} loading={loading}
            emptyState={<EmptyState title="No replacement tickets" message="No tickets match this filter." />} />
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </div>

      {selected && !modal && (
        <DrawerPanel title={`Replacement #${detailData.id}`} onClose={() => { setSelected(null); setDetail(null); }}>
          <div className="user-drawer__section"><h4>Details</h4><div className="user-info-grid">
            <div className="user-info-item"><span>Status</span><p><Badge status={detailData.status} /></p></div>
            <div className="user-info-item"><span>Booking</span><p>{detailData.booking_reference || (detailData.booking_id ? `#${detailData.booking_id}` : '-')}</p></div>
            <div className="user-info-item"><span>Original Caretaker</span><p>{originalName(detailData)}</p></div>
            <div className="user-info-item"><span>Replacement</span><p>{replacementName(detailData)}</p></div>
            <div className="user-info-item"><span>Reason</span><p>{ticketReason(detailData)}</p></div>
            <div className="user-info-item"><span>Created</span><p>{detailData.created_at || detailData.created || '-'}</p></div>
            <div className="user-info-item"><span>Family</span><p>{fallbackText(detailData.family_name)}{detailData.family_phone ? ` · ${detailData.family_phone}` : ''}</p></div>
            <div className="user-info-item"><span>Patient</span><p>{fallbackText(detailData.patient_name)}{detailData.patient_age ? ` · ${detailData.patient_age}` : ''}</p></div>
            <div className="user-info-item"><span>Requested by</span><p>{fallbackText(detailData.requested_by_name)}{detailData.requested_by_phone ? ` · ${detailData.requested_by_phone}` : ''}</p></div>
            <div className="user-info-item"><span>Booking status</span><p>{fallbackText(detailData.booking_status)}</p></div>
            <div className="user-info-item"><span>Schedule</span><p>{fallbackText(detailData.booking_date)}{detailData.start_time ? ` · ${detailData.start_time}${detailData.end_time ? ` - ${detailData.end_time}` : ''}` : ''}</p></div>
            <div className="user-info-item"><span>Service</span><p>{fallbackText(detailData.service_type)}</p></div>
            <div className="user-info-item"><span>Complaint</span><p>{detailData.complaint_id ? `#${detailData.complaint_id}${detailData.complaint_subject ? ` · ${detailData.complaint_subject}` : ''}` : '-'}</p></div>
            <div className="user-info-item"><span>Admin note</span><p>{fallbackText(detailData.admin_note)}</p></div>
          </div></div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',paddingTop:12}}>
            {detailData.status === 'open' && <button className="btn btn-primary" style={{fontSize:12}} disabled={processing} onClick={() => { setAdminNote(''); setReplacementCaretakerId(''); setModal({action:'assign'}); }}>Assign</button>}
            {detailData.status === 'open' && <button className="btn btn-outline" style={{fontSize:12,color:'#DC2626'}} disabled={processing} onClick={() => { setAdminNote(''); setReplacementCaretakerId(''); setModal({action:'cancel'}); }}>Cancel</button>}
            {detailData.status === 'assigned' && <button className="btn btn-primary" style={{fontSize:12}} disabled={processing} onClick={() => { setAdminNote(''); setReplacementCaretakerId(''); setModal({action:'resolve'}); }}>Resolve</button>}
            {detailData.status === 'assigned' && <button className="btn btn-outline" style={{fontSize:12,color:'#DC2626'}} disabled={processing} onClick={() => { setAdminNote(''); setModal({action:'cancel'}); }}>Cancel</button>}
          </div>
        </DrawerPanel>
      )}

      {modal?.action === 'assign' && <ConfirmationModal title="Assign Replacement" message={`Select an available caretaker for replacement ticket #${selected?.id}.`} onConfirm={handleAssign} onCancel={() => setModal(null)} confirmLabel={processing ? 'Processing...' : 'Assign'} loading={processing} confirmDisabled={!replacementCaretakerId}>
        <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Replacement caretaker</label>
            <select
              style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA'}}
              value={replacementCaretakerId}
              onChange={(e) => setReplacementCaretakerId(e.target.value)}
            >
              <option value="">Select caretaker</option>
              {availableCaretakers.map((caretaker) => (
                <option key={caretaker.user_id || caretaker.id} value={caretaker.user_id || caretaker.id}>
                  {caretaker.name || caretaker.caretaker_name || caretaker.full_name || caretaker.username || `Caretaker #${caretaker.user_id || caretaker.id}`}
                  {caretaker.phone ? ` · ${caretaker.phone}` : ''}
                  {caretaker.pricing_tier_name ? ` · ${caretaker.pricing_tier_name}` : ''}
                  {caretaker.rating ? ` · ${caretaker.rating}★` : ''}
                </option>
              ))}
            </select>
            {!availableCaretakers.length && <p style={{fontSize:12,color:'#DC2626',margin:'6px 0 0'}}>No available approved caretakers returned for this ticket.</p>}
          </div>
          <ReplacementNoteFields adminNote={adminNote} setAdminNote={setAdminNote} />
        </div>
      </ConfirmationModal>}
      {modal?.action === 'cancel' && <ConfirmationModal title="Cancel Replacement" message={`Cancel replacement ticket #${selected?.id}?`} onConfirm={handleCancel} onCancel={() => setModal(null)} confirmLabel={processing ? 'Processing...' : 'Cancel'} loading={processing}>
        <ReplacementNoteFields adminNote={adminNote} setAdminNote={setAdminNote} />
      </ConfirmationModal>}
      {modal?.action === 'resolve' && <ConfirmationModal title="Resolve Replacement" message={`Mark replacement #${selected?.id} as resolved?`} onConfirm={handleResolve} onCancel={() => setModal(null)} confirmLabel={processing ? 'Processing...' : 'Resolve'} loading={processing}>
        <ReplacementNoteFields adminNote={adminNote} setAdminNote={setAdminNote} />
      </ConfirmationModal>}
      {modal?.action === 'delete' && <ConfirmationModal title="Delete Resolved Ticket" message={`Delete resolved replacement ticket #${selected?.id}? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setModal(null)} confirmLabel={processing ? 'Deleting...' : 'Delete'} loading={processing} />}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
