import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LogOut,
    Menu,
    X,
    Lock,
    ChevronDown,
} from 'lucide-react';

import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS, hasRole } from '../constants/roles';
import { hasAnyPermission } from '../constants/permissions';
import { MENU_ITEMS, WORKSPACES } from '../constants/menuConfig';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [workspace, setWorkspace] = useState('ceo');

    const navigate = useNavigate();
    const { userRole, currentUser, loading } = useAuth();

    const availableWorkspaces = useMemo(() => {
        return WORKSPACES.filter((item) => hasRole(userRole, item.roles));
    }, [userRole]);

    const userInitial = useMemo(() => {
        return currentUser?.email
            ? currentUser.email.charAt(0).toUpperCase()
            : 'U';
    }, [currentUser]);

    const username = useMemo(() => {
        return currentUser?.email?.split('@')[0] || 'Người dùng';
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Lỗi đăng xuất:', error);
        }
    };

    if (loading) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1E1E1E]/80 backdrop-blur-md text-vps-gold rounded-xl border border-vps-gray shadow-lg"
            >
                <Menu className="w-5 h-5" />
            </button>

            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/70 z-40 md:hidden"
                />
            )}

            <aside
                className={`
          fixed md:static inset-y-0 left-0 z-50 w-64
          bg-[#111111] border-r border-vps-gray/40
          flex flex-col transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
            >
                <div className="p-5 border-b border-vps-gray/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-vps-gold font-serif font-bold tracking-widest">
                            VỊ PHÙ SA
                        </h3>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-vps-ivory/40 mt-1">
                            Internal OS
                        </p>
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden text-vps-ivory/50 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 pt-4">
                    <label className="text-[10px] uppercase tracking-widest text-vps-ivory/40 mb-2 block">
                        Workspace
                    </label>

                    <div className="relative">
                        <select
                            value={workspace}
                            onChange={(event) => setWorkspace(event.target.value)}
                            className="w-full appearance-none bg-[#1A1A1A] border border-vps-gray/40 rounded-xl px-3 py-2.5 pr-9 text-sm text-vps-ivory focus:outline-none focus:border-vps-gold"
                        >
                            {availableWorkspaces.map((item) => (
                                <option key={item.key} value={item.key}>
                                    {item.name}
                                </option>
                            ))}
                        </select>

                        <ChevronDown className="w-4 h-4 text-vps-gold absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;

                        const accessGranted =
                            hasRole(userRole, item.roles) &&
                            hasAnyPermission(userRole, item.permissions || []);

                        if (!accessGranted) {
                            return (
                                <div
                                    key={item.path}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-vps-ivory/25 cursor-not-allowed"
                                >
                                    <Lock className="w-4 h-4" />
                                    <span className="text-sm">{item.name}</span>
                                </div>
                            );
                        }

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-300 border-l-4
                    ${isActive
                                        ? 'text-vps-gold bg-vps-gold/10 border-vps-gold'
                                        : 'text-vps-ivory/65 hover:text-vps-ivory hover:bg-[#1A1A1A] border-transparent'
                                    }
                  `
                                }
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-sm font-medium">
                                    {item.name}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-vps-gray/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-vps-gold text-vps-black flex items-center justify-center font-bold">
                            {userInitial}
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-vps-ivory truncate">
                                {username}
                            </p>
                            <p className="text-xs text-vps-ivory/45">
                                {ROLE_LABELS[userRole] || 'User'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors text-sm font-semibold"
                    >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;