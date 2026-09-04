// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { IndianRupee, AlertCircle, CheckCircle2, Calendar, X, CreditCard } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { getParentChildren, getParentFeeDetails, payParentFee, ParentChild } from '../../../api/parent/parentApi';

interface ParentFinanceViewProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

export const ParentFinanceView: React.FC<ParentFinanceViewProps> = ({ activeTab, onTabChange }) => {
  const { students } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);
  const [feeSummary, setFeeSummary] = useState<any>(null);
  const [loadingFees, setLoadingFees] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchChildren = async () => {
      try {
        const identifier = user?.email || user?.name || '';
        const children = await getParentChildren(identifier);
        if (isMounted && children && children.length > 0) {
          setApiChildren(children);
        }
      } catch (err) {
        console.warn('Failed to load parent children in fee details view:', err);
      }
    };
    fetchChildren();
    return () => { isMounted = false; };
  }, [user?.email, user?.name]);

  const parentWards = useMemo(() => {
    if (apiChildren.length > 0) {
      return apiChildren.map(c => ({
        id: String(c.studentId),
        studentId: c.studentId,
        firstName: c.firstName || c.studentName.split(' ')[0],
        lastName: c.lastName || '',
        studentName: c.studentName,
        className: c.className || 'Class 6',
        section: c.sectionName || 'A',
        status: 'Active'
      }));
    }

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
            s.fatherName?.toLowerCase().includes(userName) ||
            userName.includes(s.fatherName?.toLowerCase() || '___')
          ))
        )
      )
    );

    return localMatches;
  }, [apiChildren, students, user, role]);

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

  const loadFeeData = async () => {
    if (!currentWard) return;
    setLoadingFees(true);
    try {
      const studentId = Number(currentWard.studentId || currentWard.id);
      const res = await getParentFeeDetails(studentId);
      setFeeSummary(res);
    } catch (err) {
      console.warn('Failed to load fee details:', err);
    } finally {
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, [currentWard?.studentId, currentWard?.id]);

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        No active wards found linked to your account.
      </div>
    );
  }

  const feeItems: any[] = feeSummary?.feeItems || [];
  const totalFee: number = feeSummary?.totalFee || 0;
  const totalPaid: number = feeSummary?.totalPaid || 0;
  const totalDue: number = feeSummary?.totalDue || 0;

  const pendingItems = feeItems.filter(item => item.balanceDue > 0);

  const handlePayDue = async (item: any) => {
    setProcessing(String(item.feeId));
    try {
      const studentId = Number(currentWard.studentId || currentWard.id);
      const res = await payParentFee({
        studentId,
        feeItemIds: [String(item.feeId)],
        amountPaid: item.balanceDue,
        paymentMode: 'Online (Credit Card)',
        paymentType: 'Due'
      });
      setPaymentSuccess(`Payment of ₹${item.balanceDue.toLocaleString()} processed successfully. Receipt: ${res?.receiptNo || 'REC-CONFIRMED'}`);
      await loadFeeData();
    } catch (err) {
      console.warn('Payment failed:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handlePayAll = async () => {
    if (totalDue <= 0) return;
    setProcessing('all');
    try {
      const studentId = Number(currentWard.studentId || currentWard.id);
      const res = await payParentFee({
        studentId,
        feeItemIds: pendingItems.map(i => String(i.feeId)),
        amountPaid: totalDue,
        paymentMode: 'Online (Credit Card)',
        paymentType: 'All'
      });
      setPaymentSuccess(`Total fee payment of ₹${totalDue.toLocaleString()} processed successfully. Receipt: ${res?.receiptNo || 'REC-CONFIRMED'}`);
      await loadFeeData();
    } catch (err) {
      console.warn('Payment all failed:', err);
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
            <><div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl"><IndianRupee className="w-6 h-6 text-sky-600 dark:text-sky-400" /></div> Receipt Register</>
          )}
        </h2>
      </div>

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

      {role !== 'Student' && parentWards.length > 1 && (
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

      {role !== 'Student' && parentWards.length === 1 && (
        <div className="flex items-center gap-2">
          <span className="px-4 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold">
            {currentWard.firstName} {currentWard.lastName} <span className="opacity-75">({currentWard.className}-{currentWard.section})</span>
          </span>
        </div>
      )}

      {paymentSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{paymentSuccess}</span>
          </div>
          <button onClick={() => setPaymentSuccess(null)} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'parent-fee-dues' ? (
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-r from-slate-50 to-sky-50/30 dark:from-slate-800/60 dark:to-sky-900/10 border border-slate-200/80 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${totalDue > 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'}`}>
                {totalDue > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Fee Amount</p>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    ₹{totalFee.toLocaleString()}
                  </span>
                  {totalDue > 0 ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                      Due: ₹{totalDue.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      All Dues Cleared
                    </span>
                  )}
                </div>
              </div>
            </div>

            {totalDue > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePayAll}
                  disabled={processing !== null}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-brand-500/20 flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {processing === 'all' ? 'Processing...' : 'Pay All Dues'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Fee Breakdown</h3>
            
            {loadingFees ? (
              <div className="py-12 text-center text-slate-400">Loading fee records...</div>
            ) : feeItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No fee dues assigned</p>
                <p className="text-xs text-slate-400 mt-1">There are no pending or allocated fee records for this student.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {feeItems.map((item, i) => (
                  <div key={item.feeId || i} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.feeHeadName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'Paid' 
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' 
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Due Date: {item.dueDate || 'N/A'} • Paid: ₹{(item.paidAmount || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-black text-slate-900 dark:text-white text-base">
                        ₹{(item.amount || 0).toLocaleString()}
                      </span>
                      {item.balanceDue > 0 && (
                        <button
                          onClick={() => handlePayDue(item)}
                          disabled={processing !== null}
                          className="px-4 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-400 font-bold text-xs rounded-xl transition-all"
                        >
                          {processing === String(item.feeId) ? 'Paying...' : 'Pay'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Payment Receipts</h3>
          
          {feeItems.filter(i => (i.paidAmount || 0) > 0).length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No payment receipts found</p>
              <p className="text-xs text-slate-400 mt-1">Receipts will be listed here after fee payments are completed.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {feeItems.filter(i => (i.paidAmount || 0) > 0).map((item, i) => (
                <div key={i} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.feeHeadName}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Receipt Date: {item.dueDate || 'Recent'} • Mode: Online
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      +₹{(item.paidAmount || 0).toLocaleString()}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
