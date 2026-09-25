// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { formatCurrency } from "../../../utils/currency";
import {
  getUniformPackageFeeByClass,
  getUniformFeeForClass,
  getItemFeeFromFinanceConfig,
  calculateClothOrItemPrice,
} from "../../../utils/uniformUtils";
import { matchesClassName, compareClassesAscending } from "../../../utils/classSorter";
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
    getStudentFeeOutstandingSummary,
    getStudentInstallmentSummary,
    fetchFinanceData,
    scholarships,
    discounts,
    applyScholarshipToStudent,
    removeScholarshipFromStudent,
    applyDiscountToStudent,
    removeDiscountFromStudent,
  } = useData();
  const { selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(initialStudent || null);
  const [calcResult, setCalcResult] = useState<StudentCalculationResult | null>(null);

  const [tempScholarshipId, setTempScholarshipId] = useState("");
  const [tempDiscountId, setTempDiscountId] = useState("");
  const [isFineWaived, setIsFineWaived] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
      .filter((adm) => adm && (adm.status === "Enrolled" || adm.status === "Approved"))
      .forEach((adm) => {
        const admId = adm.id || adm.applicationNo || adm.registrationNo;
        const admNo = adm.registrationNo || adm.applicationNo || adm.id;
        if (!admNo) return;
        const fullName = (adm.applicantName || adm.studentName || `${adm.firstName || ''} ${adm.lastName || ''}`).trim();
        if (!fullName) return;

        const nameKey = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nameParts = fullName.split(" ");
        const fName = adm.firstName || nameParts[0] || "Student";
        const lName = adm.lastName || nameParts.slice(1).join(" ") || "";
        const targetCls = adm.appliedClass || adm.targetClass || adm.className || "Class 1";

        map.set(nameKey, {
          id: String(admId),
          firstName: fName,
          lastName: lName,
          admissionNo: admNo,
          className: targetCls,
          section: adm.section || "A",
          gender: adm.gender || "Male",
          studentType: (adm.residentialStatus === "Residential" || adm.studentType === "Residential") ? "Hosteller" : "Day Scholar",
          joiningDate: adm.admissionDate || new Date().toISOString().split("T")[0],
          dueFee: 0,
          paidFee: 0,
          totalFee: 0,
          rollNo: "0",
          fatherName: adm.parentName || adm.fatherName || "",
          motherName: adm.motherName || "",
          mobile: adm.mobile || adm.phone || "",
          email: adm.email || "",
          address: adm.address || "",
          status: "Active",
          academicYear: adm.academicYear || "2026-2027",
          branch: adm.branch || selectedBranch || "Madhapur Branch",
          selectedOptionalFees: adm.selectedOptionalFees || []
        } as unknown as Student);
      });

    // 2. Secondary source: Master database students, skipping legacy dummy ADM-2026-2020 or students already present
    (students || [])
      .filter((s) => s && (!s.status || s.status === "Active" || s.status === "Enrolled"))
      .forEach((s) => {
        if (!s) return;
        const admNoUpper = (s.admissionNo || s.id || "").toUpperCase();
        if (admNoUpper === "ADM-2026-2020") return;

        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || (s as any).studentName || '';
        const nameKey = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (nameKey && map.has(nameKey)) return;

        const admKey = (s.admissionNo || s.id || "").toLowerCase().trim();
        if (admKey) {
          map.set(admKey, s);
        }
      });

    return Array.from(map.values());
  }, [students, admissions]);

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

  const displayedRecentPayments = React.useMemo(() => {
    if (!feePayments || feePayments.length === 0) return [];
    if (!selectedStudent) return feePayments.slice(0, 3);
    const sid = String(selectedStudent.id).toLowerCase().trim();
    const adm = String(selectedStudent.admissionNo || '').toLowerCase().trim();
    const app = String((selectedStudent as any).applicationNo || '').toLowerCase().trim();
    const reg = String((selectedStudent as any).registrationNo || '').toLowerCase().trim();
    const filtered = feePayments.filter((p) => {
      const pid = String(p.studentId || '').toLowerCase().trim();
      const padm = String((p as any).admissionNo || '').toLowerCase().trim();
      return (
        (sid && (pid === sid || padm === sid)) ||
        (adm && (pid === adm || padm === adm)) ||
        (app && (pid === app || padm === app)) ||
        (reg && (pid === reg || padm === reg))
      );
    });
    return filtered.slice(0, 3);
  }, [feePayments, selectedStudent]);

  const updateCalculation = (
    studentId: string,
    freshCalcResult = calculateStudentPayableFee(studentId),
    ledgerOverride?: StudentFeeLedger,
  ) => {
    let calc = freshCalcResult;
    const ledger = ledgerOverride || getStudentFeeLedger(studentId, selectedStudent || undefined, currentYear);

    // Fallback fee calculation if freshCalcResult is null
    if (!calc) {
      const stObj =
        allEnrolledStudents.find(
          (s) => s?.id === studentId || s?.admissionNo === studentId,
        ) || selectedStudent;
      const dfs = (dynamicFeeStructures || []).find((d) =>
        matchesClassName(d.className, stObj?.className),
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
      const grossAmt =
        (calc.baseFee || 0) +
        (calc.transportFee || 0) +
        (calc.hostelFee || 0) +
        (calc.uniformFee || 0);
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
    updateCalculation(st.id);
  };

  const lastInitialStudentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialStudent && (initialStudent.id || initialStudent.admissionNo)) {
      const studentKey = initialStudent.id || initialStudent.admissionNo;
      if (lastInitialStudentIdRef.current !== studentKey) {
        lastInitialStudentIdRef.current = studentKey;
        const matched =
          allEnrolledStudents.find(
            (s) =>
              s.id === initialStudent.id ||
              (initialStudent.admissionNo &&
                s.admissionNo === initialStudent.admissionNo),
          ) || initialStudent;
        handleSelectStudent(matched);
      }
    } else if (!initialStudent) {
      lastInitialStudentIdRef.current = null;
    }
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

    if (amountPaying <= 0) {
      addToast(
        "warning",
        "Selection Required",
        "Please select at least one pending fee component to collect.",
      );
      return;
    }

    if (!paymentMode || paymentMode.trim() === "") {
      addToast(
        "warning",
        "Payment Mode Required",
        "Please select a Payment Mode before issuing receipt.",
      );
      return;
    }

    setShowPaymentConfirmModal(true);
  };

  const executeProcessPayment = () => {
    if (!selectedStudent || !calcResult) return;
    setShowPaymentConfirmModal(false);

    const numericAmount = amountPaying;

    const paymentAllocations = selectedInstallments.map((id) => {
      const inst = allInstallments.find((i: any) => i.id === id);
      const customAmt = inst ? getInstallmentCollectionAmount(inst) : 0;
      return {
        academicYear: inst?.academicYear || currentYear,
        ledgerId: undefined,
        amount: customAmt,
        installmentId: id,
        feeHeadName: inst?.feeHeadName || "Fee",
        termName: inst?.termName || inst?.termId || "Installment",
      };
    });

    const payment = addFeePayment({
      studentId: selectedStudent.id,
      admissionNo: selectedStudent.admissionNo || (selectedStudent as any).registrationNo || (selectedStudent as any).applicationNo,
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
      className: `${selectedStudent.className}-${selectedStudent.section}`,
      amountPaid: numericAmount,
      discount: calcResult.scholarshipDeduction + calcResult.discountDeduction,
      fine: isFineWaived ? 0 : calcResult.fineAmount,
      paymentMode: paymentMode as FeePayment["paymentMode"],
      transactionId:
        paymentMode === "Cheque"
          ? chequeNo
          : paymentMode !== "Cash"
            ? transactionId
            : undefined,
      chequeNo: paymentMode === "Cheque" ? chequeNo : undefined,
      chequeDate: paymentMode === "Cheque" ? chequeDate : undefined,
      bankName: paymentMode === "Cheque" ? bankName : undefined,
      paymentDate: new Date().toISOString().split("T")[0],
      status: numericAmount >= totalOutstanding ? "Paid" : "Partial",
      remarks,
      scholarshipId: calcResult.scholarshipId,
      scholarshipName: calcResult.scholarshipName,
      scholarshipDescription: calcResult.scholarshipDescription,
      scholarshipAmount: calcResult.scholarshipDeduction,
      discountId: calcResult.discountId,
      discountName: calcResult.discountName,
      discountDescription: calcResult.discountDescription,
      discountAmount: calcResult.discountDeduction,
      grossAmount:
        calcResult.baseFee + calcResult.transportFee + calcResult.hostelFee,
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
              academicYear: selectedAcademicYear || financeSettings.academicYear || "2026-2027",
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

    setPaymentMode("");
    setTransactionId("");
    setChequeNo("");
    setChequeDate("");
    setBankName("");
    setRemarks("");
  };

  useEffect(() => {
    if (selectedStudent) {
      const freshCalc = calculateStudentPayableFee(selectedStudent.id);
      if (freshCalc) {
        setCalcResult((prev) => {
          if (!prev) return freshCalc;
          return {
            ...prev,
            paidAmount: freshCalc.paidAmount,
            dueBalance: freshCalc.dueBalance,
            totalPayable: freshCalc.totalPayable,
            paymentHistory: freshCalc.paymentHistory,
          };
        });
      }
    }
  }, [feePayments, selectedStudent?.id]);

  const getInstallmentStatus = (dueAmount: number, dueDate: string, instStatus?: string) => {
    if (instStatus === "Cancelled") return "CANCELLED";
    if (dueAmount <= 0) return "PAID";
    const todayStr = new Date().toISOString().split("T")[0];
    if (todayStr > dueDate) return "OVERDUE";
    return "UPCOMING";
  };

  const currentYear =
    selectedAcademicYear || financeSettings?.academicYear || "2026-2027";

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

    const isResidentStudent =
      selectedStudent?.studentType === "Hosteller" ||
      (selectedStudent as any)?.studentType === "Residential" ||
      (selectedStudent as any)?.residentialStatus === "Residential" ||
      (selectedStudent as any)?.residentialStatus === "Resident";

    const isNonResidentStudent = !isResidentStudent;

    const admRecord = (admissions || []).find((a) => {
      if (!a) return false;
      const sId = selectedStudent.id ? String(selectedStudent.id).toLowerCase().trim() : '';
      const sAdm = selectedStudent.admissionNo ? String(selectedStudent.admissionNo).toLowerCase().trim() : '';
      const sName = `${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.toLowerCase().trim();

      const aId = a.id ? String(a.id).toLowerCase().trim() : '';
      const aApp = a.applicationNo ? String(a.applicationNo).toLowerCase().trim() : '';
      const aReg = a.registrationNo ? String(a.registrationNo).toLowerCase().trim() : '';
      const aName = (a.applicantName || (a as any).studentName || `${a.firstName || ''} ${a.lastName || ''}`).toLowerCase().trim();

      if (sAdm && sAdm !== 'n/a' && (sAdm === aApp || sAdm === aReg || sAdm === aId)) return true;
      if (sId && sId !== '1' && sId !== 'stu-1' && sId !== 'n/a' && (sId === aId || sId === aApp || sId === aReg)) return true;
      if (sName && sName !== 'student' && aName && (sName === aName || sName.includes(aName) || aName.includes(sName))) return true;
      return false;
    });

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
          catLower.includes("hostel") ||
          headLower.includes("hostel") ||
          termLower.includes("hostel");

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

      const isBaseUniform =
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

    return combined;
  }, [
    selectedStudent,
    feePayments,
    studentFeeLedgers,
    studentFeeInstallments,
    studentUniformIssues,
    selectedAcademicYear,
    financeSettings,
  ]);
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

  const amountPaying = selectedCurrentYearAmount + selectedPreviousYearAmount;

  const hasAnyAmountError = selectedInstallments.some((id) => {
    const inst = allInstallments.find((i: any) => i.id === id);
    return inst ? Boolean(getInstallmentAmountError(inst)) : false;
  });

  const isAmountValid =
    selectedInstallments.length > 0 && amountPaying > 0 && !hasAnyAmountError;
  const isModeSelected = Boolean(paymentMode);

  let isModeFieldsValid = false;
  let validationMessage = "";

  if (selectedInstallments.length === 0) {
    validationMessage =
      "Select at least one pending fee component checkbox to collect";
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

  const toggleInstallmentSelection = (id: string) => {
    setSelectedInstallments((prev) => {
      if (prev.includes(id)) {
        setCustomCollectionAmounts((amtPrev) => {
          const copy = { ...amtPrev };
          delete copy[id];
          return copy;
        });
        return prev.filter((x) => x !== id);
      } else {
        const inst = allInstallments.find((i: any) => i.id === id);
        if (inst) {
          setCustomCollectionAmounts((amtPrev) => ({
            ...amtPrev,
            [id]: String(inst.dueAmount),
          }));
        }
        return [...prev, id];
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
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Accounts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Make payments and generate receipts
            </p>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 gap-4">
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
                    {activeStudent.branch || (activeStudent as any).campus || selectedBranch || "Madhapur Branch"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Current Due
                </span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalOutstanding)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(true)}
                className="px-4 py-2 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold transition-all cursor-pointer"
              >
                View Student Ledger
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
        )}
      </div>

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
                        {st.branch || selectedBranch || "Madhapur Branch"}
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
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Outstanding Charges
              </h3>
              <div className="flex items-center gap-2">
                <select className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold">
                  <option>All Fee Heads</option>
                </select>
                <select className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold">
                  <option>All Terms</option>
                </select>
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
                    <th className="p-3 text-center">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allInstallments.length > 0 ? (
                    allInstallments.map((inst, index) => {
                      const isSelected = selectedInstallments.includes(inst.id);
                      const isPaid = inst.dueAmount <= 0 || inst.status === "Paid";
                      const displayPaidAmt = inst.paidAmount > 0 ? inst.paidAmount : (isPaid ? inst.amount : 0);
                      return (
                        <tr
                          key={inst.id}
                          className={`transition-colors ${isPaid ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/50'}`}
                        >
                          <td className="p-3 font-mono font-semibold text-slate-600">{index + 1}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{inst.feeHeadName}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{inst.termName || "Term 1"}</td>
                          <td className="p-3 text-slate-500 font-mono">{inst.dueDate || new Date().toISOString().split('T')[0]}</td>
                          <td className="p-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(inst.amount)}</td>
                          <td className="p-3 text-right font-mono text-emerald-600 font-semibold">₹ 0</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(displayPaidAmt)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            {isPaid ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹ 0</span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400">{formatCurrency(inst.dueAmount)}</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                PAID
                              </span>
                            ) : (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleInstallmentSelection(inst.id)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-500 dark:text-slate-400 font-medium">
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
                {formatCurrency(amountPaying)}
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
                  Fine Amount
                </label>
                <input
                  type="number"
                  disabled={isFineWaived}
                  defaultValue={0}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  placeholder="Enter reason if any"
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
                  value={tempScholarshipId}
                  onChange={(e) => setTempScholarshipId(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-semibold"
                >
                  <option value="">No Concession</option>
                  {scholarships.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Discount Amount
                </label>
                <input
                  type="number"
                  defaultValue={0}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono"
                  readOnly
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
                  value={paymentMode}
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
                  Amount Received
                </label>
                <input
                  type="number"
                  value={amountPaying}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono bg-white dark:bg-slate-900"
                  readOnly
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
                  {formatCurrency(amountPaying)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Fine Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹ 0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Discount Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹ 0</span>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">
                  Net Payable Amount
                </span>
                <span className="font-mono font-black text-lg text-blue-600 dark:text-blue-400">
                  {formatCurrency(amountPaying)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitPayment}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              Confirm Payment & Generate Receipt
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
                        {p.paymentDate} • {p.paymentMode}
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
                onClick={executeProcessPayment}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
              >
                Confirm & Print
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
              {(feePayments || [])
                .filter((p) => !activeStudent || p.studentId === activeStudent.id || (activeStudent.admissionNo && p.studentId === activeStudent.admissionNo))
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        {p.receiptNo || p.id}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Date: {p.paymentDate} • Mode: {p.paymentMode}
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
                ))}
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
    </div>
  );
};

export default FeeCollectionView;