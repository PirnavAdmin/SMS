// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { FileText, Download, Menu } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getParentChildren, ParentChild } from '../../../api/parent/parentApi';

export const ParentHomeworkView: React.FC = () => {
  const { students = [], admissions = [], homework, fetchHomeworkData } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Upcoming' | 'Closed'>('Upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [popupDescription, setPopupDescription] = useState<string | null>(null);

  useEffect(() => {
    if (fetchHomeworkData) {
      fetchHomeworkData();
    }
  }, [fetchHomeworkData]);

  useEffect(() => {
    let isMounted = true;
    const fetchChildren = async () => {
      try {
        const children = await getParentChildren(user?.email);
        if (isMounted) {
          setApiChildren(children || []);
        }
      } catch (err) {
        console.warn('Failed to load parent children in homework view:', err);
      }
    };
    fetchChildren();
    return () => { isMounted = false; };
  }, [user?.email]);

  // Match children by email or phone accurately
  let parentWards: any[] = [];

  if (apiChildren.length > 0) {
    parentWards = apiChildren.map(c => ({
      id: String(c.studentId),
      studentId: c.studentId,
      firstName: c.firstName || (c.studentName ? c.studentName.split(' ')[0] : 'Student'),
      lastName: c.lastName || '',
      studentName: c.studentName,
      className: c.className || 'Class 6',
      section: c.sectionName || 'A',
      status: 'Active'
    }));
  } else {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userPhone = (user?.phone || '').replace(/\D/g, '');

    const studentMatches = (students || []).filter(s => 
      s.status === 'Active' && 
      (
        role === 'Student' ? (s.id === user?.id || s.email === user?.email) :
        (
          (userEmail && (
            (s.email && s.email.toLowerCase().trim() === userEmail) ||
            ((s as any).parentEmail && (s as any).parentEmail.toLowerCase().trim() === userEmail) ||
            s.guardianEmail?.toLowerCase() === userEmail || 
            s.contactEmail?.toLowerCase() === userEmail || 
            s.fatherPhone?.toLowerCase() === userEmail ||
            s.motherPhone?.toLowerCase() === userEmail
          )) ||
          (userPhone && userPhone.length >= 7 && (
            (s.fatherPhone && s.fatherPhone.replace(/\D/g, '').endsWith(userPhone)) ||
            (s.motherPhone && s.motherPhone.replace(/\D/g, '').endsWith(userPhone))
          ))
        )
      )
    );

    const admissionMatches = (admissions || []).filter(a => {
      if (a.status === 'Rejected' || a.status === 'Cancelled') return false;
      const phoneMatch = userPhone && userPhone.length >= 7 && (
        (a.phone && a.phone.replace(/\D/g, '').endsWith(userPhone)) ||
        ((a as any).fatherMobileNo && (a as any).fatherMobileNo.replace(/\D/g, '').endsWith(userPhone)) ||
        ((a as any).fatherContact && (a as any).fatherContact.replace(/\D/g, '').endsWith(userPhone)) ||
        ((a as any).alternateMobileNumber && (a as any).alternateMobileNumber.replace(/\D/g, '').endsWith(userPhone))
      );
      const emailMatch = userEmail && (
        (a.email && a.email.toLowerCase().trim() === userEmail) ||
        ((a as any).parentEmail && (a as any).parentEmail.toLowerCase().trim() === userEmail)
      );
      return phoneMatch || emailMatch;
    }).map(a => ({
      id: String(a.id),
      studentId: a.id,
      firstName: a.firstName || (a as any).applicantName?.split(' ')[0] || 'Student',
      lastName: a.lastName || '',
      studentName: `${a.firstName || ''} ${a.lastName || ''}`.trim() || (a as any).applicantName || 'Student',
      className: (a as any).appliedClass?.className || (a as any).className || a.appliedClass || 'Class 3',
      section: (a as any).section || 'A',
      status: 'Active'
    }));

    const combined = [...studentMatches, ...admissionMatches];
    const unique = new Map();
    combined.forEach(w => {
      if (!unique.has(w.id)) unique.set(w.id, w);
    });
    parentWards = Array.from(unique.values());
  }

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        No active wards found in the system.
      </div>
    );
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  
  // Robust parser for class and section matching across all formats
  const parseClassAndSection = (clsStr: string, secStr?: string) => {
    if (!clsStr) return { cls: '', sec: (secStr || 'a').toLowerCase() };
    const cleanCls = clsStr.replace(/^Class\s*/i, '').replace(/^Grade\s*/i, '').trim();
    if (cleanCls.includes('-')) {
      const parts = cleanCls.split('-');
      return {
        cls: parts[0].trim().toLowerCase(),
        sec: (secStr || parts[1] || 'a').replace(/^Sec\s*/i, '').replace(/^Section\s*/i, '').trim().toLowerCase()
      };
    }
    return {
      cls: cleanCls.toLowerCase(),
      sec: (secStr || 'a').replace(/^Sec\s*/i, '').replace(/^Section\s*/i, '').trim().toLowerCase()
    };
  };

  const wardInfo = parseClassAndSection(currentWard.className, currentWard.section);

  // Filter the global homework data for this specific ward's class and section, ensuring publication checks
  const wardHomeworkRaw = (homework || []).filter(h => {
    const hInfo = parseClassAndSection(h.className, h.section);
    
    // Match class (e.g. '10' === '10' or '10-a' === '10-a')
    const classMatch = hInfo.cls === wardInfo.cls || hInfo.cls.includes(wardInfo.cls) || wardInfo.cls.includes(hInfo.cls);
    
    // Match section if specified
    const sectionMatch = !h.section || !currentWard.section || hInfo.sec === wardInfo.sec;

    if (!classMatch || !sectionMatch) return false;

    // Show homework that is active/published/assigned (default to true if status is not set)
    const isPublished = !h.status || ['Published', 'Active', 'Assigned', 'Completed'].includes(h.status);
    if (!isPublished) return false;

    // Show only if targeted to this student specifically or distributed to class-wide audience
    if (h.publishToType === 'Students') {
      const wardId = String(currentWard?.id || '').trim();
      const wardRoll = String(currentWard?.rollNo || '').trim();
      return Array.isArray(h.publishedStudentIds) && h.publishedStudentIds.some((id: any) => {
        const sId = String(id).trim();
        return sId === wardId || (wardRoll && sId === wardRoll);
      });
    }

    return true;
  }).sort((a, b) => new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime());

  const [submissions, setSubmissions] = useState<Record<string, { status: string; submittedAt: string; note?: string; attachmentName?: string }>>(() => {
    try {
      const saved = localStorage.getItem('parent_student_homework_submissions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeSubmittingHw, setActiveSubmittingHw] = useState<any | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFile, setSubmissionFile] = useState<string | null>(null);

  const handleSaveSubmission = (hwId: string) => {
    const updated = {
      ...submissions,
      [hwId]: {
        status: 'Submitted',
        submittedAt: new Date().toISOString(),
        note: submissionNote,
        attachmentName: submissionFile || 'Assignment_Submission.pdf'
      }
    };
    setSubmissions(updated);
    try {
      localStorage.setItem('parent_student_homework_submissions', JSON.stringify(updated));
    } catch {}
    setActiveSubmittingHw(null);
    setSubmissionNote('');
    setSubmissionFile(null);
  };

  const processedWardHomework = wardHomeworkRaw.map(hw => {
    const subRecord = submissions[hw.id];
    let hwStatus = 'Pending';
    if (subRecord && subRecord.status) {
      hwStatus = subRecord.status;
    } else if (new Date(hw.dueDate) < new Date()) {
      hwStatus = 'Evaluated';
    }

    return {
      ...hw,
      status: hwStatus,
      assignedDate: hw.assignedDate || hw.dueDate,
      evaluationDate: '',
      maxMarks: hw.maxMarks || '50.00',
      marksObtained: hw.marksObtained || '',
      note: subRecord?.note || hw.note || '',
      submissionRecord: subRecord
    };
  });

  const wardHomework = processedWardHomework;

  const subjects = Array.from(new Set(wardHomework.map(h => h.subject)));

  const getSubjectCode = (subjectName: string) => {
    if (!subjectName) return '';
    const name = subjectName.toLowerCase();
    if (name.includes('math')) return 'MAT-101';
    if (name.includes('english')) return 'ENG-103';
    if (name.includes('physics')) return 'PHY-102';
    if (name.includes('chemistry')) return 'CHE-104';
    if (name.includes('biology')) return 'BIO-105';
    if (name.includes('science')) return 'SCI-106';
    if (name.includes('computer')) return 'CS-105';
    return `${subjectName.substring(0, 3).toUpperCase()}-101`;
  };

  const filteredHomework = wardHomework.filter(h => {
    const isUpcomingTab = filterStatus === 'Upcoming';
    const tabMatch = isUpcomingTab ? (h.status === 'Pending' || h.status === 'Submitted') : (h.status === 'Evaluated' || h.status === 'Closed');
    const searchMatch = !searchQuery || h.subject.toLowerCase().includes(searchQuery.toLowerCase()) || (h.title && h.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const subjectMatch = filterSubject === 'All' || h.subject === filterSubject;
    const dateMatch = !filterDate || h.assignedDate === filterDate || h.dueDate === filterDate;
    
    return tabMatch && searchMatch && subjectMatch && dateMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Evaluated':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">Evaluated</span>;
      case 'Pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">Pending</span>;
      case 'Submitted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">Submitted</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
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
              Homework
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
          <div className="flex px-4 py-2 sm:p-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 gap-2 items-center">
            <input 
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full sm:w-auto pl-3 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
            />
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
                <th className="py-3 px-4 font-bold text-xs text-slate-900 dark:text-white">Description</th>
                <th className="py-3 px-4 font-bold text-xs text-slate-900 dark:text-white">Homework Date</th>
                <th className="py-3 px-4 font-bold text-xs text-slate-900 dark:text-white">Submission Date</th>
                <th className="py-3 px-4 font-bold text-xs text-slate-900 dark:text-white">Status</th>
                <th className="py-3 px-4 font-bold text-xs text-slate-900 dark:text-white text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredHomework.length > 0 ? (
                filteredHomework.map((hw: any, idx: number) => (
                  <tr key={hw.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-xs font-bold text-slate-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>{hw.subject.split('(')[0].trim()}</span>
                        <span className="opacity-60 text-[10px] font-normal lowercase">
                          ({hw.subject.includes('(') ? hw.subject.split('(')[1].replace(')', '').trim().toLowerCase() : getSubjectCode(hw.subject).toLowerCase()})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {hw.description && hw.description.length > 30 ? (
                        <div className="flex items-center gap-2">
                          <span>{hw.description.substring(0, 30)}...</span>
                          <button onClick={() => setPopupDescription(hw.description)} className="text-sky-600 hover:underline text-[10px] font-bold uppercase tracking-wider">Show</button>
                        </div>
                      ) : (
                        hw.description || hw.title
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{formatDate(hw.assignedDate)}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{formatDate(hw.dueDate)}</td>
                    <td className="py-3 px-4 text-xs">
                      {getStatusBadge(hw.status)}
                    </td>
                    <td className="py-3 px-4 text-xs text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hw.status === 'Pending' ? (
                          <button
                            onClick={() => {
                              setActiveSubmittingHw(hw);
                              setSubmissionNote(hw.note || '');
                            }}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                          >
                            Submit
                          </button>
                        ) : hw.status === 'Submitted' ? (
                          <button
                            onClick={() => {
                              setActiveSubmittingHw(hw);
                              setSubmissionNote(hw.note || '');
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                          >
                            Edit Submission
                          </button>
                        ) : (
                          <button
                            onClick={() => setPopupDescription(`Marks: ${hw.marksObtained || hw.maxMarks}/${hw.maxMarks}\nEvaluation Note: Completed and evaluated.`)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all"
                          >
                            View Result
                          </button>
                        )}
                        {(hw.documentUrl || hw.attachment) && (
                          <a
                            href={hw.documentUrl || hw.attachment}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Download Attachment"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
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

      {/* Description Popup Modal */}
      {popupDescription && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPopupDescription(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Details</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{popupDescription}</p>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setPopupDescription(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Homework Submission Modal */}
      {activeSubmittingHw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActiveSubmittingHw(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Submit Homework: {activeSubmittingHw.subject}
            </h3>
            <div className="text-xs text-slate-500">
              Due Date: <span className="font-bold text-slate-700 dark:text-slate-300">{formatDate(activeSubmittingHw.dueDate)}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Submission Notes / Text
                </label>
                <textarea
                  rows={4}
                  value={submissionNote}
                  onChange={e => setSubmissionNote(e.target.value)}
                  placeholder="Enter answers, comments, or notes for the teacher..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Assignment File (PDF, DOCX, JPG)
                </label>
                <input
                  type="file"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSubmissionFile(e.target.files[0].name);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                />
                {submissionFile && (
                  <p className="mt-1 text-xs text-emerald-600 font-medium">
                    Selected file: {submissionFile}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubmittingHw(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveSubmission(activeSubmittingHw.id)}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Save & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
