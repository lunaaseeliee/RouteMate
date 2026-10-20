import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Car, 
  Users, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../../services/notificationService';
import { NotificationItem } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface NotificationsViewProps {
  onNavigate: (view: string, data?: any) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getUserNotifications(user.uid);
      setNotifications(list);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Real-time updates regarding your route requests and journeys.
          </p>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet."
          description="When drivers accept your requests or other RouteMates join your trip, you will be notified here."
          icon={<Bell className="w-8 h-8 text-indigo-500" />}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={`p-5 rounded-3xl border transition-all ${
                  notif.read
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                    : 'bg-indigo-500/5 dark:bg-slate-800/80 border-indigo-400/50 shadow-md ring-1 ring-indigo-400/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      notif.type === 'ride_accepted'
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : notif.type === 'ride_request'
                          ? 'bg-indigo-400/20 text-indigo-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}>
                      {notif.type === 'ride_accepted' ? <CheckCircle2 className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                        <span>{notif.title}</span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {notif.rideId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                        onNavigate('my-rides');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1"
                    >
                      <span>View Trip</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
