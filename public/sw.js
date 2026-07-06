self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : { title: 'Vị Phù Sa Admin', body: 'Bạn có cập nhật công việc mới!' };

    const options = {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: { url: '/' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});