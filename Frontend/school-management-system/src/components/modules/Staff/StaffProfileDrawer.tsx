import React, { useState } from 'react';
import {
  X, User, FileText, CreditCard, Camera, Trash2, Plus, Edit, Download, ShieldCheck
} from 'lucide-react';
import { Staff, StaffDocType, BankDetails } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';

interface StaffProfileDrawerProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffProfileDrawer: React.FC<StaffProfileDrawerProps> = ({ staff, isOpen, onClose }) => {
  const { updateStaff, addStaffDocument, deleteStaffDocument, updateBankDetails, salaryStructures, employeeSalaryAssignments, assignEmployeeSalaryStructure } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'bank' | 'payroll'>('info');

  // Document Modal state
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<StaffDocType>('Aadhaar Card');

  // Bank Details Modal state
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankForm, setBankForm] = useState<BankDetails>({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    ifscCode: '',
    upiId: ''
  });

  // Payroll Assignment state
  const [isEditingPayroll, setIsEditingPayroll] = useState(false);
  const [newStructureId, setNewStructureId] = useState('');
  const [newEffectiveDate, setNewEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newReason, setNewReason] = useState('Salary Revision');

  if (!isOpen || !staff) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateStaff(staff.id, { avatar: reader.result as string });
        addToast('success', 'Staff Photo Updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';
    updateStaff(staff.id, { avatar: defaultAvatar });
    addToast('info', 'Photo Removed');
  };

  const handleAddDocSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!docTitle) return;

    addStaffDocument(staff.id, {
      title: docTitle,
      type: docType,
      fileUrl: '#',
      uploadedDate: new Date().toISOString().split('T')[0]
    });
    addToast('success', 'Document Added', `Added ${docTitle}`);
    setIsAddDocOpen(false);
    setDocTitle('');
  };

  const handleBankSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!bankForm.accountNumber || !bankForm.bankName) return;

    updateBankDetails(staff.id, bankForm);
    addToast('success', 'Bank Details Saved');
    setIsBankOpen(false);
  };

  const openBankEdit = () => {
    setBankForm(staff.bankDetails || {
      accountHolderName: `${staff.firstName} ${staff.lastName}`,
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: '',
      upiId: ''
    });
    setIsBankOpen(true);
  };

  const renderPayrollTab = () => {
    const activeAssignment = (employeeSalaryAssignments || []).find(
      a => a.employeeId === staff.id && a.status === 'Active'
    );
    const history = (employeeSalaryAssignments || [])
      .filter(a => a.employeeId === staff.id)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-bold uppercase text-slate-400 text-[11px]">Employee Salary Configuration</h3>
          <button
            onClick={() => {
              setNewStructureId(staff.salaryStructureId || '');
              setIsEditingPayroll(!isEditingPayroll);
            }}
            className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold flex items-center gap-1 hover:bg-sky-500 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> {isEditingPayroll ? 'Cancel Edit' : 'Edit Assignment'}
          </button>
        </div>

        {isEditingPayroll ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newStructureId) return;
              const structure = salaryStructures.find(s => s.id === newStructureId);
              assignEmployeeSalaryStructure({
                employeeId: staff.id,
                employeeName: `${staff.firstName} ${staff.lastName}`,
                empId: staff.empId,
                employeeCategory: staff.employeeCategory || 'Staff',
                branch: staff.branch || 'Main Campus',
                department: staff.department || 'General',
                salaryStructureId: newStructureId,
                salaryStructureName: structure ? structure.structureName : '',
                effectiveDate: newEffectiveDate,
                status: 'Active',
                reason: newReason
              });
              addToast('success', 'Salary Structure Assigned', `Assigned ${structure?.structureName} structure`);
              setIsEditingPayroll(false);
            }}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-3 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Select Salary Structure *</label>
                <select
                  required
                  value={newStructureId}
                  onChange={e => setNewStructureId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border cursor-pointer font-bold outline-none"
                >
                  <option value="">Select Structure</option>
                  {(salaryStructures || []).map(s => (
                    <option key={s.id} value={s.id}>{s.structureName} ({s.employeeCategory})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={newEffectiveDate}
                  onChange={e => setNewEffectiveDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Reason for Revision</label>
                <input
                  type="text"
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border outline-none"
                  placeholder="Salary revision reason"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingPayroll(false)}
                className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-500 transition-colors"
              >
                Save Assignment
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white">Active Payroll Status</span>
                <Badge variant={staff.salaryStructureId ? 'success' : 'neutral'}>
                  {staff.salaryStructureId ? 'Structure Assigned' : 'Salary Structure Not Assigned'}
                </Badge>
              </div>

              {activeAssignment ? (
                <div className="space-y-2.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Structure:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{activeAssignment.salaryStructureName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Gross Salary:</span>
                    <span className="font-extrabold text-emerald-600">{formatCurrency(activeAssignment.monthlyGross || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Effective Date:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{activeAssignment.effectiveDate}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 space-y-2">
                  <p>No active salary structure assigned to this employee.</p>
                  <p className="text-[10px] text-rose-500 font-bold">Cannot process payroll until a structure is configured.</p>
                </div>
              )}
            </div>

            {(() => {
              const structure = (salaryStructures || []).find(s => s.id === staff.salaryStructureId);
              if (!structure) return null;
              return (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">Structure Components</h4>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {structure.earnings.map(e => (
                      <div key={e.name} className="flex justify-between text-[11px]"><span className="text-slate-400">{e.name}:</span><span className="font-semibold text-emerald-600">+{formatCurrency(e.amount)}</span></div>
                    ))}
                    {structure.deductions.map(d => (
                      <div key={d.name} className="flex justify-between text-[11px]"><span className="text-slate-400">{d.name}:</span><span className="font-semibold text-rose-500">-{formatCurrency(d.amount)}</span></div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">Salary Assignment History</h4>
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-3">Effective Date</th>
                  <th className="py-2.5 px-3">Structure</th>
                  <th className="py-2.5 px-3 text-right">Prev Gross</th>
                  <th className="py-2.5 px-3 text-right">New Gross</th>
                  <th className="py-2.5 px-3">Updated By</th>
                  <th className="py-2.5 px-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-slate-400 italic">No historical records available.</td>
                  </tr>
                ) : (
                  history.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold">{h.effectiveDate}</td>
                      <td className="py-2.5 px-3">{h.salaryStructureName}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{h.previousGross ? formatCurrency(h.previousGross) : '—'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{formatCurrency(h.monthlyGross || 0)}</td>
                      <td className="py-2.5 px-3 text-slate-400">{h.updatedBy || 'System'}</td>
                      <td className="py-2.5 px-3 text-slate-500 italic max-w-[120px] truncate" title={h.reason}>{h.reason || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <img src={staff.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20" />
              <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                <label className="p-1.5 rounded-lg bg-white/30 hover:bg-white/50 text-white cursor-pointer" title="Replace Photo">
                  <Camera className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
                <button onClick={handleRemoveAvatar} className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white" title="Delete Photo">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{staff.firstName} {staff.lastName}</h2>
                <Badge variant="success" size="sm">{staff.status}</Badge>
              </div>
              <p className="text-xs text-emerald-100">{staff.designation} • {staff.department} • Emp ID: {staff.empId}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'info' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Personal & HR Info
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'docs' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Employee Documents ({staff.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bank' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Bank Account Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'payroll' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Payroll & History
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border">
                <div><span className="text-slate-400">Email:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{staff.email}</p></div>
                <div><span className="text-slate-400">Phone:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{staff.phone}</p></div>
                <div><span className="text-slate-400">DOB (DD/MM/YYYY):</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{staff.dob}</p></div>
                <div><span className="text-slate-400">Joining Date:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{staff.joiningDate}</p></div>
                <div><span className="text-slate-400">Qualification:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{staff.qualification}</p></div>
                <div><span className="text-slate-400">Experience:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{staff.experienceYears} Years</p></div>
                
                {(staff.employeeCategory === 'Teacher' || staff.role === 'Teacher') && (
                  <>
                    <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-2"><span className="text-slate-400">Assigned Classes:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{staff.assignedClasses?.join(', ') || 'None'}</p></div>
                    <div className="col-span-2"><span className="text-slate-400">Assigned Subjects:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{staff.assignedSubjects?.join(', ') || 'None'}</p></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Employee Documents Section (CRUD) */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold uppercase text-slate-400 text-[11px]">HR Verification Documents</h3>
                <button
                  onClick={() => setIsAddDocOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload Document
                </button>
              </div>

              <div className="space-y-2">
                {(!staff.documents || staff.documents.length === 0) ? (
                  <p className="text-slate-400 italic">No documents uploaded yet.</p>
                ) : (
                  staff.documents.map(doc => (
                    <div key={doc.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{doc.title}</p>
                          <p className="text-[10px] text-slate-400">{doc.type} • Uploaded {doc.uploadedDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a href={doc.fileUrl} download className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => {
                            deleteStaffDocument(staff.id, doc.id);
                            addToast('info', 'Document Removed');
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Bank Details Section (CRUD) */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold uppercase text-slate-400 text-[11px]">Direct Salary Deposit Account</h3>
                <button
                  onClick={openBankEdit}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Bank Details
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border space-y-3">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-400">Account Holder Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{staff.bankDetails?.accountHolderName || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-400">Account Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{staff.bankDetails?.accountNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-400">Bank Name & Branch:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{staff.bankDetails?.bankName} ({staff.bankDetails?.branch})</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-400">IFSC Code:</span>
                  <span className="font-mono font-bold text-emerald-600">{staff.bankDetails?.ifscCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UPI ID:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{staff.bankDetails?.upiId || 'Not set'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Section */}
          {activeTab === 'payroll' && renderPayrollTab()}
        </div>
      </div>

      {/* Add Document Modal */}
      {isAddDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Staff HR Document</h3>
            <form onSubmit={handleAddDocSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Relieving & Experience Certificate.pdf"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Resume">Resume</option>
                  <option value="Experience Letter">Experience Letter</option>
                  <option value="Educational Certificates">Educational Certificates</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Other">Other Supporting Document</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddDocOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-xl">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bank Details Modal */}
      {isBankOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Bank Account Details</h3>
            <form onSubmit={handleBankSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountHolderName}
                  onChange={e => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountNumber}
                  onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.bankName}
                    onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Branch</label>
                  <input
                    type="text"
                    value={bankForm.branch}
                    onChange={e => setBankForm({ ...bankForm, branch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.ifscCode}
                    onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={bankForm.upiId}
                    onChange={e => setBankForm({ ...bankForm, upiId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsBankOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-indigo-600 text-white rounded-xl">Save Bank Info</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
