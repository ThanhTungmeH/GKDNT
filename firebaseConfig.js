import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Thay thế các thông số bên dưới bằng cấu hình từ Firebase Console của bạn:
// 1. Vào https://console.firebase.google.com/
// 2. Tạo một Project mới
// 3. Thêm Web App (biểu tượng </>) -> Copy đoạn firebaseConfig dán vào đây
const firebaseConfig = {
  apiKey: "AIzaSyBL1B5DHmQZE7gUisMG-XnJtSuGaVaYmdo",
  authDomain: "gkdnt-628d8.firebaseapp.com",
  projectId: "gkdnt-628d8",
  storageBucket: "gkdnt-628d8.firebasestorage.app",
  messagingSenderId: "107100396918",
  appId: "1:107100396918:web:e6549b114472f55ce72e57",
  measurementId: "G-VZL1K880XV"
};
// Khởi tạo Firebase App (tránh khởi tạo lặp lại khi fast refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };

