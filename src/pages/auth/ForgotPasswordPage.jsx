import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import logoImg from '../../assets/wecare-logo.png';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!value) { setError('Email or phone is required.'); return; }
    setLoading(true); setError('');
    const res = await authService.forgotPassword(value);
    setLoading(false);
    if (res.success) {
      sessionStorage.setItem('wecare_reset_login', value);
      navigate('/verify-otp');
    } else {
      setError(res.message || 'Unable to send OTP.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-simple">
        <img src={logoImg} alt="WeCare Logo" className="auth-logo-sm" />
        <h1>Forgot Password</h1>
        <p>Enter your email or phone to receive OTP</p>
        <form onSubmit={handleSend}>
          <input className="auth-input auth-input-wide" placeholder="Email or Phone" value={value} onChange={(e) => setValue(e.target.value)} />
          {error && <p style={{ color: '#DC2626', fontSize: 12 }}>{error}</p>}
          <button className="auth-btn auth-btn-wide" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
        </form>
      </div>
    </div>
  );
}
