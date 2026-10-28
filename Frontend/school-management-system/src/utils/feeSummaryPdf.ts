export interface FeeSummaryPdfData {
  schoolName?: string;
  schoolTagline?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  academicYear: string;
  studentType: string;
  appliedFeeItems: Array<{
    headName?: string;
    category?: string;
    originalAmount?: number;
  }>;
  notApplicableItems: Array<{
    headName?: string;
    remarks?: string;
  }>;
  totalScholarship?: number;
  totalDiscount?: number;
  totalPayable: number;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillStyle?: string,
  strokeStyle?: string,
  lineWidth = 1
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function buildPdfFromJpeg(jpegBytes: Uint8Array, imgWidth: number, imgHeight: number): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const startObj = (id: number) => {
    offsets[id] = currentOffset;
    pushStr(`${id} 0 obj\n`);
  };

  const endObj = () => {
    pushStr(`endobj\n`);
  };

  // PDF 1.4 Header
  pushStr(`%PDF-1.4\n%\xFF\xFF\xFF\xFF\n`);

  // 1: Catalog
  startObj(1);
  pushStr(`<< /Type /Catalog /Pages 2 0 R >>\n`);
  endObj();

  // 2: Pages
  startObj(2);
  pushStr(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n`);
  endObj();

  // 3: Page (A4: 595.28 x 841.89 pt)
  startObj(3);
  pushStr(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\n`
  );
  endObj();

  // 4: Image XObject
  startObj(4);
  pushStr(
    `<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr(`\nendstream\n`);
  endObj();

  // 5: Page Content Stream
  const contentStream = `q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = encoder.encode(contentStream);
  startObj(5);
  pushStr(`<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushStr(`\nendstream\n`);
  endObj();

  // Cross-reference table
  const xrefOffset = currentOffset;
  pushStr(`xref\n0 6\n0000000000 65535 f \n`);
  for (let i = 1; i <= 5; i++) {
    const off = String(offsets[i] || 0).padStart(10, '0');
    pushStr(`${off} 00000 n \n`);
  }

  // Trailer
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const pdfBytes = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    pdfBytes.set(chunk, pos);
    pos += chunk.length;
  }
  return pdfBytes;
}

export function downloadFeeSummaryPdf(data: FeeSummaryPdfData, filename: string): void {
  const width = 1240;
  const height = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fontSans = `'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;
  const formatINR = (amount: number) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const marginX = 90;
  const contentW = width - marginX * 2;
  let y = 85;

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.font = `900 34px ${fontSans}`;
  ctx.textAlign = 'center';
  ctx.fillText((data.schoolName || 'PIRNAV EDUCATIONAL INSTITUTIONS').toUpperCase(), width / 2, y);

  y += 28;
  ctx.fillStyle = '#64748b';
  ctx.font = `600 17px ${fontSans}`;
  ctx.fillText(data.schoolTagline || 'Empowering Minds, Shaping Tomorrow', width / 2, y);

  y += 24;
  ctx.font = `500 16px ${fontSans}`;
  ctx.fillText(
    `${data.schoolAddress || ''}${data.schoolPhone ? ` • ${data.schoolPhone}` : ''}`,
    width / 2,
    y
  );

  y += 38;
  ctx.fillStyle = '#0284c7';
  ctx.font = `900 22px ${fontSans}`;
  ctx.fillText('OFFICIAL STUDENT ACADEMIC FEE SUMMARY STATEMENT', width / 2, y);

  y += 22;
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(width - marginX, y);
  ctx.stroke();

  y += 35;

  // Student Info Card
  const cardH = 190;
  drawRoundedRect(ctx, marginX, y, contentW, cardH, 20, '#f8fafc', '#cbd5e1', 2);

  const leftLabelX = marginX + 36;
  const rightValX = width - marginX - 36;
  const rowGap = 38;
  let rowY = y + 42;

  const drawInfoRow = (label: string, val: string, valColor = '#0f172a', isBadge = false) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = `600 20px ${fontSans}`;
    ctx.fillText(label, leftLabelX, rowY);

    ctx.textAlign = 'right';
    if (isBadge) {
      ctx.font = `800 17px ${fontSans}`;
      const textWidth = ctx.measureText(val).width;
      const badgeW = textWidth + 32;
      const badgeH = 30;
      drawRoundedRect(ctx, rightValX - badgeW, rowY - 21, badgeW, badgeH, 15, '#e0f2fe');
      ctx.fillStyle = '#075985';
      ctx.fillText(val, rightValX - 16, rowY);
    } else {
      ctx.fillStyle = valColor;
      ctx.font = `800 21px ${fontSans}`;
      ctx.fillText(val, rightValX, rowY);
    }
    rowY += rowGap;
  };

  drawInfoRow('Student Name:', data.studentName || 'Student');
  drawInfoRow('Admission No:', data.admissionNo || '—', '#0284c7');
  const classDisplay = data.section
    ? `${data.className || '—'} - ${data.section} (${data.academicYear || ''})`
    : `${data.className || '—'} (${data.academicYear || ''})`;
  drawInfoRow(data.section ? 'Class & Section:' : 'Class:', classDisplay);
  drawInfoRow('Student Type:', data.studentType || 'Day Scholar', '#075985', true);

  y += cardH + 42;

  // APPLIED FEE TYPES Section
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = `800 19px ${fontSans}`;
  ctx.fillText('APPLIED FEE TYPES', marginX, y);
  y += 18;

  if (data.appliedFeeItems.length === 0) {
    const emptyBoxH = 95;
    drawRoundedRect(ctx, marginX, y, contentW, emptyBoxH, 20, '#ffffff', '#e2e8f0', 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 21px ${fontSans}`;
    ctx.fillText('Standard Fee Structure Applied', width / 2, y + 55);
    y += emptyBoxH + 40;
  } else {
    const itemRowH = 54;
    const boxH = Math.max(90, data.appliedFeeItems.length * itemRowH + 24);
    drawRoundedRect(ctx, marginX, y, contentW, boxH, 20, '#ffffff', '#e2e8f0', 2);

    let itemY = y + 44;
    data.appliedFeeItems.forEach((item, idx) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#10b981';
      ctx.font = `800 20px ${fontSans}`;
      ctx.fillText('✓', marginX + 32, itemY);

      ctx.fillStyle = '#1e293b';
      ctx.font = `700 20px ${fontSans}`;
      ctx.fillText(item.headName || 'Fee Item', marginX + 62, itemY);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = `800 21px ${fontSans}`;
      ctx.fillText(formatINR(item.originalAmount || 0), width - marginX - 32, itemY);

      if (idx < data.appliedFeeItems.length - 1) {
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(marginX + 28, itemY + 16);
        ctx.lineTo(width - marginX - 28, itemY + 16);
        ctx.stroke();
      }
      itemY += itemRowH;
    });
    y += boxH + 40;
  }

  // NOT APPLICABLE Section
  if (data.notApplicableItems.length > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = `800 19px ${fontSans}`;
    ctx.fillText('NOT APPLICABLE', marginX, y);
    y += 18;

    const naRowH = 48;
    const naBoxH = data.notApplicableItems.length * naRowH + 28;
    drawRoundedRect(ctx, marginX, y, contentW, naBoxH, 20, '#f8fafc', '#e2e8f0', 2);

    let naY = y + 42;
    data.notApplicableItems.forEach((item) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f87171';
      ctx.font = `700 19px ${fontSans}`;
      ctx.fillText('⊗', marginX + 32, naY);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `600 19px ${fontSans}`;
      ctx.fillText(item.headName || 'Fee Item', marginX + 62, naY);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.font = `italic 500 17px ${fontSans}`;
      ctx.fillText(item.remarks || 'Not Opted', width - marginX - 32, naY);

      naY += naRowH;
    });
    y += naBoxH + 40;
  }

  // Total Payable Box
  const hasScholarship = (data.totalScholarship || 0) > 0;
  const hasDiscount = (data.totalDiscount || 0) > 0;
  const extraRows = (hasScholarship ? 1 : 0) + (hasDiscount ? 1 : 0);
  const totalBoxH = 115 + extraRows * 38;

  drawRoundedRect(ctx, marginX, y, contentW, totalBoxH, 22, '#ecfdf5', '#a7f3d0', 2.5);

  let totY = y + 38;
  if (hasScholarship) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#065f46';
    ctx.font = `600 19px ${fontSans}`;
    ctx.fillText('Scholarship Deduction:', marginX + 36, totY);
    ctx.textAlign = 'right';
    ctx.fillText(`- ${formatINR(data.totalScholarship || 0)}`, width - marginX - 36, totY);
    totY += 38;
  }
  if (hasDiscount) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#065f46';
    ctx.font = `600 19px ${fontSans}`;
    ctx.fillText('Discount / Concession:', marginX + 36, totY);
    ctx.textAlign = 'right';
    ctx.fillText(`- ${formatINR(data.totalDiscount || 0)}`, width - marginX - 36, totY);
    totY += 38;
  }

  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX + 32, totY - 12);
  ctx.lineTo(width - marginX - 32, totY - 12);
  ctx.stroke();

  const mainTotY = totY + 34;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#022c22';
  ctx.font = `900 25px ${fontSans}`;
  ctx.fillText('TOTAL PAYABLE', marginX + 36, mainTotY);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#059669';
  ctx.font = `900 34px ${fontSans}`;
  ctx.fillText(formatINR(data.totalPayable || 0), width - marginX - 36, mainTotY);

  // Signatures at bottom
  const sigY = height - 120;
  const sigWidth = 280;
  const sigPositions = [
    marginX + sigWidth / 2,
    width / 2,
    width - marginX - sigWidth / 2,
  ];
  const sigLabels = [
    'Parent / Guardian Signature',
    'Accounts Officer Signature',
    'Principal Stamp & Signature',
  ];

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = '#475569';
  ctx.font = `700 16px ${fontSans}`;
  ctx.textAlign = 'center';

  sigPositions.forEach((centerX, i) => {
    ctx.beginPath();
    ctx.moveTo(centerX - sigWidth / 2, sigY);
    ctx.lineTo(centerX + sigWidth / 2, sigY);
    ctx.stroke();
    ctx.fillText(sigLabels[i], centerX, sigY + 26);
  });

  // Export Canvas -> JPEG -> PDF Blob
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const jpegBytes = dataUrlToUint8Array(jpegDataUrl);
  const pdfBytes = buildPdfFromJpeg(jpegBytes, width, height);

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
