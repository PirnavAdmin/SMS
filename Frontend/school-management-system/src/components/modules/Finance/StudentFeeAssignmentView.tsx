import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { UserPlus, Search, CheckSquare, Square, CheckCircle, CheckCircle2, ArrowRight, Settings2, RefreshCw, X, AlertTriangle, Info, Check } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { FeePolicyType, FeeHeadAssignmentBreakdown, Student, FeeScheduleTerm } from '../../../types';
import { matchesClassName, compareClassesAscending } from '../../../utils/classSorter';
import { formatDateForDisplay } from '../../../utils/dateValidation';
import { getApplicableTermsForLateAdmission, getApplicableMonthIndicesForLateAdmission } from '../../../utils/lateAdmission';

export const StudentFeeAssignmentView: React.FC = () => {
  const {
    students,
    updateStudent,
    feeHeads,
    dynamicFeeStructures,
    studentFeeAssignments,
    assignFeeStructure,
    assignCustomFeeStructure,
    bulkAssignFeeStructure,
    academicClasses,
    academicYears,
    academicYearFeeSchedules,
    generateInstallmentsForStudent,
    getStudentFeeLedger
  } = useData();

  const { selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetStructureId, setTargetStructureId] = useState<string>('');

  // Configure Policy Modal State for Individual Student
  const [configStudent, setConfigStudent] = useState<Student | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [modalPolicy, setModalPolicy] = useState<FeePolicyType>('Full Annual Fee');
  const [modalAdmissionDate, setModalAdmissionDate] = useState<string>('');
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);
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

  // Active Schedule & Configured Terms for Policy calculation
  const activeAYSchedule = (academicYearFeeSchedules || []).find((s) => s.academicYear === activeAY);
  const configuredTerms: FeeScheduleTerm[] =
    activeAYSchedule && activeAYSchedule.terms && activeAYSchedule.terms.length > 0
      ? [...activeAYSchedule.terms].sort((a, b) => a.sequence - b.sequence)
      : [
          {
            id: `T1-${activeAY}`,
            termName: 'Term 1',
            startDate: ayStartDate,
            endDate: `${activeAY.slice(0, 4)}-08-31`,
            dueDate: `${activeAY.slice(0, 4)}-06-15`,
            sequence: 1,
            status: 'Active'
          },
          {
            id: `T2-${activeAY}`,
            termName: 'Term 2',
            startDate: `${activeAY.slice(0, 4)}-09-01`,
            endDate: `${activeAY.slice(0, 4)}-11-30`,
            dueDate: `${activeAY.slice(0, 4)}-09-15`,
            sequence: 2,
            status: 'Active'
          },
          {
            id: `T3-${activeAY}`,
            termName: 'Term 3',
            startDate: `${activeAY.slice(0, 4)}-12-01`,
            endDate: `${parseInt(activeAY.slice(0, 4), 10) + 1}-02-28`,
            dueDate: `${activeAY.slice(0, 4)}-12-15`,
            sequence: 3,
            status: 'Active'
          },
          {
            id: `T4-${activeAY}`,
            termName: 'Term 4',
            startDate: `${parseInt(activeAY.slice(0, 4), 10) + 1}-03-01`,
            endDate: ayEndDate,
            dueDate: `${parseInt(activeAY.slice(0, 4), 10) + 1}-03-15`,
            sequence: 4,
            status: 'Active'
          }
        ];

  const applicableTerms = getApplicableTermsForLateAdmission(modalAdmissionDate, configuredTerms);
  const ayStartYear = parseInt(activeAY.split('-')[0], 10) || 2026;
  const applicableMonthIndices = getApplicableMonthIndicesForLateAdmission(modalAdmissionDate, ayStartYear);

  const filteredStudents = students
    .filter((s) => {
      const matchesClass = !selectedClass || selectedClass === 'All' || matchesClassName(s.className, selectedClass);
      const matchesSection = !selectedSection || selectedSection === 'All' || String(s.section || '').toLowerCase() === selectedSection.toLowerCase();
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
      const matchesQuery =
        !query.trim() ||
        fullName.toLowerCase().includes(query.toLowerCase()) ||
        (s.admissionNo || '').toLowerCase().includes(query.toLowerCase());
      return matchesClass && matchesSection && matchesQuery;
    })
    .sort((a, b) => {
      const classComp = compareClassesAscending(a.className, b.className);
      if (classComp !== 0) return classComp;
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim() || (a as any).studentName || a.name || '';
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim() || (b as any).studentName || b.name || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
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

    const classDfs =
      dynamicFeeStructures.find((d) => d.className === selectedClass && d.academicYear === activeAY) ||
      dynamicFeeStructures.find((d) => d.className === selectedClass) ||
      dynamicFeeStructures.find((d) => d.id === targetStructureId) ||
      dynamicFeeStructures[0];

    if (!classDfs) {
      addToast('warning', 'Fee Structure Missing', `No active fee structure found for ${selectedClass || 'the selected class'}. Please configure one in Fee Structures.`);
      return;
    }

    bulkAssignFeeStructure(selectedStudentIds, classDfs.id);
    addToast('success', 'Fee Structure Assigned', `Assigned ${classDfs.className} structure (${formatCurrency(classDfs.totalAmount)}) to ${selectedStudentIds.length} students.`);
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

    const initialApplicableTerms = getApplicableTermsForLateAdmission(admDate, configuredTerms);
    const initialTermIds = initialApplicableTerms.map((t) => t.id || t.termName);
    setSelectedTermIds(initialTermIds);

    // Check existing assignment
    const existingAssign = studentFeeAssignments.find(
      (a) => a.studentId === st.id && a.academicYear === activeAY
    );

    let initialPolicy: FeePolicyType = 'Full Annual Fee';
    if (existingAssign) {
      let p = existingAssign.feePolicy || 'Full Annual Fee';
      if (p === 'Pro-rata' || p === 'Monthly Pro-rated' || p === 'Monthly Pro-rated Fee') {
        p = 'Term-wise';
      } else if (p === 'Custom' || p === 'Custom Amount') {
        p = 'Full Annual Fee';
      }
      initialPolicy = p as FeePolicyType;
      setModalPolicy(initialPolicy);
      setModalAdjustmentReason(existingAssign.adjustmentReason || '');
    } else {
      setModalPolicy('Full Annual Fee');
      setModalAdjustmentReason('');
    }

    // Initialize Breakdown Table
    buildModalBreakdown(matchingDfs, initialPolicy, admDate, existingAssign?.feeBreakdown, initialTermIds);
    setIsPreviewOpen(false);
    setIsConfigModalOpen(true);
  };

  // Build Breakdown Table
  const buildModalBreakdown = (
    dfsObj: any,
    policy: FeePolicyType,
    admDateStr: string,
    existingBreakdown?: FeeHeadAssignmentBreakdown[],
    overrideTermIds?: string[]
  ) => {
    if (!dfsObj || !dfsObj.items) {
      setCustomBreakdown([]);
      return;
    }

    const activeTerms = overrideTermIds || selectedTermIds;
    const activeTermsCount = activeTerms.length > 0 ? activeTerms.length : configuredTerms.length;
    const termsRatio = configuredTerms.length > 0 ? activeTermsCount / configuredTerms.length : 1.0;

    const itemsList: FeeHeadAssignmentBreakdown[] = dfsObj.items.map((item: any) => {
      const orig = item.amount;
      const hNameLower = (item.feeHeadName || '').toLowerCase();
      const categoryLower = (item.category || '').toLowerCase();
      const freq = item.frequency || item.feePlan || '';

      const fh = (feeHeads || []).find(
        (f) =>
          f.id === item.feeHeadId ||
          f.name?.toLowerCase() === item.feeHeadName?.toLowerCase()
      );
      const eligibility =
        item.paymentEligibility ||
        fh?.paymentEligibility ||
        'Both One-Time and Term-Wise';
      const catApplicableTerms: string[] = item.applicableTerms || fh?.applicableTerms || [];

      const isOneTimeOnly = eligibility === 'One-Time Only';

      const isFixedFullAmountHead =
        isOneTimeOnly ||
        freq === 'One Time' ||
        freq === 'Annual' ||
        freq === 'One Term' ||
        freq === 'Single Term' ||
        hNameLower.includes('admission') ||
        categoryLower.includes('admission') ||
        hNameLower.includes('caution') ||
        categoryLower.includes('caution') ||
        hNameLower.includes('annual');

      const prevMatch = (existingBreakdown || customBreakdown)?.find(
        (b) => b.feeHeadId === item.feeHeadId || b.feeHeadName?.toLowerCase() === item.feeHeadName?.toLowerCase()
      );
      const isSelected = isOneTimeOnly ? true : (prevMatch ? prevMatch.isSelected !== false : true);

      let assigned = orig;

      if (isOneTimeOnly) {
        assigned = orig;
      } else if (!isSelected) {
        assigned = 0;
      } else if (isFixedFullAmountHead || policy === 'Full Annual Fee') {
        // One Time, Annual, One Term -> Full amount
        assigned = orig;
      } else if (policy === 'Term-wise' || policy === 'Term-wise Fee') {
        let catTerms = configuredTerms;
        if (catApplicableTerms && catApplicableTerms.length > 0) {
          const filtered = configuredTerms.filter((t) =>
            catApplicableTerms.some((at) =>
              String(at).toLowerCase() === String(t.id).toLowerCase() ||
              String(at).toLowerCase() === String(t.termName).toLowerCase() ||
              String(at) === String(t.sequence)
            )
          );
          if (filtered.length > 0) catTerms = filtered;
        }

        let appTerms = catTerms;
        if (admDateStr) {
          appTerms = getApplicableTermsForLateAdmission(admDateStr, catTerms);
        }
        const categoryTermsRatio = configuredTerms.length > 0 ? appTerms.length / configuredTerms.length : 1.0;
        assigned = Math.round(orig * categoryTermsRatio);
      }

      return {
        feeHeadId: item.feeHeadId,
        feeHeadName: item.feeHeadName,
        category: item.category || (item.feeHeadName.includes('Tuition')
          ? 'Tuition Fee'
          : item.feeHeadName.includes('Transport')
          ? 'Transport Fee'
          : 'Other Fee'),
        billingType: isOneTimeOnly ? 'One-time' : (isFixedFullAmountHead ? 'One-time' : 'Monthly'),
        originalAmount: orig,
        assignedAmount: assigned,
        adjustmentAmount: isSelected ? (assigned - orig) : -orig,
        isEligibleForProRata: !isFixedFullAmountHead,
        isSelected: isSelected,
        paymentEligibility: eligibility,
        applicableTerms: catApplicableTerms
      };
    });

    itemsList.sort((a, b) => {
      const headA = feeHeads.find(
        (h) => h.id === a.feeHeadId || h.name.toLowerCase().trim() === a.feeHeadName.toLowerCase().trim()
      );
      const headB = feeHeads.find(
        (h) => h.id === b.feeHeadId || h.name.toLowerCase().trim() === b.feeHeadName.toLowerCase().trim()
      );
      const orderA = headA?.displayOrder ?? 999;
      const orderB = headB?.displayOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.feeHeadName || '').localeCompare(b.feeHeadName || '');
    });

    setCustomBreakdown(itemsList);
  };

  const handlePolicyChange = (newPolicy: FeePolicyType) => {
    setModalPolicy(newPolicy);
    const dfsObj = dynamicFeeStructures.find((d) => d.id === modalStructureId);
    buildModalBreakdown(dfsObj, newPolicy, modalAdmissionDate, customBreakdown);
  };

  const handleAdmissionDateChange = (newDate: string) => {
    setModalAdmissionDate(newDate);
    const dfsObj = dynamicFeeStructures.find((d) => d.id === modalStructureId);
    const appTerms = getApplicableTermsForLateAdmission(newDate, configuredTerms);
    const termIds = appTerms.map((t) => t.id || t.termName);
    setSelectedTermIds(termIds);
    buildModalBreakdown(dfsObj, modalPolicy, newDate, customBreakdown, termIds);
  };

  const handleToggleTerm = (termId: string) => {
    setSelectedTermIds((prev) => {
      let next: string[];
      if (prev.includes(termId)) {
        if (prev.length <= 1) {
          addToast('warning', 'Minimum Term Required', 'At least one term must be selected.');
          return prev;
        }
        next = prev.filter((id) => id !== termId);
      } else {
        next = [...prev, termId];
      }

      const dfsObj = dynamicFeeStructures.find((d) => d.id === modalStructureId);
      buildModalBreakdown(dfsObj, modalPolicy, modalAdmissionDate, customBreakdown, next);
      return next;
    });
  };

  const handleToggleFeeHead = (headId: string) => {
    setCustomBreakdown((prev) =>
      prev.map((item) => {
        if (item.feeHeadId !== headId) return item;
        if ((item as any).paymentEligibility === 'One-Time Only') return item;
        const nextSelected = item.isSelected === false ? true : false;
        
        const hNameLower = (item.feeHeadName || '').toLowerCase();
        const categoryLower = (item.category || '').toLowerCase();
        const isFixedFullAmountHead = !item.isEligibleForProRata || hNameLower.includes('admission') || categoryLower.includes('admission');

        let assigned = item.originalAmount;
        if (!nextSelected) {
          assigned = 0;
        } else if (isFixedFullAmountHead || modalPolicy === 'Full Annual Fee') {
          assigned = item.originalAmount;
        } else if (modalPolicy === 'Term-wise' || modalPolicy === 'Term-wise Fee') {
          if (modalAdmissionDate) {
            const appTerms = getApplicableTermsForLateAdmission(modalAdmissionDate, configuredTerms);
            const remainingTermsRatio = configuredTerms.length > 0 ? appTerms.length / configuredTerms.length : 1.0;
            assigned = Math.round(item.originalAmount * remainingTermsRatio);
          }
        }

        return {
          ...item,
          isSelected: nextSelected,
          assignedAmount: assigned,
          adjustmentAmount: nextSelected ? (assigned - item.originalAmount) : -item.originalAmount
        };
      })
    );
  };

  const handleToggleAllFeeHeads = () => {
    const selectable = customBreakdown.filter((i) => (i as any).paymentEligibility !== 'One-Time Only');
    const allSelectableSelected = selectable.length > 0 && selectable.every((i) => i.isSelected !== false);
    setCustomBreakdown((prev) =>
      prev.map((item) => {
        if ((item as any).paymentEligibility === 'One-Time Only') {
          return { ...item, isSelected: true, assignedAmount: item.originalAmount, adjustmentAmount: 0 };
        }
        const nextSelected = !allSelectableSelected;
        const hNameLower = (item.feeHeadName || '').toLowerCase();
        const categoryLower = (item.category || '').toLowerCase();
        const isFixedFullAmountHead = !item.isEligibleForProRata || hNameLower.includes('admission') || categoryLower.includes('admission');

        let assigned = item.originalAmount;
        if (!nextSelected) {
          assigned = 0;
        } else if (isFixedFullAmountHead || modalPolicy === 'Full Annual Fee') {
          assigned = item.originalAmount;
        } else if (modalPolicy === 'Term-wise' || modalPolicy === 'Term-wise Fee') {
          if (modalAdmissionDate) {
            const appTerms = getApplicableTermsForLateAdmission(modalAdmissionDate, configuredTerms);
            const remainingTermsRatio = configuredTerms.length > 0 ? appTerms.length / configuredTerms.length : 1.0;
            assigned = Math.round(item.originalAmount * remainingTermsRatio);
          }
        }

        return {
          ...item,
          isSelected: nextSelected,
          assignedAmount: assigned,
          adjustmentAmount: nextSelected ? (assigned - item.originalAmount) : -item.originalAmount
        };
      })
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
      `Assigned ${modalPolicy} policy for ${configStudent.firstName}.`
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
      assignedFeeHeads: customBreakdown
        .filter((i) => i.isSelected !== false && i.assignedAmount > 0)
        .map((i) => ({
          feeHeadId: i.feeHeadId,
          feeHeadName: i.feeHeadName,
          category: i.category,
          amount: i.assignedAmount
        })),
      baseFeeTotal: customBreakdown.reduce((sum, i) => sum + (i.isSelected !== false ? i.assignedAmount : 0), 0),
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
      feeItems: customBreakdown.map((i) => ({
        headId: i.feeHeadId,
        headName: i.feeHeadName,
        category: i.category,
        originalAmount: i.originalAmount,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: i.isSelected !== false ? i.assignedAmount : 0,
        isApplicable: i.isSelected !== false && i.assignedAmount > 0,
        status: 'Pending' as const,
        remarks: i.isSelected === false ? 'Excluded for student' : undefined
      })),
      totalOriginalAmount: customBreakdown.reduce((sum, i) => sum + (i.isSelected !== false ? i.originalAmount : 0), 0),
      grossAmount: customBreakdown.reduce((sum, i) => sum + (i.isSelected !== false ? i.originalAmount : 0), 0),
      totalScholarship: 0,
      totalDiscount: 0,
      totalFine: 0,
      totalPayable: customBreakdown.reduce((sum, i) => sum + (i.isSelected !== false ? i.assignedAmount : 0), 0),
      paidAmount: 0,
      dueBalance: customBreakdown.reduce((sum, i) => sum + (i.isSelected !== false ? i.assignedAmount : 0), 0),
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

  const autoIncludedItems = customBreakdown.filter(
    (i) => (i as any).paymentEligibility === 'One-Time Only'
  );
  const selectableItems = customBreakdown.filter(
    (i) => (i as any).paymentEligibility !== 'One-Time Only'
  );

  const autoIncludedTotal = autoIncludedItems.reduce((sum, i) => sum + i.assignedAmount, 0);
  const autoIncludedOriginalTotal = autoIncludedItems.reduce((sum, i) => sum + i.originalAmount, 0);

  const selectableAssignedTotal = selectableItems.reduce(
    (sum, i) => sum + (i.isSelected !== false ? i.assignedAmount : 0),
    0
  );
  const selectableOriginalTotal = selectableItems.reduce(
    (sum, i) => sum + (i.isSelected !== false ? i.originalAmount : 0),
    0
  );

  const originalTotalSum = autoIncludedOriginalTotal + selectableOriginalTotal;
  const assignedTotalSum = autoIncludedTotal + selectableAssignedTotal;
  const adjustmentTotalSum = assignedTotalSum - originalTotalSum;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-sky-500" /> Student Fee Assignment & Policy Management
        </h2>
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
                setSelectedSection('All');
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Classes</option>
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
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Sections</option>
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
        <div className="flex items-center gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
          <button
            onClick={handleBulkAssign}
            disabled={selectedStudentIds.length === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer h-[38px] transition-all ${
              selectedStudentIds.length > 0
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
            }`}
          >
            <CheckCircle className="w-4 h-4" /> Bulk Assign Class Fee ({selectedStudentIds.length})
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
              {filteredStudents.length === 0 ? (
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
                            {assignment.feePolicy === 'Pro-rata' || assignment.feePolicy === 'Monthly Pro-rated' || assignment.feePolicy === 'Monthly Pro-rated Fee'
                              ? 'Term-wise Fee'
                              : (assignment.feePolicy === 'Custom' || assignment.feePolicy === 'Custom Amount' ? 'Full Annual Fee' : assignment.feePolicy || 'Full Annual Fee')}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          modalPolicy === 'Full Annual Fee'
                            ? 'border-sky-600 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">Full Annual Fee</span>
                          <input
                            type="radio"
                            name="feePolicy"
                            checked={modalPolicy === 'Full Annual Fee'}
                            onChange={() => handlePolicyChange('Full Annual Fee')}
                            className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">Standard full annual fee (1 installment)</span>
                      </label>

                      <label
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          modalPolicy === 'Term-wise' || modalPolicy === 'Term-wise Fee'
                            ? 'border-sky-600 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">Term-wise Fee</span>
                          <input
                            type="radio"
                            name="feePolicy"
                            checked={modalPolicy === 'Term-wise' || modalPolicy === 'Term-wise Fee'}
                            onChange={() => handlePolicyChange('Term-wise')}
                            className="w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">
                          {selectedTermIds.length} of {configuredTerms.length} terms selected ({formatCurrency(selectedTermIds.length > 0 ? Math.floor(selectableAssignedTotal / selectedTermIds.length) : selectableAssignedTotal)}/term {autoIncludedTotal > 0 ? `+ ${formatCurrency(autoIncludedTotal)} One-Time` : ''})
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Academic Year Terms & Schedule Breakdown */}
                  {modalPolicy !== 'Full Annual Fee' && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                            Select Terms to Configure ({configuredTerms.length} Terms Configured):
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px] font-mono">
                            {activeAY}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                          {selectedTermIds.length} of {configuredTerms.length} Terms Selected ({formatCurrency(selectedTermIds.length > 0 ? Math.floor(selectableAssignedTotal / selectedTermIds.length) : selectableAssignedTotal)}/term {autoIncludedTotal > 0 ? `+ ${formatCurrency(autoIncludedTotal)} One-Time` : ''})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        {configuredTerms.map((term) => {
                          const termKey = term.id || term.termName;
                          const isSelected = selectedTermIds.includes(termKey);
                          return (
                            <div
                              key={termKey}
                              onClick={() => handleToggleTerm(termKey)}
                              className={`p-3 rounded-2xl border text-xs flex flex-col justify-between transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs'
                                  : 'border-slate-200 bg-slate-100/70 dark:bg-slate-800/40 dark:border-slate-800 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // handled by parent onClick
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span className="text-slate-900 dark:text-white font-extrabold">{term.termName}</span>
                                </div>
                                {isSelected ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[10px] font-black flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Configured
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-[10px] font-semibold">
                                    Excluded
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 space-y-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                                <div>
                                  <span className="text-slate-400">Period: </span>
                                  <span className="font-mono">{formatDateForDisplay(term.startDate)}</span> to <span className="font-mono">{formatDateForDisplay(term.endDate)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Due Date: </span>
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatDateForDisplay(term.dueDate)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-[11px] text-sky-800 dark:text-sky-300 font-semibold flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 shrink-0 text-sky-600" />
                          <span>
                            Configuring <strong>{selectedTermIds.length} of {configuredTerms.length} terms</strong> ({configuredTerms.filter(t => selectedTermIds.includes(t.id || t.termName)).map(t => t.termName).join(', ')}) for student fee assignment.
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-xs font-mono shrink-0 shadow-xs">
                          {formatCurrency(selectedTermIds.length > 0 ? Math.floor(selectableAssignedTotal / selectedTermIds.length) : selectableAssignedTotal)} / term {autoIncludedTotal > 0 ? `+ ${formatCurrency(autoIncludedTotal)} One-Time` : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {modalPolicy === 'Full Annual Fee' && (
                    <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-[11px] text-sky-800 dark:text-sky-300 font-semibold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0 text-sky-600" />
                        <span>
                          Full Annual Fee policy selected. The complete annual fee (<strong>{formatCurrency(assignedTotalSum)}</strong>) will be charged in 1 installment.
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-xs font-mono shrink-0 shadow-xs">
                        1 Installment ({formatCurrency(assignedTotalSum)})
                      </span>
                    </div>
                  )}

                  {/* Automatically Included One-Time Fees Banner */}
                  {autoIncludedItems.length > 0 && (
                    <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider text-[11px]">
                            Automatically Included One-Time Fees:
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-200/70 text-purple-900 dark:bg-purple-900 dark:text-purple-200 font-extrabold text-[10px]">
                            {autoIncludedItems.length} Fee Head{autoIncludedItems.length > 1 ? 's' : ''} (Total: {formatCurrency(autoIncludedTotal)})
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                          Auto-Assigned (Non-Deselectable)
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                        Fee categories configured with payment eligibility <strong>One-Time Only (Single Installment)</strong> are automatically included as single-installment obligations and cannot be deselected.
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {autoIncludedItems.map((item) => (
                          <div
                            key={item.feeHeadId}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-2xs"
                          >
                            <span className="text-purple-700 dark:text-purple-300">{item.feeHeadName}</span>
                            <span className="font-mono text-slate-900 dark:text-white font-extrabold">{formatCurrency(item.assignedAmount)}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 uppercase font-black">
                              One-Time
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fee Head Breakdown Table */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                          Selectable Fee Types Breakdown:
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px]">
                          {selectableItems.filter((i) => i.isSelected !== false).length} of {selectableItems.length} Fee Types Selected
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <button
                          type="button"
                          onClick={handleToggleAllFeeHeads}
                          className="font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                        >
                          {selectableItems.length > 0 && selectableItems.every((i) => i.isSelected !== false) ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const dfsObj = dynamicFeeStructures.find((d) => d.id === modalStructureId);
                            buildModalBreakdown(dfsObj, modalPolicy, modalAdmissionDate);
                          }}
                          className="font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Recalculate
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b">
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={selectableItems.length > 0 && selectableItems.every((i) => i.isSelected !== false)}
                                onChange={handleToggleAllFeeHeads}
                                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                title="Select/Deselect All Selectable Fee Types"
                              />
                            </th>
                            <th className="p-3">Fee Head / Type</th>
                            <th className="p-3">Billing Config</th>
                            <th className="p-3 font-mono">Standard Amount</th>
                            <th className="p-3 font-mono">Assigned Amount</th>
                            <th className="p-3 font-mono text-right">Adjustment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {selectableItems.map((item) => {
                            const isSelected = item.isSelected !== false;
                            return (
                              <tr
                                key={item.feeHeadId}
                                className={`transition-colors ${
                                  isSelected
                                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                                    : 'bg-slate-50/60 dark:bg-slate-950/40 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleFeeHead(item.feeHeadId)}
                                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className={isSelected ? 'text-slate-900 dark:text-white font-extrabold' : 'line-through text-slate-400'}>
                                      {item.feeHeadName}
                                    </span>
                                    {!isSelected && (
                                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[9px] font-black uppercase">
                                        Not Applied
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      (item as any).paymentEligibility === 'One-Time Only'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                        : (item as any).paymentEligibility === 'Term-Wise Allowed'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                        : item.isEligibleForProRata
                                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {(item as any).paymentEligibility || (item.isEligibleForProRata ? 'Term-Wise Allowed' : 'Both One-Time and Term-Wise')}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                                  {formatCurrency(item.originalAmount)}
                                </td>
                                <td className="p-3">
                                  {!isSelected ? (
                                    <span className="text-slate-400 dark:text-slate-500 font-semibold italic text-[11px]">
                                      Excluded (₹0)
                                    </span>
                                  ) : (
                                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                                      {formatCurrency(item.assignedAmount)}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 font-mono font-bold text-right">
                                  <span
                                    className={
                                      !isSelected
                                        ? 'text-slate-400 line-through'
                                        : item.adjustmentAmount < 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : item.adjustmentAmount > 0
                                        ? 'text-rose-600'
                                        : 'text-slate-400'
                                    }
                                  >
                                    {!isSelected ? `-${formatCurrency(item.originalAmount)}` : item.adjustmentAmount === 0 ? '₹0' : formatCurrency(item.adjustmentAmount)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t text-xs">
                            <td colSpan={3} className="p-3 uppercase">Total Breakdown Summary ({autoIncludedItems.length + selectableItems.filter(i => i.isSelected !== false).length} Active Fee Heads):</td>
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
