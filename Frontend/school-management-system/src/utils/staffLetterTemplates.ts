import { Staff, SchoolProfile, SalaryStructure, EmployeeSalaryAssignment } from '../types';
import { GeneratedStaffLetterRecord, StaffLetterPayload, StaffLetterSalaryBreakdown, StaffLetterType } from '../types/staffLetter';
import { createOrSaveStaffLetterApi, deleteStaffLetterApi, fetchStaffLettersApi } from '../api/staffLetters';

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

export const resolveStaffSalaryBreakdown = (
  staff?: Partial<Staff> | null,
  salaryStructures?: SalaryStructure[],
  employeeSalaryAssignments?: EmployeeSalaryAssignment[],
  existingBreakdown?: StaffLetterSalaryBreakdown | null
): StaffLetterSalaryBreakdown => {
  if (!staff) {
    if (
      existingBreakdown &&
      existingBreakdown.grossMonthly > 0 &&
      (existingBreakdown.basic > 0 || existingBreakdown.annualCtc > 0)
    ) {
      return existingBreakdown;
    }
    return calculateSalaryBreakdown(0);
  }

  const staffIdStr = String(staff.id || '');
  const empIdStr = String(staff.empId || '');
  const fullNameStr = `${staff.firstName || ''} ${staff.lastName || ''}`.trim().toLowerCase();

  // 1. Try resolving strictly from active EmployeeSalaryAssignments for this staff
  let matchingAssignment: EmployeeSalaryAssignment | undefined;
  if (employeeSalaryAssignments && employeeSalaryAssignments.length > 0) {
    matchingAssignment = employeeSalaryAssignments.find((a) => {
      const matchEmp = (staffIdStr && String(a.employeeId) === staffIdStr) || (empIdStr && a.empId === empIdStr);
      const matchName = fullNameStr && a.employeeName && a.employeeName.toLowerCase().trim() === fullNameStr;
      return (matchEmp || matchName) && a.status === 'Active';
    });
  }

  // 2. Try resolving from SalaryStructures manually linked to this staff
  let matchingStructure: SalaryStructure | undefined;
  if (salaryStructures && salaryStructures.length > 0) {
    if (matchingAssignment?.salaryStructureId) {
      matchingStructure = salaryStructures.find(
        (s) => String(s.id) === String(matchingAssignment!.salaryStructureId)
      );
    }

    if (!matchingStructure && matchingAssignment?.salaryStructureName) {
      matchingStructure = salaryStructures.find(
        (s) => s.structureName.toLowerCase().trim() === matchingAssignment!.salaryStructureName.toLowerCase().trim()
      );
    }

    if (!matchingStructure && (staff as any).salaryStructureId) {
      matchingStructure = salaryStructures.find(
        (s) => String(s.id) === String((staff as any).salaryStructureId)
      );
    }

    if (!matchingStructure && (staff as any).salaryStructureName) {
      matchingStructure = salaryStructures.find(
        (s) => s.structureName.toLowerCase().trim() === (staff as any).salaryStructureName.toLowerCase().trim()
      );
    }

    if (!matchingStructure) {
      matchingStructure = salaryStructures.find(
        (s) =>
          ((s as any).staffId && (String((s as any).staffId) === staffIdStr || (s as any).staffId === empIdStr)) ||
          ((s as any).employeeId && String((s as any).employeeId) === staffIdStr)
      );
    }
    // Note: Do NOT fall back to matching by role/designation! Salary structures must only be taken if manually assigned.
  }

  // 3. If a manually assigned structure was found, compute detailed breakdown
  if (matchingStructure) {
    const earnings = matchingStructure.earnings || [];
    const basicLine = earnings.find((e) => /basic/i.test(e.name));
    const hraLine = earnings.find((e) => /hra|house/i.test(e.name));
    const travelLine = earnings.find((e) => /travel|transport|conveyance/i.test(e.name));

    const structGross = Number(
      matchingStructure.grossSalary ||
      earnings.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) ||
      matchingAssignment?.monthlyGross ||
      0
    );

    if (structGross > 0) {
      const basic = Number(
        matchingAssignment?.overrideBasicSalary ??
        (basicLine?.amount && basicLine.amount > 0 ? basicLine.amount : Math.round(structGross * 0.5))
      );
      const hra = Number(
        hraLine?.amount && hraLine.amount > 0 ? hraLine.amount : Math.round(structGross * 0.2)
      );
      const transportAllowance = Number(
        travelLine?.amount && travelLine.amount > 0 ? travelLine.amount : Math.round(structGross * 0.1)
      );

      const otherEarningsSum = earnings
        .filter((e) => e !== basicLine && e !== hraLine && e !== travelLine)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const specialAllowance = otherEarningsSum > 0
        ? otherEarningsSum
        : Math.max(0, structGross - (basic + hra + transportAllowance));

      return {
        basic,
        hra,
        transportAllowance,
        specialAllowance,
        grossMonthly: structGross,
        annualCtc: structGross * 12,
      };
    }
  }

  // 4. If assignment has gross salary
  if (matchingAssignment && (matchingAssignment.monthlyGross || matchingAssignment.overrideBasicSalary)) {
    const gross = Number(matchingAssignment.monthlyGross || 0);
    if (gross > 0) {
      const basic = Number(matchingAssignment.overrideBasicSalary || Math.round(gross * 0.5));
      const allowances = Number(matchingAssignment.overrideAllowances || Math.max(0, gross - basic));
      const hra = Math.round(basic * 0.4);
      const transport = Math.min(1600, Math.round(gross * 0.1));
      const special = Math.max(0, allowances - (hra + transport));
      return {
        basic,
        hra,
        transportAllowance: transport,
        specialAllowance: special,
        grossMonthly: gross,
        annualCtc: gross * 12,
      };
    }
  }

  // 5. Fallback: only if staff has an explicit personal gross salary with an assigned structure
  const candidateGross = [
    staff.grossSalary,
    (staff as any).monthlyGross,
    (staff as any).monthlySalary,
    (staff as any).basicSalary,
    staff.salary,
    (staff as any).netSalary,
  ]
    .map((v) => (typeof v === 'number' ? v : parseFloat(String(v || '0'))))
    .find((v) => typeof v === 'number' && !isNaN(v) && v > 0);

  if (candidateGross && candidateGross > 0 && ((staff as any).salaryStructureId || matchingAssignment)) {
    return calculateSalaryBreakdown(candidateGross);
  }

  // If the staff has no assigned salary structure in payroll, return 0 breakdown
  return calculateSalaryBreakdown(0);
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

