import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasRole } from '../constants/roles';
import { hasAnyPermission } from '../constants/permissions';

const PermissionGuard = ({
    children,
    allowedRoles = [],
    allowedDepartments = [],
    permissions = [],
    fallback = null,
    redirectTo = '/',
}) => {
    const { userRole, userDepartment, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-vps-gold">
                Đang kiểm tra quyền truy cập...
            </div>
        );
    }

    const roleAllowed =
        allowedRoles.length === 0 || hasRole(userRole, allowedRoles);

    const departmentAllowed =
        allowedDepartments.length === 0 ||
        allowedDepartments.includes(userDepartment);

    const permissionAllowed =
        permissions.length === 0 || hasAnyPermission(userRole, permissions);

    const isAllowed = roleAllowed && departmentAllowed && permissionAllowed;

    if (!isAllowed) {
        if (fallback) return fallback;
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default PermissionGuard;