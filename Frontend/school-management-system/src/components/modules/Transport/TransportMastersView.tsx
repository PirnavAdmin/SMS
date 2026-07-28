import React, { useState } from 'react';
import { Route, Bus, Users, MapPin, Layers, Wrench, Navigation, UserCheck } from 'lucide-react';
import { RouteMasterView } from './RouteMasterView';
import { VehicleMasterView } from './VehicleMasterView';
import { DriverMasterView } from './DriverMasterView';
import { BusAttendantMasterView } from './BusAttendantMasterView';
import { PickupPointsView } from './PickupPointsView';
import { VehicleAssignmentView } from './VehicleAssignmentView';
import { VehicleMaintenanceView } from './VehicleMaintenanceView';
import { TransportGPSTrackingView } from './TransportGPSTrackingView';

export const TransportMastersView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'routes' | 'vehicles' | 'drivers' | 'attendants' | 'pickups' | 'assignments' | 'maintenance' | 'gps'>('routes');

  const subTabs = [
    { id: 'routes', label: 'Route Management', icon: Route },
    { id: 'vehicles', label: 'Vehicle Management', icon: Bus },
    { id: 'drivers', label: 'Driver Management', icon: Users },
    { id: 'attendants', label: 'Bus Attendants', icon: UserCheck },
    { id: 'pickups', label: 'Pickup Points', icon: MapPin },
    { id: 'assignments', label: 'Vehicle Assignments', icon: Layers },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'gps', label: 'GPS Tracking', icon: Navigation }
  ] as const;

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'routes':
        return <RouteMasterView />;
      case 'vehicles':
        return <VehicleMasterView />;
      case 'drivers':
        return <DriverMasterView />;
      case 'attendants':
        return <BusAttendantMasterView />;
      case 'pickups':
        return <PickupPointsView />;
      case 'assignments':
        return <VehicleAssignmentView />;
      case 'maintenance':
        return <VehicleMaintenanceView />;
      case 'gps':
        return <TransportGPSTrackingView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Tab Selector */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Sub-view */}
      <div>
        {renderSubTabContent()}
      </div>
    </div>
  );
};
export default TransportMastersView;
