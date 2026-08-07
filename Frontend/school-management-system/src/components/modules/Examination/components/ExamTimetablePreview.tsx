import React from 'react';
import { Filter, Printer } from 'lucide-react';
import { ExamSchedule, Student, SubjectItem, Staff } from '../../../../types';

interface ExamTimetablePreviewProps {
  scheduleRows: ExamSchedule[];
  classOptions: string[];
  subjects: SubjectItem[];
  staff: Staff[];
  auditClassFilter: string;
  auditSectionFilter: string;
  setAuditClassFilter: (val: string) => void;
  setAuditSectionFilter: (val: string) => void;
  onPrintTimetable: (className: string, section: string) => void;
  onPrintAll: () => void;
}

export const ExamTimetablePreview: React.FC<ExamTimetablePreviewProps> = ({
  scheduleRows,
  classOptions,
  subjects,
  staff,
  auditClassFilter,
  auditSectionFilter,
  setAuditClassFilter,
  setAuditSectionFilter,
  onPrintTimetable,
  onPrintAll
}) => {
  const tableHeaderClass = "px-3 py-2 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50 dark:bg-slate-800/80";

  const auditVisibleClasses = auditClassFilter === 'All' ? classOptions : [auditClassFilter];
  const auditVisibleSections = auditSectionFilter === 'All' ? ['A', 'B', 'C', 'D'] : [auditSectionFilter];

  const formatSubject = (subjectName: string) => {
    const match = subjects.find(s => s.name === subjectName || s.id === subjectName);
    return match ? `${match.code || ''} - ${match.name}` : subjectName;
  };

  const formatInvigilator = (nameVal: string) => {
    const matched = staff.find(t => t.name === nameVal || `${t.firstName} ${t.lastName}` === nameVal);
    return matched ? `${matched.firstName} ${matched.lastName} (${matched.empId || 'TBA'})` : nameVal || 'TBA';
  };

  const calculateDurationLabel = (start: string, end: string) => {
    if (!start || !end) return '—';
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (totalMinutes <= 0) return 'Invalid';
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 ? `${mins}m` : ''}`.trim() || '0m';
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Filter Bar */}
      <div className="p-4 rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-500" /> Filter Timetable View
            </h4>
            <p className="text-xs text-slate-500 font-medium">Filter exam schedule by class and section.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-xs border border-sky-200 dark:border-sky-800">
              View: {auditClassFilter === 'All' ? 'All Classes' : auditClassFilter} — {auditSectionFilter === 'All' ? 'All Sections' : `Section ${auditSectionFilter}`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Class Filter</label>
            <select
              value={auditClassFilter}
              onChange={e => setAuditClassFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none shadow-sm min-w-[160px] h-[34px]"
            >
              <option value="All">All Classes</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 block">Section Filter</label>
            <select
              value={auditSectionFilter}
              onChange={e => setAuditSectionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none shadow-sm min-w-[160px] h-[34px]"
            >
              <option value="All">All Sections</option>
              {['A', 'B', 'C', 'D'].map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {(auditClassFilter !== 'All' || auditSectionFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setAuditClassFilter('All');
                setAuditSectionFilter('All');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-xs font-bold hover:bg-slate-200 h-[34px] flex items-center justify-center transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grids list */}
      <div id="printable-content" className="space-y-6">
        {auditVisibleClasses.map(cls => (
          <div key={cls} className="space-y-4">
            {auditVisibleSections.map(sec => {
              const rowsToRender = scheduleRows.filter(r => r.className === cls && r.section === sec);
              if (rowsToRender.length === 0 && auditSectionFilter !== 'All') {
                return null;
              }

              return (
                <div key={`${cls}-${sec}`} className="rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 dark:text-white">
                      {cls} – Section {sec} Exam Schedule
                    </h5>
                    <button
                      type="button"
                      onClick={() => onPrintTimetable(cls, sec)}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition print:hidden"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Timetable
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
                    <table className="min-w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                          <th className={tableHeaderClass}>Subject</th>
                          <th className={tableHeaderClass}>Exam Date</th>
                          <th className={tableHeaderClass}>Time Slot</th>
                          <th className={tableHeaderClass}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsToRender.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-8 text-center text-xs font-bold text-slate-400">
                              No subjects scheduled for this class and section.
                            </td>
                          </tr>
                        )}
                        {rowsToRender.map((r, idx) => (
                          <tr key={r.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-3 py-3 font-extrabold text-slate-900 dark:text-white">{formatSubject(r.subject)}</td>
                            <td className="px-3 py-3 font-mono font-bold">{r.date}</td>
                            <td className="px-3 py-3 font-bold">{r.startTime} – {r.endTime}</td>
                            <td className="px-3 py-3 font-mono text-slate-550">{calculateDurationLabel(r.startTime, r.endTime)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
