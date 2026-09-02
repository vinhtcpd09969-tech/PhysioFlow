import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '../layouts/ProtectedRoute';
import { RootRedirect } from '../layouts/RootRedirect';
import LoadingScreen from '../components/LoadingScreen';

// --- Shared Layouts (Kept synchronous to avoid unnecessary flashes/unmounts during transition) ---
import LandingLayout from '../layouts/LandingLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';

// --- Lazy Loaded Feature Pages (Implements Code Splitting for optimal initial page load) ---

// Public Feature
const Home = lazy(() => import('../features/public/pages/Home'));
const Services = lazy(() => import('../features/public/pages/Services'));
const ServiceDetailPage = lazy(() => import('../features/public/pages/ServiceDetailPage'));
const Booking = lazy(() => import('../features/public/pages/Booking'));
const Specialists = lazy(() => import('../features/public/pages/Specialists'));
const SpecialistDetailPage = lazy(() => import('../features/public/pages/SpecialistDetailPage'));
const Articles = lazy(() => import('../features/public/pages/Articles'));
const ArticleDetailPage = lazy(() => import('../features/public/pages/ArticleDetailPage'));
const AboutUs = lazy(() => import('../features/public/pages/AboutUs'));

// Auth Feature
const Login = lazy(() => import('../features/auth/pages/Login'));
const Register = lazy(() => import('../features/auth/pages/Register'));
const VerifyEmail = lazy(() => import('../features/auth/pages/VerifyEmail'));

// Customer Feature
const CustomerAppointments = lazy(() => import('../features/customer/pages/CustomerAppointments/index'));
const CustomerSettings = lazy(() => import('../features/customer/pages/CustomerSettings/index'));
const CustomerMedicalRecord = lazy(() => import('../features/customer/pages/CustomerMedicalRecord/index'));
const CustomerInvoices = lazy(() => import('../features/customer/pages/CustomerInvoices/index'));

// Admin Feature
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard'));
const ManageCustomers = lazy(() => import('../features/admin/pages/ManageCustomers'));
const ManageStaff = lazy(() => import('../features/admin/pages/ManageStaff'));
const ManageSchedules = lazy(() => import('../features/admin/pages/ManageSchedules'));
const ManageAppointments = lazy(() => import('../features/admin/pages/ManageAppointments'));
const ManageRooms = lazy(() => import('../features/admin/pages/ManageRooms'));
const RoomDetail = lazy(() => import('../features/admin/pages/ManageRooms/RoomDetail'));
const ManageEquipment = lazy(() => import('../features/admin/pages/ManageEquipment'));
const ManagePackages = lazy(() => import('../features/admin/pages/ManagePackages'));
const ManageFinance = lazy(() => import('../features/admin/pages/ManageFinance'));
const ManageVouchers = lazy(() => import('../features/admin/pages/ManageVouchers'));
const ViewFeedback = lazy(() => import('../features/admin/pages/ViewFeedback'));
const ManageArticles = lazy(() => import('../features/admin/pages/ManageArticles'));

// Receptionist Feature
const ReceptionistAppointments = lazy(() => import('../features/receptionist/pages/ReceptionistAppointments/index'));
const QuickBilling = lazy(() => import('../features/receptionist/pages/QuickBilling/index'));
const CustomerDirectory = lazy(() => import('../features/receptionist/pages/CustomerDirectory/index'));
const ReceptionistFeedback = lazy(() => import('../features/receptionist/pages/ViewFeedback/index'));

// Technician Feature
const TechnicianAppointments = lazy(() => import('../features/technician/pages/TechnicianAppointments/index'));

// Doctor / Specialist Feature
const DoctorAppointments = lazy(() => import('../features/doctor/pages/DoctorAppointments'));

// Clinical & Shared Staff Features
const ClinicalAssessment = lazy(() => import('../features/clinical/pages/ClinicalAssessment'));
const StaffMedicalRecords = lazy(() => import('../features/clinical/pages/StaffMedicalRecords'));
const StaffSchedules = lazy(() => import('../features/clinical/pages/StaffSchedules'));

