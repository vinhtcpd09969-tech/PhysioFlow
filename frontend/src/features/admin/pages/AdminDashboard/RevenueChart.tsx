import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#2EC4B6', '#FF9F1C', '#10B981', '#3B82F6'];

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

interface RevenueChartProps {
  revenueData: { month: string; revenue: number }[];
  isClient: boolean;
}

export function RevenueChart({ revenueData, isClient }: RevenueChartProps) {
  return (
    <div 
      className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui opacity-0 animate-slide-up"
      style={{ animationDelay: '300ms' }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-extrabold text-secondary">Doanh thu 6 tháng qua</h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Biểu đồ doanh số theo từng tháng</p>
        </div>
        <select className="bg-zinc-50 border border-zinc-200/80 rounded-xl px-3.5 py-2 text-xs font-bold text-zinc-500 outline-none hover:bg-zinc-100 transition-colors">
          <option>6 tháng gần đây</option>
        </select>
      </div>
      <div className="h-[320px] w-full">
        {isClient && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData.length > 0 ? revenueData : []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', 
                  padding: '12px 16px', 
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
                formatter={(val) => [currencyFormatter.format(Number(val)), 'Doanh thu']}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]} barSize={32}>
                {revenueData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
