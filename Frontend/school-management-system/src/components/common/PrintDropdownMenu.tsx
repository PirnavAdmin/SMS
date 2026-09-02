import React, { useState, useRef, useEffect } from 'react';
import { Printer, FileText, FileCode, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { exportToExcel } from '../../utils/excelExport';

interface PrintDropdownMenuProps {
  title?: string;
  data?: Record<string, any>[];
  filename?: string;
  onPrint?: () => void;
  onPdf?: () => void;
  onWord?: () => void;
  onCsv?: () => void;
}

export const PrintDropdownMenu: React.FC<PrintDropdownMenuProps> = ({
  title = 'Report',
  data = [],
  filename = 'report',
  onPrint,
  onPdf,
  onWord,
  onCsv
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDefaultPrint = () => {
    setIsOpen(false);
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDefaultPdf = () => {
    setIsOpen(false);
    if (onPdf) {
      onPdf();
    } else {
      addToast('info', 'Preparing PDF Print', `Printing ${title} as PDF...`);
      window.print();
    }
  };

  const handleDefaultWord = () => {
    setIsOpen(false);
    if (onWord) {
      onWord();
      return;
    }
    if (!data || data.length === 0) {
      addToast('warning', 'No Records', 'No records available to export as Word document.');
      return;
    }
    const keys = Object.keys(data[0]);
    let tableHtml = `<table border="1" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:12px;"><thead><tr style="background:#f1f5f9;">`;
    keys.forEach(k => { tableHtml += `<th style="padding:8px;text-align:left;background-color:#0284c7;color:#ffffff;">${k}</th>`; });
    tableHtml += `</tr></thead><tbody>`;
    data.forEach(row => {
      tableHtml += `<tr>`;
      keys.forEach(k => { tableHtml += `<td style="padding:6px;border:1px solid #cbd5e1;">${row[k] !== undefined && row[k] !== null ? String(row[k]) : ''}</td>`; });
      tableHtml += `</tr>`;
    });
    tableHtml += `</tbody></table>`;

    const content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title></head>
    <body style="font-family:sans-serif;padding:20px;">
      <h2 style="color:#0f172a;margin-bottom:4px;">${title}</h2>
      <p style="color:#64748b;font-size:11px;margin-top:0;margin-bottom:16px;">Generated: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} | Total Records: ${data.length}</p>
      ${tableHtml}
    </body></html>`;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanFilename = filename.toLowerCase().replace(/\s+/g, '_');
    a.download = `${cleanFilename}_${new Date().toISOString().split('T')[0]}.doc`;
    a.click();
    addToast('success', 'Word Document Exported', `Successfully downloaded Word document for ${title}.`);
  };

  const handleDefaultCsv = () => {
    setIsOpen(false);
    if (onCsv) {
      onCsv();
      return;
    }
    if (!data || data.length === 0) {
      addToast('warning', 'No Records', 'No records available to export.');
      return;
    }
    const cleanFilename = `${filename.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    try {
      exportToExcel(data, cleanFilename);
      addToast('success', 'Spreadsheet Exported', `Successfully downloaded Excel report for ${title}.`);
    } catch (err: any) {
      console.error("Export error:", err);
      addToast('error', 'Export Failed', err.message || 'Failed to export Excel file.');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 transition-all cursor-pointer"
        title="Click to select print or export format"
      >
        <Printer className="w-4 h-4" />
        <span>Print</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
          <button
            onClick={handleDefaultPrint}
            className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800/80 hover:text-sky-600 transition-colors flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Printer className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-xs">Print / PDF Preview</p>
              <p className="text-[10px] text-slate-400 font-medium">Browser print & PDF dialog</p>
            </div>
          </button>

          <button
            onClick={handleDefaultPdf}
            className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-800/80 hover:text-rose-600 transition-colors flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-xs">Export PDF (.pdf)</p>
              <p className="text-[10px] text-slate-400 font-medium">Save as PDF document</p>
            </div>
          </button>

          <button
            onClick={handleDefaultWord}
            className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/80 hover:text-blue-600 transition-colors flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileCode className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-xs">Export Word (.docx)</p>
              <p className="text-[10px] text-slate-400 font-medium">Save as Word document</p>
            </div>
          </button>

          <button
            onClick={handleDefaultCsv}
            className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800/80 hover:text-emerald-600 transition-colors flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white text-xs">Export Excel / CSV (.csv)</p>
              <p className="text-[10px] text-slate-400 font-medium">Save as Excel spreadsheet</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
