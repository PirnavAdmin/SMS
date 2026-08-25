import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, Users, BookOpen, Layers, X, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { students, staff, books } = useData();
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || '';
  const isStudentOrParent = userRole === 'student' || userRole === 'parent';

  // Clear query whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleClearOrClose = () => {
    if (query) {
      setQuery('');
      inputRef.current?.focus();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const filteredStudents = (!isStudentOrParent && query.trim()) ? students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4) : [];

  const filteredStaff = query.trim() ? staff.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    s.designation.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4) : [];

  const filteredBooks = query.trim() ? books.filter(b =>
    b.title.toLowerCase().includes(query.toLowerCase()) ||
    b.author.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3) : [];

  const modules = (isStudentOrParent ? [
    { name: 'Dashboard', module: 'dashboard' },
    { name: 'Attendance', module: 'attendance' },
    { name: 'Time Table', module: 'timetable' },
    { name: 'Report Cards & Exams', module: 'examination' },
    { name: 'Homework', module: 'homework' },
    { name: 'Fee Details & Dues', module: 'parent-fee-dues' },
    { name: 'Teachers Directory', module: 'staff' },
    { name: 'Library Catalog', module: 'library' },
    { name: 'Bus & Transport Info', module: 'parent-bus-info' },
    { name: 'Hostel Details', module: 'parent-hostel-details' },
    { name: 'School Events & Holidays', module: 'events' },
    { name: 'Communication Hub', module: 'communication' }
  ] : [
    { name: 'Dashboard', module: 'dashboard' },
    { name: 'Admissions Management', module: 'admissions' },
    { name: 'Student Directory', module: 'students' },
    { name: 'Academic History', module: 'academic-history' },
    { name: 'Student Attendance', module: 'attendance' },
    { name: 'Student Promotion', module: 'student-promotion' },
    { name: 'Certificates', module: 'certificates' },
    { name: 'Alumni', module: 'alumni' },
    { name: 'Communication Hub', module: 'communication' },
    { name: 'Events & Holidays', module: 'events' },
    { name: 'Faculty Training', module: 'training' },
    { name: 'School Reports', module: 'reports' },
    { name: 'System Settings', module: 'settings' },
    { name: 'Library Inventory', module: 'library' },
    { name: 'Librarian Attendance', module: 'librarian-attendance' },
    { name: 'Library Timetable', module: 'library-timetable' },
    { name: 'Inventory & Supplies', module: 'inventory' },
    // Finance Sub-options
    { name: 'Finance \u2192 Dashboard', module: 'finance-dashboard' },
    { name: 'Finance \u2192 Fee Collection', module: 'finance-fee-collection' },
    { name: 'Finance \u2192 Finance Setup', module: 'finance-masters' },
    { name: 'Finance \u2192 Transactions', module: 'finance-transactions' },
    { name: 'Finance \u2192 Finance Reports', module: 'finance-reports' },
    // Hostel Sub-options
    { name: 'Hostel \u2192 Dashboard', module: 'hostel-dashboard' },
    { name: 'Hostel \u2192 Hostel Master Setup', module: 'hostel-masters' },
    { name: 'Hostel \u2192 Room Allocation', module: 'hostel-student-hostel' },
    { name: 'Hostel \u2192 Hostel Reports', module: 'hostel-reports' },
    // Transport Sub-options
    { name: 'Transport \u2192 Dashboard', module: 'transport-dashboard' },
    { name: 'Transport \u2192 Route & Vehicle Setup', module: 'transport-setup' },
    { name: 'Transport \u2192 Transport Operations', module: 'transport-operations' },
    { name: 'Transport \u2192 Reports', module: 'transport-reports' },
    // Uniform Sub-options
    { name: 'Uniform \u2192 Dashboard', module: 'uniform-dashboard' },
    { name: 'Uniform \u2192 Uniform Configuration', module: 'uniform-masters' },
    { name: 'Uniform \u2192 Student Uniform Distribution', module: 'uniform-student-uniform' },
    { name: 'Uniform \u2192 Uniform Reports', module: 'uniform-reports' },
    // Staff Sub-options (Teachers vs Admin)
    ...(userRole === 'teacher' ? [
      { name: 'Staff \u2192 My Profile', module: 'teacher-profile' },
      { name: 'Staff \u2192 My Attendance', module: 'staff-attendance' },
      { name: 'Staff \u2192 Leave Management', module: 'staff-leave' },
      { name: 'Staff \u2192 My Payslips', module: 'staff-my-payslips' }
    ] : [
      { name: 'Staff \u2192 Staff Directory', module: 'staff-directory' },
      { name: 'Staff \u2192 Staff Attendance', module: 'staff-attendance' },
      { name: 'Staff \u2192 Leave Management', module: 'staff-leave' },
      { name: 'Staff \u2192 Payroll', module: 'staff-payroll' }
    ]),
    // Academics Sub-options
    { name: 'Academics \u2192 Dashboard', module: 'academic-dashboard' },
    { name: 'Academics \u2192 Class Management', module: 'academic-class' },
    { name: 'Academics \u2192 Subject Management', module: 'subjects' },
    { name: 'Academics \u2192 Time Table', module: 'timetable' }
  ]).filter(m => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm"
          />
          <button onClick={handleClearOrClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">

          {/* Students */}
          {filteredStudents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Students
              </div>
              <div className="space-y-1">
                {filteredStudents.map(s => (
                  <div
                    key={s.id}
                    onClick={() => { onNavigate('students'); onClose(); }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={s.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-slate-500">{s.className}-{s.section} • {s.admissionNo}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff */}
          {filteredStaff.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5 text-emerald-500" /> Staff & Teachers
              </div>
              <div className="space-y-1">
                {filteredStaff.map(st => (
                  <div
                    key={st.id}
                    onClick={() => { onNavigate('staff'); onClose(); }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={st.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</p>
                        <p className="text-xs text-slate-500">{st.designation} • {st.department}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Books */}
          {filteredBooks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Library Books
              </div>
              <div className="space-y-1">
                {filteredBooks.map(b => (
                  <div
                    key={b.id}
                    onClick={() => { onNavigate('library'); onClose(); }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{b.title}</p>
                      <p className="text-xs text-slate-500">{b.author} • {b.rackNo}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Quick Jump */}
          {modules.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5 text-sky-500" /> Portal Modules
              </div>
              <div className="space-y-1">
                {modules.map(m => (
                  <div
                    key={m.module}
                    onClick={() => { onNavigate(m.module); onClose(); }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    <span>{m.name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
