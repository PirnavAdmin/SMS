import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../../context/DataContext';
import { useAuth } from '../../../../context/AuthContext';
import { ExamMark, Student } from '../../../../types';
import { saveMarksEntryDraftApi, submitMarksEntryApi } from '../../../../api/examination';
import { calculateGrade } from '../utils/resultCalculation';

export interface RosterMarkRowState {
  attendance: 'Present' | 'Absent' | 'Medical Leave' | 'Exempted';
  marks: string;
  remarks: string;
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Verified' | 'Locked';
}

export function useMarksEntry() {
  const { examMarks, saveMarks, teacherAssignments, academicClasses, students, subjects = [], exams = [], gradeConfigurations = [] } = useData();
  const { user } = useAuth();

  const isUserAdmin = useMemo(() => {
    if (!user) return false;
    const r = user.role.toLowerCase();
    return r === 'admin' || r === 'super admin' || r === 'principal';
  }, [user]);

  // Filter options based on logged-in teacher assignments
  const allowedClasses = useMemo(() => {
    const fromAcademic = (academicClasses || []).map(c => c.name).filter(Boolean);
    const fromStudents = (students || []).map(s => s.className).filter(Boolean);
    const allCls = Array.from(new Set([...fromAcademic, ...fromStudents]));
    if (isUserAdmin || !allCls.length) {
      return allCls;
    }
    const teacherName = (user?.name || '').toLowerCase().trim();
    const assigned = (teacherAssignments || []).filter(
      ta => (ta.teacherName || '').toLowerCase().trim().includes(teacherName) || teacherName.includes((ta.teacherName || '').toLowerCase().trim())
    );
    const assignedCls = Array.from(new Set(assigned.map(ta => ta.className).filter(Boolean)));
    return assignedCls.length > 0 ? assignedCls : allCls;
  }, [academicClasses, students, teacherAssignments, user, isUserAdmin]);

  const getAllowedSections = (className: string) => {
    if (!className) return [];
    const clsObj = (academicClasses || []).find(c => c.name === className);
    const academicSections = clsObj && clsObj.sections && clsObj.sections.length > 0
      ? Array.from(new Set(clsObj.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || '')).filter(Boolean)))
      : [];
    const studentSections = (students || [])
      .filter(s => s.className === className)
      .map(s => s.section)
      .filter(Boolean);
    const allSecs = Array.from(new Set([...academicSections, ...studentSections]));

    if (isUserAdmin) return allSecs;

    const teacherName = (user?.name || '').toLowerCase().trim();
    const assigned = (teacherAssignments || []).filter(
      ta => ta.className === className && ((ta.teacherName || '').toLowerCase().trim().includes(teacherName) || teacherName.includes((ta.teacherName || '').toLowerCase().trim()))
    );
    const result = Array.from(new Set(assigned.map(ta => ta.section).filter(Boolean)));
    return result.length > 0 ? result : allSecs;
  };

  const getAllowedSubjects = (className: string, section: string) => {
    if (!className || !section) return [];
    const clsObj = (academicClasses || []).find(c => c.name === className);
    const allSubs = clsObj && clsObj.subjects && clsObj.subjects.length > 0
      ? clsObj.subjects.map((s: any) => typeof s === 'string' ? s : (s.subjectName || s.name || s.subjectCode || s.code || ''))
      : (subjects || []).map((s: any) => s.name || s.subjectName || s.code || '');

    if (isUserAdmin) return allSubs;

    const teacherName = (user?.name || '').toLowerCase().trim();
    const assigned = (teacherAssignments || []).filter(
      ta => ta.className === className && (ta.section === section || !ta.section) && ((ta.teacherName || '').toLowerCase().trim().includes(teacherName) || teacherName.includes((ta.teacherName || '').toLowerCase().trim()))
    );
    const result = Array.from(new Set(assigned.map(ta => ta.subject).filter(Boolean)));
    return result.length > 0 ? result : allSubs;
  };

  const loadRosterMarks = (
    examId: string,
    className: string,
    section: string,
    subject: string,
    rosterStudents: Student[]
  ): Record<string, RosterMarkRowState> => {
    const rosterMarks: Record<string, RosterMarkRowState> = {};
    
    // Load from DataContext first
    rosterStudents.forEach(student => {
      const existing = examMarks.find(
        m => m.examId === examId && m.studentId === student.id && m.subject === subject
      );

      if (existing) {
        rosterMarks[student.id] = {
          attendance: (existing.isAbsent ? 'Absent' : (existing as any).attendanceStatus || 'Present'),
          marks: existing.marksObtained.toString(),
          remarks: existing.remarks || '',
          status: (existing.isLocked ? 'Locked' : (existing as any).marksStatus || 'In Progress')
        };
      } else {
        // Load from local storage draft if exists
        const draftKey = `draft_marks_${examId}_${className}_${section}_${subject}_${student.id}`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          try {
            rosterMarks[student.id] = JSON.parse(draft);
          } catch (e) {
            // Ignore parse errors
          }
        } else {
          rosterMarks[student.id] = {
            attendance: 'Present',
            marks: '',
            remarks: '',
            status: 'Not Started'
          };
        }
      }
    });

    return rosterMarks;
  };

  const saveRosterMarksDraft = (
    examId: string,
    className: string,
    section: string,
    subject: string,
    marksState: Record<string, RosterMarkRowState>
  ) => {
    Object.entries(marksState).forEach(([studentId, state]) => {
      const draftKey = `draft_marks_${examId}_${className}_${section}_${subject}_${studentId}`;
      localStorage.setItem(draftKey, JSON.stringify({ ...state, status: 'In Progress' }));
    });

    const exam = (exams || []).find(e => String(e.id) === String(examId));
    const examType = exam?.examType || (exam as any)?.assessmentType || '';

    try {
      saveMarksEntryDraftApi({
        examId,
        className,
        sectionName: section,
        subjectCode: subject,
        students: Object.entries(marksState).map(([studentId, state], idx) => {
          const isAbsent = state.attendance === 'Absent' || state.attendance === 'Medical Leave' || state.attendance === 'Exempted';
          const mObt = isAbsent ? 0 : Number(state.marks) || 0;
          const pct = (mObt / 100) * 100;
          const calcGrd = isAbsent ? (state.attendance === 'Absent' ? 'AB' : (state.attendance === 'Medical Leave' ? 'ML' : 'EX')) : calculateGrade(pct, gradeConfigurations, 'Percentage', examType);

          return {
            entryId: idx + 1,
            rollNo: '',
            studentName: '',
            admissionNo: studentId,
            attendanceStatus: state.attendance,
            marksObtained: mObt,
            maxMarks: 100,
            grade: calcGrd,
            evaluatorRemarks: state.remarks,
            status: 'In Progress'
          };
        })
      }).catch(err => console.warn('Marks draft API note:', err));
    } catch (e) {}
  };

  const submitRosterMarks = (
    examId: string,
    className: string,
    section: string,
    subject: string,
    marksState: Record<string, RosterMarkRowState>,
    maxMarks: number,
    passMarks: number
  ) => {
    const exam = (exams || []).find(e => String(e.id) === String(examId));
    const examType = exam?.examType || (exam as any)?.assessmentType || '';

    const formattedList: Omit<ExamMark, 'id'>[] = Object.entries(marksState).map(([studentId, state]) => {
      const isAbsent = state.attendance === 'Absent' || state.attendance === 'Medical Leave' || state.attendance === 'Exempted';
      const mObt = isAbsent ? 0 : Number(state.marks) || 0;
      const pct = maxMarks > 0 ? (mObt / maxMarks) * 100 : 0;
      const calcGrd = isAbsent 
        ? (state.attendance === 'Absent' ? 'AB' : (state.attendance === 'Medical Leave' ? 'ML' : 'EX')) 
        : calculateGrade(pct, gradeConfigurations, 'Percentage', examType);

      return {
        examId,
        studentId,
        className,
        section,
        subject,
        marksObtained: mObt,
        totalMarks: maxMarks,
        grade: calcGrd, 
        isAbsent,
        maxMarks,
        passMarks,
        remarks: state.remarks,
        attendanceStatus: state.attendance,
        marksStatus: 'Submitted',
        isLocked: false
      } as any;
    });

    saveMarks(formattedList);

    try {
      submitMarksEntryApi({
        examId,
        className,
        sectionName: section,
        subjectCode: subject,
        isFinalSubmit: true,
        students: Object.entries(marksState).map(([studentId, state], idx) => {
          const isAbsent = state.attendance === 'Absent' || state.attendance === 'Medical Leave' || state.attendance === 'Exempted';
          const mObt = isAbsent ? 0 : Number(state.marks) || 0;
          const pct = maxMarks > 0 ? (mObt / maxMarks) * 100 : 0;
          const calcGrd = isAbsent 
            ? (state.attendance === 'Absent' ? 'AB' : (state.attendance === 'Medical Leave' ? 'ML' : 'EX')) 
            : calculateGrade(pct, gradeConfigurations, 'Percentage', examType);

          return {
            entryId: idx + 1,
            rollNo: '',
            studentName: '',
            admissionNo: studentId,
            attendanceStatus: state.attendance,
            marksObtained: mObt,
            maxMarks,
            grade: calcGrd,
            evaluatorRemarks: state.remarks,
            status: 'Submitted'
          };
        })
      }).catch(err => console.warn('Submit marks API note:', err));
    } catch (e) {}

    // Clean drafts
    Object.keys(marksState).forEach(studentId => {
      const draftKey = `draft_marks_${examId}_${className}_${section}_${subject}_${studentId}`;
      localStorage.removeItem(draftKey);
    });
  };

  return {
    isUserAdmin,
    allowedClasses,
    getAllowedSections,
    getAllowedSubjects,
    loadRosterMarks,
    saveRosterMarksDraft,
    submitRosterMarks
  };
}
