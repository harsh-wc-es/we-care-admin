import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ShieldCheck, 
  MapPin, 
  BellRing, 
  CircleDollarSign, 
  ArrowRight,
  Workflow
} from 'lucide-react';

const PIPELINE_STAGES = [
  {
    stage: '01',
    title: 'Patient Request Ingestion',
    icon: Users,
    role: 'Patient Mobile App → Bookings Engine',
    desc: 'Families schedule hourly care, 12h shifts, or 24/7 post-operative nursing. Requests stream instantly into the Admin queue with clinical triage requirements.',
    payload: {
      event: 'BOOKING_CREATED',
      patient_id: 'PT-4491',
      care_tier: 'ICU_TRAINED_NURSE',
      duration: '12_HOURS_DAY',
      special_notes: 'Post-cardiac surgery assistance, BP monitoring',
    },
    sla: '< 15s Routing',
  },
  {
    stage: '02',
    title: '5-Point KYC & Clearance',
    icon: ShieldCheck,
    role: 'Verification Desk → Caregiver App',
    desc: 'Admins verify Aadhaar identity, Police NOC, nursing degrees, and interview logs. Dispatch privileges are unlocked only upon 100% verified compliance.',
    payload: {
      event: 'KYC_VERIFIED',
      caregiver_id: 'CG-8812',
      aadhaar_status: 'CONFIRMED',
      police_clearance: 'VALID_CLEARED',
      qualification_tier: 'SENIOR_ICU_NURSE',
    },
    sla: '< 2h Turnaround',
  },
  {
    stage: '03',
    title: 'Real-Time Telemetry & GPS',
    icon: MapPin,
    role: 'Live GPS Fleet HUD → Geofence Engine',
    desc: 'Caregivers check in via GPS upon reaching the patient residence. Admin live radar tracks route telemetry, on-premises duration, and geofence integrity.',
    payload: {
      event: 'GEOFENCE_CHECKIN',
      coordinates: '28.6139° N, 77.2090° E',
      geofence_status: 'INSIDE_RADIUS_50M',
      shift_started_at: '08:00 AM IST',
    },
    sla: '100% Tracking',
  },
  {
    stage: '04',
    title: 'SOS Escalation & Standby Match',
    icon: BellRing,
    role: 'Emergency Dispatch → Paramedics & Backup',
    desc: 'If a medical emergency occurs or a caregiver reports unwell, the console triggers priority alarms and 1-click standby caregiver reassignment.',
    payload: {
      event: 'EMERGENCY_REPLACEMENT_MATCH',
      trigger: 'CAREGIVER_DELAYED_15M',
      standby_match: 'Arun V. (4.9 Rating, 1.2km away)',
      eta_arrival: '14 minutes',
      family_notified: true,
    },
    sla: '< 30s Dispatch',
  },
  {
    stage: '05',
    title: 'Financial Ledger & Bank Payouts',
    icon: CircleDollarSign,
    role: 'Monetization Engine → Bank Direct Rails',
    desc: 'Completed shifts are calculated with dynamic tier rules. Platform commission (20%) is retained while 80% is disbursed directly to caregiver bank accounts.',
    payload: {
      event: 'PAYOUT_BATCH_SETTLED',
      gross_amount: '₹3,800',
      caretaker_payout: '₹3,040 (80%)',
      platform_revenue: '₹760 (20%)',
      bank_transfer_ref: 'TXN-99401284',
    },
    sla: '24h Settlement',
  },
];

export default function OperationsFlow() {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState(PIPELINE_STAGES[0]);

  return (
    <section className="wecare-section" id="operations">
      <div className="wecare-container">
        <div className="wecare-section-header">
          <div className="wecare-eyebrow">
            <Workflow size={13} />
            <span>OPERATIONS LIFECYCLE</span>
          </div>
          <h2 className="wecare-section-title">How the healthcare operation flows.</h2>
          <p className="wecare-section-desc">
            A resilient, 5-stage orchestration pipeline connecting patient families, verified attendants, field telemetry, and administrative oversight.
          </p>
        </div>

        <div className="wecare-flow-container">
          {/* Horizontal Track of 5 Stages */}
          <div className="wecare-flow-track">
            {PIPELINE_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isSelected = selectedStage.stage === stage.stage;

              return (
                <div
                  key={stage.stage}
                  className={`wecare-flow-node ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedStage(stage)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="wecare-flow-node-top">
                    <span className="wecare-flow-stage-num">{stage.stage}</span>
                    <Icon size={18} className="wecare-flow-node-icon" />
                  </div>
                  <div>
                    <h4 className="wecare-flow-node-title">{stage.title}</h4>
                    <div className="wecare-flow-node-sla">{stage.sla}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Inspector Panel for Selected Stage */}
          <div className="wecare-flow-inspector">
            <div className="wecare-inspector-left">
              <div>
                <div className="wecare-inspector-eyebrow">STAGE // {selectedStage.stage} PROTOCOL</div>
                <h3 className="wecare-inspector-title">{selectedStage.title}</h3>
                <div className="wecare-inspector-role">{selectedStage.role}</div>
                <p className="wecare-inspector-desc">{selectedStage.desc}</p>
              </div>

              <div>
                <button
                  type="button"
                  className="wc-btn wc-btn-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Inspect in Operations Console <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Live Payload Code View */}
            <div className="wecare-inspector-code-box">
              <div className="wecare-code-header">
                <span>EVENT TELEMETRY PAYLOAD</span>
                <span style={{ color: '#34d399' }}>● VERIFIED</span>
              </div>
              <pre className="wecare-code-block">
                {JSON.stringify(selectedStage.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
