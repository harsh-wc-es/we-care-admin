import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearAuth, getToken, isAdminUser, isTokenExpired } from '../services/api';

export default function RequireAdminAuth() {
  const location = useLocation();
  const token = getToken();
  const isAuth = Boolean(token && !isTokenExpired(token) && isAdminUser());

  if (!isAuth) {
    clearAuth();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
