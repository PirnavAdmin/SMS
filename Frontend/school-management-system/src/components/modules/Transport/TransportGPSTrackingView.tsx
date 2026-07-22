import React, { useState } from 'react';
import { Navigation, Bus, Cpu, Signal, AlertCircle } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export const TransportGPSTrackingView: React.FC = () => {
  const { vehicleMasters } = useData();
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleMasters[0]?.vehicleNumber || 'BUS-101');

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Navigation className="w-6 h-6 text-sky-500 animate-spin" /> GPS Telematics & Live Location Tracker
        </h2>
        <p className="text-xs text-slate-500">Real-time GPS vehicle telematics, route waypoints, and speed simulation feed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicles List */}
        <div className="glass-card p-5 rounded-3xl space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-4 h-4 text-sky-500" /> Tracked Fleet Vehicles
          </h3>
          <div className="space-y-2">
            {vehicleMasters.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.vehicleNumber)}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all text-xs ${
                  selectedVehicle === v.vehicleNumber
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-left">
                  <p className="font-extrabold text-sm">{v.vehicleNumber}</p>
                  <p className="text-[10px] opacity-80">{v.vehicleType} • GPS: {v.gpsDeviceId}</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold">
                  <Signal className="w-3 h-3 text-emerald-400 animate-pulse" /> Live
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Live GPS Telematics Map Area */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  Live Telematics - {selectedVehicle}
                </h3>
                <p className="text-xs text-slate-500">Speed: 42 km/h • Heading: East Suburbs Expressway</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">
                Active Telematics Signal
              </span>
            </div>

            {/* Simulated Radar Box */}
            <div className="h-64 w-full rounded-2xl bg-slate-950 relative overflow-hidden flex items-center justify-center text-white p-6 border border-slate-800">
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />
              <div className="relative text-center space-y-3">
                <Bus className="w-12 h-12 text-sky-400 mx-auto animate-bounce" />
                <div>
                  <p className="text-sm font-black tracking-wide">{selectedVehicle} En Route</p>
                  <p className="text-xs text-sky-300">Approaching Stop #3: JNTU Metro Gate (Eta: 4 Mins)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon third-party API integration banner */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-sky-500 shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold text-slate-900 dark:text-white">Third-Party GPS Hardware API Integration Section</p>
              <p className="text-slate-500">Supports AIS-140 GPS Devices, MapmyIndia, Traccar, Google Maps Matrix, and Parent Mobile App push notifications.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
