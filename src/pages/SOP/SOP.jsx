import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Copy, FileText, Plus, Search, Sparkles, Trash2 } from 'lucide-react';

import AppShell from '../../components/AppShell';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/ToastProvider';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../constants/permissions';
import { hasAnyPermission } from '../../constants/permissions';
import { SOP_CATEGORIES, SOP_STATUSES, createSop, listSops, updateSop, archiveSop, duplicateSop } from '../../services/sopService';

const createStep = (step = {}) => ({
    id: step.id || `step-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: step.title || '',
});

const initialForm = {
    title: '',
    category: SOP_CATEGORIES.OPERATIONS,
    status: SOP_STATUSES.ACTIVE,
    summary: '',
    steps: [createStep()],
};

const categoryLabels = {
    [SOP_CATEGORIES.OPERATIONS]: 'Operations',
    [SOP_CATEGORIES.FINANCE]: 'Finance',
    [SOP_CATEGORIES.HR]: 'HR',
    [SOP_CATEGORIES.MARKETING]: 'Marketing',
};

const statusLabels = {
    [SOP_STATUSES.DRAFT]: 'Draft',
    [SOP_STATUSES.ACTIVE]: 'Active',
    [SOP_STATUSES.ARCHIVED]: 'Archived',
};

const statusVariant = {
    [SOP_STATUSES.DRAFT]: 'warning',
    [SOP_STATUSES.ACTIVE]: 'success',
    [SOP_STATUSES.ARCHIVED]: 'neutral',
};

const SOP = () => {
    const { userRole } = useAuth();
    const { pushToast } = useToast();
    const [sops, setSops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(initialForm);

    const canManageSops = hasAnyPermission(userRole, [PERMISSIONS.SOP, PERMISSIONS.MANAGE_TASKS]);

    const loadSops = async () => {
        setLoading(true);
        setError('');
        try {
            const rows = await listSops();
            setSops(rows);
        } catch (err) {
            setError(err.message || 'Không thể tải SOP.');
            pushToast(err.message || 'Không thể tải SOP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSops();
    }, []);

    const filteredSops = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return sops;

        return sops.filter((item) => {
            return [item.title, item.category, item.summary, item.steps?.map((step) => step.title).join(' ') || '']
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(term);
        });
    }, [sops, search]);

    const openCreate = () => {
        setEditingId(null);
        setForm(initialForm);
        setError('');
        setIsModalOpen(true);
    };

    const openEdit = (sop) => {
        setEditingId(sop.id);
        setForm({
            title: sop.title || '',
            category: sop.category || SOP_CATEGORIES.OPERATIONS,
            status: sop.status || SOP_STATUSES.ACTIVE,
            summary: sop.summary || '',
            steps: Array.isArray(sop.steps) && sop.steps.length > 0
                ? sop.steps.map((step) => createStep(step))
                : [createStep()],
        });
        setError('');
        setIsModalOpen(true);
    };

    const updateStep = (index, value) => {
        setForm((current) => ({
            ...current,
            steps: current.steps.map((step, itemIndex) => (
                itemIndex === index ? { ...step, title: value } : step
            )),
        }));
    };

    const addStep = () => {
        setForm((current) => ({ ...current, steps: [...current.steps, createStep()] }));
    };

    const removeStep = (index) => {
        if (form.steps.length === 1) return;
        setForm((current) => ({
            ...current,
            steps: current.steps.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const payload = {
                title: form.title.trim(),
                category: form.category,
                status: form.status,
                summary: form.summary.trim(),
                steps: form.steps.filter((step) => step.title.trim()).map((step) => ({ title: step.title.trim() })),
            };

            if (!payload.title || payload.steps.length === 0) {
                setError('Vui lòng nhập tiêu đề SOP và ít nhất một bước thực hiện.');
                return;
            }

            if (editingId) {
                await updateSop(editingId, payload);
                pushToast('Cập nhật SOP thành công.', 'success');
            } else {
                await createSop(payload);
                pushToast('Tạo SOP thành công.', 'success');
            }

            await loadSops();
            setIsModalOpen(false);
        } catch (err) {
            setError(err.message || 'Không thể lưu SOP.');
            pushToast(err.message || 'Không thể lưu SOP.', 'error');
        }
    };

    const handleArchive = async (id) => {
        if (!window.confirm('Bạn chắc chắn muốn lưu trữ SOP này?')) {
            return;
        }

        try {
            await archiveSop(id);
            await loadSops();
            pushToast('Đã lưu trữ SOP.', 'success');
        } catch (err) {
            setError(err.message || 'Không thể lưu trữ SOP.');
            pushToast(err.message || 'Không thể lưu trữ SOP.', 'error');
        }
    };

    const handleDuplicate = async (id) => {
        if (!window.confirm('Bạn muốn nhân bản SOP này thành bản nháp mới?')) {
            return;
        }

        try {
            await duplicateSop(id);
            await loadSops();
            pushToast('Đã nhân bản SOP thành công.', 'success');
        } catch (err) {
            setError(err.message || 'Không thể nhân bản SOP.');
            pushToast(err.message || 'Không thể nhân bản SOP.', 'error');
        }
    };

    return (
        <AppShell title="SOP Library" subtitle="Quản lý quy trình vận hành và checklist nội bộ">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm text-vps-gold/70">MVP SOP Workspace</p>
                        <h2 className="text-2xl font-semibold text-vps-ivory">Kho quy trình</h2>
                        <p className="mt-1 text-sm text-vps-ivory/60">Theo dõi quy trình vận hành, tài liệu và bước thực hiện cho mỗi phòng ban.</p>
                    </div>

                    {canManageSops && (
                        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-vps-gold px-4 py-2.5 font-semibold text-vps-black transition-transform hover:scale-[1.01]">
                            <Plus className="h-4 w-4" />
                            Tạo SOP mới
                        </button>
                    )}
                </div>

                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vps-ivory/40" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm theo tiêu đề SOP hoặc bước thực hiện"
                            className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] py-2.5 pl-10 pr-3 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                        />
                    </div>
                </div>

                {loading ? (
                    <LoadingState title="Đang tải SOP" description="Đang kết nối đến Firestore để tải quy trình nội bộ." />
                ) : error ? (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>
                ) : filteredSops.length === 0 ? (
                    <EmptyState title="Chưa có SOP nào" description="Tạo quy trình đầu tiên để chuẩn hóa vận hành và onboarding." />
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {filteredSops.map((sop) => (
                            <div key={sop.id} className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-vps-gold">
                                            <BookOpen className="h-4 w-4" />
                                            <span className="text-xs uppercase tracking-[0.3em]">{categoryLabels[sop.category] || sop.category}</span>
                                        </div>
                                        <h3 className="mt-2 text-lg font-semibold text-vps-ivory">{sop.title}</h3>
                                        <p className="mt-2 text-sm text-vps-ivory/60">{sop.summary || 'Chưa có mô tả ngắn.'}</p>
                                    </div>
                                    <StatusBadge label={statusLabels[sop.status] || 'Active'} variant={statusVariant[sop.status] || 'neutral'} />
                                </div>

                                <div className="mt-5 space-y-2">
                                    {sop.steps?.slice(0, 4).map((step, index) => (
                                        <div key={`${sop.id}-${index}`} className="flex items-start gap-2 rounded-xl bg-[#111111] px-3 py-2 text-sm text-vps-ivory/70">
                                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-vps-gold" />
                                            <span>{step.title}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 flex justify-end gap-2">
                                    {canManageSops && (
                                        <>
                                            <button onClick={() => openEdit(sop)} className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40">Chỉnh sửa</button>
                                            <button onClick={() => handleDuplicate(sop.id)} className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40">
                                                <Copy className="mr-1 inline h-4 w-4" /> Duplicate
                                            </button>
                                            {sop.status !== SOP_STATUSES.ARCHIVED && (
                                                <button onClick={() => handleArchive(sop.id)} className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 transition-colors hover:border-rose-500/40">
                                                    <Trash2 className="mr-1 inline h-4 w-4" /> Lưu trữ
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-vps-gray/20 bg-[#151515] p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-vps-gold/70">SOP form</p>
                                <h3 className="text-xl font-semibold text-vps-ivory">{editingId ? 'Cập nhật SOP' : 'Tạo SOP mới'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="rounded-lg bg-[#222222] px-3 py-2 text-sm text-vps-ivory">Đóng</button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Tiêu đề SOP</label>
                                    <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Danh mục</label>
                                    <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                                        {Object.values(SOP_CATEGORIES).map((category) => (
                                            <option key={category} value={category}>{categoryLabels[category] || category}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm text-vps-ivory/70">Trạng thái</label>
                                    <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold">
                                        {Object.values(SOP_STATUSES).map((status) => (
                                            <option key={status} value={status}>{statusLabels[status] || status}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-vps-ivory/70">Tóm tắt</label>
                                <textarea rows="3" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-vps-ivory/70">Các bước thực hiện</label>
                                    <button type="button" onClick={addStep} className="rounded-lg border border-vps-gray/20 px-3 py-1.5 text-sm text-vps-ivory">+ Thêm bước</button>
                                </div>
                                {form.steps.map((step, index) => (
                                    <div key={step.id} className="flex items-center gap-2">
                                        <input value={step.title} onChange={(event) => updateStep(index, event.target.value)} placeholder={`Bước ${index + 1}`} className="flex-1 rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold" />
                                        {form.steps.length > 1 && (
                                            <button type="button" onClick={() => removeStep(index)} className="rounded-lg border border-rose-500/20 px-3 py-2 text-sm text-rose-300">Xóa</button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-vps-gray/20 px-4 py-2.5 text-sm text-vps-ivory">Hủy</button>
                                <button type="submit" className="rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black">Lưu SOP</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default SOP;
