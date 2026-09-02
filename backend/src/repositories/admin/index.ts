import adminFacilityRepository from './adminFacility.repository';
import adminStaffRepository from './adminStaff.repository';
import adminCustomerRepository from './adminCustomer.repository';
import adminFinanceRepository from './adminFinance.repository';
import adminAnalyticsRepository from './adminAnalytics.repository';
import adminArticleRepository from './adminArticle.repository';

export {
  adminFacilityRepository,
  adminStaffRepository,
  adminCustomerRepository,
  adminFinanceRepository,
  adminAnalyticsRepository,
  adminArticleRepository
};

export class AdminRepository {
  // --- PHÒNG KHÁM, THIẾT BỊ, GÓI DỊCH VỤ ---
  getRooms = adminFacilityRepository.getRooms.bind(adminFacilityRepository);
  createRoom = adminFacilityRepository.createRoom.bind(adminFacilityRepository);
  updateRoom = adminFacilityRepository.updateRoom.bind(adminFacilityRepository);
  deleteRoom = adminFacilityRepository.deleteRoom.bind(adminFacilityRepository);
  checkRoomFutureShifts = adminFacilityRepository.checkRoomFutureShifts.bind(adminFacilityRepository);

  getPackages = adminFacilityRepository.getPackages.bind(adminFacilityRepository);
  createPackage = adminFacilityRepository.createPackage.bind(adminFacilityRepository);
  updatePackage = adminFacilityRepository.updatePackage.bind(adminFacilityRepository);
  deletePackage = adminFacilityRepository.deletePackage.bind(adminFacilityRepository);

  getEquipment = adminFacilityRepository.getEquipment.bind(adminFacilityRepository);
  createEquipment = adminFacilityRepository.createEquipment.bind(adminFacilityRepository);
  updateEquipment = adminFacilityRepository.updateEquipment.bind(adminFacilityRepository);
  deleteEquipment = adminFacilityRepository.deleteEquipment.bind(adminFacilityRepository);

  // --- NHÂN SỰ & LỊCH TRỰC ---
  getStaff = adminStaffRepository.getStaff.bind(adminStaffRepository);
  findUserByEmail = adminStaffRepository.findUserByEmail.bind(adminStaffRepository);
  findUserByPhone = adminStaffRepository.findUserByPhone.bind(adminStaffRepository);
  createStaff = adminStaffRepository.createStaff.bind(adminStaffRepository);
  updateStaffStatus = adminStaffRepository.updateStaffStatus.bind(adminStaffRepository);
  updateStaffDetails = adminStaffRepository.updateStaffDetails.bind(adminStaffRepository);
  deleteStaffAvatar = adminStaffRepository.deleteStaffAvatar.bind(adminStaffRepository);
  updateStaffPassword = adminStaffRepository.updateStaffPassword.bind(adminStaffRepository);

  getSchedules = adminStaffRepository.getSchedules.bind(adminStaffRepository);
  createSchedule = adminStaffRepository.createSchedule.bind(adminStaffRepository);
  updateSchedule = adminStaffRepository.updateSchedule.bind(adminStaffRepository);
  deleteSchedule = adminStaffRepository.deleteSchedule.bind(adminStaffRepository);
  syncShiftAppointments = adminStaffRepository.syncShiftAppointments.bind(adminStaffRepository);
  getAvailableStaff = adminStaffRepository.getAvailableStaff.bind(adminStaffRepository);

  // --- KHÁCH HÀNG & HỒ SƠ ĐIỀU TRỊ (EMR) ---
  getCustomers = adminCustomerRepository.getCustomers.bind(adminCustomerRepository);
  findCustomerByEmail = adminCustomerRepository.findCustomerByEmail.bind(adminCustomerRepository);
  findCustomerByPhone = adminCustomerRepository.findCustomerByPhone.bind(adminCustomerRepository);
  updateCustomer = adminCustomerRepository.updateCustomer.bind(adminCustomerRepository);
  updateCustomerLock = adminCustomerRepository.updateCustomerLock.bind(adminCustomerRepository);
  getCustomerLockImpact = adminCustomerRepository.getCustomerLockImpact.bind(adminCustomerRepository);
  getCustomersOverview = adminCustomerRepository.getCustomersOverview.bind(adminCustomerRepository);
  getTreatmentPlansOverview = adminCustomerRepository.getTreatmentPlansOverview.bind(adminCustomerRepository);
  getCompletedSingleVisits = adminCustomerRepository.getCompletedSingleVisits.bind(adminCustomerRepository);
  getCustomerEmr = adminCustomerRepository.getCustomerEmr.bind(adminCustomerRepository);

