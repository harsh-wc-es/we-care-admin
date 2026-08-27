import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Activity,
  BellRing,
  MessageSquareWarning,
  RefreshCw,
  BadgeCheck,
  UserRoundCheck,
  Users,
  BadgeDollarSign,
  CircleDollarSign,
  ReceiptText,
  Send,
  Settings,
} from 'lucide-react';
import logoImg from '../assets/wecare-logo.png';
import { authService } from '../services/authService';

const sections = [
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Bookings', path: '/bookings', icon: CalendarCheck },
      { label: 'Active Visits', path: '/live-tracking', icon: Activity },
      { label: 'SOS Alerts', path: '/sos-alerts', icon: BellRing },
      { label: 'Complaints', path: '/complaints', icon: MessageSquareWarning },
      { label: 'Replacements', path: '/replacements', icon: RefreshCw },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      { label: 'Caretaker Verification', path: '/caregiver-verification', icon: BadgeCheck },
      { label: 'Caretakers', path: '/caregivers', icon: UserRoundCheck },
      { label: 'Users', path: '/users', icon: Users },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Pricing Tiers', path: '/pricing', icon: BadgeDollarSign },
      { label: 'Earnings', path: '/earnings', icon: CircleDollarSign },
      { label: 'Refunds', path: '/admin/refunds', icon: ReceiptText },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Push Notifications', path: '/notifications', icon: Send },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen = false, onNavigate }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    onNavigate?.();
    navigate('/');
  };

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`} aria-label="Admin navigation">
      <div className="sidebar-logo">
        <img src={logoImg} alt="WeCare" className="sidebar-logo-img" />
        <button type="button" className="sidebar-close" aria-label="Close navigation menu" onClick={onNavigate}>
          X
        </button>
      </div>
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.title} className="sidebar-section">
            <span className="sidebar-section-title">{section.title}</span>
            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  onClick={onNavigate}
                >
                  <span className="sidebar-link-icon">
                    <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="sidebar-link-label">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
