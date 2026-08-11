import { apiClient } from './client';

// ==========================================
// EXAM CONFIGURATION API
// ==========================================

export const fetchExamOptionsApi = async () => {
  return apiClient('/api/examination-new/options', { method: 'GET' });
};

export const fetchExamByIdApi = async (examId: number | string) => {
  return apiClient(`/api/examination-new/exams/${examId}`, { method: 'GET' });
};

export const saveExamDetailsApi = async (payload: {
  examId?: number | string;
  examName: string;
  assessmentType: string;
  academicTerm: string;
  startDate: string;
  endDate: string;
  applicableClasses: string[];
}) => {
  return apiClient('/api/examination-new/save-details', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const deleteExamApi = async (examId: number | string) => {
  return apiClient(`/api/examination-new/exams/${examId}`, {
    method: 'DELETE'
  });
};

export const fetchExamSubjectsApi = async (examId: number | string, className: string) => {
  return apiClient(`/api/examination-new/subjects/${examId}?className=${encodeURIComponent(className)}`, {
    method: 'GET'
  });
};

export const saveExamSubjectsApi = async (payload: {
  examId: number | string;
  className: string;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    isActive: boolean;
    maxMarks: number;
    passMarks: number;
  }>;
  proceedToSchedule?: boolean;
}) => {
  return apiClient('/api/examination-new/save-subjects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// ==========================================
// EXAM SCHEDULE / TIMETABLE API
// ==========================================

export const fetchScheduleOptionsApi = async () => {
  return apiClient('/api/examination-new/schedule/options', { method: 'GET' });
};

export const fetchScheduleTimetableApi = async (className: string, sectionName?: string, examId?: number | string) => {
  const examQuery = examId ? `examId=${encodeURIComponent(examId)}&` : '';
  const sectionQuery = sectionName ? `&sectionName=${encodeURIComponent(sectionName)}` : '';
  return apiClient(`/api/examination-new/schedule/timetable?${examQuery}className=${encodeURIComponent(className)}${sectionQuery}`, {
    method: 'GET'
  });
};

export const saveScheduleTimetableApi = async (payload: {
  examId: number | string;
  className: string;
  sectionName: string;
  timetable: Array<{
    slotId: number;
    subjectCode: string;
    subjectName: string;
    totalMarks: number;
    examDate: string;
    timeSlot: string;
    duration: string;
    roomHall: string;
    invigilatorFaculty: string;
  }>;
}) => {
  return apiClient('/api/examination-new/schedule/save-timetable', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchSchedulePreviewApi = async (academicYear: string, className: string, sectionName: string, examId?: number | string) => {
  const examQuery = examId ? `examId=${encodeURIComponent(examId)}&` : '';
  return apiClient(`/api/examination-new/schedule/preview?${examQuery}academicYear=${encodeURIComponent(academicYear)}&className=${encodeURIComponent(className)}&sectionName=${encodeURIComponent(sectionName)}`, {
    method: 'GET'
  });
};

// ==========================================
// MARKS ENTRY API
// ==========================================

export const fetchMarksEntryOptionsApi = async () => {
  return apiClient('/api/examination-new/marks-entry/options', { method: 'GET' });
};

export const fetchMarksEntryStudentsApi = async (className: string, sectionName: string, subjectCode: string) => {
  return apiClient(`/api/examination-new/marks-entry/students?className=${encodeURIComponent(className)}&sectionName=${encodeURIComponent(sectionName)}&subjectCode=${encodeURIComponent(subjectCode)}`, {
    method: 'GET'
  });
};

export const saveMarksEntryDraftApi = async (payload: {
  examId: number | string;
  className: string;
  sectionName: string;
  subjectCode: string;
  students: Array<{
    entryId: number;
    rollNo: string;
    studentName: string;
    admissionNo: string;
    attendanceStatus: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    evaluatorRemarks: string;
    status: string;
  }>;
  isFinalSubmit?: boolean;
}) => {
  return apiClient('/api/examination-new/marks-entry/save-draft', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const submitMarksEntryApi = async (payload: {
  examId: number | string;
  className: string;
  sectionName: string;
  subjectCode: string;
  students: Array<{
    entryId: number;
    rollNo: string;
    studentName: string;
    admissionNo: string;
    attendanceStatus: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    evaluatorRemarks: string;
    status: string;
  }>;
  isFinalSubmit: boolean;
}) => {
  return apiClient('/api/examination-new/marks-entry/submit-marks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// ==========================================
// RESULTS & REPORT CARDS API
// ==========================================

export const fetchResultsOptionsApi = async () => {
  return apiClient('/api/examination-new/results-reports/options', { method: 'GET' });
};

export const calculateResultsApi = async (payload: {
  examId: number | string;
  className: string;
  sectionName: string;
}) => {
  return apiClient('/api/examination-new/results-reports/calculate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchReportCardsApi = async (
  className: string,
  sectionName: string,
  resultStatus: string,
  rankOrder: string
) => {
  return apiClient(`/api/examination-new/results-reports/report-cards?className=${encodeURIComponent(className)}&sectionName=${encodeURIComponent(sectionName)}&resultStatus=${encodeURIComponent(resultStatus)}&rankOrder=${encodeURIComponent(rankOrder)}`, {
    method: 'GET'
  });
};

export const printReportCardApi = async (
  studentId: number | string,
  className: string,
  sectionName: string
) => {
  return apiClient(`/api/examination-new/results-reports/print-card/${studentId}?className=${encodeURIComponent(className)}&sectionName=${encodeURIComponent(sectionName)}`, {
    method: 'GET'
  });
};

// ==========================================
// GRADING SCALE API
// ==========================================

export const fetchGradingScaleOptionsApi = async () => {
  return apiClient('/api/examination-new/grading-scale/options', { method: 'GET' });
};

export const fetchGradingScaleRulesApi = async (examType: string) => {
  return apiClient(`/api/examination-new/grading-scale/rules?examType=${encodeURIComponent(examType)}`, {
    method: 'GET'
  });
};

export const saveGradingScaleRulesApi = async (payload: {
  examType: string;
  scaleRules: Array<{
    ruleId: number;
    grade: string;
    minMarks: number;
    maxMarks: number;
    gpa: number;
    passFail: string;
    remarks: string;
  }>;
}) => {
  return apiClient('/api/examination-new/grading-scale/save-rules', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};
