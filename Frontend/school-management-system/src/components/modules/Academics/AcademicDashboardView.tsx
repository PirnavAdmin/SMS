import React, { useMemo } from 'react';
import { School, Layers, BookOpen, Users, Plus, Play, UserCheck, ArrowRight, GraduationCap, ClipboardList, Zap } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';

interface AcademicDashboardViewProps {
  onNavigate: (module: string) => void;
  setSelectedClassId: (id: string) => void;
  setClassWorkspaceTab: (tab: any) => void;
  setAutoOpenClassModal?: (open: boolean) => void;
}

export const AcademicDashboardView: React.FC<AcademicDashboardViewProps> = ({
  onNavigate,
  setSelectedClassId,
  setClassWorkspaceTab,
  setAutoOpenClassModal
}) => {
  const { academicClasses, students, subjects } = useData();

  // Core KPIs
  const totalClasses = academicClasses.length;
  const totalSections = useMemo(() => {
    return academicClasses.reduce((acc, c) => acc + (c.sections || []).length, 0);
  }, [academicClasses]);
  const totalSubjects = subjects.length;
  const totalStudents = students.length;

  // Class Summary List
  const classSummaryList = useMemo(() => {
    const list = academicClasses.map(cl => {
      const clStudents = students.filter(s => s.className === cl.name);
      const status = cl.sections.length === 0 ? 'Draft' : 'Configured';

      return {
        class: cl,
        sectionsCount: cl.sections.length,
        studentsCount: clStudents.length,
        status
      };
    });

    const getGradeWeight = (name: string) => {
      const normalized = name.toLowerCase().trim();
      if (normalized.includes('nursery')) return 0.1;
      if (normalized.includes('lkg')) return 0.2;
      if (normalized.includes('ukg')) return 0.3;
      
      const match = normalized.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (normalized.includes('intermediate') && normalized.includes('1st')) {
          return 11;
        }
        if (normalized.includes('intermediate') && normalized.includes('2nd')) {
          return 12;
        }
        return num;
      }
      return 99;
    };

    return list.sort((a, b) => {
      const orderA = (a.class as any).displayOrder;
      const orderB = (b.class as any).displayOrder;
      const hasOrderA = orderA !== undefined && orderA !== null && orderA !== '';
      const hasOrderB = orderB !== undefined && orderB !== null && orderB !== '';
      if (hasOrderA && hasOrderB) {
        return parseInt(orderA, 10) - parseInt(orderB, 10);
      }
      if (hasOrderA) return -1;
      if (hasOrderB) return 1;

      const wA = getGradeWeight(a.class.name);
      const wB = getGradeWeight(b.class.name);
      if (wA !== wB) return wA - wB;

      return a.class.name.localeCompare(b.class.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [academicClasses, students]);

  const handleOpenClass = (classId: string, tab: any = 'sections') => {
    setSelectedClassId(classId);
    setClassWorkspaceTab(tab);
    onNavigate('academic-class');
  };

  const handleQuickAction = (actionType: string) => {
    if (actionType === 'create-class') {
      if (setAutoOpenClassModal) setAutoOpenClassModal(true);
      onNavigate('academic-class');
    } else if (actionType === 'add-section') {
      setSelectedClassId('');
      setClassWorkspaceTab('sections');
      onNavigate('academic-class');
    } else if (actionType === 'assign-teachers') {
      setSelectedClassId('');
      setClassWorkspaceTab('teachers');
      onNavigate('academic-class');
    } else if (actionType === 'allocate-students') {
      setSelectedClassId('');
      setClassWorkspaceTab('students');
      onNavigate('academic-class');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12 text-slate-900 dark:text-slate-101 text-left">
      
      {/* Header session banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-808 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-indigo-650 text-white rounded-2xl shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-slate-905 dark:text-white">Academic Management Dashboard</h2>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-955/20 text-sky-600 rounded-2xl">
            <School className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Total Classes</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalClasses}</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-955/20 text-indigo-650 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Total Sections</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalSections}</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-955/20 text-purple-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Total Subjects</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalSubjects}</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Total Students</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalStudents}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Summary Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start font-bold">
        
        {/* Class Summary Table */}
        <div className="md:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 rounded-3xl space-y-4">
          <h4 className="font-extrabold text-slate-855 dark:text-white text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-sky-600" />
            Class Summary
          </h4>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:bg-slate-955">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-55 uppercase text-[9px] text-slate-400 font-mono">
                <tr>
                  <th className="p-3">Class</th>
                  <th className="p-3 text-center">Sections</th>
                  <th className="p-3 text-center">Students</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-808 font-bold">
                {classSummaryList.map(item => (
                  <tr key={item.class.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-3 text-slate-900 dark:text-white">{item.class.name}</td>
                    <td className="p-3 text-center font-mono">{item.sectionsCount}</td>
                    <td className="p-3 text-center font-mono">{item.studentsCount}</td>
                    <td className="p-3 text-center">
                      <Badge variant={item.status === 'Configured' ? 'success' : 'warning'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleOpenClass(item.class.id, 'sections')}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 font-extrabold text-[11px] rounded-xl transition-all inline-flex items-center gap-1"
                      >
                        {item.status === 'Draft' ? 'Continue' : 'Open'} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {classSummaryList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                      No classes configured yet. Click "+ Create Class" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 rounded-3xl space-y-4">
          <h4 className="font-extrabold text-slate-855 dark:text-white text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            Quick Actions
          </h4>
          <div className="grid grid-cols-1 gap-2.5 text-xs">
            <button 
              onClick={() => handleQuickAction('create-class')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-850 dark:text-white border border-slate-200/60 dark:border-slate-700 rounded-2xl text-left flex items-center justify-between transition-colors"
            >
              <span>+ Create Class</span>
              <Play className="w-3 h-3 text-slate-400 fill-current" />
            </button>
            <button 
              onClick={() => handleQuickAction('add-section')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-850 dark:text-white border border-slate-200/60 dark:border-slate-700 rounded-2xl text-left flex items-center justify-between transition-colors"
            >
              <span>+ Add Section</span>
              <Play className="w-3 h-3 text-slate-400 fill-current" />
            </button>
            <button 
              onClick={() => handleQuickAction('assign-teachers')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-850 dark:text-white border border-slate-200/60 dark:border-slate-700 rounded-2xl text-left flex items-center justify-between transition-colors"
            >
              <span>+ Assign Teachers</span>
              <Play className="w-3 h-3 text-slate-400 fill-current" />
            </button>
            <button 
              onClick={() => handleQuickAction('allocate-students')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-850 dark:text-white border border-slate-200/60 dark:border-slate-700 rounded-2xl text-left flex items-center justify-between transition-colors"
            >
              <span>+ Allocate Students</span>
              <Play className="w-3 h-3 text-slate-400 fill-current" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
