import { Platform } from 'react-native';

// =====================================================================
// CẤU HÌNH TẢI ẢNH LÊN CLOUDINARY
// =====================================================================

/**
 * Hàm upload ảnh lên Cloudinary
 * Hỗ trợ cả đối tượng asset từ expo-image-picker, blob URI (Web) và mobile file URI.
 * @param {object|string} imageInput - Đối tượng asset hoặc chuỗi URI/base64
 * @returns {Promise<string>} - URL ảnh công khai từ Cloudinary
 */
export const uploadImageToCloudinary = async (imageInput) => {
  try {
    const cloudName = CLOUDINARY_CONFIG.cloudName;
    const uploadPreset = CLOUDINARY_CONFIG.uploadPreset;

    const formData = new FormData();
    formData.append('upload_preset', uploadPreset);

    // Xử lý linh hoạt theo môi trường Web và Mobile
    if (typeof imageInput === 'object' && imageInput !== null) {
      if (imageInput.file) {
        // Trên Web: File object từ input[type=file]
        formData.append('file', imageInput.file);
      } else if (Platform.OS === 'web' && imageInput.uri) {
        // Trên Web: Chuyển blob URL sang Blob thật để gửi đi
        const blobRes = await fetch(imageInput.uri);
        const blob = await blobRes.blob();
        formData.append('file', blob, 'image.jpg');
      } else if (imageInput.base64) {
        // Nếu có base64
        formData.append('file', `data:image/jpeg;base64,${imageInput.base64}`);
      } else if (imageInput.uri) {
        // Trên thiết bị di động (React Native)
        formData.append('file', {
          uri: imageInput.uri,
          type: 'image/jpeg',
          name: 'upload.jpg',
        });
      }
    } else if (typeof imageInput === 'string') {
      if (Platform.OS === 'web' && imageInput.startsWith('blob:')) {
        const blobRes = await fetch(imageInput);
        const blob = await blobRes.blob();
        formData.append('file', blob, 'image.jpg');
      } else if (imageInput.startsWith('data:')) {
        formData.append('file', imageInput);
      } else if (imageInput.startsWith('http')) {
        // Nếu đã là link online thì giữ nguyên
        return imageInput;
      } else {
        formData.append('file', `data:image/jpeg;base64,${imageInput}`);
      }
    } else {
      throw new Error('Dữ liệu ảnh không hợp lệ');
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'Không thể upload ảnh lên Cloudinary');
    }
  } catch (error) {
    console.error('Lỗi upload Cloudinary:', error);
    throw error;
  }
};
