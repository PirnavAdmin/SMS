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
    const normalize = (s: string) => (s || '').toLowerCase().replace(/[\s\/\-_]+/g, '');
    const normTarget = examType ? normalize(examType) : '';

    // 1. Try exact or normalized assessment / scheme match
    let targetRules = normTarget
      ? gradeRules.filter(r => 
          (r.examType && normalize(r.examType) === normTarget) ||
          (r.schemeName && normalize(r.schemeName) === normTarget)
        )
      : [];

    // 2. Try 'All' or general default rules
    if (targetRules.length === 0) {
      targetRules = gradeRules.filter(r => !r.examType || r.examType === 'All' || !r.schemeName || r.schemeName === 'Default Scholastic');
    }

    // 3. If still empty, use all configured grade rules
    if (targetRules.length === 0) {
      targetRules = gradeRules;
    }

    if (targetRules.length > 0) {
      const sorted = [...targetRules].sort((a, b) => (Number(b.minPercent ?? b.minMark ?? 0)) - (Number(a.minPercent ?? a.minMark ?? 0)));
      const matched = sorted.find(r => {
        const isMarksMode = mode === 'Marks' || r.gradingType === 'Marks';
        const min = isMarksMode ? Number(r.minMark ?? r.minPercent ?? 0) : Number(r.minPercent ?? r.minMark ?? 0);
        const max = isMarksMode ? Number(r.maxMark ?? r.maxPercent ?? 100) : Number(r.maxPercent ?? r.maxMark ?? 100);
        return value >= min && value <= max;
      });

      if (matched && (matched.gradeName || matched.grade)) {
        return String(matched.gradeName || matched.grade).trim();
      }
    }
  }

  // No hardcoded grading if no rules exist or match
  return '—';
}

export function calculateGpa(
  percentage: number, 
  gradeRules: GradeConfig[],
  examType?: string
): number {
  if (gradeRules && gradeRules.length > 0) {
    const normalize = (s: string) => (s || '').toLowerCase().replace(/[\s\/\-_]+/g, '');
    const normTarget = examType ? normalize(examType) : '';

    let targetRules = normTarget
      ? gradeRules.filter(r => 
          (r.examType && normalize(r.examType) === normTarget) ||
          (r.schemeName && normalize(r.schemeName) === normTarget)
        )
      : [];

    if (targetRules.length === 0) {
      targetRules = gradeRules.filter(r => !r.examType || r.examType === 'All');
    }

    if (targetRules.length === 0) {
      targetRules = gradeRules;
    }

    const matched = targetRules.find(r => {
      const min = Number(r.minPercent ?? r.minMark ?? 0);
      const max = Number(r.maxPercent ?? r.maxMark ?? 100);
      return percentage >= min && percentage <= max;
    });
    if (matched) return Number(matched.gradePoints ?? matched.gradePoint ?? 0);
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
    const trimmedSub = (subject || '').trim();
    const m = marks.find(mark => (mark.subject || '').trim().toLowerCase() === trimmedSub.toLowerCase());
    const config = subjectWiseConfig?.[trimmedSub] || subjectWiseConfig?.[trimmedSub.toLowerCase()] || subjectWiseConfig?.['default'] || { maxMarks: 0, passMarks: 0 };
    const maxM = Number(m?.maxMarks || (m as any)?.totalMarks || config.maxMarks || 0) || 100;
    const passM = (m?.passMarks && m.passMarks > 0) ? m.passMarks : (config.passMarks && config.passMarks > 0 ? config.passMarks : Math.round(maxM * 0.35));
    
    let obtained: number | 'AB' | 'EX' = 0;
    let isPass = true;
    let grade = '—';

    if (m) {
      hasActiveMarks = true;
      if (m.isAbsent || (m.marksObtained as any) === 'AB' || String((m as any).attendanceStatus).toLowerCase() === 'absent') {
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
        grade = (m.grade && m.grade !== '-' && m.grade !== '—' && m.grade !== '') 
          ? m.grade 
          : calculateGrade(pct, gradeRules, 'Percentage', examType);
        totalObtained += obtained;
      }
    } else {
      // If no marks record exists for this subject
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
