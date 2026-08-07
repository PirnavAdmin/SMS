import React from 'react';
import { RosterMarkRowState } from '../hooks/useMarksEntry';
import { calculateGrade } from '../utils/resultCalculation';
import { Student, GradeConfig } from '../../../../types';

interface MarksEntryTableProps {
  students: Student[];
  marksState: Record<string, RosterMarkRowState>;
  gradeRules: GradeConfig[];
  searchQuery: string;
  isLocked: boolean;
  onUpdateRow: (studentId: string, updates: Partial<RosterMarkRowState>) => void;
  maxMarks: number;
}

export const MarksEntryTable: React.FC<MarksEntryTableProps> = ({
  students,
  marksState,
  gradeRules,
  searchQuery,
  isLocked,
  onUpdateRow,
  maxMarks
}) => {
  const tableHeaderClass = "px-3 py-2.5 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50";

  const filteredStudents = students.filter(s => {
    const nameStr = `${s.firstName} ${s.lastName} ${s.rollNo || ''} ${s.admissionNo || ''}`.toLowerCase();
    return nameStr.includes(searchQuery.toLowerCase());
  });

  const getAttendanceBadgeClass = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Absent': return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      case 'Medical Leave': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'Exempted': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350';
      default: return 'bg-slate-100 text-slate-655';
    }
  };

  const getMarksStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Locked': return 'bg-slate-900 text-white dark:bg-slate-850 dark:text-slate-300';
      case 'Submitted': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
      case 'Verified': return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
      case 'In Progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <table className="min-w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 font-bold uppercase">
            <th className={tableHeaderClass}>Roll No.</th>
            <th className={tableHeaderClass}>Admission No.</th>
            <th className={tableHeaderClass}>Student Name</th>
            <th className={tableHeaderClass}>Attendance Status</th>
            <th className={`${tableHeaderClass} text-center`}>Marks ({maxMarks})</th>
            <th className={tableHeaderClass}>Grade (Auto)</th>
            <th className={tableHeaderClass}>Remarks</th>
            <th className={tableHeaderClass}>Marks Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {filteredStudents.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-xs text-slate-500 font-bold">
                No matching students found.
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

              const isDisabled = isLocked || rowState.status === 'Locked' || rowState.status === 'Submitted' || rowState.status === 'Verified';
              const isAbsent = rowState.attendance === 'Absent' || rowState.attendance === 'Medical Leave' || rowState.attendance === 'Exempted';
              const marksNum = isAbsent ? 0 : Number(rowState.marks) || 0;
              const percentage = maxMarks > 0 ? (marksNum / maxMarks) * 100 : 0;
              const autoGrade = isAbsent ? rowState.attendance : calculateGrade(percentage, gradeRules);

              return (
                <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50">
                  {/* Roll No */}
                  <td className="px-3 py-3 font-mono font-bold text-slate-650 dark:text-slate-400">
                    {student.rollNo || `10${idx + 1}`}
                  </td>

                  {/* Admission No */}
                  <td className="px-3 py-3 font-mono font-bold text-slate-650 dark:text-slate-400">
                    {student.admissionNo || student.id.substring(0, 8)}
                  </td>

                  {/* Name */}
                  <td className="px-3 py-3 font-extrabold text-slate-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </td>

                  {/* Attendance */}
                  <td className="px-3 py-3">
                    <select
                      disabled={isDisabled}
                      value={rowState.attendance}
                      onChange={e => onUpdateRow(student.id, { attendance: e.target.value as any })}
                      className={`px-2 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer transition ${getAttendanceBadgeClass(rowState.attendance)}`}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Medical Leave">Medical Leave</option>
                      <option value="Exempted">Exempted</option>
                    </select>
                  </td>

                  {/* Marks */}
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="0"
                      max={maxMarks}
                      disabled={isDisabled || isAbsent}
                      value={isAbsent ? '0' : rowState.marks}
                      onChange={e => onUpdateRow(student.id, { marks: e.target.value })}
                      className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-900 dark:text-white outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-60 focus:border-sky-500 font-mono transition"
                    />
                  </td>

                  {/* Grade */}
                  <td className="px-3 py-3 font-black text-indigo-650 dark:text-indigo-400 text-sm">
                    {autoGrade}
                  </td>

                  {/* Remarks */}
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      disabled={isDisabled}
                      placeholder="Add comments..."
                      value={rowState.remarks}
                      onChange={e => onUpdateRow(student.id, { remarks: e.target.value })}
                      className="w-44 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:border-sky-500 transition"
                    />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3 font-bold text-[10px]">
                    <span className={`px-2 py-0.5 rounded-md uppercase tracking-wider ${getMarksStatusBadgeClass(rowState.status)}`}>
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
