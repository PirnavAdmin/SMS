import React, { useState, useMemo, useRef } from 'react';
import {
  Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle2,
  XCircle, Info, X, Search, Trash2, Edit3, ArrowRight, Eye,
  RefreshCw, FileDown, Check, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Student, CertificateTypeConfig } from '../../../types';
import {
  ExcelValidationSummary,
  ExcelRowValidationResult,
  getExcelColumnsForCertificate,
  isTransferCertificate
} from '../../../utils/certificateExcelHelper';
import { DateInput } from '../../common/DateInput';
import { formatDateDDMMYYYY } from '../../../utils/dateValidation';

// ---------------------------------------------------------------------------
// 1. BULK DATA IMPORT SECTION (Integrated into Bulk Configuration Form)
// ---------------------------------------------------------------------------
interface ExcelBulkImportSectionProps {
  selectedBulkStudents: Student[];
  selectedTypeConfig?: CertificateTypeConfig | null;
  activeAY: string;
  uploadedFile: File | null;
  validationSummary: ExcelValidationSummary | null;
  isExcelModeActive: boolean;
  isParsing: boolean;
  onDownloadTemplate: () => void;
  onFileUpload: (file: File) => void;
  onClearImport: () => void;
  onOpenValidationModal: () => void;
  onOpenStagingModal: () => void;
  onDownloadErrorReport: () => void;
}

