# MẪU BÁO CÁO GIỮA KỲ: LẬP TRÌNH ĐA NỀN TẢNG
## ĐỀ TÀI: XÂY DỰNG ỨNG DỤNG CRUD VỚI REACT NATIVE, EXPO VÀ FIREBASE CLOUD FIRESTORE

---

### THÔNG TIN CHUNG
- **Trường:** Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU) - Đại học Đà Nẵng
- **Học phần:** Lập trình đa nền tảng
- **Học kỳ:** I - Năm học 2026 - 2027
- **Sinh viên thực hiện:** [Họ và tên của bạn]
- **Mã sinh viên:** [Ví dụ: 23ITExxx]
- **Lớp sinh hoạt:** [Ví dụ: 23ITE...]
- **Giảng viên hướng dẫn:** [Tên Thầy/Cô bộ môn]
- **Link GitHub Source Code:** `https://github.com/[tai-khoan]/[ten-repo]` *(Source code tạo tháng 11/2026)*
- **Link Video Demo:** `[Link Google Drive hoặc YouTube không công khai]`

---

## MỤC LỤC BÁO CÁO (Dành cho bản Word)
1. **LỜI MỞ ĐẦU & TỔNG QUAN ĐỀ TÀI**
2. **CÔNG NGHỆ VÀ MÔI TRƯỜNG PHÁT TRIỂN**
   - 2.1. Framework React Native & Expo SDK 58
   - 2.2. Cơ sở dữ liệu Firebase Cloud Firestore
3. **CÁC BƯỚC CÀI ĐẶT VÀ CẤU HÌNH DỰ ÁN (CÓ ẢNH CHỤP MINH HỌA)**
   - 3.1. Khởi tạo dự án Expo React Native
   - 3.2. Cài đặt các thư viện phụ thuộc (Firebase, Vector Icons, Web Support)
   - 3.3. Tạo Project và Cloud Firestore trên Firebase Console
   - 3.4. Cấu hình kết nối Firebase vào mã nguồn
4. **THIẾT KẾ CƠ SỞ DỮ LIỆU & KIẾN TRÚC ỨNG DỤNG**
   - 4.1. Cấu trúc Database (Theo đề thi chính thức được nhận trước 2 ngày)
   - 4.2. Cấu trúc thư mục và các thành phần chính
5. **KẾT QUẢ THỰC NGHIỆM VÀ DEMO CÁC CHỨC NĂNG CRUD**
   - 5.1. Chức năng Đọc dữ liệu (Read) & Hiển thị danh sách Realtime
   - 5.2. Chức năng Thêm mới bản ghi (Create)
   - 5.3. Chức năng Cập nhật bản ghi (Update)
   - 5.4. Chức năng Xóa bản ghi (Delete)
   - 5.5. Chức năng Tìm kiếm / Lọc dữ liệu (Search)
6. **KỊCH BẢN QUAY VIDEO DEMO**
7. **KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN**

---

## NỘI DUNG CHI TIẾT BÁO CÁO

### PHẦN 1: TỔNG QUAN ĐỀ TÀI
- **Mục tiêu:** Xây dựng ứng dụng di động đa nền tảng có khả năng thực hiện đầy đủ các thao tác Thêm, Đọc, Sửa, Xóa (CRUD) với cơ sở dữ liệu đám mây thời gian thực (Cloud Firestore), hỗ trợ chạy trên cả Android, iOS và Web.
- **Tính năng chính:**
  - Kết nối cơ sở dữ liệu đám mây Firebase Cloud Firestore.
  - Tự động đồng bộ thời gian thực (Real-time synchronization).
  - Tìm kiếm và lọc dữ liệu nhanh chóng.
  - Giao diện thân thiện, chuẩn Material Design và tương thích đa kích thước màn hình.

---

### PHẦN 2: CÔNG NGHỆ SỬ DỤNG
1. **React Native (v0.88) & Expo SDK 58:**
   - Hỗ trợ xây dựng giao diện bằng JavaScript/React.
   - Biên dịch và chạy trực tiếp trên thiết bị thông qua ứng dụng Expo Go mà không cần cấu hình phức tạp Android Studio hay Xcode.
2. **Firebase Cloud Firestore (Firebase SDK v13):**
   - Cơ sở dữ liệu NoSQL dạng tài liệu (Document-oriented).
   - Cơ chế lắng nghe sự kiện thời gian thực (`onSnapshot`) giúp giao diện tự động cập nhật ngay khi cơ sở dữ liệu có thay đổi mà không cần tải lại trang.

---

### PHẦN 3: CÁC BƯỚC TRIỂN KHAI VÀ ẢNH CHỤP MINH HỌA
*(Gợi ý: Khi làm báo cáo Word, bạn chụp màn hình các bước sau và dán vào tương ứng)*

#### 3.1. Khởi tạo dự án
- Lệnh thực thi:
  ```bash
  npx create-expo-app@latest . --template blank --yes
  ```
- *[CHÈN ẢNH CHỤP 1: Màn hình Terminal khởi tạo thành công Expo SDK 58]*

#### 3.2. Cài đặt Firebase và các thư viện cần thiết
- Lệnh thực thi:
  ```bash
  npx expo install firebase @react-native-async-storage/async-storage react-dom react-native-web @expo/vector-icons
  ```
- *[CHÈN ẢNH CHỤP 2: File package.json hiển thị danh sách các thư viện đã cài]*

