import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    Wallet, Clapperboard, CheckCircle, ArrowUpRight,
    ArrowDownLeft, TrendingUp, Calendar, Activity, Cloud
} from 'lucide-react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
    Chart as ChartJS, CategoryScale, LinearScale,
    BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const [financeStats, setFinanceStats] = useState({ balance: 0, income: 0, expense: 0 });
    const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, inProgress: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hàm format tiền tệ siêu chống lỗi (Loại bỏ mọi chữ cái, giữ lại số)
    const formatCurrency = (value) => {
        const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    };

    useEffect(() => {
        let totalInc = 0;
        let totalExpTx = 0;
        let totalExpPayroll = 0;
        let totalExpMarketing = 0; // Thêm biến lưu tiền Marketing
        let txList = [];
        let prList = [];
        let marketingAct = null; // Thêm biến lưu dòng giao dịch Marketing

        const updateDashboardData = () => {
            // Cộng thêm cả chi phí Marketing vào Tổng Chi
            const totalExp = totalExpTx + totalExpPayroll + totalExpMarketing;
            setFinanceStats({ balance: totalInc - totalExp, income: totalInc, expense: totalExp });

            const formattedTx = txList.map(t => ({
                id: t.id,
                title: t.client || 'Giao dịch không tên',
                amount: t.amount,
                type: t.type,
                date: t.date,
                status: t.status,
                source: 'Kế toán',
                timestamp: t.timestamp || 0
            }));

            const formattedPayroll = prList.map(p => ({
                id: p.id,
                title: `[Lương/Thù lao] ${p.receiver || p.name || ''} - ${p.description || p.role || ''}`,
                amount: p.amount,
                type: 'Chi',
                date: p.date || new Date().toISOString().split('T')[0],
                status: p.status,
                source: 'Nhân sự',
                timestamp: p.timestamp || 0
            }));

            // Gom tất cả vào chung 1 mảng
            let allActivities = [...formattedTx, ...formattedPayroll];
            if (marketingAct) allActivities.push(marketingAct);

            const combined = allActivities
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5);

            setRecentActivities(combined);
            setLoading(false);
        };

        // 1. Kế toán (Transactions)
        const unsubFinance = onSnapshot(collection(db, 'transactions'), (snapshot) => {
            let inc = 0;
            let exp = 0;
            txList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            snapshot.forEach(doc => {
                const data = doc.data();
                const amountStr = data.amount ? String(data.amount) : "0";
                const amount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
                const typeStr = String(data.type || '').trim().toLowerCase();
                const statusStr = String(data.status || '').trim().toLowerCase();

                if (typeStr === 'thu' && statusStr === 'đã thanh toán') {
                    inc += amount;
                }
                if (typeStr === 'chi' && (statusStr === 'đã thanh toán' || statusStr === 'đã chi')) {
                    exp += amount;
                }
            });
            totalInc = inc;
            totalExpTx = exp;
            updateDashboardData();
        });

        // 2. Nhân sự (Payroll)
        const unsubPayroll = onSnapshot(collection(db, 'payroll'), (snapshot) => {
            let exp = 0;
            prList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            snapshot.forEach(doc => {
                const data = doc.data();
                const statusStr = String(data.status || '').trim().toLowerCase();

                if (statusStr === 'đã thanh toán' || statusStr === 'đã chi') {
                    const amountStr = data.amount ? String(data.amount) : "0";
                    const amount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
                    exp += amount;
                }
            });
            totalExpPayroll = exp;
            updateDashboardData();
        });

        // 3. Dự án (Tasks)
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

        // 4. Marketing (Lắng nghe dữ liệu tự động đồng bộ)
        const unsubMarketing = onSnapshot(doc(db, 'accounting_sync', 'marketing_expenses'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const amount = Number(data.amount) || 0;
                totalExpMarketing = amount;

                if (amount > 0) {
                    marketingAct = {
                        id: 'sync-marketing',
                        title: '[Marketing] Đồng bộ chi phí Ads',
                        amount: amount,
                        type: 'Chi',
                        date: new Date(data.updatedAt || Date.now()).toISOString().split('T')[0],
                        status: 'Đã thanh toán',
                        source: 'Marketing',
                        timestamp: data.updatedAt || Date.now() // Dùng để sort mới nhất
                    };
                } else {
                    marketingAct = null;
                }
            } else {
                totalExpMarketing = 0;
                marketingAct = null;
            }
            updateDashboardData();
        });

        return () => {
            unsubFinance();
            unsubPayroll();
            unsubTasks();
            unsubMarketing();
        };
    }, []);

    const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

    const barChartData = {
        labels: ['Tổng quan Tài chính (VNĐ)'],
        datasets: [
            {
                label: 'Tổng Thu Thực Tế',
                data: [financeStats.income],
                backgroundColor: 'rgba(74, 222, 128, 0.6)',
                borderColor: '#4ade80',
                borderWidth: 1,
                borderRadius: 6,
            },
            {
                label: 'Tổng Chi Thực Tế',
                data: [financeStats.expense],
                backgroundColor: 'rgba(248, 113, 113, 0.6)',
                borderColor: '#f87171',
                borderWidth: 1,
                borderRadius: 6,
            },
            {
                label: 'Tồn Quỹ Hiện Tại',
                data: [financeStats.balance],
                backgroundColor: 'rgba(212, 175, 55, 0.6)',
                borderColor: '#D4AF37',
                borderWidth: 1,
                borderRadius: 6,
            }
        ]
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#EAE6DF' } },
            tooltip: { padding: 12 }
        },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
            x: { grid: { display: false }, ticks: { color: '#888' } }
        }
    };

    return (
        <div className="min-h-screen bg-vps-black flex w-full max-w-[100vw] overflow-x-hidden relative">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto w-full">

                {/* Header (Có Cloud Icon) */}
                <div className="mb-6 md:mb-10">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-vps-gold">Tổng quan Hoạt động</h1>
                        <Cloud className="w-5 h-5 text-green-500" title="Đã đồng bộ với Cloud" />
                    </div>
                    <p className="text-sm md:text-base text-vps-ivory opacity-60 mt-1">Hệ thống phân tích dữ liệu hợp nhất thời gian thực.</p>
                </div>

                {/* Khối Thẻ Chỉ số */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
                    <div className="bg-[#1E1E1E] border border-vps-gold/30 p-5 md:p-6 rounded-xl shadow-lg relative overflow-hidden group hover:border-vps-gold/60 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-vps-ivory opacity-60 mb-2">Tồn Quỹ Hiện Tại</p>
                                <h3 className="text-xl md:text-2xl font-bold text-vps-gold">{formatCurrency(financeStats.balance)}</h3>
                            </div>
                            <div className="p-2 md:p-3 bg-vps-gold/10 rounded-lg">
                                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-vps-gold" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-[10px] md:text-xs text-vps-gold opacity-80">
                            <TrendingUp className="w-3 h-3" /> Dòng tiền khả dụng
                        </div>
                    </div>

                    <div className="bg-[#1E1E1E] border border-vps-gray p-5 md:p-6 rounded-xl shadow-lg hover:border-green-500/40 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-vps-ivory opacity-60 mb-2">Tổng Thu Thực Tế</p>
                                <h3 className="text-xl md:text-2xl font-bold text-green-400">{formatCurrency(financeStats.income)}</h3>
                            </div>
                            <div className="p-2 md:p-3 bg-green-500/10 rounded-lg">
                                <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1E1E1E] border border-vps-gray p-5 md:p-6 rounded-xl shadow-lg hover:border-red-500/40 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-vps-ivory opacity-60 mb-2">Tổng Chi (Gồm Lương)</p>
                                <h3 className="text-xl md:text-2xl font-bold text-red-400">{formatCurrency(financeStats.expense)}</h3>
                            </div>
                            <div className="p-2 md:p-3 bg-red-500/10 rounded-lg">
                                <ArrowDownLeft className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1E1E1E] border border-vps-gray p-5 md:p-6 rounded-xl shadow-lg hover:border-blue-500/40 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs md:text-sm text-vps-ivory opacity-60 mb-2">Dự án Đang Sản xuất</p>
                                <h3 className="text-xl md:text-2xl font-bold text-blue-400">{taskStats.inProgress} / {taskStats.total}</h3>
                            </div>
                            <div className="p-2 md:p-3 bg-blue-500/10 rounded-lg">
                                <Clapperboard className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                            </div>
                        </div>
                        <div className="mt-4 text-[10px] md:text-xs text-gray-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-400" /> Đã hoàn thành {taskStats.completed} dự án
                        </div>
                    </div>
                </div>

                {/* Vùng Phân tích */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-10 w-full">

                    <div className="lg:col-span-2 space-y-6 md:space-y-8 w-full">
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl p-4 md:p-6 shadow-lg w-full">
                            <h2 className="text-base md:text-lg font-semibold text-vps-ivory mb-4">Phân tích Số dư & Cân đối</h2>
                            <div className="h-56 md:h-64 w-full">
                                <Bar data={barChartData} options={barChartOptions} />
                            </div>
                        </div>

                        {/* Danh sách Giao dịch đã sửa lỗi logic */}
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl overflow-hidden shadow-lg w-full">
                            <div className="p-4 border-b border-vps-gray bg-[#1A1A1A] flex items-center gap-2">
                                <Activity className="w-4 h-4 text-vps-gold" />
                                <h2 className="text-base md:text-lg font-semibold text-vps-ivory">Biến động Tài chính & Nhân sự</h2>
                            </div>
                            <div className="divide-y divide-vps-gray/40">
                                {loading ? (
                                    <div className="p-6 text-center text-vps-gold opacity-70 text-sm">Đang nạp dữ liệu...</div>
                                ) : recentActivities.length === 0 ? (
                                    <div className="p-6 text-center text-vps-ivory opacity-40 text-sm">Chưa có biến động.</div>
                                ) : (
                                    recentActivities.map((act) => (
                                        <div key={act.id} className="p-4 hover:bg-[#252525] transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-3 sm:gap-0">
                                            <div className="space-y-2 sm:space-y-1 w-full sm:w-auto">
                                                <div className="flex items-start sm:items-center gap-2 flex-wrap">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0 
                                                        ${act.source === 'Kế toán' ? 'bg-amber-900/40 text-vps-gold' :
                                                            act.source === 'Nhân sự' ? 'bg-purple-900/40 text-purple-300' :
                                                                'bg-blue-900/40 text-blue-400'}`}>
                                                        {act.source}
                                                    </span>
                                                    <span className="text-vps-ivory font-medium break-words max-w-full line-clamp-2">{act.title}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {act.date}</span>
                                                    <span className="hidden sm:inline">Trạng thái: <span className="text-vps-ivory/80">{act.status}</span></span>
                                                </div>
                                            </div>

                                            {/* SỬA LỖI Ở ĐÂY: Đã thêm formatCurrency(act.amount) */}
                                            <div className="w-full sm:w-auto border-t border-vps-gray/30 sm:border-t-0 pt-2 sm:pt-0 sm:pl-4 flex justify-between sm:block items-center">
                                                <span className="sm:hidden text-[10px] text-vps-ivory/80 bg-[#1A1A1A] px-2 py-1 rounded border border-vps-gray">{act.status}</span>
                                                <span className={`font-bold block text-right tracking-wide ${String(act.type).trim().toLowerCase() === 'thu' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {String(act.type).trim().toLowerCase() === 'thu' ? '+' : '-'}{formatCurrency(act.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vùng Tiến độ */}
                    <div className="space-y-8 w-full">
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl p-5 md:p-6 shadow-lg flex flex-col justify-between h-full min-h-[300px] md:min-h-[350px]">
                            <div>
                                <h2 className="text-base md:text-lg font-semibold text-vps-ivory mb-2">Tiến độ Nghiệm thu</h2>
                                <p className="text-xs text-gray-400 mb-6">Hiệu suất phân phối dự án truyền thông.</p>

                                <div className="flex flex-col items-center justify-center my-4 md:my-6 space-y-4">
                                    <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center rounded-full border-4 border-vps-gray">
                                        <div className="absolute inset-0 rounded-full border-4 border-vps-gold animate-pulse opacity-20"></div>
                                        <span className="text-2xl md:text-3xl font-serif font-bold text-vps-gold">{completionRate}%</span>
                                    </div>
                                    <span className="text-xs md:text-sm text-vps-ivory/80 font-medium">Hoàn thành mục tiêu</span>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                <div className="flex justify-between text-[10px] md:text-xs text-gray-400">
                                    <span>Tiến độ tổng thể</span>
                                    <span>{taskStats.completed} / {taskStats.total} Bản ghi</span>
                                </div>
                                <div className="w-full bg-vps-gray h-2 md:h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-vps-gold h-full rounded-full transition-all duration-500"
                                        style={{ width: `${completionRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;