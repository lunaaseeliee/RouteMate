import React from 'react';
import { MapPin, Navigation, Clock, Gauge, Route as RouteIcon, Sparkles } from 'lucide-react';
import { GoogleMapsPlace, CalculatedRouteInfo } from '../../types';

interface RouteStatsDisplayProps {
  pickup: GoogleMapsPlace | null;
  destination: GoogleMapsPlace | null;
  routeInfo: CalculatedRouteInfo | null;
  loading?: boolean;
}

export const RouteStatsDisplay: React.FC<RouteStatsDisplayProps> = ({
  pickup,
  destination,
  routeInfo,
  loading = false
}) => {
  if (!pickup && !destination) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center text-xs text-slate-500 dark:text-slate-400">
        <RouteIcon className="w-5 h-5 mx-auto mb-1.5 opacity-40 text-indigo-500" />
        Select both Pickup and Destination above to calculate real driving distance & ETA.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Route Addresses Review */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
            A
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pickup Point
            </span>
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {pickup ? pickup.formattedAddress : 'Awaiting pickup location selection...'}
            </p>
          </div>
        </div>

        <div className="h-4 border-l-2 border-dashed border-slate-300 dark:border-slate-600 ml-3" />

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
            B
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Drop-off Point
            </span>
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {destination ? destination.formattedAddress : 'Awaiting destination location selection...'}
            </p>
          </div>
        </div>
      </div>

      {/* Real Distance and ETA Metrics */}
      {routeInfo && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-indigo-400/10 dark:bg-indigo-400/10 border border-indigo-300 dark:border-indigo-500/30 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
                Driving Distance
              </span>
              <span className="text-base font-extrabold font-display text-slate-950 dark:text-white">
                {routeInfo.distanceText}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-400/10 dark:bg-emerald-400/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Estimated Time (ETA)
              </span>
              <span className="text-base font-extrabold font-display text-slate-950 dark:text-white">
                {routeInfo.durationText}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
