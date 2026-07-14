import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { auth, db, messaging } from '../config/firebase';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userDepartment, setUserDepartment] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearAuthState = useCallback(() => {
        setCurrentUser(null);
        setUserRole(null);
        setUserDepartment(null);
        setUserData(null);
    }, []);

    const initializeUserProfile = useCallback(async (user) => {
        if (!user) {
            clearAuthState();
            return;
        }

        setCurrentUser(user);

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        let role = ROLES.STAFF;
        let department = null;
        let data = {
            email: user.email,
            role,
            department,
        };

        if (userSnap.exists()) {
            data = {
                ...data,
                ...userSnap.data(),
            };
            role = data.role || role;
            department = data.department || null;
        } else {
            await setDoc(userRef, {
                email: user.email,
                role,
                createdAt: Date.now(),
            }, { merge: true });
        }

        const employeeRef = doc(db, 'employees', user.uid);
        const employeeSnap = await getDoc(employeeRef);

        if (employeeSnap.exists()) {
            const employeeData = employeeSnap.data();
            department = department || employeeData.department || null;

            data = {
                ...data,
                employee: employeeData,
                department,
            };
        }

        setUserRole(role);
        setUserDepartment(department);
        setUserData(data);
    }, [clearAuthState]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);

            try {
                await initializeUserProfile(user);
            } catch (error) {
                console.error('Lỗi tải thông tin người dùng:', error);
                clearAuthState();
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [clearAuthState, initializeUserProfile]);

    const login = useCallback(async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await initializeUserProfile(userCredential.user);
        return userCredential.user;
    }, [initializeUserProfile]);

    const logout = useCallback(async () => {
        await firebaseSignOut(auth);
        clearAuthState();
    }, [clearAuthState]);

    const requestNotificationPermission = useCallback(async (uid) => {
        try {
            if (!uid) return false;
            if (!('Notification' in window)) return false;

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return false;

            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined);

            if (!token) return false;

            await setDoc(doc(db, 'users', uid), {
                fcmToken: token,
                notificationEnabled: true,
                updatedAt: Date.now(),
            }, { merge: true });

            return true;
        } catch (error) {
            console.error('Lỗi cấp quyền thông báo:', error);
            return false;
        }
    }, []);

    const value = {
        currentUser,
        userRole,
        userDepartment,
        userData,
        loading,
        login,
        logout,
        requestNotificationPermission,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};