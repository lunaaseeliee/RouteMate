import React from 'react';
import { LayoutDashboard, Search, Plus, Car, History, Bell, User, Settings, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar({ currentView, onNavigate }: { currentView: string; onNavigate: (view: string) => void }) {
  const { isAdmin } = useAuth();
  const links = [
    { view: 'home', name: 'Overview', icon: LayoutDashboard },
    { view: 'find-routemate', name: 'Find a ride', icon: Search },
    { view: 'post-ride', name: 'Offer a ride', icon: Plus },
    { view: 'my-rides', name: 'My rides', icon: Car },
    { view: 'ride-history', name: 'Ride history', icon: History },
    { view: 'notifications', name: 'Notifications', icon: Bell },
  ];
  const account = [{ view: 'profile', name: 'My profile', icon: User }, { view: 'settings', name: 'Settings', icon: Settings }, ...(isAdmin ? [{ view: 'admin-dashboard', name: 'Admin workspace', icon: ShieldCheck }] : [])];
  const isActive = (view: string) => currentView === view || (view === 'find-routemate' && ['pickup-location', 'destination-location', 'ride-request'].includes(currentView));
  return <aside className="rm-sidebar"><p className="sidebar-label">YOUR WORKSPACE</p><nav aria-label="Journey navigation">{links.map(link => <button key={link.view} className={isActive(link.view) ? 'active' : ''} aria-current={isActive(link.view) ? 'page' : undefined} onClick={() => onNavigate(link.view)}><link.icon size={18}/>{link.name}{isActive(link.view) && <span/>}</button>)}</nav><p className="sidebar-label sidebar-account">YOUR ACCOUNT</p><nav aria-label="Account navigation">{account.map(link => <button key={link.view} className={isActive(link.view) ? 'active' : ''} aria-current={isActive(link.view) ? 'page' : undefined} onClick={() => onNavigate(link.view)}><link.icon size={18}/>{link.name}</button>)}</nav><div className="sidebar-tip"><span>GOING THE SAME WAY?</span><h3>Make room for<br/>a RouteMate.</h3><p>A spare seat can make someone’s day.</p><button onClick={() => onNavigate('post-ride')}>Share your route <ArrowUpRight size={15}/></button></div></aside>;
}
