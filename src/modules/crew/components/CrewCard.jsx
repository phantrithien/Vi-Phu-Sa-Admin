import React from 'react';
import { Mail, Phone, UserRoundPen, Wallet } from 'lucide-react';

import { CREW_ROLE_LABELS } from '../../../constants/crewRoles';
import { CREW_TYPE_LABELS } from '../crewDefaults';
import CrewStatusBadge from './CrewStatusBadge';

const CrewCard = ({ crew, onOpen, onEdit, canUpdate }) => (
    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-5">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-xs uppercase tracking-[0.3em] text-vps-gold/70">{CREW_TYPE_LABELS[crew.type] || crew.type}</p>
                <h3 className="mt-2 text-lg font-semibold text-vps-ivory">{crew.name}</h3>
                <p className="mt-1 text-xs text-vps-ivory/60">{(crew.roles || []).map((role) => CREW_ROLE_LABELS[role] || role).join(', ') || 'Chưa gán vai trò'}</p>
            </div>
            <CrewStatusBadge status={crew.status} />
        </div>

        <div className="mt-4 space-y-2 text-sm text-vps-ivory/70">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-vps-gold" /><span>{crew.phone || 'Chưa có số điện thoại'}</span></div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-vps-gold" /><span>{crew.email || 'Chưa có email'}</span></div>
            <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-vps-gold" /><span>{Number(crew.dayRate || 0).toLocaleString('vi-VN')} đ/ngày</span></div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button onClick={() => onOpen(crew)} className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40">Xem chi tiết</button>
            {canUpdate ? (
                <button onClick={() => onEdit(crew)} className="inline-flex items-center gap-2 rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40">
                    <UserRoundPen className="h-4 w-4" />Sửa
                </button>
            ) : null}
        </div>
    </div>
);

export default CrewCard;
