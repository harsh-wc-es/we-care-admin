import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearAuth, getToken, isAdminUser } from '../services/api';

export default function RequireAdminAuth() {
  const location = useLocation();
  const hasToken = Boolean(getToken());
  const hasAdminRole = isAdminUser();

  if (!hasToken || !hasAdminRole) {
    if (hasToken && !hasAdminRole) clearAuth();
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
