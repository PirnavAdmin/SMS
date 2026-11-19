import React, { useState, useEffect, useRef } from 'react';
import {
  Search, UserCheck, Users, BookOpen, Layers, X, ArrowRight, AlertCircle,
  Building2, CreditCard, Globe, ReceiptIndianRupee, Activity, LifeBuoy, ShieldAlert, Settings, LayoutDashboard
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { hasModuleAccess } from '../../utils/rbac';
import { validateSearchQuery } from '../../utils/validation';
import { fetchSchoolsApi, SchoolItem } from '../../api/superadmin';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { students, staff, books } = useData();
  const { user, role } = useAuth();
  const safeRole = (role || user?.role || '').toLowerCase();
  const isSuperAdmin = safeRole.includes('super admin') || safeRole.includes('superadmin');
  const isStudentOrParent = !isSuperAdmin && (safeRole === 'student' || safeRole === 'parent');

  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Clear query whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Load registered institutions if SuperAdmin
  useEffect(() => {
    if (isOpen && isSuperAdmin) {
      setLoadingSchools(true);
      fetchSchoolsApi()
        .then((res) => setSchools(res || []))
        .catch(() => setSchools([]))
        .finally(() => setLoadingSchools(false));
    }
  }, [isOpen, isSuperAdmin]);

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

  // Filtered schools (Strictly for SuperAdmin)
  const filteredSchools = (isSuperAdmin && isQueryValid && query.trim()) ? schools.filter(s =>
    s.schoolName.toLowerCase().includes(query.toLowerCase()) ||
    s.schoolCode.toLowerCase().includes(query.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(query.toLowerCase())) ||
    (s.principalName && s.principalName.toLowerCase().includes(query.toLowerCase())) ||
    (s.address && s.address.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5) : [];

  // Strictly disabled for SuperAdmin so admin data never appears
  const filteredStudents = (!isSuperAdmin && !isStudentOrParent && isQueryValid && query.trim()) ? students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4) : [];

  const filteredStaff = (!isSuperAdmin && isQueryValid && query.trim()) ? staff.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    s.designation.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4) : [];

  const filteredBooks = (!isSuperAdmin && isQueryValid && query.trim()) ? books.filter(b =>
    b.title.toLowerCase().includes(query.toLowerCase()) ||
    b.author.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3) : [];

  const modules = (!isQueryValid && query.trim()) ? [] : (
    isSuperAdmin ? [
      { name: 'Dashboard', module: 'superadmin-dashboard', icon: LayoutDashboard, desc: 'Overview, institutional metrics & stats' },
      { name: 'Schools & Educational Institutions', module: 'superadmin-schools', icon: Building2, desc: 'Manage registered schools & campuses' },
      { name: 'Subscriptions & Packages', module: 'superadmin-subscriptions', icon: CreditCard, desc: 'SaaS subscription tiers and plans' },
      { name: 'Domain Management', module: 'superadmin-domains', icon: Globe, desc: 'Subdomains and custom domain routing' },
      { name: 'Purchase Transactions', module: 'superadmin-transactions', icon: ReceiptIndianRupee, desc: 'Billing history & transaction invoices' },
      { name: 'Tenant Usage Metrics', module: 'superadmin-metrics', icon: Activity, desc: 'Tenant storage, bandwith and active users' },
      { name: 'Tenant Support Tickets', module: 'superadmin-tickets', icon: LifeBuoy, desc: 'Customer support issues & helpdesk' },
      { name: 'Audit Logs', module: 'superadmin-audit', icon: ShieldAlert, desc: 'Superadmin audit trails & security logs' },
      { name: 'Platform Company Profile', module: 'superadmin-profile', icon: Settings, desc: 'Brand identity, logos & contact information' },
    ].filter(m =>
      !query.trim() ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.desc.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10) : (isStudentOrParent ? [
      { name: 'Dashboard', module: 'dashboard', icon: Layers, desc: 'Overview & quick widgets' },
      { name: 'Attendance', module: 'attendance', icon: Layers, desc: 'Daily attendance records' },
      { name: 'Time Table', module: 'timetable', icon: Layers, desc: 'Class schedule & routine' },
      { name: 'Report Cards & Results', module: 'report-cards', icon: Layers, desc: 'Academic performance & grades' },
      { name: 'Homework', module: 'homework', icon: Layers, desc: 'Assignments & submissions' },
      { name: 'Fee Details & Dues', module: 'parent-fee-dues', icon: Layers, desc: 'Outstanding fee payments' },
      { name: 'Teachers Directory', module: 'staff', icon: Layers, desc: 'School faculty listing' },
      { name: 'Library Catalog', module: 'library', icon: Layers, desc: 'Search available books' },
      { name: 'Bus & Transport Info', module: 'parent-bus-info', icon: Layers, desc: 'Bus route and stops' },
      { name: 'Hostel Details', module: 'parent-hostel-details', icon: Layers, desc: 'Room and block allocation' },
      { name: 'School Events & Holidays', module: 'events', icon: Layers, desc: 'Campus calendar & celebrations' },
      { name: 'Communication Hub', module: 'communication', icon: Layers, desc: 'Noticeboard & announcements' }
    ] : [
      { name: 'Dashboard', module: 'dashboard', icon: Layers, desc: 'Main administration dashboard' },
      { name: 'Admissions Management', module: 'admissions', icon: Layers, desc: 'Student enrollment & applications' },
      { name: 'Student Directory', module: 'students', icon: Layers, desc: 'Enrolled students records' },
      { name: 'Student Attendance', module: 'attendance', icon: Layers, desc: 'Mark & review attendance' },
      { name: 'Student Promotion', module: 'student-promotion', icon: Layers, desc: 'Academic grade transition' },
      { name: 'Certificates', module: 'certificates', icon: Layers, desc: 'Issue transfer & study certificates' },
      { name: 'Alumni', module: 'alumni', icon: Layers, desc: 'Graduated students directory' },
      { name: 'Examination', module: 'examination', icon: Layers, desc: 'Exam schedules, tests & marks' },
      { name: 'Report Cards', module: 'report-cards', icon: Layers, desc: 'Generate printable grade cards' },
      { name: 'Homework', module: 'homework', icon: Layers, desc: 'Classwork & assignments' },
      { name: 'Communication Hub', module: 'communication', icon: Layers, desc: 'Announcements & SMS/Email broadcasts' },
      { name: 'Events & Holidays', module: 'events', icon: Layers, desc: 'School academic calendar' },
      { name: 'Faculty Training', module: 'training', icon: Layers, desc: 'Staff professional development' },
      { name: 'School Reports', module: 'reports', icon: Layers, desc: 'Institutional analytics & exports' },
      { name: 'Roles & Permissions', module: 'users', icon: Layers, desc: 'System users & access roles' },
      { name: 'System Settings', module: 'settings', icon: Layers, desc: 'School preferences & branding' },
      { name: 'Library Inventory', module: 'library', icon: Layers, desc: 'Books master & issue tracking' },
      { name: 'Librarian Attendance', module: 'librarian-attendance', icon: Layers, desc: 'Library staff attendance' },
      { name: 'Library Timetable', module: 'library-timetable', icon: Layers, desc: 'Class library periods' },
      { name: 'Inventory & Supplies', module: 'inventory', icon: Layers, desc: 'Stock items & categories' },
      { name: 'Finance → Fee Collection', module: 'finance-fee-collection', icon: Layers, desc: 'Student fee receipts' },
      { name: 'Hostel → Room Allocation', module: 'hostel-student-hostel', icon: Layers, desc: 'Hostel room assignments' },
      { name: 'Transport → Routes & Vehicles', module: 'transport-setup', icon: Layers, desc: 'Fleet management & routes' },
      { name: 'Staff → Staff Directory', module: 'staff-directory', icon: Layers, desc: 'Employee master listing' },
      { name: 'Academics → Class Management', module: 'academic-class', icon: Layers, desc: 'Classes, sections & grades' },
      { name: 'Academics → Subject Management', module: 'subjects', icon: Layers, desc: 'Courses and subject syllabus' }
    ]).filter(m =>
      (isStudentOrParent || hasModuleAccess(user?.role || safeRole, m.module)) &&
      (!query.trim() || m.name.toLowerCase().includes(query.toLowerCase()) || m.desc.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10)
  );

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
            placeholder={isSuperAdmin ? "Search schools, subscriptions, modules..." : "Search modules, students, teachers..."}
            title="Search"
            maxLength={100}
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 100))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!isQueryValid) return;
                if (isSuperAdmin) {
                  if (filteredSchools.length > 0) {
                    onNavigate('superadmin-schools');
                    onClose();
                  } else if (modules.length > 0) {
                    onNavigate(modules[0].module);
                    onClose();
                  }
                  return;
                }
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
                Please enter a valid keyword using alphanumeric characters. Special characters are not allowed.
              </p>
            </div>
          ) : query.trim() && isQueryValid && (isSuperAdmin ? (filteredSchools.length === 0 && modules.length === 0) : (filteredStudents.length === 0 && filteredStaff.length === 0 && filteredBooks.length === 0 && modules.length === 0)) ? (
            <div className="py-10 px-4 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No results found</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {isSuperAdmin
                  ? `No matching schools, subscriptions, or Super Admin modules found for "${query.trim()}".`
                  : `No matching portal modules, students, staff, or books found for "${query.trim()}".`}
              </p>
            </div>
          ) : (
            <>
              {/* Registered Schools (Super Admin Only) */}
              {isSuperAdmin && filteredSchools.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <Building2 className="w-3.5 h-3.5 text-sky-500" /> Schools & Educational Institutions
                  </div>
                  <div className="space-y-1">
                    {filteredSchools.map(s => (
                      <div
                        key={s.schoolId}
                        onClick={() => { onNavigate('superadmin-schools'); onClose(); }}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800/60 cursor-pointer transition-all active:scale-[0.99] group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                            {s.schoolName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.schoolName}</p>
                            <p className="text-xs text-slate-500 truncate">
                              Code: <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{s.schoolCode}</span> • {s.status} • {s.address || s.email || 'Institution'}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students (Normal School Roles Only) */}
              {!isSuperAdmin && filteredStudents.length > 0 && (
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

              {/* Staff (Normal School Roles Only) */}
              {!isSuperAdmin && filteredStaff.length > 0 && (
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

              {/* Books (Normal School Roles Only) */}
              {!isSuperAdmin && filteredBooks.length > 0 && (
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
                    <Layers className="w-3.5 h-3.5 text-sky-500" /> {isSuperAdmin ? 'Super Admin Modules' : 'Portal Modules'}
                  </div>
                  <div className="space-y-1">
                    {modules.map(m => {
                      const IconComp = (m as any).icon || Layers;
                      return (
                        <div
                          key={m.module}
                          onClick={() => { onNavigate(m.module); onClose(); }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors text-sm font-medium text-slate-800 dark:text-slate-200 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <IconComp className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">{m.name}</p>
                              {m.desc && <p className="text-[11px] text-slate-400 truncate">{m.desc}</p>}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                        </div>
                      );
                    })}
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
