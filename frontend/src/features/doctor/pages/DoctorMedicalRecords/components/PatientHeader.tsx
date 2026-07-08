import React from 'react';
import { Phone, Mail, Calendar, FileText, Activity, CheckCircle2 } from 'lucide-react';
import { PatientInfo, PatientProfile } from '../../../api/doctor.api';

interface PatientHeaderProps {
  selectedPatient: PatientInfo;
  profile: PatientProfile | null;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ selectedPatient, profile }) => {
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  // Tính toán chỉ số thống kê
  const totalRecords = profile?.medicalRecords?.length || 0;
  const activePlans = profile?.treatmentPlans?.filter((p: any) => p.trang_thai === 'dang_dieu_tri').length || 0;
  const totalPlans = profile?.treatmentPlans?.length || 0;

  return (
    <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
      {/* Patient Avatar & Personal Info */}
      <div className="flex items-start gap-4 min-w-0">
        <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl shadow-sm shrink-0">
          {selectedPatient.ho_ten.charAt(0).toUpperCase()}
        </div>
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-extrabold text-secondary dark:text-zinc-100 truncate">
              {selectedPatient.ho_ten}
            </h2>
            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              selectedPatient.gioi_tinh === 'nam' 
                ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/25' 
                : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/25'
            }`}>
              {selectedPatient.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
            </span>
            {selectedPatient.ngay_sinh && (
              <span className="text-[8px] font-extrabold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50 uppercase">
                {getAge(selectedPatient.ngay_sinh)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-zinc-400 shrink-0" />
              {selectedPatient.so_dien_thoai}
            </span>
            {selectedPatient.email && (
              <span className="flex items-center gap-1.5 min-w-0">
                <Mail size={13} className="text-zinc-400 shrink-0" />
                <span className="truncate">{selectedPatient.email}</span>
              </span>
            )}
            {selectedPatient.ngay_sinh && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-zinc-400 shrink-0" />
                <span>NS: {formatDate(selectedPatient.ngay_sinh)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Medical HUD Summary Stats widgets */}
      <div className="flex items-center gap-3 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {/* Stat 1: Total Records */}
        <div className="bg-white dark:bg-zinc-855 border border-zinc-150 dark:border-zinc-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm min-w-[110px] shrink-0">
          <div className="size-8 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
            <FileText size={16} />
          </div>
          <div>
            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Hồ sơ khám</p>
            <p className="text-sm font-black text-secondary dark:text-zinc-100">{totalRecords}</p>
          </div>
        </div>

        {/* Stat 2: Active Treatments */}
        <div className="bg-white dark:bg-zinc-855 border border-zinc-150 dark:border-zinc-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm min-w-[110px] shrink-0">
          <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Activity size={16} />
          </div>
          <div>
            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Đang trị liệu</p>
            <p className="text-sm font-black text-secondary dark:text-zinc-100">{activePlans}</p>
          </div>
        </div>

        {/* Stat 3: Total Treatments */}
        <div className="bg-white dark:bg-zinc-855 border border-zinc-150 dark:border-zinc-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm min-w-[110px] shrink-0">
          <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Tổng liệu trình</p>
            <p className="text-sm font-black text-secondary dark:text-zinc-100">{totalPlans}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
