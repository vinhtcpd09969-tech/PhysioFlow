import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

// API Client calls
import { 
  getPackages, 
  deletePackage, 
  getCategories
} from '../../api/admin.api';

// Shared Components
import PackageModal from '../../components/packages/PackageModal';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';

// Local flat components
import { HUDHeader } from './HUDHeader';
import { PackageRow } from './PackageRow';
import { CategoryManagerModal } from './CategoryManagerModal';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function ManagePackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info' | 'success';
    onConfirm: () => void;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'KHAM' | 'LE' | 'LIEU_TRINH'>('all');

  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese accent marks
      .replace(/đ/g, 'd')
      .trim();
  };

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg: any) => {
      const normName = normalizeString(pkg.ten_goi);
      const normQuery = normalizeString(searchQuery);
      const matchesSearch = normName.includes(normQuery);
      
      const matchesCategory = selectedCategory === 'all' || String(pkg.danh_muc_id) === String(selectedCategory);
      const matchesType = selectedTypeFilter === 'all' || pkg.loai_goi === selectedTypeFilter;
      
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [packages, searchQuery, selectedCategory, selectedTypeFilter]);

  const visibleCategories = useMemo(() => {
    if (selectedTypeFilter === 'all') return categories;
    return categories.filter((cat: any) => cat.loai_goi_ap_dung === selectedTypeFilter);
  }, [categories, selectedTypeFilter]);

  // Reset selected category filter if it's not compatible with the active package type tab
  useEffect(() => {
    if (selectedCategory !== 'all' && selectedTypeFilter !== 'all') {
      const activeCat = categories.find(c => String(c.id) === String(selectedCategory));
      if (activeCat && activeCat.loai_goi_ap_dung !== selectedTypeFilter) {
        setSelectedCategory('all');
      }
    }
  }, [selectedTypeFilter, selectedCategory, categories]);

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

  const handleDelete = (pkg: any) => {
    const confirmName = pkg.ten_goi;
    setConfirmConfig({
      isOpen: true,
      title: 'Ngưng sử dụng Gói dịch vụ',
      message: `Bạn có chắc chắn muốn ngưng sử dụng gói dịch vụ "${confirmName}" không?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await deletePackage(pkg.id);
          toast.success(`Đã ngừng kích hoạt gói dịch vụ "${confirmName}" thành công!`);
          fetchData();
        } catch (error) {
          console.error('Error deleting package:', error);
          toast.error('Không thể ngưng sử dụng gói dịch vụ này. Rất có thể gói này đang được liên kết trong lịch đặt hoặc hóa đơn.');
        }
      }
    });
  };

  const activeCount = useMemo(() => {
    return packages.filter((p: any) => p.trang_thai === 'hoat_dong').length;
  }, [packages]);

  const totalCount = useMemo(() => {
    return packages.length;
  }, [packages]);

  const khamCount = useMemo(() => {
    return packages.filter((p: any) => p.loai_goi === 'KHAM').length;
  }, [packages]);

  const leCount = useMemo(() => {
    return packages.filter((p: any) => p.loai_goi === 'LE').length;
  }, [packages]);

  const lieuTrinhCount = useMemo(() => {
    return packages.filter((p: any) => p.loai_goi === 'LIEU_TRINH').length;
  }, [packages]);

  const avgSessions = useMemo(() => {
    const lieuTrinhPkgs = packages.filter((p: any) => p.loai_goi === 'LIEU_TRINH');
    return lieuTrinhPkgs.length 
      ? Math.round(lieuTrinhPkgs.reduce((acc: number, p: any) => acc + p.tong_so_buoi, 0) / lieuTrinhPkgs.length)
      : 0;
  }, [packages]);

  return (
    <div className="space-y-6 pb-8 text-zinc-800 font-sans text-sm min-h-[600px]">
      <AnimatePresence mode="wait">
        {!isModalOpen ? (
          <motion.div
            key="packages-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-6"
          >
            <HUDHeader
              totalCount={totalCount}
              activeCount={activeCount}
              khamCount={khamCount}
              leCount={leCount}
              lieuTrinhCount={lieuTrinhCount}
              avgSessions={avgSessions}
              onOpenCategory={() => setIsCategoryOpen(true)}
              onOpenAddPackage={() => {
                setEditingPackage(null);
                setIsModalOpen(true);
              }}
            />

            {/* Premium Horizontal Filter & Search Panel */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-4 transition-all hover:shadow-md duration-300">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="font-black text-sm tracking-tight text-secondary font-heading flex-shrink-0">
                    BỘ LỌC DỊCH VỤ Y KHOA ({filteredPackages.length})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Lọc nhanh theo phân loại và tìm kiếm không dấu tiện lợi</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2.5 border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary font-bold shadow-sm transition-all cursor-pointer hover:border-zinc-300"
                    >
                      <option value="all">📂 TẤT CẢ CHUYÊN KHOA</option>
                      {visibleCategories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.ten_danh_muc.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Tìm kiếm tên gói (ví dụ: gia)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary font-bold placeholder-zinc-400 shadow-sm transition-all hover:border-zinc-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex border-t border-slate-100 pt-4 items-center gap-2 overflow-x-auto pb-1 shrink-0">
                <button
                  onClick={() => setSelectedTypeFilter('all')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                    selectedTypeFilter === 'all'
                      ? 'bg-secondary border-secondary text-white shadow-sm'
                      : 'bg-slate-55 border-zinc-200 text-slate-655 hover:bg-slate-100'
                  }`}
                >
                  TẤT CẢ PHÂN LOẠI ({packages.length})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('KHAM')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                    selectedTypeFilter === 'KHAM'
                      ? 'bg-indigo-650 border-indigo-650 text-white shadow-sm'
                      : 'bg-slate-55 border-zinc-200 text-slate-655 hover:bg-slate-100'
                  }`}
                >
                  KHÁM LÂM SÀNG ({packages.filter(p => p.loai_goi === 'KHAM').length})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('LE')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                    selectedTypeFilter === 'LE'
                      ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                      : 'bg-slate-55 border-zinc-200 text-slate-655 hover:bg-slate-100'
                  }`}
                >
                  GÓI LẺ TRỊ LIỆU ({packages.filter(p => p.loai_goi === 'LE').length})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('LIEU_TRINH')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                    selectedTypeFilter === 'LIEU_TRINH'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-slate-55 border-zinc-200 text-slate-655 hover:bg-slate-100'
                  }`}
                >
                  LIỆU TRÌNH CHUYÊN SÂU ({packages.filter(p => p.loai_goi === 'LIEU_TRINH').length})
                </button>
              </div>
            </div>

            {/* List container */}
            <div className="space-y-4">
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
                  <p className="text-[10px] text-zinc-455 mt-1 font-semibold">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
                </div>
              ) : (
                <>
                  {/* Header Column Labels Bar */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-zinc-50 via-slate-50 to-zinc-50 border border-zinc-200 rounded-xl text-secondary font-black uppercase tracking-widest text-[9.5px] select-none mb-3 shadow-xs">
                    <div className="col-span-5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Thông tin gói y khoa</span>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-teal-655" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Số buổi & Thời lượng</span>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Đơn giá trọn gói</span>
                    </div>
                    <div className="col-span-1 text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-indigo-655" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Trạng thái</span>
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end gap-2">
                      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span>Thao tác</span>
                    </div>
                  </div>

                  {filteredPackages.map((pkg) => (
                    <PackageRow
                      key={pkg.id}
                      pkg={pkg}
                      categories={categories}
                      currencyFormatter={currencyFormatter}
                      onEdit={(p) => {
                        setEditingPackage(p);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDelete}
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="packages-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            <PackageModal
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
          </motion.div>
        )}
      </AnimatePresence>

      <CategoryManagerModal
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        categories={categories}
        packages={packages}
        fetchData={fetchData}
        setConfirmConfig={setConfirmConfig}
      />

      <ConfirmDialog
        isOpen={!!confirmConfig?.isOpen}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        type={confirmConfig?.type}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}
