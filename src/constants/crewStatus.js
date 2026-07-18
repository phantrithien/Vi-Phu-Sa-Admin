export const CREW_STATUS = {
    AVAILABLE: 'available',
    BUSY: 'busy',
    INACTIVE: 'inactive',
    BLACKLISTED: 'blacklisted',
    ARCHIVED: 'archived',
};

export const CREW_STATUS_LABELS = {
    [CREW_STATUS.AVAILABLE]: 'Available',
    [CREW_STATUS.BUSY]: 'Busy',
    [CREW_STATUS.INACTIVE]: 'Inactive',
    [CREW_STATUS.BLACKLISTED]: 'Blacklisted',
    [CREW_STATUS.ARCHIVED]: 'Archived',
};

export const CREW_STATUS_OPTIONS = Object.values(CREW_STATUS);
