import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getServices, createService, updateService, deleteService, getCategories, getPackages } from '../../../api/admin.api';
import { useSearchParams } from 'react-router-dom';

const serviceSchema = z.object({
  danh_muc_id: z.number().min(1, 'Vui lòng chọn danh mục'),
  ten_dich_vu: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
  mo_ta: z.string().optional().nullable(),
  thoi_gian_uoc_tinh: z.number().min(1, 'Thời gian phải lớn hơn 0'),
  don_gia: z.number().min(0, 'Đơn giá phải từ 0đ'),
  thiet_bi_yeu_cau: z.string().optional().nullable(),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu']),
  loai_dich_vu: z.enum(['chinh', 'bo_sung']),
  hien_thi_website: z.boolean().default(true),
  mo_ta_chi_tiet: z.string().optional().nullable(),
  loai_dich_vu_ho_tro_str: z.string().optional().nullable()
});

type ServiceFormValues = z.infer<typeof serviceSchema>;
const currencyFormatter = new Intl.NumberFormat('vi-VN');

const getServiceImage = (id: string | number) => {
  const isEven = String(id).charCodeAt(0) % 2 === 0;
  return `https://images.unsplash.com/photo-${isEven ? '1576091160550-21080f0c7324' : '1544367567-0f2fcb009e0b'}?q=80&w=200&auto=format&fit=crop`;
};

// Check if a service is part of the 13 Shared Library services
const isSharedLibraryService = (svc: any) => {
  const name = svc.ten_dich_vu.toLowerCase();
  return (
    name.includes('deep tissue') ||
    name.includes('muscle release') ||
    name.includes('electrotherapy') ||
    name.includes('heat therapy') ||
    name.includes('cervical stretching') ||
    name.includes('spinal stretching') ||
    name.includes('stretching therapy') ||
    name.includes('shoulder mobility') ||
    name.includes('wrist mobility') ||
    name.includes('tendon release') ||
    name.includes('joint mobility') ||
    name.includes('piriformis release') ||
    name.includes('exercise guidance') ||
    (svc.mo_ta_ngan && svc.mo_ta_ngan.includes('SVC-'))
  );
};

