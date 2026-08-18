import React, { useState } from 'react';
import { ArrowRightLeft, Plus, Search, CheckCircle2, Trash2, ChevronDown } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { getAllocations, vacateAllocation, createAllocation } from '../../../api/hostel';

interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  disabled?: boolean;
}

const SearchableCombobox: React.FC<{
  options: ComboboxOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}> = ({ options, value, onChange, placeholder = 'Select option...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOpt = options.find(o => String(o.value) === String(value));

  React.useEffect(() => {
    if (selectedOpt) {
      setSearchText(selectedOpt.label);
    } else if (value) {
      setSearchText(value);
    } else {
      setSearchText('');
    }
  }, [value, selectedOpt]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    if (!searchText.trim()) return true;
    if (selectedOpt && searchText === selectedOpt.label) return true;
    const q = searchText.toLowerCase().trim();
    return opt.label.toLowerCase().includes(q) || (opt.subLabel || '').toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative cursor-pointer" onClick={() => setIsOpen(prev => !prev)}>
        <input
          type="text"
          value={searchText}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            const val = e.target.value;
            setSearchText(val);
            setIsOpen(true);
            onChange(val);
          }}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
        />
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1 space-y-0.5 custom-scrollbar">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs font-bold text-sky-600 cursor-pointer" onClick={() => { onChange(searchText); setIsOpen(false); }}>
              Use custom: "{searchText}"
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={`combobox_opt_${opt.value}_${idx}`}
                  type="button"
                  disabled={opt.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setSearchText(opt.label);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                    opt.disabled
                      ? 'opacity-50 cursor-not-allowed text-slate-400'
                      : isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 font-extrabold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold'
                  }`}
                >
                  <span className="font-bold">{opt.label}</span>
                  {isSelected && <span className="text-[10px] text-sky-600 font-bold">✓ Selected</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const SearchableSelect = SearchableCombobox;

interface TransferRecord {
  id: number;
  studentName: string;
  admissionNo: string;
  actionType: 'Room Transfer' | 'Bed Vacate';
  fromHostel: string;
  fromRoom: string;
  toHostel: string;
  toRoom: string;
  requestDate: string;
  reason: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  totalFeePaid?: number;
  monthsStayed?: number;
  feeUtilized?: number;
  refundableBalance?: number;
  feeAdjustmentMode?: string;
}

const TRANSFERS_STORE_KEY = 'edu_db_hostel_transfers';

const DEFAULT_INITIAL_TRANSFERS: TransferRecord[] = [
  {
    id: 1,
    studentName: 'Rajesh Kumar',
    admissionNo: 'ADM-2026-101',
    actionType: 'Room Transfer',
    fromHostel: 'Ramachandra Bhavan Block',
    fromRoom: '101',
    toHostel: 'Bhanu Block',
    toRoom: '201',
    requestDate: '2026-08-01',
    reason: 'Mutual exchange with classmate',
    status: 'Completed'
  },
  {
    id: 2,
    studentName: 'Surya Teja',
    admissionNo: 'ADM-2026-102',
    actionType: 'Bed Vacate',
    fromHostel: 'Ramachandra Bhavan Block',
    fromRoom: '101',
    toHostel: 'N/A (Vacated)',
    toRoom: 'N/A',
    requestDate: '2026-08-10',
    reason: 'Shifted to Day Scholar residence',
    status: 'Completed',
    totalFeePaid: 60000,
    monthsStayed: 3,
    feeUtilized: 15000,
    refundableBalance: 45000,
    feeAdjustmentMode: 'Credit to Tuition Fee'
  }
];

export const HostelTransferVacateView: React.FC = () => {
  const { students } = useData();
  const { addToast } = useToast();

  const [records, setRecords] = useState<TransferRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TRANSFERS_STORE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return DEFAULT_INITIAL_TRANSFERS;
  });

  const saveRecords = (newRecords: TransferRecord[]) => {
    setRecords(newRecords);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRANSFERS_STORE_KEY, JSON.stringify(newRecords));
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<TransferRecord | null>(null);
  const [selectedFeeDetail, setSelectedFeeDetail] = useState<TransferRecord | null>(null);

  // Form fields
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [actionType, setActionType] = useState<'Room Transfer' | 'Bed Vacate'>('Room Transfer');
  const [targetBlock, setTargetBlock] = useState('Boys Residence - Block B');
  const [targetRoom, setTargetRoom] = useState('201');
  const [reason, setReason] = useState('');

  // Fee Settlement fields
  const [totalFeePaid, setTotalFeePaid] = useState<number>(60000);
  const [monthsStayed, setMonthsStayed] = useState<number>(3);
  const [feeAdjustmentMode, setFeeAdjustmentMode] = useState<'Credit to Tuition Fee' | 'Refund Cash/Bank' | 'Non-Refundable'>('Credit to Tuition Fee');

  const hostellers = (students || []).filter(s => s && (s.studentType === 'Hosteller' || s.studentType === 'Residential' || (s as any).isHostelRequired));

  // Calculated prorated fee values
  const feeUtilized = Math.round((totalFeePaid * monthsStayed) / 12);
  const refundableBalance = Math.max(0, totalFeePaid - feeUtilized);

  const handleOpenAdd = () => {
    setSelectedStudentId('');
    setActionType('Room Transfer');
    setTargetBlock('Boys Residence - Block B');
    setTargetRoom('201');
    setReason('');
    setTotalFeePaid(60000);
    setMonthsStayed(3);
    setFeeAdjustmentMode('Credit to Tuition Fee');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      addToast('Please select a student.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const selectedSt = students.find(s => s.id.toString() === selectedStudentId);
    const stName = selectedSt ? `${selectedSt.firstName || ''} ${selectedSt.lastName || ''}`.trim() : 'Student';
    const admNo = selectedSt?.admissionNo || `ADM-2026-${selectedStudentId}`;

    // If Bed Vacate is chosen, trigger vacateAllocation in hostel API
    if (actionType === 'Bed Vacate') {
      try {
        const allocs = await getAllocations();
        const matchAlloc = allocs.find(a => String(a.studentId) === String(selectedStudentId) || a.admissionNo === admNo);
        if (matchAlloc) {
          await vacateAllocation(matchAlloc.allocationId);
        }
      } catch (err) {}
    }

    const newRecord: TransferRecord = {
      id: Date.now(),
      studentName: stName,
      admissionNo: admNo,
      actionType,
      fromHostel: 'Ramachandra Bhavan Block',
      fromRoom: '101',
      toHostel: actionType === 'Bed Vacate' ? 'N/A (Vacated)' : targetBlock,
      toRoom: actionType === 'Bed Vacate' ? 'N/A' : targetRoom,
      requestDate: new Date().toISOString().split('T')[0],
      reason: reason || (actionType === 'Bed Vacate' ? 'Opted out to Non-Residential' : 'Personal request'),
      status: 'Completed',
      ...(actionType === 'Bed Vacate' ? {
        totalFeePaid,
        monthsStayed,
        feeUtilized,
        refundableBalance: feeAdjustmentMode === 'Non-Refundable' ? 0 : refundableBalance,
        feeAdjustmentMode
      } : {})
    };

    saveRecords([newRecord, ...records]);
    addToast(`${actionType} request processed. ${actionType === 'Bed Vacate' ? 'Bed released to available. Fee adjusted: ₹' + refundableBalance.toLocaleString() : 'Transferred to ' + targetBlock}`, 'success');
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleApprove = (id: number) => {
    const updated = records.map(r => r.id === id ? { ...r, status: 'Completed' as const } : r);
    saveRecords(updated);
    addToast('Transfer/Vacate request completed successfully. Bed released to available status.', 'success');
  };

  const handleDelete = () => {
    if (!deletingRecord) return;
    const updated = records.filter(r => r.id !== deletingRecord.id);
    saveRecords(updated);
    addToast('Record removed.', 'success');
    setDeletingRecord(null);
  };

  const filtered = records.filter(r => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fromRoom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'All' || !filterAction || r.actionType === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-end">
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Request Transfer / Vacate
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
              value={filterAction}
              onChange={setFilterAction}
              placeholder="Select Option"
              searchPlaceholder="Search type..."
              options={[
                { value: '', label: 'Select Option' },
                { value: 'All', label: 'All Requests' },
                { value: 'Room Transfer', label: 'Room Transfer' },
                { value: 'Bed Vacate', label: 'Bed Vacate' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Empty State Prompt Card */}
      {!filterAction && !searchQuery.trim() ? (
        <div className="py-16 px-6 glass-card rounded-3xl border border-sky-300 dark:border-sky-800 text-center space-y-3 bg-white dark:bg-slate-900 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto shadow-inner">
            <ArrowRightLeft className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Please enter a search query or filter to load transfer and vacate records.
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
                  <th className="py-3.5 px-5">Action Type</th>
                  <th className="py-3.5 px-5">Current Room</th>
                  <th className="py-3.5 px-5">Target Room / Fee Adjustment</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 italic font-semibold">No transfer/vacate records found matching filter.</td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">{r.studentName}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-500">{r.admissionNo}</td>
                      <td className="py-3.5 px-5 font-bold text-sky-600 dark:text-sky-400">{r.actionType}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{r.fromHostel} (#{r.fromRoom})</td>
                      <td className="py-3.5 px-5">
                        {r.actionType === 'Bed Vacate' ? (
                          <div className="space-y-1">
                            <span className="text-emerald-600 font-bold block">✓ Old Bed Released to Available</span>
                            {r.refundableBalance !== undefined && (
                              <button
                                onClick={() => setSelectedFeeDetail(r)}
                                className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-800 hover:underline cursor-pointer"
                              >
                                Fee Adjusted: ₹{r.refundableBalance.toLocaleString()} ({r.feeAdjustmentMode})
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-emerald-600 font-bold block">New Bed: {r.toHostel} (#{r.toRoom})</span>
                            <span className="text-[10px] font-semibold text-slate-400 block">✓ Old Bed #{r.fromRoom} Released to Available</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">{r.requestDate}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'Pending' && (
                            <button onClick={() => handleApprove(r.id)} className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50" title="Approve & Release Bed"><CheckCircle2 className="w-4 h-4" /></button>
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

      {/* CREATE MODAL WITH PRO-RATA FEE ADJUSTMENT CALCULATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Request Transfer / Vacate Bed</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Resident Student <span className="text-rose-500">*</span></label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                  disabled={isSubmitting}
                  required
                >
                  <option value="" disabled>Select Resident Student...</option>
                  {(hostellers.length > 0 ? hostellers : students).map(st => (
                    <option key={st.id} value={st.id.toString()}>{st.firstName} {st.lastName} ({st.admissionNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Action Type <span className="text-rose-500">*</span></label>
                <select
                  value={actionType}
                  onChange={e => setActionType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600"
                  disabled={isSubmitting}
                >
                  <option value="Room Transfer">Room Transfer (Change Room/Block)</option>
                  <option value="Bed Vacate">Bed Vacate (Checkout & Switch to Day Scholar)</option>
                </select>
              </div>

              {actionType === 'Room Transfer' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1">Destination Hostel Block <span className="text-rose-500">*</span></label>
                    <select
                      value={targetBlock}
                      onChange={e => setTargetBlock(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                      required
                    >
                      <option value="Boys Residence - Block A">Boys Residence - Block A</option>
                      <option value="Bhanu Block">Bhanu Block</option>
                      <option value="Girls Hostel - Block B">Girls Hostel - Block B</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Destination Room <span className="text-rose-500">*</span></label>
                      <select
                        value={targetRoom}
                        onChange={e => setTargetRoom(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                        required
                      >
                        <option value="101">Room 101</option>
                        <option value="102">Room 102</option>
                        <option value="201">Room 201</option>
                        <option value="202">Room 202</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Destination Bed Number <span className="text-rose-500">*</span></label>
                      <select
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                        required
                      >
                        <option value="Bed #1">Bed #1</option>
                        <option value="Bed #2">Bed #2</option>
                        <option value="Bed #3">Bed #3</option>
                        <option value="Bed #4">Bed #4</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* PRO-RATA HOSTEL FEE ADJUSTMENT & REFUND CALCULATOR */
                <div className="p-4 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-sky-200 dark:border-sky-800 pb-2">
                    <span className="font-extrabold text-sky-800 dark:text-sky-300 uppercase tracking-wider text-[11px]">
                      💰 Pro-rata Hostel Fee Settlement Calculator
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                      Bed Released to Available
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Annual Hostel Fee Paid (₹)</label>
                      <input
                        type="number"
                        value={totalFeePaid}
                        onChange={e => setTotalFeePaid(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Months Stayed</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={monthsStayed}
                        onChange={e => setMonthsStayed(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Fee Breakdown Summary */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl space-y-1.5 border border-sky-100 dark:border-sky-900">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Utilized Fee ({monthsStayed} Mos @ Pro-rata):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">₹{feeUtilized.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-emerald-600 font-bold">Unused Refundable Balance:</span>
                      <span className="font-mono font-black text-emerald-600 text-sm">₹{refundableBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Settlement / Adjustment Mode */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fee Settlement & Adjustment Mode <span className="text-rose-500">*</span></label>
                    <select
                      value={feeAdjustmentMode}
                      onChange={e => setFeeAdjustmentMode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border font-bold text-sky-600 outline-none"
                    >
                      <option value="Credit to Tuition Fee">Credit Balance to Student Tuition Dues (Recommended)</option>
                      <option value="Refund Cash/Bank">Direct Cash / Bank Refund Voucher to Parent</option>
                      <option value="Non-Refundable">Non-Refundable (As per School Policy)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Switched to Non-Residential / Day Scholar after 3 months"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : 'Approve & Release Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEE ADJUSTMENT DETAILS MODAL */}
      {selectedFeeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hostel Fee Settlement Receipt</h3>
              <button onClick={() => setSelectedFeeDetail(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedFeeDetail.studentName}</p>
                <p className="text-slate-400 font-mono">Adm ID: {selectedFeeDetail.admissionNo}</p>
                <p className="text-slate-500">Hostel: {selectedFeeDetail.fromHostel} (#{selectedFeeDetail.fromRoom})</p>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Annual Fee Paid:</span>
                  <span className="font-mono font-bold">₹{selectedFeeDetail.totalFeePaid?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Months Stayed:</span>
                  <span className="font-mono font-bold">{selectedFeeDetail.monthsStayed} Months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee Utilized:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{selectedFeeDetail.feeUtilized?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-emerald-600 font-bold">
                  <span>Adjusted Refundable Balance:</span>
                  <span className="font-mono text-sm">₹{selectedFeeDetail.refundableBalance?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 text-[11px]">
                  <span className="text-slate-500">Adjustment Mode:</span>
                  <span className="font-bold text-sky-600">{selectedFeeDetail.feeAdjustmentMode}</span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-[11px]">
                ✓ Bed released to available status. Fee adjustment entry logged in Finance Ledger.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFeeDetail(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-slate-700 dark:text-slate-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingRecord && (
        <ConfirmModal
          isOpen={true}
          title="Delete Request"
          message={`Are you sure you want to remove request for ${deletingRecord.studentName}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRecord(null)}
        />
      )}
    </div>
  );
};
