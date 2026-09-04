// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Clock, Printer, CalendarOff } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { SchoolPrintHeader } from '../../common/SchoolPrintHeader';
import { getParentChildren, getParentTimetable, ParentChild } from '../../../api/parent/parentApi';

export const ParentTimetableView: React.FC = () => {
  const { students, timetable, periodSettings, teacherAssignments, academicClasses, subjects: masterSubjects } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);
  const [apiTimetableSlots, setApiTimetableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchChildren = async () => {
      try {
        const children = await getParentChildren(user?.email);
        if (isMounted && children && children.length > 0) {
          setApiChildren(children);
        }
      } catch (err) {
        console.warn('Failed to load parent children in timetable view:', err);
      }
    };
    fetchChildren();
    return () => { isMounted = false; };
  }, [user?.email]);

  const parentWards = React.useMemo(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    if (apiChildren.length > 0) {
      return apiChildren.map(c => ({
        id: String(c.studentId),
        studentId: c.studentId,
        firstName: c.firstName || c.studentName.split(' ')[0],
        lastName: c.lastName || '',
        studentName: c.studentName,
        className: c.className || 'Class 10',
        section: c.sectionName || 'A',
        status: 'Active'
      }));
    } else {
      const localMatches = students.filter(s => 
        s.status === 'Active' && 
        (
          role === 'Student' ? (s.id === user?.id || (s.email && s.email.toLowerCase() === userEmail)) :
          (
            (userEmail && (
              s.guardianEmail?.toLowerCase() === userEmail || 
              s.guardianPhone?.toLowerCase() === userEmail || 
              s.contactEmail?.toLowerCase() === userEmail || 
              s.contactPhone?.toLowerCase() === userEmail ||
              s.fatherPhone?.toLowerCase() === userEmail ||
              s.motherPhone?.toLowerCase() === userEmail
            )) ||
            (userName && (
              s.fatherName?.toLowerCase() === userName ||
              s.motherName?.toLowerCase() === userName ||
              s.guardianName?.toLowerCase() === userName
            ))
          )
        )
      );
      return localMatches.length > 0 ? localMatches : students.filter(s => s.status === 'Active').slice(0, 1);
    }
  }, [students, user, role, apiChildren]);

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

  useEffect(() => {
    let isMounted = true;
    const fetchTimetable = async () => {
      setLoading(true);
      try {
        const studentId = currentWard?.studentId || currentWard?.id;
        if (studentId) {
          const data = await getParentTimetable(Number(studentId));
          if (isMounted) {
            if (Array.isArray(data) && data.length > 0) {
              const flattened: any[] = [];
              data.forEach((item: any) => {
                if (item.slots && Array.isArray(item.slots)) {
                  item.slots.forEach((s: any) => {
                    flattened.push({
                      day: item.dayOfWeek || s.dayOfWeek,
                      dayOfWeek: item.dayOfWeek || s.dayOfWeek,
                      periodName: s.periodName || 'Period',
                      timeSlot: s.timeSlot || `${s.startTime} - ${s.endTime}`,
                      startTime: s.startTime,
                      endTime: s.endTime,
                      subject: s.subjectName || s.subject,
                      subjectName: s.subjectName || s.subject,
                      teacherName: s.teacherName,
                      roomNo: s.roomNo || '101',
                      isBreak: s.subjectName?.toLowerCase().includes('break') || s.subjectName?.toLowerCase().includes('lunch')
                    });
                  });
                } else if (item.day || item.dayOfWeek || item.subject || item.subjectName) {
                  flattened.push({
                    day: item.day || item.dayOfWeek,
                    dayOfWeek: item.day || item.dayOfWeek,
                    periodName: item.periodName || 'Period',
                    timeSlot: item.timeSlot || `${item.startTime} - ${item.endTime}`,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    subject: item.subject || item.subjectName,
                    subjectName: item.subject || item.subjectName,
                    teacherName: item.teacherName,
                    roomNo: item.roomNo || '101',
                    isBreak: (item.subject || item.subjectName || '').toLowerCase().includes('break') || (item.subject || item.subjectName || '').toLowerCase().includes('lunch')
                  });
                }
              });
              setApiTimetableSlots(flattened);
            } else {
              setApiTimetableSlots([]);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load api timetable:', err);
        if (isMounted) setApiTimetableSlots([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTimetable();
    return () => { isMounted = false; };
  }, [currentWard]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (!currentWard) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active wards found in the system.
      </div>
    );
  }

  const norm = (str?: string) => (str || '').toLowerCase().replace(/class|section/gi, '').trim();
  const wardClassNorm = norm(currentWard.className);
  const wardSecNorm = norm(currentWard.section);

  // Filter global database timetable matching this ward's class and section exactly as Admin does
  const matchingDbSlots = (timetable || []).filter(t => {
    const tClassNorm = norm(t.className);
    const tSecNorm = norm(t.section);
    const matchesClass = tClassNorm === wardClassNorm || tClassNorm.includes(wardClassNorm) || wardClassNorm.includes(tClassNorm);
    const matchesSection = !wardSecNorm || !tSecNorm || tSecNorm === 'all' || tSecNorm === wardSecNorm;
    return matchesClass && matchesSection;
  });

  // Combine API and DB slots
  const explicitTimetableSlots = apiTimetableSlots.length > 0 ? apiTimetableSlots : matchingDbSlots;

  // Real timetable check: ONLY true if explicit slots exist for this class & section
  const hasTimetable = explicitTimetableSlots.length > 0;

  // Active periods timeline from periodSettings or from explicit slots
  const activePeriods = (periodSettings || []).filter(p => p.status === 'Active');
  const fromSettings = activePeriods.map(p => `${p.startTime} - ${p.endTime}`);
  const fromData = explicitTimetableSlots.map(t => t.timeSlot || t.periodTime || `${t.startTime || ''} - ${t.endTime || ''}`.trim());

  const parseSortable = (ts: any) => {
    if (!ts || typeof ts !== 'string') return 9999;
    const match = ts.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 9999;
    let [_, h, m, p] = match;
    let hr = parseInt(h, 10);
    if (p.toUpperCase() === 'PM' && hr !== 12) hr += 12;
    if (p.toUpperCase() === 'AM' && hr === 12) hr = 0;
    return hr * 60 + parseInt(m, 10);
  };

  const timeSlots = Array.from(new Set(hasTimetable ? (fromData.length > 0 ? fromData : fromSettings) : []))
    .filter(s => s && s.trim() !== '' && s !== '-')
    .sort((a, b) => parseSortable(a) - parseSortable(b));

  const getSubjectCode = (subjectName: string, fallbackCode?: string) => {
    if (!subjectName || subjectName.toLowerCase() === 'break' || subjectName.toLowerCase().includes('lunch')) return '';
    const master = (masterSubjects || []).find(sub => norm(sub.name) === norm(subjectName));
    if (master?.code) return master.code;
    return fallbackCode || '';
  };

  // Helper to resolve slot details from explicit DB/API slot
  const getSlotDataForDayTime = (day: string, slot: string, pIdx: number) => {
    const explicit = explicitTimetableSlots.find(t => {
      const matchDay = !t.day || t.day === 'All' || t.day.toLowerCase() === day.toLowerCase() || (t.dayOfWeek && t.dayOfWeek.toLowerCase() === day.toLowerCase());
      const tSlot = (t.timeSlot || t.periodTime || `${t.startTime || ''} - ${t.endTime || ''}`).trim();
      return matchDay && (tSlot === slot || tSlot.toLowerCase() === slot.toLowerCase() || tSlot.replace(/\s+/g, '') === slot.replace(/\s+/g, ''));
    });

    if (explicit) {
      const subName = explicit.subject || explicit.subjectName || 'Subject';
      return {
        subject: subName,
        subjectCode: getSubjectCode(subName, explicit.subjectCode),
        teacherName: explicit.teacherName || explicit.facultyName || '',
        roomNo: explicit.roomNo || '101',
        isBreak: explicit.isBreak || subName.toLowerCase() === 'break' || subName.toLowerCase().includes('lunch')
      };
    }

    return null;
  };

  return (
    <div id="printable-content" className="space-y-6 animate-in fade-in timetable-printable">
      
      {/* Page Header (No Print) */}
      <div className="flex justify-between items-center no-print">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
          Timetable
        </h2>
      </div>

      {/* Ward Selector Tabs (No Print) */}
      {role !== 'Student' && parentWards.length > 1 && (
        <div className="flex p-1 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl w-max shadow-xs no-print">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedChildIdx === idx
                  ? 'bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs border border-sky-200 dark:border-sky-700'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {ward.firstName} {ward.lastName} <span className="text-[10px] font-bold opacity-60 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      {/* Timetable Content */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-300 dark:border-sky-800 p-12 text-center shadow-xs">
          <div className="animate-spin w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs font-bold text-slate-400 mt-3">Loading timetable...</p>
        </div>
      ) : !hasTimetable ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-300 dark:border-sky-800 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3.5">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800 shadow-2xs">
            <CalendarOff className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Timetable Not Generated
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              No timetable has been generated or published for <strong className="text-slate-700 dark:text-slate-200">{currentWard.className} — Section {currentWard.section}</strong> yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-300 dark:border-sky-800 overflow-hidden shadow-xs p-6 space-y-6">
          
          {/* School Header */}
          <SchoolPrintHeader
            title={`Class Timetable - ${currentWard.className} (Section ${currentWard.section})`}
            subtitle={`Student: ${currentWard.name || ''}`}
          />
          
          <div className="flex items-center justify-end gap-3 no-print">
            <button 
              onClick={() => window.print()}
              className="no-print flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-sky-50/60 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-600" />
              <span>Print / Download</span>
            </button>
          </div>

          {/* Weekly Grid Table */}
          <div className="overflow-x-auto rounded-xl border border-sky-200/80 dark:border-sky-800/80">
            <table className="w-full text-left border-collapse text-xs min-w-[850px]">
              <thead>
                <tr className="bg-sky-50/80 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 font-extrabold uppercase tracking-wider border-b border-sky-200 dark:border-sky-800">
                  <th className="sticky left-0 z-20 bg-sky-50 dark:bg-slate-900 py-3.5 px-4 min-w-[155px] border-r border-sky-200 dark:border-sky-800 shadow-xs">
                    Period & Time
                  </th>
                  {days.map(day => (
                    <th key={day} className="py-3.5 px-3 text-center min-w-[125px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-medium divide-y divide-sky-100/70 dark:divide-sky-900/30">
                {timeSlots.map((slot, pIdx) => {
                  const matchingPeriodSetting = activePeriods.find(p => `${p.startTime} - ${p.endTime}` === slot);
                  const isBreakSlot = matchingPeriodSetting?.periodType === 'Break' || matchingPeriodSetting?.periodType === 'Lunch';

                  if (isBreakSlot) {
                    return (
                      <tr key={slot} className="bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold border-y border-amber-200/60 dark:border-amber-900/40">
                        <td className="sticky left-0 z-10 bg-amber-50 dark:bg-slate-900 py-2.5 px-4 font-mono font-bold text-xs border-r border-amber-200/60 dark:border-amber-900/40">
                          {slot}
                        </td>
                        <td colSpan={days.length} className="py-2.5 px-4 text-center uppercase tracking-widest text-[11px] font-black">
                          ☕ {matchingPeriodSetting?.periodName || 'Break Interval'}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={slot} className="hover:bg-sky-50/30 dark:hover:bg-slate-800/30 text-slate-900 dark:text-slate-100">
                      <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 py-3 px-4 font-mono font-bold whitespace-nowrap border-r border-sky-100 dark:border-sky-900/60 shadow-xs">
                        <span className="text-sky-600 dark:text-sky-400 block text-[9.5px] uppercase tracking-wider font-extrabold mb-0.5">
                          {matchingPeriodSetting?.periodName || `Period ${pIdx + 1}`}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                          {slot}
                        </span>
                      </td>
                      
                      {days.map(day => {
                        const match = getSlotDataForDayTime(day, slot, pIdx);

                        if (!match) {
                          return (
                            <td key={day} className="py-3 px-3 text-center text-slate-350 dark:text-slate-600">
                              —
                            </td>
                          );
                        }

                        if (match.isBreak) {
                          return (
                            <td key={day} className="py-3 px-3 text-center bg-amber-50/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-extrabold text-[11px]">
                              ☕ {match.subject || 'Break'}
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="py-3 px-2 text-center">
                            <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-sky-100 dark:border-sky-900/40 space-y-1">
                              <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                {match.subject}
                                {match.subjectCode && (
                                  <span className="text-[10px] text-slate-400 font-semibold ml-1">
                                    ({match.subjectCode.toLowerCase()})
                                  </span>
                                )}
                              </div>
                              {match.teacherName && (
                                <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 truncate">
                                  {match.teacherName}
                                </div>
                              )}
                              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                                {match.roomNo ? `Room ${String(match.roomNo).replace(/^Room\s*/i, '')}` : 'Room 101'}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
