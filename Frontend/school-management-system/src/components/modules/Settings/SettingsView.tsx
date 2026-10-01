import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Settings as SettingsIcon,
  Save,
  Database,
  Activity,
  RefreshCw,
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  MapPin,
  Phone,
  Mail,
  X,
  Calendar,
  CheckCircle2,
  Award,
  FileCheck,
  Layers,
  Palette,
  ShieldCheck,
  FileText,
  Check,
  Layout,
  User as UserIcon,
  Camera,
  Key,
  Lock,
  Upload,
  Sparkles,
  UserCheck,
  Clock,
} from "lucide-react";
import { useData } from "../../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { ConfirmModal } from "../../common/ConfirmModal";
import {
  AcademicYearMaster,
  CertificateTemplateConfig,
  Role,
  User,
} from "../../../types";
import { PrintableCertificateContainer } from "../Certificates/PrintableCertificateContainer";
import { formatDateDDMMYYYY } from "../../../utils/dateValidation";
import { resolveMediaUrl, DEFAULT_USER_AVATAR, createOptimizedAvatarDataUrl } from "../../../utils/mediaUtils";
import { validateFullName, validateEmail, validate10DigitPhone, validatePhoneNumber, sanitizePhoneInput, sanitizeEmailInput, validateCampusName, validateCampusCode } from "../../../utils/validation";
import { SchoolLogoUploader } from "./SchoolLogoUploader";
import { CertificateSettingsTab } from "./CertificateSettingsTab";
import {
  updateCampusesApi,
  updateCertificateTemplatesApi,
  fetchBranchesApi,
  createBranchApi,
  updateBranchApi,
  deleteBranchApi,
  fetchAcademicYearsApi,
  fetchIdSequenceSettingsApi,
  updateIdSequenceSettingsApi,
  addOrUpdateCustomIdFormatApi,
  deleteCustomIdFormatApi,
  fetchUserProfileApi,
  updateUserProfileApi,
  uploadUserProfileImageApi,
  saveLocalUserProfile,
} from "../../../api/settings";
import {
  CustomIdSequence,
  IdSequenceSettings,
  getIdSequenceSettings,
  saveIdSequenceSettings,
  buildPreviewId,
} from "../../../utils/idGenerator";

export interface CampusItem {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
}

const defaultCampuses: CampusItem[] = [];

const defaultCertificateTemplates: CertificateTemplateConfig[] = [
  {
    id: "TPL-TC",
    certificateType: "Transfer Certificate",
    title: "OFFICIAL TRANSFER CERTIFICATE",
    subTitle: "CBSE Affiliation No: 883012 • School Code: 40192",
    headerStyle: "Classic Double Border",
    themeColor: "#1e3a8a",
    showLogo: true,
    showSeal: true,
    signatory1: "Class Teacher Signature",
    signatory2: "Verified By (Accounts)",
    signatory3: "Principal Signature & Seal",
    customPreamble:
      "Certified that the student details listed below are verified from original school admission registers.",
    footerDisclaimer:
      "Official Transfer Certificate issued in accordance with Education Code Rules.",
  },
  {
    id: "TPL-BONAFIDE",
    certificateType: "Bonafide Certificate",
    title: "BONAFIDE STUDY CERTIFICATE",
    subTitle: "Recognized Educational Institution",
    headerStyle: "Modern Minimalist",
    themeColor: "#065f46",
    showLogo: true,
    showSeal: true,
    signatory1: "Class Teacher",
    signatory2: "Administrative Officer",
    signatory3: "Headmaster / Principal",
    customPreamble:
      "This is to certify that the student is a genuine student studying in our institution.",
    footerDisclaimer:
      "Valid for official passport, bank, or scholarship verification.",
  },
  {
    id: "TPL-CONDUCT",
    certificateType: "Character Certificate",
    title: "CHARACTER & CONDUCT CERTIFICATE",
    subTitle: "General Student Conduct Evaluation",
    headerStyle: "Executive Slate",
    themeColor: "#1e293b",
    showLogo: true,
    showSeal: true,
    signatory1: "Counselor / Class Teacher",
    signatory2: "Vice Principal",
    signatory3: "Principal",
    customPreamble:
      "Certified that the student bears exemplary moral character and satisfactory conduct.",
    footerDisclaimer:
      "Issued upon student or parent request for higher studies.",
  },
  {
    id: "TPL-LEAVING",
    certificateType: "Leaving Certificate",
    title: "SCHOOL LEAVING CERTIFICATE",
    subTitle: "Secondary Education Departure Record",
    headerStyle: "Classic Double Border",
    themeColor: "#991b1b",
    showLogo: true,
    showSeal: true,
    signatory1: "Class Teacher",
    signatory2: "Registrar",
    signatory3: "Principal",
    customPreamble:
      "Certified that the student has completed course work and departed the institution.",
    footerDisclaimer: "Official leaving record for board verification.",
  },
  {
    id: "TPL-MERIT",
    certificateType: "Merit Certificate",
    title: "CERTIFICATE OF ACADEMIC EXCELLENCE",
    subTitle: "Awarded for Outstanding Academic Performance",
    headerStyle: "Royal Gold Crest",
    themeColor: "#92400e",
    showLogo: true,
    showSeal: true,
    signatory1: "Academic Coordinator",
    signatory2: "Exam Controller",
    signatory3: "Principal",
    customPreamble:
      "In recognition of stellar academic achievements and exemplary effort.",
    footerDisclaimer:
      "Honorary academic award presented at annual convocation.",
  },
  {
    id: "TPL-SPORTS",
    certificateType: "Sports Certificate",
    title: "CERTIFICATE OF SPORTS ACHIEVEMENT",
    subTitle: "Annual Inter-School Athletics Championship",
    headerStyle: "Modern Minimalist",
    themeColor: "#0284c7",
    showLogo: true,
    showSeal: true,
    signatory1: "Physical Education Director",
    signatory2: "Sports Coordinator",
    signatory3: "Principal",
    customPreamble:
      "Presented for outstanding sportsmanship and championship performance.",
    footerDisclaimer: "Official sports recognition certificate.",
  },
];

const TIME_DROPDOWN_OPTIONS = [
  "06:00 AM", "06:15 AM", "06:30 AM", "06:45 AM",
  "07:00 AM", "07:15 AM", "07:30 AM", "07:45 AM",
  "08:00 AM", "08:15 AM", "08:30 AM", "08:45 AM",
  "09:00 AM", "09:15 AM", "09:30 AM", "09:45 AM",
  "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
  "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
  "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
  "01:00 PM", "01:15 PM", "01:30 PM", "01:45 PM",
  "02:00 PM", "02:15 PM", "02:30 PM", "02:45 PM",
  "03:00 PM", "03:15 PM", "03:30 PM", "03:45 PM",
  "04:00 PM", "04:15 PM", "04:30 PM", "04:45 PM",
  "05:00 PM", "05:15 PM", "05:30 PM", "05:45 PM",
  "06:00 PM", "06:15 PM", "06:30 PM", "06:45 PM",
  "07:00 PM", "07:15 PM", "07:30 PM", "07:45 PM",
  "08:00 PM", "08:15 PM", "08:30 PM", "08:45 PM",
  "09:00 PM", "09:15 PM", "09:30 PM", "09:45 PM",
  "10:00 PM"
];

