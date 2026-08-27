import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import logoImg from '../../assets/wecare-logo.png';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (pw !== confirm) { setError('Passwords do not match.'); return; }
    const login = sessionStorage.getItem('wecare_reset_login') || '';
    const token = sessionStorage.getItem('wecare_reset_token') || '';
    setLoading(true); setError('');
    const res = await authService.resetPassword(login, token, pw, confirm);
    setLoading(false);
    if (res.success) {
      sessionStorage.removeItem('wecare_reset_login');
      sessionStorage.removeItem('wecare_reset_token');
      navigate('/');
    } else {
      setError(res.message || 'Password reset failed.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-simple">
        <img src={logoImg} alt="WeCare Logo" className="auth-logo-sm" />
        <h1>Reset Password</h1>
        <p>Create a new password</p>
        <form onSubmit={handleReset}>
          <input className="auth-input auth-input-wide" placeholder="New Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <input className="auth-input auth-input-wide" placeholder="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p style={{ color: '#DC2626', fontSize: 12 }}>{error}</p>}
          <button className="auth-btn auth-btn-wide" type="submit" style={{ marginTop: 8 }} disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}
