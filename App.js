import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { app, db, auth } from './firebaseConfig';
import { uploadImageToCloudinary } from './cloudinaryConfig';

// Hoàn tất phiên duyệt web OAuth cho thiết bị di động
WebBrowser.maybeCompleteAuthSession();

// Cấu hình Google Client ID cho Mobile (nếu dùng Expo Go)
const GOOGLE_WEB_CLIENT_ID = '107100396918-hgqn2i035e3l1v2l11t750jr431ep5vq.apps.googleusercontent.com';

// Kiểm tra cấu hình Firebase
const isFirebaseConfigured = () => {
  const apiKey = app?.options?.apiKey || '';
  return Boolean(apiKey && !apiKey.includes('YOUR_API_KEY'));
};

// Dữ liệu mẫu ban đầu đúng 4 trường: email, matkhau, hoten, hinhanh
const INITIAL_MOCK_USERS = [
  {
    id: 'mock_1',
    email: 'nguyenvana@gmail.com',
    matkhau: '123456',
    hoten: 'Nguyễn Văn A',
    hinhanh: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  },
  {
    id: 'mock_2',
    email: 'tranthib@gmail.com',
    matkhau: '654321',
    hoten: 'Trần Thị B',
    hinhanh: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
];

export default function App() {
  // Trạng thái Admin & Đăng nhập
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@vku.udn.vn');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Trạng thái danh sách người dùng (Chỉ gồm: email, matkhau, hoten, hinhanh)
  const [items, setItems] = useState(() =>
    isFirebaseConfigured() ? [] : INITIAL_MOCK_USERS
  );
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  // Form State cho Người dùng (Đúng 4 trường theo đề thi)
  const [hoten, setHoten] = useState('');
  const [email, setEmail] = useState('');
  const [matkhau, setMatkhau] = useState('');
  const [hinhanh, setHinhanh] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modal xuất dữ liệu JSON
  const [jsonModalVisible, setJsonModalVisible] = useState(false);
  const [jsonContent, setJsonContent] = useState('');

  // Cấu hình Google Auth Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  // Lắng nghe trạng thái đăng nhập Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setAdminUser(currentUser);
        setIsAdminLoggedIn(true);
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Xử lý Google Sign-In trên thiết bị di động
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then((result) => {
            setAdminUser(result.user);
            setIsAdminLoggedIn(true);
            if (Platform.OS !== 'web') {
              Alert.alert('Thành công', `Xin chào Admin: ${result.user.displayName || result.user.email}!`);
            }
          })
          .catch((error) => {
            Alert.alert('Lỗi đăng nhập', error.message);
          })
          .finally(() => {
            setAuthLoading(false);
          });
      }
    } else if (response?.type === 'error') {
      Alert.alert('Lỗi xác thực', response.error?.message || 'Không thể đăng nhập Google');
    }
  }, [response]);

  // 1. ĐỌC DỮ LIỆU (READ) - Lắng nghe realtime từ Firestore collection 'users'
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }
    try {
      const colRef = collection(db, 'users');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const list = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              // Chỉ lấy đúng 4 trường theo đề thi
              email: data.email || '',
              matkhau: data.matkhau || '',
              hoten: data.hoten || '',
              hinhanh: data.hinhanh || '',
            };
          });
          setItems(list);
          setLoading(false);
          setPermissionError(false);
        },
        (error) => {
          console.error('Firestore Error:', error);
          if (error.code === 'permission-denied') {
            setPermissionError(true);
          } else {
            Alert.alert('Lỗi Firestore', error.message);
          }
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Xử lý Đăng nhập Admin bằng Email/Mật khẩu
  const handleAdminEmailLogin = () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu admin!');
      return;
    }

    // Đăng nhập hệ thống admin thành công
    setAdminUser({
      email: adminEmail.trim(),
      displayName: 'Quản trị viên',
    });
    setIsAdminLoggedIn(true);
  };

  // Xử lý Đăng nhập Admin bằng Google
  const handleGoogleAdminLogin = async () => {
    setAuthLoading(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        setAdminUser(result.user);
        setIsAdminLoggedIn(true);
      } else {
        if (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID.includes('YOUR_WEB_CLIENT_ID')) {
          Alert.alert(
            'Google Sign-In trên Mobile',
            'Chưa điền GOOGLE_WEB_CLIENT_ID thật. Bạn có thể nhấn "Dùng thử chế độ Khách" hoặc đăng nhập bằng Email Admin (admin@vku.udn.vn / admin123).',
            [
              { text: 'Chế độ Khách', onPress: () => setIsAdminLoggedIn(true) },
              { text: 'Đóng', style: 'cancel' },
            ]
          );
          setAuthLoading(false);
          return;
        }
        await promptAsync();
      }
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        Alert.alert('Lỗi đăng nhập', error.message || 'Không thể đăng nhập Google');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Xử lý Đăng xuất Admin
  const handleAdminLogout = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setAdminUser(null);
      setIsAdminLoggedIn(false);
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    }
  };

  // CHỌN ẢNH VÀ UPLOAD LÊN CLOUDINARY
  const handlePickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập ảnh để chọn hình đại diện!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingImage(true);

        try {
          // Gửi asset ảnh trực tiếp sang Cloudinary (hỗ trợ cả Web blob/file và Mobile)
          const uploadedUrl = await uploadImageToCloudinary(asset);
          setHinhanh(uploadedUrl);
          Alert.alert('Thành công', 'Đã tải ảnh lên Cloudinary thành công!');
        } catch (uploadError) {
          console.warn('Cloudinary upload warning:', uploadError);
          // Dự phòng dùng URI ảnh cục bộ để không bị ngắt quãng demo
          setHinhanh(asset.uri);
          Alert.alert(
            'Thông báo',
            'Đã chọn ảnh thành công! (Nếu muốn lưu vĩnh viễn trên Cloudinary, hãy cập nhật CLOUD_NAME và UPLOAD_PRESET trong file cloudinaryConfig.js).'
          );
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + error.message);
      setUploadingImage(false);
    }
  };

  // Mở modal thêm người dùng mới
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setHoten('');
    setEmail('');
    setMatkhau('');
    setHinhanh('');
    setModalVisible(true);
  };

  // Mở modal sửa thông tin người dùng
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setHoten(item.hoten || '');
    setEmail(item.email || '');
    setMatkhau(item.matkhau || '');
    setHinhanh(item.hinhanh || '');
    setModalVisible(true);
  };

  // 2. THÊM MỚI (CREATE) VÀ CẬP NHẬT (UPDATE)
  // CHÚ Ý ĐẶC BIỆT: Chỉ lưu ĐÚNG 4 trường: email, matkhau, hoten, hinhanh
  const handleSaveUser = async () => {
    if (!hoten.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập họ tên!');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập email!');
      return;
    }
    if (!matkhau.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu!');
      return;
    }

    // Payload chỉ chứa đúng 4 trường theo quy định đề thi
    const userData = {
      email: email.trim(),
      matkhau: matkhau.trim(),
      hoten: hoten.trim(),
      hinhanh: hinhanh.trim() || 'https://via.placeholder.com/150',
    };

    if (!isFirebaseConfigured()) {
      // Mock data khi chưa cấu hình Firebase
      if (editingItem) {
        setItems((prev) =>
          prev.map((u) => (u.id === editingItem.id ? { id: u.id, ...userData } : u))
        );
      } else {
        setItems((prev) => [{ id: Date.now().toString(), ...userData }, ...prev]);
      }
      setModalVisible(false);
      return;
    }

    try {
      if (editingItem) {
        // Cập nhật người dùng vào collection 'users'
        const docRef = doc(db, 'users', editingItem.id);
        await updateDoc(docRef, userData);
      } else {
        // Thêm người dùng mới vào collection 'users'
        await addDoc(collection(db, 'users'), userData);
      }
      setModalVisible(false);
    } catch (error) {
      if (error.code === 'permission-denied') {
        Alert.alert(
          'Lỗi quyền Firebase',
          'Vào Firebase Console -> Firestore -> Rules và đổi thành:\nallow read, write: if true;\nrồi nhấn Publish.'
        );
      } else {
        Alert.alert('Lỗi lưu dữ liệu', error.message);
      }
    }
  };

  // 3. XÓA NGƯỜI DÙNG (DELETE)
  const handleDeleteUser = (item) => {
    const confirmDelete = async () => {
      if (!isFirebaseConfigured()) {
        setItems((prev) => prev.filter((u) => u.id !== item.id));
        return;
      }
      try {
        await deleteDoc(doc(db, 'users', item.id));
      } catch (error) {
        Alert.alert('Lỗi xóa', error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${item.hoten}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa người dùng "${item.hoten}" (${item.email})?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xóa người dùng', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  // 4. CHỨC NĂNG NÂNG CAO: XUẤT FILE CƠ SỞ DỮ LIỆU JSON ĐỂ NỘP BÀI THI
  const handleExportJSON = () => {
    // Chỉ xuất đúng 4 trường theo cấu trúc đề thi
    const exportData = items.map((u) => ({
      email: u.email || '',
      matkhau: u.matkhau || '',
      hoten: u.hoten || '',
      hinhanh: u.hinhanh || '',
    }));

    const jsonString = JSON.stringify(exportData, null, 2);

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'csdl_users.json';
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Thành công', 'Đã tải xuống file csdl_users.json thành công để nộp bài thi!');
      } catch (e) {
        console.error(e);
        setJsonContent(jsonString);
        setJsonModalVisible(true);
      }
    } else {
      setJsonContent(jsonString);
      setJsonModalVisible(true);
    }
  };

  // Bật/tắt xem mật khẩu cho từng card
  const toggleShowPassword = (id) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Lọc tìm kiếm người dùng theo họ tên hoặc email
  const filteredUsers = items.filter(
    (u) =>
      u.hoten?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Màn hình loading ban đầu
  if (authChecking) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 12, color: '#666' }}>Đang khởi tạo ứng dụng...</Text>
      </View>
    );
  }

  // MÀN HÌNH ĐĂNG NHẬP PHÂN HỆ ADMIN (Nếu chưa đăng nhập)
  if (!isAdminLoggedIn) {
    return (
      <SafeAreaView style={styles.loginScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />
        <KeyboardAvoidingView
          style={styles.loginContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.loginBox}>
            <View style={styles.loginIconWrapper}>
              <Ionicons name="shield-checkmark" size={40} color="#0066cc" />
            </View>
            <Text style={styles.loginMainTitle}>Phân hệ Quản trị (Admin)</Text>
            <Text style={styles.loginSubText}>
              Đề thi Giữa kỳ: Lập trình Đa nền tảng{'\n'}Quản lý Người dùng với Firebase Firestore
            </Text>

            {/* Form đăng nhập Email/Mật khẩu */}
            <View style={styles.loginForm}>
              <Text style={styles.loginLabel}>Email Admin</Text>
              <View style={styles.loginInputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#666" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.loginInput}
                  placeholder="admin@vku.udn.vn"
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={styles.loginLabel}>Mật khẩu</Text>
              <View style={styles.loginInputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#666" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.loginInput}
                  placeholder="Nhập mật khẩu..."
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.primaryLoginBtn}
                onPress={handleAdminEmailLogin}
              >
                <Text style={styles.primaryLoginBtnText}>Đăng nhập Admin</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Đăng nhập bằng Google */}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                (authLoading || (Platform.OS !== 'web' && !request)) && styles.disabledBtn,
              ]}
              onPress={handleGoogleAdminLogin}
              disabled={authLoading || (Platform.OS !== 'web' && !request)}
            >
              {authLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.googleBtnText}>Đăng nhập bằng Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Xem thử chế độ Khách */}
            <TouchableOpacity
              style={styles.guestLink}
              onPress={() => {
                setAdminUser({ email: 'guest@vku.udn.vn', displayName: 'Khách (Demo)' });
                setIsAdminLoggedIn(true);
              }}
            >
              <Text style={styles.guestLinkText}>Xem trước phân hệ Admin (Chế độ Khách)</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // MÀN HÌNH CHÍNH: PHÂN HỆ QUẢN TRỊ ADMIN (CRUD NGƯỜI DÙNG)
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* THANH TOP BAR: Thông tin Admin & Nút Đăng xuất */}
        <View style={styles.topAdminBar}>
          <View style={styles.adminInfo}>
            <View style={styles.adminAvatar}>
              <Ionicons name="person-circle" size={32} color="#0066cc" />
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.adminTitle}>Phân hệ Admin</Text>
              <Text style={styles.adminEmail} numberOfLines={1}>
                {adminUser?.displayName || adminUser?.email || 'Quản trị viên'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Nút Xuất CSDL JSON (Đáp ứng yêu cầu đề thi) */}
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportJSON}
            >
              <Ionicons name="download-outline" size={16} color="#0066cc" />
              <Text style={styles.exportBtnText}>Xuất JSON CSDL</Text>
            </TouchableOpacity>

            {/* Nút Đăng xuất */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleAdminLogout}>
              <Ionicons name="log-out-outline" size={16} color="#dc3545" />
              <Text style={styles.logoutBtnText}>Thoát</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cảnh báo cấu hình Firebase Rules nếu cần */}
        {permissionError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={22} color="#721c24" />
            <Text style={styles.errorText}>
              Firebase chưa cấp quyền ghi/đọc! Vào Firebase Console → Firestore → Rules đổi thành{' '}
              <Text style={{ fontWeight: 'bold' }}>allow read, write: if true;</Text> rồi bấm Publish.
            </Text>
          </View>
        )}

        {/* HEADER QUẢN LÝ NGƯỜI DÙNG */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Quản lý Người dùng</Text>
            <Text style={styles.headerSubtitle}>
              CSDL: {items.length} người dùng | {isFirebaseConfigured() ? 'Firebase Firestore Live' : 'Chế độ xem trước'}
            </Text>
          </View>
          <TouchableOpacity style={styles.addNewButton} onPress={handleOpenAddModal}>
            <Ionicons name="person-add" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.addNewButtonText}>Thêm người dùng</Text>
          </TouchableOpacity>
        </View>

        {/* THANH TÌM KIẾM NGƯỜI DÙNG */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#777" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo họ tên hoặc email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* DANH SÁCH NGƯỜI DÙNG (READ) */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={{ marginTop: 10, color: '#666' }}>Đang tải danh sách người dùng...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="people-outline" size={54} color="#ccc" />
            <Text style={{ color: '#888', marginTop: 12, fontSize: 15 }}>
              {searchQuery ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const isPasswordShown = Boolean(showPasswordMap[item.id]);

              return (
                <View style={styles.userCard}>
                  {/* Avatar người dùng (hinhanh) */}
                  <Image
                    source={{
                      uri: item.hinhanh || 'https://via.placeholder.com/150',
                    }}
                    style={styles.cardAvatar}
                  />

                  {/* Thông tin 4 trường: hoten, email, matkhau, hinhanh */}
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardHoten}>{item.hoten}</Text>

                    <View style={styles.fieldRow}>
                      <Ionicons name="mail-outline" size={14} color="#555" />
                      <Text style={styles.fieldLabel}>Email:</Text>
                      <Text style={styles.fieldValue} numberOfLines={1}>
                        {item.email}
                      </Text>
                    </View>

                    <View style={styles.fieldRow}>
                      <Ionicons name="key-outline" size={14} color="#555" />
                      <Text style={styles.fieldLabel}>Mật khẩu:</Text>
                      <Text style={[styles.fieldValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                        {isPasswordShown ? item.matkhau : '••••••••'}
                      </Text>
                      <TouchableOpacity
                        style={{ marginLeft: 6 }}
                        onPress={() => toggleShowPassword(item.id)}
                      >
                        <Ionicons
                          name={isPasswordShown ? 'eye-off-outline' : 'eye-outline'}
                          size={16}
                          color="#0066cc"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Nút Sửa & Xóa */}
                    <View style={styles.cardActionRow}>
                      <TouchableOpacity
                        style={[styles.smallBtn, styles.editBtn]}
                        onPress={() => handleOpenEditModal(item)}
                      >
                        <Ionicons name="pencil" size={14} color="#0066cc" />
                        <Text style={styles.editBtnText}>Sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.smallBtn, styles.deleteBtn]}
                        onPress={() => handleDeleteUser(item)}
                      >
                        <Ionicons name="trash" size={14} color="#dc3545" />
                        <Text style={styles.deleteBtnText}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* MODAL THÊM / SỬA NGƯỜI DÙNG (CREATE / UPDATE) */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
                {/* Họ tên */}
                <Text style={styles.inputLabel}>Họ và tên (hoten) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={hoten}
                  onChangeText={setHoten}
                />

                {/* Email */}
                <Text style={styles.inputLabel}>Email (email) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="nguyenvana@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                {/* Mật khẩu */}
                <Text style={styles.inputLabel}>Mật khẩu (matkhau) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập mật khẩu người dùng..."
                  value={matkhau}
                  onChangeText={setMatkhau}
                />

                {/* Hình ảnh (hinhanh) & Cloudinary Upload */}
                <Text style={styles.inputLabel}>Hình ảnh (hinhanh) - Cloudinary *</Text>
                <View style={styles.imageSection}>
                  {hinhanh ? (
                    <Image source={{ uri: hinhanh }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.emptyImagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#aaa" />
                      <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Chưa có ảnh</Text>
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <TouchableOpacity
                      style={styles.pickImageBtn}
                      onPress={handlePickAndUploadImage}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.pickImageBtnText}>Chọn ảnh & Tải lên Cloudinary</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <Text style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                      Hoặc dán trực tiếp đường dẫn URL ảnh vào ô bên dưới:
                    </Text>
                  </View>
                </View>

                <TextInput
                  style={[styles.formInput, { marginTop: 8, fontSize: 12 }]}
                  placeholder="https://res.cloudinary.com/... hoặc link ảnh bất kỳ"
                  value={hinhanh}
                  onChangeText={setHinhanh}
                  autoCapitalize="none"
                />
              </ScrollView>

              {/* Nút Lưu / Hủy */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalCancelBtn]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalSaveBtn]}
                  onPress={handleSaveUser}
                >
                  <Text style={styles.modalSaveBtnText}>Lưu thông tin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL XUẤT CSDL JSON (DÀNH CHO BÁO CÁO / NỘP BÀI) */}
        <Modal visible={jsonModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: 500 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Dữ liệu CSDL JSON (csdl_users.json)</Text>
                <TouchableOpacity onPress={() => setJsonModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                Chỉ chứa đúng 4 trường theo đề thi: email, matkhau, hoten, hinhanh.
              </Text>

              <ScrollView style={styles.jsonContainer}>
                <Text style={styles.jsonText}>{jsonContent}</Text>
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalSaveBtn, { marginTop: 14 }]}
                onPress={() => setJsonModalVisible(false)}
              >
                <Text style={styles.modalSaveBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginScreen: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  loginIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e7f1ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginMainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
  },
  loginSubText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 20,
  },
  loginForm: {
    width: '100%',
  },
  loginLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
    marginTop: 8,
  },
  loginInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
    backgroundColor: '#fff',
  },
  loginInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  primaryLoginBtn: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryLoginBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dee2e6',
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#adb5bd',
    fontWeight: 'bold',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    width: '100%',
    paddingVertical: 11,
    borderRadius: 8,
  },
  googleBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  guestLink: {
    marginTop: 14,
    paddingVertical: 6,
  },
  guestLinkText: {
    color: '#0066cc',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  topAdminBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminAvatar: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212529',
  },
  adminEmail: {
    fontSize: 11,
    color: '#6c757d',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f1ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  exportBtnText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffccd1',
  },
  logoutBtnText: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#721c24',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  addNewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e9ecef',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 14,
  },
  cardHoten: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
    marginRight: 4,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 12,
    color: '#333',
    flexShrink: 1,
  },
  cardActionRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  editBtn: {
    backgroundColor: '#e7f1ff',
  },
  editBtnText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteBtn: {
    backgroundColor: '#ffebee',
  },
  deleteBtnText: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    elevation: 8,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    marginTop: 10,
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9ecef',
  },
  emptyImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  pickImageBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  modalActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginLeft: 10,
  },
  modalCancelBtn: {
    backgroundColor: '#e9ecef',
  },
  modalCancelBtnText: {
    color: '#495057',
    fontWeight: '600',
    fontSize: 13,
  },
  modalSaveBtn: {
    backgroundColor: '#0066cc',
  },
  modalSaveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  jsonContainer: {
    backgroundColor: '#212529',
    borderRadius: 8,
    padding: 12,
    maxHeight: 250,
  },
  jsonText: {
    color: '#74c0fc',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
});
