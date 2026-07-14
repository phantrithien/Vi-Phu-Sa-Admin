import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, FileText, Plus, ReceiptText, Wallet } from 'lucide-react';

import AppShell from '../../components/AppShell';
import LoadingState from '../../components/ui/LoadingState';
import { useToast } from '../../components/ui/ToastProvider';
import { listProjects } from '../../services/projectService';
import {
    EXPENSE_CATEGORIES,
    INVOICE_STATUSES,
    calculateFinanceSummary,
    createExpense,
    deleteExpense,
    createInvoice,
    listExpenses,
    listInvoices,
    updateExpense,
    updateInvoice,
} from '../../services/financeService';

const currency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const Accounting = () => {
    const { pushToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('all');

    const [expenses, setExpenses] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [editingInvoiceId, setEditingInvoiceId] = useState(null);

    const [expenseForm, setExpenseForm] = useState({
        title: '',
        category: EXPENSE_CATEGORIES.PRODUCTION,
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
        projectId: '',
    });

    const [invoiceForm, setInvoiceForm] = useState({
        code: '',
        customer: '',
        amount: '',
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        status: INVOICE_STATUSES.DRAFT,
        notes: '',
        projectId: '',
    });

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const projectRows = await listProjects();
            setProjects(projectRows);

            const projectId = selectedProjectId === 'all' ? '' : selectedProjectId;
            const [expenseRows, invoiceRows] = await Promise.all([
                listExpenses({ projectId }),
                listInvoices({ projectId }),
            ]);

            setExpenses(expenseRows);
            setInvoices(invoiceRows);
        } catch (err) {
            setError(err.message || 'Không thể tải dữ liệu tài chính.');
            pushToast(err.message || 'Không thể tải dữ liệu tài chính.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedProjectId]);

    const summary = useMemo(() => calculateFinanceSummary({ expenses, invoices }), [expenses, invoices]);

    const projectName = (projectId) => projects.find((item) => item.id === projectId)?.title || projectId || 'N/A';

    const openExpenseModal = (row = null) => {
        if (row) {
            setEditingExpenseId(row.id);
            setExpenseForm({
                title: row.title || '',
                category: row.category || EXPENSE_CATEGORIES.PRODUCTION,
                amount: String(row.amount || ''),
                date: row.date || new Date().toISOString().slice(0, 10),
                notes: row.notes || '',
                projectId: row.projectId || '',
            });
        } else {
            setEditingExpenseId(null);
            setExpenseForm({
                title: '',
                category: EXPENSE_CATEGORIES.PRODUCTION,
                amount: '',
                date: new Date().toISOString().slice(0, 10),
                notes: '',
                projectId: selectedProjectId === 'all' ? '' : selectedProjectId,
            });
        }
        setExpenseModalOpen(true);
    };

    const openInvoiceModal = (row = null) => {
        if (row) {
            setEditingInvoiceId(row.id);
            setInvoiceForm({
                code: row.code || '',
                customer: row.customer || '',
                amount: String(row.amount || ''),
                issueDate: row.issueDate || new Date().toISOString().slice(0, 10),
                dueDate: row.dueDate || '',
                status: row.status || INVOICE_STATUSES.DRAFT,
                notes: row.notes || '',
                projectId: row.projectId || '',
            });
        } else {
            setEditingInvoiceId(null);
            setInvoiceForm({
                code: '',
                customer: '',
                amount: '',
                issueDate: new Date().toISOString().slice(0, 10),
                dueDate: '',
                status: INVOICE_STATUSES.DRAFT,
                notes: '',
                projectId: selectedProjectId === 'all' ? '' : selectedProjectId,
            });
        }
        setInvoiceModalOpen(true);
    };

    const submitExpense = async (event) => {
        event.preventDefault();

        try {
            const payload = {
                ...expenseForm,
                title: expenseForm.title.trim(),
                amount: Number(expenseForm.amount),
                notes: expenseForm.notes.trim(),
            };

            if (editingExpenseId) {
                await updateExpense(editingExpenseId, payload);
                pushToast('Cap nhat expense thanh cong.', 'success');
            } else {
                await createExpense(payload);
                pushToast('Tao expense thanh cong.', 'success');
            }

            setExpenseModalOpen(false);
            await loadData();
        } catch (err) {
            setError(err.message || 'Không thể lưu expense.');
            pushToast(err.message || 'Không thể lưu expense.', 'error');
        }
    };

    const submitInvoice = async (event) => {
        event.preventDefault();

        try {
            const payload = {
                ...invoiceForm,
                code: invoiceForm.code.trim(),
                customer: invoiceForm.customer.trim(),
                amount: Number(invoiceForm.amount),
                notes: invoiceForm.notes.trim(),
            };

            if (editingInvoiceId) {
                await updateInvoice(editingInvoiceId, payload);
                pushToast('Cap nhat invoice thanh cong.', 'success');
            } else {
                await createInvoice(payload);
                pushToast('Tao invoice thanh cong.', 'success');
            }

            setInvoiceModalOpen(false);
            await loadData();
        } catch (err) {
            setError(err.message || 'Không thể lưu invoice.');
            pushToast(err.message || 'Không thể lưu invoice.', 'error');
        }
    };

    const removeExpense = async (row) => {
        if (!window.confirm(`Ban chac chan muon xoa expense "${row.title}"?`)) {
            return;
        }

        try {
            await deleteExpense(row.id);
            await loadData();
            pushToast('Da xoa expense thanh cong.', 'success');
        } catch (err) {
            setError(err.message || 'Khong the xoa expense.');
            pushToast(err.message || 'Khong the xoa expense.', 'error');
        }
    };

    return (
        <AppShell title="Finance" subtitle="Theo dõi expense, invoice và lợi nhuận theo dự án">
            <div className="space-y-6">
                <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                    <label className="mb-2 block text-sm text-vps-ivory/70">Lọc theo project</label>
                    <select
                        value={selectedProjectId}
                        onChange={(event) => setSelectedProjectId(event.target.value)}
                        className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory outline-none focus:border-vps-gold"
                    >
                        <option value="all">Tất cả project</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>{project.title}</option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Revenue</p>
                        <div className="mt-2 flex items-center gap-2 text-emerald-400"><ArrowUpRight className="h-4 w-4" />{currency(summary.revenue)}</div>
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Cost</p>
                        <div className="mt-2 flex items-center gap-2 text-rose-400"><ArrowDownLeft className="h-4 w-4" />{currency(summary.cost)}</div>
                    </div>
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <p className="text-sm text-vps-ivory/60">Profit</p>
                        <div className="mt-2 flex items-center gap-2 text-vps-gold"><Wallet className="h-4 w-4" />{currency(summary.profit)}</div>
                        <p className="mt-1 text-xs text-vps-ivory/50">Margin: {summary.profitMargin}%</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setActiveTab('overview')} className={`rounded-full px-4 py-2 text-sm ${activeTab === 'overview' ? 'bg-vps-gold text-vps-black' : 'bg-[#181818] text-vps-ivory/70 border border-vps-gray/20'}`}>Overview</button>
                    <button onClick={() => setActiveTab('expenses')} className={`rounded-full px-4 py-2 text-sm ${activeTab === 'expenses' ? 'bg-vps-gold text-vps-black' : 'bg-[#181818] text-vps-ivory/70 border border-vps-gray/20'}`}>Expenses</button>
                    <button onClick={() => setActiveTab('invoices')} className={`rounded-full px-4 py-2 text-sm ${activeTab === 'invoices' ? 'bg-vps-gold text-vps-black' : 'bg-[#181818] text-vps-ivory/70 border border-vps-gray/20'}`}>Invoices</button>
                </div>

                {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}

                {loading ? (
                    <LoadingState title="Đang tải dữ liệu tài chính" description="Đang đồng bộ Firestore." />
                ) : activeTab === 'overview' ? (
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                        <h3 className="text-lg font-semibold text-vps-ivory">Finance Dashboard</h3>
                        <p className="mt-1 text-sm text-vps-ivory/60">Tổng quan doanh thu, chi phí và lợi nhuận theo bộ lọc hiện tại.</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-xl border border-vps-gray/20 bg-[#111111] p-3">
                                <p className="text-xs text-vps-ivory/60 uppercase tracking-wider">Invoices</p>
                                <p className="mt-1 text-xl font-semibold text-emerald-400">{invoices.length}</p>
                            </div>
                            <div className="rounded-xl border border-vps-gray/20 bg-[#111111] p-3">
                                <p className="text-xs text-vps-ivory/60 uppercase tracking-wider">Expenses</p>
                                <p className="mt-1 text-xl font-semibold text-rose-400">{expenses.length}</p>
                            </div>
                            <div className="rounded-xl border border-vps-gray/20 bg-[#111111] p-3">
                                <p className="text-xs text-vps-ivory/60 uppercase tracking-wider">Projects</p>
                                <p className="mt-1 text-xl font-semibold text-vps-gold">{selectedProjectId === 'all' ? projects.length : 1}</p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'expenses' ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={() => openExpenseModal()} className="inline-flex items-center gap-2 rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black"><Plus className="h-4 w-4" />Thêm expense</button>
                        </div>

                        {expenses.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-vps-gray/20 p-4 text-sm text-vps-ivory/60">Chưa có expense.</div>
                        ) : (
                            expenses.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-vps-gold"><FileText className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.3em]">{item.category}</span></div>
                                            <h3 className="mt-2 text-lg font-semibold text-vps-ivory">{item.title}</h3>
                                            <p className="mt-1 text-sm text-vps-ivory/60">Project: {projectName(item.projectId)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-vps-ivory/60">{item.date}</p>
                                            <p className="mt-1 text-lg font-semibold text-rose-400">{currency(item.amount)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <div className="flex gap-2">
                                            <button onClick={() => openExpenseModal(item)} className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-xs text-vps-ivory">Chỉnh sửa</button>
                                            <button onClick={() => removeExpense(item)} className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">Xóa</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={() => openInvoiceModal()} className="inline-flex items-center gap-2 rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black"><Plus className="h-4 w-4" />Thêm invoice</button>
                        </div>

                        {invoices.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-vps-gray/20 p-4 text-sm text-vps-ivory/60">Chưa có invoice.</div>
                        ) : (
                            invoices.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-vps-gray/20 bg-[#181818] p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-vps-gold"><ReceiptText className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.3em]">{item.code}</span></div>
                                            <h3 className="mt-2 text-lg font-semibold text-vps-ivory">{item.customer || 'Khách hàng'}</h3>
                                            <p className="mt-1 text-sm text-vps-ivory/60">Project: {projectName(item.projectId)} • Trạng thái: {item.status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-vps-ivory/60">Issue: {item.issueDate}</p>
                                            <p className="mt-1 text-lg font-semibold text-emerald-400">{currency(item.amount)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button onClick={() => openInvoiceModal(item)} className="rounded-lg border border-vps-gray/20 bg-[#111111] px-3 py-2 text-xs text-vps-ivory">Chỉnh sửa</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {expenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                    <div className="w-full max-w-2xl rounded-3xl border border-vps-gray/20 bg-[#151515] p-6">
                        <h3 className="text-xl font-semibold text-vps-ivory">{editingExpenseId ? 'Cập nhật expense' : 'Thêm expense'}</h3>
                        <form onSubmit={submitExpense} className="mt-5 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <input value={expenseForm.title} onChange={(event) => setExpenseForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tên chi phí" className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" required />
                                <input type="number" min="0" value={expenseForm.amount} onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Số tiền" className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" required />
                                <select value={expenseForm.category} onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))} className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory">
                                    {Object.values(EXPENSE_CATEGORIES).map((item) => (<option key={item} value={item}>{item}</option>))}
                                </select>
                                <input type="date" value={expenseForm.date} onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))} className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" required />
                                <select value={expenseForm.projectId} onChange={(event) => setExpenseForm((current) => ({ ...current, projectId: event.target.value }))} className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" required>
                                    <option value="">Chọn project</option>
                                    {projects.map((project) => (<option key={project.id} value={project.id}>{project.title}</option>))}
                                </select>
                            </div>
                            <textarea rows="3" value={expenseForm.notes} onChange={(event) => setExpenseForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Ghi chú" className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setExpenseModalOpen(false)} className="rounded-xl border border-vps-gray/20 px-4 py-2.5 text-sm text-vps-ivory">Hủy</button>
                                <button type="submit" className="rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {invoiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                    <div className="w-full max-w-2xl rounded-3xl border border-vps-gray/20 bg-[#151515] p-6">
                        <h3 className="text-xl font-semibold text-vps-ivory">{editingInvoiceId ? 'Cập nhật invoice' : 'Thêm invoice'}</h3>
                        <form onSubmit={submitInvoice} className="mt-5 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <input value={invoiceForm.code} onChange={(event) => setInvoiceForm((current) => ({ ...current, code: event.target.value }))} placeholder="Mã invoice" className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" required />
                                <input value={invoiceForm.customer} onChange={(event) => setInvoiceForm((current) => ({ ...current, customer: event.target.value }))} placeholder="Khách hàng" className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" />
                                <input type="number" min="0" value={invoiceForm.amount} onChange={(event) => setInvoiceForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Doanh thu" className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" required />
                                <select value={invoiceForm.status} onChange={(event) => setInvoiceForm((current) => ({ ...current, status: event.target.value }))} className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory">
                                    {Object.values(INVOICE_STATUSES).map((item) => (<option key={item} value={item}>{item}</option>))}
                                </select>
                                <input type="date" value={invoiceForm.issueDate} onChange={(event) => setInvoiceForm((current) => ({ ...current, issueDate: event.target.value }))} className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" required />
                                <input type="date" value={invoiceForm.dueDate} onChange={(event) => setInvoiceForm((current) => ({ ...current, dueDate: event.target.value }))} className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" />
                                <select value={invoiceForm.projectId} onChange={(event) => setInvoiceForm((current) => ({ ...current, projectId: event.target.value }))} className="rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" required>
                                    <option value="">Chọn project</option>
                                    {projects.map((project) => (<option key={project.id} value={project.id}>{project.title}</option>))}
                                </select>
                            </div>
                            <textarea rows="3" value={invoiceForm.notes} onChange={(event) => setInvoiceForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Ghi chú" className="w-full rounded-xl border border-vps-gray/20 bg-[#111111] px-3 py-2.5 text-sm text-vps-ivory" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setInvoiceModalOpen(false)} className="rounded-xl border border-vps-gray/20 px-4 py-2.5 text-sm text-vps-ivory">Hủy</button>
                                <button type="submit" className="rounded-xl bg-vps-gold px-4 py-2.5 text-sm font-semibold text-vps-black">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default Accounting;
