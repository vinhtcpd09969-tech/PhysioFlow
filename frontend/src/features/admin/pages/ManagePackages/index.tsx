import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

// API Client calls
import {
  getPackages,
  deletePackage,
  updatePackage
} from '../../api/admin.api';

import { Plus } from 'lucide-react';
import PackageModal from '../../components/packages/PackageModal';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';

// Local flat components
import { PackageRow } from './PackageRow';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function ManagePackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [lastModifiedId, setLastModifiedId] = useState<string | null>(null);

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
    const filtered = packages.filter((pkg: any) => {
      const normName = normalizeString(pkg.ten_goi);
      const normQuery = normalizeString(searchQuery);
      const matchesSearch = normName.includes(normQuery);
      
      const matchesType = selectedTypeFilter === 'all' || pkg.loai_goi === selectedTypeFilter;

      return matchesSearch && matchesType;
    });

    return [...filtered].sort((a, b) => {
      // 1. Group active first, non-active last
      const aActive = a.trang_thai === 'hoat_dong';
      const bActive = b.trang_thai === 'hoat_dong';
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      // 2. Place lastModifiedId at the top of its group
      if (lastModifiedId) {
        if (a.id === lastModifiedId) return -1;
        if (b.id === lastModifiedId) return 1;
      }

      // 3. Fallback to alphabetical sorting by ten_goi
      return a.ten_goi.localeCompare(b.ten_goi);
    });
  }, [packages, searchQuery, selectedTypeFilter, lastModifiedId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const pkgsRes = await getPackages();
      setPackages(pkgsRes.data || []);
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
          setLastModifiedId(pkg.id);
          fetchData();
        } catch (error) {
          console.error('Error deleting package:', error);
          toast.error('Không thể ngưng sử dụng gói dịch vụ này. Rất có thể gói này đang được liên kết trong lịch đặt hoặc hóa đơn.');
        }
      }
    });
  };

  const handleRestore = (pkg: any) => {
    const confirmName = pkg.ten_goi;
    setConfirmConfig({
      isOpen: true,
      title: 'Khôi phục Gói dịch vụ',
      message: `Bạn có chắc chắn muốn khôi phục hoạt động cho gói dịch vụ "${confirmName}" không?`,
      type: 'success',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          const payload = {
            ten_goi: pkg.ten_goi,
            loai_goi: pkg.loai_goi,
            tong_so_buoi: pkg.tong_so_buoi,
            thoi_luong_phut: pkg.thoi_luong_buoi_phut || pkg.thoi_luong_phut || 60,
            don_gia: Number(pkg.gia_tien || pkg.don_gia || 0),
            don_gia_theo_buoi: pkg.don_gia_theo_buoi ? Number(pkg.don_gia_theo_buoi) : undefined,
            quy_trinh: pkg.quy_trinh || '',
            muc_tieu: pkg.muc_tieu || '',
            anh_goi: pkg.anh_goi,
            anh_gallery: pkg.anh_gallery || [],
            han_su_dung_mac_dinh_ngay: pkg.han_su_dung_mac_dinh_ngay,
            trang_thai: 'hoat_dong'
          };
          await updatePackage(pkg.id, payload);
          toast.success(`Đã khôi phục gói dịch vụ "${confirmName}" hoạt động trở lại!`);
          setLastModifiedId(pkg.id);
          fetchData();
        } catch (error) {
          console.error('Error restoring package:', error);
          toast.error('Không thể khôi phục gói dịch vụ này.');
        }
      }
    });
  };



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
            {/* Flat Toolbar & Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl overflow-x-auto w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('all')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${
                    selectedTypeFilter === 'all'
                      ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  Tất cả ({packages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('KHAM')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${
                    selectedTypeFilter === 'KHAM'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  Lượng giá ({packages.filter(p => p.loai_goi === 'KHAM').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('LE')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${
                    selectedTypeFilter === 'LE'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  Gói lẻ ({packages.filter(p => p.loai_goi === 'LE').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('LIEU_TRINH')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${
                    selectedTypeFilter === 'LIEU_TRINH'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  Liệu trình ({packages.filter(p => p.loai_goi === 'LIEU_TRINH').length})
                </button>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                <div className="relative w-full sm:w-64">
                  <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Tìm kiếm tên gói..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:border-teal-600 focus:bg-white text-slate-800 dark:text-zinc-100 placeholder-slate-400 transition-all shadow-2xs"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingPackage(null);
                    setIsModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus size={16} />
                  <span>Tạo gói mới</span>
                </button>
              </div>
            </div>

            {/* List container */}
            <div className="space-y-4">
              {loading ? (
                <div className="px-6 py-16 text-center text-zinc-450 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                  <span className="font-heading text-xs font-bold uppercase tracking-wider">Đang tải danh sách gói dịch vụ...</span>
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="px-6 py-16 text-center text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm animate-fade-in">
                  <svg className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-secondary dark:text-zinc-100">Không tìm thấy gói dịch vụ nào phù hợp</span>
                  <p className="text-[10px] text-zinc-455 dark:text-zinc-400 mt-1 font-semibold">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
                </div>
              ) : (
                <>
                  {/* Header Column Labels Bar */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider text-[10px] select-none">
                    <div className="col-span-5">
                      <span>Thông tin gói y khoa</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span>Số buổi & Thời lượng</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span>Đơn giá trọn gói</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span>Trạng thái</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span>Thao tác</span>
                    </div>
                  </div>

                  {filteredPackages.map((pkg) => (
                    <PackageRow
                      key={pkg.id}
                      pkg={pkg}
                      currencyFormatter={currencyFormatter}
                      onEdit={(p) => {
                        setEditingPackage(p);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
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
              onSuccess={(savedId) => {
                setIsModalOpen(false);
                setEditingPackage(null);
                if (savedId) {
                  setLastModifiedId(savedId);
                }
                fetchData();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
