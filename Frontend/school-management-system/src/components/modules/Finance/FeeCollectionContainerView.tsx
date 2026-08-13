import React, { useState, useMemo, useEffect } from 'react';
import { IndianRupee, Receipt, Clock, UserCheck } from 'lucide-react';
import { Student, FeePayment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { ExportButton } from '../../common/ExportButton';
import { FeeCollectionView } from './FeeCollectionView';
import { FeeReceiptsView } from './FeeReceiptsView';
import { DueFeesView } from './DueFeesView';
import { PromotedStudentsDuesView } from '../FeeManagement/PromotedStudentsDuesView';
import { FeeCollectModal } from '../FeeManagement/FeeCollectModal';

interface FeeCollectionContainerViewProps {
  onPrintReceipt: (payment: FeePayment) => void;
  initialSubTab?: string;
}

export const FeeCollectionContainerView: React.FC<FeeCollectionContainerViewProps> = ({
  onPrintReceipt,
  initialSubTab
}) => {
  const { students, feePayments, getStudentFeeOutstandingSummary, getPromotedStudentsWithPreviousDues } = useData();
  const [activeSubTab, setActiveSubTab] = useState<'collect' | 'due' | 'promoted_dues' | 'receipts'>('collect');
  const [collectModalStudent, setCollectModalStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (initialSubTab === 'promoted_dues' || initialSubTab === 'promoted-dues') {
      setActiveSubTab('promoted_dues');
    }
  }, [initialSubTab]);

  const promotedDuesList = useMemo(() => {
    return getPromotedStudentsWithPreviousDues();
  }, [getPromotedStudentsWithPreviousDues]);

  const subTabs: { id: string; label: string; icon: any; count?: number }[] = [
    { id: 'collect', label: 'Fee Collection', icon: IndianRupee },
    { id: 'due', label: 'Due Fees', icon: Clock },
    {
      id: 'promoted_dues',
      label: 'Promoted Students Dues',
      icon: UserCheck,
      count: promotedDuesList.length
    },
    { id: 'receipts', label: 'Receipts', icon: IndianRupee },
  ];

  const handleCollectStudentFee = (student: Student) => {
    setCollectModalStudent(student);
  };

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'collect':
        return <FeeCollectionView onPrintReceipt={onPrintReceipt} />;
      case 'due':
        return <DueFeesView onCollectStudentFee={handleCollectStudentFee} />;
      case 'promoted_dues':
        return <PromotedStudentsDuesView onCollectDue={(student) => setCollectModalStudent(student)} />;
      case 'receipts':
        return <FeeReceiptsView />;
      default:
        return <FeeCollectionView onPrintReceipt={onPrintReceipt} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-brand-600 dark:text-brand-400" /> Fee Collection & Dues
          </h2>
          <p className="text-xs text-slate-500">Collect fees, manage current due fees & track promoted students with previous year dues</p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'due' && (
            <ExportButton
              data={students
                .map((s) => ({ s, summary: getStudentFeeOutstandingSummary(s.id) }))
                .filter((item) => item.summary.totalOutstanding > 0)
                .map(({ s, summary }) => ({
                  name: `${s.firstName} ${s.lastName}`,
                  admissionNo: s.admissionNo,
                  class: `${s.className}-${s.section}`,
                  currentYearDue: summary.currentYearDue,
                  previousYearsDue: summary.previousYearsDue,
                  totalOutstanding: summary.totalOutstanding,
                }))}
              filename="outstanding_dues"
            />
          )}
          {activeSubTab === 'receipts' && (
            <ExportButton data={feePayments} filename="fee_receipts" />
          )}
        </div>
      </div>

      {/* Sub-tab Selector */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? tab.id === 'promoted_dues'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20 font-black'
                    : 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Render Active View */}
      <div>{renderSubTabContent()}</div>

      {/* Fee Collect Modal */}
      {collectModalStudent && (
        <FeeCollectModal
          isOpen={!!collectModalStudent}
          onClose={() => setCollectModalStudent(null)}
          student={collectModalStudent}
          onReceiptGenerated={(payment) => {
            onPrintReceipt(payment);
            setCollectModalStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default FeeCollectionContainerView;
