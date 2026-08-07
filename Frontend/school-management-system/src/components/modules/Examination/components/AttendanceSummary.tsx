import React from 'react';
import { Calendar } from 'lucide-react';

interface AttendanceSummaryProps {
  studentId: string;
  studentName: string;
  workingDays: number;
  presentDays: number;
  onChange: (updates: { workingDays?: number; presentDays?: number }) => void;
  onSave: () => void;
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({
  studentId,
  studentName,
  workingDays,
  presentDays,
  onChange,
  onSave
}) => {
  const inputClass = "w-full px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 outline-none text-slate-900 dark:text-white font-mono text-xs h-[36px] transition focus:border-sky-500";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block mb-1";

  const totalWorking = Number(workingDays) || 220;
  const totalPresent = Number(presentDays) || 0;
  const totalAbsent = Math.max(0, totalWorking - totalPresent);
  const percentage = totalWorking > 0 ? ((totalPresent / totalWorking) * 100).toFixed(2) : '0.00';

  return (
    <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 text-left">
      <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
        <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">Attendance Summary</h4>
          <p className="text-xs text-slate-500 font-medium">Configure attendance statistics for {studentName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-0.5">
          <label className={labelClass}>Total Working Days</label>
          <input
            type="number"
            min="0"
            max="365"
            value={workingDays}
            onChange={e => onChange({ workingDays: Number(e.target.value) || 0 })}
            className={inputClass}
          />
        </div>

        <div className="space-y-0.5">
          <label className={labelClass}>Days Present</label>
          <input
            type="number"
            min="0"
            max={workingDays}
            value={presentDays}
            onChange={e => onChange({ presentDays: Number(e.target.value) || 0 })}
            className={`${inputClass} ${totalPresent > totalWorking ? 'border-rose-500 text-rose-600 focus:border-rose-500' : ''}`}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
        <div>
          <span className="block text-[9px] uppercase tracking-wider text-slate-400">Days Absent</span>
          <span className="font-mono font-black text-slate-800 dark:text-slate-200">{totalAbsent} Days</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase tracking-wider text-slate-400">Attendance Rate</span>
          <span className="font-mono font-black text-sky-600 dark:text-sky-400">{percentage}%</span>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm transition"
        >
          Save Attendance Stats
        </button>
      </div>
    </div>
  );
};
