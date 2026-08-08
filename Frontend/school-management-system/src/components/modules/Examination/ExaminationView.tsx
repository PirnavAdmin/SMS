import React, { useState, useMemo } from 'react';
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
import { useExaminations } from './hooks/useExaminations';

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
  
  // Custom examinations hook
  const { exams, handleAddExam, handleUpdateExam, handleDeleteExam } = useExaminations();

  // Selected state: Starts empty with clear prompt
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const classOptions = academicClasses.map(c => c.name);
  const activeExam = exams.find(e => e.id === selectedExamId) || null;

  const handleCreateNewExam = () => {
    const id = handleAddExam({
      name: '',
      examType: '',
      term: '',
      academicYear: selectedAcademicYear || '',
      branch: selectedBranch || '',
      className: '',
      applicableClasses: [],
      startDate: '',
      endDate: '',
      status: 'Draft',
      publishStatus: 'Draft',
      marksConfig: {
        maxMarks: 100,
        passMarks: 35,
        subjectWiseConfig: {}
      }
    } as any);
    setSelectedExamId(id);
    setActiveTab('setup');
    addToast('info', 'New Examination Template', 'Created a new examination template. Please specify the name, assessment type, and target classes.');
  };

  const handleDeleteActiveExam = () => {
    if (!selectedExamId) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteActiveExam = () => {
    handleDeleteExam(selectedExamId);
    setSelectedExamId('');
    setShowDeleteConfirm(false);
    addToast('info', 'Examination Removed', 'Successfully deleted the examination setup.');
  };

  const handleSaveSetup = (updatedFields: any, showToast = true) => {
    if (!selectedExamId && !activeExam) return;
    const targetId = selectedExamId || activeExam?.id;
    if (targetId) {
      handleUpdateExam(targetId, updatedFields);
      if (showToast) {
        addToast('success', 'Assessment Setup Saved', 'Updated general examination parameters.');
      }
    }
  };

  // 5 Clear, streamlined tabs with school terminology
  const tabs = [
    { id: 'setup', label: 'Exams & Setup', icon: Settings },
    { id: 'schedule', label: 'Exam Schedule', icon: Calendar },
    { id: 'evaluation', label: 'Marks Entry', icon: Edit3 },
    { id: 'results-reports', label: 'Results & Reports', icon: Award },
    { id: 'grading', label: 'Grading Scale', icon: CheckSquare }
  ];

  const examApplicableClasses = useMemo(() => {
    if (!activeExam) return classOptions;
    const app = activeExam.applicableClasses || [];
    return app.length > 0 ? app : classOptions;
  }, [activeExam, classOptions]);

  return (
    <div className="space-y-4 text-left w-full">
      {/* 1. Sleek Top Header Card */}
      <div className="py-3 px-5 sm:py-3.5 sm:px-6 rounded-2xl border border-sky-400 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Examinations
          </h1>
        </div>
      </div>


      {/* 2. Streamlined 5-Tab Navigation Container */}
      <div className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs w-full no-print">
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
            onSaveSetup={handleSaveSetup}
            onNavigateNext={() => setActiveTab('schedule')}
            addToast={addToast}
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
                <p className="text-[11px] font-bold text-slate-400">This action cannot be undone.</p>
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
