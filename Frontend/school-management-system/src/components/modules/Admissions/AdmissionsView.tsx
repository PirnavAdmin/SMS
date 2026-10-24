// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { createAllocation, formatRoomNumber } from "../../../api/hostel";
import { downloadFeeSummaryPdf } from "../../../utils/feeSummaryPdf";
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  UserCheck,
  Loader2,
  X,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  XCircle,
  ArrowLeft,
  Camera,
  User,
  Shield,
  Home,
  Bus,
  Calculator,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  BookOpen,
  Heart,
  Info,
  Upload,
  UploadCloud,
  FileSpreadsheet,
  Download,
  ChevronDown,
  FileText,
  AlertCircle,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import {
  AdmissionApplication,
  StudentType,
  Student,
  SiblingDetail,
} from "../../../types";
import { useData, normalizeToISODate } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import * as FinanceAPI from "../../../api/finance";
import { ConfirmModal } from "../../common/ConfirmModal";
import { DateInput } from "../../common/DateInput";
import { Pagination } from "../../common/Pagination";
import { SchoolPrintHeader } from "../../common/SchoolPrintHeader";
import { lookupPostalCode, getOfflinePostalInfo } from "../../../utils/postalLookup";
import { isClassInRange } from "../../../utils/classSorter";
import {
  validate10DigitPhone,
  validateEmail,
  validateSearchQuery,
  validateHouseNumber,
  validateCity,
  BLOOD_GROUPS,
  CASTE_CATEGORIES,
  RELIGIONS,
  formatTitleCase,
} from "../../../utils/validation";
import {
  validateDOB,
  validateStudentAge,
  formatToDDMMYYYY,
  formatToISO,
} from "../../../utils/dateValidation";
import { getUniformFeeForClass } from "../../../utils/uniformUtils";
import { formatCurrency } from "../../../utils/currency";
import { formatStudentType, normalizeStudentType } from "../../../utils/studentTypeUtils";
import {
  calculateLateAdmissionFees,
  FeeItemInput,
} from "../../../utils/lateAdmission";
import {
  getHostelBlocks,
  getRooms,
  getRoomTypes,
  getAllocations,
  HostelBlock,
  HostelRoom,
  RoomType,
  BedAllocation,
} from "../../../api/hostel";
import { generateNextAdmissionNo, generateNextStudentId } from "../../../utils/idGenerator";

interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  disabled?: boolean;
}

