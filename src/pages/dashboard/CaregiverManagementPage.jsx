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
import { caregiverService } from '../../services/caregiverService';
import { pricingService } from '../../services/pricingService';
import { fetchProtectedBlob, getToken, resolveApiUrl } from '../../services/api';
import { extractItems } from '../../utils/apiData';
import { normalizeFileUrl } from '../../utils/fileUrl';
import {
  caretakerApiId,
  caretakerDocumentId,
  caretakerDocumentSlots,
  caretakerDocumentStatus,
  caretakerDocumentUrl,
  isCaretakerDocumentUploaded,
  normalizeCaretaker,
} from '../../utils/caretakerDisplay';

const FILTERS = ['all','pending','approved','rejected','available'];
const VERIFICATION_FILTERS = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved / Verified' },
  { value: 'needs_resubmission', label: 'Rejected Documents / Needs Reupload' },
  { value: 'banned', label: 'Banned' },
];

function formatRate(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? `₹${number.toLocaleString('en-IN')}/hr` : `₹${value}/hr`;
}

function commissionSplit(value) {
  const commission = Number(value);
  return Number.isFinite(commission) ? `${100 - commission}% caretaker / ${commission}% platform` : 'Not provided';
}

function CaregiverAvatar({ caregiver, size = 34 }) {
  const display = normalizeCaretaker(caregiver);
  const photo = normalizeFileUrl(display.avatar);
  return photo ? (
    <img src={photo} alt="" style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',background:'#E8F5E1',flexShrink:0}} />
  ) : (
    <div style={{width:size,height:size,borderRadius:'50%',background:'#E8F5E1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size < 40 ? 12 : 16,fontWeight:800,color:'#166534',flexShrink:0}}>
      {display.initials}
    </div>
  );
}

function TierPill({ caregiver }) {
  const name = normalizeCaretaker(caregiver).tierLabel;
  const unassigned = name === 'Unassigned';
  return <span style={{display:'inline-flex',padding:'4px 9px',borderRadius:999,background:unassigned ? '#F3F4F6' : '#EAF7E8',color:unassigned ? '#6B7280' : '#166534',fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{name}</span>;
}

function Rating({ caregiver, prominent = false }) {
  const display = normalizeCaretaker(caregiver);
  return display.rating ? (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:prominent ? 13 : 12,fontWeight:700,color:'#374151',whiteSpace:'nowrap'}}>
      <span aria-hidden="true" style={{color:'#D4A017'}}>★</span>
      {display.rating.toFixed(1)} ({display.ratingCount})
    </span>
  ) : <span style={{fontSize:prominent ? 13 : 12,color:'#6B7280'}}>No ratings yet</span>;
}

function firstDisplayValue(...values) {
  const value = values.find((item) => item !== null && item !== undefined && item !== '');
  return value === null || value === undefined || value === '' ? null : value;
}

function flagValue(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function documentSummary(record = {}) {
  return record.document_summary || record.caretaker?.document_summary || {};
}

function canApproveCaretaker(record = {}) {
  const summary = documentSummary(record);
  return flagValue(record.can_approve ?? summary.can_approve);
}

function canBanCaretaker(record = {}) {
  const summary = documentSummary(record);
  return flagValue(record.can_ban ?? summary.can_ban) || !['banned'].includes(String(record.verification_status || '').toLowerCase());
}

function normalizeReviewList(record = {}) {
  const source = firstDisplayValue(
    Array.isArray(record.reviews) ? record.reviews : null,
    Array.isArray(record.review_items) ? record.review_items : null,
    Array.isArray(record.data?.reviews) ? record.data.reviews : null,
    Array.isArray(record.data?.items) ? record.data.items : null,
    [],
  );

  return source.map((review) => ({
    id: firstDisplayValue(review.id, review.review_id, ''),
    bookingId: firstDisplayValue(review.booking_id, review.booking, ''),
    bookingReference: firstDisplayValue(review.booking_reference, review.booking_ref, review.booking_id ? `#${review.booking_id}` : ''),
    familyName: firstDisplayValue(review.family_name, review.user_name, review.reviewer_name, review.filed_by_name, review.family_username, 'Not provided'),
    familyEmail: firstDisplayValue(review.family_email, review.email, ''),
    patientName: firstDisplayValue(review.patient_name, review.patient_full_name, 'Not provided'),
    rating: Number(firstDisplayValue(review.rating, review.caretaker_rating, 0)) || 0,
    text: firstDisplayValue(review.review, review.comment, review.feedback, review.message, 'No written review provided.'),
    createdAt: firstDisplayValue(review.created_at, review.submitted_at, review.reviewed_at, ''),
  }));
}

function reviewStats(record = {}, display = {}) {
  const stats = record.review_stats || record.stats || {};
  const total = Number(firstDisplayValue(
    stats.total_reviews,
    stats.review_count,
    stats.reviews_count,
    stats.rating_count,
    record.total_reviews,
    record.review_count,
    record.reviews_count,
    record.rating_count,
    display.ratingCount,
    0,
  )) || 0;
  const average = Number(firstDisplayValue(
    stats.average_rating,
    stats.avg_rating,
    record.average_rating,
    record.avg_rating,
    record.rating,
    record.caretaker_rating,
    display.rating,
    0,
  )) || 0;

  return {
    average,
    total,
    five: Number(stats.five_star || 0),
    four: Number(stats.four_star || 0),
    three: Number(stats.three_star || 0),
    two: Number(stats.two_star || 0),
    one: Number(stats.one_star || 0),
  };
}

function formatReviewDate(value) {
  if (!value) return 'Not provided';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReviewStars({ rating }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span className="caretaker-review-stars" aria-label={`${safeRating} out of 5 stars`}>
      {'\u2605'.repeat(safeRating)}{'\u2606'.repeat(5 - safeRating)}
    </span>
  );
}

function AvailabilityDisplay({ caregiver }) {
  const availability = normalizeCaretaker(caregiver).availability;
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:5,flexDirection:'column'}}>
      <Badge status={availability.status} />
      {availability.source && <Badge status={availability.source} />}
    </div>
  );
}

