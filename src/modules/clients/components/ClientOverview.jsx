import React from 'react';

import { CLIENT_TYPE_LABELS } from '../../../constants/clientTypes';
import ClientStatusBadge from './ClientStatusBadge';

const Item = ({ label, value }) => (
    <div className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm">
        <span className="text-vps-ivory/70">{label}</span>
        <span className="font-semibold text-vps-ivory">{value || '---'}</span>
    </div>
);

const ClientOverview = ({ client }) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3 text-sm">
                <span className="text-vps-ivory/70">Trạng thái</span>
                <ClientStatusBadge status={client.status} />
            </div>
            <Item label="Loại khách hàng" value={CLIENT_TYPE_LABELS[client.type] || client.type} />
            <Item label="Số điện thoại" value={client.phone} />
            <Item label="Email" value={client.email} />
            <Item label="Ngành nghề" value={client.industry} />
            <Item label="Nguồn khách" value={client.source} />
            <Item label="Địa chỉ" value={client.address} />
            <Item label="Mã số thuế" value={client.taxCode} />
            <div className="rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-3 text-sm">
                <p className="text-vps-ivory/70">Ghi chú</p>
                <p className="mt-2 text-vps-ivory">{client.notes || 'Chưa có ghi chú.'}</p>
            </div>
        </div>
    );
};

export default ClientOverview;