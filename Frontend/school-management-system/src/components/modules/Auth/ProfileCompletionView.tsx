import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  MapPin,
  Plus,
  Trash2,
  Upload,
  User as UserIcon,
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
import { Staff, StaffDocument, StaffEducationRecord, StaffExperienceRecord, User } from '../../../types';
import { lookupPostalCode, getOfflinePostalInfo } from '../../../utils/postalLookup';
import { MARITAL_STATUSES } from '../../../utils/validation';

const normalizeMaritalStatus = (status?: string): string => {
  if (!status) return '';
  const clean = status.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (clean === 'married') return 'Married';
  if (clean === 'unmarried' || clean === 'single') return 'Unmarried';
  return status;
};

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
  { id: 'personal', title: 'Personal Information', short: 'Personal', icon: UserIcon },
  { id: 'address', title: 'Address Details', short: 'Address', icon: MapPin },
  { id: 'education', title: 'Education', short: 'Education', icon: GraduationCap },
  { id: 'experience', title: 'Experience', short: 'Experience', icon: Briefcase },
  { id: 'bank', title: 'Bank Details', short: 'Bank', icon: WalletCards },
  { id: 'documents', title: 'Documents', short: 'Documents', icon: FileText },
  { id: 'review', title: 'Review & Submit', short: 'Review', icon: CheckCircle2 }
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
  if (req.includes('profile picture') || req.includes('passport photo')) {
    return docLabel.includes('profile picture') || docLabel.includes('passport photo') || docLabel.includes('photo') || docLabel.includes('avatar');
  }
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

function buildDocumentDrafts(category: EmployeeCategory, staff?: Staff | null, user?: User | null): DocumentDraft[] {
  const requirements = getDocumentRequirements(category);
  const existingDocs = staff?.documents || [];

  return requirements.map(req => {
    const existing = existingDocs.find(doc => matchesRequiredDocument(doc, req.label));
    let file = existing
      ? {
          fileName: existing.title,
          fileUrl: existing.fileUrl,
          uploadedDate: existing.uploadedDate
        }
      : null;

    if (!file && (req.label.toLowerCase().includes('profile picture') || req.label.toLowerCase().includes('photo')) && (staff?.avatar || user?.avatar)) {
      file = {
        fileName: 'profile_photo.jpg',
        fileUrl: (staff?.avatar || user?.avatar)!,
        uploadedDate: new Date().toISOString().split('T')[0]
      };
    }

    return {
      id: `DOC-${normalize(req.label).replace(/\s+/g, '-').toUpperCase()}`,
      label: req.label,
      required: req.required,
      type: req.type,
      file
    };
  });
}

