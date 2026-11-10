# DỰ ÁN GIỮA KỲ: ỨNG DỤNG CRUD ĐA NỀN TẢNG (REACT NATIVE + EXPO + FIREBASE)

> **Thông tin đề tài:** Xây dựng ứng dụng CRUD cơ sở dữ liệu trên React Native & Expo, cơ sở dữ liệu Firebase Cloud Firestore.  
> **Thời gian tạo:** Tháng 11/2026.

---

## 🚀 1. Các công nghệ và thư viện đã cài đặt

- **Framework:** React Native (v0.88), Expo SDK 58 (Blank Template - JavaScript).
- **Cơ sở dữ liệu:** Firebase Cloud Firestore (SDK `firebase` v13.x).
- **Lưu trữ cục bộ:** `@react-native-async-storage/async-storage`.
- **Giao diện & Icon:** `@expo/vector-icons` (Ionicons).
- **Hỗ trợ đa nền tảng:** Chạy mượt mà trên **Android, iOS (qua app Expo Go)** và **Web (Chrome/Edge)**.

---

## 🛠️ 2. Hướng dẫn kết nối Firebase (Bước quan trọng để chụp ảnh báo cáo)

### Bước 2.1: Tạo Project trên Firebase Console
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Bấm **"Add project"** (Thêm dự án) -> Đặt tên dự án (ví dụ: `GKdanentang-2026`) -> Nhấn **Continue**.
3. Tắt Google Analytics (để tạo nhanh) -> Nhấn **Create project**. *(Chụp ảnh màn hình bước này đưa vào báo cáo)*.

### Bước 2.2: Tạo Cloud Firestore Database
1. Trong thanh menu bên trái, chọn **Build** -> **Firestore Database** -> Bấm **Create database**.
2. Chọn vị trí lưu trữ (ví dụ: `asia-southeast1` hoặc mặc định) -> Bấm **Next**.
3. **Quy tắc bảo mật (Security Rules):** Chọn **Start in test mode** (Bắt đầu ở chế độ thử nghiệm) để cho phép đọc/ghi dữ liệu trong 30 ngày -> Nhấn **Create**. *(Chụp ảnh màn hình bước này đưa vào báo cáo)*.

### Bước 2.3: Lấy thông tin cấu hình Web App
1. Tại trang **Project Overview** (Tổng quan dự án), nhấn vào biểu tượng **Web `</>`**.
2. Đặt tên App (ví dụ: `GKdanentang-Web`) -> Bấm **Register app**.
3. Cuộn xuống phần `firebaseConfig`, sao chép đoạn cấu hình có dạng:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "gkdanentang-xxx.firebaseapp.com",
     projectId: "gkdanentang-xxx",
     storageBucket: "gkdanentang-xxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
4. Mở file [firebaseConfig.js](file:///d:/GKdanentang/firebaseConfig.js) trong dự án và dán đoạn cấu hình trên vào.

---

## 💻 3. Các lệnh chạy ứng dụng

### Chạy trên Trình duyệt Web (Nhanh nhất, tiện chụp ảnh đưa vào Word):
```bash
npm run web
```
Ứng dụng sẽ tự động mở tại `http://localhost:8081`. Bạn có thể thao tác Thêm, Sửa, Xóa và xem dữ liệu thay đổi trực tiếp.

### Chạy trên Điện thoại thật (Dùng để quay video demo hoặc chụp màn hình điện thoại):
1. Cài app **Expo Go** từ Google Play Store (Android) hoặc App Store (iOS).
2. Chạy lệnh trong terminal:
   ```bash
   npm start
   ```
3. Quét mã QR hiển thị trên màn hình terminal bằng app Expo Go (trên Android) hoặc Camera (trên iPhone) *(Lưu ý: Điện thoại và máy tính cần kết nối cùng một mạng Wi-Fi)*.

---

## 📝 4. Cấu trúc Source Code

- [App.js](file:///d:/GKdanentang/App.js): Chứa toàn bộ giao diện và logic CRUD hoàn chỉnh:
  - **Create (Thêm mới):** Thêm bản ghi mới lên Cloud Firestore (`addDoc`).
  - **Read (Đọc dữ liệu):** Lắng nghe dữ liệu thời gian thực (`onSnapshot`) tự động cập nhật khi có thay đổi.
  - **Update (Sửa):** Mở modal cập nhật thông tin bản ghi (`updateDoc`).
  - **Delete (Xóa):** Hộp thoại xác nhận và xóa bản ghi khỏi Firestore (`deleteDoc`).
  - **Search:** Tìm kiếm nhanh theo tiêu đề và phân loại.
- [firebaseConfig.js](file:///d:/GKdanentang/firebaseConfig.js): Cấu hình kết nối Firebase.

> 💡 **Mẹo khi nhận đề thi (2 ngày trước ngày thi):**  
> Khi giáo viên công bố cấu trúc bảng dữ liệu cụ thể (ví dụ: Sản phẩm gồm `tên, giá, số lượng`, hoặc Sinh viên gồm `mã SV, họ tên, lớp`):  
> Bạn chỉ cần mở file [App.js](file:///d:/GKdanentang/App.js), sửa lại các trường dữ liệu ở phần `useState` và các ô `TextInput` là hoàn thiện ngay trong 5 phút!

---

## 📤 5. Hướng dẫn đẩy lên GitHub (Theo yêu cầu đề thi)

1. Tạo một repository mới trên GitHub cá nhân (đặt tên ví dụ: `GKdanentang_ReactNative`).
2. Liên kết và đẩy code lên:
   ```bash
   git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git
   git branch -M main
   git push -u origin main
   ```
   *(Source code đã được commit từ tháng 11/2026 với tài khoản trường VKU)*.

