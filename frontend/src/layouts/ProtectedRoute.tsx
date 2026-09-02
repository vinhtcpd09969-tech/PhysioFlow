import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getDefaultRouteByRole } from '../utils/roleRedirect';

interface ProtectedRouteProps {
  allowedRoles?: number[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore((state) => state);
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (location.pathname === '/dashboard' && user) {
    const roleId = Number(user.vai_tro_id);
    if (roleId !== 1 && roleId !== 0) { // Nếu không phải khách hàng (1 hoặc mặc định)
      return <Navigate to={getDefaultRouteByRole(roleId)} replace />;
    }
  }

  if (allowedRoles && user && !allowedRoles.map(Number).includes(Number(user.vai_tro_id))) {
    const roleId = Number(user.vai_tro_id);
    return <Navigate to={getDefaultRouteByRole(roleId)} replace />;
  }

  return <Outlet />;
};

