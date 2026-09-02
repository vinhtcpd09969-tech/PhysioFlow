const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// Ảnh mới lưu dạng path tương đối (/uploads/...) từ backend static route;
// ảnh cũ (base64 hoặc URL tuyệt đối) vẫn hiển thị được nguyên trạng.
// Ảnh tĩnh trong frontend/public (/images/..., /goi/..., /nhan_su/...) được Vite/host
// tĩnh phục vụ trực tiếp trên origin frontend nên giữ nguyên, không prefix origin backend.
export function resolveImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  if (!path.startsWith('/uploads')) {
    return path;
  }
  return `${SERVER_ORIGIN}${path}`;
}
