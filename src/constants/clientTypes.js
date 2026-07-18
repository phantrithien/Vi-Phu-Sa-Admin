export const CLIENT_TYPES = {
    COMPANY: 'company',
    INDIVIDUAL: 'individual',
    AGENCY: 'agency',
    PARTNER: 'partner',
    INTERNAL: 'internal',
};

export const CLIENT_TYPE_LABELS = {
    [CLIENT_TYPES.COMPANY]: 'Company',
    [CLIENT_TYPES.INDIVIDUAL]: 'Individual',
    [CLIENT_TYPES.AGENCY]: 'Agency',
    [CLIENT_TYPES.PARTNER]: 'Partner',
    [CLIENT_TYPES.INTERNAL]: 'Internal',
};

export const CLIENT_TYPE_OPTIONS = Object.values(CLIENT_TYPES);