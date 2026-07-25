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
          <div className="p-2 bg-brand-500/10 dark:bg-brand-500/20 rounded-lg hidden sm:block">
            <UserCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Teacher Information</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">View basic details about your ward's class teacher</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div key={ward.id} className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 relative overflow-hidden flex flex-col h-full text-white border border-indigo-400 shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -z-10" />
              
              {/* Ward Header */}
              <div className="mb-6 flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                  {ward.firstName.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Ward</p>
                  <p className="font-bold text-white text-sm">
                    {ward.firstName} {ward.lastName} <span className="opacity-75 font-mono text-[10px] ml-1">({ward.className}-{ward.section})</span>
                  </p>
                </div>
              </div>

              {!classTeacher ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-2xl border border-dashed border-white/20">
                  <GraduationCap className="w-8 h-8 text-indigo-200 mb-2" />
                  <p className="text-sm font-bold text-white">No Teacher Assigned</p>
                  <p className="text-xs text-indigo-200 mt-1">Pending assignment for {ward.className}-{ward.section}</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-lg flex items-center gap-2 border-b border-indigo-400/50 pb-3 mb-4">
                    <UserCheck className="w-5 h-5 text-indigo-100" /> Teacher Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Class Teacher</p>
                      <p className="text-xl font-bold">{classTeacher.firstName} {classTeacher.lastName}</p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Subjects Dealt</p>
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-indigo-200 shrink-0" />
                        <p className="font-semibold text-sm">
                          {classTeacher.assignedSubjects?.join(', ') || 'General Subjects'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Contact Details</p>
                      {classTeacher.phone && (
                        <div className="flex items-center gap-3 mb-3">
                          <Phone className="w-5 h-5 text-indigo-200 shrink-0" />
                          <p className="font-bold text-lg">{classTeacher.phone}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-indigo-100">
                        <Mail className="w-4 h-4 text-indigo-200 shrink-0 opacity-80" />
                        <a href={`mailto:${classTeacher.email}`} className="font-medium text-sm hover:underline hover:text-white transition-colors">{classTeacher.email}</a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
