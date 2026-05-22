import { Router } from 'express';
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
  getSessionServices
} from '../controllers/receptionist.controller';

const router = Router();

router.get('/today-appointments', getTodayAppointments);
router.get('/dashboard', getDashboardData);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.get('/stats', getReceptionistStats);
router.post('/walk-in', handleWalkInBooking);
router.post('/billing', createBillingFromAppointment);
router.post('/payment', processPayment);

router.post('/billing/calculate', calculateBilling);
router.post('/billing/create', createBillingDirect);
router.post('/sessions/:id/services', updateSessionServices);
router.get('/sessions/:id/services', getSessionServices);

export default router;
