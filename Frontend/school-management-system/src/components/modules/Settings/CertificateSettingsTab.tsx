import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, Plus, Edit, Trash2, CheckCircle, XCircle, Search, SlidersHorizontal, 
  FileText, ShieldCheck, Eye, Save, Settings, Hash, Layout, RefreshCw, Check, Sparkles, Layers,
  Copy, ListChecks, CheckCircle2, HelpCircle, Upload, Image as ImageIcon, FileImage
} from 'lucide-react';
import { 
  CertificateTypeConfig, CertificateTemplateConfig, CertificateSignatory, SchoolProfile 
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { PrintableCertificateContainer } from '../Certificates/PrintableCertificateContainer';
import { ConfirmModal } from '../../common/ConfirmModal';

import { DEFAULT_CERTIFICATE_FIELDS_MAP } from '../../../utils/certificateFields';

export const INITIAL_CERTIFICATE_TYPES: CertificateTypeConfig[] = [
  {
    id: 'CT-TC',
    name: 'Transfer Certificate',
    code: 'TC',
    description: 'Official transfer certificate for students leaving the institution.',
    status: 'Active',
    displayOrder: 1,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'dateOfBirth', 'dateOfAdmission', 'dateOfLeaving', 'reasonForLeaving', 'conduct'],
    fields: DEFAULT_CERTIFICATE_FIELDS_MAP['CT-TC'],
    numberingPrefix: 'TC',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: true
  },
  {
    id: 'CT-BONAFIDE',
    name: 'Bonafide Certificate',
    code: 'BC',
    description: 'Certificate certifying current bonafide enrollment in school.',
    status: 'Active',
    displayOrder: 2,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'section', 'academicYear', 'issueDate'],
    fields: DEFAULT_CERTIFICATE_FIELDS_MAP['CT-BONAFIDE'],
    numberingPrefix: 'BC',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: true
  },
  {
    id: 'CT-STUDY',
    name: 'Study Certificate',
    code: 'SC',
    description: 'Proof of study duration and academic record in the school.',
    status: 'Active',
    displayOrder: 3,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'academicYear'],
    fields: DEFAULT_CERTIFICATE_FIELDS_MAP['CT-STUDY'],
    numberingPrefix: 'SC',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: true
  },
  {
    id: 'CT-CHARACTER',
    name: 'Character Certificate',
    code: 'CC',
    description: 'Evaluation of student moral conduct and character.',
    status: 'Active',
    displayOrder: 4,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'conduct'],
    fields: DEFAULT_CERTIFICATE_FIELDS_MAP['CT-CHARACTER'],
    numberingPrefix: 'CC',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: true
  },
  {
    id: 'CT-CONDUCT',
    name: 'Conduct Certificate',
    code: 'CD',
    description: 'Official record of student conduct and discipline.',
    status: 'Active',
    displayOrder: 5,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'conduct'],
    fields: DEFAULT_CERTIFICATE_FIELDS_MAP['CT-CONDUCT'],
    numberingPrefix: 'CD',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: true
  },
  {
    id: 'CT-FEE-CLEARANCE',
    name: 'Fee Clearance Certificate',
    code: 'FC',
    description: 'Verification of complete fee clearance across all academic terms.',
    status: 'Active',
    displayOrder: 6,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'academicYear'],
    fields: DEFAULT_CERTIFICATE_FIELDS_MAP['CT-FEE-CLEARANCE'],
    numberingPrefix: 'FC',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: true
  },
  {
    id: 'CT-ADMISSION',
    name: 'Admission Certificate',
    code: 'AC',
    description: 'Certificate confirming student admission and enrollment details.',
    status: 'Active',
    displayOrder: 7,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'dateOfAdmission'],
    fields: DEFAULT_CERTIFICATE_FIELDS_MAP['CT-ADMISSION'],
    numberingPrefix: 'AC',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: true
  },
  {
    id: 'CT-COURSE-COMPLETION',
    name: 'Course Completion Certificate',
    code: 'CCC',
    description: 'Certificate awarded upon completion of secondary or senior secondary course.',
    status: 'Active',
    displayOrder: 8,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'academicYear'],
    fields: DEFAULT_CERTIFICATE_FIELDS_MAP['CT-COURSE-COMPLETION'],
    numberingPrefix: 'CCC',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: true
  },
  {
    id: 'CT-LEAVING',
    name: 'Leaving Certificate',
    code: 'LC',
    description: 'Official school leaving certificate for educational departure.',
    status: 'Active',
    displayOrder: 9,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'dateOfLeaving', 'reasonForLeaving'],
    fields: DEFAULT_CERTIFICATE_FIELDS_MAP['CT-LEAVING'],
    numberingPrefix: 'LC',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: true
  },
  {
    id: 'CT-SPORTS',
    name: 'Custom Certificate',
    code: 'CUST',
    description: 'Custom certificate template for sports, achievements, or events.',
    status: 'Active',
    displayOrder: 10,
    requiredFields: ['studentName', 'admissionNumber', 'class', 'academicYear'],
    fields: [
      { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true, displayOrder: 1 },
      { key: 'purpose', label: 'Purpose', type: 'text', required: false, displayOrder: 2 },
      { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, displayOrder: 3 }
    ],
    numberingPrefix: 'CUST',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    isSystem: false
  }
];

