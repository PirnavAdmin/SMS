import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const librarianRole = ROLES.find((role) => role.id === 'librarian');

function LibrarianDashboard() {
  return <DashboardPage role={librarianRole} />;
}

export default LibrarianDashboard;
