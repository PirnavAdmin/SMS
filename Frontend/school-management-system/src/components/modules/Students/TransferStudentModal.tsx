import React, { useState, useMemo } from 'react';
import { 
  X, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Printer, 
  Download, ArrowRight, Eye, Calendar, Award, Building2, User, UserCheck
} from 'lucide-react';
import { Student, TcRecord, CertificateTemplateConfig } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { PrintableCertificateContainer } from '../Certificates/PrintableCertificateContainer';

interface TransferStudentModalProps {
  student: Student | null;
  existingTcRecord?: TcRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (tcRecord: TcRecord) => void;
}

export const TransferStudentModal: React.FC<TransferStudentModalProps> = ({
  student,
  existingTcRecord,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { schoolProfile, transferStudent, logActivity, updateStudent, calculateStudentPayableFee, getStudentFeeOutstandingSummary } = useData();
  const { selectedAcademicYear } = useAuth();
  const { addToast } = useToast();
  const activeAY = selectedAcademicYear || '2025-2026';

  const schoolName = schoolProfile?.name || "St. Xavier's International School";
  const schoolAddress = schoolProfile?.address || "Knowledge City, Main Campus, New York 10001";
  const schoolLogo = schoolProfile?.logoUrl;

  // Load Certificate Template Configuration from Settings or existing TcRecord snapshot
  const tcTemplateConfig = useMemo(() => {
    if (existingTcRecord?.templateSnapshot) {
      return existingTcRecord.templateSnapshot;
    }
    try {
      const savedTemplates = localStorage.getItem('edu_db_certificate_templates');
      if (savedTemplates) {
        const templates: CertificateTemplateConfig[] = JSON.parse(savedTemplates);
        const found = templates.find(t => t.certificateType === 'Transfer Certificate' || t.id === 'TPL-TC');
        if (found) return found;
      }
    } catch (e) {
      console.error('Failed to load TC template config from localStorage', e);
    }
    return {
      id: 'TPL-TC',
      certificateType: 'Transfer Certificate',
      title: 'OFFICIAL TRANSFER CERTIFICATE',
      subTitle: 'CBSE Affiliation No: 883012 • School Code: 40192',
      headerStyle: 'Classic Double Border' as const,
      themeColor: '#1e3a8a',
      showLogo: true,
      showSeal: true,
      signatory1: 'Class Teacher Signature',
      signatory2: 'Verified By (Accounts)',
      signatory3: 'Principal Signature & Seal',
      customPreamble: 'Certified that the student details listed below are verified from original school admission registers.',
      footerDisclaimer: 'Official Transfer Certificate issued in accordance with Education Code Rules.'
    };
  }, [existingTcRecord]);

  const [activeTab, setActiveTab] = useState<'verification' | 'details' | 'preview'>('verification');

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [leavingDate, setLeavingDate] = useState<string>(existingTcRecord?.leavingDate || todayStr);
  const [reason, setReason] = useState<string>(existingTcRecord?.reason || 'Parent Request');
  const [conduct, setConduct] = useState<string>(existingTcRecord?.conduct || 'Good');
  const [remarks, setRemarks] = useState<string>(existingTcRecord?.remarks || 'Dues cleared. All original records verified.');

  // Clearance Override State
  const [overrideClearance, setOverrideClearance] = useState<boolean>(existingTcRecord?.clearanceSummary?.overridden || false);
  const [overrideReason, setOverrideReason] = useState<string>(existingTcRecord?.clearanceSummary?.overrideReason || '');

  // Generate unique TC number
  const tcNumber = useMemo(() => {
    if (existingTcRecord) return existingTcRecord.tcNo;
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `TC-${year}-${randomSeq}`;
  }, [existingTcRecord]);

  if (!isOpen || !student) return null;

  // Clearances Check
  const summary = student ? getStudentFeeOutstandingSummary(student.id) : null;
  const dueFee = summary ? summary.totalOutstanding : (student?.dueFee || 0);
  const isFeeCleared = dueFee === 0;
  const isClearancePassed = isFeeCleared || overrideClearance;

  // Date in Words Helper
  const convertDateToWords = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
      const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
      let day = 0, month = 0, year = 0;
      if (dateStr.includes('/')) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      } else {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }
      if (isNaN(day) || isNaN(month) || isNaN(year)) return dateStr;

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const ordinals = [
        "", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
        "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth",
        "Twenty-First", "Twenty-Second", "Twenty-Third", "Twenty-Fourth", "Twenty-Fifth", "Twenty-Sixth", "Twenty-Seventh", "Twenty-Eighth", "Twenty-Ninth", "Thirtieth", "Thirty-First"
      ];

      const dayWord = ordinals[day] || day.toString();
      const monthWord = monthNames[month] || "";
      let yearInWords = year.toString();
      if (year >= 2000 && year < 2030) {
        const ones = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const rem = year - 2000;
        if (rem === 0) yearInWords = "Two Thousand";
        else if (rem < 20) yearInWords = `Two Thousand ${ones[rem]}`;
        else {
          const tens = ["", "", "Twenty", "Thirty"];
          yearInWords = `Two Thousand ${tens[Math.floor(rem / 10)]} ${ones[rem % 10] || ''}`.trim();
        }
      }

      return `${dayWord} ${monthWord} ${yearInWords}`.trim();
    } catch {
      return dateStr;
    }
  };

  const handleIssueTC = () => {
    if (!isClearancePassed) {
      addToast('error', 'Clearance Verification Failed', 'Outstanding dues exist. Please clear dues or authorize an administrative override.');
      return;
    }

    const studentResult = (student as any).finalResult || (student as any).result || (student.gpa && student.gpa >= 2.0 ? 'PASSED (Promoted)' : 'PASSED');
    const tcRecord: TcRecord = {
      id: existingTcRecord ? existingTcRecord.id : `TCR-${Date.now()}`,
      tcNo: tcNumber,
      issueDate: todayStr,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      admissionDate: student.joiningDate || (student as any).admissionDate || 'N/A',
      fatherName: student.fatherName || 'N/A',
      motherName: student.motherName || 'N/A',
      dob: student.dob,
      gender: student.gender,
      className: student.className,
      section: student.section,
      rollNo: student.rollNo,
      academicYear: activeAY,
      branch: student.branch || 'Main Campus',
      leavingDate,
      reason,
      destinationSchool: '',
      result: studentResult,
      conduct,
      remarks,
      issuedBy: 'Principal / Administrator',
      status: existingTcRecord ? 'Reissued' : 'Issued',
      templateSnapshot: tcTemplateConfig,
      clearanceSummary: {
        feeCleared: isFeeCleared,
        dueFee,
        libraryCleared: true,
        transportCleared: true,
        hostelCleared: true,
        overridden: overrideClearance,
        overrideReason: overrideClearance ? overrideReason : undefined
      },
      auditLog: {
        generatedBy: 'System Administrator',
        generatedDate: todayStr,
        issuedBy: 'Principal / Administrator',
        issuedDate: todayStr,
        lastPrintedDate: todayStr,
        reissueCount: existingTcRecord ? (existingTcRecord.auditLog.reissueCount || 0) + 1 : 0
      }
    };

    try {
      const existingRegisterJson = localStorage.getItem('edu_db_tc_register');
      const register: TcRecord[] = existingRegisterJson ? JSON.parse(existingRegisterJson) : [];
      const updatedRegister = [tcRecord, ...register.filter(r => r.studentId !== student.id)];
      localStorage.setItem('edu_db_tc_register', JSON.stringify(updatedRegister));
    } catch (e) {
      console.error('Failed to update TC register in localStorage', e);
    }

    transferStudent(student.id, reason);
    updateStudent(student.id, { remarks: `TC Issued: ${tcNumber} on ${todayStr}` });

    logActivity('Issued Transfer Certificate', `Issued official TC ${tcNumber} for ${student.firstName} ${student.lastName} (${student.admissionNo}). Status updated to Transferred.`);
    addToast('success', 'Transfer Certificate Issued', `Official TC ${tcNumber} issued for ${student.firstName} ${student.lastName}.`);

    if (onSuccess) {
      onSuccess(tcRecord);
    }
    onClose();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transfer Certificate - ${student.firstName} ${student.lastName}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Times New Roman', serif; padding: 25px; color: #1e293b; background: #ffffff; margin: 0; }
          .cert-border { border: 8px double ${tcTemplateConfig.themeColor || '#1e3a8a'}; padding: 30px; border-radius: 8px; }
          .header { text-align: center; border-bottom: 2px solid ${tcTemplateConfig.themeColor || '#1e3a8a'}; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: ${tcTemplateConfig.themeColor || '#1e3a8a'}; margin: 12px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
          td.label { font-weight: bold; width: 45%; color: #475569; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-box { text-align: center; }
          .sig-line { border-top: 1px solid #64748b; padding-top: 4px; font-weight: bold; font-size: 12px; }
          .seal-box { width: 70px; height: 70px; border: 2px dashed ${tcTemplateConfig.themeColor || '#1e3a8a'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; color: ${tcTemplateConfig.themeColor || '#1e3a8a'}; transform: rotate(12deg); margin: 0 auto 5px auto; }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <div class="header">
            <h1 style="margin:0; font-size: 26px; text-transform: uppercase;">${schoolName}</h1>
            <p style="margin:4px 0; font-size: 12px; color: #475569;">${schoolAddress} • ${tcTemplateConfig.subTitle}</p>
            <div class="title">${tcTemplateConfig.title || 'OFFICIAL TRANSFER CERTIFICATE'}</div>
            <p style="font-size: 12px; margin: 4px 0;">TC No: <strong>${tcNumber}</strong> | Issue Date: <strong>${todayStr}</strong> | Adm No: <strong>${student.admissionNo}</strong></p>
          </div>
          <table>
            <tr><td class="label">1. Name of Student:</td><td style="font-weight:bold; text-transform:uppercase;">${student.firstName} ${student.lastName}</td></tr>
            <tr><td class="label">2. Father's / Guardian's Name:</td><td>${student.fatherName || 'N/A'}</td></tr>
            <tr><td class="label">3. Mother's Name:</td><td>${student.motherName || 'N/A'}</td></tr>
            <tr><td class="label">4. Gender & Date of Birth:</td><td>${student.gender} • ${student.dob} (${convertDateToWords(student.dob)})</td></tr>
            <tr><td class="label">5. Class & Section Last Studied:</td><td>${student.className} - ${student.section} (Roll No: ${student.rollNo})</td></tr>
            <tr><td class="label">6. Date of Admission:</td><td>${student.joiningDate || '2022-06-10'}</td></tr>
            <tr><td class="label">7. Annual Exam Result:</td><td>${student.gpa >= 2.0 ? 'PASS (Promoted to Higher Class)' : 'FAIL'}</td></tr>
            <tr><td class="label">8. Date of Leaving School:</td><td>${leavingDate}</td></tr>
            <tr><td class="label">9. Reason for Leaving School:</td><td>${reason}</td></tr>
            <tr><td class="label">10. General Conduct:</td><td>${conduct}</td></tr>
            <tr><td class="label">11. Remarks:</td><td>${remarks}</td></tr>
          </table>
          <div class="footer">
            <div class="sig-box">
              <div style="height:35px;"></div>
              <div class="sig-line">${tcTemplateConfig.signatory1 || 'Class Teacher Signature'}</div>
            </div>
            <div class="sig-box">
              <div style="height:35px;"></div>
              <div class="sig-line">${tcTemplateConfig.signatory2 || 'Verified By'}</div>
            </div>
            <div class="sig-box">
              ${tcTemplateConfig.showSeal ? `<div class="seal-box">OFFICIAL SEAL</div>` : `<div style="height:35px;"></div>`}
              <div class="sig-line">${tcTemplateConfig.signatory3 || 'Principal Signature & Stamp'}</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    addToast('info', 'Printing TC Certificate', `Opened print preview for TC ${tcNumber}.`);
  };

  const handleDownloadPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transfer Certificate - ${student.firstName} ${student.lastName}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #1e293b; }
          .cert-border { border: 8px double ${tcTemplateConfig.themeColor || '#1e3a8a'}; padding: 30px; }
          .header { text-align: center; border-b: 2px solid ${tcTemplateConfig.themeColor || '#1e3a8a'}; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: ${tcTemplateConfig.themeColor || '#1e3a8a'}; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
          td.label { font-weight: bold; width: 45%; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <div class="header">
            <h1 style="margin:0; font-size: 26px; text-transform: uppercase;">${schoolName}</h1>
            <p style="margin:4px 0; font-size: 13px;">${schoolAddress} • ${tcTemplateConfig.subTitle}</p>
            <div class="title">${tcTemplateConfig.title || 'OFFICIAL TRANSFER CERTIFICATE'}</div>
            <p>TC No: <strong>${tcNumber}</strong> | Issue Date: <strong>${todayStr}</strong> | Adm No: <strong>${student.admissionNo}</strong></p>
          </div>
          <table>
            <tr><td class="label">1. Name of Student:</td><td>${student.firstName} ${student.lastName}</td></tr>
            <tr><td class="label">2. Father's / Guardian's Name:</td><td>${student.fatherName || 'N/A'}</td></tr>
            <tr><td class="label">3. Mother's Name:</td><td>${student.motherName || 'N/A'}</td></tr>
            <tr><td class="label">4. Gender & Date of Birth:</td><td>${student.gender} • ${student.dob} (${convertDateToWords(student.dob)})</td></tr>
            <tr><td class="label">5. Class & Section Last Studied:</td><td>${student.className} - ${student.section} (Roll No: ${student.rollNo})</td></tr>
            <tr><td class="label">6. Date of Admission:</td><td>${student.joiningDate || '2022-06-10'}</td></tr>
            <tr><td class="label">7. Annual Exam Result:</td><td>${student.gpa >= 2.0 ? 'PASS / PROMOTED' : 'FAIL'}</td></tr>
            <tr><td class="label">8. Date of Leaving School:</td><td>${leavingDate}</td></tr>
            <tr><td class="label">9. Reason for Leaving:</td><td>${reason}</td></tr>
            <tr><td class="label">10. General Conduct:</td><td>${conduct}</td></tr>
            <tr><td class="label">11. Remarks:</td><td>${remarks}</td></tr>
          </table>
          <div class="footer">
            <div><br/><br/>_______________________<br/><strong>${tcTemplateConfig.signatory1 || 'Class Teacher'}</strong></div>
            <div><br/><br/>_______________________<br/><strong>${tcTemplateConfig.signatory2 || 'Verified By'}</strong></div>
            <div style="text-align: right;"><br/><br/>_______________________<br/><strong>${tcTemplateConfig.signatory3 || 'Principal Signature & Stamp'}</strong></div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transfer_Certificate_${student.admissionNo}_${student.firstName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast('success', 'TC Downloaded', `Downloaded TC HTML/PDF document for ${student.firstName}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-black tracking-wide">
                {existingTcRecord ? 'View Transfer Certificate' : 'Issue Official Transfer Certificate (TC)'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono text-[11px] border border-white/20 font-bold">
                {tcNumber}
              </span>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tab Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'verification'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4" /> 1. Verification & Clearances
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'details'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" /> 2. Enter TC Details
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Eye className="w-4 h-4" /> 3. Official Certificate Preview
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              student.status === 'Transferred' 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {student.status}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 grow">
          
          {/* TAB 1: VERIFICATION & CLEARANCES */}
          {activeTab === 'verification' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-600" /> Student Verification Records
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-400 font-semibold">Student Name:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{student.firstName} {student.lastName}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold">Admission Number:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{student.admissionNo}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold">Date of Birth:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.dob} ({convertDateToWords(student.dob)})</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold">Father's Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.fatherName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold">Mother's Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.motherName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold">Current Class & Section:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.className} - {student.section} (Roll No: {student.rollNo})</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold">Date of First Admission:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.joiningDate || '2022-06-10'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold">Academic Result:</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-black ${
                      student.gpa >= 2.0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {student.gpa >= 2.0 ? 'PASS (GPA ' + student.gpa + ')' : 'FAIL'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-semibold">Branch:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.branch || 'Main Campus'}</span>
                  </div>
                </div>
              </div>

              {/* Clearance Verification Checks */}
              <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Automatic Department Clearances
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    isClearancePassed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {isClearancePassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {isClearancePassed ? 'Clearance Verification Passed' : 'Clearance Verification Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`p-3.5 rounded-2xl border ${
                    isFeeCleared ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50' : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                  }`}>
                    <span className="block text-[11px] font-bold text-slate-500">Finance & Fee Dues</span>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-xs font-black ${isFeeCleared ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {isFeeCleared ? '✓ Fee Cleared' : `❌ Dues: ₹${dueFee.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                    <span className="block text-[11px] font-bold text-slate-500">Library Books</span>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">✓ Cleared (0 pending)</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                    <span className="block text-[11px] font-bold text-slate-500">Transport & Bus Pass</span>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">✓ Cleared</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                    <span className="block text-[11px] font-bold text-slate-500">Hostel & Room Keys</span>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">✓ Cleared</span>
                    </div>
                  </div>
                </div>

                {!isFeeCleared && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-semibold">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p>
                          <strong>Outstanding dues found: ₹{dueFee.toLocaleString()}.</strong> School policy requires all tuition and facility dues to be cleared before TC issuance.
                        </p>
                        {summary && (
                          <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                            Current Year Due: ₹{summary.currentYearDue.toLocaleString()} | Previous Academic Years Due: ₹{summary.previousYearsDue.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {summary && summary.yearWiseOutstanding.length > 0 && (
                      <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-[11px] space-y-1">
                        <p className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">Annual Outstanding Dues Breakdown:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {summary.yearWiseOutstanding.map(yr => (
                            <div key={yr.academicYear} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{yr.academicYear}</span>
                              <span className={`font-black ${yr.due > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {yr.due > 0 ? `₹${yr.due.toLocaleString()}` : '✓ Paid'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-extrabold text-slate-900 dark:text-white">
                        <input
                          type="checkbox"
                          checked={overrideClearance}
                          onChange={e => setOverrideClearance(e.target.checked)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                        Authorize Administrative Override to proceed with TC issuance
                      </label>

                      {overrideClearance && (
                        <input
                          type="text"
                          placeholder="Override reason / Designation note..."
                          value={overrideReason}
                          onChange={e => setOverrideReason(e.target.value)}
                          className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={() => setActiveTab('details')}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  Proceed to TC Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ENTER TC DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" /> Transfer Certificate Information Form
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Generated TC Serial Number</label>
                    <input
                      type="text"
                      readOnly
                      value={tcNumber}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Issue Date</label>
                    <input
                      type="text"
                      readOnly
                      value={todayStr}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Date of Leaving School *</label>
                    <input
                      type="date"
                      required
                      value={leavingDate}
                      onChange={e => setLeavingDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Reason for Leaving *</label>
                    <select
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="Parent Request">Parent Request</option>
                      <option value="Family Relocation">Family Relocation</option>
                      <option value="Higher Education">Higher Education</option>
                      <option value="Change of School">Change of School</option>
                      <option value="Completed School Education">Completed School Education</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">General Conduct</label>
                    <select
                      value={conduct}
                      onChange={e => setConduct(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="Good">Good</option>
                      <option value="Exemplary">Exemplary</option>
                      <option value="Satisfactory">Satisfactory</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Official Certificate Remarks</label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('verification')}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Back to Clearances
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  Generate Preview <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: OFFICIAL CERTIFICATE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6 animate-in fade-in">
              <PrintableCertificateContainer
                template={tcTemplateConfig}
                schoolProfile={schoolProfile}
                academicYear={activeAY}
                studentName={`${student.firstName} ${student.lastName}`}
                admissionNo={student.admissionNo}
                admissionDate={student.joiningDate || (student as any).admissionDate || 'N/A'}
                fatherName={student.fatherName || 'N/A'}
                motherName={student.motherName || 'N/A'}
                dob={student.dob}
                dobInWords={convertDateToWords(student.dob)}
                gender={student.gender}
                className={student.className}
                section={student.section}
                rollNo={student.rollNo}
                leavingDate={leavingDate}
                reason={reason}
                conduct={conduct}
                remarks={remarks}
                result={(student as any).finalResult || (student as any).result || (student.gpa >= 2.0 ? 'PASSED (Promoted)' : 'PASSED')}
                feeClearanceStatus={isFeeCleared ? 'CLEARED' : (overrideClearance ? 'OVERRIDDEN (PENDING)' : 'PENDING')}
                tcNo={tcNumber}
                issueDate={todayStr}
                isDraftPreview={!existingTcRecord}
              />
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {activeTab === 'preview' && (
              <>
                {(existingTcRecord || student.status === 'Transferred') ? (
                  <>
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print TC
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleIssueTC}
                    className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Issue TC & Update Status
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
