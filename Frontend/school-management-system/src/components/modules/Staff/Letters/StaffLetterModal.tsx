import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Award,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Edit3,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  Building2,
  User,
  Sparkles,
  Search,
  ChevronDown,
  Check,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Staff } from '../../../../types';
import { StaffLetterPayload, StaffLetterType, GeneratedStaffLetterRecord } from '../../../../types/staffLetter';
import { useData } from '../../../../context/DataContext';
import { useToast } from '../../../../context/ToastContext';
import { PrintableStaffLetter } from './PrintableStaffLetter';
import {
  calculateSalaryBreakdown,
  getDefaultLetterPayload,
  saveStaffLetterRecord,
  DEFAULT_OFFER_TERMS
} from '../../../../utils/staffLetterTemplates';

interface StaffLetterModalProps {
  staff: Staff;
  initialType?: StaffLetterType;
  isOpen: boolean;
  onClose: () => void;
  existingRecord?: GeneratedStaffLetterRecord;
  readOnly?: boolean;
  onNavigate?: (module: string) => void;
}

export const StaffLetterModal: React.FC<StaffLetterModalProps> = ({
  staff,
  initialType = 'offer',
  isOpen,
  onClose,
  existingRecord,
  readOnly = false,
  onNavigate,
}) => {
  const { staff: allStaff = [], schoolProfile, updateStaff } = useData();
  const { addToast } = useToast();

  const effectiveStaffList = useMemo(() => {
    if (allStaff && allStaff.length > 0) return allStaff;
    return [staff].filter(Boolean);
  }, [allStaff, staff]);

  const [currentStaff, setCurrentStaff] = useState<Staff>(() => {
    return staff || (effectiveStaffList.length > 0 ? effectiveStaffList[0] : ({} as Staff));
  });
  const [staffCategoryFilter, setStaffCategoryFilter] = useState<'all' | 'teaching' | 'non-teaching'>('all');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const staffDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (staff) {
      setCurrentStaff(staff);
    } else if (effectiveStaffList.length > 0 && !currentStaff?.id) {
      setCurrentStaff(effectiveStaffList[0]);
    }
  }, [staff, effectiveStaffList]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target as Node)) {
        setIsStaffDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTeaching = (s: Staff) => {
    const cat = (s.employeeCategory || (s as any).category || (s as any).staffCategory || '').toLowerCase();
    const role = (s.role || '').toLowerCase();
    const des = (s.designation || '').toLowerCase();
    const dept = (s.department || '').toLowerCase();

    if (cat.includes('non-teaching') || cat.includes('non teaching')) return false;
    if (
      role.includes('driver') ||
      role.includes('conductor') ||
      role.includes('attendant') ||
      role.includes('security') ||
      role.includes('peon') ||
      role.includes('accountant') ||
      des.includes('driver') ||
      des.includes('conductor') ||
      des.includes('attendant') ||
      des.includes('security') ||
      des.includes('peon') ||
      des.includes('accountant')
    ) {
      return false;
    }

    return (
      cat.includes('teach') ||
      role === 'teacher' ||
      role === 'principal' ||
      role === 'vice principal' ||
      role === 'vice-principal' ||
      role === 'hod' ||
      des.includes('teacher') ||
      des.includes('principal') ||
      des.includes('faculty') ||
      des.includes('lecturer') ||
      des.includes('instructor') ||
      des.includes('professor') ||
      dept.includes('academic') ||
      dept.includes('teach')
    );
  };

  const filteredStaffList = useMemo(() => {
    return effectiveStaffList.filter((s) => {
      if (staffCategoryFilter === 'teaching' && !isTeaching(s)) return false;
      if (staffCategoryFilter === 'non-teaching' && isTeaching(s)) return false;

      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.toLowerCase().trim();
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const empId = (s.empId || s.id || '').toLowerCase();
        return fullName.includes(q) || empId.includes(q);
      }

      return true;
    });
  }, [effectiveStaffList, staffCategoryFilter, staffSearchQuery]);

  const getGlobalSignature = () => {
    try {
      const direct = localStorage.getItem('edu_db_global_signatory_signature');
      if (direct) return direct;
      const saved = localStorage.getItem('edu_db_global_letter_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.signatureImageUrl) return parsed.signatureImageUrl;
      }
    } catch (e) {}
    return (schoolProfile as any)?.signature || (schoolProfile as any)?.principalSignature || '';
  };

  const [activeType, setActiveType] = useState<StaffLetterType>(
    existingRecord ? existingRecord.letterType : initialType
  );
  const [activeView, setActiveView] = useState<'preview' | 'edit'>('preview');

  const [payload, setPayload] = useState<StaffLetterPayload>(() => {
    const globalSig = getGlobalSignature();
    if (existingRecord) {
      const pl = { ...existingRecord.payload };
      if (!pl.signatureImageUrl && globalSig) pl.signatureImageUrl = globalSig;
      return pl;
    }
    const defaultPl = getDefaultLetterPayload(initialType, currentStaff || staff, schoolProfile);
    if (!defaultPl.signatureImageUrl && globalSig) defaultPl.signatureImageUrl = globalSig;
    return defaultPl;
  });

  useEffect(() => {
    if (isOpen) {
      const globalSig = getGlobalSignature();
      if (existingRecord) {
        setActiveType(existingRecord.letterType);
        const pl = { ...existingRecord.payload };
        if (!pl.signatureImageUrl && globalSig) pl.signatureImageUrl = globalSig;
        setPayload(pl);
      } else if (staff) {
        setCurrentStaff(staff);
        setActiveType(initialType);
        const defaultPl = getDefaultLetterPayload(initialType, staff, schoolProfile);
        if (!defaultPl.signatureImageUrl && globalSig) defaultPl.signatureImageUrl = globalSig;
        setPayload(defaultPl);
      }
    }
  }, [isOpen, existingRecord, staff, initialType, schoolProfile]);

  const handleStaffSelect = (selectedId: string) => {
    const found = effectiveStaffList.find(
      (s) => String(s.id) === String(selectedId) || String(s.empId) === String(selectedId)
    );
    if (found) {
      setCurrentStaff(found);
      const globalSig = getGlobalSignature();
      const pl = getDefaultLetterPayload(activeType, found, schoolProfile);
      if (payload.signatureImageUrl) {
        pl.signatureImageUrl = payload.signatureImageUrl;
      } else if (globalSig) {
        pl.signatureImageUrl = globalSig;
      }
      setPayload(pl);
    }
  };

  // When activeType changes and not existing record, recalculate default payload
  const handleTypeChange = (newType: StaffLetterType) => {
    setActiveType(newType);
    if (!existingRecord) {
      const globalSig = getGlobalSignature();
      const pl = getDefaultLetterPayload(newType, currentStaff, schoolProfile);
      if (payload.signatureImageUrl) {
        pl.signatureImageUrl = payload.signatureImageUrl;
      } else if (globalSig) {
        pl.signatureImageUrl = globalSig;
      }
      setPayload(pl);
    }
  };

  const handleSalaryChange = (newMonthly: number) => {
    const breakdown = calculateSalaryBreakdown(newMonthly);
    setPayload((prev) => ({
      ...prev,
      salaryBreakdown: breakdown,
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAndIssue = () => {
    const targetStaff = currentStaff || staff;
    const recordId = existingRecord ? existingRecord.id : `LTR-${Date.now()}-${targetStaff.id || targetStaff.empId || '01'}`;
    const newRecord: GeneratedStaffLetterRecord = {
      id: recordId,
      letterNumber: payload.refNo,
      letterType: activeType,
      staffId: targetStaff.id || '',
      staffEmpId: targetStaff.empId || '',
      staffName: payload.candidateName,
      designation: payload.designation,
      department: payload.department,
      branch: payload.branch,
      issueDate: payload.issueDate,
      generatedBy: 'Institutional HR Administration',
      status: 'Issued',
      payload: payload,
    };

    saveStaffLetterRecord(newRecord);

    // Also link into staff documents array if updateStaff is available
    if (updateStaff && targetStaff.id) {
      const docTitle =
        activeType === 'offer'
          ? `Offer & Appointment Letter (${payload.refNo})`
          : activeType === 'relieving'
          ? `Relieving Order & Clearance (${payload.refNo})`
          : `Service & Experience Certificate (${payload.refNo})`;

      const existingDocs = targetStaff.documents || [];
      const isAlreadyInDocs = existingDocs.some((d) => d.documentNumber === payload.refNo);

      if (!isAlreadyInDocs) {
        const newDoc = {
          id: `DOC-LTR-${Date.now()}`,
          title: docTitle,
          type: activeType === 'offer' ? 'Appointment Letter' : 'Experience Certificate',
          fileUrl: '',
          uploadedDate: payload.issueDate,
          documentNumber: payload.refNo,
          verificationStatus: 'Verified' as const,
          category: 'Institutional Letters',
        };
        updateStaff(targetStaff.id, {
          documents: [newDoc, ...existingDocs],
        });
      }
    }

    addToast(
      'success',
      `${activeType === 'offer' ? 'Offer Letter' : activeType === 'relieving' ? 'Relieving Letter' : 'Experience Certificate'} Issued`,
      `Successfully generated official document (Ref: ${payload.refNo}) for ${payload.candidateName}.`
    );

    // Close modal and redirect to letters management screen
    onClose();
    if (onNavigate) {
      onNavigate('staff-letters');
    }
    window.dispatchEvent(new CustomEvent('navigate_module', { detail: 'staff-letters' }));
  };

  if (!isOpen) return null;

  const isViewMode = readOnly || !!existingRecord;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
                {isViewMode
                  ? (activeType === 'offer'
                      ? 'Official Offer Letter'
                      : activeType === 'relieving'
                      ? 'Official Relieving Letter'
                      : 'Official Experience Certificate')
                  : (activeType === 'offer'
                      ? 'Generate Offer Letter'
                      : activeType === 'relieving'
                      ? 'Generate Relieving Letter'
                      : 'Generate Experience Certificate')}
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {activeType === 'experience' ? 'CERTIFICATE' : `${activeType.toUpperCase()} LETTER`}
                </span>
              </h2>

              {isViewMode ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="hidden sm:inline">•</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{payload.candidateName}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{payload.refNo}</span>
                </div>
              ) : (
                /* Searchable Staff Dropdown Trigger */
                effectiveStaffList.length > 0 && (
                  <div className="relative" ref={staffDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white transition-all cursor-pointer shadow-2xs"
                    >
                      <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span className="max-w-[180px] sm:max-w-[220px] truncate">
                        {currentStaff?.firstName ? `${currentStaff.firstName} ${currentStaff.lastName || ''} (${currentStaff.empId || currentStaff.id})` : 'Select Staff Member'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isStaffDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu Popover with Category Filter + Search inside */}
                    {isStaffDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                        {/* Category Filter Pills */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold">
                          <button
                            type="button"
                            onClick={() => setStaffCategoryFilter('all')}
                            className={`flex-1 py-1 rounded-md transition-all text-center cursor-pointer ${
                              staffCategoryFilter === 'all'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-black shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            All ({effectiveStaffList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffCategoryFilter('teaching')}
                            className={`flex-1 py-1 rounded-md transition-all text-center cursor-pointer ${
                              staffCategoryFilter === 'teaching'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-black shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            Teaching
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffCategoryFilter('non-teaching')}
                            className={`flex-1 py-1 rounded-md transition-all text-center cursor-pointer ${
                              staffCategoryFilter === 'non-teaching'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-black shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            Non-Teaching
                          </button>
                        </div>

                        {/* Search input inside dropdown */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search name or ID..."
                            value={staffSearchQuery}
                            onChange={(e) => setStaffSearchQuery(e.target.value)}
                            autoFocus
                            className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500 placeholder:text-slate-400"
                          />
                          {staffSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setStaffSearchQuery('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Staff List */}
                        <div className="max-h-56 overflow-y-auto no-scrollbar space-y-0.5">
                          {filteredStaffList.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400 font-medium">
                              No matching staff found
                            </div>
                          ) : (
                            filteredStaffList.map((s) => {
                              const isSelected = String(currentStaff?.id) === String(s.id) || String(currentStaff?.empId) === String(s.empId);
                              return (
                                <button
                                  key={s.id || s.empId}
                                  type="button"
                                  onClick={() => {
                                    handleStaffSelect(s.id || s.empId || '');
                                    setIsStaffDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-black'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <span>{s.firstName} {s.lastName} ({s.empId || s.id})</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!isViewMode && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveView('preview')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'preview'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('edit')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'edit'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Configure
                </button>
              </div>
            )}

            {/* Print Icon Button */}
            <button
              type="button"
              onClick={handlePrint}
              title="Print / PDF Document"
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all cursor-pointer flex items-center justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Letter Type Switcher & Save (Only when generating new document) */}
        {!isViewMode && (
          <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              {[
                { id: 'offer', label: 'Offer & Appointment Letter', icon: FileText },
                { id: 'relieving', label: 'Relieving Order & Clearance', icon: ShieldCheck },
                { id: 'experience', label: 'Service & Experience Certificate', icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleTypeChange(tab.id as StaffLetterType)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-[#0088cc] dark:text-sky-400 shadow-xs border border-sky-300 dark:border-sky-800 font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSaveAndIssue}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Save & Issue Record
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
          {activeView === 'preview' || isViewMode ? (
            <div className="flex justify-center pb-8">
              <PrintableStaffLetter
                type={activeType}
                payload={payload}
                schoolProfile={schoolProfile}
              />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4 pb-8 text-xs">
              {/* Target Employee Switcher */}
              {!readOnly && !existingRecord && effectiveStaffList.length > 0 && (
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-sky-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-600" /> Target Employee Selection
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold">Auto-fills employee records & salary</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category Filter Pills */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setStaffCategoryFilter('all')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          staffCategoryFilter === 'all'
                            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-black shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        All Staff ({effectiveStaffList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffCategoryFilter('teaching')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          staffCategoryFilter === 'teaching'
                            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-black shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Teaching Staff
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffCategoryFilter('non-teaching')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          staffCategoryFilter === 'non-teaching'
                            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-black shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Non-Teaching Staff
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <select
                      value={currentStaff?.id || currentStaff?.empId || ''}
                      onChange={(e) => handleStaffSelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                    >
                      {filteredStaffList.map((s) => (
                        <option key={s.id || s.empId} value={s.id || s.empId}>
                          {s.firstName} {s.lastName} ({s.empId || s.id})
                        </option>
                      ))}
                      {filteredStaffList.length === 0 && (
                        <option value="" disabled>No staff matches the filter criteria</option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* General Reference & Metadata */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                  <FileText className="w-4 h-4 text-sky-600" /> Reference & Header Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={payload.refNo}
                      onChange={(e) => setPayload({ ...payload, refNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={payload.issueDate}
                      onChange={(e) => setPayload({ ...payload, issueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Campus / Branch
                    </label>
                    <input
                      type="text"
                      value={payload.branch}
                      onChange={(e) => setPayload({ ...payload, branch: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Employee Information */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                  <User className="w-4 h-4 text-sky-600" /> Employee & Role Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={payload.candidateName}
                      onChange={(e) => setPayload({ ...payload, candidateName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={payload.empId || ''}
                      onChange={(e) => setPayload({ ...payload, empId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={payload.designation}
                      onChange={(e) => setPayload({ ...payload, designation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={payload.department}
                      onChange={(e) => setPayload({ ...payload, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Residential / Present Address
                    </label>
                    <input
                      type="text"
                      value={payload.address || ''}
                      onChange={(e) => setPayload({ ...payload, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Offer-Specific Terms & Salary */}
              {activeType === 'offer' && (
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Compensation & Appointment Terms
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Gross Monthly Salary (₹)
                      </label>
                      <input
                        type="number"
                        value={payload.salaryBreakdown?.grossMonthly || 0}
                        onChange={(e) => handleSalaryChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        value={payload.joiningDate}
                        onChange={(e) => setPayload({ ...payload, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Probation Period (Months)
                      </label>
                      <input
                        type="number"
                        value={payload.probationMonths || 6}
                        onChange={(e) => setPayload({ ...payload, probationMonths: parseInt(e.target.value, 10) || 6 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Relieving-Specific Terms */}
              {(activeType === 'relieving' || activeType === 'experience') && (
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-rose-600" /> Relieving & Service Assessment
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Date of Joining
                      </label>
                      <input
                        type="date"
                        value={payload.joiningDate}
                        onChange={(e) => setPayload({ ...payload, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Relieving Date / Last Working Date
                      </label>
                      <input
                        type="date"
                        value={payload.relievingDate || payload.issueDate}
                        onChange={(e) => setPayload({ ...payload, relievingDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                        Conduct & Performance Rating
                      </label>
                      <select
                        value={payload.conductRating || 'Exemplary'}
                        onChange={(e) => setPayload({ ...payload, conductRating: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="Exemplary">Exemplary</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Satisfactory">Satisfactory</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={payload.noDuesCleared ?? true}
                          onChange={(e) => setPayload({ ...payload, noDuesCleared: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>No Dues & Asset Clearance Completed</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Signatory Settings */}
              <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                  <Building2 className="w-4 h-4 text-sky-600" /> Authorized Signatory
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Signatory Name
                    </label>
                    <input
                      type="text"
                      value={payload.authorizedSignatoryName}
                      onChange={(e) => setPayload({ ...payload, authorizedSignatoryName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1">
                      Signatory Designation / Title
                    </label>
                    <input
                      type="text"
                      value={payload.authorizedSignatoryTitle}
                      onChange={(e) => setPayload({ ...payload, authorizedSignatoryTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                {/* Digital Signature / Stamp Upload */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase mb-1.5">
                    Authorized Signatory Signature / Official Stamp Image
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-24 h-14 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                      {payload.signatureImageUrl ? (
                        <img
                          src={payload.signatureImageUrl}
                          alt="Signature Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon className="w-5 h-5 mx-auto stroke-1" />
                          <span className="text-[9px] font-bold block mt-0.5">No Signature</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <p className="text-[11px] text-slate-500">
                        Upload authorized digital signature or official seal (PNG, JPG, WEBP, max 5MB). Replaces the default seal placeholder on this letter.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <label className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          {payload.signatureImageUrl ? 'Change Signature' : 'Upload Signature'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!file.type.startsWith('image/')) {
                                addToast('error', 'Invalid File', 'Please select an image file (PNG, JPG, WEBP, SVG).');
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                addToast('error', 'File Too Large', 'Signature image must be under 5MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const result = ev.target?.result as string;
                                if (result) {
                                  setPayload((prev) => ({ ...prev, signatureImageUrl: result }));
                                  try {
                                    localStorage.setItem('edu_db_global_signatory_signature', result);
                                    const currentSettings = localStorage.getItem('edu_db_global_letter_settings');
                                    const parsed = currentSettings ? JSON.parse(currentSettings) : {};
                                    parsed.signatureImageUrl = result;
                                    localStorage.setItem('edu_db_global_letter_settings', JSON.stringify(parsed));
                                    window.dispatchEvent(new CustomEvent('global_signature_updated', { detail: result }));
                                  } catch (err) {}
                                  addToast('success', 'Signature Loaded', 'Signature applied and saved globally.');
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        {payload.signatureImageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayload((prev) => ({ ...prev, signatureImageUrl: '' }));
                              addToast('info', 'Signature Removed', 'Custom signature removed.');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
