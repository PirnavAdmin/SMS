import { apiClient } from './client';

// ============================
// STUDENTS API  (/api/v1/students)
// ============================

export const fetchStudentsApi = async (filter?: {
  search?: string;
  classId?: number;
  sectionId?: number;
  status?: string;
  academicYear?: string;
  page?: number;
  pageSize?: number;
}) => {
  const params = new URLSearchParams();
  if (filter?.search) params.append('search', filter.search);
  if (filter?.classId) params.append('classId', String(filter.classId));
  if (filter?.sectionId) params.append('sectionId', String(filter.sectionId));
  if (filter?.status) params.append('status', filter.status);
  if (filter?.academicYear) params.append('academicYear', filter.academicYear);
  if (filter?.page) params.append('page', String(filter.page));
  if (filter?.pageSize) params.append('pageSize', String(filter.pageSize));
  const query = params.toString();
  return apiClient(`/api/v1/students${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const fetchStudentByIdApi = async (id: number | string) => {
  return apiClient(`/api/v1/students/${id}`, { method: 'GET' });
};

export const createStudentApi = async (payload: any) => {
  return apiClient('/api/v1/students', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateStudentApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/v1/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const updateStudentStatusApi = async (id: number | string, payload: { status: string }) => {
  return apiClient(`/api/v1/students/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
};

export const deleteStudentApi = async (id: number | string) => {
  return apiClient(`/api/v1/students/${id}`, { method: 'DELETE' });
};

// ============================
// STUDENT DROPDOWNS
// ============================

export const fetchStudentAcademicYearsDropdownApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/v1/students/dropdowns/academic-years${query}`, { method: 'GET' });
};

export const fetchStudentClassesDropdownApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/v1/students/dropdowns/classes${query}`, { method: 'GET' });
};

export const fetchStudentSectionsDropdownApi = async (classId: number, search?: string) => {
  const params = new URLSearchParams({ classId: String(classId) });
  if (search) params.append('search', search);
  return apiClient(`/api/v1/students/dropdowns/sections?${params.toString()}`, { method: 'GET' });
};
