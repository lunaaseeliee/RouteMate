import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus, AdminMetrics, SystemSettings, Ride, UserReport, SafetyReport } from '../types';
import { getAllRides } from './rideService';
import { getAllReports, updateReportStatus } from './reportService';
import { cleanForFirestore, handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export const USERS_COLLECTION = 'users';
export const SYSTEM_DOC = 'settings';

/**
 * Strictly verifies that the currently authenticated user possesses an authorized admin role and UID.
 * Throws an explicit error if unauthenticated or non-admin.
 */
export async function verifyCurrentUserIsAdmin(): Promise<{ uid: string; email: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Access denied. Authentication required.');
  }

  // Check designated system admin emails
  const isSuperAdminEmail = 
    currentUser.email === 'admin@routemate.com' || 
    currentUser.email === 'rishidubeyji68@gmail.com';

  if (isSuperAdminEmail) {
    return { uid: currentUser.uid, email: currentUser.email || '' };
  }

  // Fetch Firestore user doc by UID to verify role
  try {
    const userDocSnap = await getDoc(doc(db, USERS_COLLECTION, currentUser.uid));
    if (userDocSnap.exists()) {
      const data = userDocSnap.data() as UserProfile;
      if (data.role === 'admin') {
        return { uid: currentUser.uid, email: currentUser.email || '' };
      }
    }
  } catch (err) {
    console.error('Failed to verify admin status from Firestore:', err);
  }

  throw new Error('Access denied. Admin privileges required.');
}

export async function getAllUsers(): Promise<UserProfile[]> {
  await verifyCurrentUserIsAdmin();
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    const users: UserProfile[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data() as UserProfile;
      const resolvedStatus = (data.accountStatus || data.status || 'active') as UserStatus;
      users.push({
        ...data,
        uid: data.uid || docSnap.id,
        name: data.name || data.displayName || 'RouteMate User',
        displayName: data.displayName || data.name || 'RouteMate User',
        email: data.email || '',
        profilePhoto: data.profilePhoto || data.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.uid || docSnap.id}`,
        photoURL: data.photoURL || data.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.uid || docSnap.id}`,
        role: data.role || 'user',
        rating: data.rating ?? 0,
        createdAt: data.createdAt || new Date().toISOString(),
        accountStatus: resolvedStatus,
        status: resolvedStatus,
        isSuspended: resolvedStatus === 'suspended' || data.isSuspended === true
      });
    });
    return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching all users:', error);
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
  }
}

export async function setUserSuspendedStatus(uid: string, suspend: boolean): Promise<void> {
  await verifyCurrentUserIsAdmin();
  const newStatus: UserStatus = suspend ? 'suspended' : 'active';
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), cleanForFirestore({
      accountStatus: newStatus,
      status: newStatus,
      isSuspended: suspend,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
  }
}

export async function toggleUserSuspension(uid: string, currentStatus: UserStatus): Promise<UserStatus> {
  await verifyCurrentUserIsAdmin();
  const newStatus: UserStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), cleanForFirestore({
      accountStatus: newStatus,
      status: newStatus,
      isSuspended: newStatus === 'suspended',
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
  }
  return newStatus;
}

export async function toggleUserRole(uid: string, currentRole: UserRole): Promise<UserRole> {
  await verifyCurrentUserIsAdmin();
  const newRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), cleanForFirestore({
      role: newRole,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
  }
  return newRole;
}

export async function getAllRidesAdmin(): Promise<Ride[]> {
  await verifyCurrentUserIsAdmin();
  return getAllRides();
}

export async function getAllReportsAdmin(): Promise<SafetyReport[]> {
  await verifyCurrentUserIsAdmin();
  return getAllReports();
}

export async function updateReportStatusAdmin(reportId: string, status: SafetyReport['status']): Promise<void> {
  await verifyCurrentUserIsAdmin();
  return updateReportStatus(reportId, status);
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  await verifyCurrentUserIsAdmin();
  const [users, rides, reports] = await Promise.all([
    getAllUsers(),
    getAllRides(),
    getAllReports()
  ]);

  const activeRiders = users.filter(u => !u.isDriver).length;
  const activeDrivers = users.filter(u => u.isDriver).length;
  const suspendedUsers = users.filter(u => u.status === 'suspended' || u.isSuspended).length;

  const activeRides = rides.filter(r => r.status === 'active' || r.status === 'in_progress').length;
  const completedRides = rides.filter(r => r.status === 'completed').length;
  const cancelledRides = rides.filter(r => r.status === 'cancelled').length;
  
  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'under_review').length;
  
  const totalVolumeKm = rides.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
  const totalPlatformGMV = rides.reduce((sum, r) => sum + ((r.pricePerSeat || 0) * (r.passengers?.length || 1)), 0);

  return {
    totalUsers: users.length,
    activeRiders,
    activeDrivers,
    totalRides: rides.length,
    activeRides,
    completedRides,
    cancelledRides,
    totalReports: reports.length,
    pendingReports,
    suspendedUsers,
    totalVolumeKm: Math.round(totalVolumeKm),
    totalPlatformGMV: Math.round(totalPlatformGMV)
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  await verifyCurrentUserIsAdmin();
  try {
    const snap = await getDoc(doc(db, 'system', SYSTEM_DOC));
    if (snap.exists()) {
      return snap.data() as SystemSettings;
    }
  } catch (err) {
    console.warn('Using default system settings:', err);
  }

  // Default system settings
  return {
    platformFeePercentage: 10,
    minimumFare: 3.50,
    maxAllowedSeats: 6,
    supportPhone: '+1 (800) 555-ROUT',
    supportEmail: 'support@routemate.com',
    maintenanceMode: false,
    requirePhoneVerification: true,
  };
}

export async function updateSystemSettings(settings: SystemSettings): Promise<void> {
  await verifyCurrentUserIsAdmin();
  try {
    await setDoc(doc(db, 'system', SYSTEM_DOC), cleanForFirestore(settings), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `system/${SYSTEM_DOC}`);
  }
}


