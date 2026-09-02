import doctorQueueRepository from './doctorQueue.repository';
import doctorTreatmentPlanRepository from './doctorTreatmentPlan.repository';
import doctorRecordsRepository from './doctorRecords.repository';
import doctorAssessmentRepository from './doctorAssessment.repository';

export {
  doctorQueueRepository,
  doctorTreatmentPlanRepository,
  doctorRecordsRepository,
  doctorAssessmentRepository
};

export class DoctorRepository {
  // --- HÀNG ĐỢI & ĐIỀU PHỐI KHÁM ---
  getDoctorQueue = doctorQueueRepository.getDoctorQueue.bind(doctorQueueRepository);
  getDoctorAppointments = doctorQueueRepository.getDoctorAppointments.bind(doctorQueueRepository);
  callInPatient = doctorQueueRepository.callInPatient.bind(doctorQueueRepository);
  markPatientAbsent = doctorQueueRepository.markPatientAbsent.bind(doctorQueueRepository);
  getActiveSessionForStaff = doctorQueueRepository.getActiveSessionForStaff.bind(doctorQueueRepository);
  startSession = doctorQueueRepository.startSession.bind(doctorQueueRepository);

  // --- PHÁC ĐỒ & GÓI LIỆU TRÌNH ---
  isPackageLieuTrinh = doctorTreatmentPlanRepository.isPackageLieuTrinh.bind(doctorTreatmentPlanRepository);
  getBlockingLieuTrinh = doctorTreatmentPlanRepository.getBlockingLieuTrinh.bind(doctorTreatmentPlanRepository);
  deletePendingChiDinh = doctorTreatmentPlanRepository.deletePendingChiDinh.bind(doctorTreatmentPlanRepository);
  getBlockedPackagesForAppointment = doctorTreatmentPlanRepository.getBlockedPackagesForAppointment.bind(doctorTreatmentPlanRepository);

  // --- HỒ SƠ BỆNH ÁN & LỊCH SỬ ĐIỀU TRỊ ---
  getPatientHistory = doctorRecordsRepository.getPatientHistory.bind(doctorRecordsRepository);
  getPatientTreatments = doctorRecordsRepository.getPatientTreatments.bind(doctorRecordsRepository);
  getStandaloneServiceVisits = doctorRecordsRepository.getStandaloneServiceVisits.bind(doctorRecordsRepository);
  getTreatmentSessions = doctorRecordsRepository.getTreatmentSessions.bind(doctorRecordsRepository);
  getDoctorSchedules = doctorRecordsRepository.getDoctorSchedules.bind(doctorRecordsRepository);
  getPatients = doctorRecordsRepository.getPatients.bind(doctorRecordsRepository);
  getPatientInfoById = doctorRecordsRepository.getPatientInfoById.bind(doctorRecordsRepository);

  // --- LƯỢNG GIÁ LÂM SÀNG (ROM, MMT, VAS) & CHUYỂN TUYẾN ---
  saveClinicalAssessment = doctorAssessmentRepository.saveClinicalAssessment.bind(doctorAssessmentRepository);
  getAppointmentDetail = doctorAssessmentRepository.getAppointmentDetail.bind(doctorAssessmentRepository);
  saveAssessmentDraft = doctorAssessmentRepository.saveAssessmentDraft.bind(doctorAssessmentRepository);
}

export default new DoctorRepository();
