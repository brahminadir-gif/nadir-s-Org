import { db, requestNotificationPermission, onMessageListener } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, arrayUnion, doc } from 'firebase/firestore';
import { toast } from 'sonner';

export const registerToken = async (userId: string) => {
  const token = await requestNotificationPermission();
  if (token) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token)
    });
    return token;
  }
  return null;
};

export const sendNotification = async (userId: string, title: string, body: string, type: string) => {
  try {
    // 1. Record in Firestore for history
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      body,
      type,
      createdAt: serverTimestamp(),
      isRead: false
    });

    // 2. Trigger FCM via backend route
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body })
    });

    if (!response.ok) {
      console.error('Failed to send FCM notification');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const notifyRole = async (role: string, title: string, body: string, type: string) => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    
    const promises = querySnapshot.docs.map(doc => 
      sendNotification(doc.id, title, body, type)
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying role:', error);
  }
};

export const setupForegroundNotifications = () => {
  onMessageListener()
    .then((payload: any) => {
      toast.info(`${payload.notification.title}: ${payload.notification.body}`);
    })
    .catch((err) => console.log('failed: ', err));
};
