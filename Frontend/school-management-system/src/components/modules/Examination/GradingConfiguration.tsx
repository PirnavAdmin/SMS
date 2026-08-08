import React, { useState, useMemo } from 'react';
import { Award, Plus, Trash2, Save, CheckCircle2, Sliders, Layers, Percent, Hash } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { Panel } from './components/SharedUI';
import { GradeConfig } from '../../../types';

interface GradingConfigurationProps {
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const GradingConfiguration: React.FC<GradingConfigurationProps> = ({ addToast }) => {
  const { gradeConfigurations, saveGradeConfiguration, exams } = useData();
  const { selectedAcademicYear, selectedBranch } = useAuth();

  const [selectedExamType, setSelectedExamType] = useState<string>('All');
  const [gradingMode, setGradingMode] = useState<'Percentage' | 'Marks'>('Percentage');
  const [localGrades, setLocalGrades] = useState<GradeConfig[]>(gradeConfigurations || []);
  const [isEditing, setIsEditing] = useState(false);

  const defaultExamTypes = ['Unit Test', 'Periodic Test', 'Mid-Term', 'Half-Yearly', 'Annual', 'Practical'];
  const examTypes = useMemo(() => {
    const typesFromExams = (exams || [])
      .map(e => e.examType as string)
      .filter((t): t is string => !!t);
    return Array.from(new Set(['All', ...typesFromExams, ...defaultExamTypes]));
  }, [exams]);

  // Filtered grades based on active tab / exam type
  const displayedGrades = useMemo(() => {
    return localGrades.filter(g => {
      const matchExam = selectedExamType === 'All' || !g.examType || g.examType === 'All' || g.examType === selectedExamType;
      const matchMode = gradingMode === 'Percentage' ? (g.gradingType !== 'Marks') : (g.gradingType === 'Marks');
      return matchExam && matchMode;
    });
  }, [localGrades, selectedExamType, gradingMode]);

  const handleAddRow = () => {
    const newId = 'GRD-' + Math.floor(100 + Math.random() * 900);
    const newRow: GradeConfig = {
      id: newId,
      academicYear: selectedAcademicYear,
      branch: selectedBranch,
      examType: selectedExamType,
      gradingType: gradingMode,
      grade: 'B',
      gradeName: 'B',
      minPercent: gradingMode === 'Percentage' ? 60 : 15,
      maxPercent: gradingMode === 'Percentage' ? 69 : 20,
      minMark: gradingMode === 'Marks' ? 15 : 60,
      maxMark: gradingMode === 'Marks' ? 20 : 69,
      gradePoint: 7,
      gradePoints: 7,
      passCriteria: 'Pass',
      remarks: 'Good'
    };
    setLocalGrades(prev => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setLocalGrades(prev => prev.filter(g => g.id !== id));
  };

  const handleUpdateField = (id: string, field: keyof GradeConfig, val: any) => {
    setLocalGrades(prev => prev.map(g => {
      if (g.id === id) {
        const updated = { ...g, [field]: val } as any;
        if (field === 'grade') updated.gradeName = val;
        if (field === 'minPercent') updated.minMark = val;
        if (field === 'maxPercent') updated.maxMark = val;
        if (field === 'minMark') updated.minPercent = val;
        if (field === 'maxMark') updated.maxPercent = val;
        if (field === 'gradePoint') updated.gradePoints = val;
        if (field === 'gradePoints') updated.gradePoint = val;
        return updated;
      }
      return g;
    }));
  };

  const handleSave = () => {
    // Validation
    const invalid = localGrades.some(g => {
      const min = gradingMode === 'Percentage' ? (g.minPercent ?? 0) : (g.minMark ?? 0);
      const max = gradingMode === 'Percentage' ? (g.maxPercent ?? 100) : (g.maxMark ?? 100);
      return min > max;
    });

    if (invalid) {
      addToast('error', 'Validation Error', 'Minimum value cannot exceed Maximum value in scale rows.');
      return;
    }

    if (saveGradeConfiguration) {
      saveGradeConfiguration(localGrades);
      addToast('success', 'Grading Saved', `Successfully updated grading scale rules for ${selectedExamType} examination type.`);
      setIsEditing(false);
    }
  };

  const tableHeaderClass = "px-3.5 py-2.5 text-slate-400 dark:text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 tracking-wider whitespace-nowrap";
  const inputClass = "w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/50 transition";

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Grade Configuration"
        //description="Configure dynamic grading rules in Percentage (%) or Raw Marks according to examination types."
        action={
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" /> Add Scale Row
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm shadow-sky-600/20 flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Modify Scale Rules
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {/* Controls Bar: Exam Type Pills & Scale Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60">
            {/* Exam Type Selector */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Exam Type *</span>
              <select
                value={selectedExamType}
                onChange={e => setSelectedExamType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[180px] h-[34px] shadow-xs"
              >
                {examTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Grading Scale Mode Switcher */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setGradingMode('Percentage')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                  gradingMode === 'Percentage'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-extrabold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Percent className="w-3 h-3" /> Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setGradingMode('Marks')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                  gradingMode === 'Marks'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-extrabold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Hash className="w-3 h-3" /> Raw Marks
              </button>
            </div>
          </div>

          {/* Table of Grade Rules */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[680px]">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Grade Letter</th>
                  <th className={tableHeaderClass}>
                    {gradingMode === 'Percentage' ? 'Min Percentage (%)' : 'Min Mark'}
                  </th>
                  <th className={tableHeaderClass}>
                    {gradingMode === 'Percentage' ? 'Max Percentage (%)' : 'Max Mark'}
                  </th>
                  <th className={tableHeaderClass}>Grade Points (GPA)</th>
                  <th className={tableHeaderClass}>Pass / Fail Status</th>
                  <th className={tableHeaderClass}>Remarks</th>
                  {isEditing && <th className={`${tableHeaderClass} text-right`}>Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {displayedGrades.length === 0 ? (
                  <tr>
                    <td colSpan={isEditing ? 8 : 7} className="py-12 text-center text-slate-500 font-bold text-xs space-y-4">
                      <div className="text-slate-400 dark:text-slate-500 text-sm">No grade configuration rules found for this selection.</div>
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(true);
                            handleAddRow();
                          }}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm shadow-sky-600/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Configure Scale & Add Row
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAddRow}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add Scale Row
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayedGrades.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Grade Letter */}
                      <td className="px-3.5 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={g.grade || g.gradeName || ''}
                            onChange={e => handleUpdateField(g.id, 'grade', e.target.value)}
                            className={`${inputClass} w-20 font-black`}
                          />
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-black text-xs border border-sky-200/60 dark:border-sky-900/60">
                            {g.grade || g.gradeName}
                          </span>
                        )}
                      </td>

                      {/* Min Value */}
                      <td className="px-3.5 py-3 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="500"
                            value={gradingMode === 'Percentage' ? (g.minPercent ?? 0) : (g.minMark ?? 0)}
                            onChange={e => {
                              const v = Number(e.target.value);
                              if (gradingMode === 'Percentage') handleUpdateField(g.id, 'minPercent', v);
                              else handleUpdateField(g.id, 'minMark', v);
                            }}
                            className={`${inputClass} w-20 font-mono`}
                          />
                        ) : (
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {gradingMode === 'Percentage' ? `${g.minPercent ?? 0}%` : (g.minMark ?? 0)}
                          </span>
                        )}
                      </td>

                      {/* Max Value */}
                      <td className="px-3.5 py-3 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="500"
                            value={gradingMode === 'Percentage' ? (g.maxPercent ?? 100) : (g.maxMark ?? 100)}
                            onChange={e => {
                              const v = Number(e.target.value);
                              if (gradingMode === 'Percentage') handleUpdateField(g.id, 'maxPercent', v);
                              else handleUpdateField(g.id, 'maxMark', v);
                            }}
                            className={`${inputClass} w-20 font-mono`}
                          />
                        ) : (
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {gradingMode === 'Percentage' ? `${g.maxPercent ?? 100}%` : (g.maxMark ?? 100)}
                          </span>
                        )}
                      </td>

