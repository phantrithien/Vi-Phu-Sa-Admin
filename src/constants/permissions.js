import { ROLES } from './roles.js';

export const PERMISSIONS = {
    DASHBOARD: 'dashboard',
    PROJECT: 'project',
    SOP: 'sop',
    TASK: 'task',
    FINANCE: 'finance',
    ARCHIVE: 'archive',

    VIEW_COMMAND_CENTER: 'view_command_center',
    VIEW_CRM: 'view_crm',
    VIEW_PROJECTS: 'view_projects',
    VIEW_PRODUCTION: 'view_production',
    VIEW_POST_PRODUCTION: 'view_post_production',
    VIEW_ASSETS: 'view_assets',
    VIEW_FINANCE: 'view_finance',
    VIEW_HR: 'view_hr',
    VIEW_EQUIPMENT: 'view_equipment',
    VIEW_KNOWLEDGE: 'view_knowledge',
    VIEW_REPORTS: 'view_reports',
    VIEW_SETTINGS: 'view_settings',

    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_ACCOUNTING: 'view_accounting',
    VIEW_MARKETING: 'view_marketing',
    VIEW_TASKS: 'view_tasks',
    VIEW_ARCHIVE: 'view_archive',

    MANAGE_ACCOUNTING: 'manage_accounting',
    MANAGE_PRODUCTION: 'manage_production',
    MANAGE_MARKETING: 'manage_marketing',
    MANAGE_HR: 'manage_hr',
    MANAGE_TASKS: 'manage_tasks',
    MANAGE_ARCHIVE: 'manage_archive',

    CLIENT_READ: 'client.read',
    CLIENT_CREATE: 'client.create',
    CLIENT_UPDATE: 'client.update',
    CLIENT_DELETE: 'client.delete',
    PRODUCTION_READ: 'production.read',
    PRODUCTION_CREATE: 'production.create',
    PRODUCTION_UPDATE: 'production.update',
    PRODUCTION_DELETE: 'production.delete',
    CREW_READ: 'crew.read',
    CREW_CREATE: 'crew.create',
    CREW_UPDATE: 'crew.update',
    CREW_DELETE: 'crew.delete',
    EQUIPMENT_READ: 'equipment.read',
    EQUIPMENT_CREATE: 'equipment.create',
    EQUIPMENT_UPDATE: 'equipment.update',
    EQUIPMENT_DELETE: 'equipment.delete',
    EQUIPMENT_BOOK: 'equipment.book',
};

export const ROLE_PERMISSIONS = {
    [ROLES.OWNER]: Object.values(PERMISSIONS),
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.PRODUCER]: [
        PERMISSIONS.DASHBOARD,
        PERMISSIONS.PROJECT,
        PERMISSIONS.SOP,
        PERMISSIONS.TASK,
        PERMISSIONS.CLIENT_READ,
        PERMISSIONS.CLIENT_CREATE,
        PERMISSIONS.CLIENT_UPDATE,
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_PROJECTS,
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.VIEW_POST_PRODUCTION,
        PERMISSIONS.VIEW_ASSETS,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.PRODUCTION_CREATE,
        PERMISSIONS.PRODUCTION_UPDATE,
        PERMISSIONS.PRODUCTION_DELETE,
        PERMISSIONS.CREW_READ,
        PERMISSIONS.CREW_CREATE,
        PERMISSIONS.CREW_UPDATE,
        PERMISSIONS.CREW_DELETE,
        PERMISSIONS.EQUIPMENT_READ,
        PERMISSIONS.EQUIPMENT_CREATE,
        PERMISSIONS.EQUIPMENT_UPDATE,
        PERMISSIONS.EQUIPMENT_DELETE,
        PERMISSIONS.EQUIPMENT_BOOK,
    ],
    [ROLES.ACCOUNTANT]: [
        PERMISSIONS.DASHBOARD,
        PERMISSIONS.FINANCE,
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_FINANCE,
        PERMISSIONS.VIEW_HR,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.MANAGE_ACCOUNTING,
    ],
    [ROLES.EDITOR]: [
        PERMISSIONS.DASHBOARD,
        PERMISSIONS.SOP,
        PERMISSIONS.TASK,
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_ASSETS,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.CREW_READ,
        PERMISSIONS.EQUIPMENT_READ,
    ],
    [ROLES.VIEWER]: [
        PERMISSIONS.DASHBOARD,
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_ASSETS,
        PERMISSIONS.CLIENT_READ,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.EQUIPMENT_READ,
    ],
    [ROLES.FOUNDER]: Object.values(PERMISSIONS),
    [ROLES.EXECUTIVE]: [
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_ACCOUNTING,
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.VIEW_CRM,
        PERMISSIONS.VIEW_HR,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.CREW_READ,
        PERMISSIONS.EQUIPMENT_READ,
    ],
    [ROLES.BACK_OFFICE]: [
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_ACCOUNTING,
        PERMISSIONS.VIEW_CRM,
        PERMISSIONS.VIEW_HR,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
        PERMISSIONS.CLIENT_READ,
        PERMISSIONS.CLIENT_CREATE,
        PERMISSIONS.CLIENT_UPDATE,
        PERMISSIONS.MANAGE_ACCOUNTING,
        PERMISSIONS.MANAGE_HR,
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.MANAGE_ARCHIVE,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.CREW_READ,
        PERMISSIONS.EQUIPMENT_READ,
    ],
    [ROLES.FRONT_OFFICE]: [
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.VIEW_CRM,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
        PERMISSIONS.CLIENT_READ,
        PERMISSIONS.CLIENT_CREATE,
        PERMISSIONS.CLIENT_UPDATE,
        PERMISSIONS.MANAGE_PRODUCTION,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.PRODUCTION_CREATE,
        PERMISSIONS.PRODUCTION_UPDATE,
        PERMISSIONS.PRODUCTION_DELETE,
        PERMISSIONS.CREW_READ,
        PERMISSIONS.CREW_CREATE,
        PERMISSIONS.CREW_UPDATE,
        PERMISSIONS.CREW_DELETE,
        PERMISSIONS.MANAGE_MARKETING,
        PERMISSIONS.EQUIPMENT_READ,
        PERMISSIONS.EQUIPMENT_CREATE,
        PERMISSIONS.EQUIPMENT_UPDATE,
        PERMISSIONS.EQUIPMENT_DELETE,
        PERMISSIONS.EQUIPMENT_BOOK,
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.VIEW_CRM,
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
        PERMISSIONS.CLIENT_READ,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.CREW_READ,
        PERMISSIONS.EQUIPMENT_READ,
    ],
    [ROLES.FREELANCER]: [
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.PRODUCTION_READ,
        PERMISSIONS.CREW_READ,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
    ],
};

export const hasPermission = (userRole, permission) => {
    if (!userRole || !permission) return false;

    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
};

export const hasAnyPermission = (userRole, requiredPermissions = []) => {
    if (!requiredPermissions.length) return true;

    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return requiredPermissions.some((permission) =>
        permissions.includes(permission)
    );
};

export const hasAllPermissions = (userRole, requiredPermissions = []) => {
    if (!requiredPermissions.length) return true;

    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return requiredPermissions.every((permission) =>
        permissions.includes(permission)
    );
};