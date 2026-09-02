import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import { requireActiveShift } from '../middlewares/shiftGuard.middleware';
import {
  updateAppointmentStatus,
  createBillingFromAppointment,
  processPayment,
  calculateBilling,
  getActiveVouchers,
  applyVoucher,
  createBillingDirect,
  getPackagesForReceptionist,
  searchCustomers,
  getCustomerTreatmentPlans,
  getCustomerRoster,
  getCustomerHistory,
  getAppointmentBillingInfo,
  checkCustomerLimit,
  checkPackagePayment,
  getBillingInfoByPackage,
  createPayOSPaymentLink,
  cancelPayOSPaymentLink,
  getInvoiceStatus,
  getStaffWorkload,
  unassignAppointmentStaff,
  sweepNoShowAppointments
} from '../controllers/receptionist.controller';

const router = Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(verifyToken);

router.get('/staff-workload', authorizeRoles(2, 5, 6), getStaffWorkload);
router.post('/appointments/:id/unassign', authorizeRoles(2, 5, 6), requireActiveShift, unassignAppointmentStaff);
router.post('/appointments/sweep-noshow', authorizeRoles(2, 5, 6), requireActiveShift, sweepNoShowAppointments);

router.patch('/appointments/:id/status', authorizeRoles(2, 5, 6), requireActiveShift, updateAppointmentStatus);
router.post('/billing', authorizeRoles(2, 5, 6), createBillingFromAppointment);
router.post('/payment', authorizeRoles(2, 5, 6), requireActiveShift, processPayment);
router.post('/billing/calculate', authorizeRoles(2, 5, 6), calculateBilling);
router.get('/vouchers/active', authorizeRoles(2, 5, 6), getActiveVouchers);
router.post('/vouchers/apply', authorizeRoles(2, 5, 6), applyVoucher);
router.post('/billing/create', authorizeRoles(2, 5, 6), requireActiveShift, createBillingDirect);
router.get('/packages', authorizeRoles(2, 5, 6), getPackagesForReceptionist);
router.get('/customers/search', authorizeRoles(2, 5, 6), searchCustomers);
router.get('/customers/roster', authorizeRoles(2, 5, 6), getCustomerRoster);
router.get('/customers/:id/treatment-plans', authorizeRoles(2, 5, 6), getCustomerTreatmentPlans);
router.get('/customers/:id/history', authorizeRoles(2, 5, 6), getCustomerHistory);
router.get('/appointments/:id/billing-info', authorizeRoles(2, 5, 6), getAppointmentBillingInfo);
router.get('/customers/:id/check-limit', authorizeRoles(2, 5, 6), checkCustomerLimit);
router.get('/customers/:id/check-package-payment', authorizeRoles(2, 5, 6), checkPackagePayment);
router.get('/customers/:id/billing-info-by-package', authorizeRoles(2, 5, 6), getBillingInfoByPackage);

// PayOS integration routes
router.post('/payment/create-payos-link', authorizeRoles(2, 5, 6), createPayOSPaymentLink);
router.post('/payment/cancel-payos-link', authorizeRoles(2, 5, 6), cancelPayOSPaymentLink);
router.get('/payment/status/:id', authorizeRoles(2, 5, 6), getInvoiceStatus);

export default router;
