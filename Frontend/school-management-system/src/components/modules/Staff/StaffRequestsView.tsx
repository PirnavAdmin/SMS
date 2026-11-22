// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  FileText,
  Award,
  Clock,
  Shield,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  RefreshCw,
  Building2,
  Users,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Staff } from '../../../types';
import {
  StaffLetterRequest,
  StaffLetterType,
  GeneratedStaffLetterRecord,
} from '../../../types/staffLetter';
import {
  fetchStaffLetterRequestsApi,
  updateStaffLetterRequestStatusApi,
  deleteStaffLetterRequestApi,
  fetchStaffLettersApi,
} from '../../../api/staffLetters';
import { StaffLetterModal } from './Letters/StaffLetterModal';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface StaffRequestsViewProps {
  onNavigate?: (module: string) => void;
}

export const StaffRequestsView: React.FC<StaffRequestsViewProps> = ({ onNavigate }) => {
  const { staff = [], schoolProfile } = useData();
  const { addToast } = useToast();

  const [requests, setRequests] = useState<StaffLetterRequest[]>([]);
  const [letters, setLetters] = useState<GeneratedStaffLetterRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Generator & View Modal State
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [selectedStaffForGen, setSelectedStaffForGen] = useState<Staff | null>(null);
  const [selectedTypeForGen, setSelectedTypeForGen] = useState<StaffLetterType>('relieving');
  const [existingRecordForView, setExistingRecordForView] = useState<GeneratedStaffLetterRecord | undefined>(undefined);
  const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);

  // Reject Request Modal State
  const [requestRejectTarget, setRequestRejectTarget] = useState<StaffLetterRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [reqRes, ltrRes] = await Promise.all([
        fetchStaffLetterRequestsApi(),
        fetchStaffLettersApi().catch(() => ({ data: [] })),
      ]);
      if (Array.isArray(reqRes?.data)) {
        setRequests(reqRes.data);
      }
      if (Array.isArray(ltrRes?.data)) {
        setLetters(ltrRes.data);
      }
    } catch (err) {
      console.warn('Failed to load staff letter requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    window.addEventListener('staff_requests_updated', fetchAllData);
    window.addEventListener('staff_letters_updated', fetchAllData);
    return () => {
      window.removeEventListener('staff_requests_updated', fetchAllData);
      window.removeEventListener('staff_letters_updated', fetchAllData);
    };
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (typeFilter !== 'all' && r.requestType.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (r.staffName || '').toLowerCase().includes(q);
        const matchEmpId = (r.staffEmpId || '').toLowerCase().includes(q);
        const matchReason = (r.reason || '').toLowerCase().includes(q);
        const matchDept = (r.department || '').toLowerCase().includes(q);
        if (!matchName && !matchEmpId && !matchReason && !matchDept) return false;
      }
      return true;
    });
  }, [requests, statusFilter, typeFilter, searchQuery]);

  const handleGenerateLetterForRequest = (req: StaffLetterRequest) => {
    const matched = (staff || []).find(
      (s) =>
        (req.staffId && s.id === req.staffId) ||
        (req.staffEmpId && (s.empId === req.staffEmpId || (s as any).employeeId === req.staffEmpId))
    );

    const targetStaff = matched || {
      id: req.staffId || '',
      empId: req.staffEmpId || '',
      firstName: req.staffName.split(' ')[0] || 'Staff',
      lastName: req.staffName.split(' ').slice(1).join(' ') || '',
      department: req.department,
      designation: req.designation,
      branch: req.branch || '',
      email: '',
      phone: '',
      role: req.designation,
      status: 'Active',
    };

    const existingLetter = letters.find(
      (l) =>
        l.letterType.toLowerCase() === req.requestType.toLowerCase() &&
        ((req.staffId && l.staffId === req.staffId) ||
          (req.staffEmpId && l.staffEmpId === req.staffEmpId))
    );

    setSelectedTypeForGen(req.requestType as StaffLetterType);
    setSelectedStaffForGen(targetStaff as Staff);
    setExistingRecordForView(existingLetter);
    setIsReadOnlyModal(false);
    setGeneratorOpen(true);
  };

  const handleConfirmRejectRequest = async () => {
    if (!requestRejectTarget || isProcessingAction) return;
    try {
      setIsProcessingAction(true);
      const res = await updateStaffLetterRequestStatusApi(
        requestRejectTarget.id,
        'Rejected',
        rejectionReasonInput.trim() || 'Rejected by Administration'
      );
      if (res?.success) {
        addToast('info', 'Request Rejected', 'The staff request has been rejected.');
        setRequestRejectTarget(null);
        setRejectionReasonInput('');
        fetchAllData();
        window.dispatchEvent(new Event('staff_requests_updated'));
      }
    } catch (err: any) {
      addToast('error', 'Action Failed', err?.message || 'Failed to update request status.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const relievingCount = requests.filter((r) => r.requestType === 'relieving').length;
  const experienceCount = requests.filter((r) => r.requestType === 'experience').length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Staff Requests
              </h1>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchAllData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            title="Refresh requests"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Total Requests</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{requests.length}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <FileCheck className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider block">Pending Approvals</span>
            <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">{pendingCount}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Relieving Letters</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{relievingCount}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <FileText className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Experience Letters</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{experienceCount}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Award className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl px-3.5 py-2.5 shadow-xs border border-sky-300 dark:border-sky-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            maxLength={30}
            placeholder="Search staff, emp ID, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 h-9 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-sky-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved / Issued</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="relieving">Relieving Letters</option>
              <option value="experience">Experience Certificates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-sky-300 dark:border-sky-800 shadow-sm p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800 text-[10px] tracking-wider">
                <th className="py-3 px-3 text-center w-12">S.No</th>
                <th className="py-3 px-3 text-left">Staff Member</th>
                <th className="py-3 px-3 text-left">Department & Role</th>
                <th className="py-3 px-3 text-center">Request Type</th>
                <th className="py-3 px-3 text-left">Reason / Purpose</th>
                <th className="py-3 px-3 text-center">Requested At</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <LoadingSpinner text="Loading staff requests..." />
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No staff requests found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req, idx) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                    <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-white">{req.staffName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {req.staffEmpId || req.staffId || 'N/A'}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-700 dark:text-slate-300">{req.designation || 'Staff Member'}</p>
                      <p className="text-[10px] text-slate-400">
                        {req.department || 'Academics'} {req.branch ? `• ${req.branch}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          req.requestType === 'relieving'
                            ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {req.requestType === 'relieving' ? <Shield className="w-3 h-3" /> : <Award className="w-3 h-3" />}
                        {req.requestType === 'relieving' ? 'Relieving Letter' : 'Experience Certificate'}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2">{req.reason || 'Not specified'}</p>
                      {req.relievingDate && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          Proposed Relieving: {req.relievingDate}
                        </p>
                      )}
                      {req.comments && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">Note: {req.comments}</p>
                      )}
                      {req.rejectionReason && (
                        <p className="text-[10px] text-rose-500 font-medium mt-0.5">Rejection Reason: {req.rejectionReason}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {req.createdAt ? String(req.createdAt).split('T')[0] : 'Today'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          req.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                            : req.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                        }`}
                      >
                        {req.status === 'Approved' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : req.status === 'Rejected' ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {req.status === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleGenerateLetterForRequest(req)}
                              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Open letter generator to issue official letter"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Generate & Issue</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRequestRejectTarget(req);
                                setRejectionReasonInput('');
                              }}
                              className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
                              title="Reject request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : req.status === 'Approved' ? (
                          <button
                            type="button"
                            onClick={() => handleGenerateLetterForRequest(req)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title="View or Re-generate letter"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Re-issue</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Rejected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generator & Live Preview Modal */}
      {generatorOpen && (
        <StaffLetterModal
          staff={selectedStaffForGen}
          isOpen={generatorOpen}
          existingLetters={letters}
          onClose={() => {
            setGeneratorOpen(false);
            setSelectedStaffForGen(null);
            setExistingRecordForView(undefined);
            setIsReadOnlyModal(false);
            fetchAllData();
          }}
          onNavigate={onNavigate}
          initialType={selectedTypeForGen}
          existingRecord={existingRecordForView}
          readOnly={isReadOnlyModal}
        />
      )}

      {/* Reject Request Modal */}
      {requestRejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reject {requestRejectTarget.requestType === 'relieving' ? 'Relieving' : 'Experience'} Request
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Staff Member: {requestRejectTarget.staffName}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Rejection Reason / Notes for Staff (Optional):
              </label>
              <textarea
                rows={3}
                placeholder="State reason for rejecting request (e.g., Pending clearance, dues, or invalid date)..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRequestRejectTarget(null);
                  setRejectionReasonInput('');
                }}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectRequest}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffRequestsView;
