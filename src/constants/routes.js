export const APP_ROUTES = {
    ROOT: '/',
    LOGIN: '/login',
    CRM: '/crm',
    PROJECTS: '/projects',
    PRODUCTION: '/production',
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
    '/tasks': APP_ROUTES.PROJECTS,
    '/archive': APP_ROUTES.ASSETS,
};
