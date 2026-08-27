import { useEffect, useState, useCallback } from 'react';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import DrawerPanel from '../../components/DrawerPanel';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ConfirmationModal from '../../components/ConfirmationModal';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';
import usePagination from '../../hooks/usePagination';
import useToast from '../../hooks/useToast';
import { complaintService } from '../../services/complaintService';
import { extractItems } from '../../utils/apiData';

const FILTERS = ['all', 'open', 'in_review', 'resolved', 'rejected'];
const VALID_STATUSES = ['open', 'in_review', 'resolved', 'rejected'];

function nextStatusForAction(action) {
  if (action === 'review') return 'in_review';
  if (action === 'reject') return 'rejected';
  if (action === 'resolve') return 'resolved';
  return 'in_review';
}

function formatLabel(value = 'general') {
  return String(value || 'general')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function complaintType(complaint) {
  return complaint?.type || complaint?.complaint_type || complaint?.category || 'general';
}

function complaintPatient(complaint) {
  return complaint?.patient_name || complaint?.family_name || complaint?.filed_by_name || '—';
}

function complaintCaregiver(complaint) {
  return complaint?.caretaker_name || complaint?.caregiver_name || complaint?.against_name || '—';
}

function complaintFiledBy(complaint) {
  return complaint?.filed_by_name || complaint?.filed_by_role || '—';
}

function complaintAgainst(complaint) {
  return complaint?.against_name || complaint?.against_role || '—';
}

function withRole(name, role) {
  return role && name !== role ? `${name} (${formatLabel(role)})` : name;
}

function detailComplaint(data) {
  return data?.complaint || data?.data?.complaint || data?.data || data || null;
}

function complaintProofUrl(complaint) {
  return complaint?.proof_view_url || complaint?.proof_file_url || complaint?.proof_url || complaint?.file_url || complaint?.attachment_url || complaint?.proof_file || complaint?.attachment || complaint?.evidence_file || complaint?.evidence_url || '';
}

function normalizeComplaintProof(complaint) {
  const rawUrl = complaintProofUrl(complaint);
  const path = String(rawUrl || complaint?.proof_file || '').split('?')[0];
  const fileName = complaint?.proof_file_name || complaint?.file_name || path.split('/').filter(Boolean).pop() || `complaint-${complaint?.id || 'proof'}-proof`;
  const lowerName = fileName.toLowerCase();
  const mimeType = complaint?.proof_mime_type || complaint?.mime_type || (
    lowerName.endsWith('.pdf') ? 'application/pdf' :
    /\.(png)$/i.test(lowerName) ? 'image/png' :
    /\.(webp)$/i.test(lowerName) ? 'image/webp' :
    /\.(jpe?g)$/i.test(lowerName) ? 'image/jpeg' :
    ''
  );

  return {
    proofUrl: rawUrl,
    proofFileName: fileName,
    proofMimeType: mimeType,
    hasProof: Boolean(complaint?.has_proof || rawUrl || complaint?.proof_file || complaint?.attachment || complaint?.evidence_file),
  };
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [modalStatus, setModalStatus] = useState('');
  const [modalError, setModalError] = useState('');
  const [proofPreview, setProofPreview] = useState({
    open: false,
    loading: false,
    error: '',
    blobUrl: '',
    contentType: '',
    fileName: '',
    complaintId: '',
    rotation: 0,
    zoom: 1,
  });
  const { toast, showToast, hideToast } = useToast();
  const { page, limit, totalPages, setPage, setTotalFromResponse, resetPage } = usePagination(20);

  const fetchComplaints = useCallback(async () => {
    setLoading(true); setError('');
    const params = { page, limit };
    if (filter !== 'all') params.status = filter;
    const res = await complaintService.listComplaints(params);
    if (res.success) {
      setComplaints(extractItems(res.data, res.data?.complaints, res.data?.data?.complaints));
      setTotalFromResponse(res.pagination || res.data);
    } else setError(res.message || 'Failed to load complaints');
    setLoading(false);
  }, [filter, page, limit, setTotalFromResponse]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);
  useEffect(() => () => {
    if (proofPreview.blobUrl) URL.revokeObjectURL(proofPreview.blobUrl);
  }, [proofPreview.blobUrl]);
  const handleFilterChange = (f) => { setFilter(f); resetPage(); };

  const openDrawer = async (c) => {
    setSelected(c); setDetailLoading(true);
    const res = await complaintService.getComplaint(c.id);
    setDetail(res.success ? detailComplaint(res.data) : c);
    setDetailLoading(false);
  };

  const openStatusModal = (action, complaint) => {
    setModal({ action, complaint });
    setModalStatus(nextStatusForAction(action));
    setAdminNotes('');
    setModalError('');
  };

  const closeStatusModal = () => {
    if (processing) return;
    setModal(null);
    setAdminNotes('');
    setModalStatus('');
    setModalError('');
  };

  const handleStatusUpdate = async () => {
    const complaint = modal?.complaint;
    const complaintId = complaint?.id || complaint?.complaint_id;
    const status = modalStatus;

    if (!complaint || !complaintId) {
      setModalError('Complaint record is missing. Please close and reopen this modal.');
      return;
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      setModalError('Select a valid complaint status before updating.');
      return;
    }

    setProcessing(true);
    setModalError('');
    const payload = {
      complaint_id: complaintId,
      status,
      admin_note: adminNotes,
    };
    const res = await complaintService.updateStatus(payload);
    if (res.success) {
      showToast(res.message || 'Complaint updated');
      fetchComplaints();
      setModal(null);
      setAdminNotes('');
      setModalStatus('');
      setModalError('');
      if (selected) openDrawer(selected);
    } else {
      setModalError(res.message || 'Failed to update complaint');
      showToast(res.message || 'Failed to update complaint', 'error');
    }
    setProcessing(false);
  };

  const closeProofPreview = () => {
    if (proofPreview.blobUrl) URL.revokeObjectURL(proofPreview.blobUrl);
    setProofPreview({
      open: false,
      loading: false,
      error: '',
      blobUrl: '',
      contentType: '',
      fileName: '',
      complaintId: '',
      rotation: 0,
      zoom: 1,
    });
  };

  const handleViewProof = async (complaint) => {
    const proof = normalizeComplaintProof(complaint);
    const complaintId = complaint?.id || complaint?.complaint_id;
    if (!proof.hasProof || !complaintId) {
      showToast('No proof uploaded', 'error');
      return;
    }

    if (proofPreview.blobUrl) URL.revokeObjectURL(proofPreview.blobUrl);
    setProofPreview({
      open: true,
      loading: true,
      error: '',
      blobUrl: '',
      contentType: proof.proofMimeType,
      fileName: proof.proofFileName,
      complaintId,
      rotation: 0,
      zoom: 1,
    });

    try {
      const { blob, contentType } = await complaintService.viewComplaintProof(complaintId);
      if (!blob || blob.size === 0) throw new Error('Unable to load proof file.');
      const blobUrl = URL.createObjectURL(blob);
      setProofPreview((current) => ({
        ...current,
        loading: false,
        blobUrl,
        contentType: contentType || blob.type || proof.proofMimeType,
        rotation: 0,
        zoom: 1,
      }));
    } catch (proofError) {
      const message = /session|unauthorized|login/i.test(proofError?.message || '')
        ? 'Session expired. Please log in again.'
        : 'Unable to load proof file.';
      setProofPreview((current) => ({ ...current, loading: false, error: message }));
      showToast(message, 'error');
    }
  };

  const total = complaints.length;
  const openCount = complaints.filter(c => c.status === 'open').length;
  const reviewCount = complaints.filter(c => c.status === 'in_review').length;
  const rejectedCount = complaints.filter(c => c.status === 'rejected').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span style={{fontWeight:700,fontSize:11,fontFamily:'monospace',color:'#6B7280'}}>#{r.id}</span> },
    { key: 'booking', label: 'Booking', render: (r) => r.booking_id ? <span style={{fontFamily:'monospace',fontSize:11}}>#{r.booking_id}</span> : <span style={{color:'#D1D5DB'}}>—</span> },
    { key: 'patient', label: 'Patient', render: (r) => complaintPatient(r) },
    { key: 'caregiver', label: 'Caretaker', render: (r) => <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:20,height:20,borderRadius:'50%',background:'#FEF2F2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'#DC2626',flexShrink:0}}>{complaintCaregiver(r).charAt(0).toUpperCase()}</div><span style={{fontSize:12}}>{complaintCaregiver(r)}</span></div> },
    { key: 'type', label: 'Type', render: (r) => formatLabel(complaintType(r)) },
    { key: 'status', label: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'created_at', label: 'Filed', render: (r) => <span style={{fontSize:11,color:'#9CA3AF'}}>{r.created_at || '—'}</span> },
      { key: 'actions', label: '', render: (r) => <div style={{display:'flex',gap:4}}>
      <button className="btn btn-outline" style={{fontSize:10,padding:'3px 8px'}} onClick={() => openDrawer(r)}>Detail</button>
      {r.status !== 'resolved' && r.status !== 'rejected' && <button className="btn btn-primary" style={{fontSize:10,padding:'3px 8px'}} onClick={() => openStatusModal('update', r)}>Update</button>}
    </div> },
  ];

  const d = detail || selected || {};
  const proof = normalizeComplaintProof(d);
  const inputStyle = { width:'100%',padding:'8px 12px',border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,fontFamily:'inherit',background:'#F0F6EA',outline:'none' };

  return (
    <>
      <TopBar searchPlaceholder="Search complaints..." />
      <div className="page-content">
        <div className="responsive-page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div>
            <h1 className="page-title" style={{marginBottom:2}}>Complaint Management</h1>
            <p style={{color:'#6B7280',fontSize:12,margin:0}}>Review, resolve, or reject patient/caretaker complaints.</p>
          </div>
        </div>
        <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:10}}>
          {[
            { label:'Total', val: total, c:'#374151', bg:'#F9FAFB', b:'#E5E7EB' },
            { label:'Open', val: openCount, c:'#D97706', bg:'#FFFBEB', b:'#FDE68A' },
            { label:'Under Review', val: reviewCount, c:'#2563EB', bg:'#EFF6FF', b:'#BFDBFE' },
            { label:'Rejected', val: rejectedCount, c:'#DC2626', bg:'#FEF2F2', b:'#FECACA' },
            { label:'Resolved', val: resolvedCount, c:'#16A34A', bg:'#F0FDF4', b:'#BBF7D0' },
          ].map((k, i) => (
            <div key={i} style={{background:k.bg,border:`1px solid ${k.b}`,borderLeft:`3px solid ${k.c}`,borderRadius:6,padding:'8px 12px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.4px'}}>{k.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:k.c,lineHeight:1.3,marginTop:2}}>{loading ? '...' : k.val}</div>
            </div>
          ))}
        </div>
        <div className="responsive-inline-note" style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:6,padding:'6px 14px',marginBottom:10,fontSize:11,color:'#92600A',display:'flex',gap:16}}>
          <span>📋 Open complaints <b>block caretaker payouts</b></span>
          <span>Open complaints require <b>admin resolution</b></span>
        </div>
        <FilterBar filters={FILTERS} active={filter} onChange={handleFilterChange} />
        {error && <ErrorState title={error} onRetry={fetchComplaints} />}
        <div className="table-card" style={{padding:0}}>
          <div style={{maxHeight:'calc(100vh - 380px)',overflow:'auto'}}>
            <DataTable columns={columns} rows={complaints} loading={loading} emptyState={<EmptyState title={`No ${filter==='all'?'':filter} complaints`} message="No complaints match this filter." />} />
          </div>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </div>

      {selected && !modal && (
        <DrawerPanel title={`Complaint #${d.id}`} onClose={() => { setSelected(null); setDetail(null); }}>
          {detailLoading ? <LoadingSkeleton style={{height:300}} /> : <>
            <div className="user-drawer__section"><h4>Complaint Details</h4><div className="user-info-grid">
              <div className="user-info-item"><span>Status</span><p><Badge status={d.status} /></p></div>
              <div className="user-info-item"><span>Type</span><p>{formatLabel(complaintType(d))}</p></div>
              <div className="user-info-item"><span>Filed By</span><p style={{fontWeight:600}}>{withRole(complaintFiledBy(d), d.filed_by_role)}</p></div>
              <div className="user-info-item"><span>Against</span><p style={{fontWeight:600}}>{withRole(complaintAgainst(d), d.against_role)}</p></div>
              <div className="user-info-item"><span>Patient</span><p>{complaintPatient(d)}</p></div>
              <div className="user-info-item"><span>Caretaker</span><p>{complaintCaregiver(d)}</p></div>
              <div className="user-info-item"><span>Booking</span><p>{d.booking_id ? `#${d.booking_id}` : '—'}</p></div>
              <div className="user-info-item"><span>Filed</span><p>{d.created_at||'—'}</p></div>
            </div></div>
            <div className="user-drawer__section"><h4>Description</h4>
              {d.subject && <p style={{fontSize:13,fontWeight:600,color:'#1F2937',marginBottom:4}}>{d.subject}</p>}
              <p style={{fontSize:13,lineHeight:1.6,color:'#374151'}}>{d.message||d.description||'—'}</p>
            </div>
            {proof.hasProof ? (
              <div className="user-drawer__section"><h4>Proof File</h4>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{fontSize:12}}
                  onClick={() => handleViewProof(d)}
                >
                  View Proof
                </button>
              </div>
            ) : (
              <div className="user-drawer__section"><h4>Proof File</h4><p style={{fontSize:13,color:'#6B7280',margin:0}}>No proof uploaded</p></div>
            )}
            <div className="user-drawer__section"><h4 style={{color:'#D97706'}}>💰 Payout Impact</h4>
              <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#92600A',lineHeight:1.7}}>
                {d.payout_impact_message || ((d.status==='open'||d.status==='in_review') ? <div>⏱️ Caretaker payout is <b>blocked</b> while this complaint is open.</div> : <div>✅ Resolved. Payout hold released.</div>)}
              </div>
            </div>
            {d.status !== 'resolved' && d.status !== 'rejected' && (
              <div style={{display:'flex',gap:6,flexWrap:'wrap',paddingTop:12,borderTop:'1px solid #E4ECD9'}}>
                {d.status === 'open' && <button className="btn btn-outline" style={{fontSize:12,color:'#2563EB'}} disabled={processing} onClick={() => openStatusModal('review', d)}>Start Review</button>}
                {(d.status === 'open' || d.status === 'in_review') && <button className="btn btn-outline" style={{fontSize:12,color:'#DC2626'}} disabled={processing} onClick={() => openStatusModal('reject', d)}>Reject</button>}
                <button className="btn btn-primary" style={{fontSize:12}} disabled={processing} onClick={() => openStatusModal('resolve', d)}>Resolve</button>
              </div>
            )}
          </>}
        </DrawerPanel>
      )}

      {modal && (
        <ConfirmationModal
          title={`${modal.action==='review'?'Start Review':modal.action==='reject'?'Reject':modal.action==='resolve'?'Resolve':'Update'} Complaint #${modal.complaint?.id}`}
          message={modal.action==='reject'?'Rejecting closes the complaint without resolution.':modal.action==='resolve'?'Resolving releases payout holds on linked bookings.':'Update complaint status.'}
          onConfirm={handleStatusUpdate}
          onCancel={closeStatusModal}
          confirmLabel={processing?'Updating...':(modal.action==='reject'?'Reject':modal.action==='resolve'?'Resolve':'Update')}
          loading={processing}
          confirmDisabled={!modal.complaint?.id || !modalStatus}
        >
          <div style={{marginTop:8,display:'grid',gap:10}}>
            <div style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:6,padding:'8px 10px',fontSize:12,color:'#374151'}}>
              Complaint ID: <b>#{modal.complaint?.id || modal.complaint?.complaint_id || 'Missing'}</b> · Current status: <b>{modal.complaint?.status || '—'}</b>
            </div>
            <label style={{fontSize:11,fontWeight:600,color:'#6B7280',display:'block'}}>
              New Status *
              <select
                style={{...inputStyle,marginTop:3}}
                value={modalStatus}
                disabled={processing || !modal.complaint?.id}
                onChange={(e) => { setModalStatus(e.target.value); setModalError(''); }}
              >
                {VALID_STATUSES.map((status) => (
                  <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>
            <label style={{fontSize:11,fontWeight:600,color:'#6B7280',display:'block',marginBottom:3}}>Admin Notes (optional)</label>
            <textarea style={{...inputStyle,minHeight:60,resize:'vertical'}} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add notes about this decision..." />
            {modalError && <div style={{fontSize:11,color:'#DC2626',fontWeight:600}}>{modalError}</div>}
          </div>
        </ConfirmationModal>
      )}
      {proofPreview.open && (
        <DocumentPreviewModal
          title={`Complaint Proof - Complaint #${proofPreview.complaintId}`}
          subtitle={proofPreview.fileName || 'Complaint proof file'}
          fileName={proofPreview.fileName}
          contentType={proofPreview.contentType}
          blobUrl={proofPreview.blobUrl}
          loading={proofPreview.loading}
          error={proofPreview.error}
          imageAlt="Complaint proof preview"
          unavailableMessage="This proof file can be downloaded."
          onClose={closeProofPreview}
        >
          {proofPreview.blobUrl && <a className="btn btn-primary" href={proofPreview.blobUrl} download={proofPreview.fileName}>Download</a>}
        </DocumentPreviewModal>
      )}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
