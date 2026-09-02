import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getDefaultRouteByRole } from '../utils/roleRedirect';

/**
 * Trang chủ "/" dùng chung cho khách vãng lai lẫn khách hàng đã đăng nhập. Nhân sự phòng khám
 * (admin/quản lý/lễ tân/bác sĩ/KTV) đã đăng nhập gõ lại "/" phải được đẩy thẳng về trang quản lý
 * của vai trò đó, không kẹt ở trang giới thiệu client.
 */
export function RootRedirect({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore((state) => state);

  if (isAuthenticated() && user) {
    const roleId = Number(user.vai_tro_id);
    if (roleId !== 1 && roleId !== 0) {
      return <Navigate to={getDefaultRouteByRole(roleId)} replace />;
    }
  }

  return <>{children}</>;
}
