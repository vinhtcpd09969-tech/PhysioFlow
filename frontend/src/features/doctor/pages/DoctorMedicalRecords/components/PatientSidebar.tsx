import React, { useState, useMemo, useEffect } from 'react';
import { Search, Clock, Users, ShieldAlert } from 'lucide-react';
import { PatientInfo } from '../../../api/doctor.api';
import { useAuthStore } from '../../../../../stores/authStore';

interface PatientSidebarProps {
  patients: PatientInfo[];
  selectedPatient: PatientInfo | null;
  onSelectPatient: (patient: PatientInfo) => void;
  loadingPatients: boolean;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  loadingPatients,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const user = useAuthStore((state) => state.user);

  // Load danh sách xem gần đây của riêng bác sĩ này
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`recent_patients_${user.id}`);
      if (stored) {
        try {
          setRecentIds(JSON.parse(stored));
        } catch {
          setRecentIds([]);
        }
      } else {
        setRecentIds([]);
      }
    }
  }, [user?.id, selectedPatient]); // Nạp lại khi đổi bác sĩ hoặc khi có thay đổi

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

  // Lọc danh sách bệnh nhân gần đây
  const recentPatients = useMemo(() => {
    const map = new Map(patients.map((p) => [p.id, p]));
    return recentIds
      .map((id) => map.get(id))
      .filter((p): p is PatientInfo => !!p);
  }, [patients, recentIds]);

  // Chọn danh sách nguồn dựa theo tab hoạt động
  const activeSourceList = activeTab === 'all' ? patients : recentPatients;

  // Lọc tìm kiếm
  const filteredPatients = useMemo(() => {
    return activeSourceList.filter((p) => {
      const name = p.ho_ten.toLowerCase();
      const phone = p.so_dien_thoai || '';
      const search = searchTerm.toLowerCase();
      return name.includes(search) || phone.includes(search);
    });
  }, [activeSourceList, searchTerm]);

  // Xử lý khi click chọn bệnh nhân
  const handleSelect = (p: PatientInfo) => {
    onSelectPatient(p);
    if (user?.id) {
      const updated = [p.id, ...recentIds.filter((id) => id !== p.id)].slice(0, 5);
      setRecentIds(updated);
      localStorage.setItem(`recent_patients_${user.id}`, JSON.stringify(updated));
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden shrink-0">
      {/* Search Header */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 space-y-3.5">
        <div>
          <h3 className="text-xs font-black text-secondary dark:text-zinc-100 uppercase tracking-wider">
            Hồ sơ Bệnh nhân
          </h3>
          <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">
            Tìm kiếm & truy xuất EHR nhanh
          </p>
        </div>
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nhập tên hoặc số điện thoại..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-secondary dark:text-zinc-100 placeholder-zinc-450 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-850 px-3 bg-zinc-50/50 dark:bg-zinc-900/30">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'
          }`}
        >
          <Users size={12} />
          Tất cả ({patients.length})
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'recent'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'
          }`}
        >
          <Clock size={12} />
          Xem gần đây ({recentPatients.length})
        </button>
      </div>

      {/* Patients Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        {loadingPatients ? (
          <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-2">
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-wider animate-pulse">Đang tải bệnh nhân...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs font-semibold">
            {activeTab === 'all' ? 'Không tìm thấy bệnh nhân nào' : 'Chưa có bệnh nhân nào đã xem gần đây'}
          </div>
        ) : (
          filteredPatients.map((p) => {
            const isSelected = selectedPatient?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all border ${
                  isSelected
                    ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 text-primary shadow-sm'
                    : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300'
                } hover:-translate-y-[1px] duration-300`}
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-inner relative ${
                    isSelected ? 'bg-primary/20 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {p.ho_ten.charAt(0).toUpperCase()}
                  
                  {/* Chấm cảnh báo chống chỉ định */}
                  {p.has_chong_chi_dinh && (
                    <span className="absolute -top-0.5 -right-0.5 size-2.5 bg-rose-500 border-2 border-white dark:border-zinc-900 rounded-full animate-pulse shadow-sm" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold truncate">{p.ho_ten}</h4>
                    {p.has_chong_chi_dinh && (
                      <ShieldAlert size={12} className="text-rose-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[9px] text-zinc-400 font-semibold mt-0.5 flex items-center gap-1.5">
                    <span className="uppercase">{p.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}</span>
                    <span>•</span>
                    <span>{getAge(p.ngay_sinh) || 'N/A'}</span>
                    <span>•</span>
                    <span className="truncate">{p.so_dien_thoai}</span>
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
