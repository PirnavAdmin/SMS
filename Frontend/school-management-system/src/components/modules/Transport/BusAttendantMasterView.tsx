import React, { useState } from 'react';
import { UserCheck, Plus, Search, Edit, Trash2, Phone, ShieldCheck, Bus, ChevronDown } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { BusAttendantMaster, initialBusAttendants } from './transportData';
export type { BusAttendantMaster };      // re-export type for backward compat
export { initialBusAttendants };          // re-export value for backward compat

// BusAttendantMaster type and initialBusAttendants are now in transportData.ts

export const BusAttendantMasterView: React.FC = () => {
  const { staff = [], vehicleAssignments = [], busAttendants: attendants = [], addBusAttendant, updateBusAttendant, deleteBusAttendant } = useData();
  const { selectedBranch } = useAuth();
  const { addToast } = useToast();

  // Deduplicate attendants to guarantee no duplicate entries are displayed
  const uniqueAttendants = React.useMemo(() => {
    const seen = new Set<string>();
    const result: BusAttendantMaster[] = [];
    (attendants || []).forEach(a => {
      const empKey = a.employeeId?.trim().toLowerCase();
      const nameKey = a.attendantName?.trim().toLowerCase();
      const phoneKey = a.mobileNumber?.trim();
      const primaryKey = empKey
        ? `emp_${empKey}`
        : (nameKey && phoneKey
            ? `np_${nameKey}_${phoneKey}`
            : (nameKey ? `n_${nameKey}` : (a.id ? `id_${a.id}` : '')));
      if (!primaryKey) return;
      if (!seen.has(primaryKey)) {
        seen.add(primaryKey);
        result.push(a);
      }
    });
    return result;
  }, [attendants]);

  // Filter ONLY attendants from Non-Teaching Staff
  const nonTeachingAttendants = React.useMemo(() => {
    return (staff || []).filter(s => {
      if (s.role === 'Teacher' || s.employeeCategory === 'Teacher') return false;
      const desig = (s.designation || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      const role = (s.role || (s as any).employeeCategory || '').toLowerCase();
      return (
        desig.includes('attendant') ||
        dept.includes('attendant') ||
        role.includes('attendant') ||
        desig.includes('conductor') ||
        desig.includes('helper')
      );
    });
  }, [staff]);

  const filteredNonTeachingStaff = React.useMemo(() => {
    return nonTeachingAttendants.filter(
      s => !uniqueAttendants.some(a => a.employeeId === s.empId || a.employeeId === (s as any).employeeId)
    );
  }, [nonTeachingAttendants, uniqueAttendants]);

  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  const searchedStaff = React.useMemo(() => {
    if (!staffSearchQuery.trim()) {
      return filteredNonTeachingStaff.slice(0, 5);
    }
    const q = staffSearchQuery.toLowerCase().trim();
    return filteredNonTeachingStaff.filter(s =>
      `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(q) ||
      (s.empId || '').toLowerCase().includes(q) ||
      (s.phone || (s as any).mobileNumber || '').includes(q)
    );
  }, [filteredNonTeachingStaff, staffSearchQuery]);

  const [query, setQuery] = useState('');
  const [selectedAttendantFilter, setSelectedAttendantFilter] = useState(() => sessionStorage.getItem('tm_attendant_filter') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState<BusAttendantMaster | null>(null);
  const [deletingAttendant, setDeletingAttendant] = useState<BusAttendantMaster | null>(null);

  const handleAttendantFilterChange = (val: string) => {
    setSelectedAttendantFilter(val);
    sessionStorage.setItem('tm_attendant_filter', val);
  };

  const [form, setForm] = useState<Partial<BusAttendantMaster>>({
    employeeId: '',
    attendantName: '',
    mobileNumber: '',
    gender: '' as any,
    branch: (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All') ? selectedBranch : '',
    status: 'Active'
  });

  const filteredAttendants = uniqueAttendants.filter(a => {
    const matchesQuery = a.attendantName.toLowerCase().includes(query.toLowerCase()) ||
                         a.employeeId.toLowerCase().includes(query.toLowerCase()) ||
                         a.mobileNumber.toLowerCase().includes(query.toLowerCase());
    const matchesAttendant = selectedAttendantFilter === 'ALL' || a.id === selectedAttendantFilter;
    return matchesQuery && matchesAttendant;
  });

  const resolveCurrentAssignment = (attendant: BusAttendantMaster) =>
    vehicleAssignments.find(assignment => assignment.attendantId === attendant.id && assignment.status === 'Active') ||
    vehicleAssignments.find(assignment => assignment.attendantName === attendant.attendantName && assignment.status === 'Active');

  const handleOpenAdd = () => {
    setEditingAttendant(null);
    setForm({
      employeeId: '',
      attendantName: '',
      mobileNumber: '',
      gender: '' as any,
      branch: (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All') ? selectedBranch : '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: BusAttendantMaster) => {
    setEditingAttendant(a);
    setForm(a);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.attendantName || !form.employeeId || !form.mobileNumber) {
      addToast('warning', 'Validation Error', 'Please select a non-teaching staff member or provide employee details.');
      return;
    }
    if (!form.gender) {
      addToast('warning', 'Validation Error', 'Please select a gender.');
      return;
    }

    if (editingAttendant) {
      updateBusAttendant(editingAttendant.id, form);
      addToast('success', 'Bus Attendant Updated', `Updated details for ${form.attendantName}`);
    } else {
      addBusAttendant(form as Omit<BusAttendantMaster, 'id'>);
      addToast('success', 'Bus Attendant Registered', `Added ${form.attendantName} (${form.employeeId})`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-500" /> Bus Attendants
          </h2>
          </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Bus Attendant
          </button>
          <ExportButton 
            data={filteredAttendants} 
            filename={selectedAttendantFilter && selectedAttendantFilter !== 'ALL' 
              ? `attendant_${attendants.find(a => a.id === selectedAttendantFilter)?.attendantName.replace(/\s+/g, '_') || 'filtered'}` 
              : 'bus_attendants_directory'} 
          />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by attendant name, ID, or phone..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Filter by Attendant:</label>
          <select
            value={selectedAttendantFilter}
            onChange={e => handleAttendantFilterChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">-- Select Bus Attendant --</option>
            <option value="ALL">All Bus Attendants</option>
            {uniqueAttendants.map(a => (
              <option key={a.id} value={a.id}>
                {a.attendantName} ({a.employeeId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedAttendantFilter === '' ? (
        <div className="glass-card p-10 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-sm">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Please Select a Bus Attendant</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select an attendant from the dropdown above or click below to view all attendants.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleAttendantFilterChange('ALL')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              View All Bus Attendants
            </button>
          </div>
        </div>
      ) : filteredAttendants.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <p className="text-slate-400 text-xs font-bold">No bus attendants found matching your filter or search query.</p>
          <button
            onClick={() => { handleAttendantFilterChange('ALL'); setQuery(''); }}
            className="text-xs text-sky-600 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Attendant Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAttendants.map(a => {
          const currentAssignment = resolveCurrentAssignment(a);
          return (
            <div key={a.id} className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      {a.employeeId}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{a.attendantName}</h4>
                  </div>
                  <Badge variant={a.status === 'Active' ? 'success' : a.status === 'On Leave' ? 'warning' : 'neutral'}>{a.status}</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-400">Mobile Number:</span><span className="font-bold text-sky-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {a.mobileNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Gender:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{a.gender}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Branch:</span><span className="font-bold text-amber-600 dark:text-amber-400">{a.branch}</span></div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                      <Bus className="w-3 h-3 text-emerald-500" /> Current Assignment
                    </span>
                    {currentAssignment ? (
                      <>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Bus:</span><span className="font-bold text-slate-900 dark:text-white">{currentAssignment.vehicleNumber}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Route:</span><span className="font-semibold text-sky-600 text-right">{currentAssignment.routeName}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Status:</span><span className="font-bold text-emerald-600">{currentAssignment.status}</span></div>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-500">No active assignment</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified ERP Staff</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingAttendant(a)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAttendant ? 'Edit Bus Attendant' : 'Register Attendant'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {!editingAttendant && (
                <div className="relative">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Select Attendant from Non-Teaching Staff</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {filteredNonTeachingStaff.length} attendant(s) available
                    </span>
                  </label>

                  {/* Dropdown Trigger Box */}
                  <div
                    onClick={() => setIsStaffDropdownOpen(prev => !prev)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
                  >
                    {form.employeeId ? (
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {form.attendantName} ({form.employeeId})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm(prev => ({
                              ...prev,
                              employeeId: '',
                              attendantName: '',
                              mobileNumber: '',
                              gender: '' as any,
                              branch: (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All') ? selectedBranch : ''
                            }));
                            setStaffSearchQuery('');
                          }}
                          className="text-slate-400 hover:text-rose-500 p-0.5 rounded text-xs"
                          title="Clear selection"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">
                        -- Choose Attendant from Non-Teaching Staff --
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isStaffDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Dropdown Menu Popover */}
                  {isStaffDropdownOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 space-y-2 animate-in fade-in">
                      {/* Search Bar inside Dropdown */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search by attendant name, Emp ID, or phone..."
                          value={staffSearchQuery}
                          onChange={e => setStaffSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Filtered Attendant List */}
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {searchedStaff.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            {filteredNonTeachingStaff.length === 0
                              ? "No unassigned attendants found in Non-Teaching Staff."
                              : "No attendants match your search."}
                          </div>
                        ) : (
                          searchedStaff.map(s => {
                            const isSelected = form.employeeId === (s.empId || (s as any).employeeId);
                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  setForm(prev => ({
                                    ...prev,
                                    employeeId: s.empId || (s as any).employeeId || '',
                                    attendantName: `${s.firstName} ${s.lastName || ''}`.trim(),
                                    mobileNumber: s.phone || (s as any).mobileNumber || '',
                                    gender: (s.gender as any) || prev.gender,
                                    branch: s.branch || (s as any).branchName || prev.branch || selectedBranch || ''
                                  }));
                                  setIsStaffDropdownOpen(false);
                                  setStaffSearchQuery('');
                                }}
                                className={`p-2 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {s.firstName} {s.lastName || ''}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {s.empId || (s as any).employeeId} • {s.designation || 'Attendant'} • {s.phone || (s as any).mobileNumber || 'No phone'}
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                                    Selected
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer Info showing initial 5 / total count */}
                      {!staffSearchQuery && filteredNonTeachingStaff.length > 5 && (
                        <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
                          Showing top 5 of {filteredNonTeachingStaff.length} attendants. Use search to find others.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employee ID <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input type="text" required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Attendant Full Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input type="text" required value={form.attendantName} onChange={e => setForm({ ...form, attendantName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Mobile Number <span className="text-rose-500 font-bold ml-0.5">*</span></label><input type="text" required value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
                <div>
                  <label className="block font-semibold mb-1">Gender <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none cursor-pointer">
                    <option value="">Select Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>


              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingAttendant}
        onCancel={() => setDeletingAttendant(null)}
        onConfirm={() => {
          if (deletingAttendant) {
            deleteBusAttendant(deletingAttendant.id);
            addToast('info', 'Bus Attendant Removed');
            setDeletingAttendant(null);
          }
        }}
        title="Remove Bus Attendant"
        message={`Are you sure you want to remove ${deletingAttendant?.attendantName}?`}
      />
    </div>
  );
};
