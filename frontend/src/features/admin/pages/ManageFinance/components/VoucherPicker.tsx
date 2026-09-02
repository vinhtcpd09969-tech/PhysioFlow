import { useEffect, useMemo, useRef, useState } from 'react';
import { CreditCard, Ticket, X, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../../../api/axios';
import { formatCurrency } from '../../../../../utils/format';
import { formatVoucherPaymentMethods } from '../../../../../utils/voucherPaymentMethod';

export interface VoucherOption {
  id: string;
  ma_voucher: string;
  ten_khuyen_mai?: string;
  ten_chien_dich?: string;
  ten_voucher?: string;
  loai_giam: string;
  gia_tri_giam: number;
  giam_toi_da: number | null;
  don_hang_toi_thieu: number;
  so_luong_toi_da: number | null;
  ngay_het_han: string | null;
  yeu_cau_thanh_toan: string[];
  tu_dong_ap_dung?: boolean;
  loai_goi_ap_dung?: string[];
}

interface VoucherPickerProps {
  appliedVoucher: any | null;
  onApply: (code: string, isSilent?: boolean) => void;
  onRemove: () => void;
  disabled?: boolean;
  /** Giá trị đơn hàng hiện tại (gia_goc_goi) — dùng để chỉ hiển thị voucher đủ điều kiện đơn tối thiểu. */
  orderValue?: number;
  /** Hình thức thanh toán đang chọn — dùng để lọc voucher giới hạn theo hình thức. */
  loaiThanhToan?: 'tra_thang' | 'tung_buoi';
  /** Khách hàng đang checkout — dùng để kiểm tra giới hạn lượt dùng theo TỪNG khách. */
  khachHangId?: string;
  kenh?: 'online' | 'tai_quay';
  loaiGoi?: 'KHAM' | 'LE' | 'LIEU_TRINH';
  /** Tùy chọn truyền trực tiếp danh sách vouchers nếu đã load sẵn ở ngoài */
  availableVouchers?: VoucherOption[];
}

export const normalizeArrayProp = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {}
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    return [trimmed];
  }
  return [String(val)];
};

const isPercent = (loaiGiam: string) => loaiGiam === 'phan_tram' || loaiGiam === 'percentage';

export const isVoucherEligible = (
  v: Partial<VoucherOption>,
  orderValue: number,
  loaiThanhToan?: 'tra_thang' | 'tung_buoi',
  _kenh: 'online' | 'tai_quay' = 'tai_quay',
  loaiGoi?: 'KHAM' | 'LE' | 'LIEU_TRINH'
) => {
  if (orderValue < Number(v.don_hang_toi_thieu || 0)) return false;

  const yeuCauThanhToan = normalizeArrayProp(v.yeu_cau_thanh_toan);
  if (yeuCauThanhToan.length > 0 && !yeuCauThanhToan.includes('tat_ca')) {
    if (loaiGoi === 'LIEU_TRINH' && loaiThanhToan && !yeuCauThanhToan.includes(loaiThanhToan)) {
      return false;
    }
  }

  const loaiGoiApDung = normalizeArrayProp(v.loai_goi_ap_dung);
  if (loaiGoiApDung.length > 0 && !loaiGoiApDung.includes('tat_ca')) {
    if (loaiGoi && !loaiGoiApDung.includes(loaiGoi)) return false;
  }

  return true;
};

export const calculateVoucherDiscount = (
  v: Partial<VoucherOption> | null | undefined,
  orderValue: number
): number => {
  if (!v || !orderValue || orderValue <= 0) return 0;
  const giaTriGiam = Number(v.gia_tri_giam || 0);
  if (isPercent(v.loai_giam || '')) {
    const rawDisc = Math.round(orderValue * (giaTriGiam / 100));
    const giamToiDa = v.giam_toi_da ? Number(v.giam_toi_da) : null;
    return giamToiDa ? Math.min(rawDisc, giamToiDa) : rawDisc;
  }
  return Math.min(giaTriGiam, orderValue);
};

