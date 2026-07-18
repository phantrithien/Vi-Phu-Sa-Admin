import React from 'react';

import StatusBadge from '../../../components/ui/StatusBadge';
import { CLIENT_STATUS, CLIENT_STATUS_LABELS } from '../../../constants/clientStatus';

const statusVariant = {
    [CLIENT_STATUS.LEAD]: 'warning',
    [CLIENT_STATUS.ACTIVE]: 'success',
    [CLIENT_STATUS.INACTIVE]: 'neutral',
    [CLIENT_STATUS.VIP]: 'info',
    [CLIENT_STATUS.ARCHIVED]: 'danger',
};

const ClientStatusBadge = ({ status }) => {
    return (
        <StatusBadge
            label={CLIENT_STATUS_LABELS[status] || 'Unknown'}
            variant={statusVariant[status] || 'neutral'}
        />
    );
};

export default ClientStatusBadge;