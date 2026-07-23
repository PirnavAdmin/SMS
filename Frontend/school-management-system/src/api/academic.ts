import { apiClient } from './client';

export const fetchSubjectsApi = async () => {
  return apiClient('/api/subjects', {
    method: 'GET'
  });
};

export const fetchSubjectsDropdownApi = async () => {
  return apiClient('/api/subjects/dropdown', {
    method: 'GET'
  });
};

export const createSubjectApi = async (payload: { subjectCode: string, subjectName: string, courseCode: string }) => {
  return apiClient('/api/subjects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateSubjectApi = async (id: number, payload: { subjectCode: string, subjectName: string, courseCode: string }) => {
  return apiClient(`/api/subjects/${id}`, {
    method: 'PUT', // Swagger doesn't explicitly state PUT or PATCH, but usually updating entire entity is PUT, wait swagger has no method defined for /api/subjects/{id}, wait let me check the swagger. Oh it was /api/subjects/{id} with body. I'll use PUT by convention, maybe POST or PUT. I will just use PUT.
    body: JSON.stringify(payload)
  });
};

export const deleteSubjectApi = async (id: number) => {
  return apiClient(`/api/subjects/${id}`, {
    method: 'DELETE'
  });
};

export const fetchClassesApi = async () => {
  return apiClient('/api/classes', {
    method: 'GET'
  });
};

export const createClassApi = async (payload: any) => {
  return apiClient('/api/classes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateClassApi = async (id: number, payload: any) => {
  return apiClient(`/api/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteClassApi = async (id: number) => {
  return apiClient(`/api/classes/${id}`, {
    method: 'DELETE'
  });
};
