import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  BadgeCheck, 
  RefreshCw, 
  ReceiptText, 
  ChevronDown, 
  ArrowRight,
  FileText
} from 'lucide-react';

const SOP_PLAYBOOKS = [
  {
    id: 'sos',
    num: '01',
    title: 'Active SOS Crisis Alert Protocol',
    category: 'Critical Emergency',
    sla: '< 30s Action SLA',
    icon: ShieldAlert,
    steps: [
      { num: 1, title: 'Immediate Alarm Acknowledgment', text: 'Open /sos-alerts immediately upon audible high-priority alert trigger.' },
      { num: 2, title: 'Coordinate & Proximity Scan', text: 'Verify patient GPS coordinates, attending caregiver status, and primary family contact.' },
      { num: 3, title: 'Paramedic & Police Escalation', text: 'Click "Dispatch Emergency Paramedics" to transmit live location to nearest partner hospital.' },
      { num: 4, title: 'Telephonic Confirmation & Closure', text: 'Mark as "Resolved" only after direct telephonic confirmation and clinical incident log submission.' },
    ],
    route: '/sos-alerts',
    ctaText: 'Open SOS Desk',
  },
  {
    id: 'kyc',
    num: '02',
    title: 'Caregiver 5-Point KYC Approval',
    category: 'Workforce Onboarding',
    sla: '< 2h Verification SLA',
    icon: BadgeCheck,
    steps: [
      { num: 1, title: 'Document Integrity Check', text: 'Open /caregiver-verification to review Aadhaar UID and Police NOC clearance.' },
      { num: 2, title: 'Accreditation Validation', text: 'Cross-reference nursing council degree, elder care certificate, and past employment history.' },
      { num: 3, title: 'Skill Tier Designation', text: 'Assign qualification tier: General Attendant, Senior Nurse, ICU Specialist, or Dementia Care.' },
      { num: 4, title: '1-Click Authorization', text: 'Click "Approve & Activate" to authorize shifts on the Caretaker Mobile App.' },
    ],
    route: '/caregiver-verification',
    ctaText: 'Open KYC Desk',
  },
  {
    id: 'replacement',
    num: '03',
    title: '1-Click Standby Shift Reassignment',
    category: 'Workforce Dispatch',
    sla: '< 60s Reassignment SLA',
    icon: RefreshCw,
    steps: [
      { num: 1, title: 'Delay or Cancellation Detection', text: 'When a caregiver is delayed >15m or reports sick, navigate to /replacements.' },
      { num: 2, title: 'Proximity Candidate Review', text: 'System displays top nearest verified attendants with matching clinical skill tier.' },
      { num: 3, title: 'Instant Shift Handover', text: 'Click "Assign Replacement"—patient & new caregiver receive instant push notifications.' },
      { num: 4, title: 'Live Arrival Tracking', text: 'Monitor replacement caregiver arrival progress on the live GPS tracking map.' },
    ],
    route: '/replacements',
    ctaText: 'Open Replacements',
  },
  {
    id: 'refund',
    num: '04',
    title: 'Patient Dispute & Refund Arbitration',
    category: 'Financial Governance',
    sla: '< 24h Settlement SLA',
    icon: ReceiptText,
    steps: [
      { num: 1, title: 'Grievance Review', text: 'Open /admin/refunds to inspect dispute tickets, patient audio notes, and cancellation reasons.' },
      { num: 2, title: 'GPS Telemetry Audit', text: 'Cross-check caregiver check-in timestamps and GPS geofence logs for shift completion verification.' },
      { num: 3, title: 'Refund Arbitration', text: 'Select "Full Refund" or "Prorated Refund" based on platform policy and attendant fault score.' },
      { num: 4, title: 'Ledger Balancing & Disbursal', text: 'Click "Approve & Disburse" for direct bank gateway transfer and automated reconciliation.' },
    ],
    route: '/admin/refunds',
    ctaText: 'Open Refund Desk',
  },
];

export default function Playbooks() {
  const navigate = useNavigate();
  const [expandedSops, setExpandedSops] = useState({
    sos: true,
    kyc: false,
    replacement: false,
    refund: false,
  });

  const toggleSop = (id) => {
    setExpandedSops((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="wecare-section" id="playbooks">
      <div className="wecare-container">
        <div className="wecare-section-header">
          <div className="wecare-eyebrow">
            <FileText size={13} />
            <span>ADMINISTRATIVE SOPS</span>
          </div>
          <h2 className="wecare-section-title">Operational Playbooks</h2>
          <p className="wecare-section-desc">
            Standardized protocols ensuring every critical emergency, workforce approval, and dispute resolution follows auditable healthcare compliance guidelines.
          </p>
        </div>

        <div className="wecare-playbooks-grid">
          {SOP_PLAYBOOKS.map((sop) => {
            const Icon = sop.icon;
            const isExpanded = Boolean(expandedSops[sop.id]);

            return (
              <div key={sop.id} className="wecare-sop-card">
                <div
                  className="wecare-sop-header"
                  onClick={() => toggleSop(sop.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="wecare-sop-left">
                    <div className="wecare-sop-icon-wrap">
                      <Icon size={18} />
                    </div>
                    <div className="wecare-sop-info">
                      <div className="wecare-sop-meta">
                        <span className="wecare-sop-cat">{sop.category}</span>
                        <span className="wecare-sop-sla">• {sop.sla}</span>
                      </div>
                      <h4 className="wecare-sop-title">{sop.title}</h4>
                    </div>
                  </div>

                  <ChevronDown
                    size={18}
                    className={`wecare-sop-toggle-btn ${isExpanded ? 'expanded' : ''}`}
                  />
                </div>

                {isExpanded && (
                  <div className="wecare-sop-body">
                    <ol className="wecare-sop-steps">
                      {sop.steps.map((st) => (
                        <li key={st.num} className="wecare-sop-step-item">
                          <span className="wecare-sop-step-badge">{st.num}</span>
                          <div className="wecare-sop-step-text">
                            <strong>{st.title}:</strong> {st.text}
                          </div>
                        </li>
                      ))}
                    </ol>

                    <div className="wecare-sop-footer">
                      <button
                        type="button"
                        className="wc-btn wc-btn-secondary"
                        onClick={() => navigate(sop.route)}
                      >
                        {sop.ctaText} <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