  // --- TÀI CHÍNH, HÓA ĐƠN, HOÀN TIỀN & VOUCHERS ---
  getMedicalRecords = adminFinanceRepository.getMedicalRecords.bind(adminFinanceRepository);
  getInvoices = adminFinanceRepository.getInvoices.bind(adminFinanceRepository);
  getPayments = adminFinanceRepository.getPayments.bind(adminFinanceRepository);
  handleRefund = adminFinanceRepository.handleRefund.bind(adminFinanceRepository);
  handlePackageRefund = adminFinanceRepository.handlePackageRefund.bind(adminFinanceRepository);
  expirePackageNoRefund = adminFinanceRepository.expirePackageNoRefund.bind(adminFinanceRepository);
  sweepExpiredPackages = adminFinanceRepository.sweepExpiredPackages.bind(adminFinanceRepository);

  getVouchers = adminFinanceRepository.getVouchers.bind(adminFinanceRepository);
  getVoucherByCode = adminFinanceRepository.getVoucherByCode.bind(adminFinanceRepository);
  createVoucher = adminFinanceRepository.createVoucher.bind(adminFinanceRepository);
  updateVoucher = adminFinanceRepository.updateVoucher.bind(adminFinanceRepository);
  deleteVoucher = adminFinanceRepository.deleteVoucher.bind(adminFinanceRepository);

  // --- PHẢN HỒI, BÁO CÁO & THỐNG KÊ ---
  getFeedback = adminAnalyticsRepository.getFeedback.bind(adminAnalyticsRepository);
  replyServiceFeedback = adminAnalyticsRepository.replyServiceFeedback.bind(adminAnalyticsRepository);
  replyStaffFeedback = adminAnalyticsRepository.replyStaffFeedback.bind(adminAnalyticsRepository);
  getFeedbackReviewText = adminAnalyticsRepository.getFeedbackReviewText.bind(adminAnalyticsRepository);

  getDashboardSummary = adminAnalyticsRepository.getDashboardSummary.bind(adminAnalyticsRepository);
  getRevenueStats = adminAnalyticsRepository.getRevenueStats.bind(adminAnalyticsRepository);
  getStaffPerformance = adminAnalyticsRepository.getStaffPerformance.bind(adminAnalyticsRepository);
  getTopPackages = adminAnalyticsRepository.getTopPackages.bind(adminAnalyticsRepository);
  getTopVipCustomers = adminAnalyticsRepository.getTopVipCustomers.bind(adminAnalyticsRepository);

  // --- BÀI VIẾT & TIN TỨC CMS ---
  getArticles = adminArticleRepository.getAll.bind(adminArticleRepository);
  getArticleById = adminArticleRepository.getById.bind(adminArticleRepository);
  findArticleBySlugExcludingId = adminArticleRepository.findBySlugExcludingId.bind(adminArticleRepository);
  createArticle = adminArticleRepository.create.bind(adminArticleRepository);
  updateArticle = adminArticleRepository.update.bind(adminArticleRepository);
  deleteArticle = adminArticleRepository.delete.bind(adminArticleRepository);
  incrementArticleView = adminArticleRepository.incrementViewCount.bind(adminArticleRepository);
  getPublicArticles = adminArticleRepository.getPublicList.bind(adminArticleRepository);
  getPublicArticleBySlug = adminArticleRepository.getPublicBySlug.bind(adminArticleRepository);
}

export default new AdminRepository();
