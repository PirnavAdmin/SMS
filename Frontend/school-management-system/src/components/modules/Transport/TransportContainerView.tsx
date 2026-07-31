import React, { useEffect, useState } from 'react';
import { Link2, CalendarClock, Navigation, Wrench } from 'lucide-react';
import { TransportDashboardView } from './TransportDashboardView';
import { TransportMastersView } from './TransportMastersView';
import { TransportReportsView } from './TransportReportsView';
import { VehicleAssignmentView } from './VehicleAssignmentView';
import { VehicleTripsView } from './VehicleTripsView';
import { TransportGPSTrackingView } from './TransportGPSTrackingView';
import { VehicleMaintenanceView } from './VehicleMaintenanceView';
import { TransportScrollableTabs } from './TransportScrollableTabs';
import { VehicleAssignment } from '../../../types';

interface TransportContainerViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

type TransportSectionTab = 'dashboard' | 'setup' | 'operations' | 'reports';
type TransportOperationTab = 'vehicle-assignment' | 'vehicle-trips' | 'gps-tracking' | 'maintenance';
type TransportSectionState = {
  section: TransportSectionTab;
  childTab: string;
};

const OPERATION_TABS = [
  { id: 'vehicle-assignment', label: 'Vehicle Assignment', icon: Link2 },
  { id: 'vehicle-trips', label: 'Vehicle Trips', icon: CalendarClock },
  { id: 'gps-tracking', label: 'GPS Tracking', icon: Navigation },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench }
] as const;

const normalizeOperationTab = (tab?: string): TransportOperationTab => {
  const cleanTab = (tab || 'vehicle-assignment').replace(/^transport-/, '');

  switch (cleanTab) {
    case 'operations':
    case 'vehicle-assignment':
    case 'assignments':
    case 'vehicle-assignments':
    case 'transport-assignment':
    case 'student-transport-assignment':
    case 'student-assignment':
      return 'vehicle-assignment';
    case 'vehicle-trips':
    case 'trip-scheduling':
    case 'trips':
      return 'vehicle-trips';
    case 'gps-tracking':
    case 'gps':
      return 'gps-tracking';
    case 'maintenance':
    case 'vehicle-maintenance':
      return 'maintenance';
    default:
      return 'vehicle-assignment';
  }
};

const normalizeSectionState = (tab?: string): TransportSectionState => {
  const cleanTab = (tab || 'transport-dashboard').replace(/^transport-/, '');

  switch (cleanTab) {
    case 'dashboard':
      return { section: 'dashboard', childTab: '' };
    case 'setup':
    case 'masters':
    case 'route-management':
    case 'routes':
    case 'pickup-points':
    case 'pickups':
    case 'vehicle-management':
    case 'vehicles':
    case 'driver-management':
    case 'drivers':
    case 'bus-attendants':
    case 'attendants':
      return { section: 'setup', childTab: cleanTab };
    case 'operations':
    case 'student-transport-assignment':
    case 'transport-assignment':
    case 'student-assignment':
      return { section: 'operations', childTab: 'vehicle-assignment' };
    case 'vehicle-assignment':
    case 'assignments':
    case 'vehicle-assignments':
      return { section: 'operations', childTab: 'vehicle-assignment' };
    case 'trip-scheduling':
    case 'vehicle-trips':
    case 'trips':
      return { section: 'operations', childTab: 'vehicle-trips' };
    case 'gps-tracking':
    case 'gps':
      return { section: 'operations', childTab: 'gps-tracking' };
    case 'maintenance':
    case 'vehicle-maintenance':
      return { section: 'operations', childTab: 'maintenance' };
    case 'reports':
    case 'dashboard-report':
    case 'transport-dashboard-report':
    case 'trip-reports':
    case 'vehicle-reports':
    case 'driver-reports':
    case 'route-reports':
    case 'student-transport-reports':
    case 'maintenance-reports':
      return { section: 'reports', childTab: cleanTab };
    default:
      return { section: 'dashboard', childTab: '' };
  }
};

export const TransportContainerView: React.FC<TransportContainerViewProps> = ({ initialTab = 'transport-dashboard', onTabChange }) => {
  const initialState = normalizeSectionState(initialTab);
  const [activeSection, setActiveSection] = useState<TransportSectionTab>(initialState.section);
  const [sectionSeedTab, setSectionSeedTab] = useState(initialState.childTab);
  const [activeOperationTab, setActiveOperationTab] = useState<TransportOperationTab>(
    initialState.section === 'operations' ? normalizeOperationTab(initialState.childTab) : 'vehicle-assignment'
  );
  const [gpsSeedVehicleId, setGpsSeedVehicleId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const nextState = normalizeSectionState(initialTab);
    setActiveSection(nextState.section);
    setSectionSeedTab(nextState.childTab);
    setActiveOperationTab(nextState.section === 'operations' ? normalizeOperationTab(nextState.childTab) : 'vehicle-assignment');
  }, [initialTab]);

  const handleSectionChange = (section: TransportSectionTab) => {
    setActiveSection(section);

    switch (section) {
      case 'dashboard':
        setSectionSeedTab('');
        onTabChange?.('transport-dashboard');
        break;
      case 'setup':
        setSectionSeedTab('routes');
        onTabChange?.('transport-setup');
        break;
      case 'operations':
        setSectionSeedTab('vehicle-assignment');
        setActiveOperationTab('vehicle-assignment');
        setGpsSeedVehicleId(undefined);
        onTabChange?.('transport-operations');
        break;
      case 'reports':
        setSectionSeedTab('transport-dashboard-report');
        onTabChange?.('transport-reports');
        break;
      default:
        setSectionSeedTab('');
    }
  };

  const handleOpenGps = (assignment: VehicleAssignment) => {
    setActiveSection('operations');
    setSectionSeedTab('gps-tracking');
    setActiveOperationTab('gps-tracking');
    setGpsSeedVehicleId(assignment.vehicleId);
    onTabChange?.('transport-operations');
  };

  const renderTabContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <TransportDashboardView onNavigateToSection={handleSectionChange} />;
      case 'setup':
        return <TransportMastersView initialTab={sectionSeedTab || 'routes'} />;
      case 'operations':
        return (
          <div className="space-y-5 animate-in fade-in">
            <TransportScrollableTabs
              title="Transport Operations"
              subtitle="Assign fleet resources, review trips, monitor GPS, and manage maintenance."
              tabs={OPERATION_TABS}
              activeId={activeOperationTab}
              onChange={tabId => setActiveOperationTab(tabId as TransportOperationTab)}
              sticky={false}
            />

            <div>
              {activeOperationTab === 'vehicle-assignment' && <VehicleAssignmentView />}
              {activeOperationTab === 'vehicle-trips' && <VehicleTripsView onOpenGps={handleOpenGps} />}
              {activeOperationTab === 'gps-tracking' && <TransportGPSTrackingView initialVehicleId={gpsSeedVehicleId} />}
              {activeOperationTab === 'maintenance' && <VehicleMaintenanceView />}
            </div>
          </div>
        );
      case 'reports':
        return <TransportReportsView initialTab={sectionSeedTab || 'transport-dashboard-report'} />;
      default:
        return <TransportDashboardView onNavigateToSection={handleSectionChange} />;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {renderTabContent()}
    </div>
  );
};
