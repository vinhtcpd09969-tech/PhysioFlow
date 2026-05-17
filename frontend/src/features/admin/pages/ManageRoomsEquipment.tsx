import { useState, useEffect } from 'react';
import { getRooms, getEquipment } from '../../../api/admin.api';

// --- MOCK DATA --- (In case the API doesn't return full data as per mockup)
const mockRooms = [
  { id: 1, ma_phong: 'P.101', ten_phong: 'Phòng P.101', loai: 'Phục hồi cơ bản', tang: 'Tầng 1', suc_chua: 4, trang_thai: 'trong' },
  { id: 2, ma_phong: 'P.102', ten_phong: 'Phòng P.102', loai: 'Vật lý trị liệu', tang: 'Tầng 1', suc_chua: 2, trang_thai: 'dang_dung' },
  { id: 3, ma_phong: 'P.201', ten_phong: 'Phòng P.201', loai: 'VIP Recovery', tang: 'Tầng 2', suc_chua: 1, trang_thai: 'trong' },
  { id: 4, ma_phong: 'P.202', ten_phong: 'Phòng P.202', loai: 'Trị liệu thần kinh', tang: 'Tầng 2', suc_chua: 3, trang_thai: 'dang_dung' },
  { id: 5, ma_phong: 'P.301', ten_phong: 'Phòng P.301', loai: 'Hồ bơi phục hồi', tang: 'Tầng 3', suc_chua: 10, trang_thai: 'bao_tri', log: 'Thay nước hệ thống lọc, khử khuẩn toàn bộ sàn. Dự kiến xong: 16:00 hôm nay.' },
  { id: 6, ma_phong: 'P.302', ten_phong: 'Phòng P.302', loai: 'Yoga & Thiền', tang: 'Tầng 3', suc_chua: 15, trang_thai: 'trong' },
];

const mockEquipment = [
  { id: 1, ma_thiet_bi: 'EQP-00412', ten_thiet_bi: 'Máy kéo giãn cột sống', phong: 'Phòng P.102', trang_thai: 'hoat_dong', bao_tri_tiep: '15/05/2026' },
  { id: 2, ma_thiet_bi: 'EQP-00851', ten_thiet_bi: 'Hệ thống siêu âm trị liệu', phong: 'Phòng P.202', trang_thai: 'hoat_dong', bao_tri_tiep: '02/06/2026' },
  { id: 3, ma_thiet_bi: 'EQP-01103', ten_thiet_bi: 'Máy shockwave BTL-6000', phong: 'Phòng P.301', trang_thai: 'ngung_dung', bao_tri_tiep: 'Đang quá hạn' },
  { id: 4, ma_thiet_bi: 'EQP-02214', ten_thiet_bi: 'Máy điện xung 4 kênh', phong: 'Phòng P.101', trang_thai: 'hoat_dong', bao_tri_tiep: '20/07/2026' },
];

