import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const hrRole = ROLES.find((role) => role.id === 'hr');

function HRDashboard() {
  return <DashboardPage role={hrRole} />;
}

export default HRDashboard;
