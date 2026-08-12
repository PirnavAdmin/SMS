import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import {
  fetchExamOptionsApi,
  fetchExamByIdApi,
  saveExamDetailsApi,
  deleteExamApi,
  fetchScheduleTimetableApi,
  saveScheduleTimetableApi,
  fetchMarksEntryStudentsApi,
  saveMarksEntryDraftApi,
  submitMarksEntryApi
} from '../api/examination';
import { ExamSetup, ExamMark, ExamSchedule } from '../types';

interface ExaminationContextType {
  exams: ExamSetup[];
  examMarks: ExamMark[];
  examSchedules: ExamSchedule[];
  addExam: (exam: Omit<ExamSetup, 'id'>) => Promise<void>;
  updateExam: (id: string, updates: Partial<ExamSetup>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  saveMarks: (marks: Omit<ExamMark, 'id'>[]) => Promise<void>;
  addExamSchedule: (schedule: Omit<ExamSchedule, 'id'>) => Promise<void>;
  updateExamSchedule: (id: string, updates: Partial<ExamSchedule>) => Promise<void>;
  deleteExamSchedule: (id: string) => Promise<void>;
  refreshExamData: () => Promise<void>;
}

const ExaminationContext = createContext<ExaminationContextType | undefined>(undefined);

export const ExaminationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [exams, setExams] = useState<ExamSetup[]>([]);
  const [examMarks, setExamMarks] = useState<ExamMark[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);

  const refreshExamData = useCallback(async () => {
    try {
      const response = await fetchExamOptionsApi();
      if (response && response.success && response.data) {
        // Map backend exams to ExamSetup shape
        const mappedExams: ExamSetup[] = (response.data.existingExams || []).map((e: any) => ({
          id: e.examId.toString(),
          name: e.examName,
          term: e.academicTerm || 'Term 1',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          classes: e.applicableClasses || [],
          status: e.status || 'Draft',
          assessmentType: e.assessmentType || 'Main Exam'
        }));
        setExams(mappedExams);
      }
    } catch (err: any) {
      console.error('Failed to load examination options:', err);
    }
  }, []);

  useEffect(() => {
    refreshExamData();
  }, [refreshExamData]);

  const handleAddExam = async (examData: Omit<ExamSetup, 'id'>) => {
    const data = examData as any;
    try {
      await saveExamDetailsApi({
        examName: data.name,
        assessmentType: data.assessmentType || 'Main Exam',
        academicTerm: data.term || 'Term 1',
        startDate: data.startDate,
        endDate: data.endDate,
        applicableClasses: data.classes || []
      });
      addToast('success', 'Exam Setup Saved', 'Examination configuration created successfully.');
      await refreshExamData();
    } catch (err: any) {
      addToast('error', 'API Error', err.message || 'Failed to save exam details.');
    }
  };

  const handleUpdateExam = async (id: string, updates: Partial<ExamSetup>) => {
    try {
      const original = exams.find(e => e.id === id);
      if (!original) return;

      const up = updates as any;
      const orig = original as any;

      await saveExamDetailsApi({
        examId: parseInt(id),
        examName: up.name || orig.name,
        assessmentType: up.assessmentType || orig.assessmentType || 'Main Exam',
        academicTerm: up.term || orig.term || 'Term 1',
        startDate: up.startDate || orig.startDate,
        endDate: up.endDate || orig.endDate,
        applicableClasses: up.classes || orig.classes || []
      });
      addToast('success', 'Exam Setup Updated', 'Examination details updated successfully.');
      await refreshExamData();
    } catch (err: any) {
      addToast('error', 'API Error', err.message || 'Failed to update exam details.');
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await deleteExamApi(parseInt(id));
      addToast('success', 'Exam Deleted', 'Examination configuration removed successfully.');
      await refreshExamData();
    } catch (err: any) {
      addToast('error', 'API Error', err.message || 'Failed to delete examination.');
    }
  };

