import React from 'react';
import { Lock } from 'lucide-react';
import { Student, GradeConfig } from '../../../../types';
import { RosterMarkRowState } from '../hooks/useMarksEntry';

interface MarksEntryTableProps {
  students: Student[];
  marksState: Record<string, RosterMarkRowState>;
  maxMarks: number;
  gradeRules: GradeConfig[];
  searchQuery: string;
  isLocked: boolean;
  onUpdateRow: (studentId: string, updates: Partial<RosterMarkRowState>) => void;
  onSelectStudent?: (student: Student) => void;
}

export const MarksEntryTable: React.FC<MarksEntryTableProps> = ({
  students,
  marksState,
  maxMarks,
  gradeRules,
  searchQuery,
  isLocked,
  onUpdateRow,
  onSelectStudent
}) => {
  const tableHeaderClass = "px-3.5 py-3 text-slate-400 dark:text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 tracking-wider whitespace-nowrap text-center";

  const filteredStudents = students.filter(student => {
    const q = searchQuery.toLowerCase();
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const rollNo = (student.rollNo || '').toLowerCase();
    const admissionNo = (student.admissionNo || student.id || '').toLowerCase();
    return fullName.includes(q) || rollNo.includes(q) || admissionNo.includes(q);
  });

  const calculateGrade = (percent: number, rules: GradeConfig[]): string => {
    const sorted = [...rules].sort((a, b) => b.minPercent - a.minPercent);
    const matched = sorted.find(r => percent >= r.minPercent);
    return matched ? (matched.grade || matched.gradeName || '—') : 'F';
  };

  const getAttendanceBadgeClass = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60';
      case 'Absent':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-900/60';
      case 'Medical Leave':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-955/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60';
      case 'Exempted':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-900/60';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
      <table className="w-full text-left text-xs border-collapse min-w-[780px]">
        <thead>
          <tr>
            <th className={`${tableHeaderClass} w-24`}>Roll No.</th>
            <th className={`${tableHeaderClass} w-48`}>Student Information</th>
            <th className={`${tableHeaderClass} w-36`}>Attendance Status</th>
            <th className={`${tableHeaderClass} w-28`}>Marks (Max: {maxMarks})</th>
            <th className={`${tableHeaderClass} w-20`}>Grade</th>
            <th className={`${tableHeaderClass} w-60`}>Evaluator Remarks</th>
            <th className={`${tableHeaderClass} w-28`}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {filteredStudents.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-bold">
                No enrolled students found matching the selected class, section, or search query.
              </td>
            </tr>
          ) : (
            filteredStudents.map((student, idx) => {
              const rowState = marksState[student.id] || {
                attendance: 'Present',
                marks: '0',
                remarks: '',
                status: 'Not Started'
              };

              const isDisabled = isLocked || rowState.status === 'Locked';
              const isAbsent = rowState.attendance === 'Absent' || rowState.attendance === 'Medical Leave' || rowState.attendance === 'Exempted';
              const rawMarks = Number(rowState.marks) || 0;
              const hasExceededMax = rawMarks > maxMarks && !isAbsent;
              const marksNum = isAbsent ? 0 : rawMarks;
              const percentage = maxMarks > 0 ? (marksNum / maxMarks) * 100 : 0;
              const autoGrade = isAbsent ? (rowState.attendance === 'Absent' ? 'AB' : 'EX') : calculateGrade(percentage, gradeRules);

              // Ensure unique sequential Roll Number for display
              const rawRoll = student.rollNo?.trim();
              const isDuplicateRoll = filteredStudents.filter(s => s.rollNo?.trim() === rawRoll).length > 1;
              const displayRollNo = (rawRoll && !isDuplicateRoll) ? rawRoll : String(idx + 1).padStart(2, '0');

              return (
                <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Roll No */}
                  <td className="px-3.5 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300 text-center">
                    {displayRollNo}
                  </td>

                  {/* Student Information without Avatar */}
                  <td className="px-3.5 py-3.5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs leading-tight">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {student.admissionNo || student.id}
                      </div>
                    </div>
                  </td>

                  {/* Attendance Status */}
                  <td className="px-3.5 py-3.5 whitespace-nowrap text-center">
                    <select
                      disabled={isDisabled}
                      value={rowState.attendance}
                      onChange={e => onUpdateRow(student.id, { attendance: e.target.value as any })}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold outline-none cursor-pointer transition border ${getAttendanceBadgeClass(rowState.attendance)}`}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent (AB)</option>
                      <option value="Medical Leave">Medical Leave (ML)</option>
                      <option value="Exempted">Exempted (EX)</option>
                    </select>
                  </td>

                  {/* Marks Input */}
                  <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex flex-col items-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={isDisabled || isAbsent}
                        value={isAbsent ? '0' : rowState.marks}
                        onChange={e => {
                          const clean = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                          onUpdateRow(student.id, { marks: clean });
                        }}
                        placeholder="0"
                        className={`w-20 px-2.5 py-1.5 rounded-xl border text-xs font-black text-center outline-none font-mono transition shadow-xs ${
                          hasExceededMax 
                            ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' 
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/50'
                        } disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-60`}
                      />
                      {hasExceededMax && (
                        <span className="text-[9px] font-bold text-rose-500 mt-0.5">Exceeds {maxMarks}!</span>
                      )}
                    </div>
                  </td>

                  {/* Auto-Grade */}
                  <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                      autoGrade === 'A1' || autoGrade === 'A2' || autoGrade === 'A+' || autoGrade === 'A'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : autoGrade === 'F' || autoGrade === 'AB'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    }`}>
                      {autoGrade}
                    </span>
                  </td>

                  {/* Remarks */}
                  <td className="px-3.5 py-3.5 text-center">
                    <input
                      type="text"
                      disabled={isDisabled}
                      placeholder="Add teacher remarks..."
                      value={rowState.remarks || ''}
                      onChange={e => onUpdateRow(student.id, { remarks: e.target.value })}
                      className="w-full min-w-[140px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/50 transition text-center"
                    />
                  </td>

                  {/* Status */}
                  <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                      rowState.status === 'Locked'
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : rowState.status === 'Verified'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : rowState.status === 'Submitted'
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-955 dark:text-amber-300'
                    }`}>
                      {rowState.status === 'Locked' && <Lock className="w-3 h-3 shrink-0" />}
                      {rowState.status}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
export default MarksEntryTable;
