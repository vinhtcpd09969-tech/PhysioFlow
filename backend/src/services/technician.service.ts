import technicianRepository from '../repositories/technician';
import doctorRepository from '../repositories/doctor';

class TechnicianService {
  // 1. Lấy danh sách hàng đợi trị liệu hôm nay của KTV (đồng bộ cấu trúc queue với doctor.repository)
  async getQueue(userId: string) {
    return await doctorRepository.getDoctorQueue(userId, 3);
  }

  // 2. Lấy danh sách lịch hẹn của KTV
  async getAppointments(userId: string, startDate?: string, endDate?: string) {
    return await technicianRepository.getTechnicianAppointments(userId, startDate, endDate);
  }

  // 3. Lấy chi tiết lịch trị liệu
  //    confirmOvertime — KTV đã xác nhận muốn mở bàn 2 dù dự kiến xong sau giờ tan ca (cảnh báo mềm,
  //    xem checkShiftOvertime). Không truyền / false → nếu lệch giờ, ném lỗi SHIFT_OVERTIME_WARNING
  //    để frontend hỏi lại thay vì tự ý mở.
  async getAppointmentDetail(appointmentId: string, userId?: string, confirmOvertime?: boolean) {
    const detail = await technicianRepository.getAppointmentDetail(appointmentId);
    if (!detail) {
      throw new Error('Không tìm thấy chi tiết ca trị liệu.');
    }

    // Tự động chuyển trạng thái sang 'dang_kham' nếu lịch đang ở 'da_checkin'
    if (detail.trang_thai === 'da_checkin' && userId) {
      const staffId = parseInt(userId, 10);
      // A1b — KTV được mở TỐI ĐA 2 "bàn trị liệu" song song (Chuyên viên vẫn 1, xem doctor.service.ts
      // — không dùng chung guard này). Đủ 2 bàn khác rồi thì chặn cứng, không có cảnh báo mềm nào.
      const otherOpenSessions = await technicianRepository.getActiveSessionForStaff(staffId, appointmentId);
      if (otherOpenSessions.length >= 2) {
        const names = otherOpenSessions.map((s: any) => `${s.ma_lich_dat} (${s.ten_khach_hang})`).join(', ');
        const err = new Error(`Bạn đang mở tối đa 2 bàn trị liệu cùng lúc (${names}). Vui lòng hoàn thành bớt trước khi mở bàn mới.`) as any;
        err.statusCode = 400;
        err.activeSessionId = otherOpenSessions[0].id;
        throw err;
      }

      // Đang mở bàn THỨ 2 (đã có đúng 1 bàn khác chạy) — cảnh báo mềm nếu ước tính xong sau giờ tan
      // ca, KHÔNG chặn cứng: KTV tự quyết định có nhận thêm hay không (xem kế hoạch mục "hai loại rảnh").
      if (otherOpenSessions.length === 1) {
        const overtimeInfo = await this.checkShiftOvertime(staffId, Number(detail.thoi_luong_phut) || 30);
        if (overtimeInfo) {
          if (!confirmOvertime) {
            const err = new Error(
              `Ca này dự kiến xong lúc ${overtimeInfo.estimateFinish}, sau giờ tan ca của bạn (${overtimeInfo.shiftEnd}). Bạn vẫn muốn mở bàn 2?`
            ) as any;
            err.statusCode = 400;
            err.errorCode = 'SHIFT_OVERTIME_WARNING';
            throw err;
          }
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          await technicianRepository.appendGhiChuNoiBo(
            appointmentId,
            `[${timeStr}] Mở bàn trị liệu thứ 2 ngoài giờ ca (KTV xác nhận, tan ca ${overtimeInfo.shiftEnd}).`
          );
        }
      }

      await technicianRepository.startSession(appointmentId, staffId);
      return await technicianRepository.getAppointmentDetail(appointmentId);
    }

    return detail;
  }

  // Trả về thông tin lệch giờ nếu mở ca này khiến KTV dự kiến xong SAU giờ tan ca hôm nay — null nếu
  // ổn hoặc không có ca trực nào bao trùm hiện tại (không suy đoán khi thiếu dữ liệu ca trực).
  private async checkShiftOvertime(
    staffId: number,
    thoiLuongPhut: number
  ): Promise<{ shiftEnd: string; estimateFinish: string } | null> {
    const shiftEnd = await technicianRepository.getCurrentShiftEndForStaff(staffId);
    if (!shiftEnd) return null;

    const now = new Date();
    const estimateFinishDate = new Date(now.getTime() + thoiLuongPhut * 60000);
    const [eh, em] = shiftEnd.split(':').map(Number);
    const shiftEndToday = new Date(now);
    shiftEndToday.setHours(eh, em, 0, 0);
    if (estimateFinishDate <= shiftEndToday) return null;

    const estimateFinish = `${String(estimateFinishDate.getHours()).padStart(2, '0')}:${String(estimateFinishDate.getMinutes()).padStart(2, '0')}`;
    return { shiftEnd, estimateFinish };
  }

  // 4. Lưu kết quả lượng giá buổi trị liệu, nhật ký thao tác và ghi chú
  async saveTreatmentRecord(
    userId: string,
    data: {
      lich_dat_id: string;
      vas_truoc: number;
      vas_sau: number;
      ghi_chu?: string | null;
      du_lieu_tri_lieu?: any;
    }
  ) {
    return await technicianRepository.saveTreatmentRecord({
      lich_dat_id: data.lich_dat_id,
      ktv_id: userId,
      vas_truoc: data.vas_truoc,
      vas_sau: data.vas_sau,
      ghi_chu: data.ghi_chu,
      du_lieu_tri_lieu: data.du_lieu_tri_lieu
    });
  }

  // 4b. Lưu nháp — xem chú thích đầy đủ ở technician.repository.ts::saveTreatmentDraft
  async saveTreatmentDraft(
    userId: string,
    data: {
      lich_dat_id: string;
      vas_truoc?: number | null;
      vas_sau?: number | null;
      ghi_chu?: string | null;
      du_lieu_tri_lieu?: any;
    }
  ) {
    return await technicianRepository.saveTreatmentDraft({
      lich_dat_id: data.lich_dat_id,
      ktv_id: userId,
      vas_truoc: data.vas_truoc,
      vas_sau: data.vas_sau,
      ghi_chu: data.ghi_chu,
      du_lieu_tri_lieu: data.du_lieu_tri_lieu,
    });
  }

  // 5. Lấy danh sách lịch trực của KTV
  async getSchedules(userId: string) {
    return await technicianRepository.getTechnicianSchedules(userId);
  }

  // 6. Lấy ca trị liệu đang chạy dở của KTV (nếu có)
  async getActiveSession(userId: string) {
    const staffId = parseInt(userId, 10);
    return await technicianRepository.getActiveSessionForStaff(staffId, null);
  }

  // 7. Lấy thông tin phòng trực & thiết bị y tế có sẵn tại phòng của nhân sự
  async getWorkstationInfo(userId: string, appointmentId?: string | null) {
    const staffId = parseInt(userId, 10);
    return await technicianRepository.getRoomAndEquipmentForStaff(staffId, appointmentId);
  }
}

export default new TechnicianService();
