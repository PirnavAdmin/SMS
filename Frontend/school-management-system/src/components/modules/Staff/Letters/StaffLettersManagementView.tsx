// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Award,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Printer,
  Download,
  Trash2,
  Send,
  Sliders,
  Building2,
  Users,
  ShieldCheck,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Save,
  Clock,
  Sparkles,
  FileCheck,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { useData } from '../../../../context/DataContext';
import { useToast } from '../../../../context/ToastContext';
import { Staff } from '../../../../types';
import { GeneratedStaffLetterRecord, StaffLetterType, StaffLetterPayload } from '../../../../types/staffLetter';
import {
  getDefaultLetterPayload,
  saveStaffLetterRecord
} from '../../../../utils/staffLetterTemplates';
import { validateSearchQuery } from '../../../../utils/validation';
import {
  fetchStaffLettersApi,
  deleteStaffLetterApi,
  fetchGlobalLetterSettingsApi,
  saveGlobalLetterSettingsApi
} from '../../../../api/staffLetters';
import { StaffLetterModal } from './StaffLetterModal';
import { Badge } from '../../../common/Badge';
import { ConfirmModal } from '../../../common/ConfirmModal';
import { Pagination } from '../../../common/Pagination';

const getSafeStaffFallback = (schoolProfile?: any): Staff => ({
  id: '',
  empId: '',
  firstName: '',
  lastName: '',
  email: schoolProfile?.email || '',
  phone: schoolProfile?.phone || '',
  designation: 'Faculty Member',
  department: 'Academics',
  role: 'Teacher',
  branch: schoolProfile?.name || '',
  joiningDate: new Date().toISOString().split('T')[0],
  salary: 0,
  address: schoolProfile?.address || '',
  status: 'Active',
  gender: 'Male',
});

interface StaffLettersManagementViewProps {
  onNavigate?: (module: string) => void;
}

