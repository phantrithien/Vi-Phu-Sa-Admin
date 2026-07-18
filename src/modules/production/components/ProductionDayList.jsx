import React from 'react';
import { CalendarDays, Clock3, FileText, MapPin, Pencil, Trash2, Users, Camera } from 'lucide-react';

import { PRODUCTION_STATUS_LABELS } from '../../../constants/productionStatus';
import { PRODUCTION_TYPE_LABELS } from '../../../constants/productionTypes';

const ProductionDayList = ({ days, canManage, onEdit, onDelete, onOpenRunSheet, onOpenCallSheet, onOpenCrew, onOpenEquipment }) => {
    if (!days.length) return <div className="rounded-xl border border-dashed border-vps-gray/30 p-5 text-sm text-vps-ivory/60">Chưa có ngày sản xuất nào cho dự án này.</div>;

    return <div className="space-y-3">{days.map((day) => (
        <div key={day.id} className="rounded-xl border border-vps-gray/20 bg-[#181818] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-vps-gold/70">{PRODUCTION_TYPE_LABELS[day.type] || day.type} · {PRODUCTION_STATUS_LABELS[day.status] || day.status}</p><h3 className="mt-1 font-semibold text-vps-ivory">{day.title}</h3><div className="mt-3 flex flex-wrap gap-3 text-xs text-vps-ivory/60"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-vps-gold" />{day.date}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-vps-gold" />{day.callTime || '--:--'} - {day.wrapTime || '--:--'}</span><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-vps-gold" />{day.location || 'Chưa có địa điểm'}</span></div></div>
                <div className="flex flex-wrap gap-2"><button onClick={() => onOpenRunSheet(day)} className="rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-xs text-vps-ivory">Run sheet</button><button onClick={() => onOpenCrew(day)} className="inline-flex items-center gap-1 rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-xs text-vps-ivory"><Users className="h-3.5 w-3.5" />Crew</button><button onClick={() => onOpenEquipment(day)} className="inline-flex items-center gap-1 rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-xs text-vps-ivory"><Camera className="h-3.5 w-3.5" />Thiết bị</button><button onClick={() => onOpenCallSheet(day)} className="inline-flex items-center gap-1 rounded-lg border border-vps-gray/20 bg-[#111] px-3 py-2 text-xs text-vps-ivory"><FileText className="h-3.5 w-3.5" />Call sheet</button>{canManage ? <><button aria-label="Sửa ngày sản xuất" onClick={() => onEdit(day)} className="rounded-lg border border-vps-gray/20 bg-[#111] p-2 text-vps-ivory"><Pencil className="h-4 w-4" /></button><button aria-label="Xóa ngày sản xuất" onClick={() => onDelete(day)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-300"><Trash2 className="h-4 w-4" /></button></> : null}</div>
            </div>
            {day.notes ? <p className="mt-3 border-t border-vps-gray/10 pt-3 text-sm text-vps-ivory/60">{day.notes}</p> : null}
        </div>
    ))}</div>;
};

export default ProductionDayList;