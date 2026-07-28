import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  X, CheckCircle2, ShieldCheck, FileText, Eye, Download, Layers
} from 'lucide-react';
import { Staff, StaffDocument } from '../../../types';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';

interface StaffProfileDrawerProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffProfileDrawer: React.FC<StaffProfileDrawerProps> = ({ staff: staffProp, isOpen, onClose }) => {
  const {
    staff: allStaff, salaryStructures, employeeSalaryAssignments, getRequiredDocuments
  } = useData();

  // Resolve live staff object from DataContext state
  const staff = allStaff.find(s => s.id === staffProp?.id) || staffProp;

  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'bank' | 'payroll'>('info');

  // Postview Document Preview Modal State
  const [postviewDoc, setPostviewDoc] = useState<StaffDocument | null>(null);

  if (!isOpen || !staff) return null;

  // Helper function for smart document matching
  const findMatchingUploadedDoc = (docs: StaffDocument[], reqType: string): StaffDocument | undefined => {
    const reqLower = reqType.toLowerCase();
    
    // 1. Exact match on type or title
    const exact = docs.find(d => (d.type || '').toLowerCase() === reqLower || (d.title || '').toLowerCase() === reqLower);
    if (exact) return exact;

    // 2. Keyword fallback matching
    return docs.find(d => {
      const tLower = (d.type || '').toLowerCase();
      const titleLower = (d.title || '').toLowerCase();
      const str = `${tLower} ${titleLower}`;

      if (reqLower.includes('pan')) return str.includes('pan');
      if (reqLower.includes('aadhaar') || reqLower.includes('adhar')) return str.includes('aadhaar') || str.includes('adhar') || str.includes('uidai');
      if (reqLower.includes('license') || reqLower.includes('licence')) return str.includes('license') || str.includes('licence') || str.includes('dl');
      if (reqLower.includes('medical')) return str.includes('medical') || str.includes('health') || str.includes('fitness');
      if (reqLower.includes('police')) return str.includes('police') || str.includes('verification') || str.includes('clearance');
      if (reqLower.includes('bank') || reqLower.includes('passbook')) return str.includes('bank') || str.includes('passbook') || str.includes('cheque');
      if (reqLower.includes('degree')) return str.includes('degree') || str.includes('graduation') || str.includes('certificate');
      if (reqLower.includes('b.ed')) return str.includes('b.ed') || str.includes('bed');
      if (reqLower.includes('experience')) return str.includes('experience') || str.includes('relieving');

      return false;
    });
  };

  // Dynamically compute required documents for this staff member's Dept & Designation
  const requiredDocTypeList = getRequiredDocuments(staff.department, staff.designation);

  // Summary Metrics
  const uploadedDocs = staff.documents || [];
  const requiredUploadedCount = requiredDocTypeList.filter(reqType =>
    !!findMatchingUploadedDoc(uploadedDocs, reqType)
  ).length;

  const verifiedCount = uploadedDocs.filter(d => d.verificationStatus === 'Verified').length;
  const missingCount = Math.max(0, requiredDocTypeList.length - requiredUploadedCount);

  const currentAssignment = employeeSalaryAssignments?.find(a => a.employeeId === staff.id);
  const currentStructure = salaryStructures?.find(s => s.id === currentAssignment?.salaryStructureId);

  const renderPayrollTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="font-bold uppercase text-slate-400 text-[11px] tracking-wider">Salary & Compensation Plan</h3>
            <p className="text-xs text-slate-500">Base salary tier, earnings breakdown & deductions</p>
          </div>
        </div>

