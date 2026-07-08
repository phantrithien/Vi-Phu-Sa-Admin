// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// BẠN HÃY COPY NỘI DUNG FIREBASE CONFIG TRONG FILE src/config/firebase.js VÀO ĐÂY
const firebaseConfig = {
    apiKey: "AIzaSyD6GAPJ7vUpwwrWe9PqHyLUBw6dgwtzotI",
    authDomain: "viphusa-admin.firebaseapp.com",
    projectId: "viphusa-admin",
    storageBucket: "viphusa-admin.firebasestorage.app",
    messagingSenderId: "933122047263",
    appId: "1:933122047263:web:c748e1a6de2309026bc42a"
};

// Khởi tạo Firebase trong môi trường chạy ngầm
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Lắng nghe và hiển thị thông báo khi người dùng thu nhỏ web
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Đã nhận tin nhắn chạy ngầm: ', payload);
    // const notificationTitle = payload.notification.title;
    // const notificationOptions = {
    //     body: payload.notification.body,
    //     icon: '/vite.svg', // Icon của thông báo (bạn có thể thay bằng logo Vị Phù Sa sau)
    //     badge: '/vite.svg'
    // };

    // self.registration.showNotification(notificationTitle, notificationOptions);
});