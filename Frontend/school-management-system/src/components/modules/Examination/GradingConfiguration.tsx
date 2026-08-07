import React, { useState } from 'react';
import { Award, Plus, Trash, Save } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Panel } from './components/SharedUI';
import { GradeConfig } from '../../../types';

interface GradingConfigurationProps {
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const GradingConfiguration: React.FC<GradingConfigurationProps> = ({ addToast }) => {
  const { gradeConfigurations, saveGradeConfiguration } = useData();
  const [localGrades, setLocalGrades] = useState<GradeConfig[]>(gradeConfigurations || []);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddRow = () => {
    setLocalGrades(prev => [
      ...prev,
      {
        id: 'GRD-' + Math.floor(100 + Math.random() * 900),
        grade: 'C',
        gradeName: 'C',
        minMark: 55,
        maxMark: 65,
        minPercent: 55,
        maxPercent: 65,
        gradePoint: 5,
        gradePoints: 5,
        passCriteria: 'Pass',
        remarks: 'Average'
      }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    setLocalGrades(prev => prev.filter(g => g.id !== id));
  };

  const handleUpdateField = (id: string, field: keyof GradeConfig, val: any) => {
    setLocalGrades(prev => prev.map(g => {
      if (g.id === id) {
        const updated = { ...g, [field]: val } as any;
        if (field === 'grade') updated.gradeName = val;
        if (field === 'minMark') updated.minPercent = val;
        if (field === 'maxMark') updated.maxPercent = val;
        if (field === 'gradePoint') updated.gradePoints = val;
        return updated;
      }
      return g;
    }));
  };

  const handleSave = () => {
    // Basic verification
    const invalid = localGrades.some(g => (g.minMark ?? g.minPercent ?? 0) > (g.maxMark ?? g.maxPercent ?? 100));
    if (invalid) {
      addToast('error', 'Validation Error', 'Minimum Mark cannot exceed Maximum Mark.');
      return;
    }
    if (saveGradeConfiguration) {
      saveGradeConfiguration(localGrades);
      addToast('success', 'Grading Saved', 'Grading scales configuration rules successfully saved.');
      setIsEditing(false);
    }
  };

  const tableHeaderClass = "px-4 py-2.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50";
  const inputClass = "w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-sky-500 transition";

  return (
    <div className="space-y-4 text-left">
      <Panel
        title="Grading Scales Configuration"
        description="Configure academic passing grade letters, percentage cut-offs, and point scores."
        action={
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleAddRow}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-350 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-slate-400" /> Add Grade Scale
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4" /> Save Configuration
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl border hover:bg-slate-50 text-xs font-bold transition"
              >
                Modify Scale Rules
              </button>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <table className="min-w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 font-bold uppercase">
                <th className={tableHeaderClass}>Grade Letter</th>
                <th className={tableHeaderClass}>Min Percentage (%)</th>
                <th className={tableHeaderClass}>Max Percentage (%)</th>
                <th className={tableHeaderClass}>Grade Points</th>
                <th className={tableHeaderClass}>Remarks</th>
                {isEditing && <th className={tableHeaderClass}>Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {localGrades.map(g => (
                <tr key={g.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={g.grade || g.gradeName || ''}
                        onChange={e => handleUpdateField(g.id, 'grade', e.target.value)}
                        className="w-20 px-2 py-1 rounded border border-slate-200"
                      />
                    ) : (
                      <span className="font-black text-indigo-650 dark:text-indigo-400 text-sm">{g.grade || g.gradeName}</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={g.minMark ?? g.minPercent ?? 0}
                        onChange={e => handleUpdateField(g.id, 'minMark', Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded border border-slate-200"
                      />
                    ) : (
                      <span className="font-mono font-bold">{g.minMark ?? g.minPercent ?? 0}%</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={g.maxMark ?? g.maxPercent ?? 100}
                        onChange={e => handleUpdateField(g.id, 'maxMark', Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded border border-slate-200"
                      />
                    ) : (
                      <span className="font-mono font-bold">{g.maxMark ?? g.maxPercent ?? 100}%</span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-slate-650">
                    {isEditing ? (
                      <input
                        type="number"
                        value={g.gradePoint ?? g.gradePoints ?? 0}
                        onChange={e => handleUpdateField(g.id, 'gradePoint', Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded border border-slate-200"
                      />
                    ) : (
                      <span>{g.gradePoint ?? g.gradePoints ?? 0} Points</span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-350">
                    {isEditing ? (
                      <input
                        type="text"
                        value={g.remarks || ''}
                        onChange={e => handleUpdateField(g.id, 'remarks', e.target.value)}
                        className="w-44 px-2 py-1 rounded border border-slate-200"
                      />
                    ) : (
                      <span>{g.remarks || '—'}</span>
                    )}
                  </td>

                  {isEditing && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(g.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
export default GradingConfiguration;
