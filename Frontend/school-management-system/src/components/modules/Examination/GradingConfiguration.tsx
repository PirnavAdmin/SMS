import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Award, Plus, Trash2, Save, CheckCircle2, Sliders, Layers, RefreshCw } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { Panel } from './components/SharedUI';
import { GradeConfig } from '../../../types';
import { 
  fetchExamOptionsApi, 
  fetchGradingScaleRulesApi, 
  saveGradingScaleRulesApi,
  deleteGradingScaleRuleApi 
} from '../../../api/examination';

interface GradingConfigurationProps {
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  exams?: any[];
  options?: any;
}

export const GradingConfiguration: React.FC<GradingConfigurationProps> = ({
  addToast,
  exams: passedExams,
  options: passedOptions
}) => {
  const { gradeConfigurations, saveGradeConfiguration, exams: contextExams } = useData();
  const { selectedAcademicYear, selectedBranch } = useAuth();

  const [selectedExamType, setSelectedExamType] = useState<string>(() => {
    try {
      return sessionStorage.getItem('sms_grading_selected_exam_type') || 'All';
    } catch {
      return 'All';
    }
  });

  const handleSelectExamType = (type: string) => {
    setSelectedExamType(type);
    try {
      sessionStorage.setItem('sms_grading_selected_exam_type', type);
    } catch {}
  };

  const [createdExams, setCreatedExams] = useState<any[]>([]);
  const [localGrades, setLocalGrades] = useState<GradeConfig[]>(gradeConfigurations || []);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCustomExamType, setIsCustomExamType] = useState(false);
  const [customExamTypeInput, setCustomExamTypeInput] = useState('');

  // Load created exams from API so we always have the exact assessment types created
  useEffect(() => {
    fetchExamOptionsApi()
      .then((res: any) => {
        if (res?.success && Array.isArray(res.data?.existingExams)) {
          setCreatedExams(res.data.existingExams);
        }
      })
      .catch(() => {});
  }, []);

  const fetchRules = useCallback(async (examType: string) => {
    try {
      setLoading(true);
      const res: any = await fetchGradingScaleRulesApi(examType);
      if (res && res.success) {
        const apiRules = res.data?.scaleRules || [];
        const mapped: GradeConfig[] = apiRules.map((r: any, idx: number) => ({
          id: r.ruleId ? `GRD-${r.ruleId}` : `GRD-${idx + 1}`,
          academicYear: selectedAcademicYear || '',
          branch: selectedBranch || '',
          examType: examType,
          schemeName: examType !== 'All' ? examType : 'Default Scholastic',
          gradingType: 'Percentage',
          grade: r.grade || '',
          gradeName: r.grade || '',
          minPercent: r.minMarks ?? 0,
          maxPercent: r.maxMarks ?? 100,
          minMark: r.minMarks ?? 0,
          maxMark: r.maxMarks ?? 100,
          gradePoint: r.gpa ?? 0,
          gradePoints: r.gpa ?? 0,
          passCriteria: r.passFail || 'Pass',
          remarks: r.remarks || ''
        }));

        setLocalGrades(mapped);

        if (saveGradeConfiguration) {
          saveGradeConfiguration(mapped);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch grading scale rules for', examType, err);
    } finally {
      setLoading(false);
    }
  }, [selectedAcademicYear, selectedBranch, saveGradeConfiguration]);

  // Dynamically fetch grading scale rules from backend API whenever selectedExamType changes
  useEffect(() => {
    fetchRules(selectedExamType);
  }, [selectedExamType, fetchRules]);

  const standardAssessmentTypes = [
    'Unit Test',
    'Periodic Assessment (PT)',
    'Formative Assessment (FA)',
    'Summative Assessment (SA)',
    'Mid-Term Examination',
    'Half-Yearly Examination',
    'Pre-Board Examination',
    'Annual / Final Examination',
    'Practical & Laboratory Assessment',
    'Internal / Continuous Evaluation'
  ];

  // Assessment types from created exams, standard options, and configured scales
  const examTypes = useMemo(() => {
    const allExamsList = [
      ...(createdExams || []),
      ...(passedExams || []),
      ...(passedOptions?.existingExams || []),
      ...(contextExams || [])
    ];

    const typesFromExams = allExamsList
      .map(e => (e.assessmentType || e.examType) as string)
      .filter((t): t is string => !!t && t.trim() !== '' && t !== 'Main Exam');

    const typesFromGrades = (localGrades || [])
      .map(g => g.examType as string)
      .filter((t): t is string => !!t && t.trim() !== '' && t !== 'All');

    const combined = ['All', ...standardAssessmentTypes, ...typesFromExams, ...typesFromGrades];
    if (customExamTypeInput.trim()) {
      combined.push(customExamTypeInput.trim());
    }

    return Array.from(new Set(combined));
  }, [createdExams, passedExams, passedOptions, contextExams, localGrades, customExamTypeInput]);

  // Current grades displayed for selected exam type
  const displayedGrades = useMemo(() => {
    return localGrades;
  }, [localGrades]);

  const handleAddRow = () => {
    setIsEditing(true);
    const tempId = `GRD-TEMP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newRow: any = {
      id: tempId,
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
      passCriteria: 'Pass',
      remarks: ''
    };
    setLocalGrades(prev => [...prev, newRow]);
  };

  const handleDeleteRow = async (id: string) => {
    const isTemp = String(id).includes('TEMP');
    const numericId = parseInt(String(id).replace(/\D/g, ''));

    // Optimistically update local state immediately
    const updated = localGrades.filter(g => g.id !== id);
    setLocalGrades(updated);

    // Sync immediately to DataContext so tab switches retain the deletion
    if (saveGradeConfiguration) {
      saveGradeConfiguration(updated);
    }

    // If it's a persisted rule in the database, delete via API
    if (!isTemp && numericId > 0) {
      try {
        await deleteGradingScaleRuleApi(numericId);
        addToast('info', 'Row Removed', 'Scale rule deleted.');
      } catch (err: any) {
        console.warn('API direct delete note:', err);
      }
    }
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

  const handleSave = async () => {
    const currentRules = displayedGrades;

    // Check for empty grade identifier
    const hasEmptyGrade = currentRules.some(g => !(g.grade || g.gradeName || '').trim());
    if (hasEmptyGrade) {
      addToast('error', 'Validation Error', 'Please enter a Grade name for all scale rows.');
      return;
    }

    // Range Validation
    const invalid = currentRules.some(g => {
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

    const rulesForApi = currentRules.map((g) => {
      const isTemp = String(g.id).includes('TEMP');
      const numId = parseInt(String(g.id).replace(/\D/g, ''));
      return {
        ruleId: (!isTemp && numId > 0) ? numId : 0,
        grade: (g.gradeName || g.grade || '').trim(),
        minMarks: Number(g.minPercent ?? g.minMark ?? 0),
        maxMarks: Number(g.maxPercent ?? g.maxMark ?? 100),
        gpa: Number(g.gradePoints ?? g.gradePoint ?? 0),
        passFail: g.passCriteria || 'Pass',
        remarks: g.remarks || ''
      };
    });

    try {
      setLoading(true);
      const res: any = await saveGradingScaleRulesApi({
        examType: selectedExamType,
        scaleRules: rulesForApi
      });

      if (res && res.success) {
        addToast('success', 'Grading Saved', `Successfully updated grading scale rules for ${selectedExamType} examination type.`);
        setIsEditing(false);
        // Refresh directly from API to ensure fresh IDs and exact server state
        await fetchRules(selectedExamType);
      } else {
        addToast('error', 'Save Failed', res?.message || 'Failed to save grading scale rules.');
      }
    } catch (err: any) {
      addToast('error', 'API Error', err?.message || 'Failed to save grading scale rules.');
    } finally {
      setLoading(false);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-sky-400 dark:border-sky-500 bg-slate-50/50 dark:bg-slate-950/60">
            {/* Exam Type Selector */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Exam Type *</span>
              {isCustomExamType ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customExamTypeInput}
                    onChange={e => {
                      setCustomExamTypeInput(e.target.value);
                      handleSelectExamType(e.target.value);
                    }}
                    placeholder="Enter custom assessment type..."
                    className="px-3 py-1.5 rounded-xl border border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none min-w-[220px] h-[34px] shadow-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomExamType(false);
                      if (!customExamTypeInput.trim()) {
                        handleSelectExamType('All');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 h-[34px] cursor-pointer"
                  >
                    Select Existing
                  </button>
                </div>
              ) : (
                <select
                  value={selectedExamType}
                  onChange={e => {
                    if (e.target.value === '__other_custom__') {
                      setIsCustomExamType(true);
                      setCustomExamTypeInput('');
                      handleSelectExamType('');
                    } else {
                      handleSelectExamType(e.target.value);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer min-w-[200px] h-[34px] shadow-xs"
                >
                  {examTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__other_custom__">Other / Custom...</option>
                </select>
              )}
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
          <div className="overflow-x-auto rounded-3xl border border-sky-400 dark:border-sky-500 shadow-sm">
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
