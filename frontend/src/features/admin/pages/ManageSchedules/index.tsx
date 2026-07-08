import { useState } from 'react';
import { useSchedulesState } from '../../components/schedules/hooks/useSchedulesState';
import { SchedulesHeader } from '../../components/schedules/ui/SchedulesHeader';
import { SchedulesKpis } from '../../components/schedules/ui/SchedulesKpis';
import { SchedulesGrid } from '../../components/schedules/ui/SchedulesGrid';
import { ScheduleFormModal } from '../../components/schedules/ui/ScheduleFormModal';
import { Schedule } from '../../components/schedules/types';

export default function ManageSchedules() {
  const {
    schedules,
    staff,
    rooms,
    loading,
    selectedMonday,
    setSelectedMonday,
    roleFilter,
    setRoleFilter,
    weekDates,
    groupedStaff,
    conflicts,
    stats,
    weeklyStatsByStaff,
    handleDeleteScheduleById,
    fetchData,
    searchQuery,
    setSearchQuery
  } = useSchedulesState();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [prefilledStaffId, setPrefilledStaffId] = useState<string | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  const [selectedShiftType, setSelectedShiftType] = useState<'morning' | 'afternoon' | 'tam_nghi'>('morning');

  const handleOpenAddModal = (userId: string, dateStr?: string) => {
    setEditingSchedule(null);
    setPrefilledStaffId(userId);
    setPrefilledDate(dateStr || null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sched: Schedule) => {
    setEditingSchedule(sched);
    setPrefilledStaffId(sched.nguoi_dung_id);
    setPrefilledDate(sched.ngay);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setPrefilledStaffId(null);
    setPrefilledDate(null);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setPrefilledStaffId(null);
    setPrefilledDate(null);
    fetchData();
  };

  const handleDeleteSchedule = async () => {
    if (!editingSchedule) return;
    const success = await handleDeleteScheduleById(editingSchedule.id);
    if (success) {
      handleSuccess();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-semibold select-none">Đang tải dữ liệu lịch trực...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-sans text-sm text-gray-800">
      
      {/* Header, Week Selector, Role selector, Search */}
      <SchedulesHeader
        selectedMonday={selectedMonday}
        onMondayChange={setSelectedMonday}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      {/* KPI Cards (Simplified to just active staff today) */}
      <SchedulesKpis stats={stats} />

      {/* Conflicts Warnings - Rendered at top of table, only visible when there are conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-rose-50/60 border border-rose-100 p-5 rounded-3xl flex flex-col gap-3 text-left animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
            <span>⚠️ Cảnh báo: Phát hiện {conflicts.length} trường hợp trùng lịch trực làm việc</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conflicts.map((c: any, i: number) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-rose-150 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                    <span className="font-bold text-rose-700">{c.name}</span> bị trùng ca trực vào <span className="font-bold text-gray-900">{c.dowLabel}</span>.
                  </p>
                  <p className="text-[10px] text-rose-600 font-bold mt-1.5 bg-rose-50 px-2.5 py-0.5 rounded-md w-fit">
                    Khung giờ: {c.time1} - {c.time2}
                  </p>
                </div>
                <button 
                  onClick={() => handleOpenAddModal(c.id, c.dateStr)} 
                  className="text-[10px] font-black text-rose-600 hover:text-rose-800 underline transition-colors w-fit mt-3.5 uppercase tracking-wider text-left"
                >
                  Điều chỉnh ngay →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-width Grid Table Container */}
      <div className="w-full">
        <SchedulesGrid
          weekDates={weekDates}
          groupedStaff={groupedStaff}
          schedules={schedules}
          conflicts={conflicts}
          onOpenModal={handleOpenAddModal}
          onOpenEditModal={handleOpenEditModal}
        />
      </div>

      {/* Weekly Stats Panel - Placed below grid for convenient lookup */}
      <div className="bg-white border border-slate-200/60 rounded-[28px] p-6 shadow-md text-left">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </span>
          <div>
            <h3 className="font-heading font-black text-base text-gray-800 uppercase tracking-wide">Thống kê ca trực tuần</h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Số ca làm việc thực tế trong tuần đang xem của nhân sự</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
          {['Bác sĩ', 'Lễ tân', 'Kỹ thuật viên'].map(role => {
            const roleStats = weeklyStatsByStaff[role];
            if (!roleStats || roleStats.length === 0) return null;
            return (
              <div key={role} className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-2 flex justify-between">
                  <span>{role}</span>
                  <span className="bg-slate-200/60 px-2 py-0.5 rounded text-[9px] text-slate-600 font-bold">{roleStats.length} nhân sự</span>
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {roleStats.map((st: any) => (
                    <div key={st.name} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700 truncate max-w-[130px]">{st.name}</span>
                      <div className="flex gap-1.5 shrink-0 select-none">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg text-[10px] font-extrabold" title="Ca sáng">
                          Sáng: {st.morning}
                        </span>
                        <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-lg text-[10px] font-extrabold" title="Ca chiều/tối">
                          Chiều: {st.afternoon}
                        </span>
                        <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-lg text-[10px] font-extrabold" title="Nghỉ">
                          Nghỉ: {st.off}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Popup for scheduling */}
      <ScheduleFormModal
        isOpen={isModalOpen}
        staff={staff}
        rooms={rooms}
        schedules={schedules}
        editingSchedule={editingSchedule}
        prefilledStaffId={prefilledStaffId}
        prefilledDate={prefilledDate}
        selectedShiftType={selectedShiftType}
        setSelectedShiftType={setSelectedShiftType}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        onDeleteSchedule={handleDeleteSchedule}
      />
    </div>
  );
}
