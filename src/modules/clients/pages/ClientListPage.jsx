import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppShell from '../../../components/AppShell';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';
import { useToast } from '../../../components/ui/ToastProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS, hasAnyPermission } from '../../../constants/permissions';
import { isManagementRole } from '../../../constants/roles';
import {
    createClient,
    listClients,
    softDeleteClient,
    updateClient,
} from '../clientService';
import {
    createClientContact,
} from '../clientContactService';
import ClientCard from '../components/ClientCard';
import ClientFilters from '../components/ClientFilters';
import ClientFormDrawer from '../components/ClientFormDrawer';

const ClientListPage = () => {
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const { currentUser, userRole } = useAuth();

    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [type, setType] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [saving, setSaving] = useState(false);

    const canCreate = hasAnyPermission(userRole, [PERMISSIONS.CLIENT_CREATE]) || isManagementRole(userRole);
    const canUpdate = hasAnyPermission(userRole, [PERMISSIONS.CLIENT_UPDATE]) || isManagementRole(userRole);
    const canDelete = hasAnyPermission(userRole, [PERMISSIONS.CLIENT_DELETE]) || isManagementRole(userRole);

    const titleStats = useMemo(() => {
        return {
            total: clients.length,
            active: clients.filter((item) => item.status === 'active').length,
            vip: clients.filter((item) => item.status === 'vip').length,
        };
    }, [clients]);

    const loadData = async () => {
        setLoading(true);
        try {
            const rows = await listClients({
                search,
                status: status === 'all' ? null : status,
                type: type === 'all' ? null : type,
            });
            setClients(rows);
        } catch (error) {
            pushToast(error.message || 'Không thể tải danh sách khách hàng.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [search, status, type]);

    const handleOpenCreate = () => {
        setEditingClient(null);
        setDrawerOpen(true);
    };

    const handleOpenEdit = (client) => {
        setEditingClient(client);
        setDrawerOpen(true);
    };

    const handleSubmitClient = async ({ client, primaryContact }) => {
        try {
            setSaving(true);
            const userId = currentUser?.uid || null;

            if (editingClient?.id) {
                await updateClient(editingClient.id, client, userId);

                if (primaryContact.name) {
                    await createClientContact({
                        ...primaryContact,
                        clientId: editingClient.id,
                    }, userId);
                }

                pushToast('Cập nhật khách hàng thành công.', 'success');
            } else {
                const created = await createClient(client, userId);

                if (primaryContact.name) {
                    const createdContact = await createClientContact({
                        ...primaryContact,
                        clientId: created.id,
                    }, userId);

                    await updateClient(created.id, { primaryContactId: createdContact.id }, userId);
                }

                pushToast('Tạo khách hàng thành công.', 'success');
            }

            setDrawerOpen(false);
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể lưu khách hàng.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSoftDelete = async (client) => {
        const ok = window.confirm(`Xác nhận chuyển khách hàng "${client.name}" sang archived?`);
        if (!ok) return;

        try {
            await softDeleteClient(client.id, currentUser?.uid || null);
            pushToast('Đã lưu trữ khách hàng.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể xóa mềm khách hàng.', 'error');
        }
    };

    return (
        <AppShell title="Clients" subtitle="CRM khách hàng: danh sách, trạng thái và thông tin liên hệ">
            <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Tổng khách hàng</p>
                        <p className="mt-2 text-2xl font-semibold text-vps-ivory">{titleStats.total}</p>
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Đang active</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-400">{titleStats.active}</p>
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">VIP</p>
                        <p className="mt-2 text-2xl font-semibold text-vps-gold">{titleStats.vip}</p>
                    </div>
                </div>

                <ClientFilters
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    type={type}
                    onTypeChange={setType}
                    onCreate={handleOpenCreate}
                    canCreate={canCreate}
                />

                {loading ? (
                    <LoadingState title="Đang tải danh sách khách hàng" description="Đang đồng bộ dữ liệu từ Firestore." />
                ) : clients.length === 0 ? (
                    <EmptyState title="Chưa có khách hàng" description="Tạo khách hàng đầu tiên để bắt đầu quản lý CRM." />
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {clients.map((client) => (
                            <div key={client.id} className="space-y-2">
                                <ClientCard
                                    client={client}
                                    onOpen={() => navigate(`/app/clients/${client.id}`)}
                                    onEdit={handleOpenEdit}
                                    canUpdate={canUpdate}
                                />
                                {canDelete ? (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleSoftDelete(client)}
                                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300"
                                        >
                                            Xóa mềm
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}

                <ClientFormDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    initialClient={editingClient}
                    onSubmit={handleSubmitClient}
                    submitting={saving}
                />
            </div>
        </AppShell>
    );
};

export default ClientListPage;