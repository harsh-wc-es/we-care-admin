import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Lock, Menu, X } from 'lucide-react';
import logoImg from '../../../assets/wecare-logo.png';

export default function Navbar({ isLoggedIn, currentUser, onOpenAuthModal }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="wecare-navbar-wrap">
      <div className="wecare-container wecare-navbar">
        <div 
          className="wecare-nav-brand" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          role="button"
          tabIndex={0}
        >
          <img src={logoImg} alt="WeCare Healthcare Logo" className="wecare-nav-logo" />
          <div className="wecare-brand-label">
            <span className="wecare-brand-name">WeCare</span>
            <span className="wecare-brand-sub">Healthcare Operations</span>
          </div>
        </div>

        <nav className="wecare-nav-links" aria-label="Main Navigation">
          <a href="#overview" className="wecare-nav-item" onClick={(e) => handleNavClick(e, 'overview')}>Overview</a>
          <a href="#capabilities" className="wecare-nav-item" onClick={(e) => handleNavClick(e, 'capabilities')}>Capabilities</a>
          <a href="#operations" className="wecare-nav-item" onClick={(e) => handleNavClick(e, 'operations')}>Operations</a>
          <a href="#simulator" className="wecare-nav-item" onClick={(e) => handleNavClick(e, 'simulator')}>Simulator</a>
          <a href="#playbooks" className="wecare-nav-item" onClick={(e) => handleNavClick(e, 'playbooks')}>Playbooks</a>
          <a href="#modules" className="wecare-nav-item" onClick={(e) => handleNavClick(e, 'modules')}>Modules</a>
        </nav>

        <div className="wecare-nav-actions">
          {isLoggedIn ? (
            <button
              type="button"
              className="wc-btn wc-btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard size={15} /> Open Admin Console <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="wc-btn wc-btn-ghost"
                onClick={onOpenAuthModal}
              >
                <Lock size={14} /> Sign In
              </button>
              <button
                type="button"
                className="wc-btn wc-btn-primary"
                onClick={() => navigate('/login')}
              >
                Open Admin <ArrowRight size={14} />
              </button>
            </>
          )}

          <button
            type="button"
            className="wecare-nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`wecare-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#overview" onClick={(e) => handleNavClick(e, 'overview')}>Overview</a>
        <a href="#capabilities" onClick={(e) => handleNavClick(e, 'capabilities')}>Capabilities</a>
        <a href="#operations" onClick={(e) => handleNavClick(e, 'operations')}>Operations Flow</a>
        <a href="#simulator" onClick={(e) => handleNavClick(e, 'simulator')}>Live Simulator</a>
        <a href="#playbooks" onClick={(e) => handleNavClick(e, 'playbooks')}>Playbooks</a>
        <a href="#modules" onClick={(e) => handleNavClick(e, 'modules')}>Admin Modules</a>
        <div style={{ paddingTop: '8px' }}>
          {isLoggedIn ? (
            <button
              type="button"
              className="wc-btn wc-btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
            >
              <LayoutDashboard size={15} /> Dashboard ({currentUser?.name || 'Admin'})
            </button>
          ) : (
            <button
              type="button"
              className="wc-btn wc-btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
            >
              Sign In to Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
