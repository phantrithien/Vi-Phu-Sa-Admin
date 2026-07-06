import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    Plus, Flag, User, Calendar, Trash2, Edit2, Layout,
    MoreHorizontal, Cloud, Search, Filter, AlertCircle,
    CheckCircle2, Clock, AlignLeft, CheckSquare, Tag, X,
    Maximize2, MessageSquare, Image as ImageIcon, Send,
    ArrowUpDown, Bell
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const initialBoardData = {
    tasks: {},
    columns: {
        'col-0': { id: 'col-0', title: 'Đề xuất công việc', taskIds: [] },
        'col-1': { id: 'col-1', title: 'Cần làm (To Do)', taskIds: [] },
        'col-2': { id: 'col-2', title: 'Đang xử lý (In Progress)', taskIds: [] },
        'col-3': { id: 'col-3', title: 'Chờ duyệt (Review)', taskIds: [] },
        'col-4': { id: 'col-4', title: 'Hoàn thành (Done)', taskIds: [] }
    },
    columnOrder: ['col-0', 'col-1', 'col-2', 'col-3', 'col-4']
};

const LABEL_COLORS = [
    { id: 'blue', class: 'bg-blue-500' },
    { id: 'green', class: 'bg-green-500' },
    { id: 'yellow', class: 'bg-yellow-500' },
    { id: 'orange', class: 'bg-orange-500' },
    { id: 'red', class: 'bg-red-500' },
    { id: 'purple', class: 'bg-purple-500' }
];

