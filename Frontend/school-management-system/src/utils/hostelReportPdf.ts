/**
 * Utility for client-side formatted PDF generation and download for Hostel Reports.
 * Generates standards-compliant multi-page PDF documents via Canvas + JPEG embedding.
 */

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function buildMultiPagePdf(pages: { bytes: Uint8Array; width: number; height: number }[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const pushStr = (str: string) => {
    const b = encoder.encode(str);
    chunks.push(b);
    currentOffset += b.length;
  };

  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    currentOffset += b.length;
  };

  const startObj = (id: number) => {
    offsets[id] = currentOffset;
    pushStr(`${id} 0 obj\n`);
  };

  const endObj = () => {
    pushStr('endobj\n');
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // 1: Catalog
  startObj(1);
  pushStr('<< /Type /Catalog /Pages 2 0 R >>\n');
  endObj();

  // 2: Pages root
  const pageCount = pages.length;
  const pageObjIds = Array.from({ length: pageCount }, (_, i) => 3 + i * 3);

  startObj(2);
  pushStr(`<< /Type /Pages /Kids [${pageObjIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>\n`);
  endObj();

  for (let i = 0; i < pageCount; i++) {
    const pageObjId = 3 + i * 3;
    const imgObjId = 4 + i * 3;
    const contentObjId = 5 + i * 3;
    const page = pages[i];

    // Page object
    startObj(pageObjId);
    pushStr(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\n`);
    endObj();

    // Image XObject
    startObj(imgObjId);
    pushStr(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`);
    pushBytes(page.bytes);
    pushStr('\nendstream\n');
    endObj();

    // Page Content stream
    const contentStream = `q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);
    startObj(contentObjId);
    pushStr(`<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushStr('\nendstream\n');
    endObj();
  }

  // Cross-reference table
  const totalObjs = 2 + pageCount * 3;
  const xrefOffset = currentOffset;
  pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= totalObjs; id++) {
    const off = String(offsets[id] || 0).padStart(10, '0');
    pushStr(`${off} 00000 n \n`);
  }

  // Trailer
  pushStr(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const pdfBytes = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    pdfBytes.set(chunk, pos);
    pos += chunk.length;
  }
  return pdfBytes;
}

export interface HostelReportPdfOptions {
  reportTitle: string;
  data: Record<string, any>[];
  schoolName?: string;
  schoolTagline?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  academicYear?: string;
  blockFilter?: string;
  filename?: string;
}