export const ExcelBulkImportSection: React.FC<ExcelBulkImportSectionProps> = ({
  selectedBulkStudents,
  selectedTypeConfig,
  activeAY,
  uploadedFile,
  validationSummary,
  isExcelModeActive,
  isParsing,
  onDownloadTemplate,
  onFileUpload,
  onClearImport,
  onOpenValidationModal,
  onOpenStagingModal,
  onDownloadErrorReport
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const formattedFileSize = useMemo(() => {
    if (!uploadedFile) return '';
    const bytes = uploadedFile.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [uploadedFile]);

  const isTC = isTransferCertificate(selectedTypeConfig);

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 bg-gradient-to-br from-white via-slate-50/40 to-sky-50/20 dark:from-slate-900 dark:via-slate-900/60 dark:to-sky-950/20 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Bulk Data Import (Excel)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Individual Student Details
              </span>
            </div>
          </div>
        </div>

        {/* Download Template Action */}
        <button
          type="button"
          onClick={onDownloadTemplate}
          disabled={selectedBulkStudents.length === 0}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={selectedBulkStudents.length === 0 ? "Select students first to generate template" : "Download Excel template"}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Excel Template</span>
          {selectedBulkStudents.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-emerald-700/80 text-[10px]">
              {selectedBulkStudents.length}
            </span>
          )}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Upload Zone (when no file uploaded) */}
      {!uploadedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (selectedBulkStudents.length === 0) return;
            fileInputRef.current?.click();
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            selectedBulkStudents.length === 0
              ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60 cursor-not-allowed'
              : isDragOver
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
              : 'border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 hover:border-emerald-500 hover:bg-emerald-50/20'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              {isParsing ? (
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isParsing
                  ? 'Parsing and validating Excel file...'
                  : 'Drag & Drop completed Excel file here, or click to browse'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports .xlsx and .xls formats • Validates student IDs, admission numbers, dates, and mandatory fields
              </p>
            </div>

            {selectedBulkStudents.length === 0 && (
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                ⚠️ Please select students above before uploading the completed template.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Uploaded File Summary & Actions */}
      {uploadedFile && validationSummary && (
        <div className="space-y-3">
          {/* File Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-xs">
                    {uploadedFile.name}
                  </h5>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({formattedFileSize})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Uploaded at {validationSummary.uploadedAt} • Target Type: <strong>{validationSummary.certificateTypeName}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenValidationModal}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Validation Details</span>
              </button>

              <button
                type="button"
                onClick={onOpenStagingModal}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Review & Edit Data</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-md bg-sky-700/80 text-[10px]">
                  {validationSummary.validCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Replace with a new Excel file"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={onClearImport}
                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                title="Remove uploaded Excel file and revert to manual mode"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Validation Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                Total Rows
              </span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                {validationSummary.totalRows}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
              <span className="text-[10px] uppercase tracking-wider font-bold block">
                Validated
              </span>
              <span className="font-extrabold text-sm flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {validationSummary.validCount}
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border text-rose-700 dark:text-rose-300 ${
              validationSummary.errorCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
            }`}>
              <span className="text-[10px] uppercase tracking-wider font-bold block">
                Errors
              </span>
              <span className="font-extrabold text-sm flex items-center justify-center gap-1">
                {validationSummary.errorCount > 0 && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                {validationSummary.errorCount}
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border text-amber-700 dark:text-amber-300 ${
              validationSummary.missingMandatoryCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
            }`}>
              <span className="text-[10px] uppercase tracking-wider font-bold block">
                Missing Fields
              </span>
              <span className="font-extrabold text-sm">
                {validationSummary.missingMandatoryCount}
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border text-purple-700 dark:text-purple-300 ${
              validationSummary.duplicateCount > 0
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
            }`}>
              <span className="text-[10px] uppercase tracking-wider font-bold block">
                Duplicates
              </span>
              <span className="font-extrabold text-sm">
                {validationSummary.duplicateCount}
              </span>
            </div>
          </div>

          {/* Active Mode Notice Banner */}
          {isExcelModeActive && validationSummary.validCount > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Individual Excel Details Active:</strong> Certificates will use individual student values imported from Excel. You can review or adjust them before preview.
                </span>
              </div>
              {validationSummary.errorCount > 0 && (
                <button
                  type="button"
                  onClick={onDownloadErrorReport}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <FileDown className="w-3 h-3" />
                  <span>Download Error Report</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. EXCEL VALIDATION DETAILS MODAL
// ---------------------------------------------------------------------------
interface ExcelValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ExcelValidationSummary | null;
  onDownloadErrorReport: () => void;
  onProceedToReview: () => void;
}

export const ExcelValidationModal: React.FC<ExcelValidationModalProps> = ({
  isOpen,
  onClose,
  summary,
  onDownloadErrorReport,
  onProceedToReview
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'VALID' | 'ERRORS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !summary) return null;

  const filteredResults = summary.results.filter(res => {
    if (filterTab === 'VALID' && !res.isValid) return false;
    if (filterTab === 'ERRORS' && res.isValid) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      res.studentName.toLowerCase().includes(q) ||
      res.admissionNo.toLowerCase().includes(q) ||
      res.studentId.toLowerCase().includes(q) ||
      res.errors.some(e => e.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Excel Import Validation Summary
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {summary.fileName} • {summary.certificateTypeName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rows</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{summary.totalRows}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center text-emerald-700 dark:text-emerald-300">
            <span className="text-[10px] uppercase font-bold block">Validated</span>
            <span className="text-base font-black flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {summary.validCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-center text-rose-700 dark:text-rose-300">
            <span className="text-[10px] uppercase font-bold block">Errors</span>
            <span className="text-base font-black flex items-center justify-center gap-1">
              <XCircle className="w-4 h-4" /> {summary.errorCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-center text-amber-700 dark:text-amber-300">
            <span className="text-[10px] uppercase font-bold block">Missing Fields</span>
            <span className="text-base font-black">{summary.missingMandatoryCount}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-center text-purple-700 dark:text-purple-300">
            <span className="text-[10px] uppercase font-bold block">Duplicates</span>
            <span className="text-base font-black">{summary.duplicateCount}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                filterTab === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Records ({summary.totalRows})
            </button>
            <button
              onClick={() => setFilterTab('VALID')}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                filterTab === 'VALID'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              Valid ({summary.validCount})
            </button>
            <button
              onClick={() => setFilterTab('ERRORS')}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                filterTab === 'ERRORS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
              }`}
            >
              Errors ({summary.errorCount})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, adm no, error..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Validation Rows Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No records found matching current filter or search criteria.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-16 text-center">Row</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Adm No</th>
                    <th className="p-3">Class & Sec</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Issues / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredResults.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/30 dark:bg-rose-950/20'}
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        #{row.rowIndex}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                        {row.studentName}
                      </td>
                      <td className="p-3 font-mono text-sky-600 dark:text-sky-400 font-bold">
                        {row.studentId}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                        {row.admissionNo}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {row.className} {row.section ? `- ${row.section}` : ''}
                      </td>
                      <td className="p-3">
                        {row.isValid ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {row.errors.length > 0 ? (
                          <ul className="space-y-1">
                            {row.errors.map((err, i) => (
                              <li key={i} className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                {err}
                              </li>
                            ))}
                          </ul>
                        ) : row.warnings.length > 0 ? (
                          <ul className="space-y-1">
                            {row.warnings.map((w, i) => (
                              <li key={i} className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready for Certificate Generation
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            {summary.errorCount > 0 && (
              <button
                type="button"
                onClick={onDownloadErrorReport}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download Error Report (.xlsx)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              Close
            </button>
            {summary.validCount > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onProceedToReview();
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Review & Edit Data ({summary.validCount})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. STAGING / REVIEW TABLE MODAL (Inline Student Data Editor)
// ---------------------------------------------------------------------------
interface ExcelStagingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: Student[];
  typeConfig: CertificateTypeConfig;
  importedDataMap: Record<string, Record<string, any>>;
  onUpdateStudentData: (studentId: string, updatedFields: Record<string, any>) => void;
  onRemoveStudentFromBatch: (studentId: string) => void;
  onProceedToPreview: () => void;
  onDownloadErrorReport?: () => void;
  hasErrors?: boolean;
}

export const ExcelStagingReviewModal: React.FC<ExcelStagingReviewModalProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  typeConfig,
  importedDataMap,
  onUpdateStudentData,
  onRemoveStudentFromBatch,
  onProceedToPreview,
  onDownloadErrorReport,
  hasErrors
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isTC = isTransferCertificate(typeConfig);
  const configuredColumns = useMemo(() => getExcelColumnsForCertificate(typeConfig), [typeConfig]);

  // Filter editable certificate columns (excluding read-only columns)
  const editableColumns = useMemo(() => {
    return configuredColumns.filter(c => !c.isReadOnly);
  }, [configuredColumns]);

  const filteredStudents = useMemo(() => {
    return selectedStudents.filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [selectedStudents, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-6xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Review & Edit Individual Certificate Data
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  {selectedStudents.length} Students
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Target: <strong>{typeConfig.name}</strong> • Edit any student values inline before final preview and issuance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search and Helper Info */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/20">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-sky-500 shrink-0" />
            <span>
              All modifications are staged live. You can exclude any student by clicking the trash button.
            </span>
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by name, adm no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Staging Data Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 shadow-xs">
                    Student Details
                  </th>
                  {editableColumns.map(col => (
                    <th key={col.key} className="p-3 min-w-[160px]">
                      {col.header}
                    </th>
                  ))}
                  <th className="p-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((st, idx) => {
                  const studentData = importedDataMap[st.id] || {};
                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3 text-center font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      {/* Sticky Student Identifier Column */}
                      <td className="p-3 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-xs">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {st.firstName} {st.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Adm: {st.admissionNo} • {st.className}-{st.section}
                        </div>
                      </td>

                      {/* Dynamic Editable Fields */}
                      {editableColumns.map(col => {
                        const val = studentData[col.key] ?? '';
                        return (
                          <td key={col.key} className="p-2">
                            {col.type === 'dropdown' ? (
                              <select
                                value={val}
                                onChange={e => {
                                  onUpdateStudentData(st.id, { [col.key]: e.target.value });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                              >
                                <option value="">-- Select --</option>
                                {(col.options || []).map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : col.type === 'date' ? (
                              <DateInput
                                value={val}
                                separator="/"
                                placeholder="DD/MM/YYYY"
                                disableClamping={true}
                                onChange={e => {
                                  onUpdateStudentData(st.id, { [col.key]: e.target.value });
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                              />
                            ) : (
                              <input
                                type={col.type === 'number' ? 'number' : 'text'}
                                value={val}
                                placeholder={col.description || `Enter ${col.header}...`}
                                onChange={e => {
                                  onUpdateStudentData(st.id, { [col.key]: e.target.value });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Remove Button */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveStudentFromBatch(st.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Exclude student from bulk certificate issue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Ready for Issue: <strong>{selectedStudents.length} Students</strong>
            </span>
            {hasErrors && onDownloadErrorReport && (
              <button
                type="button"
                onClick={onDownloadErrorReport}
                className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <FileDown className="w-3 h-3" /> Error Report
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              Done Editing
            </button>
            <button
              onClick={() => {
                onClose();
                onProceedToPreview();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Proceed to Certificate Preview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
