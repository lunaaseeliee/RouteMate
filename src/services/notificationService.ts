import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NotificationItem, NotificationType } from '../types';
import { cleanForFirestore, handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export const NOTIFICATIONS_COLLECTION = 'notifications';

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  rideId?: string;
}): Promise<NotificationItem> {
  const notifRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
  const newNotif: NotificationItem = cleanForFirestore({
    id: notifRef.id,
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
    read: false,
    rideId: data.rideId || '',
    createdAt: new Date().toISOString(),
  });

  try {
    await setDoc(notifRef, newNotif);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${NOTIFICATIONS_COLLECTION}/${notifRef.id}`);
  }
  return newNotif;
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  try {
    const notifsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notifsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const list: NotificationItem[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as NotificationItem);
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notifId), {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const list = await getUserNotifications(userId);
    const unread = list.filter(n => !n.read);
    const batch = writeBatch(db);
    unread.forEach(item => {
      const ref = doc(db, NOTIFICATIONS_COLLECTION, item.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}
