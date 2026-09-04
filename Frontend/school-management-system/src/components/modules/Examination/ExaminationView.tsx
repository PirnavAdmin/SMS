// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Settings, 
  Calendar, 
  Award, 
  CheckSquare, 
  Edit3,
  Trash2
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { 
  fetchExamOptionsApi, 
  fetchExamByIdApi, 
  saveExamDetailsApi,
  fetchExamSubjectsApi,
  deleteExamApi
} from '../../../api/examination';

// Subcomponents
import { ExamSetup } from './ExamSetup';
import { ExamSchedule } from './ExamSchedule';
import { MarksEntry } from './MarksEntry';
import { ResultsAndReports } from './ResultsAndReports';
import { GradingConfiguration } from './GradingConfiguration';

interface ExaminationViewProps {
  initialTab?: string;
}

export const ExaminationView: React.FC<ExaminationViewProps> = ({ initialTab = 'setup' }) => {
  const { academicClasses, subjects, staff, students, gradeConfigurations } = useData();
  const { selectedAcademicYear, selectedBranch } = useAuth();
  const { addToast } = useToast();
  
  // Dynamic API state
  const [options, setOptions] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Selected state: Starts empty with clear prompt
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Persistent selection state for Marks Entry tab
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const loadOptions = async (showProgress = true) => {
    if (showProgress) setLoading(true);
    try {
      const response = await fetchExamOptionsApi();
      if (response && response.success && response.data) {
        setOptions(response.data);
        const serverExams = (response.data.existingExams || []).map((e: any) => ({
          id: e.examId.toString(),
          name: e.examName,
          status: e.status || 'Scheduled',
          displayText: e.displayText,
          academicYear: selectedAcademicYear || '',
          examType: e.assessmentType || e.examType || 'Unit Test',
          term: e.academicTerm || e.term || '',
          academicTerm: e.academicTerm || e.term || '',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          applicableClasses: Array.isArray(e.applicableClasses) ? e.applicableClasses : []
        }));
        
        setExams(serverExams);
        // Only keep selected exam if it still exists, otherwise leave empty for user selection
        setSelectedExamId(prev => {
          if (prev && serverExams.some(e => e.id === prev)) {
            return prev;
          }
          return '';
        });
      } else {
        setExams([]);
        setSelectedExamId('');
        setActiveExam(null);
      }
    } catch (err: any) {
      // Clean fallback on connection issue
      setExams([]);
      setSelectedExamId('');
      setActiveExam(null);
    } finally {
      if (showProgress) setLoading(false);
    }
  };

  const loadExamDetails = async (id: string) => {
    if (!id || id === 'new' || !/^\d+$/.test(id)) {
      const local = exams.find(e => e.id === id);
      if (local) {
        setActiveExam({
          ...local,
          marksConfig: local.marksConfig || { maxMarks: 100, passMarks: 35, classWiseConfig: {}, subjectWiseConfig: {} }
        });
      }
      return;
    }
    setLoadingDetails(true);
    try {
      const response = await fetchExamByIdApi(id);
      if (response && response.success && response.data) {
        const d = response.data;
        const appClasses = Array.isArray(d.applicableClasses) && d.applicableClasses.length > 0
          ? d.applicableClasses
          : (Array.isArray(d.classes) && d.classes.length > 0
              ? d.classes
              : (Array.isArray(d.assignedClasses) && d.assignedClasses.length > 0
                  ? d.assignedClasses
                  : (d.className ? [d.className] : [])));
        const termVal = d.academicTerm || d.term || d.termCycle || '';
        
        // Fetch in parallel for all applicable classes to build classWiseConfig
        const classWise: Record<string, Record<string, { maxMarks: number; passMarks: number; subjectCode?: string; isActive?: boolean }>> = {};
        const subjectWise: Record<string, { maxMarks: number; passMarks: number }> = {};
        
        const fetches = appClasses.map(async (cls: string) => {
          try {
            const res = await fetchExamSubjectsApi(id, cls);
            const subMap: Record<string, { maxMarks: number; passMarks: number; subjectCode?: string; isActive?: boolean }> = {};
            if (res && res.success && res.data?.subjects) {
              res.data.subjects.forEach((s: any) => {
                if (s.isExamSubject === true || s.selected === true || s.isActive === true || s.isActive === undefined) {
                  const conf = { 
                    maxMarks: s.maxMarks || 100, 
                    passMarks: s.passMarks || 35,
                    subjectCode: s.subjectCode,
                    isActive: true
                  };
                  subMap[s.subjectName] = conf;
                  subjectWise[s.subjectName] = conf;
                }
              });
            }
            classWise[cls] = subMap;
          } catch (e) {
            // Ignore individual class fetch error
          }
        });

        await Promise.all(fetches);

        setActiveExam({
          id: (d.examId || id).toString(),
          name: d.examName || d.name || '',
          examType: d.assessmentType || d.examType || 'Unit Test',
          term: termVal,
          academicTerm: termVal,
          startDate: d.startDate || '',
          endDate: d.endDate || '',
          applicableClasses: appClasses,
          status: d.status || 'Scheduled',
          publishStatus: d.publishStatus || 'Draft',
          marksConfig: {
            maxMarks: 100,
            passMarks: 35,
            classWiseConfig: classWise,
            subjectWiseConfig: subjectWise
          }
        });
      } else {
        const matched = exams.find(e => e.id === id);
        if (matched) {
          setActiveExam({
            ...matched,
            marksConfig: (matched as any).marksConfig || { maxMarks: 100, passMarks: 35, classWiseConfig: {}, subjectWiseConfig: {} }
          });
        }
      }
    } catch (err: any) {
      const matched = exams.find(e => e.id === id);
      if (matched) {
        setActiveExam({
          ...matched,
          marksConfig: (matched as any).marksConfig || { maxMarks: 100, passMarks: 35, classWiseConfig: {}, subjectWiseConfig: {} }
        });
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadExamDetails(selectedExamId);
    } else {
      setActiveExam(null);
    }
  }, [selectedExamId]);

  const classOptions = useMemo(() => {
    return Array.from(new Set((academicClasses || []).map(c => c.name).filter(Boolean)));
  }, [academicClasses]);

  const handleCreateNewExam = () => {
    const newExamObj = {
      id: 'new',
      name: '',
      examType: '',
      term: '',
      academicTerm: '',
      startDate: '',
      endDate: '',
      applicableClasses: [],
      status: 'Draft',
      marksConfig: {
        maxMarks: 100,
        passMarks: 35,
        classWiseConfig: {},
        subjectWiseConfig: {}
      }
    };

    setSelectedExamId('new');
    setActiveExam(newExamObj);
    setActiveTab('setup');
  };

  const handleDeleteActiveExam = () => {
    if (!selectedExamId) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteActiveExam = async () => {
    if (!selectedExamId) return;
    const examIdToDelete = selectedExamId;

    // Trigger backend delete API (if server supports it)
    deleteExamApi(examIdToDelete).catch(() => {});

    // Update local state and DataContext
    setExams(prev => prev.filter(e => e.id !== examIdToDelete));
    setSelectedExamId('');
    setActiveExam(null);
    setShowDeleteConfirm(false);
    addToast('info', 'Examination Removed', 'Successfully removed the examination setup.');
  };

  const handleSaveSetup = async (updatedFields: any, showToast = true) => {
    try {
      const isNew = !selectedExamId || selectedExamId === 'new' || !/^\d+$/.test(selectedExamId);
      const payload = {
        examId: isNew ? undefined : Number(selectedExamId),
        examName: updatedFields.name || updatedFields.examName || activeExam?.name || '',
        assessmentType: updatedFields.examType || updatedFields.assessmentType || activeExam?.examType || '',
        academicTerm: updatedFields.term || updatedFields.academicTerm || activeExam?.term || '',
        startDate: updatedFields.startDate || activeExam?.startDate || '',
        endDate: updatedFields.endDate || activeExam?.endDate || '',
        applicableClasses: updatedFields.applicableClasses || activeExam?.applicableClasses || []
      };
      
      const response = await saveExamDetailsApi(payload);
      if (response && response.success) {
        if (showToast) {
          addToast('success', 'Details Saved', response.message || 'Exam configuration saved successfully.');
        }
        await loadOptions(false);
        if (response.data?.examId) {
          const newId = response.data.examId.toString();
          setSelectedExamId(newId);
          await loadExamDetails(newId);
        }
      } else {
        addToast('error', 'Save Failed', response?.message || 'Failed to save exam details.');
      }
    } catch (err: any) {
      addToast('error', 'API Error', err.message || 'Failed to save exam configuration.');
    }
  };

  // 5 Clear, streamlined tabs with school terminology
  const tabs = [
    { id: 'setup', label: 'Exam Configuration', icon: Settings },
    { id: 'schedule', label: 'Exam Schedule', icon: Calendar },
    { id: 'evaluation', label: 'Marks Entry', icon: Edit3 },
    { id: 'results-reports', label: 'Results & Reports', icon: Award },
    { id: 'grading', label: 'Grading Scale', icon: CheckSquare }
  ];

  const examApplicableClasses = useMemo(() => {
    if (!activeExam) return classOptions;
    const app = activeExam.applicableClasses || [];
    const validApp = app.filter(Boolean);
    if (validApp.length > 0) {
      return Array.from(new Set(validApp));
    }
    return classOptions;
  }, [activeExam, classOptions]);

  return (
    <div className="space-y-4 text-left w-full">
      {/* 1. Sleek Top Header Card */}
      <div className="py-3.5 px-5 sm:py-4 sm:px-6 rounded-2xl border border-sky-400 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2.5">
          <Award className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0" />
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Examinations
          </h1>
        </div>
      </div>


      {/* 2. Streamlined 5-Tab Navigation Container */}
      <div className="p-1.5 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs w-full no-print">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 w-full">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer text-center ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Routed Module Body Views */}
      <div className="w-full">
        {activeTab === 'setup' && (
          <ExamSetup
            exam={activeExam}
            exams={exams}
            selectedExamId={selectedExamId}
            onSelectExam={setSelectedExamId}
            onCreateNewExam={handleCreateNewExam}
            onDeleteExam={handleDeleteActiveExam}
            classOptions={classOptions}
            subjects={subjects}
            selectedAcademicYear={selectedAcademicYear}
            selectedBranch={selectedBranch}
            onSaveSetup={(updates, showToast) => {
              setActiveExam((prev: any) => ({
                ...prev,
                ...updates,
                name: updates.name || prev?.name,
                examType: updates.examType || prev?.examType,
                term: updates.term || prev?.term,
                academicTerm: updates.term || prev?.academicTerm,
                applicableClasses: updates.applicableClasses || prev?.applicableClasses || [],
                startDate: updates.startDate || prev?.startDate,
                endDate: updates.endDate || prev?.endDate,
                marksConfig: {
                  ...(prev?.marksConfig || {}),
                  ...(updates.marksConfig || {}),
                  classWiseConfig: {
                    ...((prev?.marksConfig as any)?.classWiseConfig || {}),
                    ...((updates.marksConfig as any)?.classWiseConfig || {})
                  }
                }
              }));
              handleSaveSetup(updates, showToast);
            }}
            onNavigateNext={async () => {
              setActiveTab('schedule');
            }}
            addToast={addToast}
            options={options}
          />
        )}

        {activeTab === 'schedule' && (
          <ExamSchedule
            exam={activeExam}
            classOptions={examApplicableClasses}
            subjects={subjects}
            staff={staff}
            selectedAcademicYear={selectedAcademicYear}
            selectedBranch={selectedBranch}
            addToast={addToast}
            onNavigateNext={() => setActiveTab('evaluation')}
            onGotoSetup={() => setActiveTab('setup')}
          />
        )}

        {activeTab === 'evaluation' && (
          <MarksEntry
            exam={activeExam}
            classOptions={examApplicableClasses}
            subjects={subjects}
            students={students}
            gradeRules={gradeConfigurations}
            addToast={addToast}
            onGotoSetup={() => setActiveTab('setup')}
            onProceedToResults={() => setActiveTab('results-reports')}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
          />
        )}

        {activeTab === 'results-reports' && (
          <ResultsAndReports
            exam={activeExam}
            classOptions={examApplicableClasses}
            subjects={subjects}
            students={students}
            selectedAcademicYear={selectedAcademicYear}
            selectedBranch={selectedBranch}
            addToast={addToast}
            onGotoSetup={() => setActiveTab('setup')}
          />
        )}

        {activeTab === 'grading' && (
          <GradingConfiguration addToast={addToast} />
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/60 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">Delete Examination?</h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{activeExam?.name || 'Untitled Exam'}"</strong>? All associated timetables, schedules, and entered student marks will be permanently removed.
            </p>
            <div className="flex justify-end items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteActiveExam}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExaminationView;
