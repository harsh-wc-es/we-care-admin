import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import logoImg from '../../assets/wecare-logo.png';
import './auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!value.trim()) {
      setError('Please enter your email or phone.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await authService.forgotPassword(value.trim());
    setLoading(false);
    if (res.success) {
      sessionStorage.setItem('wecare_reset_login', value.trim());
      navigate('/verify-otp');
    } else {
      setError(res.message || 'Unable to send OTP.');
    }
  };

  return (
    <div className="simple-auth-page">
      <div className="simple-auth-header">
        <Link to="/" title="WeCare">
          <img src={logoImg} alt="WeCare" className="simple-auth-logo" />
        </Link>
        <div className="simple-auth-badge">
          Forgot Password
        </div>
      </div>

      <div className="simple-auth-card">
        <form className="simple-auth-form" onSubmit={handleSend} noValidate>
          <div className="simple-input-wrapper">
            <input
              className="simple-auth-input"
              placeholder="Email or Phone"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="simple-auth-error" role="alert">
              {error}
            </div>
          )}

          <button className="simple-auth-btn" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
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
