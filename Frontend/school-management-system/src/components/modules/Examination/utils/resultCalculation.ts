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
  gradeRules?: GradeConfig[], 
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

    if (matched && (matched.gradeName || matched.grade)) {
      return (matched.gradeName || matched.grade) as string;
    }
  }

  // Standard Auto-Grade system by marks / percentage
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  if (pct >= 35) return 'D';
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
    const config = subjectWiseConfig?.[subject] || { maxMarks: 0, passMarks: 0 };
    const maxM = m?.maxMarks || config.maxMarks || 100;
    const passM = (m?.passMarks && m.passMarks > 0) ? m.passMarks : (config.passMarks && config.passMarks > 0 ? config.passMarks : Math.round(maxM * 0.35));
    
    let obtained: number | 'AB' | 'EX' = 0;
    let isPass = true;
    let grade = '-';

    if (m) {
      hasActiveMarks = true;
      if (m.isAbsent) {
        obtained = 'AB';
        isPass = false;
        grade = '-';
        hasFail = true;
      } else {
        allAbsent = false;
        obtained = Number(m.marksObtained) || 0;
        isPass = obtained >= passM;
        if (!isPass) hasFail = true;
        
        const pct = maxM > 0 ? (obtained / maxM) * 100 : 0;
        grade = calculateGrade(pct, gradeRules, 'Percentage', examType);
        totalObtained += obtained;
      }
    } else {
      // If no marks record exists for this subject, check if marks array has active marks
      obtained = 'AB';
      isPass = false;
      grade = '-';
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
  if (!hasActiveMarks || (subjectMarks.length > 0 && subjectMarks.every(s => s.obtainedMarks === 'AB'))) {
    overallResult = 'ABSENT';
  } else if (hasFail || percentage < 35) {
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
