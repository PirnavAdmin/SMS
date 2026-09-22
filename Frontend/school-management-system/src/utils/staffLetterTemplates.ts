import { Staff, SchoolProfile } from '../types';
import { GeneratedStaffLetterRecord, StaffLetterPayload, StaffLetterSalaryBreakdown, StaffLetterType } from '../types/staffLetter';

export const calculateSalaryBreakdown = (monthlySalary: number): StaffLetterSalaryBreakdown => {
  const grossMonthly = Math.max(0, monthlySalary || 0);
  const basic = Math.round(grossMonthly * 0.5);
  const hra = Math.round(grossMonthly * 0.2);
  const transportAllowance = Math.round(grossMonthly * 0.1);
  const specialAllowance = Math.max(0, grossMonthly - (basic + hra + transportAllowance));
  const annualCtc = grossMonthly * 12;

  return {
    basic,
    hra,
    specialAllowance,
    transportAllowance,
    grossMonthly,
    annualCtc,
  };
};

export const generateLetterRefNo = (type: StaffLetterType, empId?: string): string => {
  const prefix = type === 'offer' ? 'OFF' : type === 'relieving' ? 'REL' : 'EXP';
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const suffix = empId ? empId.replace(/[^a-zA-Z0-9]/g, '') : rand;
  return `${prefix}/${year}/${suffix}`;
};

export const DEFAULT_OFFER_TERMS = [
  'Probation: You will be on probation for a period of 6 (six) months from your date of joining. The management reserves the right to extend the probation period based on performance evaluation.',
  'Working Hours: Normal school working hours are 08:30 AM to 04:00 PM, Monday through Saturday (with designated 2nd and 4th Saturday offs as per institutional calendar).',
  'Code of Conduct: You are expected to uphold the highest standard of academic excellence, student safety, and professional ethics as prescribed by the School Management and Regulatory Boards.',
  'Notice Period: During probation, either party may terminate the appointment by providing 1 (one) month written notice or salary in lieu thereof. Post confirmation, the notice period shall be 3 (three) months or completion of the ongoing academic term.',
  'Confidentiality & Non-Disclosure: All curriculum materials, assessment records, student data, and institutional policies are proprietary and must remain confidential.',
];

export const getDefaultLetterPayload = (
  type: StaffLetterType,
  staff: Staff,
  schoolProfile?: SchoolProfile
): StaffLetterPayload => {
  const todayStr = new Date().toISOString().split('T')[0];
  const monthlySalary = typeof staff.salary === 'number'
    ? staff.salary
    : parseFloat(String(staff.salary || (staff as any).basicSalary || (staff as any).grossSalary || (staff as any).netSalary || '0')) || 35000;

  const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || (staff as any).name || 'Staff Member';
  const defaultSignatoryName = schoolProfile?.principalName || 'Dr. K. S. Sharma';
  const defaultSignatoryTitle = 'Principal & Authorized Signatory';
  const staffAddress = staff.presentAddress || staff.residentialAddress || staff.permanentAddress || staff.address || (schoolProfile?.address || '');
  const staffBranch = staff.branch || (staff as any).campus || 'Main Campus';
  const staffDesignation = staff.designation || (staff.role === 'Teacher' ? 'Subject Teacher' : (staff.role || 'Staff Member'));
  const staffDepartment = staff.department || (staff.role === 'Teacher' ? 'Academics' : 'Administration');
  const staffJoiningDate = staff.joiningDate || (staff as any).dateOfJoining || todayStr;

  const checkIn = schoolProfile?.staffCheckInTime || '08:30 AM';
  const checkOut = schoolProfile?.staffCheckOutTime || '05:00 PM';
  const dynamicWorkingHours = `${checkIn} – ${checkOut}`;
  const dynamicTerms = DEFAULT_OFFER_TERMS.map(term =>
    term.startsWith('Working Hours:')
      ? `Working Hours: Normal school working hours are ${checkIn} to ${checkOut}, Monday through Saturday (with designated 2nd and 4th Saturday offs as per institutional calendar).`
      : term
  );

  return {
    refNo: generateLetterRefNo(type, staff.empId || staff.id),
    issueDate: todayStr,
    candidateName: fullName,
    empId: staff.empId || staff.id || '',
    address: staffAddress,
    phone: staff.phone || (staff as any).mobile || (staff as any).phoneNumber || '',
    email: staff.email || '',
    designation: staffDesignation,
    department: staffDepartment,
    branch: staffBranch,
    joiningDate: staffJoiningDate,
    relievingDate: type !== 'offer' ? todayStr : undefined,
    salaryBreakdown: calculateSalaryBreakdown(monthlySalary),
    probationMonths: 6,
    noticePeriodDays: 30,
    workingHours: dynamicWorkingHours,
    conductRating: 'Exemplary',
    noDuesCleared: true,
    reasonForRelieving: 'Personal reasons & career advancement',
    authorizedSignatoryName: defaultSignatoryName,
    authorizedSignatoryTitle: defaultSignatoryTitle,
    customTerms: dynamicTerms,
    remarks: 'Approved and issued by Institutional Human Resources.',
  };
};

