import { useData } from '../../../../context/DataContext';
import { ProcessedResult, Student, GradeConfig } from '../../../../types';
import { calculateStudentResult } from '../utils/resultCalculation';
import { calculateCompetitionRanks } from '../utils/ranking';

export function useResults() {
  const {
    processedResults = [],
    saveProcessedResults = () => { },
    updateResultStatus = () => { },
    examMarks = [],
    gradeConfigurations = [],
    exams = []
  } = useData();

  const getResultsForExamClass = (examId: string, className: string, section: string) => {
    const cleanSec = (section || '').replace('Section ', '').trim().toUpperCase();
    const rawMatches = (processedResults || []).filter(r => {
      if (!r) return false;
      const matchExam = !examId || examId === 'all' || !r.examId || r.examId === 'all' ||
        String(r.examId) === String(examId) ||
        (Number(r.examId) > 0 && Number(r.examId) === Number(examId)) ||
        (String(r.examId).includes(String(examId)) || String(examId).includes(String(r.examId)));
      const matchClass = !className || className === 'all' || r.className === className;
      if (!matchExam || !matchClass) return false;
      if (!section || section === 'All') return true;
      const rSec = (r.section || '').replace('Section ', '').trim().toUpperCase();
      return rSec === cleanSec || r.section === section;
    });

    const studentMap = new Map<string, ProcessedResult>();
    for (const r of rawMatches) {
      const nameKey = (r.studentName || `${(r as any).firstName || ''} ${(r as any).lastName || ''}`).toLowerCase().trim().replace(/\s+/g, ' ');
      const admKey = (r.admissionNo || (r as any).admissionNumber || '').toLowerCase().trim();
      const rollKey = (r.rollNo || (r as any).rollNumber || '').toLowerCase().trim();
      const studentKey = nameKey || admKey || rollKey || String(r.studentId || r.id || '').trim().toLowerCase();
      if (!studentKey) continue;

      const existing = studentMap.get(studentKey);
      if (!existing) {
        studentMap.set(studentKey, r);
      } else {
        const rMax = r.totalMaxMarks || 0;
        const exMax = existing.totalMaxMarks || 0;
        const rSubjCount = Array.isArray(r.subjectMarks) ? r.subjectMarks.length : 0;
        const exSubjCount = Array.isArray(existing.subjectMarks) ? existing.subjectMarks.length : 0;

        if (rMax > exMax || (rMax === exMax && rSubjCount > exSubjCount) || (rMax === exMax && (r.totalObtainedMarks || 0) > (existing.totalObtainedMarks || 0))) {
          studentMap.set(studentKey, r);
        }
      }
    }

    const dedupedList = Array.from(studentMap.values());

    // Re-calculate ranks cleanly for deduplicated roster
    const sortedByScore = [...dedupedList].sort((a, b) => {
      const pctA = a.percentage ?? (a.totalMaxMarks ? (a.totalObtainedMarks / a.totalMaxMarks) * 100 : 0);
      const pctB = b.percentage ?? (b.totalMaxMarks ? (b.totalObtainedMarks / b.totalMaxMarks) * 100 : 0);
      if (pctB !== pctA) return pctB - pctA;
      return (b.totalObtainedMarks || 0) - (a.totalObtainedMarks || 0);
    });

    let currentRank = 1;
    sortedByScore.forEach((r, idx) => {
      if (idx > 0) {
        const prev = sortedByScore[idx - 1];
        const prevPct = prev.percentage ?? (prev.totalMaxMarks ? (prev.totalObtainedMarks / prev.totalMaxMarks) * 100 : 0);
        const currPct = r.percentage ?? (r.totalMaxMarks ? (r.totalObtainedMarks / r.totalMaxMarks) * 100 : 0);
        if (currPct < prevPct) {
          currentRank = idx + 1;
        }
      }
      r.rank = currentRank;
    });

    return dedupedList;
  };

  const calculateClassResults = (
    examId: string,
    className: string,
    section: string,
    classStudents: Student[],
    subjectsList: string[]
  ) => {
    const calculatedList: ProcessedResult[] = [];

    const activeExam = (exams || []).find(e => e.id === examId) || null;

    // Filter grade rules strictly for this exam's assessment type
    let filteredRules: GradeConfig[] = [];
    let effectiveExamType = '';
    if (activeExam) {
      const typeStr = (activeExam.examType || (activeExam as any).assessmentType || '').trim();
      const schemeStr = (activeExam.gradeSchemeName || '').trim();
      effectiveExamType = schemeStr || typeStr;

      const normalize = (s: string) => (s || '').toLowerCase().replace(/[\s\/\-_]+/g, '');
      const normScheme = normalize(schemeStr);
      const normType = normalize(typeStr);

      if (normScheme) {
        const matched = (gradeConfigurations || []).filter(r => 
          (r.schemeName && normalize(r.schemeName) === normScheme) || 
          (r.examType && normalize(r.examType) === normScheme) ||
          r.examType === 'All'
        );
        if (matched.length > 0) filteredRules = matched;
      }
      if (filteredRules.length === 0 && normType) {
        const matched = (gradeConfigurations || []).filter(r =>
          (r.examType && normalize(r.examType) === normType) ||
          (r.schemeName && normalize(r.schemeName) === normType) ||
          r.examType === 'All'
        );
        if (matched.length > 0) filteredRules = matched;
      }
      if (filteredRules.length === 0) {
        filteredRules = gradeConfigurations || [];
      }
    }

    // 1. Calculate scores student-by-student
    const studentScores = (classStudents || []).map(student => {
      const studentMarks = (examMarks || []).filter(
        m => m && m.examId === examId && m.studentId === student.id
      );

      const res = calculateStudentResult(studentMarks, subjectsList, filteredRules, undefined, effectiveExamType);
      return {
        student,
        res
      };
    });

    // 2. Compute class-wise ranks (using competition ranking)
    const rankItems = studentScores.map(s => ({
      studentId: s.student.id,
      score: s.res.totalObtained
    }));
    const ranksMap = calculateCompetitionRanks(rankItems);

    // 3. Assemble full ProcessedResult objects
    studentScores.forEach(({ student, res }) => {
      const rank = ranksMap[student.id] ?? 0;
      calculatedList.push({
        id: `RES-${examId}-${student.id}`,
        examId,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        className,
        section: student.section || section,
        rollNo: student.rollNo || '',
        admissionNo: student.admissionNo || student.id,
        totalMaxMarks: res.totalMax,
        totalObtainedMarks: res.totalObtained,
        percentage: res.percentage,
        gpa: res.gpa,
        finalGrade: res.overallGrade,
        overallGrade: res.overallGrade,
        subjectMarks: res.subjectMarks,
        passStatus: res.overallResult === 'PASS' ? 'Pass' : 'Fail',
        status: 'Calculated',
        remarks: res.overallResult === 'PASS' ? 'Passed overall.' : 'Failed to meet criteria.',
        rank
      } as any);
    });

    saveProcessedResults(calculatedList);
  };

  return {
    processedResults,
    saveProcessedResults,
    updateResultStatus,
    getResultsForExamClass,
    calculateClassResults
  };
}
