import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  ShieldCheck,
  Award,
  FileText,
  AlertCircle,
  Mail,
  Bus,
  ChevronDown,
  Upload,
  X,
  FileCheck,
} from "lucide-react";
import { DriverMaster } from "../../../types";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { Badge } from "../../common/Badge";
import { ExportButton } from "../../common/ExportButton";
import { ConfirmModal } from "../../common/ConfirmModal";
import {
  fetchDriverDocumentsApi,
  createDriverDocumentApi,
  deleteDriverDocumentApi,
  DriverDocumentDto,
} from "../../../api/transport";
import {
  validatePhoneNumber,
  sanitizePhoneInput,
} from "../../../utils/validation";
import {
  validateDrivingLicense,
  sanitizeDrivingLicenseInput,
  normalizeDrivingLicense,
  DRIVING_LICENCE_ERROR_MESSAGE,
} from "../../../utils/validation";

export interface DriverDocumentItem {
  id: string;
  driverId: string;
  docType:
    | "Driving License"
    | "Others"
    | "Medical Certificate"
    | "Police Verification"
    | "Badge Certificate"
    | string;
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  badgeNumber?: string;
  attachmentName?: string;
}

export const DriverMasterView: React.FC = () => {
  const {
    staff = [],
    driverMasters = [],
    vehicleAssignments = [],
    addDriverMaster,
    updateDriverMaster,
    deleteDriverMaster,
    updateStaff,
  } = useData();
  const { addToast } = useToast();

  // Deduplicate drivers to guarantee no duplicate entries are displayed
  const uniqueDrivers = React.useMemo(() => {
    const seen = new Set<string>();
    const result: DriverMaster[] = [];
    (driverMasters || []).forEach((d) => {
      const empKey = d.employeeId?.trim().toLowerCase();
      const nameKey = d.driverName?.trim().toLowerCase();
      const phoneKey = d.mobileNumber?.trim();
      const primaryKey = empKey
        ? `emp_${empKey}`
        : nameKey && phoneKey
          ? `np_${nameKey}_${phoneKey}`
          : nameKey
            ? `n_${nameKey}`
            : d.id
              ? `id_${d.id}`
              : "";
      if (!primaryKey) return;
      if (!seen.has(primaryKey)) {
        seen.add(primaryKey);
        result.push(d);
      }
    });
    return result;
  }, [driverMasters]);

  // Filter ONLY drivers from Non-Teaching Staff
  const nonTeachingDrivers = React.useMemo(() => {
    return (staff || []).filter((s) => {
      if (s.role === "Teacher" || s.employeeCategory === "Teacher")
        return false;
      const desig = (s.designation || "").toLowerCase();
      const dept = (s.department || "").toLowerCase();
      const role = (s.role || (s as any).employeeCategory || "").toLowerCase();
      return (
        desig.includes("driver") ||
        dept.includes("driver") ||
        role.includes("driver")
      );
    });
  }, [staff]);

  const filteredNonTeachingStaff = React.useMemo(() => {
    return nonTeachingDrivers.filter(
      (s) =>
        !uniqueDrivers.some(
          (d) =>
            d.employeeId === s.empId || d.employeeId === (s as any).employeeId,
        ),
    );
  }, [nonTeachingDrivers, uniqueDrivers]);

  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  const searchedStaff = React.useMemo(() => {
    if (!staffSearchQuery.trim()) {
      return filteredNonTeachingStaff.slice(0, 5);
    }
    const q = staffSearchQuery.toLowerCase().trim();
    return filteredNonTeachingStaff.filter(
      (s) =>
        `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase().includes(q) ||
        (s.empId || "").toLowerCase().includes(q) ||
        (s.phone || (s as any).mobileNumber || "").includes(q),
    );
  }, [filteredNonTeachingStaff, staffSearchQuery]);

  const [query, setQuery] = useState("");
  const [selectedDriverFilter, setSelectedDriverFilter] = useState(
    () => sessionStorage.getItem("tm_driver_filter") || "",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverMaster | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<DriverMaster | null>(
    null,
  );

  const handleDriverFilterChange = (val: string) => {
    setSelectedDriverFilter(val);
    sessionStorage.setItem("tm_driver_filter", val);
  };

  // Driver Documents Modal State
  const [driverDocs, setDriverDocs] = useState<DriverDocumentItem[]>([]);
  const [docModalDriver, setDocModalDriver] = useState<DriverMaster | null>(
    null,
  );
  const [docForm, setDocForm] = useState<Partial<DriverDocumentItem> & { otherDocName?: string }>({
    docType: "Driving License",
    docNumber: "",
    issueDate: "",
    expiryDate: "",
    badgeNumber: "",
    attachmentName: "",
    otherDocName: "",
  });

  const [form, setForm] = useState<Partial<DriverMaster>>({
    employeeId: "",
    driverName: "",
    mobileNumber: "",
    email: "",
    licenseNumber: "",
    licenseExpiryDate: "",
    address: "",
    status: "Active",
  });

  const [formErrors, setFormErrors] = useState<{
    driverName?: string;
    employeeId?: string;
    mobileNumber?: string;
    email?: string;
    licenseNumber?: string;
  }>({});

  const filteredDrivers = uniqueDrivers.filter((d) => {
    const matchesQuery =
      d.driverName.toLowerCase().includes(query.toLowerCase()) ||
      d.mobileNumber.toLowerCase().includes(query.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(query.toLowerCase()) ||
      (d.employeeId &&
        d.employeeId.toLowerCase().includes(query.toLowerCase()));
    const matchesDriver =
      selectedDriverFilter === "ALL" || d.id === selectedDriverFilter;
    return matchesQuery && matchesDriver;
  });

  const [licenseError, setLicenseError] = useState("");

  const validateForm = (): typeof formErrors => {
    const errs: typeof formErrors = {};

    if (!form.driverName?.trim()) {
      errs.driverName = "Driver full name is required.";
    }
    if (!form.employeeId?.trim()) {
      errs.employeeId = "Employee ID is required.";
    }
    if (!form.licenseNumber?.trim()) {
      errs.licenseNumber = "Commercial license number is required.";
    }

    const phoneCheck = validatePhoneNumber(form.mobileNumber || "", true);
    if (!phoneCheck.isValid) {
      errs.mobileNumber =
        phoneCheck.error || "Enter a valid 10-digit mobile number.";
    }

    if (form.email?.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errs.email = "Please enter a valid email address.";
      }
    }

    return errs;
  };

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setLicenseError("");
    setFormErrors({});
    setForm({
      employeeId: "",
      driverName: "",
      mobileNumber: "",
      email: "",
      licenseNumber: "",
      licenseExpiryDate: "",
      address: "",
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DriverMaster) => {
    setEditingDriver(d);
    setLicenseError("");
    setFormErrors({});
    setForm(d);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      addToast(
        "error",
        "Validation Error",
        errs.mobileNumber || "Please correct the highlighted fields.",
      );
      return;
    }

    const normalizedLicense = normalizeDrivingLicense(form.licenseNumber || "");
    const licCheck = validateDrivingLicense(normalizedLicense, true);
    if (!licCheck.isValid) {
      setLicenseError(licCheck.error || DRIVING_LICENCE_ERROR_MESSAGE);
      addToast(
        "error",
        "Invalid License Number",
        licCheck.error || DRIVING_LICENCE_ERROR_MESSAGE,
      );
      return;
    }

    const payload = { ...form, licenseNumber: normalizedLicense };

    if (editingDriver) {
      updateDriverMaster(editingDriver.id, payload);

      // Direct sync to Faculty & Staff Directory
      const targetEmpId = (form.employeeId || editingDriver.employeeId || "")
        .trim()
        .toLowerCase();
      const targetName = (form.driverName || editingDriver.driverName || "")
        .trim()
        .toLowerCase();
      const matched = staff.find((s) => {
        const sEmp = (s.empId || (s as any).employeeId || "")
          .trim()
          .toLowerCase();
        if (targetEmpId && sEmp && sEmp === targetEmpId) return true;
        if (s.id && String(s.id) === String(editingDriver.id)) return true;
        const sName = `${s.firstName || ""} ${s.lastName || ""}`
          .trim()
          .toLowerCase();
        if (targetName && sName && sName === targetName) return true;
        return false;
      });

      if (matched && updateStaff) {
        const parts = (form.driverName || "").trim().split(/\s+/);
        updateStaff(matched.id, {
          phone: form.mobileNumber,
          mobileNumber: form.mobileNumber,
          email: form.email,
          presentAddress: form.address,
          address: form.address,
          ...(parts[0]
            ? { firstName: parts[0], lastName: parts.slice(1).join(" ") || "" }
            : {}),
          status: form.status === "Active" ? "Active" : "Inactive",
        } as any);
      }

      addToast(
        "success",
        "Driver Details Updated",
        `Updated ${form.driverName}`,
      );
    } else {
      addDriverMaster(payload as Omit<DriverMaster, "id">);
      addToast("success", "Driver Registered", `Added ${form.driverName}`);
    }
    setIsModalOpen(false);
  };

  // Driver Documents Management Handlers (Dynamic sync to API & database)
  const handleOpenDriverDocs = async (d: DriverMaster) => {
    setDocModalDriver(d);
    setDocForm({
      docType: "Driving License",
      docNumber: d.licenseNumber || "",
      issueDate: "",
      expiryDate: d.licenseExpiryDate || "",
      badgeNumber: "",
      attachmentName: "",
      otherDocName: "",
    });

    try {
      const apiDocs = await fetchDriverDocumentsApi(d.id);
      if (Array.isArray(apiDocs)) {
        const mapped: DriverDocumentItem[] = apiDocs.map((item: any) => ({
          id: String(item.id || item.documentId || Date.now()),
          driverId: d.id,
          docType: (item.documentCategory || "Medical Certificate") as any,
          docNumber: item.documentNumber || "",
          issueDate: item.issueDate ? item.issueDate.split("T")[0] : "",
          expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "",
          badgeNumber: item.badgeNumber || "",
          attachmentName: item.fileName || "",
        }));
        setDriverDocs((prev) => {
          const withoutDriver = prev.filter((x) => x.driverId !== d.id);
          return [...withoutDriver, ...mapped];
        });
      } else {
        setDriverDocs((prev) => prev.filter((x) => x.driverId !== d.id));
      }
    } catch (err) {
      console.error("Error fetching driver documents from API", err);
      setDriverDocs((prev) => prev.filter((x) => x.driverId !== d.id));
    }
  };

  const handleAddDriverDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docModalDriver) return;
    if (!docForm.attachmentName) {
      addToast(
        "error",
        "File Required",
        "Please choose a document file to upload.",
      );
      return;
    }

    const resolvedDocType =
      docForm.docType === "Others"
        ? ((docForm as any).otherDocName?.trim() || "Others")
        : "Driving License";

    const resolvedDocNumber =
      docForm.docType === "Driving License"
        ? (docModalDriver.licenseNumber || "DL")
        : ((docForm as any).otherDocName?.trim() || "DOC");

    const resolvedExpiry =
      docForm.docType === "Driving License"
        ? (docModalDriver.licenseExpiryDate || "")
        : "";

    const payload: DriverDocumentDto = {
      documentCategory: resolvedDocType,
      documentNumber: resolvedDocNumber,
      issueDate: new Date().toISOString().split("T")[0],
      expiryDate: resolvedExpiry,
      badgeNumber: "",
      fileName: docForm.attachmentName || "",
      fileUrl: "",
    };

    try {
      const response = await createDriverDocumentApi(
        docModalDriver.id,
        payload,
      );
      const newDoc: DriverDocumentItem = {
        id: String(response?.id || Date.now()),
        driverId: docModalDriver.id,
        docType: (response?.documentCategory ||
          payload.documentCategory) as any,
        docNumber: response?.documentNumber || payload.documentNumber,
        issueDate: response?.issueDate || payload.issueDate,
        expiryDate: response?.expiryDate || payload.expiryDate,
        badgeNumber: response?.badgeNumber || payload.badgeNumber,
        attachmentName: response?.fileName || payload.fileName,
      };

      setDriverDocs((prev) => [newDoc, ...prev]);
      addToast(
        "success",
        "Document Uploaded",
        `Uploaded ${newDoc.docType} for ${docModalDriver.driverName}`,
      );

      setDocForm({
        docType: "Driving License",
        docNumber: docModalDriver.licenseNumber || "",
        issueDate: "",
        expiryDate: docModalDriver.licenseExpiryDate || "",
        badgeNumber: "",
        attachmentName: "",
        otherDocName: "",
      });
    } catch (err) {
      console.error(err);
      addToast(
        "error",
        "Upload Failed",
        "Could not save driver document to API.",
      );
    }
  };

  const handleDeleteDriverDoc = async (docId: string) => {
    if (!docModalDriver) return;
    try {
      await deleteDriverDocumentApi(docModalDriver.id, docId);
      setDriverDocs((prev) => prev.filter((x) => x.id !== docId));
      addToast(
        "info",
        "Document Removed",
        "Verification document removed successfully",
      );
    } catch (err) {
      setDriverDocs((prev) => prev.filter((x) => x.id !== docId));
      addToast("info", "Document Removed", "Verification document removed");
    }
  };

  const checkDocExpiryStatus = (expiryDateStr?: string) => {
    if (!expiryDateStr)
      return { isExpired: false, isExpiringSoon: false, daysLeft: 999 };
    const exp = new Date(expiryDateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return {
      isExpired: diffDays < 0,
      isExpiringSoon: diffDays >= 0 && diffDays <= 30,
      daysLeft: diffDays,
    };
  };

  const resolveCurrentAssignment = (driver: DriverMaster) =>
    vehicleAssignments.find(
      (assignment) =>
        assignment.driverId === driver.id && assignment.status === "Active",
    ) ||
    vehicleAssignments.find(
      (assignment) =>
        assignment.driverName === driver.driverName &&
        assignment.status === "Active",
    );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-500" /> Drivers
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Driver
          </button>
          <ExportButton
            data={filteredDrivers}
            filename={
              selectedDriverFilter && selectedDriverFilter !== "ALL"
                ? `driver_${driverMasters.find((d) => d.id === selectedDriverFilter)?.driverName.replace(/\s+/g, "_") || "filtered"}`
                : "driver_masters"
            }
          />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by driver name, phone, or license..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDriverFilter}
            onChange={(e) => handleDriverFilterChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">-- Select Driver --</option>
            <option value="ALL">All Drivers</option>
            {uniqueDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.driverName} ({d.employeeId || d.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedDriverFilter === "" ? (
        <div className="glass-card p-10 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Please Select a Driver
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a driver from the dropdown above or click below to view all
            drivers.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleDriverFilterChange("ALL")}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              View All Drivers
            </button>
          </div>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <p className="text-slate-400 text-xs font-bold">
            No drivers found matching your filter or search query.
          </p>
          <button
            onClick={() => {
              handleDriverFilterChange("ALL");
              setQuery("");
            }}
            className="text-xs text-sky-600 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Driver Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((d) => {
            const currentAssignment = resolveCurrentAssignment(d);
            const dDocs = driverDocs.filter((doc) => doc.driverId === d.id);
            const licStatus = checkDocExpiryStatus(d.licenseExpiryDate);

            return (
              <div
                key={d.id}
                className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {d.driverName}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-sky-500" />{" "}
                        {d.licenseNumber}
                      </p>
                    </div>
                    <Badge
                      variant={
                        d.status === "Active"
                          ? "success"
                          : d.status === "On Leave"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {d.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Employee ID:</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {d.employeeId || d.id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400 flex-shrink-0">
                        Mobile Number:
                      </span>
                      <span
                        className="font-bold text-slate-900 dark:text-white flex items-center gap-1 font-mono truncate max-w-[13rem]"
                        title={d.mobileNumber}
                      >
                        <Phone className="w-3 h-3 text-sky-500 flex-shrink-0" />
                        <span className="truncate">{d.mobileNumber}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-sky-500" />{" "}
                        {d.email || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Address:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[12rem]">
                        {d.address || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">License Expiry:</span>
                      <span
                        className={`font-semibold ${licStatus.isExpiringSoon ? "text-amber-600 font-bold" : ""}`}
                      >
                        {d.licenseExpiryDate}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                        <Bus className="w-3 h-3 text-emerald-500" /> Current
                        Assignment
                      </span>
                      {currentAssignment ? (
                        <>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">Bus:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {currentAssignment.vehicleNumber}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">Route:</span>
                            <span className="font-semibold text-sky-600 text-right">
                              {currentAssignment.routeName}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">Status:</span>
                            <span className="font-bold text-emerald-600">
                              {currentAssignment.status}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          No active assignment
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenDriverDocs(d)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" /> Driver Documents (
                    {dDocs.length})
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingDriver(d)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingDriver ? "Edit Driver Profile" : "Register New Driver"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {!editingDriver && (
                <div className="relative">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Select Driver from Non-Teaching Staff</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {filteredNonTeachingStaff.length} driver(s) available
                    </span>
                  </label>

                  {/* Dropdown Trigger Box */}
                  <div
                    onClick={() => setIsStaffDropdownOpen((prev) => !prev)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer hover:border-sky-500 transition-colors"
                  >
                    {form.employeeId ? (
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {form.driverName} ({form.employeeId})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm((prev) => ({
                              ...prev,
                              employeeId: "",
                              driverName: "",
                              mobileNumber: "",
                              email: "",
                              address: "",
                            }));
                            setStaffSearchQuery("");
                          }}
                          className="text-slate-400 hover:text-rose-500 p-0.5 rounded text-xs"
                          title="Clear selection"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">
                        -- Choose Driver from Non-Teaching Staff --
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isStaffDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* Dropdown Menu Popover */}
                  {isStaffDropdownOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 space-y-2 animate-in fade-in">
                      {/* Search Bar inside Dropdown */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search by driver name, Emp ID, or phone..."
                          value={staffSearchQuery}
                          onChange={(e) => setStaffSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Filtered Driver List */}
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {searchedStaff.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            {filteredNonTeachingStaff.length === 0
                              ? "No unassigned drivers found in Non-Teaching Staff."
                              : "No drivers match your search."}
                          </div>
                        ) : (
                          searchedStaff.map((s) => {
                            const isSelected = form.employeeId === s.empId;
                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  const rawPhone =
                                    s.phone || (s as any).mobileNumber || "";
                                  const sanitizedPhone =
                                    sanitizePhoneInput(rawPhone);
                                  setForm((prev) => ({
                                    ...prev,
                                    employeeId: s.empId || prev.employeeId,
                                    driverName:
                                      `${s.firstName} ${s.lastName || ""}`.trim(),
                                    mobileNumber:
                                      sanitizedPhone || prev.mobileNumber,
                                    email: s.email || prev.email,
                                    address:
                                      s.address ||
                                      (s as any).presentAddress ||
                                      prev.address,
                                  }));
                                  setFormErrors({});
                                  setIsStaffDropdownOpen(false);
                                  setStaffSearchQuery("");
                                }}
                                className={`p-2 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {s.firstName} {s.lastName || ""}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {s.empId} • {s.designation || "Driver"} •{" "}
                                    {s.phone ||
                                      (s as any).mobileNumber ||
                                      "No phone"}
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="text-[10px] bg-sky-600 text-white font-bold px-1.5 py-0.5 rounded">
                                    Selected
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer Info showing initial 5 / total count */}
                      {!staffSearchQuery &&
                        filteredNonTeachingStaff.length > 5 && (
                          <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
                            Showing top 5 of {filteredNonTeachingStaff.length}{" "}
                            drivers. Use search to find others.
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Driver Full Name{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={form.driverName || ""}
                    onChange={(e) => {
                      setForm({ ...form, driverName: e.target.value });
                      if (formErrors.driverName)
                        setFormErrors((prev) => ({
                          ...prev,
                          driverName: undefined,
                        }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none ${
                      formErrors.driverName
                        ? "border-rose-500 focus:border-rose-500 bg-rose-50/20"
                        : ""
                    }`}
                  />
                  {formErrors.driverName && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{formErrors.driverName}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Employee ID{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-DRV-101"
                    value={form.employeeId || ""}
                    onChange={(e) => {
                      setForm({ ...form, employeeId: e.target.value });
                      if (formErrors.employeeId)
                        setFormErrors((prev) => ({
                          ...prev,
                          employeeId: undefined,
                        }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none ${
                      formErrors.employeeId
                        ? "border-rose-500 focus:border-rose-500 bg-rose-50/20"
                        : ""
                    }`}
                  />
                  {formErrors.employeeId && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{formErrors.employeeId}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Mobile Number{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    placeholder="10-digit mobile number"
                    value={form.mobileNumber || ""}
                    onChange={(e) => {
                      const sanitized = sanitizePhoneInput(e.target.value);
                      setForm({ ...form, mobileNumber: sanitized });
                      if (formErrors.mobileNumber) {
                        setFormErrors((prev) => ({
                          ...prev,
                          mobileNumber: undefined,
                        }));
                      }
                    }}
                    onBlur={() => {
                      if (form.mobileNumber) {
                        const check = validatePhoneNumber(
                          form.mobileNumber,
                          true,
                        );
                        if (!check.isValid) {
                          setFormErrors((prev) => ({
                            ...prev,
                            mobileNumber: check.error,
                          }));
                        }
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none ${
                      formErrors.mobileNumber
                        ? "border-rose-500 focus:border-rose-500 bg-rose-50/20"
                        : ""
                    }`}
                  />
                  {formErrors.mobileNumber && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{formErrors.mobileNumber}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. driver@school.edu"
                    value={form.email || ""}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (formErrors.email)
                        setFormErrors((prev) => ({
                          ...prev,
                          email: undefined,
                        }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                      formErrors.email
                        ? "border-rose-500 focus:border-rose-500 bg-rose-50/20"
                        : ""
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{formErrors.email}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Commercial License No{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    data-skip-global-validation="true"
                    required
                    placeholder="e.g. MH-12-20200012345"
                    maxLength={22}
                    value={form.licenseNumber}
                    onChange={(e) => {
                      const sanitized = sanitizeDrivingLicenseInput(
                        e.target.value,
                      );
                      setForm({ ...form, licenseNumber: sanitized });
                      if (
                        licenseError &&
                        validateDrivingLicense(sanitized, true).isValid
                      ) {
                        setLicenseError("");
                      }
                    }}
                    onBlur={() => {
                      const normalized = normalizeDrivingLicense(
                        form.licenseNumber || "",
                      );
                      setForm((prev) => ({
                        ...prev,
                        licenseNumber: normalized,
                      }));
                      const res = validateDrivingLicense(normalized, true);
                      setLicenseError(
                        res.isValid
                          ? ""
                          : res.error || DRIVING_LICENCE_ERROR_MESSAGE,
                      );
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white ${licenseError ? "!border-rose-500" : ""}`}
                  />
                  {licenseError && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 leading-tight">
                      {licenseError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    max={`${new Date().getFullYear() + 20}-12-31`}
                    value={form.licenseExpiryDate?.split("T")[0] || ""}
                    onChange={(e) =>
                      setForm({ ...form, licenseExpiryDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER DOCUMENTS MODAL */}
      {docModalDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-500" /> Driver
                  Verification Documents: {docModalDriver.driverName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Employee ID:{" "}
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                    {docModalDriver.employeeId || "N/A"}
                  </span>{" "}
                  • Commercial License, Medical Certificate & Compliance Records
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDocModalDriver(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload New Document Form */}
            <form
              onSubmit={handleAddDriverDoc}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-sky-500" /> Upload Driver
                  Verification Document
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">
                  * Required fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                {/* 1. Document Category Dropdown */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Document Category{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={docForm.docType || "Driving License"}
                    onChange={(e) =>
                      setDocForm({ ...docForm, docType: e.target.value as any })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 text-xs outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Driving License">Driving License</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* 2. Upload Document */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Upload Document{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-sky-500" />
                      Choose File
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDocForm((prev) => ({
                              ...prev,
                              attachmentName: file.name,
                            }));
                          }
                        }}
                      />
                    </label>
                    <span
                      className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]"
                      title={docForm.attachmentName || undefined}
                    >
                      {docForm.attachmentName || "No file chosen"}
                    </span>
                    {docForm.attachmentName && (
                      <button
                        type="button"
                        onClick={() =>
                          setDocForm((prev) => ({
                            ...prev,
                            attachmentName: "",
                          }))
                        }
                        className="text-slate-400 hover:text-rose-500 p-1 text-xs shrink-0 cursor-pointer"
                        title="Remove file"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* If Others is selected, optionally allow custom document name */}
              {docForm.docType === "Others" && (
                <div className="pt-1">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Document Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Medical Certificate, Police Verification, ID Proof"
                    value={(docForm as any).otherDocName || ""}
                    onChange={(e) =>
                      setDocForm(
                        (prev) =>
                          ({
                            ...prev,
                            otherDocName: e.target.value,
                          }) as any,
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 text-xs outline-none focus:border-sky-500"
                  />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Document
                </button>
              </div>
            </form>

            {/* List of Documents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Verified Driver Documents (
                  {
                    driverDocs.filter((d) => d.driverId === docModalDriver.id)
                      .length
                  }
                  )
                </h4>
              </div>

              {driverDocs.filter((d) => d.driverId === docModalDriver.id)
                .length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No document available
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Use the form above to add driver medical certificates,
                    licenses, or verification records.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {driverDocs
                    .filter((d) => d.driverId === docModalDriver.id)
                    .map((doc) => {
                      const status = checkDocExpiryStatus(doc.expiryDate);
                      return (
                        <div
                          key={doc.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                          {/* 1. Category & Document Details */}
                          <div className="flex items-center gap-3 min-w-[200px] flex-1">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                                  {doc.docType}
                                </span>
                                {doc.docNumber && (
                                  <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                    {doc.docNumber}
                                  </span>
                                )}
                              </div>
                              {(doc.issueDate || doc.expiryDate) && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {doc.issueDate && (
                                    <>
                                      Issue:{" "}
                                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                                        {doc.issueDate}
                                      </span>
                                    </>
                                  )}
                                  {doc.issueDate && doc.expiryDate && <> • </>}
                                  {doc.expiryDate && (
                                    <>
                                      Expiry:{" "}
                                      <strong
                                        className={
                                          status.isExpiringSoon || status.isExpired
                                            ? "text-rose-600 dark:text-rose-400 font-bold"
                                            : "text-slate-700 dark:text-slate-300 font-medium"
                                        }
                                      >
                                        {doc.expiryDate}
                                      </strong>
                                    </>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 2. Badge Details */}
                          <div className="w-28 shrink-0 flex flex-col items-start justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Badge No
                            </span>
                            {doc.badgeNumber ? (
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/60 px-2 py-0.5 rounded-md mt-0.5">
                                <Award className="w-3 h-3 text-sky-500 shrink-0" />
                                {doc.badgeNumber}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic mt-0.5">
                                None
                              </span>
                            )}
                          </div>

                          {/* 3. Attachment Link */}
                          <div className="w-48 shrink-0 flex flex-col items-start justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Attachment
                            </span>
                            {doc.attachmentName ? (
                              <span
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:underline truncate max-w-full mt-0.5"
                                title={doc.attachmentName}
                              >
                                <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                <span className="truncate">
                                  {doc.attachmentName}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic mt-0.5">
                                No file attached
                              </span>
                            )}
                          </div>

                          {/* 4. Verification Status */}
                          <div className="w-24 shrink-0 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                              Status
                            </span>
                            {status.isExpired ? (
                              <Badge variant="danger" size="sm">
                                Expired
                              </Badge>
                            ) : status.isExpiringSoon ? (
                              <Badge variant="warning" size="sm">
                                Expiring Soon
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                Verified
                              </Badge>
                            )}
                          </div>

                          {/* 5. Action Icon */}
                          <div className="w-10 shrink-0 flex items-center justify-end md:justify-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteDriverDoc(doc.id)}
                              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDocModalDriver(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingDriver}
        onCancel={() => setDeletingDriver(null)}
        onConfirm={() => {
          if (deletingDriver) {
            deleteDriverMaster(deletingDriver.id);
            addToast("info", "Driver Deleted");
            setDeletingDriver(null);
          }
        }}
        title="Delete Driver Profile"
        message={`Are you sure you want to delete ${deletingDriver?.driverName}?`}
      />
    </div>
  );
};
