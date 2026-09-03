import React, { useState, useMemo } from "react";
import { formatCurrency } from "../../../utils/currency";
import {
  Percent,
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Filter,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Discount, DiscountType, StudentDiscount } from "../../../types";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { ExportButton } from "../../common/ExportButton";
import { ConfirmModal } from "../../common/ConfirmModal";
import { compareClassesAscending } from "../../../utils/classSorter";

const DISCOUNT_TYPES: DiscountType[] = [
  "Sibling Discount",
  "Employee Discount",
  "Early Payment Discount",
  "Special Approval",
  "Custom",
];

export const DiscountsView: React.FC = () => {
  const {
    discounts,
    studentDiscounts,
    students,
    addDiscount,
    updateDiscount,
    deleteDiscount,
    assignDiscountToStudent,
    removeStudentDiscount,
    academicClasses,
  } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<"master" | "allocated">("master");
  const [query, setQuery] = useState("");
  const [allocatedClassFilter, setAllocatedClassFilter] =
    useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState<Discount | null>(null);
  const [deletingDisc, setDeletingDisc] = useState<Discount | null>(null);

  // Grant Concession Modal with Class Filter & Search
  const [isAllocOpen, setIsAllocOpen] = useState(false);
  const [allocClassFilter, setAllocClassFilter] = useState<string>("All");
  const [allocSearchQuery, setAllocSearchQuery] = useState<string>("");
  const [allocStudentId, setAllocStudentId] = useState("");
  const [allocDiscountId, setAllocDiscountId] = useState(
    discounts[0]?.id || "",
  );

  const sortedClasses = useMemo(() => {
    return [...academicClasses].sort((a, b) =>
      compareClassesAscending(a.name, b.name),
    );
  }, [academicClasses]);

  // Filtered Students for the Grant Concession Modal
  const filteredStudentsForGrant = useMemo(() => {
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

  const selectedDiscountDetails = useMemo(() => {
    return discounts.find((d) => d.id === allocDiscountId);
  }, [discounts, allocDiscountId]);

  const [formData, setFormData] = useState<Partial<Discount>>({
    name: "",
    code: "",
    type: "Sibling Discount",
    mode: "Percentage",
    value: 10,
    status: "Active",
  });

  const filteredDiscounts = discounts.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.code.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredAwardedList = studentDiscounts.filter((sd) => {
    const st = students.find((s) => s.id === sd.studentId);
    const studentName = st ? `${st.firstName} ${st.lastName}` : sd.studentId;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      studentName.toLowerCase().includes(q) ||
      sd.discountName.toLowerCase().includes(q);
    const matchesClass =
      allocatedClassFilter === "All" ||
      (st && st.className === allocatedClassFilter);
    return matchesQuery && matchesClass;
  });

  const handleOpenAdd = () => {
    setEditingDisc(null);
    setFormData({
      name: "",
      code: "DSC-" + Math.floor(100 + Math.random() * 900),
      type: "Sibling Discount",
      mode: "Percentage",
      value: 10,
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Discount) => {
    setEditingDisc(d);
    setFormData(d);
    setIsModalOpen(true);
  };

  const handleOpenAlloc = () => {
    setAllocClassFilter("All");
    setAllocSearchQuery("");
    setAllocStudentId("");
    if (discounts.length > 0) {
      setAllocDiscountId(discounts[0].id);
    }
    setIsAllocOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast("warning", "Validation Error", "Name and code are required.");
      return;
    }

    if (editingDisc) {
      updateDiscount(editingDisc.id, formData);
      addToast("success", "Discount Updated", `Updated ${formData.name}`);
    } else {
      addDiscount(formData as Omit<Discount, "id">);
      addToast("success", "Discount Created", `Created ${formData.name}`);
    }
    setIsModalOpen(false);
  };

  const handleAllocSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!allocStudentId || !allocDiscountId) {
      addToast(
        "warning",
        "Selection Required",
        "Select both student and discount rule.",
      );
      return;
    }
    assignDiscountToStudent(allocStudentId, allocDiscountId);
    addToast(
      "success",
      "Concession Granted",
      "Applied concession to student successfully.",
    );
    setIsAllocOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-sky-500" /> Discounts & Concessions
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Discount
          </button>
          <ExportButton data={activeTab === 'master' ? filteredDiscounts : filteredAwardedList} filename="discounts" />
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("master")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "master"
                ? "bg-white dark:bg-slate-900 text-brand-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Discount Rules ({discounts.length})
          </button>
          <button
            onClick={() => setActiveTab("allocated")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "allocated"
                ? "bg-white dark:bg-slate-900 text-brand-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Granted Student Concessions ({studentDiscounts.length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeTab === "allocated" && (
            <select
              value={allocatedClassFilter}
              onChange={(e) => setAllocatedClassFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-medium"
            >
              <option value="All">All Class Grades</option>
              {sortedClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={
                activeTab === "master"
                  ? "Search discount name..."
                  : "Search student or concession..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Discount Rules */}
      {activeTab === "master" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDiscounts.map((d) => (
            <div
              key={d.id}
              className="glass-card p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  {d.type} • {d.code}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                  {d.name}
                </h3>
                <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {d.mode === "Percentage"
                    ? `${d.value}% Concession`
                    : `${formatCurrency(d.value)} Flat Off`}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(d)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingDisc(d)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Granted Concessions List */}
      {activeTab === "allocated" && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">STUDENT NAME</th>
                  <th className="py-3.5 px-4">GRANTED CONCESSION</th>
                  <th className="py-3.5 px-4">DISCOUNT VALUE</th>
                  <th className="py-3.5 px-4">APPLIED DATE</th>
                  <th className="py-3.5 px-4 text-right">REMOVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredAwardedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No student concessions granted yet. Click "+ Grant Student
                      Concession" to apply a rule.
                    </td>
                  </tr>
                ) : (
                  filteredAwardedList.map((sd) => {
                    const st = students.find((s) => s.id === sd.studentId);
                    const disc = discounts.find((d) => d.id === sd.discountId);
                    return (
                      <tr
                        key={sd.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-sky-500" />
                          {st ? `${st.firstName} ${st.lastName}` : sd.studentId}
                          {st?.className && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              ({st.className}-{st.section})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">
                          {sd.discountName}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {disc
                            ? disc.mode === "Percentage"
                              ? `${disc.value}% Waiver`
                              : `${formatCurrency(disc.value)} Off`
                            : "Active"}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {sd.appliedDate}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              removeStudentDiscount(sd.id);
                              addToast(
                                "info",
                                "Concession Removed",
                                "Removed concession record.",
                              );
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Remove Concession"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Discount Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingDisc ? "Edit Discount" : "Add Discount"}
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
                    Discount Name{" "}
                    <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Code{" "}
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
                    Discount Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none font-medium"
                  >
                    {DISCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) =>
                      setFormData({ ...formData, mode: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none font-medium"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Value ({formData.mode === "Percentage" ? "%" : "₹"}){" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600 outline-none"
                />
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
                  className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl"
                >
                  Save Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Concession Modal - WITH CLASS FILTER & SEARCH */}
      {isAllocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Grant Student Concession
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Filter students by class grade or search by name & admission
                    no
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAllocOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAllocSubmit} className="space-y-4 text-xs">
              {/* Filter Controls: Class Dropdown + Search Student */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-sky-500" /> Filter Class
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
                    <Search className="w-3 h-3 text-sky-500" /> Search Student
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
                  <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                    {filteredStudentsForGrant.length} student
                    {filteredStudentsForGrant.length !== 1 ? "s" : ""} available
                  </span>
                </div>
                <select
                  value={allocStudentId}
                  onChange={(e) => setAllocStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none"
                  required
                >
                  <option value="">
                    -- Choose Student ({filteredStudentsForGrant.length}{" "}
                    matching) --
                  </option>
                  {filteredStudentsForGrant.map((st) => (
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
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 flex items-center justify-between">
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
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                    Eligible
                  </span>
                </div>
              )}

              {/* Select Discount Rule */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Select Discount Rule{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  value={allocDiscountId}
                  onChange={(e) => setAllocDiscountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none"
                  required
                >
                  {discounts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (
                      {d.mode === "Percentage"
                        ? `${d.value}% Concession`
                        : `${formatCurrency(d.value)} Flat Off`}
                      )
                    </option>
                  ))}
                </select>
              </div>

              {/* Concession Value Preview */}
              {selectedDiscountDetails && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Applied Concession
                    </span>
                    <div className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                      {selectedDiscountDetails.mode === "Percentage"
                        ? `${selectedDiscountDetails.value}% Concession on Fee`
                        : `${formatCurrency(selectedDiscountDetails.value)} Flat Deduction`}
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {selectedDiscountDetails.type}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAllocOpen(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Grant Concession
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingDisc}
        title="Delete Discount"
        message={`Are you sure you want to delete ${deletingDisc?.name}?`}
        onConfirm={() => {
          if (deletingDisc) {
            deleteDiscount(deletingDisc.id);
            addToast("success", "Discount Deleted");
            setDeletingDisc(null);
          }
        }}
        onCancel={() => setDeletingDisc(null)}
      />
    </div>
  );
};
