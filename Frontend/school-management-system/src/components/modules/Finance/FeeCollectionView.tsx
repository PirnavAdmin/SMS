// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from "react";
import { formatCurrency } from "../../../utils/currency";
import {
  transitionStudentCategoryApi,
  applyTransportCreditApi,
  refundSecurityDepositApi,
  recalculateStudentFeeProfileApi,
  fetchStudentFeeProfileApi,
} from "../../../api/finance";
import {
  getUniformPackageFeeByClass,
  getUniformFeeForClass,
  getItemFeeFromFinanceConfig,
  calculateClothOrItemPrice,
} from "../../../utils/uniformUtils";
import { matchesClassName, compareClassesAscending } from "../../../utils/classSorter";
import { formatDateForDisplay } from "../../../utils/dateValidation";
import {
  IndianRupee,
  Search,
  Receipt,
  CheckCircle,
  AlertCircle,
  Calculator,
  History,
  ArrowRight,
  ArrowLeft,
  Printer,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Filter,
  ArrowRightLeft,
  Bed,
  Bus,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  Student,
  FeePayment,
  StudentFeeLedger,
  StudentFeeInstallment,
} from "../../../types";
import {
  useData,
  StudentCalculationResult,
} from "../../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { Badge } from "../../common/Badge";

interface FeeCollectionViewProps {
  onPrintReceipt: (payment: FeePayment) => void;
  initialStudent?: Student | null;
  onClearInitialStudent?: () => void;
}

export const FeeCollectionView: React.FC<FeeCollectionViewProps> = ({
  onPrintReceipt,
  initialStudent,
  onClearInitialStudent,
}) => {
  const {
    students,
    admissions,
    feePayments,
    studentFeeLedgers,
    studentFeeInstallments,
    studentUniformIssues,
    updateStudentUniformIssue,
    calculateStudentPayableFee,
    addFeePayment,
    financeSettings,
    financeUniformConfigs,
    feeStructures = [],
    feeHeads = [],
    dynamicFeeStructures = [],
    getStudentFeeLedger,
    getDynamicTransportFee,
    studentTransports = [],
    routeMasters = [],
    pickupPoints = [],
    academicYearFeeSchedules = [],
    getStudentFeeOutstandingSummary,
    getStudentInstallmentSummary,
    fetchFinanceData,
    scholarships,
    discounts,
    applyScholarshipToStudent,
    removeScholarshipFromStudent,
    applyDiscountToStudent,
    removeDiscountFromStudent,
    updateAdmission,
    updateStudent,
    hostelBlocks = [],
    hostelRooms = [],
    hostelBeds = [],
    financeHostelConfigs = [],
  } = useData();
  const { selectedAcademicYear, selectedBranch } = useAuth();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(initialStudent || null);
  const [calcResult, setCalcResult] = useState<StudentCalculationResult | null>(null);

  const [tempScholarshipId, setTempScholarshipId] = useState("");
  const [tempDiscountId, setTempDiscountId] = useState("");
  const [isFineWaived, setIsFineWaived] = useState(false);
  const [fineAmountInput, setFineAmountInput] = useState<string>("0");
  const [fineReason, setFineReason] = useState<string>("");
  const [selectedConcessionId, setSelectedConcessionId] = useState<string>("");
  const [discountAmountInput, setDiscountAmountInput] = useState<string>("0");
  const [customAmountReceived, setCustomAmountReceived] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Dynamic Backend Fee Profile & Transition States
  const [backendFeeProfile, setBackendFeeProfile] = useState<any | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Category Transition Modal State
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionTargetType, setTransitionTargetType] = useState<"Residential" | "Non-Residential">("Residential");
  const [transitionDate, setTransitionDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [transportEndDate, setTransportEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [hostelJoiningDate, setHostelJoiningDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedBedNumber, setSelectedBedNumber] = useState<string>("");
  const [applyCreditOnTransition, setApplyCreditOnTransition] = useState<boolean>(true);
  const [transitionNotes, setTransitionNotes] = useState<string>("");
  const [isSubmittingTransition, setIsSubmittingTransition] = useState<boolean>(false);

  // Apply Transport Credit Modal State
  const [showApplyCreditModal, setShowApplyCreditModal] = useState(false);
  const [creditAmountToApply, setCreditAmountToApply] = useState<string>("");
  const [creditTargetHead, setCreditTargetHead] = useState<string>("Hostel Accommodation");
  const [creditReason, setCreditReason] = useState<string>("Apply unused transport balance to hostel charges");
  const [isSubmittingCredit, setIsSubmittingCredit] = useState<boolean>(false);

  // Refund Security Deposit Modal State
  const [showRefundDepositModal, setShowRefundDepositModal] = useState(false);
  const [refundAmountInput, setRefundAmountInput] = useState<string>("");
  const [deductionAmountInput, setDeductionAmountInput] = useState<string>("0");
  const [deductionReasonInput, setDeductionReasonInput] = useState<string>("");
  const [refundPaymentMode, setRefundPaymentMode] = useState<string>("Bank Transfer");
  const [refundRemarks, setRefundRemarks] = useState<string>("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState<boolean>(false);

  // Fetch dynamic backend fee profile whenever selectedStudent changes
  useEffect(() => {
    if (!selectedStudent) {
      setBackendFeeProfile(null);
      return;
    }

    const sId = selectedStudent.id || (selectedStudent as any).studentId;
    if (sId) {
      setIsLoadingProfile(true);
      fetchStudentFeeProfileApi(sId, selectedAcademicYear)
        .then((res: any) => {
          const profileData = res?.data || res;
          if (profileData && (profileData.studentId || profileData.admissionNo)) {
            setBackendFeeProfile(profileData);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch backend fee profile:", err);
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    }
  }, [selectedStudent, selectedAcademicYear]);

  const refreshStudentProfile = async () => {
    if (!selectedStudent) return;
    const sId = selectedStudent.id || (selectedStudent as any).studentId;
    if (!sId) return;
    try {
      setIsLoadingProfile(true);
      const res: any = await recalculateStudentFeeProfileApi(Number(sId), selectedAcademicYear);
      const prof = res?.data || res;
      if (prof && (prof.studentId || prof.admissionNo)) {
        setBackendFeeProfile(prof);
      }
      if (fetchFinanceData) await fetchFinanceData();
      const freshLedger = getStudentFeeLedger(selectedStudent.id, selectedStudent, currentYear);
      updateCalculation(selectedStudent.id, calculateStudentPayableFee(selectedStudent.id), freshLedger);
      addToast("success", "Profile Recalculated", "Student fee profile, transport usage, and balances recalculated.");
    } catch (err: any) {
      console.error("Error recalculating student profile:", err);
      addToast("error", "Recalculation Failed", "Could not recalculate student fee profile.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      setIsSubmittingTransition(true);
      const sId = Number(selectedStudent.id || (selectedStudent as any).studentId);
      const payload = {
        studentId: sId,
        admissionNo: selectedStudent.admissionNo || String(sId),
        fromCategory: transitionTargetType === "Residential" ? "Non-Residential" : "Residential",
        toCategory: transitionTargetType,
        effectiveDate: transitionDate,
        transportEndDate: transitionTargetType === "Residential" ? transportEndDate : undefined,
        hostelJoiningDate: transitionTargetType === "Residential" ? hostelJoiningDate : undefined,
        hostelBlockId: selectedBlockId ? Number(selectedBlockId) : undefined,
        hostelRoomId: selectedRoomId ? Number(selectedRoomId) : undefined,
        bedNumber: selectedBedNumber || undefined,
        applyCreditToHostel: applyCreditOnTransition,
        notes: transitionNotes || `Transitioned student to ${transitionTargetType}`
      };

      const res: any = await transitionStudentCategoryApi(payload);
      addToast(
        "success",
        "Category Transition Complete",
        res?.message || `Successfully transitioned student to ${transitionTargetType}. Charges and credits recalculated.`
      );
      setShowTransitionModal(false);
      await refreshStudentProfile();
    } catch (err: any) {
      console.error("Transition error:", err);
      addToast("error", "Transition Failed", err?.message || "Failed to complete category transition.");
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  const handleApplyCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const amt = Number(creditAmountToApply);
    if (!amt || amt <= 0) {
      addToast("error", "Invalid Amount", "Please enter a valid credit amount to apply.");
      return;
    }
    try {
      setIsSubmittingCredit(true);
      const sId = Number(selectedStudent.id || (selectedStudent as any).studentId);
      const payload = {
        studentId: sId,
        admissionNo: selectedStudent.admissionNo || String(sId),
        amount: amt,
        targetFeeHead: creditTargetHead,
        reason: creditReason
      };
      const res: any = await applyTransportCreditApi(payload);
      addToast(
        "success",
        "Credit Applied",
        res?.message || `Successfully applied ₹${amt} credit towards ${creditTargetHead}.`
      );
      setShowApplyCreditModal(false);
      await refreshStudentProfile();
    } catch (err: any) {
      console.error("Apply credit error:", err);
      addToast("error", "Credit Application Failed", err?.message || "Failed to apply transport credit.");
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  const handleRefundDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const refAmt = Number(refundAmountInput);
    const dedAmt = Number(deductionAmountInput) || 0;
    if (!refAmt || refAmt <= 0) {
      addToast("error", "Invalid Amount", "Please enter a valid refund amount.");
      return;
    }
    if (dedAmt > refAmt) {
      addToast("error", "Invalid Deduction", "Deduction cannot exceed the total refundable amount.");
      return;
    }
    try {
      setIsSubmittingRefund(true);
      const sId = Number(selectedStudent.id || (selectedStudent as any).studentId);
      const payload = {
        studentId: sId,
        admissionNo: selectedStudent.admissionNo || String(sId),
        refundAmount: refAmt,
        deductionAmount: dedAmt,
        deductionReason: deductionReasonInput || undefined,
        paymentMode: refundPaymentMode,
        remarks: refundRemarks || "Hostel security deposit refund"
      };
      const res: any = await refundSecurityDepositApi(payload);
      addToast(
        "success",
        "Deposit Refund Processed",
        res?.message || `Processed refund of ₹${refAmt - dedAmt} successfully.`
      );
      setShowRefundDepositModal(false);
      await refreshStudentProfile();
    } catch (err: any) {
      console.error("Refund error:", err);
      addToast("error", "Refund Failed", err?.message || "Failed to process deposit refund.");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const isHostellerStudent = useMemo(() => {
    if (!selectedStudent) return false;
    if (backendFeeProfile?.hostelStaySummary && backendFeeProfile.hostelStaySummary !== "None") return true;
    if (backendFeeProfile?.hostelAssessedFee > 0 || backendFeeProfile?.hostelPaidAmount > 0) return true;
    const sType = (selectedStudent as any)?.studentType || (selectedStudent as any)?.type;
    const rStatus = (selectedStudent as any)?.residentialStatus;
    if (sType === "Residential" || sType === "Hosteller" || rStatus === "Residential" || rStatus === "Resident") return true;

    // Check if target is stored from Admissions
    try {
      const stored = sessionStorage.getItem('edu_fee_pay_target');
      if (stored) {
        const p = JSON.parse(stored);
        const sKey = String(p.studentId || p.admissionNo || '').trim().toLowerCase();
        const curId = String(selectedStudent.id || '').trim().toLowerCase();
        const curAdm = String(selectedStudent.admissionNo || '').trim().toLowerCase();
        if (sKey && (sKey === curId || sKey === curAdm)) {
          if (p.feeHead === "Hostel Security Deposit" || p.studentType === "Residential" || p.source === "admission_security_deposit") return true;
        }
      }
    } catch {}

    const adm = (admissions || []).find((a: any) => {
      const aId = String(a.id || '').trim().toLowerCase();
      const aAdm = String(a.admissionNo || a.applicationNo || a.registrationNo || '').trim().toLowerCase();
      const curId = String(selectedStudent.id || '').trim().toLowerCase();
      const curAdm = String(selectedStudent.admissionNo || '').trim().toLowerCase();
      return (curId && (aId === curId || aAdm === curId)) || (curAdm && (aId === curAdm || aAdm === curAdm));
    });
    return adm?.studentType === "Residential" || adm?.residentialStatus === "Residential" || adm?.residentialStatus === "Resident";
  }, [selectedStudent, backendFeeProfile, admissions]);


  const toggleGroupExpansion = (headName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [headName]: !prev[headName],
    }));
  };

  const handleWaiveFine = () => {
    setIsFineWaived(true);
    addToast(
      "info",
      "Late Fee Waived",
      "Waived late fee for this student collection.",
    );
  };

  const handleReapplyFine = () => {
    setIsFineWaived(false);
    addToast(
      "success",
      "Late Fee Re-applied",
      "Re-applied automatic late fee based on fine rule configuration.",
    );
  };

  const [selectedInstallments, setSelectedInstallments] = useState<string[]>(
    [],
  );
  const [customCollectionAmounts, setCustomCollectionAmounts] = useState<
    Record<string, string>
  >({});
  const [paymentMode, setPaymentMode] = useState<
    FeePayment["paymentMode"] | ""
  >("Cash");
  const [transactionId, setTransactionId] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [remarks, setRemarks] = useState("");

  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPreviousDuesOpen, setIsPreviousDuesOpen] = useState(true);
  const [applyReturnCredit, setApplyReturnCredit] = useState(true);

  const availableReturnCredit = (() => {
    if (!selectedStudent) return 0;
    const sId = selectedStudent.id;
    const admNo = selectedStudent.admissionNo;
    const sName =
      `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`
        .trim()
        .toLowerCase();

    const returnedPaidIssues = (studentUniformIssues || []).filter((i) => {
      const isStudentMatch = Boolean(
        (i.studentId && (i.studentId === sId || (admNo && i.studentId === admNo))) ||
        (i.admissionNo && (i.admissionNo === sId || (admNo && i.admissionNo === admNo))) ||
        (i.studentName && sName && (
          i.studentName.toLowerCase().trim() === sName ||
          i.studentName.toLowerCase().includes(sName) ||
          sName.includes(i.studentName.toLowerCase().trim())
        ))
      );

      const notesLower = (i.notes || "").toLowerCase();
      if (!isStudentMatch || (i.status !== "Returned" && !notesLower.includes("returned"))) return false;

      const isExplicitlyPaidNote =
        (notesLower.includes("fees paid") ||
          notesLower.includes("paid at counter") ||
          notesLower.includes("already paid")) &&
        !notesLower.includes("unpaid") &&
        !notesLower.includes("not paid") &&
        !notesLower.includes("to be paid") &&
        !notesLower.includes("pending");

      const isPaidInFinance = Boolean(
        (i as any).wasPaid ||
        (i as any).previousStatus === "Paid" ||
        isExplicitlyPaidNote ||
        (feePayments || []).some((p) => {
          const isStd =
            p.studentId === sId ||
            (admNo && p.studentId === admNo) ||
            (p.receiptNo && ((admNo && p.receiptNo.includes(admNo)) || (sId && p.receiptNo.includes(sId)))) ||
            (p.studentName && sName && (p.studentName.toLowerCase().includes(sName) || sName.includes(p.studentName.toLowerCase())));

          if (!isStd || !p.amountPaid || p.amountPaid <= 0) return false;

          const instId1 = `INST-UNIF-EXTRA-${i.id}`;
          const instId2 = `FEE-UNI-EXTRA-${i.id}`;
          const instId3 = `INST-UNIF-${i.id}`;
          
          let isLegacyMatch = false;
          const match = i.id.match(/-P(\d+)$/);
          if (match) {
            const strippedId = i.id.replace(/-P\d+$/, '');
            const idx = parseInt(match[1], 10);
            const coversLegacy = p.amountPaid >= (i.price || i.unitPrice || 0) * idx;
            if (coversLegacy && (
              p.selectedInstallmentIds?.includes(`INST-UNIF-EXTRA-${strippedId}`) ||
              p.selectedInstallmentIds?.includes(`FEE-UNI-EXTRA-${strippedId}`) ||
              p.selectedInstallmentIds?.includes(`INST-UNIF-${strippedId}`) ||
              p.selectedInstallmentIds?.includes(strippedId) ||
              (p.receiptNo && (p.receiptNo.includes(`UNI-EXTRA-${strippedId}`) || p.receiptNo.includes(strippedId)))
            )) {
              isLegacyMatch = true;
            }
          }

          if (
            p.selectedInstallmentIds?.includes(instId1) ||
            p.selectedInstallmentIds?.includes(instId2) ||
            p.selectedInstallmentIds?.includes(instId3) ||
            p.selectedInstallmentIds?.includes(i.id) ||
            (p.receiptNo && (p.receiptNo.includes(`UNI-EXTRA-${i.id}`) || p.receiptNo.includes(i.id))) ||
            isLegacyMatch
          ) {
            return true;
          }

          if (p.paymentAllocation && p.paymentAllocation.length > 0) {
            return p.paymentAllocation.some((alloc) => {
              const head = String(alloc.feeHeadName || alloc.termName || (alloc as any).feeHeadId || "").toLowerCase();
              const itemLower = (i.itemName || i.itemCategory || "").toLowerCase().replace(/\s*\(extra\)/gi, "").trim();
              const allocInstId = String((alloc as any).installmentId || (alloc as any).feeHeadId || "");
              if (allocInstId === instId1 || allocInstId === instId2 || allocInstId === instId3 || allocInstId === i.id) return true;
              return Boolean(itemLower && itemLower.length > 3 && head.includes(itemLower));
            });
          }

          return false;
        })
      );

      return isPaidInFinance;
    });

    if (returnedPaidIssues.length === 0) return 0;

    return returnedPaidIssues.reduce((sum, item) => {
      const isPkg =
        item.type === "Base Package" ||
        (item.itemName &&
          (item.itemName.toLowerCase().includes("package") ||
            item.itemName.toLowerCase().includes("base")));
      // Use the stored price first — this is the most accurate value
      let unitPrice = item.price && item.price > 0 && item.price !== 35 && item.price !== 85 ? item.price : 0;
      if (unitPrice <= 0) {
        if (isPkg) {
          unitPrice =
            getUniformFeeForClass(
              selectedStudent.className,
              selectedStudent.gender,
              financeUniformConfigs,
            ) || 0;
        } else {
          // Strip (#N) suffix when looking up finance config price
          const cleanItemName = (item.itemName || "").replace(/\(#\d+\)/g, "").trim();
          const catItem = (studentUniformIssues || []).find(
            (u) => u.category === cleanItemName || u.name === cleanItemName,
          );
          unitPrice =
            getItemFeeFromFinanceConfig(
              selectedStudent.className,
              cleanItemName,
              selectedStudent.gender,
              financeUniformConfigs,
              catItem?.price,
            ) || 0;
        }
      }
      return sum + unitPrice * (item.quantity || 1);
    }, 0);
  })();

  const handlePaymentModeChange = (mode: FeePayment["paymentMode"] | "") => {
    setPaymentMode(mode);
    if (mode === "Cash") {
      setTransactionId("");
      setChequeNo("");
      setChequeDate("");
      setBankName("");
    } else if (mode === "Online" || mode === "Card") {
      setChequeNo("");
      setChequeDate("");
      setBankName("");
    } else if (mode === "Cheque") {
      setTransactionId("");
    }
  };

  // Use real enrolled students master roster, supplementing with non-duplicated admissions if any
  const allEnrolledStudents = React.useMemo(() => {
    const map = new Map<string, Student>();

    // 1. Primary source for enrolled students: Enrolled admissions (e.g. REG-2044)
    (admissions || [])
      .filter((adm) => adm && adm.status !== "Rejected")
      .forEach((adm) => {
        const admId = adm.id || adm.applicationNo || adm.registrationNo;
        const admNo = (adm as any).admissionNo || (adm as any).admissionNumber || adm.registrationNo || adm.applicationNo || adm.id;
        if (!admNo) return;
        const fullName = (adm.applicantName || adm.studentName || (adm as any).applicantFullName || `${adm.firstName || ''} ${adm.lastName || ''}`).trim();
        if (!fullName) return;

        const nameKey = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nameParts = fullName.split(" ");
        const fName = adm.firstName || nameParts[0] || "Student";
        const lName = adm.lastName || nameParts.slice(1).join(" ") || "";
        const targetCls = adm.appliedClass || (adm as any).appliedClassGrade || adm.targetClass || adm.className || "Class 1";

        map.set(nameKey, {
          id: String(admId),
          firstName: fName,
          lastName: lName,
          admissionNo: admNo,
          className: targetCls,
          section: adm.section || "A",
          gender: adm.gender || "Male",
          studentType: (adm.residentialStatus === "Residential" || adm.studentType === "Residential") ? "Hosteller" : "Day Scholar",
          residentialStatus: adm.residentialStatus || adm.studentType || "Non-Residential",
          joiningDate: adm.admissionDate || (adm as any).createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
          dueFee: 0,
          paidFee: 0,
          totalFee: 0,
          rollNo: "0",
          fatherName: adm.parentName || adm.fatherName || (adm as any).fatherFullName || "",
          motherName: adm.motherName || (adm as any).motherFullName || "",
          mobile: adm.mobile || adm.phone || (adm as any).fatherContact || "",
          email: adm.email || (adm as any).parentEmail || "",
          address: adm.address || (adm as any).areaLocality || "",
          status: "Active",
          academicYear: adm.academicYear || selectedAcademicYear || "",
          academicYear: adm.academicYear || selectedAcademicYear || "2026-2027",
          branch: adm.branch || (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" ? selectedBranch : "") || "",
          selectedOptionalFees: adm.selectedOptionalFees || [],
          // Preserve dynamic transport assignment information
          transportRequired: Boolean(adm.transportRequired),
          transportType: adm.transportType || "AC",
          busRoute: adm.busRoute || (adm as any).routeName || "",
          pickupPoint: adm.pickupPoint || (adm as any).pickupPointName || (adm as any).pickupName || "",
          routeId: (adm as any).routeId || "",
          pickupPointId: (adm as any).pickupPointId || "",
          registrationNo: adm.registrationNo || (adm as any).registrationNumber || "",
          applicationNo: adm.applicationNo || (adm as any).applicationId || "",
          hostelSharing: (adm as any).hostelSharing || (adm as any).roomSharing || (adm as any).roomType || "",
          hostelAc: (adm as any).hostelAc || (adm as any).acType || "",
          hostelSecurityDepositPaid: Boolean((adm as any).hostelSecurityDepositPaid),
        } as unknown as Student);
      });

    // 2. Secondary source: Master database students, skipping legacy dummy ADM-2026-2020 or students already present
    (students || [])
      .filter((s) => s && (!s.status || s.status === "Active" || s.status === "Enrolled"))
      .forEach((s) => {
        if (!s) return;
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || (s as any).studentName || '';
        const nameKey = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (nameKey && map.has(nameKey)) {
          const existing = map.get(nameKey)!;
          map.set(nameKey, {
            ...s,
            ...existing,
            transportRequired: existing.transportRequired ?? (s as any).transportRequired,
            busRoute: existing.busRoute || (s as any).busRoute,
            pickupPoint: existing.pickupPoint || (s as any).pickupPoint,
            transportType: existing.transportType || (s as any).transportType,
            routeId: (existing as any).routeId || (s as any).routeId,
            pickupPointId: (existing as any).pickupPointId || (s as any).pickupPointId,
          });
          return;
        }

        const admKey = (s.admissionNo || s.id || "").toLowerCase().trim();
        if (admKey) {
          map.set(admKey, s);
        }
      });

    return Array.from(map.values());
  }, [students, admissions, selectedBranch]);

  const uniqueClassNames = React.useMemo(() => {
    const set = new Set<string>();
    allEnrolledStudents.forEach((s) => {
      if (s.className) set.add(String(s.className).trim());
    });
    return Array.from(set).sort((a, b) => compareClassesAscending(a, b));
  }, [allEnrolledStudents]);

  const uniqueSections = React.useMemo(() => {
    const set = new Set<string>();
    allEnrolledStudents.forEach((s) => {
      if (s.section) set.add(String(s.section).trim());
    });
    return Array.from(set).sort();
  }, [allEnrolledStudents]);

  const filteredStudents = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allEnrolledStudents
      .filter((s) => {
        const nameMatch =
          !q ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          (s.admissionNo || "").toLowerCase().includes(q) ||
          (s.id || "").toLowerCase().includes(q);

        const classMatch =
          selectedClass === "ALL" ||
          matchesClassName(s.className, selectedClass);

        const sectionMatch =
          selectedSection === "ALL" ||
          String(s.section || "").toLowerCase() === selectedSection.toLowerCase();

        return nameMatch && classMatch && sectionMatch;
      })
      .sort((a, b) => {
        const classComp = compareClassesAscending(a.className, b.className);
        if (classComp !== 0) return classComp;
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim() || (a as any).studentName || a.name || '';
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim() || (b as any).studentName || b.name || '';
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [allEnrolledStudents, searchQuery, selectedClass, selectedSection]);

  const displayedHistoryPayments = React.useMemo(() => {
    if (!feePayments || feePayments.length === 0) return [];
    const targetStudent = selectedStudent;
    const sid = targetStudent ? String(targetStudent.id).toLowerCase().trim() : '';
    const adm = String(targetStudent?.admissionNo || '').toLowerCase().trim();
    const app = String((targetStudent as any)?.applicationNo || '').toLowerCase().trim();
    const reg = String((targetStudent as any)?.registrationNo || '').toLowerCase().trim();
    const seen = new Set<string>();
    return feePayments.filter((p) => {
      if (targetStudent) {
        const pid = String(p.studentId || '').toLowerCase().trim();
        const padm = String((p as any).admissionNo || '').toLowerCase().trim();
        const match =
          (sid && (pid === sid || padm === sid)) ||
          (adm && (pid === adm || padm === adm)) ||
          (app && (pid === app || padm === app)) ||
          (reg && (pid === reg || padm === reg));
        if (!match) return false;
      }
      const key = (p.receiptNo && String(p.receiptNo).trim())
        ? `REC_${String(p.receiptNo).trim()}`
        : `ID_${String(p.id).trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [feePayments, selectedStudent]);

  const displayedRecentPayments = React.useMemo(() => {
    return displayedHistoryPayments.slice(0, 3);
  }, [displayedHistoryPayments]);

  const updateCalculation = (
    studentId: string,
    freshCalcResult = calculateStudentPayableFee(studentId),
    ledgerOverride?: StudentFeeLedger,
  ) => {
    const targetStudent =
      (selectedStudent && (selectedStudent.id === studentId || selectedStudent.admissionNo === studentId))
        ? selectedStudent
        : allEnrolledStudents.find(
            (s) => s?.id === studentId || s?.admissionNo === studentId,
          ) || selectedStudent;

    let calc = freshCalcResult;
    const ledger = ledgerOverride || getStudentFeeLedger(studentId, targetStudent || undefined, currentYear);

    // Fallback fee calculation if freshCalcResult is null
    if (!calc) {
      const dfs = (dynamicFeeStructures || []).find((d) =>
        matchesClassName(d.className, targetStudent?.className),
      );
      const feeVal = dfs?.totalAmount ?? 0;
      calc = {
        baseFee: feeVal,
        transportFee: 0,
        hostelFee: 0,
        fineAmount: 0,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        totalPayable: feeVal,
        assignedFeeHeads: [],
      } as any;
    }

    if (ledger && calc) {
      const scholarshipAmt =
        ledger.scholarshipAmount || ledger.totalScholarship || 0;
      const discountAmt = ledger.discountAmount || ledger.totalDiscount || 0;

      const fineAmt = isFineWaived ? 0 : (calc.fineAmount || 0);
      const hasTrpInLedger = Boolean(
        ledger.feeItems?.some(
          (i) =>
            i.isApplicable &&
            (i.headId === "FH-TRP" ||
              (i.category || "").toLowerCase().includes("transport") ||
              (i.headName || "").toLowerCase().includes("transport")) &&
            (i.finalAmount || i.originalAmount || 0) > 0,
        ),
      );
      const extraTrp = !hasTrpInLedger && (calc.transportFee || 0) > 0 ? (calc.transportFee || 0) : 0;
      const baseGross =
        ledger.grossAmount || ledger.totalOriginalAmount || (
          (calc.baseFee || 0) +
          (calc.transportFee || 0) +
          (calc.hostelFee || 0) +
          (calc.uniformFee || 0)
        );
      const grossAmt = baseGross + extraTrp;
      const updatedTotalPayable = Math.max(
        0,
        grossAmt + fineAmt - scholarshipAmt - discountAmt,
      );
      const updatedDueBalance = Math.max(
        0,
        updatedTotalPayable - (calc.paidAmount || 0),
      );

      calc = {
        ...calc,
        baseFee: ledger.totalOriginalAmount || calc.baseFee || grossAmt,
        scholarshipId: ledger.scholarshipId,
        scholarshipName: ledger.scholarshipName,
        scholarshipDescription: ledger.scholarshipDescription,
        scholarshipDeduction: scholarshipAmt,
        discountId: ledger.discountId,
        discountName: ledger.discountName,
        discountDescription: ledger.discountDescription,
        discountDeduction: discountAmt,
        totalPayable: updatedTotalPayable,
        dueBalance: updatedDueBalance,
      };
    }
    setCalcResult(calc);
    if (calc && studentId) {
      setSelectedInstallments([]);
      setCustomCollectionAmounts({});
    }
  };

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setIsFineWaived(false);
    setTempScholarshipId("");
    setTempDiscountId("");
    setSelectedInstallments([]);
    setCustomCollectionAmounts({});
    setPaymentMode("Cash");
    const freshLedger = getStudentFeeLedger(st.id, st, currentYear);
    updateCalculation(st.id, calculateStudentPayableFee(st.id), freshLedger);
  };

  const lastInitialStudentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialStudent) {
      const studentKey = typeof initialStudent === "string" 
        ? initialStudent 
        : (initialStudent.id || initialStudent.admissionNo);
      if (studentKey && lastInitialStudentIdRef.current !== studentKey) {
        lastInitialStudentIdRef.current = studentKey;
        const matched =
          allEnrolledStudents.find(
            (s) =>
              s.id === studentKey ||
              s.admissionNo === studentKey ||
              (typeof initialStudent === "object" && (s.id === initialStudent.id || s.admissionNo === initialStudent.admissionNo)),
          ) || (typeof initialStudent === "object" ? initialStudent : null);
        if (matched) {
          handleSelectStudent(matched);
        }
      }
    } else if (!initialStudent) {
      lastInitialStudentIdRef.current = null;
    }

    // Auto-select student when navigated via edu_fee_pay_target (e.g. from Admissions 'Pay Hostel Security Deposit')
    try {
      const storedPayTarget = sessionStorage.getItem('edu_fee_pay_target');
      if (storedPayTarget) {
        const parsed = JSON.parse(storedPayTarget);
        const sKey = String(parsed.studentId || parsed.admissionNo || '').trim().toLowerCase();
        const sName = String(parsed.studentName || '').trim().toLowerCase();
        const matched = allEnrolledStudents.find((s) => {
          const sid = String(s.id || '').trim().toLowerCase();
          const adm = String(s.admissionNo || '').trim().toLowerCase();
          const name = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
          return (sKey && (sid === sKey || adm === sKey)) || (sName && (name === sName || name.includes(sName)));
        });
        if (matched) {
          const isHostelTarget =
            parsed.feeHead === "Hostel Security Deposit" ||
            parsed.feeCategory === "Hostel Fee" ||
            parsed.source === "admission_security_deposit" ||
            parsed.studentType === "Residential";

          const studentWithResidential = isHostelTarget
            ? {
                ...matched,
                studentType: "Hosteller",
                residentialStatus: "Residential",
                hostelSharing: parsed.hostelSharing || (matched as any).hostelSharing,
                hostelAc: parsed.hostelAc || (matched as any).hostelAc,
                hostelBlock: parsed.hostelBlock || (matched as any).hostelBlock,
              }
            : matched;

          handleSelectStudent(studentWithResidential as any);

          if (isHostelTarget && updateStudent && matched.id) {
            updateStudent(matched.id, {
              studentType: "Hosteller",
              residentialStatus: "Residential",
            } as any);
          }
        }
      }
    } catch (e) {}
  }, [initialStudent, allEnrolledStudents]);

  const handleApplyScholarship = (scholarshipId: string) => {
    if (!selectedStudent || !calcResult) return;
    try {
      const updatedLedger = applyScholarshipToStudent(
        selectedStudent.id,
        scholarshipId,
      );
      updateCalculation(selectedStudent.id, undefined, updatedLedger);
      setTempScholarshipId("");
      addToast(
        "success",
        "Scholarship Applied",
        "Successfully applied scholarship.",
      );
    } catch (err: any) {
      addToast(
        "warning",
        "Already Applied",
        err.message || "Scholarship has already been applied.",
      );
    }
  };

  const handleRemoveScholarship = () => {
    if (!selectedStudent) return;
    try {
      const updatedLedger = removeScholarshipFromStudent(selectedStudent.id);
      updateCalculation(selectedStudent.id, undefined, updatedLedger);
      setTempScholarshipId("");
      addToast("info", "Scholarship Removed", "Removed scholarship.");
    } catch (err: any) {
      addToast(
        "warning",
        "Error",
        err.message || "Failed to remove scholarship.",
      );
    }
  };

  const handleApplyDiscount = (discountId: string) => {
    if (!selectedStudent || !calcResult) return;
    try {
      const updatedLedger = applyDiscountToStudent(
        selectedStudent.id,
        discountId,
      );
      updateCalculation(selectedStudent.id, undefined, updatedLedger);
      setTempDiscountId("");
      addToast("success", "Discount Applied", "Successfully applied discount.");
    } catch (err: any) {
      addToast(
        "warning",
        "Already Applied",
        err.message || "Discount has already been applied.",
      );
    }
  };

  const handleRemoveDiscount = () => {
    if (!selectedStudent) return;
    try {
      const updatedLedger = removeDiscountFromStudent(selectedStudent.id);
      updateCalculation(selectedStudent.id, undefined, updatedLedger);
      setTempDiscountId("");
      addToast("info", "Discount Removed", "Removed discount.");
    } catch (err: any) {
      addToast("warning", "Error", err.message || "Failed to remove discount.");
    }
  };

  const handleCustomAmountChange = (id: string, valStr: string) => {
    if (valStr === "" || /^\d*\.?\d*$/.test(valStr)) {
      setCustomCollectionAmounts((prev) => ({
        ...prev,
        [id]: valStr,
      }));
    }
  };

  const getInstallmentCollectionAmount = (inst: any): number => {
    if (!selectedInstallments.includes(inst.id)) return 0;
    const valStr = customCollectionAmounts[inst.id];
    if (valStr === undefined || valStr === "") return inst.dueAmount;
    const num = Number(valStr);
    return isNaN(num) ? 0 : num;
  };

  const getInstallmentAmountError = (inst: any): string | null => {
    if (!selectedInstallments.includes(inst.id)) return null;
    const valStr = customCollectionAmounts[inst.id];
    if (valStr === undefined) return null;
    if (valStr.trim() === "") return "Please enter collection amount.";
    const num = Number(valStr);
    if (isNaN(num) || num <= 0)
      return "Collection amount must be greater than ₹0.";
    if (num > inst.dueAmount)
      return `Collection amount cannot exceed pending amount of ${formatCurrency(inst.dueAmount)}.`;
    return null;
  };

  const handleSubmitPayment = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedStudent || !calcResult) return;

    if (totalOutstanding <= 0 || allInstallments.every((i) => i.dueAmount <= 0)) {
      addToast(
        "warning",
        "Fees Fully Paid",
        "All fees for this student are already fully paid. No further payments can be collected.",
      );
      return;
    }

    if (selectedInstallments.length === 0) {
      addToast(
        "warning",
        "Selection Required",
        "Please select at least one pending fee component to collect.",
      );
      return;
    }

    if (amountPaying <= 0) {
      addToast(
        "warning",
        "Invalid Amount",
        "Please enter a valid payment amount greater than ₹0.",
      );
      return;
    }

    if (amountPaying > computedNetPayable) {
      addToast(
        "error",
        "Amount Exceeds Dues",
        `Paying amount cannot exceed the selected net payable amount of ${formatCurrency(computedNetPayable)}.`,
      );
      return;
    }

    if (!isFormValid) {
      addToast(
        "warning",
        "Validation Error",
        validationMessage || "Please complete all required fields correctly.",
      );
      return;
    }

    const activeMode = (paymentMode && paymentMode.trim() !== "") ? paymentMode : "Cash";
    if (paymentMode !== activeMode) {
      setPaymentMode(activeMode);
    }

    setShowPaymentConfirmModal(true);
  };

  const executeProcessPayment = async () => {
    if (!selectedStudent || !calcResult || isProcessingPayment) return;
    if (totalOutstanding <= 0 || allInstallments.every((i) => i.dueAmount <= 0) || selectedInstallments.length === 0 || amountPaying <= 0) {
      addToast(
        "warning",
        "Operation Blocked",
        "All fees for this student are already paid or no fee component is selected.",
      );
      setShowPaymentConfirmModal(false);
      return;
    }
    if (amountPaying > computedNetPayable || isCustomExceeding) {
      addToast(
        "error",
        "Amount Exceeds Dues",
        `Paying amount cannot exceed the selected net payable amount of ${formatCurrency(computedNetPayable)}.`,
      );
      setShowPaymentConfirmModal(false);
      return;
    }
    setIsProcessingPayment(true);
    setShowPaymentConfirmModal(false);

    const numericAmount = amountPaying;

    let remainingPaid = numericAmount;
    const paymentAllocations = selectedInstallments.map((id) => {
      const inst = allInstallments.find((i: any) => i.id === id);
      const customAmt = inst ? getInstallmentCollectionAmount(inst) : 0;
      const allocAmt = Math.min(customAmt, remainingPaid);
      remainingPaid = Math.max(0, remainingPaid - allocAmt);
      return {
        academicYear: inst?.academicYear || currentYear,
        ledgerId: undefined,
        amount: allocAmt,
        installmentId: id,
        feeHeadName: inst?.feeHeadName || inst?.headName || inst?.title || inst?.category || "Tuition Fee",
        termName: inst?.termName || inst?.termId || "Installment",
      };
    });

    const activeMode = (paymentMode && paymentMode.trim() !== "") ? paymentMode : "Cash";
    const concessionTitle = allConcessionOptions.find(c => c.id === selectedConcessionId)?.name || "";

    const payment = addFeePayment({
      studentId: selectedStudent.id,
      admissionNo: selectedStudent.admissionNo || (selectedStudent as any).registrationNo || (selectedStudent as any).applicationNo,
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
      className: `${selectedStudent.className}-${selectedStudent.section}`,
      amountPaid: numericAmount,
      discount: effectiveDiscountAmount,
      fine: effectiveFineAmount,
      paymentMode: activeMode as FeePayment["paymentMode"],
      transactionId:
        activeMode === "Cheque"
          ? chequeNo
          : activeMode !== "Cash"
            ? transactionId
            : undefined,
      chequeNo: activeMode === "Cheque" ? chequeNo : undefined,
      chequeDate: activeMode === "Cheque" ? chequeDate : undefined,
      bankName: activeMode === "Cheque" ? bankName : undefined,
      paymentDate: new Date().toISOString().split("T")[0],
      status: numericAmount >= totalOutstanding ? "Paid" : "Partial",
      remarks: remarks 
        ? (concessionTitle && !remarks.includes(concessionTitle) ? `${remarks} | Concession Applied (${concessionTitle})` : remarks)
        : (fineReason || (concessionTitle ? `Concession Applied (${concessionTitle})` : "Fee Collection Receipt")),
      scholarshipId: selectedConcessionId,
      scholarshipName: concessionTitle,
      scholarshipDescription: "",
      scholarshipAmount: effectiveDiscountAmount,
      discountId: selectedConcessionId,
      discountName: concessionTitle,
      discountDescription: "",
      discountAmount: effectiveDiscountAmount,
      grossAmount: baseSelectedAmount,
      previousDue: previousYearPending,
      totalOutstanding: totalOutstanding,
      selectedInstallmentIds: selectedInstallments,
      paymentAllocation: paymentAllocations,
    });

    // Mark uniform items as Paid in studentUniformIssues if collected
    if (updateStudentUniformIssue) {
      selectedInstallments.forEach((instId) => {
        if (instId.startsWith("INST-UNIF-EXTRA-")) {
          const rawIssueId = instId.replace("INST-UNIF-EXTRA-", "");
          const targetIssue = (studentUniformIssues || []).find((i) => i.id === rawIssueId);
          if (targetIssue && !targetIssue.replacementDate && !targetIssue.notes?.toLowerCase().includes('exchanged') && targetIssue.status !== 'Returned' && targetIssue.status !== 'Cancelled') {
            updateStudentUniformIssue(rawIssueId, {
              status: "Paid" as any,
              notes: `Fees Paid at Counter (${paymentMode}) — Receipt #${receiptNumber}`,
            });
          }
        } else if (instId.startsWith("INST-UNIF-BASE-") || instId.startsWith("INST-UNIF-") || instId === "FH-04" || instId === "FH-UNI-BASE") {
          const cleanId = instId.replace("INST-UNIF-BASE-", "").replace("INST-UNIF-", "").split("-")[0];
          const baseIssue = (studentUniformIssues || []).find(
            (i) => (i.id === cleanId || i.studentId === selectedStudent.id || (selectedStudent.admissionNo && i.admissionNo === selectedStudent.admissionNo))
              && !i.replacementDate && !i.notes?.toLowerCase().includes('exchanged') && i.status !== 'Returned' && i.status !== 'Cancelled'
          );
          if (baseIssue) {
            updateStudentUniformIssue(baseIssue.id, {
              status: "Paid" as any,
              notes: `Fees Paid at Counter (${paymentMode}) — Receipt #${receiptNumber}`,
            });
          } else if (addStudentUniformIssue) {
            addStudentUniformIssue({
              studentId: selectedStudent.id,
              studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
              admissionNo: selectedStudent.admissionNo || "ADM2026-000",
              className: selectedStudent.className || "Class 4",
              section: selectedStudent.section || "A",
              itemId: `pkg_${selectedStudent.className}`,
              itemName: `${selectedStudent.gender === 'Female' ? 'Girls' : 'Boys'} Base Package (Admission Kit)`,
              size: "M",
              quantity: 1,
              issueDate: new Date().toISOString().split("T")[0],
              status: "Paid" as any,
              academicYear: selectedAcademicYear || financeSettings.academicYear || "",
              type: "Base Package",
              price: paidAmount,
              notes: `Fees Paid at Counter (${paymentMode}) — Receipt #${receiptNumber}`,
            });
          }
        }
      });
    }

    // Mark unpaid library fines as Paid in edu_db_library_fines if collected
    try {
      const s = localStorage.getItem("edu_db_library_fines");
      if (s) {
        const fines = JSON.parse(s);
        const stAdm = selectedStudent.admissionNo || selectedStudent.id;
        const stFullName = `${selectedStudent.firstName} ${selectedStudent.lastName}`.toLowerCase();
        const updatedFines = fines.map((f: any) => {
          if (
            f.paymentStatus === "Unpaid" &&
            (f.memberId === selectedStudent.id ||
              f.memberId === stAdm ||
              (f.memberName || "").toLowerCase() === stFullName)
          ) {
            return {
              ...f,
              paymentStatus: "Paid",
              paidDate: new Date().toISOString().split("T")[0],
              remarks: "Paid via Admin Fee Collection",
            };
          }
          return f;
        });
        localStorage.setItem("edu_db_library_fines", JSON.stringify(updatedFines));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("library_fines_updated"));
        }
      }
    } catch {
      // ignore
    }

    // Check if Hostel Security Deposit was paid in this transaction
    const isSecurityDepositCollected =
      selectedInstallments.some((id) => id === "FH-HST-DEP" || id.includes("FH-HST-DEP")) ||
      paymentAllocations.some((a) => (a.feeHeadName || "").toLowerCase().includes("security deposit")) ||
      (remarks && remarks.toLowerCase().includes("security deposit"));

    if (isSecurityDepositCollected) {
      try {
        const targetAdm = (admissions || []).find((a) =>
          String(a.id) === String(selectedStudent.id) ||
          (selectedStudent.admissionNo && (String(a.admissionNo) === String(selectedStudent.admissionNo) || String(a.applicationNo) === String(selectedStudent.admissionNo) || String(a.registrationNo) === String(selectedStudent.admissionNo)))
        );
        if (targetAdm && updateAdmission) {
          updateAdmission(targetAdm.id, { hostelSecurityDepositPaid: true } as any);
        }

        if (selectedStudent.id && updateStudent) {
          updateStudent(selectedStudent.id, {
            hostelSecurityDepositPaid: true,
            studentType: "Hosteller",
            residentialStatus: "Residential",
          } as any);
        }

        const rawAdmStr = localStorage.getItem("edu_db_admissions");
        if (rawAdmStr) {
          const rawAdms = JSON.parse(rawAdmStr);
          const updatedRawAdms = rawAdms.map((a: any) => {
            const matchesAdm =
              String(a.id) === String(selectedStudent.id) ||
              (selectedStudent.admissionNo && (String(a.admissionNo) === String(selectedStudent.admissionNo) || String(a.applicationNo) === String(selectedStudent.admissionNo) || String(a.registrationNo) === String(selectedStudent.admissionNo)));
            return matchesAdm ? { ...a, hostelSecurityDepositPaid: true, studentType: "Residential", residentialStatus: "Residential" } : a;
          });
          localStorage.setItem("edu_db_admissions", JSON.stringify(updatedRawAdms));
        }

        const rawStStr = localStorage.getItem("edu_db_students");
        if (rawStStr) {
          const rawSts = JSON.parse(rawStStr);
          const updatedRawSts = rawSts.map((s: any) => {
            const matchesSt =
              String(s.id) === String(selectedStudent.id) ||
              (selectedStudent.admissionNo && String(s.admissionNo) === String(selectedStudent.admissionNo));
            return matchesSt ? { ...s, hostelSecurityDepositPaid: true, studentType: "Hosteller", residentialStatus: "Residential" } : s;
          });
          localStorage.setItem("edu_db_students", JSON.stringify(updatedRawSts));
        }

        setSelectedStudent((prev: any) => (prev ? { ...prev, hostelSecurityDepositPaid: true, studentType: "Hosteller", residentialStatus: "Residential" } : prev));
        sessionStorage.removeItem("edu_fee_pay_target");

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("residential_students_updated"));
          window.dispatchEvent(new CustomEvent("hostel_allocations_updated"));
          window.dispatchEvent(new CustomEvent("hostel_students_updated"));
          window.dispatchEvent(new CustomEvent("students_updated"));
          window.dispatchEvent(new CustomEvent("finance_data_updated"));
        }
        addToast(
          "success",
          "Hostel Security Deposit Settled",
          "Security deposit received! Student is now eligible for room & bed allocation in Hostel Management.",
        );
      } catch (err) {
        console.warn("Failed to set hostelSecurityDepositPaid flag", err);
      }
    }

    addToast(
      "success",
      "Payment Processed",
      `Issued official receipt ${payment.receiptNo} for ${formatCurrency(numericAmount)}`,
    );
    onPrintReceipt(payment);

    fetchFinanceData().catch(() => {});

    setSelectedInstallments([]);
    setCustomCollectionAmounts({});

    // Immediate reactive feedback on calcResult
    if (calcResult) {
      const newPaid = (calcResult.paidAmount || 0) + numericAmount;
      const newDue = Math.max(0, (calcResult.dueBalance ?? calcResult.totalPayable ?? 0) - numericAmount);
      setCalcResult({
        ...calcResult,
        paidAmount: newPaid,
        dueBalance: newDue,
      });
    }

    const updatedStudent =
      students.find(
        (s) =>
          s.id === selectedStudent.id ||
          (selectedStudent.admissionNo &&
            s.admissionNo === selectedStudent.admissionNo),
      ) || selectedStudent;
    setSelectedStudent({
      ...updatedStudent,
      paidFee: (updatedStudent.paidFee || 0) + numericAmount,
      dueFee: Math.max(0, (updatedStudent.dueFee ?? calcResult?.dueBalance ?? numericAmount) - numericAmount),
    });

    updateCalculation(selectedStudent.id);

    setPaymentMode("Cash");
    setTransactionId("");
    setChequeNo("");
    setChequeDate("");
    setBankName("");
    setRemarks("");
    setFineAmountInput("0");
    setFineReason("");
    setSelectedConcessionId("");
    setDiscountAmountInput("0");
    setCustomAmountReceived("");
    setIsProcessingPayment(false);
  };

  useEffect(() => {
    if (selectedStudent) {
      updateCalculation(selectedStudent.id);
    }
  }, [
    feePayments,
    selectedStudent?.id,
    routeMasters,
    pickupPoints,
    studentTransports,
    admissions,
    studentFeeLedgers,
  ]);

  const getInstallmentStatus = (dueAmount: number, dueDate: string, instStatus?: string) => {
    if (instStatus === "Cancelled") return "CANCELLED";
    if (dueAmount <= 0) return "PAID";
    const todayStr = new Date().toISOString().split("T")[0];
    if (todayStr > dueDate) return "OVERDUE";
    return "UPCOMING";
  };

  const currentYear =
    selectedAcademicYear || financeSettings?.academicYear || "";

  const allInstallments = React.useMemo(() => {
    if (!selectedStudent) return [];

    // 1. Fetch ledger from getStudentFeeLedger which handles dynamic generation & admissions lookup
    const ledger = getStudentFeeLedger(selectedStudent.id, selectedStudent, currentYear);
    let ledgerInstallments = ledger?.installments || [];

    // If ledgerInstallments is empty, construct installment checkboxes directly from ledger.feeItems
    if (
      ledgerInstallments.length === 0 &&
      ledger?.feeItems &&
      ledger.feeItems.length > 0
    ) {
      let remainingPaid = (feePayments || [])
        .filter((p) => {
          const pSid = String(p.studentId || "").trim().toLowerCase();
          const sId = String(selectedStudent.id || "").trim().toLowerCase();
          const admNo = String(selectedStudent.admissionNo || "").trim().toLowerCase();
          return pSid === sId || (admNo && pSid === admNo);
        })
        .reduce((sum, p) => sum + (Number(p.amountPaid ?? (p as any).amount) || 0), 0);

      ledgerInstallments = ledger.feeItems
        .filter((item) => item.isApplicable && item.finalAmount > 0)
        .map((item, idx) => {
          const itemAmt = item.finalAmount > 0 ? item.finalAmount : item.originalAmount;
          const paidForThis = Math.min(itemAmt, remainingPaid);
          remainingPaid = Math.max(0, remainingPaid - paidForThis);
          const dueForThis = Math.max(0, itemAmt - paidForThis);

          return {
            id: `INST-FEE-${selectedStudent.id}-${item.headId || idx}`,
            studentId: selectedStudent.id,
            academicYear: currentYear,
            feeAssignmentId: `FA-LEAD-${selectedStudent.id}`,
            feeHeadId: item.headId || `FH-${idx}`,
            feeHeadName: item.headName,
            frequency: "One Time",
            termName: item.category || item.headName,
            dueDate: new Date().toISOString().split("T")[0],
            amount: item.originalAmount,
            paidAmount: paidForThis,
            dueAmount: dueForThis,
            status: dueForThis === 0 ? "Paid" : paidForThis > 0 ? "Partial" : "Pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });
    }

    const admRecord = (admissions || []).find((a) => {
      if (!a) return false;
      const sId = selectedStudent.id != null ? String(selectedStudent.id).toLowerCase().trim() : '';
      const sAdm = selectedStudent.admissionNo ? String(selectedStudent.admissionNo).toLowerCase().trim() : '';
      const sReg = (selectedStudent as any).registrationNo ? String((selectedStudent as any).registrationNo).toLowerCase().trim() : '';
      const sApp = (selectedStudent as any).applicationNo ? String((selectedStudent as any).applicationNo).toLowerCase().trim() : '';
      const sName = `${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.toLowerCase().trim();

      const aId = a.id != null ? String(a.id).toLowerCase().trim() : '';
      const aApp = a.applicationNo ? String(a.applicationNo).toLowerCase().trim() : ((a as any).applicationId != null ? String((a as any).applicationId).toLowerCase().trim() : '');
      const aReg = a.registrationNo ? String(a.registrationNo).toLowerCase().trim() : ((a as any).registrationNumber ? String((a as any).registrationNumber).toLowerCase().trim() : '');
      const aAdm = (a as any).admissionNo ? String((a as any).admissionNo).toLowerCase().trim() : ((a as any).admissionNumber ? String((a as any).admissionNumber).toLowerCase().trim() : '');
      const aName = (a.applicantName || (a as any).studentName || (a as any).applicantFullName || `${a.firstName || ''} ${a.lastName || ''}`).toLowerCase().trim();

      if (sAdm && sAdm !== 'n/a' && (sAdm === aAdm || sAdm === aApp || sAdm === aReg || sAdm === aId)) return true;
      if (sReg && sReg !== 'n/a' && (sReg === aReg || sReg === aAdm || sReg === aApp)) return true;
      if (sApp && sApp !== 'n/a' && (sApp === aApp || sApp === aAdm || sApp === aReg)) return true;
      if (sId && sId !== 'n/a' && (sId === aId || sId === aApp || sId === aReg || sId === aAdm)) return true;
      if (sName && sName !== 'student' && aName && (sName === aName || sName.includes(aName) || aName.includes(sName))) return true;
      return false;
    });

    const isResidentStudent =
      isHostellerStudent ||
      selectedStudent?.studentType === "Hosteller" ||
      (selectedStudent as any)?.studentType === "Residential" ||
      (selectedStudent as any)?.residentialStatus === "Residential" ||
      (selectedStudent as any)?.residentialStatus === "Resident" ||
      admRecord?.studentType === "Residential" ||
      admRecord?.residentialStatus === "Residential" ||
      admRecord?.residentialStatus === "Resident";

    const isNonResidentStudent = !isResidentStudent;

    const optList = admRecord ? admRecord.selectedOptionalFees : (selectedStudent as any)?.selectedOptionalFees;

    const isExplicitlyOptedIn = Boolean(
      (admRecord as any)?.uniformOpted === true ||
      (admRecord as any)?.isUniformOpted === true ||
      (selectedStudent as any)?.uniformOpted === true ||
      (selectedStudent as any)?.isUniformOpted === true ||
      (Array.isArray(optList) &&
        optList.some((id) => {
          const s = String(id).toLowerCase();
          return (
            s === "fh-04" ||
            s === "fh-004" ||
            s === "fh-uni-base" ||
            s.includes("uniform") ||
            s.includes("kit")
          );
        }))
    );

    const isExplicitlyOptedOut = !isExplicitlyOptedIn;

    // 2. Filter baseline ledger installments based on Residential Status & Uniform Opt-In
    const combined: StudentFeeInstallment[] = ledgerInstallments.filter(
      (inst) => {
        const headLower = (inst.feeHeadName || "").toLowerCase();
        const termLower = (inst.termName || "").toLowerCase();
        const catLower = ((inst as any).category || "").toLowerCase();

        const isHostel =
          inst.feeHeadId === "FH-HST" ||
          inst.feeHeadId === "FH-HST-DEP" ||
          catLower.includes("hostel") ||
          headLower.includes("hostel") ||
          headLower.includes("security deposit") ||
          headLower.includes("bhanu block") ||
          termLower.includes("hostel") ||
          termLower.includes("bhanu block") ||
          termLower.includes("security deposit");

        const isTransport =
          inst.feeHeadId === "FH-TRP" ||
          catLower.includes("transport") ||
          headLower.includes("transport") ||
          termLower.includes("transport");

        // Rule 1: Non-Resident student -> DO NOT display Hostel Fee
        if (isNonResidentStudent && isHostel) {
          return false;
        }

        // Rule 2: Resident student -> DO NOT display Transport Fee
        if (isResidentStudent && isTransport) {
          return false;
        }

        // Rule 3: Hide non-applicable items (0 due amount & not applicable)
        if (inst.isApplicable === false && inst.dueAmount <= 0) {
          return false;
        }

        // Rule 4: If student DID NOT OPT for uniform fee at admission, hide default baseline uniform fee
        const isUnifHead = inst.feeHeadId === "FH-04" || inst.feeHeadId === "FH-UNI-BASE" || headLower.includes("uniform");
        if (isUnifHead && !isExplicitlyOptedIn && !inst.id.startsWith("INST-UNIF-EXTRA-") && !inst.id.startsWith("INST-UNIF-UIS-")) {
          return false;
        }

        const isExtraItem =
          termLower.includes("extra") ||
          termLower.includes("shoes") ||
          termLower.includes("tracksuit") ||
          termLower.includes("belt") ||
          termLower.includes("blazer");
        return !isExtraItem;
      },
    );

    // Ensure Transport Fee installment is present for Non-Resident students who opted for transport
    if (isNonResidentStudent) {
      const hasTransportInst = combined.some((c) => {
        const hLower = (c.feeHeadName || "").toLowerCase();
        const tLower = (c.termName || "").toLowerCase();
        return (c.feeHeadId === "FH-TRP" || hLower.includes("transport") || tLower.includes("transport")) && c.amount > 0;
      });

      if (!hasTransportInst) {
        // Purge any stale 0-amount or non-applicable transport installments
        for (let i = combined.length - 1; i >= 0; i--) {
          const item = combined[i];
          const hLower = (item.feeHeadName || "").toLowerCase();
          const tLower = (item.termName || "").toLowerCase();
          if (item.feeHeadId === "FH-TRP" || hLower.includes("transport") || tLower.includes("transport")) {
            combined.splice(i, 1);
          }
        }
      }

      const activeTa = (studentTransports || []).find(
        (t) =>
          t.status === "Active" &&
          (t.studentId === selectedStudent.id ||
            (selectedStudent.admissionNo && t.admissionNo === selectedStudent.admissionNo) ||
            (admRecord?.registrationNo && t.admissionNo === admRecord.registrationNo) ||
            ((admRecord as any)?.admissionNo && t.admissionNo === (admRecord as any).admissionNo) ||
            (t.studentName &&
              `${selectedStudent.firstName} ${selectedStudent.lastName}`.trim().toLowerCase() ===
                t.studentName.trim().toLowerCase())),
      );

      const isTrpRequired =
        Boolean(activeTa) ||
        selectedStudent.transportRequired === true ||
        Boolean((selectedStudent as any).busRoute || (selectedStudent as any).pickupPoint) ||
        admRecord?.transportRequired === true ||
        Boolean(admRecord?.busRoute || admRecord?.pickupPoint);

      const hasPickup = Boolean(
        activeTa?.pickupPoint ||
          (selectedStudent as any).pickupPoint ||
          admRecord?.pickupPoint,
      );

      if (!hasTransportInst && isTrpRequired && hasPickup) {
        const routeName =
          activeTa?.routeName ||
          (selectedStudent as any).busRoute ||
          admRecord?.busRoute ||
          "";
        const pickupName =
          activeTa?.pickupPoint ||
          (selectedStudent as any).pickupPoint ||
          admRecord?.pickupPoint ||
          "";
        const routeId =
          activeTa?.routeId ||
          (selectedStudent as any).routeId ||
          admRecord?.routeId ||
          "";
        const pickupPointId =
          (activeTa as any)?.pickupPointId ||
          (selectedStudent as any).pickupPointId ||
          admRecord?.pickupPointId ||
          "";
        const transportType =
          (activeTa as any)?.transportType ||
          (selectedStudent as any).transportType ||
          admRecord?.transportType ||
          "AC";

        const tempAssign = activeTa || {
          id: `STRP-AUTO-${selectedStudent.id}`,
          studentId: selectedStudent.id,
          studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
          admissionNo: selectedStudent.admissionNo || "",
          routeId,
          routeName,
          pickupPointId,
          pickupPoint: pickupName,
          transportType,
          feePlan: "Annual",
          status: "Active",
        };

        let trpFare = getDynamicTransportFee
          ? getDynamicTransportFee({ ...tempAssign, feePlan: "Annual" })
          : 0;

        if (trpFare <= 0) {
          const poolRoutes = (routeMasters && routeMasters.length > 0) ? routeMasters : (() => {
            try {
              const raw = localStorage.getItem("edu_db_route_masters") || localStorage.getItem("route_masters");
              return raw ? JSON.parse(raw) : [];
            } catch { return []; }
          })();
          const poolPoints = (pickupPoints && pickupPoints.length > 0) ? pickupPoints : (() => {
            try {
              const raw = localStorage.getItem("edu_db_pickup_points") || localStorage.getItem("pickup_points");
              return raw ? JSON.parse(raw) : [];
            } catch { return []; }
          })();

          const rObj = poolRoutes.find((r: any) => {
            const rNorm = String(r.routeName || r.routeCode || "").replace(/\s+/g, " ").trim().toLowerCase();
            const tNorm = String(routeName || "").replace(/\s+/g, " ").trim().toLowerCase();
            return (rNorm && tNorm && (rNorm === tNorm || rNorm.includes(tNorm) || tNorm.includes(rNorm)));
          });
          const pObj = poolPoints.find((p: any) => {
            const pNorm = String(p.pickupName || p.pickupPointName || "").replace(/\s+/g, " ").trim().toLowerCase();
            const tNorm = String(pickupName || "").replace(/\s+/g, " ").trim().toLowerCase();
            return (pNorm && tNorm && (pNorm === tNorm || pNorm.includes(tNorm) || tNorm.includes(pNorm)));
          });
          const isAC = String(transportType || "AC").toUpperCase().includes("AC") && !String(transportType || "AC").toUpperCase().includes("NON");
          if (rObj) {
            const baseFare = isAC ? Number(rObj.acMinBaseFare ?? (rObj as any).acBaseFare ?? 1500) : Number(rObj.minBaseFare ?? (rObj as any).nonAcBaseFare ?? 1200);
            const rateKm = isAC ? Number(rObj.acRatePerKm ?? (rObj as any).acRateAddlKm ?? 150) : Number(rObj.ratePerKm ?? (rObj as any).nonAcRatePerKm ?? 100);
            const dist = pObj ? Number(pObj.distanceFromSchoolKm ?? (pObj as any).distanceFromStart ?? 35) : 35;
            const minKm = Number(rObj.minDistanceKm ?? (rObj as any).minRangeKm ?? (rObj as any).minRange ?? 35);
            const addKm = Math.max(0, dist - minKm);
            const monthly = baseFare + addKm * rateKm;
            trpFare = monthly * 12;
          } else if (pObj && pObj.monthlyFee) {
            trpFare = Number(pObj.monthlyFee) * 12;
          } else if (routeName || pickupName) {
            const monthly = isAC ? 1500 : 1200;
            trpFare = monthly * 12;
          }
        }

        if (trpFare > 0) {
          const configuredTransportPolicy =
            (typeof window !== "undefined" &&
              window.localStorage?.getItem("transport_fee_billing_policy")) ||
            "Term-wise";

          const isFullAnnualStudent =
            ledger?.installments?.some((i: any) => i.termName?.toLowerCase().includes("full") || (i.frequency === "One Time" && !i.termName?.toLowerCase().includes("term"))) ||
            combined.some((i: any) => i.termName?.toLowerCase().includes("full") || (i.frequency === "One Time" && !i.termName?.toLowerCase().includes("term")));

          const isOneTimeBilling = configuredTransportPolicy === "One-Time" || isFullAnnualStudent;

          const paidTrpAmt = (feePayments || []).filter((p) => {
            const pSid = String(p.studentId || "").trim().toLowerCase();
            const sId = String(selectedStudent.id || "").trim().toLowerCase();
            const admNo = String(selectedStudent.admissionNo || "").trim().toLowerCase();
            if (pSid !== sId && (!admNo || pSid !== admNo)) return false;
            if (p.paymentAllocation && p.paymentAllocation.length > 0) {
              return p.paymentAllocation.some((alloc) => {
                const name = (alloc.feeHeadName || alloc.termName || "").toLowerCase();
                return name.includes("transport");
              });
            }
            return false;
          }).reduce((sum, p) => sum + (Number(p.amountPaid ?? (p as any).amount) || 0), 0);

          const termSchedule = (academicYearFeeSchedules || []).find(
            (s: any) => s.academicYear === currentYear,
          );
          const dynamicTerms = (termSchedule?.terms && termSchedule.terms.length > 0)
            ? termSchedule.terms
            : [
                { id: "1", termName: "Term 1", dueDate: `${currentYear.split('-')[0]}-06-15` },
                { id: "2", termName: "Term 2", dueDate: `${currentYear.split('-')[0]}-09-15` },
                { id: "3", termName: "Term 3", dueDate: `${currentYear.split('-')[0]}-12-15` },
                { id: "4", termName: "Term 4", dueDate: `${Number(currentYear.split('-')[0]) + 1}-03-15` },
              ];

          if (isOneTimeBilling) {
            const dueTrp = Math.max(0, trpFare - paidTrpAmt);
            combined.push({
              id: `INST-TRP-${selectedStudent.id}-annual`,
              studentId: selectedStudent.id,
              academicYear: currentYear,
              feeAssignmentId: `FA-TRP-${selectedStudent.id}`,
              feeHeadId: "FH-TRP",
              feeHeadName: `Transport Fee (${routeName} - ${pickupName})`,
              frequency: "One Time",
              termName: isFullAnnualStudent ? "Full Annual Fee" : `Transport Fee (${currentYear})`,
              dueDate: dynamicTerms[0]?.dueDate || new Date().toISOString().split("T")[0],
              amount: trpFare,
              paidAmount: Math.min(trpFare, paidTrpAmt),
              dueAmount: dueTrp,
              status: dueTrp === 0 ? "Paid" : paidTrpAmt > 0 ? "Partial" : "Pending",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            const count = Math.max(1, dynamicTerms.length);
            const baseTermAmt = Math.floor(trpFare / count);
            const remainder = trpFare - baseTermAmt * count;
            let remainingPaid = paidTrpAmt;

            dynamicTerms.forEach((t: any, tIdx: number) => {
              const termAmt = baseTermAmt + (tIdx < remainder ? 1 : 0);
              const paidForThis = Math.min(termAmt, remainingPaid);
              remainingPaid = Math.max(0, remainingPaid - paidForThis);
              const dueForThis = Math.max(0, termAmt - paidForThis);

              combined.push({
                id: `INST-TRP-${selectedStudent.id}-term-${t.id || tIdx + 1}`,
                studentId: selectedStudent.id,
                academicYear: currentYear,
                feeAssignmentId: `FA-TRP-${selectedStudent.id}`,
                feeHeadId: "FH-TRP",
                feeHeadName: `Transport Fee (${routeName} - ${pickupName})`,
                frequency: "Quarterly",
                termId: String(t.id || tIdx + 1),
                termName: `Transport Fee - ${t.termName || `Term ${tIdx + 1}`}`,
                dueDate: t.dueDate || new Date().toISOString().split("T")[0],
                amount: termAmt,
                paidAmount: paidForThis,
                dueAmount: dueForThis,
                status: dueForThis === 0 ? "Paid" : paidForThis > 0 ? "Partial" : "Pending",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            });
          }
        }
      }
    }

    // 3. Build Base Package & Additional Purchases STRICTLY from active studentUniformIssues (Uniform Distribution)
    const studentIssues = (studentUniformIssues || []).filter((issue) => {
      if (!issue) return false;
      const sId = selectedStudent.id ? String(selectedStudent.id).toLowerCase().trim() : '';
      const sAdm = selectedStudent.admissionNo ? String(selectedStudent.admissionNo).toLowerCase().trim() : '';
      const iId = issue.studentId ? String(issue.studentId).toLowerCase().trim() : '';
      const iAdm = issue.admissionNo ? String(issue.admissionNo).toLowerCase().trim() : '';

      const isForStudent = Boolean(
        (sAdm && sAdm !== 'n/a' && iAdm && iAdm === sAdm) ||
        (sId && sId !== '1' && sId !== 'stu-1' && sId !== 'n/a' && iId && iId === sId) ||
        (sAdm && sAdm !== 'n/a' && iId && iId === sAdm) ||
        (sId && sId !== '1' && sId !== 'stu-1' && sId !== 'n/a' && iAdm && iAdm === sId)
      );

      return (
        isForStudent &&
        (issue.status as any) !== "Returned" &&
        (issue.status as any) !== "Cancelled"
      );
    });

    const expectedBaseFee =
      getUniformFeeForClass(
        selectedStudent.className,
        selectedStudent.gender,
        financeUniformConfigs,
        feeStructures,
      ) || getUniformPackageFeeByClass(selectedStudent.className) || 0;

    // Update any existing ledger uniform installments with the exact configured uniform fee amount for the student's class
    if (expectedBaseFee && expectedBaseFee > 0) {
      combined.forEach((c) => {
        const headLower = (c.feeHeadName || "").toLowerCase();
        const isUnifHead =
          c.feeHeadId === "FH-04" ||
          c.feeHeadId === "FH-UNI-BASE" ||
          headLower.includes("uniform");
        if (isUnifHead && c.status !== "Paid" && !c.id.startsWith("INST-UNIF-UIS-") && !c.id.startsWith("INST-UNIF-EXTRA-")) {
          c.amount = expectedBaseFee;
          c.dueAmount = Math.max(0, expectedBaseFee - (c.paidAmount || 0));
        }
      });
    }

    // A & B: Process all uniform issues for the student into distinct fee installment rows
    if (studentIssues.length > 0) {
      // Remove any generic placeholder base uniform fee from combined when explicit student issues exist
      for (let i = combined.length - 1; i >= 0; i--) {
        const c = combined[i];
        const headLower = (c.feeHeadName || "").toLowerCase();
        const isUnifHead =
          c.id.startsWith("INST-UNIF-BASE-") ||
          c.feeHeadId === "FH-04" ||
          c.feeHeadId === "FH-UNI-BASE" ||
          headLower.includes("uniform");
        if (isUnifHead && !c.id.startsWith("INST-UNIF-UIS-") && !c.id.startsWith("INST-UNIF-EXTRA-")) {
          combined.splice(i, 1);
        }
      }

      studentIssues.forEach((issue) => {
        const itemRawName = (issue.itemCategory || issue.itemName || '').toLowerCase();
        const notesLowerCheck = (issue.notes || '').toLowerCase();
        const isFabricCloth = itemRawName.includes('cloth') || itemRawName.includes('fabric') || itemRawName.includes('unstitched') || itemRawName.includes('material') || notesLowerCheck.includes('cloth') || notesLowerCheck.includes('fabric');

        // Strictly define Base Package: ONLY Boys Base Package, Girls Base Package, or Admission Kit
        // Non-package items like Tie, Sweater, Shoes, Socks, Belt, Tracksuit are ALWAYS Additional Purchase
        const isBasePkg = !isFabricCloth && (
          issue.type === 'Base Package' ||
          (issue.type as any) === 'base' ||
          itemRawName.includes('boys base package') ||
          itemRawName.includes('girls base package') ||
          itemRawName === 'base package' ||
          itemRawName.includes('admission kit')
        ) && !itemRawName.includes('tie') && !itemRawName.includes('sweater') && !itemRawName.includes('shoe') && !itemRawName.includes('sock') && !itemRawName.includes('belt') && !itemRawName.includes('tracksuit');

        const itemTitle = isFabricCloth ? (issue.itemName || issue.itemCategory || "Uniform Cloth") : (isBasePkg ? (itemRawName.includes('kit') ? "Admission Kit" : (issue.itemName || issue.itemCategory || "Uniform Fee")) : (issue.itemCategory || issue.itemName || "Uniform Item"));

        const finalSizeStr = issue.size?.includes('->') ? issue.size.split('->')[1].trim() : (issue.size || 'M');
        const configuredItemFee = calculateClothOrItemPrice(
          issue.itemName || issue.itemCategory,
          finalSizeStr,
          issue.price || issue.unitPrice,
          financeUniformConfigs,
          selectedStudent.className,
          selectedStudent.gender
        );

        const amt = configuredItemFee * (issue.quantity || 1);
        const unitFee = configuredItemFee;
        const calcQty = (issue.quantity && issue.quantity > 0) ? issue.quantity : 1;
        const sizeVal = issue.size || 'M';
        const genderVal = issue.gender || selectedStudent?.gender || 'Male';
        const detailsStr = ` (Size: ${sizeVal} · ${genderVal})`;

        const loopCount = isFabricCloth ? 1 : calcQty;

        for (let qIdx = 0; qIdx < loopCount; qIdx++) {
          const subInstId = (loopCount > 1) ? `INST-UNIF-${issue.id}-P${qIdx + 1}` : `INST-UNIF-${issue.id}`;
          if (combined.some((c) => c.id === subInstId)) continue;

          const isFirstBase = isBasePkg && qIdx === 0;
          const prefix = isFabricCloth
            ? (issue.itemName || issue.itemCategory || "Uniform Cloth")
            : (isFirstBase ? "Base Package" : (isBasePkg ? "Additional Base Kit" : "Additional Purchase"));
          const fabricSizeStr = sizeVal ? ` (Size: ${sizeVal})` : '';
          const qtyTag = (isFabricCloth && calcQty > 1) ? ` × ${calcQty}` : ((!isFabricCloth && calcQty > 1) ? ` (#${qIdx + 1})` : '');
          const itemDisplayName = isFabricCloth
            ? `${prefix}${fabricSizeStr}${qtyTag}`.trim()
            : `${prefix} — ${itemTitle}${detailsStr}${qtyTag}`.trim();
          const subAmt = isFabricCloth ? amt : ((calcQty > 1 && amt > 0) ? Math.round(amt / calcQty) : amt);

          const notesLower = (issue.notes || '').toLowerCase();
          const isExplicitlyPaidNote = (notesLower.includes("fees paid") || notesLower.includes("paid at counter") || notesLower.includes("already paid")) &&
            !notesLower.includes("unpaid") && !notesLower.includes("not paid") && !notesLower.includes("to be paid") && !notesLower.includes("pending");

          const subPaidAmt = (feePayments || []).filter(p => {
            if (p.studentId !== selectedStudent.id && p.studentId !== selectedStudent.admissionNo) return false;
            if (!p.amountPaid || p.amountPaid <= 0) return false;
            const strippedId = issue.id.replace(/-P\d+$/, '');
            return (
              p.selectedInstallmentIds?.includes(subInstId) ||
              (qIdx === 0 && (
                p.selectedInstallmentIds?.includes(`INST-UNIF-${issue.id}`) || 
                p.selectedInstallmentIds?.includes(issue.id) || 
                p.receiptNo?.includes(`UNI-EXTRA-${issue.id}`) ||
                p.selectedInstallmentIds?.includes(`INST-UNIF-${strippedId}`) ||
                p.selectedInstallmentIds?.includes(strippedId) ||
                p.receiptNo?.includes(`UNI-EXTRA-${strippedId}`)
              ))
            );
          }).reduce((acc, curr) => acc + curr.amountPaid, 0);

          const isPaidInFinance = subPaidAmt >= subAmt || ((issue.status as string) === "Paid") || isExplicitlyPaidNote;

          combined.push({
            id: subInstId,
            studentId: selectedStudent.id,
            academicYear: currentYear,
            feeAssignmentId: `FA-UNIF-${selectedStudent.id}`,
            feeHeadId: 'FH-04',
            feeHeadName: "Uniform & Accessories",
            frequency: "One Time",
            termName: itemDisplayName,
            dueDate: issue.issueDate || new Date().toISOString().split("T")[0],
            amount: subAmt,
            paidAmount: isPaidInFinance ? subAmt : 0,
            dueAmount: isPaidInFinance ? 0 : subAmt,
            status: isPaidInFinance ? "Paid" : "Pending",
            createdAt: issue.issueDate || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      });
    } else {
      // No explicit uniform issues yet recorded — check if opted at admission
      const admRecord = (admissions || []).find(a => a.id === selectedStudent.id || a.applicationNo === selectedStudent.id || (selectedStudent.admissionNo && (a.id === selectedStudent.admissionNo || a.applicationNo === selectedStudent.admissionNo)));
      const optList = admRecord ? admRecord.selectedOptionalFees : null;
      const isExplicitlyOptedOut = Boolean(
        (admRecord as any)?.uniformOpted === false ||
        (admRecord as any)?.isUniformOpted === false ||
        (selectedStudent as any)?.uniformOpted === false ||
        (selectedStudent as any)?.isUniformOpted === false ||
        (Array.isArray(optList) && optList.length > 0 && !optList.some(id => id === 'FH-04' || id === 'FH-004' || String(id).toLowerCase().includes('uniform') || String(id).toLowerCase().includes('kit')))
      );

      const hasPaidBaseInFinance = (feePayments || []).some((p) => {
        const isStudentMatch =
          p.studentId === selectedStudent.id ||
          (selectedStudent.admissionNo && p.studentId === selectedStudent.admissionNo);
        if (!isStudentMatch || !p.amountPaid || p.amountPaid <= 0) return false;
        if (p.paymentAllocation && p.paymentAllocation.length > 0) {
          return p.paymentAllocation.some(alloc => {
            const head = (alloc.feeHeadName || alloc.termName || '').toLowerCase();
            return (head.includes('uniform') || head.includes('package')) && !head.includes('extra');
          });
        }
        return false;
      });

      const shouldIncludeUniformFee = isExplicitlyOptedIn && expectedBaseFee > 0;

      if (shouldIncludeUniformFee && !hasPaidBaseInFinance) {
        const baseUnitFee = (expectedBaseFee && expectedBaseFee > 0) ? expectedBaseFee : 5000;
        const calcQty = (expectedBaseFee > 0 && expectedBaseFee % baseUnitFee === 0 && expectedBaseFee > baseUnitFee)
          ? Math.round(expectedBaseFee / baseUnitFee)
          : 1;
        const genderVal = selectedStudent?.gender || 'Male';
        const sizeVal = 'M';
        const detailsStr = ` (Size: ${sizeVal} · ${genderVal})`;

        // Remove any generic placeholder uniform fee terms (e.g. Annual or FH-04) that aren't explicit issued items
        for (let i = combined.length - 1; i >= 0; i--) {
          const c = combined[i];
          if (!c.id.startsWith("INST-UNIF-")) {
            const headLower = (c.feeHeadName || "").toLowerCase();
            const isUnifHead =
              c.feeHeadId === "FH-04" ||
              c.feeHeadId === "FH-UNI-BASE" ||
              headLower.includes("uniform");
            if (isUnifHead && c.status !== "Paid") {
              combined.splice(i, 1);
            }
          }
        }

        for (let qIdx = 0; qIdx < calcQty; qIdx++) {
          const subInstId = calcQty > 1 ? `INST-UNIF-BASE-${selectedStudent.id}-P${qIdx + 1}` : `INST-UNIF-BASE-${selectedStudent.id}`;
          if (combined.some(c => c.id === subInstId)) continue;

          const isFirst = qIdx === 0;
          const prefix = isFirst ? "Base Package" : "Additional Base Kit";
          const numTag = calcQty > 1 ? ` (#${qIdx + 1})` : '';
          const baseTermName = `${prefix} — Admission Kit${detailsStr}${numTag}`;

          const subPaidAmt = (feePayments || []).filter(p => {
            if (p.studentId !== selectedStudent.id && p.studentId !== selectedStudent.admissionNo) return false;
            if (!p.amountPaid || p.amountPaid <= 0) return false;
            return (
              p.selectedInstallmentIds?.includes(subInstId) ||
              (calcQty === 1 && (p.selectedInstallmentIds?.includes(`INST-UNIF-BASE-${selectedStudent.id}`) || p.selectedInstallmentIds?.includes('FH-04') || p.selectedInstallmentIds?.includes('FH-UNI-BASE')))
            );
          }).reduce((acc, curr) => acc + curr.amountPaid, 0);

          const isSubPaid = subPaidAmt >= baseUnitFee;

          combined.push({
            id: subInstId,
            studentId: selectedStudent.id,
            academicYear: currentYear,
            feeAssignmentId: `FA-UNIF-BASE-${selectedStudent.id}`,
            feeHeadId: "FH-04",
            feeHeadName: "Uniform & Accessories",
            frequency: "One Time",
            termName: baseTermName,
            dueDate: new Date().toISOString().split("T")[0],
            amount: baseUnitFee,
            paidAmount: isSubPaid ? baseUnitFee : 0,
            dueAmount: isSubPaid ? 0 : baseUnitFee,
            status: isSubPaid ? "Paid" : "Pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // Remove pending base uniform package fee charge for un-opted students without distributed items
        for (let i = combined.length - 1; i >= 0; i--) {
          const c = combined[i];
          if (!c.id.startsWith("INST-UNIF-")) {
            const headLower = (c.feeHeadName || "").toLowerCase();
            const isUnifHead =
              c.feeHeadId === "FH-04" ||
              c.feeHeadId === "FH-UNI-BASE" ||
              headLower.includes("uniform");
            if (isUnifHead && c.status !== "Paid") {
              combined.splice(i, 1);
            }
          }
        }
      }
    }

    // 3. Fallback: If still empty, build default fee structure installments for the student's class
    if (combined.length === 0 && selectedStudent) {
      const clsName = selectedStudent.className || "";
      const dfs =
        (dynamicFeeStructures || []).find(
          (d) => matchesClassName(d.className, clsName) && (d.status === "Active" || !d.status),
        ) ||
        (dynamicFeeStructures || []).find(
          (d) => matchesClassName(d.className, clsName),
        );

      let defaultHeads: { id: string; name: string; amount: number }[] = [];
      if (dfs && dfs.items && dfs.items.length > 0) {
        defaultHeads = dfs.items.map((i) => ({
          id: i.feeHeadId || `FH-${i.feeHeadName}`,
          name: i.feeHeadName,
          amount: i.amount || 0,
        }));
      } else {
        const applicableHeads = (feeHeads || []).filter((h) =>
          h.status === "Active" &&
          (!h.applicableClasses ||
            h.applicableClasses.length === 0 ||
            h.applicableClasses.some((c) => matchesClassName(c, clsName)) ||
            h.applicableClasses.includes("All")),
        );
        defaultHeads = applicableHeads.map((h) => ({
          id: h.id,
          name: h.name,
          amount: h.amount || 0,
        }));
      }

      defaultHeads.forEach((h) => {
        combined.push({
          id: `INST-AUTO-${selectedStudent.id}-${h.id}`,
          studentId: selectedStudent.id,
          academicYear: currentYear,
          feeAssignmentId: `FA-AUTO-${selectedStudent.id}`,
          feeHeadId: h.id,
          feeHeadName: h.name,
          frequency: "One Time",
          termName: h.name,
          dueDate: new Date().toISOString().split("T")[0],
          amount: h.amount,
          paidAmount: 0,
          dueAmount: h.amount,
          status: "Pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }

    // Synchronize individual uniform fee payment statuses precisely per line item
    combined.forEach((inst) => {
      const isUnifHead =
        (inst.feeHeadName || "").toLowerCase().includes("uniform") ||
        inst.feeHeadId === "FH-04";
      if (!isUnifHead || inst.status === "Paid") return;

      const isPaidInReceipts = (feePayments || []).some((p) => {
        const isStudentMatch =
          p.studentId === selectedStudent.id ||
          (selectedStudent.admissionNo &&
            (p.studentId === selectedStudent.admissionNo ||
              (p.receiptNo &&
                p.receiptNo.includes(selectedStudent.admissionNo))));
        if (!isStudentMatch || !p.amountPaid || p.amountPaid <= 0) return false;

        // Check if receipt specifically paid this installment ID
        if (
          p.selectedInstallmentIds &&
          (p.selectedInstallmentIds.includes(inst.id) ||
            (inst.id.startsWith("INST-UNIF-") &&
              p.selectedInstallmentIds.includes(
                inst.id.replace("INST-UNIF-", ""),
              )))
        ) {
          return true;
        }

        // Check if receiptNo contains this item's specific ID
        if (
          p.receiptNo &&
          inst.id.startsWith("INST-UNIF-") &&
          p.receiptNo.includes(inst.id.replace("INST-UNIF-", ""))
        ) {
          return true;
        }

        // Check allocation by specific item name
        if (p.paymentAllocation && p.paymentAllocation.length > 0) {
          return p.paymentAllocation.some((alloc) => {
            if (alloc.installmentId === inst.id) return true;
            const allocName = (alloc.termName || alloc.feeHeadName || "")
              .toLowerCase()
              .trim();
            const instTerm = (inst.termName || "").toLowerCase().trim();
            if (!allocName || !instTerm) return false;

            // Match specific items precisely (e.g. Sports Dress, Sports Tracksuit Kit, Base Package)
            if (
              allocName.includes("sports dress") &&
              instTerm.includes("sports dress")
            )
              return true;
            if (
              allocName.includes("tracksuit") &&
              instTerm.includes("tracksuit")
            )
              return true;
            if (
              (allocName.includes("base package") ||
                allocName.includes("admission kit")) &&
              (instTerm.includes("base package") ||
                instTerm.includes("admission kit"))
            )
              return true;
            if (allocName === instTerm) return true;
            return false;
          });
        }
        return false;
      });

      if (isPaidInReceipts) {
        inst.paidAmount = inst.amount;
        inst.dueAmount = 0;
        inst.status = "Paid";
      }
    });

    // Deduplicate Base Uniform terms: Ensure strictly 1 base uniform term exists under Uniform & Accessories
    const baseIndices: number[] = [];
    combined.forEach((c, idx) => {
      const termLower = (c.termName || "").toLowerCase();
      const headLower = (c.feeHeadName || "").toLowerCase();
      const isExplicitExtra =
        termLower.includes("extra") ||
        termLower.includes("sports") ||
        termLower.includes("tracksuit") ||
        termLower.includes("cap") ||
        termLower.includes("shoes") ||
        termLower.includes("socks") ||
        termLower.includes("shirt") ||
        termLower.includes("pant") ||
        termLower.includes("skirt") ||
        termLower.includes("tie") ||
        termLower.includes("belt");

      const isUnifHead =
        c.feeHeadId === "FH-04" ||
        c.feeHeadId === "FH-UNI-BASE" ||
        c.feeHeadId === "FH-UNI-EXTRA" ||
        headLower.includes("uniform");

      const isBaseUniform =
        isUnifHead &&
        !c.id.startsWith("INST-UNIF-") &&
        !isExplicitExtra &&
        (c.feeHeadId === "FH-UNI-BASE" ||
          termLower.includes("package") ||
          termLower.includes("admission kit") ||
          termLower.includes("annual"));

      if (isBaseUniform) {
        baseIndices.push(idx);
      }
    });

    if (baseIndices.length > 1) {
      const keepIndex =
        baseIndices.find((i) => combined[i].status === "Paid") ??
        baseIndices.find(
          (i) =>
            combined[i].termName.toLowerCase().includes("admission kit") ||
            combined[i].id.startsWith("INST-UNIF-"),
        ) ??
        baseIndices[0];

      for (let i = combined.length - 1; i >= 0; i--) {
        if (baseIndices.includes(i) && i !== keepIndex) {
          combined.splice(i, 1);
        }
      }
    }

    // Filter out any unpaid fee installments for returned/cancelled uniform items for this student
    const returnedStudentIssues = (studentUniformIssues || []).filter((issue) => {
      const isForStudent =
        (issue.studentId &&
          (issue.studentId === selectedStudent.id ||
            issue.studentId === selectedStudent.admissionNo)) ||
        (issue.admissionNo &&
          (issue.admissionNo === selectedStudent.id ||
            issue.admissionNo === selectedStudent.admissionNo)) ||
        (issue.studentName &&
          `${selectedStudent.firstName} ${selectedStudent.lastName}`
            .toLowerCase()
            .trim() === issue.studentName.toLowerCase().trim());

      return (
        isForStudent &&
        ((issue.status as any) === "Returned" ||
          (issue.status as any) === "Cancelled" ||
          (issue.notes || "").toLowerCase().includes("returned"))
      );
    });

    if (returnedStudentIssues.length > 0) {
      for (let i = combined.length - 1; i >= 0; i--) {
        const c = combined[i];
        const isUnifHead =
          c.feeHeadId === "FH-04" ||
          c.feeHeadId === "FH-UNI-BASE" ||
          c.feeHeadId === "FH-UNI-EXTRA" ||
          (c.feeHeadName || "").toLowerCase().includes("uniform");

        if (!isUnifHead) continue;

        const termLow = (c.termName || "").toLowerCase();

        const matchesReturnedItem = returnedStudentIssues.some((ret) => {
          const notesLower = (ret.notes || "").toLowerCase();
          const isExplicitlyPaidNote =
            (notesLower.includes("fees paid") ||
              notesLower.includes("paid at counter") ||
              notesLower.includes("already paid")) &&
            !notesLower.includes("unpaid") &&
            !notesLower.includes("not paid") &&
            !notesLower.includes("to be paid") &&
            !notesLower.includes("pending");

          const isItemPaid =
            Boolean((ret as any).wasPaid) ||
            (ret.status as string) === "Paid" ||
            isExplicitlyPaidNote;

          // If paid, keep paid item installment in combined
          if (isItemPaid) return false;

          // If unpaid and returned: match by ID or item name
          if (c.id === ret.id || c.id.includes(ret.id)) return true;

          const itemClean = (ret.itemName || ret.itemCategory || "")
            .replace(/\s*\(extra\)/gi, "")
            .trim()
            .toLowerCase();

          if (itemClean && itemClean.length >= 2 && termLow.includes(itemClean)) {
            return true;
          }

          if (ret.type === "Additional Purchase" || ret.itemName) {
            const cleanCatName = (ret.itemName || "").toLowerCase().trim();
            if (cleanCatName && termLow.includes(cleanCatName)) return true;
          }

          return false;
        });

        if (matchesReturnedItem && c.status !== "Paid" && c.dueAmount > 0) {
          c.status = "Cancelled";
          c.dueAmount = 0;
          c.amount = 0;
        }
      }
    }

    // 4. Ensure Hostel Security Deposit is strictly One Time, NEVER split into terms, and always displayed for Residential students
    let depInstallments = combined.filter(
      (c) =>
        c.feeHeadId === "FH-HST-DEP" ||
        (c.feeHeadName || "").toLowerCase().includes("security deposit") ||
        (c.termName || "").toLowerCase().includes("security deposit"),
    );

    let hostelDepositAmount = 0;
    try {
      const stored = sessionStorage.getItem("edu_fee_pay_target");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.amount && Number(p.amount) > 0) hostelDepositAmount = Number(p.amount);
      }
    } catch {}

    if (hostelDepositAmount <= 0) {
      const fhc = (financeHostelConfigs || []).find((c) => c.status === "Active" && Number(c.securityDeposit) > 0);
      if (fhc && Number(fhc.securityDeposit) > 0) {
        hostelDepositAmount = Number(fhc.securityDeposit);
      } else if (admRecord?.hostelSecurityDeposit) {
        hostelDepositAmount = Number(admRecord.hostelSecurityDeposit);
      } else {
        hostelDepositAmount = 5000;
      }
    }

    if (depInstallments.length === 0 && isResidentStudent && hostelDepositAmount > 0) {
      const isDepositPaid = (feePayments || []).some((p) => {
        const isStudentMatch =
          p.studentId === selectedStudent.id ||
          (selectedStudent.admissionNo && p.studentId === selectedStudent.admissionNo);
        if (!isStudentMatch || !p.amountPaid || p.amountPaid <= 0) return false;
        return (
          p.selectedInstallmentIds?.some((id) => id.includes("FH-HST-DEP")) ||
          p.paymentAllocation?.some((a) => (a.feeHeadName || "").toLowerCase().includes("security deposit")) ||
          (p.remarks || "").toLowerCase().includes("security deposit")
        );
      }) || Boolean(selectedStudent.hostelSecurityDepositPaid || admRecord?.hostelSecurityDepositPaid);

      combined.unshift({
        id: `INST-${selectedStudent.id}-${currentYear}-FH-HST-DEP-onetime`,
        studentId: selectedStudent.id,
        academicYear: currentYear,
        feeAssignmentId: `FA-HST-DEP-${selectedStudent.id}`,
        feeHeadId: "FH-HST-DEP",
        feeHeadName: "Hostel Security Deposit (Refundable)",
        frequency: "One Time",
        termId: "ONETIME",
        termName: "One Time",
        dueDate: new Date().toISOString().split("T")[0],
        amount: hostelDepositAmount,
        paidAmount: isDepositPaid ? hostelDepositAmount : 0,
        dueAmount: isDepositPaid ? 0 : hostelDepositAmount,
        status: isDepositPaid ? "Paid" : "Pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      depInstallments = [combined[0]];
    }

    if (depInstallments.length > 1) {
      const totalDepAmt = depInstallments.reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalDepPaid = depInstallments.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
      const totalDepDue = Math.max(0, totalDepAmt - totalDepPaid);
      const firstDep = depInstallments[0];

      // Remove all multi-term security deposit entries
      for (let i = combined.length - 1; i >= 0; i--) {
        const c = combined[i];
        if (
          c.feeHeadId === "FH-HST-DEP" ||
          (c.feeHeadName || "").toLowerCase().includes("security deposit") ||
          (c.termName || "").toLowerCase().includes("security deposit")
        ) {
          combined.splice(i, 1);
        }
      }

      // Add a single consolidated One-Time installment at index 0
      combined.unshift({
        ...firstDep,
        id: `INST-${selectedStudent.id}-${currentYear}-FH-HST-DEP-onetime`,
        feeHeadId: "FH-HST-DEP",
        feeHeadName: "Hostel Security Deposit (Refundable)",
        frequency: "One Time",
        termId: "ONETIME",
        termName: "One Time",
        amount: totalDepAmt,
        paidAmount: totalDepPaid,
        dueAmount: totalDepDue,
        status: totalDepDue === 0 ? "Paid" : totalDepPaid > 0 ? "Partial" : "Pending",
      });
    } else if (depInstallments.length === 1) {
      depInstallments[0].frequency = "One Time";
      depInstallments[0].termName = "One Time";
      if ((depInstallments[0].amount || 0) <= 0 && hostelDepositAmount > 0) {
        depInstallments[0].amount = hostelDepositAmount;
        if (depInstallments[0].status !== "Paid") {
          depInstallments[0].dueAmount = Math.max(0, hostelDepositAmount - (depInstallments[0].paidAmount || 0));
        }
      }
    }

    // Ensure Hostel Security Deposit is sorted to the VERY TOP (Row 1)
    combined.sort((a, b) => {
      const aIsDep =
        a.feeHeadId === "FH-HST-DEP" ||
        (a.feeHeadName || "").toLowerCase().includes("security deposit") ||
        (a.termName || "").toLowerCase().includes("security deposit");
      const bIsDep =
        b.feeHeadId === "FH-HST-DEP" ||
        (b.feeHeadName || "").toLowerCase().includes("security deposit") ||
        (b.termName || "").toLowerCase().includes("security deposit");
      if (aIsDep && !bIsDep) return -1;
      if (!aIsDep && bIsDep) return 1;
      return 0;
    });

    return combined;
  }, [
    selectedStudent,
    isHostellerStudent,
    feePayments,
    studentFeeLedgers,
    studentFeeInstallments,
    studentUniformIssues,
    selectedAcademicYear,
    routeMasters,
    pickupPoints,
    studentTransports,
    admissions,
    financeSettings,
    financeHostelConfigs,
    academicYearFeeSchedules,
    getDynamicTransportFee,
    getStudentFeeLedger,
  ]);

  const lastAutoSelectedStudentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedStudent && allInstallments.length > 0) {
      const pendingInsts = allInstallments.filter((i) => i.dueAmount > 0 && i.status !== "Paid" && i.status !== "Cancelled");
      const sKey = `${selectedStudent.id || selectedStudent.admissionNo}_${pendingInsts.map(i => `${i.id}_${i.dueAmount}`).join(';')}`;
      if (sKey && lastAutoSelectedStudentIdRef.current !== sKey) {
        lastAutoSelectedStudentIdRef.current = sKey;
        if (pendingInsts.length > 0) {
          let targetInsts = pendingInsts;
          try {
            const storedTarget = sessionStorage.getItem('edu_fee_pay_target');
            if (storedTarget) {
              const parsed = JSON.parse(storedTarget);
              if (parsed?.feeHead === "Hostel Security Deposit") {
                const depInsts = pendingInsts.filter(i =>
                  i.feeHeadId === "FH-HST-DEP" ||
                  (i.feeHeadName || '').toLowerCase().includes("security deposit") ||
                  (i.termName || '').toLowerCase().includes("security deposit")
                );
                if (depInsts.length > 0) {
                  targetInsts = depInsts;
                }
              }
            }
          } catch (e) {}

          const targetIds = targetInsts.map((i) => i.id);
          setSelectedInstallments(targetIds);
          const initialCustom: Record<string, string> = {};
          targetInsts.forEach((inst) => {
            initialCustom[inst.id] = String(inst.dueAmount);
          });
          setCustomCollectionAmounts(initialCustom);
        }
      }
    } else if (!selectedStudent) {
      lastAutoSelectedStudentIdRef.current = null;
    }
  }, [selectedStudent, allInstallments]);

  const currentYearInstallments = allInstallments.filter(
    (i) => i.academicYear === currentYear,
  );
  const previousYearInstallments = allInstallments.filter(
    (i) => i.academicYear !== currentYear,
  );

  const currentYearPending = currentYearInstallments.reduce(
    (sum, i) => sum + i.dueAmount,
    0,
  );
  const previousYearPending = previousYearInstallments.reduce(
    (sum, i) => sum + i.dueAmount,
    0,
  );
  const totalOutstanding = currentYearPending + previousYearPending;

  const selectedCurrentYearAmount = currentYearInstallments
    .filter((i) => selectedInstallments.includes(i.id))
    .reduce((sum, i) => sum + getInstallmentCollectionAmount(i), 0);

  const selectedPreviousYearAmount = previousYearInstallments
    .filter((i) => selectedInstallments.includes(i.id))
    .reduce((sum, i) => sum + getInstallmentCollectionAmount(i), 0);

  const baseSelectedAmount = selectedCurrentYearAmount + selectedPreviousYearAmount;

  const allConcessionOptions = useMemo(() => {
    const opts: Array<{ id: string; name: string; type: string; value: number }> = [];
    (scholarships || []).forEach((s) => {
      opts.push({
        id: s.id,
        name: `${s.name} (${s.discountType === 'Percentage' ? `${s.percentage || 0}%` : `₹${s.fixedAmount || 0}`})`,
        type: s.discountType || 'Fixed Amount',
        value: s.discountType === 'Percentage' ? (s.percentage || 0) : (s.fixedAmount || 0)
      });
    });
    (discounts || []).forEach((d) => {
      opts.push({
        id: d.id,
        name: `${d.name} (${d.mode === 'Percentage' ? `${d.value || 0}%` : `₹${d.value || 0}`})`,
        type: d.mode || 'Fixed Amount',
        value: d.value || 0
      });
    });
    return opts;
  }, [scholarships, discounts]);

  useEffect(() => {
    if (selectedConcessionId) {
      const found = allConcessionOptions.find((c) => c.id === selectedConcessionId);
      if (found) {
        let computedDisc = 0;
        if (found.type === "Percentage") {
          computedDisc = Math.round(baseSelectedAmount * (found.value / 100));
        } else {
          computedDisc = Math.min(baseSelectedAmount > 0 ? baseSelectedAmount : found.value, found.value);
        }
        setDiscountAmountInput(String(computedDisc));
      }
    }
  }, [selectedConcessionId, baseSelectedAmount, allConcessionOptions]);

  const effectiveFineAmount = isFineWaived
    ? 0
    : (fineAmountInput !== "" && !isNaN(Number(fineAmountInput)))
      ? Number(fineAmountInput)
      : (calcResult?.fineAmount || 0);

  const effectiveDiscountAmount = (discountAmountInput !== "" && !isNaN(Number(discountAmountInput)))
    ? Number(discountAmountInput)
    : 0;

  const computedNetPayable = Math.max(0, baseSelectedAmount + effectiveFineAmount - effectiveDiscountAmount);

  const customNumeric = (customAmountReceived !== "" && !isNaN(Number(customAmountReceived))) ? Number(customAmountReceived) : null;
  const isCustomExceeding = customNumeric !== null && computedNetPayable > 0 && customNumeric > computedNetPayable;
  const isFullyPaid = totalOutstanding <= 0 || allInstallments.every((i) => i.dueAmount <= 0);

  const amountPaying = (computedNetPayable > 0 && customNumeric !== null && customNumeric > 0)
    ? Math.min(customNumeric, computedNetPayable)
    : computedNetPayable;

  const hasAnyAmountError = selectedInstallments.some((id) => {
    const inst = allInstallments.find((i: any) => i.id === id);
    return inst ? Boolean(getInstallmentAmountError(inst)) : false;
  });

  const isAmountValid =
    !isFullyPaid &&
    selectedInstallments.length > 0 &&
    amountPaying > 0 &&
    amountPaying <= computedNetPayable &&
    !isCustomExceeding &&
    !hasAnyAmountError;

  const isModeSelected = Boolean(paymentMode);

  let isModeFieldsValid = false;
  let validationMessage = "";

  if (isFullyPaid) {
    validationMessage = "All fees for this student have been fully paid. No pending dues.";
  } else if (selectedInstallments.length === 0) {
    validationMessage =
      "Select at least one pending fee component checkbox to collect";
  } else if (isCustomExceeding) {
    validationMessage = `Custom paying amount cannot exceed the selected due amount of ${formatCurrency(computedNetPayable)}`;
  } else if (amountPaying <= 0) {
    validationMessage = "Collection amount must be greater than ₹0";
  } else if (hasAnyAmountError) {
    const errInstId = selectedInstallments.find((id) => {
      const inst = allInstallments.find((i: any) => i.id === id);
      return inst ? Boolean(getInstallmentAmountError(inst)) : false;
    });
    const errInst = allInstallments.find((i: any) => i.id === errInstId);
    validationMessage = errInst
      ? getInstallmentAmountError(errInst) || "Invalid collection amount"
      : "Invalid collection amount";
  } else if (!isModeSelected) {
    validationMessage = "Please select a Payment Mode";
  } else if (paymentMode === "Cash") {
    isModeFieldsValid = true;
  } else if (
    paymentMode === "Online" ||
    paymentMode === "UPI" ||
    paymentMode === "Card" ||
    paymentMode === "Bank Transfer" ||
    paymentMode === "Other"
  ) {
    isModeFieldsValid = transactionId.trim().length > 0;
    if (!isModeFieldsValid)
      validationMessage = "Transaction Ref / UTR No is required";
  } else if (paymentMode === "Cheque") {
    isModeFieldsValid =
      chequeNo.trim().length > 0 &&
      chequeDate.trim().length > 0 &&
      bankName.trim().length > 0;
    if (!isModeFieldsValid)
      validationMessage =
        "Cheque No, Cheque Date, and Bank Name are required for Cheque payment";
  }

  const isFormValid = isAmountValid && isModeSelected && isModeFieldsValid;

  const handleGlobalCustomAmountChange = (valStr: string) => {
    if (isFullyPaid || computedNetPayable <= 0) {
      setCustomAmountReceived("");
      return;
    }
    const numVal = Number(valStr);
    const validVal =
      valStr !== "" && !isNaN(numVal) && numVal > computedNetPayable
        ? String(computedNetPayable)
        : valStr;
    setCustomAmountReceived(validVal);

    let activeSelected = selectedInstallments;
    if (activeSelected.length === 0 && allInstallments.some((i) => i.dueAmount > 0)) {
      const pendingInsts = currentYearInstallments.filter((i) => i.dueAmount > 0);
      activeSelected = pendingInsts.map((i) => i.id);
      setSelectedInstallments(activeSelected);
    }

    if (validVal === "") {
      const resetMap: Record<string, string> = {};
      activeSelected.forEach((id) => {
        const inst = allInstallments.find((i: any) => i.id === id);
        if (inst) {
          resetMap[id] = String(inst.dueAmount);
        }
      });
      setCustomCollectionAmounts(resetMap);
      return;
    }

    const totalToDistribute = Math.max(0, Number(validVal) || 0);
    let remaining = totalToDistribute;

    const newCustoms: Record<string, string> = {};
    const selectedInstObjs = allInstallments.filter((i: any) => activeSelected.includes(i.id));

    // Distribute sequentially (Deposit is strictly at index 0, followed by subsequent terms)
    selectedInstObjs.forEach((inst: any) => {
      const alloc = Math.min(inst.dueAmount, remaining);
      newCustoms[inst.id] = String(alloc);
      remaining = Math.max(0, remaining - alloc);
    });

    setCustomCollectionAmounts(newCustoms);
  };

  const toggleInstallmentSelection = (id: string) => {
    const targetIdx = allInstallments.findIndex((i: any) => i.id === id);
    if (targetIdx === -1) return;

    setSelectedInstallments((prev) => {
      if (prev.includes(id)) {
        // Unselect target and all subsequent installments
        const toRemoveIds = new Set<string>();
        for (let i = targetIdx; i < allInstallments.length; i++) {
          toRemoveIds.add(allInstallments[i].id);
        }
        setCustomCollectionAmounts((amtPrev) => {
          const copy = { ...amtPrev };
          toRemoveIds.forEach((remId) => delete copy[remId]);
          return copy;
        });
        const nextIds = prev.filter((x) => !toRemoveIds.has(x));
        if (customAmountReceived && Number(customAmountReceived) > 0) {
          const totalToDist = Number(customAmountReceived);
          let rem = totalToDist;
          const newCustoms: Record<string, string> = {};
          const selectedObjs = allInstallments.filter((i: any) => nextIds.includes(i.id));
          selectedObjs.forEach((inst: any) => {
            const alloc = Math.min(inst.dueAmount, rem);
            newCustoms[inst.id] = String(alloc);
            rem = Math.max(0, rem - alloc);
          });
          setCustomCollectionAmounts(newCustoms);
        }
        return nextIds;
      } else {
        // Select target and all prior pending installments (with dueAmount > 0)
        const toAddInsts: any[] = [];
        for (let i = 0; i <= targetIdx; i++) {
          const inst = allInstallments[i];
          if (inst && inst.dueAmount > 0) {
            toAddInsts.push(inst);
          }
        }
        setCustomCollectionAmounts((amtPrev) => {
          const copy = { ...amtPrev };
          toAddInsts.forEach((inst) => {
            if (!(inst.id in copy)) {
              copy[inst.id] = String(inst.dueAmount);
            }
          });
          return copy;
        });
        const toAddIds = toAddInsts.map((inst) => inst.id);
        const nextIds = Array.from(new Set([...prev, ...toAddIds]));
        if (customAmountReceived && Number(customAmountReceived) > 0) {
          const totalToDist = Number(customAmountReceived);
          let rem = totalToDist;
          const newCustoms: Record<string, string> = {};
          const selectedObjs = allInstallments.filter((i: any) => nextIds.includes(i.id));
          selectedObjs.forEach((inst: any) => {
            const alloc = Math.min(inst.dueAmount, rem);
            newCustoms[inst.id] = String(alloc);
            rem = Math.max(0, rem - alloc);
          });
          setCustomCollectionAmounts(newCustoms);
        }
        return nextIds;
      }
    });
  };

  const handleSelectAllCurrentYear = () => {
    const pendingInsts = currentYearInstallments.filter((i) => i.dueAmount > 0);
    const pendingIds = pendingInsts.map((i) => i.id);
    const allSelected = pendingIds.every((id) =>
      selectedInstallments.includes(id),
    );
    if (allSelected) {
      setSelectedInstallments((prev) =>
        prev.filter((id) => !pendingIds.includes(id)),
      );
      setCustomCollectionAmounts((prev) => {
        const copy = { ...prev };
        pendingIds.forEach((id) => delete copy[id]);
        return copy;
      });
    } else {
      setSelectedInstallments((prev) =>
        Array.from(new Set([...prev, ...pendingIds])),
      );
      setCustomCollectionAmounts((prev) => {
        const copy = { ...prev };
        pendingInsts.forEach((i) => {
          if (!(i.id in copy)) {
            copy[i.id] = String(i.dueAmount);
          }
        });
        return copy;
      });
    }
  };

  const handleSelectAllPreviousYear = () => {
    const pendingInsts = previousYearInstallments.filter(
      (i) => i.dueAmount > 0,
    );
    const pendingIds = pendingInsts.map((i) => i.id);
    const allSelected = pendingIds.every((id) =>
      selectedInstallments.includes(id),
    );
    if (allSelected) {
      setSelectedInstallments((prev) =>
        prev.filter((id) => !pendingIds.includes(id)),
      );
      setCustomCollectionAmounts((prev) => {
        const copy = { ...prev };
        pendingIds.forEach((id) => delete copy[id]);
        return copy;
      });
    } else {
      setSelectedInstallments((prev) =>
        Array.from(new Set([...prev, ...pendingIds])),
      );
      setCustomCollectionAmounts((prev) => {
        const copy = { ...prev };
        pendingInsts.forEach((i) => {
          if (!(i.id in copy)) {
            copy[i.id] = String(i.dueAmount);
          }
        });
        return copy;
      });
    }
  };

  const selectableCurrentIds = currentYearInstallments
    .filter((i) => i.dueAmount > 0)
    .map((i) => i.id);
  const allCurrentSelected =
    selectableCurrentIds.length > 0 &&
    selectableCurrentIds.every((id) => selectedInstallments.includes(id));

  const selectablePrevIds = previousYearInstallments
    .filter((i) => i.dueAmount > 0)
    .map((i) => i.id);
  const allPreviousSelected =
    selectablePrevIds.length > 0 &&
    selectablePrevIds.every((id) => selectedInstallments.includes(id));

  const groupedCurrentYear: {
    [headName: string]: typeof currentYearInstallments;
  } = {};
  currentYearInstallments.forEach((inst) => {
    let groupKey = inst.feeHeadName || "Fee";
    if (
      groupKey.toLowerCase().includes("hostel accommodation") ||
      groupKey.toLowerCase().includes("hostel security") ||
      groupKey.toLowerCase().includes("hostel deposit")
    ) {
      groupKey = "Hostel Fee";
    }
    if (!groupedCurrentYear[groupKey]) {
      groupedCurrentYear[groupKey] = [];
    }
    groupedCurrentYear[groupKey].push(inst);
  });

  const groupedPreviousYears: {
    [year: string]: typeof previousYearInstallments;
  } = {};
  previousYearInstallments.forEach((inst) => {
    if (!groupedPreviousYears[inst.academicYear]) {
      groupedPreviousYears[inst.academicYear] = [];
    }
    groupedPreviousYears[inst.academicYear].push(inst);
  });

  const activeStudent = selectedStudent;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Accounts
            </h2>
          </div>
        </div>
      </div>

      {/* 2. Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-6 border-b border-slate-200/80 dark:border-slate-800 text-xs font-bold">
        <button className="py-2.5 text-blue-600 border-b-2 border-blue-600 flex items-center gap-1.5 cursor-pointer">
          Payment & Receipt
        </button>
        <button
          onClick={() => setShowPaymentHistoryModal(true)}
          className="py-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          Transactions
        </button>
        <button className="py-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer">
          Account Balance
        </button>
        <button
          onClick={() => setShowPaymentHistoryModal(true)}
          className="py-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          Ledger
        </button>
      </div>

      {/* 3. Search Bar & Filter Controls */}
      <div className="glass-card p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by Name, Adm No, or Roll No..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              {uniqueClassNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold cursor-pointer"
            >
              <option value="ALL">All Sections</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStudent?.id || ""}
              onChange={(e) => {
                const s = filteredStudents.find((st) => st.id === e.target.value || st.admissionNo === e.target.value);
                if (s) handleSelectStudent(s);
              }}
              className="px-3 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs font-bold cursor-pointer max-w-[280px] truncate"
            >
              <option value="">-- Select Student ({filteredStudents.length}) --</option>
              {filteredStudents.map((st) => (
                <option key={st.id || st.admissionNo} value={st.id}>
                  {st.className} - {st.section || 'A'} | {st.firstName} {st.lastName} ({st.admissionNo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeStudent && (
          <div className="flex flex-col p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                {activeStudent.firstName?.[0] || "A"}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {activeStudent.firstName} {activeStudent.lastName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Admission No:{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeStudent.admissionNo || activeStudent.id || "A1234"}
                  </span>{" "}
                  | Class:{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeStudent.className || "8"}
                  </span>{" "}
                  | Section:{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeStudent.section || "A"}
                  </span>{" "}
                  | Branch:{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeStudent.branch || (activeStudent as any).campus || (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" ? selectedBranch : "-")}
                    {activeStudent.branch || (activeStudent as any).campus || (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" ? selectedBranch : "—")}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right pr-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Current Due
                </span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalOutstanding)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTransitionTargetType(isHostellerStudent ? "Non-Residential" : "Residential");
                  setShowTransitionModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Category Transition
              </button>
              <button
                type="button"
                onClick={refreshStudentProfile}
                title="Recalculate & Sync Fee Profile"
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingProfile ? "animate-spin text-blue-600" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(true)}
                className="px-3 py-2 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold transition-all cursor-pointer"
              >
                View Ledger
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Change Student
              </button>
            </div>
          </div>

          {/* Student Status & Sub-Service Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            {isHostellerStudent ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Bed className="w-3 h-3" /> Residential (Hosteller)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Bus className="w-3 h-3" /> Non-Residential (Day Scholar)
              </span>
            )}
            {backendFeeProfile?.transportUsageSummary && backendFeeProfile.transportUsageSummary !== "None" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {backendFeeProfile.transportUsageSummary}
              </span>
            )}
            {backendFeeProfile?.hostelStaySummary && backendFeeProfile.hostelStaySummary !== "None" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {backendFeeProfile.hostelStaySummary}
              </span>
            )}
          </div>
        </div>
      )}
      </div>


        {/* Dynamic Banners for Credit & Security Deposit */}
        {activeStudent && (backendFeeProfile?.transportCreditAmount > 0 || (calcResult as any)?.transportCreditAmount > 0) && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 dark:border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                    Unused Transport Credit Available
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-white shadow-xs">
                    {formatCurrency(backendFeeProfile?.transportCreditAmount ?? (calcResult as any)?.transportCreditAmount ?? 0)}
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  {backendFeeProfile?.transportUsageSummary || "The student has excess transport payments that can be reallocated towards hostel accommodation, security deposit, or tuition dues."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreditAmountToApply(String(backendFeeProfile?.transportCreditAmount ?? (calcResult as any)?.transportCreditAmount ?? ""));
                setShowApplyCreditModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
            >
              Apply Credit to Dues →
            </button>
          </div>
        )}

        {activeStudent && (backendFeeProfile?.securityDepositRefundable > 0 || (calcResult as any)?.securityDepositRefundable > 0) && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-500/30 dark:border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">
                    Refundable Hostel Security Deposit
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
                    {formatCurrency(backendFeeProfile?.securityDepositRefundable ?? (calcResult as any)?.securityDepositRefundable ?? 0)}
                  </span>
                </div>
                <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                  Hostel security deposit is held as an independent obligation. Upon vacating or leaving the hostel, this deposit can be refunded after any damage deductions.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setRefundAmountInput(String(backendFeeProfile?.securityDepositRefundable ?? (calcResult as any)?.securityDepositRefundable ?? ""));
                setDeductionAmountInput("0");
                setDeductionReasonInput("");
                setShowRefundDepositModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
            >
              Process Deposit Refund →
            </button>
          </div>
        )}

        {activeStudent && backendFeeProfile?.securityDepositRemainingDue > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Hostel Security Deposit Outstanding: <strong className="font-extrabold">{formatCurrency(backendFeeProfile.securityDepositRemainingDue)}</strong> (Tracked independently as head FH-HST-DEP).
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              Eligible for refund upon checkout
            </span>
          </div>
        )}

      {!activeStudent && (
        <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Select Student for Fee Collection ({filteredStudents.length} Students)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Showing students class-wise & alphabetically (A-Z)
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Class & Sec</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Adm No</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 font-bold italic">
                      No students found matching search filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => (
                    <tr key={st.id || st.admissionNo} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {st.className} - {st.section || 'A'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {st.firstName?.[0] || 'S'}
                        </div>
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300">
                        {st.admissionNo || st.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {st.branch || (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" ? selectedBranch : "-")}
                        {st.branch || (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" ? selectedBranch : "—")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectStudent(st)}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                          Select Student →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Main Column (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Outstanding Charges Table Card */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Outstanding Charges
                </h3>
                {allInstallments.some(i => i.dueAmount > 0 && i.status !== "Paid" && i.status !== "Cancelled") && (
                  <button
                    type="button"
                    onClick={handleSelectAllCurrentYear}
                    className="px-3 py-1 rounded-lg border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {currentYearInstallments.filter((i) => i.dueAmount > 0 && i.status !== "Paid" && i.status !== "Cancelled").every((i) => selectedInstallments.includes(i.id)) && currentYearInstallments.some(i => i.dueAmount > 0 && i.status !== "Paid" && i.status !== "Cancelled")
                      ? "Deselect All"
                      : "Select All Pending"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                  Configured Policy: <strong className="text-blue-600 dark:text-blue-400">{allInstallments.some(i => i.termName?.toLowerCase().includes("full") || (i.frequency === "One Time" && !i.termName?.toLowerCase().includes("term"))) ? "Full Annual Fee" : "Term-wise Fee"}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="p-3">#</th>
                    <th className="p-3">Fee Head</th>
                    <th className="p-3">Term</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Original Amount</th>
                    <th className="p-3 text-right">Discount</th>
                    <th className="p-3 text-right">Paid Amount</th>
                    <th className="p-3 text-right">Due Amount</th>
                    <th className="p-3 text-right">Paying Amount (₹)</th>
                    <th className="p-3 text-center">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allInstallments.length > 0 ? (
                    allInstallments.map((inst, index) => {
                      const isSelected = selectedInstallments.includes(inst.id);
                      const isPaid = inst.dueAmount <= 0 || inst.status === "Paid";
                      const displayPaidAmt = inst.paidAmount > 0 ? inst.paidAmount : (isPaid ? inst.amount : 0);

                      // Calculate cumulative prior arrears from preceding pending installments
                      const priorArrears = allInstallments
                        .slice(0, index)
                        .filter((prevInst) => prevInst.dueAmount > 0 && prevInst.status !== "Paid" && prevInst.status !== "Cancelled")
                        .reduce((sum, prevInst) => sum + prevInst.dueAmount, 0);

                      const cumulativeDue = inst.dueAmount + priorArrears;
                      const customAmtVal = customCollectionAmounts[inst.id] !== undefined
                        ? customCollectionAmounts[inst.id]
                        : (isSelected ? String(inst.dueAmount) : "");

                      return (
                        <tr
                          key={inst.id}
                          className={`transition-colors ${isPaid ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : isSelected ? 'bg-blue-50/30 dark:bg-blue-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/50'}`}
                        >
                          <td className="p-3 font-mono font-semibold text-slate-600">{index + 1}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{inst.feeHeadName}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              inst.termName?.toLowerCase().includes("full") 
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}>
                              {inst.termName || "Full Annual Fee"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-mono">{formatDateForDisplay(inst.dueDate)}</td>
                          <td className="p-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(inst.amount)}</td>
                          <td className="p-3 text-right font-mono text-emerald-600 font-semibold">₹ 0</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(displayPaidAmt)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            {isPaid ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹ 0</span>
                            ) : (
                              <div>
                                <span className="text-rose-600 dark:text-rose-400 block">{formatCurrency(cumulativeDue)}</span>
                                {priorArrears > 0 && (
                                  <span className="text-[9px] font-sans text-amber-600 dark:text-amber-400 block font-normal">
                                    (incl. {formatCurrency(priorArrears)} prior arrears)
                                  </span>
                                )}
                                {isSelected && customAmtVal !== "" && Number(customAmtVal) < inst.dueAmount && (
                                  <span className="text-[9px] font-sans text-amber-600 dark:text-amber-400 block font-bold">
                                    Remaining: {formatCurrency(Math.max(0, inst.dueAmount - Number(customAmtVal)))}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {isPaid ? (
                              <span className="text-slate-400 font-medium">₹ 0</span>
                            ) : isSelected ? (
                              <div className="flex justify-end items-center">
                                <div className="relative w-28">
                                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max={inst.dueAmount}
                                    value={customAmtVal}
                                    onChange={(e) => handleCustomAmountChange(inst.id, e.target.value)}
                                    className="w-full pl-6 pr-2 py-1 text-right border border-blue-400 dark:border-blue-500 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    placeholder={String(inst.dueAmount)}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                PAID
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                {inst.paidAmount > 0 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    PARTIAL
                                  </span>
                                )}
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleInstallmentSelection(inst.id)}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-500 dark:text-slate-400 font-medium">
                        No outstanding fee heads found for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
              Total Selected Amount:{" "}
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-mono text-sm">
                {formatCurrency(baseSelectedAmount)}
              </span>
            </div>
          </div>

          {/* 3 Bottom Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Apply Fine */}
            <div className="glass-card p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Apply Fine (if any)
                </span>
                <input
                  type="checkbox"
                  checked={!isFineWaived}
                  onChange={(e) => setIsFineWaived(!e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Fine Amount (₹)
                </label>
                <input
                  type="number"
                  disabled={isFineWaived}
                  value={isFineWaived ? 0 : fineAmountInput}
                  onChange={(e) => setFineAmountInput(e.target.value)}
                  placeholder="0"
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono font-bold text-rose-600 dark:text-rose-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  placeholder="Enter reason if any"
                  value={fineReason}
                  onChange={(e) => setFineReason(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Card 2: Concessions / Discounts */}
            <div className="glass-card p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Concessions / Discounts
              </span>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Select Concession
                </label>
                <select
                  value={selectedConcessionId}
                  onChange={(e) => {
                    setSelectedConcessionId(e.target.value);
                    if (!e.target.value) setDiscountAmountInput("0");
                  }}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-semibold"
                >
                  <option value="">No Concession</option>
                  {allConcessionOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  value={discountAmountInput}
                  onChange={(e) => setDiscountAmountInput(e.target.value)}
                  placeholder="0"
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  placeholder="Enter remarks (optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Card 3: Payment Method */}
            <div className="glass-card p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Payment Method
              </span>
              <div>
                <select
                  value={paymentMode || "Cash"}
                  onChange={(e) => handlePaymentModeChange(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online">UPI / Online</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Amount Received (₹ Custom / Full)
                </label>
                <input
                  type="number"
                  min="1"
                  max={computedNetPayable > 0 ? computedNetPayable : 0}
                  disabled={isFullyPaid || computedNetPayable <= 0 || selectedInstallments.length === 0}
                  value={computedNetPayable > 0 ? (customAmountReceived !== "" ? customAmountReceived : amountPaying) : 0}
                  onChange={(e) => handleGlobalCustomAmountChange(e.target.value)}
                  placeholder={String(computedNetPayable)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Reference No
                </label>
                <input
                  type="text"
                  placeholder="Enter reference no"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Payment Summary */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Payment Summary
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Total Selected Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(baseSelectedAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Fine Amount</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {effectiveFineAmount > 0 ? `+ ${formatCurrency(effectiveFineAmount)}` : `₹ 0`}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Discount Amount</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {effectiveDiscountAmount > 0 ? `- ${formatCurrency(effectiveDiscountAmount)}` : `₹ 0`}
                </span>
              </div>

              {/* Custom Payment Amount Control */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Custom Paying Amount
                  </label>
                  {customAmountReceived ? (
                    <button
                      type="button"
                      onClick={() => handleGlobalCustomAmountChange("")}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Reset to Full
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={computedNetPayable > 0 ? computedNetPayable : 0}
                    disabled={isFullyPaid || computedNetPayable <= 0 || selectedInstallments.length === 0}
                    value={customAmountReceived}
                    onChange={(e) => handleGlobalCustomAmountChange(e.target.value)}
                    placeholder={String(computedNetPayable)}
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {isFullyPaid ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      All fees are fully paid. No pending dues to collect.
                    </span>
                  ) : selectedInstallments.length === 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Select at least one pending fee component to enable payment.
                    </span>
                  ) : customAmountReceived && Number(customAmountReceived) < computedNetPayable ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Partial payment: {formatCurrency(Number(customAmountReceived))} will be collected, remaining {formatCurrency(computedNetPayable - Number(customAmountReceived))} stays due.
                    </span>
                  ) : (
                    "Leave blank for full selected amount, or enter custom amount for partial payment."
                  )}
                </p>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">
                  Amount to Collect
                </span>
                <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(amountPaying)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!isFormValid || isProcessingPayment}
              onClick={handleSubmitPayment}
              title={!isFormValid ? validationMessage : undefined}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isFormValid && !isProcessingPayment
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-none cursor-not-allowed opacity-70"
              }`}
            >
              <Receipt className="w-4 h-4" />
              {isProcessingPayment ? "Processing Payment..." : "Confirm Payment & Generate Receipt"}
            </button>
          </div>

          {/* Card 2: Recent Payments */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Payments
              </h3>
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {(displayedRecentPayments && displayedRecentPayments.length > 0) ? (
                displayedRecentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        {p.receiptNo || p.id}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateForDisplay(p.paymentDate)} • {p.paymentMode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.amountPaid || (p as any).amount || 0)}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Paid
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-2">No recent payment receipts found.</p>
              )}
            </div>
          </div>

          {/* Card 3: Quick Actions */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(true)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer transition-colors"
              >
                📄 View Student Ledger
              </button>
              <button
                type="button"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer transition-colors"
              >
                📅 View Fee Schedule
              </button>
              <button
                type="button"
                onClick={() => {
                  if (feePayments && feePayments.length > 0) {
                    onPrintReceipt(feePayments[0]);
                  } else {
                    addToast("info", "No Receipts", "No previous payments found to print.");
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer transition-colors"
              >
                🖨️ Print Receipt
              </button>
              <button
                type="button"
                onClick={() => {
                  addToast("success", "Downloading Receipt", "Generating PDF receipt file...");
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer transition-colors"
              >
                📥 Download Receipt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showPaymentConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Confirm Fee Collection
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Please confirm the collection details before generating receipt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentConfirmModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white font-sans">
                  {activeStudent?.firstName} {activeStudent?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {paymentMode || "Cash"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {formatCurrency(amountPaying)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayment || !isFormValid || totalOutstanding <= 0 || amountPaying <= 0}
                onClick={executeProcessPayment}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
              >
                {isProcessingPayment ? "Processing..." : "Confirm & Print"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Log Modal */}
      {showPaymentHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Payment & Ledger History ({activeStudent?.firstName} {activeStudent?.lastName})
              </h3>
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {displayedHistoryPayments.length > 0 ? (
                displayedHistoryPayments.map((p) => (
                  <div
                    key={p.receiptNo || p.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        {p.receiptNo || p.id}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Date: {formatDateForDisplay(p.paymentDate)} • Mode: {p.paymentMode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-600 text-sm">
                        {formatCurrency(p.amountPaid)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentHistoryModal(false);
                          onPrintReceipt(p);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline mt-1 block"
                      >
                        Print Receipt
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No payment history found for this student.
                </div>
              )}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Transition Modal */}
      {showTransitionModal && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Student Category Transition
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeStudent.firstName} {activeStudent.lastName} ({activeStudent.admissionNo || activeStudent.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransitionModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransition} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  Current Classification:{" "}
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    {isHostellerStudent ? "Residential (Hosteller)" : "Non-Residential (Day Scholar)"}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Transitioning will prorate used transport, stop future charges, assess hostel & deposit fees, and preserve any excess payment as credit.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Student Category
                </label>
                <select
                  value={transitionTargetType}
                  onChange={(e) => setTransitionTargetType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Residential">Residential (Join Hostel)</option>
                  <option value="Non-Residential">Non-Residential (Day Scholar / Transport)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Effective Transition Date
                  </label>
                  <input
                    type="date"
                    value={transitionDate}
                    onChange={(e) => setTransitionDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {transitionTargetType === "Residential" ? (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Last Day of Transport Usage
                    </label>
                    <input
                      type="date"
                      value={transportEndDate}
                      onChange={(e) => setTransportEndDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hostel Vacate Date
                    </label>
                    <input
                      type="date"
                      value={transportEndDate}
                      onChange={(e) => setTransportEndDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {transitionTargetType === "Residential" && (
                <div className="p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                  <h4 className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 text-xs">
                    <Bed className="w-3.5 h-3.5" /> Hostel Room & Bed Allocation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Hostel Joining Date
                      </label>
                      <input
                        type="date"
                        value={hostelJoiningDate}
                        onChange={(e) => setHostelJoiningDate(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Hostel Block
                      </label>
                      <select
                        value={selectedBlockId}
                        onChange={(e) => {
                          setSelectedBlockId(e.target.value);
                          setSelectedRoomId("");
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- Select Block --</option>
                        {hostelBlocks.map((b: any) => (
                          <option key={b.id || b.blockId} value={b.id || b.blockId}>
                            {b.blockName || b.name || `Block ${b.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Room
                      </label>
                      <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- Select Room --</option>
                        {hostelRooms
                          .filter((r: any) => !selectedBlockId || String(r.blockId) === String(selectedBlockId) || String(r.hostelBlockId) === String(selectedBlockId))
                          .map((r: any) => (
                            <option key={r.id || r.roomId} value={r.id || r.roomId}>
                              Room {r.roomNumber || r.roomNo || r.id} ({r.roomType || "Standard"})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Bed Number / Identifier (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bed-1 or B1"
                      value={selectedBedNumber}
                      onChange={(e) => setSelectedBedNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={applyCreditOnTransition}
                      onChange={(e) => setApplyCreditOnTransition(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                      Automatically apply any excess transport payment credit to hostel charges
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason & Administrative Remarks
                </label>
                <textarea
                  rows={2}
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="e.g. Parent requested transition from Day Scholar to Boarder as per application."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransitionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransition}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmittingTransition ? "Processing..." : "Confirm & Transition Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Transport Credit Modal */}
      {showApplyCreditModal && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Apply Transport Credit
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Reallocate unused transport balance to outstanding dues
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyCreditModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyCredit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50 flex justify-between items-center">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">
                  Total Available Credit:
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(backendFeeProfile?.transportCreditAmount ?? 0)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount to Apply (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={backendFeeProfile?.transportCreditAmount ?? 999999}
                  value={creditAmountToApply}
                  onChange={(e) => setCreditAmountToApply(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Fee Head
                </label>
                <select
                  value={creditTargetHead}
                  onChange={(e) => setCreditTargetHead(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Hostel Accommodation">Hostel Accommodation</option>
                  <option value="Hostel Security Deposit">Hostel Security Deposit</option>
                  <option value="Tuition Fee">Tuition Fee</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyCreditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCredit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  {isSubmittingCredit ? "Applying..." : "Apply Credit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Security Deposit Modal */}
      {showRefundDepositModal && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Process Deposit Refund
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hostel Security Deposit Refund & Damage Settlement
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRefundDepositModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefundDeposit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/50 flex justify-between items-center">
                <span className="font-bold text-indigo-900 dark:text-indigo-300">
                  Total Refundable Deposit:
                </span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(backendFeeProfile?.securityDepositRefundable ?? 0)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Refund Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={backendFeeProfile?.securityDepositRefundable ?? 999999}
                    value={refundAmountInput}
                    onChange={(e) => setRefundAmountInput(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Damage Deduction (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={refundAmountInput || 0}
                    value={deductionAmountInput}
                    onChange={(e) => setDeductionAmountInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {Number(deductionAmountInput) > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deduction Reason (Damage / Maintenance)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room lock replacement, wall damage"
                    value={deductionReasonInput}
                    onChange={(e) => setDeductionReasonInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  Net Payable to Student/Parent:
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(Math.max(0, (Number(refundAmountInput) || 0) - (Number(deductionAmountInput) || 0)))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={refundPaymentMode}
                    onChange={(e) => setRefundPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Settlement notes"
                    value={refundRemarks}
                    onChange={(e) => setRefundRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefundDepositModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
                >
                  {isSubmittingRefund ? "Processing..." : "Disburse Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeeCollectionView;