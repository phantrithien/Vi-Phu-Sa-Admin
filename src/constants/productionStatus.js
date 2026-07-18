export const PRODUCTION_STATUS = {
    DRAFT: 'draft',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

export const PRODUCTION_STATUS_LABELS = {
    [PRODUCTION_STATUS.DRAFT]: 'Draft',
    [PRODUCTION_STATUS.CONFIRMED]: 'Confirmed',
    [PRODUCTION_STATUS.IN_PROGRESS]: 'In Progress',
    [PRODUCTION_STATUS.COMPLETED]: 'Completed',
    [PRODUCTION_STATUS.CANCELLED]: 'Cancelled',
};

export const PRODUCTION_STATUS_OPTIONS = Object.values(PRODUCTION_STATUS);