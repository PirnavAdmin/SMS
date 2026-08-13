import React, { useState } from "react";
import { formatCurrency } from "../../../utils/currency";
import {
  IndianRupee,
  Search,
  Receipt,
  CheckCircle,
  AlertCircle,
  Calculator,
  History,
  ArrowRight,
  Printer,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Student, FeePayment, StudentFeeLedger } from "../../../types";
import {
  useData,
  StudentCalculationResult,
} from "../../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { Badge } from "../../common/Badge";

interface FeeCollectionViewProps {
  onPrintReceipt: (payment: FeePayment) => void;
}

export const FeeCollectionView: React.FC<FeeCollectionViewProps> = ({
  onPrintReceipt,
}) => {
  const {
    students,
    feePayments,
    studentFeeLedgers,
    studentFeeInstallments,
    calculateStudentPayableFee,
    addFeePayment,
    financeSettings,
    getStudentFeeLedger,
    getStudentFeeOutstandingSummary,
    getStudentInstallmentSummary,
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [calcResult, setCalcResult] = useState<StudentCalculationResult | null>(
    null,
  );

  const [tempScholarshipId, setTempScholarshipId] = useState("");
  const [tempDiscountId, setTempDiscountId] = useState("");

  const [selectedInstallments, setSelectedInstallments] = useState<string[]>(
    [],
  );
  const [customCollectionAmounts, setCustomCollectionAmounts] = useState<
    Record<string, string>
  >({});
  const [paymentMode, setPaymentMode] = useState<
    FeePayment["paymentMode"] | ""
  >("");
  const [transactionId, setTransactionId] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [remarks, setRemarks] = useState("");

  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [isPreviousDuesOpen, setIsPreviousDuesOpen] = useState(true);

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

  const filteredStudents = students.filter(
    (s) =>
      `${s.firstName} ${s.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const updateCalculation = (
    studentId: string,
    freshCalcResult = calculateStudentPayableFee(studentId),
    ledgerOverride?: StudentFeeLedger,
  ) => {
    let calc = freshCalcResult;
    const ledger = ledgerOverride || getStudentFeeLedger(studentId);
    if (ledger && calc) {
      const scholarshipAmt = ledger.scholarshipAmount || 0;
      const discountAmt = ledger.discountAmount || 0;

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
    setTempScholarshipId("");
    setTempDiscountId("");
    setSelectedInstallments([]);
    setCustomCollectionAmounts({});
    updateCalculation(st.id);
  };

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
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
      className: `${selectedStudent.className}-${selectedStudent.section}`,
      amountPaid: numericAmount,
      discount: calcResult.scholarshipDeduction + calcResult.discountDeduction,
      fine: calcResult.fineAmount,
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
      selectedInstallmentIds: selectedInstallments,
      paymentAllocation: paymentAllocations,
    });

    addToast(
      "success",
      "Payment Processed",
      `Issued official receipt ${payment.receiptNo} for ${formatCurrency(numericAmount)}`,
    );
    onPrintReceipt(payment);

    const updatedStudent =
      students.find((s) => s.id === selectedStudent.id) || selectedStudent;
    setSelectedStudent({ ...updatedStudent });
    setSelectedInstallments([]);
    setCustomCollectionAmounts({});
    updateCalculation(selectedStudent.id);

    setPaymentMode("");
    setTransactionId("");
    setChequeNo("");
    setChequeDate("");
    setBankName("");
    setRemarks("");
  };

  const getInstallmentStatus = (dueAmount: number, dueDate: string) => {
    if (dueAmount <= 0) return "PAID";
    const todayStr = new Date().toISOString().split("T")[0];
    if (todayStr > dueDate) return "OVERDUE";
    return "UPCOMING";
  };

  const studentLedgers = selectedStudent
    ? studentFeeLedgers.filter((l: any) => l.studentId === selectedStudent.id)
    : [];
  const years = Array.from(
    new Set(studentLedgers.map((l: any) => l.academicYear as string)),
  );
  const allInstallments = selectedStudent
    ? years.flatMap(
        (yr: string) =>
          getStudentFeeLedger(selectedStudent.id, yr)?.installments || [],
      )
    : [];

  const currentYear =
    selectedAcademicYear || financeSettings?.academicYear || "2026-2027";
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
    if (!groupedCurrentYear[inst.feeHeadName]) {
      groupedCurrentYear[inst.feeHeadName] = [];
    }
    groupedCurrentYear[inst.feeHeadName].push(inst);
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

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="glass-card p-4 rounded-2xl space-y-3 lg:sticky lg:top-4 h-fit">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-500" /> Select Student
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or adm no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>
          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filteredStudents.map((st) => {
              const isSelected = selectedStudent?.id === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => handleSelectStudent(st)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    isSelected
                      ? "bg-sky-50 dark:bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/20"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={st.avatar}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover"
                  />
                  <div className="truncate">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {st.firstName} {st.lastName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {st.className}-{st.section} • Adm: {st.admissionNo}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-3">
          {selectedStudent && calcResult ? (
            <div className="space-y-3">
              <div className="glass-card p-3.5 rounded-2xl space-y-2 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedStudent.avatar}
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-sky-500/40"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedStudent.className}-{selectedStudent.section} •
                        Adm: {selectedStudent.admissionNo} • Branch:{" "}
                        {selectedStudent.branch}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Total Outstanding Balance
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      <h4 className="text-xl font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(totalOutstanding)}
                      </h4>
                      {totalOutstanding === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-[9px] tracking-wider uppercase">
                          ✓ Settled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-0.5">
                  <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Current AY Dues
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatCurrency(currentYearPending)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Previous Years Arrears
                    </p>
                    <p className="font-bold text-amber-600 mt-0.5">
                      +{formatCurrency(previousYearPending)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Total Concessions
                    </p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      -
                      {formatCurrency(
                        calcResult.scholarshipDeduction +
                          calcResult.discountDeduction,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {(totalOutstanding > 0 ||
                calcResult.scholarshipDeduction > 0 ||
                calcResult.discountDeduction > 0) && (
                <div className="glass-card p-3 rounded-2xl space-y-2 bg-slate-50/40 dark:bg-slate-900/20">
                  <h4 className="font-bold text-xs uppercase text-slate-400">
                    Apply Concessions (Before Payment)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl space-y-1.5">
                      {calcResult.scholarshipDeduction > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-black text-emerald-600">
                              ✓ Scholarship Active
                            </span>
                            <button
                              type="button"
                              onClick={handleRemoveScholarship}
                              className="text-rose-500 font-extrabold hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                            {calcResult.scholarshipName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            -{formatCurrency(calcResult.scholarshipDeduction)}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400 font-bold">
                            Scholarship Concession
                          </label>
                          <div className="flex gap-1.5">
                            <select
                              value={tempScholarshipId}
                              onChange={(e) =>
                                setTempScholarshipId(e.target.value)
                              }
                              className="flex-1 px-0.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-850 border text-[11px] font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                            >
                              <option value="">Select...</option>
                              {scholarships
                                .filter((s) => s.status === "Active")
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} (
                                    {s.discountType === "Percentage"
                                      ? `${s.percentage}%`
                                      : formatCurrency(s.fixedAmount || 0)}
                                    )
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                tempScholarshipId &&
                                handleApplyScholarship(tempScholarshipId)
                              }
                              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl space-y-1.5">
                      {calcResult.discountDeduction > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-black text-emerald-600">
                              ✓ Discount Active
                            </span>
                            <button
                              type="button"
                              onClick={handleRemoveDiscount}
                              className="text-rose-500 font-extrabold hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                            {calcResult.discountName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            -{formatCurrency(calcResult.discountDeduction)}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400 font-bold">
                            General Discount
                          </label>
                          <div className="flex gap-1.5">
                            <select
                              value={tempDiscountId}
                              onChange={(e) =>
                                setTempDiscountId(e.target.value)
                              }
                              className="flex-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-850 border text-[11px] font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                            >
                              <option value="">Select...</option>
                              {discounts
                                .filter((d) => d.status === "Active")
                                .map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} (
                                    {d.mode === "Percentage"
                                      ? `${d.value}%`
                                      : formatCurrency(d.value)}
                                    )
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                tempDiscountId &&
                                handleApplyDiscount(tempDiscountId)
                              }
                              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="glass-card p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-250 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-sky-500" /> Current
                    Academic Year Fees ({currentYear})
                  </h4>
                  {selectableCurrentIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllCurrentYear}
                      className="text-[10px] text-brand-600 dark:text-brand-400 font-bold hover:underline cursor-pointer"
                    >
                      {allCurrentSelected
                        ? "Deselect All Current Year"
                        : "Select All Current Year"}
                    </button>
                  )}
                </div>
                {currentYearInstallments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No fee structure assigned for current academic year.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(groupedCurrentYear).map(
                      ([headName, list]) => {
                        const groupTotal = list.reduce(
                          (sum, i) => sum + i.amount,
                          0,
                        );
                        const groupPaid = list.reduce(
                          (sum, i) => sum + i.paidAmount,
                          0,
                        );
                        const groupRemaining = list.reduce(
                          (sum, i) => sum + i.dueAmount,
                          0,
                        );
                        return (
                          <div
                            key={headName}
                            className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-xl space-y-2"
                          >
                            <div className="flex justify-between items-center border-b border-slate-200/30 dark:border-slate-800 pb-1 text-xs">
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                {headName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold">
                                Total: {formatCurrency(groupTotal)} • Paid:{" "}
                                {formatCurrency(groupPaid)} • Remaining:{" "}
                                <span className="text-rose-600 font-bold">
                                  {formatCurrency(groupRemaining)}
                                </span>
                              </span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pl-1">
                              {list.map((inst) => {
                                const isPaid = inst.dueAmount <= 0;
                                const isChecked = selectedInstallments.includes(
                                  inst.id,
                                );
                                const status = getInstallmentStatus(
                                  inst.dueAmount,
                                  inst.dueDate,
                                );

                                let badgeClass =
                                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                                if (status === "PAID") {
                                  badgeClass =
                                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                                } else if (status === "OVERDUE") {
                                  badgeClass =
                                    "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-350";
                                }

                                const isOneTimeOrAnnual =
                                  inst.frequency === "One Time" ||
                                  inst.frequency === "Annual" ||
                                  inst.termName === "One Time" ||
                                  inst.termName === "Annual" ||
                                  inst.termId === "ONETIME" ||
                                  inst.termId === "ANNUAL";

                                return (
                                  <div
                                    key={inst.id}
                                    className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1"
                                  >
                                    <div className="flex items-center gap-3">
                                      {isPaid ? (
                                        <input
                                          type="checkbox"
                                          disabled
                                          checked={false}
                                          className="w-4 h-4 rounded border-slate-200 bg-slate-100 cursor-not-allowed opacity-40"
                                        />
                                      ) : (
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() =>
                                            toggleInstallmentSelection(inst.id)
                                          }
                                          className="w-4 h-4 rounded text-sky-600 border-slate-350 dark:border-slate-700 bg-white focus:ring-sky-500 cursor-pointer shrink-0"
                                        />
                                      )}
                                      <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                          {inst.feeHeadName} —{" "}
                                          {inst.termName ||
                                            inst.termId ||
                                            "Installment"}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                          Due: {inst.dueDate}
                                        </p>
                                        {isChecked && !isPaid && (
                                          <div className="mt-1.5 flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                Collection Amount:
                                              </span>
                                              <div className="relative flex items-center">
                                                <span className="absolute left-2 text-xs font-bold text-slate-400">
                                                  ₹
                                                </span>
                                                <input
                                                  type="text"
                                                  value={
                                                    customCollectionAmounts[
                                                      inst.id
                                                    ] ?? String(inst.dueAmount)
                                                  }
                                                  onChange={(e) =>
                                                    handleCustomAmountChange(
                                                      inst.id,
                                                      e.target.value,
                                                    )
                                                  }
                                                  className={`w-28 pl-5 pr-2 py-1 rounded-lg border text-right font-mono font-bold text-xs outline-none transition-all ${
                                                    getInstallmentAmountError(
                                                      inst,
                                                    )
                                                      ? "border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500/20"
                                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 focus:ring-2 focus:ring-sky-500/20"
                                                  }`}
                                                />
                                              </div>
                                            </div>
                                            {getInstallmentAmountError(
                                              inst,
                                            ) && (
                                              <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                                                {getInstallmentAmountError(
                                                  inst,
                                                )}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-right">
                                      {!isOneTimeOrAnnual && (
                                        <div className="text-[11px] font-medium text-slate-500 space-y-0.5">
                                          <p>
                                            Paid:{" "}
                                            <span className="font-mono">
                                              {formatCurrency(inst.paidAmount)}
                                            </span>
                                          </p>
                                          <p
                                            className={
                                              isPaid
                                                ? "text-slate-400 font-medium"
                                                : "font-semibold text-slate-900 dark:text-white"
                                            }
                                          >
                                            Pending:{" "}
                                            <span className="font-mono">
                                              {formatCurrency(inst.dueAmount)}
                                            </span>
                                          </p>
                                        </div>
                                      )}
                                      <span
                                        className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${badgeClass} min-w-[70px] text-center`}
                                      >
                                        {status}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>

              {previousYearInstallments.length > 0 && (
                <div className="glass-card p-4 rounded-2xl space-y-3 border-amber-250 dark:border-amber-950/60 bg-amber-50/10">
                  <div className="flex items-center justify-between border-b border-amber-150/60 pb-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviousDuesOpen((prev) => !prev)}
                      className="font-black text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2 hover:opacity-85 transition-all cursor-pointer select-none"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Previous Academic Year Dues</span>
                      {!isPreviousDuesOpen && (
                        <span className="text-[10px] font-bold text-rose-600 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full font-mono">
                          (Pending: {formatCurrency(previousYearPending)})
                        </span>
                      )}
                      {isPreviousDuesOpen ? (
                        <ChevronUp className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                    </button>

                    <div className="flex items-center gap-3">
                      {selectablePrevIds.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllPreviousYear}
                          className="text-[10px] text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                        >
                          {allPreviousSelected
                            ? "Deselect All Previous Years"
                            : "Select All Previous Years"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsPreviousDuesOpen((prev) => !prev)}
                        className="px-2 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-300 cursor-pointer transition-all flex items-center gap-1 text-[11px] font-bold"
                        title={
                          isPreviousDuesOpen
                            ? "Close Previous Academic Dues"
                            : "Open Previous Academic Dues"
                        }
                      >
                        <span>{isPreviousDuesOpen ? "Close" : "Open"}</span>
                        {isPreviousDuesOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isPreviousDuesOpen && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {Object.entries(groupedPreviousYears).map(
                        ([year, list]) => {
                          const yearDueTotal = list.reduce(
                            (sum, i) => sum + i.dueAmount,
                            0,
                          );
                          return (
                            <div
                              key={year}
                              className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-xl space-y-2"
                            >
                              <div className="flex justify-between items-center border-b border-slate-200/30 dark:border-slate-800 pb-1 text-xs">
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                  Academic Year: {year}
                                </span>
                                <span className="text-[10px] text-slate-550 font-bold">
                                  Pending:{" "}
                                  <span className="text-rose-600 font-bold font-mono">
                                    {formatCurrency(yearDueTotal)}
                                  </span>
                                </span>
                              </div>
                              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pl-1">
                                {list.map((inst) => {
                                  const isPaid = inst.dueAmount <= 0;
                                  const isChecked =
                                    selectedInstallments.includes(inst.id);
                                  const status = getInstallmentStatus(
                                    inst.dueAmount,
                                    inst.dueDate,
                                  );

                                  let badgeClass =
                                    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                                  if (status === "PAID") {
                                    badgeClass =
                                      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                                  } else if (status === "OVERDUE") {
                                    badgeClass =
                                      "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-350";
                                  }

                                  return (
                                    <div
                                      key={inst.id}
                                      className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1"
                                    >
                                      <div className="flex items-center gap-3">
                                        {isPaid ? (
                                          <input
                                            type="checkbox"
                                            disabled
                                            checked={false}
                                            className="w-4 h-4 rounded border-slate-200 bg-slate-100 cursor-not-allowed opacity-40"
                                          />
                                        ) : (
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() =>
                                              toggleInstallmentSelection(
                                                inst.id,
                                              )
                                            }
                                            className="w-4 h-4 rounded text-amber-600 border-slate-350 dark:border-slate-700 bg-white focus:ring-amber-500 cursor-pointer shrink-0"
                                          />
                                        )}
                                        <div>
                                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                            {inst.feeHeadName} —{" "}
                                            {inst.termName ||
                                              inst.termId ||
                                              "Installment"}
                                          </p>
                                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                            Due: {inst.dueDate}
                                          </p>
                                          {isChecked && !isPaid && (
                                            <div className="mt-1.5 flex flex-col gap-0.5">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                  Collection Amount:
                                                </span>
                                                <div className="relative flex items-center">
                                                  <span className="absolute left-2 text-xs font-bold text-slate-400">
                                                    ₹
                                                  </span>
                                                  <input
                                                    type="text"
                                                    value={
                                                      customCollectionAmounts[
                                                        inst.id
                                                      ] ??
                                                      String(inst.dueAmount)
                                                    }
                                                    onChange={(e) =>
                                                      handleCustomAmountChange(
                                                        inst.id,
                                                        e.target.value,
                                                      )
                                                    }
                                                    className={`w-28 pl-5 pr-2 py-1 rounded-lg border text-right font-mono font-bold text-xs outline-none transition-all ${
                                                      getInstallmentAmountError(
                                                        inst,
                                                      )
                                                        ? "border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500/20"
                                                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 focus:ring-2 focus:ring-sky-500/20"
                                                    }`}
                                                  />
                                                </div>
                                              </div>
                                              {getInstallmentAmountError(
                                                inst,
                                              ) && (
                                                <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                                                  {getInstallmentAmountError(
                                                    inst,
                                                  )}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 text-right">
                                        <div className="text-[11px] font-medium text-slate-500 space-y-0.5">
                                          <p>
                                            Paid:{" "}
                                            <span className="font-mono">
                                              {formatCurrency(inst.paidAmount)}
                                            </span>
                                          </p>
                                          <p
                                            className={
                                              isPaid
                                                ? "text-slate-400 font-medium"
                                                : "font-semibold text-slate-905 dark:text-white"
                                            }
                                          >
                                            Pending:{" "}
                                            <span className="font-mono">
                                              {formatCurrency(inst.dueAmount)}
                                            </span>
                                          </p>
                                        </div>
                                        <span
                                          className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${badgeClass} min-w-[70px] text-center`}
                                        >
                                          {status}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="glass-card p-4 rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-2 space-y-3 pr-0 md:pr-4 md:border-r border-slate-100 dark:border-slate-850">
                  <h4 className="font-black text-xs uppercase text-slate-400 tracking-wider">
                    Payment Summary
                  </h4>
                  <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Current Academic Year Pending:</span>
                      <span className="font-mono text-slate-900 dark:text-white font-extrabold">
                        {formatCurrency(currentYearPending)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Previous Academic Year Pending:</span>
                      <span className="font-mono text-slate-955 dark:text-white font-extrabold">
                        {formatCurrency(previousYearPending)}
                      </span>
                    </div>
                    <hr className="border-slate-150 dark:border-slate-800" />
                    <div className="flex justify-between text-slate-905 dark:text-white font-extrabold">
                      <span>Total Outstanding:</span>
                      <span className="font-mono text-rose-600 font-black text-sm">
                        {formatCurrency(totalOutstanding)}
                      </span>
                    </div>
                    <hr className="border-slate-150 dark:border-slate-800 border-dashed" />
                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 mt-2 font-black text-[13px]">
                      <span>Selected for Collection:</span>
                      <span className="font-mono text-base font-black">
                        {formatCurrency(amountPaying)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <form
                    onSubmit={handleSubmitPayment}
                    className="space-y-3.5 text-xs"
                  >
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => {
                          setPaymentMode(e.target.value as any);
                          setTransactionId("");
                          setChequeNo("");
                          setChequeDate("");
                          setBankName("");
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border font-bold text-slate-900 dark:text-white cursor-pointer outline-none focus:border-brand-500"
                      >
                        <option value="">-- Select Payment Method --</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI / QR Scan</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Other">Other Configured Mode</option>
                      </select>
                    </div>
                    {(paymentMode === "Online" ||
                      paymentMode === "Card" ||
                      paymentMode === "UPI" ||
                      paymentMode === "Bank Transfer" ||
                      paymentMode === "Other") && (
                      <div className="animate-in slide-in-from-top-1">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Transaction Ref / UTR No *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter UTR reference code or Approval ID..."
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border text-slate-900 dark:text-white font-mono outline-none"
                        />
                      </div>
                    )}
                    {paymentMode === "Cheque" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in slide-in-from-top-1">
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Cheque No *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="6-digit No."
                            value={chequeNo}
                            onChange={(e) => setChequeNo(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border text-slate-900 dark:text-white font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Cheque Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={chequeDate}
                            onChange={(e) => setChequeDate(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Bank Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. SBI / ICICI"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Add internal verification notes..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    {!isFormValid && validationMessage && (
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200/60 dark:border-amber-900/60 flex items-center gap-1.5 animate-pulse">
                        ⚠️ {validationMessage}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={!isFormValid}
                      className={`w-full py-2.5 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all ${
                        isFormValid
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 cursor-pointer"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-650 cursor-not-allowed opacity-75"
                      }`}
                    >
                      <IndianRupee className="w-4 h-4" /> Collect Payment &
                      Issue Receipt
                    </button>
                  </form>
                </div>
              </div>

              <div className="glass-card p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-sky-500" /> Recorded
                    Payment Receipts (
                    {
                      feePayments.filter(
                        (p) => p.studentId === selectedStudent.id,
                      ).length
                    }
                    )
                  </h4>
                </div>
                <div className="space-y-2 text-xs max-h-60 overflow-y-auto pr-0.5">
                  {feePayments.filter((p) => p.studentId === selectedStudent.id)
                    .length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">
                      No payment receipts recorded yet.
                    </p>
                  ) : (
                    feePayments
                      .filter((p) => p.studentId === selectedStudent.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-xs">
                                {p.receiptNo}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[9px]">
                                ✓ PAID ({p.paymentMode})
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Date: {p.paymentDate}{" "}
                              {p.transactionId
                                ? `• Ref: ${p.transactionId}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-emerald-600 text-xs">
                              {formatCurrency(p.amountPaid)}
                            </span>
                            <button
                              type="button"
                              onClick={() => onPrintReceipt(p)}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print Receipt
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl text-center space-y-3">
              <Calculator className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto animate-bounce" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">
                No Student Selected
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Select a student from the list on the left to compute and manage
                checkbox fee collections.
              </p>
            </div>
          )}
        </div>
      </div>

      {showPaymentConfirmModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Confirm Official Receipt & Fee Payment
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify details before recording payment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentConfirmModal(false)}
                className="p-1 rounded-lg text-slate-405 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="text-slate-500 font-medium">
                  Student Name:
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {selectedStudent.firstName} {selectedStudent.lastName} (
                  {selectedStudent.admissionNo})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="text-slate-500 font-medium">
                  Class & Section:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedStudent.className}-{selectedStudent.section}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="text-slate-500 font-medium">
                  Payment Mode / Type:
                </span>
                <span className="font-extrabold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  {paymentMode}
                </span>
              </div>
              {paymentMode !== "Cash" && transactionId && (
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-500 font-medium">
                    Transaction / UTR Ref:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {transactionId}
                  </span>
                </div>
              )}
              {remarks && (
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-500 font-medium">
                    Payment Remarks:
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 italic">
                    {remarks}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 font-black text-slate-900 dark:text-white text-sm">
                <span>Total Amount to Collect:</span>
                <span className="text-lg text-emerald-600 dark:text-emerald-400 font-mono font-black">
                  {formatCurrency(amountPaying)}
                </span>
              </div>
            </div>
            <div className="p-3.5 bg-sky-50/60 dark:bg-sky-950/40 rounded-xl border border-sky-200/80 dark:border-sky-800/80 space-y-1.5 text-xs max-h-48 overflow-y-auto">
              <p className="text-[10px] font-extrabold uppercase text-sky-900 dark:text-sky-200 tracking-wider border-b border-sky-100 dark:border-sky-900 pb-1 mb-1">
                Payment Allocation Details
              </p>
              {(() => {
                const selectedInstObjects = allInstallments.filter((i) =>
                  selectedInstallments.includes(i.id),
                );
                const groupedByYear: {
                  [year: string]: typeof selectedInstObjects;
                } = {};
                selectedInstObjects.forEach((inst) => {
                  if (!groupedByYear[inst.academicYear]) {
                    groupedByYear[inst.academicYear] = [];
                  }
                  groupedByYear[inst.academicYear].push(inst);
                });
                return Object.entries(groupedByYear).map(([year, list]) => (
                  <div key={year} className="space-y-0.5">
                    <p className="font-extrabold text-[10px] text-slate-500 uppercase">
                      {year}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] text-slate-700 dark:text-slate-300">
                      {list.map((i) => (
                        <li key={i.id}>
                          {i.feeHeadName} {i.termName ? `— ${i.termName}` : ""}:{" "}
                          <span className="font-mono font-extrabold">
                            {formatCurrency(i.dueAmount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ));
              })()}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeProcessPayment}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4" /> Confirm & Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentHistoryModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Fee Payment & Allocation History Log
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudent.firstName} {selectedStudent.lastName} • Adm
                    No:{" "}
                    <span className="font-mono font-bold">
                      {selectedStudent.admissionNo}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {(() => {
                const studentPayments = feePayments.filter(
                  (p) => p.studentId === selectedStudent.id,
                );
                if (studentPayments.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 font-medium italic border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      No historical fee payment receipts found for this student.
                    </div>
                  );
                }
                return (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/80 font-extrabold uppercase text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th className="p-3">Receipt No</th>
                          <th className="p-3">Payment Date</th>
                          <th className="p-3">Mode / Ref</th>
                          <th className="p-3 font-mono">Amount Paid</th>
                          <th className="p-3 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {studentPayments.map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                          >
                            <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                              {p.receiptNo}
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                              {p.paymentDate}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">
                                {p.paymentMode}
                              </span>
                              {p.transactionId && (
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  Ref: {p.transactionId}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(p.amountPaid)}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => onPrintReceipt(p)}
                                className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-100 flex items-center gap-1 ml-auto text-[11px] border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowPaymentHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close History Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
