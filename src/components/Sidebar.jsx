import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, Users, Megaphone,
    Clapperboard, CheckSquare, LogOut, Menu, X, Lock
} from 'lucide-react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { userRole, currentUser } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    };

    const menuItems = [
        { path: '/', name: 'Tổng quan', icon: LayoutDashboard, roles: ['executive', 'founder', 'back_office', 'front_office'] },
        { path: '/accounting', name: 'Hành chính & Kế toán', icon: Wallet, roles: ['founder', 'back_office'] },
        { path: '/hr', name: 'Nhân sự & Đào tạo', icon: Users, roles: ['founder', 'back_office'] },
        { path: '/marketing', name: 'Marketing & Sales', icon: Megaphone, roles: ['founder', 'front_office', 'staff', 'back_office'] },
        { path: '/production', name: 'Sản xuất', icon: Clapperboard, roles: ['founder', 'front_office', 'staff', 'back_office', 'freelancer'] },
        { path: '/tasks', name: 'TaskBoard', icon: CheckSquare, roles: ['founder', 'back_office', 'front_office', 'staff', 'freelancer'] },
    ];

    return (
        <>
            {/* Nút Mobile */}
            <button onClick={() => setIsOpen(true)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1E1E1E]/80 backdrop-blur-md text-vps-gold rounded-xl border border-vps-gray shadow-lg">
                <Menu className="w-6 h-6" />
            </button>

            {/* Overlay Mobile */}
            {isOpen && <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" onClick={() => setIsOpen(false)} />}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-[70] w-64 bg-[#0A0A0A] border-r border-vps-gray/40 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

                {/* Logo */}
                <div className="h-24 flex items-center justify-between px-8 border-b border-vps-gray/30">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-vps-gold to-yellow-200 tracking-widest drop-shadow-sm">VỊ PHÙ SA</h2>
                        <span className="text-[10px] text-vps-ivory/40 uppercase tracking-[0.2em] mt-1 font-medium">Administration</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Menu */}
                <nav className="flex-1 px-4 py-8 space-y-2.5 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const superRoles = ['founder', 'executive', 'admin'];
                        const hasAccess = superRoles.includes(userRole) || item.roles.includes(userRole);

                        // Hiển thị một thẻ DIV bị vô hiệu hóa, không thể click nếu người dùng không có quyền
                        if (!hasAccess) {
                            return (
                                <div
                                    key={item.path}
                                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 opacity-50 cursor-not-allowed text-vps-ivory/60 border-l-4 border-transparent"
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="flex-1 font-medium text-sm tracking-wide">{item.name}</span>
                                    {/* Lưu ý: Đổi thành <LockIcon /> nếu lỗi vẫn còn sau khi đã cập nhật thư viện */}
                                    <Lock className="w-4 h-4 text-gray-600" />
                                </div>
                            );
                        }

                        // Hiển thị NavLink thực sự nếu người dùng CÓ quyền truy cập
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                        ? 'text-vps-gold bg-gradient-to-r from-vps-gold/15 to-transparent border-l-4 border-vps-gold shadow-[inset_0px_0px_20px_rgba(212,175,55,0.05)]'
                                        : 'text-vps-ivory/60 hover:text-vps-ivory hover:bg-[#1A1A1A] border-l-4 border-transparent'
                                    }`
                                }
                            >
                                <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-vps-gold" />
                                <span className="flex-1 font-medium text-sm tracking-wide">{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer User Profile */}
                <div className="p-5 border-t border-vps-gray/30 bg-gradient-to-t from-black to-[#0A0A0A]">
                    <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-xl bg-[#141414] border border-vps-gray/40 shadow-inner">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-vps-gold to-yellow-600 flex items-center justify-center text-[#111] font-bold shadow-lg shadow-vps-gold/20">
                            {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm text-vps-ivory font-semibold truncate">{currentUser?.email?.split('@')[0]}</p>
                            <p className="text-[10px] text-vps-gold/80 uppercase font-bold tracking-wider">{userRole}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 font-medium text-sm group">
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Đăng xuất hệ thống</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;