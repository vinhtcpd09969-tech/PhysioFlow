
import { UserPlus, MapPin } from 'lucide-react';

interface AppointmentCalendarProps {
  timeSlots: string[];
  scheduleType: 'kham_moi' | 'dieu_tri';
  columnsStaff: any[];
  getCellAppointments: (hour: string, ktvId: string | null) => any[];
  statusConfig: any;
  handleOpenDetailModal: (apt: any) => void;
}

export default function AppointmentCalendar({
  timeSlots,
  scheduleType,
  columnsStaff,
  getCellAppointments,
  statusConfig,
  handleOpenDetailModal
}: AppointmentCalendarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <table className="w-full border-collapse min-w-[1000px] text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200">
            <th className="w-24 p-4 text-center border-r border-slate-200">Khung giờ</th>
            
            {/* Unassigned Column (Only for Consultations) */}
            {scheduleType === 'kham_moi' && (
              <th className="p-4 border-r border-slate-200 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <UserPlus size={14} />
                  </div>
                  <div>
                    <div className="text-slate-800 text-sm font-bold">Chưa chỉ định</div>
                    <div className="text-slate-400 text-[10px]">Cần phân phòng/Bác sĩ</div>
                  </div>
                </div>
              </th>
            )}

            {/* Staff Columns */}
            {columnsStaff.map(staff => (
              <th key={staff.id} className="p-4 border-r border-slate-200 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                    {staff.ho_ten.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                  </div>
                  <div>
                    <div className="text-slate-800 text-sm font-bold">{staff.ho_ten}</div>
                    <div className="text-slate-400 text-[10px]">{staff.vai_tro}</div>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-100">
          {timeSlots.map(hour => {
            const isLunchBreak = hour === '12:00';
            
            if (isLunchBreak) {
              return (
                <tr key={hour} className="bg-slate-50 text-center">
                  <td className="p-3 text-sm font-bold text-slate-400 border-r border-slate-200">
                    {hour}
                  </td>
                  <td colSpan={(scheduleType === 'kham_moi' ? 1 : 0) + columnsStaff.length} className="p-3 text-xs tracking-widest font-semibold text-slate-400 uppercase bg-slate-100/50">
                    ☕ Nghỉ trưa hệ thống
                  </td>
                </tr>
              );
            }

            return (
              <tr key={hour} className="hover:bg-slate-50/50 group transition-colors">
                <td className="p-4 text-center border-r border-slate-200 font-mono text-sm font-semibold text-slate-600 select-none bg-white">
                  {hour}
                </td>
                
                {/* Unassigned Cell */}
                {scheduleType === 'kham_moi' && (
                  <td className="p-2 border-r border-slate-100 align-top relative min-h-[90px] bg-rose-50/10">
                    <div className="space-y-2">
                      {getCellAppointments(hour, null).map(apt => {
                        const status = statusConfig[apt.trang_thai] || statusConfig.cho_xac_nhan;
                        return (
                          <div
                            key={apt.id}
                            onClick={() => handleOpenDetailModal(apt)}
                            className="p-3 bg-white border border-rose-200 cursor-pointer shadow-sm hover:shadow-md transition-all rounded-xl"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                                {apt.ma_lich_dat}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-slate-800 line-clamp-1">{apt.ten_khach_hang}</div>
                            <div className="mt-1 text-xs text-slate-500 line-clamp-1">{apt.ten_dich_vu}</div>
                            <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold ${status.color}`}>
                              {status.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                )}

                {/* Staff Cells */}
                {columnsStaff.map(staff => {
                  const cellApts = getCellAppointments(hour, staff.ky_thuat_vien_id);
                  
                  return (
                    <td key={staff.id} className="p-2 border-r border-slate-100 align-top relative min-h-[90px]">
                      <div className="space-y-2">
                        {cellApts.map(apt => {
                          const status = statusConfig[apt.trang_thai] || statusConfig.cho_xac_nhan;
                          return (
                            <div
                              key={apt.id}
                              onClick={() => handleOpenDetailModal(apt)}
                              className="p-3 bg-white border border-slate-200 cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-300 transition-all rounded-xl"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {apt.ma_lich_dat}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${status.color}`}>
                                  {status.label}
                                </span>
                              </div>
                              
                              <div className="text-sm font-bold text-slate-800 line-clamp-1">{apt.ten_khach_hang}</div>
                              <div className="mt-1 text-xs text-slate-500 line-clamp-1">{apt.ten_dich_vu}</div>

                              {apt.ten_phong && (
                                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md w-fit">
                                  <MapPin size={12} />
                                  <span>{apt.ten_phong}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
