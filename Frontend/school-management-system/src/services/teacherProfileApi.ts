import { apiClient } from '../api/client';

export interface TeacherSelfProfile {
  staffId: number;
  employeeId: string;
  fullName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  profilePhoto?: string;
  email: string;
  mobile?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  permanentAddress?: string;
  emergencyContact?: string;
  branch?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  qualification?: string;
  experience?: string;
  assignedClasses: string[];
  assignedSections: string[];
  assignedSubjects: string[];
  employmentStatus: string;
  profileStatus: string;
}

export interface UpdateMyTeacherProfilePayload {
  profilePhoto?: string;
  mobile?: string;
  address?: string;
  emergencyContact?: string;
}

export interface TeacherAssignments {
  staffId: number;
  employeeId: string;
  teacherName: string;
  classes: Array<{ classId: number; className: string; role: string }>;
  sections: Array<{ sectionId: number; sectionName: string; className: string }>;
  subjects: Array<{ subjectId: number; subjectName: string; subjectCode: string; className: string }>;
}

export const getTeacherProfileMe = async (): Promise<TeacherSelfProfile> => {
  const response = await apiClient('/api/v1/teacher/profile/me', {
    method: 'GET'
  });
  return response.data;
};

export const updateTeacherProfileMe = async (payload: UpdateMyTeacherProfilePayload): Promise<TeacherSelfProfile> => {
  const response = await apiClient('/api/v1/teacher/profile/me', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  return response.data;
};

export const getTeacherAssignmentsMe = async (academicYear?: string): Promise<TeacherAssignments> => {
  const url = academicYear 
    ? `/api/v1/teacher/profile/me/assignments?academicYear=${encodeURIComponent(academicYear)}`
    : '/api/v1/teacher/profile/me/assignments';
    
  const response = await apiClient(url, {
    method: 'GET'
  });
  return response.data;
};
