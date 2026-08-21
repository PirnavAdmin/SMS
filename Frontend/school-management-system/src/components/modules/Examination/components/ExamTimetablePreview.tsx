import React, { useMemo } from 'react';
import { Filter, Printer, Calendar } from 'lucide-react';
import { ExamSchedule, SubjectItem, Staff } from '../../../../types';
import { useData } from '../../../../context/DataContext';

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
  classOptions = [],
  subjects,
  staff,
  auditClassFilter,
  auditSectionFilter,
  setAuditClassFilter,
  setAuditSectionFilter,
  onPrintTimetable,
  onPrintAll
}) => {
  const { academicClasses } = useData();
  const tableHeaderClass = "px-3.5 py-2.5 text-slate-400 dark:text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 tracking-wider whitespace-nowrap";

  // Strictly only target classes configured for this examination
  const auditVisibleClasses = useMemo(() => {
    if (auditClassFilter === 'All') return classOptions;
    return classOptions.filter(c => c === auditClassFilter);
  }, [auditClassFilter, classOptions]);

  // Available sections for the filtered class
  const availableSectionsForFilter = useMemo(() => {
    if (auditClassFilter === 'All') {
      const allSecs = new Set<string>();
      classOptions.forEach(cls => {
        const match = academicClasses.find(c => c.name === cls);
        if (match?.sections) {
          match.sections.forEach((s: any) => {
            const name = typeof s === 'string' ? s : (s.name || s.sectionName || 'A');
            allSecs.add(name);
          });
        }
      });
      return allSecs.size > 0 ? Array.from(allSecs) : ['A', 'B'];
    }
    const match = academicClasses.find(c => c.name === auditClassFilter);
    if (!match?.sections || match.sections.length === 0) return ['A'];
    return match.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || 'A'));
  }, [auditClassFilter, classOptions, academicClasses]);

  const formatSubject = (subjectName: string) => {
    const match = subjects.find(s => s.name === subjectName || s.id === subjectName || s.code === subjectName);
    return match ? `${match.code || subjectName.substring(0, 3).toUpperCase() + '-101'} - ${match.name}` : subjectName;
  };

  const calculateDurationLabel = (start: string, end: string) => {
    if (!start || !end) return '3h';
    try {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      const totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
      if (totalMinutes <= 0) return '3h';
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 ? `${mins}m` : ''}`.trim() || '3h';
    } catch {
      return '3h';
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Filter Bar */}
      <div className="p-4 rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-500" /> Filter Timetable
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-xs border border-sky-200 dark:border-sky-800">
              View: {auditClassFilter === 'All' ? 'All Examination Classes' : auditClassFilter} — {auditSectionFilter === 'All' ? 'All Sections' : `Section ${auditSectionFilter}`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Class / Grade</label>
            <select
              value={auditClassFilter}
              onChange={e => {
                setAuditClassFilter(e.target.value);
                setAuditSectionFilter('All');
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none min-w-[170px] h-[34px] shadow-xs cursor-pointer"
            >
              <option value="All">All Exam Classes ({classOptions.length})</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block">Section</label>
            <select
              value={auditSectionFilter}
              onChange={e => setAuditSectionFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none min-w-[160px] h-[34px] shadow-xs cursor-pointer"
            >
              <option value="All">All Sections</option>
              {availableSectionsForFilter.map(sec => (
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
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 h-[34px] flex items-center justify-center transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grids list */}
      <div id="printable-content" className="space-y-6 timetable-printable">
        {auditVisibleClasses.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-2">
            <Calendar className="w-8 h-8 text-sky-500 mx-auto" />
            <h4 className="text-sm font-extrabold uppercase text-slate-800 dark:text-slate-200">No Classes Configured</h4>
            <p className="text-xs text-slate-400 font-medium">Please select target classes under the "Exams & Setup" tab.</p>
          </div>
        ) : (
          auditVisibleClasses.map(cls => {
            const classObj = academicClasses.find(c => c.name === cls);
            const classSections = classObj?.sections && classObj.sections.length > 0
              ? classObj.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || 'A'))
              : ['A'];

            const visibleSectionsForClass = auditSectionFilter === 'All' 
              ? classSections 
              : classSections.filter((s: string) => s === auditSectionFilter);

            return (
              <div key={cls} className="space-y-4">
                {visibleSectionsForClass.map((sec: string) => {
                  const rowsToRender = scheduleRows.filter(r => {
                    const rSec = (r.section || '').replace('Section ', '').trim().toUpperCase();
                    const sSec = (sec || '').replace('Section ', '').trim().toUpperCase();
                    return r.className === cls && rSec === sSec;
                  });

                  return (
                    <div key={`${cls}-${sec}`} className="rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
                        <h5 className="text-sm font-black text-slate-900 dark:text-white">
                          {cls} – Section {sec} Exam Schedule
                        </h5>
                        <button
                          type="button"
                          onClick={() => onPrintTimetable(cls, sec)}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition print:hidden cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-400" /> Print Timetable
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
                        <table className="min-w-full text-left text-xs border-collapse">
                          <thead>
                            <tr>
                              <th className={tableHeaderClass}>Subject</th>
                              <th className={tableHeaderClass}>Exam Date</th>
                              <th className={tableHeaderClass}>Time Slot</th>
                              <th className={tableHeaderClass}>Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {rowsToRender.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-3.5 py-6 text-center text-xs font-bold text-slate-400 italic">
                                  No subjects scheduled for this section yet.
                                </td>
                              </tr>
                            ) : (
                              rowsToRender.map((r, idx) => (
                                <tr key={r.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                  <td className="px-3.5 py-3 font-extrabold text-slate-900 dark:text-white">{formatSubject(r.subject)}</td>
                                  <td className="px-3.5 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{r.date}</td>
                                  <td className="px-3.5 py-3 font-bold text-slate-800 dark:text-slate-200">{r.startTime} – {r.endTime}</td>
                                  <td className="px-3.5 py-3 font-mono text-slate-500">{calculateDurationLabel(r.startTime, r.endTime)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default ExamTimetablePreview;
