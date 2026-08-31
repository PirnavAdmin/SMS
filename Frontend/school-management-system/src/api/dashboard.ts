import { apiClient } from './client';

export interface DashboardSummaryResponse {
  totalStudents: number;
  teachingStaff: number;
  nonTeachingStaff: number;
  totalClasses: number;

  totalAdmissions: number;
  pendingAdmissions: number;
  enrolledAdmissions: number;
  rejectedAdmissions: number;
  otherAdmissions: number;

  studentAttendance: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    total: number;
    presentPct: number;
  };

  staffAttendance: {
    present: number;
    absent: number;
    late: number;
    halfDay?: number;
    total: number;
    presentPct: number;
  };

  classWiseStrength: Array<{
    className: string;
    studentCount: number;
  }>;
}

export const fetchDashboardSummaryApi = async (
  branch?: string,
  academicYearId?: number
): Promise<{ success: boolean; data: DashboardSummaryResponse }> => {
  const params = new URLSearchParams();
  if (branch && branch !== 'All Branches') {
    params.append('branch', branch);
  }
  if (academicYearId) {
    params.append('academicYearId', academicYearId.toString());
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiClient(`/api/dashboard/summary${queryString}`, {
    method: 'GET',
  });
};
