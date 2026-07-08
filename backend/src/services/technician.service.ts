import technicianRepository from '../repositories/technician.repository';

class TechnicianService {
  // 1. Lấy danh sách hàng đợi trị liệu hôm nay của KTV
  async getQueue(userId: string) {
    return await technicianRepository.getTechnicianQueue(userId);
  }

  // 2. Lấy danh sách lịch hẹn của KTV
  async getAppointments(userId: string, startDate?: string, endDate?: string) {
    return await technicianRepository.getTechnicianAppointments(userId, startDate, endDate);
  }

  // 3. Lấy chi tiết lịch trị liệu
  async getAppointmentDetail(appointmentId: string) {
    const detail = await technicianRepository.getAppointmentDetail(appointmentId);
    if (!detail) {
      throw new Error('Không tìm thấy chi tiết ca trị liệu.');
    }
    return detail;
  }

  // 4. Lưu kết quả lượng giá buổi trị liệu và ghi chú
  async saveTreatmentRecord(
    userId: string,
    data: {
      lich_dat_id: string;
      vas_truoc: number;
      vas_sau: number;
      ghi_chu?: string | null;
    }
  ) {
    return await technicianRepository.saveTreatmentRecord({
      lich_dat_id: data.lich_dat_id,
      ktv_id: userId,
      vas_truoc: data.vas_truoc,
      vas_sau: data.vas_sau,
      ghi_chu: data.ghi_chu
    });
  }

  // 5. Lấy danh sách lịch trực của KTV
  async getSchedules(userId: string) {
    return await technicianRepository.getTechnicianSchedules(userId);
  }
}

export default new TechnicianService();
