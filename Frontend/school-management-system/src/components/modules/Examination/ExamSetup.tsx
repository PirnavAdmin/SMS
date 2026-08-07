import React, { useState, useEffect } from 'react';
import { Award, Save, AlertTriangle, ArrowRight } from 'lucide-react';
import { ExamGeneralForm } from './components/ExamGeneralForm';
import { ExamSubjectConfiguration } from './components/ExamSubjectConfiguration';
import { ExamSetup as ExamSetupType, SubjectItem } from '../../../types';
import { Panel } from './components/SharedUI';
import { useData } from '../../../context/DataContext';
import { useMemo } from 'react';

interface ExamSetupProps {
  exam: ExamSetupType | null;
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
      if (updates.name !== undefined) {
        onSaveSetup(next, false);
      }
      return next;
    });
  };

  const handleToggleSubject = (subjectName: string) => {
    const prevClasses = formData.applicableClasses || [];
    const config = formData.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
    const subjectWise = config.subjectWiseConfig ? { ...config.subjectWiseConfig } : {};
    
    // Toggle active state
    if (subjectWise[subjectName]) {
      delete subjectWise[subjectName];
    } else {
      subjectWise[subjectName] = { maxMarks: 100, passMarks: 35 };
    }

    setFormData(prev => ({
      ...prev,
      marksConfig: {
        ...config,
        subjectWiseConfig: subjectWise
      }
    }));
  };

  const handleUpdateMarks = (subjectName: string, maxM: number, passM: number) => {
    const config = formData.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
    const subjectWise = config.subjectWiseConfig ? { ...config.subjectWiseConfig } : {};
    
    subjectWise[subjectName] = { maxMarks: maxM, passMarks: passM };

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
        title="Examination Setup Configuration"
        description="Configure exam name, start dates, select target classes, and set grading rules."
      >
        {!exam?.id && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Please select an examination from the <strong>"Selected Exam"</strong> dropdown above to view or configure setup, or click <strong>"+ New Exam"</strong>.</span>
          </div>
        )}

        {/* Subtabs wizard */}
        <div className="flex gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`px-3.5 py-2 rounded-xl border text-[11px] font-black uppercase tracking-[0.12em] transition ${
              activeSubTab === 'general'
                ? 'border-sky-600 bg-sky-600 text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            1. General Form
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('subjects')}
            className={`px-3.5 py-2 rounded-xl border text-[11px] font-black uppercase tracking-[0.12em] transition ${
              activeSubTab === 'subjects'
                ? 'border-sky-600 bg-sky-600 text-white shadow-md'
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
             <div className="flex justify-end items-center gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={handleSaveGeneral}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5" /> Save
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
              onUpdateMarks={handleUpdateMarks}
            />
            <div className="flex justify-between items-center pt-3 border-t gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('general')}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Back to General
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveSubjects}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};
export default ExamSetup;
