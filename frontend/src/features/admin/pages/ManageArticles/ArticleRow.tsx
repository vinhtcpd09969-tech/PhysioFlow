import { Eye, Calendar, Pencil, Ban, RotateCcw } from 'lucide-react';
import { resolveImageUrl } from '../../../../utils/imageUrl';

const DANH_MUC_LABELS: Record<string, string> = {
  suc_khoe: 'Sức khỏe',
  dieu_tri: 'Điều trị',
  tin_tuc: 'Tin tức',
  khuyen_mai: 'Khuyến mãi',
  phong_ngua: 'Phòng ngừa'
};

interface ArticleRowProps {
  article: any;
  onEdit: (article: any) => void;
  onDelete: (article: any) => void;
  onRestore?: (article: any) => void;
}

export function ArticleRow({ article, onEdit, onDelete, onRestore }: ArticleRowProps) {
  const isPublished = article.trang_thai === 'xuat_ban';
  const isSuspended = article.trang_thai === 'ngung_su_dung';

  const displayDate = article.ngay_cap_nhat || article.ngay_dang || article.ngay_tao;

  return (
    <div
      className={`group relative bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-teal-250 dark:hover:border-teal-700 hover:shadow-[0_20px_50px_rgba(46,196,182,0.06)] hover:-translate-y-1.5 cursor-pointer ${
        isSuspended ? 'opacity-65 grayscale-[30%] bg-zinc-50/50 dark:bg-zinc-900/50' : ''
      }`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        if (isSuspended) return; // Không cho sửa bài đang bị gỡ trực tiếp, phải khôi phục trước
        onEdit(article);
      }}
    >
      <div className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-2xl scale-y-50 group-hover:scale-y-100 opacity-0 group-hover:opacity-100 transition-all duration-300 origin-center shadow-sm bg-teal-500 shadow-teal-400/50" />

      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-6 lg:gap-4">
        <div className="col-span-12 lg:col-span-6 min-w-0 flex gap-4">
          <div className="w-16 h-16 rounded-xl border border-zinc-150 dark:border-zinc-800 overflow-hidden shrink-0 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
            {article.anh_bia ? (
              <img src={resolveImageUrl(article.anh_bia)} className="w-full h-full object-cover" alt={article.tieu_de} />
            ) : (
              <span className="text-slate-300 dark:text-zinc-600 text-[9px] font-bold">Chưa có ảnh</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] text-teal-850 dark:text-teal-300 font-black bg-teal-50 dark:bg-teal-950/40 border border-teal-150/60 dark:border-teal-800/60 px-2 py-0.5 rounded-lg uppercase tracking-wider">
              {DANH_MUC_LABELS[article.danh_muc] || article.danh_muc}
            </span>
            <h4
              className={`font-heading font-black text-[13.5px] tracking-tight mt-1.5 leading-snug line-clamp-1 ${
                isSuspended
                  ? 'text-zinc-400 dark:text-zinc-500 line-through decoration-zinc-400/90 dark:decoration-zinc-500/90'
                  : 'text-secondary dark:text-zinc-100'
              }`}
              title={article.tieu_de}
            >
              {article.tieu_de}
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium line-clamp-1">{article.tom_tat}</p>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
          <Eye size={13} className="text-slate-400 dark:text-zinc-500 shrink-0" /> {article.luot_xem} lượt xem
        </div>

        <div className="col-span-6 lg:col-span-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
          <Calendar size={13} className="text-slate-400 dark:text-zinc-500 shrink-0" />
          <span>{displayDate ? new Date(displayDate).toLocaleDateString('vi-VN') : 'Chưa đăng'}</span>
        </div>

        <div className="col-span-6 lg:col-span-1">
          <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
            isPublished 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
              : isSuspended
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            {isPublished ? 'Đã đăng' : isSuspended ? 'Đã gỡ' : 'Nháp'}
          </span>
        </div>

        <div className="col-span-6 lg:col-span-1 flex items-center justify-end gap-2">
          {!isSuspended ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(article)}
                className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 text-slate-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-300 border border-zinc-150 dark:border-zinc-700 transition-all cursor-pointer"
                title="Sửa bài viết"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(article)}
                className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-300 border border-zinc-150 dark:border-zinc-700 transition-all cursor-pointer"
                title="Gỡ bài viết"
              >
                <Ban size={13} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onRestore && onRestore(article)}
              className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800 transition-all cursor-pointer"
              title="Khôi phục bài viết"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