function ValueTags({ values }) {
  if (!values.length) return <span>Not provided</span>;
  return (
    <span style={{display:'flex',gap:5,flexWrap:'wrap'}}>
      {values.map((value) => (
        <span key={value} style={{padding:'3px 7px',borderRadius:999,background:'#F0F6EA',color:'#374151',fontSize:12}}>{value}</span>
      ))}
    </span>
  );
}

function documentFileName(document, label) {
  const rawName = document?.file_name || document?.filename || document?.original_name || label || 'caretaker-document';
  const sanitized = String(rawName)
    .trim()
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '-');
  return sanitized || 'caretaker-document';
}

function DocumentStatusBadge({ status }) {
  const normalized = String(status || 'not_uploaded').toLowerCase();
  const labels = {
    uploaded: 'Uploaded',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    reuploaded: 'Reuploaded',
    needs_resubmission: 'Needs resubmission',
    not_uploaded: 'Not uploaded',
  };
  const styles = {
    uploaded: { background: '#F3F4F6', color: '#4B5563' },
    pending: { background: '#F3F4F6', color: '#4B5563' },
    approved: { background: '#ECFDF5', color: '#065F46' },
    rejected: { background: '#FEF2F2', color: '#991B1B' },
    reuploaded: { background: '#FFFBEB', color: '#92400E' },
    needs_resubmission: { background: '#FFFBEB', color: '#92400E' },
    not_uploaded: { background: '#F9FAFB', color: '#6B7280' },
  };
  return (
    <span className="badge" style={styles[normalized] || styles.uploaded}>
      {labels[normalized] || normalized.replace(/_/g, ' ')}
    </span>
  );
}

