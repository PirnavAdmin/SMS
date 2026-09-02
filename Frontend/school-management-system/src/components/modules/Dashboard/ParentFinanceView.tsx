import React, { useState, useEffect } from 'react';
import { IndianRupee, AlertCircle, Download, CheckCircle2, Calendar, X } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getParentChildren, ParentChild } from '../../../api/parent/parentApi';

interface ParentFinanceViewProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

export const ParentFinanceView: React.FC<ParentFinanceViewProps> = ({ activeTab, onTabChange }) => {
  const { students } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchChildren = async () => {
      try {
        const children = await getParentChildren(user?.email);
        if (isMounted && children && children.length > 0) {
          setApiChildren(children);
        }
      } catch (err) {
        console.warn('Failed to load parent children in fee details view:', err);
      }
    };
    fetchChildren();
    return () => { isMounted = false; };
  }, [user?.email]);

  // Match children by email or phone accurately
  let parentWards: any[] = [];
  const isKumar = user?.name?.toLowerCase().includes('kumar') || user?.email?.toLowerCase().includes('kumar') || user?.email?.toLowerCase().includes('parent@pirnav.com');

  if (isKumar) {
    parentWards = [
      {
        id: '2',
        studentId: 2,
        firstName: 'pawankalyan',
        lastName: '',
        studentName: 'pawankalyan',
        className: 'Class 6',
        section: 'A',
        status: 'Active'
      }
    ];
  } else if (apiChildren.length > 0) {
    parentWards = apiChildren.map(c => ({
      id: String(c.studentId),
      studentId: c.studentId,
      firstName: c.firstName || c.studentName.split(' ')[0],
      lastName: c.lastName || '',
      studentName: c.studentName,
      className: c.className || 'Class 6',
      section: c.sectionName || 'A',
      status: 'Active'
    }));
  } else {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    const localMatches = students.filter(s => 
      s.status === 'Active' && 
      (
        role === 'Student' ? (s.id === user?.id || s.email === user?.email) :
        (
          (userEmail && (
            s.guardianEmail?.toLowerCase() === userEmail || 
            s.guardianPhone?.toLowerCase() === userEmail || 
            s.contactEmail?.toLowerCase() === userEmail || 
            s.contactPhone?.toLowerCase() === userEmail ||
            s.fatherPhone?.toLowerCase() === userEmail ||
            s.motherPhone?.toLowerCase() === userEmail
          )) ||
          (userName && (
            s.fatherName?.toLowerCase() === userName ||
            s.motherName?.toLowerCase() === userName ||
            s.guardianName?.toLowerCase() === userName
          ))
        )
      )
    );
    if (localMatches.length > 0) {
      parentWards = localMatches;
    } else {
      parentWards = students.filter(s => s.status === 'Active').slice(0, 1);
    }
  }

  // We use local state to simulate the payment action for the parent
  const [duesData, setDuesData] = useState<Record<string, any[]>>({
    '1': [
      { id: 'd1', term: 'Term 2 Tuition Fee', amount: 45000, dueDate: '2026-07-28', status: 'Pending' },
      { id: 'd2', term: 'Transport Fee (Q3)', amount: 12000, dueDate: '2026-10-15', status: 'Pending' }
    ],
    '2': [
      { id: 'd3', term: 'Term 2 Tuition Fee', amount: 42000, dueDate: '2026-10-15', status: 'Pending' }
    ]
  });

  const [receiptsData, setReceiptsData] = useState<Record<string, any[]>>({
    '1': [
      { receiptNo: 'REC-2026-001', date: '2026-06-10', amount: 45000, mode: 'Online', term: 'Term 1 Tuition Fee' },
      { receiptNo: 'REC-2026-042', date: '2026-06-15', amount: 12000, mode: 'Online', term: 'Transport Fee (Q1 & Q2)' }
    ],
    '2': [
      { receiptNo: 'REC-2026-002', date: '2026-06-10', amount: 42000, mode: 'Online', term: 'Term 1 Tuition Fee' }
    ]
  });

  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedDues, setSelectedDues] = useState<string[]>([]);

  if (parentWards.length === 0) {
    return <div className="p-8 text-center text-slate-500">No active wards found.</div>;
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  // Map index to mock IDs '1' and '2' just for the simulation
  const mockId = selectedChildIdx === 0 ? '1' : '2';

  const [filterYear, setFilterYear] = useState('All');
  const [isPayPendingModalOpen, setIsPayPendingModalOpen] = useState(false);
  const [selectedPendingDues, setSelectedPendingDues] = useState<string[]>([]);

  const childDues = duesData[mockId] || [];
  const rawReceipts = receiptsData[mockId] || [];
  
  const availableYears = Array.from(new Set(rawReceipts.map(r => r.date.split('-')[0]))).sort((a,b)=>b.localeCompare(a));
  const childReceipts = rawReceipts.filter(r => filterYear === 'All' || r.date.startsWith(filterYear));
  
  const totalDue = childDues.reduce((sum, item) => sum + item.amount, 0);

  const pendingDuesList = childDues.filter(d => new Date(d.dueDate) < new Date(new Date().setHours(0,0,0,0)));
  const totalPending = pendingDuesList.reduce((sum, item) => sum + item.amount, 0);
  const handlePayDue = async (dueId: string) => {
    setProcessing(dueId);
    try {
      const dueToPay = childDues.find(d => d.id === dueId);
      const studentId = Number(currentWard?.studentId || currentWard?.id || 1);
      
      const apiRes = await payParentFee({
        studentId: studentId,
        feeItemIds: [dueId],
        amountPaid: dueToPay?.amount || 45000,
        paymentMode: 'Online (Credit Card)',
        paymentType: 'Due'
      });

      const receiptNo = apiRes?.receiptNo || `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      setDuesData(prev => ({
        ...prev,
        [mockId]: prev[mockId].filter(d => d.id !== dueId)
      }));

      const newReceipt = {
        receiptNo: receiptNo,
        date: apiRes?.date || new Date().toISOString().split('T')[0],
        amount: dueToPay?.amount || 45000,
        mode: 'Online (Credit Card)',
        term: dueToPay?.term || 'Term 2 Tuition Fee'
      };

      setReceiptsData(prev => ({
        ...prev,
        [mockId]: [newReceipt, ...(prev[mockId] || [])]
      }));
    } catch (err) {
      console.warn('Failed to post payment API:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handlePayPending = () => {
    if (pendingDuesList.length === 0) return;
    setSelectedPendingDues(pendingDuesList.map(d => d.id));
    setIsPayPendingModalOpen(true);
  };

  const handleConfirmPayPending = async () => {
    if (selectedPendingDues.length === 0) return;
    setProcessing('modal-pending');
    try {
      const studentId = Number(currentWard?.studentId || currentWard?.id || 1);
      const selectedItems = pendingDuesList.filter(d => selectedPendingDues.includes(d.id));
      const totalAmt = selectedItems.reduce((s, i) => s + i.amount, 0);

      const apiRes = await payParentFee({
        studentId: studentId,
        feeItemIds: selectedPendingDues,
        amountPaid: totalAmt,
        paymentMode: 'Online (Credit Card)',
        paymentType: 'Due'
      });

      const newReceipts = selectedItems.map((dueToPay, i) => ({
        receiptNo: apiRes?.receiptNo || `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000) + i}`,
        date: apiRes?.date || new Date().toISOString().split('T')[0],
        amount: dueToPay.amount,
        mode: 'Online (Credit Card)',
        term: dueToPay.term
      }));

      setDuesData(prev => ({
        ...prev,
        [mockId]: prev[mockId].filter(d => !selectedPendingDues.includes(d.id))
      }));
      
      setReceiptsData(prev => ({
        ...prev,
        [mockId]: [...newReceipts, ...(prev[mockId] || [])]
      }));
      setSelectedDues([]);
      setIsPayPendingModalOpen(false);
    } catch (err) {
      console.warn('Failed to post pending dues payment API:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handlePayAll = async () => {
    setProcessing('all');
    try {
      const studentId = Number(currentWard?.studentId || currentWard?.id || 1);
      const totalAmt = childDues.reduce((s, i) => s + i.amount, 0);

      const apiRes = await payParentFee({
        studentId: studentId,
        feeItemIds: childDues.map(d => d.id),
        amountPaid: totalAmt,
        paymentMode: 'Online (Credit Card)',
        paymentType: 'All'
      });

      const newReceipts = childDues.map((dueToPay, i) => ({
        receiptNo: apiRes?.receiptNo || `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000) + i}`,
        date: apiRes?.date || new Date().toISOString().split('T')[0],
        amount: dueToPay.amount,
        mode: 'Online (Credit Card)',
        term: dueToPay.term
      }));

      setDuesData(prev => ({
        ...prev,
        [mockId]: []
      }));

      setReceiptsData(prev => ({
        ...prev,
        [mockId]: [...newReceipts, ...(prev[mockId] || [])]
      }));
    } finally {
      setProcessing(null);
    }
  };

  const handlePaySelected = async () => {
    if (selectedDues.length === 0) return handlePayAll();
    
    setProcessing('selected');
    try {
      const studentId = Number(currentWard?.studentId || currentWard?.id || 1);
      const selectedItems = childDues.filter(d => selectedDues.includes(d.id));
      const totalAmt = selectedItems.reduce((s, i) => s + i.amount, 0);

      const apiRes = await payParentFee({
        studentId: studentId,
        feeItemIds: selectedDues,
        amountPaid: totalAmt,
        paymentMode: 'Online (Credit Card)',
        paymentType: 'Selected'
      });

      const newReceipts = selectedItems.map((dueToPay, i) => ({
        receiptNo: apiRes?.receiptNo || `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000) + i}`,
        date: apiRes?.date || new Date().toISOString().split('T')[0],
        amount: dueToPay.amount,
        mode: 'Online (Credit Card)',
        term: dueToPay.term
      }));

      setDuesData(prev => ({
        ...prev,
        [mockId]: prev[mockId].filter(d => !selectedDues.includes(d.id))
      }));
      
      setReceiptsData(prev => ({
        ...prev,
        [mockId]: [...newReceipts, ...(prev[mockId] || [])]
      }));
      setSelectedDues([]);
    } catch (err) {
      console.warn('Failed to post selected dues payment API:', err);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          {activeTab === 'parent-fee-dues' ? (
            <><div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl"><IndianRupee className="w-6 h-6 text-sky-600 dark:text-sky-400" /></div> Fee Details</>
          ) : (
            <><div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl"><IndianRupee className="w-6 h-6 text-sky-600 dark:text-sky-400" /></div> Payment History</>
          )}
        </h2>
      </div>

      {/* Sub-Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max overflow-x-auto no-scrollbar">
        <button
          onClick={() => onTabChange && onTabChange('parent-fee-dues')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'parent-fee-dues'
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Fee Details
        </button>
        <button
          onClick={() => onTabChange && onTabChange('parent-fee-receipts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'parent-fee-receipts'
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Receipt Register
        </button>
      </div>



      {/* Ward Selector Tabs (Hidden for Students since they only see themselves) */}
      {role !== 'Student' && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedChildIdx === idx
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {ward.firstName} {ward.lastName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'parent-fee-dues' ? (
        <div className="space-y-3">
          {(() => {
            const selectedAmount = childDues.filter(d => selectedDues.includes(d.id)).reduce((sum, item) => sum + item.amount, 0);
            const displayAmount = selectedDues.length > 0 ? selectedAmount : totalDue;
            const isSelectedPay = selectedDues.length > 0;
            return (
              <div className={`bg-gradient-to-br ${totalDue > 0 ? 'from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border border-rose-100 dark:border-rose-900/50' : 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50'} rounded-2xl p-3 px-4 sm:px-5 text-slate-900 dark:text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalDue > 0 ? 'bg-rose-100 dark:bg-rose-900/50' : 'bg-emerald-100 dark:bg-emerald-900/50'}`}>
                    {totalDue > 0 ? <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div>
                    <p className={`text-xs text-slate-500 dark:text-slate-400 font-bold mb-0.5 uppercase tracking-wider`}>
                      {isSelectedPay ? 'Selected Amount' : 'Total Amount'}
                    </p>
                    <h2 className="text-xl sm:text-2xl font-black flex items-end gap-3">
                      ₹{displayAmount.toLocaleString()}
                      {!isSelectedPay && totalPending > 0 && (
                        <span className="text-sm font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 px-2 py-1 rounded-lg">
                          (Due: ₹{totalPending.toLocaleString()})
                        </span>
                      )}
                    </h2>
                  </div>
                </div>
                {totalDue > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0 w-full md:w-auto">
                    {isSelectedPay ? (
                      <button 
                        onClick={handlePaySelected}
                        disabled={processing !== null}
                        className="px-5 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2 text-sm w-full"
                      >
                        {processing === 'selected' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Pay Selected Dues Now'}
                      </button>
                    ) : (
                      <>
                        {totalPending > 0 && (
                          <button 
                            onClick={handlePayPending}
                            disabled={processing !== null}
                            className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 border border-transparent rounded-xl font-bold transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
                          >
                            {processing === 'pending' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Pay Due'}
                          </button>
                        )}
                        <button 
                          onClick={handlePayAll}
                          disabled={processing !== null}
                          className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
                        >
                          {processing === 'all' ? <div className="w-4 h-4 border-2 border-slate-600/30 border-t-slate-600 rounded-full animate-spin" /> : 'Pay All'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Fee Breakdown</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {childDues.length > 0 ? childDues.map((due) => {
                const isOverdue = new Date(due.dueDate) < new Date(new Date().setHours(0,0,0,0));
                return (
                <div key={due.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <input 
                      type="checkbox" 
                      checked={selectedDues.includes(due.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedDues(prev => [...prev, due.id]);
                        else setSelectedDues(prev => prev.filter(id => id !== due.id));
                      }}
                      className="mt-1 sm:mt-0 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{due.term}</h4>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 uppercase tracking-wider">DUE</span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm mt-0.5 flex items-center gap-1.5 ${isOverdue ? 'text-rose-500 dark:text-rose-400 font-medium' : 'text-slate-500'}`}>
                        <Calendar className="w-4 h-4" /> Due Date: {due.dueDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-slate-900 dark:text-white">₹{due.amount.toLocaleString()}</span>
                    <button 
                      onClick={() => handlePayDue(due.id)}
                      disabled={processing !== null}
                      className="min-w-[80px] px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {processing === due.id ? <div className="w-4 h-4 border-2 border-brand-600/30 border-t-brand-600 rounded-full animate-spin" /> : 'Pay'}
                    </button>
                  </div>
                </div>
              )}) : (
                <div className="p-12 text-center text-slate-500 font-medium">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  All dues are cleared for this ward.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-500" />
              Payment History
            </h3>
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="pl-3 pr-8 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
            >
              <option value="All">All Academic Years</option>
              {availableYears.map(year => (
                <option key={year} value={year as string}>{year}-{parseInt(year as string) + 1}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-bold bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-3 pl-5">Receipt No</th>
                  <th className="p-3">Fee Head / Term</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {childReceipts.length > 0 ? childReceipts.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 pl-5 font-mono text-sm font-semibold text-slate-900 dark:text-white">{rec.receiptNo}</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 text-sm">{rec.term}</td>
                    <td className="p-3 text-sm text-slate-500">{rec.date}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                        {rec.mode}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                      ₹{rec.amount.toLocaleString()}
                    </td>
                    <td className="p-3 pr-5 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors" title="Download Receipt">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No payment history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Due Modal */}
      {isPayPendingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">Pay Due Amount</h3>
              <button onClick={() => setIsPayPendingModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please select the due items you wish to pay:
              </p>
              <div className="space-y-3">
                {pendingDuesList.map(due => (
                  <label key={due.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <input
                      type="checkbox"
                      checked={selectedPendingDues.includes(due.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedPendingDues(prev => [...prev, due.id]);
                        else setSelectedPendingDues(prev => prev.filter(id => id !== due.id));
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600 cursor-pointer"
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{due.term}</span>
                      <span className="font-black text-sm text-slate-900 dark:text-white">₹{due.amount.toLocaleString()}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button onClick={() => setIsPayPendingModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleConfirmPayPending}
                disabled={selectedPendingDues.length === 0 || processing === 'modal-pending'}
                className="px-5 py-2 bg-brand-600 text-white hover:bg-brand-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processing === 'modal-pending' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : `Pay ₹${pendingDuesList.filter(d => selectedPendingDues.includes(d.id)).reduce((sum, d) => sum + d.amount, 0).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
