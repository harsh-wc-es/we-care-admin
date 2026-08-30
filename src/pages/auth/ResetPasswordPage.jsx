import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';
import logoImg from '../../assets/wecare-logo.png';
import './auth.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!pw || !confirm) {
      setError('Please fill in both password fields.');
      return;
    }
    if (pw.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (pw !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const login = sessionStorage.getItem('wecare_reset_login') || '';
    const token = sessionStorage.getItem('wecare_reset_token') || '';
    setLoading(true);
    setError('');
    const res = await authService.resetPassword(login, token, pw, confirm);
    setLoading(false);
    if (res.success) {
      sessionStorage.removeItem('wecare_reset_login');
      sessionStorage.removeItem('wecare_reset_token');
      navigate('/login');
    } else {
      setError(res.message || 'Password reset failed.');
    }
  };

  return (
    <div className="simple-auth-page">
      <div className="simple-auth-header">
        <Link to="/" title="WeCare">
          <img src={logoImg} alt="WeCare" className="simple-auth-logo" />
        </Link>
        <div className="simple-auth-badge">
          Reset Password
        </div>
      </div>

      <div className="simple-auth-card">
        <form className="simple-auth-form" onSubmit={handleReset} noValidate>
          <div className="simple-input-wrapper">
            <input
              className="simple-auth-input"
              style={{ paddingRight: '48px' }}
              placeholder="New Password"
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="simple-eye-toggle"
              onClick={() => setShowPw((prev) => !prev)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          <div className="simple-input-wrapper">
            <input
              className="simple-auth-input"
              style={{ paddingRight: '48px' }}
              placeholder="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="simple-eye-toggle"
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {error && (
            <div className="simple-auth-error" role="alert">
              {error}
            </div>
          )}

          <button className="simple-auth-btn" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          <div className="simple-auth-forgot-row" style={{ justifyContent: 'center', marginTop: 8 }}>
            <Link to="/login" className="simple-forgot-link">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
