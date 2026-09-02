import { memo } from 'react';
import { Inbox } from 'lucide-react';
import { Pagination } from '../../../../../components/Pagination';
import type { CompletedSingleVisitItem } from '../types';

interface CompletedSingleVisitTableProps {
  data: CompletedSingleVisitItem[];
  loading: boolean;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onViewProfile: (khachHangId: string, visitId: string) => void;
  activeType?: 'KHAM' | 'DICH_VU_LE';
}

function formatDateTime(v: string) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const LOAI_LABEL: Record<string, string> = {
  KHAM: 'Lượng giá',
  DICH_VU_LE: 'Dịch vụ lẻ'
};

const CompletedSingleVisitRow = memo(function CompletedSingleVisitRow({
  visit, onViewProfile
}: {
  visit: CompletedSingleVisitItem;
  onViewProfile: (khachHangId: string, visitId: string) => void;
}) {
  const isKham = visit.loai === 'KHAM';

  return (
    <tr 
      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" 
      onClick={() => onViewProfile(visit.khach_hang_id, visit.id)}
    >
      <td className="p-3.5 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs uppercase shrink-0">
            {visit.ho_ten?.charAt(0) || 'K'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              {visit.ho_ten}
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
              {visit.ma_khach_hang || (visit.so_dien_thoai || '-')}
            </span>
          </div>
        </div>
      </td>
      <td className="p-3.5 sm:p-4">
        <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-snug block">
          {visit.ten_dich_vu || '-'}
        </span>
      </td>
      <td className="p-3.5 sm:p-4 whitespace-nowrap">
        <span className="font-medium text-xs text-slate-600 dark:text-slate-300">
          {formatDateTime(visit.ngay_gio_bat_dau)}
        </span>
      </td>
      <td className="p-3.5 sm:p-4">
        <span className="font-medium text-xs text-slate-700 dark:text-slate-300">
          {visit.ten_nhan_su || '-'}
        </span>
      </td>
      <td className="p-3.5 sm:p-4 text-right">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
          isKham 
            ? 'bg-teal-50 text-teal-700 border-teal-200/60 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60' 
            : 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60'
        }`}>
          {LOAI_LABEL[visit.loai] || visit.loai}
        </span>
      </td>
    </tr>
  );
});

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 5 }).map((_, j) => (
            <td key={j} className="p-4">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CompletedSingleVisitTable({
  data,
  loading,
  meta,
  onPageChange,
  onViewProfile,
  activeType
}: CompletedSingleVisitTableProps) {
  const isKham = activeType === 'KHAM';
  const isDichVuLe = activeType === 'DICH_VU_LE';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[26%]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-semibold text-xs">
              <th className="p-3.5 sm:p-4">Khách hàng</th>
              <th className="p-3.5 sm:p-4">
                {isKham ? 'Dịch vụ lượng giá' : isDichVuLe ? 'Dịch vụ thực hiện' : 'Dịch vụ / Buổi lượng giá'}
              </th>
              <th className="p-3.5 sm:p-4">Thời gian</th>
              <th className="p-3.5 sm:p-4">
                {isKham ? 'Chuyên viên tư vấn' : isDichVuLe ? 'Kỹ thuật viên' : 'Chuyên viên / KTV'}
              </th>
              <th className="p-3.5 sm:p-4 text-right">Phân loại</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <TableSkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Inbox size={26} className="stroke-[1.5]" />
                    <span className="font-medium text-xs">
                      {isKham 
                        ? 'Chưa ghi nhận ca lượng giá nào hoàn thành.' 
                        : isDichVuLe 
                        ? 'Chưa ghi nhận ca dịch vụ đơn lẻ nào hoàn thành.' 
                        : 'Chưa ghi nhận ca lượng giá hoặc dịch vụ lẻ nào hoàn thành.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map(v => (
                <CompletedSingleVisitRow key={v.id} visit={v} onViewProfile={onViewProfile} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && data.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-4">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.pageSize}
            onPageChange={onPageChange}
            label={isKham ? 'ca lượng giá' : 'ca dịch vụ'}
          />
        </div>
      )}
    </div>
  );
}
