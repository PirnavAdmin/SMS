import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const adminRole = ROLES.find((role) => role.id === 'admin');

function AdminDashboard() {
  return <DashboardPage role={adminRole} />;
}

export default AdminDashboard;
