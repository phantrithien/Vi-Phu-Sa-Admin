import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
};

const requiredEnvKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
];

const missingEnvKeys = requiredEnvKeys.filter((key) => !env[key]);

if (missingEnvKeys.length > 0) {
    console.warn(`[firebase] Missing environment variables: ${missingEnvKeys.join(', ')}`);
}

let app;
let auth;
let db;
let storage;
let messaging;
let secondaryAuth;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    messaging = getMessaging(app);

    const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
    secondaryAuth = getAuth(secondaryApp);
} catch (error) {
    console.warn('[firebase] Unable to initialize Firebase SDK:', error.message || error);
}

export { app, auth, db, storage, messaging, secondaryAuth };

export const isFirebaseConfigured = missingEnvKeys.length === 0;
export const firebaseConfigValues = firebaseConfig;