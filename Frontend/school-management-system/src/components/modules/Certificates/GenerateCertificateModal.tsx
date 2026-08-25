import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Printer, 
  Download, ArrowRight, Eye, Calendar, Award, Building2, User, UserCheck, RefreshCw,
  Search, ChevronDown, Users, Check, Minus
} from 'lucide-react';
import { 
  Student, GeneratedCertificateRecord, CertificateTypeConfig, CertificateTemplateConfig 
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { PrintableCertificateContainer, PrintableBatchCertificatesContainer } from './PrintableCertificateContainer';
import { INITIAL_CERTIFICATE_TYPES, INITIAL_CERTIFICATE_TEMPLATES } from '../Settings/CertificateSettingsTab';
import { getFieldsForCertificateType } from '../../../utils/certificateFields';
import { formatDateDDMMYYYY } from '../../../utils/dateValidation';
import { compareClassesAscending } from '../../../utils/classSorter';

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
  const { students, schoolProfile, academicClasses } = useData();
  const { selectedAcademicYear, selectedBranch } = useAuth();
  const { addToast } = useToast();
  const activeAY = selectedAcademicYear || '2026–2027';

  // Mode state: 'single' vs 'bulk'
  const [generationMode, setGenerationMode] = useState<'single' | 'bulk'>('single');

  // Load Certificate Types & Templates
  const certificateTypes = useMemo<CertificateTypeConfig[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CERTIFICATE_TYPES;
  }, [isOpen]);

  const certificateTemplates = useMemo<CertificateTemplateConfig[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_templates_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CERTIFICATE_TEMPLATES;
  }, [isOpen]);

  // Selected Student & Type State for Single Mode
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    existingRecord?.studentId || initialStudent?.id || ''
  );
  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    existingRecord?.certificateTypeId || initialCertificateType || certificateTypes[0]?.id || 'CT-TC'
  );

  // Single Student Search Dropdown State
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<boolean>(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Bulk Mode Selection States
  const [selectedBulkClass, setSelectedBulkClass] = useState<string>('');
  const [selectedBulkSection, setSelectedBulkSection] = useState<string>('ALL');
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState<number>(0);

  // Confirmation Modal State & Batch Completion Results
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [batchIssuedRecords, setBatchIssuedRecords] = useState<GeneratedCertificateRecord[]>([]);
  const [batchFailedList, setBatchFailedList] = useState<{ studentName: string; reason: string }[]>([]);
  const [isBatchCompletedShow, setIsBatchCompletedShow] = useState<boolean>(false);
  const [isPrintingBatch, setIsPrintingBatch] = useState<boolean>(false);

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
    if (!selectedBulkClass) return [];
    return students.filter(s => {
      const matchesClass = s.className === selectedBulkClass;
      const matchesSection = selectedBulkSection === 'ALL' || s.section === selectedBulkSection;
      
      const q = bulkSearchQuery.toLowerCase().trim();
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const admNo = (s.admissionNo || '').toLowerCase();
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
      const admNo = (s.admissionNo || '').toLowerCase();
      const cls = (s.className || '').toLowerCase();
      const sec = (s.section || '').toLowerCase();
      return fullName.includes(q) || admNo.includes(q) || cls.includes(q) || `${cls}-${sec}`.includes(q);
    });
  }, [students, studentSearchQuery]);

  useEffect(() => {
    if (existingRecord) {
      setSelectedStudentId(existingRecord.studentId);
      setSelectedTypeId(existingRecord.certificateTypeId);
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

  const selectedTypeConfig = useMemo(() => {
    return certificateTypes.find(t => t.id === selectedTypeId || t.name === selectedTypeId) || certificateTypes[0];
  }, [certificateTypes, selectedTypeId]);

  // Load configured dynamic fields for selected certificate type
  const activeFields = useMemo(() => {
    return getFieldsForCertificateType(selectedTypeConfig);
  }, [selectedTypeConfig]);

  // Dynamic Input Form State
  const [certificateSpecificData, setCertificateSpecificData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Initialize or reset dynamic form state when Certificate Type or Student changes
  useEffect(() => {
    if (existingRecord) {
      const snapshot = existingRecord.fieldDataSnapshot || {};
      setCertificateSpecificData({
        ...snapshot,
        dateOfLeaving: snapshot.dateOfLeaving || existingRecord.leavingDate || new Date().toISOString().split('T')[0],
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
          initialData[field.key] = new Date().toISOString().split('T')[0];
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
          initialData[field.key] = field.defaultValue;
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
  };

  const handleBulkSectionChange = (newSection: string) => {
    setSelectedBulkSection(newSection);
    setSelectedStudentIds([]);
    setBulkPreviewIndex(0);
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

  const selectedTemplate = useMemo(() => {
    if (existingRecord?.templateSnapshot) {
      return existingRecord.templateSnapshot;
    }
    const found = certificateTemplates.find(t => t.certificateTypeId === selectedTypeConfig?.id || t.certificateTypeName === selectedTypeConfig?.name);
    if (found) return found;

    return {
      id: `TPL-${selectedTypeConfig?.id}`,
      certificateTypeId: selectedTypeConfig?.id || 'CT-TC',
      certificateTypeName: selectedTypeConfig?.name || 'Certificate',
      title: (selectedTypeConfig?.name || 'CERTIFICATE').toUpperCase(),
      headerStyle: 'Classic Double Border' as const,
      themeColor: '#1e3a8a',
      showLogo: true,
      showSchoolHeader: true,
      bodyTemplate: `This is to certify that {{studentName}}, Admission No. {{admissionNumber}}, Class {{class}}, is a student of {{schoolName}}. Issued on {{issueDate}}.`,
      footerText: 'Official Certificate issued by School Authority.',
      signatories: [
        { id: '1', title: 'Class Teacher', show: true },
        { id: '2', title: 'Accounts Officer', show: true },
        { id: '3', title: 'Principal', name: 'Dr. Robert Miller', show: true }
      ],
      showSeal: true,
      dateFormat: 'DD/MM/YYYY'
    };
  }, [certificateTemplates, selectedTypeConfig, existingRecord]);

  // Calculate unique Certificate Number
  const generatedCertNo = useMemo(() => {
    if (existingRecord?.certificateNumber) return existingRecord.certificateNumber;
    const prefix = selectedTypeConfig?.numberingPrefix || 'CERT';
    const length = selectedTypeConfig?.numberingLength || 4;
    const yearPart = selectedTypeConfig?.includeAcademicYearInNo ? `-${activeAY.split('–')[0] || '2026'}-` : '-';
    
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
    const errors: Record<string, string> = {};
    activeFields.forEach(field => {
      if (field.required) {
        const val = certificateSpecificData[field.key];
        if (val === undefined || val === null || String(val).trim() === '') {
          errors[field.key] = `${field.label} is required.`;
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

  // Click handler for Generate button
  const handleGenerateClick = () => {
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
      certificateTypeId: selectedTypeConfig.id,
      certificateTypeName: selectedTypeConfig.name,
      studentId: selectedStudent.id,
      admissionNo: selectedStudent.admissionNo,
      studentName: studentFullName,
      className: selectedStudent.className,
      section: selectedStudent.section,
      academicYear: activeAY,
      branch: selectedStudent.branch || selectedBranch || 'Main Campus',
      issueDate: certificateSpecificData.issueDate || certificateSpecificData.dateOfLeaving || new Date().toISOString().split('T')[0],
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
        issueDate: certificateSpecificData.issueDate || new Date().toISOString().split('T')[0]
      },
      templateSnapshot: selectedTemplate
    };

    // Save to localStorage
    try {
      const saved = localStorage.getItem('edu_db_generated_certificates');
      let records: GeneratedCertificateRecord[] = saved ? JSON.parse(saved) : [];
      records = [newRecord, ...records.filter(r => r.id !== newRecord.id)];
      localStorage.setItem('edu_db_generated_certificates', JSON.stringify(records));
      
      if (selectedTypeConfig.name === 'Transfer Certificate' || selectedTypeConfig.code === 'TC') {
        const legacyTcRecords = localStorage.getItem('edu_db_tc_register');
        let tcList = legacyTcRecords ? JSON.parse(legacyTcRecords) : [];
        tcList = [newRecord, ...tcList.filter((r: any) => r.id !== newRecord.id)];
        localStorage.setItem('edu_db_tc_register', JSON.stringify(tcList));
      }
    } catch (e) {
      console.error('Failed to save generated certificate record', e);
    }

    addToast('success', 'Certificate Generated', `Generated ${selectedTypeConfig.name} #${generatedCertNo} for ${studentFullName}`);
    if (onSuccess) onSuccess(newRecord);
    setActiveTab('preview');
  };

  // Bulk Certificate Generation Execution
  const handleExecuteBulkGeneration = () => {
    setIsConfirmModalOpen(false);
    if (selectedBulkStudents.length === 0) return;

    const prefix = selectedTypeConfig?.numberingPrefix || 'CERT';
    const length = selectedTypeConfig?.numberingLength || 4;
    const yearPart = selectedTypeConfig?.includeAcademicYearInNo ? `-${activeAY.split('–')[0] || '2026'}-` : '-';

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

        const rec: GeneratedCertificateRecord = {
          id: `REC-CERT-${Date.now()}-${idx}-${st.id}`,
          certificateNumber: certNo,
          certificateTypeId: selectedTypeConfig.id,
          certificateTypeName: selectedTypeConfig.name,
          studentId: st.id,
          admissionNo: st.admissionNo,
          studentName: studentFullName,
          className: st.className,
          section: st.section,
          academicYear: activeAY,
          branch: st.branch || selectedBranch || 'Main Campus',
          issueDate: certificateSpecificData.issueDate || certificateSpecificData.dateOfLeaving || new Date().toISOString().split('T')[0],
          status: 'Issued',
          generatedBy: 'Authorized Administrator (Bulk Issue)',
          remarks: certificateSpecificData.remarks || certificateSpecificData.specialRemarks || '',
          leavingDate: certificateSpecificData.dateOfLeaving || certificateSpecificData.leavingDate,
          reason: certificateSpecificData.reasonForLeaving || certificateSpecificData.reason || certificateSpecificData.purpose,
          conduct: certificateSpecificData.generalConduct || certificateSpecificData.conduct,
          tcNo: certNo,
          fieldDataSnapshot: {
            ...certificateSpecificData,
            studentName: studentFullName,
            admissionNumber: st.admissionNo,
            class: st.className,
            section: st.section,
            academicYear: activeAY,
            dateOfBirth: st.dob,
            fatherName: st.parentName || '—',
            dateOfAdmission: st.joiningDate,
            certificateNumber: certNo,
            issueDate: certificateSpecificData.issueDate || new Date().toISOString().split('T')[0]
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

    // Save batch to localStorage
    try {
      savedCertRecords = [...newIssuedList, ...savedCertRecords];
      localStorage.setItem('edu_db_generated_certificates', JSON.stringify(savedCertRecords));

      if (selectedTypeConfig.name === 'Transfer Certificate' || selectedTypeConfig.code === 'TC') {
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
      `Issued ${newIssuedList.length} ${selectedTypeConfig.name} certificates successfully.`
    );

    if (onSuccess && newIssuedList[0]) onSuccess(newIssuedList[0]);
    setActiveTab('preview');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[95vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
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
              <p className="text-xs text-slate-500">
                {generationMode === 'bulk'
                  ? 'Select class, section, filter multiple students, enter common details, and batch issue.'
                  : 'Select student, certificate type, fill required details, and issue with unique snapshot.'
                }
              </p>
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
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'form' ? (
            <div className="space-y-5">
              {/* SINGLE vs BULK SELECTION AREA */}
              {generationMode === 'single' ? (
                /* SINGLE STUDENT MODE SELECTION */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="relative">
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      1. Select Student <span className="text-rose-500 font-bold ml-0.5">*</span></label>

                    <div className="relative" ref={studentDropdownRef}>
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
                                ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.admissionNo}) — ${formatClassDisplayName(selectedStudent.className, selectedStudent.section)}`
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
                                      <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400 font-semibold">({s.admissionNo})</span>
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
                          disabled={!selectedBulkClass}
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
                                <th className="p-3">Admission No.</th>
                                <th className="p-3">Class & Section</th>
                                <th className="p-3">Roll No</th>
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
                                    <td className="p-3 font-mono text-sky-600 dark:text-sky-400 font-bold">{s.admissionNo}</td>
                                    <td className="p-3">{s.className} - {s.section}</td>
                                    <td className="p-3 font-mono">{s.rollNo || '—'}</td>
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

              {/* Single Student Summary Badge when selected in Single Mode */}
              {generationMode === 'single' && selectedStudent && (
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center">
                      {selectedStudent.firstName[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Adm No: {selectedStudent.admissionNo} • {formatClassDisplayName(selectedStudent.className, selectedStudent.section)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <p>DOB: {formatDateDDMMYYYY(selectedStudent.dob)}</p>
                    <p>Session: <strong>{activeAY}</strong></p>
                  </div>
                </div>
              )}

              {/* Dynamic Certificate-Specific Fields Section */}
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    {generationMode === 'bulk' ? '4. Common Certificate Fields & Remarks' : '3. Certificate Specific Fields & Remarks'} ({selectedTypeConfig.name})
                  </h4>
                  <span className="text-[11px] font-mono text-sky-600 font-bold">
                    {generationMode === 'bulk' ? `Target Batch: ${selectedStudentIds.length} Students` : `Auto Cert No: ${generatedCertNo}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {activeFields.map((field) => {
                    const isFullWidth = field.type === 'textarea' || (field.label && field.label.length > 35);
                    const value = certificateSpecificData[field.key] ?? '';
                    const error = validationErrors[field.key];

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
                        ) : (
                          <input
                            type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                            value={value}
                            disabled={!!existingRecord}
                            onChange={(e) => {
                              setCertificateSpecificData(prev => ({ ...prev, [field.key]: e.target.value }));
                              if (validationErrors[field.key]) {
                                setValidationErrors(prev => ({ ...prev, [field.key]: '' }));
                              }
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
            </div>
          ) : (
            /* PREVIEW TAB */
            <div className="space-y-4">
              {generationMode === 'bulk' && selectedBulkStudents.length > 0 && (
                <div className="flex items-center justify-between bg-sky-50 dark:bg-sky-950/40 p-3 rounded-2xl border border-sky-200 dark:border-sky-800">
                  <span className="text-xs font-extrabold text-sky-900 dark:text-sky-200">
                    Previewing {bulkPreviewIndex + 1} of {selectedBulkStudents.length} selected students ({previewStudentForBulk?.firstName} {previewStudentForBulk?.lastName} - {previewStudentForBulk?.admissionNo})
                  </span>

                  <div className="flex items-center gap-2">
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

              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rendering Preview for {selectedTypeConfig.name} {generationMode === 'bulk' ? `(${selectedBulkStudents.length} Batch Certificates)` : `(${generatedCertNo})`}
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
              <div className="glass-card p-4 rounded-3xl bg-slate-200 dark:bg-slate-950 overflow-x-auto">
                {generationMode === 'bulk' && isBatchCompletedShow && batchIssuedRecords.length > 0 ? (
                  <PrintableBatchCertificatesContainer
                    records={batchIssuedRecords}
                    schoolProfile={schoolProfile}
                  />
                ) : (
                  <PrintableCertificateContainer
                    template={selectedTemplate}
                    schoolProfile={schoolProfile}
                    academicYear={activeAY}
                    studentName={
                      generationMode === 'bulk'
                        ? previewStudentForBulk ? `${previewStudentForBulk.firstName} ${previewStudentForBulk.lastName}` : 'Student Name'
                        : selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Rahul Kumar'
                    }
                    admissionNo={
                      generationMode === 'bulk'
                        ? previewStudentForBulk?.admissionNo || 'ADM-2024-001'
                        : selectedStudent?.admissionNo || 'ADM-2024-089'
                    }
                    admissionDate={
                      generationMode === 'bulk'
                        ? previewStudentForBulk?.joiningDate || '2024-06-15'
                        : selectedStudent?.joiningDate || '2024-06-15'
                    }
                    fatherName={
                      generationMode === 'bulk'
                        ? previewStudentForBulk?.parentName || 'Parent Name'
                        : selectedStudent?.parentName || 'Vikram Kumar'
                    }
                    motherName="Sunita Kumar"
                    dob={
                      generationMode === 'bulk'
                        ? previewStudentForBulk?.dob || '2012-08-15'
                        : selectedStudent?.dob || '2012-08-15'
                    }
                    gender={
                      generationMode === 'bulk'
                        ? previewStudentForBulk?.gender || 'Male'
                        : selectedStudent?.gender || 'Male'
                    }
                    className={
                      generationMode === 'bulk'
                        ? previewStudentForBulk?.className || selectedBulkClass || 'Class 11'
                        : selectedStudent?.className || 'Class 10'
                    }
                    section={
                      generationMode === 'bulk'
                        ? previewStudentForBulk?.section || 'A'
                        : selectedStudent?.section || 'A'
                    }
                    rollNo={
                      generationMode === 'bulk'
                        ? previewStudentForBulk?.rollNo || '1'
                        : selectedStudent?.rollNo || '12'
                    }
                    leavingDate={certificateSpecificData.dateOfLeaving || certificateSpecificData.leavingDate || ''}
                    reason={certificateSpecificData.reasonForLeaving || certificateSpecificData.reason || certificateSpecificData.purpose || ''}
                    conduct={certificateSpecificData.generalConduct || certificateSpecificData.conduct || ''}
                    remarks={certificateSpecificData.specialRemarks || certificateSpecificData.remarks || ''}
                    identificationMarks={certificateSpecificData.identificationMarks || certificateSpecificData.moleIdentification || ''}
                    moleIdentification={certificateSpecificData.moleIdentification || certificateSpecificData.identificationMarks || ''}
                    result="PASSED"
                    feeClearanceStatus="FULL DUES CLEARED"
                    certificateNumber={generatedCertNo}
                    tcNo={generatedCertNo}
                    issueDate={certificateSpecificData.issueDate || new Date().toISOString().split('T')[0]}
                    isDraftPreview={!existingRecord && !isBatchCompletedShow}
                    fieldDataSnapshot={certificateSpecificData}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>

            {!existingRecord && (
              <button
                onClick={handleGenerateClick}
                disabled={generationMode === 'bulk' && selectedStudentIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Award className="w-4 h-4" /> 
                {generationMode === 'bulk'
                  ? `Generate & Issue ${selectedStudentIds.length} Certificate${selectedStudentIds.length === 1 ? '' : 's'}`
                  : 'Generate & Issue Certificate'
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG FOR BULK GENERATION */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
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
                <span className="font-extrabold text-slate-900 dark:text-white">{selectedTypeConfig.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 font-medium">Target Class & Section:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBulkClass} - Section {selectedBulkSection}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 font-medium">Students Selected:</span>
                <span className="font-extrabold text-sky-600 dark:text-sky-400">{selectedStudentIds.length} Students</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Date of Issue:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatDateDDMMYYYY(certificateSpecificData.issueDate || new Date().toISOString().split('T')[0])}
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
    </div>
  );
};
