import { Student, Staff } from '../types';

export type TagPosition = 'start' | 'middle' | 'end';

export interface CustomIdSequence {
  id: string;
  name: string; // e.g. "Library Pass ID", "Bus Pass ID", "Receipt No"
  prefix: string;
  startNo: number;
  padding: number;
  includeYear: boolean;
  separator: string;
  position: TagPosition;
}

export interface IdSequenceSettings {
  // Student ID Config
  studentIdPrefix: string;
  studentIdStartNo: number | '';
  studentIdPadding: number | '';
  studentIdIncludeYear: boolean;
  studentIdSeparator: string;
  studentIdPosition: TagPosition | '';

  // Admission No Config
  admissionNoPrefix: string;
  admissionNoStartNo: number | '';
  admissionNoPadding: number | '';
  admissionNoIncludeYear: boolean;
  admissionNoSeparator: string;
  admissionNoPosition: TagPosition | '';

  // Teaching Staff ID Config
  teachingIdPrefix: string;
  teachingIdStartNo: number | '';
  teachingIdPadding: number | '';
  teachingIdIncludeYear: boolean;
  teachingIdSeparator: string;
  teachingIdPosition: TagPosition | '';

  // Non-Teaching Staff ID Config
  nonTeachingIdPrefix: string;
  nonTeachingIdStartNo: number | '';
  nonTeachingIdPadding: number | '';
  nonTeachingIdIncludeYear: boolean;
  nonTeachingIdSeparator: string;
  nonTeachingIdPosition: TagPosition | '';

  // User Defined Custom Automated ID Sequences
  customSequences: CustomIdSequence[];
}

export const defaultIdSequenceSettings: IdSequenceSettings = {
  studentIdPrefix: '',
  studentIdStartNo: '',
  studentIdPadding: '',
  studentIdIncludeYear: true,
  studentIdSeparator: '',
  studentIdPosition: '',

  admissionNoPrefix: '',
  admissionNoStartNo: '',
  admissionNoPadding: '',
  admissionNoIncludeYear: true,
  admissionNoSeparator: '',
  admissionNoPosition: '',

  teachingIdPrefix: '',
  teachingIdStartNo: '',
  teachingIdPadding: '',
  teachingIdIncludeYear: true,
  teachingIdSeparator: '',
  teachingIdPosition: '',

  nonTeachingIdPrefix: '',
  nonTeachingIdStartNo: '',
  nonTeachingIdPadding: '',
  nonTeachingIdIncludeYear: true,
  nonTeachingIdSeparator: '',
  nonTeachingIdPosition: '',

  customSequences: []
};

const STORAGE_KEY = 'id_sequence_settings';

export function getIdSequenceSettings(): IdSequenceSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultIdSequenceSettings,
        ...parsed,
        customSequences: Array.isArray(parsed.customSequences) ? parsed.customSequences : [],
        studentIdPrefix: parsed.studentIdPrefix ?? defaultIdSequenceSettings.studentIdPrefix,
        studentIdStartNo: parsed.studentIdStartNo ? parsed.studentIdStartNo : '',
        teachingIdPrefix: parsed.teachingIdPrefix ?? defaultIdSequenceSettings.teachingIdPrefix,
        teachingIdStartNo: parsed.teachingIdStartNo ? parsed.teachingIdStartNo : '',
        nonTeachingIdPrefix: parsed.nonTeachingIdPrefix ?? defaultIdSequenceSettings.nonTeachingIdPrefix,
        nonTeachingIdStartNo: parsed.nonTeachingIdStartNo ? parsed.nonTeachingIdStartNo : '',
        admissionNoPrefix: parsed.admissionNoPrefix ?? defaultIdSequenceSettings.admissionNoPrefix,
        admissionNoStartNo: parsed.admissionNoStartNo ? parsed.admissionNoStartNo : '',
        studentIdPosition: parsed.studentIdPosition ?? defaultIdSequenceSettings.studentIdPosition,
        admissionNoPosition: parsed.admissionNoPosition ?? defaultIdSequenceSettings.admissionNoPosition,
        teachingIdPosition: parsed.teachingIdPosition ?? defaultIdSequenceSettings.teachingIdPosition,
        nonTeachingIdPosition: parsed.nonTeachingIdPosition ?? defaultIdSequenceSettings.nonTeachingIdPosition,
        studentIdPadding: parsed.studentIdPadding ? parsed.studentIdPadding : '',
        admissionNoPadding: parsed.admissionNoPadding ? parsed.admissionNoPadding : '',
        teachingIdPadding: parsed.teachingIdPadding ? parsed.teachingIdPadding : '',
        nonTeachingIdPadding: parsed.nonTeachingIdPadding ? parsed.nonTeachingIdPadding : '',
        studentIdSeparator: parsed.studentIdSeparator ?? defaultIdSequenceSettings.studentIdSeparator,
        admissionNoSeparator: parsed.admissionNoSeparator ?? defaultIdSequenceSettings.admissionNoSeparator,
        teachingIdSeparator: parsed.teachingIdSeparator ?? defaultIdSequenceSettings.teachingIdSeparator,
        nonTeachingIdSeparator: parsed.nonTeachingIdSeparator ?? defaultIdSequenceSettings.nonTeachingIdSeparator,
      };
    }
  } catch (e) {}
  return defaultIdSequenceSettings;
}

