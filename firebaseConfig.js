import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Thông số cấu hình Firebase của dự án


// Khởi tạo Firebase App (tránh khởi tạo lặp lại khi fast refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Khởi tạo Firestore với long-polling để tránh lỗi WebChannel AbortError trên Web
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (_err) {
  db = getFirestore(app);
}

// Khởi tạo Firebase Auth với persistence hỗ trợ React Native & Web
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (_error) {
    auth = getAuth(app);
  }
}

export { app, db, auth };
