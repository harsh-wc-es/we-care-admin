import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import logoImg from '../../assets/wecare-logo.png';

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
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const login = sessionStorage.getItem('wecare_reset_login') || '';
    setLoading(true); setError('');
    const res = await authService.verifyForgotPasswordOtp({ login, otp: otp.join('') });
    setLoading(false);
    if (res.success) {
      const resetToken = res.data?.password_reset_token || res.data?.reset_token || res.data?.token || '';
      if (!resetToken) {
        setError('OTP verified, but the reset token was missing. Please request a new OTP.');
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
    if (!login) { setError('Start forgot password again to resend OTP.'); return; }
    setResending(true);
    setError('');
    const res = await authService.forgotPassword(login);
    if (res.success) setCountdown(30);
    else setError(res.message || 'Unable to resend OTP.');
    setResending(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card-simple">
        <img src={logoImg} alt="WeCare Logo" className="auth-logo-sm" />
        <h1>Verify OTP</h1>
        <p>Enter the code sent to your device</p>
        <form onSubmit={handleVerify}>
          <div className="otp-container">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                className="otp-box"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#777', marginBottom: 16 }}>
            {countdown > 0 ? `Resend in ${countdown}s` : <button type="button" className="auth-link-green" style={{ cursor: 'pointer', border: 0, background: 'transparent' }} disabled={resending} onClick={handleResend}>{resending ? 'Resending...' : 'Resend OTP'}</button>}
          </p>
          {error && <p style={{ color: '#DC2626', fontSize: 12 }}>{error}</p>}
          <button className="auth-btn auth-btn-wide" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
        </form>
      </div>
    </div>
  );
}
