import { memo, useMemo } from 'react';
import { Edit3, Inbox, Lock, Unlock } from 'lucide-react';
import { RecordViewButton } from './badges/PackageStatusPill';
import { CustomerFilterToolbar } from './CustomerFilterToolbar';
import { Pagination } from '../../../../../components/Pagination';
import { formatCurrency } from '@/utils/format';
import type { CustomerOverviewItem } from '../types';

interface CustomerTableProps {
  data: CustomerOverviewItem[];
  loading: boolean;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onViewProfile: (customer: CustomerOverviewItem) => void;
  onEdit: (customer: CustomerOverviewItem) => void;
  onToggleLock: (customer: CustomerOverviewItem) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  showLockedOnly?: boolean;
  onToggleLockedOnly?: () => void;
}

const CustomerTableRow = memo(function CustomerTableRow({
  customer, onViewProfile, onEdit, onToggleLock
}: {
  customer: CustomerOverviewItem;
  onViewProfile: (c: CustomerOverviewItem) => void;
  onEdit: (c: CustomerOverviewItem) => void;
  onToggleLock: (c: CustomerOverviewItem) => void;
}) {
  const isLocked = customer.trang_thai === 'vo_hieu';
  const cancelRate = Number(customer.ti_le_huy ?? 0);
  const totalApts = Number(customer.tong_lich ?? 0);
  const canceledApts = Number(customer.so_lich_huy_vang ?? 0);

  return (
    <tr className={`transition-colors group ${
      isLocked 
        ? 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40 opacity-75' 
        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
    }`}>
      {/* Cột 1: Khách hàng (26%) */}
      <td className="px-5 py-3.5 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs uppercase shrink-0 ${
            isLocked ? 'grayscale opacity-60' : ''
          }`}>
            {customer.ho_ten?.charAt(0) || 'K'}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold text-xs sm:text-sm truncate ${
                isLocked 
                  ? 'line-through text-slate-400 dark:text-slate-500' 
                  : 'text-slate-900 dark:text-white'
              }`}>
                {customer.ho_ten}
              </span>
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 shrink-0">
                  <Lock size={10} /> Đã khóa
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 tracking-wider">
              {customer.ma_khach_hang}
            </span>
          </div>
        </div>
      </td>

      {/* Cột 2: Liên hệ (21%) */}
      <td className="px-5 py-3.5 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{customer.so_dien_thoai || '-'}</span>
          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[170px]">{customer.email || '-'}</span>
        </div>
      </td>

      {/* Cột 3: Tổng chi tiêu (14%) */}
      <td className="px-5 py-3.5 sm:px-6 sm:py-4 text-right font-bold text-slate-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
        {formatCurrency(customer.tong_chi_tieu)}
      </td>

      {/* Cột 4: Tỉ lệ hủy / không đến (14%) */}
      <td className="px-5 py-3.5 sm:px-6 sm:py-4 text-center whitespace-nowrap">
        {totalApts === 0 ? (
          <span className="text-xs text-slate-400 font-medium" title="Chưa có lịch hẹn nào">0%</span>
        ) : cancelRate === 0 ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
            title={`0/${totalApts} lịch bị hủy/vắng`}
          >
            0%
          </span>
        ) : cancelRate <= 15 ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
            title={`${canceledApts}/${totalApts} lịch bị hủy/vắng`}
          >
            {cancelRate}%
          </span>
        ) : (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60"
            title={`${canceledApts}/${totalApts} lịch bị hủy/vắng`}
          >
            {cancelRate}%
          </span>
        )}
      </td>

      {/* Cột 5: Thao tác (25%) - Căn giữa 3 nút */}
      <td className="px-5 py-3.5 sm:px-6 sm:py-4 text-center">
        <div className="flex items-center justify-center gap-2 shrink-0 whitespace-nowrap">
          <RecordViewButton hasRecord={customer.has_record} onClick={() => onViewProfile(customer)} />
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Edit3 size={13} className="text-teal-600 dark:text-teal-400" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleLock(customer)}
            className={`h-8 px-2.5 inline-flex items-center gap-1.5 border rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0 ${
              isLocked
                ? 'border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/80'
                : 'border-rose-200/80 bg-rose-50/70 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100/80'
            }`}
          >
            {isLocked ? (
              <>
                <Unlock size={13} />
                <span>Mở khóa</span>
              </>
            ) : (
              <>
                <Lock size={13} />
                <span>Khóa</span>
              </>
            )}
          </button>
        </div>
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
            <td key={j} className="px-5 py-4 sm:px-6">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CustomerTable({
  data,
  loading,
  meta,
  onPageChange,
  onViewProfile,
  onEdit,
  onToggleLock,
  search,
  onSearchChange,
  showLockedOnly,
  onToggleLockedOnly
}: CustomerTableProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aLocked = a.trang_thai === 'vo_hieu';
      const bLocked = b.trang_thai === 'vo_hieu';
      if (aLocked && !bLocked) return 1;
      if (!aLocked && bLocked) return -1;
      return 0;
    });
  }, [data]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Integrated Toolbar inside Table Container if provided */}
      {onSearchChange && search !== undefined && onToggleLockedOnly && (
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <CustomerFilterToolbar
            search={search}
            onSearchChange={onSearchChange}
            showLockedOnly={!!showLockedOnly}
            onToggleLockedOnly={onToggleLockedOnly}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed min-w-[840px]">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[21%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[25%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-semibold text-xs">
              <th className="px-5 py-3.5 sm:px-6 sm:py-4">Khách hàng</th>
              <th className="px-5 py-3.5 sm:px-6 sm:py-4">Liên hệ</th>
              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-right">Tổng chi tiêu</th>
              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-center">Tỉ lệ hủy / vắng</th>
              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <TableSkeletonRows />
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Inbox size={26} className="stroke-[1.5]" />
                    <span className="font-medium text-xs">Không tìm thấy khách hàng nào thỏa điều kiện lọc.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map(c => (
                <CustomerTableRow key={c.id} customer={c} onViewProfile={onViewProfile} onEdit={onEdit} onToggleLock={onToggleLock} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && sortedData.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
