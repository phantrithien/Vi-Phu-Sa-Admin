import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/ToastProvider';
import { PERMISSIONS, hasAnyPermission } from '../../../constants/permissions';
import { isManagementRole } from '../../../constants/roles';
import { listEquipment } from '../../equipment/equipmentService';
import { createEquipmentBooking, deleteEquipmentBooking, listEquipmentBookingsByProject } from '../../equipment/equipmentBookingService';
import EquipmentBookingDrawer from '../../equipment/components/EquipmentBookingDrawer';

const ProjectEquipmentTab = ({ project }) => {
    const { currentUser, userRole } = useAuth();
    const { pushToast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [equipmentOptions, setEquipmentOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const canManage = hasAnyPermission(userRole, [PERMISSIONS.EQUIPMENT_BOOK, PERMISSIONS.EQUIPMENT_UPDATE]) || isManagementRole(userRole);
    const equipmentNames = useMemo(() => Object.fromEntries(equipmentOptions.map((item) => [item.id, item.name])), [equipmentOptions]);

    const load = async () => {
        setLoading(true);
        try {
            const [bookingRows, equipmentRows] = await Promise.all([listEquipmentBookingsByProject(project.id), listEquipment()]);
            setBookings(bookingRows);
            setEquipmentOptions(equipmentRows);
        } catch (error) {
            pushToast(error.message || 'Không thể tải thiết bị của dự án.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [project.id]);

    const handleBook = async (payload) => {
        try {
            await createEquipmentBooking({ ...payload, projectId: project.id }, currentUser?.uid);
            pushToast('Đã đặt thiết bị cho dự án.', 'success');
            await load();
        } catch (error) {
            pushToast(error.message || 'Không thể đặt thiết bị.', 'error');
        }
    };

    const handleRemove = async (bookingId) => {
        if (!window.confirm('Xác nhận gỡ booking thiết bị này?')) return;
        try {
            await deleteEquipmentBooking(bookingId);
            pushToast('Đã gỡ booking.', 'success');
            await load();
        } catch (error) {
            pushToast(error.message || 'Không thể gỡ booking.', 'error');
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm text-vps-gold/70">Thiết bị của dự án</p>
                <p className="text-sm text-vps-ivory/60">Danh sách thiết bị được đặt cho dự án này, cảnh báo trùng lịch tự động.</p>
            </div>

            {canManage ? <EquipmentBookingDrawer equipmentOptions={equipmentOptions} onSubmit={handleBook} /> : null}

            {loading ? (
                <p className="text-sm text-vps-ivory/60">Đang tải thiết bị...</p>
            ) : bookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-vps-gray/30 p-4 text-sm text-vps-ivory/60">Chưa đặt thiết bị nào cho dự án.</div>
            ) : (
                <div className="space-y-2">
                    {bookings.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm text-vps-ivory/80">
                            <div><p className="font-medium text-vps-ivory">{equipmentNames[item.equipmentId] || 'Thiết bị đã bị xóa'}</p><p className="text-xs text-vps-ivory/60">{item.startDate} → {item.endDate}</p></div>
                            {canManage ? <button onClick={() => handleRemove(item.id)} className="text-rose-300"><Trash2 className="h-4 w-4" /></button> : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectEquipmentTab;