const SearchableCombobox: React.FC<{
  options: ComboboxOption[];
  value: string;
  onChange: (val: string, selectedOpt?: ComboboxOption) => void;
  placeholder?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  allowCustom = true,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOpt = options.find(
    (o) =>
      String(o.value) === String(value) ||
      (value && value !== "N/A" && o.label.toLowerCase() === String(value).toLowerCase())
  );

  useEffect(() => {
    if (selectedOpt) {
      setSearchText(selectedOpt.label);
    } else if (value && value !== "N/A" && value !== "none") {
      setSearchText(value);
    } else {
      setSearchText("");
    }
  }, [value, selectedOpt]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsUserTyping(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    if (!isUserTyping) return true;
    if (!searchText.trim() || searchText === "N/A" || searchText === "none") return true;
    if (selectedOpt && searchText === selectedOpt.label) return true;
    const q = searchText.toLowerCase().trim();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subLabel || "").toLowerCase().includes(q) ||
      String(opt.value).toLowerCase() === q
    );
  });

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className="relative cursor-pointer"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        <input
          type="text"
          disabled={disabled}
          value={searchText}
          onFocus={() => {
            setIsOpen(true);
            if (searchText === "N/A" || searchText === "none") {
              setSearchText("");
            }
          }}
          onChange={(e) => {
            const val = e.target.value;
            setSearchText(val);
            setIsUserTyping(true);
            setIsOpen(true);
            if (allowCustom) {
              onChange(val);
            } else if (!val) {
              onChange("");
            }
          }}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
        />
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer pointer-events-none" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1 space-y-0.5 custom-scrollbar">
          {filteredOptions.length === 0 ? (
            allowCustom && searchText.trim() && searchText !== "N/A" ? (
              <button
                type="button"
                onClick={() => {
                  onChange(searchText.trim());
                  setIsUserTyping(false);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950 flex items-center justify-between"
              >
                <span>Use custom: "{searchText}"</span>
                <span className="text-[10px] bg-sky-100 dark:bg-sky-900 px-2 py-0.5 rounded-full">
                  Custom
                </span>
              </button>
            ) : (
              <div className="px-3 py-3 text-center text-xs text-slate-400 font-semibold">
                No matching options
              </div>
            )
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={`combobox_opt_${opt.value}_${idx}`}
                  type="button"
                  disabled={opt.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (opt.disabled) return;
                    onChange(opt.value, opt);
                    setSearchText(opt.label);
                    setIsUserTyping(false);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                    opt.disabled
                      ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 text-slate-400"
                      : isSelected
                        ? "bg-sky-50 dark:bg-sky-950/70 text-sky-600 font-extrabold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  }`}
                >
                  <div className="truncate">
                    <span className="font-bold">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-extrabold text-sky-600 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full shrink-0 ml-1">
                      ✓ Selected
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

interface AdmissionsViewProps {
  onSelectStudentProfile?: (student: Student) => void;
  onNavigate?: (module: string) => void;
  initialFormOpen?: boolean;
}

export const AdmissionsView: React.FC<AdmissionsViewProps> = ({
  onNavigate,
  initialFormOpen,
}) => {
  const {
    admissions,
    fetchAdmissions,
    addAdmission,
    updateAdmission,
    deleteAdmission,
    updateAdmissionStatus,
    fetchStudents,
    students,
    routeMasters,
    pickupPoints,
    vehicleAssignments,
    vehicleMasters,
    getStudentFeeLedger,
    dynamicFeeStructures,
    allDynamicFeeStructures,
    financeTransportConfigs,
    financeUniformConfigs,
    hostelMasters,
    hostelBlocks,
    hostelRooms,
    financeHostelConfigs,
    roomMasters,
    studentHostelAssignments,
    scholarships,
    discounts,
    roomTypeMasters,
    academicClasses,
    feeHeads,
    academicYearFeeSchedules,
    schoolProfile,
    branches = [],
    fetchBranches,
    fetchFinanceData,
    feePayments,
    addFeePayment,
  } = useData();
  const { addToast } = useToast();
  const { selectedBranch, selectedAcademicYear } = useAuth();

  useEffect(() => {
    if (typeof fetchAdmissions === "function") {
      fetchAdmissions();
    }
    if (typeof fetchFinanceData === "function") {
      fetchFinanceData().catch(() => {});
    }
  }, [selectedBranch, selectedAcademicYear]);

  const dynamicCampuses = useMemo(() => {
    const fromApi = (branches || [])
      .filter((b: any) => b && (typeof b === "string" || b.status !== "Inactive"))
      .map((b: any) => typeof b === "string" ? b : (b.name || b.branchName || b.campusName || ""))
      .filter(Boolean);
    const combined = [
      ...(selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" ? [selectedBranch] : []),
      ...fromApi,
    ];
    const unique = Array.from(new Set(combined)).filter(Boolean);
    return unique;
  }, [branches, selectedBranch]);

  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [filterClass, setFilterClass] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val) {
      setSearchError(undefined);
    } else {
      const validation = validateSearchQuery(val);
      setSearchError(validation.isValid ? undefined : validation.error);
    }
  };

  // Reset pagination on search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterClass, filterStatus]);

  // View States: Table View vs Full-Page Form View
  const [isFormView, setIsFormView] = useState(initialFormOpen || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialFormOpen) {
      setIsFormView(true);
    }
  }, [initialFormOpen]);

  const handleCloseForm = () => {
    setIsFormView(false);
    setEditingApp(null);
    setIsSubmitting(false);
    setIsSubmittingForm(false);

    // Reset Form Inputs
    setFirstName("");
    setLastName("");
    setAvatar("");
    setHasSiblings(false);
    setSiblingsCount(1);
    setSiblingDetails([]);
    setPhoneError("");
    setMotherPhoneError("");
    setAltPhoneError("");
    setDobError(null);
    setAdmissionDateError("");
    setPinCodeError("");
    setHouseNoError("");
    setCityError("");
    setFormData({
      appliedClass: "Select Class",
      section: "Unassigned",
      gender: "",
      dob: "",
      bloodGroup: "",
      religion: "General",
      casteCategory: "",
      parentName: "",
      motherName: "",
      email: "",
      phone: "",
      addressHouseNo: "",
      addressStreet: "",
      addressArea: "",
      addressCity: "",
      addressDistrict: "",
      addressState: "",
      addressPinCode: "",
      studentType: "Non-Residential",
      transportRequired: false,
      transportType: "",
      busRoute: "",
      pickupPoint: "",
      dropPoint: "",
      hostelBlock: "",
      floor: "",
      hostelRoom: "",
      hostelBed: "",
    hostelSecurityDepositPaid: false,
    securityDepositAmount: 0,
    securityDepositReceiptNo: "",
    securityDepositPaymentMode: "Cash",
    securityDepositTxnId: "",
    securityDepositDate: new Date().toISOString().split("T")[0],
      branch: selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" ? selectedBranch : (dynamicCampuses[0] || ""),
      branch: (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" && dynamicCampuses.includes(selectedBranch))
        ? selectedBranch
        : (dynamicCampuses[0] || ""),
      scholarshipId: "",
      discountId: "",
      selectedOptionalFees: [],
      joiningDate: new Date().toISOString().split("T")[0],
      admissionDate: new Date().toISOString().split("T")[0],
      isLateAdmission: false,
      feeCalculationMethod: "Term-wise",
      documentsSubmitted: [],
    });

    if (onNavigate) {
      onNavigate("admissions");
    }
  };

  const [editingApp, setEditingApp] = useState<AdmissionApplication | null>(
    null,
  );
  const [deletingApp, setDeletingApp] = useState<AdmissionApplication | null>(
    null,
  );
  const [selectedAppForView, setSelectedAppForView] =
    useState<AdmissionApplication | null>(null);
  const [confirmingApp, setConfirmingApp] = useState<{
    app: AdmissionApplication;
    status: AdmissionApplication["status"];
  } | null>(null);
  const [isStatusUpdateLoading, setIsStatusUpdateLoading] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [feeSummaryStudentId, setFeeSummaryStudentId] = useState<string | null>(
    null,
  );
  const [feeSummaryApp, setFeeSummaryApp] = useState<any | null>(null);

  // Dynamic Hostel States
  const [dynamicHostelBlocks, setDynamicHostelBlocks] = useState<HostelBlock[]>(
    [],
  );
  const [dynamicHostelRooms, setDynamicHostelRooms] = useState<HostelRoom[]>(
    [],
  );
  const [dynamicRoomTypes, setDynamicRoomTypes] = useState<RoomType[]>([]);
  const [dynamicAllocations, setDynamicAllocations] = useState<BedAllocation[]>([]);
  const [loadingHostels, setLoadingHostels] = useState(false);  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const bulkFileInputRef = React.useRef<HTMLInputElement>(null);

  const openBulkModal = () => {
    setSelectedFile(null);
    setIsDragging(false);
    setIsUploading(false);
    setUploadProgress(0);
    setIsBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    if (isUploading) return;
    setIsBulkModalOpen(false);
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "FirstName",
      "LastName",
      "AppliedClass",
      "Gender",
      "Campus",
      "DOB",
      "BloodGroup",
      "Religion",
      "CasteCategory",
      "DateOfAdmission",
      "FatherFullName",
      "MotherFullName",
      "FatherMobile",
      "MotherMobile",
      "AlternateMobile",
      "Email",
      "HouseNo",
      "Street",
      "Area",
      "City",
      "District",
      "State",
      "Pincode",
      "StudentType",
      "TransportRequired",
      "BusRoute",
      "PickupPoint"
    ].join(",");

    const sampleRow = [
      "Alexander",
      "Wright",
      "Class 1",
      "Male",
      selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" ? selectedBranch : (dynamicCampuses[0] || ""),
      selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" && dynamicCampuses.includes(selectedBranch) ? selectedBranch : (dynamicCampuses[0] || ""),
      "15-08-2018",
      "O+",
      "Christianity",
      "General",
      "21-08-2026",
      "Robert Wright",
      "Sarah Wright",
      "9876543210",
      "9876543211",
      "9876543212",
      "alexander.wright@gmail.com",
      "12-A",
      "Main Street",
      "North Suburbs",
      "Metropolis",
      "Central",
      "State",
      "600001",
      "Non-Residential",
      "No",
      "",
      ""
    ].join(",");

    const csvContent = `${headers}\n${sampleRow}\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "admission_application_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("info", "Template Downloaded", "Sample CSV upload template ready.");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv")
      ) {
        setSelectedFile(file);
      } else {
        addToast("error", "Invalid File Format", "Only .xlsx, .xls, and .csv files are supported.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv")
      ) {
        setSelectedFile(file);
      } else {
        addToast("error", "Invalid File Format", "Only .xlsx, .xls, and .csv files are supported.");
      }
    }
  };

  const handleStartBulkUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();

      reader.onload = async (evt) => {
        try {
          setUploadProgress(30);
          const buffer = evt.target?.result as ArrayBuffer;
          const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });

          let targetSheet: any = null;
          let data: any[] = [];
          for (const name of workbook.SheetNames) {
            const s = workbook.Sheets[name];
            const rows = XLSX.utils.sheet_to_json(s) as any[];
            if (rows && rows.length > 0) {
              targetSheet = s;
              data = rows;
              break;
            }
          }

          if (!targetSheet || data.length === 0) {
            setIsUploading(false);
            setUploadProgress(0);
            addToast("error", "Empty File", "The uploaded file contains no data rows.");
            return;
          }

          setUploadProgress(50);

          // Helper to get case-insensitive and punctuation-insensitive values from a row
          const getField = (row: any, ...keys: string[]): string => {
            const rowKeys = Object.keys(row);
            for (const key of keys) {
              const cleanTarget = key.toLowerCase().replace(/[\s_\-]+/g, "");
              const matchedKey = rowKeys.find(
                (rk) => rk.toLowerCase().replace(/[\s_\-]+/g, "") === cleanTarget
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                const val = String(row[matchedKey]).trim();
                if (val.length > 0) return val;
              }
            }
            return "";
          };

          const parseDateValue = (rawVal: any, defaultDate: string): string => {
            if (!rawVal) return defaultDate;
            if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
              return rawVal.toISOString().split("T")[0];
            }
            if (typeof rawVal === "number") {
              const utcDays = Math.floor(rawVal - 25569);
              const d = new Date(utcDays * 86400 * 1000);
              if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
            }
            const s = String(rawVal).trim();
            const parts = s.split(/[-/]/);
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
              }
              if (parts[2].length === 4) {
                return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
              }
            }
            return s || defaultDate;
          };

          let count = 0;
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const directName = getField(row, "applicantName", "studentName", "fullName", "name", "candidateName");
            const fn = getField(row, "firstName", "first");
            const ln = getField(row, "lastName", "last", "surname");
            const name = directName || `${fn} ${ln}`.trim() || fn || ln;

            if (name) {
              const dobRawKey = Object.keys(row).find(
                (rk) => ["dob", "dateofbirth", "birthdate"].includes(rk.toLowerCase().replace(/[\s_\-]+/g, ""))
              );
              const rowDob = parseDateValue(dobRawKey ? row[dobRawKey] : null, "2018-08-15");

              const admDateRawKey = Object.keys(row).find(
                (rk) => ["dateofadmission", "admissiondate", "joiningdate"].includes(rk.toLowerCase().replace(/[\s_\-]+/g, ""))
              );
              const rowAdmDate = parseDateValue(admDateRawKey ? row[admDateRawKey] : null, new Date().toISOString().split("T")[0]);

              const rowSection = getField(row, "section", "sec") || "A";
              const rawStatus = getField(row, "status");
              const rowStatus = rawStatus ? (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase()) : "Enrolled";
              const rowClass = getField(row, "appliedClass", "class", "className", "grade", "standard") || "Class 1";
              
              const defaultActiveBranch = selectedBranch && selectedBranch !== "All Branches" && selectedBranch !== "All" && dynamicCampuses.includes(selectedBranch) ? selectedBranch : (dynamicCampuses[0] || "");
              let rowBranch = getField(row, "campus", "branch", "campusLocation", "location");
              if (!rowBranch) {
                rowBranch = defaultActiveBranch;
              }
              const rowAcademicYear = getField(row, "academicYear", "year") || selectedAcademicYear || "";

              const newApp = {
                applicantName: name,
                appliedClass: rowClass,
                section: rowSection,
                gender: getField(row, "gender", "sex") || "Male",
                dob: rowDob,
                bloodGroup: getField(row, "bloodGroup", "blood") || "O+",
                religion: getField(row, "religion") || "General",
                casteCategory: getField(row, "casteCategory", "caste", "category") || "General",
                parentName: getField(row, "fatherFullName", "parentName", "fatherName", "father") || "Not Provided",
                motherName: getField(row, "motherFullName", "motherName", "mother") || "Not Provided",
                phone: getField(row, "fatherMobile", "phone", "mobile", "contact", "mobileNumber", "fatherContact") || "9876543210",
                motherPhone: getField(row, "motherMobile", "motherPhone"),
                alternatePhone: getField(row, "alternateMobile", "alternatePhone", "emergencyContact"),
                email: getField(row, "email", "parentEmail"),
                addressHouseNo: getField(row, "houseNo", "doorNo", "flatNo"),
                addressStreet: getField(row, "street", "address").slice(0, 60),
                addressArea: getField(row, "area", "locality"),
                addressCity: getField(row, "city"),
                addressDistrict: getField(row, "district"),
                addressState: getField(row, "state"),
                addressPinCode: getField(row, "pincode", "pinCode", "postalCode", "zip").replace(/\D/g, "").slice(0, 6),
                branch: rowBranch,
                academicYear: rowAcademicYear,
                status: rowStatus,
                studentType: normalizeStudentType(getField(row, "studentType", "type")),
                transportRequired: Boolean(
                  getField(row, "transportRequired", "transport").toLowerCase() === "yes" ||
                  getField(row, "transportRequired", "transport").toLowerCase() === "true"
                ),
                busRoute: getField(row, "busRoute", "route"),
                pickupPoint: getField(row, "pickupPoint", "pickup"),
                joiningDate: rowAdmDate,
                admissionDate: rowAdmDate,
                submissionDate: new Date().toISOString(),
              } as unknown as Omit<
                AdmissionApplication,
                "id" | "applicationNo"
              >;

              try {
                await addAdmission(newApp, { silent: true });
                count++;
              } catch (rowErr) {
                console.warn(`[BulkUpload] Error registering row ${i + 1} (${name}):`, rowErr);
              }
            }
            setUploadProgress(50 + Math.round(((i + 1) / data.length) * 45));
          }

          setUploadProgress(100);
          if (typeof fetchAdmissions === "function") {
            await fetchAdmissions();
          }
          if (typeof fetchStudents === "function") {
            await fetchStudents();
          }
          window.dispatchEvent(new Event('storage'));

          // Reset filters so newly added records are immediately visible in the grid
          setFilterClass("All");
          setFilterStatus("All");
          setQuery("");
          setCurrentPage(1);

          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            closeBulkModal();

            if (count > 0) {
              addToast(
                "success",
                "Bulk Upload Complete",
                `Successfully registered ${count} admission application(s).`
              );
            } else {
              addToast(
                "warning",
                "Bulk Upload Finished",
                "No valid admission records could be registered. Please check that column headers match the template."
              );
            }
          }, 400);
        } catch (err) {
          console.error(err);
          setIsUploading(false);
          setUploadProgress(0);
          addToast("error", "Upload Failed", "Failed to parse Excel file.");
        }
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      setUploadProgress(0);
      addToast("error", "Upload Failed", "Error processing bulk upload.");
    }
  };

  useEffect(() => {
    if (isFormView) {
      setLoadingHostels(true);
      Promise.all([
        getHostelBlocks().catch(() => []),
        getRooms().catch(() => []),
        getRoomTypes().catch(() => []),
        getAllocations().catch(() => []),
      ])
        .then(([blocks, rooms, roomTypes, allocs]) => {
          setDynamicHostelBlocks(Array.isArray(blocks) ? blocks : []);
          setDynamicHostelRooms(Array.isArray(rooms) ? rooms : []);
          setDynamicRoomTypes(Array.isArray(roomTypes) ? roomTypes : []);
          setDynamicAllocations(Array.isArray(allocs) ? allocs : []);
        })
        .catch((err) => {
          console.warn("Dynamic hostel data unavailable:", err?.message || err);
        })
        .finally(() => {
          setLoadingHostels(false);
        });
    }
  }, [isFormView]);

  // Form Fields State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isCustomCasteCategory, setIsCustomCasteCategory] = useState(false);
  const [hasSiblings, setHasSiblings] = useState<boolean>(false);
  const [siblingsCount, setSiblingsCount] = useState<number>(1);
  const [siblingDetails, setSiblingDetails] = useState<SiblingDetail[]>([]);
  const [siblingStudentIds, setSiblingStudentIds] = useState<string[]>([]);
  const [activeSiblingDropdownIdx, setActiveSiblingDropdownIdx] = useState<
    number | null
  >(null);
  const [siblingSearchQuery, setSiblingSearchQuery] = useState("");
  const [depositPaymentMode, setDepositPaymentMode] = useState<string>("Cash");
  const [depositTxnId, setDepositTxnId] = useState<string>("");
  const [depositDate, setDepositDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const [formData, setFormData] = useState<Partial<AdmissionApplication>>({
    appliedClass: "",
    section: "Unassigned",
    gender: "" as any,
    dob: "",
    bloodGroup: "",
    religion: "",
    casteCategory: "",
    parentName: "",
    motherName: "",
    email: "",
    phone: "",
    addressHouseNo: "",
    addressStreet: "",
    addressArea: "",
    addressCity: "",
    addressDistrict: "",
    addressState: "",
    addressPinCode: "",
    siblingsCount: 0,
    siblingStudentId: "",
    studentType: "" as any,
    transportRequired: false,
    transportType: "" as any,
    busRoute: "",
    pickupPoint: "",
    hostelBlock: "",
    floor: "",
    hostelRoom: "",
    hostelBed: "",
    hostelSecurityDepositPaid: false,
    securityDepositAmount: 0,
    securityDepositReceiptNo: "",
    securityDepositPaymentMode: "Cash",
    securityDepositTxnId: "",
    securityDepositDate: new Date().toISOString().split("T")[0],
    branch: (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" && dynamicCampuses.includes(selectedBranch))
      ? selectedBranch
      : (dynamicCampuses[0] || ""),
    joiningDate: new Date().toISOString().split("T")[0],
    admissionDate: new Date().toISOString().split("T")[0],
    isLateAdmission: false,
    feeCalculationMethod: "Term-wise",
    selectedOptionalFees: [],
    documentsSubmitted: [],
  });

  const isSiblingConcession = (name?: string, category?: string) => {
    if (!name) return false;
    const n = name.toLowerCase();
    const c = (category || "").toLowerCase();
    return n.includes("sibling") || c.includes("sibling");
  };

  const hasExistingEnrolledSibling = Boolean(
    hasSiblings &&
    siblingDetails.some((d) => d.isExisting && Boolean(d.studentId)),
  );

  // Robust Hostel Combination & Matching Helpers (Supports API & Local Mock Fallback)
  const combinedHostelBlocks = useMemo(() => {
    const list: { id: string; name: string; type: string; rawId: any }[] = [];
    if (dynamicHostelBlocks && dynamicHostelBlocks.length > 0) {
      dynamicHostelBlocks.forEach((b: any) => {
        const blkId = b.hostelId != null ? String(b.hostelId) : b.id != null ? String(b.id) : "";
        if (!blkId) return;
        list.push({
          id: blkId,
          name: b.hostelName || b.name || `Hostel ${blkId}`,
          type: b.hostelType || "Mixed",
          rawId: b.hostelId ?? b.id,
        });
      });
    }
    if (hostelMasters && hostelMasters.length > 0) {
      hostelMasters.forEach((h: any) => {
        const hId = h.id != null ? String(h.id) : h.hostelId != null ? String(h.hostelId) : "";
        if (!hId) return;
        if (
          !list.some(
            (e) =>
              e.id === hId ||
              e.name.toLowerCase() ===
                (h.hostelName || h.name || "").toLowerCase(),
          )
        ) {
          list.push({
            id: hId,
            name: h.hostelName || h.name || "Hostel Block",
            type: h.hostelType || "Mixed",
            rawId: h.id ?? h.hostelId,
          });
        }
      });
    }
    if (hostelBlocks && hostelBlocks.length > 0) {
      hostelBlocks.forEach((hb: any) => {
        const hbId = hb.id != null ? String(hb.id) : hb.hostelId != null ? String(hb.hostelId) : "";
        if (!hbId) return;
        if (
          !list.some(
            (e) =>
              e.id === hbId || e.name.toLowerCase() === (hb.name || "").toLowerCase(),
          )
        ) {
          list.push({
            id: hbId,
            name: hb.name || `Hostel ${hbId}`,
            type: "Mixed",
            rawId: hb.id ?? hb.hostelId,
          });
        }
      });
    }
    return list;
  }, [dynamicHostelBlocks, hostelMasters, hostelBlocks]);

  const selectedBlockObj = useMemo(() => {
    if (!formData.hostelBlock) return null;
    const target = String(formData.hostelBlock).trim().toLowerCase();
    if (!target) return null;
    return (
      combinedHostelBlocks.find(
        (b) =>
          String(b.id || "").toLowerCase() === target ||
          String(b.name || "").toLowerCase() === target ||
          String(b.rawId ?? "").toLowerCase() === target,
      ) || null
    );
  }, [formData.hostelBlock, combinedHostelBlocks]);

  const combinedHostelRooms = useMemo(() => {
    const list: {
      id: string;
      blockId: string;
      blockName: string;
      roomNumber: string;
      roomTypeId: any;
      specification: string;
      capacity: number;
      rawId: any;
    }[] = [];

    if (dynamicHostelRooms && dynamicHostelRooms.length > 0) {
      dynamicHostelRooms.forEach((r: any) => {
        const rmId = r.roomId != null ? String(r.roomId) : r.id != null ? String(r.id) : "";
        const bId = r.hostelId != null ? String(r.hostelId) : r.blockId != null ? String(r.blockId) : "";
        if (!rmId) return;
        list.push({
          id: rmId,
          blockId: bId,
          blockName: r.hostelName || r.blockName || "",
          roomNumber: r.roomNumber || r.roomNo || rmId,
          roomTypeId: r.roomTypeId,
          specification: r.roomTypeSpecification || "Standard Room",
          capacity: r.bedCapacity || r.capacity || 2,
          rawId: r.roomId ?? r.id,
        });
      });
    }

    if (hostelRooms && hostelRooms.length > 0) {
      hostelRooms.forEach((hr: any) => {
        const rmId = hr.id != null ? String(hr.id) : hr.roomId != null ? String(hr.roomId) : "";
        const bId = hr.hostelId != null ? String(hr.hostelId) : hr.blockId != null ? String(hr.blockId) : "";
        if (!rmId) return;
        if (
          !list.some(
            (e) =>
              e.id === rmId || e.roomNumber === (hr.roomNumber || hr.roomNo),
          )
        ) {
          list.push({
            id: rmId,
            blockId: bId,
            blockName: hr.blockName || hr.hostelName || "",
            roomNumber: hr.roomNumber || hr.roomNo || "101",
            roomTypeId: 1,
            specification: hr.roomType || hr.roomTypeSpecification || "Standard Room",
            capacity: hr.capacity || hr.bedCapacity || 2,
            rawId: hr.id ?? hr.roomId,
          });
        }
      });
    }

    return list;
  }, [dynamicHostelRooms, hostelRooms]);

  const availableRoomsForSelectedBlock = useMemo(() => {
    if (!selectedBlockObj) return combinedHostelRooms;
    const rawIdStr = selectedBlockObj.rawId != null ? String(selectedBlockObj.rawId) : "";
    return combinedHostelRooms.filter(
      (r) =>
        r.blockId === selectedBlockObj.id ||
        (rawIdStr && r.blockId === rawIdStr) ||
        (selectedBlockObj.name &&
          r.blockName &&
          r.blockName.toLowerCase() === selectedBlockObj.name.toLowerCase()),
    );
  }, [selectedBlockObj, combinedHostelRooms]);

  const selectedRoomObj = useMemo(() => {
    if (!formData.hostelRoom) return null;
    const target = String(formData.hostelRoom).trim().toLowerCase();
    if (!target) return null;
    return (
      availableRoomsForSelectedBlock.find(
        (r) =>
          String(r.id || "").toLowerCase() === target ||
          String(r.roomNumber || "").toLowerCase() === target ||
          String(r.rawId ?? "").toLowerCase() === target,
      ) ||
      combinedHostelRooms.find(
        (r) =>
          String(r.id || "").toLowerCase() === target ||
          String(r.roomNumber || "").toLowerCase() === target ||
          String(r.rawId ?? "").toLowerCase() === target,
      ) ||
      null
    );
  }, [
    formData.hostelRoom,
    availableRoomsForSelectedBlock,
    combinedHostelRooms,
  ]);

  const availableBedsForSelectedRoom = useMemo(() => {
    const cap = selectedRoomObj ? selectedRoomObj.capacity : 4;
    return Array.from({ length: cap }, (_, idx) => `BED-${idx + 1}`);
  }, [selectedRoomObj]);

  const selectedBedValue = useMemo(() => {
    if (!formData.hostelBed) return "";
    const target = String(formData.hostelBed).trim();
    if (!target) return "";
    const match = availableBedsForSelectedRoom.find(
      (b) =>
        b.toLowerCase() === target.toLowerCase() ||
        b.replace("BED-", "") === target.replace("BED-", ""),
    );
    return match || formData.hostelBed;
  }, [formData.hostelBed, availableBedsForSelectedRoom]);

  const isResidentialStudent =
    formData.studentType === "Residential" ||
    (formData.studentType as any) === "Hosteller";

  const applicableHostelFeeConfig = useMemo(() => {
    if (!isResidentialStudent) return null;
    const studentClass = formData.appliedClass || formData.className || "";

    const userSharing = (
      formData.hostelSharing ||
      formData.roomSharing ||
      formData.sharingType ||
      "Four Sharing"
    ).toLowerCase();

    const userAc = (
      formData.hostelAc ||
      formData.acType ||
      "Non-AC"
    ).toLowerCase();

    const activeConfigs = (financeHostelConfigs || []).filter(
      (c) => !c.status || c.status === "Active",
    );

    // 1. Exact match: class in range + sharing + AC
    let matched = activeConfigs.find((c) => {
      if (studentClass && !isClassInRange(studentClass, c.startClass, c.endClass, c.classRange, academicClasses)) {
        return false;
      }
      const cShare = (c.sharingType || c.roomTypeName || "").toLowerCase();
      const shareMatch = !cShare || cShare === "all" || cShare.includes(userSharing) || userSharing.includes(cShare);
      const cAc = (c.acType || "").toLowerCase();
      const acMatch = !cAc || cAc === "all" || cAc === userAc || (userAc === "ac" ? cAc.includes("ac") && !cAc.includes("non") : cAc.includes("non"));
      return shareMatch && acMatch;
    });

    // 2. Class in range + sharing
    if (!matched) {
      matched = activeConfigs.find((c) => {
        if (studentClass && !isClassInRange(studentClass, c.startClass, c.endClass, c.classRange, academicClasses)) {
          return false;
        }
        const cShare = (c.sharingType || c.roomTypeName || "").toLowerCase();
        return !cShare || cShare === "all" || cShare.includes(userSharing) || userSharing.includes(cShare);
      });
    }

    // 3. Class in range only
    if (!matched) {
      matched = activeConfigs.find((c) => {
        return !studentClass || isClassInRange(studentClass, c.startClass, c.endClass, c.classRange, academicClasses);
      });
    }

    // 4. Any active config
    if (!matched && activeConfigs.length > 0) {
      matched = activeConfigs[0];
    }

    return matched || null;
  }, [
    isResidentialStudent,
    formData.appliedClass,
    formData.className,
    formData.hostelSharing,
    formData.roomSharing,
    formData.sharingType,
    formData.hostelAc,
    formData.acType,
    financeHostelConfigs,
    academicClasses,
  ]);

  const applicableSecurityDeposit = useMemo(() => {
    if (!isResidentialStudent) return 0;
    const configuredDeposit = Number(applicableHostelFeeConfig?.securityDeposit);
    if (!isNaN(configuredDeposit) && configuredDeposit > 0) {
      return configuredDeposit;
    }
    return 0;
  }, [isResidentialStudent, applicableHostelFeeConfig]);

  const handleConfirmSecurityDepositPayment = () => {
    if (applicableSecurityDeposit <= 0) return;
    const genReceiptNo = `REC-SD-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData((prev) => ({
      ...prev,
      hostelSecurityDepositPaid: true,
      securityDepositAmount: applicableSecurityDeposit,
      securityDepositReceiptNo: genReceiptNo,
      securityDepositPaymentMode: depositPaymentMode,
      securityDepositTxnId: depositTxnId,
      securityDepositDate: depositDate || new Date().toISOString().split("T")[0],
    }));
    addToast(
      "success",
      "Security Deposit Paid",
      `Security deposit fee of ${formatCurrency(applicableSecurityDeposit)} recorded. Bed allotment is now unlocked.`,
    );
  };

  const handlePaySecurityDepositRedirect = () => {
    if (applicableSecurityDeposit <= 0) return;
    const applicantFullName =
      `${formData.firstName || ""} ${formData.lastName || ""}`.trim() ||
      formData.studentName ||
      "Student";
    const studentIdentifier =
      formData.admissionNo ||
      formData.registrationNo ||
      formData.applicationNo ||
      (editingApp ? String(editingApp.id) : `ADM-${Date.now()}`);

    const targetPayload = {
      studentId: studentIdentifier,
      admissionNo: studentIdentifier,
      studentName: applicantFullName,
      className: formData.appliedClass || formData.className,
      feeHead: "Hostel Security Deposit",
      feeCategory: "Hostel Fee",
      amount: applicableSecurityDeposit,
      source: "admission_security_deposit",
    };
    sessionStorage.setItem("edu_fee_pay_target", JSON.stringify(targetPayload));
    if (onNavigate) {
      onNavigate("fees");
    } else {
      window.location.hash = "#/finance/fee-collection";
    }
  };

  const handleHasSiblingsChange = (val: boolean) => {
    setHasSiblings(val);
    if (val) {
      const count = siblingsCount >= 1 ? siblingsCount : 1;
      setSiblingsCount(count);
      setSiblingDetails((prev) => {
        if (prev.length >= count) {
          return prev.slice(0, count);
        }
        const newEntries = [...prev];
        while (newEntries.length < count) {
          newEntries.push({ name: "", isExisting: false });
        }
        return newEntries;
      });
      setFormData((prev) => ({
        ...prev,
        hasSiblings: true,
        siblingsCount: count,
      }));
    } else {
      setSiblingsCount(0);
      setSiblingDetails([]);
      setSiblingStudentIds([]);
      setActiveSiblingDropdownIdx(null);
      setFormData((prev) => {
        const next = {
          ...prev,
          hasSiblings: false,
          siblingsCount: 0,
          siblingDetails: [],
          siblingStudentId: "",
          siblingStudentIds: [],
        };
        if (prev.discountId) {
          const selD = discounts.find((d) => d.id === prev.discountId);
          if (selD && isSiblingConcession(selD.name)) {
            next.discountId = undefined;
          }
        }
        if (prev.scholarshipId) {
          const selS = scholarships.find((s) => s.id === prev.scholarshipId);
          if (selS && isSiblingConcession(selS.name)) {
            next.scholarshipId = undefined;
          }
        }
        return next;
      });
    }
  };

  const handleSiblingsCountChange = (valStr: string) => {
    if (valStr === "") {
      setSiblingsCount(0);
      return;
    }
    let num = parseInt(valStr, 10);
    if (isNaN(num) || num < 0) {
      num = 0;
    }
    setSiblingsCount(num);
    if (num > 0) {
      setSiblingDetails((prev) => {
        if (prev.length === num) return prev;
        if (prev.length > num) {
          return prev.slice(0, num);
        }
        const newEntries = [...prev];
        while (newEntries.length < num) {
          newEntries.push({ name: "", isExisting: false });
        }
        return newEntries;
      });
      setFormData((prev) => ({
        ...prev,
        siblingsCount: num,
      }));
    }
  };

  const handleSiblingIsExistingChange = (idx: number, isExisting: boolean) => {
    setSiblingDetails((prev) => {
      const next = [...prev];
      const curr = next[idx] || { name: "", isExisting: false };
      if (!isExisting) {
        next[idx] = {
          ...curr,
          isExisting: false,
          studentId: undefined,
          admissionNo: undefined,
          name: curr.studentId ? "" : curr.name,
        };
      } else {
        next[idx] = {
          ...curr,
          isExisting: true,
        };
      }

      // Check if any existing enrolled sibling remains
      const anyExistingRemains = next.some(
        (d) => d.isExisting && Boolean(d.studentId),
      );
      if (!anyExistingRemains) {
        setFormData((fPrev) => {
          const fNext = { ...fPrev };
          if (fPrev.discountId) {
            const selD = discounts.find((d) => d.id === fPrev.discountId);
            if (selD && isSiblingConcession(selD.name)) {
              fNext.discountId = undefined;
            }
          }
          if (fPrev.scholarshipId) {
            const selS = scholarships.find((s) => s.id === fPrev.scholarshipId);
            if (selS && isSiblingConcession(selS.name)) {
              fNext.scholarshipId = undefined;
            }
          }
          return fNext;
        });
      }

      return next;
    });
  };

  const handleSiblingNameChange = (idx: number, nameVal: string) => {
    setSiblingDetails((prev) => {
      const next = [...prev];
      next[idx] = {
        ...(next[idx] || { isExisting: false }),
        name: nameVal,
      };
      return next;
    });
  };

  const handleSelectExistingStudent = (
    idx: number,
    selectedStudent: Student,
  ) => {
    const isAlreadyChosen = siblingDetails.some(
      (item, i) => i !== idx && item.studentId === selectedStudent.id,
    );
    if (isAlreadyChosen) {
      addToast(
        "warning",
        "Already Selected",
        `${selectedStudent.firstName} ${selectedStudent.lastName} is already selected as a sibling.`,
      );
      return;
    }

    const existingCountOtherSlots = siblingDetails.filter(
      (item, i) => i !== idx && item.isExisting && item.studentId,
    ).length;

    if (existingCountOtherSlots + 1 > siblingsCount) {
      addToast(
        "warning",
        "Limit Reached",
        `You can select a maximum of ${siblingsCount} siblings.`,
      );
      return;
    }

    const sName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
    setSiblingDetails((prev) => {
      const next = [...prev];
      next[idx] = {
        id: selectedStudent.id,
        name: sName,
        isExisting: true,
        studentId: selectedStudent.id,
        admissionNo: selectedStudent.admissionNo,
      };
      return next;
    });
    setActiveSiblingDropdownIdx(null);
    setSiblingSearchQuery("");

    // Auto-apply Sibling Concession if available and no discount selected yet
    const sibDiscount = discounts.find((d) => isSiblingConcession(d.name));
    if (sibDiscount && !formData.discountId) {
      setFormData((prev) => ({ ...prev, discountId: sibDiscount.id }));
      addToast(
        "info",
        "Concession Applied",
        `Sibling Concession (${sibDiscount.name}) auto-applied for existing sibling.`,
      );
    }
  };

  const [isMidYearFeeModalOpen, setIsMidYearFeeModalOpen] = useState(false);

  // Sync isCustomCasteCategory state with casteCategory state
  useEffect(() => {
    if (formData.casteCategory) {
      if (
        formData.casteCategory === "Others" ||
        formData.casteCategory === "Other"
      ) {
        setIsCustomCasteCategory(true);
      } else if (!CASTE_CATEGORIES.includes(formData.casteCategory as any)) {
        setIsCustomCasteCategory(true);
      } else {
        setIsCustomCasteCategory(false);
      }
    } else {
      setIsCustomCasteCategory(false);
    }
  }, [formData.casteCategory]);

  const filteredSiblingStudents = useMemo(() => {
    if (!siblingSearchQuery || siblingSearchQuery.includes("(")) {
      return students;
    }
    const q = siblingSearchQuery.toLowerCase();
    return students.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q),
    );
  }, [siblingSearchQuery, students]);

  const [phoneError, setPhoneError] = useState("");
  const [motherPhoneError, setMotherPhoneError] = useState("");
  const [altPhoneError, setAltPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [dobError, setDobError] = useState("");
  const [admissionDateError, setAdmissionDateError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [pinCodeError, setPinCodeError] = useState("");
  const [houseNoError, setHouseNoError] = useState("");
  const [cityError, setCityError] = useState("");

  const maxDobISO = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }, []);

  const unifiedAdmissions = useMemo(() => {
    return admissions || [];
  }, [admissions]);

  const dynamicClassOptions = useMemo(() => {
    const fromMaster = (academicClasses || [])
      .map((cls) => cls.name || (cls as any).className || "")
      .filter(Boolean);
    const fromAdmissions = (unifiedAdmissions || [])
      .map((a) => a.appliedClass || (a as any).className || "")
      .filter(Boolean);
    const fromStudents = (students || [])
      .map((s) => s.className || (s as any).class || "")
      .filter(Boolean);

    const combined = Array.from(
      new Set([...fromMaster, ...fromAdmissions, ...fromStudents]),
    ).filter(Boolean);

    const getClassWeight = (name: string) => {
      const lower = name.toLowerCase().trim();
      if (lower.includes("nursery") || lower.includes("play")) return 1;
      if (
        lower.includes("lkg") ||
        lower.includes("pp1") ||
        lower.includes("pre-kg")
      )
        return 2;
      if (
        lower.includes("ukg") ||
        lower.includes("pp2") ||
        lower.includes("kg")
      )
        return 3;
      const match = lower.match(/\d+/);
      if (match) return 10 + parseInt(match[0], 10);
      return 100;
    };

    return combined.sort((a, b) => {
      const wA = getClassWeight(a);
      const wB = getClassWeight(b);
      if (wA !== wB) return wA - wB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [academicClasses, unifiedAdmissions, students]);

  const classOptions = dynamicClassOptions;

  const availableSections = useMemo(() => {
    if (!formData.appliedClass || formData.appliedClass === "Select Class") {
      return ["A", "B"];
    }
    const target = formData.appliedClass.trim().toLowerCase();
    const cleanTarget = target.replace(/^class\s+/i, "").replace(/^grade\s+/i, "");

    const matched = (academicClasses || []).find((c) => {
      const cName = (c.name || (c as any).className || "").trim().toLowerCase();
      const cleanCName = cName.replace(/^class\s+/i, "").replace(/^grade\s+/i, "");
      return cName === target || cleanCName === cleanTarget;
    });

    if (matched && Array.isArray(matched.sections) && matched.sections.length > 0) {
      const secs = matched.sections
        .map((s: any) => {
          if (typeof s === "string") return s.trim();
          if (s && typeof s === "object") return (s.sectionName || s.name || "").trim();
          return "";
        })
        .filter(Boolean);
      if (secs.length > 0) {
        return Array.from(new Set(secs));
      }
    }

    return ["A", "B"];
  }, [academicClasses, formData.appliedClass]);

  const handleEmailChange = (val: string) => {
    setFormData((prev) => ({ ...prev, email: val }));
    const res = validateEmail(val, true);
    setEmailError(res.isValid ? "" : res.error || "Email address is required.");
  };

  const handleAltPhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, alternatePhone: cleaned }));

    if (cleaned) {
      if (cleaned === formData.phone) {
        setAltPhoneError(
          "Alternate mobile cannot be identical to Father primary mobile number",
        );
      } else {
        const res = validate10DigitPhone(cleaned);
        setAltPhoneError(res.isValid ? "" : res.error || "Enter a valid 10-digit mobile number.");
      }
    } else {
      setAltPhoneError("");
    }
  };

  const { enrolledCount, unEnrolledCount } = useMemo(() => {
    let enrolled = 0;
    let unEnrolled = 0;
    (unifiedAdmissions || []).forEach((a) => {
      if (!a || a.status === "Deleted" || (a as any).isDeleted) return;
      const st = (a.status || "").toLowerCase().trim();
      if (st === "enrolled" || st === "admitted" || st === "active") {
        enrolled++;
      } else {
        unEnrolled++;
      }
    });
    return { enrolledCount: enrolled, unEnrolledCount: unEnrolled };
  }, [unifiedAdmissions]);

  // Multi-filter filtering
  const filteredAdmissions = (unifiedAdmissions || []).filter((a) => {
    if (!a || a.status === "Deleted" || (a as any).isDeleted) return false;
    const applicantName = a.applicantName || "";
    const applicationNo = a.applicationNo || "";
    const regNo = (a as any).registrationNo || "";
    const admNo = (a as any).admissionNo || "";
    const parentName = a.parentName || "";
    const appliedClass = a.appliedClass || "";
    const status = a.status || "";

    const matchQuery =
      applicantName.toLowerCase().includes((query || "").toLowerCase()) ||
      applicationNo.toLowerCase().includes((query || "").toLowerCase()) ||
      regNo.toLowerCase().includes((query || "").toLowerCase()) ||
      admNo.toLowerCase().includes((query || "").toLowerCase()) ||
      parentName.toLowerCase().includes((query || "").toLowerCase());
    const matchClass =
      filterClass === "All" ||
      appliedClass.toLowerCase().trim() === filterClass.toLowerCase().trim() ||
      appliedClass.toLowerCase().replace("class", "").trim() ===
        filterClass.toLowerCase().replace("class", "").trim();
    const matchStatus =
      filterStatus === "All"
        ? true
        : filterStatus === "Enrolled"
          ? (status.toLowerCase() === "enrolled" || status.toLowerCase() === "admitted" || status.toLowerCase() === "active")
          : filterStatus === "Un-Enrolled"
            ? (status.toLowerCase() !== "enrolled" && status.toLowerCase() !== "admitted" && status.toLowerCase() !== "active")
            : status.toLowerCase() === (filterStatus || "").toLowerCase();
    return matchQuery && matchClass && matchStatus;
  });

  const getClassWeightForSorting = (className: string = "") => {
    const lower = (className || "").toLowerCase().trim();
    if (!lower) return 999;
    if (lower.includes("nursery") || lower.includes("play")) return 1;
    if (lower.includes("lkg") || lower.includes("pp1") || lower.includes("pre-kg")) return 2;
    if (lower.includes("ukg") || lower.includes("pp2") || lower.includes("kg")) return 3;
    const match = lower.match(/\d+/);
    if (match) return 10 + parseInt(match[0], 10);
    return 100;
  };

  const sortedAdmissions = useMemo(() => {
    return [...filteredAdmissions].sort((a, b) => {
      const stA = (a.status || "").toLowerCase().trim();
      const stB = (b.status || "").toLowerCase().trim();
      const isEnrolledA = stA === "enrolled" || stA === "admitted" || stA === "active";
      const isEnrolledB = stB === "enrolled" || stB === "admitted" || stB === "active";

      // 1. Un-enrolled applications display FIRST
      if (isEnrolledA !== isEnrolledB) {
        return isEnrolledA ? 1 : -1;
      }

      // 2. Class-wise order (Nursery -> LKG -> UKG -> Class 1..10)
      const classA = a.appliedClass || "";
      const classB = b.appliedClass || "";
      const weightA = getClassWeightForSorting(classA);
      const weightB = getClassWeightForSorting(classB);
      if (weightA !== weightB) {
        return weightA - weightB;
      }

      // 3. Class-wise A-Z order by Student / Applicant Name
      const nameA = (a.applicantName || "").trim();
      const nameB = (b.applicantName || "").trim();
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [filteredAdmissions]);

  const totalPages = Math.ceil(sortedAdmissions.length / pageSize) || 1;
  const paginated = sortedAdmissions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleOpenAdd = () => {
    setEditingApp(null);
    setFirstName("");
    setLastName("");
    setAvatar("");
    setSiblingSearchQuery("");
    setActiveSiblingDropdownIdx(null);
    setIsCustomCasteCategory(false);
    setHasSiblings(false);
    setSiblingsCount(1);
    setSiblingDetails([]);
    setSiblingStudentIds([]);
    setFormData({
      appliedClass: "",
      section: "Unassigned",
      gender: "" as any,
      dob: "",
      bloodGroup: "",
      religion: "",
      casteCategory: "",
      parentName: "",
      motherName: "",
      email: "",
      phone: "",
      addressHouseNo: "",
      addressStreet: "",
      addressArea: "",
      addressCity: "",
      addressDistrict: "",
      addressState: "",
      addressPinCode: "",
      hasSiblings: false,
      siblingsCount: 0,
      siblingDetails: [],
      siblingStudentId: "",
      siblingStudentIds: [],
      studentType: "" as any,
      transportRequired: false,
      transportType: "" as any,
      busRoute: "",
      pickupPoint: "",
      hostelBlock: "",
      floor: "",
      hostelRoom: "",
      hostelBed: "",
    hostelSecurityDepositPaid: false,
    securityDepositAmount: 0,
    securityDepositReceiptNo: "",
    securityDepositPaymentMode: "Cash",
    securityDepositTxnId: "",
    securityDepositDate: new Date().toISOString().split("T")[0],
      branch: "",
      joiningDate: new Date().toISOString().split("T")[0],
      admissionDate: new Date().toISOString().split("T")[0],
      isLateAdmission: false,
      feeCalculationMethod: "Term-wise",
      selectedOptionalFees: [],
      documentsSubmitted: [],
    });
    setPhoneError("");
    setMotherPhoneError("");
    setAltPhoneError("");
    setEmailError("");
    setDobError("");
    setAdmissionDateError("");
    setPhotoError("");
    setPinCodeError("");
    setHouseNoError("");
    setCityError("");
    setIsFormView(true);
  };

  const handlePinCodeChange = (pinCode: string) => {
    // Only accept numeric characters and limit to 6 digits
    const clean = pinCode.replace(/\D/g, "").slice(0, 6);
    if (clean && clean.length > 0 && clean.length < 6) {
      setPinCodeError("PIN Code must be 6 digits.");
    } else {
      setPinCodeError("");
    }
    setFormData((prev) => {
      const updated = { ...prev, addressPinCode: clean };
      if (!clean) {
        updated.addressCity = "";
        updated.addressDistrict = "";
        updated.addressState = "";
        updated.addressArea = "";
        return updated;
      }
      const offline = getOfflinePostalInfo(clean);
      if (offline) {
        updated.addressCity = offline.city;
        updated.addressDistrict = offline.district;
        updated.addressState = offline.state;
        if (!prev.addressArea || prev.addressArea === offline.area) {
          updated.addressArea = offline.area || "";
        }
      }
      return updated;
    });

    if (clean.length >= 4) {
      lookupPostalCode(clean).then((info) => {
        if (info) {
          setFormData((prev) => {
            if (!prev.addressPinCode.trim()) return prev;
            return {
              ...prev,
              addressCity: info.city || prev.addressCity,
              addressDistrict: info.district || prev.addressDistrict,
              addressState: info.state || prev.addressState,
              addressArea: prev.addressArea || info.area || "",
            };
          });
        }
      });
    }
  };

  useEffect(() => {
    if (initialFormOpen) {
      handleOpenAdd();
    }
  }, [initialFormOpen]);

  const handleOpenEdit = (app: AdmissionApplication) => {
    if (!app) return;
    setEditingApp(app);
    const parts = String(app.applicantName || "").trim().split(" ");
    setFirstName(formatTitleCase(parts[0] || ""));
    setLastName(formatTitleCase(parts.slice(1).join(" ") || ""));
    setAvatar(app.avatar || "");

    let formattedDob = String(app.dob || "");
    if (formattedDob.includes("-") && formattedDob.split("-").length === 3) {
      const dParts = formattedDob.split("-");
      formattedDob = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
    }

    const STANDARD_CASTES = ["OC", "BC", "MBC", "SC", "ST", "General", "OBC", "BC-A", "BC-B", "Others"];
    const isCustomCaste = Boolean(app.casteCategory && !STANDARD_CASTES.includes(app.casteCategory));
    setIsCustomCasteCategory(isCustomCaste);

    const rawOptFees =
      app.selectedOptionalFees ||
      (app as any).optionalFees ||
      (app as any).selectedOptional ||
      [];
    let optFees: string[] = [];
    if (Array.isArray(rawOptFees)) {
      optFees = rawOptFees.map((x) => String(x));
    } else if (typeof rawOptFees === "string") {
      try {
        const parsed = JSON.parse(rawOptFees);
        if (Array.isArray(parsed)) optFees = parsed.map((x) => String(x));
        else
          optFees = (rawOptFees as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      } catch (e) {
        optFees = (rawOptFees as string)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const docsSub = app.documentsSubmitted || (app as any).documents || [];
    const isDepositPaidInPayments = (feePayments || []).some((p) => {
      const pId = String(p.studentId || "");
      const pAdm = String(p.admissionNo || "");
      const pName = String(p.studentName || "").toLowerCase().trim();
      const targetId = String(app.id || "");
      const targetAdm = String(app.applicationNo || app.admissionNo || (app as any).registrationNo || "");
      const targetName = String(app.applicantName || "").toLowerCase().trim();

      const matchesId =
        (pId && (pId === targetId || pId === targetAdm)) ||
        (pAdm && (pAdm === targetId || pAdm === targetAdm)) ||
        (targetName && pName && targetName === pName);

      const isDepositHead =
        String(p.feeHeadName || "").toLowerCase().includes("security deposit") ||
        String(p.remarks || "").toLowerCase().includes("security deposit") ||
        String(p.paidItemsJson || "").toLowerCase().includes("security deposit");

      return matchesId && isDepositHead;
    });

    const isAlreadyPaid = Boolean(
      app.hostelSecurityDepositPaid ||
      (app as any).securityDepositPaid ||
      isDepositPaidInPayments
    );

    const initialPayMode = app.securityDepositPaymentMode || (app as any).securityDepositPaymentMode || "Cash";
    const initialTxn = app.securityDepositTxnId || (app as any).securityDepositTxnId || "";
    const initialDate = app.securityDepositDate || (app as any).securityDepositDate || new Date().toISOString().split("T")[0];

    setDepositPaymentMode(initialPayMode);
    setDepositTxnId(initialTxn);
    setDepositDate(initialDate);
    const isTrp = Boolean(app.transportRequired || app.busRoute || app.pickupPoint);
    const sType = normalizeStudentType(app.studentType);

    const isLateAdm =
      app.isLateAdmission !== undefined
        ? Boolean(app.isLateAdmission)
        : (app as any).isLate !== undefined
          ? Boolean((app as any).isLate)
          : (app as any).lateAdmission !== undefined
            ? Boolean((app as any).lateAdmission)
            : false;

    setFormData({
      ...app,
      section: (app as any).section || (app as any).sectionLetter || "A",
      email: app.email || (app as any).parentEmail || "",
      motherPhone: app.motherPhone || (app as any).motherMobileNumber || "",
      alternatePhone: app.alternatePhone || (app as any).alternateMobileNumber || "",
      studentType: sType as any,
      casteCategory: app.casteCategory || "General",
      dob: formattedDob,
      joiningDate: app.joiningDate || app.admissionDate || new Date().toISOString().split("T")[0],
      admissionDate: app.admissionDate || app.joiningDate || new Date().toISOString().split("T")[0],
      isLateAdmission: isLateAdm,
      feeCalculationMethod: app.feeCalculationMethod || "Term-wise",
      transportRequired: isTrp,
      busRoute: app.busRoute || "",
      pickupPoint: app.pickupPoint || "",
      hostelBlock: app.hostelBlock || "",
      hostelRoom: app.hostelRoom || "",
      hostelBed: app.hostelBed || "",
      hostelSecurityDepositPaid: isAlreadyPaid,
      securityDepositAmount: app.securityDepositAmount || (app as any).securityDepositAmount || 0,
      securityDepositReceiptNo: app.securityDepositReceiptNo || (app as any).securityDepositReceiptNo || "",
      securityDepositPaymentMode: initialPayMode,
      securityDepositTxnId: initialTxn,
      securityDepositDate: initialDate,
      scholarshipId: app.scholarshipId || "",
      discountId: app.discountId || "",
      selectedOptionalFees: optFees,
      documentsSubmitted: docsSub,
    });
    const hasSib =
      app.hasSiblings ??
      ((app.siblingsCount && app.siblingsCount > 0) ||
        !!app.siblingStudentId ||
        (app.siblingDetails && app.siblingDetails.length > 0));
    setHasSiblings(!!hasSib);
    const count =
      app.siblingsCount && app.siblingsCount > 0
        ? app.siblingsCount
        : app.siblingDetails?.length || 1;
    setSiblingsCount(count);

    if (app.siblingDetails && app.siblingDetails.length > 0) {
      setSiblingDetails(app.siblingDetails);
    } else if (hasSib) {
      const sIds =
        app.siblingStudentIds ||
        (app.siblingStudentId ? [app.siblingStudentId] : []);
      const reconstructed: SiblingDetail[] = [];
      for (let i = 0; i < count; i++) {
        const sId = sIds[i];
        if (sId) {
          const matchedSt = (students || []).find((s) => s.id === sId);
          reconstructed.push({
            id: sId,
            name: matchedSt
              ? `${matchedSt.firstName} ${matchedSt.lastName}`
              : "Existing Student",
            isExisting: true,
            studentId: sId,
            admissionNo: matchedSt?.admissionNo,
          });
        } else {
          reconstructed.push({ name: "", isExisting: false });
        }
      }
      setSiblingDetails(reconstructed);
    } else {
      setSiblingDetails([]);
    }
    setSiblingStudentIds(
      app.siblingStudentIds ||
        (app.siblingStudentId ? [app.siblingStudentId] : []),
    );
    setPhoneError("");
    setMotherPhoneError("");
    setAltPhoneError("");
    setEmailError("");
    setDobError("");
    setAdmissionDateError("");
    setPhotoError("");
    setPinCodeError("");
    setHouseNoError("");
    setCityError("");
    setIsFormView(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setPhotoError("File limit exceeded (Max 2MB)");
        addToast(
          "error",
          "File Limit Exceeded",
          "Student photo must be 2 MB or less.",
        );
        return;
      }
      setPhotoError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        addToast("info", "Photo Selected", "Profile photo preview updated");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar("");
    setPhotoError("");
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: cleaned }));
    if (cleaned) {
      const res = validate10DigitPhone(cleaned);
      setPhoneError(res.isValid ? "" : res.error || "");
    } else {
      setPhoneError("Father mobile number is required.");
    }
  };

  const handleMotherPhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, motherPhone: cleaned }));
    if (cleaned) {
      const res = validate10DigitPhone(cleaned);
      setMotherPhoneError(res.isValid ? "" : res.error || "Enter a valid 10-digit mobile number.");
    } else {
      setMotherPhoneError("");
    }
  };

  const validateAgeAndDates = (
    dobVal?: string,
    admVal?: string,
    classVal?: string,
  ) => {
    const targetDob = dobVal !== undefined ? dobVal : formData.dob;
    const targetAdm =
      admVal !== undefined
        ? admVal
        : formData.admissionDate || formData.joiningDate;
    const targetClass =
      classVal !== undefined ? classVal : formData.appliedClass;

    setAdmissionDateError("");

    if (targetDob) {
      const basicDob = validateDOB(targetDob);
      if (!basicDob.isValid) {
        setDobError(basicDob.error || "Invalid DOB");
        return;
      } else {
        setDobError("");
      }
    } else {
      setDobError("");
    }

    if (targetDob && targetAdm) {
      const result = validateStudentAge({
        dateOfBirth: targetDob,
        dateOfAdmission: targetAdm,
        className:
          targetClass && targetClass !== "Select Class" ? targetClass : undefined,
        academicClasses,
      });

      if (!result.isValid) {
        if (result.errorCode === "ADMISSION_BEFORE_DOB") {
          setAdmissionDateError(
            result.message ||
              "Date of Admission cannot be earlier than Date of Birth.",
          );
        } else if (result.errorCode === "UNDERAGE") {
          setDobError(
            result.message ||
              "Student does not meet the minimum age requirement for the selected class.",
          );
        } else if (result.errorCode === "INVALID_ADMISSION_DATE") {
          setAdmissionDateError(
            result.message || "Invalid Date of Admission.",
          );
        } else if (result.errorCode === "INVALID_DOB") {
          setDobError(result.message || "Invalid Date of Birth.");
        }
      }
    }
  };

  const handleDOBChange = (val: string) => {
    setFormData((prev) => ({ ...prev, dob: val }));
    validateAgeAndDates(val, undefined, undefined);
  };

  const handleAdmissionDateChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      joiningDate: val,
      admissionDate: val,
    }));
    validateAgeAndDates(undefined, val, undefined);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isSubmitting || isSubmittingForm) return;
    setIsSubmitting(true);
    setIsSubmittingForm(true);

    try {
    // Validate Student Details Required Fields
    if (!firstName || !firstName.trim()) {
      addToast("error", "Missing Required Field", "Please enter Student First Name.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (!lastName || !lastName.trim()) {
      addToast("error", "Missing Required Field", "Please enter Student Last Name.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (!formData.appliedClass || formData.appliedClass === "Select Class") {
      addToast("error", "Missing Required Field", "Please select Target Class.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (!formData.gender) {
      addToast("error", "Missing Required Field", "Please select Gender.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (!formData.branch) {
      addToast("error", "Missing Required Field", "Please select Campus.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (!formData.dob) {
      addToast("error", "Missing Required Field", "Please enter Date of Birth.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (!formData.bloodGroup) {
      addToast("error", "Missing Required Field", "Please select Blood Group.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (!formData.casteCategory) {
      addToast("error", "Missing Required Field", "Please select Caste.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (!formData.admissionDate && !formData.joiningDate) {
      addToast("error", "Missing Required Field", "Please select Date of Admission.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    // Validate Student Type Required Field
    if (!formData.studentType || formData.studentType === ("Select Type" as any)) {
      addToast("error", "Missing Required Field", "Please select Student Type.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    // Validate Hostel Security Deposit before bed allotment
    if (
      (formData.studentType === "Residential" || (formData.studentType as any) === "Hosteller") &&
      formData.hostelBed &&
      applicableSecurityDeposit > 0 &&
      !formData.hostelSecurityDepositPaid
    ) {
      addToast(
        "error",
        "Security Deposit Required",
        `Security deposit fee of ${formatCurrency(applicableSecurityDeposit)} must be paid before allotting bed ${formData.hostelBed}.`,
      );
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    // Validate Parent Information Required Fields
    if (!formData.parentName || !formData.parentName.trim()) {
      addToast("error", "Missing Required Field", "Please enter Father Full Name.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      addToast("error", "Missing Required Field", "Please enter Father Mobile number.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    const phoneValidation = validate10DigitPhone(formData.phone || "");
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Invalid 10-digit phone");
      addToast("error", "Phone Validation Error", phoneValidation.error);
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (formData.motherPhone && formData.motherPhone.trim()) {
      const motherPhoneValidation = validate10DigitPhone(formData.motherPhone.trim());
      if (!motherPhoneValidation.isValid) {
        setMotherPhoneError(motherPhoneValidation.error || "Invalid Mother mobile number.");
        addToast(
          "error",
          "Mother Phone Validation Error",
          motherPhoneValidation.error || "Mother mobile number must start with 6, 7, 8, or 9."
        );
        setIsSubmitting(false);
        setIsSubmittingForm(false);
        return;
      }
    }

    if (formData.alternatePhone && formData.alternatePhone.trim()) {
      if (formData.alternatePhone.trim() === (formData.phone || "").trim()) {
        setAltPhoneError("Alternate mobile cannot be identical to Father primary mobile number");
        addToast(
          "error",
          "Alternate Phone Error",
          "Alternate mobile cannot be identical to Father primary mobile number"
        );
        setIsSubmitting(false);
        setIsSubmittingForm(false);
        return;
      }
      const altPhoneValidation = validate10DigitPhone(formData.alternatePhone.trim());
      if (!altPhoneValidation.isValid) {
        setAltPhoneError(altPhoneValidation.error || "Invalid Alternate mobile number.");
        addToast(
          "error",
          "Alternate Phone Validation Error",
          altPhoneValidation.error || "Alternate mobile number must start with 6, 7, 8, or 9."
        );
        setIsSubmitting(false);
        setIsSubmittingForm(false);
        return;
      }
    }

    if (!formData.email || !formData.email.trim()) {
      setEmailError("Please enter parent email address.");
      addToast("error", "Missing Required Field", "Please enter Email Address.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    const emailValidation = validateEmail(formData.email.trim(), true);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || "Please enter a valid email address.");
      addToast("error", "Email Validation Error", emailValidation.error || "Please enter a valid email address.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (formData.addressPinCode && formData.addressPinCode.trim()) {
      const cleanPin = formData.addressPinCode.replace(/\D/g, "");
      if (cleanPin.length !== 6) {
        setPinCodeError("PIN Code must be exactly 6 digits.");
        addToast("error", "PIN Code Error", "PIN Code must be exactly 6 digits.");
        setIsSubmitting(false);
        setIsSubmittingForm(false);
        return;
      }
    }

    if (formData.addressHouseNo && formData.addressHouseNo.trim()) {
      const houseValidation = validateHouseNumber(formData.addressHouseNo.trim());
      if (!houseValidation.isValid) {
        setHouseNoError(houseValidation.error || "Enter a valid House No.");
        addToast("error", "House No Validation Error", houseValidation.error || "Enter a valid House No.");
        setIsSubmitting(false);
        setIsSubmittingForm(false);
        return;
      }
    }

    if (formData.addressCity && formData.addressCity.trim()) {
      const cityValidation = validateCity(formData.addressCity.trim());
      if (!cityValidation.isValid) {
        setCityError(cityValidation.error || "Enter a valid City name.");
        addToast("error", "City Validation Error", cityValidation.error || "Enter a valid City name.");
        setIsSubmitting(false);
        setIsSubmittingForm(false);
        return;
      }
    }

    if (formData.addressStreet && formData.addressStreet.length > 60) {
      addToast("error", "Validation Error", "Street address cannot exceed 60 characters.");
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    const ageValidation = validateStudentAge({
      dateOfBirth: formData.dob,
      dateOfAdmission: formData.admissionDate || formData.joiningDate,
      className: formData.appliedClass,
      academicClasses,
    });

    if (!ageValidation.isValid) {
      if (ageValidation.errorCode === "ADMISSION_BEFORE_DOB") {
        setAdmissionDateError(
          ageValidation.message ||
            "Date of Admission cannot be earlier than Date of Birth.",
        );
        addToast(
          "error",
          "Invalid Admission Date",
          ageValidation.message ||
            "Date of Admission cannot be earlier than Date of Birth.",
        );
      } else if (ageValidation.errorCode === "UNDERAGE") {
        setDobError(
          ageValidation.message ||
            "Student does not meet the minimum age requirement for the selected class.",
        );
        addToast(
          "error",
          "Age Eligibility Error",
          ageValidation.message ||
            "Student does not meet the minimum age requirement for the selected class.",
        );
      } else if (
        ageValidation.errorCode === "MISSING_DOB" ||
        ageValidation.errorCode === "INVALID_DOB"
      ) {
        setDobError(ageValidation.message || "Invalid Date of Birth.");
        addToast("error", "DOB Validation Error", ageValidation.message);
      } else if (
        ageValidation.errorCode === "MISSING_ADMISSION_DATE" ||
        ageValidation.errorCode === "INVALID_ADMISSION_DATE"
      ) {
        setAdmissionDateError(
          ageValidation.message || "Invalid Date of Admission.",
        );
        addToast("error", "Admission Date Error", ageValidation.message);
      } else {
        addToast(
          "error",
          "Validation Error",
          ageValidation.message || "Student age or admission date is invalid.",
        );
      }
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      return;
    }

    if (hasSiblings) {
      if (!siblingsCount || siblingsCount < 1) {
        addToast(
          "error",
          "Validation Error",
          "Number of siblings must be at least 1.",
        );
        setIsSubmitting(false);
        return;
      }
      for (let i = 0; i < siblingDetails.length; i++) {
        const entry = siblingDetails[i];
        if (entry.isExisting) {
          if (!entry.studentId) {
            addToast(
              "error",
              "Validation Error",
              `Please select an existing student for Sibling ${i + 1}.`,
            );
            setIsSubmitting(false);
            return;
          }
        } else {
          if (!entry.name || !entry.name.trim()) {
            addToast(
              "error",
              "Validation Error",
              `Please enter a name for Sibling ${i + 1}.`,
            );
            setIsSubmitting(false);
            return;
          }
        }
      }
    }

    if (formData.discountId) {
      const selDisc = discounts.find((d) => d.id === formData.discountId);
      if (
        selDisc &&
        isSiblingConcession(selDisc.name) &&
        !hasExistingEnrolledSibling
      ) {
        addToast(
          "error",
          "Validation Error",
          "Sibling Concession can only be applied if an existing enrolled sibling is selected.",
        );
        setIsSubmitting(false);
        return;
      }
    }

    if (formData.scholarshipId) {
      const selSch = scholarships.find((s) => s.id === formData.scholarshipId);
      if (
        selSch &&
        isSiblingConcession(selSch.name) &&
        !hasExistingEnrolledSibling
      ) {
        addToast(
          "error",
          "Validation Error",
          "Sibling Concession can only be applied if an existing enrolled sibling is selected.",
        );
        setIsSubmitting(false);
        return;
      }
    }

    const selectedStudentIds = hasSiblings
      ? (siblingDetails.map((d) => d.studentId).filter(Boolean) as string[])
      : [];

    const finalFirst = formatTitleCase(firstName.trim());
    const finalLast = formatTitleCase(lastName.trim());
    const fullApplicantName = `${finalFirst} ${finalLast}`.trim();
    const formattedParentName = formatTitleCase((formData.parentName || "").trim());
    const formattedMotherName = formData.motherName ? formatTitleCase(formData.motherName.trim()) : "N/A";
    const finalDob = formData.dob ? (formatToDDMMYYYY(formData.dob, "/") || formData.dob) : (formData.dob || "");

    // Duplicate submission protection
    const isDuplicate = (admissions || []).some(
      (a) =>
        a.applicantName?.trim().toLowerCase() === fullApplicantName.toLowerCase() &&
        a.appliedClass === formData.appliedClass &&
        (a.phone === formData.phone || a.parentName === formData.parentName)
    );

    if (!editingApp && isDuplicate) {
      addToast(
        "warning",
        "Duplicate Application Detected",
        `An application for ${fullApplicantName} has already been registered.`
      );
      setIsSubmitting(false);
      setIsSubmittingForm(false);
      handleCloseForm();
      return;
    }

      if (editingApp) {
        await updateAdmission(editingApp.id, {
          ...formData,
          section: formData.section || "Unassigned",
          parentName: formattedParentName,
          motherName: formattedMotherName,
          email: formData.email || "",
          parentEmail: formData.email || "",
          motherPhone: formData.motherPhone || "",
          alternatePhone: formData.alternatePhone || "",
          dob: finalDob,
          applicantName: fullApplicantName,
          avatar,
          hasSiblings,
          siblingsCount: hasSiblings ? siblingsCount : 0,
          siblingDetails: hasSiblings ? siblingDetails : [],
          siblingStudentId: selectedStudentIds[0] || "",
          siblingStudentIds: selectedStudentIds,
          hostelSecurityDepositPaid: Boolean(formData.hostelSecurityDepositPaid),
          securityDepositAmount: applicableSecurityDeposit,
          securityDepositReceiptNo: formData.securityDepositReceiptNo || "",
          securityDepositPaymentMode: formData.securityDepositPaymentMode || depositPaymentMode,
          securityDepositTxnId: formData.securityDepositTxnId || depositTxnId,
          securityDepositDate: formData.securityDepositDate || depositDate,
        });

        // Auto-Allocate Hostel Room & Bed in Edit if Residential student opted for block, room & bed
        // ONLY if security deposit is paid (or applicable deposit <= 0)!
        const canAllotBedInEdit = applicableSecurityDeposit <= 0 || Boolean(formData.hostelSecurityDepositPaid);
        if (
          (formData.studentType === "Residential" || (formData.studentType as any) === "Hosteller") &&
          formData.hostelBlock &&
          formData.hostelRoom &&
          formData.hostelBed &&
          canAllotBedInEdit
        ) {
          const selBlk =
            dynamicHostelBlocks.find(
              (b) => String(b.hostelId) === String(formData.hostelBlock),
            ) ||
            hostelMasters.find(
              (h) => String(h.id) === String(formData.hostelBlock),
            );
          const selRm =
            dynamicHostelRooms.find(
              (r) => String(r.roomId) === String(formData.hostelRoom),
            ) ||
            roomMasters.find((r) => String(r.id) === String(formData.hostelRoom));

// Bed allocation handled separately in Hostel Management

          if (formData.hostelSecurityDepositPaid && applicableSecurityDeposit > 0) {
            const hasExistingDepPayment = (feePayments || []).some((p) => {
              const pId = String(p.studentId || "");
              const pAdm = String(p.admissionNo || "");
              const pName = String(p.studentName || "").toLowerCase().trim();
              const targetId = String(editingApp.id || "");
              const targetAdm = String(editingApp.applicationNo || (editingApp as any).admissionNo || "");
              const targetName = fullApplicantName.toLowerCase().trim();

              const matchesId = (pId && (pId === targetId || pId === targetAdm)) || (pAdm && (pAdm === targetId || pAdm === targetAdm)) || (targetName && pName && targetName === pName);
              const isDepositHead =
                String(p.feeHeadName || "").toLowerCase().includes("security deposit") ||
                String(p.remarks || "").toLowerCase().includes("security deposit") ||
                String(p.paidItemsJson || "").toLowerCase().includes("security deposit");

              return matchesId && isDepositHead;
            });

            if (!hasExistingDepPayment) {
              const secReceipt =
                formData.securityDepositReceiptNo ||
                `REC-SD-${Math.floor(100000 + Math.random() * 900000)}`;

              const paymentPayload = {
                receiptNo: secReceipt,
                studentId: String(editingApp.id),
                admissionNo: (editingApp as any).applicationNo || (editingApp as any).admissionNo || `ADM-${editingApp.id}`,
                studentName: fullApplicantName,
                className: formData.appliedClass,
                amountPaid: applicableSecurityDeposit,
                amount: applicableSecurityDeposit,
                discount: 0,
                fine: 0,
                paymentMode: formData.securityDepositPaymentMode || depositPaymentMode || "Cash",
                transactionId: formData.securityDepositTxnId || depositTxnId || "",
                paymentDate: formData.securityDepositDate || depositDate || new Date().toISOString().split("T")[0],
                academicYear: selectedAcademicYear || "",
                feeHeadName: "Hostel Security Deposit",
                remarks: `Hostel Security Deposit for ${fullApplicantName} (Room ${formData.hostelRoom}, Bed ${formData.hostelBed})`,
                status: "Paid" as const,
                paymentAllocation: [
                  {
                    academicYear: selectedAcademicYear || "",
                    amount: applicableSecurityDeposit,
                    feeHeadName: "Hostel Security Deposit",
                    termName: "One Time",
                  },
                ],
              };

              try {
                if (addFeePayment) {
                  addFeePayment(paymentPayload);
                }
                FinanceAPI.createFeePaymentApi(paymentPayload).catch(() => {});
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("finance_data_updated"));
                }
              } catch (e) {}
            }
          }
        }

        addToast(
          "success",
          "Application Updated",
          `Updated details for ${fullApplicantName}`,
        );
      } else {
        const admissionPayload = {
          applicantName: fullApplicantName,
          avatar,
          appliedClass: formData.appliedClass!,
          section: formData.section || "Unassigned",
          gender: formData.gender,
          dob: finalDob,
          bloodGroup: formData.bloodGroup,
          religion: formData.religion || "General",
          casteCategory: formData.casteCategory || "General",
          parentName: formattedParentName,
          motherName: formattedMotherName,
          email: formData.email || "",
          parentEmail: formData.email || "",
          phone: formData.phone || "9876543210",
          motherPhone: formData.motherPhone || "",
          alternatePhone: formData.alternatePhone || "",
          addressHouseNo: formData.addressHouseNo,
          addressStreet: formData.addressStreet,
          addressArea: formData.addressArea,
          addressCity: formData.addressCity,
          addressDistrict: formData.addressDistrict,
          addressState: formData.addressState,
          addressPinCode: formData.addressPinCode,
          hasSiblings,
          siblingsCount: hasSiblings ? siblingsCount : 0,
          siblingDetails: hasSiblings ? siblingDetails : [],
          siblingStudentId: selectedStudentIds[0] || "",
          siblingStudentIds: selectedStudentIds,
          studentType: formData.studentType as StudentType,
          transportRequired: formData.transportRequired,
          transportType: formData.transportType,
          busRoute: formData.busRoute,
          pickupPoint: formData.pickupPoint,
          dropPoint: formData.dropPoint,
          hostelBlock: formData.hostelBlock,
          floor: formData.floor,
          hostelRoom: formData.hostelRoom,
          hostelBed: formData.hostelBed,
          hostelSecurityDepositPaid: Boolean(formData.hostelSecurityDepositPaid),
          securityDepositAmount: applicableSecurityDeposit,
          securityDepositReceiptNo: formData.securityDepositReceiptNo || "",
          securityDepositPaymentMode: formData.securityDepositPaymentMode || depositPaymentMode,
          securityDepositTxnId: formData.securityDepositTxnId || depositTxnId,
          securityDepositDate: formData.securityDepositDate || depositDate,
          branch: formData.branch || (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" && dynamicCampuses.includes(selectedBranch) ? selectedBranch : "") || (dynamicCampuses[0] || ""),
          scholarshipId: formData.scholarshipId,
          discountId: formData.discountId,
          selectedOptionalFees: formData.selectedOptionalFees || [],
          submissionDate: new Date().toISOString().split("T")[0],
          joiningDate:
            formData.joiningDate ||
            formData.admissionDate ||
            new Date().toISOString().split("T")[0],
          admissionDate:
            formData.joiningDate ||
            formData.admissionDate ||
            new Date().toISOString().split("T")[0],
          isLateAdmission: !!formData.isLateAdmission,
          feeCalculationMethod: formData.feeCalculationMethod || "Term-wise",
          status: "Pending",
          documentsSubmitted: formData.documentsSubmitted || [],
        };

        await addAdmission(admissionPayload);

        // Sync Residential / Hosteller student across all Hostel & Finance pages
        if (
          formData.studentType === "Residential" ||
          (formData.studentType as any) === "Hosteller" ||
          formData.hostelBlock ||
          formData.hostelBed
        ) {
          try {
            const STORE_KEY = "edu_db_residential_students";
            const stored = localStorage.getItem(STORE_KEY);
            let list = stored ? JSON.parse(stored) : [];
            if (!Array.isArray(list)) list = [];

            const stId = generateNextStudentId(students);
            const admNo = generateNextAdmissionNo(students);

            const newRecord = {
              id: stId,
              name: fullApplicantName,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              admissionNo: admNo,
              className: formData.appliedClass,
              section: formData.section || "Unassigned",
              studentType: "Residential",
              isResidential: true,
              phone: formData.phone || "",
              email: formData.email || "",
              parentName: formData.parentName || "",
              hostelBlock: formData.hostelBlock || "",
              hostelBed: formData.hostelBed || "",
              status: "Active",
            };

            list.push(newRecord);
            localStorage.setItem(STORE_KEY, JSON.stringify(list));
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("residential_students_updated"));
            }
          } catch (e) {}
        }

        // Auto-Allocate Hostel Room & Bed if Residential student opted for block, room & bed
        // ONLY if security deposit is paid (or applicable deposit <= 0)!
        const canAllotBed = applicableSecurityDeposit <= 0 || Boolean(formData.hostelSecurityDepositPaid);
        if (
          (formData.studentType === "Residential" ||
            (formData.studentType as any) === "Hosteller") &&
          formData.hostelBlock &&
          formData.hostelRoom &&
          formData.hostelBed &&
          canAllotBed
        ) {
          const selBlk =
            dynamicHostelBlocks.find(
              (b) => String(b.hostelId) === String(formData.hostelBlock),
            ) ||
            hostelMasters.find(
              (h) => String(h.id) === String(formData.hostelBlock),
            );
          const selRm =
            dynamicHostelRooms.find(
              (r) => String(r.roomId) === String(formData.hostelRoom),
            ) ||
            roomMasters.find((r) => String(r.id) === String(formData.hostelRoom));

          const newStId = generateNextStudentId(students);
          const newAdmNo = generateNextAdmissionNo(students);

// Bed allocation handled separately in Hostel Management

          if (formData.hostelSecurityDepositPaid && applicableSecurityDeposit > 0) {
            const secReceipt =
              formData.securityDepositReceiptNo ||
              `REC-SD-${Math.floor(100000 + Math.random() * 900000)}`;

            const paymentPayload = {
              receiptNo: secReceipt,
              studentId: String(newStId),
              admissionNo: String(newAdmNo),
              studentName: fullApplicantName,
              className: formData.appliedClass,
              amountPaid: applicableSecurityDeposit,
              amount: applicableSecurityDeposit,
              discount: 0,
              fine: 0,
              paymentMode: formData.securityDepositPaymentMode || depositPaymentMode || "Cash",
              transactionId: formData.securityDepositTxnId || depositTxnId || "",
              paymentDate: formData.securityDepositDate || depositDate || new Date().toISOString().split("T")[0],
              academicYear: selectedAcademicYear || "",
              feeHeadName: "Hostel Security Deposit",
              remarks: `Hostel Security Deposit for ${fullApplicantName} (Room ${formData.hostelRoom}, Bed ${formData.hostelBed})`,
              status: "Paid" as const,
              paymentAllocation: [
                {
                  academicYear: selectedAcademicYear || "",
                  amount: applicableSecurityDeposit,
                  feeHeadName: "Hostel Security Deposit",
                  termName: "One Time",
                },
              ],
            };

            try {
              if (addFeePayment) {
                addFeePayment(paymentPayload);
              }
              FinanceAPI.createFeePaymentApi(paymentPayload).catch(() => {});
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("finance_data_updated"));
              }
            } catch (e) {}
          }
        }

        addToast(
          "success",
          "Application Submitted",
          `Application registered for ${fullApplicantName}`,
        );
      }

      handleCloseForm();
    } catch (err: any) {
      addToast(
        "error",
        "Submission Error",
        err.message || "An error occurred while saving the application."
      );
    } finally {
      setIsSubmitting(false);
      setIsSubmittingForm(false);
    }
  };

  const isOptionalFeeMatched = (
    idOrName: any,
    item: { feeHeadId?: string; feeHeadName: string }
  ) => {
    if (!idOrName || !item) return false;
    const str = String(idOrName).toLowerCase().trim();
    const itemId = String(item.feeHeadId || "").toLowerCase().trim();
    const itemName = String(item.feeHeadName || "").toLowerCase().trim();

    if (str === itemId || str === itemName) return true;

    const cleanStr = str.replace(/[^a-z0-9]/g, "");
    const cleanItemId = itemId.replace(/[^a-z0-9]/g, "");
    const cleanItemName = itemName.replace(/[^a-z0-9]/g, "");

    if (cleanStr && (cleanStr === cleanItemId || cleanStr === cleanItemName)) return true;

    if (str.includes("computer") && itemName.includes("computer")) return true;
    if (str.includes("science") && itemName.includes("science")) return true;
    if (str.includes("sports") && itemName.includes("sports")) return true;
    if (str.includes("uniform") && itemName.includes("uniform")) return true;

    return false;
  };

  const isItemMandatory = (item: {
    feeHeadId?: string;
    feeHeadName: string;
    category?: string;
  }) => {
    const nameLower = String(item.feeHeadName || "").toLowerCase().trim();
    const catLower = (item.category || "").toLowerCase().trim();

    const fh = feeHeads.find((h) => {
      if (!h) return false;
      const hId = String(h.id || "");
      const itemFhId = String(item.feeHeadId || "");
      if (
        itemFhId &&
        hId &&
        hId.toLowerCase() === itemFhId.toLowerCase()
      )
        return true;
      if (
        itemFhId &&
        hId &&
        hId.replace("-0", "-") === itemFhId.replace("-0", "-")
      )
        return true;
      if (h.name && nameLower && h.name.toLowerCase().trim() === nameLower)
        return true;
      if (
        h.name &&
        nameLower &&
        (h.name.toLowerCase().includes(nameLower) ||
          nameLower.includes(h.name.toLowerCase()))
      )
        return true;
      if (
        h.category &&
        catLower &&
        h.category.toLowerCase().trim() === catLower
      )
        return true;
      return false;
    });

    if (fh !== undefined && fh.mandatory !== undefined) {
      return fh.mandatory;
    }

    return (
      nameLower.includes("tuition") ||
      nameLower.includes("admission") ||
      nameLower.includes("book") ||
      nameLower.includes("textbook") ||
      nameLower.includes("stationery") ||
      nameLower.includes("material") ||
      nameLower.includes("exam") ||
      catLower.includes("exam")
    );
  };

  const calculateLiveFeePreview = () => {
    if (!formData.appliedClass || formData.appliedClass === "Select Class") {
      return { items: [], totalPayable: 0, isClassSelected: false };
    }

    const stType = normalizeStudentType(formData.studentType);
    const clsName = formData.appliedClass;

    const matchesClass = (structCls?: string, targetCls?: string): boolean => {
      if (!structCls || !targetCls) return false;
      const s1 = String(structCls).replace(/^Class\s*/i, '').replace(/^Grade\s*/i, '').trim().toLowerCase();
      const s2 = String(targetCls).replace(/^Class\s*/i, '').replace(/^Grade\s*/i, '').trim().toLowerCase();
      return s1 === s2;
    };

    const structuresToSearch = (allDynamicFeeStructures && allDynamicFeeStructures.length > 0)
      ? allDynamicFeeStructures
      : (dynamicFeeStructures || []);

    const studentBranch = (formData.branch || selectedBranch || "").trim().toLowerCase();

    const dfs =
      structuresToSearch.find(
        (d) =>
          matchesClass(d.className, clsName) &&
          (d.status === "Active" || !d.status) &&
          (!studentBranch || studentBranch === "all" || studentBranch === "all branches" ||
           !d.branch || d.branch.toLowerCase().trim() === "all" || d.branch.toLowerCase().trim() === "all branches" ||
           d.branch.toLowerCase().trim() === studentBranch ||
           studentBranch.includes(d.branch.toLowerCase().trim()) ||
           d.branch.toLowerCase().trim().includes(studentBranch))
      ) ||
      structuresToSearch.find(
        (d) => matchesClass(d.className, clsName) && (d.status === "Active" || !d.status)
      ) ||
      structuresToSearch.find((d) => matchesClass(d.className, clsName)) ||
      (dynamicFeeStructures || []).find(
        (d) => matchesClass(d.className, clsName) && (d.status === "Active" || !d.status)
      ) ||
      (dynamicFeeStructures || []).find((d) => matchesClass(d.className, clsName));

    const rawBaseItems = dfs ? (dfs.items || []) : [];

    const baseItemsFiltered = rawBaseItems.filter(
      (item) =>
        item.feeHeadName !== "Fee Head" &&
        (feeHeads.length === 0 ||
          feeHeads.some(
            (h) =>
              h.id === item.feeHeadId ||
              String(h.name || "").toLowerCase().trim() === String(item.feeHeadName || "").toLowerCase().trim(),
          )),
    );

    let baseItems = baseItemsFiltered.length > 0 ? baseItemsFiltered : rawBaseItems;

    if (baseItems.length === 0 && dfs && Number(dfs.totalAmount || 0) > 0) {
      baseItems = [
        {
          feeHeadId: String(dfs.id || "1"),
          feeHeadName: dfs.name || "Tuition Fee",
          category: dfs.category || "Tuition Fee",
          amount: Number(dfs.totalAmount),
          frequency: "Quarterly",
        } as any,
      ];
    }

    let items: {
      name: string;
      amount: number;
      isApplicable: boolean;
      remarks?: string;
    }[] = [];

    const admissionDate = normalizeToISODate(
      formData.admissionDate || formData.joiningDate || "",
    );
    // MASTER SWITCH (Section 1 & 11): Checkbox is the explicit switch that controls whether Late Admission rules apply
    const isLateAdmission = Boolean(formData.isLateAdmission);
    const calculationMethod = formData.feeCalculationMethod || "Term-wise";

    const currentSchedule = (academicYearFeeSchedules || []).find(
      (s) => s.academicYear === (selectedAcademicYear || ""),
    );

    const gnd = formData.gender || "Unisex";
    const uniFeeAmount = getUniformFeeForClass(clsName, gnd, financeUniformConfigs, dynamicFeeStructures);

    const feeInputs: FeeItemInput[] = baseItems.map((i) => {
      const isMandatory = isItemMandatory(i);
      const isSelected =
        isMandatory ||
        (formData.selectedOptionalFees || []).some((idOrName) =>
          isOptionalFeeMatched(idOrName, i)
        );

      let amt = i.amount;
      let itemName = i.feeHeadName;
      const lowerName = String(i.feeHeadName || "").toLowerCase();
      const isUniform =
        lowerName.includes("uniform") || lowerName.includes("kit");
      if (isUniform) {
        amt = uniFeeAmount > 0 ? uniFeeAmount : i.amount;
      }

      const fh = (feeHeads || []).find(
        (h) =>
          (i.feeHeadId && h.id && String(h.id).toLowerCase() === String(i.feeHeadId).toLowerCase()) ||
          (h.name && i.feeHeadName && String(h.name || "").toLowerCase().trim() === String(i.feeHeadName || "").toLowerCase().trim()),
      );
      if (fh?.name) {
        itemName = fh.name;
      }

      const detectedFreq =
        i.frequency ||
        fh?.frequency ||
        (lowerName.includes("tuition") ||
         lowerName.includes("lab") ||
         lowerName.includes("tech") ||
         lowerName.includes("computer") ||
         lowerName.includes("smart") ||
         lowerName.includes("term") ||
         lowerName.includes("quarterly")
          ? "Quarterly"
          : lowerName.includes("admission") || lowerName.includes("one time")
            ? "One Time"
            : "Annual");

      return {
        feeHeadId: i.feeHeadId,
        feeHeadName: itemName,
        amount: amt,
        frequency: detectedFreq,
        category: i.category,
        isMandatory: isSelected,
      };
    });

    const calcResult = calculateLateAdmissionFees({
      feeItems: feeInputs,
      admissionDate,
      isLateAdmission,
      feeCalculationMethod: calculationMethod,
      schedule: currentSchedule,
      academicYear: selectedAcademicYear || "",
    });

    baseItems.forEach((i, idx) => {
      const computedItem = calcResult.items[idx];
      const isSelected = computedItem ? computedItem.isApplicable : true;
      const adjustedAmount = computedItem
        ? computedItem.adjustedAmount
        : i.amount;
      const lateRemarks = computedItem ? computedItem.remarks : undefined;
      const fh = (feeHeads || []).find(
        (h) =>
          (i.feeHeadId && h.id && String(h.id).toLowerCase() === String(i.feeHeadId).toLowerCase()) ||
          (h.name && i.feeHeadName && String(h.name || "").toLowerCase().trim() === String(i.feeHeadName || "").toLowerCase().trim()),
      );
      const dynamicName = fh?.name || i.feeHeadName;

      items.push({
        name: dynamicName,
        amount: isSelected ? adjustedAmount : i.amount,
        isApplicable: isSelected,
        remarks: isSelected ? lateRemarks : "Optional Fee Not Selected",
      });
    });

    const isResidentForm =
      formData.studentType === "Residential" ||
      formData.studentType === "Hosteller" ||
      formData.residentialStatus === "Residential" ||
      formData.residentialStatus === "Resident";

    const isNonResidentForm = !isResidentForm;

    const isTransportSelected =
      isNonResidentForm &&
      Boolean(formData.transportRequired) &&
      Boolean(formData.pickupPoint || formData.busRoute);

    if (isTransportSelected) {
      const rObj = routeMasters.find(
        (r) => r.id === formData.routeId || r.routeName === formData.busRoute,
      );
      const pObj = pickupPoints.find(
        (p) =>
          p.id === formData.pickupPointId ||
          (rObj &&
            p.routeId === rObj.id &&
            p.pickupName === formData.pickupPoint),
      );
      const ftc =
        financeTransportConfigs.find(
          (c) =>
            (c.routeId === rObj?.id ||
              c.routeName === rObj?.routeName ||
              c.routeName === formData.busRoute) &&
            c.status === "Active",
        ) || financeTransportConfigs[0];

      const assignment = vehicleAssignments?.find(va => va.routeId === rObj?.id);
      const vehicle = vehicleMasters?.find(v => v.id === assignment?.vehicleId);
      const isAC = vehicle ? vehicle.isAC : false;

      const baseFare = rObj
        ? (isAC ? (rObj.acMinBaseFare || rObj.acBaseFare || 0) : (rObj.minBaseFare || rObj.nonAcBaseFare || 0))
        : 0;
      const ratePerKm = rObj
        ? (isAC ? (rObj.acRatePerKm || 0) : (rObj.ratePerKm || rObj.nonAcRatePerKm || 0))
        : 0;
      const distance = pObj ? (pObj.distanceFromSchoolKm || pObj.distanceFromStart || 0) : 0;

      let calculatedFee = 0;
      if (baseFare > 0 || ratePerKm > 0) {
        calculatedFee = baseFare + distance * ratePerKm;
      }

      const monthlyRate =
        pObj && (pObj.monthlyFee ?? 0) > 0
          ? (pObj.monthlyFee ?? 0)
          : calculatedFee > 0
            ? calculatedFee
            : ftc
              ? ftc.feeAmount
              : 0;

      // Transport fee calculated for full academic year (12 months)
      const annualTrpFee = monthlyRate * 12;

      items.push({
        name: `Transport Fee (${rObj?.routeName || formData.busRoute || "Opted"}${formData.pickupPoint ? ` - ${formData.pickupPoint}` : ""})`,
        amount: annualTrpFee,
        isApplicable: true,
        remarks: monthlyRate > 0 ? `${formatCurrency(monthlyRate)}/month × 12 months` : undefined,
      });
    } else {
      items.push({
        name: "Transport Fee",
        amount: 0,
        isApplicable: false,
        remarks: isResidentForm
          ? "Not Applicable for Residential Students"
          : "Transport Not Opted / Missing Pickup Point",
      });
    }

    const isHostelOpted = isResidentForm;

    if (isHostelOpted) {
      const chosenShare = formData.sharingType || "Four Sharing";
      const chosenAc = formData.acType || "AC";
      const secDep = Number(applicableHostelFeeConfig?.securityDeposit) || 2000;
      const hstFee = Number(applicableHostelFeeConfig?.hostelFee || applicableHostelFeeConfig?.termFee) || 0;

      if (secDep > 0) {
        items.push({
          name: `Hostel Security Deposit (${chosenShare}, ${chosenAc})`,
          amount: secDep,
          isApplicable: true,
          remarks: formData.hostelSecurityDepositPaid ? "✓ Paid" : "Must pay before bed allotment",
        });
      }

      if (hstFee > 0) {
        items.push({
          name: `Hostel Accommodation Fee (${chosenShare}, ${chosenAc})`,
          amount: hstFee,
          isApplicable: true,
        });
      }
    } else {
      items.push({
        name: "Hostel Fee & Security Deposit",
        amount: 0,
        isApplicable: false,
        remarks: "Not Applicable for Day Scholars",
      });
    }

    let scholarshipAmount = 0;
    if (formData.scholarshipId) {
      const sObj = scholarships.find((s) => s.id === formData.scholarshipId);
      if (sObj && sObj.status === "Active") {
        const tuitionFeeAmount =
          baseItems.find(
            (i) => i.feeHeadId === "FH-01" || i.feeHeadName === "Tuition Fee",
          )?.amount || 25000;
        const sVal =
          sObj.discountType === "Percentage"
            ? sObj.percentage || 0
            : sObj.fixedAmount || 0;
        scholarshipAmount =
          sObj.discountType === "Percentage"
            ? (tuitionFeeAmount * sVal) / 100
            : sVal;
      }
    }

    let discountAmount = 0;
    if (formData.discountId) {
      const dObj = discounts.find((d) => d.id === formData.discountId);
      if (dObj && dObj.status === "Active") {
        const tuitionFeeAmount =
          baseItems.find(
            (i) => i.feeHeadId === "FH-01" || i.feeHeadName === "Tuition Fee",
          )?.amount || 25000;
        discountAmount =
          dObj.mode === "Percentage"
            ? (tuitionFeeAmount * dObj.value) / 100
            : dObj.value;
      }
    }

    if (scholarshipAmount > 0) {
      const sObj = scholarships.find((s) => s.id === formData.scholarshipId);
      items.push({
        name: `Scholarship Deduction${sObj?.name ? ` (${sObj.name})` : ""}`,
        amount: -scholarshipAmount,
        isApplicable: true,
      });
    }

    if (discountAmount > 0) {
      const dObj = discounts.find((d) => d.id === formData.discountId);
      items.push({
        name: `Discount Deduction${dObj?.name ? ` (${dObj.name})` : ""}`,
        amount: -discountAmount,
        isApplicable: true,
      });
    }

    // Sort items so active applicable fees appear at top, and unselected optional/non-applicable fees appear at bottom
    items.sort((a, b) => {
      if (a.isApplicable === b.isApplicable) return 0;
      return a.isApplicable ? -1 : 1;
    });

    const totalPayable = items.reduce(
      (acc, i) => acc + (i.isApplicable ? i.amount : 0),
      0,
    );

    return { items, totalPayable, isClassSelected: true };
  };

  // FULL-PAGE APPLICATION FORM VIEW
  if (isFormView) {
    return (
      <div className="space-y-2 animate-in fade-in max-w-6xl mx-auto pb-12">
        {/* Full Page Header Navigation */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseForm}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Back to Directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                {editingApp
                  ? `Edit Application #${(editingApp as any).admissionNo || editingApp.applicationNo}`
                  : "New Student Registration"}
              </h2>
            </div>
          </div>
        </div>

        {/* Full Page Layout with Sticky Live Fee Preview Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Admission Form */}
          <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-slate-900 dark:text-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Section 1: Student Details */}
              <div className="space-y-4">
                <div className="border-b border-slate-200/60 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" /> 1. Student Details
                  </h4>
                </div>

                {/* Section 1 Grid: Form Fields (Left 10 cols) + Photo Upload (Right 2 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left 10 Cols: Form Inputs */}
                  <div className="lg:col-span-10 space-y-3">
                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          First Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter First Name"
                          value={firstName}
                          onChange={(e) =>
                            setFirstName(formatTitleCase(e.target.value.replace(/[^a-zA-Z\s]/g, "")))
                          }
                          onBlur={() => setFirstName((prev) => formatTitleCase(prev.trim()))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Last Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter Last Name"
                          value={lastName}
                          onChange={(e) =>
                            setLastName(formatTitleCase(e.target.value.replace(/[^a-zA-Z\s]/g, "")))
                          }
                          onBlur={() => setLastName((prev) => formatTitleCase(prev.trim()))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Class, Gender, Campus */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Class <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <select
                            required
                            value={formData.appliedClass}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                appliedClass: val,
                              }));
                              validateAgeAndDates(undefined, undefined, val);
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                          >
                            <option value="">Select Class</option>
                            {classOptions.map((className) => (
                              <option key={className} value={className}>
                                {className}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Gender <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <select
                            required
                            value={formData.gender}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                gender: e.target.value as any,
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Campus <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <select
                            required
                            value={formData.branch}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                branch: e.target.value,
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                          >
                            <option value="">Select Campus</option>
                            {dynamicCampuses.map((branch) => (
                              <option key={branch} value={branch}>
                                {branch}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right 2 Cols: Photo Upload (Top-aligned with First Name label, Bottom-aligned with Campus input) */}
                  <div className="lg:col-span-2 flex flex-col items-center justify-between h-[120px] pt-0 shrink-0">
                    <div className="relative shrink-0">
                      {avatar ? (
                        <div className="relative">
                          <img
                            src={avatar}
                            alt="Applicant Photo Preview"
                            className="w-20 h-[78px] rounded-xl object-cover ring-2 ring-brand-500/20 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 shadow-xs border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-[78px] rounded-xl bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-100/50 dark:ring-slate-800/50 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {photoError ? (
                      <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 tracking-tight text-center animate-in fade-in">
                        {photoError}
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tracking-tight text-center">
                        Max size: 2MB
                      </span>
                    )}

                    {!avatar ? (
                      <label className="w-20 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-extrabold cursor-pointer flex items-center justify-center gap-1 shadow-xs transition-all shrink-0">
                        <Camera className="w-3.5 h-3.5" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <label className="w-20 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-all shrink-0">
                        <Camera className="w-3 h-3" /> Change
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* DOB, Blood Group, Religion, Caste Category */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Date of Birth <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={
                        formData.dob
                          ? formatToISO(formData.dob) || formData.dob
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          handleDOBChange(formatToDDMMYYYY(val, "/"));
                        } else {
                          handleDOBChange("");
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                        dobError
                          ? "border-rose-500"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    {dobError && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                        {dobError}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Blood Group <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.bloodGroup}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bloodGroup: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                      >
                        <option value="">Select</option>
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Religion
                    </label>
                    <div className="relative">
                      <select
                        value={formData.religion || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            religion: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer appearance-none pr-10"
                      >
                        <option value="">Select</option>
                        {RELIGIONS.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Caste <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    {isCustomCasteCategory ? (
                      <input
                        type="text"
                        required
                        placeholder="Specify Caste (Clear to cancel)"
                        value={
                          formData.casteCategory === "Others" ||
                          formData.casteCategory === "Other"
                            ? ""
                            : formData.casteCategory
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, casteCategory: val });
                          if (!val) {
                            setIsCustomCasteCategory(false);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    ) : (
                      <div className="relative">
                        <select
                          required
                          value={formData.casteCategory}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Others" || val === "Other") {
                              setIsCustomCasteCategory(true);
                              setFormData({
                                ...formData,
                                casteCategory: "Others",
                              });
                            } else {
                              setFormData({ ...formData, casteCategory: val });
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                          <option value="">Select</option>
                          {CASTE_CATEGORIES.map((cc) => (
                            <option key={cc} value={cc}>
                              {cc}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Date of Admission & Fee Calculation Method */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
                  <div className="sm:col-span-6">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Date of Admission <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={
                        formData.admissionDate
                          ? formatToISO(formData.admissionDate) || formData.admissionDate
                          : formData.joiningDate
                            ? formatToISO(formData.joiningDate) || formData.joiningDate
                            : ""
                      }
                      onChange={(e) => {
                        handleAdmissionDateChange(e.target.value);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                        admissionDateError
                          ? "border-rose-500"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    {admissionDateError && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                        {admissionDateError}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isLateAdmissionCheckboxAdm"
                        checked={!!formData.isLateAdmission}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({
                            ...formData,
                            isLateAdmission: checked,
                            feeCalculationMethod:
                              formData.feeCalculationMethod || "Term-wise",
                          });
                          if (checked) {
                            setIsMidYearFeeModalOpen(true);
                          }
                        }}
                        className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                      />
                      <label
                        htmlFor="isLateAdmissionCheckboxAdm"
                        className="font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                      >
                        Late Admission
                      </label>
                    </div>
                  </div>

                  {formData.isLateAdmission && (
                    <div className="sm:col-span-6 flex items-end pb-0.5">
                      <button
                        type="button"
                        onClick={() => setIsMidYearFeeModalOpen(true)}
                        className="w-full p-2.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between hover:bg-sky-100/70 dark:hover:bg-sky-900/50 transition-all cursor-pointer shadow-xs"
                      >
                        <div className="text-left">
                          <span className="block font-extrabold text-sky-900 dark:text-sky-200 text-xs">
                            Fee Calculation Method (Late Admission) <span className="text-rose-500 font-bold ml-0.5">*</span>
                          </span>
                          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                            {formData.feeCalculationMethod || "Term-wise"}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] transition-colors shadow-xs">
                          Configure
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Popup Modal for Late Admission Fee Calculation */}
                {isMidYearFeeModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 text-slate-900 dark:text-white">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                          Fee Calculation Method (Late Admission) <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsMidYearFeeModalOpen(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg cursor-pointer"
                          title="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3 pt-1">
                        <label
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            formData.feeCalculationMethod === "Full Annual Fee"
                              ? "bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 text-slate-900 dark:text-white shadow-xs"
                              : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="popupMidYearMethod"
                            value="Full Annual Fee"
                            checked={
                              formData.feeCalculationMethod === "Full Annual Fee"
                            }
                            onChange={() =>
                              setFormData({
                                ...formData,
                                feeCalculationMethod: "Full Annual Fee",
                              })
                            }
                            className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-extrabold text-xs block">
                              Full Annual Fee
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Assigns full annual fee (1 installment) regardless of admission date.
                            </span>
                          </div>
                        </label>

                        <label
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            formData.feeCalculationMethod ===
                              "Remaining Terms" ||
                            formData.feeCalculationMethod === "Term-wise" ||
                            !formData.feeCalculationMethod
                              ? "bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 text-slate-900 dark:text-white shadow-xs"
                              : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="popupMidYearMethod"
                            value="Remaining Terms"
                            checked={
                              formData.feeCalculationMethod ===
                                "Remaining Terms" ||
                              formData.feeCalculationMethod === "Term-wise" ||
                              !formData.feeCalculationMethod
                            }
                            onChange={() =>
                              setFormData({
                                ...formData,
                                feeCalculationMethod: "Remaining Terms",
                              })
                            }
                            className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-extrabold text-xs block">
                              Term-Wise Fee
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Calculates fee across applicable terms based on admission date schedule.
                            </span>
                          </div>
                        </label>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsMidYearFeeModalOpen(false)}
                          className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
                        >
                          Confirm & Apply Method
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Parent & Guardian Details */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> 2. Parent Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Father Full Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) =>
                        setFormData({ ...formData, parentName: formatTitleCase(e.target.value.replace(/[^a-zA-Z\s]/g, "")) })
                      }
                      onBlur={() =>
                        setFormData((prev) => ({ ...prev, parentName: formatTitleCase((prev.parentName || "").trim()) }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Mother Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) =>
                        setFormData({ ...formData, motherName: formatTitleCase(e.target.value.replace(/[^a-zA-Z\s]/g, "")) })
                      }
                      onBlur={() =>
                        setFormData((prev) => ({ ...prev, motherName: formatTitleCase((prev.motherName || "").trim()) }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Father Mobile <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="10-digit number"
                      value={formData.phone || ""}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                        phoneError
                          ? "border-rose-500"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    {phoneError && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                        {phoneError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Mother Mobile
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={formData.motherPhone || ""}
                      onChange={(e) => handleMotherPhoneChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                        motherPhoneError
                          ? "border-rose-500"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    {motherPhoneError && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                        {motherPhoneError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Alternate Mobile
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={formData.alternatePhone || ""}
                      onChange={(e) => handleAltPhoneChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                        altPhoneError
                          ? "border-rose-500"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    {altPhoneError && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                        {altPhoneError}
                      </p>
                    )}
                  </div>

                  <div className="relative group">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Email Address <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. parent@gmail.com"
                      value={formData.email || ""}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white outline-none ${
                        emailError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-slate-200 dark:border-slate-700 focus:border-brand-500"
                      }`}
                    />
                    {formData.email && (
                      <div className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150 absolute right-0 -top-1 -translate-y-full z-30 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold shadow-lg whitespace-nowrap border border-slate-700">
                        {formData.email}
                      </div>
                    )}
                    {emailError && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Address Breakdown */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <Home className="w-4 h-4" /> 3. Residential Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      House No
                    </label>
                    <input
                      type="text"
                      maxLength={35}
                      placeholder="e.g. 12-34, Flat 402"
                      value={formData.addressHouseNo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          addressHouseNo: val,
                        });
                        if (val.trim()) {
                          const res = validateHouseNumber(val);
                          setHouseNoError(res.isValid ? "" : res.error || "");
                        } else {
                          setHouseNoError("");
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 ${
                        houseNoError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-slate-200 dark:border-slate-700 focus:border-brand-500"
                      }`}
                    />
                    {houseNoError && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                        {houseNoError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Street
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={formData.addressStreet}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressStreet: e.target.value.slice(0, 60),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Area / Locality
                    </label>
                    <input
                      type="text"
                      value={formData.addressArea}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressArea: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      City
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      placeholder="e.g. Hyderabad, Vijayawada"
                      value={formData.addressCity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          addressCity: val,
                        });
                        if (val.trim()) {
                          const res = validateCity(val);
                          setCityError(res.isValid ? "" : res.error || "");
                        } else {
                          setCityError("");
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 ${
                        cityError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-slate-200 dark:border-slate-700 focus:border-brand-500"
                      }`}
                    />
                    {cityError && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                        {cityError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      District
                    </label>
                    <input
                      type="text"
                      value={formData.addressDistrict}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressDistrict: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.addressState}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressState: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="e.g. 560001"
                      value={formData.addressPinCode}
                      onChange={(e) => handlePinCodeChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white outline-none font-mono focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
                        pinCodeError
                          ? "border-rose-500"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    {pinCodeError && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                        {pinCodeError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Siblings */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> 4. Sibling Information
                </h4>

                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-4 animate-in fade-in">
                  {/* 1. First Question */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Any siblings?
                    </span>
                    <div className="flex gap-5 font-bold text-xs text-slate-900 dark:text-white">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-sky-600 transition-colors">
                        <input
                          type="radio"
                          name="hasSiblingsRadio"
                          checked={hasSiblings === true}
                          onChange={() => handleHasSiblingsChange(true)}
                          className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-sky-600 transition-colors">
                        <input
                          type="radio"
                          name="hasSiblingsRadio"
                          checked={hasSiblings === false}
                          onChange={() => handleHasSiblingsChange(false)}
                          className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {/* 2 & 3. Display when Yes is selected */}
                  {hasSiblings && (
                    <div className="space-y-4 pt-3 border-t border-sky-100 dark:border-sky-900/40">
                      <div className="max-w-xs">
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                          Number of Siblings <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                        <input
                          type="number"
                          min={1}
                          value={siblingsCount === 0 ? "" : siblingsCount}
                          onChange={(e) =>
                            handleSiblingsCountChange(e.target.value)
                          }
                          onBlur={() => {
                            if (!siblingsCount || siblingsCount < 1) {
                              handleSiblingsCountChange("1");
                            }
                          }}
                          placeholder="e.g. 1"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      {/* Dynamic Sibling Cards */}
                      <div className="space-y-3 pt-1">
                        {siblingDetails.map((entry, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span className="font-extrabold text-xs text-sky-700 dark:text-sky-400">
                                Sibling {idx + 1}
                              </span>
                            </div>

                            {/* Is already enrolled? */}
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                                Is this sibling already enrolled in this school?
                              </span>
                              <div className="flex gap-4 font-bold text-xs text-slate-900 dark:text-white">
                                <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                                  <input
                                    type="radio"
                                    name={`siblingIsExisting_${idx}`}
                                    checked={entry.isExisting === true}
                                    onChange={() =>
                                      handleSiblingIsExistingChange(idx, true)
                                    }
                                    className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                  Yes
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                                  <input
                                    type="radio"
                                    name={`siblingIsExisting_${idx}`}
                                    checked={entry.isExisting === false}
                                    onChange={() =>
                                      handleSiblingIsExistingChange(idx, false)
                                    }
                                    className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                  No
                                </label>
                              </div>
                            </div>

                            {/* If Existing = Yes: Searchable Existing Student Dropdown */}
                            {entry.isExisting ? (
                              <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                                  Select Existing Student <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveSiblingDropdownIdx(
                                        activeSiblingDropdownIdx === idx
                                          ? null
                                          : idx,
                                      );
                                      setSiblingSearchQuery("");
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs cursor-pointer flex justify-between items-center pr-10 font-bold text-left"
                                  >
                                    <span className="truncate">
                                      {entry.studentId
                                        ? `${entry.name} — ${entry.admissionNo || "Enrolled"}`
                                        : "Search student name or admission no..."}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </button>

                                  {activeSiblingDropdownIdx === idx && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={() =>
                                          setActiveSiblingDropdownIdx(null)
                                        }
                                      />
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-2">
                                        <div className="relative">
                                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                          <input
                                            type="text"
                                            autoFocus
                                            placeholder="Search student name or admission no..."
                                            value={siblingSearchQuery}
                                            onChange={(e) =>
                                              setSiblingSearchQuery(
                                                e.target.value,
                                              )
                                            }
                                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                                          />
                                        </div>

                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                          {students
                                            .filter((s) => {
                                              if (!siblingSearchQuery.trim())
                                                return true;
                                              const q =
                                                siblingSearchQuery.toLowerCase();
                                              return (
                                                `${s.firstName} ${s.lastName}`
                                                  .toLowerCase()
                                                  .includes(q) ||
                                                (s.admissionNo &&
                                                  s.admissionNo
                                                    .toLowerCase()
                                                    .includes(q))
                                              );
                                            })
                                            .map((s) => {
                                              const isSelected =
                                                entry.studentId === s.id;
                                              return (
                                                <div
                                                  key={s.id}
                                                  onClick={() =>
                                                    handleSelectExistingStudent(
                                                      idx,
                                                      s,
                                                    )
                                                  }
                                                  className={`px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg text-xs font-bold flex items-center gap-2.5 transition-colors ${
                                                    isSelected
                                                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                                                      : "text-slate-800 dark:text-slate-200"
                                                  }`}
                                                >
                                                  <input
                                                    type="radio"
                                                    name={`studentSelectRadio_${idx}`}
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer shrink-0"
                                                  />
                                                  <div className="flex-1 min-w-0">
                                                    <span className="truncate block font-bold">
                                                      {s.firstName} {s.lastName}{" "}
                                                      —{" "}
                                                      {s.admissionNo ||
                                                        "ADM-N/A"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-normal">
                                                      Class {s.className}{" "}
                                                      {s.section
                                                        ? `(${s.section})`
                                                        : ""}
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* If Existing = No: Manual Name Input */
                              <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                                  Sibling Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Enter sibling name"
                                  value={entry.name || ""}
                                  onChange={(e) =>
                                    handleSiblingNameChange(idx, e.target.value)
                                  }
                                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Student Type (Conditional Day Scholar vs Hosteller) */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> 5. Student Type &
                  Residential Allocation
                </h4>
                <div className="w-full">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Student Type <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative z-20">
                      <select
                        required
                        value={formData.studentType || ""}
                        onChange={(e) => {
                          const val = e.target.value as StudentType;
                          if (val === "Non-Residential") {
                            setFormData((prev: any) => ({
                              ...prev,
                              studentType: val,
                              hostelBlock: "",
                              hostelRoom: "",
                              hostelBed: "",
                              floor: "",
                              hostelSharing: "",
                              roomSharing: "",
                              hostelAcPreference: "",
                              hostelSecurityDepositPaid: false,
                              securityDepositReceiptNo: "",
                            }));
                          } else if (val === "Residential") {
                            setFormData((prev: any) => ({
                              ...prev,
                              studentType: val,
                              transportRequired: false,
                              transportType: "",
                              busRoute: "",
                              pickupPoint: "",
                              dropPoint: "",
                            }));
                          } else {
                            setFormData((prev: any) => ({
                              ...prev,
                              studentType: val,
                            }));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                      >
                        <option value="">Select Type</option>
                        <option value="Non-Residential">Non-Residential</option>
                        <option value="Residential">Residential</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Conditional Rendering for Non-Residential */}
                {(formData.studentType === "Non-Residential" ||
                  formData.studentType === "Day Scholar") && (
                  <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        School Transport Facility Required?
                      </span>
                      <div className="flex gap-4 font-bold text-xs text-slate-900 dark:text-white">
                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                          <input
                            type="radio"
                            name="trans"
                            checked={formData.transportRequired === true}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                transportRequired: true,
                              })
                            }
                            className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                          />{" "}
                          Yes (School Bus)
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-sky-600 transition-colors">
                          <input
                            type="radio"
                            name="trans"
                            checked={
                              formData.transportRequired === false ||
                              !formData.transportRequired
                            }
                            onChange={() =>
                              setFormData({
                                ...formData,
                                transportRequired: false,
                              })
                            }
                            className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                          />{" "}
                          No (Self Transport)
                        </label>
                      </div>
                    </div>

                    {formData.transportRequired && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                            Bus Route
                          </label>
                          <div className="relative">
                            <select
                              value={formData.busRoute}
                              onChange={(e) => {
                                const rName = e.target.value;
                                setFormData({
                                  ...formData,
                                  busRoute: rName,
                                  pickupPoint: "",
                                });
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                            >
                              <option value="">Select Route</option>
                              {routeMasters.map((r) => (
                                <option key={r.id} value={r.routeName}>
                                  {r.routeName} ({r.routeCode})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                            Pickup Point
                          </label>
                          <div className="relative">
                            <select
                              value={formData.pickupPoint}
                              disabled={!formData.busRoute}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  pickupPoint: e.target.value,
                                })
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
                            >
                              <option value="">
                                {formData.busRoute ? "Select Stop" : "Select Route First"}
                              </option>
                              {(() => {
                                if (!formData.busRoute) return null;
                                const rObj = routeMasters.find(
                                  (r) =>
                                    String(r.id) === String(formData.busRoute) ||
                                    r.routeName?.toLowerCase() === formData.busRoute?.toLowerCase() ||
                                    r.routeCode?.toLowerCase() === formData.busRoute?.toLowerCase()
                                );
                                const targetRouteId = String(rObj?.id || formData.busRoute);
                                const targetRouteName = (rObj?.routeName || formData.busRoute || '').trim().toLowerCase();
                                const targetRouteCode = (rObj?.routeCode || '').trim().toLowerCase();

                                const filtered = pickupPoints.filter((p) => {
                                  if (!p || !p.pickupName || p.pickupName.toLowerCase() === 'n/a') return false;
                                  const pRouteId = String(p.routeId || '');
                                  const pRouteName = (p.routeName || '').trim().toLowerCase();
                                  return (
                                    (pRouteId && (pRouteId === targetRouteId || pRouteId === String(rObj?.id))) ||
                                    (pRouteName && (pRouteName === targetRouteName || (targetRouteCode && pRouteName === targetRouteCode))) ||
                                    (targetRouteName && pRouteName.includes(targetRouteName))
                                  );
                                });

                                if (filtered.length === 0) {
                                  return (
                                    <option value="" disabled>
                                      No stops configured for this route
                                    </option>
                                  );
                                }

                                return filtered.map((p) => (
                                  <option key={p.id} value={p.pickupName}>
                                    {p.sequenceNumber ? `${p.sequenceNumber}. ` : ''}{p.pickupName} {p.arrivalTime && p.arrivalTime !== '00:00' ? `(${p.arrivalTime})` : ''}
                                  </option>
                                ));
                              })()}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Residential Accommodation Preferences (Sharing & AC Only) */}
                {(formData.studentType === "Residential" ||
                  formData.studentType === "Hosteller") && (
                  <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-2">
                        <Home className="w-4 h-4 text-sky-600" />
                        Hostel Accommodation Preferences
                      </h5>
                      <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                        Bed allotment is handled in Hostel Management
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                          Room Sharing Preference <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formData.hostelSharing || formData.roomSharing || formData.sharingType || "Four Sharing"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({
                                ...formData,
                                hostelSharing: val,
                                roomSharing: val,
                                sharingType: val,
                              });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none appearance-none cursor-pointer"
                          >
                            <option value="Single">Single Sharing (1 Person)</option>
                            <option value="Two Sharing">Two Sharing (2 Persons)</option>
                            <option value="Three Sharing">Three Sharing (3 Persons)</option>
                            <option value="Four Sharing">Four Sharing (4 Persons)</option>
                            <option value="Dormitory">Dormitory</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                          Facility Preference (AC / Non-AC) <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                hostelAc: "AC",
                                acType: "AC",
                              })
                            }
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              (formData.hostelAc === "AC" || formData.acType === "AC")
                                ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300"
                            }`}
                          >
                            AC
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                hostelAc: "Non-AC",
                                acType: "Non-AC",
                              })
                            }
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              (formData.hostelAc === "Non-AC" || formData.acType === "Non-AC" || (!formData.hostelAc && !formData.acType))
                                ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300"
                            }`}
                          >
                            Non-AC
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400">
                          Security Deposit for Hostel:{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {formatCurrency(applicableSecurityDeposit || 0)}
                          </strong>
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        formData.hostelSecurityDepositPaid
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                      }`}>
                        {applicableSecurityDeposit <= 0 ? "No Deposit Configured" : formData.hostelSecurityDepositPaid ? "✓ Deposit Paid" : "Payment Pending (Pay via Right Panel)"}
                      </span>
                    </div>
                  </div>
                )}
                {/* Financial Benefits Section */}
                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                  <h5 className="font-bold text-sky-900 dark:text-sky-200">
                    Financial Benefits
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Scholarship
                      </label>
                      <div className="relative">
                        <select
                          value={formData.scholarshipId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selSch = scholarships.find(
                              (s) => s.id === val,
                            );
                            if (
                              selSch &&
                              isSiblingConcession(selSch.name) &&
                              !hasExistingEnrolledSibling
                            ) {
                              addToast(
                                "warning",
                                "Requirement Not Met",
                                "Sibling Concession is only applicable when an existing enrolled sibling is selected.",
                              );
                              return;
                            }
                            setFormData({
                              ...formData,
                              scholarshipId: val || undefined,
                            });
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                          <option value="">None</option>
                          {scholarships.map((s) => {
                            const isSib = isSiblingConcession(s.name);
                            const isDisabled =
                              isSib && !hasExistingEnrolledSibling;
                            return (
                              <option
                                key={s.id}
                                value={s.id}
                                disabled={isDisabled}
                              >
                                {s.name} (
                                {s.discountType === "Percentage"
                                  ? `${s.percentage}%`
                                  : formatCurrency(s.fixedAmount || 0)}
                                )
                                {isDisabled
                                  ? " — [Requires Existing Enrolled Sibling]"
                                  : ""}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Discount / Concession
                      </label>
                      <div className="relative">
                        <select
                          value={formData.discountId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selDisc = discounts.find((d) => d.id === val);
                            if (
                              selDisc &&
                              isSiblingConcession(selDisc.name) &&
                              !hasExistingEnrolledSibling
                            ) {
                              addToast(
                                "warning",
                                "Requirement Not Met",
                                "Sibling Concession is only applicable when an existing enrolled sibling is selected.",
                              );
                              return;
                            }
                            setFormData({
                              ...formData,
                              discountId: val || undefined,
                            });
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                        >
                          <option value="">None</option>
                          {discounts.map((d) => {
                            const isSib = isSiblingConcession(d.name);
                            const isDisabled =
                              isSib && !hasExistingEnrolledSibling;
                            return (
                              <option
                                key={d.id}
                                value={d.id}
                                disabled={isDisabled}
                              >
                                {d.name} (
                                {d.mode === "Percentage"
                                  ? `${d.value}%`
                                  : formatCurrency(d.value)}
                                )
                                {isDisabled
                                  ? " — [Requires Existing Enrolled Sibling]"
                                  : ""}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Fee Head Selection */}
                {(() => {
                  const clsName =
                    formData.appliedClass ||
                    (classOptions && classOptions[0]) ||
                    "Class 1";
                  const matchesClass = (structCls?: string, targetCls?: string): boolean => {
                    if (!structCls || !targetCls) return false;
                    const s1 = String(structCls).replace(/^Class\s*/i, '').replace(/^Grade\s*/i, '').trim().toLowerCase();
                    const s2 = String(targetCls).replace(/^Class\s*/i, '').replace(/^Grade\s*/i, '').trim().toLowerCase();
                    return s1 === s2;
                  };
                  const structuresToSearch = (allDynamicFeeStructures && allDynamicFeeStructures.length > 0)
                    ? allDynamicFeeStructures
                    : (dynamicFeeStructures || []);

                  const studentBranch = (formData.branch || selectedBranch || "").trim().toLowerCase();

                  const dfs =
                    structuresToSearch.find(
                      (d) =>
                        matchesClass(d.className, clsName) &&
                        (d.status === "Active" || !d.status) &&
                        (!studentBranch || studentBranch === "all" || studentBranch === "all branches" ||
                         !d.branch || d.branch.toLowerCase().trim() === "all" || d.branch.toLowerCase().trim() === "all branches" ||
                         d.branch.toLowerCase().trim() === studentBranch ||
                         studentBranch.includes(d.branch.toLowerCase().trim()) ||
                         d.branch.toLowerCase().trim().includes(studentBranch))
                    ) ||
                    structuresToSearch.find(
                      (d) => matchesClass(d.className, clsName) && (d.status === "Active" || !d.status)
                    ) ||
                    structuresToSearch.find((d) => matchesClass(d.className, clsName)) ||
                    (dynamicFeeStructures || []).find(
                      (d) => matchesClass(d.className, clsName) && (d.status === "Active" || !d.status)
                    ) ||
                    (dynamicFeeStructures || []).find((d) => matchesClass(d.className, clsName));

                  const rawBaseItems = dfs ? (dfs.items || []) : [];

                  const baseItemsFiltered = rawBaseItems.filter(
                    (item) =>
                      item.feeHeadName !== "Fee Head" &&
                      item.feeHeadName !== "Fee Head:" &&
                      (feeHeads.length === 0 ||
                        feeHeads.some(
                          (h) =>
                            h.id === item.feeHeadId ||
                            String(h.name || "").toLowerCase().trim() ===
                              String(item.feeHeadName || "").toLowerCase().trim(),
                        )),
                  );

                  const baseItems = baseItemsFiltered.length > 0 ? baseItemsFiltered : rawBaseItems;

                  const optionalItems = baseItems.filter(
                    (item) => !isItemMandatory(item),
                  );

                  if (optionalItems.length === 0) return null;

                  return (
                    <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                      <h5 className="font-bold text-sky-900 dark:text-sky-200">
                        Optional Fee Selection
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Select any optional fee types to apply for this student:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {optionalItems.map((item) => {
                          const isChecked = (
                            formData.selectedOptionalFees || []
                          ).some((idOrName) =>
                            isOptionalFeeMatched(idOrName, item)
                          );
                          const lowerName = String(item.feeHeadName || "").toLowerCase();
                          const isUniform = lowerName.includes("uniform") || lowerName.includes("kit");
                          const gnd = formData.gender || "Unisex";
                          const currentUniFeeAmount = getUniformFeeForClass(clsName, gnd, financeUniformConfigs, dynamicFeeStructures);
                          const displayAmount = isUniform && currentUniFeeAmount > 0 ? currentUniFeeAmount : item.amount;
                          const matchedHead = (feeHeads || []).find(
                            (h) =>
                              (item.feeHeadId && h.id && String(h.id).toLowerCase() === String(item.feeHeadId).toLowerCase()) ||
                              (h.name && item.feeHeadName && String(h.name || "").toLowerCase().trim() === String(item.feeHeadName || "").toLowerCase().trim()),
                          );
                          const displayName = matchedHead?.name || item.feeHeadName;

                          return (
                            <label
                              key={item.feeHeadId}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const currentSelected = (
                                    formData.selectedOptionalFees || []
                                  ).map((x) => String(x));
                                  let updated: string[];
                                  if (isChecked) {
                                    updated = currentSelected.filter(
                                      (idOrName) =>
                                        !isOptionalFeeMatched(idOrName, item)
                                    );
                                  } else {
                                    updated = Array.from(
                                      new Set([
                                        ...currentSelected,
                                        item.feeHeadId,
                                        item.feeHeadName,
                                      ])
                                    );
                                  }
                                  setFormData({
                                    ...formData,
                                    selectedOptionalFees: updated,
                                  });
                                }}
                                className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                              />
                              <div>
                                <span className="block font-bold text-slate-900 dark:text-white text-xs">
                                  {displayName}
                                </span>
                                <span className="block text-[10px] text-slate-500">
                                  {formatCurrency(displayAmount)}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isSubmittingForm}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {(isSubmitting || isSubmittingForm) ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                    </>
                  ) : editingApp ? (
                    "Save Application Changes"
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right 1 Column: Sticky Live Fee Preview Panel */}
          {(() => {
            const liveFee = calculateLiveFeePreview();
            return (
              <div className="lg:col-span-1 glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-850 shadow-xl sticky top-20 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      Applicable Fees
                    </h3>
                  </div>
                  {liveFee.isClassSelected && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold text-[10px] border border-sky-200 dark:border-sky-800">
                      {formData.appliedClass} •{" "}
                      {formatStudentType(formData.studentType)}
                    </span>
                  )}
                </div>

                {!liveFee.isClassSelected ? (
                  <div className="py-6 px-3 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-slate-700">
                      <Calculator className="w-5 h-5 animate-pulse text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Select Class for Fee Structure
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px] mx-auto">
                        Select a class from the form to view tuition, transport,
                        hostel & optional fee calculations.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Line Items */}
                    <div className="space-y-2 text-xs">
                      {liveFee.items
                        .filter((item) => item.isApplicable)
                        .map((item, idx) => (
                          <div
                            key={idx}
                            className={`${
                              item.amount < 0
                                ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
                                : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60"
                            } border flex flex-col py-1.5 px-2.5 rounded-xl transition-all space-y-0.5`}
                          >
                            <div className="flex justify-between items-center w-full gap-2">
                              <span className="font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200 min-w-0 flex-1">
                                <CheckCircle2
                                  className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                                />
                                <span className="truncate" title={item.name}>
                                  {item.name}
                                </span>
                              </span>
                              <span
                                className={`font-black whitespace-nowrap shrink-0 text-right ${
                                  item.amount < 0
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-slate-900 dark:text-white"
                                }`}
                              >
                                {item.amount < 0
                                  ? `-${formatCurrency(Math.abs(item.amount))}`
                                  : item.amount > 0
                                    ? formatCurrency(item.amount)
                                    : "N/A"}
                              </span>
                            </div>
                            {item.remarks && (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 pl-5">
                                {item.remarks}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Total Summary */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                      <p className="text-[10px] uppercase font-extrabold text-emerald-800 dark:text-emerald-400 tracking-wider">
                        Total Estimated Payable
                      </p>
                      <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-300">
                        {formatCurrency(liveFee.totalPayable)}
                      </h4>
                    </div>

                    {/* Pay Button & Security Deposit Status on Right Side */}
                    {isResidentialStudent && applicableSecurityDeposit > 0 && (
                      <div className="pt-2 space-y-2">
                        {formData.hostelSecurityDepositPaid ? (
                          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Security Deposit Paid
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-extrabold">
                                VERIFIED
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                              Amount: {formatCurrency(applicableSecurityDeposit)}
                              {formData.securityDepositReceiptNo ? ` • Receipt: ${formData.securityDepositReceiptNo}` : ""}
                            </p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                              ✓ Student will reflect in Hostel Room Allocations for bed assignment.
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-amber-600" />
                                Hostel Security Deposit
                              </span>
                              <span>{formatCurrency(applicableSecurityDeposit)}</span>
                            </div>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300">
                              Hostel security deposit fee must be paid for the student to reflect in Hostel Management bed allocations.
                            </p>
                            <button
                              type="button"
                              onClick={handlePaySecurityDepositRedirect}
                              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-95"
                            >
                              <CreditCard className="w-4 h-4" />
                              Pay Hostel Security Deposit ({formatCurrency(applicableSecurityDeposit)})
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // DEFAULT DIRECTORY TABLE VIEW
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner Header */}
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />{" "}
            Admissions
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openBulkModal}
            className="inline-flex py-2 px-4 items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer transition-all"
          >
            <Upload className="w-4 h-4" /> Upload Excel
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex py-2 px-4 items-center gap-2 rounded-xl bg-sky-600 text-[11px] font-black text-white hover:bg-sky-700 shadow-lg shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" /> New Admission
          </button>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row items-start justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start gap-3 w-full lg:w-auto">
          <div className="flex flex-col w-full sm:w-64 lg:w-72">
            <div className="relative w-full h-9">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${searchError ? "text-rose-500" : "text-slate-400"}`} />
              <input
                type="text"
                placeholder="Search by applicant, admission no, or father name..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className={`w-full h-9 pl-9 ${query ? "pr-8" : "pr-4"} rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none transition ${
                  searchError
                    ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-sky-500"
                }`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSearchError(undefined);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchError && (
              <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{searchError}</span>
              </p>
            )}
          </div>

          {/* Enrolled & Un-Enrolled Navigation Badges */}
          <div className="flex items-center gap-2 shrink-0 h-9">
            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === "Enrolled" ? "All" : "Enrolled")}
              className={`px-3 h-9 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStatus === "Enrolled"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
              }`}
              title="Click to view Enrolled Students"
            >
              <UserCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Enrolled: <span className="font-extrabold">{enrolledCount}</span></span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus(filterStatus === "Un-Enrolled" ? "All" : "Un-Enrolled")}
              className={`px-3 h-9 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStatus === "Un-Enrolled"
                  ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              }`}
              title="Click to view Un-Enrolled Applications"
            >
              <Users className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Un-Enrolled: <span className="font-extrabold">{unEnrolledCount}</span></span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end min-h-[36px]">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="All">All Classes</option>
            {dynamicClassOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="All">All Status</option>
              <option value="Un-Enrolled">Un-Enrolled</option>
              <option value="Enrolled">Enrolled</option>
              {Array.from(
                new Set([
                  "Pending",
                  "Rejected",
                  ...(unifiedAdmissions || []).map((a) => {
                    const s = (a?.status || "Pending").trim();
                    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                  }),
                ]),
              )
                .filter(Boolean)
                .filter((s) => s !== "Deleted" && s !== "Enrolled" && s !== "Un-Enrolled")
                .sort()
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </div>
        </div>

      {/* Applications Table Format View */}
      <div id="printable-content" className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 print:p-0 print:border-none">
        <SchoolPrintHeader
          title="Admissions Applications Register"
          subtitle={`Total Records: ${filteredAdmissions.length}`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Admission No</th>
                <th className="py-3.5 px-4">Applicant Student</th>
                <th className="py-3.5 px-4">Applied Class</th>
                <th className="py-3.5 px-4">Student Type</th>
                <th className="py-3.5 px-4">Father Contact</th>
                <th className="py-3.5 px-4 text-center">
                  Actions & Enrollment
                </th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-slate-400 dark:text-slate-500"
                  >
                    No matching admission applications found.
                  </td>
                </tr>
              ) : (
                paginated.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <span className="text-sky-700 dark:text-sky-400 font-extrabold block">
                        {(app as any).admissionNo ||
                          (app.applicationNo && !app.applicationNo.startsWith("REG-")
                            ? app.applicationNo
                            : (app as any).admissionNo || "—")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {app.avatar ? (
                          <img
                            src={app.avatar}
                            alt=""
                            className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {app.applicantName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {app.appliedClass}
                      {app.section ? (
                        <span className="ml-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          ({app.section.toLowerCase().startsWith("section") ? app.section : `Sec ${app.section}`})
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        {formatStudentType(app.studentType)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 dark:text-slate-200">
                        {app.parentName}
                      </p>
                      <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 font-mono">
                        {app.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {app.status !== "Rejected" && (
                          <>
                            <button
                              onClick={() => setSelectedAppForView(app)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="View Application Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(app)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400"
                              title="Edit Application"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeletingApp(app)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400"
                              title="Delete Application"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Strict Status Options */}
                        {app.status === "Enrolled" || app.status === "Active" || app.status === "Admitted" ? (
                          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />{" "}
                            Enrolled
                          </span>
                        ) : app.status === "Rejected" ? (
                          <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />{" "}
                            Rejected
                          </span>
                        ) : (
                          <>
                            <button
                              disabled={isStatusUpdateLoading}
                              onClick={() =>
                                setConfirmingApp({ app, status: "Rejected" })
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                            <button
                              disabled={isStatusUpdateLoading}
                              onClick={() =>
                                setConfirmingApp({ app, status: "Enrolled" })
                              }
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Enroll
                              Student
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {filteredAdmissions.length > 0 && (
          <div className="px-4 pb-3">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredAdmissions.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => { setPageSize(n); setCurrentPage(1); }}
              label="applications"
            />
          </div>
        )}
      </div>

      {/* View Application Details Modal */}
      {selectedAppForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4">
            {/* Header with Pirnav Sky Theme Styling */}
            <div className="p-5 sm:p-6 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white relative overflow-hidden shrink-0">
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedAppForView.avatar ? (
                    <img
                      src={selectedAppForView.avatar}
                      alt={selectedAppForView.applicantName}
                      className="w-14 h-14 rounded-2xl object-cover border border-sky-200 dark:border-sky-800 shadow-xs shrink-0 bg-white dark:bg-slate-900"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-2xs shrink-0">
                      <User className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {selectedAppForView.applicantName}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          selectedAppForView.status === "Enrolled"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : selectedAppForView.status === "Rejected"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                              : selectedAppForView.status === "Approved"
                                ? "bg-sky-100/80 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-700"
                                : selectedAppForView.status === "Verified"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                  : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {selectedAppForView.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 shadow-2xs">
                        <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Adm No:{" "}
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {(selectedAppForView as any).admissionNo || selectedAppForView.applicationNo}
                        </span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 shadow-2xs">
                        <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Class:{" "}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedAppForView.appliedClass}
                          {selectedAppForView.section ? ` (${selectedAppForView.section.toLowerCase().startsWith("section") ? selectedAppForView.section : `Sec ${selectedAppForView.section}`})` : ""}
                        </span>
                      </span>
                      {selectedAppForView.branch && (
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 shadow-2xs hidden sm:inline-flex">
                          <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />{" "}
                          {selectedAppForView.branch}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAppForView(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-900 hover:bg-sky-100/60 dark:hover:bg-slate-800 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors shrink-0 cursor-pointer shadow-2xs"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-950/40 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Personal Details */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <Info className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Personal Details
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                        Date of Birth
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {selectedAppForView.dob || "Not provided"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                        Gender
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {selectedAppForView.gender || "Not specified"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                        Blood Group
                      </p>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-rose-500/20 text-rose-500" />{" "}
                        {selectedAppForView.bloodGroup || "N/A"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                        Religion & Caste
                      </p>
                      <p
                        className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
                        title={`${selectedAppForView.religion || "General"} - ${selectedAppForView.casteCategory || "General"}`}
                      >
                        {selectedAppForView.religion || "General"} •{" "}
                        {selectedAppForView.casteCategory || "General"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Parent / Guardian Details */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <Users className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Parent / Guardian Details
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Father's Name
                        </p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {selectedAppForView.parentName || "Not provided"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Primary Phone
                        </p>
                        <a
                          href={`tel:${selectedAppForView.phone}`}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                        >
                          <Phone className="w-3 h-3" />{" "}
                          {selectedAppForView.phone || "N/A"}
                        </a>
                      </div>
                    </div>

                    {selectedAppForView.motherName && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Mother's Name
                          </p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {selectedAppForView.motherName}
                          </p>
                        </div>
                        {selectedAppForView.motherPhone && (
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Mother's Phone
                            </p>
                            <a
                              href={`tel:${selectedAppForView.motherPhone}`}
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              {selectedAppForView.motherPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedAppForView.email && (
                      <div
                        className="relative group p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center gap-2"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Email Address
                          </p>
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {selectedAppForView.email}
                          </p>
                        </div>
                        <div className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150 absolute left-0 -top-1.5 -translate-y-full z-30 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold shadow-lg whitespace-nowrap border border-slate-700">
                          {selectedAppForView.email}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Transport & Accommodation */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    {formatStudentType(selectedAppForView.studentType) === "Residential" ? (
                      <Home className="w-4 h-4 text-brand-500" />
                    ) : (
                      <Bus className="w-4 h-4 text-brand-500" />
                    )}
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Transport & Accommodation
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Student Type
                      </p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold">
                        {formatStudentType(selectedAppForView.studentType)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Campus
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {selectedAppForView.branch || "-"}
                      </p>
                    </div>
                  </div>

                  {formatStudentType(selectedAppForView.studentType) === "Non-Residential" && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Transport Service
                      </p>
                      {selectedAppForView.transportRequired ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <Bus className="w-3.5 h-3.5 text-emerald-500" />{" "}
                            Route:{" "}
                            {selectedAppForView.busRoute || "Assigned Route"}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />{" "}
                            Stop:{" "}
                            {selectedAppForView.pickupPoint ||
                              "Pending allocation"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Self Commute / Transport Not Opted
                        </p>
                      )}
                    </div>
                  )}

                  {formatStudentType(selectedAppForView.studentType) === "Residential" && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Hostel Allocation
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-brand-500" />
                        {selectedAppForView.hostelBlock
                          ? `${selectedAppForView.hostelBlock} - Room ${selectedAppForView.hostelRoom || "N/A"}${selectedAppForView.hostelBed ? ` (Bed ${selectedAppForView.hostelBed})` : ""}`
                          : "Pending allocation"}
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Residential Address */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Residential Address
                      </h4>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      {selectedAppForView.addressHouseNo ||
                      selectedAppForView.addressStreet ||
                      selectedAppForView.addressCity ? (
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {[
                            selectedAppForView.addressHouseNo,
                            selectedAppForView.addressStreet,
                            selectedAppForView.addressArea,
                            selectedAppForView.addressCity,
                            selectedAppForView.addressDistrict,
                            selectedAppForView.addressState,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                          {selectedAppForView.addressPinCode &&
                            ` - ${selectedAppForView.addressPinCode}`}
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-400 dark:text-slate-500">
                          No address details recorded for this student.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Neat Layout & Action Buttons */}
            <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Application{" "}
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                  {selectedAppForView.applicationNo}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedAppForView.status !== "Rejected" && (
                  <button
                    type="button"
                    onClick={() => {
                      const appToEdit = selectedAppForView;
                      setSelectedAppForView(null);
                      handleOpenEdit(appToEdit);
                    }}
                    className="px-4 py-2 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/40 border border-brand-200 dark:border-brand-800 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Application
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedAppForView(null)}
                  className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Application Modal */}
      <ConfirmModal
        isOpen={!!deletingApp}
        title="Delete Admission Application"
        message={`Are you sure you want to delete application #${deletingApp?.applicationNo} for ${deletingApp?.applicantName}?`}
        confirmLabel="Delete Application"
        onConfirm={() => {
          if (deletingApp) {
            deleteAdmission(deletingApp.id);
            addToast(
              "success",
              "Application Removed",
              `Deleted application #${deletingApp.applicationNo}`,
            );
            setDeletingApp(null);
          }
        }}
        onCancel={() => setDeletingApp(null)}
      />

      {/* Confirmation Modal for Enrollment & Status Updates */}
      <ConfirmModal
        isOpen={!!confirmingApp}
        isLoading={isStatusUpdateLoading}
        title={
          confirmingApp?.status === "Enrolled"
            ? "Confirm Student Enrollment"
            : "Confirm Application Rejection"
        }
        variant={confirmingApp?.status === "Enrolled" ? "success" : "danger"}
        message={
          confirmingApp?.status === "Enrolled"
            ? `Are you sure you want to enroll applicant ${confirmingApp?.app?.applicantName || "this applicant"}? This will create their student record and transfer all data into Student Management.`
            : `Are you sure you want to reject application #${confirmingApp?.app?.applicationNo || ""}?`
        }
        confirmLabel={
          confirmingApp?.status === "Enrolled"
            ? "Enroll Student"
            : "Reject Application"
        }
        onConfirm={async () => {
          if (confirmingApp && confirmingApp.app) {
            setIsStatusUpdateLoading(true);
            try {
              const studentId = await updateAdmissionStatus(
                confirmingApp.app.id,
                confirmingApp.status,
              );
              if (confirmingApp.status === "Enrolled") {
                await fetchStudents();
                const appObj = confirmingApp.app;
                const appNo = appObj.applicationNo || (appObj as any).registrationNo;
                const matchedSt = students.find(
                  (s) =>
                    (studentId && String(s.id).trim() === String(studentId).trim()) ||
                    (appNo && String(s.admissionNo).trim() === String(appNo).trim()) ||
                    (appNo && s.admissionNo?.includes(appNo)) ||
                    (appObj.phone && s.phone === appObj.phone),
                );
                setFeeSummaryApp(matchedSt || appObj);
                const targetId =
                  matchedSt?.id ||
                  studentId ||
                  appObj.id ||
                  appNo;
                if (targetId) {
                  setFeeSummaryStudentId(String(targetId));
                }
              }
              addToast(
                confirmingApp.status === "Enrolled" ? "success" : "info",
                confirmingApp.status === "Enrolled"
                  ? "Student Enrolled"
                  : "Application Rejected",
                confirmingApp.status === "Enrolled"
                  ? `Student record created for ${confirmingApp.app.applicantName || "applicant"}`
                  : `Application #${confirmingApp.app.applicationNo || ""} rejected`,
              );
              setConfirmingApp(null);
            } catch (err: any) {
              addToast(
                "error",
                "Action Failed",
                err.message || "Failed to update application status."
              );
            } finally {
              setIsStatusUpdateLoading(false);
            }
          }
        }}
        onCancel={() => setConfirmingApp(null)}
      />

      {/* Post-Admission Permanent Fee Ledger Summary Modal */}
      {feeSummaryStudentId &&
        (() => {
          let ledger: any = null;
          try {
            ledger = getStudentFeeLedger(feeSummaryStudentId, feeSummaryApp);
          } catch (err) {
            console.error("Error retrieving student fee ledger:", err);
          }

          const st = students.find(
            (s) =>
              String(s.id).trim() === String(feeSummaryStudentId).trim() ||
              (s.admissionNo && String(s.admissionNo).trim() === String(feeSummaryStudentId).trim()),
          );
          const adm =
            feeSummaryApp ||
            unifiedAdmissions.find(
              (a) =>
                String(a.id).trim() === String(feeSummaryStudentId).trim() ||
                (a.applicationNo && String(a.applicationNo).trim() === String(feeSummaryStudentId).trim()) ||
                ((a as any).registrationNo && String((a as any).registrationNo).trim() === String(feeSummaryStudentId).trim()),
            );

          const rawName = st
            ? `${st.firstName} ${st.lastName || ""}`.trim()
            : adm?.applicantName ||
              (adm?.firstName ? `${adm.firstName} ${adm.lastName || ""}`.trim() : (adm as any)?.name || "");
          const stName =
            rawName && rawName.toLowerCase() !== "student" && rawName.toLowerCase() !== "enrolled student"
              ? rawName
              : (ledger?.studentName && ledger.studentName !== "Enrolled Student" ? ledger.studentName : (rawName || "Student"));

          const stAdmNo =
            st?.admissionNo ||
            adm?.applicationNo ||
            (adm as any)?.registrationNo ||
            ledger?.admissionNo ||
            feeSummaryStudentId;
          const stClass =
            adm?.appliedClass ||
            adm?.targetClass ||
            (adm as any)?.className ||
            st?.className ||
            ledger?.className ||
            "Nursery";
          const stSection = st?.section || adm?.section || (ledger?.section || "A");
          const stType = formatStudentType(
            st?.studentType ||
            adm?.studentType ||
            adm?.residentialStatus ||
            ledger?.studentType
          );

          if (!ledger) {
            ledger = {
              studentName: stName,
              admissionNo: stAdmNo,
              className: stClass,
              section: stSection,
              studentType: stType,
              academicYear: selectedAcademicYear || "",
              feeItems: [],
              totalScholarship: 0,
              totalDiscount: 0,
              totalPayable: 0,
            };
          } else {
            ledger.studentName = stName;
            ledger.admissionNo = stAdmNo;
            ledger.className = stClass;
            ledger.section = stSection;
            ledger.studentType = stType;
          }

          const feeItems = Array.isArray(ledger.feeItems) ? ledger.feeItems : [];
          const appliedFeeItems = feeItems.filter(
            (i: any) => i && i.isApplicable && (i.originalAmount || 0) > 0,
          );
          const notApplicableItems = feeItems.filter(
            (i: any) => i && !i.isApplicable,
          );

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />{" "}
                      Admission Completed Successfully
                    </h3>
                    <p className="text-xs text-slate-500">
                      Student Fee Ledger generated & initialized
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFeeSummaryStudentId(null);
                      setFeeSummaryApp(null);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Student Info Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">
                      Student Name:
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {ledger.studentName || "Student"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">
                      Admission No:
                    </span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      {ledger.admissionNo || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">
                      Class & Section:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {ledger.className || "Class 1"} - {ledger.section || "A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">
                      Student Type:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px]">
                      {formatStudentType(ledger.studentType)}
                    </span>
                  </div>
                </div>

                {/* Applied Fees List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Applied Fee Types
                  </h4>
                  <div className="space-y-1.5 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 bg-white dark:bg-slate-950">
                    {appliedFeeItems.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2 text-center">
                        Standard Fee Structure Applied
                      </div>
                    ) : (
                      appliedFeeItems.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{" "}
                            {item.headName || "Fee Item"}
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {formatCurrency(item.originalAmount || 0)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Not Applicable Fees List */}
                {notApplicableItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Not Applicable
                    </h4>
                    <div className="space-y-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-900/50">
                      {notApplicableItems.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-0.5 text-slate-400"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />{" "}
                            {item.headName || "Fee Item"}
                          </span>
                          <span className="text-[10px] italic">
                            {item.remarks || "Not Opted"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deductions & Net Payable */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-2 text-xs">
                  {(ledger.totalScholarship || 0) > 0 && (
                    <div className="flex justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span>Scholarship Deduction:</span>
                      <span>- {formatCurrency(ledger.totalScholarship || 0)}</span>
                    </div>
                  )}
                  {(ledger.totalDiscount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span>Discount / Concession:</span>
                      <span>- {formatCurrency(ledger.totalDiscount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200 dark:border-emerald-800">
                    <span className="text-sm font-black text-emerald-950 dark:text-emerald-100 uppercase">
                      Total Payable
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(ledger.totalPayable || 0)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => {
                      const printWin = window.open(
                        "",
                        "_blank",
                        "width=850,height=950",
                      );
                      if (!printWin) {
                        addToast(
                          "error",
                          "Popup Blocked",
                          "Please allow popups in your browser to print the fee summary.",
                        );
                        return;
                      }

                      const applicableItems = feeItems.filter(
                        (i: any) => i && i.isApplicable,
                      );
                      const notAppItems = feeItems.filter(
                        (i: any) => i && !i.isApplicable,
                      );

                      const html = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Student Fee Summary Statement - ${ledger.studentName || "Student"} (${ledger.admissionNo || "ADM"})</title>
                          <style>
                            @page { size: A4; margin: 15mm; }
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 0; padding: 24px; font-size: 13px; background: white; }
                            .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
                            .school-title { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; }
                            .school-tag { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 500; }
                            .doc-title { font-size: 15px; font-weight: 900; color: #0284c7; text-transform: uppercase; margin-top: 14px; letter-spacing: 1px; }
                            
                            .student-box { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
                            .info-row { font-size: 12px; }
                            .label { font-weight: 600; color: #64748b; }
                            .value { font-weight: 800; color: #0f172a; }

                            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                            th { background-color: #0284c7; color: white; text-transform: uppercase; font-size: 11px; font-weight: 800; padding: 10px 14px; text-align: left; }
                            td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                            tr:nth-child(even) { background-color: #f8fafc; }
                            
                            .not-applicable { background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; }
                            .not-applicable-head { font-size: 11px; font-weight: 800; color: #991b1b; text-transform: uppercase; margin-bottom: 6px; }

                            .total-box { background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                            .total-label { font-size: 14px; font-weight: 900; color: #065f46; text-transform: uppercase; }
                            .total-amount { font-size: 22px; font-weight: 900; color: #047857; font-family: monospace; }

                            .footer-sig { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 10px; }
                            .sig-block { text-align: center; width: 210px; }
                            .sig-line { border-top: 1px solid #94a3b8; margin-top: 45px; padding-top: 6px; font-weight: 700; font-size: 11px; color: #475569; }

                            @media print {
                              body { padding: 0; }
                              .no-print { display: none; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1 class="school-title">${schoolProfile?.name || "Pirnav Educational Institutions"}</h1>
                            <div class="school-tag">${schoolProfile?.tagline || "Empowering Minds, Shaping Tomorrow"}</div>
                            <div class="school-tag">${schoolProfile?.address || "742 Evergreen Terrace, NY"} • ${schoolProfile?.phone || "+1 (555) 019-2834"}</div>
                            <div class="doc-title">Official Student Academic Fee Summary Statement</div>
                          </div>

                          <div class="student-box">
                            <div class="info-row"><span class="label">Student Name: </span><span class="value">${ledger.studentName || "Student"}</span></div>
                            <div class="info-row"><span class="label">Admission No: </span><span class="value">${ledger.admissionNo || "—"}</span></div>
                            <div class="info-row"><span class="label">Class & Section: </span><span class="value">${ledger.className || "Class 1"} - ${ledger.section || "A"}</span></div>
                            <div class="info-row"><span class="label">Academic Session: </span><span class="value">${ledger.academicYear || selectedAcademicYear || "—"}</span></div>
                            <div class="info-row"><span class="label">Student Category: </span><span class="value">${formatStudentType(ledger.studentType)}</span></div>
                            <div class="info-row"><span class="label">Date of Statement: </span><span class="value">${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
                          </div>

                          <table>
                            <thead>
                              <tr>
                                <th>Fee Head</th>
                                <th>Category</th>
                                <th style="text-align: right;">Standard Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${applicableItems
                                .map(
                                  (item: any) => `
                                <tr>
                                  <td style="font-weight: 700; color: #0f172a;">${item.headName || "Fee Item"}</td>
                                  <td style="color: #64748b;">${item.category || "General Fee"}</td>
                                  <td style="text-align: right; font-weight: 700; font-family: monospace;">₹${(item.originalAmount || 0).toLocaleString("en-IN")}</td>
                                </tr>
                              `,
                                )
                                .join("")}
                            </tbody>
                          </table>

                          ${
                            notAppItems.length > 0
                              ? `
                            <div class="not-applicable">
                              <div class="not-applicable-head">Not Applicable Fee Heads</div>
                              ${notAppItems
                                .map(
                                  (item: any) => `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; color: #7f1d1d;">
                                  <span>• ${item.headName || "Fee Item"}</span>
                                  <span style="font-style: italic;">(Transport/Hostel Not Opted)</span>
                                </div>
                              `,
                                )
                                .join("")}
                            </div>
                          `
                              : ""
                          }

                          <div class="total-box">
                            <span class="total-label">Total Net Annual Payable:</span>
                            <span class="total-amount">₹${(ledger.totalPayable || 0).toLocaleString("en-IN")}</span>
                          </div>

                          <div class="footer-sig">
                            <div class="sig-block">
                              <div class="sig-line">Parent / Guardian Signature</div>
                            </div>
                            <div class="sig-block">
                              <div class="sig-line">Accounts Officer Signature</div>
                            </div>
                            <div class="sig-block">
                              <div class="sig-line">Principal Stamp & Signature</div>
                            </div>
                          </div>

                          <script>
                            window.onload = function() {
                              window.print();
                              setTimeout(function() { window.close(); }, 800);
                            };
                          </script>
                        </body>
                      </html>
                    `;

                      printWin.document.write(html);
                      printWin.document.close();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs text-slate-700 dark:text-slate-300 text-center cursor-pointer transition-colors"
                  >
                    Print Fee Summary
                  </button>
                  <button
                    onClick={() => {
                      downloadFeeSummaryPdf(
                        {
                          schoolName: schoolProfile?.name,
                          schoolTagline: schoolProfile?.tagline,
                          schoolAddress: schoolProfile?.address,
                          schoolPhone: schoolProfile?.phone,
                          studentName: ledger.studentName || "Student",
                          admissionNo: ledger.admissionNo || "—",
                          className: ledger.className || "Class 1",
                          section: ledger.section || "A",
                          academicYear: ledger.academicYear || selectedAcademicYear || "",
                          studentType: formatStudentType(ledger.studentType),
                          appliedFeeItems,
                          notApplicableItems,
                          totalScholarship: ledger.totalScholarship || 0,
                          totalDiscount: ledger.totalDiscount || 0,
                          totalPayable: ledger.totalPayable || 0,
                        },
                        `FeeSummary_${ledger.admissionNo || "Student"}_${ledger.academicYear || "2026"}.pdf`,
                      );
                    }}
                    className="py-2.5 px-3 rounded-xl bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 font-bold text-xs text-sky-800 dark:text-sky-300 text-center cursor-pointer transition-colors"
                  >
                    Download Summary
                  </button>
                  <button
                    onClick={() => {
                      setFeeSummaryStudentId(null);
                      setFeeSummaryApp(null);
                      addToast(
                        "info",
                        "Navigating to Fee Collection",
                        `Select ${ledger.studentName || "student"} in Fee Collection to record payment.`,
                      );
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white text-center shadow-md shadow-emerald-500/20 cursor-pointer transition-colors"
                  >
                    Fee Collection
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ENTERPRISE BULK UPLOAD ADMISSION APPLICATIONS MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            {/* Close Button */}
            <button
              onClick={closeBulkModal}
              disabled={isUploading}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors border border-slate-200/60 dark:border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Bulk Upload Applications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a single Excel file to add or update student admission applications in one enterprise-ready flow.
              </p>
            </div>

            {/* Download Template Button */}
            <div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
                isDragging
                  ? "border-sky-500 bg-sky-50/30 dark:bg-sky-950/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Drag and drop your Excel file here
                </p>
                <p className="text-[10px] text-slate-400">
                  Only `.xlsx`, `.xls`, and `.csv` files are accepted.
                </p>
              </div>
              <button
                type="button"
                onClick={() => bulkFileInputRef.current?.click()}
                className="mt-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
              >
                Choose File
              </button>
              <input
                type="file"
                ref={bulkFileInputRef}
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Selected File Details */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                    {selectedFile ? selectedFile.name : "No file selected yet"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                      : "Select an Excel file to continue"}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-black tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-1 rounded-lg">
                XLSX
              </span>
            </div>

            {/* Upload Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Upload progress</span>
                <span className="text-sky-600 font-mono">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeBulkModal}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartBulkUpload}
                disabled={!selectedFile || isUploading}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-xs font-extrabold shadow-lg shadow-sky-600/20 transition-all disabled:shadow-none cursor-pointer flex items-center gap-2"
              >
                {isUploading ? "Uploading..." : "Upload Applications"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