#### 3.3. Thiết lập Firebase Console & Cloud Firestore
- Bước 1: Tạo dự án mới trên Firebase Console (`https://console.firebase.google.com/`).
  - *[CHÈN ẢNH CHỤP 3: Màn hình tạo Project trên Firebase Console]*
- Bước 2: Tạo Firestore Database ở chế độ **Test Mode** (Quy tắc cho phép đọc/ghi).
  - *[CHÈN ẢNH CHỤP 4: Màn hình tạo Firestore Database và chọn vị trí server]*
- Bước 3: Đăng ký Web App và lấy đoạn cấu hình `firebaseConfig`.
  - *[CHÈN ẢNH CHỤP 5: Màn hình chứa thông tin API Key, Project ID]*
- Bước 4: Dán cấu hình vào file `firebaseConfig.js` trong dự án.
  - *[CHÈN ẢNH CHỤP 6: Đoạn code trong file firebaseConfig.js]*

---

### PHẦN 4: THIẾT KẾ CƠ SỞ DỮ LIỆU
*(Mục này bạn điền chính xác theo đề thi nhận trước 2 ngày)*

**Ví dụ nếu đề thi yêu cầu quản lý Sinh Viên:**
- Bảng/Collection: `students`
- Các trường (Fields):
  - `id`: Mã tự sinh của Firestore (String)
  - `studentId`: Mã số sinh viên (String, ví dụ: 23ITExxx)
  - `fullName`: Họ và tên sinh viên (String)
  - `class`: Lớp sinh hoạt (String)
  - `gpa`: Điểm trung bình tích lũy (Number)
  - `createdAt`: Thời gian tạo bản ghi (Timestamp)

**Ví dụ nếu đề thi yêu cầu quản lý Sản Phẩm:**
- Bảng/Collection: `products`
- Các trường (Fields): `id`, `name`, `price`, `category`, `quantity`, `createdAt`.

---

### PHẦN 5: KẾT QUẢ THỰC NGHIỆM VÀ DEMO CÁC CHỨC NĂNG CRUD
*(Chụp màn hình ứng dụng đang chạy song song với bảng dữ liệu Firestore)*

1. **Giao diện Danh sách (READ):**
   - *[CHÈN ẢNH CHỤP 7: Màn hình hiển thị danh sách bản ghi kèm thanh tìm kiếm]*
2. **Chức năng Thêm mới (CREATE):**
   - *[CHÈN ẢNH CHỤP 8: Modal nhập thông tin thêm mới bản ghi]*
   - *[CHÈN ẢNH CHỤP 9: Dữ liệu mới xuất hiện ngay trên Firestore Console]*
3. **Chức năng Cập nhật (UPDATE):**
   - *[CHÈN ẢNH CHỤP 10: Modal hiển thị dữ liệu cũ và thực hiện sửa]*
   - *[CHÈN ẢNH CHỤP 11: Dữ liệu trên ứng dụng và Firestore đã được cập nhật]*
4. **Chức năng Xóa (DELETE):**
   - *[CHÈN ẢNH CHỤP 12: Hộp thoại thông báo xác nhận xóa]*
   - *[CHÈN ẢNH CHỤP 13: Bản ghi bị xóa khỏi danh sách và Firestore]*
5. **Chức năng Tìm kiếm (SEARCH):**
   - *[CHÈN ẢNH CHỤP 14: Nhập từ khóa vào ô tìm kiếm và danh sách được lọc ngay]*

---

### PHẦN 6: KỊCH BẢN QUAY VIDEO DEMO (ĐỘ DÀI: 2 - 3 PHÚT)
1. **0:00 - 0:20 (Giới thiệu):**
   - Giới thiệu bản thân (Họ tên, MSSV, Lớp), môn học và đề tài thi giữa kỳ.
   - Nêu ngắn gọn công nghệ sử dụng: React Native, Expo, Firebase Cloud Firestore.
2. **0:20 - 0:50 (Mở song song 2 màn hình):**
   - Một bên là cửa sổ ứng dụng (chạy trên Web hoặc phản chiếu điện thoại qua Expo Go).
   - Một bên là giao diện Firebase Firestore Console.
3. **0:50 - 1:30 (Demo CREATE & READ Realtime):**
   - Bấm nút `+` để thêm mới một bản ghi.
   - Điền thông tin -> Bấm Lưu.
   - Chỉ cho người xem thấy: Bản ghi xuất hiện ngay lập tức trên app và trên Firestore Console mà không cần tải lại trang.
4. **1:30 - 2:00 (Demo UPDATE & DELETE):**
   - Bấm nút "Sửa" một bản ghi bất kỳ, thay đổi một trường thông tin -> Bấm Lưu -> Kiểm tra thay đổi.
   - Bấm nút "Xóa" một bản ghi -> Xác nhận xóa -> Bản ghi biến mất trên cả app và Firestore.
5. **2:00 - 2:30 (Demo SEARCH & Kết thúc):**
   - Gõ từ khóa vào thanh tìm kiếm để lọc danh sách.
   - Mở màn hình GitHub cá nhân cho thấy repository được tạo trong tháng 11/2026 với các commit rõ ràng.
   - Lời cảm ơn Thầy/Cô.

---

### PHẦN 7: KẾT LUẬN
- Đã hoàn thành 100% các yêu cầu của đề tài: xây dựng ứng dụng CRUD hoàn chỉnh, kết nối cơ sở dữ liệu thời gian thực Firebase Firestore, tương thích đa nền tảng, có đầy đủ báo cáo, video demo và link GitHub đạt chuẩn.
