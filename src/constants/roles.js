// src/constants/roles.js

export const ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    PRODUCER: 'producer',
    ACCOUNTANT: 'accountant',
    EDITOR: 'editor',
    VIEWER: 'viewer',
    FOUNDER: 'founder',
    EXECUTIVE: 'executive',
    BACK_OFFICE: 'back_office',
    FRONT_OFFICE: 'front_office',
    STAFF: 'staff',
    FREELANCER: 'freelancer'
};

export const SUPER_ROLES = [
    ROLES.OWNER,
    ROLES.ADMIN,
    ROLES.FOUNDER,
    ROLES.EXECUTIVE,
];

export const MANAGEMENT_ROLES = [
    ROLES.OWNER,
    ROLES.ADMIN,
    ROLES.PRODUCER,
    ROLES.ACCOUNTANT,
    ROLES.FOUNDER,
    ROLES.EXECUTIVE,
    ROLES.BACK_OFFICE
];

export const OPERATION_ROLES = [
    ROLES.OWNER,
    ROLES.ADMIN,
    ROLES.PRODUCER,
    ROLES.EDITOR,
    ROLES.VIEWER,
    ROLES.FOUNDER,
    ROLES.BACK_OFFICE,
    ROLES.FRONT_OFFICE,
    ROLES.STAFF
];

export const ALL_ROLES = Object.values(ROLES);

export const ROLE_LABELS = {
    [ROLES.OWNER]: 'Owner',
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.PRODUCER]: 'Producer',
    [ROLES.ACCOUNTANT]: 'Accountant',
    [ROLES.EDITOR]: 'Editor',
    [ROLES.VIEWER]: 'Viewer',
    [ROLES.FOUNDER]: 'Founder',
    [ROLES.EXECUTIVE]: 'Executive',
    [ROLES.BACK_OFFICE]: 'Back Office',
    [ROLES.FRONT_OFFICE]: 'Front Office',
    [ROLES.STAFF]: 'Staff',
    [ROLES.FREELANCER]: 'Freelancer'
};

export const hasRole = (userRole, allowedRoles = []) => {
    if (!userRole) return false;

    return (
        SUPER_ROLES.includes(userRole) ||
        allowedRoles.includes(userRole)
    );
};

export const isSuperRole = (userRole) => {
    return SUPER_ROLES.includes(userRole);
};

export const isManagementRole = (userRole) => {
    return MANAGEMENT_ROLES.includes(userRole);
};

export const isOperationalRole = (userRole) => {
    return OPERATION_ROLES.includes(userRole);
};