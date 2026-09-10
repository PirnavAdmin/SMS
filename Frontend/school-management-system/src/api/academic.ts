import { apiClient } from './client';

// ============================
// DEPARTMENTS API
// ============================

export const fetchDepartmentsApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/departments${query}`, { method: 'GET' });
};

export const fetchDepartmentsDropdownApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/departments/dropdown${query}`, { method: 'GET' });
};

export const fetchDepartmentByIdApi = async (id: number | string) => {
  return apiClient(`/api/departments/${id}`, { method: 'GET' });
};

export const fetchDepartmentSubjectsApi = async (id: number | string) => {
  return apiClient(`/api/departments/${id}/subjects`, { method: 'GET' });
};

export const createDepartmentApi = async (payload: {
  departmentName: string;
  departmentCode: string;
  description?: string;
  category?: string;
  status: string;
}) => {
  return apiClient('/api/departments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateDepartmentApi = async (id: number | string, payload: {
  departmentName: string;
  departmentCode: string;
  description?: string;
  category?: string;
  status: string;
}) => {
  return apiClient(`/api/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteDepartmentApi = async (id: number | string) => {
  return apiClient(`/api/departments/${id}`, { method: 'DELETE' });
};

// ============================
// SUBJECTS API
// ============================

export const fetchSubjectsApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/subjects${query}`, { method: 'GET' });
};

export const fetchSubjectsDropdownApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/subjects/dropdown${query}`, { method: 'GET' });
};

export const fetchSubjectByIdApi = async (id: number | string) => {
  return apiClient(`/api/subjects/${id}`, { method: 'GET' });
};

export const createSubjectApi = async (payload: {
  subjectName: string;
  courseCode: string;
  departmentId: number | string;
}) => {
  return apiClient('/api/subjects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateSubjectApi = async (id: number | string, payload: {
  subjectName: string;
  courseCode: string;
  departmentId: number | string;
}) => {
  return apiClient(`/api/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteSubjectApi = async (id: number | string) => {
  return apiClient(`/api/subjects/${id}`, { method: 'DELETE' });
};

// ============================
// CLASSES API (Existing)
// ============================

export const fetchClassesApi = async () => {
  return apiClient('/api/classes', { method: 'GET' });
};

export const fetchClassByIdApi = async (id: number | string) => {
  // If the ID is a string prefixed like "CL-10", extract the numeric part
  const numericId = typeof id === 'string' && id.startsWith('CL-') ? id.replace('CL-', '') : id;
  return apiClient(`/api/classes/${numericId}`, { method: 'GET' });
};

