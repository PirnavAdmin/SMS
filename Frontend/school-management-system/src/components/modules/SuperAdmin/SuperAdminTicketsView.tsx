import React, { useState } from 'react';
import { LifeBuoy, Search } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

interface Ticket {
  id: string;
  ticketNo: string;
  schoolName: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  lastReply: string;
}

export const SuperAdminTicketsView: React.FC = () => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const raw = localStorage.getItem('sms_superadmin_tickets');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const saveTickets = (updated: Ticket[]) => {
    setTickets(updated);
    try {
      localStorage.setItem('sms_superadmin_tickets', JSON.stringify(updated));
    } catch {}
  };

  const handleResolveTicket = (ticketId: string) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: 'Resolved' as const } : t);
    saveTickets(updated);
    addToast('success', 'Ticket Resolved', 'The support ticket has been marked as resolved.');
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: 'Resolved' } : null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Super Admin</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Support Tickets</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Tenant Support & Helpdesk Tickets</span>
            <span className="px-2 py-0.5 text-xs font-black bg-rose-600 text-white rounded-md">LIVE</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Institutional support tickets submitted by school administrators and tenants.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ticket, school or subject..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none w-64 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Ticket #</th>
                <th className="p-4">School</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Created Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LifeBuoy className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No support tickets found</p>
                      <p className="text-xs text-slate-400">Institutional support tickets submitted by schools will be listed here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-orange-600">{t.ticketNo}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{t.schoolName}</td>
                    <td className="p-4 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                      {t.subject}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === 'Critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60' :
                        t.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{t.createdAt}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60' :
                        t.status === 'In Progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-950/60'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1 text-xs font-semibold text-orange-600 hover:text-white hover:bg-orange-600 border border-orange-500/30 rounded-lg transition-colors"
                      >
                        View Thread
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-orange-600">{selectedTicket.ticketNo}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-500">{selectedTicket.schoolName}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <p><strong>Category:</strong> {selectedTicket.category}</p>
              <p><strong>Priority:</strong> {selectedTicket.priority}</p>
              <p><strong>Status:</strong> {selectedTicket.status}</p>
              <p><strong>Last Response:</strong> {selectedTicket.lastReply}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {selectedTicket.status !== 'Resolved' && (
                <button
                  onClick={() => handleResolveTicket(selectedTicket.id)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all"
                >
                  Mark as Resolved
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
