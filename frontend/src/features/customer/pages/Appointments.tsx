import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, Search, Plus, CheckCircle2, XCircle, AlertCircle, PlayCircle } from 'lucide-react';
import axiosInstance from '../../../api/axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import NewAppointmentForm from '../../admin/components/NewAppointmentForm';

interface Appointment {
  id: string;
  ma_lich_dat: string;
  ten_khach_hang: string;
  ten_dich_vu: string;
  ten_ky_thuat_vien: string | null;
  ten_phong: string | null;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  trang_thai: 'cho_xac_nhan' | 'da_xac_nhan' | 'da_checkin' | 'hoan_thanh' | 'da_huy' | 'khong_den';
}

const statusConfig = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <AlertCircle size={14} /> },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle2 size={14} /> },
  da_checkin: { label: 'Đã Check-in', color: 'bg-primary/20 text-primary border-primary/30', icon: <PlayCircle size={14} /> },
  hoan_thanh: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 size={14} /> },
  da_huy: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={14} /> },
  khong_den: { label: 'Không đến', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <XCircle size={14} /> },
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      const response = await axiosInstance.get('/admin/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axiosInstance.patch(`/admin/appointments/${id}/status`, { trang_thai: newStatus });
      fetchAppointments();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Lỗi cập nhật trạng thái');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchSearch = apt.ma_lich_dat.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        apt.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || apt.trang_thai === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-secondary mb-1">
            Quản lý Lịch hẹn
          </h1>
          <p className="text-gray-500 text-sm">Theo dõi và quản lý lịch hẹn của khách hàng.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-1 md:flex-none outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="cho_xac_nhan">Chờ xác nhận</option>
            <option value="da_xac_nhan">Đã xác nhận</option>
            <option value="da_checkin">Đã Check-in</option>
            <option value="hoan_thanh">Hoàn thành</option>
            <option value="da_huy">Đã hủy</option>
            <option value="khong_den">Không đến</option>
          </select>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex-1 md:flex-none"
          >
            <Plus size={16} /> Đặt lịch mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo mã, tên khách hàng..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                <th className="px-6 py-4">Mã lịch</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Dịch vụ & KTV</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy lịch hẹn nào.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const status = statusConfig[apt.trang_thai];
                  return (
                    <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-secondary text-sm">{apt.ma_lich_dat}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {apt.ten_khach_hang.charAt(0)}
                          </div>
                          <span className="font-medium text-sm text-gray-900">{apt.ten_khach_hang}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                            <CalendarIcon size={14} className="text-gray-400" />
                            {format(new Date(apt.ngay_gio_bat_dau), 'dd/MM/yyyy', { locale: vi })}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock size={14} className="text-gray-400" />
                            {format(new Date(apt.ngay_gio_bat_dau), 'HH:mm')} - {format(new Date(apt.ngay_gio_ket_thuc), 'HH:mm')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-900 line-clamp-1">{apt.ten_dich_vu}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5">
                            <User size={12} /> {apt.ten_ky_thuat_vien || 'Chưa chỉ định'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          className="bg-white border border-gray-200 text-xs rounded-lg px-2 py-1.5 text-gray-600 outline-none focus:border-primary cursor-pointer hover:bg-gray-50"
                          value={apt.trang_thai}
                          onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                        >
                          <option value="cho_xac_nhan">Chờ xác nhận</option>
                          <option value="da_xac_nhan">Đã xác nhận</option>
                          <option value="da_checkin">Đã Check-in</option>
                          <option value="hoan_thanh">Hoàn thành</option>
                          <option value="da_huy">Hủy</option>
                          <option value="khong_den">Không đến</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewAppointmentForm 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchAppointments} 
      />
    </div>
  );
}
