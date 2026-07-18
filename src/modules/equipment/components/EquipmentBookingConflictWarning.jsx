import React from 'react';
import { TriangleAlert } from 'lucide-react';

const EquipmentBookingConflictWarning = ({ visible }) => {
    if (!visible) return null;
    return (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <TriangleAlert className="h-4 w-4" />
            Thiết bị đã được đặt trong khoảng thời gian này. Vui lòng chọn thiết bị hoặc ngày khác.
        </div>
    );
};

export default EquipmentBookingConflictWarning;
