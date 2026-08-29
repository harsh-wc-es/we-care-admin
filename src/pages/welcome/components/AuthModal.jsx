import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, AlertTriangle, KeyRound, Lock, ArrowRight } from 'lucide-react';
import logoImg from '../../../assets/wecare-logo.png';
import { authService } from '../../../services/authService';

export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      setAuthError('Admin email/phone and password are required.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await authService.login(loginIdentifier, loginPassword);
      if (res.success) {
        onClose();
        navigate('/dashboard');
      } else {
        setAuthError(res.message || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setAuthError('Connection error. Check network or backend status.');
    } finally {
      setAuthLoading(false);
    }
  };

  const autofillDemo = () => {
    setLoginIdentifier('admin@wecare.com');
    setLoginPassword('Admin@123456');
    setAuthError('');
  };

  return (
    <div className="wecare-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="wecare-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="wecare-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="wecare-modal-head">
          <img src={logoImg} alt="WeCare" className="wecare-modal-logo" />
          <h2 className="wecare-modal-title">Admin Console Access</h2>
          <p className="wecare-modal-desc">Enter your administrative credentials to launch session</p>
        </div>

        <form onSubmit={handleQuickLogin} className="wecare-modal-form">
          <div className="wecare-form-group">
            <label className="wecare-form-label">Email or Phone</label>
            <input
              type="text"
              className="wecare-form-input"
              placeholder="admin@wecare.com"
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="wecare-form-group">
            <div className="wecare-form-label-row">
              <label className="wecare-form-label">Password</label>
              <button
                type="button"
                className="wecare-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="wecare-form-input"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {authError && (
            <div className="wecare-form-alert">
              <AlertTriangle size={15} />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="wc-btn wc-btn-primary wc-btn-lg"
            style={{ width: '100%' }}
            disabled={authLoading}
          >
            {authLoading ? 'Authenticating...' : 'Sign In to Console'}
          </button>

          <div className="wecare-modal-divider">
            <span>or demo access</span>
          </div>

          <button
            type="button"
            className="wecare-btn-demo"
            onClick={autofillDemo}
          >
            <KeyRound size={14} /> Autofill Demo Account (admin@wecare.com)
          </button>

          <div className="wecare-modal-foot">
            <Link to="/forgot-password" onClick={onClose}>
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
