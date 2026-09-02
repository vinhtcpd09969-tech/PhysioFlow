import React from 'react';
import { Activity, Sparkles, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface BookingServiceSectionProps {
  bookingType: 'kham' | 'dich_vu';
  setBookingType: (type: 'kham' | 'dich_vu') => void;
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
  services: any[];
  servicesLoading: boolean;
}

export const BookingServiceSection: React.FC<BookingServiceSectionProps> = ({
  bookingType,
  setBookingType,
  selectedServiceId,
  setSelectedServiceId,
  services,
  servicesLoading
}) => {
  const filteredServices = services.filter(s =>
    bookingType === 'kham'
      ? s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM'
      : s.loai_goi !== 'KHAM' && s.loai_dich_vu !== 'KHAM'
  );

  return (
    <div className="space-y-6 pb-8 border-b border-slate-100">
      <div className="flex items-center gap-3 pb-1">
        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
          <Activity size={18} />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
            1. Chọn loại hình &amp; Dịch vụ
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Lượng giá chức năng chuyên sâu hoặc Dịch vụ vật lý trị liệu lẻ
          </p>
        </div>
      </div>

      {/* Booking Type Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setBookingType('kham')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            bookingType === 'kham'
              ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Buổi Lượng giá ban đầu</span>
        </button>

        <button
          type="button"
          onClick={() => setBookingType('dich_vu')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            bookingType === 'dich_vu'
              ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <Sparkles size={16} />
          <span>Dịch vụ Trị liệu lẻ</span>
        </button>
      </div>

      {/* Services List Grid */}
      {servicesLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="animate-spin text-teal-600" size={28} />
          <span className="text-xs font-bold">Đang tải danh sách dịch vụ...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredServices.map(service => {
            const isSelected = selectedServiceId === service.id;
            return (
              <div
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 text-teal-600">
                    <CheckCircle2 size={18} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {service.thoi_luong_phut || 30} phút
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mt-2 line-clamp-1">
                    {service.ten_goi || service.ten_dich_vu}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {service.mo_ta || service.quy_trinh || 'Trị liệu phục hồi chức năng chuyên sâu chuẩn y khoa.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">Đơn giá</span>
                  <span className="text-sm font-black text-teal-600">
                    {formatCurrency(service.don_gia || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
