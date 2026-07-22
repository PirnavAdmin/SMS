import React, { useState } from 'react';
import { FileText, Plus, CheckCircle2, Calendar, Edit, Trash2, X, Paperclip, Lock, Search } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Homework, HomeworkAttachment } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const HomeworkView: React.FC = () => {
  const { homework, addHomework, updateHomework, deleteHomework } = useData();
  const { role } = useAuth();
  const { addToast } = useToast();

  // RBAC checks
  const canModify = role === 'Teacher' || role === 'Super Admin';

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [deletingHomework, setDeletingHomework] = useState<Homework | null>(null);

  const [attachments, setAttachments] = useState<HomeworkAttachment[]>([]);
  const [newAttName, setNewAttName] = useState('');

  const [formData, setFormData] = useState<Partial<Homework>>({
    title: '',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    teacherName: 'Jonathan Miller',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: '2026-07-28',
    description: '',
    totalSubmissions: 0
  });

  const filtered = homework.filter(h => {
    const matchQuery = h.title.toLowerCase().includes(query.toLowerCase()) || h.description.toLowerCase().includes(query.toLowerCase());
    const matchClass = filterClass === 'All' || h.className === filterClass;
    const matchSubject = filterSubject === 'All' || h.subject === filterSubject;
    return matchQuery && matchClass && matchSubject;
  });

  const handleOpenAdd = () => {
    if (!canModify) {
      addToast('error', 'Access Restricted', 'Only Teachers can create homework assignments.');
      return;
    }
    setEditingHomework(null);
    setAttachments([]);
    setFormData({
      title: '',
      className: 'Class 10',
      section: 'A',
      subject: 'Mathematics',
      teacherName: 'Jonathan Miller',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: '2026-07-28',
      description: '',
      totalSubmissions: 0
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (hw: Homework) => {
    if (!canModify) {
      addToast('error', 'Access Restricted', 'Only Teachers can edit homework assignments.');
      return;
    }
    setEditingHomework(hw);
    setAttachments(hw.attachments || []);
    setFormData(hw);
    setIsFormOpen(true);
  };

  const handleAddAttachment = () => {
    if (!newAttName) return;
    const att: HomeworkAttachment = {
      id: 'ATT-' + Math.floor(100 + Math.random() * 900),
      name: newAttName,
      url: '#',
      type: newAttName.endsWith('.pdf') ? 'PDF' : newAttName.endsWith('.png') ? 'Image' : 'Doc'
    };
    setAttachments(prev => [...prev, att]);
    setNewAttName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    const dataToSave = { ...formData, attachments };

    if (editingHomework) {
      updateHomework(editingHomework.id, dataToSave);
      addToast('success', 'Homework Updated', `Updated ${formData.title}`);
    } else {
      addHomework(dataToSave as Omit<Homework, 'id'>);
      addToast('success', 'Homework Assigned', `Posted ${formData.title}`);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" /> Homework & Assignments
          </h2>
          <p className="text-xs text-slate-500">
            {canModify ? 'Create, edit & assign class homework with file attachments' : 'Admin View: Search, filter & monitor submission statistics'}
          </p>
        </div>

        {canModify ? (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Homework
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 border border-amber-200 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" /> Read-Only Admin View
          </div>
        )}
      </div>

      {/* Admin Search & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search homework by title or topic..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="All">All Classes</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 11">Class 11</option>
            <option value="Class 12">Class 12</option>
          </select>

          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="All">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="English">English</option>
            <option value="Computer Science">Computer Science</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(hw => (
          <div key={hw.id} className="glass-card p-6 rounded-3xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950">
                  {hw.className}-{hw.section} • {hw.subject}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">{hw.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Due: {hw.dueDate}
                </span>
                {canModify && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(hw)}
                      className="p-1 rounded hover:bg-slate-100 text-brand-600"
                      title="Edit Homework"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingHomework(hw)}
                      className="p-1 rounded hover:bg-rose-50 text-rose-600"
                      title="Delete Homework"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{hw.description}</p>

            {/* Attachments */}
            {hw.attachments && hw.attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hw.attachments.map(att => (
                  <span key={att.id} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1">
                    <Paperclip className="w-3 h-3 text-brand-600" /> {att.name}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Teacher: <strong className="text-slate-900 dark:text-white">{hw.teacherName}</strong></span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {hw.totalSubmissions} Submissions
              </span>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingHomework ? 'Edit Homework Assignment' : 'Create New Homework Assignment'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Chapter 5 Calculus Exercise"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Class</label>
                  <select value={formData.className} onChange={e => setFormData({ ...formData, className: e.target.value })} className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Section</label>
                  <select value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="A">Sec A</option>
                    <option value="B">Sec B</option>
                    <option value="C">Sec C</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Mathematics">Math</option>
                    <option value="Physics">Physics</option>
                    <option value="English">English</option>
                    <option value="Computer Science">CS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Attach Files (PDF, Images, Docs)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Attachment name (e.g. Worksheet.pdf)"
                    value={newAttName}
                    onChange={e => setNewAttName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                  <button type="button" onClick={handleAddAttachment} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold">Add</button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Instructions / Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed assignment instructions..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-brand-600 text-white rounded-xl">
                  {editingHomework ? 'Save Changes' : 'Publish Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingHomework}
        title="Delete Homework"
        message={`Are you sure you want to delete ${deletingHomework?.title}?`}
        onConfirm={() => {
          if (deletingHomework) {
            deleteHomework(deletingHomework.id);
            addToast('success', 'Homework Deleted');
            setDeletingHomework(null);
          }
        }}
        onCancel={() => setDeletingHomework(null)}
      />
    </div>
  );
};
