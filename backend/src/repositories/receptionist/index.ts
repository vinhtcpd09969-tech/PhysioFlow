import receptionistQueueRepository from './receptionistQueue.repository';
import receptionistCustomerRepository from './receptionistCustomer.repository';
import receptionistBillingRepository from './receptionistBilling.repository';

export {
  receptionistQueueRepository,
  receptionistCustomerRepository,
  receptionistBillingRepository
};

export class ReceptionistRepository {
  // --- HÀNG ĐỢI & NO-SHOW ---
  sweepNoShowAppointmentsDetailed = receptionistQueueRepository.sweepNoShowAppointmentsDetailed.bind(receptionistQueueRepository);
  sweepNoShowAppointments = receptionistQueueRepository.sweepNoShowAppointments.bind(receptionistQueueRepository);
  updateAppointmentStatus = receptionistQueueRepository.updateAppointmentStatus.bind(receptionistQueueRepository);
  getStaffWorkload = receptionistQueueRepository.getStaffWorkload.bind(receptionistQueueRepository);
  unassignAppointmentStaff = receptionistQueueRepository.unassignAppointmentStaff.bind(receptionistQueueRepository);

  // --- QUẢN LÝ KHÁCH HÀNG & HỒ SƠ ---
  searchCustomers = receptionistCustomerRepository.searchCustomers.bind(receptionistCustomerRepository);
  getCustomerContactInfo = receptionistCustomerRepository.getCustomerContactInfo.bind(receptionistCustomerRepository);
  getCustomerTreatmentPlans = receptionistCustomerRepository.getCustomerTreatmentPlans.bind(receptionistCustomerRepository);
  getCustomerRoster = receptionistCustomerRepository.getCustomerRoster.bind(receptionistCustomerRepository);
  getCustomerHistory = receptionistCustomerRepository.getCustomerHistory.bind(receptionistCustomerRepository);
  getCustomerNameById = receptionistBillingRepository.getCustomerNameById.bind(receptionistBillingRepository);

  // --- HÓA ĐƠN, THANH TOÁN & VOUCHERS ---
  getAppointmentForBilling = receptionistBillingRepository.getAppointmentForBilling.bind(receptionistBillingRepository);
  createBilling = receptionistBillingRepository.createBilling.bind(receptionistBillingRepository);
  getInvoiceById = receptionistBillingRepository.getInvoiceById.bind(receptionistBillingRepository);
  getAppointmentWithServicePrice = receptionistBillingRepository.getAppointmentWithServicePrice.bind(receptionistBillingRepository);
  processPayment = receptionistBillingRepository.processPayment.bind(receptionistBillingRepository);
  markPayOSLinkCreated = receptionistBillingRepository.markPayOSLinkCreated.bind(receptionistBillingRepository);
  revertPayOSPending = receptionistBillingRepository.revertPayOSPending.bind(receptionistBillingRepository);
  sweepPendingPaymentTimeouts = receptionistBillingRepository.sweepPendingPaymentTimeouts.bind(receptionistBillingRepository);
  getPackageById = receptionistBillingRepository.getPackageById.bind(receptionistBillingRepository);
  getActivePackages = receptionistBillingRepository.getActivePackages.bind(receptionistBillingRepository);
  getServiceById = receptionistBillingRepository.getServiceById.bind(receptionistBillingRepository);
  getActiveVouchers = receptionistBillingRepository.getActiveVouchers.bind(receptionistBillingRepository);
  getVoucherByCode = receptionistBillingRepository.getVoucherByCode.bind(receptionistBillingRepository);
  countVoucherUsage = receptionistBillingRepository.countVoucherUsage.bind(receptionistBillingRepository);
  createInvoiceDirect = receptionistBillingRepository.createInvoiceDirect.bind(receptionistBillingRepository);
  processPaymentPartial = receptionistBillingRepository.processPaymentPartial.bind(receptionistBillingRepository);
  updateTreatmentPlanStatus = receptionistBillingRepository.updateTreatmentPlanStatus.bind(receptionistBillingRepository);
  getTreatmentPlanById = receptionistBillingRepository.getTreatmentPlanById.bind(receptionistBillingRepository);
  createInvoiceForTreatmentPlan = receptionistBillingRepository.createInvoiceForTreatmentPlan.bind(receptionistBillingRepository);
  getTreatmentPlanBySessionId = receptionistBillingRepository.getTreatmentPlanBySessionId.bind(receptionistBillingRepository);
  getAppointmentBillingInfo = receptionistBillingRepository.getAppointmentBillingInfo.bind(receptionistBillingRepository);
  getBillingInfoByPackage = receptionistBillingRepository.getBillingInfoByPackage.bind(receptionistBillingRepository);
  getPaidInvoiceAmountForAppointment = receptionistBillingRepository.getPaidInvoiceAmountForAppointment.bind(receptionistBillingRepository);
  getPrescriptionQuote = receptionistBillingRepository.getPrescriptionQuote.bind(receptionistBillingRepository);
  getInvoiceByUuidPrefix = receptionistBillingRepository.getInvoiceByUuidPrefix.bind(receptionistBillingRepository);
  checkPackagePayment = receptionistBillingRepository.checkPackagePayment.bind(receptionistBillingRepository);
}

export default new ReceptionistRepository();
