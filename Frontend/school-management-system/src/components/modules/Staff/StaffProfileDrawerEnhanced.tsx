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
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';

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

function matchesRequiredDoc(doc: StaffDocument, requiredDoc: string) {
  const docLabel = normalize(doc.title || '');
  const docType = normalize(String(doc.type || ''));
  const req = normalize(requiredDoc);

  if (docLabel === req || docType === req) return true;
  if (docLabel.includes(req) || docType.includes(req) || req.includes(docLabel) || req.includes(docType)) return true;
  if (req.includes('aadhaar') || req.includes('adhar')) return docLabel.includes('aadhaar') || docType.includes('aadhaar');
  if (req.includes('pan')) return docLabel.includes('pan') || docType.includes('pan');
  if (req.includes('photo')) return docLabel.includes('photo') || docType.includes('photo');
  if (req.includes('certificate') || req.includes('degree') || req.includes('qualification')) {
    return docLabel.includes('certificate') || docLabel.includes('degree') || docType.includes('certificate') || docType.includes('degree');
  }
  if (req.includes('experience')) return docLabel.includes('experience') || docType.includes('experience');
  if (req.includes('appointment') || req.includes('offer')) return docLabel.includes('appointment') || docLabel.includes('offer');
  if (req.includes('police')) return docLabel.includes('police') || docType.includes('police');
  if (req.includes('medical')) return docLabel.includes('medical') || docType.includes('medical');
  if (req.includes('bank')) return docLabel.includes('bank') || docType.includes('bank') || docLabel.includes('passbook');
  if (req.includes('resume')) return docLabel.includes('resume') || docType.includes('resume');
  return false;
}

