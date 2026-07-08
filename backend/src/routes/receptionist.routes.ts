import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import { resendConfirmationEmail } from '../controllers/appointment.controller';
import {
  getTodayAppointments,
  getDashboardData,
  updateAppointmentStatus,
  getReceptionistStats,
  handleWalkInBooking,
  createBillingFromAppointment,
  processPayment,
  calculateBilling,
  createBillingDirect,
  updateSessionServices,
  getSessionServices,
  getPackagesForReceptionist,
  getCompletedConsultations,
  getAutoVouchers,
  confirmTreatmentPlan,
  searchCustomers,
  getCustomerTreatmentPlans,
  getAppointmentBillingInfo
} from '../controllers/receptionist.controller';

const router = Router();

// Tất cả các route của Lễ tân đều yêu cầu đăng nhập và có vai trò Lễ tân (2) hoặc Admin (5)
router.use(verifyToken);
router.use(authorizeRoles(2, 5));

router.get('/today-appointments', getTodayAppointments);
router.get('/dashboard', getDashboardData);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.post('/appointments/:id/resend-email', resendConfirmationEmail);
router.get('/stats', getReceptionistStats);
router.post('/walk-in', handleWalkInBooking);
router.post('/billing', createBillingFromAppointment);
router.post('/payment', processPayment);
router.post('/treatment-plans/confirm', confirmTreatmentPlan);
router.post('/billing/calculate', calculateBilling);
router.post('/billing/create', createBillingDirect);
router.post('/sessions/:id/services', updateSessionServices);
router.get('/sessions/:id/services', getSessionServices);
router.get('/packages', getPackagesForReceptionist);
router.get('/completed-consultations', getCompletedConsultations);
router.get('/auto-vouchers', getAutoVouchers);
router.get('/customers/search', searchCustomers);
router.get('/customers/:id/treatment-plans', getCustomerTreatmentPlans);
router.get('/appointments/:id/billing-info', getAppointmentBillingInfo);

export default router;
