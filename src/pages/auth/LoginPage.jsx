import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import logoImg from '../../assets/wecare-logo.png';

function firstBackendError(errors) {
  if (!errors || typeof errors !== 'object') return '';

  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && value[0]) return String(value[0]);
    if (typeof value === 'string' && value) return value;
  }

  return '';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    setError('');
    const res = await authService.login(identifier, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      const backendDetail = firstBackendError(res.errors);
      const message = res.message || 'Login failed. Check your credentials.';
      setError(backendDetail && backendDetail !== message ? `${message}: ${backendDetail}` : message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <img src={logoImg} alt="WeCare Logo" className="auth-logo" />
      <div className="auth-title-bar">
        <h1>Admin Login</h1>
      </div>
      <div className="auth-card">
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <input
            className="auth-input"
            placeholder="Email or Phone"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
          <input
            className="auth-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && (
            <div style={{ width: '100%', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: 13, padding: '8px 12px', marginBottom: 10, fontWeight: 500 }}>
              {error}
            </div>
          )}
          <div className="auth-forgot">
            <span className="auth-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
