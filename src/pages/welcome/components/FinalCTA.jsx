import { useNavigate } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Lock } from 'lucide-react';

export default function FinalCTA({ isLoggedIn, onOpenAuthModal }) {
  const navigate = useNavigate();

  return (
    <section className="wecare-section">
      <div className="wecare-container">
        <div className="wecare-final-cta">
          <div className="wecare-eyebrow">
            <span className="wecare-eyebrow-badge">READY TO COMMAND</span>
          </div>

          <h2 className="wecare-cta-heading">
            Everything is connected.<br />Now take control.
          </h2>

          <p className="wecare-cta-sub">
            Open the WeCare admin workspace to manage live dispatch operations, caregiver verification pipelines, clinical quality assurance, and financial settlements in one unified system.
          </p>

          <div className="wecare-cta-buttons">
            {isLoggedIn ? (
              <button
                type="button"
                className="wc-btn wc-btn-primary wc-btn-lg"
                onClick={() => navigate('/dashboard')}
              >
                <LayoutDashboard size={16} /> Open Admin Dashboard <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="wc-btn wc-btn-primary wc-btn-lg"
                  onClick={() => navigate('/login')}
                >
                  <Lock size={15} /> Sign In to Admin Console <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  className="wc-btn wc-btn-secondary wc-btn-lg"
                  onClick={onOpenAuthModal}
                >
                  Quick Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
