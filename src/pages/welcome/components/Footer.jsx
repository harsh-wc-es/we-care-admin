import { Link } from 'react-router-dom';
import logoImg from '../../../assets/wecare-logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="wecare-footer">
      <div className="wecare-container wecare-footer-inner">
        <div className="wecare-footer-brand">
          <img src={logoImg} alt="WeCare Logo" className="wecare-footer-logo" />
          <p className="wecare-footer-copy">
            &copy; {currentYear} WeCare Healthcare Operations Inc. Enterprise Platform.
          </p>
        </div>

        <nav className="wecare-footer-nav" aria-label="Footer Navigation">
          <a href="#overview" onClick={scrollTo('overview')}>Overview</a>
          <a href="#capabilities" onClick={scrollTo('capabilities')}>Capabilities</a>
          <a href="#operations" onClick={scrollTo('operations')}>Operations</a>
          <a href="#simulator" onClick={scrollTo('simulator')}>Simulator</a>
          <a href="#playbooks" onClick={scrollTo('playbooks')}>Playbooks</a>
          <a href="#modules" onClick={scrollTo('modules')}>Modules</a>
          <Link to="/settings">Settings</Link>
        </nav>
      </div>
    </footer>
  );
}
