import React from 'react';
import { BriefcaseBusiness } from 'lucide-react';

const CrewProjectHistory = ({ assignments = [], projectNames = {} }) => {
    if (!assignments.length) {
        return <div className="rounded-xl border border-dashed border-vps-gray/30 p-4 text-sm text-vps-ivory/60">Chưa từng tham gia dự án nào.</div>;
    }

    return (
        <div className="space-y-2">
            {assignments.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm text-vps-ivory/80">
                    <div className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-vps-gold" /><span className="font-medium text-vps-ivory">{projectNames[item.projectId] || 'Dự án đã bị xóa'}</span></div>
                    <span className="text-xs text-vps-ivory/60">{item.role || '---'} · {Number(item.rate || 0).toLocaleString('vi-VN')} đ</span>
                </div>
            ))}
        </div>
    );
};

export default CrewProjectHistory;