export function saveIdSequenceSettings(settings: IdSequenceSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('id_sequence_settings_updated'));
  } catch (e) {}
}

/**
 * Generic helper to construct an ID string based on settings and existing items
 */
export function buildFormattedId(
  prefix: string,
  startNo: number,
  padding: number | string,
  includeYear: boolean,
  separator: string,
  position: TagPosition | string = 'start',
  existingIds: string[] = []
): string {
  const cleanPrefix = (prefix || '').trim().toUpperCase();
  const sep = (separator === 'none' || separator === '__none__')
    ? ''
    : (separator !== undefined && separator !== '' ? separator : '-');
  const pos = position || 'start';
  const pad = Number(padding) || 4;
  const yearStr = includeYear ? `${new Date().getFullYear()}` : '';

  // Extract highest numerical suffix in existing IDs
  let maxSeq = Math.max(0, (startNo || 1) - 1);
  const targetIds = cleanPrefix && existingIds.some(s => s && s.toUpperCase().includes(cleanPrefix))
    ? existingIds.filter(s => s && s.toUpperCase().includes(cleanPrefix))
    : existingIds;

  targetIds.forEach((idStr) => {
    if (!idStr) return;
    const digitsMatch = idStr.match(/\d+/g);
    if (digitsMatch) {
      digitsMatch.forEach((dig) => {
        const num = parseInt(dig, 10);
        if (!isNaN(num)) {
          // If multiple digit matches exist and this one looks like a 4-digit year, ignore it
          if (digitsMatch.length > 1 && num >= 2020 && num <= 2035) {
            return;
          }
          if (num > maxSeq) {
            maxSeq = num;
          }
        }
      });
    }
  });

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(pad, '0');

  const parts: string[] = [];

  if (pos === 'start') {
    if (cleanPrefix) parts.push(cleanPrefix);
    if (yearStr) parts.push(yearStr);
    parts.push(paddedSeq);
  } else if (pos === 'middle') {
    if (yearStr) parts.push(yearStr);
    if (cleanPrefix) parts.push(cleanPrefix);
    parts.push(paddedSeq);
  } else if (pos === 'end') {
    if (yearStr) parts.push(yearStr);
    parts.push(paddedSeq);
    if (cleanPrefix) parts.push(cleanPrefix);
  }

  return parts.filter(Boolean).join(sep);
}

/**
 * Generate preview ID string without inspecting existing arrays
 */
export function buildPreviewId(
  prefix: string,
  startNo: number | string,
  padding: number | string,
  includeYear: boolean,
  separator: string,
  position: TagPosition | string = 'start',
  fallbackPrefix: string = ''
): string {
  const cleanPrefix = (prefix || '').trim().toUpperCase();
  const defaultFallbackNo = fallbackPrefix === 'TCH' ? 501 : fallbackPrefix === 'NTS' ? 801 : fallbackPrefix === 'ADM' ? 2001 : 1001;
  const sep = (separator === 'none' || separator === '__none__')
    ? ''
    : (separator !== undefined && separator !== '' ? separator : '-');
  const pos = position || 'start';
  const pad = Number(padding) || 4;
  const yearStr = includeYear ? `${new Date().getFullYear()}` : '';
  const paddedSeq = String(startNo || defaultFallbackNo).padStart(pad, '0');

  const parts: string[] = [];

  if (pos === 'start') {
    if (cleanPrefix) parts.push(cleanPrefix);
    if (yearStr) parts.push(yearStr);
    parts.push(paddedSeq);
  } else if (pos === 'middle') {
    if (yearStr) parts.push(yearStr);
    if (cleanPrefix) parts.push(cleanPrefix);
    parts.push(paddedSeq);
  } else if (pos === 'end') {
    if (yearStr) parts.push(yearStr);
    parts.push(paddedSeq);
    if (cleanPrefix) parts.push(cleanPrefix);
  }

  return parts.filter(Boolean).join(sep);
}

/**
 * Generate Next Student ID
 */