export interface DynamicPlaceholderItem {
  id: string;
  placeholder: string;
  description: string;
  category: 'Student Info' | 'Academic' | 'School Details' | 'Certificate Info' | 'Custom';
  sampleValue?: string;
  isSystem?: boolean;
}

export const INITIAL_DYNAMIC_PLACEHOLDERS: DynamicPlaceholderItem[] = [
  { id: 'PH-1', placeholder: '{{studentName}}', description: 'Student Full Name', category: 'Student Info', sampleValue: 'Rahul Kumar', isSystem: true },
  { id: 'PH-2', placeholder: '{{admissionNumber}}', description: 'Admission / Reg Number', category: 'Student Info', sampleValue: 'ADM-2024-089', isSystem: true },
  { id: 'PH-3', placeholder: '{{class}}', description: 'Class Grade Name', category: 'Academic', sampleValue: 'Class 10', isSystem: true },
  { id: 'PH-4', placeholder: '{{section}}', description: 'Section', category: 'Academic', sampleValue: 'A', isSystem: true },
  { id: 'PH-5', placeholder: '{{academicYear}}', description: 'Current Academic Session', category: 'Academic', sampleValue: '2026–2027', isSystem: true },
  { id: 'PH-6', placeholder: '{{dateOfBirth}}', description: 'Date of Birth (DD/MM/YYYY)', category: 'Student Info', sampleValue: '15/08/2012', isSystem: true },
  { id: 'PH-7', placeholder: '{{gender}}', description: 'Gender', category: 'Student Info', sampleValue: 'Male', isSystem: true },
  { id: 'PH-8', placeholder: '{{fatherName}}', description: "Father's / Guardian Name", category: 'Student Info', sampleValue: 'Vikram Kumar', isSystem: true },
  { id: 'PH-9', placeholder: '{{motherName}}', description: "Mother's Name", category: 'Student Info', sampleValue: 'Sunita Kumar', isSystem: true },
  { id: 'PH-10', placeholder: '{{address}}', description: 'Residential Address', category: 'Student Info', sampleValue: '12 Executive Avenue, New York', isSystem: true },
  { id: 'PH-11', placeholder: '{{dateOfAdmission}}', description: 'Date of Admission', category: 'Academic', sampleValue: '15/06/2024', isSystem: true },
  { id: 'PH-12', placeholder: '{{dateOfLeaving}}', description: 'Date of Leaving', category: 'Academic', sampleValue: '14/08/2026', isSystem: true },
  { id: 'PH-13', placeholder: '{{reasonForLeaving}}', description: 'Reason for Leaving', category: 'Academic', sampleValue: 'Parent Relocation', isSystem: true },
  { id: 'PH-14', placeholder: '{{conduct}}', description: 'Conduct & Character Remark', category: 'Student Info', sampleValue: 'Good & Exemplary', isSystem: true },
  { id: 'PH-14B', placeholder: '{{moleIdentification}}', description: 'Mole / Personal Identification Marks', category: 'Student Info', sampleValue: '1. Mole on right cheek  2. Mole on left shoulder', isSystem: true },
  { id: 'PH-14C', placeholder: '{{Moles}}', description: 'Mole Identification Marks', category: 'Student Info', sampleValue: '1. Mole on right cheek  2. Mole on left shoulder', isSystem: true },
  { id: 'PH-15', placeholder: '{{schoolName}}', description: 'Name of Institution', category: 'School Details', sampleValue: "Pirnav Educational Institutions", isSystem: true },
  { id: 'PH-16', placeholder: '{{schoolAddress}}', description: 'Address of Institution', category: 'School Details', sampleValue: 'Knowledge City, NY 10001', isSystem: true },
  { id: 'PH-17', placeholder: '{{certificateNumber}}', description: 'Unique Serial Number', category: 'Certificate Info', sampleValue: 'TC-2026-0001', isSystem: true },
  { id: 'PH-18', placeholder: '{{issueDate}}', description: 'Date of Certificate Issue', category: 'Certificate Info', sampleValue: '14/08/2026', isSystem: true },
];

export const ALL_DYNAMIC_PLACEHOLDERS = INITIAL_DYNAMIC_PLACEHOLDERS.map(p => ({
  placeholder: p.placeholder,
  description: p.description
}));

