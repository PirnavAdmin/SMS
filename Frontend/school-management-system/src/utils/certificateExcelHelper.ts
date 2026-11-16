import * as XLSX from 'xlsx';
import { Student, CertificateTypeConfig, CertificateFieldConfig } from '../types';
import { getFieldsForCertificateType } from './certificateFields';
import { formatDateDDMMYYYY } from './dateValidation';

// ---------------------------------------------------------------------------
// Date to Words Helper (Common for Indian/CBSE/State Board Transfer Certificates)
// ---------------------------------------------------------------------------
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const ORDINAL_DAYS = [
  '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth',
  'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth', 'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First'
];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 20) return ONES[num];
  if (num < 100) {
    const rem = num % 10;
    return `${TENS[Math.floor(num / 10)]}${rem ? ' ' + ONES[rem] : ''}`;
  }
  if (num < 1000) {
    const rem = num % 100;
    return `${ONES[Math.floor(num / 100)]} Hundred${rem ? ' and ' + numberToWords(rem) : ''}`;
  }
  if (num < 10000) {
    const thousands = Math.floor(num / 1000);
    const rem = num % 1000;
    return `${ONES[thousands]} Thousand${rem ? ' ' + numberToWords(rem) : ''}`;
  }
  return num.toString();
}

/**
 * Converts a date string (YYYY-MM-DD or DD/MM/YYYY) into full words.
 * E.g., "2010-05-14" or "14/05/2010" -> "Fourteenth May Two Thousand Ten"
 */
export function convertDateToWords(dateStr?: string | null): string {
  if (!dateStr) return '';
  let day = 0, month = 0, year = 0;

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      // DD-MM-YYYY
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }

  if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
    return dateStr;
  }

  const dayWord = ORDINAL_DAYS[day] || numberToWords(day);
  const monthWord = MONTH_NAMES[month - 1] || '';
  const yearWord = numberToWords(year);

  return `${dayWord} ${monthWord} ${yearWord}`.trim();
}

/**
 * Normalizes any Excel date value (Date object, Excel serial number, or string) to YYYY-MM-DD.
 */
