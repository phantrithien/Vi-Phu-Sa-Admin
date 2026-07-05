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

// Màng lọc kiểm tra quyền truy cập (Đã sửa đổi)
const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();

    // 1. Chưa đăng nhập -> Đuổi ra trang Login
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // 2. Không đuổi user dựa trên role nữa, cho phép render component. 
    // Việc che dữ liệu và chặn thao tác sẽ do Component bên trong tự quyết định.

    return children;
};

const App = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
            <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />

            {/* Đường dẫn sai -> Trả về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;