import { useData } from '../../../../context/DataContext';
import { ProcessedResult, Student } from '../../../../types';
import { calculateStudentResult } from '../utils/resultCalculation';
import { calculateCompetitionRanks } from '../utils/ranking';

export function useResults() {
  const { 
    processedResults, 
    saveProcessedResults, 
    updateResultStatus, 
    examMarks, 
    gradeConfigurations,
    exams
  } = useData();

  const getResultsForExamClass = (examId: string, className: string, section: string) => {
    return processedResults.filter(
      r => r.examId === examId && r.className === className && (section === 'All' || r.section === section)
    );
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
    
    // Filter grade rules
    let filteredRules = gradeConfigurations || [];
    if (activeExam) {
      if (activeExam.gradeSchemeName) {
        const matched = (gradeConfigurations || []).filter(r => r.schemeName === activeExam.gradeSchemeName);
        if (matched.length > 0) filteredRules = matched;
      } else if (activeExam.examType) {
        const typeStr = activeExam.examType;
        const matched = (gradeConfigurations || []).filter(r => 
          r.schemeName === typeStr || 
          r.examType === typeStr ||
          (r.schemeName && r.schemeName.toLowerCase().includes(typeStr.toLowerCase()))
        );
        if (matched.length > 0) filteredRules = matched;
      } else {
        const defaultScholastic = (gradeConfigurations || []).filter(r => r.schemeName === 'Default Scholastic');
        if (defaultScholastic.length > 0) filteredRules = defaultScholastic;
      }
    }

    // 1. Calculate scores student-by-student
    const studentScores = classStudents.map(student => {
      const studentMarks = examMarks.filter(
        m => m.examId === examId && m.studentId === student.id
      );

      const res = calculateStudentResult(studentMarks, subjectsList, filteredRules);
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
      const rank = ranksMap[student.id] || 1;
      calculatedList.push({
        id: `RES-${examId}-${student.id}`,
        examId,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        className,
        section: student.section || 'A',
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
