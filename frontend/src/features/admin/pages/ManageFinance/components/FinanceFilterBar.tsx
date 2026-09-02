import { Search, Filter, RotateCcw, Calendar, CreditCard, Layers, Tag } from 'lucide-react';
import { CustomDatePicker } from '../../../../../components/CustomDatePicker';
import { CustomSelect } from '../../../../../components/CustomSelect';
import { FinanceTabs } from './FinanceTabs';
import {
  INVOICE_STATUS_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  INVOICE_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../constants';

interface FinanceFilterBarProps {
  activeTab: 'invoices' | 'payments';
  onTabChange: (tab: 'invoices' | 'payments') => void;
  invoiceCount: number;
  paymentCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  itemTypeFilter: string;
  onItemTypeChange: (value: string) => void;
  methodFilter: string;
  onMethodChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
}

export function FinanceFilterBar({
  activeTab,
  onTabChange,
  invoiceCount,
  paymentCount,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  itemTypeFilter,
  onItemTypeChange,
  methodFilter,
  onMethodChange,
  dateFilter,
  onDateChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: FinanceFilterBarProps) {
  const statusOptions = activeTab === 'invoices' ? INVOICE_STATUS_OPTIONS : PAYMENT_TYPE_OPTIONS;
  const statusLabel = activeTab === 'invoices' ? 'Trạng thái hóa đơn' : 'Loại giao dịch';
  const statusPlaceholder = activeTab === 'invoices' ? 'Tất cả trạng thái' : 'Tất cả loại giao dịch';

  const isFiltered =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    (activeTab === 'invoices' && itemTypeFilter !== 'all') ||
    (activeTab === 'payments' && methodFilter !== 'all') ||
    dateFilter !== 'all' ||
    startDate !== '' ||
    endDate !== '';

  const handleReset = () => {
    onSearchChange('');
    onStatusChange('all');
    onItemTypeChange('all');
    onMethodChange('all');
    onDateChange('all');
    onStartDateChange('');
    onEndDateChange('');
  };

  const handleStartDateChange = (val: string) => {
    onStartDateChange(val);
    if (val && endDate && val > endDate) {
      onEndDateChange(val);
    }
  };

  const handleEndDateChange = (val: string) => {
    onEndDateChange(val);
    if (val && startDate && val < startDate) {
      onStartDateChange(val);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-5 text-left select-none font-jakarta">
      {/* 50/50 Full-Width Tabs */}
      <FinanceTabs
        activeTab={activeTab}
        invoiceCount={invoiceCount}
        paymentCount={paymentCount}
        onChange={onTabChange}
      />

      {/* Filter Section Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <Filter size={15} />
          </div>
          <h3 className="font-heading font-black text-slate-800 dark:text-zinc-200 text-xs uppercase tracking-wider">
            Bộ lọc tài chính y khoa
          </h3>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <RotateCcw size={12} />
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Tìm kiếm mã / khách hàng
          </label>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Nhập mã HĐ, mã GD, tên hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Status / Transaction Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <Tag size={12} className="text-zinc-400" />
            {statusLabel}
          </label>
          <CustomSelect
            value={statusFilter}
            onChange={onStatusChange}
            options={[
              { value: 'all', label: statusPlaceholder },
              ...statusOptions
            ]}
            fullWidth
          />
        </div>

        {/* Invoice Type OR Payment Method */}
        {activeTab === 'invoices' ? (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Layers size={12} className="text-zinc-400" />
              Hình thức thanh toán gói
            </label>
            <CustomSelect
              value={itemTypeFilter}
              onChange={onItemTypeChange}
              options={[
                { value: 'all', label: 'Tất cả hình thức' },
                ...INVOICE_TYPE_OPTIONS
              ]}
              fullWidth
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <CreditCard size={12} className="text-zinc-400" />
              Phương thức thanh toán
            </label>
            <CustomSelect
              value={methodFilter}
              onChange={onMethodChange}
              options={[
                { value: 'all', label: 'Tất cả phương thức' },
                ...PAYMENT_METHOD_OPTIONS
              ]}
              fullWidth
            />
          </div>
        )}

        {/* Date Range Filter: Từ ngày - Đến ngày */}
        <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} className="text-zinc-400" />
              Khoảng ngày phát sinh
            </label>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { onStartDateChange(''); onEndDateChange(''); }}
                className="text-[9.5px] font-bold text-rose-500 hover:text-rose-700 underline transition-colors cursor-pointer"
              >
                Xóa ngày
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5 items-center">
            <CustomDatePicker
              value={startDate}
              onChange={handleStartDateChange}
              maxDate={endDate || undefined}
              placeholder="Từ ngày..."
              align="left"
              variant="neutral"
            />
            <CustomDatePicker
              value={endDate}
              onChange={handleEndDateChange}
              minDate={startDate || undefined}
              placeholder="Đến ngày..."
              align="right"
              variant="neutral"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinanceFilterBar;
