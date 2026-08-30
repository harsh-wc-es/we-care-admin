import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';
import logoImg from '../../assets/wecare-logo.png';
import './auth.css';

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
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const destination = location.state?.from || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter both your email/phone and password.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await authService.login(identifier.trim(), password);
    if (res.success) {
      navigate(destination, { replace: true });
    } else {
      const backendDetail = firstBackendError(res.errors);
      const message = res.message || 'Login failed. Check your credentials.';
      setError(backendDetail && backendDetail !== message ? `${message}: ${backendDetail}` : message);
    }
    setLoading(false);
  };

  return (
    <div className="simple-auth-page">
      {/* Top Header */}
      <div className="simple-auth-header">
        <Link to="/" title="WeCare">
          <img src={logoImg} alt="WeCare" className="simple-auth-logo" />
        </Link>
        <div className="simple-auth-badge">
          Admin Login
        </div>
      </div>

      {/* Main Simple Card */}
      <div className="simple-auth-card">
        <form className="simple-auth-form" onSubmit={handleLogin} noValidate>
          {/* Email / Phone input */}
          <div className="simple-input-wrapper">
            <input
              id="admin-identifier"
              className="simple-auth-input"
              placeholder="Email or Phone"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          {/* Password input with Eye Toggle */}
          <div className="simple-input-wrapper">
            <input
              id="admin-password"
              className="simple-auth-input"
              style={{ paddingRight: '48px' }}
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="simple-eye-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={19} aria-hidden="true" />
              ) : (
                <Eye size={19} aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Forgot Password link */}
          <div className="simple-auth-forgot-row">
            <Link to="/forgot-password" className="simple-forgot-link">
              Forgot Password?
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="simple-auth-error" role="alert">
              {error}
            </div>
          )}

          {/* Log In Button */}
          <button className="simple-auth-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
