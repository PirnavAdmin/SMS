export function uniqueTag(prefix = 'AUTOTEST'): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function uniquePhone(): string {
  const tail = String(Math.floor(100000000 + Math.random() * 899999999));
  return `9${tail}`;
}

export function uniqueEmail(prefix = 'autotest'): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.test`;
}

export function buildAdmissionPayload(overrides: Record<string, unknown> = {}) {
  const tag = uniqueTag('ADM');
  return {
    firstName: 'Auto',
    lastName: tag,
    applicantFullName: `Auto ${tag}`,
    dateOfBirth: '2014-05-15',
    admissionDate: new Date().toISOString().slice(0, 10),
    gender: 'Male',
    appliedClassId: 1,
    appliedClass: 'Class 1',
    section: 'A',
    status: 'Pending',
    academicYear: '2026-2027',
    branch: 'Main Campus',
    fatherName: 'Auto Guardian',
    fatherMobile: uniquePhone(),
    parentEmail: uniqueEmail('parent'),
    address: '100 QA Automation Way',
    ...overrides,
  };
}

export function buildDepartmentPayload(overrides: Record<string, unknown> = {}) {
  const suffix = String(Date.now()).slice(-5);
  return {
    departmentName: `QA Department ${suffix}`,
    departmentCode: `QAD${suffix}`,
    description: 'Created by automated test suite',
    status: 'Active',
    ...overrides,
  };
}

export function buildSubjectPayload(overrides: Record<string, unknown> = {}) {
  const suffix = String(Date.now()).slice(-5);
  return {
    subjectCode: `QAS-${suffix}`,
    subjectName: `QA Subject ${suffix}`,
    subjectType: 'Core',
    credits: 3,
    status: 'Active',
    ...overrides,
  };
}

export function buildFeeHeadPayload(overrides: Record<string, unknown> = {}) {
  const suffix = String(Date.now()).slice(-5);
  return {
    name: `QA Fee Head ${suffix}`,
    code: `QAFH${suffix}`,
    category: 'Academic',
    frequency: 'Annual',
    amount: 2500,
    status: 'Active',
    academicYear: '2026-2027',
    applicableBranches: ['All Branches'],
    applicableClasses: ['All Classes'],
    ...overrides,
  };
}

export function buildStaffPayload(overrides: Record<string, unknown> = {}) {
  const suffix = String(Date.now()).slice(-5);
  return {
    firstName: 'QA',
    lastName: `Staff${suffix}`,
    email: uniqueEmail('staff'),
    phone: uniquePhone(),
    gender: 'Female',
    department: 'Academics',
    designation: 'Teacher',
    role: 'Teacher',
    employmentType: 'Full-Time',
    joiningDate: new Date().toISOString().slice(0, 10),
    basicSalary: 35000,
    status: 'Active',
    ...overrides,
  };
}
