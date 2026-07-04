import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Khởi tạo Context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin', 'manager', 'staff'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Lắng nghe thay đổi trạng thái từ Firebase Auth
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                // Lấy thông tin phân quyền từ Firestore (Collection 'users')
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role);
                    } else {
                        setUserRole('staff'); // Mặc định nếu chưa có role
                    }
                } catch (error) {
                    console.error("Lỗi lấy dữ liệu phân quyền:", error);
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{ minHeight: '100vh', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontFamily: 'serif', fontSize: '1.5rem' }}>
                    Đang kết nối hệ thống Vị Phù Sa...
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};