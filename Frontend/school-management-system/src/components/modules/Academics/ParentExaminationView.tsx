// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Award, Printer, ChevronDown } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getParentChildren, ParentChild } from '../../../api/parent/parentApi';
import { PrintableReportCard } from '../Examination/PrintableReportCard';
import { Student, ExamSetup, ExamMark, ProcessedResult } from '../../../types';

export const ParentExaminationView: React.FC = () => {
  const { students = [], admissions = [], exams, processedResults, subjects, examMarks } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchChildren = async () => {
      try {
        const children = await getParentChildren(user?.email);
        if (isMounted) {
          setApiChildren(children || []);
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
      firstName: c.firstName || (c.studentName ? c.studentName.split(' ')[0] : 'Student'),
      lastName: c.lastName || '',
      studentName: c.studentName,
      className: c.className || '',
      section: c.sectionName || '',
      gender: c.gender || 'Male',
      dob: c.dateOfBirth || '',
      status: 'Active'
    }));
  } else {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userPhone = (user?.phone || '').replace(/\D/g, '');

    const studentMatches = (students || []).filter(s => 
      s.status === 'Active' && 
      (
        role === 'Student' ? (s.id === user?.id || s.email === user?.email) :
        (
          (userEmail && (
            (s.email && s.email.toLowerCase().trim() === userEmail) ||
            ((s as any).parentEmail && (s as any).parentEmail.toLowerCase().trim() === userEmail) ||
            s.guardianEmail?.toLowerCase() === userEmail || 
            s.contactEmail?.toLowerCase() === userEmail || 
            s.fatherPhone?.toLowerCase() === userEmail ||
            s.motherPhone?.toLowerCase() === userEmail
          )) ||
          (userPhone && userPhone.length >= 7 && (
            (s.fatherPhone && s.fatherPhone.replace(/\D/g, '').endsWith(userPhone)) ||
            (s.motherPhone && s.motherPhone.replace(/\D/g, '').endsWith(userPhone))
          ))
        )
      )
    );

    const admissionMatches = (admissions || []).filter(a => {
      if (a.status === 'Rejected' || a.status === 'Cancelled') return false;
      const phoneMatch = userPhone && userPhone.length >= 7 && (
        (a.phone && a.phone.replace(/\D/g, '').endsWith(userPhone)) ||
        ((a as any).fatherMobileNo && (a as any).fatherMobileNo.replace(/\D/g, '').endsWith(userPhone)) ||
        ((a as any).fatherContact && (a as any).fatherContact.replace(/\D/g, '').endsWith(userPhone)) ||
        ((a as any).alternateMobileNumber && (a as any).alternateMobileNumber.replace(/\D/g, '').endsWith(userPhone))
      );
      const emailMatch = userEmail && (
        (a.email && a.email.toLowerCase().trim() === userEmail) ||
        ((a as any).parentEmail && (a as any).parentEmail.toLowerCase().trim() === userEmail)
      );
      return phoneMatch || emailMatch;
    }).map(a => ({
      id: String(a.id),
      studentId: a.id,
      admissionNo: a.applicationNo || a.registrationNo || (a as any).admissionNo || `ADM-${a.id}`,
      rollNo: a.registrationNo || a.applicationNo || `ROLL-${a.id}`,
      firstName: a.firstName || (a as any).applicantName?.split(' ')[0] || 'Student',
      lastName: a.lastName || '',
      studentName: `${a.firstName || ''} ${a.lastName || ''}`.trim() || (a as any).applicantName || 'Student',
      className: (a as any).appliedClass?.className || (a as any).className || (typeof a.appliedClass === 'string' ? a.appliedClass : '') || '',
      section: (a as any).section || '',
      gender: a.gender || 'Male',
      dob: a.dateOfBirth || (a as any).dob || '',
      status: 'Active'
    }));

    const combined = [...studentMatches, ...admissionMatches];
    const unique = new Map();
    combined.forEach(w => {
      const sName = (w.studentName || `${w.firstName || ''} ${w.lastName || ''}`).trim().toLowerCase();
      const cName = (w.className || '').toString().toLowerCase().replace(/class/gi, '').trim();
      const key = `${sName}_${cName}`;
      if (sName && !unique.has(key)) {
        unique.set(key, w);
      }
    });
    parentWards = Array.from(unique.values());
  }

  const getSubjectName = (id: string) => (subjects || []).find(s => s.id === id)?.name || id;

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

  // Map current ward to a full Student type for PrintableReportCard
  const wardStudent: Student = (currentWard && (students || []).find(s => String(s.id) === String(currentWard.id) || s.admissionNo === currentWard.admissionNo)) || {
    id: String(currentWard?.id || currentWard?.studentId || '1'),
    admissionNo: currentWard?.admissionNo || 'ADM-1001',
    rollNo: currentWard?.rollNo || '101',
    firstName: currentWard?.firstName || (currentWard?.studentName ? currentWard.studentName.split(' ')[0] : 'Student'),
    lastName: currentWard?.lastName || (currentWard?.studentName?.split(' ').slice(1).join(' ') || ''),
    studentName: currentWard?.studentName || `${currentWard?.firstName || 'Student'} ${currentWard?.lastName || ''}`.trim(),
    gender: (currentWard?.gender as any) || 'Male',
    dob: currentWard?.dob || '',
    bloodGroup: 'O+',
    className: currentWard?.className || 'Class 6',
    section: currentWard?.section || 'A',
    category: 'General',
    status: 'Active',
    avatar: '',
    joiningDate: '2026-06-01',
    fatherName: currentWard?.fatherName || user?.name || 'Parent',
    fatherPhone: '',
    fatherOccupation: 'N/A',
    motherName: currentWard?.motherName || 'Mother',
    motherPhone: ''
  };

  // Get ONLY officially Published results
  const wardResultsRaw = currentWard ? (processedResults || []).filter(
    r => (
      String(r.studentId) === String(currentWard.id) ||
      String(r.studentId) === String(currentWard.studentId) ||
      (currentWard.rollNo && String(r.rollNo) === String(currentWard.rollNo)) ||
      (currentWard.admissionNo && String(r.admissionNo || r.rollNo) === String(currentWard.admissionNo))
    ) && r.status === 'Published'
  ) : [];

  const dbChildExams = wardResultsRaw.map(r => {
    const exam = (exams || []).find(e => e.id === r.examId);
    const marksForExam = (examMarks || []).filter(m => 
      m.examId === r.examId && 
      (
        String(m.studentId) === String(r.studentId) || 
        String(m.studentId) === String(currentWard.id) ||
        String(m.studentId) === String(currentWard.studentId)
      )
    );
    
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
      percentage: r.percentage?.toFixed(1) ? r.percentage.toFixed(1) + '%' : '0%',
      remarks: r.remarks || 'No remarks provided by class teacher.',
      subjects: formattedSubjects
    };
  });

  const childExams = dbChildExams;
  const activeExam = childExams.find((e: any) => e.examName === selectedExamId) || childExams[0];

  // Set default selected exam on mount or if child changes - Unconditional Hook
  useEffect(() => {
    if (childExams.length > 0) {
      setSelectedExamId(childExams[0].examName);
    } else {
      setSelectedExamId('');
    }
  }, [selectedChildIdx, processedResults?.length, childExams.length]);

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        No active student records linked to this user account.
      </div>
    );
  }

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

