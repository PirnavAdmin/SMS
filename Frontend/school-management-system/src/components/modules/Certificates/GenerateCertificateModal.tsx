import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Printer, 
  Download, ArrowRight, Eye, Calendar, Award, Building2, User, UserCheck, RefreshCw
} from 'lucide-react';
import { 
  Student, GeneratedCertificateRecord, CertificateTypeConfig, CertificateTemplateConfig 
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { PrintableCertificateContainer } from './PrintableCertificateContainer';
import { INITIAL_CERTIFICATE_TYPES, INITIAL_CERTIFICATE_TEMPLATES } from '../Settings/CertificateSettingsTab';
import { formatDateDDMMYYYY } from '../../../utils/dateValidation';

interface GenerateCertificateModalProps {
  initialStudent?: Student | null;
  initialCertificateType?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (record: GeneratedCertificateRecord) => void;
  existingRecord?: GeneratedCertificateRecord | null;
}

export const GenerateCertificateModal: React.FC<GenerateCertificateModalProps> = ({
  initialStudent,
  initialCertificateType,
  isOpen,
  onClose,
  onSuccess,
  existingRecord
}) => {
  const { students, schoolProfile, academicClasses, calculateStudentPayableFee, getStudentFeeOutstandingSummary } = useData();
  const { selectedAcademicYear, selectedBranch } = useAuth();
  const { addToast } = useToast();
  const activeAY = selectedAcademicYear || '2026–2027';

  // Load Certificate Types & Templates from localStorage or initial defaults
  const certificateTypes = useMemo<CertificateTypeConfig[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CERTIFICATE_TYPES;
  }, [isOpen]);

  const certificateTemplates = useMemo<CertificateTemplateConfig[]>(() => {
    try {
      const saved = localStorage.getItem('edu_db_certificate_templates_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CERTIFICATE_TEMPLATES;
  }, [isOpen]);

  // Selected Student & Certificate Type State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    existingRecord?.studentId || initialStudent?.id || ''
  );
  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    existingRecord?.certificateTypeId || initialCertificateType || certificateTypes[0]?.id || 'CT-TC'
  );

  useEffect(() => {
    if (existingRecord) {
      setSelectedStudentId(existingRecord.studentId);
      setSelectedTypeId(existingRecord.certificateTypeId);
    } else if (initialStudent) {
      setSelectedStudentId(initialStudent.id);
    }
  }, [existingRecord, initialStudent]);

  const selectedStudent = useMemo(() => {
    if (existingRecord) {
      return students.find(s => s.id === existingRecord.studentId) || {
        id: existingRecord.studentId,
        admissionNo: existingRecord.admissionNo,
        firstName: existingRecord.studentName.split(' ')[0] || '',
        lastName: existingRecord.studentName.split(' ').slice(1).join(' ') || '',
        className: existingRecord.className,
        section: existingRecord.section,
        gender: 'Male',
        dob: '2012-08-15',
        status: 'Active',
        avatar: '',
        joiningDate: '2024-06-15',
        rollNo: '1',
        category: 'General'
      } as Student;
    }
    return students.find(s => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId, existingRecord]);

  const selectedTypeConfig = useMemo(() => {
    return certificateTypes.find(t => t.id === selectedTypeId || t.name === selectedTypeId) || certificateTypes[0];
  }, [certificateTypes, selectedTypeId]);

  const selectedTemplate = useMemo(() => {
    if (existingRecord?.templateSnapshot) {
      return existingRecord.templateSnapshot;
    }
    const found = certificateTemplates.find(t => t.certificateTypeId === selectedTypeConfig?.id || t.certificateTypeName === selectedTypeConfig?.name);
    if (found) return found;

    return {
      id: `TPL-${selectedTypeConfig?.id}`,
      certificateTypeId: selectedTypeConfig?.id || 'CT-TC',
      certificateTypeName: selectedTypeConfig?.name || 'Certificate',
      title: (selectedTypeConfig?.name || 'CERTIFICATE').toUpperCase(),
      headerStyle: 'Classic Double Border' as const,
      themeColor: '#1e3a8a',
      showLogo: true,
      showSchoolHeader: true,
      bodyTemplate: `This is to certify that {{studentName}}, Admission No. {{admissionNumber}}, Class {{class}}, is a student of {{schoolName}}. Issued on {{issueDate}}.`,
      footerText: 'Official Certificate issued by School Authority.',
      signatories: [
        { id: '1', title: 'Class Teacher', show: true },
        { id: '2', title: 'Accounts Officer', show: true },
        { id: '3', title: 'Principal', name: 'Dr. Robert Miller', show: true }
      ],
      showSeal: true,
      dateFormat: 'DD/MM/YYYY'
    };
  }, [certificateTemplates, selectedTypeConfig, existingRecord]);

  // Dynamic Input Form State
  const [leavingDate, setLeavingDate] = useState<string>(
    existingRecord?.leavingDate || new Date().toISOString().split('T')[0]
  );
  const [reasonForLeaving, setReasonForLeaving] = useState<string>(
    existingRecord?.reason || 'Parent Request / Relocation'
  );
  const [conduct, setConduct] = useState<string>(
    existingRecord?.conduct || 'Good & Exemplary'
  );
  const [remarks, setRemarks] = useState<string>(
    existingRecord?.remarks || 'Promoted to Higher Class / Course Completed'
  );
  const [identificationMarks, setIdentificationMarks] = useState<string>(
    existingRecord?.fieldDataSnapshot?.moleIdentification ||
    existingRecord?.fieldDataSnapshot?.identificationMarks ||
    (selectedStudent as any)?.identificationMarks ||
    (selectedStudent as any)?.identificationMark1 ||
    '1. A mole on the right cheek  2. A mole on the left shoulder'
  );

  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Calculate unique Certificate Number
  const generatedCertNo = useMemo(() => {
    if (existingRecord?.certificateNumber) return existingRecord.certificateNumber;
    const prefix = selectedTypeConfig?.numberingPrefix || 'CERT';
    const length = selectedTypeConfig?.numberingLength || 4;
    const yearPart = selectedTypeConfig?.includeAcademicYearInNo ? `-${activeAY.split('–')[0] || '2026'}-` : '-';
    
    // Count existing issued certificates of this type
    try {
      const saved = localStorage.getItem('edu_db_generated_certificates');
      if (saved) {
        const records: GeneratedCertificateRecord[] = JSON.parse(saved);
        const count = records.filter(r => r.certificateTypeId === selectedTypeConfig?.id).length + 1;
        return `${prefix}${yearPart}${String(count).padStart(length, '0')}`;
      }
    } catch (e) {}

    return `${prefix}${yearPart}0001`;
  }, [selectedTypeConfig, activeAY, existingRecord]);

  if (!isOpen) return null;

  const handleGenerateAndSave = () => {
    if (!selectedStudent) {
      addToast('warning', 'Selection Required', 'Please select a student to issue certificate.');
      return;
    }

    const studentFullName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;

    const newRecord: GeneratedCertificateRecord = {
      id: existingRecord?.id || `REC-CERT-${Date.now()}`,
      certificateNumber: generatedCertNo,
      certificateTypeId: selectedTypeConfig.id,
      certificateTypeName: selectedTypeConfig.name,
      studentId: selectedStudent.id,
      admissionNo: selectedStudent.admissionNo,
      studentName: studentFullName,
      className: selectedStudent.className,
      section: selectedStudent.section,
      academicYear: activeAY,
      branch: selectedStudent.branch || selectedBranch || 'Main Campus',
      issueDate: new Date().toISOString().split('T')[0],
      status: 'Issued',
      generatedBy: 'Authorized Administrator',
      remarks,
      leavingDate,
      reason: reasonForLeaving,
      conduct,
      tcNo: generatedCertNo,
      fieldDataSnapshot: {
        studentName: studentFullName,
        admissionNumber: selectedStudent.admissionNo,
        class: selectedStudent.className,
        section: selectedStudent.section,
        academicYear: activeAY,
        dateOfBirth: selectedStudent.dob,
        fatherName: selectedStudent.parentName || '—',
        dateOfAdmission: selectedStudent.joiningDate,
        dateOfLeaving: leavingDate,
        reasonForLeaving,
        conduct,
        remarks,
        moleIdentification: identificationMarks,
        identificationMarks: identificationMarks,
        certificateNumber: generatedCertNo,
        issueDate: new Date().toISOString().split('T')[0]
      },
      templateSnapshot: selectedTemplate
    };

    // Save into localStorage history
    try {
      const saved = localStorage.getItem('edu_db_generated_certificates');
      let records: GeneratedCertificateRecord[] = saved ? JSON.parse(saved) : [];
      records = [newRecord, ...records.filter(r => r.id !== newRecord.id)];
      localStorage.setItem('edu_db_generated_certificates', JSON.stringify(records));
      
      // Also update legacy TC register for backward compatibility
      if (selectedTypeConfig.name === 'Transfer Certificate') {
        const legacyTcRecords = localStorage.getItem('edu_db_tc_register');
        let tcList = legacyTcRecords ? JSON.parse(legacyTcRecords) : [];
        tcList = [newRecord, ...tcList.filter((r: any) => r.id !== newRecord.id)];
        localStorage.setItem('edu_db_tc_register', JSON.stringify(tcList));
      }
    } catch (e) {
      console.error('Failed to save generated certificate record', e);
    }

    addToast('success', 'Certificate Generated', `Generated ${selectedTypeConfig.name} #${generatedCertNo} for ${studentFullName}`);
    
    if (onSuccess) onSuccess(newRecord);
    setActiveTab('preview');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[95vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {existingRecord ? `Certificate Details: #${existingRecord.certificateNumber}` : 'Generate Official School Certificate'}
              </h3>
              <p className="text-xs text-slate-500">
                Select student, certificate type, fill required details, and issue with unique snapshot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'form' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Configuration Form
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'preview' ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Certificate Preview
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'form' ? (
            <div className="space-y-5">
              {/* Step 1 & 2: Student Selection & Certificate Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    1. Select Student *
                  </label>
                  <select
                    disabled={!!existingRecord}
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="">-- Search / Select Student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.admissionNo}) — Class {s.className}-{s.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    2. Select Certificate Type *
                  </label>
                  <select
                    disabled={!!existingRecord}
                    value={selectedTypeId}
                    onChange={e => setSelectedTypeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    {certificateTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Student Information Summary */}
              {selectedStudent && (
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center">
                      {selectedStudent.firstName[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Adm No: {selectedStudent.admissionNo} • Class: {selectedStudent.className}-{selectedStudent.section}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <p>DOB: {formatDateDDMMYYYY(selectedStudent.dob)}</p>
                    <p>Session: <strong>{activeAY}</strong></p>
                  </div>
                </div>
              )}

              {/* Step 3: Required Input Fields for Selected Certificate Type */}
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    3. Certificate Specific Fields & Remarks
                  </h4>
                  <span className="text-[11px] font-mono text-sky-600 font-bold">
                    Auto Cert No: {generatedCertNo}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Date of Leaving / Issue Date</label>
                    <input
                      type="date"
                      value={leavingDate}
                      onChange={e => setLeavingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">General Conduct / Remarks</label>
                    <input
                      type="text"
                      value={conduct}
                      onChange={e => setConduct(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
                      placeholder="e.g. Exemplary / Satisfactory"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Reason for Certificate Request / Leaving</label>
                    <input
                      type="text"
                      value={reasonForLeaving}
                      onChange={e => setReasonForLeaving(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
                      placeholder="e.g. Higher Studies / Parent Relocation / Official Purpose"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Mole Identification / Personal Identification Marks</label>
                    <input
                      type="text"
                      value={identificationMarks}
                      onChange={e => setIdentificationMarks(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-medium text-slate-900 dark:text-white outline-none"
                      placeholder="e.g. 1. A mole on the right cheek  2. A mole on the left shoulder"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Special Remarks (Included in Certificate Records)</label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
                      placeholder="Additional notes or clearance details..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW TAB */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rendering Preview for {selectedTypeConfig.name} ({generatedCertNo})
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
              </div>

              <div className="glass-card p-4 rounded-3xl bg-slate-200 dark:bg-slate-950 overflow-x-auto">
                <PrintableCertificateContainer
                  template={selectedTemplate}
                  schoolProfile={schoolProfile}
                  academicYear={activeAY}
                  studentName={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Rahul Kumar'}
                  admissionNo={selectedStudent?.admissionNo || 'ADM-2024-089'}
                  admissionDate={selectedStudent?.joiningDate || '2024-06-15'}
                  fatherName={selectedStudent?.parentName || 'Vikram Kumar'}
                  motherName="Sunita Kumar"
                  dob={selectedStudent?.dob || '2012-08-15'}
                  gender={selectedStudent?.gender || 'Male'}
                  className={selectedStudent?.className || 'Class 10'}
                  section={selectedStudent?.section || 'A'}
                  rollNo={selectedStudent?.rollNo || '12'}
                  leavingDate={leavingDate}
                  reason={reasonForLeaving}
                  conduct={conduct}
                  remarks={remarks}
                  identificationMarks={identificationMarks}
                  moleIdentification={identificationMarks}
                  result="PASSED"
                  feeClearanceStatus="FULL DUES CLEARED"
                  certificateNumber={generatedCertNo}
                  tcNo={generatedCertNo}
                  issueDate={new Date().toISOString().split('T')[0]}
                  isDraftPreview={!existingRecord}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>

            {!existingRecord && (
              <button
                onClick={handleGenerateAndSave}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Award className="w-4 h-4" /> Generate & Issue Certificate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