export function normalizeExcelDate(value: any): string {
  if (!value) return '';
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'number') {
    // Excel serial date offset from Dec 30 1899
    const utcDays = Math.floor(value - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    if (!isNaN(dateInfo.getTime())) {
      const y = dateInfo.getUTCFullYear();
      const m = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dateInfo.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  const str = String(value).trim();
  // If DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // If DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  return str;
}

// ---------------------------------------------------------------------------
// Certificate Column Definition Interface
// ---------------------------------------------------------------------------
export interface CertificateExcelColumnDef {
  key: string;
  header: string;
  required?: boolean;
  isReadOnly?: boolean;
  type?: 'text' | 'date' | 'dropdown' | 'number';
  options?: string[];
  defaultValue?: (student: Student, activeAY?: string) => any;
  description?: string;
}

/**
 * Checks whether the given certificate type configuration is Transfer Certificate (TC).
 */
export function isTransferCertificate(typeConfig?: Partial<CertificateTypeConfig> | null): boolean {
  if (!typeConfig) return false;
  const name = (typeConfig.name || '').toLowerCase();
  const code = (typeConfig.code || '').toLowerCase();
  const id = (typeConfig.id || '').toLowerCase();
  return name.includes('transfer') || code === 'tc' || id === 'ct-tc';
}

/**
 * Common read-only student identification and demographic columns.
 */
export const COMMON_STUDENT_COLUMNS: CertificateExcelColumnDef[] = [
  { key: 'studentId', header: 'Student ID (Do Not Edit)', isReadOnly: true, description: 'System Unique Student ID' },
  { key: 'admissionNo', header: 'Admission Number (Do Not Edit)', isReadOnly: true, description: 'Official School Admission Number' },
  { key: 'studentName', header: 'Student Name', isReadOnly: true, description: 'Full Name of the Student' },
  { key: 'fatherName', header: 'Father Name', isReadOnly: true, description: "Father's Full Name" },
  { key: 'motherName', header: 'Mother Name', isReadOnly: true, description: "Mother's Full Name" },
  { key: 'className', header: 'Class', isReadOnly: true, description: 'Enrolled Class/Grade' },
  { key: 'section', header: 'Section', isReadOnly: true, description: 'Enrolled Section' },
  { key: 'rollNo', header: 'Roll Number', isReadOnly: true, description: 'Assigned Roll Number' },
  { key: 'dob', header: 'Date of Birth (DD/MM/YYYY)', isReadOnly: true, description: 'Student DOB' }
];

/**
 * Dedicated Transfer Certificate (TC) columns as requested.
 */
export const TC_SPECIFIC_COLUMNS: CertificateExcelColumnDef[] = [
  {
    key: 'dateOfLeaving',
    header: 'Date of Leaving / Issue Date *',
    required: true,
    type: 'date',
    defaultValue: () => new Date().toISOString().split('T')[0],
    description: 'Date student relieved from school (Format: YYYY-MM-DD)'
  },
  {
    key: 'dateOfAdmission',
    header: 'Date of Admission',
    type: 'date',
    defaultValue: (s) => s.joiningDate || s.admissionDate || '',
    description: 'First enrollment date in school (Pre-filled from record)'
  },
  {
    key: 'dobInWords',
    header: 'Date of Birth (in words)',
    type: 'text',
    defaultValue: (s) => convertDateToWords(s.dob),
    description: 'Date of Birth spelled out in words (e.g. Fourteenth May Two Thousand Ten)'
  },
  {
    key: 'lastClassStudied',
    header: 'Last Class Studied',
    type: 'text',
    defaultValue: (s) => s.className || '',
    description: 'Highest class/grade studied at the school'
  },
  {
    key: 'qualifiedForPromotion',
    header: 'Whether Qualified for Promotion',
    type: 'dropdown',
    options: ['Yes', 'No', 'Refer Marksheet', 'In Progress'],
    defaultValue: () => 'Yes',
    description: 'Promotion eligibility status'
  },
  {
    key: 'qualifiedForHigherStudies',
    header: 'Whether Qualified for Higher Studies',
    type: 'dropdown',
    options: ['Yes', 'No', 'N/A'],
    defaultValue: () => 'Yes',
    description: 'Eligibility for admission to higher classes/college'
  },
  {
    key: 'generalConduct',
    header: 'General Conduct / Remarks',
    type: 'text',
    defaultValue: () => 'Good',
    description: 'Student general conduct & behavior during tenure'
  },
  {
    key: 'reasonForLeaving',
    header: 'Reason for Leaving',
    type: 'text',
    defaultValue: () => 'Higher Studies',
    description: 'Official reason for school leaving (e.g. Higher Studies, Relocation)'
  },
  {
    key: 'identificationMarks',
    header: 'Mole Identification / Personal Identification Marks',
    type: 'text',
    defaultValue: () => '',
    description: 'Visible identification marks (e.g. A mole on the right collarbone)'
  },
  {
    key: 'specialRemarks',
    header: 'Special Remarks',
    type: 'text',
    defaultValue: () => '',
    description: 'Any additional remarks or honors'
  },
  {
    key: 'totalWorkingDays',
    header: 'Total Working Days',
    type: 'number',
    defaultValue: () => '210',
    description: 'Total school working days in academic session'
  },
  {
    key: 'totalAttendanceDays',
    header: 'Total Attendance Days',
    type: 'number',
    defaultValue: () => '195',
    description: 'Total days student was present'
  },
  {
    key: 'clearanceStatus',
    header: 'Fee Dues Status',
    type: 'dropdown',
    options: ['Full Dues Cleared', 'Partial Cleared with NOC', 'Conditional Clearance'],
    defaultValue: () => 'Full Dues Cleared',
    description: 'School fee clearance status'
  },
  {
    key: 'characterRemarks',
    header: 'Character / Conduct Remarks',
    type: 'text',
    defaultValue: () => 'Satisfactory',
    description: 'Final character recommendation'
  }
];

/**
 * Returns the full ordered list of column definitions for a given certificate type.
 */
export function getExcelColumnsForCertificate(
  typeConfig?: Partial<CertificateTypeConfig> | null,
  activeAY?: string
): CertificateExcelColumnDef[] {
  if (isTransferCertificate(typeConfig)) {
    return [...COMMON_STUDENT_COLUMNS, ...TC_SPECIFIC_COLUMNS];
  }

  // Dynamic fields for other certificate types
  const dynamicFields: CertificateFieldConfig[] = getFieldsForCertificateType(typeConfig);

  // Filter out any redundant fields already captured in common student demographic columns
  const standardStudentKeys = new Set([
    'studentname', 'name', 'admissionnumber', 'admissionno', 'admno',
    'class', 'classname', 'section', 'rollno', 'dob', 'dateofbirth',
    'fathername', 'mothername'
  ]);

  const specificDynamicColumns: CertificateExcelColumnDef[] = dynamicFields
    .filter(f => !standardStudentKeys.has(f.key.toLowerCase()))
    .map(f => {
      let colType: 'text' | 'date' | 'dropdown' | 'number' = 'text';
      if (f.type === 'date') colType = 'date';
      else if (f.type === 'dropdown') colType = 'dropdown';
      else if (f.type === 'number') colType = 'number';

      return {
        key: f.key,
        header: `${f.label}${f.required ? ' *' : ''}`,
        required: f.required,
        type: colType,
        options: f.options,
        description: f.placeholder || f.label,
        defaultValue: () => {
          if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
            return f.defaultValue;
          }
          if (f.key === 'issueDate') {
            return new Date().toISOString().split('T')[0];
          }
          if (f.key === 'academicYear' && activeAY) {
            return activeAY;
          }
          return '';
        }
      };
    });

  return [...COMMON_STUDENT_COLUMNS, ...specificDynamicColumns];
}

// ---------------------------------------------------------------------------
// Validation Models
// ---------------------------------------------------------------------------
export interface ExcelRowValidationResult {
  rowIndex: number; // 2-based data row in Excel
  studentId: string;
  admissionNo: string;
  studentName: string;
  className: string;
  section: string;
  isValid: boolean;
  status: 'Valid' | 'Error' | 'Warning';
  errors: string[];
  warnings: string[];
  mappedData: Record<string, any>;
}

export interface ExcelValidationSummary {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  certificateTypeId: string;
  certificateTypeName: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
  missingMandatoryCount: number;
  duplicateCount: number;
  results: ExcelRowValidationResult[];
  validDataMap: Record<string, Record<string, any>>; // studentId -> certificate specific data
}

// ---------------------------------------------------------------------------
// 1. DYNAMIC EXCEL TEMPLATE GENERATION & DOWNLOAD
// ---------------------------------------------------------------------------
export function generateCertificateExcelTemplate(
  students: Student[],
  typeConfig: CertificateTypeConfig,
  activeAY: string
): void {
  const isTC = isTransferCertificate(typeConfig);
  const columns = getExcelColumnsForCertificate(typeConfig, activeAY);

  // 1. Build Sheet 1: Student Certificate Data
  const sheetData: any[][] = [];

  // Header Row
  const headerRow = columns.map(c => c.header);
  sheetData.push(headerRow);

  // Data Rows for selected students
  students.forEach((st) => {
    const row: any[] = [];
    columns.forEach(col => {
      switch (col.key) {
        case 'studentId':
          row.push(st.id);
          break;
        case 'admissionNo':
          row.push(st.admissionNo);
          break;
        case 'studentName':
          row.push(`${st.firstName} ${st.lastName}`.trim());
          break;
        case 'fatherName':
          row.push(st.fatherName || st.parentName || '—');
          break;
        case 'motherName':
          row.push(st.motherName || '—');
          break;
        case 'className':
          row.push(st.className);
          break;
        case 'section':
          row.push(st.section);
          break;
        case 'rollNo':
          row.push(st.rollNo || '');
          break;
        case 'dob':
          row.push(formatDateDDMMYYYY(st.dob) || st.dob || '');
          break;
        default:
          if (col.defaultValue) {
            row.push(col.defaultValue(st, activeAY));
          } else {
            row.push('');
          }
          break;
      }
    });
    sheetData.push(row);
  });

  const wsData = XLSX.utils.aoa_to_sheet(sheetData);

  // Calculate dynamic column widths so headers and contents are clean
  const colWidths = columns.map((col, cIdx) => {
    let maxLen = col.header.length;
    for (let rIdx = 1; rIdx < sheetData.length; rIdx++) {
      const cellVal = sheetData[rIdx]?.[cIdx];
      if (cellVal !== null && cellVal !== undefined) {
        const len = String(cellVal).length;
        if (len > maxLen) maxLen = len;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 4, 14), 45) };
  });
  wsData['!cols'] = colWidths;

  // 2. Build Sheet 2: Instructions
  const instructions: any[][] = [
    ['INSTRUCTION & GUIDELINE', 'DETAILS / SPECIFICATION'],
    ['Target Certificate Type', `${typeConfig.name} (${typeConfig.code})`],
    ['Academic Session', activeAY],
    ['Total Included Students', `${students.length} Student(s)`],
    ['', ''],
    ['1. System Identifiers (STRICT)', 'Do NOT modify the Student ID or Admission Number columns. The system requires these values to match certificate data with student records.'],
    ['2. Header Integrity', 'Do NOT rename, delete, add, or reorder column headers in Sheet 1 ("Student Certificate Data").'],
    ['3. Mandatory Fields (*)', 'Columns marked with an asterisk (*) in the header are required. Rows with empty mandatory fields cannot be issued.'],
    ['4. Date Format Guidelines', 'Enter dates in YYYY-MM-DD (e.g. 2026-05-31) or DD/MM/YYYY format. Avoid textual date variations like "May 31st".'],
    ['5. Pre-filled Information', 'Student demographic details (Name, Class, Parents, DOB) are pre-filled as read-only references and will automatically match the school database.'],
    ['', '']
  ];

  // Document allowed dropdown options if any exist
  const dropdownCols = columns.filter(c => c.options && c.options.length > 0);
  if (dropdownCols.length > 0) {
    instructions.push(['ALLOWED DROPDOWN VALUES', 'ALLOWED OPTIONS']);
    dropdownCols.forEach(col => {
      instructions.push([col.header, (col.options || []).join(', ')]);
    });
    instructions.push(['', '']);
  }

  instructions.push(['6. Upload Instructions', 'After filling in details, save this Excel file (.xlsx) and upload it in the "Upload Completed Excel File" section of Bulk Certificate Generation.']);

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 32 }, { wch: 75 }];

  // 3. Assemble Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsData, 'Student Certificate Data');
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // 4. Trigger Download
  const cleanTypeName = (typeConfig.name || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanTypeName}_Bulk_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ---------------------------------------------------------------------------
