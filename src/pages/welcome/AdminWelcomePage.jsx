import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, BellRing, CalendarDays, ChevronRight,
  CircleDollarSign, ClipboardCheck, FileCheck2, HeartPulse,
  LayoutDashboard, MapPinned, MessageSquareWarning, Network,
  ScanSearch, Send, ShieldCheck, UsersRound,
  Heart, Star, Activity, Sparkles, Shield, Stethoscope, Clock, Zap,
  Radio, CheckCircle2, Lock, ArrowUpRight
} from 'lucide-react';
import { getToken, getUser, isAdminUser } from '../../services/api';
import logoImg from '../../assets/wecare-logo.png';
import './welcome.css';

const RESPONSIBILITIES = [
  { icon: ClipboardCheck, title: 'Orchestrate care requests', text: 'Review incoming bookings, keep schedules moving, and ensure each family receives the right level of support.' },
  { icon: FileCheck2, title: 'Build a trusted workforce', text: 'Verify documents, approve qualified caretakers, and maintain a dependable roster for every shift.' },
  { icon: HeartPulse, title: 'Protect care in progress', text: 'Follow live visits, respond to SOS events, and coordinate replacements when care needs to change.' },
  { icon: CircleDollarSign, title: 'Keep every decision accountable', text: 'Set pricing, resolve disputes, settle payments, and retain a clear record of operational decisions.' },
];
const WORKFLOW = [
  { number: '01', title: 'A family requests care', text: 'Bookings and care requirements enter through the patient app, ready for review in one place.', icon: UsersRound },
  { number: '02', title: 'Admin verifies and assigns', text: 'You validate the caregiver, review fit and availability, then shape the care plan around the patient.', icon: BadgeCheck },
  { number: '03', title: 'Care is monitored in the field', text: 'The caretaker app keeps visits, check-ins, and alerts connected to your operations team.', icon: MapPinned },
  { number: '04', title: 'The care cycle is closed well', text: 'Resolve feedback, complete payouts or refunds, and use the audit trail to improve the next shift.', icon: ShieldCheck },
];
const DESKS = [
  { title: 'Bookings', text: 'Review and coordinate care schedules.', to: '/bookings', icon: CalendarDays, tone: 'blue' },
  { title: 'Caretaker verification', text: 'Approve documents and care qualifications.', to: '/caregiver-verification', icon: ScanSearch, tone: 'lavender' },
  { title: 'Live visits', text: 'Follow active care and location updates.', to: '/live-tracking', icon: MapPinned, tone: 'amber' },
  { title: 'SOS alerts', text: 'Respond quickly to urgent care events.', to: '/sos-alerts', icon: BellRing, tone: 'rose' },
  { title: 'Complaints', text: 'Resolve family feedback and service issues.', to: '/complaints', icon: MessageSquareWarning, tone: 'blue' },
  { title: 'Notifications', text: 'Keep patients and caretakers informed.', to: '/notifications', icon: Send, tone: 'lavender' },
];

/* Floating decorative badges with multi-axis float animations */
const FLOATING_ICONS = [
  { Icon: Heart,       size: 24, badgeSize: 52, className: 'floating-badge--rose',     style: { top: '130px', right: '4%',  '--float-dur': '3.8s', '--float-delay': '0s',    '--float-rot-start': '-6deg', '--float-rot-end': '8deg' } },
  { Icon: Shield,      size: 22, badgeSize: 48, className: '',                        style: { top: '220px', left: '2%',   '--float-dur': '4.4s', '--float-delay': '0.8s',  '--float-rot-start': '4deg',  '--float-rot-end': '-6deg' } },
  { Icon: Star,        size: 20, badgeSize: 44, className: 'floating-badge--amber',    style: { top: '440px', right: '2%',  '--float-dur': '3.6s', '--float-delay': '0.3s',  '--float-rot-start': '0deg',  '--float-rot-end': '12deg' } },
  { Icon: Activity,    size: 24, badgeSize: 50, className: 'floating-badge--emerald',  style: { top: '780px', left: '2%',   '--float-dur': '4.2s', '--float-delay': '1.1s',  '--float-rot-start': '-4deg', '--float-rot-end': '6deg' } },
  { Icon: Sparkles,    size: 22, badgeSize: 46, className: 'floating-badge--lavender', style: { top: '1020px', right: '3%', '--float-dur': '4.6s', '--float-delay': '0.5s',  '--float-rot-start': '6deg',  '--float-rot-end': '-4deg' } },
  { Icon: Stethoscope, size: 24, badgeSize: 52, className: '',                        style: { top: '1320px', left: '2%',  '--float-dur': '4.0s', '--float-delay': '1.3s',  '--float-rot-start': '-3deg', '--float-rot-end': '8deg' } },
  { Icon: Clock,       size: 20, badgeSize: 44, className: 'floating-badge--amber',    style: { top: '1580px', right: '3%', '--float-dur': '4.5s', '--float-delay': '0.2s',  '--float-rot-start': '4deg',  '--float-rot-end': '-8deg' } },
  { Icon: Zap,         size: 22, badgeSize: 48, className: 'floating-badge--lavender', style: { top: '1900px', left: '3%',  '--float-dur': '3.7s', '--float-delay': '1.0s',  '--float-rot-start': '-6deg', '--float-rot-end': '10deg' } },
];

