import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('mobile-nav-open', sidebarOpen);
    return () => document.body.classList.remove('mobile-nav-open');
  }, [sidebarOpen]);

  return (
    <div className="app-layout">
      <div className="mobile-app-header">
        <button
          type="button"
          className="mobile-menu-button"
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <span className="mobile-app-header__title">WeCare Admin</span>
      </div>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Outlet />
      </div>
    </div>
  );
}
