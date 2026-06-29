import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const superAdminRole = ROLES.find((role) => role.id === 'super-admin');

function SuperAdminDashboard() {
  return <DashboardPage role={superAdminRole} />;
}

export default SuperAdminDashboard;
