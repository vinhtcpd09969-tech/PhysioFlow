/**
 * Centralized API endpoint constants for OfficeCare.
 * All backend URLs are defined here — never hardcode URLs in components.
 */

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ─── Auth ────────────────────────────────────────────────
export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

// ─── Client (Public) ─────────────────────────────────────
export const CLIENT = {
  SERVICES: '/client/services',
  PACKAGES: '/client/packages',
  CATEGORIES: '/client/categories',
  APPOINTMENTS_PUBLIC: '/client/appointments/public',
  BOOKED_SLOTS: '/client/appointments/booked-slots',
  ACTIVE_DOCTOR_DATES: '/client/appointments/active-doctor-dates',
  MY_APPOINTMENTS: '/client/appointments/my',
} as const;

// ─── Admin ───────────────────────────────────────────────
export const ADMIN = {
  // Categories & Services
  CATEGORIES: '/admin/categories',
  SERVICES: '/admin/services',
  // Packages
  PACKAGES: '/admin/packages',
  PACKAGE_SERVICES: '/admin/package-services',
  // Staff & Customers
  STAFF: '/admin/staff',
  CUSTOMERS: '/admin/customers',
  // Rooms & Equipment
  ROOMS: '/admin/rooms',
  EQUIPMENT: '/admin/equipment',
  // Schedules
  SCHEDULES: '/admin/schedules',
  // Appointments
  APPOINTMENTS: '/admin/appointments',
  // Medical Records
  MEDICAL_RECORDS: '/admin/medical-records',
  // Finance & Vouchers
  FINANCE: '/admin/finance',
  VOUCHERS: '/admin/vouchers',
  // Feedback
  FEEDBACK: '/admin/feedback',
} as const;

// ─── Doctor ──────────────────────────────────────────────
export const DOCTOR = {
  APPOINTMENTS: '/doctor/appointments',
  SCHEDULES: '/doctor/schedules',
  MEDICAL_RECORDS: '/doctor/medical-records',
} as const;

// ─── Receptionist ────────────────────────────────────────
export const RECEPTIONIST = {
  APPOINTMENTS: '/receptionist/appointments',
  BILLING: '/receptionist/billing',
  WALK_IN: '/receptionist/walk-in',
} as const;

// ─── Technician ──────────────────────────────────────────
export const TECHNICIAN = {
  WORKSPACE: '/technician/workspace',
  TREATMENTS: '/technician/treatments',
} as const;

// ─── Customer ────────────────────────────────────────────
export const CUSTOMER = {
  PROFILE: '/customer/profile',
  APPOINTMENTS: '/customer/appointments',
  PACKAGES: '/customer/packages',
} as const;