const getServiceBenefits = (svc: any) => {
  if (svc.loai_dich_vu_ho_tro) {
    let benefits = svc.loai_dich_vu_ho_tro;
    if (typeof benefits === 'string') {
      try {
        benefits = JSON.parse(benefits);
      } catch (e) {}
    }
    if (Array.isArray(benefits) && benefits.length > 0) {
      return benefits;
    }
  }
  const name = (svc.ten_dich_vu || '').toLowerCase();
  if (name.includes('giải cơ') || name.includes('deep tissue')) {
    return [
      "Giải phóng các co cứng thắt cơ ở các sợi cơ sâu nhất.",
      "Tăng cung cấp oxy và tuần hoàn máu phục hồi mô tổn thương.",
      "Giảm nhanh chứng đau mỏi bả vai, thắt lưng mãn tính."
    ];
  }
  if (name.includes('điện xung') || name.includes('electrotherapy')) {
    return [
      "Ức chế tín hiệu đau dẫn truyền lên não bộ tức thì.",
      "Kích thích giải phóng hoóc-môn Endorphin tự nhiên của cơ thể để giảm đau.",
      "Tăng kích thích cơ vận động chống xơ hóa cơ lực."
    ];
  }
  if (name.includes('nhiệt') || name.includes('heat')) {
    return [
      "Giãn cơ toàn vùng, giải phóng tình trạng co cứng khớp cấp.",
      "Tăng tuần hoàn máu thúc đẩy đào thải axit lactic gây mỏi.",
      "Xoa dịu hệ thần kinh nhạy cảm, mang lại giấc ngủ sâu."
    ];
  }
  if (name.includes('kéo giãn') || name.includes('stretching')) {
    return [
      "Giải áp đĩa đệm thắt lưng thắt ngực tối đa, giải nén rễ thần kinh.",
      "Mở rộng lỗ liên hợp cột sống cổ và thắt lưng.",
      "Tăng tính đàn hồi cho nhóm cơ dựng gai và cơ dây chằng."
    ];
  }
  if (name.includes('vận động') || name.includes('mobility')) {
    return [
      "Bôi trơn diện khớp tăng tiết dịch ổ khớp tự nhiên.",
      "Ngăn chặn dính bao khớp gây đông cứng vai hoặc cổ tay.",
      "Khôi phục hoàn toàn biên độ vận động gập duỗi tự nhiên."
    ];
  }
  if (name.includes('bài tập') || name.includes('exercise')) {
    return [
      "Kích hoạt các nhóm cơ lõi bảo vệ cột sống thắt lưng.",
      "Chỉnh sửa sai lệch tư thế lệch vẹo vai hông tận gốc.",
      "Duy trì kết quả trị liệu lâm sàng, chống tái phát đau."
    ];
  }
  if (name.includes('gân cơ') || name.includes('tendon')) {
    return [
      "Tách dính gân cơ ở điểm bám tận vùng khuỷu tay, cổ tay.",
      "Giảm viêm điểm bám gân do các động tác gõ phím di chuột liên tục.",
      "Tăng cường lực cầm nắm, hết mỏi buốt ngón tay."
    ];
  }
  if (name.includes('massage')) {
    return [
      "Thư giãn hệ thần kinh ngoại biên, xua tan stress mệt mỏi.",
      "Thúc đẩy lưu thông hệ bạch huyết tăng cường thải độc.",
      "Xoa dịu cơ thể mềm mại, đem lại trạng thái sảng khoái sâu."
    ];
  }
  if (name.includes('giác hơi') || name.includes('cupping')) {
    return [
      "Tạo áp suất âm hút khí huyết ứ đọng giải độc cơ thắt lưng.",
      "Trị cảm lạnh cấp tính, giảm mỏi cơ tức thì.",
      "Kích thích tuần hoàn máu cục bộ tái tạo mô cơ."
    ];
  }
  if (name.includes('đá nóng') || name.includes('hotstone')) {
    return [
      "Nhiệt đá bazan tự nhiên thông kinh hoạt lạc toàn thân.",
      "Giảm lạnh chân tay, giữ ấm cơ sâu vùng lưng bụng.",
      "Đem lại giấc ngủ chất lượng cao và bình an tâm trí."
    ];
  }
  return [
    "Hỗ trợ giảm đau cơ xương khớp cục bộ an toàn chuẩn y khoa.",
    "Thúc đẩy quá trình tái tạo mô và rút ngắn thời gian hồi phục thể trạng.",
    "Nâng cao sức khỏe chủ động và cải thiện chất lượng cuộc sống hàng ngày."
  ];
};

