export const PRODUCTION_TYPES = {
    SHOOTING: 'shooting',
    EVENT: 'event',
    LIVESTREAM: 'livestream',
    MEETING: 'meeting',
    SETUP: 'setup',
    REHEARSAL: 'rehearsal',
};

export const PRODUCTION_TYPE_LABELS = {
    [PRODUCTION_TYPES.SHOOTING]: 'Shooting',
    [PRODUCTION_TYPES.EVENT]: 'Event',
    [PRODUCTION_TYPES.LIVESTREAM]: 'Livestream',
    [PRODUCTION_TYPES.MEETING]: 'Meeting',
    [PRODUCTION_TYPES.SETUP]: 'Setup',
    [PRODUCTION_TYPES.REHEARSAL]: 'Rehearsal',
};

export const PRODUCTION_TYPE_OPTIONS = Object.values(PRODUCTION_TYPES);