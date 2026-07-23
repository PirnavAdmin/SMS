import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface ExportButtonProps<T> {
  data: T[];
  filename?: string;
  filteredCount?: number;
}

export function ExportButton<T extends Record<string, any>>({
  data,
  filename = 'export_data',
  filteredCount
}: ExportButtonProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportExcel = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Header row
    csvRows.push(headers.join(','));

    // Data rows
    data.forEach(row => {
      const values = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_filtered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).slice(0, 7); // Pick primary columns
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = data.map(row => `
      <tr>
        ${headers.map(h => `<td style="padding:8px; border:1px solid #ddd;">${row[h] !== undefined ? row[h] : ''}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${filename} Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1e293b; }
            h2 { margin-bottom: 5px; color: #4f46e5; }
            p { color: #64748b; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
          </style>
        </head>
        <body>
          <h2>School Management System - Filtered Report</h2>
          <p>Export Date: ${new Date().toLocaleDateString()} • Total Records: ${data.length}</p>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h.toUpperCase()}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
      >
        <Download className="w-3.5 h-3.5 text-brand-600" />
        <span>Export Filtered ({filteredCount ?? data.length})</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-1.5 animate-in fade-in space-y-1">
          <button
            onClick={handleExportExcel}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel (.CSV)
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4" /> Export Printable PDF
          </button>
        </div>
      )}
    </div>
  );
}
