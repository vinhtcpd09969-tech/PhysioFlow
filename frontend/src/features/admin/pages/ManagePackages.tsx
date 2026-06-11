import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPackages, deletePackage, getCategories } from '../../../api/admin.api';
import PackageModal from '../components/PackageModal';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function ManagePackages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Nhóm các phân khúc Basic, Standard, Intensive của gói cố định thành 1 dòng duy nhất trên UI
  const groupedPackages = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const singles: any[] = [];

    packages.forEach((pkg) => {
      // Xác định gói cố định thuộc phân khúc Basic/Standard/Intensive bằng suffix tên
      const match = pkg.ten_goi.match(/\s*-\s*(BASIC|STANDARD|INTENSIVE)\s*$/i);
      if (match) {
        const baseName = pkg.ten_goi.replace(/\s*-\s*(BASIC|STANDARD|INTENSIVE)\s*$/i, '').trim();
        if (!groups[baseName]) {
          groups[baseName] = [];
        }
        groups[baseName].push(pkg);
      } else {
        singles.push(pkg);
      }
    });

    const result: any[] = [...singles];

    Object.entries(groups).forEach(([baseName, list]) => {
      // Sắp xếp các phân khúc: BASIC -> STANDARD -> INTENSIVE
      const sorted = [...list].sort((a, b) => {
        const aName = a.ten_goi.toUpperCase();
        const bName = b.ten_goi.toUpperCase();
        if (aName.includes('BASIC')) return -1;
        if (bName.includes('BASIC')) return 1;
        if (aName.includes('STANDARD')) return -1;
        if (bName.includes('STANDARD')) return 1;
        return 0;
      });

      const basic = sorted.find(p => p.ten_goi.toUpperCase().includes('BASIC')) || sorted[0];
      const standard = sorted.find(p => p.ten_goi.toUpperCase().includes('STANDARD')) || sorted[0];
      const intensive = sorted.find(p => p.ten_goi.toUpperCase().includes('INTENSIVE')) || sorted[0];

      // Tạo một gói ảo đã được gộp phân khúc để hiển thị đại diện trên bảng
      result.push({
        id: standard.id, // Sử dụng ID của Standard làm ID đại diện (khi click xem chi tiết phác đồ)
        isGrouped: true,
        baseName,
        ten_goi: baseName,
        ma_goi: standard.ma_goi ? standard.ma_goi.replace(/-STD$/i, '') : '',
        mo_ta: standard.mo_ta,
        loai_goi: 'lieu_trinh',
        trang_thai: standard.trang_thai,
        ten_danh_muc: standard.ten_danh_muc,
        danh_muc_id: standard.danh_muc_id,
        so_dv_toi_da_moi_buoi: standard.so_dv_toi_da_moi_buoi,
        tong_so_buoi_range: `${basic.tong_so_buoi} - ${intensive.tong_so_buoi}`,
        gia_tien_range: `${currencyFormatter.format(basic.gia_tien)}đ - ${currencyFormatter.format(intensive.gia_tien)}đ`,
        basicPkg: basic,
        standardPkg: standard,
        intensivePkg: intensive,
        subPackages: sorted // giữ các tham chiếu của cả 3 gói y khoa để xóa/sửa đồng thời
      });
    });

    return result;
  }, [packages]);

  const filteredPackages = useMemo(() => {
    return groupedPackages.filter((pkg: any) => {
      const matchesSearch = pkg.ten_goi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.ma_goi && pkg.ma_goi.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || String(pkg.danh_muc_id) === String(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [groupedPackages, searchQuery, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgsRes, catsRes] = await Promise.all([
        getPackages(),
        getCategories()
      ]);
      setPackages(pkgsRes.data || []);
      setCategories((catsRes.data || []).filter((c: any) => c.loai_danh_muc === 'goi' && c.an_hien !== false));
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (pkg: any) => {
    const confirmName = pkg.isGrouped ? pkg.baseName : pkg.ten_goi;
    if (window.confirm(`Bạn có chắc chắn muốn xóa gói dịch vụ "${confirmName}" không?\nHành động này sẽ xóa toàn bộ các phân khúc liên quan.`)) {
      try {
        if (pkg.isGrouped && pkg.subPackages) {
          for (const sub of pkg.subPackages) {
            await deletePackage(sub.id);
          }
        } else {
          await deletePackage(pkg.id);
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
      id: undefined, // Clear the ID so it's treated as a new package creation flow
      ten_goi: `${pkg.isGrouped ? pkg.baseName : pkg.ten_goi} (Bản sao)`,
      ma_goi: '', // Let backend auto-generate a new code
    };
    setEditingPackage(duplicatedPkg);
    setIsModalOpen(true);
  };

  // KPI calculations
  const activeCount = useMemo(() => {
    return groupedPackages.filter((p: any) => p.trang_thai === 'hoat_dong').length;
  }, [groupedPackages]);

  const totalCount = useMemo(() => {
    return groupedPackages.length;
  }, [groupedPackages]);

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
          <p className="text-zinc-500 text-xs mt-1">Quản lý định giá, phân loại và cấu trúc phác đồ điều trị của các gói dịch vụ</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">GÓI ĐANG HOẠT ĐỘNG</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-primary">{activeCount}</h3>
            <span className="text-[10px] text-primary font-bold bg-primary-container px-2 py-0.5 border border-primary/20 rounded-lg">Kích hoạt</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">TỔNG SỐ LƯỢNG THIẾT LẬP</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-secondary">{totalCount}</h3>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-100 px-2 py-0.5 border border-zinc-200 rounded-lg">Hệ thống</span>
          </div>
        </div>
      </div>

      {/* Table Header Toolbar (Floating SaaS Control Card) */}
      <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between transition-all hover:shadow-md duration-300">
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-secondary font-heading flex-shrink-0">Danh sách gói dịch vụ y khoa ({filteredPackages.length})</h3>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Bộ lọc Danh mục Chuyên khoa */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary font-bold shadow-sm transition-all cursor-pointer hover:border-zinc-300"
          >
            <option value="all">📂 TẤT CẢ CHUYÊN KHOA</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                🏷️ {cat.ten_danh_muc.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã gói, tên gói..."
              value={searchQuery}
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
              className="pl-9 pr-4 py-2 w-full border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary placeholder-zinc-350 shadow-inner transition-all font-semibold animate-fade-in"
            />
          </div>
        </div>
      </div>

      {/* Float Card list wrapper */}
      <div className="space-y-5">
        {loading ? (
          <div className="px-6 py-16 text-center text-zinc-450 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            <span className="font-heading text-xs font-bold uppercase tracking-wider">Đang tải danh sách gói dịch vụ...</span>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="px-6 py-16 text-center text-zinc-400 bg-white border border-zinc-200 rounded-2xl shadow-sm animate-fade-in">
            <svg className="w-12 h-12 text-zinc-300 mx-auto mb-3 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-secondary">Không tìm thấy gói dịch vụ nào phù hợp</span>
            <p className="text-[10px] text-zinc-450 mt-1 font-semibold">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
          </div>
        ) : (
          <>
            {/* Header Column Labels Bar (Floating Glass SaaS Bar) */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3.5 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-zinc-500 font-bold uppercase tracking-wider text-[10px] select-none mb-3 shadow-2xs backdrop-blur-md">
              <div className="col-span-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Thông tin gói y khoa</span>
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Phân loại gói</span>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Bảng giá theo lộ trình</span>
              </div>
              <div className="col-span-1 text-center flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Hạn mức</span>
              </div>
              <div className="col-span-1 text-center flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Trạng thái</span>
              </div>
              <div className="col-span-3 text-right flex items-center justify-end gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Thao tác quản trị</span>
              </div>
            </div>

            {filteredPackages.map((pkg) => {
              const isInactive = pkg.trang_thai !== 'hoat_dong';

              return (
                <div 
                  key={pkg.id} 
                  className={`group relative bg-gradient-to-b from-white to-zinc-50/30 border border-zinc-200/90 rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-emerald-200/80 hover:shadow-[0_20px_50px_rgba(16,185,129,0.05)] hover:-translate-y-1.5 active:scale-[0.995] ${
                    isInactive ? 'opacity-70' : ''
                  }`}
                >
                  {/* Left accent bar on hover that glows beautifully and expands vertically */}
                  <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-r-2xl scale-y-50 group-hover:scale-y-100 opacity-0 group-hover:opacity-100 transition-all duration-300 origin-center shadow-sm ${
                    pkg.loai_goi === 'linh_dong' ? 'bg-amber-500 shadow-amber-300/50' : 'bg-primary shadow-emerald-400/50'
                  }`}></div>

                  {/* 12-Column CSS Grid Layout for Flawless Desktop Spatial Spacing */}
                  <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-6 lg:gap-4">
                    
                    {/* 1. THÔNG TIN GÓI (col-span-3) */}
                    <div className="col-span-12 lg:col-span-3 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-[9px] font-black text-zinc-500 bg-zinc-50 border border-zinc-200/70 px-2 py-0.5 rounded uppercase tracking-wider shadow-2xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                          <span>{pkg.ma_goi || 'CHƯA CÓ MÃ'}</span>
                        </span>
                        
                        <span className="text-[9px] text-teal-850 font-black bg-gradient-to-r from-teal-500/5 to-emerald-500/5 border border-teal-150/60 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs">
                          <svg className="w-3.5 h-3.5 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2 2v12m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{pkg.ten_danh_muc || 'Không phân loại'}</span>
                        </span>

                        {pkg.isGrouped && (
                          <span className="text-[8px] font-black bg-zinc-50 border border-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 shadow-2xs">
                            3 phân đoạn
                          </span>
                        )}
                      </div>
                      
                      <h4 
                        className="font-heading font-black text-[15px] text-secondary tracking-tight hover:text-primary transition-colors cursor-pointer mt-1 duration-200 leading-snug"
                        onClick={() => {
                          setEditingPackage(pkg);
                          setIsModalOpen(true);
                        }}
                      >
                        {pkg.ten_goi}
                      </h4>
                    </div>

                    {/* 2. PHÂN LOẠI GÓI (col-span-1) */}
                    <div className="col-span-12 lg:col-span-1 shrink-0 flex lg:justify-start">
                      {pkg.loai_goi === 'linh_dong' ? (
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-xl border tracking-wider uppercase shadow-2xs bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20 text-amber-700">
                          <svg className="w-3 h-3 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.11L12 15.202l-3.896 2.83c-.783.57-1.838-.197-1.538-1.11l1.518-4.674a1 1 0 00-.363-1.118L3.89 10.101c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <span>Gói Tự Chọn</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-xl border tracking-wider uppercase shadow-2xs bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-emerald-500/20 text-emerald-700">
                          <svg className="w-3 h-3 text-emerald-600 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Gói Cố Định</span>
                        </span>
                      )}
                    </div>

                    {/* 3. BẢNG GIÁ THEO LỘ TRÌNH (col-span-3) */}
                    <div className="col-span-12 lg:col-span-3 shrink-0">
                      {pkg.isGrouped ? (
                        <div className="flex flex-col gap-1.5 w-full max-w-[280px]">
                          {/* Mức Basic */}
                          <div className="flex items-center justify-between gap-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl px-3 py-1.5 shadow-2xs transition-all hover:scale-[1.03] hover:shadow-xs duration-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-emerald-800 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shadow-2xs">BSC</span>
                              <span className="font-extrabold text-secondary text-[10px]">6 buổi (2 tuần)</span>
                            </div>
                            <span className="font-black text-emerald-700 text-[11px] font-heading select-all">
                              {currencyFormatter.format(pkg.basicPkg?.gia_tien || 3594000)}đ
                            </span>
                          </div>
                          
                          {/* Mức Standard */}
                          <div className="flex items-center justify-between gap-4 bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/10 hover:border-teal-500/30 rounded-xl px-3 py-1.5 shadow-2xs transition-all hover:scale-[1.03] hover:shadow-xs duration-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-teal-800 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20 shadow-2xs">STD</span>
                              <span className="font-extrabold text-secondary text-[10px]">12 buổi (4 tuần)</span>
                            </div>
                            <span className="font-black text-teal-700 text-[11px] font-heading select-all">
                              {currencyFormatter.format(pkg.standardPkg?.gia_tien || 6588000)}đ
                            </span>
                          </div>

                          {/* Mức Intensive */}
                          <div className="flex items-center justify-between gap-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/30 rounded-xl px-3 py-1.5 shadow-2xs transition-all hover:scale-[1.03] hover:shadow-xs duration-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-amber-800 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-250 shadow-2xs">ITS</span>
                              <span className="font-extrabold text-secondary text-[10px]">18 buổi (6 tuần)</span>
                            </div>
                            <span className="font-black text-amber-700 text-[11px] font-heading select-all">
                              {currencyFormatter.format(pkg.intensivePkg?.gia_tien || 8982000)}đ
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 hover:border-amber-300 rounded-xl px-3.5 py-2 shadow-2xs max-w-[280px] transition-all hover:scale-[1.03] duration-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-amber-800 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shadow-2xs">FLEX</span>
                            <span className="font-extrabold text-secondary text-[10px]">{pkg.tong_so_buoi} buổi tự chọn</span>
                          </div>
                          <span className="font-black text-primary text-xs select-all">
                            {currencyFormatter.format(pkg.gia_tien)}đ
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 4. HẠN MỨC BUỔI TRỊ LIỆU (col-span-1) */}
                    <div className="col-span-12 lg:col-span-1 shrink-0 flex lg:justify-center">
                      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-slate-500/5 to-zinc-500/5 border border-slate-200/80 rounded-xl px-3.5 py-2 text-[10px] text-slate-700 font-semibold shadow-2xs">
                        <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Tối đa <strong className="text-primary font-black">{pkg.so_dv_toi_da_moi_buoi || 5}</strong> KT</span>
                      </div>
                    </div>

                    {/* 5. TRẠNG THÁI (col-span-1) */}
                    <div className="col-span-12 lg:col-span-1 shrink-0 flex lg:justify-center">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl border shadow-2xs ${
                        pkg.trang_thai === 'hoat_dong'
                          ? 'bg-emerald-500/5 text-emerald-700 border-emerald-500/20 shadow-inner'
                          : 'bg-zinc-100 text-zinc-400 border-zinc-200 shadow-inner'
                      }`}>
                        <span className="relative flex h-2 w-2">
                          {pkg.trang_thai === 'hoat_dong' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${pkg.trang_thai === 'hoat_dong' ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                        </span>
                        <span>{pkg.trang_thai === 'hoat_dong' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}</span>
                      </span>
                    </div>

                    {/* 6. THAO TÁC QUẢN TRỊ (col-span-3) */}
                    <div className="col-span-12 lg:col-span-3 shrink-0 flex items-center lg:justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/admin/packages/${pkg.id}/services`)}
                        className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-[0_4px_12px_rgba(16,185,129,0.15)] active:scale-95 text-white rounded-xl transition-all duration-200 shadow-sm flex items-center gap-1.5 font-bold text-[10px] tracking-wide whitespace-nowrap"
                        title="Chi tiết gói dịch vụ"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span>CHI TIẾT GÓI</span>
                      </button>
                      
                      <button
                        onClick={() => handleDuplicate(pkg)}
                        className="px-3 py-2.5 border border-zinc-200/80 hover:border-zinc-350 hover:bg-zinc-50 text-zinc-655 hover:text-zinc-800 rounded-xl transition-all duration-200 active:scale-95 bg-white shadow-2xs font-bold text-[9.5px]"
                        title="Nhân bản gói"
                      >
                        NHÂN BẢN
                      </button>

                      <button
                        onClick={() => {
                          setEditingPackage(pkg);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-2.5 border border-zinc-200/80 hover:border-primary/30 hover:bg-primary-container text-zinc-655 hover:text-primary rounded-xl transition-all duration-200 active:scale-95 bg-white shadow-2xs font-bold text-[9.5px]"
                        title="Chỉnh sửa cấu hình"
                      >
                        SỬA ĐỔI
                      </button>

                      <button
                        onClick={() => handleDelete(pkg)}
                        className="p-2.5 border border-zinc-200/80 hover:border-rose-300 hover:bg-rose-50/50 text-zinc-400 hover:text-rose-500 rounded-xl transition-all duration-200 active:scale-95 bg-white shadow-2xs"
                        title="Xóa gói dịch vụ"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Render Component Modal */}
      {isModalOpen && (
        <PackageModal
          services={[]}
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
