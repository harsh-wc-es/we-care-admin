import { useState } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  RefreshCw, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  Terminal
} from 'lucide-react';

const SIMULATOR_SCENARIOS = [
  {
    id: 'checkin',
    title: 'Caregiver Arrival & Geofence Check-in',
    tag: 'Live Telemetry',
    desc: 'Simulates a live caregiver reaching the patient residence with automated GPS geofence radius validation.',
    icon: MapPin,
    request: {
      endpoint: 'POST /api/v1/tracking/check-in',
      headers: { 'Authorization': 'Bearer adm_sec_tok_9918' },
      body: {
        booking_id: 'BK-9021',
        caretaker_id: 'CR-412 (Kavita Sharma)',
        patient_id: 'PT-8812 (Suresh K.)',
        lat: 28.6139,
        lng: 77.2090,
        geofence_status: 'WITHIN_50M_ZONE',
      },
    },
    response: {
      status: 200,
      code: 'OK',
      data: {
        status: 'ACTIVE_ON_DUTY',
        verified_at: '2026-08-28T08:00:14Z',
        patient_family_alert: 'SMS_SENT',
        geofence_lock: 'SECURED',
        live_hud_sync: 'ACTIVE',
      },
    },
    cascade: [
      'Caregiver GPS coordinates matched against patient residence database.',
      'Geofence confirmed within 50m radius — Check-in timestamp securely locked.',
      'Automated SMS notification dispatched to registered patient family contact.',
      'Live Operations Map status transitions from "In Transit" to "On Duty".',
    ],
  },
  {
    id: 'sos',
    title: 'SOS Emergency Panic Escalation',
    tag: 'Critical Emergency',
    desc: 'Simulates a medical distress trigger and shows how the console activates paramedics and sounds priority alarms.',
    icon: AlertTriangle,
    request: {
      endpoint: 'POST /api/v1/sos/trigger',
      headers: { 'Authorization': 'Bearer emergency_dispatch_key' },
      body: {
        booking_id: 'BK-8841',
        triggered_by: 'PATIENT_PANIC_BUTTON',
        urgency: 'CRITICAL_RED_CODE_1',
        coords: [19.0760, 72.8777],
        patient_condition: 'CARDIAC_DISTRESS_SUSPECTED',
      },
    },
    response: {
      status: 201,
      code: 'CRITICAL_ALERT_BROADCAST',
      data: {
        dispatch_sla: '30_SECONDS',
        paramedic_channel: 'AUTO_NOTIFIED',
        nearest_hospital: 'Apollo LifeLine (1.4km)',
        family_hotline: 'DIALED_AUTOMATICALLY',
        admin_audio_alarm: 'HIGH_FREQ_SIREN_TRIGGERED',
      },
    },
    cascade: [
      'Panic signal decoded with precise GPS latitude and longitude coordinates.',
      'High-priority critical alert broadcasted across all active admin terminals.',
      'Closest partner hospital and emergency family contact notified with vital records.',
      'Telephonic triage verification countdown initiated with strict <30s SLA.',
    ],
  },
  {
    id: 'replacement',
    title: '1-Click Standby Caregiver Reassignment',
    tag: 'Workforce Dispatch',
    desc: 'Simulates instantaneous caregiver re-assignment when an attendant reports sick or faces severe transit delay.',
    icon: RefreshCw,
    request: {
      endpoint: 'POST /api/v1/replacements/auto-match',
      headers: { 'Authorization': 'Bearer adm_sec_tok_9918' },
      body: {
        booking_id: 'BK-7712',
        reason: 'CAREGIVER_SUDDEN_ILLNESS',
        care_category: 'DEMENTIA_SPECIALIST',
        search_radius_km: 5,
      },
    },
    response: {
      status: 200,
      code: 'REPLACEMENT_CONFIRMED',
      data: {
        original_caregiver: 'Sunil Verma (Cancelled)',
        matched_caretaker: 'Arun Kumar (Rating 4.9, 1.2km away)',
        replacement_eta: '14 minutes',
        patient_consent: 'AUTO_ACCEPTED_PREF',
        shift_handoff_notes: 'SYNCHRONIZED',
      },
    },
    cascade: [
      'Proximity matching algorithm queries standby pool for matching clinical tier.',
      'Top-rated verified attendant within 2km radius allocated instantaneously.',
      'Shift care directives, allergies, and access instructions transferred securely.',
      'Patient family receives updated attendant credential badge and live ETA link.',
    ],
  },
  {
    id: 'pricing',
    title: 'Dynamic Tier & 80/20 Revenue Split',
    tag: 'Financial Engine',
    desc: 'Simulates the calculation engine for 24-Hour Intensive Elderly Care with holiday surge multiplier.',
    icon: DollarSign,
    request: {
      endpoint: 'GET /api/v1/pricing/calculate?tier=INTENSIVE_24H&surge=1.15',
      headers: { 'Authorization': 'Bearer adm_sec_tok_9918' },
      body: {
        base_daily_rate: 2800,
        night_shift_allowance: 400,
        specialist_icu_fee: 600,
        surge_multiplier: 1.15,
      },
    },
    response: {
      status: 200,
      code: 'LEDGER_SPLIT_CALCULATED',
      data: {
        gross_shift_total: '₹4,370 / day',
        caregiver_payout: '₹3,496 (80.0%)',
        platform_commission: '₹874 (20.0%)',
        instant_disbursement_channel: 'IMPS_BANK_DIRECT',
      },
    },
    cascade: [
      'System evaluates caregiver qualification tier, night hours, and care intensity.',
      'Applies validated surge multiplier and zone allowance parameters.',
      'Splits total ledger amount into 80% attendant earnings and 20% platform revenue.',
      'Queues automated batch bank disbursement upon digital shift completion.',
    ],
  },
  {
    id: 'verification',
    title: '5-Point Caregiver Background & KYC Audit',
    tag: 'Trust & Governance',
    desc: 'Simulates automated validation of Aadhaar UID, Police criminal record status, and nursing registration.',
    icon: ShieldCheck,
    request: {
      endpoint: 'POST /api/v1/caregivers/verify-docs',
      headers: { 'Authorization': 'Bearer adm_sec_tok_9918' },
      body: {
        caretaker_id: 'CR-9901',
        aadhaar_uid: '••••-••••-8819',
        police_noc_reference: 'POL-DL-2026-8812',
        nursing_council_reg: 'INC-RN-44019',
      },
    },
    response: {
      status: 200,
      code: 'VERIFICATION_PASSED',
      data: {
        trust_index: 99.4,
        aadhaar_match: 'VERIFIED_UIDAI',
        criminal_record_flag: 'CLEAN_NO_RECORDS',
        nursing_accreditation: 'ACTIVE_VALID_2028',
        mobile_app_status: 'DISPATCH_AUTHORIZED',
      },
    },
    cascade: [
      'Government ID verified via UIDAI secure cryptographic gateway.',
      'State Police NOC cross-referenced with criminal verification repository.',
      'Nursing council registration verified against state medical records.',
      'Caregiver profile marked "Approved & Active" with immediate dispatch access.',
    ],
  },
];

