import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Shield,
  ChevronDown,
  Upload,
  User,
  X,
  Download,
  UploadCloud,
  FileSpreadsheet,
} from "lucide-react";
import { Staff } from "../../../types";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { Badge } from "../../common/Badge";
import { ExportButton } from "../../common/ExportButton";
import { ConfirmModal } from "../../common/ConfirmModal";
import { StaffFormModal } from "./StaffFormModal";
import { StaffProfileDrawer } from "./StaffProfileDrawerEnhanced";
import { DocumentRequirementMasterModal } from "./DocumentRequirementMasterModal";
import {
  normalizeStaffType,
  getDepartmentOptions,
  getDesignationOptions,
  teachingDeptNames,
  nonTeachingDeptNames,
  teachingDesignationNames,
  nonTeachingDesignationNames,
} from "./staffFlowOptions";

import { useAuth } from "../../../context/AuthContext";
import { TeacherProfileView } from "./TeacherProfileView";

const StaffListRowAvatar: React.FC<{ st: Staff }> = ({ st }) => {
  const [imgErr, setImgErr] = useState(false);
  useEffect(() => {
    setImgErr(false);
  }, [st.avatar, st.id]);

  if (!imgErr && st.avatar) {
    return (
      <img
        src={st.avatar}
        alt=""
        onError={() => setImgErr(true)}
        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-800"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black uppercase">
      {((st.firstName?.[0] || '') + (st.lastName?.[0] || '')).toUpperCase() || <User className="w-4 h-4 text-slate-400" />}
    </div>
  );
};

export const StaffList: React.FC<{
  initialCategory?: string;
  onNavigate?: (module: string) => void;
}> = ({ initialCategory, onNavigate }) => {
  const { role } = useAuth();

  if (role && role.toLowerCase() === "teacher") {
    return <TeacherProfileView />;
  }

  const {
    staff,
    addStaff,
    updateStaff,
    deleteStaff,
    subjects,
    departments,
    designations,
  } = useData();
  const { addToast } = useToast();

  const [activeCategory, setActiveCategory] = useState<string>(
    normalizeStaffType(initialCategory || "Teaching Staff"),
  );

  const subjectDropdownRef = useRef<HTMLDivElement>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const designationDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        subjectDropdownRef.current &&
        !subjectDropdownRef.current.contains(event.target as Node)
      ) {
        setSubjectDropdownOpen(false);
      }
      if (
        deptDropdownRef.current &&
        !deptDropdownRef.current.contains(event.target as Node)
      ) {
        setDeptDropdownOpen(false);
      }
      if (
        designationDropdownRef.current &&
        !designationDropdownRef.current.contains(event.target as Node)
      ) {
        setDesignationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filters state
  const [query, setQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [deptSearch, setDeptSearch] = useState("");
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState("All");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [filterDesignation, setFilterDesignation] = useState("All");
  const [designationSearch, setDesignationSearch] = useState("");
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);
  const [filterEmploymentType, setFilterEmploymentType] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "nameAsc" | "nameDesc">("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [isRuleMasterOpen, setIsRuleMasterOpen] = useState(false);

  // Bulk upload modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to categorize staff dynamically for backward compatibility
  const getStaffCategory = (s: Staff): string => {
    return normalizeStaffType(
      s.employeeCategory ||
        (s.role === "Teacher" ? "Teaching Staff" : "Non-Teaching Staff"),
    );
  };

  const getCategoryLabel = (category: string) => normalizeStaffType(category);

  const getProfileStatus = (s: Staff) => {
    if (s.profileStatus) return s.profileStatus;
    return s.currentAddress ||
      s.residentialAddress ||
      s.permanentAddress ||
      s.bankDetails?.accountNumber ||
      s.documents?.length
      ? "Completed"
      : "Incomplete";
  };

  const openStaffRegistration = () => {
    try {
      sessionStorage.setItem("staff-registration-category", activeCategory);
    } catch {
      // Ignore storage failures and keep navigation working.
    }

    if (onNavigate) {
      onNavigate("staff-add");
      return;
    }

    setStaffToEdit(null);
    setIsAddOpen(true);
  };

  const categoryStaffList = staff.filter(
    (s) => getStaffCategory(s) === activeCategory,
  );

  // Apply filters
  const filtered = categoryStaffList.filter((s) => {
    const nameMatch =
      `${s.firstName} ${s.lastName}`
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      s.empId.toLowerCase().includes(query.toLowerCase());
    const deptMatch = filterDept === "All" || s.department === filterDept;

    const subjectMatch =
      activeCategory !== "Teaching Staff" ||
      filterSubject === "All" ||
      s.assignedSubjects?.includes(filterSubject);

    const desigMatch =
      filterDesignation === "All" || s.designation === filterDesignation;

    const empTypeMatch =
      filterEmploymentType === "All" ||
      (s.employmentType || "Full-Time").toLowerCase() ===
        filterEmploymentType.toLowerCase();

    const branchMatch =
      filterBranch === "All" ||
      (s.branch || "Main Campus").toLowerCase() === filterBranch.toLowerCase();

    const statusMatch =
      filterStatus === "All" ||
      (filterStatus === "Inactive"
        ? s.status !== "Active"
        : s.status === filterStatus);

    return (
      nameMatch &&
      deptMatch &&
      subjectMatch &&
      desigMatch &&
      empTypeMatch &&
      branchMatch &&
      statusMatch
    );
  });

  const parseDate = (dStr: string) => {
    if (!dStr) return 0;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime() || 0;
      }
    }
    return new Date(dStr).getTime() || 0;
  };

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "latest") {
      const d1 = parseDate(a.joiningDate);
      const d2 = parseDate(b.joiningDate);
      if (d1 !== d2) return d2 - d1;
      return (b.empId || "").localeCompare(a.empId || "", undefined, { numeric: true });
    }
    if (sortBy === "oldest") {
      const d1 = parseDate(a.joiningDate);
      const d2 = parseDate(b.joiningDate);
      if (d1 !== d2) return d1 - d2;
      return (a.empId || "").localeCompare(b.empId || "", undefined, { numeric: true });
    }
    if (sortBy === "nameAsc") {
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (sortBy === "nameDesc") {
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
      return nameB.localeCompare(nameA);
    }
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const toggleStatus = (s: Staff) => {
    const nextStatus = s.status === "Active" ? "Inactive" : "Active";
    updateStaff(s.id, { status: nextStatus as any });
    addToast("info", "Status Updated", `${s.firstName} is now ${nextStatus}`);
  };

  // Derive filter lists using getDepartmentOptions and getDesignationOptions
  const uniqueDepts = Array.from(
    new Set([
      ...getDepartmentOptions(activeCategory, departments),
      ...categoryStaffList.map((s) => s.department).filter(Boolean),
    ]),
  ).filter(dept => {
    if (activeCategory === "Teaching Staff") {
      return !nonTeachingDeptNames.has(dept);
    } else {
      return !teachingDeptNames.has(dept);
    }
  });
  const uniqueDesignations = Array.from(
    new Set([
      ...getDesignationOptions(activeCategory, "", designations),
      ...categoryStaffList.map((s) => s.designation).filter(Boolean),
    ]),
  ).filter(desig => {
    if (activeCategory === "Teaching Staff") {
      return !nonTeachingDesignationNames.has(desig);
    } else {
      return !teachingDesignationNames.has(desig);
    }
  });

  const handleTabChange = (cat: string) => {
    setActiveCategory(cat);
    setFilterDept("All");
    setFilterSubject("All");
    setFilterDesignation("All");
    setFilterStatus("All");
    setCurrentPage(1);
  };

  const openBulkModal = () => {
    setIsBulkModalOpen(true);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const closeBulkModal = () => {
    if (isUploading) return;
    setIsBulkModalOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      addToast("error", "Invalid File", "Only .xlsx and .xls Excel files are accepted.");
      return;
    }
    setSelectedFile(file);
    setUploadProgress(0);
  };

  const downloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const sampleRow = {
        "empId": "EMP1001",
        "firstName": "John",
        "middleName": "Robert",
        "lastName": "Doe",
        "employeeCategory": activeCategory,
        "gender": "Male",
        "dob": "1990-05-15",
        "bloodGroup": "O+",
        "mobileNumber": "9876543210",
        "alternateMobileNumber": "9876543211",
        "email": "john.doe@school.com",
        "aadhaarNumber": "123456789012",
        "panNumber": "ABCDE1234F",
        "presentAddress": "123 Main Street",
        "permanentAddress": "123 Main Street",
        "city": "Hyderabad",
        "state": "Telangana",
        "pinCode": "500001",
        "branch": "Main Campus",
        "department": activeCategory === "Teaching Staff" ? "Mathematics" : "Administration",
        "designation": activeCategory === "Teaching Staff" ? "PGT Teacher" : "Administrator",
        "employmentType": "Full Time",
        "joiningDate": "2024-06-01"
      };
      const worksheet = XLSX.utils.json_to_sheet([sampleRow]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      XLSX.writeFile(workbook, "bulk_employee_template.xlsx");
      addToast("success", "Template Downloaded", "The Excel template has been downloaded.");
    } catch (err) {
      addToast("error", "Error", "Failed to generate template.");
    }
  };

  const handleUploadExecute = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 150);

    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet) as any[];

          let count = 0;
          data.forEach((row) => {
            if (row.firstName || row.lastName || row.applicantName) {
              const fName =
                row.firstName ||
                (row.applicantName
                  ? row.applicantName.split(" ")[0]
                  : "Unknown");
              const lName =
                row.lastName ||
                (row.applicantName
                  ? row.applicantName.split(" ").slice(1).join(" ")
                  : "Unknown");
              const newStaff: Omit<Staff, "id"> = {
                empId: row.empId || `EMP${Math.floor(1000 + Math.random() * 9000)}`,
                firstName: fName,
                middleName: row.middleName || "",
                lastName: lName,
                employeeCategory: row.employeeCategory || activeCategory,
                gender: row.gender || "Male",
                dob: row.dob || "",
                bloodGroup: row.bloodGroup || "",
                mobileNumber: row.mobileNumber || row.phone || row.mobile || "",
                alternateMobileNumber: row.alternateMobileNumber || "",
                email: row.email || `${fName.toLowerCase()}@pirnav.com`,
                aadhaarNumber: row.aadhaarNumber || "",
                panNumber: row.panNumber || "",
                presentAddress: row.presentAddress || "",
                permanentAddress: row.permanentAddress || "",
                city: row.city || "",
                state: row.state || "",
                pinCode: row.pinCode || "",
                branch: row.branch || "Main Campus",
                department: row.department || "General",
                designation: row.designation || (activeCategory === "Teaching Staff" ? "Subject Teacher" : "Administrator"),
                employmentType: row.employmentType || "Full Time",
                joiningDate: row.joiningDate || "",
                role: activeCategory === "Teaching Staff" ? "Teacher" : "Staff",
                status: "Active",
                assignedClasses: [],
                assignedSubjects: [],
              } as unknown as Omit<Staff, "id">;
              addStaff(newStaff);
              count++;
            }
          });

          setUploadProgress(100);
          setTimeout(() => {
            addToast(
              "success",
              "Upload Complete",
              `Successfully imported ${count} ${getCategoryLabel(activeCategory)} records.`,
            );
            setIsBulkModalOpen(false);
            setSelectedFile(null);
            setIsUploading(false);
          }, 300);
        } catch (err) {
          clearInterval(interval);
          setIsUploading(false);
          console.error(err);
          addToast("error", "Upload Failed", "Failed to parse Excel file.");
        }
      };
      reader.readAsBinaryString(selectedFile);
    } catch (err) {
      clearInterval(interval);
      setIsUploading(false);
      addToast("error", "Error", "Failed to load excel parser.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Title Header */}
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />{" "}
            {getCategoryLabel(activeCategory)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openBulkModal}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload Excel
          </button>
          <ExportButton
            data={filtered}
            filename={`${activeCategory.toLowerCase()}_directory`}
          />
          <button
            onClick={openStaffRegistration}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />{" "}
            {`Add ${getCategoryLabel(activeCategory)}`}
          </button>
        </div>
      </div>

      {/* Top Segmented Tab Switches (2 Staff Types: Teaching & Non-Teaching) */}
      <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 w-full sm:w-fit border border-slate-200/40 dark:border-slate-800">
        {[
          {
            key: "Teaching Staff",
            label: "Teaching Staff",
            icon: GraduationCap,
          },
          {
            key: "Non-Teaching Staff",
            label: "Non-Teaching Staff",
            icon: Briefcase,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const count = staff.filter(
            (s) => getStaffCategory(s) === tab.key,
          ).length;
          const isActive = activeCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-950 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Advanced Filters Block */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3">
          {/* Query search */}
          <div className="relative flex-[2] min-w-[200px] w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 " />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
            />
          </div>

          {/* Department */}
          <div
            ref={deptDropdownRef}
            className="relative flex-1 min-w-[140px] w-full"
          >
            <div
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 cursor-pointer h-full"
              onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
            >
              <span className="text-xs text-slate-900 dark:text-white font-semibold flex-1 truncate">
                {filterDept === "All" ? "All Departments" : filterDept}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
            </div>

            {deptDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-[160px] overflow-y-auto py-1">
                  <div
                    className={`px-3 py-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${filterDept === "All" ? "text-brand-600 font-bold bg-brand-50/50 dark:bg-brand-900/20" : "text-slate-700 dark:text-slate-300"}`}
                    onClick={() => {
                      setFilterDept("All");
                      setCurrentPage(1);
                      setDeptDropdownOpen(false);
                      setDeptSearch("");
                    }}
                  >
                    All Departments
                  </div>
                  {uniqueDepts
                    .filter((d) =>
                      d.toLowerCase().includes(deptSearch.toLowerCase()),
                    )
                    .map((dept) => (
                      <div
                        key={dept}
                        className={`px-3 py-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${filterDept === dept ? "text-brand-600 font-bold bg-brand-50/50 dark:bg-brand-900/20" : "text-slate-700 dark:text-slate-300"}`}
                        onClick={() => {
                          setFilterDept(dept);
                          setCurrentPage(1);
                          setDeptDropdownOpen(false);
                          setDeptSearch("");
                        }}
                      >
                        <div className="font-semibold">{dept}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Code: {dept.substring(0, 3).toUpperCase()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex-1 min-w-[140px] w-full">
            <div className="relative h-full">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none appearance-none cursor-pointer h-full"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sort By */}
          <div className="flex-1 min-w-[140px] w-full">
            <div className="relative h-full">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none appearance-none cursor-pointer h-full"
              >
                <option value="latest">Sort: Latest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="nameAsc">Sort: Name (A-Z)</option>
                <option value="nameDesc">Sort: Name (Z-A)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-650 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Dynamic Second Filter (Subject/Designation) */}
          {activeCategory === "Teacher" && subjects.length > 0 && (
            <div
              ref={subjectDropdownRef}
              className="relative flex-1 min-w-[140px] w-full"
            >
              <div
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 cursor-pointer h-full"
                onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
              >
                <span className="text-xs text-slate-900 dark:text-white font-semibold flex-1 truncate">
                  {filterSubject === "All" ? "All Subjects" : filterSubject}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
              </div>

              {subjectDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-[160px] overflow-y-auto py-1">
                    <div
                      className={`px-3 py-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${filterSubject === "All" ? "text-brand-600 font-bold bg-brand-50/50 dark:bg-brand-900/20" : "text-slate-700 dark:text-slate-300"}`}
                      onClick={() => {
                        setFilterSubject("All");
                        setCurrentPage(1);
                        setSubjectDropdownOpen(false);
                        setSubjectSearch("");
                      }}
                    >
                      All Subjects
                    </div>
                    {subjects
                      .filter(
                        (s) =>
                          s.name
                            .toLowerCase()
                            .includes(subjectSearch.toLowerCase()) ||
                          (s.code || "")
                            .toLowerCase()
                            .includes(subjectSearch.toLowerCase()),
                      )
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className={`px-3 py-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${filterSubject === sub.name ? "text-brand-600 font-bold bg-brand-50/50 dark:bg-brand-900/20" : "text-slate-700 dark:text-slate-300"}`}
                          onClick={() => {
                            setFilterSubject(sub.name);
                            setCurrentPage(1);
                            setSubjectDropdownOpen(false);
                            setSubjectSearch("");
                          }}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span>{sub.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Code: {sub.code}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeCategory === "Staff" && uniqueDesignations.length > 0 && (
            <div
              ref={designationDropdownRef}
              className="relative flex-1 min-w-[140px] w-full"
            >
              <div
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 cursor-pointer h-full"
                onClick={() =>
                  setDesignationDropdownOpen(!designationDropdownOpen)
                }
              >
                <span className="text-xs text-slate-900 dark:text-white font-semibold flex-1 truncate">
                  {filterDesignation === "All"
                    ? "All Designations"
                    : filterDesignation}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
              </div>

              {designationDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                    <input
                      type="text"
                      placeholder="Search designations..."
                      value={designationSearch}
                      onChange={(e) => setDesignationSearch(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-[160px] overflow-y-auto py-1">
                    <div
                      className={`px-3 py-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${filterDesignation === "All" ? "text-brand-600 font-bold bg-brand-50/50 dark:bg-brand-900/20" : "text-slate-700 dark:text-slate-300"}`}
                      onClick={() => {
                        setFilterDesignation("All");
                        setCurrentPage(1);
                        setDesignationDropdownOpen(false);
                        setDesignationSearch("");
                      }}
                    >
                      All Designations
                    </div>
                    {uniqueDesignations
                      .filter((d) =>
                        d
                          .toLowerCase()
                          .includes(designationSearch.toLowerCase()),
                      )
                      .slice(0, 5)
                      .map((desig) => (
                        <div
                          key={desig}
                          className={`px-3 py-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${filterDesignation === desig ? "text-brand-600 font-bold bg-brand-50/50 dark:bg-brand-900/20" : "text-slate-700 dark:text-slate-300"}`}
                          onClick={() => {
                            setFilterDesignation(desig);
                            setCurrentPage(1);
                            setDesignationDropdownOpen(false);
                            setDesignationSearch("");
                          }}
                        >
                          {desig}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Directory Table Grid */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 whitespace-nowrap">Photo</th>
                <th className="py-3.5 px-4 font-mono whitespace-nowrap">
                  Employee ID
                </th>
                <th className="py-3.5 px-4 whitespace-nowrap">Employee Name</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Department</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Designation</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Email</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Mobile</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 whitespace-nowrap">
                  Profile Status
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400">
                    No {activeCategory.toLowerCase()} records match search
                    filters.
                  </td>
                </tr>
              ) : (
                paginated.map((st) => {
                  const profileStatus = getProfileStatus(st);
                  const categoryLabel = getCategoryLabel(getStaffCategory(st));
                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedStaff(st)}
                          className="shrink-0"
                          title="Open staff profile"
                        >
                          <StaffListRowAvatar st={st} />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {st.empId}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedStaff(st)}
                          className="text-left"
                          title="Open staff profile"
                        >
                          <p className="font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                            {st.firstName} {st.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {st.role === "Teacher"
                              ? "Teacher"
                              : st.role === "Staff"
                                ? "Non-Teaching Staff"
                                : st.role || "Non-Teaching Staff"}
                          </p>
                        </button>
                      </td>
                      <td className="py-3 px-4">{st.department || "N/A"}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                        {st.designation || "N/A"}
                      </td>
                      <td className="py-3 px-4">{st.email || "N/A"}</td>
                      <td className="py-3 px-4">{st.phone || "N/A"}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            st.status === "Active"
                              ? "success"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {st.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            profileStatus === "Completed"
                              ? "success"
                              : "warning"
                          }
                          size="sm"
                        >
                          {profileStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedStaff(st)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setStaffToEdit(st);
                              setIsAddOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600"
                            title="Edit Basic Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setStaffToDelete(st)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            Showing {paginated.length} of {filtered.length} employees
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <StaffFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        staffToEdit={staffToEdit}
        defaultCategory={activeCategory}
      />

      <StaffProfileDrawer
        staff={selectedStaff}
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
      />

      <ConfirmModal
        isOpen={!!staffToDelete}
        title="Delete Employee Record"
        message={`Are you sure you want to remove ${staffToDelete?.firstName} ${staffToDelete?.lastName} from registry?`}
        onConfirm={() => {
          if (staffToDelete) {
            deleteStaff(staffToDelete.id);
            addToast("success", "Employee deleted");
            setStaffToDelete(null);
          }
        }}
        onCancel={() => setStaffToDelete(null)}
      />

      <DocumentRequirementMasterModal
        isOpen={isRuleMasterOpen}
        onClose={() => setIsRuleMasterOpen(false)}
      />

      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            {/* Close Button */}
            <button
              onClick={closeBulkModal}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors border border-slate-200/60 dark:border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Bulk Upload Employees</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a single Excel file to add or update employees in one enterprise-ready flow.
              </p>
            </div>

            {/* Download Template Button */}
            <div>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
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
                  ? "border-brand-500 bg-brand-50/30 dark:bg-brand-950/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Drag and drop your Excel file here
                </p>
                <p className="text-[10px] text-slate-400">
                  Only `.xlsx` and `.xls` files are accepted.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                Choose File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Selected File Details */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                    {selectedFile ? selectedFile.name : "No file selected yet"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "Select an Excel file to continue"}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-black tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-lg">
                XLSX
              </span>
            </div>

            {/* Upload Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Upload progress</span>
                <span className="text-brand-600">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={closeBulkModal}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadExecute}
                disabled={!selectedFile || isUploading}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-white disabled:text-slate-400 text-xs font-bold shadow-lg shadow-brand-500/20 disabled:shadow-none flex items-center gap-2 transition-all disabled:cursor-not-allowed"
              >
                Upload Employees
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffList;
