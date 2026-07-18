import React, { useState, useEffect, useRef } from 'react';
import AppShell from '../../components/AppShell';
import {
    Plus, Flag, User, Calendar, Trash2, Edit2, Layout,
    MoreHorizontal, Cloud, Search, Filter, AlertCircle,
    CheckCircle2, Clock, AlignLeft, CheckSquare, Tag, X,
    Maximize2, MessageSquare, Image as ImageIcon, Send,
    ArrowUpDown, Bell, Users, ChevronLeft, ChevronRight, GripVertical
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { createTask, updateTask, TASK_PRIORITIES, TASK_STATUSES } from '../../services/taskService';

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
    const { currentUser, userRole, requestNotificationPermission: authRequestNoti } = useAuth();

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
    const [mobileColumnId, setMobileColumnId] = useState('col-0');

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [targetColForNewTask, setTargetColForNewTask] = useState('col-0');

    // NÂNG CẤP: assignee (string) -> assignees (array)
    const [taskForm, setTaskForm] = useState({
        content: '', description: '', assignees: [], deadline: '',
        priority: 'Medium', labels: [], checklists: [], comments: [], coverUrl: '', projectId: '', status: TASK_STATUSES.TODO
    });

    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [newComment, setNewComment] = useState('');
    const commentsEndRef = useRef(null);
    const sessionStartTimestamp = useRef(Date.now());

    const isManager = ['founder', 'back_office'].includes(userRole);

    useEffect(() => {
        const boardRef = doc(db, 'boards', 'main-board');
        const initializeBoard = async () => {
            const snap = await getDoc(boardRef);
            if (!snap.exists()) {
                await setDoc(boardRef, initialBoardData);
            } else {
                const data = snap.data();
                let needsUpdate = false;
                if (!data.columns['col-0']) { data.columns['col-0'] = { id: 'col-0', title: 'Đề xuất công việc', taskIds: [] }; needsUpdate = true; }
                if (!data.columnOrder.includes('col-0')) { data.columnOrder = ['col-0', ...data.columnOrder]; needsUpdate = true; }
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

    // Tự động bật Modal nếu bấm từ Thông báo
    useEffect(() => {
        if (!loading && boardData) {
            const urlParams = new URLSearchParams(window.location.search);
            const taskIdFromUrl = urlParams.get('taskId');
            if (taskIdFromUrl && boardData.tasks[taskIdFromUrl]) {
                handleCardClick(taskIdFromUrl);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, [loading, boardData]);

    useEffect(() => {
        if (!currentUser) return;
        const qNoti = query(collection(db, 'notifications'), where('toUid', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(1));
        const unsubNoti = onSnapshot(qNoti, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    // Tắt thông báo frontend để tránh trùng với backend
                }
            });
        });
        return () => unsubNoti();
    }, [currentUser]);

    const handleEnableNotifications = async () => {
        if (!('Notification' in window)) return alert('Trình duyệt này không hỗ trợ nhận thông báo.');
        const isSuccess = await authRequestNoti(currentUser.uid);
        if (isSuccess) {
            setNotiPermission('granted');
            alert('Tuyệt vời! Thiết bị của bạn đã sẵn sàng nhận thông báo công việc.');
        } else {
            alert('Bạn cần cấp quyền trên trình duyệt để nhận thông báo.');
        }
    };

    useEffect(() => {
        if (commentsEndRef.current) commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [taskForm.comments]);

    const handleDragStart = (e, taskId, sourceColId) => { e.dataTransfer.setData('taskId', taskId); e.dataTransfer.setData('sourceColId', sourceColId); setTimeout(() => e.target.classList.add('opacity-50'), 0); };
    const handleDragEnd = (e) => { e.target.classList.remove('opacity-50'); setDragOverColId(null); };
    const handleDragOver = (e, colId) => { e.preventDefault(); if (dragOverColId !== colId) setDragOverColId(colId); };
    const handleDragLeave = () => setDragOverColId(null);
    const moveTask = async (taskId, sourceColId, destColId) => {
        if (!taskId || !sourceColId || sourceColId === destColId) return;
        const newBoard = { ...boardData };
        newBoard.columns[sourceColId].taskIds = newBoard.columns[sourceColId].taskIds.filter(id => id !== taskId);
        newBoard.columns[destColId].taskIds.unshift(taskId);
        const task = newBoard.tasks[taskId];
        if (destColId === 'col-4' && task.checklists) task.checklists = task.checklists.map(c => ({ ...c, isCompleted: true }));
        const nextStatus = destColId === 'col-1' ? TASK_STATUSES.TODO : destColId === 'col-2' ? TASK_STATUSES.IN_PROGRESS : destColId === 'col-3' ? TASK_STATUSES.REVIEW : destColId === 'col-4' ? TASK_STATUSES.DONE : TASK_STATUSES.TODO;
        task.status = nextStatus;
        const systemLog = { id: Date.now(), text: `đã di chuyển thẻ từ "${newBoard.columns[sourceColId].title}" sang "${newBoard.columns[destColId].title}"`, author: currentEmpName, timestamp: new Date().toISOString(), isSystem: true };
        task.comments = task.comments ? [...task.comments, systemLog] : [systemLog];
        setBoardData(newBoard);
        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);

        try {
            const taskRecord = newBoard.tasks[taskId];
            await updateTask(taskRecord.id, {
                title: taskRecord.content,
                description: taskRecord.description || '',
                projectId: taskRecord.projectId || '',
                assignees: taskRecord.assignees || [],
                assignee: taskRecord.assignee || '',
                status: nextStatus,
                priority: taskRecord.priority || TASK_PRIORITIES.MEDIUM,
                dueDate: taskRecord.deadline || '',
            });
        } catch (err) {
            console.error('Unable to persist task status', err);
        }
    };

    const handleDrop = async (e, destColId) => {
        e.preventDefault();
        setDragOverColId(null);
        await moveTask(
            e.dataTransfer.getData('taskId'),
            e.dataTransfer.getData('sourceColId'),
            destColId
        );
    };

    const openNewTaskModal = (colId = 'col-0') => { if (!isManager) return; resetForm(); setTargetColForNewTask(colId); setIsTaskModalOpen(true); };

    // HÀM NHẬN VIỆC (THAM GIA)
    const handleJoinTask = async (e, taskId) => {
        e.stopPropagation();
        if (!boardData) return;

        const newBoard = { ...boardData };
        const task = newBoard.tasks[taskId];

        // Hỗ trợ cả dữ liệu cũ
        let currentAssignees = task.assignees || [];
        if (task.assignee && currentAssignees.length === 0 && task.assignee !== 'Trống') {
            currentAssignees = [task.assignee];
        }

        if (!currentAssignees.includes(currentEmpName)) {
            currentAssignees.push(currentEmpName);
        }

        task.assignees = currentAssignees;
        task.assignee = ""; // Xóa dữ liệu cũ để tránh lỗi

        const systemLog = { id: Date.now(), text: `đã tham gia phụ trách công việc này`, author: currentEmpName, timestamp: new Date().toISOString(), isSystem: true };
        task.comments = task.comments ? [...task.comments, systemLog] : [systemLog];

        setBoardData(newBoard);
        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault(); if (!boardData || !isManager) return;
        const newBoard = { ...boardData };

        if (editingTaskId) {
            newBoard.tasks[editingTaskId] = { ...newBoard.tasks[editingTaskId], ...taskForm };
            try {
                await updateTask(editingTaskId, {
                    title: taskForm.content,
                    description: taskForm.description || '',
                    projectId: taskForm.projectId || '',
                    assignees: taskForm.assignees || [],
                    assignee: taskForm.assignees[0] || '',
                    status: taskForm.status || TASK_STATUSES.TODO,
                    priority: taskForm.priority || TASK_PRIORITIES.MEDIUM,
                    dueDate: taskForm.deadline || '',
                });
            } catch (err) {
                console.error('Unable to update task record', err);
            }
        } else {
            const newTaskId = `task-${Date.now()}`;
            const systemLog = { id: Date.now(), text: `đã tạo thẻ này trong cột "${newBoard.columns[targetColForNewTask].title}"`, author: currentEmpName, timestamp: new Date().toISOString(), isSystem: true };
            const taskPayload = { id: newTaskId, ...taskForm, comments: [systemLog] };
            newBoard.tasks[newTaskId] = taskPayload;
            newBoard.columns[targetColForNewTask].taskIds.unshift(newTaskId);

            try {
                await createTask({
                    title: taskForm.content,
                    description: taskForm.description || '',
                    projectId: taskForm.projectId || '',
                    assignees: taskForm.assignees || [],
                    assignee: taskForm.assignees[0] || '',
                    status: taskForm.status || TASK_STATUSES.TODO,
                    priority: taskForm.priority || TASK_PRIORITIES.MEDIUM,
                    dueDate: taskForm.deadline || '',
                });
            } catch (err) {
                console.error('Unable to create task record', err);
            }
        }

        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
        setIsTaskModalOpen(false);
        resetForm();
    };

    const handleCardClick = (taskId) => {
        const task = boardData.tasks[taskId];
        // Xử lý dữ liệu cũ chuyển sang mảng
        let currentAssignees = task.assignees || [];
        if (task.assignee && currentAssignees.length === 0 && task.assignee !== 'Trống') {
            currentAssignees = [task.assignee];
        }

        setTaskForm({
            content: task.content || '', description: task.description || '',
            assignees: currentAssignees, deadline: task.deadline || '',
            priority: task.priority || 'Medium', labels: task.labels || [],
            checklists: task.checklists || [], comments: task.comments || [], coverUrl: task.coverUrl || ''
        });
        setEditingTaskId(taskId); setIsTaskModalOpen(true);
    };

    const handleDeleteTask = async (e, taskId, colId) => {
        e.stopPropagation(); if (!isManager || !window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;
        const newBoard = { ...boardData };
        newBoard.columns[colId].taskIds = newBoard.columns[colId].taskIds.filter(id => id !== taskId);
        delete newBoard.tasks[taskId];
        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
    };

    const resetForm = () => { setTaskForm({ content: '', description: '', assignees: [], deadline: '', priority: 'Medium', labels: [], checklists: [], comments: [], coverUrl: '', projectId: '', status: TASK_STATUSES.TODO }); setEditingTaskId(null); setNewChecklistItem(''); setNewComment(''); setTargetColForNewTask('col-0'); };

    const toggleLabel = (colorId) => { if (!isManager) return; setTaskForm(prev => { const hasLabel = prev.labels.includes(colorId); return { ...prev, labels: hasLabel ? prev.labels.filter(c => c !== colorId) : [...prev.labels, colorId] }; }); };
    const addChecklistItem = () => { if (!newChecklistItem.trim() || !isManager) return; setTaskForm(prev => ({ ...prev, checklists: [...prev.checklists, { id: Date.now(), text: newChecklistItem, isCompleted: false }] })); setNewChecklistItem(''); };
    const removeChecklistItem = (id) => { if (!isManager) return; setTaskForm(prev => ({ ...prev, checklists: prev.checklists.filter(item => item.id !== id) })); };

    const toggleChecklistCompletion = async (checklistId) => {
        if (!editingTaskId || !boardData) return;
        setTaskForm(prev => ({ ...prev, checklists: prev.checklists.map(item => item.id === checklistId ? { ...item, isCompleted: !item.isCompleted } : item) }));
        const newBoard = { ...boardData }; const task = newBoard.tasks[editingTaskId];
        if (task && task.checklists) {
            task.checklists = task.checklists.map(item => item.id === checklistId ? { ...item, isCompleted: !item.isCompleted } : item);
            await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !editingTaskId || !boardData) return;
        const commentObj = { id: Date.now(), text: newComment, author: currentEmpName, timestamp: new Date().toISOString(), isSystem: false };
        setTaskForm(prev => ({ ...prev, comments: [...prev.comments, commentObj] }));
        const newBoard = { ...boardData }; const task = newBoard.tasks[editingTaskId];
        if (task) {
            task.comments = task.comments ? [...task.comments, commentObj] : [commentObj];
            await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
        }
        setNewComment('');
    };

    const getAnalytics = () => {
        if (!boardData) return { total: 0, completed: 0, overdue: 0 };
        let allTasks = Object.values(boardData.tasks);
        if (!isManager) allTasks = allTasks.filter(t => (t.assignees || []).includes(currentEmpName) || t.assignee === currentEmpName);
        else if (filterAssignee !== 'All') allTasks = allTasks.filter(t => (t.assignees || []).includes(filterAssignee) || t.assignee === filterAssignee);
        const visibleTaskIds = allTasks.map(t => t.id);
        const completedIds = boardData.columns['col-4'].taskIds.filter(id => visibleTaskIds.includes(id));
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return { total: allTasks.length, completed: completedIds.length, overdue: allTasks.filter(t => t.deadline && new Date(t.deadline) < today && !completedIds.includes(t.id)).length };
    };
    const stats = getAnalytics();

    return (
        <AppShell title="Task Board" subtitle="Theo dõi công việc và tiến độ nội bộ">
            <div className="flex min-h-0 flex-col overflow-visible md:h-[calc(100dvh-9rem)] md:overflow-hidden">
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2 text-vps-gold">
                            <Layout className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">{isManager ? 'Bảng công việc' : 'Việc của tôi'}</h2>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                                <Cloud className="h-3 w-3" /> Đã đồng bộ
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-vps-ivory/60">
                            {isManager ? 'Quản lý tiến độ dự án và phân công nhân sự.' : `Xin chào ${currentEmpName}, đây là công việc của bạn.`}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
                        {notiPermission !== 'granted' && (
                            <button onClick={handleEnableNotifications} className="col-span-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 sm:col-span-1 sm:px-4">
                                <Bell className="w-4 h-4" /> Bật thông báo
                            </button>
                        )}
                        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-vps-gray/30 bg-[#181818] px-2.5 py-2 sm:min-w-[112px] sm:px-3">
                            <div className="rounded-lg bg-blue-500/10 p-1.5"><Clock className="h-4 w-4 text-blue-400" /></div>
                            <div><p className="text-[10px] text-vps-ivory/50">Tổng task</p><p className="text-base font-semibold text-vps-ivory">{stats.total}</p></div>
                        </div>
                        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-vps-gray/30 bg-[#181818] px-2.5 py-2 sm:min-w-[112px] sm:px-3">
                            <div className="rounded-lg bg-rose-500/10 p-1.5"><AlertCircle className="h-4 w-4 text-rose-400" /></div>
                            <div><p className="text-[10px] text-vps-ivory/50">Quá hạn</p><p className="text-base font-semibold text-rose-400">{stats.overdue}</p></div>
                        </div>
                        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-vps-gray/30 bg-[#181818] px-2.5 py-2 sm:min-w-[112px] sm:px-3">
                            <div className="rounded-lg bg-emerald-500/10 p-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /></div>
                            <div><p className="text-[10px] text-vps-ivory/50">Hoàn thành</p><p className="text-base font-semibold text-emerald-400">{stats.completed}</p></div>
                        </div>
                    </div>
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-vps-gray/30 bg-[#181818] p-3 shrink-0 lg:flex-row lg:items-center">
                    <div className="relative w-full lg:max-w-lg">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text" placeholder="Tìm kiếm công việc..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="min-h-11 w-full rounded-lg border border-vps-gray/40 bg-[#111] py-2 pl-9 pr-4 text-sm text-vps-ivory outline-none transition-colors focus:border-vps-gold"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex lg:ml-auto">
                        <div className="relative flex min-h-11 items-center rounded-lg border border-vps-gray/40 bg-[#111] px-3 text-xs text-vps-ivory sm:text-sm">
                            <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-vps-ivory/40" />
                            <select className="w-full appearance-none bg-transparent outline-none cursor-pointer pr-3" value={sortType} onChange={(e) => setSortType(e.target.value)}>
                                <option value="manual">Sắp xếp: Kéo thả</option><option value="deadline">Sắp xếp: Hạn chót</option><option value="priority">Sắp xếp: Ưu tiên</option>
                            </select>
                        </div>
                        <div className="relative flex min-h-11 items-center rounded-lg border border-vps-gray/40 bg-[#111] px-3 text-xs text-vps-ivory sm:text-sm">
                            <Filter className="mr-2 h-4 w-4 shrink-0 text-vps-ivory/40" />
                            <select className="w-full appearance-none bg-transparent outline-none cursor-pointer pr-3" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                                <option value="All">Tất cả ưu tiên</option><option value="High">Cao</option><option value="Medium">Trung bình</option><option value="Low">Thấp</option>
                            </select>
                        </div>
                        {isManager && (
                            <div className="relative col-span-2 flex min-h-11 items-center rounded-lg border border-vps-gray/40 bg-[#111] px-3 text-xs text-vps-ivory sm:col-span-1 sm:text-sm">
                                <User className="mr-2 h-4 w-4 shrink-0 text-vps-ivory/40" />
                                <select className="w-full appearance-none truncate bg-transparent outline-none cursor-pointer pr-3" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                                    <option value="All">Mọi nhân sự</option>
                                    {employees.map(emp => (<option key={emp.id} value={emp.name}>{emp.name}</option>))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-vps-gold/50">Đang tải dữ liệu dự án...</div>
                ) : !boardData ? (
                    <div className="flex-1 flex items-center justify-center text-red-400">Lỗi kết nối dữ liệu Kanban!</div>
                ) : (
                    <>
                        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 md:hidden hide-scrollbar">
                            {boardData.columnOrder.map((colId) => {
                                const column = boardData.columns[colId];
                                return (
                                    <button
                                        key={column.id}
                                        onClick={() => setMobileColumnId(column.id)}
                                        className={`min-h-10 shrink-0 rounded-lg border px-3 text-xs font-semibold transition-colors ${mobileColumnId === column.id ? 'border-vps-gold bg-vps-gold text-vps-black' : 'border-vps-gray/30 bg-[#181818] text-vps-ivory/70'}`}
                                    >
                                        {column.title}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 flex gap-3 overflow-x-auto pb-4 custom-scrollbar items-start md:gap-5 md:snap-x md:snap-mandatory">
                            {boardData.columnOrder.map((colId) => {
                                const column = boardData.columns[colId];

                                let tasks = column.taskIds.map(taskId => boardData.tasks[taskId]).filter(Boolean).filter(task => {
                                    const matchSearch = task.content.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchPriority = filterPriority === 'All' || task.priority === filterPriority;
                                    let matchAssignee = true;

                                    // Tương thích dữ liệu
                                    let taskAssignees = task.assignees || [];
                                    if (task.assignee && taskAssignees.length === 0 && task.assignee !== 'Trống') taskAssignees = [task.assignee];

                                    if (isManager) {
                                        matchAssignee = filterAssignee === 'All' || taskAssignees.includes(filterAssignee);
                                    } else {
                                        matchAssignee = taskAssignees.includes(currentEmpName);
                                    }
                                    return matchSearch && matchPriority && matchAssignee;
                                });

                                if (sortType === 'deadline') tasks.sort((a, b) => new Date(a.deadline || '2100-01-01') - new Date(b.deadline || '2100-01-01'));
                                else if (sortType === 'priority') { const pVal = { High: 3, Medium: 2, Low: 1 }; tasks.sort((a, b) => pVal[b.priority] - pVal[a.priority]); }

                                const isDraggingOver = dragOverColId === column.id;
                                const columnIndex = boardData.columnOrder.indexOf(column.id);
                                const previousColumnId = boardData.columnOrder[columnIndex - 1] || null;
                                const nextColumnId = boardData.columnOrder[columnIndex + 1] || null;

                                return (
                                    <div
                                        key={column.id}
                                        className={`${mobileColumnId === column.id ? 'flex' : 'hidden'} w-full min-w-full min-h-[58dvh] shrink-0 flex-col rounded-xl border border-vps-gray/20 bg-[#181818] shadow-lg transition-colors md:flex md:min-w-[340px] md:w-[340px] md:max-h-full md:rounded-xl md:snap-center
                                        ${isDraggingOver ? 'border-vps-gold bg-[#211f16] ring-1 ring-vps-gold' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, column.id)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, column.id)}
                                    >
                                        <div className="flex items-center justify-between border-b border-vps-gray/15 bg-[#181818] p-3 sticky top-0 z-10">
                                            <h2 className="font-bold text-sm text-vps-ivory flex items-center gap-2">
                                                {column.title}
                                                <span className="bg-[#2A2A2A] text-vps-gold text-[10px] px-2 py-0.5 rounded-full font-mono">{tasks.length}</span>
                                            </h2>
                                            <MoreHorizontal className="h-4 w-4 text-vps-ivory/35" />
                                        </div>

                                        <div className="min-h-[100px] flex-1 space-y-2.5 overflow-y-auto px-2 pb-3 custom-scrollbar md:px-3">
                                            {tasks.map((task) => {
                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                const isOverdue = task.deadline && new Date(task.deadline) < today && colId !== 'col-4';
                                                const isDueSoon = task.deadline && new Date(task.deadline).getTime() - today.getTime() <= 86400000 && !isOverdue && colId !== 'col-4';
                                                const totalChecklists = task.checklists?.length || 0;
                                                const completedChecklists = task.checklists?.filter(c => c.isCompleted).length || 0;
                                                const checklistDone = totalChecklists > 0 && totalChecklists === completedChecklists;

                                                // Xác định nhân sự để hiển thị trên Thẻ
                                                let displayAssignees = task.assignees || [];
                                                if (task.assignee && displayAssignees.length === 0 && task.assignee !== 'Trống' && task.assignee !== 'Đang trống') {
                                                    displayAssignees = [task.assignee];
                                                }
                                                const assigneesCount = displayAssignees.length;

                                                return (
                                                    <div
                                                        key={task.id} draggable={sortType === 'manual'}
                                                        onDragStart={(e) => handleDragStart(e, task.id, column.id)} onDragEnd={handleDragEnd} onClick={() => handleCardClick(task.id)}
                                                        className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-[#202020] shadow-sm transition-colors hover:border-vps-gold/50 hover:bg-[#242424]
                                                        ${isOverdue ? 'border-rose-500/50' : checklistDone && colId !== 'col-4' ? 'border-emerald-500/40' : 'border-vps-gray/20'}`}
                                                    >
                                                        {task.coverUrl && (
                                                            <div className="w-full h-24 md:h-28 bg-[#111] overflow-hidden">
                                                                <img src={task.coverUrl} alt="Cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                                            </div>
                                                        )}

                                                        <div className="p-3">
                                                            {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                                                            {isDueSoon && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}
                                                            {checklistDone && !isOverdue && colId !== 'col-4' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}

                                                            {task.labels && task.labels.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mb-2">
                                                                    {task.labels.map(lbl => (<span key={lbl} className={`w-6 md:w-8 h-1.5 md:h-2 rounded-full ${LABEL_COLORS.find(c => c.id === lbl)?.class}`}></span>))}
                                                                </div>
                                                            )}

                                                            <GripVertical className="pointer-events-none absolute right-2 top-3 hidden h-4 w-4 text-vps-ivory/20 group-hover:text-vps-ivory/45 md:block" />
                                                            {isManager && (
                                                                <button aria-label={`Xóa ${task.content}`} onClick={(e) => handleDeleteTask(e, task.id, column.id)} className="absolute right-2 top-2 rounded-lg p-1.5 text-rose-400 opacity-100 transition-colors hover:bg-rose-400/10 md:opacity-0 md:group-hover:opacity-100">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}

                                                            <h3 className="mb-2 pr-6 text-sm font-semibold leading-snug text-vps-ivory">{task.content}</h3>

                                                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-[11px] text-gray-400 mb-2 font-medium">
                                                                {task.description && (<div className="flex items-center gap-1"><AlignLeft className="w-3 h-3" /></div>)}
                                                                {task.comments?.length > 0 && (
                                                                    <div className={`flex items-center gap-1 ${task.comments.filter(c => !c.isSystem).length > 0 ? 'text-blue-400' : ''}`}>
                                                                        <MessageSquare className="w-3 h-3" /> <span>{task.comments.filter(c => !c.isSystem).length}</span>
                                                                    </div>
                                                                )}
                                                                {totalChecklists > 0 && (
                                                                    <div className={`flex items-center gap-1 px-1 py-0.5 rounded ${checklistDone ? 'bg-green-500/20 text-green-400' : ''}`}>
                                                                        <CheckSquare className="w-3 h-3" /> <span>{completedChecklists}/{totalChecklists}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center justify-between text-[10px] border-t border-vps-gray/10 pt-2 mt-auto">

                                                                {/* HIỂN THỊ NHÂN SỰ HOẶC NÚT THAM GIA */}
                                                                <div className="z-10 flex items-center gap-1.5">
                                                                    <div className="bg-[#111] p-1 rounded-full">
                                                                        {assigneesCount > 1 ? <Users className="w-3 h-3 text-vps-gold" /> : <User className="w-3 h-3 text-vps-gold" />}
                                                                    </div>
                                                                    {assigneesCount === 0 ? (
                                                                        <button onClick={(e) => handleJoinTask(e, task.id)} className="bg-vps-gold/20 text-vps-gold px-2 py-1 md:py-0.5 rounded text-[10px] font-bold hover:bg-vps-gold hover:text-black transition-all cursor-pointer relative z-20">
                                                                            Tham gia
                                                                        </button>
                                                                    ) : assigneesCount === 1 ? (
                                                                        <span className="truncate max-w-[70px] md:max-w-[90px] font-medium text-gray-300">{displayAssignees[0]}</span>
                                                                    ) : (
                                                                        <span className="truncate max-w-[70px] md:max-w-[120px] font-medium text-vps-gold">Nhóm phụ trách ({assigneesCount})</span>
                                                                    )}
                                                                </div>

                                                                <div className={`flex items-center gap-1 px-1.5 py-1 rounded-md ${isOverdue ? 'bg-red-500/20 text-red-400 font-bold' : isDueSoon ? 'bg-yellow-500/20 text-yellow-400 font-bold' : ' text-gray-400'}`}>
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>{task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN').substring(0, 5) : '---'}</span>
                                                                </div>
                                                            </div>

                                                            {isManager ? (
                                                                <div className="mt-3 border-t border-vps-gray/10 pt-3 md:hidden">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <button
                                                                            type="button"
                                                                            disabled={!previousColumnId}
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                moveTask(task.id, column.id, previousColumnId);
                                                                                setMobileColumnId(previousColumnId);
                                                                            }}
                                                                            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-vps-gray/30 bg-[#111] px-3 text-xs font-semibold text-vps-ivory disabled:cursor-not-allowed disabled:opacity-30"
                                                                        >
                                                                            <ChevronLeft className="h-4 w-4" />
                                                                            Lùi
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={!nextColumnId}
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                moveTask(task.id, column.id, nextColumnId);
                                                                                setMobileColumnId(nextColumnId);
                                                                            }}
                                                                            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg bg-vps-gold px-3 text-xs font-semibold text-vps-black disabled:cursor-not-allowed disabled:opacity-30"
                                                                        >
                                                                            Tiếp
                                                                            <ChevronRight className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {tasks.length === 0 && !isDraggingOver && (
                                                <div className="h-12 md:h-16 border border-dashed border-vps-gray/20 rounded-xl flex items-center justify-center text-gray-500 text-xs opacity-50">
                                                    {isManager ? 'Thả thẻ vào đây' : 'Trống việc 🎉'}
                                                </div>
                                            )}
                                        </div>

                                        {isManager && (
                                            <div className="px-2 pb-2 md:px-3 md:pb-3">
                                                <button onClick={() => openNewTaskModal(column.id)} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-vps-gray/30 px-3 text-xs font-medium text-vps-ivory/60 transition-colors hover:border-vps-gold/50 hover:bg-vps-gold/10 hover:text-vps-gold">
                                                    <Plus className="w-3.5 h-3.5" /> Thêm thẻ
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* --- MODAL TRELLO (VIEW & EDIT) --- */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end bg-black/80 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-4">
                    <div className="relative flex h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl border border-vps-gray/30 bg-[#1A1A1A] shadow-2xl md:h-auto md:max-h-[92vh] md:rounded-2xl">

                        <div className="z-20 flex shrink-0 items-center justify-between border-b border-vps-gray/20 bg-[#1E1E1E] p-4">
                            <div className="flex items-center gap-2 text-vps-gold">
                                <Maximize2 className="h-4 w-4" />
                                <div>
                                    <p className="text-[11px] font-medium text-vps-gold/70">Task workspace</p>
                                    <h2 className="text-base font-semibold text-vps-ivory">{isManager ? (editingTaskId ? 'Chi tiết công việc' : 'Tạo công việc mới') : 'Chi tiết công việc'}</h2>
                                </div>
                            </div>
                            <button aria-label="Đóng chi tiết công việc" onClick={() => setIsTaskModalOpen(false)} className="rounded-lg border border-vps-gray/20 bg-[#111] p-2 text-vps-ivory/60 transition-colors hover:text-vps-ivory"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
                            <div className="flex flex-1 flex-col md:overflow-hidden">
                                {taskForm.coverUrl && (
                                    <div className="w-full h-32 md:h-40 bg-[#111] shrink-0">
                                        <img src={taskForm.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex-1 space-y-6 p-4 md:space-y-8 md:overflow-y-auto md:p-6 custom-scrollbar">
                                    <div>
                                        <textarea
                                            required rows="2" placeholder="Tiêu đề..." disabled={!isManager}
                                            className="w-full resize-none border-none bg-transparent p-0 text-xl font-semibold text-vps-ivory outline-none focus:ring-0 placeholder:text-vps-ivory/30 disabled:bg-transparent md:text-2xl"
                                            value={taskForm.content} onChange={e => setTaskForm({ ...taskForm, content: e.target.value })}
                                        />
                                    </div>

                                    {taskForm.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {taskForm.labels.map(lbl => (
                                                <span key={lbl} className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-bold shadow-sm ${LABEL_COLORS.find(c => c.id === lbl)?.class} text-white`}>{lbl}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-vps-ivory/80"><AlignLeft className="h-4 w-4 text-vps-ivory/40" /> Mô tả chi tiết</label>
                                        <textarea
                                            rows="3" placeholder={isManager ? "Thêm mô tả chi tiết hơn..." : "Chưa có mô tả."} disabled={!isManager}
                                            className={`w-full bg-[#111] border border-vps-gray/40 rounded-xl p-3 md:p-4 text-sm text-vps-ivory focus:border-vps-gold outline-none resize-none transition-colors ${!isManager && 'cursor-not-allowed opacity-80'}`}
                                            value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-vps-ivory/80"><CheckSquare className="h-4 w-4 text-vps-ivory/40" /> Việc cần làm</label>
                                            <span className="text-xs font-mono bg-[#111] px-2 py-1 rounded-lg text-gray-400">{taskForm.checklists.filter(c => c.isCompleted).length} / {taskForm.checklists.length}</span>
                                        </div>
                                        {taskForm.checklists.length > 0 && (
                                            <div className="w-full h-1.5 bg-[#111] rounded-full overflow-hidden mb-4 border border-vps-gray/20">
                                                <div className={`h-full transition-all duration-500 ${taskForm.checklists.filter(c => c.isCompleted).length === taskForm.checklists.length ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${(taskForm.checklists.filter(c => c.isCompleted).length / taskForm.checklists.length) * 100}%` }}></div>
                                            </div>
                                        )}
                                        <div className="space-y-2 mb-4">
                                            {taskForm.checklists.map((item) => (
                                                <div key={item.id} className="flex items-start gap-3 group bg-[#111] p-2.5 md:p-3 rounded-lg border border-transparent hover:border-vps-gray/20 transition-all">
                                                    <input type="checkbox" checked={item.isCompleted} onChange={() => toggleChecklistCompletion(item.id)} className="mt-1 w-4 h-4 accent-vps-gold cursor-pointer" />
                                                    <span className={`flex-1 text-sm ${item.isCompleted ? 'line-through text-gray-500' : 'text-vps-ivory'}`}>{item.text}</span>
                                                    {isManager && (
                                                        <button onClick={() => removeChecklistItem(item.id)} className="text-gray-500 hover:text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-4 h-4" /></button>
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

                                {editingTaskId && (
                                    <div className="flex shrink-0 flex-col border-t border-vps-gray/20 bg-[#151515] p-4 md:h-72 md:p-5">
                                        <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-vps-ivory/80"><MessageSquare className="h-4 w-4 text-vps-ivory/40" /> Bình luận</label>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pr-1 min-h-[150px] max-h-[300px] md:max-h-none">
                                            {taskForm.comments.map(c => (
                                                c.isSystem ? (
                                                    <div key={c.id} className="flex justify-center my-3">
                                                        <span className="text-[10px] md:text-[11px] text-gray-500 bg-[#111] px-2 md:px-3 py-1 rounded-full border border-vps-gray/10 text-center">
                                                            <strong className="text-gray-400">{c.author}</strong> {c.text} • {new Date(c.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div key={c.id} className="flex gap-2 md:gap-3">
                                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#222] flex items-center justify-center text-vps-gold font-bold shrink-0 text-xs md:text-sm">{c.author.charAt(0)}</div>
                                                        <div className="flex-1 bg-[#1A1A1A] p-2.5 md:p-3 rounded-2xl rounded-tl-none border border-vps-gray/10">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold text-vps-ivory">{c.author}</span>
                                                                <span className="text-[9px] md:text-[10px] text-gray-500">{new Date(c.timestamp).toLocaleString('vi-VN')}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.text}</p>
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                            {taskForm.comments.length === 0 && <p className="text-xs text-gray-500 italic text-center">Chưa có bình luận nào.</p>}
                                            <div ref={commentsEndRef} />
                                        </div>
                                        <div className="flex gap-2 pb-4 md:pb-0">
                                            <input
                                                type="text" placeholder="Viết bình luận..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
                                                className="flex-1 bg-[#111] border border-vps-gray/40 rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-sm text-vps-ivory focus:border-vps-gold outline-none"
                                            />
                                            <button type="button" onClick={handleAddComment} className="px-4 bg-vps-gold text-black rounded-xl hover:scale-105 transition-transform flex items-center justify-center"><Send className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex w-full shrink-0 flex-col gap-5 border-t border-vps-gray/20 bg-[#181818] p-4 pb-6 md:w-80 md:overflow-y-auto md:border-l md:border-t-0 md:p-5 custom-scrollbar">
                                <div>
                                    <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-vps-ivory/45">Cài đặt công việc</label>
                                    {isManager && (
                                        <div className="mb-4">
                                            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1.5"><ImageIcon className="w-3.5 h-3.5" /> Link Ảnh bìa</label>
                                            <input type="text" placeholder="https://..." className="w-full bg-[#111] border border-vps-gray/40 rounded-lg p-2.5 text-xs text-vps-ivory focus:border-vps-gold outline-none" value={taskForm.coverUrl} onChange={e => setTaskForm({ ...taskForm, coverUrl: e.target.value })} />
                                        </div>
                                    )}

                                    <div className="bg-[#111] p-3 rounded-xl border border-vps-gray/20 mb-4">
                                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 font-medium"><Tag className="w-3.5 h-3.5" /> Nhãn màu</div>
                                        <div className="flex flex-wrap gap-2">
                                            {LABEL_COLORS.map(color => (
                                                <button key={color.id} type="button" onClick={() => toggleLabel(color.id)} disabled={!isManager} className={`w-8 h-8 rounded-lg transition-all ${color.class} ${taskForm.labels.includes(color.id) ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111]' : 'opacity-50 hover:opacity-100'} ${!isManager && 'cursor-not-allowed'}`}></button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* NHÂN SỰ PHỤ TRÁCH LÀ DANH SÁCH CHECKBOX ĐỂ CHỌN NHIỀU NGƯỜI */}
                                        <div>
                                            <label className="text-[11px] font-medium text-gray-400 mb-1 block">Nhân sự phụ trách</label>
                                            <div className={`flex flex-col gap-2 bg-[#111] border border-vps-gray/40 rounded-lg p-2.5 max-h-32 overflow-y-auto custom-scrollbar ${!isManager ? 'opacity-70' : ''}`}>
                                                {employees.map(emp => (
                                                    <label key={emp.id} className={`flex items-center gap-2 ${isManager ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={taskForm.assignees.includes(emp.name)}
                                                            onChange={(e) => {
                                                                if (!isManager) return;
                                                                if (e.target.checked) setTaskForm({ ...taskForm, assignees: [...taskForm.assignees, emp.name] });
                                                                else setTaskForm({ ...taskForm, assignees: taskForm.assignees.filter(name => name !== emp.name) });
                                                            }}
                                                            disabled={!isManager}
                                                            className="accent-vps-gold w-3.5 h-3.5"
                                                        />
                                                        <span className="text-xs text-vps-ivory">{emp.name}</span>
                                                    </label>
                                                ))}
                                                {employees.length === 0 && <span className="text-xs text-gray-500 italic">Đang tải nhân sự...</span>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-medium text-gray-400 mb-1 block">Hạn chót</label>
                                            <input type="date" disabled={!isManager} className={`w-full bg-[#111] border border-vps-gray/40 rounded-lg p-2.5 text-sm text-vps-ivory focus:border-vps-gold outline-none ${!isManager ? 'opacity-70 cursor-not-allowed' : ''}`} value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium text-gray-400 mb-1 block">Ưu tiên</label>
                                            <select disabled={!isManager} className={`w-full bg-[#111] border border-vps-gray/40 rounded-lg p-2.5 text-sm text-vps-ivory focus:border-vps-gold outline-none appearance-none ${!isManager ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`} value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                                <option value="High">🔴 Cao</option><option value="Medium">🟡 Trung bình</option><option value="Low">🟢 Thấp</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                {isManager && (
                                    <div className="sticky bottom-0 -mx-4 mt-2 border-t border-vps-gray/20 bg-[#181818] p-4 md:static md:mx-0 md:mt-4 md:border-0 md:bg-transparent md:p-0">
                                        <button onClick={handleSaveTask} className="min-h-11 w-full rounded-xl bg-vps-gold px-4 text-sm font-semibold text-vps-black transition-transform hover:scale-[1.01]">Lưu thay đổi</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default TaskBoard;