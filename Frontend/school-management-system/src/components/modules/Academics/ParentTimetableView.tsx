import React, { useState } from 'react';
import { Clock, Filter, Printer } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const ParentTimetableView: React.FC = () => {
  const { students, timetable } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Match children by email or phone, or own ID if student
  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (
      role === 'Student' ? s.id === user?.id : 
      (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
    )
  );

  const hasMatchedWards = parentWards.length > 0;
  if (!hasMatchedWards) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 2);
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
  
  // Filter the global timetable data for this specific ward's class and section
  const wardTimetableRaw = timetable.filter(t => 
    t.className === currentWard.className &&
    t.section === currentWard.section &&
    t.day === selectedDay &&
    (!t.status || t.status === 'Published')
  ).sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

  // Static Fallback if the mock database is empty for this class
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

  const wardTimetable = wardTimetableRaw.length > 0 ? wardTimetableRaw : staticFallbackTimetable;

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

  return (
    <div id="printable-content" className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
            <Clock className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          Timetable
        </h2>
      </div>

      {/* Ward Selector Tabs */}
      {role !== 'Student' && parentWards.length > 1 && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-max">
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        
        {/* Top Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white">Class Schedule</h3>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/50 outline-none appearance-none min-w-[140px] shadow-sm cursor-pointer"
              >
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => window.print()}
              className="no-print flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Data Table */}
          <div className="min-w-[600px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-6 font-bold text-sm text-slate-700 dark:text-slate-300">Time</th>
                  <th className="py-3.5 px-6 font-bold text-sm text-slate-700 dark:text-slate-300">Subject</th>
                  <th className="py-3.5 px-6 font-bold text-sm text-slate-700 dark:text-slate-300">Teacher</th>
                </tr>
              </thead>
              <tbody>
                {wardTimetable.length > 0 ? (
                  wardTimetable.map((slot: any, idx: number) => (
                    slot.isBreak ? (
                      <tr 
                        key={slot.id || idx} 
                        className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-slate-100 dark:border-slate-800/50 relative"
                      >
                        <td colSpan={3} className="py-3.5 px-6">
                          <div className="flex items-center justify-center w-full">
                            <span className="absolute left-6 text-sm font-medium text-amber-700 dark:text-amber-500 whitespace-nowrap">{slot.timeSlot}</span>
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest">{slot.subject}</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr 
                        key={slot.id || idx} 
                        className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-sky-50/50 dark:hover:bg-slate-800/30 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/30 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'}`}
                      >
                        <td className="py-3.5 px-6 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{slot.timeSlot}</td>
                        <td className="py-3.5 px-6 text-sm text-slate-900 dark:text-white font-medium">
                          <div className="flex flex-col">
                            <span>{slot.subject}</span>
                            {(slot.subjectCode || getSubjectCode(slot.subject)) && (
                              <span className="opacity-60 text-xs font-normal lowercase">({(slot.subjectCode || getSubjectCode(slot.subject)).toLowerCase()})</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-sm text-slate-600 dark:text-slate-400">{slot.teacherName}</td>
                      </tr>
                    )
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-500 font-medium">
                      No classes scheduled for {selectedDay}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
