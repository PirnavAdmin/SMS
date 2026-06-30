import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AccountantDashboard from './ACCOUNTANT/AccountantDashboard';
import AdminDashboard from './ADMIN/AdminDashboard';
import HODDashboard from './HOD/HODDashboard';
import HostelWardenDashboard from './HOSTEL WARDEN/HostelWardenDashboard';
import HRDashboard from './HR/HRDashboard';
import LibrarianDashboard from './LIBRARIAN/LibrarianDashboard';
import Login from './Login';
import ParentDashboard from './PARENT/ParentDashboard';
import PrincipalDashboard from './PRINCIPAL/PrincipalDashboard';
import ProtectedRoute from './ProtectedRoute';
import StudentDashboard from './STUDENT/StudentDashboard';
import SuperAdminDashboard from './SUPER ADMIN/SuperAdminDashboard';
import TeacherDashboard from './TEACHER/TeacherDashboard';
import TransportManagerDashboard from './TRANSPORT MANAGER/TransportManagerDashboard';
import Unauthorized from './Unauthorized';
import { AuthProvider, useAuth } from './AuthContext';

function LoginRoute() {
  const { user, roles } = useAuth();
  const role = roles.find((item) => item.id === user?.role);

  return role ? <Navigate to={role.route} replace /> : <Login />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        path="/super-admin-dashboard"
        element={
          <ProtectedRoute allowedRole="super-admin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/principal-dashboard"
        element={
          <ProtectedRoute allowedRole="principal">
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod-dashboard"
        element={
          <ProtectedRoute allowedRole="hod">
            <HODDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent-dashboard"
        element={
          <ProtectedRoute allowedRole="parent">
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accountant-dashboard"
        element={
          <ProtectedRoute allowedRole="accountant">
            <AccountantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian-dashboard"
        element={
          <ProtectedRoute allowedRole="librarian">
            <LibrarianDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr-dashboard"
        element={
          <ProtectedRoute allowedRole="hr">
            <HRDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transport-dashboard"
        element={
          <ProtectedRoute allowedRole="transport-manager">
            <TransportManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hostel-dashboard"
        element={
          <ProtectedRoute allowedRole="hostel-warden">
            <HostelWardenDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
