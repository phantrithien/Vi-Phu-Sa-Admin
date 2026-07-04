import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    Plus, Flag, User, Calendar, Trash2, Edit2, Layout, MoreHorizontal, GripHorizontal, Cloud
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';


// Cấu trúc dữ liệu mặc định khi khởi tạo Bảng mới
const initialBoardData = {
    tasks: {},
    columns: {
        'col-1': { id: 'col-1', title: 'Cần làm (To Do)', taskIds: [] },
        'col-2': { id: 'col-2', title: 'Đang xử lý (In Progress)', taskIds: [] },
        'col-3': { id: 'col-3', title: 'Chờ duyệt (Review)', taskIds: [] },
        'col-4': { id: 'col-4', title: 'Hoàn thành (Done)', taskIds: [] }
    },
    columnOrder: ['col-1', 'col-2', 'col-3', 'col-4']
};

const TaskBoard = () => {

    const [employees, setEmployees] = useState([]); // Lưu danh sách nhân sự từ Firebase
    const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);

    // Form Data
    const [taskForm, setTaskForm] = useState({
        content: '',
        assignee: '',
        deadline: '',
        priority: 'Medium'
    });

    // --- 1. LẮNG NGHE & KHỞI TẠO DỮ LIỆU TỪ FIREBASE ---
    useEffect(() => {
        const boardRef = doc(db, 'boards', 'main-board');

        // Hàm kiểm tra và khởi tạo nếu bảng chưa tồn tại
        const initializeBoard = async () => {
            const snap = await getDoc(boardRef);
            if (!snap.exists()) {
                await setDoc(boardRef, initialBoardData);
            }
        };
        initializeBoard();

        const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
            setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Lắng nghe dữ liệu Real-time
        const unsubscribe = onSnapshot(boardRef, (docSnap) => {
            if (docSnap.exists()) setBoardData(docSnap.data());
            setLoading(false);
        });

        return () => { unsubscribe(); unsubEmployees(); };
    }, []);

    // --- 2. XỬ LÝ KÉO THẢ (DRAG & DROP) ---
    const handleDragStart = (e, taskId, sourceColId) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.setData('sourceColId', sourceColId);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Cần thiết để cho phép drop
    };

    const handleDrop = async (e, destColId) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const sourceColId = e.dataTransfer.getData('sourceColId');

        if (!taskId || !sourceColId || sourceColId === destColId) return;

        // Clone dữ liệu để xử lý logic
        const newBoard = { ...boardData };

        // Xóa task khỏi cột nguồn
        newBoard.columns[sourceColId].taskIds = newBoard.columns[sourceColId].taskIds.filter(id => id !== taskId);

        // Thêm task vào cột đích (lên đầu danh sách)
        newBoard.columns[destColId].taskIds.unshift(taskId);

        // Cập nhật State tạm thời cho UI mượt mà, sau đó đẩy lên Firebase
        setBoardData(newBoard);
        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
    };

    // --- 3. CRUD: THÊM, SỬA, XÓA TASK ---
    const handleSaveTask = async (e) => {
        e.preventDefault();
        if (!boardData) return;

        const newBoard = { ...boardData };

        if (editingTaskId) {
            // SỬA TASK
            newBoard.tasks[editingTaskId] = {
                ...newBoard.tasks[editingTaskId],
                ...taskForm
            };
        } else {
            // THÊM TASK MỚI (Mặc định vào col-1: Cần làm)
            const newTaskId = `task-${Date.now()}`;
            newBoard.tasks[newTaskId] = { id: newTaskId, ...taskForm };
            newBoard.columns['col-1'].taskIds.unshift(newTaskId);
        }

        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
        setIsTaskModalOpen(false);
        resetForm();
    };

    const handleEditClick = (taskId) => {
        const task = boardData.tasks[taskId];
        setTaskForm({
            content: task.content,
            assignee: task.assignee || '',
            deadline: task.deadline || '',
            priority: task.priority || 'Medium'
        });
        setEditingTaskId(taskId);
        setIsTaskModalOpen(true);
    };

    const handleDeleteTask = async (taskId, colId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;

        const newBoard = { ...boardData };
        // Xóa khỏi danh sách cột
        newBoard.columns[colId].taskIds = newBoard.columns[colId].taskIds.filter(id => id !== taskId);
        // Xóa khỏi object tasks
        delete newBoard.tasks[taskId];

        await updateDoc(doc(db, 'boards', 'main-board'), newBoard);
    };

    const resetForm = () => {
        setTaskForm({ content: '', assignee: '', deadline: '', priority: 'Medium' });
        setEditingTaskId(null);
    };

    // --- CÁC HÀM TIỆN ÍCH UI ---
    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-900/50 text-red-400 border-red-500/30';
            case 'Medium': return 'bg-yellow-900/50 text-yellow-400 border-yellow-500/30';
            case 'Low': return 'bg-green-900/50 text-green-400 border-green-500/30';
            default: return 'bg-gray-800 text-gray-400 border-gray-600';
        }
    };

    const translatePriority = (priority) => {
        switch (priority) {
            case 'High': return 'Cao';
            case 'Medium': return 'Trung bình';
            case 'Low': return 'Thấp';
            default: return priority;
        }
    };

    return (
        <div className="min-h-screen bg-vps-black flex">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 overflow-hidden flex flex-col h-screen">

                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-vps-gold flex items-center gap-3">
                            <Layout className="w-8 h-8" /> Bảng Công việc
                            <Cloud className="w-5 h-5 text-green-500" title="Đã đồng bộ với Cloud" />
                        </h1>
                        <p className="text-vps-ivory opacity-60 mt-1">Quản lý tiến độ dự án, phân công nhân sự và thời hạn (Kéo thả để di chuyển).</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsTaskModalOpen(true); }}
                        className="bg-vps-gold hover:bg-vps-gold-hover text-black font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-vps-gold/20"
                    >
                        <Plus className="w-5 h-5" /> Thêm Công việc
                    </button>
                </div>

                {/* Bảng Kanban */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-vps-gold opacity-50">Đang tải dữ liệu dự án...</div>
                ) : !boardData ? (
                    <div className="flex-1 flex items-center justify-center text-red-400">Lỗi kết nối dữ liệu Kanban!</div>
                ) : (
                    <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar items-start">
                        {boardData.columnOrder.map((colId) => {
                            const column = boardData.columns[colId];
                            const tasks = column.taskIds.map(taskId => boardData.tasks[taskId]).filter(Boolean);

                            return (
                                <div
                                    key={column.id}
                                    className="bg-[#1E1E1E] border border-vps-gray rounded-xl flex flex-col min-w-[320px] w-[320px] max-h-full shrink-0 shadow-lg"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, column.id)}
                                >
                                    {/* Tiêu đề Cột */}
                                    <div className="p-4 border-b border-vps-gray bg-[#1A1A1A] rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                                        <h2 className="font-semibold text-vps-ivory flex items-center gap-2">
                                            {column.title}
                                            <span className="bg-[#2A2A2A] text-vps-gold text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
                                        </h2>
                                        <MoreHorizontal className="w-5 h-5 text-gray-500" />
                                    </div>

                                    {/* Danh sách Thẻ (Cards) */}
                                    <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px]">
                                        {tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                                                className="bg-[#161616] border border-vps-gray hover:border-vps-gold/50 rounded-lg p-4 cursor-grab active:cursor-grabbing group shadow-md transition-all hover:shadow-[0_0_10px_rgba(212,175,55,0.1)] relative"
                                            >
                                                {/* Nút thao tác ẩn/hiện */}
                                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditClick(task.id)} className="text-blue-400 hover:text-blue-300 p-1 bg-[#222] rounded"><Edit2 className="w-3 h-3" /></button>
                                                    <button onClick={() => handleDeleteTask(task.id, column.id)} className="text-red-500 hover:text-red-400 p-1 bg-[#222] rounded"><Trash2 className="w-3 h-3" /></button>
                                                </div>

                                                {/* Tags */}
                                                <div className="flex gap-2 mb-3 pr-12">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${getPriorityStyles(task.priority)} flex items-center gap-1`}>
                                                        <Flag className="w-3 h-3" /> {translatePriority(task.priority)}
                                                    </span>
                                                </div>

                                                {/* Nội dung chính */}
                                                <h3 className="text-sm font-medium text-vps-ivory mb-4 pr-2 leading-relaxed">
                                                    {task.content}
                                                </h3>

                                                {/* Footer Thẻ */}
                                                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-vps-gray/40 pt-3">
                                                    <div className="flex items-center gap-1.5" title="Người phụ trách">
                                                        <div className="bg-[#2A2A2A] p-1 rounded-full"><User className="w-3 h-3 text-vps-gold" /></div>
                                                        <span className="truncate max-w-[100px]">{task.assignee || 'Chưa gán'}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${task.deadline && new Date(task.deadline) < new Date() ? 'text-red-400 font-medium' : ''}`} title="Hạn chót">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : '---'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Dropzone Placeholder ảo */}
                                        {tasks.length === 0 && (
                                            <div className="h-full min-h-[100px] border-2 border-dashed border-vps-gray/30 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                                                Kéo thả thẻ vào đây
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL THÊM / SỬA TASK */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1E1E1E] border border-vps-gray p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-vps-gold mb-6">{editingTaskId ? 'Sửa Công Việc' : 'Tạo Công Việc Mới'}</h2>
                        <form onSubmit={handleSaveTask} className="space-y-4">
                            <div>
                                <label className="block text-sm text-vps-ivory opacity-80 mb-1">Tên công việc / Dự án</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Mô tả công việc cần xử lý..."
                                    className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold outline-none resize-none"
                                    value={taskForm.content}
                                    onChange={e => setTaskForm({ ...taskForm, content: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-vps-ivory opacity-80 mb-1">Nhân sự phụ trách</label>
                                <select
                                    className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold outline-none"
                                    value={taskForm.assignee}
                                    onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}
                                >
                                    <option value="">Chọn nhân sự...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm text-vps-ivory opacity-80 mb-1">Hạn chót (Deadline)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold outline-none text-sm"
                                        value={taskForm.deadline}
                                        onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm text-vps-ivory opacity-80 mb-1">Độ ưu tiên</label>
                                    <select
                                        className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold outline-none text-sm"
                                        value={taskForm.priority}
                                        onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                                    >
                                        <option value="High">Cao (Khẩn cấp)</option>
                                        <option value="Medium">Trung bình</option>
                                        <option value="Low">Thấp (Tùy chọn)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-vps-gray/40">
                                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-vps-ivory opacity-60 hover:opacity-100">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-vps-gold text-black font-semibold rounded hover:bg-vps-gold-hover">{editingTaskId ? 'Lưu Thay Đổi' : 'Thêm Công Việc'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskBoard;