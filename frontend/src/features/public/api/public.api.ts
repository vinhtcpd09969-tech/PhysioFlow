import api from '../../../api/axios';

// Public Services & Packages (no login required)
export const getPublicServices = () => api.get('/client/services');
export const getPublicPackages = () => api.get('/client/packages');
export const getPublicSpecialists = () => api.get('/client/specialists');
export const getPublicSpecialistById = (id: string | number) => api.get(`/client/specialists/${id}`);
export const getPublicTestimonials = () => api.get('/client/testimonials');
export const getPublicTopServices = () => api.get('/client/top-services');
export const getPublicSpecialistReviews = (id: string | number) => api.get(`/client/specialists/${id}/reviews`);
export const getPublicServiceReviews = (id: string | number) => api.get(`/client/services/${id}/reviews`);

// Public Articles (Blog)
export const getPublicArticles = (danhMuc?: string) =>
  api.get('/client/articles', { params: danhMuc ? { danh_muc: danhMuc } : undefined });
export const getPublicArticleBySlug = (slug: string) => api.get(`/client/articles/${slug}`);
