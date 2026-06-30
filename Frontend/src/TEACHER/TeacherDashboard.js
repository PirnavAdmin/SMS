import React from 'react';
import { ROLES } from '../AuthContext';
import DashboardPage from '../DashboardPage';

const teacherRole = ROLES.find((role) => role.id === 'teacher');

function TeacherDashboard() {
  return <DashboardPage role={teacherRole} />;
}

export default TeacherDashboard;
