import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const studentRole = ROLES.find((role) => role.id === 'student');

function StudentDashboard() {
  return <DashboardPage role={studentRole} />;
}

export default StudentDashboard;
