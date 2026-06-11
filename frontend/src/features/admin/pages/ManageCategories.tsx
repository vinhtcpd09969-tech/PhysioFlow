import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  ClipboardList, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getServices,
  getPackages
} from '../../../api/admin.api';

// Validation Schema using Zod
const categoryFormSchema = z.object({
  ten_danh_muc: z.string().min(1, 'Tên danh mục là bắt buộc'),
  mo_ta: z.string().optional().nullable(),
  loai_danh_muc: z.enum(['dich_vu', 'goi']),
  thu_tu_hien_thi: z.coerce.number().int().nonnegative('Thứ tự hiển thị phải là số không âm'),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

interface Category {
  id: string | number;
  ten_danh_muc: string;
  mo_ta: string | null;
  thu_tu_hien_thi: number;
  an_hien: boolean;
  loai_danh_muc: 'dich_vu' | 'goi';
}

export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'dich_vu' | 'goi'>('dich_vu');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // React Hook Form
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    watch,
    formState: { errors, isSubmitting } 
  } = useForm<any>({
    resolver: zodResolver(categoryFormSchema) as any,
    defaultValues: {
      ten_danh_muc: '',
      mo_ta: '',
      loai_danh_muc: 'dich_vu',
      thu_tu_hien_thi: 0,
      trang_thai: 'hoat_dong'
    }
  });

  // Load essential data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, svcRes, pkgRes] = await Promise.all([
        getCategories(),
        getServices(),
        getPackages()
      ]);
      setCategories(catRes.data || []);
      setServices(svcRes.data || []);
      setPackages(pkgRes.data || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu danh mục:', err);
      showTimedMessage('Không thể kết nối đến hệ thống máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showTimedMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4500);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    reset({
      ten_danh_muc: '',
      mo_ta: '',
      loai_danh_muc: selectedType,
      thu_tu_hien_thi: categories.filter(c => c.loai_danh_muc === selectedType).length * 10,
      trang_thai: 'hoat_dong'
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    reset({
      ten_danh_muc: category.ten_danh_muc,
      mo_ta: category.mo_ta || '',
      loai_danh_muc: category.loai_danh_muc,
      thu_tu_hien_thi: category.thu_tu_hien_thi,
      trang_thai: category.an_hien ? 'hoat_dong' : 'vo_hieu'
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Submit Handler
  const onSubmit = async (data: any) => {
    try {
      setErrorMsg(null);
      if (editingCategory) {
        // Update
        const res = await updateCategory(editingCategory.id.toString(), data);
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...res.data } : c));
        showTimedMessage('Cập nhật danh mục thành công!', 'success');
      } else {
        // Create
        const res = await createCategory(data);
        setCategories(prev => [...prev, res.data]);
        showTimedMessage('Thêm danh mục mới thành công!', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi khi lưu danh mục:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu trữ thông tin danh mục';
      setErrorMsg(msg);
    }
  };

  // Delete Handler
  const handleDelete = async (category: Category) => {
    // Check usage restrictions
    const linkedCount = getLinkedCount(category);
    if (linkedCount > 0) {
      const typeLabel = category.loai_danh_muc === 'dich_vu' ? 'dịch vụ lẻ' : 'gói dịch vụ';
      alert(`Không thể xóa danh mục này vì hiện có ${linkedCount} ${typeLabel} đang liên kết sử dụng nó.`);
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.ten_danh_muc}" không?`)) {
      return;
    }

    try {
      await deleteCategory(category.id.toString());
      setCategories(prev => prev.filter(c => c.id !== category.id));
      showTimedMessage('Đã xóa danh mục thành công!', 'success');
    } catch (err: any) {
      console.error('Lỗi khi xóa danh mục:', err);
      alert('Lỗi máy chủ khi thực hiện thao tác xóa danh mục.');
    }
  };

  // Get count of linked services or packages
  const getLinkedCount = (category: Category) => {
    if (category.loai_danh_muc === 'dich_vu') {
      return services.filter(s => Number(s.danh_muc_id) === Number(category.id) && s.loai_dich_vu === 'bo_sung').length;
    } else {
      // Deduplicate packages by base name to treat sister segments as 1 package family unit
      const linkedPkgs = packages.filter(p => Number(p.danh_muc_id) === Number(category.id));
      const uniqueBaseNames = new Set(
        linkedPkgs.map(p => p.ten_goi.replace(/\s*-\s*(BASIC|STANDARD|INTENSIVE)\s*$/i, '').trim())
      );
      return uniqueBaseNames.size;
    }
  };

  // Filter Categories list
  const filteredCategories = categories.filter(c => {
    const matchesType = c.loai_danh_muc === selectedType;
    const matchesSearch = c.ten_danh_muc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.mo_ta && c.mo_ta.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

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
          <h2 className="text-2xl font-bold font-heading text-secondary tracking-tight">CẤU HÌNH DANH MỤC HỆ THỐNG</h2>
          <p className="text-zinc-500 text-xs mt-1">Phân bổ danh mục dịch vụ công khai & thiết lập phân loại nhóm phác đồ trị liệu trọn gói</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-primary hover:bg-primary/90 hover:shadow-soft-button active:scale-95 text-white px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2"
        >
          [+] THÊM DANH MỤC MỚI
        </button>
      </div>

      {/* Dynamic Messages alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-slide-up">
          <Check size={16} className="text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* 2 Premium Symmetrical HUD Filter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Danh mục dịch vụ lẻ */}
        <div 
          onClick={() => setSelectedType('dich_vu')}
          className={`cursor-pointer relative overflow-hidden rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between group select-none min-h-[145px] ${
            selectedType === 'dich_vu'
              ? 'bg-gradient-to-br from-zinc-700 to-slate-900 border-zinc-700 text-white shadow-lg shadow-zinc-700/10 scale-[1.01]'
              : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400 hover:shadow-md hover:scale-[1.005]'
          }`}
        >
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                selectedType === 'dich_vu' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}>
                Dịch vụ đơn lẻ
              </span>
              <h3 className={`text-base font-black tracking-tight mt-2.5 ${
                selectedType === 'dich_vu' ? 'text-white' : 'text-zinc-800'
              }`}>
                DANH MỤC DỊCH VỤ LẺ
              </h3>
              <p className={`text-[11px] leading-normal font-semibold mt-1.5 max-w-[85%] ${
                selectedType === 'dich_vu' ? 'text-slate-200/90' : 'text-zinc-500'
              }`}>
                Chứa các phân nhóm dịch vụ khám lượng giá, trị liệu chuyên biệt hay add-on bổ trợ phục vụ đặt lịch hẹn trực tiếp của khách hàng.
              </p>
            </div>
            
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
              selectedType === 'dich_vu'
                ? 'bg-white/20 text-white border border-white/25'
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              ✨
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-current/15">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black">{categories.filter(c => c.loai_danh_muc === 'dich_vu').length}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85">danh mục dịch vụ lẻ</span>
            </div>
            {selectedType === 'dich_vu' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-white text-zinc-700 px-3 py-1 rounded-lg shadow-sm border border-zinc-200">
                ĐANG CHỌN
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Danh mục gói trị liệu */}
        <div 
          onClick={() => setSelectedType('goi')}
          className={`cursor-pointer relative overflow-hidden rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between group select-none min-h-[145px] ${
            selectedType === 'goi'
              ? 'bg-gradient-to-br from-zinc-700 to-slate-900 border-zinc-700 text-white shadow-lg shadow-zinc-700/10 scale-[1.01]'
              : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400 hover:shadow-md hover:scale-[1.005]'
          }`}
        >
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                selectedType === 'goi' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}>
                Trọn gói trị liệu
              </span>
              <h3 className={`text-base font-black tracking-tight mt-2.5 ${
                selectedType === 'goi' ? 'text-white' : 'text-zinc-800'
              }`}>
                DANH MỤC GÓI DỊCH VỤ
              </h3>
              <p className={`text-[11px] leading-normal font-semibold mt-1.5 max-w-[85%] ${
                selectedType === 'goi' ? 'text-slate-200/90' : 'text-zinc-500'
              }`}>
                Chứa các danh mục nhóm phác đồ dài ngày (đau vai gáy, thoát vị đĩa đệm, hậu phẫu...) được cấu hình giá trị ưu đãi trọn gói.
              </p>
            </div>
            
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
              selectedType === 'goi'
                ? 'bg-white/20 text-white border border-white/25'
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              📦
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-current/15">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black">{categories.filter(c => c.loai_danh_muc === 'goi').length}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85">danh mục gói trị liệu</span>
            </div>
            {selectedType === 'goi' && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-white text-zinc-700 px-3 py-1 rounded-lg shadow-sm border border-zinc-200">
                ĐANG CHỌN
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Main Workspace Section */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        
        {/* Search & Actions Header */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-zinc-50 p-4 border-b border-zinc-200">
          <div className="relative flex-1 max-w-sm group">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Tìm kiếm tên hoặc mô tả danh mục...`}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
            />
          </div>
          <div className="text-[11px] font-bold text-zinc-450 flex items-center gap-2">
            Đang hiển thị <span className="text-zinc-800 font-extrabold bg-zinc-200 px-2 py-0.5 rounded-md">{filteredCategories.length}</span> danh mục
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-zinc-500 font-semibold flex flex-col items-center gap-3">
              <div className="size-8 rounded-full border-4 border-zinc-200 border-t-primary animate-spin"></div>
              Đang tải danh sách cấu hình hệ thống...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-24 text-center text-zinc-400 font-semibold flex flex-col items-center gap-2">
              <ClipboardList size={36} className="text-zinc-300 animate-pulse" />
              <span>Chưa có danh mục nào được thiết lập cho tab này</span>
              <button 
                onClick={openAddModal}
                className="text-primary hover:text-primary/80 text-xs mt-1.5 underline underline-offset-4 font-bold"
              >
                Tạo danh mục đầu tiên ngay
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-wider border-b border-zinc-150">
                  <th className="py-3.5 px-6 w-16 text-center">Thứ tự</th>
                  <th className="py-3.5 px-4 w-72">Tên danh mục</th>
                  <th className="py-3.5 px-4">Mô tả tóm tắt</th>
                  <th className="py-3.5 px-4 w-36 text-center">Đang liên kết</th>
                  <th className="py-3.5 px-4 w-32 text-center">Trạng thái</th>
                  <th className="py-3.5 px-6 w-28 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredCategories.map((category) => {
                  const linkedCount = getLinkedCount(category);
                  return (
                    <tr 
                      key={category.id} 
                      className="hover:bg-zinc-50/60 transition-colors group"
                    >
                      <td className="py-4 px-6 text-center font-heading font-extrabold text-zinc-400">
                        {category.thu_tu_hien_thi}
                      </td>
                      <td className="py-4 px-4 font-bold text-secondary text-xs">
                        {category.ten_danh_muc}
                      </td>
                      <td className="py-4 px-4 text-xs text-zinc-500 line-clamp-2 mt-2 leading-relaxed">
                        {category.mo_ta || <span className="italic text-zinc-350">Không có mô tả</span>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                          linkedCount > 0
                            ? 'bg-primary/5 text-primary border border-primary/10'
                            : 'bg-zinc-50 text-zinc-400 border border-zinc-150'
                        }`}>
                          {linkedCount} {category.loai_danh_muc === 'dich_vu' ? 'dịch vụ' : 'gói'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          category.an_hien 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          <span className={`size-1.5 rounded-full ${category.an_hien ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {category.an_hien ? 'Hiển thị' : 'Đang ẩn'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditModal(category)}
                            className="p-1.5 text-zinc-500 hover:text-primary hover:bg-zinc-100 rounded-lg transition-all"
                            title="Sửa thông tin"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDelete(category)}
                            className={`p-1.5 rounded-lg transition-all ${
                              linkedCount > 0
                                ? 'text-zinc-300 cursor-not-allowed'
                                : 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            disabled={linkedCount > 0}
                            title={linkedCount > 0 ? "Không thể xóa khi có liên kết" : "Xóa danh mục"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Add / Edit Category Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/35 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          
          <div className="bg-white w-full max-w-lg rounded-[24px] border border-zinc-200 shadow-2xl overflow-hidden relative animate-slide-up flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h3 className="text-sm font-black uppercase text-secondary tracking-wide font-heading">
                  {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                </h3>
                <p className="text-[10px] text-zinc-450 font-bold uppercase mt-1">Cung cấp thông tin danh mục dịch vụ</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-zinc-100 text-zinc-450 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Error Banner */}
            {errorMsg && (
              <div className="bg-rose-50 border-b border-rose-100 text-rose-800 px-6 py-3 flex items-center gap-2.5 text-xs font-semibold">
                <AlertCircle size={15} className="text-rose-500 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-450 tracking-wider">Tên danh mục <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  {...register('ten_danh_muc')}
                  placeholder="Ví dụ: Phục hồi chức năng vai, Trị liệu cơ sâu..."
                  className={`w-full px-4 py-2.5 text-xs border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold ${
                    errors.ten_danh_muc ? 'border-rose-350 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200 focus:border-primary'
                  }`}
                />
                {errors.ten_danh_muc && (
                  <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {(errors.ten_danh_muc as any)?.message}
                  </p>
                )}
              </div>

              {/* Classification & Display Order Row */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Category Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-450 tracking-wider">Loại danh mục</label>
                  <select 
                    {...register('loai_danh_muc')}
                    className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold bg-white"
                  >
                    <option value="dich_vu">Dịch vụ lẻ</option>
                    <option value="goi">Gói dịch vụ</option>
                  </select>
                </div>

                {/* Display Order */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-450 tracking-wider">Thứ tự ưu tiên</label>
                  <input 
                    type="number" 
                    {...register('thu_tu_hien_thi')}
                    className="w-full px-4 py-2.5 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
                  />
                  {errors.thu_tu_hien_thi && (
                    <p className="text-[10px] font-bold text-rose-600 mt-1">
                      {(errors.thu_tu_hien_thi as any)?.message}
                    </p>
                  )}
                </div>

              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-450 tracking-wider">Mô tả tóm tắt</label>
                <textarea 
                  {...register('mo_ta')}
                  rows={3}
                  placeholder="Nhập mô tả ngắn gọn giúp khách hàng dễ hình dung phân loại dịch vụ..."
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold resize-none"
                />
              </div>

              {/* Status & Help Alert */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/50">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-secondary">Kích hoạt hiển thị</span>
                  <p className="text-[10px] text-zinc-400 font-semibold leading-normal">Cho phép hiển thị để liên kết cấu hình dịch vụ</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                    watch('trang_thai') === 'hoat_dong'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {watch('trang_thai') === 'hoat_dong' ? 'Hoạt động' : 'Ẩn'}
                  </span>
                  
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={watch('trang_thai') === 'hoat_dong'}
                      onChange={(e) => setValue('trang_thai', e.target.checked ? 'hoat_dong' : 'vo_hieu')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-zinc-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold transition-all text-zinc-500"
                >
                  HỦY BỎ
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                >
                  {isSubmitting ? 'ĐANG LƯU...' : 'LƯU LẠI'}
                </button>
              </div>

            </form>
          </div>
          
        </div>
      )}

    </div>
  );
}