export default function LiveSimulator() {
  const [activeSim, setActiveSim] = useState(SIMULATOR_SCENARIOS[0]);
  const [activeTab, setActiveTab] = useState('stream'); // 'stream' | 'json'
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const payloadText = JSON.stringify({ request: activeSim.request, response: activeSim.response }, null, 2);
    navigator.clipboard.writeText(payloadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="wecare-section wecare-section-alt" id="simulator">
      <div className="wecare-container">
        <div className="wecare-section-header">
          <div className="wecare-eyebrow">
            <Terminal size={13} />
            <span>INTERACTIVE SIMULATOR</span>
          </div>
          <h2 className="wecare-section-title">Test real-time operations protocols.</h2>
          <p className="wecare-section-desc">
            Trigger live healthcare operational scenarios below to observe how the WeCare platform validates geofences, executes emergency cascades, and balances ledgers.
          </p>
        </div>

        <div className="wecare-sim-card">
          <div className="wecare-sim-grid">
            {/* Left: Scenario Selector */}
            <div className="wecare-sim-nav">
              <div className="wecare-sim-nav-header">Select Scenario</div>
              {SIMULATOR_SCENARIOS.map((scenario) => {
                const Icon = scenario.icon;
                const isSelected = scenario.id === activeSim.id;

                return (
                  <button
                    key={scenario.id}
                    type="button"
                    className={`wecare-sim-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveSim(scenario)}
                  >
                    <Icon size={16} className="wecare-sim-btn-icon" />
                    <div>
                      <div className="wecare-sim-btn-title">{scenario.title}</div>
                      <div className="wecare-sim-btn-tag">{scenario.tag}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Simulation Output Console */}
            <div className="wecare-sim-content">
              <div className="wecare-sim-topbar">
                <div className="wecare-sim-active-info">
                  <span className="wecare-sim-active-title">{activeSim.title}</span>
                  <span className="wc-badge wc-badge-green">{activeSim.tag}</span>
                </div>

                <div className="wecare-sim-tabs">
                  <button
                    type="button"
                    className={`wecare-sim-tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stream')}
                  >
                    Live Cascade
                  </button>
                  <button
                    type="button"
                    className={`wecare-sim-tab-btn ${activeTab === 'json' ? 'active' : ''}`}
                    onClick={() => setActiveTab('json')}
                  >
                    API JSON
                  </button>
                  <button
                    type="button"
                    className="wecare-sim-copy-btn"
                    onClick={handleCopy}
                    title="Copy JSON Payload"
                  >
                    {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="wecare-sim-body">
                {activeTab === 'stream' ? (
                  <div>
                    <p className="wecare-sim-synopsis">{activeSim.desc}</p>

                    <div className="wecare-sim-cascade-list">
                      {activeSim.cascade.map((step, idx) => (
                        <div key={idx} className="wecare-sim-cascade-step">
                          <CheckCircle2 size={16} className="wecare-sim-cascade-icon" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>

                    <div className="wecare-sim-endpoint">
                      <span>Endpoint:</span>
                      <code>{activeSim.request.endpoint}</code>
                    </div>
                  </div>
                ) : (
                  <div className="wecare-sim-json-grid">
                    <div className="wecare-json-card">
                      <div className="wecare-json-title">HTTP REQUEST PAYLOAD</div>
                      <pre className="wecare-json-pre">
                        {JSON.stringify(activeSim.request, null, 2)}
                      </pre>
                    </div>

                    <div className="wecare-json-card">
                      <div className="wecare-json-title">BACKEND RESPONSE (200 OK)</div>
                      <pre className="wecare-json-pre success">
                        {JSON.stringify(activeSim.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="wecare-sim-footer">
                <div className="wecare-sim-status-chip">
                  <span>● 200 OK</span>
                  <span style={{ color: 'var(--wc-text-tertiary)' }}>• Latency: 28ms</span>
                </div>
                <span>REST API + WebSocket Gateway Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
