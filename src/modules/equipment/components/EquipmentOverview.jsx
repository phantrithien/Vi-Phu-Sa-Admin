import React from 'react';
import { Barcode, Camera } from 'lucide-react';

import { EQUIPMENT_CATEGORY_LABELS } from '../../../constants/equipmentCategories';
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_OPTIONS } from '../../../constants/equipmentStatus';
import EquipmentStatusBadge from './EquipmentStatusBadge';

const EquipmentOverview = ({ equipment, canManage, onStatusChange }) => (
    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-5">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-xs uppercase tracking-[0.3em] text-vps-gold/70">{EQUIPMENT_CATEGORY_LABELS[equipment.category] || equipment.category}</p>
                <h2 className="mt-2 text-xl font-semibold text-vps-ivory">{equipment.name}</h2>
            </div>
            <EquipmentStatusBadge status={equipment.status} />
        </div>

        <div className="mt-4 grid gap-3 text-sm text-vps-ivory/70 sm:grid-cols-2">
            <div className="flex items-center gap-2"><Barcode className="h-4 w-4 text-vps-gold" />{equipment.serialNumber || '---'}</div>
            <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-vps-gold" />Tình trạng: {equipment.condition || 'good'}</div>
        </div>

        {canManage ? (
            <label className="mt-4 block text-sm text-vps-ivory/70">
                Cập nhật trạng thái
                <select value={equipment.status} onChange={(event) => onStatusChange(event.target.value)} className="mt-2 w-full rounded-xl border border-vps-gray/20 bg-[#111] px-3 py-2.5 text-vps-ivory outline-none focus:border-vps-gold">
                    {EQUIPMENT_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{EQUIPMENT_STATUS_LABELS[status]}</option>)}
                </select>
            </label>
        ) : null}

        {equipment.notes ? <p className="mt-4 border-t border-vps-gray/10 pt-4 text-sm text-vps-ivory/60">{equipment.notes}</p> : null}
    </div>
);

export default EquipmentOverview;
