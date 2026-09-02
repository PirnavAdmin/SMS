import React, { useState, useEffect, useRef, useCallback } from "react";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { getHostelBlocks, getRoomTypes } from "../../../api/hostel";
import { FinanceHostelConfig } from "../../../types";
import { formatCurrency } from "../../../utils/currency";
import { ConfirmModal } from "../../common/ConfirmModal";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Bed,
  Check,
  Sparkles,
  Filter,
  ChevronDown,
  Home,
  CheckCircle2,
  XCircle,
} from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);

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
          className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
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

export const FinanceHostelConfigView: React.FC = () => {
  const {
    hostelMasters,
    roomTypeMasters,
    roomMasters,
    financeHostelConfigs,
    addFinanceHostelConfig,
    updateFinanceHostelConfig,
    deleteFinanceHostelConfig,
  } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterHostel, setFilterHostel] = useState("All");

  // Live Hostel Masters & Room Types from Hostel Management API & Local Storage
  const [activeBlocks, setActiveBlocks] = useState<
    Array<{ id: string; hostelName: string; hostelCode?: string; hostelType: string }>
  >([]);
  const [activeRoomTypes, setActiveRoomTypes] = useState<
    Array<{ id: string; roomTypeName: string; capacity: number }>
  >([]);

  const loadLiveMasters = useCallback(async () => {
    try {
      const [bRes, rtRes] = await Promise.all([
        getHostelBlocks().catch(() => []),
        getRoomTypes().catch(() => []),
      ]);

      const apiBlocks = (Array.isArray(bRes) ? bRes : []).map((b) => ({
        id: String(b.hostelId),
        hostelName: b.hostelName || `Hostel Block #${b.hostelId}`,
        hostelCode: b.hostelCode || "",
        hostelType: b.hostelType || "Boys Hostel",
      }));

      const blockMap = new Map<
        string,
        { id: string; hostelName: string; hostelCode?: string; hostelType: string }
      >();
      (hostelMasters || []).forEach((h) =>
        blockMap.set(String(h.id), {
          id: String(h.id),
          hostelName: h.hostelName,
          hostelCode: (h as any).hostelCode || (h as any).code || "",
          hostelType: h.hostelType || "Boys Hostel",
        }),
      );
      apiBlocks.forEach((b) => blockMap.set(String(b.id), b));

      const combinedBlocks = Array.from(blockMap.values());
      setActiveBlocks(
        combinedBlocks.length > 0
          ? combinedBlocks
          : (hostelMasters || []).map((h) => ({
              id: String(h.id),
              hostelName: h.hostelName,
              hostelCode: (h as any).hostelCode || (h as any).code || "",
              hostelType: h.hostelType || "Boys Hostel",
            })),
      );

      const apiRt = (Array.isArray(rtRes) ? rtRes : []).map((rt) => ({
        id: String(rt.roomTypeId),
        roomTypeName: rt.roomTypeSpecification || `Room Type #${rt.roomTypeId}`,
        capacity: Number(rt.bedCapacity) || 2,
      }));

      const rtMap = new Map<
        string,
        { id: string; roomTypeName: string; capacity: number }
      >();
      (roomTypeMasters || []).forEach((rt) =>
        rtMap.set(String(rt.id), {
          id: String(rt.id),
          roomTypeName: rt.roomTypeName,
          capacity: rt.capacity || 2,
        }),
      );
      apiRt.forEach((rt) => rtMap.set(String(rt.id), rt));

      const combinedRt = Array.from(rtMap.values());
      setActiveRoomTypes(
        combinedRt.length > 0
          ? combinedRt
          : (roomTypeMasters || []).map((rt) => ({
              id: String(rt.id),
              roomTypeName: rt.roomTypeName,
              capacity: rt.capacity || 2,
            })),
      );
    } catch (e) {
      setActiveBlocks(
        (hostelMasters || []).map((h) => ({
          id: String(h.id),
          hostelName: h.hostelName,
          hostelCode: (h as any).hostelCode || (h as any).code || "",
          hostelType: h.hostelType || "Boys Hostel",
        })),
      );
      setActiveRoomTypes(
        (roomTypeMasters || []).map((rt) => ({
          id: String(rt.id),
          roomTypeName: rt.roomTypeName,
          capacity: rt.capacity || 2,
        })),
      );
    }
  }, [hostelMasters, roomTypeMasters]);

  useEffect(() => {
    loadLiveMasters();
  }, [loadLiveMasters]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] =
    useState<FinanceHostelConfig | null>(null);
  const [deletingConfig, setDeletingConfig] =
    useState<FinanceHostelConfig | null>(null);

  const [form, setForm] = useState<Partial<FinanceHostelConfig>>({
    hostelId: "",
    hostelName: "",
    roomTypeId: "",
    roomTypeName: "",
    roomId: "",
    roomNo: "All Rooms",
    feePlan: "Annual",
    hostelFee: 40000,
    securityDeposit: 5000,
    effectiveFrom: new Date().toISOString().split("T")[0],
    status: "Active",
  });

  const handleOpenAdd = async () => {
    setEditingConfig(null);
    await loadLiveMasters();

    const firstBlock = activeBlocks[0] || hostelMasters[0];
    const firstRt = activeRoomTypes[0] || roomTypeMasters[0];

    setForm({
      hostelId: firstBlock ? String(firstBlock.id) : "",
      hostelName: firstBlock ? firstBlock.hostelName : "",
      roomTypeId: firstRt ? String(firstRt.id) : "",
      roomTypeName: firstRt
        ? firstRt.roomTypeName || (firstRt as any).roomTypeSpecification
        : "",
      roomId: "",
      roomNo: "All Rooms",
      feePlan: "Annual",
      hostelFee: 40000,
      securityDeposit: 5000,
      effectiveFrom: new Date().toISOString().split("T")[0],
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (c: FinanceHostelConfig) => {
    await loadLiveMasters();
    setEditingConfig(c);
    setForm(c);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.hostelId || !form.hostelFee) {
      addToast(
        "error",
        "Validation Error",
        "Please select a hostel block and enter a valid hostel fee",
      );
      return;
    }

    const hObj = activeBlocks.find(
      (h) => String(h.id) === String(form.hostelId),
    );
    const rtObj = activeRoomTypes.find(
      (rt) => String(rt.id) === String(form.roomTypeId),
    );

    const configData = {
      ...form,
      hostelId: String(form.hostelId),
      hostelName: hObj?.hostelName || form.hostelName || "Hostel Block",
      roomTypeId: String(form.roomTypeId),
      roomTypeName: rtObj?.roomTypeName || form.roomTypeName || "Standard Room",
      roomNo: "All Rooms",
    };

    if (editingConfig) {
      updateFinanceHostelConfig(editingConfig.id, configData);
      addToast(
        "success",
        "Configuration Updated",
        "Hostel fee configuration saved",
      );
    } else {
      addFinanceHostelConfig(configData as Omit<FinanceHostelConfig, "id">);
      addToast(
        "success",
        "Configuration Created",
        "New hostel fee configuration added",
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingConfig) {
      deleteFinanceHostelConfig(deletingConfig.id);
      addToast("success", "Configuration Deleted");
      setDeletingConfig(null);
    }
  };

  const filteredConfigs = financeHostelConfigs.filter((c) => {
    const matchQuery =
      (c.hostelName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.roomTypeName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchHostel =
      filterHostel === "All" || String(c.hostelId) === String(filterHostel);
    return matchQuery && matchHostel;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-sky-500" /> Hostel Fee Configuration
          </h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Hostel Fee
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Hostel Name or Room Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={filterHostel}
          onChange={(e) => setFilterHostel(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none"
        >
          <option value="All">All Hostels ({activeBlocks.length})</option>
          {activeBlocks.map((h) => (
            <option key={h.id} value={h.id}>
              {h.hostelName}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Hostel Block</th>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4">Fee Plan</th>
                <th className="py-3 px-4 text-right">Hostel Fee</th>
                <th className="py-3 px-4 text-right">Deposit</th>
                <th className="py-3 px-4 text-right">Total Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No hostel fee configurations found. Click "Add Hostel Fee"
                    to configure pricing.
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((c) => {
                  const total = (c.hostelFee || 0) + (c.securityDeposit || 0);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-500 shrink-0" />{" "}
                        {c.hostelName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {c.roomTypeName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold text-[10px]">
                          {c.feePlan}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-sky-600 dark:text-sky-400">
                        {formatCurrency(c.hostelFee || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400">
                        {formatCurrency(c.securityDeposit || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-3 px-4">
                        {c.status === "Active" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px] flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingConfig(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {editingConfig ? "Edit Hostel Fee" : "Add Hostel Fee"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Hostel Block <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <SearchableCombobox
                  value={form.hostelId || ""}
                  placeholder="Search or type Hostel Block..."
                  options={activeBlocks.map((h) => ({
                    value: String(h.id),
                    label: h.hostelName,
                    subLabel: `${h.hostelCode ? `[${h.hostelCode}] • ` : ""}${h.hostelType}`,
                  }))}
                  onChange={(val, opt) => {
                    const hObj = activeBlocks.find(
                      (h) => String(h.id) === String(val),
                    ) || { hostelName: val, hostelType: "Boys Hostel" };
                    setForm({
                      ...form,
                      hostelId: val,
                      hostelName: hObj.hostelName || val,
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Room Type <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <SearchableCombobox
                    value={form.roomTypeId || ""}
                    placeholder="Search or type Room Type..."
                    options={activeRoomTypes.map((rt) => ({
                      value: String(rt.id),
                      label: rt.roomTypeName,
                      subLabel: `Bed Capacity: ${rt.capacity} Student${rt.capacity > 1 ? "s" : ""}`,
                    }))}
                    onChange={(val, opt) => {
                      const rtObj = activeRoomTypes.find(
                        (rt) => String(rt.id) === String(val),
                      ) || { roomTypeName: val };
                      setForm({
                        ...form,
                        roomTypeId: val,
                        roomTypeName: rtObj.roomTypeName || val,
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Fee Frequency <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={form.feePlan}
                    onChange={(e) =>
                      setForm({ ...form, feePlan: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half Yearly">Half Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Hostel Fee (₹) <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.hostelFee}
                    onChange={(e) =>
                      setForm({ ...form, hostelFee: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-extrabold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Security Deposit
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.securityDeposit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        securityDeposit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={(e) =>
                      setForm({ ...form, effectiveFrom: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingConfig && (
        <ConfirmModal
          isOpen={true}
          title="Delete Hostel Fee Configuration"
          message={`Are you sure you want to delete the fee configuration for ${deletingConfig.hostelName}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingConfig(null)}
        />
      )}
    </div>
  );
};