export const getVoucherIneligibleReason = (
  v: Partial<VoucherOption>,
  orderValue: number,
  loaiThanhToan?: 'tra_thang' | 'tung_buoi',
  _kenh: 'online' | 'tai_quay' = 'tai_quay',
  loaiGoi?: 'KHAM' | 'LE' | 'LIEU_TRINH'
): string | null => {
  if (orderValue < Number(v.don_hang_toi_thieu || 0)) {
    return `Đơn tối thiểu ${formatCurrency(Number(v.don_hang_toi_thieu))}`;
  }

  const loaiGoiApDung = normalizeArrayProp(v.loai_goi_ap_dung);
  if (loaiGoiApDung.length > 0 && !loaiGoiApDung.includes('tat_ca')) {
    if (loaiGoi && !loaiGoiApDung.includes(loaiGoi)) {
      const labels = loaiGoiApDung.map(l => l === 'LIEU_TRINH' ? 'Gói liệu trình' : l === 'KHAM' ? 'Lượng giá' : l === 'LE' ? 'Dịch vụ lẻ' : l).join(', ');
      return `Chỉ áp dụng: ${labels}`;
    }
  }

  const yeuCauThanhToan = normalizeArrayProp(v.yeu_cau_thanh_toan);
  if (yeuCauThanhToan.length > 0 && !yeuCauThanhToan.includes('tat_ca')) {
    if (loaiGoi === 'LIEU_TRINH' && loaiThanhToan && !yeuCauThanhToan.includes(loaiThanhToan)) {
      return `Chỉ áp dụng: ${formatVoucherPaymentMethods(yeuCauThanhToan)}`;
    }
  }

  return null;
};

const formatDiscount = (v: { loai_giam: string; gia_tri_giam: number; giam_toi_da?: number | null }) =>
  isPercent(v.loai_giam)
    ? `Giảm ${v.gia_tri_giam}%${v.giam_toi_da ? ` (tối đa ${formatCurrency(v.giam_toi_da)})` : ''}`
    : `Giảm ${formatCurrency(v.gia_tri_giam)}`;

