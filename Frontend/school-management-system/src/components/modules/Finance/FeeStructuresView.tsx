import React, { useState, useMemo } from "react";
import { formatCurrency } from "../../../utils/currency";
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  Calculator,
  CheckCircle,
  Building2,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  Tag,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  DynamicFeeStructure,
  FeeStructureItem,
  FeePaymentEligibility,
  HostelConfigItem,
  HostelFeeCategoryConfig,
} from "../../../types";
import { useData } from "../../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { ExportButton } from "../../common/ExportButton";
import { ConfirmModal } from "../../common/ConfirmModal";
import { compareClassesAscending } from "../../../utils/classSorter";
import { getUniformFeeForClass } from "../../../utils/uniformUtils";

export const FeeStructuresView: React.FC = () => {
  const {
    feeHeads,
    dynamicFeeStructures,
    addDynamicFeeStructure,
    updateDynamicFeeStructure,
    deleteDynamicFeeStructure,
    academicClasses,
    financeUniformConfigs,
    hostelMasters,
    hostelBlocks,
    hostelRooms,
    academicYearFeeSchedules,
    academicYears,
    branches,
  } = useData();
  const { selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Tuition" | "Hostel">("All");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState<DynamicFeeStructure | null>(null);
  const [deletingStruct, setDeletingStruct] = useState<DynamicFeeStructure | null>(null);

  // Modal Category Choice
  const [modalCategory, setModalCategory] = useState<"Tuition" | "Hostel">("Tuition");

  // Tuition Form State
  const [className, setClassName] = useState("");
  const [selectedHeadIds, setSelectedHeadIds] = useState<string[]>([]);
  const [selectedHeadAmounts, setSelectedHeadAmounts] = useState<Record<string, string>>({});
  const [isLoadingFeeTypes, setIsLoadingFeeTypes] = useState(false);

  // Hostel Form State
  const [hostelAcademicYear, setHostelAcademicYear] = useState<string>("");
  const [hostelFeeHeadId, setHostelFeeHeadId] = useState<string>("");
  const [hostelId, setHostelId] = useState<string>("");
  const [hostelName, setHostelName] = useState<string>("");
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [blockConfigState, setBlockConfigState] = useState<Record<string, { selected: boolean; amount: number }>>({});
  const [blockNonAcAllState, setBlockNonAcAllState] = useState<Record<string, boolean>>({});
  const [blockNonAcAllAmountState, setBlockNonAcAllAmountState] = useState<Record<string, number>>({});
  const [paymentEligibility, setPaymentEligibility] = useState<FeePaymentEligibility>("Both One-Time and Term-Wise");
  const [applicableTerms, setApplicableTerms] = useState<string[]>([]);
  const [effectiveDate, setEffectiveDate] = useState<string>("");
  const [hostelStatus, setHostelStatus] = useState<"Active" | "Inactive">("Active");

  const activeFeeHeads = useMemo(() => feeHeads.filter((h) => h.status === "Active"), [feeHeads]);

  // Available Academic Terms for active year
  const availableAcademicTerms = useMemo(() => {
    const activeAY = hostelAcademicYear || selectedAcademicYear || (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) || "";
    const schedule = (academicYearFeeSchedules || []).find((s) => s.academicYear === activeAY);
    if (schedule && schedule.terms && schedule.terms.length > 0) {
      return [...schedule.terms].sort((a, b) => a.sequence - b.sequence).map((t) => t.termName || t.id);
    }
    const anyScheduleWithTerms = (academicYearFeeSchedules || []).find((s) => s.terms && s.terms.length > 0);
    if (anyScheduleWithTerms) {
      return [...anyScheduleWithTerms.terms].sort((a, b) => a.sequence - b.sequence).map((t) => t.termName || t.id);
    }
    return [];
  }, [academicYearFeeSchedules, selectedAcademicYear, hostelAcademicYear, academicYears]);

  // Extract unique Hostels dynamically
  const availableHostelList = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    if (hostelMasters && Array.isArray(hostelMasters) && hostelMasters.length > 0) {
      hostelMasters.forEach((h: any) => {
        const name = h.name || h.hostelName;
        if (name && !list.some((item) => item.name === name)) {
          list.push({ id: String(h.id), name });
        }
      });
    }
    if (hostelBlocks && Array.isArray(hostelBlocks) && hostelBlocks.length > 0) {
      hostelBlocks.forEach((b: any) => {
        const name = b.hostelName || b.hostel;
        if (name && !list.some((item) => item.name === name)) {
          list.push({ id: String(b.hostelId || b.id), name });
        }
      });
    }
    return list;
  }, [hostelMasters, hostelBlocks]);

  // Extract available blocks for selected hostel
  const availableBlocksForSelectedHostel = useMemo(() => {
    if (!hostelName && !hostelId) return [];
    if (hostelBlocks && Array.isArray(hostelBlocks) && hostelBlocks.length > 0) {
      const filtered = hostelBlocks.filter((b: any) => {
        const bHostelName = b.hostelName || b.hostel || "";
        const bHostelId = String(b.hostelId || "");
        return (
          (hostelId && bHostelId === String(hostelId)) ||
          (hostelName && bHostelName.toLowerCase() === hostelName.toLowerCase())
        );
      });
      if (filtered.length > 0) {
        return filtered.map((b: any) => ({
          id: String(b.id || b.blockId),
          name: b.name || b.blockName || `Block ${b.id}`,
        }));
      }
    }
    return [];
  }, [hostelBlocks, hostelId, hostelName]);

  // Room Configurations helper for each block
  const getBlockRoomConfigurations = (blockId: string, blockName: string) => {
    const blockRooms = (hostelRooms || []).filter(
      (r: any) =>
        String(r.blockId || r.hostelId) === String(blockId) ||
        (r.blockName && r.blockName.toLowerCase() === blockName.toLowerCase())
    );

    const acSharingOptions = [
      { sharingType: "2-bed sharing", label: "AC 2-Bed Sharing" },
      { sharingType: "3-bed sharing", label: "AC 3-Bed Sharing" },
      { sharingType: "4-bed sharing", label: "AC 4-Bed Sharing" },
      { sharingType: "Single Occupancy", label: "AC Single Occupancy" },
    ];

    const nonAcSharingOptions = [
      { sharingType: "2-bed sharing", label: "Non-AC 2-Bed Sharing" },
      { sharingType: "3-bed sharing", label: "Non-AC 3-Bed Sharing" },
      { sharingType: "4-bed sharing", label: "Non-AC 4-Bed Sharing" },
      { sharingType: "Dormitory", label: "Non-AC Dormitory" },
    ];

    const getRoomCount = (acType: "AC" | "Non-AC", sharingType: string) => {
      if (!blockRooms || blockRooms.length === 0) return 0;
      const count = blockRooms.filter((r: any) => {
        const isAc =
          r.acType === "AC" ||
          r.isAc === true ||
          (r.roomType &&
            String(r.roomType).toUpperCase().includes("AC") &&
            !String(r.roomType).toUpperCase().includes("NON"));
        const matchesAc = acType === "AC" ? isAc : !isAc;
        const capStr = r.capacity ? `${r.capacity}-bed sharing` : r.sharingType || "";
        const matchesSharing =
          capStr.toLowerCase().includes(sharingType.toLowerCase().replace(" sharing", "")) ||
          sharingType.toLowerCase().includes(r.capacity ? String(r.capacity) : "");
        return matchesAc && matchesSharing;
      }).length;
      return count;
    };

    const totalNonAcRoomCount =
      (blockRooms || []).filter((r: any) => {
        const isAc =
          r.acType === "AC" ||
          r.isAc === true ||
          (r.roomType &&
            String(r.roomType).toUpperCase().includes("AC") &&
            !String(r.roomType).toUpperCase().includes("NON"));
        return !isAc;
      }).length;

    return {
      acSharingOptions: acSharingOptions.map((opt) => ({
        ...opt,
        matchingRoomCount: getRoomCount("AC", opt.sharingType),
      })),
      nonAcSharingOptions: nonAcSharingOptions.map((opt) => ({
        ...opt,
        matchingRoomCount: getRoomCount("Non-AC", opt.sharingType),
      })),
      totalNonAcRoomCount,
    };
  };

  const updateBlockConfigState = (key: string, updates: Partial<{ selected: boolean; amount: number }>) => {
    setBlockConfigState((prev) => ({
      ...prev,
      [key]: {
        selected: updates.selected !== undefined ? updates.selected : prev[key]?.selected || false,
        amount: updates.amount !== undefined ? updates.amount : prev[key]?.amount || 0,
      },
    }));
  };

  const updateBlockNonAcAllState = (bId: string, applyAll: boolean) => {
    setBlockNonAcAllState((prev) => ({
      ...prev,
      [bId]: applyAll,
    }));
  };

  const updateBlockNonAcAllAmountState = (bId: string, amount: number) => {
    setBlockNonAcAllAmountState((prev) => ({
      ...prev,
      [bId]: amount,
    }));
  };

  // Total calculated fee for Tuition
  const totalTuitionCalculated = selectedHeadIds.reduce((sum, id) => {
    const val = Number(selectedHeadAmounts[id]) || 0;
    return sum + val;
  }, 0);

  // Deduplicate and separate structures
  const dedupedStructures = useMemo(() => {
    const map = new Map<string, DynamicFeeStructure>();
    for (const s of dynamicFeeStructures) {
      const isHostel = s.category === "Hostel" || s.feeCategory === "Hostel";
      const key = isHostel
        ? `hostel_${(s.hostelName || s.className || "").trim().toLowerCase()}_${(s.academicYear || "").trim().toLowerCase()}_${(s.branch || "").trim().toLowerCase()}`
        : `tuition_${(s.className || "").trim().toLowerCase()}_${(s.academicYear || "").trim().toLowerCase()}_${(s.branch || "").trim().toLowerCase()}`;

      if (!map.has(key) || (s.items && s.items.length > (map.get(key)!.items?.length || 0))) {
        map.set(key, s);
      }
    }
    return Array.from(map.values());
  }, [dynamicFeeStructures]);

  // Filtered Structures
  const filteredStructures = useMemo(() => {
    return dedupedStructures
      .filter((s) => {
        const matchesYear =
          !selectedAcademicYear || !s.academicYear || s.academicYear === selectedAcademicYear;

        const isHostel = s.category === "Hostel" || s.feeCategory === "Hostel";

        // Category filter
        if (categoryFilter === "Tuition" && isHostel) return false;
        if (categoryFilter === "Hostel" && !isHostel) return false;

        // Class filter (only applies to Tuition)
        if (!isHostel && selectedClassFilter !== "All" && s.className !== selectedClassFilter) {
          return false;
        }

        // Query search
        if (query.trim()) {
          const q = query.toLowerCase();
          const matchClass = (s.className || "").toLowerCase().includes(q);
          const matchHostel = (s.hostelName || "").toLowerCase().includes(q);
          const matchBlocks = (s.selectedBlockNames || []).some((b) => b.toLowerCase().includes(q));
          const matchItems = (s.items || []).some((i) => i.feeHeadName.toLowerCase().includes(q));
          if (!matchClass && !matchHostel && !matchBlocks && !matchItems) return false;
        }

        return matchesYear;
      })
      .sort((a, b) => {
        const aIsHostel = a.category === "Hostel" || a.feeCategory === "Hostel";
        const bIsHostel = b.category === "Hostel" || b.feeCategory === "Hostel";
        if (aIsHostel && !bIsHostel) return 1;
        if (!aIsHostel && bIsHostel) return -1;
        return compareClassesAscending(a.className, b.className);
      });
  }, [dedupedStructures, selectedAcademicYear, categoryFilter, selectedClassFilter, query]);

  // Sorted Academic Classes for filter
  const sortedClassesForFilter = useMemo(
    () => [...academicClasses].sort((a, b) => compareClassesAscending(a.name, b.name)),
    [academicClasses]
  );

  // Available classes for Tuition modal (exclude classes already configured)
  const existingFeeStructClasses = useMemo(() => {
    return dedupedStructures
      .filter(
        (s) =>
          s.category !== "Hostel" &&
          s.feeCategory !== "Hostel" &&
          (!editingStruct || String(s.id) !== String(editingStruct.id)) &&
          (!selectedAcademicYear || !s.academicYear || s.academicYear === selectedAcademicYear)
      )
      .map((s) => (s.className || "").trim().toLowerCase());
  }, [dedupedStructures, editingStruct, selectedAcademicYear]);

  const availableClassesForModal = useMemo(
    () =>
      academicClasses
        .filter((c) => !existingFeeStructClasses.includes(c.name.trim().toLowerCase()))
        .sort((a, b) => compareClassesAscending(a.name, b.name)),
    [academicClasses, existingFeeStructClasses]
  );

  // Reset & Open Add Modal
  const handleOpenAdd = () => {
    setEditingStruct(null);
    setModalCategory("Tuition");

    // Reset Tuition
    setClassName("");
    setSelectedHeadIds([]);
    setSelectedHeadAmounts({});
    setIsLoadingFeeTypes(false);

    // Reset Hostel
    const defaultHostel = availableHostelList[0];
    const hostelHead = feeHeads.find((h) => h.category === "Hostel") || activeFeeHeads[0];
    setHostelAcademicYear(selectedAcademicYear || (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) || "");
    setHostelFeeHeadId(hostelHead ? hostelHead.id : "");
    setHostelId(defaultHostel ? defaultHostel.id : "");
    setHostelName(defaultHostel ? defaultHostel.name : "");
    setSelectedBlockIds([]);
    setBlockConfigState({});
    setBlockNonAcAllState({});
    setBlockNonAcAllAmountState({});
    setPaymentEligibility("Both One-Time and Term-Wise");
    setApplicableTerms([...availableAcademicTerms]);
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setHostelStatus("Active");

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (s: DynamicFeeStructure) => {
    setEditingStruct(s);
    const isHostel = s.category === "Hostel" || s.feeCategory === "Hostel";

    if (isHostel) {
      setModalCategory("Hostel");
      setHostelAcademicYear(s.academicYear || selectedAcademicYear || (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) || "");
      setHostelFeeHeadId(s.feeHeadId || (feeHeads.find((h) => h.category === "Hostel")?.id || ""));
      setHostelId(String(s.hostelId || ""));
      setHostelName(s.hostelName || "");
      setSelectedBlockIds(s.selectedBlockIds ? s.selectedBlockIds.map(String) : []);
      setPaymentEligibility(s.paymentEligibility || "Both One-Time and Term-Wise");
      setApplicableTerms(s.applicableTerms && s.applicableTerms.length > 0 ? [...s.applicableTerms] : [...availableAcademicTerms]);
      setEffectiveDate(s.effectiveDate || new Date().toISOString().split("T")[0]);
      setHostelStatus(s.status || "Active");

      // Parse existing configurations
      const config: HostelFeeCategoryConfig =
        s.hostelConfig ||
        (typeof s.hostelConfigJson === "string" ? JSON.parse(s.hostelConfigJson) : s.hostelConfigJson);

      if (config && config.configurations) {
        const newBlockConfigState: Record<string, { selected: boolean; amount: number }> = {};
        const newNonAcAllState: Record<string, boolean> = {};
        const newNonAcAllAmountState: Record<string, number> = {};

        config.configurations.forEach((item) => {
          const bId = String(item.blockId);
          if (item.acType === "Non-AC" && item.applyToAllNonAc) {
            newNonAcAllState[bId] = true;
            newNonAcAllAmountState[bId] = item.amount;
          } else {
            const key = `${bId}_${item.acType === "AC" ? "AC" : "NonAC"}_${item.sharingType}`;
            newBlockConfigState[key] = { selected: true, amount: item.amount };
            if (item.acType === "Non-AC") {
              newNonAcAllState[bId] = false;
            }
          }
        });

        setBlockConfigState(newBlockConfigState);
        setBlockNonAcAllState(newNonAcAllState);
        setBlockNonAcAllAmountState(newNonAcAllAmountState);
      } else {
        setBlockConfigState({});
        setBlockNonAcAllState({});
        setBlockNonAcAllAmountState({});
      }
    } else {
      setModalCategory("Tuition");
      setClassName(s.className);
      const ids: string[] = [];
      const amounts: Record<string, string> = {};
      (s.items || []).forEach((item) => {
        const exists = feeHeads.some(
          (h) => h.id === item.feeHeadId || h.name.toLowerCase() === item.feeHeadName.toLowerCase()
        );
        if (exists && item.feeHeadName !== "Fee Head") {
          const head = feeHeads.find(
            (h) => h.id === item.feeHeadId || h.name.toLowerCase() === item.feeHeadName.toLowerCase()
          );
          const realId = head ? head.id : item.feeHeadId;
          ids.push(realId);
          amounts[realId] = String(item.amount);
        }
      });
      setSelectedHeadIds(ids);
      setSelectedHeadAmounts(amounts);
      setIsLoadingFeeTypes(false);
    }

    setIsModalOpen(true);
  };

  // Tuition Class Change
  const handleClassChange = (newClass: string) => {
    setClassName(newClass);
    if (newClass) {
      setIsLoadingFeeTypes(true);
      const uniFee = getUniformFeeForClass(newClass, "", financeUniformConfigs);
      const uniHead = activeFeeHeads.find(
        (h) =>
          (h.name || "").toLowerCase().includes("uniform") ||
          (h.name || "").toLowerCase().includes("package") ||
          h.id === "FH-04"
      );

      const initialHeadIds: string[] = [];
      const initialAmounts: Record<string, string> = {};

      if (uniHead) {
        initialHeadIds.push(uniHead.id);
        if (uniFee && uniFee > 0) {
          initialAmounts[uniHead.id] = String(uniFee);
        }
      }

      // Auto-select mandatory heads
      activeFeeHeads.forEach((h) => {
        if (h.mandatory !== false && !initialHeadIds.includes(h.id)) {
          initialHeadIds.push(h.id);
        }
      });

      setSelectedHeadIds(initialHeadIds);
      setSelectedHeadAmounts(initialAmounts);

      setTimeout(() => {
        setIsLoadingFeeTypes(false);
      }, 200);
    } else {
      setSelectedHeadIds([]);
      setSelectedHeadAmounts({});
      setIsLoadingFeeTypes(false);
    }
  };

  const handleToggleHead = (headId: string) => {
    if (selectedHeadIds.includes(headId)) {
      setSelectedHeadIds((prev) => prev.filter((id) => id !== headId));
      setSelectedHeadAmounts((prev) => {
        const copy = { ...prev };
        delete copy[headId];
        return copy;
      });
    } else {
      setSelectedHeadIds((prev) => [...prev, headId]);
      const headObj = activeFeeHeads.find((h) => h.id === headId);
      const isUniform =
        headObj &&
        ((headObj.name || "").toLowerCase().includes("uniform") ||
          (headObj.name || "").toLowerCase().includes("package") ||
          headId === "FH-04");
      const uniFee = isUniform && className ? getUniformFeeForClass(className, "", financeUniformConfigs) : 0;
      setSelectedHeadAmounts((prev) => ({
        ...prev,
        [headId]: uniFee && uniFee > 0 ? String(uniFee) : prev[headId] || "",
      }));
    }
  };

  const handleAmountChange = (headId: string, valStr: string) => {
    if (valStr === "" || /^\d*\.?\d*$/.test(valStr)) {
      setSelectedHeadAmounts((prev) => ({
        ...prev,
        [headId]: valStr,
      }));
    }
  };

  // Handle Form Submit
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (modalCategory === "Tuition") {
      if (!className) {
        addToast("warning", "Validation Error", "Please select a Class Grade.");
        return;
      }
      if (selectedHeadIds.length === 0) {
        addToast("warning", "Validation Error", "Please select at least one master fee type.");
        return;
      }

      for (const headId of selectedHeadIds) {
        const head = feeHeads.find((h) => h.id === headId);
        const headName = head ? head.name : "Fee Type";
        const amtStr = (selectedHeadAmounts[headId] || "").trim();

        if (amtStr === "" || isNaN(Number(amtStr)) || Number(amtStr) <= 0) {
          addToast("warning", "Validation Error", `Please enter a valid amount greater than 0 for ${headName}.`);
          return;
        }
      }

      const itemsList: FeeStructureItem[] = selectedHeadIds
        .map((headId) => {
          const head = feeHeads.find((h) => h.id === headId);
          if (!head) return null;
          return {
            feeHeadId: headId,
            feeHeadName: head.name,
            category: head.category,
            amount: Number(selectedHeadAmounts[headId]),
            paymentEligibility: head.paymentEligibility,
            applicableTerms: head.applicableTerms,
          };
        })
        .filter(Boolean) as FeeStructureItem[];

    const payload: Omit<DynamicFeeStructure, "id"> = {
      academicYear: editingStruct
        ? editingStruct.academicYear
        : selectedAcademicYear || "2026-2027",
      branch: editingStruct
        ? editingStruct.branch
        : selectedBranch || "Main Campus",
      className,
      section: "A",
      studentCategory: "General",
      items: itemsList,
      totalAmount: totalCalculated,
      status: "Active",
    };

      if (editingStruct) {
        updateDynamicFeeStructure(editingStruct.id, payload);
        addToast("success", "Fee Structure Updated", `Updated structure for ${className}`);
      } else {
        addDynamicFeeStructure(payload);
        addToast("success", "Fee Structure Configured", `Configured structure for ${className}`);
      }
      setIsModalOpen(false);
    } else {
      // HOSTEL FEE STRUCTURE SUBMIT
      if (!hostelName) {
        addToast("warning", "Validation Error", "Please select a Hostel facility.");
        return;
      }
      if (selectedBlockIds.length === 0) {
        addToast("warning", "Validation Error", "Please select at least one Block for the hostel.");
        return;
      }
      if (paymentEligibility === "Term-Wise Allowed" && applicableTerms.length === 0) {
        addToast("warning", "Validation Error", "Please select at least one applicable term for Term-Wise payment.");
        return;
      }

      const selectedBlockNames = selectedBlockIds.map((bId) => {
        const bObj = availableBlocksForSelectedHostel.find((b) => String(b.id) === bId);
        return bObj ? bObj.name : `Block ${bId}`;
      });

      // Conflict detection: Check for existing active structures for the same hostel and overlapping block
      const existingHostelConflict = dynamicFeeStructures.find((s) => {
        if (editingStruct && String(s.id) === String(editingStruct.id)) return false;
        if (s.category !== "Hostel" && s.feeCategory !== "Hostel") return false;
        if (s.status === "Inactive") return false;
        if (
          s.academicYear &&
          hostelAcademicYear &&
          s.academicYear.toLowerCase().trim() !== hostelAcademicYear.toLowerCase().trim()
        ) {
          return false;
        }

        const sameHostel =
          String(s.hostelId || s.hostelName) === String(hostelId || hostelName) ||
          (s.hostelName && hostelName && s.hostelName.toLowerCase() === hostelName.toLowerCase());

        if (!sameHostel) return false;

        const hasOverlappingBlock =
          (s.selectedBlockIds || []).some((bId) => selectedBlockIds.includes(String(bId))) ||
          (s.selectedBlockNames || []).some((bName) => selectedBlockNames.includes(bName));

        return hasOverlappingBlock;
      });

      if (existingHostelConflict) {
        const conflictBlock =
          existingHostelConflict.selectedBlockNames?.find((b) => selectedBlockNames.includes(b)) || "a selected block";
        addToast(
          "warning",
          "Configuration Conflict",
          `An active hostel fee structure already exists for ${hostelName} (${conflictBlock}) in ${hostelAcademicYear}. Please edit the existing structure instead.`
        );
        return;
      }

      // Build Config Items
      const configItems: HostelConfigItem[] = [];
      selectedBlockIds.forEach((bId) => {
        const blockObj = availableBlocksForSelectedHostel.find((b) => String(b.id) === bId);
        const bName = blockObj ? blockObj.name : `Block ${bId}`;

        // AC Configurations
        Object.keys(blockConfigState).forEach((key) => {
          if (key.startsWith(`${bId}_AC_`) && blockConfigState[key].selected) {
            const sharingType = key.replace(`${bId}_AC_`, "");
            configItems.push({
              blockId: bId,
              blockName: bName,
              acType: "AC",
              sharingType,
              applyToAllNonAc: false,
              amount: blockConfigState[key].amount || 0,
            });
          }
        });

        // Non-AC Configurations
        if (blockNonAcAllState[bId] !== false) {
          configItems.push({
            blockId: bId,
            blockName: bName,
            acType: "Non-AC",
            sharingType: "All sharing",
            applyToAllNonAc: true,
            amount: blockNonAcAllAmountState[bId] || 0,
          });
        } else {
          Object.keys(blockConfigState).forEach((key) => {
            if (key.startsWith(`${bId}_NonAC_`) && blockConfigState[key].selected) {
              const sharingType = key.replace(`${bId}_NonAC_`, "");
              configItems.push({
                blockId: bId,
                blockName: bName,
                acType: "Non-AC",
                sharingType,
                applyToAllNonAc: false,
                amount: blockConfigState[key].amount || 0,
              });
            }
          });
        }
      });

      if (configItems.length === 0) {
        addToast(
          "warning",
          "Validation Error",
          "Please configure at least one room sharing fee amount for the selected block(s)."
        );
        return;
      }

      const invalidAmount = configItems.find((c) => !c.amount || c.amount <= 0);
      if (invalidAmount) {
        addToast(
          "warning",
          "Validation Error",
          `Please enter a valid amount (> ₹0) for ${invalidAmount.blockName} (${invalidAmount.acType} - ${invalidAmount.sharingType}).`
        );
        return;
      }

      const hostelConfigObj: HostelFeeCategoryConfig = {
        hostelId: hostelId || hostelName,
        hostelName: hostelName,
        selectedBlockIds: selectedBlockIds,
        selectedBlockNames: selectedBlockNames,
        configurations: configItems,
      };

      const feeHeadObj =
        feeHeads.find((h) => h.id === hostelFeeHeadId) ||
        feeHeads.find((h) => h.category === "Hostel") ||
        activeFeeHeads[0];

      const maxAmount = configItems.reduce((max, c) => Math.max(max, c.amount), 0);

      const defaultAy = hostelAcademicYear || selectedAcademicYear || (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) || "";
      const defaultBranch = selectedBranch || (branches && (branches[0] as any)?.name) || (typeof branches?.[0] === "string" ? branches[0] : "");

      const itemsList: FeeStructureItem[] = [
        {
          feeHeadId: feeHeadObj?.id || "",
          feeHeadName: feeHeadObj?.name || "Hostel Fee",
          category: "Hostel",
          amount: maxAmount,
          paymentEligibility: paymentEligibility,
          applicableTerms: paymentEligibility === "One-Time Only" ? [] : applicableTerms,
        },
      ];

      const payload: Omit<DynamicFeeStructure, "id"> = {
        academicYear: defaultAy,
        branch: defaultBranch,
        className: "Hostel",
        section: "All Sections",
        studentCategory: "Resident",
        category: "Hostel",
        feeCategory: "Hostel",
        feeHeadId: feeHeadObj?.id || "",
        feeHeadName: feeHeadObj?.name || "Hostel Fee",
        hostelId: hostelId || hostelName,
        hostelName: hostelName,
        selectedBlockIds: selectedBlockIds,
        selectedBlockNames: selectedBlockNames,
        hostelConfig: hostelConfigObj,
        hostelConfigJson: JSON.stringify(hostelConfigObj),
        effectiveDate: effectiveDate,
        paymentEligibility: paymentEligibility,
        applicableTerms: paymentEligibility === "One-Time Only" ? [] : applicableTerms,
        items: itemsList,
        totalAmount: maxAmount,
        status: hostelStatus,
      };

      if (editingStruct) {
        updateDynamicFeeStructure(editingStruct.id, payload);
        addToast("success", "Hostel Fee Structure Updated", `Updated structure for ${hostelName}`);
      } else {
        addDynamicFeeStructure(payload);
        addToast("success", "Hostel Fee Structure Created", `Configured structure for ${hostelName}`);
      }
      setIsModalOpen(false);
    }
  };

  // Filter applicable fee heads for selected class grade in Tuition
  const applicableFeeHeads = activeFeeHeads.filter((h) => {
    if (!className) return false;
    if (!h.applicableClasses || h.applicableClasses.length === 0) return true;
    return h.applicableClasses.includes(className) || h.applicableClasses.includes("All");
  });

  const displayFeeHeads = applicableFeeHeads.length > 0 ? applicableFeeHeads : activeFeeHeads;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-500" /> Fee Structures
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage Tuition and Hostel fee structures, sharing rules, and payment schedules.
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
      <div className="glass-card p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search class, hostel or block..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setCategoryFilter("All")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              categoryFilter === "All"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("Tuition")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              categoryFilter === "Tuition"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Tuition
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("Hostel")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              categoryFilter === "Hostel"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Hostel
          </button>
        </div>

        {/* Class Filter (Disabled if Hostel is selected) */}
        <select
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
          disabled={categoryFilter === "Hostel"}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none cursor-pointer disabled:opacity-50"
        >
          <option value="All">All Class Grades</option>
          {sortedClassesForFilter.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Count Indicator */}
        <div className="flex items-center justify-end px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 font-semibold">
          <span>{filteredStructures.length} Structure(s) Listed</span>
        </div>
      </div>

      {/* Grid of Structures */}
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
              No fee structures configured for the selected filters. Click below to create a new fee structure.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStructures.map((s) => {
            const isHostel = s.category === "Hostel" || s.feeCategory === "Hostel";

            if (isHostel) {
              const hostelCfg: HostelFeeCategoryConfig | undefined =
                s.hostelConfig ||
                (typeof s.hostelConfigJson === "string" ? JSON.parse(s.hostelConfigJson) : s.hostelConfigJson);
              const configs = hostelCfg?.configurations || [];
              const blockNames = s.selectedBlockNames || hostelCfg?.selectedBlockNames || [];

              return (
                <div
                  key={s.id}
                  className="glass-card p-5 rounded-2xl space-y-3.5 border-l-4 border-l-amber-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Hostel
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {s.hostelName || "Hostel Facility"}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Academic Year: <span className="font-semibold text-slate-600 dark:text-slate-300">{s.academicYear || "N/A"}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
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

              {(() => {
                const validItems = s.items.filter((item) =>
                  activeFeeHeads.some(
                    (h) =>
                      h.id === item.feeHeadId ||
                      h.name.toLowerCase().trim() === item.feeHeadName.toLowerCase().trim(),
                  ),
                );
                const cardTotal = validItems.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );

            return (
              <div
                key={s.id}
                className="glass-card p-5 rounded-2xl space-y-3.5 border-l-4 border-l-sky-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px] uppercase tracking-wider">
                        Tuition
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {s.className} Fee Structure
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Academic Year: <span className="font-semibold text-slate-600 dark:text-slate-300">{s.academicYear || "N/A"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
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

                {validItems.length === 0 ? (
                  <div className="py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                    No configured fee heads found for this structure. Edit to select fee heads.
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5 text-xs">
                      {validItems.map((item) => {
                        const head = activeFeeHeads.find(
                          (h) =>
                            h.id === item.feeHeadId ||
                            h.name.toLowerCase().trim() === item.feeHeadName.toLowerCase().trim()
                        );
                        const isMandatory = head ? head.mandatory !== false : true;
                        const freq = head ? head.frequency : "Quarterly";
                        const displayName = head ? head.name : item.feeHeadName;

                        return (
                          <div
                            key={item.feeHeadId || displayName}
                            className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-0.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {displayName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                  isMandatory
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                    : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                                }`}
                              >
                                {isMandatory ? "Mandatory" : "Optional"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">({freq})</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                      <span>Total Standard Base Fee:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(cardTotal)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-500" />
                  {editingStruct ? "Edit Fee Structure" : "Configure Fee Structure"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Define Tuition or Hostel fee amounts, room sharing configs, and billing rules.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Category Switcher Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setModalCategory("Tuition")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modalCategory === "Tuition"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Tuition / Class Grade
              </button>
              <button
                type="button"
                onClick={() => setModalCategory("Hostel")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modalCategory === "Hostel"
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Hostel Fee Structure
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* TUITION FORM */}
              {modalCategory === "Tuition" ? (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Class Grade <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <select
                      value={className}
                      onChange={(e) => handleClassChange(e.target.value)}
                      disabled={!!editingStruct}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {editingStruct ? (
                        <option value={className}>{className}</option>
                      ) : (
                        <>
                          <option value="">Select Class Grade</option>
                          {availableClassesForModal.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {className !== "" && (
                    <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                        SELECT APPLICABLE MASTER FEE TYPES
                      </h4>

                      {isLoadingFeeTypes ? (
                        <div className="p-6 text-center text-slate-400 space-y-2">
                          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs font-medium italic">Loading applicable fee types...</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {displayFeeHeads.map((head) => {
                            const isChecked = selectedHeadIds.includes(head.id);
                            const amountVal = selectedHeadAmounts[head.id] ?? "";

                            return (
                              <div
                                key={head.id}
                                className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${
                                  isChecked
                                    ? "bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-850"
                                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"
                                }`}
                              >
                                <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleHead(head.id)}
                                    className="w-4 h-4 rounded text-sky-600 border-slate-300 dark:border-slate-700 bg-white focus:ring-sky-500 cursor-pointer"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-bold text-slate-900 dark:text-white text-xs">{head.name}</p>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                                          head.mandatory !== false
                                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                            : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                                        }`}
                                      >
                                        {head.mandatory !== false ? "Mandatory" : "Optional"}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                      {head.category} • {head.frequency}
                                    </p>
                                  </div>
                                </label>

                                <div className="flex items-center gap-1.5 ml-2">
                                  <span
                                    className={`font-bold text-xs ${
                                      isChecked ? "text-slate-600 dark:text-slate-300" : "text-slate-300 dark:text-slate-600"
                                    }`}
                                  >
                                    ₹
                                  </span>
                                  <input
                                    type="text"
                                    disabled={!isChecked}
                                    value={isChecked ? amountVal : ""}
                                    placeholder=""
                                    onChange={(e) => handleAmountChange(head.id, e.target.value)}
                                    className={`w-28 px-3 py-1.5 rounded-xl border text-right font-mono font-bold text-xs outline-none transition-all ${
                                      isChecked
                                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 focus:ring-2 focus:ring-sky-500/20"
                                        : "bg-slate-100 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Total Box */}
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between mt-3">
                        <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <Calculator className="w-4 h-4" /> Total Auto-Calculated Fee:
                        </span>
                        <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(totalTuitionCalculated)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* HOSTEL FORM */
                <div className="space-y-4">
                  {/* Notice banner */}
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Hostel fee configurations are assigned by <strong>Hostel Blocks</strong>, <strong>Room Types</strong>, and <strong>Sharing Capacities</strong>. One structure automatically applies to all matching rooms.
                    </span>
                  </div>

                  {/* Academic Year & Fee Head Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Academic Year <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={hostelAcademicYear || selectedAcademicYear || (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) || ""}
                        onChange={(e) => setHostelAcademicYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold outline-none"
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
                        ) : selectedAcademicYear ? (
                          <option value={selectedAcademicYear}>{selectedAcademicYear}</option>
                        ) : (
                          <option value="">Select Academic Year</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Hostel Fee Category / Head <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={hostelFeeHeadId}
                        onChange={(e) => setHostelFeeHeadId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold outline-none"
                      >
                        {activeFeeHeads
                          .filter((h) => h.category === "Hostel" || (h.name || "").toLowerCase().includes("hostel"))
                          .map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name} {h.code ? `(${h.code})` : ""}
                            </option>
                          ))}
                        {activeFeeHeads.filter((h) => h.category === "Hostel" || (h.name || "").toLowerCase().includes("hostel")).length === 0 && (
                          <option value="">No Hostel Fee Head Configured</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Hostel Facility Selection */}
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Select Hostel Facility <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={hostelId || hostelName || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const selected = availableHostelList.find((h) => String(h.id) === val || h.name === val);
                        setHostelId(selected ? String(selected.id) : val);
                        setHostelName(selected ? selected.name : val);
                        setSelectedBlockIds([]); // Reset blocks on hostel change
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-bold outline-none"
                    >
                      <option value="">Select Hostel...</option>
                      {availableHostelList.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Block Selection */}
                  {hostelName && (
                    <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-amber-600" />
                          Block Selection ({selectedBlockIds.length}/{availableBlocksForSelectedHostel.length} Selected)
                        </label>
                        <div className="flex items-center gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              const allIds = availableBlocksForSelectedHostel.map((b) => String(b.id));
                              setSelectedBlockIds(allIds);
                            }}
                            className="text-amber-700 hover:text-amber-800 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedBlockIds([])}
                            className="text-slate-400 hover:text-slate-600 font-bold hover:underline cursor-pointer"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>

                      {availableBlocksForSelectedHostel.length === 0 ? (
                        <p className="text-xs text-amber-700 dark:text-amber-400 italic">
                          No blocks configured for this hostel.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {availableBlocksForSelectedHostel.map((b) => {
                            const bId = String(b.id);
                            const isChecked = selectedBlockIds.includes(bId);
                            return (
                              <label
                                key={bId}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 shadow-sm"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedBlockIds([...selectedBlockIds, bId]);
                                    } else {
                                      setSelectedBlockIds(selectedBlockIds.filter((id) => id !== bId));
                                    }
                                  }}
                                  className="w-3.5 h-3.5 text-amber-600 rounded focus:ring-amber-500"
                                />
                                <span className="truncate">{b.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Room Type & Sharing Configurations per Block */}
                  {selectedBlockIds.length > 0 && (
                    <div className="space-y-4 pt-1">
                      <label className="font-extrabold text-slate-900 dark:text-white text-xs block">
                        Room Type & Sharing Configurations ({selectedBlockIds.length} Block(s) Configured)
                      </label>

                      {selectedBlockIds.map((bId) => {
                        const blockObj = availableBlocksForSelectedHostel.find((b) => String(b.id) === bId);
                        const blockName = blockObj ? blockObj.name : `Block ${bId}`;
                        const configs = getBlockRoomConfigurations(bId, blockName);

                        return (
                          <div
                            key={bId}
                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span className="font-black text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                {blockName} Configurations
                              </span>
                              <span className="text-[10px] text-slate-400">Bulk Block Pricing</span>
                            </div>

                            {/* AC Rooms Section */}
                            <div className="space-y-2">
                              <span className="text-[11px] font-extrabold text-sky-800 dark:text-sky-300 block">
                                AC Rooms Sharing Options
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {configs.acSharingOptions.map((acOpt) => {
                                  const configKey = `${bId}_AC_${acOpt.sharingType}`;
                                  const currentConfig = blockConfigState[configKey] || { selected: false, amount: 0 };
                                  return (
                                    <div
                                      key={configKey}
                                      className="flex items-center justify-between p-2 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 text-xs"
                                    >
                                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                                        <input
                                          type="checkbox"
                                          checked={currentConfig.selected}
                                          onChange={(e) => updateBlockConfigState(configKey, { selected: e.target.checked })}
                                          className="w-3.5 h-3.5 text-sky-600 rounded focus:ring-sky-500"
                                        />
                                        <div>
                                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                            {acOpt.label}
                                          </span>
                                          <span className="text-[10px] text-slate-400">
                                            ({acOpt.matchingRoomCount} rooms)
                                          </span>
                                        </div>
                                      </label>
                                      {currentConfig.selected && (
                                        <div className="flex items-center gap-1 ml-2">
                                          <span className="text-[10px] font-bold text-slate-500">₹</span>
                                          <input
                                            type="number"
                                            value={currentConfig.amount || ""}
                                            onChange={(e) =>
                                              updateBlockConfigState(configKey, { amount: Number(e.target.value) })
                                            }
                                            placeholder="Amount"
                                            className="w-24 px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-lg outline-none text-right font-mono"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Non-AC Rooms Section */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 block">
                                  Non-AC Rooms Configuration
                                </span>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer font-bold text-emerald-700 dark:text-emerald-400">
                                  <input
                                    type="checkbox"
                                    checked={blockNonAcAllState[bId] ?? true}
                                    onChange={(e) => updateBlockNonAcAllState(bId, e.target.checked)}
                                    className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500"
                                  />
                                  Apply to All Non-AC Rooms
                                </label>
                              </div>

                              {blockNonAcAllState[bId] !== false ? (
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-xs">
                                  <div>
                                    <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                                      All Non-AC Rooms ({configs.totalNonAcRoomCount} rooms)
                                    </span>
                                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                      Applies uniform rate to all current & future Non-AC rooms in {blockName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-500">₹</span>
                                    <input
                                      type="number"
                                      value={blockNonAcAllAmountState[bId] || ""}
                                      onChange={(e) => updateBlockNonAcAllAmountState(bId, Number(e.target.value))}
                                      placeholder="Amount"
                                      className="w-28 px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg outline-none text-right font-mono"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {configs.nonAcSharingOptions.map((nonAcOpt) => {
                                    const configKey = `${bId}_NonAC_${nonAcOpt.sharingType}`;
                                    const currentConfig = blockConfigState[configKey] || { selected: false, amount: 0 };
                                    return (
                                      <div
                                        key={configKey}
                                        className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs"
                                      >
                                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                                          <input
                                            type="checkbox"
                                            checked={currentConfig.selected}
                                            onChange={(e) =>
                                              updateBlockConfigState(configKey, { selected: e.target.checked })
                                            }
                                            className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500"
                                          />
                                          <div>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                              {nonAcOpt.label}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                              ({nonAcOpt.matchingRoomCount} rooms)
                                            </span>
                                          </div>
                                        </label>
                                        {currentConfig.selected && (
                                          <div className="flex items-center gap-1 ml-2">
                                            <span className="text-[10px] font-bold text-slate-500">₹</span>
                                            <input
                                              type="number"
                                              value={currentConfig.amount || ""}
                                              onChange={(e) =>
                                                updateBlockConfigState(configKey, { amount: Number(e.target.value) })
                                              }
                                              placeholder="Amount"
                                              className="w-24 px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg outline-none text-right font-mono"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Payment Eligibility & Frequency Configuration */}
                  <div className="space-y-3 p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                    <label className="font-extrabold text-sky-900 dark:text-sky-200 flex items-center gap-2 text-xs">
                      <Clock className="w-4 h-4 text-sky-600" />
                      Payment Schedule & Eligibility Mode
                    </label>

                    <select
                      value={paymentEligibility}
                      onChange={(e) => setPaymentEligibility(e.target.value as FeePaymentEligibility)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 font-bold text-xs outline-none"
                    >
                      <option value="Both One-Time and Term-Wise">
                        Both One-Time and Term-Wise (Flexible Payment Mode)
                      </option>
                      <option value="Term-Wise Allowed">Term-Wise Allowed Only (Installments derived from Terms)</option>
                      <option value="One-Time Only">One-Time Only (Single Annual Installment)</option>
                    </select>

                    {paymentEligibility !== "One-Time Only" && (
                      <div className="space-y-2 pt-2 border-t border-sky-100 dark:border-sky-900/60">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                            Applicable Academic Terms ({applicableTerms.length}/{availableAcademicTerms.length})
                          </label>
                          <div className="flex items-center gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setApplicableTerms([...availableAcademicTerms])}
                              className="text-sky-600 hover:text-sky-700 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                            >
                              Select All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setApplicableTerms([])}
                              className="text-slate-400 hover:text-slate-600 font-bold hover:underline cursor-pointer"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {availableAcademicTerms.map((tName) => {
                            const isChecked = applicableTerms.includes(tName);
                            return (
                              <label
                                key={tName}
                                className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-sky-100 dark:bg-sky-950 border-sky-400 dark:border-sky-700 text-sky-900 dark:text-sky-200"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setApplicableTerms([...applicableTerms, tName]);
                                    } else {
                                      setApplicableTerms(applicableTerms.filter((t) => t !== tName));
                                    }
                                  }}
                                  className="w-3.5 h-3.5 text-sky-600 rounded"
                                />
                                <span className="truncate">{tName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Effective Date & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Effective Date</label>
                      <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                      <select
                        value={hostelStatus}
                        onChange={(e) => setHostelStatus(e.target.value as "Active" | "Inactive")}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-xs"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  {modalCategory === "Hostel" ? "Save Hostel Structure" : "Save Class Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingStruct}
        title="Delete Structure"
        message={`Are you sure you want to delete structure for ${
          deletingStruct?.category === "Hostel" || deletingStruct?.feeCategory === "Hostel"
            ? (deletingStruct?.hostelName || "Hostel")
            : deletingStruct?.className
        }?`}
        onConfirm={() => {
          if (deletingStruct) {
            deleteDynamicFeeStructure(deletingStruct.id);
            addToast("success", "Fee Structure Removed");
            setDeletingStruct(null);
          }
        }}
        onCancel={() => setDeletingStruct(null)}
      />
    </div>
  );
};
