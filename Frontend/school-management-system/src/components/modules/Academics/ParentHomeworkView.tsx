import React, { useState } from 'react';
import { FileText, Calendar, AlertCircle, Download, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const ParentHomeworkView: React.FC = () => {
  const { students, homework } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  // Match children by email or phone
  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (
      role === 'Student' ? s.id === user?.id : // For student login, match own ID
      (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
    )
  );

  const hasMatchedWards = parentWards.length > 0;
  if (!hasMatchedWards) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 2);
  }

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active wards found in the system.
      </div>
    );
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  
  // Filter the global homework data for this specific ward's class and section
  const wardHomeworkRaw = homework.filter(h => 
    h.className === currentWard.className && h.section === currentWard.section
  ).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  // Static Fallback if the mock database is empty for this class
  const staticFallbackHomework = [
    {
      id: "mock-hw-1",
      title: "Algebraic Expressions Worksheet",
      className: currentWard.className,
      section: currentWard.section,
      subject: "Mathematics",
      teacherName: "Jonathan Miller",
      assignedDate: "2026-07-20",
      dueDate: "2026-07-27",
      description: "Complete all questions from Chapter 5 Exercise 5.2. Make sure to show all working steps.",
      attachments: [{ name: "Ch5_Worksheet.pdf", url: "#", type: "PDF" }]
    },
    {
      id: "mock-hw-2",
      title: "Science Essay: Renewable Energy",
      className: currentWard.className,
      section: currentWard.section,
      subject: "Science",
      teacherName: "Dr. Sarah Johnson",
      assignedDate: "2026-07-21",
      dueDate: "2026-07-25",
      description: "Write a 500-word essay on the importance of renewable energy sources in modern times.",
      attachments: []
    }
  ];

  const wardHomework = wardHomeworkRaw.length > 0 ? wardHomeworkRaw : staticFallbackHomework;

  // Derive subjects for filter
  const subjects = Array.from(new Set(wardHomework.map(h => h.subject)));
  const [filterSubject, setFilterSubject] = useState('All');

  const filteredHomework = wardHomework.filter(h => filterSubject === 'All' || h.subject === filterSubject);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-amber-500" /> Homework
        </h2>
        <p className="text-xs text-slate-500 mt-1">Review pending homework and assignments</p>
      </div>

      {!hasMatchedWards && (
         <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
               <p className="font-bold">Demo Mode Active</p>
               <p>Your login ({user?.email}) did not match any records in the database. Showing sample wards for demonstration.</p>
            </div>
         </div>
      )}

      {/* Header controls: Ward Selector (if parent) & Subject Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {role !== 'Student' && (
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max">
            {parentWards.map((ward, idx) => (
              <button
                key={ward.id}
                onClick={() => setSelectedChildIdx(idx)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedChildIdx === idx
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {ward.firstName} {ward.lastName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm transition-all"
          >
            <option value="All">All Subjects</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wardHomeworkRaw.length === 0 && (
           <div className="md:col-span-2 bg-sky-50 border-l-4 border-sky-400 p-4 text-sky-700 text-sm font-medium rounded-xl">
             Note: Displaying static sample data because no homework records were found for {currentWard.className}-{currentWard.section} in the database.
           </div>
        )}

        {filteredHomework.length > 0 ? filteredHomework.map(hw => {
          const isOverdue = new Date(hw.dueDate) < new Date();
          return (
            <div key={hw.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    {hw.subject}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-3 leading-tight">{hw.title}</h3>
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                  isOverdue ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' 
                  : 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                }`}>
                  {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  Due: {hw.dueDate}
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{hw.description}</p>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <BookOpen className="w-3.5 h-3.5" /> Assigned by: {hw.teacherName}
                </div>
                
                {hw.attachments && hw.attachments.length > 0 && (
                  <button className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors bg-brand-50 dark:bg-brand-500/10 px-3 py-1.5 rounded-lg">
                    <Download className="w-3.5 h-3.5" /> {hw.attachments.length} Attachments
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="md:col-span-2 py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">All Caught Up!</h3>
            <p className="text-slate-500 font-medium">No pending tasks for {filterSubject === 'All' ? 'any subject' : filterSubject}.</p>
          </div>
        )}
      </div>
    </div>
  );
};
