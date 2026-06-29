import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const hodRole = ROLES.find((role) => role.id === 'hod');

function HODDashboard() {
  return <DashboardPage role={hodRole} />;
}

export default HODDashboard;
