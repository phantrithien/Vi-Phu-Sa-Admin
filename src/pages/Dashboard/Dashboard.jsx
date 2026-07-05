import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import {
    Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft,
    Clapperboard, CheckCircle, Lock, Activity, Cloud
} from 'lucide-react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Dashboard = () => {
    // ==========================================
    // 1. PHÂN QUYỀN TRUY CẬP (RBAC)
    // ==========================================
    const { userRole } = useAuth();
    const hasFinancialAccess = ['founder', 'back_office'].includes(userRole);
    const hasProjectAccess = ['founder', 'back_office', 'front_office'].includes(userRole);

    // ==========================================
    // 2. STATE LƯU TRỮ DỮ LIỆU REAL-TIME
    // ==========================================
    const [financeStats, setFinanceStats] = useState({ balance: 0, income: 0, expense: 0 });
    const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, inProgress: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hàm format tiền tệ
    const formatCurrency = (value) => {
        const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    };

    // ==========================================
    // 3. LOGIC KÉO DỮ LIỆU FIREBASE
    // ==========================================
    useEffect(() => {
        let totalInc = 0;
        let totalExpTx = 0;
        let totalExpPayroll = 0;
        let totalExpMarketing = 0;
        let txList = [];
        let prList = [];
        let marketingAct = null;

        const updateDashboardData = () => {
            const totalExp = totalExpTx + totalExpPayroll + totalExpMarketing;
            setFinanceStats({ balance: totalInc - totalExp, income: totalInc, expense: totalExp });

            const formattedTx = txList.map(t => ({
                id: t.id,
                title: t.client || 'Giao dịch không tên',
                amount: t.amount,
                type: t.type,
                date: t.date,
                status: t.status,
                source: 'KẾ TOÁN',
                timestamp: t.timestamp || 0
            }));

            const formattedPayroll = prList.map(p => ({
                id: p.id,
                title: `[Lương] ${p.receiver || p.name || ''} - ${p.description || p.role || ''}`,
                amount: p.amount,
                type: 'Chi',
                date: p.date || new Date().toISOString().split('T')[0],
                status: p.status,
                source: 'NHÂN SỰ',
                timestamp: p.timestamp || 0
            }));

            let allActivities = [...formattedTx, ...formattedPayroll];
            if (marketingAct) allActivities.push(marketingAct);

            const combined = allActivities
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 6); // Lấy 6 biến động mới nhất

            setRecentActivities(combined);
            setLoading(false);
        };

        // 3.1 Kế toán (Transactions)
        const unsubFinance = onSnapshot(collection(db, 'transactions'), (snapshot) => {
            let inc = 0;
            let exp = 0;
            txList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            snapshot.forEach(doc => {
                const data = doc.data();
                const amount = typeof data.amount === 'string' ? parseInt(data.amount.replace(/[^0-9]/g, ''), 10) || 0 : data.amount || 0;
                const typeStr = String(data.type || '').trim().toLowerCase();
                const statusStr = String(data.status || '').trim().toLowerCase();

                if (typeStr === 'thu' && statusStr === 'đã thanh toán') inc += amount;
                if (typeStr === 'chi' && (statusStr === 'đã thanh toán' || statusStr === 'đã chi')) exp += amount;
            });
            totalInc = inc;
            totalExpTx = exp;
            updateDashboardData();
        });

        // 3.2 Nhân sự (Payroll)
        const unsubPayroll = onSnapshot(collection(db, 'payroll'), (snapshot) => {
            let exp = 0;
            prList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            snapshot.forEach(doc => {
                const data = doc.data();
                const statusStr = String(data.status || '').trim().toLowerCase();

                if (statusStr === 'đã thanh toán' || statusStr === 'đã chi') {
                    const amount = typeof data.amount === 'string' ? parseInt(data.amount.replace(/[^0-9]/g, ''), 10) || 0 : data.amount || 0;
                    exp += amount;
                }
            });
            totalExpPayroll = exp;
            updateDashboardData();
        });

        // 3.3 Dự án (Tasks/Boards)
        const unsubTasks = onSnapshot(doc(db, 'boards', 'main-board'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const completedTasks = (data.columns && data.columns['col-4'] && data.columns['col-4'].taskIds)
                    ? data.columns['col-4'].taskIds.length : 0;
                const totalTasks = data.tasks ? Object.keys(data.tasks).length : 0;
                const inProgressTasks = totalTasks - completedTasks;

                setTaskStats({ total: totalTasks, completed: completedTasks, inProgress: inProgressTasks });
            }
        });

        // 3.4 Marketing (Đồng bộ chi phí)
        const unsubMarketing = onSnapshot(doc(db, 'accounting_sync', 'marketing_expenses'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const amount = Number(data.amount) || 0;
                totalExpMarketing = amount;

                if (amount > 0) {
                    marketingAct = {
                        id: 'sync-marketing',
                        title: 'Đồng bộ chi phí Ads tổng',
                        amount: amount,
                        type: 'Chi',
                        date: new Date(data.updatedAt || Date.now()).toISOString().split('T')[0],
                        status: 'Đã thanh toán',
                        source: 'MARKETING',
                        timestamp: data.updatedAt || Date.now()
                    };
                } else { marketingAct = null; }
            } else {
                totalExpMarketing = 0;
                marketingAct = null;
            }
            updateDashboardData();
        });

        return () => { unsubFinance(); unsubPayroll(); unsubTasks(); unsubMarketing(); };
    }, []);

    // Tính toán tiến độ
    const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex w-full max-w-[100vw] overflow-x-hidden relative text-vps-ivory">
            <Sidebar />

            <div className="flex-1 md:ml-64 p-5 pt-24 md:p-10 md:pt-10 overflow-y-auto w-full">

                {/* ================= HEADER ================= */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-vps-gold drop-shadow-md">Tổng quan Hoạt động</h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                                <Cloud className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Đã đồng bộ</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">Hệ thống phân tích dữ liệu hợp nhất thời gian thực.</p>
                    </div>
                </div>

                {/* ================= KHỐI THẺ CHỈ SỐ ================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

                    {hasFinancialAccess && (
                        <>
                            {/* Thẻ 1: Tồn Quỹ */}
                            <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gold/30 p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-vps-gold/10 rounded-full blur-2xl group-hover:bg-vps-gold/20 transition-all"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tồn Quỹ Hiện Tại</p>
                                        <h3 className="text-2xl md:text-3xl font-bold text-vps-gold tracking-tight">{formatCurrency(financeStats.balance)}</h3>
                                    </div>
                                    <div className="p-3 bg-vps-gold/10 rounded-xl border border-vps-gold/20 shadow-inner">
                                        <Wallet className="w-6 h-6 text-vps-gold drop-shadow-lg" />
                                    </div>
                                </div>
                            </div>

                            {/* Thẻ 2: Tổng Thu */}
                            <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-green-500/30 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng Thu Thực Tế</p>
                                        <h3 className="text-2xl md:text-3xl font-bold text-green-400 tracking-tight">{formatCurrency(financeStats.income)}</h3>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                        <ArrowUpRight className="w-6 h-6 text-green-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Thẻ 3: Tổng Chi */}
                            <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-red-500/30 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng Chi (Gồm Lương)</p>
                                        <h3 className="text-2xl md:text-3xl font-bold text-red-400 tracking-tight">{formatCurrency(financeStats.expense)}</h3>
                                    </div>
                                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                        <ArrowDownLeft className="w-6 h-6 text-red-400" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {hasProjectAccess && (
                        /* Thẻ 4: Dự án */
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Dự án Đang Sản xuất</p>
                                    <h3 className="text-2xl md:text-3xl font-bold text-blue-400 tracking-tight">{taskStats.inProgress} / {taskStats.total}</h3>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <Clapperboard className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                            <div className="mt-5 text-xs text-gray-400 flex items-center gap-1.5 font-medium relative z-10">
                                <CheckCircle className="w-4 h-4 text-green-400" /> Hoàn thành {taskStats.completed} dự án
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= KHỐI BIỂU ĐỒ ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

                    {hasFinancialAccess && (
                        <div className="lg:col-span-2 bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl p-7 shadow-xl">
                            <h3 className="font-bold text-lg text-vps-ivory mb-6 tracking-wide">Phân tích Số dư & Cân đối</h3>

                            {/* Biểu đồ giả lập dựa trên dữ liệu thật */}
                            <div className="h-64 w-full flex items-end justify-center gap-6 border-b border-l border-vps-gray/30 pb-4 pl-6 relative">
                                <div className="absolute left-0 bottom-4 text-xs font-medium text-gray-500 -ml-8">0</div>

                                <div className="w-24 md:w-32 bg-gradient-to-t from-green-600 to-green-400 h-[90%] rounded-t-md relative group shadow-[0_0_15px_rgba(74,222,128,0.15)]">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold pointer-events-none">{formatCurrency(financeStats.income)}</div>
                                </div>
                                <div className="w-24 md:w-32 bg-gradient-to-t from-red-600 to-red-400 h-[30%] rounded-t-md relative group shadow-[0_0_15px_rgba(248,113,113,0.15)]">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold pointer-events-none">{formatCurrency(financeStats.expense)}</div>
                                </div>
                                <div className="w-24 md:w-32 bg-gradient-to-t from-yellow-600 to-vps-gold h-[60%] rounded-t-md relative group shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded text-xs text-vps-gold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold pointer-events-none">{formatCurrency(financeStats.balance)}</div>
                                </div>
                            </div>
                            <div className="flex justify-center gap-6 md:gap-8 mt-8">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span className="text-xs font-medium text-gray-400">Tổng Thu</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-full"></div><span className="text-xs font-medium text-gray-400">Tổng Chi</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-vps-gold rounded-full"></div><span className="text-xs font-medium text-gray-400">Tồn Quỹ</span></div>
                            </div>
                        </div>
                    )}

                    {hasProjectAccess && (
                        <div className="lg:col-span-1 bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl p-7 shadow-xl flex flex-col">
                            <h3 className="font-bold text-lg text-vps-ivory mb-1 tracking-wide">Tiến độ Nghiệm thu</h3>
                            <p className="text-xs text-gray-500 mb-8">Hiệu suất dự án truyền thông.</p>

                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="relative w-36 h-36 rounded-full border-[10px] border-[#222] flex items-center justify-center mb-6 shadow-inner">
                                    {/* SVG Circle Progress */}
                                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                        <circle cx="62" cy="62" r="57" fill="none" stroke="currentColor" strokeWidth="10" className="text-vps-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" strokeDasharray="358" strokeDashoffset={358 - (358 * completionRate) / 100} strokeLinecap="round" />
                                    </svg>
                                    <span className="text-3xl font-serif font-bold text-vps-gold relative z-10">{completionRate}%</span>
                                </div>
                                <p className="text-sm text-vps-ivory/80 font-semibold tracking-wide">Hoàn thành mục tiêu</p>
                            </div>

                            <div className="mt-8 bg-[#222] p-4 rounded-xl border border-vps-gray/10">
                                <div className="flex justify-between text-xs font-medium text-gray-400 mb-3">
                                    <span>Tiến độ tổng thể</span>
                                    <span className="text-vps-gold">{taskStats.completed} / {taskStats.total} Bản ghi</span>
                                </div>
                                <div className="w-full bg-[#111] h-2.5 rounded-full overflow-hidden border border-vps-gray/20">
                                    <div className="bg-gradient-to-r from-yellow-600 to-vps-gold h-full rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= KHỐI LỊCH SỬ GIAO DỊCH ================= */}
                {hasFinancialAccess && (
                    <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl p-7 shadow-xl mb-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-vps-gold/10 rounded-lg border border-vps-gold/20">
                                <Activity className="w-5 h-5 text-vps-gold" />
                            </div>
                            <h3 className="font-bold text-lg text-vps-ivory tracking-wide">Biến động Tài chính & Nhân sự</h3>
                        </div>

                        <div className="space-y-3">
                            {loading && <div className="text-center text-vps-gold py-6 text-sm font-medium">Đang tải dữ liệu...</div>}
                            {!loading && recentActivities.length === 0 && <div className="text-center text-gray-500 py-6 text-sm">Chưa có giao dịch nào gần đây.</div>}

                            {recentActivities.map((act) => (
                                <div key={act.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#222] border border-vps-gray/10 hover:border-vps-gray/40 hover:bg-[#252525] transition-all duration-300 group">
                                    <div className="flex-1 pr-4 mb-3 sm:mb-0">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase 
                                                ${act.source === 'MARKETING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    : act.source === 'NHÂN SỰ' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                {act.source}
                                            </span>
                                            <h4 className="text-sm font-semibold text-vps-ivory group-hover:text-white transition-colors line-clamp-1">{act.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-5 text-xs text-gray-500 font-medium">
                                            <span className="flex items-center gap-1.5">📅 {act.date}</span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                <span className="text-gray-400">{act.status}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`text-base font-bold tracking-wide ${String(act.type).toLowerCase() === 'thu' ? 'text-green-400' : 'text-red-400'}`}>
                                            {String(act.type).toLowerCase() === 'thu' ? '+' : '-'}{formatCurrency(act.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ================= FALLBACK BẢO MẬT (DÀNH CHO STAFF / FREELANCER) ================= */}
                {!hasFinancialAccess && !hasProjectAccess && (
                    <div className="flex flex-col items-center justify-center py-32 px-4">
                        <div className="relative mb-8 group">
                            <div className="absolute inset-0 bg-vps-gold/20 blur-3xl rounded-full group-hover:bg-vps-gold/30 transition-all duration-500"></div>
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#222] to-[#111] flex items-center justify-center border border-vps-gray/30 shadow-2xl relative z-10">
                                <Lock className="w-10 h-10 text-vps-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-vps-ivory mb-4 font-serif tracking-wide">Khu vực Bảo mật</h2>
                        <p className="text-gray-400 text-center max-w-md leading-relaxed text-sm font-medium">
                            Trang Tổng quan chứa các dữ liệu tài chính cấp quản lý. <br /><br />
                            Vui lòng điều hướng sang thẻ <b className="text-vps-gold bg-vps-gold/10 px-2 py-1 rounded">TaskBoard</b> ở menu bên trái để tiếp tục công việc của bạn.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Dashboard;