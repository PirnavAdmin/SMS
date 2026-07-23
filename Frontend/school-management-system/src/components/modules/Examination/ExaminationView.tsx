import React, { useState } from 'react';
import { Award, Plus, Save, Printer, Edit, Trash2, X } from 'lucide-react';
import { Student, ExamSetup } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { PrintableReportCard } from './PrintableReportCard';
import { ConfirmModal } from '../../common/ConfirmModal';

export const ExaminationView: React.FC = () => {
  const { exams, students, addExam, updateExam, deleteExam, saveMarks } = useData();
  const { addToast } = useToast();

  const [selectedExam, setSelectedExam] = useState<ExamSetup | null>(exams[0] || null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [subject, setSubject] = useState('Mathematics');
  const [marksState, setMarksState] = useState<Record<string, number>>({
    'STU-001': 95,
    'STU-002': 98,
    'STU-003': 85
  });

  // Exam CRUD modals
  const [isExamFormOpen, setIsExamFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSetup | null>(null);
  const [deletingExam, setDeletingExam] = useState<ExamSetup | null>(null);

  const [examFormData, setExamFormData] = useState<Partial<ExamSetup>>({
    name: '',
    academicYear: '2025-2026',
    className: 'Class 10',
    startDate: '2026-09-10',
    endDate: '2026-09-22',
    status: 'Scheduled'
  });

  const handleOpenAddExam = () => {
    setEditingExam(null);
    setExamFormData({
      name: '',
      academicYear: '2025-2026',
      className: 'Class 10',
      startDate: '2026-09-10',
      endDate: '2026-09-22',
      status: 'Scheduled'
    });
    setIsExamFormOpen(true);
  };

  const handleOpenEditExam = (e: ExamSetup) => {
    setEditingExam(e);
    setExamFormData(e);
    setIsExamFormOpen(true);
  };

  const handleExamSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!examFormData.name) return;

    if (editingExam) {
      updateExam(editingExam.id, examFormData);
      addToast('success', 'Exam Updated', `Updated ${examFormData.name}`);
    } else {
      addExam(examFormData as Omit<ExamSetup, 'id'>);
      addToast('success', 'Exam Scheduled', `Created ${examFormData.name}`);
    }
    setIsExamFormOpen(false);
  };

  const handleSaveMarks = () => {
    if (!selectedExam) return;

    const entries = Object.entries(marksState).map(([stId, score]) => {
      let grade = 'F';
      if (score >= 90) grade = 'A+';
      else if (score >= 80) grade = 'A';
      else if (score >= 70) grade = 'B';
      else if (score >= 60) grade = 'C';

      return {
        examId: selectedExam.id,
        studentId: stId,
        subject,
        marksObtained: score,
        totalMarks: 100,
        grade
      };
    });

    saveMarks(entries);
    addToast('success', 'Marks Published', `Saved ${subject} marks for ${selectedExam.name}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" /> Examination & Report Cards
          </h2>
          <p className="text-xs text-slate-500">Schedule examinations, input subject marks, calculate grades & generate official report cards</p>
        </div>

        <button
          onClick={handleOpenAddExam}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Schedule New Exam
        </button>
      </div>

      {/* Exam List Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map(ex => (
          <div
            key={ex.id}
            onClick={() => setSelectedExam(ex)}
            className={`glass-card p-5 rounded-2xl cursor-pointer transition-all border ${
              selectedExam?.id === ex.id
                ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20'
                : 'hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">{ex.status}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenEditExam(ex); }}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-brand-600"
                  title="Edit Exam"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingExam(ex); }}
                  className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600"
                  title="Delete Exam"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{ex.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Class: {ex.className} • {ex.startDate} to {ex.endDate}</p>
          </div>
        ))}
      </div>

      {/* Marks Entry Grid */}
      {selectedExam && (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Marks Entry Matrix: {selectedExam.name}</h3>
              <p className="text-xs text-slate-500">Target Grade: {selectedExam.className}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Subject:</span>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="English">English</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              <button
                onClick={handleSaveMarks}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Marks
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Marks Obtained (/100)</th>
                  <th className="py-3 px-4">Grade preview</th>
                  <th className="py-3 px-4 text-right">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {students.map(st => {
                  const score = marksState[st.id] ?? 85;
                  let grade = 'A+';
                  if (score < 90 && score >= 80) grade = 'A';
                  if (score < 80 && score >= 70) grade = 'B';
                  if (score < 70) grade = 'C';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={st.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <span className="font-bold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{st.rollNo}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          max={100}
                          min={0}
                          value={score}
                          onChange={e => setMarksState({ ...marksState, [st.id]: Number(e.target.value) })}
                          className="w-24 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{grade}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForReport(st)}
                          className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold hover:bg-brand-100 flex items-center gap-1.5 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" /> Printable Report Card
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Exam Form Modal */}
      {isExamFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExam ? 'Edit Examination Setup' : 'Schedule New Examination'}
              </h3>
              <button onClick={() => setIsExamFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExamSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination 2026"
                  value={examFormData.name}
                  onChange={e => setExamFormData({ ...examFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={examFormData.academicYear}
                    onChange={e => setExamFormData({ ...examFormData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Class</label>
                  <select
                    value={examFormData.className}
                    onChange={e => setExamFormData({ ...examFormData, className: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={examFormData.startDate}
                    onChange={e => setExamFormData({ ...examFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={examFormData.endDate}
                    onChange={e => setExamFormData({ ...examFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  value={examFormData.status}
                  onChange={e => setExamFormData({ ...examFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsExamFormOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md">
                  {editingExam ? 'Save Changes' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PrintableReportCard
        student={selectedStudentForReport}
        exam={selectedExam}
        isOpen={!!selectedStudentForReport}
        onClose={() => setSelectedStudentForReport(null)}
      />

      <ConfirmModal
        isOpen={!!deletingExam}
        title="Delete Examination"
        message={`Are you sure you want to delete ${deletingExam?.name}?`}
        onConfirm={() => {
          if (deletingExam) {
            deleteExam(deletingExam.id);
            addToast('success', 'Exam Deleted');
            setDeletingExam(null);
          }
        }}
        onCancel={() => setDeletingExam(null)}
      />
    </div>
  );
};