  // Group marks by examId, class, section, subject and submit them
  const handleSaveMarks = async (marksData: Omit<ExamMark, 'id'>[]) => {
    try {
      // Grouping logic
      const groups: Record<string, typeof marksData> = {};
      marksData.forEach(m => {
        const key = `${m.examId}_${m.className || 'Class 1'}_${m.section || 'Section A'}_${m.subject}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      });

      for (const key of Object.keys(groups)) {
        const items = groups[key];
        const first = items[0];
        const payload = {
          examId: parseInt(first.examId),
          className: first.className || 'Class 1',
          sectionName: first.section || 'Section A',
          subjectCode: first.subject,
          students: items.map((m, idx) => ({
            entryId: 0,
            rollNo: (idx + 1).toString(),
            studentName: (m as any).studentName || `Student ${m.studentId}`,
            admissionNo: m.studentId, // Legacy studentId is often used as admissionNo or studentId
            attendanceStatus: 'Present',
            marksObtained: m.marksObtained,
            maxMarks: m.maxMarks || 100,
            grade: m.grade || 'N/A',
            evaluatorRemarks: m.remarks || '',
            status: m.isLocked ? 'Submitted' : 'Draft'
          })),
          isFinalSubmit: items.every(m => m.isLocked)
        };

        if (payload.isFinalSubmit) {
          await submitMarksEntryApi({ ...payload, isFinalSubmit: true });
        } else {
          await saveMarksEntryDraftApi(payload);
        }
      }

      addToast('success', 'Marks Saved', 'Student marks updated successfully.');
      // Refresh local marks state
      const updatedMarks: ExamMark[] = marksData.map((m, idx) => ({
        ...m,
        id: `mrk_${m.examId}_${m.studentId}_${idx}`
      })) as any[];
      setExamMarks(prev => {
        const filtered = prev.filter(pm => !marksData.some(m => m.examId === pm.examId && m.studentId === pm.studentId && m.subject === pm.subject));
        return [...filtered, ...updatedMarks];
      });
    } catch (err: any) {
      addToast('error', 'API Error', err.message || 'Failed to save student marks.');
    }
  };

  const handleAddExamSchedule = async (scheduleData: Omit<ExamSchedule, 'id'>) => {
    try {
      await saveScheduleTimetableApi({
        examId: parseInt(scheduleData.examId),
        className: scheduleData.className,
        sectionName: scheduleData.section || 'Section A',
        timetable: [{
          slotId: 0,
          subjectCode: scheduleData.subject,
          subjectName: scheduleData.subject,
          totalMarks: 100,
          examDate: scheduleData.date,
          timeSlot: `${scheduleData.startTime} - ${scheduleData.endTime}`,
          duration: '3 hours',
          roomHall: scheduleData.room || 'Main Hall',
          invigilatorFaculty: 'Unassigned'
        }]
      });
      addToast('success', 'Schedule Saved', 'Exam schedule slot created successfully.');
      setExamSchedules(prev => [...prev, { ...scheduleData, id: `sch_${Date.now()}` }]);
    } catch (err: any) {
      addToast('error', 'API Error', err.message || 'Failed to save exam schedule.');
    }
  };

  const handleUpdateExamSchedule = async (id: string, updates: Partial<ExamSchedule>) => {
    // Legacy client updates
    setExamSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteExamSchedule = async (id: string) => {
    setExamSchedules(prev => prev.filter(s => s.id !== id));
  };

  return (
    <ExaminationContext.Provider
      value={{
        exams,
        examMarks,
        examSchedules,
        addExam: handleAddExam,
        updateExam: handleUpdateExam,
        deleteExam: handleDeleteExam,
        saveMarks: handleSaveMarks,
        addExamSchedule: handleAddExamSchedule,
        updateExamSchedule: handleUpdateExamSchedule,
        deleteExamSchedule: handleDeleteExamSchedule,
        refreshExamData
      }}
    >
      {children}
    </ExaminationContext.Provider>
  );
};

export const useExamination = () => {
  const context = useContext(ExaminationContext);
  if (context === undefined) {
    throw new Error('useExamination must be used within an ExaminationProvider');
  }
  return context;
};
