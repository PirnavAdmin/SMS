import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DatePickerInput } from './SharedUI';
import { Search, ChevronDown, User, X, CheckCircle2 } from 'lucide-react';
import { ExamSchedule, SubjectItem } from '../../../../types';

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
  onUpdateRow: (id: string, updates: Partial<ExamSchedule>) => void;
  onUploadPaper: (id: string, subject: string) => void;
  onPreviewPaper: (subject: string, fileName: string, fileUrl: string) => void;
  subjects: SubjectItem[];
  onApplyToAll?: (row: any) => void;
}

// Multi-Invigilator Searchable Selector with Clean Employee & Code
function MultiInvigilatorSelect({
  selectedNames = [],
  onChange,
  teacherOptions
}: {
  selectedNames: string[];
  onChange: (names: string[]) => void;
  teacherOptions: InvigilatorOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    return (teacherOptions || []).filter(t => {
      if (!t) return false;
      const empId = (t.empId || '').toLowerCase();
      const name = (t.name || '').toLowerCase();
      return empId.includes(q) || name.includes(q);
    });
  }, [teacherOptions, search]);

  const toggleTeacher = (teacher: InvigilatorOption) => {
    const nameKey = teacher.name;
    if (selectedNames.includes(nameKey)) {
      onChange(selectedNames.filter(n => n !== nameKey));
    } else {
      onChange([...selectedNames, nameKey]);
    }
  };

  const removeTeacher = (nameToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedNames.filter(n => n !== nameToRemove));
  };

  return (
    <div ref={wrapperRef} className="relative min-w-[160px] max-w-[240px]">
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none text-left flex flex-wrap items-center gap-1 min-h-[32px] cursor-pointer shadow-xs hover:border-sky-400 transition"
      >
        {selectedNames.length === 0 ? (
          <span className="text-slate-400 text-xs px-1">— Assign Staff —</span>
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
        <div className="absolute z-50 top-full mt-1 right-0 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-1.5 max-h-56 overflow-y-auto w-[250px] sm:w-[270px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search employee or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-500 h-[30px]"
            />
          </div>

          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-1 pt-0.5">
            Faculty List ({filtered.length})
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-left">
            {filtered.map(t => {
              const isSelected = selectedNames.includes(t.name);
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTeacher(t)}
                  className={`w-full text-left px-2 py-1.5 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[10px] flex items-center justify-center shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {t.name}
                      </span>
                      {t.empId && (
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          ({t.empId})
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 shrink-0">+ Assign</span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-3 text-center text-xs text-slate-400 font-medium">No matching staff found.</div>
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
      <table className="w-full text-left text-xs border-collapse min-w-[980px]">
        <thead>
          <tr>
            <th className={`${tableHeaderClass} min-w-[160px] text-left`}>Subject</th>
            <th className={`${tableHeaderClass} min-w-[155px] text-center`}>Exam Date</th>
            <th className={`${tableHeaderClass} min-w-[290px] text-center`}>Time Slot</th>
            <th className={`${tableHeaderClass} min-w-[90px] text-center`}>Duration</th>
            <th className={`${tableHeaderClass} min-w-[110px] text-center`}>Room / Hall</th>
            <th className={`${tableHeaderClass} min-w-[200px] text-left`}>Invigilator Faculty</th>
            {isEditing && <th className={`${tableHeaderClass} min-w-[120px] text-center`}>Actions</th>}
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

                {/* Room / Hall */}
                <td className={`${tdClass} whitespace-nowrap text-center`}>
                  {isEditing ? (
                    <div className="flex justify-center">
                      <input
                        type="text"
                        placeholder="e.g. 101"
                        value={row.room === 'TBA' ? '' : (row.room || '')}
                        onChange={e => onUpdateRow(row.id, { room: e.target.value || 'TBA' })}
                        className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none text-center focus:border-sky-500 shadow-xs"
                      />
                    </div>
                  ) : (
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
                      row.room && row.room !== 'TBA'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 italic'
                    }`}>
                      {row.room || 'TBA'}
                    </span>
                  )}
                </td>

                {/* Multi-Invigilator Staff */}
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
                    />
                  ) : (
                    <div className="flex flex-wrap items-center gap-1">
                      {rawNames.length === 0 ? (
                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                      ) : (
                        rawNames.map((name: string) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-200/60 dark:border-sky-900/60"
                          >
                            <User className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>{name}</span>
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </td>
                {isEditing && (
                  <td className={`${tdClass} whitespace-nowrap text-center`}>
                    <button
                      type="button"
                      onClick={() => onApplyToAll?.(row)}
                      className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 font-black text-[10px] transition cursor-pointer"
                      title="Sync this row's scheduling details to all other sections of this class"
                    >
                      Sync Sections
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
export default ExamScheduleTable;
