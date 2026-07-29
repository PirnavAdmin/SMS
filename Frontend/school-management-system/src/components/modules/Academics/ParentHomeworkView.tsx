import React, { useState } from 'react';
import { FileText, Download, Menu } from 'lucide-react';
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
      title: "Social Studies Chapter 4",
      className: currentWard.className,
      section: currentWard.section,
      subject: "Social Studies (212)",
      teacherName: "Jonathan Miller",
      assignedDate: "2023-02-16",
      dueDate: "2023-02-20",
      evaluationDate: "2023-02-14", // Just keeping sample dates
      maxMarks: "55.00",
      marksObtained: "",
      note: "good",
      status: "Evaluated",
      description: "Complete chapter 4 questions.",
      attachments: []
    },
    {
      id: "mock-hw-2",
      title: "English Essay",
      className: currentWard.className,
      section: currentWard.section,
      subject: "English (210)",
      teacherName: "Dr. Sarah Johnson",
      assignedDate: "2023-02-15",
      dueDate: "2023-02-15",
      evaluationDate: "",
      maxMarks: "",
      marksObtained: "",
      note: "",
      status: "Pending",
      description: "Write an essay.",
      attachments: []
    },
    {
      id: "mock-hw-3",
      title: "English Comprehension",
      className: currentWard.className,
      section: currentWard.section,
      subject: "English (210)",
      teacherName: "Dr. Sarah Johnson",
      assignedDate: "2023-02-15",
      dueDate: "2023-02-15",
      evaluationDate: "",
      maxMarks: "50.00",
      marksObtained: "",
      note: "",
      status: "Pending",
      description: "Read the passage and answer questions.",
      attachments: []
    },
    {
      id: "mock-hw-4",
      title: "Math Problems",
      className: currentWard.className,
      section: currentWard.section,
      subject: "Mathematics (110)",
      teacherName: "Jonathan Miller",
      assignedDate: "2023-02-13",
      dueDate: "2023-02-16",
      evaluationDate: "",
      maxMarks: "20.00",
      marksObtained: "",
      note: "",
      status: "Pending",
      description: "Solve problems 1-10.",
      attachments: []
    },
    {
      id: "mock-hw-5",
      title: "Math Problems 2",
      className: currentWard.className,
      section: currentWard.section,
      subject: "Mathematics (110)",
      teacherName: "Jonathan Miller",
      assignedDate: "2023-02-08",
      dueDate: "2023-02-15",
      evaluationDate: "2023-02-08",
      maxMarks: "50.00",
      marksObtained: "",
      note: "",
      status: "Submitted",
      description: "Solve problems 11-20.",
      attachments: []
    }
  ];

  const processedWardHomework = wardHomeworkRaw.map(hw => ({
    ...hw,
    status: new Date(hw.dueDate) < new Date() ? 'Evaluated' : 'Pending',
    assignedDate: hw.assignedDate || hw.dueDate,
    evaluationDate: '',
    maxMarks: '50.00',
    marksObtained: '',
    note: ''
  }));

  const wardHomework = [...processedWardHomework, ...staticFallbackHomework];

  const subjects = Array.from(new Set(wardHomework.map(h => h.subject)));
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'Upcoming' | 'Closed'>('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHomework = wardHomework.filter(h => {
    const isUpcomingTab = filterStatus === 'Upcoming';
    // For demo purposes, we will treat 'Pending' as Upcoming and others as Closed
    const tabMatch = isUpcomingTab ? h.status === 'Pending' : h.status !== 'Pending';
    const searchMatch = !searchQuery || h.subject.toLowerCase().includes(searchQuery.toLowerCase()) || (h.title && h.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const subjectMatch = filterSubject === 'All' || h.subject === filterSubject;
    
    return tabMatch && searchMatch && subjectMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Evaluated':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#7cb342] text-white">Evaluated</span>;
      case 'Pending':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#e91e63] text-white">Pending</span>;
      case 'Submitted':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#ff9800] text-white">Submitted</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500 text-white">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
            <FileText className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          Homework
        </h2>
      </div>

      {/* Ward Selector Tabs (Hidden for Students since they only see themselves) */}
      {role !== 'Student' && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max overflow-x-auto max-w-full">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
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

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Tabs & Subject Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-sky-600 dark:border-sky-600/50 pr-0 sm:pr-4">
          <div className="flex">
            <button
              onClick={() => setFilterStatus('Upcoming')}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                filterStatus === 'Upcoming'
                  ? 'border-sky-600 text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Upcoming Homework
            </button>
            <button
              onClick={() => setFilterStatus('Closed')}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                filterStatus === 'Closed'
                  ? 'border-sky-600 text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Closed Homework
            </button>
          </div>
          <div className="px-4 py-2 sm:p-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="w-full sm:w-auto pl-3 pr-8 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
            >
              <option value="All">All Subjects</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>


        {/* Data Table */}
        <div className="overflow-x-auto" id="printable-content">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 font-bold text-xs text-slate-900 dark:text-white">Subject</th>
                <th className="py-3 px-4 font-bold text-xs text-slate-900 dark:text-white">Title</th>
                <th className="py-3 px-4 font-bold text-xs text-slate-900 dark:text-white">Homework Date</th>
                <th className="py-3 px-4 font-bold text-xs text-slate-900 dark:text-white">Submission Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredHomework.length > 0 ? (
                filteredHomework.map((hw: any, idx: number) => (
                  <tr key={hw.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-xs font-bold text-slate-900 dark:text-white">{hw.subject}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{hw.title}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{formatDate(hw.assignedDate)}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{formatDate(hw.dueDate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <div>
            1 to {filteredHomework.length} of {filteredHomework.length}
          </div>
          <div className="flex items-center gap-1">
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50" disabled>&lt;</button>
            <button className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium">1</button>
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50" disabled>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};
