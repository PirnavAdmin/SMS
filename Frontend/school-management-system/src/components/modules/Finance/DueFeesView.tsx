import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { formatDateForDisplay } from '../../../utils/dateValidation';
import {
  Clock,
  Search,
  AlertCircle,
  IndianRupee,
  Filter,
  Calendar,
  Bus,
  Home,
  Shirt,
  AlertTriangle,
  FileText,
  BookOpen,
  ChevronRight,
  XCircle,
  Download,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { matchesClassName } from '../../../utils/classSorter';
import { exportToExcel } from '../../../utils/excelExport';

import { resolveMediaUrl } from '../../../utils/mediaUtils';

interface DueFeesViewProps {
  onCollectStudentFee?: (student: Student) => void;
  onCollectClick?: (studentId: any) => void;
  initialClass?: string;
  initialFeeHead?: string;
}

export const DueFeesView: React.FC<DueFeesViewProps> = ({
  onCollectStudentFee,
  onCollectClick,
  initialClass = 'All',
  initialFeeHead = 'All',
}) => {
  const {
    students,
    getStudentFeeLedger,
    academicClasses,
    academicYearFeeSchedules,
    feeHeads,
    financeSettings,
    dynamicFeeStructures,
    studentFeeAssignments,
    studentTransports,
    studentHostels,
    schoolProfile,
  } = useData();

  const { selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const activeAYDefault = selectedAcademicYear || financeSettings?.academicYear || "2026-2027";

  const [query, setQuery] = useState('');
  const [selectedAY, setSelectedAY] = useState(activeAYDefault);
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('All');
  const [selectedFeeHead, setSelectedFeeHead] = useState(initialFeeHead);
  const [selectedDueDate, setSelectedDueDate] = useState('All');
  const [timelineFilter, setTimelineFilter] = useState<'All' | 'Overdue' | 'Current' | 'Upcoming'>('All');

  const uniqueSections = Array.from(new Set(students.map(st => st.section))).filter(Boolean).sort();
  const scheduleForAY = academicYearFeeSchedules.find(s => s.academicYear === selectedAY);
  const termsList = scheduleForAY ? scheduleForAY.terms : [];
  const uniqueDueDates = Array.from(new Set(termsList.map((t: any) => t.dueDate))).filter(Boolean).sort();

  const todayStr = new Date().toISOString().split("T")[0];

  // Category-wise aggregate dues calculation (100% dynamic from configured Fee Heads & Ledgers)
  const categoryWiseDues = React.useMemo(() => {
    const catMap: Record<
      string,
      { categoryName: string; totalOutstanding: number; overdueAmount: number; studentSet: Set<string> }
    > = {};

    const normalizeCategoryName = (rawName: string): string => {
      if (!rawName) return "Tuition Fee";
      const clean = rawName.trim();
      const lower = clean.toLowerCase();

      const exact = (feeHeads || []).find(
        (fh) => (fh.name || "").trim().toLowerCase() === lower || (fh.category || "").trim().toLowerCase() === lower
      );
      if (exact && exact.name) return exact.name.trim();

      const stripped = lower.replace(/\s+fee$/, "").trim();
      const alias = (feeHeads || []).find((fh) => {
        const fhName = (fh.name || "").trim().toLowerCase().replace(/\s+fee$/, "").trim();
        const fhCat = (fh.category || "").trim().toLowerCase().replace(/\s+fee$/, "").trim();
        return (fhName.length > 0 && fhName === stripped) || (fhCat.length > 0 && fhCat === stripped);
      });
      if (alias && alias.name) return alias.name.trim();

      return clean;
    };

    // 1. Populate configured Fee Heads from Fee Setup / Fee Types
    (feeHeads || []).forEach((fh) => {
      const rawName = (fh.name || fh.category || "").trim();
      if (rawName) {
        const key = rawName.toLowerCase();
        if (!catMap[key]) {
          catMap[key] = {
            categoryName: rawName,
            totalOutstanding: 0,
            overdueAmount: 0,
            studentSet: new Set<string>(),
          };
        }
      }
    });

    // 2. Iterate through student ledgers to calculate real pending dues per category
    students.forEach((st) => {
      if (selectedClass !== "All" && !matchesClassName(st.className, selectedClass)) return;
      if (selectedSection !== "All" && st.section !== selectedSection) return;

      const hasStructure = dynamicFeeStructures.some(
        (d) => matchesClassName(d.className, st.className) && (d.status === "Active" || !d.status),
      );
      const hasAssignment = studentFeeAssignments.some(
        (a) => a.studentId === st.id && a.status === "Active",
      );
      const hasTransport = studentTransports.some(
        (t) => t.studentId === st.id && t.status === "Active",
      );
      const hasHostel = studentHostels.some(
        (h) => h.studentId === st.id && h.status === "Active",
      );

      if (!hasStructure && !hasAssignment && !hasTransport && !hasHostel) {
        return;
      }

      const ledger = getStudentFeeLedger(st.id, selectedAY);
      if (!ledger || !ledger.installments || ledger.installments.length === 0) return;

      const unpaid = ledger.installments.filter((i) => i.dueAmount > 0);
      unpaid.forEach((inst: any) => {
        const instDue = Number(inst.dueAmount || 0);
        const isPastDue = inst.dueDate <= todayStr;

        const bItems = Array.isArray(inst.breakdown || inst.items) ? inst.breakdown || inst.items : [];
        if (bItems.length > 0) {
          bItems.forEach((b: any) => {
            const rawName = (b.name || b.feeHeadName || b.category || inst.name || inst.termName || "Tuition Fee").trim();
            const normName = normalizeCategoryName(rawName);
            const key = normName.toLowerCase();
            const bAmount = Number(b.dueAmount || b.amount || instDue);

            if (!catMap[key]) {
              catMap[key] = {
                categoryName: normName,
                totalOutstanding: 0,
                overdueAmount: 0,
                studentSet: new Set<string>(),
              };
            }
            catMap[key].totalOutstanding += bAmount;
            if (isPastDue) catMap[key].overdueAmount += bAmount;
            catMap[key].studentSet.add(st.id);
          });
        } else {
          const rawName = (inst.name || inst.feeHeadName || inst.category || inst.termName || "Tuition Fee").trim();
          const normName = normalizeCategoryName(rawName);
          const key = normName.toLowerCase();

          if (!catMap[key]) {
            catMap[key] = {
              categoryName: normName,
              totalOutstanding: 0,
              overdueAmount: 0,
              studentSet: new Set<string>(),
            };
          }
          catMap[key].totalOutstanding += instDue;
          if (isPastDue) catMap[key].overdueAmount += instDue;
          catMap[key].studentSet.add(st.id);
        }
      });
    });

    // Return categories that have outstanding balance > 0 sorted by highest dues
    return Object.values(catMap)
      .map((item) => ({
        categoryName: item.categoryName,
        totalOutstanding: item.totalOutstanding,
        overdueAmount: item.overdueAmount,
        studentCount: item.studentSet.size,
      }))
      .filter((item) => item.totalOutstanding > 0)
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [students, getStudentFeeLedger, selectedAY, selectedClass, selectedSection, feeHeads, todayStr, dynamicFeeStructures, studentFeeAssignments, studentTransports, studentHostels]);

  const availableFeeCategories = React.useMemo(() => {
    const categoriesSet = new Set<string>();
    categoryWiseDues.forEach((c) => categoriesSet.add(c.categoryName));
    (feeHeads || []).forEach((fh) => {
      if (fh.name) categoriesSet.add(fh.name);
      if (fh.category) categoriesSet.add(fh.category);
    });
    return Array.from(categoriesSet).sort();
  }, [categoryWiseDues, feeHeads]);

  const getCategoryIcon = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes("transport") || lower.includes("bus")) return Bus;
    if (lower.includes("hostel")) return Home;
    if (lower.includes("uniform")) return Shirt;
    if (lower.includes("fine") || lower.includes("penalty")) return AlertTriangle;
    if (lower.includes("exam")) return FileText;
    if (lower.includes("book") || lower.includes("library")) return BookOpen;
    return IndianRupee;
  };

  // 1. Gather student-wise due summaries for the selected academic year
  const studentDueList: {
    student: Student;
    academicYear: string;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    earliestDueDate: string;
    isOverdue: boolean;
    unpaidCount: number;
  }[] = [];

  students.forEach((st) => {
    // Basic class & section filters
    if (selectedClass !== "All" && !matchesClassName(st.className, selectedClass)) return;
    if (selectedSection !== "All" && st.section !== selectedSection) return;

    // Search query filter
    const matchesQuery =
      query.trim() === "" ||
      `${st.firstName} ${st.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
      st.admissionNo.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return;

    // Fast skip for students who have NO dynamic fee structure configured in MySQL,
    // NO student fee assignment, and NO transport/hostel services assigned
    const hasStructure = dynamicFeeStructures.some(
      (d) => matchesClassName(d.className, st.className) && (d.status === "Active" || !d.status),
    );
    const hasAssignment = studentFeeAssignments.some(
      (a) => a.studentId === st.id && a.status === "Active",
    );
    const hasTransport = studentTransports.some(
      (t) => t.studentId === st.id && t.status === "Active",
    );
    const hasHostel = studentHostels.some(
      (h) => h.studentId === st.id && h.status === "Active",
    );

    if (!hasStructure && !hasAssignment && !hasTransport && !hasHostel) {
      return;
    }

    const ledger = getStudentFeeLedger(st.id, selectedAY);
    if (!ledger || !ledger.installments || ledger.installments.length === 0) return;

    let unpaidInsts = ledger.installments.filter((inst) => inst.dueAmount > 0);
    if (selectedFeeHead !== "All") {
      unpaidInsts = unpaidInsts.filter((inst: any) => {
        const selectedLower = selectedFeeHead.toLowerCase().replace(/\s+fee$/, "").trim();
        const matchesHead = (str?: string) => {
          if (!str) return false;
          const l = str.toLowerCase().replace(/\s+fee$/, "").trim();
          return l === selectedLower || l.includes(selectedLower);
        };
        const nameMatch = matchesHead(inst.name || inst.feeHeadName || inst.termName);
        const catMatch = matchesHead(inst.category || inst.feeHeadCategory);
        const breakdownMatch = Array.isArray(inst.breakdown || inst.items) && (inst.breakdown || inst.items).some((b: any) =>
          matchesHead(b.name || b.feeHeadName || b.category)
        );
        return nameMatch || catMatch || breakdownMatch;
      });
    }

    if (unpaidInsts.length === 0) return;

    const totalAmount = ledger.installments.reduce((sum, inst) => sum + inst.amount, 0);
    const totalPaid = ledger.installments.reduce((sum, inst) => sum + inst.paidAmount, 0);
    const totalOutstanding = unpaidInsts.reduce((sum, inst) => sum + inst.dueAmount, 0);
    if (totalAmount <= 0 || totalOutstanding <= 0) return;

    const overdueInsts = unpaidInsts.filter((inst) => inst.dueDate <= todayStr);
    const overdueAmount = overdueInsts.reduce((sum, inst) => sum + inst.dueAmount, 0);

    const dueDates = unpaidInsts.map((inst) => inst.dueDate).sort();
    const earliestDueDate = dueDates[0] || todayStr;
    const isOverdue = overdueAmount > 0 || (dueDates.length > 0 && dueDates[0] < todayStr);

    // Timeline Filter
    if (timelineFilter === "Overdue" && !isOverdue) return;
    if (timelineFilter === "Upcoming" && isOverdue) return;

    studentDueList.push({
      student: st,
      academicYear: selectedAY,
      totalAmount,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      earliestDueDate,
      isOverdue,
      unpaidCount: unpaidInsts.length,
    });
  });

  // 2. Sort by Highest Outstanding Dues First at Top
  studentDueList.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  const totalOutstandingSum = studentDueList.reduce((acc, item) => acc + item.totalOutstanding, 0);
  const totalOverdueSum = studentDueList.reduce((acc, item) => acc + item.overdueAmount, 0);

  const handleDownloadCategorySummary = () => {
    if (categoryWiseDues.length === 0) {
      addToast("warning", "No Data", "No category dues data available to export.");
      return;
    }
    const exportData = categoryWiseDues.map((cat) => ({
      "Fee Category": cat.categoryName,
      "Total Outstanding Dues (INR)": cat.totalOutstanding,
      "Overdue Amount (INR)": cat.overdueAmount,
      "Pending Students Count": cat.studentCount,
    }));
    exportToExcel(
      exportData,
      `Fee_Category_Dues_Summary_${selectedAY}_${new Date().toISOString().split("T")[0]}`,
      "Category Summary"
    );
    addToast("success", "Exported", "Downloaded Category-Wise Dues Summary Excel.");
  };

  const handleDownloadStudentDues = () => {
    if (studentDueList.length === 0) {
      addToast("warning", "No Data", "No student due records matching active filters.");
      return;
    }
    const exportData = studentDueList.map((item) => ({
      "Admission No": item.student.admissionNo || item.student.id,
      "Student Name": `${item.student.firstName} ${item.student.lastName}`.trim(),
      "Class": item.student.className || "",
      "Section": item.student.section || "",
      "Student Type": item.student.studentType || "Day Scholar",
      "Earliest Due Date": item.earliestDueDate || "",
      "Filtered Category": selectedFeeHead,
      "Total Fee (INR)": item.totalAmount,
      "Amount Paid (INR)": item.totalPaid,
      "Overdue Amount (INR)": item.overdueAmount,
      "Total Outstanding (INR)": item.totalOutstanding,
      "Dues Status": item.isOverdue ? "OVERDUE" : "PENDING",
    }));

    const catLabel = selectedFeeHead !== "All" ? selectedFeeHead.replace(/\s+/g, "_") : "All_Categories";
    exportToExcel(
      exportData,
      `Student_Dues_Report_${catLabel}_${selectedAY}_${new Date().toISOString().split("T")[0]}`,
      "Student Dues"
    );
    addToast("success", "Exported", `Downloaded Student Dues Excel for ${selectedFeeHead}.`);
  };

  const handlePrintDuesReport = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("Please allow popups to print dues report.");
      return;
    }
    const catTitle = selectedFeeHead !== "All" ? `Category: ${selectedFeeHead}` : "All Fee Categories";
    const logoUrl = resolveMediaUrl(schoolProfile?.logoUrl);
    const schoolName = schoolProfile?.name || "Pirnav Educational Institutions";
    const tagline = schoolProfile?.tagline || "Empowering Minds, Shaping Tomorrow";
    const address = schoolProfile?.address || "Jain Sadguru Images Capital Park 502B, Madhapur, Hyderabad";
    const phone = schoolProfile?.phone || "+91 9123456789";
    const email = schoolProfile?.email || "contact@pirnavschools.edu";
    const website = schoolProfile?.website || "https://pirnavschools.edu";

    const rowsHtml = studentDueList
      .map(
        (item) => `
      <tr>
        <td style="padding: 6px 8px;">${item.student.admissionNo || item.student.id}</td>
        <td style="padding: 6px 8px; font-weight: 600;">${item.student.firstName} ${item.student.lastName}</td>
        <td style="padding: 6px 8px;">${item.student.className}-${item.student.section}</td>
        <td style="padding: 6px 8px;">${item.student.studentType || "Day Scholar"}</td>
        <td style="padding: 6px 8px;">${formatDateForDisplay(item.earliestDueDate)}</td>
        <td style="padding: 6px 8px; text-align: right;">${formatCurrency(item.totalAmount)}</td>
        <td style="padding: 6px 8px; text-align: right; color: #059669; font-weight: 600;">${formatCurrency(item.totalPaid)}</td>
        <td style="padding: 6px 8px; text-align: right; color: #d97706; font-weight: 600;">${formatCurrency(item.overdueAmount)}</td>
        <td style="padding: 6px 8px; text-align: right; color: #e11d48; font-weight: 800;">${formatCurrency(item.totalOutstanding)}</td>
      </tr>
    `
      )
      .join("");

    const catSummaryHtml = categoryWiseDues
      .map(
        (cat) => `
      <tr>
        <td style="padding: 6px 8px; font-weight: 700;">${cat.categoryName}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 700;">${formatCurrency(cat.totalOutstanding)}</td>
        <td style="padding: 6px 8px; text-align: right; color: #d97706;">${formatCurrency(cat.overdueAmount)}</td>
        <td style="padding: 6px 8px; text-align: center;">${cat.studentCount}</td>
      </tr>
    `
      )
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Dues Report - ${catTitle}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 15px; color: #1e293b; background: #ffffff !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .header-container { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .school-logo { width: 70px; height: 70px; object-fit: contain; flex-shrink: 0; }
            .school-details { flex: 1; text-align: center; }
            .school-name { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; }
            .school-tagline { font-size: 11px; font-weight: 700; color: #0369a1; font-style: italic; margin-top: 2px; }
            .school-address { font-size: 10px; font-weight: 500; color: #475569; margin-top: 2px; }
            .school-meta { font-size: 9.5px; font-weight: 600; color: #64748b; margin-top: 3px; }
            .report-title-bar { margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; margin-bottom: 16px; }
            .report-title { font-size: 14px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
            .report-subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
            h3 { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-top: 16px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
            th { background: #f1f5f9; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: 800; border: 1px solid #cbd5e1; }
            td { padding: 6px; border: 1px solid #e2e8f0; }
            .summary-table { margin-bottom: 20px; }
            .watermark, [class*="watermark"], .draft-watermark { display: none !important; opacity: 0 !important; visibility: hidden !important; }
          </style>
        </head>
        <body>
          <div class="header-container">
            ${logoUrl ? `<img src="${logoUrl}" alt="${schoolName}" class="school-logo" />` : ''}
            <div class="school-details">
              <h1 class="school-name">${schoolName}</h1>
              ${tagline ? `<div class="school-tagline">${tagline}</div>` : ''}
              <div class="school-address">${address}</div>
              <div class="school-meta">Ph: ${phone} • Email: ${email} • Web: ${website}</div>
            </div>
          </div>

          <div class="report-title-bar">
            <div class="report-title">Outstanding Student Dues Report</div>
            <div class="report-subtitle">Academic Year: ${selectedAY} | Filter: ${catTitle} | Date: ${new Date().toLocaleDateString()}</div>
          </div>

          <h3>Category Dues Summary</h3>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th style="text-align: right;">Total Pending</th>
                <th style="text-align: right;">Overdue to Date</th>
                <th style="text-align: center;">Pending Students</th>
              </tr>
            </thead>
            <tbody>
              ${catSummaryHtml}
            </tbody>
          </table>

          <h3>Student Dues Directory (${studentDueList.length} Students)</h3>
          <table>
            <thead>
              <tr>
                <th>Adm No</th>
                <th>Student Name</th>
                <th>Class & Sec</th>
                <th>Type</th>
                <th>Due Date</th>
                <th style="text-align: right;">Total Fee</th>
                <th style="text-align: right;">Paid</th>
                <th style="text-align: right;">Overdue</th>
                <th style="text-align: right;">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-rose-500 bg-white dark:bg-slate-900 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Outstanding Dues</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(totalOutstandingSum)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Across {studentDueList.length} students with pending dues
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Overdue Amount (Due to Date)</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(totalOverdueSum)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Immediate payable amount past due dates
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top Action Toolbar (Download & Print Buttons) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Dues Reports & Exports</h3>
            <p className="text-[11px] text-slate-400">Export Excel reports or print pending dues lists category-wise</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadCategorySummary}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800"
          >
            <Download className="w-4 h-4" /> Download Category Dues (Excel)
          </button>
          <button
            onClick={handleDownloadStudentDues}
            className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:hover:bg-sky-900 dark:text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-sky-200 dark:border-sky-800"
          >
            <Download className="w-4 h-4" /> Download Student Dues ({selectedFeeHead})
          </button>
          <button
            onClick={handlePrintDuesReport}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-4 h-4" /> Print Dues Report
          </button>
        </div>
      </div>

      {/* Category-Wise Outstanding Dues Overview Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-sky-500" /> Category-Wise Outstanding Dues
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any fee category card to view students with pending dues for that specific category.
            </p>
          </div>
          {selectedFeeHead !== "All" && (
            <button
              onClick={() => setSelectedFeeHead("All")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-rose-500" /> Show All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {categoryWiseDues.map((cat) => {
            const Icon = getCategoryIcon(cat.categoryName);
            const isSelected = selectedFeeHead.toLowerCase() === cat.categoryName.toLowerCase();

            return (
              <div
                key={cat.categoryName}
                onClick={() => setSelectedFeeHead(isSelected ? "All" : cat.categoryName)}
                className={`glass-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group ${
                  isSelected
                    ? "ring-2 ring-sky-500 bg-sky-50/60 dark:bg-sky-950/40 border-sky-400"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1">
                    {cat.categoryName}
                  </span>
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isSelected
                        ? "bg-sky-500 text-white"
                        : "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(cat.totalOutstanding)}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    <span className="text-rose-500 font-semibold">
                      Overdue: {formatCurrency(cat.overdueAmount)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {cat.studentCount} Student{cat.studentCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between text-[11px] font-bold text-sky-600 dark:text-sky-400 group-hover:underline">
                  <span>{isSelected ? "Active Filter" : "View Pending Students"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Category Filter Banner */}
      {selectedFeeHead !== "All" && (
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-sky-500 text-white font-black text-[10px] uppercase tracking-wider">
              Category Filter Active
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              Showing students with pending dues for <span className="text-sky-600 dark:text-sky-400 font-black">{selectedFeeHead}</span>
            </span>
          </div>
          <button
            onClick={() => setSelectedFeeHead("All")}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" /> Clear Category Filter
          </button>
        </div>
      )}

      {/* Filter Box */}
      <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-sky-500" /> Filter Dues Directory
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Search Student</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Name or Admission No..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Academic Year */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Academic Year</label>
            <select
              value={selectedAY}
              onChange={(e) => setSelectedAY(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              {academicYearFeeSchedules.map((s) => (
                <option key={s.id} value={s.academicYear}>
                  {s.academicYear}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Class Grade</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Classes</option>
              {academicClasses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Sections</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Category / Head */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Fee Category / Head</label>
            <select
              value={selectedFeeHead}
              onChange={(e) => setSelectedFeeHead(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Fee Categories</option>
              {availableFeeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Timeline Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Dues Status Filter</label>
            <select
              value={timelineFilter}
              onChange={(e) => setTimelineFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Statuses (Overdue & Upcoming)</option>
              <option value="Overdue">Overdue Dues Only (Past Due Date)</option>
              <option value="Upcoming">Upcoming Dues Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student-Wise Dues Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[10px]">
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Class & Section</th>
                <th className="py-3.5 px-4">Student Type</th>
                <th className="py-3.5 px-4">Earliest Due Date</th>
                <th className="py-3.5 px-4 font-mono text-right">Total Fee</th>
                <th className="py-3.5 px-4 font-mono text-right">Amount Paid</th>
                <th className="py-3.5 px-4 font-mono text-right">Overdue to Date</th>
                <th className="py-3.5 px-4 font-mono text-right">Total Outstanding</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {studentDueList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 text-xs font-bold italic">
                    No student due records found matching the configured filters.
                  </td>
                </tr>
              ) : (
                studentDueList.map((item) => {
                  const st = item.student;
                  const isPrePrimary = /^(nursery|lkg|ukg|playgroup|pre-kg)/i.test(st.className || "");
                  const displayClassStr = st.className
                    ? st.className.toLowerCase().startsWith("class") || isPrePrimary
                      ? `${st.className}-${st.section}`
                      : `Class ${st.className}-${st.section}`
                    : `Section ${st.section}`;

                  const isHosteller =
                    st.studentType === "Hosteller" ||
                    st.studentType === "Residential" ||
                    (st as any).residentialStatus === "Residential" ||
                    (studentHostels || []).some(
                      (h) => h.studentId === st.id && h.status === "Active",
                    );

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {st.admissionNo || st.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-brand-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {st.firstName?.[0] || "S"}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {st.firstName} {st.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.unpaidCount} Pending Term(s)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold">
                        {displayClassStr}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isHosteller
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                          }`}
                        >
                          {isHosteller ? "Residential" : "Day Scholar"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateForDisplay(item.earliestDueDate)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatCurrency(item.totalPaid)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-amber-600 dark:text-amber-400 font-bold">
                        {formatCurrency(item.overdueAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-rose-600 dark:text-rose-400 font-black text-xs">
                        {formatCurrency(item.totalOutstanding)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            item.isOverdue
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                          }`}
                        >
                          {item.isOverdue ? "OVERDUE" : "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onCollectStudentFee?.(st)}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1 ml-auto cursor-pointer transition-all"
                        >
                          <IndianRupee className="w-3.5 h-3.5" /> Collect
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
    </div>
  );
};
