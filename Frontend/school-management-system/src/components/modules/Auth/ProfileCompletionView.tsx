import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  LogOut,
  MapPin,
  Plus,
  Trash2,
  Upload,
  User,
  WalletCards
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import {
  DocumentRequirementSlot,
  EmployeeCategory,
  getDocumentRequirements
} from '../Staff/staffFlowOptions';
import { Staff, StaffDocument, StaffEducationRecord, StaffExperienceRecord } from '../../../types';

interface UploadedFile {
  fileName: string;
  fileUrl: string;
  uploadedDate: string;
}

interface EducationDraft {
  id: string;
  highestQualification: string;
  university: string;
  year: string;
  percentage: string;
  bed: string;
  med: string;
  phd: string;
  specialization: string;
}

interface ExperienceDraft {
  id: string;
  totalExperience: string;
  previousSchool: string;
  organization: string;
  designation: string;
  joiningDate: string;
  relievingDate: string;
  certificate: UploadedFile | null;
}

interface DocumentDraft extends DocumentRequirementSlot {
  id: string;
  file: UploadedFile | null;
}

interface ProfileFormState {
  photo: UploadedFile | null;
  personal: {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: '' | 'Male' | 'Female' | 'Other';
    dob: string;
    bloodGroup: string;
    mobile: string;
    alternateMobile: string;
    nationality: string;
    religion: string;
    maritalStatus: string;
    fatherName: string;
    motherName: string;
  };
  address: {
    currentAddress: string;
    permanentAddress: string;
    city: string;
    district: string;
    state: string;
    country: string;
    pinCode: string;
  };
  education: EducationDraft[];
  experience: ExperienceDraft[];
  bank: {
    accountHolderName: string;
    bankName: string;
    branch: string;
    accountNumber: string;
    confirmAccountNumber: string;
    ifscCode: string;
    upiId: string;
  };
  documents: DocumentDraft[];
}

type StepId = 'personal' | 'address' | 'education' | 'experience' | 'bank' | 'documents' | 'review';

const defaultAvatar = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80';

const stepMeta: { id: StepId; title: string; short: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'personal', title: 'Personal', short: 'Personal', icon: User },
  { id: 'address', title: 'Address', short: 'Address', icon: MapPin },
  { id: 'education', title: 'Education', short: 'Education', icon: GraduationCap },
  { id: 'experience', title: 'Experience', short: 'Experience', icon: Briefcase },
  { id: 'bank', title: 'Bank', short: 'Bank', icon: WalletCards },
  { id: 'documents', title: 'Documents', short: 'Docs', icon: FileText },
  { id: 'review', title: 'Review', short: 'Review', icon: CheckCircle2 }
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function fileSnapshot(file: File): UploadedFile {
  return {
    fileName: file.name,
    fileUrl: URL.createObjectURL(file),
    uploadedDate: new Date().toISOString().split('T')[0]
  };
}

function matchesRequiredDocument(document: StaffDocument, requirement: string) {
  const docLabel = normalize(`${document.title || ''} ${document.type || ''}`);
  const req = normalize(requirement);
  return docLabel.includes(req) || req.includes(docLabel);
}

function emptyEducationRow(staff?: Staff | null): EducationDraft {
  return {
    id: `EDU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    highestQualification: staff?.qualification || '',
    university: '',
    year: '',
    percentage: '',
    bed: '',
    med: '',
    phd: '',
    specialization: staff?.specialization || ''
  };
}

function emptyExperienceRow(staff?: Staff | null): ExperienceDraft {
  return {
    id: `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    totalExperience: staff?.experienceYears ? String(staff.experienceYears) : '',
    previousSchool: '',
    organization: '',
    designation: '',
    joiningDate: '',
    relievingDate: '',
    certificate: null
  };
}

function buildDocumentDrafts(category: EmployeeCategory, staff?: Staff | null): DocumentDraft[] {
  const requirements = getDocumentRequirements(category);
  const existingDocs = staff?.documents || [];

  return requirements.map(req => {
    const existing = existingDocs.find(doc => matchesRequiredDocument(doc, req.label));
    return {
      id: `DOC-${normalize(req.label).replace(/\s+/g, '-').toUpperCase()}`,
      label: req.label,
      required: req.required,
      type: req.type,
      file: existing
        ? {
            fileName: existing.title,
            fileUrl: existing.fileUrl,
            uploadedDate: existing.uploadedDate
          }
        : null
    };
  });
}