function buildProfileForm(staff: Staff | undefined | null, category: EmployeeCategory, user?: User | null): ProfileFormState {
  const nameParts = (user?.name || '').trim().split(' ');
  const fallbackFirstName = nameParts[0] || 'Administrator';
  const fallbackLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

  const defaultPhoto: UploadedFile | null = user?.avatar
    ? { fileName: 'profile_photo.jpg', fileUrl: user.avatar, uploadedDate: new Date().toISOString().split('T')[0] }
    : null;

  const educationRows = staff?.qualifications?.length
    ? staff.qualifications.map(item => ({
        id: item.id || `EDU-${Date.now()}-${Math.random()}`,
        highestQualification: item.highestQualification || 'Master of Business Administration (MBA)',
        university: item.university || 'Central University',
        year: item.year || '2016',
        percentage: item.percentage || '85%',
        bed: item.bed || '',
        med: item.med || '',
        phd: item.phd || '',
        specialization: item.specialization || 'Educational Administration'
      }))
    : [{
        id: `EDU-DEFAULT-${Date.now()}`,
        highestQualification: staff?.qualification || 'Master of Business Administration (MBA)',
        university: 'Central University',
        year: '2016',
        percentage: '85%',
        bed: '',
        med: '',
        phd: '',
        specialization: 'Educational Administration & Management'
      }];

  const experienceRows = staff?.experienceRecords?.length
    ? staff.experienceRecords.map(item => ({
        id: item.id || `EXP-${Date.now()}-${Math.random()}`,
        totalExperience: item.totalExperience || '8 Years',
        previousSchool: item.previousSchool || 'Pirnav Educational Academy',
        organization: item.organization || 'Pirnav Schools Group',
        designation: item.designation || (user?.role || 'Senior Administrator'),
        joiningDate: item.joiningDate || '2018-06-01',
        relievingDate: item.relievingDate || '2026-05-31',
        certificate: item.certificateFileUrl
          ? {
              fileName: item.certificateFileName || 'Experience Certificate',
              fileUrl: item.certificateFileUrl,
              uploadedDate: item.certificateUploadedAt || new Date().toISOString().split('T')[0]
            }
          : null
      }))
    : [{
        id: `EXP-DEFAULT-${Date.now()}`,
        totalExperience: '8 Years',
        previousSchool: 'Pirnav Educational Academy',
        organization: 'Pirnav Schools Group',
        designation: user?.role || 'Senior Administrator',
        joiningDate: '2018-06-01',
        relievingDate: '2026-05-31',
        certificate: null
      }];

  return {
    photo: defaultPhoto,
    personal: {
      firstName: staff?.firstName || fallbackFirstName,
      middleName: staff?.middleName || '',
      lastName: staff?.lastName || fallbackLastName,
      gender: (staff?.gender as any) || 'Male',
      dob: staff?.dob || '1990-01-15',
      bloodGroup: staff?.bloodGroup ? String(staff.bloodGroup) : 'O+',
      mobile: staff?.phone || (staff as any)?.mobile || user?.phone || '9876543210',
      alternateMobile: staff?.alternateMobile || '9876543211',
      nationality: staff?.nationality || 'Indian',
      maritalStatus: staff?.maritalStatus || 'Married',
      fatherName: staff?.fatherName || 'Rajesh Kumar',
      motherName: staff?.motherName || 'Sunita Kumar'
    },
    address: {
      currentAddress: staff?.currentAddress || staff?.address || '',
      permanentAddress: staff?.permanentAddress || '123 Academic Enclave, Central City',
      city: staff?.city || 'Bengaluru',
      district: staff?.district || 'Bengaluru Urban',
      state: staff?.state || 'Karnataka',
      country: staff?.country || 'India',
      pinCode: staff?.pinCode || '560001'
    },
    education: educationRows,
    experience: experienceRows,
    bank: {
      accountHolderName: staff?.bankDetails?.accountHolderName || user?.name || `${fallbackFirstName} ${fallbackLastName}`,
      bankName: staff?.bankDetails?.bankName || 'HDFC Bank',
      branch: staff?.bankDetails?.branch || 'Main Branch',
      accountNumber: staff?.bankDetails?.accountNumber || '50100234891234',
      confirmAccountNumber: staff?.bankDetails?.accountNumber || '50100234891234',
      ifscCode: staff?.bankDetails?.ifscCode || 'HDFC0001234',
      upiId: staff?.bankDetails?.upiId || 'admin@hdfc'
    },
    documents: buildDocumentDrafts(category, staff, user)
  };
}

const SectionCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
    <div className="border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40">
      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
    {label} {required ? <span className="text-rose-500">*</span> : null}
  </label>
);

