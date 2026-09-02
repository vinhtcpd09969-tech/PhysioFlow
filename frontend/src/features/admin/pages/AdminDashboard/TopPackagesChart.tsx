import { useEffect, useState, useMemo } from 'react';
import api from '../../../../api/axios';
import { Package, PieChart, BarChart3 } from 'lucide-react';

interface PackageStat {
  name: string;
  count: number;
}

const PALETTE = [
  { stroke: '#0D9488', fill: 'rgba(13, 148, 136, 0.15)', text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-200 dark:border-teal-800/60' },
  { stroke: '#6366F1', fill: 'rgba(99, 102, 241, 0.15)', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800/60' },
  { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/60' },
  { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.15)', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/60' },
  { stroke: '#8B5CF6', fill: 'rgba(139, 92, 246, 0.15)', text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-200 dark:border-violet-800/60' },
];

export function TopPackagesChart() {
  const [data, setData] = useState<PackageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'donut' | 'bar'>('donut');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchTopPackages();
  }, []);

  const fetchTopPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/top-packages');
      setData(res.data || []);
    } catch (error) {
      console.error('Error fetching top packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSessions = useMemo(() => {
    return data.reduce((acc, curr) => acc + Number(curr.count || 0), 0);
  }, [data]);

  const maxCount = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map(d => Number(d.count || 0)), 1) : 1;
  }, [data]);

  // Generate SVG Donut Segments
  const donutSegments = useMemo(() => {
    if (totalSessions === 0) return [];
    let cumulativePercent = 0;

    return data.slice(0, 5).map((pkg, idx) => {
      const count = Number(pkg.count || 0);
      const percent = count / totalSessions;
      const startAngle = cumulativePercent * 360;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 360;

      return {
        pkg,
        count,
        percent: Math.round(percent * 100),
        startAngle,
        endAngle,
        color: PALETTE[idx % PALETTE.length]
      };
    });
  }, [data, totalSessions]);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Package className="text-teal-600 dark:text-teal-400 shrink-0" size={18} />
            Top Gói Dịch Vụ Phổ Biến
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Tỷ trọng lượt thực hiện theo gói dịch vụ &amp; liệu trình chuyên sâu
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('donut')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'donut'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <PieChart size={13} />
              <span>Tròn</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 size={13} />
              <span>Thanh tỷ lệ</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs font-semibold animate-pulse text-center py-14 flex items-center justify-center gap-2">
          <div className="size-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          Đang tải dữ liệu gói dịch vụ...
        </div>
      ) : data.length === 0 ? (
        <div className="text-slate-400 dark:text-slate-500 text-xs italic text-center py-14 font-medium">
          Chưa ghi nhận dữ liệu sử dụng gói dịch vụ.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Visual Chart (Donut SVG or Compact Bar List) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {activeTab === 'donut' ? (
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center my-1">
                {/* SVG Donut Chart */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {donutSegments.map((seg, idx) => {
                    const strokeDasharray = `${seg.percent} ${100 - seg.percent}`;
                    const strokeDashoffset = -donutSegments
                      .slice(0, idx)
                      .reduce((sum, s) => sum + s.percent, 0);

                    const isHovered = hoveredIndex === idx;

                    return (
                      <circle
                        key={seg.pkg.name + idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={seg.color.stroke}
                        strokeWidth={isHovered ? 16 : 12}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength={100}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  })}
                </svg>

                {/* Inner Donut Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {hoveredIndex !== null ? 'ĐANG CHỌN' : 'TỔNG LƯỢT'}
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {hoveredIndex !== null ? donutSegments[hoveredIndex]?.count : totalSessions}
                  </span>
                  <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400 truncate max-w-[130px]">
                    {hoveredIndex !== null ? donutSegments[hoveredIndex]?.pkg.name : 'lượt chỉ định'}
                  </span>
                </div>
              </div>
            ) : (
              /* Bar Visual Mode */
              <div className="w-full space-y-3 py-2">
                {data.slice(0, 5).map((pkg, idx) => {
                  const count = Number(pkg.count || 0);
                  const percent = Math.max(Math.round((count / maxCount) * 100), 10);
                  const color = PALETTE[idx % PALETTE.length];

                  return (
                    <div key={pkg.name + idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{pkg.name}</span>
                        <span className={color.text}>{count} lượt ({Math.round((count / totalSessions) * 100)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%`, backgroundColor: color.stroke }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Clean Ranking List */}
          <div className="lg:col-span-7 space-y-2">
            {data.slice(0, 5).map((pkg, idx) => {
              const rank = idx + 1;
              const count = Number(pkg.count || 0);
              const percent = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
              const color = PALETTE[idx % PALETTE.length];
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={pkg.name + idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isHovered
                      ? `${color.bg} ${color.border} shadow-xs`
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
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
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {pkg.name}
                          </h4>
                          {rank === 1 && (
                            <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-1.5 py-0.2 rounded border border-teal-200/60 dark:border-teal-800/60 shrink-0">
                              Phổ biến nhất
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-baseline gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {count} <span className="text-[11px] font-normal text-slate-400">lượt</span>
                      </span>
                      <span className={`text-xs font-bold ${color.text} min-w-[36px] text-right`}>
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Micro Progress Line */}
                  <div className="w-full h-1 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percent}%`, backgroundColor: color.stroke }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

