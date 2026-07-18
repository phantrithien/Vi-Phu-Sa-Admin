export const EQUIPMENT_STATUS = {
    AVAILABLE: 'available',
    BOOKED: 'booked',
    MAINTENANCE: 'maintenance',
    DAMAGED: 'damaged',
    LOST: 'lost',
    ARCHIVED: 'archived',
};

export const EQUIPMENT_STATUS_LABELS = {
    [EQUIPMENT_STATUS.AVAILABLE]: 'Available',
    [EQUIPMENT_STATUS.BOOKED]: 'Booked',
    [EQUIPMENT_STATUS.MAINTENANCE]: 'Maintenance',
    [EQUIPMENT_STATUS.DAMAGED]: 'Damaged',
    [EQUIPMENT_STATUS.LOST]: 'Lost',
    [EQUIPMENT_STATUS.ARCHIVED]: 'Archived',
};

export const EQUIPMENT_STATUS_OPTIONS = Object.values(EQUIPMENT_STATUS);
