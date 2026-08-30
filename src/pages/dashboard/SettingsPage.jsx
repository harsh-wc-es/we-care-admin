import { useEffect, useMemo, useState } from 'react';
import TopBar from '../../components/TopBar';
import Badge from '../../components/Badge';
import ConfirmationModal from '../../components/ConfirmationModal';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import { API_BASE_URL, getToken, getUser, setUser } from '../../services/api';
import { authService } from '../../services/authService';
import { settingsService } from '../../services/settingsService';

const PREF_KEYS = {
  pageSize: 'wecare_admin_default_page_size',
  compactTables: 'wecare_admin_compact_tables',
  autoRefresh: 'wecare_admin_auto_refresh_interval',
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #D4E4C4',
  borderRadius: 6,
  fontSize: 13,
  background: '#F0F6EA',
  color: '#1F2937',
};

function userName(user) {
  return user?.name || user?.full_name || user?.username || 'Admin';
}

function userPhone(user) {
  return user?.phone_number || user?.phone || user?.mobile || '';
}

function settingValue(value, fallback = '-') {
  return value || fallback;
}

function readPreferences() {
  return {
    pageSize: localStorage.getItem(PREF_KEYS.pageSize) || '20',
    compactTables: localStorage.getItem(PREF_KEYS.compactTables) === 'true',
    autoRefresh: localStorage.getItem(PREF_KEYS.autoRefresh) || 'off',
  };
}

function readTokenExpiry() {
  const token = getToken();
  if (!token || token.split('.').length < 2) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload?.exp) return '';
    return new Date(payload.exp * 1000).toLocaleString();
  } catch {
    return '';
  }
}