export default function ManageRoomsEquipment() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'equipment'>('rooms');
  const [rooms, setRooms] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Set to false to see mock data quickly

  // Note: We use mock data to perfectly match Image 4 if the real DB is empty.
  // In a real scenario, you'd replace this with the API calls below.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using Promise.allSettled to not break if endpoints don't exist yet
        const [roomsRes, eqRes] = await Promise.allSettled([getRooms(), getEquipment()]);
        
        if (roomsRes.status === 'fulfilled' && roomsRes.value.data.length > 0) {
          setRooms(roomsRes.value.data);
        } else {
          setRooms(mockRooms);
        }

        if (eqRes.status === 'fulfilled' && eqRes.value.data.length > 0) {
          setEquipment(eqRes.value.data);
        } else {
          setEquipment(mockEquipment);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setRooms(mockRooms);
        setEquipment(mockEquipment);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trong':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">TRỐNG</span>;
      case 'dang_dung':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">ĐANG DÙNG</span>;
      case 'bao_tri':
        return <span className="bg-rose-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm">ĐANG BẢO TRÌ</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">TRỐNG</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in duration-500 pb-12 relative h-full">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-teal-900 tracking-tight">Quản lý Phòng & Thiết bị</h2>
          <p className="text-slate-500 mt-1.5 text-sm">Trung tâm theo dõi tài nguyên, hạ tầng và máy móc y tế</p>
        </div>
        
        {/* Modern Tabs */}
        <div className="flex bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl shadow-inner w-max">
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 ${
              activeTab === 'rooms' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Phòng ({rooms.length})
          </button>
          <button 
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 ${
              activeTab === 'equipment' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Thiết bị
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-teal-600">
          <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full mb-4 shadow-lg"></div>
          <p className="font-bold text-slate-500">Đang đồng bộ dữ liệu hạ tầng...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ROOMS GRID */}
          {activeTab === 'rooms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {rooms.map(room => {
                const isMaintenance = room.trang_thai === 'bao_tri';
                return (
                  <div key={room.id} className={`rounded-[24px] shadow-sm border p-6 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 group cursor-pointer active:scale-[0.98] ${isMaintenance ? 'bg-rose-50/30 border-rose-100 hover:shadow-rose-500/10' : 'bg-white border-slate-100 hover:shadow-teal-500/10'}`}>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${isMaintenance ? 'bg-rose-100 text-rose-500' : 'bg-teal-100 text-teal-600'}`}>
                        {isMaintenance ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        )}
                      </div>
                      {getStatusBadge(room.trang_thai)}
                    </div>
                    
                    <h3 className={`text-2xl font-extrabold tracking-tight mb-1 ${isMaintenance ? 'text-rose-900' : 'text-slate-800'}`}>{room.ten_phong}</h3>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mb-4">
                      Khu vực: {room.tang} - {room.loai}
                    </p>

                    {isMaintenance && room.log && (
                      <div className="bg-white/80 backdrop-blur border border-rose-100 rounded-xl p-4 mb-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-rose-600 font-bold text-[10px] tracking-wider uppercase">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Log Vệ Sinh & Bảo Trì
                        </div>
                        <p className="text-xs text-slate-600 italic leading-relaxed">"{room.log}"</p>
                      </div>
                    )}

                    <div className="mt-auto pt-5 flex items-center justify-between border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Sức chứa: <span className="font-bold text-slate-800">{room.suc_chua}</span>
                      </div>
                      <button className={`font-bold text-sm transition-colors active:scale-95 ${isMaintenance ? 'text-rose-600 hover:text-rose-800' : 'text-teal-600 hover:text-teal-800'}`}>
                        {isMaintenance ? 'Xem sự cố' : 'Chi tiết'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: EQUIPMENT TABLE */}
          {activeTab === 'equipment' && (
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-teal-900 text-lg">Danh sách Thiết bị mới cập nhật</h3>
                <button className="text-teal-600 font-bold hover:text-teal-800 active:scale-95 text-sm transition-all flex items-center gap-1">
                  Xem tất cả thiết bị <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="p-5 border-b border-slate-100">Mã TB</th>
                      <th className="p-5 border-b border-slate-100">Tên Thiết bị</th>
                      <th className="p-5 border-b border-slate-100">Phòng</th>
                      <th className="p-5 border-b border-slate-100 text-center">Trạng thái</th>
                      <th className="p-5 border-b border-slate-100 text-center">Bảo trì tiếp</th>
                      <th className="p-5 border-b border-slate-100 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {equipment.map((eq) => (
                      <tr key={eq.id} className="hover:bg-teal-50/30 transition-colors group">
                        <td className="p-5 font-bold text-slate-500">{eq.ma_thiet_bi}</td>
                        <td className="p-5 font-bold text-slate-800">{eq.ten_thiet_bi}</td>
                        <td className="p-5 font-medium text-slate-600">{eq.phong}</td>
                        <td className="p-5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            eq.trang_thai === 'hoat_dong' ? 'bg-cyan-100 text-cyan-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {eq.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Ngừng dùng'}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`font-bold ${eq.bao_tri_tiep === 'Đang quá hạn' ? 'text-rose-600' : 'text-slate-600'}`}>
                            {eq.bao_tri_tiep}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <button className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 active:scale-90 transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Action Button (FAB) for adding new item contextually */}
      <div className="fixed bottom-12 right-12 z-40 animate-bounce">
        <button className="bg-teal-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:bg-teal-900 active:scale-90 transition-all group">
          <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

    </div>
  );
}
