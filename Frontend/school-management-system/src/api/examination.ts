import { apiClient } from './client';

// ==========================================
// 1. EXAM CONFIGURATION / NEW SETUP API
// ==========================================

export const fetchExamOptionsApi = async () => {
  return apiClient('/api/examination-new/options', { method: 'GET' });
};

export const fetchExamByIdApi = async (examId: number | string) => {
  return apiClient(`/api/examination-new/exams/${examId}`, { method: 'GET' });
};

export const updateExamByIdApi = async (examId: number | string, payload: any) => {
  return apiClient(`/api/examination-new/exams/${examId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteExamApi = async (examId: number | string) => {
  return apiClient(`/api/examination-new/exams/${examId}`, {
    method: 'DELETE'
  });
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


export const fetchExamSubjectsApi = async (examId: number | string, className: string) => {
  return apiClient(`/api/examination-new/subjects/${examId}?className=${encodeURIComponent(className)}`, {
    method: 'GET'
  });
};

export const updateExamSubjectsApi = async (examId: number | string, payload: any) => {
  return apiClient(`/api/examination-new/subjects/${examId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
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
// 2. EXAM SCHEDULE & TIMETABLE API
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

export const updateScheduleTimetableApi = async (payload: any) => {
  return apiClient('/api/examination-new/schedule/timetable', {
    method: 'PUT',
    body: JSON.stringify(payload)
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

export const deleteScheduleSlotApi = async (slotId: number | string) => {
  return apiClient(`/api/examination-new/schedule/slot/${slotId}`, {
    method: 'DELETE'
  });
};

export const clearScheduleTimetableApi = async (params: { examId?: number | string; className?: string; sectionName?: string }) => {
  const q = new URLSearchParams(params as any).toString();
  return apiClient(`/api/examination-new/schedule/clear-timetable?${q}`, {
    method: 'DELETE'
  });
};

export const fetchSchedulePreviewApi = async (academicYear: string, className?: string, sectionName?: string, examId?: number | string) => {
  const examQuery = examId ? `examId=${encodeURIComponent(examId)}&` : '';
  const clsQuery = className ? `className=${encodeURIComponent(className)}&` : '';
  const secQuery = sectionName ? `sectionName=${encodeURIComponent(sectionName)}&` : '';
  return apiClient(`/api/examination-new/schedule/preview?${examQuery}${clsQuery}${secQuery}academicYear=${encodeURIComponent(academicYear)}`, {
    method: 'GET'
  });
};

// ==========================================
// 3. GRADE CONFIGURATION & SCALE RULES API
// ==========================================

export const fetchGradingScaleOptionsApi = async () => {
  return apiClient('/api/examination-new/grading-scale/options', { method: 'GET' });
};

export const fetchGradingScaleRulesApi = async (examType?: string) => {
  const query = examType ? `?examType=${encodeURIComponent(examType)}` : '';
  return apiClient(`/api/examination-new/grading-scale/rules${query}`, {
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

export const updateGradingScaleRulesApi = async (payload: any) => {
  return apiClient('/api/examination-new/grading-scale/update-rules', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteGradingScaleRuleApi = async (ruleId: number | string) => {
  return apiClient(`/api/examination-new/grading-scale/rules/${ruleId}`, {
    method: 'DELETE'
  });
};

// ==========================================
// 4. RESULTS VERIFICATION & REPORT CARDS API
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

export const updateResultsReportsApi = async (payload: any) => {
  return apiClient('/api/examination-new/results-reports/update-results', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const fetchReportCardsApi = async (
  className: string,
  sectionName: string,
  resultStatus?: string,
  rankOrder?: string
) => {
  const statusQ = resultStatus ? `&statusFilter=${encodeURIComponent(resultStatus)}` : '';
  const rankQ = rankOrder ? `&search=${encodeURIComponent(rankOrder)}` : '';
  return apiClient(`/api/examination-new/results-reports/report-cards?className=${encodeURIComponent(className)}&sectionName=${encodeURIComponent(sectionName)}${statusQ}${rankQ}`, {
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

export const clearResultsReportsApi = async (params: { examId?: number | string; className?: string; sectionName?: string }) => {
  const q = new URLSearchParams(params as any).toString();
  return apiClient(`/api/examination-new/results-reports/clear-results?${q}`, {
    method: 'DELETE'
  });
};

// ==========================================
// 5. STUDENT MARKS ENTRY API
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

export const updateMarksEntryApi = async (payload: any) => {
  return apiClient('/api/examination-new/marks-entry/update-marks', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const clearMarksEntryApi = async (params: { examId?: number | string; className?: string; sectionName?: string; subjectCode?: string }) => {
  const q = new URLSearchParams(params as any).toString();
  return apiClient(`/api/examination-new/marks-entry/clear-marks?${q}`, {
    method: 'DELETE'
  });
};
