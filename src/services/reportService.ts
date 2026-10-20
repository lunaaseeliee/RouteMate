import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserReport, ReportReason, ReportStatus, UserProfile } from '../types';
import { cleanForFirestore, handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export const REPORTS_COLLECTION = 'reports';

export async function submitReport(
  reporter: UserProfile,
  reportedUserId: string,
  reportedUserName: string,
  reason: ReportReason,
  description: string,
  rideId?: string
): Promise<UserReport> {
  const reportRef = doc(collection(db, REPORTS_COLLECTION));
  const newReport: UserReport = cleanForFirestore({
    id: reportRef.id,
    reporterId: reporter.uid,
    reporterName: reporter.displayName || 'RouteMate User',
    reporterEmail: reporter.email || '',
    reportedUserId,
    reportedUserName,
    rideId: rideId || '',
    reason,
    description,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  try {
    await setDoc(reportRef, newReport);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${REPORTS_COLLECTION}/${reportRef.id}`);
  }
  return newReport;
}

export async function createReport(
  reporterUid: string,
  reporterDisplayName: string,
  reportedUserId: string,
  reportedUserName: string,
  rideId: string | undefined,
  reason: ReportReason,
  description: string
): Promise<UserReport> {
  const reportRef = doc(collection(db, REPORTS_COLLECTION));
  const newReport: UserReport = cleanForFirestore({
    id: reportRef.id,
    reporterId: reporterUid,
    reporterName: reporterDisplayName,
    reportedUserId,
    reportedUserName,
    rideId: rideId || '',
    reason,
    description,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  try {
    await setDoc(reportRef, newReport);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${REPORTS_COLLECTION}/${reportRef.id}`);
  }
  return newReport;
}

export async function getAllReports(): Promise<UserReport[]> {
  try {
    const snap = await getDocs(collection(db, REPORTS_COLLECTION));
    const list: UserReport[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as UserReport);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

export async function updateReportStatus(
  reportId: string, 
  status: ReportStatus, 
  adminNotes?: string,
  resolvedBy?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, REPORTS_COLLECTION, reportId), cleanForFirestore({
      status,
      adminNotes: adminNotes || '',
      resolvedBy: resolvedBy || 'Admin',
      resolvedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${reportId}`);
  }
}
