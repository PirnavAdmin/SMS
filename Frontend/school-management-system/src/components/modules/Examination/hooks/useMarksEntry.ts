import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../../context/DataContext';
import { useAuth } from '../../../../context/AuthContext';
import { ExamMark, Student } from '../../../../types';

export interface RosterMarkRowState {
  attendance: 'Present' | 'Absent' | 'Medical Leave' | 'Exempted';
  marks: string;
  remarks: string;
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Verified' | 'Locked';
}

export function useMarksEntry() {
  const { examMarks, saveMarks, teacherAssignments, academicClasses, students } = useData();
  const { user } = useAuth();

  const isUserAdmin = useMemo(() => {
    if (!user) return false;
    const r = user.role.toLowerCase();
    return r === 'admin' || r === 'super admin' || r === 'principal';
  }, [user]);

  // Filter options based on logged-in teacher assignments
  const allowedClasses = useMemo(() => {
    if (isUserAdmin) {
      return Array.from(new Set((academicClasses || []).map(c => c.name).filter(Boolean)));
    }
    // Filter classes assigned to this teacher
    const teacherName = user?.name || '';
    const assigned = teacherAssignments.filter(
      ta => ta.teacherName?.toLowerCase() === teacherName.toLowerCase()
    );
    return Array.from(new Set(assigned.map(ta => ta.className).filter(Boolean)));
  }, [academicClasses, teacherAssignments, user, isUserAdmin]);

  const getAllowedSections = (className: string) => {
    if (!className) return [];
    if (isUserAdmin) {
      const clsObj = academicClasses.find(c => c.name === className);
      if (!clsObj || !clsObj.sections || clsObj.sections.length === 0) return [];
      const raw = clsObj.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || ''));
      return Array.from(new Set(raw.filter(Boolean)));
    }
    const teacherName = user?.name || '';
    const assigned = teacherAssignments.filter(
      ta => ta.className === className && ta.teacherName?.toLowerCase() === teacherName.toLowerCase()
    );
    const result = Array.from(new Set(assigned.map(ta => ta.section).filter(Boolean)));
    return result;
  };

  const getAllowedSubjects = (className: string, section: string) => {
    if (!className || !section) return [];
    if (isUserAdmin) {
      const clsObj = academicClasses.find(c => c.name === className);
      if (clsObj && clsObj.subjects && clsObj.subjects.length > 0) {
        return clsObj.subjects.map((s: any) => typeof s === 'string' ? s : (s.subjectName || s.name || s.subjectCode || s.code || ''));
      }
      return [];
    }
    const teacherName = user?.name || '';
    const assigned = teacherAssignments.filter(
      ta => ta.className === className && ta.section === section && ta.teacherName?.toLowerCase() === teacherName.toLowerCase()
    );
    return Array.from(new Set(assigned.map(ta => ta.subject)));
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
    const formattedList: Omit<ExamMark, 'id'>[] = Object.entries(marksState).map(([studentId, state]) => {
      const isAbsent = state.attendance === 'Absent' || state.attendance === 'Medical Leave';
      return {
        examId,
        studentId,
        className,
        section,
        subject,
        marksObtained: isAbsent ? 0 : Number(state.marks) || 0,
        totalMarks: maxMarks,
        grade: '', 
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
