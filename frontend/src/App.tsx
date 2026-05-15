import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import VerifyEmail from './pages/VerifyEmail';

import LandingLayout from './layouts/LandingLayout';
import Home from './pages/Home';
import Booking from './pages/Booking';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
            
            {/* Chỉ Lễ tân (2) và Admin (4) được phép truy cập Quản lý Lịch hẹn */}
            <Route element={<ProtectedRoute allowedRoles={[2, 4]} />}>
              <Route path="/appointments" element={<Appointments />} />
            </Route>

            <Route path="/admin" element={<div className="p-8"><h1>Dashboard (Admin)</h1></div>} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
