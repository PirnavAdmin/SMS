import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Users, BookOpen, Layers, X, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const { students, staff, books } = useData();

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

  if (!isOpen) return null;

  const filteredStudents = query.trim() ? students.filter(s =>
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

  const modules = [
    { name: 'Dashboard', module: 'dashboard' },
    { name: 'Student Management', module: 'students' },
    { name: 'Staff Management', module: 'staff' },
    { name: 'Admissions Pipeline', module: 'admissions' },
    { name: 'Fee Collection & Dues', module: 'fees' },
    { name: 'Attendance Analytics', module: 'attendance' },
    { name: 'Examination & Reports', module: 'examination' },
    { name: 'Library Inventory', module: 'library' },
    { name: 'Transport Routes', module: 'transport' },
    { name: 'Hostel Allocation', module: 'hostel' },
    { name: 'Inventory & Supplies', module: 'inventory' },
    { name: 'Broadcast Communication', module: 'communication' },
    { name: 'Events & Holidays', module: 'events' },
    { name: 'Reports & Export', module: 'reports' },
    { name: 'System Settings', module: 'settings' }
  ].filter(m => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, staff, books, or navigate modules... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="text-center py-6 text-slate-400 text-xs">
              Type to search across students, teachers, books, or jump to any portal section.
            </div>
          )}

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
