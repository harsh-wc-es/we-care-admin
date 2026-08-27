import { useEffect, useState, useCallback } from 'react';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import DrawerPanel from '../../components/DrawerPanel';
import Pagination from '../../components/Pagination';
import usePagination from '../../hooks/usePagination';
import { auditService } from '../../services/auditService';
import { extractItems } from '../../utils/apiData';

const ENTITY_FILTERS = ['all', 'admin', 'caregiver', 'booking', 'payout', 'complaint', 'sos', 'availability', 'verification', 'pricing'];

const ICON_MAP = {
  approve: '✅', reject: '❌', payout: '💰', availability: '🔄', sos: '🚨',
  pricing: '💲', login: '🔑', complaint: '📋', booking: '📅', verification: '🔍',
  lock: '🔒', unlock: '🔓', create: '➕', update: '✏️', delete: '🗑️', escalate: '⬆️',
};

const iconFor = (action) => {
  const a = (action || '').toLowerCase();
  const key = Object.keys(ICON_MAP).find(k => a.includes(k));
  return ICON_MAP[key] || '📋';
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { page, limit, totalPages, setPage, setTotalFromResponse, resetPage } = usePagination(20);

  const fetchLogs = useCallback(async () => {
    setLoading(true); setError('');
    const params = { page, limit };
    if (filter !== 'all') params.entity_type = filter;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const res = await auditService.listLogs(params);
    if (res.success) {
      setLogs(extractItems(res.data, res.data?.logs, res.data?.audit_logs));
      setTotalFromResponse(res.pagination || res.data);
    } else setError(res.message || 'Failed to load audit logs');
    setLoading(false);
  }, [filter, dateFrom, dateTo, page, limit, setTotalFromResponse]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  const handleFilterChange = (f) => { setFilter(f); resetPage(); };

  const columns = [
    { key: 'icon', label: '', render: (r) => <span style={{fontSize:14,textAlign:'center',display:'block'}}>{iconFor(r.action)}</span> },
    { key: 'actor', label: 'Actor', render: (r) => <div><div style={{fontWeight:600,fontSize:12}}>{r.admin_name||r.admin_username||r.user_name||r.actor_name||'System'}</div><div style={{fontSize:10,color:'#9CA3AF'}}>{r.admin_email||r.actor_email||''}</div></div> },
    { key: 'role', label: 'Role', render: (r) => <Badge status={r.admin_role||r.actor_role||r.role||'admin'} /> },
    { key: 'action', label: 'Action', render: (r) => <span style={{fontWeight:600,fontSize:12,color:'#1F2937'}}>{r.action||r.title||r.description||'—'}</span> },
    { key: 'entity', label: 'Target', render: (r) => <div style={{fontSize:12}}><span style={{color:'#6B7280'}}>{r.entity_type||'—'}</span>{r.entity_id && <span style={{fontFamily:'monospace',fontSize:11,marginLeft:4,color:'#374151'}}>#{r.entity_id}</span>}</div> },
    { key: 'reason', label: 'Reason', render: (r) => <span style={{fontSize:11,color:'#6B7280',maxWidth:120,display:'inline-block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.reason||r.notes||r.admin_notes||'—'}</span> },
    { key: 'timestamp', label: 'Time', render: (r) => <span style={{fontSize:11,color:'#9CA3AF',whiteSpace:'nowrap'}}>{r.created_at||r.timestamp||'—'}</span> },
    { key: 'actions', label: '', render: (r) => <button className="btn btn-outline" style={{fontSize:10,padding:'3px 8px'}} onClick={() => setSelected(r)}>Detail</button> },
  ];

  const d = selected || {};
  const renderJsonBlock = (label, val, color) => {
    if (!val) return null;
    const str = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
    return <div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:'#6B7280',textTransform:'uppercase',marginBottom:3}}>{label}</div><pre style={{background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:4,padding:'8px 10px',fontSize:11,fontFamily:'monospace',color,margin:0,whiteSpace:'pre-wrap',wordBreak:'break-all',maxHeight:200,overflow:'auto'}}>{str}</pre></div>;
  };

  const inputStyle = { padding:'6px 10px',border:'1px solid #E4ECD9',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'#F0F6EA',outline:'none' };

  return (
    <>
      <TopBar searchPlaceholder="Search logs..." />
      <div className="page-content">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div>
            <h1 className="page-title" style={{marginBottom:2}}>Audit Logs</h1>
            <p style={{color:'#6B7280',fontSize:12,margin:0}}>Admin accountability trail — all system and admin actions.</p>
          </div>
          <button className="btn btn-outline" style={{fontSize:11}} onClick={fetchLogs} disabled={loading}>
            {loading ? '⟳ Loading...' : '⟳ Refresh'}
          </button>
        </div>

        {/* Date range filter */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <label style={{fontSize:11,fontWeight:600,color:'#6B7280'}}>Date range:</label>
          <input type="date" style={inputStyle} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); resetPage(); }} />
          <span style={{fontSize:11,color:'#9CA3AF'}}>to</span>
          <input type="date" style={inputStyle} value={dateTo} onChange={(e) => { setDateTo(e.target.value); resetPage(); }} />
          {(dateFrom || dateTo) && (
            <button className="btn btn-outline" style={{fontSize:10,padding:'4px 10px'}} onClick={() => { setDateFrom(''); setDateTo(''); resetPage(); }}>Clear</button>
          )}
        </div>

        <FilterBar filters={ENTITY_FILTERS} active={filter} onChange={handleFilterChange} />
        {error && <ErrorState title={error} onRetry={fetchLogs} />}

        <div className="table-card" style={{padding:0}}>
          <div style={{maxHeight:'calc(100vh - 320px)',overflow:'auto'}}>
            <DataTable columns={columns} rows={logs} loading={loading}
              emptyState={<EmptyState title="No audit logs" message="Activity will appear as admins take actions." />} />
          </div>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </div>

      {selected && (
        <DrawerPanel title={`Audit: ${d.action || 'Detail'}`} onClose={() => setSelected(null)}>
          <div className="user-drawer__section"><h4>Actor</h4><div className="user-info-grid">
            <div className="user-info-item"><span>Name</span><p style={{fontWeight:600}}>{d.admin_name||d.admin_username||d.user_name||d.actor_name||'System'}</p></div>
            <div className="user-info-item"><span>Email</span><p>{d.admin_email||d.actor_email||'—'}</p></div>
            <div className="user-info-item"><span>Role</span><p><Badge status={d.admin_role||d.actor_role||d.role||'admin'} /></p></div>
            <div className="user-info-item"><span>IP</span><p style={{fontFamily:'monospace',fontSize:12}}>{d.ip_address||d.ip||'—'}</p></div>
          </div></div>
          <div className="user-drawer__section"><h4>Action</h4><div className="user-info-grid">
            <div className="user-info-item"><span>Action</span><p style={{fontWeight:700}}>{d.action||'—'}</p></div>
            <div className="user-info-item"><span>Entity</span><p>{d.entity_type||'—'} #{d.entity_id||'—'}</p></div>
            <div className="user-info-item"><span>Timestamp</span><p>{d.created_at||d.timestamp||'—'}</p></div>
          </div></div>
          <div className="user-drawer__section"><h4>Value Changes</h4>
            {renderJsonBlock('Old Value', d.old_value || d.old_values, '#DC2626')}
            {renderJsonBlock('New Value', d.new_value || d.new_values, '#16A34A')}
            {!d.old_value && !d.new_value && !d.old_values && !d.new_values && <p style={{fontSize:12,color:'#9CA3AF'}}>No value changes recorded.</p>}
          </div>
          {(d.reason||d.notes||d.admin_notes) && <div className="user-drawer__section"><h4>Reason / Notes</h4><p style={{fontSize:13,lineHeight:1.6,color:'#374151'}}>{d.reason||d.notes||d.admin_notes}</p></div>}
        </DrawerPanel>
      )}
    </>
  );
}
