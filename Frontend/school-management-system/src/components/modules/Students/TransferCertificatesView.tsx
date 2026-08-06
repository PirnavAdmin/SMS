import React, { useState } from 'react';
import { FileText, Search, Plus, Eye, Printer, UserCheck, ShieldAlert } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { TransferStudentModal } from './TransferStudentModal';
import { Student } from '../../../types';

interface TransferCertificatesViewProps {
  onNavigate?: (module: string) => void;
}

export const TransferCertificatesView: React.FC<TransferCertificatesViewProps> = ({ onNavigate }) => {
  const { students } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedStudentForTC, setSelectedStudentForTC] = useState<Student | null>(null);
  const [tcModalOpen, setTcModalOpen] = useState(false);
  const [viewingTcStudent, setViewingTcStudent] = useState<Student | null>(null);

  // Transferred or active students eligible for TC
  const transferredStudents = students.filter(s => {
    const isTransferred = s.status === 'Transferred';
    const matchStatus = filterStatus === 'All' || 
      (filterStatus === 'Transferred' && isTransferred) || 
      (filterStatus === 'Active' && s.status === 'Active');
    const matchQuery = !searchQuery || 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return (isTransferred || filterStatus === 'Active' || filterStatus === 'All') && matchStatus && matchQuery;
  });

  const activeStudentsForIssue = students.filter(s => s.status === 'Active');

  const handleOpenIssueModal = (student: Student) => {
    setSelectedStudentForTC(student);
    setTcModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner Header */}
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> Transfer Certificates
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Issue & track official Transfer Certificates (TC) for departing students</p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton data={transferredStudents} filename="transfer_certificates_log" />
          <button
            onClick={() => {
              if (activeStudentsForIssue.length > 0) {
                handleOpenIssueModal(activeStudentsForIssue[0]);
              } else {
                addToast('warning', 'No Eligible Students', 'No active students available for TC issuance.');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Issue Transfer Certificate
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name or admission no..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="All">All Records</option>
            <option value="Transferred">Transferred (TC Issued)</option>
            <option value="Active">Active Students</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3.5 px-4">TC Serial No</th>
                <th className="py-3.5 px-4">Student Admission No</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Class & Section</th>
                <th className="py-3.5 px-4">TC Issue Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {transferredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No transfer certificate records match your filter.</td>
                </tr>
              ) : (
                transferredStudents.map((st, idx) => {
                  const tcNo = `TC-2026-${(idx + 101).toString().padStart(3, '0')}`;
                  const isTransferred = st.status === 'Transferred';
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {isTransferred ? tcNo : 'Pending Request'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{st.admissionNo}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{st.className} - {st.section}</td>
                      <td className="py-3 px-4">
                        {isTransferred ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                            TC Issued (Transferred)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            Active Student
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isTransferred ? (
                            <button
                              onClick={() => setViewingTcStudent(st)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View TC
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenIssueModal(st)}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> Issue TC
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue TC Modal */}
      {selectedStudentForTC && (
        <TransferStudentModal
          student={selectedStudentForTC}
          isOpen={tcModalOpen}
          onClose={() => { setTcModalOpen(false); setSelectedStudentForTC(null); }}
        />
      )}

      {/* View TC Preview Modal */}
      {viewingTcStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Transfer Certificate Preview</h3>
              <button onClick={() => setViewingTcStudent(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 p-6 rounded-2xl bg-amber-50/30 dark:bg-amber-950/20 space-y-3 text-xs">
              <div className="text-center space-y-1">
                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">PIRNAV INTERNATIONAL SCHOOL</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Affiliated to CBSE • School Code: 54109</p>
                <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 tracking-widest uppercase mt-2">OFFICIAL TRANSFER CERTIFICATE</p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-b border-amber-200/60 dark:border-amber-800/60 py-3 font-semibold text-slate-800 dark:text-slate-200">
                <p>Student Name: <span className="font-bold text-slate-900 dark:text-white">{viewingTcStudent.firstName} {viewingTcStudent.lastName}</span></p>
                <p>Admission No: <span className="font-mono font-bold">{viewingTcStudent.admissionNo}</span></p>
                <p>Last Class: <span className="font-bold">{viewingTcStudent.className}-{viewingTcStudent.section}</span></p>
                <p>Parent Name: <span className="font-bold">{viewingTcStudent.parentName || 'N/A'}</span></p>
                <p>Status: <span className="font-bold text-amber-600">TC Issued / Transferred</span></p>
                <p>Issue Date: <span className="font-bold">{new Date().toLocaleDateString()}</span></p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Print TC
              </button>
              <button onClick={() => setViewingTcStudent(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
