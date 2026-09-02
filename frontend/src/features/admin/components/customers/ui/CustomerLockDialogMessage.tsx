import type { CustomerLockImpact } from '../types';

interface CustomerLockDialogMessageProps {
  hoTen: string;
  willLock: boolean;
  impactLoading: boolean;
  impact: CustomerLockImpact | null;
}

// Nội dung dialog xác nhận khóa/mở khóa — khi khóa, cảnh báo (không chặn) nếu khách còn lịch hẹn
// sắp tới hoặc gói liệu trình đang điều trị, vì khóa không tự hủy các bản ghi này (chỉ chặn khách tự
// đăng nhập). Admin vẫn luôn khóa được, chỉ được nhắc để chủ động xử lý tay ở Quản lý lịch hẹn sau đó.
export function CustomerLockDialogMessage({ hoTen, willLock, impactLoading, impact }: CustomerLockDialogMessageProps) {
  if (!willLock) {
    return <>Khách hàng "{hoTen}" sẽ có thể đăng nhập lại bình thường.</>;
  }

  const hasImpact = !!impact && (impact.upcomingAppointments > 0 || impact.activePlans.length > 0);

  return (
    <span className="block space-y-2">
      <span className="block">Khách hàng "{hoTen}" sẽ không thể đăng nhập vào hệ thống nữa.</span>
      {impactLoading && (
        <span className="block text-slate-400">Đang kiểm tra lịch hẹn & liệu trình...</span>
      )}
      {!impactLoading && hasImpact && impact && (
        <span className="block text-left p-2.5 rounded-xl bg-amber-50 border border-amber-150 text-amber-700">
          ⚠️ Khách hàng còn
          {impact.upcomingAppointments > 0 && <> <b>{impact.upcomingAppointments} lịch hẹn</b> sắp tới</>}
          {impact.upcomingAppointments > 0 && impact.activePlans.length > 0 && ' và'}
          {impact.activePlans.length > 0 && (
            <> {impact.activePlans.map(p => `gói "${p.ten_goi}" (${p.so_buoi_da_dung}/${p.tong_so_buoi} buổi)`).join(', ')}</>
          )}
          . Nếu vẫn muốn khóa, vào <b>Quản lý lịch hẹn</b> xử lý các lịch này để giải phóng nhân sự.
        </span>
      )}
    </span>
  );
}
