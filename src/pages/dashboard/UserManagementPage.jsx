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
import useToast from '../../hooks/useToast';
import usePagination from '../../hooks/usePagination';
import { userService } from '../../services/userService';
import { asObject, extractItems } from '../../utils/apiData';

const FILTERS = ['all','family','caretaker','admin','active','suspended'];
const userIsActive = (user) => String(user.is_active ?? '1') === '1' || user.is_active === true;
const isFamilyUser = (user) => String(user?.role || '').toLowerCase() === 'family';

function PatientProfileSection({ loading, profile, message }) {
  const data = asObject(profile);

  return (
    <div className="user-drawer__section">
      <h4>Patient Profile</h4>
      {loading ? (
        <p style={{fontSize:13,color:'#6B7280'}}>Loading patient profile...</p>
      ) : !profile ? (
        <p style={{fontSize:13,color:'#9CA3AF'}}>{message || 'No patient profile created yet'}</p>
      ) : (
        <div className="user-info-grid">
          <div className="user-info-item"><span>Patient Name</span><p>{data.patient_name || '—'}</p></div>
          <div className="user-info-item"><span>Age</span><p>{data.age ?? '—'}</p></div>
          <div className="user-info-item"><span>Gender</span><p>{data.gender || '—'}</p></div>
          <div className="user-info-item"><span>Medical Condition</span><p>{data.medical_condition || '—'}</p></div>
          <div className="user-info-item"><span>Allergies</span><p>{data.allergies || '—'}</p></div>
          <div className="user-info-item"><span>Medications</span><p>{data.medications || '—'}</p></div>
          <div className="user-info-item"><span>Mobility Status</span><p>{data.mobility_status || '—'}</p></div>
          <div className="user-info-item"><span>Care Type</span><p>{data.care_type || '—'}</p></div>
          <div className="user-info-item" style={{gridColumn:'1 / -1'}}><span>Special Instructions</span><p>{data.special_instructions || '—'}</p></div>
        </div>
      )}
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientMessage, setPatientMessage] = useState('');
  const [confirmUser, setConfirmUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { page, limit, totalPages, setPage, setTotalFromResponse, resetPage } = usePagination(20);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    const params = { page, limit };
    if (['family','caretaker','admin'].includes(filter)) params.role = filter;
    else if (filter === 'active') params.status = 'active';
    else if (filter === 'suspended') params.status = 'inactive';
    if (search) params.search = search;
    const res = await userService.listUsers(params);
    if (res.success) {
      setUsers(extractItems(res.data, res.data?.users));
      setTotalFromResponse(res.pagination || res.data);
    } else setError(res.message || 'Failed to load users');
    setLoading(false);
  }, [filter, search, page, limit, setTotalFromResponse]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  const handleFilterChange = (f) => { setFilter(f); resetPage(); };
  const handleSearch = (val) => { setSearch(val); resetPage(); };

  const handleStatusToggle = async () => {
    if (!confirmUser) return;
    setProcessing(true);
    const isActive = userIsActive(confirmUser);
    const newStatus = isActive ? 'suspended' : 'active';
    const res = await userService.updateUserStatus({ user_id: confirmUser.id, status: newStatus });
    if (res.success) {
      showToast(`User ${confirmUser.full_name || confirmUser.username || 'user'} ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`);
      fetchUsers();
    } else {
      showToast(res.message || 'Failed to update user status', 'error');
    }
    setConfirmUser(null);
    setProcessing(false);
  };

  const openUserDrawer = async (user) => {
    setSelected(user);
    setPatientProfile(null);
    setPatientMessage('');
    setPatientLoading(false);

    if (!isFamilyUser(user)) return;

    setPatientLoading(true);
    const res = await userService.getPatientProfile(user.id);
    if (res.success) {
      setPatientProfile(res.data || null);
      setPatientMessage(res.data ? '' : (res.message || 'No patient profile created yet'));
    } else {
      setPatientMessage(res.message || 'Unable to load patient profile');
    }
    setPatientLoading(false);
  };

  const columns = [
    { key: 'name', label: 'User', render: (r) => (
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:'#E8F5E1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#16A34A',flexShrink:0}}>
          {(r.full_name || r.name || r.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{fontWeight:600,fontSize:13}}>{r.full_name || r.name || r.username || '—'}</div>
          <div style={{fontSize:11,color:'#9CA3AF'}}>{r.email}</div>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (r) => <Badge status={r.role} /> },
    { key: 'phone', label: 'Phone', render: (r) => r.phone_number || '—' },
    { key: 'city', label: 'City', render: (r) => r.city || '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge status={userIsActive(r) ? 'active' : 'suspended'} /> },
    { key: 'created_at', label: 'Joined', render: (r) => r.created_at || '—' },
    { key: 'actions', label: '', render: (r) => (
      <div style={{display:'flex',gap:6}}>
        <button className="btn btn-outline" style={{fontSize:11,padding:'4px 10px'}} onClick={() => openUserDrawer(r)}>View</button>
        <button className="btn btn-outline" style={{fontSize:11,padding:'4px 10px',color: userIsActive(r) ? '#DC2626' : '#16A34A'}} onClick={() => setConfirmUser(r)}>
          {userIsActive(r) ? 'Suspend' : 'Activate'}
        </button>
      </div>
    )},
  ];

  const renderUserMobileCard = (user) => {
    const displayName = user.full_name || user.name || user.username || 'User';
    return (
      <>
        <div className="mobile-data-card__head">
          <div style={{width:36,height:36,borderRadius:'50%',background:'#E8F5E1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#16A34A',flexShrink:0}}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{minWidth:0,flex:1}}>
            <h3 className="mobile-data-card__title">{displayName}</h3>
            <p className="mobile-data-card__subtext">{user.email || 'No email'}</p>
          </div>
          <Badge status={user.role} />
        </div>
        <div className="mobile-data-card__fields">
          <div className="mobile-data-card__field"><span>Phone</span><strong>{user.phone_number || '-'}</strong></div>
          <div className="mobile-data-card__field"><span>City</span><strong>{user.city || '-'}</strong></div>
          <div className="mobile-data-card__field"><span>Status</span><strong><Badge status={userIsActive(user) ? 'active' : 'suspended'} /></strong></div>
          <div className="mobile-data-card__field"><span>Joined</span><strong>{user.created_at || '-'}</strong></div>
        </div>
        <div className="mobile-data-card__actions">
          <button className="btn btn-outline" style={{fontSize:12,padding:'6px 12px'}} onClick={() => openUserDrawer(user)}>View</button>
          <button className="btn btn-outline" style={{fontSize:12,padding:'6px 12px',color: userIsActive(user) ? '#DC2626' : '#16A34A'}} onClick={() => setConfirmUser(user)}>
            {userIsActive(user) ? 'Suspend' : 'Activate'}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      <TopBar searchPlaceholder="Search users..." onSearch={handleSearch} />
      <div className="page-content">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <h1 className="page-title" style={{marginBottom:2}}>Users</h1>
            <p style={{color:'#6B7280',fontSize:13,margin:0}}>All registered users across roles.</p>
          </div>
          <span style={{background:'#E8F5E1',color:'#16A34A',fontSize:12,fontWeight:700,padding:'6px 14px',borderRadius:6}}>
            {users.length} users
          </span>
        </div>
        <FilterBar filters={FILTERS} active={filter} onChange={handleFilterChange} />
        {error && <ErrorState title={error} onRetry={fetchUsers} />}
        <div className="table-card">
          <div style={{maxHeight:'calc(100vh - 300px)',overflow:'auto'}}>
            <DataTable columns={columns} rows={users} loading={loading} renderMobileCard={renderUserMobileCard}
              emptyState={<EmptyState title="No users found" message="No users match this filter." />} />
          </div>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </div>

      {selected && (
        <DrawerPanel title={selected.full_name || selected.name || selected.username || 'User'} onClose={() => { setSelected(null); setPatientProfile(null); setPatientMessage(''); }}>
          <div className="user-drawer__section"><h4>Profile</h4><div className="user-info-grid">
            <div className="user-info-item"><span>Name</span><p>{selected.full_name || selected.name || selected.username || '—'}</p></div>
            <div className="user-info-item"><span>Email</span><p>{selected.email}</p></div>
            <div className="user-info-item"><span>Phone</span><p>{selected.phone_number || '—'}</p></div>
            <div className="user-info-item"><span>Role</span><p><Badge status={selected.role} /></p></div>
            <div className="user-info-item"><span>City</span><p>{selected.city || '—'}</p></div>
            <div className="user-info-item"><span>Status</span><p><Badge status={userIsActive(selected) ? 'active' : 'suspended'} /></p></div>
            <div className="user-info-item"><span>Joined</span><p>{selected.created_at || '—'}</p></div>
          </div></div>
          {isFamilyUser(selected) && (
            <PatientProfileSection loading={patientLoading} profile={patientProfile} message={patientMessage} />
          )}
        </DrawerPanel>
      )}

      {confirmUser && (
        <ConfirmationModal
          title={`${userIsActive(confirmUser) ? 'Suspend' : 'Activate'} User`}
          message={`Are you sure you want to ${userIsActive(confirmUser) ? 'suspend' : 'activate'} ${confirmUser.full_name || confirmUser.name || confirmUser.username || 'this user'}? ${userIsActive(confirmUser) ? 'They will lose access immediately.' : 'They will regain access.'}`}
          onConfirm={handleStatusToggle}
          onCancel={() => setConfirmUser(null)}
          confirmLabel={processing ? 'Processing...' : (userIsActive(confirmUser) ? 'Suspend' : 'Activate')}
          loading={processing}
        />
      )}

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
