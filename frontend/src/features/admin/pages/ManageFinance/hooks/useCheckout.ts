import { useEffect, useState, useReducer, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../../../api/axios';
import { getTungBuoiSessionDue } from '../../../../../utils/billing';
import { isVoucherEligible } from '../components/VoucherPicker';

export interface CalculatedCheckoutData {
  ten_item?: string;
  gia_goc?: number;
  loai_goi?: string;
  ten_goi?: string;
  gia_goc_goi?: number;
  so_tien_giam_phuong_thuc?: number;
  giam_tru_kham_truoc_do?: number;
  ma_hoa_don_kham?: string;
  ngay_thanh_toan_kham?: string;
  mien_phi_kham_chua_dong?: number;
  so_tien_giam_voucher?: number;
  tong_tien_thanh_toan?: number;
  tong_tien_goi_sau_giam?: number;
  so_buoi_goi?: number;
  so_tien_dot_1?: number;
  so_tien_dot_2?: number;
  don_gia_buoi?: number;
  don_gia_theo_buoi?: number;
  phan_tram_giam_phuong_thuc?: number;
}

export interface AssignedPackage {
  id?: string;
  ten_goi?: string;
  tong_so_buoi?: number;
  gia_ban?: number;
  gia_niem_yet?: number;
  loai_goi?: string;
}

interface CheckoutState {
  lichDatId: string;
  soTienNhan: string;
  phuongThuc: string;
  hoaDon: any | null;
  loading: boolean;
}

type CheckoutAction =
  | { type: 'SET_FIELD'; field: keyof CheckoutState; value: any }
  | { type: 'SET_HOA_DON'; hoaDon: any }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'RESET_HOA_DON' };

const checkoutReducer = (state: CheckoutState, action: CheckoutAction): CheckoutState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_HOA_DON':
      return { ...state, hoaDon: action.hoaDon };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'RESET_HOA_DON':
      return { ...state, hoaDon: null, soTienNhan: '', phuongThuc: 'tien_mat' };
    default:
      return state;
  }
};

