const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onTaskCreated = onDocumentCreated("tasks/{taskId}", async (event) => {
    // Lấy dữ liệu của task vừa được tạo
    const snap = event.data;
    if (!snap) return null;
    const task = snap.data();

    // 1. Quét tìm những nhân sự thuộc phòng ban của Task đó (Hoặc tất cả nếu là task chung)
    let usersQuery = admin.firestore().collection("users");
    if (task.department !== "general") {
        usersQuery = usersQuery.where("department", "==", task.department);
    }

    const snapshot = await usersQuery.get();
    const tokens = [];

    // 2. Lấy ra các "chìa khóa thông báo" (fcmToken) của họ
    snapshot.forEach((doc) => {
        const user = doc.data();
        if (user.fcmToken) {
            tokens.push(user.fcmToken);
        }
    });

    if (tokens.length === 0) {
        console.log("Không tìm thấy nhân sự nào có token để gửi thông báo.");
        return null;
    }

    // 3. Soạn nội dung thông báo
    const message = {
        notification: {
            title: "📝 Vị Phù Sa - Công việc mới!",
            body: `[${task.department.toUpperCase()}] ${task.title}\nPhụ trách: ${task.assignee || "Đang trống"}`,
        },
        tokens: tokens,
    };

    // 4. Bắn thông báo đến các thiết bị (Dùng hàm mới sendEachForMulticast của chuẩn mới)
    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(response.successCount + " thông báo đã gửi thành công!");
        return null;
    } catch (error) {
        console.error("Lỗi khi gửi thông báo:", error);
        return null;
    }
});