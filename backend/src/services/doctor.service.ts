import doctorRepository from '../repositories/doctor.repository';

class DoctorService {
  // 1. Lấy danh sách hàng đợi khám bệnh hôm nay của bác sĩ
  async getQueue(userId: string, roleId: number = 4) {
    const queue = await doctorRepository.getDoctorQueue(userId, roleId);
    return queue;
  }

  // 2. Lấy danh sách lịch hẹn của bác sĩ
  async getAppointments(userId: string, roleId: number = 4, startDate?: string, endDate?: string) {
    const appointments = await doctorRepository.getDoctorAppointments(userId, roleId, startDate, endDate);
    return appointments;
  }

  // 3. Tổng hợp hồ sơ y tế toàn diện của bệnh nhân (lịch sử khám + phác đồ + chi tiết buổi trị liệu)
  async getPatientMedicalProfile(patientId: string) {
    // Lấy lịch sử khám lâm sàng
    const medicalRecords = await doctorRepository.getPatientHistory(patientId);

    // Lấy danh sách lịch điều trị
    const rawTreatments = await doctorRepository.getPatientTreatments(patientId);

    // Ghép chi tiết từng buổi trị liệu vào các lịch điều trị tương ứng
    const treatmentPlans = [];
    for (const treatment of rawTreatments) {
      const sessions = await doctorRepository.getTreatmentSessions(treatment.id);
      treatmentPlans.push({
        ...treatment,
        sessions,
      });
    }

    return {
      medicalRecords,
      treatmentPlans,
    };
  }

  // 4. Lấy thông tin chi tiết một ca khám cụ thể
  async getAppointmentDetail(appointmentId: string) {
    const detail = await doctorRepository.getAppointmentDetail(appointmentId);
    if (!detail) {
      throw new Error('Không tìm thấy chi tiết ca khám.');
    }
    return detail;
  }

  // 5. Lưu chẩn đoán lâm sàng và hoàn thành ca khám
  async saveAssessment(
    userId: string,
    data: {
      lich_dat_id: string;
      chan_doan: string;
      chong_chi_dinh: string;
      goi_dich_vu_id?: string | null;
      ghi_chu?: string | null;
    }
  ) {
    // Gọi repository để thực hiện transaction lưu bệnh án và đóng lịch hẹn
    const result = await doctorRepository.saveClinicalAssessment({
      lich_dat_id: data.lich_dat_id,
      bac_si_id: userId,
      chan_doan: data.chan_doan,
      chong_chi_dinh: data.chong_chi_dinh,
      goi_dich_vu_id: data.goi_dich_vu_id,
      ghi_chu: data.ghi_chu,
    });

    return result;
  }

  // 6. Lấy danh sách lịch trực của bác sĩ
  async getSchedules(userId: string) {
    const schedules = await doctorRepository.getDoctorSchedules(userId);
    return schedules;
  }

  // 7. Lấy danh sách bệnh nhân cho bác sĩ (kèm has_chong_chi_dinh và filter theo bác sĩ)
  async getPatients(userId: string) {
    const patients = await doctorRepository.getPatients(userId);
    return patients;
  }
}

export default new DoctorService();
