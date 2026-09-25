// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Award, Printer, ChevronDown } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { PrintableReportCard } from '../Examination/PrintableReportCard';
import { Student, ExamSetup, ExamMark, ProcessedResult } from '../../../types';
import { useParentWards, ParentStudentSelector } from '../../common/ParentStudentSelector';

export const ParentExaminationView: React.FC = () => {
  const { students = [], exams = [], processedResults = [], subjects = [], examMarks = [] } = useData();
  const { user, role } = useAuth();
  const parentWards = useParentWards();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const getSubjectName = (id: string) => (subjects || []).find(s => s.id === id || s.name === id)?.name || id;

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

  const isStudentMatch = (item: any) => {
    if (!item || !currentWard) return false;
    const sId = String(item.studentId || item.id || '').toLowerCase().trim();
    const sAdm = String(item.admissionNo || item.admissionNumber || '').toLowerCase().trim();
    const sRoll = String(item.rollNo || item.rollNumber || '').toLowerCase().trim();
    const sName = String(item.studentName || item.name || `${item.firstName || ''} ${item.lastName || ''}`).toLowerCase().trim();

    const wId = String(currentWard.id || currentWard.studentId || '').toLowerCase().trim();
    const wAdm = String(currentWard.admissionNo || '').toLowerCase().trim();
    const wRoll = String(currentWard.rollNo || '').toLowerCase().trim();
    const wName = String(currentWard.studentName || `${currentWard.firstName || ''} ${currentWard.lastName || ''}`).toLowerCase().trim();

    if (sId && (sId === wId || sId === wAdm || sId === wRoll)) return true;
    if (sAdm && (sAdm === wId || sAdm === wAdm || sAdm === wRoll)) return true;
    if (sRoll && (sRoll === wId || sRoll === wAdm || sRoll === wRoll)) return true;
    if (sName && wName && (sName === wName || sName.includes(wName) || wName.includes(sName))) return true;

    return false;
  };

  // Map current ward to a full Student type for PrintableReportCard
  const wardStudent: Student = (currentWard && (students || []).find(s => String(s.id) === String(currentWard.id) || s.admissionNo === currentWard.admissionNo)) || {
    id: String(currentWard?.id || currentWard?.studentId || '1'),
    admissionNo: currentWard?.admissionNo || 'ADM-2026-0050',
    rollNo: currentWard?.rollNo || 'STU-2026-0050',
    firstName: currentWard?.firstName || (currentWard?.studentName ? currentWard.studentName.split(' ')[0] : 'Bhavya'),
    lastName: currentWard?.lastName || (currentWard?.studentName?.split(' ').slice(1).join(' ') || 'Pillai'),
    studentName: currentWard?.studentName || `${currentWard?.firstName || 'Bhavya'} ${currentWard?.lastName || 'Pillai'}`.trim(),
    gender: (currentWard?.gender as any) || 'Female',
    dob: currentWard?.dob || '2015-05-15',
    bloodGroup: 'O+',
    className: currentWard?.className || 'Class 5',
    section: currentWard?.section || 'A',
    category: 'General',
    status: 'Active',
    avatar: '',
    joiningDate: '2026-06-01',
    fatherName: currentWard?.fatherName || user?.name || 'Naresh Mishra',
    fatherPhone: '',
    fatherOccupation: 'N/A',
    motherName: currentWard?.motherName || 'Mother',
    motherPhone: ''
  };

  // Get ALL raw processed results matching current ward
  const wardResultsRaw = (processedResults || []).filter(r => isStudentMatch(r));

  // Build exam collection from DataContext exams, processedResults, and examMarks
  const examMap = new Map<string, { id: string; name: string; date?: string }>();

  (exams || []).forEach(e => {
    if (e && (e.id || e.name)) {
      examMap.set(String(e.id || e.name), { id: String(e.id || e.name), name: e.name || 'Examination', date: e.startDate });
    }
  });

  wardResultsRaw.forEach(r => {
    if (r && (r.examId || r.examName)) {
      const key = String(r.examId || r.examName);
      if (!examMap.has(key)) {
        examMap.set(key, { id: key, name: r.examName || r.examId || 'Half Yearly Examinations', date: r.date || r.publishedAt });
      }
    }
  });

  (examMarks || []).forEach(m => {
    if (m && (m.examId || m.examName) && isStudentMatch(m)) {
      const key = String(m.examId || m.examName);
      if (!examMap.has(key)) {
        examMap.set(key, { id: key, name: m.examName || m.examId || 'Half Yearly Examinations' });
      }
    }
  });

  const dbChildExams = Array.from(examMap.values()).map(exam => {
    const matchingResult = wardResultsRaw.find(r =>
      String(r.examId).toLowerCase() === exam.id.toLowerCase() ||
      String(r.examName || '').toLowerCase() === exam.name.toLowerCase()
    );

    const marksForExam = (examMarks || []).filter(m =>
      (String(m.examId).toLowerCase() === exam.id.toLowerCase() || String(m.examName || '').toLowerCase() === exam.name.toLowerCase()) &&
      isStudentMatch(m)
    );

    const subjectMarksList = (matchingResult?.subjectMarks && matchingResult.subjectMarks.length > 0)
      ? matchingResult.subjectMarks
      : marksForExam.map((sm: any) => ({
          subject: getSubjectName(sm.subject || sm.subjectName || sm.subjectId),
          maxMarks: sm.maxMarks || 100,
          passMarks: sm.passMarks || 35,
          obtainedMarks: sm.marksObtained !== undefined ? sm.marksObtained : sm.marks,
          grade: sm.grade || 'A',
          isPass: sm.isPass !== false
        }));

    if (subjectMarksList.length === 0 && !matchingResult) return null;

    const formattedSubjects = subjectMarksList.map((sub: any) => ({
      name: sub.subject || getSubjectName(sub.name || sub.subjectId),
      marks: sub.obtainedMarks !== undefined ? sub.obtainedMarks : (sub.marks !== undefined ? sub.marks : 0),
      grade: sub.grade || 'A',
      maxMarks: sub.maxMarks || 100,
      passMarks: sub.passMarks || 35,
      isPass: sub.isPass !== false
    }));

    const totalObtained = matchingResult?.totalObtainedMarks ?? matchingResult?.totalObtained ?? formattedSubjects.reduce((sum: number, s: any) => sum + (typeof s.marks === 'number' ? s.marks : (parseInt(String(s.marks)) || 0)), 0);
    const totalMax = matchingResult?.totalMaxMarks ?? matchingResult?.totalMax ?? (formattedSubjects.length * 100);
    const pct = matchingResult?.percentage ?? (totalMax > 0 ? (totalObtained / totalMax) * 100 : 0);

    return {
      examId: exam.id,
      examName: exam.name || 'Half Yearly Examinations',
      date: exam.date || '2026-09-24',
      overallGrade: matchingResult?.finalGrade || matchingResult?.overallGrade || (pct >= 90 ? 'A+' : (pct >= 75 ? 'A' : 'B')),
      percentage: typeof pct === 'number' ? pct.toFixed(1) + '%' : pct,
      rawPct: typeof pct === 'number' ? pct : parseFloat(String(pct)) || 0,
      totalObtained,
      totalMax,
      rank: matchingResult?.rank || 1,
      remarks: matchingResult?.remarks || `${currentWard?.firstName || 'Student'} has passed all evaluated subjects cleanly.`,
      subjects: formattedSubjects,
      resultObj: matchingResult
    };
  }).filter(Boolean);

  const childExams = dbChildExams;
  const activeExam = childExams.find((e: any) => e.examName === selectedExamId) || childExams[0];

  useEffect(() => {
    if (childExams.length > 0) {
      if (!selectedExamId || !childExams.some((e: any) => e.examName === selectedExamId)) {
        setSelectedExamId(childExams[0].examName);
      }
    } else {
      setSelectedExamId('');
    }
  }, [selectedChildIdx, childExams.length]);

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        No active student records linked to this user account.
      </div>
    );
  }

  const matchedExam: ExamSetup = (exams || []).find(e => e.id === activeExam?.examId || e.name === activeExam?.examName) || {
    id: activeExam?.examId || 'term-1',
    name: activeExam?.examName || 'HALF YEARLY EXAMINATIONS',
    academicYear: '2026-2027',
    term: activeExam?.examName || 'HALF YEARLY EXAMINATIONS',
    startDate: activeExam?.date || '2026-09-24',
    endDate: activeExam?.date || '2026-09-25',
    status: 'Results Published',
    publishStatus: 'Published',
    applicableClasses: [currentWard?.className || 'Class 5'],
    createdBy: 'Examination Controller'
  };

  const matchedMarks: ExamMark[] = activeExam?.subjects ? activeExam.subjects.map((sub: any, idx: number) => ({
    id: `mark-${idx}`,
    examId: matchedExam.id,
    studentId: wardStudent.id,
    subject: sub.name,
    marksObtained: sub.marks,
    maxMarks: sub.maxMarks || 100,
    passMarks: sub.passMarks || 35,
    grade: sub.grade,
    isPass: sub.isPass !== false,
    isAbsent: sub.marks === 'AB'
  })) : [];

  const matchedProcessedResult: ProcessedResult = {
    id: `res-${matchedExam.id}-${wardStudent.id}`,
    examId: matchedExam.id,
    studentId: wardStudent.id,
    studentName: wardStudent.studentName || `${wardStudent.firstName || ''} ${wardStudent.lastName || ''}`.trim(),
    rollNo: wardStudent.rollNo,
    className: wardStudent.className,
    section: wardStudent.section,
    totalObtainedMarks: activeExam?.totalObtained ?? 0,
    totalMaxMarks: activeExam?.totalMax ?? 100,
    totalObtained: activeExam?.totalObtained ?? 0,
    totalMax: activeExam?.totalMax ?? 100,
    percentage: activeExam?.rawPct ?? 0,
    finalGrade: activeExam?.overallGrade || 'A',
    overallGrade: activeExam?.overallGrade || 'A',
    status: 'Published',
    rank: activeExam?.rank || 1,
    subjectMarks: activeExam?.subjects ? activeExam.subjects.map((sub: any) => ({
      subject: sub.name,
      maxMarks: sub.maxMarks || 100,
      passMarks: sub.passMarks || 35,
      obtainedMarks: sub.marks,
      grade: sub.grade || 'A',
      isPass: sub.isPass !== false
    })) : [],
    remarks: activeExam?.remarks || `${wardStudent.firstName || 'Student'} has completed this evaluation term.`
  };

  return (
    <div className="space-y-6 animate-in fade-in text-left">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center no-print">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
            <Award className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          Reports
        </h2>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* Assessment Dropdown */}
          {childExams.length > 0 && (
            <div className="relative min-w-[220px]">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer shadow-xs"
              >
                {childExams.map((exam: any, idx: number) => (
                  <option key={idx} value={exam.examName}>
                    {exam.examName} ({exam.date})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Print / Save PDF Button */}
          {childExams.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Ward Selector Tabs (Hidden for Students since they only see themselves) */}
      <ParentStudentSelector
        wards={parentWards}
        selectedIndex={selectedChildIdx}
        onSelect={setSelectedChildIdx}
      />

      {/* Embedded Official Printable Report Card Component matching Admin template */}
      {childExams.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
          <div className="p-3 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-full w-max mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">No Published Report Cards Available</h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            Subject teachers have not officially published examination results for {currentWard?.firstName || 'this student'} yet. Once published by teachers/admins, your official report card will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <PrintableReportCard
            student={wardStudent}
            exam={matchedExam}
            isOpen={false}
            onClose={() => {}}
            examMarks={matchedMarks}
            processedResult={matchedProcessedResult}
          />
        </div>
      )}
    </div>
  );
};

export default ParentExaminationView;