export const INITIAL_CERTIFICATE_TEMPLATES: CertificateTemplateConfig[] = [
  {
    id: 'TPL-CT-TC',
    certificateTypeId: 'CT-TC',
    certificateTypeName: 'Transfer Certificate',
    title: 'OFFICIAL TRANSFER CERTIFICATE',
    headerStyle: 'Classic Double Border',
    themeColor: '#1e3a8a',
    showLogo: true,
    showSchoolHeader: true,
    bodyTemplate: `This is to certify that {{studentName}}, son/daughter of {{fatherName}} and {{motherName}}, bearing Admission No. {{admissionNumber}}, was admitted to this institution on {{dateOfAdmission}}. He/She last studied in Class {{class}} - Section {{section}} during the {{academicYear}} academic session. He/She has left the school on {{dateOfLeaving}} due to {{reasonForLeaving}}. His/Her general conduct during the period of study has been {{conduct}}. All school dues have been cleared.`,
    footerText: 'Official Transfer Certificate issued in accordance with School Education Rules.',
    signatories: [
      { id: 'sig-1', title: 'Class Teacher', name: 'Class Teacher', show: true },
      { id: 'sig-2', title: 'Verified By (Accounts)', name: 'Accounts Officer', show: true },
      { id: 'sig-3', title: 'Principal', name: 'Dr. Robert Miller', designation: 'Principal & Head of School', show: true }
    ],
    showSeal: true,
    dateFormat: 'DD/MM/YYYY'
  },
  {
    id: 'TPL-CT-BONAFIDE',
    certificateTypeId: 'CT-BONAFIDE',
    certificateTypeName: 'Bonafide Certificate',
    title: 'BONAFIDE STUDY CERTIFICATE',
    headerStyle: 'Modern Minimalist',
    themeColor: '#047857',
    showLogo: true,
    showSchoolHeader: true,
    bodyTemplate: `This is to certify that {{studentName}}, son/daughter of {{fatherName}}, bearing Admission No. {{admissionNumber}}, is a bonafide student of {{schoolName}}, currently studying in Class {{class}} - Section {{section}} for the Academic Session {{academicYear}}. To the best of our knowledge, his/her character and conduct are good. This certificate is issued upon request for official verification purposes.`,
    footerText: 'Valid for passport, bank, government, or scholarship verification.',
    signatories: [
      { id: 'sig-1', title: 'Class Teacher', show: true },
      { id: 'sig-2', title: 'Administrative Officer', show: true },
      { id: 'sig-3', title: 'Principal', name: 'Dr. Robert Miller', designation: 'Principal', show: true }
    ],
    showSeal: true,
    dateFormat: 'DD/MM/YYYY'
  },
  {
    id: 'TPL-CT-STUDY',
    certificateTypeId: 'CT-STUDY',
    certificateTypeName: 'Study Certificate',
    title: 'STUDY & CONDUCT CERTIFICATE',
    headerStyle: 'Royal Gold Crest',
    themeColor: '#b45309',
    showLogo: true,
    showSchoolHeader: true,
    bodyTemplate: `This is to certify that {{studentName}}, Admission No. {{admissionNumber}}, has continuously studied in {{schoolName}} in Class {{class}} during the academic year {{academicYear}}. His/Her date of birth as per school admission records is {{dateOfBirth}}. During his/her study period, his/her performance and discipline have been commendable.`,
    footerText: 'Issued for higher study application and educational verification.',
    signatories: [
      { id: 'sig-1', title: 'Class Teacher', show: true },
      { id: 'sig-2', title: 'Vice Principal', show: true },
      { id: 'sig-3', title: 'Principal', name: 'Dr. Robert Miller', show: true }
    ],
    showSeal: true,
    dateFormat: 'DD/MM/YYYY'
  },
  {
    id: 'TPL-CT-CHARACTER',
    certificateTypeId: 'CT-CHARACTER',
    certificateTypeName: 'Character Certificate',
    title: 'CHARACTER & CONDUCT CERTIFICATE',
    headerStyle: 'Executive Slate',
    themeColor: '#1e293b',
    showLogo: true,
    showSchoolHeader: true,
    bodyTemplate: `Certified that {{studentName}}, Admission No. {{admissionNumber}}, Class {{class}}, has been a student of this school during {{academicYear}}. During this period, he/she has displayed exemplary moral character, sound discipline, and polite demeanor towards teachers and fellow students. We wish him/her all success in future endeavors.`,
    footerText: 'Official character certificate issued for academic or employment purposes.',
    signatories: [
      { id: 'sig-1', title: 'Class Teacher', show: true },
      { id: 'sig-2', title: 'Student Counselor', show: true },
      { id: 'sig-3', title: 'Principal', name: 'Dr. Robert Miller', show: true }
    ],
    showSeal: true,
    dateFormat: 'DD/MM/YYYY'
  }
];

