import React from 'react';
import { ArrowUpRight, Car, MapPin } from 'lucide-react';

export function JourneyArtwork() {
  return <div className="journey-art" aria-label="Illustration of a shared route">
    <div className="journey-art-heading"><span className="live-dot" /> A little company goes a long way <ArrowUpRight size={18} /></div>
    <svg viewBox="0 0 560 400" className="journey-map" aria-hidden="true">
      <defs><pattern id="blocks" width="100" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><rect x="10" y="10" width="70" height="58" rx="12" fill="#e6eaf3"/><path d="M0 80H100M90 0V90" stroke="#fff" strokeWidth="12"/></pattern></defs>
      <rect width="560" height="400" fill="#f1f3fa"/><rect width="560" height="400" fill="url(#blocks)"/>
      <path d="M430 -30 Q300 130 460 210 T390 440" fill="none" stroke="#d1e4f6" strokeWidth="48"/>
      <path d="M75 305 L190 305 Q225 305 225 270 L225 180 Q225 150 260 150 L385 150 L385 85" fill="none" stroke="white" strokeWidth="18" strokeLinecap="round"/>
      <path d="M75 305 L190 305 Q225 305 225 270 L225 180 Q225 150 260 150 L385 150 L385 85" fill="none" stroke="#6256f5" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="75" cy="305" r="13" fill="#6256f5" stroke="white" strokeWidth="6"/><circle cx="385" cy="85" r="13" fill="#102037" stroke="white" strokeWidth="6"/>
      <circle cx="225" cy="228" r="24" fill="#6256f5" stroke="white" strokeWidth="5"/><path d="m217 236 8-19 8 19-8-5z" fill="white"/>
    </svg>
    <div className="map-label map-label-start"><MapPin size={16}/><div><small>YOUR START</small><strong>Somewhere familiar</strong></div></div>
    <div className="map-label map-label-end"><MapPin size={16}/><div><small>YOUR NEXT STOP</small><strong>Somewhere new</strong></div></div>
    <div className="journey-art-footer"><span className="journey-car"><Car size={24}/></span><div><strong>Same direction. Shared journey.</strong><p>Find your people along the way.</p></div></div>
  </div>;
}
