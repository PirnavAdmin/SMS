import React, { useState } from 'react';
import { Library, BookOpen, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';

export const LibraryView: React.FC = () => {
  const { books, bookIssues, addBook, issueBook, returnBook } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'inventory' | 'issues'>('inventory');
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);

  const [newBook, setNewBook] = useState({
    isbn: '978-0134' + Math.floor(100000 + Math.random() * 900000),
    title: '',
    author: '',
    category: 'Science',
    totalCopies: 10,
    availableCopies: 10,
    rackNo: 'Rack S-05'
  });

  const [newIssue, setNewIssue] = useState({
    bookId: books[0]?.id || '',
    borrowerName: 'Alexander Wright',
    borrowerRole: 'Student' as const,
    dueDate: '2026-08-01'
  });

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;
    addBook(newBook);
    addToast('success', 'Book Registered', `Added "${newBook.title}" to library catalog`);
    setIsAddBookOpen(false);
  };

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    const bk = books.find(b => b.id === newIssue.bookId);
    if (!bk || bk.availableCopies <= 0) {
      addToast('error', 'Book Unavailable', 'No available copies left to issue.');
      return;
    }

    issueBook({
      bookId: bk.id,
      bookTitle: bk.title,
      borrowerId: 'STU-001',
      borrowerName: newIssue.borrowerName,
      borrowerRole: newIssue.borrowerRole,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newIssue.dueDate,
      fineAmount: 0,
      status: 'Issued'
    });
    addToast('success', 'Book Issued', `Issued "${bk.title}" to ${newIssue.borrowerName}`);
    setIsIssueOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Library className="w-6 h-6 text-amber-500" /> Library Management
          </h2>
          <p className="text-xs text-slate-500">Book inventory catalog, issue & return workflow, fine calculation</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsIssueOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> Issue Book
          </button>
          <button
            onClick={() => setIsAddBookOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add New Book
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          Book Inventory ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'issues' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          Issued Books & Overdues ({bookIssues.length})
        </button>
      </div>

      {/* Inventory */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {books.map(b => (
            <div key={b.id} className="glass-card p-5 rounded-3xl space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950">{b.category}</span>
                <span className="text-xs font-mono text-slate-400">{b.rackNo}</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{b.title}</h3>
              <p className="text-xs text-slate-500">Author: {b.author}</p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-bold">
                <span className="text-slate-400">Available:</span>
                <span className={b.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-500'}>
                  {b.availableCopies} / {b.totalCopies} Copies
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issued List */}
      {activeTab === 'issues' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Fine ($)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bookIssues.map(iss => (
                <tr key={iss.id}>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{iss.bookTitle}</td>
                  <td className="py-3 px-4">{iss.borrowerName} ({iss.borrowerRole})</td>
                  <td className="py-3 px-4 text-slate-500">{iss.issueDate}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{iss.dueDate}</td>
                  <td className="py-3 px-4 text-rose-500 font-bold">${iss.fineAmount}</td>
                  <td className="py-3 px-4"><Badge variant={iss.status === 'Returned' ? 'success' : 'danger'}>{iss.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    {iss.status !== 'Returned' && (
                      <button
                        onClick={() => returnBook(iss.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                      >
                        Return Book
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {isAddBookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Book to Library Catalog</h3>
            <form onSubmit={handleAddBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Book Title *</label>
                <input type="text" required value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Author *</label>
                <input type="text" required value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Total Copies</label>
                  <input type="number" value={newBook.totalCopies} onChange={e => setNewBook({ ...newBook, totalCopies: Number(e.target.value), availableCopies: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Rack Location</label>
                  <input type="text" value={newBook.rackNo} onChange={e => setNewBook({ ...newBook, rackNo: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddBookOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-amber-500 text-white rounded-xl">Register Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isIssueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Issue Book to Student / Staff</h3>
            <form onSubmit={handleIssueBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Book</label>
                <select value={newIssue.bookId} onChange={e => setNewIssue({ ...newIssue, bookId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Borrower Name</label>
                <input type="text" required value={newIssue.borrowerName} onChange={e => setNewIssue({ ...newIssue, borrowerName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Due Return Date</label>
                <input type="date" value={newIssue.dueDate} onChange={e => setNewIssue({ ...newIssue, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsIssueOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-indigo-600 text-white rounded-xl">Confirm Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
