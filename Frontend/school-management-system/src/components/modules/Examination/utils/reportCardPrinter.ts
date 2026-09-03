import { ProcessedResult, ExamSetup, SubjectItem } from '../../../../types';
import { resolveMediaUrl } from '../../../../utils/mediaUtils';

export function generateReportCardHtml(
  data: ProcessedResult,
  exam: ExamSetup | null,
  schoolProfile: any = {},
  subjects: SubjectItem[] = []
): string {
  const schoolName = schoolProfile?.name || 'Central School ERP';
  const schoolAddress = schoolProfile?.address || 'Institutional Campus, Main Road';
  const schoolContact = `${schoolProfile?.phone ? `Ph: ${schoolProfile.phone} ` : ''}${schoolProfile?.email ? `• Email: ${schoolProfile.email}` : ''}`;
  const examName = exam?.name || 'Term Assessment Examination';
  const academicYear = exam?.academicYear || '2026-2027';

  const subjectRows = (data.subjectMarks || []).map((sub: any) => {
    const match = subjects.find(s => s.name === sub.subject || s.code === sub.subject || s.id === sub.subject);
    const subCode = match?.code || `${sub.subject.substring(0, 3).toUpperCase()}-101`;
    const isPass = sub.isPass !== false;
    const isAbsent = sub.obtainedMarks === 'AB' || (sub.obtainedMarks === '0' && sub.isAbsent);

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-weight: 700; color: #1e293b;">
          ${sub.subject}
          <span style="display: block; font-size: 10px; color: #64748b; font-family: monospace;">${subCode}</span>
        </td>
        <td style="padding: 10px 14px; text-align: center; font-family: monospace; font-weight: 700; color: #475569;">${sub.maxMarks || 100}</td>
        <td style="padding: 10px 14px; text-align: center; font-family: monospace; font-weight: 800; color: ${isAbsent ? '#ef4444' : '#0f172a'};">
          ${sub.obtainedMarks}
        </td>
        <td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #4f46e5;">${sub.grade || '—'}</td>
        <td style="padding: 10px 14px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; background-color: ${isPass ? '#dcfce7' : '#fee2e2'}; color: ${isPass ? '#166534' : '#991b1b'};">
            ${isAbsent ? 'Absent' : isPass ? 'Pass' : 'Fail'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="report-card-container" style="max-width: 800px; margin: 0 auto 30px auto; border: 2px solid #0284c7; border-radius: 16px; padding: 24px; background: #ffffff; page-break-after: always;">
      <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 6px;">
          ${schoolProfile?.logoUrl ? `<img src="${resolveMediaUrl(schoolProfile.logoUrl)}" style="width: 55px; height: 55px; border-radius: 10px; object-fit: contain;" alt="Logo" />` : ''}
          <div style="text-align: left;">
            <div style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0369a1;">${schoolName}</div>
            <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 2px;">${schoolAddress} ${schoolContact ? `• ${schoolContact}` : ''}</div>
          </div>
        </div>
        <div style="margin-top: 10px; display: inline-block; background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 16px; border-radius: 9999px;">
          Student Progress Report Card
        </div>
        <div style="font-size: 12px; font-weight: 800; color: #0284c7; margin-top: 6px; text-transform: uppercase;">${examName} • Academic Session ${academicYear}</div>
      </div>

      <!-- Student Details -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 11px;">
        <div>
          <label style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px;">Student Name</label>
          <span style="font-weight: 800; color: #0f172a;">${data.studentName}</span>
        </div>
        <div>
          <label style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px;">Roll Number</label>
          <span style="font-weight: 800; color: #0f172a; font-family: monospace;">${data.rollNo || 'N/A'}</span>
        </div>
        <div>
          <label style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px;">Admission No.</label>
          <span style="font-weight: 800; color: #0f172a; font-family: monospace;">${data.admissionNo}</span>
        </div>
        <div>
          <label style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px;">Class & Section</label>
          <span style="font-weight: 800; color: #0f172a;">${data.className} - ${data.section}</span>
        </div>
      </div>

      <!-- Scholastic Performance Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden;">
        <thead>
          <tr style="background: #f1f5f9; color: #475569; font-weight: 800; font-size: 10px; text-transform: uppercase;">
            <th style="text-align: left; padding: 10px 14px; border-bottom: 2px solid #cbd5e1;">Subject</th>
            <th style="text-align: center; padding: 10px 14px; border-bottom: 2px solid #cbd5e1;">Maximum Marks</th>
            <th style="text-align: center; padding: 10px 14px; border-bottom: 2px solid #cbd5e1;">Obtained Marks</th>
            <th style="text-align: center; padding: 10px 14px; border-bottom: 2px solid #cbd5e1;">Grade</th>
            <th style="text-align: center; padding: 10px 14px; border-bottom: 2px solid #cbd5e1;">Result</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>

      <!-- Summary Totals -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 24px;">
        <div style="background: #ffffff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 8px 4px;">
          <label style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">Total Marks</label>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a;">${data.totalObtainedMarks} / ${data.totalMaxMarks}</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 8px 4px;">
          <label style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">Percentage</label>
          <div style="font-size: 14px; font-weight: 900; color: #0284c7;">${data.percentage.toFixed(1)}%</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 8px 4px;">
          <label style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">Overall Grade</label>
          <div style="font-size: 14px; font-weight: 900; color: #4f46e5;">${data.finalGrade}</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 8px 4px;">
          <label style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">Class Rank</label>
          <div style="font-size: 14px; font-weight: 900; color: #d97706;">#${data.rank}</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 8px 4px;">
          <label style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">Final Status</label>
          <div style="font-size: 14px; font-weight: 900; color: ${data.passStatus === 'Pass' ? '#166534' : '#991b1b'};">${data.passStatus}</div>
        </div>
      </div>

      <!-- Signature Footer -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; padding-top: 24px; margin-top: 10px;">
        <div>
          <div style="height: 35px;"></div>
          <div style="border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; font-weight: 800; color: #475569;">Class Teacher Signature</div>
        </div>
        <div>
          <div style="height: 35px;"></div>
          <div style="border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; font-weight: 800; color: #475569;">Exam Coordinator</div>
        </div>
        <div>
          <div style="height: 35px;"></div>
          <div style="border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; font-weight: 800; color: #475569;">Principal / Head of Institution</div>
        </div>
      </div>
    </div>
  `;
}

export function generateFullDocumentHtml(bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Student Report Cards</title>
      <style>
        @page {
          size: portrait;
          margin: 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #0f172a;
          padding: 16px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `;
}

export function printReportCard(
  data: ProcessedResult,
  exam: ExamSetup | null,
  schoolProfile: any = {},
  subjects: SubjectItem[] = []
) {
  const cardHtml = generateReportCardHtml(data, exam, schoolProfile, subjects);
  const fullHtml = generateFullDocumentHtml(cardHtml);
  const printWindow = window.open('', '_blank', 'width=880,height=950');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}

export function printBulkReportCards(
  resultsList: ProcessedResult[],
  exam: ExamSetup | null,
  schoolProfile: any = {},
  subjects: SubjectItem[] = []
) {
  const allCardsHtml = resultsList
    .map(r => generateReportCardHtml(r, exam, schoolProfile, subjects))
    .join('');
  const fullHtml = generateFullDocumentHtml(allCardsHtml);
  const printWindow = window.open('', '_blank', 'width=880,height=950');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}

export function downloadReportCardPdf(
  data: ProcessedResult,
  exam: ExamSetup | null,
  schoolProfile: any = {},
  subjects: SubjectItem[] = []
) {
  const cardHtml = generateReportCardHtml(data, exam, schoolProfile, subjects);
  const fullHtml = generateFullDocumentHtml(cardHtml);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeName = (data.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  const safeExam = (exam?.name || 'ReportCard').replace(/[^a-zA-Z0-9]/g, '_');
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}_${safeExam}_Report_Card.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
