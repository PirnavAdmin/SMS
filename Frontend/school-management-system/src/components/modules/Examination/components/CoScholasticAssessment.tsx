import React from 'react';
import { Award } from 'lucide-react';

interface CoScholasticAssessmentProps {
  studentId: string;
  studentName: string;
  discipline: string;
  sports: string;
  artAndCraft: string;
  generalConduct: string;
  onChange: (updates: { discipline?: string; sports?: string; artAndCraft?: string; generalConduct?: string }) => void;
  onSave: () => void;
}

export const CoScholasticAssessment: React.FC<CoScholasticAssessmentProps> = ({
  studentId,
  studentName,
  discipline,
  sports,
  artAndCraft,
  generalConduct,
  onChange,
  onSave
}) => {
  const selectClass = "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 outline-none text-slate-900 dark:text-white font-bold text-xs h-[36px] transition cursor-pointer";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block mb-1";

  return (
    <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 text-left">
      <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">Co-Scholastic Assessment</h4>
          <p className="text-xs text-slate-500 font-medium">Record grades for {studentName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-0.5">
          <label className={labelClass}>Discipline</label>
          <select
            value={discipline || 'A'}
            onChange={e => onChange({ discipline: e.target.value })}
            className={selectClass}
          >
            {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-0.5">
          <label className={labelClass}>Sports</label>
          <select
            value={sports || 'A'}
            onChange={e => onChange({ sports: e.target.value })}
            className={selectClass}
          >
            {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-0.5">
          <label className={labelClass}>Art & Craft</label>
          <select
            value={artAndCraft || 'B+'}
            onChange={e => onChange({ artAndCraft: e.target.value })}
            className={selectClass}
          >
            {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-0.5">
          <label className={labelClass}>General Conduct</label>
          <select
            value={generalConduct || 'A'}
            onChange={e => onChange({ generalConduct: e.target.value })}
            className={selectClass}
          >
            {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm transition"
        >
          Save Co-Scholastic Grades
        </button>
      </div>
    </div>
  );
};
