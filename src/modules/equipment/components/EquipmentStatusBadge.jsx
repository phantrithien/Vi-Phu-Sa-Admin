import React from 'react';

import StatusBadge from '../../../components/ui/StatusBadge';
import { EQUIPMENT_STATUS, EQUIPMENT_STATUS_LABELS } from '../../../constants/equipmentStatus';

const statusVariant = {
    [EQUIPMENT_STATUS.AVAILABLE]: 'success',
    [EQUIPMENT_STATUS.BOOKED]: 'info',
    [EQUIPMENT_STATUS.MAINTENANCE]: 'warning',
    [EQUIPMENT_STATUS.DAMAGED]: 'danger',
    [EQUIPMENT_STATUS.LOST]: 'danger',
    [EQUIPMENT_STATUS.ARCHIVED]: 'neutral',
};

const EquipmentStatusBadge = ({ status }) => (
    <StatusBadge label={EQUIPMENT_STATUS_LABELS[status] || 'Unknown'} variant={statusVariant[status] || 'neutral'} />
);

export default EquipmentStatusBadge;
