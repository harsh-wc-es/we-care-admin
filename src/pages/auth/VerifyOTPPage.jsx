import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import logoImg from '../../assets/wecare-logo.png';
import './auth.css';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    const timer = countdown > 0 && setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // If user pastes multi-digit code
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length > 0) {
        const newOtp = [...otp];
        digits.forEach((d, i) => {
          if (index + i < 6) newOtp[index + i] = d;
        });
        setOtp(newOtp);
        const nextIdx = Math.min(index + digits.length, 5);
        refs.current[nextIdx]?.focus();
      }
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const login = sessionStorage.getItem('wecare_reset_login') || '';
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await authService.verifyForgotPasswordOtp({ login, otp: fullOtp });
    setLoading(false);
    if (res.success) {
      const resetToken = res.data?.password_reset_token || res.data?.reset_token || res.data?.token || '';
      if (!resetToken) {
        setError('OTP verified, but reset token was missing. Please request a new OTP.');
        return;
      }
      sessionStorage.setItem('wecare_reset_token', resetToken);
      navigate('/reset-password');
    } else {
      setError(res.message || 'OTP verification failed.');
    }
  };

  const handleResend = async () => {
    const login = sessionStorage.getItem('wecare_reset_login') || '';
    if (!login) {
      setError('Session expired. Start forgot password again.');
      return;
    }
    setResending(true);
    setError('');
    const res = await authService.forgotPassword(login);
    if (res.success) {
      setCountdown(30);
    } else {
      setError(res.message || 'Unable to resend OTP.');
    }
    setResending(false);
  };

  return (
    <div className="simple-auth-page">
      <div className="simple-auth-header">
        <Link to="/" title="WeCare">
          <img src={logoImg} alt="WeCare" className="simple-auth-logo" />
        </Link>
        <div className="simple-auth-badge">
          Verify OTP
        </div>
      </div>

      <div className="simple-auth-card">
        <form className="simple-auth-form" onSubmit={handleVerify} noValidate>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '8px 0 14px' }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                style={{
                  width: 44,
                  height: 48,
                  borderRadius: 10,
                  border: '1.5px solid transparent',
                  background: '#E6F1E3',
                  fontSize: 20,
                  fontWeight: 700,
                  textAlign: 'center',
                  color: '#1F2937',
                  outline: 'none',
                }}
                maxLength={1}
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
            {countdown > 0 ? (
              <span>Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                style={{
                  color: '#1F5A29',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 0,
                  background: 'transparent',
                }}
                disabled={resending}
                onClick={handleResend}
              >
                {resending ? 'Resending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          {error && (
            <div className="simple-auth-error" role="alert">
              {error}
            </div>
          )}

          <button className="simple-auth-btn" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="simple-auth-forgot-row" style={{ justifyContent: 'center', marginTop: 8 }}>
            <Link to="/forgot-password" className="simple-forgot-link">
              Change Email/Phone
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
