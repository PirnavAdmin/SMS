import React, { useEffect, useState } from 'react';
import { Route, Bus, Users, MapPin, User } from 'lucide-react';
import { RouteMasterView } from './RouteMasterView';
import { VehicleMasterView } from './VehicleMasterView';
import { DriverMasterView } from './DriverMasterView';
import { BusAttendantMasterView } from './BusAttendantMasterView';
import { PickupPointsView } from './PickupPointsView';
import { TransportScrollableTabs } from './TransportScrollableTabs';

export type TransportSetupTabId =
  | 'routes'
  | 'pickups'
  | 'vehicles'
  | 'drivers'
  | 'attendants';

interface TransportMastersViewProps {
  initialTab?: string;
}

const SETUP_TABS = [
  { id: 'routes', label: 'Route Management', icon: Route },
  { id: 'pickups', label: 'Pickup Points', icon: MapPin },
  { id: 'vehicles', label: 'Vehicle Management', icon: Bus },
  { id: 'drivers', label: 'Driver Management', icon: User },
  { id: 'attendants', label: 'Bus Attendants', icon: Users }
] as const;

const normalizeSetupTab = (tab?: string): TransportSetupTabId => {
  const cleanTab = (tab || 'routes').replace(/^transport-/, '');

  switch (cleanTab) {
    case 'routes':
    case 'route-management':
    case 'master':
      return 'routes';
    case 'pickups':
    case 'pickup-points':
      return 'pickups';
    case 'vehicles':
    case 'vehicle-management':
      return 'vehicles';
    case 'drivers':
    case 'driver-management':
      return 'drivers';
    case 'attendants':
    case 'bus-attendants':
      return 'attendants';
    default:
      return 'routes';
  }
};

export const TransportMastersView: React.FC<TransportMastersViewProps> = ({ initialTab = 'routes' }) => {
  const [activeSubTab, setActiveSubTab] = useState<TransportSetupTabId>(normalizeSetupTab(initialTab));

  useEffect(() => {
    setActiveSubTab(normalizeSetupTab(initialTab));
  }, [initialTab]);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'routes':
        return <RouteMasterView />;
      case 'pickups':
        return <PickupPointsView />;
      case 'vehicles':
        return <VehicleMasterView />;
      case 'drivers':
        return <DriverMasterView />;
      case 'attendants':
        return <BusAttendantMasterView />;
      default:
        return <RouteMasterView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <TransportScrollableTabs
        tabs={SETUP_TABS}
        activeId={activeSubTab}
        onChange={tabId => setActiveSubTab(tabId as TransportSetupTabId)}
        sticky={false}
      />

      <div>{renderSubTabContent()}</div>
    </div>
  );
};
export default TransportMastersView;
