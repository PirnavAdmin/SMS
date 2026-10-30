import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  UserRound,
  Briefcase,
  CalendarCheck2,
  WalletCards,
  FileText,
  CalendarDays,
  Award,
  LayoutGrid,
  Eye,
  Download,
  ShieldCheck,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Staff, StaffDocument, StaffEducationRecord, StaffExperienceRecord } from '../../../types';
import { StaffLetterType, GeneratedStaffLetterRecord } from '../../../types/staffLetter';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { fetchStaffByIdApi } from '../../../api/staff';
import { StaffLetterModal } from './Letters/StaffLetterModal';
import { getLettersForStaff } from '../../../utils/staffLetterTemplates';

type DrawerTab =
  | 'overview'
  | 'employment'
  | 'personal'
  | 'education'
  | 'experience'
  | 'bank'
  | 'documents'
  | 'payroll'
  | 'attendance'
  | 'leave'
;

interface StaffProfileDrawerProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
}

const tabs: { id: DrawerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'personal', label: 'Personal', icon: UserRound },
  { id: 'education', label: 'Education', icon: Award },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'bank', label: 'Bank', icon: WalletCards },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'payroll', label: 'Payroll', icon: WalletCards },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
  { id: 'leave', label: 'Leave', icon: CalendarDays },
];

