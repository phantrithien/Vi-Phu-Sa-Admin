import {
    LayoutDashboard,
    Users,
    BriefcaseBusiness,
    Clapperboard,
    Scissors,
    FolderOpen,
    Wallet,
    UserRoundCog,
    Camera,
    BookOpen,
    BarChart3,
    Settings,
} from 'lucide-react';

import { ROLES } from './roles';
import { PERMISSIONS } from './permissions';

export const WORKSPACES = [
    {
        key: 'ceo',
        name: 'CEO View',
        roles: [ROLES.FOUNDER, ROLES.EXECUTIVE, ROLES.ADMIN],
    },
    {
        key: 'sales',
        name: 'Sales View',
        roles: [ROLES.FOUNDER, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE],
    },
    {
        key: 'producer',
        name: 'Producer View',
        roles: [ROLES.FOUNDER, ROLES.FRONT_OFFICE, ROLES.STAFF],
    },
    {
        key: 'post',
        name: 'Post-production View',
        roles: [ROLES.FOUNDER, ROLES.FRONT_OFFICE, ROLES.STAFF, ROLES.FREELANCER],
    },
    {
        key: 'finance',
        name: 'Finance View',
        roles: [ROLES.FOUNDER, ROLES.EXECUTIVE, ROLES.ADMIN, ROLES.BACK_OFFICE],
    },
    {
        key: 'admin',
        name: 'Admin View',
        roles: [ROLES.FOUNDER, ROLES.ADMIN],
    },
];

export const MENU_ITEMS = [
    {
        path: '/',
        name: 'Command Center',
        icon: LayoutDashboard,
        roles: [ROLES.FOUNDER, ROLES.EXECUTIVE, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE],
        permissions: [PERMISSIONS.VIEW_COMMAND_CENTER],
    },
    {
        path: '/crm',
        name: 'CRM',
        icon: Users,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE],
        permissions: [PERMISSIONS.VIEW_CRM],
    },
    {
        path: '/projects',
        name: 'Projects',
        icon: BriefcaseBusiness,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE, ROLES.STAFF, ROLES.FREELANCER],
        permissions: [PERMISSIONS.VIEW_PROJECTS],
    },
    {
        path: '/sops',
        name: 'SOP Library',
        icon: BookOpen,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE, ROLES.STAFF],
        permissions: [PERMISSIONS.SOP],
    },
    {
        path: '/production',
        name: 'Production',
        icon: Clapperboard,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE, ROLES.STAFF, ROLES.FREELANCER],
        permissions: [PERMISSIONS.VIEW_PRODUCTION],
    },
    {
        path: '/tasks',
        name: 'Task Board',
        icon: BriefcaseBusiness,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE, ROLES.STAFF],
        permissions: [PERMISSIONS.VIEW_TASKS],
    },
    {
        path: '/my-tasks',
        name: 'My Tasks',
        icon: Users,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE, ROLES.STAFF, ROLES.FREELANCER],
        permissions: [PERMISSIONS.VIEW_TASKS],
    },
    {
        path: '/post-production',
        name: 'Post-production',
        icon: Scissors,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.FRONT_OFFICE, ROLES.STAFF, ROLES.FREELANCER],
        permissions: [PERMISSIONS.VIEW_POST_PRODUCTION],
    },
    {
        path: '/assets',
        name: 'Assets',
        icon: FolderOpen,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE, ROLES.STAFF, ROLES.FREELANCER],
        permissions: [PERMISSIONS.VIEW_ASSETS],
    },
    {
        path: '/finance',
        name: 'Finance',
        icon: Wallet,
        roles: [ROLES.FOUNDER, ROLES.EXECUTIVE, ROLES.ADMIN, ROLES.BACK_OFFICE],
        permissions: [PERMISSIONS.VIEW_FINANCE],
    },
    {
        path: '/hr',
        name: 'HR & Freelancers',
        icon: UserRoundCog,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE],
        permissions: [PERMISSIONS.VIEW_HR],
    },
    {
        path: '/equipment',
        name: 'Equipment',
        icon: Camera,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE, ROLES.STAFF],
        permissions: [PERMISSIONS.VIEW_EQUIPMENT],
    },
    {
        path: '/knowledge-base',
        name: 'Knowledge Base',
        icon: BookOpen,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.BACK_OFFICE, ROLES.FRONT_OFFICE, ROLES.STAFF, ROLES.FREELANCER],
        permissions: [PERMISSIONS.VIEW_KNOWLEDGE],
    },
    {
        path: '/reports',
        name: 'Reports',
        icon: BarChart3,
        roles: [ROLES.FOUNDER, ROLES.EXECUTIVE, ROLES.ADMIN, ROLES.BACK_OFFICE],
        permissions: [PERMISSIONS.VIEW_REPORTS],
    },
    {
        path: '/settings',
        name: 'Settings',
        icon: Settings,
        roles: [ROLES.FOUNDER, ROLES.ADMIN],
        permissions: [PERMISSIONS.VIEW_SETTINGS],
    },
];