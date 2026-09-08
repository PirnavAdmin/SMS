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

const defaultCampuses: CampusItem[] = [
  {
    id: "CMP-01",
    name: "Main Campus",
    code: "MAIN",
    address:
      "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081",
    phone: "+91 9123456789",
    email: "main@pirnavschools.edu",
    status: "Active",
  },
  {
    id: "CMP-02",
    name: "North Branch",
    code: "NORTH",
    address:
      "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081",
    phone: "+91 9123456789",
    email: "north@pirnavschools.edu",
    status: "Active",
  },
  {
    id: "CMP-03",
    name: "West Campus",
    code: "WEST",
    address:
      "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081",
    phone: "+91 9123456789",
    email: "west@pirnavschools.edu",
    status: "Active",
  },
];

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
  >("my-profile");

  // Personal Profile Details State for Logged-In User (Warden / Admin)
  const getCleanUserEmail = (raw?: string): string => {
    const e = (raw || user?.email || "").trim();
    if (!e || e === "contact@pirnavschools.edu" || e === "admin@pirnavschools.edu" || (user?.name === "Vasantha Gokul" && e.endsWith("@pirnavschools.edu"))) {
      return "vasantha.gokul@pirnav.com";
    }
    return e;
  };

  const [myProfileForm, setMyProfileForm] = useState({
    name: user?.name || "Vasantha Gokul",
    email: getCleanUserEmail(user?.email),
    phone: user?.phone || "+91 9876543210",
    avatar: user?.avatar || DEFAULT_USER_AVATAR,
    branch: user?.branch || "Main Campus",
    role: user?.role || role || "Admin",
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const cleanEmail = getCleanUserEmail(user?.email);
        const res = await fetchUserProfileApi(cleanEmail);
        const data = res?.data;
        if (data && isMounted && (data.name || data.avatar)) {
          setMyProfileForm((prev) => {
            const hasUploadedAvatar = (user?.avatar && user.avatar.startsWith("data:image/")) || (prev.avatar && prev.avatar.startsWith("data:image/"));
            const profileAvatar = hasUploadedAvatar ? (user?.avatar || prev.avatar) : (data.avatar || user?.avatar || DEFAULT_USER_AVATAR);
            return {
              ...prev,
              name: data.name || prev.name,
              phone: data.phone || prev.phone,
              avatar: profileAvatar,
              branch: data.branch || prev.branch,
              role: data.role || prev.role,
            };
          });

          if (user && setUser) {
            const hasUploadedAvatar = user.avatar && user.avatar.startsWith("data:image/");
            const profileAvatar = hasUploadedAvatar ? user.avatar : (data.avatar || user.avatar || DEFAULT_USER_AVATAR);
            const updatedUser = {
              ...user,
              name: data.name || user.name,
              phone: data.phone || user.phone,
              avatar: profileAvatar,
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

    if (file.size > 10 * 1024 * 1024) {
      addToast(
        "error",
        "File Too Large",
        "Please select an image smaller than 10MB.",
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
        name: myProfileForm.name.trim() || user?.name || "Vasantha Gokul",
        email: cleanEmail,
        phone: myProfileForm.phone.trim() || user?.phone || "+91 9876543210",
        avatar: optimizedDataUrl,
        branch: myProfileForm.branch || user?.branch || "Main Campus",
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
    if (!myProfileForm.name.trim()) {
      addToast(
        "error",
        "Validation Error",
        "Please provide a valid full name.",
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
      const isDataUrl = (myProfileForm.avatar && myProfileForm.avatar.startsWith("data:image/")) || (user?.avatar && user.avatar.startsWith("data:image/"));
      const finalAvatar = isDataUrl ? (myProfileForm.avatar || user?.avatar) : (savedData?.avatar || myProfileForm.avatar || DEFAULT_USER_AVATAR);

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
  const [ayForm, setAyForm] = useState<{
    academicYear: string;
    startDate: string;
    endDate: string;
    status: "Active" | "Closed" | "Upcoming";
    description: string;
    isCurrentAcademicYear: boolean;
  }>({
    academicYear: "",
    startDate: "",
    endDate: "",
    status: "Upcoming",
    description: "",
    isCurrentAcademicYear: false,
  });

  // Campus Configuration States
  const [campuses, setCampuses] = useState<CampusItem[]>(() => {
    const saved = localStorage.getItem("school_campuses");
    return saved ? JSON.parse(saved) : defaultCampuses;
  });

  const [campusSearch, setCampusSearch] = useState("");
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<CampusItem | null>(null);
  const [deletingCampus, setDeletingCampus] = useState<CampusItem | null>(null);

  const [campusForm, setCampusForm] = useState<{
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    status: "Active" | "Inactive";
  }>({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    status: "Active",
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

  // Sync campuses to localStorage and trigger Header sync event
  const syncCampuses = async (updated: CampusItem[]) => {
    setCampuses(updated);
    localStorage.setItem("school_campuses", JSON.stringify(updated));

    const allActive = updated
      .filter((c) => c.status === "Active")
      .map((c) => c.name);
    const allInactive = updated
      .filter((c) => c.status === "Inactive")
      .map((c) => c.name);
    const allManaged = updated.map((c) => c.name);

    localStorage.setItem("managed_branches", JSON.stringify(allManaged));
    localStorage.setItem("inactive_branches", JSON.stringify(allInactive));

    window.dispatchEvent(new Event("branches_updated"));

    try {
      await updateCampusesApi(updated);
    } catch (err) {
      console.warn("Failed to sync campuses to backend database:", err);
    }
  };

  const handleSaveProfile = (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateSchoolProfile(profileForm);
    try {
      localStorage.setItem("edu_db_profile", JSON.stringify(profileForm));
      localStorage.setItem("profile", JSON.stringify(profileForm));
      if (profileForm.logoUrl) {
        localStorage.setItem("school_logo", profileForm.logoUrl);
      }
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
    setCampusForm({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      status: "Active",
    });
    setIsCampusModalOpen(true);
  };

  const handleOpenEditCampus = (campus: CampusItem) => {
    setEditingCampus(campus);
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
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setCampuses(res.data);
          localStorage.setItem("school_campuses", JSON.stringify(res.data));
          window.dispatchEvent(new Event("branches_updated"));
        }
      } catch (err) {
        console.warn("Backend branches load notice:", err);
      }

      try {
        const ayRes: any = await fetchAcademicYearsApi();
        if (
          ayRes?.success &&
          Array.isArray(ayRes.data) &&
          ayRes.data.length > 0
        ) {
          localStorage.setItem(
            "edu_db_academic_years",
            JSON.stringify(ayRes.data),
          );
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

    let updated: CampusItem[];
    if (editingCampus) {
      updated = campuses.map((c) =>
        c.id === editingCampus.id ? { ...editingCampus, ...campusForm } : c,
      );
      addToast(
        "success",
        "Campus Updated",
        `Updated settings for ${campusForm.name}`,
      );
      try {
        await updateBranchApi(editingCampus.id, campusForm);
      } catch (err) {
        console.warn("Failed to update branch on backend:", err);
      }
    } else {
      const tempId = `CMP-${Date.now().toString().slice(-4)}`;
      const newCampus: CampusItem = {
        id: tempId,
        ...campusForm,
      };
      updated = [...campuses, newCampus];
      addToast(
        "success",
        "Campus Added",
        `Added new campus ${campusForm.name}`,
      );
      try {
        const res: any = await createBranchApi(campusForm);
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
      status: "Upcoming",
      description: "",
      isCurrentAcademicYear: false,
    });
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
    setIsAYModalOpen(true);
  };

  const handleSaveAY = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ayForm.academicYear.trim()) return;

    if (editingAY) {
      updateAcademicYear(editingAY.id, ayForm);
      addToast(
        "success",
        "Academic Year Updated",
        `Academic year ${ayForm.academicYear} configuration updated.`,
      );
    } else {
      addAcademicYear(ayForm);
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
      <div className="flex items-stretch gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
        {/* Tab 1: My Profile */}
        <button
          type="button"
          onClick={() => setActiveTab("my-profile")}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[44px] text-center leading-tight shrink-0 ${
            activeTab === "my-profile"
              ? "bg-[#0088cc] text-white shadow-sm shadow-sky-500/25 border border-[#0088cc] font-extrabold"
              : "bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
          }`}
        >
          <UserIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span>
            My Profile
            <br />
            (Basic Details)
          </span>
        </button>

        {isAdminOrSuperAdmin && (
          <>
            {/* Tab 2: School Branding Profile */}
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[44px] text-center leading-tight shrink-0 ${
                activeTab === "profile"
                  ? "bg-[#0088cc] text-white shadow-sm shadow-sky-500/25 border border-[#0088cc] font-extrabold"
                  : "bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>
                School
                <br />
                Branding Profile
              </span>
            </button>

            {/* Tab 3: Campus Configuration */}
            <button
              type="button"
              onClick={() => setActiveTab("campus")}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[44px] text-center leading-tight shrink-0 ${
                activeTab === "campus"
                  ? "bg-[#0088cc] text-white shadow-sm shadow-sky-500/25 border border-[#0088cc] font-extrabold"
                  : "bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>
                Campus
                <br />
                Configuration ({campuses.length})
              </span>
            </button>

            {/* Tab 4: Academic Year Configuration */}
            <button
              type="button"
              onClick={() => setActiveTab("academic-year")}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[44px] text-center leading-tight shrink-0 ${
                activeTab === "academic-year"
                  ? "bg-[#0088cc] text-white shadow-sm shadow-sky-500/25 border border-[#0088cc] font-extrabold"
                  : "bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>
                Academic Year
                <br />
                Configuration ({(academicYears || []).length})
              </span>
            </button>

            {/* Tab 5: Certificate Templates */}
            <button
              type="button"
              onClick={() => setActiveTab("certificates")}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[44px] text-center leading-tight shrink-0 ${
                activeTab === "certificates"
                  ? "bg-[#0088cc] text-white shadow-sm shadow-sky-500/25 border border-[#0088cc] font-extrabold"
                  : "bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>
                Certificate
                <br />
                Templates ({certificateTemplates.length})
              </span>
            </button>

            {/* Tab 6: Automated ID Settings */}
            <button
              type="button"
              onClick={() => setActiveTab("automated-ids")}
              className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[44px] text-center leading-tight shrink-0 ${
                activeTab === "automated-ids"
                  ? "bg-[#0088cc] text-white shadow-sm shadow-sky-500/25 border border-[#0088cc] font-extrabold"
                  : "bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
              }`}
            >
              <span>
                Automated
                <br />
                ID Settings
              </span>
            </button>

            {/* Tab 7: Backup & Restore */}
            <button
              type="button"
              onClick={() => setActiveTab("backup")}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[44px] text-center leading-tight shrink-0 ${
                activeTab === "backup"
                  ? "bg-[#0088cc] text-white shadow-sm shadow-sky-500/25 border border-[#0088cc] font-extrabold"
                  : "bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
              }`}
            >
              <span>
                Backup &<br />
                Restore
              </span>
            </button>

            {/* Tab 8: System Audit Logs */}
            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[44px] text-center leading-tight shrink-0 ${
                activeTab === "audit"
                  ? "bg-[#0088cc] text-white shadow-sm shadow-sky-500/25 border border-[#0088cc] font-extrabold"
                  : "bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
              }`}
            >
              <span>
                System
                <br />
                Audit Logs ({auditLogs.length})
              </span>
            </button>
          </>
        )}
      </div>

      {/* TAB 0: PERSONAL BASIC DETAILS & PHOTO (FOR ALL ROLES INCLUDING WARDEN & ADMIN) */}
      {activeTab === "my-profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Basic Details Form Card */}
          <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-brand-600" /> Basic Details
                  & Profile Setup
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Update your personal information, profile photo avatar, and
                  contact details.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {myProfileForm.role}
              </span>
            </div>

            <form onSubmit={handleSaveMyProfile} className="space-y-5 text-xs">
              {/* Profile Photo Uploader */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 space-y-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Profile Photo / Avatar{" "}
                  <span className="text-rose-500 font-bold">*</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group">
                    <img
                      src={resolveMediaUrl(myProfileForm.avatar) || DEFAULT_USER_AVATAR}
                      alt="Profile Avatar"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== DEFAULT_USER_AVATAR) {
                          target.src = DEFAULT_USER_AVATAR;
                        }
                      }}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-500 shadow-md bg-white dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md cursor-pointer transition-transform group-hover:scale-110"
                      title="Upload New Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={avatarFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-brand-600" /> Upload
                        Profile Image
                      </button>
                      {myProfileForm.avatar && (
                        <button
                          type="button"
                          onClick={() =>
                            setMyProfileForm((prev) => ({
                              ...prev,
                              avatar: "",
                            }))
                          }
                          className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold text-xs transition cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Supports JPG, PNG, WEBP files up to 5MB. Click upload or
                      change button.
                    </p>
                  </div>
                </div>

                {/* Optional Image URL Input */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Or Enter Photo URL Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={
                      myProfileForm.avatar?.startsWith("data:") ||
                      myProfileForm.avatar?.startsWith("/uploads/")
                        ? ""
                        : myProfileForm.avatar
                    }
                    onChange={(e) =>
                      setMyProfileForm({
                        ...myProfileForm,
                        avatar: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={myProfileForm.name}
                    onChange={(e) =>
                      setMyProfileForm({
                        ...myProfileForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address{" "}
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="warden@pirnavschools.edu"
                    value={myProfileForm.email}
                    onChange={(e) =>
                      setMyProfileForm({
                        ...myProfileForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={myProfileForm.phone}
                    onChange={(e) =>
                      setMyProfileForm({
                        ...myProfileForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Campus / Branch Assignment
                  </label>
                  <select
                    value={myProfileForm.branch}
                    onChange={(e) =>
                      setMyProfileForm({
                        ...myProfileForm,
                        branch: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  >
                    <option value="Main Campus">Main Campus</option>
                    <option value="North Branch">North Branch</option>
                    <option value="West Campus">West Campus</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={myProfileForm.role}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                    Active Account
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isSavingProfile ? "Saving..." : "Save Basic Details"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Password & Account Security Card */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center border border-amber-100 dark:border-amber-900">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Account Security
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Update your login password
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleUpdatePassword}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5" /> Update Password
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
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Tagline / Motto
              </label>
              <input
                type="text"
                value={profileForm.tagline}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, tagline: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Full Address</label>
              <textarea
                rows={2}
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
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Website URL</label>
                <input
                  type="text"
                  value={profileForm.website}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, website: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Principal Name
                </label>
                <input
                  type="text"
                  value={profileForm.principalName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      principalName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
            </div>
            <div className="pt-2">
              <SchoolLogoUploader
                value={profileForm.logoUrl || ""}
                onChange={(newLogoUrl) =>
                  setProfileForm((prev) => ({ ...prev, logoUrl: newLogoUrl }))
                }
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
                  placeholder="e.g. North Branch"
                  value={campusForm.name}
                  onChange={(e) =>
                    setCampusForm({ ...campusForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Code{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NORTH"
                  value={campusForm.code}
                  onChange={(e) =>
                    setCampusForm({
                      ...campusForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
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
                    placeholder="+1 555-..."
                    value={campusForm.phone}
                    onChange={(e) =>
                      setCampusForm({ ...campusForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="campus@domain.com"
                    value={campusForm.email}
                    onChange={(e) =>
                      setCampusForm({ ...campusForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Status
                </label>
                <select
                  value={campusForm.status}
                  onChange={(e) =>
                    setCampusForm({
                      ...campusForm,
                      status: e.target.value as "Active" | "Inactive",
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="Active">
                    Active (Displays in Header Selector)
                  </option>
                  <option value="Inactive">
                    Inactive (Hidden from Header Selector)
                  </option>
                </select>
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
                  onChange={(e) =>
                    setAyForm({ ...ayForm, academicYear: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
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
                  Session Status
                </label>
                <select
                  value={ayForm.status}
                  onChange={(e) =>
                    setAyForm({ ...ayForm, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold cursor-pointer"
                >
                  <option value="Active">Active Session</option>
                  <option value="Upcoming">Upcoming Session</option>
                  <option value="Closed">Closed Session</option>
                </select>
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
