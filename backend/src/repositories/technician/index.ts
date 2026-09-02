import technicianQueueRepository from './technicianQueue.repository';
import technicianRecordRepository from './technicianRecord.repository';

export {
  technicianQueueRepository,
  technicianRecordRepository
};

export class TechnicianRepository {
  // --- HÀNG ĐỢI & PHIÊN LÀM VIỆC KTV ---
  getTechnicianQueue = technicianQueueRepository.getTechnicianQueue.bind(technicianQueueRepository);
  getTechnicianAppointments = technicianQueueRepository.getTechnicianAppointments.bind(technicianQueueRepository);
  getActiveSessionForStaff = technicianQueueRepository.getActiveSessionForStaff.bind(technicianQueueRepository);
  getCurrentShiftEndForStaff = technicianQueueRepository.getCurrentShiftEndForStaff.bind(technicianQueueRepository);
  appendGhiChuNoiBo = technicianQueueRepository.appendGhiChuNoiBo.bind(technicianQueueRepository);
  startSession = technicianQueueRepository.startSession.bind(technicianQueueRepository);
  getTechnicianSchedules = technicianQueueRepository.getTechnicianSchedules.bind(technicianQueueRepository);
  getRoomAndEquipmentForStaff = technicianQueueRepository.getRoomAndEquipmentForStaff.bind(technicianQueueRepository);

  // --- HỒ SƠ ĐIỀU TRỊ & VAS TRỊ LIỆU ---
  getAppointmentDetail = technicianRecordRepository.getAppointmentDetail.bind(technicianRecordRepository);
  saveTreatmentRecord = technicianRecordRepository.saveTreatmentRecord.bind(technicianRecordRepository);
  saveTreatmentDraft = technicianRecordRepository.saveTreatmentDraft.bind(technicianRecordRepository);
}

export default new TechnicianRepository();
