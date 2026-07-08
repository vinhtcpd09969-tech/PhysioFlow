import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../layouts/ProtectedRoute';
import LoadingScreen from '../components/LoadingScreen';

// --- Shared Layouts (Kept synchronous to avoid unnecessary flashes/unmounts during transition) ---
import LandingLayout from '../layouts/LandingLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import ReceptionistLayout from '../layouts/ReceptionistLayout';
import DoctorLayout from '../layouts/DoctorLayout';

// --- Lazy Loaded Feature Pages (Implements Code Splitting for optimal initial page load) ---

// Public Feature
const Home = lazy(() => import('../features/public/pages/Home'));
const Services = lazy(() => import('../features/public/pages/Services'));
const ServiceDetailPage = lazy(() => import('../features/public/pages/ServiceDetailPage'));
const PackageDetailPage = lazy(() => import('../features/public/pages/PackageDetailPage'));
const Booking = lazy(() => import('../features/public/pages/Booking'));
const BookingSuccess = lazy(() => import('../features/public/pages/BookingSuccess'));
const Specialists = lazy(() => import('../features/public/pages/Specialists'));
const SpecialistDetailPage = lazy(() => import('../features/public/pages/SpecialistDetailPage'));

// Auth Feature
const Login = lazy(() => import('../features/auth/pages/Login'));
const Register = lazy(() => import('../features/auth/pages/Register'));
const VerifyEmail = lazy(() => import('../features/auth/pages/VerifyEmail'));

// Customer Feature
const Dashboard = lazy(() => import('../features/customer/pages/Dashboard/index'));
const CustomerAppointments = lazy(() => import('../features/customer/pages/CustomerAppointments/index'));
const CustomerPackages = lazy(() => import('../features/customer/pages/CustomerPackages/index'));
const CustomerProfile = lazy(() => import('../features/customer/pages/CustomerProfile/index'));
const CustomerSettings = lazy(() => import('../features/customer/pages/CustomerSettings/index'));

// Admin Feature
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard'));
const ManageCustomers = lazy(() => import('../features/admin/pages/ManageCustomers'));
const ManageStaff = lazy(() => import('../features/admin/pages/ManageStaff'));
const ManageSchedules = lazy(() => import('../features/admin/pages/ManageSchedules'));
const ManageAppointments = lazy(() => import('../features/admin/pages/ManageAppointments'));
const ManageMedicalRecords = lazy(() => import('../features/admin/pages/ManageMedicalRecords'));
const ManageRooms = lazy(() => import('../features/admin/pages/ManageRooms'));
const RoomDetail = lazy(() => import('../features/admin/pages/ManageRooms/RoomDetail'));
const ManageEquipment = lazy(() => import('../features/admin/pages/ManageEquipment'));
const ManagePackages = lazy(() => import('../features/admin/pages/ManagePackages'));
const ManageFinance = lazy(() => import('../features/admin/pages/ManageFinance'));
const ManageVouchers = lazy(() => import('../features/admin/pages/ManageVouchers'));
const ViewFeedback = lazy(() => import('../features/admin/pages/ViewFeedback'));

// Receptionist Feature
const ReceptionistDashboard = lazy(() => import('../features/receptionist/pages/ReceptionistDashboard/index'));
const ReceptionistAppointments = lazy(() => import('../features/receptionist/pages/ReceptionistAppointments/index'));
const WalkInBooking = lazy(() => import('../features/receptionist/pages/WalkInBooking/index'));
const QuickBilling = lazy(() => import('../features/receptionist/pages/QuickBilling/index'));

// Technician Feature
const TechnicianAppointments = lazy(() => import('../features/technician/pages/TechnicianAppointments/index'));

// Doctor Feature
const DoctorDashboard = lazy(() => import('../features/doctor/pages/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('../features/doctor/pages/DoctorAppointments'));
const ClinicalAssessment = lazy(() => import('../features/doctor/pages/ClinicalAssessment'));
const DoctorMedicalRecords = lazy(() => import('../features/doctor/pages/DoctorMedicalRecords'));
const DoctorSchedules = lazy(() => import('../features/doctor/pages/DoctorSchedules'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/packages/:id" element={<PackageDetailPage />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/success/:id" element={<BookingSuccess />} />
          <Route path="/specialists" element={<Specialists />} />
          <Route path="/specialists/:id" element={<SpecialistDetailPage />} />
        </Route>
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[1, 0]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/appointments" element={<CustomerAppointments />} />
            <Route path="/packages" element={<CustomerPackages />} />
            <Route path="/profile" element={<CustomerProfile />} />
            <Route path="/settings" element={<CustomerSettings />} />
          </Route>
        </Route>

        {/* Admin & Manager Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[5, 6]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/appointments" element={<ManageAppointments />} />
            <Route path="/admin/customers" element={<ManageCustomers />} />
            <Route path="/admin/medical-records" element={<ManageMedicalRecords />} />
            
            {/* Staff Management is strictly Admin only (role 5) */}
            <Route element={<ProtectedRoute allowedRoles={[5]} />}>
              <Route path="/admin/staff" element={<ManageStaff />} />
            </Route>

            <Route path="/admin/schedules" element={<ManageSchedules />} />
            <Route path="/admin/rooms" element={<ManageRooms />} />
            <Route path="/admin/rooms/:id" element={<RoomDetail />} />
            <Route path="/admin/equipment" element={<ManageEquipment />} />
            <Route path="/admin/packages" element={<ManagePackages />} />
            <Route path="/admin/finance" element={<ManageFinance />} />
            <Route path="/admin/quick-billing" element={<QuickBilling />} />
            <Route path="/admin/marketing" element={<ManageVouchers />} />
            <Route path="/admin/feedback" element={<ViewFeedback />} />
          </Route>
        </Route>

        {/* Receptionist Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[2]} />}>
          <Route element={<ReceptionistLayout />}>
            <Route path="/receptionist" element={<ReceptionistDashboard />} />
            <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
            <Route path="/receptionist/walk-in" element={<WalkInBooking />} />
            <Route path="/receptionist/billing" element={<QuickBilling />} />
          </Route>
        </Route>

        {/* Technician Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[3, 4, 5]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/technician/appointments" element={<TechnicianAppointments />} />
            <Route path="/technician/appointments/:id/assess" element={<ClinicalAssessment />} />
          </Route>
        </Route>

        {/* Doctor Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[4]} />}>
          <Route element={<DoctorLayout />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/appointments/:id/assess" element={<ClinicalAssessment />} />
            <Route path="/doctor/medical-records" element={<DoctorMedicalRecords />} />
            <Route path="/doctor/schedules" element={<DoctorSchedules />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
