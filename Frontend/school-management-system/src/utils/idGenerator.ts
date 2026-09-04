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
  studentIdStartNo: number;
  studentIdPadding: number;
  studentIdIncludeYear: boolean;
  studentIdSeparator: string;
  studentIdPosition: TagPosition;

  // Admission No Config
  admissionNoPrefix: string;
  admissionNoStartNo: number;
  admissionNoPadding: number;
  admissionNoIncludeYear: boolean;
  admissionNoSeparator: string;
  admissionNoPosition: TagPosition;

  // Teaching Staff ID Config
  teachingIdPrefix: string;
  teachingIdStartNo: number;
  teachingIdPadding: number;
  teachingIdIncludeYear: boolean;
  teachingIdSeparator: string;
  teachingIdPosition: TagPosition;

  // Non-Teaching Staff ID Config
  nonTeachingIdPrefix: string;
  nonTeachingIdStartNo: number;
  nonTeachingIdPadding: number;
  nonTeachingIdIncludeYear: boolean;
  nonTeachingIdSeparator: string;
  nonTeachingIdPosition: TagPosition;

  // User Defined Custom Automated ID Sequences
  customSequences: CustomIdSequence[];
}

export const defaultIdSequenceSettings: IdSequenceSettings = {
  studentIdPrefix: 'STU',
  studentIdStartNo: 1001,
  studentIdPadding: 4,
  studentIdIncludeYear: true,
  studentIdSeparator: '-',
  studentIdPosition: 'start',

  admissionNoPrefix: 'ADM',
  admissionNoStartNo: 2001,
  admissionNoPadding: 4,
  admissionNoIncludeYear: true,
  admissionNoSeparator: '-',
  admissionNoPosition: 'start',

  teachingIdPrefix: 'TCH',
  teachingIdStartNo: 501,
  teachingIdPadding: 4,
  teachingIdIncludeYear: true,
  teachingIdSeparator: '-',
  teachingIdPosition: 'start',

  nonTeachingIdPrefix: 'NTS',
  nonTeachingIdStartNo: 801,
  nonTeachingIdPadding: 4,
  nonTeachingIdIncludeYear: true,
  nonTeachingIdSeparator: '-',
  nonTeachingIdPosition: 'start',

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
        studentIdPosition: parsed.studentIdPosition || defaultIdSequenceSettings.studentIdPosition,
        admissionNoPosition: parsed.admissionNoPosition || defaultIdSequenceSettings.admissionNoPosition,
        teachingIdPosition: parsed.teachingIdPosition || defaultIdSequenceSettings.teachingIdPosition,
        nonTeachingIdPosition: parsed.nonTeachingIdPosition || defaultIdSequenceSettings.nonTeachingIdPosition,

        teachingIdPrefix: parsed.teachingIdPrefix || parsed.employeeIdPrefix || defaultIdSequenceSettings.teachingIdPrefix,
        teachingIdStartNo: parsed.teachingIdStartNo || parsed.employeeIdStartNo || defaultIdSequenceSettings.teachingIdStartNo,
        teachingIdPadding: parsed.teachingIdPadding || parsed.employeeIdPadding || defaultIdSequenceSettings.teachingIdPadding,
        teachingIdIncludeYear: parsed.teachingIdIncludeYear ?? parsed.employeeIdIncludeYear ?? defaultIdSequenceSettings.teachingIdIncludeYear,
        teachingIdSeparator: parsed.teachingIdSeparator ?? parsed.employeeIdSeparator ?? defaultIdSequenceSettings.teachingIdSeparator,

        nonTeachingIdPrefix: parsed.nonTeachingIdPrefix || defaultIdSequenceSettings.nonTeachingIdPrefix,
        nonTeachingIdStartNo: parsed.nonTeachingIdStartNo || defaultIdSequenceSettings.nonTeachingIdStartNo,
        nonTeachingIdPadding: parsed.nonTeachingIdPadding || defaultIdSequenceSettings.nonTeachingIdPadding,
        nonTeachingIdIncludeYear: parsed.nonTeachingIdIncludeYear ?? defaultIdSequenceSettings.nonTeachingIdIncludeYear,
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
  padding: number,
  includeYear: boolean,
  separator: string,
  position: TagPosition = 'start',
  existingIds: string[] = []
): string {
  const cleanPrefix = (prefix || '').trim().toUpperCase();
  const sep = separator !== undefined ? separator : '-';
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
  const paddedSeq = String(nextSeq).padStart(padding || 4, '0');

  const parts: string[] = [];

  if (position === 'start') {
    if (cleanPrefix) parts.push(cleanPrefix);
    if (yearStr) parts.push(yearStr);
    parts.push(paddedSeq);
  } else if (position === 'middle') {
    if (yearStr) parts.push(yearStr);
    if (cleanPrefix) parts.push(cleanPrefix);
    parts.push(paddedSeq);
  } else if (position === 'end') {
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
  startNo: number,
  padding: number,
  includeYear: boolean,
  separator: string,
  position: TagPosition = 'start'
): string {
  const cleanPrefix = (prefix || '').trim().toUpperCase();
  const sep = separator !== undefined ? separator : '-';
  const yearStr = includeYear ? `${new Date().getFullYear()}` : '';
  const paddedSeq = String(startNo || 1001).padStart(padding || 4, '0');

  const parts: string[] = [];

  if (position === 'start') {
    if (cleanPrefix) parts.push(cleanPrefix);
    if (yearStr) parts.push(yearStr);
    parts.push(paddedSeq);
  } else if (position === 'middle') {
    if (yearStr) parts.push(yearStr);
    if (cleanPrefix) parts.push(cleanPrefix);
    parts.push(paddedSeq);
  } else if (position === 'end') {
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
  
  if (isTeaching) {
    const existingEmpIds = staff
      .filter(s => !s.employeeCategory || (s.employeeCategory as string) === "Teaching Staff" || s.employeeCategory === "Teacher")
      .map(s => s.empId || s.id || '')
      .filter(Boolean);

    return buildFormattedId(
      config.teachingIdPrefix,
      config.teachingIdStartNo,
      config.teachingIdPadding,
      config.teachingIdIncludeYear,
      config.teachingIdSeparator,
      config.teachingIdPosition,
      existingEmpIds
    );
  } else {
    const existingEmpIds = staff
      .filter(s => (s.employeeCategory as string) === "Non-Teaching Staff" || s.employeeCategory === "Staff")
      .map(s => s.empId || s.id || '')
      .filter(Boolean);

    return buildFormattedId(
      config.nonTeachingIdPrefix,
      config.nonTeachingIdStartNo,
      config.nonTeachingIdPadding,
      config.nonTeachingIdIncludeYear,
      config.nonTeachingIdSeparator,
      config.nonTeachingIdPosition,
      existingEmpIds
    );
  }
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
