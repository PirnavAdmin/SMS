import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  X, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Printer, 
  Download, ArrowRight, Eye, Calendar, Award, Building2, User, UserCheck, RefreshCw,
  Search, ChevronDown, Users, Check, Minus, Edit3
} from 'lucide-react';
import { 
  Student, GeneratedCertificateRecord, CertificateTypeConfig, CertificateTemplateConfig, CertificateSignatory 
} from '../../../types';
import { useData, formatAcademicYear } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { fetchSchoolSettingsApi } from '../../../api/settings';
import { PrintableCertificateContainer, PrintableBatchCertificatesContainer } from './PrintableCertificateContainer';
import { DateInput } from '../../common/DateInput';
import { getFieldsForCertificateType, DEFAULT_CERTIFICATE_TYPES } from '../../../utils/certificateFields';
import { formatDateDDMMYYYY } from '../../../utils/dateValidation';
import { compareClassesAscending } from '../../../utils/classSorter';
import { 
  generateCertificateExcelTemplate, 
  parseCertificateExcelFile, 
  generateExcelErrorReport, 
  ExcelValidationSummary 
} from '../../../utils/certificateExcelHelper';
import {
  ExcelBulkImportSection,
  ExcelValidationModal,
  ExcelStagingReviewModal
} from './ExcelBulkImportComponents';

// Helper component for DOM Indeterminate Checkbox
const IndeterminateCheckbox: React.FC<{
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
}> = ({ checked, indeterminate, onChange, disabled, title }) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      title={title}
      className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer accent-sky-600"
    />
  );
};

interface GenerateCertificateModalProps {
  initialStudent?: Student | null;
  initialCertificateType?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (record: GeneratedCertificateRecord) => void;
  existingRecord?: GeneratedCertificateRecord | null;
}

