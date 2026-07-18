import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Building2, Plus, Search, Sparkles, UserRound, FileText, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AppShell from '../../components/AppShell';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/ToastProvider';
import { db } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../constants/permissions';
import { isManagementRole } from '../../constants/roles';
import { hasAnyPermission } from '../../constants/permissions';
import {
    createProject,
    listProjects,
    updateProject,
    PROJECT_PRIORITIES,
    PROJECT_STATUSES,
} from '../../services/projectService';
import { listSops } from '../../services/sopService';
import { buildChecklistFromSop, calculateChecklistProgress, mergeChecklistFromSop } from '../../services/projectChecklistService';
import { createTask, listTasks, TASK_PRIORITIES, TASK_STATUSES, updateTask } from '../../services/taskService';
import { getProjectFinanceSummary } from '../../services/financeService';
import { createFileLink, listFileLinks } from '../../services/fileLinkService';
import { createArchiveFromProject } from '../../services/archiveService';
import { listClients } from '../../modules/clients/clientService';
import ProjectProductionTab from '../../modules/projects/tabs/ProjectProductionTab';
import ProjectCrewTab from '../../modules/projects/tabs/ProjectCrewTab';
import ProjectEquipmentTab from '../../modules/projects/tabs/ProjectEquipmentTab';

const initialForm = {
    title: '',
    clientId: '',
    clientName: '',
    client: '',
    producer: '',
    status: PROJECT_STATUSES.PLANNING,
    priority: PROJECT_PRIORITIES.MEDIUM,
    startDate: new Date().toISOString().slice(0, 10),
    summary: '',
    sopId: '',
};

const statusLabels = {
    [PROJECT_STATUSES.PLANNING]: 'Planning',
    [PROJECT_STATUSES.IN_PROGRESS]: 'In Progress',
    [PROJECT_STATUSES.REVIEW]: 'Review',
    [PROJECT_STATUSES.COMPLETED]: 'Completed',
    [PROJECT_STATUSES.ON_HOLD]: 'On Hold',
};

const taskStatusLabels = {
    [TASK_STATUSES.TODO]: 'To Do',
    [TASK_STATUSES.IN_PROGRESS]: 'In Progress',
    [TASK_STATUSES.REVIEW]: 'Review',
    [TASK_STATUSES.DONE]: 'Done',
};

const priorityLabels = {
    [PROJECT_PRIORITIES.LOW]: 'Low',
    [PROJECT_PRIORITIES.MEDIUM]: 'Medium',
    [PROJECT_PRIORITIES.HIGH]: 'High',
};

const statusVariant = {
    [PROJECT_STATUSES.PLANNING]: 'info',
    [PROJECT_STATUSES.IN_PROGRESS]: 'warning',
    [PROJECT_STATUSES.REVIEW]: 'neutral',
    [PROJECT_STATUSES.COMPLETED]: 'success',
    [PROJECT_STATUSES.ON_HOLD]: 'danger',
};

