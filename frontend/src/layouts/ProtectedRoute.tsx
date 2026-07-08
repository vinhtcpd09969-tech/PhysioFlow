import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  allowedRoles?: number[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore((state) => state);
  const location = useLocation();

  const getDefaultRouteByRole = (roleId: number) => {
    switch (roleId) {
      case 5:
      case 6: return '/admin';
      case 2: return '/receptionist';
      case 3: return '/technician/appointments';
      case 4: return '/doctor';
      default: return '/dashboard';
    }
  };

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
    console.log('ProtectedRoute: Access denied. User role:', roleId, 'Allowed roles:', allowedRoles);
    return <Navigate to={getDefaultRouteByRole(roleId)} replace />;
  }

  console.log('ProtectedRoute: Access granted. User role:', user?.vai_tro_id, 'Path:', location.pathname);
  return <Outlet />;
};

