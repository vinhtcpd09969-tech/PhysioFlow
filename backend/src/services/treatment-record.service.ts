import treatmentRecordRepository from '../repositories/treatment-record.repository';
import appointmentService from './appointment.service';
import notificationService from './notification.service';

class TreatmentRecordService {
  async createTreatmentRecord(data: any) {
    const record = await treatmentRecordRepository.createTreatmentRecord(data);
    
    // Auto-complete the linked clinical appointment
    if (data.lich_dat_id) {
      try {
        await appointmentService.updateAppointmentStatus(data.lich_dat_id, {
          trang_thai: 'hoan_thanh'
        });
      } catch (err) {
        console.error('Lỗi khi tự động hoàn thành ca khám sau khi tạo hồ sơ điều trị:', err);
      }
    }

    // Send notifications to Managers (Role 6) and Admins (Role 5)
    try {
      const title = 'Hồ sơ điều trị mới chờ điều phối';
      const content = `Bệnh nhân ${record.ho_ten_khach || 'Khách hàng'} đã được Bác sĩ lên phác đồ. Vui lòng phân công KTV và phòng trị liệu.`;
      
      // Notify role 6 (Manager)
      await notificationService.notifyRole(6, title, content, 'dieu_phoi');
      // Notify role 5 (Admin)
      await notificationService.notifyRole(5, title, content, 'dieu_phoi');
    } catch (err) {
      console.error('Lỗi khi gửi thông báo cho Quản lý/Admin:', err);
    }

    return record;
  }

  async getTreatmentRecords() {
    return treatmentRecordRepository.getTreatmentRecords();
  }

  async assignTreatmentRecord(id: string) {
    return treatmentRecordRepository.assignTreatmentRecord(id);
  }
}

export default new TreatmentRecordService();
