import { useData } from '../../../../context/DataContext';
import { ExamSetup } from '../../../../types';

export function useExaminations() {
  const { exams, addExam, updateExam, deleteExam } = useData();

  const handleAddExam = (examData: Omit<ExamSetup, 'id'>) => {
    const id = 'EXM-' + Math.floor(10 + Math.random() * 90);
    addExam({ ...examData, id } as any);
    return id;
  };

  const handleUpdateExam = (id: string, updates: Partial<ExamSetup>) => {
    updateExam(id, updates);
  };

  const handleDeleteExam = (id: string) => {
    deleteExam(id);
  };

  return {
    exams,
    handleAddExam,
    handleUpdateExam,
    handleDeleteExam
  };
}
