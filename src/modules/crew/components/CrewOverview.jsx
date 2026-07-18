import React from 'react';
import { Mail, Phone, Wallet } from 'lucide-react';

import { CREW_ROLE_LABELS } from '../../../constants/crewRoles';
import { CREW_TYPE_LABELS } from '../crewDefaults';
import CrewStatusBadge from './CrewStatusBadge';

const CrewOverview = ({ crew }) => (
    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-5">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-xs uppercase tracking-[0.3em] text-vps-gold/70">{CREW_TYPE_LABELS[crew.type] || crew.type}</p>
                <h2 className="mt-2 text-xl font-semibold text-vps-ivory">{crew.name}</h2>
                <p className="mt-1 text-sm text-vps-ivory/60">{(crew.roles || []).map((role) => CREW_ROLE_LABELS[role] || role).join(', ') || 'Chưa gán vai trò'}</p>
            </div>
            <CrewStatusBadge status={crew.status} />
        </div>

        <div className="mt-4 grid gap-3 text-sm text-vps-ivory/70 sm:grid-cols-3">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-vps-gold" />{crew.phone || '---'}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-vps-gold" />{crew.email || '---'}</div>
            <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-vps-gold" />{Number(crew.dayRate || 0).toLocaleString('vi-VN')} đ/ngày</div>
        </div>

        {(crew.skills || []).length ? (
            <div className="mt-4 flex flex-wrap gap-2">
                {crew.skills.map((skill) => <span key={skill} className="rounded-full bg-[#222222] px-3 py-1 text-xs text-vps-ivory/70">{skill}</span>)}
            </div>
        ) : null}

        {crew.notes ? <p className="mt-4 border-t border-vps-gray/10 pt-4 text-sm text-vps-ivory/60">{crew.notes}</p> : null}
    </div>
);

export default CrewOverview;
