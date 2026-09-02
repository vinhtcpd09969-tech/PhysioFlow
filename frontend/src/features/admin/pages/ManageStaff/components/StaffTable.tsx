import { useMemo } from 'react';
import { Search, Plus, Eye, Lock, Unlock, Loader2, X } from 'lucide-react';
import { getSmartSearchScore } from '../../../../../utils/smartSearch';

export const getRoleLabel = (roleId: number) => {
  switch (roleId) {
    case 2: return 'Lễ tân';
    case 3: return 'Kỹ thuật viên';
    case 4: return 'Chuyên viên tư vấn';
    case 5: return 'Admin';
    case 6: return 'Quản lý';
    default: return 'Khác';
  }
};

export const getRoleStyle = (roleId: number) => {
  switch (roleId) {
    case 5: return 'bg-purple-50 text-purple-700 border-purple-200/50 dark:bg-purple-955/15 dark:text-purple-400 dark:border-purple-900/40';
    case 6: return 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-955/15 dark:text-indigo-400 dark:border-indigo-900/40';
    case 4: return 'bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-955/15 dark:text-sky-400 dark:border-sky-900/40';
    case 3: return 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-955/15 dark:text-amber-400 dark:border-amber-900/40';
    default: return 'bg-zinc-50 text-zinc-700 border-zinc-200/50 dark:bg-zinc-800/15 dark:text-zinc-400 dark:border-zinc-700/40';
  }
};

interface StaffTableProps {
  staffList: any[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedRoleFilter: 'all' | '2' | '3' | '4' | '5' | '6';
  setSelectedRoleFilter: (role: 'all' | '2' | '3' | '4' | '5' | '6') => void;
  onOpenCreate: () => void;
  onOpenDetails: (staff: any) => void;
  onToggleStatus: (staff: any) => void;
  onDeleteAvatar: (staff: any) => void;
}

export function StaffTable({
  staffList,
  loading,
  searchQuery,
  setSearchQuery,
  selectedRoleFilter,
  setSelectedRoleFilter,
  onOpenCreate,
  onOpenDetails,
  onToggleStatus,
  onDeleteAvatar
}: StaffTableProps) {
  const filteredStaffList = useMemo(() => {
    return staffList
      .filter((staff: any) => {
        const nameMatch = searchQuery === '' || getSmartSearchScore(staff.ho_ten || '', searchQuery) > 0;
        const emailMatch = staff.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSearch = nameMatch || emailMatch;
        const matchesRole = selectedRoleFilter === 'all' || String(staff.vai_tro_id) === selectedRoleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a: any, b: any) => {
        const aLocked = a.trang_thai === 'vo_hieu';
        const bLocked = b.trang_thai === 'vo_hieu';
        if (aLocked && !bLocked) return 1;
        if (!aLocked && bLocked) return -1;
        
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : Number(a.id) || 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : Number(b.id) || 0;
        return bTime - aTime;
      });
  }, [staffList, searchQuery, selectedRoleFilter]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/80 dark:border-slate-800 overflow-hidden font-jakarta">
      {/* Integrated Toolbar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3.5 top-3.5 text-zinc-400 size-4" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân sự bằng họ tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 focus:border-teal-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold outline-none focus:ring-2 focus:ring-teal-500/20 transition-all shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          <div className="flex bg-slate-100/90 dark:bg-zinc-955 p-1 rounded-xl w-full sm:w-auto overflow-x-auto border border-slate-200/60 dark:border-slate-800 shrink-0">
            {[
              { id: 'all', label: 'TẤT CẢ' },
              { id: '4', label: 'CHUYÊN VIÊN TƯ VẤN' },
              { id: '3', label: 'KỸ THUẬT VIÊN' },
              { id: '2', label: 'LỄ TÂN' },
              { id: '6', label: 'QUẢN LÝ' },
              { id: '5', label: 'ADMIN' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id as any)}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-[10px] font-black tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  selectedRoleFilter === tab.id
                    ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenCreate}
            className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus size={16} /> Thêm nhân sự mới
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-400 font-black uppercase tracking-widest text-[10px]">
              <th className="p-4 flex items-center gap-2">Nhân sự</th>
              <th className="p-4">Email liên hệ</th>
              <th className="p-4">Số điện thoại</th>
              <th className="p-4">Vai trò làm việc</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-16 text-center text-slate-400 font-bold">
                  <Loader2 className="animate-spin text-teal-600 size-8 mx-auto mb-2" />
                  Đang tải danh sách nhân sự...
                </td>
              </tr>
            ) : filteredStaffList.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-16 text-center text-slate-400 font-semibold italic">
                  Không tìm thấy nhân sự phù hợp với điều kiện tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredStaffList.map((staff) => {
                const isLocked = staff.trang_thai === 'vo_hieu';
                const avatarUrl = staff.anh_dai_dien || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staff.ho_ten)}&backgroundType=gradientLinear&fontSize=45`;
                return (
                  <tr 
                    key={staff.id} 
                    className={`transition-colors font-jakarta ${
                      isLocked 
                        ? 'bg-rose-50/20 dark:bg-rose-955/10 hover:bg-rose-50/40 opacity-75' 
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0 group/avatar">
                          <img
                            src={avatarUrl}
                            alt={staff.ho_ten}
                            className={`w-10 h-10 rounded-2xl object-cover border shadow-sm ${
                              isLocked ? 'border-rose-200 dark:border-rose-800 grayscale' : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                          {staff.anh_dai_dien && (
                            <button
                              type="button"
                              onClick={() => onDeleteAvatar(staff)}
                              title="Xóa ảnh đại diện"
                              className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                            >
                              <X size={16} className="text-white" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-extrabold text-xs md:text-sm leading-tight truncate ${
                              isLocked 
                                ? 'line-through text-slate-400 dark:text-zinc-500' 
                                : 'text-slate-900 dark:text-white'
                            }`}>
                              {staff.ho_ten}
                            </span>
                            {isLocked && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 shadow-xs shrink-0">
                                <Lock size={10} /> Đã khóa
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-extrabold tracking-wider block mt-0.5">
                            MÃ NV: #{staff.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-700 dark:text-slate-300">{staff.email}</td>
                    <td className="p-4 text-xs font-bold text-slate-700 dark:text-slate-300">{staff.so_dien_thoai || '-'}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-2.5 py-1 border rounded-lg text-[9px] font-extrabold uppercase tracking-widest ${getRoleStyle(staff.vai_tro_id)}`}>
                        {getRoleLabel(staff.vai_tro_id)}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                        staff.trang_thai === 'hoat_dong'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400'
                      }`}>
                        {staff.trang_thai === 'hoat_dong' ? 'Đang hoạt động' : 'Khóa'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={() => onOpenDetails(staff)}
                          title="Xem chi tiết & Cập nhật"
                          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200/40 rounded-xl transition-all cursor-pointer text-slate-700 dark:text-zinc-300 active:scale-95"
                        >
                          <Eye size={15} />
                        </button>
                        {Number(staff.vai_tro_id) !== 5 && (
                          <button
                            onClick={() => onToggleStatus(staff)}
                            title={staff.trang_thai === 'hoat_dong' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            className={`p-2 border rounded-xl transition-all cursor-pointer active:scale-95 ${
                              staff.trang_thai === 'hoat_dong'
                                ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/15 dark:hover:bg-rose-900/30 text-rose-600 border-rose-200/50'
                                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-955/15 dark:hover:bg-emerald-900/30 text-emerald-600 border-emerald-200/50'
                            }`}
                          >
                            {staff.trang_thai === 'hoat_dong' ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
