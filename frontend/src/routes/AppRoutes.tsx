import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../layouts/ProtectedRoute';
import LoadingScreen from '../components/LoadingScreen';

// --- Shared Layouts (Kept synchronous to avoid unnecessary flashes/unmounts during transition) ---
import LandingLayout from '../layouts/LandingLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import ReceptionistLayout from '../layouts/ReceptionistLayout';

// --- Lazy Loaded Feature Pages (Implements Code Splitting for optimal initial page load) ---

// Public Feature
const Home = lazy(() => import('../features/public/pages/Home'));
const Booking = lazy(() => import('../features/public/pages/Booking'));

// Auth Feature
const Login = lazy(() => import('../features/auth/pages/Login'));
const Register = lazy(() => import('../features/auth/pages/Register'));
const VerifyEmail = lazy(() => import('../features/auth/pages/VerifyEmail'));

// Customer Feature
const Dashboard = lazy(() => import('../features/customer/pages/Dashboard'));
const CustomerAppointments = lazy(() => import('../features/customer/pages/CustomerAppointments'));
const CustomerPackages = lazy(() => import('../features/customer/pages/CustomerPackages'));
const CustomerProfile = lazy(() => import('../features/customer/pages/CustomerProfile'));
const CustomerExercises = lazy(() => import('../features/customer/pages/CustomerExercises'));
const CustomerSettings = lazy(() => import('../features/customer/pages/CustomerSettings'));

// Admin Feature
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard'));
const ManageCustomers = lazy(() => import('../features/admin/pages/ManageCustomers'));
const ManageStaff = lazy(() => import('../features/admin/pages/ManageStaff'));
const ManageSchedules = lazy(() => import('../features/admin/pages/ManageSchedules'));
const ManageAppointments = lazy(() => import('../features/admin/pages/ManageAppointments'));
const ManageTreatments = lazy(() => import('../features/admin/pages/ManageTreatments'));
const ManageMedicalRecords = lazy(() => import('../features/admin/pages/ManageMedicalRecords'));
const ManageServices = lazy(() => import('../features/admin/pages/ManageServices'));
const ManageRoomsEquipment = lazy(() => import('../features/admin/pages/ManageRoomsEquipment'));
const ManagePackages = lazy(() => import('../features/admin/pages/ManagePackages'));
const ManageFinance = lazy(() => import('../features/admin/pages/ManageFinance'));
const ManageVouchers = lazy(() => import('../features/admin/pages/ManageVouchers'));
const ViewFeedback = lazy(() => import('../features/admin/pages/ViewFeedback'));
const AuditLogs = lazy(() => import('../features/admin/pages/AuditLogs'));

// Receptionist Feature
const ReceptionistDashboard = lazy(() => import('../features/receptionist/pages/ReceptionistDashboard'));
const WalkInBooking = lazy(() => import('../features/receptionist/pages/WalkInBooking'));
const QuickBilling = lazy(() => import('../features/receptionist/pages/QuickBilling'));

// Technician Feature
const TechnicianWorkspace = lazy(() => import('../features/technician/pages/TechnicianWorkspace'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
        </Route>
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/appointments" element={<CustomerAppointments />} />
            <Route path="/packages" element={<CustomerPackages />} />
            <Route path="/profile" element={<CustomerProfile />} />
            <Route path="/exercises" element={<CustomerExercises />} />
            <Route path="/settings" element={<CustomerSettings />} />
          </Route>
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[5]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/appointments" element={<ManageAppointments />} />
            <Route path="/admin/treatments" element={<ManageTreatments />} />
            <Route path="/admin/customers" element={<ManageCustomers />} />
            <Route path="/admin/medical-records" element={<ManageMedicalRecords />} />
            <Route path="/admin/staff" element={<ManageStaff />} />
            <Route path="/admin/schedules" element={<ManageSchedules />} />
            <Route path="/admin/services" element={<ManageServices />} />
            <Route path="/admin/rooms-equipment" element={<ManageRoomsEquipment />} />
            <Route path="/admin/packages" element={<ManagePackages />} />
            <Route path="/admin/finance" element={<ManageFinance />} />
            <Route path="/admin/marketing" element={<ManageVouchers />} />
            <Route path="/admin/feedback" element={<ViewFeedback />} />
            <Route path="/admin/audit" element={<AuditLogs />} />
          </Route>
        </Route>

        {/* Receptionist Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[2]} />}>
          <Route element={<ReceptionistLayout />}>
            <Route path="/receptionist" element={<ReceptionistDashboard />} />
            <Route path="/receptionist/appointments" element={<ManageAppointments />} />
            <Route path="/receptionist/walk-in" element={<WalkInBooking />} />
            <Route path="/receptionist/billing" element={<QuickBilling />} />
          </Route>
        </Route>

        {/* Technician Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[3, 5]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/technician/workspace" element={<TechnicianWorkspace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
