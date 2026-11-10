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
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

// Kiểm tra xem đã cấu hình Firebase thật chưa
const isFirebaseConfigured = () => {
  return db && db._options && !db._options.apiKey.includes('YOUR_API_KEY');
};

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state (Có thể đổi tên trường theo đề thi của giảng viên)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // 1. Đọc dữ liệu (READ) - Lắng nghe realtime từ Firestore
  useEffect(() => {
    if (isFirebaseConfigured()) {
      try {
        const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            setItems(list);
            setLoading(false);
          },
          (error) => {
            console.error('Firestore Error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối Firestore: ' + error.message);
            setLoading(false);
          }
        );
        return () => unsubscribe();
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    } else {
      // Dữ liệu mẫu ban đầu khi chưa cấu hình Firebase
      setItems([
        {
          id: '1',
          title: 'Dữ liệu mẫu 1 (Chưa cấu hình Firebase)',
          description: 'Vui lòng mở file firebaseConfig.js và điền cấu hình Firebase của bạn.',
          category: 'Hướng dẫn',
        },
        {
          id: '2',
          title: 'Dữ liệu mẫu 2',
          description: 'Thử nhấn sửa hoặc xóa để kiểm tra giao diện CRUD.',
          category: 'Demo',
        },
      ]);
      setLoading(false);
    }
  }, []);

  // Mở modal thêm mới
  const handleAddNew = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setModalVisible(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (item) => {
    setEditingItem(item);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setCategory(item.category || '');
    setModalVisible(true);
  };

  // 2. Thêm mới (CREATE) & Cập nhật (UPDATE)
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề!');
      return;
    }

    if (!isFirebaseConfigured()) {
      // Xử lý trên mock data khi chưa kết nối Firebase
      if (editingItem) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id ? { ...it, title, description, category } : it
          )
        );
      } else {
        const newItem = {
          id: Date.now().toString(),
          title,
          description,
          category,
        };
        setItems((prev) => [newItem, ...prev]);
      }
      setModalVisible(false);
      return;
    }

    try {
      if (editingItem) {
        // Cập nhật Firestore
        const docRef = doc(db, 'items', editingItem.id);
        await updateDoc(docRef, {
          title,
          description,
          category,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Thêm mới vào Firestore
        await addDoc(collection(db, 'items'), {
          title,
          description,
          category,
          createdAt: serverTimestamp(),
        });
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi khi lưu', error.message);
    }
  };

  // 3. Xóa dữ liệu (DELETE)
  const handleDelete = (item) => {
    const confirmDelete = async () => {
      if (!isFirebaseConfigured()) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        return;
      }
      try {
        await deleteDoc(doc(db, 'items', item.id));
      } catch (error) {
        Alert.alert('Lỗi khi xóa', error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc muốn xóa "${item.title}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa "${item.title}"?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  // Lọc dữ liệu tìm kiếm
  const filteredItems = items.filter(
    (item) =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Banner cảnh báo nếu chưa điền Firebase Config */}
        {!isFirebaseConfigured() && (
          <View style={styles.warningBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#856404" />
            <Text style={styles.warningText}>
              Đang ở chế độ Mock (Chưa cấu hình firebaseConfig.js).
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Quản lý Dữ liệu CRUD</Text>
            <Text style={styles.headerSubtitle}>
              {isFirebaseConfigured() ? '⚡ Firebase Firestore Live' : '📱 Chế độ xem trước'}
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Thanh tìm kiếm */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tiêu đề, danh mục..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Danh sách dữ liệu */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={{ marginTop: 10, color: '#666' }}>Đang tải dữ liệu...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#ccc" />
            <Text style={{ color: '#888', marginTop: 12, fontSize: 16 }}>Chưa có dữ liệu nào</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.category ? (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  ) : null}
                </View>

                {item.description ? (
                  <Text style={styles.cardDescription}>{item.description}</Text>
                ) : null}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleEdit(item)}
                  >
                    <Ionicons name="create-outline" size={16} color="#0066cc" />
                    <Text style={styles.editBtnText}>Sửa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc3545" />
                    <Text style={styles.deleteBtnText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* Modal Thêm / Chỉnh sửa */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Chỉnh sửa bản ghi' : 'Thêm mới bản ghi'}
              </Text>

              <Text style={styles.inputLabel}>Tiêu đề *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập tiêu đề..."
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Danh mục / Phân loại</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ví dụ: Học tập, Công việc, Sách..."
                value={category}
                onChangeText={setCategory}
              />

              <Text style={styles.inputLabel}>Mô tả / Chi tiết</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Nhập mô tả chi tiết..."
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveBtnText}>Lưu dữ liệu</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeeba',
  },
  warningText: {
    color: '#856404',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#0066cc',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#e7f1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  categoryText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 10,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  editBtn: {
    backgroundColor: '#eef4ff',
  },
  editBtnText: {
    color: '#0066cc',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteBtn: {
    backgroundColor: '#ffebee',
  },
  deleteBtnText: {
    color: '#dc3545',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 5,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelBtn: {
    backgroundColor: '#e9ecef',
  },
  cancelBtnText: {
    color: '#495057',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#0066cc',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