/**
 * Resolves the staff member's complete real address from the Staff Directory.
 * Checks present/residential/permanent addresses along with city, state, and pin code.
 */
export const getStaffRealAddress = (staff?: Partial<Staff> | null): string => {
  if (!staff) return '';

  // 1. Primary street address candidates from staff directory
  const street = (
    staff.presentAddress ||
    (staff as any).currentAddress ||
    staff.residentialAddress ||
    staff.address ||
    staff.permanentAddress ||
    ''
  ).trim();

  // 2. City or district
  const city = (staff.city || (staff as any).district || '').trim();

  // 3. State
  const state = (staff.state || '').trim();

  // 4. Pin code
  const pin = (staff.pinCode || (staff as any).postalCode || (staff as any).zipCode || '').trim();

  // If street already contains city, state, or pinCode, do not repeat
  if (street) {
    const streetLower = street.toLowerCase();
    const parts: string[] = [street];

    if (city && !streetLower.includes(city.toLowerCase())) {
      parts.push(city);
    }
    if (state && !streetLower.includes(state.toLowerCase())) {
      parts.push(state);
    }
    let formatted = parts.join(', ');
    if (pin && !street.includes(pin)) {
      formatted += ` - ${pin}`;
    }
    return formatted.trim();
  }

  // If no street address was provided, format from city, state, pinCode
  const locationParts = [city, state].filter(Boolean);
  let res = locationParts.join(', ');
  if (pin) {
    res = res ? `${res} - ${pin}` : pin;
  }
  return res.trim();
};

