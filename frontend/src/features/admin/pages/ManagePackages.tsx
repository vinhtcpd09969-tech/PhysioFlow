import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPackages, getServices, deletePackage, getVouchers } from '../../../api/admin.api';
import PackageModal from '../components/PackageModal';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function ManagePackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg: any) =>
      pkg.ten_goi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.ma_goi && pkg.ma_goi.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [packages, searchQuery]);

  const selectedPackage = useMemo(() => {
    return packages.find(p => String(p.id) === selectedPackageId) || filteredPackages[0] || null;
  }, [packages, selectedPackageId, filteredPackages]);

  // Find active auto-applied vouchers targeted to this package
  const activePromo = useMemo(() => {
    if (!selectedPackage || !vouchers.length) return null;

    const now = new Date();

    // Find auto-applied voucher for straight payment (tra_thang)
    const straightPromo = vouchers.find((v: any) => {
      const startDate = new Date(v.ngay_bat_dau);
      const endDate = v.ngay_het_han ? new Date(v.ngay_het_han) : null;
      const isTimeActive = now >= startDate && (!endDate || now <= endDate);

      return v.trang_thai === 'hoat_dong' &&
        v.tu_dong_ap_dung === true &&
        isTimeActive &&
        (v.yeu_cau_thanh_toan === 'tra_thang' || v.yeu_cau_thanh_toan === 'tat_ca') &&
        (v.ap_dung_cho === 'tat_ca' || (Array.isArray(v.goi_dich_vu_ids) && v.goi_dich_vu_ids.includes(selectedPackage.id)));
    }) || null;

    // Find auto-applied voucher for installment (tra_gop)
    const installmentPromo = vouchers.find((v: any) => {
      const startDate = new Date(v.ngay_bat_dau);
      const endDate = v.ngay_het_han ? new Date(v.ngay_het_han) : null;
      const isTimeActive = now >= startDate && (!endDate || now <= endDate);

      return v.trang_thai === 'hoat_dong' &&
        v.tu_dong_ap_dung === true &&
        isTimeActive &&
        (v.yeu_cau_thanh_toan === 'tra_gop' || v.yeu_cau_thanh_toan === 'tat_ca') &&
        (v.ap_dung_cho === 'tat_ca' || (Array.isArray(v.goi_dich_vu_ids) && v.goi_dich_vu_ids.includes(selectedPackage.id)));
    }) || null;

    if (!straightPromo && !installmentPromo) return null;

    return {
      straightPromo,
      installmentPromo
    };
  }, [selectedPackage, vouchers]);

  useEffect(() => {
    if (filteredPackages.length === 0) {
      setSelectedPackageId(null);
      return;
    }

    if (!selectedPackageId || !filteredPackages.some(pkg => String(pkg.id) === selectedPackageId)) {
      setSelectedPackageId(String(filteredPackages[0].id));
    }
  }, [filteredPackages, selectedPackageId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgsRes, svcsRes, vouchersRes] = await Promise.all([
        getPackages(),
        getServices(),
        getVouchers()
      ]);
      setPackages(pkgsRes.data);
      setServices(svcsRes.data.filter((s: any) => s.trang_thai === 'hoat_dong'));
      setVouchers(vouchersRes.data || []);

      // Auto select first package if none selected
      if (pkgsRes.data.length > 0 && !selectedPackageId) {
        setSelectedPackageId(String(pkgsRes.data[0].id));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (pkg: any) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa gói dịch vụ "${pkg.ten_goi}" không?\nHành động này không thể hoàn tác.`)) {
      try {
        await deletePackage(pkg.id);
        if (selectedPackageId === String(pkg.id)) {
          setSelectedPackageId(null);
        }
        fetchData();
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Không thể xóa gói dịch vụ này. Rất có thể gói này đang được liên kết trong lịch đặt hoặc hóa đơn của khách hàng.');
      }
    }
  };

  const handleDuplicate = (pkg: any) => {
    const duplicatedPkg = {
      ...pkg,
      ten_goi: `${pkg.ten_goi} (Copy)`,
      ma_goi: '', // Let backend auto-generate a new code
    };
    setEditingPackage(duplicatedPkg);
    setIsModalOpen(true);
  };

  // Calculate package pricing stats
  const getPackageStats = (pkg: any) => {
    if (!pkg || !pkg.chi_tiet_dich_vu || !Array.isArray(pkg.chi_tiet_dich_vu)) {
      return { totalRetailPrice: 0, savings: 0, savingsPercent: 0 };
    }

    let totalRetailPrice = 0;
    pkg.chi_tiet_dich_vu.forEach((item: any) => {
      const svc = services.find(s => s.id === item.dich_vu_id);
      if (svc) {
        const price = typeof svc.don_gia === 'string' ? parseInt(svc.don_gia) : (svc.don_gia || 0);
        const qty = item.so_lan_toi_da_trong_goi || item.so_buoi || item.so_buoi_trong_goi || 0;
        totalRetailPrice += price * qty;
      }
    });

    const pkgPrice = typeof pkg.gia_tien === 'string' ? parseInt(pkg.gia_tien) : (pkg.gia_tien || 0);
    const savings = totalRetailPrice - pkgPrice;
    const savingsPercent = totalRetailPrice > 0 ? Math.round((savings / totalRetailPrice) * 100) : 0;

    return { totalRetailPrice, savings, savingsPercent };
  };

  const selectedStats = useMemo(() => {
    return selectedPackage ? getPackageStats(selectedPackage) : null;
  }, [selectedPackage, services]);

  // Overall Statistics for KPI panels
  const overallStats = useMemo(() => {
    const activeCount = packages.filter(p => p.trang_thai === 'hoat_dong').length;
    const totalCount = packages.length;
    const avgPrice = totalCount > 0
      ? packages.reduce((acc, p) => acc + (typeof p.gia_tien === 'string' ? parseInt(p.gia_tien) : (p.gia_tien || 0)), 0) / totalCount
      : 0;
    const shortExpiryCount = packages.filter(p => p.han_dung_thang <= 3).length;

    return { activeCount, totalCount, avgPrice, shortExpiryCount };
  }, [packages]);

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000) return `${amount / 1000000}M`;
    if (amount >= 1000) return `${amount / 1000}K`;
    return amount.toString();
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in text-zinc-800 font-sans text-sm">

      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-heading tracking-wider text-primary uppercase font-bold">Không gian làm việc</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-secondary tracking-tight">CẤU HÌNH GÓI DỊCH VỤ</h2>
          <p className="text-zinc-500 text-xs mt-1">Cấu hình phân loại, định giá và tối ưu hóa gói dịch vụ</p>
        </div>
        <button
          onClick={() => {
            setEditingPackage(null);
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 hover:shadow-soft-button active:scale-95 text-white px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2"
        >
          [+] TẠO GÓI DỊCH VỤ MỚI
        </button>
      </div>

      {/* KPI HUD Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">GIÁ TRỊ TRUNG BÌNH THÈ</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-secondary">
              {currencyFormatter.format(Math.round(overallStats.avgPrice))}đ
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">GÓI ĐANG KÍCH HOẠT</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-primary">{overallStats.activeCount}</h3>
            <span className="text-[10px] text-primary font-bold bg-primary-container px-2 py-0.5 border border-primary/20 rounded-lg">Hoạt động</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">TỔNG SỐ LƯỢNG THIẾT LẬP</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-secondary">{overallStats.totalCount}</h3>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-100 px-2 py-0.5 border border-zinc-200 rounded-lg">Gói</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">GÓI HẠN NGẮN (≤3T)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-amber-500">{overallStats.shortExpiryCount}</h3>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 border border-amber-200 rounded-lg">Hạn ngắn</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Split-Pane HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Pane: Packages Directory */}
        <div className="lg:col-span-5 flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm min-h-[500px]">

          {/* Search Header */}
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-secondary font-heading flex-shrink-0">Danh mục Gói</h3>
            <div className="relative w-full sm:w-60">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Mã gói, tên gói dịch vụ..."
                value={searchQuery}
                onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
                className="pl-9 pr-4 py-1.5 w-full border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary placeholder-zinc-350 shadow-inner transition-all"
              />
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-zinc-150 pr-0.5 custom-scrollbar bg-white">
            {loading ? (
              <div className="p-8 text-center text-zinc-400 font-sans text-xs">CƠ SỞ DỮ LIỆU ĐANG TẢI...</div>
            ) : filteredPackages.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 font-sans text-xs">KHÔNG TÌM THẤY KẾT QUẢ PHÙ HỢP</div>
            ) : (
              filteredPackages.map((pkg) => {
                const isActive = selectedPackage && selectedPackage.id === pkg.id;
                const isInactive = pkg.trang_thai !== 'hoat_dong';

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-4 transition-all duration-150 cursor-pointer flex justify-between items-start gap-4 border-l-4 ${isActive
                        ? 'border-l-primary bg-primary/5 border-r border-r-primary/5 border-y border-y-zinc-100 shadow-sm'
                        : 'border-l-transparent hover:bg-zinc-50/60'
                      } ${isInactive ? 'opacity-50' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-heading text-[9px] font-bold text-zinc-400 uppercase">
                          {pkg.ma_goi || 'CHƯA CÓ MÃ'}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${pkg.loai_goi === 'linh_dong'
                            ? 'bg-amber-50 border-amber-250 text-amber-600'
                            : 'bg-teal-50 border-teal-250 text-teal-650'
                          }`}>
                          {pkg.loai_goi === 'linh_dong' ? 'GÓI LINH ĐỘNG' : 'LIỆU TRÌNH CỐ ĐỊNH'}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-secondary leading-snug truncate">
                        {pkg.ten_goi}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1 font-semibold">
                        {pkg.tong_so_buoi} BUỔI • {pkg.chi_tiet_dich_vu ? pkg.chi_tiet_dich_vu.length : 0} DỊCH VỤ • TỐI ĐA {pkg.so_dv_toi_da_moi_buoi || 5} DV/BUỔI
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold text-primary block">
                        {currencyFormatter.format(pkg.gia_tien)}đ
                      </span>
                      <span className={`inline-block mt-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-lg border ${pkg.trang_thai === 'hoat_dong'
                          ? 'bg-primary-container text-primary border-primary/20'
                          : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                        }`}>
                        {pkg.trang_thai === 'hoat_dong' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Interactive Detail Console */}
        <div className="lg:col-span-7 flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm min-h-[500px]">
          {selectedPackage ? (
            <div className="flex-1 flex flex-col bg-white">

              {/* Detail Header & Actions */}
              <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase bg-primary-container border border-primary/20 px-2.5 py-0.5 rounded-lg">
                      {selectedPackage.ma_goi || 'CHƯA CÓ MÃ'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-lg border ${selectedPackage.loai_goi === 'linh_dong'
                        ? 'bg-amber-50 border-amber-250 text-amber-600'
                        : 'bg-teal-50 border-teal-250 text-teal-650'
                      }`}>
                      {selectedPackage.loai_goi === 'linh_dong' ? 'GÓI LINH ĐỘNG' : 'LIỆU TRÌNH CỐ ĐỊNH'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-lg border ${selectedPackage.trang_thai === 'hoat_dong'
                        ? 'bg-primary-container text-primary border-primary/20'
                        : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                      }`}>
                      {selectedPackage.trang_thai === 'hoat_dong' ? 'ĐANG HOẠT ĐỘNG' : 'TẠM VÔ HIỆU'}
                    </span>
                  </div>
                  <h3 className="text-md font-bold text-secondary truncate uppercase font-heading tracking-wide">
                    {selectedPackage.ten_goi}
                  </h3>
                </div>

                {/* Operations Toolbar */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 text-[11px] font-bold">
                  <button
                    onClick={() => handleDuplicate(selectedPackage)}
                    className="px-3.5 py-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 rounded-xl transition-all active:scale-95 bg-white shadow-sm flex items-center gap-1.5"
                  >
                    <span>NHÂN BẢN</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingPackage(selectedPackage);
                      setIsModalOpen(true);
                    }}
                    className="px-3.5 py-2 border border-zinc-200 hover:border-primary/30 hover:bg-primary-container text-zinc-600 hover:text-primary rounded-xl transition-all active:scale-95 bg-white shadow-sm flex items-center gap-1.5"
                  >
                    <span>SỬA ĐỔI</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPackage)}
                    className="p-2 border border-zinc-200 hover:border-rose-200 hover:bg-rose-50 text-zinc-400 hover:text-rose-500 rounded-xl transition-all active:scale-95 bg-white shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Console Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[520px] custom-scrollbar bg-white">

                {/* Stats Matrix Grid */}
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">HỘP I: THÔNG SỐ VẬN HÀNH LÂM SÀNG</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-zinc-50/50 p-4 border border-zinc-200 rounded-2xl shadow-inner">
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Thời hạn dùng</p>
                      <p className="text-sm font-bold text-secondary mt-0.5">{selectedPackage.han_dung_thang} tháng</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Tổng số buổi</p>
                      <p className="text-sm font-bold text-secondary mt-0.5">{selectedPackage.tong_so_buoi} buổi</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Hạn mức buổi</p>
                      <p className="text-sm font-bold text-primary mt-0.5">Tối đa {selectedPackage.so_dv_toi_da_moi_buoi || 5} DV</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Website</p>
                      <p className="text-sm font-bold text-secondary mt-0.5">
                        {selectedPackage.hien_thi_website ? 'HIỂN THỊ' : 'ẨN BỎ'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">Danh mục</p>
                      <p className="text-sm font-bold text-secondary mt-0.5 truncate" title={selectedPackage.ten_danh_muc || 'Mặc định'}>
                        {selectedPackage.ten_danh_muc || 'Không phân loại'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedPackage.mo_ta && (
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">HỘP II: ĐỊNH HƯỚNG LIỆU TRÌNH</h4>
                    <p className="text-xs text-zinc-600 bg-primary-container/20 border-l-4 border-primary p-4 rounded-r-xl italic leading-relaxed">
                      "{selectedPackage.mo_ta}"
                    </p>
                  </div>
                )}

                {/* Technical Service breakdown */}
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">HỘP III: CƠ CẤU DỊCH VỤ KỸ THUẬT CHI TIẾT</h4>
                  <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-heading">
                          <th className="p-3 font-bold">Tên dịch vụ kỹ thuật</th>
                          <th className="p-3 font-bold text-center">Bắt buộc</th>
                          <th className="p-3 font-bold text-center">Hạn mức</th>
                          <th className="p-3 font-bold text-center">Thứ tự</th>
                          <th className="p-3 font-bold text-right">Đơn giá lẻ</th>
                          <th className="p-3 font-bold text-right">Thành tiền lẻ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {selectedPackage.chi_tiet_dich_vu && selectedPackage.chi_tiet_dich_vu.length > 0 ? (
                          selectedPackage.chi_tiet_dich_vu.map((item: any, idx: number) => {
                            const svc = services.find(s => s.id === item.dich_vu_id);
                            const unitPrice = svc ? (typeof svc.don_gia === 'string' ? parseInt(svc.don_gia) : (svc.don_gia || 0)) : 0;
                            const qty = item.so_lan_toi_da_trong_goi || item.so_buoi || item.so_buoi_trong_goi || selectedPackage.tong_so_buoi || 10;
                            const subtotal = unitPrice * qty;

                            return (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="p-3">
                                  <p className="font-bold text-secondary">{svc ? svc.ten_dich_vu : 'Dịch vụ đã dừng hoạt động'}</p>
                                  <p className="text-[9px] text-zinc-400 mt-0.5">{svc ? svc.ten_danh_muc : 'Không xác định'}</p>
                                </td>
                                <td className="p-3 text-center">
                                  {item.bat_buoc !== false ? (
                                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-primary-container border border-primary/20 text-primary rounded-lg">CÓ</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 rounded-lg">KHÔNG</span>
                                  )}
                                </td>
                                <td className="p-3 text-center font-bold text-zinc-650">{qty} LẦN</td>
                                <td className="p-3 text-center font-bold text-zinc-500 bg-zinc-50/30">{item.thu_tu_thuc_hien || 0}</td>
                                <td className="p-3 text-right text-zinc-500">{currencyFormatter.format(unitPrice)}đ</td>
                                <td className="p-3 text-right font-bold text-primary">{currencyFormatter.format(subtotal)}đ</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-zinc-400">KHÔNG CÓ DỊCH VỤ ĐƯỢC CHỈ ĐỊNH TRONG GÓI</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dynamic Financial Diagnostics report */}
                {selectedStats && selectedStats.totalRetailPrice > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      📦 GÓI: {selectedPackage.ten_goi}
                    </h4>
                    <div className="bg-primary-container/30 text-secondary p-5 border border-primary/20 rounded-2xl text-xs space-y-3 relative overflow-hidden shadow-sm">

                      {/* Retail Price */}
                      <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200/50">
                        <span className="font-bold text-zinc-500 uppercase tracking-wide">Tổng giá đơn lẻ:</span>
                        <span className="font-bold text-base text-zinc-500 line-through">
                          {currencyFormatter.format(selectedStats.totalRetailPrice)}đ
                        </span>
                      </div>

                      {/* Package Listed Price */}
                      <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200/50 bg-zinc-50/50 p-2 rounded-xl">
                        <span className="font-bold text-primary uppercase tracking-wide">Giá trọn gói niêm yết:</span>
                        <span className="font-bold text-base text-primary">
                          {currencyFormatter.format(typeof selectedPackage.gia_tien === 'string' ? parseInt(selectedPackage.gia_tien) : (selectedPackage.gia_tien || 0))}đ
                        </span>
                      </div>

                      {activePromo ? (
                        <>
                          {/* Straight payment (100%) */}
                          {activePromo.straightPromo && (
                            <div className="flex justify-between items-center text-secondary py-0.5">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="font-semibold text-zinc-650">{activePromo.straightPromo.ten_chien_dich}:</span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-bold text-sm text-emerald-600">
                                  {activePromo.straightPromo.loai_giam === 'phan_tram' ? (
                                    `${currencyFormatter.format(Math.round((typeof selectedPackage.gia_tien === 'string' ? parseInt(selectedPackage.gia_tien) : (selectedPackage.gia_tien || 0)) * (1 - Number(activePromo.straightPromo.gia_tri_giam) / 100)))}đ`
                                  ) : (
                                    `${currencyFormatter.format(Math.max(0, (typeof selectedPackage.gia_tien === 'string' ? parseInt(selectedPackage.gia_tien) : (selectedPackage.gia_tien || 0)) - Number(activePromo.straightPromo.gia_tri_giam)))}đ`
                                  )}
                                </span>
                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.2 rounded border border-emerald-250">
                                  {activePromo.straightPromo.loai_giam === 'phan_tram' 
                                    ? `-${activePromo.straightPromo.gia_tri_giam}%` 
                                    : `-${formatCurrencyShort(activePromo.straightPromo.gia_tri_giam)}`}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Installment payment */}
                          {activePromo.installmentPromo && (
                            <div className="flex justify-between items-center text-secondary py-0.5">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span className="font-semibold text-zinc-650">{activePromo.installmentPromo.ten_chien_dich}:</span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-bold text-sm text-amber-600">
                                  {activePromo.installmentPromo.loai_giam === 'phan_tram' ? (
                                    `${currencyFormatter.format(Math.round((typeof selectedPackage.gia_tien === 'string' ? parseInt(selectedPackage.gia_tien) : (selectedPackage.gia_tien || 0)) * (1 - Number(activePromo.installmentPromo.gia_tri_giam) / 100)))}đ`
                                  ) : (
                                    `${currencyFormatter.format(Math.max(0, (typeof selectedPackage.gia_tien === 'string' ? parseInt(selectedPackage.gia_tien) : (selectedPackage.gia_tien || 0)) - Number(activePromo.installmentPromo.gia_tri_giam)))}đ`
                                  )}
                                </span>
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.2 rounded border border-amber-255">
                                  {activePromo.installmentPromo.loai_giam === 'phan_tram' 
                                    ? `-${activePromo.installmentPromo.gia_tri_giam}%` 
                                    : `-${formatCurrencyShort(activePromo.installmentPromo.gia_tri_giam)}`}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Promotion campaign badge */}
                          <div className="border-t border-zinc-200/50 mt-3 pt-3 flex flex-wrap gap-2 items-center justify-between text-[10px] text-zinc-500 font-semibold">
                            <span>Chiến dịch áp dụng:</span>
                            <div className="flex gap-1.5 flex-wrap">
                              {activePromo.straightPromo && (
                                <span className="text-primary font-bold bg-primary-container px-2 py-0.5 border border-primary/20 rounded-lg">
                                  ✨ {activePromo.straightPromo.ten_chien_dich}
                                </span>
                              )}
                              {activePromo.installmentPromo && activePromo.installmentPromo.id !== activePromo.straightPromo?.id && (
                                <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 border border-indigo-150 rounded-lg">
                                  ✨ {activePromo.installmentPromo.ten_chien_dich}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-secondary py-0.5">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                              <span className="font-semibold text-zinc-500">Giá trọn gói niêm yết:</span>
                            </div>
                            <span className="font-bold text-sm text-primary">
                              {currencyFormatter.format(selectedPackage.gia_tien)}đ
                            </span>
                          </div>
                          <div className="border-t border-zinc-200/50 mt-3 pt-3 text-[10px] text-zinc-400 leading-relaxed italic">
                            * Gói này hiện không nằm trong chiến dịch Ưu đãi Thanh toán tự động nào. Bạn có thể cấu hình kích hoạt ưu đãi cho gói này tại mục Marketing.
                          </div>
                        </>
                      )}

                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-zinc-50/30 text-zinc-400 text-xs">
              <svg className="w-12 h-12 text-zinc-300 mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="font-semibold text-center uppercase tracking-wider">VUI LÒNG CHỌN GÓI TRÊN DANH MỤC ĐỂ HIỂN THỊ PHÂN TÍCH LÂM SÀNG</span>
            </div>
          )}
        </div>

      </div>

      {/* Render Component Modal */}
      {isModalOpen && (
        <PackageModal
          services={services}
          editingPackage={editingPackage}
          existingPackages={packages}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPackage(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingPackage(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
