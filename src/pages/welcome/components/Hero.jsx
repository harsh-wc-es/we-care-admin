import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';

export default function Hero({ isLoggedIn }) {
  const navigate = useNavigate();

  return (
    <section className="wecare-hero" id="overview">
      <div className="wecare-container">
        <div className="wecare-hero-grid">
          {/* Left: Editorial Hero Content */}
          <div className="wecare-hero-content">
            <div className="wecare-eyebrow">
              <span className="wecare-eyebrow-badge">WECARE HEALTHCARE OPERATIONS</span>
            </div>

            <h1 className="wecare-hero-title">
              One command center for every <span className="highlight">critical care operation</span>.
            </h1>

            <p className="wecare-hero-lead">
              WeCare gives administrators complete operational oversight—coordinating patient bookings, caregiver KYC vetting, real-time GPS telemetry, rapid emergency escalation, and automated financial settlements.
            </p>

            <div className="wecare-hero-cta-group">
              {isLoggedIn ? (
                <button
                  type="button"
                  className="wc-btn wc-btn-primary wc-btn-lg"
                  onClick={() => navigate('/dashboard')}
                >
                  Enter Admin Console <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="wc-btn wc-btn-primary wc-btn-lg"
                  onClick={() => navigate('/login')}
                >
                  Launch Admin Console <ArrowRight size={16} />
                </button>
              )}

              <a href="#capabilities" className="wc-btn wc-btn-secondary wc-btn-lg">
                Explore Capabilities
              </a>
            </div>

            {/* Metric Strip */}
            <div className="wecare-hero-metrics">
              <div className="wecare-metric-item">
                <span className="wecare-metric-num">450+</span>
                <span className="wecare-metric-lbl">Active Caregivers</span>
              </div>
              <div className="wecare-metric-item">
                <span className="wecare-metric-num">1,280+</span>
                <span className="wecare-metric-lbl">Monthly Shifts</span>
              </div>
              <div className="wecare-metric-item">
                <span className="wecare-metric-num">&lt; 30s</span>
                <span className="wecare-metric-lbl">SOS Response SLA</span>
              </div>
              <div className="wecare-metric-item">
                <span className="wecare-metric-num">₹24.8L</span>
                <span className="wecare-metric-lbl">Monthly Volume</span>
              </div>
            </div>
          </div>

          {/* Right: Focused Operational Visualization */}
          <div className="wecare-hero-vis">
            {/* Panel Header */}
            <div className="wecare-vis-header">
              <div className="wecare-vis-title-wrap">
                <span className="wecare-status-dot" />
                <span className="wecare-vis-title">Active Dispatch Telemetry</span>
              </div>
              <span className="wecare-vis-meta">NODE: DEL-NCR-01</span>
            </div>

            {/* Panel Body */}
            <div className="wecare-vis-body">
              {/* Metric Row */}
              <div className="wecare-vis-strip">
                <div className="wecare-vis-stat-card">
                  <div className="wecare-stat-row">
                    <span className="wecare-stat-val">84</span>
                    <span className="wc-badge wc-badge-green">Live</span>
                  </div>
                  <div className="wecare-stat-caption">Active Visits</div>
                </div>

                <div className="wecare-vis-stat-card">
                  <div className="wecare-stat-row">
                    <span className="wecare-stat-val">12</span>
                    <span className="wc-badge wc-badge-blue">Queue</span>
                  </div>
                  <div className="wecare-stat-caption">KYC Pending</div>
                </div>

                <div className="wecare-vis-stat-card">
                  <div className="wecare-stat-row">
                    <span className="wecare-stat-val">0</span>
                    <span className="wc-badge wc-badge-neutral">Clear</span>
                  </div>
                  <div className="wecare-stat-caption">Active Alarms</div>
                </div>
              </div>

              {/* Highlighted In-Flight Dispatch Card */}
              <div className="wecare-vis-dispatch-card">
                <div className="wecare-dispatch-top">
                  <div className="wecare-dispatch-patient">
                    <div className="wecare-dispatch-avatar">KS</div>
                    <div>
                      <div className="wecare-dispatch-name">Kavita Sharma (Senior ICU Attendant)</div>
                      <div className="wecare-dispatch-care">Assigned to Patient #8812 • 12h Shift</div>
                    </div>
                  </div>
                  <span className="wc-badge wc-badge-green">On-Premises</span>
                </div>

                {/* Event Progression Timeline */}
                <div className="wecare-vis-timeline">
                  <div className="wecare-vis-step done">
                    <div className="wecare-vis-step-text">
                      <span><strong>5-Point KYC &amp; Police NOC Cleared</strong></span>
                      <span className="wecare-vis-step-time">07:30 AM</span>
                    </div>
                  </div>
                  <div className="wecare-vis-step done">
                    <div className="wecare-vis-step-text">
                      <span><strong>GPS Geofence Check-in Validated</strong> (50m radius)</span>
                      <span className="wecare-vis-step-time">08:00 AM</span>
                    </div>
                  </div>
                  <div className="wecare-vis-step current">
                    <div className="wecare-vis-step-text">
                      <span><strong>Continuous Vital Monitoring Active</strong></span>
                      <span className="wecare-vis-step-time">Live</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Footer */}
            <div className="wecare-vis-footer">
              <span>Auditable system telemetry &amp; live radar HUD</span>
              <button 
                type="button" 
                className="wecare-vis-footer-link"
                onClick={() => navigate('/live-tracking')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                View Live Map <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