function buildProfileForm(staff: Staff | undefined | null, category: EmployeeCategory): ProfileFormState {
  const educationRows = staff?.qualifications?.length
    ? staff.qualifications.map(item => ({
        id: item.id || `EDU-${Date.now()}-${Math.random()}`,
        highestQualification: item.highestQualification || '',
        university: item.university || '',
        year: item.year || '',
        percentage: item.percentage || '',
        bed: item.bed || '',
        med: item.med || '',
        phd: item.phd || '',
        specialization: item.specialization || ''
      }))
    : [emptyEducationRow(staff)];

  const experienceRows = staff?.experienceRecords?.length
    ? staff.experienceRecords.map(item => ({
        id: item.id || `EXP-${Date.now()}-${Math.random()}`,
        totalExperience: item.totalExperience || '',
        previousSchool: item.previousSchool || '',
        organization: item.organization || '',
        designation: item.designation || '',
        joiningDate: item.joiningDate || '',
        relievingDate: item.relievingDate || '',
        certificate: item.certificateFileUrl
          ? {
              fileName: item.certificateFileName || 'Experience Certificate',
              fileUrl: item.certificateFileUrl,
              uploadedDate: item.certificateUploadedAt || new Date().toISOString().split('T')[0]
            }
          : null
      }))
    : [emptyExperienceRow(staff)];

  return {
    photo: null,
    personal: {
      firstName: staff?.firstName || '',
      middleName: staff?.middleName || '',
      lastName: staff?.lastName || '',
      gender: staff?.gender || '',
      dob: staff?.dob || '',
      bloodGroup: staff?.bloodGroup ? String(staff.bloodGroup) : '',
      mobile: staff?.phone || staff?.mobile || '',
      alternateMobile: staff?.alternateMobile || '',
      nationality: staff?.nationality || '',
      religion: staff?.religion || '',
      maritalStatus: staff?.maritalStatus || '',
      fatherName: staff?.fatherName || '',
      motherName: staff?.motherName || ''
    },
    address: {
      currentAddress: staff?.currentAddress || staff?.address || '',
      permanentAddress: staff?.permanentAddress || '',
      city: staff?.city || '',
      district: staff?.district || '',
      state: staff?.state || '',
      country: staff?.country || 'India',
      pinCode: staff?.pinCode || ''
    },
    education: educationRows,
    experience: experienceRows,
    bank: {
      accountHolderName: staff?.bankDetails?.accountHolderName || '',
      bankName: staff?.bankDetails?.bankName || '',
      branch: staff?.bankDetails?.branch || '',
      accountNumber: staff?.bankDetails?.accountNumber || '',
      confirmAccountNumber: staff?.bankDetails?.accountNumber || '',
      ifscCode: staff?.bankDetails?.ifscCode || '',
      upiId: staff?.bankDetails?.upiId || ''
    },
    documents: buildDocumentDrafts(category, staff)
  };
}

const SectionCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
    <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
      <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
    {label} {required ? <span className="text-rose-500">*</span> : null}
  </label>
);

interface ProfileCompletionViewProps {
  onComplete?: () => void;
}

