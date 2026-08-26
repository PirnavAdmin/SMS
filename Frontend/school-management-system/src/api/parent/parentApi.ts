import { apiClient } from '../client';

export interface ParentChild {
  studentId: number;
  admissionNumber: string;
  rollNumber: string;
  studentName: string;
  firstName: string;
  lastName: string;
  classId: number;
  className: string;
  sectionId: number;
  sectionName: string;
  gender?: string;
  dateOfBirth?: string;
  profilePhoto?: string;
}

export interface ParentStudentDetails {
  studentId: number;
  admissionNumber: string;
  rollNumber: string;
  studentName: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  boardType?: string;
  studentType?: string;
  joiningDate?: string;
  casteCategory?: string;
  fatherName?: string;
  fatherMobile?: string;
  motherName?: string;
  motherMobile?: string;
  email?: string;
  mobileNumber?: string;
  address?: string;
  className: string;
  sectionName: string;
  branchName: string;
  academicYear: string;
}

export interface ParentDashboardSummary {
  studentId: number;
  studentName: string;
  className: string;
  sectionName: string;
  attendancePercentage: number;
  feeDueAmount: number;
  pendingHomeworkCount: number;
  studentInfo: ParentStudentDetails;
  upcomingEvents: Array<{ id: string; title: string; category: string; date: string; type: string }>;
  notices: Array<{ date: string; title: string; description: string; type: string }>;
}

export const getParentChildren = async (identifier?: string): Promise<ParentChild[]> => {
  const url = identifier ? `/api/parent/children?identifier=${encodeURIComponent(identifier)}` : '/api/parent/children';
  const response = await apiClient(url);
  return response?.data || response || [];
};

export const getParentDashboard = async (studentId: number): Promise<ParentDashboardSummary | null> => {
  const response = await apiClient(`/api/parent/dashboard/${studentId}`);
  return response?.data || response || null;
};

export const getParentAttendance = async (studentId: number) => {
  const response = await apiClient(`/api/parent/attendance/${studentId}`);
  return response?.data || response;
};

export const getParentTimetable = async (studentId: number) => {
  const response = await apiClient(`/api/parent/timetable/${studentId}`);
  return response?.data || response;
};

export const getParentHomework = async (studentId: number) => {
  const response = await apiClient(`/api/parent/homework/${studentId}`);
  return response?.data || response;
};

export const getParentExamResults = async (studentId: number) => {
  const response = await apiClient(`/api/parent/exam-results/${studentId}`);
  return response?.data || response;
};

export const getParentFeeDetails = async (studentId: number) => {
  const response = await apiClient(`/api/parent/fee-details/${studentId}`);
  return response?.data || response;
};

export const payParentFee = async (paymentData: {
  studentId: number;
  feeItemIds?: string[];
  amountPaid?: number;
  paymentMode?: string;
  paymentType?: string;
}) => {
  const response = await apiClient('/api/parent/pay-fee', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
  return response?.data || response;
};

export const getParentTeachers = async (studentId: number) => {
  const response = await apiClient(`/api/parent/teachers/${studentId}`);
  return response?.data || response;
};

export const getParentTransport = async (studentId: number) => {
  const response = await apiClient(`/api/parent/transport/${studentId}`);
  return response?.data || response;
};

export const getParentHostel = async (studentId: number) => {
  const response = await apiClient(`/api/parent/hostel/${studentId}`);
  return response?.data || response;
};

export const getParentEvents = async () => {
  const response = await apiClient('/api/parent/events');
  return response?.data || response;
};
