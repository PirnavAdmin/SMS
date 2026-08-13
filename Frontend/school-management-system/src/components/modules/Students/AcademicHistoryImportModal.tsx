import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2,
  XCircle, FileText, Check, ShieldAlert, Layers, Calendar, Award, IndianRupee, RefreshCw
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { AcademicYearStatus, AcademicHistoryRecord, DailyAttendance, ExamMark, StudentFeeAssignment } from '../../../types';

interface AcademicHistoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type ImportDomain = 'academic-history' | 'attendance' | 'examination' | 'fee-ledger';

export interface ValidatedRow {
  rowNum: number;
  admissionNo: string;
  studentName: string;
  academicYear: string;
  className: string;
  section: string;
  rollNo: string;
  status: string;
  branch?: string;
  remarks?: string;
  isValid: boolean;
  errorReason?: string;
  rawData: any;
}

export const AcademicHistoryImportModal: React.FC<AcademicHistoryImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    students,
    academicClasses,
    academicYears,
    addAcademicHistoryRecord,
    importHistoricalAttendanceData,
    importHistoricalExamData,
    importHistoricalFeeData,
    logActivity
  } = useData();

  const { addToast } = useToast();

  const [activeDomain, setActiveDomain] = useState<ImportDomain>('academic-history');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{
    academicCount: number;
    attendanceCount: number;
    examCount: number;
    feeCount: number;
  } | null>(null);

  if (!isOpen) return null;

  // Allowed statuses
  const ALLOWED_STATUSES: AcademicYearStatus[] = [
    'Promoted', 'Retained', 'Discontinued', 'Branch Transfer', 'Transferred Out', 'Graduated', 'Active'
  ];

  // 1. Download Excel / CSV Template
  const handleDownloadTemplate = () => {
    let filename = 'Academic_History_Import_Template.xlsx';
    let data: any[] = [];

    if (activeDomain === 'academic-history') {
      filename = 'Academic_History_Import_Template.xlsx';
      data = [
        {
          'Admission No': 'ADM2024-001',
          'Academic Year': '2024-2025',
          'Class': 'Class 5',
          'Section': 'A',
          'Roll No': '1001',
          'Class Teacher': 'Rajesh Sharma',
          'Branch': 'Main Campus',
          'Status': 'Promoted',
          'Remarks': 'Promoted to Next Class'
        },
        {
          'Admission No': 'ADM2024-002',
          'Academic Year': '2024-2025',
          'Class': 'Class 5',
          'Section': 'B',
          'Roll No': '1002',
          'Class Teacher': 'Anita Verma',
          'Branch': 'Main Campus',
          'Status': 'Retained',
          'Remarks': 'Retained in Class 5'
        }
      ];
    } else if (activeDomain === 'attendance') {
      filename = 'Attendance_History_Import_Template.xlsx';
      data = [
        {
          'Admission No': 'ADM2024-001',
          'Academic Year': '2024-2025',
          'Class': 'Class 5',
          'Section': 'A',
          'Working Days': 220,
          'Present Days': 204,
          'Absent Days': 16
        }
      ];
    } else if (activeDomain === 'examination') {
      filename = 'Examination_History_Import_Template.xlsx';
      data = [
        {
          'Admission No': 'ADM2024-001',
          'Academic Year': '2024-2025',
          'Exam': 'Annual Final Examination',
          'Class': 'Class 5',
          'Section': 'A',
          'Subject': 'Mathematics',
          'Max Marks': 100,
          'Marks Obtained': 92,
          'Grade': 'A1',
          'Result': 'PASS'
        }
      ];
    } else if (activeDomain === 'fee-ledger') {
      filename = 'Fee_Ledger_History_Import_Template.xlsx';
      data = [
        {
          'Admission No': 'ADM2024-001',
          'Academic Year': '2024-2025',
          'Class': 'Class 5',
          'Section': 'A',
          'Fee Type': 'Annual Composite Fee',
          'Total Payable': 45000,
          'Paid Amount': 45000,
          'Due Amount': 0,
          'Status': 'Paid'
        }
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, filename);

    addToast('info', 'Template Downloaded', `Downloaded ${filename}`);
  };

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const validExts = ['.xlsx', '.xls', '.csv'];
    const fileNameLower = file.name.toLowerCase();
    const isValidExt = validExts.some((ext) => fileNameLower.endsWith(ext));

    if (!isValidExt) {
      addToast('error', 'Invalid File Type', 'Please upload a valid .xlsx, .xls, or .csv Excel file.');
      return;
    }

    setSelectedFile(file);
    setIsValidated(false);
    setValidatedRows([]);
    setImportSummary(null);
  };

  // 3. Strict 12-Rule Validation Engine
  const handleValidateExcel = () => {
    if (!selectedFile) {
      addToast('warning', 'No File Selected', 'Please choose an Excel file to validate.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          addToast('warning', 'Empty Excel', 'The uploaded file contains no data rows.');
          return;
        }

        const seenKeysInFile = new Set<string>();
        const processedList: ValidatedRow[] = [];

        rows.forEach((row, idx) => {
          const rowNum = idx + 2; // Accounting for header line

          const admNo = String(
            row['Admission No'] || row['AdmissionNo'] || row['admission_no'] || row['Admission_No'] || ''
          ).trim();

          const ay = String(
            row['Academic Year'] || row['AcademicYear'] || row['academic_year'] || ''
          ).trim();

          const clsName = String(
            row['Class'] || row['ClassName'] || row['class_name'] || ''
          ).trim();

          const sec = String(
            row['Section'] || row['section'] || ''
          ).trim() || 'A';

          const roll = String(
            row['Roll No'] || row['RollNo'] || row['roll_no'] || ''
          ).trim() || '101';

          const statusRaw = String(
            row['Status'] || row['status'] || row['promotionStatus'] || 'Promoted'
          ).trim();

          const branch = String(row['Branch'] || row['branch'] || '').trim();
          const remarks = String(row['Remarks'] || row['remarks'] || '').trim();

          let isValid = true;
          let errorReason = '';

          // Rule 1: Admission No Present
          if (!admNo) {
            isValid = false;
            errorReason = 'Admission No is missing.';
          }
          // Rule 2: Admission No Exists in System
          else {
            const matchedStudent = students.find(
              (s) => s.admissionNo.toLowerCase() === admNo.toLowerCase() || s.id.toLowerCase() === admNo.toLowerCase()
            );

            if (!matchedStudent) {
              isValid = false;
              errorReason = `Student with Admission No '${admNo}' not found.`;
            } else {
              // Rule 3: Academic Year Present
              if (!ay) {
                isValid = false;
                errorReason = 'Academic Year is missing.';
              }
              // Rule 8: Academic Year Format
              else if (!/\d{4}[-–]\d{4}/.test(ay)) {
                isValid = false;
                errorReason = `Invalid Academic Year format '${ay}' (Expected YYYY-YYYY).`;
              }
              // Rule 4: Class Present
              else if (!clsName) {
                isValid = false;
                errorReason = 'Class is missing.';
              }
              // Rule 5: Section Present
              else if (!sec) {
                isValid = false;
                errorReason = 'Section is missing.';
              }
              // Rule 7: Allowed Status
              else if (activeDomain === 'academic-history' && !ALLOWED_STATUSES.includes(statusRaw as any)) {
                isValid = false;
                errorReason = `Invalid status '${statusRaw}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`;
              }
              // Rule 9: Unique Key Constraint (Student + Academic Year already in system)
              else {
                const alreadyHasHistory = matchedStudent.academicHistory?.some(
                  (h) => h.academicYear === ay
                );

                if (alreadyHasHistory && activeDomain === 'academic-history') {
                  isValid = false;
                  errorReason = `Academic history already exists for ${admNo} for ${ay}.`;
                }
                // Rule 10: Unique Key Constraint within uploaded file itself
                else {
                  const uniqueFileKey = `${matchedStudent.id}_${ay}`;
                  if (seenKeysInFile.has(uniqueFileKey) && activeDomain === 'academic-history') {
                    isValid = false;
                    errorReason = `Duplicate record for ${admNo} for ${ay} within this file.`;
                  } else {
                    seenKeysInFile.add(uniqueFileKey);
                  }
                }
              }

              const studentFullName = `${matchedStudent.firstName} ${matchedStudent.lastName}`;

              processedList.push({
                rowNum,
                admissionNo: admNo,
                studentName: matchedStudent ? studentFullName : 'Unknown Student',
                academicYear: ay,
                className: clsName.startsWith('Class') ? clsName : `Class ${clsName}`,
                section: sec,
                rollNo: roll,
                status: statusRaw,
                branch,
                remarks,
                isValid,
                errorReason,
                rawData: row
              });
              return;
            }
          }

          processedList.push({
            rowNum,
            admissionNo: admNo || 'N/A',
            studentName: 'Student Not Found',
            academicYear: ay || 'N/A',
            className: clsName || 'N/A',
            section: sec || 'N/A',
            rollNo: roll || 'N/A',
            status: statusRaw || 'N/A',
            branch,
            remarks,
            isValid: false,
            errorReason,
            rawData: row
          });
        });

        setValidatedRows(processedList);
        setIsValidated(true);
        addToast(
          'info',
          'Validation Complete',
          `Validated ${processedList.length} rows (${processedList.filter((r) => r.isValid).length} valid, ${processedList.filter((r) => !r.isValid).length} errors).`
        );
      } catch (err) {
        console.error(err);
        addToast('error', 'Validation Error', 'Failed to parse Excel file. Ensure it is a valid spreadsheet.');
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // 4. Download Error Report
  const handleDownloadErrorReport = () => {
    const invalidRows = validatedRows.filter((r) => !r.isValid);
    if (invalidRows.length === 0) {
      addToast('info', 'No Errors', 'All records in this file are 100% valid!');
      return;
    }

    const reportData = invalidRows.map((r) => ({
      'Row Number': r.rowNum,
      'Admission No': r.admissionNo,
      'Student Name': r.studentName,
      'Academic Year': r.academicYear,
      'Class': r.className,
      'Section': r.section,
      'Error Reason': r.errorReason
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Error_Report');
    XLSX.writeFile(workbook, `Import_Error_Report_${activeDomain}.xlsx`);

    addToast('success', 'Error Report Downloaded', 'Error report spreadsheet saved.');
  };

  // 5. Commit Import
  const handleExecuteImport = () => {
    const validItems = validatedRows.filter((r) => r.isValid);
    if (validItems.length === 0) {
      addToast('error', 'No Valid Records', 'There are no valid records to import.');
      return;
    }

    setIsImporting(true);

    let acadCount = 0;
    let attCount = 0;
    let exmCount = 0;
    let feeCount = 0;

    const rawObjects = validItems.map((v) => v.rawData);

    if (activeDomain === 'academic-history') {
      validItems.forEach((v) => {
        const targetStudent = students.find(
          (s) => s.admissionNo.toLowerCase() === v.admissionNo.toLowerCase() || s.id.toLowerCase() === v.admissionNo.toLowerCase()
        );

        if (targetStudent) {
          const rec: AcademicHistoryRecord = {
            id: `ACH-${targetStudent.id}-${v.academicYear}`,
            studentId: targetStudent.id,
            admissionNo: targetStudent.admissionNo,
            academicYear: v.academicYear,
            className: v.className,
            section: v.section,
            rollNo: v.rollNo,
            branch: v.branch || targetStudent.branch || 'Main Campus',
            status: v.status as AcademicYearStatus,
            promotionStatus: v.status,
            remarks: v.remarks || 'Imported via Excel Import',
            createdAt: new Date().toISOString().split('T')[0]
          };

          // MASTER PROFILE PROTECTION:
          // addAcademicHistoryRecord appends to academicHistory array WITHOUT touching current profile!
          addAcademicHistoryRecord(targetStudent.id, rec);
          acadCount++;
        }
      });
    } else if (activeDomain === 'attendance') {
      const res = importHistoricalAttendanceData(rawObjects);
      attCount = res.successCount;
    } else if (activeDomain === 'examination') {
      const res = importHistoricalExamData(rawObjects);
      exmCount = res.successCount;
    } else if (activeDomain === 'fee-ledger') {
      const res = importHistoricalFeeData(rawObjects);
      feeCount = res.successCount;
    }

    logActivity('Excel Bulk Import', `Imported ${validItems.length} records into ${activeDomain}`);

    setImportSummary({
      academicCount: acadCount,
      attendanceCount: attCount,
      examCount: exmCount,
      feeCount: feeCount
    });

    setIsImporting(false);
    if (onSuccess) onSuccess();
  };

  const totalCount = validatedRows.length;
  const validCount = validatedRows.filter((r) => r.isValid).length;
  const errorCount = validatedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-white backdrop-blur-md shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Excel Historical Data Import</h2>
              <p className="text-xs text-sky-200 font-medium">
                Bulk upload and validate previous academic session records with strict duplicate protection.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Domain Navigation Tabs */}
        <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0 text-xs overflow-x-auto">
          <button
            onClick={() => {
              setActiveDomain('academic-history');
              setIsValidated(false);
              setValidatedRows([]);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeDomain === 'academic-history'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-extrabold ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            <Layers className="w-4 h-4" /> Academic History Import
          </button>

          <button
            onClick={() => {
              setActiveDomain('attendance');
              setIsValidated(false);
              setValidatedRows([]);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeDomain === 'attendance'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-extrabold ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            <Calendar className="w-4 h-4" /> Attendance Import
          </button>

          <button
            onClick={() => {
              setActiveDomain('examination');
              setIsValidated(false);
              setValidatedRows([]);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeDomain === 'examination'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-extrabold ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            <Award className="w-4 h-4" /> Examination Import
          </button>

          <button
            onClick={() => {
              setActiveDomain('fee-ledger');
              setIsValidated(false);
              setValidatedRows([]);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeDomain === 'fee-ledger'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-extrabold ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            <IndianRupee className="w-4 h-4" /> Fee Ledger Import
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* SUCCESS SUMMARY OVERLAY */}
          {importSummary ? (
            <div className="p-8 text-center space-y-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl my-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Import Successful!</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Historical data records have been safely linked to permanent student profiles.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800">
                  <span className="text-[10px] font-bold text-sky-600 block">Academic History</span>
                  <span className="text-lg font-black text-sky-900 dark:text-sky-100 font-mono">{importSummary.academicCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] font-bold text-emerald-600 block">Attendance</span>
                  <span className="text-lg font-black text-emerald-900 dark:text-emerald-100 font-mono">{importSummary.attendanceCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-[10px] font-bold text-indigo-600 block">Examination</span>
                  <span className="text-lg font-black text-indigo-900 dark:text-indigo-100 font-mono">{importSummary.examCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                  <span className="text-[10px] font-bold text-amber-600 block">Fee Ledger</span>
                  <span className="text-lg font-black text-amber-900 dark:text-amber-100 font-mono">{importSummary.feeCount}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-sky-600 text-white font-extrabold shadow-md hover:bg-sky-700 transition-all cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Download Template */}
              <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center">1</span>
                    Download {activeDomain.replace('-', ' ').toUpperCase()} Excel Template
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Pre-formatted columns: Admission No, Academic Year, Class, Section, Roll No, Status, Remarks.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-100 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Template
                </button>
              </div>

              {/* STEP 2: Drag & Drop File Upload Box */}
              <div className="space-y-2">
                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center">2</span>
                  Upload Filled Excel File (.xlsx, .xls, .csv)
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all ${
                    dragActive
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 scale-[1.01]'
                      : selectedFile
                      ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <Upload className="w-10 h-10 mx-auto mb-2 text-sky-600 dark:text-sky-400" />
                  
                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for Validation
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Drag and drop your Excel spreadsheet here, or <label className="text-sky-600 dark:text-sky-400 underline cursor-pointer">browse file <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" /></label>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Supported formats: .xlsx, .xls, .csv</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar for Validation */}
              {selectedFile && !isValidated && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                  >
                    Clear File
                  </button>
                  <button
                    onClick={handleValidateExcel}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Validate Excel Data
                  </button>
                </div>
              )}

              {/* STEP 4: Validation Summary & Row-by-Row Preview Table */}
              {isValidated && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">
                        <span className="text-[10px] text-slate-400 block">Total Rows</span>
                        <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{totalCount}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[10px] block">Valid Rows</span>
                        <span className="text-sm font-black font-mono">{validCount}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                        <span className="text-[10px] block">Error Rows</span>
                        <span className="text-sm font-black font-mono">{errorCount}</span>
                      </div>
                    </div>

                    {errorCount > 0 && (
                      <button
                        onClick={handleDownloadErrorReport}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors flex items-center gap-1.5 text-xs shrink-0 cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Download Error Report
                      </button>
                    )}
                  </div>

                  {/* Partial Import Warning Box */}
                  {errorCount > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Notice:</strong> {errorCount} row(s) contain validation errors and will be excluded. Clicking <strong>Import Valid Records</strong> will safely commit the remaining {validCount} valid record(s).
                      </span>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b">
                            <th className="p-2.5">Row</th>
                            <th className="p-2.5">Admission No</th>
                            <th className="p-2.5">Student Name</th>
                            <th className="p-2.5">Academic Year</th>
                            <th className="p-2.5">Class & Sec</th>
                            <th className="p-2.5">Roll No</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Validation Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {validatedRows.map((r) => (
                            <tr
                              key={r.rowNum}
                              className={r.isValid ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : 'bg-rose-50/40 dark:bg-rose-950/20'}
                            >
                              <td className="p-2.5 font-bold font-mono text-slate-400">#{r.rowNum}</td>
                              <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">{r.admissionNo}</td>
                              <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{r.studentName}</td>
                              <td className="p-2.5 font-mono">{r.academicYear}</td>
                              <td className="p-2.5 font-bold">{r.className}-{r.section}</td>
                              <td className="p-2.5 font-mono">{r.rollNo}</td>
                              <td className="p-2.5 font-bold text-sky-700 dark:text-sky-300">{r.status}</td>
                              <td className="p-2.5">
                                {r.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]" title={r.errorReason}>
                                    <XCircle className="w-3.5 h-3.5 shrink-0" /> {r.errorReason}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importSummary && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {isValidated && (
              <button
                disabled={validCount === 0 || isImporting}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Importing Records...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Import {validCount} {errorCount > 0 ? 'Valid ' : ''}Record(s)
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
