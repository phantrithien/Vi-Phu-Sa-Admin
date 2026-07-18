import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppShell from '../../../components/AppShell';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';
import { useToast } from '../../../components/ui/ToastProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS, hasAnyPermission } from '../../../constants/permissions';
import { isManagementRole } from '../../../constants/roles';
import { createCrew, deleteCrew, listCrew, updateCrew } from '../crewService';
import CrewCard from '../components/CrewCard';
import CrewFilters from '../components/CrewFilters';
import CrewFormDrawer from '../components/CrewFormDrawer';

const CrewListPage = () => {
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const { currentUser, userRole } = useAuth();

    const [loading, setLoading] = useState(true);
    const [crewList, setCrewList] = useState([]);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [role, setRole] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingCrew, setEditingCrew] = useState(null);
    const [saving, setSaving] = useState(false);

    const canCreate = hasAnyPermission(userRole, [PERMISSIONS.CREW_CREATE]) || isManagementRole(userRole);
    const canUpdate = hasAnyPermission(userRole, [PERMISSIONS.CREW_UPDATE]) || isManagementRole(userRole);
    const canDelete = hasAnyPermission(userRole, [PERMISSIONS.CREW_DELETE]) || isManagementRole(userRole);

    const stats = useMemo(() => ({
        total: crewList.length,
        available: crewList.filter((item) => item.status === 'available').length,
        busy: crewList.filter((item) => item.status === 'busy').length,
    }), [crewList]);

    const loadData = async () => {
        setLoading(true);
        try {
            const rows = await listCrew({ search, status: status === 'all' ? null : status, role: role === 'all' ? null : role });
            setCrewList(rows);
        } catch (error) {
            pushToast(error.message || 'Không thể tải danh sách crew.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [search, status, role]);

    const handleOpenCreate = () => { setEditingCrew(null); setDrawerOpen(true); };
    const handleOpenEdit = (crew) => { setEditingCrew(crew); setDrawerOpen(true); };

    const handleSubmit = async (payload) => {
        try {
            setSaving(true);
            const userId = currentUser?.uid || null;
            if (editingCrew?.id) {
                await updateCrew(editingCrew.id, payload, userId);
                pushToast('Cập nhật crew thành công.', 'success');
            } else {
                await createCrew(payload, userId);
                pushToast('Tạo crew thành công.', 'success');
            }
            setDrawerOpen(false);
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể lưu crew.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (crew) => {
        if (!window.confirm(`Xác nhận xóa crew "${crew.name}"?`)) return;
        try {
            await deleteCrew(crew.id);
            pushToast('Đã xóa crew.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể xóa crew.', 'error');
        }
    };

    return (
        <AppShell title="Crew / Freelancer" subtitle="Quản lý nhân sự, freelancer và lịch sử tham gia dự án">
            <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4"><p className="text-sm text-vps-ivory/60">Tổng crew</p><p className="mt-2 text-2xl font-semibold text-vps-ivory">{stats.total}</p></div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4"><p className="text-sm text-vps-ivory/60">Available</p><p className="mt-2 text-2xl font-semibold text-emerald-400">{stats.available}</p></div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4"><p className="text-sm text-vps-ivory/60">Busy</p><p className="mt-2 text-2xl font-semibold text-vps-gold">{stats.busy}</p></div>
                </div>

                <CrewFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} role={role} onRoleChange={setRole} onCreate={handleOpenCreate} canCreate={canCreate} />

                {loading ? (
                    <LoadingState title="Đang tải danh sách crew" description="Đang đồng bộ dữ liệu từ Firestore." />
                ) : crewList.length === 0 ? (
                    <EmptyState title="Chưa có crew" description="Tạo crew đầu tiên để bắt đầu quản lý nhân sự/freelancer." />
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {crewList.map((crew) => (
                            <div key={crew.id} className="space-y-2">
                                <CrewCard crew={crew} onOpen={() => navigate(`/app/crew/${crew.id}`)} onEdit={handleOpenEdit} canUpdate={canUpdate} />
                                {canDelete ? (
                                    <div className="flex justify-end">
                                        <button onClick={() => handleDelete(crew)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">Xóa</button>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}

                <CrewFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} initialCrew={editingCrew} onSubmit={handleSubmit} submitting={saving} />
            </div>
        </AppShell>
    );
};

export default CrewListPage;