const STORAGE_KEY = 'edu_db_staff_letters';

export const createStaffLetterRecord = (
  type: StaffLetterType,
  staff: Staff,
  schoolProfile?: SchoolProfile,
  customIssueDate?: string
): GeneratedStaffLetterRecord => {
  const payload = getDefaultLetterPayload(type, staff, schoolProfile);
  if (customIssueDate) {
    payload.issueDate = customIssueDate;
  }
  const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || (staff as any).name || 'Staff Member';
  return {
    id: `LTR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}-${staff.id || staff.empId || '01'}`,
    letterNumber: payload.refNo,
    letterType: type,
    staffId: staff.id || '',
    staffEmpId: staff.empId || '',
    staffName: fullName,
    designation: payload.designation,
    department: payload.department,
    branch: payload.branch,
    issueDate: payload.issueDate,
    generatedBy: 'Institutional HR Administration',
    status: 'Issued',
    payload: payload,
  };
};

export const generateSeedStaffLetters = (staffList?: Staff[], schoolProfile?: SchoolProfile): GeneratedStaffLetterRecord[] => {
  const targetList = staffList && staffList.length > 0 ? staffList : [];
  const initialLetters: GeneratedStaffLetterRecord[] = [];

  // Generate official offer letters for all staff in list (up to 12)
  targetList.slice(0, 12).forEach((s, idx) => {
    const issueDate = s.joiningDate || new Date(Date.now() - (idx * 30 + 10) * 86400000).toISOString().split('T')[0];
    const rec = createStaffLetterRecord('offer', s, schoolProfile, issueDate);
    initialLetters.push(rec);
  });

  // Also add sample relieving & experience letters if we have enough staff
  if (targetList.length > 3) {
    const s1 = targetList[2];
    const s2 = targetList[3];
    if (s1) {
      const expRec = createStaffLetterRecord('experience', s1, schoolProfile);
      initialLetters.push(expRec);
    }
    if (s2) {
      const relRec = createStaffLetterRecord('relieving', s2, schoolProfile);
      initialLetters.push(relRec);
    }
  }

  return initialLetters;
};

export const getStoredStaffLetters = (fallbackStaff?: Staff[], schoolProfile?: SchoolProfile): GeneratedStaffLetterRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load staff letters from storage:', e);
  }

  // Seed default letters if empty
  const seeded = generateSeedStaffLetters(fallbackStaff, schoolProfile);
  if (seeded.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    } catch (e) {
      console.warn('Failed to cache seed staff letters:', e);
    }
  }
  return seeded;
};

export const syncStaffLettersWithStaffList = (staffList: Staff[], schoolProfile?: SchoolProfile): GeneratedStaffLetterRecord[] => {
  try {
    const currentLetters = getStoredStaffLetters(staffList, schoolProfile);
    const existingStaffMap = new Set(currentLetters.map((l) => `${l.staffId || l.staffEmpId}_${l.letterType}`));

    const newLetters: GeneratedStaffLetterRecord[] = [];

    (staffList || []).forEach((s) => {
      const idKey = `${s.id || s.empId}_offer`;
      if (!existingStaffMap.has(idKey)) {
        const newOffer = createStaffLetterRecord('offer', s, schoolProfile, s.joiningDate);
        newLetters.push(newOffer);
        existingStaffMap.add(idKey);
      }
    });

    if (newLetters.length > 0) {
      const combined = [...newLetters, ...currentLetters];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
      window.dispatchEvent(new Event('staff_letters_updated'));
      return combined;
    }

    return currentLetters;
  } catch (e) {
    console.warn('Error in syncStaffLettersWithStaffList:', e);
    return getStoredStaffLetters();
  }
};

export const saveStaffLetterRecord = (record: GeneratedStaffLetterRecord): GeneratedStaffLetterRecord[] => {
  try {
    const existing = getStoredStaffLetters();
    const filtered = existing.filter((r) => r.id !== record.id);
    const updated = [record, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('staff_letters_updated'));
    return updated;
  } catch (e) {
    console.warn('Failed to save staff letter record:', e);
    return [];
  }
};

export const deleteStaffLetterRecord = (id: string): GeneratedStaffLetterRecord[] => {
  try {
    const existing = getStoredStaffLetters();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('staff_letters_updated'));
    return updated;
  } catch (e) {
    console.warn('Failed to delete staff letter record:', e);
    return [];
  }
};

export const getLettersForStaff = (staffIdOrEmpId: string): GeneratedStaffLetterRecord[] => {
  const all = getStoredStaffLetters();
  const target = String(staffIdOrEmpId || '').toLowerCase().trim();
  return all.filter(
    (l) =>
      String(l.staffId || '').toLowerCase().trim() === target ||
      String(l.staffEmpId || '').toLowerCase().trim() === target
  );
};
