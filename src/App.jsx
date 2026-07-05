import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Import các trang
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Accounting from './pages/Accounting/Accounting';
import Marketing from './pages/Marketing/Marketing';
import Production from './pages/Production/Production';
import HR from './pages/HR/HR';
import TaskBoard from './pages/TaskBoard/TaskBoard';

// Màng lọc kiểm tra quyền truy cập
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userRole } = useAuth();

    // 1. Chưa đăng nhập -> Đuổi ra trang Login
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // 2. Đang chờ lấy role từ Firebase (chưa có role) -> Hiện màn hình chờ hoặc cho qua tạm (đã xử lý ở AuthContext)

    // 3. Có yêu cầu quyền, nhưng quyền của user không nằm trong danh sách cho phép -> Đá về TaskBoard
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.warn(`Truy cập bị từ chối. Quyền của bạn: ${userRole}`);
        return <Navigate to="/tasks" replace />;
    }

    // 4. Hợp lệ -> Cho phép truy cập component
    return children;
};

const App = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* DASHBOARD TỔNG: Founder, Hành chính, Trưởng phòng chuyên môn */}
            <Route path="/" element={
                <ProtectedRoute allowedRoles={['founder', 'back_office', 'front_office']}>
                    <Dashboard />
                </ProtectedRoute>
            } />

            {/* KHỐI HÀNH CHÍNH & KẾ TOÁN: Chỉ Founder và Back-Office */}
            <Route path="/accounting" element={
                <ProtectedRoute allowedRoles={['founder', 'back_office']}>
                    <Accounting />
                </ProtectedRoute>
            } />
            <Route path="/hr" element={
                <ProtectedRoute allowedRoles={['founder', 'back_office']}>
                    <HR />
                </ProtectedRoute>
            } />

            {/* KHỐI CHUYÊN MÔN: Kế toán (back_office) vẫn được vào để XEM (Read-only) lấy hợp đồng */}
            <Route path="/marketing" element={
                <ProtectedRoute allowedRoles={['founder', 'front_office', 'staff', 'back_office']}>
                    <Marketing />
                </ProtectedRoute>
            } />
            <Route path="/production" element={
                <ProtectedRoute allowedRoles={['founder', 'front_office', 'staff', 'back_office']}>
                    <Production />
                </ProtectedRoute>
            } />

            {/* TASKBOARD: Tất cả mọi người (kể cả Freelancer) đều được vào */}
            <Route path="/tasks" element={
                <ProtectedRoute allowedRoles={['founder', 'back_office', 'front_office', 'staff', 'freelancer']}>
                    <TaskBoard />
                </ProtectedRoute>
            } />

            {/* Đường dẫn sai -> Trả về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;