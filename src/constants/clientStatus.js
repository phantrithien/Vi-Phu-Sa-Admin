export const CLIENT_STATUS = {
    LEAD: 'lead',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    VIP: 'vip',
    ARCHIVED: 'archived',
};

export const CLIENT_STATUS_LABELS = {
    [CLIENT_STATUS.LEAD]: 'Lead',
    [CLIENT_STATUS.ACTIVE]: 'Active',
    [CLIENT_STATUS.INACTIVE]: 'Inactive',
    [CLIENT_STATUS.VIP]: 'VIP',
    [CLIENT_STATUS.ARCHIVED]: 'Archived',
};

export const CLIENT_STATUS_OPTIONS = Object.values(CLIENT_STATUS);