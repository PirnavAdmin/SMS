import React, { useState, useMemo } from 'react';
import { LifeBuoy, Search, X, AlertCircle, SearchX } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { validateSearchQuery } from '../../../utils/validation';

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
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    if (!value.trim()) {
      setSearchError(undefined);
    } else {
      const res = validateSearchQuery(value.trim(), 30);
      setSearchError(res.isValid ? undefined : (res.error || 'Enter a valid search term.'));
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchError(undefined);
    setCurrentPage(1);
  };

  const filteredTickets = useMemo(() => {
    if (searchError) return [];
    const term = searchTerm.toLowerCase().trim();
    return tickets.filter(t => {
      const matchesSearch =
        !term ||
        t.subject.toLowerCase().includes(term) ||
        t.schoolName.toLowerCase().includes(term) ||
        t.ticketNo.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, searchError, statusFilter]);

  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage) || 1;

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredTickets.slice(start, start + rowsPerPage);
  }, [filteredTickets, currentPage, rowsPerPage]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-6">
      
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
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Row Per Page</span>
            <select
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <div className="relative flex items-center">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 ${searchError ? 'text-rose-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search ticket, school or subject..."
                  value={searchTerm}
                  maxLength={30}
                  onChange={e => handleSearchChange(e.target.value)}
                  className={`w-64 pl-8 ${searchTerm ? 'pr-8' : 'pr-3'} py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border transition-all ${
                    searchError
                      ? 'border-rose-500 ring-1 ring-rose-500/20 text-rose-900 dark:text-rose-100 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-500'
                  } outline-none font-medium`}
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {searchError && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1 pl-1 animate-in fade-in duration-150 absolute -bottom-5 left-0 whitespace-nowrap z-20">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{searchError}</span>
                </p>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3 text-center">Ticket #</th>
                <th className="p-3 text-center">School</th>
                <th className="p-3 text-center">Subject</th>
                <th className="p-3 text-center">Priority</th>
                <th className="p-3 text-center">Created Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {searchError ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-rose-500 dark:text-rose-400">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                      <p className="font-bold text-xs">{searchError}</p>
                      <p className="text-[11px] text-slate-400 font-normal">Please enter a valid search query.</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      {searchTerm ? (
                        <>
                          <SearchX className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="font-bold text-sm text-slate-700 dark:text-slate-200">No Matching Tickets</p>
                          <p className="text-xs text-slate-400">No tickets found matching "{searchTerm}". Try a different search term or clear the filter.</p>
                          <button
                            onClick={handleClearSearch}
                            className="mt-2 px-3 py-1.5 rounded-xl btn-glass-secondary text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Reset Search
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-inner">
                            <LifeBuoy className="w-6 h-6" />
                          </div>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">No Tenant Support Tickets Found</p>
                          <p className="text-xs text-slate-400">There are currently no open support requests or customer helpdesk inquiries from any registered institution.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center font-mono font-bold text-sky-600">{t.ticketNo}</td>
                    <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{t.schoolName}</td>
                    <td className="p-3 text-center max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                      {t.subject}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === 'Critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60' :
                        t.priority === 'High' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3 text-center text-slate-400">{t.createdAt}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60' :
                        t.status === 'In Progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-950/60'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl btn-glass-secondary text-sky-600 hover:text-sky-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                        >
                          View Thread
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredTickets.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
            {Math.min(currentPage * rowsPerPage, filteredTickets.length)} of {filteredTickets.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-sky-600">{selectedTicket.ticketNo}</span>
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
                  className="px-4 py-2 text-xs font-bold rounded-xl btn-glass-primary text-white active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Mark as Resolved
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
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