const Projects = () => {
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const { pushToast } = useToast();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [detailTab, setDetailTab] = useState('overview');
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [sops, setSops] = useState([]);
    const [clients, setClients] = useState([]);
    const [checklists, setChecklists] = useState({});
    const [projectTasks, setProjectTasks] = useState({});
    const [financeByProject, setFinanceByProject] = useState({});
    const [fileLinksByProject, setFileLinksByProject] = useState({});
    const [taskDraft, setTaskDraft] = useState({ title: '', dueDate: '', assignees: '', priority: TASK_PRIORITIES.MEDIUM });
    const [fileLinkDraft, setFileLinkDraft] = useState({ title: '', url: '', note: '' });
    const [archiveBusy, setArchiveBusy] = useState(false);

    const canManageProjects = hasAnyPermission(userRole, [PERMISSIONS.PROJECT, PERMISSIONS.MANAGE_TASKS]) || isManagementRole(userRole);

    const loadProjects = async () => {
        setLoading(true);
        setError('');
        try {
            const rows = await listProjects();
            setProjects(rows);
        } catch (err) {
            setError(err.message || 'Không thể tải dữ liệu dự án.');
            pushToast(err.message || 'Không thể tải dữ liệu dự án.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
        listSops().then((rows) => setSops(rows)).catch(() => setSops([]));
        listClients().then((rows) => setClients(rows)).catch(() => setClients([]));
    }, []);

    const filteredProjects = useMemo(() => {
        const term = search.trim().toLowerCase();

        return projects.filter((item) => {
            const haystack = [item.title, item.client, item.clientName, item.producer, item.code, item.summary]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesSearch = !term || haystack.includes(term);
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [projects, search, statusFilter, priorityFilter]);

    const activeProject = useMemo(() => {
        return projects.find((item) => item.id === activeProjectId) || null;
    }, [activeProjectId, projects]);

    const activeChecklist = useMemo(() => {
        return activeProject ? checklists[activeProject.id] || [] : [];
    }, [activeProject, checklists]);

    const activeChecklistProgress = useMemo(() => calculateChecklistProgress(activeChecklist), [activeChecklist]);
    const activeTasks = useMemo(() => (activeProject ? projectTasks[activeProject.id] || [] : []), [activeProject, projectTasks]);
    const activeFinance = useMemo(() => (activeProject ? financeByProject[activeProject.id] || { revenue: 0, cost: 0, profit: 0 } : { revenue: 0, cost: 0, profit: 0 }), [activeProject, financeByProject]);
    const activeFileLinks = useMemo(() => (activeProject ? fileLinksByProject[activeProject.id] || [] : []), [activeProject, fileLinksByProject]);

    const stats = useMemo(() => {
        const total = projects.length;
        const inProgress = projects.filter((item) => item.status === PROJECT_STATUSES.IN_PROGRESS).length;
        const completed = projects.filter((item) => item.status === PROJECT_STATUSES.COMPLETED).length;
        return { total, inProgress, completed };
    }, [projects]);

    const openCreate = () => {
        setEditingId(null);
        setForm(initialForm);
        setError('');
        setIsModalOpen(true);
    };

    const openProjectDetail = (project) => {
        setActiveProjectId(project.id);
        setDetailTab('overview');
        setChecklists((current) => ({
            ...current,
            [project.id]: current[project.id] || project.checklist || buildChecklistFromSop({ steps: [] }, project.id),
        }));
        loadProjectTasks(project.id);
        loadProjectFinance(project.id);
        loadProjectFileLinks(project.id);
    };

    const loadProjectFinance = async (projectId) => {
        try {
            const summary = await getProjectFinanceSummary(projectId);
            setFinanceByProject((current) => ({ ...current, [projectId]: summary }));
        } catch {
            setFinanceByProject((current) => ({ ...current, [projectId]: { revenue: 0, cost: 0, profit: 0 } }));
        }
    };

    const loadProjectFileLinks = async (projectId) => {
        try {
            const rows = await listFileLinks({ projectId });
            setFileLinksByProject((current) => ({ ...current, [projectId]: rows }));
        } catch {
            setFileLinksByProject((current) => ({ ...current, [projectId]: [] }));
        }
    };

    const loadProjectTasks = async (projectId) => {
        try {
            const rows = await listTasks({ projectId });
            setProjectTasks((current) => ({ ...current, [projectId]: rows }));
        } catch (err) {
            setError('Không thể tải task của dự án.');
            pushToast('Không thể tải task của dự án.', 'error');
        }
    };

    const handleCreateProjectTask = async (project) => {
        try {
            const title = taskDraft.title.trim();
            if (!title) {
                setError('Vui lòng nhập tiêu đề task.');
                return;
            }

            await createTask({
                title,
                description: '',
                projectId: project.id,
                assignees: taskDraft.assignees
                    .split(',')
                    .map((name) => name.trim())
                    .filter(Boolean),
                assignee: '',
                status: TASK_STATUSES.TODO,
                priority: taskDraft.priority,
                dueDate: taskDraft.dueDate || '',
            });

            setTaskDraft({ title: '', dueDate: '', assignees: '', priority: TASK_PRIORITIES.MEDIUM });
            await loadProjectTasks(project.id);
            pushToast('Tạo task thành công.', 'success');
        } catch (err) {
            setError(err.message || 'Không thể tạo task cho dự án.');
            pushToast(err.message || 'Không thể tạo task cho dự án.', 'error');
        }
    };

    const handleProjectTaskStatusChange = async (task, status) => {
        try {
            await updateTask(task.id, {
                title: task.title,
                description: task.description || '',
                projectId: task.projectId,
                assignees: task.assignees || [],
                assignee: task.assignee || '',
                status,
                priority: task.priority || TASK_PRIORITIES.MEDIUM,
                dueDate: task.dueDate || '',
            });
            await loadProjectTasks(task.projectId);
            pushToast('Đã cập nhật trạng thái task.', 'success');
        } catch (err) {
            setError('Không thể cập nhật trạng thái task.');
            pushToast('Không thể cập nhật trạng thái task.', 'error');
        }
    };

    const handleAddFileLink = async (project) => {
        try {
            await createFileLink({
                projectId: project.id,
                title: fileLinkDraft.title,
                url: fileLinkDraft.url,
                note: fileLinkDraft.note,
            });
            setFileLinkDraft({ title: '', url: '', note: '' });
            await loadProjectFileLinks(project.id);
            pushToast('Đã lưu file link.', 'success');
        } catch (err) {
            setError(err.message || 'Không thể lưu file link.');
            pushToast(err.message || 'Không thể lưu file link.', 'error');
        }
    };

    const handleCreateArchive = async (project) => {
        if (!window.confirm(`Bạn chắc chắn muốn lưu trữ dự án "${project.title}"?`)) {
            return;
        }

        try {
            setArchiveBusy(true);
            const finance = financeByProject[project.id] || { revenue: 0, cost: 0, profit: 0 };
            const links = fileLinksByProject[project.id] || [];
            await createArchiveFromProject(project, finance, links);
            pushToast('Đã tạo bản lưu trữ từ dự án.', 'success');
        } catch (err) {
            setError(err.message || 'Không thể tạo archive từ project.');
            pushToast(err.message || 'Không thể tạo archive từ project.', 'error');
        } finally {
            setArchiveBusy(false);
        }
    };

    const generateChecklist = async (project) => {
        const selectedSop = sops.find((item) => item.id === project.sopId);
        const nextChecklist = selectedSop
            ? mergeChecklistFromSop(checklists[project.id] || [], selectedSop, project.id)
            : buildChecklistFromSop({ steps: [] }, project.id);

        setChecklists((current) => ({ ...current, [project.id]: nextChecklist }));

        try {
            await updateDoc(doc(db, 'projects', project.id), {
                checklist: nextChecklist,
                sopId: project.sopId || '',
                updatedAt: Date.now(),
            });
        } catch (err) {
            setError('Không thể lưu checklist vào Firestore.');
            pushToast('Không thể lưu checklist vào Firestore.', 'error');
        }
    };

    const toggleChecklistItem = async (projectId, itemId) => {
        const nextChecklist = (checklists[projectId] || []).map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );

        setChecklists((current) => ({ ...current, [projectId]: nextChecklist }));

        try {
            await updateDoc(doc(db, 'projects', projectId), {
                checklist: nextChecklist,
                updatedAt: Date.now(),
            });
        } catch (err) {
            setError('Không thể lưu checklist vào Firestore.');
            pushToast('Không thể lưu checklist vào Firestore.', 'error');
        }
    };

    const openEdit = (project) => {
        setEditingId(project.id);
        setForm({
            title: project.title || '',
            clientId: project.clientId || '',
            clientName: project.clientName || project.client || '',
            client: project.client || '',
            producer: project.producer || '',
            status: project.status || PROJECT_STATUSES.PLANNING,
            priority: project.priority || PROJECT_PRIORITIES.MEDIUM,
            startDate: project.startDate || new Date().toISOString().slice(0, 10),
            summary: project.summary || '',
            sopId: project.sopId || '',
        });
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const payload = {
                ...form,
                title: form.title.trim(),
                producer: form.producer.trim(),
                summary: form.summary.trim(),
                sopId: form.sopId || '',
                checklist: editingId ? (projects.find((item) => item.id === editingId)?.checklist || []) : [],
            };

            const selectedClient = clients.find((item) => item.id === payload.clientId);
            const fallbackClientName = String(payload.clientName || payload.client || '').trim();

            payload.clientId = selectedClient ? selectedClient.id : '';
            payload.clientName = selectedClient ? selectedClient.name : fallbackClientName;
            payload.client = payload.clientName;

            if (!payload.title || !payload.clientName || !payload.producer) {
                setError('Vui lòng điền đầy đủ tiêu đề, khách hàng và producer.');
                return;
            }

            if (editingId) {
                await updateProject(editingId, payload);
                pushToast('Cập nhật dự án thành công.', 'success');
            } else {
                await createProject(payload);
                pushToast('Tạo dự án thành công.', 'success');
            }

            await loadProjects();
            setIsModalOpen(false);
        } catch (err) {
            setError(err.message || 'Không thể lưu dự án.');
            pushToast(err.message || 'Không thể lưu dự án.', 'error');
        }
    };

    return (
        <AppShell title="Projects" subtitle="Quản lý dự án, producer và tình trạng triển khai">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm text-vps-gold/70">MVP Project Workspace</p>
                        <h2 className="text-2xl font-semibold text-vps-ivory">Danh sách dự án</h2>
                        <p className="mt-1 text-sm text-vps-ivory/60">Gắn kết thông tin client, producer, deadline và tiến độ thực hiện.</p>
                    </div>

                    {canManageProjects && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-vps-gold px-4 py-2.5 font-semibold text-vps-black transition-transform hover:scale-[1.01]"
                        >
                            <Plus className="h-4 w-4" />
                            Tạo dự án mới
                        </button>
                    )}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Tổng dự án</p>
                        <p className="mt-2 text-2xl font-semibold text-vps-ivory">{stats.total}</p>
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Đang triển khai</p>
                        <p className="mt-2 text-2xl font-semibold text-vps-gold">{stats.inProgress}</p>
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Hoàn tất</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-400">{stats.completed}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vps-ivory/40" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm theo tên dự án, khách hàng hoặc producer"
                                className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] py-2.5 pl-10 pr-3 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                            />
                        </div>

                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                            <option value="all">Tất cả trạng thái</option>
                            {Object.values(PROJECT_STATUSES).map((status) => (
                                <option key={status} value={status}>{statusLabels[status] || status}</option>
                            ))}
                        </select>

                        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                            <option value="all">Tất cả ưu tiên</option>
                            {Object.values(PROJECT_PRIORITIES).map((priority) => (
                                <option key={priority} value={priority}>{priorityLabels[priority] || priority}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <LoadingState title="Đang tải dữ liệu project" description="Đang đồng bộ thông tin từ Firestore." />
                ) : error ? (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
                        {error}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <EmptyState
                        title="Chưa có dự án nào"
                        description="Bắt đầu bằng một dự án mới để theo dõi client, producer và tiến độ." />
                ) : (
                    <div className="space-y-6">
                        <div className="grid gap-4 xl:grid-cols-2">
                            {filteredProjects.map((project) => (
                                <div key={project.id} className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 text-vps-gold">
                                                <BriefcaseBusiness className="h-4 w-4" />
                                                <span className="text-xs uppercase tracking-[0.3em]">{project.code || 'PRJ-NEW'}</span>
                                            </div>
                                            <h3 className="mt-2 text-lg font-semibold text-vps-ivory">{project.title}</h3>
                                            <p className="mt-2 text-sm text-vps-ivory/60">{project.summary || 'Chưa có mô tả ngắn.'}</p>
                                        </div>
                                        <StatusBadge label={statusLabels[project.status] || 'Planning'} variant={statusVariant[project.status] || 'neutral'} />
                                    </div>

                                    <div className="mt-5 grid gap-3 text-sm text-vps-ivory/70 sm:grid-cols-2">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-vps-gold" />
                                            {project.clientId ? (
                                                <button
                                                    onClick={() => navigate(`/app/clients/${project.clientId}`)}
                                                    className="text-left text-vps-gold underline"
                                                >
                                                    {project.client || project.clientName}
                                                </button>
                                            ) : (
                                                <span>{project.client || project.clientName}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <UserRound className="h-4 w-4 text-vps-gold" />
                                            <span>{project.producer}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4 text-vps-gold" />
                                            <span>{project.startDate || '---'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-vps-gold" />
                                            <span>{priorityLabels[project.priority] || 'Medium'}</span>
                                        </div>
                                    </div>

                                    {canManageProjects && (
                                        <div className="mt-5 flex flex-wrap justify-end gap-2">
                                            <button
                                                onClick={() => openProjectDetail(project)}
                                                className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40"
                                            >
                                                Mở workspace
                                            </button>
                                            {canManageProjects && (
                                                <button
                                                    onClick={() => openEdit(project)}
                                                    className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40"
                                                >
                                                    Chỉnh sửa
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {activeProject && (
                            <div className="rounded-3xl border border-vps-gray/20 bg-[#151515] p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <p className="text-sm text-vps-gold/70">Project detail workspace</p>
                                        <h3 className="mt-1 text-xl font-semibold text-vps-ivory">{activeProject.title}</h3>
                                        <p className="mt-2 text-sm text-vps-ivory/60">{activeProject.summary || 'Chưa có mô tả chi tiết.'}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {['overview', 'budget', 'tasks', 'production', 'crew', 'equipment', 'checklist', 'files', 'archive', 'notes'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setDetailTab(tab)}
                                                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${detailTab === tab ? 'bg-vps-gold text-vps-black' : 'bg-[#222222] text-vps-ivory/70'}`}
                                            >
                                                {tab === 'overview' ? 'Tổng quan' : tab === 'budget' ? 'Budget' : tab === 'tasks' ? 'Tasks' : tab === 'production' ? 'Production' : tab === 'crew' ? 'Crew' : tab === 'equipment' ? 'Equipment' : tab === 'checklist' ? 'Checklist' : tab === 'files' ? 'File Links' : tab === 'archive' ? 'Archive' : 'Ghi chú'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                                    <div className="rounded-2xl border border-vps-gray/20 bg-[#111111] p-4">
                                        {detailTab === 'overview' && (
                                            <div className="space-y-3 text-sm text-vps-ivory/70">
                                                <div className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2">
                                                    <span>Khách hàng</span>
                                                    {activeProject.clientId ? (
                                                        <button
                                                            onClick={() => navigate(`/app/clients/${activeProject.clientId}`)}
                                                            className="font-semibold text-vps-gold underline"
                                                        >
                                                            {activeProject.client || activeProject.clientName}
                                                        </button>
                                                    ) : (
                                                        <span className="font-semibold text-vps-ivory">{activeProject.client || activeProject.clientName}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2">
                                                    <span>Producer</span>
                                                    <span className="font-semibold text-vps-ivory">{activeProject.producer}</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2">
                                                    <span>Ngày bắt đầu</span>
                                                    <span className="font-semibold text-vps-ivory">{activeProject.startDate || '---'}</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2">
                                                    <span>Ưu tiên</span>
                                                    <span className="font-semibold text-vps-ivory">{priorityLabels[activeProject.priority] || 'Medium'}</span>
                                                </div>
                                            </div>
                                        )}
                                        {detailTab === 'archive' && (
                                            <div className="space-y-4">
                                                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4 text-sm text-vps-ivory/70">
                                                    <p className="font-semibold text-vps-ivory">Archive project</p>
                                                    <p className="mt-2">Tạo bản lưu trữ của dự án kèm ngân sách và file link hiện tại.</p>
                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            onClick={() => handleCreateArchive(activeProject)}
                                                            disabled={archiveBusy}
                                                            className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {archiveBusy ? 'Đang tạo bản lưu trữ...' : 'Tạo bản lưu trữ từ dự án'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}


                                        {detailTab === 'budget' && (
                                            <div className="space-y-3">
                                                <div className="rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3 text-sm text-vps-ivory/70">
                                                    <span>Revenue</span>
                                                    <p className="mt-1 text-lg font-semibold text-emerald-400">{Number(activeFinance.revenue || 0).toLocaleString('vi-VN')} đ</p>
                                                </div>
                                                <div className="rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3 text-sm text-vps-ivory/70">
                                                    <span>Cost</span>
                                                    <p className="mt-1 text-lg font-semibold text-rose-400">{Number(activeFinance.cost || 0).toLocaleString('vi-VN')} đ</p>
                                                </div>
                                                <div className="rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3 text-sm text-vps-ivory/70">
                                                    <span>Profit</span>
                                                    <p className="mt-1 text-lg font-semibold text-vps-gold">{Number(activeFinance.profit || 0).toLocaleString('vi-VN')} đ</p>
                                                </div>
                                            </div>
                                        )}

                                        {detailTab === 'production' && <ProjectProductionTab project={activeProject} />}

                                        {detailTab === 'crew' && <ProjectCrewTab project={activeProject} />}

                                        {detailTab === 'equipment' && <ProjectEquipmentTab project={activeProject} />}

                                        {detailTab === 'checklist' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-vps-gold/70">Checklist từ SOP</p>
                                                        <p className="text-sm text-vps-ivory/60">Completion rate: {activeChecklistProgress.completionRate}%</p>
                                                    </div>
                                                    <button onClick={() => generateChecklist(activeProject)} className="rounded-lg border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm text-vps-ivory">Sinh checklist</button>
                                                </div>

                                                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-3">
                                                    <div className="flex items-center justify-between text-sm text-vps-ivory/70">
                                                        <span>{activeChecklistProgress.completed}/{activeChecklistProgress.total} mục hoàn thành</span>
                                                        <span className="font-semibold text-vps-gold">{activeChecklistProgress.completionRate}%</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {activeChecklist.length === 0 ? (
                                                        <div className="rounded-2xl border border-dashed border-vps-gray/20 p-4 text-sm text-vps-ivory/60">Chưa có checklist. Hãy sinh checklist từ SOP để bắt đầu.</div>
                                                    ) : activeChecklist.map((item) => (
                                                        <label key={item.id} className="flex items-center gap-3 rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm text-vps-ivory">
                                                            <input type="checkbox" checked={Boolean(item.completed)} onChange={() => toggleChecklistItem(activeProject.id, item.id)} className="h-4 w-4 accent-vps-gold" />
                                                            <span className={item.completed ? 'line-through text-vps-ivory/50' : ''}>{item.title}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {detailTab === 'tasks' && (
                                            <div className="space-y-4">
                                                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                                                    <p className="text-sm text-vps-gold/70">Thêm task cho dự án</p>
                                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                        <input
                                                            value={taskDraft.title}
                                                            onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))}
                                                            placeholder="Tiêu đề task"
                                                            className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={taskDraft.dueDate}
                                                            onChange={(event) => setTaskDraft((current) => ({ ...current, dueDate: event.target.value }))}
                                                            className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                                        />
                                                        <input
                                                            value={taskDraft.assignees}
                                                            onChange={(event) => setTaskDraft((current) => ({ ...current, assignees: event.target.value }))}
                                                            placeholder="Assignee (phân cách dấu phẩy)"
                                                            className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                                        />
                                                        <select
                                                            value={taskDraft.priority}
                                                            onChange={(event) => setTaskDraft((current) => ({ ...current, priority: event.target.value }))}
                                                            className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                                        >
                                                            {Object.values(TASK_PRIORITIES).map((priority) => (
                                                                <option key={priority} value={priority}>{priorityLabels[priority] || priority}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="mt-3 flex justify-end">
                                                        <button onClick={() => handleCreateProjectTask(activeProject)} className="rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black">Tạo task</button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {activeTasks.length === 0 ? (
                                                        <div className="rounded-2xl border border-dashed border-vps-gray/20 p-4 text-sm text-vps-ivory/60">Chưa có task nào trong dự án.</div>
                                                    ) : activeTasks.map((task) => (
                                                        <div key={task.id} className="flex flex-col gap-3 rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3 text-sm text-vps-ivory/80 md:flex-row md:items-center md:justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2 text-vps-gold">
                                                                    <CheckSquare className="h-4 w-4" />
                                                                    <span className="font-semibold text-vps-ivory">{task.title}</span>
                                                                </div>
                                                                <p className="mt-1 text-xs text-vps-ivory/60">Due: {task.dueDate || '---'} • Assignees: {(task.assignees || []).join(', ') || 'Chưa phân công'}</p>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <select
                                                                    value={task.status}
                                                                    onChange={(event) => handleProjectTaskStatusChange(task, event.target.value)}
                                                                    className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-xs text-vps-ivory outline-none focus:border-vps-gold"
                                                                >
                                                                    {Object.values(TASK_STATUSES).map((status) => (
                                                                        <option key={status} value={status}>{taskStatusLabels[status] || status}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {detailTab === 'notes' && (
                                            <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4 text-sm text-vps-ivory/70">
                                                <p className="font-semibold text-vps-ivory">Ghi chú project</p>
                                                <p className="mt-2">Có thể dùng khu vực này để ghi chú nội bộ, checklist liên quan hoặc liên kết với SOP đang áp dụng.</p>
                                            </div>
                                        )}

                                        {detailTab === 'files' && (
                                            <div className="space-y-4">
                                                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                                                    <p className="text-sm text-vps-gold/70">Thêm file link</p>
                                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                        <input
                                                            value={fileLinkDraft.title}
                                                            onChange={(event) => setFileLinkDraft((current) => ({ ...current, title: event.target.value }))}
                                                            placeholder="Tên link"
                                                            className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                                        />
                                                        <input
                                                            value={fileLinkDraft.url}
                                                            onChange={(event) => setFileLinkDraft((current) => ({ ...current, url: event.target.value }))}
                                                            placeholder="https://..."
                                                            className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                                        />
                                                    </div>
                                                    <textarea
                                                        rows="2"
                                                        value={fileLinkDraft.note}
                                                        onChange={(event) => setFileLinkDraft((current) => ({ ...current, note: event.target.value }))}
                                                        placeholder="Ghi chú"
                                                        className="mt-3 w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                                    />
                                                    <div className="mt-3 flex justify-end">
                                                        <button onClick={() => handleAddFileLink(activeProject)} className="rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black">Lưu link</button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {activeFileLinks.length === 0 ? (
                                                        <div className="rounded-2xl border border-dashed border-vps-gray/20 p-4 text-sm text-vps-ivory/60">Chưa có file link.</div>
                                                    ) : activeFileLinks.map((item) => (
                                                        <div key={item.id} className="rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3 text-sm text-vps-ivory/80">
                                                            <p className="font-semibold text-vps-ivory">{item.title}</p>
                                                            <a href={item.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-vps-gold underline">{item.url}</a>
                                                            {item.note ? <p className="mt-1 text-xs text-vps-ivory/60">{item.note}</p> : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-vps-gray/20 bg-[#111111] p-4">
                                        <div className="flex items-center gap-2 text-vps-gold">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm uppercase tracking-[0.3em]">SOP mapping</span>
                                        </div>
                                        <div className="mt-4 space-y-3 text-sm text-vps-ivory/70">
                                            {sops.length === 0 ? (
                                                <p>Chưa có SOP nào để gắn.</p>
                                            ) : sops.map((sop) => (
                                                <div key={sop.id} className={`rounded-xl border px-3 py-2 ${activeProject.sopId === sop.id ? 'border-vps-gold/40 bg-vps-gold/10' : 'border-vps-gray/20 bg-[#181818]'}`}>
                                                    <p className="font-semibold text-vps-ivory">{sop.title}</p>
                                                    <p className="mt-1 text-xs text-vps-ivory/60">{sop.summary || 'SOP đang chờ áp dụng cho dự án.'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
                    <div className="w-full max-w-2xl rounded-3xl border border-vps-gray/20 bg-[#151515] p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-vps-gold/70">Project form</p>
                                <h3 className="text-xl font-semibold text-vps-ivory">{editingId ? 'Cập nhật dự án' : 'Tạo dự án mới'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="rounded-lg bg-[#222222] px-3 py-2 text-sm text-vps-ivory">Đóng</button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Tên dự án</label>
                                    <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Chọn khách hàng</label>
                                    <select
                                        value={form.clientId}
                                        onChange={(event) => {
                                            const nextClientId = event.target.value;
                                            const selected = clients.find((item) => item.id === nextClientId);
                                            setForm({
                                                ...form,
                                                clientId: nextClientId,
                                                clientName: selected ? selected.name : form.clientName,
                                                client: selected ? selected.name : form.client,
                                            });
                                        }}
                                        className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                    >
                                        <option value="">Nhập tay tên khách hàng</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Tên khách hàng (fallback)</label>
                                    <input
                                        value={form.clientName}
                                        onChange={(event) => setForm({ ...form, clientName: event.target.value, client: event.target.value })}
                                        required
                                        className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Producer</label>
                                    <input value={form.producer} onChange={(event) => setForm({ ...form, producer: event.target.value })} required className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Ngày bắt đầu</label>
                                    <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Trạng thái</label>
                                    <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                                        {Object.values(PROJECT_STATUSES).map((status) => (
                                            <option key={status} value={status}>{statusLabels[status] || status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Ưu tiên</label>
                                    <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                                        {Object.values(PROJECT_PRIORITIES).map((priority) => (
                                            <option key={priority} value={priority}>{priorityLabels[priority] || priority}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-vps-ivory/70">Gắn SOP</label>
                                <select value={form.sopId} onChange={(event) => setForm({ ...form, sopId: event.target.value })} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                                    <option value="">Không gắn SOP</option>
                                    {sops.map((sop) => (
                                        <option key={sop.id} value={sop.id}>{sop.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-vps-ivory/70">Tóm tắt công việc</label>
                                <textarea rows="4" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                            </div>

                            {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-vps-gray/20 px-4 py-2.5 text-sm text-vps-ivory">Hủy</button>
                                <button type="submit" className="rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black">Lưu dự án</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default Projects;
