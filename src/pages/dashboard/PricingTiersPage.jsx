import { useCallback, useEffect, useState } from 'react';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import DrawerPanel from '../../components/DrawerPanel';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import { pricingService } from '../../services/pricingService';
import { asArray, extractItems } from '../../utils/apiData';

const FILTERS = ['all', 'active', 'inactive'];
const EMPTY_FORM = {
  name: '',
  skill_level: '',
  customer_hourly_rate: '',
  caretaker_hourly_rate: '',
  commission_percentage: '',
  is_active: true,
};

export default function PricingTiersPage() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [assignCaretakerId, setAssignCaretakerId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = filter === 'all' ? { status: 'all' } : { status: filter };
    const res = await pricingService.listTiers(params);
    if (res.success) {
      setTiers(extractItems(res.data, res.data?.tiers));
    } else {
      setError(res.message || 'Failed to load pricing tiers');
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchTiers(); }, [fetchTiers]);

  const loadDetail = async (tier) => {
    setSelected(tier);
    setDetail(tier);
    const res = await pricingService.getTierDetail(tier.id);
    if (res.success) setDetail(res.data || tier);
  };

  const openCreate = () => {
    setSelected(null);
    setDetail(null);
    setForm({ ...EMPTY_FORM });
    setFieldErrors(null);
    setModal('create');
  };

  const openEdit = (tier) => {
    setSelected(tier);
    setForm({
      name: tier.name || '',
      skill_level: tier.skill_level || '',
      customer_hourly_rate: tier.customer_hourly_rate || '',
      caretaker_hourly_rate: tier.caretaker_hourly_rate || '',
      commission_percentage: tier.commission_percentage || '',
      is_active: tier.is_active !== false && tier.is_active !== 0,
    });
    setFieldErrors(null);
    setModal('edit');
  };

  const handleSubmit = async () => {
    setProcessing(true);
    setFieldErrors(null);
    const payload = modal === 'edit' ? { ...form, id: selected?.id } : form;
    const res = modal === 'edit'
      ? await pricingService.updateTier(payload)
      : await pricingService.createTier(payload);

    if (res.success) {
      showToast(res.message || (modal === 'edit' ? 'Pricing tier updated' : 'Pricing tier created'));
      setModal(null);
      fetchTiers();
      if (selected) loadDetail(selected);
    } else {
      setFieldErrors(res.errors || null);
      showToast(res.message || 'Failed to save pricing tier', 'error');
    }
    setProcessing(false);
  };

  const handleDeactivate = async () => {
    if (!selected?.id) return;
    setProcessing(true);
    const res = await pricingService.deleteTier(selected.id);
    if (res.success) {
      showToast(res.message || 'Pricing tier deactivated');
      setModal(null);
      setSelected(null);
      setDetail(null);
      fetchTiers();
    } else {
      showToast(res.message || 'Failed to deactivate pricing tier', 'error');
    }
    setProcessing(false);
  };

  const handleAssign = async () => {
    if (!selected?.id || !assignCaretakerId.trim()) return;
    setProcessing(true);
    const res = await pricingService.updateCaretakerPricing({
      caretaker_user_id: assignCaretakerId.trim(),
      pricing_tier_id: selected.id,
    });
    if (res.success) {
      showToast(res.message || 'Pricing tier assigned to caretaker');
      setModal(null);
      setAssignCaretakerId('');
      loadDetail(selected);
      fetchTiers();
    } else {
      showToast(res.message || 'Failed to assign pricing tier', 'error');
    }
    setProcessing(false);
  };

  const commissionText = (tier) => {
    if (tier.platform_commission_hourly) return `₹${tier.platform_commission_hourly}/hr`;
    const customer = Number(tier.customer_hourly_rate);
    const caretaker = Number(tier.caretaker_hourly_rate);
    if (!customer || !caretaker) return '—';
    return `₹${customer - caretaker}/hr`;
  };

  const columns = [
    { key: 'name', label: 'Tier', render: (r) => (
      <button className="table-link" onClick={() => loadDetail(r)}>{r.name || 'Unnamed tier'}</button>
    ) },
    { key: 'skill_level', label: 'Skill', render: (r) => <Badge status={r.skill_level || 'standard'} /> },
    { key: 'customer_hourly_rate', label: 'Customer Rate', render: (r) => `₹${r.customer_hourly_rate || '—'}/hr` },
    { key: 'caretaker_hourly_rate', label: 'Caretaker Rate', render: (r) => `₹${r.caretaker_hourly_rate || '—'}/hr` },
    { key: 'commission', label: 'Platform Fee', render: commissionText },
    { key: 'assigned', label: 'Assigned', render: (r) => r.assigned_caregivers ?? r.caretaker_count ?? '—' },
    { key: 'is_active', label: 'Status', render: (r) => <Badge status={r.is_active === false || r.is_active === 0 ? 'inactive' : 'active'} /> },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div style={{display:'flex',gap:6}}>
        <button className="btn btn-outline" style={{fontSize:11,padding:'4px 10px'}} onClick={() => loadDetail(r)}>View</button>
        <button className="btn btn-outline" style={{fontSize:11,padding:'4px 10px'}} onClick={() => openEdit(r)}>Edit</button>
      </div>
    ) },
  ];

  const current = detail || selected || {};
  const assignedCaretakers = asArray(current.assigned_caregivers_list || current.caregivers);
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E4ECD9',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'inherit',
    background: '#F0F6EA',
    outline: 'none',
  };

  return (
    <>
      <TopBar searchPlaceholder="Search pricing tiers..." />
      <div className="page-content">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <h1 className="page-title" style={{marginBottom:2}}>Pricing Tiers</h1>
            <p style={{color:'#6B7280',fontSize:13,margin:0}}>Simple caretaker rate tiers for demo bookings and approvals.</p>
          </div>
          <button className="btn btn-primary" style={{fontSize:12}} onClick={openCreate}>Add Tier</button>
        </div>

        <FilterBar filters={FILTERS} active={filter} onChange={setFilter} />
        {error && <ErrorState title="Unable to load pricing tiers" message={error} onRetry={fetchTiers} />}

        <div className="table-card">
          <div style={{maxHeight:'calc(100vh - 285px)',overflow:'auto'}}>
            <DataTable
              columns={columns}
              rows={tiers}
              loading={loading}
              emptyState={<EmptyState title="No pricing tiers" message="Add a tier to define caretaker booking rates." />}
            />
          </div>
        </div>
      </div>

      {selected && !modal && (
        <DrawerPanel title={current.name || 'Pricing Tier'} onClose={() => { setSelected(null); setDetail(null); }}>
          <div className="user-drawer__section">
            <h4>Rates</h4>
            <div className="user-info-grid">
              <div className="user-info-item"><span>Customer Rate</span><p>₹{current.customer_hourly_rate || '—'}/hr</p></div>
              <div className="user-info-item"><span>Caretaker Rate</span><p>₹{current.caretaker_hourly_rate || '—'}/hr</p></div>
              <div className="user-info-item"><span>Platform Fee</span><p>{commissionText(current)}</p></div>
              <div className="user-info-item"><span>Commission %</span><p>{current.commission_percentage || '—'}%</p></div>
              <div className="user-info-item"><span>Skill</span><p><Badge status={current.skill_level || 'standard'} /></p></div>
              <div className="user-info-item"><span>Status</span><p><Badge status={current.is_active === false || current.is_active === 0 ? 'inactive' : 'active'} /></p></div>
            </div>
          </div>

          <div className="user-drawer__section">
            <h4>Assigned Caretakers</h4>
            {assignedCaretakers.length === 0 ? (
              <p style={{fontSize:13,color:'#9CA3AF'}}>No assigned caretakers returned by the backend.</p>
            ) : assignedCaretakers.map((caretaker, index) => (
              <div key={caretaker.id || caretaker.user_id || index} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F3F6EE',fontSize:13}}>
                <span>{caretaker.full_name || caretaker.name || `Caretaker #${caretaker.id || caretaker.user_id}`}</span>
                <span style={{fontWeight:600,color:'#1b4d1c'}}>₹{caretaker.caretaker_hourly_rate || current.caretaker_hourly_rate || '—'}/hr</span>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:8,flexWrap:'wrap',paddingTop:12,borderTop:'1px solid #E4ECD9'}}>
            <button className="btn btn-outline" style={{fontSize:12}} onClick={() => openEdit(current)}>Edit Tier</button>
            <button className="btn btn-primary" style={{fontSize:12}} onClick={() => { setAssignCaretakerId(''); setModal('assign'); }}>Assign to Caretaker</button>
            {current.is_active !== false && current.is_active !== 0 && (
              <button className="btn btn-danger" style={{fontSize:12}} onClick={() => setModal('deactivate')}>Deactivate</button>
            )}
          </div>
        </DrawerPanel>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <div className="drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="confirm-modal" style={{maxWidth:460}}>
            <h2 style={{color:'#1b4d1c',marginBottom:14,fontSize:16}}>{modal === 'edit' ? 'Edit Pricing Tier' : 'Create Pricing Tier'}</h2>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'#6B7280',display:'block',marginBottom:3}}>Tier Name *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                {fieldErrors?.name && <div style={{fontSize:10,color:'#DC2626',marginTop:3}}>{fieldErrors.name[0]}</div>}
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'#6B7280',display:'block',marginBottom:3}}>Skill Level</label>
                <select style={inputStyle} value={form.skill_level} onChange={e => setForm({...form, skill_level: e.target.value})}>
                  <option value="">Select...</option>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="medical">Medical</option>
                </select>
              </div>
              <div className="responsive-form-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:'#6B7280',display:'block',marginBottom:3}}>Customer Rate *</label>
                  <input style={inputStyle} type="number" min="0" value={form.customer_hourly_rate} onChange={e => setForm({...form, customer_hourly_rate: e.target.value})} />
                  {fieldErrors?.customer_hourly_rate && <div style={{fontSize:10,color:'#DC2626',marginTop:3}}>{fieldErrors.customer_hourly_rate[0]}</div>}
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:'#6B7280',display:'block',marginBottom:3}}>Caretaker Rate *</label>
                  <input style={inputStyle} type="number" min="0" value={form.caretaker_hourly_rate} onChange={e => setForm({...form, caretaker_hourly_rate: e.target.value})} />
                  {fieldErrors?.caretaker_hourly_rate && <div style={{fontSize:10,color:'#DC2626',marginTop:3}}>{fieldErrors.caretaker_hourly_rate[0]}</div>}
                </div>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'#6B7280',display:'block',marginBottom:3}}>Commission %</label>
                <input style={inputStyle} type="number" min="0" max="100" value={form.commission_percentage} onChange={e => setForm({...form, commission_percentage: e.target.value})} />
              </div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <button className="btn btn-outline" onClick={() => setModal(null)} disabled={processing}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={processing}>{processing ? 'Saving...' : 'Save Tier'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'assign' && (
        <ConfirmationModal
          title="Assign Pricing Tier"
          message={`Assign "${selected?.name}" to a caretaker by backend user ID.`}
          onConfirm={handleAssign}
          onCancel={() => setModal(null)}
          confirmLabel={processing ? 'Assigning...' : 'Assign Tier'}
          loading={processing}
        >
          <div style={{marginTop:12}}>
            <label style={{fontSize:12,fontWeight:600,color:'#6B7280',display:'block',marginBottom:4}}>Caretaker User ID *</label>
            <input
              style={inputStyle}
              value={assignCaretakerId}
              onChange={e => setAssignCaretakerId(e.target.value)}
              placeholder="Example: 12"
            />
          </div>
        </ConfirmationModal>
      )}

      {modal === 'deactivate' && (
        <ConfirmationModal
          title="Deactivate Pricing Tier"
          message={`Deactivate "${selected?.name}"? Existing caretakers and bookings remain unchanged.`}
          onConfirm={handleDeactivate}
          onCancel={() => setModal(null)}
          confirmLabel={processing ? 'Deactivating...' : 'Deactivate'}
          loading={processing}
        />
      )}

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
