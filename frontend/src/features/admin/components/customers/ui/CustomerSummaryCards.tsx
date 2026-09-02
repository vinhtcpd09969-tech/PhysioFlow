import { Users, ClipboardX, X } from 'lucide-react';
import type { CustomerRecordFilter } from '../hooks/useCustomerFilters';

interface CustomerSummaryCardsProps {
  totalCustomers: number;
  customersWithoutRecord: number;
  activeFilter: CustomerRecordFilter;
  onFilterChange: (filter: CustomerRecordFilter) => void;
}

export function CustomerSummaryCards({
  totalCustomers,
  customersWithoutRecord,
  activeFilter,
  onFilterChange,
}: CustomerSummaryCardsProps) {
  const isNoRecordActive = activeFilter === 'no_record';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 font-jakarta">
      {/* 1. Phần Tổng Khách Hàng */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Tổng khách hàng
            </span>
            <div className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
              {totalCustomers}
              <span className="text-xs font-normal text-slate-400 ml-1.5">tài khoản</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Tất cả tài khoản trong hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* 2. Phần Chưa Có Hồ Sơ Điều Trị */}
      <div
        onClick={() => {
          if (!isNoRecordActive) {
            onFilterChange('no_record');
          }
        }}
        className={`relative p-4 sm:p-5 transition-all duration-200 flex items-center justify-between select-none ${
          isNoRecordActive
            ? 'bg-amber-50/40 dark:bg-amber-950/20'
            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30 cursor-pointer'
        }`}
      >
        {/* Nút X bỏ lọc */}
        {isNoRecordActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFilterChange('all');
            }}
            title="Bỏ lọc, quay về tất cả khách hàng"
            className="absolute top-3.5 right-3.5 size-6 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <X size={13} className="stroke-[2.5]" />
          </button>
        )}

        <div className="flex items-center gap-3.5 pr-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0">
            <ClipboardX size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Chưa tạo hồ sơ điều trị
            </span>
            <div className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
              {customersWithoutRecord}
              <span className="text-xs font-normal text-slate-400 ml-1.5">khách hàng</span>
            </div>
            <p className={`text-xs font-medium mt-0.5 ${isNoRecordActive ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
              {isNoRecordActive ? 'Đang lọc — Bấm ✖ để xem tất cả' : 'Bấm để lọc khách hàng mới'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