const TaskBoard = () => {
    const { currentUser, userRole } = useAuth();

    const [employees, setEmployees] = useState([]);
    const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentEmpName, setCurrentEmpName] = useState('');
    const [notiPermission, setNotiPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');

    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState('All');
    const [filterAssignee, setFilterAssignee] = useState('All');
    const [sortType, setSortType] = useState('manual');
    const [dragOverColId, setDragOverColId] = useState(null);

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [targetColForNewTask, setTargetColForNewTask] = useState('col-0');

    const [taskForm, setTaskForm] = useState({
        content: '', description: '', assignee: '', deadline: '',
        priority: 'Medium', labels: [], checklists: [], comments: [], coverUrl: ''
    });

    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [newComment, setNewComment] = useState('');
    const commentsEndRef = useRef(null);
    const sessionStartTimestamp = useRef(Date.now()); // Chặn đẩy thông báo cũ khi vừa f5 trang

    const isManager = ['founder', 'back_office'].includes(userRole);

    // --- ĐĂNG KÝ SERVICE WORKER ĐỂ NHẬN THÔNG BÁO TRÊN ĐIỆN THOẠI ---
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker đã kích hoạt thành công cho PWA!', reg))
                .catch(err => console.error('Lỗi Service Worker:', err));
        }
    }, []);

    useEffect(() => {
        const boardRef = doc(db, 'boards', 'main-board');

        const initializeBoard = async () => {
            const snap = await getDoc(boardRef);
            if (!snap.exists()) {
                await setDoc(boardRef, initialBoardData);
            } else {
                const data = snap.data();
                let needsUpdate = false;
                if (!data.columns['col-0']) {
                    data.columns['col-0'] = { id: 'col-0', title: 'Đề xuất công việc', taskIds: [] };
                    needsUpdate = true;
                }
                if (!data.columnOrder.includes('col-0')) {
                    data.columnOrder = ['col-0', ...data.columnOrder];
                    needsUpdate = true;
                }
                if (needsUpdate) await updateDoc(boardRef, { columns: data.columns, columnOrder: data.columnOrder });
            }
        };
        initializeBoard();

        const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
            const empList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(empList);
            if (currentUser) {
                const me = empList.find(e => e.id === currentUser.uid);
                if (me) setCurrentEmpName(me.name);
            }
        });

        const unsubscribe = onSnapshot(boardRef, (docSnap) => {
            if (docSnap.exists()) setBoardData(docSnap.data());
            setLoading(false);
        });

        return () => { unsubscribe(); unsubEmployees(); };
    }, [currentUser]);

    // --- LẮNG NGHE THÔNG BÁO RIÊNG BIỆT CHO TỪNG NHÂN VIÊN ---
    useEffect(() => {
        if (!currentUser) return;

        // Chỉ truy vấn những thông báo gửi đích danh cho mình và mới tạo trong session này
        const qNoti = query(
            collection(db, 'notifications'),
            where('toUid', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubNoti = onSnapshot(qNoti, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const notiData = change.doc.data();
                    // Kiểm tra nếu thông báo này tạo ra sau khi user mở trang web lên
                    if (notiData.createdAt > sessionStartTimestamp.current) {
                        triggerNativeNotification(notiData.title, notiData.body);
                    }
                }
            });
        });

        return () => unsubNoti();
    }, [currentUser]);

    // Hàm xin quyền thông báo hệ thống trên điện thoại
    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            alert('Trình duyệt này không hỗ trợ nhận thông báo.');
            return;
        }
        const permission = await Notification.requestPermission();
        setNotiPermission(permission);
        if (permission === 'granted') {
            alert('Tuyệt vời! Thiết bị của bạn đã sẵn sàng nhận thông báo công việc.');
        }
    };

    // Hàm kích hoạt tiếng động và pop-up banner trên màn hình khóa điện thoại
    const triggerNativeNotification = (title, body) => {
        if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body: body,
                    icon: '/favicon.ico',
                    vibrate: [200, 100, 200],
                    badge: '/favicon.ico'
                });
            });
        }
    };

    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [taskForm.comments]);

    // --- KÉO THẢ (DRAG & DROP) ---
    const handleDragStart = (e, taskId, sourceColId) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.setData('sourceColId', sourceColId);
        setTimeout(() => e.target.classList.add('opacity-50'), 0);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-50');
        setDragOverColId(null);
    };

    const handleDragOver = (e, colId) => {
        e.preventDefault();
        if (dragOverColId !== colId) setDragOverColId(colId);
    };

    const handleDragLeave = () => setDragOverColId(null);

    const handleDrop = async (e, destColId) => {
        e.preventDefault();
        setDragOverColId(null);

        const taskId = e.dataTransfer.getData('taskId');
        const sourceColId = e.dataTransfer.getData('sourceColId');

        if (!taskId || !sourceColId || sourceColId === destColId) return;

        const newBoard = { ...boardData };
        newBoard.columns[sourceColId].taskIds = newBoard.columns[sourceColId].taskIds.filter(id => id !== taskId);
        newBoard.columns[destColId].taskIds.unshift(taskId);

        const task = newBoard.tasks[taskId];
        if (destColId === 'col-4' && task.checklists) {
            task.checklists = task.checklists.map(c => ({ ...c, isCompleted: true }));
        }

        const systemLog = {
            id: Date.now(),
            text: `đã di chuyển thẻ từ "${newBoard.columns[sourceColId].title}" sang "${newBoard.columns[destColId].title}"`,
            author: currentEmpName,
            timestamp: new Date().toISOString(),
            isSystem: true
        };
        task.comments = task.comments ? [...task.comments, systemLog] : [systemLog];

        setBoardData(newBoard);
        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
    };

    // --- CRUD TASK ---
    const openNewTaskModal = (colId = 'col-0') => {
        if (!isManager) return;
        resetForm();
        setTargetColForNewTask(colId);
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        if (!boardData || !isManager) return;

        const newBoard = { ...boardData };

        if (editingTaskId) {
            // Trường hợp Đổi Nhân Sự phụ trách khi Sửa thẻ -> Gửi thông báo
            const oldTask = boardData.tasks[editingTaskId];
            if (oldTask.assignee !== taskForm.assignee && taskForm.assignee) {
                const assignedEmp = employees.find(emp => emp.name === taskForm.assignee);
                if (assignedEmp) {
                    await addDoc(collection(db, 'notifications'), {
                        toUid: assignedEmp.id,
                        title: '💼 Cập nhật công việc mới',
                        body: `Quản lý vừa chỉ định công việc: "${taskForm.content}" cho bạn.`,
                        createdAt: Date.now()
                    });
                }
            }
            newBoard.tasks[editingTaskId] = { ...newBoard.tasks[editingTaskId], ...taskForm };
        } else {
            const newTaskId = `task-${Date.now()}`;

            const systemLog = {
                id: Date.now(),
                text: `đã tạo thẻ này trong cột "${newBoard.columns[targetColForNewTask].title}"`,
                author: currentEmpName,
                timestamp: new Date().toISOString(),
                isSystem: true
            };

            newBoard.tasks[newTaskId] = {
                id: newTaskId,
                ...taskForm,
                comments: [systemLog]
            };
            newBoard.columns[targetColForNewTask].taskIds.unshift(newTaskId);

            // BẮT SỰ KIỆN: Nếu tạo công việc mới và GÁN thẳng tên cho ai đó -> Bắn thông báo đẩy lập tức
            if (taskForm.assignee) {
                const assignedEmp = employees.find(emp => emp.name === taskForm.assignee);
                if (assignedEmp) {
                    await addDoc(collection(db, 'notifications'), {
                        toUid: assignedEmp.id,
                        title: '🎯 Bạn có công việc mới!',
                        body: `Nội dung: ${taskForm.content}`,
                        createdAt: Date.now()
                    });
                }
            }
        }

        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
        setIsTaskModalOpen(false);
        resetForm();
    };

    const handleCardClick = (taskId) => {
        const task = boardData.tasks[taskId];
        setTaskForm({
            content: task.content || '', description: task.description || '',
            assignee: task.assignee || '', deadline: task.deadline || '',
            priority: task.priority || 'Medium', labels: task.labels || [],
            checklists: task.checklists || [], comments: task.comments || [],
            coverUrl: task.coverUrl || ''
        });
        setEditingTaskId(taskId);
        setIsTaskModalOpen(true);
    };

    const handleDeleteTask = async (e, taskId, colId) => {
        e.stopPropagation();
        if (!isManager) return;
        if (!window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;
        const newBoard = { ...boardData };
        newBoard.columns[colId].taskIds = newBoard.columns[colId].taskIds.filter(id => id !== taskId);
        delete newBoard.tasks[taskId];
        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
    };

    const resetForm = () => {
        setTaskForm({ content: '', description: '', assignee: '', deadline: '', priority: 'Medium', labels: [], checklists: [], comments: [], coverUrl: '' });
        setEditingTaskId(null);
        setNewChecklistItem('');
        setNewComment('');
        setTargetColForNewTask('col-0');
    };

    const toggleLabel = (colorId) => {
        if (!isManager) return;
        setTaskForm(prev => {
            const hasLabel = prev.labels.includes(colorId);
            return { ...prev, labels: hasLabel ? prev.labels.filter(c => c !== colorId) : [...prev.labels, colorId] };
        });
    };

    const addChecklistItem = () => {
        if (!newChecklistItem.trim() || !isManager) return;
        setTaskForm(prev => ({
            ...prev,
            checklists: [...prev.checklists, { id: Date.now(), text: newChecklistItem, isCompleted: false }]
        }));
        setNewChecklistItem('');
    };

    const removeChecklistItem = (id) => {
        if (!isManager) return;
        setTaskForm(prev => ({ ...prev, checklists: prev.checklists.filter(item => item.id !== id) }));
    };

    const toggleChecklistCompletion = async (checklistId) => {
        if (!editingTaskId || !boardData) return;

        setTaskForm(prev => ({
            ...prev,
            checklists: prev.checklists.map(item =>
                item.id === checklistId ? { ...item, isCompleted: !item.isCompleted } : item
            )
        }));

        const newBoard = { ...boardData };
        const task = newBoard.tasks[editingTaskId];
        if (task && task.checklists) {
            task.checklists = task.checklists.map(item =>
                item.id === checklistId ? { ...item, isCompleted: !item.isCompleted } : item
            );
            await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !editingTaskId || !boardData) return;

        const commentObj = {
            id: Date.now(),
            text: newComment,
            author: currentEmpName,
            timestamp: new Date().toISOString(),
            isSystem: false
        };

        setTaskForm(prev => ({ ...prev, comments: [...prev.comments, commentObj] }));

        const newBoard = { ...boardData };
        const task = newBoard.tasks[editingTaskId];
        if (task) {
            task.comments = task.comments ? [...task.comments, commentObj] : [commentObj];
            await updateDoc(doc(db, 'boards', 'main-board'), newBoard);

            // Gửi thông báo khi có người bình luận vào task của nhân viên đó
            if (task.assignee && task.assignee !== currentEmpName) {
                const assignedEmp = employees.find(emp => emp.name === task.assignee);
                if (assignedEmp) {
                    await addDoc(collection(db, 'notifications'), {
                        toUid: assignedEmp.id,
                        title: '💬 Bình luận mới trong công việc',
                        body: `${currentEmpName} viết: "${newComment}"`,
                        createdAt: Date.now()
                    });
                }
            }
        }
        setNewComment('');
    };

    const getAnalytics = () => {
        if (!boardData) return { total: 0, completed: 0, overdue: 0 };
        let allTasks = Object.values(boardData.tasks);
        if (!isManager) {
            allTasks = allTasks.filter(t => t.assignee === currentEmpName);
        } else if (filterAssignee !== 'All') {
            allTasks = allTasks.filter(t => t.assignee === filterAssignee);
        }
        const visibleTaskIds = allTasks.map(t => t.id);
        const completedIds = boardData.columns['col-4'].taskIds.filter(id => visibleTaskIds.includes(id));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            total: allTasks.length,
            completed: completedIds.length,
            overdue: allTasks.filter(t => t.deadline && new Date(t.deadline) < today && !completedIds.includes(t.id)).length
        };
    };

    const stats = getAnalytics();

    return (
        <div className="min-h-screen bg-vps-black flex font-sans">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 overflow-hidden flex flex-col h-screen">

                {/* --- HEADER --- */}
                <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-vps-gold flex items-center gap-3">
                            <Layout className="w-8 h-8" /> {isManager ? 'Bảng Việc Tổng' : 'Việc Của Tôi'}
                            <Cloud className="w-5 h-5 text-green-500" title="Đã đồng bộ với Cloud" />
                        </h1>
                        <p className="text-vps-ivory/60 mt-1">
                            {isManager
                                ? 'Quản lý tiến độ dự án và phân công nhân sự toàn công ty.'
                                : `Xin chào ${currentEmpName}, đây là các công việc mà Quản lý đã giao cho bạn.`}
                        </p>
                    </div>

                    <div className="flex gap-4 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 items-center">
                        {/* NÚT XIN QUYỀN THÔNG BÁO HỆ THỐNG / ĐIỆN THOẠI */}
                        {notiPermission !== 'granted' && (
                            <button
                                onClick={requestNotificationPermission}
                                className="px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-blue-500/20 transition-all animate-pulse"
                            >
                                <Bell className="w-4 h-4" /> Bật thông báo điện thoại
                            </button>
                        )}

                        <div className="bg-[#1A1A1A] border border-vps-gray/40 rounded-xl p-3 flex items-center gap-4 min-w-[130px]">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><Clock className="w-5 h-5 text-blue-400" /></div>
                            <div><p className="text-xs text-gray-400">Tổng Task</p><p className="text-lg font-bold text-vps-ivory">{stats.total}</p></div>
                        </div>
                        <div className="bg-[#1A1A1A] border border-vps-gray/40 rounded-xl p-3 flex items-center gap-4 min-w-[130px]">
                            <div className="p-2 bg-red-500/10 rounded-lg"><AlertCircle className="w-5 h-5 text-red-400" /></div>
                            <div><p className="text-xs text-gray-400">Quá hạn</p><p className="text-lg font-bold text-red-400">{stats.overdue}</p></div>
                        </div>
                        <div className="bg-[#1A1A1A] border border-vps-gray/40 rounded-xl p-3 flex items-center gap-4 min-w-[130px]">
                            <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-400" /></div>
                            <div><p className="text-xs text-gray-400">Hoàn thành</p><p className="text-lg font-bold text-green-400">{stats.completed}</p></div>
                        </div>
                    </div>
                </div>

                {/* --- BỘ LỌC & SẮP XẾP --- */}
                <div className="mb-6 flex flex-col md:flex-row gap-4 shrink-0 bg-[#1A1A1A] p-4 rounded-xl border border-vps-gray/30">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text" placeholder="Tìm kiếm công việc..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#111] border border-vps-gray/50 rounded-lg py-2 pl-9 pr-4 text-sm text-vps-ivory focus:border-vps-gold outline-none transition-colors"
                        />
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-1 md:pb-0">
                        <div className="relative flex items-center border border-vps-gray/50 bg-[#111] rounded-lg px-3 py-2 text-sm text-vps-ivory shrink-0">
                            <ArrowUpDown className="w-4 h-4 text-gray-500 mr-2" />
                            <select className="bg-transparent outline-none appearance-none cursor-pointer pr-4" value={sortType} onChange={(e) => setSortType(e.target.value)}>
                                <option value="manual">Sắp xếp: Tùy chỉnh (Kéo thả)</option>
                                <option value="deadline">Sắp xếp: Hạn chót</option>
                                <option value="priority">Sắp xếp: Độ ưu tiên</option>
                            </select>
                        </div>
                        <div className="relative flex items-center border border-vps-gray/50 bg-[#111] rounded-lg px-3 py-2 text-sm text-vps-ivory shrink-0">
                            <Filter className="w-4 h-4 text-gray-500 mr-2" />
                            <select className="bg-transparent outline-none appearance-none cursor-pointer pr-4" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                                <option value="All">Tất cả ưu tiên</option><option value="High">Cao</option><option value="Medium">Trung bình</option><option value="Low">Thấp</option>
                            </select>
                        </div>
                        {isManager && (
                            <div className="relative flex items-center border border-vps-gray/50 bg-[#111] rounded-lg px-3 py-2 text-sm text-vps-ivory shrink-0">
                                <User className="w-4 h-4 text-gray-500 mr-2" />
                                <select className="bg-transparent outline-none appearance-none cursor-pointer pr-4 max-w-[150px] truncate" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                                    <option value="All">Mọi nhân sự</option>
                                    {employees.map(emp => (<option key={emp.id} value={emp.name}>{emp.name}</option>))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- BẢNG KANBAN --- */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-vps-gold/50">Đang tải dữ liệu dự án...</div>
                ) : !boardData ? (
                    <div className="flex-1 flex items-center justify-center text-red-400">Lỗi kết nối dữ liệu Kanban!</div>
                ) : (
                    <div className="flex-1 flex gap-5 overflow-x-auto pb-4 custom-scrollbar items-start">
                        {boardData.columnOrder.map((colId) => {
                            const column = boardData.columns[colId];

                            let tasks = column.taskIds
                                .map(taskId => boardData.tasks[taskId])
                                .filter(Boolean)
                                .filter(task => {
                                    const matchSearch = task.content.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchPriority = filterPriority === 'All' || task.priority === filterPriority;
                                    let matchAssignee = true;
                                    if (isManager) matchAssignee = filterAssignee === 'All' || task.assignee === filterAssignee;
                                    else matchAssignee = task.assignee === currentEmpName;
                                    return matchSearch && matchPriority && matchAssignee;
                                });

                            if (sortType === 'deadline') {
                                tasks.sort((a, b) => new Date(a.deadline || '2100-01-01') - new Date(b.deadline || '2100-01-01'));
                            } else if (sortType === 'priority') {
                                const pVal = { High: 3, Medium: 2, Low: 1 };
                                tasks.sort((a, b) => pVal[b.priority] - pVal[a.priority]);
                            }

                            const isDraggingOver = dragOverColId === column.id;

                            return (
                                <div
                                    key={column.id}
                                    className={`bg-[#181818] rounded-2xl flex flex-col min-w-[320px] w-[320px] max-h-full shrink-0 shadow-lg transition-all duration-300
                                        ${isDraggingOver ? 'bg-[#1e1c15] ring-2 ring-vps-gold' : ''}`}
                                    onDragOver={(e) => handleDragOver(e, column.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, column.id)}
                                >
                                    <div className="p-3.5 flex justify-between items-center sticky top-0 z-10">
                                        <h2 className="font-bold text-sm text-vps-ivory flex items-center gap-2">
                                            {column.title}
                                            <span className="bg-[#2A2A2A] text-vps-gold text-[10px] px-2 py-0.5 rounded-full font-mono">{tasks.length}</span>
                                        </h2>
                                        <MoreHorizontal className="w-4 h-4 text-gray-500 hover:text-vps-ivory cursor-pointer transition-colors" />
                                    </div>

                                    <div className="px-3 pb-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[100px]">
                                        {tasks.map((task) => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const isOverdue = task.deadline && new Date(task.deadline) < today && colId !== 'col-4';
                                            const isDueSoon = task.deadline && new Date(task.deadline).getTime() - today.getTime() <= 86400000 && !isOverdue && colId !== 'col-4';

                                            const totalChecklists = task.checklists?.length || 0;
                                            const completedChecklists = task.checklists?.filter(c => c.isCompleted).length || 0;
                                            const checklistDone = totalChecklists > 0 && totalChecklists === completedChecklists;

                                            return (
                                                <div
                                                    key={task.id}
                                                    draggable={sortType === 'manual'}
                                                    onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => handleCardClick(task.id)}
                                                    className={`bg-[#222] border hover:border-vps-gold/50 rounded-xl cursor-pointer group shadow-sm transition-all relative overflow-hidden flex flex-col
                                                        ${isOverdue ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                                                            checklistDone && colId !== 'col-4' ? 'border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-vps-gray/20'}`}
                                                >
                                                    {task.coverUrl && (
                                                        <div className="w-full h-28 bg-[#111] overflow-hidden">
                                                            <img src={task.coverUrl} alt="Cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                                        </div>
                                                    )}

                                                    <div className="p-3">
                                                        {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                                                        {isDueSoon && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}
                                                        {checklistDone && !isOverdue && colId !== 'col-4' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}

                                                        {task.labels && task.labels.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mb-2.5">
                                                                {task.labels.map(lbl => (
                                                                    <span key={lbl} className={`w-8 h-2 rounded-full ${LABEL_COLORS.find(c => c.id === lbl)?.class}`}></span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {isManager && (
                                                            <button onClick={(e) => handleDeleteTask(e, task.id, column.id)} className="absolute top-3 right-3 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-400/10 p-1.5 rounded transition-all">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        <h3 className="text-sm font-medium text-vps-ivory mb-3 leading-snug pr-6">
                                                            {task.content}
                                                        </h3>

                                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mb-3 font-medium">
                                                            {task.description && (
                                                                <div className="flex items-center gap-1" title="Có mô tả"><AlignLeft className="w-3.5 h-3.5" /></div>
                                                            )}
                                                            {task.comments?.length > 0 && (
                                                                <div className={`flex items-center gap-1 ${task.comments.filter(c => !c.isSystem).length > 0 ? 'text-blue-400' : ''}`} title="Bình luận">
                                                                    <MessageSquare className="w-3.5 h-3.5" /> <span>{task.comments.filter(c => !c.isSystem).length}</span>
                                                                </div>
                                                            )}
                                                            {totalChecklists > 0 && (
                                                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${checklistDone ? 'bg-green-500/20 text-green-400' : ''}`} title="Checklist">
                                                                    <CheckSquare className="w-3.5 h-3.5" /> <span>{completedChecklists}/{totalChecklists}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between text-[10px] border-t border-vps-gray/10 pt-2.5 mt-auto">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="bg-[#111] p-1 rounded-full"><User className="w-3 h-3 text-vps-gold" /></div>
                                                                <span className="truncate max-w-[90px] font-medium text-gray-300">{task.assignee || 'Trống'}</span>
                                                            </div>
                                                            <div className={`flex items-center gap-1 px-1.5 py-1 rounded-md ${isOverdue ? 'bg-red-500/20 text-red-400 font-bold' : isDueSoon ? 'bg-yellow-500/20 text-yellow-400 font-bold' : 'bg-[#111]'}`}>
                                                                <Calendar className="w-3 h-3" />
                                                                <span>{task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN').substring(0, 5) : '---'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {tasks.length === 0 && !isDraggingOver && (
                                            <div className="h-16 border border-dashed border-vps-gray/20 rounded-xl flex items-center justify-center text-gray-500 text-xs opacity-50">
                                                {isManager ? 'Thả thẻ vào đây' : 'Trống việc 🎉'}
                                            </div>
                                        )}
                                    </div>

                                    {isManager && (
                                        <div className="px-3 pb-3">
                                            <button
                                                onClick={() => openNewTaskModal(column.id)}
                                                className="w-full flex items-center justify-start gap-2 px-3 py-2 text-xs text-gray-400 hover:text-vps-ivory hover:bg-[#2A2A2A] rounded-lg transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Thêm thẻ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- MODAL TRELLO (VIEW & EDIT) --- */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A1A1A] border border-vps-gray/30 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl relative">

                        <div className="p-5 border-b border-vps-gray/20 flex justify-between items-center bg-[#1E1E1E]">
                            <div className="flex items-center gap-3 text-vps-gold">
                                <Maximize2 className="w-5 h-5" />
                                <h2 className="text-lg font-bold">{isManager ? (editingTaskId ? 'Chi tiết Thẻ' : 'Tạo Thẻ Mới') : 'Chi tiết Công việc'}</h2>
                            </div>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-500 hover:text-vps-ivory bg-[#111] p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        {taskForm.coverUrl && (
                            <div className="w-full h-40 bg-[#111] shrink-0">
                                <img src={taskForm.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                                            <Layout className="w-4 h-4 text-gray-500" /> Tên công việc *
                                        </label>
                                        <textarea
                                            required rows="2" placeholder="Tiêu đề..." disabled={!isManager}
                                            className="w-full bg-transparent border-none text-xl md:text-2xl font-bold text-vps-ivory focus:ring-0 outline-none resize-none p-0 placeholder-gray-600 disabled:bg-transparent"
                                            value={taskForm.content} onChange={e => setTaskForm({ ...taskForm, content: e.target.value })}
                                        />
                                    </div>

                                    {taskForm.labels.length > 0 && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wider">Nhãn (Labels)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {taskForm.labels.map(lbl => (
                                                    <span key={lbl} className={`px-3 py-1 rounded-md text-xs font-bold shadow-sm ${LABEL_COLORS.find(c => c.id === lbl)?.class} text-white`}>{lbl}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-3"><AlignLeft className="w-4 h-4 text-gray-500" /> Mô tả chi tiết</label>
                                        <textarea
                                            rows="3" placeholder={isManager ? "Thêm mô tả chi tiết hơn..." : "Chưa có mô tả."} disabled={!isManager}
                                            className={`w-full bg-[#111] border border-vps-gray/40 rounded-xl p-4 text-sm text-vps-ivory focus:border-vps-gold outline-none resize-none transition-colors ${!isManager && 'cursor-not-allowed opacity-80'}`}
                                            value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-300"><CheckSquare className="w-4 h-4 text-gray-500" /> Việc cần làm</label>
                                            <span className="text-xs font-mono bg-[#111] px-2 py-1 rounded-lg text-gray-400">{taskForm.checklists.filter(c => c.isCompleted).length} / {taskForm.checklists.length}</span>
                                        </div>
                                        {taskForm.checklists.length > 0 && (
                                            <div className="w-full h-2 bg-[#111] rounded-full overflow-hidden mb-4 border border-vps-gray/20">
                                                <div
                                                    className={`h-full transition-all duration-500 ${taskForm.checklists.filter(c => c.isCompleted).length === taskForm.checklists.length ? 'bg-green-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${(taskForm.checklists.filter(c => c.isCompleted).length / taskForm.checklists.length) * 100}%` }}
                                                ></div>
                                            </div>
                                        )}
                                        <div className="space-y-2 mb-4">
                                            {taskForm.checklists.map((item) => (
                                                <div key={item.id} className="flex items-start gap-3 group bg-[#111] p-3 rounded-lg border border-transparent hover:border-vps-gray/20 transition-all">
                                                    <input
                                                        type="checkbox" checked={item.isCompleted} onChange={() => toggleChecklistCompletion(item.id)}
                                                        className="mt-1 w-4 h-4 accent-vps-gold cursor-pointer"
                                                    />
                                                    <span className={`flex-1 text-sm ${item.isCompleted ? 'line-through text-gray-500' : 'text-vps-ivory'}`}>{item.text}</span>
                                                    {isManager && (
                                                        <button onClick={() => removeChecklistItem(item.id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {isManager && (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text" placeholder="Thêm mục việc..." value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                                                    className="flex-1 bg-[#111] border border-vps-gray/40 rounded-lg px-3 py-2 text-sm text-vps-ivory focus:border-vps-gold outline-none"
                                                />
                                                <button type="button" onClick={addChecklistItem} className="px-4 bg-[#222] hover:bg-[#333] text-vps-ivory rounded-lg text-sm font-medium transition-colors">Thêm</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* --- COMMENTS & ACTIVITY LOG --- */}
                                {editingTaskId && (
                                    <div className="h-72 shrink-0 bg-[#151515] border-t border-vps-gray/20 p-5 flex flex-col">
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-4"><MessageSquare className="w-4 h-4 text-gray-500" /> Bình luận & Lịch sử hoạt động</label>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pr-2">
                                            {taskForm.comments.map(c => (
                                                c.isSystem ? (
                                                    <div key={c.id} className="flex justify-center my-3">
                                                        <span className="text-[11px] text-gray-500 bg-[#111] px-3 py-1 rounded-full border border-vps-gray/10">
                                                            <strong className="text-gray-400">{c.author}</strong> {c.text} • {new Date(c.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div key={c.id} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-vps-gold font-bold shrink-0">{c.author.charAt(0)}</div>
                                                        <div className="flex-1 bg-[#1A1A1A] p-3 rounded-2xl rounded-tl-none border border-vps-gray/10">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold text-vps-ivory">{c.author}</span>
                                                                <span className="text-[10px] text-gray-500">{new Date(c.timestamp).toLocaleString('vi-VN')}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.text}</p>
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                            {taskForm.comments.length === 0 && <p className="text-xs text-gray-500 italic text-center">Chưa có bình luận nào.</p>}
                                            <div ref={commentsEndRef} />
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text" placeholder="Viết bình luận hoặc báo cáo tiến độ..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
                                                className="flex-1 bg-[#111] border border-vps-gray/40 rounded-xl px-4 py-2.5 text-sm text-vps-ivory focus:border-vps-gold outline-none"
                                            />
                                            <button type="button" onClick={handleAddComment} className="px-4 bg-vps-gold text-black rounded-xl hover:scale-105 transition-transform flex items-center justify-center"><Send className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CỘT PHẢI: Cài đặt (Sidebar Modal) */}
                            <div className="w-full md:w-72 bg-[#181818] border-l border-vps-gray/20 p-6 flex flex-col gap-6 overflow-y-auto">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Bảng điều khiển</label>

                                    {isManager && (
                                        <div className="mb-4">
                                            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1.5"><ImageIcon className="w-3.5 h-3.5" /> Link Ảnh bìa</label>
                                            <input
                                                type="text" placeholder="https://..."
                                                className="w-full bg-[#111] border border-vps-gray/40 rounded-lg p-2.5 text-xs text-vps-ivory focus:border-vps-gold outline-none"
                                                value={taskForm.coverUrl} onChange={e => setTaskForm({ ...taskForm, coverUrl: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="bg-[#111] p-3 rounded-xl border border-vps-gray/20 mb-4">
                                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 font-medium"><Tag className="w-3.5 h-3.5" /> Nhãn màu</div>
                                        <div className="flex flex-wrap gap-2">
                                            {LABEL_COLORS.map(color => (
                                                <button
                                                    key={color.id} type="button" onClick={() => toggleLabel(color.id)} disabled={!isManager}
                                                    className={`w-8 h-8 rounded-lg transition-all ${color.class} ${taskForm.labels.includes(color.id) ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111]' : 'opacity-50 hover:opacity-100'} ${!isManager && 'cursor-not-allowed'}`}
                                                ></button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 mb-1 block">Nhân sự phụ trách</label>
                                            <select
                                                disabled={!isManager}
                                                className={`w-full bg-[#111] border border-vps-gray/40 rounded-lg p-2.5 text-sm text-vps-ivory focus:border-vps-gold outline-none appearance-none ${!isManager ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                                value={taskForm.assignee} onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}
                                            >
                                                <option value="">-- Trống --</option>
                                                {employees.map(emp => (<option key={emp.id} value={emp.name}>{emp.name}</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 mb-1 block">Hạn chót</label>
                                            <input
                                                type="date" disabled={!isManager}
                                                className={`w-full bg-[#111] border border-vps-gray/40 rounded-lg p-2.5 text-sm text-vps-ivory focus:border-vps-gold outline-none ${!isManager ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 mb-1 block">Ưu tiên</label>
                                            <select
                                                disabled={!isManager}
                                                className={`w-full bg-[#111] border border-vps-gray/40 rounded-lg p-2.5 text-sm text-vps-ivory focus:border-vps-gold outline-none appearance-none ${!isManager ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                                                value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                                            >
                                                <option value="High">🔴 Cao</option><option value="Medium">🟡 Trung bình</option><option value="Low">🟢 Thấp</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {isManager && (
                                    <div className="mt-auto pt-6 border-t border-vps-gray/20">
                                        <button onClick={handleSaveTask} className="w-full py-3 bg-vps-gold text-black font-bold rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                                            Lưu thay đổi
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskBoard;