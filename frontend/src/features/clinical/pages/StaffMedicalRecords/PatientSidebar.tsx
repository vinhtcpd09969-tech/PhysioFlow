import React, { useState, useMemo } from 'react';
import { Search, ClipboardPlus, Inbox } from 'lucide-react';
import { PatientInfo } from '@/features/doctor/api/doctor.api';

interface PatientSidebarProps {
  patients: PatientInfo[];
  onSelectPatient: (patient: PatientInfo) => void;
  loadingPatients: boolean;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  patients,
  onSelectPatient,
  loadingPatients,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getAge = (birthday?: string) => {
    if (!birthday) return '';
    try {
      const birthYear = new Date(birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} tuổi`;
    } catch {
      return '';
    }
  };

  // Lọc tìm kiếm
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const name = p.ho_ten.toLowerCase();
      const phone = p.so_dien_thoai || '';
      const search = searchTerm.toLowerCase();
      return name.includes(search) || phone.includes(search);
    });
  }, [patients, searchTerm]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] shadow-sm overflow-hidden font-jakarta">
      {/* Search Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="size-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">Lịch sử điều trị & lượng giá</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100 font-jakarta tracking-tight">
            HỒ SƠ ĐIỀU TRỊ KHÁCH HÀNG
          </h3>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5 font-medium">
            Tra cứu thông tin khách hàng và truy xuất chi tiết tiến trình điều trị PHCN
          </p>
        </div>
        <div className="relative group w-full sm:w-80 shrink-0">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
            <Search size={15} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nhập tên hoặc số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[20%]" />
            <col className="w-[26%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Giới tính / Tuổi</th>
              <th className="p-4">Liên hệ</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loadingPatients ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <td key={j} className="p-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Inbox size={28} className="stroke-[1.5]" />
                    <span className="font-extrabold text-xs">Không tìm thấy khách hàng nào</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectPatient(p)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group font-jakarta"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center text-xs uppercase shrink-0 shadow-sm">
                        {p.ho_ten.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                          {p.ho_ten}
                        </span>
                        <span className="text-[10px] text-slate-400 font-extrabold font-mono mt-0.5 tracking-wider">
                          {`KH-${p.id.substring(0, 8).toUpperCase()}`}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300 font-bold text-xs">
                    {p.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'} • {getAge(p.ngay_sinh) || 'N/A'}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono">{p.so_dien_thoai || '-'}</span>
                      <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{p.email || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatient(p);
                      }}
                      className="px-3.5 py-1.5 border border-teal-500/30 bg-teal-50/60 hover:bg-teal-100/80 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap shadow-2xs cursor-pointer ml-auto"
                    >
                      <ClipboardPlus size={13} className="text-teal-600 dark:text-teal-400" />
                      Xem hồ sơ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