export default function AdminWelcomePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [flippedCards, setFlippedCards] = useState(() => new Set());

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);
    setIsLoggedIn(Boolean(getToken() && isAdminUser()));
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const primaryDestination = isLoggedIn ? '/dashboard' : '/login';
  const primaryLabel = isLoggedIn ? 'Open workspace' : 'Sign in to workspace';
  const adminName = currentUser?.name?.split(' ')[0] || 'Admin';

  const toggleCard = (index) => {
    setFlippedCards((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  return (
    <div className="premium-welcome">
      <a className="premium-skip-link" href="#welcome-main">Skip to main content</a>

      {/* Ambient gradient orbs */}
      <div className="premium-ambient premium-ambient-one" aria-hidden="true" />
      <div className="premium-ambient premium-ambient-two" aria-hidden="true" />

      {/* Floating decorative glass badges */}
      {FLOATING_ICONS.map(({ Icon, size, badgeSize, className, style }, i) => (
        <div
          key={i}
          className={`floating-badge ${className}`}
          style={{ ...style, width: `${badgeSize}px`, height: `${badgeSize}px` }}
          aria-hidden="true"
        >
          <Icon size={size} />
        </div>
      ))}

      {/* ── Header ── */}
      <header className="premium-header">
        <div className="premium-shell premium-header-inner">
          <Link to="/" className="premium-brand" aria-label="WeCare admin home">
            <img src={logoImg} alt="WeCare" width="1024" height="291" />
            <span className="premium-brand-divider" aria-hidden="true" />
            <span>Admin workspace</span>
          </Link>
          <div className="premium-header-actions">
            <span className="premium-system-status">
              <i aria-hidden="true" />System connected
            </span>
            <button type="button" className="premium-header-cta" onClick={() => navigate(primaryDestination)}>
              {isLoggedIn && <LayoutDashboard size={16} aria-hidden="true" />}
              {primaryLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main id="welcome-main">

        {/* ── Hero ── */}
        <section className="premium-hero">
          <div className="premium-shell premium-hero-grid">
            <div className="premium-hero-copy" data-reveal>
              <p className="premium-kicker">WECARE ADMINISTRATION</p>
              <h1>Care gets better when the whole operation stays in view.</h1>
              <p className="premium-intro">
                {isLoggedIn ? `Welcome back, ${adminName}.` : 'Welcome to the WeCare admin workspace.'}{' '}
                This is the control point for the people, decisions, and handoffs that keep home care dependable.
              </p>
              <div className="premium-hero-actions">
                <button type="button" className="premium-primary-button" onClick={() => navigate(primaryDestination)}>
                  {primaryLabel}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
                <a className="premium-text-link" href="#how-it-works">
                  See how the operation works <ChevronRight size={17} aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Network topology card (Continuous auto-animated) */}
            <aside
              className="premium-network-card"
              aria-label="Platform overview"
              data-reveal
            >
              <div className="premium-network-topline">
                <span className="premium-live-badge">
                  <span className="premium-live-dot" />
                  Live System
                </span>
                <span className="premium-network-title">One connected care system</span>
              </div>
              <div className="premium-network-core">
                <div className="premium-network-link premium-network-link-left" aria-hidden="true"><span /></div>
                <div className="premium-network-link premium-network-link-right" aria-hidden="true"><span /></div>
                <div className="premium-network-orbit premium-network-orbit-one" aria-hidden="true">
                  <span className="premium-orbit-satellite" />
                </div>
                <div className="premium-network-orbit premium-network-orbit-two" aria-hidden="true">
                  <span className="premium-orbit-satellite" />
                </div>
                <div className="premium-network-node premium-patient-node">
                  <span>01</span>
                  <strong>Patient app</strong>
                  <small>Requests &amp; updates</small>
                </div>
                <div className="premium-admin-core">
                  <ShieldCheck size={30} aria-hidden="true" />
                  <strong>Admin</strong>
                  <small>Decide &amp; coordinate</small>
                </div>
                <div className="premium-network-node premium-caretaker-node">
                  <span>02</span>
                  <strong>Caretaker app</strong>
                  <small>Visits &amp; care delivery</small>
                </div>
              </div>
              <p className="premium-network-caption">From the first request to shift closure</p>
              <div className="premium-network-stats">
                <span><b>150+</b> FastAPI endpoints</span>
                <span><b>2</b> connected mobile apps</span>
              </div>
            </aside>
          </div>
        </section>

        {/* ── Responsibilities — Flip Cards ── */}
        <section className="premium-responsibilities" aria-labelledby="responsibilities-title">
          <div className="premium-shell">
            <div className="premium-heading" data-reveal>
              <p className="premium-kicker">YOUR ROLE IN THE SYSTEM</p>
              <h2 id="responsibilities-title">The admin team keeps care accountable at every turn.</h2>
            </div>
            <div className="premium-flip-grid" data-reveal>
              {RESPONSIBILITIES.map(({ icon: Icon, title, text }, index) => {
                const isFlipped = flippedCards.has(index);
                return (
                  <article
                    key={title}
                    className={`premium-flip-card${isFlipped ? ' is-flipped' : ''}`}
                    style={{ '--reveal-delay': `${index * 80}ms` }}
                  >
                    <div className="premium-flip-card-inner">
                      {/* Front */}
                      <div className="premium-flip-face premium-flip-front">
                        <span className="premium-card-index">0{index + 1}</span>
                        <span className="premium-responsibility-icon" style={{ animationDelay: `${index * -1.2}s` }}>
                          <Icon size={24} aria-hidden="true" />
                        </span>
                        <h3>{title}</h3>
                        <button
                          type="button"
                          className="premium-flip-toggle"
                          onClick={() => toggleCard(index)}
                          aria-pressed={isFlipped}
                        >
                          Explore role <ArrowRight size={15} aria-hidden="true" />
                        </button>
                      </div>
                      {/* Back */}
                      <div className="premium-flip-face premium-flip-back">
                        <span className="premium-card-index">0{index + 1}</span>
                        <h3>{title}</h3>
                        <p>{text}</p>
                        <button
                          type="button"
                          className="premium-flip-toggle premium-flip-toggle-back"
                          onClick={() => toggleCard(index)}
                          aria-pressed={isFlipped}
                        >
                          Back <ArrowRight size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Workflow ── */}
        <section className="premium-workflow" id="how-it-works" aria-labelledby="workflow-title">
          <div className="premium-shell">
            <div className="premium-workflow-heading" data-reveal>
              <p className="premium-kicker">THE CARE OPERATIONS LOOP</p>
              <h2 id="workflow-title">From a request to a trusted outcome.</h2>
              <p>Each desk gives your team the context needed for the next decision, while the platform keeps every handoff linked.</p>
            </div>
            <ol className="premium-workflow-list" data-reveal>
              {WORKFLOW.map(({ number, title, text, icon: Icon }, index) => (
                <li
                  key={number}
                  className="premium-workflow-step"
                  style={{ '--reveal-delay': `${index * 90}ms` }}
                >
                  <span className="premium-step-number">{number}</span>
                  <span className="premium-step-icon">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Operations Desks ── */}
        <section className="premium-desks" aria-labelledby="desks-title">
          <div className="premium-shell">
            <div className="premium-desks-heading" data-reveal>
              <div>
                <p className="premium-kicker">START WHERE YOU NEED TO</p>
                <h2 id="desks-title">Your operations desks.</h2>
              </div>
              <Link to={primaryDestination} className="premium-text-link">
                Open main dashboard <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="premium-desk-grid" data-reveal>
              {DESKS.map(({ icon: Icon, title, text, to, tone }, index) => (
                <Link
                  key={to}
                  to={to}
                  className="premium-desk-card"
                  style={{ '--reveal-delay': `${index * 65}ms` }}
                >
                  <span className={`premium-desk-icon premium-desk-icon-${tone}`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="premium-desk-content">
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </span>
                  <ChevronRight className="premium-desk-arrow" size={20} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Operations Command Hub CTA Banner ── */}
        <section className="premium-cta-section" aria-labelledby="cta-title">
          <div className="premium-shell">
            <div className="premium-cta-card" data-reveal>
              <div className="premium-cta-glow" aria-hidden="true" />
              <div className="premium-cta-grid">
                <div className="premium-cta-content">
                  <p className="premium-kicker">UNIFIED CARE GOVERNANCE</p>
                  <h2 id="cta-title">Ready to orchestrate dependable home care?</h2>
                  <p className="premium-cta-desc">
                    Step into the operations control point to coordinate schedules, approve verified caregivers, track field visits in real time, and protect patient care standards at every step.
                  </p>
                  <div className="premium-cta-actions">
                    <button type="button" className="premium-primary-button premium-cta-btn" onClick={() => navigate(primaryDestination)}>
                      <LayoutDashboard size={18} aria-hidden="true" />
                      {isLoggedIn ? 'Launch Admin Workspace' : 'Sign in to Command Workspace'}
                      <ArrowRight size={18} aria-hidden="true" />
                    </button>
                    <Link to="/live-tracking" className="premium-cta-link">
                      <Radio size={16} aria-hidden="true" />
                      <span>Open Live Field Tracking</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div className="premium-cta-badges">
                  <div className="premium-trust-pill">
                    <ShieldCheck size={20} className="pill-icon--emerald" aria-hidden="true" />
                    <div>
                      <strong>100% Verified Caregivers</strong>
                      <small>Background checked & license approved</small>
                    </div>
                  </div>
                  <div className="premium-trust-pill">
                    <Activity size={20} className="pill-icon--blue" aria-hidden="true" />
                    <div>
                      <strong>Real-Time Visit Monitoring</strong>
                      <small>Continuous GPS check-in & SOS alerts</small>
                    </div>
                  </div>
                  <div className="premium-trust-pill">
                    <Zap size={20} className="pill-icon--amber" aria-hidden="true" />
                    <div>
                      <strong>Instant Shift Dispatch</strong>
                      <small>Rapid qualified caregiver coordination</small>
                    </div>
                  </div>
                  <div className="premium-trust-pill">
                    <FileCheck2 size={20} className="pill-icon--lavender" aria-hidden="true" />
                    <div>
                      <strong>Complete Audit Trail</strong>
                      <small>Every decision logged and accountable</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Extended Enterprise Footer ── */}
      <footer className="premium-footer">
        <div className="premium-shell">
          <div className="premium-footer-grid">
            <div className="premium-footer-brand">
              <Link to="/" className="premium-brand" aria-label="WeCare home">
                <img src={logoImg} alt="WeCare" width="1024" height="291" />
                <span className="premium-brand-divider" aria-hidden="true" />
                <span>Admin Operations</span>
              </Link>
              <p className="premium-footer-about">
                WeCare is the mission-critical operations system powering dependable, transparent home care for patients, families, and healthcare professionals.
              </p>
              <div className="premium-footer-status">
                <span className="premium-status-indicator" />
                <span>System Online &bull; v1.0.4 Enterprise Admin</span>
              </div>
            </div>

            <div className="premium-footer-col">
              <h4>Operations Desks</h4>
              <ul>
                <li><Link to="/bookings">Care Bookings</Link></li>
                <li><Link to="/caregiver-verification">Caregiver Verification</Link></li>
                <li><Link to="/live-tracking">Live Field Tracking</Link></li>
                <li><Link to="/sos-alerts">Emergency SOS Dispatch</Link></li>
                <li><Link to="/complaints">Resolution Desk</Link></li>
              </ul>
            </div>

            <div className="premium-footer-col">
              <h4>Management</h4>
              <ul>
                <li><Link to="/caregivers">Caregiver Roster</Link></li>
                <li><Link to="/users">Family & Patient Accounts</Link></li>
                <li><Link to="/pricing">Pricing & Tier Config</Link></li>
                <li><Link to="/earnings">Financial Reports</Link></li>
                <li><Link to="/settings">Security & Settings</Link></li>
              </ul>
            </div>

            <div className="premium-footer-col">
              <h4>Quick Access</h4>
              <ul>
                <li><Link to={primaryDestination}>Admin Dashboard</Link></li>
                <li><Link to="/notifications">Broadcast Notifications</Link></li>
                <li><Link to="/replacements">Caregiver Replacements</Link></li>
                <li><Link to="/payouts">Caregiver Payouts</Link></li>
                <li><a href="#welcome-main">Back to top &uarr;</a></li>
              </ul>
            </div>
          </div>

          <div className="premium-footer-bottom">
            <span>&copy; {new Date().getFullYear()} WeCare Healthcare Technologies Inc. All rights reserved.</span>
            <div className="premium-footer-badges">
              <span>HIPAA Compliant Protocol</span>
              <span>&bull;</span>
              <span>AES-256 Bit Encryption</span>
              <span>&bull;</span>
              <span>Role-Based Access Control</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
