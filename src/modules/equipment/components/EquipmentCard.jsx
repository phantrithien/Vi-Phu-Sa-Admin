import React from 'react';
import { Barcode, Camera, UserRoundPen } from 'lucide-react';

import { EQUIPMENT_CATEGORY_LABELS } from '../../../constants/equipmentCategories';
import EquipmentStatusBadge from './EquipmentStatusBadge';

const EquipmentCard = ({ equipment, onOpen, onEdit, canUpdate }) => (
    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-5">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-xs uppercase tracking-[0.3em] text-vps-gold/70">{EQUIPMENT_CATEGORY_LABELS[equipment.category] || equipment.category}</p>
                <h3 className="mt-2 text-lg font-semibold text-vps-ivory">{equipment.name}</h3>
            </div>
            <EquipmentStatusBadge status={equipment.status} />
        </div>

        <div className="mt-4 space-y-2 text-sm text-vps-ivory/70">
            <div className="flex items-center gap-2"><Barcode className="h-4 w-4 text-vps-gold" /><span>{equipment.serialNumber || 'Chưa có serial number'}</span></div>
            <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-vps-gold" /><span>Tình trạng: {equipment.condition || 'good'}</span></div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button onClick={() => onOpen(equipment)} className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40">Xem chi tiết</button>
            {canUpdate ? (
                <button onClick={() => onEdit(equipment)} className="inline-flex items-center gap-2 rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40">
                    <UserRoundPen className="h-4 w-4" />Sửa
                </button>
            ) : null}
        </div>
    </div>
);

export default EquipmentCard;
