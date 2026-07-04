import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calculator,
    Users,
    Megaphone,
    Video,
    KanbanSquare,
    Archive,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const Sidebar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        await signOut(auth);
    };

    const menuItems = [
        { path: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
        { path: '/accounting', icon: <Calculator className="w-5 h-5" />, label: 'Hành chính - Kế toán' },
        { path: '/hr', icon: <Users className="w-5 h-5" />, label: 'Nhân sự & Đào tạo' },
        { path: '/marketing', icon: <Megaphone className="w-5 h-5" />, label: 'Marketing & Sales' },
        { path: '/production', icon: <Video className="w-5 h-5" />, label: 'Vận hành Sản xuất' },
        { path: '/tasks', icon: <KanbanSquare className="w-5 h-5" />, label: 'Quản lý Công việc' },
        { path: '/archive', icon: <Archive className="w-5 h-5" />, label: 'Lưu trữ Dự án' },
    ];

    return (
        <>
            {/* Mobile Top Navigation Bar (Thay thế nút lơ lửng) */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1A1A1A] border-b border-vps-gray z-40 flex items-center justify-between px-4 shadow-md">
                <div>
                    <h2 className="text-xl font-serif font-bold text-vps-gold tracking-wider">VỊ PHÙ SA</h2>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 -mr-2 text-vps-gold hover:bg-vps-gray/20 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Lớp phủ làm mờ màn hình khi mở menu trên mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Thanh Sidebar chính */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1A1A1A] border-r border-vps-gray flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6 border-b border-vps-gray flex justify-between items-center bg-[#1E1E1E]">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-vps-gold tracking-wider">VỊ PHÙ SA</h2>
                        <p className="text-[10px] text-vps-ivory opacity-50 tracking-widest uppercase mt-1">Media & Entertainment</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-vps-ivory opacity-60 hover:text-vps-gold p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-vps-gold/10 text-vps-gold font-medium border border-vps-gold/30' : 'text-vps-ivory opacity-60 hover:bg-[#222] hover:opacity-100 hover:text-vps-gold border border-transparent'}`}
                            >
                                {item.icon}
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-vps-gray">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 opacity-80 hover:bg-red-500/10 hover:opacity-100 transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm">Đăng xuất</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;