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
    { key: 'clearanceStatus', label: 'Dues Clearance Status', type: 'dropdown', options: ['Full Dues Cleared', 'Partial Cleared with NOC', 'Conditional Clearance'], required: true, defaultValue: 'Full Dues Cleared', displayOrder: 2 },
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
  let fields: CertificateFieldConfig[] = DEFAULT_GENERIC_FIELDS;

  if (typeConfig) {
    if (typeConfig.fields && Array.isArray(typeConfig.fields) && typeConfig.fields.length > 0) {
      fields = [...typeConfig.fields].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    } else if (typeConfig.id && DEFAULT_CERTIFICATE_FIELDS_MAP[typeConfig.id]) {
      fields = DEFAULT_CERTIFICATE_FIELDS_MAP[typeConfig.id];
    } else {
      const nameLower = (typeConfig.name || '').toLowerCase();
      const codeLower = (typeConfig.code || '').toLowerCase();

      if (nameLower.includes('transfer') || codeLower === 'tc') fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-TC'];
      else if (nameLower.includes('bonafide') || codeLower === 'bc') fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-BONAFIDE'];
      else if (nameLower.includes('study') || codeLower === 'sc') fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-STUDY'];
      else if (nameLower.includes('character') || codeLower === 'cc') fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-CHARACTER'];
      else if (nameLower.includes('conduct') || codeLower === 'cd') fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-CONDUCT'];
      else if (nameLower.includes('migration') || codeLower === 'mc') fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-MIGRATION'];
      else if (nameLower.includes('fee')) fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-FEE-CLEARANCE'];
      else if (nameLower.includes('admission')) fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-ADMISSION'];
      else if (nameLower.includes('completion')) fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-COURSE-COMPLETION'];
      else if (nameLower.includes('leaving')) fields = DEFAULT_CERTIFICATE_FIELDS_MAP['CT-LEAVING'];
    }
  }

  // Ensure clearance status options are always cleanly formatted in mixed characters
  return fields.map(f => {
    if (f.key === 'clearanceStatus' && Array.isArray(f.options)) {
      return {
        ...f,
        defaultValue: f.defaultValue === 'FULL DUES CLEARED' ? 'Full Dues Cleared' : (f.defaultValue || 'Full Dues Cleared'),
        options: f.options.map(opt => {
          if (opt === 'FULL DUES CLEARED') return 'Full Dues Cleared';
          if (opt === 'PARTIAL CLEARED WITH NOC') return 'Partial Cleared with NOC';
          if (opt === 'CONDITIONAL CLEARANCE') return 'Conditional Clearance';
          return opt;
        })
      };
    }
    return f;
  });
}
