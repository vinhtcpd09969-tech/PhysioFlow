import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<div className="p-8"><h1>Dashboard (User)</h1></div>} />
        <Route path="/admin" element={<div className="p-8"><h1>Dashboard (Admin)</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App;