export const ProfileCompletionView: React.FC<ProfileCompletionViewProps> = ({ onComplete }) => {
  const { user, setUser, logout } = useAuth();
  const { staff, updateStaff } = useData();
  const { addToast } = useToast();

  const linkedStaff = useMemo(
    () => staff.find(item => item.email.toLowerCase() === (user?.email || '').toLowerCase()) || null,
    [staff, user?.email]
  );

  const staffCategory: EmployeeCategory = linkedStaff?.employeeCategory || (
    user?.role === 'Teacher' || user?.role === 'Principal'
      ? 'Teacher'
      : 'Staff'
  );
  const requiredDocuments = useMemo(() => getDocumentRequirements(staffCategory), [staffCategory]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ProfileFormState>(() => buildProfileForm(linkedStaff, staffCategory));

  const totalSteps = stepMeta.length;
  const progress = Math.round((currentStep / (totalSteps - 1)) * 100);
  const fullName = `${form.personal.firstName} ${form.personal.middleName} ${form.personal.lastName}`.replace(/\s+/g, ' ').trim();
  const uploadedRequiredCount = requiredDocuments.filter(req => {
    const row = form.documents.find(doc => doc.label === req.label);
    return !!row?.file;
  }).length;
  const totalQualificationRows = form.education.filter(row => row.highestQualification || row.university || row.year || row.percentage).length;
  const totalExperienceYears = form.experience.reduce((sum, row) => {
    const parsed = Number.parseFloat(row.totalExperience);
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);

  const updatePersonal = (field: keyof ProfileFormState['personal'], value: string) => {
    setForm(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
  };

  const updateAddress = (field: keyof ProfileFormState['address'], value: string) => {
    setForm(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const updateBank = (field: keyof ProfileFormState['bank'], value: string) => {
    setForm(prev => ({ ...prev, bank: { ...prev.bank, [field]: value } }));
  };

  const updateEducation = (id: string, updates: Partial<EducationDraft>) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.map(row => (row.id === id ? { ...row, ...updates } : row))
    }));
  };

  const updateExperience = (id: string, updates: Partial<ExperienceDraft>) => {
    setForm(prev => ({
      ...prev,
      experience: prev.experience.map(row => (row.id === id ? { ...row, ...updates } : row)),
      documents:
        updates.certificate !== undefined
          ? prev.documents.map(doc =>
              doc.label.toLowerCase().includes('experience certificate')
                ? { ...doc, file: updates.certificate ?? null }
                : doc
            )
          : prev.documents
    }));
  };

  const updateDocument = (id: string, file: UploadedFile | null) => {
    setForm(prev => ({
      ...prev,
      documents: prev.documents.map(doc => (doc.id === id ? { ...doc, file } : doc))
    }));
  };

  const syncPhotoDocument = (file: UploadedFile | null) => {
    setForm(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.label === 'Passport Photo' ? { ...doc, file } : doc
      )
    }));
  };

  const addEducationRow = () => {
    setForm(prev => ({ ...prev, education: [...prev.education, emptyEducationRow(linkedStaff)] }));
  };

  const removeEducationRow = (id: string) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.length > 1 ? prev.education.filter(row => row.id !== id) : prev.education
    }));
  };

  const addExperienceRow = () => {
    setForm(prev => ({ ...prev, experience: [...prev.experience, emptyExperienceRow(linkedStaff)] }));
  };

  const removeExperienceRow = (id: string) => {
    setForm(prev => ({
      ...prev,
      experience: prev.experience.length > 1 ? prev.experience.filter(row => row.id !== id) : prev.experience
    }));
  };

  const setFileFromInput = (field: 'photo' | 'experience', id: string | null, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const snapshot = fileSnapshot(file);

    if (field === 'photo') {
      setForm(prev => ({ ...prev, photo: snapshot }));
      syncPhotoDocument(snapshot);
      return;
    }

    if (id) {
      updateExperience(id, { certificate: snapshot });
    }
  };

  const buildStepErrors = (step: number) => {
    const nextErrors: Record<string, string> = {};
    const require = (key: string, condition: boolean, message: string) => {
      if (!condition) nextErrors[key] = message;
    };

    if (step === 0) {
      require('photo', !!form.photo, 'Please upload your photo.');
      require('firstName', !!form.personal.firstName.trim(), 'First name is required.');
      require('lastName', !!form.personal.lastName.trim(), 'Last name is required.');
      require('gender', !!form.personal.gender, 'Gender is required.');
      require('dob', !!form.personal.dob, 'Date of birth is required.');
      require('mobile', !!form.personal.mobile.trim(), 'Mobile number is required.');
    }

    if (step === 1) {
      require('currentAddress', !!form.address.currentAddress.trim(), 'Current address is required.');
      require('city', !!form.address.city.trim(), 'City is required.');
      require('state', !!form.address.state.trim(), 'State is required.');
      require('country', !!form.address.country.trim(), 'Country is required.');
      require('pinCode', !!form.address.pinCode.trim(), 'PIN code is required.');
    }

    if (step === 2) {
      const first = form.education[0];
      require('education.highestQualification', !!first?.highestQualification.trim(), 'Highest qualification is required.');
      require('education.university', !!first?.university.trim(), 'University is required.');
      require('education.year', !!first?.year.trim(), 'Year is required.');
      require('education.percentage', !!first?.percentage.trim(), 'Percentage is required.');
    }

    if (step === 4) {
      require('bank.accountHolderName', !!form.bank.accountHolderName.trim(), 'Account holder name is required.');
      require('bank.bankName', !!form.bank.bankName.trim(), 'Bank name is required.');
      require('bank.branch', !!form.bank.branch.trim(), 'Bank branch is required.');
      require('bank.accountNumber', !!form.bank.accountNumber.trim(), 'Account number is required.');
      require('bank.confirmAccountNumber', form.bank.confirmAccountNumber.trim() === form.bank.accountNumber.trim(), 'Account numbers must match.');
      require('bank.ifscCode', !!form.bank.ifscCode.trim(), 'IFSC code is required.');
    }

    if (step === 5) {
      const missingDocs = requiredDocuments.filter(req => req.required && !form.documents.find(doc => doc.label === req.label)?.file);
      if (missingDocs.length > 0) {
        nextErrors.documents = `Missing required documents: ${missingDocs.slice(0, 3).map(doc => doc.label).join(', ')}${missingDocs.length > 3 ? '...' : ''}`;
      }
    }

    return nextErrors;
  };

  const validateCurrentStep = (step: number) => {
    const nextErrors = buildStepErrors(step);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAll = () => {
    const mergedErrors = [0, 1, 2, 4, 5].reduce<Record<string, string>>((acc, step) => {
      return { ...acc, ...buildStepErrors(step) };
    }, {});
    setErrors(mergedErrors);
    return Object.keys(mergedErrors).length === 0;
  };

  const moveNext = () => {
    if (!validateCurrentStep(currentStep)) {
      addToast('warning', 'Please complete the required fields', 'Some sections still need attention.');
      return;
    }
    setCurrentStep(step => Math.min(step + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const movePrevious = () => {
    setCurrentStep(step => Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (!validateAll()) {
      addToast('warning', 'Profile incomplete', 'Please review the highlighted fields before submitting.');
      return;
    }

    setLoading(true);

    const educationRecords: StaffEducationRecord[] = form.education.map(row => ({
      id: row.id,
      highestQualification: row.highestQualification.trim(),
      university: row.university.trim(),
      year: row.year.trim(),
      percentage: row.percentage.trim(),
      bed: row.bed.trim() || undefined,
      med: row.med.trim() || undefined,
      phd: row.phd.trim() || undefined,
      specialization: row.specialization.trim() || undefined
    })).filter(row => row.highestQualification || row.university || row.year || row.percentage);

    const experienceRecords: StaffExperienceRecord[] = form.experience.map(row => ({
      id: row.id,
      totalExperience: row.totalExperience.trim(),
      previousSchool: row.previousSchool.trim() || undefined,
      organization: row.organization.trim() || undefined,
      designation: row.designation.trim() || undefined,
      joiningDate: row.joiningDate || undefined,
      relievingDate: row.relievingDate || undefined,
      certificateFileName: row.certificate?.fileName,
      certificateFileUrl: row.certificate?.fileUrl,
      certificateUploadedAt: row.certificate?.uploadedDate
    })).filter(row => row.totalExperience || row.previousSchool || row.organization || row.designation);

    const uploadedDocs = form.documents
      .filter(doc => doc.file)
      .map((doc, index) => ({
        id: `DOC-${Date.now()}-${index}`,
        title: doc.label,
        type: doc.type,
        fileUrl: doc.file!.fileUrl,
        uploadedDate: doc.file!.uploadedDate,
        uploadedBy: user?.name || 'Employee',
        verificationStatus: 'Pending Verification' as const,
        isRequired: doc.required
      }));

    const photoDoc = form.photo
      ? [{
          id: `DOC-PHOTO-${Date.now()}`,
          title: 'Passport Photo',
          type: 'Other' as const,
          fileUrl: form.photo.fileUrl,
          uploadedDate: form.photo.uploadedDate,
          uploadedBy: user?.name || 'Employee',
          verificationStatus: 'Pending Verification' as const,
          isRequired: true
        }]
      : [];

    const mergedDocs = [...photoDoc, ...uploadedDocs].reduce<StaffDocument[]>((acc, doc) => {
      const existingIndex = acc.findIndex(item => normalize(item.title) === normalize(doc.title));
      if (existingIndex >= 0) {
        acc[existingIndex] = doc;
      } else {
        acc.push(doc);
      }
      return acc;
    }, linkedStaff?.documents ? [...linkedStaff.documents] : []);

    const profilePayload: Partial<Staff> = {
      profileStatus: 'Completed',
      middleName: form.personal.middleName.trim() || undefined,
      alternateMobile: form.personal.alternateMobile.trim() || undefined,
      bloodGroup: form.personal.bloodGroup || undefined,
      nationality: form.personal.nationality.trim() || undefined,
      religion: form.personal.religion.trim() || undefined,
      maritalStatus: form.personal.maritalStatus.trim() || undefined,
      fatherName: form.personal.fatherName.trim() || undefined,
      motherName: form.personal.motherName.trim() || undefined,
      currentAddress: form.address.currentAddress.trim(),
      residentialAddress: form.address.currentAddress.trim(),
      permanentAddress: form.address.permanentAddress.trim() || undefined,
      city: form.address.city.trim() || undefined,
      district: form.address.district.trim() || undefined,
      state: form.address.state.trim() || undefined,
      country: form.address.country.trim() || undefined,
      pinCode: form.address.pinCode.trim() || undefined,
      address: [form.address.currentAddress, form.address.city, form.address.state, form.address.country, form.address.pinCode]
        .map(value => value.trim())
        .filter(Boolean)
        .join(', '),
      qualifications: educationRecords,
      experienceRecords,
      experienceYears: totalExperienceYears,
      qualification: educationRecords[0]?.highestQualification || linkedStaff?.qualification || '',
      highestQualification: educationRecords[0]?.highestQualification || linkedStaff?.highestQualification || '',
      specialization: educationRecords[0]?.specialization || linkedStaff?.specialization || linkedStaff?.qualification || '',
      bankDetails: {
        accountHolderName: form.bank.accountHolderName.trim(),
        accountNumber: form.bank.accountNumber.trim(),
        bankName: form.bank.bankName.trim(),
        branch: form.bank.branch.trim(),
        ifscCode: form.bank.ifscCode.trim(),
        upiId: form.bank.upiId.trim()
      },
      documents: mergedDocs,
      avatar: form.photo?.fileUrl || linkedStaff?.avatar || defaultAvatar,
      firstName: form.personal.firstName.trim(),
      lastName: form.personal.lastName.trim(),
      name: fullName,
      gender: form.personal.gender || linkedStaff?.gender || 'Male',
      dob: form.personal.dob || linkedStaff?.dob || '',
      phone: form.personal.mobile.trim() || linkedStaff?.phone || '',
      mobile: form.personal.mobile.trim() || linkedStaff?.mobile || '',
      email: linkedStaff?.email || user?.email || ''
    };

    if (linkedStaff) {
      updateStaff(linkedStaff.id, profilePayload);
    }

    if (user) {
      const updatedUser = { ...user, isFirstLogin: false };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }

    setTimeout(() => {
      addToast('success', 'Profile completed', 'Your employee profile has been saved successfully.');
      setLoading(false);
      if (onComplete) {
        onComplete();
      }
    }, 500);
  };

  const renderEducationSummary = () => {
    if (form.education.length === 0) return <p className="text-sm text-slate-500 italic">No qualification records added yet.</p>;
    return (
      <div className="space-y-3">
        {form.education.map(row => (
          <div key={row.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-black text-slate-500">Qualification:</span> {row.highestQualification || 'Not provided'}</div>
              <div><span className="font-black text-slate-500">University:</span> {row.university || 'Not provided'}</div>
              <div><span className="font-black text-slate-500">Year:</span> {row.year || 'Not provided'}</div>
              <div><span className="font-black text-slate-500">Percentage:</span> {row.percentage || 'Not provided'}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderExperienceSummary = () => {
    if (form.experience.length === 0) return <p className="text-sm text-slate-500 italic">No experience records added yet.</p>;
    return (
      <div className="space-y-3">
        {form.experience.map(row => (
          <div key={row.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-black text-slate-500">Experience:</span> {row.totalExperience || 'Not provided'}</div>
              <div><span className="font-black text-slate-500">Organization:</span> {row.organization || 'Not provided'}</div>
              <div><span className="font-black text-slate-500">Designation:</span> {row.designation || 'Not provided'}</div>
              <div><span className="font-black text-slate-500">Previous School:</span> {row.previousSchool || 'Not provided'}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <SectionCard title="Personal Information" subtitle="Fill in your identity and family details.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <FieldLabel label="Profile Photo" required />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setFileFromInput('photo', null, e.target.files)}
                  className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm"
                />
                <p className="mt-2 text-xs text-slate-500">
                  {form.photo ? `Selected: ${form.photo.fileName}` : 'Upload a passport-style photo.'}
                </p>
                {errors.photo && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.photo}</p>}
              </div>
              <div>
                <FieldLabel label="First Name" required />
                <input value={form.personal.firstName} onChange={e => updatePersonal('firstName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors.firstName && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.firstName}</p>}
              </div>
              <div>
                <FieldLabel label="Middle Name" />
                <input value={form.personal.middleName} onChange={e => updatePersonal('middleName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
              </div>
              <div>
                <FieldLabel label="Last Name" required />
                <input value={form.personal.lastName} onChange={e => updatePersonal('lastName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors.lastName && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.lastName}</p>}
              </div>
              <div>
                <FieldLabel label="Gender" required />
                <select value={form.personal.gender} onChange={e => updatePersonal('gender', e.target.value as ProfileFormState['personal']['gender'])} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.gender}</p>}
              </div>
              <div>
                <FieldLabel label="Date of Birth" required />
                <input type="date" value={form.personal.dob} onChange={e => updatePersonal('dob', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors.dob && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.dob}</p>}
              </div>
              <div>
                <FieldLabel label="Blood Group" />
                <input value={form.personal.bloodGroup} onChange={e => updatePersonal('bloodGroup', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" placeholder="A+, O+, AB- ..." />
              </div>
              <div>
                <FieldLabel label="Mobile Number" required />
                <input type="tel" value={form.personal.mobile} onChange={e => updatePersonal('mobile', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" placeholder="10-digit mobile number" />
                {errors.mobile && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.mobile}</p>}
              </div>
              <div>
                <FieldLabel label="Alternate Mobile" />
                <input type="tel" value={form.personal.alternateMobile} onChange={e => updatePersonal('alternateMobile', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" placeholder="Optional" />
              </div>
              <div>
                <FieldLabel label="Nationality" />
                <input value={form.personal.nationality} onChange={e => updatePersonal('nationality', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
              </div>
              <div>
                <FieldLabel label="Religion" />
                <input value={form.personal.religion} onChange={e => updatePersonal('religion', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
              </div>
              <div>
                <FieldLabel label="Marital Status" />
                <input value={form.personal.maritalStatus} onChange={e => updatePersonal('maritalStatus', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
              </div>
              <div>
                <FieldLabel label="Father Name" />
                <input value={form.personal.fatherName} onChange={e => updatePersonal('fatherName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
              </div>
              <div>
                <FieldLabel label="Mother Name" />
                <input value={form.personal.motherName} onChange={e => updatePersonal('motherName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
              </div>
            </div>
          </SectionCard>
        );
      case 1:
        return (
          <SectionCard title="Address" subtitle="Add your current and permanent address details.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <FieldLabel label="Current Address" required />
                <textarea rows={3} value={form.address.currentAddress} onChange={e => updateAddress('currentAddress', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors.currentAddress && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.currentAddress}</p>}
              </div>
              <div className="lg:col-span-2">
                <FieldLabel label="Permanent Address" />
                <textarea rows={3} value={form.address.permanentAddress} onChange={e => updateAddress('permanentAddress', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
              </div>
              <div>
                <FieldLabel label="City" required />
                <input value={form.address.city} onChange={e => updateAddress('city', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors.city && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.city}</p>}
              </div>
              <div>
                <FieldLabel label="District" />
                <input value={form.address.district} onChange={e => updateAddress('district', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
              </div>
              <div>
                <FieldLabel label="State" required />
                <input value={form.address.state} onChange={e => updateAddress('state', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors.state && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.state}</p>}
              </div>
              <div>
                <FieldLabel label="Country" required />
                <input value={form.address.country} onChange={e => updateAddress('country', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors.country && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.country}</p>}
              </div>
              <div>
                <FieldLabel label="PIN Code" required />
                <input value={form.address.pinCode} onChange={e => updateAddress('pinCode', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors.pinCode && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.pinCode}</p>}
              </div>
            </div>
          </SectionCard>
        );
      case 2:
        return (
          <SectionCard title="Education" subtitle={`Add one or more qualification records for ${staffCategory === 'Teacher' ? 'teaching staff' : 'non-teaching staff'}.`}>
            <div className="space-y-4">
              {form.education.map((row, index) => (
                <div key={row.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-900 dark:text-white">Qualification {index + 1}</p>
                    <div className="flex items-center gap-2">
                      {form.education.length > 1 && (
                        <button type="button" onClick={() => removeEducationRow(row.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">
                          <Trash2 className="h-4 w-4" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="Highest Qualification" required />
                      <input value={row.highestQualification} onChange={e => updateEducation(row.id, { highestQualification: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                      {index === 0 && errors['education.highestQualification'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['education.highestQualification']}</p>}
                    </div>
                    <div>
                      <FieldLabel label="University / Board" required />
                      <input value={row.university} onChange={e => updateEducation(row.id, { university: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                      {index === 0 && errors['education.university'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['education.university']}</p>}
                    </div>
                    <div>
                      <FieldLabel label="Year" required />
                      <input value={row.year} onChange={e => updateEducation(row.id, { year: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                      {index === 0 && errors['education.year'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['education.year']}</p>}
                    </div>
                    <div>
                      <FieldLabel label="Percentage" required />
                      <input value={row.percentage} onChange={e => updateEducation(row.id, { percentage: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                      {index === 0 && errors['education.percentage'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['education.percentage']}</p>}
                    </div>
                    {staffCategory === 'Teacher' && (
                      <>
                        <div>
                          <FieldLabel label="B.Ed" />
                          <input value={row.bed} onChange={e => updateEducation(row.id, { bed: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                        </div>
                        <div>
                          <FieldLabel label="M.Ed" />
                          <input value={row.med} onChange={e => updateEducation(row.id, { med: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                        </div>
                        <div>
                          <FieldLabel label="Ph.D" />
                          <input value={row.phd} onChange={e => updateEducation(row.id, { phd: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                        </div>
                        <div>
                          <FieldLabel label="Specialization" />
                          <input value={row.specialization} onChange={e => updateEducation(row.id, { specialization: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addEducationRow} className="inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700">
                <Plus className="h-4 w-4" /> Add Qualification
              </button>
            </div>
          </SectionCard>
        );
      case 3:
        return (
          <SectionCard title="Experience" subtitle="Add previous organization or school details if applicable.">
            <div className="space-y-4">
              {form.experience.map((row, index) => (
                <div key={row.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-900 dark:text-white">Experience Record {index + 1}</p>
                    {form.experience.length > 1 && (
                      <button type="button" onClick={() => removeExperienceRow(row.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="Total Experience" />
                      <input value={row.totalExperience} onChange={e => updateExperience(row.id, { totalExperience: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" placeholder="e.g. 5 years" />
                    </div>
                    <div>
                      <FieldLabel label="Previous School" />
                      <input value={row.previousSchool} onChange={e => updateExperience(row.id, { previousSchool: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <FieldLabel label="Organization" />
                      <input value={row.organization} onChange={e => updateExperience(row.id, { organization: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <FieldLabel label="Designation" />
                      <input value={row.designation} onChange={e => updateExperience(row.id, { designation: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <FieldLabel label="Joining Date" />
                      <input type="date" value={row.joiningDate} onChange={e => updateExperience(row.id, { joiningDate: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <FieldLabel label="Relieving Date" />
                      <input type="date" value={row.relievingDate} onChange={e => updateExperience(row.id, { relievingDate: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <FieldLabel label="Experience Certificate Upload" />
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={e => setFileFromInput('experience', row.id, e.target.files)}
                        className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        {row.certificate ? `Selected: ${row.certificate.fileName}` : 'Upload a previous employment certificate if available.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addExperienceRow} className="inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700">
                <Plus className="h-4 w-4" /> Add Experience
              </button>
            </div>
          </SectionCard>
        );
      case 4:
        return (
          <SectionCard title="Bank Details" subtitle="Enter the account where your salary will be credited.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Account Holder Name" required />
                <input value={form.bank.accountHolderName} onChange={e => updateBank('accountHolderName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors['bank.accountHolderName'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['bank.accountHolderName']}</p>}
              </div>
              <div>
                <FieldLabel label="Bank Name" required />
                <input value={form.bank.bankName} onChange={e => updateBank('bankName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors['bank.bankName'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['bank.bankName']}</p>}
              </div>
              <div>
                <FieldLabel label="Branch" required />
                <input value={form.bank.branch} onChange={e => updateBank('branch', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
                {errors['bank.branch'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['bank.branch']}</p>}
              </div>
              <div>
                <FieldLabel label="Account Number" required />
                <input value={form.bank.accountNumber} onChange={e => updateBank('accountNumber', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm font-mono" />
                {errors['bank.accountNumber'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['bank.accountNumber']}</p>}
              </div>
              <div>
                <FieldLabel label="Confirm Account Number" required />
                <input value={form.bank.confirmAccountNumber} onChange={e => updateBank('confirmAccountNumber', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm font-mono" />
                {errors['bank.confirmAccountNumber'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['bank.confirmAccountNumber']}</p>}
              </div>
              <div>
                <FieldLabel label="IFSC Code" required />
                <input value={form.bank.ifscCode} onChange={e => updateBank('ifscCode', e.target.value.toUpperCase())} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm font-mono uppercase" />
                {errors['bank.ifscCode'] && <p className="mt-1 text-xs font-semibold text-rose-500">{errors['bank.ifscCode']}</p>}
              </div>
              <div>
                <FieldLabel label="UPI ID" />
                <input value={form.bank.upiId} onChange={e => updateBank('upiId', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm" />
              </div>
            </div>
          </SectionCard>
        );
      case 5:
        return (
          <SectionCard title="Documents" subtitle="Upload only the documents required for your staff category.">
            <div className="space-y-3">
              {form.documents.map(doc => (
                <div key={doc.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{doc.label}</p>
                      <p className="text-[11px] text-slate-500">{doc.required ? 'Required document' : 'Optional document'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                        <Upload className="h-4 w-4" />
                        {doc.file ? 'Replace File' : 'Upload File'}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={e => {
                            const selected = e.target.files?.[0];
                            if (!selected) return;
                            const snapshot = fileSnapshot(selected);
                            updateDocument(doc.id, snapshot);
                            if (doc.label.toLowerCase().includes('passport photo')) {
                              setForm(prev => ({ ...prev, photo: snapshot }));
                            }
                            if (doc.label.toLowerCase().includes('experience certificate') && form.experience[0]) {
                              updateExperience(form.experience[0].id, { certificate: snapshot });
                            }
                          }}
                        />
                      </label>
                      <Badge variant={doc.file ? 'success' : 'warning'} size="sm">
                        {doc.file ? 'Uploaded' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                  {doc.file && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs">
                      <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{doc.file.fileName}</span>
                      <span className="text-slate-400">{doc.file.uploadedDate}</span>
                    </div>
                  )}
                </div>
              ))}
              {errors.documents && <p className="text-xs font-semibold text-rose-500">{errors.documents}</p>}
            </div>
          </SectionCard>
        );
      case 6:
      default:
        return (
          <SectionCard title="Review & Submit" subtitle="Verify the details before completing your profile.">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Personal</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-bold text-slate-900 dark:text-white">{fullName || 'Name not provided'}</p>
                  <p className="text-slate-500">{form.personal.gender || 'Gender not provided'} | {form.personal.dob || 'DOB not provided'}</p>
                  <p className="text-slate-500">{form.personal.fatherName || 'Father name not provided'}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Address</p>
                <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <p>{form.address.currentAddress || 'Current address not provided'}</p>
                  <p>{[form.address.city, form.address.state, form.address.country, form.address.pinCode].filter(Boolean).join(', ') || 'Location not provided'}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Education</p>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{totalQualificationRows} qualification record(s)</p>
                <p className="text-xs text-slate-500">Latest qualification: {form.education[0]?.highestQualification || 'Not provided'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Experience</p>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{totalExperienceYears || 0} years</p>
                <p className="text-xs text-slate-500">Previous records: {form.experience.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Bank</p>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{form.bank.bankName || 'Bank not provided'}</p>
                <p className="text-xs text-slate-500">{form.bank.accountHolderName || 'Account holder not provided'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Documents</p>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{uploadedRequiredCount} / {requiredDocuments.length} uploaded</p>
                <p className="text-xs text-slate-500">Required documents are tracked below.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Qualifications</p>
                <div className="mt-2">{renderEducationSummary()}</div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Experience</p>
                <div className="mt-2">{renderExperienceSummary()}</div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Documents</p>
                <div className="mt-2 space-y-2">
                  {form.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.label}</p>
                        <p className="text-[11px] text-slate-500">{doc.file ? doc.file.fileName : 'Not uploaded'}</p>
                      </div>
                      <Badge variant={doc.file ? 'success' : 'warning'} size="sm">
                        {doc.file ? 'Uploaded' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in">
        <div className="rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info" size="sm">Employee Profile</Badge>
                  <Badge variant={staffCategory === 'Teacher' ? 'success' : 'neutral'} size="sm">
                    {staffCategory === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff'}
                  </Badge>
                </div>
                <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Complete Your Profile</h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                  Fill in your personal, academic, banking, and document details. Your employee record will be marked complete when you submit this wizard.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {onComplete && (
                  <button
                    type="button"
                    onClick={onComplete}
                    className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-sky-500 transition-all cursor-pointer"
                  >
                    <Home className="h-4 w-4" /> Go to Dashboard
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <div className="grid min-w-[940px] grid-cols-7 gap-3">
                {stepMeta.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === index;
                  const isComplete = currentStep > index;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStep(index)}
                      className={`flex h-full min-h-[86px] flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-center transition-all ${
                        isActive
                          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                          : isComplete
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-950 shadow-sm">
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className="w-full truncate text-xs font-black uppercase tracking-[0.25em]">{step.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Current Step</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{stepMeta[currentStep].title}</p>
                </div>
                <Badge variant={staffCategory === 'Teacher' ? 'success' : 'neutral'} size="sm">
                  {uploadedRequiredCount} / {requiredDocuments.length} docs
                </Badge>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-sky-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)] sm:px-6">
            {renderStepContent()}

            <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={movePrevious}
                disabled={currentStep === 0 || loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
              >
                Back
              </button>
              <div className="flex items-center gap-3">
                {currentStep < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={moveNext}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-600/20"
                  >
                    Next Step <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-600/20 disabled:opacity-70"
                  >
                    {loading ? 'Submitting...' : 'Submit Profile'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionView;
