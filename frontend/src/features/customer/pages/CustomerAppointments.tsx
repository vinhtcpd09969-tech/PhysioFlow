import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  AlertCircle, 
  XCircle, 
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../api/axios';

interface Appointment {
  id: string;
  ma_lich_dat: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  trang_thai: string;
  loai_lich: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  ten_dich_vu: string | null;
  ten_ky_thuat_vien: string | null;
  ten_phong: string | null;
  chan_doan: string | null;
  chong_chi_dinh: string | null;
  ly_do_huy: string | null;
  thoi_gian_huy: string | null;
  ly_do_kham: string | null;
  thoi_gian_tao: string;
}

export default function CustomerAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [lyDoHuy, setLyDoHuy] = useState<string>('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/client/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách lịch hẹn:', error);
      toast.error('Không thể tải danh sách lịch hẹn của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingId || !lyDoHuy.trim()) {
      toast.error('Vui lòng cung cấp lý do hủy lịch hẹn!');
      return;
    }

    const toastId = toast.loading('Đang gửi yêu cầu hủy lịch hẹn...');
    try {
      await api.patch(`/client/appointments/${cancellingId}/cancel`, { ly_do_huy: lyDoHuy });
      toast.success('Đã hủy lịch hẹn thành công!', { id: toastId });
      setCancellingId(null);
      setLyDoHuy('');
      fetchAppointments();
    } catch (error: any) {
      console.error('Lỗi khi hủy lịch hẹn:', error);
      toast.error(error.response?.data?.message || 'Không thể hủy lịch hẹn.', { id: toastId });
    }
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return { dateStr, timeStr };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cho_xac_nhan':
        return (
          <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-250 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Chờ Lễ Tân Duyệt
          </span>
        );
      case 'da_xac_nhan':
        return (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Đã Xác Nhận
          </span>
        );
      case 'da_huy':
        return (
          <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-250 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Đã Hủy Lịch
          </span>
        );
      case 'hoan_thanh':
        return (
          <span className="text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Đã Khám Xong
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-secondary flex items-center gap-2.5">
            <Calendar className="text-primary" size={32} />
            Lịch hẹn của tôi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý, đổi giờ hoặc hủy các cuộc hẹn khám lượng giá tại PhysioFlow.
          </p>
        </div>

        <button 
          onClick={() => navigate('/booking')}
          className="flex items-center gap-2 bg-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-xs"
        >
          <PlusCircle size={16} /> Đặt lịch khám mới
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="bg-white rounded-[24px] border border-gray-100 p-16 text-center space-y-4 shadow-sm flex flex-col items-center justify-center">
          <RefreshCw className="animate-spin text-primary size-10" />
          <p className="text-sm font-semibold text-gray-400">Đang đồng bộ danh sách lịch khám của bạn...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-dashed border-gray-200 p-16 text-center space-y-6">
          <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div className="max-w-sm mx-auto space-y-2">
            <h3 className="font-heading font-black text-lg text-secondary">Bạn chưa có lịch khám nào</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-semibold">
              Đăng ký ngay một buổi lượng giá lâm sàng và lập phác đồ trị liệu 100% miễn phí cùng Bác sĩ Chuyên khoa.
            </p>
          </div>
          <button 
            onClick={() => navigate('/booking')}
            className="bg-primary hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-xs transition-all active:scale-95"
          >
            Đăng ký Khám ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((app) => {
            const { dateStr, timeStr } = formatDateTime(app.ngay_gio_bat_dau);
            return (
              <div 
                key={app.id}
                className="bg-white rounded-[24px] border border-gray-150 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                {/* Ticket notches left and right */}
                <div className="absolute -left-2 top-24 size-4 bg-background rounded-full border-r border-gray-150"></div>
                <div className="absolute -right-2 top-24 size-4 bg-background rounded-full border-l border-gray-150"></div>

                {/* E-Pass Header */}
                <div className="p-6 pb-4 border-b border-dashed border-gray-150">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {app.ma_lich_dat}
                    </span>
                    {getStatusBadge(app.trang_thai)}
                  </div>
                  
                  <h3 className="font-heading font-black text-secondary text-base leading-tight">
                    {app.ten_dich_vu || 'Khám Lâm sàng & Lượng giá'}
                  </h3>
                  
                  <p className="text-xs text-zinc-400 mt-1">Khám chẩn đoán cùng Bác sĩ Chuyên khoa</p>
                </div>

                {/* E-Pass Details */}
                <div className="p-6 pt-5 space-y-4 flex-1">
                  <div className="flex items-start gap-3.5 text-xs text-gray-500">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-secondary text-sm">{timeStr}</p>
                      <p className="font-medium text-gray-400 mt-0.5">{dateStr}</p>
                    </div>
                  </div>

                  {(app.trang_thai === 'cho_xac_nhan' || app.trang_thai === 'da_xac_nhan' || app.trang_thai === 'hoan_thanh') && (
                    <div className="space-y-3 pt-3.5 border-t border-gray-100">
                      <div className="flex items-center gap-3.5 text-xs text-gray-500">
                        <User className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="font-semibold">
                          Bác sĩ / KTV phụ trách:{' '}
                          <span className={app.ten_ky_thuat_vien ? "text-secondary font-bold" : "text-amber-500 font-semibold italic"}>
                            {app.ten_ky_thuat_vien || 'Đang chờ phân công'}
                          </span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3.5 text-xs text-gray-500">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="font-semibold">
                          Phòng lâm sàng:{' '}
                          <span className={app.ten_phong ? "text-secondary font-bold" : "text-amber-500 font-semibold italic"}>
                            {app.ten_phong || 'Đang chờ xếp phòng'}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  {app.trang_thai === 'cho_xac_nhan' && (
                    <div className="bg-[#E6F4F1] p-3.5 rounded-xl border border-primary/10 text-[11px] text-gray-600 leading-relaxed font-semibold">
                      Lịch hẹn đang chờ phê duyệt. Bạn sẽ nhận được thông báo ngay tại đây khi lễ tân xác thực.
                    </div>
                  )}

                  {app.trang_thai === 'da_huy' && (
                    <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-100 text-[11px] text-rose-700 leading-relaxed font-semibold">
                      <p className="font-bold flex items-center gap-1"><XCircle size={14} /> Lý do hủy lịch hẹn:</p>
                      <p className="text-gray-500 mt-1 font-medium italic">"{app.ly_do_huy || 'Không có lý do chi tiết'}"</p>
                    </div>
                  )}
                </div>

                {/* E-Pass Actions */}
                {(app.trang_thai === 'cho_xac_nhan' || app.trang_thai === 'da_xac_nhan') && (
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => setCancellingId(app.id)}
                      className="w-full bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 border border-zinc-150 hover:border-rose-200 text-secondary font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all"
                    >
                      Hủy lịch hẹn
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* CANCEL APPOINTMENT CONFIRMATION MODAL */}
      {cancellingId && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-md border border-gray-150 animate-slide-up">
            
            <form onSubmit={handleCancelSubmit} className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-[20px] flex items-center justify-center mx-auto border border-rose-100">
                  <XCircle size={28} />
                </div>
                <h3 className="text-xl font-heading font-black text-secondary">Hủy lịch hẹn khám?</h3>
                <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                  Lịch hẹn sẽ bị hủy bỏ hoàn toàn trên hệ thống. Xin vui lòng cho chúng tôi biết lý do của bạn.
                </p>
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="lyDoHuyInput" className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Lý do hủy lịch *</label>
                <textarea
                  id="lyDoHuyInput"
                  rows={3}
                  required
                  value={lyDoHuy}
                  onChange={(e) => setLyDoHuy(e.target.value)}
                  placeholder="VD: Tôi có việc bận đột xuất..."
                  className="w-full bg-zinc-50 border border-gray-250 focus:border-primary p-4 rounded-xl text-xs font-semibold resize-none outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  className="bg-rose-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-xs transition-all"
                >
                  Xác nhận hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCancellingId(null);
                    setLyDoHuy('');
                  }}
                  className="bg-zinc-50 hover:bg-zinc-100 text-secondary font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl border border-gray-200 transition-all"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
