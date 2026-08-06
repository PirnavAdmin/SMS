import React, { useState } from 'react';
import { TrendingUp, Search, CheckSquare, Square, ArrowRight, Building2, CheckCircle2, GraduationCap, Award } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';

interface StudentPromotionViewProps {
  onNavigate?: (module: string) => void;
}

export const StudentPromotionView: React.FC<StudentPromotionViewProps> = ({ onNavigate }) => {
  const { students, academicClasses, promoteStudent, completeStudent, getHighestClass } = useData();
  const { addToast } = useToast();

  const highestClass = getHighestClass();

  const [fromClass, setFromClass] = useState<string>(academicClasses[0]?.name || 'Class 10');
  const [fromSection, setFromSection] = useState<string>('All');
  const [targetYear, setTargetYear] = useState<string>('2026-2027');
  const [targetClass, setTargetClass] = useState<string>('Class 11');
  const [targetSection, setTargetSection] = useState<string>('A');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const isHighestClass = fromClass === highestClass;

  // Filter active students by class & section
  const availableStudents = students.filter(s => {
    if (s.status !== 'Active') return false;
    const matchClass = fromClass === 'All' || s.className === fromClass;
    const matchSection = fromSection === 'All' || s.section === fromSection;
    const matchQuery = !searchQuery || 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSection && matchQuery;
  });

  const isAllSelected = availableStudents.length > 0 && availableStudents.every(s => selectedStudentIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents.map(s => s.id));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkPromote = () => {
    if (selectedStudentIds.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select at least one student.');
      return;
    }

    let count = 0;
    selectedStudentIds.forEach(id => {
      if (isHighestClass) {
        completeStudent(id, targetYear, 'Unknown');
      } else {
        promoteStudent(id, targetClass, targetSection, targetYear);
      }
      count++;
    });

    if (isHighestClass) {
      addToast('success', 'Graduation Complete', `Successfully completed & graduated ${count} student(s) to Alumni (${targetYear}).`);
    } else {
      addToast('success', 'Bulk Promotion Complete', `Successfully promoted ${count} student(s) to ${targetClass}-${targetSection} (${targetYear}).`);
    }
    setSelectedStudentIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner Header */}
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> Student Promotion
          </h2>
          {isHighestClass && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Terminal Class ({highestClass}) selected - Students will graduate and move to Alumni module.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ExportButton data={availableStudents} filename="student_promotion_list" />
          <button
            onClick={handleBulkPromote}
            disabled={selectedStudentIds.length === 0}
            className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 ${
              isHighestClass 
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' 
                : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'
            }`}
          >
            {isHighestClass ? <GraduationCap className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {isHighestClass ? `Complete / Graduate Selected (${selectedStudentIds.length})` : `Promote Selected (${selectedStudentIds.length})`}
          </button>
        </div>
      </div>

      {/* Promotion Config & Filter Bar */}
      <div className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Current Class */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From Class</label>
            <select
              value={fromClass}
              onChange={e => { setFromClass(e.target.value); setSelectedStudentIds([]); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              {academicClasses.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.name === highestClass ? '(Highest Class - Terminal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Current Section */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">From Section</label>
            <select
              value={fromSection}
              onChange={e => { setFromSection(e.target.value); setSelectedStudentIds([]); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* Target Academic Year */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Target Academic Year</label>
            <select
              value={targetYear}
              onChange={e => setTargetYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="2026-2027">2026-2027 (Next)</option>
              <option value="2027-2028">2027-2028</option>
            </select>
          </div>

          {/* Target Class / Action */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              {isHighestClass ? 'Action' : 'Promote To Class'}
            </label>
            {isHighestClass ? (
              <div className="w-full px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                Graduate to Alumni
              </div>
            ) : (
              <select
                value={targetClass}
                onChange={e => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                {academicClasses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Target Section */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Target Section</label>
            <select
              disabled={isHighestClass}
              value={targetSection}
              onChange={e => setTargetSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none disabled:opacity-50"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        {isHighestClass && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Highest Class ({highestClass}) Terminal Workflow</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Students completing {highestClass} will be marked as <strong>Completed</strong> and automatically added to the <strong>Alumni Directory</strong>. Academic, fee, attendance, exam, and certificate records will be permanently preserved.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Student List Table Card */}
      <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student name or roll no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Showing {availableStudents.length} eligible students</span>
            <button
              onClick={handleToggleSelectAll}
              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-brand-600 dark:text-brand-400"
            >
              {isAllSelected ? 'Deselect All' : 'Select All Eligible'}
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 w-10 text-center">
                  <button onClick={handleToggleSelectAll}>
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-brand-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </button>
                </th>
                <th className="py-3 px-4">Student Roll / Adm No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Current Class & Sec</th>
                <th className="py-3 px-4">{isHighestClass ? 'Graduation Status' : 'Target Promotion Grade'}</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {availableStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No active students found in {fromClass} ({fromSection})
                  </td>
                </tr>
              ) : (
                availableStudents.map(st => {
                  const isSelected = selectedStudentIds.includes(st.id);
                  return (
                    <tr key={st.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${isSelected ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''}`}>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleToggleSelectStudent(st.id)}>
                          {isSelected ? <CheckSquare className="w-4 h-4 text-brand-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{st.admissionNo}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{st.className} - {st.section}</td>
                      <td className="py-3 px-4">
                        {isHighestClass ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold">
                            <GraduationCap className="w-3.5 h-3.5" /> Complete & Graduate to Alumni ({targetYear})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                            {st.className} <ArrowRight className="w-3 h-3" /> {targetClass}-{targetSection} ({targetYear})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isHighestClass ? (
                          <button
                            onClick={() => {
                              completeStudent(st.id, targetYear, 'Unknown');
                              addToast('success', 'Graduated to Alumni', `Completed & graduated ${st.firstName} ${st.lastName} to Alumni.`);
                            }}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1 mx-auto shadow-sm"
                          >
                            <GraduationCap className="w-3.5 h-3.5" /> Complete / Graduate
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              promoteStudent(st.id, targetClass, targetSection, targetYear);
                              addToast('success', 'Student Promoted', `Promoted ${st.firstName} to ${targetClass}-${targetSection}`);
                            }}
                            className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px]"
                          >
                            Promote
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
