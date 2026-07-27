import React, { useState } from 'react';
import { Clock, Calendar as CalendarIcon, User, AlertCircle } from 'lucide-react';
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
  
  // Filter the global timetable data for this specific ward's class and section (Published timetables only)
  const wardTimetableRaw = timetable.filter(t => 
    t.className === currentWard.className &&
    t.section === currentWard.section &&
    t.day === selectedDay &&
    (!t.status || t.status === 'Published')
  ).sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

  // Static Fallback if the mock database is empty for this class
  const staticFallbackTimetable = [
    { id: 'mock-1', timeSlot: '08:30 AM - 09:15 AM', subject: 'Mathematics', teacherName: 'Prof. Miller', roomNo: 'Room 101' },
    { id: 'mock-2', timeSlot: '09:15 AM - 10:00 AM', subject: 'Physics', teacherName: 'Dr. Johnson', roomNo: 'Lab 2' },
    { id: 'mock-3', timeSlot: '10:15 AM - 11:00 AM', subject: 'English', teacherName: 'Ms. Davis', roomNo: 'Room 105' },
    { id: 'mock-4', timeSlot: '11:00 AM - 11:45 AM', subject: 'Chemistry', teacherName: 'Mrs. White', roomNo: 'Lab 1' },
  ];

  const wardTimetable = wardTimetableRaw.length > 0 ? wardTimetableRaw : staticFallbackTimetable;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-brand-600" /> Student Timetable (Auto Generated)
        </h2>
        <p className="text-xs text-slate-500 mt-1">Review auto-generated weekly class timetable for your ward(s)</p>
      </div>

      {!hasMatchedWards && (
         <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
               <p className="font-bold">Demo Mode Active</p>
               <p>Your login email/phone ({user?.email}) did not match any guardian records in the database. Showing sample wards for demonstration.</p>
            </div>
         </div>
      )}

      {/* Ward Selector Tabs (Hidden for Students since they only see themselves) */}
      {role !== 'Student' && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedChildIdx === idx
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {ward.firstName} {ward.lastName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-bold transition-colors ${
                selectedDay === day
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="p-6">
          {wardTimetableRaw.length === 0 && (
             <p className="text-xs font-semibold text-brand-500 mb-4 px-4 py-2 bg-brand-50 rounded-lg inline-block">
               Note: Displaying static timetable data as no records were found in the database for {currentWard.className}-{currentWard.section}.
             </p>
          )}

          {wardTimetable.length > 0 ? (
            <div className="space-y-3">
              {wardTimetable.map((slot: any, idx) => (
                <div 
                  key={slot.id || idx} 
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-300 transition-colors"
                >
                  <div className="shrink-0 w-44 px-3 py-2 rounded-xl text-center font-mono text-xs font-bold bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">
                    {slot.timeSlot}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      {slot.subject}
                    </h4>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {slot.teacherName}
                      </span>
                      {slot.roomNo && (
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {slot.roomNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 font-medium">
              No classes scheduled for {selectedDay}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