export function generateNextStudentId(students: Student[] = []): string {
  const config = getIdSequenceSettings();
  const existingIds = students.map(s => s.id || '').filter(Boolean);
  return buildFormattedId(
    config.studentIdPrefix,
    config.studentIdStartNo,
    config.studentIdPadding,
    config.studentIdIncludeYear,
    config.studentIdSeparator,
    config.studentIdPosition,
    existingIds
  );
}

/**
 * Generate Next Admission Number
 */
export function generateNextAdmissionNo(students: Student[] = []): string {
  const config = getIdSequenceSettings();
  const existingNos = students.map(s => s.admissionNo || '').filter(Boolean);
  return buildFormattedId(
    config.admissionNoPrefix,
    config.admissionNoStartNo,
    config.admissionNoPadding,
    config.admissionNoIncludeYear,
    config.admissionNoSeparator,
    config.admissionNoPosition,
    existingNos
  );
}

/**
 * Generate Next Employee / Staff ID separate for Teaching vs Non-Teaching
 */
export function generateNextEmployeeId(staff: Staff[] = [], category?: string): string {
  const config = getIdSequenceSettings();
  const isTeaching = !category || category === "Teaching Staff" || category === "Teacher";
  
  const allExisting = new Set(
    staff.map(s => String(s.empId || (s as any).employeeId || s.id || '').toUpperCase().trim()).filter(Boolean)
  );

  const prefix = isTeaching ? config.teachingIdPrefix : config.nonTeachingIdPrefix;
  const startNo = isTeaching ? config.teachingIdStartNo : config.nonTeachingIdStartNo;
  const padding = isTeaching ? config.teachingIdPadding : config.nonTeachingIdPadding;
  const includeYear = isTeaching ? config.teachingIdIncludeYear : config.nonTeachingIdIncludeYear;
  const separator = isTeaching ? config.teachingIdSeparator : config.nonTeachingIdSeparator;
  const position = isTeaching ? config.teachingIdPosition : config.nonTeachingIdPosition;

  const relevantEmpIds = staff
    .filter(s => isTeaching 
      ? (!s.employeeCategory || (s.employeeCategory as string) === "Teaching Staff" || s.employeeCategory === "Teacher")
      : ((s.employeeCategory as string) === "Non-Teaching Staff" || s.employeeCategory === "Staff"))
    .map(s => String(s.empId || (s as any).employeeId || s.id || '').trim())
    .filter(Boolean);

  let candidate = buildFormattedId(
    prefix,
    startNo,
    padding,
    includeYear,
    separator,
    position,
    relevantEmpIds
  );

  // If candidate is already taken by any staff member in the system, increment sequence until unique
  let currentStart = startNo;
  while (allExisting.has(candidate.toUpperCase().trim())) {
    currentStart++;
    candidate = buildFormattedId(
      prefix,
      currentStart,
      padding,
      includeYear,
      separator,
      position,
      [...relevantEmpIds, candidate]
    );
  }

  return candidate;
}

/**
 * Generate ID for a Custom Sequence by ID or Name
 */
export function generateNextCustomId(sequenceId: string, existingIds: string[] = []): string {
  const config = getIdSequenceSettings();
  const customSeq = (config.customSequences || []).find(s => s.id === sequenceId || s.name.toLowerCase() === sequenceId.toLowerCase());
  if (!customSeq) return `CUSTOM-${Date.now().toString().slice(-4)}`;

  return buildFormattedId(
    customSeq.prefix,
    customSeq.startNo,
    customSeq.padding,
    customSeq.includeYear,
    customSeq.separator,
    customSeq.position,
    existingIds
  );
}

/**
 * Format or display a Student Admission Number using configured Automated ID Settings
 */
export function formatConfiguredStudentAdmissionNo(admissionNo?: string, studentId?: string | number): string {
  if (admissionNo && admissionNo.trim()) return admissionNo.trim();
  const config = getIdSequenceSettings();
  const prefix = config.admissionNoPrefix || config.studentIdPrefix || 'STU';
  const sep = config.admissionNoSeparator || '-';
  const yearStr = config.admissionNoIncludeYear ? `${new Date().getFullYear()}` : '';
  const padding = config.admissionNoPadding || 4;
  
  if (studentId != null && String(studentId).trim()) {
    const rawIdStr = String(studentId).trim();
    if (rawIdStr.toUpperCase().startsWith(prefix.toUpperCase())) {
      return rawIdStr;
    }
    const num = parseInt(rawIdStr.replace(/\D/g, ''), 10);
    const padded = !isNaN(num) ? String(num).padStart(padding, '0') : rawIdStr;
    const parts = [prefix, yearStr, padded].filter(Boolean);
    return parts.join(sep);
  }
  
  return '—';
}
