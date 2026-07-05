import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, Users, Megaphone,
    Clapperboard, CheckSquare, LogOut, Menu, X
} from 'lucide-react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { userRole, currentUser } = useAuth(); // Lấy quyền của người dùng

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    };

    // Cấu hình menu và phân quyền
    const menuItems = [
        { path: '/', name: 'Tổng quan', icon: LayoutDashboard, roles: ['founder', 'back_office', 'front_office'] },
        { path: '/accounting', name: 'Hành chính & Kế toán', icon: Wallet, roles: ['founder', 'back_office'] },
        { path: '/hr', name: 'Nhân sự & Đào tạo', icon: Users, roles: ['founder', 'back_office'] },
        // Back-office vẫn thấy Marketing/Sản xuất để click vào xem
        { path: '/marketing', name: 'Marketing & Sales', icon: Megaphone, roles: ['founder', 'front_office', 'staff', 'back_office'] },
        { path: '/production', name: 'Sản xuất', icon: Clapperboard, roles: ['founder', 'front_office', 'staff', 'back_office'] },
        { path: '/tasks', name: 'TaskBoard', icon: CheckSquare, roles: ['founder', 'back_office', 'front_office', 'staff', 'freelancer'] },
    ];

    // Lọc ra các menu được phép xem
    const allowedMenus = menuItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* Nút mở menu trên Mobile */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1E1E1E] text-vps-gold rounded-lg border border-vps-gray shadow-lg"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-[60]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-[70] w-64 bg-[#111111] border-r border-vps-gray transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

                {/* Logo & Close Button */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-vps-gray">
                    <h2 className="text-2xl font-serif font-bold text-vps-gold tracking-wider">VỊ PHÙ SA</h2>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Danh sách Menu (Đã được lọc) */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {allowedMenus.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-vps-gold text-vps-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                                        : 'text-vps-ivory/70 hover:bg-[#1E1E1E] hover:text-vps-gold'
                                    }`
                                }
                            >
                                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110`} />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Thông tin User & Đăng xuất */}
                <div className="p-4 border-t border-vps-gray bg-[#0a0a0a]">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-[#1E1E1E] border border-vps-gray/50">
                        <div className="w-8 h-8 rounded-full bg-vps-gold/20 flex items-center justify-center text-vps-gold font-bold">
                            {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs text-vps-ivory font-medium truncate">{currentUser?.email}</p>
                            <p className="text-[10px] text-vps-gold uppercase font-bold">{userRole}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Đăng xuất</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;