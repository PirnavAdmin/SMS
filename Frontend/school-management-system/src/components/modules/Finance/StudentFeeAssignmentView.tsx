import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { UserPlus, Search, CheckSquare, Square, CheckCircle, CheckCircle2, ArrowRight, Settings2, RefreshCw, X, AlertTriangle, Info, Check } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { FeePolicyType, FeeHeadAssignmentBreakdown, Student } from '../../../types';

export const StudentFeeAssignmentView: React.FC = () => {
  const {
    students,
    updateStudent,
    dynamicFeeStructures,
    studentFeeAssignments,
    assignFeeStructure,
    assignCustomFeeStructure,
    bulkAssignFeeStructure,
    academicClasses,
    academicYears,
    generateInstallmentsForStudent,
    getStudentFeeLedger
  } = useData();

  const { selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [query, setQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetStructureId, setTargetStructureId] = useState<string>('');

  // Configure Policy Modal State for Individual Student
  const [configStudent, setConfigStudent] = useState<Student | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [modalPolicy, setModalPolicy] = useState<FeePolicyType>('Full Annual Fee');
  const [modalAdmissionDate, setModalAdmissionDate] = useState<string>('');
  const [modalAdjustmentReason, setModalAdjustmentReason] = useState<string>('');
  const [modalStructureId, setModalStructureId] = useState<string>('');
  const [customBreakdown, setCustomBreakdown] = useState<FeeHeadAssignmentBreakdown[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewInstallments, setPreviewInstallments] = useState<any[]>([]);

  const activeAY = selectedAcademicYear || '2026-2027';

  // Academic Year Start/End Date Range Check
  const currentAYObj = academicYears.find((ay) => ay.academicYear === activeAY);
  const ayStartDate = currentAYObj?.startDate || `${activeAY.slice(0, 4)}-06-01`;
  const ayEndDate = currentAYObj?.endDate || `${parseInt(activeAY.slice(0, 4), 10) + 1}-05-31`;

  const filteredStudents = students.filter((s) => {
    if (!selectedClass || !selectedSection) return false;
    const matchesClass = s.className === selectedClass;
    const matchesSection = selectedSection === 'All' || s.section === selectedSection;
    const matchesQuery =
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(query.toLowerCase());
    return matchesClass && matchesSection && matchesQuery;
  });

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = () => {
    if (selectedStudentIds.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select at least one student for bulk fee assignment.');
      return;
    }
    if (!targetStructureId) {
      addToast('warning', 'Select Fee Structure', 'Please select a fee structure to assign.');
      return;
    }

    bulkAssignFeeStructure(selectedStudentIds, targetStructureId);
    addToast('success', 'Fee Structure Assigned', `Assigned structure to ${selectedStudentIds.length} students.`);
    setSelectedStudentIds([]);
  };

  // Open Policy Configuration Modal
  const handleOpenConfigModal = (st: Student) => {
    setConfigStudent(st);

    // Find structure for student's class
    const matchingDfs =
      dynamicFeeStructures.find((d) => d.className === st.className && d.academicYear === activeAY) ||
      dynamicFeeStructures.find((d) => d.className === st.className) ||
      dynamicFeeStructures[0];

    const structId = matchingDfs ? matchingDfs.id : '';
    setModalStructureId(structId);

    const admDate = st.joiningDate || (st as any).admissionDate || `${activeAY.slice(0, 4)}-08-15`;
    setModalAdmissionDate(admDate);

    // Check existing assignment
    const existingAssign = studentFeeAssignments.find(
      (a) => a.studentId === st.id && a.academicYear === activeAY
    );

    if (existingAssign) {
      setModalPolicy(existingAssign.feePolicy || 'Full Annual Fee');
      setModalAdjustmentReason(existingAssign.adjustmentReason || '');
    } else {
      setModalPolicy('Full Annual Fee');
      setModalAdjustmentReason('');
    }

    // Initialize Breakdown Table
    buildModalBreakdown(matchingDfs, 'Full Annual Fee', admDate);
    setIsPreviewOpen(false);
    setIsConfigModalOpen(true);
  };

  // Build Breakdown Table
  const buildModalBreakdown = (dfsObj: any, policy: FeePolicyType, admDateStr: string) => {
    if (!dfsObj || !dfsObj.items) {
      setCustomBreakdown([]);
      return;
    }

    let proRataFactor = 1.0;
    if (policy === 'Pro-rata' && admDateStr) {
      const admMonth = new Date(admDateStr).getMonth() + 1; // 1-12
      const remainingMonths = Math.max(1, 12 - (admMonth >= 6 ? admMonth - 6 : admMonth + 6));
      proRataFactor = remainingMonths / 12;
    } else if (policy === 'Term-wise' && admDateStr) {
      const admMonth = new Date(admDateStr).getMonth() + 1;
      proRataFactor = admMonth <= 9 ? 0.67 : 0.33;
    }

    const itemsList: FeeHeadAssignmentBreakdown[] = dfsObj.items.map((item: any) => {
      const orig = item.amount;
      const hNameLower = item.feeHeadName.toLowerCase();
      const categoryLower = (item.category || '').toLowerCase();
      const isEligible =
        hNameLower.includes('tuition') ||
        hNameLower.includes('transport') ||
        hNameLower.includes('mess') ||
        hNameLower.includes('monthly') ||
        categoryLower.includes('tuition') ||
        categoryLower.includes('transport') ||
        categoryLower.includes('mess');

      let assigned = orig;
      if (policy === 'Pro-rata' || policy === 'Term-wise') {
        assigned = isEligible ? Math.round(orig * proRataFactor) : orig;
      } else if (policy === 'Custom') {
        assigned = orig;
      } else {
        assigned = orig;
      }

      return {
        feeHeadId: item.feeHeadId,
        feeHeadName: item.feeHeadName,
        category: item.feeHeadName.includes('Tuition')
          ? 'Tuition Fee'
          : item.feeHeadName.includes('Transport')
          ? 'Transport Fee'
          : 'Other Fee',
        billingType: isEligible ? 'Monthly' : 'One-time',
        originalAmount: orig,
        assignedAmount: assigned,
        adjustmentAmount: assigned - orig,
        isEligibleForProRata: isEligible
      };
    });

    setCustomBreakdown(itemsList);
  };

  const handlePolicyChange = (newPolicy: FeePolicyType) => {
    setModalPolicy(newPolicy);
    const dfsObj = dynamicFeeStructures.find((d) => d.id === modalStructureId);
    buildModalBreakdown(dfsObj, newPolicy, modalAdmissionDate);
  };

  const handleAdmissionDateChange = (newDate: string) => {
    setModalAdmissionDate(newDate);
    const dfsObj = dynamicFeeStructures.find((d) => d.id === modalStructureId);
    buildModalBreakdown(dfsObj, modalPolicy, newDate);
  };

  const handleCustomAmountChange = (headId: string, valStr: string) => {
    const numericVal = parseFloat(valStr) || 0;
    setCustomBreakdown((prev) =>
      prev.map((item) =>
        item.feeHeadId === headId
          ? {
              ...item,
              assignedAmount: Math.max(0, numericVal),
              adjustmentAmount: Math.max(0, numericVal) - item.originalAmount
            }
          : item
      )
    );
  };

  const handleSaveModalAssignment = () => {
    if (!configStudent || !modalStructureId) return;

    // Validate Admission Date range
    if (modalAdmissionDate < ayStartDate || modalAdmissionDate > ayEndDate) {
      addToast(
        'error',
        'Invalid Admission Date',
        `Admission date (${modalAdmissionDate}) must fall within current academic year dates (${ayStartDate} to ${ayEndDate}).`
      );
      return;
    }

    if (modalPolicy === 'Custom' && !modalAdjustmentReason.trim()) {
      addToast('warning', 'Reason Required', 'Please provide an adjustment reason for Custom Amount policy.');
      return;
    }

    updateStudent(configStudent.id, {
      joiningDate: modalAdmissionDate,
      feeCalculationMethod: modalPolicy as any
    });

    assignCustomFeeStructure(
      configStudent.id,
      modalStructureId,
      modalPolicy,
      customBreakdown,
      modalAdjustmentReason,
      modalAdmissionDate
    );

    addToast(
      'success',
      'Fee Assignment Saved',
      `Assigned ${modalPolicy === 'Custom' ? 'Custom Amount' : modalPolicy} policy for ${configStudent.firstName}.`
    );

    setIsConfigModalOpen(false);
  };

  const handleGenerateSchedulePreview = () => {
    if (!configStudent || !modalStructureId) return;

    // Validate Admission Date range
    if (modalAdmissionDate < ayStartDate || modalAdmissionDate > ayEndDate) {
      addToast(
        'error',
        'Invalid Admission Date',
        `Admission date (${modalAdmissionDate}) must fall within current academic year dates (${ayStartDate} to ${ayEndDate}).`
      );
      return;
    }

    if (modalPolicy === 'Custom' && !modalAdjustmentReason.trim()) {
      addToast('warning', 'Reason Required', 'Please provide an adjustment reason for Custom Amount policy.');
      return;
    }

    const tempAssignment = {
      id: 'TEMP-ASSIGN',
      studentId: configStudent.id,
      studentName: `${configStudent.firstName} ${configStudent.lastName}`,
      admissionNo: configStudent.admissionNo,
      branch: configStudent.branch || 'Main Campus',
      academicYear: activeAY,
      className: configStudent.className,
      section: configStudent.section,
      feeStructureId: modalStructureId,
      assignedFeeHeads: customBreakdown.map(i => ({
        feeHeadId: i.feeHeadId,
        feeHeadName: i.feeHeadName,
        category: i.category,
        amount: i.assignedAmount
      })),
      baseFeeTotal: assignedTotalSum,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'Active' as const,
      feePolicy: modalPolicy
    };

    const tempLedger = {
      id: `LED-TEMP-${configStudent.id}`,
      studentId: configStudent.id,
      studentName: `${configStudent.firstName} ${configStudent.lastName}`,
      admissionNo: configStudent.admissionNo,
      className: configStudent.className,
      section: configStudent.section,
      studentType: (configStudent.studentType === 'Residential' ? 'Hosteller' : 'Day Scholar') as 'Day Scholar' | 'Hosteller',
      academicYear: activeAY,
      feeItems: customBreakdown.map(i => ({
        headId: i.feeHeadId,
        headName: i.feeHeadName,
        category: i.category,
        originalAmount: i.originalAmount,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: i.assignedAmount,
        isApplicable: true,
        status: 'Pending' as const
      })),
      totalOriginalAmount: originalTotalSum,
      grossAmount: originalTotalSum,
      totalScholarship: 0,
      totalDiscount: 0,
      totalFine: 0,
      totalPayable: assignedTotalSum,
      paidAmount: 0,
      dueBalance: assignedTotalSum,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      scholarshipAmount: 0,
      discountAmount: 0,
      fineAmount: 0,
      previousDue: 0
    };

    const insts = generateInstallmentsForStudent(configStudent.id, activeAY, tempAssignment, tempLedger);
    setPreviewInstallments(insts);
    setIsPreviewOpen(true);
  };

  const originalTotalSum = customBreakdown.reduce((sum, i) => sum + i.originalAmount, 0);
  const assignedTotalSum = customBreakdown.reduce((sum, i) => sum + i.assignedAmount, 0);
  const adjustmentTotalSum = assignedTotalSum - originalTotalSum;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-sky-500" /> Student Fee Assignment & Policy Management
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Allocate standard fee structures or configure mid-year admission adjustments (Full Annual Fee, Pro-rata, Term-wise, Custom Amount).
        </p>
      </div>

      {/* Filter & Bulk Control Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto text-xs">
          <div>
            <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1 text-[11px]">Class Grade</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="">Select Class</option>
              {academicClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1 text-[11px]">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none"
              disabled={!selectedClass}
            >
              <option value="">Select Section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1 text-[11px]">Search Student</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student or adm no..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none w-56 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Bulk Action */}
        <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
          <div>
            <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1 text-[11px]">Assign Target Structure</label>
            <select
              value={targetStructureId}
              onChange={(e) => setTargetStructureId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer outline-none"
            >
              <option value="">Select Target Structure</option>
              {dynamicFeeStructures.map((dfs) => (
                <option key={dfs.id} value={dfs.id}>
                  {dfs.className} - {formatCurrency(dfs.totalAmount)} ({dfs.studentCategory})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleBulkAssign}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer h-[38px]"
          >
            <CheckCircle className="w-4 h-4" /> Bulk Assign ({selectedStudentIds.length})
          </button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">
                  <button onClick={handleSelectAll} className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                    {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-sky-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Class & Sec</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Fee Policy</th>
                <th className="py-3.5 px-4">Assigned Fee Payable</th>
                <th className="py-3.5 px-4 text-right">Configure / Assign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {!selectedClass || !selectedSection ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 font-bold italic">
                    Please select a Class Grade and Section to view and allocate student fee assignments.
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 font-bold italic">
                    No students found matching the selected class, section, or search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const isSelected = selectedStudentIds.includes(st.id);
                  const assignment = studentFeeAssignments.find(
                    (a) => a.studentId === st.id && a.academicYear === activeAY
                  );

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                        isSelected ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button onClick={() => handleToggleSelect(st.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {st.firstName?.[0] || 'S'}
                        </div>
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{st.admissionNo}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {st.className}-{st.section}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        {st.category || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        {assignment ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px]">
                            {assignment.feePolicy === 'Custom' ? 'Custom Amount' : assignment.feePolicy || 'Full Annual Fee'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px]">
                            Default Annual
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(assignment ? assignment.baseFeeTotal : st.totalFee || 0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenConfigModal(st)}
                          className="px-3 py-1 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold hover:bg-sky-100 flex items-center gap-1.5 ml-auto border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                        >
                          <Settings2 className="w-3.5 h-3.5" /> Configure Policy
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

      {/* POLICY & MID-YEAR ASSIGNMENT MODAL */}
      {isConfigModalOpen && configStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 text-white backdrop-blur-md">
                  <Settings2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Configure Student Fee Assignment & Policy</h3>
                  <p className="text-xs text-sky-200 font-medium">
                    {configStudent.firstName} {configStudent.lastName} • Adm No: <span className="font-mono">{configStudent.admissionNo}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs bg-slate-50/50 dark:bg-slate-950/40">
              {isPreviewOpen ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 grid grid-cols-2 gap-4 font-bold text-slate-700 dark:text-slate-350">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Student Name</span>
                      <span className="text-slate-900 dark:text-white font-black text-sm">{configStudent.firstName} {configStudent.lastName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Academic Session</span>
                      <span className="text-sky-600 dark:text-sky-400 font-extrabold text-sm font-mono">{activeAY}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b">
                          <th className="p-3">Fee Head</th>
                          <th className="p-3 font-mono">Annual Assigned</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Term / Installment</th>
                          <th className="p-3">Due Date</th>
                          <th className="p-3 font-mono text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {previewInstallments.map((inst, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{inst.feeHeadName}</td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                              {formatCurrency(inst.amount * (inst.frequency === 'One Time' ? 1 : (inst.frequency === 'Term-wise' ? previewInstallments.filter(i => i.feeHeadId === inst.feeHeadId).length : (inst.frequency === 'Quarterly' ? 4 : (inst.frequency === 'Half-Yearly' ? 2 : (inst.frequency === 'Monthly' ? 12 : 1))))))}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {inst.frequency}
                              </span>
                            </td>
                            <td className="p-3 text-slate-800 dark:text-slate-200 font-bold">{inst.termName || 'Term 1'}</td>
                            <td className="p-3 font-mono text-slate-500">{inst.dueDate}</td>
                            <td className="p-3 font-mono text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(inst.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  {/* Student Metadata Card */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">Academic Session</span>
                      <span className="font-extrabold font-mono text-sky-600">{activeAY}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">Class & Section</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{configStudent.className} - {configStudent.section}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">Student Type</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{configStudent.studentType || 'Day Scholar'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">Admission Date</span>
                      <input
                        type="date"
                        value={modalAdmissionDate}
                        onChange={(e) => handleAdmissionDateChange(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Policy Selector */}
                  <div className="space-y-2">
                    <label className="block font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                      Select Fee Policy:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <label
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          modalPolicy === 'Full Annual Fee'
                            ? 'border-sky-600 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">Full Annual Fee</span>
                          <input
                            type="radio"
                            name="feePolicy"
                            checked={modalPolicy === 'Full Annual Fee'}
                            onChange={() => handlePolicyChange('Full Annual Fee')}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">Standard full session fee</span>
                      </label>

                      <label
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          modalPolicy === 'Pro-rata'
                            ? 'border-sky-600 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">Pro-rata</span>
                          <input
                            type="radio"
                            name="feePolicy"
                            checked={modalPolicy === 'Pro-rata'}
                            onChange={() => handlePolicyChange('Pro-rata')}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">Pro-rated monthly/term heads</span>
                      </label>

                      <label
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          modalPolicy === 'Term-wise'
                            ? 'border-sky-600 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">Term-wise Fee</span>
                          <input
                            type="radio"
                            name="feePolicy"
                            checked={modalPolicy === 'Term-wise'}
                            onChange={() => handlePolicyChange('Term-wise')}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">Applicable terms remaining</span>
                      </label>

                      <label
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          modalPolicy === 'Custom'
                            ? 'border-sky-600 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">Custom Amount</span>
                          <input
                            type="radio"
                            name="feePolicy"
                            checked={modalPolicy === 'Custom'}
                            onChange={() => handlePolicyChange('Custom')}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">Manual admin adjustments</span>
                      </label>
                    </div>
                  </div>

                  {/* Adjustment Reason input for Custom Amount */}
                  {modalPolicy === 'Custom' && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                      <label className="block font-bold text-amber-900 dark:text-amber-300">
                        Adjustment Reason / Notes (Required for Custom Amount):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mid-Year Late Joining Discount, Special Financial Concession"
                        value={modalAdjustmentReason}
                        onChange={(e) => setModalAdjustmentReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 font-medium text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}

                  {/* Fee Head Breakdown Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                        Fee Head Breakdown:
                      </span>
                      <button
                        onClick={() => {
                          const dfsObj = dynamicFeeStructures.find((d) => d.id === modalStructureId);
                          buildModalBreakdown(dfsObj, modalPolicy, modalAdmissionDate);
                        }}
                        className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Recalculate
                      </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b">
                            <th className="p-3">Fee Head</th>
                            <th className="p-3">Billing Config</th>
                            <th className="p-3 font-mono">Standard Amount</th>
                            <th className="p-3 font-mono">Assigned Amount</th>
                            <th className="p-3 font-mono text-right">Adjustment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {customBreakdown.map((item) => (
                            <tr key={item.feeHeadId}>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                {item.feeHeadName}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.isEligibleForProRata
                                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  {item.isEligibleForProRata ? 'Monthly (Pro-rata Eligible)' : 'One-Time (Fixed)'}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                                {formatCurrency(item.originalAmount)}
                              </td>
                              <td className="p-3">
                                {modalPolicy === 'Custom' ? (
                                  <input
                                    type="number"
                                    value={item.assignedAmount}
                                    onChange={(e) => handleCustomAmountChange(item.feeHeadId, e.target.value)}
                                    className="w-28 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold font-mono text-slate-900 dark:text-white text-xs"
                                  />
                                ) : (
                                  <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                                    {formatCurrency(item.assignedAmount)}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-right">
                                <span
                                  className={
                                    item.adjustmentAmount < 0
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : item.adjustmentAmount > 0
                                      ? 'text-rose-600'
                                      : 'text-slate-400'
                                  }
                                >
                                  {item.adjustmentAmount === 0 ? '₹0' : formatCurrency(item.adjustmentAmount)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t text-xs">
                            <td colSpan={2} className="p-3 uppercase">Total Breakdown Summary:</td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{formatCurrency(originalTotalSum)}</td>
                            <td className="p-3 font-mono text-sky-700 dark:text-sky-300">{formatCurrency(assignedTotalSum)}</td>
                            <td className="p-3 font-mono text-right">
                              <span className={adjustmentTotalSum < 0 ? 'text-emerald-600' : 'text-slate-600'}>
                                {formatCurrency(adjustmentTotalSum)}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 shrink-0">
              {isPreviewOpen ? (
                <>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Recalculate / Adjust
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleGenerateSchedulePreview}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Refresh Preview
                    </button>
                    <button
                      onClick={handleSaveModalAssignment}
                      className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Save Assignment
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsConfigModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const dfsObj = dynamicFeeStructures.find((d) => d.id === modalStructureId);
                        buildModalBreakdown(dfsObj, modalPolicy, modalAdmissionDate);
                        addToast('info', 'Recalculated', 'Recalculated fee head breakdown.');
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Recalculate
                    </button>
                    <button
                      onClick={handleGenerateSchedulePreview}
                      className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" /> Generate Schedule
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