                      {/* Grade Point */}
                      <td className="px-3.5 py-3 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={g.gradePoint ?? g.gradePoints ?? 0}
                            onChange={e => handleUpdateField(g.id, 'gradePoint', Number(e.target.value))}
                            className={`${inputClass} w-20 font-mono`}
                          />
                        ) : (
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{g.gradePoint ?? g.gradePoints ?? 0} GPA</span>
                        )}
                      </td>

                      {/* Pass / Fail */}
                      <td className="px-3.5 py-3">
                        {isEditing ? (
                          <select
                            value={g.passCriteria || 'Pass'}
                            onChange={e => handleUpdateField(g.id, 'passCriteria', e.target.value)}
                            className={`${inputClass} w-24`}
                          >
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            g.passCriteria === 'Pass' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {g.passCriteria || 'Pass'}
                          </span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="px-3.5 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={g.remarks || ''}
                            onChange={e => handleUpdateField(g.id, 'remarks', e.target.value)}
                            className={`${inputClass} max-w-xs`}
                          />
                        ) : (
                          <span className="font-bold text-slate-700 dark:text-slate-300">{g.remarks || '—'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      {isEditing && (
                        <td className="px-3.5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(g.id)}
                            className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            title="Delete Scale Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>
    </div>
  );
};
export default GradingConfiguration;
