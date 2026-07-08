import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * PermissionGuard - Bộ lọc kiểm soát hiển thị và truy cập tuyến đường
 * @param allowedRoles Mảng các cấp bậc được phép (vị dụ: ['admin', 'manager'])
 * @param allowedDepartments Mảng các phòng ban được phép (ví dụ: ['marketing'])
 * @param fallback Giao diện hiển thị thay thế nếu từ chối truy cập (mặc định hiển thị thông báo lỗi)
 */
export const PermissionGuard = ({
    allowedRoles = [],
    allowedDepartments = [],
    fallback = null,
    children
}) => {
    const { role, department, currentUser, loading } = useAuth();

    if (loading) return <div className="p-6 text-center">Đang xác thực quyền truy cập...</div>;

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // ĐẶC QUYỀN: Cấp bậc 'executive' (Điều hành) luôn có toàn quyền, không cần xét phòng ban
    if (role === 'executive') {
        return <>{children}</>;
    }

    // Kiểm tra điều kiện Cấp bậc
    const hasRole = allowedRoles.length === 0 || allowedRoles.includes(role);

    // Kiểm tra điều kiện Phòng ban
    const hasDepartment = allowedDepartments.length === 0 || allowedDepartments.includes(department);

    if (hasRole && hasDepartment) {
        return <>{children}</>;
    }

    // Trường hợp không đủ quyền truy cập
    if (fallback) return <>{fallback}</>;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 m-4">
            <svg className="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m3.5-6.5A3.5 3.5 0 1113 8v1.5M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Giới hạn quyền truy cập</h3>
            <p className="text-gray-500 text-sm text-center max-w-sm">
                Tài khoản của bạn thuộc nhóm phòng ban hoặc cấp bậc không có thẩm quyền vận hành chức năng này. Vui lòng liên hệ Điều hành để biết thêm chi tiết.
            </p>
        </div>
    );
};