import React, { useState, useMemo } from 'react';
import { Award, Plus, Trash2, Save, CheckCircle2, Sliders, Layers } from 'lucide-react';
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
  const [localGrades, setLocalGrades] = useState<GradeConfig[]>(gradeConfigurations || []);
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    if (gradeConfigurations) {
      setLocalGrades(gradeConfigurations);
    }
  }, [gradeConfigurations]);

  const standardAssessmentTypes = [
    'Periodic Assessment (PT)',
    'Unit Test (UT)',
    'Formative Assessment (FA)',
    'Summative Assessment (SA)',
    'Mid-Term Examination',
    'Half-Yearly Examination',
    'Pre-Board Examination',
    'Annual / Final Examination',
    'Practical & Laboratory Assessment',
    'Internal / Continuous Evaluation'
  ];

  const examTypes = useMemo(() => {
    const typesFromExams = (exams || [])
      .map(e => e.examType as string)
      .filter((t): t is string => !!t);
    return Array.from(new Set(['All', ...standardAssessmentTypes, ...typesFromExams]));
  }, [exams]);

  // Filtered grades based on selected exam type
  const displayedGrades = useMemo(() => {
    return localGrades.filter(g => {
      const matchExam = selectedExamType === 'All' || !g.examType || g.examType === 'All' || g.examType === selectedExamType;
      return matchExam;
    });
  }, [localGrades, selectedExamType]);

  const handleAddRow = () => {
    const newId = 'GRD-' + Math.floor(100 + Math.random() * 900);
    const newRow: any = {
      id: newId,
      academicYear: selectedAcademicYear,
      branch: selectedBranch,
      examType: selectedExamType,
      schemeName: selectedExamType !== 'All' ? selectedExamType : 'Default Scholastic',
      gradingType: 'Percentage',
      grade: '',
      gradeName: '',
      minPercent: '',
      maxPercent: '',
      minMark: '',
      maxMark: '',
      gradePoint: '',
      gradePoints: '',
      passCriteria: '',
      remarks: ''
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
      const minVal = g.minPercent !== undefined ? g.minPercent : g.minMark;
      const maxVal = g.maxPercent !== undefined ? g.maxPercent : g.maxMark;
      
      const min = (minVal as any) === '' || minVal === undefined || minVal === null ? 0 : Number(minVal);
      const max = (maxVal as any) === '' || maxVal === undefined || maxVal === null ? 100 : Number(maxVal);
      return min > max;
    });

    if (invalid) {
      addToast('error', 'Validation Error', 'Minimum value cannot exceed Maximum value in scale rows.');
      return;
    }

    const targetType = selectedExamType !== 'All' ? selectedExamType : undefined;

    const sanitizedGrades = localGrades.map(g => {
      const isCurrentlyDisplayed = displayedGrades.some(dg => dg.id === g.id);

      const minP = (g.minPercent as any) === '' || g.minPercent === undefined || g.minPercent === null ? 0 : Number(g.minPercent);
      const maxP = (g.maxPercent as any) === '' || g.maxPercent === undefined || g.maxPercent === null ? 100 : Number(g.maxPercent);
      const minM = (g.minMark as any) === '' || g.minMark === undefined || g.minMark === null ? 0 : Number(g.minMark);
      const maxM = (g.maxMark as any) === '' || g.maxMark === undefined || g.maxMark === null ? 100 : Number(g.maxMark);
      const gPt = (g.gradePoint as any) === '' || g.gradePoint === undefined || g.gradePoint === null ? 0 : Number(g.gradePoint);
      const passC = (g.passCriteria as any) === '' || g.passCriteria === undefined || g.passCriteria === null ? 'Pass' : g.passCriteria;

      const effectiveExamType = (isCurrentlyDisplayed && targetType) ? targetType : (g.examType || targetType);

      return {
        ...g,
        examType: effectiveExamType,
        schemeName: effectiveExamType || g.schemeName || 'Default Scholastic',
        gradingType: 'Percentage' as const,
        minPercent: minP,
        maxPercent: maxP,
        minMark: minM,
        maxMark: maxM,
        gradePoint: gPt,
        gradePoints: gPt,
        passCriteria: passC
      };
    });

    if (saveGradeConfiguration) {
      saveGradeConfiguration(sanitizedGrades);
      addToast('success', 'Grading Saved', `Successfully updated grading scale rules for ${selectedExamType} examination type.`);
      setIsEditing(false);
    }
  };

  const tableHeaderClass = "px-3.5 py-3 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] border-b border-r border-sky-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 tracking-wider whitespace-nowrap last:border-r-0";
  const tdClass = "px-3.5 py-3 border-r border-slate-100 dark:border-slate-800 last:border-r-0";
  const inputClass = "w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/50 transition";

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Grade Configuration"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {isEditing ? (
              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm shadow-sky-600/20 flex items-center gap-1.5 transition-all cursor-pointer h-[34px]"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 text-white text-xs font-bold transition shadow-xs cursor-pointer h-[34px]"
              >
                Modify Scale Rules
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {/* Controls Bar: Exam Type & Add Scale Row Button (when editing) */}
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

            {/* Add Scale Row button when editing */}
            {isEditing && (
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-sm shadow-sky-600/20 flex items-center gap-1.5 transition-all cursor-pointer h-[34px]"
              >
                <Plus className="w-3.5 h-3.5" /> Add Scale Row
              </button>
            )}
          </div>

          {/* Table of Grade Rules */}
          <div className="overflow-x-auto rounded-3xl border border-sky-400/80 dark:border-sky-500 shadow-sm">
            <table className="w-full text-left text-xs border-collapse min-w-[680px]">
              <thead>
                <tr>
                  <th className={`${tableHeaderClass} text-center w-24`}>
                    Grade
                  </th>
                  <th className={`${tableHeaderClass} text-center w-36`}>
                    Min Marks
                  </th>
                  <th className={`${tableHeaderClass} text-center w-36`}>
                    Max Marks
                  </th>
                  <th className={`${tableHeaderClass} text-center w-36`}>
                    GPA
                  </th>
                  <th className={`${tableHeaderClass} text-center w-36`}>
                    Pass/Fail
                  </th>
                  <th className={`${tableHeaderClass} text-left w-56`}>Remarks</th>
                  {isEditing && <th className={`${tableHeaderClass} text-center w-24`}>Actions</th>}
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
                      <td className={`${tdClass} text-center`}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={g.grade || g.gradeName || ''}
                            onChange={e => handleUpdateField(g.id, 'grade', e.target.value)}
                            className={`${inputClass} w-20 font-black text-center mx-auto`}
                          />
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-black text-xs border border-sky-200/60 dark:border-sky-900/60">
                            {g.grade || g.gradeName}
                          </span>
                        )}
                      </td>

                      {/* Min Value */}
                      <td className={`${tdClass} text-center font-mono`}>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={
                              (g.minPercent as any) === '' || g.minPercent === undefined || g.minPercent === null ? '' : g.minPercent
                            }
                            onChange={e => {
                              const raw = e.target.value;
                              const v = raw === '' ? '' : Number(raw);
                              handleUpdateField(g.id, 'minPercent', v);
                            }}
                            className={`${inputClass} w-24 font-mono text-center mx-auto`}
                          />
                        ) : (
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {g.minPercent ?? 0}
                          </span>
                        )}
                      </td>

                      {/* Max Value */}
                      <td className={`${tdClass} text-center font-mono`}>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={
                              (g.maxPercent as any) === '' || g.maxPercent === undefined || g.maxPercent === null ? '' : g.maxPercent
                            }
                            onChange={e => {
                              const raw = e.target.value;
                              const v = raw === '' ? '' : Number(raw);
                              handleUpdateField(g.id, 'maxPercent', v);
                            }}
                            className={`${inputClass} w-24 font-mono text-center mx-auto`}
                          />
                        ) : (
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {g.maxPercent ?? 100}
                          </span>
                        )}
                      </td>

                      {/* Grade Point */}
                      <td className={`${tdClass} text-center font-mono`}>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={(g.gradePoint as any) === '' || g.gradePoint === undefined || g.gradePoint === null ? '' : g.gradePoint}
                            onChange={e => {
                              const raw = e.target.value;
                              const v = raw === '' ? '' : Number(raw);
                              handleUpdateField(g.id, 'gradePoint', v);
                            }}
                            className={`${inputClass} w-24 font-mono text-center mx-auto`}
                          />
                        ) : (
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{g.gradePoint ?? g.gradePoints ?? 0} GPA</span>
                        )}
                      </td>

                      {/* Pass / Fail */}
                      <td className={`${tdClass} text-center`}>
                        {isEditing ? (
                          <select
                            value={g.passCriteria || ''}
                            onChange={e => handleUpdateField(g.id, 'passCriteria', e.target.value)}
                            className={`${inputClass} w-24 text-center mx-auto font-bold cursor-pointer`}
                          >
                            <option value="">-- Select --</option>
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
                      <td className={`${tdClass} text-left`}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={g.remarks || ''}
                            onChange={e => handleUpdateField(g.id, 'remarks', e.target.value)}
                            className={`${inputClass} max-w-xs font-semibold`}
                          />
                        ) : (
                          <span className="font-bold text-slate-700 dark:text-slate-300">{g.remarks || '—'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      {isEditing && (
                        <td className={`${tdClass} text-center`}>
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