export const getEmptyLetterPayload = (
  type: StaffLetterType,
  schoolProfile?: SchoolProfile
): StaffLetterPayload => {
  const todayStr = new Date().toISOString().split('T')[0];
  const checkIn = schoolProfile?.staffCheckInTime || '08:30 AM';
  const checkOut = schoolProfile?.staffCheckOutTime || '05:00 PM';
  const dynamicWorkingHours = `${checkIn} – ${checkOut}`;
  const dynamicTerms = DEFAULT_OFFER_TERMS.map((term) =>
    term.startsWith('Working Hours:')
      ? `Working Hours: Normal school working hours are ${checkIn} to ${checkOut}, Monday through Saturday (with designated 2nd and 4th Saturday offs as per institutional calendar).`
      : term
  );

  return {
    refNo: '',
    issueDate: '',
    candidateName: '',
    empId: '',
    address: '',
    phone: '',
    email: '',
    designation: '',
    department: '',
    branch: (schoolProfile?.name || ''),
    joiningDate: '',
    relievingDate: type !== 'offer' ? todayStr : undefined,
    salaryBreakdown: calculateSalaryBreakdown(0),
    probationMonths: 0,
    noticePeriodDays: 0,
    workingHours: dynamicWorkingHours,
    conductRating: 'Exemplary',
    noDuesCleared: true,
    reasonForRelieving: 'Personal reasons & career advancement',
    authorizedSignatoryName: '',
    authorizedSignatoryTitle: '',
    signatureImageUrl: '',
    sealImageUrl: '',
    customTerms: dynamicTerms,
    remarks: 'Approved and issued by Institutional Human Resources.',
  };
};

