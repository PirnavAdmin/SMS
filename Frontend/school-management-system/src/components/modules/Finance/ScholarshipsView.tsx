// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "../../../utils/currency";
import {
  Gift,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  UserPlus,
  X,
  Filter,
  GraduationCap,
  Award,
} from "lucide-react";
import {
  Scholarship,
  ScholarshipType,
  StudentScholarship,
} from "../../../types";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { Badge } from "../../common/Badge";
import { ExportButton } from "../../common/ExportButton";
import { ConfirmModal } from "../../common/ConfirmModal";
import { ValidatedSearchInput } from "../../common/ValidatedSearchInput";
import { Pagination } from "../../common/Pagination";
import { compareClassesAscending } from "../../../utils/classSorter";

const SCHOLARSHIP_TYPES: ScholarshipType[] = [
  "Merit",
  "Government",
  "Minority",
  "Sports",
  "Staff Child",
  "Management",
  "Financial Aid",
];

export const ScholarshipsView: React.FC = () => {
  const {
    scholarships,
    studentScholarships,
    feeHeads,
    students,
    addScholarship,
    updateScholarship,
    deleteScholarship,
    assignScholarshipToStudent,
    revokeStudentScholarship,
    academicClasses,
    fetchAcademicClasses,
    fetchFinanceData,
    fetchStudents,
  } = useData();
  const { addToast } = useToast();

  useEffect(() => {
    if ((!academicClasses || academicClasses.length === 0) && fetchAcademicClasses) {
      fetchAcademicClasses().catch(() => {});
    }
    if (fetchFinanceData) {
      fetchFinanceData().catch(() => {});
    }
    if ((!students || students.length === 0) && fetchStudents) {
      fetchStudents().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeTab, setActiveTab] = useState<"master" | "allocated">("master");
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [allocatedClassFilter, setAllocatedClassFilter] =
    useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSch, setEditingSch] = useState<Scholarship | null>(null);
  const [deletingSch, setDeletingSch] = useState<Scholarship | null>(null);

  // Allocation Modal with Class Filter & Search
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocClassFilter, setAllocClassFilter] = useState<string>("All");
  const [allocSearchQuery, setAllocSearchQuery] = useState<string>("");
  const [allocStudentId, setAllocStudentId] = useState("");
  const [allocScholarshipId, setAllocScholarshipId] = useState(
    scholarships[0]?.id || "",
  );

  const sortedClasses = useMemo(() => {
    return [...academicClasses].sort((a, b) =>
      compareClassesAscending(a.name, b.name),
    );
  }, [academicClasses]);

  // Filtered Students for the Award Modal
  const filteredStudentsForAward = useMemo(() => {
    return students.filter((st) => {
      const matchesClass =
        allocClassFilter === "All" || st.className === allocClassFilter;
      const q = allocSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        `${st.firstName} ${st.lastName}`.toLowerCase().includes(q) ||
        (st.admissionNo && st.admissionNo.toLowerCase().includes(q)) ||
        (st.rollNumber && st.rollNumber.toLowerCase().includes(q));
      return matchesClass && matchesSearch;
    });
  }, [students, allocClassFilter, allocSearchQuery]);

  const selectedStudentDetails = useMemo(() => {
    return students.find((s) => s.id === allocStudentId);
  }, [students, allocStudentId]);

  const selectedScholarshipDetails = useMemo(() => {
    return scholarships.find((s) => s.id === allocScholarshipId);
  }, [scholarships, allocScholarshipId]);

  const [formData, setFormData] = useState<Partial<Scholarship>>({
    name: "",
    code: "",
    type: "Merit",
    discountType: "Percentage",
    percentage: 15,
    fixedAmount: 0,
    applicableFeeHeadIds: [],
    applicableClasses: ["Class 9", "Class 10", "Class 11", "Class 12"],
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    eligibility: "GPA >= 3.8",
    description: "Academic excellence grant",
    status: "Active",
  });

  const filteredScholarships = scholarships.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase());
    const matchesType = selectedType === "All" || s.type === selectedType;
    return matchesQuery && matchesType;
  });

  const filteredAwardedList = studentScholarships.filter((ss) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      ss.studentName.toLowerCase().includes(q) ||
      ss.scholarshipName.toLowerCase().includes(q);
    const matchesClass =
      allocatedClassFilter === "All" ||
      (ss as any).className === allocatedClassFilter;
    return matchesQuery && matchesClass;
  });

  const totalPages = Math.ceil(filteredAwardedList.length / pageSize) || 1;
  const paginatedAwardedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAwardedList.slice(start, start + pageSize);
  }, [filteredAwardedList, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingSch(null);
    setFormData({
      name: "",
      code: "SCH-" + Math.floor(100 + Math.random() * 900),
      type: "Merit",
      discountType: "Percentage",
      percentage: 15,
      fixedAmount: 0,
      applicableFeeHeadIds: feeHeads.slice(0, 1).map((h) => h.id),
      applicableClasses: academicClasses.map((c) => c.name),
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      eligibility: "Merit criteria",
      description: "Educational Grant",
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Scholarship) => {
    setEditingSch(s);
    setFormData(s);
    setIsModalOpen(true);
  };

  const handleOpenAlloc = () => {
    setAllocClassFilter("All");
    setAllocSearchQuery("");
    setAllocStudentId("");
    if (scholarships.length > 0) {
      setAllocScholarshipId(scholarships[0].id);
    }
    setIsAllocModalOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast(
        "warning",
        "Validation Error",
        "Scholarship name and code are required.",
      );
      return;
    }

    if (editingSch) {
      await updateScholarship(editingSch.id, formData);
      addToast("success", "Scholarship Updated", `Updated ${formData.name}`);
    } else {
      await addScholarship(formData as Omit<Scholarship, "id">);
      addToast("success", "Scholarship Created", `Created ${formData.name}`);
    }
    setIsModalOpen(false);
  };

  const handleAllocSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!allocStudentId || !allocScholarshipId) {
      addToast(
        "warning",
        "Selection Required",
        "Select both student and scholarship.",
      );
      return;
    }
    await assignScholarshipToStudent(allocStudentId, allocScholarshipId);
    addToast(
      "success",
      "Scholarship Awarded",
      "Awarded scholarship to student successfully.",
    );
    setIsAllocModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-[var(--primary-color)]" /> Scholarships
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[var(--primary-color)] hover:opacity-90 text-white text-xs font-bold shadow-md shadow-[var(--primary-color)]/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Scholarship
          </button>
          <ExportButton data={activeTab === 'master' ? filteredScholarships : filteredAwardedList} filename="scholarships" />
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="relative z-20 glass-card p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-[var(--primary-color)]/30 dark:border-[var(--primary-color)]/40 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab("master");
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "master"
                ? "bg-[var(--primary-color)] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Scholarship Master Schemes ({scholarships.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("allocated");
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "allocated"
                ? "bg-[var(--primary-color)] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Student Awarded Scholarships ({studentScholarships.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {activeTab === "allocated" && (
            <select
              value={allocatedClassFilter}
              onChange={(e) => {
                setAllocatedClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none font-medium"
            >
              <option value="All">All Class Grades</option>
              {sortedClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <div className="w-full sm:w-72">
            <ValidatedSearchInput
              placeholder={
                activeTab === "master"
                  ? "Search scholarship name..."
                  : "Search student or scholarship..."
              }
              value={query}
              onChange={(val) => {
                setQuery(val);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Master Schemes */}
      {activeTab === "master" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredScholarships.map((s) => (
            <div
              key={s.id}
              className="glass-card p-3.5 sm:p-4 rounded-2xl space-y-3 border border-[var(--primary-color)]/35 dark:border-[var(--primary-color)]/45 hover:border-[var(--primary-color)] shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                    {s.type} Type • Code: {s.code}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                    {s.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--primary-color)]"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingSch(s)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Benefit Value:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {s.discountType === "Percentage"
                      ? `${s.percentage}% Fee Waiver`
                      : `${formatCurrency(s.fixedAmount || 0)} Grant`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Validity Period:</span>
                  <span>
                    {s.startDate} to {s.endDate}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 italic">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Awarded List */}
      {activeTab === "allocated" && (
        <div className="glass-card rounded-2xl overflow-hidden border border-[var(--primary-color)]/30 dark:border-[var(--primary-color)]/40 shadow-sm bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-3 text-center align-middle">STUDENT NAME</th>
                  <th className="py-3 px-3 text-center align-middle">SCHOLARSHIP AWARDED</th>
                  <th className="py-3 px-3 text-center align-middle">DISCOUNT APPLIED</th>
                  <th className="py-3 px-3 text-center align-middle">DATE AWARDED</th>
                  <th className="py-3 px-3 text-center align-middle">REVOKE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {paginatedAwardedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No student scholarships found. Click "+ Award Student
                      Scholarship" to award a grant.
                    </td>
                  </tr>
                ) : (
                  paginatedAwardedList.map((ss) => (
                    <tr
                      key={ss.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3 px-3 text-center align-middle font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center justify-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-[var(--primary-color)]" />
                          <span>{ss.studentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center align-middle font-semibold text-[var(--primary-color)]">
                        {ss.scholarshipName}
                      </td>
                      <td className="py-3 px-3 text-center align-middle font-bold text-emerald-600 dark:text-emerald-400">
                        {ss.discountType === "Percentage"
                          ? `${ss.discountValue}% Waiver`
                          : `${formatCurrency(ss.discountValue)} Off`}
                      </td>
                      <td className="py-3 px-3 text-center align-middle text-slate-500">
                        {ss.appliedDate}
                      </td>
                      <td className="py-3 px-3 text-center align-middle">
                        <button
                          onClick={async () => {
                            await revokeStudentScholarship(ss.id);
                            addToast(
                              "info",
                              "Scholarship Revoked",
                              `Revoked scholarship for ${ss.studentName}`,
                            );
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Revoke Scholarship"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredAwardedList.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredAwardedList.length}
                pageSize={pageSize}
              />
            </div>
          )}
        </div>
      )}

      {/* Create Scholarship Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSch
                  ? "Edit Scholarship Scheme"
                  : "Add Scholarship Master"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Scholarship Name{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Scholarship Code{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Scheme Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none font-medium"
                  >
                    {SCHOLARSHIP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Discount Mode
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none font-medium"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              {formData.discountType === "Percentage" ? (
                <div>
                  <label className="block font-semibold mb-1">
                    Percentage Waiver (%)
                  </label>
                  <input
                    type="number"
                    value={formData.percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        percentage: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold mb-1">
                    Fixed Grant Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.fixedAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fixedAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600 outline-none"
                  />
                </div>
              )}

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
                  className="px-4 py-2 font-bold bg-[var(--primary-color)] hover:opacity-90 text-white rounded-xl shadow-md shadow-[var(--primary-color)]/20 transition-all cursor-pointer"
                >
                  Save Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Student Scholarship Modal - WITH CLASS FILTER & SEARCH */}
      {isAllocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Award Student Scholarship
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Filter students by class grade or search by name & admission
                    no
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAllocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAllocSubmit} className="space-y-4 text-xs">
              {/* Filter Controls: Class Dropdown + Search Student */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-[var(--primary-color)]/30 dark:border-[var(--primary-color)]/40">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-[var(--primary-color)]" /> Filter Class
                  </label>
                  <select
                    value={allocClassFilter}
                    onChange={(e) => {
                      setAllocClassFilter(e.target.value);
                      setAllocStudentId("");
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="All">All Classes ({students.length})</option>
                    {sortedClasses.map((c) => {
                      const count = students.filter(
                        (s) => s.className === c.name,
                      ).length;
                      return (
                        <option key={c.id} value={c.name}>
                          {c.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Search className="w-3 h-3 text-[var(--primary-color)]" /> Search Student
                  </label>
                  <input
                    type="text"
                    placeholder="Search name or adm no..."
                    value={allocSearchQuery}
                    onChange={(e) => {
                      setAllocSearchQuery(e.target.value);
                      setAllocStudentId("");
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Select Student Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    Select Student{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-[var(--primary-color)]">
                    {filteredStudentsForAward.length} student
                    {filteredStudentsForAward.length !== 1 ? "s" : ""} available
                  </span>
                </div>
                <select
                  value={allocStudentId}
                  onChange={(e) => setAllocStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none"
                  required
                >
                  <option value="">
                    -- Choose Student ({filteredStudentsForAward.length}{" "}
                    matching) --
                  </option>
                  {filteredStudentsForAward.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.className}
                      {st.section ? `-${st.section}` : ""} • Adm:{" "}
                      {st.admissionNo || st.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Student Details Card */}
              {selectedStudentDetails && (
                <div className="p-3 rounded-xl bg-[var(--primary-color)]/10 border border-[var(--primary-color)]/30 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {selectedStudentDetails.firstName}{" "}
                      {selectedStudentDetails.lastName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Class:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedStudentDetails.className}-
                        {selectedStudentDetails.section}
                      </span>{" "}
                      • Adm No:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedStudentDetails.admissionNo}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
                    Eligible
                  </span>
                </div>
              )}

              {/* Select Scholarship Scheme */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Select Scholarship Scheme{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  value={allocScholarshipId}
                  onChange={(e) => setAllocScholarshipId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none"
                  required
                >
                  {scholarships.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (
                      {s.discountType === "Percentage"
                        ? `${s.percentage}% Fee Waiver`
                        : `${formatCurrency(s.fixedAmount || 0)} Grant`}{" "}
                      • {s.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheme Value Preview */}
              {selectedScholarshipDetails && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Applied Concession
                    </span>
                    <div className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                      {selectedScholarshipDetails.discountType === "Percentage"
                        ? `${selectedScholarshipDetails.percentage}% Fee Waiver`
                        : `${formatCurrency(selectedScholarshipDetails.fixedAmount || 0)} Off Base Fee`}
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {selectedScholarshipDetails.type}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAllocModalOpen(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Award Scholarship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingSch}
        title="Delete Scheme"
        message={`Are you sure you want to delete ${deletingSch?.name}?`}
        onConfirm={async () => {
          if (deletingSch) {
            await deleteScholarship(deletingSch.id);
            addToast("success", "Scholarship Scheme Deleted");
            setDeletingSch(null);
          }
        }}
        onCancel={() => setDeletingSch(null)}
      />
    </div>
  );
};
