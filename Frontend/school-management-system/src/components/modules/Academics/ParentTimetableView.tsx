import React, { useState, useEffect } from 'react';
import { Clock, Printer } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getParentChildren, ParentChild } from '../../../api/parent/parentApi';

export const ParentTimetableView: React.FC = () => {
  const { students, timetable, academicClasses } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);

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

  // Match children by email or phone, or own ID if student
  let parentWards: any[] = [];
  if (apiChildren.length > 0) {
    parentWards = apiChildren.map(c => ({
      id: String(c.studentId),
      studentId: c.studentId,
      firstName: c.firstName || c.studentName.split(' ')[0],
      lastName: c.lastName || '',
      studentName: c.studentName,
      className: c.className || 'Class 6',
      section: c.sectionName || 'A',
      status: 'Active'
    }));
  } else {
    const localMatches = students.filter(s => 
      s.status === 'Active' && 
      (
        role === 'Student' ? s.id === user?.id : 
        (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
      )
    );
    if (localMatches.length > 0) {
      parentWards = localMatches;
    } else {
      parentWards = students.filter(s => s.status === 'Active').slice(0, 2);
    }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active wards found in the system.
      </div>
    );
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  
  // Filter the global timetable data for this specific ward's class and section for the whole week
  const wardTimetableWholeWeek = timetable.filter(t => 
    t.className === currentWard.className &&
    t.section === currentWard.section &&
    (!t.status || t.status === 'Published')
  );

  const hasDbTimetable = wardTimetableWholeWeek.length > 0;

  // Extract unique timeSlots from DB or fallback
  const dbTimeSlots = Array.from(new Set(wardTimetableWholeWeek.map(t => t.timeSlot)))
    .filter(Boolean)
    .sort((a, b) => (a || '').localeCompare(b || ''));

  const staticFallbackTimetable = [
    { id: 'mock-1', timeSlot: '08:30 AM - 09:15 AM', subject: 'Mathematics', subjectCode: 'MAT-101', teacherName: 'Viollet D\'Amore' },
    { id: 'mock-2', timeSlot: '09:15 AM - 10:00 AM', subject: 'English', subjectCode: 'ENG-103', teacherName: 'Annamae Schmeler' },
    { id: 'mock-short-break', timeSlot: '10:00 AM - 10:15 AM', subject: 'Break', isBreak: true },
    { id: 'mock-3', timeSlot: '10:15 AM - 11:00 AM', subject: 'Chemistry', subjectCode: 'CHE-104', teacherName: 'Betsy Jast' },
    { id: 'mock-4', timeSlot: '11:00 AM - 11:45 AM', subject: 'Mathematics', subjectCode: 'MAT-101', teacherName: 'Viollet D\'Amore' },
    { id: 'mock-break', timeSlot: '11:45 AM - 12:30 PM', subject: 'Lunch Break', isBreak: true },
    { id: 'mock-5', timeSlot: '12:30 PM - 01:15 PM', subject: 'English', subjectCode: 'ENG-103', teacherName: 'Annamae Schmeler' },
    { id: 'mock-6', timeSlot: '01:15 PM - 02:00 PM', subject: 'Physics', subjectCode: 'PHY-102', teacherName: 'Robert Chen' },
  ];

  const timeSlots = hasDbTimetable ? dbTimeSlots : staticFallbackTimetable.map(s => s.timeSlot);

  const getSubjectCode = (subjectName: string) => {
    if (!subjectName || subjectName === 'Break' || subjectName === 'Lunch Break') return '';
    const name = subjectName.toLowerCase();
    if (name.includes('math')) return 'MAT-101';
    if (name.includes('english')) return 'ENG-103';
    if (name.includes('physics')) return 'PHY-102';
    if (name.includes('chemistry')) return 'CHE-104';
    if (name.includes('biology')) return 'BIO-105';
    if (name.includes('science')) return 'SCI-106';
    if (name.includes('computer')) return 'CS-105';
    return `${subjectName.substring(0, 3).toUpperCase()}-101`;
  };

  const getDisplayRoom = (slotRoom?: string, className?: string, section?: string): string => {
    const trimmedSlot = (slotRoom || '').trim();
    if (
      trimmedSlot &&
      trimmedSlot.toLowerCase() !== 'classroom' &&
      trimmedSlot.toLowerCase() !== 'unassigned' &&
      trimmedSlot.toLowerCase() !== 'undefined' &&
      trimmedSlot.toLowerCase() !== 'null'
    ) {
      if (/^\d+[A-Za-z]?$/.test(trimmedSlot)) {
        return `Room ${trimmedSlot}`;
      }
      return trimmedSlot;
    }

    const targetClass = className || currentWard?.className;
    const targetSection = section || currentWard?.section;
    const cls = academicClasses?.find(
      c => c.name?.toLowerCase().trim() === targetClass?.toLowerCase().trim()
    );
    const secRoom = cls?.sectionDetails?.[targetSection]?.roomNo?.trim();

    if (
      secRoom &&
      secRoom.toLowerCase() !== 'classroom' &&
      secRoom.toLowerCase() !== 'unassigned' &&
      secRoom.toLowerCase() !== 'undefined' &&
      secRoom.toLowerCase() !== 'null'
    ) {
      if (/^\d+[A-Za-z]?$/.test(secRoom)) {
        return `Room ${secRoom}`;
      }
      return secRoom;
    }

    return 'No Classroom Assigned';
  };

  return (
    <div id="printable-content" className="space-y-6 animate-in fade-in timetable-printable">
      
      {/* Page Header (No Print) */}
      <div className="flex justify-between items-center no-print">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
            <Clock className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          Timetable
        </h2>
      </div>

      {/* Ward Selector Tabs (No Print) */}
      {role !== 'Student' && parentWards.length > 1 && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-max no-print">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedChildIdx === idx
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50'
              }`}
            >
              {ward.firstName} {ward.lastName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      {/* Timetable Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm p-6 space-y-6">
        
        {/* School Header (Required for download/print, always visible on top) */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">PIRNAV SCHOOLS</h1>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Class Timetable</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="inline-block px-3 py-1.5 bg-brand-50/50 dark:bg-slate-800 text-xs font-black text-brand-700 dark:text-brand-400 border border-brand-200/50 dark:border-slate-700 rounded-lg">
              {currentWard.className} — Section {currentWard.section}
            </span>

            <button 
              onClick={() => window.print()}
              className="no-print flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download</span>
            </button>
          </div>
        </div>

        {/* Weekly Grid Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 min-w-[140px]">Period & Time</th>
                  {days.map(day => (
                    <th key={day} className="py-3 px-4 text-center min-w-[130px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-medium divide-y divide-slate-100 dark:divide-slate-800/80">
                {timeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 1} className="py-16 text-center text-slate-400 dark:text-slate-500">
                      No period slots allocated for {currentWard.className} - Section {currentWard.section}.
                    </td>
                  </tr>
                ) : (
                  timeSlots.map((slot, pIdx) => {
                    const isFallbackBreak = !hasDbTimetable && staticFallbackTimetable.find(s => s.timeSlot === slot)?.isBreak;
                    
                    if (isFallbackBreak) {
                      const breakObj = staticFallbackTimetable.find(s => s.timeSlot === slot);
                      return (
                        <tr key={slot} className="bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold">
                          <td className="py-3 px-4 font-mono">{slot}</td>
                          <td colSpan={days.length} className="py-3 px-4 text-center uppercase tracking-widest text-[11px]">
                            ☕ {breakObj?.subject || 'Break Interval'}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={slot} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-900 dark:text-slate-100">
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap bg-slate-50/40 dark:bg-slate-800/10">
                          <span className="text-brand-600 dark:text-brand-400 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">
                            Period {pIdx + 1}
                          </span>
                          {slot}
                        </td>
                        
                        {days.map(day => {
                          let match: any = null;
                          if (hasDbTimetable) {
                            match = wardTimetableWholeWeek.find(t => t.day === day && t.timeSlot === slot);
                          } else {
                            match = staticFallbackTimetable.find(s => s.timeSlot === slot);
                          }

                          if (match?.isBreak) {
                            return (
                              <td key={day} className="py-3 px-2 text-center align-middle bg-amber-50/20 dark:bg-amber-950/10 text-amber-700 font-extrabold">
                                {match.subject}
                              </td>
                            );
                          }

                          return (
                            <td key={day} className="py-3 px-2 text-center align-middle">
                              {match ? (
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1 text-left mx-auto w-36 hover:shadow-xs transition-all">
                                  <p className="font-extrabold text-slate-900 dark:text-white truncate">
                                    {match.subject}
                                    {(() => {
                                      const code = match.subjectCode || getSubjectCode(match.subject);
                                      return code ? ` (${code.toLowerCase()})` : '';
                                    })()}
                                  </p>
                                  <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 truncate">{match.teacherName || 'Instructor'}</p>
                                  <div className="pt-1">
                                    {(() => {
                                      const displayRoom = getDisplayRoom(match.roomNo, currentWard.className, currentWard.section);
                                      const isUnassigned = displayRoom === 'No Classroom Assigned';
                                      return (
                                        <span
                                          title={isUnassigned ? 'No Classroom Assigned' : `Room: ${displayRoom}`}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border truncate block max-w-[100px] ${
                                            isUnassigned
                                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-900/50'
                                              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                          }`}
                                        >
                                          {displayRoom}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-350 dark:text-slate-600 italic text-[11px]">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
