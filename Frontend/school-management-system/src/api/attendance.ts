import { apiClient } from './client';

// ============================
// STAFF ATTENDANCE API
// ============================

export const fetchDailyStaffAttendanceApi = async (date: string, department?: string) => {
  const deptParam = department && department !== 'All' ? `&department=${encodeURIComponent(department)}` : '';
  return apiClient(`/api/staff/attendance?date=${encodeURIComponent(date)}${deptParam}`, {
    method: 'GET'
  });
};

export const fetchMonthlyStaffAttendanceApi = async (month: number, year: number, department?: string) => {
  const deptParam = department && department !== 'All' ? `&department=${encodeURIComponent(department)}` : '';
  return apiClient(`/api/staff/attendance/monthly?month=${month}&year=${year}${deptParam}`, {
    method: 'GET'
  });
};

export const markBulkStaffAttendanceApi = async (payload: {
  date: string;
  academicYear: string;
  branch: string;
  department?: string;
  records: Array<{
    staffId: number;
    status: string;
    remarks?: string;
    inTime?: string;
    outTime?: string;
  }>;
}) => {
  return apiClient('/api/staff/attendance/bulk', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};
