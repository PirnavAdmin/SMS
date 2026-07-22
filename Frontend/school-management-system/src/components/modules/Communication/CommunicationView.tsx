import React, { useState } from 'react';
import { Megaphone, Send, Mail, MessageSquare, Bell } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const CommunicationView: React.FC = () => {
  const { announcements, addAnnouncement } = useData();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<'All' | 'Students' | 'Staff' | 'Parents'>('All');
  const [category, setCategory] = useState<'General' | 'Urgent' | 'Academic' | 'Sports'>('General');
  const [sendSMS, setSendSMS] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    addAnnouncement({
      title,
      content,
      targetAudience: target,
      date: new Date().toISOString().split('T')[0],
      author: 'Administration',
      category
    });

    addToast('success', 'Announcement Broadcasted', `Dispatched to ${target} via ${sendSMS ? 'SMS, ' : ''}${sendEmail ? 'Email, ' : ''}Push`);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-brand-600" /> School Communications Hub
        </h2>
        <p className="text-xs text-slate-500">Broadcast circulars, instant SMS alerts, emails, and push notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Compose Broadcast Circular</h3>
          <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Early School Dismissal Notice"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Target Audience</label>
                <select value={target} onChange={e => setTarget(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                  <option value="All">All Portal Users</option>
                  <option value="Students">Students Only</option>
                  <option value="Parents">Parents Only</option>
                  <option value="Staff">Staff Only</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                  <option value="General">General</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Academic">Academic</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Notification Channels</label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={sendSMS} onChange={e => setSendSMS(e.target.checked)} />
                  <span>SMS Alert</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
                  <span>Email Broadcast</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Message Content *</label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Type circular announcement text..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              <Send className="w-4 h-4" /> Dispatch Broadcast
            </button>
          </form>
        </div>

        {/* Live Broadcast Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Circular Feed</h3>
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="glass-card p-5 rounded-3xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 font-bold uppercase">{a.category} • {a.targetAudience}</span>
                  <span className="text-slate-400">{a.date}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{a.title}</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{a.content}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-emerald-500" /> SMS Sent</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-sky-500" /> Emails Sent</span>
                  <span className="flex items-center gap-1"><Bell className="w-3 h-3 text-purple-500" /> Push Delivered</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
