// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, BookOpen, Search, Filter, Phone, Mail, ChevronDown, GraduationCap } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getParentTeachers } from '../../../api/parent/parentApi';
import { useParentWards, ParentStudentSelector } from '../../common/ParentStudentSelector';

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
  const { 
    staff, 
    academicClasses, 
    teacherAssignments, 
    timetable, 
    subjects: masterSubjects,
    fetchAcademicClasses,
    fetchStaff
  } = useData();
  const parentWards = useParentWards();
  
  const [selectedWardIdx, setSelectedWardIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Proactively fetch academic classes & staff if not yet loaded in context (e.g. fresh page reload)
  useEffect(() => {
    if (!academicClasses || academicClasses.length === 0) {
      fetchAcademicClasses?.();
    }
    if (!staff || staff.length === 0) {
      fetchStaff?.();
    }
  }, [academicClasses?.length, staff?.length, fetchAcademicClasses, fetchStaff]);



  const currentWard = parentWards[selectedWardIdx] || parentWards[0];

  useEffect(() => {
    let isMounted = true;
    const loadClassTeachers = async () => {
      setLoading(true);

      const normClass = (str?: string) => {
        if (!str) return '';
        return String(str)
          .toLowerCase()
          .replace(/^class\s*/i, '')
          .replace(/^grade\s*/i, '')
          .replace(/^standard\s*/i, '')
          .replace(/^std\.?\s*/i, '')
          .trim();
      };

      const isClassMatch = (targetCls?: string, candidateCls?: string) => {
        const t = normClass(targetCls);
        const c = normClass(candidateCls);
        if (!t || !c) return false;
        return t === c;
      };

      const normSection = (str?: string) => {
        if (!str) return '';
        return String(str)
          .toLowerCase()
          .replace(/^section\s*/i, '')
          .replace(/^sec\.?\s*/i, '')
          .trim();
      };

      const isSectionMatch = (targetSec?: string, candidateSec?: string) => {
        const t = normSection(targetSec);
        const c = normSection(candidateSec);
        if (!t || !c || c === 'all') return true;
        return t === c;
      };

      if (!currentWard || !currentWard.className) {
        if (isMounted) {
          setTeachers([]);
          setLoading(false);
        }
        return;
      }

      // Find the academic class definition configured in Admin
      const targetClass = (academicClasses || []).find(c => 
        isClassMatch(c.name, currentWard.className) || 
        String(c.id) === String((currentWard as any)?.classId)
      );

      // Map to store unique allocated faculty (keyed by canonical teacher identity)
      const teacherMap = new Map<string, TeacherItem>();

      const cleanNameOnly = (str?: string) => {
        return (str || '')
          .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '')
          .replace(/[^a-zA-Z0-9]/g, '')
          .toLowerCase()
          .trim();
      };

      const findExistingKey = (t: TeacherItem, matchedStaffObj?: any): string | null => {
        const tFullName = cleanNameOnly(`${t.firstName} ${t.lastName}`);
        const sFullName = matchedStaffObj ? cleanNameOnly(`${matchedStaffObj.firstName} ${matchedStaffObj.lastName}`) : '';
        const sNameOnly = matchedStaffObj?.name ? cleanNameOnly(matchedStaffObj.name) : '';
        const targetNames = [tFullName, sFullName, sNameOnly].filter(n => n && n.length >= 2);

        const targetIds = [
          t.id ? String(t.id).toLowerCase().trim() : '',
          matchedStaffObj?.id ? String(matchedStaffObj.id).toLowerCase().trim() : '',
          matchedStaffObj?.empId ? String(matchedStaffObj.empId).toLowerCase().trim() : ''
        ].filter(Boolean);

        const targetEmails = [
          t.email ? t.email.toLowerCase().trim() : '',
          matchedStaffObj?.email ? matchedStaffObj.email.toLowerCase().trim() : ''
        ].filter(e => e && !e.includes('school.edu'));

        for (const [key, existing] of teacherMap.entries()) {
          const exFullName = cleanNameOnly(`${existing.firstName} ${existing.lastName}`);
          if (exFullName && targetNames.some(n => n === exFullName || n.includes(exFullName) || exFullName.includes(n))) {
            return key;
          }

          const exId = String(existing.id || '').toLowerCase().trim();
          if (exId && targetIds.includes(exId)) {
            return key;
          }

          const exEmail = (existing.email || '').toLowerCase().trim();
          if (exEmail && !exEmail.includes('school.edu') && targetEmails.includes(exEmail)) {
            return key;
          }
        }

        return null;
      };

      const addOrMergeTeacher = (t: TeacherItem, matchedStaffObj?: any) => {
        const staffObj = matchedStaffObj || (staff || []).find(s => {
          const sId = String(s.id || '').toLowerCase().trim();
          const sEmp = String(s.empId || '').toLowerCase().trim();
          const tId = String(t.id || '').toLowerCase().trim();
          if (tId && (sId === tId || sEmp === tId)) return true;
          if (t.email && s.email && s.email.toLowerCase().trim() === t.email.toLowerCase().trim()) return true;
          const sFull = cleanNameOnly(`${s.firstName || ''} ${s.lastName || ''}`);
          const sName = s.name ? cleanNameOnly(s.name) : '';
          const tFull = cleanNameOnly(`${t.firstName || ''} ${t.lastName || ''}`);
          return (sFull && tFull && (sFull === tFull || sFull.includes(tFull) || tFull.includes(sFull))) ||
                 (sName && tFull && (sName === tFull || sName.includes(tFull) || tFull.includes(sName)));
        });

        const existingKey = findExistingKey(t, staffObj);
        const resolvedKey = existingKey || cleanNameOnly(`${staffObj?.firstName || t.firstName} ${staffObj?.lastName || t.lastName}`) || `t_${teacherMap.size + 1}`;

        if (teacherMap.has(resolvedKey)) {
          const existing = teacherMap.get(resolvedKey)!;
          const subjectList = new Set(
            existing.subject
              .split(',')
              .map(s => s.trim())
              .filter(s => s && s !== 'General' && s !== 'Subject')
          );
          if (t.subject && t.subject !== 'General' && t.subject !== 'Subject') {
            t.subject.split(',').forEach(s => {
              const cs = s.trim();
              if (cs) subjectList.add(cs);
            });
          }
          const combinedSubject = Array.from(subjectList).join(', ') || existing.subject || t.subject;

          teacherMap.set(resolvedKey, {
            ...existing,
            firstName: staffObj?.firstName || existing.firstName || t.firstName,
            lastName: staffObj?.lastName || existing.lastName || t.lastName,
            phone: staffObj?.phone || existing.phone || t.phone,
            email: staffObj?.email || existing.email || t.email,
            isClassTeacher: existing.isClassTeacher || Boolean(t.isClassTeacher),
            subject: combinedSubject,
            subjectCode: existing.subjectCode || t.subjectCode
          });
        } else {
          teacherMap.set(resolvedKey, {
            id: staffObj?.id || t.id || resolvedKey,
            firstName: staffObj?.firstName || t.firstName,
            lastName: staffObj?.lastName || t.lastName,
            subject: t.subject,
            subjectCode: t.subjectCode,
            phone: staffObj?.phone || t.phone || '',
            email: staffObj?.email || t.email || '',
            isClassTeacher: Boolean(t.isClassTeacher)
          });
        }
      };

      // 1. Resolve Class Teacher from Section Allocation (Admin Class Management)
      const secTeachers = (targetClass as any)?.sectionTeachers || {};
      let sectionClassTeacherVal = '';
      
      Object.entries(secTeachers).forEach(([secKey, tVal]) => {
        if (isSectionMatch(currentWard.section, secKey)) {
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

        const subName = matchedStaff?.assignedSubjects?.[0] || matchedStaff?.primarySubject || matchedStaff?.specialization || (matchedStaff?.department && !matchedStaff.department.toLowerCase().includes('teaching') ? matchedStaff.department : '') || '';
        const subMaster = (masterSubjects || []).find(sub => sub.name.toLowerCase() === subName.toLowerCase());
        const subCode = subMaster?.code || (matchedStaff?.empId ? `EMP-${matchedStaff.empId}` : '');

        addOrMergeTeacher({
          id: matchedStaff?.id || matchedStaff?.empId || sectionClassTeacherVal,
          firstName: matchedStaff?.firstName || sectionClassTeacherVal.split(' ')[0] || '',
          lastName: matchedStaff?.lastName || sectionClassTeacherVal.split(' ').slice(1).join(' ') || '',
          subject: subName,
          subjectCode: subCode,
          phone: matchedStaff?.phone || matchedStaff?.alternateMobile || '',
          email: matchedStaff?.email || '',
          isClassTeacher: true
        }, matchedStaff);
      }

      // 2. Resolve Subject Teachers from teacherAssignments (Admin Teacher-Subject Allocation)
      const directAssignments = (teacherAssignments || []).filter(ta => {
        const matchesClass = isClassMatch(currentWard.className, ta.className);
        const matchesSection = isSectionMatch(currentWard.section, ta.section);
        return matchesClass && matchesSection;
      });

      directAssignments.forEach(ta => {
        const tSubject = ta.subject || (ta as any).subjectName || (ta as any).subject_name || '';
        const tTeacherId = ta.teacherId;
        const tTeacherName = (ta.teacherName || '').trim();
        if (!tTeacherName && !tTeacherId) return;

        const matchedStaff = (staff || []).find(s => 
          (tTeacherId && (s.id === tTeacherId || s.empId === tTeacherId)) ||
          (tTeacherName && `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === tTeacherName.toLowerCase()) ||
          (tTeacherName && (s.name || '').toLowerCase() === tTeacherName.toLowerCase())
        );

        const subMaster = (masterSubjects || []).find(sub => sub.name.toLowerCase() === tSubject.toLowerCase());
        const subCode = subMaster?.code || (ta as any).subjectCode || (matchedStaff?.empId ? matchedStaff.empId : '');

        const isClassTeacher = Boolean(
          (sectionClassTeacherVal && (
            tTeacherName.toLowerCase() === sectionClassTeacherVal.toLowerCase() ||
            (matchedStaff && `${matchedStaff.firstName} ${matchedStaff.lastName}`.trim().toLowerCase() === sectionClassTeacherVal.toLowerCase())
          )) ||
          ta.role === 'Class Teacher' ||
          (ta as any).isClassTeacher
        );

        addOrMergeTeacher({
          id: matchedStaff?.id || tTeacherId || tTeacherName,
          firstName: matchedStaff?.firstName || tTeacherName.split(' ')[0] || '',
          lastName: matchedStaff?.lastName || tTeacherName.split(' ').slice(1).join(' ') || '',
          subject: tSubject,
          subjectCode: subCode,
          phone: matchedStaff?.phone || matchedStaff?.alternateMobile || '',
          email: matchedStaff?.email || '',
          isClassTeacher
        }, matchedStaff);
      });

      // 3. Resolve from Timetable Slots if not yet mapped
      const timetableSlots = (timetable || []).filter(t => {
        const matchesClass = isClassMatch(currentWard.className, t.className);
        const matchesSection = isSectionMatch(currentWard.section, t.section);
        return matchesClass && matchesSection;
      });

      timetableSlots.forEach(slot => {
        const slotTeacherName = (slot.teacherName || '').trim();
        const slotSubject = slot.subject || '';
        if (!slotTeacherName) return;

        const matchedStaff = (staff || []).find(s => 
          (slot.teacherId && (s.id === slot.teacherId || s.empId === slot.teacherId)) ||
          `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === slotTeacherName.toLowerCase() ||
          (s.name || '').toLowerCase() === slotTeacherName.toLowerCase()
        );

        const subMaster = (masterSubjects || []).find(sub => sub.name.toLowerCase() === slotSubject.toLowerCase());
        const subCode = subMaster?.code || (matchedStaff?.empId ? matchedStaff.empId : '');

        addOrMergeTeacher({
          id: matchedStaff?.id || slot.teacherId || slotTeacherName,
          firstName: matchedStaff?.firstName || slotTeacherName.split(' ')[0] || '',
          lastName: matchedStaff?.lastName || slotTeacherName.split(' ').slice(1).join(' ') || '',
          subject: slotSubject,
          subjectCode: subCode,
          phone: matchedStaff?.phone || matchedStaff?.alternateMobile || '',
          email: matchedStaff?.email || '',
          isClassTeacher: Boolean(sectionClassTeacherVal && slotTeacherName.toLowerCase() === sectionClassTeacherVal.toLowerCase())
        }, matchedStaff);
      });

      // 4. Try backend API only if no live assignments found
      if (teacherMap.size === 0) {
        try {
          const studentId = currentWard?.studentId || currentWard?.id;
          if (studentId) {
            const apiData = await getParentTeachers(Number(studentId));
            if (isMounted && Array.isArray(apiData) && apiData.length > 0) {
              apiData.forEach((t: any) => {
                addOrMergeTeacher({
                  id: t.teacherId || t.id,
                  firstName: t.firstName || t.teacherName?.split(' ')[0] || '',
                  lastName: t.lastName || t.teacherName?.split(' ').slice(1).join(' ') || '',
                  subject: t.subjectTaught || t.subject || '',
                  subjectCode: t.subjectCode || '',
                  phone: t.phone || t.mobileNumber || '',
                  email: t.email || '',
                  isClassTeacher: Boolean(t.isClassTeacher)
                });
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
    const set = new Set<string>();
    teachers.forEach(t => {
      if (t.subject) {
        set.add(t.subjectCode ? `${t.subject} (${t.subjectCode})` : t.subject);
      }
    });
    return ['All', ...Array.from(set)];
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    const list = teachers.filter(teacher => {
      const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.toLowerCase();
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch = 
        fullName.includes(q) ||
        (teacher.email || '').toLowerCase().includes(q) ||
        (teacher.subject || '').toLowerCase().includes(q) ||
        (teacher.subjectCode || '').toLowerCase().includes(q);
      
      const teacherFullSubject = teacher.subjectCode ? `${teacher.subject} (${teacher.subjectCode})` : teacher.subject;
      const matchesSubject = subjectFilter === 'All' || teacherFullSubject === subjectFilter || teacher.subject === subjectFilter;
      
      return matchesSearch && matchesSubject;
    });

    return [...list].sort((a, b) => {
      if (a.isClassTeacher && !b.isClassTeacher) return -1;
      if (!a.isClassTeacher && b.isClassTeacher) return 1;
      return 0;
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
                {currentWard?.className ? (
                  <>
                    Assigned to: <strong className="text-sky-700 dark:text-sky-400">
                      {(currentWard.className || '').toLowerCase().startsWith('class') ? currentWard.className : `Class ${currentWard.className}`}
                      {currentWard.section ? `-${currentWard.section}` : ''}
                    </strong>
                  </>
                ) : (
                  <strong className="text-sky-700 dark:text-sky-400">Assigned Faculty</strong>
                )}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {teachers.length} Faculty
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
            <input 
              type="text" 
              placeholder="Search teachers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-sky-300 dark:border-sky-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden transition-all shadow-2xs"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500 pointer-events-none" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden transition-all appearance-none cursor-pointer"
            >
              {subjects.map(sub => (
                <option key={sub} value={sub} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{sub === 'All' ? 'All Subjects' : sub}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Ward Selector Tabs */}
      <ParentStudentSelector
        wards={parentWards}
        selectedIndex={selectedWardIdx}
        onSelect={setSelectedWardIdx}
      />

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
          {filteredTeachers.map(teacher => {
            const isCT = teacher.isClassTeacher;
            
            if (isCT) {
              return (
                <div 
                  key={teacher.id} 
                  className="col-span-full rounded-2xl p-5 sm:p-6 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600 shadow-xs hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                    {/* Left: Avatar & Profile */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-lg sm:text-xl font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                        {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0) || teacher.firstName.charAt(1) || 'T'}
                      </div>

                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                            {teacher.firstName} {teacher.lastName}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700/80 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 shadow-2xs">
                            <GraduationCap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            Class Teacher
                          </span>
                        </div>

                        {teacher.subject && (
                          <div className="flex items-center gap-2 mt-1.5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold">
                            <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
                            <span>{teacher.subject}</span>
                            {teacher.subjectCode && (
                              <span className="opacity-70 text-xs font-mono">({teacher.subjectCode})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Contact Information Pills */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-left pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:border-slate-200/80 lg:dark:border-slate-800 lg:pl-6">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:hidden mb-0.5">
                        Class Teacher Contact
                      </div>
                      {teacher.phone ? (
                        <a 
                          href={`tel:${teacher.phone}`} 
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50/60 hover:bg-slate-100/80 dark:bg-slate-800/70 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:shadow-xs group/btn"
                        >
                          <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/80 dark:border-sky-800">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left font-mono">
                            <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 block leading-none">Call Phone</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{teacher.phone}</span>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 border border-slate-200/60 dark:border-slate-800">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium italic">No phone provided</span>
                        </div>
                      )}
                      {teacher.email ? (
                        <a 
                          href={`mailto:${teacher.email}`} 
                          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50/60 hover:bg-slate-100/80 dark:bg-slate-800/70 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:shadow-xs group/btn"
                        >
                          <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/80 dark:border-sky-800">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 block leading-none">Send Email</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px] block">{teacher.email}</span>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 border border-slate-200/60 dark:border-slate-800">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium italic">No email provided</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={teacher.id} 
                className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600 shadow-xs hover:shadow-md transition-all duration-300 group flex items-center gap-3.5 text-left"
              >
                <div className="w-11 h-11 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sm font-extrabold shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                  {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0) || teacher.firstName.charAt(1) || 'T'}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                    {teacher.firstName} {teacher.lastName}
                  </h3>

                  {teacher.subject && (
                    <div className="flex items-center gap-1.5 mt-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      <BookOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{teacher.subject}</span>
                      {teacher.subjectCode && (
                        <span className="opacity-70 text-[10.5px] whitespace-nowrap font-mono">({teacher.subjectCode})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredTeachers.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-sky-300 dark:border-sky-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-slate-800 text-sky-600 flex items-center justify-center mx-auto mb-3 border border-sky-200">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">No teachers found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No faculty assignments found{currentWard?.className ? ` for ${currentWard.className}${currentWard.section ? `-${currentWard.section}` : ''}` : ''}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