export default function VoucherPicker({
  appliedVoucher,
  onApply,
  onRemove,
  disabled,
  orderValue = 0,
  loaiThanhToan,
  khachHangId,
  kenh = 'tai_quay',
  loaiGoi,
  availableVouchers,
}: VoucherPickerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [vouchers, setVouchers] = useState<VoucherOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);

  // Flag để nhớ khi người dùng chủ động tắt / bỏ chọn mã -> không tự động ép lại
  const userExplicitlyRemovedRef = useRef(false);

  // Danh sách voucher thực tế (từ props hoặc fetch từ API)
  const allVouchers = availableVouchers || vouchers;

  // Lọc và sắp xếp: Voucher đủ điều kiện giảm tiền nhiều nhất lên đầu
  const sortedVouchers = useMemo(() => {
    return [...allVouchers].map((v) => {
      const eligible = isVoucherEligible(v, orderValue, loaiThanhToan, kenh, loaiGoi);
      const discount = eligible ? calculateVoucherDiscount(v, orderValue) : 0;
      const ineligibleReason = eligible ? null : getVoucherIneligibleReason(v, orderValue, loaiThanhToan, kenh, loaiGoi);
      return {
        ...v,
        isEligible: eligible,
        discountAmount: discount,
        ineligibleReason,
      };
    }).sort((a, b) => {
      // Đủ điều kiện xếp trước
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      // Trong nhóm đủ điều kiện, giảm nhiều tiền nhất lên đầu
      return b.discountAmount - a.discountAmount;
    });
  }, [allVouchers, orderValue, loaiThanhToan, kenh, loaiGoi]);

  // Load vouchers nếu chưa có từ props
  useEffect(() => {
    if (availableVouchers) return;
    setLoading(true);
    const endpoint = kenh === 'online' ? '/client/vouchers/active' : '/receptionist/vouchers/active';
    const params = khachHangId ? { khach_hang_id: khachHangId } : {};
    axiosInstance
      .get(endpoint, { params })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.vouchers || []);
        setVouchers(list);
      })
      .catch(() => setVouchers([]))
      .finally(() => setLoading(false));
  }, [khachHangId, kenh, availableVouchers]);

  // TỰ ĐỘNG ÁP DỤNG: CHỈ tự động áp dụng khi voucher đủ điều kiện VÀ CÓ TICK "Tự động áp dụng" (tu_dong_ap_dung === true)
  useEffect(() => {
    if (userExplicitlyRemovedRef.current) return;
    if (appliedVoucher) return;
    if (orderValue <= 0) return;
    if (loading) return;
    if (sortedVouchers.length === 0) return;

    // Tìm voucher đủ điều kiện CÓ TICK TỰ ĐỘNG ÁP DỤNG và có số tiền giảm cao nhất
    const bestAutoEligible = sortedVouchers.find(
      (v) => v.isEligible && v.discountAmount > 0 && Boolean(v.tu_dong_ap_dung)
    );
    if (bestAutoEligible) {
      onApply(bestAutoEligible.ma_voucher, true);
    }
  }, [sortedVouchers, orderValue, appliedVoucher, loading]);

  // Kiểm tra tính hợp lệ của voucher đang áp khi thay đổi điều kiện đơn hàng hoặc danh sách voucher của khách
  useEffect(() => {
    if (!appliedVoucher) return;
    if (loading) return;

    // Nếu danh sách voucher khả dụng đã load, kiểm tra mã đang áp có còn trong danh sách không
    if (allVouchers.length > 0) {
      const stillInList = allVouchers.some(
        (v) => v.ma_voucher?.toUpperCase() === appliedVoucher.ma_voucher?.toUpperCase()
      );
      if (!stillInList) {
        onRemove();
        return;
      }
    }

    if (!isVoucherEligible(appliedVoucher, orderValue, loaiThanhToan, kenh, loaiGoi)) {
      onRemove();
    }
  }, [appliedVoucher, allVouchers, loading, orderValue, loaiThanhToan, kenh, loaiGoi]);

  // Đồng bộ inputCode khi có appliedVoucher
  useEffect(() => {
    if (appliedVoucher?.ma_voucher) {
      setInputCode(appliedVoucher.ma_voucher);
    } else {
      setInputCode('');
    }
  }, [appliedVoucher]);

  const handleApplyManual = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    userExplicitlyRemovedRef.current = false;
    setApplying(true);
    try {
      await onApply(code, false);
      setModalOpen(false);
    } finally {
      setApplying(false);
    }
  };

  const handleSelectVoucherFromModal = (v: typeof sortedVouchers[0]) => {
    if (!v.isEligible) {
      toast.error(`Không thể áp dụng mã: ${v.ineligibleReason || 'Chưa đủ điều kiện'}`);
      return;
    }
    userExplicitlyRemovedRef.current = false;
    onApply(v.ma_voucher, false);
    setModalOpen(false);
  };

  const handleRemove = () => {
    userExplicitlyRemovedRef.current = true;
    setInputCode('');
    onRemove();
    toast.success('Đã bỏ chọn mã giảm giá');
  };

  return (
    <div className="space-y-1.5 font-jakarta text-left select-none">
      {appliedVoucher ? (
        (() => {
          const matchedVoucher = allVouchers.find((v) => v.ma_voucher?.toUpperCase() === appliedVoucher.ma_voucher?.toUpperCase());
          const voucherName = appliedVoucher.ten_khuyen_mai || appliedVoucher.ten_chien_dich || matchedVoucher?.ten_khuyen_mai || matchedVoucher?.ten_chien_dich;
          const discountAmt = calculateVoucherDiscount(appliedVoucher, orderValue);

          return (
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/90 dark:bg-emerald-955/30 border border-emerald-200/90 dark:border-emerald-800/80 rounded-2xl animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5 min-w-0 pr-3">
                <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                  <Ticket size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-100 leading-snug break-words">
                    {voucherName || appliedVoucher.ma_voucher || 'Mã giảm giá'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="text-[10.5px] text-teal-700 dark:text-teal-300 font-bold hover:underline cursor-pointer pt-1 block"
                  >
                    Đổi mã khác (Kho: {allVouchers.length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  -{formatCurrency(discountAmt)}
                </span>
                <button
                  type="button"
                  onClick={handleRemove}
                  title="Gỡ bỏ mã"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Mã giảm giá / Voucher
            </label>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={disabled}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/60 text-pink-600 dark:text-pink-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <CreditCard size={12} className="text-pink-500" />
              <span>Kho mã ({allVouchers.length})</span>
            </button>
          </div>

          <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-1 shadow-2xs focus-within:border-teal-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyManual();
                }
              }}
              disabled={disabled}
              placeholder="NHẬP MÃ GIẢM GIÁ..."
              className="w-full px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 bg-transparent outline-none"
            />
            <button
              type="button"
              onClick={handleApplyManual}
              disabled={disabled || !inputCode.trim() || applying}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {applying ? '...' : 'Áp dụng'}
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL: KHO VOUCHER & MÃ GIẢM GIÁ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] font-jakarta text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Ticket size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-zinc-100 text-sm uppercase tracking-wider">
                    Kho Voucher &amp; Mã Ưu Đãi
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-bold">
                    Giá trị đơn: <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatCurrency(orderValue)}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Danh sách voucher (Xếp cao nhất lên đầu) */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {loading ? (
                <div className="py-12 text-center text-slate-400 font-bold text-xs">
                  Đang tải danh sách voucher khả dụng...
                </div>
              ) : sortedVouchers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold text-xs">
                  Hiện tại trung tâm chưa có mã ưu đãi nào khả dụng.
                </div>
              ) : (
                sortedVouchers.map((v) => {
                  const isApplied = appliedVoucher?.ma_voucher === v.ma_voucher;

                  return (
                    <div
                      key={v.id}
                      className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                        isApplied
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-md shadow-emerald-600/10 dark:bg-emerald-955/30 dark:border-emerald-500'
                          : v.isEligible
                          ? 'bg-white dark:bg-zinc-850 border-slate-200 dark:border-zinc-750 hover:border-teal-500/80 shadow-2xs'
                          : 'bg-slate-50/60 dark:bg-zinc-950/40 border-slate-200/60 dark:border-zinc-850 opacity-60'
                      }`}
                    >
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                            {v.ma_voucher}
                          </span>
                          {v.tu_dong_ap_dung && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800">
                              Tự động
                            </span>
                          )}
                        </div>

                        {v.isEligible ? (
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            -{formatCurrency(v.discountAmount)}
                          </span>
                        ) : null}
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                          {formatDiscount(v)} {v.ten_chien_dich ? `— ${v.ten_chien_dich}` : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-semibold text-slate-400 dark:text-zinc-400">
                          {Number(v.don_hang_toi_thieu) > 0 && (
                            <span>Đơn tối thiểu: {formatCurrency(v.don_hang_toi_thieu)}</span>
                          )}
                          {v.ngay_het_han && (
                            <span>HSD: {new Date(v.ngay_het_han).toLocaleDateString('vi-VN')}</span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Ineligible Reason / Actions */}
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                        {!v.isEligible ? (
                          <span className="text-[10.5px] font-black text-rose-500 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle size={12} /> {v.ineligibleReason}
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                            Khả dụng cho đơn hàng này
                          </span>
                        )}

                        <div>
                          {isApplied ? (
                            <button
                              type="button"
                              onClick={handleRemove}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check size={13} /> Đang áp dụng
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectVoucherFromModal(v)}
                              disabled={!v.isEligible}
                              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:text-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                            >
                              Áp dụng
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
