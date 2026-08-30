import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DatePickerInput } from './SharedUI';
import { Search, ChevronDown, User, X, CheckCircle2, MapPin, AlertTriangle } from 'lucide-react';
import { ExamSchedule, SubjectItem } from '../../../../types';
import { checkInvigilatorCollision, checkRoomCollision, CollisionResult } from '../utils/examValidation';

export interface InvigilatorOption {
  id: string;
  name: string;
  empId: string;
  formatted: string;
}

interface ExamScheduleTableProps {
  scheduleRows: any[];
  isEditing: boolean;
  teacherOptions: InvigilatorOption[];
  roomOptions?: string[];
  defaultRoom?: string;
  allSchedules?: any[];
  addToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  onUpdateRow: (id: string, updates: Partial<ExamSchedule>) => void;
  onUploadPaper: (id: string, subject: string) => void;
  onPreviewPaper: (subject: string, fileName: string, fileUrl: string) => void;
  subjects: SubjectItem[];
  onApplyToAll?: (row: any) => void;
}

// Multi-Invigilator Searchable Selector with Real-Time Conflict Detection
function MultiInvigilatorSelect({
  selectedNames = [],
  onChange,
  teacherOptions = [],
  slotDate,
  slotStartTime,
  slotEndTime,
  allSchedules = [],
  currentSlotId = '',
  onConflictWarning
}: {
  selectedNames: string[];
  onChange: (names: string[]) => void;
  teacherOptions: InvigilatorOption[];
  slotDate?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  allSchedules?: any[];
  currentSlotId?: string;
  onConflictWarning?: (msg: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hideBusy, setHideBusy] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute collision status for each teacher across all classes/sections
  const evaluatedTeachers = useMemo(() => {
    return teacherOptions.map(t => {
      const isSelected = selectedNames.includes(t.name);
      let conflict: CollisionResult = { hasConflict: false };
      if (!isSelected && slotDate && slotStartTime && slotEndTime && allSchedules.length > 0) {
        conflict = checkInvigilatorCollision(
          t.name,
          slotDate,
          slotStartTime,
          slotEndTime,
          allSchedules,
          currentSlotId
        );
      }
      return {
        ...t,
        isSelected,
        isBusy: conflict.hasConflict,
        conflictDetails: conflict.details,
        conflictMessage: conflict.message
      };
    });
  }, [teacherOptions, selectedNames, slotDate, slotStartTime, slotEndTime, allSchedules, currentSlotId]);

  const filtered = useMemo(() => {
    let list = evaluatedTeachers;
    if (hideBusy) {
      list = list.filter(t => !t.isBusy || t.isSelected);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      t => t.name.toLowerCase().includes(q) || (t.empId && t.empId.toLowerCase().includes(q))
    );
  }, [evaluatedTeachers, search, hideBusy]);

  const toggleTeacher = (t: typeof evaluatedTeachers[0]) => {
    if (t.isSelected) {
      onChange(selectedNames.filter(n => n !== t.name));
    } else {
      if (t.isBusy) {
        if (onConflictWarning) {
          onConflictWarning(t.conflictMessage || `Invigilator ${t.name} is already assigned to another class during this time slot!`);
        }
        return; // Block double-assignment
      }
      onChange([...selectedNames, t.name]);
    }
  };

  const removeTeacher = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedNames.filter(n => n !== name));
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-1.5 cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 transition shadow-xs"
      >
        {selectedNames.length === 0 ? (
          <span className="text-slate-400 text-xs font-semibold select-none flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Select faculty...
          </span>
        ) : (
          selectedNames.map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 text-xs font-extrabold border border-sky-200/80 dark:border-sky-800 shadow-xs"
            >
              <span>{name}</span>
              <X
                className="w-3 h-3 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 ml-0.5"
                onClick={(e) => removeTeacher(name, e)}
              />
            </span>
          ))
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto mr-0.5" />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full mt-1 right-0 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-2 max-h-72 overflow-y-auto w-[280px] sm:w-[320px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search faculty or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-500 h-[30px]"
            />
          </div>

          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 px-1 pt-0.5 border-b border-slate-100 dark:border-slate-800 pb-1">
            <span>Faculty List ({filtered.length})</span>
            <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 lowercase">
              <input
                type="checkbox"
                checked={hideBusy}
                onChange={e => setHideBusy(e.target.checked)}
                className="rounded text-sky-600 focus:ring-0 w-3 h-3 cursor-pointer"
              />
              <span>hide busy</span>
            </label>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-left">
            {filtered.map(t => {
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTeacher(t)}
                  className={`w-full text-left px-2 py-2 rounded-xl transition flex flex-col gap-1 cursor-pointer ${
                    t.isSelected
                      ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200'
                      : t.isBusy
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 text-slate-400 dark:text-slate-500 hover:bg-rose-100/70 dark:hover:bg-rose-950/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-6 h-6 rounded-md font-black text-[10px] flex items-center justify-center shrink-0 ${
                        t.isBusy
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {t.name.charAt(0)}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-xs font-black leading-tight ${t.isBusy ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-white'}`}>
                          {t.name}
                        </span>
                        {t.empId && (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            ({t.empId})
                          </span>
                        )}
                      </div>
                    </div>
                    {t.isSelected ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    ) : t.isBusy ? (
                      <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-tight">
                        Busy
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 shrink-0">+ Assign</span>
                    )}
                  </div>

                  {t.isBusy && !t.isSelected && t.conflictDetails && (
                    <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 pl-8 leading-tight flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                      <span>Already assigned to {t.conflictDetails.className} {t.conflictDetails.section ? `(${t.conflictDetails.section})` : ''} • {t.conflictDetails.subject}</span>
                    </div>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-3 text-center text-xs text-slate-400 font-medium">No matching faculty available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const ExamScheduleTable: React.FC<ExamScheduleTableProps> = ({
  scheduleRows,
  isEditing,
  teacherOptions,
  roomOptions = [],
  defaultRoom = '',
  allSchedules = [],
  addToast,
  onUpdateRow,
  subjects,
  onApplyToAll
}) => {
  const tableHeaderClass = "px-3.5 py-3 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] border-b border-r border-sky-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 tracking-wider whitespace-nowrap last:border-r-0";
  const tdClass = "px-3.5 py-3 border-r border-slate-100 dark:border-slate-800 last:border-r-0";

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

  return (
    <div className="overflow-x-auto rounded-3xl border border-sky-400 dark:border-sky-500 shadow-sm min-h-[350px]">
      <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
        <thead>
          <tr>
            <th className={`${tableHeaderClass} min-w-[160px] text-left`}>Subject</th>
            <th className={`${tableHeaderClass} min-w-[155px] text-center`}>Exam Date</th>
            <th className={`${tableHeaderClass} min-w-[290px] text-center`}>Time Slot</th>
            <th className={`${tableHeaderClass} min-w-[90px] text-center`}>Duration</th>
            <th className={`${tableHeaderClass} min-w-[160px] text-left`}>Room / Hall</th>
            <th className={`${tableHeaderClass} min-w-[200px] text-left`}>Invigilator Faculty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {scheduleRows.map((row) => {
            const rawNames = row.invigilatorNames && row.invigilatorNames.length > 0
              ? row.invigilatorNames
              : (row.invigilatorName && row.invigilatorName !== 'TBA' ? [row.invigilatorName] : []);

            const matchSub = (subjects || []).find(
              s => s.name.toLowerCase() === row.subject.toLowerCase() ||
                   s.code?.toLowerCase() === row.subject.toLowerCase() ||
                   s.id === row.subject
            );
            const subCode = matchSub?.code || `${row.subject.substring(0, 3).toUpperCase()}-101`;

            const currentRoom = (row.room && row.room !== 'TBA' && row.room !== 'Unassigned') ? row.room : '';

            return (
              <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition">
                {/* Subject Name with Code Below */}
                <td className={`${tdClass} whitespace-nowrap text-left`}>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 dark:text-white text-xs leading-tight">
                      {row.subject}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold mt-0.5">
                      {subCode}{row.maxMarks ? ` • ${row.maxMarks}M` : ''}
                    </span>
                  </div>
                </td>

                {/* Exam Date */}
                <td className={`${tdClass} whitespace-nowrap text-center`}>
                  {isEditing ? (
                    <div className="flex justify-center">
                      <DatePickerInput
                        value={row.date || ''}
                        onChange={(val: string) => onUpdateRow(row.id, { date: val })}
                        className="w-36 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-sky-500 shadow-xs"
                        placeholder="DD-MM-YYYY"
                      />
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{row.date || '—'}</span>
                  )}
                </td>

                {/* Time Slot */}
                <td className={`${tdClass} whitespace-nowrap text-center`}>
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="time"
                        value={row.startTime || '09:00'}
                        onChange={e => onUpdateRow(row.id, { startTime: e.target.value })}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none w-[128px] focus:border-sky-500 shadow-xs"
                      />
                      <span className="text-slate-400 font-bold text-xs">-</span>
                      <input
                        type="time"
                        value={row.endTime || '12:00'}
                        onChange={e => onUpdateRow(row.id, { endTime: e.target.value })}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none w-[128px] focus:border-sky-500 shadow-xs"
                      />
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{row.startTime} - {row.endTime}</span>
                  )}
                </td>

                {/* Duration */}
                <td className={`${tdClass} font-mono text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap text-center`}>
                  {calculateDurationLabel(row.startTime, row.endTime)}
                </td>

                {/* Room / Hall Selection */}
                <td className={`${tdClass} whitespace-nowrap text-left`}>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        list={`room-list-${row.id}`}
                        value={currentRoom}
                        onChange={e => {
                          const newRoom = e.target.value;
                          if (newRoom && newRoom !== 'TBA' && row.date && row.startTime && row.endTime && allSchedules) {
                            const rCheck = checkRoomCollision(newRoom, row.date, row.startTime, row.endTime, allSchedules, row.id);
                            if (rCheck.hasConflict && addToast) {
                              addToast('warning', 'Room Collision Warning', rCheck.message || '');
                            }
                          }
                          onUpdateRow(row.id, { room: newRoom });
                        }}
                        placeholder={defaultRoom || "Enter Room No / Hall"}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-sky-500 shadow-xs placeholder:text-slate-400"
                      />
                      {roomOptions && roomOptions.length > 0 && (
                        <datalist id={`room-list-${row.id}`}>
                          {roomOptions.map(r => (
                            <option key={r} value={r} />
                          ))}
                        </datalist>
                      )}
                    </div>
                  ) : (
                    currentRoom ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs border border-slate-200/80 dark:border-slate-700/80">
                        <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                        <span>{currentRoom}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">
                        {defaultRoom || 'No classroom assigned'}
                      </span>
                    )
                  )}
                </td>

                {/* Multi-Invigilator Staff with Collision Check */}
                <td className={`${tdClass} text-left`}>
                  {isEditing ? (
                    <MultiInvigilatorSelect
                      selectedNames={rawNames}
                      onChange={(names: string[]) => {
                        onUpdateRow(row.id, {
                          invigilatorNames: names,
                          invigilatorName: names.length > 0 ? names.join(', ') : 'TBA'
                        });
                      }}
                      teacherOptions={teacherOptions}
                      slotDate={row.date}
                      slotStartTime={row.startTime}
                      slotEndTime={row.endTime}
                      allSchedules={allSchedules}
                      currentSlotId={row.id}
                      onConflictWarning={(msg: string) => {
                        if (addToast) {
                          addToast('warning', 'Invigilator Scheduling Conflict', msg);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-wrap items-center gap-1">
                      {rawNames.length === 0 ? (
                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                      ) : (
                        rawNames.map((name: string) => {
                          const conflict = (row.date && row.startTime && row.endTime && allSchedules)
                            ? checkInvigilatorCollision(name, row.date, row.startTime, row.endTime, allSchedules, row.id)
                            : { hasConflict: false };

                          if (conflict.hasConflict) {
                            return (
                              <span
                                key={name}
                                title={conflict.message}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold text-xs border border-rose-300 dark:border-rose-800 shadow-xs"
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>{name} (⚠️ Conflict)</span>
                              </span>
                            );
                          }

                          return (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-200/60 dark:border-sky-900/60"
                            >
                              <User className="w-3 h-3 text-sky-500 shrink-0" />
                              <span>{name}</span>
                            </span>
                          );
                        })
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
export default ExamScheduleTable;
