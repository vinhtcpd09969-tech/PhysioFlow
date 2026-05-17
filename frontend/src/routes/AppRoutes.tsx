import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../layouts/ProtectedRoute';

// Public Feature
import LandingLayout from '../layouts/LandingLayout';
import Home from '../features/public/pages/Home';
import Booking from '../features/public/pages/Booking';

// Auth Feature
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import VerifyEmail from '../features/auth/pages/VerifyEmail';

// Customer Feature
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../features/customer/pages/Dashboard';

// Admin Feature
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import ManageCustomers from '../features/admin/pages/ManageCustomers';
import ManageStaff from '../features/admin/pages/ManageStaff';
import ManageSchedules from '../features/admin/pages/ManageSchedules';
import ManageAppointments from '../features/admin/pages/ManageAppointments';
import ManageMedicalRecords from '../features/admin/pages/ManageMedicalRecords';
import ManageServices from '../features/admin/pages/ManageServices';
import ManageRoomsEquipment from '../features/admin/pages/ManageRoomsEquipment';
import ManagePackages from '../features/admin/pages/ManagePackages';
import ManageFinance from '../features/admin/pages/ManageFinance';
import ManageVouchers from '../features/admin/pages/ManageVouchers';
import ViewFeedback from '../features/admin/pages/ViewFeedback';
import AuditLogs from '../features/admin/pages/AuditLogs';

// Receptionist Feature
import ReceptionistLayout from '../layouts/ReceptionistLayout';
import ReceptionistDashboard from '../features/receptionist/pages/ReceptionistDashboard';
import WalkInBooking from '../features/receptionist/pages/WalkInBooking';
import QuickBilling from '../features/receptionist/pages/QuickBilling';

export default function AppRoutes() {
  return (
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
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={[5]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/appointments" element={<ManageAppointments />} />
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
    </Routes>
  );
}
