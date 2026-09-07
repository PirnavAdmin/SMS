// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, BookOpen, Search, Filter, Phone, Mail, ChevronDown, GraduationCap } from 'lucide-react';
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
  const { students, staff, academicClasses, teacherAssignments, timetable, subjects: masterSubjects } = useData();
  const { user, role } = useAuth();
  
  const [selectedWardIdx, setSelectedWardIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const parentWards = useMemo(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    const matches = students.filter(s => 
      s.status === 'Active' && 
      (
        role === 'Student' ? s.id === user?.id : 
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

    return matches.length > 0 ? matches : students.filter(s => s.status === 'Active').slice(0, 1);
  }, [students, user, role]);

  const currentWard = parentWards[selectedWardIdx] || parentWards[0];

  useEffect(() => {
    let isMounted = true;
    const loadClassTeachers = async () => {
      setLoading(true);

      const norm = (str?: string) => (str || '').toLowerCase().replace(/class|section/gi, '').trim();
      const wardClassNorm = norm(currentWard?.className);
      const wardSecNorm = norm(currentWard?.section);

      // Find the academic class definition configured in Admin
      const targetClass = (academicClasses || []).find(c => 
        norm(c.name) === wardClassNorm || 
        String(c.id) === String((currentWard as any)?.classId)
      );

      // Map to store unique allocated faculty (keyed by normalized teacher identity)
      const teacherMap = new Map<string, TeacherItem>();

      // 1. Resolve Class Teacher from Section Allocation (Admin Class Management)
      const secTeachers = (targetClass as any)?.sectionTeachers || {};
      let sectionClassTeacherVal = '';
      
      Object.entries(secTeachers).forEach(([secKey, tVal]) => {
        if (norm(secKey) === wardSecNorm || (!wardSecNorm && secKey)) {
          if (tVal && typeof tVal === 'string' && tVal.trim() !== '' && tVal !== 'Unassigned') {
            sectionClassTeacherVal = tVal.trim();
          }
        }
      });

      if (!sectionClassTeacherVal && targetClass?.classTeacher) {
        sectionClassTeacherVal = targetClass.classTeacher;
      }

      if (sectionClassTeacherVal) {
        const cleanCT = sectionClassTeacherVal.toLowerCase();
        const matchedStaff = (staff || []).find(s => {
          const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
          const sName = (s.name || '').trim().toLowerCase();
          const sEmp = (s.empId || '').trim().toLowerCase();
          return sFullName === cleanCT || sName === cleanCT || (sEmp && (cleanCT.includes(sEmp) || s.id === sectionClassTeacherVal));
        });

        const teacherKey = (matchedStaff?.empId || matchedStaff?.id || sectionClassTeacherVal).toLowerCase().trim();
        const subName = matchedStaff?.assignedSubjects?.[0] || matchedStaff?.primarySubject || matchedStaff?.specialization || (matchedStaff?.department && !matchedStaff.department.toLowerCase().includes('teaching') ? matchedStaff.department : '') || 'General';
        const subMaster = (masterSubjects || []).find(sub => sub.name.toLowerCase() === subName.toLowerCase());
        const subCode = subMaster?.code || (matchedStaff?.empId ? `EMP-${matchedStaff.empId}` : '');

        teacherMap.set(teacherKey, {
          id: matchedStaff?.id || matchedStaff?.empId || teacherKey,
          firstName: matchedStaff?.firstName || sectionClassTeacherVal.split(' ')[0] || 'Class',
          lastName: matchedStaff?.lastName || sectionClassTeacherVal.split(' ').slice(1).join(' ') || '',
          subject: subName,
          subjectCode: subCode,
          phone: matchedStaff?.phone || matchedStaff?.alternateMobile || '+91 98765 43210',
          email: matchedStaff?.email || `${(matchedStaff?.firstName || 'faculty').toLowerCase()}@school.edu`,
          isClassTeacher: true
        });
      }

      // 2. Resolve Subject Teachers from teacherAssignments (Admin Teacher-Subject Allocation)
      const directAssignments = (teacherAssignments || []).filter(ta => {
        const taClassNorm = norm(ta.className);
        const taSecNorm = norm(ta.section);
        const matchesClass = taClassNorm === wardClassNorm || taClassNorm.includes(wardClassNorm) || wardClassNorm.includes(taClassNorm);
        const matchesSection = !wardSecNorm || !taSecNorm || taSecNorm === 'all' || taSecNorm === wardSecNorm;
        return matchesClass && matchesSection;
      });

      directAssignments.forEach(ta => {
        const tSubject = ta.subject || (ta as any).subjectName || (ta as any).subject_name || 'Subject';
        const tTeacherId = ta.teacherId;
        const tTeacherName = (ta.teacherName || '').trim();
        if (!tTeacherName && !tTeacherId) return;

        const matchedStaff = (staff || []).find(s => 
          (tTeacherId && (s.id === tTeacherId || s.empId === tTeacherId)) ||
          (tTeacherName && `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === tTeacherName.toLowerCase()) ||
          (tTeacherName && (s.name || '').toLowerCase() === tTeacherName.toLowerCase())
        );

        const teacherKey = (matchedStaff?.empId || matchedStaff?.id || tTeacherId || tTeacherName).toLowerCase().trim();
        const subMaster = (masterSubjects || []).find(sub => sub.name.toLowerCase() === tSubject.toLowerCase());
        const subCode = subMaster?.code || (ta as any).subjectCode || (matchedStaff?.empId ? matchedStaff.empId : 'SUB');

        const isClassTeacher = Boolean(
          (sectionClassTeacherVal && (
            tTeacherName.toLowerCase() === sectionClassTeacherVal.toLowerCase() ||
            (matchedStaff && `${matchedStaff.firstName} ${matchedStaff.lastName}`.trim().toLowerCase() === sectionClassTeacherVal.toLowerCase())
          )) ||
          ta.role === 'Class Teacher' ||
          (ta as any).isClassTeacher
        );

        if (teacherMap.has(teacherKey)) {
          const existing = teacherMap.get(teacherKey)!;
          // Keep existing card, preserve class teacher status and refine subject if needed
          teacherMap.set(teacherKey, {
            ...existing,
            isClassTeacher: existing.isClassTeacher || isClassTeacher,
            subject: existing.isClassTeacher ? existing.subject : tSubject,
            subjectCode: existing.isClassTeacher ? existing.subjectCode : subCode
          });
        } else {
          teacherMap.set(teacherKey, {
            id: matchedStaff?.id || tTeacherId || teacherKey,
            firstName: matchedStaff?.firstName || tTeacherName.split(' ')[0] || 'Faculty',
            lastName: matchedStaff?.lastName || tTeacherName.split(' ').slice(1).join(' ') || '',
            subject: tSubject,
            subjectCode: subCode,
            phone: matchedStaff?.phone || matchedStaff?.alternateMobile || '+91 98765 43210',
            email: matchedStaff?.email || `${(matchedStaff?.firstName || 'faculty').toLowerCase()}@school.edu`,
            isClassTeacher
          });
        }
      });

      // 3. Resolve from Timetable Slots if not yet mapped
      const timetableSlots = (timetable || []).filter(t => {
        const ttClassNorm = norm(t.className);
        const ttSecNorm = norm(t.section);
        const matchesClass = ttClassNorm === wardClassNorm;
        const matchesSection = !wardSecNorm || !ttSecNorm || ttSecNorm === 'all' || ttSecNorm === wardSecNorm;
        return matchesClass && matchesSection;
      });

      timetableSlots.forEach(slot => {
        const slotTeacherName = (slot.teacherName || '').trim();
        const slotSubject = slot.subject || 'Subject';
        if (!slotTeacherName) return;

        const matchedStaff = (staff || []).find(s => 
          (slot.teacherId && (s.id === slot.teacherId || s.empId === slot.teacherId)) ||
          `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === slotTeacherName.toLowerCase() ||
          (s.name || '').toLowerCase() === slotTeacherName.toLowerCase()
        );

        const teacherKey = (matchedStaff?.empId || matchedStaff?.id || slot.teacherId || slotTeacherName).toLowerCase().trim();
        if (teacherMap.has(teacherKey)) return;

        const subMaster = (masterSubjects || []).find(sub => sub.name.toLowerCase() === slotSubject.toLowerCase());
        const subCode = subMaster?.code || (matchedStaff?.empId ? matchedStaff.empId : 'SUB');

        teacherMap.set(teacherKey, {
          id: matchedStaff?.id || slot.teacherId || teacherKey,
          firstName: matchedStaff?.firstName || slotTeacherName.split(' ')[0] || 'Teacher',
          lastName: matchedStaff?.lastName || slotTeacherName.split(' ').slice(1).join(' ') || '',
          subject: slotSubject,
          subjectCode: subCode,
          phone: matchedStaff?.phone || matchedStaff?.alternateMobile || '+91 98765 43210',
          email: matchedStaff?.email || `${(matchedStaff?.firstName || 'teacher').toLowerCase()}@school.edu`,
          isClassTeacher: Boolean(sectionClassTeacherVal && slotTeacherName.toLowerCase() === sectionClassTeacherVal.toLowerCase())
        });
      });

      // 4. Try backend API only if no live assignments found
      if (teacherMap.size === 0) {
        try {
          const studentId = currentWard?.studentId || currentWard?.id;
          if (studentId) {
            const apiData = await getParentTeachers(Number(studentId));
            if (isMounted && Array.isArray(apiData) && apiData.length > 0) {
              const mapped: TeacherItem[] = apiData.map((t: any) => ({
                id: t.teacherId || t.id,
                firstName: t.firstName || t.teacherName?.split(' ')[0] || 'Teacher',
                lastName: t.lastName || t.teacherName?.split(' ').slice(1).join(' ') || '',
                subject: t.subjectTaught || t.subject || 'General',
                subjectCode: t.subjectCode || 'SUB-101',
                phone: t.phone || t.mobileNumber || '+91 98765 43210',
                email: t.email || 'teacher@school.edu',
                isClassTeacher: Boolean(t.isClassTeacher)
              }));
              mapped.forEach(item => {
                const key = String(item.id).toLowerCase();
                if (!teacherMap.has(key)) teacherMap.set(key, item);
              });
            }
          }
        } catch (err) {
          console.warn('API fallback error:', err);
        }
      }

      if (isMounted) {
        setTeachers(Array.from(teacherMap.values()));
        setLoading(false);
      }
    };

    loadClassTeachers();
    return () => { isMounted = false; };
  }, [staff, academicClasses, teacherAssignments, timetable, masterSubjects, currentWard]);

  const subjects = useMemo(() => {
    return ['All', ...Array.from(new Set(teachers.map(t => `${t.subject} (${t.subjectCode})`)))];
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      const teacherFullSubject = `${teacher.subject} (${teacher.subjectCode})`;
      const matchesSubject = subjectFilter === 'All' || teacherFullSubject === subjectFilter || teacher.subject === subjectFilter;
      
      return matchesSearch && matchesSubject;
    });
  }, [teachers, searchQuery, subjectFilter]);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-2xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Teachers Information</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Assigned to: <strong className="text-sky-700 dark:text-sky-400">{currentWard?.className}-{currentWard?.section}</strong>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {teachers.length} Faculty
              </span>
            </div>
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
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/40 outline-none transition-all shadow-2xs"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/40 outline-none transition-all appearance-none shadow-2xs cursor-pointer font-medium"
            >
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub === 'All' ? 'All Subjects' : sub}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Ward Selector Tabs */}
      {parentWards.length > 1 && (
        <div className="flex p-1 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl w-max shadow-xs">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedWardIdx(idx)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                selectedWardIdx === idx
                  ? 'bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs border border-sky-200 dark:border-sky-700'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              {ward.firstName} <span className="text-[10px] font-bold opacity-60 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xs animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="h-3 w-28 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-40 rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTeachers.map(teacher => (
            <div 
              key={teacher.id} 
              className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 flex items-center justify-center text-sm font-extrabold border border-sky-200 dark:border-sky-800 group-hover:scale-105 transition-transform duration-300 shrink-0 shadow-2xs">
                  {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0) || teacher.firstName.charAt(1) || 'T'}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    {teacher.isClassTeacher && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
                        <GraduationCap className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                        Class Teacher
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="truncate">{teacher.subject}</span>
                    <span className="opacity-70 text-[10.5px] whitespace-nowrap">({teacher.subjectCode})</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 pt-3 mt-3 border-t border-sky-100 dark:border-sky-900/40 text-left">
                <a 
                  href={`tel:${teacher.phone}`} 
                  className="flex items-center gap-2.5 p-1 -mx-1 rounded-xl hover:bg-sky-50/60 dark:hover:bg-slate-800/60 transition-colors text-slate-600 dark:text-slate-300"
                >
                  <div className="w-6.5 h-6.5 rounded-lg bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800">
                    <Phone className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold font-mono">{teacher.phone}</span>
                </a>
                <a 
                  href={`mailto:${teacher.email}`} 
                  className="flex items-center gap-2.5 p-1 -mx-1 rounded-xl hover:bg-sky-50/60 dark:hover:bg-slate-800/60 transition-colors text-slate-600 dark:text-slate-300"
                >
                  <div className="w-6.5 h-6.5 rounded-lg bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800">
                    <Mail className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold truncate">{teacher.email}</span>
                </a>
              </div>
            </div>
          ))}
          
          {filteredTeachers.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-sky-300 dark:border-sky-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-slate-800 text-sky-600 flex items-center justify-center mx-auto mb-3 border border-sky-200">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">No teachers found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No faculty assignments found for {currentWard?.className}-{currentWard?.section}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
