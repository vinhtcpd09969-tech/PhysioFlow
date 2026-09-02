import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Activity,
  DollarSign,
  FileDown,
  RefreshCw
} from 'lucide-react';
import api from '../../../../api/axios';
import { toast } from 'react-hot-toast';

// Import subcomponents
import { StatCard } from '../../components/StatCard';
import { CustomDatePicker } from '../../../../components/CustomDatePicker';
import { CustomSelect, CustomSelectOption } from '../../../../components/CustomSelect';
import { RevenueChart } from './RevenueChart';
import { TopPackagesChart } from './TopPackagesChart';
import { TopVipCustomers } from './TopVipCustomers';
import { StaffPerformanceGrid } from './StaffPerformanceGrid';
import { ExportReportModal } from './ExportReportModal';

const getLocalFormattedDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

type FilterMode = 'day' | 'month' | 'year';

interface DashboardData {
  stats: {
    total_customers: string | number;
    pending_appointments: string | number;
    total_revenue: string | number;
    active_staff: string | number;
    customers_this_month: number;
    customers_prev_month: number;
    cancellation_rate: number;
    completed_appointments: number;
  } | null;
  performanceData: { name: string; avatar?: string; role?: string; sessions: number }[];
  isLoaded: boolean;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    performanceData: [],
    isLoaded: false
  });

  const [isClient, setIsClient] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Bộ lọc thời gian DUY NHẤT cho cả trang — 3 chế độ Ngày/Tháng/Năm, mỗi chế độ chọn mốc bắt đầu
  // Bộ lọc thời gian DUY NHẤT cho cả trang — Mặc định khi mới tải trang là 7 ngày gần nhất (chế độ Ngày)
  const [filterMode, setFilterMode] = useState<FilterMode>('day');

  const [dayStart, setDayStart] = useState('');
  const [dayEnd, setDayEnd] = useState('');

  const [monthStartVal, setMonthStartVal] = useState(1);
  const [monthStartYear, setMonthStartYear] = useState(2026);
  const [monthEndVal, setMonthEndVal] = useState(1);
  const [monthEndYear, setMonthEndYear] = useState(2026);

  const [yearStartVal, setYearStartVal] = useState(2026);
  const [yearEndVal, setYearEndVal] = useState(2026);

  const years = useMemo(() => Array.from({ length: 11 }, (_, i) => 2020 + i), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  // Khởi tạo mốc mặc định = 7 ngày gần nhất (từ 6 ngày trước đến hôm nay) khi vừa vào trang.
  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(today.getDate() - 6);

    const y = today.getFullYear();
    const m = today.getMonth() + 1;

    setDayStart(getLocalFormattedDate(sixDaysAgo));
    setDayEnd(getLocalFormattedDate(today));

    setMonthStartVal(1);
    setMonthStartYear(y);
    setMonthEndVal(m);
    setMonthEndYear(y);

    setYearStartVal(y);
    setYearEndVal(y);
  }, []);

  // Ràng buộc kết thúc >= bắt đầu cho từng chế độ — tự đẩy đầu kết thúc lên khi đầu bắt đầu vượt qua.
  useEffect(() => {
    if (dayStart && dayEnd && new Date(dayEnd) < new Date(dayStart)) {
      setDayEnd(dayStart);
    }
  }, [dayStart]);

  useEffect(() => {
    if (monthEndYear < monthStartYear) {
      setMonthEndYear(monthStartYear);
    }
    if (monthEndYear === monthStartYear && monthEndVal < monthStartVal) {
      setMonthEndVal(monthStartVal);
    }
  }, [monthStartVal, monthStartYear]);

  useEffect(() => {
    if (yearEndVal < yearStartVal) {
      setYearEndVal(yearStartVal);
    }
  }, [yearStartVal]);

  const filteredEndMonths = useMemo(() => {
    if (monthEndYear === monthStartYear) {
      return months.filter((m) => m >= monthStartVal);
    }
    return months;
  }, [monthStartVal, monthStartYear, monthEndYear, months]);

  const filteredEndYearsForMonth = useMemo(() => years.filter((y) => y >= monthStartYear), [monthStartYear, years]);
  const filteredEndYearsOnly = useMemo(() => years.filter((y) => y >= yearStartVal), [yearStartVal, years]);

  const monthOptions: CustomSelectOption[] = useMemo(() => months.map((m) => ({
    value: m,
    label: `Tháng ${m}`
  })), [months]);

  const yearOptions: CustomSelectOption[] = useMemo(() => years.map((y) => ({
    value: y,
    label: `${y}`
  })), [years]);

  const filteredEndMonthOptions: CustomSelectOption[] = useMemo(() => filteredEndMonths.map((m) => ({
    value: m,
    label: `Tháng ${m}`
  })), [filteredEndMonths]);

  const filteredEndYearsForMonthOptions: CustomSelectOption[] = useMemo(() => filteredEndYearsForMonth.map((y) => ({
    value: y,
    label: `${y}`
  })), [filteredEndYearsForMonth]);

  const filteredEndYearsOnlyOptions: CustomSelectOption[] = useMemo(() => filteredEndYearsOnly.map((y) => ({
    value: y,
    label: `${y}`
  })), [filteredEndYearsOnly]);

  // Suy ra {startDate, endDate, bucket, label} duy nhất từ chế độ đang chọn — nguồn chung cho cả
  // 3 thẻ KPI lẫn biểu đồ doanh thu bên dưới.
  const rangeInfo = useMemo(() => {
    if (filterMode === 'day') {
      const fmt = (s: string) => s.split('-').reverse().join('/');
      return {
        startDate: dayStart,
        endDate: dayEnd,
        bucket: 'day' as const,
        label: dayStart && dayEnd ? (dayStart === dayEnd ? fmt(dayStart) : `${fmt(dayStart)} - ${fmt(dayEnd)}`) : ''
      };
    }
    if (filterMode === 'month') {
      const startDate = `${monthStartYear}-${pad2(monthStartVal)}-01`;
      const endDate = `${monthEndYear}-${pad2(monthEndVal)}-${pad2(daysInMonth(monthEndYear, monthEndVal))}`;
      const label =
        monthStartVal === monthEndVal && monthStartYear === monthEndYear
          ? `Tháng ${monthStartVal}/${monthStartYear}`
          : `T${monthStartVal}/${String(monthStartYear).slice(2)} - T${monthEndVal}/${String(monthEndYear).slice(2)}`;
      return { startDate, endDate, bucket: 'month' as const, label };
    }
    const startDate = `${yearStartVal}-01-01`;
    const endDate = `${yearEndVal}-12-31`;
    const label = yearStartVal === yearEndVal ? `Năm ${yearStartVal}` : `${yearStartVal} - ${yearEndVal}`;
    return { startDate, endDate, bucket: 'year' as const, label };
  }, [filterMode, dayStart, dayEnd, monthStartVal, monthStartYear, monthEndVal, monthEndYear, yearStartVal, yearEndVal]);

  useEffect(() => {
    if (!rangeInfo.startDate || !rangeInfo.endDate) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeInfo.startDate, rangeInfo.endDate]);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, performanceRes] = await Promise.all([
        api.get('/admin/analytics/summary', { params: { startDate: rangeInfo.startDate, endDate: rangeInfo.endDate } }),
        api.get('/admin/analytics/performance', { params: { startDate: rangeInfo.startDate, endDate: rangeInfo.endDate } })
      ]);

      setData({
        stats: statsRes.data || null,
        performanceData: Array.isArray(performanceRes.data) ? performanceRes.data : [],
        isLoaded: true
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể đồng bộ dữ liệu báo cáo');
    } finally {
      setIsRefreshing(false);
    }
  };

  const { stats, performanceData, isLoaded } = data;

  // MoM Customers calculation
  const customerMoM = useMemo(() => {
    if (!stats) return '0%';
    const current = Number(stats.customers_this_month || 0);
    const prev = Number(stats.customers_prev_month || 0);
    if (prev === 0) {
      return current > 0 ? `+100%` : '0%';
    }
    const diff = ((current - prev) / prev) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(0)}%`;
  }, [stats]);

  const customerMoMColor = useMemo(() => {
    if (!stats) return '';
    const current = Number(stats.customers_this_month || 0);
    const prev = Number(stats.customers_prev_month || 0);
    return current >= prev ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';
  }, [stats]);

  // Cancellation rate styles
  const cancelRateColor = useMemo(() => {
    if (!stats) return '';
    const rate = Number(stats.cancellation_rate || 0);
    if (rate < 5) return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
    if (rate <= 12) return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
    return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';
  }, [stats]);

  const cancelRateLabel = useMemo(() => {
    if (!stats) return 'Ổn định';
    const rate = Number(stats.cancellation_rate || 0);
    if (rate < 5) return 'Rất tốt';
    if (rate <= 12) return 'Bình thường';
    return 'Cảnh báo cao';
  }, [stats]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-teal-600 font-extrabold text-sm animate-pulse">
          <RefreshCw className="animate-spin size-5" />
          Đang tải báo cáo thống kê...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Unified Header & Filter Control Bar */}
      <div className="relative z-30 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-200">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Thống Kê Vận Hành Trung Tâm
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Báo cáo tổng quan doanh thu, khách hàng &amp; hiệu suất nhân sự OfficeCare
            </p>
          </div>

          {/* Filter Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Switcher: Ngày | Tháng | Năm */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              {[
                { id: 'day' as const, label: 'Ngày' },
                { id: 'month' as const, label: 'Tháng' },
                { id: 'year' as const, label: 'Năm' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setFilterMode(mode.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                    filterMode === mode.id
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Date Inputs by Mode */}
            {filterMode === 'day' && (
              <div className="flex items-center gap-1.5 shrink-0">
                <CustomDatePicker
                  value={dayStart}
                  onChange={(val) => {
                    setDayStart(val);
                    if (val && dayEnd && val > dayEnd) setDayEnd(val);
                  }}
                  maxDate={dayEnd || undefined}
                  align="left"
                  variant="neutral"
                />
                <span className="text-slate-400 font-medium text-xs">đến</span>
                <CustomDatePicker
                  value={dayEnd}
                  onChange={(val) => {
                    setDayEnd(val);
                    if (val && dayStart && val < dayStart) setDayStart(val);
                  }}
                  minDate={dayStart || undefined}
                  align="left"
                  variant="neutral"
                />
              </div>
            )}

            {filterMode === 'month' && (
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <CustomSelect
                  value={monthStartVal}
                  onChange={(val) => setMonthStartVal(Number(val))}
                  options={monthOptions}
                  buttonClassName="!h-9 !py-1 !px-3 !rounded-xl !text-xs !bg-slate-50 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 font-bold min-w-[95px]"
                  menuClassName="!min-w-[120px] max-h-56"
                />
                <CustomSelect
                  value={monthStartYear}
                  onChange={(val) => setMonthStartYear(Number(val))}
                  options={yearOptions}
                  buttonClassName="!h-9 !py-1 !px-3 !rounded-xl !text-xs !bg-slate-50 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 font-bold min-w-[80px]"
                  menuClassName="!min-w-[100px] max-h-56"
                />

                <span className="text-slate-400 font-medium text-xs px-0.5">đến</span>

                <CustomSelect
                  value={monthEndVal}
                  onChange={(val) => setMonthEndVal(Number(val))}
                  options={filteredEndMonthOptions}
                  buttonClassName="!h-9 !py-1 !px-3 !rounded-xl !text-xs !bg-slate-50 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 font-bold min-w-[95px]"
                  menuClassName="!min-w-[120px] max-h-56"
                />
                <CustomSelect
                  value={monthEndYear}
                  onChange={(val) => setMonthEndYear(Number(val))}
                  options={filteredEndYearsForMonthOptions}
                  buttonClassName="!h-9 !py-1 !px-3 !rounded-xl !text-xs !bg-slate-50 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 font-bold min-w-[80px]"
                  menuClassName="!min-w-[100px] max-h-56"
                />
              </div>
            )}

            {filterMode === 'year' && (
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <CustomSelect
                  value={yearStartVal}
                  onChange={(val) => setYearStartVal(Number(val))}
                  options={yearOptions}
                  buttonClassName="!h-9 !py-1 !px-3 !rounded-xl !text-xs !bg-slate-50 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 font-bold min-w-[85px]"
                  menuClassName="!min-w-[100px] max-h-56"
                />
                <span className="text-slate-400 font-medium text-xs px-0.5">đến</span>
                <CustomSelect
                  value={yearEndVal}
                  onChange={(val) => setYearEndVal(Number(val))}
                  options={filteredEndYearsOnlyOptions}
                  buttonClassName="!h-9 !py-1 !px-3 !rounded-xl !text-xs !bg-slate-50 dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 font-bold min-w-[85px]"
                  menuClassName="!min-w-[100px] max-h-56"
                />
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => fetchData()}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer h-9 w-9 flex items-center justify-center shrink-0"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            {/* Export PDF Button */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-3.5 h-9 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <FileDown size={14} />
              Xuất PDF
            </button>
          </div>
        </div>
      </div>

      {/* 3 Core KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Doanh thu tổng */}
        <StatCard
          title="Doanh Thu Thuần"
          value={isClient ? currencyFormatter.format(Number(stats?.total_revenue || 0)) : '0 đ'}
          change={rangeInfo.label}
          changeColor="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/40"
          icon={<DollarSign className="text-teal-600 dark:text-teal-400" size={18} />}
          color="bg-teal-50 dark:bg-teal-950/40"
          subtitle="Kỳ báo cáo"
        />

        {/* Tổng khách hàng đã đăng ký */}
        <StatCard
          title="Tổng Khách Hàng Đăng Ký"
          value={`${stats?.total_customers || 0} khách`}
          change={customerMoM}
          changeColor={customerMoMColor}
          icon={<Users className="text-indigo-600 dark:text-indigo-400" size={18} />}
          color="bg-indigo-50 dark:bg-indigo-950/40"
          subtitle="Tăng trưởng tháng"
        />

        {/* Tỉ lệ hủy & vắng */}
        <StatCard
          title="Tỷ Lệ Hủy / Vắng"
          value={`${stats?.cancellation_rate || 0}%`}
          change={cancelRateLabel}
          changeColor={cancelRateColor}
          icon={<Activity className="text-rose-500" size={18} />}
          color="bg-rose-50 dark:bg-rose-950/40"
          subtitle="Kỳ báo cáo"
        />
      </div>

      {/* Biểu Đồ Doanh Thu */}
      <RevenueChart
        startDate={rangeInfo.startDate}
        endDate={rangeInfo.endDate}
        bucket={rangeInfo.bucket}
        periodLabel={rangeInfo.label}
        isClient={isClient}
      />

      {/* Top Gói Dịch Vụ Phổ Biến */}
      <TopPackagesChart />

      {/* Leaderboards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <TopVipCustomers />
        <StaffPerformanceGrid performanceData={performanceData} />
      </div>

      {/* Modal Xuất Báo Cáo Tổng Quan PDF */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        periodLabel={rangeInfo.label}
        rangeInfo={rangeInfo}
        stats={stats}
        performanceData={performanceData}
      />
    </div>
  );
}
