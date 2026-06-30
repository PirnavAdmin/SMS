import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const parentRole = ROLES.find((role) => role.id === 'parent');

function ParentDashboard() {
  return <DashboardPage role={parentRole} />;
}

export default ParentDashboard;
