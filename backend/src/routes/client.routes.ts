import { Router } from 'express';
import {
  createPublicAppointment,
  getCustomerAppointments,
  cancelCustomerAppointment,
  rescheduleCustomerAppointment,
  getBuoiAvailability,
  getActiveDoctorDates,
  getPublicAppointmentById,
  getCustomerMedicalRecord,
  getCustomerTreatmentSessions,
  getCustomerInvoices
} from '../controllers/appointment.controller';
import {
  getServices,
  getPackages,
  getTopServices,
  getSpecialists,
  getSpecialistById,
  getSpecialistReviews,
  getServiceReviews,
  getTestimonials,
  getPublicArticles,
  getPublicArticleBySlug,
  getTreatmentPlans,
  getPendingRatingAppointments,
  rateAppointment,
  getMyReviews,
  updateServiceReview,
  updateStaffReview,
  agreeTerms,
  getTtsProxy,
  getActiveVouchers,
  applyClientVoucher,
  createPayosPaymentLink,
  getPayosPaymentStatus
} from '../controllers/client.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Appointments - Public
router.post('/appointments/public', createPublicAppointment);
router.get('/appointments/public/track/:id', getPublicAppointmentById);
router.get('/appointments/buoi-availability', getBuoiAvailability);
router.get('/appointments/active-doctor-dates', getActiveDoctorDates);

// Services & Packages - Public
router.get('/services', getServices);
router.get('/packages', getPackages);
router.get('/top-services', getTopServices);
router.get('/services/:id/reviews', getServiceReviews);

// Specialists - Public
router.get('/specialists', getSpecialists);
router.get('/specialists/:id', getSpecialistById);
router.get('/specialists/:id/reviews', getSpecialistReviews);

// Testimonials & Articles - Public
router.get('/testimonials', getTestimonials);
router.get('/articles', getPublicArticles);
router.get('/articles/:slug', getPublicArticleBySlug);

// Vouchers & Payments - Public
router.get('/vouchers/active', getActiveVouchers);
router.post('/vouchers/apply', applyClientVoucher);
router.post('/payment/create-payos-link', createPayosPaymentLink);
router.get('/payment/status/:orderCode', getPayosPaymentStatus);
router.get('/tts', getTtsProxy);

// Appointments & Treatment - Customer (Authenticated)
router.get('/appointments', verifyToken, getCustomerAppointments);
router.patch('/appointments/:id/cancel', verifyToken, cancelCustomerAppointment);
router.patch('/appointments/:id/reschedule', verifyToken, rescheduleCustomerAppointment);
router.get('/treatment-plans', verifyToken, getTreatmentPlans);
router.get('/medical-record', verifyToken, getCustomerMedicalRecord);
router.get('/treatment-sessions', verifyToken, getCustomerTreatmentSessions);
router.get('/invoices', verifyToken, getCustomerInvoices);
router.post('/agree-terms', verifyToken, agreeTerms);

// Reviews & Ratings - Customer (Authenticated)
router.get('/appointments/pending-rating', verifyToken, getPendingRatingAppointments);
router.post('/appointments/:id/rate', verifyToken, rateAppointment);
router.get('/reviews/my-reviews', verifyToken, getMyReviews);
router.put('/reviews/service/:id', verifyToken, updateServiceReview);
router.put('/reviews/staff/:id', verifyToken, updateStaffReview);

export default router;
