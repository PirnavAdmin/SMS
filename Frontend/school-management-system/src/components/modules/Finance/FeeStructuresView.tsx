import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Bus,
  Shirt,
  DollarSign,
  Package,
  MapPin,
  Car,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import {
  DynamicFeeStructure,
  FeeStructureItem,
  FeePaymentEligibility,
  FeeHead,
} from "../../../types";
import {
  getHostelBlocks,
  getRooms,
  getRoomTypes,
  HostelBlock as ApiHostelBlock,
  HostelRoom as ApiHostelRoom,
  RoomType as ApiRoomType,
} from "../../../api/hostel";
import { useData } from "../../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { ExportButton } from "../../common/ExportButton";
import { ConfirmModal } from "../../common/ConfirmModal";
import { compareClassesAscending } from "../../../utils/classSorter";

export type FeeCategoryType = "Tuition Fee" | "Others" | "Hostel" | "Transport" | "Uniform";

interface FeeStructuresViewProps {
  initialCategory?: "All" | FeeCategoryType;
}

export const FeeStructuresView: React.FC<FeeStructuresViewProps> = ({ initialCategory = "All" }) => {
  const {
    feeHeads,
    dynamicFeeStructures,
    addDynamicFeeStructure,
    updateDynamicFeeStructure,
    deleteDynamicFeeStructure,
    academicClasses,
    hostelBlocks,
    hostelRooms,
    roomTypeMasters,
    routeMasters,
    pickupPoints,
    vehicleMasters,
    uniforms,
    uniformCategories,
    uniformSizes,
    academicYearFeeSchedules,
    academicYears,
    branches,
  } = useData();
  const { selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | FeeCategoryType>(initialCategory);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("All");

  useEffect(() => {
    if (initialCategory && initialCategory !== "All") {
      setCategoryFilter(initialCategory);
    }
  }, [initialCategory]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState<DynamicFeeStructure | null>(null);
  const [deletingStruct, setDeletingStruct] = useState<DynamicFeeStructure | null>(null);

  // Modal Category Choice
  const [modalCategory, setModalCategory] = useState<FeeCategoryType>("Tuition Fee");

  // Common Modal State
  const [modalAcademicYear, setModalAcademicYear] = useState<string>("");
  const [modalStatus, setModalStatus] = useState<"Active" | "Inactive">("Active");

  // --- Tuition Fee State ---
  const [tuitionClass, setTuitionClass] = useState("");
  const [selectedHeadIds, setSelectedHeadIds] = useState<string[]>([]);
  const [selectedHeadAmounts, setSelectedHeadAmounts] = useState<Record<string, string>>({});

  // --- Others Fee State ---
  const [othersFeeHeadId, setOthersFeeHeadId] = useState("");
  const [othersClass, setOthersClass] = useState("All");
  const [othersFrequency, setOthersFrequency] = useState("Annual");
  const [othersTerms, setOthersTerms] = useState<string[]>([]);
  const [othersAmount, setOthersAmount] = useState("");

  // --- Hostel Fee State ---
  const [hostelFeeHeadId, setHostelFeeHeadId] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [hostelClass, setHostelClass] = useState("All");
  const [hostelTerm, setHostelTerm] = useState("");
  const [hostelAmount, setHostelAmount] = useState("");
  const [hostelItemsList, setHostelItemsList] = useState<FeeStructureItem[]>([]);

  // --- Dynamic Hostel Management Data from Existing Module ---
  const [hostelFacilities, setHostelFacilities] = useState<ApiHostelBlock[]>([]);
  const [hostelFacilitiesLoading, setHostelFacilitiesLoading] = useState(false);
  const [hostelFacilitiesError, setHostelFacilitiesError] = useState<string | null>(null);
  const [roomsForSelectedHostel, setRoomsForSelectedHostel] = useState<ApiHostelRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomTypesList, setRoomTypesList] = useState<ApiRoomType[]>([]);

  const loadHostelFacilities = useCallback(async () => {
    try {
      setHostelFacilitiesLoading(true);
      setHostelFacilitiesError(null);
      const [blocksData, rtsData] = await Promise.all([
        getHostelBlocks(),
        getRoomTypes().catch(() => []),
      ]);
      const activeBlocks = (blocksData || []).filter(
        (b) => !b.status || b.status.toLowerCase() === "active"
      );
      setHostelFacilities(activeBlocks);
      setRoomTypesList(rtsData || []);
    } catch (err: any) {
      setHostelFacilitiesError(err?.message || "Failed to load hostel facilities.");
    } finally {
      setHostelFacilitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHostelFacilities();
  }, [loadHostelFacilities]);

  const handleHostelFacilityChange = useCallback(async (facilityId: string) => {
    setSelectedBlockId(facilityId);
    setSelectedRoomId("");
    if (!facilityId) {
      setRoomsForSelectedHostel([]);
      return;
    }
    try {
      setRoomsLoading(true);
      const roomsData = await getRooms(Number(facilityId));
      const activeRooms = (roomsData || []).filter(
        (r) =>
          String(r.hostelId) === String(facilityId) &&
          (!r.status || r.status.toLowerCase() === "active")
      );
      setRoomsForSelectedHostel(activeRooms);
    } catch {
      setRoomsForSelectedHostel([]);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  // --- Transport Fee State ---
  const [transportFeeHeadId, setTransportFeeHeadId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedStopId, setSelectedStopId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [transportClass, setTransportClass] = useState("All");
  const [transportTerm, setTransportTerm] = useState("");
  const [transportAmount, setTransportAmount] = useState("");
  const [transportItemsList, setTransportItemsList] = useState<FeeStructureItem[]>([]);

  // --- Uniform Fee State ---
  const [uniformFeeHeadId, setUniformFeeHeadId] = useState("");
  const [selectedUniformItemId, setSelectedUniformItemId] = useState("");
  const [selectedUniformCategoryId, setSelectedUniformCategoryId] = useState("");
  const [selectedUniformSizeId, setSelectedUniformSizeId] = useState("");
  const [uniformClass, setUniformClass] = useState("All");
  const [uniformQuantity, setUniformQuantity] = useState("1");
  const [uniformAmount, setUniformAmount] = useState("");
  const [uniformItemsList, setUniformItemsList] = useState<FeeStructureItem[]>([]);

  const activeFeeHeads = useMemo(() => feeHeads.filter((h) => h.status === "Active"), [feeHeads]);

  // Normalize structure category
  const normalizeCategory = (s: DynamicFeeStructure): FeeCategoryType => {
    const cat = (s.category || s.feeCategory || "").trim();
    if (cat.toLowerCase().includes("hostel")) return "Hostel";
    if (cat.toLowerCase().includes("transport")) return "Transport";
    if (cat.toLowerCase().includes("uniform")) return "Uniform";
    if (cat.toLowerCase() === "others" || cat.toLowerCase() === "other") return "Others";
    return "Tuition Fee";
  };

  // Available Academic Terms for active year
  const availableAcademicTerms = useMemo(() => {
    const activeAY =
      modalAcademicYear ||
      selectedAcademicYear ||
      (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) ||
      "";
    const schedule = (academicYearFeeSchedules || []).find((s) => s.academicYear === activeAY);
    if (schedule && schedule.terms && schedule.terms.length > 0) {
      return [...schedule.terms].sort((a, b) => a.sequence - b.sequence).map((t) => t.termName || t.id);
    }
    const anyScheduleWithTerms = (academicYearFeeSchedules || []).find((s) => s.terms && s.terms.length > 0);
    if (anyScheduleWithTerms) {
      return [...anyScheduleWithTerms.terms].sort((a, b) => a.sequence - b.sequence).map((t) => t.termName || t.id);
    }
    return [];
  }, [academicYearFeeSchedules, selectedAcademicYear, modalAcademicYear, academicYears]);

  // Sorted Academic Classes for dropdowns
  const sortedClasses = useMemo(
    () => [...academicClasses].sort((a, b) => compareClassesAscending(a.name, b.name)),
    [academicClasses]
  );

  // Selected Room Details derived dynamically from existing Hostel Management module
  const selectedRoomDetails = useMemo(() => {
    if (!selectedRoomId) return null;
    const r: any =
      (roomsForSelectedHostel || []).find(
        (rm: any) => String(rm.roomId || rm.id) === String(selectedRoomId)
      ) ||
      (hostelRooms || []).find(
        (rm: any) => String(rm.roomId || rm.id) === String(selectedRoomId)
      );
    if (!r) return null;

    const matchedType =
      (roomTypesList || []).find(
        (rt: any) => String(rt.roomTypeId || rt.id) === String(r.roomTypeId)
      ) ||
      (roomTypeMasters || []).find(
        (rt: any) => String(rt.roomTypeId || rt.id) === String(r.roomTypeId)
      );

    const spec =
      r.roomTypeSpecification ||
      (matchedType as any)?.roomTypeSpecification ||
      (matchedType as any)?.roomTypeName ||
      "";
    const isAc =
      r.acType === "AC" ||
      r.isAc === true ||
      (matchedType as any)?.acType === "AC" ||
      (spec.toUpperCase().includes("AC") && !spec.toUpperCase().includes("NON"));

    const cap =
      r.bedCapacity ||
      r.capacity ||
      (matchedType as any)?.bedCapacity ||
      (matchedType as any)?.capacity ||
      1;
    const typeName = spec || (matchedType as any)?.roomTypeName || (isAc ? "AC Room" : "Non-AC Room");

    return {
      roomNumber: r.roomNumber || r.roomNo || `Room ${r.roomId || r.id}`,
      acType: isAc ? "AC" : "Non-AC",
      capacity: cap,
      sharingType: `${cap}-Bed Sharing`,
      roomTypeName: typeName,
    };
  }, [selectedRoomId, roomsForSelectedHostel, hostelRooms, roomTypesList, roomTypeMasters]);

  // Pickup points filtered by selected route
  const availableStopsForRoute = useMemo(() => {
    if (!selectedRouteId) return [];
    return (pickupPoints || []).filter(
      (p: any) => String(p.routeId) === String(selectedRouteId)
    );
  }, [pickupPoints, selectedRouteId]);

  // Selected Uniform Item details
  const selectedUniformItem = useMemo(() => {
    if (!selectedUniformItemId) return null;
    return (uniforms || []).find((u) => String(u.id) === String(selectedUniformItemId)) || null;
  }, [selectedUniformItemId, uniforms]);

  // Filtered Structures
  const filteredStructures = useMemo(() => {
    return dynamicFeeStructures
      .map((s) => {
        const structCat = normalizeCategory(s);
        const isTuitionOrOthers = structCat === "Tuition Fee" || structCat === "Others";
        if (!isTuitionOrOthers) return s;

        // For Tuition and Others, filter items to only valid fee heads
        const validItems = (s.items || []).filter((item) => {
          return feeHeads.some(
            (h) =>
              String(h.id) === String(item.feeHeadId) ||
              (item.feeHeadName && h.name.trim().toLowerCase() === item.feeHeadName.trim().toLowerCase())
          );
        });

        // If no valid items exist, omit the orphan structure
        if (validItems.length === 0) {
          return null;
        }

        const newTotal = validItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        return {
          ...s,
          items: validItems,
          totalAmount: newTotal,
        };
      })
      .filter((s): s is DynamicFeeStructure => s !== null)
      .filter((s) => {
        const matchesYear =
          !selectedAcademicYear || !s.academicYear || s.academicYear === selectedAcademicYear;
        const structCat = normalizeCategory(s);

        if (categoryFilter !== "All" && structCat !== categoryFilter) {
          return false;
        }

        if (
          selectedClassFilter !== "All" &&
          s.className &&
          s.className !== "All" &&
          s.className !== selectedClassFilter &&
          !["Hostel", "Transport", "Uniform"].includes(s.className)
        ) {
          return false;
        }

        if (query.trim()) {
          const q = query.toLowerCase();
          const matchClass = (s.className || "").toLowerCase().includes(q);
          const matchName = (s.name || "").toLowerCase().includes(q);
          const matchCat = structCat.toLowerCase().includes(q);
          const matchItems = (s.items || []).some(
            (i) =>
              (i.feeHeadName || "").toLowerCase().includes(q) ||
              (i.hostelBlockName || "").toLowerCase().includes(q) ||
              (i.roomNo || "").toLowerCase().includes(q) ||
              (i.routeName || "").toLowerCase().includes(q) ||
              (i.stopName || "").toLowerCase().includes(q) ||
              (i.uniformItemName || "").toLowerCase().includes(q)
          );
          if (!matchClass && !matchName && !matchCat && !matchItems) return false;
        }

        return matchesYear;
      })
      .sort((a, b) => compareClassesAscending(a.className || "", b.className || ""));
  }, [dynamicFeeStructures, feeHeads, selectedAcademicYear, categoryFilter, selectedClassFilter, query]);

  // Handler for class change in Tuition form - resets old selections & amounts
  const handleTuitionClassChange = (newClass: string) => {
    setTuitionClass(newClass);
    setSelectedHeadIds([]);
    setSelectedHeadAmounts({});
  };

  // Handler for academic year change
  const handleAcademicYearChange = (newYear: string) => {
    setModalAcademicYear(newYear);
    if (!editingStruct) {
      setSelectedHeadIds([]);
      setSelectedHeadAmounts({});
    }
  };

  // Reset and open modal for Add
  const handleOpenAdd = () => {
    setEditingStruct(null);
    const initialAy =
      selectedAcademicYear ||
      (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) ||
      "";
    setModalAcademicYear(initialAy);
    setModalStatus("Active");

    const activeCat = categoryFilter !== "All" ? categoryFilter : "Tuition Fee";
    setModalCategory(activeCat);

    // Reset Tuition
    setTuitionClass("");
    setSelectedHeadIds([]);
    setSelectedHeadAmounts({});

    // Reset Others
    const defaultOthersHead = activeFeeHeads.find((h) => h.category === "Others" || h.category === "Miscellaneous");
    setOthersFeeHeadId(defaultOthersHead ? defaultOthersHead.id : activeFeeHeads[0]?.id || "");
    setOthersClass("All");
    setOthersFrequency("Annual");
    setOthersTerms([...availableAcademicTerms]);
    setOthersAmount("");

    // Reset Hostel
    const defaultHostelHead = activeFeeHeads.find((h) => h.category === "Hostel" || (h.name || "").toLowerCase().includes("hostel"));
    setHostelFeeHeadId(defaultHostelHead ? defaultHostelHead.id : activeFeeHeads[0]?.id || "");
    setSelectedBlockId("");
    setSelectedRoomId("");
    setRoomsForSelectedHostel([]);
    setHostelClass("All");
    setHostelTerm(availableAcademicTerms[0] || "Annual");
    setHostelAmount("");
    setHostelItemsList([]);

    // Reset Transport
    const defaultTransportHead = activeFeeHeads.find((h) => h.category === "Transport" || (h.name || "").toLowerCase().includes("transport"));
    setTransportFeeHeadId(defaultTransportHead ? defaultTransportHead.id : activeFeeHeads[0]?.id || "");
    setSelectedRouteId(routeMasters[0] ? String(routeMasters[0].id) : "");
    setSelectedStopId("");
    setSelectedVehicleId(vehicleMasters[0] ? String(vehicleMasters[0].id) : "");
    setTransportClass("All");
    setTransportTerm(availableAcademicTerms[0] || "Term 1");
    setTransportAmount("");
    setTransportItemsList([]);

    // Reset Uniform
    const defaultUniformHead = activeFeeHeads.find((h) => h.category === "Uniform" || (h.name || "").toLowerCase().includes("uniform"));
    setUniformFeeHeadId(defaultUniformHead ? defaultUniformHead.id : activeFeeHeads[0]?.id || "");
    setSelectedUniformItemId(uniforms[0] ? String(uniforms[0].id) : "");
    setSelectedUniformCategoryId(uniformCategories[0] ? String(uniformCategories[0].id) : "");
    setSelectedUniformSizeId(uniformSizes[0] ? String(uniformSizes[0].id) : "");
    setUniformClass("All");
    setUniformQuantity("1");
    setUniformAmount(uniforms[0]?.price ? String(uniforms[0].price) : "");
    setUniformItemsList([]);

    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (s: DynamicFeeStructure) => {
    setEditingStruct(s);
    setModalAcademicYear(s.academicYear || selectedAcademicYear || "");
    setModalStatus(s.status || "Active");

    const cat = normalizeCategory(s);
    setModalCategory(cat);

    if (cat === "Tuition Fee") {
      setTuitionClass(s.className || "");
      const ids: string[] = [];
      const amounts: Record<string, string> = {};
      (s.items || []).forEach((item) => {
        const head = feeHeads.find(
          (h) => String(h.id) === String(item.feeHeadId) || h.name.toLowerCase() === item.feeHeadName.toLowerCase()
        );
        const realId = head ? head.id : item.feeHeadId;
        if (realId) {
          ids.push(realId);
          amounts[realId] = String(item.amount || 0);
        }
      });
      setSelectedHeadIds(ids);
      setSelectedHeadAmounts(amounts);
    } else if (cat === "Others") {
      setOthersClass(s.className || "All");
      const firstItem = s.items?.[0];
      setOthersFeeHeadId(firstItem?.feeHeadId || activeFeeHeads[0]?.id || "");
      setOthersFrequency(firstItem?.frequency || "Annual");
      setOthersTerms(firstItem?.applicableTerms || [...availableAcademicTerms]);
      setOthersAmount(firstItem?.amount ? String(firstItem.amount) : String(s.totalAmount || ""));
    } else if (cat === "Hostel") {
      const firstItem = s.items?.[0];
      setHostelFeeHeadId(firstItem?.feeHeadId || activeFeeHeads.find((h) => h.category === "Hostel")?.id || "");
      setHostelItemsList(s.items || []);
      if (firstItem?.hostelBlockId) {
        handleHostelFacilityChange(String(firstItem.hostelBlockId));
      }
    } else if (cat === "Transport") {
      const firstItem = s.items?.[0];
      setTransportFeeHeadId(firstItem?.feeHeadId || activeFeeHeads.find((h) => h.category === "Transport")?.id || "");
      setTransportItemsList(s.items || []);
    } else if (cat === "Uniform") {
      const firstItem = s.items?.[0];
      setUniformFeeHeadId(firstItem?.feeHeadId || activeFeeHeads.find((h) => h.category === "Uniform")?.id || "");
      setUniformItemsList(s.items || []);
    }

    setIsModalOpen(true);
  };

  // Add Item to Hostel List
  const handleAddHostelItem = () => {
    if (!selectedBlockId) {
      addToast("warning", "Validation Error", "Please select a Hostel Facility.");
      return;
    }
    if (!selectedRoomId) {
      addToast("warning", "Validation Error", "Please select a Room.");
      return;
    }
    const amt = parseFloat(hostelAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast("warning", "Validation Error", "Please enter a valid amount greater than 0.");
      return;
    }

    const blk: any =
      hostelFacilities.find(
        (b: any) => String(b.hostelId || b.id) === String(selectedBlockId)
      ) ||
      (hostelBlocks || []).find(
        (b: any) => String(b.hostelId || b.id) === String(selectedBlockId)
      );
    const blkName = blk?.hostelName || blk?.name || `Hostel ${selectedBlockId}`;
    const headObj = activeFeeHeads.find((h) => h.id === hostelFeeHeadId) || { name: "Hostel Fee" };

    const newItem: FeeStructureItem = {
      feeHeadId: hostelFeeHeadId,
      feeHeadName: headObj.name,
      category: "Hostel",
      className: hostelClass,
      term: hostelTerm,
      amount: amt,
      hostelBlockId: selectedBlockId,
      hostelBlockName: blkName,
      roomId: selectedRoomId,
      roomNo: selectedRoomDetails?.roomNumber || `Room ${selectedRoomId}`,
      roomType: selectedRoomDetails?.acType || "Standard",
      capacity: selectedRoomDetails?.capacity || 1,
      sharingType: selectedRoomDetails?.sharingType || "Single",
    };

    setHostelItemsList((prev) => [...prev, newItem]);
    setHostelAmount("");
  };

  // Add Item to Transport List
  const handleAddTransportItem = () => {
    if (!selectedRouteId) {
      addToast("warning", "Validation Error", "Please select a Transport Route.");
      return;
    }
    if (!selectedStopId) {
      addToast("warning", "Validation Error", "Please select a Pickup Stop.");
      return;
    }
    const amt = parseFloat(transportAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast("warning", "Validation Error", "Please enter a valid amount greater than 0.");
      return;
    }

    const routeObj = routeMasters.find((r: any) => String(r.id) === String(selectedRouteId));
    const stopObj = pickupPoints.find((p: any) => String(p.id) === String(selectedStopId));
    const vehObj = vehicleMasters.find((v: any) => String(v.id) === String(selectedVehicleId));
    const headObj = activeFeeHeads.find((h) => h.id === transportFeeHeadId) || { name: "Transport Fee" };

    const newItem: FeeStructureItem = {
      feeHeadId: transportFeeHeadId,
      feeHeadName: headObj.name,
      category: "Transport",
      className: transportClass,
      term: transportTerm,
      amount: amt,
      transportRouteId: selectedRouteId,
      routeName: routeObj?.routeName || `Route ${selectedRouteId}`,
      pickupPointId: selectedStopId,
      stopName: stopObj?.pickupName || `Stop ${selectedStopId}`,
      vehicleId: selectedVehicleId || undefined,
      vehicleNumber: vehObj?.vehicleNumber || undefined,
    };

    setTransportItemsList((prev) => [...prev, newItem]);
    setTransportAmount("");
  };

  // Add Item to Uniform List
  const handleAddUniformItem = () => {
    if (!selectedUniformItemId) {
      addToast("warning", "Validation Error", "Please select a Uniform Item.");
      return;
    }
    const amt = parseFloat(uniformAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast("warning", "Validation Error", "Please enter a valid amount greater than 0.");
      return;
    }

    const itemObj = uniforms.find((u) => String(u.id) === String(selectedUniformItemId));
    const catObj = uniformCategories.find((c: any) => String(c.id) === String(selectedUniformCategoryId));
    const sizeObj = uniformSizes.find((s: any) => String(s.id) === String(selectedUniformSizeId));
    const headObj = activeFeeHeads.find((h) => h.id === uniformFeeHeadId) || { name: "Uniform Fee" };

    const newItem: FeeStructureItem = {
      feeHeadId: uniformFeeHeadId,
      feeHeadName: headObj.name,
      category: "Uniform",
      className: uniformClass,
      amount: amt,
      uniformItemId: selectedUniformItemId,
      uniformItemName: itemObj?.name || itemObj?.category || "Uniform Item",
      uniformCategoryId: selectedUniformCategoryId || undefined,
      uniformCategoryName: catObj?.name || (catObj as any)?.categoryName || itemObj?.category,
      uniformSizeId: selectedUniformSizeId || undefined,
      uniformSizeName: sizeObj?.sizeName || itemObj?.size,
      quantity: parseInt(uniformQuantity, 10) || 1,
    };

    setUniformItemsList((prev) => [...prev, newItem]);
    setUniformAmount("");
  };

  // Submit Handler
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const defaultAy =
      modalAcademicYear ||
      selectedAcademicYear ||
      (academicYears && (academicYears[0]?.academicYear || (academicYears[0] as any)?.name)) ||
      "";
    const defaultBranch =
      selectedBranch ||
      (branches && (branches[0] as any)?.name) ||
      (typeof branches?.[0] === "string" ? branches[0] : "");

    let payload: Omit<DynamicFeeStructure, "id">;

    if (modalCategory === "Tuition Fee") {
      if (!tuitionClass) {
        addToast("warning", "Validation Error", "Please select a Class Grade.");
        return;
      }
      if (selectedHeadIds.length === 0) {
        addToast("warning", "Validation Error", "Please select at least one fee head.");
        return;
      }

      for (const headId of selectedHeadIds) {
        const amtStr = (selectedHeadAmounts[headId] || "").trim();
        if (amtStr === "" || isNaN(Number(amtStr)) || Number(amtStr) <= 0) {
          const head = feeHeads.find((h) => h.id === headId);
          addToast("warning", "Validation Error", `Please enter a valid amount (> 0) for ${head?.name || "fee head"}.`);
          return;
        }
      }

      const items: FeeStructureItem[] = selectedHeadIds
        .map((headId) => {
          const head = feeHeads.find((h) => h.id === headId);
          if (!head) return null;
          return {
            feeHeadId: headId,
            feeHeadName: head.name,
            category: "Tuition Fee",
            className: tuitionClass,
            amount: Number(selectedHeadAmounts[headId]),
            paymentEligibility: head.paymentEligibility,
            applicableTerms: head.applicableTerms,
          };
        })
        .filter(Boolean) as FeeStructureItem[];

      const totalAmt = items.reduce((sum, item) => sum + item.amount, 0);

      payload = {
        name: `${tuitionClass} Tuition Fee Structure`,
        academicYear: defaultAy,
        branch: defaultBranch,
        className: tuitionClass,
        section: "A",
        studentCategory: "General",
        category: "Tuition Fee",
        feeCategory: "Tuition Fee",
        items,
        totalAmount: totalAmt,
        status: modalStatus,
      };
    } else if (modalCategory === "Others") {
      const head = activeFeeHeads.find((h) => h.id === othersFeeHeadId);
      if (!head) {
        addToast("warning", "Validation Error", "Please select a Fee Head.");
        return;
      }
      const amt = parseFloat(othersAmount);
      if (isNaN(amt) || amt <= 0) {
        addToast("warning", "Validation Error", "Please enter a valid amount (> 0).");
        return;
      }

      const items: FeeStructureItem[] = [
        {
          feeHeadId: head.id,
          feeHeadName: head.name,
          category: "Others",
          className: othersClass,
          frequency: othersFrequency,
          applicableTerms: othersFrequency === "Term-Wise" ? othersTerms : undefined,
          amount: amt,
        },
      ];

      payload = {
        name: `${head.name} Fee Structure (${othersClass})`,
        academicYear: defaultAy,
        branch: defaultBranch,
        className: othersClass,
        studentCategory: "General",
        category: "Others",
        feeCategory: "Others",
        items,
        totalAmount: amt,
        status: modalStatus,
      };
    } else if (modalCategory === "Hostel") {
      if (hostelItemsList.length === 0) {
        addToast("warning", "Validation Error", "Please add at least one Room Configuration row.");
        return;
      }
      const totalAmt = hostelItemsList.reduce((sum, i) => sum + i.amount, 0);
      payload = {
        name: `Hostel Fee Structure (${defaultAy})`,
        academicYear: defaultAy,
        branch: defaultBranch,
        className: "Hostel",
        studentCategory: "Resident",
        category: "Hostel",
        feeCategory: "Hostel",
        items: hostelItemsList,
        totalAmount: totalAmt,
        status: modalStatus,
      };
    } else if (modalCategory === "Transport") {
      if (transportItemsList.length === 0) {
        addToast("warning", "Validation Error", "Please add at least one Route / Stop configuration row.");
        return;
      }
      const totalAmt = transportItemsList.reduce((sum, i) => sum + i.amount, 0);
      payload = {
        name: `Transport Fee Structure (${defaultAy})`,
        academicYear: defaultAy,
        branch: defaultBranch,
        className: "Transport",
        studentCategory: "Day Scholar",
        category: "Transport",
        feeCategory: "Transport",
        items: transportItemsList,
        totalAmount: totalAmt,
        status: modalStatus,
      };
    } else {
      // Uniform
      if (uniformItemsList.length === 0) {
        addToast("warning", "Validation Error", "Please add at least one Uniform Item configuration row.");
        return;
      }
      const totalAmt = uniformItemsList.reduce((sum, i) => sum + i.amount, 0);
      payload = {
        name: `Uniform Fee Structure (${defaultAy})`,
        academicYear: defaultAy,
        branch: defaultBranch,
        className: "Uniform",
        studentCategory: "General",
        category: "Uniform",
        feeCategory: "Uniform",
        items: uniformItemsList,
        totalAmount: totalAmt,
        status: modalStatus,
      };
    }

    if (editingStruct) {
      updateDynamicFeeStructure(editingStruct.id, payload);
      addToast("success", "Fee Structure Updated", `Updated structure for ${payload.name}`);
    } else {
      addDynamicFeeStructure(payload);
      addToast("success", "Fee Structure Created", `Configured structure for ${payload.name}`);
    }

    setIsModalOpen(false);
  };

  // --- Fee Head Resolution & Matching Helpers ---
  const isFeeHeadMatchingClass = useCallback((head: FeeHead, targetClass: string): boolean => {
    if (!targetClass || !targetClass.trim()) return false;

    const applicable = head.applicableClasses;
    if (!applicable || !Array.isArray(applicable) || applicable.length === 0) {
      return false;
    }

    // Check for "All Classes" or "All"
    if (
      applicable.some(
        (c) =>
          c &&
          (c.trim().toLowerCase() === "all classes" ||
            c.trim().toLowerCase() === "all")
      )
    ) {
      return true;
    }

    const normalizeCls = (str?: string) =>
      (str || "")
        .trim()
        .toLowerCase()
        .replace(/^class\s+/i, "")
        .replace(/\s+/g, " ");

    const clsObj = academicClasses.find(
      (c: any) =>
        c.name === targetClass ||
        c.className === targetClass ||
        c.id === targetClass ||
        String(c.classId || "") === targetClass
    ) as any;

    const targetLower = targetClass.trim().toLowerCase();
    const targetNorm = normalizeCls(targetClass);
    const clsNameLower = clsObj?.name ? String(clsObj.name).trim().toLowerCase() : "";
    const clsNameNorm = clsObj?.name ? normalizeCls(clsObj.name) : "";
    const clsClassNameLower = clsObj?.className ? String(clsObj.className).trim().toLowerCase() : "";
    const clsClassNameNorm = clsObj?.className ? normalizeCls(clsObj.className) : "";
    const clsIdLower = clsObj?.id ? String(clsObj.id).trim().toLowerCase() : "";
    const clsNumericId = clsObj?.classId !== undefined ? String(clsObj.classId).trim() : "";

    return applicable.some((c) => {
      if (!c) return false;
      const cTrim = c.trim();
      const cLower = cTrim.toLowerCase();
      const cNorm = normalizeCls(cTrim);

      if (cLower === targetLower || cNorm === targetNorm) return true;
      if (clsNameLower && (cLower === clsNameLower || cNorm === clsNameNorm)) return true;
      if (clsClassNameLower && (cLower === clsClassNameLower || cNorm === clsClassNameNorm)) return true;
      if (clsIdLower && (cLower === clsIdLower || (clsObj && cTrim === String(clsObj.id)))) return true;
      if (clsNumericId && (cTrim === clsNumericId || cTrim === `CL-${clsNumericId}`)) return true;

      return false;
    });
  }, [academicClasses]);

  const isFeeHeadMatchingAcademicYear = useCallback((head: FeeHead, targetYear?: string): boolean => {
    if (!targetYear || !targetYear.trim()) return true;
    if (!head.academicYear || !head.academicYear.trim()) return true;

    const hYear = head.academicYear.trim().toLowerCase();
    if (hYear === "all" || hYear === "all years") return true;

    const tYear = targetYear.trim().toLowerCase();
    if (hYear === tYear) return true;

    const cleanH = hYear.replace(/\s+/g, "");
    const cleanT = tYear.replace(/\s+/g, "");
    return cleanH === cleanT;
  }, []);

  const isFeeHeadMatchingBranch = useCallback((head: FeeHead, branchName?: string): boolean => {
    if (!branchName || !branchName.trim() || branchName === "All Branches") return true;
    if (!head.applicableBranches || !Array.isArray(head.applicableBranches) || head.applicableBranches.length === 0) {
      return true;
    }
    if (
      head.applicableBranches.some(
        (b) =>
          b &&
          (b.trim().toLowerCase() === "all branches" ||
            b.trim().toLowerCase() === "all")
      )
    ) {
      return true;
    }

    const bLower = branchName.trim().toLowerCase();
    return head.applicableBranches.some((b) => b && b.trim().toLowerCase() === bLower);
  }, []);

  // Tuition fee heads for selection (strictly filtered by selected class, academic year, and branch)
  const tuitionFeeHeads = useMemo(() => {
    if (!tuitionClass || !tuitionClass.trim()) return [];

    return activeFeeHeads.filter((h) => {
      // 1. Category check: Tuition Fee or Tuition or general non-specialized heads
      const isTuitionCat =
        h.category === "Tuition Fee" ||
        h.category === "Tuition" ||
        (!["Hostel", "Transport", "Uniform", "Others"].includes(h.category) &&
          !h.category.toLowerCase().includes("hostel"));
      if (!isTuitionCat) return false;

      // 2. Academic Year filter
      if (!isFeeHeadMatchingAcademicYear(h, modalAcademicYear)) return false;

      // 3. Branch filter
      if (!isFeeHeadMatchingBranch(h, selectedBranch)) return false;

      // 4. Class Grade filter (Strict: NO global fallback)
      if (!isFeeHeadMatchingClass(h, tuitionClass)) return false;

      return true;
    });
  }, [
    activeFeeHeads,
    tuitionClass,
    modalAcademicYear,
    selectedBranch,
    isFeeHeadMatchingClass,
    isFeeHeadMatchingAcademicYear,
    isFeeHeadMatchingBranch,
  ]);

  // Others fee heads for selection
  const othersFeeHeads = useMemo(() => {
    return activeFeeHeads.filter((h) => {
      const isOthersCat =
        h.category === "Others" ||
        h.category === "Miscellaneous" ||
        (!["Tuition Fee", "Tuition", "Hostel", "Transport", "Uniform"].includes(h.category));
      if (!isOthersCat) return false;

      // Academic Year filter
      if (!isFeeHeadMatchingAcademicYear(h, modalAcademicYear)) return false;

      // Branch filter
      if (!isFeeHeadMatchingBranch(h, selectedBranch)) return false;

      // Class filter if specific class is chosen in Others tab
      if (othersClass && othersClass !== "All") {
        if (!isFeeHeadMatchingClass(h, othersClass)) return false;
      }

      return true;
    });
  }, [
    activeFeeHeads,
    othersClass,
    modalAcademicYear,
    selectedBranch,
    isFeeHeadMatchingClass,
    isFeeHeadMatchingAcademicYear,
    isFeeHeadMatchingBranch,
  ]);

  useEffect(() => {
    if (modalCategory === "Others" && othersFeeHeads.length > 0) {
      if (!othersFeeHeads.some((h) => h.id === othersFeeHeadId)) {
        setOthersFeeHeadId(othersFeeHeads[0].id);
      }
    }
  }, [modalCategory, othersFeeHeads, othersFeeHeadId]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-500" /> Fee Structures
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic fee structures across Tuition Fee, Others, Hostel, Transport, and Uniform modules.
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
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search class, block, stop, item..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-5 flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 overflow-x-auto">
          {(["All", "Tuition Fee", "Others", "Hostel", "Transport", "Uniform"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`flex-1 min-w-[70px] py-1.5 text-xs font-bold rounded-lg transition-all text-center whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {cat === "Tuition Fee" ? "Tuition" : cat}
            </button>
          ))}
        </div>

        {/* Class Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            disabled={categoryFilter === "Hostel" || categoryFilter === "Transport" || categoryFilter === "Uniform"}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="All">All Class Grades</option>
            {sortedClasses.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
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
              No fee structures configured matching your current filter. Click below to configure one.
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
            const cat = normalizeCategory(s);
            const items = s.items || [];
            const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || s.totalAmount;

            let borderClass = "border-l-sky-500";
            let badgeBg = "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300";
            let IconComp = Layers;

            if (cat === "Hostel") {
              borderClass = "border-l-amber-500";
              badgeBg = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
              IconComp = Building2;
            } else if (cat === "Transport") {
              borderClass = "border-l-teal-500";
              badgeBg = "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300";
              IconComp = Bus;
            } else if (cat === "Uniform") {
              borderClass = "border-l-indigo-500";
              badgeBg = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300";
              IconComp = Shirt;
            } else if (cat === "Others") {
              borderClass = "border-l-purple-500";
              badgeBg = "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
              IconComp = Sparkles;
            }

            return (
              <div
                key={s.id}
                className={`glass-card p-5 rounded-2xl space-y-3.5 border-l-4 ${borderClass} hover:shadow-md transition-all`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 ${badgeBg}`}>
                        <IconComp className="w-3 h-3" /> {cat}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {s.name || `${s.className} Fee Structure`}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Academic Year:{" "}
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {s.academicYear || "Current Year"}
                      </span>
                      {s.branch && (
                        <>
                          {" "}• Branch:{" "}
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {s.branch}
                          </span>
                        </>
                      )}
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

                {/* Items Breakdown */}
                {items.length === 0 ? (
                  <div className="py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                    No breakdown configured. Base amount: {formatCurrency(s.totalAmount)}
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                    {items.map((item, idx) => {
                      let itemLabel = item.feeHeadName || "Fee Item";
                      let subDetail = "";

                      if (cat === "Hostel") {
                        itemLabel = `${item.hostelBlockName || "Block"} • ${item.roomNo || "Room"}`;
                        subDetail = `${item.roomType || ""} (${item.sharingType || ""}) ${item.term ? `• ${item.term}` : ""}`;
                      } else if (cat === "Transport") {
                        itemLabel = `${item.routeName || "Route"} → ${item.stopName || "Stop"}`;
                        subDetail = `${item.vehicleNumber ? `Veh: ${item.vehicleNumber} ` : ""}${item.term ? `• ${item.term}` : ""}`;
                      } else if (cat === "Uniform") {
                        itemLabel = `${item.uniformItemName || "Uniform"}`;
                        subDetail = `${item.uniformCategoryName ? `${item.uniformCategoryName} ` : ""}${item.uniformSizeName ? `• Size: ${item.uniformSizeName}` : ""} • Qty: ${item.quantity || 1}`;
                      } else if (cat === "Others") {
                        itemLabel = item.feeHeadName;
                        subDetail = `${item.frequency || "Annual"}${item.term ? ` • ${item.term}` : ""}`;
                      } else {
                        subDetail = item.term ? `• ${item.term}` : "";
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-none"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {itemLabel}
                            </span>
                            {subDetail && (
                              <span className="text-[10px] text-slate-400 block">{subDetail}</span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white ml-2 shrink-0">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>Standard Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-500" />
                  {editingStruct ? "Edit Fee Structure" : "Configure Fee Structure"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select fee category and configure dynamic breakdowns across Academic, Hostel, Transport, or Uniform modules.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Category Selector Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
              {(
                [
                  { id: "Tuition Fee", label: "Tuition Fee", icon: Layers },
                  { id: "Others", label: "Others", icon: Sparkles },
                  { id: "Hostel", label: "Hostel", icon: Building2 },
                  { id: "Transport", label: "Transport", icon: Bus },
                  { id: "Uniform", label: "Uniform", icon: Shirt },
                ] as const
              ).map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = modalCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={!!editingStruct}
                    onClick={() => setModalCategory(tab.id)}
                    className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-md"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Common: Academic Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalAcademicYear}
                    onChange={(e) => handleAcademicYearChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold outline-none text-xs"
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
                      <option value={modalAcademicYear}>{modalAcademicYear || "Current Year"}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as "Active" | "Inactive")}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold outline-none text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* 1. TUITION FORM */}
              {modalCategory === "Tuition Fee" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Class Grade <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <select
                      value={tuitionClass}
                      onChange={(e) => handleTuitionClassChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="">Select Class Grade</option>
                      {sortedClasses.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                        Select Master Fee Heads & Enter Amounts
                      </label>
                      {tuitionClass && tuitionFeeHeads.length > 0 && (
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                          {tuitionFeeHeads.length} applicable head{tuitionFeeHeads.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {!tuitionClass ? (
                      <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center flex flex-col items-center justify-center gap-1.5">
                        <GraduationCap className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                          Select a Class Grade to load applicable Fee Heads.
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          Fee heads configured for the chosen class and academic year will appear here.
                        </p>
                      </div>
                    ) : tuitionFeeHeads.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-center flex flex-col items-center justify-center gap-1.5">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <p className="text-amber-700 dark:text-amber-400 font-semibold text-xs">
                          No Fee Heads configured for this class.
                        </p>
                        <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                          Configure fee heads for {tuitionClass} under Fee Heads tab first.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tuitionFeeHeads.map((head) => {
                          const isChecked = selectedHeadIds.includes(head.id);
                          const amt = selectedHeadAmounts[head.id] ?? "";

                          return (
                            <div
                              key={head.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                isChecked
                                  ? "bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800 shadow-xs"
                                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"
                              }`}
                            >
                              <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedHeadIds(selectedHeadIds.filter((id) => id !== head.id));
                                    } else {
                                      setSelectedHeadIds([...selectedHeadIds, head.id]);
                                    }
                                  }}
                                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 dark:text-white text-xs">{head.name}</p>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                      {head.code}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {head.frequency || "Quarterly"} • {head.paymentEligibility || "Both One-Time and Term-Wise"}
                                  </p>
                                </div>
                              </label>

                              <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-400 text-xs">₹</span>
                                <input
                                  type="number"
                                  disabled={!isChecked}
                                  value={isChecked ? amt : ""}
                                  placeholder="0.00"
                                  onChange={(e) =>
                                    setSelectedHeadAmounts({ ...selectedHeadAmounts, [head.id]: e.target.value })
                                  }
                                  className="w-28 px-2.5 py-1 text-right font-mono font-bold rounded-lg border bg-white dark:bg-slate-900 outline-none text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. OTHERS FORM */}
              {modalCategory === "Others" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Fee Head <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={othersFeeHeadId}
                        onChange={(e) => setOthersFeeHeadId(e.target.value)}
                        disabled={othersFeeHeads.length === 0}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs outline-none disabled:opacity-50"
                      >
                        {othersFeeHeads.length === 0 ? (
                          <option value="">No fee heads configured for this class</option>
                        ) : (
                          othersFeeHeads.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Applicable Class
                      </label>
                      <select
                        value={othersClass}
                        onChange={(e) => setOthersClass(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs outline-none"
                      >
                        <option value="All">All Classes</option>
                        {sortedClasses.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Frequency
                      </label>
                      <select
                        value={othersFrequency}
                        onChange={(e) => setOthersFrequency(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs outline-none"
                      >
                        <option value="One-Time">One-Time</option>
                        <option value="Annual">Annual</option>
                        <option value="Term-Wise">Term-Wise</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={othersAmount}
                        placeholder="e.g. 1500"
                        onChange={(e) => setOthersAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-xs outline-none"
                      />
                    </div>
                  </div>

                  {othersFrequency === "Term-Wise" && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs block">
                        Applicable Academic Terms
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableAcademicTerms.map((term) => (
                          <label key={term} className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={othersTerms.includes(term)}
                              onChange={(e) => {
                                if (e.target.checked) setOthersTerms([...othersTerms, term]);
                                else setOthersTerms(othersTerms.filter((t) => t !== term));
                              }}
                              className="w-3.5 h-3.5 text-purple-600 rounded"
                            />
                            <span>{term}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. HOSTEL FORM */}
              {modalCategory === "Hostel" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Configure Hostel fee dynamically by selecting <strong>Hostel Facility</strong> → <strong>Room</strong> → <strong>Room Type & Capacity</strong> → <strong>Class Grade</strong> → <strong>Terms</strong> → <strong>Amount</strong>. Add one or more room configs below.
                    </span>
                  </div>

                  {/* Dependent Dropdown Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Select Hostel Facility <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedBlockId}
                        onChange={(e) => handleHostelFacilityChange(e.target.value)}
                        disabled={hostelFacilitiesLoading}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none disabled:opacity-50"
                      >
                        {hostelFacilitiesLoading ? (
                          <option value="">Loading hostel facilities...</option>
                        ) : hostelFacilitiesError ? (
                          <option value="">Error loading hostel facilities</option>
                        ) : hostelFacilities.length === 0 ? (
                          <option value="">No active hostel facilities available</option>
                        ) : (
                          <>
                            <option value="">Select Hostel...</option>
                            {hostelFacilities.map((b) => (
                              <option key={b.hostelId} value={String(b.hostelId)}>
                                {b.hostelName} {b.hostelCode ? `(${b.hostelCode})` : ""}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {!hostelFacilitiesLoading && hostelFacilities.length === 0 && (
                        <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                          No active hostel facilities available. Create an active hostel facility in Hostel Management first.
                        </p>
                      )}
                      {hostelFacilitiesError && (
                        <p className="mt-1 text-[11px] text-rose-500">
                          {hostelFacilitiesError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Select Room <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        disabled={!selectedBlockId || roomsLoading}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none disabled:opacity-50"
                      >
                        {!selectedBlockId ? (
                          <option value="">Select Hostel first</option>
                        ) : roomsLoading ? (
                          <option value="">Loading rooms...</option>
                        ) : roomsForSelectedHostel.length === 0 ? (
                          <option value="">No active rooms available</option>
                        ) : (
                          <>
                            <option value="">Select Room...</option>
                            {roomsForSelectedHostel.map((r) => (
                              <option key={r.roomId} value={String(r.roomId)}>
                                Room {r.roomNumber} ({r.roomTypeSpecification || `${r.bedCapacity || 1}-Bed`} • Floor: {r.floorLevel || "Ground Floor"})
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {selectedBlockId && !roomsLoading && roomsForSelectedHostel.length === 0 && (
                        <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                          No active rooms found for this facility. Add rooms in Hostel Management → Room Master first.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Room Type & Sharing Capacity
                      </label>
                      <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between min-h-[34px]">
                        <span>
                          {selectedRoomDetails
                            ? `${selectedRoomDetails.roomTypeName} • ${selectedRoomDetails.sharingType}`
                            : "Auto-derived from room"}
                        </span>
                        {selectedRoomDetails && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              selectedRoomDetails.acType === "AC"
                                ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {selectedRoomDetails.acType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and Class row */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Class Grade
                      </label>
                      <select
                        value={hostelClass}
                        onChange={(e) => setHostelClass(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="All">All Classes</option>
                        {sortedClasses.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Academic Term
                      </label>
                      <select
                        value={hostelTerm}
                        onChange={(e) => setHostelTerm(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="Annual">Annual / One-Time</option>
                        {availableAcademicTerms.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Fee Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={hostelAmount}
                        placeholder="e.g. 25000"
                        onChange={(e) => setHostelAmount(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold text-xs outline-none"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddHostelItem}
                        className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Room Row
                      </button>
                    </div>
                  </div>

                  {/* Configured Rows Table */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                      Configured Room Rates ({hostelItemsList.length} rows)
                    </label>

                    {hostelItemsList.length === 0 ? (
                      <p className="text-slate-400 italic text-xs">No room configurations added yet.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="p-2">Hostel Facility</th>
                              <th className="p-2">Room</th>
                              <th className="p-2">Type / Sharing</th>
                              <th className="p-2">Class</th>
                              <th className="p-2">Term</th>
                              <th className="p-2 text-right">Amount</th>
                              <th className="p-2 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {hostelItemsList.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2 font-semibold">{item.hostelBlockName}</td>
                                <td className="p-2">{item.roomNo}</td>
                                <td className="p-2 text-slate-500">{item.roomType} ({item.sharingType})</td>
                                <td className="p-2">{item.className || "All"}</td>
                                <td className="p-2">{item.term || "Annual"}</td>
                                <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setHostelItemsList(hostelItemsList.filter((_, i) => i !== idx))}
                                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 inline" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. TRANSPORT FORM */}
              {modalCategory === "Transport" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>
                      Configure Transport fees dynamically by selecting <strong>Route</strong> → <strong>Pickup Stop</strong> → <strong>Vehicle</strong> → <strong>Amount</strong>. Add one or more route configs below.
                    </span>
                  </div>

                  {/* Dependent Dropdown Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Transport Route <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedRouteId}
                        onChange={(e) => {
                          setSelectedRouteId(e.target.value);
                          setSelectedStopId(""); // Clear stop on route change
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="">Select Route</option>
                        {routeMasters.map((r: any) => (
                          <option key={r.id} value={r.id}>
                            {r.routeName || r.routeCode || `Route ${r.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Pickup Stop <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedStopId}
                        onChange={(e) => {
                          setSelectedStopId(e.target.value);
                          const stop = pickupPoints.find((p: any) => String(p.id) === e.target.value);
                          if (stop?.monthlyFee) setTransportAmount(String(stop.monthlyFee));
                        }}
                        disabled={!selectedRouteId}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none disabled:opacity-50"
                      >
                        <option value="">
                          {!selectedRouteId
                            ? "Select Route first"
                            : availableStopsForRoute.length === 0
                            ? "No stops for route"
                            : "Select Pickup Stop"}
                        </option>
                        {availableStopsForRoute.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.pickupName || `Stop ${p.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Vehicle
                      </label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="">Select Vehicle (Optional)</option>
                        {vehicleMasters.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.vehicleNumber} ({v.vehicleType || "Bus"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Amount and Class row */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Class Grade
                      </label>
                      <select
                        value={transportClass}
                        onChange={(e) => setTransportClass(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="All">All Classes</option>
                        {sortedClasses.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Academic Term
                      </label>
                      <select
                        value={transportTerm}
                        onChange={(e) => setTransportTerm(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="Annual">Annual / One-Time</option>
                        {availableAcademicTerms.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Fee Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={transportAmount}
                        placeholder="e.g. 1200"
                        onChange={(e) => setTransportAmount(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold text-xs outline-none"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddTransportItem}
                        className="w-full px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Route Row
                      </button>
                    </div>
                  </div>

                  {/* Configured Transport Rows */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                      Configured Transport Rates ({transportItemsList.length} rows)
                    </label>

                    {transportItemsList.length === 0 ? (
                      <p className="text-slate-400 italic text-xs">No route configurations added yet.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="p-2">Route</th>
                              <th className="p-2">Stop</th>
                              <th className="p-2">Vehicle</th>
                              <th className="p-2">Class</th>
                              <th className="p-2">Term</th>
                              <th className="p-2 text-right">Amount</th>
                              <th className="p-2 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {transportItemsList.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2 font-semibold">{item.routeName}</td>
                                <td className="p-2">{item.stopName}</td>
                                <td className="p-2 text-slate-500">{item.vehicleNumber || "Any"}</td>
                                <td className="p-2">{item.className || "All"}</td>
                                <td className="p-2">{item.term || "Annual"}</td>
                                <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setTransportItemsList(transportItemsList.filter((_, i) => i !== idx))}
                                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 inline" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. UNIFORM FORM */}
              {modalCategory === "Uniform" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Configure Uniform fees dynamically by selecting <strong>Item</strong> → <strong>Category</strong> → <strong>Size</strong> → <strong>Amount</strong>. Add one or more items below.
                    </span>
                  </div>

                  {/* Item / Category / Size Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Uniform Item <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedUniformItemId}
                        onChange={(e) => {
                          setSelectedUniformItemId(e.target.value);
                          const item = uniforms.find((u) => String(u.id) === e.target.value);
                          if (item?.price) setUniformAmount(String(item.price));
                          if (item?.className) setUniformClass(item.className);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="">Select Item</option>
                        {uniforms.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.category || `Item ${u.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Category
                      </label>
                      <select
                        value={selectedUniformCategoryId}
                        onChange={(e) => setSelectedUniformCategoryId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="">Select Category</option>
                        {uniformCategories.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.categoryName || `Category ${c.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Size
                      </label>
                      <select
                        value={selectedUniformSizeId}
                        onChange={(e) => setSelectedUniformSizeId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="">Select Size</option>
                        {uniformSizes.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.sizeName || s.sizeCodeName || `Size ${s.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quantity and Amount Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Class Grade
                      </label>
                      <select
                        value={uniformClass}
                        onChange={(e) => setUniformClass(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs outline-none"
                      >
                        <option value="All">All Classes</option>
                        {sortedClasses.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={uniformQuantity}
                        onChange={(e) => setUniformQuantity(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Fee Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={uniformAmount}
                        placeholder="e.g. 750"
                        onChange={(e) => setUniformAmount(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono font-bold text-xs outline-none"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddUniformItem}
                        className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Uniform Row
                      </button>
                    </div>
                  </div>

                  {/* Configured Uniform Rows */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                      Configured Uniform Items ({uniformItemsList.length} rows)
                    </label>

                    {uniformItemsList.length === 0 ? (
                      <p className="text-slate-400 italic text-xs">No uniform items added yet.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="p-2">Item</th>
                              <th className="p-2">Category</th>
                              <th className="p-2">Size</th>
                              <th className="p-2">Qty</th>
                              <th className="p-2">Class</th>
                              <th className="p-2 text-right">Amount</th>
                              <th className="p-2 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {uniformItemsList.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2 font-semibold">{item.uniformItemName}</td>
                                <td className="p-2 text-slate-500">{item.uniformCategoryName || "Standard"}</td>
                                <td className="p-2">{item.uniformSizeName || "Standard"}</td>
                                <td className="p-2 font-mono">{item.quantity || 1}</td>
                                <td className="p-2">{item.className || "All"}</td>
                                <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setUniformItemsList(uniformItemsList.filter((_, i) => i !== idx))}
                                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 inline" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
                  {editingStruct ? "Update Fee Structure" : "Save Fee Structure"}
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
        message={`Are you sure you want to delete structure "${deletingStruct?.name || deletingStruct?.className}"?`}
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
