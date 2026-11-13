import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";

import { exportToExcel } from "../../utils/excelExport";

interface ExportButtonProps<T> {
  data: T[];
  filename?: string;
  filteredCount?: number;
  className?: string;
  label?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export function ExportButton<T extends Record<string, any>>({
  data,
  filename = "export_data",
  filteredCount,
  className = "",
  label = "Download",
  emptyMessage = "No data available to export. Please select filters or load data first.",
  disabled,
}: ExportButtonProps<T>) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { addToast } = useToast();

  const isDataEmpty = !data || data.length === 0;
  const isButtonDisabled = disabled !== undefined ? disabled : (isDownloading || isDataEmpty);

  const handleExportExcel = () => {
    if (isButtonDisabled) return;

    if (isDataEmpty) {
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
      try {
        exportToExcel(data, filename);
        if (addToast) {
          addToast(
            "success",
            "Download Complete",
            `Exported ${data.length} record(s) successfully in Excel (.xlsx) format.`
          );
        }
      } catch (err: any) {
        console.error("Export error:", err);
        if (addToast) {
          addToast("error", "Export Failed", err.message || "Failed to export Excel file");
        }
      } finally {
        setIsDownloading(false);
      }
    }, 400);
  };

  const defaultClasses =
    "btn-glass-pill px-4 py-2 flex items-center gap-2 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95";

  return (
    <button
      onClick={handleExportExcel}
      disabled={isButtonDisabled}
      className={className || defaultClasses}
      title={isDataEmpty ? "No data available to export" : "Download Excel Report"}
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
