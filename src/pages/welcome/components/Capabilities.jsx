import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  BadgeCheck, 
  CalendarCheck, 
  CircleDollarSign, 
  MessageSquareWarning, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  ChevronRight
} from 'lucide-react';

const DOMAIN_CAPABILITIES = [
  {
    id: 'live_ops',
    title: 'Live Telemetry & Emergency SOS Radar',
    category: 'Real-Time Operations',
    icon: Activity,
    shortDesc: 'Continuous GPS telemetry, geofence radius breach alerts, and 24/7 audible SOS panic dispatch.',
    kpis: [
      { label: 'Active In-Home Visits', value: '84' },
      { label: 'SOS Response SLA', value: '< 30s' },
      { label: 'Geofence Integrity', value: '100%' },
    ],
    checklist: [
      'Monitor caregiver route progress and check-in / check-out timestamps live',
      'Trigger 1-click paramedic & police escalation with real-time emergency coordinates',
      'Automated geofencing alert if caregiver leaves patient residence prematurely',
      'High-priority audio dispatch alarms across all authorized admin terminals',
    ],
    route: '/live-tracking',
    actionText: 'Launch Live Tracking HUD',
  },
  {
    id: 'verification',
    title: '5-Step Caregiver KYC & Accreditation',
    category: 'Trust & Verification',
    icon: BadgeCheck,
    shortDesc: 'Strict clinical gatekeeping ensuring only 100% verified, police-cleared, and nursing-accredited caretakers enter homes.',
    kpis: [
      { label: 'Pending KYC Queue', value: '12' },
      { label: 'Verified Rate', value: '100%' },
      { label: 'Trust Index', value: '99.8%' },
    ],
    checklist: [
      'Inspect Aadhaar/Government ID, Police NOC, and clinical credentials',
      'Assign caretaker skill tier: Junior, Senior Attendant, ICU Specialist, Dementia Care',
      '1-Click Approve, Reject with rationale, or Request Document Re-upload',
      'Instant sync with Caretaker Mobile App dispatch authorization pool',
    ],
    route: '/caregiver-verification',
    actionText: 'Open Verification Desk',
  },
  {
    id: 'workforce',
    title: 'Workforce Dispatch & Standby Replacements',
    category: 'Workforce Management',
    icon: CalendarCheck,
    shortDesc: 'Full lifecycle orchestration of on-demand, 12h/24h shifts, with automated standby proximity matching.',
    kpis: [
      { label: 'Monthly Shifts', value: '1,280+' },
      { label: 'Standby Match SLA', value: '< 45s' },
      { label: 'Shift Completion', value: '99.2%' },
    ],
    checklist: [
      'Manage on-demand, 12h day-shift, 12h night-shift, and long-term care plans',
      '1-Click Emergency Replacement if a caregiver reports unwell or delayed >15m',
      'Smart proximity matching allocating nearest qualified standby attendant',
      'Shift extensions, caregiver reassignment, and patient care note updates',
    ],
    route: '/bookings',
    actionText: 'Manage Bookings & Shifts',
  },
  {
    id: 'finance',
    title: 'Dynamic Pricing & Financial Ledger',
    category: 'Financial Engine',
    icon: CircleDollarSign,
    shortDesc: 'Automated platform commission splits (80/20), batch caregiver payouts, and dispute refunds.',
    kpis: [
      { label: 'Gross Booking Value', value: '₹24.8L' },
      { label: 'Commission Retained', value: '20%' },
      { label: 'Disbursement Channel', value: 'Direct Bank' },
    ],
    checklist: [
      'Configure base rates for hourly, 12h, 24h shifts, and specialized ICU nursing',
      'Apply dynamic surge multipliers for weekend, festival, and high-demand zones',
      'Approve automated direct bank payouts with 1-click batch disbursement',
      'Multi-stage refund arbitration with automated bank ledger synchronization',
    ],
    route: '/pricing',
    actionText: 'Configure Pricing Tiers',
  },
  {
    id: 'quality',
    title: 'Clinical SLA & Grievance Arbitration',
    category: 'Quality Assurance',
    icon: MessageSquareWarning,
    shortDesc: 'Structured complaint ticketing with strict clinical SLA enforcement and caregiver penalty indexing.',
    kpis: [
      { label: 'Open Grievances', value: '2' },
      { label: 'SLA Resolution Rate', value: '99.4%' },
      { label: 'Family CSAT', value: '4.92/5' },
    ],
    checklist: [
      'Severity-graded grievance tickets (Critical Medical, Conduct, Delay, Billing)',
      'Arbitrate caregiver penalties and mandatory retraining flags',
      'Review patient family feedback, audio notes, and photographic evidence',
      'Temporary suspension and blacklisting controls for serious policy breaches',
    ],
    route: '/complaints',
    actionText: 'Review Grievance Queue',
  },
  {
    id: 'governance',
    title: 'Targeted Broadcasts & Security Audit',
    category: 'Governance & Security',
    icon: Send,
    shortDesc: 'Direct mass push communications to patients and caregivers with immutable audit logging and RBAC.',
    kpis: [
      { label: 'Broadcasts Sent', value: '42k+' },
      { label: 'Audit Trail Logs', value: '184k' },
      { label: 'Security Standard', value: 'AES-256' },
    ],
    checklist: [
      'Send targeted push notifications by user type, city zone, or caregiver tier',
      'Complete immutable audit trail of every admin decision with timestamp and ID',
      'Feature flags, platform maintenance toggles, and emergency hotlines',
      'Fine-grained sub-admin permissions and operational role management',
    ],
    route: '/notifications',
    actionText: 'Dispatch Broadcasts',
  },
];

