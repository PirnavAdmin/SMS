import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { DailyAttendance } from '../../../types';

export const AttendanceView: React.FC = () => {
  const { students, staff, attendance, markAttendance, academicClasses } = useData();
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const dbTeacher = role === 'Teacher' ? staff.find(s => s.email === user?.email && s.employeeCategory === 'Teacher') || staff.find(s => s.employeeCategory === 'Teacher') : null;
  const teacher = dbTeacher || (role === 'Teacher' ? {
    assignedClasses: ['10-A', '9-B']
  } : null);
  const assignedClasses = teacher?.assignedClasses || [];
  
  // Extract distinct class names and sections from assignedClasses (e.g. ["10-A", "10-B"])
  const teacherClassNames = Array.from(new Set(assignedClasses.map(c => c.split('-')[0])));
  
  const classOptions = useMemo(() => {
    if (role === 'Teacher') return teacherClassNames;
    return academicClasses.map(c => c.name);
  }, [academicClasses, role, teacherClassNames]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState(classOptions[0] || 'Class 10');
  const [selectedSection, setSelectedSection] = useState('All Sections');

  const sectionOptions = useMemo(() => {
    if (role === 'Teacher') {
      return assignedClasses.filter(c => c.startsWith(selectedClass + '-')).map(c => c.split('-')[1]);
    }
    return academicClasses.find(c => c.name === selectedClass)?.sections || [];
  }, [academicClasses, selectedClass, role, assignedClasses]);

  useEffect(() => {
    if (selectedSection !== 'All Sections' && !sectionOptions.includes(selectedSection)) {
      setSelectedSection('All Sections');
    }
  }, [selectedClass, selectedSection, sectionOptions]);

  // Local state for grid edit
  const classStudents = students.filter(s =>
    s.className === selectedClass &&
    (selectedSection === 'All Sections' || s.section === selectedSection)
  );

  const getAttendanceStatus = (entityId: string): DailyAttendance['status'] => {
    const record = attendance.find(a => a.date === date && a.entityId === entityId);
    return record ? record.status : 'Present';
  };

  const handleSingleMark = (entityId: string, type: 'Student', status: DailyAttendance['status']) => {
    markAttendance([{ date, entityId, entityType: type, status }]);
  };

  const markAllClass = (status: DailyAttendance['status']) => {
    const records: DailyAttendance[] = classStudents.map(s => ({
      date,
      entityId: s.id,
      entityType: 'Student',
      status
    }));
    markAttendance(records);
    addToast('success', 'Bulk Attendance Marked', `Set all ${selectedClass}${selectedSection !== 'All Sections' ? `-${selectedSection}` : ''} students to ${status}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-sky-600" /> Student Attendance
          </h2>
          <p className="text-xs text-slate-500">Log student daily attendance and view attendance records</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Class Grade</label>
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setSelectedSection('All Sections');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
            >
              {classOptions.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
            >
              <option value="All Sections">All Sections</option>
              {sectionOptions.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 sm:ml-auto">
            <button
              onClick={() => markAllClass('Present')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 hover:bg-emerald-100 text-xs font-bold transition-colors"
            >
              All Present
            </button>
            <button
              onClick={() => markAllClass('Absent')}
              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/80 hover:bg-rose-100 text-xs font-bold transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Student Attendance List Content View */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            Showing students for {selectedClass}{selectedSection !== 'All Sections' ? ` - ${selectedSection}` : ' - All Sections'} ({classStudents.length} Students)
          </span>
          <span className="text-slate-400 font-semibold">Date: {date}</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {classStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-xs">
              No students found for {selectedClass} {selectedSection !== 'All Sections' ? `(${selectedSection})` : ''}.
            </div>
          ) : (
            classStudents.map(s => {
              const currentStatus = getAttendanceStatus(s.id);
              return (
                <div key={s.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={s.avatar} alt="" className="w-8 h-8 rounded-xl object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</p>
                      <p className="text-[10px] text-slate-400">Roll: {s.rollNo} • Adm: {s.admissionNo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSingleMark(s.id, 'Student', 'Present')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      onClick={() => handleSingleMark(s.id, 'Student', 'Absent')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        currentStatus === 'Absent'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      onClick={() => handleSingleMark(s.id, 'Student', 'Late')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        currentStatus === 'Late'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Late
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