// 2. EXCEL FILE PARSER & VALIDATOR
// ---------------------------------------------------------------------------
export async function parseCertificateExcelFile(
  file: File,
  selectedStudents: Student[],
  typeConfig: CertificateTypeConfig
): Promise<ExcelValidationSummary> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  // Use Sheet 1 or sheet named 'Student Certificate Data'
  const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('student')) || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  if (!ws) {
    throw new Error('The uploaded Excel file does not contain a valid data sheet.');
  }

  // Convert to Array of Arrays to inspect header row directly
  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (rawRows.length < 2) {
    throw new Error('The uploaded file is empty or does not contain any student data rows.');
  }

  const rawHeaders: string[] = (rawRows[0] || []).map(h => String(h).trim());
  const configuredColumns = getExcelColumnsForCertificate(typeConfig);

  // Map header column index to canonical column definition
  const headerMap: { index: number; colDef: CertificateExcelColumnDef }[] = [];

  rawHeaders.forEach((headerText, index) => {
    const cleanHeader = headerText
      .replace(/\*/g, '')
      .replace(/\(do not edit\)/gi, '')
      .replace(/\(dd\/mm\/yyyy\)/gi, '')
      .replace(/\(in words\)/gi, '')
      .trim()
      .toLowerCase();

    // Look for match in configured columns
    const matchedCol = configuredColumns.find(c => {
      const cleanColHeader = c.header
        .replace(/\*/g, '')
        .replace(/\(do not edit\)/gi, '')
        .replace(/\(dd\/mm\/yyyy\)/gi, '')
        .replace(/\(in words\)/gi, '')
        .trim()
        .toLowerCase();
      
      if (cleanColHeader === cleanHeader) return true;
      if (c.key.toLowerCase() === cleanHeader) return true;

      // Common aliases
      if (c.key === 'studentId' && (cleanHeader.includes('student id') || cleanHeader === 'id')) return true;
      if (c.key === 'admissionNo' && (cleanHeader.includes('admission') || cleanHeader.includes('adm no'))) return true;
      if (c.key === 'dateOfLeaving' && (cleanHeader.includes('leaving') || cleanHeader.includes('issue date'))) return true;
      if (c.key === 'reasonForLeaving' && cleanHeader.includes('reason')) return true;
      if (c.key === 'generalConduct' && cleanHeader.includes('conduct')) return true;
      if (c.key === 'clearanceStatus' && (cleanHeader.includes('clearance') || cleanHeader.includes('dues'))) return true;
      return false;
    });

    if (matchedCol) {
      headerMap.push({ index, colDef: matchedCol });
    }
  });

  const studentIdCol = headerMap.find(m => m.colDef.key === 'studentId');
  const admNoCol = headerMap.find(m => m.colDef.key === 'admissionNo');

  if (!studentIdCol && !admNoCol) {
    throw new Error('Invalid Excel Template: Missing Student ID or Admission Number column.');
  }

  // Fast lookups from current student selection
  const studentMapById = new Map<string, Student>();
  const studentMapByAdm = new Map<string, Student>();
  selectedStudents.forEach(st => {
    if (st.id) studentMapById.set(st.id.trim().toLowerCase(), st);
    if (st.admissionNo) studentMapByAdm.set(st.admissionNo.trim().toLowerCase(), st);
  });

  const encounteredStudentIds = new Set<string>();
  const results: ExcelRowValidationResult[] = [];
  const validDataMap: Record<string, Record<string, any>> = {};

  let missingMandatoryCount = 0;
  let duplicateCount = 0;

  // Process data rows (starting at index 1)
  for (let rIdx = 1; rIdx < rawRows.length; rIdx++) {
    const row = rawRows[rIdx];
    // Skip completely empty rows
    const isRowEmpty = row.every((val: any) => val === null || val === undefined || String(val).trim() === '');
    if (isRowEmpty) continue;

    const rowNum = rIdx + 1; // 1-based row number for user display
    const errors: string[] = [];
    const warnings: string[] = [];
    const mappedData: Record<string, any> = {};

    // Extract values based on headerMap
    headerMap.forEach(({ index, colDef }) => {
      let rawVal = row[index];
      if (rawVal !== undefined && rawVal !== null) {
        if (colDef.type === 'date') {
          rawVal = normalizeExcelDate(rawVal);
        } else {
          rawVal = String(rawVal).trim();
        }
      } else {
        rawVal = '';
      }
      mappedData[colDef.key] = rawVal;
    });

    const studentIdRaw = String(mappedData.studentId || '').trim();
    const admNoRaw = String(mappedData.admissionNo || '').trim();
    const studentNameRaw = String(mappedData.studentName || '').trim();

    // 1. Check Identity Presence
    if (!studentIdRaw && !admNoRaw) {
      errors.push('Row is missing both Student ID and Admission Number.');
    }

    // 2. Match with Selected Students
    let matchedStudent: Student | undefined = undefined;
    if (studentIdRaw) {
      matchedStudent = studentMapById.get(studentIdRaw.toLowerCase());
    }
    if (!matchedStudent && admNoRaw) {
      matchedStudent = studentMapByAdm.get(admNoRaw.toLowerCase());
    }

    if (!matchedStudent) {
      errors.push(`Student not found in current batch selection (ID: "${studentIdRaw}", Adm No: "${admNoRaw}").`);
    } else {
      // Cross-verify Admission Number if both were present
      if (admNoRaw && matchedStudent.admissionNo.toLowerCase() !== admNoRaw.toLowerCase()) {
        errors.push(`Admission Number "${admNoRaw}" does not match record for Student ID "${matchedStudent.id}" (expected: "${matchedStudent.admissionNo}").`);
      }

      // Check Duplicates
      const studentUniqueKey = matchedStudent.id.toLowerCase();
      if (encounteredStudentIds.has(studentUniqueKey)) {
        errors.push(`Duplicate entry: Student "${matchedStudent.firstName} ${matchedStudent.lastName}" (ID: ${matchedStudent.id}) is repeated in this file.`);
        duplicateCount++;
      } else {
        encounteredStudentIds.add(studentUniqueKey);
      }
    }

    // 3. Validate Mandatory & Typed Fields
    configuredColumns.forEach(col => {
      if (col.isReadOnly) return; // Skip read-only columns

      const val = mappedData[col.key];

      // Mandatory check
      if (col.required && (!val || String(val).trim() === '')) {
        errors.push(`Missing mandatory field: ${col.header.replace(/\*/g, '').trim()}`);
        missingMandatoryCount++;
      }

      // Date format check
      if (val && col.type === 'date') {
        const dateObj = new Date(val);
        if (isNaN(dateObj.getTime())) {
          errors.push(`Invalid date format for "${col.header.replace(/\*/g, '').trim()}": "${val}". Use YYYY-MM-DD.`);
        }
      }

      // Dropdown option match
      if (val && col.type === 'dropdown' && col.options && col.options.length > 0) {
        const valLower = String(val).trim().toLowerCase();
        const matchedOpt = col.options.find(opt => opt.toLowerCase() === valLower);
        if (!matchedOpt) {
          warnings.push(`Value "${val}" for "${col.header}" is not in standard options [${col.options.join(', ')}].`);
        } else {
          mappedData[col.key] = matchedOpt; // Standardize casing
        }
      }
    });

    const isValid = errors.length === 0;
    const finalStudentId = matchedStudent ? matchedStudent.id : (studentIdRaw || `ROW-${rowNum}`);
    const finalStudentName = matchedStudent
      ? `${matchedStudent.firstName} ${matchedStudent.lastName}`
      : (studentNameRaw || `Row ${rowNum}`);
    const finalClassName = matchedStudent ? matchedStudent.className : (mappedData.className || '');
    const finalSection = matchedStudent ? matchedStudent.section : (mappedData.section || '');
    const finalAdmissionNo = matchedStudent ? matchedStudent.admissionNo : admNoRaw;

    const rowResult: ExcelRowValidationResult = {
      rowIndex: rowNum,
      studentId: finalStudentId,
      admissionNo: finalAdmissionNo,
      studentName: finalStudentName,
      className: finalClassName,
      section: finalSection,
      isValid,
      status: isValid ? 'Valid' : 'Error',
      errors,
      warnings,
      mappedData
    };

    results.push(rowResult);

    if (isValid && matchedStudent) {
      // Store in valid map keyed by student id
      validDataMap[matchedStudent.id] = {
        ...mappedData,
        studentName: finalStudentName,
        admissionNumber: finalAdmissionNo,
        class: finalClassName,
        section: finalSection
      };
    }
  }

  const validCount = results.filter(r => r.isValid).length;
  const errorCount = results.filter(r => !r.isValid).length;
  const warningCount = results.filter(r => r.warnings.length > 0).length;

  return {
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toLocaleTimeString(),
    certificateTypeId: typeConfig.id,
    certificateTypeName: typeConfig.name,
    totalRows: results.length,
    validCount,
    errorCount,
    warningCount,
    missingMandatoryCount,
    duplicateCount,
    results,
    validDataMap
  };
}

