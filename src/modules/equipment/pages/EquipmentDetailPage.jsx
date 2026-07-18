import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import AppShell from '../../../components/AppShell';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';
import { useToast } from '../../../components/ui/ToastProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS, hasAnyPermission } from '../../../constants/permissions';
import { isManagementRole } from '../../../constants/roles';
import { listProjects } from '../../../services/projectService';
import { getEquipmentById, updateEquipment } from '../equipmentService';
import { listEquipmentBookingsByEquipment } from '../equipmentBookingService';
import { createMaintenanceLog, deleteMaintenanceLog, listMaintenanceLogsByEquipment } from '../equipmentMaintenanceService';
import EquipmentOverview from '../components/EquipmentOverview';
import EquipmentBookingHistory from '../components/EquipmentBookingHistory';
import EquipmentMaintenanceLog from '../components/EquipmentMaintenanceLog';

const EquipmentDetailPage = () => {
    const { equipmentId } = useParams();
    const { pushToast } = useToast();
    const { currentUser, userRole } = useAuth();

    const [loading, setLoading] = useState(true);
    const [equipment, setEquipment] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [logs, setLogs] = useState([]);
    const [projects, setProjects] = useState([]);

    const canManage = hasAnyPermission(userRole, [PERMISSIONS.EQUIPMENT_UPDATE]) || isManagementRole(userRole);
    const projectNames = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project.title])), [projects]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [equipmentData, bookingRows, logRows, projectRows] = await Promise.all([
                getEquipmentById(equipmentId),
                listEquipmentBookingsByEquipment(equipmentId),
                listMaintenanceLogsByEquipment(equipmentId),
                listProjects(),
            ]);
            setEquipment(equipmentData);
            setBookings(bookingRows);
            setLogs(logRows);
            setProjects(projectRows);
        } catch (error) {
            pushToast(error.message || 'Không thể tải hồ sơ thiết bị.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [equipmentId]);

    const handleStatusChange = async (status) => {
        try {
            await updateEquipment(equipmentId, { ...equipment, status }, currentUser?.uid || null);
            pushToast('Đã cập nhật trạng thái thiết bị.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể cập nhật trạng thái.', 'error');
        }
    };

    const handleCreateLog = async (payload) => {
        try {
            await createMaintenanceLog({ ...payload, equipmentId }, currentUser?.uid || null);
            pushToast('Đã ghi log bảo trì.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể ghi log.', 'error');
        }
    };

    const handleDeleteLog = async (logId) => {
        if (!window.confirm('Xác nhận xóa log này?')) return;
        try {
            await deleteMaintenanceLog(logId);
            pushToast('Đã xóa log.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể xóa log.', 'error');
        }
    };

    if (loading) {
        return <AppShell title="Equipment Detail" subtitle="Đang tải hồ sơ thiết bị"><LoadingState title="Đang tải hồ sơ" /></AppShell>;
    }

    if (!equipment) {
        return <AppShell title="Equipment Detail"><EmptyState title="Không tìm thấy thiết bị" description="Thiết bị có thể đã bị xóa." /></AppShell>;
    }

    return (
        <AppShell title="Equipment Detail" subtitle={equipment.name}>
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5">
                    <EquipmentOverview equipment={equipment} canManage={canManage} onStatusChange={handleStatusChange} />
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#151515] p-5">
                        <p className="mb-3 text-sm text-vps-gold/70">Lịch sử booking</p>
                        <EquipmentBookingHistory bookings={bookings} projectNames={projectNames} />
                    </div>
                </div>
                <div className="rounded-2xl border border-vps-gray/20 bg-[#151515] p-5">
                    <p className="mb-3 text-sm text-vps-gold/70">Bảo trì / hư hỏng</p>
                    <EquipmentMaintenanceLog logs={logs} canManage={canManage} onCreate={handleCreateLog} onDelete={handleDeleteLog} />
                </div>
            </div>
        </AppShell>
    );
};

export default EquipmentDetailPage;
