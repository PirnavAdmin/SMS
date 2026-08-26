import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  UserCheck,
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
import { ConfirmModal } from "../../common/ConfirmModal";
import { DateInput } from "../../common/DateInput";
import { lookupPostalCode, getOfflinePostalInfo } from "../../../utils/postalLookup";
import {
  validate10DigitPhone,
  BLOOD_GROUPS,
  CASTE_CATEGORIES,
  BRANCHES,
} from "../../../utils/validation";
import {
  validateDOB,
  formatToDDMMYYYY,
  formatToISO,
} from "../../../utils/dateValidation";
import { formatCurrency } from "../../../utils/currency";
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
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOpt = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (selectedOpt) {
      setSearchText(selectedOpt.label);
    } else if (value) {
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
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    if (!searchText.trim()) return true;
    if (selectedOpt && searchText === selectedOpt.label) return true;
    const q = searchText.toLowerCase().trim();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subLabel || "").toLowerCase().includes(q)
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
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setSearchText(val);
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
            allowCustom && searchText.trim() ? (
              <button
                type="button"
                onClick={() => {
                  onChange(searchText.trim());
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
    addAdmission,
    updateAdmission,
    deleteAdmission,
    updateAdmissionStatus,
    fetchStudents,
    students,
    routeMasters,
    pickupPoints,
    getStudentFeeLedger,
    dynamicFeeStructures,
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
  } = useData();
  const { addToast } = useToast();
  const { selectedBranch, selectedAcademicYear } = useAuth();

  const [query, setQuery] = useState("");
  const [filterClass, setFilterClass] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState<
    "regAsc" | "regDesc" | "nameAsc" | "nameDesc" | "classAsc" | "classDesc"
  >("regDesc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Reset pagination on search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterClass, filterStatus, sortBy]);

  // View States: Table View vs Full-Page Form View
  const [isFormView, setIsFormView] = useState(initialFormOpen || false);

  const handleCloseForm = () => {
    setIsFormView(false);
    if (onNavigate && initialFormOpen) {
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
      "Main Campus",
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
      "Day Scholar",
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
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet) as any[];

          setUploadProgress(50);

          let count = 0;
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row.FirstName || row.applicantName || row.firstName || row.LastName || row.lastName) {
              const name =
                row.applicantName ||
                `${row.FirstName || row.firstName || ""} ${row.LastName || row.lastName || ""}`.trim();

              let rowDob = row.DOB || row.dob || "2018-08-15";
              if (rowDob instanceof Date && !isNaN(rowDob.getTime())) {
                rowDob = rowDob.toISOString().split("T")[0];
              } else if (typeof rowDob === "number") {
                const utcDays = Math.floor(rowDob - 25569);
                const d = new Date(utcDays * 86400 * 1000);
                if (!isNaN(d.getTime())) rowDob = d.toISOString().split("T")[0];
              } else {
                rowDob = String(rowDob).trim();
              }

              let rowAdmDate = row.DateOfAdmission || row.joiningDate || row.admissionDate || new Date().toISOString().split("T")[0];
              if (rowAdmDate instanceof Date && !isNaN(rowAdmDate.getTime())) {
                rowAdmDate = rowAdmDate.toISOString().split("T")[0];
              } else if (typeof rowAdmDate === "number") {
                const utcDays = Math.floor(rowAdmDate - 25569);
                const d = new Date(utcDays * 86400 * 1000);
                if (!isNaN(d.getTime())) rowAdmDate = d.toISOString().split("T")[0];
              } else {
                rowAdmDate = String(rowAdmDate).trim();
              }

              const newApp = {
                applicantName: name,
                appliedClass: String(row.AppliedClass || row.appliedClass || "Class 1").trim(),
                gender: String(row.Gender || row.gender || "Male").trim(),
                dob: rowDob,
                bloodGroup: String(row.BloodGroup || row.bloodGroup || "O+").trim(),
                religion: String(row.Religion || row.religion || "General").trim(),
                casteCategory: String(row.CasteCategory || row.casteCategory || "General").trim(),
                parentName: String(row.FatherFullName || row.parentName || row.fatherName || "Not Provided").trim(),
                motherName: String(row.MotherFullName || row.motherName || "Not Provided").trim(),
                phone: String(row.FatherMobile || row.phone || row.mobile || "9876543210").trim(),
                motherPhone: String(row.MotherMobile || row.motherPhone || "").trim(),
                alternatePhone: String(row.AlternateMobile || row.alternatePhone || "").trim(),
                email: String(row.Email || row.email || "").trim(),
                addressHouseNo: String(row.HouseNo || row.addressHouseNo || "").trim(),
                addressStreet: String(row.Street || row.addressStreet || "").trim(),
                addressArea: String(row.Area || row.addressArea || "").trim(),
                addressCity: String(row.City || row.addressCity || "").trim(),
                addressDistrict: String(row.District || row.addressDistrict || "").trim(),
                addressState: String(row.State || row.addressState || "").trim(),
                addressPinCode: String(row.Pincode || row.addressPinCode || "").trim(),
                branch: String(row.Campus || row.branch || selectedBranch || "Main Campus").trim(),
                status: "Pending",
                studentType: String(row.StudentType || row.studentType || "Day Scholar").trim(),
                transportRequired: Boolean(row.TransportRequired === "Yes" || row.transportRequired === true || String(row.TransportRequired).toLowerCase() === "true"),
                busRoute: String(row.BusRoute || row.busRoute || "").trim(),
                pickupPoint: String(row.PickupPoint || row.pickupPoint || "").trim(),
                joiningDate: rowAdmDate,
                admissionDate: rowAdmDate,
                submissionDate: new Date().toISOString(),
              } as unknown as Omit<
                AdmissionApplication,
                "id" | "applicationNo"
              >;

              await addAdmission(newApp, { silent: true });
              count++;
            }
            setUploadProgress(50 + Math.round(((i + 1) / data.length) * 45));
          }

          setUploadProgress(100);
          await fetchAdmissions();

          setTimeout(() => {
            addToast(
              "success",
              "Bulk Upload Complete",
              `Successfully registered ${count} admission application(s).`
            );
            setIsUploading(false);
            closeBulkModal();
          }, 400);
        } catch (err) {
          console.error(err);
          setIsUploading(false);
          setUploadProgress(0);
          addToast("error", "Upload Failed", "Failed to parse Excel file.");
        }
      };

      reader.readAsBinaryString(selectedFile);
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

  const [formData, setFormData] = useState<Partial<AdmissionApplication>>({
    appliedClass: "",
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
    branch: selectedBranch,
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
      dynamicHostelBlocks.forEach((b) => {
        list.push({
          id: b.hostelId.toString(),
          name: b.hostelName,
          type: b.hostelType,
          rawId: b.hostelId,
        });
      });
    }
    if (hostelMasters && hostelMasters.length > 0) {
      hostelMasters.forEach((h) => {
        if (
          !list.some(
            (e) =>
              e.id === h.id ||
              e.name.toLowerCase() ===
                (h.hostelName || h.name || "").toLowerCase(),
          )
        ) {
          list.push({
            id: h.id.toString(),
            name: h.hostelName || h.name || "Hostel Block",
            type: h.hostelType || "Mixed",
            rawId: h.id,
          });
        }
      });
    }
    if (hostelBlocks && hostelBlocks.length > 0) {
      hostelBlocks.forEach((hb) => {
        if (
          !list.some(
            (e) =>
              e.id === hb.id || e.name.toLowerCase() === hb.name.toLowerCase(),
          )
        ) {
          list.push({
            id: hb.id.toString(),
            name: hb.name,
            type: "Mixed",
            rawId: hb.id,
          });
        }
      });
    }
    return list;
  }, [dynamicHostelBlocks, hostelMasters, hostelBlocks]);

  const selectedBlockObj = useMemo(() => {
    if (!formData.hostelBlock) return null;
    const target = formData.hostelBlock.toString().trim().toLowerCase();
    return (
      combinedHostelBlocks.find(
        (b) =>
          b.id.toLowerCase() === target ||
          b.name.toLowerCase() === target ||
          b.rawId?.toString().toLowerCase() === target,
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
      dynamicHostelRooms.forEach((r) => {
        list.push({
          id: r.roomId.toString(),
          blockId: r.hostelId.toString(),
          blockName: r.hostelName,
          roomNumber: r.roomNumber,
          roomTypeId: r.roomTypeId,
          specification: r.roomTypeSpecification || "Standard Room",
          capacity: r.bedCapacity || 2,
          rawId: r.roomId,
        });
      });
    }

    if (hostelRooms && hostelRooms.length > 0) {
      hostelRooms.forEach((hr: any) => {
        const bId = (hr.hostelId || hr.blockId || "").toString();
        if (
          !list.some(
            (e) =>
              e.id === hr.id || e.roomNumber === (hr.roomNumber || hr.roomNo),
          )
        ) {
          list.push({
            id: hr.id.toString(),
            blockId: bId,
            blockName: hr.blockName || "",
            roomNumber: hr.roomNumber || hr.roomNo || "101",
            roomTypeId: 1,
            specification: hr.roomType || "Standard Room",
            capacity: hr.capacity || hr.bedCapacity || 2,
            rawId: hr.id,
          });
        }
      });
    }

    return list;
  }, [dynamicHostelRooms, hostelRooms]);

  const availableRoomsForSelectedBlock = useMemo(() => {
    if (!selectedBlockObj) return combinedHostelRooms;
    return combinedHostelRooms.filter(
      (r) =>
        r.blockId === selectedBlockObj.id ||
        r.blockId === selectedBlockObj.rawId?.toString() ||
        (selectedBlockObj.name &&
          r.blockName.toLowerCase() === selectedBlockObj.name.toLowerCase()),
    );
  }, [selectedBlockObj, combinedHostelRooms]);

  const selectedRoomObj = useMemo(() => {
    if (!formData.hostelRoom) return null;
    const target = formData.hostelRoom.toString().trim().toLowerCase();
    return (
      availableRoomsForSelectedBlock.find(
        (r) =>
          r.id.toLowerCase() === target ||
          r.roomNumber.toLowerCase() === target ||
          r.rawId?.toString().toLowerCase() === target,
      ) ||
      combinedHostelRooms.find(
        (r) =>
          r.id.toLowerCase() === target ||
          r.roomNumber.toLowerCase() === target ||
          r.rawId?.toString().toLowerCase() === target,
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
    const target = formData.hostelBed.toString().trim();
    const match = availableBedsForSelectedRoom.find(
      (b) =>
        b.toLowerCase() === target.toLowerCase() ||
        b.replace("BED-", "") === target.replace("BED-", ""),
    );
    return match || formData.hostelBed;
  }, [formData.hostelBed, availableBedsForSelectedRoom]);

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
  const [altPhoneError, setAltPhoneError] = useState("");
  const [dobError, setDobError] = useState("");
  const [photoError, setPhotoError] = useState("");

  const maxDobISO = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }, []);

  const classOptions = (academicClasses || []).map(
    (cls) => cls.name || (cls as any).className || "",
  );

  const handleAltPhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, alternatePhone: cleaned }));

    if (cleaned && cleaned === formData.phone) {
      setAltPhoneError(
        "Alternate mobile cannot be identical to Father primary mobile number",
      );
    } else if (cleaned && cleaned.length > 0 && cleaned.length !== 10) {
      setAltPhoneError("Alternate mobile number must be exactly 10 digits");
    } else {
      setAltPhoneError("");
    }
  };

  // Multi-filter filtering
  const filteredAdmissions = (admissions || []).filter((a) => {
    if (!a) return false;
    const applicantName = a.applicantName || "";
    const applicationNo = a.applicationNo || "";
    const parentName = a.parentName || "";
    const appliedClass = a.appliedClass || "";
    const status = a.status || "";

    const matchQuery =
      applicantName.toLowerCase().includes((query || "").toLowerCase()) ||
      applicationNo.toLowerCase().includes((query || "").toLowerCase()) ||
      parentName.toLowerCase().includes((query || "").toLowerCase());
    const matchClass = filterClass === "All" || appliedClass === filterClass;
    const matchStatus =
      filterStatus === "All" ||
      status.toLowerCase() === (filterStatus || "").toLowerCase();
    return matchQuery && matchClass && matchStatus;
  });

  const sortedAdmissions = [...filteredAdmissions].sort((a, b) => {
    const regA = a.applicationNo || "";
    const regB = b.applicationNo || "";
    const nameA = a.applicantName || "";
    const nameB = b.applicantName || "";
    const classA = a.appliedClass || "";
    const classB = b.appliedClass || "";

    if (sortBy === "regAsc") {
      return regA.localeCompare(regB, undefined, {
        numeric: true,
      });
    }
    if (sortBy === "regDesc") {
      return regB.localeCompare(regA, undefined, {
        numeric: true,
      });
    }
    if (sortBy === "nameAsc") {
      return nameA.localeCompare(nameB);
    }
    if (sortBy === "nameDesc") {
      return nameB.localeCompare(nameA);
    }
    if (sortBy === "classAsc") {
      return classA.localeCompare(classB, undefined, {
        numeric: true,
      });
    }
    if (sortBy === "classDesc") {
      return classB.localeCompare(classA, undefined, {
        numeric: true,
      });
    }
    return 0;
  });

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
      branch: "",
      joiningDate: new Date().toISOString().split("T")[0],
      admissionDate: new Date().toISOString().split("T")[0],
      isLateAdmission: false,
      feeCalculationMethod: "Term-wise",
      selectedOptionalFees: [],
      documentsSubmitted: [],
    });
    setPhoneError("");
    setDobError("");
    setPhotoError("");
    setIsFormView(true);
  };

  const handlePinCodeChange = (pinCode: string) => {
    const clean = pinCode.trim();
    setFormData((prev) => {
      const updated = { ...prev, addressPinCode: pinCode };
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

    if (clean.replace(/\D/g, "").length >= 4) {
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
    setEditingApp(app);
    const parts = app.applicantName.split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setAvatar(app.avatar || "");

    let formattedDob = app.dob || "";
    if (formattedDob.includes("-") && formattedDob.split("-").length === 3) {
      const dParts = formattedDob.split("-");
      formattedDob = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
    }

    const STANDARD_CASTES = ["OC", "BC", "MBC", "SC", "ST", "General", "OBC", "BC-A", "BC-B", "Others"];
    const isCustomCaste = Boolean(app.casteCategory && !STANDARD_CASTES.includes(app.casteCategory));
    setIsCustomCasteCategory(isCustomCaste);

    const optFees = app.selectedOptionalFees || (app as any).optionalFees || (app as any).selectedOptional || [];
    const docsSub = app.documentsSubmitted || (app as any).documents || [];
    const isTrp = Boolean(app.transportRequired || app.busRoute || app.pickupPoint);
    const sType = app.studentType === ("Hosteller" as any) ? "Residential" : app.studentType || "Day Scholar";

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
          const matchedSt = students.find((s) => s.id === sId);
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
    setDobError("");
    setPhotoError("");
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
    setFormData((prev) => ({ ...prev, phone: val }));
    if (val) {
      const res = validate10DigitPhone(val);
      setPhoneError(res.isValid ? "" : res.error || "");
    } else {
      setPhoneError("Father mobile number is required.");
    }
  };

  const handleDOBChange = (val: string) => {
    setFormData((prev) => ({ ...prev, dob: val }));
    if (val) {
      const res = validateDOB(val);
      setDobError(res.isValid ? "" : res.error || "");
    } else {
      setDobError("DOB is required.");
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isSubmittingForm) return;
    
    // Validate Student Details Required Fields
    if (!firstName || !firstName.trim()) {
      addToast("error", "Missing Required Field", "Please enter Student First Name.");
      return;
    }

    if (!lastName || !lastName.trim()) {
      addToast("error", "Missing Required Field", "Please enter Student Last Name.");
      return;
    }

    if (!formData.appliedClass || formData.appliedClass === "Select Class") {
      addToast("error", "Missing Required Field", "Please select Target Class.");
      return;
    }

    if (!formData.gender) {
      addToast("error", "Missing Required Field", "Please select Gender.");
      return;
    }

    if (!formData.branch) {
      addToast("error", "Missing Required Field", "Please select Campus.");
      return;
    }

    if (!formData.dob) {
      addToast("error", "Missing Required Field", "Please enter Date of Birth.");
      return;
    }

    if (!formData.bloodGroup) {
      addToast("error", "Missing Required Field", "Please select Blood Group.");
      return;
    }

    if (!formData.casteCategory) {
      addToast("error", "Missing Required Field", "Please select Caste.");
      return;
    }

    if (!formData.admissionDate && !formData.joiningDate) {
      addToast("error", "Missing Required Field", "Please select Date of Admission.");
      return;
    }

    // Validate Student Type Required Field
    if (!formData.studentType || formData.studentType === ("Select Type" as any)) {
      addToast("error", "Missing Required Field", "Please select Student Type.");
      return;
    }

    // Validate Parent Information Required Fields
    if (!formData.parentName || !formData.parentName.trim()) {
      addToast("error", "Missing Required Field", "Please enter Father Full Name.");
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      addToast("error", "Missing Required Field", "Please enter Father Mobile number.");
      return;
    }

    const phoneValidation = validate10DigitPhone(formData.phone || "");
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Invalid 10-digit phone");
      addToast("error", "Phone Validation Error", phoneValidation.error);
      return;
    }

    let finalDob = formData.dob || "";
    if (finalDob.includes("-") && finalDob.split("-").length === 3) {
      const dParts = finalDob.split("-");
      finalDob = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
    }

    const dobValidation = validateDOB(finalDob);
    if (!dobValidation.isValid) {
      setDobError(dobValidation.error || "Invalid DOB");
      addToast("error", "DOB Validation Error", dobValidation.error);
      return;
    }

    if (hasSiblings) {
      if (!siblingsCount || siblingsCount < 1) {
        addToast(
          "error",
          "Validation Error",
          "Number of siblings must be at least 1.",
        );
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
            return;
          }
        } else {
          if (!entry.name || !entry.name.trim()) {
            addToast(
              "error",
              "Validation Error",
              `Please enter a name for Sibling ${i + 1}.`,
            );
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
        return;
      }
    }

    const selectedStudentIds = hasSiblings
      ? (siblingDetails.map((d) => d.studentId).filter(Boolean) as string[])
      : [];

    const fullApplicantName = `${firstName.trim()} ${lastName.trim()}`;

    setIsSubmittingForm(true);
    try {
      if (editingApp) {
        await updateAdmission(editingApp.id, {
          ...formData,
          dob: finalDob,
          applicantName: fullApplicantName,
          avatar,
          hasSiblings,
          siblingsCount: hasSiblings ? siblingsCount : 0,
          siblingDetails: hasSiblings ? siblingDetails : [],
          siblingStudentId: selectedStudentIds[0] || "",
          siblingStudentIds: selectedStudentIds,
        });
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
          gender: formData.gender,
          dob: finalDob,
          bloodGroup: formData.bloodGroup,
          religion: formData.religion || "General",
          casteCategory: formData.casteCategory || "General",
          parentName: formData.parentName,
          motherName: formData.motherName || "N/A",
          email:
            formData.email ||
            `${fullApplicantName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          phone: formData.phone || "9876543210",
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
          branch: formData.branch || selectedBranch || "Main Campus",
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

            const stId = `STF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            const admNo = `ADM-2026-${Math.floor(100 + Math.random() * 900)}`;

            const newRecord = {
              id: stId,
              name: fullApplicantName,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              admissionNo: admNo,
              className: formData.appliedClass,
              section: "A",
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
        if (
          (formData.studentType === "Residential" ||
            (formData.studentType as any) === "Hosteller") &&
          formData.hostelBlock &&
          formData.hostelRoom &&
          formData.hostelBed
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

          createAllocation({
            studentId: `STF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            studentName: fullApplicantName,
            admissionNo: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
            hostelId: Number(formData.hostelBlock) || 1,
            hostelName: selBlk?.hostelName || "Ramachandra Bhavan Block",
            roomId: Number(formData.hostelRoom) || 201,
            roomNumber: selRm?.roomNumber || "101",
            bedNumber: formData.hostelBed,
            joiningDate: new Date().toISOString().split("T")[0],
            status: "Active",
          }).catch(() => {});
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
      setIsSubmittingForm(false);
    }
  };

  const isItemMandatory = (item: {
    feeHeadId?: string;
    feeHeadName: string;
    category?: string;
  }) => {
    const nameLower = (item.feeHeadName || "").toLowerCase().trim();
    const catLower = (item.category || "").toLowerCase().trim();

    const fh = feeHeads.find((h) => {
      if (!h) return false;
      if (
        item.feeHeadId &&
        h.id &&
        h.id.toLowerCase() === item.feeHeadId.toLowerCase()
      )
        return true;
      if (
        item.feeHeadId &&
        h.id &&
        h.id.replace("-0", "-") === item.feeHeadId.replace("-0", "-")
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

    const stType = formData.studentType || "Day Scholar";
    const clsName = formData.appliedClass;

    const dfs =
      dynamicFeeStructures.find(
        (d) => d.className === clsName && d.status === "Active",
      ) ||
      dynamicFeeStructures.find((d) => d.className === clsName) ||
      dynamicFeeStructures[0];
    const rawBaseItems = dfs
      ? dfs.items
      : [
          { feeHeadId: "FH-01", feeHeadName: "Tuition Fee", amount: 25000 },
          { feeHeadId: "FH-02", feeHeadName: "Admission Fee", amount: 5000 },
          {
            feeHeadId: "FH-03",
            feeHeadName: "Books & Stationery Fee",
            amount: 4500,
          },
          {
            feeHeadId: "FH-04",
            feeHeadName: "Uniform & Sports Kit Fee",
            amount: 3500,
          },
          {
            feeHeadId: "FH-05",
            feeHeadName: "Science & Computer Lab Fee",
            amount: 2500,
          },
        ];

    const baseItems = rawBaseItems.filter(
      (item) =>
        item.feeHeadName !== "Fee Head" &&
        (feeHeads.length === 0 ||
          feeHeads.some(
            (h) =>
              h.id === item.feeHeadId ||
              h.name.toLowerCase() === item.feeHeadName.toLowerCase(),
          )),
    );

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
      (s) => s.academicYear === (selectedAcademicYear || "2026-2027"),
    );

    const gnd = formData.gender || "Unisex";
    const matchingConfig = (financeUniformConfigs || []).find(
      (c) =>
        c.className === clsName &&
        c.status === "Active" &&
        (gnd.toLowerCase().includes("female")
          ? c.gender === "Female"
          : gnd.toLowerCase().includes("male")
            ? c.gender === "Male"
            : c.gender === "Unisex" || !c.gender),
    ) || (financeUniformConfigs || []).find(
      (c) => c.className === clsName && c.status === "Active"
    );
    const uniFeeAmount = matchingConfig ? Number(matchingConfig.feeAmount) || 0 : 0;

    const feeInputs: FeeItemInput[] = baseItems.map((i) => {
      const isMandatory = isItemMandatory(i);
      const isSelected =
        isMandatory ||
        (formData.selectedOptionalFees || []).some(
          (idOrName) =>
            idOrName === i.feeHeadId ||
            idOrName === i.feeHeadName ||
            idOrName.replace("-0", "-") === i.feeHeadId.replace("-0", "-") ||
            i.feeHeadId.replace("-0", "-") === idOrName.replace("-0", "-") ||
            (idOrName.toLowerCase().includes("uniform") &&
              i.feeHeadName.toLowerCase().includes("uniform")),
        );

      let amt = i.amount;
      let itemName = i.feeHeadName;
      const lowerName = (i.feeHeadName || "").toLowerCase();
      const isUniform =
        lowerName.includes("uniform") || lowerName.includes("kit");
      if (isUniform) {
        amt = uniFeeAmount > 0 ? uniFeeAmount : i.amount;
        itemName = "Uniform & Accessories";
      }

      const fh = (feeHeads || []).find(
        (h) =>
          (i.feeHeadId && h.id && h.id.toLowerCase() === i.feeHeadId.toLowerCase()) ||
          (h.name && i.feeHeadName && h.name.toLowerCase().trim() === i.feeHeadName.toLowerCase().trim()),
      );

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
      academicYear: selectedAcademicYear || "2026-2027",
    });

    baseItems.forEach((i, idx) => {
      const computedItem = calcResult.items[idx];
      const isSelected = computedItem ? computedItem.isApplicable : true;
      const adjustedAmount = computedItem
        ? computedItem.adjustedAmount
        : i.amount;
      const lateRemarks = computedItem ? computedItem.remarks : undefined;

      items.push({
        name: i.feeHeadName,
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

      const trpFee =
        pObj && (pObj.monthlyFee ?? 0) > 0
          ? (pObj.monthlyFee ?? 0)
          : ftc
            ? ftc.feeAmount
            : 5500;

      items.push({
        name: `Transport Fee (${rObj?.routeName || formData.busRoute || "Opted"}${formData.pickupPoint ? ` - ${formData.pickupPoint}` : ""})`,
        amount: trpFee,
        isApplicable: true,
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

    const hasHostelBlockSelected = Boolean(
      (formData.hostelBlock && formData.hostelBlock.trim() !== "") ||
      selectedBlockObj,
    );

    const hasHostelRoomSelected = Boolean(
      (formData.hostelRoom && formData.hostelRoom.trim() !== "") ||
      (formData.hostelBed && formData.hostelBed.trim() !== ""),
    );

    if (isHostelOpted && hasHostelBlockSelected && hasHostelRoomSelected) {
      const hObj =
        selectedBlockObj ||
        hostelMasters.find(
          (h) =>
            h.id === formData.hostelBlock ||
            h.hostelName === formData.hostelBlock ||
            h.id.toString() === formData.hostelBlock?.toString(),
        );

      const selectedRoom =
        (dynamicHostelRooms || []).find(
          (r) =>
            String(r.roomId) === String(formData.hostelRoom) ||
            String(r.roomNumber) === String(formData.hostelRoom),
        ) ||
        (roomMasters || []).find(
          (r) =>
            String(r.id) === String(formData.hostelRoom) ||
            String(r.roomNumber) === String(formData.hostelRoom),
        );

      const targetRoomTypeObj = selectedRoom
        ? (dynamicRoomTypes || []).find(
            (rt) =>
              String(rt.roomTypeId) ===
              String((selectedRoom as any).roomTypeId),
          )
        : null;

      const targetRoomType = targetRoomTypeObj
        ? targetRoomTypeObj.roomTypeSpecification
        : (selectedRoom as any)?.roomTypeSpecification ||
          (selectedRoom as any)?.roomTypeName ||
          (selectedRoom as any)?.roomType;

      let fhc = financeHostelConfigs.find((c) => {
        if (c.status !== "Active") return false;

        const blockMatch =
          (hObj &&
            c.hostelId &&
            String(c.hostelId) ===
              String((hObj as any)?.rawId || (hObj as any)?.id)) ||
          (hObj &&
            c.hostelName &&
            (hObj as any)?.hostelName &&
            c.hostelName.toLowerCase() ===
              String((hObj as any)?.hostelName).toLowerCase()) ||
          (formData.hostelBlock &&
            c.hostelName &&
            c.hostelName
              .toLowerCase()
              .includes(formData.hostelBlock.toLowerCase())) ||
          (formData.hostelBlock &&
            c.hostelName &&
            formData.hostelBlock
              .toLowerCase()
              .includes(c.hostelName.toLowerCase()));

        if (!blockMatch) return false;

        if (!targetRoomType) return true;

        const rtMatch =
          (c.roomTypeName &&
            targetRoomType &&
            c.roomTypeName.toLowerCase().trim() ===
              targetRoomType.toLowerCase().trim()) ||
          (c.roomTypeName &&
            targetRoomType &&
            c.roomTypeName
              .toLowerCase()
              .includes(targetRoomType.toLowerCase())) ||
          (c.roomTypeName &&
            targetRoomType &&
            targetRoomType
              .toLowerCase()
              .includes(c.roomTypeName.toLowerCase()));

        return rtMatch;
      });

      if (!fhc) {
        fhc =
          financeHostelConfigs.find(
            (c) =>
              c.status === "Active" &&
              ((hObj &&
                (c.hostelId === (hObj as any)?.rawId ||
                  c.hostelId === (hObj as any)?.id)) ||
                (formData.hostelBlock &&
                  c.hostelName &&
                  c.hostelName
                    .toLowerCase()
                    .includes(formData.hostelBlock.toLowerCase()))),
          ) || financeHostelConfigs.find((c) => c.status === "Active");
      }

      const hstFee = fhc ? fhc.hostelFee : 40000;
      const secDep = fhc
        ? fhc.securityDeposit !== undefined
          ? fhc.securityDeposit
          : 5000
        : 5000;

      const blockLabel =
        (hObj as any)?.hostelName ||
        (hObj as any)?.name ||
        formData.hostelBlock;
      const roomNumStr =
        (selectedRoom as any)?.roomNumber || formData.hostelRoom;
      const roomTypeLabel = targetRoomType ? ` - ${targetRoomType}` : "";

      items.push({
        name: `Hostel Accommodation Fee (${blockLabel}, Room ${roomNumStr}${roomTypeLabel})`,
        amount: hstFee,
        isApplicable: true,
      });

      if (secDep > 0) {
        items.push({
          name: "Hostel Security Deposit",
          amount: secDep,
          isApplicable: true,
        });
      }
    } else {
      items.push({
        name: "Hostel Fee & Security Deposit",
        amount: 0,
        isApplicable: false,
        remarks: isNonResidentForm
          ? "Not Applicable for Day Scholars"
          : "Hostel Fee Pending Room Assignment",
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
      items.push({
        name: "Scholarship Deduction",
        amount: -scholarshipAmount,
        isApplicable: true,
      });
    }

    if (discountAmount > 0) {
      items.push({
        name: "Discount Deduction",
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
                  ? `Edit Application #${editingApp.applicationNo}`
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
                          onChange={(e) => setFirstName(e.target.value)}
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
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Class, Gender, Campus */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Class <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <div className="relative">
                          <select
                            required
                            value={formData.appliedClass}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                appliedClass: e.target.value,
                              })
                            }
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
                            {BRANCHES.map((branch) => (
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
                    <input
                      type="text"
                      placeholder="Enter Religion"
                      value={formData.religion}
                      onChange={(e) =>
                        setFormData({ ...formData, religion: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
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
                          <option value="">Select Caste</option>
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
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          joiningDate: val,
                          admissionDate: val,
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                    />
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
                            formData.feeCalculationMethod === "Monthly"
                              ? "bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 text-slate-900 dark:text-white shadow-xs"
                              : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="popupMidYearMethod"
                            value="Monthly"
                            checked={
                              formData.feeCalculationMethod === "Monthly"
                            }
                            onChange={() =>
                              setFormData({
                                ...formData,
                                feeCalculationMethod: "Monthly",
                              })
                            }
                            className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-extrabold text-xs block">
                              Monthly
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Calculates fee from student's admission month
                              through end of Academic Year. Excludes past
                              months.
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
                              Remaining Terms
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Calculates fee for applicable remaining terms from
                              admission date. Excludes past terms.
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
                        setFormData({ ...formData, parentName: e.target.value })
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
                        setFormData({ ...formData, motherName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      1. Father Mobile <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
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
                      2. Mother Mobile
                    </label>
                    <input
                      type="text"
                      value={formData.motherPhone || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          motherPhone: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      3. Alternate Mobile
                    </label>
                    <input
                      type="text"
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

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      4. Email Address
                    </label>
                    <input
                      type="text"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
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
                      value={formData.addressHouseNo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressHouseNo: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Street
                    </label>
                    <input
                      type="text"
                      value={formData.addressStreet}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressStreet: e.target.value,
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
                      value={formData.addressCity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressCity: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    />
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
                      placeholder="e.g. 560001"
                      value={formData.addressPinCode}
                      onChange={(e) => handlePinCodeChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            studentType: e.target.value as StudentType,
                          })
                        }
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
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  pickupPoint: e.target.value,
                                })
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-10"
                            >
                              <option value="">Select Stop</option>
                              {pickupPoints
                                .filter(
                                  (p) =>
                                    p.routeName === formData.busRoute ||
                                    p.routeId ===
                                      routeMasters.find(
                                        (r) =>
                                          r.routeName === formData.busRoute,
                                      )?.id,
                                )
                                .map((p) => (
                                  <option key={p.id} value={p.pickupName}>
                                    {p.sequenceNumber}. {p.pickupName} (
                                    {p.arrivalTime})
                                  </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Conditional Rendering for Residential (Available Rooms & Beds Only) */}
                {(formData.studentType === "Residential" ||
                  formData.studentType === "Hosteller") && (
                  <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                    <h5 className="font-bold text-sky-900 dark:text-sky-200">
                      Hostel Bed Allocation
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Hostel Block
                        </label>
                        {(() => {
                          const blockMap = new Map<string, any>();
                          (hostelMasters || []).forEach((h) =>
                            blockMap.set(String(h.id), {
                              hostelId: String(h.id),
                              hostelName: h.hostelName,
                              hostelType: h.hostelType || "Boys Hostel",
                            }),
                          );
                          (dynamicHostelBlocks || []).forEach((b) =>
                            blockMap.set(String(b.hostelId), b),
                          );
                          const blockOpts = Array.from(blockMap.values()).map(
                            (b) => ({
                              value: String(b.hostelId),
                              label: b.hostelName,
                              subLabel: b.hostelType,
                            }),
                          );

                          return (
                            <SearchableCombobox
                              value={formData.hostelBlock || ""}
                              placeholder="Search or type Hostel Block..."
                              options={blockOpts}
                              onChange={(val) => {
                                setFormData({
                                  ...formData,
                                  hostelBlock: val,
                                  hostelRoom: "",
                                  hostelBed: "",
                                });
                              }}
                            />
                          );
                        })()}
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Room
                        </label>
                        {(() => {
                          const roomMap = new Map<string, any>();
                          (roomMasters || []).forEach((r) =>
                            roomMap.set(String(r.id), {
                              roomId: String(r.id),
                              hostelId: String(r.hostelId),
                              roomNumber: r.roomNumber,
                              bedCapacity: r.bedCapacity || r.capacity || 4,
                              roomTypeSpecification: r.roomTypeSpecification,
                            }),
                          );
                          (dynamicHostelRooms || []).forEach((r) =>
                            roomMap.set(String(r.roomId), r),
                          );

                          const roomOpts = Array.from(roomMap.values())
                            .filter(
                              (r) =>
                                String(r.hostelId) ===
                                String(formData.hostelBlock),
                            )
                            .map((r) => {
                              const rtObj = dynamicRoomTypes.find(
                                (rt) => rt.roomTypeId === r.roomTypeId,
                              );
                              const rCap = rtObj
                                ? rtObj.bedCapacity
                                : r.bedCapacity || 4;
                              const rName = rtObj
                                ? rtObj.roomTypeSpecification
                                : r.roomTypeSpecification || "Standard Room";
                              const occupied = dynamicAllocations.filter(
                                (a) =>
                                  (String(a.roomId) === String(r.roomId) ||
                                    String(a.roomNumber) ===
                                      String(r.roomNumber)) &&
                                  a.status === "Active",
                              ).length;
                              const isFull = occupied >= rCap;

                              return {
                                value: String(r.roomId),
                                label: `Room #${r.roomNumber} (${rName})`,
                                subLabel: `${occupied}/${rCap} Occupied${isFull ? " • FULL" : ""}`,
                                disabled: isFull,
                              };
                            });

                          return (
                            <SearchableCombobox
                              disabled={!formData.hostelBlock}
                              value={formData.hostelRoom || ""}
                              placeholder={
                                formData.hostelBlock
                                  ? "Search or type Room..."
                                  : "Select Block first"
                              }
                              options={roomOpts}
                              onChange={(val) => {
                                const selRoomObj = dynamicHostelRooms.find(
                                  (r) => String(r.roomId) === String(val),
                                );
                                const rtObj = selRoomObj
                                  ? dynamicRoomTypes.find(
                                      (rt) =>
                                        rt.roomTypeId === selRoomObj.roomTypeId,
                                    )
                                  : null;
                                const rCap = rtObj
                                  ? rtObj.bedCapacity
                                  : selRoomObj?.bedCapacity || 4;
                                const bedOpts = Array.from(
                                  { length: rCap },
                                  (_, idx) => `BED-${idx + 1}`,
                                );

                                const firstVacantBed = bedOpts.find((bed) => {
                                  return !dynamicAllocations.some(
                                    (a) =>
                                      String(a.roomId) === String(val) &&
                                      a.bedNumber === bed &&
                                      a.status === "Active",
                                  );
                                });

                                setFormData({
                                  ...formData,
                                  hostelRoom: val,
                                  hostelBed: firstVacantBed || bedOpts[0] || "",
                                });
                              }}
                            />
                          );
                        })()}
                        {(() => {
                          const selRoom = dynamicHostelRooms.find(
                            (r) => r.roomId.toString() === formData.hostelRoom,
                          );
                          if (selRoom) {
                            const rtObj = dynamicRoomTypes.find(
                              (rt) => rt.roomTypeId === selRoom.roomTypeId,
                            );
                            const rCap = rtObj
                              ? rtObj.bedCapacity
                              : selRoom.bedCapacity || 4;
                            const occupied = dynamicAllocations.filter(
                              (a) =>
                                (String(a.roomId) === String(selRoom.roomId) ||
                                  String(a.roomNumber) ===
                                    String(selRoom.roomNumber)) &&
                                a.status === "Active",
                            ).length;
                            const avail = Math.max(0, rCap - occupied);
                            return (
                              <p className="text-[10px] text-slate-400 mt-1 font-bold">
                                Occupancy:{" "}
                                <span className="text-sky-600 dark:text-sky-400 font-extrabold">
                                  {occupied} / {rCap}
                                </span>{" "}
                                Beds ({avail} Bed{avail !== 1 ? "s" : ""}{" "}
                                Available){" "}
                                {avail === 0 && (
                                  <span className="text-rose-500 font-black ml-1">
                                    [Fully Occupied]
                                  </span>
                                )}
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Bed
                        </label>
                        {(() => {
                          const selRoom = dynamicHostelRooms.find(
                            (r) => r.roomId.toString() === formData.hostelRoom,
                          );
                          const rtObj = selRoom
                            ? dynamicRoomTypes.find(
                                (rt) => rt.roomTypeId === selRoom.roomTypeId,
                              )
                            : null;
                          const rCap = rtObj
                            ? rtObj.bedCapacity
                            : selRoom
                              ? selRoom.bedCapacity || 4
                              : 4;
                          const beds = Array.from(
                            { length: rCap },
                            (_, idx) => `BED-${idx + 1}`,
                          );

                          const bedOpts = beds.map((bed) => {
                            const activeAlloc = dynamicAllocations.find(
                              (a) =>
                                (String(a.roomId) ===
                                  String(formData.hostelRoom) ||
                                  String(a.roomNumber) ===
                                    String(selRoom?.roomNumber)) &&
                                a.bedNumber === bed &&
                                a.status === "Active",
                            );
                            const pendingApp = admissions.find(
                              (app) =>
                                app.hostelRoom === formData.hostelRoom &&
                                app.hostelBed === bed &&
                                app.status === "Pending" &&
                                app.id !== editingApp?.id,
                            );
                            const isTaken = Boolean(activeAlloc || pendingApp);
                            const occupantName =
                              activeAlloc?.studentName ||
                              pendingApp?.applicantName ||
                              "Student";

                            return {
                              value: bed,
                              label: `Bed #${bed.replace(/\D/g, "") || bed}`,
                              subLabel: isTaken
                                ? `Occupied by ${occupantName}`
                                : "Vacant & Available",
                              disabled: isTaken,
                            };
                          });

                          return (
                            <SearchableCombobox
                              disabled={!formData.hostelRoom}
                              value={formData.hostelBed || ""}
                              placeholder={
                                formData.hostelRoom
                                  ? "Search or type Bed..."
                                  : "Select Room first"
                              }
                              options={bedOpts}
                              onChange={(val) => {
                                setFormData({
                                  ...formData,
                                  hostelBed: val,
                                });
                              }}
                            />
                          );
                        })()}
                      </div>
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
                  const dfs =
                    dynamicFeeStructures.find(
                      (d) => d.className === clsName && d.status === "Active",
                    ) || dynamicFeeStructures[0];
                  const rawBaseItems = dfs
                    ? dfs.items
                    : [
                        {
                          feeHeadId: "FH-01",
                          feeHeadName: "Tuition Fee",
                          amount: 25000,
                        },
                        {
                          feeHeadId: "FH-02",
                          feeHeadName: "Admission Fee",
                          amount: 5000,
                        },
                        {
                          feeHeadId: "FH-03",
                          feeHeadName: "Books & Stationery Fee",
                          amount: 4500,
                        },
                        {
                          feeHeadId: "FH-04",
                          feeHeadName: "Uniform & Sports Kit Fee",
                          amount: 3500,
                        },
                        {
                          feeHeadId: "FH-05",
                          feeHeadName: "Science & Computer Lab Fee",
                          amount: 2500,
                        },
                      ];

                  const baseItems = rawBaseItems.filter(
                    (item) =>
                      item.feeHeadName !== "Fee Head" &&
                      item.feeHeadName !== "Fee Head:" &&
                      (feeHeads.length === 0 ||
                        feeHeads.some(
                          (h) =>
                            h.id === item.feeHeadId ||
                            h.name.toLowerCase().trim() ===
                              item.feeHeadName.toLowerCase().trim(),
                        )),
                  );

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
                          ).some(
                            (idOrName) =>
                              idOrName === item.feeHeadId ||
                              idOrName === item.feeHeadName ||
                              idOrName.replace("-0", "-") ===
                                item.feeHeadId.replace("-0", "-") ||
                              item.feeHeadId.replace("-0", "-") ===
                                idOrName.replace("-0", "-") ||
                              (idOrName.toLowerCase().includes("uniform") &&
                                item.feeHeadName.toLowerCase().includes("uniform")),
                          );
                          return (
                            <label
                              key={item.feeHeadId}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const currentSelected =
                                    formData.selectedOptionalFees || [];
                                  const updated = isChecked
                                    ? currentSelected.filter(
                                        (idOrName) =>
                                          idOrName !== item.feeHeadId &&
                                          idOrName !== item.feeHeadName &&
                                          idOrName.replace("-0", "-") !==
                                            item.feeHeadId.replace("-0", "-") &&
                                          item.feeHeadId.replace("-0", "-") !==
                                            idOrName.replace("-0", "-"),
                                      )
                                    : [...currentSelected, item.feeHeadId];
                                  setFormData({
                                    ...formData,
                                    selectedOptionalFees: updated,
                                  });
                                }}
                                className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                              />
                              <div>
                                <span className="block font-bold text-slate-900 dark:text-white text-xs">
                                  {item.feeHeadName}
                                </span>
                                <span className="block text-[10px] text-slate-500">
                                  {formatCurrency(item.amount)}
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
                  disabled={isSubmittingForm}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingForm && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingApp
                    ? "Save Application Changes"
                    : "Submit Application"}
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
                      {formData.studentType || "Day Scholar"}
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
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex flex-col py-1.5 px-2.5 rounded-xl transition-all space-y-0.5"
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate max-w-[170px]">
                                  {item.name}
                                </span>
                              </span>
                              <span className="font-black text-slate-900 dark:text-white">
                                {item.amount > 0
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
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by applicant, reg no, or father name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Class:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Classes</option>
              {Array.from(
                new Set((admissions || []).map((a) => a?.appliedClass || "")),
              )
                .filter(Boolean)
                .sort()
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">
              Status:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Status</option>
              {Array.from(
                new Set([
                  "Pending",
                  "Enrolled",
                  "Rejected",
                  ...(admissions || []).map((a) => {
                    const s = (a?.status || "Pending").trim();
                    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                  }),
                ]),
              )
                .filter(Boolean)
                .filter((s) => s !== "Deleted")
                .sort()
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="regDesc">Latest Admissions</option>
              <option value="regAsc">Oldest Admissions</option>
              <option value="nameAsc">Student Name (A-Z)</option>
              <option value="nameDesc">Student Name (Z-A)</option>
              <option value="classAsc">Class (Low to High)</option>
              <option value="classDesc">Class (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table Format View */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Application Reg No</th>
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
                      {app.applicationNo}
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
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        {app.studentType}
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

                        {/* Strict Status Options */}
                        {app.status === "Enrolled" ? (
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
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>
            Showing {paginated.length} of {filteredAdmissions.length} admission
            applications
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-900 dark:text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Application Details Modal */}
      {selectedAppForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4">
            {/* Header with SMS Brand Gradient */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-600 dark:from-slate-850 dark:via-slate-900 dark:to-slate-950 text-white relative overflow-hidden shrink-0">
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedAppForView.avatar ? (
                    <img
                      src={selectedAppForView.avatar}
                      alt={selectedAppForView.applicantName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white/40 shadow-md shrink-0 bg-white/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
                      <User className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        {selectedAppForView.applicantName}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-xs ${
                          selectedAppForView.status === "Enrolled"
                            ? "bg-emerald-500/25 border-emerald-300/40 text-emerald-100"
                            : selectedAppForView.status === "Rejected"
                              ? "bg-rose-500/25 border-rose-300/40 text-rose-100"
                              : selectedAppForView.status === "Approved"
                                ? "bg-blue-500/25 border-blue-300/40 text-blue-100"
                                : selectedAppForView.status === "Verified"
                                  ? "bg-amber-500/25 border-amber-300/40 text-amber-100"
                                  : "bg-white/20 border-white/30 text-white"
                        }`}
                      >
                        {selectedAppForView.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-white/90 font-medium">
                      <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-white/80" /> App
                        No:{" "}
                        <span className="font-bold font-mono text-white">
                          {selectedAppForView.applicationNo}
                        </span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-white/80" />{" "}
                        Class:{" "}
                        <span className="font-bold text-white">
                          {selectedAppForView.appliedClass}
                        </span>
                      </span>
                      {selectedAppForView.branch && (
                        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5 hidden sm:inline-flex">
                          <MapPin className="w-3.5 h-3.5 text-white/80" />{" "}
                          {selectedAppForView.branch}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAppForView(null)}
                  className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 shadow-sm backdrop-blur-xs transition-colors shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subtle background decorative shapes */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute left-1/2 -top-10 w-40 h-40 rounded-full bg-brand-400/20 blur-2xl pointer-events-none" />
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
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Email Address
                          </p>
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {selectedAppForView.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Transport & Accommodation */}
                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    {selectedAppForView.studentType === "Hosteller" ||
                    selectedAppForView.studentType === "Residential" ? (
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
                        {selectedAppForView.studentType || "Day Scholar"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Campus
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {selectedAppForView.branch || "Main Campus"}
                      </p>
                    </div>
                  </div>

                  {(selectedAppForView.studentType === "Day Scholar" ||
                    selectedAppForView.studentType === "Non-Residential" ||
                    !selectedAppForView.studentType) && (
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

                  {(selectedAppForView.studentType === "Hosteller" ||
                    selectedAppForView.studentType === "Residential") && (
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

                  {/* Submission date tag */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Submitted:
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      {selectedAppForView.submissionDate || "N/A"}
                    </span>
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
        subtitle={
          confirmingApp?.status === "Enrolled"
            ? "Finalize Admission & Create Student Profile"
            : "Application Status Update"
        }
        variant={confirmingApp?.status === "Enrolled" ? "success" : "danger"}
        message={
          confirmingApp?.status === "Enrolled"
            ? `Are you sure you want to enroll applicant ${confirmingApp?.app.applicantName}? This will create their student record and transfer all data into Student Management.`
            : `Are you sure you want to reject application #${confirmingApp?.app.applicationNo}?`
        }
        confirmLabel={
          confirmingApp?.status === "Enrolled"
            ? "Enroll Student"
            : "Reject Application"
        }
        onConfirm={async () => {
          if (confirmingApp) {
            setIsStatusUpdateLoading(true);
            try {
              const studentId = await updateAdmissionStatus(
                confirmingApp.app.id,
                confirmingApp.status,
              );
              if (confirmingApp.status === "Enrolled") {
                await fetchStudents();
                const matchedSt = students.find(
                  (s) =>
                    s.id === studentId ||
                    s.admissionNo === confirmingApp.app.applicationNo ||
                    (confirmingApp.app.applicationNo &&
                      s.admissionNo?.includes(confirmingApp.app.applicationNo)) ||
                    s.phone === confirmingApp.app.phone,
                );
                const targetId =
                  matchedSt?.id ||
                  studentId ||
                  confirmingApp.app.id ||
                  confirmingApp.app.applicationNo;
                setFeeSummaryStudentId(targetId);
              }
              addToast(
                confirmingApp.status === "Enrolled" ? "success" : "info",
                confirmingApp.status === "Enrolled"
                  ? "Student Enrolled"
                  : "Application Rejected",
                confirmingApp.status === "Enrolled"
                  ? `Student record created for ${confirmingApp.app.applicantName}`
                  : `Application #${confirmingApp.app.applicationNo} rejected`,
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
          const ledger = getStudentFeeLedger(feeSummaryStudentId);
          if (!ledger) return null;

          const appliedFeeItems = ledger.feeItems.filter(
            (i) => i.isApplicable && i.originalAmount > 0,
          );
          const notApplicableItems = ledger.feeItems.filter(
            (i) => !i.isApplicable,
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
                    onClick={() => setFeeSummaryStudentId(null)}
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
                      {ledger.studentName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">
                      Admission No:
                    </span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      {ledger.admissionNo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">
                      Class & Section:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {ledger.className} - {ledger.section}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">
                      Student Type:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px]">
                      {ledger.studentType}
                    </span>
                  </div>
                </div>

                {/* Applied Fees List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Applied Fee Types
                  </h4>
                  <div className="space-y-1.5 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 bg-white dark:bg-slate-950">
                    {appliedFeeItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{" "}
                          {item.headName}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(item.originalAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Not Applicable Fees List */}
                {notApplicableItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Not Applicable
                    </h4>
                    <div className="space-y-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-900/50">
                      {notApplicableItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-0.5 text-slate-400"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />{" "}
                            {item.headName}
                          </span>
                          <span className="text-[10px] italic">
                            {item.remarks}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deductions & Net Payable */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-2 text-xs">
                  {ledger.totalScholarship > 0 && (
                    <div className="flex justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span>Scholarship Deduction:</span>
                      <span>- {formatCurrency(ledger.totalScholarship)}</span>
                    </div>
                  )}
                  {ledger.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span>Discount / Concession:</span>
                      <span>- {formatCurrency(ledger.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200 dark:border-emerald-800">
                    <span className="text-sm font-black text-emerald-950 dark:text-emerald-100 uppercase">
                      Total Payable
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(ledger.totalPayable)}
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

                      const applicableItems = ledger.feeItems.filter(
                        (i) => i.isApplicable,
                      );
                      const notApplicableItems = ledger.feeItems.filter(
                        (i) => !i.isApplicable,
                      );

                      const html = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Student Fee Summary Statement - ${ledger.studentName} (${ledger.admissionNo})</title>
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
                            <div class="info-row"><span class="label">Student Name: </span><span class="value">${ledger.studentName}</span></div>
                            <div class="info-row"><span class="label">Admission No: </span><span class="value">${ledger.admissionNo}</span></div>
                            <div class="info-row"><span class="label">Class & Section: </span><span class="value">${ledger.className} - ${ledger.section}</span></div>
                            <div class="info-row"><span class="label">Academic Session: </span><span class="value">${ledger.academicYear}</span></div>
                            <div class="info-row"><span class="label">Student Category: </span><span class="value">${ledger.studentType}</span></div>
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
                                  (item) => `
                                <tr>
                                  <td style="font-weight: 700; color: #0f172a;">${item.headName}</td>
                                  <td style="color: #64748b;">${item.category || "General Fee"}</td>
                                  <td style="text-align: right; font-weight: 700; font-family: monospace;">₹${item.originalAmount.toLocaleString("en-IN")}</td>
                                </tr>
                              `,
                                )
                                .join("")}
                            </tbody>
                          </table>

                          ${
                            notApplicableItems.length > 0
                              ? `
                            <div class="not-applicable">
                              <div class="not-applicable-head">Not Applicable Fee Heads</div>
                              ${notApplicableItems
                                .map(
                                  (item) => `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; color: #7f1d1d;">
                                  <span>• ${item.headName}</span>
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
                            <span class="total-amount">₹${ledger.totalPayable.toLocaleString("en-IN")}</span>
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
                      const applicableItems = ledger.feeItems.filter(
                        (i) => i.isApplicable,
                      );
                      let text = `====================================================\n`;
                      text += `   ${schoolProfile?.name || "PIRNAV EDUCATIONAL INSTITUTIONS"}\n`;
                      text += `        STUDENT ANNUAL FEE SUMMARY STATEMENT\n`;
                      text += `====================================================\n\n`;
                      text += `Student Name   : ${ledger.studentName}\n`;
                      text += `Admission No   : ${ledger.admissionNo}\n`;
                      text += `Class & Section: ${ledger.className} - ${ledger.section}\n`;
                      text += `Academic Year  : ${ledger.academicYear}\n`;
                      text += `Student Type   : ${ledger.studentType}\n`;
                      text += `Date           : ${new Date().toLocaleDateString()}\n\n`;
                      text += `----------------------------------------------------\n`;
                      text += `APPLICABLE FEE HEAD BREAKDOWN\n`;
                      text += `----------------------------------------------------\n`;
                      applicableItems.forEach((i) => {
                        text += `${i.headName.padEnd(32)}: ₹${i.originalAmount.toLocaleString("en-IN")}\n`;
                      });
                      if (ledger.totalScholarship > 0) {
                        text += `Scholarship Deduction           : -₹${ledger.totalScholarship.toLocaleString("en-IN")}\n`;
                      }
                      if (ledger.totalDiscount > 0) {
                        text += `Discount / Concession           : -₹${ledger.totalDiscount.toLocaleString("en-IN")}\n`;
                      }
                      text += `----------------------------------------------------\n`;
                      text += `TOTAL NET ANNUAL PAYABLE        : ₹${ledger.totalPayable.toLocaleString("en-IN")}\n`;
                      text += `====================================================\n`;

                      const blob = new Blob([text], {
                        type: "text/plain;charset=utf-8",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `FeeSummary_${ledger.admissionNo}_${ledger.academicYear}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 font-bold text-xs text-sky-800 dark:text-sky-300 text-center cursor-pointer transition-colors"
                  >
                    Download Summary
                  </button>
                  <button
                    onClick={() => {
                      setFeeSummaryStudentId(null);
                      addToast(
                        "info",
                        "Navigating to Fee Collection",
                        `Select ${ledger.studentName} in Fee Collection to record payment.`,
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
