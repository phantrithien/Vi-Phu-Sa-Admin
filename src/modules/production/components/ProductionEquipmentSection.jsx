import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';

import { listEquipment } from '../../equipment/equipmentService';
import { createEquipmentBooking, deleteEquipmentBooking, listEquipmentBookingsByProductionDay } from '../../equipment/equipmentBookingService';
import EquipmentBookingDrawer from '../../equipment/components/EquipmentBookingDrawer';

const ProductionEquipmentSection = ({ productionDay, canManage, userId, onClose }) => {
    const [bookings, setBookings] = useState([]);
    const [equipmentOptions, setEquipmentOptions] = useState([]);
    const equipmentNames = useMemo(() => Object.fromEntries(equipmentOptions.map((item) => [item.id, item.name])), [equipmentOptions]);

    const load = async () => {
        const [bookingRows, equipmentRows] = await Promise.all([listEquipmentBookingsByProductionDay(productionDay.id), listEquipment()]);
        setBookings(bookingRows);
        setEquipmentOptions(equipmentRows);
    };

    useEffect(() => { load().catch(() => { setBookings([]); setEquipmentOptions([]); }); }, [productionDay.id]);

    const handleBook = async (payload) => {
        await createEquipmentBooking({ ...payload, projectId: productionDay.projectId, productionDayId: productionDay.id }, userId);
        await load();
    };

    const handleRemove = async (bookingId) => {
        if (!window.confirm('Xác nhận gỡ thiết bị khỏi ngày sản xuất này?')) return;
        await deleteEquipmentBooking(bookingId);
        await load();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/70 md:items-center md:justify-center">
            <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-vps-gray/20 bg-[#151515] p-5 md:rounded-2xl">
                <div className="flex items-center justify-between">
                    <div><p className="text-sm text-vps-gold/70">Thiết bị ngày sản xuất</p><h2 className="text-lg font-semibold text-vps-ivory">{productionDay.title}</h2></div>
                    <button onClick={onClose} className="rounded-lg bg-[#222] p-2 text-vps-ivory"><X className="h-5 w-5" /></button>
                </div>

                {canManage ? <div className="mt-5"><EquipmentBookingDrawer equipmentOptions={equipmentOptions} defaultStartDate={productionDay.date} defaultEndDate={productionDay.date} onSubmit={handleBook} /></div> : null}

                <div className="mt-4 space-y-2">
                    {bookings.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-vps-gray/30 p-4 text-sm text-vps-ivory/60">Chưa đặt thiết bị cho ngày này.</p>
                    ) : bookings.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm text-vps-ivory/80">
                            <div><p className="font-medium text-vps-ivory">{equipmentNames[item.equipmentId] || 'Thiết bị đã bị xóa'}</p><p className="text-xs text-vps-ivory/60">{item.startDate} → {item.endDate}</p></div>
                            {canManage ? <button onClick={() => handleRemove(item.id)} className="text-rose-300"><Trash2 className="h-4 w-4" /></button> : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductionEquipmentSection;
