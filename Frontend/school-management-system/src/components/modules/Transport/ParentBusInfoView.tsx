import React from 'react';
import { Bus, MapPin, Phone, UserCircle, AlertCircle, Clock } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const ParentBusInfoView: React.FC = () => {
  const { students } = useData();
  const { user, role } = useAuth();

  // Match children by email or phone, or own ID if student
  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (
      role === 'Student' ? s.id === user?.id : 
      (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
    )
  );

  if (parentWards.length === 0) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 1);
  }

  const currentWard = parentWards[0];
  
  // Mock bus data - in a real app, this would come from a transport collection in DataContext
  const hasTransport = true;
  const busInfo = {
    routeNumber: 'R-14',
    routeName: 'Downtown Express',
    busNumber: 'MH-12-AB-1234',
    driverName: 'Robert Wilson',
    driverPhone: '+1 (555) 019-8273',
    attendantName: 'Mary Smith',
    attendantPhone: '+1 (555) 019-8274',
    pickupTime: '07:30 AM',
    dropTime: '04:15 PM',
    stopName: 'Central Park West',
    monthlyFee: '$50.00'
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 dark:bg-brand-500/20 rounded-lg hidden sm:block">
            <Bus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Bus Information</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">View transport details for your ward</p>
          </div>
        </div>
      </div>

      <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white dark:bg-sky-900 rounded-full flex items-center justify-center font-bold text-sky-600 dark:text-sky-400">
          {currentWard.firstName.charAt(0)}
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Currently Viewing Ward</p>
          <p className="font-bold text-slate-900 dark:text-white">
            {currentWard.firstName} {currentWard.lastName} <span className="opacity-75 text-xs ml-1">({currentWard.className}-{currentWard.section})</span>
          </p>
        </div>
      </div>

      {!hasTransport ? (
        <div className="glass-card p-12 text-center rounded-3xl">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Transport Assigned</h3>
          <p className="text-slate-500 mt-2">Your ward is not currently assigned to any school transport facility.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Route Info */}
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Route Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-500">Route Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{busInfo.routeName} ({busInfo.routeNumber})</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-500">Stop Location</span>
                <span className="font-bold text-slate-900 dark:text-white">{busInfo.stopName}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Pickup Time</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{busInfo.pickupTime}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Drop Time</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{busInfo.dropTime}</span>
              </div>
            </div>
          </div>

          {/* Vehicle & Contact Info */}
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Crew Details</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-l-2 border-brand-500">
                <span className="text-sm text-slate-500">Bus Registration</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{busInfo.busNumber}</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Driver</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{busInfo.driverName}</span>
                  <a href={`tel:${busInfo.driverPhone}`} className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                    <Phone className="w-4 h-4" /> {busInfo.driverPhone}
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Attendant</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{busInfo.attendantName}</span>
                  <a href={`tel:${busInfo.attendantPhone}`} className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                    <Phone className="w-4 h-4" /> {busInfo.attendantPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
