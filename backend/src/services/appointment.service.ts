import appointmentRepository from '../repositories/appointment.repository';

class AppointmentService {
  async getAllAppointments() {
    return appointmentRepository.getAllAppointments();
  }

  async createAppointment(data: any) {
    const ma_lich_dat = 'LD-' + Math.floor(10000 + Math.random() * 90000);
    return appointmentRepository.createAppointment(ma_lich_dat, data);
  }

  async createPublicAppointment(data: any) {
    const ma_lich_dat = 'LD-' + Math.floor(10000 + Math.random() * 90000);
    // Mặc định thời lượng khám là 30 phút
    const ngay_gio_ket_thuc = new Date(new Date(data.ngay_gio_bat_dau).getTime() + 30 * 60000).toISOString();
    return appointmentRepository.createPublicAppointment(ma_lich_dat, { ...data, ngay_gio_ket_thuc });
  }

  async updateAppointmentStatus(id: string, data: { trang_thai: string; ky_thuat_vien_id?: string | null; phong_id?: string | number | null }) {
    const appointment = await appointmentRepository.updateAppointmentStatus(id, data);
    if (!appointment) {
      throw new Error('Không tìm thấy lịch hẹn');
    }
    return appointment;
  }

  async updateMedicalRecord(id: string, data: { chan_doan?: string, chong_chi_dinh?: string, khuyen_nghi_dich_vu_id?: string | null, khuyen_nghi_goi_id?: string | null }) {
    return appointmentRepository.updateMedicalRecord(id, data);
  }
}

export default new AppointmentService();
