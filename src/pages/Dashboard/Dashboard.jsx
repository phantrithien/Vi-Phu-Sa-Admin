import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';

import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clapperboard,
    CheckCircle,
    Lock,
    Activity,
    Cloud
} from 'lucide-react';

import {
    collection,
    onSnapshot,
    doc
} from 'firebase/firestore';

import { db } from '../../config/firebase';

import {
    PERMISSIONS,
    hasPermission
} from '../../constants/permissions';

import {
    formatCurrency
} from '../../utils/formatters';

const Dashboard = () => {
    const {
        userRole,
        loading: authLoading
    } = useAuth();

    const hasFinancialAccess = hasPermission(
        userRole,
        PERMISSIONS.VIEW_ACCOUNTING
    );

    const hasProjectAccess = hasPermission(
        userRole,
        PERMISSIONS.VIEW_PRODUCTION
    );

    const [financeStats, setFinanceStats] = useState({
        balance: 0,
        income: 0,
        expense: 0
    });

    const [taskStats, setTaskStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0
    });

    const [recentActivities, setRecentActivities] =
        useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let totalIncome = 0;
        let totalExpenseTx = 0;
        let totalExpensePayroll = 0;
        let totalExpenseMarketing = 0;

        let transactionList = [];
        let payrollList = [];
        let marketingActivity = null;

        const updateDashboardData = () => {
            const totalExpense =
                totalExpenseTx +
                totalExpensePayroll +
                totalExpenseMarketing;

            setFinanceStats({
                balance: totalIncome - totalExpense,
                income: totalIncome,
                expense: totalExpense
            });

            const transactionActivities =
                transactionList.map(item => ({
                    id: item.id,
                    title:
                        item.client ||
                        'Giao dịch không tên',
                    amount: item.amount,
                    type: item.type,
                    date: item.date,
                    status: item.status,
                    source: 'KẾ TOÁN',
                    timestamp: item.timestamp || 0
                }));

            const payrollActivities =
                payrollList.map(item => ({
                    id: item.id,
                    title: `[Lương] ${item.receiver ||
                        item.name ||
                        ''
                        } - ${item.description ||
                        item.role ||
                        ''
                        }`,
                    amount: item.amount,
                    type: 'Chi',
                    date:
                        item.date ||
                        new Date()
                            .toISOString()
                            .split('T')[0],
                    status: item.status,
                    source: 'NHÂN SỰ',
                    timestamp: item.timestamp || 0
                }));

            let activities = [
                ...transactionActivities,
                ...payrollActivities
            ];

            if (marketingActivity) {
                activities.push(marketingActivity);
            }

            setRecentActivities(
                activities
                    .sort(
                        (a, b) =>
                            b.timestamp - a.timestamp
                    )
                    .slice(0, 6)
            );

            setLoading(false);
        };

        const unsubTransactions = onSnapshot(
            collection(db, 'transactions'),
            snapshot => {
                let income = 0;
                let expense = 0;

                transactionList =
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                snapshot.forEach(item => {
                    const data = item.data();

                    const amount =
                        typeof data.amount === 'string'
                            ? parseInt(
                                data.amount.replace(
                                    /[^0-9]/g,
                                    ''
                                ),
                                10
                            ) || 0
                            : data.amount || 0;

                    const type = String(
                        data.type || ''
                    )
                        .trim()
                        .toLowerCase();

                    const status = String(
                        data.status || ''
                    )
                        .trim()
                        .toLowerCase();

                    if (
                        type === 'thu' &&
                        status === 'đã thanh toán'
                    ) {
                        income += amount;
                    }

                    if (
                        type === 'chi' &&
                        (
                            status === 'đã thanh toán' ||
                            status === 'đã chi'
                        )
                    ) {
                        expense += amount;
                    }
                });

                totalIncome = income;
                totalExpenseTx = expense;

                updateDashboardData();
            }
        );

        const unsubPayroll = onSnapshot(
            collection(db, 'payroll'),
            snapshot => {
                let expense = 0;

                payrollList =
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                snapshot.forEach(item => {
                    const data = item.data();

                    const status = String(
                        data.status || ''
                    )
                        .trim()
                        .toLowerCase();

                    if (
                        status ===
                        'đã thanh toán' ||
                        status === 'đã chi'
                    ) {
                        const amount =
                            typeof data.amount ===
                                'string'
                                ? parseInt(
                                    data.amount.replace(
                                        /[^0-9]/g,
                                        ''
                                    ),
                                    10
                                ) || 0
                                : data.amount || 0;

                        expense += amount;
                    }
                });

                totalExpensePayroll = expense;

                updateDashboardData();
            }
        );

        const unsubTasks = onSnapshot(
            doc(db, 'boards', 'main-board'),
            snapshot => {
                if (!snapshot.exists()) return;

                const data = snapshot.data();

                const completed =
                    data.columns?.['col-4']
                        ?.taskIds?.length || 0;

                const total =
                    data.tasks
                        ? Object.keys(
                            data.tasks
                        ).length
                        : 0;

                setTaskStats({
                    total,
                    completed,
                    inProgress:
                        total - completed
                });
            }
        );

        const unsubMarketing = onSnapshot(
            doc(
                db,
                'accounting_sync',
                'marketing_expenses'
            ),
            snapshot => {
                if (snapshot.exists()) {
                    const data =
                        snapshot.data();

                    totalExpenseMarketing =
                        Number(data.amount) ||
                        0;

                    marketingActivity =
                        totalExpenseMarketing > 0
                            ? {
                                id:
                                    'sync-marketing',
                                title:
                                    'Đồng bộ chi phí Ads tổng',
                                amount:
                                    totalExpenseMarketing,
                                type: 'Chi',
                                date: new Date(
                                    data.updatedAt ||
                                    Date.now()
                                )
                                    .toISOString()
                                    .split('T')[0],
                                status:
                                    'Đã thanh toán',
                                source:
                                    'MARKETING',
                                timestamp:
                                    data.updatedAt ||
                                    Date.now()
                            }
                            : null;
                } else {
                    totalExpenseMarketing = 0;
                    marketingActivity = null;
                }

                updateDashboardData();
            }
        );

        return () => {
            unsubTransactions();
            unsubPayroll();
            unsubTasks();
            unsubMarketing();
        };
    }, [userRole]);

    const completionRate = Math.min(
        100,
        taskStats.total > 0
            ? Math.round(
                (taskStats.completed /
                    taskStats.total) *
                100
            )
            : 0
    );

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-vps-gold">
                Đang tải dữ liệu...
            </div>
        );
    }

    return (
        <AppShell
            title="Command Center"
            subtitle="Tổng quan vận hành và KPI nhanh"
            actions={[
                <StatusBadge key="status" label="MVP Live" variant="info" />,
            ]}
        >
            {loading ? (
                <LoadingState title="Đang tải tổng quan" description="Đang tổng hợp dữ liệu project, task và finance." />
            ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-vps-gray/30 bg-[#141414] p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-vps-ivory/60">Dự án</p>
                            <StatusBadge label="Live" variant="success" />
                        </div>
                        <p className="mt-4 text-3xl font-semibold text-vps-ivory">{taskStats.total}</p>
                        <p className="mt-2 text-sm text-vps-ivory/60">{taskStats.completed} hoàn thành • {taskStats.inProgress} đang chạy</p>
                    </div>

                    <div className="rounded-2xl border border-vps-gray/30 bg-[#141414] p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-vps-ivory/60">Tài chính</p>
                            <StatusBadge label="Cân bằng" variant="warning" />
                        </div>
                        <p className="mt-4 text-3xl font-semibold text-vps-ivory">{formatCurrency(financeStats.balance)}</p>
                        <p className="mt-2 text-sm text-vps-ivory/60">Thu {formatCurrency(financeStats.income)} • Chi {formatCurrency(financeStats.expense)}</p>
                    </div>

                    <div className="rounded-2xl border border-vps-gray/30 bg-[#141414] p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-vps-ivory/60">Hoàn thành task</p>
                            <StatusBadge label={`${completionRate}%`} variant="info" />
                        </div>
                        <p className="mt-4 text-3xl font-semibold text-vps-ivory">{completionRate}%</p>
                        <p className="mt-2 text-sm text-vps-ivory/60">Tỷ lệ hoàn tất trên tổng task hiện có.</p>
                    </div>
                </div>
            )}

            {!loading && recentActivities.length === 0 ? (
                <div className="mt-6">
                    <EmptyState title="Chưa có hoạt động gần đây" description="Khi dữ liệu task hoặc finance xuất hiện, chúng sẽ hiển thị ở đây để theo dõi vận hành." />
                </div>
            ) : null}

            {!loading && recentActivities.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-vps-gray/30 bg-[#141414] p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-vps-ivory">Hoạt động gần đây</h2>
                        <StatusBadge label="Realtime" variant="success" />
                    </div>
                    <div className="space-y-3">
                        {recentActivities.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#111111] px-4 py-3">
                                <div>
                                    <p className="font-medium text-vps-ivory">{item.title}</p>
                                    <p className="text-sm text-vps-ivory/60">{item.source} • {item.status}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-vps-gold">{formatCurrency(item.amount)}</p>
                                    <p className="text-xs text-vps-ivory/45">{item.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </AppShell>
    );
};

export default Dashboard;