import clientPublicRepository from './clientPublic.repository';
import clientReviewRepository from './clientReview.repository';

export {
  clientPublicRepository,
  clientReviewRepository
};

export class ClientRepository {
  // --- TRANG CHỦ, DỊCH VỤ, CHUYÊN VIÊN & VOUCHER ---
  getTopServices = clientPublicRepository.getTopServices.bind(clientPublicRepository);
  getSpecialists = clientPublicRepository.getSpecialists.bind(clientPublicRepository);
  getSpecialistById = clientPublicRepository.getSpecialistById.bind(clientPublicRepository);
  getTestimonials = clientPublicRepository.getTestimonials.bind(clientPublicRepository);
  getActiveTreatmentPlans = clientPublicRepository.getActiveTreatmentPlans.bind(clientPublicRepository);
  agreeTerms = clientPublicRepository.agreeTerms.bind(clientPublicRepository);
  getActiveVouchers = clientPublicRepository.getActiveVouchers.bind(clientPublicRepository);

  // --- ĐÁNH GIÁ, FEEDBACK & SAO ---
  getSpecialistReviews = clientReviewRepository.getSpecialistReviews.bind(clientReviewRepository);
  getServiceReviews = clientReviewRepository.getServiceReviews.bind(clientReviewRepository);
  getPendingRatingAppointments = clientReviewRepository.getPendingRatingAppointments.bind(clientReviewRepository);
  getAppointmentForRating = clientReviewRepository.getAppointmentForRating.bind(clientReviewRepository);
  saveStaffReview = clientReviewRepository.saveStaffReview.bind(clientReviewRepository);
  saveServiceReview = clientReviewRepository.saveServiceReview.bind(clientReviewRepository);
  getMyReviews = clientReviewRepository.getMyReviews.bind(clientReviewRepository);
  updateServiceReview = clientReviewRepository.updateServiceReview.bind(clientReviewRepository);
  updateStaffReview = clientReviewRepository.updateStaffReview.bind(clientReviewRepository);
}

export default new ClientRepository();