export function downloadHostelReportPdf(options: HostelReportPdfOptions): void {
  const {
    reportTitle,
    data,
    schoolName = 'PIRNAV EDUCATIONAL INSTITUTIONS',
    schoolTagline = 'Empowering Minds, Shaping Tomorrow',
    schoolAddress = 'Main Campus, Knowledge Park, Hyderabad',
    schoolPhone = '+91 98765 43210',
    academicYear = '2025-2026',
    blockFilter = 'All Blocks',
    filename = `Hostel_${reportTitle.replace(/\s+/g, '_')}_Report.pdf`
  } = options;

  const width = 1240;
  const height = 1754; // A4 aspect ratio at ~150 DPI
  const marginX = 60;
  const contentW = width - marginX * 2;
  const fontSans = `'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;

  const headers = data.length > 0 ? Object.keys(data[0]) : ['Record', 'Details', 'Status'];
  const colCount = Math.max(headers.length, 1);
  const colWidth = contentW / colCount;

  // Pagination parameters
  const rowsPerPageFirst = 22;
  const rowsPerPageLater = 28;
  const totalPages = data.length <= rowsPerPageFirst
    ? 1
    : 1 + Math.ceil((data.length - rowsPerPageFirst) / rowsPerPageLater);

  const pagesData: { bytes: Uint8Array; width: number; height: number }[] = [];

  let dataIndex = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    let y = 60;

    if (pageNum === 1) {
      // Primary Institutional Header
      ctx.fillStyle = '#0f172a';
      ctx.font = `900 28px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(schoolName.toUpperCase(), width / 2, y);

      y += 24;
      ctx.fillStyle = '#64748b';
      ctx.font = `600 15px ${fontSans}`;
      ctx.fillText(schoolTagline, width / 2, y);

      y += 20;
      ctx.font = `500 14px ${fontSans}`;
      ctx.fillText(`${schoolAddress} • Ph: ${schoolPhone}`, width / 2, y);

      y += 30;
      // Report Title Banner
      ctx.fillStyle = '#0284c7';
      ctx.font = `900 20px ${fontSans}`;
      ctx.fillText(`HOSTEL REPORT — ${reportTitle.toUpperCase()}`, width / 2, y);

      y += 18;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(width - marginX, y);
      ctx.stroke();

      y += 24;
      // Metadata Bar
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(marginX, y, contentW, 40);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(marginX, y, contentW, 40);

      ctx.fillStyle = '#475569';
      ctx.font = `600 13px ${fontSans}`;
      ctx.textAlign = 'left';
      ctx.fillText(`Academic Year: ${academicYear}`, marginX + 16, y + 25);
      ctx.fillText(`Hostel Block: ${blockFilter}`, marginX + 300, y + 25);
      ctx.fillText(`Total Records: ${data.length}`, marginX + 620, y + 25);
      ctx.fillText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, marginX + 850, y + 25);

      y += 55;
    } else {
      // Subsequent Page Condensed Header
      ctx.fillStyle = '#0f172a';
      ctx.font = `800 18px ${fontSans}`;
      ctx.textAlign = 'left';
      ctx.fillText(`${schoolName.toUpperCase()} — HOSTEL REPORT: ${reportTitle.toUpperCase()}`, marginX, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = `600 13px ${fontSans}`;
      ctx.fillText(`Page ${pageNum} of ${totalPages}`, width - marginX, y);

      y += 12;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(width - marginX, y);
      ctx.stroke();

      y += 25;
    }

    // Table Header
    const rowH = 34;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(marginX, y, contentW, rowH);

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 12px ${fontSans}`;
    ctx.textAlign = 'left';
    headers.forEach((h, idx) => {
      const colX = marginX + idx * colWidth + 8;
      ctx.fillText(h.toUpperCase(), colX, y + 22);
    });

    y += rowH;

    // Table Rows
    const rowsThisPage = pageNum === 1 ? rowsPerPageFirst : rowsPerPageLater;
    const pageRows = data.slice(dataIndex, dataIndex + rowsThisPage);
    dataIndex += rowsThisPage;

    if (pageRows.length === 0 && pageNum === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(marginX, y, contentW, 60);
      ctx.fillStyle = '#64748b';
      ctx.font = `600 14px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText('No report records found matching the active filters.', width / 2, y + 36);
      y += 60;
    } else {
      pageRows.forEach((row, rIdx) => {
        const isEven = rIdx % 2 === 0;
        ctx.fillStyle = isEven ? '#ffffff' : '#f8fafc';
        ctx.fillRect(marginX, y, contentW, rowH);

        // Row bottom border
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(marginX, y + rowH);
        ctx.lineTo(width - marginX, y + rowH);
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = `500 12px ${fontSans}`;
        ctx.textAlign = 'left';

        headers.forEach((h, cIdx) => {
          const colX = marginX + cIdx * colWidth + 8;
          const val = String(row[h] ?? '—');
          // Truncate text if exceeds column width
          const maxTextWidth = colWidth - 16;
          let renderText = val;
          if (ctx.measureText(renderText).width > maxTextWidth) {
            while (renderText.length > 4 && ctx.measureText(`${renderText}...`).width > maxTextWidth) {
              renderText = renderText.slice(0, -1);
            }
            renderText = `${renderText}...`;
          }
          ctx.fillText(renderText, colX, y + 22);
        });

        y += rowH;
      });
    }

    // Outer table border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(marginX, y - (pageRows.length * rowH + (pageRows.length === 0 ? 60 : 0) + rowH), contentW, (pageRows.length * rowH + (pageRows.length === 0 ? 60 : 0) + rowH));

    // Page Footer
    const footerY = height - 45;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginX, footerY - 15);
    ctx.lineTo(width - marginX, footerY - 15);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 12px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('Generated securely by School Management System', marginX, footerY);

    ctx.textAlign = 'right';
    ctx.fillText(`Page ${pageNum} of ${totalPages}`, width - marginX, footerY);

    // Convert Canvas to JPEG bytes
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const jpegBytes = dataUrlToUint8Array(jpegDataUrl);
    pagesData.push({ bytes: jpegBytes, width, height });
  }

  // Build binary PDF
  const pdfBytes = buildMultiPagePdf(pagesData);
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
