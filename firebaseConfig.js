import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Thay thế các thông số bên dưới bằng cấu hình từ Firebase Console của bạn:
// 1. Vào https://console.firebase.google.com/
// 2. Tạo một Project mới
// 3. Thêm Web App (biểu tượng </>) -> Copy đoạn firebaseConfig dán vào đây
const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Khởi tạo Firebase App (tránh khởi tạo lặp lại khi fast refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