        {currentStructure ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase">Assigned Plan</span>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">{currentStructure.structureName}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Salary</span>
                <p className="font-black text-base text-brand-600">{formatCurrency(currentStructure.grossSalary)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <h5 className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300 uppercase">Earnings Components</h5>
                <div className="space-y-1 text-xs">
                  {(currentStructure.earnings || []).map((e, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{e.name}</span><span className="font-bold">{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 space-y-2">
                <h5 className="font-extrabold text-xs text-rose-800 dark:text-rose-300 uppercase">Deduction Components</h5>
                <div className="space-y-1 text-xs">
                  {(currentStructure.deductions || []).map((d, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{d.name}</span><span className="font-bold">{formatCurrency(d.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs">
            Standard compensation tier assigned based on designation ({formatCurrency(staff.salary || 0)}/mo).
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Read-Only Profile Header */}
        <div className="p-6 bg-gradient-to-r from-brand-600 to-sky-600 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={staff.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{staff.firstName} {staff.lastName}</h2>
                <Badge variant="success" size="sm">{staff.status}</Badge>
              </div>
              <p className="text-xs text-brand-100">{staff.designation} • {staff.department} • Emp ID: {staff.empId}</p>
            </div>
          </div>
        </div>

        {/* Read-Only Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'info' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Personal & HR Info
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'docs' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Employee Documents ({staff.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bank' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Bank Account Info
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'payroll' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Payroll & History
          </button>
        </div>

        {/* Read-Only Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Read-Only Personal Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Employee Category</span>
                  <p className="font-bold text-slate-900 dark:text-white">{staff.employeeCategory || (staff.role === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff')}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">System Role</span>
                  <p className="font-bold text-brand-600 dark:text-brand-400">{staff.role}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                  <p className="font-bold text-slate-900 dark:text-white">{staff.email}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                  <p className="font-bold text-slate-900 dark:text-white">{staff.phone}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Joining Date</span>
                  <p className="font-bold text-slate-900 dark:text-white">{staff.joiningDate}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Qualification</span>
                  <p className="font-bold text-slate-900 dark:text-white">{staff.qualification}</p>
                </div>
                <div className="col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Residential Address</span>
                  <p className="font-bold text-slate-900 dark:text-white">{staff.address || 'Not Provided'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Read-Only Employee Documents Tab */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              
              {/* Document Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 to-slate-50 dark:from-sky-950/20 dark:to-slate-800/50 border border-sky-200 dark:border-sky-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Document Compliance Checklist
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Requirements dynamically configured for <strong className="text-slate-900 dark:text-white">{staff.department}</strong> → <strong className="text-slate-900 dark:text-white">{staff.designation}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Required</span>
                    <span className="font-black text-xs text-sky-600 dark:text-sky-400">{requiredUploadedCount} / {requiredDocTypeList.length} Uploaded</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center">
                    <span className="block text-[10px] font-bold text-emerald-600 uppercase">Verified</span>
                    <span className="font-black text-xs text-emerald-700 dark:text-emerald-300">{verifiedCount}</span>
                  </div>
                  {missingCount > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-center">
                      <span className="block text-[10px] font-bold text-rose-600 uppercase">Missing</span>
                      <span className="font-black text-xs text-rose-700 dark:text-rose-300">{missingCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* REQUIRED DOCUMENTS CHECKLIST SECTION (READ-ONLY) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold uppercase text-slate-500 text-[11px] tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600" />
                    Required Documents Checklist ({requiredDocTypeList.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">Based on designation requirements</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requiredDocTypeList.map(reqType => {
                    const uploaded = findMatchingUploadedDoc(uploadedDocs, reqType);

                    let statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                        Missing
                      </span>
                    );

                    if (uploaded) {
                      if (uploaded.verificationStatus === 'Verified') {
                        statusBadge = <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">✓ Verified</span>;
                      } else if (uploaded.verificationStatus === 'Rejected') {
                        statusBadge = <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">✕ Rejected</span>;
                      } else {
                        statusBadge = <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200">Uploaded</span>;
                      }
                    }

                    return (
                      <div key={reqType} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">{reqType}</h5>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">Required</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {uploaded ? `Uploaded on ${uploaded.uploadedDate}` : 'Not uploaded yet'}
                            </p>
                          </div>
                          {statusBadge}
                        </div>

                        {uploaded && (
                          <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{uploaded.title}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPostviewDoc(uploaded)}
                                className="p-1.5 rounded-xl text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 border border-brand-200 dark:border-brand-800 flex items-center gap-1 text-[11px] font-bold"
                                title="Preview Document"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>

                              {uploaded.fileUrl && uploaded.fileUrl !== '#' && (
                                <a
                                  href={uploaded.fileUrl}
                                  download={uploaded.title}
                                  className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ADDITIONAL DOCUMENTS SECTION (READ-ONLY) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold uppercase text-slate-500 text-[11px] tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-500" />
                    Additional Documents ({uploadedDocs.filter(d => !requiredDocTypeList.some(r => findMatchingUploadedDoc([d], r))).length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {uploadedDocs.filter(d => !requiredDocTypeList.some(r => findMatchingUploadedDoc([d], r))).length === 0 ? (
                    <div className="p-4 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs">
                      No extra non-required documents attached.
                    </div>
                  ) : (
                    uploadedDocs
                      .filter(d => !requiredDocTypeList.some(r => findMatchingUploadedDoc([d], r)))
                      .map(doc => (
                        <div key={doc.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{doc.title}</p>
                              <p className="text-[10px] text-slate-400">{doc.type} • Uploaded {doc.uploadedDate}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => setPostviewDoc(doc)} className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 flex items-center gap-1 font-bold text-[11px]" title="Preview">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            {doc.fileUrl && doc.fileUrl !== '#' && (
                              <a href={doc.fileUrl} download={doc.title} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200" title="Download">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Read-Only Bank Details Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold uppercase text-slate-400 text-[11px] tracking-wider">Bank Account Information</h3>
              </div>

              {staff.bankDetails ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Account Holder</span>
                    <p className="font-bold text-slate-900 dark:text-white">{staff.bankDetails.accountHolderName}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Account Number</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white">{staff.bankDetails.accountNumber}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</span>
                    <p className="font-bold text-slate-900 dark:text-white">{staff.bankDetails.bankName}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Branch</span>
                    <p className="font-bold text-slate-900 dark:text-white">{staff.bankDetails.branch}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code</span>
                    <p className="font-mono font-bold text-brand-600 dark:text-brand-400">{staff.bankDetails.ifscCode}</p>
                  </div>
                  {staff.bankDetails.upiId && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">UPI ID</span>
                      <p className="font-bold text-slate-900 dark:text-white">{staff.bankDetails.upiId}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed">
                  No bank account details configured yet.
                </div>
              )}
            </div>
          )}

          {/* Read-Only Payroll Tab */}
          {activeTab === 'payroll' && renderPayrollTab()}

        </div>
      </div>

      {/* POSTVIEW PREVIEW MODAL FOR VIEW DRAWER */}
      {postviewDoc && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                {postviewDoc.title}
              </h3>
              <button type="button" onClick={() => setPostviewDoc(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[350px] flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border">
              {postviewDoc.fileUrl && postviewDoc.fileUrl.startsWith('data:image') ? (
                <img src={postviewDoc.fileUrl} alt={postviewDoc.title} className="max-h-[450px] object-contain rounded-lg shadow-md" />
              ) : postviewDoc.fileUrl && postviewDoc.fileUrl !== '#' ? (
                <iframe src={postviewDoc.fileUrl} title={postviewDoc.title} className="w-full h-[450px] rounded-lg border-0" />
              ) : (
                <div className="text-center py-12 text-slate-400">No preview stream available.</div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button type="button" onClick={() => setPostviewDoc(null)} className="px-4 py-2 font-bold bg-slate-800 text-white rounded-xl text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default StaffProfileDrawer;