export const createClassApi = async (payload: any) => {
  return apiClient('/api/classes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateClassApi = async (id: number | string, payload: any) => {
  const numericId = typeof id === 'string' && id.startsWith('CL-') ? id.replace('CL-', '') : id;
  return apiClient(`/api/classes/${numericId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteClassApi = async (id: number | string) => {
  const numericId = typeof id === 'string' && id.startsWith('CL-') ? id.replace('CL-', '') : id;
  return apiClient(`/api/classes/${numericId}`, { method: 'DELETE' });
};

// ============================
// SECTIONS, SUBJECTS & TEACHERS SUB-ROUTES
// ============================

export const addSectionApi = async (classId: number | string, payload: {
  section_letter: string;
  capacity?: number;
  status?: string;
  remarks?: string;
}) => {
  const numericId = typeof classId === 'string' && classId.startsWith('CL-') ? classId.replace('CL-', '') : classId;
  return apiClient(`/api/classes/${numericId}/sections`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateSectionApi = async (
  classId: number | string,
  sectionLetter: string,
  payload: { capacity?: number; status?: string; remarks?: string; }
) => {
  const numericId = typeof classId === 'string' && classId.startsWith('CL-') ? classId.replace('CL-', '') : classId;
  const cleanSec = (sectionLetter || 'A').replace(/^Section\s*/i, '').trim();
  return apiClient(`/api/classes/${numericId}/sections/${cleanSec}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteSectionApi = async (classId: number | string, sectionLetter: string) => {
  const numericId = typeof classId === 'string' && classId.startsWith('CL-') ? classId.replace('CL-', '') : classId;
  const cleanSec = (sectionLetter || 'A').replace(/^Section\s*/i, '').trim();
  return apiClient(`/api/classes/${numericId}/sections/${cleanSec}`, { method: 'DELETE' });
};

export const mapSubjectApi = async (classId: number | string, payload: {
  subject_name: string;
  weekly_periods?: number;
}) => {
  const numericId = typeof classId === 'string' && classId.startsWith('CL-') ? classId.replace('CL-', '') : classId;
  return apiClient(`/api/classes/${numericId}/subjects`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const removeSubjectApi = async (classId: number | string, subjectId: number | string) => {
  const numericId = typeof classId === 'string' && classId.startsWith('CL-') ? classId.replace('CL-', '') : classId;
  return apiClient(`/api/classes/${numericId}/subjects/${subjectId}`, { method: 'DELETE' });
};

export const assignTeacherApi = async (
  classId: number | string,
  sectionLetter: string,
  payload: { teacher_id: string; role: string; subject_name?: string; }
) => {
  const numericId = typeof classId === 'string' && classId.startsWith('CL-') ? classId.replace('CL-', '') : classId;
  const cleanSec = (sectionLetter || 'A').replace(/^Section\s*/i, '').trim();
  return apiClient(`/api/classes/${numericId}/sections/${cleanSec}/assign-teacher`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchClassTeacherAssignmentsApi = async () => {
  return apiClient('/api/classes/teacher-assignments', { method: 'GET' });
};

export const unassignTeacherApi = async (
  classId: number | string,
  sectionLetter: string,
  subjectId: number | string
) => {
  const numericId = typeof classId === 'string' && classId.startsWith('CL-') ? classId.replace('CL-', '') : classId;
  const cleanSec = (sectionLetter || 'A').replace(/^Section\s*/i, '').trim();
  return apiClient(`/api/classes/${numericId}/sections/${cleanSec}/subjects/${subjectId}/unassign-teacher`, {
    method: 'DELETE'
  });
};



// ============================
// STUDENT ALLOCATION
// ============================

export const fetchClassStudentsApi = async (classId: number | string, section?: string) => {
  const numericId = typeof classId === 'string' && classId.startsWith('CL-') ? classId.replace('CL-', '') : classId;
  const query = section ? `?section=${encodeURIComponent(section)}` : '';
  return apiClient(`/api/classes/${numericId}/students${query}`, { method: 'GET' });
};

export const allocateStudentApi = async (studentId: string, payload: {
  section_letter: string;
  roll_no?: string;
}) => {
  return apiClient(`/api/students/${studentId}/allocate`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const autoAllocateApi = async (classId: number | string) => {
  const numericId = typeof classId === 'string' && classId.startsWith('CL-') ? classId.replace('CL-', '') : classId;
  return apiClient(`/api/classes/${numericId}/auto-allocate`, { method: 'POST' });
};

// ============================
// TIMETABLE API
// ============================

export const fetchPeriodsApi = async () => {
  return apiClient('/api/timetable/periods', { method: 'GET' });
};

export const savePeriodApi = async (payload: {
  periodId?: number;
  periodName: string;
  startTime: string;
  endTime: string;
  periodType: string;
  displayOrder: number;
}) => {
  return apiClient('/api/timetable/period', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const syncPeriodSettingsApi = async (periods: Array<{
  periodId?: number;
  periodName: string;
  startTime: string;
  endTime: string;
  periodType: string;
  displayOrder: number;
}>) => {
  return apiClient('/api/timetable/periods/sync', {
    method: 'POST',
    body: JSON.stringify(periods)
  });
};

export const deletePeriodApi = async (id: number | string) => {
  const numericId = typeof id === 'string' && id.startsWith('PS-') ? id.replace('PS-', '') : id;
  return apiClient(`/api/timetable/period/${numericId}`, { method: 'DELETE' });
};

export const fetchTimetableGridApi = async (classId: number | string, sectionId: number | string, academicYear: string) => {
  let numClassId = typeof classId === 'string' ? classId.replace(/^CL-/i, '') : String(classId);
  if (isNaN(Number(numClassId))) numClassId = '1';

  let secStr = typeof sectionId === 'string' ? sectionId.replace(/^SEC-/i, '').trim() : String(sectionId);
  const secName = secStr.replace(/^Section\s*/i, '').trim();

  let numSecId = '';
  if (!isNaN(Number(secStr))) {
    numSecId = secStr;
  }

  const secIdParam = numSecId ? `sectionId=${encodeURIComponent(numSecId)}&` : '';
  const query = `classId=${encodeURIComponent(numClassId)}&${secIdParam}sectionName=${encodeURIComponent(secName)}&section=${encodeURIComponent(secName)}&academicYear=${encodeURIComponent(academicYear)}`;
  return apiClient(`/api/timetable/class-grid?${query}`, {
    method: 'GET'
  });
};

export const saveTimetableSlotApi = async (payload: {
  classId?: number | string;
  sectionId?: number | string;
  academicYear: string;
  branchName?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectId?: number | string;
  teacherId?: number | string;
  roomNo?: string;
  periodId?: number | string;
  className?: string;
  sectionName?: string;
  subjectName?: string;
  teacherName?: string;
  overwrite?: boolean;
}) => {
  const p = { ...payload, overwrite: true, isOverwrite: true, force: true } as any;

  if (p.classId !== undefined) {
    let c = typeof p.classId === 'string' ? p.classId.replace(/^CL-/i, '') : String(p.classId);
    p.classId = isNaN(Number(c)) ? 1 : Number(c);
  }

  if (p.sectionId !== undefined) {
    let s = typeof p.sectionId === 'string' ? p.sectionId.replace(/^SEC-/i, '').trim() : String(p.sectionId);
    if (!isNaN(Number(s))) {
      p.sectionId = Number(s);
    } else {
      if (!p.sectionName) {
        p.sectionName = s.replace(/^Section\s*/i, '').trim();
      }
      delete p.sectionId;
    }
  }

  if (p.subjectId !== undefined && typeof p.subjectId === 'string') {
    const cleanSub = p.subjectId.replace(/^SUB-/i, '');
    p.subjectId = !isNaN(Number(cleanSub)) ? Number(cleanSub) : undefined;
  }
  if (p.teacherId !== undefined && typeof p.teacherId === 'string') {
    const cleanEmp = p.teacherId.replace(/^EMP-/i, '');
    p.teacherId = !isNaN(Number(cleanEmp)) ? Number(cleanEmp) : undefined;
  }
  if (p.periodId !== undefined && typeof p.periodId === 'string') {
    const cleanPs = p.periodId.replace(/^PS-/i, '');
    p.periodId = !isNaN(Number(cleanPs)) ? Number(cleanPs) : undefined;
  }

  return apiClient('/api/timetable/slot', {
    method: 'POST',
    body: JSON.stringify(p)
  });
};

export const deleteTimetableSlotApi = async (id: number | string) => {
  const numericId = typeof id === 'string' && id.startsWith('TT-') ? id.replace('TT-', '') : id;
  return apiClient(`/api/timetable/slot/${numericId}`, { method: 'DELETE' }).catch((err) => {
    if (err?.status === 404 || String(err?.message || '').includes('404')) {
      return null;
    }
    throw err;
  });
};

export const clearClassTimetableApi = async (className: string, section: string, academicYear?: string) => {
  const query = `className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}${academicYear ? `&academicYear=${encodeURIComponent(academicYear)}` : ''}`;
  return apiClient(`/api/timetable/class?${query}`, { method: 'DELETE' }).catch(() => null);
};

export const publishTimetableApi = async (payload: {
  classId?: number | string;
  className?: string;
  sectionId?: number | string;
  sectionName?: string;
  academicYear: string;
  status: string;
}) => {
  const p = { ...payload } as any;
  if (typeof p.classId === 'string') {
    const clean = p.classId.replace('CL-', '');
    p.classId = !isNaN(Number(clean)) ? Number(clean) : 0;
  }
  if (typeof p.sectionId === 'string') {
    const clean = p.sectionId.replace('SEC-', '');
    p.sectionId = !isNaN(Number(clean)) ? Number(clean) : 0;
  }
  
  return apiClient('/api/timetable/publish', {
    method: 'POST',
    body: JSON.stringify(p)
  });
};

export const copyTimetableApi = async (payload: {
  sourceClassId: number | string;
  sourceSectionId: number | string;
  targetClassId: number | string;
  targetSectionId: number | string;
  academicYear: string;
}) => {
  const p = { ...payload } as any;
  if (typeof p.sourceClassId === 'string') p.sourceClassId = Number(p.sourceClassId.replace('CL-', ''));
  if (typeof p.sourceSectionId === 'string') p.sourceSectionId = Number(p.sourceSectionId.replace('SEC-', ''));
  if (typeof p.targetClassId === 'string') p.targetClassId = Number(p.targetClassId.replace('CL-', ''));
  if (typeof p.targetSectionId === 'string') p.targetSectionId = Number(p.targetSectionId.replace('SEC-', ''));

  return apiClient('/api/timetable/copy', {
    method: 'POST',
    body: JSON.stringify(p)
  });
};

// ============================
// DESIGNATIONS API
// ============================

export const fetchDesignationsApi = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient(`/api/designations${query}`, { method: 'GET' });
};

export const createDesignationApi = async (payload: {
  designationName: string;
  employeeCategory?: string;
  status: string;
  [key: string]: any;
}) => {
  const p = { 
    designationName: payload.designationName, 
    employeeCategory: payload.employeeCategory || "Both", 
    status: payload.status 
  };
  return apiClient('/api/designations', {
    method: 'POST',
    body: JSON.stringify(p)
  });
};

export const updateDesignationApi = async (id: number | string, payload: {
  designationName: string;
  employeeCategory?: string;
  status: string;
  [key: string]: any;
}) => {
  const p = { 
    designationName: payload.designationName, 
    employeeCategory: payload.employeeCategory || "Both", 
    status: payload.status 
  };
  return apiClient(`/api/designations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(p)
  });
};

export const deleteDesignationApi = async (id: number | string) => {
  return apiClient(`/api/designations/${id}`, { method: 'DELETE' });
};

// ============================
// ACADEMIC SUBJECTS & PERIODS
// ============================

export const fetchAcademicSubjectsApi = async () => {
  return apiClient('/api/academics/subjects', { method: 'GET' });
};

export const fetchAcademicPeriodsApi = async () => {
  return apiClient('/api/academics/periods', { method: 'GET' });
};

export const fetchTimetableForClassSectionApi = async (
  classId: string | number,
  sectionName: string,
  academicYear: string
) => {
  return apiClient(
    `/api/academics/timetable?classId=${classId}&section=${encodeURIComponent(sectionName)}&academicYear=${encodeURIComponent(academicYear)}`,
    { method: 'GET' }
  );
};

export const generateTimetableApi = async (payload: any) => {
  return apiClient('/api/academics/timetable/generate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const validateTimetableApi = async (classId: number | string, sectionId: number | string, academicYear: string) => {
  return apiClient(
    `/api/academics/timetable/validate?classId=${classId}&sectionId=${sectionId}&academicYear=${encodeURIComponent(academicYear)}`,
    { method: 'POST' }
  );
};

export const fetchTeacherSubstitutionsApi = async (teacherName?: string, teacherId?: number | string) => {
  const query = teacherId ? `?teacherId=${teacherId}` : teacherName ? `?teacherName=${encodeURIComponent(teacherName)}` : '';
  return apiClient(`/api/academics/timetable/substitutions${query}`, { method: 'GET' });
};

export const fetchAllTimetablesApi = async (academicYear?: string) => {
  const query = academicYear && academicYear !== 'All' ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
  return apiClient(`/api/timetable/all${query}`, { method: 'GET' });
};