export default function ManageServices() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'chinh' | 'bo_sung'>('all');
  
  const [expandedServiceIds, setExpandedServiceIds] = useState<Record<string, boolean>>({});

  const toggleExpandService = (id: string) => {
    setExpandedServiceIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: { 
      trang_thai: 'hoat_dong', 
      thoi_gian_uoc_tinh: 45, 
      don_gia: 0,
      loai_dich_vu: 'chinh',
      hien_thi_website: true
    }
  });

  const watchStatus = watch('trang_thai');
  const watchShowWeb = watch('hien_thi_website') !== false;
  const watchLoaiDichVu = watch('loai_dich_vu');

  useEffect(() => {
    if (!editingService) {
      if (watchLoaiDichVu === 'chinh') {
        setValue('hien_thi_website', false);
      } else if (watchLoaiDichVu === 'bo_sung') {
        setValue('hien_thi_website', true);
      }
    }
  }, [watchLoaiDichVu, editingService, setValue]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [svcRes, catRes, pkgsRes] = await Promise.all([
        getServices(), 
        getCategories(),
        getPackages()
      ]);
      setServices(svcRes.data);
      setCategories(catRes.data);
      setPackages(pkgsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  // Map service ID to the number of packages using it
  const packageCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    packages.forEach((pkg: any) => {
      if (pkg.chi_tiet_dich_vu && Array.isArray(pkg.chi_tiet_dich_vu)) {
        pkg.chi_tiet_dich_vu.forEach((item: any) => {
          const serviceId = item.dich_vu_id;
          if (serviceId) {
            map[serviceId] = (map[serviceId] || 0) + 1;
          }
        });
      }
    });
    return map;
  }, [packages]);

  // Map service ID to a list of package names using it
  const serviceUsageNamesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    packages.forEach((pkg: any) => {
      if (pkg.chi_tiet_dich_vu && Array.isArray(pkg.chi_tiet_dich_vu)) {
        pkg.chi_tiet_dich_vu.forEach((item: any) => {
          const serviceId = item.dich_vu_id;
          if (serviceId) {
            if (!map[serviceId]) map[serviceId] = [];
            map[serviceId].push(pkg.ten_goi);
          }
        });
      }
    });
    return map;
  }, [packages]);

  const onSubmit = async (data: any) => {
    try {
      // Split multiline string into array of strings for backend
      const benefits = data.loai_dich_vu_ho_tro_str
        ? data.loai_dich_vu_ho_tro_str.split('\n').map((line: string) => line.trim()).filter(Boolean)
        : [];

      const payload = {
        danh_muc_id: data.danh_muc_id,
        ten_dich_vu: data.ten_dich_vu,
        mo_ta: data.mo_ta,
        thoi_gian_uoc_tinh: data.thoi_gian_uoc_tinh,
        don_gia: data.don_gia,
        thiet_bi_yeu_cau: data.thiet_bi_yeu_cau,
        trang_thai: data.trang_thai,
        loai_dich_vu: data.loai_dich_vu,
        hien_thi_website: data.hien_thi_website,
        mo_ta_chi_tiet: data.mo_ta_chi_tiet || '',
        loai_dich_vu_ho_tro: benefits
      };

      if (editingService) {
        await updateService(editingService.id, payload);
      } else {
        await createService(payload);
      }
      setIsModalOpen(false);
      setEditingService(null);
      reset();
      fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      alert(editingService ? 'Có lỗi xảy ra khi cập nhật dịch vụ' : 'Có lỗi xảy ra khi tạo dịch vụ');
    }
  };

  const handleEdit = (svc: any) => {
    setEditingService(svc);

    // Format array benefits back to multiline text for frontend textarea
    let benefitsStr = '';
    if (svc.loai_dich_vu_ho_tro) {
      let parsed = svc.loai_dich_vu_ho_tro;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch(e) {}
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        benefitsStr = parsed.join('\n');
      }
    }

    // UX Improvement: If benefits are empty in DB, load the default fallback benefits
    if (!benefitsStr) {
      benefitsStr = getServiceBenefits(svc).join('\n');
    }

    // UX Improvement: If mo_ta_chi_tiet is empty, load the short description as default
    const defaultMoTaChiTiet = svc.mo_ta_chi_tiet || svc.mo_ta_ngan || svc.mo_ta || '';

    reset({
      danh_muc_id: Number(svc.danh_muc_id),
      ten_dich_vu: svc.ten_dich_vu,
      mo_ta: svc.mo_ta_ngan || svc.mo_ta || '',
      thoi_gian_uoc_tinh: Number(svc.thoi_gian_uoc_tinh),
      don_gia: Number(svc.don_gia),
      thiet_bi_yeu_cau: svc.thiet_bi_yeu_cau || '',
      trang_thai: svc.trang_thai === 'hoat_dong' ? 'hoat_dong' : 'vo_hieu',
      loai_dich_vu: svc.loai_dich_vu === 'bo_sung' ? 'bo_sung' : 'chinh',
      hien_thi_website: svc.hien_thi_website !== false,
      mo_ta_chi_tiet: defaultMoTaChiTiet,
      loai_dich_vu_ho_tro_str: benefitsStr
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (svc: any) => {
    const confirmMsg = `Bạn có chắc chắn muốn xóa dịch vụ "${svc.ten_dich_vu}" không?\nHành động này không thể hoàn tác và có thể ảnh hưởng đến các gói đang sử dụng dịch vụ này.`;
    if (window.confirm(confirmMsg)) {
      try {
        await deleteService(svc.id);
        fetchData();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Không thể xóa dịch vụ này. Vui lòng kiểm tra lại liên kết gói hoặc liệu trình.');
      }
    }
  };

  const handleToggleStatus = async (svc: any) => {
    const nextStatus = svc.trang_thai === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong';
    try {
      await updateService(svc.id, {
        danh_muc_id: Number(svc.danh_muc_id),
        ten_dich_vu: svc.ten_dich_vu,
        mo_ta: svc.mo_ta_ngan || svc.mo_ta || '',
        thoi_gian_uoc_tinh: Number(svc.thoi_gian_uoc_tinh),
        don_gia: Number(svc.don_gia),
        thiet_bi_yeu_cau: svc.thiet_bi_yeu_cau || '',
        trang_thai: nextStatus,
        loai_dich_vu: svc.loai_dich_vu || 'chinh',
        hien_thi_website: svc.hien_thi_website !== false
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Không thể cập nhật trạng thái dịch vụ');
    }
  };

  const filteredServices = useMemo(() => {
    let result = services;
    
    // Filter by Tab
    if (activeTab !== 'all') {
      result = result.filter(svc => svc.loai_dich_vu === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(svc => 
        svc.ten_dich_vu.toLowerCase().includes(q) ||
        (svc.ten_danh_muc && svc.ten_danh_muc.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [services, activeTab, searchQuery]);

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
          <h2 className="text-2xl font-bold font-heading text-secondary tracking-tight">CẤU HÌNH DANH MỤC DỊCH VỤ</h2>
          <p className="text-zinc-500 text-xs mt-1">Cấu hình thời lượng trị liệu, đơn giá và quản lý định danh dịch vụ linh động/bổ trợ</p>
        </div>
        <button 
          onClick={() => { 
            setEditingService(null);
            reset({ 
              trang_thai: 'hoat_dong', 
              thoi_gian_uoc_tinh: 45, 
              don_gia: 0,
              loai_dich_vu: 'chinh',
              ten_dich_vu: '',
              mo_ta: '',
              thiet_bi_yeu_cau: '',
              hien_thi_website: true,
              danh_muc_id: categories[0]?.id ? Number(categories[0].id) : undefined
            }); 
            setIsModalOpen(true); 
          }}
          className="bg-primary hover:bg-primary/90 hover:shadow-soft-button active:scale-95 text-white px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2"
        >
          [+] THÊM DỊCH VỤ MỚI
        </button>
      </div>

      {/* KPI HUD Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">TỔNG SỐ DỊCH VỤ</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-secondary">{services.length}</h3>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-100 px-2 py-0.5 border border-zinc-200 rounded-lg">Mục</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">KỸ THUẬT TRỊ LIỆU (NỘI BỘ)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-primary">
              {services.filter(s => s.loai_dich_vu !== 'bo_sung').length}
            </h3>
            <span className="text-[10px] text-primary font-bold bg-primary-container px-2 py-0.5 border border-primary/20 rounded-lg">Kỹ thuật</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">DỊCH VỤ ĐƠN LẺ (CÔNG KHAI)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-zinc-700">
              {services.filter(s => s.loai_dich_vu === 'bo_sung').length}
            </h3>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-100 px-2 py-0.5 border border-zinc-200 rounded-lg">Dịch vụ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">ĐANG TẠM NGƯNG</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-amber-500">
              {services.filter(s => s.trang_thai !== 'hoat_dong').length}
            </h3>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 border border-amber-200 rounded-lg">Vô hiệu</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Section */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        
        {/* Workspace Controls / Tabs & Search */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* HUD Tabs */}
          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'all' 
                  ? 'bg-white text-secondary shadow-sm border border-zinc-200' 
                  : 'text-zinc-500 hover:text-secondary'
              }`}
            >
              TẤT CẢ
            </button>
            <button
              onClick={() => setActiveTab('chinh')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'chinh' 
                  ? 'bg-primary text-white shadow-sm border border-primary/20' 
                  : 'text-zinc-500 hover:text-primary'
              }`}
            >
              KỸ THUẬT TRỊ LIỆU (NỘI BỘ)
            </button>
            <button
              onClick={() => setActiveTab('bo_sung')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'bo_sung' 
                  ? 'bg-zinc-700 text-white shadow-sm border border-zinc-650' 
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              DỊCH VỤ ĐƠN LẺ (CÔNG KHAI)
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Tìm kiếm dịch vụ, danh mục..." 
              value={searchQuery}
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
              className="pl-9 pr-4 py-2 w-full border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary placeholder-zinc-400 transition-all shadow-inner" 
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[11px] font-bold font-heading uppercase tracking-wider">
                <th className="p-4">Dịch vụ</th>
                <th className="p-4">Phân loại</th>
                <th className="p-4">Dùng trong gói</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4 text-right">Thời lượng</th>
                <th className="p-4 text-right">Đơn giá</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-400 font-sans text-xs">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                    ĐANG TRUY VẤN CƠ SỞ DỮ LIỆU...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-400 font-sans text-xs">
                    KHÔNG TÌM THẤY KẾT QUẢ PHÙ HỢP
                  </td>
                </tr>
              ) : (
                filteredServices.map((svc) => {
                  const shared = isSharedLibraryService(svc);
                  const pkgCount = packageCountMap[svc.id] || 0;
                  const usageNames = serviceUsageNamesMap[svc.id] || [];
                  const isExpanded = !!expandedServiceIds[svc.id];

                  return (
                    <React.Fragment key={svc.id}>
                      <tr className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={getServiceImage(svc.id)} alt={svc.ten_dich_vu} className="w-10 h-10 rounded-xl border border-zinc-200 object-cover shadow-sm shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-secondary text-sm">{svc.ten_dich_vu}</p>
                                {shared && (
                                  <span className="text-[9px] font-heading font-bold bg-primary-container border border-primary/20 text-primary px-1.5 py-0.5 rounded shrink-0">
                                    DÙNG CHUNG
                                  </span>
                                )}
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                  svc.hien_thi_website !== false
                                    ? 'bg-emerald-50 border-emerald-250 text-emerald-600'
                                    : 'bg-amber-50 border-amber-250 text-amber-600'
                                }`}>
                                  {svc.hien_thi_website !== false ? 'CÔNG KHAI' : 'NỘI BỘ'}
                                </span>
                              </div>
                              {svc.thiet_bi_yeu_cau && (
                                <span className="text-[9px] text-zinc-400 mt-0.5 inline-block">
                                  THIẾT BỊ: {svc.thiet_bi_yeu_cau.toUpperCase()}
                                </span>
                              )}
                            </div>
                            
                            {/* Expand eye icon */}
                            <button
                              type="button"
                              onClick={() => toggleExpandService(svc.id)}
                              className={`p-1.5 rounded-lg border flex items-center justify-center transition-all shrink-0 hover:bg-zinc-50 ${
                                isExpanded 
                                  ? 'bg-primary-container border-primary/30 text-primary shadow-sm' 
                                  : 'bg-white border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:border-zinc-300'
                              }`}
                              title="Xem mô tả quy trình & lợi ích"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isExpanded ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.024 10.024 0 014.507-5.323m3.36-.262A2.97 2.97 0 0012 6.5a3 3 0 00-3 3 2.97 2.97 0 00.263 1.255m7.86 4.93A10.007 10.007 0 0121.542 12c-1.274 4.057-5.064 7-9.542 7-1.106 0-2.17-.18-3.155-.515M12 9a3 3 0 100 6 3 3 0 000-6zm0 0v6" />
                                ) : (
                                  <>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </>
                                )}
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          {svc.loai_dich_vu === 'bo_sung' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-emerald-250 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase">
                              Dịch vụ đơn lẻ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-primary/20 bg-primary-container text-primary text-[10px] font-bold uppercase">
                              Kỹ thuật trị liệu
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {pkgCount > 0 ? (
                            <div className="relative group inline-block">
                              <span className="cursor-help inline-flex items-center px-2 py-0.5 rounded-lg border border-zinc-200 bg-zinc-100 text-primary text-[10px] font-bold uppercase hover:bg-primary-container transition-colors">
                                {pkgCount} GÓI
                              </span>
                              
                              <div className="pointer-events-none absolute left-0 bottom-full mb-1 w-64 p-3 bg-secondary text-[11px] text-zinc-300 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 space-y-1.5 border border-zinc-800">
                                <p className="font-bold text-primary uppercase tracking-wider mb-1 border-b border-zinc-800 pb-1">Xuất hiện trong các gói:</p>
                                {usageNames.map((name, index) => (
                                  <p key={index} className="truncate">• {name}</p>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-zinc-150 bg-zinc-50 text-zinc-400 text-[10px] font-bold uppercase">
                              CHƯA DÙNG
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-secondary text-xs font-bold uppercase">
                            {svc.ten_danh_muc || 'Chưa phân loại'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-zinc-600 text-xs">
                          {svc.thoi_gian_uoc_tinh} PHÚT
                        </td>
                        <td className="p-4 text-right font-bold text-primary text-sm">
                          {currencyFormatter.format(svc.don_gia)}đ
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-2">
                            <button 
                              onClick={() => handleToggleStatus(svc)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                                svc.trang_thai === 'hoat_dong' ? 'bg-primary' : 'bg-zinc-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  svc.trang_thai === 'hoat_dong' ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                              svc.trang_thai === 'hoat_dong' ? 'text-primary' : 'text-zinc-400'
                            }`}>
                              {svc.trang_thai === 'hoat_dong' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(svc)}
                              className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-primary hover:border-primary hover:bg-primary-container transition-all active:scale-90 bg-white shadow-sm"
                              title="Chỉnh sửa dịch vụ"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(svc)}
                              className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-90 bg-white shadow-sm"
                              title="Xóa dịch vụ"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-primary/5 select-none animate-in fade-in duration-200">
                          <td colSpan={8} className="p-4 border-b border-zinc-200">
                            <div className="bg-white border border-primary/20 rounded-xl p-5 space-y-4 shadow-inner">
                              <div>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                  <span>👨‍⚕️ CHI TIẾT THỰC HIỆN CỦA KỸ THUẬT VIÊN:</span>
                                </p>
                                <p className="text-xs text-secondary mt-1.5 font-semibold leading-relaxed">
                                  {svc.mo_ta_chi_tiet || svc.mo_ta_ngan || svc.mo_ta || "Chưa có mô tả quy trình thực hiện cụ thể cho kỹ thuật này."}
                                </p>
                              </div>
                              <div className="border-t border-zinc-150 pt-3">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>🎯 LỢI ÍCH ĐIỀU TRỊ MANG LẠI CHO KHÁCH HÀNG:</span>
                                </p>
                                <ul className="list-disc pl-4 text-xs text-zinc-650 mt-1.5 space-y-1">
                                  {getServiceBenefits(svc).map((benefit, bIdx) => (
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
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-zinc-200 flex items-center justify-between bg-zinc-50/50 text-zinc-500 text-xs">
          <p className="font-semibold">
            Hiển thị <span className="font-bold text-secondary">1 - {filteredServices.length}</span> trong tổng số <span className="font-bold text-secondary">{filteredServices.length}</span> danh mục
          </p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-400 active:scale-95 font-bold transition-all">TRƯỚC</button>
            <button className="px-3.5 py-1.5 rounded-lg border border-primary/20 bg-primary text-white font-bold transition-all shadow-sm">1</button>
            <button className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-400 active:scale-95 font-bold transition-all">KẾ TIẾP</button>
          </div>
        </div>
      </div>

      {/* HUD Pro Max Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-250 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] text-secondary animate-in slide-in-from-bottom-8 duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-200 bg-zinc-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <h3 className="text-sm font-bold font-heading tracking-wide uppercase">
                  {editingService ? `[CHỈNH SỬA] DỊCH VỤ Y TẾ` : `[THÊM MỚI] DỊCH VỤ Y TẾ`}
                </h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingService(null); }} 
                className="text-zinc-400 hover:text-secondary text-xs border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-xl bg-white shadow-sm transition-all"
              >
                [ ĐÓNG ]
              </button>
            </div>
            
            {/* Form Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-xs">
                
                {/* HỘP 1: THÔNG TIN CƠ BẢN */}
                <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">HỘP 1: THÔNG TIN CƠ BẢN</h4>
                  
                  <div>
                    <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">TÊN DỊCH VỤ KỸ THUẬT *</label>
                    <input 
                      {...register('ten_dich_vu')} 
                      placeholder="Nhập tên dịch vụ y tế..."
                      className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary text-sm placeholder-zinc-300 shadow-sm"
                    />
                    {errors.ten_dich_vu && (
                      <span className="text-rose-500 text-[10px] mt-1 block">{errors.ten_dich_vu.message}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">DANH MỤC CHUYÊN KHOA</label>
                      <select 
                        {...register('danh_muc_id', { valueAsNumber: true })} 
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm"
                      >
                        <option value="">-- CHỌN DANH MỤC --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id} className="bg-white">{c.ten_danh_muc.toUpperCase()}</option>
                        ))}
                      </select>
                      {errors.danh_muc_id && (
                        <span className="text-rose-500 text-[10px] mt-1 block">{errors.danh_muc_id.message}</span>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">TRẠNG THÁI HOẠT ĐỘNG</label>
                      <div 
                        className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl flex items-center justify-between cursor-pointer shadow-sm"
                        onClick={() => setValue('trang_thai', watchStatus === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong')}
                      >
                        <span className={`font-bold text-xs ${watchStatus === 'hoat_dong' ? 'text-primary' : 'text-zinc-400'}`}>
                          {watchStatus === 'hoat_dong' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}
                        </span>
                        <div className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${watchStatus === 'hoat_dong' ? 'bg-primary' : 'bg-zinc-200'}`}>
                          <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transform transition-transform ${watchStatus === 'hoat_dong' ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">HIỂN THỊ WEBSITE</label>
                      <div 
                        className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl flex items-center justify-between cursor-pointer shadow-sm"
                        onClick={() => setValue('hien_thi_website', !watchShowWeb)}
                      >
                        <span className={`font-bold text-xs ${watchShowWeb ? 'text-primary' : 'text-zinc-400'}`}>
                          {watchShowWeb ? 'CÔNG KHAI' : 'NỘI BỘ'}
                        </span>
                        <div className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${watchShowWeb ? 'bg-primary' : 'bg-zinc-200'}`}>
                          <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transform transition-transform ${watchShowWeb ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HỘP 2: CẤU HÌNH LÂM SÀNG */}
                <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">HỘP 2: CẤU HÌNH LÂM SÀNG & CHI PHÍ</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">PHÂN LOẠI DỊCH VỤ</label>
                      <select
                        {...register('loai_dich_vu')}
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-primary text-xs shadow-sm"
                      >
                        <option value="chinh">KỸ THUẬT TRỊ LIỆU (NỘI BỘ - CẤU HÌNH GÓI)</option>
                        <option value="bo_sung">DỊCH VỤ ĐƠN LẺ (CÔNG KHAI WEBSITE)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">THỜI LƯỢNG ĐỊNH MỨC</label>
                      <select 
                        {...register('thoi_gian_uoc_tinh', { valueAsNumber: true })} 
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm"
                      >
                        <option value={10}>10 PHÚT</option>
                        <option value={12}>12 PHÚT</option>
                        <option value={15}>15 PHÚT</option>
                        <option value={20}>20 PHÚT</option>
                        <option value={25}>25 PHÚT</option>
                        <option value={30}>30 PHÚT</option>
                        <option value={40}>40 PHÚT</option>
                        <option value={45}>45 PHÚT</option>
                        <option value={50}>50 PHÚT</option>
                        <option value={60}>60 PHÚT</option>
                        <option value={75}>75 PHÚT</option>
                        <option value={90}>90 PHÚT</option>
                        <option value={105}>105 PHÚT</option>
                        <option value={120}>120 PHÚT</option>
                      </select>
                      {errors.thoi_gian_uoc_tinh && (
                        <span className="text-rose-500 text-[10px] mt-1 block">{errors.thoi_gian_uoc_tinh.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">ĐƠN GIÁ (VNĐ) *</label>
                      <input 
                        type="number"
                        {...register('don_gia', { valueAsNumber: true })} 
                        placeholder="0"
                        className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-secondary text-right shadow-sm text-sm"
                      />
                      {errors.don_gia && (
                        <span className="text-rose-500 text-[10px] mt-1 block">{errors.don_gia.message}</span>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">THIẾT BỊ YÊU CẦU</label>
                      <input 
                        {...register('thiet_bi_yeu_cau')} 
                        placeholder="Ví dụ: Máy điện xung, Máy siêu âm..."
                        className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* HỘP 3: MÔ TẢ TRỊ LIỆU & QUY TRÌNH LÂM SÀNG */}
                <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">HỘP 3: MÔ TẢ TRỊ LIỆU & QUY TRÌNH LÂM SÀNG</h4>
                  
                  <div>
                    <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">MÔ TẢ NGẮN (HIỂN THỊ CHUNG)</label>
                    <textarea 
                      {...register('mo_ta')} 
                      rows={2}
                      className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-300 resize-none font-semibold text-xs shadow-sm"
                      placeholder="Mô tả công dụng y khoa sơ bộ..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">QUY TRÌNH THỰC HIỆN CỦA KỸ THUẬT VIÊN (KTV LÀM GÌ)</label>
                    <textarea 
                      {...register('mo_ta_chi_tiet')} 
                      rows={3}
                      className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-300 resize-none font-semibold text-xs shadow-sm"
                      placeholder="Mô tả chi tiết từng bước Kỹ thuật viên sẽ thao tác trên khách hàng..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">LỢI ÍCH Y KHOA MANG LẠI CHO KHÁCH (MỖI DÒNG LÀ 1 LỢI ÍCH)</label>
                    <textarea 
                      {...register('loai_dich_vu_ho_tro_str')} 
                      rows={3}
                      className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-300 resize-none font-semibold text-xs shadow-sm"
                      placeholder="Nhập từng lợi ích trên 1 dòng..."
                    ></textarea>
                  </div>
                </div>

              </div>
              
              {/* Pinned Footer */}
              <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 shrink-0 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setEditingService(null); }} 
                  className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-secondary font-bold rounded-xl shadow-sm transition-all text-center"
                >
                  HỦY BỎ
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-sm hover:shadow-soft-button transition-all text-center"
                >
                  {editingService ? 'CẬP NHẬT' : 'TẠO MỚI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