export const getDefaultLetterPayload = (
  type: StaffLetterType,
  staff?: Staff | null,
  schoolProfile?: SchoolProfile,
  salaryStructures?: SalaryStructure[],
  employeeSalaryAssignments?: EmployeeSalaryAssignment[]
): StaffLetterPayload => {
  if (!staff) {
    return getEmptyLetterPayload(type, schoolProfile);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const salaryBreakdown = resolveStaffSalaryBreakdown(staff, salaryStructures, employeeSalaryAssignments);

  const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || (staff as any).name || '';

  let defaultSignatoryName = '';
  let defaultSignatoryTitle = '';
  let defaultProbationMonths = 0;
  let defaultNoticePeriodDays = 0;
  let defaultSignatureImageUrl = '';
  let defaultSealImageUrl = '';

  const staffAddress = getStaffRealAddress(staff);
  const staffBranch = staff.branch || (staff as any).campus || (schoolProfile?.name || '');
  const staffDesignation = staff.designation || (staff.role === 'Teacher' ? 'Subject Teacher' : (staff.role || 'Staff Member'));
  const staffDepartment = staff.department || (staff.role === 'Teacher' ? 'Academics' : 'Administration');
  const staffJoiningDate = staff.joiningDate || (staff as any).dateOfJoining || todayStr;

  const checkIn = schoolProfile?.staffCheckInTime || '08:30 AM';
  const checkOut = schoolProfile?.staffCheckOutTime || '05:00 PM';
  const dynamicWorkingHours = `${checkIn} – ${checkOut}`;
  const dynamicTerms = DEFAULT_OFFER_TERMS.map((term) =>
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
    salaryBreakdown: salaryBreakdown,
    probationMonths: defaultProbationMonths,
    noticePeriodDays: defaultNoticePeriodDays,
    workingHours: dynamicWorkingHours,
    conductRating: 'Exemplary',
    noDuesCleared: true,
    reasonForRelieving: 'Personal reasons & career advancement',
    authorizedSignatoryName: defaultSignatoryName,
    authorizedSignatoryTitle: defaultSignatoryTitle,
    signatureImageUrl: defaultSignatureImageUrl,
    sealImageUrl: defaultSealImageUrl,
    customTerms: dynamicTerms,
    remarks: 'Approved and issued by Institutional Human Resources.',
  };
};

// In-memory letter store without localStorage
let inMemoryLetters: GeneratedStaffLetterRecord[] = [];
let isFetchedFromApi = false;
const inMemoryDeletedKeys = new Set<string>();

export const getDeletedLetterKeys = (): Set<string> => {
  return inMemoryDeletedKeys;
};

export const markLetterAsDeleted = (letterId: string, staffKey?: string) => {
  if (letterId) inMemoryDeletedKeys.add(letterId);
  if (staffKey) inMemoryDeletedKeys.add(staffKey);
};

export const createStaffLetterRecord = (
  type: StaffLetterType,
  staff: Staff,
  schoolProfile?: SchoolProfile,
  customIssueDate?: string,
  salaryStructures?: SalaryStructure[],
  employeeSalaryAssignments?: EmployeeSalaryAssignment[]
): GeneratedStaffLetterRecord => {
  const payload = getDefaultLetterPayload(type, staff, schoolProfile, salaryStructures, employeeSalaryAssignments);
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

export const getStoredStaffLetters = (fallbackStaff?: Staff[], schoolProfile?: SchoolProfile): GeneratedStaffLetterRecord[] => {
  if (!isFetchedFromApi) {
    isFetchedFromApi = true;
    fetchStaffLettersApi()
      .then((res) => {
        if (Array.isArray(res?.data)) {
          inMemoryLetters = res.data;
          window.dispatchEvent(new Event('staff_letters_updated'));
        }
      })
      .catch(() => {});
  }
  return inMemoryLetters;
};

export const syncStaffLettersWithStaffList = (staffList: Staff[], schoolProfile?: SchoolProfile): GeneratedStaffLetterRecord[] => {
  return inMemoryLetters;
};

export const saveStaffLetterRecord = (record: GeneratedStaffLetterRecord): GeneratedStaffLetterRecord[] => {
  const staffKey = `${record.staffId || record.staffEmpId}_${record.letterType}`;
  if (inMemoryDeletedKeys.has(record.id) || inMemoryDeletedKeys.has(staffKey)) {
    inMemoryDeletedKeys.delete(record.id);
    inMemoryDeletedKeys.delete(staffKey);
  }

  const filtered = inMemoryLetters.filter((r) => r.id !== record.id);
  inMemoryLetters = [record, ...filtered];
  window.dispatchEvent(new Event('staff_letters_updated'));

  // Asynchronously save to backend database
  createOrSaveStaffLetterApi(record).catch((err) => {
    console.warn('Failed to persist staff letter to backend database:', err);
  });

  return inMemoryLetters;
};

export const deleteStaffLetterRecord = (id: string): GeneratedStaffLetterRecord[] => {
  const target = inMemoryLetters.find((r) => r.id === id);
  if (target) {
    const staffKey = `${target.staffId || target.staffEmpId}_${target.letterType}`;
    markLetterAsDeleted(id, staffKey);
  }
  inMemoryLetters = inMemoryLetters.filter((r) => r.id !== id);
  window.dispatchEvent(new Event('staff_letters_updated'));

  // Asynchronously delete from backend database
  deleteStaffLetterApi(id).catch((err) => {
    console.warn('Failed to delete staff letter from backend database:', err);
  });

  return inMemoryLetters;
};

export const refreshStaffLettersFromApi = async (): Promise<GeneratedStaffLetterRecord[]> => {
  try {
    const res = await fetchStaffLettersApi();
    if (Array.isArray(res?.data)) {
      inMemoryLetters = res.data;
      window.dispatchEvent(new Event('staff_letters_updated'));
      return inMemoryLetters;
    }
  } catch (err) {
    console.warn('Failed to fetch staff letters from API:', err);
  }
  return inMemoryLetters;
};

export const getLettersForStaff = (staffIdOrEmpId: string): GeneratedStaffLetterRecord[] => {
  if (!isFetchedFromApi) {
    getStoredStaffLetters();
  }
  const target = String(staffIdOrEmpId || '').toLowerCase().trim();
  return inMemoryLetters.filter(
    (l) =>
      String(l.staffId || '').toLowerCase().trim() === target ||
      String(l.staffEmpId || '').toLowerCase().trim() === target
  );
};
