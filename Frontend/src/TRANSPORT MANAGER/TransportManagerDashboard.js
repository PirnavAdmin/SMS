import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const transportManagerRole = ROLES.find((role) => role.id === 'transport-manager');

function TransportManagerDashboard() {
  return <DashboardPage role={transportManagerRole} />;
}

export default TransportManagerDashboard;