export const GenerateCertificateModal: React.FC<GenerateCertificateModalProps> = ({
  initialStudent,
  initialCertificateType,
  isOpen,
  onClose,
  onSuccess,
  existingRecord
}) => {
  const { students, schoolProfile, academicClasses, academicYears = [], saveGeneratedCertificates, certificateTemplates: contextTemplates = [] } = useData();
  const { selectedAcademicYear, selectedBranch } = useAuth();
  const { addToast } = useToast();

  const modalContentRef = useRef<HTMLDivElement>(null);

  // Synchronized state for Types, Templates, Signatories, and Seal from Settings
  const [localTypes, setLocalTypes] = useState<CertificateTypeConfig[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CERTIFICATE_TYPES;
  });

  const [localTemplates, setLocalTemplates] = useState<CertificateTemplateConfig[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_templates_v2') || localStorage.getItem('edu_db_certificate_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return contextTemplates || [];
  });

  const [localSignatories, setLocalSignatories] = useState<CertificateSignatory[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_signatories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [localSeal, setLocalSeal] = useState<{ show: boolean; sealText: string; sealImageUrl: string }>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_seal');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return { show: true, sealText: '', sealImageUrl: '' };
  });

  const reloadCertificateConfigurations = useCallback(() => {
    try {
      const savedTypes = localStorage.getItem('edu_db_certificate_types');
      if (savedTypes) {
        const parsed = JSON.parse(savedTypes);
        if (Array.isArray(parsed) && parsed.length > 0) setLocalTypes(parsed);
      }
    } catch {}

    try {
      const savedTemplates = localStorage.getItem('edu_db_certificate_templates_v2') || localStorage.getItem('edu_db_certificate_templates');
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalTemplates(parsed);
        } else if (contextTemplates && contextTemplates.length > 0) {
          setLocalTemplates(contextTemplates);
        }
      } else if (contextTemplates && contextTemplates.length > 0) {
        setLocalTemplates(contextTemplates);
      }
    } catch {}

    try {
      const savedSig = localStorage.getItem('edu_db_certificate_signatories');
      if (savedSig) {
        const parsed = JSON.parse(savedSig);
        if (Array.isArray(parsed) && parsed.length > 0) setLocalSignatories(parsed);
      }
    } catch {}

    try {
      const savedSeal = localStorage.getItem('edu_db_certificate_seal');
      if (savedSeal) {
        const parsed = JSON.parse(savedSeal);
        if (parsed && typeof parsed === 'object') setLocalSeal(parsed);
      }
    } catch {}
  }, [contextTemplates]);

  useEffect(() => {
    if (!isOpen) return;
    reloadCertificateConfigurations();

    let isMounted = true;
    fetchSchoolSettingsApi()
      .then((res: any) => {
        if (!isMounted) return;
        const certData = res?.data?.certificateTemplates;
        if (certData && typeof certData === 'object' && !Array.isArray(certData)) {
          if (Array.isArray(certData.types) && certData.types.length > 0) {
            setLocalTypes(certData.types);
            try { localStorage.setItem('edu_db_certificate_types', JSON.stringify(certData.types)); } catch {}
          }
          if (Array.isArray(certData.templates) && certData.templates.length > 0) {
            setLocalTemplates(certData.templates);
            try { localStorage.setItem('edu_db_certificate_templates_v2', JSON.stringify(certData.templates)); } catch {}
          }
          if (Array.isArray(certData.signatories) && certData.signatories.length > 0) {
            setLocalSignatories(certData.signatories);
            try { localStorage.setItem('edu_db_certificate_signatories', JSON.stringify(certData.signatories)); } catch {}
          }
          if (certData.seal && typeof certData.seal === 'object') {
            setLocalSeal(certData.seal);
            try { localStorage.setItem('edu_db_certificate_seal', JSON.stringify(certData.seal)); } catch {}
          }
        }
      })
      .catch(() => {});

    const onUpdate = () => {
      reloadCertificateConfigurations();
    };

    window.addEventListener('certificates_updated', onUpdate);
    window.addEventListener('school_profile_updated', onUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('certificates_updated', onUpdate);
      window.removeEventListener('school_profile_updated', onUpdate);
    };
  }, [isOpen, reloadCertificateConfigurations]);
  
  const activeAY = useMemo(() => {
    if (selectedAcademicYear && selectedAcademicYear !== 'All') return formatAcademicYear(selectedAcademicYear);
    const activeMaster = academicYears.find(ay => ay.status === 'Active' || ay.isCurrentAcademicYear);
    if (activeMaster?.academicYear) return formatAcademicYear(activeMaster.academicYear);
    if (schoolProfile?.academicYear) return formatAcademicYear(schoolProfile.academicYear);
    const curr = new Date().getFullYear();
    const shortEnd = String((curr + 1) % 100).padStart(2, '0');
    return `${curr}-${shortEnd}`;
  }, [selectedAcademicYear, academicYears, schoolProfile]);

  // Current local date in YYYY-MM-DD format (no future dates permitted)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Mode state: 'single' vs 'bulk'
  const [generationMode, setGenerationMode] = useState<'single' | 'bulk'>('single');

  // Load Certificate Types & Templates from synced backend state / localStorage
  const certificateTypes = useMemo<CertificateTypeConfig[]>(() => {
    if (localTypes && localTypes.length > 0) return localTypes;
    return DEFAULT_CERTIFICATE_TYPES;
  }, [localTypes]);

  const certificateTemplates = useMemo<CertificateTemplateConfig[]>(() => {
    if (localTemplates && localTemplates.length > 0) return localTemplates;
    return [];
  }, [localTemplates]);

  // Selected Student & Type State for Single Mode
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    existingRecord?.studentId || initialStudent?.id || ''
  );
  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    existingRecord?.certificateTypeId || initialCertificateType || ''
  );

  // Single Student Search Dropdown State
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<boolean>(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Bulk Mode Selection States
  const [selectedBulkClass, setSelectedBulkClass] = useState<string>('');
  const [selectedBulkSection, setSelectedBulkSection] = useState<string>('');
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState<number>(0);

  // Confirmation Modal State & Batch Completion Results
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [batchIssuedRecords, setBatchIssuedRecords] = useState<GeneratedCertificateRecord[]>([]);
  const [batchFailedList, setBatchFailedList] = useState<{ studentName: string; reason: string }[]>([]);
  const [isBatchCompletedShow, setIsBatchCompletedShow] = useState<boolean>(false);
  const [isPrintingBatch, setIsPrintingBatch] = useState<boolean>(false);

  // Excel Bulk Import & Staging States
  const [importedStudentDataMap, setImportedStudentDataMap] = useState<Record<string, Record<string, any>>>({});
  const [excelValidationSummary, setExcelValidationSummary] = useState<ExcelValidationSummary | null>(null);
  const [isExcelModeActive, setIsExcelModeActive] = useState<boolean>(false);
  const [uploadedExcelFile, setUploadedExcelFile] = useState<File | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState<boolean>(false);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [showStagingReviewModal, setShowStagingReviewModal] = useState<boolean>(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatClassDisplayName = (cls?: string, sec?: string) => {
    if (!cls) return sec ? `Section ${sec}` : '';
    const clean = cls.trim();
    const hasClass = clean.toLowerCase().startsWith('class');
    const classTitle = hasClass ? clean : `Class ${clean}`;
    return sec ? `${classTitle}-${sec}` : classTitle;
  };

  // Available Classes for Bulk Filter
  const sortedClasses = useMemo(() => {
    const classSet = new Set<string>();
    (academicClasses || []).forEach(c => classSet.add(c.name || (c as any).className));
    students.forEach(s => { if (s.className) classSet.add(s.className); });
    return Array.from(classSet).sort(compareClassesAscending);
  }, [academicClasses, students]);

  // Available Sections for selected Bulk Class
  const availableBulkSections = useMemo(() => {
    if (!selectedBulkClass) return [];
    const secSet = new Set<string>();
    students.forEach(s => {
      if (s.className === selectedBulkClass && s.section) {
        secSet.add(s.section);
      }
    });
    return Array.from(secSet).sort();
  }, [students, selectedBulkClass]);

  // Filtered Students for Bulk Selection List
  const bulkFilteredStudents = useMemo(() => {
    if (!selectedBulkClass || !selectedBulkSection) return [];
    return students.filter(s => {
      const matchesClass = s.className === selectedBulkClass;
      const matchesSection = selectedBulkSection === 'ALL' || s.section === selectedBulkSection;
      
      const q = bulkSearchQuery.toLowerCase().trim();
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const admNo = (s.admissionNo || (s as any).admissionNumber || s.id || '').toLowerCase();
      const rollNo = (s.rollNo || '').toLowerCase();
      const matchesSearch = !q || fullName.includes(q) || admNo.includes(q) || rollNo.includes(q);

      return matchesClass && matchesSection && matchesSearch;
    });
  }, [students, selectedBulkClass, selectedBulkSection, bulkSearchQuery]);

  // Single Student Search Filter Options
  const filteredSingleStudentOptions = useMemo(() => {
    if (!studentSearchQuery.trim()) return students;
    const q = studentSearchQuery.toLowerCase().trim();
    return students.filter(s => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const admNo = (s.admissionNo || (s as any).admissionNumber || s.id || '').toLowerCase();
      const cls = (s.className || '').toLowerCase();
      const sec = (s.section || '').toLowerCase();
      return fullName.includes(q) || admNo.includes(q) || cls.includes(q) || `${cls}-${sec}`.includes(q);
    });
  }, [students, studentSearchQuery]);

  useEffect(() => {
    if (existingRecord) {
      setSelectedStudentId(existingRecord.studentId);
      setSelectedTypeId(existingRecord.certificateTypeId);
      setActiveTab('preview');
    } else if (initialStudent) {
      setSelectedStudentId(initialStudent.id);
    }
  }, [existingRecord, initialStudent]);

  const selectedStudent = useMemo(() => {
    if (existingRecord) {
      return students.find(s => s.id === existingRecord.studentId) || {
        id: existingRecord.studentId,
        admissionNo: existingRecord.admissionNo,
        firstName: existingRecord.studentName.split(' ')[0] || '',
        lastName: existingRecord.studentName.split(' ').slice(1).join(' ') || '',
        className: existingRecord.className,
        section: existingRecord.section,
        gender: 'Male',
        dob: '2012-08-15',
        status: 'Active',
        avatar: '',
        joiningDate: '2024-06-15',
        rollNo: '1',
        category: 'General'
      } as Student;
    }
    return students.find(s => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId, existingRecord]);

  const selectedTypeConfig = useMemo<CertificateTypeConfig | null>(() => {
    if (!selectedTypeId) return null;
    const found = certificateTypes.find(t => t.id === selectedTypeId || t.name === selectedTypeId);
    return found || null;
  }, [certificateTypes, selectedTypeId]);

  // Load configured dynamic fields for selected certificate type
  const activeFields = useMemo(() => {
    if (!selectedTypeConfig) return [];
    return getFieldsForCertificateType(selectedTypeConfig);
  }, [selectedTypeConfig]);

  // Dynamic Input Form State
  const [certificateSpecificData, setCertificateSpecificData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>(existingRecord ? 'preview' : 'form');
  const [issuedSingleRecord, setIssuedSingleRecord] = useState<GeneratedCertificateRecord | null>(null);

  // Reset modal body scroll whenever tab changes or modal opens
  useEffect(() => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [activeTab, isOpen]);

  // Initialize or reset dynamic form state when Certificate Type or Student changes
  useEffect(() => {
    if (existingRecord) {
      const snapshot = existingRecord.fieldDataSnapshot || {};
      const recordDate = snapshot.dateOfLeaving || existingRecord.leavingDate || todayStr;
      setCertificateSpecificData({
        ...snapshot,
        dateOfLeaving: recordDate > todayStr ? todayStr : recordDate,
        reasonForLeaving: snapshot.reasonForLeaving || existingRecord.reason || 'Parent Request / Relocation',
        generalConduct: snapshot.generalConduct || existingRecord.conduct || 'Good & Exemplary',
        specialRemarks: snapshot.specialRemarks || existingRecord.remarks || '',
        identificationMarks: snapshot.identificationMarks || snapshot.moleIdentification || '1. A mole on the right cheek  2. A mole on the left shoulder'
      });
      setValidationErrors({});
    } else {
      const initialData: Record<string, any> = {};
      activeFields.forEach(field => {
        if (field.key === 'issueDate' || field.key === 'dateOfLeaving') {
          initialData[field.key] = todayStr;
        } else if (field.key === 'studyFromDate' || field.key === 'fromDate') {
          const studentAdmDate = selectedStudent?.joiningDate || (selectedStudent as any)?.admissionDate;
          if (studentAdmDate && String(studentAdmDate).trim() && String(studentAdmDate) < todayStr) {
            initialData[field.key] = String(studentAdmDate).split('T')[0];
          } else {
            const d = new Date();
            d.setFullYear(d.getFullYear() - 1);
            initialData[field.key] = d.toISOString().split('T')[0];
          }
        } else if (field.key === 'studyToDate' || field.key === 'toDate') {
          initialData[field.key] = todayStr;
        } else if (field.type === 'date') {
          initialData[field.key] = field.defaultValue && field.defaultValue <= todayStr ? field.defaultValue : todayStr;
        } else if (field.key === 'academicYear') {
          initialData[field.key] = activeAY;
        } else if (field.key === 'className') {
          initialData[field.key] = selectedStudent?.className || '';
        } else if (field.key === 'admissionNo') {
          initialData[field.key] = selectedStudent?.admissionNo || '';
        } else if (field.key === 'identificationMarks' || field.key === 'moleIdentification') {
          initialData[field.key] = (selectedStudent as any)?.identificationMarks ||
            (selectedStudent as any)?.identificationMark1 ||
            '1. A mole on the right cheek  2. A mole on the left shoulder';
        } else if (field.key === 'generalConduct' || field.key === 'conduct') {
          initialData[field.key] = field.defaultValue || 'Good & Exemplary';
        } else if (field.key === 'reasonForLeaving') {
          initialData[field.key] = 'Parent Request / Relocation';
        } else if (field.key === 'specialRemarks') {
          initialData[field.key] = 'Promoted to Higher Class / Course Completed';
        } else if (field.defaultValue !== undefined) {
          let defVal = field.defaultValue;
          if (defVal === 'FULL DUES CLEARED') defVal = 'Full Dues Cleared';
          initialData[field.key] = defVal;
        } else {
          initialData[field.key] = '';
        }
      });
      setCertificateSpecificData(initialData);
      setValidationErrors({});
    }
  }, [selectedTypeId, selectedStudentId, existingRecord, activeFields, activeAY, selectedStudent]);

  // Handle Class / Section Change in Bulk Mode
  const handleBulkClassChange = (newClass: string) => {
    setSelectedBulkClass(newClass);
    setSelectedBulkSection('ALL');
    setSelectedStudentIds([]);
    setBulkPreviewIndex(0);
    setImportedStudentDataMap({});
    setExcelValidationSummary(null);
    setIsExcelModeActive(false);
    setUploadedExcelFile(null);
  };

  const handleBulkSectionChange = (newSection: string) => {
    setSelectedBulkSection(newSection);
    setSelectedStudentIds([]);
    setBulkPreviewIndex(0);
    setImportedStudentDataMap({});
    setExcelValidationSummary(null);
    setIsExcelModeActive(false);
    setUploadedExcelFile(null);
  };

  // Reset Excel import states when certificate type changes
  useEffect(() => {
    setImportedStudentDataMap({});
    setExcelValidationSummary(null);
    setIsExcelModeActive(false);
    setUploadedExcelFile(null);
  }, [selectedTypeId]);

  // Excel Action Handlers
  const handleDownloadTemplate = () => {
    if (selectedBulkStudents.length === 0) {
      addToast('warning', 'Selection Required', 'Please select at least one student before downloading the Excel template.');
      return;
    }
    if (!selectedTypeConfig) {
      addToast('warning', 'Type Required', 'Please select a valid certificate type.');
      return;
    }
    try {
      generateCertificateExcelTemplate(selectedBulkStudents, selectedTypeConfig, activeAY);
      addToast('success', 'Template Downloaded', `Generated Excel template with ${selectedBulkStudents.length} students for ${selectedTypeConfig.name}.`);
    } catch (err: any) {
      addToast('error', 'Download Failed', err.message || 'Could not generate Excel template.');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      addToast('error', 'Invalid File Type', 'Please upload a valid Excel file (.xlsx or .xls).');
      return;
    }

    if (selectedBulkStudents.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select students before uploading the filled Excel template.');
      return;
    }

    if (!selectedTypeConfig) return;

    setIsParsingExcel(true);
    try {
      const summary = await parseCertificateExcelFile(file, selectedBulkStudents, selectedTypeConfig);
      setUploadedExcelFile(file);
      setExcelValidationSummary(summary);

      if (summary.validCount > 0) {
        setImportedStudentDataMap(summary.validDataMap);
        setIsExcelModeActive(true);
        if (summary.errorCount > 0) {
          addToast(
            'warning',
            'Partial Validation',
            `Parsed ${summary.totalRows} rows: ${summary.validCount} valid, ${summary.errorCount} errors. Click 'Validation Details' to inspect.`
          );
        } else {
          addToast(
            'success',
            'Excel Imported Successfully',
            `Successfully mapped ${summary.validCount} student certificate records from Excel.`
          );
        }
      } else {
        setIsExcelModeActive(false);
        addToast(
          'error',
          'Validation Failed',
          `No valid records found in the uploaded file (${summary.errorCount} errors). Please review error details.`
        );
      }
    } catch (err: any) {
      console.error('Failed to parse Excel file', err);
      addToast('error', 'Excel Parse Error', err.message || 'Failed to read the Excel file.');
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleClearImport = () => {
    setUploadedExcelFile(null);
    setExcelValidationSummary(null);
    setImportedStudentDataMap({});
    setIsExcelModeActive(false);
    addToast('info', 'Import Cleared', 'Switched back to manual common certificate entry.');
  };

  const handleDownloadErrorReport = () => {
    if (!excelValidationSummary) return;
    try {
      generateExcelErrorReport(excelValidationSummary);
      addToast('info', 'Report Downloaded', 'Exported validation error report to Excel.');
    } catch (err: any) {
      addToast('error', 'Export Failed', err.message || 'Could not export error report.');
    }
  };

  const handleUpdateStudentStagedData = (studentId: string, updatedFields: Record<string, any>) => {
    setImportedStudentDataMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        ...updatedFields
      }
    }));
  };

  const handleRemoveStudentFromBatch = (studentId: string) => {
    setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    setImportedStudentDataMap(prev => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });
    addToast('info', 'Student Excluded', 'Student was removed from current batch issue.');
  };

  // Select All Checkbox States for Bulk Mode
  const isAllSelected = useMemo(() => {
    return bulkFilteredStudents.length > 0 && bulkFilteredStudents.every(s => selectedStudentIds.includes(s.id));
  }, [bulkFilteredStudents, selectedStudentIds]);

  const isSomeSelected = useMemo(() => {
    return bulkFilteredStudents.some(s => selectedStudentIds.includes(s.id)) && !isAllSelected;
  }, [bulkFilteredStudents, selectedStudentIds, isAllSelected]);

  const handleToggleSelectAllBulk = () => {
    if (isAllSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !bulkFilteredStudents.some(s => s.id === id)));
    } else {
      const allDisplayedIds = bulkFilteredStudents.map(s => s.id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...allDisplayedIds])));
    }
  };

  const handleToggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const selectedBulkStudents = useMemo(() => {
    return selectedStudentIds.map(id => students.find(s => s.id === id)).filter(Boolean) as Student[];
  }, [students, selectedStudentIds]);

  const previewStudentForBulk = useMemo(() => {
    if (selectedBulkStudents.length === 0) return null;
    const safeIdx = Math.min(bulkPreviewIndex, selectedBulkStudents.length - 1);
    return selectedBulkStudents[safeIdx] || selectedBulkStudents[0];
  }, [selectedBulkStudents, bulkPreviewIndex]);

  const selectedTemplate = useMemo<CertificateTemplateConfig>(() => {
    if (existingRecord?.templateSnapshot) {
      return existingRecord.templateSnapshot;
    }

    const targetTypeId = (selectedTypeConfig?.id || selectedTypeId || '').trim().toLowerCase();
    const targetTypeName = (selectedTypeConfig?.name || '').trim().toLowerCase();
    const targetTypeCode = (selectedTypeConfig?.code || '').trim().toLowerCase();

    const matched = certificateTemplates.find(t => {
      const tTypeId = (t.certificateTypeId || '').trim().toLowerCase();
      const tId = (t.id || '').trim().toLowerCase();
      const tName = (t.certificateTypeName || (t as any).certificateType || '').trim().toLowerCase();
      const tTitle = (t.title || '').trim().toLowerCase();
      const tCode = ((t as any).code || '').trim().toLowerCase();

      return (
        (targetTypeId && (tTypeId === targetTypeId || tId === targetTypeId || tId === `tpl-${targetTypeId}`)) ||
        (targetTypeName && (tName === targetTypeName || tTitle === targetTypeName)) ||
        (targetTypeCode && tCode === targetTypeCode)
      );
    });

    // Resolved signatories: prioritize template signatories if non-empty, otherwise global Settings signatories
    const resolvedSignatories = (matched?.signatories && matched.signatories.length > 0 && matched.signatories.some(s => s.show !== false && s.title?.trim()))
      ? matched.signatories
      : (localSignatories && localSignatories.length > 0 && localSignatories.some(s => s.show !== false && s.title?.trim()))
        ? localSignatories
        : [
            { id: '1', title: 'Class Teacher', show: true },
            { id: '2', title: 'Accounts Officer', show: true },
            { id: '3', title: 'Principal', name: schoolProfile?.principalName || 'Principal', show: true }
          ];

    const resolvedShowSeal = matched?.showSeal !== undefined ? matched.showSeal : (localSeal.show !== undefined ? localSeal.show : true);
    const resolvedSealText = (matched?.sealText || localSeal.sealText || 'OFFICIAL SEAL').trim();
    const resolvedSealImageUrl = matched?.sealImageUrl || localSeal.sealImageUrl || '';

    if (matched) {
      return {
        ...matched,
        signatories: resolvedSignatories,
        showSeal: resolvedShowSeal,
        sealText: resolvedSealText,
        sealImageUrl: resolvedSealImageUrl,
        headerStyle: matched.headerStyle || 'Classic Double Border',
        themeColor: matched.themeColor || '#1e3a8a',
        title: matched.title || (selectedTypeConfig?.name || 'CERTIFICATE').toUpperCase(),
      };
    }

    return {
      id: `TPL-${selectedTypeConfig?.id || selectedTypeId || 'DEFAULT'}`,
      certificateTypeId: selectedTypeConfig?.id || selectedTypeId || 'CT-TC',
      certificateTypeName: selectedTypeConfig?.name || 'Certificate',
      title: (selectedTypeConfig?.name || 'CERTIFICATE').toUpperCase(),
      headerStyle: 'Classic Double Border' as const,
      themeColor: '#1e3a8a',
      showLogo: true,
      showSchoolHeader: true,
      bodyTemplate: `This is to certify that {{studentName}}, Admission No. {{admissionNumber}}, Class {{class}}, is a student of {{schoolName}}. Issued on {{issueDate}}.`,
      footerText: 'Official Certificate issued by School Authority.',
      signatories: resolvedSignatories,
      showSeal: resolvedShowSeal,
      sealText: resolvedSealText,
      sealImageUrl: resolvedSealImageUrl,
      dateFormat: 'DD/MM/YYYY'
    };
  }, [certificateTemplates, selectedTypeConfig, selectedTypeId, existingRecord, localSignatories, localSeal, schoolProfile]);

  // Calculate unique Certificate Number
  const generatedCertNo = useMemo(() => {
    if (existingRecord?.certificateNumber) return existingRecord.certificateNumber;
    const prefix = selectedTypeConfig?.numberingPrefix || 'CERT';
    const length = selectedTypeConfig?.numberingLength || 4;
    const extractedYear = activeAY.match(/\d{4}/)?.[0] || new Date().getFullYear().toString();
    const yearPart = selectedTypeConfig?.includeAcademicYearInNo ? `-${extractedYear}-` : '-';
    
    try {
      const saved = localStorage.getItem('edu_db_generated_certificates');
      if (saved) {
        const records: GeneratedCertificateRecord[] = JSON.parse(saved);
        const count = records.filter(r => r.certificateTypeId === selectedTypeConfig?.id).length + 1;
        return `${prefix}${yearPart}${String(count).padStart(length, '0')}`;
      }
    } catch (e) {}

    return `${prefix}${yearPart}0001`;
  }, [selectedTypeConfig, activeAY, existingRecord]);

  if (!isOpen) return null;

  // Validation function before generating certificates
  const validateFormFields = (): boolean => {
    if (!selectedTypeId) {
      addToast('warning', 'Selection Required', 'Please select a certificate type.');
      return false;
    }

    // If bulk generation mode:
    if (generationMode === 'bulk') {
      if (isExcelModeActive && Object.keys(importedStudentDataMap).length > 0) {
        const hasValidData = selectedBulkStudents.some(s => !!importedStudentDataMap[s.id]);
        if (!hasValidData) {
          addToast('error', 'Import Data Missing', 'None of the selected students have valid imported Excel data.');
          return false;
        }
      }
      return true;
    }

    const errors: Record<string, string> = {};
    activeFields.forEach(field => {
      const val = certificateSpecificData[field.key];
      if (field.required) {
        if (val === undefined || val === null || String(val).trim() === '') {
          errors[field.key] = `${field.label} is required.`;
          return;
        }
      }

      // Ensure no certificate date is a future date
      if (field.type === 'date' && val && String(val).trim() !== '') {
        const valStr = String(val).trim();
        if (valStr > todayStr) {
          errors[field.key] = `${field.label} cannot be a future date.`;
        }
      }
    });

    // Cross-field validation for study duration and date ranges:
    // To date should not be on or before From date
    activeFields.forEach(f => {
      if (f.key === 'studyToDate' || f.key === 'toDate' || f.key.toLowerCase().includes('todate')) {
        const fromKey = f.key === 'studyToDate'
          ? 'studyFromDate'
          : (f.key === 'toDate'
              ? 'fromDate'
              : activeFields.find(o => o.key.toLowerCase() === f.key.toLowerCase().replace('todate', 'fromdate'))?.key);
        const fromVal = fromKey ? certificateSpecificData[fromKey] : undefined;
        const toVal = certificateSpecificData[f.key];
        if (fromVal && toVal && toVal <= fromVal) {
          const fromLabel = activeFields.find(o => o.key === fromKey)?.label || 'From Date';
          errors[f.key] = `${f.label} cannot be on or before ${fromLabel}.`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstKey = Object.keys(errors)[0];
      addToast('error', 'Validation Error', errors[firstKey]);
      return false;
    }

    setValidationErrors({});
    return true;
  };

  // Click handler for Preview button on Configuration Form tab
  const handlePreviewClick = () => {
    if (!selectedTypeId) {
      addToast('warning', 'Selection Required', 'Please select a certificate type.');
      return;
    }
    if (generationMode === 'single') {
      if (!selectedStudent) {
        addToast('warning', 'Selection Required', 'Please select a student to preview certificate.');
        return;
      }
      if (!validateFormFields()) return;
      setActiveTab('preview');
    } else {
      if (selectedStudentIds.length === 0) {
        addToast('warning', 'Selection Required', 'Please select at least one student for bulk preview.');
        return;
      }
      if (!validateFormFields()) return;
      setActiveTab('preview');
    }
  };

  // Click handler for Generate button
  const handleGenerateClick = () => {
    if (!selectedTypeId) {
      addToast('warning', 'Selection Required', 'Please select a certificate type.');
      return;
    }
    if (generationMode === 'single') {
      if (!selectedStudent) {
        addToast('warning', 'Selection Required', 'Please select a student to issue certificate.');
        return;
      }
      if (!validateFormFields()) return;
      handleGenerateSingleCertificate();
    } else {
      if (selectedStudentIds.length === 0) {
        addToast('warning', 'Selection Required', 'Please select at least one student for bulk generation.');
        return;
      }
      if (!validateFormFields()) return;
      setIsConfirmModalOpen(true);
    }
  };

  // Single Certificate Generation Execution
  const handleGenerateSingleCertificate = () => {
    if (!selectedStudent) return;
    const studentFullName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;

    const newRecord: GeneratedCertificateRecord = {
      id: existingRecord?.id || `REC-CERT-${Date.now()}`,
      certificateNumber: generatedCertNo,
      certificateTypeId: selectedTypeConfig?.id || 'CT-TC',
      certificateTypeName: selectedTypeConfig?.name || 'Certificate',
      studentId: selectedStudent.id,
      admissionNo: selectedStudent.admissionNo,
      studentName: studentFullName,
      className: selectedStudent.className,
      section: selectedStudent.section,
      academicYear: activeAY,
      branch: selectedStudent.branch || selectedBranch || '',
      issueDate: certificateSpecificData.issueDate || certificateSpecificData.dateOfLeaving || todayStr,
      status: 'Issued',
      generatedBy: 'Authorized Administrator',
      remarks: certificateSpecificData.remarks || certificateSpecificData.specialRemarks || '',
      leavingDate: certificateSpecificData.dateOfLeaving || certificateSpecificData.leavingDate,
      reason: certificateSpecificData.reasonForLeaving || certificateSpecificData.reason || certificateSpecificData.purpose,
      conduct: certificateSpecificData.generalConduct || certificateSpecificData.conduct,
      tcNo: generatedCertNo,
      fieldDataSnapshot: {
        ...certificateSpecificData,
        studentName: studentFullName,
        admissionNumber: selectedStudent.admissionNo,
        class: selectedStudent.className,
        section: selectedStudent.section,
        academicYear: activeAY,
        dateOfBirth: selectedStudent.dob,
        fatherName: selectedStudent.parentName || '—',
        dateOfAdmission: selectedStudent.joiningDate,
        certificateNumber: generatedCertNo,
        issueDate: certificateSpecificData.issueDate || todayStr
      },
      templateSnapshot: selectedTemplate
    };

    // Save to database & localStorage
    try {
      if (saveGeneratedCertificates) {
        saveGeneratedCertificates([newRecord]);
      } else {
        const saved = localStorage.getItem('edu_db_generated_certificates');
        let records: GeneratedCertificateRecord[] = saved ? JSON.parse(saved) : [];
        records = [newRecord, ...records.filter(r => r.id !== newRecord.id)];
        localStorage.setItem('edu_db_generated_certificates', JSON.stringify(records));
      }
      
      if (selectedTypeConfig?.name === 'Transfer Certificate' || selectedTypeConfig?.code === 'TC') {
        const legacyTcRecords = localStorage.getItem('edu_db_tc_register');
        let tcList = legacyTcRecords ? JSON.parse(legacyTcRecords) : [];
        tcList = [newRecord, ...tcList.filter((r: any) => r.id !== newRecord.id)];
        localStorage.setItem('edu_db_tc_register', JSON.stringify(tcList));
      }
    } catch (e) {
      console.error('Failed to save generated certificate record', e);
    }

    addToast('success', 'Certificate Generated', `Generated ${selectedTypeConfig?.name || 'Certificate'} #${generatedCertNo} for ${studentFullName}`);
    setIssuedSingleRecord(newRecord);
    if (onSuccess) onSuccess(newRecord);
    setActiveTab('preview');
  };

  // Bulk Certificate Generation Execution
  const handleExecuteBulkGeneration = () => {
    setIsConfirmModalOpen(false);
    if (selectedBulkStudents.length === 0) return;

    const prefix = selectedTypeConfig?.numberingPrefix || 'CERT';
    const length = selectedTypeConfig?.numberingLength || 4;
    const extractedYear = activeAY.match(/\d{4}/)?.[0] || new Date().getFullYear().toString();
    const yearPart = selectedTypeConfig?.includeAcademicYearInNo ? `-${extractedYear}-` : '-';

    let existingCount = 0;
    let savedCertRecords: GeneratedCertificateRecord[] = [];
    let legacyTcRecords: any[] = [];

    try {
      const saved = localStorage.getItem('edu_db_generated_certificates');
      if (saved) savedCertRecords = JSON.parse(saved);
      existingCount = savedCertRecords.filter(r => r.certificateTypeId === selectedTypeConfig?.id).length;

      const savedTc = localStorage.getItem('edu_db_tc_register');
      if (savedTc) legacyTcRecords = JSON.parse(savedTc);
    } catch (e) {}

    const newIssuedList: GeneratedCertificateRecord[] = [];
    const failedList: { studentName: string; reason: string }[] = [];

    selectedBulkStudents.forEach((st, idx) => {
      try {
        const certSeq = existingCount + idx + 1;
        const certNo = `${prefix}${yearPart}${String(certSeq).padStart(length, '0')}`;
        const studentFullName = `${st.firstName} ${st.lastName}`;

        const studentSpecificImported = importedStudentDataMap[st.id] || {};
        const effectiveData = { ...certificateSpecificData, ...studentSpecificImported };

        const rec: GeneratedCertificateRecord = {
          id: `REC-CERT-${Date.now()}-${idx}-${st.id}`,
          certificateNumber: certNo,
          certificateTypeId: selectedTypeConfig?.id || 'CT-TC',
          certificateTypeName: selectedTypeConfig?.name || 'Certificate',
          studentId: st.id,
          admissionNo: st.admissionNo,
          studentName: studentFullName,
          className: st.className,
          section: st.section,
          academicYear: activeAY,
          branch: st.branch || selectedBranch || '',
          issueDate: effectiveData.issueDate || effectiveData.dateOfLeaving || todayStr,
          status: 'Issued',
          generatedBy: 'Authorized Administrator (Bulk Issue)',
          remarks: effectiveData.remarks || effectiveData.specialRemarks || '',
          leavingDate: effectiveData.dateOfLeaving || effectiveData.leavingDate,
          reason: effectiveData.reasonForLeaving || effectiveData.reason || effectiveData.purpose,
          conduct: effectiveData.generalConduct || effectiveData.conduct,
          tcNo: certNo,
          fieldDataSnapshot: {
            ...effectiveData,
            studentName: studentFullName,
            admissionNumber: st.admissionNo,
            class: st.className,
            section: st.section,
            academicYear: activeAY,
            dateOfBirth: st.dob,
            fatherName: st.parentName || st.fatherName || '—',
            motherName: st.motherName || '—',
            dateOfAdmission: effectiveData.dateOfAdmission || st.joiningDate || st.admissionDate,
            certificateNumber: certNo,
            issueDate: effectiveData.issueDate || todayStr
          },
          templateSnapshot: selectedTemplate
        };

        newIssuedList.push(rec);
      } catch (err: any) {
        failedList.push({
          studentName: `${st.firstName} ${st.lastName}`,
          reason: err.message || 'Unknown generation error'
        });
      }
    });

    // Save batch to database & localStorage
    try {
      savedCertRecords = [...newIssuedList, ...savedCertRecords];
      if (saveGeneratedCertificates) {
        saveGeneratedCertificates(newIssuedList);
      } else {
        localStorage.setItem('edu_db_generated_certificates', JSON.stringify(savedCertRecords));
      }

      if (selectedTypeConfig?.name === 'Transfer Certificate' || selectedTypeConfig?.code === 'TC') {
        legacyTcRecords = [...newIssuedList, ...legacyTcRecords];
        localStorage.setItem('edu_db_tc_register', JSON.stringify(legacyTcRecords));
      }
    } catch (e) {
      console.error('Failed to save bulk generated certificate records', e);
    }

    setBatchIssuedRecords(newIssuedList);
    setBatchFailedList(failedList);
    setIsBatchCompletedShow(true);

    addToast(
      'success',
      'Bulk Generation Completed',
      `Issued ${newIssuedList.length} ${selectedTypeConfig?.name || 'Certificate'} certificates successfully.`
    );

    if (onSuccess && newIssuedList[0]) onSuccess(newIssuedList[0]);
    setActiveTab('preview');
  };

  const handlePrint = () => {
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in printable-cert-modal-backdrop">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm !important;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          .no-print,
          .no-print * {
            display: none !important;
          }
          .printable-cert-modal-backdrop {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            filter: none !important;
            backdrop-filter: none !important;
            transform: none !important;
          }
          .printable-cert-modal-card {
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
          }
          #printable-certificate-root,
          #printable-certificate-root * {
            visibility: visible !important;
          }
          #printable-certificate-root {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            color: #000000 !important;
            overflow: visible !important;
            display: block !important;
          }
          #printable-certificate {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-certificate[data-border-style="Classic Double Border"] {
            border: 8px double var(--cert-theme-color, #1e3a8a) !important;
            border-radius: 8px !important;
          }
          #printable-certificate[data-border-style="Modern Minimalist"] {
            border: 2px solid var(--cert-theme-color, #1e3a8a) !important;
            border-radius: 12px !important;
          }
          #printable-certificate[data-border-style="Royal Gold Crest"] {
            border: 3px solid var(--cert-theme-color, #1e3a8a) !important;
            outline: 3px double #d97706 !important;
            outline-offset: -10px !important;
            border-radius: 4px !important;
          }
          #printable-certificate[data-border-style="Executive Slate"] {
            border: 4px solid #334155 !important;
            border-radius: 8px !important;
          }
          .printable-batch-container > div {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .printable-batch-container > div:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[95vh] flex flex-col printable-cert-modal-card">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                {existingRecord 
                  ? `Certificate Details: #${existingRecord.certificateNumber}` 
                  : generationMode === 'bulk'
                    ? 'Bulk Certificate Generation & Batch Issue'
                    : 'Generate Official School Certificate'
                }
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher Toggle Pill */}
            {!existingRecord && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setGenerationMode('single');
                    setActiveTab('form');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    generationMode === 'single'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Single
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGenerationMode('bulk');
                    setActiveTab('form');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    generationMode === 'bulk'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Bulk
                </button>
              </div>
            )}

            {/* Form vs Preview Tab */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'form' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Configuration Form
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'preview' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Certificate Preview
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div ref={modalContentRef} className="flex-1 overflow-y-auto pr-1 space-y-4 print:overflow-visible print:p-0">
          {/* FORM TAB */}
          <div className={`space-y-5 no-print ${activeTab === 'form' ? 'block' : 'hidden'}`}>
            {/* SINGLE vs BULK SELECTION AREA */}
              {generationMode === 'single' ? (
                /* SINGLE STUDENT MODE SELECTION */
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative ${isStudentDropdownOpen ? 'z-30' : 'z-10'}`}>
                  <div className={`relative ${isStudentDropdownOpen ? 'z-30' : 'z-10'}`}>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      1. Select Student <span className="text-rose-500 font-bold ml-0.5">*</span></label>

                    <div className="relative z-30" ref={studentDropdownRef}>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />

                        <input
                          type="text"
                          disabled={!!existingRecord}
                          placeholder="-- Search / Select Student --"
                          value={
                            isStudentDropdownOpen
                              ? studentSearchQuery
                              : selectedStudent
                                ? `${selectedStudent.firstName} ${selectedStudent.lastName} (Adm No: ${selectedStudent.admissionNo || (selectedStudent as any).admissionNumber || selectedStudent.id}) — ${formatClassDisplayName(selectedStudent.className, selectedStudent.section)}`
                                : studentSearchQuery
                          }
                          onFocus={() => {
                            if (!existingRecord) {
                              setIsStudentDropdownOpen(true);
                              if (selectedStudent) {
                                setStudentSearchQuery(`${selectedStudent.firstName} ${selectedStudent.lastName}`);
                              }
                            }
                          }}
                          onChange={(e) => {
                            setStudentSearchQuery(e.target.value);
                            if (!isStudentDropdownOpen) setIsStudentDropdownOpen(true);
                          }}
                          className={`w-full pl-8 pr-12 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white outline-none transition-all ${
                            isStudentDropdownOpen ? 'ring-2 ring-sky-500/20 border-sky-500' : 'border-slate-200 dark:border-slate-700'
                          } ${existingRecord ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
                        />

                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                          {(selectedStudent || studentSearchQuery) && !existingRecord && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentId('');
                                setStudentSearchQuery('');
                              }}
                              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Clear Selection"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!existingRecord) {
                                setIsStudentDropdownOpen(prev => !prev);
                              }
                            }}
                            className="p-0.5 text-slate-400 cursor-pointer"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${isStudentDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Options List Popover */}
                      {isStudentDropdownOpen && !existingRecord && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in p-1">
                          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                            <div
                              onClick={() => {
                                setSelectedStudentId('');
                                setIsStudentDropdownOpen(false);
                                setStudentSearchQuery('');
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                                !selectedStudentId
                                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold'
                                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              -- Search / Select Student --
                            </div>

                            {filteredSingleStudentOptions.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                No matching students found for "{studentSearchQuery}"
                              </div>
                            ) : (
                              filteredSingleStudentOptions.map((s) => {
                                const isSelected = s.id === selectedStudentId;
                                const formattedClass = formatClassDisplayName(s.className, s.section);

                                return (
                                  <div
                                    key={s.id}
                                    onClick={() => {
                                      setSelectedStudentId(s.id);
                                      setIsStudentDropdownOpen(false);
                                      setStudentSearchQuery('');
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    <div className="truncate">
                                      <span className="font-bold">{s.firstName} {s.lastName}</span>{' '}
                                      <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400 font-semibold">(Adm No: {s.admissionNo || (s as any).admissionNumber || s.id})</span>
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-400 shrink-0 ml-2">
                                      {formattedClass}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      2. Select Certificate Type <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                    <select
                      disabled={!!existingRecord}
                      value={selectedTypeId}
                      onChange={e => setSelectedTypeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="">-- Select Certificate Type --</option>
                      {certificateTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* BULK MODE CLASS & SECTION SELECTION */
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                        1. Select Class <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                      <select
                        value={selectedBulkClass}
                        onChange={e => handleBulkClassChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="">-- Select Class --</option>
                        {sortedClasses.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                        2. Select Section <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                      <select
                        disabled={!selectedBulkClass}
                        value={selectedBulkSection}
                        onChange={e => handleBulkSectionChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">-- Select Section --</option>
                        <option value="ALL">All Sections</option>
                        {availableBulkSections.map(sec => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                        3. Certificate Type <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                      <select
                        value={selectedTypeId}
                        onChange={e => setSelectedTypeId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="">-- Select Certificate Type --</option>
                        {certificateTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* BULK STUDENT MULTI-SELECTION LIST */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          disabled={!selectedBulkClass || !selectedBulkSection}
                          placeholder="Search student by name, adm no, roll no..."
                          value={bulkSearchQuery}
                          onChange={e => setBulkSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none font-medium disabled:opacity-50"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-extrabold text-xs border border-sky-200 dark:border-sky-800">
                          Selected: {selectedStudentIds.length} / {bulkFilteredStudents.length} Students
                        </span>
                      </div>
                    </div>

                    {/* Student Selectable Table */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                      {!selectedBulkClass ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-medium">
                          -- Please select Class & Section above to view student list --
                        </div>
                      ) : !selectedBulkSection ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-medium">
                          -- Please select Section above to view student list --
                        </div>
                      ) : bulkFilteredStudents.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-medium">
                          No students found matching current filters ({selectedBulkClass} {selectedBulkSection !== 'ALL' ? `Sec ${selectedBulkSection}` : ''})
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                              <tr>
                                <th className="p-3 w-10 text-center">
                                  <IndeterminateCheckbox
                                    checked={isAllSelected}
                                    indeterminate={isSomeSelected}
                                    onChange={handleToggleSelectAllBulk}
                                    title="Select All Displayed Students"
                                  />
                                </th>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Admission Number</th>
                                <th className="p-3">Class & Section</th>
                                <th className="p-3 whitespace-nowrap min-w-[5.5rem]">Roll No</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {bulkFilteredStudents.map(s => {
                                const isChecked = selectedStudentIds.includes(s.id);
                                return (
                                  <tr
                                    key={s.id}
                                    onClick={() => handleToggleStudentSelection(s.id)}
                                    className={`cursor-pointer transition-colors ${
                                      isChecked
                                        ? 'bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white font-bold'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleStudentSelection(s.id)}
                                        className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer accent-sky-600"
                                      />
                                    </td>
                                    <td className="p-3 font-extrabold">{s.firstName} {s.lastName}</td>
                                    <td className="p-3 font-mono text-sky-600 dark:text-sky-400 font-bold">{s.admissionNo || (s as any).admissionNumber || s.id}</td>
                                    <td className="p-3">{s.className} - {s.section}</td>
                                    <td className="p-3 font-mono whitespace-nowrap min-w-[5.5rem]">{s.rollNo || '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BULK DATA IMPORT SECTION (EXCEL TEMPLATE & UPLOAD) */}
              {generationMode === 'bulk' && (
                <ExcelBulkImportSection
                  selectedBulkStudents={selectedBulkStudents}
                  selectedTypeConfig={selectedTypeConfig}
                  activeAY={activeAY}
                  uploadedFile={uploadedExcelFile}
                  validationSummary={excelValidationSummary}
                  isExcelModeActive={isExcelModeActive}
                  isParsing={isParsingExcel}
                  onDownloadTemplate={handleDownloadTemplate}
                  onFileUpload={handleFileUpload}
                  onClearImport={handleClearImport}
                  onOpenValidationModal={() => setShowValidationModal(true)}
                  onOpenStagingModal={() => setShowStagingReviewModal(true)}
                  onDownloadErrorReport={handleDownloadErrorReport}
                />
              )}

              {/* Single Student Summary Badge when selected in Single Mode */}
              {generationMode === 'single' && selectedStudent && (
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/50 flex flex-wrap items-center justify-between gap-3 text-xs relative z-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center">
                      {selectedStudent.firstName[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Admission No: {selectedStudent.admissionNo || (selectedStudent as any).admissionNumber || selectedStudent.id} • {formatClassDisplayName(selectedStudent.className, selectedStudent.section)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <p>DOB: {formatDateDDMMYYYY(selectedStudent.dob)}</p>
                    <p>Session: <strong>{activeAY}</strong></p>
                  </div>
                </div>
              )}

              {/* Dynamic Certificate-Specific Fields Section (Single Mode Only) */}
              {generationMode === 'single' && (
                <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 relative z-0">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      3. Certificate Specific Fields & Remarks ({selectedTypeConfig?.name || 'Certificate'})
                    </h4>
                    <span className="text-[11px] font-mono text-sky-600 font-bold">
                      Auto Cert No: {generatedCertNo}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {activeFields.map((field) => {
                    const isFullWidth = field.type === 'textarea' || (field.label && field.label.length > 35);
                    const value = certificateSpecificData[field.key] ?? '';
                    const error = validationErrors[field.key];

                    const isToDateField = field.type === 'date' && (field.key === 'studyToDate' || field.key === 'toDate' || field.key.toLowerCase().includes('todate'));
                    const isFromDateField = field.type === 'date' && (field.key === 'studyFromDate' || field.key === 'fromDate' || field.key.toLowerCase().includes('fromdate'));

                    const matchingFromKey = isToDateField
                      ? (field.key === 'studyToDate' ? 'studyFromDate' : (field.key === 'toDate' ? 'fromDate' : activeFields.find(o => o.key.toLowerCase() === field.key.toLowerCase().replace('todate', 'fromdate'))?.key))
                      : undefined;
                    const matchingToKey = isFromDateField
                      ? (field.key === 'studyFromDate' ? 'studyToDate' : (field.key === 'fromDate' ? 'toDate' : activeFields.find(o => o.key.toLowerCase() === field.key.toLowerCase().replace('fromdate', 'todate'))?.key))
                      : undefined;

                    const matchingFromVal = matchingFromKey ? certificateSpecificData[matchingFromKey] : undefined;
                    const matchingToVal = matchingToKey ? certificateSpecificData[matchingToKey] : undefined;

                    // Min date for To-Date (must be after From-Date)
                    const computedMin = (() => {
                      if (isToDateField && matchingFromVal) {
                        const d = new Date(matchingFromVal);
                        if (!isNaN(d.getTime())) {
                          d.setDate(d.getDate() + 1);
                          return d.toISOString().split('T')[0];
                        }
                      }
                      return undefined;
                    })();

                    // Max date for From-Date (cannot be future date AND cannot be on or after To-Date)
                    const computedMax = (() => {
                      if (field.type !== 'date') return undefined;
                      if (isFromDateField && matchingToVal) {
                        const d = new Date(matchingToVal);
                        if (!isNaN(d.getTime())) {
                          d.setDate(d.getDate() - 1);
                          const dayBefore = d.toISOString().split('T')[0];
                          return dayBefore < todayStr ? dayBefore : todayStr;
                        }
                      }
                      return todayStr;
                    })();

                    return (
                      <div key={field.key} className={isFullWidth ? 'sm:col-span-2' : ''}>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                          {field.label} {field.required && <span className="text-rose-500 font-black">*</span>}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            rows={2}
                            value={value}
                            disabled={!!existingRecord}
                            onChange={(e) => {
                              setCertificateSpecificData(prev => ({ ...prev, [field.key]: e.target.value }));
                              if (validationErrors[field.key]) {
                                setValidationErrors(prev => ({ ...prev, [field.key]: '' }));
                              }
                            }}
                            placeholder={field.placeholder || `Enter ${field.label}...`}
                            className={`w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none transition-all ${
                              error ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                        ) : field.type === 'dropdown' ? (
                          <select
                            value={value}
                            disabled={!!existingRecord}
                            onChange={(e) => {
                              setCertificateSpecificData(prev => ({ ...prev, [field.key]: e.target.value }));
                              if (validationErrors[field.key]) {
                                setValidationErrors(prev => ({ ...prev, [field.key]: '' }));
                              }
                            }}
                            className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none transition-all ${
                              error ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <option value="">-- Select {field.label} --</option>
                            {(field.options || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'date' ? (
                          <DateInput
                            value={value}
                            disabled={!!existingRecord}
                            min={computedMin}
                            max={computedMax}
                            separator="/"
                            placeholder="DD/MM/YYYY"
                            disableClamping={true}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              if (newVal && newVal > todayStr) {
                                setValidationErrors(prev => ({
                                  ...prev,
                                  [field.key]: `${field.label} cannot be a future date.`
                                }));
                              } else if (isToDateField) {
                                if (newVal && matchingFromVal && newVal <= matchingFromVal) {
                                  const fromLabel = activeFields.find(o => o.key === matchingFromKey)?.label || 'From Date';
                                  setValidationErrors(prev => ({
                                    ...prev,
                                    [field.key]: `${field.label} cannot be on or before ${fromLabel}.`
                                  }));
                                } else {
                                  setValidationErrors(prev => ({ ...prev, [field.key]: '' }));
                                }
                              } else if (isFromDateField) {
                                if (newVal && matchingToVal && matchingToVal <= newVal) {
                                  const toLabel = activeFields.find(o => o.key === matchingToKey)?.label || 'To Date';
                                  setValidationErrors(prev => ({
                                    ...prev,
                                    [matchingToKey!]: `${toLabel} cannot be on or before ${field.label}.`
                                  }));
                                } else if (matchingToKey && matchingToVal && matchingToVal > newVal) {
                                  setValidationErrors(prev => ({ ...prev, [matchingToKey]: '' }));
                                }
                                setValidationErrors(prev => ({ ...prev, [field.key]: '' }));
                              } else if (validationErrors[field.key]) {
                                setValidationErrors(prev => ({ ...prev, [field.key]: '' }));
                              }
                              setCertificateSpecificData(prev => ({ ...prev, [field.key]: newVal }));
                            }}
                            className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none transition-all ${
                              error ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={value}
                            disabled={!!existingRecord}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              if (validationErrors[field.key]) {
                                setValidationErrors(prev => ({ ...prev, [field.key]: '' }));
                              }
                              setCertificateSpecificData(prev => ({ ...prev, [field.key]: newVal }));
                            }}
                            placeholder={field.placeholder || `Enter ${field.label}...`}
                            className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none transition-all ${
                              error ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                        )}

                        {error && (
                          <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" /> {error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PREVIEW TAB */}
          <div className={`space-y-4 ${activeTab === 'preview' ? 'block' : 'hidden print:block'}`}>
            {generationMode === 'bulk' && selectedBulkStudents.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-50 dark:bg-sky-950/40 p-3 rounded-2xl border border-sky-200 dark:border-sky-800 no-print">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-sky-900 dark:text-sky-200">
                    Previewing {bulkPreviewIndex + 1} of {selectedBulkStudents.length} selected students ({previewStudentForBulk?.firstName} {previewStudentForBulk?.lastName} - {previewStudentForBulk?.admissionNo || (previewStudentForBulk as any)?.admissionNumber || previewStudentForBulk?.id})
                  </span>
                  {isExcelModeActive && previewStudentForBulk && importedStudentDataMap[previewStudentForBulk.id] && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Excel Individual Data
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isExcelModeActive && (
                    <button
                      type="button"
                      onClick={() => setShowStagingReviewModal(true)}
                      className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Student Data</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={bulkPreviewIndex === 0}
                    onClick={() => setBulkPreviewIndex(prev => Math.max(0, prev - 1))}
                    className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    ‹ Previous
                  </button>
                  <button
                    type="button"
                    disabled={bulkPreviewIndex >= selectedBulkStudents.length - 1}
                    onClick={() => setBulkPreviewIndex(prev => Math.min(selectedBulkStudents.length - 1, prev + 1))}
                    className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl no-print">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rendering Preview for {selectedTypeConfig?.name || 'Certificate'} {generationMode === 'bulk' ? `(${selectedBulkStudents.length} Batch Certificates)` : `(${generatedCertNo})`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Preview
                </button>
              </div>
            </div>

            {/* Certificate Preview Container */}
            <div
              id="printable-certificate-root"
              className="glass-card p-4 rounded-3xl bg-slate-200 dark:bg-slate-950 overflow-x-auto print:bg-transparent print:p-0 print:border-none print:shadow-none print:overflow-visible"
            >
                {generationMode === 'bulk' && isBatchCompletedShow && batchIssuedRecords.length > 0 ? (
                  <PrintableBatchCertificatesContainer
                    records={batchIssuedRecords}
                    schoolProfile={schoolProfile}
                  />
                ) : (
                  (() => {
                    const activeBulkStudentData = (generationMode === 'bulk' && previewStudentForBulk && importedStudentDataMap[previewStudentForBulk.id])
                      ? { ...certificateSpecificData, ...importedStudentDataMap[previewStudentForBulk.id] }
                      : certificateSpecificData;

                    return (
                      <PrintableCertificateContainer
                        template={selectedTemplate}
                        schoolProfile={schoolProfile}
                        academicYear={activeAY}
                        studentName={
                          generationMode === 'bulk'
                            ? previewStudentForBulk ? `${previewStudentForBulk.firstName} ${previewStudentForBulk.lastName}`.trim() : ''
                            : selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}`.trim() : ''
                        }
                        admissionNo={
                          generationMode === 'bulk'
                            ? previewStudentForBulk?.admissionNo || ''
                            : selectedStudent?.admissionNo || ''
                        }
                        admissionDate={
                          generationMode === 'bulk'
                            ? activeBulkStudentData.dateOfAdmission || previewStudentForBulk?.joiningDate || ''
                            : certificateSpecificData.dateOfAdmission || selectedStudent?.joiningDate || ''
                        }
                        fatherName={
                          generationMode === 'bulk'
                            ? activeBulkStudentData.fatherName || previewStudentForBulk?.parentName || previewStudentForBulk?.fatherName || ''
                            : selectedStudent?.parentName || selectedStudent?.fatherName || ''
                        }
                        motherName={
                          generationMode === 'bulk'
                            ? activeBulkStudentData.motherName || (previewStudentForBulk as any)?.motherName || ''
                            : (selectedStudent as any)?.motherName || ''
                        }
                        dob={
                          generationMode === 'bulk'
                            ? previewStudentForBulk?.dob || ''
                            : selectedStudent?.dob || ''
                        }
                        dobInWords={activeBulkStudentData.dobInWords || ''}
                        gender={
                          generationMode === 'bulk'
                            ? previewStudentForBulk?.gender || ''
                            : selectedStudent?.gender || ''
                        }
                        className={
                          generationMode === 'bulk'
                            ? previewStudentForBulk?.className || selectedBulkClass || (academicClasses && academicClasses[0] ? academicClasses[0].name : '')
                            : selectedStudent?.className || (academicClasses && academicClasses[0] ? academicClasses[0].name : '')
                        }
                        section={
                          generationMode === 'bulk'
                            ? previewStudentForBulk?.section || ''
                            : selectedStudent?.section || ''
                        }
                        rollNo={
                          generationMode === 'bulk'
                            ? previewStudentForBulk?.rollNo || ''
                            : selectedStudent?.rollNo || ''
                        }
                        leavingDate={activeBulkStudentData.dateOfLeaving || activeBulkStudentData.leavingDate || ''}
                        reason={activeBulkStudentData.reasonForLeaving || activeBulkStudentData.reason || activeBulkStudentData.purpose || ''}
                        conduct={activeBulkStudentData.generalConduct || activeBulkStudentData.conduct || ''}
                        remarks={activeBulkStudentData.specialRemarks || activeBulkStudentData.remarks || ''}
                        identificationMarks={activeBulkStudentData.identificationMarks || activeBulkStudentData.moleIdentification || ''}
                        moleIdentification={activeBulkStudentData.moleIdentification || activeBulkStudentData.identificationMarks || ''}
                        result="PASSED"
                        feeClearanceStatus={activeBulkStudentData.clearanceStatus === 'FULL DUES CLEARED' ? 'Full Dues Cleared' : (activeBulkStudentData.clearanceStatus || "Full Dues Cleared")}
                        certificateNumber={generatedCertNo}
                        tcNo={generatedCertNo}
                        issueDate={activeBulkStudentData.issueDate || activeBulkStudentData.dateOfLeaving || todayStr}
                        isDraftPreview={!existingRecord && !isBatchCompletedShow && !issuedSingleRecord}
                        fieldDataSnapshot={activeBulkStudentData}
                      />
                    );
                  })()
                )}
              </div>
            </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {activeTab === 'preview' && (
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                Back to Form
              </button>
            )}

            {activeTab === 'form' ? (
              <button
                type="button"
                onClick={handlePreviewClick}
                disabled={generationMode === 'bulk' && selectedStudentIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
            ) : !existingRecord && !isBatchCompletedShow && !issuedSingleRecord ? (
              <button
                type="button"
                onClick={handleGenerateClick}
                disabled={generationMode === 'bulk' && selectedStudentIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Award className="w-4 h-4" /> 
                {generationMode === 'bulk'
                  ? `Issue ${selectedStudentIds.length} Certificate${selectedStudentIds.length === 1 ? '' : 's'}`
                  : 'Issue'
                }
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG FOR BULK GENERATION */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Confirm Bulk Certificate Generation
                </h4>
                <p className="text-xs text-slate-500">
                  Please review batch details before issue.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 font-medium">Certificate Type:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{selectedTypeConfig?.name || 'Certificate'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 font-medium">Target Class & Section:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBulkClass} - Section {selectedBulkSection}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 font-medium">Students Selected:</span>
                <span className="font-extrabold text-sky-600 dark:text-sky-400">{selectedStudentIds.length} Students</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 font-medium">Data Source:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {isExcelModeActive && Object.keys(importedStudentDataMap).length > 0
                    ? `Excel Import (${Object.keys(importedStudentDataMap).length} Individual Records)`
                    : 'Manual Common Form'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Date of Issue:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatDateDDMMYYYY(certificateSpecificData.issueDate || certificateSpecificData.dateOfLeaving || todayStr)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkGeneration}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Award className="w-4 h-4" /> Confirm & Issue {selectedStudentIds.length} Certificates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Validation Details Modal */}
      <ExcelValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        summary={excelValidationSummary}
        onDownloadErrorReport={handleDownloadErrorReport}
        onProceedToReview={() => {
          setShowValidationModal(false);
          setShowStagingReviewModal(true);
        }}
      />

      {/* Excel Staging & Inline Data Editor Modal */}
      {selectedTypeConfig && (
        <ExcelStagingReviewModal
          isOpen={showStagingReviewModal}
          onClose={() => setShowStagingReviewModal(false)}
          selectedStudents={selectedBulkStudents}
          typeConfig={selectedTypeConfig}
          importedDataMap={importedStudentDataMap}
          onUpdateStudentData={handleUpdateStudentStagedData}
          onRemoveStudentFromBatch={handleRemoveStudentFromBatch}
          onProceedToPreview={() => {
            setShowStagingReviewModal(false);
            setActiveTab('preview');
          }}
          onDownloadErrorReport={handleDownloadErrorReport}
          hasErrors={(excelValidationSummary?.errorCount || 0) > 0}
        />
      )}
    </div>
  );
};
