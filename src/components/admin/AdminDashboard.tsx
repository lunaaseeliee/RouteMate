import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Car, 
  CheckCheck, 
  AlertTriangle, 
  UserX, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  Ban, 
  Check, 
  ExternalLink,
  DollarSign,
  Clock,
  MapPin,
  Compass,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getAdminMetrics, 
  getAllUsers, 
  getAllRidesAdmin, 
  getAllReportsAdmin, 
  setUserSuspendedStatus, 
  updateReportStatusAdmin 
} from '../../services/adminService';
import { UserProfile, Ride, SafetyReport, AdminMetrics } from '../../types';
import { EmptyState } from '../common/EmptyState';

type AdminTab = 'overview' | 'users' | 'active-rides' | 'completed-rides' | 'reports' | 'suspended';

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExitAdmin }) => {
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [ridesList, setRidesList] = useState<Ride[]>([]);
  const [reportsList, setReportsList] = useState<SafetyReport[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!user || !isAdmin) {
      setAuthError('Access denied. Admin privileges required.');
      setLoading(false);
      onExitAdmin();
      return;
    }
    setLoading(true);
    try {
      const [m, u, r, rep] = await Promise.all([
        getAdminMetrics(),
        getAllUsers(),
        getAllRidesAdmin(),
        getAllReportsAdmin()
      ]);
      setMetrics(m);
      setUsersList(u);
      setRidesList(r);
      setReportsList(rep);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setAuthError(err?.message || 'Access denied. Admin privileges required.');
      onExitAdmin();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      onExitAdmin();
    } else {
      fetchAdminData();
    }
  }, [isAdmin, user]);

  const handleToggleSuspendUser = async (targetUid: string, currentSuspended: boolean) => {
    setActionLoading(`suspend-${targetUid}`);
    try {
      await setUserSuspendedStatus(targetUid, !currentSuspended);
      await fetchAdminData();
    } catch (err) {
      console.error('Error updating user suspension:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: SafetyReport['status']) => {
    setActionLoading(`report-${reportId}`);
    try {
      await updateReportStatusAdmin(reportId, status);
      await fetchAdminData();
    } catch (err) {
      console.error('Error updating report status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const activeRides = ridesList.filter(r => r.status === 'active' || r.status === 'in_progress');
  const completedRides = ridesList.filter(r => r.status === 'completed');
  const suspendedUsers = usersList.filter(u => u.isSuspended);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-400/20 text-indigo-400 font-bold text-xs mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            ROUTEMATE OPERATIONS
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
            Admin workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Your community at a glance. Manage travellers, journeys, and safety reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onExitAdmin}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Return to User App
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp, count: null },
          { id: 'users', label: 'Users', icon: Users, count: usersList.length },
          { id: 'active-rides', label: 'Active rides', icon: Car, count: activeRides.length },
          { id: 'completed-rides', label: 'Completed', icon: CheckCheck, count: completedRides.length },
          { id: 'reports', label: 'Reports', icon: AlertTriangle, count: reportsList.filter(r => r.status === 'pending').length },
          { id: 'suspended', label: 'Suspended', icon: UserX, count: suspendedUsers.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-slate-950 text-indigo-400' : 'bg-indigo-400/20 text-indigo-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Bento Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { title: 'Total Users', value: metrics?.totalUsers || usersList.length, icon: Users, color: 'text-indigo-500' },
              { title: 'Active Rides', value: metrics?.activeRides || activeRides.length, icon: Car, color: 'text-indigo-500' },
              { title: 'Completed', value: metrics?.completedRides || completedRides.length, icon: CheckCheck, color: 'text-emerald-500' },
              { title: 'Open Reports', value: metrics?.pendingReports || reportsList.filter(r => r.status === 'pending').length, icon: AlertTriangle, color: 'text-red-500' },
              { title: 'Suspended', value: metrics?.suspendedUsers || suspendedUsers.length, icon: UserX, color: 'text-rose-500' },
              { title: 'Est. Platform GMV', value: `$${metrics?.totalPlatformGMV || 0}`, icon: DollarSign, color: 'text-indigo-500' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <p className="text-[11px] font-bold uppercase tracking-wider">{stat.title}</p>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-extrabold font-display text-slate-950 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick Operations Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Safety Reports */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display text-slate-950 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Urgent Safety Queue
                </h3>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-xs font-bold text-indigo-500 hover:underline"
                >
                  View All ({reportsList.length})
                </button>
              </div>

              {reportsList.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Safety queue clear! No pending incident reports.</p>
              ) : (
                <div className="space-y-3">
                  {reportsList.filter(r => r.status === 'pending').slice(0, 3).map(rep => (
                    <div key={rep.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Target: {rep.reportedUserName} ({rep.reason.replace('_', ' ')})
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{rep.description}</p>
                      </div>
                      <button
                        onClick={() => handleUpdateReportStatus(rep.id, 'resolved')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shrink-0"
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Live Routes Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display text-slate-950 dark:text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-400" />
                  Live Corridors In Transit
                </h3>
                <button
                  onClick={() => setActiveTab('active-rides')}
                  className="text-xs font-bold text-indigo-500 hover:underline"
                >
                  View All ({activeRides.length})
                </button>
              </div>

              {activeRides.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No active trips currently in transit.</p>
              ) : (
                <div className="space-y-3">
                  {activeRides.slice(0, 3).map(ride => (
                    <div key={ride.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {ride.pickup.city} ➔ {ride.destination.city}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Driver: {ride.creatorName} • ${ride.pricePerSeat}/seat • {ride.availableSeats} open
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                        {ride.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold font-display text-slate-950 dark:text-white">
                Platform Registered Users ({usersList.length})
              </h2>
              <p className="text-xs text-slate-500">Review traveller accounts and manage access.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user name or UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">User Profile</th>
                  <th className="py-3 px-3">Firebase UID</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Trips Created/Joined</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {usersList
                  .filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || u.uid.includes(searchQuery))
                  .map((usr) => (
                    <tr key={usr.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={usr.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${usr.uid}`}
                            alt={usr.displayName}
                            className="w-8 h-8 rounded-xl bg-indigo-400/20 object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{usr.displayName}</p>
                            <p className="text-[10px] text-slate-400">{usr.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {usr.uid.slice(0, 12)}...
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                          usr.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {usr.role}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-medium">
                        {usr.totalRidesCreated || 0} offered / {usr.totalRidesJoined || 0} joined
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          usr.isSuspended ? 'bg-red-500/15 text-red-600' : 'bg-emerald-500/15 text-emerald-600'
                        }`}>
                          {usr.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleToggleSuspendUser(usr.uid, usr.isSuspended)}
                          disabled={actionLoading === `suspend-${usr.uid}`}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                            usr.isSuspended
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              : 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600'
                          }`}
                        >
                          {usr.isSuspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE RIDES */}
      {activeTab === 'active-rides' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-lg font-bold font-display text-slate-950 dark:text-white">
            Active & Upcoming Corridor Journeys ({activeRides.length})
          </h2>

          {activeRides.length === 0 ? (
            <EmptyState
              title="No active rides currently."
              description="When drivers publish new trips, they will appear in this active moderation queue."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRides.map((ride) => (
                <div key={ride.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {ride.pickup.city} ➔ {ride.destination.city}
                      </p>
                      <p className="text-[11px] text-slate-400">Driver: {ride.creatorName} ({ride.creatorId.slice(0, 8)})</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-extrabold">
                      ${ride.pricePerSeat}/seat
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <p>Pickup: {ride.pickup.address}</p>
                    <p>Destination: {ride.destination.address}</p>
                    <p>Departure: {new Date(ride.departureTime).toLocaleString()}</p>
                    <p>Capacity: {ride.availableSeats} of {ride.totalSeats} seats open ({ride.passengers.length} passenger requests)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMPLETED RIDES */}
      {activeTab === 'completed-rides' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-lg font-bold font-display text-slate-950 dark:text-white">
            Completed Trips Archive ({completedRides.length})
          </h2>

          {completedRides.length === 0 ? (
            <EmptyState
              title="No completed rides archive yet."
              description="Completed route records will be securely logged here for auditing and platform reconciliation."
            />
          ) : (
            <div className="space-y-3">
              {completedRides.map(ride => (
                <div key={ride.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{ride.pickup.city} to {ride.destination.city}</p>
                    <p className="text-[11px] text-slate-400">Driver: {ride.creatorName} • Finished on {new Date(ride.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-lg font-bold font-display text-slate-950 dark:text-white">
            Safety & Incident Reports Moderation ({reportsList.length})
          </h2>

          {reportsList.length === 0 ? (
            <EmptyState
              title="No safety reports logged."
              description="The community is operating safely with no pending reports."
            />
          ) : (
            <div className="space-y-4">
              {reportsList.map(rep => (
                <div key={rep.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-lg bg-red-500/15 text-red-600 font-bold text-[10px] uppercase tracking-wider">
                        {rep.reason.replace('_', ' ')}
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        Reported Target: {rep.reportedUserName} ({rep.reportedUserId})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateReportStatus(rep.id, 'investigating')}
                        className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                      >
                        Investigate
                      </button>

                      <button
                        onClick={() => handleUpdateReportStatus(rep.id, 'resolved')}
                        className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
                      >
                        Resolve
                      </button>

                      <button
                        onClick={() => handleToggleSuspendUser(rep.reportedUserId, false)}
                        className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                      >
                        Ban User
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    "{rep.description}"
                  </p>

                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Filed by: {rep.reporterName}</span>
                    <span>Status: <strong className="uppercase text-indigo-500">{rep.status}</strong></span>
                    <span>Date: {new Date(rep.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SUSPENDED USERS */}
      {activeTab === 'suspended' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-lg font-bold font-display text-slate-950 dark:text-white">
            Suspended Accounts ({suspendedUsers.length})
          </h2>

          {suspendedUsers.length === 0 ? (
            <EmptyState
              title="No suspended accounts."
              description="No user accounts are currently restricted or suspended."
            />
          ) : (
            <div className="space-y-3">
              {suspendedUsers.map(usr => (
                <div key={usr.uid} className="p-4 rounded-2xl bg-red-500/5 dark:bg-red-950/20 border border-red-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{usr.displayName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">UID: {usr.uid} • {usr.email}</p>
                  </div>

                  <button
                    onClick={() => handleToggleSuspendUser(usr.uid, true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
                  >
                    Unsuspend Account
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
