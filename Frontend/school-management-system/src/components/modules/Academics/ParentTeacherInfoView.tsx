import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, BookOpen, Search, Filter, Phone, Mail, ChevronDown, Loader2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

import { getParentTeachers } from '../../../api/parent/parentApi';

interface TeacherItem {
  id: string | number;
  firstName: string;
  lastName: string;
  subject: string;
  subjectCode: string;
  phone: string;
  email: string;
  isClassTeacher: boolean;
}

export const ParentTeacherInfoView: React.FC = () => {
  const { students } = useData();
  const { user, role } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Default teachers list matching school directory & screenshot
  const staticTeachers: TeacherItem[] = [
    { id: 't1', firstName: 'Eleanor', lastName: 'Vance', subject: 'Mathematics', subjectCode: 'MAT-101', phone: '+1 555-888-001', email: 'eleanor.vance@pirnavschools.edu', isClassTeacher: true },
    { id: 't2', firstName: 'Robert', lastName: 'Chen', subject: 'Physics', subjectCode: 'PHY-102', phone: '+1 555-888-002', email: 'robert.chen@pirnavschools.edu', isClassTeacher: false },
    { id: 't3', firstName: 'Sarah', lastName: 'Jenkins', subject: 'English Literature', subjectCode: 'ENG-103', phone: '+1 555-888-003', email: 'sarah.jenkins@pirnavschools.edu', isClassTeacher: false },
    { id: 't4', firstName: 'Michael', lastName: 'Chang', subject: 'Chemistry', subjectCode: 'CHE-104', phone: '+1 555-888-004', email: 'michael.chang@pirnavschools.edu', isClassTeacher: false },
    { id: 't5', firstName: 'Anita', lastName: 'Patel', subject: 'Computer Science', subjectCode: 'CS-105', phone: '+1 555-888-005', email: 'anita.patel@pirnavschools.edu', isClassTeacher: false },
    { id: 't6', firstName: 'David', lastName: 'Miller', subject: 'Physical Education', subjectCode: 'PE-106', phone: '+1 555-888-006', email: 'david.miller@pirnavschools.edu', isClassTeacher: false },
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const data = await getParentTeachers(1);
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped: TeacherItem[] = data.map((t: any) => ({
            id: t.teacherId || t.id,
            firstName: t.firstName || t.teacherName?.split(' ')[0] || 'Teacher',
            lastName: t.lastName || t.teacherName?.split(' ')[1] || '',
            subject: t.subjectTaught || t.subject || 'General',
            subjectCode: t.subjectCode || 'SUB-101',
            phone: t.phone || '+1 555-888-000',
            email: t.email || 'teacher@pirnavschools.edu',
            isClassTeacher: Boolean(t.isClassTeacher)
          }));
          setTeachers(mapped);
          return;
        }
      } catch (err) {
        console.warn('Parent teachers API failed, using static fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }

      if (isMounted) setTeachers(staticTeachers);
    };

    fetchTeachers();
    return () => { isMounted = false; };
  }, []);

  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (
      role === 'Student' ? s.id === user?.id : 
      (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
    )
  );

  if (parentWards.length === 0) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 1);
  }

  const subjects = ['All', ...Array.from(new Set(teachers.map(t => `${t.subject} (${t.subjectCode})`)))];

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const matchesSearch = 
        `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      const teacherFullSubject = `${teacher.subject} (${teacher.subjectCode})`;
      const matchesSubject = subjectFilter === 'All' || teacherFullSubject === subjectFilter || teacher.subject === subjectFilter;
      
      return matchesSearch && matchesSubject;
    });
  }, [teachers, searchQuery, subjectFilter]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
            <UserCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Teachers Information</h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search teachers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/50 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/50 outline-none transition-all appearance-none shadow-sm cursor-pointer"
            >
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub === 'All' ? 'All Subjects' : sub}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full shimmer-block shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded-md shimmer-block" />
                  <div className="h-3 w-24 rounded-md shimmer-block" />
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full shimmer-block shrink-0" />
                  <div className="h-3 w-28 rounded-md shimmer-block" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full shimmer-block shrink-0" />
                  <div className="h-3 w-40 rounded-md shimmer-block" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {parentWards.map(ward => (
            <div key={ward.id} className="space-y-5">
              {/* Teachers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTeachers.map(teacher => (
                  <div key={teacher.id} className="glass-card p-4 rounded-xl flex flex-col gap-3 group hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-indigo-100 dark:from-brand-900/40 dark:to-indigo-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-lg font-bold border border-brand-200 dark:border-brand-800 group-hover:scale-110 transition-transform duration-300 shrink-0">
                          {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{teacher.firstName} {teacher.lastName}</h3>
                          <div className="flex items-center gap-1.5 mt-1 text-slate-500 dark:text-slate-400 text-xs font-medium">
                            <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{teacher.subject}</span>
                            <span className="opacity-60 text-[10px] whitespace-nowrap">({teacher.subjectCode})</span>
                          </div>
                          {teacher.isClassTeacher && (
                            <div className="mt-2 w-max px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              Class Teacher
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <a href={`tel:${teacher.phone}`} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-600 dark:text-slate-300">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">{teacher.phone}</span>
                      </a>
                      <a href={`mailto:${teacher.email}`} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-600 dark:text-slate-300">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium truncate">{teacher.email}</span>
                      </a>
                    </div>
                  </div>
                ))}
                
                {filteredTeachers.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">No teachers found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search query or subject filter.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
