import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const hostelWardenRole = ROLES.find((role) => role.id === 'hostel-warden');

function HostelWardenDashboard() {
  return <DashboardPage role={hostelWardenRole} />;
}

export default HostelWardenDashboard;