// ---------------------------------------------------------------------------
// 3. DOWNLOADABLE ERROR REPORT GENERATOR
// ---------------------------------------------------------------------------
export function generateExcelErrorReport(summary: ExcelValidationSummary): void {
  const errorRows = summary.results.filter(r => !r.isValid || r.errors.length > 0);

  if (errorRows.length === 0) {
    throw new Error('No validation errors found to export.');
  }

  const reportData: any[][] = [
    ['EXCEL IMPORT VALIDATION ERROR REPORT', ''],
    ['Target Certificate Type', summary.certificateTypeName],
    ['Source File Name', summary.fileName],
    ['Report Generated At', `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    ['Total Rows in File', summary.totalRows],
    ['Total Failed Rows', errorRows.length],
    ['', ''],
    ['Excel Row #', 'Student ID', 'Admission No', 'Student Name', 'Class & Section', 'Status', 'Validation Errors', 'Warnings']
  ];

  errorRows.forEach(err => {
    reportData.push([
      `Row ${err.rowIndex}`,
      err.studentId,
      err.admissionNo,
      err.studentName,
      `${err.className} - ${err.section}`,
      err.status,
      err.errors.join('; '),
      err.warnings.join('; ')
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(reportData);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 50 },
    { wch: 30 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');

  const cleanName = summary.certificateTypeName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Import_Errors_${cleanName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
