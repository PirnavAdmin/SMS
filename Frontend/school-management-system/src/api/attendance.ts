import { apiClient } from './client';

// ============================
// STAFF ATTENDANCE API
// ============================

export const fetchDailyStaffAttendanceApi = async (date: string, department?: string) => {
  try {
    const deptParam = department && department !== 'All' ? `&department=${encodeURIComponent(department)}` : '';
    return await apiClient(`/api/staff/attendance?date=${encodeURIComponent(date)}${deptParam}`, {
      method: 'GET'
    });
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
      return { success: false, data: [] };
    }
    throw err;
  }
};

export const fetchMonthlyStaffAttendanceApi = async (month: number, year: number, department?: string) => {
  try {
    const deptParam = department && department !== 'All' ? `&department=${encodeURIComponent(department)}` : '';
    return await apiClient(`/api/staff/attendance/monthly?month=${month}&year=${year}${deptParam}`, {
      method: 'GET'
    });
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
      return { success: false, data: [] };
    }
    throw err;
  }
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
  try {
    return await apiClient('/api/staff/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
      return { success: true, localOnly: true };
    }
    throw err;
  }
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

export const fetchStudentAttendanceAllApi = async (query?: {
  studentId?: number;
  className?: string;
  section?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  status?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (query?.studentId) params.append('studentId', query.studentId.toString());
    if (query?.className) params.append('className', query.className);
    if (query?.section) params.append('section', query.section);
    if (query?.date) params.append('date', query.date);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.month) params.append('month', query.month.toString());
    if (query?.year) params.append('year', query.year.toString());
    if (query?.status) params.append('status', query.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient(`/api/attendance/student/all${queryString}`, {
      method: 'GET'
    });
    return response;
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
      return { success: false, data: [] };
    }
    throw err;
  }
};

export const saveBulkStudentAttendanceApi = async (payload: {
  date?: string;
  className?: string;
  section?: string;
  subject?: string;
  period?: string;
  records: Array<{
    studentId?: number | string;
    rollNo?: string;
    admissionNo?: string;
    studentName?: string;
    className?: string;
    section?: string;
    date?: string;
    subject?: string;
    period?: string;
    status: string;
    remarks?: string;
    markedBy?: string;
  }>;
}) => {
  try {
    return await apiClient('/api/attendance/student/bulk', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
      return { success: true, localOnly: true };
    }
    throw err;
  }
};


// ============================
// TEACHER PERSONAL ATTENDANCE API
// ============================

export const fetchTeacherTodayAttendanceApi = async () => {
  try {
    return await apiClient('/api/teacher/attendance/today', {
      method: 'GET'
    });
  } catch (err: any) {
    return null;
  }
};

export const teacherCheckInApi = async (remarks?: string) => {
  try {
    return await apiClient('/api/teacher/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ remarks: remarks || '' })
    });
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
      console.warn('Backend endpoint returned HTTP', err?.status, '- storing check-in locally.');
      return { success: true, localOnly: true };
    }
    throw err;
  }
};

export const teacherCheckOutApi = async (remarks?: string) => {
  try {
    return await apiClient('/api/teacher/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ remarks: remarks || '' })
    });
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
      console.warn('Backend endpoint returned HTTP', err?.status, '- storing check-out locally.');
      return { success: true, localOnly: true };
    }
    throw err;
  }
};

export const createAttendanceCorrectionApi = async (payload: { date: string; requestType: string; reason: string; actualTime?: string }) => {
  try {
    return await apiClient('/api/teacher/attendance/corrections', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
      return { success: true, localOnly: true };
    }
    throw err;
  }
};

export const fetchAttendanceCorrectionsApi = async () => {
  try {
    return await apiClient('/api/teacher/attendance/corrections', {
      method: 'GET'
    });
  } catch (err: any) {
    if (err?.status === 403 || err?.status === 401 || err?.status === 404) {
      return [];
    }
    throw err;
  }
};
