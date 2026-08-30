import React, { useState, useEffect, useMemo } from 'react';
import { Award, Save, AlertTriangle, Plus, Trash2, ArrowRight } from 'lucide-react';
import { ExamGeneralForm } from './components/ExamGeneralForm';
import { ExamSubjectConfiguration } from './components/ExamSubjectConfiguration';
import { ExamSetup as ExamSetupType, SubjectItem } from '../../../types';
import { Panel } from './components/SharedUI';
import { useData } from '../../../context/DataContext';
import { fetchExamSubjectsApi, saveExamSubjectsApi } from '../../../api/examination';

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
  options?: any;
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
  addToast,
  options
}) => {
  const { academicClasses } = useData();
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'subjects'>('general');
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [originalSubjects, setOriginalSubjects] = useState<Record<string, any[]>>({});

  const [formData, setFormData] = useState<Partial<ExamSetupType>>({
    name: exam?.name || '',
    examType: exam?.examType || (exam as any)?.assessmentType || '',
    term: (exam as any)?.term || (exam as any)?.academicTerm || '',
    applicableClasses: exam?.applicableClasses || (exam as any)?.classes || (exam?.className ? [exam.className] : []),
    startDate: exam?.startDate || '',
    endDate: exam?.endDate || '',
    defaultStartTime: exam?.defaultStartTime || '09:00',
    defaultEndTime: exam?.defaultEndTime || '12:00',
    status: exam?.status || 'Scheduled',
    publishStatus: exam?.publishStatus || 'Draft',
    marksConfig: {
      maxMarks: 100,
      passMarks: 35,
      subjectWiseConfig: {},
      classWiseConfig: {}
    } as any
  });

  // Sync state if selected exam changes
  useEffect(() => {
    const loadAllSubjects = async (classesToProcess?: string[]) => {
      if (!exam?.id) return;
      setLoadingSubjects(true);
      try {
        const appClasses = classesToProcess || (Array.isArray(exam.applicableClasses) && exam.applicableClasses.length > 0
          ? exam.applicableClasses
          : (Array.isArray((exam as any).classes) && (exam as any).classes.length > 0
              ? (exam as any).classes
              : (exam.className ? [exam.className] : [])));
        const classWise: Record<string, Record<string, { maxMarks: number; passMarks: number; subjectCode?: string; isActive?: boolean }>> = {};
        const origMap: Record<string, any[]> = {};

        // Process each applicable class
        await Promise.all(appClasses.map(async (cls: string) => {
          const matchedClass = academicClasses.find(c => c.name === cls);
          const rawSubs = matchedClass?.subjects && matchedClass.subjects.length > 0
            ? matchedClass.subjects.map((sub: any) => typeof sub === 'string' ? sub : (sub.subjectName || sub.name || sub.subjectCode || sub.code || '')).filter(Boolean)
            : [];

          // Deduplicate valid class subjects
          const seen = new Set<string>();
          const validClassSubs = rawSubs.filter(sName => {
            const lower = sName.toLowerCase();
            if (seen.has(lower)) return false;
            seen.add(lower);
            return true;
          });

          // Fetch previously saved subjects from API if available
          let apiSubs: any[] = [];
          if (exam?.id && /^\d+$/.test(exam.id)) {
            try {
              const apiRes = await fetchExamSubjectsApi(exam.id, cls);
              if (apiRes && apiRes.success && Array.isArray(apiRes.data?.subjects)) {
                apiSubs = apiRes.data.subjects;
              }
            } catch (e) {
              // Ignore fetch error
            }
          }

          const existingClassWise = (exam.marksConfig as any)?.classWiseConfig?.[cls];

          const subList: any[] = validClassSubs.map(sName => {
            const apiMatch = apiSubs.find(s => s.subjectName?.toLowerCase() === sName.toLowerCase());
            const existing = existingClassWise ? existingClassWise[sName] : undefined;

            // Start strictly unselected (isActive: false)
            // Only active if explicitly selected in this exam configuration
            let isAct = false;
            if (existing && existing.isActive === true) {
              isAct = true;
            } else if (apiMatch && (apiMatch.isActive === true || apiMatch.isExamSubject === true || apiMatch.selected === true)) {
              isAct = true;
            }

            const maxM = existing?.maxMarks || apiMatch?.maxMarks || 100;
            const passM = existing?.passMarks || apiMatch?.passMarks || 35;
            const sCode = apiMatch?.subjectCode || `${sName.substring(0, 3).toUpperCase()}-101`;

            return {
              subjectCode: sCode,
              subjectName: sName,
              maxMarks: maxM,
              passMarks: passM,
              isActive: isAct
            };
          });

          origMap[cls] = subList;

          const subMap: Record<string, { maxMarks: number; passMarks: number; subjectCode?: string; isActive?: boolean }> = {};
          subList.forEach(s => {
            if (s.isActive) {
              subMap[s.subjectName] = {
                maxMarks: s.maxMarks,
                passMarks: s.passMarks,
                subjectCode: s.subjectCode,
                isActive: true
              };
            }
          });
          classWise[cls] = subMap;
        }));

        setOriginalSubjects(origMap);

        const aggregated: Record<string, { maxMarks: number; passMarks: number }> = {};
        Object.values(classWise).forEach(cw => {
          Object.entries(cw).forEach(([sub, conf]) => {
            aggregated[sub] = { maxMarks: conf.maxMarks, passMarks: conf.passMarks };
          });
        });

        setFormData(prev => ({
          ...prev,
          marksConfig: {
            ...(prev.marksConfig || {}),
            maxMarks: exam.marksConfig?.maxMarks || 100,
            passMarks: exam.marksConfig?.passMarks || 35,
            subjectWiseConfig: aggregated,
            classWiseConfig: classWise
          } as any
        }));
      } catch (err: any) {
        addToast('error', 'Error Loading Subjects', err.message || 'Could not fetch subjects.');
      } finally {
        setLoadingSubjects(false);
      }
    };

    if (exam) {
      const appClasses = Array.isArray(exam.applicableClasses) && exam.applicableClasses.length > 0
        ? exam.applicableClasses
        : (Array.isArray((exam as any).classes) && (exam as any).classes.length > 0
            ? (exam as any).classes
            : (exam.className ? [exam.className] : []));

      const termVal = (exam as any).term || (exam as any).academicTerm || (exam as any).termCycle || '';

      setFormData({
        id: exam.id,
        name: exam.name || '',
        examType: exam.examType || (exam as any).assessmentType || 'Unit Test',
        term: termVal,
        applicableClasses: appClasses,
        startDate: exam.startDate || '',
        endDate: exam.endDate || '',
        defaultStartTime: exam.defaultStartTime || '09:00',
        defaultEndTime: exam.defaultEndTime || '12:00',
        status: exam.status || 'Scheduled',
        publishStatus: exam.publishStatus || 'Draft',
        marksConfig: {
          maxMarks: exam.marksConfig?.maxMarks || 100,
          passMarks: exam.marksConfig?.passMarks || 35,
          subjectWiseConfig: exam.marksConfig?.subjectWiseConfig || {},
          classWiseConfig: (exam.marksConfig as any)?.classWiseConfig || {}
        } as any
      });
      loadAllSubjects(appClasses);
    } else {
      setFormData({
        name: '',
        examType: '',
        term: '',
        applicableClasses: [],
        startDate: '',
        endDate: '',
        defaultStartTime: '09:00',
        defaultEndTime: '12:00',
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
  }, [exam?.id, exam?.name, (exam as any)?.term, (exam as any)?.academicTerm, exam?.applicableClasses]);

  const handleUpdateForm = (updates: any) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };

      if (updates.applicableClasses) {
        const nextClasses: string[] = updates.applicableClasses;
        const currentClassWise = { ...((prev.marksConfig as any)?.classWiseConfig || {}) };
        const updatedClassWise: Record<string, Record<string, { maxMarks: number; passMarks: number }>> = {};

        nextClasses.forEach(cls => {
          if (currentClassWise[cls] && Object.keys(currentClassWise[cls]).length > 0) {
            updatedClassWise[cls] = currentClassWise[cls];
          } else {
            // New class: Start with NO subjects auto-selected (empty map)
            updatedClassWise[cls] = {};
          }
        });

        // Initialize originalSubjects for newly added classes as inactive (false)
        setOriginalSubjects(prevOrig => {
          const nextOrig = { ...prevOrig };
          nextClasses.forEach(cls => {
            if (!nextOrig[cls]) {
              const matchedClass = academicClasses.find(c => c.name === cls);
              let raw = matchedClass?.subjects && matchedClass.subjects.length > 0
                ? matchedClass.subjects.map((sub: any) => typeof sub === 'string' ? sub : (sub.subjectName || sub.name || sub.subjectCode || sub.code || '')).filter(Boolean)
                : (subjects || []).map(s => s.name);
              const seen = new Set<string>();
              const valid = raw.filter(name => {
                const lower = name.toLowerCase();
                if (seen.has(lower)) return false;
                seen.add(lower);
                return true;
              });
              nextOrig[cls] = valid.map(sName => ({
                subjectCode: `${sName.substring(0, 3).toUpperCase()}-101`,
                subjectName: sName,
                maxMarks: 100,
                passMarks: 35,
                isActive: false
              }));
            }
          });
          return nextOrig;
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
    setOriginalSubjects(prev => {
      const list = prev[className] || [];
      const exists = list.some(sub => sub.subjectName.toLowerCase() === subjectName.toLowerCase());
      let updated: any[];
      if (exists) {
        updated = list.map(sub => {
          if (sub.subjectName.toLowerCase() === subjectName.toLowerCase()) {
            return { ...sub, maxMarks, passMarks };
          }
          return sub;
        });
      } else {
        updated = [
          ...list,
          {
            subjectCode: `${subjectName.substring(0, 3).toUpperCase()}-101`,
            subjectName,
            maxMarks,
            passMarks,
            isActive: true
          }
        ];
      }
      return { ...prev, [className]: updated };
    });

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
    setOriginalSubjects(prev => {
      const list = prev[className] || [];
      const exists = list.some(s => s.subjectName.toLowerCase() === subjectName.toLowerCase());
      let updated: any[];
      if (exists) {
        updated = list.map(sub => {
          if (sub.subjectName.toLowerCase() === subjectName.toLowerCase()) {
            return { ...sub, isActive: !sub.isActive };
          }
          return sub;
        });
      } else {
        updated = [
          ...list,
          {
            subjectCode: `${subjectName.substring(0, 3).toUpperCase()}-101`,
            subjectName,
            maxMarks: 100,
            passMarks: 35,
            isActive: true
          }
        ];
      }
      return { ...prev, [className]: updated };
    });

    setFormData(prev => {
      const config = prev.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
      const classWise = { ...((config as any).classWiseConfig || {}) };
      const currentClassSubjects = { ...(classWise[className] || {}) };

      if (currentClassSubjects[subjectName]) {
        delete currentClassSubjects[subjectName];
      } else {
        const subObj = originalSubjects[className]?.find(s => s.subjectName.toLowerCase() === subjectName.toLowerCase());
        currentClassSubjects[subjectName] = { 
          maxMarks: subObj?.maxMarks || config.maxMarks || 100, 
          passMarks: subObj?.passMarks || config.passMarks || 35 
        };
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
    setOriginalSubjects(prev => {
      const list = prev[className] || [];
      const subjectMap = new Map(list.map(s => [s.subjectName.toLowerCase(), s]));

      const updated = subjectsList.map(sName => {
        const existing = subjectMap.get(sName.toLowerCase());
        return {
          subjectCode: existing?.subjectCode || `${sName.substring(0, 3).toUpperCase()}-101`,
          subjectName: sName,
          maxMarks: existing?.maxMarks || 100,
          passMarks: existing?.passMarks || 35,
          isActive: true
        };
      });

      return { ...prev, [className]: updated };
    });

    setFormData(prev => {
      const config = prev.marksConfig || { maxMarks: 100, passMarks: 35, subjectWiseConfig: {} };
      const classWise = { ...((config as any).classWiseConfig || {}) };
      const currentClassSubjects: Record<string, { maxMarks: number; passMarks: number }> = {};

      subjectsList.forEach(s => {
        const subObj = originalSubjects[className]?.find(sub => sub.subjectName.toLowerCase() === s.toLowerCase());
        currentClassSubjects[s] = classWise[className]?.[s] || { 
          maxMarks: subObj?.maxMarks || config.maxMarks || 100, 
          passMarks: subObj?.passMarks || config.passMarks || 35 
        };
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
    setOriginalSubjects(prev => {
      const list = prev[className] || [];
      const updated = list.map(sub => ({ ...sub, isActive: false }));
      return { ...prev, [className]: updated };
    });

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
      addToast('warning', 'Validation Warning', 'Please enter an examination name.');
      return;
    }
    if (!formData.examType?.trim()) {
      addToast('warning', 'Validation Warning', 'Please select or enter an assessment type.');
      return;
    }
    if (!formData.term?.trim()) {
      addToast('warning', 'Validation Warning', 'Please enter an academic term (e.g. Term 1, Mid-Term, Annual).');
      return;
    }
    if (!formData.applicableClasses || formData.applicableClasses.length === 0) {
      addToast('warning', 'Validation Warning', 'Please select at least one applicable class.');
      return;
    }
    onSaveSetup(formData);
    setActiveSubTab('subjects');
  };

  const handleSaveSubjects = async () => {
    if (!exam?.id) return;
    setLoadingSubjects(true);
    try {
      const appClasses = formData.applicableClasses || [];
      const classWise = (formData.marksConfig as any)?.classWiseConfig || {};

      for (const cls of appClasses) {
        const origList = originalSubjects[cls] || [];
        const classSubsMap = classWise[cls] || {};

        // Find matched class subjects or all global subjects
        const matchedClass = academicClasses.find(c => c.name === cls);
        const defaultSubNames = matchedClass?.subjects && matchedClass.subjects.length > 0
          ? matchedClass.subjects.map((sub: any) => typeof sub === 'string' ? sub : (sub.subjectName || sub.name || sub.subjectCode || sub.code || '')).filter(Boolean)
          : [];

        const allKnownNames = Array.from(new Set([
          ...origList.map(s => s.subjectName),
          ...Object.keys(classSubsMap),
          ...defaultSubNames
        ])).filter(Boolean);

        const subjectsPayload = allKnownNames.map(sName => {
          const orig = origList.find(s => s.subjectName.toLowerCase() === sName.toLowerCase());
          const activeConfig = classSubsMap[sName];
          const isActive = activeConfig !== undefined;
          const maxMarks = activeConfig?.maxMarks || orig?.maxMarks || 100;
          const passMarks = activeConfig?.passMarks || orig?.passMarks || 35;
          const subjectCode = orig?.subjectCode || `${sName.substring(0, 3).toUpperCase()}-101`;

          return {
            subjectCode,
            subjectName: sName,
            isActive: Boolean(isActive),
            maxMarks: Number(maxMarks) || 100,
            passMarks: Number(passMarks) || 35
          };
        });

        const payload = {
          examId: Number(exam.id),
          className: cls,
          subjects: subjectsPayload,
          proceedToSchedule: true
        };

        const response = await saveExamSubjectsApi(payload);
        if (!response || !response.success) {
          throw new Error(response?.message || `Failed to save subjects configuration for class ${cls}`);
        }
      }

      onSaveSetup(formData, false);
      addToast('success', 'Subjects Configurations Saved', 'Exam subject rules updated successfully.');
      onNavigateNext();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Failed to save subject configuration.');
    } finally {
      setLoadingSubjects(false);
    }
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
            {onCreateNewExam && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onCreateNewExam}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm shadow-sky-600/20 cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create New Exam
                </button>
              </div>
            )}
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
                  defaultStartTime={formData.defaultStartTime || '09:00'}
                  defaultEndTime={formData.defaultEndTime || '12:00'}
                  applicableClasses={formData.applicableClasses || []}
                  classOptions={classOptions}
                  selectedAcademicYear={selectedAcademicYear}
                  selectedBranch={selectedBranch}
                  onChange={handleUpdateForm}
                  assessmentTypesOptions={options?.assessmentTypes}
                  termCyclesOptions={options?.academicTerms}
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
                    startDate={formData.startDate}
                    endDate={formData.endDate}
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
