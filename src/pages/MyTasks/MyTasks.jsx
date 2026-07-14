import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock3, FolderKanban, UserRound } from 'lucide-react';

import AppShell from '../../components/AppShell';
import LoadingState from '../../components/ui/LoadingState';
import { useToast } from '../../components/ui/ToastProvider';
import { useAuth } from '../../contexts/AuthContext';
import { listTasks, TASK_PRIORITIES, TASK_STATUSES } from '../../services/taskService';

const statusLabels = {
    [TASK_STATUSES.TODO]: 'To Do',
    [TASK_STATUSES.IN_PROGRESS]: 'In Progress',
    [TASK_STATUSES.REVIEW]: 'Review',
    [TASK_STATUSES.DONE]: 'Done',
};

const priorityLabels = {
    [TASK_PRIORITIES.LOW]: 'Low',
    [TASK_PRIORITIES.MEDIUM]: 'Medium',
    [TASK_PRIORITIES.HIGH]: 'High',
};

const MyTasks = () => {
    const { currentUser, userData } = useAuth();
    const { pushToast } = useToast();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dueFilter, setDueFilter] = useState('all');

    const assigneeName = userData?.employee?.name || currentUser?.displayName || currentUser?.email || '';

    useEffect(() => {
        const loadTasks = async () => {
            if (!currentUser?.uid) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const rows = await listTasks({ assignee: assigneeName });
                setTasks(rows);
            } catch (err) {
                setError(err.message || 'Không thể tải danh sách công việc của bạn.');
                pushToast(err.message || 'Không thể tải danh sách công việc của bạn.', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadTasks();
    }, [currentUser, assigneeName]);

    const filteredTasks = useMemo(() => {
        if (dueFilter === 'all') return tasks;

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        return tasks.filter((task) => {
            if (!task.dueDate) return dueFilter === 'upcoming';
            const dueDate = new Date(task.dueDate);

            if (dueFilter === 'overdue') {
                return dueDate < startOfToday && task.status !== TASK_STATUSES.DONE;
            }
            if (dueFilter === 'today') {
                return dueDate >= startOfToday && dueDate <= endOfToday;
            }
            if (dueFilter === 'upcoming') {
                return dueDate > endOfToday;
            }

            return true;
        });
    }, [tasks, dueFilter]);

    const stats = useMemo(() => {
        const total = tasks.length;
        const done = tasks.filter((task) => task.status === TASK_STATUSES.DONE).length;
        const inProgress = tasks.filter((task) => task.status === TASK_STATUSES.IN_PROGRESS).length;

        return { total, done, inProgress };
    }, [tasks]);

    return (
        <AppShell title="My Tasks" subtitle="Danh sách công việc được giao cho bạn">
            <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Tổng việc</p>
                        <p className="mt-2 text-2xl font-semibold text-vps-ivory">{stats.total}</p>
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Đang xử lý</p>
                        <p className="mt-2 text-2xl font-semibold text-vps-gold">{stats.inProgress}</p>
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Hoàn thành</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-400">{stats.done}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-3">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'all', label: 'Tất cả' },
                            { id: 'overdue', label: 'Quá hạn' },
                            { id: 'today', label: 'Hôm nay' },
                            { id: 'upcoming', label: 'Sắp tới' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setDueFilter(item.id)}
                                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${dueFilter === item.id ? 'bg-vps-gold text-vps-black' : 'bg-[#111111] text-vps-ivory/70 border border-vps-gray/20'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <LoadingState title="Đang tải công việc" description="Đang đồng bộ task cá nhân từ Firestore." />
                ) : error ? (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-6 text-sm text-vps-ivory/70">
                        Không có task phù hợp với bộ lọc hiện tại.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredTasks.map((task) => (
                            <div key={task.id} className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-vps-gold">
                                            <FolderKanban className="h-4 w-4" />
                                            <span className="text-xs uppercase tracking-[0.3em]">{task.projectId || 'General'}</span>
                                        </div>
                                        <h3 className="mt-2 text-lg font-semibold text-vps-ivory">{task.title}</h3>
                                        <p className="mt-2 text-sm text-vps-ivory/65">{task.description || 'Không có mô tả chi tiết.'}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full border border-vps-gray/20 bg-[#111111] px-3 py-1 text-xs text-vps-ivory/70">
                                            {statusLabels[task.status] || 'To Do'}
                                        </span>
                                        <span className="rounded-full border border-vps-gray/20 bg-[#111111] px-3 py-1 text-xs text-vps-ivory/70">
                                            {priorityLabels[task.priority] || 'Medium'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-vps-ivory/70">
                                    <div className="flex items-center gap-2">
                                        <UserRound className="h-4 w-4 text-vps-gold" />
                                        <span>{(task.assignees || []).join(', ') || task.assignee || 'Chưa phân công'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="h-4 w-4 text-vps-gold" />
                                        <span>{task.dueDate || 'Không có hạn chót'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default MyTasks;
