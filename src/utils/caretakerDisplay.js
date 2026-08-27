const EMPTY_TEXT = '—';

export const CARETAKER_DOCUMENT_SLOTS = [
  { type: 'id_proof_front', label: 'ID Proof Front', required: true },
  { type: 'id_proof_back', label: 'ID Proof Back', required: true },
  { type: 'training_certificate', label: 'Training Certificate', required: true },
  { type: 'experience_proof', label: 'Experience Proof', required: false, optional: true },
  { type: 'police_verification', label: 'Police Verification', required: true },
];

const DOCUMENT_TYPE_ALIASES = {
  id_front: 'id_proof_front',
  id_proof_front: 'id_proof_front',
  id_back: 'id_proof_back',
  id_proof_back: 'id_proof_back',
  certificate: 'training_certificate',
  training: 'training_certificate',
  training_certificate: 'training_certificate',
  experience: 'experience_proof',
  experience_document: 'experience_proof',
  experience_proof: 'experience_proof',
  police: 'police_verification',
  police_certificate: 'police_verification',
  police_verification: 'police_verification',
  non_criminal_certificate: 'police_verification',
  no_criminal_history: 'police_verification',
};

function firstValue(...values) {
  return values.find((value) => value !== null && value !== undefined && value !== '');
}

function booleanValue(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'yes';
}

function textValue(value, fallback = EMPTY_TEXT) {
  return firstValue(value) ?? fallback;
}

function nestedValue(record, key) {
  return firstValue(record?.[key], record?.profile?.[key], record?.caretaker?.[key], record?.user?.[key]);
}

function normalizedDocumentType(value) {
  const rawType = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (DOCUMENT_TYPE_ALIASES[rawType]) return DOCUMENT_TYPE_ALIASES[rawType];
  if (rawType.includes('id') && rawType.includes('front')) return 'id_proof_front';
  if (rawType.includes('id') && rawType.includes('back')) return 'id_proof_back';
  if (rawType.includes('police') || rawType.includes('criminal')) return 'police_verification';
  if (rawType.includes('training') || rawType.includes('certificate')) return 'training_certificate';
  if (rawType.includes('experience')) return 'experience_proof';
  return rawType;
}

function documentEntries(record) {
  const map = firstValue(
    record?.document_map,
    record?.documents_by_type,
    record?.caretaker?.document_map,
    record?.caretaker?.documents_by_type,
  );

  if (map && typeof map === 'object' && !Array.isArray(map)) {
    return Object.entries(map).map(([documentType, document]) => ({
      ...(document || {}),
      document_type: document?.document_type || documentType,
    }));
  }

  return Array.isArray(record?.documents)
    ? record.documents
    : Array.isArray(record?.caretaker?.documents)
      ? record.caretaker.documents
      : [];
}

export function caretakerDocumentSlots(record = {}) {
  const byType = new Map();

  documentEntries(record).forEach((document) => {
    const type = normalizedDocumentType(document?.document_type || document?.type || document?.label);
    if (type && !byType.has(type)) byType.set(type, document);
  });

  return CARETAKER_DOCUMENT_SLOTS.map((slot) => ({
    ...slot,
    document: byType.get(slot.type) || null,
    optional: slot.optional || slot.required === false,
  }));
}

export function isCaretakerDocumentUploaded(document) {
  return document?.uploaded === true
    || document?.uploaded === 1
    || document?.uploaded === '1'
    || Boolean(document?.view_url || document?.file_url);
}

export function caretakerDocumentId(document) {
  return firstValue(document?.document_id, document?.id, '');
}

export function caretakerDocumentStatus(document) {
  if (!document) return 'not_uploaded';
  const status = String(firstValue(document?.status, document?.document_status, '')).trim().toLowerCase();
  if (status) return status;
  return isCaretakerDocumentUploaded(document) ? 'uploaded' : 'not_uploaded';
}

export function caretakerDocumentUrl(document) {
  return firstValue(document?.view_url, document?.file_url, '');
}

function tierLabel(record) {
  const tier = firstValue(record?.pricing_tier, record?.tier);
  return firstValue(
    record?.pricing_tier_label,
    record?.pricing_tier_detail?.label,
    record?.pricing_tier_detail?.name,
    typeof tier === 'object' ? tier.label : null,
    typeof tier === 'object' ? tier.name : null,
    typeof tier === 'string' ? tier : null,
    'Unassigned',
  );
}

