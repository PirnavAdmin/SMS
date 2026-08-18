import React, { useState } from 'react';
import { LogOut, Plus, Search, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { SearchableSelect } from '../../common/SearchableSelect';
import { ConfirmModal } from '../../common/ConfirmModal';

interface OutpassRecord {
  id: number;
  studentName: string;
  admissionNo: string;
  hostelName: string;
  roomNumber: string;
  outpassType: 'Local Outpass' | 'Home Leave' | 'Emergency Outpass';
  departureDate: string;
  returnDate: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

const OUTPASSES_STORE_KEY = 'edu_db_hostel_outpasses';

const DEFAULT_INITIAL_OUTPASSES: OutpassRecord[] = [
  {
    id: 1,
    studentName: 'Rajesh Kumar',
    admissionNo: 'ADM-2026-101',
    hostelName: 'Ramachandra Bhavan Block',
    roomNumber: '101',
    outpassType: 'Home Leave',
    departureDate: '2026-08-15',
    returnDate: '2026-08-18',
    reason: 'Family function visit',
    status: 'Approved'
  },
  {
    id: 2,
    studentName: 'Ananya Roy',
    admissionNo: 'ADM-2026-106',
    hostelName: 'Girls Block A',
    roomNumber: 'G-101',
    outpassType: 'Local Outpass',
    departureDate: '2026-08-17',
    returnDate: '2026-08-17',
    reason: 'Medical checkup',
    status: 'Pending'
  }
];

export const HostelOutpassLeaveView: React.FC = () => {
  const { students } = useData();
  const { addToast } = useToast();

  const [records, setRecords] = useState<OutpassRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(OUTPASSES_STORE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return DEFAULT_INITIAL_OUTPASSES;
  });

  const saveRecords = (newRecords: OutpassRecord[]) => {
    setRecords(newRecords);
    if (typeof window !== 'undefined') {
      localStorage.setItem(OUTPASSES_STORE_KEY, JSON.stringify(newRecords));
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<OutpassRecord | null>(null);

  // Form fields
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [outpassType, setOutpassType] = useState<'Local Outpass' | 'Home Leave' | 'Emergency Outpass'>('Local Outpass');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [reason, setReason] = useState('');

  const hostellers = (students || []).filter(s =>
    s && (
      s.studentType === 'Hosteller' ||
      (s.studentType as any) === 'Residential' ||
      (s.studentType as any) === 'Boarder' ||
      (s.studentType as any) === 'Hostel' ||
      (s as any).isHostelRequired === true ||
      (s as any).facilityOpted === 'Hostel' ||
      Boolean((s as any).hostelName)
    )
  );

  const displayStudentsList = hostellers.length > 0 ? hostellers : (students || []);

  const handleOpenAdd = () => {
    setSelectedStudentId('');
    setOutpassType('Local Outpass');
    setDepartureDate('');
    setReturnDate('');
    setReason('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !departureDate || !returnDate) {
      addToast('Please complete all required fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const selectedSt = students.find(s => s.id.toString() === selectedStudentId);

    const newRecord: OutpassRecord = {
      id: Date.now(),
      studentName: selectedSt ? `${selectedSt.firstName || ''} ${selectedSt.lastName || ''}`.trim() : 'Student',
      admissionNo: selectedSt?.admissionNo || `ADM-2026-${selectedStudentId}`,
      hostelName: (selectedSt as any)?.hostelName || 'Ramachandra Bhavan Block',
      roomNumber: (selectedSt as any)?.roomNumber || '101',
      outpassType,
      departureDate,
      returnDate,
      reason: reason || 'Personal work',
      status: 'Pending'
    };

    saveRecords([newRecord, ...records]);
    addToast('Outpass / Leave request submitted successfully.', 'success');
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleStatusChange = (id: number, newStatus: 'Approved' | 'Rejected') => {
    const updated = records.map(r => r.id === id ? { ...r, status: newStatus } : r);
    saveRecords(updated);
    addToast(`Outpass request marked as ${newStatus}.`, 'info');
  };

  const handleDelete = () => {
    if (!deletingRecord) return;
    const updated = records.filter(r => r.id !== deletingRecord.id);
    saveRecords(updated);
    addToast('Outpass record deleted.', 'success');
    setDeletingRecord(null);
  };

  const filtered = records.filter(r => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || !filterStatus || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-end">
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Apply Outpass / Leave
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search student, adm no, room..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="min-w-[180px] w-full sm:w-auto">
            <SearchableSelect
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Select Option"
              searchPlaceholder="Search status..."
              options={[
                { value: '', label: 'Select Option' },
                { value: 'All', label: 'All Statuses' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Rejected', label: 'Rejected' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Empty State Prompt Card */}
      {!filterStatus && !searchQuery.trim() ? (
        <div className="py-16 px-6 glass-card rounded-3xl border border-sky-300 dark:border-sky-800 text-center space-y-3 bg-white dark:bg-slate-900 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto shadow-inner">
            <LogOut className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Please enter a search query to load records.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-5">Adm No</th>
                  <th className="py-3.5 px-5">Hostel & Room</th>
                  <th className="py-3.5 px-5">Outpass Type</th>
                  <th className="py-3.5 px-5">Departure</th>
                  <th className="py-3.5 px-5">Expected Return</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 italic font-semibold">No outpass records found matching filter.</td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">{r.studentName}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-500">{r.admissionNo}</td>
                      <td className="py-3.5 px-5 font-semibold text-sky-600 dark:text-sky-400">{r.hostelName} (Room #{r.roomNumber})</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-slate-200">{r.outpassType}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">{r.departureDate}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">{r.returnDate}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          r.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'Pending' && (
                            <>
                              <button onClick={() => handleStatusChange(r.id, 'Approved')} className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50"><CheckCircle2 className="w-4 h-4" /></button>
                              <button onClick={() => handleStatusChange(r.id, 'Rejected')} className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
                          <button onClick={() => setDeletingRecord(r)} className="p-1 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Apply Outpass / Leave</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Student <span className="text-rose-500">*</span></label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  disabled={isSubmitting}
                  required
                >
                  <option value="" disabled>Select Student...</option>
                  {displayStudentsList.map(st => (
                    <option key={st.id} value={st.id.toString()}>{st.firstName} {st.lastName} ({st.admissionNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Outpass Category <span className="text-rose-500">*</span></label>
                <select
                  value={outpassType}
                  onChange={e => setOutpassType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600"
                  disabled={isSubmitting}
                >
                  <option value="Local Outpass">Local Outpass (Same Day)</option>
                  <option value="Home Leave">Home Leave (Multiple Days)</option>
                  <option value="Emergency Outpass">Emergency Outpass</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Departure Date & Time <span className="text-rose-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={departureDate}
                    onChange={e => setDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-[11px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Expected Return <span className="text-rose-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-[11px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Medical appointment, family visit"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingRecord && (
        <ConfirmModal
          isOpen={true}
          title="Delete Outpass Record"
          message={`Are you sure you want to remove outpass request for ${deletingRecord.studentName}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRecord(null)}
        />
      )}
    </div>
  );
};
