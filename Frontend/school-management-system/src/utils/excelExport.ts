import * as XLSX from "xlsx";

/**
 * Exports tabular data to an Excel (.xlsx) file with automatically calculated
 * column widths so text is never truncated or clipped when opened in Excel.
 */
export function exportToExcel(
  data: Record<string, any>[] | any[][],
  filename: string = "export_data",
  sheetName: string = "Sheet1"
) {
  if (!data || data.length === 0) {
    throw new Error("No data available to export");
  }

  let ws: XLSX.WorkSheet;

  if (Array.isArray(data[0])) {
    // Array of arrays format
    const rows = data as any[][];
    ws = XLSX.utils.aoa_to_sheet(rows);

    const numCols = Math.max(...rows.map((r) => (Array.isArray(r) ? r.length : 0)));
    const colWidths: { wch: number }[] = [];

    for (let c = 0; c < numCols; c++) {
      let maxLen = 10;
      for (let r = 0; r < rows.length; r++) {
        const val = rows[r]?.[c];
        const str = val !== null && val !== undefined ? String(val).trim() : "";
        if (str.length > maxLen) {
          maxLen = str.length;
        }
      }
      colWidths.push({ wch: Math.min(Math.max(maxLen + 4, 14), 60) });
    }
    ws["!cols"] = colWidths;
  } else {
    // Array of objects format
    const rows = data as Record<string, any>[];
    const headers = Object.keys(rows[0] || {});
    ws = XLSX.utils.json_to_sheet(rows);

    const colWidths: { wch: number }[] = headers.map((key) => {
      let maxLen = key.length;
      for (let i = 0; i < rows.length; i++) {
        const val = rows[i]?.[key];
        let str = "";
        if (val !== null && val !== undefined) {
          if (typeof val === "object") {
            str = JSON.stringify(val);
          } else {
            str = String(val).trim();
          }
        }
        if (str.length > maxLen) {
          maxLen = str.length;
        }
      }
      return { wch: Math.min(Math.max(maxLen + 4, 14), 60) };
    });

    ws["!cols"] = colWidths;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  const cleanFilename = filename.toLowerCase().endsWith(".xlsx")
    ? filename
    : `${filename}.xlsx`;

  XLSX.writeFile(wb, cleanFilename);
}
