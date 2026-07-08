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

// BẮT SỰ KIỆN KHI NGƯỜI DÙNG CLICK VÀO THÔNG BÁO PUSH
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Đã click vào thông báo.', event);

    // Đóng popup thông báo sau khi click
    event.notification.close();

    // Tìm đường link đã được đính kèm từ Backend (fcmOptions.link)
    const payload = event.notification.data?.FCM_MSG?.data || event.notification.data;
    const clickAction = event.notification?.data?.FCM_MSG?.notification?.click_action ||
        event.notification?.data?.FCM_MSG?.webpush?.fcmOptions?.link ||
        payload?.link ||
        '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // 1. Kiểm tra xem có tab nào của web đang mở không
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    // Nếu có tab đang mở -> Focus vào tab đó và chuyển URL
                    client.navigate(clickAction);
                    return client.focus();
                }
            }
            // 2. Nếu web đang bị tắt hoàn toàn -> Mở một tab mới với URL đó
            if (clients.openWindow) {
                return clients.openWindow(clickAction);
            }
        })
    );
});