export default function CaregiverManagementPage({ mode = 'manage' }) {
  const isVerificationMode = mode === 'verification';
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(isVerificationMode ? 'pending_review' : 'all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [approvalForm, setApprovalForm] = useState({ pricing_tier_id: '', admin_notes: '' });
  const [pricingForm, setPricingForm] = useState({
    tier_id: '',
    customer_rate_per_hour: '',
    caregiver_rate_per_hour: '',
    commission_percent: '',
    admin_note: '',
  });
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingErrors, setPricingErrors] = useState({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [openingDocument, setOpeningDocument] = useState('');
  const [documentRejectModal, setDocumentRejectModal] = useState(null);
  const [documentRejectReason, setDocumentRejectReason] = useState('');
  const [documentRejectError, setDocumentRejectError] = useState('');
  const [documentRejecting, setDocumentRejecting] = useState(false);
  const [selectedRejectDocuments, setSelectedRejectDocuments] = useState({});
  const [banReason, setBanReason] = useState('');
  const [preview, setPreview] = useState({
    open: false,
    loading: false,
    error: '',
    blobUrl: '',
    contentType: '',
    fileName: '',
    documentLabel: '',
    document: null,
    documentId: '',
    rotation: 0,
  });
  const { toast, showToast, hideToast } = useToast();
  const { page, limit, totalPages, setPage, setTotalFromResponse, resetPage } = usePagination(20);

  const fetchList = useCallback(async () => {
    setLoading(true); setError('');
    const activeFilter = isVerificationMode ? filter : filter;
    const params = { role: 'caretaker', page, limit };
    if (search) params.search = search;
    let res;
    if (isVerificationMode) {
      res = await caregiverService.listVerification({ page, limit, search, status: activeFilter });
    } else {
      if (activeFilter === 'approved') params.verification_status = 'approved';
      else if (activeFilter === 'pending') params.verification_status = 'pending';
      else if (activeFilter === 'rejected') params.verification_status = 'rejected';
      else if (activeFilter === 'available') params.is_available = '1';
      res = await caregiverService.listCaregivers(params);
    }
    if (res.success) {
      setCaregivers(extractItems(res.data, res.data?.users, res.data?.caregivers, res.data?.caretakers));
      setTotalFromResponse(res.pagination || res.data?.pagination || res.data);
    }
    else setError(res.message || 'Failed to load caretakers');
    setLoading(false);
  }, [filter, isVerificationMode, search, page, limit, setTotalFromResponse]);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => () => {
    if (preview.blobUrl) URL.revokeObjectURL(preview.blobUrl);
  }, [preview.blobUrl]);
  const handleFilterChange = (nextFilter) => { setFilter(nextFilter); resetPage(); };
  const handleSearch = (value) => { setSearch(value); resetPage(); };

  const loadTiers = async () => {
    const res = await pricingService.listTiers();
    if (res.success) setTiers(extractItems(res.data, res.data?.tiers));
  };

  const openDrawer = async (cg) => {
    setSelected(cg); setDetailLoading(true);
    setSelectedRejectDocuments({});
    const res = await caregiverService.getCaregiver(caretakerApiId(cg));
    setDetail(res.success ? res.data : cg);
    setDetailLoading(false);
  };

  const handleApprove = async () => {
    if (!approvalForm.pricing_tier_id) return;
    const res = await caregiverService.approveCaregiver({ user_id: caretakerApiId(selected), ...approvalForm });
    if (res.success) { showToast(res.message || 'Caretaker approved'); fetchList(); setModal(null); setSelected(null); setDetail(null); }
    else showToast(res.message || 'Failed to approve caretaker', 'error');
  };

  const handleReject = async (reason) => {
    const res = await caregiverService.rejectCaregiver({ user_id: caretakerApiId(selected), rejection_reason: reason || 'Does not meet requirements' });
    if (res.success) { showToast(res.message || 'Caretaker rejected'); fetchList(); setModal(null); setSelected(null); setDetail(null); }
    else showToast(res.message || 'Failed to reject caretaker', 'error');
  };

  const handleAvailability = async (action) => {
    const data = { user_id: caretakerApiId(selected) };
    if (action === 'force_available') { data.is_available = 1; data.lock = false; }
    else if (action === 'force_unavailable') { data.is_available = 0; data.lock = true; data.lock_note = 'Admin forced unavailable'; }
    else if (action === 'unlock') { data.lock = false; }
    const res = await caregiverService.setAvailability(data);
    if (res.success) { showToast(res.message || 'Availability updated'); openDrawer(selected); }
    else showToast(res.message || 'Failed to update availability', 'error');
  };

  const openPricingModal = async () => {
    await loadTiers();
    setPricingErrors({});
    setPricingForm({
      tier_id: current.tierId || d.tier_id || d.pricing_tier_id || '',
      customer_rate_per_hour: current.rates.customer ?? d.customer_rate_per_hour ?? '',
      caregiver_rate_per_hour: current.rates.caregiver ?? d.caregiver_rate_per_hour ?? '',
      commission_percent: current.rates.commission ?? d.commission_percent ?? '',
      admin_note: '',
    });
    setModal('pricing');
  };

  const updatePricingField = (field, value) => {
    setPricingErrors({});
    setPricingForm((form) => {
      const next = { ...form, [field]: value };
      const customer = Number(next.customer_rate_per_hour);
      const caregiver = Number(next.caregiver_rate_per_hour);
      const commission = Number(next.commission_percent);

      if ((field === 'customer_rate_per_hour' || field === 'caregiver_rate_per_hour') && customer > 0 && caregiver >= 0) {
        next.commission_percent = Number((((customer - caregiver) / customer) * 100).toFixed(2));
      }
      if (field === 'commission_percent' && customer > 0 && commission >= 0) {
        next.caregiver_rate_per_hour = Number((customer - ((customer * commission) / 100)).toFixed(2));
      }

      return next;
    });
  };

  const applyTierDefaults = (tierId) => {
    const tier = tiers.find((item) => String(item.id) === String(tierId));
    setPricingErrors({});
    setPricingForm((form) => ({
      ...form,
      tier_id: tierId,
      customer_rate_per_hour: tier?.customer_hourly_rate ?? form.customer_rate_per_hour,
      caregiver_rate_per_hour: tier?.caretaker_hourly_rate ?? form.caregiver_rate_per_hour,
      commission_percent: tier?.commission_percentage ?? form.commission_percent,
    }));
  };

  const handlePricingUpdate = async () => {
    const customer = Number(pricingForm.customer_rate_per_hour);
    const caregiver = Number(pricingForm.caregiver_rate_per_hour);
    const commission = Number(pricingForm.commission_percent);
    const nextErrors = {};
    if (!pricingForm.tier_id) nextErrors.tier_id = ['Tier is required'];
    if (!Number.isFinite(customer) || customer <= 0) nextErrors.customer_rate_per_hour = ['Customer rate must be greater than 0'];
    if (!Number.isFinite(caregiver) || caregiver < 0) nextErrors.caregiver_rate_per_hour = ['Caretaker rate cannot be negative'];
    if (Number.isFinite(customer) && Number.isFinite(caregiver) && caregiver > customer) nextErrors.caregiver_rate_per_hour = ['Caretaker rate cannot exceed customer rate'];
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) nextErrors.commission_percent = ['Commission must be between 0 and 100'];
    if (Object.keys(nextErrors).length) {
      setPricingErrors(nextErrors);
      return;
    }

    setPricingSaving(true);
    const res = await caregiverService.updatePricing({
      caretaker_user_id: caretakerApiId(d),
      tier_id: pricingForm.tier_id,
      customer_rate_per_hour: customer,
      caregiver_rate_per_hour: caregiver,
      commission_percent: commission,
      admin_note: pricingForm.admin_note,
    });
    setPricingSaving(false);

    if (!res.success) {
      setPricingErrors(res.errors || {});
      showToast(res.message || 'Failed to update caretaker pricing', 'error');
      return;
    }

    showToast(res.message || 'Caretaker pricing updated');
    setModal(null);
    await openDrawer(d);
    fetchList();
  };

  const closePreview = () => {
    setPreview({
      open: false,
      loading: false,
      error: '',
      blobUrl: '',
      contentType: '',
      fileName: '',
      documentLabel: '',
      document: null,
      documentId: '',
      rotation: 0,
      zoom: 1,
    });
  };

  const handleOpenDocument = async (document, slot) => {
    const url = caretakerDocumentUrl(document);
    if (import.meta.env.DEV) {
      console.debug('[Document viewer] open request', {
        document,
        selectedUrl: url,
        resolvedUrl: resolveApiUrl(url),
        tokenExists: Boolean(getToken()),
      });
    }

    if (!url) {
      showToast('Document link is missing.', 'error');
      return;
    }

    const fileName = documentFileName(document, slot.label);
    const documentId = caretakerDocumentId(document);
    setPreview({
      open: true,
      loading: true,
      error: '',
      blobUrl: '',
      contentType: '',
      fileName,
      documentLabel: slot.label,
      document,
      documentId,
      rotation: 0,
      zoom: 1,
    });
    setOpeningDocument(slot.type);
    try {
      const { blob, contentType } = await fetchProtectedBlob(url);
      if (import.meta.env.DEV) {
        console.debug('[Document viewer] blob response', {
          status: 'ready',
          contentType,
          blobSize: blob?.size || 0,
          blobType: blob?.type || '',
        });
      }

      if (!blob || blob.size === 0) {
        throw new Error('Document file is empty.');
      }

      const blobUrl = URL.createObjectURL(blob);
      if (import.meta.env.DEV) console.debug('[Document viewer] blob URL', { created: Boolean(blobUrl) });
      setPreview((currentPreview) => ({
        ...currentPreview,
        loading: false,
        blobUrl,
        contentType: contentType || blob.type || '',
        rotation: 0,
        zoom: 1,
      }));
    } catch (documentError) {
      setPreview((currentPreview) => ({
        ...currentPreview,
        loading: false,
        error: documentError?.message || 'Unable to open document.',
      }));
      showToast(documentError?.message || 'Unable to open document.', 'error');
    } finally {
      setOpeningDocument('');
    }
  };

  const openDocumentRejectModal = () => {
    if (!preview.documentId) return;
    setDocumentRejectReason('');
    setDocumentRejectError('');
    setDocumentRejectModal({
      id: preview.documentId,
      label: preview.documentLabel || 'Document',
      document: preview.document,
    });
  };

  const handleRejectDocument = async () => {
    const reason = documentRejectReason.trim();
    if (!documentRejectModal?.id) {
      setDocumentRejectError('Document id is missing.');
      return;
    }
    if (!reason) {
      setDocumentRejectError('Rejection reason is required.');
      return;
    }

    setDocumentRejecting(true);
    setDocumentRejectError('');
    const res = await caregiverService.rejectDocument({
      document_id: documentRejectModal.id,
      status: 'rejected',
      admin_note: reason,
      rejection_reason: reason,
      reason,
    });
    setDocumentRejecting(false);

    if (res.success) {
      showToast(res.message || 'Document rejected');
      setDocumentRejectModal(null);
      closePreview();
      if (selected) await openDrawer(selected);
      fetchList();
      return;
    }

    const message = res.message || 'Failed to reject document';
    setDocumentRejectError(message);
    showToast(message, 'error');
  };

  const handleApproveDocument = async (document) => {
    const documentId = caretakerDocumentId(document);
    if (!documentId || !selected) return;
    const res = await caregiverService.approveDocument({
      caretaker_user_id: caretakerApiId(selected),
      document_id: documentId,
    });
    if (res.success) {
      showToast(res.message || 'Document approved');
      if (selected) await openDrawer(selected);
      fetchList();
      return;
    }
    showToast(res.message || 'Failed to approve document', 'error');
  };

  const toggleRejectDocument = (document, checked) => {
    const documentId = caretakerDocumentId(document);
    if (!documentId) return;
    setSelectedRejectDocuments((currentItems) => {
      const nextItems = { ...currentItems };
      if (!checked) delete nextItems[documentId];
      else nextItems[documentId] = { document_id: documentId, reason: nextItems[documentId]?.reason || '' };
      return nextItems;
    });
  };

  const updateRejectReason = (document, reason) => {
    const documentId = caretakerDocumentId(document);
    if (!documentId) return;
    setSelectedRejectDocuments((currentItems) => ({
      ...currentItems,
      [documentId]: { document_id: documentId, reason },
    }));
  };

  const handleSubmitSelectedRejections = async () => {
    const documents = Object.values(selectedRejectDocuments).filter((item) => item.reason.trim());
    const selectedCount = Object.keys(selectedRejectDocuments).length;
    if (!selectedCount) {
      showToast('Select at least one document to reject.', 'error');
      return;
    }
    if (documents.length !== selectedCount) {
      showToast('Enter a rejection reason for every selected document.', 'error');
      return;
    }
    setDocumentRejecting(true);
    const res = await caregiverService.rejectSelectedDocuments({
      caretaker_user_id: caretakerApiId(selected),
      documents,
    });
    setDocumentRejecting(false);
    if (res.success) {
      showToast(res.message || 'Selected documents rejected');
      setSelectedRejectDocuments({});
      if (selected) await openDrawer(selected);
      fetchList();
      return;
    }
    showToast(res.message || 'Failed to reject selected documents', 'error');
  };

  const handleBanCaretaker = async () => {
    const reason = banReason.trim();
    if (!reason) {
      showToast('Ban reason is required.', 'error');
      return;
    }
    const res = await caregiverService.banCaregiver({
      caretaker_user_id: caretakerApiId(selected),
      reason,
    });
    if (res.success) {
      showToast(res.message || 'Caretaker banned');
      setModal(null);
      setBanReason('');
      setSelected(null);
      setDetail(null);
      fetchList();
      return;
    }
    showToast(res.message || 'Failed to ban caretaker', 'error');
  };

  const columns = [
    { key: 'avatar', label: 'Avatar', render: (r) => <CaregiverAvatar caregiver={r} /> },
    { key: 'name', label: 'Caretaker Name', render: (r) => {
      const display = normalizeCaretaker(r);
      return (
        <div style={{lineHeight:1.35}}>
          <div style={{fontWeight:700,fontSize:13,color:'#1F2937',textTransform:'capitalize'}}>{display.fullName}</div>
          <div style={{fontSize:11,color:'#6B7280'}}>{display.email}</div>
          <div style={{fontSize:11,color:'#9CA3AF'}}>{display.phone}</div>
        </div>
      );
    }},
    { key: 'caregiver_id', label: 'Caretaker ID', render: (r) => <span style={{fontSize:12,fontWeight:700,color:'#166534'}}>{normalizeCaretaker(r).reference}</span> },
    { key: 'tier', label: 'Tier', render: (r) => <TierPill caregiver={r} /> },
    { key: 'verification_status', label: 'Verification Status', render: (r) => <Badge status={normalizeCaretaker(r).verificationStatus} /> },
    { key: 'availability', label: 'Availability', render: (r) => <AvailabilityDisplay caregiver={r} /> },
    { key: 'rating', label: 'Rating', render: (r) => <Rating caregiver={r} /> },
    { key: 'city', label: 'City', render: (r) => normalizeCaretaker(r).city },
    { key: 'experience', label: 'Experience', render: (r) => normalizeCaretaker(r).experienceText },
    { key: 'actions', label: 'Actions', render: (r) => (
      <button className="btn btn-outline" style={{fontSize:11,padding:'4px 10px'}} onClick={() => openDrawer(r)}>View</button>
    )},
  ];

  const renderCaregiverMobileCard = (caregiver) => {
    const display = normalizeCaretaker(caregiver);
    return (
      <>
        <div className="mobile-data-card__head">
          <CaregiverAvatar caregiver={caregiver} />
          <div style={{minWidth:0,flex:1}}>
            <h3 className="mobile-data-card__title">{display.fullName}</h3>
            <p className="mobile-data-card__subtext">{display.reference}</p>
            <p className="mobile-data-card__subtext">{display.email || 'No email'}</p>
            <p className="mobile-data-card__subtext">{display.phone || 'No phone'}</p>
          </div>
          <Badge status={display.verificationStatus} />
        </div>
        <div className="mobile-data-card__fields">
          <div className="mobile-data-card__field"><span>Tier</span><strong><TierPill caregiver={caregiver} /></strong></div>
          <div className="mobile-data-card__field"><span>Rating</span><strong><Rating caregiver={caregiver} /></strong></div>
          <div className="mobile-data-card__field"><span>Experience</span><strong>{display.experienceText}</strong></div>
          <div className="mobile-data-card__field"><span>Availability</span><strong><AvailabilityDisplay caregiver={caregiver} /></strong></div>
          <div className="mobile-data-card__field"><span>City</span><strong>{display.city || '-'}</strong></div>
        </div>
        <div className="mobile-data-card__actions">
          <button className="btn btn-outline" style={{fontSize:12,padding:'6px 12px'}} onClick={() => openDrawer(caregiver)}>View</button>
        </div>
      </>
    );
  };

  const d = detail || selected || {};
  const current = normalizeCaretaker(d);
  const reviews = normalizeReviewList(d);
  const stats = reviewStats(d, current);

  return (
    <>
      <TopBar searchPlaceholder={isVerificationMode ? 'Search name, ID, email, phone...' : 'Search name, ID, email, phone, city...'} onSearch={handleSearch} />
      <div className="page-content">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <h1 className="page-title" style={{marginBottom:2}}>{isVerificationMode ? 'Caretaker Verification' : 'Caretakers'}</h1>
            <p style={{color:'#6B7280',fontSize:13,margin:0}}>
              {isVerificationMode ? 'Review pending caretaker approvals, documents, and approval decisions.' : 'Caretaker list, availability, and pricing overview.'}
            </p>
          </div>
        </div>
        {isVerificationMode ? (
          <div className="filter-bar" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {VERIFICATION_FILTERS.map((item) => (
              <button
                key={item.value}
                className={`filter-chip ${filter === item.value ? 'active' : ''}`}
                type="button"
                onClick={() => handleFilterChange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <FilterBar filters={FILTERS} active={filter} onChange={handleFilterChange} />
        )}
        {error && <ErrorState title={error} onRetry={fetchList} />}
        <div className="table-card">
          <div style={{maxHeight:'calc(100vh - 260px)',overflow:'auto'}}>
            <DataTable columns={columns} rows={caregivers} loading={loading} renderMobileCard={renderCaregiverMobileCard}
              emptyState={<EmptyState title="No caretakers" message="No caretakers match this filter." />} />
          </div>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </div>

      {selected && (
        <DrawerPanel title={`${current.fullName} · ${current.reference}`} onClose={() => { setSelected(null); setDetail(null); }}>
          {detailLoading ? <LoadingSkeleton style={{height:300}} /> : (
            <>
              <div className="user-drawer__section" style={{display:'flex',alignItems:'center',gap:12}}>
                <CaregiverAvatar caregiver={d} size={54} />
                <div style={{minWidth:0}}>
                  <div style={{fontSize:19,fontWeight:800,color:'#1F2937',textTransform:'capitalize'}}>{current.fullName}</div>
                  <div style={{fontSize:12,fontWeight:700,color:'#166534',marginTop:2}}>{current.reference}</div>
                  <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginTop:7}}>
                    <Badge status={current.otpVerified ? 'OTP Verified' : 'OTP Pending'} />
                    <Badge status={current.verificationStatus} />
                    <Badge status={current.accountStatus} />
                    <Badge status={current.availability.status} />
                    {current.availability.source && <Badge status={current.availability.source} />}
                    <Rating caregiver={d} prominent />
                  </div>
                </div>
              </div>

              <div className="user-drawer__section">
                <h4>Basic Info</h4>
                <div className="user-info-grid">
                  <div className="user-info-item"><span>Name</span><p>{current.fullName}</p></div>
                  <div className="user-info-item"><span>Caretaker ID</span><p>{current.reference}</p></div>
                  <div className="user-info-item"><span>Email</span><p>{current.email}</p></div>
                  <div className="user-info-item"><span>Phone</span><p>{current.phone}</p></div>
                  <div className="user-info-item"><span>OTP Status</span><p><Badge status={current.otpVerified ? 'OTP Verified' : 'OTP Pending'} /></p></div>
                  <div className="user-info-item"><span>Document Status</span><p><Badge status={current.verificationStatus} /></p></div>
                  <div className="user-info-item"><span>Account Status</span><p><Badge status={current.accountStatus} /></p></div>
                  <div className="user-info-item"><span>City</span><p>{current.city}</p></div>
                  <div className="user-info-item"><span>Gender</span><p>{current.gender}</p></div>
                  <div className="user-info-item"><span>DOB</span><p>{current.dob}</p></div>
                </div>
              </div>

              <div className="user-drawer__section">
                <h4>Professional Info</h4>
                <div className="user-info-grid">
                  <div className="user-info-item"><span>Experience</span><p>{current.experienceText}</p></div>
                  <div className="user-info-item"><span>Tier</span><p><TierPill caregiver={d} /></p></div>
                  <div className="user-info-item"><span>Skills</span><p><ValueTags values={current.skills} /></p></div>
                  <div className="user-info-item"><span>Languages</span><p><ValueTags values={current.languages} /></p></div>
                  <div className="user-info-item"><span>Specialization</span><p><ValueTags values={current.specialization} /></p></div>
                </div>
              </div>

              <div className="user-drawer__section">
                <h4>Reviews & Ratings</h4>
                <div className="caretaker-review-summary">
                  <div className="caretaker-review-summary__score">
                    <strong>{stats.total > 0 ? stats.average.toFixed(1) : '0.0'}</strong>
                    <ReviewStars rating={stats.average} />
                    <span>{stats.total} {stats.total === 1 ? 'review' : 'reviews'}</span>
                  </div>
                  <div className="caretaker-review-summary__bars">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = stats[{ 5: 'five', 4: 'four', 3: 'three', 2: 'two', 1: 'one' }[star]] || 0;
                      const percent = stats.total ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div className="caretaker-review-bar" key={star}>
                          <span>{star} star</span>
                          <div><i style={{width:`${percent}%`}} /></div>
                          <strong>{count}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {reviews.length ? (
                  <div className="caretaker-review-list">
                    {reviews.map((review, index) => (
                      <article className="caretaker-review-card" key={review.id || `${review.bookingId}-${index}`}>
                        <div className="caretaker-review-card__top">
                          <div>
                            <ReviewStars rating={review.rating} />
                            <strong>{review.rating ? `${review.rating}/5` : 'Not rated'}</strong>
                          </div>
                          <span>{formatReviewDate(review.createdAt)}</span>
                        </div>
                        <p>{review.text}</p>
                        <div className="caretaker-review-meta">
                          <span>Family: <strong>{review.familyName}</strong></span>
                          {review.familyEmail && <span>Email: <strong>{review.familyEmail}</strong></span>}
                          <span>Patient: <strong>{review.patientName}</strong></span>
                          <span>Booking: <strong>{review.bookingReference || 'Not provided'}</strong></span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="caretaker-review-empty">No reviews yet for this caretaker.</div>
                )}
              </div>

              {/* Documents */}
              <div className="user-drawer__section">
                <h4>Documents</h4>
                {d.document_summary && (
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                    <span className="document-summary-pill">Required Uploaded {d.document_summary.uploaded_documents_count || 0}/{d.document_summary.total_required_documents || 0}</span>
                    <span className="document-summary-pill document-summary-pill--approved">Approved {d.document_summary.approved_documents_count || 0}</span>
                    <span className="document-summary-pill document-summary-pill--rejected">Rejected {d.document_summary.rejected_documents_count || 0}</span>
                    <span className="document-summary-pill document-summary-pill--pending">Pending {d.document_summary.pending_documents_count || 0}</span>
                  </div>
                )}
                {caretakerDocumentSlots(d).map((slot) => {
                  const uploaded = isCaretakerDocumentUploaded(slot.document);
                  const documentStatus = caretakerDocumentStatus(slot.document);
                  const documentId = caretakerDocumentId(slot.document);
                  const isOptionalDocument = slot.optional || slot.document?.optional || slot.document?.required === false;
                  const rejectItem = selectedRejectDocuments[documentId] || null;
                  const canReviewDocument = uploaded && current.verificationStatus !== 'banned';
                  return (
                    <div key={slot.type} className={`review-doc-row${!uploaded && !isOptionalDocument ? ' review-doc-row--missing' : ''}`}>
                      <div className="review-doc-info">
                        <span className="review-doc-name">
                          {slot.label}
                          {isOptionalDocument && <span className="optional-doc-label">Optional</span>}
                        </span>
                        {uploaded ? (
                          <DocumentStatusBadge status={documentStatus} />
                        ) : (
                          <span style={{fontSize:12,color:isOptionalDocument ? '#4B5563' : '#6B7280'}}>
                            {isOptionalDocument ? 'Optional · Not uploaded' : 'Not uploaded'}
                          </span>
                        )}
                        {slot.document?.rejection_reason && (
                          <span style={{fontSize:11,color:'#991B1B'}}>Previous reason: {slot.document.rejection_reason}</span>
                        )}
                      </div>
                      {uploaded && (
                        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
                          <button
                            className="btn btn-outline"
                            style={{fontSize:11,padding:'4px 10px'}}
                            onClick={() => handleOpenDocument(slot.document, slot)}
                            disabled={openingDocument === slot.type}
                          >
                            {openingDocument === slot.type ? 'Opening...' : 'View'}
                          </button>
                          {canReviewDocument && documentStatus !== 'approved' && (
                            <button
                              className="btn btn-primary"
                              style={{fontSize:11,padding:'4px 10px'}}
                              onClick={() => handleApproveDocument(slot.document)}
                            >
                              Approve Document
                            </button>
                          )}
                          {canReviewDocument && (
                            <label style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'#991B1B'}}>
                              <input
                                type="checkbox"
                                checked={Boolean(rejectItem)}
                                onChange={(event) => toggleRejectDocument(slot.document, event.target.checked)}
                              />
                              Reject
                            </label>
                          )}
                          {rejectItem && (
                            <input
                              value={rejectItem.reason}
                              onChange={(event) => updateRejectReason(slot.document, event.target.value)}
                              placeholder="Reason"
                              style={{minWidth:180,padding:'6px 8px',border:'1px solid #FECACA',borderRadius:6,fontSize:12}}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {Object.keys(selectedRejectDocuments).length > 0 && (
                  <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
                    <button className="btn btn-danger" style={{fontSize:12}} disabled={documentRejecting} onClick={handleSubmitSelectedRejections}>
                      {documentRejecting ? 'Submitting...' : 'Submit Selected Rejections'}
                    </button>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="user-drawer__section">
                <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',marginBottom:8}}>
                  <h4 style={{margin:0}}>Pricing</h4>
                  <button className="btn btn-outline" style={{fontSize:11,padding:'4px 10px'}} onClick={openPricingModal}>Change Tier / Pricing</button>
                </div>
                <div className="user-info-grid">
                  <div className="user-info-item"><span>Tier</span><p><TierPill caregiver={d} /></p></div>
                  <div className="user-info-item"><span>Customer Rate</span><p>{formatRate(current.rates.customer)}</p></div>
                  <div className="user-info-item"><span>Caretaker Rate</span><p>{formatRate(current.rates.caregiver)}</p></div>
                  <div className="user-info-item"><span>Commission</span><p>{current.rates.commission === undefined || current.rates.commission === null || current.rates.commission === '' ? '—' : `${current.rates.commission}%`}</p></div>
                  <div className="user-info-item"><span>Earnings Split</span><p>{commissionSplit(current.rates.commission)}</p></div>
                </div>
              </div>

              {/* Availability */}
              <div className="user-drawer__section">
                <h4>Availability</h4>
                <div className="user-info-grid">
                  <div className="user-info-item"><span>Availability</span><p><Badge status={current.availability.status} /></p></div>
                  <div className="user-info-item"><span>Control</span><p>{current.availability.source ? <Badge status={current.availability.source} /> : '—'}</p></div>
                  <div className="user-info-item"><span>Admin Locked</span><p>{current.availability.adminLocked ? 'Yes' : 'No'}</p></div>
                  <div className="user-info-item"><span>Manual Preference</span><p>{current.availability.manualPreference ? 'ON' : 'OFF'}</p></div>
                </div>
                <div style={{display:'flex',gap:6,marginTop:12,flexWrap:'wrap'}}>
                  {current.availability.adminOverride ? (
                    <button className="btn btn-outline" style={{fontSize:11}} onClick={() => handleAvailability('unlock')}>Remove Override</button>
                  ) : (
                    <>
                      <button className="btn btn-primary" style={{fontSize:11}} onClick={() => handleAvailability('force_available')}>Force Available</button>
                      <button className="btn btn-danger" style={{fontSize:11}} onClick={() => handleAvailability('force_unavailable')}>Force Unavailable</button>
                    </>
                  )}
                </div>
              </div>

              {/* Approval Actions */}
              <div style={{display:'flex',gap:8,paddingTop:12,borderTop:'1px solid #E4ECD9',flexWrap:'wrap'}}>
                {canApproveCaretaker(d) && (
                  <button className="btn btn-primary" style={{fontSize:12}} onClick={() => { loadTiers(); setModal('approve'); }}>Approve Caretaker</button>
                )}
                {current.verificationStatus !== 'approved' && current.verificationStatus !== 'banned' && (
                  <button className="btn btn-outline" style={{fontSize:12,color:'#DC2626'}} onClick={() => { setRejectionReason(''); setModal('reject'); }}>Mark Needs Reupload</button>
                )}
                {canBanCaretaker(d) && current.verificationStatus !== 'banned' && (
                  <button className="btn btn-danger" style={{fontSize:12}} onClick={() => { setBanReason(''); setModal('ban'); }}>Ban Caretaker</button>
                )}
              </div>
            </>
          )}
        </DrawerPanel>
      )}

      {modal === 'approve' && (
        <ConfirmationModal title="Approve Caretaker" message="Select a pricing tier for this caretaker."
          onConfirm={handleApprove} onCancel={() => setModal(null)} confirmLabel="Approve">
          <div style={{marginTop:12}}>
            <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Pricing Tier *</label>
            <select style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA'}}
              value={approvalForm.pricing_tier_id} onChange={e => setApprovalForm({...approvalForm, pricing_tier_id: e.target.value})}>
              <option value="">Select tier...</option>
              {tiers.map(t => <option key={t.id} value={t.id}>{t.name} — ₹{t.customer_hourly_rate}/hr</option>)}
            </select>
            <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4,marginTop:10}}>Admin Notes</label>
            <textarea style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA',minHeight:60}}
              value={approvalForm.admin_notes} onChange={e => setApprovalForm({...approvalForm, admin_notes: e.target.value})} />
          </div>
        </ConfirmationModal>
      )}

      {modal === 'reject' && (
        <ConfirmationModal title="Reject Caretaker" message="Are you sure you want to reject this caretaker?"
          onConfirm={() => handleReject(rejectionReason || 'Does not meet requirements')} onCancel={() => setModal(null)} confirmLabel="Reject">
          <div style={{marginTop:12}}>
            <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Rejection reason</label>
            <textarea
              style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA',minHeight:70}}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explain what the caretaker needs to fix..."
            />
          </div>
        </ConfirmationModal>
      )}

      {modal === 'ban' && (
        <ConfirmationModal title="Ban Caretaker" message="Ban this caretaker and remove them from booking availability."
          onConfirm={handleBanCaretaker} onCancel={() => setModal(null)} confirmLabel="Ban Caretaker" confirmDisabled={!banReason.trim()}>
          <div style={{marginTop:12}}>
            <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Ban reason *</label>
            <textarea
              style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA',minHeight:70}}
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Explain why this caretaker is being banned..."
            />
          </div>
        </ConfirmationModal>
      )}

      {modal === 'pricing' && (
        <ConfirmationModal
          title="Change Tier / Pricing"
          message={`Update tier and hourly pricing for ${current.fullName}.`}
          onConfirm={handlePricingUpdate}
          onCancel={() => setModal(null)}
          confirmLabel={pricingSaving ? 'Saving...' : 'Save Pricing'}
          loading={pricingSaving}
        >
          <div className="responsive-form-grid" style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{gridColumn:'1 / -1'}}>
              <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Tier</label>
              <select style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA'}}
                value={pricingForm.tier_id} onChange={e => applyTierDefaults(e.target.value)}>
                <option value="">Select tier...</option>
                {tiers.map(t => <option key={t.id} value={t.id}>{t.name} - ₹{t.customer_hourly_rate}/hr</option>)}
              </select>
              {pricingErrors?.tier_id && <div style={{fontSize:10,color:'#DC2626',marginTop:3}}>{pricingErrors.tier_id[0]}</div>}
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Customer Rate / hr</label>
              <input style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA'}} type="number" min="0" value={pricingForm.customer_rate_per_hour} onChange={e => updatePricingField('customer_rate_per_hour', e.target.value)} />
              {pricingErrors?.customer_rate_per_hour && <div style={{fontSize:10,color:'#DC2626',marginTop:3}}>{pricingErrors.customer_rate_per_hour[0]}</div>}
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Caretaker Rate / hr</label>
              <input style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA'}} type="number" min="0" value={pricingForm.caregiver_rate_per_hour} onChange={e => updatePricingField('caregiver_rate_per_hour', e.target.value)} />
              {pricingErrors?.caregiver_rate_per_hour && <div style={{fontSize:10,color:'#DC2626',marginTop:3}}>{pricingErrors.caregiver_rate_per_hour[0]}</div>}
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Commission %</label>
              <input style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA'}} type="number" min="0" max="100" value={pricingForm.commission_percent} onChange={e => updatePricingField('commission_percent', e.target.value)} />
              {pricingErrors?.commission_percent && <div style={{fontSize:10,color:'#DC2626',marginTop:3}}>{pricingErrors.commission_percent[0]}</div>}
            </div>
            <div style={{gridColumn:'1 / -1'}}>
              <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Admin Note</label>
              <textarea style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA',minHeight:70,resize:'vertical'}}
                value={pricingForm.admin_note} onChange={e => updatePricingField('admin_note', e.target.value)} placeholder="Reason for pricing change..." />
            </div>
          </div>
        </ConfirmationModal>
      )}

      {preview.open && (
        <DocumentPreviewModal
          title={preview.documentLabel || 'Document Preview'}
          subtitle={preview.fileName || 'Protected caretaker document'}
          fileName={preview.fileName}
          contentType={preview.contentType}
          blobUrl={preview.blobUrl}
          loading={preview.loading}
          error={preview.error}
          imageAlt="Document Preview"
          onClose={closePreview}
        >
          {preview.blobUrl && (
            <>
              <a className="btn btn-outline" href={preview.blobUrl} target="_blank" rel="noreferrer">Open in new tab</a>
              {preview.documentId && (
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={openDocumentRejectModal}
                  disabled={documentRejecting}
                >
                  Reject Document
                </button>
              )}
              <a className="btn btn-primary" href={preview.blobUrl} download={preview.fileName}>Download</a>
            </>
          )}
        </DocumentPreviewModal>
      )}
      {documentRejectModal && (
        <ConfirmationModal
          title="Reject Document"
          message={`Reject ${documentRejectModal.label}? The caretaker will need to correct or re-upload this document.`}
          confirmLabel="Reject Document"
          cancelLabel="Cancel"
          warning="This marks only the selected document as rejected. It does not reject the whole caretaker profile."
          loading={documentRejecting}
          confirmDisabled={!documentRejectReason.trim() || !documentRejectModal.id}
          onConfirm={handleRejectDocument}
          onCancel={() => {
            if (!documentRejecting) setDocumentRejectModal(null);
          }}
        >
          <div style={{marginTop:12}}>
            <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>
              Rejection reason *
            </label>
            <textarea
              style={{width:'100%',padding:8,border:'1px solid #E4ECD9',borderRadius:6,fontSize:13,background:'#F0F6EA',minHeight:80,resize:'vertical'}}
              value={documentRejectReason}
              onChange={(event) => {
                setDocumentRejectReason(event.target.value);
                if (documentRejectError) setDocumentRejectError('');
              }}
              placeholder="Explain what is wrong with this document..."
              disabled={documentRejecting}
            />
            {documentRejectError && (
              <p style={{color:'#991B1B',fontSize:12,margin:'8px 0 0'}}>{documentRejectError}</p>
            )}
          </div>
        </ConfirmationModal>
      )}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
