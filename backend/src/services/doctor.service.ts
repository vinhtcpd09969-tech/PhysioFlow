import doctorRepository from '../repositories/doctor';
import appointmentRepository from '../repositories/appointments';

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

  // 2b. Gọi bệnh nhân vào phòng (B2/B19)
  async callInPatient(cuocHenId: string, userId: string, roleId: number) {
    return doctorRepository.callInPatient(cuocHenId, userId, roleId);
  }

  // 2c. Đánh dấu không có mặt (B11) — lần 2 mới thật sự chuyển "không đến", giao đúng cho
  // appointmentRepository.updateAppointmentStatus xử lý (phạt uy tín/trừ buổi gói), không chép lại.
  async markPatientAbsent(cuocHenId: string, userId: string, roleId: number) {
    const result = await doctorRepository.markPatientAbsent(cuocHenId, userId, roleId);
    if (result.shouldFinalize) {
      await appointmentRepository.updateAppointmentStatus(cuocHenId, { trang_thai: 'khong_den' }, roleId);
    }
    return result;
  }

  // 3. Tổng hợp hồ sơ y tế toàn diện của bệnh nhân: 2 danh sách TÁCH BIỆT — visits (khám lâm sàng +
  // dịch vụ lẻ độc lập, gộp chung 1 dòng thời gian) và treatmentPlans (chỉ phác đồ/liệu trình thật,
  // mỗi phác đồ kèm sessions + liên kết ngược về đúng ca khám đã chỉ định ra nó). Trộn lẫn dịch vụ lẻ
  // vào treatmentPlans như bản cũ gây rối mắt cho Bác sĩ/KTV khi xem — đã tách theo góp ý người dùng.
  async getPatientMedicalProfile(patientId: string) {
    if (!patientId) {
      return { patient: null, visits: [], treatmentPlans: [] };
    }

    const patient = await doctorRepository.getPatientInfoById(patientId);
    if (!patient) {
      return { patient: null, visits: [], treatmentPlans: [] };
    }

    const realPatientId = patient.id;

    const [medicalRecords, rawTreatments, standaloneVisits] = await Promise.all([
      doctorRepository.getPatientHistory(realPatientId).catch(() => []),
      doctorRepository.getPatientTreatments(realPatientId).catch(() => []),
      doctorRepository.getStandaloneServiceVisits(realPatientId).catch(() => []),
    ]);

    const treatmentPlans = await Promise.all(
      (rawTreatments || []).map(async (treatment: any) => ({
        ...treatment,
        sessions: treatment?.id ? await doctorRepository.getTreatmentSessions(treatment.id).catch(() => []) : [],
      }))
    );

    // Map ca khám -> phác đồ mà nó đã chỉ định ra (nếu có và đã được kích hoạt), để visits phía dưới
    // gắn được prescribed_plan_id cho đúng banner liên kết "Ca khám này đã chỉ định phác đồ...".
    const planByOriginExamId = new Map<string, any>();
    for (const plan of treatmentPlans) {
      if (plan.goc_kham_id) planByOriginExamId.set(plan.goc_kham_id, plan);
    }

    const examVisits = medicalRecords.map((r: any) => ({
      id: r.lich_dat_id,
      loai: 'KHAM' as const,
      thoi_gian: r.thoi_gian_tao,
      ma_lich_dat: r.ma_lich_dat,
      trang_thai: r.trang_thai || 'hoan_thanh',
      chan_doan: r.chan_doan,
      chong_chi_dinh: r.chong_chi_dinh,
      ly_do_kham: r.ly_do_kham,
      anh_dinh_kem_url: r.anh_dinh_kem_url,
      ghi_chu: r.ghi_chu,
      khuyen_nghi_goi: r.khuyen_nghi_goi,
      vas_truoc: r.vas_truoc,
      du_lieu_luong_gia: r.du_lieu_luong_gia,
      du_lieu_tri_lieu: r.du_lieu_tri_lieu,
      ten_nhan_su: r.ten_bac_si,
      anh_nhan_su: r.anh_bac_si,
      prescribed_plan_id: planByOriginExamId.get(r.lich_dat_id)?.id || null,
    }));

    const serviceVisits = standaloneVisits.map((v: any) => ({
      id: v.id,
      loai: 'DICH_VU_LE' as const,
      thoi_gian: v.thoi_gian_tao,
      ma_lich_dat: v.ma_lich_dat,
      trang_thai: v.trang_thai,
      ten_dich_vu: v.ten_dich_vu,
      ghi_chu: v.ghi_chu,
      vas_truoc: v.vas_truoc,
      vas_sau: v.vas_sau,
      du_lieu_tri_lieu: v.du_lieu_tri_lieu,
      ten_nhan_su: v.ten_nhan_su,
      anh_nhan_su: v.anh_nhan_su,
      prescribed_plan_id: null,
    }));

    const visits = [...examVisits, ...serviceVisits].sort((a, b) => {
      const timeA = a.thoi_gian ? new Date(a.thoi_gian).getTime() : 0;
      const timeB = b.thoi_gian ? new Date(b.thoi_gian).getTime() : 0;
      return timeB - timeA;
    });

    // Gói/dịch vụ gần nhất lên đầu — frontend mặc định chọn phần tử đầu tiên trong dải chip.
    treatmentPlans.sort((a: any, b: any) => {
      const timeA = a.thoi_gian_tao ? new Date(a.thoi_gian_tao).getTime() : 0;
      const timeB = b.thoi_gian_tao ? new Date(b.thoi_gian_tao).getTime() : 0;
      return timeB - timeA;
    });

    return {
      patient,
      visits,
      treatmentPlans,
    };
  }

  // 4. Lấy thông tin chi tiết một ca khám cụ thể
  async getAppointmentDetail(appointmentId: string, userId?: string) {
    let detail = await doctorRepository.getAppointmentDetail(appointmentId);
    if (!detail) {
      throw new Error('Không tìm thấy chi tiết ca khám.');
    }

    // A8b — buổi Lượng giá (KHAM) là con đường DUY NHẤT đưa khách ra khỏi trung tâm (chuyên viên có
    // thể "Chuyển tuyến" cho khách đi luôn), nên PHẢI thu tiền xong trước khi cho bắt đầu — chặn cứng
    // ở đây, không chỉ cảnh báo UI. Không áp cho DIEU_TRI/DICH_VU_LE (khách không có đường thất thoát,
    // xem "Thời điểm thanh toán" trong kế hoạch). trang_thai_thanh_toan do processPayment ghi (Lễ tân
    // thu quầy hoặc webhook PayOS) — nguồn ghi duy nhất, xem receptionist.repository.ts::processPayment.
    if (detail.trang_thai === 'da_checkin' && detail.loai === 'KHAM' && detail.trang_thai_thanh_toan !== 'da_thanh_toan') {
      const err: any = new Error('Buổi Lượng giá này chưa thanh toán — vui lòng nhờ Lễ tân thu tiền trước khi bắt đầu.');
      err.errorCode = 'PAYMENT_REQUIRED';
      throw err;
    }

    // Tự động chuyển trạng thái sang 'dang_kham' nếu lịch đang ở 'da_checkin'
    if (detail.trang_thai === 'da_checkin' && userId) {
      const staffId = parseInt(userId, 10);
      // 1 bác sĩ chỉ được mở 1 "bàn khám" tại 1 thời điểm — chặn nếu còn ca khác đang dang_kham
      // (vd quên bấm hoàn thành ca trước).
      const otherOpenSession = await doctorRepository.getActiveSessionForStaff(staffId, appointmentId);
      if (otherOpenSession) {
        const errorMsg = `Bạn đang có ca khám ${otherOpenSession.ma_lich_dat} (${otherOpenSession.ten_khach_hang}) chưa hoàn thành. Vui lòng hoàn thành ca đó trước khi mở ca khám mới.`;
        const err = new Error(errorMsg) as any;
        err.activeSessionId = otherOpenSession.id;
        throw err;
      }
      await doctorRepository.startSession(appointmentId, staffId);
      detail = await doctorRepository.getAppointmentDetail(appointmentId);
    }

    return { ...detail, package_conflict: null };
  }

  // 5. Lưu chẩn đoán lâm sàng và hoàn thành ca khám
  async saveAssessment(
    userId: string,
    data: {
      lich_dat_id: string;
      chan_doan: string;
      chong_chi_dinh: string;
      goi_dich_vu_id?: string | null;
      goi_dich_vu_ids?: string[] | null;
      ghi_chu?: string | null;
      resolvePendingConflict?: boolean;
      is_reassessment?: boolean;
      han_tai_kham?: string | null;
      vas_score?: number | null;
      rom_data?: any[] | null;
      mmt_data?: any[] | null;
    }
  ) {
    const rawGoiIds = data.goi_dich_vu_ids || (data.goi_dich_vu_id ? [data.goi_dich_vu_id] : []);
    const validGoiIds = Array.from(new Set(rawGoiIds.filter(Boolean)));

    if (validGoiIds.length > 0) {
      const blockedPackages = await doctorRepository.getBlockedPackagesForAppointment(data.lich_dat_id);

      for (const gid of validGoiIds) {
        const isLieuTrinh = await doctorRepository.isPackageLieuTrinh(gid);
        if (!isLieuTrinh) {
          throw new Error('Chuyên viên chỉ được chỉ định gói liệu trình, không được chỉ định dịch vụ lẻ.');
        }

        const blocked = blockedPackages.find((b: any) => String(b.goi_dich_vu_id) === String(gid));
        if (blocked) {
          if (blocked.reason_type === 'dang_dieu_tri') {
            throw new Error(`Khách hàng đang điều trị gói "${blocked.ten_goi}" (chưa hoàn thành). Không thể chỉ định trùng gói này. Chuyên viên có thể chọn gói khác để dùng kèm.`);
          } else {
            throw new Error(`Khách hàng đã được chỉ định gói "${blocked.ten_goi}" ở ca trước (chưa thanh toán). Không thể chỉ định trùng gói này. Chuyên viên có thể chọn gói khác để dùng kèm.`);
          }
        }
      }
    }

    const result = await doctorRepository.saveClinicalAssessment({
      lich_dat_id: data.lich_dat_id,
      bac_si_id: userId,
      chan_doan: data.chan_doan,
      chong_chi_dinh: data.chong_chi_dinh,
      goi_dich_vu_id: validGoiIds[0] || data.goi_dich_vu_id,
      goi_dich_vu_ids: validGoiIds,
      ghi_chu: data.ghi_chu,
      is_reassessment: data.is_reassessment,
      han_tai_kham: data.han_tai_kham,
      vas_score: data.vas_score,
      rom_data: data.rom_data,
      mmt_data: data.mmt_data,
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

  // 8. Lấy ca khám đang chạy dở của bác sĩ (nếu có)
  async getActiveSession(userId: string) {
    const staffId = parseInt(userId, 10);
    return await doctorRepository.getActiveSessionForStaff(staffId, null);
  }

  // 9. Lưu NHÁP thông tin lượng giá (không đổi trang_thai, không kết thúc ca)
  async saveAssessmentDraft(
    userId: string,
    data: {
      lich_dat_id: string;
      chan_doan?: string;
      chong_chi_dinh?: string;
      ghi_chu?: string;
      vas_score?: number;
      rom_data?: any[];
      mmt_data?: any[];
      selected_package_id?: string;
      selected_package_ids?: string[];
    }
  ) {
    return await doctorRepository.saveAssessmentDraft({
      lich_dat_id: data.lich_dat_id,
      bac_si_id: userId,
      chan_doan: data.chan_doan,
      chong_chi_dinh: data.chong_chi_dinh,
      ghi_chu: data.ghi_chu,
      vas_score: data.vas_score,
      rom_data: data.rom_data,
      mmt_data: data.mmt_data,
      selected_package_id: data.selected_package_id,
      selected_package_ids: data.selected_package_ids,
    });
  }
}

export default new DoctorService();
