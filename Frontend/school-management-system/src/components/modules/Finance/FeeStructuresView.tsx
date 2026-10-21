import React, { useState, useMemo, useEffect } from "react";
import { formatCurrency } from "../../../utils/currency";
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Tag,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  X,
} from "lucide-react";
import {
  DynamicFeeStructure,
  FeeStructureItem,
  FeeHead,
} from "../../../types";
import { useData, matchesAcademicYear } from "../../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { ExportButton } from "../../common/ExportButton";
import { ConfirmModal } from "../../common/ConfirmModal";
import { compareClassesAscending } from "../../../utils/classSorter";

export type FeeCategoryType = string;

export interface FeeStructuresViewProps {
  initialCategory?: string;
}

export const FeeStructuresView: React.FC<FeeStructuresViewProps> = () => {
  const {
    feeHeads = [],
    dynamicFeeStructures = [],
    addDynamicFeeStructure,
    updateDynamicFeeStructure,
    deleteDynamicFeeStructure,
    academicClasses = [],
    academicYears = [],
    branches = [],
  } = useData();

  const { selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [query, setQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState<DynamicFeeStructure | null>(null);
  const [deletingStruct, setDeletingStruct] = useState<DynamicFeeStructure | null>(null);

  // Form State for Modal
  const [structName, setStructName] = useState("");
  const [structClass, setStructClass] = useState("");
  const [structAcademicYear, setStructAcademicYear] = useState("");
  const [structStatus, setStructStatus] = useState<"Active" | "Inactive">("Active");
  const [structItems, setStructItems] = useState<FeeStructureItem[]>([]);

  // Fee Head Selector State inside Modal
  const [selectedFeeHeadId, setSelectedFeeHeadId] = useState("");
  const [feeHeadInputAmount, setFeeHeadInputAmount] = useState("");

  // Sorted Academic Classes for dropdowns
  const sortedClasses = useMemo(
    () => [...academicClasses].sort((a, b) => compareClassesAscending(a.name, b.name)),
    [academicClasses]
  );

  // Active Fee Heads from the master list (created in Fee Heads tab)
  const activeFeeHeads = useMemo(() => {
    return (feeHeads || []).filter((h) => h.status === "Active" || !h.status);
  }, [feeHeads]);

  // Currently selected Fee Head in the dropdown
  const currentSelectedHead = useMemo(() => {
    return activeFeeHeads.find((h) => String(h.id) === String(selectedFeeHeadId)) || null;
  }, [activeFeeHeads, selectedFeeHeadId]);

  // Filtered Fee Structures for display
  const filteredStructures = useMemo(() => {
    return (dynamicFeeStructures || [])
      .filter((s) => {
        // Academic year matching
        if (selectedAcademicYear && s.academicYear && !matchesAcademicYear(s.academicYear, selectedAcademicYear)) {
          return false;
        }

        // Class filter
        if (
          selectedClassFilter !== "All" &&
          s.className &&
          s.className !== "All" &&
          s.className !== selectedClassFilter
        ) {
          return false;
        }

        // Status filter
        if (selectedStatusFilter !== "All" && s.status !== selectedStatusFilter) {
          return false;
        }

        // Search query
        if (query.trim()) {
          const q = query.toLowerCase();
          const matchClass = (s.className || "").toLowerCase().includes(q);
          const matchName = (s.name || "").toLowerCase().includes(q);
          const matchItems = (s.items || []).some(
            (i) =>
              (i.feeHeadName || "").toLowerCase().includes(q) ||
              (i.category || "").toLowerCase().includes(q)
          );
          if (!matchClass && !matchName && !matchItems) return false;
        }

        return true;
      })
      .sort((a, b) => compareClassesAscending(a.className || "", b.className || ""));
  }, [dynamicFeeStructures, selectedAcademicYear, selectedClassFilter, selectedStatusFilter, query]);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingStruct(null);
    const initialAy =
      selectedAcademicYear ||
      (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) ||
      "2026-2027";

    const defaultClass = sortedClasses[0]?.name || "";
    setStructClass(defaultClass);
    setStructName(defaultClass ? `${defaultClass} Fee Structure` : "General Fee Structure");
    setStructAcademicYear(initialAy);
    setStructStatus("Active");
    setStructItems([]);
    setSelectedFeeHeadId(activeFeeHeads[0]?.id || "");
    setFeeHeadInputAmount("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (s: DynamicFeeStructure) => {
    setEditingStruct(s);
    setStructName(s.name || `${s.className} Fee Structure`);
    setStructClass(s.className || "");
    setStructAcademicYear(s.academicYear || selectedAcademicYear || "2026-2027");
    setStructStatus(s.status || "Active");
    const activeHeadIds = new Set(activeFeeHeads.map((h) => String(h.id).trim().toLowerCase()));
    const activeHeadNames = new Set(activeFeeHeads.map((h) => (h.name || "").trim().toLowerCase()));
    const validItems = (s.items ? [...s.items] : []).filter((item) => {
      const iId = String(item.feeHeadId || (item as any).headId || "").trim().toLowerCase();
      const iName = (item.feeHeadName || (item as any).name || "").trim().toLowerCase();
      return (iId && activeHeadIds.has(iId)) || (iName && activeHeadNames.has(iName));
    });
    setStructItems(validItems);
    setSelectedFeeHeadId(activeFeeHeads[0]?.id || "");
    setFeeHeadInputAmount("");
    setIsModalOpen(true);
  };

  // Handle Class change in Modal
  const handleModalClassChange = (newClass: string) => {
    setStructClass(newClass);
    // Auto-update structure name if it was empty or default
    if (!structName || structName.includes("Fee Structure")) {
      setStructName(newClass ? `${newClass} Fee Structure` : "General Fee Structure");
    }
  };

  // Add Fee Head to structure items list
  const handleAddFeeHead = () => {
    if (!selectedFeeHeadId) {
      addToast("warning", "Select Fee Head", "Please select a Fee Head from the dropdown.");
      return;
    }

    const head = activeFeeHeads.find((h) => String(h.id) === String(selectedFeeHeadId));
    if (!head) {
      addToast("warning", "Invalid Fee Head", "The selected Fee Head was not found.");
      return;
    }

    const amt = parseFloat(feeHeadInputAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast("warning", "Invalid Amount", "Please enter a valid fee amount greater than 0.");
      return;
    }

    // Check if fee head is already in the list
    const existingIndex = structItems.findIndex(
      (item) =>
        String(item.feeHeadId) === String(head.id) ||
        (item.feeHeadName && item.feeHeadName.toLowerCase().trim() === head.name.toLowerCase().trim())
    );

    if (existingIndex >= 0) {
      // Update existing item amount
      const updated = [...structItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        amount: amt,
        feeHeadId: head.id,
        feeHeadName: head.name,
        category: head.category || "General",
        frequency: head.frequency || "Annual",
        paymentEligibility: head.paymentEligibility,
        applicableTerms: head.applicableTerms,
      };
      setStructItems(updated);
      addToast("info", "Fee Head Updated", `Updated amount for ${head.name} to ${formatCurrency(amt)}`);
    } else {
      // Add new fee head item
      const newItem: FeeStructureItem = {
        feeHeadId: head.id,
        feeHeadName: head.name,
        category: head.category || "General",
        frequency: head.frequency || "Annual",
        paymentEligibility: head.paymentEligibility,
        applicableTerms: head.applicableTerms,
        amount: amt,
      };
      setStructItems([...structItems, newItem]);
      addToast("success", "Fee Head Added", `Added ${head.name} (${formatCurrency(amt)}) to structure.`);
    }

    // Clear amount input
    setFeeHeadInputAmount("");
  };

  // Remove Fee Head item from structure
  const handleRemoveItem = (index: number) => {
    const updated = structItems.filter((_, i) => i !== index);
    setStructItems(updated);
  };

  // Update item amount inline in the table
  const handleItemAmountChange = (index: number, newAmountStr: string) => {
    const updated = [...structItems];
    const num = parseFloat(newAmountStr) || 0;
    updated[index] = { ...updated[index], amount: num };
    setStructItems(updated);
  };

  // Total amount calculated dynamically
  const calculatedTotalAmount = useMemo(() => {
    return structItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [structItems]);

  // Submit Modal Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!structClass.trim()) {
      addToast("warning", "Class Required", "Please select a Class Grade.");
      return;
    }

    if (structItems.length === 0) {
      addToast("warning", "Fee Heads Required", "Please add at least one Fee Head to this fee structure.");
      return;
    }

    const defaultBranch =
      selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches"
        ? selectedBranch
        : (branches && branches[0] ? (branches[0].branchName || (branches[0] as any).name) : "");

    const defaultAy =
      structAcademicYear ||
      selectedAcademicYear ||
      (academicYears && academicYears[0]?.academicYear) ||
      "2026-2027";

    const payload: Omit<DynamicFeeStructure, "id"> = {
      name: structName.trim() || `${structClass} Fee Structure`,
      academicYear: defaultAy,
      branch: defaultBranch,
      className: structClass,
      section: "A",
      studentCategory: "General",
      category: "Tuition Fee",
      feeCategory: "Tuition Fee",
      items: structItems,
      totalAmount: calculatedTotalAmount,
      status: structStatus,
    };

    if (editingStruct) {
      updateDynamicFeeStructure(editingStruct.id, payload);
      addToast("success", "Fee Structure Updated", `Updated ${payload.name}`);
    } else {
      addDynamicFeeStructure(payload);
      addToast("success", "Fee Structure Created", `Created ${payload.name}`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-500" /> Fee Structures
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure fee structures for academic classes by selecting created fee heads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Fee Structure
          </button>
          <ExportButton data={filteredStructures} filename="fee_structures" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search class, fee head, or structure name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        {/* Class Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="All">All Class Grades</option>
            {sortedClasses.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Grid of Fee Structures */}
      {filteredStructures.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              No Fee Structures Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No fee structures configured matching your current filter. Click below to create one.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Fee Structure
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStructures.map((s) => {
            const items = s.items || [];
            const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || s.totalAmount || 0;

            return (
              <div
                key={s.id}
                className="glass-card p-5 rounded-2xl space-y-3.5 border-l-4 border-l-sky-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Bar with Class and Actions */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg font-extrabold text-[10px] uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          {s.className || "Class Grade"}
                        </span>
                        {s.status === "Inactive" && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {s.name || `${s.className} Fee Structure`}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Academic Year:{" "}
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {s.academicYear || "Current Year"}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 cursor-pointer"
                        title="Edit Structure"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingStruct(s)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 cursor-pointer"
                        title="Delete Structure"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fee Items Breakdown */}
                  {items.length === 0 ? (
                    <div className="py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                      No fee breakdown configured. Base amount: {formatCurrency(s.totalAmount)}
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-none"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {item.feeHeadName || "Fee Head"}
                            </span>
                            {item.frequency && (
                              <span className="text-[10px] text-slate-400 block">
                                {item.frequency}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white ml-2 shrink-0">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center font-extrabold text-sm text-slate-900 dark:text-white">
                  <span className="text-xs text-slate-500">Total Fee:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Fee Structure Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-500" />
                  {editingStruct ? "Edit Fee Structure" : "Create Fee Structure"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select a class grade and add your created fee heads to build the fee structure.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Basic Settings: Class, Name, AY, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Class Grade <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={structClass}
                    onChange={(e) => handleModalClassChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold outline-none text-xs cursor-pointer"
                  >
                    <option value="">Select Class Grade</option>
                    {sortedClasses.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Structure Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={structName}
                    onChange={(e) => setStructName(e.target.value)}
                    placeholder="e.g. Class 10 Standard Fee"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={structAcademicYear}
                    onChange={(e) => setStructAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold outline-none text-xs cursor-pointer"
                  >
                    {academicYears && academicYears.length > 0 ? (
                      academicYears.map((ay) => {
                        const yr = ay.academicYear || (ay as any).name;
                        return (
                          <option key={ay.id || yr} value={yr}>
                            {yr}
                          </option>
                        );
                      })
                    ) : (
                      <option value={structAcademicYear}>{structAcademicYear || "2026-2027"}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={structStatus}
                    onChange={(e) => setStructStatus(e.target.value as "Active" | "Inactive")}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold outline-none text-xs cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Fee Heads Selection Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-sky-500" /> Select Created Fee Heads
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {activeFeeHeads.length} Fee Head{activeFeeHeads.length !== 1 ? "s" : ""} Available
                  </span>
                </div>

                {activeFeeHeads.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-1">
                    <p className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                      No Fee Heads Found in System
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Please create fee heads under the <strong>Fee Setup → Fee Heads</strong> tab first.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      {/* Fee Head Dropdown */}
                      <div className="sm:col-span-7">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Select Fee Head
                        </label>
                        <select
                          value={selectedFeeHeadId}
                          onChange={(e) => setSelectedFeeHeadId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold outline-none cursor-pointer"
                        >
                          <option value="">-- Choose Fee Head --</option>
                          {activeFeeHeads.map((head) => (
                            <option key={head.id} value={head.id}>
                              {head.name} {head.code ? `(${head.code})` : ""} {head.frequency ? `• ${head.frequency}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount Input */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={feeHeadInputAmount}
                          onChange={(e) => setFeeHeadInputAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono font-bold text-xs outline-none text-right"
                        />
                      </div>

                      {/* Add Button */}
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddFeeHead}
                          className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>

                    {currentSelectedHead && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-0.5">
                        <span>Frequency: <strong className="text-slate-600 dark:text-slate-300">{currentSelectedHead.frequency || "Annual"}</strong></span>
                        <span>Eligibility: <strong className="text-slate-600 dark:text-slate-300">{currentSelectedHead.paymentEligibility || "Both One-Time and Term-Wise"}</strong></span>
                        {currentSelectedHead.category && (
                          <span>Category: <strong className="text-slate-600 dark:text-slate-300">{currentSelectedHead.category}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Items Breakdown Table */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Configured Fee Heads ({structItems.length})</span>
                    <span>Amount</span>
                  </div>

                  {structItems.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                      No fee heads added yet. Select a fee head from the dropdown above and enter the amount.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {structItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {item.feeHeadName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {item.frequency || "Annual"} {item.category ? `• ${item.category}` : ""}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              value={item.amount || ""}
                              onChange={(e) => handleItemAmountChange(idx, e.target.value)}
                              className="w-24 px-2 py-1 rounded-lg border bg-white dark:bg-slate-900 font-mono font-bold text-xs text-right outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Remove Fee Head"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Bar */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>Total Structure Fee:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">
                    {formatCurrency(calculatedTotalAmount)}
                  </span>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                >
                  {editingStruct ? "Update Fee Structure" : "Save Fee Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStruct && (
        <ConfirmModal
          isOpen={true}
          title="Delete Fee Structure"
          message={`Are you sure you want to delete "${deletingStruct.name || deletingStruct.className}"? This action cannot be undone.`}
          confirmLabel="Delete Structure"
          onConfirm={() => {
            deleteDynamicFeeStructure(deletingStruct.id);
            addToast("success", "Structure Deleted", `Deleted ${deletingStruct.name}`);
            setDeletingStruct(null);
          }}
          onCancel={() => setDeletingStruct(null)}
        />
      )}
    </div>
  );
};

export default FeeStructuresView;
