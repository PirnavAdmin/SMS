import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const accountantRole = ROLES.find((role) => role.id === 'accountant');

function AccountantDashboard() {
  return <DashboardPage role={accountantRole} />;
}

export default AccountantDashboard;
