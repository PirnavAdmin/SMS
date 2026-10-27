import React, { useState } from 'react';
import { UserCheck, Plus, Search, Edit, Trash2, Phone, ShieldCheck, Bus, ChevronDown, AlertCircle } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { BusAttendantMaster, initialBusAttendants } from './transportData';
import { validatePhoneNumber, sanitizePhoneInput } from '../../../utils/validation';
export type { BusAttendantMaster };      // re-export type for backward compat
export { initialBusAttendants };          // re-export value for backward compat

// BusAttendantMaster type and initialBusAttendants are now in transportData.ts

export const BusAttendantMasterView: React.FC = () => {
  const {
    staff = [],
    vehicleAssignments = [],
    branches = [],
    busAttendants: attendants = [],
    addBusAttendant,
    updateBusAttendant,
    deleteBusAttendant,
    updateStaff
  } = useData();
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

  // Dynamic branch options derived from active branches and current selection
  const branchOptions = React.useMemo(() => {
    const list: string[] = (branches || [])
      .map((b: any) => (typeof b === 'string' ? b : (b.branchName || b.name || '')).trim())
      .filter((b: string) => b && !b.toLowerCase().startsWith('all'));
    if (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All' && selectedBranch !== 'All Campuses' && !list.includes(selectedBranch)) {
      list.push(selectedBranch);
    }
    if (list.length === 0) {
      list.push('Madhapur Branch');
    }
    return Array.from(new Set(list));
  }, [branches, selectedBranch]);

  // Dynamically resolve attendant branch across record, assignment, staff directory, and active context
  const resolveAttendantBranch = React.useCallback((attendant: BusAttendantMaster, currentAssignment?: any): string => {
    // 1. Attendant's own branch property if valid
    const attBranch = (attendant?.branch || '').trim();
    if (attBranch && !attBranch.toLowerCase().startsWith('all')) {
      return attBranch;
    }

    // 2. Active assignment branch
    const asgnBranch = (currentAssignment?.branch || '').trim();
    if (asgnBranch && !asgnBranch.toLowerCase().startsWith('all')) {
      return asgnBranch;
    }

    // 3. Any vehicle assignment matching this attendant
    const matchAsgn = vehicleAssignments.find(asgn => {
      const matchId = asgn.attendantId && asgn.attendantId === attendant?.id;
      const matchEmp = attendant?.employeeId && asgn.attendantEmployeeId && asgn.attendantEmployeeId.toLowerCase() === attendant.employeeId.toLowerCase();
      const matchName = attendant?.attendantName && asgn.attendantName && asgn.attendantName.toLowerCase() === attendant.attendantName.toLowerCase();
      return matchId || matchEmp || matchName;
    });
    if (matchAsgn?.branch?.trim() && !matchAsgn.branch.trim().toLowerCase().startsWith('all')) {
      return matchAsgn.branch.trim();
    }

    // 4. Linked staff member from directory
    const empId = (attendant?.employeeId || '').trim().toLowerCase();
    const name = (attendant?.attendantName || '').trim().toLowerCase();
    const matchedStaff = staff.find(s => {
      const sEmp = (s.empId || (s as any).employeeId || '').trim().toLowerCase();
      if (empId && sEmp && sEmp === empId) return true;
      if (s.id && (String(s.id) === String(attendant?.id) || `staff-${s.id}` === String(attendant?.id))) return true;
      const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      if (name && sName && sName === name) return true;
      return false;
    });

    const staffBranch = (matchedStaff?.branch || (matchedStaff as any)?.branchName || (matchedStaff as any)?.campus || (matchedStaff as any)?.branchCampus || '').trim();
    if (staffBranch && !staffBranch.toLowerCase().startsWith('all')) {
      return staffBranch;
    }

    // 5. Selected branch from Auth context if set
    if (selectedBranch && selectedBranch.trim() !== '' && selectedBranch !== 'All Branches' && selectedBranch !== 'All' && selectedBranch !== 'All Campuses') {
      return selectedBranch.trim();
    }

    // 6. First active branch from branches list in data context
    const firstBranch = (branches || [])
      .map((b: any) => (typeof b === 'string' ? b : (b.branchName || b.name || '')).trim())
      .filter((b: string) => b && !b.toLowerCase().startsWith('all'))[0];
    if (firstBranch) {
      return firstBranch;
    }

    // 7. Fallback default
    return 'Madhapur Branch';
  }, [branches, selectedBranch, staff, vehicleAssignments]);

  const [form, setForm] = useState<Partial<BusAttendantMaster>>({
    employeeId: '',
    attendantName: '',
    mobileNumber: '',
    gender: '' as any,
    branch: (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All' && selectedBranch !== 'All Campuses') ? selectedBranch : (branches?.[0]?.name || (branches?.[0] as any)?.branchName || 'Madhapur Branch'),
    status: 'Active'
  });

  const [formErrors, setFormErrors] = useState<{
    attendantName?: string;
    employeeId?: string;
    mobileNumber?: string;
    gender?: string;
  }>({});

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

  const validateForm = (): typeof formErrors => {
    const errs: typeof formErrors = {};

    if (!form.attendantName?.trim() || !form.employeeId?.trim()) {
      errs.attendantName = 'Please select an attendant from the Staff Directory.';
      errs.employeeId = 'Employee ID is required from Staff Directory.';
    }
    if (!form.gender) {
      errs.gender = 'Please select a gender.';
    }

    const phoneCheck = validatePhoneNumber(form.mobileNumber || '', true);
    if (!phoneCheck.isValid) {
      errs.mobileNumber = phoneCheck.error || 'Enter a valid 10-digit mobile number.';
    }

    return errs;
  };

  const handleOpenAdd = () => {
    setEditingAttendant(null);
    setFormErrors({});
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
    setFormErrors({});
    setForm(a);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      addToast('error', 'Validation Error', errs.mobileNumber || 'Please correct the highlighted fields.');
      return;
    }

    if (editingAttendant) {
      updateBusAttendant(editingAttendant.id, form);

      // Direct sync to Faculty & Staff Directory
      const targetEmpId = (form.employeeId || editingAttendant.employeeId || '').trim().toLowerCase();
      const targetName = (form.attendantName || editingAttendant.attendantName || '').trim().toLowerCase();
      const matched = staff.find(s => {
        const sEmp = (s.empId || (s as any).employeeId || '').trim().toLowerCase();
        if (targetEmpId && sEmp && sEmp === targetEmpId) return true;
        if (s.id && String(s.id) === String(editingAttendant.id)) return true;
        const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
        if (targetName && sName && sName === targetName) return true;
        return false;
      });

      if (matched && updateStaff) {
        const parts = (form.attendantName || '').trim().split(/\s+/);
        updateStaff(matched.id, {
          phone: form.mobileNumber,
          mobileNumber: form.mobileNumber,
          gender: form.gender,
          ...(parts[0] ? { firstName: parts[0], lastName: parts.slice(1).join(' ') || '' } : {}),
          status: form.status === 'Active' ? 'Active' : 'Inactive'
        } as any);
      }

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
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by attendant name, ID, or phone..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
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
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">Mobile Number:</span>
                    <span className="font-bold text-sky-600 flex items-center gap-1 font-mono truncate max-w-[13rem]" title={a.mobileNumber}>
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{a.mobileNumber}</span>
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-400">Gender:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{a.gender}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Branch:</span><span className="font-bold text-amber-600 dark:text-amber-400">{resolveAttendantBranch(a, currentAssignment)}</span></div>
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
                              branch: (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All' && selectedBranch !== 'All Campuses') ? selectedBranch : (branchOptions[0] || 'Madhapur Branch')
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
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                                  const rawPhone = s.phone || (s as any).mobileNumber || '';
                                  const sanitizedPhone = sanitizePhoneInput(rawPhone);
                                  setForm(prev => ({
                                    ...prev,
                                    employeeId: s.empId || (s as any).employeeId || '',
                                    attendantName: `${s.firstName} ${s.lastName || ''}`.trim(),
                                    mobileNumber: sanitizedPhone,
                                    gender: (s.gender as any) || prev.gender,
                                    branch: s.branch || (s as any).branchName || prev.branch || selectedBranch || ''
                                  }));
                                  setFormErrors({});
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Employee ID <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Staff Directory
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    disabled
                    tabIndex={-1}
                    placeholder="Select attendant from Staff Directory above"
                    value={form.employeeId || ''}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed outline-none select-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Defaulted from Staff Directory (cannot be edited here)</p>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Attendant Full Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Staff Directory
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  tabIndex={-1}
                  placeholder="Select attendant from Staff Directory above"
                  value={form.attendantName || ''}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Defaulted from Staff Directory (cannot be edited here)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Mobile Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Staff Directory
                    </span>
                  </div>
                  <input
                    type="tel"
                    readOnly
                    disabled
                    tabIndex={-1}
                    placeholder="Select attendant from Staff Directory above"
                    value={form.mobileNumber || ''}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed outline-none select-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Defaulted from Staff Directory (cannot be edited here)</p>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Gender <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={form.gender || ''}
                    onChange={e => {
                      setForm({ ...form, gender: e.target.value as any });
                      if (formErrors.gender) setFormErrors(prev => ({ ...prev, gender: undefined }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none cursor-pointer font-bold text-slate-900 dark:text-white ${
                      formErrors.gender ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20' : ''
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.gender && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{formErrors.gender}</span>
                    </p>
                  )}
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