function getCategoryLabel(category?: string) {
  return category === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff';
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeStaffRecord(raw: any): Staff {
  if (!raw) return raw;

  const rawDocs = raw.documents || [];
  const normalizedDocs = rawDocs.map((d: any) => {
    const title = d.title || d.documentTitle || d.documentType || d.name || 'Document';
    const type = d.type || d.documentType || d.docType || 'Certificate';
    const uploadedDate = d.uploadedDate || d.uploadedAt || d.uploadDate || '';
    const verificationStatus = d.verificationStatus || (d.isVerified ? 'Verified' : (d.status || 'Pending Verification'));
    return {
      ...d,
      id: d.id || String(Math.random()),
      title,
      documentTitle: title,
      type,
      documentType: type,
      uploadedDate: typeof uploadedDate === 'string' ? uploadedDate.split('T')[0] : '',
      uploadedAt: uploadedDate,
      verificationStatus,
      status: verificationStatus,
      fileUrl: d.fileUrl || '',
    };
  });

  const rawQuals = raw.qualifications || [];
  const normalizedQuals = rawQuals.map((q: any) => {
    const highestQualification = q.highestQualification || q.qualificationDegree || q.qualification || q.degree || '';
    const university = q.university || q.boardUniversity || q.institutionCollege || '';
    const year = (q.year || q.passingYear || '').toString();
    const percentage = (q.percentage || q.percentageCgpa || '').toString();
    const specialization = q.specialization || q.specializationSubject || '';
    return {
      ...q,
      id: q.id || String(Math.random()),
      highestQualification,
      qualificationDegree: highestQualification,
      university,
      boardUniversity: university,
      institutionCollege: q.institutionCollege || university,
      year,
      passingYear: year,
      percentage,
      percentageCgpa: percentage,
      specialization,
      specializationSubject: specialization,
      bed: q.bed || undefined,
      med: q.med || undefined,
      phd: q.phd || undefined,
    };
  });

  const rawExp = raw.experienceRecords || [];
  const normalizedExp = rawExp.map((e: any) => {
    const org = e.organization || e.previousOrganization || e.previousSchool || e.school || '';
    const desig = e.designation || e.designationHeld || e.role || '';
    const from = e.joiningDate || e.fromDate || '';
    const to = e.relievingDate || e.toDate || '';
    const exp = e.totalExperience || (e.yearsOfExperience ? `${e.yearsOfExperience} years` : '');
    return {
      ...e,
      id: e.id || String(Math.random()),
      organization: org,
      previousOrganization: org,
      previousSchool: org,
      designation: desig,
      designationHeld: desig,
      joiningDate: from,
      fromDate: from,
      relievingDate: to,
      toDate: to,
      totalExperience: exp,
      certificateFileName: e.certificateFileName || '',
      certificateFileUrl: e.certificateFileUrl || '',
    };
  });

  const photoDoc = normalizedDocs.find((d: any) => /photo|profile/i.test(`${d.title || ''} ${d.type || ''}`));
  const avatar = raw.avatar || raw.profilePhoto || photoDoc?.fileUrl || (raw as any).photo?.fileUrl || '';
  const totalExp = normalizedExp.reduce((total: number, rec: any) => {
    const parsed = parseFloat(String(rec.totalExperience || '').replace(/[^\d.]/g, '')) || Number(rec.yearsOfExperience) || 0;
    return total + parsed;
  }, 0) || Number(raw.experienceYears) || 0;

  const empId = raw.empId || raw.employeeId || raw.EmployeeId || raw.teacherCode || (raw as any).employeeCode || '';
  const status = raw.status || (raw.isActive === false ? 'Inactive' : (raw.isActive === true ? 'Active' : (raw.status || 'Active')));
  const panNumber = raw.panNumber || raw.PanNumber || (raw as any).panNo || (raw as any).pan || '';
  const aadhaarNumber = raw.aadhaarNumber || raw.AadhaarNumber || (raw as any).aadhaar || '';
  const dob = raw.dob || raw.dateOfBirth ? String(raw.dob || raw.dateOfBirth).split('T')[0] : '';
  const joiningDate = raw.joiningDate ? String(raw.joiningDate).split('T')[0] : '';
  const employeeCategory = raw.employeeCategory || raw.category || (raw.role === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff');
  const role = raw.role || raw.systemRole || (employeeCategory === 'Teaching Staff' ? 'Teacher' : 'Staff');
  const id = String(raw.staffId || raw.StaffId || raw.id || '');
  const branch = raw.branch || raw.branchName || raw.BranchName || '';
  const phone = raw.phone || raw.Phone || (raw as any).mobile || '';
  const alternateMobile = raw.alternateMobile || raw.AlternateMobile || (raw as any).alternatePhone || '';

  return {
    ...raw,
    id,
    empId,
    employeeId: empId,
    status,
    panNumber,
    aadhaarNumber,
    dob,
    joiningDate,
    employeeCategory,
    role,
    branch,
    phone,
    alternateMobile,
    avatar,
    profilePhoto: avatar,
    qualifications: normalizedQuals,
    experienceRecords: normalizedExp,
    documents: normalizedDocs,
    experienceYears: totalExp,
    highestQualification: normalizedQuals[0]?.highestQualification || raw.highestQualification || raw.qualification || '',
    qualification: normalizedQuals[0]?.highestQualification || raw.qualification || raw.highestQualification || '',
    specialization: normalizedQuals[0]?.specialization || raw.specialization || raw.qualification || '',
    bankDetails: {
      accountHolderName: raw.bankDetails?.accountHolderName || raw.accountHolderName || '',
      accountNumber: raw.bankDetails?.accountNumber || raw.accountNumber || '',
      bankName: raw.bankDetails?.bankName || raw.bankName || '',
      branch: raw.bankDetails?.branch || raw.branchName || raw.branch || '',
      ifscCode: raw.bankDetails?.ifscCode || raw.ifscCode || '',
      upiId: raw.bankDetails?.upiId || raw.upiId || '',
    },
    grossSalary: raw.grossSalary ?? raw.salary ?? raw.monthlySalary ?? 0,
    netSalary: raw.netSalary ?? raw.salary ?? raw.monthlySalary ?? 0,
  } as Staff;
}

function matchesRequiredDoc(doc: StaffDocument, requiredDoc: string) {
  const docLabel = normalize(doc.title || (doc as any).documentTitle || (doc as any).name || (doc as any).fileName || '');
  const docType = normalize(String(doc.type || (doc as any).documentType || ''));
  const docCombined = `${docLabel} ${docType}`.trim();
  const req = normalize(requiredDoc);

  if (!req || !docCombined) return false;
  if (docLabel === req || docType === req || docCombined === req) return true;
  if (docCombined.includes(req) || req.includes(docLabel) || req.includes(docType)) return true;

  if (req.includes('photo') || req.includes('profile picture') || req.includes('avatar') || req.includes('passport')) {
    return docCombined.includes('photo') || docCombined.includes('profile') || docCombined.includes('avatar');
  }
  if (req.includes('aadhaar') || req.includes('adhar')) {
    return docCombined.includes('aadhaar') || docCombined.includes('adhar');
  }
  if (req.includes('pan')) {
    return docCombined.includes('pan');
  }
  if (req.includes('degree') || req.includes('qualification') || req.includes('graduation')) {
    return docCombined.includes('degree') || docCombined.includes('qualification') || docCombined.includes('graduation') || docCombined.includes('certificate');
  }
  if (req.includes('bed') || req.includes('med') || req.includes('b ed') || req.includes('m ed')) {
    return docCombined.includes('bed') || docCombined.includes('med') || docCombined.includes('b ed') || docCombined.includes('m ed') || docCombined.includes('degree') || docCombined.includes('education');
  }
  if (req.includes('experience')) {
    return docCombined.includes('experience');
  }
  if (req.includes('joining') || req.includes('offer') || req.includes('appointment')) {
    return docCombined.includes('joining') || docCombined.includes('offer') || docCombined.includes('appointment');
  }
  if (req.includes('bank') || req.includes('passbook')) {
    return docCombined.includes('bank') || docCombined.includes('passbook') || docCombined.includes('statement') || docCombined.includes('cheque');
  }
  if (req.includes('police')) {
    return docCombined.includes('police');
  }
  if (req.includes('medical')) {
    return docCombined.includes('medical');
  }
  if (req.includes('resume') || req.includes('cv')) {
    return docCombined.includes('resume') || docCombined.includes('cv');
  }
  return false;
}

const MetricCard: React.FC<{ label: string; value: string | number | undefined | null; tone?: 'brand' | 'emerald' | 'amber' | 'slate' }> = ({
  label,
  value,
  tone = 'slate'
}) => {
  const toneClass =
    tone === 'brand'
      ? 'from-brand-600 to-sky-500 text-white'
      : tone === 'emerald'
        ? 'from-emerald-500 to-emerald-600 text-white'
        : tone === 'amber'
          ? 'from-amber-500 to-amber-600 text-white'
          : 'from-slate-100 to-slate-50 text-slate-900 dark:from-slate-800 dark:to-slate-900 dark:text-white';

  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br ${toneClass} p-2.5`}>
      <p className="text-[9px] uppercase tracking-[0.25em] font-black opacity-80">{label}</p>
      <p className="text-sm font-black mt-0.5 truncate">{value || '—'}</p>
    </div>
  );
};

const InfoLine: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-3 py-1.5">
    <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">{label}</p>
    <div className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">{value || 'Not Provided'}</div>
  </div>
);

const SectionBlock: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children
}) => (
  <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
      <h3 className="text-xs font-black text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-3">{children}</div>
  </section>
);

export const StaffProfileDrawer: React.FC<StaffProfileDrawerProps> = ({ staff: staffProp, isOpen, onClose }) => {
  const {
    staff: allStaff = [],
    salaryStructures = [],
    employeeSalaryAssignments = [],
    getRequiredDocuments,
    attendance = [],
    timetable = [],
    teacherAssignments = [],
    payslips = [],
    leaveApplications = [],
    leaveTypes = [],
    workshops = [],
    employeeAssessments = [],
    issuedCertificates = [],
    auditLogs = [],
    loadMonthlyStaffAttendance,
    fetchPayslips,
    fetchLeaveApplications
  } = useData();

  const safeStaffList = Array.isArray(allStaff) ? allStaff : [];
  const initialMatched = useMemo(() => {
    const found = safeStaffList.find(s =>
      (s?.id && staffProp?.id && String(s.id) === String(staffProp.id)) ||
      (staffProp?.empId && s?.empId && s.empId.toLowerCase() === staffProp.empId.toLowerCase())
    );
    return normalizeStaffRecord(found || staffProp);
  }, [safeStaffList, staffProp]);

  const [liveStaff, setLiveStaff] = useState<Staff | null>(null);

  useEffect(() => {
    let isMounted = true;
    const targetId = staffProp?.id || initialMatched?.id;
    if (isOpen && targetId) {
      const numId = parseInt(String(targetId), 10);
      if (!isNaN(numId)) {
        fetchStaffByIdApi(numId)
          .then((res: any) => {
            if (isMounted && res?.data) {
              setLiveStaff(normalizeStaffRecord({ ...(initialMatched || {}), ...res.data }));
            }
          })
          .catch((err) => {
            console.warn('Live staff fetch from API error:', err);
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, staffProp?.id, initialMatched?.id]);

  const staff = liveStaff || initialMatched;
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');
  const [previewDoc, setPreviewDoc] = useState<StaffDocument | null>(null);
  const [imgErr, setImgErr] = useState(false);

  // Staff Letter Generation & Viewer State
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [selectedLetterType, setSelectedLetterType] = useState<StaffLetterType>('offer');
  const [selectedLetterRecord, setSelectedLetterRecord] = useState<GeneratedStaffLetterRecord | undefined>(undefined);
  const [staffLetters, setStaffLetters] = useState<GeneratedStaffLetterRecord[]>([]);

  const refreshStaffLetters = () => {
    if (staff?.id || staff?.empId) {
      setStaffLetters(getLettersForStaff(staff.empId || staff.id));
    }
  };

  useEffect(() => {
    refreshStaffLetters();
    window.addEventListener('staff_letters_updated', refreshStaffLetters);
    return () => window.removeEventListener('staff_letters_updated', refreshStaffLetters);
  }, [staff?.id, staff?.empId]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setImgErr(false);
      refreshStaffLetters();
      if (typeof fetchPayslips === 'function') fetchPayslips().catch(() => {});
      if (typeof fetchLeaveApplications === 'function') fetchLeaveApplications().catch(() => {});
      if (typeof loadMonthlyStaffAttendance === 'function') {
        const d = new Date();
        loadMonthlyStaffAttendance(d.getMonth() + 1, d.getFullYear()).catch(() => {});
      }
    }
  }, [isOpen, staff?.id]);

  const fullName = staff ? `${staff.firstName} ${staff.lastName}`.trim() : '';
  const department = staff?.department || 'Not Provided';
  const designation = staff?.designation || 'Not Provided';
  const currentAssignment = Array.isArray(employeeSalaryAssignments) ? employeeSalaryAssignments.find(a => a.employeeId === staff?.id) : undefined;
  const currentStructure = Array.isArray(salaryStructures) ? salaryStructures.find(s => s.id === currentAssignment?.salaryStructureId) : undefined;

  const requiredDocs = useMemo(() => {
    if (typeof getRequiredDocuments === 'function') {
      return getRequiredDocuments(staff?.department, staff?.designation) || [];
    }
    return [];
  }, [getRequiredDocuments, staff?.department, staff?.designation]);

  const staffDocs = Array.isArray(staff?.documents) ? staff.documents : [];
  const uploadedRequiredCount = (Array.isArray(requiredDocs) ? requiredDocs : []).filter(req => staffDocs.some(doc => matchesRequiredDoc(doc, req))).length;
  const attendanceLogs = (Array.isArray(attendance) ? attendance : []).filter(item => 
    item && (item.entityType === 'Staff' || (item as any).role === 'Staff' || (item as any).role === 'Teacher') && (
      String(item.entityId) === String(staff?.id) || 
      item.entityId === staff?.empId || 
      (item as any).employeeId === staff?.id || 
      (item as any).employeeId === staff?.empId || 
      ((item as any).name && (item as any).name.toLowerCase() === fullName.toLowerCase())
    )
  );
  const teacherTimetable = (Array.isArray(timetable) ? timetable : []).filter(item => item && (String(item.teacherId) === String(staff?.id) || item.teacherId === staff?.empId || item.teacherName === fullName));
  const classAssignments = (Array.isArray(teacherAssignments) ? teacherAssignments : []).filter(item => item && (String(item.teacherId) === String(staff?.id) || item.teacherId === staff?.empId || item.teacherName === fullName));
  const payslipHistory = (Array.isArray(payslips) ? payslips : []).filter(item => 
    item && (
      String(item.employeeId) === String(staff?.id) || 
      item.employeeId === staff?.empId || 
      (item as any).empId === staff?.empId || 
      ((item as any).employeeName && (item as any).employeeName.toLowerCase() === fullName.toLowerCase())
    )
  ).slice(0, 5);
  const leaveHistory = (Array.isArray(leaveApplications) ? leaveApplications : []).filter(item => 
    item && (
      String(item.employeeId) === String(staff?.id) || 
      item.employeeId === staff?.empId || 
      (item as any).empId === staff?.empId || 
      ((item as any).applicantName && (item as any).applicantName.toLowerCase() === fullName.toLowerCase()) || 
      ((item as any).employeeName && (item as any).employeeName.toLowerCase() === fullName.toLowerCase())
    )
  ).slice(0, 5);
  const workshopCount = (Array.isArray(workshops) ? workshops : []).filter(w => Array.isArray(w?.participants) && w.participants.some(p => p.employeeId === staff?.id)).length;
  const assessmentResults = (Array.isArray(employeeAssessments) ? employeeAssessments : []).flatMap(a => Array.isArray(a?.results) ? a.results.filter(r => r.employeeId === staff?.id) : []);
  const certificates = (Array.isArray(issuedCertificates) ? issuedCertificates : []).filter(c => c && c.employeeId === staff?.id);
  const recentLogs = (Array.isArray(auditLogs) ? auditLogs : [])
    .filter(log => (log?.details || '').toLowerCase().includes((staff?.empId || '').toLowerCase()) || (log?.details || '').toLowerCase().includes(fullName.toLowerCase()))
    .slice(0, 8);

  const attendanceCounts = attendanceLogs.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (!isOpen || !staff) return null;

  const grossSalary = staff.grossSalary ?? staff.salary ?? 0;
  const netSalary = staff.netSalary ?? staff.salary ?? 0;
  const profileStatus = staff.profileStatus || ((staff.currentAddress || staff.residentialAddress || staff.permanentAddress || staff.bankDetails?.accountNumber) ? 'Completed' : 'Incomplete');
  const subjectList = Array.from(
    new Set([
      ...(staff.assignedSubjects || []),
      staff.primarySubject,
      staff.secondarySubject
    ].filter(Boolean) as string[])
  );
  const classList = Array.from(new Set([...(staff.assignedClasses || []), ...classAssignments.map(c => `${c.className}-${c.section}`)]));
  const qualificationDocs = staffDocs.filter(doc => /certificate|degree|qualification|resume|education/i.test(`${doc.title || (doc as any).documentTitle || ''} ${doc.type || (doc as any).documentType || ''}`));
  const educationRecords = (staff.qualifications || []) as StaffEducationRecord[];
  const experienceRecords = (staff.experienceRecords || []) as StaffExperienceRecord[];
  const visibleTabs = tabs;

  const renderOverview = () => (
    <div className="space-y-5">
      <SectionBlock title="Profile Summary" subtitle="A quick glance at the staff record.">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Status" value={staff.status} tone={staff.status === 'Active' ? 'emerald' : 'amber'} />
          <MetricCard label="Employee ID" value={staff.empId} tone="brand" />
          <MetricCard label="Department" value={department} tone="slate" />
          <MetricCard label="Designation" value={designation} tone="slate" />
          <MetricCard label="Profile Status" value={profileStatus} tone={profileStatus === 'Completed' ? 'emerald' : 'amber'} />
        </div>
      </SectionBlock>

      <SectionBlock title="Quick Facts" subtitle="Core information commonly needed by HR and admin teams.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoLine label="Employee Category" value={getCategoryLabel(staff.employeeCategory || staff.role)} />
          <InfoLine label="Branch" value={staff.branch || '—'} />
          <InfoLine label="Joining Date" value={staff.joiningDate} />
          <InfoLine label="Experience" value={`${staff.experienceYears || 0} years`} />
          <InfoLine label="PAN Number" value={staff.panNumber || (staff as any).panNo || (staff as any).pan || 'Not Provided'} />
          <InfoLine label="Aadhaar Number" value={staff.aadhaarNumber || (staff as any).aadhaar || 'Not Provided'} />
          <InfoLine label="Profile Status" value={profileStatus} />
          <InfoLine label="Primary Subject" value={staff.primarySubject || 'Not Assigned'} />
          <InfoLine label="Classes" value={classList.length > 0 ? classList.join(', ') : 'Not Assigned'} />
        </div>
      </SectionBlock>

      <SectionBlock title="Salary Snapshot" subtitle="Latest dynamic payroll and compensation records.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Gross Salary" value={formatCurrency(grossSalary)} tone="brand" />
          <MetricCard label="Net Salary" value={formatCurrency(netSalary)} tone="emerald" />
          <MetricCard label="Salary Structure" value={staff.salaryStructureName || currentStructure?.structureName || 'Standard Scale'} tone="slate" />
        </div>
      </SectionBlock>
    </div>
  );

  const renderPersonal = () => (
    <SectionBlock title="Personal Details" subtitle="Identity, communication, and address information.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoLine label="First Name" value={staff.firstName} />
        <InfoLine label="Middle Name" value={(staff as any).middleName} />
        <InfoLine label="Last Name" value={staff.lastName} />
        <InfoLine label="Gender" value={staff.gender} />
        <InfoLine label="Date of Birth" value={staff.dob} />
        <InfoLine label="Blood Group" value={(staff as any).bloodGroup} />
        <InfoLine label="Mobile Number" value={staff.phone || (staff as any).mobileNumber || (staff as any).mobile} />
        <InfoLine label="Alternate Mobile" value={(() => {
          const raw = (staff as any).alternateMobile || (staff as any).alternateMobileNumber || (staff as any).alternatePhone;
          if (!raw) return undefined;
          const str = String(raw).trim();
          return str.replace(/\D/g, "").length >= 5 ? str : undefined;
        })()} />
        <InfoLine label="Aadhaar Number" value={(staff as any).aadhaarNumber} />
        <InfoLine label="PAN Number" value={(staff as any).panNumber || (staff as any).panNo || (staff as any).pan} />
        <InfoLine label="Father's Name" value={(staff as any).fatherName} />
        <InfoLine label="Mother's Name" value={(staff as any).motherName} />
        <InfoLine label="Marital Status" value={(staff as any).maritalStatus} />
        <InfoLine label="Nationality" value={(staff as any).nationality} />
        <InfoLine label="Residential Address" value={(staff as any).residentialAddress || staff.address} />
        <InfoLine label="Permanent Address" value={(staff as any).permanentAddress} />
        <InfoLine label="City" value={(staff as any).city} />
        <InfoLine label="State" value={(staff as any).state} />
        <InfoLine label="District" value={(staff as any).district} />
        <InfoLine label="PIN Code" value={(staff as any).pinCode} />
      </div>
    </SectionBlock>
  );

  const renderEmployment = () => (
    <SectionBlock title="Employment Information" subtitle="Department, designation, and HR setup.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoLine label="Employee Category" value={getCategoryLabel(staff.employeeCategory || staff.role)} />
        <InfoLine label="Branch" value={staff.branch || '—'} />
        <InfoLine label="Department" value={department} />
        <InfoLine label="Designation" value={designation} />
        <InfoLine label="Employment Type" value={(staff as any).employeeType || 'Permanent'} />
        <InfoLine label="Reporting Manager" value={(staff as any).reportingManager} />
        <InfoLine label="Status" value={(staff as any).employmentStatus || staff.status} />
        <InfoLine label="Date of Joining" value={staff.joiningDate} />
        <InfoLine label="Confirmation Date" value={(staff as any).confirmationDate} />
        <InfoLine label="Shift" value={(staff as any).workShift} />
        <InfoLine label="Weekly Off" value={(staff as any).weeklyOff} />
        <InfoLine label="Attendance Type" value={(staff as any).attendanceType} />
        <InfoLine label="Employee Code" value={staff.empId || staff.teacherCode || (staff as any).employeeCode || 'Not Assigned'} />
        <InfoLine label="PAN Number" value={staff.panNumber || (staff as any).panNo || (staff as any).pan || 'Not Provided'} />
        <InfoLine label="Biometric ID" value={(staff as any).biometricId} />
        <InfoLine label="Staff Role" value={staff.role === 'Teacher' ? 'Teacher' : (staff.role === 'Staff' ? 'Non-Teaching Staff' : staff.role || 'Non-Teaching Staff')} />
      </div>
    </SectionBlock>
  );

  const renderEducation = () => (
    <SectionBlock title="Education" subtitle="Educational background and qualification records.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard label="Records" value={educationRecords.length || (staff.qualification || staff.highestQualification ? 1 : 0)} tone="brand" />
        <MetricCard label="Highest Qualification" value={staff.highestQualification || staff.qualification || educationRecords[0]?.highestQualification || 'Not Provided'} tone="emerald" />
      </div>

      <div className="mt-5 space-y-3">
        {educationRecords.length > 0 ? (
          educationRecords.map((record, index) => {
            const hasBed = Boolean(record.bed && String(record.bed).trim() && record.bed !== 'Not Provided');
            const hasMed = Boolean(record.med && String(record.med).trim() && record.med !== 'Not Provided');
            const hasPhd = Boolean(record.phd && String(record.phd).trim() && record.phd !== 'Not Provided');
            const specVal = record.specialization || (record as any).specializationSubject;
            const hasSpec = Boolean(specVal && String(specVal).trim() && specVal !== 'Not Provided');
            const hasExtra = hasBed || hasMed || hasPhd || hasSpec;

            const universityAndYear = [
              record.university || (record as any).boardUniversity || (record as any).institutionCollege,
              record.year || (record as any).passingYear
            ].filter(Boolean).join(' | ');

            const percentageVal = record.percentage || (record as any).percentageCgpa;

            return (
              <div key={record.id || `${index}`} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {record.highestQualification || (record as any).qualificationDegree || (record as any).qualification || 'Degree / Qualification'}
                    </p>
                    {universityAndYear && (
                      <p className="text-[10px] text-slate-500">
                        {universityAndYear}
                      </p>
                    )}
                  </div>
                  {percentageVal && percentageVal !== 'N/A' && (
                    <Badge variant="info" size="sm">{percentageVal}%</Badge>
                  )}
                </div>
                {hasExtra && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hasBed && <InfoLine label="B.Ed" value={record.bed} />}
                    {hasMed && <InfoLine label="M.Ed" value={record.med} />}
                    {hasPhd && <InfoLine label="Ph.D" value={record.phd} />}
                    {hasSpec && <InfoLine label="Specialization" value={specVal} />}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoLine label="Highest Qualification" value={staff.highestQualification || staff.qualification || 'Not Provided'} />
            <InfoLine label="Qualification Summary" value={staff.qualification || staff.highestQualification || 'Not Provided'} />
            {staff.specialization && staff.specialization !== 'Not Provided' && (
              <InfoLine label="Specialization" value={staff.specialization} />
            )}
            {Boolean(staff.experienceYears) && (
              <InfoLine label="Experience" value={`${staff.experienceYears} years`} />
            )}
          </div>
        )}
      </div>


    </SectionBlock>
  );

  const renderExperience = () => (
    <SectionBlock title="Experience" subtitle="Previous organizations and work history.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Records" value={experienceRecords.length || (staff.experienceYears ? 1 : 0)} tone="brand" />
        <MetricCard label="Total Experience" value={`${staff.experienceYears || 0} years`} tone="emerald" />
        <MetricCard label="Certificates" value={experienceRecords.filter(record => record.certificateFileUrl || (record as any).certificateFileName).length} tone="amber" />
      </div>

      <div className="mt-5 space-y-3">
        {experienceRecords.length > 0 ? (
          experienceRecords.map((record, index) => (
            <div key={record.id || `${index}`} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {record.organization || record.previousSchool || (record as any).previousOrganization || 'Experience Record'}
                  </p>
                  <p className="text-[10px] text-slate-500">{record.designation || (record as any).designationHeld || 'Designation not provided'}</p>
                </div>
                <Badge variant="info" size="sm">
                  {record.totalExperience ? (String(record.totalExperience).includes('year') ? record.totalExperience : `${record.totalExperience} years`) : 'N/A'}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoLine label="Joining Date" value={record.joiningDate || (record as any).fromDate || 'Not Provided'} />
                <InfoLine label="Relieving Date" value={record.relievingDate || (record as any).toDate || 'Not Provided'} />
                <InfoLine label="Certificate" value={record.certificateFileName || (record.certificateFileUrl ? 'Uploaded' : 'Not Uploaded')} />
                <InfoLine label="Previous School" value={record.previousSchool || record.organization || (record as any).previousOrganization || 'Not Provided'} />
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoLine label="Total Experience" value={`${staff.experienceYears || 0} years`} />
            <InfoLine label="Previous Organization" value={(staff as any).previousOrganization || 'Not Provided'} />
            <InfoLine label="Designation" value={(staff as any).previousDesignation || (staff as any).designationHeld || 'Not Provided'} />
            <InfoLine label="Experience Certificate" value={(staff as any).experienceCertificate || 'Not Uploaded'} />
          </div>
        )}
      </div>
    </SectionBlock>
  );

  const renderBank = () => {
    const bank = (staff.bankDetails || {}) as any;
    return (
      <SectionBlock title="Bank Details" subtitle="Read-only salary disbursement account information.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoLine label="Account Holder Name" value={bank.accountHolderName || (staff as any).accountHolderName} />
          <InfoLine label="Bank Name" value={bank.bankName || (staff as any).bankName} />
          <InfoLine label="Branch" value={bank.branch || (staff as any).branchName || (staff as any).branch} />
          <InfoLine label="Account Number" value={bank.accountNumber || (staff as any).accountNumber} />
          <InfoLine label="IFSC Code" value={bank.ifscCode || (staff as any).ifscCode} />
          <InfoLine label="PAN Number" value={staff.panNumber || (staff as any).panNo || (staff as any).pan || 'Not Provided'} />
          <InfoLine label="UPI ID" value={bank.upiId || (staff as any).upiId || 'Not Provided'} />
        </div>
      </SectionBlock>
    );
  };

  const renderQualification = () => (
    <SectionBlock title="Qualification" subtitle="Educational background and certification records.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoLine label="Highest Qualification" value={staff.highestQualification || staff.qualification} />
        <InfoLine label="Qualification Summary" value={staff.qualification} />
        <InfoLine label="Specialization" value={staff.specialization || 'Not Provided'} />
        <InfoLine label="Experience" value={`${staff.experienceYears || 0} years`} />
        <InfoLine label="Teacher Code" value={staff.teacherCode || 'Not Provided'} />
        <InfoLine label="Qualification Documents" value={qualificationDocs.length > 0 ? `${qualificationDocs.length} files attached` : 'None uploaded'} />
      </div>
      <div className="mt-5 space-y-2">
        {qualificationDocs.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No qualification certificates or degree files are attached.</p>
        ) : (
          qualificationDocs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.title}</p>
                <p className="text-[10px] text-slate-500">{doc.type} | Uploaded {doc.uploadedDate}</p>
              </div>
              <Badge variant="info" size="sm">{doc.verificationStatus || 'Pending Verification'}</Badge>
            </div>
          ))
        )}
      </div>
    </SectionBlock>
  );

  const renderAttendance = () => (
    <SectionBlock title="Attendance" subtitle="Recent attendance records and summary counts.">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Present" value={attendanceCounts.Present || 0} tone="emerald" />
        <MetricCard label="Absent" value={attendanceCounts.Absent || 0} tone="amber" />
        <MetricCard label="Late" value={attendanceCounts.Late || 0} tone="brand" />
        <MetricCard label="Leave" value={attendanceCounts.Leave || 0} tone="slate" />
      </div>
      <div className="mt-5 space-y-2">
        {attendanceLogs.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No attendance records found for this staff member in the current branch.</p>
        ) : (
          attendanceLogs.slice(0, 8).map(item => (
            <div key={item.id || `${item.date}-${item.entityId}`} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.date}</p>
                <p className="text-[10px] text-slate-500">{item.inTime || '--'} to {item.outTime || '--'}</p>
              </div>
              <Badge variant={item.status === 'Present' ? 'success' : item.status === 'Late' ? 'warning' : 'neutral'} size="sm">
                {item.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </SectionBlock>
  );

  const renderSubjects = () => (
    <SectionBlock title="Subjects" subtitle="Mapped subjects and specializations.">
      <div className="flex flex-wrap gap-2">
        {subjectList.length > 0 ? (
          subjectList.map(subject => (
            <Badge key={subject} variant="info" size="sm">{subject}</Badge>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">No subject allocation found.</p>
        )}
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoLine label="Primary Subject" value={staff.primarySubject} />
        <InfoLine label="Secondary Subject" value={staff.secondarySubject} />
        <InfoLine label="Specialization" value={staff.specialization || staff.qualification} />
        <InfoLine label="Teaching Eligibility" value={staff.isClassTeacherEligible ? 'Eligible' : 'Not Eligible'} />
      </div>
    </SectionBlock>
  );

  const renderClasses = () => (
    <SectionBlock title="Classes" subtitle="Homeroom and class allocation information.">
      <div className="flex flex-wrap gap-2">
        {classList.length > 0 ? (
          classList.map(cls => (
            <Badge key={cls} variant="neutral" size="sm">{cls}</Badge>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">No class allocation found.</p>
        )}
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoLine label="Class Teacher" value={staff.isClassTeacherEligible ? 'Yes' : 'No'} />
        <InfoLine label="Maximum Periods" value={staff.dailyWorkloadLimit || 'Not set'} />
        <InfoLine label="Weekly Workload" value={staff.weeklyWorkloadLimit || 'Not set'} />
        <InfoLine label="House / Club / Lab" value={[ (staff as any).houseAssigned, (staff as any).clubAssignment, (staff as any).labAssigned ].filter(Boolean).join(' | ')} />
      </div>
    </SectionBlock>
  );

  const renderTimetable = () => (
    <SectionBlock title="Timetable" subtitle="Current timetable bindings for this teacher.">
      <div className="space-y-2">
        {teacherTimetable.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No timetable slots found for this teacher.</p>
        ) : (
          teacherTimetable.slice(0, 10).map(slot => (
            <div key={slot.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{slot.day} | {slot.timeSlot}</p>
                <p className="text-[10px] text-slate-500">{slot.className}-{slot.section} | {slot.subject}</p>
              </div>
              <Badge variant="info" size="sm">{slot.roomNo}</Badge>
            </div>
          ))
        )}
      </div>
    </SectionBlock>
  );

  const renderSalary = () => (
    <SectionBlock title="Salary" subtitle="Current salary and compensation profile.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Gross Salary" value={formatCurrency(grossSalary)} tone="brand" />
        <MetricCard label="Net Salary" value={formatCurrency(netSalary)} tone="emerald" />
        <MetricCard label="CTC" value={formatCurrency(grossSalary + (staff as any).employerPF + (staff as any).employeePF)} tone="amber" />
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoLine label="Salary Structure" value={staff.salaryStructureName || currentStructure?.structureName} />
        <InfoLine label="Salary Effective Date" value={staff.salaryStructureEffectiveDate || (staff as any).salaryEffectiveDate} />
        <InfoLine label="Basic Salary" value={formatCurrency(Number((staff as any).basicSalary) || 0)} />
        <InfoLine label="Allowances Total" value={formatCurrency((Number((staff as any).hra) || 0) + (Number((staff as any).da) || 0) + (Number((staff as any).specialAllowance) || 0) + (Number((staff as any).medicalAllowance) || 0) + (Number((staff as any).travelAllowance) || 0) + (Number((staff as any).foodAllowance) || 0) + (Number((staff as any).conveyance) || 0) + (Number((staff as any).performanceAllowance) || 0) + (Number((staff as any).otherAllowances) || 0))} />
      </div>
    </SectionBlock>
  );

  const renderPayroll = () => (
    <SectionBlock title="Payroll" subtitle="Read-only salary structure, effective date, and payslip history.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoLine label="Salary Structure" value={staff.salaryStructureName || currentStructure?.structureName || 'Not Assigned'} />
        <InfoLine label="Salary Effective Date" value={staff.salaryStructureEffectiveDate || 'Not Provided'} />
        <InfoLine label="Gross Salary" value={formatCurrency(grossSalary)} />
        <InfoLine label="Net Salary" value={formatCurrency(netSalary)} />
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Latest Payslip"
          value={payslipHistory[0]?.month || 'No Payslip'}
          tone="brand"
        />
        <MetricCard
          label="Payment Status"
          value={payslipHistory[0]?.status || 'Not Paid'}
          tone={payslipHistory[0]?.status === 'Paid' ? 'emerald' : 'amber'}
        />
        <MetricCard
          label="Payslips"
          value={payslipHistory.length}
          tone="slate"
        />
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Salary History</h4>
          <Badge variant="info" size="sm">{payslipHistory.length} Records</Badge>
        </div>
        {payslipHistory.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No payroll history found for this staff member.</p>
        ) : (
          payslipHistory.map(p => (
            <div key={p.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{p.month}</p>
                  <p className="text-[10px] text-slate-500">{p.department} | {p.designation}</p>
                </div>
                <Badge variant={p.status === 'Paid' ? 'success' : 'info'} size="sm">{p.status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                  <p className="text-[10px] text-slate-400 uppercase font-black">Gross</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(p.grossSalary || p.basicSalary || 0)}</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                  <p className="text-[10px] text-slate-400 uppercase font-black">Deductions</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency((p.leaveDeduction || 0) + (p.otherDeductions || 0) + (p.pfDeduction || 0) + (p.lopDeduction || 0))}</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                  <p className="text-[10px] text-slate-400 uppercase font-black">Net</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(p.netSalary || 0)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionBlock>
  );

  const renderDocuments = () => (
    <SectionBlock title="Documents & Letters" subtitle="Official institutional letters, uploaded employee records and requirement checklist.">
      {/* Official HR Letters Section */}
      <div className="mb-6 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Official Institutional Letters & HR Documents
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              Generate, preview, customize, and issue standard institutional letters with official school letterhead.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedLetterType('offer');
                setSelectedLetterRecord(staffLetters.find(l => l.letterType === 'offer'));
                setLetterModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Offer Letter
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedLetterType('relieving');
                setSelectedLetterRecord(staffLetters.find(l => l.letterType === 'relieving'));
                setLetterModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Relieving Letter
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedLetterType('experience');
                setSelectedLetterRecord(staffLetters.find(l => l.letterType === 'experience'));
                setLetterModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" /> Experience Letter
            </button>
          </div>
        </div>

        {/* List of Issued Letters for this staff member */}
        <div className="space-y-2">
          {staffLetters.length === 0 ? (
            <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-sky-100 dark:border-slate-800 text-center text-xs text-slate-500 italic">
              No official HR letters generated yet. Click any button above to generate a new Offer or Relieving Letter.
            </div>
          ) : (
            staffLetters.map((ltr) => (
              <div
                key={ltr.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-slate-800 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl text-xs font-black ${
                    ltr.letterType === 'offer'
                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                      : ltr.letterType === 'relieving'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {ltr.letterType === 'offer' ? <FileText className="w-4 h-4" /> : ltr.letterType === 'relieving' ? <ShieldCheck className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {ltr.letterType === 'offer' ? 'Offer & Appointment Letter' : ltr.letterType === 'relieving' ? 'Relieving Order & Clearance' : 'Service & Experience Certificate'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Ref: <strong>{ltr.letterNumber}</strong> &bull; Issued on {ltr.issueDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {ltr.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLetterType(ltr.letterType);
                      setSelectedLetterRecord(ltr);
                      setLetterModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold border border-sky-200 dark:border-sky-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View / Print
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <MetricCard label="Uploaded" value={staffDocs.length} tone="brand" />
        <MetricCard label="Pending" value={staffDocs.filter(doc => !doc.verificationStatus || doc.verificationStatus === 'Pending Verification').length} tone="amber" />
        <MetricCard label="Verified" value={staffDocs.filter(doc => doc.verificationStatus === 'Verified').length} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Required Checklist</h4>
            <Badge variant="info" size="sm">{uploadedRequiredCount} / {requiredDocs.length} Uploaded</Badge>
          </div>
          <div className="space-y-2">
            {requiredDocs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No requirements configured for this department/designation.</p>
            ) : (
              requiredDocs.map(req => {
                const uploaded = staffDocs.find(doc => matchesRequiredDoc(doc, req));
                return (
                  <div key={req} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{req}</p>
                      <p className="text-[10px] text-slate-500">{uploaded ? uploaded.title : 'Missing'}</p>
                    </div>
                    <Badge variant={uploaded ? 'success' : 'warning'} size="sm">{uploaded ? 'Uploaded' : 'Pending'}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Uploaded Documents</h4>
            <Badge variant="neutral" size="sm">{staffDocs.length} Files</Badge>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {staffDocs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No documents uploaded yet.</p>
            ) : (
              staffDocs.map(doc => (
                <div key={doc.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{doc.type} | Uploaded {doc.uploadedDate}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 rounded-xl text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {doc.fileUrl && doc.fileUrl !== '#' && (
                        <a
                          href={doc.fileUrl}
                          download={doc.title}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SectionBlock>
  );

  const renderLeave = () => {
    const getLeaveTypeAllowance = (codeOrName: string): number => {
      const q = codeOrName.toLowerCase();
      const found = (leaveTypes || []).find(t => 
        (t.code && t.code.toLowerCase() === q) || 
        (t.name && t.name.toLowerCase().includes(q))
      );
      return found ? (Number(found.annualAllowance) || Number(found.maxDays) || 0) : 0;
    };

    const baseBal = staff.leaveBalance || {};
    const defaultCasual = getLeaveTypeAllowance('cl') || getLeaveTypeAllowance('casual');
    const defaultSick = getLeaveTypeAllowance('sl') || getLeaveTypeAllowance('sick');
    const defaultEarned = getLeaveTypeAllowance('pl') || getLeaveTypeAllowance('el') || getLeaveTypeAllowance('earned') || getLeaveTypeAllowance('paid');

    const remCasual = Math.max(0, baseBal.casual !== undefined ? baseBal.casual : defaultCasual);
    const remSick = Math.max(0, baseBal.sick !== undefined ? baseBal.sick : defaultSick);
    const remPaid = Math.max(0, baseBal.paid !== undefined ? baseBal.paid : defaultEarned);

    return (
      <SectionBlock title="Leave" subtitle="Leave balances and recent applications.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Casual Leave" value={remCasual} tone="emerald" />
          <MetricCard label="Sick Leave" value={remSick} tone="amber" />
          <MetricCard label="Paid Leave" value={remPaid} tone="brand" />
        </div>
        <div className="mt-5 space-y-2">
          {leaveHistory.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No leave applications found for this staff member.</p>
          ) : (
            leaveHistory.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.leaveTypeName}</p>
                  <p className="text-[10px] text-slate-500">{item.fromDate} to {item.toDate} | {item.numberOfDays} {Number(item.numberOfDays) === 1 ? 'day' : 'days'}</p>
                </div>
                <Badge variant={item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'} size="sm">
                  {item.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </SectionBlock>
    );
  };

  const renderPerformance = () => (
    <SectionBlock title="Performance" subtitle="Training, assessment, and certification snapshot.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Workshops" value={workshopCount} tone="brand" />
        <MetricCard label="Assessments" value={assessmentResults.length} tone="amber" />
        <MetricCard label="Certificates" value={certificates.length} tone="emerald" />
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoLine label="Latest Assessment Grade" value={assessmentResults[0]?.grade} />
        <InfoLine label="Latest Assessment Result" value={assessmentResults[0]?.result} />
        <InfoLine label="Certificate Number" value={certificates[0]?.certificateNumber} />
        <InfoLine label="Workshop Participation" value={workshopCount > 0 ? 'Recorded' : 'Not Recorded'} />
      </div>
    </SectionBlock>
  );

  const renderActivity = () => (
    <SectionBlock title="Activity Log" subtitle="Recent actions and audit entries for this staff member.">
      <div className="space-y-2">
        {recentLogs.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No activity log entries found for this staff member.</p>
        ) : (
          recentLogs.map(log => (
            <div key={log.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{log.action}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{log.timestamp} | {log.userName}</p>
                </div>
                <Badge variant="info" size="sm">{log.userRole}</Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{log.details}</p>
            </div>
          ))
        )}
      </div>
    </SectionBlock>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'employment':
        return renderEmployment();
      case 'personal':
        return renderPersonal();
      case 'education':
        return renderEducation();
      case 'experience':
        return renderExperience();
      case 'bank':
        return renderBank();
      case 'documents':
        return renderDocuments();
      case 'payroll':
        return renderPayroll();
      case 'attendance':
        return renderAttendance();
      case 'leave':
        return renderLeave();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="w-full max-w-5xl h-full bg-slate-50 dark:bg-slate-950 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right-16">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {(() => {
                  const resolvedAvatar = 
                    staff.avatar || 
                    (staff as any).profilePhoto || 
                    (staff as any).photo?.fileUrl || 
                    staffDocs.find(d => /photo|profile/i.test(`${d.title || (d as any).documentTitle || ''} ${d.type || (d as any).documentType || ''}`))?.fileUrl || 
                    '';
                  return !imgErr && resolvedAvatar ? (
                    <img
                      src={resolvedAvatar}
                      alt={fullName}
                      onError={() => setImgErr(true)}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-900 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 ring-2 ring-white dark:ring-slate-900 shadow-md flex items-center justify-center text-xs font-black uppercase">
                      {((staff.firstName?.[0] || '') + (staff.lastName?.[0] || '')).toUpperCase() || <UserRound className="w-5 h-5 text-slate-400" />}
                    </div>
                  );
                })()}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm ${
                    (staff.status || 'Active').toLowerCase() === 'active'
                      ? 'bg-emerald-500'
                      : (staff.status || '').toLowerCase() === 'inactive'
                        ? 'bg-amber-500'
                        : (staff.status || '').toLowerCase() === 'resigned'
                          ? 'bg-rose-500'
                          : 'bg-slate-400'
                  }`}
                  title={`Status: ${staff.status || 'Active'}`}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black text-slate-900 dark:text-white truncate">{fullName}</h2>
                  <Badge variant="info" size="sm">{staff.empId || 'No ID'}</Badge>
                </div>
                <p className="text-xs text-slate-500 font-bold mt-0.5">{designation} | {department}</p>
                <p className="text-[10px] text-slate-400 font-medium">{staff.branch ? `Branch: ${staff.branch} | ` : ''}Role: {staff.role === 'Teacher' ? 'Teacher' : (staff.role === 'Staff' ? 'Non-Teaching Staff' : staff.role || 'Non-Teaching Staff')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>

          <div className="mt-2.5 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              {visibleTabs.map(tab => {
                const TabIcon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      active
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5">
          <div className="w-full">
            {renderTab()}
          </div>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{previewDoc.title}</p>
                <p className="text-[11px] text-slate-500 mt-1">{previewDoc.type} | Uploaded {previewDoc.uploadedDate}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950">
              {previewDoc.fileUrl && previewDoc.fileUrl.startsWith('data:image') ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.title} className="max-h-[70vh] mx-auto object-contain rounded-2xl shadow-lg" />
              ) : previewDoc.fileUrl && previewDoc.fileUrl !== '#' ? (
                <iframe src={previewDoc.fileUrl} title={previewDoc.title} className="w-full h-[70vh] rounded-2xl border-0 bg-white" />
              ) : (
                <div className="h-[60vh] flex items-center justify-center text-slate-400">No preview available.</div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-2xl bg-brand-600 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {staff && (
        <StaffLetterModal
          staff={staff}
          isOpen={letterModalOpen}
          onClose={() => setLetterModalOpen(false)}
          initialType={selectedLetterType}
          existingRecord={selectedLetterRecord}
        />
      )}
    </div>
  );
};

export default StaffProfileDrawer;
