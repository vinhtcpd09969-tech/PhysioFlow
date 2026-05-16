import { useState, useEffect } from 'react';
import { getAuditLogs } from '../../../api/admin.api';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [isClient, setIsClient] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs();
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchAction = filterAction === 'ALL' || log.action === filterAction;
    const matchDate = !filterDate || (log.created_at && log.created_at.startsWith(filterDate));
    return matchAction && matchDate;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-secondary">Nhật ký Hệ thống (Audit Log)</h2>
          <p className="text-zinc-500 mt-1">Lưu trữ các thao tác quan trọng trên hệ thống (Chỉ đọc).</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-[700px]">
        
        {/* Filters */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex flex-wrap gap-4 items-end shrink-0">
          <div>
            <label htmlFor="filter-action" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Loại hành động</label>
            <select 
              id="filter-action"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[200px] transition-all"
            >
              <option value="ALL">-- Tất cả --</option>
              {uniqueActions.map(action => (
                <option key={action as string} value={action as string}>{action as string}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-date" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Ngày thực hiện</label>
            <input 
              id="filter-date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => { setFilterAction('ALL'); setFilterDate(''); }}
            className="px-4 py-2 text-sm text-zinc-600 bg-zinc-200 hover:bg-zinc-300 rounded-xl font-semibold transition-all"
          >
            Xóa Lọc
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 shadow-sm z-10">
              <tr className="text-zinc-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 whitespace-nowrap">Thời gian</th>
                <th className="p-4">Tài khoản</th>
                <th className="p-4">Hành động</th>
                <th className="p-4">Đối tượng</th>
                <th className="p-4">ID Đối tượng</th>
                <th className="p-4">Chi tiết</th>
                <th className="p-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">Đang tải nhật ký...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">Không tìm thấy bản ghi nào phù hợp.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 transition-colors text-sm">
                    <td className="p-4 text-zinc-600 whitespace-nowrap font-mono text-[13px]">
                      {isClient && log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss') : '-'}
                    </td>
                    <td className="p-4 font-semibold text-secondary">
                      {log.user_email || <span className="text-zinc-400 italic font-normal">Hệ thống</span>}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-tight">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-600 font-mono text-xs">{log.entity_type}</td>
                    <td className="p-4 text-zinc-500 font-mono text-xs">
                      {log.entity_id ? log.entity_id.split('-')[0] + '...' : '-'}
                    </td>
                    <td className="p-4 max-w-xs truncate text-zinc-500 font-mono text-xs cursor-help" title={JSON.stringify(log.payload)}>
                      {log.payload ? JSON.stringify(log.payload) : '-'}
                    </td>
                    <td className="p-4 text-zinc-400 font-mono text-xs">{log.ip_address || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
