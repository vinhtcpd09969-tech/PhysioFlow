import { useEffect, useState } from 'react';
import { Ticket, X } from 'lucide-react';
import { Voucher } from './VoucherCard';

const PAYMENT_METHOD_OPTIONS: { value: 'tra_thang' | 'tung_buoi'; label: string }[] = [
  { value: 'tra_thang', label: 'Trả thẳng 100%' },
  { value: 'tung_buoi', label: 'Từng buổi (liệu trình)' },
];

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingVoucher: Partial<Voucher> | null;
  loaiGiam: 'phan_tram' | 'so_tien_co_dinh';
  setLoaiGiam: (val: 'phan_tram' | 'so_tien_co_dinh') => void;
  yeuCauThanhToan: string[];
  setYeuCauThanhToan: (val: string[]) => void;
  tuDongApDung: boolean;
  setTuDongApDung: (val: boolean) => void;
  loaiGoiApDung: string[];
  setLoaiGoiApDung: (val: string[]) => void;
  formatLocalDate: (date: Date) => string;
}

export function VoucherFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingVoucher,
  loaiGiam,
  setLoaiGiam,
  yeuCauThanhToan,
  setYeuCauThanhToan,
  tuDongApDung,
  setTuDongApDung,
  loaiGoiApDung,
  setLoaiGoiApDung,
  formatLocalDate
}: VoucherFormModalProps) {
  const [giaTriGiam, setGiaTriGiam] = useState('');
  const [giamToiDa, setGiamToiDa] = useState('');
  const [donHangToiThieu, setDonHangToiThieu] = useState('');
  const [soLuongToiDa, setSoLuongToiDa] = useState('');
  const [maVoucher, setMaVoucher] = useState('');
  const [tenChienDich, setTenChienDich] = useState('');
  const [maVoucherTouched, setMaVoucherTouched] = useState(false);
  const [tenChienDichTouched, setTenChienDichTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setGiaTriGiam(editingVoucher?.gia_tri_giam != null ? String(editingVoucher.gia_tri_giam) : '');
    setGiamToiDa(editingVoucher?.giam_toi_da != null ? String(editingVoucher.giam_toi_da) : '');
    setDonHangToiThieu(editingVoucher?.don_hang_toi_thieu != null ? String(editingVoucher.don_hang_toi_thieu) : '0');
    setSoLuongToiDa(editingVoucher?.so_luong_toi_da != null ? String(editingVoucher.so_luong_toi_da) : '');
    setMaVoucher(editingVoucher?.ma_voucher || '');
    setTenChienDich(editingVoucher?.ten_chien_dich || '');
    setMaVoucherTouched(false);
    setTenChienDichTouched(false);
  }, [isOpen, editingVoucher]);

  useEffect(() => {
    const isLieuTrinhApplicable = loaiGoiApDung.includes('tat_ca') || loaiGoiApDung.includes('LIEU_TRINH');
    if (!isLieuTrinhApplicable) {
      setYeuCauThanhToan(['tra_thang']);
    }
  }, [loaiGoiApDung, setYeuCauThanhToan]);

  if (!isOpen) return null;

  const toggleAllPaymentMethods = () => setYeuCauThanhToan(['tat_ca']);
  const togglePaymentMethod = (value: string) => {
    setYeuCauThanhToan(
      yeuCauThanhToan.includes(value)
        ? yeuCauThanhToan.filter((v) => v !== value)
        : [...yeuCauThanhToan.filter((v) => v !== 'tat_ca'), value]
    );
  };



  const toggleAllLoaiGoi = () => setLoaiGoiApDung(['tat_ca']);
  const toggleLoaiGoi = (val: string) => {
    setLoaiGoiApDung(
      loaiGoiApDung.includes(val)
        ? loaiGoiApDung.filter((v) => v !== val)
        : [...loaiGoiApDung.filter((v) => v !== 'tat_ca'), val]
    );
  };

  // Lỗi hiển thị ngay khi nhập
  const giaTriGiamError = (() => {
    if (giaTriGiam === '') return '';
    const n = Number(giaTriGiam);
    if (Number.isNaN(n)) return 'Giá trị không hợp lệ';
    if (loaiGiam === 'phan_tram') {
      if (n < 1) return 'Phải lớn hơn hoặc bằng 1%';
      if (n > 100) return 'Không được vượt quá 100%';
    } else if (n < 1) {
      return 'Phải lớn hơn hoặc bằng 1đ';
    }
    return '';
  })();
  const maVoucherError = maVoucherTouched && !maVoucher.trim() ? 'Vui lòng nhập mã voucher' : '';
  const tenChienDichError = tenChienDichTouched && !tenChienDich.trim() ? 'Vui lòng nhập tên chiến dịch' : '';
  const giamToiDaError = (() => {
    if (giamToiDa === '') return '';
    const n = Number(giamToiDa);
    if (Number.isNaN(n) || n <= 0) return 'Phải lớn hơn 0 (hoặc để trống)';
    return '';
  })();
  const donHangToiThieuError = (() => {
    if (donHangToiThieu === '') return '';
    const n = Number(donHangToiThieu);
    if (Number.isNaN(n) || n < 0) return 'Không được âm';
    return '';
  })();
  const soLuongToiDaError = (() => {
    if (soLuongToiDa === '') return '';
    const n = Number(soLuongToiDa);
    if (Number.isNaN(n) || n < 1 || !Number.isInteger(n)) return 'Phải là số nguyên từ 1 trở lên (hoặc để trống)';
    return '';
  })();
  const hasFieldError = !!(
    giaTriGiamError || giamToiDaError || donHangToiThieuError || soLuongToiDaError ||
    !maVoucher.trim() || !tenChienDich.trim()
  );

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setMaVoucherTouched(true);
    setTenChienDichTouched(true);
    if (hasFieldError) {
      e.preventDefault();
      return;
    }
    onSubmit(e);
  };

  const errorInputClass = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';
  const normalInputClass = 'border-slate-200 focus:border-primary focus:ring-primary/20';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
              {editingVoucher?.id ? 'Chỉnh sửa Ưu đãi / Voucher' : 'Thiết lập chiến dịch mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="ma_voucher" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mã Voucher *
              </label>
              <input
                id="ma_voucher"
                name="ma_voucher"
                value={maVoucher}
                onChange={(e) => setMaVoucher(e.target.value)}
                onBlur={() => setMaVoucherTouched(true)}
                required
                placeholder="VD: CHUNGHE2026"
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm transition-all bg-slate-50/30 ${maVoucherError ? errorInputClass : normalInputClass}`}
              />
              {maVoucherError && <p className="text-[10px] text-rose-500 font-bold mt-1">{maVoucherError}</p>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="ten_chien_dich" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tên chiến dịch *
              </label>
              <input
                id="ten_chien_dich"
                name="ten_chien_dich"
                value={tenChienDich}
                onChange={(e) => setTenChienDich(e.target.value)}
                onBlur={() => setTenChienDichTouched(true)}
                required
                placeholder="VD: Tri ân khách hàng"
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 transition-colors ${tenChienDichError ? errorInputClass : normalInputClass}`}
              />
              {tenChienDichError && <p className="text-[10px] text-rose-500 font-bold mt-1">{tenChienDichError}</p>}
            </div>

            <div>
              <label htmlFor="loai_giam" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Loại giảm trừ
              </label>
              <select
                id="loai_giam"
                name="loai_giam"
                value={loaiGiam}
                onChange={(e) => setLoaiGiam(e.target.value as 'phan_tram' | 'so_tien_co_dinh')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white cursor-pointer"
              >
                <option value="phan_tram">Phần trăm (%)</option>
                <option value="so_tien_co_dinh">Số tiền cố định (VNĐ)</option>
              </select>
            </div>
            <div>
              <label htmlFor="gia_tri_giam" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Giá trị giảm *
              </label>
              <input
                id="gia_tri_giam"
                name="gia_tri_giam"
                type="number"
                value={giaTriGiam}
                onChange={(e) => setGiaTriGiam(e.target.value)}
                required
                min={1}
                max={loaiGiam === 'phan_tram' ? 100 : undefined}
                step={1}
                placeholder={loaiGiam === 'phan_tram' ? 'Ví dụ: 10 (tối đa 100)' : 'Ví dụ: 100000 (đ)'}
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 font-semibold text-secondary transition-colors ${giaTriGiamError ? errorInputClass : normalInputClass}`}
              />
              {giaTriGiamError && <p className="text-[10px] text-rose-500 font-bold mt-1">{giaTriGiamError}</p>}
            </div>

            {loaiGiam === 'phan_tram' && (
              <div>
                <label htmlFor="giam_toi_da" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Giảm tối đa (VNĐ)
                </label>
                <input
                  id="giam_toi_da"
                  type="text"
                  inputMode="numeric"
                  value={giamToiDa ? Number(giamToiDa).toLocaleString('vi-VN') : ''}
                  onChange={(e) => setGiamToiDa(e.target.value.replace(/\D/g, ''))}
                  placeholder="Để trống nếu không giới hạn"
                  className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 transition-colors ${giamToiDaError ? errorInputClass : normalInputClass}`}
                />
                <input type="hidden" name="giam_toi_da" value={giamToiDa} />
                {giamToiDaError && <p className="text-[10px] text-rose-500 font-bold mt-1">{giamToiDaError}</p>}
              </div>
            )}
            <div>
              <label htmlFor="don_hang_toi_thieu" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Đơn tối thiểu (VNĐ)
              </label>
              <input
                id="don_hang_toi_thieu"
                type="text"
                inputMode="numeric"
                value={donHangToiThieu ? Number(donHangToiThieu).toLocaleString('vi-VN') : ''}
                onChange={(e) => setDonHangToiThieu(e.target.value.replace(/\D/g, ''))}
                placeholder="Ví dụ: 200.000"
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 transition-colors ${donHangToiThieuError ? errorInputClass : normalInputClass}`}
              />
              <input type="hidden" name="don_hang_toi_thieu" value={donHangToiThieu} />
              {donHangToiThieuError && <p className="text-[10px] text-rose-500 font-bold mt-1">{donHangToiThieuError}</p>}
            </div>

            <div>
              <label htmlFor="so_luong_toi_da" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Số lượt tối đa / 1 khách hàng
              </label>
              <input
                id="so_luong_toi_da"
                name="so_luong_toi_da"
                type="number"
                value={soLuongToiDa}
                onChange={(e) => setSoLuongToiDa(e.target.value)}
                min={1}
                step={1}
                placeholder="Để trống nếu không giới hạn"
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 transition-colors ${soLuongToiDaError ? errorInputClass : normalInputClass}`}
              />
              {soLuongToiDaError ? (
                <p className="text-[10px] text-rose-500 font-bold mt-1">{soLuongToiDaError}</p>
              ) : (
                <p className="text-[10px] text-slate-400 font-medium mt-1">Mỗi khách dùng mã này tối đa bấy nhiêu lần.</p>
              )}
            </div>

            <div>
              <label htmlFor="ngay_bat_dau" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ngày bắt đầu *
              </label>
              <input
                id="ngay_bat_dau"
                name="ngay_bat_dau"
                type="date"
                defaultValue={editingVoucher?.ngay_bat_dau ? editingVoucher.ngay_bat_dau.split('T')[0] : formatLocalDate(new Date())}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>
            <div>
              <label htmlFor="ngay_het_han" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ngày hết hạn
              </label>
              <input
                id="ngay_het_han"
                name="ngay_het_han"
                type="date"
                defaultValue={editingVoucher?.ngay_het_han ? editingVoucher.ngay_het_han.split('T')[0] : ''}
                placeholder="Không giới hạn"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>

            {/* --- CẤU HÌNH ĐIỀU KIỆN TỰ ĐỘNG & BỘ LỌC NÂNG CAO --- */}
            <div className="col-span-2 border-t border-slate-100 dark:border-zinc-800 pt-5 space-y-4">
              
              {/* TỰ ĐỘNG ÁP DỤNG SWITCH */}
              <div className="p-4 bg-purple-50/60 dark:bg-purple-955/30 rounded-2xl border border-purple-200/70 dark:border-purple-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-200 block">
                    ⚡ Tự động áp dụng voucher này
                  </span>
                  <p className="text-[10px] text-purple-700/80 dark:text-purple-300/80 font-medium mt-0.5">
                    Hệ thống sẽ tự động kích hoạt mã khi đơn hàng thỏa điều kiện (khách không cần nhập mã tay).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTuDongApDung(!tuDongApDung)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    tuDongApDung ? 'bg-purple-600' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      tuDongApDung ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>



              {/* LOẠI GÓI / DỊCH VỤ ÁP DỤNG */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  🏥 Loại dịch vụ áp dụng
                </label>
                <div className="flex flex-wrap gap-2">
                  <label
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${
                      loaiGoiApDung.includes('tat_ca')
                        ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-955/50 dark:text-amber-200'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={loaiGoiApDung.includes('tat_ca')}
                      onChange={toggleAllLoaiGoi}
                      className="accent-amber-600"
                    />
                    Tất cả dịch vụ
                  </label>

                  <label
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${
                      loaiGoiApDung.includes('LIEU_TRINH')
                        ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-955/50 dark:text-amber-200'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={loaiGoiApDung.includes('LIEU_TRINH')}
                      onChange={() => toggleLoaiGoi('LIEU_TRINH')}
                      className="accent-amber-600"
                    />
                    📋 Gói liệu trình PHCN
                  </label>

                  <label
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${
                      loaiGoiApDung.includes('KHAM')
                        ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-955/50 dark:text-amber-200'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={loaiGoiApDung.includes('KHAM')}
                      onChange={() => toggleLoaiGoi('KHAM')}
                      className="accent-amber-600"
                    />
                    🩺 Buổi Lượng giá Chức năng
                  </label>

                  <label
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${
                      loaiGoiApDung.includes('LE')
                        ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-955/50 dark:text-amber-200'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={loaiGoiApDung.includes('LE')}
                      onChange={() => toggleLoaiGoi('LE')}
                      className="accent-amber-600"
                    />
                    ⚡ Dịch vụ lẻ
                  </label>
                </div>
              </div>

              {/* HÌNH THỨC THANH TOÁN GÓI (HIỂN THỊ KHI CÓ CHỌN GÓI LIỆU TRÌNH HOẶC TẤT CẢ) */}
              {(() => {
                const hasLieuTrinh = loaiGoiApDung.includes('tat_ca') || loaiGoiApDung.includes('LIEU_TRINH');

                if (!hasLieuTrinh) {
                  return null;
                }

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        💳 Quy định riêng khi mua Gói liệu trình
                      </label>
                      <span className="text-[10.5px] text-teal-600 dark:text-teal-400 font-bold">
                        (Buổi Lượng giá & Dịch vụ lẻ không bị giới hạn)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${
                          yeuCauThanhToan.includes('tat_ca')
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={yeuCauThanhToan.includes('tat_ca')}
                          onChange={toggleAllPaymentMethods}
                          className="accent-primary"
                        />
                        Tất cả hình thức gói
                      </label>
                      {PAYMENT_METHOD_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${
                            yeuCauThanhToan.includes(opt.value)
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={yeuCauThanhToan.includes(opt.value)}
                            onChange={() => togglePaymentMethod(opt.value)}
                            className="accent-primary"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-zinc-400 italic">
                      💡 Mẹo: Khi khách hàng dùng mã này để thanh toán <strong>Buổi Lượng giá</strong> hoặc <strong>Dịch vụ lẻ</strong>, mã vẫn áp dụng bình thường mà không bị ảnh hưởng bởi lựa chọn Trả thẳng / Từng buổi của Gói liệu trình.
                    </p>
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-650 dark:text-zinc-300 font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-sm cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all text-sm cursor-pointer active:scale-95"
            >
              {editingVoucher?.id ? 'Lưu thay đổi' : 'Kích hoạt ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
