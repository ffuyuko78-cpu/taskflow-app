import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDKVa0mMMQdpY3G9oIxiWm4gzN6xdFayjk",
  authDomain: "taskflow-601ef.firebaseapp.com",
  projectId: "taskflow-601ef",
  storageBucket: "taskflow-601ef.firebasestorage.app",
  messagingSenderId: "632634210608",
  appId: "1:632634210608:web:49149e80486475ca40f0f5",
  measurementId: "G-56SL3TTC6R"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Google Calendar 連携用プロバイダー（カレンダー読み取りスコープ付き）
export const googleCalendarProvider = new GoogleAuthProvider();
googleCalendarProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
