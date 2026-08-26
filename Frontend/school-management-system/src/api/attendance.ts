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

// ============================
// STUDENT ATTENDANCE (TEACHER PORTAL) API
// ============================

export const fetchAttendanceBranchesApi = async () => {
  return apiClient('/api/teacher/student-attendance/options/branches', { method: 'GET' });
};

export const fetchAttendanceAcademicYearsApi = async () => {
  return apiClient('/api/teacher/student-attendance/options/academic-years', { method: 'GET' });
};

export const fetchAttendanceClassesApi = async (branchId: number, academicYearId: number) => {
  return apiClient(`/api/teacher/student-attendance/options/classes?branchId=${branchId}&academicYearId=${academicYearId}`, { method: 'GET' });
};

export const fetchAttendanceSectionsApi = async (classId: number) => {
  return apiClient(`/api/teacher/student-attendance/options/sections?classId=${classId}`, { method: 'GET' });
};

export const fetchAttendanceSubjectsApi = async (classId: number, sectionId: number) => {
  return apiClient(`/api/teacher/student-attendance/options/subjects?classId=${classId}&sectionId=${sectionId}`, { method: 'GET' });
};

export const fetchAttendancePeriodsApi = async (date: string, classId: number, sectionId: number, subjectId: number) => {
  return apiClient(`/api/teacher/student-attendance/options/periods?date=${encodeURIComponent(date)}&classId=${classId}&sectionId=${sectionId}&subjectId=${subjectId}`, { method: 'GET' });
};

export const fetchStudentAttendanceSheetApi = async (query: {
  date: string;
  branchId: number;
  academicYearId: number;
  classId: number;
  sectionId: number;
  subjectId: number;
  periodId: number;
}) => {
  const params = new URLSearchParams({
    date: query.date,
    branchId: query.branchId.toString(),
    academicYearId: query.academicYearId.toString(),
    classId: query.classId.toString(),
    sectionId: query.sectionId.toString(),
    subjectId: query.subjectId.toString(),
    periodId: query.periodId.toString(),
  });
  return apiClient(`/api/teacher/student-attendance/sheet?${params.toString()}`, { method: 'GET' });
};

export const saveStudentAttendanceSheetApi = async (payload: {
  date: string;
  branchId: number;
  academicYearId: number;
  classId: number;
  sectionId: number;
  subjectId: number;
  periodId: number;
  timetableSlotId?: number | null;
  students: Array<{
    studentId: number;
    status: string;
    remarks?: string | null;
  }>;
}) => {
  return apiClient('/api/teacher/student-attendance/sheet', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const lockStudentAttendanceSheetApi = async (attendanceSessionId: number) => {
  return apiClient(`/api/teacher/student-attendance/sheet/${attendanceSessionId}/lock`, { method: 'PUT' });
};

export const unlockStudentAttendanceSheetApi = async (attendanceSessionId: number) => {
  return apiClient(`/api/teacher/student-attendance/sheet/${attendanceSessionId}/unlock`, { method: 'PUT' });
};

export const fetchStudentAttendanceRegisterApi = async (query: {
  studentId?: number;
  filterType?: string;
  month?: number;
  year?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  statusFilter?: string;
}) => {
  const params = new URLSearchParams();
  if (query.studentId) params.append('studentId', query.studentId.toString());
  if (query.filterType) params.append('filterType', query.filterType);
  if (query.month) params.append('month', query.month.toString());
  if (query.year) params.append('year', query.year.toString());
  if (query.date) params.append('date', query.date);
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  if (query.statusFilter) params.append('statusFilter', query.statusFilter);

  return apiClient(`/api/attendance/student/register?${params.toString()}`, {
    method: 'GET'
  });
};

// ============================
// TEACHER PERSONAL ATTENDANCE API
// ============================

export const fetchTeacherTodayAttendanceApi = async () => {
  return apiClient('/api/teacher/attendance/today', {
    method: 'GET'
  });
};

export const teacherCheckInApi = async (remarks?: string) => {
  return apiClient('/api/teacher/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify({ remarks: remarks || '' })
  });
};

export const teacherCheckOutApi = async (remarks?: string) => {
  return apiClient('/api/teacher/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify({ remarks: remarks || '' })
  });
};
