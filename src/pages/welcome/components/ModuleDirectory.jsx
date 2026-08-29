import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  BellRing, 
  BadgeCheck, 
  UserRoundCheck, 
  Users, 
  CalendarCheck, 
  RefreshCw, 
  MessageSquareWarning, 
  BadgeDollarSign, 
  CircleDollarSign, 
  ReceiptText, 
  Send, 
  Settings,
  Search,
  ArrowRight,
  Layers
} from 'lucide-react';

const MODULES_CONFIG = [
  {
    domain: 'Operations',
    modules: [
      { name: 'Operations Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Overview', desc: 'KPI counters, real-time revenue stats, active alerts, and immediate actions.' },
      { name: 'Active Visits & Telemetry', path: '/live-tracking', icon: Activity, category: 'Live Ops', desc: 'Real-time GPS coordinates, route maps, check-in timestamps, and geofence tracking.' },
      { name: 'SOS Panic Alerts', path: '/sos-alerts', icon: BellRing, category: 'Emergency', desc: 'Distress triggers with emergency paramedic dispatch and family notification.' },
    ],
  },
  {
    domain: 'Workforce',
    modules: [
      { name: 'Caretaker Verification', path: '/caregiver-verification', icon: BadgeCheck, category: 'Workforce', desc: 'KYC review: Aadhaar, Police NOC, nursing degrees, and approval desk.' },
      { name: 'Caretakers Directory', path: '/caregivers', icon: UserRoundCheck, category: 'Workforce', desc: 'Manage registered caregiver profiles, ratings, availability, and active status.' },
      { name: 'Replacements Desk', path: '/replacements', icon: RefreshCw, category: 'Bookings', desc: '1-Click emergency replacement dispatch when assigned caregivers cancel or delay.' },
    ],
  },
  {
    domain: 'Patients & Bookings',
    modules: [
      { name: 'Patient Directory', path: '/users', icon: Users, category: 'Patients', desc: 'Patient records, clinical profiles, emergency contacts, and care histories.' },
      { name: 'Bookings Management', path: '/bookings', icon: CalendarCheck, category: 'Bookings', desc: 'Full lifecycle booking tracker for hourly, day, and 24/7 care shifts.' },
      { name: 'Disputes & Complaints', path: '/complaints', icon: MessageSquareWarning, category: 'Quality', desc: 'Customer grievances, clinical SLA resolution, and attendant penalty arbitration.' },
    ],
  },
  {
    domain: 'Finance',
    modules: [
      { name: 'Pricing Tiers Config', path: '/pricing', icon: BadgeDollarSign, category: 'Finance', desc: 'Base rates, hourly tiers, ICU nursing rates, and dynamic surge multipliers.' },
      { name: 'Revenue & Earnings', path: '/earnings', icon: CircleDollarSign, category: 'Finance', desc: 'Gross booking volume, 20% platform commission, and payout ledger breakdowns.' },
      { name: 'Refunds Management', path: '/admin/refunds', icon: ReceiptText, category: 'Finance', desc: 'Multi-stage refund approvals and automatic bank balance reconciliation.' },
    ],
  },
  {
    domain: 'System & Governance',
    modules: [
      { name: 'Push Broadcasts', path: '/notifications', icon: Send, category: 'System', desc: 'Send targeted push broadcasts to patients or attendants by city zone.' },
      { name: 'System Settings', path: '/settings', icon: Settings, category: 'System', desc: 'Platform configuration, emergency hotlines, and security credentials.' },
    ],
  },
];

export default function ModuleDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');

  const filteredDomainGroups = useMemo(() => {
    return MODULES_CONFIG.map((group) => {
      const isDomainMatch = selectedDomain === 'All' || group.domain === selectedDomain;
      if (!isDomainMatch) return null;

      const filteredModules = group.modules.filter((m) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          m.name.toLowerCase().includes(query) ||
          m.desc.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query) ||
          group.domain.toLowerCase().includes(query)
        );
      });

      if (filteredModules.length === 0) return null;

      return {
        ...group,
        modules: filteredModules,
      };
    }).filter(Boolean);
  }, [searchQuery, selectedDomain]);

  return (
    <section className="wecare-section wecare-section-alt" id="modules">
      <div className="wecare-container">
        <div className="wecare-section-header">
          <div className="wecare-eyebrow">
            <Layers size={13} />
            <span>ADMIN MODULE LAUNCHER</span>
          </div>
          <h2 className="wecare-section-title">Direct access to all 14 admin modules.</h2>
          <p className="wecare-section-desc">
            Jump directly into any dedicated operations desk across field tracking, caregiver verification, financial ledgers, and platform governance.
          </p>
        </div>

        {/* Toolbar: Search and Filter Pills */}
        <div className="wecare-modules-toolbar">
          <div className="wecare-search-input-wrap">
            <Search size={15} className="wecare-search-icon" />
            <input
              type="text"
              className="wecare-search-field"
              placeholder="Filter modules by name or function..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="wecare-category-filters">
            {['All', 'Operations', 'Workforce', 'Patients & Bookings', 'Finance', 'System & Governance'].map((domain) => (
              <button
                key={domain}
                type="button"
                className={`wecare-filter-pill ${selectedDomain === domain ? 'active' : ''}`}
                onClick={() => setSelectedDomain(domain)}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped Module Rows */}
        <div className="wecare-module-domains">
          {filteredDomainGroups.length > 0 ? (
            filteredDomainGroups.map((group) => (
              <div key={group.domain} className="wecare-domain-section">
                <div className="wecare-domain-head">
                  <span className="wecare-domain-tag">{group.domain}</span>
                  <span className="wecare-domain-count">({group.modules.length} {group.modules.length === 1 ? 'module' : 'modules'})</span>
                </div>

                <div className="wecare-modules-row-grid">
                  {group.modules.map((m) => {
                    const Icon = m.icon;
                    return (
                      <Link key={m.path} to={m.path} className="wecare-module-tile">
                        <div className="wecare-module-tile-icon">
                          <Icon size={18} />
                        </div>
                        <div className="wecare-module-tile-content">
                          <h4 className="wecare-module-tile-title">
                            <span>{m.name}</span>
                            <ArrowRight size={14} className="wecare-module-tile-arrow" />
                          </h4>
                          <p className="wecare-module-tile-desc">{m.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="wecare-no-modules">
              <p>No administrative modules match &quot;{searchQuery}&quot;.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
