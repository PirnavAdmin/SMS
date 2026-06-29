import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const principalRole = ROLES.find((role) => role.id === 'principal');

function PrincipalDashboard() {
  return <DashboardPage role={principalRole} />;
}

export default PrincipalDashboard;