const fieldInputClass = (hasError?: boolean) =>
  `w-full rounded-xl border ${
    hasError
      ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-sky-500 focus:ring-sky-500/20'
  } px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`;

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
  const [form, setForm] = useState<ProfileFormState>(() => buildProfileForm(linkedStaff, staffCategory, user));

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
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateAddress = (field: keyof ProfileFormState['address'], value: string) => {
    setForm(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateBank = (field: keyof ProfileFormState['bank'], value: string) => {
    setForm(prev => ({ ...prev, bank: { ...prev.bank, [field]: value } }));
    const errorKey = `bank.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
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
        (doc.label === 'Profile Picture' || doc.label === 'Passport Photo') ? { ...doc, file } : doc
      )
    }));
  };

  const handleProfilePhotoUploaded = (file: File, snapshot: UploadedFile, docId?: string) => {
    setForm(prev => ({
      ...prev,
      photo: snapshot,
      documents: prev.documents.map(d =>
        (d.id === docId ||
         d.label.toLowerCase().includes('profile picture') ||
         d.label.toLowerCase().includes('passport photo') ||
         d.label.toLowerCase().includes('photo'))
          ? { ...d, file: snapshot }
          : d
      )
    }));

    if (user) {
      setUser({ ...user, avatar: snapshot.fileUrl });
    }
    if (linkedStaff) {
      updateStaff(linkedStaff.id, { avatar: snapshot.fileUrl });
    }

    if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const dataUrl = reader.result;
          const persistentSnapshot: UploadedFile = { ...snapshot, fileUrl: dataUrl };
          setForm(prev => ({
            ...prev,
            photo: persistentSnapshot,
            documents: prev.documents.map(d =>
              (d.id === docId ||
               d.label.toLowerCase().includes('profile picture') ||
               d.label.toLowerCase().includes('passport photo') ||
               d.label.toLowerCase().includes('photo'))
                ? { ...d, file: persistentSnapshot }
                : d
            )
          }));
          if (user) {
            setUser({ ...user, avatar: dataUrl });
          }
          if (linkedStaff) {
            updateStaff(linkedStaff.id, { avatar: dataUrl });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const photoDoc = form.documents.find(
      doc => doc.file && (doc.label.toLowerCase().includes('profile picture') || doc.label.toLowerCase().includes('photo'))
    );
    const photoUrl = photoDoc?.file?.fileUrl || form.photo?.fileUrl;
    if (photoUrl && user && user.avatar !== photoUrl) {
      setUser({ ...user, avatar: photoUrl });
      if (linkedStaff && linkedStaff.avatar !== photoUrl) {
        updateStaff(linkedStaff.id, { avatar: photoUrl });
      }
    }
  }, [form.documents, form.photo, user, linkedStaff]);

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
      handleProfilePhotoUploaded(file, snapshot);
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

    if (step === 3) {
      const today = new Date().toISOString().split('T')[0];
      form.experience.forEach((exp, idx) => {
        if (exp.joiningDate && exp.joiningDate > today) {
          nextErrors[`experience.${idx}.joiningDate`] = 'Joining date cannot be in the future.';
        }
        if (exp.relievingDate && exp.relievingDate > today) {
          nextErrors[`experience.${idx}.relievingDate`] = 'Relieving date cannot be in the future.';
        }
        if (exp.joiningDate && exp.relievingDate && exp.joiningDate > exp.relievingDate) {
          nextErrors[`experience.${idx}.relievingDate`] = 'Relieving date cannot be earlier than joining date.';
        }
      });
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

    const photoDocItem = form.documents.find(doc => doc.label.toLowerCase().includes('profile picture') || doc.label.toLowerCase().includes('photo'))?.file || form.photo;

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

    const photoDoc = photoDocItem
      ? [{
          id: `DOC-PHOTO-${Date.now()}`,
          title: 'Profile Picture',
          type: 'Other' as const,
          fileUrl: photoDocItem.fileUrl,
          uploadedDate: photoDocItem.uploadedDate,
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
      avatar: photoDocItem?.fileUrl || form.photo?.fileUrl || linkedStaff?.avatar || defaultAvatar,
      firstName: form.personal.firstName.trim(),
      lastName: form.personal.lastName.trim(),
      name: fullName,
      gender: form.personal.gender || linkedStaff?.gender || 'Male',
      dob: form.personal.dob || linkedStaff?.dob || '',
      phone: form.personal.mobile.trim() || linkedStaff?.phone || '',
      email: linkedStaff?.email || user?.email || ''
    };

    if (linkedStaff) {
      updateStaff(linkedStaff.id, profilePayload);
    }

    if (user) {
      const updatedUser: any = {
        ...user,
        name: fullName || user.name,
        phone: form.personal.mobile.trim() || user.phone,
        avatar: photoDocItem?.fileUrl || form.photo?.fileUrl || user.avatar || defaultAvatar,
        isFirstLogin: false
      };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }

    setTimeout(() => {
      addToast('success', 'Profile Updated Successfully', `Updated profile details for ${fullName || user?.name}`);
      setLoading(false);
      if (onComplete) {
        onComplete();
      }
    }, 500);
  };

  const renderEducationSummary = () => {
    if (form.education.length === 0) return <p className="text-xs text-slate-500 italic">No qualification records added yet.</p>;
    return (
      <div className="space-y-2">
        {form.education.map(row => (
          <div key={row.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div><span className="font-bold text-slate-400">Qualification:</span> <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">{row.highestQualification || 'N/A'}</span></div>
              <div><span className="font-bold text-slate-400">University:</span> <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">{row.university || 'N/A'}</span></div>
              <div><span className="font-bold text-slate-400">Year:</span> <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">{row.year || 'N/A'}</span></div>
              <div><span className="font-bold text-slate-400">Percentage:</span> <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">{row.percentage || 'N/A'}</span></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderExperienceSummary = () => {
    if (form.experience.length === 0) return <p className="text-xs text-slate-500 italic">No experience records added yet.</p>;
    return (
      <div className="space-y-2">
        {form.experience.map(row => (
          <div key={row.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div><span className="font-bold text-slate-400">Experience:</span> <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">{row.totalExperience || 'N/A'}</span></div>
              <div><span className="font-bold text-slate-400">Organization:</span> <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">{row.organization || 'N/A'}</span></div>
              <div><span className="font-bold text-slate-400">Designation:</span> <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">{row.designation || 'N/A'}</span></div>
              <div><span className="font-bold text-slate-400">Previous School:</span> <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">{row.previousSchool || 'N/A'}</span></div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <FieldLabel label="First Name" required />
                  <input
                    value={form.personal.firstName}
                    onChange={e => updatePersonal('firstName', e.target.value)}
                    className={fieldInputClass(Boolean(errors.firstName))}
                  />
                  {errors.firstName && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.firstName}</p>}
                </div>
                <div>
                  <FieldLabel label="Middle Name" />
                  <input
                    value={form.personal.middleName}
                    onChange={e => updatePersonal('middleName', e.target.value)}
                    className={fieldInputClass()}
                  />
                </div>
                <div>
                  <FieldLabel label="Last Name" required />
                  <input
                    value={form.personal.lastName}
                    onChange={e => updatePersonal('lastName', e.target.value)}
                    className={fieldInputClass(Boolean(errors.lastName))}
                  />
                  {errors.lastName && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.lastName}</p>}
                </div>
                <div>
                  <FieldLabel label="Gender" required />
                  <select
                    value={form.personal.gender}
                    onChange={e => updatePersonal('gender', e.target.value as ProfileFormState['personal']['gender'])}
                    className={fieldInputClass(Boolean(errors.gender))}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.gender}</p>}
                </div>
                <div>
                  <FieldLabel label="Date of Birth" required />
                  <input
                    type="date"
                    value={form.personal.dob}
                    onChange={e => updatePersonal('dob', e.target.value)}
                    className={fieldInputClass(Boolean(errors.dob))}
                  />
                  {errors.dob && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.dob}</p>}
                </div>
                <div>
                  <FieldLabel label="Blood Group" />
                  <input
                    value={form.personal.bloodGroup}
                    onChange={e => updatePersonal('bloodGroup', e.target.value)}
                    className={fieldInputClass()}
                    placeholder="A+, O+, AB- ..."
                  />
                </div>
                <div>
                  <FieldLabel label="Mobile Number" required />
                  <input
                    type="tel"
                    value={form.personal.mobile}
                    onChange={e => updatePersonal('mobile', e.target.value)}
                    className={fieldInputClass(Boolean(errors.mobile))}
                    placeholder="10-digit mobile number"
                  />
                  {errors.mobile && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.mobile}</p>}
                </div>
                <div>
                  <FieldLabel label="Alternate Mobile" />
                  <input
                    type="tel"
                    value={form.personal.alternateMobile}
                    onChange={e => updatePersonal('alternateMobile', e.target.value)}
                    className={fieldInputClass()}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <FieldLabel label="Nationality" />
                  <input
                    value={form.personal.nationality}
                    onChange={e => updatePersonal('nationality', e.target.value)}
                    className={fieldInputClass()}
                  />
                </div>
                <div>
                  <FieldLabel label="Marital Status" />
                  <select
                    value={normalizeMaritalStatus(form.personal.maritalStatus)}
                    onChange={e => updatePersonal('maritalStatus', e.target.value)}
                    className={fieldInputClass()}
                  >
                    <option value="">Select</option>
                    {MARITAL_STATUSES.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Father Name" />
                  <input
                    value={form.personal.fatherName}
                    onChange={e => updatePersonal('fatherName', e.target.value)}
                    className={fieldInputClass()}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <FieldLabel label="Mother Name" />
                  <input
                    value={form.personal.motherName}
                    onChange={e => updatePersonal('motherName', e.target.value)}
                    className={fieldInputClass()}
                  />
                </div>
              </div>
          </SectionCard>
        );
      case 1:
        return (
          <SectionCard title="Address Details" subtitle="Add your current and permanent address details.">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="Current Address" required />
                  <textarea
                    rows={2}
                    value={form.address.currentAddress}
                    onChange={e => updateAddress('currentAddress', e.target.value)}
                    className={fieldInputClass(Boolean(errors.currentAddress))}
                  />
                  {errors.currentAddress && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.currentAddress}</p>}
                </div>
                <div>
                  <FieldLabel label="Permanent Address" />
                  <textarea
                    rows={2}
                    value={form.address.permanentAddress}
                    onChange={e => updateAddress('permanentAddress', e.target.value)}
                    className={fieldInputClass()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <FieldLabel label="City" required />
                  <input
                    value={form.address.city}
                    onChange={e => updateAddress('city', e.target.value)}
                    className={fieldInputClass(Boolean(errors.city))}
                  />
                  {errors.city && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.city}</p>}
                </div>
                <div>
                  <FieldLabel label="District" />
                  <input
                    value={form.address.district}
                    onChange={e => updateAddress('district', e.target.value)}
                    className={fieldInputClass()}
                  />
                </div>
                <div>
                  <FieldLabel label="State" required />
                  <input
                    value={form.address.state}
                    onChange={e => updateAddress('state', e.target.value)}
                    className={fieldInputClass(Boolean(errors.state))}
                  />
                  {errors.state && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.state}</p>}
                </div>
                <div>
                  <FieldLabel label="Country" required />
                  <input
                    value={form.address.country}
                    onChange={e => updateAddress('country', e.target.value)}
                    className={fieldInputClass(Boolean(errors.country))}
                  />
                  {errors.country && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.country}</p>}
                </div>
                <div>
                  <FieldLabel label="PIN Code" required />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={form.address.pinCode}
                    placeholder="e.g. 560001"
                    onChange={e => {
                      const pin = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      updateAddress('pinCode', pin);
                      if (!pin.trim()) {
                        setForm(prev => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            city: '',
                            district: '',
                            state: '',
                            country: 'India'
                          }
                        }));
                        return;
                      }
                      const offline = getOfflinePostalInfo(pin);
                      if (offline) {
                        setForm(prev => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            city: offline.city,
                            district: offline.district,
                            state: offline.state,
                            country: offline.country
                          }
                        }));
                      }
                      if (pin.replace(/\D/g, '').length >= 4) {
                        lookupPostalCode(pin).then(info => {
                          if (info) {
                            setForm(prev => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                city: info.city || prev.address.city,
                                district: info.district || prev.address.district,
                                state: info.state || prev.address.state,
                                country: info.country || prev.address.country
                              }
                            }));
                          }
                        });
                      }
                    }}
                    className={`${fieldInputClass(Boolean(errors.pinCode))} font-mono`}
                  />
                  {errors.pinCode && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.pinCode}</p>}
                </div>
              </div>
            </div>
          </SectionCard>
        );
      case 2:
        return (
          <SectionCard title="Education" subtitle={`Add one or more qualification records for ${staffCategory === 'Teacher' ? 'teaching staff' : 'non-teaching staff'}.`}>
            <div className="space-y-3">
              {form.education.map((row, index) => (
                <div key={row.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-slate-900 dark:text-white">Qualification {index + 1}</p>
                    <div className="flex items-center gap-2">
                      {form.education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducationRow(row.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <FieldLabel label="Highest Qualification" required />
                      <input
                        value={row.highestQualification}
                        onChange={e => updateEducation(row.id, { highestQualification: e.target.value })}
                        className={fieldInputClass(index === 0 && Boolean(errors['education.highestQualification']))}
                      />
                      {index === 0 && errors['education.highestQualification'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['education.highestQualification']}</p>}
                    </div>
                    <div>
                      <FieldLabel label="University / Board" required />
                      <input
                        value={row.university}
                        onChange={e => updateEducation(row.id, { university: e.target.value })}
                        className={fieldInputClass(index === 0 && Boolean(errors['education.university']))}
                      />
                      {index === 0 && errors['education.university'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['education.university']}</p>}
                    </div>
                    <div>
                      <FieldLabel label="Year" required />
                      <input
                        value={row.year}
                        onChange={e => updateEducation(row.id, { year: e.target.value })}
                        className={fieldInputClass(index === 0 && Boolean(errors['education.year']))}
                      />
                      {index === 0 && errors['education.year'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['education.year']}</p>}
                    </div>
                    <div>
                      <FieldLabel label="Percentage" required />
                      <input
                        value={row.percentage}
                        onChange={e => updateEducation(row.id, { percentage: e.target.value })}
                        className={fieldInputClass(index === 0 && Boolean(errors['education.percentage']))}
                      />
                      {index === 0 && errors['education.percentage'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['education.percentage']}</p>}
                    </div>
                    {staffCategory === 'Teacher' && (
                      <>
                        <div>
                          <FieldLabel label="B.Ed" />
                          <input
                            value={row.bed}
                            onChange={e => updateEducation(row.id, { bed: e.target.value })}
                            className={fieldInputClass()}
                          />
                        </div>
                        <div>
                          <FieldLabel label="M.Ed" />
                          <input
                            value={row.med}
                            onChange={e => updateEducation(row.id, { med: e.target.value })}
                            className={fieldInputClass()}
                          />
                        </div>
                        <div>
                          <FieldLabel label="Ph.D" />
                          <input
                            value={row.phd}
                            onChange={e => updateEducation(row.id, { phd: e.target.value })}
                            className={fieldInputClass()}
                          />
                        </div>
                        <div>
                          <FieldLabel label="Specialization" />
                          <input
                            value={row.specialization}
                            onChange={e => updateEducation(row.id, { specialization: e.target.value })}
                            className={fieldInputClass()}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addEducationRow}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Qualification
              </button>
            </div>
          </SectionCard>
        );
      case 3:
        return (
          <SectionCard title="Experience" subtitle="Add previous organization or school details if applicable.">
            <div className="space-y-3">
              {form.experience.map((row, index) => (
                <div key={row.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-slate-900 dark:text-white">Experience Record {index + 1}</p>
                    {form.experience.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperienceRow(row.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <FieldLabel label="Total Experience" />
                      <input
                        value={row.totalExperience}
                        onChange={e => updateExperience(row.id, { totalExperience: e.target.value })}
                        className={fieldInputClass()}
                        placeholder="e.g. 5 years"
                      />
                    </div>
                    <div>
                      <FieldLabel label="Previous School" />
                      <input
                        value={row.previousSchool}
                        onChange={e => updateExperience(row.id, { previousSchool: e.target.value })}
                        className={fieldInputClass()}
                      />
                    </div>
                    <div>
                      <FieldLabel label="Organization" />
                      <input
                        value={row.organization}
                        onChange={e => updateExperience(row.id, { organization: e.target.value })}
                        className={fieldInputClass()}
                      />
                    </div>
                    <div>
                      <FieldLabel label="Designation" />
                      <input
                        value={row.designation}
                        onChange={e => updateExperience(row.id, { designation: e.target.value })}
                        className={fieldInputClass()}
                      />
                    </div>
                    <div>
                      <FieldLabel label="Joining Date" />
                      <input
                        type="date"
                        max={row.relievingDate || new Date().toISOString().split('T')[0]}
                        value={row.joiningDate}
                        onChange={e => {
                          const val = e.target.value;
                          const today = new Date().toISOString().split('T')[0];
                          if (val && val > today) {
                            addToast('warning', 'Invalid Date', 'Joining date cannot be in the future.');
                            return;
                          }
                          updateExperience(row.id, { joiningDate: val });
                        }}
                        className={fieldInputClass()}
                      />
                    </div>
                    <div>
                      <FieldLabel label="Relieving Date" />
                      <input
                        type="date"
                        min={row.joiningDate || undefined}
                        max={new Date().toISOString().split('T')[0]}
                        value={row.relievingDate}
                        onChange={e => {
                          const val = e.target.value;
                          const today = new Date().toISOString().split('T')[0];
                          if (val && val > today) {
                            addToast('warning', 'Invalid Date', 'Relieving date cannot be in the future.');
                            return;
                          }
                          updateExperience(row.id, { relievingDate: val });
                        }}
                        className={fieldInputClass()}
                      />
                    </div>
                    <div className="sm:col-span-2 md:col-span-3">
                      <FieldLabel label="Experience Certificate Upload" />
                      <label className="mt-1 block cursor-pointer">
                        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs hover:border-sky-500 transition-colors">
                          <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                            {row.certificate ? row.certificate.fileName : 'Upload previous employment certificate (PDF or Image)'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={e => setFileFromInput('experience', row.id, e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addExperienceRow}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Experience
              </button>
            </div>
          </SectionCard>
        );
      case 4:
        return (
          <SectionCard title="Bank Details" subtitle="Enter the account where your salary will be credited.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <FieldLabel label="Account Holder Name" required />
                <input
                  value={form.bank.accountHolderName}
                  onChange={e => updateBank('accountHolderName', e.target.value)}
                  className={fieldInputClass(Boolean(errors['bank.accountHolderName']))}
                />
                {errors['bank.accountHolderName'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['bank.accountHolderName']}</p>}
              </div>
              <div>
                <FieldLabel label="Bank Name" required />
                <input
                  value={form.bank.bankName}
                  onChange={e => updateBank('bankName', e.target.value)}
                  className={fieldInputClass(Boolean(errors['bank.bankName']))}
                />
                {errors['bank.bankName'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['bank.bankName']}</p>}
              </div>
              <div>
                <FieldLabel label="Branch" required />
                <input
                  value={form.bank.branch}
                  onChange={e => updateBank('branch', e.target.value)}
                  className={fieldInputClass(Boolean(errors['bank.branch']))}
                />
                {errors['bank.branch'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['bank.branch']}</p>}
              </div>
              <div>
                <FieldLabel label="Account Number" required />
                <input
                  value={form.bank.accountNumber}
                  onChange={e => updateBank('accountNumber', e.target.value)}
                  className={`${fieldInputClass(Boolean(errors['bank.accountNumber']))} font-mono`}
                />
                {errors['bank.accountNumber'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['bank.accountNumber']}</p>}
              </div>
              <div>
                <FieldLabel label="Confirm Account Number" required />
                <input
                  value={form.bank.confirmAccountNumber}
                  onChange={e => updateBank('confirmAccountNumber', e.target.value)}
                  className={`${fieldInputClass(Boolean(errors['bank.confirmAccountNumber']))} font-mono`}
                />
                {errors['bank.confirmAccountNumber'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['bank.confirmAccountNumber']}</p>}
              </div>
              <div>
                <FieldLabel label="IFSC Code" required />
                <input
                  value={form.bank.ifscCode}
                  onChange={e => updateBank('ifscCode', e.target.value.toUpperCase())}
                  className={`${fieldInputClass(Boolean(errors['bank.ifscCode']))} font-mono uppercase`}
                />
                {errors['bank.ifscCode'] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors['bank.ifscCode']}</p>}
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <FieldLabel label="UPI ID" />
                <input
                  value={form.bank.upiId}
                  onChange={e => updateBank('upiId', e.target.value)}
                  className={fieldInputClass()}
                  placeholder="e.g. name@okhdfcbank"
                />
              </div>
            </div>
          </SectionCard>
        );
      case 5:
        return (
          <SectionCard title="Documents" subtitle="Upload only the documents required for your staff category.">
            <div className="space-y-2.5">
              {form.documents.map(doc => (
                <div key={doc.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{doc.label}</p>
                      <p className="text-[11px] text-slate-500">{doc.required ? 'Required document' : 'Optional document'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-colors shadow-2xs">
                        <Upload className="h-3.5 w-3.5" />
                        {doc.file ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          accept={doc.label.toLowerCase().includes('photo') || doc.label.toLowerCase().includes('profile picture') ? 'image/*' : '.pdf,image/*'}
                          className="hidden"
                          onChange={e => {
                            const selected = e.target.files?.[0];
                            if (!selected) return;
                            const snapshot = fileSnapshot(selected);
                            updateDocument(doc.id, snapshot);
                            const isPhoto = doc.label.toLowerCase().includes('profile picture') ||
                              doc.label.toLowerCase().includes('passport photo') ||
                              doc.label.toLowerCase().includes('photo');
                            if (isPhoto) {
                              handleProfilePhotoUploaded(selected, snapshot, doc.id);
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
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs">
                      <span className="truncate font-semibold text-slate-700 dark:text-slate-200 text-[11px]">{doc.file.fileName}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{doc.file.uploadedDate}</span>
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
          <SectionCard title="Review & Submit" subtitle="Verify all details before completing your profile.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal Details</p>
                <div className="mt-1.5 space-y-0.5 text-xs">
                  <p className="font-extrabold text-slate-900 dark:text-white truncate">{fullName || 'Name not provided'}</p>
                  <p className="text-slate-500">{form.personal.gender || 'Gender N/A'} • {form.personal.dob || 'DOB N/A'}</p>
                  <p className="text-slate-500">{form.personal.mobile || 'Phone N/A'}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address Details</p>
                <div className="mt-1.5 space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                  <p className="truncate font-semibold">{form.address.currentAddress || 'Address not provided'}</p>
                  <p className="text-slate-500">{[form.address.city, form.address.state, form.address.pinCode].filter(Boolean).join(', ') || 'Location N/A'}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Qualifications</p>
                <p className="mt-1.5 text-xs font-extrabold text-slate-900 dark:text-white">{totalQualificationRows} record(s)</p>
                <p className="text-[11px] text-slate-500 truncate">{form.education[0]?.highestQualification || 'None provided'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience</p>
                <p className="mt-1.5 text-xs font-extrabold text-slate-900 dark:text-white">{totalExperienceYears || 0} years</p>
                <p className="text-[11px] text-slate-500">{form.experience.length} previous record(s)</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bank Details</p>
                <p className="mt-1.5 text-xs font-extrabold text-slate-900 dark:text-white truncate">{form.bank.bankName || 'Bank not provided'}</p>
                <p className="text-[11px] text-slate-500 truncate">{form.bank.accountHolderName ? `A/C: ${form.bank.accountHolderName}` : 'A/C N/A'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Documents</p>
                <p className="mt-1.5 text-xs font-extrabold text-slate-900 dark:text-white">{uploadedRequiredCount} / {requiredDocuments.length} uploaded</p>
                <p className="text-[11px] text-slate-500">Required docs status</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Detailed Qualifications</p>
                <div className="mt-1.5">{renderEducationSummary()}</div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Detailed Experience</p>
                <div className="mt-1.5">{renderExperienceSummary()}</div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Document Uploads Status</p>
                <div className="mt-1.5 space-y-1.5">
                  {form.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{doc.label}</p>
                        <p className="text-[10px] text-slate-400">{doc.file ? doc.file.fileName : 'Not uploaded'}</p>
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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-3 py-4 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-3 animate-in fade-in">
        {/* Navigation Arrow to Dashboard */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onComplete?.()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Go to Dashboard</span>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 shadow-sm overflow-hidden">
          {/* Header & Steps */}
          <div className="border-b border-slate-200/80 dark:border-slate-800 px-4 py-3.5 sm:px-5 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/40">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Complete Your Profile</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Fill in your personal, academic, banking, and document details.
                </p>
              </div>

              {/* Progress Summary Pill */}
              <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Progress</div>
                  <div className="text-xs font-black text-sky-600 dark:text-sky-400">{Math.round(progress)}% Complete</div>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                <Badge variant={staffCategory === 'Teacher' ? 'success' : 'neutral'} size="sm">
                  {uploadedRequiredCount} / {requiredDocuments.length} docs
                </Badge>
              </div>
            </div>

            {/* Stepper Buttons Bar */}
            <div className="mt-3 overflow-x-auto no-scrollbar">
              <div className="grid min-w-[680px] grid-cols-7 gap-1.5 sm:gap-2">
                {stepMeta.map((step, index) => {
                  const isActive = currentStep === index;
                  const isComplete = currentStep > index;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setCurrentStep(index)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-center transition-all cursor-pointer ${
                        isActive
                          ? 'border-sky-500 bg-sky-50/80 text-sky-700 dark:border-sky-500 dark:bg-sky-950/60 dark:text-sky-300 font-bold shadow-2xs ring-1 ring-sky-500/20'
                          : isComplete
                            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold'
                            : 'border-slate-200 bg-white/70 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 font-medium'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-colors ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : isComplete
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {isComplete ? <Check className="w-3 h-3 stroke-[2.5]" /> : index + 1}
                      </div>
                      <span className="text-xs truncate">{step.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slim gradient progress line */}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Form Body */}
          <div className="p-4 sm:p-5 space-y-4">
            {renderStepContent()}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-3.5">
              <button
                type="button"
                onClick={movePrevious}
                disabled={currentStep === 0 || loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                {currentStep < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={moveNext}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-black text-white shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{loading ? 'Submitting...' : 'Submit Profile'}</span>
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
