import { useData } from '../../../../context/DataContext';
import { ExamSchedule } from '../../../../types';

export function useExamSchedule() {
  const { examSchedules, addExamSchedule, updateExamSchedule, deleteExamSchedule, academicClasses } = useData();

  const getSchedulesForExam = (examId: string) => {
    return examSchedules.filter(s => s.examId === examId);
  };

  const handleApplyToAllSections = (
    examId: string,
    className: string,
    subject: string,
    scheduleData: Omit<ExamSchedule, 'id' | 'examId' | 'className' | 'section' | 'subject'>
  ) => {
    const classObj = academicClasses.find(c => c.name === className);
    const sections = classObj?.sections || ['A'];

    sections.forEach(sec => {
      const existing = examSchedules.find(
        s => s.examId === examId && s.className === className && s.section === sec && s.subject === subject
      );

      if (existing) {
        updateExamSchedule(existing.id, {
          ...scheduleData
        });
      } else {
        addExamSchedule({
          examId,
          className,
          section: sec,
          subject,
          ...scheduleData
        } as any);
      }
    });
  };

  return {
    examSchedules,
    addExamSchedule,
    updateExamSchedule,
    deleteExamSchedule,
    getSchedulesForExam,
    handleApplyToAllSections
  };
}
