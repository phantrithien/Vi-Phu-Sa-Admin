const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

exports.onTaskCreated = onDocumentCreated("tasks/{taskId}", async (event) => {
    const snap = event.data;
    if (!snap) return null;

    const task = snap.data();

    // 1. Lấy dữ liệu
    const department = task.department || "general";
    const title = (task.title || "Công việc mới").toUpperCase();
    const assignee = task.assignee || "Đang trống";
    const boardTaskId = task.boardTaskId || "";

    // Lấy mức độ ưu tiên và format lại cho đẹp
    const rawPriority = task.priority || "Medium";
    const priorityMap = {
        "High": "🔴 Cao",
        "Medium": "🟡 Trung bình",
        "Low": "🟢 Thấp"
    };
    const priorityStr = priorityMap[rawPriority] || priorityMap["Medium"];

    // Xử lý hiển thị deadline
    let deadlineStr = "Không có";
    if (task.deadline) {
        const parts = task.deadline.split('-');
        if (parts.length === 3) {
            deadlineStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
            deadlineStr = task.deadline;
        }
    }

    let usersQuery = admin.firestore().collection("users");
    if (department !== "general") {
        usersQuery = usersQuery.where("department", "==", department);
    }

    const snapshot = await usersQuery.get();
    const tokens = [];
    const tokenToUserId = {};

    snapshot.forEach((doc) => {
        const user = doc.data();
        if (user.fcmToken) {
            tokens.push(user.fcmToken);
            tokenToUserId[user.fcmToken] = doc.id;
        }
    });

    if (tokens.length === 0) {
        console.log("Không tìm thấy nhân sự nào có token để gửi thông báo.");
        return null;
    }

    const uniqueTokens = [...new Set(tokens)];
    const validTokensBatch = uniqueTokens.slice(0, 500);
    const appDomain = "https://viphusa-admin.vercel.app";

    // 3. Cấu trúc lại nội dung thông báo kèm Ưu tiên
    const message = {
        notification: {
            title: "📝 Vi Phù Sa - Công việc mới!",
            // THÊM DÒNG ƯU TIÊN VÀO BODY Ở ĐÂY
            body: `${title}\nPhụ trách: ${assignee}\nDeadline: ${deadlineStr}\nƯu tiên: ${priorityStr}`,
        },
        webpush: {
            fcmOptions: {
                link: boardTaskId ? `${appDomain}/?taskId=${boardTaskId}` : appDomain
            }
        },
        tokens: validTokensBatch,
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`${response.successCount} thông báo đã gửi thành công!`);

        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
                        failedTokens.push(validTokensBatch[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                console.log(`Đang dọn dẹp ${failedTokens.length} token rác...`);
                const db = admin.firestore();
                const batch = db.batch();

                failedTokens.forEach(token => {
                    const userId = tokenToUserId[token];
                    if (userId) {
                        const userRef = db.collection("users").doc(userId);
                        batch.update(userRef, {
                            fcmToken: admin.firestore.FieldValue.delete()
                        });
                    }
                });

                await batch.commit();
            }
        }
    } catch (error) {
        console.error("Lỗi hệ thống khi gọi API gửi thông báo:", error);
    }

    return null;
});