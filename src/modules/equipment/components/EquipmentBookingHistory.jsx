import React from 'react';
import { CalendarRange } from 'lucide-react';

const EquipmentBookingHistory = ({ bookings = [], projectNames = {} }) => {
    if (!bookings.length) {
        return <div className="rounded-xl border border-dashed border-vps-gray/30 p-4 text-sm text-vps-ivory/60">Chưa có lịch booking nào.</div>;
    }

    return (
        <div className="space-y-2">
            {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm text-vps-ivory/80">
                    <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4 text-vps-gold" /><span className="font-medium text-vps-ivory">{projectNames[booking.projectId] || 'Dự án đã bị xóa'}</span></div>
                    <span className="text-xs text-vps-ivory/60">{booking.startDate} → {booking.endDate}</span>
                </div>
            ))}
        </div>
    );
};

export default EquipmentBookingHistory;
