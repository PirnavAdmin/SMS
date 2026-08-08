import React, { useState, useEffect, useMemo } from 'react';
import { Award, Save, AlertTriangle, Plus, Trash2, ArrowRight } from 'lucide-react';
import { ExamGeneralForm } from './components/ExamGeneralForm';
import { ExamSubjectConfiguration } from './components/ExamSubjectConfiguration';
import { ExamSetup as ExamSetupType, SubjectItem } from '../../../types';
import { Panel } from './components/SharedUI';
import { useData } from '../../../context/DataContext';

interface ExamSetupProps {
  exam: ExamSetupType | null;
  exams?: ExamSetupType[];
  selectedExamId?: string;
  onSelectExam?: (id: string) => void;
  onCreateNewExam?: () => void;
  onDeleteExam?: () => void;
  classOptions: string[];
  subjects: SubjectItem[];
  selectedAcademicYear: string;
  selectedBranch: string;
  onSaveSetup: (updates: Partial<ExamSetupType>, showToast?: boolean) => void;
  onNavigateNext: () => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const ExamSetup: React.FC<ExamSetupProps> = ({
  exam,
  exams = [],
  selectedExamId = '',
  onSelectExam,
  onCreateNewExam,
  onDeleteExam,
  classOptions,
  subjects,
  selectedAcademicYear,
  selectedBranch,
  onSaveSetup,
  onNavigateNext,
  addToast
}) => {
  const { academicClasses } = useData();
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'subjects'>('general');
  const [formData, setFormData] = useState<Partial<ExamSetupType>>({
    name: '',
    examType: 'Unit Test',
    applicableClasses: [],
    startDate: '',
    endDate: '',
    status: 'Scheduled',
    publishStatus: 'Draft',
    marksConfig: {
      maxMarks: 100,
      passMarks: 35,
      subjectWiseConfig: {}
    } as any
  });

  // Sync state if selected exam changes
  useEffect(() => {
    if (exam) {
      setFormData({
        ...exam,
        applicableClasses: exam.applicableClasses || [exam.className || 'Class 10'],
        marksConfig: exam.marksConfig || {
          maxMarks: 100,
          passMarks: 35,
          subjectWiseConfig: {}
        }
      });
    }
  }, [exam]);

  const handleUpdateForm = (updates: any) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };
      return next;
    });
  };

  const handleUpdateSubjectConfig = (subjectName: string, maxMarks: number, passMarks: number) => {
    const config = formData.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
    const subjectWise = { ...(config.subjectWiseConfig || {}) };
    subjectWise[subjectName] = { maxMarks, passMarks };
    
    setFormData(prev => ({
      ...prev,
      marksConfig: {
        ...config,
        subjectWiseConfig: subjectWise
      }
    }));
  };

  const handleToggleSubject = (subjectName: string) => {
    const config = formData.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
    const subjectWise = { ...(config.subjectWiseConfig || {}) };
    
    if (subjectWise[subjectName]) {
      delete subjectWise[subjectName];
    } else {
      subjectWise[subjectName] = { maxMarks: config.maxMarks || 100, passMarks: config.passMarks || 35 };
    }

    setFormData(prev => ({
      ...prev,
      marksConfig: {
        ...config,
        subjectWiseConfig: subjectWise
      }
    }));
  };

  const handleSaveGeneral = () => {
    if (!formData.name?.trim()) {
      addToast('warning', 'Validation Warning', 'Please enter an exam name.');
      return;
    }
    onSaveSetup(formData);
    setActiveSubTab('subjects');
  };

  const handleSaveSubjects = () => {
    if (!formData.name?.trim()) {
      addToast('warning', 'Validation Warning', 'Please enter an exam name.');
      return;
    }
    onSaveSetup(formData);
    onNavigateNext();
  };

  const activeSubjects = Object.keys(formData.marksConfig?.subjectWiseConfig || {});
  const maxMarksMap: Record<string, number> = {};
  const passMarksMap: Record<string, number> = {};
  activeSubjects.forEach(s => {
    const item = formData.marksConfig?.subjectWiseConfig?.[s] || { maxMarks: 100, passMarks: 35 };
    maxMarksMap[s] = item.maxMarks;
    passMarksMap[s] = item.passMarks;
  });

  const classSubjects = useMemo(() => {
    const appClasses = formData.applicableClasses || [];
    if (appClasses.length === 0) {
      return subjects.map(s => s.name);
    }
    const uniqueSubjects = new Set<string>();
    appClasses.forEach(className => {
      const matchedClass = academicClasses.find(c => c.name === className);
      if (matchedClass && matchedClass.subjects) {
        matchedClass.subjects.forEach(sub => {
          const name = typeof sub === 'string' ? sub : (sub as any).name;
          if (name) uniqueSubjects.add(name);
        });
      }
    });
    if (uniqueSubjects.size === 0) {
      return subjects.map(s => s.name);
    }
    return Array.from(uniqueSubjects);
  }, [formData.applicableClasses, academicClasses, subjects]);

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Exam Configuration"
        //description="Configure exam name, dates, target classes, and subject mark thresholds."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {exams.length > 0 && onSelectExam && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Select Exam to Edit:</span>
                <select
                  value={selectedExamId}
                  onChange={e => onSelectExam(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[200px] h-[34px] shadow-xs"
                >
                  <option value="">-- Select Examination --</option>
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name || 'Untitled Exam'} ({e.status || 'Draft'})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {onCreateNewExam && (
              <button
                type="button"
                onClick={onCreateNewExam}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-sm shadow-sky-600/20 flex items-center gap-1.5 transition cursor-pointer h-[34px]"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Create New Exam</span>
              </button>
            )}
            {onDeleteExam && selectedExamId && (
              <button
                type="button"
                onClick={onDeleteExam}
                className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/30 transition cursor-pointer h-[34px] w-[34px] flex items-center justify-center shrink-0"
                title="Delete Selected Exam"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      >


        {!exam?.id && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Please create or select an examination to configure setup.</span>
          </div>
        )}

        {/* Subtabs wizard */}
        <div className="flex gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
              activeSubTab === 'general'
                ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            1. General Form
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('subjects')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
              activeSubTab === 'subjects'
                ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            2. Exam Subjects
          </button>
        </div>

        {activeSubTab === 'general' ? (
          <div className="space-y-4">
            <ExamGeneralForm
              name={formData.name || ''}
              examType={formData.examType || 'Unit Test'}
              term={(formData as any).term || ''}
              startDate={formData.startDate || ''}
              endDate={formData.endDate || ''}
              applicableClasses={formData.applicableClasses || []}
              classOptions={classOptions}
              selectedAcademicYear={selectedAcademicYear}
              selectedBranch={selectedBranch}
              onChange={handleUpdateForm}
            />
            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSaveGeneral}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow-sm shadow-sky-600/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save & Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ExamSubjectConfiguration
              subjects={classSubjects}
              activeSubjects={activeSubjects}
              maxMarksMap={maxMarksMap}
              passMarksMap={passMarksMap}
              onToggleSubject={handleToggleSubject}
              onUpdateMarks={handleUpdateSubjectConfig}
            />
            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSaveSubjects}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save & Proceed to Schedule
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};
export default ExamSetup;
