import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface ExportButtonProps<T> {
  data: T[];
  filename?: string;
  filteredCount?: number;
  className?: string;
  label?: string;
  emptyMessage?: string;
}

export function ExportButton<T extends Record<string, any>>({
  data,
  filename = "export_data",
  filteredCount,
  className = "",
  label = "Download",
  emptyMessage = "No data available to export. Please select filters or load data first.",
}: ExportButtonProps<T>) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { addToast } = useToast();

  const handleExportExcel = () => {
    if (isDownloading) return;

    if (!data || data.length === 0) {
      if (addToast) {
        addToast(
          "warning",
          "No Data Available",
          emptyMessage
        );
      } else {
        alert(emptyMessage);
      }
      return;
    }

    setIsDownloading(true);

    setTimeout(() => {
      const headers = Object.keys(data[0]);
      const csvRows: string[] = [];

      // Header row
      csvRows.push(headers.join(","));

      // Data rows
      data.forEach((row) => {
        const values = headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '""';
          if (typeof val === "object")
            return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsDownloading(false);
      if (addToast) {
        addToast(
          "success",
          "Download Started",
          `Exported ${data.length} record(s) successfully.`
        );
      }
    }, 600);
  };

  const defaultClasses =
    "px-4 py-2.5 flex items-center gap-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all shadow-xs border border-emerald-200/50 dark:border-emerald-500/20 disabled:opacity-75 disabled:cursor-not-allowed";

  return (
    <button
      onClick={handleExportExcel}
      disabled={isDownloading}
      className={className || defaultClasses}
      title="Download Excel Report"
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{isDownloading ? "Downloading..." : label}</span>
    </button>
  );
}
