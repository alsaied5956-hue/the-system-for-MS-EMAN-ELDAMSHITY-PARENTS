import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

const firebaseConfig = {
  databaseURL: "https://eman-system1-default-rtdb.firebaseio.com/"
};

// Initialize Firebase Realtime Database
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
export const systemDataRef = ref(db, 'center_data');
export { onValue, set, ref };