function SettingsCard({ title, action, children }) {
  return (
    <section className="table-card settings-card">
      <div className="settings-card__header">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const [adminProfile, setAdminProfile] = useState(getUser() || {});
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: userName(adminProfile),
    email: adminProfile.email || '',
    phone_number: userPhone(adminProfile),
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [preferences, setPreferences] = useState(readPreferences);
  const [apiStatus, setApiStatus] = useState({ state: 'idle', message: 'Not tested yet.', data: null });
  const [testingApi, setTestingApi] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const tokenExpiry = readTokenExpiry();

  useEffect(() => {
    let active = true;

    async function loadAdminProfile() {
      setProfileLoading(true);
      const response = await settingsService.getAdminProfile();
      if (!active) return;

      if (response.ok && response.data) {
        setAdminProfile(response.data);
        setUser(response.data);
      } else {
        showToast(response.message || 'Unable to refresh admin profile.', 'error');
      }

      setProfileLoading(false);
    }

    loadAdminProfile();

    return () => {
      active = false;
    };
  }, [showToast]);

  const profileValidation = useMemo(() => {
    const errors = {};
    const name = profileForm.name.trim();
    const email = profileForm.email.trim();
    const phone = profileForm.phone_number.trim();

    if (!name) errors.name = 'Display name / username is required.';
    else if (name.length < 2 || name.length > 100) errors.name = 'Display name / username must be between 2 and 100 characters.';

    if (!email) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';

    if (phone && !/^\d{7,15}$/.test(phone)) errors.phone_number = 'Phone must be 7 to 15 digits.';

    return errors;
  }, [profileForm]);

  const profileChanged = useMemo(() => {
    return (
      profileForm.name.trim() !== userName(adminProfile) ||
      profileForm.email.trim() !== (adminProfile.email || '') ||
      profileForm.phone_number.trim() !== userPhone(adminProfile)
    );
  }, [adminProfile, profileForm]);

  const profileSaveDisabled = profileSaving || !profileChanged || Object.keys(profileValidation).length > 0;

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/';
  };

  const openProfileModal = () => {
    setProfileForm({
      name: userName(adminProfile),
      email: adminProfile.email || '',
      phone_number: userPhone(adminProfile),
    });
    setProfileErrors({});
    setProfileModalOpen(true);
  };

  const formatBackendErrors = (errors) => {
    if (!errors || typeof errors !== 'object') return {};
    return Object.entries(errors).reduce((acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value.join(' ') : String(value);
      return acc;
    }, {});
  };

  const saveProfile = async () => {
    if (profileSaveDisabled) return;

    setProfileSaving(true);
    setProfileErrors({});

    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone_number: profileForm.phone_number.trim(),
    };

    const response = await settingsService.updateAdminProfile(payload);

    if (response.ok && response.data) {
      setAdminProfile(response.data);
      setUser(response.data);
      setProfileModalOpen(false);
      showToast('Admin profile updated');
    } else {
      setProfileErrors(formatBackendErrors(response.errors));
      showToast(response.message || 'Unable to update admin profile.', 'error');
    }

    setProfileSaving(false);
  };

  const testApiConnection = async () => {
    setTestingApi(true);
    setApiStatus({ state: 'loading', message: 'Testing API connection...', data: null });

    try {
      const response = await settingsService.testApiConnection();
      if (!response.ok) {
        throw new Error(response.message || 'Unable to reach API.');
      }

      setApiStatus({
        state: 'success',
        message: response.message || 'API is reachable.',
        data: response.data || null,
      });
      showToast('API connection successful');
    } catch (error) {
      setApiStatus({
        state: 'error',
        message: error?.message || 'Unable to reach API.',
        data: null,
      });
      showToast(error?.message || 'Unable to reach API.', 'error');
    } finally {
      setTestingApi(false);
    }
  };

  const updatePreference = (field, value) => {
    setPreferences((current) => ({ ...current, [field]: value }));
  };

  const savePreferences = () => {
    localStorage.setItem(PREF_KEYS.pageSize, preferences.pageSize);
    localStorage.setItem(PREF_KEYS.compactTables, preferences.compactTables ? 'true' : 'false');
    localStorage.setItem(PREF_KEYS.autoRefresh, preferences.autoRefresh);
    showToast('Preferences saved locally');
  };

  return (
    <>
      <TopBar leftContent={<span style={{ fontSize: 14, fontWeight: 600, color: '#1b4d1c' }}>Settings</span>} />
      <div className="page-content">
        <div style={{ marginBottom: 16 }}>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Settings</h1>
          <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>Admin profile, session security, API status, and local workspace preferences.</p>
        </div>

        <div className="settings-grid">
          <div className="settings-column">
            <SettingsCard
              title="Admin Profile"
              action={<button className="btn btn-outline" type="button" style={{ fontSize: 12 }} onClick={openProfileModal}>Edit Profile</button>}
            >
              <div className="user-info-grid">
                <div className="user-info-item"><span>Display Name / Username</span><p>{profileLoading ? 'Loading...' : settingValue(userName(adminProfile))}</p></div>
                <div className="user-info-item"><span>Email</span><p>{settingValue(adminProfile.email)}</p></div>
                {userPhone(adminProfile) && <div className="user-info-item"><span>Phone</span><p>{userPhone(adminProfile)}</p></div>}
                <div className="user-info-item"><span>Role</span><p><Badge status={adminProfile.role || adminProfile.user_role || 'admin'} /></p></div>
                <div className="user-info-item"><span>User ID</span><p>{settingValue(adminProfile.id || adminProfile.user_id)}</p></div>
              </div>
            </SettingsCard>

            <SettingsCard
              title="Security"
              action={<button className="btn btn-danger" type="button" style={{ fontSize: 12 }} onClick={handleLogout}>Logout</button>}
            >
              <div className="user-info-grid">
                <div className="user-info-item"><span>Auth Method</span><p>JWT Bearer Token</p></div>
                <div className="user-info-item"><span>Session Status</span><p><Badge status="active" /></p></div>
                <div className="user-info-item"><span>Last Login</span><p>{settingValue(adminProfile.last_login || adminProfile.last_login_at)}</p></div>
                <div className="user-info-item"><span>Token Expiry</span><p>{settingValue(tokenExpiry)}</p></div>
              </div>
              <p className="settings-note">Password reset is handled through the OTP reset flow.</p>
            </SettingsCard>

            <SettingsCard
              title="Admin Preferences"
              action={<button className="btn btn-primary" type="button" style={{ fontSize: 12 }} onClick={savePreferences}>Save Preferences</button>}
            >
              <div className="settings-form-grid">
                <label>
                  <span>Default page size</span>
                  <select style={inputStyle} value={preferences.pageSize} onChange={(event) => updatePreference('pageSize', event.target.value)}>
                    <option value="10">10 rows</option>
                    <option value="20">20 rows</option>
                    <option value="50">50 rows</option>
                    <option value="100">100 rows</option>
                  </select>
                </label>
                <label>
                  <span>Auto-refresh interval</span>
                  <select style={inputStyle} value={preferences.autoRefresh} onChange={(event) => updatePreference('autoRefresh', event.target.value)}>
                    <option value="off">Off</option>
                    <option value="15">15s</option>
                    <option value="30">30s</option>
                    <option value="60">60s</option>
                  </select>
                </label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={preferences.compactTables}
                    onChange={(event) => updatePreference('compactTables', event.target.checked)}
                  />
                  <span>Compact table mode</span>
                </label>
              </div>
            </SettingsCard>
          </div>

          <div className="settings-column">
            <SettingsCard
              title="Backend API"
              action={<button className="btn btn-outline" type="button" style={{ fontSize: 12 }} onClick={testApiConnection} disabled={testingApi}>{testingApi ? 'Testing...' : 'Test API Connection'}</button>}
            >
              <div className="user-info-grid">
                <div className="user-info-item" style={{ gridColumn: '1 / -1' }}>
                  <span>API Base URL</span>
                  <p className="settings-mono">{API_BASE_URL}</p>
                </div>
                <div className="user-info-item"><span>Environment</span><p>{settingValue(apiStatus.data?.environment)}</p></div>
                <div className="user-info-item"><span>API Status</span><p><Badge status={apiStatus.state === 'success' ? 'active' : apiStatus.state === 'error' ? 'failed' : 'not_tested'} /></p></div>
                {apiStatus.data?.time && <div className="user-info-item"><span>Server Time</span><p>{apiStatus.data.time}</p></div>}
              </div>
              <div className={`settings-api-status settings-api-status--${apiStatus.state}`}>
                {apiStatus.message}
              </div>
            </SettingsCard>

            <SettingsCard title="App Info">
              <div className="user-info-grid">
                <div className="user-info-item"><span>Version</span><p>v1.0.4 Enterprise Admin</p></div>
                <div className="user-info-item"><span>Frontend</span><p>React + Vite</p></div>
                <div className="user-info-item"><span>Backend</span><p>FastAPI (Python)</p></div>
                <div className="user-info-item"><span>Auth</span><p>JWT Bearer Token</p></div>
              </div>
            </SettingsCard>
          </div>
        </div>
      </div>

      {profileModalOpen && (
        <ConfirmationModal
          title="Edit Admin Profile"
          message="Update the admin account details used by this session."
          onConfirm={saveProfile}
          onCancel={() => setProfileModalOpen(false)}
          confirmLabel="Save Profile"
          confirmDisabled={profileSaveDisabled}
          loading={profileSaving}
        >
          <div className="settings-form-grid" style={{ marginTop: 12 }}>
            <label>
              <span>Display Name / Username</span>
              <input style={inputStyle} value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
              {(profileErrors.name || profileValidation.name) && <small className="settings-field-error">{profileErrors.name || profileValidation.name}</small>}
            </label>
            <label>
              <span>Email</span>
              <input style={inputStyle} type="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} />
              {(profileErrors.email || profileValidation.email) && <small className="settings-field-error">{profileErrors.email || profileValidation.email}</small>}
            </label>
            <label>
              <span>Phone</span>
              <input style={inputStyle} value={profileForm.phone_number} onChange={(event) => setProfileForm({ ...profileForm, phone_number: event.target.value })} />
              {(profileErrors.phone_number || profileValidation.phone_number) && <small className="settings-field-error">{profileErrors.phone_number || profileValidation.phone_number}</small>}
            </label>
            {!profileChanged && <div className="settings-api-status settings-api-status--idle">No profile changes yet.</div>}
            {profileErrors.profile && <div className="settings-api-status settings-api-status--error">{profileErrors.profile}</div>}
          </div>
        </ConfirmationModal>
      )}

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
