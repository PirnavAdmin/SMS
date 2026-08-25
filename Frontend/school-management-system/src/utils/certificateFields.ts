import { CertificateFieldConfig, CertificateTypeConfig } from '../types';

export const DEFAULT_GENERIC_FIELDS: CertificateFieldConfig[] = [
  { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true, displayOrder: 1 },
  { key: 'purpose', label: 'Purpose / Description', type: 'text', required: false, displayOrder: 2, placeholder: 'Reason or purpose for issuance' },
  { key: 'remarks', label: 'Special Remarks', type: 'textarea', required: false, displayOrder: 3, placeholder: 'Additional notes...' }
];

export const DEFAULT_CERTIFICATE_FIELDS_MAP: Record<string, CertificateFieldConfig[]> = {
  'CT-TC': [
    { key: 'dateOfLeaving', label: 'Date of Leaving / Issue Date', type: 'date', required: true, displayOrder: 1 },
    { key: 'reasonForLeaving', label: 'Reason for Certificate Request / Leaving', type: 'text', required: false, displayOrder: 2, placeholder: 'e.g. Parent Request / Relocation / Higher Studies' },
    { key: 'generalConduct', label: 'General Conduct / Remarks', type: 'text', required: false, displayOrder: 3, placeholder: 'e.g. Good & Exemplary' },
    { key: 'identificationMarks', label: 'Mole Identification / Personal Identification Marks', type: 'textarea', required: false, displayOrder: 4, placeholder: 'e.g. 1. A mole on the right cheek  2. A mole on the left shoulder' },
    { key: 'specialRemarks', label: 'Special Remarks', type: 'textarea', required: false, displayOrder: 5, placeholder: 'Additional notes or clearance details...' }
  ],
  'CT-BONAFIDE': [
    { key: 'purpose', label: 'Purpose', type: 'text', required: true, displayOrder: 1, placeholder: 'e.g. Bank Account / Passport / Government Scholarship / Bus Pass' },
    { key: 'academicYear', label: 'Academic Year', type: 'text', required: false, displayOrder: 2, placeholder: 'e.g. 2026–2027' },
    { key: 'className', label: 'Class / Grade', type: 'text', required: false, displayOrder: 3, placeholder: 'e.g. Class 10' },
    { key: 'course', label: 'Course', type: 'text', required: false, displayOrder: 4, placeholder: 'e.g. Secondary Education' },
    { key: 'admissionNo', label: 'Admission Number', type: 'text', required: false, displayOrder: 5 },
    { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true, displayOrder: 6 },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, displayOrder: 7, placeholder: 'Additional verification remarks...' }
  ],
  'CT-STUDY': [
    { key: 'studyFromDate', label: 'Study From Date', type: 'date', required: false, displayOrder: 1 },
    { key: 'studyToDate', label: 'Study To Date', type: 'date', required: false, displayOrder: 2 },
    { key: 'className', label: 'Class / Course', type: 'text', required: false, displayOrder: 3, placeholder: 'e.g. Class 1 to Class 10' },
    { key: 'academicYear', label: 'Academic Year', type: 'text', required: false, displayOrder: 4 },
    { key: 'medium', label: 'Medium', type: 'dropdown', options: ['English', 'Hindi', 'Telugu', 'Regional Language'], required: false, displayOrder: 5 },
    { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true, displayOrder: 6 },
    { key: 'purpose', label: 'Purpose', type: 'text', required: false, displayOrder: 7, placeholder: 'e.g. Higher Study Application' },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, displayOrder: 8 }
  ],
  'CT-CHARACTER': [
    { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true, displayOrder: 1 },
    { key: 'conduct', label: 'Conduct / Character', type: 'dropdown', options: ['Exemplary', 'Good', 'Very Good', 'Satisfactory'], required: true, defaultValue: 'Good', displayOrder: 2 },
    { key: 'purpose', label: 'Purpose', type: 'text', required: false, displayOrder: 3, placeholder: 'e.g. College Admission / Employment' },
    { key: 'remarks', label: 'Special Remarks', type: 'textarea', required: false, displayOrder: 4 }
  ],
  'CT-CONDUCT': [
    { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true, displayOrder: 1 },
    { key: 'conduct', label: 'Conduct / Character', type: 'dropdown', options: ['Exemplary', 'Good', 'Very Good', 'Satisfactory'], required: true, defaultValue: 'Good', displayOrder: 2 },
    { key: 'purpose', label: 'Purpose', type: 'text', required: false, displayOrder: 3 },
    { key: 'remarks', label: 'Special Remarks', type: 'textarea', required: false, displayOrder: 4 }
  ],
  'CT-MIGRATION': [
    { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true, displayOrder: 1 },
    { key: 'course', label: 'Course', type: 'text', required: false, displayOrder: 2, placeholder: 'e.g. Senior Secondary' },
    { key: 'academicYear', label: 'Academic Year', type: 'text', required: false, displayOrder: 3 },
    { key: 'dateOfCompletion', label: 'Date of Completion', type: 'date', required: false, displayOrder: 4 },
    { key: 'universityBoard', label: 'University / Board', type: 'text', required: false, displayOrder: 5, placeholder: 'e.g. CBSE / State Board / Central Board' },
    { key: 'purpose', label: 'Reason / Purpose', type: 'text', required: false, displayOrder: 6 },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, displayOrder: 7 }
  ],
  'CT-FEE-CLEARANCE': [
    { key: 'issueDate', label: 'Date of Issue', type: 'date', required: true, displayOrder: 1 },
    { key: 'clearanceStatus', label: 'Dues Clearance Status', type: 'dropdown', options: ['FULL DUES CLEARED', 'PARTIAL CLEARED WITH NOC', 'CONDITIONAL CLEARANCE'], required: true, defaultValue: 'FULL DUES CLEARED', displayOrder: 2 },
    { key: 'academicYear', label: 'Academic Year', type: 'text', required: false, displayOrder: 3 },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, displayOrder: 4 }
  ],
  'CT-ADMISSION': [
    { key: 'dateOfAdmission', label: 'Date of Admission', type: 'date', required: true, displayOrder: 1 },
    { key: 'className', label: 'Class / Grade', type: 'text', required: false, displayOrder: 2 },
    { key: 'academicYear', label: 'Academic Year', type: 'text', required: false, displayOrder: 3 },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, displayOrder: 4 }
  ],
  'CT-COURSE-COMPLETION': [
    { key: 'dateOfCompletion', label: 'Date of Completion', type: 'date', required: true, displayOrder: 1 },
    { key: 'course', label: 'Course', type: 'text', required: true, displayOrder: 2, placeholder: 'e.g. Secondary School Curriculum' },
    { key: 'resultGrade', label: 'Result / Grade Passed', type: 'text', required: false, displayOrder: 3, placeholder: 'e.g. Passed with Distinction' },
    { key: 'academicYear', label: 'Academic Year', type: 'text', required: false, displayOrder: 4 },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, displayOrder: 5 }
  ],
  'CT-LEAVING': [
    { key: 'dateOfLeaving', label: 'Date of Leaving', type: 'date', required: true, displayOrder: 1 },
    { key: 'reasonForLeaving', label: 'Reason for Leaving', type: 'text', required: true, displayOrder: 2 },
    { key: 'generalConduct', label: 'General Conduct', type: 'text', required: false, displayOrder: 3 },
    { key: 'remarks', label: 'Remarks', type: 'textarea', required: false, displayOrder: 4 }
  ]
};