const MetricCard: React.FC<{ label: string; value: string | number; tone?: 'brand' | 'emerald' | 'amber' | 'slate' }> = ({
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
    <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br ${toneClass} p-3`}>
      <p className="text-[10px] uppercase tracking-[0.35em] font-black opacity-80">{label}</p>
      <p className="text-base font-black mt-1.5">{value}</p>
    </div>
  );
};

const InfoLine: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5">
    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">{label}</p>
    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value || 'Not Provided'}</div>
  </div>
);

const SectionBlock: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children
}) => (
  <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
      <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

export const StaffProfileDrawer: React.FC<StaffProfileDrawerProps> = ({ staff: staffProp, isOpen, onClose }) => {
  const {
    staff: allStaff,
    salaryStructures,
    employeeSalaryAssignments,
    getRequiredDocuments,
    attendance,
    timetable,
    teacherAssignments,
    payslips,
    leaveApplications,
    workshops,
    employeeAssessments,
    issuedCertificates,
    auditLogs
  } = useData();

  const staff = allStaff.find(s => s.id === staffProp?.id) || staffProp;
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');
  const [previewDoc, setPreviewDoc] = useState<StaffDocument | null>(null);

  useEffect(() => {
    if (isOpen) setActiveTab('overview');
  }, [isOpen, staff?.id]);

  const fullName = staff ? `${staff.firstName} ${staff.lastName}`.trim() : '';
  const department = staff?.department || 'Not Provided';
  const designation = staff?.designation || 'Not Provided';
  const currentAssignment = employeeSalaryAssignments?.find(a => a.employeeId === staff?.id);
  const currentStructure = salaryStructures?.find(s => s.id === currentAssignment?.salaryStructureId);

  const requiredDocs = useMemo(() => getRequiredDocuments(staff?.department, staff?.designation), [getRequiredDocuments, staff?.department, staff?.designation]);
  const staffDocs = staff?.documents || [];
  const uploadedRequiredCount = requiredDocs.filter(req => staffDocs.some(doc => matchesRequiredDoc(doc, req))).length;
  const attendanceLogs = attendance.filter(item => item.entityType === 'Staff' && item.entityId === staff?.id);
  const teacherTimetable = timetable.filter(item => item.teacherId === staff?.id || item.teacherName === fullName);
  const classAssignments = teacherAssignments.filter(item => item.teacherId === staff?.id || item.teacherName === fullName);
  const payslipHistory = payslips.filter(item => item.employeeId === staff?.id).slice(0, 5);
  const leaveHistory = leaveApplications.filter(item => item.employeeId === staff?.id).slice(0, 5);
  const workshopCount = workshops.filter(w => w.participants.some(p => p.employeeId === staff?.id)).length;
  const assessmentResults = employeeAssessments.flatMap(a => a.results.filter(r => r.employeeId === staff?.id));
  const certificates = issuedCertificates.filter(c => c.employeeId === staff?.id);
  const recentLogs = auditLogs
    .filter(log => log.details.toLowerCase().includes((staff?.empId || '').toLowerCase()) || log.details.toLowerCase().includes(fullName.toLowerCase()))
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
  const qualificationDocs = staffDocs.filter(doc => /certificate|degree|qualification|resume/i.test(`${doc.title || ''} ${doc.type || ''}`));
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
          <InfoLine label="Branch" value={staff.branch || 'Main Campus'} />
          <InfoLine label="Joining Date" value={staff.joiningDate} />
          <InfoLine label="Experience" value={`${staff.experienceYears || 0} years`} />
          <InfoLine label="Profile Status" value={profileStatus} />
          <InfoLine label="Primary Subject" value={staff.primarySubject || 'Not Assigned'} />
          <InfoLine label="Classes" value={classList.length > 0 ? classList.join(', ') : 'Not Assigned'} />
        </div>
      </SectionBlock>

      <SectionBlock title="Salary Snapshot" subtitle="The latest saved payroll figures in the mock ERP data.">
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
        <InfoLine label="Mobile Number" value={staff.phone} />
        <InfoLine label="Email" value={staff.email} />
        <InfoLine label="Alternate Mobile" value={(staff as any).alternateMobile} />
        <InfoLine label="Father's Name" value={(staff as any).fatherName} />
        <InfoLine label="Mother's Name" value={(staff as any).motherName} />
        <InfoLine label="Marital Status" value={(staff as any).maritalStatus} />
        <InfoLine label="Nationality" value={(staff as any).nationality} />
        <InfoLine label="Religion" value={(staff as any).religion} />
        <InfoLine label="Category" value={(staff as any).casteCategory} />
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
        <InfoLine label="Branch" value={staff.branch || 'Main Campus'} />
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
        <InfoLine label="Employee Code" value={staff.teacherCode || (staff as any).employeeCode} />
        <InfoLine label="Biometric ID" value={(staff as any).biometricId} />
        <InfoLine label="Staff Role" value={staff.role || 'Staff'} />
      </div>
    </SectionBlock>
  );

  const renderEducation = () => (
    <SectionBlock title="Education" subtitle="Multiple qualification records and degree documents.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Records" value={educationRecords.length || (staff.qualification ? 1 : 0)} tone="brand" />
        <MetricCard label="Highest Qualification" value={staff.highestQualification || staff.qualification || 'Not Provided'} tone="emerald" />
        <MetricCard label="Qualification Docs" value={qualificationDocs.length} tone="amber" />
      </div>

      <div className="mt-5 space-y-3">
        {educationRecords.length > 0 ? (
          educationRecords.map((record, index) => (
            <div key={record.id || `${index}`} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{record.highestQualification}</p>
                  <p className="text-[10px] text-slate-500">{record.university} | {record.year}</p>
                </div>
                <Badge variant="info" size="sm">{record.percentage || 'N/A'}%</Badge>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoLine label="B.Ed" value={record.bed || 'Not Provided'} />
                <InfoLine label="M.Ed" value={record.med || 'Not Provided'} />
                <InfoLine label="Ph.D" value={record.phd || 'Not Provided'} />
                <InfoLine label="Specialization" value={record.specialization || 'Not Provided'} />
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoLine label="Highest Qualification" value={staff.highestQualification || staff.qualification} />
            <InfoLine label="Qualification Summary" value={staff.qualification} />
            <InfoLine label="Specialization" value={staff.specialization || 'Not Provided'} />
            <InfoLine label="Experience" value={`${staff.experienceYears || 0} years`} />
          </div>
        )}
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

  const renderExperience = () => (
    <SectionBlock title="Experience" subtitle="Previous organizations and work history.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Records" value={experienceRecords.length || (staff.experienceYears ? 1 : 0)} tone="brand" />
        <MetricCard label="Total Experience" value={`${staff.experienceYears || 0} years`} tone="emerald" />
        <MetricCard label="Certificates" value={experienceRecords.filter(record => record.certificateFileUrl).length} tone="amber" />
      </div>

      <div className="mt-5 space-y-3">
        {experienceRecords.length > 0 ? (
          experienceRecords.map((record, index) => (
            <div key={record.id || `${index}`} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{record.organization || record.previousSchool || 'Experience Record'}</p>
                  <p className="text-[10px] text-slate-500">{record.designation || 'Designation not provided'}</p>
                </div>
                <Badge variant="info" size="sm">{record.totalExperience || 'N/A'}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoLine label="Joining Date" value={record.joiningDate || 'Not Provided'} />
                <InfoLine label="Relieving Date" value={record.relievingDate || 'Not Provided'} />
                <InfoLine label="Certificate" value={record.certificateFileName || 'Not Uploaded'} />
                <InfoLine label="Previous School" value={record.previousSchool || 'Not Provided'} />
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoLine label="Total Experience" value={`${staff.experienceYears || 0} years`} />
            <InfoLine label="Previous Organization" value={(staff as any).previousOrganization || 'Not Provided'} />
            <InfoLine label="Designation" value={(staff as any).previousDesignation || 'Not Provided'} />
            <InfoLine label="Experience Certificate" value={(staff as any).experienceCertificate || 'Not Uploaded'} />
          </div>
        )}
      </div>
    </SectionBlock>
  );

  const renderBank = () => (
    <SectionBlock title="Bank Details" subtitle="Read-only salary disbursement account information.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoLine label="Account Holder Name" value={staff.bankDetails?.accountHolderName} />
        <InfoLine label="Bank Name" value={staff.bankDetails?.bankName} />
        <InfoLine label="Branch" value={staff.bankDetails?.branch} />
        <InfoLine label="Account Number" value={staff.bankDetails?.accountNumber} />
        <InfoLine label="IFSC Code" value={staff.bankDetails?.ifscCode} />
        <InfoLine label="UPI ID" value={staff.bankDetails?.upiId || 'Not Provided'} />
      </div>
    </SectionBlock>
  );

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
    <SectionBlock title="Documents" subtitle="Uploaded employee records and requirement checklist.">
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

  const renderLeave = () => (
    <SectionBlock title="Leave" subtitle="Leave balances and recent applications.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Casual Leave" value={staff.leaveBalance?.casual || 0} tone="emerald" />
        <MetricCard label="Sick Leave" value={staff.leaveBalance?.sick || 0} tone="amber" />
        <MetricCard label="Paid Leave" value={staff.leaveBalance?.paid || 0} tone="brand" />
      </div>
      <div className="mt-5 space-y-2">
        {leaveHistory.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No leave applications found for this staff member.</p>
        ) : (
          leaveHistory.map(item => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.leaveTypeName}</p>
                <p className="text-[10px] text-slate-500">{item.fromDate} to {item.toDate} | {item.numberOfDays} days</p>
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
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={staff.avatar}
                  alt=""
                  className="w-16 h-16 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2">
                  <Badge variant={staff.status === 'Active' ? 'success' : staff.status === 'On Leave' ? 'warning' : 'neutral'} size="sm">
                    {staff.status}
                  </Badge>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">{fullName}</h2>
                  <Badge variant="info" size="sm">{staff.empId}</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1">{designation} | {department}</p>
                <p className="text-[11px] text-slate-400 mt-1">Branch: {staff.branch || 'Main Campus'} | Role: {staff.role || 'Staff'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
            >
              <X className="w-4 h-4" /> Close
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {visibleTabs.map(tab => {
                const TabIcon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
                      active
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)] gap-5 items-start">
            <div>{renderTab()}</div>

            <aside className="space-y-5 lg:sticky lg:top-5">
              <SectionBlock title="Snapshot" subtitle="Quick profile metrics and completion status.">
                <div className="space-y-3">
                  <MetricCard label="Profile Status" value={profileStatus} tone={profileStatus === 'Completed' ? 'emerald' : 'amber'} />
                  <MetricCard label="Education Records" value={educationRecords.length || (staff.qualification ? 1 : 0)} tone="brand" />
                  <MetricCard label="Required Docs" value={`${uploadedRequiredCount} / ${requiredDocs.length}`} tone="amber" />
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Quick Links</span>
                      <Sparkles className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="mt-3 space-y-2">
                      {[
                        ['Overview', 'overview'],
                        ['Employment', 'employment'],
                        ['Personal', 'personal'],
                        ['Education', 'education'],
                        ['Experience', 'experience'],
                        ['Bank', 'bank'],
                        ['Payroll', 'payroll'],
                        ['Attendance', 'attendance'],
                        ['Documents', 'documents'],
                        ['Leave', 'leave']
                      ].map(([label, tabId]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setActiveTab(tabId as DrawerTab)}
                          className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                        >
                          {label}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionBlock>
            </aside>
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
    </div>
  );
};

export default StaffProfileDrawer;
