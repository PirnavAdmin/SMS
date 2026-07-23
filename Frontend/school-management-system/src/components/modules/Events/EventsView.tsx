import React from 'react';
import { Calendar, Cake, Sparkles } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const EventsView: React.FC = () => {
  const { holidays, birthdays } = useData();

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-500" /> Academic Calendar & Events
        </h2>
        <p className="text-xs text-slate-500">School event schedule, official gazetted holidays, and birthday celebrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holidays */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Gazetted & School Holidays
          </h3>
          <div className="space-y-3">
            {holidays.map(h => (
              <div key={h.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{h.name}</p>
                  <p className="text-slate-500">{h.type}</p>
                </div>
                <span className="font-extrabold px-3 py-1 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {h.startDate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Birthdays */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Cake className="w-4 h-4 text-rose-500" /> Upcoming Birthdays
          </h3>
          <div className="space-y-3">
            {birthdays.map(b => (
              <div key={b.id} className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 flex items-center gap-3 text-xs">
                <img src={b.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</p>
                  <p className="text-slate-500">{b.role} • {b.className}</p>
                </div>
                <span className="font-bold text-rose-500">{b.dob}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
