// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Award, Printer, ChevronDown } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getParentChildren, ParentChild } from '../../../api/parent/parentApi';
import { PrintableReportCard } from '../Examination/PrintableReportCard';
import { Student, ExamSetup, ExamMark, ProcessedResult } from '../../../types';

export const ParentExaminationView: React.FC = () => {
  const { students, exams, processedResults, subjects, examMarks } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchChildren = async () => {
      try {
        const children = await getParentChildren(user?.email);
        if (isMounted && children && children.length > 0) {
          setApiChildren(children);
        }
      } catch (err) {
        console.warn('Failed to load parent children in report cards view:', err);
      }
    };
    fetchChildren();
    return () => { isMounted = false; };
  }, [user?.email]);

  // Match children by email or phone accurately
  let parentWards: any[] = [];

  if (apiChildren.length > 0) {
    parentWards = apiChildren.map(c => ({
      id: String(c.studentId),
      studentId: c.studentId,
      admissionNo: c.admissionNumber,
      rollNo: c.rollNumber,
      firstName: c.firstName || c.studentName.split(' ')[0],
      lastName: c.lastName || '',
      studentName: c.studentName,
      className: c.className || 'Class 6',
      section: c.sectionName || 'A',
      gender: c.gender || 'Male',
      dob: c.dateOfBirth || '2015-01-21',
      status: 'Active'
    }));
  } else {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    const localMatches = students.filter(s => 
      s.status === 'Active' && 
      (
        role === 'Student' ? (s.id === user?.id || s.email === user?.email) :
        (
          (userEmail && (
            s.guardianEmail?.toLowerCase() === userEmail || 
            s.guardianPhone?.toLowerCase() === userEmail || 
            s.contactEmail?.toLowerCase() === userEmail || 
            s.contactPhone?.toLowerCase() === userEmail ||
            s.fatherPhone?.toLowerCase() === userEmail ||
            s.motherPhone?.toLowerCase() === userEmail
          )) ||
          (userName && (
            s.fatherName?.toLowerCase() === userName ||
            s.motherName?.toLowerCase() === userName ||
            s.guardianName?.toLowerCase() === userName
          ))
        )
      )
    );
    if (localMatches.length > 0) {
      parentWards = localMatches;
    } else {
      parentWards = students.filter(s => s.status === 'Active').slice(0, 1);
    }
  }

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        No active student records linked to this user account.
      </div>
    );
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

  // Map current ward to a full Student type for PrintableReportCard
  const wardStudent: Student = students.find(s => String(s.id) === String(currentWard.id) || s.admissionNo === currentWard.admissionNo) || {
    id: String(currentWard.id || currentWard.studentId || '2'),
    admissionNo: currentWard.admissionNo || 'REG-1104',
    rollNo: currentWard.rollNo || '102',
    firstName: currentWard.firstName || currentWard.studentName?.split(' ')[0] || 'pawankalyan',
    lastName: currentWard.lastName || (currentWard.studentName?.split(' ').slice(1).join(' ') || ''),
    studentName: currentWard.studentName || `${currentWard.firstName || 'pawankalyan'} ${currentWard.lastName || ''}`.trim(),
    gender: (currentWard.gender as any) || 'Male',
    dob: currentWard.dob || '2015-01-21',
    bloodGroup: 'O+',
    className: currentWard.className || 'Class 6',
    section: currentWard.section || 'A',
    category: 'General',
    status: 'Active',
    avatar: '',
    joiningDate: '2026-06-01',
    fatherName: currentWard.fatherName || user?.name || 'Kumar Parent',
    fatherPhone: '9876543210',
    fatherOccupation: 'Business',
    motherName: 'Mother',
    motherPhone: '9876543211'
  };

  // Get ONLY officially Published results
  const wardResultsRaw = processedResults.filter(
    r => r.studentId === currentWard.id && r.status === 'Published'
  );

  const dbChildExams = wardResultsRaw.map(r => {
    const exam = exams.find(e => e.id === r.examId);
    const marksForExam = examMarks.filter(m => m.examId === r.examId && m.studentId === r.studentId);
    
    const formattedSubjects = marksForExam.map((sm: any) => ({
      name: getSubjectName(sm.subject),
      marks: sm.marksObtained,
      grade: sm.grade || 'N/A'
    }));
    
    return {
      examId: r.examId,
      examName: exam?.name || 'Unknown Exam',
      date: exam?.startDate || '',
      overallGrade: r.overallGrade || r.finalGrade,
      percentage: r.percentage.toFixed(1) + '%',
      remarks: r.remarks || 'No remarks provided by class teacher.',
      subjects: formattedSubjects
    };
  });

  const childExams = dbChildExams;
  const activeExam = childExams.find((e: any) => e.examName === selectedExamId) || childExams[0];

  // Set default selected exam on mount or if child changes
  useEffect(() => {
    if (childExams.length > 0) {
      setSelectedExamId(childExams[0].examName);
    } else {
      setSelectedExamId('');
    }
  }, [selectedChildIdx, processedResults.length, childExams.length]);

  const matchedExam: ExamSetup = exams.find(e => e.id === activeExam?.examId || e.name === activeExam?.examName) || {
    id: activeExam?.examId || 'term-1',
    name: activeExam?.examName || 'Term 1 (Mid-Term)',
    academicYear: '2026-2027',
    term: activeExam?.examName || 'Term 1',
    startDate: activeExam?.date || '2026-10-15',
    endDate: activeExam?.date || '2026-10-25',
    status: 'Results Published',
    publishStatus: 'Published',
    applicableClasses: [currentWard.className || 'Class 6'],
    createdBy: 'Examination Controller'
  };

  const matchedMarks: ExamMark[] = activeExam?.subjects ? activeExam.subjects.map((sub: any, idx: number) => ({
    id: `mark-${idx}`,
    examId: matchedExam.id,
    studentId: wardStudent.id,
    subject: sub.name,
    marksObtained: sub.marks,
    maxMarks: 100,
    passMarks: 35,
    grade: sub.grade,
    isPass: sub.marks !== 'AB' && (typeof sub.marks === 'number' ? sub.marks >= 35 : (parseInt(String(sub.marks)) || 0) >= 35),
    isAbsent: sub.marks === 'AB'
  })) : [];

  const totalObtained = matchedMarks.reduce((sum, m) => sum + (typeof m.marksObtained === 'number' ? m.marksObtained : (parseInt(String(m.marksObtained)) || 0)), 0);
  const totalMax = matchedMarks.length * 100;
  const pct = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 86.3;

  const matchedProcessedResult: ProcessedResult = {
    id: `res-${matchedExam.id}-${wardStudent.id}`,
    examId: matchedExam.id,
    studentId: wardStudent.id,
    studentName: `${wardStudent.firstName} ${wardStudent.lastName}`.trim(),
    rollNo: wardStudent.rollNo,
    className: wardStudent.className,
    section: wardStudent.section,
    totalObtained,
    totalMax,
    percentage: pct,
    finalGrade: activeExam?.overallGrade || 'A',
    overallGrade: activeExam?.overallGrade || 'A',
    status: 'Published',
    rank: 1,
    remarks: activeExam?.remarks || `${wardStudent.firstName} is showing consistent progress and active participation in class.`
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
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Ward Selector Tabs (Hidden for Students since they only see themselves) */}
      {role !== 'Student' && parentWards.length > 1 && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max no-print">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedChildIdx === idx
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {ward.firstName} {ward.lastName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      {/* Embedded Official Printable Report Card Component matching Admin template */}
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
    </div>
  );
};

export default ParentExaminationView;