export default function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    const isStaffRoute = ['/admin', '/doctor', '/receptionist', '/technician'].some(prefix =>
      location.pathname.startsWith(prefix)
    );
    if (!isStaffRoute) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [location.pathname]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<RootRedirect><Home /></RootRedirect>} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/packages/:id" element={<ServiceDetailPage />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/specialists" element={<Specialists />} />
          <Route path="/specialists/:id" element={<SpecialistDetailPage />} />
          <Route path="/tin-tuc" element={<Articles />} />
          <Route path="/tin-tuc/:slug" element={<ArticleDetailPage />} />
          <Route path="/gioi-thieu" element={<AboutUs />} />
          <Route path="/dieu-khoan-dich-vu" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route element={<ProtectedRoute allowedRoles={[1, 0]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Navigate to="/appointments" replace />} />
            <Route path="/appointments" element={<CustomerAppointments />} />
            <Route path="/medical-record" element={<CustomerMedicalRecord />} />
            <Route path="/invoices" element={<CustomerInvoices />} />
            <Route path="/packages" element={<Navigate to="/appointments" replace />} />
            <Route path="/profile" element={<Navigate to="/appointments" replace />} />
            <Route path="/settings" element={<CustomerSettings />} />
          </Route>
        </Route>

        {/* Admin & Manager Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[5, 6]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Staff Management is strictly Admin only (role 5) */}
            <Route element={<ProtectedRoute allowedRoles={[5]} />}>
              <Route path="/admin/staff" element={<ManageStaff />} />
            </Route>


            <Route path="/admin/appointments" element={<ManageAppointments />} />
            <Route path="/admin/customers" element={<ManageCustomers />} />
            <Route path="/admin/medical-records" element={<Navigate to="/admin/customers" replace />} />
            <Route path="/admin/schedules" element={<ManageSchedules />} />
            <Route path="/admin/rooms" element={<ManageRooms />} />
            <Route path="/admin/rooms/:id" element={<RoomDetail />} />
            <Route path="/admin/equipment" element={<ManageEquipment />} />
            <Route path="/admin/packages" element={<ManagePackages />} />
            <Route path="/admin/finance" element={<ManageFinance />} />
            <Route path="/admin/quick-billing" element={<QuickBilling />} />
            <Route path="/admin/marketing" element={<ManageVouchers />} />
            <Route path="/admin/articles" element={<ManageArticles />} />
            <Route path="/admin/feedback" element={<ViewFeedback />} />
            <Route path="/admin/settings" element={<CustomerSettings />} />
          </Route>
        </Route>

        {/* Receptionist Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[2, 5, 6]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/receptionist" element={<Navigate to="/receptionist/appointments" replace />} />
            <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
            <Route path="/receptionist/customers" element={<CustomerDirectory />} />
            <Route path="/receptionist/billing" element={<QuickBilling />} />
            <Route path="/receptionist/feedback" element={<ReceptionistFeedback />} />
            <Route path="/receptionist/schedules" element={<StaffSchedules />} />
            <Route path="/receptionist/settings" element={<CustomerSettings />} />
          </Route>
        </Route>

        {/* Technician Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[3, 4, 5]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/technician/appointments" element={<TechnicianAppointments />} />
            <Route path="/technician/appointments/:id/assess" element={<ClinicalAssessment />} />
            <Route path="/technician/desk" element={<ClinicalAssessment />} />
            <Route path="/technician/medical-records" element={<StaffMedicalRecords />} />
            <Route path="/technician/schedules" element={<StaffSchedules />} />
            <Route path="/technician/settings" element={<CustomerSettings />} />
          </Route>
        </Route>

        {/* Doctor Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[4]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/doctor" element={<Navigate to="/doctor/appointments" replace />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/appointments/:id/assess" element={<ClinicalAssessment />} />
            <Route path="/doctor/desk" element={<ClinicalAssessment />} />
            <Route path="/doctor/medical-records" element={<StaffMedicalRecords />} />
            <Route path="/doctor/schedules" element={<StaffSchedules />} />
            <Route path="/doctor/settings" element={<CustomerSettings />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
