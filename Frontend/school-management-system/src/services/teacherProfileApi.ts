import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1/teacher/profile';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

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
  const response = await axios.get(`${API_BASE_URL}/me`, getAuthHeaders());
  return response.data.data;
};

export const updateTeacherProfileMe = async (payload: UpdateMyTeacherProfilePayload): Promise<TeacherSelfProfile> => {
  const response = await axios.put(`${API_BASE_URL}/me`, payload, getAuthHeaders());
  return response.data.data;
};

export const getTeacherAssignmentsMe = async (academicYear?: string): Promise<TeacherAssignments> => {
  const params = academicYear ? { academicYear } : {};
  const response = await axios.get(`${API_BASE_URL}/me/assignments`, {
    ...getAuthHeaders(),
    params,
  });
  return response.data.data;
};
