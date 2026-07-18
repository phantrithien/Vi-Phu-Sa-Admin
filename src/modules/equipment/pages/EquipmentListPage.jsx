import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppShell from '../../../components/AppShell';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';
import { useToast } from '../../../components/ui/ToastProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS, hasAnyPermission } from '../../../constants/permissions';
import { isManagementRole } from '../../../constants/roles';
import { createEquipment, deleteEquipment, listEquipment, updateEquipment } from '../equipmentService';
import EquipmentCard from '../components/EquipmentCard';
import EquipmentFilters from '../components/EquipmentFilters';
import EquipmentFormDrawer from '../components/EquipmentFormDrawer';

const EquipmentListPage = () => {
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const { currentUser, userRole } = useAuth();

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [category, setCategory] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);

    const canCreate = hasAnyPermission(userRole, [PERMISSIONS.EQUIPMENT_CREATE]) || isManagementRole(userRole);
    const canUpdate = hasAnyPermission(userRole, [PERMISSIONS.EQUIPMENT_UPDATE]) || isManagementRole(userRole);
    const canDelete = hasAnyPermission(userRole, [PERMISSIONS.EQUIPMENT_DELETE]) || isManagementRole(userRole);

    const stats = useMemo(() => ({
        total: items.length,
        available: items.filter((item) => item.status === 'available').length,
        booked: items.filter((item) => item.status === 'booked').length,
    }), [items]);

    const loadData = async () => {
        setLoading(true);
        try {
            const rows = await listEquipment({ search, status: status === 'all' ? null : status, category: category === 'all' ? null : category });
            setItems(rows);
        } catch (error) {
            pushToast(error.message || 'Không thể tải danh sách thiết bị.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [search, status, category]);

    const handleOpenCreate = () => { setEditingItem(null); setDrawerOpen(true); };
    const handleOpenEdit = (item) => { setEditingItem(item); setDrawerOpen(true); };

    const handleSubmit = async (payload) => {
        try {
            setSaving(true);
            const userId = currentUser?.uid || null;
            if (editingItem?.id) {
                await updateEquipment(editingItem.id, payload, userId);
                pushToast('Cập nhật thiết bị thành công.', 'success');
            } else {
                await createEquipment(payload, userId);
                pushToast('Tạo thiết bị thành công.', 'success');
            }
            setDrawerOpen(false);
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể lưu thiết bị.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Xác nhận xóa thiết bị "${item.name}"?`)) return;
        try {
            await deleteEquipment(item.id);
            pushToast('Đã xóa thiết bị.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể xóa thiết bị.', 'error');
        }
    };

    return (
        <AppShell title="Equipment" subtitle="Quản lý thiết bị, booking và lịch sử bảo trì">
            <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4"><p className="text-sm text-vps-ivory/60">Tổng thiết bị</p><p className="mt-2 text-2xl font-semibold text-vps-ivory">{stats.total}</p></div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4"><p className="text-sm text-vps-ivory/60">Available</p><p className="mt-2 text-2xl font-semibold text-emerald-400">{stats.available}</p></div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4"><p className="text-sm text-vps-ivory/60">Booked</p><p className="mt-2 text-2xl font-semibold text-vps-gold">{stats.booked}</p></div>
                </div>

                <EquipmentFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} category={category} onCategoryChange={setCategory} onCreate={handleOpenCreate} canCreate={canCreate} />

                {loading ? (
                    <LoadingState title="Đang tải danh sách thiết bị" description="Đang đồng bộ dữ liệu từ Firestore." />
                ) : items.length === 0 ? (
                    <EmptyState title="Chưa có thiết bị" description="Thêm thiết bị đầu tiên để bắt đầu quản lý kho." />
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {items.map((item) => (
                            <div key={item.id} className="space-y-2">
                                <EquipmentCard equipment={item} onOpen={() => navigate(`/app/equipment/${item.id}`)} onEdit={handleOpenEdit} canUpdate={canUpdate} />
                                {canDelete ? (
                                    <div className="flex justify-end">
                                        <button onClick={() => handleDelete(item)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">Xóa</button>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}

                <EquipmentFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} initialEquipment={editingItem} onSubmit={handleSubmit} submitting={saving} />
            </div>
        </AppShell>
    );
};

export default EquipmentListPage;
