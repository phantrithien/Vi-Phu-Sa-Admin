import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AppShell from '../../../components/AppShell';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';
import { useToast } from '../../../components/ui/ToastProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS, hasAnyPermission } from '../../../constants/permissions';
import { isManagementRole } from '../../../constants/roles';
import { listProjects } from '../../../services/projectService';
import { getClientById, updateClient } from '../clientService';
import {
    createClientContact,
    deleteClientContact,
    listClientContacts,
    updateClientContact,
} from '../clientContactService';
import {
    createClientNote,
    deleteClientNote,
    listClientNotes,
} from '../clientNoteService';
import ClientContactList from '../components/ClientContactList';
import ClientNoteList from '../components/ClientNoteList';
import ClientOverview from '../components/ClientOverview';
import ClientProjectHistory from '../components/ClientProjectHistory';

const ClientDetailPage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const { currentUser, userRole } = useAuth();

    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [notes, setNotes] = useState([]);
    const [projects, setProjects] = useState([]);

    const canUpdate = hasAnyPermission(userRole, [PERMISSIONS.CLIENT_UPDATE]) || isManagementRole(userRole);
    const canDelete = hasAnyPermission(userRole, [PERMISSIONS.CLIENT_DELETE]) || isManagementRole(userRole);

    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    }, [projects]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [clientData, contactRows, noteRows, projectRows] = await Promise.all([
                getClientById(clientId),
                listClientContacts(clientId),
                listClientNotes(clientId),
                listProjects(),
            ]);

            if (!clientData) {
                setClient(null);
                return;
            }

            setClient(clientData);
            setContacts(contactRows);
            setNotes(noteRows);

            const relatedProjects = projectRows.filter((item) => {
                const byId = item.clientId && item.clientId === clientId;
                const byName = item.client && clientData.name && String(item.client).trim().toLowerCase() === clientData.name.trim().toLowerCase();
                return byId || byName;
            });

            setProjects(relatedProjects);
        } catch (error) {
            pushToast(error.message || 'Không thể tải hồ sơ khách hàng.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [clientId]);

    const handleCreateContact = async (payload) => {
        try {
            const userId = currentUser?.uid || null;
            const contact = await createClientContact({ ...payload, clientId }, userId);
            if (contact.isPrimary) {
                await updateClient(clientId, { primaryContactId: contact.id }, userId);
            }
            pushToast('Đã thêm người liên hệ.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể thêm người liên hệ.', 'error');
        }
    };

    const handleUpdateContact = async (contactRowId, payload) => {
        try {
            const userId = currentUser?.uid || null;
            await updateClientContact(contactRowId, { ...payload, clientId }, userId);
            if (payload.isPrimary) {
                await updateClient(clientId, { primaryContactId: contactRowId }, userId);
            }
            pushToast('Đã cập nhật người liên hệ.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể cập nhật người liên hệ.', 'error');
        }
    };

    const handleDeleteContact = async (contactRowId) => {
        if (!window.confirm('Xác nhận xóa contact này?')) return;

        try {
            await deleteClientContact(contactRowId);
            pushToast('Đã xóa người liên hệ.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể xóa người liên hệ.', 'error');
        }
    };

    const handleCreateNote = async (content) => {
        try {
            await createClientNote({ clientId, content, type: 'care' }, currentUser?.uid || null);
            pushToast('Đã thêm ghi chú chăm sóc khách.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể thêm ghi chú.', 'error');
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Xác nhận xóa ghi chú này?')) return;

        try {
            await deleteClientNote(noteId);
            pushToast('Đã xóa ghi chú.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể xóa ghi chú.', 'error');
        }
    };

    if (loading) {
        return (
            <AppShell title="Client Detail" subtitle="Đang tải hồ sơ khách hàng">
                <LoadingState title="Đang tải hồ sơ" description="Vui lòng chờ trong giây lát." />
            </AppShell>
        );
    }

    if (!client) {
        return (
            <AppShell title="Client Detail" subtitle="Không tìm thấy khách hàng">
                <EmptyState title="Không tìm thấy khách hàng" description="Khách hàng có thể đã bị xóa mềm hoặc không tồn tại." />
            </AppShell>
        );
    }

    return (
        <AppShell title={client.name} subtitle="Hồ sơ khách hàng, liên hệ, note chăm sóc và lịch sử dự án">
            <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#111111] p-4">
                        <h3 className="mb-3 text-lg font-semibold text-vps-ivory">Tổng quan khách hàng</h3>
                        <ClientOverview client={client} />
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#111111] p-4">
                        <h3 className="mb-3 text-lg font-semibold text-vps-ivory">Lịch sử project</h3>
                        <ClientProjectHistory
                            projects={sortedProjects}
                            onOpenProject={() => navigate('/app/projects')}
                        />
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#111111] p-4">
                        <h3 className="mb-3 text-lg font-semibold text-vps-ivory">Người liên hệ</h3>
                        <ClientContactList
                            contacts={contacts}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            onCreate={handleCreateContact}
                            onUpdate={handleUpdateContact}
                            onDelete={handleDeleteContact}
                        />
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#111111] p-4">
                        <h3 className="mb-3 text-lg font-semibold text-vps-ivory">Ghi chú chăm sóc khách</h3>
                        <ClientNoteList
                            notes={notes}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            onCreate={handleCreateNote}
                            onDelete={handleDeleteNote}
                        />
                    </div>
                </div>
            </div>
        </AppShell>
    );
};

export default ClientDetailPage;