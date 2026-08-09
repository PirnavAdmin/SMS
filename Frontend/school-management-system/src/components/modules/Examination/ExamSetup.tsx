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
    examType: '',
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
      const appClasses = exam.applicableClasses || (exam.className ? [exam.className] : []);
      const existingClassWise = (exam.marksConfig as any)?.classWiseConfig || {};
      const existingSubjectWise = exam.marksConfig?.subjectWiseConfig || {};

      const initialClassWise: Record<string, Record<string, { maxMarks: number; passMarks: number }>> = {};
      appClasses.forEach(cls => {
        if (existingClassWise[cls]) {
          initialClassWise[cls] = { ...existingClassWise[cls] };
        } else {
          // Inherit default subjects from class definition
          const matchedClass = academicClasses.find(c => c.name === cls);
          const classSubs = matchedClass?.subjects && matchedClass.subjects.length > 0
            ? matchedClass.subjects.map((sub: any) => typeof sub === 'string' ? sub : (sub.name || ''))
            : Object.keys(existingSubjectWise);

          const subMap: Record<string, { maxMarks: number; passMarks: number }> = {};
          classSubs.forEach(s => {
            if (s) {
              subMap[s] = existingSubjectWise[s] || { maxMarks: 100, passMarks: 35 };
            }
          });
          initialClassWise[cls] = subMap;
        }
      });

      setFormData({
        ...exam,
        applicableClasses: appClasses,
        marksConfig: {
          maxMarks: exam.marksConfig?.maxMarks || 100,
          passMarks: exam.marksConfig?.passMarks || 35,
          subjectWiseConfig: exam.marksConfig?.subjectWiseConfig || {},
          classWiseConfig: initialClassWise
        } as any
      });
    } else {
      setFormData({
        name: '',
        examType: '',
        applicableClasses: [],
        startDate: '',
        endDate: '',
        status: 'Scheduled',
        publishStatus: 'Draft',
        marksConfig: {
          maxMarks: 100,
          passMarks: 35,
          subjectWiseConfig: {},
          classWiseConfig: {}
        } as any
      });
    }
  }, [exam, academicClasses]);

  const handleUpdateForm = (updates: any) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };

      // When applicableClasses change, synchronize classWiseConfig keys
      if (updates.applicableClasses) {
        const nextClasses: string[] = updates.applicableClasses;
        const currentClassWise = { ...((prev.marksConfig as any)?.classWiseConfig || {}) };
        const updatedClassWise: Record<string, Record<string, { maxMarks: number; passMarks: number }>> = {};

        nextClasses.forEach(cls => {
          if (currentClassWise[cls]) {
            updatedClassWise[cls] = currentClassWise[cls];
          } else {
            const matchedClass = academicClasses.find(c => c.name === cls);
            const classSubs = matchedClass?.subjects && matchedClass.subjects.length > 0
              ? matchedClass.subjects.map((sub: any) => typeof sub === 'string' ? sub : (sub.name || ''))
              : [];

            const subMap: Record<string, { maxMarks: number; passMarks: number }> = {};
            classSubs.forEach(s => {
              if (s) subMap[s] = { maxMarks: 100, passMarks: 35 };
            });
            updatedClassWise[cls] = subMap;
          }
        });

        const aggregatedSubjectWise: Record<string, { maxMarks: number; passMarks: number }> = {};
        Object.values(updatedClassWise).forEach(cw => {
          Object.entries(cw).forEach(([sub, conf]) => {
            aggregatedSubjectWise[sub] = conf;
          });
        });

        next.marksConfig = {
          ...(prev.marksConfig || { maxMarks: 100, passMarks: 35 }),
          classWiseConfig: updatedClassWise,
          subjectWiseConfig: aggregatedSubjectWise
        };
      }

      return next;
    });
  };

  const handleUpdateSubjectConfig = (className: string, subjectName: string, maxMarks: number, passMarks: number) => {
    setFormData(prev => {
      const config = prev.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
      const classWise = { ...((config as any).classWiseConfig || {}) };
      const currentClassSubjects = { ...(classWise[className] || {}) };

      currentClassSubjects[subjectName] = { maxMarks, passMarks };
      classWise[className] = currentClassSubjects;

      const aggregatedSubjectWise: Record<string, { maxMarks: number; passMarks: number }> = {};
      Object.values(classWise).forEach((cw: any) => {
        Object.entries(cw).forEach(([sub, conf]) => {
          aggregatedSubjectWise[sub] = conf as any;
        });
      });

      return {
        ...prev,
        marksConfig: {
          ...config,
          subjectWiseConfig: aggregatedSubjectWise,
          classWiseConfig: classWise
        } as any
      };
    });
  };

  const handleToggleSubject = (className: string, subjectName: string) => {
    setFormData(prev => {
      const config = prev.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
      const classWise = { ...((config as any).classWiseConfig || {}) };
      const currentClassSubjects = { ...(classWise[className] || {}) };

      if (currentClassSubjects[subjectName]) {
        delete currentClassSubjects[subjectName];
      } else {
        currentClassSubjects[subjectName] = { maxMarks: config.maxMarks || 100, passMarks: config.passMarks || 35 };
      }

      classWise[className] = currentClassSubjects;

      const aggregatedSubjectWise: Record<string, { maxMarks: number; passMarks: number }> = {};
      Object.values(classWise).forEach((cw: any) => {
        Object.entries(cw).forEach(([sub, conf]) => {
          aggregatedSubjectWise[sub] = conf as any;
        });
      });

      return {
        ...prev,
        marksConfig: {
          ...config,
          subjectWiseConfig: aggregatedSubjectWise,
          classWiseConfig: classWise
        } as any
      };
    });
  };

  const handleSelectAllForClass = (className: string, subjectsList: string[]) => {
    setFormData(prev => {
      const config = prev.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
      const classWise = { ...((config as any).classWiseConfig || {}) };
      const currentClassSubjects: Record<string, { maxMarks: number; passMarks: number }> = {};

      subjectsList.forEach(s => {
        currentClassSubjects[s] = classWise[className]?.[s] || { maxMarks: config.maxMarks || 100, passMarks: config.passMarks || 35 };
      });

      classWise[className] = currentClassSubjects;

      const aggregatedSubjectWise: Record<string, { maxMarks: number; passMarks: number }> = {};
      Object.values(classWise).forEach((cw: any) => {
        Object.entries(cw).forEach(([sub, conf]) => {
          aggregatedSubjectWise[sub] = conf as any;
        });
      });

      return {
        ...prev,
        marksConfig: {
          ...config,
          subjectWiseConfig: aggregatedSubjectWise,
          classWiseConfig: classWise
        } as any
      };
    });
  };

  const handleClearAllForClass = (className: string) => {
    setFormData(prev => {
      const config = prev.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
      const classWise = { ...((config as any).classWiseConfig || {}) };
      classWise[className] = {};

      const aggregatedSubjectWise: Record<string, { maxMarks: number; passMarks: number }> = {};
      Object.values(classWise).forEach((cw: any) => {
        Object.entries(cw).forEach(([sub, conf]) => {
          aggregatedSubjectWise[sub] = conf as any;
        });
      });

      return {
        ...prev,
        marksConfig: {
          ...config,
          subjectWiseConfig: aggregatedSubjectWise,
          classWiseConfig: classWise
        } as any
      };
    });
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

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Exam Configuration"
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


        {!exam?.id ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-sky-900/60">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Select or Create an Examination
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select an existing examination from the dropdown above to edit, or click <strong>+ Create New Exam</strong> to start configuring exam details and subjects.
              </p>
            </div>
            {/* {onCreateNewExam && (
              <button
                type="button"
                onClick={onCreateNewExam}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create New Exam
              </button>
            )} */}
          </div>
        ) : (
          <>
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
                1. Exam Details
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
                2. Subjects & Marks
              </button>
            </div>

            {activeSubTab === 'general' ? (
              <div className="space-y-4">
                <ExamGeneralForm
                  name={formData.name || ''}
                  examType={formData.examType || ''}
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
              (formData.applicableClasses || []).length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/60">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No Applicable Classes Selected
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Please select at least one class in <strong>1. Exam Details</strong> to configure examination subjects.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('general')}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Go to Exam Details & Select Classes
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <ExamSubjectConfiguration
                    applicableClasses={formData.applicableClasses || []}
                    classWiseConfig={(formData.marksConfig as any)?.classWiseConfig || {}}
                    onToggleSubject={handleToggleSubject}
                    onUpdateMarks={handleUpdateSubjectConfig}
                    onSelectAllForClass={handleSelectAllForClass}
                    onClearAllForClass={handleClearAllForClass}
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
              )
            )}
          </>
        )}
      </Panel>
    </div>
  );
};
export default ExamSetup;
