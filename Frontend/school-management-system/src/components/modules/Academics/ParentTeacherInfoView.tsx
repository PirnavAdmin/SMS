import React from 'react';
import { UserCheck, BookOpen, GraduationCap, Phone, Mail } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const ParentTeacherInfoView: React.FC = () => {
  const { students, staff, academicClasses } = useData();
  const { user, role } = useAuth();

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

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
            <UserCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Teacher Information</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">View basic details about your ward's class teacher</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {parentWards.map(ward => {
          const academicClass = academicClasses.find(c => c.name === ward.className);
          const teacherName = academicClass?.sectionTeachers?.[ward.section] || academicClass?.teacher;
          
          let classTeacher = staff.find(teacher => 
            teacherName && `${teacher.firstName} ${teacher.lastName}` === teacherName
          );

          if (!classTeacher) {
             classTeacher = staff.find(teacher => 
               (teacher.role === 'Teacher' || teacher.employeeCategory === 'Teacher') && 
               teacher.assignedClasses?.includes(`${ward.className}-${ward.section}`)
             );
          }

          return (
            <div key={ward.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800/50 transition-all duration-300">
              
              {/* Left Section: Ward context */}
              <div className="bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-brand-950/40 dark:to-slate-900 p-6 md:p-8 md:w-[320px] shrink-0 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.02] transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <UserCheck className="w-32 h-32" />
                </div>
                 
                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm shadow-brand-500/20 shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
                      {ward.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider mb-0.5">Ward Details</p>
                      <p className="font-bold text-slate-900 dark:text-white text-base">
                        {ward.firstName} {ward.lastName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Class {ward.className}-{ward.section}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: Teacher Details */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-center bg-white dark:bg-slate-900 relative">
                {!classTeacher ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                      <GraduationCap className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-300">No Teacher Assigned</p>
                    <p className="text-sm text-slate-500 mt-1">Pending assignment for {ward.className}-{ward.section}</p>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
                    {/* Teacher Profile */}
                    <div className="flex items-start sm:items-center gap-5">
                       <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-inner shrink-0 border-4 border-white dark:border-slate-900 outline outline-1 outline-slate-200 dark:outline-slate-700">
                         {classTeacher.firstName.charAt(0)}{classTeacher.lastName.charAt(0)}
                       </div>
                       <div>
                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 mb-2">
                           <UserCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                           <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Class Teacher</span>
                         </div>
                         <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{classTeacher.firstName} {classTeacher.lastName}</h3>
                         <div className="flex items-center gap-2 mt-1.5 text-slate-500 dark:text-slate-400">
                           <BookOpen className="w-4 h-4 text-brand-500" />
                           <span className="text-sm font-medium">{classTeacher.assignedSubjects?.join(', ') || 'General Subjects'}</span>
                         </div>
                       </div>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex flex-col gap-3 w-full lg:w-auto">
                      {classTeacher.phone && (
                        <a href={`tel:${classTeacher.phone}`} className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors rounded-xl border border-slate-200/60 dark:border-slate-700/50 group/contact">
                           <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 group-hover/contact:border-brand-300 dark:group-hover/contact:border-brand-700 transition-colors shrink-0">
                             <Phone className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover/contact:text-brand-600 dark:group-hover/contact:text-brand-400 transition-colors" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Phone</span>
                             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{classTeacher.phone}</span>
                           </div>
                        </a>
                      )}
                      {classTeacher.email && (
                        <a href={`mailto:${classTeacher.email}`} className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors rounded-xl border border-slate-200/60 dark:border-slate-700/50 group/contact">
                           <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 group-hover/contact:border-brand-300 dark:group-hover/contact:border-brand-700 transition-colors shrink-0">
                             <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover/contact:text-brand-600 dark:group-hover/contact:text-brand-400 transition-colors" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Email</span>
                             <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 break-all">{classTeacher.email}</span>
                           </div>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
