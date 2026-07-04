// Đây là hàm tiện ích giúp chuyển đổi link Google Drive thông thường 
// thành link xem trực tiếp (direct view) hoặc link preview.

export const extractDriveFileId = (url) => {
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)$/);
    return match ? match[1] : null;
};

export const getDrivePreviewUrl = (url) => {
    const fileId = extractDriveFileId(url);
    if (!fileId) return url;
    return `https://drive.google.com/file/d/${fileId}/preview`;
};