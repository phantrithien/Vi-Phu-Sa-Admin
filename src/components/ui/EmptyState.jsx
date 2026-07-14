import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'Chưa có dữ liệu', description = 'Thông tin sẽ xuất hiện khi có nội dung.' }) => {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-vps-gray/40 bg-[#141414] p-8 text-center">
            <div className="mb-4 rounded-2xl border border-vps-gold/20 bg-vps-gold/10 p-4 text-vps-gold">
                <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-vps-ivory">{title}</h3>
            <p className="mt-2 max-w-md text-sm text-vps-ivory/60">{description}</p>
        </div>
    );
};

export default EmptyState;
