import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assets/wecare-logo.png';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="auth-page">
      <img src={logoImg} alt="WeCare Logo" className="auth-logo" />
      <div className="auth-title-bar">
        <h1>Create Account</h1>
      </div>
      <div className="auth-card">
        <form onSubmit={handleSignup} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{fontSize:12,color:'#DC2626',margin:'0 0 10px'}}>Admin signup is not enabled for production.</p>
          <input className="auth-input" placeholder="Full Name" value={form.name} onChange={update('name')} />
          <input className="auth-input" placeholder="Email Address" type="email" value={form.email} onChange={update('email')} />
          <input className="auth-input" placeholder="Phone Number" value={form.phone} onChange={update('phone')} />
          <input className="auth-input" placeholder="Password" type="password" value={form.password} onChange={update('password')} />
          <input className="auth-input" placeholder="Confirm Password" type="password" value={form.confirm} onChange={update('confirm')} />
          <button className="auth-btn" type="submit">Sign Up</button>
        </form>
      </div>
    </div>
  );
}