function ratingValue(record) {
  const value = firstValue(record?.average_rating, record?.rating);
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizedAvailability(record) {
  const detail = record?.availability_detail || {};
  const sourceRaw = String(firstValue(
    record?.availability_source,
    detail.availability_source,
    detail.availability_reason,
    record?.caretaker_availability_reason,
    record?.availability_reason,
    '',
  )).toLowerCase();
  const statusRaw = String(firstValue(
    record?.availability_status,
    detail.availability_status,
    record?.caretaker_availability_status,
    record?.availability,
    sourceRaw,
    '',
  )).toLowerCase();
  const adminLocked = booleanValue(firstValue(
    record?.admin_locked,
    record?.caretaker_admin_locked,
    detail.admin_locked,
    detail.availability_locked_by_admin,
  ));
  const activeVisit = booleanValue(firstValue(
    record?.has_active_visit,
    record?.caretaker_has_active_visit,
    detail.has_active_visit,
  )) || statusRaw.includes('visit') || sourceRaw.includes('visit');
  const manualPreference = booleanValue(firstValue(
    record?.manual_preference,
    record?.manual_availability_enabled,
    detail.manual_availability_enabled,
  ));
  const available = booleanValue(firstValue(
    record?.is_available,
    record?.caretaker_is_available,
    detail.is_available,
  ));

  let status = 'offline';
  if (activeVisit || statusRaw.includes('busy')) status = 'busy';
  else if (
    statusRaw.includes('unavailable')
    || statusRaw === 'manual_off'
    || statusRaw === 'admin_forced_off'
  ) status = 'unavailable';
  else if (
    statusRaw.includes('available')
    || statusRaw === 'manual_on'
    || statusRaw === 'admin_forced_on'
    || available
  ) status = 'available';

  let source = '';
  if (adminLocked || sourceRaw.includes('admin')) source = 'admin_override';
  else if (activeVisit) source = 'active_visit';
  else if (manualPreference || sourceRaw.includes('manual')) source = 'manual';

  return {
    status,
    source,
    adminLocked,
    adminOverride: source === 'admin_override',
    activeVisit,
    manualPreference,
  };
}

function caretakerReference(record) {
  const id = firstValue(record?.caretaker_id, record?.user_id, record?.id);
  if (!id) return EMPTY_TEXT;
  if (typeof id === 'string' && /^(CT|WC-CT)-/i.test(id)) return id.toUpperCase();
  const numericPart = String(id).replace(/\D/g, '');
  return numericPart ? `CT-${numericPart.padStart(4, '0')}` : String(id);
}

export function caretakerApiId(record) {
  return firstValue(record?.user_id, record?.caretaker_user_id, record?.caretaker_id, record?.id, '');
}

export function caretakerListValues(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [String(value)];
}

export function normalizeCaretaker(record = {}) {
  const rating = ratingValue(record);
  const id = caretakerApiId(record);
  const fullName = textValue(nestedValue(record, 'full_name') || nestedValue(record, 'name') || record?.username, 'Caretaker');
  const experience = firstValue(record?.experience, record?.experience_years, record?.years_of_experience);

  return {
    raw: record,
    id,
    reference: caretakerReference(record),
    fullName,
    email: textValue(nestedValue(record, 'email'), 'Not provided'),
    phone: textValue(nestedValue(record, 'phone') || nestedValue(record, 'phone_number'), 'Not provided'),
    city: textValue(nestedValue(record, 'city')),
    gender: textValue(nestedValue(record, 'gender'), 'Not provided'),
    dob: textValue(nestedValue(record, 'date_of_birth') || nestedValue(record, 'dob'), 'Not provided'),
    avatar: firstValue(record?.avatar, record?.profile_photo, record?.profile_picture, record?.user?.profile_photo, ''),
    initials: fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('') || 'CG',
    tierLabel: tierLabel(record),
    rating,
    ratingCount: Number(firstValue(record?.rating_count, record?.total_reviews, record?.review_count, record?.reviews_count, 0)) || 0,
    verificationStatus: firstValue(record?.verification_status, record?.caretaker_verification_status, 'pending') === 'pending'
      ? 'pending_review'
      : firstValue(record?.verification_status, record?.caretaker_verification_status, 'pending'),
    otpVerified: booleanValue(firstValue(record?.otp_verified, record?.is_verified)),
    accountStatus: firstValue(
      record?.account_status,
      booleanValue(record?.is_banned) || record?.verification_status === 'banned' ? 'banned' : null,
      firstValue(record?.user_is_active, record?.is_active) === 0 || firstValue(record?.user_is_active, record?.is_active) === '0'
        ? 'suspended'
        : 'active',
    ),
    availability: normalizedAvailability(record),
    experienceText: experience === null || experience === undefined || experience === '' ? EMPTY_TEXT : `${experience} yrs`,
    skills: caretakerListValues(firstValue(record?.skills, record?.skill_set)),
    languages: caretakerListValues(record?.languages),
    specialization: caretakerListValues(firstValue(record?.specialization, record?.specializations, record?.qualification)),
    documents: record?.documents || record?.caretaker?.documents || [],
    rates: {
      customer: firstValue(record?.customer_hourly_rate, record?.pricing_tier_detail?.customer_hourly_rate, record?.pricing_tier?.customer_hourly_rate),
      caregiver: firstValue(record?.caretaker_hourly_rate, record?.caregiver_hourly_rate, record?.pricing_tier_detail?.caretaker_hourly_rate, record?.pricing_tier?.caretaker_hourly_rate),
      commission: firstValue(record?.commission_percentage, record?.platform_commission_percentage, record?.pricing_tier_detail?.commission_percentage, record?.pricing_tier?.commission_percentage),
    },
  };
}
