import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../../../../api/axios';
import { toast } from 'react-hot-toast';
import { TrendingUp, BarChart2 } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

const formatYAxis = (val: number) => {
  if (val === 0) return '0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)} Tỷ`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(0)} Tr`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`;
  return `${val}`;
};

export type RevenueBucket = 'day' | 'month' | 'year';

const formatLabel = (label: string, bucket: RevenueBucket) => {
  if (bucket === 'year') return label;
  if (bucket === 'month' && label.includes('-')) {
    const [y, m] = label.split('-');
    return `T${Number(m)}/${y.substring(2)}`;
  }
  if (label.includes('-')) {
    const parts = label.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  }
  return label;
};

interface RevenueChartProps {
  startDate: string;
  endDate: string;
  bucket: RevenueBucket;
  periodLabel: string;
  isClient: boolean;
}

export function RevenueChart({ startDate, endDate, bucket, periodLabel, isClient }: RevenueChartProps) {
  const [chartData, setChartData] = useState<{ label: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, bucket]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/revenue', { params: { startDate, endDate, bucket } });
      const formatted = (res.data || []).map((item: any) => ({
        ...item,
        label: formatLabel(item.label, bucket)
      }));
      setChartData(formatted);
    } catch (error) {
      console.error('Error loading revenue chart data:', error);
      toast.error('Lỗi khi tải dữ liệu doanh thu.');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, d) => sum + Number(d.revenue || 0), 0),
    [chartData]
  );

  const processedChartData = useMemo(() => {
    if (chartData.length === 1) {
      const firstLabel = bucket === 'month' ? 'Đầu kỳ' : '00:00';
      return [
        { label: firstLabel, revenue: 0 },
        chartData[0]
      ];
    }
    return chartData;
  }, [chartData, bucket]);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <TrendingUp className="text-teal-600 dark:text-teal-400 shrink-0" size={18} />
            Biểu Đồ Doanh Thu
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Xu hướng doanh số theo thời gian · {periodLabel}
          </p>
        </div>

        {!loading && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Tổng kỳ:</span>
            <strong className="font-bold text-teal-600 dark:text-teal-400">
              {isClient ? currencyFormatter.format(totalRevenue) : '0 đ'}
            </strong>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[270px] w-full min-w-0 min-h-[250px] relative">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-semibold animate-pulse gap-2">
            <div className="size-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
            Đang đồng bộ dữ liệu doanh thu...
          </div>
        ) : processedChartData.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-medium gap-1.5 py-10">
            <BarChart2 size={24} className="opacity-40" />
            <span>Không có giao dịch thanh toán trong khoảng thời gian này.</span>
          </div>
        ) : (
          isClient && (
            <ResponsiveContainer width="100%" height={270} minWidth={0} minHeight={250}>
              <AreaChart data={processedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  dy={8}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  width={55}
                  tickFormatter={formatYAxis}
                />
                <Tooltip
                  cursor={{ stroke: '#0D9488', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: '#FFFFFF',
                    color: '#0F172A'
                  }}
                  formatter={(val) => [currencyFormatter.format(Number(val)), 'Doanh thu']}
                  labelStyle={{ fontWeight: 700, color: '#0D9488', marginBottom: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0D9488"
                  strokeWidth={2}
                  activeDot={{ r: 4, stroke: '#0D9488', strokeWidth: 2, fill: '#FFFFFF' }}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )
        )}
      </div>
    </div>
  );
}

