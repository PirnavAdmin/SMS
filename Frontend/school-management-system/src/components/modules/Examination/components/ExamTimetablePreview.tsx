// @ts-nocheck
import React, { useMemo } from 'react';
import { Filter, Printer, Calendar, User, MapPin, AlertTriangle } from 'lucide-react';
import { ExamSchedule, SubjectItem, Staff } from '../../../../types';
import { useData } from '../../../../context/DataContext';
import { findScheduleCollisions } from '../utils/examValidation';

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

  // Real-time schedule collision analysis across all classes & sections
  const collisions = useMemo(() => {
    return findScheduleCollisions(scheduleRows);
  }, [scheduleRows]);

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
      return Array.from(allSecs);
    }
    const match = academicClasses.find(c => c.name === auditClassFilter);
    return match?.sections && match.sections.length > 0 
      ? match.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || 'A'))
      : [];
  }, [auditClassFilter, classOptions, academicClasses]);

  const calculateDurationLabel = (start: string, end: string) => {
    if (!start || !end) return '3h';
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    } catch {
      return '3h';
    }
  };

  const formatSubject = (sub: string) => {
    const match = (subjects || []).find(
      s => s.name.toLowerCase() === sub.toLowerCase() ||
           s.code?.toLowerCase() === sub.toLowerCase() ||
           s.id === sub
    );
    if (match) return `${match.code} - ${match.name}`;
    return sub;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
            <Filter className="w-4 h-4 text-sky-500" /> Filter Timetable
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Class / Grade</label>
              <select
                value={auditClassFilter}
                onChange={e => {
                  setAuditClassFilter(e.target.value);
                  setAuditSectionFilter('All');
                }}
                className="px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-white outline-none cursor-pointer focus:ring-1 focus:ring-sky-500"
              >
                <option value="All">All Exam Classes ({classOptions.length})</option>
                {classOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Section</label>
              <select
                value={auditSectionFilter}
                onChange={e => setAuditSectionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-white outline-none cursor-pointer focus:ring-1 focus:ring-sky-500"
              >
                <option value="All">All Sections</option>
                {availableSectionsForFilter.map(s => (
                  <option key={s} value={s}>
                    {s.startsWith('Section') ? s : `Section ${s}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 font-extrabold text-xs">
            View: {auditClassFilter === 'All' ? `All Examination Classes (${classOptions.length})` : auditClassFilter} — {auditSectionFilter === 'All' ? 'All Sections' : auditSectionFilter.startsWith('Section') ? auditSectionFilter : `Section ${auditSectionFilter}`}
          </div>
          {scheduleRows.length > 0 && (
            <button
              type="button"
              onClick={onPrintAll}
              className="px-4 py-2 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print All
            </button>
          )}
        </div>
      </div>

      {/* Global Scheduling Conflict Summary Banner */}
      {(collisions.invigilatorCollisions.length > 0 || collisions.roomCollisions.length > 0) && (
        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-black text-sm text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Scheduling Conflicts Detected ({collisions.invigilatorCollisions.length + collisions.roomCollisions.length})</span>
          </div>
          <div className="space-y-1 pl-6">
            {collisions.invigilatorCollisions.map((c, i) => (
              <div key={`inv_${i}`} className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>{c.message}</span>
              </div>
            ))}
            {collisions.roomCollisions.map((c, i) => (
              <div key={`rm_${i}`} className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                <span>{c.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              ? classObj.sections.map((s: any) => typeof s === 'string' ? s : (s.name || s.sectionName || '')).filter(Boolean)
              : [];

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
                              <th className={tableHeaderClass}>Room / Hall</th>
                              <th className={tableHeaderClass}>Invigilator(s) Assigned</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {rowsToRender.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-3.5 py-6 text-center text-xs font-bold text-slate-400 italic">
                                  No subjects scheduled for this section yet.
                                </td>
                              </tr>
                            ) : (
                              rowsToRender.map((r, idx) => {
                                const rawNames = (r.invigilatorNames && r.invigilatorNames.length > 0)
                                  ? r.invigilatorNames
                                  : (r.invigilatorName && r.invigilatorName !== 'TBA' && r.invigilatorName !== 'Unassigned'
                                      ? r.invigilatorName.split(',').map(s => s.trim()).filter(Boolean)
                                      : (r.invigilatorFaculty && r.invigilatorFaculty !== 'TBA' && r.invigilatorFaculty !== 'Unassigned'
                                          ? r.invigilatorFaculty.split(',').map(s => s.trim()).filter(Boolean)
                                          : []));

                                const roomName = (r.room && r.room !== 'TBA' && r.room !== 'Unassigned')
                                  ? r.room
                                  : ((r as any).roomHall && (r as any).roomHall !== 'TBA' && (r as any).roomHall !== 'Unassigned')
                                    ? (r as any).roomHall
                                    : (classObj?.roomNo ? `Room ${classObj.roomNo}` : '');

                                const isRoomConflicted = roomName && collisions.roomCollisions.some(
                                  c => c.room.toLowerCase() === roomName.toLowerCase() &&
                                       ((c.slotA.className === r.className && c.slotA.date === r.date) ||
                                        (c.slotB.className === r.className && c.slotB.date === r.date))
                                );

                                return (
                                  <tr key={r.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                    {/* Subject */}
                                    <td className="px-3.5 py-3 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                                      {formatSubject(r.subject)}
                                    </td>

                                    {/* Exam Date */}
                                    <td className="px-3.5 py-3 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                      {r.date || '—'}
                                    </td>

                                    {/* Time Slot */}
                                    <td className="px-3.5 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                      {r.startTime} – {r.endTime}
                                    </td>

                                    {/* Duration */}
                                    <td className="px-3.5 py-3 font-mono text-slate-500 whitespace-nowrap">
                                      {calculateDurationLabel(r.startTime, r.endTime)}
                                    </td>

                                    {/* Room / Hall */}
                                    <td className="px-3.5 py-3 whitespace-nowrap">
                                      {roomName ? (
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-extrabold text-xs border ${
                                          isRoomConflicted
                                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80'
                                        }`}>
                                          {isRoomConflicted ? (
                                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                          ) : (
                                            <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                                          )}
                                          <span>{roomName} {isRoomConflicted ? '(⚠️ Double-booked)' : ''}</span>
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic text-xs">
                                          No classroom assigned
                                        </span>
                                      )}
                                    </td>

                                    {/* Invigilator(s) Assigned with Conflict Indicators */}
                                    <td className="px-3.5 py-3">
                                      {rawNames.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {rawNames.map((name: string) => {
                                            const isTeacherConflicted = collisions.invigilatorCollisions.some(
                                              c => c.teacherName.toLowerCase() === name.toLowerCase() &&
                                                   ((c.slotA.className === r.className && c.slotA.date === r.date) ||
                                                    (c.slotB.className === r.className && c.slotB.date === r.date))
                                            );

                                            if (isTeacherConflicted) {
                                              return (
                                                <span
                                                  key={name}
                                                  title={`Conflict: Double-assigned with another class at ${r.date} ${r.startTime}-${r.endTime}`}
                                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-extrabold text-xs border border-rose-300 dark:border-rose-700 shadow-2xs"
                                                >
                                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                                  <span>{name} (⚠️ Conflict)</span>
                                                </span>
                                              );
                                            }

                                            return (
                                              <span
                                                key={name}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-extrabold text-xs border border-sky-200/80 dark:border-sky-900/60 shadow-2xs"
                                              >
                                                <User className="w-3 h-3 text-sky-500 shrink-0" />
                                                <span>{name}</span>
                                              </span>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200/60 dark:border-amber-900/40">
                                          Unassigned
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
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
