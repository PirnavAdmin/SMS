import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Database, Activity, RefreshCw } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const SettingsView: React.FC = () => {
  const { schoolProfile, updateSchoolProfile, auditLogs } = useData();
  const { addToast } = useToast();

  const [profileForm, setProfileForm] = useState(schoolProfile);
  const [activeTab, setActiveTab] = useState<'profile' | 'backup' | 'audit'>('profile');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(profileForm);
    addToast('success', 'Settings Saved', 'School profile updated successfully');
  };

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `school_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Backup Exported', 'Downloaded database JSON backup');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-600" /> System Settings & Audit Logs
        </h2>
        <p className="text-xs text-slate-500">School branding profile, backup/restore database, and security audit trail</p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          School Branding Profile
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'backup' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          Backup & Restore
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          System Audit Logs ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="glass-card p-6 rounded-3xl space-y-4 max-w-2xl">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">School Identification Information</h3>
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">School Name *</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tagline</label>
              <input
                type="text"
                value={profileForm.tagline}
                onChange={e => setProfileForm({ ...profileForm, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Address</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Principal Name</label>
                <input
                  type="text"
                  value={profileForm.principalName}
                  onChange={e => setProfileForm({ ...profileForm, principalName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Academic Session Year</label>
                <input
                  type="text"
                  value={profileForm.academicYear}
                  onChange={e => setProfileForm({ ...profileForm, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 shadow-md">
                <Save className="w-4 h-4" /> Save School Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="glass-card p-6 rounded-3xl space-y-4 max-w-xl">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> Database Backup & Recovery
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Export a complete JSON snapshot of all student records, fee ledgers, staff records, and system settings for offline archival.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleBackup}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Database className="w-4 h-4" /> Download JSON Backup
            </button>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.userName} ({log.userRole})</td>
                  <td className="py-3 px-4 text-brand-600 font-semibold">{log.action}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
