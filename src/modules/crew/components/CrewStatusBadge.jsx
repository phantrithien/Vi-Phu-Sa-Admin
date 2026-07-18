import React from 'react';

import StatusBadge from '../../../components/ui/StatusBadge';
import { CREW_STATUS, CREW_STATUS_LABELS } from '../../../constants/crewStatus';

const statusVariant = {
    [CREW_STATUS.AVAILABLE]: 'success',
    [CREW_STATUS.BUSY]: 'warning',
    [CREW_STATUS.INACTIVE]: 'neutral',
    [CREW_STATUS.BLACKLISTED]: 'danger',
    [CREW_STATUS.ARCHIVED]: 'danger',
};

const CrewStatusBadge = ({ status }) => (
    <StatusBadge label={CREW_STATUS_LABELS[status] || 'Unknown'} variant={statusVariant[status] || 'neutral'} />
);

export default CrewStatusBadge;
