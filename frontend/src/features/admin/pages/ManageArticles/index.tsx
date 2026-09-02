import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PenSquare, Search } from 'lucide-react';

import { getArticles, updateArticle } from '../../api/admin.api';
import ArticleEditor from '../../components/articles/ArticleEditor';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { CustomSelect } from '../../../../components/CustomSelect';
import { ArticleRow } from './ArticleRow';

const DANH_MUC_FILTERS = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'suc_khoe', label: 'Sức khỏe' },
  { value: 'dieu_tri', label: 'Điều trị' },
  { value: 'tin_tuc', label: 'Tin tức' },
  { value: 'khuyen_mai', label: 'Khuyến mãi' },
  { value: 'phong_ngua', label: 'Phòng ngừa' }
];

const COMBINING_MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

const normalizeString = (str: string): string => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/đ/g, 'd')
    .trim();
};

export default function ManageArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [danhMucFilter, setDanhMucFilter] = useState('all');
  const [trangThaiFilter, setTrangThaiFilter] = useState<'all' | 'nhap' | 'xuat_ban' | 'ngung_su_dung'>('all');

  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const scrollToTop = useCallback(() => {
    // 1. Cuộn window & document
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // 2. Cuộn tất cả container cuộn bên trong layout Admin
    const scrollContainers = document.querySelectorAll('.overflow-auto, .overflow-y-auto, main, main > div');
    scrollContainers.forEach((el) => {
      el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      el.scrollTop = 0;
    });

    // 3. Lặp lại sau các mốc hiệu ứng chuyển trang (AnimatePresence)
    [50, 150, 300].forEach((delay) => {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        const containers = document.querySelectorAll('.overflow-auto, .overflow-y-auto, main, main > div');
        containers.forEach((el) => {
          el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          el.scrollTop = 0;
        });
      }, delay);
    });
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getArticles();
      setArticles(res.data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isEditorOpen) {
      scrollToTop();
    }
  }, [isEditorOpen, scrollToTop]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a: any) => {
      const matchesSearch = normalizeString(a.tieu_de).includes(normalizeString(searchQuery));
      const matchesDanhMuc = danhMucFilter === 'all' || a.danh_muc === danhMucFilter;
      const matchesTrangThai = trangThaiFilter === 'all' || a.trang_thai === trangThaiFilter;
      return matchesSearch && matchesDanhMuc && matchesTrangThai;
    });
  }, [articles, searchQuery, danhMucFilter, trangThaiFilter]);

  const sortedArticles = useMemo(() => {
    return [...filteredArticles].sort((a, b) => {
      // ngung_su_dung goes to the bottom when viewing all
      const aSuspended = a.trang_thai === 'ngung_su_dung' ? 1 : 0;
      const bSuspended = b.trang_thai === 'ngung_su_dung' ? 1 : 0;
      if (aSuspended !== bSuspended) {
        return aSuspended - bSuspended; // 0 first (active), 1 last (suspended)
      }
      // Within same section, sort by latest update/created time descending
      const aTime = new Date(a.ngay_cap_nhat || a.ngay_dang || a.ngay_tao || 0).getTime();
      const bTime = new Date(b.ngay_cap_nhat || b.ngay_dang || b.ngay_tao || 0).getTime();
      return bTime - aTime;
    });
  }, [filteredArticles]);

  const publishedCount = useMemo(() => articles.filter(a => a.trang_thai === 'xuat_ban').length, [articles]);
  const draftCount = useMemo(() => articles.filter(a => a.trang_thai === 'nhap').length, [articles]);
  const suspendedCount = useMemo(() => articles.filter(a => a.trang_thai === 'ngung_su_dung').length, [articles]);

  const handleDelete = (article: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Gỡ bài viết',
      message: `Bạn có chắc chắn muốn gỡ bài viết "${article.tieu_de}" không? Bài viết sẽ bị ẩn khỏi các trang của khách hàng, có thể khôi phục lại sau.`,
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await updateArticle(article.id, { ...article, trang_thai: 'ngung_su_dung', ngay_cap_nhat: new Date().toISOString() });
          toast.success(`Đã gỡ bài viết "${article.tieu_de}" thành công!`);
          fetchData();
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Không thể gỡ bài viết');
        }
      }
    });
  };

  const handleRestore = async (article: any) => {
    try {
      await updateArticle(article.id, { ...article, trang_thai: 'nhap', ngay_cap_nhat: new Date().toISOString() });
      toast.success(`Đã khôi phục bài viết "${article.tieu_de}" về dạng bản nháp thành công!`);
      setTrangThaiFilter('all');
      fetchData();
      scrollToTop();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể khôi phục bài viết');
    }
  };

  return (
    <div className="space-y-6 pb-8 text-zinc-800 font-sans text-sm min-h-[600px]">
      <AnimatePresence mode="wait">
        {!isEditorOpen ? (
          <motion.div
            key="articles-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-6"
          >
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tiêu đề bài viết..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-secondary dark:text-zinc-100 font-bold placeholder-zinc-400 shadow-2xs"
                  />
                </div>
                <CustomSelect
                  value={danhMucFilter}
                  onChange={setDanhMucFilter}
                  options={DANH_MUC_FILTERS}
                  className="w-full lg:w-56 shrink-0"
                  align="right"
                />

                <button
                  onClick={() => { setEditingArticle(null); setIsEditorOpen(true); }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all text-xs shrink-0 cursor-pointer w-full lg:w-auto"
                >
                  <PenSquare size={14} /> Viết bài mới
                </button>
              </div>

              <div className="flex border-t border-slate-100 dark:border-zinc-800 pt-3 items-center gap-2 overflow-x-auto pb-1">
                {(['all', 'xuat_ban', 'nhap', 'ngung_su_dung'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setTrangThaiFilter(status)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                      trangThaiFilter === status
                        ? 'bg-secondary border-secondary text-white shadow-sm'
                        : 'bg-slate-55 border-zinc-200 text-slate-655 hover:bg-slate-100'
                    }`}
                  >
                    {status === 'all'
                      ? `Tất cả (${articles.length})`
                      : status === 'xuat_ban'
                      ? `Đã đăng (${publishedCount})`
                      : status === 'nhap'
                      ? `Bản nháp (${draftCount})`
                      : `Đã gỡ (${suspendedCount})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="px-6 py-16 text-center text-zinc-450 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                  <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
                  <span className="font-heading text-xs font-bold uppercase tracking-wider">Đang tải danh sách bài viết...</span>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="px-6 py-16 text-center text-zinc-400 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-secondary">Không tìm thấy bài viết nào phù hợp</span>
                  <p className="text-[10px] text-zinc-455 mt-1 font-semibold">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
                </div>
              ) : (
                sortedArticles.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    onEdit={(a) => { setEditingArticle(a); setIsEditorOpen(true); }}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                  />
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="articles-editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            <ArticleEditor
              editingArticle={editingArticle}
              onClose={() => { setIsEditorOpen(false); setEditingArticle(null); }}
              onSuccess={(savedStatus?: string) => {
                setIsEditorOpen(false);
                setEditingArticle(null);
                if (savedStatus === 'xuat_ban' || savedStatus === 'nhap') {
                  setTrangThaiFilter('all');
                }
                setSearchQuery('');
                fetchData();
                scrollToTop();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!confirmConfig?.isOpen}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        type="danger"
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}
