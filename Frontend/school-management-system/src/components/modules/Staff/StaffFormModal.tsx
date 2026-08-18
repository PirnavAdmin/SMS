import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Users, Edit3 } from "lucide-react";
import { Staff } from "../../../types";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { Badge } from "../../common/Badge";
import {
  BasicStaffFormState,
  buildBasicStaffCreatePayload,
  buildBasicStaffUpdatePayload,
  defaultBasicStaffFormState,
  getNextEmployeeId,
  getDepartmentOptions,
  getDesignationOptions,
  normalizeStaffType,
} from "./staffFlowOptions";
import { BasicStaffFormFields } from "./BasicStaffFormFields";

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: Staff | null;
  defaultCategory?: string;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  staffToEdit,
  defaultCategory = "Teaching Staff",
}) => {
  const { staff, addStaff, updateStaff, departments, designations } = useData();
  const { addToast } = useToast();

  const [form, setForm] = useState<BasicStaffFormState>(() =>
    defaultBasicStaffFormState(defaultCategory),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (staffToEdit) {
      const normalizedCat = normalizeStaffType(staffToEdit.employeeCategory);
      setForm({
        ...defaultBasicStaffFormState(normalizedCat),
        employeeCategory: normalizedCat,
        empId: staffToEdit.empId || "",
        firstName:
          staffToEdit.firstName ||
          (staffToEdit.name ? staffToEdit.name.split(" ")[0] : "") ||
          "",
        middleName: "",
        lastName:
          staffToEdit.lastName ||
          (staffToEdit.name
            ? staffToEdit.name.split(" ").slice(1).join(" ")
            : "") ||
          "",
        gender: (staffToEdit.gender as any) || "",
        dob: staffToEdit.dob || "",
        bloodGroup: staffToEdit.bloodGroup || "",
        mobileNumber: staffToEdit.phone || "",
        alternateMobileNumber: "",
        email: staffToEdit.email || "",
        photoUrl: staffToEdit.avatar || "",
        aadhaarNumber: "",
        panNumber: "",
        presentAddress: staffToEdit.address || "",
        permanentAddress: staffToEdit.address || "",
        sameAsPresentAddress: true,
        city: "",
        state: "",
        pinCode: "",
        branch: staffToEdit.branch || "Main Campus",
        department: staffToEdit.department || "",
        designation: staffToEdit.designation || "",
        joiningDate:
          staffToEdit.joiningDate || new Date().toISOString().split("T")[0],
        employmentType: staffToEdit.employmentType || "",
        reportingManager: "",
        status: staffToEdit.status || "",
        academicYear: "2026-2027",
        assignedClasses: staffToEdit.assignedClasses || [],
        assignedSections: [],
        assignedSubjects: staffToEdit.assignedSubjects || [],
        isClassTeacher: staffToEdit.isClassTeacherEligible ? "Yes" : "No",
        qualifications: (staffToEdit.qualifications || []).map((q: any) => ({
          id: q.id || `QUAL-${Date.now()}-${Math.random()}`,
          qualification: q.qualification || q.highestQualification || "",
          specialization: q.specialization || "",
          institution: q.institution || q.university || "",
          boardUniversity: q.boardUniversity || q.university || "",
          passingYear: q.passingYear || q.year || "",
          percentageCgpa: q.percentageCgpa || q.percentage || ""
        })),
        experiences: (staffToEdit.experienceRecords || []).map((e: any) => ({
          id: e.id || `EXP-${Date.now()}-${Math.random()}`,
          previousOrganization: e.previousOrganization || e.organization || e.previousSchool || "",
          designation: e.designation || "",
          fromDate: e.fromDate || e.joiningDate || "",
          toDate: e.toDate || e.relievingDate || "",
          totalExperience: e.totalExperience || "0 Years 0 Months",
          reasonForLeaving: e.reasonForLeaving || ""
        })),
        documents: (staffToEdit.documents || []).map((d: any) => ({
          id: d.id || `DOC-${Date.now()}-${Math.random()}`,
          docType: d.type || "",
          fileName: d.title || d.name || "",
          fileUrl: d.fileUrl || "",
          uploadedAt: d.uploadedDate || d.uploadDate || ""
        })),
      });
    } else {
      setForm({
        ...defaultBasicStaffFormState(defaultCategory),
        empId: getNextEmployeeId(staff),
      });
    }

    setErrors({});
  }, [isOpen, staffToEdit, defaultCategory, staff]);

  const handleChange = (field: keyof BasicStaffFormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCategoryChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      employeeCategory: value,
      department: "",
      designation: "",
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const require = (key: string, condition: boolean, message: string) => {
      if (!condition) nextErrors[key] = message;
    };

    require("employeeCategory", !!form.employeeCategory, "Staff Type is required.");
    require("firstName", !!form.firstName.trim(), "First name is required.");
    require("lastName", !!form.lastName.trim(), "Last name is required.");
    require("mobileNumber", !!form.mobileNumber.trim(), "Mobile number is required.");
    require("branch", !!form.branch.trim(), "Branch is required.");
    require("department", !!form.department.trim(), "Department is required.");
    require("designation", !!form.designation.trim(), "Designation is required.");
    require("joiningDate", !!form.joiningDate.trim(), "Joining date is required.");
    require("employmentType", !!form.employmentType.trim(), "Employment type is required.");
    require("status", !!form.status.trim(), "Status is required.");

    // Email format check
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Invalid email format.";
    }

    // Duplicate Staff ID Check
    if (
      form.empId &&
      staff.some(
        (s) =>
          s.empId.toLowerCase() === form.empId.toLowerCase() &&
          s.id !== staffToEdit?.id,
      )
    ) {
      nextErrors.empId = "Staff ID already exists.";
    }

    // Duplicate Email Check
    if (
      form.email.trim() &&
      staff.some(
        (s) =>
          s.email &&
          s.email.toLowerCase() === form.email.trim().toLowerCase() &&
          s.id !== staffToEdit?.id,
      )
    ) {
      nextErrors.email = "Email address is already registered.";
    }

    // Duplicate Mobile Check
    const cleanMobile = form.mobileNumber.replace(/\D/g, "");
    if (
      cleanMobile &&
      staff.some(
        (s) =>
          s.phone &&
          s.phone.replace(/\D/g, "") === cleanMobile &&
          s.id !== staffToEdit?.id,
      )
    ) {
      nextErrors.mobileNumber = "Mobile number is already registered.";
    }

    // Validate department & designation against staff type & department
    const allowedDepts = getDepartmentOptions(
      form.employeeCategory,
      departments,
    );
    const allowedDesignations = getDesignationOptions(
      form.employeeCategory,
      form.department,
      designations,
    );

    if (form.department && !allowedDepts.includes(form.department)) {
      nextErrors.department = `"${form.department}" is not a valid department for ${form.employeeCategory}.`;
    }

    if (form.designation && !allowedDesignations.includes(form.designation)) {
      nextErrors.designation = `"${form.designation}" is not a valid designation for ${form.department || form.employeeCategory}.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      addToast(
        "warning",
        "Please complete required fields",
        "Check missing or invalid entries.",
      );
      return;
    }

    setSubmitting(true);

    const isTeaching = normalizeStaffType(form.employeeCategory) === 'Teaching Staff';
    let duplicateConflict: any = null;
    if (isTeaching && form.designation && form.assignedSubjects && form.assignedSubjects.length > 0) {
      duplicateConflict = staff.find(s => {
        if (staffToEdit && s.id === staffToEdit.id) return false;
        const category = s.employeeCategory || s.role || '';
        const isTeachingStaff = category === 'Teacher' || category === 'Teaching Staff';
        if (!isTeachingStaff) return false;
        if (s.designation?.trim().toLowerCase() !== form.designation.trim().toLowerCase()) return false;
        
        const otherSubjects = s.assignedSubjects || [];
        return form.assignedSubjects.some(subj => 
          otherSubjects.some(os => os.trim().toLowerCase() === subj.trim().toLowerCase())
        );
      });
    }

    if (staffToEdit) {
      updateStaff(staffToEdit.id, buildBasicStaffUpdatePayload(form));
      addToast(
        "success",
        "Employee updated",
        "Staff details were saved successfully.",
      );
    } else {
      const added = addStaff(buildBasicStaffCreatePayload(form));
      addToast(
        "success",
        "Employee created",
        `${added.firstName} ${added.lastName} has been added to the directory.`,
      );
    }

    if (duplicateConflict) {
      addToast(
        "warning",
        "Workload Conflict Detected",
        `${duplicateConflict.name || `${duplicateConflict.firstName} ${duplicateConflict.lastName}`} also teaches this subject as a ${duplicateConflict.designation}.`
      );
    }

    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl max-h-[94vh] overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col my-auto">
        <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" size="sm">
                  Staff ERP
                </Badge>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                  {staffToEdit ? "Edit Record" : "5-Section Add Staff Wizard"}
                </span>
              </div>
              <h2 className="mt-1 text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {staffToEdit ? "Edit Staff Details" : "Add New Staff"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 transition"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          <BasicStaffFormFields
            value={form}
            errors={errors}
            onChange={handleChange}
            onCategoryChange={handleCategoryChange}
            employeeIdReadOnly
            compact
            isSubmitting={submitting}
            onCancel={onClose}
            staffToEdit={staffToEdit}
          />
        </form>
      </div>
    </div>
  );
};
