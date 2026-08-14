import React, { useState } from 'react';
import { UserPlus, Plus, Search, Calendar, User, Users, ShoppingBag, RefreshCw, Undo2, Trash2, X, Printer, ShieldCheck, Receipt, AlertTriangle, CheckCircle2, ChevronDown, CreditCard } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Student, StudentUniformIssue, StudentFeeInstallment } from '../../../types';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { getCategorySizes } from '../../../utils/uniformUtils';
import { Pagination } from '../../common/Pagination';

interface StudentUniformViewProps {
  initialStatusFilter?: string;
}

export const StudentUniformView: React.FC<StudentUniformViewProps> = ({ initialStatusFilter }) => {
  const { selectedAcademicYear } = useAuth();
  const {
    students,
    uniforms,
    uniformInventory,
    studentUniformIssues,
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
    dynamicFeeStructures = []
  } = useData();

  const { addToast } = useToast();

  const getPackageFeeForStudent = (className: string, priceOverride?: number) => {
    if (priceOverride && priceOverride > 0 && priceOverride !== 85) return priceOverride;
    const config = (financeUniformConfigs || []).find(c => 
      c.className?.toLowerCase() === className?.toLowerCase() || 
      (className && c.className && className.toLowerCase().includes(c.className.toLowerCase()))
    );
    if (config && config.feeAmount && config.feeAmount >= 1000) return config.feeAmount;

    const dfs = (dynamicFeeStructures || []).find(d => 
      d.className?.toLowerCase() === className?.toLowerCase() || 
      (className && d.className && className.toLowerCase().includes(d.className.toLowerCase()))
    );
    const dfsItem = dfs?.items?.find(i => 
      i.feeHeadName?.toLowerCase().includes('uniform') || 
      i.feeHeadName?.toLowerCase().includes('kit') || 
      i.feeHeadName?.toLowerCase().includes('accessories')
    );
    if (dfsItem && dfsItem.amount >= 1000) return dfsItem.amount;

    const clsLower = (className || '').toLowerCase();
    if (clsLower.includes('lkg') || clsLower.includes('ukg') || clsLower.includes('nursery') || clsLower.includes('pkg')) {
      return 2000;
    }
    if (clsLower.includes('class 1') || clsLower.includes('class 2') || clsLower.includes('class 3') || clsLower.includes('class 4') || clsLower.includes('class 5') || clsLower.includes('class 6') || clsLower.includes('class 7') || clsLower.includes('class 8')) {
      return 2500;
    }
    if (clsLower.includes('class 9') || clsLower.includes('class 10') || clsLower === '9' || clsLower === '10' || clsLower.includes('9th') || clsLower.includes('10th')) {
      return 3000;
    }
    if (clsLower.includes('class 11') || clsLower.includes('class 12') || clsLower === '11' || clsLower === '12' || clsLower.includes('11th') || clsLower.includes('12th')) {
      return 3500;
    }
    return 3000;
  };

  const getStudentUniformFeeStatus = (studentId: string, studentAdmissionNo?: string, studentClass?: string) => {
    const targetClass = studentClass || '';
    const configAmount = getPackageFeeForStudent(targetClass);

    // Look for actual fee payment receipts in feePayments where Uniform & Accessories base fee was collected
    const baseUniformPayment = (feePayments || []).find(p => {
      const isStudentMatch = p.studentId === studentId || 
        (studentAdmissionNo && (p.studentId === studentAdmissionNo || (p.receiptNo && p.receiptNo.includes(studentAdmissionNo))));
      if (!isStudentMatch || !p.amountPaid || p.amountPaid <= 0) return false;
      if (p.receiptNo?.includes('UNI-EXTRA-')) return false;

      if (p.paymentAllocation && p.paymentAllocation.length > 0) {
        return p.paymentAllocation.some(alloc => {
          const head = (alloc.feeHeadName || alloc.termName || '').toLowerCase();
          return head.includes('uniform') && !head.includes('extra') && !head.includes('blazer') && !head.includes('socks') && !head.includes('shirt') && !head.includes('pant');
        });
      }
      return false;
    });

    if (baseUniformPayment) {
      return {
        isPaid: true,
        status: 'Paid' as const,
        amount: configAmount,
        receiptNo: baseUniformPayment.receiptNo,
        paymentDate: baseUniformPayment.paymentDate,
        paymentMode: baseUniformPayment.paymentMode || 'Cash',
        source: 'Fees Paid Already in Finance'
      };
    }

    // Default: Uniform Fee NOT paid yet -> Fee Pending at Finance
    return {
      isPaid: false,
      status: 'Pending' as const,
      amount: configAmount,
      receiptNo: '',
      paymentDate: '',
      paymentMode: '',
      source: 'Fee Pending at Finance'
    };
  };

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter || 'All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  React.useEffect(() => {
    if (initialStatusFilter) {
      setFilterStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Filter student uniform issues based on query, class, section, status, and academic year
  const filteredIssues = studentUniformIssues.filter(issue => {
    const matchAcademicYear = !selectedAcademicYear || !issue.academicYear || issue.academicYear === selectedAcademicYear;
    const matchQuery =
      issue.studentName.toLowerCase().includes(query.toLowerCase()) ||
      issue.admissionNo.toLowerCase().includes(query.toLowerCase()) ||
      issue.itemName.toLowerCase().includes(query.toLowerCase());
    const matchClass = filterClass === 'All' || issue.className === filterClass || issue.className.includes(filterClass);
    const matchSection = filterSection === 'All' || issue.section === filterSection;
    const matchStatus = filterStatus === 'All' || issue.status === filterStatus;
    return matchAcademicYear && matchQuery && matchClass && matchSection && matchStatus;
  });

  // Compute student grouped entries for pagination & table display
  const groupedMap = new Map<string, {
    id: string;
    studentId: string;
    studentName: string;
    admissionNo: string;
    className: string;
    section: string;
    issueDate: string;
    academicYear: string;
    status: string;
    items: StudentUniformIssue[];
    basePackage?: StudentUniformIssue;
    extraItems: StudentUniformIssue[];
    totalExtraPayable: number;
  }>();

  // Combine students master roster with admissions array to guarantee 100% student availability
  const allEnrolledStudents = React.useMemo(() => {
    const list: Student[] = [];
    (admissions || []).forEach(adm => {
      const admId = adm.id || adm.applicationNo;
      const admNo = adm.applicationNo || adm.id;
      const nameParts = (adm.applicantName || '').trim().split(' ');
      const fName = adm.firstName || nameParts[0] || 'Student';
      const lName = adm.lastName || nameParts.slice(1).join(' ') || '';
      const targetCls = adm.appliedClass || adm.targetClass || adm.className || 'LKG';

      list.push({
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
    });
    return list;
  }, [admissions]);

  // Build distribution grouped entries ONLY from actual issued uniform records
  filteredIssues.forEach(issue => {
    let targetKey = (issue.studentId || issue.admissionNo || issue.studentName || '').trim();

    // Look up existing student in groupedMap by ID, admissionNo, or full name
    const existingEntry = Array.from(groupedMap.entries()).find(([k, g]) =>
      k === targetKey ||
      g.studentId === issue.studentId ||
      (g.admissionNo && g.admissionNo === issue.admissionNo) ||
      g.studentName.toLowerCase() === (issue.studentName || '').toLowerCase()
    );

    const catalogItem = uniforms.find(u => u.category === issue.itemName || u.name === issue.itemName);
    const itemPrice = (issue.price && issue.price > 0)
      ? issue.price
      : (catalogItem && catalogItem.price > 0
          ? catalogItem.price
          : (issue.itemName.includes('Package') ? 3000 : 85));
    const isBasePkg = issue.type === 'Base Package' || issue.itemName.includes('Package') || issue.notes?.includes('Admission Fee');

    if (existingEntry) {
      const grp = existingEntry[1];
      grp.items.push(issue);
      if (isBasePkg) {
        grp.basePackage = issue;
      } else {
        if (!grp.extraItems.some(e => e.id === issue.id)) {
          grp.extraItems.push(issue);
          grp.totalExtraPayable += (itemPrice * (issue.quantity || 1));
        }
      }
    } else {
      groupedMap.set(targetKey, {
        id: issue.id,
        studentId: issue.studentId,
        studentName: issue.studentName,
        admissionNo: issue.admissionNo,
        className: issue.className,
        section: issue.section,
        issueDate: issue.issueDate,
        academicYear: issue.academicYear,
        status: issue.status,
        items: [issue],
        basePackage: isBasePkg ? issue : undefined,
        extraItems: isBasePkg ? [] : [issue],
        totalExtraPayable: isBasePkg ? 0 : (itemPrice * (issue.quantity || 1))
      });
    }
  });

  const groupedList = Array.from(groupedMap.values()).sort((a, b) => {
    const dateA = new Date(a.issueDate || '2026-01-01').getTime();
    const dateB = new Date(b.issueDate || '2026-01-01').getTime();
    return dateB - dateA;
  });
  const paginatedGrouped = groupedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'Issue' | 'Replace' | 'Return'>('Issue');
  const [selectedIssue, setSelectedIssue] = useState<StudentUniformIssue | null>(null);
  
  // Receipt modal states
  const [receiptStudent, setReceiptStudent] = useState<StudentUniformIssue | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptSearchTerm, setReceiptSearchTerm] = useState('');
  const [isReceiptDropdownOpen, setIsReceiptDropdownOpen] = useState(false);

  const handleOpenReceipt = (issue: StudentUniformIssue) => {
    setReceiptStudent(issue);
    setReceiptSearchTerm('');
    setIsReceiptDropdownOpen(false);
    setIsReceiptOpen(true);
  };

  const [customMeasurement, setCustomMeasurement] = useState({
    chest: '',
    waist: '',
    length: '',
    shoulder: ''
  });

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
      type: 'Issue',
      paymentMode: 'Cash',
      notes: ''
    });
    setStudentSearchTerm('');
    setIsStudentDropdownOpen(false);
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
    setIsModalOpen(true);
  };

  const handleOpenReplace = (issue: StudentUniformIssue) => {
    setSelectedIssue(issue);
    setForm({
      studentId: issue.studentId,
      itemId: issue.itemId,
      quantity: issue.quantity,
      size: issue.size,
      type: 'Issue',
      paymentMode: 'Cash',
      notes: issue.notes || ''
    });
    const foundStud = students.find(s => s.id === issue.studentId || (issue.admissionNo && s.admissionNo === issue.admissionNo));
    if (foundStud) {
      setStudentSearchTerm(`${foundStud.firstName} ${foundStud.lastName} (${foundStud.admissionNo || foundStud.id} - ${foundStud.className || 'Class 10'})`);
    } else {
      setStudentSearchTerm(issue.studentName || '');
    }
    setIsStudentDropdownOpen(false);
    setCustomMeasurement({ chest: '', waist: '', length: '', shoulder: '' });
    setIsModalOpen(true);
  };

  const handleReturn = (issue: StudentUniformIssue) => {
    updateStudentUniformIssue(issue.id, {
      status: 'Returned',
      returnDate: new Date().toISOString().split('T')[0],
      notes: 'Returned by student'
    });

    const uItem = uniforms.find(u => u.id === issue.itemId || u.category.toLowerCase() === (issue.itemName || '').toLowerCase());
    const unitPrice = issue.price || (uItem ? uItem.price : (issue.itemName.includes('Package') ? 3000 : 350));
    const refundAmount = unitPrice * issue.quantity;

    if (addFinanceTransaction && refundAmount > 0) {
      addFinanceTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Expense',
        category: 'Uniform Refund',
        sourceModule: 'Uniform',
        referenceNumber: `TXN-UNI-REF-${Date.now().toString().slice(-6)}`,
        description: `Uniform Refund (${formatCurrency(refundAmount)}) - Returned ${issue.quantity}x ${issue.itemName} (${issue.studentName})`,
        amount: refundAmount,
        paymentMode: 'Cash',
        account: 'Main Bank Account',
        status: 'Completed',
        branch: issue.branch || schoolProfile.schoolName || 'Main Campus',
        academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
        createdBy: 'Uniform Counter'
      });
    }

    addToast('info', 'Uniform Returned & Refund Processed', `Recorded item return for ${issue.itemName} (${issue.studentName}). Restored ${issue.quantity} unit(s) to stock & refunded ${formatCurrency(refundAmount)}.`);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.itemId) {
      addToast('warning', 'Validation Error', 'Please select student and uniform item.');
      return;
    }

    const studentObj = allEnrolledStudents.find(s => s.id === form.studentId || s.admissionNo === form.studentId) ||
                       students.find(s => s.id === form.studentId || s.admissionNo === form.studentId);
    // Resolve item from either uniforms list OR uniformCategories (cat_ prefix)
    const isCategoryItem = form.itemId.startsWith('cat_');
    const catId = isCategoryItem ? form.itemId.replace('cat_', '') : null;
    const categoryItem = catId ? (uniformCategories || []).find(c => c.id === catId) : null;
    const itemObj = isCategoryItem
      ? (categoryItem ? { id: form.itemId, category: categoryItem.name, price: 0, availableStock: 9999 } : null)
      : uniforms.find(u => u.id === form.itemId);

    if (!studentObj || !itemObj) return;

    const qty = Number(form.quantity) || 1;
    const finalSize = getResolvedSize();

    // Check inventory stock
    const inv = uniformInventory.find(x => x.itemId === form.itemId || x.itemName.toLowerCase() === itemObj.category.toLowerCase());
    const currentStockAvailable = inv ? inv.currentStock : (itemObj.availableStock !== undefined ? itemObj.availableStock : 0);

    if (currentStockAvailable < qty) {
      addToast('error', 'Insufficient Stock', `Insufficient stock for ${itemObj.category}. Only ${currentStockAvailable} units available in stock.`);
      return;
    }

    if (modalType === 'Issue') {
      const isPackage = itemObj.category.includes('Package');
      const isAddPurchase = form.type === 'Additional Purchase';
      const feeStatus = getStudentUniformFeeStatus(studentObj.id, studentObj.admissionNo, studentObj.className);

      if (isPackage && !isAddPurchase && qty > 1) {
        const pkgFee = getPackageFeeForStudent(studentObj.className, itemObj.price);
        const extraQty = qty - 1;
        const extraTotal = pkgFee * extraQty;

        // 1. Issue 1 Base Package (always free — covered in Admission)
        addStudentUniformIssue({
          studentId: form.studentId,
          studentName: `${studentObj.firstName} ${studentObj.lastName}`,
          admissionNo: studentObj.admissionNo || 'ADM2026-000',
          className: studentObj.className || 'Class 10',
          section: studentObj.section || 'A',
          itemId: form.itemId,
          itemName: itemObj.category,
          size: finalSize,
          quantity: 1,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'Issued',
          academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
          type: 'Base Package',
          price: pkgFee,
          notes: form.notes || 'Covered under Admission Fee Package'
        });

        // 2. Issue extra quantity as Additional Purchase
        addStudentUniformIssue({
          studentId: form.studentId,
          studentName: `${studentObj.firstName} ${studentObj.lastName}`,
          admissionNo: studentObj.admissionNo || 'ADM2026-000',
          className: studentObj.className || 'Class 10',
          section: studentObj.section || 'A',
          itemId: form.itemId,
          itemName: `${itemObj.category} (Extra)`,
          size: finalSize,
          quantity: extraQty,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'Issued',
          academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
          type: 'Additional Purchase',
          price: pkgFee,
          notes: `Additional Purchase - ${extraQty} extra package(s) — Added to Fee Account (Collect from Finance & Fees)`
        });

        // 3. Add extra amount as PENDING fee in Finance Ledger (not collected at counter)
        if (addFinanceTransaction && extraTotal > 0) {
          addFinanceTransaction({
            date: new Date().toISOString().split('T')[0],
            type: 'Income',
            category: 'Uniform',
            sourceModule: 'Uniform',
            referenceNumber: `UNI-EXTRA-${Date.now().toString().slice(-6)}`,
            description: `Uniform Extra Item Pending — ${extraQty}x ${itemObj.category} (${studentObj.firstName} ${studentObj.lastName} • ${studentObj.admissionNo}) — Collect from Fee Collection`,
            amount: extraTotal,
            paymentMode: 'Cash',
            account: 'Main Bank Account',
            status: 'Pending',
            branch: studentObj.branch || 'Main Campus',
            academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
            createdBy: 'Uniform Distribution'
          });
        }

        // 4. Inject as StudentFeeInstallment so it shows as a checkbox row in Fee Collection
        const acYear = selectedAcademicYear || financeSettings.academicYear || '2026-2027';
        const installmentId = `FEE-UNI-EXTRA-${Date.now()}-${form.studentId.slice(-4)}`;
        const feeInstallment: StudentFeeInstallment = {
          id: installmentId,
          studentId: form.studentId,
          academicYear: acYear,
          feeAssignmentId: `FA-UNI-${form.studentId}`,
          feeHeadId: 'FH-UNI-EXTRA',
          feeHeadName: 'Uniform & Accessories',
          frequency: 'One Time',
          termName: `${itemObj.category} — Size: ${finalSize} × ${extraQty}`,
          dueDate: new Date().toISOString().split('T')[0],
          amount: extraTotal,
          paidAmount: 0,
          dueAmount: extraTotal,
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setStudentFeeInstallments(prev => [...prev, feeInstallment]);

        addToast('success', 'Kit Issued — Extra Added to Fee Account', `Base kit issued (covered in Admission). ${extraQty} extra package(s) worth ${formatCurrency(extraTotal)} added to ${studentObj.firstName}'s fee account. Collect from Finance & Fees > Fee Collection.`);
      } else {
        const pkgFee = getPackageFeeForStudent(studentObj.className, itemObj.price);
        
        // Check if student ALREADY has an issued Base Package
        const hasExistingBasePackage = (studentUniformIssues || []).some(
          iss => (iss.studentId === studentObj.id || (studentObj.admissionNo && iss.admissionNo === studentObj.admissionNo)) &&
                 iss.status === 'Issued' &&
                 (iss.type === 'Base Package' || (iss.itemName.includes('Package') && !iss.itemName.includes('(Extra)')))
        );

        // If explicitly set to Additional Purchase, OR item is not a Package, OR student already has a Base Package -> MUST be Additional Purchase!
        const actualIsAddPurchase = isAddPurchase || !isPackage || hasExistingBasePackage;
        const itemUnitPrice = (itemObj.price && itemObj.price > 0) ? itemObj.price : (isPackage ? pkgFee : 350);
        const itemDisplayName = actualIsAddPurchase && !itemObj.category.includes('(Extra)') ? `${itemObj.category} (Extra)` : itemObj.category;

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
          type: actualIsAddPurchase ? 'Additional Purchase' : 'Base Package',
          price: itemUnitPrice,
          notes: actualIsAddPurchase
            ? `Additional Purchase — Added to Fee Account (Collect from Finance & Fees)`
            : (form.notes || 'Covered under Admission Fee Package')
        });

        if (actualIsAddPurchase) {
          // Add additional purchase as PENDING fee in Finance Ledger — not collected at counter
          const totalSale = itemUnitPrice * qty;
          if (addFinanceTransaction && totalSale > 0) {
            addFinanceTransaction({
              date: new Date().toISOString().split('T')[0],
              type: 'Income',
              category: 'Uniform',
              sourceModule: 'Uniform',
              referenceNumber: `UNI-EXTRA-${Date.now().toString().slice(-6)}`,
              description: `Uniform Extra Item Pending — ${qty}x ${itemObj.category} (${studentObj.firstName} ${studentObj.lastName} • ${studentObj.admissionNo || studentObj.id}) — Collect from Fee Collection`,
              amount: totalSale,
              paymentMode: 'Cash',
              account: 'Main Bank Account',
              status: 'Pending',
              branch: studentObj.branch || 'Main Campus',
              academicYear: selectedAcademicYear || financeSettings.academicYear || '2026-2027',
              createdBy: 'Uniform Distribution'
            });
          }

          // Inject as StudentFeeInstallment so it shows as a checkbox row in Fee Collection
          const acYear2 = selectedAcademicYear || financeSettings.academicYear || '2026-2027';
          const installmentId2 = `FEE-UNI-EXTRA-${Date.now()}-${form.studentId.slice(-4)}`;
          const feeInstallment2: StudentFeeInstallment = {
            id: installmentId2,
            studentId: form.studentId,
            academicYear: acYear2,
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
          setStudentFeeInstallments(prev => [...prev, feeInstallment2]);

          addToast('success', 'Extra Item Issued — Added to Fee Account', `${qty}x ${itemObj.category} issued and ${formatCurrency(totalSale)} added as pending fee to ${studentObj.firstName}'s account. Collect from Finance & Fees > Fee Collection.`);
        } else {
          // Base Kit — always free (covered in Admission)
          addToast('success', 'Uniform Kit Issued', `Assigned ${qty}x ${itemObj.category} to ${studentObj.firstName} ${studentObj.lastName}. Covered under Admission Fee Package.`);
        }
      }
    } else if (modalType === 'Replace' && selectedIssue) {
      updateStudentUniformIssue(selectedIssue.id, {
        status: 'Replaced',
        size: finalSize,
        replacementDate: new Date().toISOString().split('T')[0],
        notes: 'Replaced with size ' + finalSize
      });
      addToast('success', 'Size Replaced', `Successfully completed item exchange to size ${finalSize}.`);
    }

    setIsModalOpen(false);
  };

  const selectedUniformObj = uniforms.find(u => u.id === form.itemId);
  const selectedInvItem = uniformInventory.find(x => x.itemId === form.itemId || (selectedUniformObj && x.itemName.toLowerCase() === selectedUniformObj.category.toLowerCase()));
  const currentSelectedStock = selectedInvItem ? selectedInvItem.currentStock : (selectedUniformObj?.availableStock !== undefined ? selectedUniformObj.availableStock : 0);

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
            onClick={() => {
              const firstIssue = studentUniformIssues[0];
              if (firstIssue) {
                handleOpenReceipt(firstIssue);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            title="Open Receipt Dialog & Choose Student Data to Print"
          >
            <Printer className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Print
          </button>

          <button
            onClick={handleOpenIssue}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
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
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer w-full sm:w-36"
          >
            <option value="All">All Statuses</option>
            <option value="Issued">Issued</option>
            <option value="Returned">Returned</option>
            <option value="Replaced">Replaced</option>
          </select>
        </div>
      </div>

      {/* Results Table with Admissions Register Column Borders */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50/90 dark:bg-slate-800/90 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr className="divide-x divide-slate-200/70 dark:divide-slate-800/80">
                <th className="py-3.5 px-4">Student & Adm No</th>
                <th className="py-3.5 px-4">Class & Sec</th>
                <th className="py-3.5 px-4">Base Package</th>
                <th className="py-3.5 px-4">Additional Purchases</th>
                <th className="py-3.5 px-4 text-center">Size</th>
                <th className="py-3.5 px-4">Billing Category</th>
                <th className="py-3.5 px-4 text-center">Qty</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paginatedGrouped.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">No student uniform transactions logged.</td>
                  </tr>
                ) : (
                  paginatedGrouped.map(g => {
                    const displayClass = g.className.includes('-') ? g.className.split('-')[0].trim() : g.className;
                    const displaySection = g.section || (g.className.includes('-') ? g.className.split('-')[1].trim() : 'A');
                    const basePkgFee = g.basePackage ? getPackageFeeForStudent(g.className, g.basePackage.price) : 0;
                    const totalItemCount = g.items.reduce((sum, item) => sum + item.quantity, 0);
                    const feeStatus = getStudentUniformFeeStatus(g.studentId, g.admissionNo, g.className);

                    return (
                      <tr key={g.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors divide-x divide-slate-100 dark:divide-slate-800/70">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                            {g.studentName}
                            {feeStatus.isPaid ? (
                              <span title={`Uniform Fee Paid — ${feeStatus.source}`} className="inline-flex">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              </span>
                            ) : (
                              <span title={`Uniform Fee Unpaid — ${feeStatus.source}`} className="inline-flex">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] font-mono font-bold text-slate-400">{g.admissionNo}</p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {displayClass} <span className="text-sky-600 dark:text-sky-400 font-extrabold">({displaySection})</span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {g.basePackage ? (
                            <span className="font-extrabold text-sky-700 dark:text-sky-300 text-xs">
                              {g.basePackage.itemName
                                .replace('Uniform Package (Admission Kit)', 'Package')
                                .replace('Uniform Package', 'Package')
                                .replace(' (Admission Kit)', '')}
                            </span>
                          ) : (
                            <div className="text-center font-bold text-slate-400 text-xs">--</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {g.extraItems.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {g.extraItems.map(ext => (
                                <div key={ext.id} className="h-6 flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                                  <span className="font-semibold">{ext.itemName.replace(' (Extra)', '')}</span>
                                  {ext.quantity > 1 && (
                                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md">x{ext.quantity}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center font-bold text-slate-400 text-xs">--</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {(() => {
                            const getItemSize = (item: StudentUniformIssue) => {
                              if (item.size && item.size.trim() !== '' && item.size !== 'Standard') {
                                return item.size.trim();
                              }
                              const lowerName = (item.itemName || '').toLowerCase();
                              if (lowerName.includes('tie') || lowerName.includes('belt') || lowerName.includes('socks') || lowerName.includes('ribbon') || lowerName.includes('crest')) {
                                return 'Free Size';
                              }
                              if (lowerName.includes('shoes')) {
                                return '8';
                              }
                              return 'M';
                            };

                            if (g.extraItems.length > 0) {
                              return (
                                <div className="flex flex-col gap-2 items-center">
                                  {g.extraItems.map(ext => (
                                    <div key={ext.id} className="h-6 flex items-center justify-center">
                                      <span className="font-mono font-bold text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/60">
                                        {getItemSize(ext)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            if (g.basePackage) {
                              return (
                                <div className="h-6 flex items-center justify-center">
                                  <span className="font-mono font-bold text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/60">
                                    {getItemSize(g.basePackage)}
                                  </span>
                                </div>
                              );
                            }

                            return <div className="text-center font-bold text-slate-400 text-xs">--</div>;
                          })()}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 w-fit">
                            {g.basePackage && (
                              <span 
                                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border flex items-center justify-center gap-1 text-center ${
                                  feeStatus.isPaid 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : (feeStatus.status as string) === 'Partial'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                                      : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300'
                                }`}
                                title={feeStatus.isPaid 
                                  ? `Fees Paid Already in Finance (${feeStatus.receiptNo || 'Paid'})` 
                                  : `Fee Unpaid in Finance — Student must pay admission/school fees at Finance & Fees module first`}
                              >
                                {feeStatus.isPaid ? (
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 inline shrink-0" />
                                ) : (
                                  <AlertTriangle className={`w-3 h-3 inline shrink-0 ${(feeStatus.status as string) === 'Partial' ? 'text-amber-500' : 'text-red-500'}`} />
                                )}
                                Base ({formatCurrency(basePkgFee)}) {feeStatus.isPaid ? '• Fees Paid Already' : (feeStatus.status as string) === 'Partial' ? '• Partial Fee' : '• Fee Pending at Finance'}
                              </span>
                            )}
                            {!g.basePackage && !feeStatus.isPaid && (
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border flex items-center justify-center gap-1 text-center bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300"
                                title="Fee Pending at Finance — Pay fees in Finance & Fees module first"
                              >
                                <AlertTriangle className="w-3 h-3 text-red-500 inline shrink-0" />
                                Fee Pending at Finance
                              </span>
                            )}
                            {g.extraItems.length > 0 && g.totalExtraPayable > 0 && (
                              <span 
                                className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 text-center flex items-center justify-center w-full"
                                title="Extra Purchase — Pay Fees at Finance"
                              >
                                Extras (+{formatCurrency(g.totalExtraPayable)}) • Pay Fees at Finance
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {totalItemCount}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                          {g.issueDate}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Badge variant={g.status === 'Issued' ? 'success' : (g.status === 'Returned' ? 'neutral' : 'warning')}>
                            {g.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {g.status === 'Issued' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleReturn(g.items[0])}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-extrabold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                                title="Return Uniform Item"
                              >
                                <Undo2 className="w-3 h-3 text-slate-500" /> Return
                              </button>
                              <button
                                onClick={() => handleOpenReplace(g.items[0])}
                                className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950 dark:hover:bg-sky-900 dark:text-sky-300 font-extrabold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-sky-200 dark:border-sky-800/80 shadow-2xs"
                                title="Exchange Uniform Size"
                              >
                                <RefreshCw className="w-3 h-3 text-sky-500" /> Exch
                              </button>
                              <button
                                onClick={() => {
                                  if (g.items[0]) {
                                    deleteStudentUniformIssue(g.items[0].id);
                                    addToast('info', 'Record Removed & Stock Restored', `Removed uniform issue record for ${g.studentName}. Restored ${g.items[0].quantity} unit(s) back to warehouse stock inventory.`);
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 font-extrabold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-rose-200 dark:border-rose-800/80 shadow-2xs"
                                title="Remove Distribution Record & Restore Stock"
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" /> Delete
                              </button>
                            </div>
                          ) : (
                            <div className="text-center font-bold text-slate-400 text-xs">--</div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
        </div>
      </div>

      <div className="print:hidden">
        <Pagination
          currentPage={currentPage}
          totalItems={groupedList.length}
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
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-500" />
                {modalType === 'Issue' ? 'Uniform Kit Allocation & Dispatch' : 'Replace Size'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {modalType === 'Issue' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Transaction Type *</label>
                    <select
                      value={form.type}
                      onChange={e => {
                        const newType = e.target.value as any;
                        setForm({ ...form, type: newType, itemId: '' });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-bold"
                    >
                      <option value="Issue">Baseline Distribution (Admission Kit)</option>
                      <option value="Additional Purchase">Additional Purchase (Direct Billing)</option>
                    </select>
                    {form.type === 'Additional Purchase' && (
                      <div className="mt-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-start gap-2.5 text-[11px]">
                        <span className="shrink-0 text-base leading-none">💳</span>
                        <div className="font-semibold text-purple-900 dark:text-purple-200 leading-snug">
                          <strong>Additional Purchase (Must be Paid at Finance):</strong> Whatever uniform items the student buys additionally apart from the base package must be paid at Finance & Fees. This item is automatically billed to the student's Fee Account as a selectable checkbox row with its price in Finance & Fees &gt; Fee Collection.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Select Student *
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
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all text-xs"
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
                                    setForm({ ...form, studentId: s.id });
                                    setStudentSearchTerm(`${s.firstName} ${s.lastName} (${s.admissionNo || s.id} - ${s.className || 'Class 10'})`);
                                    setIsStudentDropdownOpen(false);
                                  }}
                                  className={`px-3.5 py-2.5 cursor-pointer transition-all flex items-center justify-between text-xs ${
                                    isSelected 
                                      ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-900 dark:text-sky-100 font-extrabold' 
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-semibold'
                                  }`}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className={`font-extrabold text-xs ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-900 dark:text-white'}`}>
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
                </>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Primary Base Package / Main Item *</label>
                {(() => {
                  const selStudentForFee = form.studentId
                    ? allEnrolledStudents.find(s => s.id === form.studentId)
                    : null;
                  const selStudentFeeStatus = selStudentForFee
                    ? getStudentUniformFeeStatus(selStudentForFee.id, selStudentForFee.admissionNo, selStudentForFee.className)
                    : null;

                  return (
                    <>
                      <select
                        disabled={modalType === 'Replace'}
                        value={form.itemId || ''}
                        onChange={e => setForm({ ...form, itemId: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-60 text-xs font-bold text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">
                          {form.type === 'Additional Purchase' ? 'Select Additional Uniform Item *' : 'Select Base Package (Boys / Girls) *'}
                        </option>

                        {/* IF Baseline Distribution (Admission Kit) -> ONLY Show Base Packages (Boys & Girls) */}
                        {form.type !== 'Additional Purchase' && (
                          <optgroup label="Standard Admission Kit Base Packages (Girls & Boys)">
                            {(() => {
                              const packageItems = (uniforms || []).filter(u => (u.category || '').includes('Package') || (u.name || '').includes('Package'));
                              const catPackages = (uniformCategories || []).filter(c => {
                                const cName = c.name || (c as any).categoryName || '';
                                return cName.includes('Package') || cName.includes('Kit');
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

                              const classFee = getPackageFeeForStudent(selStudentForFee?.className || 'Class 10');

                              return combined.map(u => {
                                return (
                                  <option key={u.id} value={u.id}>
                                    •  {u.category || u.name} — ({formatCurrency(classFee)})
                                  </option>
                                );
                              });
                            })()}
                          </optgroup>
                        )}

                        {/* IF Additional Purchase (Direct Billing) -> ONLY Show Additional Clothes / Individual Items */}
                        {form.type === 'Additional Purchase' && (
                          <optgroup label="Individual Additional Clothes & Accessories">
                            {(() => {
                              const individualItems = (uniforms || []).filter(u => !((u.category || '').includes('Package') || (u.name || '').includes('Package')));
                              return individualItems.map(u => (
                                <option key={u.id} value={u.id}>
                                  •  {u.category || u.name} — ({formatCurrency(u.price)})
                                </option>
                              ));
                            })()}
                          </optgroup>
                        )}
                      </select>

                      {(() => {
                        const selUniform = uniforms.find(u => u.id === form.itemId);
                        let targetCat = selUniform ? (selUniform.category || selUniform.name) : '';
                        if (!targetCat && form.itemId?.startsWith('cat_')) {
                          const catObj = (uniformCategories || []).find(c => c.id === form.itemId.replace('cat_', ''));
                          targetCat = catObj ? catObj.name : '';
                        }
                        const isPackageItem = targetCat ? (targetCat.toLowerCase().includes('package') || targetCat.toLowerCase().includes('kit')) : true;

                        if (form.studentId && selStudentFeeStatus && isPackageItem && form.type !== 'Additional Purchase') {
                          if (selStudentFeeStatus.isPaid) {
                            return (
                              <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between animate-in fade-in shadow-2xs">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                      ✅ Base Package Uniform Fee: Fees Paid Already in Finance ({formatCurrency(selStudentFeeStatus.amount)})
                                    </p>
                                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                      Fees Paid Already in Finance {selStudentFeeStatus.receiptNo ? `• Ref #${selStudentFeeStatus.receiptNo}` : ''} • Base Package kit is covered (₹0 extra charge at dispatch counter).
                                    </p>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-xl bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-[10px] font-black uppercase tracking-wider shrink-0">
                                  FEES PAID ALREADY
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between animate-in fade-in shadow-2xs">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                      ⚠️ Base Package Uniform Fee: Fee Pending at Finance ({formatCurrency(selStudentFeeStatus.amount)})
                                    </p>
                                    <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                                      Uniform fee has not been paid yet in Finance & Fees. Please collect uniform fee at Finance module.
                                    </p>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-xl bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-[10px] font-black uppercase tracking-wider shrink-0">
                                  FEE PENDING IN FINANCE
                                </span>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Size Specification *</label>
                  <select
                    value={form.size || ''}
                    onChange={e => setForm({ ...form, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-semibold"
                  >
                    <option value="">Select Size *</option>
                    {(() => {
                      const selUniform = uniforms.find(u => u.id === form.itemId);
                      let targetCategoryOrName = selUniform ? selUniform.category : '';
                      if (!targetCategoryOrName && form.itemId.startsWith('cat_')) {
                        const catId2 = form.itemId.replace('cat_', '');
                        const cat = (uniformCategories || []).find(c => c.id === catId2);
                        targetCategoryOrName = cat ? cat.name : '';
                      }
                      return getCategorySizes(targetCategoryOrName).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Quantity *</label>
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border disabled:opacity-60"
                  />
                </div>
              </div>

              {(() => {
                const selectedItemObj = uniforms.find(u => u.id === form.itemId);
                const selectedStudentObj = students.find(s => s.id === form.studentId);
                const isPkg = selectedItemObj?.category.includes('Package');
                if (form.type === 'Issue' && isPkg && Number(form.quantity) > 1) {
                  const pkgFee = getPackageFeeForStudent(selectedStudentObj?.className || '', selectedItemObj?.price);
                  const extraCount = Number(form.quantity) - 1;
                  const extraPrice = pkgFee * extraCount;
                  return (
                    <div className="p-3 rounded-2xl bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 space-y-1 animate-in fade-in">
                      <span className="text-[11px] font-extrabold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                        <span>💡</span> Package Quantity Split Billing Notice:
                      </span>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong>1 Package</strong> is covered under the baseline Admission Fee Kit. The remaining <strong>{extraCount} Package(s)</strong> will be automatically billed as an Additional Purchase (<strong>+{formatCurrency(extraPrice)}</strong>) in the Finance Ledger.
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

              {/* Live stock & bill summary box */}
              {selectedUniformObj && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Available Warehouse Stock:</span>
                    <span className={`font-bold ${currentSelectedStock >= (Number(form.quantity) || 1) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {currentSelectedStock} Units {currentSelectedStock < (Number(form.quantity) || 1) ? '(Insufficient Stock)' : ''}
                    </span>
                  </div>

                  {(() => {
                    const selStudentObj = students.find(s => s.id === form.studentId);
                    if (!selStudentObj) return null;
                    const pkgFee = getPackageFeeForStudent(selStudentObj.className, selectedUniformObj.price);
                    const qtyVal = Number(form.quantity) || 1;
                    const isAddPurchase = form.type === 'Additional Purchase';

                    let extraCharge = 0;

                    if (isAddPurchase) {
                      extraCharge = (selectedUniformObj.price || 0) * qtyVal;
                    } else {
                      // Base Package — always covered. Only extra qty above 1 goes to fee account
                      if (qtyVal > 1) {
                        extraCharge = pkgFee * (qtyVal - 1);
                      }
                    }

                    return (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600 dark:text-slate-400">
                            Admission Kit Fee ({formatCurrency(pkgFee)}):
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹0 (Covered in Admission Fee)</span>
                        </div>

                        {extraCharge > 0 && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-600 dark:text-slate-400">
                              Extra Items (billed to Fee Account):
                            </span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              +{formatCurrency(extraCharge)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-700 text-xs font-black">
                          <span className="text-slate-900 dark:text-white">Amount Added to Student Fee Account:</span>
                          <span className={extraCharge > 0 ? 'text-purple-600 dark:text-purple-400 text-sm' : 'text-emerald-600 dark:text-emerald-400'}>
                            {extraCharge > 0 ? formatCurrency(extraCharge) : '₹0 — Fully Covered'}
                          </span>
                        </div>

                        {extraCharge > 0 && (
                          <div className="mt-1 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                            <span className="text-blue-500 shrink-0 text-sm">ℹ️</span>
                            <p className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 leading-relaxed">
                              <strong>No payment at counter.</strong> {formatCurrency(extraCharge)} will be added to this student's fee account as a pending due. Collect from <strong>Finance & Fees › Fee Collection</strong>.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Action Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Standard issue, winter uniform"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-2 bg-white dark:bg-slate-900">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {isReceiptOpen && receiptStudent && (() => {
        const studentIssues = studentUniformIssues.filter(
          x => x.studentId === receiptStudent.studentId || x.admissionNo === receiptStudent.admissionNo
        );

        const basePackageItems = studentIssues.filter(
          i => i.type === 'Base Package' || i.itemName.includes('Package') || i.notes?.includes('Admission Fee')
        );

        const extraPurchaseItems = studentIssues.filter(
          i => !(i.type === 'Base Package' || i.itemName.includes('Package') || i.notes?.includes('Admission Fee'))
        );

        const totalExtraPayable = extraPurchaseItems.reduce((acc, item) => {
          const price = item.price || (uniforms.find(u => u.category === item.itemName)?.price || 0);
          return acc + (price * item.quantity);
        }, 0);

        const studentPackageFee = getPackageFeeForStudent(
          receiptStudent.className,
          basePackageItems[0]?.price
        );

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
                    {/* Switch Student Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptSearchTerm('');
                        setIsReceiptDropdownOpen(prev => !prev);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Switch Student
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isReceiptDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print
                    </button>
                    <button type="button" onClick={() => setIsReceiptOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Current Student Label */}
                <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-sky-900 dark:text-sky-200 truncate">{receiptStudent.studentName}</p>
                    <p className="text-[10px] font-mono text-sky-600 dark:text-sky-400">{receiptStudent.admissionNo} • {receiptStudent.className}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200 text-[10px] font-black uppercase">Viewing</span>
                </div>

                {/* Switch Student Search Panel */}
                {isReceiptDropdownOpen && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search by name, admission no, or class..."
                          value={receiptSearchTerm}
                          onChange={e => setReceiptSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-1.5">
                      {(() => {
                        const filtered = uniqueStudentsWithIssues.filter(s => {
                          const term = receiptSearchTerm.toLowerCase().trim();
                          if (!term) return true;
                          return (
                            s.studentName.toLowerCase().includes(term) ||
                            s.admissionNo.toLowerCase().includes(term) ||
                            (s.className || '').toLowerCase().includes(term)
                          );
                        });
                        if (filtered.length === 0) {
                          return (
                            <div className="py-4 text-center text-xs font-semibold text-slate-400">
                              No students match "{receiptSearchTerm}"
                            </div>
                          );
                        }
                        return filtered.map(s => {
                          const isSelected = receiptStudent?.studentId === s.studentId || receiptStudent?.admissionNo === s.admissionNo;
                          return (
                            <div
                              key={s.studentId || s.admissionNo}
                              onClick={() => {
                                setReceiptStudent(s);
                                setReceiptSearchTerm('');
                                setIsReceiptDropdownOpen(false);
                              }}
                              className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                                isSelected
                                  ? 'bg-sky-600 text-white font-extrabold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-extrabold text-xs">{s.studentName}</span>
                                <span className={`text-[10px] font-mono ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                                  {s.admissionNo} • {s.className}
                                </span>
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Printable Receipt Card Body */}
              <div id="printable-receipt" className="printable-area p-4 bg-white text-slate-900 rounded-2xl border border-slate-200 space-y-4 text-xs overflow-y-auto flex-1">
                
                {/* Header Banner with Pirnav Logo & Dynamic School Info */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex items-center justify-center shrink-0">
                      <svg className="w-12 h-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="46" fill="url(#pirnav-grad-receipt)" stroke="#0284c7" strokeWidth="2.5" />
                        <path d="M50 16 L76 31 V65 L50 80 L24 65 V31 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                        <path d="M50 23 L68 34 V60 L50 69 L32 60 V34 Z" fill="#0284c7" />
                        <text x="50" y="56" fontSize="28" fontWeight="900" fontFamily="sans-serif" fill="#ffffff" textAnchor="middle">P</text>
                        <path d="M35 66 Q50 74 65 66" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        <defs>
                          <linearGradient id="pirnav-grad-receipt" x1="0" y1="0" x2="100" y2="100">
                            <stop offset="0%" stopColor="#0f172a" />
                            <stop offset="100%" stopColor="#0369a1" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-none">
                        {schoolProfile?.name || "Pirnav International Schools"}
                      </h1>
                      <p className="text-[11px] text-sky-700 font-bold mt-1">
                        Uniform Store & Distribution Department
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {schoolProfile?.address || "Knowledge Campus, Sector 12, Main City Road"} | Ph: {schoolProfile?.phone || "+91 98765 43210"}
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
                    <p className="font-black text-sm text-slate-900">{receiptStudent.studentName}</p>
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
                  const receiptFeeStatus = receiptStudent ? getStudentUniformFeeStatus(receiptStudent.studentId, receiptStudent.admissionNo, receiptStudent.className) : null;
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
                                {basePackageItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="py-3 px-3 text-center text-slate-400 italic">No baseline admission package items claimed.</td>
                                  </tr>
                                ) : (
                                  basePackageItems.map(item => {
                                    const itemIsCounter = isCounterCollected || item.notes?.toLowerCase().includes('counter') || item.notes?.toLowerCase().includes('mandatory');
                                    return (
                                      <tr key={item.id} className="font-medium hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.itemName}</td>
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.size}</td>
                                        <td className="py-2.5 px-3 text-right font-semibold">{item.quantity}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">{formatCurrency(item.price || studentPackageFee)}</td>
                                        <td className="py-2.5 px-3 text-center">
                                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border shadow-2xs ${
                                            itemIsCounter || receiptFeeStatus?.isPaid 
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                              : 'bg-sky-100 text-sky-800 border-sky-300'
                                          }`}>
                                            {itemIsCounter 
                                              ? `Paid at Uniform Counter (${formatCurrency(studentPackageFee)})`
                                              : receiptFeeStatus?.isPaid
                                                ? `Fees Paid Already (${formatCurrency(studentPackageFee)})`
                                                : `Fee Pending at Finance (${formatCurrency(studentPackageFee)})`
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

                          {/* 2. Additional Items Table (Outside Base Package) */}
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
                                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                                  <th className="py-2.5 px-3 text-right">Amount Payable</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {extraPurchaseItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="py-3 px-3 text-center text-slate-400 italic">No additional out-of-package items purchased.</td>
                                  </tr>
                                ) : (
                                  extraPurchaseItems.map(item => {
                                    const price = item.price || (uniforms.find(u => u.category === item.itemName)?.price || 0);
                                    return (
                                      <tr key={item.id} className="font-medium hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.itemName}</td>
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.size}</td>
                                        <td className="py-2.5 px-3 text-right font-semibold">{item.quantity}</td>
                                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatCurrency(price)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">{formatCurrency(price * item.quantity)}</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Summary Box */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-2 text-xs shadow-xs">
                            <div className="flex justify-between text-slate-600 font-medium">
                              <span>Base Package Fee:</span>
                              <span className="font-mono text-emerald-700 font-bold">
                                {formatCurrency(studentPackageFee)} (Covered in Admission Fee)
                              </span>
                            </div>
                            {totalExtraPayable > 0 && (
                              <div className="flex justify-between text-slate-600 font-medium">
                                <span>Additional Out-of-Package Items Total:</span>
                                <span className="font-mono font-bold text-purple-700">{formatCurrency(totalExtraPayable)}</span>
                              </div>
                            )}
                            <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-xs font-extrabold text-slate-900">
                              <span>{totalExtraPayable > 0 ? 'Amount Due in Finance & Fees (Collect from Fee Collection):' : 'Total:'}</span>
                              <span className={`text-sm font-black font-mono px-2.5 py-1 rounded-md border ${totalExtraPayable > 0 ? 'text-sky-700 bg-sky-50 border-sky-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>
                                {totalExtraPayable > 0 ? formatCurrency(totalExtraPayable) : '₹0 (Fully Covered)'}
                              </span>
                            </div>
                            {totalExtraPayable > 0 && (
                              <p className="text-[9px] font-semibold text-sky-700 mt-1">
                                ⚠ Extra item charges are pending and added in Fees &gt; Fee Collection.
                              </p>
                            )}
                      </div>
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
    </div>
  );
};
export default StudentUniformView;
