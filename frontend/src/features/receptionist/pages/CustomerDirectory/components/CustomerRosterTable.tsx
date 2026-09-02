import { memo } from 'react';
import { Inbox, ClipboardPlus } from 'lucide-react';
import { Pagination } from '../../../../../components/Pagination';
import { PackageStatusBadge } from './PackageStatusBadge';
import { FollowUpFlag } from './FollowUpFlag';
import { formatDaysAgo } from '../../../../../utils/date';
import type { CustomerRosterItem, RosterMeta } from '../types';

interface CustomerRosterTableProps {
  data: CustomerRosterItem[];
  loading: boolean;
  meta: RosterMeta;
  staleDays: number;
  onPageChange: (page: number) => void;
  onViewProfile: (customer: CustomerRosterItem) => void;
}

const CustomerRosterRow = memo(function CustomerRosterRow({
  customer, staleDays, onViewProfile
}: {
  customer: CustomerRosterItem;
  staleDays: number;
  onViewProfile: (c: CustomerRosterItem) => void;
}) {
  const reason = customer.ly_do_lien_he;

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors font-jakarta">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center text-xs uppercase shrink-0 shadow-sm">
            {customer.ho_ten?.charAt(0) || 'K'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
              {customer.ho_ten}
            </span>
            <span className="text-[10px] text-slate-400 font-extrabold mt-0.5 tracking-wider">
              {customer.ma_khach_hang}
            </span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{customer.so_dien_thoai || '-'}</span>
          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[160px]">{customer.email || '-'}</span>
        </div>
      </td>
      <td className="p-4">
        <PackageStatusBadge goi={customer.goi_hien_tai} />
      </td>
      <td className="p-4 whitespace-nowrap">
        <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
          {formatDaysAgo(customer.last_used_at)}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap">
        <FollowUpFlag lyDoLienHe={reason} staleDays={staleDays} />
      </td>
      <td className="p-4 text-right">
        <button
          type="button"
          onClick={() => onViewProfile(customer)}
          className="px-3 py-1.5 border border-teal-200 bg-teal-50/70 hover:bg-teal-100/90 text-[#0D9488] rounded-xl font-extrabold text-[11px] transition-all inline-flex items-center gap-1.5 active:scale-95 whitespace-nowrap shadow-2xs cursor-pointer"
        >
          <ClipboardPlus size={13} />
          Xem hồ sơ
        </button>
      </td>
    </tr>
  );
});

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="p-4">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CustomerRosterTable({ data, loading, meta, staleDays, onPageChange, onViewProfile }: CustomerRosterTableProps) {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden font-jakarta">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[24%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Liên hệ</th>
              <th className="p-4">Trạng thái gói</th>
              <th className="p-4">Lần cuối dùng</th>
              <th className="p-4">Cần liên hệ</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <TableSkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox size={28} className="stroke-[1.5]" />
                    <span className="font-extrabold text-xs">Không tìm thấy khách hàng nào thỏa điều kiện lọc.</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <CustomerRosterRow key={c.id} customer={c} staleDays={staleDays} onViewProfile={onViewProfile} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && data.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