export const useCheckout = (
  queryLichDatId: string | null,
  isCheckoutMode: boolean,
  queryCustomerId?: string | null,
  queryGoiDichVuId?: string | null
) => {
  const lastCalcParamsRef = useRef<string>('');

  const [state, dispatch] = useReducer(checkoutReducer, {
    lichDatId: queryLichDatId || '',
    soTienNhan: '',
    phuongThuc: 'tien_mat',
    hoaDon: null,
    loading: false,
  });

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [loaiThanhToan, setLoaiThanhToan] = useState<'tra_thang' | 'tung_buoi'>('tra_thang');
  const [dangKyGoi, setDangKyGoi] = useState<boolean>(true);
  
  useEffect(() => {
    if (selectedPackage?.loai_goi === 'LE') {
      setLoaiThanhToan('tra_thang');
    }
  }, [selectedPackage]);

  const [maVoucher, setMaVoucher] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [calculatedData, setCalculatedData] = useState<any | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [feedbackLyDo, setFeedbackLyDo] = useState('');
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [checkoutTab, setCheckoutTab] = useState<'single' | 'package'>('package');
  // Admin sửa cấu hình gói SAU khi bác sĩ đã chỉ định: mặc định chốt theo đúng liệu trình + giá đã
  // tư vấn cho khách. Backend chỉ trả `canh_bao_lech_cau_hinh` khi thực sự có lệch, nên bình thường
  // cờ này không tác động gì tới màn hình.
  const [giuTheoTuVan, setGiuTheoTuVan] = useState<boolean>(true);
  const [activePayOSInvoice, setActivePayOSInvoice] = useState<{ invoice: any; amount: number; so_thu_tu_buoi?: number } | null>(null);


  // Load checkout details
  useEffect(() => {
    if (!isCheckoutMode) return;

    const loadCheckoutInfo = async () => {
      dispatch({ type: 'SET_LOADING', loading: true });
      setAppliedVoucher(null);
      setMaVoucher('');
      try {
        const pkgRes = await axiosInstance.get('/receptionist/packages');
        const pkgs = Array.isArray(pkgRes.data) ? pkgRes.data : [];
        setPackages(pkgs);

        let appt;
        if (queryLichDatId) {
          const billInfoRes = await axiosInstance.get(`/receptionist/appointments/${queryLichDatId}/billing-info`);
          appt = billInfoRes.data;
        } else if (queryCustomerId && queryGoiDichVuId) {
          const billInfoRes = await axiosInstance.get(`/receptionist/customers/${queryCustomerId}/billing-info-by-package?package_id=${queryGoiDichVuId}`);
          appt = billInfoRes.data;
        } else {
          const draftRaw = sessionStorage.getItem('draft_walkin_checkin');
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            const targetService = pkgs.find((p: any) => String(p.id) === String(draft.goi_dich_vu_id));
            appt = {
              id: null,
              isDraftWalkin: true,
              draftPayload: draft,
              khach_hang_id: draft.khach_hang_id,
              ten_khach_hang: draft.ho_ten_khach,
              sdt_khach_hang: draft.so_dien_thoai,
              goi_dich_vu_id: draft.goi_dich_vu_id,
              loai_lich: draft.loai_lich || 'kham_moi',
              don_gia_dich_vu: targetService ? targetService.don_gia : 0,
            };
          } else {
            throw new Error('Thiếu thông tin thanh toán');
          }
        }

        setSelectedConsultation(appt);

        if (appt.loai_lich === 'dieu_tri' && appt.hoa_don_goi_id) {
          let sessionPrice = 0;
          const hinhThuc = appt.hinh_thuc_thanh_toan_goi;
          const alreadyPaid = Number(appt.so_tien_da_tra_goi || 0);
          const totalRequired = Number(appt.tong_tien_phai_tra_goi || 0);
          const soThuTu = Number(appt.so_thu_tu_buoi || 1);
          const totalSessions = Number(appt.pd_tong_so_buoi || 10);
 
          if (hinhThuc === 'tra_thang') {
            sessionPrice = 0;
          } else {
            // Nguồn chung duy nhất cho số tiền/buổi — PHẢI khớp đúng công thức backend dùng để ghi
            // sổ (receptionist.service.ts:processPayment), không tự chế công thức khác ở đây, nếu
            // không sẽ lệch số tiền hiển thị vs số tiền thực ghi nhận do làm tròn khác nhau, khiến
            // hóa đơn không bao giờ lên đúng trạng thái "đã thanh toán".
            sessionPrice = getTungBuoiSessionDue(totalRequired, totalSessions, soThuTu, alreadyPaid);
          }
 
          const sessionName = `${appt.pd_ten_goi || appt.ten_dich_vu || 'Gói trị liệu PHCN'} (Buổi ${appt.so_thu_tu_buoi}/${appt.pd_tong_so_buoi || 1})`;
          const mockHoaDon = {
            id: appt.hoa_don_goi_id,
            ma_hoa_don: appt.hoa_don_goi_ma,
            khach_hang_id: appt.khach_hang_id,
            loai_hoa_don: 'dich_vu_don',
            tong_tien_goc: sessionPrice,
            tong_tien_truoc_giam: sessionPrice,
            tong_tien_thanh_toan: sessionPrice,
            so_tien_da_tra: appt.so_tien_da_tra_goi,
            trang_thai: appt.trang_thai_hoa_don_goi,
            ten_item: sessionName,
            ten_dich_vu: sessionName,
            so_buoi_goi: 1,
            ho_ten_khach: appt.ten_khach_hang,
            so_dien_thoai: appt.sdt_khach_hang,
          };
          dispatch({ type: 'SET_HOA_DON', hoaDon: mockHoaDon });
          setCheckoutTab('single');
          setDangKyGoi(false);
        } else {
          // If loai_lich is exam/consultation, OR loai_lich === 'dieu_tri' but no package invoice (retail service session)
          // A kham_moi's own LE chỉ định is informational only (paid later, when that session happens) —
          // it must never hijack this checkout into charging for the LE service instead of the exam fee.
          const targetGoiId = (appt.loai_lich === 'kham_moi' && appt.khuyen_nghi_loai_goi === 'LE')
            ? appt.goi_dich_vu_id
            : (appt.khuyen_nghi_goi_id || appt.goi_dich_vu_id);
          if (targetGoiId) {
            const matchedPkg = pkgs.find((p: any) => String(p.id) === String(targetGoiId));
            if (matchedPkg) {
              setSelectedPackage(matchedPkg);
              if (matchedPkg.loai_goi === 'LIEU_TRINH' || matchedPkg.loai_goi === 'LE') {
                setCheckoutTab('package');
                setDangKyGoi(true);
              } else {
                // Khám thường (không chỉ định gói) — vẫn đi qua tab 'package' để dùng chung
                // pipeline calculateBilling/createBillingDirect đã hỗ trợ mã giảm giá, thay vì
                // luồng 'single' tạo hóa đơn ngay không có chỗ áp voucher.
                setCheckoutTab('package');
                setDangKyGoi(false);
              }
            }
          } else {
            setCheckoutTab('package');
            setDangKyGoi(false);
          }
        }
      } catch (err) {
        toast.error('Không tìm thấy ca điều trị cần thanh toán hoặc ca đã được thanh toán rồi!');
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    };

    loadCheckoutInfo();
  }, [queryLichDatId, isCheckoutMode, queryCustomerId, queryGoiDichVuId]);

  // Load single invoice draft preview (without creating DB row until user confirms payment)
  useEffect(() => {
    if (
      !isCheckoutMode ||
      !selectedConsultation ||
      state.hoaDon ||
      state.loading ||
      (selectedConsultation.loai_lich === 'dieu_tri' && selectedConsultation.hoa_don_goi_id)
    )
      return;

    if (checkoutTab === 'single') {
      const defaultExamPrice = Number(packages.find((p: any) => p.loai_goi === 'KHAM')?.don_gia || 0);
      const draftSingleInvoice = {
        id: null,
        khach_hang_id: selectedConsultation.khach_hang_id,
        ten_dich_vu: selectedConsultation.ten_dich_vu || (selectedConsultation.loai_lich === 'kham_moi' ? 'Buổi Lượng Giá PHCN (Chuyên sâu)' : 'Dịch vụ lẻ PHCN'),
        tong_tien_goc: Number(selectedConsultation.don_gia_dich_vu || defaultExamPrice),
        tong_tien_thanh_toan: Number(selectedConsultation.don_gia_dich_vu || defaultExamPrice),
        da_thanh_toan: 0,
        trang_thai: 'chua_thanh_toan',
        ho_ten_khach: selectedConsultation.ten_khach_hang,
        so_dien_thoai: selectedConsultation.sdt_khach_hang,
      };
      dispatch({ type: 'SET_HOA_DON', hoaDon: draftSingleInvoice });
    }
  }, [checkoutTab, selectedConsultation, isCheckoutMode, packages]);

  // Fetch package calculations
  useEffect(() => {
    if (!isCheckoutMode || checkoutTab !== 'package' || !selectedConsultation) return;

    const defaultExamPrice = Number(packages.find((p: any) => p.loai_goi === 'KHAM')?.don_gia || 0);
    const targetLoaiGoi: 'KHAM' | 'LE' | 'LIEU_TRINH' = (dangKyGoi && selectedPackage)
      ? (selectedPackage.loai_goi === 'LE' ? 'LE' : 'LIEU_TRINH')
      : 'KHAM';
    const orderVal = (dangKyGoi && selectedPackage)
      ? Number(selectedPackage.don_gia || selectedPackage.gia_goi || selectedPackage.gia_ban || selectedPackage.gia_niem_yet || 0)
      : Number(selectedConsultation.don_gia_dich_vu || defaultExamPrice);
    const isVoucherValid = appliedVoucher && isVoucherEligible(appliedVoucher, orderVal, loaiThanhToan, 'tai_quay', targetLoaiGoi);
    const voucherCodeToSend = isVoucherValid ? appliedVoucher.ma_voucher : null;

    const currentParams = JSON.stringify({
      checkoutTab,
      goi_id: selectedPackage?.id || null,
      loaiThanhToan,
      ma_voucher: voucherCodeToSend,
      dangKyGoi,
      giuTheoTuVan,
      consultationId: selectedConsultation?.id || null
    });

    if (lastCalcParamsRef.current === currentParams) return;
    lastCalcParamsRef.current = currentParams;

    if (dangKyGoi && selectedPackage) {
      const calculatePackage = async () => {
        setCalculating(true);
        try {
          const res = await axiosInstance.post('/receptionist/billing/calculate', {
            goi_id: selectedPackage.id,
            loai_thanh_toan: loaiThanhToan,
            ma_voucher: voucherCodeToSend,
            khach_hang_id: selectedConsultation.khach_hang_id,
            lich_dat_id: selectedConsultation.id,
            giu_theo_tu_van: giuTheoTuVan,
          });
          setCalculatedData(res.data);
        } catch (error: any) {
          lastCalcParamsRef.current = ''; // reset on error to allow retry
          console.warn('Lỗi tính giá gói:', error.response?.data?.message || error.message);
          if (voucherCodeToSend) {
            setAppliedVoucher(null);
            setMaVoucher('');
          }
        } finally {
          setCalculating(false);
        }
      };
      calculatePackage();
    } else {
      const calculateExamOnly = async () => {
        setCalculating(true);
        try {
          const res = await axiosInstance.post('/receptionist/billing/calculate', {
            item_type: selectedConsultation?.goi_dich_vu_id ? 'dich_vu' : undefined,
            item_id: selectedConsultation?.goi_dich_vu_id || null,
            goi_id: selectedConsultation?.goi_dich_vu_id || null,
            loai_thanh_toan: 'tra_thang',
            ma_voucher: voucherCodeToSend,
            khach_hang_id: selectedConsultation.khach_hang_id,
            lich_dat_id: selectedConsultation.id || null,
          });
          setCalculatedData(res.data);
        } catch (error: any) {
          lastCalcParamsRef.current = ''; // reset on error to allow retry
          console.warn('Lỗi tính giá dịch vụ:', error);
          if (voucherCodeToSend) {
            setAppliedVoucher(null);
            setMaVoucher('');
          }
        } finally {
          setCalculating(false);
        }
      };
      calculateExamOnly();
    }
  }, [
    checkoutTab,
    selectedPackage,
    loaiThanhToan,
    appliedVoucher,
    dangKyGoi,
    giuTheoTuVan,
    selectedConsultation,
    isCheckoutMode,
  ]);

  const handleApplyVoucher = async (codeOverride?: string, isSilent = false) => {
    const code = (codeOverride ?? maVoucher).trim();
    if (!code) return;
    const toastId = isSilent ? undefined : toast.loading('Đang áp dụng voucher...');
    try {
      const targetLoaiGoi = dangKyGoi && selectedPackage
        ? (selectedPackage.loai_goi === 'LE' ? 'LE' : 'LIEU_TRINH')
        : 'KHAM';
      const res = await axiosInstance.post('/receptionist/vouchers/apply', {
        ma_voucher: code,
        khach_hang_id: selectedConsultation?.khach_hang_id || null,
        loai_thanh_toan: dangKyGoi ? loaiThanhToan : 'tra_thang',
        kenh: 'tai_quay',
        loai_goi: targetLoaiGoi,
      });
      setMaVoucher(code);
      setAppliedVoucher(res.data.voucher);
      if (!isSilent && toastId) {
        toast.success('Đã áp dụng voucher thành công!', { id: toastId });
      }
    } catch (error: any) {
      setAppliedVoucher(null);
      setMaVoucher('');
      if (!isSilent) {
        toast.error(error.response?.data?.message || 'Lỗi áp dụng voucher', { id: toastId });
      }
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setMaVoucher('');
  };

  const handleThanhToanSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.hoaDon || !selectedConsultation) return;

    const totalAmount = Number(state.hoaDon.tong_tien_thanh_toan);
    const cleanReceived = state.soTienNhan.replace(/\D/g, '');
    const receivedAmount = Number(cleanReceived);
    if (state.phuongThuc === 'tien_mat' && receivedAmount < totalAmount) {
      toast.error('Số tiền nhận của khách hàng chưa đủ để thanh toán!');
      return;
    }

    const toastId = toast.loading('Đang xử lý tạo hóa đơn & thanh toán...');
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      let targetHoaDon = state.hoaDon;

      // If invoice hasn't been persisted to DB yet (draft preview mode), persist it now
      if (!targetHoaDon.id) {
        const createRes = await axiosInstance.post('/receptionist/billing/create', {
          khach_hang_id: selectedConsultation.khach_hang_id,
          item_type: 'dich_vu',
          item_id: selectedConsultation.goi_dich_vu_id || null,
          loai_thanh_toan: 'tra_thang',
          ma_voucher: appliedVoucher ? appliedVoucher.ma_voucher : null,
          lich_dat_id: selectedConsultation.id,
          ho_ten_khach: selectedConsultation.ten_khach_hang,
          so_dien_thoai: selectedConsultation.sdt_khach_hang,
          dang_ky_goi: false,
        });
        targetHoaDon = createRes.data.hoa_don;
        dispatch({ type: 'SET_HOA_DON', hoaDon: targetHoaDon });
      }

      if (state.phuongThuc === 'chuyen_khoan') {
        toast.dismiss(toastId);
        dispatch({ type: 'SET_LOADING', loading: false });
        setActivePayOSInvoice({
          invoice: targetHoaDon,
          amount: totalAmount,
          so_thu_tu_buoi: selectedConsultation?.loai_lich === 'dieu_tri' ? selectedConsultation?.so_thu_tu_buoi : undefined,
        });
        return;
      }

      const res = await axiosInstance.post('/receptionist/payment', {
        hoa_don_id: targetHoaDon.id,
        so_tien_nhan: cleanReceived,
        phuong_thuc: state.phuongThuc,
        ghi_chu: feedbackLyDo || undefined,
        so_thu_tu_buoi: selectedConsultation?.loai_lich === 'dieu_tri' ? selectedConsultation?.so_thu_tu_buoi : undefined,
      });

      const matchedPkg = selectedConsultation?.khuyen_nghi_goi_id
        ? packages.find((p) => String(p.id) === String(selectedConsultation.khuyen_nghi_goi_id))
        : null;

      const nextSessionNum = selectedConsultation?.loai_lich === 'dieu_tri' && selectedConsultation?.hinh_thuc_thanh_toan_goi === 'tung_buoi'
        ? Number(selectedConsultation.so_thu_tu_buoi || 1) + 1
        : null;
      const totalSessions = selectedConsultation?.pd_tong_so_buoi ? Number(selectedConsultation.pd_tong_so_buoi) : 10;
      const isTungBuoi = selectedConsultation?.loai_lich === 'dieu_tri' && selectedConsultation?.hinh_thuc_thanh_toan_goi === 'tung_buoi';

      setPaymentSuccessData({
        hoaDon: res.data?.hoa_don || targetHoaDon,
        soTienDaThu: Number(res.data?.actualPaymentAmount ?? totalAmount),
        soTienConLai: Math.max(0, totalAmount - Number(res.data?.da_thanh_toan_moi ?? totalAmount)),
        khachHangId: selectedConsultation?.khach_hang_id,
        tenKhachHang: selectedConsultation?.ten_khach_hang,
        khuyenNghiGoiId: selectedConsultation?.khuyen_nghi_goi_id,
        khuyenNghiTenGoi: matchedPkg ? matchedPkg.ten_goi : null,
        khuyenNghiLoaiGoi: selectedConsultation?.khuyen_nghi_loai_goi,
        daDangKyGoiId: isTungBuoi ? selectedConsultation?.pd_goi_dich_vu_id : null,
        daDangKyGoiTen: isTungBuoi ? selectedConsultation?.pd_ten_goi : null,
        daDangKyGoiLoai: isTungBuoi ? 'LIEU_TRINH' : null,
        nextSessionNum: isTungBuoi && nextSessionNum && nextSessionNum <= totalSessions ? nextSessionNum : null,
        totalSessions: isTungBuoi ? totalSessions : null,
      });

      toast.success('Giao dịch thanh toán y khoa đã hoàn tất thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi ghi nhận thanh toán.', { id: toastId });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const handleThanhToanPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation) return;
    if (dangKyGoi && !selectedPackage) {
      toast.error('Vui lòng chọn gói trị liệu chỉ định!');
      return;
    }
    if (!calculatedData) return;

    const tongCanThu = dangKyGoi && loaiThanhToan === 'tung_buoi'
      ? Number(calculatedData.so_tien_dot_1)
      : Number(calculatedData.tong_tien_thanh_toan);
    const cleanReceived = state.soTienNhan.replace(/\D/g, '');
    const receivedAmount = tongCanThu === 0 ? 0 : Number(cleanReceived);

    if (state.phuongThuc === 'tien_mat' && receivedAmount < tongCanThu) {
      const formattedValue = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tongCanThu);
      toast.error(`Số tiền nhận chưa đủ! Yêu cầu tối thiểu ${formattedValue}`);
      return;
    }

    const toastId = toast.loading('Đang lập hóa đơn & xử lý thanh toán...');
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const invoiceRes = await axiosInstance.post('/receptionist/billing/create', {
        khach_hang_id: selectedConsultation.khach_hang_id,
        item_type: dangKyGoi ? 'goi' : 'dich_vu',
        item_id: dangKyGoi ? selectedPackage.id : (selectedConsultation.goi_dich_vu_id || null),
        loai_thanh_toan: dangKyGoi ? loaiThanhToan : 'tra_thang',
        ma_voucher: appliedVoucher ? appliedVoucher.ma_voucher : null,
        lich_dat_id: selectedConsultation.id,
        lich_dieu_tri_id: selectedConsultation.phac_do_dieu_tri_id || null,
        ho_ten_khach: selectedConsultation.ten_khach_hang,
        so_dien_thoai: selectedConsultation.sdt_khach_hang,
        dang_ky_goi: dangKyGoi,
        giu_theo_tu_van: giuTheoTuVan,
      });

      const hoaDonMoi = invoiceRes.data.hoa_don;

      if (state.phuongThuc === 'chuyen_khoan') {
        toast.dismiss(toastId);
        dispatch({ type: 'SET_LOADING', loading: false });
        setActivePayOSInvoice({
          invoice: hoaDonMoi,
          amount: tongCanThu,
        });
        return;
      }

      const payRes = await axiosInstance.post('/receptionist/payment', {
        hoa_don_id: hoaDonMoi.id,
        so_tien_nhan: state.phuongThuc === 'tien_mat' ? (tongCanThu === 0 ? '0' : cleanReceived) : tongCanThu.toString(),
        phuong_thuc: state.phuongThuc,
      });

      if (selectedConsultation?.isDraftWalkin && selectedConsultation?.draftPayload) {
        await axiosInstance.post('/admin/appointments', {
          ...selectedConsultation.draftPayload,
          trang_thai: 'da_checkin',
          trang_thai_thanh_toan: 'da_thanh_toan',
          hoa_don_id: hoaDonMoi.id,
        });
        sessionStorage.removeItem('draft_walkin_checkin');
      }

      // Thực thu của giao dịch này (trả góp Đợt 1 = 50%), KHÔNG phải tổng giá trị hóa đơn.
      const soTienDaThu = Number(payRes.data?.actualPaymentAmount ?? tongCanThu);
      const soTienConLai = Math.max(0, Number(hoaDonMoi.tong_tien_thanh_toan || 0) - Number(payRes.data?.da_thanh_toan_moi ?? soTienDaThu));

      const totalSessions = Number(selectedConsultation?.pd_tong_so_buoi || selectedPackage?.tong_so_buoi || 10);
      const nextSessionNum = selectedConsultation?.loai_lich === 'dieu_tri'
        ? Number(selectedConsultation.so_thu_tu_buoi || 1) + 1
        : (dangKyGoi ? 1 : null);
      // Chỉ gợi ý "đặt buổi tiếp theo" khi đây thực sự là buổi điều trị thuộc phác đồ có sẵn,
      // hoặc vừa đăng ký gói mới — KHÔNG fallback lấy hoaDonMoi.goi_dich_vu_id một cách mù quáng,
      // vì dịch vụ khám lẻ (kham_moi/dich_vu_don, dangKyGoi=false) cũng được lưu như 1 hàng
      // goi_dich_vu, dễ khiến 1 ca khám không hề có chỉ định điều trị bị hiểu nhầm là "vừa đăng
      // ký gói" và gợi ý đặt Buổi 1.
      const isPackageFlow = selectedConsultation?.loai_lich === 'dieu_tri' || dangKyGoi;

      setPaymentSuccessData({
        hoaDon: hoaDonMoi,
        soTienDaThu,
        soTienConLai,
        khachHangId: selectedConsultation.khach_hang_id,
        tenKhachHang: selectedConsultation.ten_khach_hang,
        khuyenNghiGoiId: null,
        khuyenNghiTenGoi: null,
        khuyenNghiLoaiGoi: null,
        daDangKyGoiId: isPackageFlow
          ? (selectedConsultation?.pd_goi_dich_vu_id || selectedPackage?.id || selectedPackage?.goi_dich_vu_id || hoaDonMoi.goi_dich_vu_id)
          : null,
        daDangKyGoiTen: isPackageFlow
          ? (selectedConsultation?.pd_ten_goi || selectedPackage?.ten_goi || hoaDonMoi.ten_item)
          : null,
        daDangKyGoiLoai: isPackageFlow ? (selectedPackage?.loai_goi || null) : null,
        nextSessionNum: nextSessionNum && nextSessionNum <= totalSessions ? nextSessionNum : null,
        totalSessions,
      });

      toast.success(
        dangKyGoi
          ? (selectedPackage?.loai_goi === 'LE' ? 'Đăng ký & Thanh toán dịch vụ thành công!' : 'Đăng ký & Thanh toán gói trị liệu thành công!')
          : 'Đã lập hóa đơn & thanh toán phí lượng giá thành công!',
        { id: toastId }
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi xử lý thanh toán gói', { id: toastId });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const handlePayOSSuccess = (paidInvoice: any) => {
    const totalSessions = Number(selectedConsultation?.pd_tong_so_buoi || selectedPackage?.tong_so_buoi || 10);
    const nextSessionNum = selectedConsultation?.loai_lich === 'dieu_tri'
      ? Number(selectedConsultation.so_thu_tu_buoi || 1) + 1
      : (dangKyGoi ? 1 : null);

    // Số tiền thực chuyển khoản của giao dịch này (Đợt 1 nếu trả góp), không phải tổng hóa đơn.
    const soTienDaThuPayOS = Number(activePayOSInvoice?.amount ?? paidInvoice?.tong_tien_thanh_toan ?? 0);
    const soTienConLaiPayOS = Math.max(0, Number(paidInvoice?.tong_tien_thanh_toan || 0) - soTienDaThuPayOS);

    if (dangKyGoi) {
      setPaymentSuccessData({
        hoaDon: paidInvoice,
        soTienDaThu: soTienDaThuPayOS,
        soTienConLai: soTienConLaiPayOS,
        khachHangId: selectedConsultation!.khach_hang_id,
        tenKhachHang: selectedConsultation!.ten_khach_hang,
        khuyenNghiGoiId: null,
        khuyenNghiTenGoi: null,
        khuyenNghiLoaiGoi: null,
        daDangKyGoiId: selectedConsultation?.pd_goi_dich_vu_id || selectedPackage?.id || selectedPackage?.goi_dich_vu_id || paidInvoice.goi_dich_vu_id,
        daDangKyGoiTen: selectedConsultation?.pd_ten_goi || selectedPackage?.ten_goi || paidInvoice.ten_item,
        daDangKyGoiLoai: selectedPackage?.loai_goi || null,
        nextSessionNum: nextSessionNum && nextSessionNum <= totalSessions ? nextSessionNum : null,
        totalSessions,
      });
      toast.success(
        selectedPackage?.loai_goi === 'LE' ? 'Đăng ký & Thanh toán dịch vụ thành công!' : 'Đăng ký & Thanh toán gói trị liệu thành công!'
      );
    } else {
      const matchedPkg = selectedConsultation?.khuyen_nghi_goi_id
        ? packages.find((p) => String(p.id) === String(selectedConsultation.khuyen_nghi_goi_id))
        : null;
      const nextSessionNumSingle = selectedConsultation?.loai_lich === 'dieu_tri' && selectedConsultation?.hinh_thuc_thanh_toan_goi === 'tung_buoi'
        ? Number(selectedConsultation.so_thu_tu_buoi || 1) + 1
        : null;
      const totalSessionsSingle = selectedConsultation?.pd_tong_so_buoi ? Number(selectedConsultation.pd_tong_so_buoi) : 10;
      const isTungBuoi = selectedConsultation?.loai_lich === 'dieu_tri' && selectedConsultation?.hinh_thuc_thanh_toan_goi === 'tung_buoi';

      setPaymentSuccessData({
        hoaDon: paidInvoice,
        soTienDaThu: soTienDaThuPayOS,
        soTienConLai: soTienConLaiPayOS,
        khachHangId: selectedConsultation?.khach_hang_id,
        tenKhachHang: selectedConsultation?.ten_khach_hang,
        khuyenNghiGoiId: selectedConsultation?.khuyen_nghi_goi_id,
        khuyenNghiTenGoi: matchedPkg ? matchedPkg.ten_goi : null,
        khuyenNghiLoaiGoi: selectedConsultation?.khuyen_nghi_loai_goi,
        daDangKyGoiId: isTungBuoi ? selectedConsultation?.pd_goi_dich_vu_id : null,
        daDangKyGoiTen: isTungBuoi ? selectedConsultation?.pd_ten_goi : null,
        daDangKyGoiLoai: isTungBuoi ? 'LIEU_TRINH' : null,
        nextSessionNum: isTungBuoi && nextSessionNumSingle && nextSessionNumSingle <= totalSessionsSingle ? nextSessionNumSingle : null,
        totalSessions: isTungBuoi ? totalSessionsSingle : null,
      });
      toast.success('Giao dịch thanh toán y khoa đã hoàn tất thành công!');
    }
    setActivePayOSInvoice(null);
  };

  return {
    state,
    dispatch,
    packages,
    selectedConsultation,
    selectedPackage,
    setSelectedPackage,
    loaiThanhToan,
    setLoaiThanhToan,
    dangKyGoi,
    setDangKyGoi,
    maVoucher,
    setMaVoucher,
    appliedVoucher,
    calculatedData,
    calculating,
    feedbackLyDo,
    setFeedbackLyDo,
    paymentSuccessData,
    setPaymentSuccessData,
    checkoutTab,
    setCheckoutTab,
    giuTheoTuVan,
    setGiuTheoTuVan,
    canhBaoLechCauHinh: calculatedData?.canh_bao_lech_cau_hinh || null,
    handleApplyVoucher,
    handleRemoveVoucher,
    handleThanhToanSingle,
    handleThanhToanPackage,
    activePayOSInvoice,
    setActivePayOSInvoice,
    handlePayOSSuccess,
  };
};
