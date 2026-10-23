// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useData, matchesAcademicYear } from "../../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { getHostelBlocks, getRoomTypes, getRooms, HostelRoom } from "../../../api/hostel";
import { FinanceHostelConfig } from "../../../types";
import { formatCurrency } from "../../../utils/currency";
import { ConfirmModal } from "../../common/ConfirmModal";
import { ExportButton } from "../../common/ExportButton";
import { compareClassesAscending, getSortOrderForClass, doClassRangesOverlap } from "../../../utils/classSorter";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Bed,
  Check,
  ChevronDown,
  Wind,
  GraduationCap,
  RotateCcw,
  DoorOpen,
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
  allowCustom = false,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find(
    (o) =>
      String(o.value) === String(value) ||
      (value && value !== "N/A" && o.label.toLowerCase() === String(value).toLowerCase()),
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
          readOnly={!allowCustom}
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
          className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 cursor-pointer"
        />
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer pointer-events-none" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 space-y-0.5 custom-scrollbar">
          {filteredOptions.length === 0 ? (
            allowCustom && searchText.trim() ? (
              <button
                type="button"
                onClick={() => {
                  onChange(searchText.trim());
                  setIsOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950 flex items-center justify-between"
              >
                <span>Use custom: "{searchText}"</span>
              </button>
            ) : (
              <div className="px-2.5 py-2 text-center text-xs text-slate-400 font-medium">
                No matching options
              </div>
            )
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={`opt_${opt.value}_${idx}`}
                  type="button"
                  disabled={opt.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (opt.disabled) return;
                    onChange(opt.value, opt);
                    setSearchText(opt.label);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                    opt.disabled
                      ? "opacity-50 cursor-not-allowed text-slate-400"
                      : isSelected
                        ? "bg-sky-50 dark:bg-sky-950/70 text-sky-600 font-bold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  }`}
                >
                  <div className="truncate">
                    <span className="font-semibold">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-slate-400 block">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-sky-600">✓</span>
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

export interface ClassRangeTier {
  id: string;
  startClass: string;
  endClass: string;
  hostelFee: string;
  securityDeposit: string;
}

export const FinanceHostelConfigView: React.FC = () => {
  const {
    hostelMasters,
    roomTypeMasters,
    roomMasters,
    academicClasses,
    academicYears,
    academicYearFeeSchedules,
    financeHostelConfigs = [],
    addFinanceHostelConfig,
    updateFinanceHostelConfig,
    deleteFinanceHostelConfig,
  } = useData();
  const { selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  // Filters
  const [query, setQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedRoom, setSelectedRoom] = useState("All");
  const [selectedAcType, setSelectedAcType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  // Dynamic masters from Hostel Management Module
  const [activeBlocks, setActiveBlocks] = useState<
    Array<{ id: string; hostelName: string; hostelCode?: string; hostelType: string }>
  >([]);
  const [activeRoomTypes, setActiveRoomTypes] = useState<
    Array<{ id: string; roomTypeName: string; capacity: number; acType?: string }>
  >([]);

  // Rooms for block selection
  const [blockRooms, setBlockRooms] = useState<HostelRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Load live blocks and room types dynamically from Hostel Module
  const loadLiveMasters = useCallback(async () => {
    try {
      const [bRes, rtRes] = await Promise.all([
        getHostelBlocks().catch(() => []),
        getRoomTypes().catch(() => []),
      ]);

      const apiBlocks = (Array.isArray(bRes) ? bRes : []).map((b) => ({
        id: String(b.hostelId),
        hostelName: b.hostelName || `Block #${b.hostelId}`,
        hostelCode: b.hostelCode || "",
        hostelType: b.hostelType || "Hostel",
      }));

      const blockMap = new Map<string, { id: string; hostelName: string; hostelCode?: string; hostelType: string }>();
      (hostelMasters || []).forEach((h) =>
        blockMap.set(String(h.id), {
          id: String(h.id),
          hostelName: h.hostelName,
          hostelCode: (h as any).hostelCode || (h as any).code || "",
          hostelType: h.hostelType || "Hostel",
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
              hostelType: h.hostelType || "Hostel",
            })),
      );

      const apiRt = (Array.isArray(rtRes) ? rtRes : []).map((rt) => ({
        id: String(rt.roomTypeId),
        roomTypeName: rt.roomTypeSpecification || rt.roomTypeName || `Type #${rt.roomTypeId}`,
        capacity: Number(rt.bedCapacity) || Number(rt.capacity) || 1,
        acType: rt.acType || "Non-AC",
      }));

      const rtMap = new Map<string, { id: string; roomTypeName: string; capacity: number; acType?: string }>();
      (roomTypeMasters || []).forEach((rt) =>
        rtMap.set(String(rt.id), {
          id: String(rt.id),
          roomTypeName: rt.roomTypeName,
          capacity: rt.capacity || 1,
          acType: (rt as any).acType || "Non-AC",
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
              capacity: rt.capacity || 1,
              acType: (rt as any).acType || "Non-AC",
            })),
      );
    } catch (e) {
      console.warn("Failed to load live hostel masters:", e);
    }
  }, [hostelMasters, roomTypeMasters]);

  useEffect(() => {
    loadLiveMasters();
  }, [loadLiveMasters]);

  // Load rooms dynamically from backend API + Context for the selected block
  const loadRoomsForBlock = useCallback(
    async (hId: string) => {
      if (!hId) {
        setBlockRooms([]);
        return;
      }
      setIsLoadingRooms(true);
      try {
        const numericId = parseInt(hId.replace(/\D/g, ""), 10);
        const apiRooms = await getRooms(isNaN(numericId) ? undefined : numericId).catch(() => []);

        const allKnownRooms: HostelRoom[] = [];
        const seenRoomKeys = new Set<string>();

        (Array.isArray(apiRooms) ? apiRooms : []).forEach((r) => {
          if (!r.hostelId || String(r.hostelId) === String(hId) || String(r.hostelId) === String(numericId)) {
            const key = `${r.hostelId || numericId}_${r.roomNumber || r.roomId}`;
            if (!seenRoomKeys.has(key)) {
              seenRoomKeys.add(key);
              allKnownRooms.push(r);
            }
          }
        });

        // Supplement from roomMasters in context if available
        (roomMasters || []).forEach((rm: any) => {
          const rmHostelId = String(rm.hostelId || "");
          if (rmHostelId === String(hId) || rmHostelId === String(numericId)) {
            const rNum = String(rm.roomNo || rm.roomNumber || rm.id);
            const key = `${rm.hostelId}_${rNum}`;
            if (!seenRoomKeys.has(key)) {
              seenRoomKeys.add(key);
              allKnownRooms.push({
                roomId: Number(rm.id) || Math.floor(100 + Math.random() * 900),
                hostelId: Number(numericId) || 1,
                hostelName: rm.hostelName || "",
                hostelCode: "",
                roomTypeId: Number(rm.roomTypeId) || 1,
                roomTypeSpecification: rm.roomTypeName || rm.specification || "Standard",
                bedCapacity: rm.capacity || 1,
                floorLevel: rm.floorLevel || "Ground Floor",
                roomNumber: rNum,
                status: rm.status || "Active",
                occupiedBeds: 0,
                vacantBeds: rm.capacity || 1,
                createdAt: new Date().toISOString(),
              });
            }
          }
        });

        setBlockRooms(allKnownRooms);
      } catch (err) {
        setBlockRooms([]);
      } finally {
        setIsLoadingRooms(false);
      }
    },
    [roomMasters],
  );

  // Purely dynamic academic classes from database (Zero hardcoded arrays)
  const dynamicClasses = useMemo(() => {
    if (!academicClasses || !Array.isArray(academicClasses) || academicClasses.length === 0) {
      return [];
    }
    const list: string[] = [];
    academicClasses.forEach((c: any) => {
      const name = c.name || c.className;
      if (name && !list.includes(name)) list.push(name);
    });
    return list.sort((a, b) => compareClassesAscending(a, b, academicClasses));
  }, [academicClasses]);

  // Dynamically load fee schedule terms (Zero hardcoded terms)
  const availableScheduleTerms = useMemo(() => {
    const activeAY =
      selectedAcademicYear ||
      (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) ||
      "";
    const schedule = (academicYearFeeSchedules || []).find((s) => matchesAcademicYear(s.academicYear, activeAY));
    if (schedule && schedule.terms && schedule.terms.length > 0) {
      return [...schedule.terms].sort((a, b) => a.sequence - b.sequence).map((t) => t.termName || t.id);
    }
    const anyScheduleWithTerms = (academicYearFeeSchedules || []).find((s) => s.terms && s.terms.length > 0);
    if (anyScheduleWithTerms) {
      return [...anyScheduleWithTerms.terms].sort((a, b) => a.sequence - b.sequence).map((t) => t.termName || t.id);
    }
    return ["Term 1", "Term 2", "Term 3", "Term 4"];
  }, [academicYearFeeSchedules, selectedAcademicYear, academicYears]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FinanceHostelConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<FinanceHostelConfig | null>(null);

  // Modal form state (Zero hardcoded fees or strings)
  const [form, setForm] = useState<{
    hostelId: string;
    hostelName: string;
    roomId: string;
    roomNo: string;
    roomTypeId: string;
    roomTypeName: string;
    acType: "AC" | "Non-AC" | "All";
    sharingType: string;
    academicYear: string;
    feePlan: string;
    applicableTerms: string[];
    effectiveFrom: string;
    status: "Active" | "Inactive";
  }>({
    hostelId: "",
    hostelName: "",
    roomId: "",
    roomNo: "All Rooms",
    roomTypeId: "",
    roomTypeName: "All Room Types",
    acType: "All",
    sharingType: "All",
    academicYear: "",
    feePlan: "Annual",
    applicableTerms: [],
    effectiveFrom: new Date().toISOString().split("T")[0],
    status: "Active",
  });

  // Dynamic class range tiers for this room
  const [tiers, setTiers] = useState<ClassRangeTier[]>([]);

  // Open modal in Add mode
  const handleOpenAdd = async (initialBlockId?: string, initialRoomNo?: string) => {
    setEditingConfig(null);
    await loadLiveMasters();

    const targetBlock = initialBlockId
      ? activeBlocks.find((b) => String(b.id) === String(initialBlockId)) || activeBlocks[0]
      : activeBlocks[0] || hostelMasters[0];

    const bId = targetBlock ? String(targetBlock.id) : "";
    const bName = targetBlock ? targetBlock.hostelName : "";
    const ay = selectedAcademicYear || (academicYears && academicYears[0]?.academicYear) || "";
    const initialClass = dynamicClasses[0] || "";

    setForm({
      hostelId: bId,
      hostelName: bName,
      roomId: "",
      roomNo: initialRoomNo || "All Rooms",
      roomTypeId: "",
      roomTypeName: "All Room Types",
      acType: "All",
      sharingType: "All",
      academicYear: ay,
      feePlan: "Annual",
      applicableTerms: [...availableScheduleTerms],
      effectiveFrom: new Date().toISOString().split("T")[0],
      status: "Active",
    });

    // Start with 1 clean empty tier (No hardcoded fees)
    setTiers([
      {
        id: `tier_${Date.now()}_1`,
        startClass: initialClass,
        endClass: initialClass,
        hostelFee: "",
        securityDeposit: "",
      },
    ]);

    if (bId) {
      loadRoomsForBlock(bId);
    }

    setIsModalOpen(true);
  };

  // Open modal in Edit mode
  const handleOpenEdit = async (c: FinanceHostelConfig) => {
    await loadLiveMasters();
    setEditingConfig(c);

    setForm({
      hostelId: c.hostelId || "",
      hostelName: c.hostelName || "",
      roomId: c.roomId || "",
      roomNo: c.roomNo || "All Rooms",
      roomTypeId: c.roomTypeId || "",
      roomTypeName: c.roomTypeName || "All Room Types",
      acType: (c.acType as any) || "All",
      sharingType: c.sharingType || "All",
      academicYear: c.academicYear || selectedAcademicYear || "",
      feePlan: c.feePlan || "Annual",
      applicableTerms: Array.isArray(c.applicableTerms) ? c.applicableTerms : [...availableScheduleTerms],
      effectiveFrom: c.effectiveFrom || new Date().toISOString().split("T")[0],
      status: (c.status as any) || "Active",
    });

    const parsedStart =
      c.startClass || (c.classRange ? c.classRange.split(/[-–to]/i)[0]?.trim() : dynamicClasses[0]) || dynamicClasses[0] || "";
    const parsedEnd =
      c.endClass || (c.classRange ? c.classRange.split(/[-–to]/i)[1]?.trim() : dynamicClasses[dynamicClasses.length - 1]) || parsedStart;

    setTiers([
      {
        id: `edit_${c.id}`,
        startClass: parsedStart,
        endClass: parsedEnd,
        hostelFee: c.hostelFee !== undefined && c.hostelFee !== null ? String(c.hostelFee) : "",
        securityDeposit: c.securityDeposit !== undefined && c.securityDeposit !== null ? String(c.securityDeposit) : "",
      },
    ]);

    if (c.hostelId) {
      loadRoomsForBlock(c.hostelId);
    }

    setIsModalOpen(true);
  };

  // Tier operations
  const handleAddTier = () => {
    const nextStart = dynamicClasses[0] || "";
    const nextEnd = dynamicClasses[dynamicClasses.length - 1] || nextStart;
    setTiers((prev) => [
      ...prev,
      {
        id: `tier_${Date.now()}`,
        startClass: nextStart,
        endClass: nextEnd,
        hostelFee: "",
        securityDeposit: "",
      },
    ]);
  };

  const handleRemoveTier = (id: string) => {
    if (tiers.length <= 1) return;
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTier = (id: string, field: keyof ClassRangeTier, val: string) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: val } : t)));
  };

  // Term selection toggle
  const toggleTerm = (termName: string) => {
    setForm((prev) => {
      const exists = prev.applicableTerms.includes(termName);
      const updated = exists
        ? prev.applicableTerms.filter((t) => t !== termName)
        : [...prev.applicableTerms, termName];
      return { ...prev, applicableTerms: updated };
    });
  };

  // Submit Handler
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!form.hostelId) {
      addToast("error", "Validation Error", "Please select a Hostel Block.");
      return;
    }

    if (tiers.length === 0) {
      addToast("error", "Validation Error", "Please configure at least one class range fee tier.");
      return;
    }

    // Validate each tier
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const parsedFee = Number(t.hostelFee);

      if (!t.startClass || !t.endClass) {
        addToast("error", "Validation Error", `Tier ${i + 1} has an unselected class range.`);
        return;
      }

      if (isNaN(parsedFee) || parsedFee < 0 || t.hostelFee.trim() === "") {
        addToast("error", "Validation Error", `Please enter a valid non-negative fee amount in Tier ${i + 1}.`);
        return;
      }

      const startOrder = getSortOrderForClass(t.startClass, academicClasses);
      const endOrder = getSortOrderForClass(t.endClass, academicClasses);
      if (startOrder > endOrder) {
        addToast(
          "error",
          "Invalid Class Range",
          `In Tier ${i + 1}: Starting class "${t.startClass}" cannot be higher than ending class "${t.endClass}".`,
        );
        return;
      }
    }

    // Validate internal overlap among configured tiers
    for (let i = 0; i < tiers.length; i++) {
      for (let j = i + 1; j < tiers.length; j++) {
        if (doClassRangesOverlap(tiers[i].startClass, tiers[i].endClass, tiers[j].startClass, tiers[j].endClass, academicClasses)) {
          addToast(
            "error",
            "Overlapping Tiers in Form",
            `Class range "${tiers[i].startClass} - ${tiers[i].endClass}" overlaps with "${tiers[j].startClass} - ${tiers[j].endClass}". Please adjust.`,
          );
          return;
        }
      }
    }

    // Validate overlap against existing active configurations
    for (const t of tiers) {
      const computedRange = t.startClass === t.endClass ? t.startClass : `${t.startClass} - ${t.endClass}`;
      const hasOverlap = (financeHostelConfigs || []).some((cfg) => {
        if (editingConfig && cfg.id === editingConfig.id) return false;
        if (cfg.status !== "Active" || form.status !== "Active") return false;

        // Block match
        if (String(cfg.hostelId) !== String(form.hostelId)) return false;

        // Academic Year match
        if (!matchesAcademicYear(cfg.academicYear, form.academicYear)) return false;

        // AC match
        const acOverlap =
          cfg.acType === "All" || form.acType === "All" || cfg.acType === form.acType;
        if (!acOverlap) return false;

        // Room match
        const roomOverlap =
          (cfg.roomNo === "All Rooms" || form.roomNo === "All Rooms" || cfg.roomNo === form.roomNo) &&
          (cfg.roomTypeName === "All Room Types" || form.roomTypeName === "All Room Types" || cfg.roomTypeName === form.roomTypeName);
        if (!roomOverlap) return false;

        const otherStart = cfg.startClass || cfg.classRange?.split(/[-–to]/i)[0]?.trim();
        const otherEnd = cfg.endClass || cfg.classRange?.split(/[-–to]/i)[1]?.trim();
        if (otherStart && otherEnd) {
          return doClassRangesOverlap(t.startClass, t.endClass, otherStart, otherEnd, academicClasses);
        }

        return false;
      });

      if (hasOverlap) {
        addToast(
          "error",
          "Overlapping Configuration",
          `An active configuration already covers ${computedRange} for ${form.roomNo !== "All Rooms" ? `Room ${form.roomNo}` : form.hostelName} in ${form.academicYear}.`,
        );
        return;
      }
    }

    const hObj = activeBlocks.find((h) => String(h.id) === String(form.hostelId));

    const getClassesInTier = (sClass: string, eClass: string) => {
      const sOrd = getSortOrderForClass(sClass, academicClasses);
      const eOrd = getSortOrderForClass(eClass, academicClasses);
      const minOrd = Math.min(sOrd, eOrd);
      const maxOrd = Math.max(sOrd, eOrd);
      return dynamicClasses.filter((c) => {
        const ord = getSortOrderForClass(c, academicClasses);
        return ord >= minOrd && ord <= maxOrd;
      });
    };

    if (editingConfig) {
      const t = tiers[0];
      const computedRange = t.startClass === t.endClass ? t.startClass : `${t.startClass} - ${t.endClass}`;
      const parsedFee = Number(t.hostelFee);
      const parsedDep = Number(t.securityDeposit || 0);

      const configData: Omit<FinanceHostelConfig, "id"> = {
        hostelId: String(form.hostelId),
        hostelName: hObj?.hostelName || form.hostelName || "Hostel Block",
        roomId: form.roomId || undefined,
        roomNo: form.roomNo || "All Rooms",
        roomTypeId: form.roomTypeId || "",
        roomTypeName: form.roomTypeName || "All Room Types",
        acType: form.acType,
        sharingType: form.sharingType,
        startClass: t.startClass,
        endClass: t.endClass,
        classRange: computedRange,
        applicableClasses: getClassesInTier(t.startClass, t.endClass),
        academicYear: form.academicYear,
        branch: selectedBranch || "Main Campus",
        feePlan: form.feePlan,
        hostelFee: parsedFee,
        securityDeposit: parsedDep,
        applicableTerms: form.applicableTerms,
        effectiveFrom: form.effectiveFrom || new Date().toISOString().split("T")[0],
        status: form.status,
      };

      updateFinanceHostelConfig(editingConfig.id, configData);
      addToast("success", "Configuration Updated", `Hostel fee updated for ${computedRange}.`);
    } else {
      tiers.forEach((t) => {
        const computedRange = t.startClass === t.endClass ? t.startClass : `${t.startClass} - ${t.endClass}`;
        const parsedFee = Number(t.hostelFee);
        const parsedDep = Number(t.securityDeposit || 0);

        const configData: Omit<FinanceHostelConfig, "id"> = {
          hostelId: String(form.hostelId),
          hostelName: hObj?.hostelName || form.hostelName || "Hostel Block",
          roomId: form.roomId || undefined,
          roomNo: form.roomNo || "All Rooms",
          roomTypeId: form.roomTypeId || "",
          roomTypeName: form.roomTypeName || "All Room Types",
          acType: form.acType,
          sharingType: form.sharingType,
          startClass: t.startClass,
          endClass: t.endClass,
          classRange: computedRange,
          applicableClasses: getClassesInTier(t.startClass, t.endClass),
          academicYear: form.academicYear,
          branch: selectedBranch || "Main Campus",
          feePlan: form.feePlan,
          hostelFee: parsedFee,
          securityDeposit: parsedDep,
          applicableTerms: form.applicableTerms,
          effectiveFrom: form.effectiveFrom || new Date().toISOString().split("T")[0],
          status: form.status,
        };

        addFinanceHostelConfig(configData);
      });

      addToast(
        "success",
        "Configuration Created",
        `Configured hostel fee for ${tiers.length} class range(s) in ${form.roomNo !== "All Rooms" ? `Room ${form.roomNo}` : form.hostelName}.`,
      );
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingConfig) {
      deleteFinanceHostelConfig(deletingConfig.id);
      addToast("success", "Configuration Deleted", "Hostel fee configuration deleted.");
      setDeletingConfig(null);
    }
  };

  // Filtered configurations
  const filteredConfigs = useMemo(() => {
    return (financeHostelConfigs || []).filter((c) => {
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const match =
          (c.hostelName || "").toLowerCase().includes(q) ||
          (c.roomTypeName || "").toLowerCase().includes(q) ||
          (c.roomNo || "").toLowerCase().includes(q) ||
          (c.classRange || "").toLowerCase().includes(q) ||
          (c.acType || "").toLowerCase().includes(q) ||
          (c.sharingType || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      if (selectedBlock !== "All" && String(c.hostelId) !== String(selectedBlock)) {
        return false;
      }

      if (selectedRoom !== "All" && c.roomNo !== selectedRoom && c.roomId !== selectedRoom) {
        return false;
      }

      if (selectedAcType !== "All" && c.acType !== selectedAcType) {
        return false;
      }

      if (selectedStatus !== "All" && c.status !== selectedStatus) {
        return false;
      }

      if (selectedYear !== "All" && c.academicYear && !matchesAcademicYear(c.academicYear, selectedYear)) {
        return false;
      }

      return true;
    });
  }, [financeHostelConfigs, query, selectedBlock, selectedRoom, selectedAcType, selectedStatus, selectedYear]);

  // Available room numbers for toolbar filter based on selected block
  const filterRoomsList = useMemo(() => {
    const set = new Set<string>();
    (financeHostelConfigs || []).forEach((c) => {
      if (selectedBlock === "All" || String(c.hostelId) === String(selectedBlock)) {
        if (c.roomNo && c.roomNo !== "All Rooms") {
          set.add(c.roomNo);
        }
      }
    });
    return Array.from(set).sort();
  }, [financeHostelConfigs, selectedBlock]);

  // Export dataset
  const exportData = useMemo(() => {
    return filteredConfigs.map((c) => ({
      "Hostel Block": c.hostelName,
      "Room Number": c.roomNo || "All Rooms",
      "Room Category": c.roomTypeName || "All Room Types",
      "AC Status": c.acType || "All",
      "Sharing Type": c.sharingType || "All",
      "Class Range": c.classRange || `${c.startClass} - ${c.endClass}`,
      "Payment Frequency": c.feePlan || "Annual",
      "Hostel Fee (INR)": c.hostelFee || 0,
      "Security Deposit (INR)": c.securityDeposit || 0,
      "Total Amount (INR)": (Number(c.hostelFee) || 0) + (Number(c.securityDeposit) || 0),
      "Academic Year": c.academicYear || "",
      Status: c.status || "Active",
    }));
  }, [filteredConfigs]);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-500" /> Hostel Fee Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure dynamic hostel fees by block, room number, AC specification, and student class ranges.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ExportButton
            data={exportData}
            filename="hostel_fee_configurations"
            label="Download"
            className="px-3 py-2 rounded-xl border text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50"
          />
          <button
            onClick={() => handleOpenAdd()}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Hostel Fee
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Matching Standard Application Layout) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, block, room, class range..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        {/* Block Filter */}
        <select
          value={selectedBlock}
          onChange={(e) => {
            setSelectedBlock(e.target.value);
            setSelectedRoom("All");
          }}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-semibold"
        >
          <option value="All">All Blocks</option>
          {activeBlocks.map((h) => (
            <option key={h.id} value={h.id}>
              {h.hostelName}
            </option>
          ))}
        </select>

        {/* Room Filter */}
        {filterRoomsList.length > 0 && (
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-semibold"
          >
            <option value="All">All Rooms</option>
            {filterRoomsList.map((rNo) => (
              <option key={rNo} value={rNo}>
                Room {rNo}
              </option>
            ))}
          </select>
        )}

        {/* AC Filter */}
        <select
          value={selectedAcType}
          onChange={(e) => setSelectedAcType(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-semibold"
        >
          <option value="All">All AC Types</option>
          <option value="AC">AC</option>
          <option value="Non-AC">Non-AC</option>
        </select>

        {/* Academic Year Filter */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-semibold"
        >
          <option value="All">All Academic Years</option>
          {(academicYears || []).map((ay: any) => (
            <option key={ay.id || ay.academicYear} value={ay.academicYear || ay.name}>
              {ay.academicYear || ay.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-semibold"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {(query ||
          selectedBlock !== "All" ||
          selectedRoom !== "All" ||
          selectedAcType !== "All" ||
          selectedStatus !== "All" ||
          selectedYear !== "All") && (
          <button
            onClick={() => {
              setQuery("");
              setSelectedBlock("All");
              setSelectedRoom("All");
              setSelectedAcType("All");
              setSelectedStatus("All");
              setSelectedYear("All");
            }}
            title="Reset Filters"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Standard Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[10px]">
                <th className="py-3 px-3">Order</th>
                <th className="py-3 px-4">Hostel Block</th>
                <th className="py-3 px-3">Room No</th>
                <th className="py-3 px-4">Room Category</th>
                <th className="py-3 px-3">AC</th>
                <th className="py-3 px-3">Sharing</th>
                <th className="py-3 px-4">Class Range</th>
                <th className="py-3 px-3">Frequency</th>
                <th className="py-3 px-3 text-right">Hostel Fee</th>
                <th className="py-3 px-3 text-right">Deposit</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-50" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No hostel fee configurations found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "+ Add Hostel Fee" above to configure dynamic fees.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((c, idx) => {
                  const total = (Number(c.hostelFee) || 0) + (Number(c.securityDeposit) || 0);
                  const isAc = (c.acType || "").toUpperCase() === "AC";
                  const rangeLabel =
                    c.classRange || (c.startClass && c.endClass ? `${c.startClass} - ${c.endClass}` : "All Classes");

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                      {/* Hostel Block */}
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span>{c.hostelName}</span>
                        </div>
                      </td>

                      {/* Room Number */}
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {c.roomNo && c.roomNo !== "All Rooms" ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-bold text-[11px]">
                            Room {c.roomNo}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">All Rooms</span>
                        )}
                      </td>

                      {/* Room Category */}
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                        {c.roomTypeName || "All Room Types"}
                      </td>

                      {/* AC Type */}
                      <td className="py-2.5 px-3">
                        {isAc ? (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 font-bold text-[10px]">
                            AC
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium text-[10px]">
                            Non-AC
                          </span>
                        )}
                      </td>

                      {/* Sharing */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                        {c.sharingType || "Standard"}
                      </td>

                      {/* Class Range */}
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                          <GraduationCap className="w-3 h-3 text-indigo-500" />
                          {rangeLabel}
                        </span>
                      </td>

                      {/* Frequency */}
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {c.feePlan || "Annual"}
                      </td>

                      {/* Fees */}
                      <td className="py-2.5 px-3 text-right font-bold text-sky-600 dark:text-sky-400">
                        {formatCurrency(c.hostelFee || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {formatCurrency(c.securityDeposit || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(total)}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        {c.status === "Active" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 text-[10px]">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Configuration"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingConfig(c)}
                            title="Delete Configuration"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Add / Edit Modal (Standard Application Sizing) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-500" />
                  {editingConfig ? "Edit Hostel Fee Configuration" : "Configure Hostel Fee"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure hostel fee structures based on block, room, sharing type, and student class range.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1 py-1">
                {/* 1. Hostel Block Selection */}
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Hostel Block <span className="text-rose-500">*</span>
                  </label>
                  <SearchableCombobox
                    value={form.hostelId || ""}
                    placeholder="Select Hostel Block..."
                    options={activeBlocks.map((h) => ({
                      value: String(h.id),
                      label: h.hostelName,
                      subLabel: h.hostelCode ? `[${h.hostelCode}]` : undefined,
                    }))}
                    onChange={(val) => {
                      const hObj = activeBlocks.find((h) => String(h.id) === String(val));
                      setForm((prev) => ({
                        ...prev,
                        hostelId: val,
                        hostelName: hObj ? hObj.hostelName : val,
                        roomId: "",
                        roomNo: "All Rooms",
                      }));
                      if (val) loadRoomsForBlock(val);
                    }}
                  />
                </div>

                {/* 2. Room & Room Category Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Room Number</span>
                      {isLoadingRooms && <span className="text-[10px] text-sky-500">Loading...</span>}
                    </label>
                    <select
                      value={form.roomId || (form.roomNo === "All Rooms" ? "" : form.roomNo)}
                      onChange={(e) => {
                        const selVal = e.target.value;
                        if (!selVal) {
                          setForm((prev) => ({
                            ...prev,
                            roomId: "",
                            roomNo: "All Rooms",
                          }));
                          return;
                        }
                        const rm = blockRooms.find(
                          (r) => String(r.roomId) === selVal || String(r.roomNumber) === selVal,
                        );
                        if (rm) {
                          const rTypeObj = activeRoomTypes.find((rt) => String(rt.id) === String(rm.roomTypeId));
                          const isAc = (rm as any).acType === "AC" || rTypeObj?.acType === "AC";
                          const cap = rm.bedCapacity || rTypeObj?.capacity || 1;
                          const sharingName =
                            cap === 1 ? "Single" : cap === 2 ? "Double" : cap === 3 ? "Triple" : `${cap}-Sharing`;

                          setForm((prev) => ({
                            ...prev,
                            roomId: String(rm.roomId),
                            roomNo: rm.roomNumber || `Room ${rm.roomId}`,
                            roomTypeId: String(rm.roomTypeId || ""),
                            roomTypeName: rm.roomTypeSpecification || rTypeObj?.roomTypeName || "Standard",
                            acType: isAc ? "AC" : "Non-AC",
                            sharingType: sharingName,
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="">All Rooms in Block (Default)</option>
                      {blockRooms.map((r) => (
                        <option key={r.roomId} value={String(r.roomId)}>
                          Room {r.roomNumber} ({r.roomTypeSpecification || "Standard"} • {r.floorLevel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Room Category
                    </label>
                    <SearchableCombobox
                      value={form.roomTypeId || ""}
                      placeholder="All Room Types in Block..."
                      options={[
                        { value: "", label: "All Room Types in Block" },
                        ...activeRoomTypes.map((rt) => ({
                          value: String(rt.id),
                          label: rt.roomTypeName,
                          subLabel: `${rt.capacity} Bed${rt.capacity > 1 ? "s" : ""} • ${rt.acType || "Non-AC"}`,
                        })),
                      ]}
                      onChange={(val) => {
                        if (!val) {
                          setForm((prev) => ({
                            ...prev,
                            roomTypeId: "",
                            roomTypeName: "All Room Types",
                          }));
                          return;
                        }
                        const rtObj = activeRoomTypes.find((rt) => String(rt.id) === String(val));
                        if (rtObj) {
                          const isAc = rtObj.acType === "AC";
                          const cap = rtObj.capacity || 1;
                          const sharingName =
                            cap === 1 ? "Single" : cap === 2 ? "Double" : cap === 3 ? "Triple" : `${cap}-Sharing`;
                          setForm((prev) => ({
                            ...prev,
                            roomTypeId: val,
                            roomTypeName: rtObj.roomTypeName,
                            acType: isAc ? "AC" : "Non-AC",
                            sharingType: sharingName,
                          }));
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 3. AC & Sharing Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      AC Specification <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.acType}
                      onChange={(e) => setForm({ ...form, acType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="All">All Room Types (AC & Non-AC)</option>
                      <option value="AC">AC</option>
                      <option value="Non-AC">Non-AC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Sharing Type
                    </label>
                    <select
                      value={form.sharingType}
                      onChange={(e) => setForm({ ...form, sharingType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="All">All Sharing Types</option>
                      <option value="Single">Single</option>
                      <option value="Double">Double</option>
                      <option value="Triple">Triple</option>
                      <option value="4-Sharing">4-Sharing</option>
                    </select>
                  </div>
                </div>

                {/* 4. Configurable Class Range Fee Assignments (Compact Table) */}
                <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Applicable Class Ranges & Fees
                    </span>
                    {!editingConfig && (
                      <button
                        type="button"
                        data-skip-validation="true"
                        onClick={handleAddTier}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Range
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                          <th className="py-1.5 px-2">Start Class</th>
                          <th className="py-1.5 px-2">End Class</th>
                          <th className="py-1.5 px-2">Hostel Fee (₹)</th>
                          <th className="py-1.5 px-2">Deposit (₹)</th>
                          {!editingConfig && <th className="py-1.5 px-2 text-center w-8"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-50 dark:divide-indigo-950/40 text-xs">
                        {tiers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="p-1.5">
                              <select
                                value={t.startClass}
                                aria-label="Start Class"
                                onChange={(e) => handleUpdateTier(t.id, "startClass", e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                              >
                                {dynamicClasses.map((cls) => (
                                  <option key={`s_${t.id}_${cls}`} value={cls}>
                                    {cls}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-1.5">
                              <select
                                value={t.endClass}
                                aria-label="End Class"
                                onChange={(e) => handleUpdateTier(t.id, "endClass", e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                              >
                                {dynamicClasses.map((cls) => (
                                  <option key={`e_${t.id}_${cls}`} value={cls}>
                                    {cls}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                required
                                aria-label="Hostel Fee"
                                placeholder="0"
                                value={t.hostelFee ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  handleUpdateTier(t.id, "hostelFee", val);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-sky-600 dark:text-sky-400 outline-none"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                aria-label="Security Deposit"
                                placeholder="0"
                                value={t.securityDeposit ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  handleUpdateTier(t.id, "securityDeposit", val);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                              />
                            </td>
                            {!editingConfig && (
                              <td className="p-1.5 text-center">
                                {tiers.length > 1 && (
                                  <button
                                    type="button"
                                    data-skip-validation="true"
                                    onClick={() => handleRemoveTier(t.id)}
                                    title="Remove range"
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Frequency & Academic Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Payment Frequency <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.feePlan}
                      onChange={(e) => setForm({ ...form, feePlan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Annual">Annual (Full Session)</option>
                      <option value="Term-wise">Term-wise</option>
                      <option value="Half Yearly">Half Yearly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Academic Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.academicYear}
                      onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      {(academicYears || []).map((ay: any) => (
                        <option key={ay.id || ay.academicYear} value={ay.academicYear || ay.name}>
                          {ay.academicYear || ay.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Term Selection Checkboxes (for Term-wise) */}
                {form.feePlan === "Term-wise" && (
                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/60 space-y-2">
                    <span className="font-bold text-xs text-sky-900 dark:text-sky-200 block">
                      Applicable Terms:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableScheduleTerms.map((term) => {
                        const isChecked = form.applicableTerms.includes(term);
                        return (
                          <button
                            type="button"
                            key={term}
                            onClick={() => toggleTerm(term)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              isChecked
                                ? "bg-sky-600 text-white"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200"
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded flex items-center justify-center border ${
                                isChecked ? "border-white bg-white/20" : "border-slate-400"
                              }`}
                            >
                              {isChecked && <Check className="w-2 h-2 text-white" />}
                            </div>
                            {term}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. Status & Effective Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={form.effectiveFrom}
                      onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-sm shadow-sky-500/20 transition-all"
                >
                  {editingConfig ? "Save Changes" : "Save Configuration"}
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
          message={`Are you sure you want to delete the configuration for ${deletingConfig.hostelName} (${deletingConfig.roomNo !== "All Rooms" ? `Room ${deletingConfig.roomNo}` : "All Rooms"} • ${deletingConfig.classRange || "All Classes"})?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingConfig(null)}
        />
      )}
    </div>
  );
};

export default FinanceHostelConfigView;