export const CertificateSettingsTab: React.FC = () => {
  const { schoolProfile } = useData();
  const { addToast } = useToast();

  const [activeSubSection, setActiveSubSection] = useState<
    'types' | 'templates' | 'numbering' | 'fields' | 'signatures'
  >('types');

  // Certificate Types State
  const [types, setTypes] = useState<CertificateTypeConfig[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_types');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CERTIFICATE_TYPES;
  });

  // Certificate Templates State
  const [templates, setTemplates] = useState<CertificateTemplateConfig[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_templates_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CERTIFICATE_TEMPLATES;
  });

  // Dynamic Placeholders State
  const [placeholders, setPlaceholders] = useState<DynamicPlaceholderItem[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_placeholders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_DYNAMIC_PLACEHOLDERS;
  });

  // Save Types, Templates & Placeholders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('edu_db_certificate_types', JSON.stringify(types));
    } catch (e) {}
  }, [types]);

  useEffect(() => {
    try {
      localStorage.setItem('edu_db_certificate_templates_v2', JSON.stringify(templates));
    } catch (e) {}
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem('edu_db_certificate_placeholders', JSON.stringify(placeholders));
    } catch (e) {}
  }, [placeholders]);

  // Certificate Type Modal State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<CertificateTypeConfig | null>(null);
  const [deletingType, setDeletingType] = useState<CertificateTypeConfig | null>(null);
  const [typeForm, setTypeForm] = useState<Partial<CertificateTypeConfig>>({
    name: '',
    code: '',
    description: '',
    status: 'Active',
    displayOrder: 1,
    numberingPrefix: '',
    numberingStart: 1,
    numberingLength: 4,
    includeAcademicYearInNo: true,
    requiredFields: ['studentName', 'admissionNumber', 'class']
  });

  // Placeholder Modal State
  const [isPlaceholderModalOpen, setIsPlaceholderModalOpen] = useState(false);
  const [editingPlaceholder, setEditingPlaceholder] = useState<DynamicPlaceholderItem | null>(null);
  const [deletingPlaceholder, setDeletingPlaceholder] = useState<DynamicPlaceholderItem | null>(null);
  const [placeholderForm, setPlaceholderForm] = useState<{
    tokenKey: string;
    description: string;
    category: 'Student Info' | 'Academic' | 'School Details' | 'Certificate Info' | 'Custom';
    sampleValue: string;
  }>({
    tokenKey: '',
    description: '',
    category: 'Custom',
    sampleValue: ''
  });

  // Selected Certificate Type for Required Fields Configuration Matrix
  const [selectedFieldMatrixTypeId, setSelectedFieldMatrixTypeId] = useState<string>(
    types[0]?.id || 'CT-TC'
  );

  const currentFieldMatrixType = useMemo(() => {
    return types.find(t => t.id === selectedFieldMatrixTypeId) || types[0];
  }, [types, selectedFieldMatrixTypeId]);

  // Selected Template for Editing in Templates subtab
  const [selectedTemplateTypeId, setSelectedTemplateTypeId] = useState<string>(
    types[0]?.id || 'CT-TC'
  );

  const currentTypeForTemplate = useMemo(() => {
    return types.find(t => t.id === selectedTemplateTypeId) || types[0];
  }, [types, selectedTemplateTypeId]);

  const activeTemplate = useMemo(() => {
    const found = templates.find(t => t.certificateTypeId === selectedTemplateTypeId);
    if (found) return found;
    return {
      id: `TPL-${selectedTemplateTypeId}`,
      certificateTypeId: selectedTemplateTypeId,
      certificateTypeName: currentTypeForTemplate?.name || 'Certificate',
      title: (currentTypeForTemplate?.name || 'CERTIFICATE').toUpperCase(),
      headerStyle: 'Classic Double Border' as const,
      themeColor: '#1e3a8a',
      showLogo: true,
      showSchoolHeader: true,
      bodyTemplate: `This is to certify that {{studentName}}, Admission No. {{admissionNumber}}, Class {{class}}, is a student of {{schoolName}}. Issued on {{issueDate}}.`,
      footerText: 'Official Certificate issued by School Authority.',
      signatories: [
        { id: 'sig-1', title: 'Class Teacher', show: true },
        { id: 'sig-2', title: 'Accounts Officer', show: true },
        { id: 'sig-3', title: 'Principal', name: 'Dr. Robert Miller', show: true }
      ],
      showSeal: true,
      dateFormat: 'DD/MM/YYYY'
    };
  }, [templates, selectedTemplateTypeId, currentTypeForTemplate]);

  const [templateEditorState, setTemplateEditorState] = useState<CertificateTemplateConfig>(activeTemplate);

  useEffect(() => {
    setTemplateEditorState(activeTemplate);
  }, [activeTemplate]);

  const handleOpenAddType = () => {
    setEditingType(null);
    setTypeForm({
      name: '',
      code: '',
      description: '',
      status: 'Active',
      displayOrder: types.length + 1,
      numberingPrefix: 'CERT',
      numberingStart: 1,
      numberingLength: 4,
      includeAcademicYearInNo: true,
      requiredFields: ['studentName', 'admissionNumber', 'class', 'academicYear']
    });
    setIsTypeModalOpen(true);
  };

  const handleOpenEditType = (t: CertificateTypeConfig) => {
    setEditingType(t);
    setTypeForm({ ...t });
    setIsTypeModalOpen(true);
  };

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name || !typeForm.code) {
      addToast('warning', 'Validation Error', 'Certificate Name and Code are required.');
      return;
    }

    if (editingType) {
      setTypes(prev => prev.map(item => item.id === editingType.id ? { ...item, ...typeForm } as CertificateTypeConfig : item));
      addToast('success', 'Type Updated', `Updated certificate type '${typeForm.name}'`);
    } else {
      const newId = `CT-${Date.now().toString().slice(-6)}`;
      const newType: CertificateTypeConfig = {
        id: newId,
        name: typeForm.name || 'New Certificate',
        code: typeForm.code || 'CERT',
        description: typeForm.description || '',
        status: typeForm.status || 'Active',
        displayOrder: Number(typeForm.displayOrder) || types.length + 1,
        requiredFields: typeForm.requiredFields || ['studentName', 'admissionNumber'],
        numberingPrefix: typeForm.numberingPrefix || typeForm.code || 'CERT',
        numberingStart: Number(typeForm.numberingStart) || 1,
        numberingLength: Number(typeForm.numberingLength) || 4,
        includeAcademicYearInNo: !!typeForm.includeAcademicYearInNo,
        isSystem: false
      };
      setTypes(prev => [...prev, newType]);
      addToast('success', 'Type Created', `Added new certificate type '${newType.name}'`);
    }
    setIsTypeModalOpen(false);
  };

  const handleSaveTemplate = () => {
    setTemplates(prev => {
      const exists = prev.some(t => t.certificateTypeId === templateEditorState.certificateTypeId);
      if (exists) {
        return prev.map(t => t.certificateTypeId === templateEditorState.certificateTypeId ? templateEditorState : t);
      }
      return [...prev, templateEditorState];
    });
    addToast('success', 'Template Saved', `Saved layout configuration for ${templateEditorState.certificateTypeName}`);
  };

  const handleInsertPlaceholder = (ph: string) => {
    setTemplateEditorState(prev => ({
      ...prev,
      bodyTemplate: prev.bodyTemplate + ' ' + ph
    }));
  };

  // Placeholder CRUD Handlers
  const handleOpenAddPlaceholder = () => {
    setEditingPlaceholder(null);
    setPlaceholderForm({
      tokenKey: '',
      description: '',
      category: 'Custom',
      sampleValue: ''
    });
    setIsPlaceholderModalOpen(true);
  };

  const handleOpenEditPlaceholder = (p: DynamicPlaceholderItem) => {
    setEditingPlaceholder(p);
    const cleanKey = p.placeholder.replace(/^\{\{/, '').replace(/\}\}$/, '');
    setPlaceholderForm({
      tokenKey: cleanKey,
      description: p.description,
      category: p.category,
      sampleValue: p.sampleValue || ''
    });
    setIsPlaceholderModalOpen(true);
  };

  const handleSavePlaceholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeholderForm.tokenKey.trim()) {
      addToast('warning', 'Validation Error', 'Placeholder Token Key is required.');
      return;
    }

    const cleanTokenKey = placeholderForm.tokenKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
    const formattedPlaceholder = `{{${cleanTokenKey}}}`;

    if (editingPlaceholder) {
      setPlaceholders(prev => prev.map(item => item.id === editingPlaceholder.id ? {
        ...item,
        placeholder: formattedPlaceholder,
        description: placeholderForm.description,
        category: placeholderForm.category,
        sampleValue: placeholderForm.sampleValue
      } : item));
      addToast('success', 'Placeholder Updated', `Updated token ${formattedPlaceholder}`);
    } else {
      const newPh: DynamicPlaceholderItem = {
        id: `PH-CUST-${Date.now().toString().slice(-6)}`,
        placeholder: formattedPlaceholder,
        description: placeholderForm.description || 'Custom Token Field',
        category: placeholderForm.category,
        sampleValue: placeholderForm.sampleValue || 'Sample Data',
        isSystem: false
      };
      setPlaceholders(prev => [...prev, newPh]);
      addToast('success', 'Placeholder Created', `Added new token ${formattedPlaceholder}`);
    }
    setIsPlaceholderModalOpen(false);
  };

  const handleCopyPlaceholder = (ph: string) => {
    navigator.clipboard.writeText(ph);
    addToast('info', 'Token Copied', `Copied '${ph}' to clipboard!`);
  };

  // Per-Type Required Field Toggle
  const handleToggleRequiredField = (typeId: string, fieldKey: string) => {
    setTypes(prev => prev.map(t => {
      if (t.id === typeId) {
        const currentFields = t.requiredFields || [];
        const exists = currentFields.includes(fieldKey);
        const updatedFields = exists
          ? currentFields.filter(f => f !== fieldKey)
          : [...currentFields, fieldKey];
        return { ...t, requiredFields: updatedFields };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Sub-section Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-sky-500" /> Certificate Management & Templates
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => setActiveSubSection('types')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'types'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Certificate Types ({types.length})
          </button>

          <button
            onClick={() => setActiveSubSection('templates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'templates'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" /> Templates
          </button>

          <button
            onClick={() => setActiveSubSection('numbering')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'numbering'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Hash className="w-3.5 h-3.5" /> Numbering Rules
          </button>

          <button
            onClick={() => setActiveSubSection('fields')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'fields'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Placeholders & Required ({placeholders.length})
          </button>

          <button
            onClick={() => setActiveSubSection('signatures')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'signatures'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Signatures & Seal
          </button>
        </div>
      </div>

      {/* 1. CERTIFICATE TYPES SECTION */}
      {activeSubSection === 'types' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Active Certificate Types</h4>
            <button
              onClick={handleOpenAddType}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Certificate Type
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map(t => (
              <div key={t.id} className="glass-card p-4 rounded-2xl space-y-3 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-extrabold text-xs flex items-center justify-center">
                      {t.code}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        t.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status} {t.isSystem ? '• System' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEditType(t)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 cursor-pointer" title="Edit Type"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeletingType(t)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer text-rose-500 hover:text-rose-700" title="Delete Type"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  <span>Number Format: <strong>{t.numberingPrefix}-{t.includeAcademicYearInNo ? '2026-' : ''}0001</strong></span>
                  <span>Fields: <strong>{t.requiredFields?.length || 0}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TEMPLATES SECTION */}
      {activeSubSection === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Configure Certificate Template</h4>
              <button
                onClick={handleSaveTemplate}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save Template
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Select Certificate Type</label>
                <select
                  value={selectedTemplateTypeId}
                  onChange={e => setSelectedTemplateTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Certificate Display Title</label>
                <input
                  type="text"
                  value={templateEditorState.title}
                  onChange={e => setTemplateEditorState(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none"
                  placeholder="e.g. BONAFIDE STUDY CERTIFICATE"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Header Border Style</label>
                  <select
                    value={templateEditorState.headerStyle}
                    onChange={e => setTemplateEditorState(prev => ({ ...prev, headerStyle: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Classic Double Border">Classic Double Border</option>
                    <option value="Modern Minimalist">Modern Minimalist</option>
                    <option value="Royal Gold Crest">Royal Gold Crest</option>
                    <option value="Executive Slate">Executive Slate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Accent Theme Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={templateEditorState.themeColor || '#1e3a8a'}
                      onChange={e => setTemplateEditorState(prev => ({ ...prev, themeColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={templateEditorState.themeColor || '#1e3a8a'}
                      onChange={e => setTemplateEditorState(prev => ({ ...prev, themeColor: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Body Content Template</label>
                  <button
                    type="button"
                    onClick={() => handleInsertPlaceholder('\n')}
                    className="px-2.5 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-extrabold hover:bg-sky-200 cursor-pointer"
                    title="Insert a new line break into template"
                  >
                    + New Line (Enter)
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={templateEditorState.bodyTemplate}
                  onChange={e => setTemplateEditorState(prev => ({ ...prev, bodyTemplate: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-xs text-slate-900 dark:text-white outline-none"
                  placeholder="Body paragraph content with {{studentName}}, {{admissionNumber}}, {{class}} etc."
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Tip: Press <kbd className="px-1 bg-slate-200 dark:bg-slate-700 rounded font-mono">Enter</kbd> in the text box or click <strong>+ New Line (Enter)</strong> above to start a new paragraph.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-[10px] uppercase text-slate-500 tracking-wider">
                    Quick Insert Dynamic Field ({placeholders.length} Tokens Available)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                  {placeholders.map(p => (
                    <button
                      key={p.placeholder}
                      type="button"
                      onClick={() => handleInsertPlaceholder(p.placeholder)}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-mono text-[10px] font-extrabold hover:bg-sky-50 dark:hover:bg-sky-950 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                      title={p.description}
                    >
                      + {p.placeholder}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Footer Text / Disclaimer</label>
                <input
                  type="text"
                  value={templateEditorState.footerText || ''}
                  onChange={e => setTemplateEditorState(prev => ({ ...prev, footerText: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Real-time Certificate Template Preview */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-500" /> Live Certificate Preview
              </h4>
              <span className="text-xs text-slate-400 font-mono">Sample Student Data</span>
            </div>

            <div className="glass-card p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 overflow-x-auto">
              <PrintableCertificateContainer
                template={templateEditorState}
                schoolProfile={schoolProfile}
                academicYear="2026–2027"
                studentName="Rahul Kumar"
                admissionNo="ADM-2024-089"
                admissionDate="2024-06-15"
                fatherName="Vikram Kumar"
                motherName="Sunita Kumar"
                dob="2012-08-15"
                gender="Male"
                className="Class 10"
                section="A"
                rollNo="12"
                leavingDate="2026-08-14"
                reason="Parent Relocation to California"
                conduct="Good & Exemplary"
                remarks="Promoted to Higher Grade"
                result="PASSED"
                feeClearanceStatus="FULL DUES CLEARED"
                tcNo={`${currentTypeForTemplate?.numberingPrefix || 'CERT'}-2026-0001`}
                issueDate="2026-08-14"
                isDraftPreview={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. NUMBERING RULES SECTION */}
      {activeSubSection === 'numbering' && (
        <div className="space-y-4 glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Certificate Numbering Sequences</h4>
              <p className="text-xs text-slate-500">Configure auto-generation number formats for each certificate type.</p>
            </div>
            <button onClick={() => addToast('success', 'Numbering Rules Saved')} className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Save className="w-3.5 h-3.5" /> Save All Number Rules
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {types.map(t => (
              <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{t.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Code: {t.code}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold">Prefix</span>
                    <input
                      type="text"
                      value={t.numberingPrefix}
                      onChange={e => setTypes(prev => prev.map(x => x.id === t.id ? { ...x, numberingPrefix: e.target.value } : x))}
                      className="w-20 px-2 py-1 rounded-lg border text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold">Start No</span>
                    <input
                      type="number"
                      value={t.numberingStart}
                      onChange={e => setTypes(prev => prev.map(x => x.id === t.id ? { ...x, numberingStart: Number(e.target.value) } : x))}
                      className="w-20 px-2 py-1 rounded-lg border text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold">Digits</span>
                    <input
                      type="number"
                      value={t.numberingLength}
                      onChange={e => setTypes(prev => prev.map(x => x.id === t.id ? { ...x, numberingLength: Number(e.target.value) } : x))}
                      className="w-16 px-2 py-1 rounded-lg border text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium select-none cursor-pointer mt-3">
                    <input
                      type="checkbox"
                      checked={t.includeAcademicYearInNo}
                      onChange={e => setTypes(prev => prev.map(x => x.id === t.id ? { ...x, includeAcademicYearInNo: e.target.checked } : x))}
                      className="w-4 h-4 rounded text-sky-600 cursor-pointer"
                    />
                    Include Year
                  </label>

                  <div className="mt-3 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold text-sky-600 dark:text-sky-400 border">
                    {t.numberingPrefix}-{t.includeAcademicYearInNo ? '2026-' : ''}{String(t.numberingStart).padStart(t.numberingLength, '0')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DYNAMIC PLACEHOLDERS & REQUIRED FIELDS CONFIGURATION WORKSPACE */}
      {activeSubSection === 'fields' && (
        <div className="space-y-6">
          {/* Top Section Header & Add Custom Placeholder Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500" /> Placeholder Library & Per-Certificate Required Fields Matrix
              </h4>
              <p className="text-xs text-slate-500">
                Manage available placeholder tokens and configure required fields per certificate type.
              </p>
            </div>

            <button
              onClick={handleOpenAddPlaceholder}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Custom Placeholder
            </button>
          </div>

          {/* Placeholders Library Grid */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Available Tokens Library ({placeholders.length})
              </h4>
              <span className="text-[11px] text-slate-400">Click token badge to copy to clipboard</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {placeholders.map(p => (
                <div key={p.id || p.placeholder} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2 relative group">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => handleCopyPlaceholder(p.placeholder)}
                      className="font-mono font-extrabold text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded-md hover:bg-sky-100 flex items-center gap-1 cursor-pointer"
                      title="Click to copy token"
                    >
                      {p.placeholder} <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </button>

                    <div className="flex items-center gap-1">
                      {!p.isSystem && (
                        <>
                          <button onClick={() => handleOpenEditPlaceholder(p)} className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer" title="Edit Token"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeletingPlaceholder(p)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" title="Delete Token"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                      {p.isSystem && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">System</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{p.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                    <span>Category: <strong>{p.category}</strong></span>
                    {p.sampleValue && <span>Sample: <em>{p.sampleValue}</em></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-Certificate Type Required Fields Matrix Configuration */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-600" /> Required Fields Configuration Matrix
                </h4>
                <p className="text-xs text-slate-500">
                  Select a certificate type and configure which dynamic fields are mandatory when issuing that certificate.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedFieldMatrixTypeId}
                  onChange={e => setSelectedFieldMatrixTypeId(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>

                <button
                  onClick={() => addToast('success', 'Configuration Saved', `Required fields updated for ${currentFieldMatrixType?.name}`)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Required Matrix
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {placeholders.map(p => {
                const keyName = p.placeholder.replace(/^\{\{/, '').replace(/\}\}$/, '');
                const isRequired = currentFieldMatrixType?.requiredFields?.includes(keyName) || currentFieldMatrixType?.requiredFields?.includes(p.placeholder);

                return (
                  <div
                    key={p.placeholder}
                    onClick={() => handleToggleRequiredField(currentFieldMatrixType.id, keyName)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isRequired
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <code className="font-mono font-bold text-xs">{p.placeholder}</code>
                      <p className="text-[11px] font-medium">{p.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        isRequired ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {isRequired ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. SIGNATURES & SEAL SECTION */}
      {activeSubSection === 'signatures' && (
        <div className="space-y-4 glass-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Signatory Designation & Seal Settings</h4>
              <p className="text-xs text-slate-500">Configure authority signatures displayed on printed certificates.</p>
            </div>
            <button onClick={handleSaveTemplate} className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Save className="w-3.5 h-3.5" /> Save Signatories
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {(templateEditorState.signatories || []).map((sig, idx) => (
              <div key={sig.id || idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border flex flex-col sm:flex-row items-center gap-4">
                <div className="font-bold text-slate-700 dark:text-slate-300 w-24">Signatory {idx + 1}:</div>
                <input
                  type="text"
                  value={sig.title}
                  onChange={e => {
                    const newSigs = [...(templateEditorState.signatories || [])];
                    newSigs[idx] = { ...newSigs[idx], title: e.target.value };
                    setTemplateEditorState(prev => ({ ...prev, signatories: newSigs }));
                  }}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none flex-1"
                  placeholder="Designation Title (e.g. Principal)"
                />
                <input
                  type="text"
                  value={sig.name || ''}
                  onChange={e => {
                    const newSigs = [...(templateEditorState.signatories || [])];
                    newSigs[idx] = { ...newSigs[idx], name: e.target.value };
                    setTemplateEditorState(prev => ({ ...prev, signatories: newSigs }));
                  }}
                  className="px-3 py-1.5 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none flex-1"
                  placeholder="Signatory Name (Optional)"
                />
                <label className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sig.show}
                    onChange={e => {
                      const newSigs = [...(templateEditorState.signatories || [])];
                      newSigs[idx] = { ...newSigs[idx], show: e.target.checked };
                      setTemplateEditorState(prev => ({ ...prev, signatories: newSigs }));
                    }}
                    className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                  />
                  Show
                </label>
              </div>
            ))}
          </div>

          {/* Official School Stamp / Seal Management Card */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" /> Official School Stamp & Seal Configuration
                </h4>
                <p className="text-xs text-slate-500">
                  Configure the official seal text and rubber stamp graphic displayed on printed certificates.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={templateEditorState.showSeal ?? true}
                  onChange={e => setTemplateEditorState(prev => ({ ...prev, showSeal: e.target.checked }))}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
                Display Stamp / Seal
              </label>
            </div>

            {(templateEditorState.showSeal ?? true) && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Stamp / Seal Text Label
                  </label>
                  <input
                    type="text"
                    value={templateEditorState.sealText || 'OFFICIAL SEAL'}
                    onChange={e => setTemplateEditorState(prev => ({ ...prev, sealText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                    placeholder="e.g. OFFICIAL SEAL - PIRNAV SCHOOLS"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    Official Stamp / Seal Graphic Upload (Rubber Stamp)
                  </label>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                    {/* Stamp Thumbnail Preview */}
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shrink-0 relative overflow-hidden group">
                      {templateEditorState.sealImageUrl ? (
                        <img
                          src={templateEditorState.sealImageUrl}
                          alt="Official Stamp Preview"
                          className="w-full h-full object-contain transform rotate-6"
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                          <span className="text-[9px] font-bold block mt-1">No Stamp</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Actions & Details */}
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          Upload School Stamp / Seal Graphic
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          Upload your official rubber stamp, round seal, or embossed crest image (PNG with transparent background recommended, max 5MB).
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all">
                          <Upload className="w-3.5 h-3.5" /> Upload Stamp Image
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!file.type.startsWith('image/')) {
                                addToast('error', 'Invalid File', 'Please select an image file (PNG, JPG, WEBP, SVG).');
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                addToast('error', 'File Too Large', 'Stamp image file size must be less than 5MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const result = ev.target?.result as string;
                                if (result) {
                                  setTemplateEditorState(prev => ({ ...prev, sealImageUrl: result }));
                                  addToast('success', 'Stamp Uploaded', 'Official stamp image uploaded successfully.');
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        {templateEditorState.sealImageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateEditorState(prev => ({ ...prev, sealImageUrl: '' }));
                              addToast('info', 'Stamp Removed', 'Custom stamp image removed. Default seal will be used.');
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Stamp Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CERTIFICATE TYPE MODAL */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingType ? 'Edit Certificate Type' : 'Add Certificate Type'}
              </h3>
              <button onClick={() => setIsTypeModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveType} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Certificate Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input
                  type="text"
                  required
                  value={typeForm.name || ''}
                  onChange={e => setTypeForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                  placeholder="e.g. Sports Participation Certificate"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Short Code <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="text"
                    required
                    value={typeForm.code || ''}
                    onChange={e => setTypeForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                    placeholder="e.g. SPC"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={typeForm.status}
                    onChange={e => setTypeForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={typeForm.description || ''}
                  onChange={e => setTypeForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
                  placeholder="Brief description of when this certificate is issued."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsTypeModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold shadow-md cursor-pointer">
                  Save Certificate Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLACEHOLDER MODAL */}
      {isPlaceholderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingPlaceholder ? 'Edit Dynamic Placeholder' : 'Add Custom Placeholder Token'}
              </h3>
              <button onClick={() => setIsPlaceholderModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSavePlaceholder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Placeholder Key Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border font-mono font-bold text-xs text-sky-600 dark:text-sky-400">
                  <span>{"{{"}</span>
                  <input
                    type="text"
                    required
                    value={placeholderForm.tokenKey}
                    onChange={e => setPlaceholderForm(prev => ({ ...prev, tokenKey: e.target.value }))}
                    className="w-full bg-transparent outline-none text-slate-900 dark:text-white font-mono font-bold"
                    placeholder="e.g. sportsCategory"
                  />
                  <span>{"}}"}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Category</label>
                <select
                  value={placeholderForm.category}
                  onChange={e => setPlaceholderForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="Student Info">Student Info</option>
                  <option value="Academic">Academic</option>
                  <option value="School Details">School Details</option>
                  <option value="Certificate Info">Certificate Info</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Description <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input
                  type="text"
                  required
                  value={placeholderForm.description}
                  onChange={e => setPlaceholderForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
                  placeholder="e.g. Winner of Inter-School Athletics"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Sample Fallback Value</label>
                <input
                  type="text"
                  value={placeholderForm.sampleValue}
                  onChange={e => setPlaceholderForm(prev => ({ ...prev, sampleValue: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
                  placeholder="e.g. 100m Athletics Champion"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsPlaceholderModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold shadow-md cursor-pointer">
                  Save Placeholder Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TYPE CONFIRMATION */}
      <ConfirmModal
        isOpen={!!deletingType}
        title="Delete Certificate Type"
        message={`Are you sure you want to delete certificate type '${deletingType?.name}'?`}
        onConfirm={() => {
          if (deletingType) {
            setTypes(prev => prev.filter(t => t.id !== deletingType.id));
            addToast('success', 'Type Removed');
            setDeletingType(null);
          }
        }}
        onCancel={() => setDeletingType(null)}
      />

      {/* DELETE PLACEHOLDER CONFIRMATION */}
      <ConfirmModal
        isOpen={!!deletingPlaceholder}
        title="Delete Placeholder Token"
        message={`Are you sure you want to delete token '${deletingPlaceholder?.placeholder}'?`}
        onConfirm={() => {
          if (deletingPlaceholder) {
            setPlaceholders(prev => prev.filter(p => p.id !== deletingPlaceholder.id));
            addToast('success', 'Placeholder Token Removed');
            setDeletingPlaceholder(null);
          }
        }}
        onCancel={() => setDeletingPlaceholder(null)}
      />
    </div>
  );
};
