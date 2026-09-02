import { useEffect, useState, useMemo } from 'react';
import api from '../../../../api/axios';
import { Crown, User } from 'lucide-react';

interface VipCustomer {
  id: string;
  name: string;
  phone: string;
  total_paid: number;
  appointment_count?: number;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

export function TopVipCustomers() {
  const [data, setData] = useState<VipCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVipCustomers();
  }, []);

  const fetchVipCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/top-vip-customers');
      setData(res.data || []);
    } catch (error) {
      console.error('Error fetching VIP customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxPaid = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((c) => Number(c.total_paid || 0)), 1) : 1;
  }, [data]);

  const totalVipRevenue = useMemo(() => {
    return data.reduce((sum, c) => sum + Number(c.total_paid || 0), 0);
  }, [data]);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Crown className="text-amber-500 shrink-0" size={18} />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Top 5 Khách Hàng VIP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Khách hàng có tổng chi tiêu cao nhất
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40 shrink-0">
            Chi tiêu cao
          </span>
        </div>

        {loading ? (
          <div className="text-slate-400 text-xs font-semibold animate-pulse text-center py-12 flex items-center justify-center gap-2">
            <div className="size-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
            Đang tải xếp hạng VIP...
          </div>
        ) : data.length === 0 ? (
          <div className="text-slate-400 dark:text-slate-500 text-xs italic text-center py-12 font-medium">
            Chưa có dữ liệu thanh toán khách hàng.
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.slice(0, 5).map((cust, idx) => {
              const rank = idx + 1;
              const paid = Number(cust.total_paid || 0);
              const percent = Math.max(Math.round((paid / maxPaid) * 100), 8);

              return (
                <div
                  key={cust.id + idx}
                  className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all duration-150"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        rank === 1
                          ? 'bg-amber-500 text-white'
                          : rank === 2
                          ? 'bg-slate-400 text-white'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {rank}
                      </span>

                      {/* Customer Initials Avatar */}
                      <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center border border-teal-200/60 dark:border-teal-800/60 shrink-0">
                        {cust.name ? cust.name.charAt(0).toUpperCase() : <User size={13} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {cust.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                          {cust.phone || 'Thành viên'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                        {currencyFormatter.format(paid).replace('₫', 'đ')}
                      </span>
                    </div>
                  </div>

                  {/* Micro Progress Line */}
                  <div className="w-full h-1 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out bg-teal-600 dark:bg-teal-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Total Summary */}
      {!loading && data.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Tổng chi tiêu top 5:</span>
          <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">
            {currencyFormatter.format(totalVipRevenue).replace('₫', 'đ')}
          </span>
        </div>
      )}
    </div>
  );
}

