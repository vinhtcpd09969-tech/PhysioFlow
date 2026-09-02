import { AlertCircle } from 'lucide-react';

interface SymptomNotesProps {
  selectedAppointment: any;
  isSendingEmail: boolean;
  handleResendEmail: () => void;
  appendCallLog: (logText: string) => void;
}

export function SymptomNotes({
  selectedAppointment,
  isSendingEmail: _isSendingEmail,
  handleResendEmail: _handleResendEmail,
  appendCallLog: _,
}: SymptomNotesProps) {
  return (
    <div className="space-y-6">
      {/* Cảnh báo yêu cầu hủy */}
      {selectedAppointment.trang_thai === 'cho_huy' && (
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 border-l-4 border-l-rose-600 space-y-2 animate-in fade-in">
          <p className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
            <AlertCircle size={16} className="text-rose-600 animate-bounce" /> Khách hàng yêu cầu hủy lịch này
          </p>
          <p className="text-sm text-slate-800 font-semibold">
            Lý do khách đưa ra: <span className="font-normal italic text-slate-600">"{selectedAppointment.ghi_chu_noi_bo || 'Không có lý do chi tiết'}"</span>
          </p>
          <div className="text-xs text-rose-700 font-medium leading-relaxed bg-white/60 p-2.5 rounded border border-rose-100">
            ⚠️ <strong>Quy trình xử lý của Lễ tân:</strong>
            <ol className="list-decimal pl-4 mt-1 space-y-1">
              <li>Gọi điện thoại đến số <strong>{selectedAppointment.so_dien_thoai}</strong> để xác minh lý do hủy.</li>
              <li>Nếu đồng ý hủy lịch, chọn trạng thái <strong>Đã hủy</strong> bên dưới và bấm <strong>Lưu cập nhật</strong>.</li>
              <li>Nếu khách muốn giữ lịch hoặc đổi giờ, hỗ trợ khách và cập nhật thông tin tương ứng.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