export default function Capabilities() {
  const navigate = useNavigate();
  const [selectedDomainId, setSelectedDomainId] = useState(DOMAIN_CAPABILITIES[0].id);

  const selectedDomain = DOMAIN_CAPABILITIES.find((d) => d.id === selectedDomainId) || DOMAIN_CAPABILITIES[0];
  const FeaturedIcon = selectedDomain.icon;

  return (
    <section className="wecare-section wecare-section-alt" id="capabilities">
      <div className="wecare-container">
        <div className="wecare-section-header">
          <div className="wecare-eyebrow">
            <Shield size={13} />
            <span>OPERATIONAL DOMAINS</span>
          </div>
          <h2 className="wecare-section-title">Everything critical, connected.</h2>
          <p className="wecare-section-desc">
            Organized across six specialized governance pillars, WeCare enables administrators to oversee clinical safety, dispatch velocity, and financial integrity without tool fragmentation.
          </p>
        </div>

        <div className="wecare-capabilities-layout">
          {/* Left: Featured Interactive Inspector */}
          <div className="wecare-cap-featured">
            <div className="wecare-cap-featured-top">
              <div className="wecare-cap-icon-box">
                <FeaturedIcon size={22} />
              </div>
              <span className="wc-badge wc-badge-green" style={{ marginBottom: '12px' }}>
                {selectedDomain.category}
              </span>
              <h3 className="wecare-cap-featured-title">{selectedDomain.title}</h3>
              <p className="wecare-cap-featured-desc">{selectedDomain.shortDesc}</p>

              {/* KPI Strip */}
              <div className="wecare-cap-kpi-row">
                {selectedDomain.kpis.map((kpi, idx) => (
                  <div key={idx} className="wecare-cap-kpi-item">
                    <span className="wecare-cap-kpi-val">{kpi.value}</span>
                    <span className="wecare-cap-kpi-lbl">{kpi.label}</span>
                  </div>
                ))}
              </div>

              {/* Action Checklist */}
              <div className="wecare-cap-checklist">
                {selectedDomain.checklist.map((item, idx) => (
                  <div key={idx} className="wecare-cap-check-item">
                    <CheckCircle2 size={16} className="wecare-cap-check-icon" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="wc-btn wc-btn-primary"
              onClick={() => navigate(selectedDomain.route)}
            >
              {selectedDomain.actionText} <ArrowRight size={14} />
            </button>
          </div>

          {/* Right: Domain Selector Stack */}
          <div className="wecare-cap-stack">
            {DOMAIN_CAPABILITIES.map((domain) => {
              const Icon = domain.icon;
              const isSelected = domain.id === selectedDomainId;

              return (
                <div
                  key={domain.id}
                  className={`wecare-cap-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedDomainId(domain.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="wecare-cap-item-head">
                    <div className="wecare-cap-item-left">
                      <div className="wecare-cap-item-icon">
                        <Icon size={18} />
                      </div>
                      <h4 className="wecare-cap-item-title">{domain.title}</h4>
                    </div>
                    <ChevronRight size={16} className="wecare-cap-item-arrow" />
                  </div>
                  <p className="wecare-cap-item-desc">{domain.shortDesc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
