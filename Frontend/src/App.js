import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import Unauthorized from './Unauthorized';
import { AuthProvider, useAuth } from './AuthContext';

const AccountantDashboard = React.lazy(() => import('./ACCOUNTANT/AccountantDashboard'));
const AdminDashboard = React.lazy(() => import('./ADMIN/AdminDashboard'));
const HODDashboard = React.lazy(() => import('./HOD/HODDashboard'));
const HostelWardenDashboard = React.lazy(() => import('./HOSTEL WARDEN/HostelWardenDashboard'));
const HRDashboard = React.lazy(() => import('./HR/HRDashboard'));
const LibrarianDashboard = React.lazy(() => import('./LIBRARIAN/LibrarianDashboard'));
const ParentDashboard = React.lazy(() => import('./PARENT/ParentDashboard'));
const PrincipalDashboard = React.lazy(() => import('./PRINCIPAL/PrincipalDashboard'));
const StudentDashboard = React.lazy(() => import('./STUDENT/StudentDashboard'));
const SuperAdminDashboard = React.lazy(() => import('./SUPER ADMIN/SuperAdminDashboard'));
const TeacherDashboard = React.lazy(() => import('./TEACHER/TeacherDashboard'));
const TransportManagerDashboard = React.lazy(() => import('./TRANSPORT MANAGER/TransportManagerDashboard'));

function LoadingScreen() {
  return (
    <main className="auth-screen">
      <section className="login-panel unauthorized-panel">
        <span className="auth-kicker">School Management System</span>
        <h1>Loading...</h1>
      </section>
    </main>
  );
}

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
        <Suspense fallback={<LoadingScreen />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
