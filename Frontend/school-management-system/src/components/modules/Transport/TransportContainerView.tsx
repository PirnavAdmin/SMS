import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Route, MapPin, Bus, Users, Layers, UserPlus,
  DollarSign, Wrench, FileSpreadsheet, Navigation
} from 'lucide-react';

import { TransportDashboardView } from './TransportDashboardView';
import { RouteMasterView } from './RouteMasterView';
import { PickupPointsView } from './PickupPointsView';
import { VehicleMasterView } from './VehicleMasterView';
import { DriverMasterView } from './DriverMasterView';
import { VehicleAssignmentView } from './VehicleAssignmentView';
import { StudentTransportAssignmentView } from './StudentTransportAssignmentView';
import { VehicleMaintenanceView } from './VehicleMaintenanceView';
import { TransportReportsView } from './TransportReportsView';
import { TransportGPSTrackingView } from './TransportGPSTrackingView';

interface TransportContainerViewProps {
  initialTab?: string;
}

export const TransportContainerView: React.FC<TransportContainerViewProps> = ({ initialTab = 'transport-dashboard' }) => {
  const normalizedTab = initialTab.startsWith('transport-') ? initialTab : `transport-${initialTab}`;
  const [activeTab, setActiveTab] = useState(normalizedTab);

  useEffect(() => {
    const cleanTab = initialTab.startsWith('transport-') ? initialTab : `transport-${initialTab}`;
    setActiveTab(cleanTab);
  }, [initialTab]);

  const tabs = [
    { id: 'transport-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transport-route-master', label: 'Route Master', icon: Route },
    { id: 'transport-pickup-points', label: 'Pickup Points', icon: MapPin },
    { id: 'transport-vehicle-master', label: 'Vehicle Master', icon: Bus },
    { id: 'transport-driver-master', label: 'Driver Master', icon: Users },
    { id: 'transport-vehicle-assignment', label: 'Vehicle Assignment', icon: Layers },
    { id: 'transport-student-assignment', label: 'Student Assignment', icon: UserPlus },
    { id: 'transport-vehicle-maintenance', label: 'Vehicle Maintenance', icon: Wrench },
    { id: 'transport-reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'transport-gps-tracking', label: 'GPS Tracking', icon: Navigation },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transport-dashboard':
        return <TransportDashboardView />;
      case 'transport-route-master':
        return <RouteMasterView />;
      case 'transport-pickup-points':
        return <PickupPointsView />;
      case 'transport-vehicle-master':
        return <VehicleMasterView />;
      case 'transport-driver-master':
        return <DriverMasterView />;
      case 'transport-vehicle-assignment':
        return <VehicleAssignmentView />;
      case 'transport-student-assignment':
        return <StudentTransportAssignmentView />;
      case 'transport-vehicle-maintenance':
        return <VehicleMaintenanceView />;
      case 'transport-reports':
        return <TransportReportsView />;
      case 'transport-gps-tracking':
        return <TransportGPSTrackingView />;
      default:
        return <TransportDashboardView />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Sub-Navigation Header */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
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

      {/* Main Sub-Module Body */}
      {renderTabContent()}
    </div>
  );
};