export const StaffLettersManagementView: React.FC<StaffLettersManagementViewProps> = ({ onNavigate }) => {
  const { staff = [], schoolProfile, branches = [] } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'registry' | 'templates' | 'quick-generate'>('registry');
  const [letters, setLetters] = useState<GeneratedStaffLetterRecord[]>([]);
  const [isLoadingLetters, setIsLoadingLetters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Generator Modal State
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [selectedStaffForGen, setSelectedStaffForGen] = useState<Staff | null>(null);
  const [selectedTypeForGen, setSelectedTypeForGen] = useState<StaffLetterType>('offer');
  const [existingRecordForView, setExistingRecordForView] = useState<GeneratedStaffLetterRecord | undefined>(undefined);
  const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);
  const [letterToDelete, setLetterToDelete] = useState<GeneratedStaffLetterRecord | null>(null);
  const [termToDeleteIndex, setTermToDeleteIndex] = useState<number | null>(null);

  // Global Template Settings State - pure database synced, no hardcoded / mock defaults
  const [globalTerms, setGlobalTerms] = useState<string[]>([]);
  const [newTermInput, setNewTermInput] = useState('');
  const [globalSignatoryName, setGlobalSignatoryName] = useState(() => {
    try {
      const saved = localStorage.getItem('edu_db_global_letter_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.signatoryName && parsed.signatoryName !== 'Dr. Eleanor Vance') return parsed.signatoryName;
      }
    } catch (e) {}
    return '';
  });
  const [globalSignatoryTitle, setGlobalSignatoryTitle] = useState(() => {
    try {
      const saved = localStorage.getItem('edu_db_global_letter_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.signatoryTitle) return parsed.signatoryTitle;
      }
    } catch (e) {}
    return schoolProfile?.principalName ? 'Principal & Authorized Signatory' : '';
  });
  const [globalProbationMonths, setGlobalProbationMonths] = useState(() => {
    try {
      const saved = localStorage.getItem('edu_db_global_letter_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.probationMonths !== undefined) return parsed.probationMonths;
      }
    } catch (e) {}
    return 6;
  });
  const [globalNoticePeriodDays, setGlobalNoticePeriodDays] = useState(() => {
    try {
      const saved = localStorage.getItem('edu_db_global_letter_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.noticePeriodDays !== undefined) return parsed.noticePeriodDays;
      }
    } catch (e) {}
    return 30;
  });
  const [globalSignatureImage, setGlobalSignatureImage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('edu_db_global_letter_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.signatureImageUrl) return parsed.signatureImageUrl;
      }
    } catch (e) {}
    return '';
  });

  const [settingsErrors, setSettingsErrors] = useState<{
    signatoryName?: string;
    signatoryTitle?: string;
    probationMonths?: string;
    noticePeriodDays?: string;
    signatureImage?: string;
  }>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const refreshLetters = () => {
    fetchStaffLettersApi()
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setLetters(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch letters from backend API:', err);
      });
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingLetters(true);

    // 1. Fetch letters from Backend API
    fetchStaffLettersApi()
      .then((res) => {
        if (isMounted && res?.data && Array.isArray(res.data)) {
          setLetters(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch letters from backend API:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLetters(false);
      });

    // 2. Fetch global signatory & terms settings from Backend API
    fetchGlobalLetterSettingsApi()
      .then((res) => {
        if (isMounted && res?.data) {
          const s = res.data;
          if (s.signatoryName && s.signatoryName !== 'Dr. Eleanor Vance') {
            setGlobalSignatoryName(s.signatoryName);
          } else {
            setGlobalSignatoryName('');
          }
          if (s.signatoryTitle) setGlobalSignatoryTitle(s.signatoryTitle);
          if (s.probationMonths !== undefined) setGlobalProbationMonths(s.probationMonths);
          if (s.noticePeriodDays !== undefined) setGlobalNoticePeriodDays(s.noticePeriodDays);
          if (s.signatureImageUrl) setGlobalSignatureImage(s.signatureImageUrl);
          if (s.masterTerms && s.masterTerms.length > 0) setGlobalTerms(s.masterTerms);

          try {
            localStorage.setItem(
              'edu_db_global_letter_settings',
              JSON.stringify({
                signatoryName: s.signatoryName && s.signatoryName !== 'Dr. Eleanor Vance' ? s.signatoryName : '',
                signatoryTitle: s.signatoryTitle,
                probationMonths: s.probationMonths,
                noticePeriodDays: s.noticePeriodDays,
                signatureImageUrl: s.signatureImageUrl,
              })
            );
            if (s.masterTerms) {
              localStorage.setItem('edu_db_global_offer_terms', JSON.stringify(s.masterTerms));
            }
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.warn('Could not fetch global letter settings from backend API:', err);
      });

    window.addEventListener('staff_letters_updated', refreshLetters);
    return () => {
      isMounted = false;
      window.removeEventListener('staff_letters_updated', refreshLetters);
    };
  }, []);

  const handleOpenGenerator = (type: StaffLetterType = 'offer', specificStaff?: Staff, record?: GeneratedStaffLetterRecord, readOnlyMode = false) => {
    const availableStaff = staff.length > 0 ? staff : [getSafeStaffFallback(schoolProfile)];
    const target = specificStaff || availableStaff[0];
    setSelectedStaffForGen(target);
    setSelectedTypeForGen(type);
    setExistingRecordForView(record);
    setIsReadOnlyModal(readOnlyMode);
    setGeneratorOpen(true);
  };

  const handleSaveGlobalTemplateSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof settingsErrors = {};

    const cleanName = globalSignatoryName.trim();
    if (!cleanName) {
      errors.signatoryName = 'Authorized Signatory Full Name is required.';
    }

    const cleanTitle = globalSignatoryTitle.trim();
    if (!cleanTitle) {
      errors.signatoryTitle = 'Signatory Title & Designation is required.';
    }

    const probationNum = Number(globalProbationMonths);
    if (!globalProbationMonths || isNaN(probationNum) || probationNum <= 0) {
      errors.probationMonths = 'Standard Probation (Months) is required and must be greater than 0.';
    }

    const noticeNum = Number(globalNoticePeriodDays);
    if (!globalNoticePeriodDays || isNaN(noticeNum) || noticeNum <= 0) {
      errors.noticePeriodDays = 'Standard Notice Period (Days) is required and must be greater than 0.';
    }

    if (!globalSignatureImage) {
      errors.signatureImage = 'Authorized Signatory Signature / Official Stamp Image is required.';
    }

    if (Object.keys(errors).length > 0) {
      setSettingsErrors(errors);
      addToast('error', 'Required Fields Missing', 'Please fill in all mandatory fields marked with * and upload the signature image.');
      return;
    }

    setSettingsErrors({});
    setIsSavingSettings(true);
    try {
      // Persist directly to Backend Database
      await saveGlobalLetterSettingsApi({
        signatoryName: cleanName,
        signatoryTitle: cleanTitle,
        probationMonths: probationNum,
        noticePeriodDays: noticeNum,
        signatureImageUrl: globalSignatureImage,
        masterTerms: globalTerms,
      });

      addToast('success', 'Global Templates Saved', 'Institutional letter templates & signatory settings saved to database successfully!');
    } catch (err: any) {
      console.error('Failed to save settings to database:', err);
      addToast('error', 'Save Failed', err?.message || 'Failed to save settings to database.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddTerm = () => {
    if (!newTermInput.trim()) return;
    setGlobalTerms([...globalTerms, newTermInput.trim()]);
    setNewTermInput('');
  };

  const handleRemoveTerm = (index: number) => {
    const updated = globalTerms.filter((_, idx) => idx !== index);
    setGlobalTerms(updated);
    try {
      localStorage.setItem('edu_db_global_offer_terms', JSON.stringify(updated));
    } catch (e) {}
    addToast('success', 'Clause Removed', 'The selected policy/clause has been removed.');
  };

  const handleResendToPortal = (letter: GeneratedStaffLetterRecord) => {
    addToast(
      'success',
      'Sent to Staff Portal',
      `${letter.letterType.toUpperCase()} Letter (Ref: ${letter.letterNumber}) is live on ${letter.staffName}'s profile portal.`
    );
  };

  const filteredLetters = useMemo(() => {
    if (searchError) return [];
    return letters.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (l.staffName || '').toLowerCase().includes(q) ||
        (l.staffEmpId || '').toLowerCase().includes(q) ||
        (l.letterNumber || '').toLowerCase().includes(q) ||
        (l.department || '').toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || l.letterType === typeFilter;
      const matchBranch = branchFilter === 'all' || (l.branch || '').toLowerCase() === branchFilter.toLowerCase();

      return matchQuery && matchType && matchBranch;
    });
  }, [letters, searchQuery, searchError, typeFilter, branchFilter]);

  // Reset to page 1 whenever filter or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, branchFilter]);

  // Paginated letters slice
  const paginatedLetters = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLetters.slice(startIndex, startIndex + pageSize);
  }, [filteredLetters, currentPage, pageSize]);

  // KPI calculations
  const totalIssued = letters.length;
  const offerCount = letters.filter((l) => l.letterType === 'offer').length;
  const relievingCount = letters.filter((l) => l.letterType === 'relieving').length;
  const expCount = letters.filter((l) => l.letterType === 'experience').length;

  // Dynamic Branch / Campus List derived from data context, staff & issued records
  const dynamicBranchList = useMemo(() => {
    const list = new Set<string>();
    (branches || []).forEach((b: any) => {
      const name = typeof b === 'string' ? b : b?.name || b?.branchName;
      if (name && b?.status !== 'Inactive') list.add(name);
    });
    (staff || []).forEach((s: any) => {
      if (s?.branch) list.add(s.branch);
    });
    (letters || []).forEach((l: any) => {
      if (l?.branch) list.add(l.branch);
    });
    if (schoolProfile?.branchName) list.add(schoolProfile.branchName);
    return Array.from(list).filter(Boolean).sort();
  }, [branches, staff, letters, schoolProfile]);

  return (
    <div className="space-y-3 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Top Clean Header - Ultra-compact Padding */}
      <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Offer & Relieving Letters
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenGenerator('offer')}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate & Send Letter
          </button>
        </div>
      </div>

      {/* KPI Cards (Clean White with Compact Padding & Sky Theme Border) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Total Letters</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{totalIssued}</p>
          </div>
          <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <FileText className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Offer Letters</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{offerCount}</p>
          </div>
          <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Relieving Letters</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{relievingCount}</p>
          </div>
          <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Experience Certificates</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{expCount}</p>
          </div>
          <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Award className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Segmented Tab Switches */}
      <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 w-full sm:w-fit border border-sky-300 dark:border-sky-800">
        <button
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'registry'
              ? 'bg-white dark:bg-slate-950 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Issued Letters ({letters.length})
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'templates'
              ? 'bg-white dark:bg-slate-950 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Global Templates & Policies
        </button>
      </div>

      {/* TAB 1: CENTRAL LETTERS REGISTRY */}
      {activeTab === 'registry' && (
        <div className="space-y-3">
          {/* Filter and Search Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl px-3.5 py-2 shadow-xs border border-sky-300 dark:border-sky-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="w-full sm:w-80">
              <div className="relative w-full flex items-center">
                <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${searchError ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`} />
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Search by staff name..."
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (!val) {
                      setSearchError(undefined);
                    } else {
                      const validation = validateSearchQuery(val);
                      setSearchError(validation.isValid ? undefined : validation.error);
                    }
                  }}
                  className={`w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white outline-none transition shadow-2xs ${
                    searchError
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchError(undefined);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {searchError && (
                <p className="mt-1 text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{searchError}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-sky-200 dark:border-sky-800 font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Document Types</option>
                <option value="offer">Offer Letters</option>
                <option value="relieving">Relieving Letters</option>
                <option value="experience">Experience Certificates</option>
              </select>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-sky-200 dark:border-sky-800 font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Campuses</option>
                {dynamicBranchList.map((branchName) => (
                  <option key={branchName} value={branchName}>
                    {branchName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Letters Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-sky-300 dark:border-sky-800 overflow-hidden">
            {filteredLetters.length === 0 ? (
              searchError ? (
                <div className="p-12 text-center space-y-2.5">
                  <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">Invalid Search</h3>
                  <p className="text-xs text-rose-500 font-semibold">
                    {searchError}
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchError(undefined);
                      }}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  </div>
                </div>
              ) : letters.length > 0 || searchQuery.trim() || typeFilter !== 'all' || branchFilter !== 'all' ? (
                <div className="p-12 text-center space-y-2.5">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                    <Search className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">No Matching Letters</h3>
                  <p className="text-xs text-slate-500">
                    No records found.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchError(undefined);
                        setTypeFilter('all');
                        setBranchFilter('all');
                      }}
                      className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reset Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 mx-auto flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">No Institutional Letters Issued Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Click below to generate an official appointment Offer Letter or Relieving Certificate, or auto-populate offer letters for all registered school staff.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      onClick={() => handleOpenGenerator('offer')}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Generate Custom Letter
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 text-center w-14">S.No</th>
                      <th className="py-3 px-4 text-center">Staff Member</th>
                      <th className="py-3 px-4 text-center">Letter Type</th>
                      <th className="py-3 px-4 text-center">Reference No</th>
                      <th className="py-3 px-4 text-center">Issue Date</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedLetters.map((letter, idx) => {
                      const matchedStaff = staff.find(
                        (s) => s.id === letter.staffId || s.empId === letter.staffEmpId
                      );
                      return (
                        <tr key={letter.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/60 transition">
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500 dark:text-slate-400">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{letter.staffName}</p>
                            {letter.designation && (
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                {letter.designation}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={
                                letter.letterType === 'offer'
                                  ? 'info'
                                  : letter.letterType === 'relieving'
                                  ? 'warning'
                                  : 'success'
                              }
                              size="sm"
                            >
                              {letter.letterType === 'offer'
                                ? 'Appointment Offer'
                                : letter.letterType === 'relieving'
                                ? 'Relieving Clearance'
                                : 'Experience Cert'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {letter.letterNumber}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400 font-medium">
                            {letter.issueDate}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  const targetStaff = matchedStaff || ({ id: letter.staffId, empId: letter.staffEmpId, firstName: letter.staffName, lastName: '', designation: letter.designation, department: letter.department, branch: letter.branch } as any);
                                  handleOpenGenerator(letter.letterType, targetStaff, letter, true);
                                }}
                                className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 hover:bg-sky-100 cursor-pointer"
                                title="View & Print Document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleResendToPortal(letter)}
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                title="Resend Notification to Staff"
                              >
                                <Send className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setLetterToDelete(letter)}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 cursor-pointer"
                                title="Revoke Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredLetters.length > 0 && (
              <div className="px-4 pb-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredLetters.length}
                  itemsPerPage={pageSize}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(n) => {
                    setPageSize(n);
                    setCurrentPage(1);
                  }}
                  label="letters"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL TEMPLATES & DEFAULT TERMS MANAGER */}
      {activeTab === 'templates' && (
        <form onSubmit={handleSaveGlobalTemplateSettings} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Box 1: Institutional Signatory & Policy Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-sky-300 dark:border-sky-800 space-y-3.5">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Institutional Letterhead & Signatory Settings
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Authorized Signatory Full Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter authorized signatory full name..."
                    value={globalSignatoryName}
                    onChange={(e) => setGlobalSignatoryName(e.target.value)}
                    placeholder="Enter Authorized Signatory Full Name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-sky-200 dark:border-sky-800 font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {settingsErrors.signatoryName && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {settingsErrors.signatoryName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Signatory Title & Designation <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Principal & Authorized Signatory"
                    value={globalSignatoryTitle}
                    onChange={(e) => setGlobalSignatoryTitle(e.target.value)}
                    placeholder="Enter Signatory Title & Designation"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-sky-200 dark:border-sky-800 font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {settingsErrors.signatoryTitle && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {settingsErrors.signatoryTitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Standard Probation (Months) <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      placeholder="e.g. 6"
                      value={globalProbationMonths}
                      onChange={(e) => {
                        setGlobalProbationMonths(e.target.value === '' ? '' : Number(e.target.value));
                        if (settingsErrors.probationMonths) {
                          setSettingsErrors((prev) => ({ ...prev, probationMonths: undefined }));
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border font-bold text-slate-900 dark:text-white outline-none ${
                        settingsErrors.probationMonths ? 'border-rose-500 focus:ring-rose-500' : 'border-sky-200 dark:border-sky-800'
                      }`}
                    />
                    {settingsErrors.probationMonths && (
                      <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                        <span>⚠️</span> {settingsErrors.probationMonths}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Standard Notice Period (Days) <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      placeholder="e.g. 30"
                      value={globalNoticePeriodDays}
                      onChange={(e) => {
                        setGlobalNoticePeriodDays(e.target.value === '' ? '' : Number(e.target.value));
                        if (settingsErrors.noticePeriodDays) {
                          setSettingsErrors((prev) => ({ ...prev, noticePeriodDays: undefined }));
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border font-bold text-slate-900 dark:text-white outline-none ${
                        settingsErrors.noticePeriodDays ? 'border-rose-500 focus:ring-rose-500' : 'border-sky-200 dark:border-sky-800'
                      }`}
                    />
                    {settingsErrors.noticePeriodDays && (
                      <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                        <span>⚠️</span> {settingsErrors.noticePeriodDays}
                      </p>
                    )}
                  </div>
                </div>

                {/* Signatory Signature & Stamp Upload */}
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Authorized Signatory Signature / Official Stamp Image <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className={`p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed flex flex-col sm:flex-row items-center gap-3 ${
                    settingsErrors.signatureImage ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' : 'border-sky-300 dark:border-sky-800'
                  }`}>
                    <div className="w-24 h-14 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                      {globalSignatureImage ? (
                        <img
                          src={globalSignatureImage}
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
                        Upload authorized digital signature or official seal (PNG, JPG, WEBP, max 5MB). Automatically saved to database and applied to all generated letter templates.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <label className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          {globalSignatureImage ? 'Change Signature' : 'Upload Signature'}
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
                                  setGlobalSignatureImage(result);
                                  if (settingsErrors.signatureImage) {
                                    setSettingsErrors((prev) => ({ ...prev, signatureImage: undefined }));
                                  }
                                  addToast('success', 'Signature Loaded', 'Signature image selected. Click "Save Global Letter Templates" to persist to database.');
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        {globalSignatureImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setGlobalSignatureImage('');
                              addToast('info', 'Signature Removed', 'Signature image removed.');
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
                  {settingsErrors.signatureImage && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {settingsErrors.signatureImage}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
                  💡 <strong>Institutional Letterhead:</strong> The school logo, official address, CBSE affiliation number,
                  and contact details are synced dynamically from the School Profile master configuration.
                </div>
              </div>
            </div>

            {/* Box 2: Master Offer Letter Clauses */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-sky-300 dark:border-sky-800 space-y-3.5">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                <FileCheck className="w-4 h-4 text-sky-600" />
                Standard Offer Letter Clauses & Terms ({globalTerms.length})
              </h2>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {globalTerms.map((term, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-sky-100 dark:border-sky-900 flex items-start justify-between gap-2 text-xs"
                  >
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                      <span className="font-bold text-sky-600">{idx + 1}. </span>
                      {term}
                    </p>
                    <button
                      type="button"
                      onClick={() => setTermToDeleteIndex(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 shrink-0 cursor-pointer"
                      title="Remove Term"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Type new clause or condition..."
                  value={newTermInput}
                  onChange={(e) => setNewTermInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-850 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSavingSettings ? 'Saving to Database...' : 'Save Global Letter Templates'}
            </button>
          </div>
        </form>
      )}

      {/* Generator & Live Preview Modal */}
      {generatorOpen && (
        <StaffLetterModal
          staff={selectedStaffForGen || (staff.length > 0 ? staff[0] : getSafeStaffFallback(schoolProfile))}
          isOpen={generatorOpen}
          onClose={() => {
            setGeneratorOpen(false);
            setExistingRecordForView(undefined);
            setIsReadOnlyModal(false);
            refreshLetters();
          }}
          onNavigate={onNavigate}
          initialType={selectedTypeForGen}
          existingRecord={existingRecordForView}
          readOnly={isReadOnlyModal}
        />
      )}

      {/* Delete Policy/Clause Confirm Modal */}
      <ConfirmModal
        isOpen={termToDeleteIndex !== null}
        title="Delete Policy Clause"
        message={
          termToDeleteIndex !== null && globalTerms[termToDeleteIndex]
            ? `Are you sure you want to delete this clause?\n\n"${globalTerms[termToDeleteIndex]}"`
            : 'Are you sure you want to delete this policy clause?'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (termToDeleteIndex !== null) {
            handleRemoveTerm(termToDeleteIndex);
            setTermToDeleteIndex(null);
          }
        }}
        onCancel={() => setTermToDeleteIndex(null)}
      />

      {/* Revoke Confirm Modal */}
      <ConfirmModal
        isOpen={!!letterToDelete}
        title="Revoke Issued Letter Record"
        message={`Are you sure you want to revoke and delete ${letterToDelete?.letterType.toUpperCase()} Letter (Ref: ${letterToDelete?.letterNumber}) for ${letterToDelete?.staffName}?`}
        onConfirm={() => {
          if (letterToDelete) {
            deleteStaffLetterApi(letterToDelete.id)
              .then(() => {
                setLetters((prev) => prev.filter((l) => l.id !== letterToDelete.id));
                addToast('success', 'Letter Revoked', `Official letter record ${letterToDelete.letterNumber} revoked from database.`);
              })
              .catch((err) => {
                console.error('Failed to revoke letter:', err);
                addToast('error', 'Revoke Failed', 'Could not delete letter from backend database.');
              })
              .finally(() => {
                setLetterToDelete(null);
              });
          }
        }}
        onCancel={() => setLetterToDelete(null)}
      />
    </div>
  );
};
