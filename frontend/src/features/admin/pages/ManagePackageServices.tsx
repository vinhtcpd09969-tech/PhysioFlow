import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPackages, updatePackage, getServices } from '../../../api/admin.api';

// Currency formatter
const currencyFormatter = new Intl.NumberFormat('vi-VN');

// Service icons fallback based on Unsplash
const getServiceImage = (id: string | number) => {
  const isEven = String(id).charCodeAt(0) % 2 === 0;
  return `https://images.unsplash.com/photo-${isEven ? '1576091160550-21080f0c7324' : '1544367567-0f2fcb009e0b'}?q=80&w=200&auto=format&fit=crop`;
};

// Fallback benefits if none provided
const defaultBenefits = [
  "Hỗ trợ giảm đau cơ xương khớp cục bộ an toàn chuẩn y khoa.",
  "Thúc đẩy quá trình tái tạo mô và rút ngắn thời gian hồi phục thể trạng.",
  "Nâng cao sức khỏe chủ động và cải thiện chất lượng cuộc sống hàng ngày."
];

export default function ManagePackageServices() {
  const { id: packageId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State Management
  const [currentPackage, setCurrentPackage] = useState<any>(null);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedInfo, setGroupedInfo] = useState<{
    isGrouped: boolean;
    baseName: string;
    basicPkg?: any;
    standardPkg?: any;
    intensivePkg?: any;
  }>({ isGrouped: false, baseName: '' });
  
  // Available Clinical Techniques Search Term
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  
  // Accordions mapping
  const [expandedServiceIds, setExpandedServiceIds] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgsRes, svcsRes] = await Promise.all([
        getPackages(),
        getServices()
      ]);

      const list = pkgsRes.data || [];
      
      const foundPkg = list.find((p: any) => String(p.id) === String(packageId));
      setCurrentPackage(foundPkg || null);

      if (foundPkg) {
        // Phát hiện nếu là Gói cố định có phân khúc để gộp nhóm
        const match = foundPkg.ten_goi.match(/\s*-\s*(BASIC|STANDARD|INTENSIVE)\s*$/i);
        if (match) {
          const baseName = foundPkg.ten_goi.replace(/\s*-\s*(BASIC|STANDARD|INTENSIVE)\s*$/i, '').trim();
          const sisterPkgs = list.filter((p: any) => {
            const pBase = p.ten_goi.replace(/\s*-\s*(BASIC|STANDARD|INTENSIVE)\s*$/i, '').trim();
            return p.loai_goi === 'lieu_trinh' && pBase.toLowerCase() === baseName.toLowerCase();
          });

          const sortedSisters = [...sisterPkgs].sort((a, b) => {
            const aName = a.ten_goi.toUpperCase();
            const bName = b.ten_goi.toUpperCase();
            if (aName.includes('BASIC')) return -1;
            if (bName.includes('BASIC')) return 1;
            if (aName.includes('STANDARD')) return -1;
            if (bName.includes('STANDARD')) return 1;
            return 0;
          });

          setGroupedInfo({
            isGrouped: true,
            baseName,
            basicPkg: sortedSisters.find(p => p.ten_goi.toUpperCase().includes('BASIC')) || foundPkg,
            standardPkg: sortedSisters.find(p => p.ten_goi.toUpperCase().includes('STANDARD')) || foundPkg,
            intensivePkg: sortedSisters.find(p => p.ten_goi.toUpperCase().includes('INTENSIVE')) || foundPkg
          });
        } else {
          setGroupedInfo({ isGrouped: false, baseName: foundPkg.ten_goi });
        }
      }

      setAllServices(svcsRes.data || []);
    } catch (error) {
      console.error('Error fetching package services details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [packageId]);

  // Map service ID to benefits list safely
  const getServiceBenefitsList = (svc: any) => {
    if (svc.loai_dich_vu_ho_tro) {
      let parsed = svc.loai_dich_vu_ho_tro;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (e) {}
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return defaultBenefits;
  };

  // Switch to expanded details
  const toggleExpand = (svcId: string) => {
    setExpandedServiceIds(prev => ({
      ...prev,
      [svcId]: !prev[svcId]
    }));
  };

  // Filtered services that are inside the package (internal techniques only)
  const linkedServices = useMemo(() => {
    if (!currentPackage || !allServices.length) return [];
    const details = currentPackage.chi_tiet_dich_vu || [];
    
    return details
      .map((item: any) => {
        const svc = allServices.find(s => String(s.id) === String(item.dich_vu_id));
        if (!svc) return null;
        return {
          ...svc,
          bat_buoc: item.bat_buoc !== false,
          thu_tu_thuc_hien: item.thu_tu_thuc_hien || 0
        };
      })
      .filter(Boolean);
  }, [currentPackage, allServices]);

  // Available internal techniques in the system library that are not added to package
  const availableServices = useMemo(() => {
    if (!allServices.length) return [];
    
    // Filter services of type 'chinh' (Kỹ thuật lâm sàng nội bộ)
    let list = allServices.filter(svc => svc.loai_dich_vu === 'chinh');
    
    // Exclude services that are already added
    const linkedIds = new Set(linkedServices.map((s: any) => String(s.id)));
    list = list.filter(svc => !linkedIds.has(String(svc.id)));
    
    // Filter by library search term
    if (librarySearchTerm) {
      const q = librarySearchTerm.toLowerCase();
      list = list.filter(svc => svc.ten_dich_vu.toLowerCase().includes(q));
    }
    
    return list;
  }, [allServices, linkedServices, librarySearchTerm]);

  // Main Action: Update details array and save package
  const savePackageDetails = async (newDetails: any[]) => {
    if (!currentPackage) return;
    try {
      setLoading(true);
      const payload = {
        danh_muc_id: currentPackage.danh_muc_id ? Number(currentPackage.danh_muc_id) : undefined,
        ten_goi: currentPackage.ten_goi,
        ma_goi: currentPackage.ma_goi,
        mo_ta: currentPackage.mo_ta,
        tong_so_buoi: Number(currentPackage.tong_so_buoi),
        gia_tien: typeof currentPackage.gia_tien === 'string' ? parseInt(currentPackage.gia_tien) : Number(currentPackage.gia_tien || 0),
        han_dung_thang: Number(currentPackage.han_dung_thang || 12),
        so_dv_toi_da_moi_buoi: Number(currentPackage.so_dv_toi_da_moi_buoi || 5),
        hien_thi_website: currentPackage.hien_thi_website !== false,
        trang_thai: currentPackage.trang_thai,
        loai_goi: currentPackage.loai_goi || 'lieu_trinh',
        chi_tiet_dich_vu: newDetails
      };

      const res = await updatePackage(currentPackage.id, payload);

      // TỰ ĐỘNG ĐỒNG BỘ phác đồ sang các phân khúc chị em (BASIC, STANDARD, INTENSIVE) của Gói cố định
      if (currentPackage.loai_goi === 'lieu_trinh' && currentPackage.ten_goi.match(/\s*-\s*(BASIC|STANDARD|INTENSIVE)$/i)) {
        const baseName = currentPackage.ten_goi.replace(/\s*-\s*(BASIC|STANDARD|INTENSIVE)$/i, '').trim();
        const pkgsRes = await getPackages();
        const sisterPkgs = (pkgsRes.data || []).filter((p: any) => {
          if (String(p.id) === String(currentPackage.id)) return false; // bỏ qua gói hiện tại
          const pBase = p.ten_goi.replace(/\s*-\s*(BASIC|STANDARD|INTENSIVE)$/i, '').trim();
          return p.loai_goi === 'lieu_trinh' && pBase.toLowerCase() === baseName.toLowerCase();
        });

        // Ghi nhận cấu trúc giống hệt cho các gói chị em
        for (const sister of sisterPkgs) {
          const sisterPayload = {
            danh_muc_id: sister.danh_muc_id ? Number(sister.danh_muc_id) : undefined,
            ten_goi: sister.ten_goi,
            ma_goi: sister.ma_goi,
            mo_ta: sister.mo_ta,
            tong_so_buoi: Number(sister.tong_so_buoi),
            gia_tien: typeof sister.gia_tien === 'string' ? parseInt(sister.gia_tien) : Number(sister.gia_tien || 0),
            han_dung_thang: Number(sister.han_dung_thang || 12),
            so_dv_toi_da_moi_buoi: Number(sister.so_dv_toi_da_moi_buoi || 5),
            hien_thi_website: sister.hien_thi_website !== false,
            trang_thai: sister.trang_thai,
            loai_goi: sister.loai_goi || 'lieu_trinh',
            chi_tiet_dich_vu: newDetails // cấu trúc kỹ thuật lâm sàng được sao chép nguyên mẫu
          };
          await updatePackage(sister.id, sisterPayload);
        }
      }

      if (res.data) {
        setCurrentPackage(res.data);
        await fetchData(); // refresh list
      }
    } catch (e) {
      console.error('Lỗi khi lưu chi tiết cấu trúc gói:', e);
      alert('Không thể lưu cấu trúc gói dịch vụ y khoa.');
    } finally {
      setLoading(false);
    }
  };

  // Link technique service from Library into the package phác đồ
  const handleLinkService = async (svc: any) => {
    if (!currentPackage) return;
    try {
      const currentDetails = currentPackage.chi_tiet_dich_vu || [];
      
      // Duplication check
      if (currentDetails.some((item: any) => String(item.dich_vu_id) === String(svc.id))) {
        alert('Kỹ thuật này đã tồn tại trong phác đồ của gói.');
        return;
      }

      const updatedDetails = [
        ...currentDetails,
        {
          dich_vu_id: svc.id,
          so_buoi: Number(currentPackage.tong_so_buoi),
          so_lan_toi_da_trong_goi: Number(currentPackage.tong_so_buoi),
          bat_buoc: true,
          thu_tu_thuc_hien: currentDetails.length
        }
      ];

      await savePackageDetails(updatedDetails);
    } catch (err) {
      console.error('Error linking clinical technique:', err);
      alert('Lỗi máy chủ khi liên kết kỹ thuật trị liệu.');
    }
  };

  // Sub-Action: Remove/unlink a service from package
  const handleRemoveService = async (svc: any) => {
    if (!currentPackage) return;
    const confirmMsg = `Bạn có chắc muốn gỡ bỏ kỹ thuật "${svc.ten_dich_vu}" ra khỏi cấu trúc gói điều trị này không?`;
    
    if (window.confirm(confirmMsg)) {
      const newDetails = (currentPackage.chi_tiet_dich_vu || []).filter((item: any) => String(item.dich_vu_id) !== String(svc.id));
      await savePackageDetails(newDetails);
    }
  };

  if (loading && !currentPackage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-200">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-3"></div>
        <p className="font-heading text-xs font-bold uppercase tracking-wider">Đang kết nối cơ sở dữ liệu y khoa...</p>
      </div>
    );
  }

  if (!currentPackage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 bg-zinc-50 rounded-2xl border border-zinc-200 p-8">
        <svg className="w-12 h-12 text-rose-450 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-secondary">Không tìm thấy gói dịch vụ</h3>
        <p className="text-xs text-zinc-400 mt-2">Gói dịch vụ điều trị yêu cầu không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.</p>
        <button 
          onClick={() => navigate('/admin/packages')}
          className="mt-6 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold tracking-wide shadow transition-all hover:bg-primary/95"
        >
          QUAY LẠI QUẢN LÝ GÓI
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in text-zinc-800 font-sans text-sm">
      
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="min-w-0 flex-1">
          <button
            onClick={() => navigate('/admin/packages')}
            className="group flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-primary transition-colors uppercase tracking-wider mb-2.5"
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            QUAY LẠI PHÂN HỆ GÓI
          </button>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold text-primary uppercase bg-primary-container border border-primary/20 px-2.5 py-0.5 rounded-lg">
              {currentPackage.ma_goi || 'CHƯA CÓ MÃ'}
            </span>
            <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-lg border ${
              currentPackage.loai_goi === 'linh_dong'
                ? 'bg-amber-50 border-amber-250 text-amber-600'
                : 'bg-teal-50 border-teal-250 text-teal-650'
            }`}>
              {currentPackage.loai_goi === 'linh_dong' ? 'GÓI TỰ CHỌN' : 'GÓI CỐ ĐỊNH'}
            </span>
            {groupedInfo.isGrouped && (
              <div className="flex gap-1 items-center shrink-0">
                <span className="text-[8px] font-extrabold bg-emerald-500 text-white border border-emerald-600 px-1.5 py-0.5 rounded shadow-sm">BASIC</span>
                <span className="text-[8px] font-extrabold bg-teal-500 text-white border border-teal-600 px-1.5 py-0.5 rounded shadow-sm">STANDARD</span>
                <span className="text-[8px] font-extrabold bg-amber-500 text-white border border-amber-600 px-1.5 py-0.5 rounded shadow-sm">INTENSIVE</span>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold font-heading text-secondary tracking-tight uppercase">
            CHI TIẾT GÓI DỊCH VỤ: {groupedInfo.isGrouped ? groupedInfo.baseName : currentPackage.ten_goi}
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            {currentPackage.mo_ta || 'Phác đồ phục hồi cột sống và cơ xương khớp chuyên sâu.'}
          </p>
        </div>
        
        {/* Navigation Sidebar Quick Select */}
        <div className="flex gap-2 self-end md:self-center shrink-0">
          <button
            onClick={() => navigate('/admin/services')}
            className="bg-white border border-zinc-200 text-zinc-650 hover:text-primary hover:border-primary/30 active:scale-95 px-5 py-3 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2"
          >
            🩺 QUẢN LÝ THƯ VIỆN KỸ THUẬT
          </button>
        </div>
      </div>

      {/* KPIs Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Bảng giá theo lộ trình */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden">
          <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-2.5">BẢNG GIÁ THEO LỘ TRÌNH</p>
          {groupedInfo.isGrouped ? (
            <div className="flex flex-col gap-1 text-[11px] font-bold">
              <div className="flex justify-between items-center bg-emerald-50/60 border border-emerald-200/50 px-2.5 py-1.5 rounded-xl">
                <span className="text-emerald-800">🟢 Basic</span>
                <span className="text-emerald-700 font-extrabold">{currencyFormatter.format(groupedInfo.basicPkg?.gia_tien || 3594000)}đ</span>
              </div>
              <div className="flex justify-between items-center bg-teal-50/60 border border-teal-200/50 px-2.5 py-1.5 rounded-xl">
                <span className="text-teal-800">🔵 Standard</span>
                <span className="text-teal-700 font-extrabold">{currencyFormatter.format(groupedInfo.standardPkg?.gia_tien || 6588000)}đ</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50/40 border border-amber-200/50 px-2.5 py-1.5 rounded-xl">
                <span className="text-amber-800">💛 Intensive</span>
                <span className="text-amber-700 font-extrabold">{currencyFormatter.format(groupedInfo.intensivePkg?.gia_tien || 8982000)}đ</span>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-black text-secondary">
                {currencyFormatter.format(typeof currentPackage.gia_tien === 'string' ? parseInt(currentPackage.gia_tien) : (currentPackage.gia_tien || 0))}đ
              </h3>
              <span className="text-[9px] text-zinc-400 mt-1 block font-semibold">Thanh toán trọn gói</span>
            </div>
          )}
        </div>

        {/* Card 2: Quy mô điều trị */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden">
          <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-2.5">SỐ BUỔI ĐIỀU TRỊ CHUẨN</p>
          {groupedInfo.isGrouped ? (
            <div className="flex flex-col gap-1 text-[11px] font-bold">
              <div className="flex justify-between items-center bg-emerald-50/60 border border-emerald-200/50 px-2.5 py-1.5 rounded-xl">
                <span className="text-emerald-800">🟢 Lộ trình 2 tuần</span>
                <span className="text-emerald-700 font-extrabold">6 buổi</span>
              </div>
              <div className="flex justify-between items-center bg-teal-50/60 border border-teal-200/50 px-2.5 py-1.5 rounded-xl">
                <span className="text-teal-800">🔵 Lộ trình 4 tuần</span>
                <span className="text-teal-700 font-extrabold">12 buổi</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50/40 border border-amber-200/50 px-2.5 py-1.5 rounded-xl">
                <span className="text-amber-800">💛 Lộ trình 6 tuần</span>
                <span className="text-amber-700 font-extrabold">18 buổi</span>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-bold text-primary">
                {currentPackage.tong_so_buoi} BUỔI
              </h3>
              <span className="text-[9px] text-zinc-400 mt-1 block font-semibold">Tối đa {currentPackage.so_dv_toi_da_moi_buoi || 5} dịch vụ mỗi buổi</span>
            </div>
          )}
        </div>

        {/* Card 3: Số lượng kỹ thuật lâm sàng */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden">
          <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-2">KỸ THUẬT NỘI BỘ TRONG GÓI</p>
          <div className="my-auto pt-2">
            <h3 className="text-2xl font-black text-secondary leading-none">
              {linkedServices.length} KỸ THUẬT
            </h3>
            <span className="text-[9.5px] text-zinc-455 mt-2 block font-medium leading-relaxed">
              Cấu trúc phác đồ y khoa nội bộ được đồng bộ tự động sang cả 3 mức của gói cố định.
            </span>
          </div>
        </div>
      </div>

      {/* Split-Screen Workspace Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Currently Linked Services (col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
          {/* Table Header toolbar */}
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
            <h3 className="font-heading font-extrabold text-xs text-secondary uppercase tracking-wider">
              Phác đồ cấu trúc kỹ thuật lâm sàng hiện tại ({linkedServices.length})
            </h3>
            <span className="text-[10px] font-bold text-zinc-450 bg-white border border-zinc-200 rounded-lg px-2.5 py-1 uppercase">
              HẠN MỨC BUỔI: TỐI ĐA {currentPackage.so_dv_toi_da_moi_buoi || 5} KỸ THUẬT / BUỔI
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-12 text-center">STT</th>
                  <th className="p-4">Dịch vụ kỹ thuật lâm sàng</th>
                  <th className="p-4 w-28 text-center">Chi tiết</th>
                  <th className="p-4 w-24 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {linkedServices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-zinc-450 bg-zinc-50/30">
                      <svg className="w-10 h-10 text-zinc-300 mx-auto mb-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">CHƯA CÓ KỸ THUẬT NÀO TRONG PHÁC ĐỒ</span>
                      <p className="text-[10px] text-zinc-400 mt-1 font-semibold">Chọn các kỹ thuật nội bộ sẵn có từ Thư viện ở cột bên phải để liên kết phác đồ.</p>
                    </td>
                  </tr>
                ) : (
                  linkedServices.map((svc: any, idx: number) => {
                    const isExpanded = !!expandedServiceIds[svc.id];

                    return (
                      <React.Fragment key={svc.id}>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="p-4 text-center font-bold text-zinc-400">
                            {idx + 1}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={getServiceImage(svc.id)} 
                                alt={svc.ten_dich_vu}
                                className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-sm shrink-0 select-none pointer-events-none"
                              />
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-secondary text-sm leading-snug">{svc.ten_dich_vu}</span>
                                  {svc.thiet_bi_yeu_cau && (
                                    <span className="text-[8px] font-bold bg-amber-50 border border-amber-250 text-amber-600 px-2 py-0.5 rounded shrink-0">
                                      {svc.thiet_bi_yeu_cau.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                  Kỹ thuật nội bộ phục hồi chuyên sâu
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => toggleExpand(svc.id)}
                              className={`inline-flex px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                                isExpanded 
                                  ? 'bg-primary-container border-primary/30 text-primary shadow-sm' 
                                  : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-650 hover:border-zinc-300'
                              }`}
                            >
                              <span>{isExpanded ? 'ẨN CHI TIẾT' : 'QUY TRÌNH'}</span>
                              <svg className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>

                          {/* Operations Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => handleRemoveService(svc)}
                                className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-450 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-90 bg-white shadow-sm"
                                title="Gỡ bỏ kỹ thuật ra khỏi gói"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Accordion Description */}
                        {isExpanded && (
                          <tr className="bg-primary/5 select-none animate-in fade-in duration-200">
                            <td colSpan={4} className="p-4 border-b border-zinc-200">
                              <div className="bg-white border border-primary/20 rounded-xl p-5 space-y-4 shadow-inner">
                                <div>
                                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <span>👨‍⚕️ CHI TIẾT THỰC HIỆN CỦA KỸ THUẬT VIÊN (KTV):</span>
                                  </p>
                                  <p className="text-xs text-secondary mt-1.5 font-semibold leading-relaxed">
                                    {svc.mo_ta_chi_tiet || svc.mo_ta_ngan || svc.mo_ta || "Chưa có quy trình thực hiện cụ thể được cấu hình cho kỹ thuật lâm sàng này."}
                                  </p>
                                </div>
                                <div className="border-t border-zinc-150 pt-3">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>🎯 LỢI ÍCH TRỊ LIỆU MANG LẠI CHO KHÁCH HÀNG:</span>
                                  </p>
                                  <ul className="list-disc pl-4 text-xs text-zinc-650 mt-1.5 space-y-1">
                                    {getServiceBenefitsList(svc).map((benefit: string, bIdx: number) => (
                                      <li key={bIdx} className="font-semibold leading-normal">{benefit}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Available Techniques Library (col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-[24px] shadow-sm overflow-hidden p-5 flex flex-col space-y-4">
          <div className="border-b border-zinc-150 pb-3">
            <h3 className="font-heading font-extrabold text-xs text-secondary uppercase tracking-wider">
              Thư viện kỹ thuật sẵn có ({availableServices.length})
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-1 leading-normal">Nhấp [+] để đẩy nhanh kỹ thuật lâm sàng y khoa vào phác đồ gói</p>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text"
              placeholder="Tìm nhanh kỹ thuật..."
              value={librarySearchTerm}
              onChange={(e) => setLibrarySearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary placeholder-zinc-350 shadow-inner font-semibold transition-all"
            />
          </div>

          {/* Available Library list */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
            {availableServices.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 font-semibold text-[11px] flex flex-col items-center gap-2">
                <span>📭 THƯ VIỆN KHÔNG CÒN KỸ THUẬT SẴN CÓ</span>
                <p className="text-[10px] text-zinc-450 font-medium leading-normal">Tất cả kỹ thuật nội bộ đã được thêm vào gói hoặc không khớp với từ khóa tìm kiếm.</p>
              </div>
            ) : (
              availableServices.map((svc) => (
                <div 
                  key={svc.id}
                  className="group relative flex items-center justify-between gap-3 p-3 bg-zinc-50 hover:bg-emerald-500/5 border border-zinc-200/80 hover:border-emerald-250/50 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-secondary text-xs truncate group-hover:text-primary transition-colors leading-normal">{svc.ten_dich_vu}</p>
                    {svc.thiet_bi_yeu_cau ? (
                      <span className="text-[8px] font-black text-amber-700 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase mt-1 inline-block tracking-wide">
                        {svc.thiet_bi_yeu_cau}
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold text-zinc-400 mt-1 inline-block">Kỹ thuật y khoa nội bộ</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleLinkService(svc)}
                    className="px-2.5 py-1.5 bg-white group-hover:bg-primary border border-zinc-200 group-hover:border-primary text-zinc-650 group-hover:text-white rounded-xl shadow-2xs font-extrabold text-[10px] flex items-center gap-1 transition-all shrink-0 active:scale-90"
                    title="Thêm kỹ thuật này vào gói"
                  >
                    <span>[+] THÊM</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
}
