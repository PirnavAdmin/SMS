import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, Users, BookOpen, Layers, X, ArrowRight, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { hasModuleAccess } from '../../utils/rbac';
import { validateSearchQuery } from '../../utils/validation';

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

  const searchValidation = query.trim() ? validateSearchQuery(query, 100) : { isValid: true };
  const isQueryValid = searchValidation.isValid;

  const filteredStudents = (!isStudentOrParent && isQueryValid && query.trim()) ? students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4) : [];

  const filteredStaff = (isQueryValid && query.trim()) ? staff.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    s.designation.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4) : [];

  const filteredBooks = (isQueryValid && query.trim()) ? books.filter(b =>
    b.title.toLowerCase().includes(query.toLowerCase()) ||
    b.author.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3) : [];

  const modules = (!isQueryValid && query.trim()) ? [] : (isStudentOrParent ? [
    { name: 'Dashboard', module: 'dashboard' },
    { name: 'Attendance', module: 'attendance' },
    { name: 'Time Table', module: 'timetable' },
    { name: 'Report Cards & Results', module: 'report-cards' },
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
    { name: 'Student Attendance', module: 'attendance' },
    { name: 'Student Promotion', module: 'student-promotion' },
    { name: 'Certificates', module: 'certificates' },
    { name: 'Alumni', module: 'alumni' },
    { name: 'Examination', module: 'examination' },
    { name: 'Report Cards', module: 'report-cards' },
    { name: 'Homework', module: 'homework' },
    { name: 'Communication Hub', module: 'communication' },
    { name: 'Events & Holidays', module: 'events' },
    { name: 'Faculty Training', module: 'training' },
    { name: 'School Reports', module: 'reports' },
    { name: 'Roles & Permissions', module: 'users' },
    { name: 'System Settings', module: 'settings' },
    { name: 'Library Inventory', module: 'library' },
    { name: 'Librarian Attendance', module: 'librarian-attendance' },
    { name: 'Library Timetable', module: 'library-timetable' },
    { name: 'Inventory & Supplies', module: 'inventory' },
    // Examination Sub-options
    { name: 'Examination → Exam Setup', module: 'examination' },
    { name: 'Examination → Exam Schedule & Timetable', module: 'examination' },
    { name: 'Examination → Marks Entry', module: 'examination' },
    { name: 'Examination → Grading Configuration', module: 'examination' },
    { name: 'Examination → Results Management', module: 'examination' },
    // Finance Sub-options
    { name: 'Finance → Dashboard', module: 'finance-dashboard' },
    { name: 'Finance → Fee Collection', module: 'finance-fee-collection' },
    { name: 'Finance → Finance Setup', module: 'finance-masters' },
    { name: 'Finance → Transactions', module: 'finance-transactions' },
    { name: 'Finance → Finance Reports', module: 'finance-reports' },
    // Hostel Sub-options
    { name: 'Hostel → Dashboard', module: 'hostel-dashboard' },
    { name: 'Hostel → Hostel Master Setup', module: 'hostel-masters' },
    { name: 'Hostel → Room Allocation', module: 'hostel-student-hostel' },
    { name: 'Hostel → Hostel Reports', module: 'hostel-reports' },
    // Transport Sub-options
    { name: 'Transport → Dashboard', module: 'transport-dashboard' },
    { name: 'Transport → Route & Vehicle Setup', module: 'transport-setup' },
    { name: 'Transport → Transport Operations', module: 'transport-operations' },
    { name: 'Transport → Reports', module: 'transport-reports' },
    // Uniform Sub-options
    { name: 'Uniform → Dashboard', module: 'uniform-dashboard' },
    { name: 'Uniform → Uniform Configuration', module: 'uniform-masters' },
    { name: 'Uniform → Uniform Distribution', module: 'uniform-student-uniform' },
    { name: 'Uniform → Uniform Reports', module: 'uniform-reports' },
    // Staff Sub-options (Teachers vs Admin)
    ...(userRole === 'teacher' ? [
      { name: 'Staff → My Profile', module: 'teacher-profile' },
      { name: 'Staff → My Attendance', module: 'staff-attendance' },
      { name: 'Staff → Leave Management', module: 'staff-leave' },
      { name: 'Staff → My Payslips', module: 'staff-my-payslips' }
    ] : [
      { name: 'Staff → Staff Directory', module: 'staff-directory' },
      { name: 'Staff → Offer & Relieving Letters', module: 'staff-letters' },
      { name: 'Staff → Staff Attendance', module: 'staff-attendance' },
      { name: 'Staff → Leave Management', module: 'staff-leave' },
      { name: 'Staff → Payroll', module: 'staff-payroll' }
    ]),
    // Academics Sub-options
    { name: 'Academics → Dashboard', module: 'academic-dashboard' },
    { name: 'Academics → Class Management', module: 'academic-class' },
    { name: 'Academics → Subject Management', module: 'subjects' },
    { name: 'Academics → Time Table', module: 'timetable' }
  ]).filter(m =>
    (isStudentOrParent || hasModuleAccess(user?.role || userRole, m.module)) &&
    (!query.trim() || m.name.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 10);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="glass-surface border border-white/60 dark:border-white/10 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search modules, students, teachers..."
            title="Search"
            maxLength={100}
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 100))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!isQueryValid) return;
                if (modules.length > 0) {
                  onNavigate(modules[0].module);
                  onClose();
                } else if (filteredStudents.length > 0) {
                  onNavigate('students');
                  onClose();
                } else if (filteredStaff.length > 0) {
                  onNavigate('staff');
                  onClose();
                } else if (filteredBooks.length > 0) {
                  onNavigate('library');
                  onClose();
                }
              }
            }}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm font-semibold"
          />
          {query.length > 0 && (
            <span className={`text-[11px] font-mono shrink-0 ${query.length >= 100 ? 'text-rose-500 font-bold' : query.length >= 80 ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>
              {query.length}/100
            </span>
          )}
          <button 
            onClick={handleClearOrClose} 
            className="w-7 h-7 rounded-full btn-glass-secondary flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer active:scale-90 shrink-0"
            title={query ? "Clear search" : "Close"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {query.trim() && !isQueryValid && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{searchValidation.error}</span>
          </div>
        )}

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.trim() && !isQueryValid ? (
            <div className="py-10 px-4 text-center space-y-2.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Invalid Search Query
              </p>
              <p className="text-xs text-rose-500 font-semibold max-w-sm mx-auto">
                {searchValidation.error}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                Please enter a valid keyword using alphanumeric characters (e.g. &ldquo;exam&rdquo;, &ldquo;attendance&rdquo;, &ldquo;fee&rdquo;, or student/staff name). Special characters are not allowed.
              </p>
            </div>
          ) : query.trim() && isQueryValid && filteredStudents.length === 0 && filteredStaff.length === 0 && filteredBooks.length === 0 && modules.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No results found</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No matching portal modules, students, staff, or books found for &ldquo;{query.trim()}&rdquo;.
              </p>
            </div>
          ) : (
            <>
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
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800/60 cursor-pointer transition-all active:scale-[0.99]"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
