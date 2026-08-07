import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DatePickerInput } from './SharedUI';
import { Search, Edit, Check, Upload, Eye, CheckCircle2, ChevronDown } from 'lucide-react';
import { ExamSchedule } from '../../../../types';

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
  onApplyToAllSections: (row: any) => void;
  onUploadPaper: (id: string, subject: string) => void;
  onPreviewPaper: (subject: string, fileName: string, fileUrl: string) => void;
  subjects: any[];
}

// Searchable Invigilator Select
function SearchableInvigilatorSelect({
  value,
  onChange,
  teacherOptions
}: {
  value: string;
  onChange: (val: string) => void;
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
      const formatted = (t.formatted || '').toLowerCase();
      const empId = (t.empId || '').toLowerCase();
      const name = (t.name || '').toLowerCase();
      return formatted.includes(q) || empId.includes(q) || name.includes(q);
    });
  }, [teacherOptions, search]);

  const formatInvigilatorName = (val: string) => {
    const matched = teacherOptions.find(t => t.formatted === val || t.name === val);
    return matched ? matched.formatted : val;
  };

  return (
    <div ref={wrapperRef} className="relative w-44">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-900 dark:text-white outline-none text-left flex items-center justify-between shadow-sm"
      >
        <span className="truncate">{value ? formatInvigilatorName(value) : 'Select Staff'}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute z-30 bottom-full mb-1 left-0 right-0 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-1 max-h-48 overflow-y-auto min-w-[200px]">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-6 pr-2 py-1 rounded bg-slate-50 dark:bg-slate-800 text-[10px] outline-none border border-slate-100"
            />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-1 text-left">
            <button
              type="button"
              onClick={() => {
                onChange('TBA');
                setIsOpen(false);
              }}
              className="w-full text-left px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
            >
              — Unassigned (TBA) —
            </button>

            {filtered.map(t => (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  onChange(t.formatted || t.name || 'TBA');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-1 text-[10px] font-bold rounded ${
                  value === t.formatted || value === t.name
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                    : 'text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t.formatted || t.name}
              </button>
            ))}
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
  onApplyToAllSections,
  onUploadPaper,
  onPreviewPaper,
  subjects
}) => {
  const tableHeaderClass = "px-3 py-2 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50";

  const calculateDurationLabel = (start: string, end: string) => {
    if (!start || !end) return '—';
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (totalMinutes <= 0) return 'Invalid Time';
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 ? `${mins}m` : ''}`.trim() || '0m';
  };

  const formatSubject = (subjectName: string) => {
    const match = subjects.find(s => s.name === subjectName || s.id === subjectName);
    return match ? `${match.code || ''} - ${match.name}` : subjectName;
  };

  const formatInvigilator = (nameVal: string) => {
    const matched = teacherOptions.find(t => t.name === nameVal || t.formatted === nameVal);
    return matched ? matched.formatted : nameVal || 'TBA';
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <table className="min-w-full text-left text-xs border-collapse">
        <thead>
          <tr>
            <th className={tableHeaderClass}>Subject</th>
            <th className={tableHeaderClass}>Exam Date</th>
            <th className={tableHeaderClass}>Start Time</th>
            <th className={tableHeaderClass}>End Time</th>
            <th className={tableHeaderClass}>Duration</th>
            <th className={tableHeaderClass}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {scheduleRows.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
              {/* Subject */}
              <td className="px-3 py-3 font-extrabold text-slate-900 dark:text-white">
                {formatSubject(row.subject)}
              </td>

              {/* Date */}
              <td className="px-3 py-3">
                {isEditing ? (
                  <DatePickerInput
                    value={row.date}
                    onChange={(val: string) => onUpdateRow(row.id, { date: val })}
                    className="w-32 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none"
                  />
                ) : (
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{row.date}</span>
                )}
              </td>

              {/* Start Time */}
              <td className="px-3 py-3">
                {isEditing ? (
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={e => onUpdateRow(row.id, { startTime: e.target.value })}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold outline-none w-20"
                  />
                ) : (
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{row.startTime}</span>
                )}
              </td>

              {/* End Time */}
              <td className="px-3 py-3">
                {isEditing ? (
                  <input
                    type="time"
                    value={row.endTime}
                    onChange={e => onUpdateRow(row.id, { endTime: e.target.value })}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold outline-none w-20"
                  />
                ) : (
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{row.endTime}</span>
                )}
              </td>

              {/* Duration */}
              <td className="px-3 py-3 font-mono text-slate-500 font-bold">
                {calculateDurationLabel(row.startTime, row.endTime)}
              </td>



              {/* Actions */}
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  {/* Upload */}
                  <button
                    type="button"
                    onClick={() => onUploadPaper(row.id, row.subject)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Upload Question Paper"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>

                  {/* Preview Paper */}
                  {row.questionPaperUrl && (
                    <button
                      type="button"
                      onClick={() => onPreviewPaper(row.subject, row.questionPaperName || '', row.questionPaperUrl)}
                      className="p-1.5 rounded-lg bg-sky-600 text-white"
                      title="View Question Paper"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Apply to All Sections */}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => onApplyToAllSections(row)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition"
                      title="Apply this schedule to all sections of this Class"
                    >
                      Apply All Sections
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
