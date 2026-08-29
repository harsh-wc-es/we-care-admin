import { useState, useEffect } from 'react';
import { isAdminUser, getToken, getUser } from '../../services/api';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Capabilities from './components/Capabilities';
import OperationsFlow from './components/OperationsFlow';
import LiveSimulator from './components/LiveSimulator';
import Playbooks from './components/Playbooks';
import ModuleDirectory from './components/ModuleDirectory';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import './welcome.css';

export default function AdminWelcomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Sync auth state on mount
  useEffect(() => {
    const token = getToken();
    const isAdm = isAdminUser();
    const user = getUser();
    setIsLoggedIn(Boolean(token && isAdm));
    setCurrentUser(user);
  }, []);

  return (
    <div className="wecare-page">
      {/* Background Architectural Patterns */}
      <div className="wecare-bg-grid" />
      <div className="wecare-bg-glow" />

      {/* 1. Executive Navbar */}
      <Navbar
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main>
        {/* 2. Hero & Operational Preview */}
        <Hero
          isLoggedIn={isLoggedIn}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* 3. Core Operational Capabilities */}
        <Capabilities />

        {/* 4. Operations Flow / Lifecycle */}
        <OperationsFlow />

        {/* 5. Live Operations Simulator */}
        <LiveSimulator />

        {/* 6. Standard Operating Procedures */}
        <Playbooks />

        {/* 7. Complete 14-Module Admin Launcher */}
        <ModuleDirectory />

        {/* 8. Final Command CTA */}
        <FinalCTA
          isLoggedIn={isLoggedIn}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
      </main>

      {/* 9. Minimal Footer */}
      <Footer />

      {/* 10. Quick Sign-In Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
