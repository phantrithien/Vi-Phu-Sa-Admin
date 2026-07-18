export const APP_ROUTES = {
    ROOT: '/',
    LOGIN: '/login',
    TASKS: '/tasks',
    MY_TASKS: '/my-tasks',
    CRM: '/crm',
    CLIENTS: '/clients',
    PROJECTS: '/projects',
    SOPS: '/sops',
    PRODUCTION: '/production',
    CREW: '/crew',
    POST_PRODUCTION: '/post-production',
    ASSETS: '/assets',
    FINANCE: '/finance',
    HR: '/hr',
    EQUIPMENT: '/equipment',
    KNOWLEDGE_BASE: '/knowledge-base',
    REPORTS: '/reports',
    SETTINGS: '/settings',
};

export const LEGACY_ROUTE_ALIASES = {
    '/marketing': APP_ROUTES.CRM,
    '/accounting': APP_ROUTES.FINANCE,
    '/archive': APP_ROUTES.ASSETS,
};
