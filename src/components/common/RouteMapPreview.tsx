import React from 'react';
import { MapPin, Navigation, Car, Shield, Clock, Compass } from 'lucide-react';
import { LocationPoint } from '../../types';

interface RouteMapPreviewProps {
  pickup: LocationPoint;
  destination: LocationPoint;
  distanceKm?: number;
  durationMinutes?: number;
  interactive?: boolean;
}

export const RouteMapPreview: React.FC<RouteMapPreviewProps> = ({
  pickup,
  destination,
  distanceKm = 18.5,
  durationMinutes = 25,
}) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 text-white shadow-xl">
      {/* Visual Map Canvas Representation with Grid and Roads */}
      <div className="relative h-48 sm:h-56 w-full bg-[#121820] overflow-hidden">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(250, 204, 21, 0.4) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Vector Road Lines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6256f5" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Background arterial roads */}
          <path d="M-20,120 Q120,40 300,100 T600,60" fill="none" stroke="#27272a" strokeWidth="6" />
          <path d="M50,220 Q200,160 400,190 T800,120" fill="none" stroke="#27272a" strokeWidth="5" />
          <path d="M180,-20 Q160,100 220,240" fill="none" stroke="#27272a" strokeWidth="4" />

          {/* The Route Path */}
          <path
            d="M 60,140 C 140,80 260,160 380,90 S 520,130 640,70"
            fill="none"
            stroke="#6256f5"
            strokeWidth="5"
            strokeDasharray="6 4"
            className="animate-pulse"
            filter="url(#glow)"
          />

          {/* Start Pin Indicator */}
          <circle cx="60" cy="140" r="8" fill="#6256f5" />
          <circle cx="60" cy="140" r="16" fill="rgba(250, 204, 21, 0.2)" className="animate-ping" />

          {/* Destination Pin Indicator */}
          <circle cx="380" cy="90" r="8" fill="#FFFFFF" />
          <circle cx="380" cy="90" r="14" fill="rgba(255, 255, 255, 0.2)" />
        </svg>

        {/* Live Traffic Badge */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-400/30 flex items-center gap-2 text-xs font-semibold text-indigo-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-600 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          Live Route Corridor
        </div>

        {/* Route Stats Pill */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-indigo-400 font-bold">
            <Navigation className="w-3.5 h-3.5" />
            <span>{distanceKm} km</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1 text-slate-300 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>~{durationMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Origin & Destination Labels */}
      <div className="p-4 bg-slate-900 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-400/20" />
            <div className="w-0.5 h-6 bg-slate-700 my-0.5" />
            <div className="w-3 h-3 rounded-full bg-white ring-4 ring-white/20" />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">Pickup Location</p>
              <p className="text-sm font-semibold text-white truncate">
                {pickup.address || pickup.city || 'Select Pickup Location'}
              </p>
              {pickup.city && <p className="text-xs text-slate-400">{pickup.city}</p>}
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Destination</p>
              <p className="text-sm font-semibold text-white truncate">
                {destination.address || destination.city || 'Select Destination'}
              </p>
              {destination.city && <p className="text-xs text-slate-400">{destination.city}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
