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
};

export const ROLE_PERMISSIONS = {
    [ROLES.OWNER]: Object.values(PERMISSIONS),
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.PRODUCER]: [
        PERMISSIONS.DASHBOARD,
        PERMISSIONS.PROJECT,
        PERMISSIONS.SOP,
        PERMISSIONS.TASK,
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_PROJECTS,
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.VIEW_POST_PRODUCTION,
        PERMISSIONS.VIEW_ASSETS,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
    ],
    [ROLES.ACCOUNTANT]: [
        PERMISSIONS.DASHBOARD,
        PERMISSIONS.FINANCE,
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_FINANCE,
        PERMISSIONS.VIEW_HR,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.MANAGE_ACCOUNTING,
    ],
    [ROLES.EDITOR]: [
        PERMISSIONS.DASHBOARD,
        PERMISSIONS.SOP,
        PERMISSIONS.TASK,
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_ASSETS,
        PERMISSIONS.VIEW_TASKS,
    ],
    [ROLES.VIEWER]: [
        PERMISSIONS.DASHBOARD,
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_ASSETS,
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
    ],
    [ROLES.BACK_OFFICE]: [
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_ACCOUNTING,
        PERMISSIONS.VIEW_CRM,
        PERMISSIONS.VIEW_HR,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
        PERMISSIONS.MANAGE_ACCOUNTING,
        PERMISSIONS.MANAGE_HR,
        PERMISSIONS.MANAGE_TASKS,
        PERMISSIONS.MANAGE_ARCHIVE,
    ],
    [ROLES.FRONT_OFFICE]: [
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.VIEW_CRM,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
        PERMISSIONS.MANAGE_PRODUCTION,
        PERMISSIONS.MANAGE_MARKETING,
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.VIEW_CRM,
        PERMISSIONS.VIEW_PRODUCTION,
        PERMISSIONS.VIEW_TASKS,
        PERMISSIONS.VIEW_ARCHIVE,
    ],
    [ROLES.FREELANCER]: [
        PERMISSIONS.VIEW_PRODUCTION,
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