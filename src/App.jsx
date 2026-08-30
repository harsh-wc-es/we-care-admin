import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import RequireAdminAuth from './components/RequireAdminAuth';
import AdminWelcomePage from './pages/welcome/AdminWelcomePage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CaregiverManagementPage from './pages/dashboard/CaregiverManagementPage';
import BookingsPage from './pages/dashboard/BookingsPage';
import LiveTrackingPage from './pages/dashboard/LiveTrackingPage';
import SOSAlertsPage from './pages/dashboard/SOSAlertsPage';
import ReplacementsPage from './pages/dashboard/ReplacementsPage';
import ComplaintsPage from './pages/dashboard/ComplaintsPage';
import UserManagementPage from './pages/dashboard/UserManagementPage';
import EarningsPage from './pages/dashboard/EarningsPage';
import PayoutsPage from './pages/dashboard/PayoutsPage';
import PricingTiersPage from './pages/dashboard/PricingTiersPage';
import RefundManagementPage from './pages/dashboard/RefundManagementPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';

const envBase = (import.meta.env.VITE_ROUTER_BASE || '').replace(/\/+$/, '');
const isUnderSubpath = envBase && typeof window !== 'undefined' && window.location.pathname.startsWith(envBase);
const BASENAME = isUnderSubpath ? envBase : '';

export default function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <Routes>
        {/* Welcome & Command Hub */}
        <Route path="/" element={<AdminWelcomePage />} />
        <Route path="/welcome" element={<AdminWelcomePage />} />
        <Route path="/admin" element={<AdminWelcomePage />} />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Admin Routes */}
        <Route element={<RequireAdminAuth />}>
          <Route element={<AdminLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin/dashboard" element={<DashboardPage />} />

            {/* Bookings */}
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/admin/bookings" element={<BookingsPage />} />

            {/* Live Tracking */}
            <Route path="/live-tracking" element={<LiveTrackingPage />} />
            <Route path="/admin/live-tracking" element={<LiveTrackingPage />} />
            <Route path="/active-visits" element={<Navigate to="/live-tracking" replace />} />
            <Route path="/tracking" element={<Navigate to="/live-tracking" replace />} />
            <Route path="/admin/active-visits" element={<Navigate to="/live-tracking" replace />} />
            <Route path="/admin/tracking" element={<Navigate to="/live-tracking" replace />} />

            {/* SOS Alerts */}
            <Route path="/sos-alerts" element={<SOSAlertsPage />} />
            <Route path="/admin/sos-alerts" element={<SOSAlertsPage />} />

            {/* Replacements */}
            <Route path="/replacements" element={<ReplacementsPage />} />
            <Route path="/admin/replacements" element={<ReplacementsPage />} />

            {/* Complaints */}
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/admin/complaints" element={<ComplaintsPage />} />

            {/* Caregivers & Verification */}
            <Route path="/caregiver-verification" element={<CaregiverManagementPage mode="verification" />} />
            <Route path="/admin/caregiver-verification" element={<CaregiverManagementPage mode="verification" />} />
            <Route path="/caregivers" element={<CaregiverManagementPage />} />
            <Route path="/admin/caregivers" element={<CaregiverManagementPage />} />

            {/* Users */}
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />

            {/* Finance & Payouts */}
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/admin/earnings" element={<EarningsPage />} />
            <Route path="/payouts" element={<PayoutsPage />} />
            <Route path="/admin/payouts" element={<PayoutsPage />} />
            <Route path="/admin/refunds" element={<RefundManagementPage />} />
            <Route path="/refunds" element={<Navigate to="/admin/refunds" replace />} />
            <Route path="/pricing" element={<PricingTiersPage />} />
            <Route path="/admin/pricing" element={<PricingTiersPage />} />

            {/* System */}
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
            <Route path="/audit-logs" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/audit-logs" element={<Navigate to="/dashboard" replace />} />
            <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/reports" element={<Navigate to="/dashboard" replace />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
