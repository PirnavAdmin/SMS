import { ExamMark, GradeConfig } from '../../../../types';

export interface CalculatedSubjectMarks {
  subject: string;
  obtainedMarks: number | 'AB' | 'EX';
  maxMarks: number;
  passMarks: number;
  grade: string;
  isPass: boolean;
}

export interface CalculatedResult {
  totalObtained: number;
  totalMax: number;
  percentage: number;
  overallGrade: string;
  gpa: number;
  overallResult: 'PASS' | 'FAIL' | 'ABSENT' | 'EXEMPTED';
  subjectMarks: CalculatedSubjectMarks[];
}

export function calculateGrade(
  value: number, 
  gradeRules: GradeConfig[], 
  mode: 'Percentage' | 'Marks' = 'Percentage',
  examType?: string
): string {
  if (gradeRules && gradeRules.length > 0) {
    // Filter by examType if specified
    const applicableRules = examType
      ? gradeRules.filter(r => !r.examType || r.examType === 'All' || r.examType === examType)
      : gradeRules;

    const targetRules = applicableRules.length > 0 ? applicableRules : gradeRules;

    const matched = targetRules.find(r => {
      const isMarksMode = mode === 'Marks' || r.gradingType === 'Marks';
      const min = isMarksMode ? (r.minMark ?? r.minPercent ?? 0) : (r.minPercent ?? r.minMark ?? 0);
      const max = isMarksMode ? (r.maxMark ?? r.maxPercent ?? 100) : (r.maxPercent ?? r.maxMark ?? 100);
      return value >= min && value <= max;
    });

    if (matched) return matched.gradeName || matched.grade || 'A';
  }

  // Fallbacks based on percentage
  if (value >= 90) return 'A+';
  if (value >= 80) return 'A';
  if (value >= 70) return 'B';
  if (value >= 60) return 'C';
  if (value >= 33) return 'D';
  return 'F';
}

export function calculateGpa(
  percentage: number, 
  gradeRules: GradeConfig[],
  examType?: string
): number {
  if (gradeRules && gradeRules.length > 0) {
    const applicableRules = examType
      ? gradeRules.filter(r => !r.examType || r.examType === 'All' || r.examType === examType)
      : gradeRules;

    const targetRules = applicableRules.length > 0 ? applicableRules : gradeRules;

    const matched = targetRules.find(r => {
      const min = r.minPercent ?? r.minMark ?? 0;
      const max = r.maxPercent ?? r.maxMark ?? 100;
      return percentage >= min && percentage <= max;
    });
    if (matched) return matched.gradePoints ?? matched.gradePoint ?? 0;
  }

  if (percentage >= 90) return 10;
  if (percentage >= 80) return 9;
  if (percentage >= 70) return 8;
  if (percentage >= 60) return 7;
  if (percentage >= 33) return 6;
  return 0;
}

export function calculateStudentResult(
  marks: ExamMark[],
  subjectsList: string[],
  gradeRules: GradeConfig[],
  subjectWiseConfig?: Record<string, { maxMarks: number; passMarks: number }>,
  examType?: string
): CalculatedResult {
  const subjectMarks: CalculatedSubjectMarks[] = [];
  let totalObtained = 0;
  let totalMax = 0;
  let hasFail = false;
  let allAbsent = marks.length > 0;
  let hasActiveMarks = false;

  subjectsList.forEach(subject => {
    const m = marks.find(mark => mark.subject === subject);
    const config = subjectWiseConfig?.[subject] || { maxMarks: 100, passMarks: 35 };
    const maxM = m?.maxMarks || config.maxMarks || 100;
    const passM = m?.passMarks || config.passMarks || 35;
    
    let obtained: number | 'AB' | 'EX' = 0;
    let isPass = true;
    let grade = 'F';

    if (m) {
      hasActiveMarks = true;
      if (m.isAbsent) {
        obtained = 'AB';
        isPass = false;
        grade = 'F';
      } else {
        allAbsent = false;
        obtained = m.marksObtained;
        isPass = obtained >= passM;
        if (!isPass) hasFail = true;
        
        const pct = maxM > 0 ? (obtained / maxM) * 100 : 0;
        grade = calculateGrade(pct, gradeRules, 'Percentage', examType);
        totalObtained += obtained;
      }
    } else {
      obtained = 'AB';
      isPass = false;
      grade = 'F';
    }

    totalMax += maxM;
    subjectMarks.push({
      subject,
      obtainedMarks: obtained,
      maxMarks: maxM,
      passMarks: passM,
      grade,
      isPass
    });
  });

  const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const overallGrade = calculateGrade(percentage, gradeRules, 'Percentage', examType);
  const gpa = calculateGpa(percentage, gradeRules, examType);

  let overallResult: CalculatedResult['overallResult'] = 'PASS';
  if (!hasActiveMarks || allAbsent) {
    overallResult = 'ABSENT';
  } else if (hasFail) {
    overallResult = 'FAIL';
  }

  return {
    totalObtained,
    totalMax,
    percentage,
    overallGrade,
    gpa,
    overallResult,
    subjectMarks
  };
}
