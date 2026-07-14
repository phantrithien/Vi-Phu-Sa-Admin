import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import PermissionGuard from './components/PermissionGuard';
import { PERMISSIONS } from './constants/permissions';
import { APP_ROUTES, LEGACY_ROUTE_ALIASES } from './constants/routes';

const Login = lazy(() => import('./pages/Login/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Marketing = lazy(() => import('./pages/Marketing/Marketing'));
const Accounting = lazy(() => import('./pages/Accounting/Accounting'));
const Production = lazy(() => import('./pages/Production/Production'));
const HR = lazy(() => import('./pages/HR/HR'));
const TaskBoard = lazy(() => import('./pages/TaskBoard/TaskBoard'));
const Archive = lazy(() => import('./pages/Archive/Archive'));
const ComingSoon = lazy(() => import('./pages/ComingSoon/ComingSoon'));

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-vps-gold">
                Đang tải hệ thống...
            </div>
        );
    }

    if (!currentUser) return <Navigate to="/login" replace />;

    return children;
};

const Guarded = ({ permissions, children }) => (
    <ProtectedRoute>
        <PermissionGuard permissions={permissions}>
            {children}
        </PermissionGuard>
    </ProtectedRoute>
);

const App = () => {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-vps-gold">Đang tải trang...</div>}>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                    path={APP_ROUTES.ROOT}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_COMMAND_CENTER]}>
                            <Dashboard />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.CRM}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_CRM]}>
                            <Marketing />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.PROJECTS}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_PROJECTS]}>
                            <TaskBoard />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.PRODUCTION}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_PRODUCTION]}>
                            <Production />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.POST_PRODUCTION}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_POST_PRODUCTION]}>
                            <ComingSoon title="Post-production Workspace" />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.ASSETS}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_ASSETS]}>
                            <Archive />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.FINANCE}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_FINANCE]}>
                            <Accounting />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.HR}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_HR]}>
                            <HR />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.EQUIPMENT}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_EQUIPMENT]}>
                            <ComingSoon title="Equipment Booking" />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.KNOWLEDGE_BASE}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_KNOWLEDGE]}>
                            <ComingSoon title="Knowledge Base" />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.REPORTS}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_REPORTS]}>
                            <ComingSoon title="Reports & BI" />
                        </Guarded>
                    }
                />

                <Route
                    path={APP_ROUTES.SETTINGS}
                    element={
                        <Guarded permissions={[PERMISSIONS.VIEW_SETTINGS]}>
                            <ComingSoon title="Settings & Governance" />
                        </Guarded>
                    }
                />

                {/* Route cũ giữ tương thích */}
                <Route path="/marketing" element={<Navigate to={APP_ROUTES.CRM} replace />} />
                <Route path="/accounting" element={<Navigate to={APP_ROUTES.FINANCE} replace />} />
                <Route path="/tasks" element={<Navigate to={APP_ROUTES.PROJECTS} replace />} />
                <Route path="/archive" element={<Navigate to={APP_ROUTES.ASSETS} replace />} />

                <Route path="*" element={<Navigate to={APP_ROUTES.ROOT} replace />} />
            </Routes>
        </Suspense>
    );
};

export default App;