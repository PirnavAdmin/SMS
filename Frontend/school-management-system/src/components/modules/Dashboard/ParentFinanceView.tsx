import React, { useState } from 'react';
import { IndianRupee, Receipt, AlertCircle, FileText, Download, CheckCircle2, Calendar } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

interface ParentFinanceViewProps {
  activeTab: string;
}

export const ParentFinanceView: React.FC<ParentFinanceViewProps> = ({ activeTab }) => {
  const { students } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  // Match children by email or phone, or own ID if student
  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (
      role === 'Student' ? s.id === user?.id : 
      (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
    )
  );

  const hasMatchedWards = parentWards.length > 0;
  if (!hasMatchedWards) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 2);
  }

  // We use local state to simulate the payment action for the parent
  const [duesData, setDuesData] = useState<Record<string, any[]>>({
    '1': [
      { id: 'd1', term: 'Term 2 Tuition Fee', amount: 45000, dueDate: '2026-10-15', status: 'Pending' },
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

  if (parentWards.length === 0) {
    return <div className="p-8 text-center text-slate-500">No active wards found.</div>;
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  // Map index to mock IDs '1' and '2' just for the simulation
  const mockId = selectedChildIdx === 0 ? '1' : '2';

  const childDues = duesData[mockId] || [];
  const childReceipts = receiptsData[mockId] || [];
  const totalDue = childDues.reduce((sum, item) => sum + item.amount, 0);

  const handlePayDue = (dueId: string) => {
    setProcessing(dueId);
    
    // Simulate payment delay
    setTimeout(() => {
      const dueToPay = childDues.find(d => d.id === dueId);
      if (!dueToPay) return;

      // Remove from dues
      setDuesData(prev => ({
        ...prev,
        [mockId]: prev[mockId].filter(d => d.id !== dueId)
      }));

      // Add to receipts
      const newReceipt = {
        receiptNo: `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        amount: dueToPay.amount,
        mode: 'Online (Credit Card)',
        term: dueToPay.term
      };

      setReceiptsData(prev => ({
        ...prev,
        [mockId]: [newReceipt, ...(prev[mockId] || [])]
      }));

      setProcessing(null);
    }, 1500);
  };

  const handlePayAll = () => {
    setProcessing('all');
    setTimeout(() => {
      const newReceipts = childDues.map((dueToPay, i) => ({
        receiptNo: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000) + i}`,
        date: new Date().toISOString().split('T')[0],
        amount: dueToPay.amount,
        mode: 'Online (Credit Card)',
        term: dueToPay.term
      }));

      setDuesData(prev => ({ ...prev, [mockId]: [] }));
      setReceiptsData(prev => ({
        ...prev,
        [mockId]: [...newReceipts, ...(prev[mockId] || [])]
      }));
      setProcessing(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          {activeTab === 'parent-fee-dues' ? (
            <><IndianRupee className="w-6 h-6 text-emerald-500" /> Fee Details</>
          ) : (
            <><Receipt className="w-6 h-6 text-emerald-500" /> Payment History</>
          )}
        </h2>
        <p className="text-xs text-slate-500 mt-1">Manage finances and clear outstanding dues for your wards</p>
      </div>

      {!hasMatchedWards && (
         <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
               <p className="font-bold">Demo Mode Active</p>
               <p>Your login email/phone ({user?.email}) did not match any guardian records in the database. Showing sample wards for demonstration.</p>
            </div>
         </div>
      )}

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
        <div className="space-y-6">
          <div className={`bg-gradient-to-br ${totalDue > 0 ? 'from-rose-500 to-orange-500 shadow-rose-500/20' : 'from-emerald-500 to-teal-500 shadow-emerald-500/20'} rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                {totalDue > 0 ? <AlertCircle className="w-8 h-8 text-white" /> : <CheckCircle2 className="w-8 h-8 text-white" />}
              </div>
              <div>
                <p className={`${totalDue > 0 ? 'text-rose-100' : 'text-emerald-100'} font-medium mb-1`}>Total Outstanding Dues</p>
                <h2 className="text-3xl sm:text-4xl font-black">₹{totalDue.toLocaleString()}</h2>
              </div>
            </div>
            {totalDue > 0 && (
              <button 
                onClick={handlePayAll}
                disabled={processing !== null}
                className="px-8 py-3.5 bg-white text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors w-full md:w-auto shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing === 'all' ? <div className="w-5 h-5 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" /> : 'Pay All Dues Now'}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fee Breakdown</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {childDues.length > 0 ? childDues.map((due) => (
                <div key={due.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{due.term}</h4>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Due Date: {due.dueDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-slate-900 dark:text-white">₹{due.amount.toLocaleString()}</span>
                    <button 
                      onClick={() => handlePayDue(due.id)}
                      disabled={processing !== null}
                      className="min-w-[100px] px-4 py-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {processing === due.id ? <div className="w-4 h-4 border-2 border-brand-600/30 border-t-brand-600 rounded-full animate-spin" /> : 'Pay'}
                    </button>
                  </div>
                </div>
              )) : (
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
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-500" />
              Payment History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-bold bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-4 pl-6">Receipt No</th>
                  <th className="p-4">Fee Head / Term</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {childReceipts.length > 0 ? childReceipts.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 pl-6 font-mono text-sm font-semibold text-slate-900 dark:text-white">{rec.receiptNo}</td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">{rec.term}</td>
                    <td className="p-4 text-sm text-slate-500">{rec.date}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                        {rec.mode}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                      ₹{rec.amount.toLocaleString()}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors" title="Download Receipt">
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
    </div>
  );
};
