/** Trang quản lý mặc định của từng vai trò nhân sự sau khi đăng nhập. */
export function getDefaultRouteByRole(roleId: number): string {
  switch (roleId) {
    case 5:
    case 6:
      return '/admin';
    case 2:
      return '/receptionist';
    case 3:
      return '/technician/appointments';
    case 4:
      return '/doctor';
    default:
      return '/dashboard';
  }
}
