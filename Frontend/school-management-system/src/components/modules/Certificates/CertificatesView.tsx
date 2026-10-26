import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Award, Search, Plus, Filter, FileText, Printer, Eye, Download, 
  RefreshCw, CheckCircle2, AlertTriangle, Layers, Calendar, ShieldCheck, 
  ArrowUpRight, Settings as SettingsIcon, FileCheck, Check, ChevronDown
} from 'lucide-react';
import { 
  GeneratedCertificateRecord, CertificateTypeConfig, Student 
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { GenerateCertificateModal } from './GenerateCertificateModal';
import { INITIAL_CERTIFICATE_TYPES } from '../Settings/CertificateSettingsTab';
import { formatDateDDMMYYYY } from '../../../utils/dateValidation';
import { compareClassesAscending } from '../../../utils/classSorter';

export interface CertificatesViewProps {
  onNavigateToSettings?: () => void;
}

interface DownwardSelectOption {
  value: string;
  label: string;
}

const DownwardSelect: React.FC<{
  value: string;
  options: DownwardSelectOption[];
  onChange: (val: string) => void;
  className?: string;
}> = ({ value, options, onChange, className }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={
          className ||
          "px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer flex items-center justify-between gap-2.5 whitespace-nowrap"
        }
      >
        <span>{selectedOption?.label || value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-full w-max max-h-60 overflow-y-auto z-50 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1.5 animate-in fade-in">
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="whitespace-nowrap">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CertificatesView: React.FC<CertificatesViewProps> = ({ onNavigateToSettings }) => {
  const { students, schoolProfile, academicClasses } = useData();
  const { selectedAcademicYear, selectedBranch } = useAuth();
  const { addToast } = useToast();
  const activeAY = selectedAcademicYear || '2026–2027';

  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  useEffect(() => {
    try {
      localStorage.removeItem('certificates_view_active_tab');
    } catch {}
  }, []);

  // Load Certificate Types from localStorage or fallback
  const certificateTypes = useMemo<CertificateTypeConfig[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CERTIFICATE_TYPES;
  }, []);

  // Load Generated Certificate History from localStorage (merging with legacy TC register)
  const [historyRecords, setHistoryRecords] = useState<GeneratedCertificateRecord[]>(() => {
    try {
      const savedCert = localStorage.getItem('edu_db_generated_certificates');
      const savedTc = localStorage.getItem('edu_db_tc_register');

      let certList: GeneratedCertificateRecord[] = savedCert ? JSON.parse(savedCert) : [];
      let tcList: any[] = savedTc ? JSON.parse(savedTc) : [];

      // Map legacy TC records if not already in certList
      tcList.forEach(tc => {
        if (!certList.some(c => c.id === tc.id || c.certificateNumber === tc.tcNo || c.certificateNumber === tc.certificateNumber)) {
          certList.push({
            id: tc.id || `REC-TC-${Date.now()}`,
            certificateNumber: tc.tcNo || tc.certificateNumber || 'TC-2026-0001',
            certificateTypeId: 'CT-TC',
            certificateTypeName: 'Transfer Certificate',
            studentId: tc.studentId || '',
            admissionNo: tc.admissionNo || '',
            studentName: tc.studentName || '',
            className: tc.className || '',
            section: tc.section || '',
            academicYear: tc.academicYear || activeAY,
            branch: tc.branch || '',
            issueDate: tc.issueDate || new Date().toISOString().split('T')[0],
            status: 'Issued',
            generatedBy: tc.generatedBy || 'Administrator',
            fieldDataSnapshot: tc.fieldDataSnapshot || {},
            templateSnapshot: tc.templateSnapshot || {},
            leavingDate: tc.leavingDate,
            reason: tc.reason,
            conduct: tc.conduct,
            remarks: tc.remarks
          });
        }
      });

      return certList;
    } catch (e) {
      return [];
    }
  });

  const refreshHistory = () => {
    try {
      const savedCert = localStorage.getItem('edu_db_generated_certificates');
      if (savedCert) {
        setHistoryRecords(JSON.parse(savedCert));
      }
    } catch (e) {}
  };

  // Filter States for Certificate History
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Filter States for Generate Certificate Tab
  const [genSearchQuery, setGenSearchQuery] = useState('');
  const [genClassFilter, setGenClassFilter] = useState('ALL');
  const [genSectionFilter, setGenSectionFilter] = useState('ALL');

  // Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<Student | null>(null);
  const [selectedRecordForView, setSelectedRecordForView] = useState<GeneratedCertificateRecord | null>(null);

  // Sorted list of unique classes for class filter dropdown
  const sortedClasses = useMemo(() => {
    const classSet = new Set<string>();
    (academicClasses || []).forEach(c => classSet.add(c.name || (c as any).className));
    students.forEach(s => { if (s.className) classSet.add(s.className); });
    return Array.from(classSet).sort(compareClassesAscending);
  }, [academicClasses, students]);

  // Available sections for Generate Certificate filter
  const availableGenSections = useMemo(() => {
    const secSet = new Set<string>();
    students.forEach(s => {
      if (s.section && (genClassFilter === 'ALL' || s.className === genClassFilter)) {
        secSet.add(s.section);
      }
    });
    return Array.from(secSet).sort();
  }, [students, genClassFilter]);

  // Filtered Students for Generate Certificate Tab
  const filteredStudentsForGen = useMemo(() => {
    return students.filter(s => {
      const q = genSearchQuery.toLowerCase().trim();
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const matchesSearch = !q || fullName.includes(q) || (s.admissionNo || '').toLowerCase().includes(q);
      const matchesClass = genClassFilter === 'ALL' || s.className === genClassFilter;
      const matchesSection = genSectionFilter === 'ALL' || s.section === genSectionFilter;
      return matchesSearch && matchesClass && matchesSection;
    });
  }, [students, genSearchQuery, genClassFilter, genSectionFilter]);

  // Filtered History Records
  const filteredHistory = useMemo(() => {
    return historyRecords.filter(rec => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (rec.studentName || '').toLowerCase().includes(q) ||
        (rec.admissionNo || '').toLowerCase().includes(q) ||
        (rec.certificateNumber || '').toLowerCase().includes(q);

      const matchesType = selectedTypeFilter === 'ALL' || rec.certificateTypeId === selectedTypeFilter || rec.certificateTypeName === selectedTypeFilter;
      const matchesClass = selectedClassFilter === 'ALL' || rec.className === selectedClassFilter;

      return matchesSearch && matchesType && matchesClass;
    });
  }, [historyRecords, searchQuery, selectedTypeFilter, selectedClassFilter]);

  const handleOpenGenerateForStudent = (student: Student) => {
    setSelectedStudentForCert(student);
    setSelectedRecordForView(null);
    setIsGenerateModalOpen(true);
  };

  const handleViewRecordDetails = (record: GeneratedCertificateRecord) => {
    setSelectedRecordForView(record);
    setSelectedStudentForCert(null);
    setIsGenerateModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-sky-600 dark:text-sky-400" /> Certificates
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedStudentForCert(null);
              setSelectedRecordForView(null);
              setIsGenerateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Issue Certificate
          </button>
        </div>
      </div>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-extrabold flex items-center justify-center text-xl shrink-0">
            {historyRecords.length}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Certificates Issued</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">All Records</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-xl shrink-0">
            {certificateTypes.filter(t => t.status === 'Active').length}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Certificate Types</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">Configured Types</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-xl shrink-0">
            {historyRecords.filter(r => r.academicYear === activeAY).length}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Issued in Current Session</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{activeAY}</p>
          </div>
        </div>
      </div>

      {/* Main Tab Toggle */}
      <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-inner w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'generate'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" /> Generate Certificate
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Certificate History ({historyRecords.length})
        </button>
      </div>

      {/* TAB 1: CERTIFICATE HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="glass-card p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-start gap-3 flex-1 min-w-[300px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search student name, adm no, cert no..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                />
              </div>

              <DownwardSelect
                value={selectedTypeFilter}
                onChange={val => setSelectedTypeFilter(val)}
                options={[
                  { value: 'ALL', label: 'All Certificate Types' },
                  ...certificateTypes.map(t => ({ value: t.id, label: t.name }))
                ]}
              />

              <DownwardSelect
                value={selectedClassFilter}
                onChange={val => setSelectedClassFilter(val)}
                options={[
                  { value: 'ALL', label: 'All Classes' },
                  ...sortedClasses.map(cls => ({ value: cls, label: cls }))
                ]}
              />
            </div>

            <button
              onClick={refreshHistory}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Records Table */}
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-bold text-sm">No issued certificates found.</p>
                <p className="text-xs">Click 'Issue Certificate' above to generate certificates for students.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="p-3.5 pl-5">Certificate No</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Student Name & Adm No</th>
                      <th className="p-3.5">Class</th>
                      <th className="p-3.5">Academic Session</th>
                      <th className="p-3.5">Issue Date</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right pr-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredHistory.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 pl-5 font-mono font-extrabold text-sky-600 dark:text-sky-400">
                          {rec.certificateNumber}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          {rec.certificateTypeName}
                        </td>
                        <td className="p-3.5">
                          <p className="font-extrabold text-slate-900 dark:text-white">{rec.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Reg: {rec.admissionNo}</p>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {rec.className} {rec.section ? `- ${rec.section}` : ''}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          {rec.academicYear}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          {formatDateDDMMYYYY(rec.issueDate)}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-5">
                          <button
                            onClick={() => handleViewRecordDetails(rec)}
                            className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold hover:bg-sky-100 flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View & Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: GENERATE CERTIFICATE STUDENT DIRECTORY */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="glass-card p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-3">
            {/* Search Student Name & Admission Number */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={genSearchQuery}
                onChange={e => setGenSearchQuery(e.target.value)}
                placeholder="Search by student name or admission number..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>

            {/* Filter by Class & Section */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <DownwardSelect
                  value={genClassFilter}
                  onChange={val => {
                    setGenClassFilter(val);
                    setGenSectionFilter('ALL');
                  }}
                  options={[
                    { value: 'ALL', label: 'All Classes' },
                    ...sortedClasses.map(c => ({ value: c, label: c }))
                  ]}
                />
              </div>

              <DownwardSelect
                value={genSectionFilter}
                onChange={val => setGenSectionFilter(val)}
                options={[
                  { value: 'ALL', label: 'All Sections' },
                  ...availableGenSections.map(sec => ({ value: sec, label: `Section ${sec}` }))
                ]}
              />

              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                {filteredStudentsForGen.length} Students
              </span>
            </div>
          </div>

          {/* STUDENTS GRID */}
          {filteredStudentsForGen.length === 0 ? (
            <div className="p-12 text-center glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-500">No matching students found.</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or class/section filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudentsForGen.map(s => (
                <div key={s.id} className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center">
                        {s.firstName[0]}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{s.firstName} {s.lastName}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">Adm No: {s.admissionNo}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                      {s.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Class: <strong>{s.className} - {s.section}</strong> • Parent: <strong>{s.parentName || '—'}</strong>
                  </div>

                  <button
                    onClick={() => handleOpenGenerateForStudent(s)}
                    className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" /> Issue Certificate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* GENERATE / VIEW CERTIFICATE MODAL */}
      <GenerateCertificateModal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          setIsGenerateModalOpen(false);
          setSelectedStudentForCert(null);
          setSelectedRecordForView(null);
        }}
        initialStudent={selectedStudentForCert}
        existingRecord={selectedRecordForView}
        onSuccess={() => {
          refreshHistory();
        }}
      />
    </div>
  );
};