export function getFieldsForCertificateType(typeConfig?: Partial<CertificateTypeConfig> | null): CertificateFieldConfig[] {
  if (!typeConfig) return DEFAULT_GENERIC_FIELDS;

  if (typeConfig.fields && Array.isArray(typeConfig.fields) && typeConfig.fields.length > 0) {
    return [...typeConfig.fields].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  if (typeConfig.id && DEFAULT_CERTIFICATE_FIELDS_MAP[typeConfig.id]) {
    return DEFAULT_CERTIFICATE_FIELDS_MAP[typeConfig.id];
  }

  const nameLower = (typeConfig.name || '').toLowerCase();
  const codeLower = (typeConfig.code || '').toLowerCase();

  if (nameLower.includes('transfer') || codeLower === 'tc') return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-TC'];
  if (nameLower.includes('bonafide') || codeLower === 'bc') return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-BONAFIDE'];
  if (nameLower.includes('study') || codeLower === 'sc') return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-STUDY'];
  if (nameLower.includes('character') || codeLower === 'cc') return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-CHARACTER'];
  if (nameLower.includes('conduct') || codeLower === 'cd') return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-CONDUCT'];
  if (nameLower.includes('migration') || codeLower === 'mc') return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-MIGRATION'];
  if (nameLower.includes('fee')) return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-FEE-CLEARANCE'];
  if (nameLower.includes('admission')) return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-ADMISSION'];
  if (nameLower.includes('completion')) return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-COURSE-COMPLETION'];
  if (nameLower.includes('leaving')) return DEFAULT_CERTIFICATE_FIELDS_MAP['CT-LEAVING'];

  return DEFAULT_GENERIC_FIELDS;
}
