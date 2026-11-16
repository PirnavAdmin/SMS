import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Bus, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { StudentTransport } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { ValidatedSearchInput } from '../../common/ValidatedSearchInput';
import { Pagination } from '../../common/Pagination';

export const StudentTransportView: React.FC = () => {
  const { studentTransports, erpTransportRoutes, students, assignStudentTransport, removeStudentTransport } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssign, setDeletingAssign] = useState<StudentTransport | null>(null);

  const [studentId, setStudentId] = useState('');
  const [routeId, setRouteId] = useState(erpTransportRoutes[0]?.id || '');
  const [feePlan, setFeePlan] = useState<'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual'>('Quarterly');

  const filtered = useMemo(() => {
    return studentTransports.filter(st =>
      st.studentName.toLowerCase().includes(query.toLowerCase()) || st.admissionNo.toLowerCase().includes(query.toLowerCase())
    );
  }, [studentTransports, query]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedTransports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === studentId);
    const rt = erpTransportRoutes.find(r => r.id === routeId);
    if (!st || !rt) {
      addToast('warning', 'Selection Required', 'Select student and transport route.');
      return;
    }

    let feeAmount = rt.quarterlyFee;
    if (feePlan === 'Monthly') feeAmount = rt.monthlyFee;
    if (feePlan === 'Half Yearly') feeAmount = rt.halfYearlyFee;
    if (feePlan === 'Annual') feeAmount = rt.annualFee;

    assignStudentTransport({
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      admissionNo: st.admissionNo,
      routeId: rt.id,
      routeName: rt.routeName,
      pickupPoint: rt.pickupPoint,
      dropPoint: rt.dropPoint,
      feePlan,
      feeAmount,
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'Active'
    });

    addToast('success', 'Transport Assigned', `Assigned ${rt.routeName} to ${st.firstName}`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-6 h-6 text-[var(--primary-color)]" /> Transport Assignment
          </h2>
          </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[var(--primary-color)] hover:opacity-90 text-white text-xs font-bold shadow-md shadow-[var(--primary-color)]/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Assign Transport
          </button>
          <ExportButton data={filtered} filename="student_transports" />
        </div>
      </div>

      {/* Filter */}
      <div className="relative z-20 glass-card p-3.5 sm:p-4 rounded-2xl border border-[var(--primary-color)]/30 dark:border-[var(--primary-color)]/40 flex items-center justify-between">
        <div className="w-full sm:w-72">
          <ValidatedSearchInput
            placeholder="Search student or adm no..."
            value={query}
            onChange={val => {
              setQuery(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-[var(--primary-color)]/30 dark:border-[var(--primary-color)]/40 shadow-sm bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-[var(--primary-color)]/20">
                <th className="py-3 px-3 text-center align-middle whitespace-nowrap">Student Name</th>
                <th className="py-3 px-3 text-center align-middle whitespace-nowrap">Adm No</th>
                <th className="py-3 px-3 text-center align-middle whitespace-nowrap">Route Name</th>
                <th className="py-3 px-3 text-center align-middle whitespace-nowrap">Stops</th>
                <th className="py-3 px-3 text-center align-middle whitespace-nowrap">Fee Plan</th>
                <th className="py-3 px-3 text-center align-middle whitespace-nowrap">Transport Fee</th>
                <th className="py-3 px-3 text-center align-middle whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {paginatedTransports.length > 0 ? (
                paginatedTransports.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-center align-middle font-bold text-slate-900 dark:text-white whitespace-nowrap">{st.studentName}</td>
                    <td className="py-3 px-3 text-center align-middle font-mono text-slate-500 whitespace-nowrap">{st.admissionNo}</td>
                    <td className="py-3 px-3 text-center align-middle font-semibold text-[var(--primary-color)] whitespace-nowrap">{st.routeName}</td>
                    <td className="py-3 px-3 text-center align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap">{st.pickupPoint} ➔ {st.dropPoint}</td>
                    <td className="py-3 px-3 text-center align-middle font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{st.feePlan}</td>
                    <td className="py-3 px-3 text-center align-middle font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatCurrency(st.feeAmount)}</td>
                    <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <button onClick={() => setDeletingAssign(st)} className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No student transports found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Student Transport</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Student <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="">-- Choose Student --</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.className}-{st.section} • Adm: {st.admissionNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Transport Route <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select value={routeId} onChange={e => setRouteId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {erpTransportRoutes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.routeName} ({rt.pickupPoint} • {formatCurrency(rt.quarterlyFee)}/qtr)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Fee Payment Plan</label>
                <select value={feePlan} onChange={e => setFeePlan(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half Yearly">Half Yearly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl">Assign Service</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingAssign}
        title="Remove Transport"
        message={`Are you sure you want to remove transport service for ${deletingAssign?.studentName}?`}
        onConfirm={() => {
          if (deletingAssign) {
            removeStudentTransport(deletingAssign.id);
            addToast('success', 'Transport Service Removed');
            setDeletingAssign(null);
          }
        }}
        onCancel={() => setDeletingAssign(null)}
      />
    </div>
  );
};
