import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';

// Nhập các trang hiện có
import Dashboard from './pages/Dashboard/Dashboard';
import Accounting from './pages/Accounting/Accounting';
import TaskBoard from './pages/TaskBoard/TaskBoard';
import Archive from './pages/Archive/Archive';
import Login from './pages/Login/Login';
import Production from './pages/Production/Production';
import HR from './pages/HR/HR';
import Marketing from './pages/Marketing/Marketing';

// Nhập trang Coming Soon mới tạo
import ComingSoon from './pages/ComingSoon/ComingSoon';

const ProtectedRoute = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-vps-black flex items-center justify-center text-vps-gold font-serif text-xl animate-pulse">Đang kiểm tra an ninh...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Đường dẫn tự do */}
                <Route path="/login" element={<Login />} />

                {/* Các đường dẫn bị khóa (Chỉ Admin) */}
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/accounting" element={<ProtectedRoute><Accounting /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />
                <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />

                {/* CÁC PHÂN HỆ ĐANG PHÁT TRIỂN */}
                <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
                <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
                <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />

                {/* Đường dẫn dự phòng */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;