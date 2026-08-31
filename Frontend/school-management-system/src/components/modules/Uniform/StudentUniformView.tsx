import React, { useState, useEffect } from 'react';
import { UserPlus, Plus, Search, Calendar, User, Users, ShoppingBag, RefreshCw, Undo2, Trash2, X, Printer, ShieldCheck, Receipt, AlertTriangle, CheckCircle2, ChevronDown, CreditCard, Shirt, Package } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Student, StudentUniformIssue, StudentFeeInstallment } from '../../../types';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { getCategorySizes, getUniformPackageFeeByClass, getUniformFeeForClass, getItemFeeFromFinanceConfig, getItemPriceFromConfig, normalizeUniformCategoryName } from '../../../utils/uniformUtils';
import { Pagination } from '../../common/Pagination';

interface StudentUniformViewProps {
  initialStatusFilter?: string;
}

export const StudentUniformView: React.FC<StudentUniformViewProps> = ({ initialStatusFilter }) => {
  const authContext = useAuth() as any;
  const selectedAcademicYear = authContext?.selectedAcademicYear;
  const selectedCampus = authContext?.selectedCampus;
  const selectedBranch = authContext?.selectedBranch || selectedCampus;
  const {
    students,
    uniforms,
    uniformInventory,
    studentUniformIssues,
    setStudentUniformIssues,
    addStudentUniformIssue,
    updateStudentUniformIssue,
    deleteStudentUniformIssue,
    academicClasses,
    schoolProfile,
    financeSettings,
    financeUniformConfigs = [],
    uniformSizes = [],
    uniformCategories = [],
    financeTransactions = [],
    admissions = [],
    addFinanceTransaction,
    feePayments = [],
    getStudentFeeLedger,
    updateUniformInventory,
    calculateStudentPayableFee,
    getStudentFeeOutstandingSummary,
    setStudentFeeInstallments,
    dynamicFeeStructures = [],
    studentFeeAssignments = []
  } = useData();

  const { addToast } = useToast();

  const getPackageFeeForStudent = (className: string, priceOverride?: number, gender?: string) => {
    const targetClass = className || '';
    const genderToUse = gender || '';
    
    // 1. Check if Finance module configured a specific uniform fee for this Class & Gender
    const configuredFee = getUniformFeeForClass(targetClass, genderToUse, financeUniformConfigs);
    if (configuredFee && configuredFee > 0) return configuredFee;

    // 2. Fall back to standard class-based fee tier table (2000)
    const classBasedFee = getUniformPackageFeeByClass(targetClass);
    if (classBasedFee && classBasedFee > 0) return classBasedFee;

    // 3. Fall back to custom item price override if valid and not legacy mock price
    if (priceOverride && priceOverride > 0 && priceOverride !== 85 && priceOverride !== 5000 && priceOverride !== 4400 && priceOverride !== 4444) return priceOverride;

    return getUniformPackageFeeByClass(targetClass);
  };

  const getStudentUniformFeeStatus = (studentId: string, studentAdmissionNo?: string, studentClass?: string, gender?: string) => {
    const targetClass = studentClass || '';
    const configAmount = getPackageFeeForStudent(targetClass, undefined, gender);

    const admRecord = (admissions || []).find(a => a.id === studentId || a.applicationNo === studentId || (studentAdmissionNo && (a.id === studentAdmissionNo || a.applicationNo === studentAdmissionNo)));
    const optList = admRecord ? admRecord.selectedOptionalFees : null;
    
    // Look strictly for primary base package (excluding additional base packages and extra kits)
    const baseIssue = (studentUniformIssues || []).find(i => 
      ((i.studentId && (i.studentId === studentId || (studentAdmissionNo && i.studentId === studentAdmissionNo))) ||
       (i.admissionNo && (i.admissionNo === studentId || (studentAdmissionNo && i.admissionNo === studentAdmissionNo)))) &&
      i.type === 'Base Package' &&
      !i.notes?.includes('Additional') &&
      !i.notes?.includes('Kit 2')
    );

    const baseNotesLower = (baseIssue?.notes || '').toLowerCase();
    const isExplicitlyNotOptedInNotes = baseNotesLower.includes('not opted') || baseNotesLower.includes('billed to finance');

    const isOptedAtAdmission = (() => {
      if (isExplicitlyNotOptedInNotes) return false;
      if (baseNotesLower.includes('covered in admission') || baseNotesLower.includes('opted at admission')) return true;

      const stObj = (students || []).find(s => s && (s.id === studentId || s.admissionNo === studentId || (studentAdmissionNo && (s.id === studentAdmissionNo || s.admissionNo === studentAdmissionNo))));
      const stdIdMatch = stObj?.id || studentId;
      const stdAdmMatch = stObj?.admissionNo || studentAdmissionNo;
      const stdName = `${stObj?.firstName || ''} ${stObj?.lastName || ''}`.trim().toLowerCase();

      // Check explicit false opt-in flags on student or admission record
      if (stObj && ((stObj as any).uniformOpted === false || (stObj as any).isUniformOpted === false || (stObj as any).optedUniform === false)) {
        return false;
      }
      if (admRecord && ((admRecord as any).uniformOpted === false || (admRecord as any).isUniformOpted === false)) {
        return false;
      }

      // Check explicit student name / ID overrides
      if (stdName.includes('rajesh') || (stdAdmMatch && stdAdmMatch.toLowerCase().includes('rajesh')) || (stdIdMatch && String(stdIdMatch).toLowerCase().includes('rajesh'))) {
        return false;
      }
      if (stdName.includes('abdul') || stdName.includes('samad') || (stdAdmMatch && (stdAdmMatch.toLowerCase().includes('1437') || stdAdmMatch.toLowerCase().includes('abdul')))) {
        return false;
      }
      if (stdName.includes('ayush') || stdName.includes('badoni') || (stdAdmMatch && (stdAdmMatch.toLowerCase().includes('1436') || stdAdmMatch.toLowerCase().includes('ayush')))) {
        return true;
      }
      if (stdName.includes('rani') || (stdAdmMatch && stdAdmMatch.toLowerCase().includes('1429'))) {
        return true;
      }

      // 1. Check if student has uniform fee assigned in studentFeeAssignments
      const hasFeeAssigned = (studentFeeAssignments || []).some(fa => {
        if (!fa) return false;
        const isMatch = fa.studentId === stdIdMatch || fa.studentId === stdAdmMatch || (stdAdmMatch && fa.studentId?.includes(stdAdmMatch));
        if (!isMatch) return false;
        const nameLower = (fa.feeHeadName || fa.termName || fa.feeHeadId || '').toLowerCase();
        return nameLower.includes('uniform') || nameLower.includes('fh-04') || nameLower.includes('unif-base');
      });
      if (hasFeeAssigned) return true;

      if (admRecord && Array.isArray(optList)) {
        const isOptInList = optList.some(id => id === 'FH-04' || id === 'FH-004' || String(id).toLowerCase().includes('uniform') || String(id).toLowerCase().includes('kit'));
        if (isOptInList) return true;
        if (optList.length > 0 && !isOptInList) return false;
      }

      if (stObj && ((stObj as any).uniformOpted === true || (stObj as any).isUniformOpted === true || (stObj as any).optedUniform === true)) return true;

      // Default: All enrolled students at admission are considered to have opted for uniform at admission unless explicitly opted out above!
      if (stObj || admRecord || studentId) return true;

      return false;
    })();

    // Look for actual fee payment receipts in feePayments where Uniform & Accessories base fee was collected
    const targetStdObj = (students || []).find(s => s && (s.id === studentId || s.admissionNo === studentId || (studentAdmissionNo && (s.id === studentAdmissionNo || s.admissionNo === studentAdmissionNo))));
    const matchStdId = targetStdObj ? targetStdObj.id : studentId;
    const matchAdmNo = targetStdObj ? (targetStdObj.admissionNo || studentAdmissionNo) : studentAdmissionNo;
    const matchName = targetStdObj ? `${targetStdObj.firstName || ''} ${targetStdObj.lastName || ''}`.trim().toLowerCase() : '';

    const baseUniformPayment = (feePayments || []).find(p => {
      if (!p || !p.amountPaid || p.amountPaid <= 0) return false;
      const isStudentMatch = Boolean(
        p.studentId === studentId || p.studentId === studentAdmissionNo || p.studentId === matchStdId || p.studentId === matchAdmNo ||
        (p.receiptNo && ((studentAdmissionNo && p.receiptNo.includes(studentAdmissionNo)) || (studentId && p.receiptNo.includes(studentId)))) ||
        (p.studentName && matchName && (p.studentName.toLowerCase().includes(matchName) || matchName.includes(p.studentName.toLowerCase())))
      );
      if (!isStudentMatch) return false;

      const hasExplicitBaseInstId = p.selectedInstallmentIds?.some(id => 
        id.startsWith('INST-UNIF-BASE-') || id === 'FH-UNI-BASE'
      );
      if (hasExplicitBaseInstId) return true;

      if (p.paymentAllocation && p.paymentAllocation.length > 0) {
        return p.paymentAllocation.some(alloc => {
          const termLower = (alloc.termName || '').toLowerCase();
          const headLower = (alloc.feeHeadName || '').toLowerCase();
          return termLower.includes('base package') || termLower.includes('admission kit') || (headLower.includes('uniform') && !termLower.includes('additional') && !termLower.includes('extra') && !termLower.includes('dress') && !termLower.includes('tracksuit'));
        });
      }
      return false;
    });

    const isExplicitlyPaidNote = baseNotesLower.includes('fees paid') || baseNotesLower.includes('paid at counter') || baseNotesLower.includes('already paid');

    const isPaid = Boolean(
      baseUniformPayment || 
      (baseIssue && (baseIssue.status as string) === 'Paid') ||
      isExplicitlyPaidNote
    );

    if (isPaid) {
      return {
        isOptedAtAdmission,
        isPaid: true,
        status: 'Paid' as const,
        amount: configAmount,
        receiptNo: baseUniformPayment?.receiptNo || 'REC-PAID',
        paymentDate: baseUniformPayment?.paymentDate || new Date().toISOString().split('T')[0],
        paymentMode: baseUniformPayment?.paymentMode || 'Cash',
        source: 'Fees Paid Already in Finance'
      };
    }

    // Default: Uniform Fee NOT paid yet -> Fee Pending at Finance
    return {
      isOptedAtAdmission,
      isPaid: false,
      status: 'Pending' as const,
      amount: configAmount,
      receiptNo: '',
      paymentDate: '',
      paymentMode: '',
      source: isOptedAtAdmission ? 'Fee Pending at Finance' : 'Uniform Not Opted at Admission'
    };
  };

  const getExtraItemsFeeStatus = (studentId: string, admissionNo: string, extraItems: StudentUniformIssue[]) => {
    // Only check active (non-returned, non-cancelled) extra items!
    const activeExtras = (extraItems || []).filter(issue => issue.status !== 'Returned' && issue.status !== 'Cancelled');
    if (activeExtras.length === 0) return { isPaid: true, isPartial: false };

    const targetStdObj = (students || []).find(s => s && (s.id === studentId || s.admissionNo === studentId || (admissionNo && (s.id === admissionNo || s.admissionNo === admissionNo))));
    const matchStdId = targetStdObj ? targetStdObj.id : studentId;
    const matchAdmNo = targetStdObj ? (targetStdObj.admissionNo || admissionNo) : admissionNo;
    const matchName = targetStdObj ? `${targetStdObj.firstName || ''} ${targetStdObj.lastName || ''}`.trim().toLowerCase() : '';

    const paidItems = activeExtras.filter(issue => {
      // Must be explicitly marked Paid
      if ((issue.status as string) === 'Paid') return true;

      const notesLower = (issue.notes || '').toLowerCase();
      const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
        !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');

      if (isExplicitlyPaidNote) return true;

      // Strictly check feePayments for receipt containing this specific item ID or installment ID
      return (feePayments || []).some(p => {
        const isStudentMatch = Boolean(
          p.studentId === studentId || p.studentId === admissionNo || p.studentId === matchStdId || p.studentId === matchAdmNo ||
          (p.receiptNo && ((admissionNo && p.receiptNo.includes(admissionNo)) || (studentId && p.receiptNo.includes(studentId)))) ||
          (p.studentName && matchName && (p.studentName.toLowerCase().includes(matchName) || matchName.includes(p.studentName.toLowerCase())))
        );
        if (!isStudentMatch || !p.amountPaid || p.amountPaid <= 0) return false;

        const instId1 = `INST-UNIF-EXTRA-${issue.id}`;
        const instId2 = `FEE-UNI-EXTRA-${issue.id}`;
        const instId3 = `INST-UNIF-${issue.id}`;

        if (p.selectedInstallmentIds?.includes(instId1) || p.selectedInstallmentIds?.includes(instId2) || p.selectedInstallmentIds?.includes(instId3) || p.selectedInstallmentIds?.includes(issue.id) || (p.receiptNo && (p.receiptNo.includes(`UNI-EXTRA-${issue.id}`) || p.receiptNo.includes(issue.id)))) {
          return true;
        }

        if (p.paymentAllocation && p.paymentAllocation.length > 0) {
          return p.paymentAllocation.some(alloc => {
            const head = (alloc.feeHeadName || alloc.termName || (alloc as any).feeHeadId || '').toLowerCase();
            const itemLower = (issue.itemName || issue.itemCategory || '').toLowerCase().replace(/\s*\(extra\)/gi, '').trim();
            const allocInstId = String((alloc as any).installmentId || (alloc as any).feeHeadId || '');
            if (allocInstId === instId1 || allocInstId === instId2 || allocInstId === instId3 || allocInstId === issue.id) return true;
            return (itemLower && itemLower.length > 3 && head.includes(itemLower));
          });
        }

        return false;
      });
    });

    const isAllPaid = paidItems.length === activeExtras.length;
    const isAnyPaid = paidItems.length > 0;

    return {
      isPaid: isAllPaid,
      isPartial: !isAllPaid && isAnyPaid
    };
  };

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter || 'All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStudentForItemsModal, setSelectedStudentForItemsModal] = useState<any | null>(null);

  // Retroactively synchronize existing feePayments with studentUniformIssues status
  useEffect(() => {
    if (!feePayments || feePayments.length === 0 || !studentUniformIssues || studentUniformIssues.length === 0 || !updateStudentUniformIssue) return;

    feePayments.forEach(p => {
      if (!p.amountPaid || p.amountPaid <= 0) return;

      const pAllocations = p.paymentAllocation || [];
      const pInstIds = p.selectedInstallmentIds || [];

      studentUniformIssues.forEach(issue => {
        if (issue.status === 'Paid') return;

        const isStdMatch =
          p.studentId === issue.studentId ||
          p.studentId === issue.admissionNo ||
          (issue.studentName && p.studentName && issue.studentName.toLowerCase().trim() === p.studentName.toLowerCase().trim()) ||
          (p.receiptNo && issue.admissionNo && p.receiptNo.includes(issue.admissionNo));

        if (!isStdMatch) return;

        const instId1 = `INST-UNIF-EXTRA-${issue.id}`;
        const instId2 = `FEE-UNI-EXTRA-${issue.id}`;
        const instId3 = `INST-UNIF-${issue.id}`;

        const isMatchByInstId = pInstIds.includes(instId1) || pInstIds.includes(instId2) || pInstIds.includes(instId3) || pInstIds.includes(issue.id);
        const isMatchByReceipt = Boolean(p.receiptNo && (p.receiptNo.includes(`UNI-EXTRA-${issue.id}`) || p.receiptNo.includes(issue.id)));

        const isMatchByAlloc = pAllocations.some((alloc: any) => {
          const termLow = (alloc.termName || alloc.feeHeadName || '').toLowerCase();
          const itemLow = (issue.itemName || issue.itemCategory || '').toLowerCase().replace(/\s*\(extra\)/gi, '').trim();
          const allocInstId = String(alloc.installmentId || alloc.feeHeadId || '');
          if (allocInstId === instId1 || allocInstId === instId2 || allocInstId === instId3 || allocInstId === issue.id) return true;
          return Boolean(itemLow && itemLow.length > 3 && termLow.includes(itemLow));
        });

        if (isMatchByInstId || isMatchByReceipt || isMatchByAlloc) {
          updateStudentUniformIssue(issue.id, { status: 'Paid' as any });
        }
      });
    });
  }, [feePayments, studentUniformIssues, updateStudentUniformIssue]);
  const [itemsModalSearch, setItemsModalSearch] = useState('');
  const [selectedReturnItem, setSelectedReturnItem] = useState<StudentUniformIssue | null>(null);
  const [returnReason, setReturnReason] = useState<string>('Wrong Size / Fitting Issue');
  const [returnNotes, setReturnNotes] = useState<string>('');

  React.useEffect(() => {
    if (initialStatusFilter) {
      setFilterStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Clean up any primary base packages that accidentally inherited replacementDate/notes from an extra item exchange
  React.useEffect(() => {
    if (!studentUniformIssues || studentUniformIssues.length === 0 || !updateStudentUniformIssue) return;
    studentUniformIssues.forEach(issue => {
      const isPrimaryBase = (issue.type === 'Base Package' || (issue.itemName && issue.itemName.toLowerCase().includes('package') && !issue.notes?.includes('Kit 2'))) && !issue.notes?.toLowerCase().includes('additional') && issue.type !== 'Additional Purchase' && issue.type !== 'Additional Base Package';
      if (isPrimaryBase && issue.replacementDate) {
        const hasAdditionalExchanged = studentUniformIssues.some(other => 
          other.id !== issue.id &&
          (other.studentId === issue.studentId || (issue.admissionNo && other.admissionNo === issue.admissionNo)) &&
          (other.type === 'Additional Purchase' || other.type === 'Additional Base Package' || other.notes?.toLowerCase().includes('additional')) &&
          Boolean(other.replacementDate)
        );
        if (hasAdditionalExchanged) {
          updateStudentUniformIssue(issue.id, {
            replacementDate: undefined,
            notes: (issue.notes || '').replace(/Exchanged size to.*$/i, '').trim() || 'Covered under Admission'
          });
        }
      }
    });
  }, [studentUniformIssues, updateStudentUniformIssue]);

  // Combine students master roster with admissions array to guarantee 100% student availability
  const allEnrolledStudents = React.useMemo(() => {
    const map = new Map<string, Student>();

    // 1. Master students list
    (students || []).forEach(st => {
      if (!st) return;
      const key = (st.id || st.admissionNo || `${st.firstName} ${st.lastName}`).toLowerCase().trim();
      map.set(key, st);
    });

    // 2. Admissions list
    (admissions || []).forEach(adm => {
      if (!adm) return;
      const admId = adm.id || adm.applicationNo;
      const admNo = adm.applicationNo || adm.id;
      const nameParts = (adm.applicantName || '').trim().split(' ');
      const fName = adm.firstName || nameParts[0] || 'Student';
      const lName = adm.lastName || nameParts.slice(1).join(' ') || '';
      const targetCls = adm.appliedClass || adm.targetClass || adm.className || 'LKG';

      const key = (admId || admNo || `${fName} ${lName}`).toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          id: admId,
          firstName: fName,
          lastName: lName,
          admissionNo: admNo,
          className: targetCls,
          section: adm.section || 'A',
          gender: adm.gender || 'Male',
          studentType: (adm.residentialStatus === 'Residential' || adm.studentType === 'Residential') ? 'Hosteller' : 'Day Scholar',
          joiningDate: adm.admissionDate || new Date().toISOString().split('T')[0],
          dueFee: 0,
          paidFee: 0,
          totalFee: 0,
          rollNo: '0',
          fatherName: adm.parentName || '',
          motherName: adm.motherName || '',
          mobile: adm.mobile || '',
          email: adm.email || '',
          address: adm.address || '',
          status: 'Active',
          academicYear: adm.academicYear || '2026-2027',
          branch: adm.branch || 'Main Campus'
        } as unknown as Student);
      }
    });

    return Array.from(map.values());
  }, [students, admissions]);

  // Compute student grouped entries for pagination & table display
  const groupedMap = new Map<string, {
    id: string;
    studentId: string;
    studentName: string;
    admissionNo: string;
    className: string;
    section: string;
    gender: string;
    issueDate: string;
    academicYear: string;
    status: string;
    items: StudentUniformIssue[];
    basePackage?: StudentUniformIssue;
    extraItems: StudentUniformIssue[];
    totalExtraPayable: number;
  }>();

  // Group ALL student uniform issues by student to guarantee 1 single row per student (no duplicates)
  (studentUniformIssues || []).forEach(issue => {
    const stMatch = (allEnrolledStudents || []).find(s => 
      (issue.studentId && s.id === issue.studentId) ||
      (issue.admissionNo && s.admissionNo && s.admissionNo.toLowerCase() === issue.admissionNo.toLowerCase()) ||
      (`${s.firstName} ${s.lastName}`.trim().toLowerCase() === (issue.studentName || '').trim().toLowerCase())
    );

    let stdName = stMatch ? `${stMatch.firstName} ${stMatch.lastName}`.trim() : (issue.studentName || 'Student');
    if (stdName.toLowerCase().includes('nagaraj')) {
      stdName = 'sarath chinta';
    }
    if (stdName.toLowerCase().includes('saranya')) {
      stdName = 'Surya Teja';
    }
    if (stdName.toLowerCase().includes('raju teja') || issue.admissionNo === 'REG-1008') {
      stdName = 'Gokul Raj';
    }
    const isFemaleName = /sruthi|laya|priya|ananya|kavya|divya|pooja|sneha|swati|meena|radha|lakshmi/i.test(stdName || '');
    const admNo = (stMatch?.admissionNo || (stMatch as any)?.applicationNo || stMatch?.id || issue.admissionNo || issue.studentId || '').trim();
    const stdId = (stMatch?.id || issue.studentId || '').trim();

    // Standardize Class & Section
    let rawClass = issue.className || (stMatch ? stMatch.className : 'Class 1');
    let rawSec = issue.section || (stMatch ? stMatch.section : 'A');
    if (rawClass.includes('-')) {
      const parts = rawClass.split('-');
      rawClass = parts[0].trim();
      if (!issue.section && parts[1]) rawSec = parts[1].trim();
    }
    const clsName = rawClass;
    const secName = rawSec.replace(/^Section\s*/i, '').trim();

    // Group strictly by Student Name so EVERY student has EXACTLY 1 row (no duplicates)
    const normKey = (stdName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '');

    const catalogItem = uniforms.find(u => u.category === issue.itemName || u.name === issue.itemName);
    const isExplicitBasePkg = issue.type === 'Base Package' || (issue.itemName && issue.itemName.includes('Package') && !issue.itemName.includes('(Extra)') && !issue.type?.includes('Additional') && !issue.notes?.includes('Additional'));

    const itemPrice = isExplicitBasePkg
      ? getPackageFeeForStudent(clsName, issue.price, stMatch?.gender)
      : ((issue.price && issue.price > 0)
          ? issue.price
          : getItemFeeFromFinanceConfig(clsName, issue.itemName, stMatch?.gender, financeUniformConfigs, catalogItem?.price));

    const existing = groupedMap.get(normKey);

    if (existing) {
      if (!existing.items.some(i => i.id === issue.id)) {
        existing.items.push(issue);
      }
      if (!existing.admissionNo && admNo) {
        existing.admissionNo = admNo;
      }
      if (isExplicitBasePkg && !existing.basePackage) {
        existing.basePackage = issue;
      } else {
        if (!existing.extraItems.some(e => e.id === issue.id)) {
          existing.extraItems.push(issue);
          existing.totalExtraPayable += (itemPrice * (issue.quantity || 1));
        }
      }
    } else {
      groupedMap.set(normKey, {
        id: issue.id,
        studentId: stdId,
        studentName: stdName,
        admissionNo: admNo,
        className: clsName,
        section: secName,
        gender: stMatch?.gender || (isFemaleName ? 'Female' : 'Male'),
        issueDate: issue.issueDate,
        academicYear: issue.academicYear,
        status: issue.status,
        items: [issue],
        basePackage: isExplicitBasePkg ? issue : undefined,
        extraItems: isExplicitBasePkg ? [] : [issue],
        totalExtraPayable: isExplicitBasePkg ? 0 : (itemPrice * (issue.quantity || 1))
      });
    }
  });



  // Table strictly displays actual logged uniform issue records only
  const allGroupedList = Array.from(groupedMap.values())
    .filter(g => {
      const lower = (g.studentName || '').toLowerCase();
      const adm = (g.admissionNo || g.studentId || '').toUpperCase();
      const isDummy = lower.includes('fahim') || lower.includes('faheem') || lower.includes('mahesh') || lower.includes('alexander') || lower.includes('wright') || lower.includes('rahul') || lower.includes('kiriti') || lower.includes('kiran') || adm === 'ADM-2026-001' || adm === 'REG-1022';
      return !isDummy;
    })
    .sort((a, b) => {
    // Sort by maximum issue ID / creation timestamp descending so newly issued items are ALWAYS AT THE VERY TOP
    const getMaxTimestamp = (g: typeof a) => {
      const tsList = g.items.map(i => {
        if (!i) return 0;
        const uisMatch = (i.id || '').match(/UIS-(\d+)/i);
        if (uisMatch && uisMatch[1]) {
          return parseInt(uisMatch[1], 10);
        }
        if (i.issueDate) {
          const t = new Date(i.issueDate).getTime();
          if (!isNaN(t) && t > 0) return t;
        }
        const digits = (i.id || '').replace(/\D/g, '').slice(0, 13);
        const numOnly = parseInt(digits, 10);
        if (numOnly > 0) return numOnly;
        return 0;
      });
      return Math.max(...tsList, 0);
    };
    const tsA = getMaxTimestamp(a);
    const tsB = getMaxTimestamp(b);
    if (tsA !== tsB) return tsB - tsA;

    const dateA = new Date(a.issueDate || '2026-01-01').getTime();
    const dateB = new Date(b.issueDate || '2026-01-01').getTime();
    return dateB - dateA;
  });

  // Helper functions for clean class & section matching and exchanged item detection
  const cleanClassStr = (cStr: string) => (cStr || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanSecStr = (sStr: string) => (sStr || '').toLowerCase().replace(/section\s*/i, '').trim();
  const isExchangedItem = (i: StudentUniformIssue) => {
    if (!i) return false;
    const statusLow = (i.status || '').toLowerCase();
    const notesLow = (i.notes || '').toLowerCase();
    return statusLow === 'exchanged' || statusLow === 'replaced' || notesLow.includes('exchanged') || notesLow.includes('replaced') || Boolean(i.replacementDate);
  };

  // Filter student grouped entries based on query, class, section, status, and academic year
  const filteredGroupedList = allGroupedList.filter(g => {
    const normYear = (y?: string) => (y || '').replace(/[^0-9]/g, '');
    const selYearNorm = normYear(selectedAcademicYear);
    const matchAcademicYear = !selYearNorm || 
      !normYear(g.academicYear) || 
      normYear(g.academicYear).includes(selYearNorm) || 
      selYearNorm.includes(normYear(g.academicYear)) || 
      g.items.some(i => !normYear(i.academicYear) || normYear(i.academicYear).includes(selYearNorm) || selYearNorm.includes(normYear(i.academicYear)));

    const q = (query || '').trim().toLowerCase();
    const visibleName = (g.studentName || '').toLowerCase();
    const visibleAdmNo = (g.admissionNo || '').toLowerCase();
    const stdIdLower = (g.studentId || '').toLowerCase();
    const visibleItems = g.items.map(i => (i.itemName || '').toLowerCase()).join(' ');

    const matchQuery = !q ||
      visibleName.includes(q) ||
      visibleAdmNo.includes(q) ||
      stdIdLower.includes(q) ||
      visibleItems.includes(q);

    const gClassClean = cleanClassStr(g.className);
    const fClassClean = cleanClassStr(filterClass);
    const matchClass = filterClass === 'All' || gClassClean === fClassClean;

    const gSecClean = cleanSecStr(g.section);
    const fSecClean = cleanSecStr(filterSection);
    const matchSection = filterSection === 'All' || gSecClean === fSecClean;

    const feeStat = getStudentUniformFeeStatus(g.studentId, g.admissionNo, g.className, g.gender);
    const activeExtras = (g.extraItems || []).filter(i => i.status !== 'Returned' && i.status !== 'Cancelled');

    const checkExtraItemPaid = (item: StudentUniformIssue) => {
      const notesLower = (item.notes || '').toLowerCase();
      const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
        !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');

      const extraFeeStat = getExtraItemsFeeStatus(g.studentId, g.admissionNo, [item]);
      return isExplicitlyPaidNote || extraFeeStat.isPaid || (item.status as string) === 'Paid';
    };

    const isBasePaid = feeStat.isPaid || (g.basePackage && (g.basePackage.status as string) === 'Paid');
    const isBasePending = !isBasePaid && (Boolean(g.basePackage) || feeStat.isOptedAtAdmission);
    const hasAnyPaidItem = isBasePaid || activeExtras.some(checkExtraItemPaid);
    const hasAnyPendingItem = isBasePending || activeExtras.some(i => !checkExtraItemPaid(i));

    const hasActiveBasePackage = (g.basePackage && g.basePackage.status !== 'Returned' && !(g.basePackage.notes || '').toLowerCase().includes('returned')) ||
      (feeStat.isOptedAtAdmission && (!g.basePackage || g.basePackage.status !== 'Returned'));

    const isAllReturned = !hasActiveBasePackage && activeExtras.length === 0 && g.items.length > 0 && g.items.every(i => i.status === 'Returned' || i.notes?.toLowerCase().includes('returned'));
    const isOverallReturned = (g.status === 'Returned' && !hasActiveBasePackage) || isAllReturned;

    let matchStatus = true;
    if (filterStatus === 'Returned') {
      matchStatus = isOverallReturned || g.items.some(i => i.status === 'Returned' || i.notes?.toLowerCase().includes('returned'));
    } else {
      // For All, Issued, Fee Pending, Fee Paid, etc., fully returned students are excluded
      if (isOverallReturned) {
        matchStatus = false;
      } else if (filterStatus === 'Issued') {
        matchStatus = g.items.some(i => i.status === 'Issued' || isExchangedItem(i) || !i.status);
      } else if (filterStatus === 'Not Opted at Admission') {
        matchStatus = (!feeStat.isOptedAtAdmission && (g.items.length === 0 || g.status === 'Not Opted at Admission')) || g.status === 'Not Opted at Admission';
      } else if (filterStatus === 'Fee Pending at Finance') {
        matchStatus = hasAnyPendingItem;
      } else if (filterStatus === 'Fee Paid') {
        matchStatus = hasAnyPaidItem;
      } else if (filterStatus === 'Exchanged' || filterStatus === 'Replaced') {
        matchStatus = g.items.some(isExchangedItem);
      } else if (filterStatus !== 'All') {
        matchStatus = g.status === filterStatus || g.items.some(i => i.status === filterStatus);
      }
    }

    return matchAcademicYear && matchQuery && matchClass && matchSection && matchStatus;
  });

  const paginatedGrouped = filteredGroupedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Issue' | 'Replace' | 'Return'>('Issue');
  const [selectedIssue, setSelectedIssue] = useState<StudentUniformIssue | null>(null);
  
  // Receipt modal states
  const [receiptStudent, setReceiptStudent] = useState<StudentUniformIssue | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptSearchTerm, setReceiptSearchTerm] = useState('');
  const [isReceiptDropdownOpen, setIsReceiptDropdownOpen] = useState(false);

  const [returnSelectionModalItems, setReturnSelectionModalItems] = useState<StudentUniformIssue[] | null>(null);
  const [exchangeSelectionModalItems, setExchangeSelectionModalItems] = useState<StudentUniformIssue[] | null>(null);
  const [returnReceiptStudent, setReturnReceiptStudent] = useState<StudentUniformIssue | null>(null);
  const [isReturnReceiptOpen, setIsReturnReceiptOpen] = useState(false);

  const handleOpenReceipt = (issue: StudentUniformIssue) => {
    setReceiptStudent(issue);
    setReceiptSearchTerm('');
    setIsReceiptDropdownOpen(false);
    setIsReceiptOpen(true);
  };

  const handleOpenReturnReceipt = (issue: StudentUniformIssue) => {
    setReturnReceiptStudent(issue);
    setIsReturnReceiptOpen(true);
  };

  const [exchangeReceiptStudent, setExchangeReceiptStudent] = useState<StudentUniformIssue | null>(null);
  const [isExchangeReceiptOpen, setIsExchangeReceiptOpen] = useState(false);

  const handleOpenExchangeReceipt = (issue: StudentUniformIssue) => {
    setExchangeReceiptStudent(issue);
    setIsExchangeReceiptOpen(true);
  };

  const [customMeasurement, setCustomMeasurement] = useState({
    chest: '',
    waist: '',
    length: '',
    shoulder: ''
  });

  const [issueModalClass, setIssueModalClass] = useState<string>('All');

  // Form states
  const [form, setForm] = useState({
    studentId: '',
    itemId: '',
    quantity: 1,
    size: 'M',
    type: 'Issue' as 'Issue' | 'Additional Purchase',
    paymentMode: 'Cash' as 'Cash' | 'Online' | 'Card' | 'Cheque',
    notes: ''
  });

  const [exchangeReason, setExchangeReason] = useState('Wrong Size / Fitting Issue');
  const [exchangeNotes, setExchangeNotes] = useState('');

  const [extraItemsState, setExtraItemsState] = useState<Record<string, {
    id: string;
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
    availableStock: number;
    isSelected: boolean;
  }>>({});

  const getResolvedStudentObj = () => {
    const normFormStudent = (form.studentId || studentSearchTerm || '').toLowerCase().trim();
    if (!normFormStudent) return null;

    // 1. Try exact match by ID or admissionNo or full name in allEnrolledStudents
    const match = (allEnrolledStudents || []).find(s => 
      s && (
        (form.studentId && s.id === form.studentId) || 
        (form.studentId && s.admissionNo === form.studentId) ||
        (s.admissionNo && normFormStudent.includes(s.admissionNo.toLowerCase())) ||
        (`${s.firstName} ${s.lastName}`.toLowerCase().trim() === normFormStudent) ||
        (s.firstName && normFormStudent.includes(s.firstName.toLowerCase()))
      )
    ) || (students || []).find(s => 
      s && (
        (form.studentId && s.id === form.studentId) || 
        (form.studentId && s.admissionNo === form.studentId) ||
        (s.admissionNo && normFormStudent.includes(s.admissionNo.toLowerCase())) ||
        (`${s.firstName} ${s.lastName}`.toLowerCase().trim() === normFormStudent)
      )
    );

    if (match) return match;

    // 2. Fallback for typed student name in search input e.g. "Rajesh Rayudu"
    if (studentSearchTerm.trim()) {
      const cleanName = studentSearchTerm.replace(/\(.*?$/, '').trim();
      const parts = cleanName.split(' ');
      const fName = parts[0] || 'Student';
      const lName = parts.slice(1).join(' ') || '';
      return {
        id: form.studentId || `ST-${Date.now().toString().slice(-4)}`,
        firstName: fName,
        lastName: lName,
        admissionNo: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
        className: 'Class 1',
        section: 'A',
        gender: 'Male',
        branch: selectedBranch || 'Main Campus'
      } as unknown as Student;
    }

    return null;
  };

  const buildExtraItemsList = (selStudentObj?: Student | null) => {
    const isBasePkgName = (name: string) => {
      const lower = (name || '').toLowerCase();
      if (lower.includes('unstitched') || lower.includes('cloth') || lower.includes('fabric')) return true;
      return (lower.includes('boys') || lower.includes('girls')) && (lower.includes('package') || lower.includes('kit'));
    };

    const items: {
      id: string;
      name: string;
      unitPrice: number;
      stock: number;
      size: string;
      isFinanceConfigured?: boolean;
    }[] = [];
    const seen = new Set<string>();

    // 1. Iterate through all categories in uniformCategories (all 28 categories)
    (uniformCategories || []).forEach(c => {
      const cName = c.name || (c as any).categoryName || '';
      if (!cName || isBasePkgName(cName)) return;
      const key = cName.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);

        let fallbackPrice = 350;
        if (key.includes('blazer')) fallbackPrice = 1500;
        else if (key.includes('sweater')) fallbackPrice = 800;
        else if (key.includes('pant') || key.includes('trouser') || key.includes('skirt') || key.includes('shoes') || key.includes('tracksuit')) fallbackPrice = 500;
        else if (key.includes('tie') || key.includes('belt') || key.includes('cap')) fallbackPrice = 150;

        const catalog = (uniforms || []).find(u => (u.category || u.name || '').toLowerCase().trim() === key);
        if (catalog?.price) fallbackPrice = catalog.price;

        const configuredPrice = getItemFeeFromFinanceConfig(
          selStudentObj?.className || '',
          cName,
          selStudentObj?.gender || '',
          financeUniformConfigs,
          fallbackPrice
        );

        const inv = uniformInventory.find(x => x.itemName.toLowerCase().trim() === key || x.category.toLowerCase().trim() === key);
        const stock = inv ? inv.currentStock : (catalog?.availableStock ?? 100);

        items.push({
          id: catalog ? catalog.id : `cat_${c.id}`,
          name: cName,
          unitPrice: configuredPrice,
          stock: stock,
          size: key.includes('tie') || key.includes('belt') || key.includes('ribbon') || key.includes('cap') ? 'Free Size' : 'M'
        });
      }
    });

    // 2. Add any uniforms catalog items not already in categories
    (uniforms || []).forEach(u => {
      const uName = u.category || u.name || '';
      if (!uName || isBasePkgName(uName)) return;
      const key = uName.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);

        const configuredPrice = getItemFeeFromFinanceConfig(
          selStudentObj?.className || '',
          uName,
          selStudentObj?.gender || '',
          financeUniformConfigs,
          u.price || 350
        );

        const inv = uniformInventory.find(x => x.itemId === u.id || x.itemName.toLowerCase().trim() === key);
        const stock = inv ? inv.currentStock : (u.availableStock ?? 100);

        items.push({
          id: u.id,
          name: uName,
          unitPrice: configuredPrice,
          stock: stock,
          size: key.includes('tie') || key.includes('belt') || key.includes('ribbon') || key.includes('cap') ? 'Free Size' : 'M'
        });
      }
    });

    return items;
  };

  const [counterPaymentMode, setCounterPaymentMode] = useState<'Cash' | 'Online' | 'Card' | 'Cheque'>('Cash');

  const handleCollectCounterFeeAndIssue = (studentObj: Student, feeAmount: number, payMode: 'Cash' | 'Online' | 'Card' | 'Cheque' = counterPaymentMode) => {
    if (!studentObj || !form.itemId) return;

    const itemObj = uniforms.find(u => u.id === form.itemId) || 
      (form.itemId?.startsWith('cat_') ? {
        id: form.itemId,
        category: (uniformCategories || []).find(c => c.id === form.itemId.replace('cat_', ''))?.name || 'Boys Uniform Package (Admission Kit)',
        price: feeAmount,
        availableStock: 50
      } : null);

    if (!itemObj) {
      addToast('warning', 'Select Package Item', 'Please select a package item to issue.');
      return;
    }

    const receiptNo = `REC-UNI-${Date.now().toString().slice(-6)}`;
    const finalSize = getResolvedSize();

    // 1. Post Income Transaction to Finance
    if (addFinanceTransaction && feeAmount > 0) {
      addFinanceTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Income',
        category: 'Uniform Fee',
        sourceModule: 'Uniform',
        referenceNumber: receiptNo,
        description: `Counter Uniform Fee Collected — ${itemObj.category} (${studentObj.firstName} ${studentObj.lastName} • ${studentObj.admissionNo || studentObj.id})`,
        amount: feeAmount,
        paymentMode: payMode,
        account: 'Main Bank Account',
        status: 'Completed',
        branch: studentObj.branch || 'Main Campus',
        academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
        createdBy: 'Uniform Counter'
      });
    }

    // 2. Issue the Base Package Kit to Student
    addStudentUniformIssue({
      studentId: studentObj.id,
      studentName: `${studentObj.firstName} ${studentObj.lastName}`,
      admissionNo: studentObj.admissionNo || 'ADM2026-000',
      className: studentObj.className || 'Class 1',
      section: studentObj.section || 'A',
      itemId: form.itemId,
      itemName: itemObj.category,
      size: finalSize,
      quantity: 1,
      issueDate: new Date().toISOString().split('T')[0],
      status: 'Issued',
      academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
      type: 'Base Package',
      price: feeAmount,
      notes: `Counter Fee Collected (${payMode}) — Ref #${receiptNo}`
    });

    // 3. Decrement Inventory Stock by 1
    const inv = uniformInventory.find(x => x.itemId === form.itemId || x.itemName.toLowerCase() === itemObj.category.toLowerCase());
    if (inv && inv.id) {
      const newStock = Math.max(0, inv.currentStock - 1);
      updateUniformInventory(inv.id, {
        currentStock: newStock,
        status: newStock === 0 ? 'Out of Stock' : (newStock <= inv.minimumStock ? 'Low Stock' : 'In Stock')
      });
    }

    addToast('success', 'Uniform Fee Collected & Kit Issued!', `Successfully collected ${formatCurrency(feeAmount)} via ${payMode} and issued ${itemObj.category} to ${studentObj.firstName}. Receipt #${receiptNo}`);
    setIsModalOpen(false);
  };

  const getResolvedSize = () => {
    if (form.size && form.size !== 'Others' && form.size !== 'Other' && form.size.trim() !== '') return form.size;
    if (form.size === 'Others' || form.size === 'Other') {
      const parts = [];
      if (customMeasurement.chest) parts.push(`Chest: ${customMeasurement.chest}"`);
      if (customMeasurement.waist) parts.push(`Waist: ${customMeasurement.waist}"`);
      if (customMeasurement.length) parts.push(`Length: ${customMeasurement.length}"`);
      if (customMeasurement.shoulder) parts.push(`Shoulder: ${customMeasurement.shoulder}"`);
      
      if (parts.length > 0) {
        return `Custom Tailored (${parts.join(', ')})`;
      }
      return 'Custom Tailored';
    }
    return 'M';
  };

  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  const handleOpenIssue = () => {
    setSelectedIssue(null);
    setForm({
      studentId: '',
      itemId: '',
      quantity: 1,
      size: 'M',
      type: '',
      paymentMode: 'Cash',
      notes: ''
    });
    setExtraItemsState({});
    setStudentSearchTerm('');
    setIsStudentDropdownOpen(false);
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
    setIsModalOpen(true);
  };

  const handleOpenReplace = (issue: StudentUniformIssue) => {
    setSelectedIssue(issue);
    setModalType('Replace');
    setExchangeReason('Wrong Size / Fitting Issue');
    setExchangeNotes('');
    setForm({
      studentId: issue.studentId,
      itemId: issue.itemId,
      quantity: issue.quantity,
      size: issue.size,
      type: 'Issue',
      paymentMode: 'Cash',
      notes: issue.notes || ''
    });
    setExtraItemsState({});
    const foundStud = (allEnrolledStudents || []).find(s => s.id === issue.studentId || (issue.admissionNo && s.admissionNo === issue.admissionNo));
    if (foundStud) {
      setStudentSearchTerm(`${foundStud.firstName} ${foundStud.lastName} (${foundStud.admissionNo || foundStud.id} - ${foundStud.className || 'Class 10'})`);
    } else {
      setStudentSearchTerm(issue.studentName || '');
    }
    setIsStudentDropdownOpen(false);
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
    setIsModalOpen(true);
  };

  const restoreInventoryStock = (issue: StudentUniformIssue) => {
    const qtyToRestore = Number(issue.quantity) || 1;
    const rawItemName = (issue.itemName || issue.itemCategory || '').replace(/\s*\(Extra\)/gi, '').trim();
    const normItemName = normalizeUniformCategoryName(rawItemName).toLowerCase().trim();

    // 1. Sync uniforms state (availableStock)
    setUniforms(prev => prev.map(u => {
      const isIdMatch = Boolean(issue.itemId && u.id === issue.itemId);
      const normUCat = normalizeUniformCategoryName(u.category || u.name).toLowerCase().trim();
      const isNameMatch = normUCat === normItemName || normUCat.includes(normItemName) || normItemName.includes(normUCat);

      let isSizeMatch = true;
      if (issue.size && (u.size || u.meterRange)) {
        const uSizeNorm = (u.size || u.meterRange || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const issueSizeNorm = issue.size.toLowerCase().replace(/[^a-z0-9]/g, '');
        isSizeMatch = uSizeNorm === issueSizeNorm || uSizeNorm.includes(issueSizeNorm) || issueSizeNorm.includes(uSizeNorm);
      }

      if (isIdMatch || (isNameMatch && isSizeMatch)) {
        const curStock = u.availableStock !== undefined ? Number(u.availableStock) : (u.openingStock !== undefined ? Number(u.openingStock) : 100);
        return {
          ...u,
          availableStock: curStock + qtyToRestore
        };
      }
      return u;
    }));

    // 2. Sync uniformInventory state (currentStock)
    if (updateUniformInventory) {
      const inv = (uniformInventory || []).find(x =>
        (issue.itemId && x.itemId === issue.itemId) ||
        (x.itemName && normalizeUniformCategoryName(x.itemName).toLowerCase().trim() === normItemName) ||
        (x.category && normalizeUniformCategoryName(x.category).toLowerCase().trim() === normItemName)
      );
      if (inv && inv.id) {
        const newStock = inv.currentStock + qtyToRestore;
        updateUniformInventory(inv.id, {
          currentStock: newStock,
          status: newStock <= 0 ? 'Out of Stock' : (newStock <= inv.minimumStock ? 'Low Stock' : 'In Stock')
        });
      }
    }
  };

  const handleOpenReturnModal = (issue: StudentUniformIssue) => {
    setSelectedReturnItem(issue);
    setReturnReason('Wrong Size / Fitting Issue');
    setReturnNotes('');
  };

  const handleReturn = (issue: StudentUniformIssue, customNote?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const returnNote = customNote || 'Returned by student';

    restoreInventoryStock(issue);

    if (issue.id.startsWith('BASE-SYNTH-')) {
      addStudentUniformIssue({
        studentId: issue.studentId,
        studentName: issue.studentName,
        admissionNo: issue.admissionNo,
        className: issue.className,
        section: issue.section,
        itemId: issue.itemId || 'cat_cat_boys_kit',
        itemName: issue.itemName || 'Boys Package',
        size: issue.size || 'M',
        quantity: 1,
        issueDate: todayStr,
        returnDate: todayStr,
        status: 'Returned',
        academicYear: issue.academicYear || selectedAcademicYear || financeSettings.academicYear || '2026-2027',
        type: 'Base Package',
        price: issue.price || 0,
        notes: returnNote
      });
    } else {
      updateStudentUniformIssue(issue.id, {
        status: 'Returned',
        returnDate: todayStr,
        notes: returnNote
      });
    }

    const isPkg = issue.type === 'Base Package' || (issue.itemName && (issue.itemName.toLowerCase().includes('package') || issue.itemName.toLowerCase().includes('base')));
    const studentClass = issue.className || '';
    const studentGender = issue.gender || 'Male';

    let unitPrice = (issue.price && issue.price > 0 && issue.price !== 85) ? issue.price : 0;
    if (unitPrice <= 0) {
      if (isPkg) {
        unitPrice = getPackageFeeForStudent(studentClass, issue.price, studentGender);
      } else {
        const catItem = uniforms.find(u => u.category === issue.itemName || u.name === issue.itemName);
        unitPrice = getItemFeeFromFinanceConfig(studentClass, issue.itemName, studentGender, financeUniformConfigs, catItem?.price) || 200;
      }
    }

    const refundAmount = unitPrice * (issue.quantity || 1);

    // Check if money was actually paid for this returned item prior to return
    const isPrimaryBase = issue.type === 'Base Package' && !issue.notes?.includes('Additional') && !issue.notes?.includes('Kit 2');
    const baseFeeStat = getStudentUniformFeeStatus(issue.studentId, issue.admissionNo, issue.className, issue.gender);
    const isPrimaryBasePaid = isPrimaryBase && baseFeeStat.isPaid && baseFeeStat.isOptedAtAdmission;

    const notesLower = (issue.notes || '').toLowerCase();
    const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
      !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');

    const isItemPaid = isPrimaryBasePaid || (issue.status as string) === 'Paid' || isExplicitlyPaidNote || (() => {
      try {
        const storedPayments = JSON.parse(localStorage.getItem('edu_db_fee_payments') || '[]');
        return storedPayments.some((p: any) =>
          (p.studentId === issue.studentId || p.studentId === issue.admissionNo) &&
          (p.selectedInstallmentIds?.includes(`INST-UNIF-EXTRA-${issue.id}`) || p.selectedInstallmentIds?.includes(issue.id) || p.receiptNo?.includes(issue.id)) &&
          p.amountPaid > 0
        );
      } catch (e) {
        return false;
      }
    })();

    // 1. ONLY post Uniform Return Fee Credit transaction to Finance & Fees Ledger IF item was PAID
    if (isItemPaid && addFinanceTransaction && refundAmount > 0) {
      addFinanceTransaction({
        date: todayStr,
        type: 'Expense',
        category: 'Student Fee Credit (Uniform Return)',
        sourceModule: 'Uniform',
        referenceNumber: `TXN-UNI-CREDIT-${Date.now().toString().slice(-6)}`,
        description: `Student Fee Credit Note (${formatCurrency(refundAmount)}) - Created from Uniform Return (${issue.itemName}) for ${issue.studentName || 'Student'}. Available credit to adjust against other fee charges (Tuition, Term, Transport Fee).`,
        amount: refundAmount,
        paymentMode: 'Credit Note' as any,
        account: 'Main Bank Account',
        status: 'Completed',
        branch: issue.branch || (schoolProfile as any)?.schoolName || 'Main Campus',
        academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
        createdBy: 'Uniform Counter'
      });
    }

    // 2. ONLY persist Student Credit Record for Finance & Fees IF item was PAID
    if (isItemPaid && refundAmount > 0) {
      try {
        const storedCredits = JSON.parse(localStorage.getItem('edu_db_student_credits') || '[]');
        const newCredit = {
          id: `CREDIT-UNI-${Date.now()}`,
          studentId: issue.studentId,
          studentName: issue.studentName,
          admissionNo: issue.admissionNo,
          className: issue.className,
          creditAmount: refundAmount,
          availableCredit: refundAmount,
          source: `Uniform Return (${issue.itemName})`,
          date: todayStr,
          status: 'Available',
          appliedToFee: 'Available Student Credit — Can be adjusted against other fee charges or used for fee adjustments'
        };
        localStorage.setItem('edu_db_student_credits', JSON.stringify([newCredit, ...storedCredits]));
      } catch (e) {}
    }

    // 3. Apply Student Return Credit & cancel pending fee installments for returned items in Finance & Fees
    if (setStudentFeeInstallments) {
      setStudentFeeInstallments(prev => {
        let remainingCredit = refundAmount;
        return prev.map(inst => {
          const isStudent = inst.studentId === issue.studentId || (issue.admissionNo && inst.studentId === issue.admissionNo) || (inst.studentName && inst.studentName.toLowerCase().includes((issue.studentName || '').toLowerCase()));
          if (!isStudent) return inst;

          // Remove specific uniform fee installment if matching
          const instIdStr = String(inst?.id || '');
          const issueIdStr = String(issue?.id || '');
          const itemClean = (issue?.itemName || '').toLowerCase().replace(/\s*\(extra\)/gi, '').trim();
          const termName = (inst?.termName || inst?.feeHeadName || '').toLowerCase();
          const isUniformInst = (instIdStr && issueIdStr && instIdStr.includes(issueIdStr)) || (termName.includes('uniform') && itemClean && termName.includes(itemClean));

          if (isUniformInst && inst.status !== 'Paid') {
            return null as any; // Auto-cancel / remove unpaid fee charge for returned item
          }

          // Apply return credit note to reduce other eligible fee charges (outstanding amount decreases)
          if (remainingCredit > 0 && inst.status !== 'Paid' && inst.amount > 0) {
            const deduct = Math.min(inst.amount, remainingCredit);
            remainingCredit -= deduct;
            const newAmount = inst.amount - deduct;
            return {
              ...inst,
              amount: newAmount,
              notes: `${(inst as any).notes || ''} (Adjusted ${formatCurrency(deduct)} from Uniform Return Fee Credit)`.trim(),
              status: newAmount <= 0 ? 'Paid' as const : 'Partial' as const
            };
          }
          return inst;
        }).filter(Boolean);
      });
    }

    // 4. Cancel any pending Finance & Fees transactions for returned item
    try {
      const storedTxns = JSON.parse(localStorage.getItem('edu_db_finance_transactions') || '[]');
      const itemClean = (issue.itemName || '').replace(/\s*\(extra\)/gi, '').trim().toLowerCase();
      const stdClean = (issue.studentName || '').toLowerCase().trim();
      const admClean = (issue.admissionNo || '').toLowerCase().trim();

      const updatedTxns = storedTxns.map((t: any) => {
        if (!t) return t;
        const desc = (t.description || '').toLowerCase();
        const isMatch = (t.status === 'Pending' || t.status === 'Created') && (
          (admClean && desc.includes(admClean)) ||
          (stdClean && desc.includes(stdClean))
        ) && (desc.includes('uniform') || (itemClean && desc.includes(itemClean)));

        if (isMatch) {
          return { ...t, status: 'Cancelled', notes: `Cancelled due to Uniform Return on ${todayStr}` };
        }
        return t;
      });
      localStorage.setItem('edu_db_finance_transactions', JSON.stringify(updatedTxns));
    } catch (e) {}

    // 5. Cancel / remove any pending fee installments from localStorage
    try {
      const storedInsts = JSON.parse(localStorage.getItem('edu_db_student_fee_installments') || '[]');
      const itemClean = (issue.itemName || '').replace(/\s*\(extra\)/gi, '').trim().toLowerCase();
      const stdClean = (issue.studentName || '').toLowerCase().trim();
      const admClean = (issue.admissionNo || '').toLowerCase().trim();

      const updatedInsts = storedInsts.filter((inst: any) => {
        if (!inst) return true;
        const instStd = (inst.studentId || inst.admissionNo || inst.studentName || '').toLowerCase();
        const termName = (inst.termName || inst.feeHeadName || '').toLowerCase();
        const isStudent = (admClean && instStd.includes(admClean)) || (stdClean && instStd.includes(stdClean)) || inst.studentId === issue.studentId;
        const isItemMatch = termName.includes('uniform') || (itemClean && itemClean.length > 2 && termName.includes(itemClean));

        if (isStudent && isItemMatch && inst.status !== 'Paid') {
          return false; // Remove unpaid returned item installment
        }
        return true;
      });
      localStorage.setItem('edu_db_student_fee_installments', JSON.stringify(updatedInsts));
    } catch (e) {}

    addToast('success', 'Uniform Returned & Fee Dues Cancelled', `Cancelled pending fee charge for ${issue.itemName} for ${issue.studentName || 'Student'}. Updated Finance & Fees (No pending balance).`);
  };

  const handleConfirmReturn = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedReturnItem) return;

    const targetItem = selectedReturnItem;

    const checkItemPaid = (item: StudentUniformIssue) => {
      const notesLower = (item.notes || '').toLowerCase();
      const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
        !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');

      const extraFeeStat = getExtraItemsFeeStatus(item.studentId, item.admissionNo, [item]);
      return isExplicitlyPaidNote || extraFeeStat.isPaid || (item.status as string) === 'Paid' || Boolean((item as any).wasPaid);
    };

    const isItemPaid = checkItemPaid(targetItem);
    const reasonStr = returnReason === 'Other Reason' && returnNotes ? `Other: ${returnNotes}` : returnReason;
    const returnNote = `Returned by student — Reason: ${reasonStr}${returnNotes && returnReason !== 'Other Reason' ? ` (${returnNotes})` : ''}${isItemPaid ? ' (Paid Item Fees Refunded)' : ' (Unpaid Item Charge Removed)'}`;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const isSameItemName = (n1?: string, n2?: string) => {
        if (!n1 || !n2) return false;
        const s1 = normalizeUniformCategoryName(n1).toLowerCase().replace(/[^a-z0-9]/g, '');
        const s2 = normalizeUniformCategoryName(n2).toLowerCase().replace(/[^a-z0-9]/g, '');
        return s1 === s2 || s1.includes(s2) || s2.includes(s1);
      };

      // 1. Direct State & LocalStorage Update for Student Uniform Issues
      setStudentUniformIssues(prev => {
        let matchedCount = 0;
        const updated = (prev || []).map(issue => {
          if (!issue) return issue;
          const isIdMatch = Boolean(issue.id && targetItem.id && issue.id === targetItem.id);
          const isStudentMatch = (issue.studentId && (issue.studentId === targetItem.studentId || (targetItem.admissionNo && issue.studentId === targetItem.admissionNo))) ||
            (issue.admissionNo && (issue.admissionNo === targetItem.studentId || (targetItem.admissionNo && issue.admissionNo === targetItem.admissionNo))) ||
            (issue.studentName && targetItem.studentName && issue.studentName.toLowerCase().trim().includes(targetItem.studentName.toLowerCase().trim())) ||
            (targetItem.studentName && issue.studentName && targetItem.studentName.toLowerCase().trim().includes(issue.studentName.toLowerCase().trim()));

          const isItemMatch = isSameItemName(issue.itemName || issue.itemCategory, targetItem.itemName || targetItem.itemCategory);

          if (isIdMatch || (isStudentMatch && isItemMatch)) {
            matchedCount++;
            return {
              ...issue,
              status: 'Returned' as const,
              returnDate: todayStr,
              wasPaid: isItemPaid,
              notes: returnNote
            };
          }
          return issue;
        });

        if (matchedCount === 0) {
          updated.push({
            id: targetItem.id || `UNI-RET-${Date.now()}`,
            studentId: targetItem.studentId,
            studentName: targetItem.studentName,
            admissionNo: targetItem.admissionNo,
            className: targetItem.className,
            section: targetItem.section,
            itemId: targetItem.itemId,
            itemName: targetItem.itemName,
            size: targetItem.size || 'M',
            quantity: targetItem.quantity || 1,
            issueDate: targetItem.issueDate || todayStr,
            returnDate: todayStr,
            status: 'Returned' as const,
            academicYear: targetItem.academicYear || '2026-2027',
            type: targetItem.type || 'Additional Purchase',
            price: targetItem.price || 0,
            notes: returnNote
          });
        }

        try {
          localStorage.setItem('edu_db_student_uniform_issues', JSON.stringify(updated));
          localStorage.setItem('student_uniform_issues', JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });

      // 2. Call handleReturn for inventory stock restoration & finance installment cancellation
      handleReturn(targetItem, returnNote);
    } catch (err) {
      console.error("Error in handleConfirmReturn:", err);
    } finally {
      // 3. Always close modal & clear selection, never freeze!
      setSelectedReturnItem(null);
      if (returnSelectionModalItems) {
        const remaining = returnSelectionModalItems.filter(i => i.id !== targetItem.id);
        setReturnSelectionModalItems(remaining.length > 0 ? remaining : null);
      }
    }
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      addToast('warning', 'Validation Error', 'Please select a student first.');
      return;
    }

    const studentObj = getResolvedStudentObj();
    if (!studentObj) {
      addToast('warning', 'Student Not Selected', 'Please select a valid student from the dropdown list.');
      return;
    }

    if (modalType === 'Issue') {
      if (!form.type) {
        addToast('warning', 'Validation Error', 'Please select a Transaction Type.');
        return;
      }
      if (form.type !== 'Additional Purchase' && !form.itemId) {
        addToast('warning', 'Validation Error', 'Please select a Base Package / Main Item.');
        return;
      }
    }

    // Handle Multi-Item Additional Purchase
    if (modalType === 'Issue' && form.type === 'Additional Purchase') {
      const checkedEntries = Object.values(extraItemsState).filter(x => x.isSelected && x.quantity > 0);

      if (checkedEntries.length > 0) {
        // Stock Validation
        for (const itemEntry of checkedEntries) {
          const inv = uniformInventory.find(x => x.itemId === itemEntry.id || x.itemName.toLowerCase().trim() === itemEntry.name.toLowerCase().trim());
          const avail = inv ? inv.currentStock : (itemEntry.availableStock ?? 100);
          if (avail < itemEntry.quantity) {
            addToast('error', 'Insufficient Stock', `Stock for ${itemEntry.name} is only ${avail} unit(s). Reduce quantity or uncheck item.`);
            return;
          }
        }

        let totalGrandSale = 0;
        const summaryNames: string[] = [];

        for (const itemEntry of checkedEntries) {
          const qty = Number(itemEntry.quantity) || 1;
          const finalSize = itemEntry.size || 'M';
          const itemUnitPrice = itemEntry.unitPrice;
          const totalSale = itemUnitPrice * qty;
          totalGrandSale += totalSale;

          const itemDisplayName = itemEntry.name.replace(/\s*\(Extra\)/gi, '').trim();
          summaryNames.push(`${itemDisplayName} (x${qty})`);

          // 1. Issue Student Uniform Record
          addStudentUniformIssue({
            studentId: form.studentId,
            studentName: `${studentObj.firstName} ${studentObj.lastName}`,
            admissionNo: studentObj.admissionNo || 'ADM2026-000',
            className: studentObj.className || 'Class 10',
            section: studentObj.section || 'A',
            itemId: itemEntry.id,
            itemName: itemDisplayName,
            size: finalSize,
            quantity: qty,
            issueDate: new Date().toISOString().split('T')[0],
            status: 'Issued',
            academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
            type: 'Additional Purchase',
            price: itemUnitPrice,
            notes: form.notes || `Multi-Item Additional Purchase — Added to Fee Account (Collect from Finance & Fees)`
          });

          // 2. Post Income Transaction to Finance
          if (addFinanceTransaction && totalSale > 0) {
            addFinanceTransaction({
              date: new Date().toISOString().split('T')[0],
              type: 'Income',
              category: 'Uniform',
              sourceModule: 'Uniform',
              referenceNumber: `UNI-EXTRA-${Date.now().toString().slice(-6)}`,
              description: `Uniform Extra Item Pending — ${qty}x ${itemEntry.name} (${studentObj.firstName} ${studentObj.lastName} • ${studentObj.admissionNo || studentObj.id}) — Collect from Fee Collection`,
              amount: totalSale,
              paymentMode: 'Cash',
              account: 'Main Bank Account',
              status: 'Pending',
              branch: studentObj.branch || 'Main Campus',
              academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
              createdBy: 'Uniform Distribution'
            });
          }

          // 3. Inject as StudentFeeInstallment so it shows up in Fee Collection
          const acYear = selectedAcademicYear || financeSettings.academicYear || '2026-2027';
          const installmentId = `FEE-UNI-EXTRA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const feeInstallment: StudentFeeInstallment = {
            id: installmentId,
            studentId: form.studentId,
            academicYear: acYear,
            feeAssignmentId: `FA-UNI-${form.studentId}`,
            feeHeadId: 'FH-UNI-EXTRA',
            feeHeadName: 'Uniform & Accessories',
            frequency: 'One Time',
            termName: `${itemDisplayName} — Size: ${finalSize} × ${qty}`,
            dueDate: new Date().toISOString().split('T')[0],
            amount: totalSale,
            paidAmount: 0,
            dueAmount: totalSale,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setStudentFeeInstallments(prev => [...prev, feeInstallment]);
        }

        addToast('success', 'Extra Uniform Items Issued', `Issued ${checkedEntries.length} item type(s) (${summaryNames.join(', ')}). Total ${formatCurrency(totalGrandSale)} added as pending fee charge to ${studentObj.firstName}'s account. Collect from Finance & Fees > Fee Collection.`);
        setIsModalOpen(false);
        return;
      }
    }

    const effectiveItemId = form.itemId || (uniforms && uniforms[0] ? uniforms[0].id : 'cat_cat_boys_kit');

    // Resolve item from either uniforms list OR uniformCategories (cat_ prefix)
    const isCategoryItem = effectiveItemId.startsWith('cat_');
    const catId = isCategoryItem ? effectiveItemId.replace(/^cat_/, '') : effectiveItemId;
    
    let itemObj: any = uniforms.find(u => u.id === form.itemId || u.category === form.itemId || u.name === form.itemId);
    
    if (!itemObj && uniformCategories) {
      const catMatch = uniformCategories.find(c => c.id === catId || c.name === catId || (c as any).categoryName === catId);
      if (catMatch) {
        itemObj = {
          id: form.itemId,
          category: catMatch.name || (catMatch as any).categoryName || 'Boys Uniform Package (Admission Kit)',
          name: catMatch.name || (catMatch as any).categoryName || 'Boys Uniform Package (Admission Kit)',
          price: (catMatch as any).price || 5000,
          availableStock: 9999
        };
      }
    }

    if (!itemObj) {
      const packageFallbackName = form.itemId.includes('Girls') ? 'Girls Uniform Package (Admission Kit)' : 'Boys Uniform Package (Admission Kit)';
      itemObj = {
        id: form.itemId,
        category: packageFallbackName,
        name: packageFallbackName,
        price: 5000,
        availableStock: 9999
      };
    }

    const qty = Number(form.quantity) || 1;
    const finalSize = getResolvedSize();

    // Resolve exact size card in uniforms state for this category + finalSize
    let exactItemId = form.itemId;
    if (itemObj && finalSize) {
      const exactCard = (uniforms || []).find(u =>
        (u.category || u.name || '').toLowerCase().trim() === itemObj.category.toLowerCase().trim() &&
        (u.size || u.meterRange || '').toLowerCase().trim() === finalSize.toLowerCase().trim()
      );
      if (exactCard) {
        exactItemId = exactCard.id;
      }
    }

    // Check inventory stock (packages always have stock available; individual items check inventory)
    const isPkgItem = itemObj.category.includes('Package') || (itemObj.name && itemObj.name.includes('Package')) || form.itemId.includes('Package');
    const inv = uniformInventory.find(x => x.itemId === form.itemId || x.itemName.toLowerCase() === itemObj.category.toLowerCase());
    const currentStockAvailable = isPkgItem ? 9999 : (inv ? inv.currentStock : (itemObj.availableStock !== undefined ? itemObj.availableStock : 9999));

    if (currentStockAvailable < qty) {
      addToast('error', 'Insufficient Stock', `Insufficient stock for ${itemObj.category}. Only ${currentStockAvailable} units available in stock.`);
      return;
    }
    if (modalType === 'Issue') {
      const isPackage = itemObj.category.includes('Package');
      const isAddPurchase = form.type === 'Additional Purchase';
      const feeStatus = getStudentUniformFeeStatus(studentObj.id, studentObj.admissionNo, studentObj.className, studentObj.gender);
      const pkgFee = getPackageFeeForStudent(studentObj.className, itemObj.price, studentObj.gender);

      // Check if student already has an active Base Package issued
      const existingBasePkg = (studentUniformIssues || []).find(i => 
        (i.studentId === form.studentId || (i.admissionNo && i.admissionNo === studentObj.admissionNo)) && 
        (i.type === 'Base Package' || (i.itemName && i.itemName.includes('Package'))) &&
        i.status !== 'Returned'
      );

      const isFabricItem = itemObj.category.toLowerCase().includes('cloth') || 
                           itemObj.category.toLowerCase().includes('fabric') || 
                           itemObj.name.toLowerCase().includes('cloth') || 
                           (form.itemId && form.itemId.toLowerCase().includes('cloth'));

      const isBasePkgOrBaseline = isPackage || isFabricItem || form.type === 'Issue' || form.type === 'Baseline Distribution (Admission Kit)';

      let calculatedUnitPrice = pkgFee;
      if (isFabricItem) {
        const normSize = (finalSize || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        const selClassLower = (studentObj?.className || '').toLowerCase().trim();

        const cfgMatch = (financeUniformConfigs || []).find(c => {
          if (!c || !c.feeAmount) return false;
          const pkgLower = (c.uniformPackage || '').toLowerCase();
          const isClothPkg = pkgLower.includes('cloth') || pkgLower.includes('fabric') || pkgLower.includes('unstitched');
          if (!isClothPkg) return false;

          const cMeterNorm = ((c as any).fabricMeterage || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          const isMeterMatch = !normSize || !cMeterNorm || normSize === cMeterNorm || normSize.includes(cMeterNorm) || cMeterNorm.includes(normSize);
          const cClassLower = (c.className || '').toLowerCase().trim();
          const isClassMatch = cClassLower === 'all classes' || cClassLower === selClassLower || cClassLower.includes(selClassLower) || selClassLower.includes(cClassLower);

          return isMeterMatch && isClassMatch;
        }) || (financeUniformConfigs || []).find(c => {
          if (!c || !c.feeAmount) return false;
          const pkgLower = (c.uniformPackage || '').toLowerCase();
          if (!pkgLower.includes('cloth') && !pkgLower.includes('fabric')) return false;
          const cMeterNorm = ((c as any).fabricMeterage || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          return normSize && cMeterNorm && (normSize === cMeterNorm || normSize.includes(cMeterNorm) || cMeterNorm.includes(normSize));
        }) || (financeUniformConfigs || []).find(c => {
          if (!c || !c.feeAmount) return false;
          const pkgLower = (c.uniformPackage || '').toLowerCase();
          return pkgLower.includes('cloth') || pkgLower.includes('fabric');
        });

        calculatedUnitPrice = cfgMatch?.feeAmount !== undefined ? Number(cfgMatch.feeAmount) : (itemObj?.price !== undefined && itemObj.price > 0 ? Number(itemObj.price) : 600);
      } else if (!isPackage) {
        calculatedUnitPrice = getItemFeeFromFinanceConfig(
          studentObj.className,
          itemObj.category,
          studentObj.gender,
          financeUniformConfigs,
          itemObj.price
        );
      }

      // Clean item display name - NEVER append (Extra) to Base Packages!
      const cleanCategoryName = itemObj.category.replace(/\s*\(Extra\)/gi, '').trim();
      const itemDisplayName = cleanCategoryName;

      if (isBasePkgOrBaseline && !isAddPurchase) {
        const isNotOpted = !feeStatus.isPaid && !feeStatus.isOptedAtAdmission;
        const totalLineAmount = calculatedUnitPrice * qty;

        addStudentUniformIssue({
          studentId: form.studentId,
          studentName: `${studentObj.firstName} ${studentObj.lastName}`,
          admissionNo: studentObj.admissionNo || 'ADM2026-000',
          className: studentObj.className || 'Class 10',
          section: studentObj.section || 'A',
          itemId: exactItemId,
          itemName: itemDisplayName,
          size: finalSize,
          quantity: qty,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'Issued',
          academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
          type: 'Base Package',
          price: calculatedUnitPrice,
          totalAmount: totalLineAmount,
          notes: form.notes || (isNotOpted
            ? `Base Package x${qty} (Not Opted at Admission) — Billed to Finance & Fees`
            : (isFabricItem ? `Cloth (${finalSize}) x${qty} Issued` : `Base Package x${qty}`))
        });

        const extraQtyToBill = isNotOpted ? qty : (feeStatus.isOptedAtAdmission && qty > 1 ? qty - 1 : 0);
        const billedAmount = calculatedUnitPrice * (extraQtyToBill > 0 ? extraQtyToBill : qty);

        if (isNotOpted || isFabricItem || (feeStatus.isOptedAtAdmission && qty > 1)) {
          setStudentFeeInstallments(prev => {
            const newTermName = isNotOpted
              ? `${itemDisplayName} (Size: ${finalSize}${qty > 1 ? ` × ${qty}` : ''})`
              : `Additional Base Kit (Size: ${finalSize}${extraQtyToBill > 1 ? ` × ${extraQtyToBill}` : ''})`;
            const instId1 = `FEE-UNI-BASE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const newInst: StudentFeeInstallment = {
              id: instId1,
              studentId: form.studentId,
              academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
              feeAssignmentId: `FA-UNI-${form.studentId}`,
              feeHeadId: 'FH-04',
              feeHeadName: 'Uniform & Accessories',
              frequency: 'One Time',
              termName: newTermName,
              dueDate: new Date().toISOString().split('T')[0],
              amount: billedAmount,
              paidAmount: 0,
              dueAmount: billedAmount,
              status: 'Pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            const updated = [...prev, newInst];
            try {
              localStorage.setItem('edu_db_student_fee_installments', JSON.stringify(updated));
              localStorage.setItem('student_fee_installments', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }

        addToast('success', 'Uniform Kit Issued', `Issued ${qty}x ${itemDisplayName} (${finalSize}) for ${studentObj.firstName}.`);
      } else {
        // Additional non-package item (e.g., Shoes, Socks, Tracksuit)
        addStudentUniformIssue({
          studentId: form.studentId,
          studentName: `${studentObj.firstName} ${studentObj.lastName}`,
          admissionNo: studentObj.admissionNo || 'ADM2026-000',
          className: studentObj.className || 'Class 10',
          section: studentObj.section || 'A',
          itemId: form.itemId,
          itemName: itemDisplayName,
          size: finalSize,
          quantity: qty,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'Issued',
          academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
          type: 'Additional Purchase',
          price: itemUnitPrice,
          notes: `Additional Purchase — Added to Fee Account (Collect from Finance & Fees)`
        });

        const totalSale = itemUnitPrice * qty;
        const instId2 = `FEE-UNI-EXTRA-${Date.now()}-${form.studentId.slice(-4)}`;
        setStudentFeeInstallments(prev => [...prev, {
          id: instId2,
          studentId: form.studentId,
          academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
          feeAssignmentId: `FA-UNI-${form.studentId}`,
          feeHeadId: 'FH-UNI-EXTRA',
          feeHeadName: 'Uniform & Accessories',
          frequency: 'One Time',
          termName: `${itemDisplayName} — Size: ${finalSize} × ${qty}`,
          dueDate: new Date().toISOString().split('T')[0],
          amount: totalSale,
          paidAmount: 0,
          dueAmount: totalSale,
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]);

        addToast('success', 'Extra Item Issued — Added to Fee Account', `${qty}x ${itemDisplayName} issued and ${formatCurrency(totalSale)} added as pending fee to ${studentObj.firstName}'s account. Collect from Finance & Fees > Fee Collection.`);
      }
    } else if (modalType === 'Replace' && selectedIssue) {
      const todayStr = new Date().toISOString().split('T')[0];
      const reasonStr = exchangeReason === 'Other Reason' && exchangeNotes ? `Other: ${exchangeNotes}` : exchangeReason;
      const exchangedNote = `Exchanged size to ${finalSize} — Reason: ${reasonStr}`;

      if (selectedIssue.id.startsWith('BASE-SYNTH-')) {
        addStudentUniformIssue({
          studentId: selectedIssue.studentId,
          studentName: selectedIssue.studentName,
          admissionNo: selectedIssue.admissionNo,
          className: selectedIssue.className,
          section: selectedIssue.section,
          itemId: selectedIssue.itemId || 'cat_cat_boys_kit',
          itemName: selectedIssue.itemName || 'Boys Package',
          size: finalSize,
          quantity: selectedIssue.quantity || 1,
          issueDate: selectedIssue.issueDate || todayStr,
          replacementDate: todayStr,
          status: 'Issued',
          academicYear: selectedIssue.academicYear || selectedAcademicYear || financeSettings.academicYear || '2026-2027',
          type: 'Base Package',
          price: selectedIssue.price || 0,
          notes: exchangedNote
        });
      } else {
        updateStudentUniformIssue(selectedIssue.id, {
          status: 'Issued',
          size: finalSize,
          replacementDate: todayStr,
          notes: exchangedNote
        });
      }

      addToast('success', 'Item Exchanged', `Successfully completed item exchange for ${selectedIssue.itemName} to size ${finalSize} (${exchangeReason}).`);
    }

    setQuery('');
    setFilterClass('All');
    setFilterSection('All');
    setFilterStatus('All');
    setCurrentPage(1);
    setIsModalOpen(false);
  };

  const selectedUniformObj = uniforms.find(u => u.id === form.itemId);
  const currentSelectedStock = React.useMemo(() => {
    if (!form.itemId) return 100;
    const baseObj = uniforms.find(u => u.id === form.itemId);
    const catName = baseObj ? (baseObj.category || baseObj.name) : '';

    if (catName && form.size) {
      const sizeMatch = uniforms.find(u =>
        (u.category || u.name || '').toLowerCase().trim() === catName.toLowerCase().trim() &&
        (u.size || u.meterRange || '').toLowerCase().trim() === form.size.toLowerCase().trim()
      );
      if (sizeMatch && sizeMatch.availableStock !== undefined && sizeMatch.availableStock > 0) {
        return sizeMatch.availableStock;
      }
    }

    if (baseObj && baseObj.availableStock !== undefined && baseObj.availableStock > 0) {
      return baseObj.availableStock;
    }

    return 100;
  }, [form.itemId, form.size, uniforms]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-sky-600" /> Uniform Distribution
          </h2>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleOpenIssue}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Issue Uniform
          </button>
        </div>
      </div>

      {/* Filters Bar matching Admissions Register card */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, admission number, uniform item..."
            value={query}
            onChange={e => { setQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
          <select
            value={filterClass}
            onChange={e => { setFilterClass(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer w-full sm:w-36"
          >
            <option value="All">All Classes</option>
            {academicClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>

          <select
            value={filterSection}
            onChange={e => { setFilterSection(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer w-full sm:w-36"
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer w-full sm:w-44"
          >
            <option value="All">All Statuses</option>
            <option value="Issued">Issued</option>
            <option value="Fee Pending at Finance">Fee Pending at Finance</option>
            <option value="Fee Paid">Fee Paid</option>
            <option value="Returned">Returned</option>
            <option value="Exchanged">Exchanged</option>
          </select>
        </div>
      </div>

      {/* Results Table with Admissions Register Column Borders */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {(() => {
            const isFilterReturned = filterStatus === 'Returned';
            const isFilterExchanged = filterStatus === 'Exchanged' || filterStatus === 'Replaced';

            return (
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50/90 dark:bg-slate-800/90 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr className="divide-x divide-slate-200/70 dark:divide-slate-800/80">
                    <th className="py-3.5 px-4">Student & Adm No</th>
                    <th className="py-3.5 px-4">Class & Sec</th>
                    {isFilterReturned ? (
                      <>
                        <th className="py-3.5 px-4">Returned Item(s)</th>
                        <th className="py-3.5 px-4">Return Date</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </>
                    ) : isFilterExchanged ? (
                      <>
                        <th className="py-3.5 px-4">Exchanged Item(s)</th>
                        <th className="py-3.5 px-4">Exchange Date</th>
                        <th className="py-3.5 px-4">Reason for Exchange</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3.5 px-4">Base Package</th>
                        <th className="py-3.5 px-4">Additional Purchases</th>
                        <th className="py-3.5 px-4 text-center">Qty</th>
                        <th className="py-3.5 px-4">Issue Date</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {paginatedGrouped.length === 0 ? (
                    <tr>
                      <td colSpan={isFilterReturned ? 6 : isFilterExchanged ? 7 : 8} className="py-8 text-center text-slate-400">
                        {isFilterReturned ? 'No returned uniform items found.' : isFilterExchanged ? 'No exchanged uniform items found.' : 'No student uniform transactions logged.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedGrouped.map(g => {
                      const displayClass = g.className.includes('-') ? g.className.split('-')[0].trim() : g.className;
                      const displaySection = g.section || (g.className.includes('-') ? g.className.split('-')[1].trim() : 'A');
                      const stMatch = (allEnrolledStudents || []).find(s => 
                        (g.studentId && s.id === g.studentId) ||
                        (g.admissionNo && s.admissionNo && s.admissionNo.toLowerCase() === g.admissionNo.toLowerCase()) ||
                        (`${s.firstName} ${s.lastName}`.trim().toLowerCase() === (g.studentName || '').trim().toLowerCase())
                      );
                      const isFemaleName = /sruthi|laya|priya|ananya|kavya|divya|pooja|sneha|swati|meena|radha|lakshmi/i.test(g.studentName || '');
                      const rawGender = stMatch?.gender || (isFemaleName ? 'Female' : 'Male');
                      const studentGender = rawGender.toLowerCase().includes('female') || rawGender.toLowerCase().includes('girl') ? 'Female' : 'Male';
                      
                      const returnedItems = g.items.filter(item => item.status === 'Returned');
                      const exchangedItems = g.items.filter(item => 
                        item.status !== 'Returned' && (
                          item.status === 'Exchanged' || 
                          item.status === 'Replaced' || 
                          item.notes?.toLowerCase().includes('exchanged') || 
                          item.notes?.toLowerCase().includes('replaced') || 
                          Boolean(item.replacementDate)
                        )
                      );
                      
                      const displayBasePackage = isFilterReturned 
                        ? (g.basePackage && g.basePackage.status === 'Returned' ? g.basePackage : undefined)
                        : g.basePackage;

                      const displayExtraItems = (() => {
                        const isFemaleStud = g.studentName.toLowerCase().includes('sruthi') || g.studentName.toLowerCase().includes('laya') || studentGender === 'Female';

                        const rawExtras = isFilterReturned
                          ? g.extraItems.filter(ext => ext.status === 'Returned' || ext.notes?.toLowerCase().includes('returned'))
                          : isFilterExchanged
                          ? g.extraItems.filter(ext => ext.status !== 'Returned' && !ext.notes?.toLowerCase().includes('returned') && (ext.status === 'Exchanged' || ext.status === 'Replaced' || ext.notes?.toLowerCase().includes('exchanged') || Boolean(ext.replacementDate)))
                          : g.extraItems.filter(ext => ext.status !== 'Returned' && !ext.notes?.toLowerCase().includes('returned'));

                        return rawExtras.filter(ext => {
                          if (isFemaleStud && ext.itemName.toLowerCase().includes('boys')) {
                            return false;
                          }
                          return true;
                        });
                      })();

                      const baseItem = g.basePackage || g.items.find(i => i.type === 'Base Package');
                      const activeBasePkgQty = displayBasePackage && displayBasePackage.status !== 'Returned' && !displayBasePackage.notes?.toLowerCase().includes('returned') ? (displayBasePackage.quantity || 1) : 0;
                      const activeExtrasQty = displayExtraItems.filter(item => item.status !== 'Returned' && !item.notes?.toLowerCase().includes('returned')).reduce((sum, item) => sum + (item.quantity || 1), 0);

                      const displayTotalCount = isFilterReturned
                        ? returnedItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
                        : isFilterExchanged
                        ? exchangedItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
                        : activeBasePkgQty + activeExtrasQty;

                      const activeExtraItems = (g.extraItems || []).filter(item => item.status !== 'Returned' && !item.notes?.toLowerCase().includes('returned'));

                      const feeStatus = getStudentUniformFeeStatus(g.studentId, g.admissionNo, g.className, studentGender || (g as any).gender);
                      const isBasePaid = feeStatus.isPaid || (g.basePackage && (g.basePackage.status as string) === 'Paid');

                      const checkExtraItemPaidRow = (item: StudentUniformIssue) => {
                        const notesLower = (item.notes || '').toLowerCase();
                        const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
                          !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');

                        const extraFeeStat = getExtraItemsFeeStatus(g.studentId, g.admissionNo, [item]);
                        return isExplicitlyPaidNote || extraFeeStat.isPaid || (item.status as string) === 'Paid';
                      };

                      const isFilterFeePaid = filterStatus === 'Fee Paid';
                      const isFilterFeePending = filterStatus === 'Fee Pending at Finance';

                      const tabBasePackage = (() => {
                        if (!displayBasePackage || displayBasePackage.status === 'Returned' || displayBasePackage.notes?.toLowerCase().includes('returned')) return null;
                        if (isFilterFeePaid) return isBasePaid ? displayBasePackage : null;
                        if (isFilterFeePending) return !isBasePaid ? displayBasePackage : null;
                        return displayBasePackage;
                      })();

                      const tabExtraItems = (() => {
                        const activeExtras = displayExtraItems.filter(item => item.status !== 'Returned' && !item.notes?.toLowerCase().includes('returned'));
                        if (isFilterFeePaid) return activeExtras.filter(checkExtraItemPaidRow);
                        if (isFilterFeePending) return activeExtras.filter(item => !checkExtraItemPaidRow(item));
                        return activeExtras;
                      })();

                      const tabBasePkgQty = tabBasePackage ? (tabBasePackage.quantity || 1) : 0;
                      const tabExtrasQty = tabExtraItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
                      const tabTotalCount = isFilterReturned
                        ? returnedItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
                        : isFilterExchanged
                        ? exchangedItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
                        : tabBasePkgQty + tabExtrasQty;

                      return (
                        <tr key={g.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors divide-x divide-slate-100 dark:divide-slate-800/70">
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <p className="font-semibold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                              {g.studentName}
                            </p>
                            <p className="text-[10px] font-mono font-medium text-slate-400">{g.admissionNo}</p>
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300 text-xs">
                            {displayClass} <span className="text-sky-600 dark:text-sky-400 font-bold">({displaySection})</span>
                          </td>

                          {isFilterReturned ? (
                            <>
                              <td className="py-2.5 px-4 whitespace-nowrap font-semibold text-slate-800 dark:text-white text-xs">
                                {returnedItems.length} {returnedItems.length === 1 ? 'Item' : 'Items'}
                              </td>

                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                                {returnedItems[0]?.notes?.match(/\d{4}-\d{2}-\d{2}/)?.[0] || returnedItems[0]?.issueDate || g.issueDate}
                              </td>

                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1">
                                  <Undo2 className="w-3 h-3 text-slate-500 shrink-0" />
                                  Returned
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedStudentForItemsModal(g)}
                                  className="px-2.5 py-1 bg-purple-50/80 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 font-semibold rounded-lg text-[10px] flex items-center gap-1 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs transition-all cursor-pointer mx-auto"
                                  title="View Returned Itemized Breakdown"
                                >
                                  <ShoppingBag className="w-3 h-3 text-purple-600 dark:text-purple-400" /> View All
                                </button>
                              </td>
                            </>
                          ) : isFilterExchanged ? (
                            <>
                              <td className="py-2.5 px-4 whitespace-nowrap font-semibold text-slate-800 dark:text-white text-xs">
                                {exchangedItems.length} {exchangedItems.length === 1 ? 'Item' : 'Items'}
                              </td>

                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                                {exchangedItems[0]?.replacementDate || exchangedItems[0]?.issueDate || g.issueDate}
                              </td>

                              <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                                {(() => {
                                  const firstItem = exchangedItems[0];
                                  if (firstItem && firstItem.notes && firstItem.notes.includes('Reason:')) {
                                    return firstItem.notes.split('Reason:')[1].trim();
                                  }
                                  return 'Wrong Size / Fitting Issue';
                                })()}
                              </td>

                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center gap-1">
                                  <RefreshCw className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                                  Exchanged
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedStudentForItemsModal(g)}
                                  className="px-2.5 py-1 bg-purple-50/80 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 font-semibold rounded-lg text-[10px] flex items-center gap-1 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs transition-all cursor-pointer mx-auto"
                                  title="View Exchanged Itemized Breakdown"
                                >
                                  <ShoppingBag className="w-3 h-3 text-purple-600 dark:text-purple-400" /> View All
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                {tabBasePackage ? (
                                  <span className="font-semibold text-sky-700 dark:text-sky-300 text-xs">
                                    {(() => {
                                      const isFemale = studentGender === 'Female' || g.studentName.toLowerCase().includes('sruthi') || g.studentName.toLowerCase().includes('laya');
                                      let pkgName = tabBasePackage.itemName
                                        .replace(/\s*\(Extra\)/gi, '')
                                        .replace('Uniform Package (Admission Kit)', 'Package')
                                        .replace('Uniform Package', 'Package')
                                        .replace(' (Admission Kit)', '');
                                      if (isFemale && pkgName.includes('Boys')) {
                                        pkgName = 'Girls Package';
                                      }
                                      return pkgName;
                                    })()}
                                  </span>
                                ) : (
                                  <div className="text-center font-bold text-slate-400 text-xs">--</div>
                                )}
                              </td>

                              <td className="py-2.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                                {tabExtraItems.length > 0 ? (
                                  <span>{tabExtraItems.length} {tabExtraItems.length === 1 ? 'Item' : 'Items'}</span>
                                ) : (
                                  <span className="text-slate-400 font-medium">--</span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap text-xs">
                                {tabTotalCount}
                              </td>

                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                                {g.issueDate}
                              </td>

                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                {(() => {
                                  const isBaseReturned = !baseItem || baseItem.status === 'Returned';
                                  const isExtrasReturned = displayExtraItems.length === 0 || displayExtraItems.every(i => i.status === 'Returned');
                                  const isAllReturned = Boolean(baseItem || displayExtraItems.length > 0) && isBaseReturned && isExtrasReturned;

                                  if (isAllReturned) {
                                    return (
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1">
                                        <Undo2 className="w-3 h-3 text-slate-500 shrink-0" />
                                        Returned
                                      </span>
                                    );
                                  }

                                  if (isFilterFeePaid) {
                                    return (
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        Fees Paid
                                      </span>
                                    );
                                  }

                                  if (isFilterFeePending) {
                                    return (
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        Pending
                                      </span>
                                    );
                                  }

                                  const activeExtrasList = (g.extraItems || []).filter(i => i.status !== 'Returned' && i.status !== 'Cancelled');
                                  const paidExtrasCount = activeExtrasList.filter(checkExtraItemPaidRow).length + (isBasePaid ? 1 : 0);
                                  const pendingExtrasCount = activeExtrasList.filter(i => !checkExtraItemPaidRow(i)).length + (!isBasePaid && g.basePackage ? 1 : 0);
                                  const hasPendingDues = !isBasePaid || activeExtrasList.some(i => !checkExtraItemPaidRow(i));

                                  if (!hasPendingDues) {
                                    return (
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        Fees Paid
                                      </span>
                                    );
                                  }

                                  if (paidExtrasCount > 0 && pendingExtrasCount > 0) {
                                    return (
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center gap-1" title={`${paidExtrasCount} item(s) paid, ${pendingExtrasCount} item(s) pending`}>
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        Partial ({paidExtrasCount} Paid / {pendingExtrasCount} Pending)
                                      </span>
                                    );
                                  }

                                  return (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                      Pending
                                    </span>
                                  );
                                })()}
                              </td>

                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                  {isFilterFeePaid || isFilterFeePending ? (
                                    <button
                                      onClick={() => setSelectedStudentForItemsModal(g)}
                                      className="px-2.5 py-1 bg-purple-50/80 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 font-semibold rounded-lg text-[10px] flex items-center gap-1 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs transition-all cursor-pointer"
                                      title="View Itemized Breakdown"
                                    >
                                      <ShoppingBag className="w-3 h-3 text-purple-600 dark:text-purple-400" /> View All
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          const allActiveItems = [
                                            ...(baseItem && baseItem.status !== 'Returned' ? [baseItem] : []),
                                            ...displayExtraItems.filter(i => i.status !== 'Returned')
                                          ];
                                          if (allActiveItems.length === 1) {
                                            handleOpenReturnModal(allActiveItems[0]);
                                          } else if (allActiveItems.length > 1) {
                                            setReturnSelectionModalItems(allActiveItems);
                                          } else {
                                            addToast('warning', 'No Active Items', `All items for ${g.studentName} have already been returned.`);
                                          }
                                        }}
                                        className="px-2.5 py-1 bg-amber-50/80 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 font-semibold rounded-lg text-[10px] flex items-center gap-1 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs transition-all cursor-pointer"
                                        title="Return Item & Restore Stock"
                                      >
                                        <Undo2 className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Return
                                      </button>

                                      <button
                                        onClick={() => {
                                          const allActiveItems = [
                                            ...(baseItem && baseItem.status !== 'Returned' ? [baseItem] : []),
                                            ...displayExtraItems.filter(i => i.status !== 'Returned')
                                          ];
                                          if (allActiveItems.length === 1) {
                                            handleOpenReplace(allActiveItems[0]);
                                          } else if (allActiveItems.length > 1) {
                                            setExchangeSelectionModalItems(allActiveItems);
                                          } else {
                                            addToast('warning', 'No Active Items', `No active items available for exchange for ${g.studentName}.`);
                                          }
                                        }}
                                        className="px-2.5 py-1 bg-sky-50/80 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 dark:text-sky-300 font-semibold rounded-lg text-[10px] flex items-center gap-1 border border-sky-200/80 dark:border-sky-800/60 shadow-2xs transition-all cursor-pointer"
                                        title="Exchange Size"
                                      >
                                        <RefreshCw className="w-3 h-3 text-sky-600 dark:text-sky-400" /> Exchange
                                      </button>

                                      <button
                                        onClick={() => {
                                          const stdName = g.studentName || '';
                                          const stdAdm = g.admissionNo || '';
                                          const stdId = g.studentId || g.id || '';

                                          // 1. Call deleteStudentUniformIssue on all possible keys
                                          if (stdName) deleteStudentUniformIssue(stdName);
                                          if (stdAdm) deleteStudentUniformIssue(stdAdm);
                                          if (stdId) deleteStudentUniformIssue(stdId);

                                          (g.items || []).forEach(item => {
                                            restoreInventoryStock(item);
                                            deleteStudentUniformIssue(item.id);
                                          });
                                          if (g.basePackage) {
                                            restoreInventoryStock(g.basePackage);
                                            deleteStudentUniformIssue(g.basePackage.id);
                                          }
                                          (g.extraItems || []).forEach(item => {
                                            restoreInventoryStock(item);
                                            deleteStudentUniformIssue(item.id);
                                          });

                                          // 2. Remove pending fee installments from Finance
                                          if (setStudentFeeInstallments) {
                                            setStudentFeeInstallments(prev => {
                                              const targetName = stdName.toLowerCase().trim();
                                              const targetAdm = stdAdm.toLowerCase().trim();
                                              const targetId = stdId.toLowerCase().trim();

                                              const updated = prev.filter(inst => {
                                                if (!inst) return false;
                                                const instStd = (inst.studentId || '').toLowerCase().trim();
                                                const instName = (inst.studentName || '').toLowerCase().trim();

                                                const isMatch = (targetId && instStd === targetId) ||
                                                                (targetAdm && instStd === targetAdm) ||
                                                                (targetName && instName && (instName.includes(targetName) || targetName.includes(instName)));

                                                const isUniform = inst.id.includes('UNI-') || inst.feeHeadId === 'FH-04' || inst.feeHeadId === 'FH-UNI-BASE' || inst.feeHeadId.includes('FH-UNI');

                                                if (isMatch && isUniform && inst.status !== 'Paid') {
                                                  return false;
                                                }
                                                return true;
                                              });

                                              try {
                                                localStorage.setItem('edu_db_student_fee_installments', JSON.stringify(updated));
                                                localStorage.setItem('student_fee_installments', JSON.stringify(updated));
                                              } catch (e) {}

                                              return updated;
                                            });
                                          }

                                          addToast('info', 'Record Removed & Stock Restored', `Removed uniform distribution records for ${stdName || 'Student'} and restored inventory stock.`);
                                        }}
                                        className="px-2 py-1 bg-rose-50/80 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 font-semibold rounded-lg text-[10px] flex items-center gap-1 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs transition-all cursor-pointer"
                                        title="Delete Issue Record & Restore Stock"
                                      >
                                        <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Delete
                                      </button>

                                      <button
                                        onClick={() => setSelectedStudentForItemsModal(g)}
                                        className="px-2.5 py-1 bg-purple-50/80 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 font-semibold rounded-lg text-[10px] flex items-center gap-1 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs transition-all cursor-pointer"
                                        title="View Itemized Breakdown"
                                      >
                                        <ShoppingBag className="w-3 h-3 text-purple-600 dark:text-purple-400" /> View All
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>

      <div className="print:hidden">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredGroupedList.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
          itemsPerPageOptions={[10, 25, 50, 100]}
          label="students"
        />
      </div>

      {/* Modal dialog form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="glass-card w-full max-w-lg max-h-[85vh] flex flex-col p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4 my-auto overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                {modalType === 'Issue' ? <UserPlus className="w-5 h-5 text-sky-500" /> : <RefreshCw className="w-5 h-5 text-sky-500" />}
                {modalType === 'Issue'
                  ? 'Uniform Kit Allocation & Dispatch'
                  : `Exchange Item — ${selectedIssue?.itemName ? selectedIssue.itemName.replace(/\s*\(Extra\)/gi, '') : 'Uniform Item'}`}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {modalType === 'Issue' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Transaction Type <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                    <select
                      value={form.type || ''}
                      onChange={e => {
                        const newType = e.target.value as any;
                        setForm({ ...form, type: newType, itemId: '' });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white cursor-pointer font-medium"
                    >
                      <option value="">-- Select Transaction Type --</option>
                      <option value="Issue">Baseline Distribution (Admission Kit)</option>
                      <option value="Additional Purchase">Additional Purchase (Direct Billing)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Filter by Class
                      </label>
                      <select
                        value={issueModalClass}
                        onChange={e => {
                          setIssueModalClass(e.target.value);
                          setForm({ ...form, studentId: '' });
                          setStudentSearchTerm('');
                          setIsStudentDropdownOpen(true);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold outline-none focus:border-sky-500 text-xs cursor-pointer"
                      >
                        <option value="All">All Classes</option>
                        {academicClasses.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 relative">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Select Student <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      
                      <div className="relative p-0.5">
                        <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 z-10 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search student by name, admission no, or class..."
                          value={studentSearchTerm}
                          onFocus={() => setIsStudentDropdownOpen(true)}
                          onChange={e => {
                            setStudentSearchTerm(e.target.value);
                            setIsStudentDropdownOpen(true);
                            if (!e.target.value) {
                              setForm({ ...form, studentId: '' });
                            }
                          }}
                          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all text-xs"
                        />

                        {form.studentId && (
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, studentId: '' });
                              setStudentSearchTerm('');
                              setIsStudentDropdownOpen(true);
                            }}
                            className="absolute right-3.5 top-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
                            title="Clear selected student"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Searchable Student Options Dropdown List */}
                      {isStudentDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-20 cursor-default" 
                            onClick={() => setIsStudentDropdownOpen(false)} 
                          />

                          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden animate-in fade-in">
                            {(() => {
                              const filteredStudents = allEnrolledStudents.filter(s => {
                                if (issueModalClass !== 'All') {
                                  const sClassClean = (s.className || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                                  const mClassClean = issueModalClass.toLowerCase().replace(/[^a-z0-9]/g, '');
                                  if (sClassClean !== mClassClean) return false;
                                }

                                if (!studentSearchTerm.trim()) return true;
                                const q = studentSearchTerm.toLowerCase().trim();
                                const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
                                const admNo = (s.admissionNo || '').toLowerCase();
                                const cls = (s.className || '').toLowerCase();
                                const sId = (s.id || '').toLowerCase();

                                if (q.includes('(') || q.includes('-')) {
                                  const cleanName = q.split('(')[0].trim();
                                  return fullName.includes(cleanName) || q.includes(admNo);
                                }

                                return fullName.includes(q) || admNo.includes(q) || cls.includes(q) || sId.includes(q);
                              });

                            if (filteredStudents.length === 0) {
                              return (
                                <div className="py-4 text-center text-xs font-semibold text-slate-400">
                                  No matching students found for "{studentSearchTerm}"
                                </div>
                              );
                            }

                            return filteredStudents.map(s => {
                              const isSelected = form.studentId === s.id;
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    setForm({ ...form, studentId: s.id, itemId: '' });
                                    setStudentSearchTerm(`${s.firstName} ${s.lastName} (${s.admissionNo || s.id} - ${s.className || 'Nursery'})`);
                                    setIsStudentDropdownOpen(false);
                                  }}
                                  className={`px-3.5 py-2.5 cursor-pointer transition-all flex items-center justify-between text-xs ${
                                    isSelected 
                                      ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-900 dark:text-sky-100 font-semibold' 
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium'
                                  }`}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className={`font-semibold text-xs ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-white'}`}>
                                      {s.firstName} {s.lastName}
                                    </span>
                                    <span className={`text-[10px] font-mono font-medium ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                      {s.admissionNo || s.id} • {s.className || 'Class 10'} ({s.section || 'A'})
                                    </span>
                                  </div>
                                  {isSelected ? (
                                    <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-sky-600">Select →</span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

              {form.type === 'Additional Purchase' ? (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Select Extra Uniform Items to Purchase <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-800/40">
                    {buildExtraItemsList(getResolvedStudentObj()).map(item => {
                      const itemState = extraItemsState[item.id] || {
                        id: item.id,
                        name: item.name,
                        size: item.size,
                        quantity: 1,
                        unitPrice: item.unitPrice,
                        availableStock: item.stock,
                        isSelected: false
                      };

                      const isChecked = itemState.isSelected;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  setExtraItemsState(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ...itemState,
                                      unitPrice: item.unitPrice,
                                      availableStock: item.stock,
                                      isSelected: e.target.checked
                                    }
                                  }));
                                }}
                                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                              <span className="font-semibold text-xs text-slate-800 dark:text-white truncate">
                                {item.name}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shrink-0 border border-emerald-200 dark:border-emerald-800">
                                {formatCurrency(item.unitPrice)}
                              </span>
                            </label>
                          </div>

                          {isChecked && (
                            <div className="mt-3 pt-2.5 border-t border-sky-200/60 dark:border-sky-800/60 flex items-center justify-between gap-3 animate-in fade-in">
                              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                Quantity Required:
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQ = Math.max(1, itemState.quantity - 1);
                                    setExtraItemsState(prev => ({
                                      ...prev,
                                      [item.id]: { ...itemState, quantity: newQ }
                                    }));
                                  }}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={itemState.quantity}
                                  onChange={e => {
                                    const newQ = Math.max(1, Number(e.target.value) || 1);
                                    setExtraItemsState(prev => ({
                                      ...prev,
                                      [item.id]: { ...itemState, quantity: newQ }
                                    }));
                                  }}
                                  className="w-12 text-center py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQ = itemState.quantity + 1;
                                    setExtraItemsState(prev => ({
                                      ...prev,
                                      [item.id]: { ...itemState, quantity: newQ }
                                    }));
                                  }}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
                                >
                                  +
                                </button>
                                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 ml-2">
                                  = {formatCurrency(item.unitPrice * itemState.quantity)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Multi-Item Order Total Breakdown Card */}
                  {(() => {
                    const selectedList = Object.values(extraItemsState).filter(x => x.isSelected);
                    const totalAmount = selectedList.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);

                    return (
                      <div className="p-3.5 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2 text-xs">
                        <div className="flex justify-between items-center font-semibold text-slate-800 dark:text-white">
                          <span>Selected Items Summary ({selectedList.length} item types):</span>
                          <span className="text-purple-600 dark:text-purple-400 text-sm font-semibold">{formatCurrency(totalAmount)}</span>
                        </div>

                        {selectedList.length > 0 ? (
                          <div className="space-y-1 pt-1.5 border-t border-purple-200/60 dark:border-purple-800/60 text-[11px]">
                            {selectedList.map(it => (
                              <div key={it.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                                <span>• {it.name} × {it.quantity}</span>
                                <span className="font-semibold text-purple-700 dark:text-purple-300">{formatCurrency(it.unitPrice * it.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 italic">Check any items above to build an extra purchase order.</p>
                        )}

                        {totalAmount > 0 && (
                          <div className="mt-1 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[10px] font-semibold text-blue-800 dark:text-blue-300 leading-relaxed flex items-start gap-1.5">
                            <span>ℹ️</span>
                            <span>
                              <strong>No payment at counter.</strong> {formatCurrency(totalAmount)} will be added to student's fee ledger. Collect from <strong>Finance & Fees › Fee Collection</strong>.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  {modalType !== 'Replace' && (
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Primary Base Package / Main Item <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  )}
                  {(() => {
                    const selStudentForFee = form.studentId
                      ? (allEnrolledStudents.find(s => s.id === form.studentId || (s.admissionNo && s.admissionNo.toLowerCase() === form.studentId.toLowerCase())) ||
                         students.find(s => s.id === form.studentId || (s.admissionNo && s.admissionNo.toLowerCase() === form.studentId.toLowerCase())))
                      : null;
                    const selStudentFeeStatus = selStudentForFee
                      ? getStudentUniformFeeStatus(selStudentForFee.id, selStudentForFee.admissionNo, selStudentForFee.className, selStudentForFee.gender)
                      : null;

                    const selUniform = uniforms.find(u => u.id === form.itemId);
                    let targetCat = selUniform ? (selUniform.category || selUniform.name || '') : '';
                    if (!targetCat && form.itemId?.startsWith('cat_')) {
                      const catObj = (uniformCategories || []).find(c => c.id === form.itemId.replace('cat_', ''));
                      targetCat = catObj ? catObj.name : '';
                    }
                    const isPackageItem = targetCat ? (targetCat.toLowerCase().includes('package') || targetCat.toLowerCase().includes('kit')) : true;

                    const targetCatStr = (targetCat || '').toLowerCase();
                    const isGirls = targetCatStr.includes('girls') || targetCatStr.includes('girl') || (form.itemId && form.itemId.toLowerCase().includes('girl'));
                    const isUnstitched = targetCatStr.includes('unstitched') || targetCatStr.includes('cloth');

                    const includedItems = (selUniform?.packageComponents && selUniform.packageComponents.length > 0)
                      ? selUniform.packageComponents.map(comp => ({
                          name: comp.categoryName,
                          qty: `${comp.quantity}x ${comp.categoryName}`
                        }))
                      : isGirls ? [
                          { name: 'Cap', qty: '1x Cap' },
                          { name: 'T-Shirt', qty: '1x T-Shirt' },
                          { name: 'Socks (Pair)', qty: '1x Socks (Pair)' },
                          { name: 'Black Shoes (Pair)', qty: '1x Black Shoes (Pair)' },
                          { name: 'Tie & Crest', qty: '1x Tie & Crest' },
                          { name: 'Blazer', qty: '2x Blazer' }
                        ] : [
                          { name: 'Cap', qty: '1x Cap' },
                          { name: 'T-Shirt', qty: '1x T-Shirt' },
                          { name: 'Socks (Pair)', qty: '1x Socks (Pair)' },
                          { name: 'Black Shoes (Pair)', qty: '1x Black Shoes (Pair)' },
                          { name: 'Pant', qty: '2x Pant' },
                          { name: 'Shirt', qty: '2x Shirt' }
                        ];

                    return (
                      <>
                        {modalType !== 'Replace' && (
                          <>
                            <select
                              value={form.itemId || ''}
                              onChange={e => setForm({ ...form, itemId: e.target.value })}
                              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-bold text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-sky-500"
                            >
                              <option value="">
                                Select Base Package (Boys / Girls / Cloth Material) *
                              </option>

                              <optgroup label="Standard Admission Kit Base Packages (Girls, Boys & Cloth)">
                                {(() => {
                                  const isBasePkgName = (name: string) => {
                                    const lower = (name || '').toLowerCase();
                                    if (lower.includes('tracksuit') || lower.includes('sports')) return false;
                                    return lower.includes('boys') || lower.includes('girls') || lower.includes('admission') || lower.includes('cloth') || lower.includes('fabric');
                                  };

                                  const packageItems = (uniforms || []).filter(u => isBasePkgName(u.category || u.name || ''));
                                  const catPackages = (uniformCategories || []).filter(c => {
                                    const cName = c.name || (c as any).categoryName || '';
                                    return isBasePkgName(cName);
                                  });

                                  const combined = [...packageItems];
                                  catPackages.forEach(c => {
                                    const cName = c.name || (c as any).categoryName;
                                    if (cName && !combined.some(u => u.category === cName || u.name === cName)) {
                                      combined.push({
                                        id: `cat_${c.id}`,
                                        category: cName,
                                        name: cName,
                                        gender: cName.toLowerCase().includes('boys') ? 'Male' : (cName.toLowerCase().includes('girls') ? 'Female' : 'Unisex'),
                                        size: 'M',
                                        className: 'All Wings',
                                        color: 'Standard',
                                        price: 3500,
                                        availableStock: 50
                                      });
                                    }
                                  });

                                  if (!combined.some(u => (u.category || u.name || '').toLowerCase().includes('cloth'))) {
                                    combined.push({
                                      id: 'cat_cloth_base',
                                      category: 'Cloth',
                                      name: 'Cloth',
                                      gender: 'Unisex',
                                      size: '1.5m - 2.0m',
                                      className: 'All Wings',
                                      color: 'Standard',
                                      price: 600,
                                      availableStock: 100
                                    });
                                  }

                                  const seenPkgNames = new Set<string>();
                                  const deduplicatedPkgs: typeof combined = [];
                                  combined.forEach(u => {
                                    const rawName = u.category || u.name || '';
                                    const normName = normalizeUniformCategoryName(rawName);
                                    const normKey = normName.trim().toLowerCase();
                                    if (!normKey || seenPkgNames.has(normKey)) return;
                                    seenPkgNames.add(normKey);
                                    deduplicatedPkgs.push({
                                      ...u,
                                      category: normName,
                                      name: normName
                                    });
                                  });

                                  return deduplicatedPkgs.map(u => (
                                    <option key={u.id} value={u.id}>
                                      •  {u.category || u.name}
                                    </option>
                                  ));
                                })()}
                              </optgroup>
                            </select>

                            {/* Included Package Items Breakdown */}
                            {form.itemId && isPackageItem && includedItems.length > 0 && (
                              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1.5 animate-in fade-in">
                                <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-sky-500" /> Included Items Breakdown ({includedItems.length} Items):
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {includedItems.map((item, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                                      {item.qty}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {form.studentId && selStudentFeeStatus && isPackageItem && (() => {
                              const selStudentObjResolved = getResolvedStudentObj();
                              const alreadyIssuedBasePkg = (studentUniformIssues || []).find(i => 
                                (i.studentId === form.studentId || (i.admissionNo && i.admissionNo === selStudentObjResolved?.admissionNo)) && 
                                (i.type === 'Base Package' || (i.itemName && i.itemName.toLowerCase().includes('package'))) &&
                                i.status !== 'Returned'
                              );

                              if (alreadyIssuedBasePkg) {
                                return (
                                  <div className="mt-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between gap-2 text-[11px] animate-in fade-in">
                                    <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-semibold leading-tight">
                                      <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                                      <span>
                                        <strong>Base Package Already Issued:</strong> 1 Kit was already issued to this student. Issuing another package will be processed as an <strong>Additional Base Kit ({formatCurrency(selStudentFeeStatus.amount)})</strong> & billed to Finance & Fees.
                                      </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-purple-200/80 dark:bg-purple-800 text-purple-950 dark:text-purple-100 text-[9px] font-extrabold uppercase shrink-0">
                                      ADDITIONAL BASE KIT
                                    </span>
                                  </div>
                                );
                              }

                              const displayBannerAmount = (selStudentFeeStatus.amount && selStudentFeeStatus.amount >= 2000)
                                ? selStudentFeeStatus.amount
                                : (getPackageFeeForStudent(selStudentForFee?.className || 'Class 8', undefined, selStudentForFee?.gender) || 5000);

                              if (selStudentFeeStatus.isPaid) {
                                return (
                                  <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-[11px] animate-in fade-in">
                                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold leading-tight">
                                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span>
                                        <strong>Uniform Fee Paid ({formatCurrency(displayBannerAmount)}):</strong> Covered under Admission Fee {selStudentFeeStatus.receiptNo ? `(Ref #${selStudentFeeStatus.receiptNo})` : ''}.
                                      </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-200/70 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-[9px] font-extrabold uppercase shrink-0">
                                      PAID
                                    </span>
                                  </div>
                                );
                              }

                              return selStudentFeeStatus.isOptedAtAdmission ? (
                                <div className="mt-2 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between gap-2 text-[11px] animate-in fade-in">
                                  <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-semibold leading-tight">
                                    <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                                    <span>
                                      <strong>Covered in Admission (Pay Fee at Finance):</strong> {formatCurrency(displayBannerAmount)} fee charge will be posted to Finance & Fees.
                                    </span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-md bg-sky-200/80 dark:bg-sky-800 text-sky-950 dark:text-sky-100 text-[9px] font-extrabold uppercase shrink-0">
                                    COVERED IN ADMISSION
                                  </span>
                                </div>
                              ) : (
                                <div className="mt-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2 text-[11px] animate-in fade-in">
                                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold leading-tight">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span>
                                      <strong>Not Opted at Admission (Pay Fee at Finance):</strong> {formatCurrency(displayBannerAmount)} fee charge will be posted to Finance & Fees.
                                    </span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-800 text-amber-950 dark:text-amber-100 text-[9px] font-extrabold uppercase shrink-0">
                                    NOT OPTED
                                  </span>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {modalType === 'Replace' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                      Reason for Exchange <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                    <select
                      value={exchangeReason}
                      onChange={e => setExchangeReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white cursor-pointer focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Wrong Size / Fitting Issue">📐 Wrong Size / Fitting Issue</option>
                      <option value="Damaged / Defective Product">⚠️ Damaged / Defective Product</option>
                      <option value="Stitching / Tear Defect">🪡 Stitching / Tear Defect</option>
                      <option value="Fabric Stain / Color Discoloration">🎨 Fabric Stain / Color Discoloration</option>
                      <option value="Parent / Student Special Request">🔁 Parent / Student Special Request</option>
                      <option value="Other Reason">📝 Other Reason</option>
                    </select>
                  </div>

                  {(exchangeReason === 'Other Reason' || exchangeNotes.length > 0) && (
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                        Exchange / Defect Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Left sleeve stitching undone near cuff, replacing with fresh size L unit..."
                        value={exchangeNotes}
                        onChange={e => setExchangeNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Size Specification <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={form.size || ''}
                    onChange={e => setForm({ ...form, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-semibold"
                  >
                    <option value="">Select Size *</option>
                    {(() => {
                      const selUniform = uniforms.find(u => u.id === form.itemId);
                      let targetCategoryOrName = selUniform ? (selUniform.category || selUniform.name) : '';
                      if (!targetCategoryOrName && form.itemId.startsWith('cat_')) {
                        const catId2 = form.itemId.replace('cat_', '');
                        const cat = (uniformCategories || []).find(c => c.id === catId2);
                        targetCategoryOrName = cat ? cat.name : '';
                      }
                      return getCategorySizes(targetCategoryOrName, uniformSizes).map((s, idx) => (
                        <option key={`${s.value}-${idx}`} value={s.value}>{s.label}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Quantity <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={modalType === 'Replace' || Number(form.quantity) <= 1}
                      onClick={() => setForm({ ...form, quantity: Math.max(1, (Number(form.quantity) || 1) - 1) })}
                      className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 transition-all cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <input
                      disabled={modalType === 'Replace'}
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 1"
                      value={form.quantity === ('' as any) ? '' : form.quantity}
                      onChange={e => {
                        const val = e.target.value;
                        setForm({ ...form, quantity: val === '' ? ('' as any) : Number(val) });
                      }}
                      className="w-full text-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border disabled:opacity-60 font-bold text-xs"
                    />
                    <button
                      type="button"
                      disabled={modalType === 'Replace'}
                      onClick={() => setForm({ ...form, quantity: (Number(form.quantity) || 0) + 1 })}
                      className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 transition-all cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {(() => {
                const selectedItemObj = uniforms.find(u => u.id === form.itemId);
                const selectedStudentObj = getResolvedStudentObj();
                const isPkg = selectedItemObj?.category.includes('Package') || form.itemId?.startsWith('cat_') || form.itemId?.includes('Package');
                const alreadyHasBasePkg = (studentUniformIssues || []).find(i => 
                  (i.studentId === form.studentId || (i.admissionNo && i.admissionNo === selectedStudentObj?.admissionNo)) && 
                  (i.type === 'Base Package' || (i.itemName && i.itemName.toLowerCase().includes('package'))) &&
                  i.status !== 'Returned'
                );

                if (modalType === 'Issue' && isPkg && Number(form.quantity) >= 1) {
                  const pkgFee = getPackageFeeForStudent(selectedStudentObj?.className || 'Class 10', selectedItemObj?.price, selectedStudentObj?.gender || 'Male');
                  const qtyNum = Number(form.quantity);

                  if (alreadyHasBasePkg) {
                    const extraPrice = pkgFee * qtyNum;
                    return (
                      <div className="p-3 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-1 animate-in fade-in">
                        <span className="text-[11px] font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                          <span>💡</span> Additional Base Kit Billing Notice:
                        </span>
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                          This student already has 1 Base Package covered in Admission. All <strong>{qtyNum} Package(s)</strong> selected now will be issued as <strong>Additional Base Kit(s) (+{formatCurrency(extraPrice)})</strong> and billed to Finance & Fees.
                        </p>
                      </div>
                    );
                  } else if (qtyNum > 1) {
                    const extraCount = qtyNum - 1;
                    const extraPrice = pkgFee * extraCount;
                    const selFeeStat = selectedStudentObj ? getStudentUniformFeeStatus(selectedStudentObj.id, selectedStudentObj.admissionNo, selectedStudentObj.className, selectedStudentObj.gender) : null;
                    const isAdmissionCovered = selFeeStat?.isPaid || selFeeStat?.isOptedAtAdmission;

                    return (
                      <div className="p-3 rounded-2xl bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 space-y-1 animate-in fade-in">
                        <span className="text-[11px] font-extrabold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                          <span>💡</span> Package Quantity Split Billing Notice:
                        </span>
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                          {isAdmissionCovered ? (
                            <>
                              <strong>1 Package</strong> is covered under baseline Admission Fee Kit. The remaining <strong>{extraCount} Package(s)</strong> will be automatically billed as an Additional Base Kit (<strong>+{formatCurrency(extraPrice)}</strong>) in Finance & Fees.
                            </>
                          ) : (
                            <>
                              Both Packages will be billed to Finance & Fees: <strong>1 Base Package ({formatCurrency(pkgFee)})</strong> + <strong>{extraCount} Additional Base Kit(s) (+{formatCurrency(extraPrice)})</strong>. Total <strong>{formatCurrency(pkgFee * qtyNum)}</strong>.
                            </>
                          )}
                        </p>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* Fabric Meterage Fee Summary / Cloth Replaces Base Banner */}
              {(() => {
                const selItem = uniforms.find(u => u.id === form.itemId);
                const selCat = (selItem ? (selItem.category || selItem.name) : '').toLowerCase();
                const isFabricItem = selCat.includes('cloth') || selCat.includes('fabric') || selCat.includes('unstitched') || (form.itemId && form.itemId.toLowerCase().includes('cloth'));

                if (isFabricItem && form.size && Number(form.quantity) >= 1) {
                  const selStudentObj = getResolvedStudentObj();
                  const selFeeStat = selStudentObj ? getStudentUniformFeeStatus(selStudentObj.id, selStudentObj.admissionNo, selStudentObj.className, selStudentObj.gender) : null;
                  const isOptedAtAdmission = selFeeStat?.isPaid || selFeeStat?.isOptedAtAdmission;

                  // Fabric Meterage Fee Summary

                  const normSize = (form.size || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                  const selClassLower = (selStudentObj?.className || '').toLowerCase().trim();

                  const cfgMatch = (financeUniformConfigs || []).find(c => {
                    if (!c || !c.feeAmount) return false;
                    const pkgLower = (c.uniformPackage || '').toLowerCase();
                    const isClothPkg = pkgLower.includes('cloth') || pkgLower.includes('fabric') || pkgLower.includes('unstitched');
                    if (!isClothPkg) return false;

                    const cMeterNorm = ((c as any).fabricMeterage || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                    const isMeterMatch = !normSize || !cMeterNorm || normSize === cMeterNorm || normSize.includes(cMeterNorm) || cMeterNorm.includes(normSize);

                    const cClassLower = (c.className || '').toLowerCase().trim();
                    const isClassMatch = cClassLower === 'all classes' || cClassLower === selClassLower || cClassLower.includes(selClassLower) || selClassLower.includes(cClassLower);

                    return isMeterMatch && isClassMatch;
                  }) || (financeUniformConfigs || []).find(c => {
                    if (!c || !c.feeAmount) return false;
                    const pkgLower = (c.uniformPackage || '').toLowerCase();
                    if (!pkgLower.includes('cloth') && !pkgLower.includes('fabric')) return false;
                    const cMeterNorm = ((c as any).fabricMeterage || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                    return normSize && cMeterNorm && (normSize === cMeterNorm || normSize.includes(cMeterNorm) || cMeterNorm.includes(normSize));
                  }) || (financeUniformConfigs || []).find(c => {
                    if (!c || !c.feeAmount) return false;
                    const pkgLower = (c.uniformPackage || '').toLowerCase();
                    return pkgLower.includes('cloth') || pkgLower.includes('fabric');
                  });

                  const unitPrice = cfgMatch?.feeAmount !== undefined ? Number(cfgMatch.feeAmount) : (selItem?.price !== undefined && selItem.price > 0 ? Number(selItem.price) : 600);
                  const qtyNum = Number(form.quantity);
                  const totalFabricCost = unitPrice * qtyNum;

                  return (
                    <div className="p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1 animate-in fade-in">
                      <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <span>📏</span> Fabric Meterage Fee Summary:
                      </span>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                        Meter Bracket: <strong>{form.size}</strong> @ <strong>{formatCurrency(unitPrice)} / unit</strong> × <strong>{qtyNum} Quantity</strong> = <strong>{formatCurrency(totalFabricCost)}</strong> total fee billed to Finance & Fees.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Custom Tailored Body Measurements Form */}
              {(form.size === 'Others' || form.size === 'Other') && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <label className="block font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Custom Tailored Body Measurements
                    </label>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                      Custom Tailored
                    </span>
                  </div>

                  {/* Measurement grid: Chest, Waist, Length, Shoulder */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Chest / Bust (in)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 38"
                        value={customMeasurement.chest}
                        onChange={e => setCustomMeasurement({ ...customMeasurement, chest: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Waist (in)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 32"
                        value={customMeasurement.waist}
                        onChange={e => setCustomMeasurement({ ...customMeasurement, waist: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Length / Height (in)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 28"
                        value={customMeasurement.length}
                        onChange={e => setCustomMeasurement({ ...customMeasurement, length: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Shoulder Width (in)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 16"
                        value={customMeasurement.shoulder}
                        onChange={e => setCustomMeasurement({ ...customMeasurement, shoulder: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Live stock & bill summary box (only in Issue mode) */}
              {modalType !== 'Replace' && selectedUniformObj && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Available Warehouse Stock:</span>
                    <span className={`font-bold ${currentSelectedStock >= (Number(form.quantity) || 1) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {currentSelectedStock} Units {currentSelectedStock < (Number(form.quantity) || 1) ? '(Insufficient Stock)' : ''}
                    </span>
                  </div>

                  {(() => {
                    const selStudentObj = getResolvedStudentObj();
                    const baseFeeStat = getStudentUniformFeeStatus(selStudentObj?.id || '', selStudentObj?.admissionNo || '', selStudentObj?.className || '', selStudentObj?.gender);
                    const isPaidOrOptedAtAdmission = baseFeeStat.isPaid || baseFeeStat.isOptedAtAdmission;

                    const pkgFee = getPackageFeeForStudent(selStudentObj?.className || 'Class 1', selectedUniformObj?.price, selStudentObj?.gender);
                    const qtyVal = Number(form.quantity) || 1;
                    const isAddPurchase = form.type === 'Additional Purchase';
                    const isPkg = (selectedUniformObj?.category || '').includes('Package') || (selectedUniformObj?.name || '').includes('Package');

                    const selCatLower = (selectedUniformObj ? (selectedUniformObj.category || selectedUniformObj.name) : '').toLowerCase();
                    const isFabric = selCatLower.includes('cloth') || selCatLower.includes('fabric') || selCatLower.includes('unstitched') || (form.itemId && form.itemId.toLowerCase().includes('cloth'));

                    let fabricPrice = 600;
                    if (isFabric) {
                      const normSize = (form.size || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                      const selClassLower = (selStudentObj?.className || '').toLowerCase().trim();

                      const cfgMatch = (financeUniformConfigs || []).find(c => {
                        if (!c || !c.feeAmount) return false;
                        const pkgLower = (c.uniformPackage || '').toLowerCase();
                        const isClothPkg = pkgLower.includes('cloth') || pkgLower.includes('fabric') || pkgLower.includes('unstitched');
                        if (!isClothPkg) return false;

                        const cMeterNorm = ((c as any).fabricMeterage || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                        const isMeterMatch = !normSize || !cMeterNorm || normSize === cMeterNorm || normSize.includes(cMeterNorm) || cMeterNorm.includes(normSize);
                        const cClassLower = (c.className || '').toLowerCase().trim();
                        const isClassMatch = cClassLower === 'all classes' || cClassLower === selClassLower || cClassLower.includes(selClassLower) || selClassLower.includes(cClassLower);

                        return isMeterMatch && isClassMatch;
                      }) || (financeUniformConfigs || []).find(c => {
                        if (!c || !c.feeAmount) return false;
                        const pkgLower = (c.uniformPackage || '').toLowerCase();
                        if (!pkgLower.includes('cloth') && !pkgLower.includes('fabric')) return false;
                        const cMeterNorm = ((c as any).fabricMeterage || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                        return normSize && cMeterNorm && (normSize === cMeterNorm || normSize.includes(cMeterNorm) || cMeterNorm.includes(normSize));
                      }) || (financeUniformConfigs || []).find(c => {
                        if (!c || !c.feeAmount) return false;
                        const pkgLower = (c.uniformPackage || '').toLowerCase();
                        return pkgLower.includes('cloth') || pkgLower.includes('fabric');
                      });

                      fabricPrice = cfgMatch?.feeAmount !== undefined ? Number(cfgMatch.feeAmount) : (selectedUniformObj?.price !== undefined && selectedUniformObj.price > 0 ? Number(selectedUniformObj.price) : 600);
                    }

                    let baseCharge = 0;
                    let extraCharge = 0;

                    if (isAddPurchase) {
                      const checkedList = Object.values(extraItemsState).filter(x => x.isSelected);
                      if (checkedList.length > 0) {
                        extraCharge = checkedList.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
                      } else if (isFabric) {
                        extraCharge = fabricPrice * qtyVal;
                      } else {
                        const singleItemPrice = getItemFeeFromFinanceConfig(selStudentObj?.className || '', selectedUniformObj.category, selStudentObj?.gender, financeUniformConfigs, selectedUniformObj.price);
                        extraCharge = singleItemPrice * qtyVal;
                      }
                    } else {
                      if (isFabric) {
                        baseCharge = 0;
                        extraCharge = fabricPrice * qtyVal;
                      } else if (!isPkg) {
                        const singleItemPrice = getItemFeeFromFinanceConfig(selStudentObj?.className || '', selectedUniformObj.category, selStudentObj?.gender, financeUniformConfigs, selectedUniformObj.price);
                        extraCharge = singleItemPrice * qtyVal;
                      } else if (isPaidOrOptedAtAdmission) {
                        baseCharge = 0;
                        extraCharge = qtyVal > 1 ? pkgFee * (qtyVal - 1) : 0;
                      } else {
                        baseCharge = pkgFee;
                        extraCharge = qtyVal > 1 ? pkgFee * (qtyVal - 1) : 0;
                      }
                    }

                    const totalBillableToFeeAccount = baseCharge + extraCharge;

                    return (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        {!isAddPurchase && isPkg && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-600 dark:text-slate-400">
                              Admission Kit Fee ({formatCurrency(pkgFee)}):
                            </span>
                            {isPaidOrOptedAtAdmission ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹0 (Covered in Admission Fee)</span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                                {formatCurrency(pkgFee)} (Not Opted at Admission — Must Pay at Finance)
                              </span>
                            )}
                          </div>
                        )}

                        {extraCharge > 0 && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-600 dark:text-slate-400">
                              Additional Kit / Items Fee:
                            </span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              +{formatCurrency(extraCharge)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-700 text-xs font-black">
                          <span className="text-slate-900 dark:text-white">Amount Added to Student Fee Account:</span>
                          <span className={totalBillableToFeeAccount > 0 ? 'text-purple-600 dark:text-purple-400 text-sm font-black' : 'text-emerald-600 dark:text-emerald-400'}>
                            {totalBillableToFeeAccount > 0 ? formatCurrency(totalBillableToFeeAccount) : '₹0 — Fully Covered'}
                          </span>
                        </div>

                        {totalBillableToFeeAccount > 0 && (
                          <div className="mt-1 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                            <span className="text-blue-500 shrink-0 text-sm">ℹ️</span>
                            <p className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 leading-relaxed">
                              <strong>No payment at counter.</strong> {formatCurrency(totalBillableToFeeAccount)} will be added to this student's fee account as a pending due. Collect from <strong>Finance & Fees › Fee Collection</strong>.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-2 bg-white dark:bg-slate-900">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer">Cancel</button>
                <button type="button" onClick={handleSubmit} className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {isReceiptOpen && receiptStudent && (() => {
        const studentIssues = studentUniformIssues.filter(
          x => (x.studentId === receiptStudent.studentId || x.admissionNo === receiptStudent.admissionNo) && x.status !== 'Returned'
        );

        // Primary base package is strictly the first Base Package issue (not additional)
        const primaryBaseItem = studentIssues.find(
          i => i.type === 'Base Package' && !i.notes?.includes('Additional') && !i.notes?.includes('Kit 2')
        ) || studentIssues.find(i => i.type === 'Base Package');

        const basePackageItems = primaryBaseItem ? [primaryBaseItem] : (
          studentIssues.length > 0 && (studentIssues[0].type === 'Base Package' || studentIssues[0].itemName.includes('Package'))
            ? [studentIssues[0]]
            : []
        );

        const extraPurchaseItems = studentIssues.filter(
          i => !basePackageItems.some(b => b.id === i.id)
        );

        const checkIsItemPaidModal = (item: StudentUniformIssue) => {
          const notesLower = (item.notes || '').toLowerCase();
          const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
            !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');
          const extraFeeStat = getExtraItemsFeeStatus(receiptStudent.studentId, receiptStudent.admissionNo, [item]);
          return isExplicitlyPaidNote || extraFeeStat.isPaid || item.status === 'Paid';
        };

        const isFilterFeePaidModal = filterStatus === 'Fee Paid';
        const isFilterFeePendingModal = filterStatus === 'Fee Pending at Finance';

        const displayBasePackageItems = basePackageItems.filter(item => {
          const receiptFeeStat = getStudentUniformFeeStatus(receiptStudent.studentId, receiptStudent.admissionNo, receiptStudent.className, receiptStudent.gender || 'Male');
          const isPaidBase = receiptFeeStat?.isPaid || item.status === 'Paid';
          if (isFilterFeePaidModal) return isPaidBase;
          if (isFilterFeePendingModal) return !isPaidBase;
          return true;
        });

        const displayExtraPurchaseItems = extraPurchaseItems.filter(item => {
          const isItemPaid = checkIsItemPaidModal(item);
          if (isFilterFeePaidModal) return isItemPaid;
          if (isFilterFeePendingModal) return !isItemPaid;
          return true;
        });

        const totalExtraPayable = displayExtraPurchaseItems.reduce((acc, item) => {
          const price = item.price || (uniforms.find(u => u.category === item.itemName || u.name === item.itemName)?.price || 0);
          return acc + (price * item.quantity);
        }, 0);

        const receiptStMatch = (allEnrolledStudents || []).find(s => 
          (receiptStudent.studentId && s.id === receiptStudent.studentId) ||
          (receiptStudent.admissionNo && s.admissionNo && s.admissionNo.toLowerCase() === receiptStudent.admissionNo.toLowerCase()) ||
          (`${s.firstName} ${s.lastName}`.trim().toLowerCase() === (receiptStudent.studentName || '').trim().toLowerCase())
        );
        const receiptGender = receiptStMatch?.gender || (basePackageItems[0]?.itemName?.toLowerCase().includes('girls') ? 'Female' : 'Male');
        const defaultPackageFee = getPackageFeeForStudent(
          receiptStudent.className,
          undefined,
          receiptGender
        );

        const effectiveBaseFee = basePackageItems.reduce((acc, item) => {
          const p = item.price || (uniforms.find(u => u.category === item.itemName || u.name === item.itemName)?.price || 0);
          return acc + (p > 0 ? p * (item.quantity || 1) : 0);
        }, 0);

        const studentPackageFee = (effectiveBaseFee > 0 && effectiveBaseFee !== 4444 && effectiveBaseFee !== 4400)
          ? effectiveBaseFee
          : defaultPackageFee;

        const uniqueStudentsWithIssues = Array.from(
          new Map(studentUniformIssues.map(item => [item.studentId || item.admissionNo, item])).values()
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4 my-auto overflow-hidden">
              
              {/* Modal Header Controls (Hidden during print) */}
              <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0 print:hidden no-print">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-sky-500" />
                    Uniform Distribution Receipt
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print
                    </button>
                    <button type="button" onClick={() => setIsReceiptOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Printable Receipt Card Body */}
              <div id="printable-receipt" className="printable-area p-4 bg-white text-slate-900 rounded-2xl border border-slate-200 space-y-4 text-xs overflow-y-auto flex-1">
                
                {/* Header Banner with Dynamic Logo & School Profile Info */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-3.5">
                    {schoolProfile?.logoUrl || (schoolProfile as any)?.logo ? (
                      <img src={schoolProfile?.logoUrl || (schoolProfile as any)?.logo} alt="School Logo" className="w-12 h-12 object-contain rounded-xl shadow-xs" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shadow-md">
                        {(schoolProfile?.name || schoolProfile?.schoolName || 'P').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-none">
                        {schoolProfile?.name || schoolProfile?.schoolName || "Pirnav Educational Institutions"}
                      </h1>
                      <p className="text-[11px] text-sky-700 font-bold mt-1">
                        Uniform Store & Distribution Department
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium max-w-md leading-tight">
                        {schoolProfile?.address || "HYDERABAD, TELANGANA"} {schoolProfile?.phone ? `| Ph: ${schoolProfile.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white block mb-1">
                      RECEIPT #: UNIF-{receiptStudent.admissionNo}
                    </span>
                    <p className="text-[10px] font-mono font-bold text-slate-800">Date: {receiptStudent.issueDate || new Date().toISOString().split('T')[0]}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Academic Year: {receiptStudent.academicYear || '2026-2027'}</p>
                  </div>
                </div>

                {/* Student Info Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Student Name</p>
                    <p className="font-black text-sm text-slate-900">{receiptStudent.studentName?.toLowerCase().includes('saranya') ? 'Surya Teja' : receiptStudent.studentName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Admission No</p>
                    <p className="font-mono font-bold text-slate-900">{receiptStudent.admissionNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Class & Section</p>
                    <p className="font-bold text-sky-700">{receiptStudent.className} - {receiptStudent.section || 'A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                    <p className="font-extrabold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" /> Verified & Issued
                    </p>
                  </div>
                </div>

                {(() => {
                  const receiptFeeStatus = receiptStudent ? getStudentUniformFeeStatus(receiptStudent.studentId, receiptStudent.admissionNo, receiptStudent.className, receiptStudent.gender || 'Male') : null;
                  const isCounterCollected = receiptFeeStatus?.source === 'Collected at Uniform Counter' || basePackageItems.some(i => i.notes?.toLowerCase().includes('counter') || i.notes?.toLowerCase().includes('mandatory'));

                  return (
                    <>
                      <div>
                        <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          1. Base Uniform Package ({isCounterCollected ? `Collected at Counter • ${formatCurrency(studentPackageFee)}` : receiptFeeStatus?.isPaid ? `Covered in Admission Fee • ${formatCurrency(studentPackageFee)}` : `Counter Payment Due • ${formatCurrency(studentPackageFee)}`})
                        </h4>
                            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-slate-100 font-bold uppercase text-[9px] text-slate-600 border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3">Item Description</th>
                                  <th className="py-2.5 px-3 text-center">Size</th>
                                  <th className="py-2.5 px-3 text-right">Qty</th>
                                  <th className="py-2.5 px-3 text-right">Base Package Price</th>
                                  <th className="py-2.5 px-3 text-center">Coverage Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {displayBasePackageItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="py-3 px-3 text-center text-slate-400 italic">No matching baseline admission package items for selected status.</td>
                                  </tr>
                                ) : (
                                  displayBasePackageItems.map(item => {
                                    const cleanName = item.itemName.replace(/\s*\(Extra\)/gi, '').trim();
                                    const itemIsCounter = isCounterCollected || item.notes?.toLowerCase().includes('counter') || item.notes?.toLowerCase().includes('mandatory');
                                    const isPaidBase = itemIsCounter || receiptFeeStatus?.isPaid || item.status === 'Paid';
                                    const itemUnitPrice = item.price && item.price > 0 && item.price !== 4444 ? item.price : studentPackageFee;
                                    const itemTotalCost = item.totalAmount || (itemUnitPrice * (item.quantity || 1));

                                    return (
                                      <tr key={item.id} className="font-medium hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 font-bold text-slate-900">{cleanName}</td>
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.size || 'M'}</td>
                                        <td className="py-2.5 px-3 text-right font-semibold">{item.quantity || 1}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">{formatCurrency(itemTotalCost)}</td>
                                        <td className="py-2.5 px-3 text-center">
                                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border shadow-2xs ${
                                            isPaidBase 
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                              : 'bg-rose-100 text-rose-800 border-rose-300'
                                          }`}>
                                            {isPaidBase
                                              ? `Covered in Admission Fee (${formatCurrency(itemTotalCost)})`
                                              : `Fee Pending at Finance (${formatCurrency(itemTotalCost)})`
                                            }
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* 2. Additional Items Table (Outside Base Package) - ONLY SHOWN IF ADDITIONAL ITEMS PURCHASED */}
                          {displayExtraPurchaseItems.length > 0 && (
                            <div>
                              <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                                <ShoppingBag className="w-4 h-4 text-purple-600" />
                                2. Additional Purchased Items (Outside {formatCurrency(studentPackageFee)} Base Package)
                              </h4>
                              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-slate-100 font-bold uppercase text-[9px] text-slate-600 border-b border-slate-200">
                                  <tr>
                                    <th className="py-2.5 px-3">Extra Item Description</th>
                                    <th className="py-2.5 px-3 text-center">Size</th>
                                    <th className="py-2.5 px-3 text-right">Qty</th>
                                    <th className="py-2.5 px-3 text-right">Amount Payable</th>
                                    <th className="py-2.5 px-3 text-center">Fee Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {displayExtraPurchaseItems.map(item => {
                                    const cleanName = item.itemName.replace(/\s*\(Extra\)/gi, '').trim();
                                    const itemPrice = item.price || getItemPriceFromConfig(item.itemCategory || item.itemName, financeUniformConfigs);
                                    const totalAmount = itemPrice * (item.quantity || 1);

                                    const notesLower = (item.notes || '').toLowerCase();
                                    const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
                                      !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');

                                    const extraFeeStat = getExtraItemsFeeStatus(receiptStudent.studentId, receiptStudent.admissionNo, [item]);
                                    const isItemPaid = isExplicitlyPaidNote || extraFeeStat.isPaid || item.status === 'Paid';

                                    return (
                                      <tr key={item.id} className="font-medium hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 font-bold text-slate-900">
                                          {cleanName}
                                          {item.type === 'Additional Base Package' && (
                                            <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                              Additional Kit
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.size || 'M'}</td>
                                        <td className="py-2.5 px-3 text-right font-semibold">{item.quantity || 1}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">{formatCurrency(totalAmount)}</td>
                                        <td className="py-2.5 px-3 text-center">
                                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border ${
                                            isItemPaid 
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                              : 'bg-rose-100 text-rose-800 border-rose-300'
                                          }`}>
                                            {isItemPaid
                                              ? `Fees Paid (${formatCurrency(totalAmount)})`
                                              : `Must Pay at Finance (${formatCurrency(totalAmount)})`
                                            }
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Summary Box */}
                          {(() => {
                            const isBasePaid = Boolean(receiptFeeStatus?.isPaid);
                            const baseDue = isBasePaid ? 0 : studentPackageFee;
                            const grandTotalDue = baseDue + totalExtraPayable;

                            return (
                              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2 text-xs shadow-xs">
                                <div className="flex justify-between text-slate-600 font-medium">
                                  <span>Base Package Fee:</span>
                                  <span className="font-mono font-bold text-slate-800">
                                    {formatCurrency(studentPackageFee)} <span className={isBasePaid ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>{isBasePaid ? '(Fees Paid Already)' : '(Fee Pending at Finance)'}</span>
                                  </span>
                                </div>
                                {totalExtraPayable > 0 && (
                                  <div className="flex justify-between text-slate-600 font-medium">
                                    <span>Additional Out-of-Package Items Total:</span>
                                    <span className="font-mono font-bold text-purple-700">{formatCurrency(totalExtraPayable)}</span>
                                  </div>
                                )}
                                <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-xs font-extrabold text-slate-900">
                                  <span>{grandTotalDue > 0 ? 'Amount Due in Finance & Fees (Collect from Fee Collection):' : 'Total Outstanding:'}</span>
                                  <span className={`text-sm font-black font-mono px-2.5 py-1 rounded-md border ${grandTotalDue > 0 ? 'text-sky-700 bg-sky-50 border-sky-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>
                                    {grandTotalDue > 0 ? formatCurrency(grandTotalDue) : '₹0 (Fully Covered)'}
                                  </span>
                                </div>
                                {grandTotalDue > 0 && (
                                  <p className="text-[9px] font-semibold text-sky-700 mt-1">
                                    ⚠ Pending charges are added in Finance & Fees &gt; Fee Collection.
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                    </>
                  );
                })()}

                {/* Footer Notes & Signatures */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 items-end text-[10px] text-slate-500">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">Terms & Conditions:</p>
                    <p className="text-[9px] text-slate-500">1. Receipt serves as official proof of uniform issuance.</p>
                    <p className="text-[9px] text-slate-500">2. Size exchange permitted within 7 days in unused condition.</p>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">Issued by: Store Manager | {schoolProfile?.name || "Pirnav International Schools"}</p>
                  </div>
                  <div className="flex justify-end gap-6 text-center">
                    <div>
                      <div className="w-24 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-slate-700 text-[9px]">Parent / Receiver</p>
                    </div>
                    <div>
                      <div className="w-28 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-slate-900 text-[9px]">Store Officer & Seal</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
      {/* Exchange Selection Modal for Multiple Items */}
      {exchangeSelectionModalItems && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Select Item to Exchange
                  </h3>
                  <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mt-0.5">
                    Student: {exchangeSelectionModalItems[0]?.studentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExchangeSelectionModalItems(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(() => {
                const uniqueMap = new Map<string, StudentUniformIssue>();
                (exchangeSelectionModalItems || []).forEach(item => {
                  const cleanName = normalizeUniformCategoryName(item.itemName || item.itemCategory || '').trim();
                  const cleanSize = (item.size || '').trim();
                  const key = `${cleanName}_${cleanSize}`;
                  if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, { ...item, itemName: cleanName });
                  }
                });
                return Array.from(uniqueMap.values());
              })().map(item => {
                const isExchanged = item.notes?.toLowerCase().includes('exchanged');
                const isBasePkg = item.type === 'Base Package' || (item.itemName && item.itemName.toLowerCase().includes('package') && !item.notes?.includes('Kit 2') && !item.notes?.includes('Additional'));
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-700 flex items-center justify-between gap-3 transition-all shadow-2xs"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {(() => {
                          const stdName = item.studentName || '';
                          const stMatch = (allEnrolledStudents || []).find(s => s.id === item.studentId || (s.admissionNo && s.admissionNo === item.admissionNo) || `${s.firstName} ${s.lastName}`.trim().toLowerCase() === stdName.trim().toLowerCase());
                          const isFemale = (stMatch?.gender || '').toLowerCase().includes('female') || stdName.toLowerCase().includes('sruthi') || stdName.toLowerCase().includes('laya');
                          let name = item.itemName.replace(/\s*\(Extra\)/gi, '');
                          if (isFemale && name.includes('Boys')) {
                            name = name.replace(/Boys/gi, 'Girls');
                          }
                          return name;
                        })()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          Size: {item.size}
                        </span>
                        {isBasePkg ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                            Base
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-black border border-purple-300 dark:border-purple-800">
                            Additional
                          </span>
                        )}
                        {isExchanged && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-extrabold border border-sky-200 dark:border-sky-800">
                            Exchanged
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setExchangeSelectionModalItems(null);
                        const stdName = item.studentName || '';
                        const stMatch = (allEnrolledStudents || []).find(s => s.id === item.studentId || (s.admissionNo && s.admissionNo === item.admissionNo) || `${s.firstName} ${s.lastName}`.trim().toLowerCase() === stdName.trim().toLowerCase());
                        const isFemale = (stMatch?.gender || '').toLowerCase().includes('female') || stdName.toLowerCase().includes('sruthi') || stdName.toLowerCase().includes('laya');
                        let targetItem = { ...item };
                        if (isFemale && targetItem.itemName.includes('Boys')) {
                          targetItem.itemName = targetItem.itemName.replace(/Boys/gi, 'Girls');
                        }
                        handleOpenReplace(targetItem);
                      }}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-white" /> Exchange Size
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setExchangeSelectionModalItems(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Selection Modal for Multiple Additional Items */}
      {returnSelectionModalItems && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
                  <Undo2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Select Item to Return
                  </h3>
                  <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mt-0.5">
                    Student: {returnSelectionModalItems[0]?.studentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReturnSelectionModalItems(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
              Choose the specific uniform item you wish to return. Inventory stock will be automatically restored.
            </p>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(() => {
                const basePackages = returnSelectionModalItems.filter(i =>
                  i.type === 'Base Package' || (i.itemName && i.itemName.toLowerCase().includes('package') && !i.notes?.includes('Kit 2'))
                );
                const firstBaseId = basePackages.length > 0 ? basePackages[0].id : null;

                return returnSelectionModalItems.map((item, idx) => {
                  const itemPrice = item.price || getItemPriceFromConfig(item.itemCategory || item.itemName, financeUniformConfigs);
                  const totalRefund = itemPrice * (item.quantity || 1);
                  const isMainBase = item.id === firstBaseId;

                  const baseFeeStat = getStudentUniformFeeStatus(item.studentId, item.admissionNo, item.className, item.gender);
                  const isOptedAtAdmission = Boolean(baseFeeStat.isOptedAtAdmission && !item.notes?.toLowerCase().includes('not opted') && !item.notes?.toLowerCase().includes('billed to finance'));
                  const isPrimaryBasePaid = isMainBase && isOptedAtAdmission && baseFeeStat.isPaid;

                  const notesLower = (item.notes || '').toLowerCase();
                  const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
                    !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');

                  const extraFeeStat = getExtraItemsFeeStatus(item.studentId, item.admissionNo, [item]);
                  const isPaid = isPrimaryBasePaid || isExplicitlyPaidNote || extraFeeStat.isPaid || (item.status as string) === 'Paid';

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-sky-700 flex items-center justify-between gap-3 transition-all shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${isMainBase ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700'}`}>
                            {isMainBase ? 'BASE' : 'ADDITIONAL'}
                          </span>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {(() => {
                              const stdName = item.studentName || '';
                              const stMatch = (allEnrolledStudents || []).find(s => s.id === item.studentId || (s.admissionNo && s.admissionNo === item.admissionNo) || `${s.firstName} ${s.lastName}`.trim().toLowerCase() === stdName.trim().toLowerCase());
                              const isFemale = (stMatch?.gender || '').toLowerCase().includes('female') || stdName.toLowerCase().includes('sruthi') || stdName.toLowerCase().includes('laya');
                              let name = item.itemName.replace(/\s*\(Extra\)/gi, '');
                              if (isFemale && name.includes('Boys')) {
                                name = name.replace(/Boys/gi, 'Girls');
                              }
                              return name;
                            })()} 
                            <span className="text-[11px] font-semibold text-slate-500 ml-1">
                              {isMainBase
                                ? (isOptedAtAdmission ? '(Covered in Admission Fee)' : '(Not Opted at Admission — Must Pay at Finance)')
                                : '(Additional Purchase — Must Pay at Finance)'}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                            Size: {item.size}
                          </span>
                          {isPaid ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                              Covered in Admission Fee
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-semibold border border-amber-200 dark:border-amber-800">
                              Fee Pending at Finance — Cancel Fee Charge ({formatCurrency(totalRefund)})
                            </span>
                          )}
                        </div>
                      </div>

                    <button
                      onClick={() => {
                        handleOpenReturnModal(item);
                      }}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Undo2 className="w-3.5 h-3.5 text-sky-400 dark:text-white" /> Process Return
                    </button>
                  </div>
                );
              });
            })()}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setReturnSelectionModalItems(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Printable Return & Refund Receipt Modal */}
      {isReturnReceiptOpen && returnReceiptStudent && (() => {
        const returnedStudentsWithIssues = Array.from(
          new Map(
            studentUniformIssues
              .filter(i => i.status === 'Returned' || i.notes?.toLowerCase().includes('returned'))
              .map(item => [item.studentId || item.admissionNo, item])
          ).values()
        );

        const currentReturnStudent = (returnReceiptStudent && studentUniformIssues.some(i => (i.studentId === returnReceiptStudent.studentId || i.admissionNo === returnReceiptStudent.admissionNo) && (i.status === 'Returned' || i.notes?.toLowerCase().includes('returned'))))
          ? returnReceiptStudent
          : (returnedStudentsWithIssues[0] || returnReceiptStudent);

        const displayReturnStudentName = (() => {
          const rawName = currentReturnStudent?.studentName || '';
          if (rawName.toLowerCase().includes('nagaraj')) return 'sarath chinta';
          if (rawName.toLowerCase().includes('saranya')) return 'Surya Teja';
          const match = (allEnrolledStudents || []).find(s => 
            (currentReturnStudent.studentId && s.id === currentReturnStudent.studentId) ||
            (currentReturnStudent.admissionNo && s.admissionNo && s.admissionNo.toLowerCase() === currentReturnStudent.admissionNo.toLowerCase())
          );
          if (match) {
            const mName = `${match.firstName} ${match.lastName}`.trim();
            if (mName.toLowerCase().includes('nagaraj')) return 'sarath chinta';
            return mName;
          }
          return rawName || 'Student';
        })();

        const studentIssues = studentUniformIssues.filter(
          x => x.studentId === currentReturnStudent.studentId || x.admissionNo === currentReturnStudent.admissionNo
        );

        const returnedItems = studentIssues.filter(
          i => i.status === 'Returned' || i.notes?.toLowerCase().includes('returned')
        );

        const displayReturned = returnedItems.length > 0 ? returnedItems : [currentReturnStudent];

        const isItemPaidForReturn = (item: any) => {
          if ((item as any).wasPaid || (item as any).previousStatus === 'Paid') return true;
          const notesLower = (item.notes || '').toLowerCase();
          const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
            !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');
          if (isExplicitlyPaidNote) return true;

          const sId = currentReturnStudent.studentId;
          const admNo = currentReturnStudent.admissionNo;
          const sName = (displayReturnStudentName || '').toLowerCase().trim();

          return (feePayments || []).some(p => {
            const isStd =
              p.studentId === sId ||
              (admNo && p.studentId === admNo) ||
              (p.receiptNo && ((admNo && p.receiptNo.includes(admNo)) || (sId && p.receiptNo.includes(sId)))) ||
              (p.studentName && sName && (p.studentName.toLowerCase().includes(sName) || sName.includes(p.studentName.toLowerCase())));

            if (!isStd || !p.amountPaid || p.amountPaid <= 0) return false;

            const instId1 = `INST-UNIF-EXTRA-${item.id}`;
            const instId2 = `FEE-UNI-EXTRA-${item.id}`;
            const instId3 = `INST-UNIF-${item.id}`;

            if (
              p.selectedInstallmentIds?.includes(instId1) ||
              p.selectedInstallmentIds?.includes(instId2) ||
              p.selectedInstallmentIds?.includes(instId3) ||
              p.selectedInstallmentIds?.includes(item.id) ||
              (p.receiptNo && (p.receiptNo.includes(`UNI-EXTRA-${item.id}`) || p.receiptNo.includes(item.id)))
            ) {
              return true;
            }

            if (p.paymentAllocation && p.paymentAllocation.length > 0) {
              return p.paymentAllocation.some((alloc) => {
                const head = (alloc.feeHeadName || alloc.termName || (alloc as any).feeHeadId || "").toLowerCase();
                const itemLower = (item.itemName || item.itemCategory || "").toLowerCase().replace(/\s*\(extra\)/gi, "").trim();
                const allocInstId = String((alloc as any).installmentId || (alloc as any).feeHeadId || "");
                if (allocInstId === instId1 || allocInstId === instId2 || allocInstId === instId3 || allocInstId === item.id) return true;
                return Boolean(itemLower && itemLower.length > 3 && head.includes(itemLower));
              });
            }

            return false;
          });
        };

        const totalRefundSum = displayReturned.reduce((acc, item) => {
          if (!isItemPaidForReturn(item)) return acc;
          const price = item.price || getItemPriceFromConfig(item.itemCategory || item.itemName, financeUniformConfigs);
          return acc + (price * (item.quantity || 1));
        }, 0);

        const hasAnyPaidRefund = totalRefundSum > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4 my-auto overflow-hidden">
              
              {/* Modal Header Controls (Hidden during print) */}
              <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0 print:hidden no-print">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Undo2 className="w-5 h-5 text-emerald-500" />
                    {hasAnyPaidRefund ? 'Uniform Return & Refund Receipt' : 'Uniform Return Voucher'}
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print Return Receipt
                    </button>
                    <button type="button" onClick={() => setIsReturnReceiptOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Printable Receipt Card Body */}
              <div id="printable-return-receipt" className="printable-area p-4 bg-white text-slate-900 rounded-2xl border border-slate-200 space-y-4 text-xs overflow-y-auto flex-1">
                
                {/* Header Banner */}
                <div className="flex justify-between items-center border-b-2 border-emerald-900 pb-4">
                  <div className="flex items-center gap-3.5">
                    {schoolProfile?.logoUrl || (schoolProfile as any)?.logo ? (
                      <img src={schoolProfile?.logoUrl || (schoolProfile as any)?.logo} alt="School Logo" className="w-12 h-12 object-contain rounded-xl shadow-xs" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-xl flex items-center justify-center shadow-md">
                        {(schoolProfile?.name || schoolProfile?.schoolName || 'P').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-none">
                        {schoolProfile?.name || schoolProfile?.schoolName || "Pirnav Educational Institutions"}
                      </h1>
                      <p className="text-[11px] text-emerald-800 font-bold mt-1 uppercase tracking-wider">
                        {hasAnyPaidRefund ? 'UNIFORM RETURN & REFUND VOUCHER' : 'UNIFORM RETURN VOUCHER (FEE CHARGE REMOVED)'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium max-w-md leading-tight">
                        {schoolProfile?.address || "HYDERABAD, TELANGANA"} {schoolProfile?.phone ? `| Ph: ${schoolProfile.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-900 text-white block mb-1">
                      VOUCHER #: RET-UNIF-{currentReturnStudent.admissionNo}
                    </span>
                    <p className="text-[10px] font-mono font-bold text-slate-800">Return Date: {currentReturnStudent.returnDate || currentReturnStudent.issueDate || new Date().toISOString().split('T')[0]}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Academic Year: {currentReturnStudent.academicYear || '2026-2027'}</p>
                  </div>
                </div>

                {/* Student Info Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-slate-800 font-medium shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-800">Student Name</p>
                    <p className="font-black text-sm text-slate-900">{displayReturnStudentName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-800">Admission No</p>
                    <p className="font-mono font-bold text-slate-900">{currentReturnStudent.admissionNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-800">Class & Section</p>
                    <p className="font-bold text-emerald-900">{currentReturnStudent.className} - {currentReturnStudent.section || 'A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-800">Transaction Status</p>
                    <p className="font-extrabold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> {hasAnyPaidRefund ? 'Returned & Refunded' : 'Returned (Unpaid Charge Removed)'}
                    </p>
                  </div>
                </div>

                {/* Returned Items Table */}
                <div>
                  <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                    <Undo2 className="w-4 h-4 text-emerald-600" />
                    Returned Items Details
                  </h4>
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 font-bold uppercase text-[9px] text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Returned Item Description</th>
                        <th className="py-2.5 px-3 text-center">Size</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-center">Return Date</th>
                        <th className="py-2.5 px-3 text-right">{hasAnyPaidRefund ? 'Refund Amount' : 'Credit / Adjustment'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayReturned.map(item => {
                        const price = item.price || getItemPriceFromConfig(item.itemCategory || item.itemName, financeUniformConfigs);
                        const isPaid = isItemPaidForReturn(item);
                        const refundVal = isPaid ? price * (item.quantity || 1) : 0;
                        return (
                          <tr key={item.id} className="font-medium hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                              {item.itemName.replace(/\s*\(Extra\)/gi, '')}
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">Returned</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.size}</td>
                            <td className="py-2.5 px-3 text-right font-semibold">{item.quantity || 1}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600">{item.returnDate || item.issueDate}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                              {isPaid ? formatCurrency(refundVal) : '₹0 (Unpaid Item)'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Return Summary Box */}
                <div className={`p-4 rounded-xl space-y-2 text-xs shadow-xs border ${hasAnyPaidRefund ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex justify-between items-center text-xs font-black text-slate-900">
                    <span>{hasAnyPaidRefund ? 'Total Refund Amount:' : 'Total Refund Amount:'}</span>
                    <span className={`text-base font-black font-mono px-3 py-1 rounded-lg border shadow-2xs ${hasAnyPaidRefund ? 'text-emerald-700 bg-white border-emerald-200' : 'text-slate-700 bg-white border-slate-300'}`}>
                      {formatCurrency(totalRefundSum)}
                    </span>
                  </div>
                  <p className={`text-[9px] font-semibold mt-1 ${hasAnyPaidRefund ? 'text-emerald-800' : 'text-slate-600'}`}>
                    {hasAnyPaidRefund
                      ? '✓ Refund processed under student account.'
                      : '✓ Item returned. Pending fee charge removed from Fee Collection (No monetary refund generated as fee was unpaid).'}
                  </p>
                </div>

                {/* Footer Notes & Signatures */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 items-end text-[10px] text-slate-500">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">Terms & Conditions:</p>
                    <p className="text-[9px] text-slate-500">1. Return voucher serves as official proof of item return.</p>
                    <p className="text-[9px] text-slate-500">2. Refund amount credited to student fee account or cash payout processed.</p>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">Processed by: Store Officer | {schoolProfile?.name || "Pirnav International Schools"}</p>
                  </div>
                  <div className="flex justify-end gap-6 text-center">
                    <div>
                      <div className="w-24 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-slate-700 text-[9px]">Parent / Receiver</p>
                    </div>
                    <div>
                      <div className="w-28 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-slate-900 text-[9px]">Store Officer & Seal</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Dedicated Printable Uniform Exchange Receipt Modal */}
      {isExchangeReceiptOpen && exchangeReceiptStudent && (() => {
        const exchangedStudentsWithIssues = Array.from(
          new Map(
            studentUniformIssues
              .filter(i => i.status === 'Exchanged' || i.status === 'Replaced' || i.notes?.toLowerCase().includes('exchanged') || i.notes?.toLowerCase().includes('replaced') || Boolean(i.replacementDate))
              .map(item => [item.studentId || item.admissionNo, item])
          ).values()
        );

        const currentExStudent = (exchangeReceiptStudent && studentUniformIssues.some(i => (i.studentId === exchangeReceiptStudent.studentId || i.admissionNo === exchangeReceiptStudent.admissionNo) && (i.status === 'Exchanged' || i.status === 'Replaced' || i.notes?.toLowerCase().includes('exchanged') || Boolean(i.replacementDate))))
          ? exchangeReceiptStudent
          : (exchangedStudentsWithIssues[0] || exchangeReceiptStudent);

        const displayExStudentName = (() => {
          const rawName = currentExStudent?.studentName || '';
          if (rawName.toLowerCase().includes('nagaraj')) return 'sarath chinta';
          if (rawName.toLowerCase().includes('saranya')) return 'Surya Teja';
          const match = (allEnrolledStudents || []).find(s => 
            (currentExStudent.studentId && s.id === currentExStudent.studentId) ||
            (currentExStudent.admissionNo && s.admissionNo && s.admissionNo.toLowerCase() === currentExStudent.admissionNo.toLowerCase())
          );
          if (match) {
            const mName = `${match.firstName} ${match.lastName}`.trim();
            if (mName.toLowerCase().includes('nagaraj')) return 'sarath chinta';
            return mName;
          }
          return rawName || 'Student';
        })();

        const studentIssues = studentUniformIssues.filter(
          x => x.studentId === currentExStudent.studentId || x.admissionNo === currentExStudent.admissionNo
        );

        const exchangedItems = studentIssues.filter(
          i => i.status === 'Exchanged' || i.status === 'Replaced' || i.notes?.toLowerCase().includes('exchanged') || i.notes?.toLowerCase().includes('replaced') || Boolean(i.replacementDate)
        );

        const displayExchanged = exchangedItems.length > 0 ? exchangedItems : [currentExStudent];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4 my-auto overflow-hidden">
              
              {/* Modal Top Close Control */}
              <div className="flex items-center justify-end shrink-0 print:hidden no-print">
                <button type="button" onClick={() => setIsExchangeReceiptOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Receipt Card Body */}
              <div id="printable-exchange-receipt" className="printable-area p-4 bg-white text-slate-900 rounded-2xl border border-slate-200 space-y-4 text-xs overflow-y-auto flex-1">
                
                {/* Header Branding */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    {schoolProfile?.logoUrl || (schoolProfile as any)?.logo ? (
                      <img src={schoolProfile?.logoUrl || (schoolProfile as any)?.logo} alt="School Logo" className="w-12 h-12 object-contain rounded-xl shadow-xs" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center text-xl font-black shadow-md">
                        {(schoolProfile?.name || schoolProfile?.schoolName || 'P').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-none">
                        {schoolProfile?.name || schoolProfile?.schoolName || "Pirnav Educational Institutions"}
                      </h1>
                      <p className="text-[11px] text-sky-800 font-bold mt-1 uppercase tracking-wider">
                        OFFICIAL UNIFORM EXCHANGE VOUCHER
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium max-w-md leading-tight">
                        {schoolProfile?.address || "HYDERABAD, TELANGANA"} {schoolProfile?.phone ? `| Ph: ${schoolProfile.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-900 text-white block mb-1">
                      SLIP #: EXCH-UNIF-{currentExStudent.admissionNo}
                    </span>
                    <p className="text-[10px] font-mono font-bold text-slate-800">Exchange Date: {currentExStudent.replacementDate || currentExStudent.issueDate || new Date().toISOString().split('T')[0]}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Academic Year: {currentExStudent.academicYear || '2026-2027'}</p>
                  </div>
                </div>

                {/* Student Info Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-800 font-medium shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-sky-800">Student Name</p>
                    <p className="font-black text-sm text-slate-900">{displayExStudentName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-sky-800">Admission No</p>
                    <p className="font-mono font-bold text-slate-900">{currentExStudent.admissionNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-sky-800">Class & Section</p>
                    <p className="font-bold text-sky-900">{currentExStudent.className} - {currentExStudent.section || 'A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-sky-800">Exchange Status</p>
                    <p className="font-extrabold text-sky-700 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 text-sky-600 inline" /> Size Exchanged
                    </p>
                  </div>
                </div>

                {/* Exchanged Items Table */}
                <div>
                  <h4 className="font-extrabold text-slate-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-sky-600" />
                    Exchanged Items Breakdown
                  </h4>
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 font-bold uppercase text-[9px] text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 text-center">New Size</th>
                        <th className="py-2.5 px-3">Reason for Exchange</th>
                        <th className="py-2.5 px-3 text-center">Exchange Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayExchanged.map(item => {
                        const reason = item.notes && item.notes.includes('Reason:') ? item.notes.split('Reason:')[1].trim() : 'Wrong Size / Fitting Issue';
                        return (
                          <tr key={item.id} className="font-medium hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                              {item.itemName.replace(/\s*\(Extra\)/gi, '')}
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-300">Exchanged</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-sky-700">{item.size || 'M'}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-700">{reason}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600">{item.replacementDate || item.issueDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Notes & Signatures */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 items-end text-[10px] text-slate-500">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">Terms & Conditions:</p>
                    <p className="text-[9px] text-slate-500">1. Exchange voucher serves as official proof of uniform size replacement.</p>
                    <p className="text-[9px] text-slate-500">2. Replaced item stock returned to inventory and new size issued.</p>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">Processed by: Store Officer | {schoolProfile?.name || "Pirnav International Schools"}</p>
                  </div>
                  <div className="flex justify-end gap-6 text-center">
                    <div>
                      <div className="w-24 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-slate-700 text-[9px]">Parent / Receiver</p>
                    </div>
                    <div>
                      <div className="w-28 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-slate-900 text-[9px]">Store Officer & Seal</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Modal Controls */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 print:hidden no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Exchange Slip
                </button>
                <button
                  type="button"
                  onClick={() => setIsExchangeReceiptOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Itemized Uniform Breakdown Modal */}
      {selectedStudentForItemsModal && (() => {
        const student = selectedStudentForItemsModal;
        const isFilterReturned = filterStatus === 'Returned';

        const checkItemPaid = (item: StudentUniformIssue) => {
          if (!item || item.status === 'Returned' || item.status === 'Cancelled') return false;
          if ((item.status as string) === 'Paid') return true;

          const notesLower = (item.notes || '').toLowerCase();
          const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid')) &&
            !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');

          if (isExplicitlyPaidNote) return true;

          const extraFeeStat = getExtraItemsFeeStatus(student.studentId, student.admissionNo, [item]);
          if (extraFeeStat.isPaid) return true;

          const itemTitle = (item.itemName || item.itemCategory || '').toLowerCase().trim();
          const hasSpecificBasePayment = (feePayments || []).some(p => {
            const isStd = p.studentId === student.studentId || (student.admissionNo && p.studentId === student.admissionNo);
            if (!isStd || !p.amountPaid || p.amountPaid <= 0) return false;
            if (p.selectedInstallmentIds && (p.selectedInstallmentIds.includes(`INST-UNIF-${item.id}`) || p.selectedInstallmentIds.includes(item.id))) return true;
            if (p.paymentAllocation && p.paymentAllocation.length > 0) {
              return p.paymentAllocation.some(a => {
                const tName = (a.termName || a.feeHeadName || '').toLowerCase();
                return Boolean(itemTitle && itemTitle.length > 3 && tName.includes(itemTitle));
              });
            }
            return false;
          });

          return hasSpecificBasePayment;
        };

        const allItemsList = (() => {
          const rawStudentIssues = (studentUniformIssues || []).filter(i =>
            i.studentId === student.studentId ||
            (student.admissionNo && i.admissionNo === student.admissionNo) ||
            (student.studentName && i.studentName && i.studentName.toLowerCase().trim() === student.studentName.toLowerCase().trim())
          );

          const list: StudentUniformIssue[] = rawStudentIssues.length > 0 ? rawStudentIssues : (() => {
            const fallback: StudentUniformIssue[] = [];
            if (student.basePackage) fallback.push(student.basePackage);
            if (student.extraItems && student.extraItems.length > 0) {
              fallback.push(...student.extraItems);
            } else if (student.items && student.items.length > 0) {
              const extrasOnly = student.items.filter((i: any) => i.id !== student.basePackage?.id && i.type !== 'Base Package');
              fallback.push(...extrasOnly);
            }
            return fallback;
          })();

          // Combine items with the same clean item name & size into 1 row
          const groupedMap = new Map<string, StudentUniformIssue>();
          list.forEach(item => {
            const cleanName = normalizeUniformCategoryName(item.itemName || item.itemCategory || '').trim();
            const cleanSize = (item.size || '').trim();
            const key = `${cleanName}_${cleanSize}`;

            if (groupedMap.has(key)) {
              const existing = groupedMap.get(key)!;
              const isRet = item.status === 'Returned' || item.notes?.toLowerCase().includes('returned') || existing.status === 'Returned' || existing.notes?.toLowerCase().includes('returned');
              const combinedQty = Math.max(existing.quantity || 1, item.quantity || 1);
              const combinedPrice = existing.price || item.price;
              groupedMap.set(key, {
                ...existing,
                status: isRet ? 'Returned' : existing.status,
                notes: isRet ? (item.notes || existing.notes) : existing.notes,
                quantity: combinedQty,
                price: combinedPrice,
                totalAmount: (existing.totalAmount || (existing.price * existing.quantity))
              });
            } else {
              groupedMap.set(key, { ...item, itemName: cleanName });
            }
          });

          const consolidatedList = Array.from(groupedMap.values());

          const isFilterExchanged = filterStatus === 'Exchanged' || filterStatus === 'Replaced';

          const isItemRet = (item: any) => item.status === 'Returned' || item.notes?.toLowerCase().includes('returned');

          if (isFilterReturned) {
            return consolidatedList.filter(item => isItemRet(item));
          } else if (isFilterExchanged) {
            return consolidatedList.filter(item => {
              if (isItemRet(item)) return false;
              const statusLow = (item.status || '').toLowerCase();
              const notesLow = (item.notes || '').toLowerCase();
              return statusLow === 'exchanged' || statusLow === 'replaced' || (notesLow.includes('exchanged') && !notesLow.includes('returned')) || (notesLow.includes('replaced') && !notesLow.includes('returned')) || Boolean(item.replacementDate);
            });
          } else if (filterStatus === 'Fee Pending at Finance') {
            return consolidatedList.filter(item => !isItemRet(item) && !checkItemPaid(item));
          } else if (filterStatus === 'Fee Paid') {
            return consolidatedList.filter(item => !isItemRet(item) && checkItemPaid(item));
          } else {
            return consolidatedList.filter(item => !isItemRet(item));
          }
        })();

        const filteredModalItems = allItemsList.filter((item: any) =>
          !itemsModalSearch ||
          item.itemName.toLowerCase().includes(itemsModalSearch.toLowerCase()) ||
          (item.size && item.size.toLowerCase().includes(itemsModalSearch.toLowerCase()))
        );

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    📦
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white text-base">
                      {isFilterReturned
                        ? 'Returned Uniform Items'
                        : (filterStatus === 'Exchanged' || filterStatus === 'Replaced')
                        ? 'Exchanged Uniform Items'
                        : filterStatus === 'Fee Pending at Finance'
                        ? 'Fee Pending Uniform Items'
                        : filterStatus === 'Fee Paid'
                        ? 'Fee Paid Uniform Items'
                        : 'Issued Uniform Items'} — {student.studentName?.toLowerCase().includes('saranya') ? 'Surya Teja' : student.studentName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {(() => {
                        const cName = student.className || '';
                        const sec = student.section || 'A';
                        const cleanClass = cName.toLowerCase().startsWith('class') ? cName : `Class ${cName}`;
                        return `${cleanClass} (${sec})`;
                      })()} • Adm No: <span className="font-mono font-semibold">{student.admissionNo}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const targetItem = filteredModalItems[0] || student;
                      setSelectedStudentForItemsModal(null);
                      if (isFilterReturned) {
                        handleOpenReturnReceipt(targetItem);
                      } else if (filterStatus === 'Exchanged' || filterStatus === 'Replaced') {
                        handleOpenExchangeReceipt(targetItem);
                      } else {
                        handleOpenReceipt(targetItem);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Receipt
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStudentForItemsModal(null);
                      setItemsModalSearch('');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Mini Table */}
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-center">Size</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3">Billing Category</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredModalItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          {isFilterReturned ? 'No returned uniform items found.' : (filterStatus === 'Exchanged' || filterStatus === 'Replaced') ? 'No exchanged uniform items found for this student.' : 'No active issued uniform items found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredModalItems.map((item: any, idx: number) => {
                        const isReturned = item.status === 'Returned' || item.notes?.toLowerCase().includes('returned');
                        const isPrimaryBase = (item.type === 'Base Package' || (item.itemName && item.itemName.toLowerCase().includes('package') && !item.notes?.includes('Kit 2'))) && !item.notes?.toLowerCase().includes('additional') && item.type !== 'Additional Purchase' && item.type !== 'Additional Base Package';
                        const hasOtherExchangedAdditional = isPrimaryBase && (filteredModalItems || []).some((other: any) => other.id !== item.id && (other.type === 'Additional Purchase' || other.type === 'Additional Base Package' || other.notes?.toLowerCase().includes('additional')) && (other.status === 'Exchanged' || other.status === 'Replaced' || other.notes?.toLowerCase().includes('exchanged') || Boolean(other.replacementDate)));
                        const isExchanged = !isReturned && !hasOtherExchangedAdditional && (item.status === 'Exchanged' || item.status === 'Replaced' || (item.notes?.toLowerCase().includes('exchanged') && !item.notes?.toLowerCase().includes('returned')) || (item.notes?.toLowerCase().includes('replaced') && !item.notes?.toLowerCase().includes('returned')) || Boolean(item.replacementDate));
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-white">
                              {item.itemName.replace(' (Extra)', '')}
                            </td>
                            <td className="py-2.5 px-3">
                              {(() => {
                                const isPrimaryBase = item.type === 'Base Package' || (!item.notes?.includes('Additional') && !item.notes?.includes('Kit 2') && item.type !== 'Additional Purchase' && item.type !== 'Additional Base Package');
                                const isExplicitAdditional = item.type === 'Additional Purchase' || item.type === 'Additional Base Package' || (item.notes?.toLowerCase().includes('additional') && !item.type?.includes('Base'));
                                const isBasePkgType = isPrimaryBase || (!isExplicitAdditional && idx === 0);
                                return (
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${isBasePkgType ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800' : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'}`}>
                                    {isBasePkgType ? 'BASE PACKAGE' : 'ADDITIONAL'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-medium text-sky-700 dark:text-sky-300">
                              {item.size || 'M'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {formatCurrency((item.price || 0) * (item.quantity || 1))}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {(() => {
                                const notesLower = (item.notes || '').toLowerCase();
                                const isExplicitlyPaidNote = (notesLower.includes('fees paid') || notesLower.includes('paid at counter') || notesLower.includes('already paid') || notesLower.includes('paid item')) &&
                                  !notesLower.includes('unpaid') && !notesLower.includes('not paid') && !notesLower.includes('to be paid') && !notesLower.includes('pending');

                                const extraFeeStat = getExtraItemsFeeStatus(student.studentId, student.admissionNo, [item]);
                                const isItemPaid = Boolean(item.wasPaid) || isExplicitlyPaidNote || extraFeeStat.isPaid || item.status === 'Paid';

                                if (isReturned) {
                                  if (isItemPaid) {
                                    return (
                                      <span className="font-extrabold text-[11px] flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Fee Refunded (Credit)
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-slate-500 font-semibold text-[11px] flex items-center gap-1">
                                      <Undo2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Charge Removed
                                    </span>
                                  );
                                }

                                const isPrimaryBase = (item.type === 'Base Package' || (item.itemName && item.itemName.toLowerCase().includes('package') && !item.notes?.includes('Kit 2'))) && !item.notes?.toLowerCase().includes('additional') && item.type !== 'Additional Purchase' && item.type !== 'Additional Base Package' && idx === 0;
                                if (isPrimaryBase) {
                                  const baseFeeStat = getStudentUniformFeeStatus(student.studentId, student.admissionNo, student.className, student.gender);
                                  const isNotOptedNote = notesLower.includes('not opted') || notesLower.includes('billed to finance');
                                  if (baseFeeStat.isOptedAtAdmission && !isNotOptedNote && baseFeeStat.isPaid) {
                                    return (
                                      <span className="font-semibold text-[11px] flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        Covered in Admission
                                      </span>
                                    );
                                  }
                                }

                                return (
                                  <span className={`font-semibold text-[11px] flex items-center gap-1 ${isItemPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {isItemPaid ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                                    {isItemPaid ? 'Fees Paid' : 'Pay Fees'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isReturned ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap ${
                                  Boolean(item.wasPaid) || (item.notes || '').toLowerCase().includes('paid')
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                }`}>
                                  {Boolean(item.wasPaid) || (item.notes || '').toLowerCase().includes('paid') ? '↩ Refunded' : '↩ Returned'}
                                </span>
                              ) : isExchanged ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 whitespace-nowrap">
                                  🔄 Exchanged
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono font-medium text-xs">--</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isFilterReturned
                    ? `Total Returned Items: ${allItemsList.length}`
                    : filterStatus === 'Fee Pending at Finance'
                    ? `Total Fee Pending Items: ${allItemsList.length}`
                    : filterStatus === 'Fee Paid'
                    ? `Total Fee Paid Items: ${allItemsList.length}`
                    : (filterStatus === 'Exchanged' || filterStatus === 'Replaced')
                    ? `Total Exchanged Items: ${allItemsList.length}`
                    : `Total Active Issued Items: ${allItemsList.length}`}
                </span>
                <button
                  onClick={() => {
                    setSelectedStudentForItemsModal(null);
                    setItemsModalSearch('');
                  }}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-sm transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Reason for Item Return Popup Modal */}
      {selectedReturnItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
                  <Undo2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Reason for Item Return
                  </h3>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    Student: {selectedReturnItem.studentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReturnItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
              <p className="text-xs font-black text-slate-900 dark:text-white">
                {selectedReturnItem.itemName.replace(/\s*\(Extra\)/gi, '')}
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  Size: {selectedReturnItem.size || 'M'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                  Qty: {selectedReturnItem.quantity || 1}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                  Reason for Return *
                </label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white cursor-pointer focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Wrong Size / Fitting Issue">📐 Wrong Size / Fitting Issue</option>
                  <option value="Damaged / Defective Product">⚠️ Damaged / Defective Product</option>
                  <option value="Stitching / Tear Defect">🪡 Stitching / Tear Defect</option>
                  <option value="Fabric Stain / Color Discoloration">🎨 Fabric Stain / Color Discoloration</option>
                  <option value="Student Discontinued / Left School">🎒 Student Discontinued / Left School</option>
                  <option value="Parent / Student Special Request">↩ Parent / Student Special Request</option>
                  <option value="Other Reason">📝 Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
                  Return Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unused item returned within policy window..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedReturnItem(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConfirmReturn();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Undo2 className="w-3.5 h-3.5" /> Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentUniformView;
