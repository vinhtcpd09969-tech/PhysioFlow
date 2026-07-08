import api from '../../../api/axios';

// Public Services & Packages (no login required)
export const getPublicServices = () => api.get('/client/services');
export const getPublicPackages = () => api.get('/client/packages');
export const getPublicCategories = () => api.get('/client/categories');
export const getPublicSpecialists = () => api.get('/client/specialists');
export const getPublicSpecialistById = (id: string | number) => api.get(`/client/specialists/${id}`);
export const getPublicTestimonials = () => api.get('/client/testimonials');
export const getPublicTopServices = () => api.get('/client/top-services');
