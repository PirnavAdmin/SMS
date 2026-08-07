import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Calendar, Award, CheckSquare, Edit3, ClipboardList, Plus, Trash } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useExaminations } from './hooks/useExaminations';

// Subcomponents
import { ExamDashboard } from './ExamDashboard';
import { ExamSetup } from './ExamSetup';
import { ExamSchedule } from './ExamSchedule';
import { MarksEntry } from './MarksEntry';
import { ResultsManagement } from './ResultsManagement';
import { ReportCards } from './ReportCards';
import { GradingConfiguration } from './GradingConfiguration';

interface ExaminationViewProps {
  initialTab?: string;
}

export const ExaminationView: React.FC<ExaminationViewProps> = ({ initialTab = 'dashboard' }) => {
  const { academicClasses, subjects, staff, students, gradeConfigurations, examSchedules, examMarks } = useData();
  const { selectedAcademicYear, selectedBranch } = useAuth();
  const { addToast } = useToast();
  
  // Custom examinations hook
  const { exams, handleAddExam, handleUpdateExam, handleDeleteExam } = useExaminations();

  // Selected state
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const classOptions = academicClasses.map(c => c.name);

  // Default selected exam is empty ('') to show the '-- Choose Exam --' option on initial load

  const activeExam = exams.find(e => e.id === selectedExamId) || null;

  const handleCreateNewExam = () => {
    const id = handleAddExam({
      name: 'New Examination ' + (exams.length + 1),
      academicYear: selectedAcademicYear,
      branch: selectedBranch,
      className: classOptions[0] || 'Class 10',
      applicableClasses: [classOptions[0] || 'Class 10'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'Scheduled',
      publishStatus: 'Draft',
      marksConfig: {
        maxMarks: 100,
        passMarks: 35,
        subjectWiseConfig: {}
      }
    } as any);
    setSelectedExamId(id);
    setActiveTab('setup');
    addToast('success', 'Exam Created', 'Created a new examination template. Please update details.');
  };

  const handleDeleteActiveExam = () => {
    if (!selectedExamId) return;
    if (confirm('Are you sure you want to delete the selected examination? All associated schedules will be deleted.')) {
      handleDeleteExam(selectedExamId);
      setSelectedExamId(exams[0]?.id || '');
      addToast('info', 'Exam Removed', 'Successfully deleted the examination setup.');
    }
  };

  const handleSaveSetup = (updatedFields: any, showToast = true) => {
    if (!selectedExamId) return;
    handleUpdateExam(selectedExamId, updatedFields);
    if (showToast) {
      addToast('success', 'Setup Saved', 'Updated general examination setup parameters.');
    }
  };

  // Navigations between steps
  const handleNavigateNextFromSetup = () => setActiveTab('schedule');
  const handleNavigateNextFromSchedule = () => setActiveTab('evaluation');
  const handleNavigateToReportCards = () => setActiveTab('report-cards');

  return (
    <div className="space-y-6">
      {/* Top Header Selector Panel */}
      <div className="p-4 rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print text-left">
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Selected Exam</label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[200px] h-[34px]"
            >
              <option value="">-- Choose Exam --</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-1.5 pt-4">
            <button
              onClick={handleCreateNewExam}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-505 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1.5 transition h-[34px]"
            >
              <Plus className="w-3.5 h-3.5" /> New Exam
            </button>

            {selectedExamId && (
              <button
                onClick={handleDeleteActiveExam}
                className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/20 transition h-[34px] flex items-center justify-center"
                title="Delete Examination Template"
              >
                <Trash className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="text-right text-xs font-semibold text-slate-500 space-y-0.5">
          <div>Branch Campus: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBranch}</span></div>
          <div>Academic Year: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAcademicYear}</span></div>
        </div>
      </div>

      {/* Sidebar / Tabs list */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/40 rounded-2xl w-max overflow-x-auto max-w-full no-print">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'setup', label: 'Exams', icon: Settings },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'evaluation', label: 'Marks Entry', icon: Edit3 },
          { id: 'results', label: 'Results', icon: Award },
          { id: 'report-cards', label: 'Report Cards', icon: ClipboardList },
          { id: 'grading', label: 'Grading', icon: CheckSquare }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Routed Screens */}
      <div className="no-print">
        {activeTab === 'dashboard' && (
          <ExamDashboard
            exams={exams}
            schedules={examSchedules}
            marks={examMarks}
            students={students}
            onNavigate={setActiveTab}
            onCreateNewExam={handleCreateNewExam}
          />
        )}

        {activeTab === 'setup' && (
          <ExamSetup
            exam={activeExam}
            classOptions={classOptions}
            subjects={subjects}
            selectedAcademicYear={selectedAcademicYear}
            selectedBranch={selectedBranch}
            onSaveSetup={handleSaveSetup}
            onNavigateNext={handleNavigateNextFromSetup}
            addToast={addToast}
          />
        )}

        {activeTab === 'schedule' && (
          <ExamSchedule
            exam={activeExam}
            classOptions={classOptions}
            subjects={subjects}
            staff={staff}
            selectedAcademicYear={selectedAcademicYear}
            selectedBranch={selectedBranch}
            addToast={addToast}
            onNavigateNext={handleNavigateNextFromSchedule}
          />
        )}

        {activeTab === 'evaluation' && (
          <MarksEntry
            exam={activeExam}
            classOptions={classOptions}
            subjects={subjects}
            students={students}
            gradeRules={gradeConfigurations}
            addToast={addToast}
          />
        )}

        {activeTab === 'results' && (
          <ResultsManagement
            exam={activeExam}
            classOptions={classOptions}
            subjects={subjects}
            students={students}
            selectedAcademicYear={selectedAcademicYear}
            selectedBranch={selectedBranch}
            addToast={addToast}
            onNavigateToReportCards={handleNavigateToReportCards}
          />
        )}

        {activeTab === 'report-cards' && (
          <ReportCards
            exam={activeExam}
            classOptions={classOptions}
            subjects={subjects}
            students={students}
            selectedAcademicYear={selectedAcademicYear}
            selectedBranch={selectedBranch}
            addToast={addToast}
          />
        )}

        {activeTab === 'grading' && (
          <GradingConfiguration addToast={addToast} />
        )}
      </div>
    </div>
  );
};
export default ExaminationView;
