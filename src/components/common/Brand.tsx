import React from 'react';

/** Displays the supplied logo artwork at its original proportions. */
export function Brand({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return <span className={`rm-brand ${className}`}>
    <span className="rm-brand-symbol" aria-hidden="true"><img src="/routemate-logo-original.png" alt="" /></span>
    {!compact && <span className="rm-brand-name">RouteMate<span className="rm-brand-tagline">GOOD COMPANY. BETTER JOURNEYS.</span></span>}
    {compact && <span className="sr-only">RouteMate</span>}
  </span>;
}
