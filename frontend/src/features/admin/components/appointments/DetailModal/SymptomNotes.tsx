import { AlertCircle, Phone, PhoneCall } from 'lucide-react';

interface SymptomNotesProps {
  selectedAppointment: any;
  isUnconfirmedState: boolean;
  isSendingEmail: boolean;
  handleResendEmail: () => void;
  appendCallLog: (logText: string) => void;
  localGhiChuNoiBo: string;
  setLocalGhiChuNoiBo: (val: string) => void;
}

export function SymptomNotes({
  selectedAppointment,
  isUnconfirmedState,
  isSendingEmail: _isSendingEmail,
  handleResendEmail: _handleResendEmail,
  appendCallLog: _,
  localGhiChuNoiBo,
  setLocalGhiChuNoiBo
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
            Lý do khách đưa ra: <span className="font-normal italic text-slate-600">"{selectedAppointment.ly_do_huy || 'Không có lý do chi tiết'}"</span>
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

      {/* Giao diện cuộc gọi & Xác nhận */}
      {isUnconfirmedState && (
        <div className="bg-slate-50 dark:bg-zinc-800/45 p-5 rounded-2xl border border-slate-150 dark:border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-700/50 pb-3">
            <h4 className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone size={14} className="text-emerald-600 dark:text-emerald-450" />
              Giao diện cuộc gọi & Xác nhận
            </h4>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
              selectedAppointment.trang_thai === 'chua_xac_nhan'
                ? 'bg-amber-100 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border border-amber-200/40 dark:border-amber-900/30'
                : 'bg-blue-100 dark:bg-blue-955/20 text-blue-700 dark:text-blue-450 border border-blue-200/40 dark:border-blue-900/30'
            }`}>
              {selectedAppointment.trang_thai === 'chua_xac_nhan' ? 'Chưa xác nhận' : 'Chờ xác nhận'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-450 dark:text-zinc-555 uppercase tracking-wider">Số điện thoại liên hệ</p>
              <a
                href={`tel:${selectedAppointment.so_dien_thoai}`}
                className="text-2xl font-black text-slate-800 dark:text-zinc-150 font-mono tracking-wide hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors flex items-center gap-2 group"
                title="Nhấp để gọi điện"
              >
                {selectedAppointment.so_dien_thoai}
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 group-hover:scale-110 transition-transform">
                  <PhoneCall size={14} className="animate-pulse" />
                </span>
              </a>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-200/60 dark:border-zinc-700/50 pt-3">
            <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">Ghi chú nội bộ / Nhật ký cuộc gọi</label>
            <textarea
              rows={4}
              value={localGhiChuNoiBo}
              onChange={(e) => setLocalGhiChuNoiBo(e.target.value)}
              placeholder="Nhập ghi chú cuộc gọi, lý do đổi lịch hoặc phản hồi của khách hàng tại đây..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold font-mono leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
