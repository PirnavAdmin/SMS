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

export function calculateGrade(percentage: number, gradeRules: GradeConfig[]): string {
  if (gradeRules && gradeRules.length > 0) {
    const matched = gradeRules.find(
      r => percentage >= (r.minMark ?? 0) && percentage <= (r.maxMark ?? 100)
    );
    if (matched) return matched.grade || (matched as any).gradeName || 'A';
  }
  // Fallbacks
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
}

export function calculateGpa(percentage: number, gradeRules: GradeConfig[]): number {
  if (gradeRules && gradeRules.length > 0) {
    const matched = gradeRules.find(
      r => percentage >= (r.minMark ?? 0) && percentage <= (r.maxMark ?? 100)
    );
    if (matched) return matched.gradePoint ?? (matched as any).gradePoints ?? 0;
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
  subjectWiseConfig?: Record<string, { maxMarks: number; passMarks: number }>
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
        grade = calculateGrade(pct, gradeRules);
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
  const overallGrade = calculateGrade(percentage, gradeRules);
  const gpa = calculateGpa(percentage, gradeRules);

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
