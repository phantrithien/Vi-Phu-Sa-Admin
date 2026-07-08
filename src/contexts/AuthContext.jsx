import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hàm này CHỈ được gọi khi người dùng BẤM NÚT
    const requestNotificationPermission = async (userId) => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const messaging = getMessaging(auth.app);
                const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                const currentToken = await getToken(messaging, {
                    vapidKey: 'BKcg2H_vLdtULLGlNdheMPc3aZYCwyxZgUt7aVWfNmAZxi6wqpA_dNwMpr0tmQzgZCMeNa1v9w2CW8Jza-XQliM',
                    serviceWorkerRegistration: swRegistration
                });

                if (currentToken) {
                    console.log('✅ Đã lấy được Token:', currentToken);
                    const userRef = doc(db, 'users', userId);
                    await setDoc(userRef, { fcmToken: currentToken }, { merge: true });
                    console.log('✅ Đã lưu Token lên Firestore thành công!');
                    return true; // Trả về true nếu thành công
                }
            }
            return false;
        } catch (error) {
            console.error('❌ Lỗi khi lấy token thông báo:', error);
            return false;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setUserRole('founder');
                    } else {
                        setUserRole('founder');
                    }
                    // ĐÃ XÓA: requestNotificationPermission(user.uid); ở đây
                } catch (error) {
                    console.error("Lỗi hệ thống phân quyền:", error);
                    setUserRole('founder');
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Xuất hàm này ra để các component khác (như TaskBoard) có thể gọi
    const value = { currentUser, userRole, requestNotificationPermission };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{ minHeight: '100vh', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontFamily: 'serif', fontSize: '1.5rem' }}>
                    Đang kết nối Vị Phù Sa...
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};