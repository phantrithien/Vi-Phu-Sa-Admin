import React from 'react';
import { Building2, Mail, Phone, UserRoundPen } from 'lucide-react';

import { CLIENT_TYPE_LABELS } from '../../../constants/clientTypes';
import ClientStatusBadge from './ClientStatusBadge';

const ClientCard = ({ client, onOpen, onEdit, canUpdate }) => {
    return (
        <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-vps-gold/70">{CLIENT_TYPE_LABELS[client.type] || client.type}</p>
                    <h3 className="mt-2 text-lg font-semibold text-vps-ivory">{client.name}</h3>
                </div>
                <ClientStatusBadge status={client.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm text-vps-ivory/70">
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-vps-gold" />
                    <span>{client.phone || 'Chưa có số điện thoại'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-vps-gold" />
                    <span>{client.email || 'Chưa có email'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-vps-gold" />
                    <span>{client.industry || 'Chưa có ngành nghề'}</span>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                    onClick={() => onOpen(client)}
                    className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40"
                >
                    Xem chi tiết
                </button>
                {canUpdate ? (
                    <button
                        onClick={() => onEdit(client)}
                        className="inline-flex items-center gap-2 rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-sm text-vps-ivory transition-colors hover:border-vps-gold/40"
                    >
                        <UserRoundPen className="h-4 w-4" />
                        Sửa
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default ClientCard;