const time12To24 = (timeStr: string): string => {
  if (!timeStr) return '';
  if (!timeStr.includes('AM') && !timeStr.includes('PM')) return timeStr;
  const parts = timeStr.trim().split(' ');
  const [hStr, mStr] = parts[0].split(':');
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr || '0', 10);
  if (parts.length > 1) {
    const ampm = parts[1].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const time24To12 = (time24: string): string => {
  if (!time24) return '';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  const [hStr, mStr] = time24.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr || '0', 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

export const SettingsView: React.FC = () => {
  const {
    schoolProfile,
    updateSchoolProfile,
    auditLogs,
    academicYears,
    addAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setCurrentAcademicYear,
    certificateTemplates: contextTemplates,
    updateCertificateTemplate: contextUpdateTemplate,
    branches = [],
  } = useData();
  const { user, setUser, role, changePassword } = useAuth();
  const { addToast } = useToast();

  const isAdminOrSuperAdmin = role === "Admin" || role === "Super Admin";

  const [profileForm, setProfileForm] = useState(schoolProfile);
  useEffect(() => {
    setProfileForm(schoolProfile);
  }, [schoolProfile]);
  const [activeTab, setActiveTab] = useState<
    | "my-profile"
    | "profile"
    | "campus"
    | "academic-year"
    | "certificates"
    | "automated-ids"
    | "backup"
    | "audit"
  >(() => {
    const saved = localStorage.getItem("settings_active_tab");
    if (saved) {
      localStorage.removeItem("settings_active_tab");
      return saved as any;
    }
    return "my-profile";
  });

  useEffect(() => {
    const handleTabChange = (e: any) => {
      const targetTab = e?.detail?.tab || localStorage.getItem("settings_active_tab");
      if (targetTab) {
        setActiveTab(targetTab as any);
        localStorage.removeItem("settings_active_tab");
      }
    };
    window.addEventListener("settings_tab_change", handleTabChange);
    return () => {
      window.removeEventListener("settings_tab_change", handleTabChange);
    };
  }, []);

  // Personal Profile Details State for Logged-In User (Warden / Admin)
  const getCleanUserEmail = (raw?: string): string => {
    return (raw || user?.email || "").trim();
  };

  const [myProfileForm, setMyProfileForm] = useState({
    name: user?.name || "Administrator",
    email: getCleanUserEmail(user?.email),
    phone: user?.phone || "+91 9581768555",
    avatar: user?.avatar || DEFAULT_USER_AVATAR,
    branch: user?.branch || "",
    role: user?.role || role || "Admin",
  });

  const configuredBranches = useMemo(() => {
    const list = (branches || [])
      .map((b: any) => (typeof b === "string" ? b : (b.name || b.branchName || b.branch || b.code)))
      .filter(Boolean);
    if (myProfileForm.branch && !list.includes(myProfileForm.branch)) {
      list.push(myProfileForm.branch);
    }
    if (user?.branch && !list.includes(user.branch)) {
      list.push(user.branch);
    }
    return Array.from(new Set(list));
  }, [branches, myProfileForm.branch, user?.branch]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const validateProfileForm = (form: { name: string; email: string; phone: string }) => {
    const nameRes = validateFullName(form.name, true);
    const emailRes = validateEmail(form.email, true);
    const phoneRes = validatePhoneNumber(form.phone, false);

    const errors: { name?: string; email?: string; phone?: string } = {};
    if (!nameRes.isValid) errors.name = nameRes.error;
    if (!emailRes.isValid) errors.email = emailRes.error;
    if (form.phone.trim() && !phoneRes.isValid) errors.phone = phoneRes.error;

    return {
      isValid: nameRes.isValid && emailRes.isValid && (!form.phone.trim() || phoneRes.isValid),
      errors,
      firstError: nameRes.error || emailRes.error || (form.phone.trim() ? phoneRes.error : undefined),
    };
  };

  const isProfileFormInvalid = useMemo(() => {
    const nameRes = validateFullName(myProfileForm.name, true);
    const emailRes = validateEmail(myProfileForm.email, true);
    const phoneRes = validatePhoneNumber(myProfileForm.phone, false);
    const phoneInvalid = myProfileForm.phone.trim() ? !phoneRes.isValid : false;

    return !nameRes.isValid || !emailRes.isValid || phoneInvalid;
  }, [myProfileForm.name, myProfileForm.email, myProfileForm.phone]);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const cleanEmail = getCleanUserEmail(user?.email);
        const res = await fetchUserProfileApi(cleanEmail);
        const data = res?.data;
        if (data && isMounted && (data.name || data.avatar)) {
          setMyProfileForm((prev) => {
            const currentAvatar = prev.avatar === "" ? "" : (prev.avatar || user?.avatar || DEFAULT_USER_AVATAR);
            return {
              ...prev,
              name: data.name || prev.name,
              phone: data.phone || prev.phone,
              avatar: currentAvatar,
              branch: data.branch || prev.branch,
              role: data.role || prev.role,
            };
          });

          if (user && setUser) {
            const currentAvatar = user.avatar || DEFAULT_USER_AVATAR;
            const updatedUser = {
              ...user,
              name: data.name || user.name,
              phone: data.phone || user.phone,
              avatar: currentAvatar,
              branch: data.branch || user.branch,
            };
            setUser(updatedUser);
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote profile:", err);
      }
    };
    if (user?.email) {
      loadProfile();
    }
    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  useEffect(() => {
    if (user) {
      const cleanEmail = getCleanUserEmail(user.email);
      setMyProfileForm((prev) => {
        const hasUploaded = prev.avatar && prev.avatar.startsWith("data:image/");
        return {
          ...prev,
          name: user.name || prev.name,
          email: cleanEmail || prev.email,
          phone: user.phone || prev.phone,
          avatar: hasUploaded ? prev.avatar : (user.avatar || prev.avatar || DEFAULT_USER_AVATAR),
          branch: user.branch || prev.branch,
          role: user.role || role || prev.role,
        };
      });
    }
  }, [user, role]);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      addToast(
        "error",
        "File Too Large",
        "Please select an image smaller than 3MB.",
      );
      return;
    }

    try {
      // 1. Optimize & resize avatar to standard 256x256 square (~20KB)
      // This is instant, never exceeds localStorage quota, and never 404s or reverts!
      const optimizedDataUrl = await createOptimizedAvatarDataUrl(file, 256);

      setMyProfileForm((prev) => ({ ...prev, avatar: optimizedDataUrl }));

      const cleanEmail = getCleanUserEmail(myProfileForm.email);
      const updatedUser: User = {
        ...user!,
        id: user?.id || "USR-001",
        name: myProfileForm.name.trim() || user?.name || "Administrator",
        email: cleanEmail,
        phone: myProfileForm.phone.trim() || user?.phone || "+91 9581768555",
        avatar: optimizedDataUrl,
        branch: myProfileForm.branch || user?.branch || "",
        role: (user?.role || role) as Role,
        status: user?.status || "Active",
      };

      if (setUser) {
        setUser(updatedUser);
      }

      // Persist to user-scoped storage so it never disappears
      saveLocalUserProfile(
        {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: optimizedDataUrl,
          branch: updatedUser.branch,
          role: updatedUser.role,
        },
        updatedUser.email
      );

      addToast(
        "success",
        "Photo Updated",
        "Profile photo updated successfully. Click 'Save Basic Details' to apply all changes.",
      );

      // In background, also attempt server upload if backend endpoint is available
      uploadUserProfileImageApi(file).catch((err) => {
        console.warn("Background upload note:", err);
      });
    } catch (err: any) {
      console.error("Failed to process profile image:", err);
      addToast("error", "Upload Failed", "Could not process selected image.");
    }
  };

  const handleSaveMyProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, errors, firstError } = validateProfileForm(myProfileForm);
    setProfileErrors(errors);

    if (!isValid) {
      addToast(
        "error",
        "Validation Error",
        firstError || "Please correct the invalid profile fields before saving.",
      );
      return;
    }

    const cleanEmail = getCleanUserEmail(myProfileForm.email);

    setIsSavingProfile(true);
    try {
      const payload = {
        name: myProfileForm.name.trim(),
        email: cleanEmail,
        phone: myProfileForm.phone.trim(),
        avatar: myProfileForm.avatar,
        branch: myProfileForm.branch,
        role: myProfileForm.role || (user?.role || role || "Admin"),
        status: "Active Account",
      };

      const res = await updateUserProfileApi(payload);
      const savedData = res?.data || payload;
      const finalAvatar = (myProfileForm.avatar && myProfileForm.avatar !== DEFAULT_USER_AVATAR)
        ? myProfileForm.avatar
        : DEFAULT_USER_AVATAR;

      const updatedUser: User = {
        ...user!,
        id: user?.id || "USR-001",
        name: myProfileForm.name.trim(),
        email: cleanEmail,
        phone: myProfileForm.phone.trim(),
        avatar: finalAvatar,
        branch: myProfileForm.branch,
        role: (user?.role || role) as Role,
        status: user?.status || "Active",
      };

      if (setUser) {
        setUser(updatedUser);
      }

      saveLocalUserProfile(
        {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: finalAvatar,
          branch: updatedUser.branch,
          role: updatedUser.role,
        },
        cleanEmail
      );

      setMyProfileForm((prev) => ({
        ...prev,
        email: cleanEmail,
        avatar: finalAvatar,
      }));

      addToast(
        "success",
        "Profile Saved",
        "Your basic details and profile photo have been saved successfully.",
      );
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      addToast("error", "Save Failed", err?.message || "Failed to save profile details.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Security Form State
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [idForm, setIdForm] = useState<IdSequenceSettings>(() => getIdSequenceSettings());

  useEffect(() => {
    let isMounted = true;
    const loadIdSequenceSettings = async () => {
      try {
        const res = await fetchIdSequenceSettingsApi();
        if (res && res.success && res.data && isMounted) {
          setIdForm(prev => {
            const merged = { ...prev, ...res.data };
            saveIdSequenceSettings(merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn("Could not fetch remote ID sequence settings:", err);
      }
    };
    loadIdSequenceSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.newPassword || passForm.newPassword.length < 4) {
      addToast("warning", "Password Weak", "Password must be at least 4 characters.");
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      addToast("error", "Mismatch", "New password and confirmation do not match.");
      return;
    }
    if (changePassword) {
      const isSuccess = await changePassword(passForm.currentPassword, passForm.newPassword);
      if (isSuccess) {
        addToast("success", "Password Changed", "Your password has been updated successfully.");
        setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        addToast("error", "Error", "Failed to update password. Check current password.");
      }
    } else {
      addToast("success", "Password Updated", "Password updated successfully.");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  const handleAddCustomIdSequence = async () => {
    const newSeq: CustomIdSequence = {
      id: `custom_${Date.now()}`,
      name: `Custom Format ${(idForm.customSequences || []).length + 1}`,
      prefix: "CUST",
      startNo: 101,
      padding: 4,
      includeYear: true,
      separator: "-",
      position: "start",
    };

    const nextForm = {
      ...idForm,
      customSequences: [...(idForm.customSequences || []), newSeq],
    };

    setIdForm(nextForm);
    saveIdSequenceSettings(nextForm);
    addToast("success", "Custom Sequence Added", "New custom sequence format added.");

    try {
      await addOrUpdateCustomIdFormatApi(newSeq);
      addToast("success", "Custom ID Format Added", `Added format ${newSeq.name}`);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpdateCustomSequence = (id: string, updates: Partial<CustomIdSequence>) => {
    const nextSequences = (idForm.customSequences || []).map(seq =>
      seq.id === id ? { ...seq, ...updates } : seq
    );
    const nextForm = {
      ...idForm,
      customSequences: nextSequences,
    };
    setIdForm(nextForm);
    saveIdSequenceSettings(nextForm);
    const updated = nextSequences.find(s => s.id === id);
    if (updated) {
      addOrUpdateCustomIdFormatApi(updated).catch(console.error);
    }
  };

  const handleDeleteCustomIdSequence = async (id: string) => {
    const nextSequences = (idForm.customSequences || []).filter(seq => seq.id !== id);
    const nextForm = {
      ...idForm,
      customSequences: nextSequences,
    };
    setIdForm(nextForm);
    saveIdSequenceSettings(nextForm);
    try {
      await deleteCustomIdFormatApi(id);
      addToast("info", "Custom Format Deleted", "Custom ID sequence format removed.");
    } catch (err: any) {
      console.error(err);
    }
  };

  // Academic Year Configuration States
  const [aySearch, setAySearch] = useState("");
  const [isAYModalOpen, setIsAYModalOpen] = useState(false);
  const [editingAY, setEditingAY] = useState<AcademicYearMaster | null>(null);
  const [deletingAY, setDeletingAY] = useState<AcademicYearMaster | null>(null);
  const [ayErrors, setAyErrors] = useState<{ academicYear?: string; status?: string }>({});
  const [ayForm, setAyForm] = useState<{
    academicYear: string;
    startDate: string;
    endDate: string;
    status: "Active" | "Closed" | "Upcoming" | "";
    description: string;
    isCurrentAcademicYear: boolean;
  }>({
    academicYear: "",
    startDate: "",
    endDate: "",
    status: "",
    description: "",
    isCurrentAcademicYear: false,
  });

  // Campus Configuration States
  const [campuses, setCampuses] = useState<CampusItem[]>([]);

  const [campusSearch, setCampusSearch] = useState("");
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<CampusItem | null>(null);
  const [deletingCampus, setDeletingCampus] = useState<CampusItem | null>(null);
  const [campusErrors, setCampusErrors] = useState<{ name?: string; code?: string; phone?: string; email?: string; status?: string }>({});
  const [schoolProfileErrors, setSchoolProfileErrors] = useState<{ name?: string; email?: string; principalName?: string }>({});

  const [campusForm, setCampusForm] = useState<{
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    status: "Active" | "Inactive" | "";
  }>({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    status: "",
  });

  // Certificate Template Configuration States
  const certificateTemplates = useMemo(() => {
    if (
      Array.isArray(contextTemplates) &&
      contextTemplates.length > 0 &&
      contextTemplates[0]?.certificateType &&
      contextTemplates[0]?.title
    ) {
      return contextTemplates;
    }
    try {
      const saved = localStorage.getItem("edu_db_certificate_templates");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed[0]?.certificateType &&
          parsed[0]?.title
        ) {
          return parsed;
        }
      }
    } catch (e) {}
    return defaultCertificateTemplates;
  }, [contextTemplates]);

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<string>("TPL-TC");

  // Currently Selected Certificate Template
  const currentTemplate = useMemo(() => {
    const found = certificateTemplates.find((t) => t.id === selectedTemplateId);
    return found || certificateTemplates[0] || defaultCertificateTemplates[0];
  }, [certificateTemplates, selectedTemplateId]);

  // Sync campuses to backend and trigger Header sync event
  const syncCampuses = async (updated: CampusItem[]) => {
    setCampuses(updated);
    window.dispatchEvent(new Event("branches_updated"));

    try {
      await updateCampusesApi(updated);
    } catch (err) {
      console.warn("Failed to sync campuses to backend database:", err);
    }
  };

  const handleSaveProfile = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!profileForm.name || !profileForm.name.trim()) {
      setSchoolProfileErrors((prev) => ({ ...prev, name: "School name is required." }));
      addToast("error", "School Name Required", "Please enter the school name.");
      return;
    }
    const nameRes = validateFullName(profileForm.name, true);
    if (!nameRes.isValid) {
      setSchoolProfileErrors((prev) => ({ ...prev, name: nameRes.error }));
      addToast("error", "Invalid School Name", nameRes.error || "Enter a valid school name.");
      return;
    }

    if (!profileForm.address || !profileForm.address.trim()) {
      addToast("error", "Address Required", "Please enter the full address.");
      return;
    }

    if (!profileForm.phone || !profileForm.phone.trim()) {
      addToast("error", "Contact Phone Required", "Please enter a 10-digit contact phone number.");
      return;
    }
    const phoneRes = validatePhoneNumber(profileForm.phone, true);
    if (!phoneRes.isValid) {
      addToast("error", "Invalid Phone Number", phoneRes.error || "Phone number must be exactly 10 digits.");
      return;
    }

    if (!profileForm.email || !profileForm.email.trim()) {
      setSchoolProfileErrors((prev) => ({ ...prev, email: "Contact email is required." }));
      addToast("error", "Contact Email Required", "Please enter the contact email address.");
      return;
    }
    const emailRes = validateEmail(profileForm.email, true);
    if (!emailRes.isValid) {
      setSchoolProfileErrors((prev) => ({ ...prev, email: emailRes.error }));
      addToast("error", "Invalid Email", emailRes.error || "Enter a valid email address.");
      return;
    }

    if (!profileForm.principalName || !profileForm.principalName.trim()) {
      setSchoolProfileErrors((prev) => ({ ...prev, principalName: "Principal name is required." }));
      addToast("error", "Principal Name Required", "Please enter the principal name.");
      return;
    }
    const pNameRes = validateFullName(profileForm.principalName, true);
    if (!pNameRes.isValid) {
      setSchoolProfileErrors((prev) => ({ ...prev, principalName: pNameRes.error }));
      addToast("error", "Invalid Principal Name", pNameRes.error || "Enter a valid principal name.");
      return;
    }

    updateSchoolProfile(profileForm);
    try {
      localStorage.setItem("edu_db_profile", JSON.stringify(profileForm));
      localStorage.setItem("profile", JSON.stringify(profileForm));
      const logoVal = profileForm.logoUrl ?? "";
      localStorage.setItem("school_logo", logoVal);
      localStorage.setItem("logoUrl", logoVal);
      localStorage.setItem("schoolLogo", logoVal);
    } catch (err) {}
    window.dispatchEvent(new Event("school_profile_updated"));
    addToast(
      "success",
      "Settings Saved",
      "School branding profile updated successfully.",
    );
  };

  const handleUpdateTemplate = (
    updatedFields: Partial<CertificateTemplateConfig>,
  ) => {
    if (!currentTemplate) return;
    if (contextUpdateTemplate) {
      contextUpdateTemplate(currentTemplate.id, updatedFields);
    }
  };

  const handleSaveCertificateTemplates = async () => {
    localStorage.setItem(
      "edu_db_certificate_templates",
      JSON.stringify(certificateTemplates),
    );
    addToast(
      "success",
      "Certificate Template Configured",
      `Saved layout and branding configurations for ${currentTemplate?.certificateType || "all certificates"}.`,
    );

    try {
      await updateCertificateTemplatesApi(certificateTemplates);
    } catch (err) {
      console.warn(
        "Failed to sync certificate templates to backend database:",
        err,
      );
    }
  };

  const handleOpenAddCampus = () => {
    setEditingCampus(null);
    setCampusErrors({});
    setCampusForm({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      status: "",
    });
    setIsCampusModalOpen(true);
  };

  const handleOpenEditCampus = (campus: CampusItem) => {
    setEditingCampus(campus);
    setCampusErrors({});
    setCampusForm({
      name: campus.name,
      code: campus.code,
      address: campus.address,
      phone: campus.phone,
      email: campus.email,
      status: campus.status,
    });
    setIsCampusModalOpen(true);
  };

  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const res: any = await fetchBranchesApi();
        if (res?.success && Array.isArray(res.data)) {
          setCampuses(res.data);
          window.dispatchEvent(new Event("branches_updated"));
        }
      } catch (err) {
        console.warn("Backend branches load notice:", err);
      }

      try {
        const ayRes: any = await fetchAcademicYearsApi();
        if (
          ayRes?.success &&
          Array.isArray(ayRes.data)
        ) {
          localStorage.setItem(
            "edu_db_academic_years",
            JSON.stringify(ayRes.data),
          );
          localStorage.setItem(
            "academic_years",
            JSON.stringify(ayRes.data),
          );
          window.dispatchEvent(new Event("academic_years_updated"));
        }
      } catch (err) {
        console.warn("Backend academic years load notice:", err);
      }
    };
    loadBackendData();
  }, []);

  const handleSaveCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name.trim() || !campusForm.code.trim()) return;

    const campusNameRes = validateCampusName(campusForm.name, true);
    if (!campusNameRes.isValid) {
      setCampusErrors((prev) => ({ ...prev, name: campusNameRes.error }));
      addToast("error", "Invalid Campus Name", campusNameRes.error || "Enter a valid campus name.");
      return;
    }

    const campusCodeRes = validateCampusCode(campusForm.code, true);
    if (!campusCodeRes.isValid) {
      setCampusErrors((prev) => ({ ...prev, code: campusCodeRes.error }));
      addToast("error", "Invalid Campus Code", campusCodeRes.error || "Campus code must be 2 to 10 characters.");
      return;
    }

    if (!campusForm.status) {
      setCampusErrors((prev) => ({ ...prev, status: "Please select a status." }));
      addToast("error", "Status Required", "Please select a status (Active or Inactive).");
      return;
    }

    if (campusForm.phone) {
      const phoneRes = validatePhoneNumber(campusForm.phone, false);
      if (!phoneRes.isValid) {
        addToast("error", "Invalid Phone Number", phoneRes.error || "Phone number must be exactly 10 digits.");
        return;
      }
    }

    if (campusForm.email) {
      const emailRes = validateEmail(campusForm.email, false);
      if (!emailRes.isValid) {
        setCampusErrors((prev) => ({ ...prev, email: emailRes.error }));
        addToast("error", "Invalid Email", emailRes.error || "Enter a valid email address.");
        return;
      }
    }

    const validStatus = campusForm.status as "Active" | "Inactive";
    const campusData = {
      ...campusForm,
      status: validStatus,
    };

    let updated: CampusItem[];
    if (editingCampus) {
      updated = campuses.map((c) =>
        c.id === editingCampus.id ? { ...editingCampus, ...campusData } : c,
      );
      addToast(
        "success",
        "Campus Updated",
        `Updated settings for ${campusForm.name}`,
      );
      try {
        await updateBranchApi(editingCampus.id, campusData);
      } catch (err) {
        console.warn("Failed to update branch on backend:", err);
      }
    } else {
      const tempId = `CMP-${Date.now().toString().slice(-4)}`;
      const newCampus: CampusItem = {
        id: tempId,
        ...campusData,
      };
      updated = [...campuses, newCampus];
      addToast(
        "success",
        "Campus Added",
        `Added new campus ${campusForm.name}`,
      );
      try {
        const res: any = await createBranchApi(campusData);
        if (res?.success && res?.data) {
          const serverId = res.data.id || `CMP-${res.data.branchId}`;
          updated = updated.map((c) =>
            c.id === tempId ? { ...c, id: serverId } : c,
          );
        }
      } catch (err) {
        console.warn("Failed to create branch on backend:", err);
      }
    }

    syncCampuses(updated);
    setIsCampusModalOpen(false);
  };

  const confirmDeleteCampus = async () => {
    if (!deletingCampus) return;
    const targetId = deletingCampus.id;
    const updated = campuses.filter((c) => c.id !== targetId);
    syncCampuses(updated);
    addToast(
      "success",
      "Campus Removed",
      `Removed ${deletingCampus.name} campus.`,
    );
    setDeletingCampus(null);

    try {
      await deleteBranchApi(targetId);
    } catch (err) {
      console.warn("Failed to delete branch on backend:", err);
    }
  };

  const handleOpenAddAY = () => {
    setEditingAY(null);
    setAyForm({
      academicYear: "",
      startDate: "",
      endDate: "",
      status: "",
      description: "",
      isCurrentAcademicYear: false,
    });
    setAyErrors({});
    setIsAYModalOpen(true);
  };

  const handleOpenEditAY = (ay: AcademicYearMaster) => {
    setEditingAY(ay);
    setAyForm({
      academicYear: ay.academicYear,
      startDate: ay.startDate || "",
      endDate: ay.endDate || "",
      status: ay.status,
      description: ay.description || "",
      isCurrentAcademicYear: ay.isCurrentAcademicYear || false,
    });
    setAyErrors({});
    setIsAYModalOpen(true);
  };

  const handleSaveAY = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ayForm.academicYear.trim()) {
      setAyErrors((prev) => ({ ...prev, academicYear: "Academic Session Name is required." }));
      addToast("error", "Academic Session Required", "Please enter academic session name.");
      return;
    }

    if (!ayForm.status) {
      setAyErrors((prev) => ({ ...prev, status: "Please select a session status." }));
      addToast("error", "Status Required", "Please select a session status (Active, Upcoming, or Closed).");
      return;
    }

    const payload = {
      ...ayForm,
      status: ayForm.status as "Active" | "Closed" | "Upcoming",
    };

    if (editingAY) {
      updateAcademicYear(editingAY.id, payload);
      addToast(
        "success",
        "Academic Year Updated",
        `Academic year ${ayForm.academicYear} configuration updated.`,
      );
    } else {
      addAcademicYear(payload);
      addToast(
        "success",
        "Academic Year Added",
        `Academic year ${ayForm.academicYear} created successfully.`,
      );
    }

    setIsAYModalOpen(false);
  };

  const confirmDeleteAY = () => {
    if (!deletingAY) return;
    deleteAcademicYear(deletingAY.id);
    addToast(
      "success",
      "Academic Year Removed",
      `Academic year ${deletingAY.academicYear} deleted.`,
    );
    setDeletingAY(null);
  };

  const filteredAcademicYears = useMemo(() => {
    return (academicYears || []).filter(
      (ay) =>
        (ay.academicYear || "")
          .toLowerCase()
          .includes(aySearch.toLowerCase()) ||
        (ay.description || "").toLowerCase().includes(aySearch.toLowerCase()) ||
        (ay.status || "").toLowerCase().includes(aySearch.toLowerCase()),
    );
  }, [academicYears, aySearch]);

  const handleBackup = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `school_backup_${new Date().toISOString().split("T")[0]}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast("success", "Backup Exported", "Downloaded database JSON backup");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Settings Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50">
          <SettingsIcon className="w-6 h-6 text-[#0088cc] dark:text-sky-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          School Settings
        </h2>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="p-1 bg-white dark:bg-slate-900 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-sky-200/90 dark:border-sky-850/80 shadow-xs">
        {[
          {
            id: "my-profile",
            label: "My Profile",
            visible: true,
          },
          {
            id: "profile",
            label: "School Branding Profile",
            visible: isAdminOrSuperAdmin,
          },
          {
            id: "campus",
            label: "Campus Configuration",
            visible: isAdminOrSuperAdmin,
          },
          {
            id: "academic-year",
            label: "Academic Year Configuration",
            visible: isAdminOrSuperAdmin,
          },
          {
            id: "certificates",
            label: "Certificate Templates",
            visible: isAdminOrSuperAdmin,
          },
          {
            id: "automated-ids",
            label: "Automated ID Settings",
            visible: isAdminOrSuperAdmin,
          },
          {
            id: "backup",
            label: "Backup & Restore",
            visible: isAdminOrSuperAdmin,
          },
          {
            id: "audit",
            label: "System Audit Logs",
            visible: isAdminOrSuperAdmin,
          },
        ]
          .filter((t) => t.visible)
          .map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 text-center ${
                  isActive
                    ? "bg-sky-50 dark:bg-sky-950/60 text-[#0088cc] dark:text-sky-400 shadow-2xs border border-sky-300 dark:border-sky-800 font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
      </div>

      {/* TAB 0: PERSONAL BASIC DETAILS & PHOTO (FOR ALL ROLES INCLUDING WARDEN & ADMIN) */}
      {activeTab === "my-profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Basic Details Form Card */}
          <div className="lg:col-span-2 glass-card p-4 sm:p-5 rounded-2xl space-y-3 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-brand-600" /> Basic Details
                  & Profile Setup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-extrabold transition cursor-pointer active:scale-95 ${
                  isEditingProfile
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800 shadow-xs hover:bg-rose-100 dark:hover:bg-rose-900/50"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                title={isEditingProfile ? "Cancel Editing" : "Edit Profile"}
              >
                {isEditingProfile ? (
                  <>
                    <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Edit className="w-3.5 h-3.5 text-brand-600" />
                    <span>Edit</span>
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleSaveMyProfile} className="space-y-3 text-sm">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
                {/* Left: Input Fields Grid */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-1">
                      Full Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isEditingProfile}
                      placeholder="Enter your full name"
                      value={myProfileForm.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMyProfileForm((prev) => ({ ...prev, name: val }));
                        const res = validateFullName(val, true);
                        setProfileErrors((prev) => ({ ...prev, name: res.error }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border font-semibold text-sm text-slate-900 dark:text-white focus:ring-2 transition disabled:bg-slate-100/80 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed ${
                        !isEditingProfile
                          ? "bg-slate-100/70 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/80"
                          : profileErrors.name
                          ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:ring-brand-500/20 focus:border-brand-500"
                      }`}
                    />
                    {profileErrors.name && (
                      <p className="mt-1 text-xs font-bold text-rose-500 flex items-center gap-1">
                        <span>⚠️</span> {profileErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-1">
                      Email Address <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!isEditingProfile}
                      placeholder="warden@pirnavschools.edu"
                      value={myProfileForm.email}
                      onChange={(e) => {
                        const sanitized = sanitizeEmailInput(e.target.value);
                        setMyProfileForm((prev) => ({ ...prev, email: sanitized }));
                        const res = validateEmail(sanitized, true);
                        setProfileErrors((prev) => ({ ...prev, email: res.error }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border font-semibold text-sm text-slate-900 dark:text-white focus:ring-2 transition disabled:bg-slate-100/80 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed ${
                        !isEditingProfile
                          ? "bg-slate-100/70 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/80"
                          : profileErrors.email
                          ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:ring-brand-500/20 focus:border-brand-500"
                      }`}
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-xs font-bold text-rose-500 flex items-center gap-1">
                        <span>⚠️</span> {profileErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-1 whitespace-nowrap">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      disabled={!isEditingProfile}
                      maxLength={10}
                      placeholder="9876543210"
                      value={myProfileForm.phone}
                      onChange={(e) => {
                        const cleaned = sanitizePhoneInput(e.target.value);
                        setMyProfileForm((prev) => ({ ...prev, phone: cleaned }));
                        const res = validatePhoneNumber(cleaned, false);
                        setProfileErrors((prev) => ({ ...prev, phone: cleaned ? res.error : undefined }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border font-semibold text-sm text-slate-900 dark:text-white focus:ring-2 transition disabled:bg-slate-100/80 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed ${
                        !isEditingProfile
                          ? "bg-slate-100/70 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/80"
                          : profileErrors.phone
                          ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:ring-brand-500/20 focus:border-brand-500"
                      }`}
                    />
                    {profileErrors.phone && (
                      <p className="mt-1 text-xs font-bold text-rose-500 flex items-center gap-1">
                        <span>⚠️</span> {profileErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-1 whitespace-nowrap">
                      Assigned Campus
                    </label>
                    <select
                      disabled={!isEditingProfile}
                      value={myProfileForm.branch}
                      onChange={(e) =>
                        setMyProfileForm({
                          ...myProfileForm,
                          branch: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 rounded-xl border font-semibold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition disabled:bg-slate-100/80 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed ${
                        !isEditingProfile
                          ? "bg-slate-100/70 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/80"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 cursor-pointer"
                      }`}
                    >
                      <option value="">Select Campus</option>
                      {configuredBranches.map((bName: string) => (
                        <option key={bName} value={bName}>
                          {bName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right: Profile Photo Uploader directly next to fields */}
                <div className="shrink-0 flex flex-col items-center justify-center space-y-1 self-center pt-2 md:pt-0">
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />

                  <div className="relative shrink-0">
                    {Boolean(myProfileForm.avatar && myProfileForm.avatar !== DEFAULT_USER_AVATAR) ? (
                      <div className="relative">
                        <img
                          src={resolveMediaUrl(myProfileForm.avatar) || DEFAULT_USER_AVATAR}
                          alt="Profile Avatar"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_USER_AVATAR) {
                              target.src = DEFAULT_USER_AVATAR;
                            }
                          }}
                          className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-500/20 shadow-xs bg-white dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          disabled={!isEditingProfile}
                          onClick={() =>
                            setMyProfileForm((prev) => ({
                              ...prev,
                              avatar: "",
                            }))
                          }
                          className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-100/50 dark:ring-slate-800/50 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60">
                        <UserIcon className="w-9 h-9" />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-tight text-center">
                    Max size: 3MB
                  </span>

                  {!Boolean(myProfileForm.avatar && myProfileForm.avatar !== DEFAULT_USER_AVATAR) ? (
                    <button
                      type="button"
                      disabled={!isEditingProfile}
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="w-20 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-extrabold cursor-pointer flex items-center justify-center gap-1 shadow-xs transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                      <Camera className="w-3.5 h-3.5" /> Upload
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!isEditingProfile}
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="w-20 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                      <Camera className="w-3.5 h-3.5" /> Change
                    </button>
                  )}
                </div>
              </div>



              {/* Submit Button */}
              {isEditingProfile && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile || isProfileFormInvalid}
                    className="px-4.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    <Save className="w-4 h-4" /> {isSavingProfile ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Password & Account Security Card */}
          <div className="space-y-6">
            <div className="glass-card p-4 sm:p-5 rounded-2xl space-y-3 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center border border-amber-100 dark:border-amber-900">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Account Security
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Update your login password
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleUpdatePassword}
                className="space-y-3 text-sm"
              >
                <div>
                  <label className="block font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passForm.currentPassword}
                    onChange={(e) =>
                      setPassForm({
                        ...passForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={passForm.newPassword}
                    onChange={(e) =>
                      setPassForm({ ...passForm, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={passForm.confirmPassword}
                    onChange={(e) =>
                      setPassForm({
                        ...passForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-extrabold text-sm shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Lock className="w-4 h-4" /> Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SCHOOL BRANDING PROFILE */}
      {activeTab === "profile" && (
        <div className="glass-card p-6 rounded-3xl space-y-4 max-w-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            School Profile Setup
          </h3>
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">
                School Name{" "}
                <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="e.g. Pirnav Educational Institutions"
                value={profileForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setProfileForm({ ...profileForm, name: val });
                  const res = validateFullName(val, true);
                  setSchoolProfileErrors((prev) => ({ ...prev, name: val ? res.error : undefined }));
                }}
                className={`w-full px-3 py-2 rounded-xl border transition ${
                  schoolProfileErrors.name
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              />
              {schoolProfileErrors.name && (
                <p className="mt-1 text-xs font-bold text-rose-500 flex items-center gap-1">
                  <span>⚠️</span> {schoolProfileErrors.name}
                </p>
              )}
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Tagline / Motto
              </label>
              <input
                type="text"
                maxLength={100}
                placeholder="e.g. Empowering Excellence"
                value={profileForm.tagline}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, tagline: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Full Address{" "}
                <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <textarea
                required
                rows={2}
                maxLength={250}
                placeholder="Full street address..."
                value={profileForm.address}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, address: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">
                  Contact Phone{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: sanitizePhoneInput(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Contact Email{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={60}
                  placeholder="contact@school.edu"
                  value={profileForm.email}
                  onChange={(e) => {
                    const sanitized = sanitizeEmailInput(e.target.value);
                    setProfileForm({ ...profileForm, email: sanitized });
                    const res = validateEmail(sanitized, true);
                    setSchoolProfileErrors((prev) => ({ ...prev, email: sanitized ? res.error : undefined }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl border transition ${
                    schoolProfileErrors.email
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                />
                {schoolProfileErrors.email && (
                  <p className="mt-1 text-xs font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {schoolProfileErrors.email}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Website URL</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="https://school.edu"
                  value={profileForm.website}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, website: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Principal Name{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  placeholder="e.g. Dr. Eleanor Vance"
                  value={profileForm.principalName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfileForm({
                      ...profileForm,
                      principalName: val,
                    });
                    const res = validateFullName(val, true);
                    setSchoolProfileErrors((prev) => ({ ...prev, principalName: val ? res.error : undefined }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl border transition ${
                    schoolProfileErrors.principalName
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                />
                {schoolProfileErrors.principalName && (
                  <p className="mt-1 text-xs font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {schoolProfileErrors.principalName}
                  </p>
                )}
              </div>
            </div>
            {/* Timings & Educational Board Settings */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5 my-2">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" /> Operational Timings & Educational Board
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Educational Board <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={profileForm.boardType || "CBSE"}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, boardType: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                    <option value="ICSE">ICSE / CISCE Board</option>
                    <option value="State Board (SSC)">State Board (SSC / Matriculation)</option>
                    <option value="IB">IB (International Baccalaureate)</option>
                    <option value="IGCSE">IGCSE / Cambridge International</option>
                    <option value="Other Board">Other / Recognized Board</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Staff Check-In Time <span className="text-rose-500">*</span></span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold font-mono">{time24To12(profileForm.staffCheckInTime || "08:30 AM")}</span>
                  </label>
                  <input
                    type="time"
                    value={time12To24(profileForm.staffCheckInTime || "08:30 AM")}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        staffCheckInTime: e.target.value ? time24To12(e.target.value) : "08:30 AM",
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Staff Check-Out Time <span className="text-rose-500">*</span></span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold font-mono">{time24To12(profileForm.staffCheckOutTime || "05:00 PM")}</span>
                  </label>
                  <input
                    type="time"
                    value={time12To24(profileForm.staffCheckOutTime || "05:00 PM")}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        staffCheckOutTime: e.target.value ? time24To12(e.target.value) : "05:00 PM",
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>School Start Time <span className="text-rose-500">*</span></span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold font-mono">{time24To12(profileForm.schoolStartTime || "08:30 AM")}</span>
                  </label>
                  <input
                    type="time"
                    value={time12To24(profileForm.schoolStartTime || "08:30 AM")}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        schoolStartTime: e.target.value ? time24To12(e.target.value) : "08:30 AM",
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>School End Time <span className="text-rose-500">*</span></span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold font-mono">{time24To12(profileForm.schoolEndTime || "03:30 PM")}</span>
                  </label>
                  <input
                    type="time"
                    value={time12To24(profileForm.schoolEndTime || "03:30 PM")}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        schoolEndTime: e.target.value ? time24To12(e.target.value) : "03:30 PM",
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Late Grace Buffer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={profileForm.staffGracePeriodMinutes || 15}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        staffGracePeriodMinutes: parseInt(e.target.value, 10) || 15,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-amber-700 dark:text-amber-300"
                  >
                    <option value={5}>5 Mins (Strict)</option>
                    <option value={10}>10 Mins Grace</option>
                    <option value={15}>15 Mins Grace (Default)</option>
                    <option value={20}>20 Mins Grace</option>
                    <option value={30}>30 Mins Grace</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <SchoolLogoUploader
                value={profileForm.logoUrl || ""}
                onChange={(newLogoUrl) => {
                  setProfileForm((prev) => ({ ...prev, logoUrl: newLogoUrl }));
                  updateSchoolProfile({ logoUrl: newLogoUrl });
                  try {
                    localStorage.setItem("school_logo", newLogoUrl);
                    localStorage.setItem("logoUrl", newLogoUrl);
                    localStorage.setItem("schoolLogo", newLogoUrl);
                  } catch (e) {}
                  window.dispatchEvent(new Event("school_profile_updated"));
                }}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Profile Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CAMPUS CONFIGURATION */}
      {activeTab === "campus" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> Campus &
                Branch Master
              </h3>
            </div>
            <button
              onClick={handleOpenAddCampus}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Campus Branch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campuses.map((campus) => (
              <div
                key={campus.id}
                className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200 dark:border-slate-800 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                    {campus.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      campus.status === "Active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {campus.status}
                  </span>
                </div>

                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {campus.name}
                </h4>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{campus.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{campus.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{campus.email}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditCampus(campus)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCampus(campus)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC YEAR CONFIGURATION */}
      {activeTab === "academic-year" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" /> Academic Year
                Master & Sessions
              </h3>
            </div>
            <button
              onClick={handleOpenAddAY}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Academic Year
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredAcademicYears.map((ay) => (
              <div
                key={ay.id}
                className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200 dark:border-slate-800 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-sky-600 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md">
                    {ay.academicYear}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      ay.status === "Active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {ay.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    Start Date:{" "}
                    <strong>{formatDateDDMMYYYY(ay.startDate)}</strong>
                  </p>
                  <p>
                    End Date: <strong>{formatDateDDMMYYYY(ay.endDate)}</strong>
                  </p>
                  {ay.description && (
                    <p className="text-slate-400 text-[11px]">
                      {ay.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {ay.status !== "Active" ? (
                    <button
                      onClick={() => {
                        setCurrentAcademicYear(ay.id);
                        addToast(
                          "success",
                          "Current Session Updated",
                          `Set ${ay.academicYear} as active academic session.`,
                        );
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer"
                    >
                      Set as Active Session
                    </button>
                  ) : (
                    <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Current Active
                      Session
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditAY(ay)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingAY(ay)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CERTIFICATES SETTINGS (NEW CERTIFICATE MODULE CONFIGURATION) */}
      {activeTab === "certificates" && <CertificateSettingsTab />}

      {/* TAB 4.5: AUTOMATED ID & SERIAL NUMBER SEQUENCE SETTINGS (EXACT DESIGN MATCH) */}
      {activeTab === "automated-ids" && (
        <div className="space-y-5 animate-in fade-in">
          {/* Top Banner Header Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Automated ID & Serial Number Sequence Settings
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleAddCustomIdSequence}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-sky-600" /> Add Custom ID Format
              </button>
              <button
                type="button"
                onClick={() => {
                  saveIdSequenceSettings(idForm);
                  updateIdSequenceSettingsApi(idForm).catch(() => {});
                  addToast("success", "Automated Settings Saved", "All ID sequence formatting rules updated successfully.");
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save All ID Formats
              </button>
            </div>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Student ID */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-sky-600" />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Student ID</h4>
              </div>

              {/* Black Live Preview Box */}
              <div className="py-4 px-3 rounded-xl bg-slate-950 text-center shadow-inner space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">LIVE PREVIEW</p>
                <p className="font-mono text-base font-black text-sky-400 tracking-wider">
                  {buildPreviewId(idForm.studentIdPrefix, idForm.studentIdStartNo, idForm.studentIdPadding, idForm.studentIdIncludeYear, idForm.studentIdSeparator, idForm.studentIdPosition)}
                </p>
              </div>

              {/* Form Controls */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ID Prefix</label>
                    <input
                      type="text"
                      value={idForm.studentIdPrefix}
                      onChange={e => {
                        const next = { ...idForm, studentIdPrefix: e.target.value };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tag Placement</label>
                    <select
                      value={idForm.studentIdPosition}
                      onChange={e => {
                        const next = { ...idForm, studentIdPosition: e.target.value as any };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 transition text-[11px]"
                    >
                      <option value="start">Start (P...</option>
                      <option value="middle">Middle (Y...</option>
                      <option value="end">End (Y...</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Start No.</label>
                    <input
                      type="number"
                      value={idForm.studentIdStartNo}
                      onChange={e => {
                        const next = { ...idForm, studentIdStartNo: Number(e.target.value) };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Padding</label>
                    <select
                      value={idForm.studentIdPadding}
                      onChange={e => {
                        const next = { ...idForm, studentIdPadding: Number(e.target.value) };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 transition text-[11px]"
                    >
                      <option value={3}>3 (001)</option>
                      <option value={4}>4 (0001)</option>
                      <option value={5}>5 (00001)</option>
                      <option value={6}>6 (000001)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Separator</label>
                    <select
                      value={idForm.studentIdSeparator}
                      onChange={e => {
                        const next = { ...idForm, studentIdSeparator: e.target.value };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 transition text-[11px]"
                    >
                      <option value="-">Hyphen (-)</option>
                      <option value="/">Slash (/)</option>
                      <option value=".">Dot (.)</option>
                      <option value="_">Underscore (_)</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Year Tag</label>
                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer font-bold text-[11px] text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={idForm.studentIdIncludeYear}
                        onChange={e => {
                          const next = { ...idForm, studentIdIncludeYear: e.target.checked };
                          setIdForm(next);
                          saveIdSequenceSettings(next);
                        }}
                        className="w-3.5 h-3.5 rounded text-sky-600 cursor-pointer"
                      />
                      <span>Include</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Teaching Staff ID */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Teaching Staff ID</h4>
              </div>

              {/* Black Live Preview Box */}
              <div className="py-4 px-3 rounded-xl bg-slate-950 text-center shadow-inner space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">LIVE PREVIEW</p>
                <p className="font-mono text-base font-black text-indigo-400 tracking-wider">
                  {buildPreviewId(idForm.teachingIdPrefix, idForm.teachingIdStartNo, idForm.teachingIdPadding, idForm.teachingIdIncludeYear, idForm.teachingIdSeparator, idForm.teachingIdPosition)}
                </p>
              </div>

              {/* Form Controls */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ID Prefix</label>
                    <input
                      type="text"
                      value={idForm.teachingIdPrefix}
                      onChange={e => {
                        const next = { ...idForm, teachingIdPrefix: e.target.value };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tag Placement</label>
                    <select
                      value={idForm.teachingIdPosition}
                      onChange={e => {
                        const next = { ...idForm, teachingIdPosition: e.target.value as any };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition text-[11px]"
                    >
                      <option value="start">Start (P...</option>
                      <option value="middle">Middle (Y...</option>
                      <option value="end">End (Y...</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Start No.</label>
                    <input
                      type="number"
                      value={idForm.teachingIdStartNo}
                      onChange={e => {
                        const next = { ...idForm, teachingIdStartNo: Number(e.target.value) };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Padding</label>
                    <select
                      value={idForm.teachingIdPadding}
                      onChange={e => {
                        const next = { ...idForm, teachingIdPadding: Number(e.target.value) };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition text-[11px]"
                    >
                      <option value={3}>3 (001)</option>
                      <option value={4}>4 (0001)</option>
                      <option value={5}>5 (00001)</option>
                      <option value={6}>6 (000001)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Separator</label>
                    <select
                      value={idForm.teachingIdSeparator}
                      onChange={e => {
                        const next = { ...idForm, teachingIdSeparator: e.target.value };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition text-[11px]"
                    >
                      <option value="-">Hyphen (-)</option>
                      <option value="/">Slash (/)</option>
                      <option value=".">Dot (.)</option>
                      <option value="_">Underscore (_)</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Year Tag</label>
                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer font-bold text-[11px] text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={idForm.teachingIdIncludeYear}
                        onChange={e => {
                          const next = { ...idForm, teachingIdIncludeYear: e.target.checked };
                          setIdForm(next);
                          saveIdSequenceSettings(next);
                        }}
                        className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
                      />
                      <span>Include</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Non-Teaching Staff ID */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-fuchsia-600" />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Non-Teaching Staff ID</h4>
              </div>

              {/* Black Live Preview Box */}
              <div className="py-4 px-3 rounded-xl bg-slate-950 text-center shadow-inner space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">LIVE PREVIEW</p>
                <p className="font-mono text-base font-black text-fuchsia-400 tracking-wider">
                  {buildPreviewId(idForm.nonTeachingIdPrefix, idForm.nonTeachingIdStartNo, idForm.nonTeachingIdPadding, idForm.nonTeachingIdIncludeYear, idForm.nonTeachingIdSeparator, idForm.nonTeachingIdPosition)}
                </p>
              </div>

              {/* Form Controls */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ID Prefix</label>
                    <input
                      type="text"
                      value={idForm.nonTeachingIdPrefix}
                      onChange={e => {
                        const next = { ...idForm, nonTeachingIdPrefix: e.target.value };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-fuchsia-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tag Placement</label>
                    <select
                      value={idForm.nonTeachingIdPosition}
                      onChange={e => {
                        const next = { ...idForm, nonTeachingIdPosition: e.target.value as any };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-fuchsia-500 transition text-[11px]"
                    >
                      <option value="start">Start (P...</option>
                      <option value="middle">Middle (Y...</option>
                      <option value="end">End (Y...</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Start No.</label>
                    <input
                      type="number"
                      value={idForm.nonTeachingIdStartNo}
                      onChange={e => {
                        const next = { ...idForm, nonTeachingIdStartNo: Number(e.target.value) };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-fuchsia-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Padding</label>
                    <select
                      value={idForm.nonTeachingIdPadding}
                      onChange={e => {
                        const next = { ...idForm, nonTeachingIdPadding: Number(e.target.value) };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-fuchsia-500 transition text-[11px]"
                    >
                      <option value={3}>3 (001)</option>
                      <option value={4}>4 (0001)</option>
                      <option value={5}>5 (00001)</option>
                      <option value={6}>6 (000001)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Separator</label>
                    <select
                      value={idForm.nonTeachingIdSeparator}
                      onChange={e => {
                        const next = { ...idForm, nonTeachingIdSeparator: e.target.value };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-fuchsia-500 transition text-[11px]"
                    >
                      <option value="-">Hyphen (-)</option>
                      <option value="/">Slash (/)</option>
                      <option value=".">Dot (.)</option>
                      <option value="_">Underscore (_)</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Year Tag</label>
                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer font-bold text-[11px] text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={idForm.nonTeachingIdIncludeYear}
                        onChange={e => {
                          const next = { ...idForm, nonTeachingIdIncludeYear: e.target.checked };
                          setIdForm(next);
                          saveIdSequenceSettings(next);
                        }}
                        className="w-3.5 h-3.5 rounded text-fuchsia-600 cursor-pointer"
                      />
                      <span>Include</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Admission No */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-emerald-600" />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Admission No</h4>
              </div>

              {/* Black Live Preview Box */}
              <div className="py-4 px-3 rounded-xl bg-slate-950 text-center shadow-inner space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">LIVE PREVIEW</p>
                <p className="font-mono text-base font-black text-emerald-400 tracking-wider">
                  {buildPreviewId(idForm.admissionNoPrefix, idForm.admissionNoStartNo, idForm.admissionNoPadding, idForm.admissionNoIncludeYear, idForm.admissionNoSeparator, idForm.admissionNoPosition)}
                </p>
              </div>

              {/* Form Controls */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Admission Prefix</label>
                    <input
                      type="text"
                      value={idForm.admissionNoPrefix}
                      onChange={e => {
                        const next = { ...idForm, admissionNoPrefix: e.target.value };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tag Placement</label>
                    <select
                      value={idForm.admissionNoPosition}
                      onChange={e => {
                        const next = { ...idForm, admissionNoPosition: e.target.value as any };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition text-[11px]"
                    >
                      <option value="start">Start (P...</option>
                      <option value="middle">Middle (Y...</option>
                      <option value="end">End (Y...</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Start No.</label>
                    <input
                      type="number"
                      value={idForm.admissionNoStartNo}
                      onChange={e => {
                        const next = { ...idForm, admissionNoStartNo: Number(e.target.value) };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Padding</label>
                    <select
                      value={idForm.admissionNoPadding}
                      onChange={e => {
                        const next = { ...idForm, admissionNoPadding: Number(e.target.value) };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition text-[11px]"
                    >
                      <option value={3}>3 (001)</option>
                      <option value={4}>4 (0001)</option>
                      <option value={5}>5 (00001)</option>
                      <option value={6}>6 (000001)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Separator</label>
                    <select
                      value={idForm.admissionNoSeparator}
                      onChange={e => {
                        const next = { ...idForm, admissionNoSeparator: e.target.value };
                        setIdForm(next);
                        saveIdSequenceSettings(next);
                      }}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition text-[11px]"
                    >
                      <option value="-">Hyphen (-)</option>
                      <option value="/">Slash (/)</option>
                      <option value=".">Dot (.)</option>
                      <option value="_">Underscore (_)</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Year Tag</label>
                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer font-bold text-[11px] text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={idForm.admissionNoIncludeYear}
                        onChange={e => {
                          const next = { ...idForm, admissionNoIncludeYear: e.target.checked };
                          setIdForm(next);
                          saveIdSequenceSettings(next);
                        }}
                        className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
                      />
                      <span>Include</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom ID Formats List if any exist */}
          {(idForm.customSequences || []).length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" /> Custom Module Sequence Formats
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(idForm.customSequences || []).map(seq => (
                  <div key={seq.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <input
                        type="text"
                        value={seq.name}
                        onChange={e => handleUpdateCustomSequence(seq.id, { name: e.target.value })}
                        className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomIdSequence(seq.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 text-center font-mono font-bold text-sky-400 text-xs">
                      {buildPreviewId(seq.prefix, seq.startNo, seq.padding, seq.includeYear, seq.separator, seq.position)}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400">Prefix</label>
                        <input
                          type="text"
                          value={seq.prefix}
                          onChange={e => handleUpdateCustomSequence(seq.id, { prefix: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400">Start No</label>
                        <input
                          type="number"
                          value={seq.startNo}
                          onChange={e => handleUpdateCustomSequence(seq.id, { startNo: Number(e.target.value) })}
                          className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BACKUP & RESTORE */}
      {activeTab === "backup" && (
        <div className="glass-card p-6 rounded-3xl space-y-4 max-w-xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> Database Backup &
            Recovery
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Export a complete JSON snapshot of all student records, fee ledgers,
            staff records, and system settings for offline archival.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleBackup}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Database className="w-4 h-4" /> Download JSON Backup
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {log.userName} ({log.userRole})
                  </td>
                  <td className="py-3 px-4 text-brand-600 font-semibold">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Campus Modal */}
      {isCampusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingCampus ? "Edit Campus Branch" : "Add Campus Branch"}
              </h3>
              <button
                onClick={() => setIsCampusModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampus} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Name{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="e.g. North Branch"
                  value={campusForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCampusForm({ ...campusForm, name: val });
                    const res = validateCampusName(val, true);
                    setCampusErrors((prev) => ({ ...prev, name: val ? res.error : undefined }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl border transition ${
                    campusErrors.name
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                />
                {campusErrors.name && (
                  <p className="mt-1 text-xs font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {campusErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Code{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. NORTH"
                  value={campusForm.code}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setCampusForm({
                      ...campusForm,
                      code: val,
                    });
                    const res = validateCampusCode(val, true);
                    setCampusErrors((prev) => ({ ...prev, code: val ? res.error : undefined }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-bold transition ${
                    campusErrors.code
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                />
                {campusErrors.code && (
                  <p className="mt-1 text-xs font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {campusErrors.code}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  maxLength={150}
                  placeholder="Full street address..."
                  value={campusForm.address}
                  onChange={(e) =>
                    setCampusForm({ ...campusForm, address: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="9876543210"
                    value={campusForm.phone}
                    onChange={(e) => {
                      const val = sanitizePhoneInput(e.target.value);
                      setCampusForm({ ...campusForm, phone: val });
                      if (campusErrors.phone) setCampusErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                      campusErrors.phone ? "border-rose-500 focus:ring-rose-500" : ""
                    }`}
                  />
                  {campusErrors.phone && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {campusErrors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="campus@domain.com"
                    value={campusForm.email}
                    onChange={(e) => {
                      const sanitized = sanitizeEmailInput(e.target.value);
                      setCampusForm({ ...campusForm, email: sanitized });
                      const res = validateEmail(sanitized, false);
                      setCampusErrors((prev) => ({ ...prev, email: res.error }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                      campusErrors.email ? "border-rose-500 focus:ring-rose-500" : ""
                    }`}
                  />
                  {campusErrors.email && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {campusErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Status <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  required
                  value={campusForm.status}
                  onChange={(e) => {
                    const val = e.target.value as "Active" | "Inactive" | "";
                    setCampusForm({
                      ...campusForm,
                      status: val,
                    });
                    if (val) {
                      setCampusErrors((prev) => ({ ...prev, status: undefined }));
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-xl border font-bold transition ${
                    campusErrors.status
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20 text-rose-600"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  }`}
                >
                  <option value="" disabled>Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {campusErrors.status && (
                  <p className="mt-1 text-xs font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {campusErrors.status}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Save Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Academic Year Modal */}
      {isAYModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingAY ? "Edit Academic Year" : "Add Academic Year"}
              </h3>
              <button
                onClick={() => setIsAYModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAY} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Session Name{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026–27 or 2026-2027"
                  value={ayForm.academicYear}
                  onChange={(e) => {
                    setAyForm({ ...ayForm, academicYear: e.target.value });
                    if (ayErrors.academicYear) setAyErrors((prev) => ({ ...prev, academicYear: undefined }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold ${
                    ayErrors.academicYear ? "border-rose-500 focus:ring-rose-500" : ""
                  }`}
                />
                {ayErrors.academicYear && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠️</span> {ayErrors.academicYear}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={ayForm.startDate}
                    onChange={(e) =>
                      setAyForm({ ...ayForm, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Date{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={ayForm.endDate}
                    onChange={(e) =>
                      setAyForm({ ...ayForm, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Session Status <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  required
                  value={ayForm.status}
                  onChange={(e) => {
                    const val = e.target.value as "Active" | "Closed" | "Upcoming" | "";
                    setAyForm({ ...ayForm, status: val });
                    if (ayErrors.status) setAyErrors((prev) => ({ ...prev, status: undefined }));
                  }}
                  className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold cursor-pointer ${
                    ayErrors.status ? "border-rose-500 focus:ring-rose-500" : ""
                  }`}
                >
                  <option value="" disabled hidden>
                    Select Session Status
                  </option>
                  <option value="Active">Active Session</option>
                  <option value="Upcoming">Upcoming Session</option>
                  <option value="Closed">Closed Session</option>
                </select>
                {ayErrors.status && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
                    <span>⚠️</span> {ayErrors.status}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regular Academic Year 2026-2027"
                  value={ayForm.description}
                  onChange={(e) =>
                    setAyForm({ ...ayForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAYModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Academic Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Campus Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingCampus}
        title="Remove Campus Configuration"
        message={`Are you sure you want to remove ${deletingCampus?.name}? This campus will be removed from system configurations.`}
        onConfirm={confirmDeleteCampus}
        onCancel={() => setDeletingCampus(null)}
      />

      {/* Delete Academic Year Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingAY}
        title="Remove Academic Year"
        message={`Are you sure you want to remove ${deletingAY?.academicYear}? This session will be removed from system configurations.`}
        onConfirm={confirmDeleteAY}
        onCancel={() => setDeletingAY(null)}
      />
    </div>
  );
};

export default SettingsView;
